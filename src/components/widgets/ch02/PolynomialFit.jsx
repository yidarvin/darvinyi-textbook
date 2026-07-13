import { useEffect, useRef, useState, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  accent:  '#2dd4bf',
  math:    '#fbbf24',
  green:   '#34d399',
  red:     '#f87171',
  orange:  '#fb923c',
  border:  '#242424',
  borderLt:'#2e2e2e',
  codeBg:  '#0a0a0a',
  bg2:     '#111111',
  textMid: '#888888',
  textMuted:'#555555',
  text:    '#e8eaed',
};

// ─── mulberry32 PRNG ──────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ─── Generate dataset (fixed seed) ───────────────────────────────────────────
function generateData(n, sigma, seed = 42) {
  const rand = mulberry32(seed);
  const points = [];
  for (let i = 0; i < n; i++) {
    const x = rand();
    // True function: sin(2πx) * 0.5 + 0.5
    const y = Math.sin(2 * Math.PI * x) * 0.5 + 0.5 + (rand() - 0.5) * 2 * sigma;
    points.push({ x, y });
  }
  return points;
}

// ─── Split data (first trainFrac% is train, rest is val) ─────────────────────
function splitData(points, trainFrac) {
  // Use a deterministic split: sort by index, first trainFrac are train
  const n = points.length;
  const nTrain = Math.round(n * trainFrac);
  // Assign train/val by a fixed pattern so sigma changes don't reshuffle split
  const train = points.slice(0, nTrain);
  const val   = points.slice(nTrain);
  return { train, val };
}

// ─── Map raw x in [0,1) to a centered range ──────────────────────────────────
// Fitting is done in t = 2x - 1 ∈ [-1,1) rather than raw x, and with a
// Chebyshev (orthogonal-ish) polynomial basis instead of raw monomials x^d.
// Raw monomials on x ∈ [0,1] are catastrophically ill-conditioned once
// degree passes ~10 (they become numerically near-collinear), which makes
// the VᵀV normal-equation solve lose precision and train MSE plateau well
// above zero. Chebyshev polynomials stay well-conditioned to degree 20+.
function toCentered(x) {
  return 2 * x - 1;
}

// ─── Build Chebyshev (first-kind) design matrix ──────────────────────────────
function chebyshevRow(t, degree) {
  const row = new Array(degree + 1);
  row[0] = 1;
  if (degree >= 1) row[1] = t;
  for (let d = 2; d <= degree; d++) row[d] = 2 * t * row[d - 1] - row[d - 2];
  return row;
}

function designMatrix(xs, degree) {
  return xs.map(x => chebyshevRow(toCentered(x), degree));
}

// ─── Gaussian elimination to solve Ax = b ────────────────────────────────────
function gaussElim(A, b) {
  const n = b.length;
  // Augmented matrix [A|b]
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    if (Math.abs(M[col][col]) < 1e-14) continue; // singular column

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) {
        M[row][k] -= factor * M[col][k];
      }
    }
  }

  return M.map((row, i) =>
    Math.abs(M[i][i]) < 1e-14 ? 0 : row[n] / M[i][i]
  );
}

// ─── Least-squares via normal equations: (VᵀV)c = Vᵀy ────────────────────────
function fitPolynomial(xs, ys, degree) {
  const V = designMatrix(xs, degree);
  const n = degree + 1;

  // VᵀV
  const VtV = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < V.length; k++)
        VtV[i][j] += V[k][i] * V[k][j];

  // Vᵀy
  const Vty = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < V.length; k++)
      Vty[i] += V[k][i] * ys[k];

  return gaussElim(VtV, Vty);
}

// ─── Evaluate polynomial (Chebyshev basis on centered x) ─────────────────────
function polyEval(coeffs, x) {
  const row = chebyshevRow(toCentered(x), coeffs.length - 1);
  let y = 0;
  for (let d = 0; d < coeffs.length; d++) y += coeffs[d] * row[d];
  return y;
}

// ─── MSE ──────────────────────────────────────────────────────────────────────
function mse(points, coeffs) {
  if (!points.length || !coeffs) return 0;
  const sum = points.reduce((acc, p) => {
    const diff = polyEval(coeffs, p.x) - p.y;
    return acc + diff * diff;
  }, 0);
  return sum / points.length;
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────
function drawWidget(canvas, trainPts, valPts, coeffs, showVal) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Padding
  const PAD = { top: 16, right: 16, bottom: 36, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  // Y range: auto-scale based on data + curve
  const allPts = [...trainPts, ...valPts];
  const allY = allPts.map(p => p.y);

  // Sample curve for y range
  const curveSamples = 80;
  const curveYs = [];
  if (coeffs) {
    for (let i = 0; i <= curveSamples; i++) {
      const x = i / curveSamples;
      const y = polyEval(coeffs, x);
      if (isFinite(y)) curveYs.push(y);
    }
  }

  const allYforScale = [...allY, ...curveYs];
  let yMin = Math.min(...allYforScale);
  let yMax = Math.max(...allYforScale);
  // Clamp wild polynomial extrapolation
  const dataYRange = Math.max(...allY) - Math.min(...allY);
  const margin = dataYRange * 0.5 + 0.3;
  const dataCenter = (Math.max(...allY) + Math.min(...allY)) / 2;
  yMin = Math.max(yMin, dataCenter - dataYRange - margin);
  yMax = Math.min(yMax, dataCenter + dataYRange + margin);
  const yRange = yMax - yMin || 1;

  const toX = x => PAD.left + x * plotW;
  const toY = y => PAD.top + (1 - (y - yMin) / yRange) * plotH;

  // ── Background
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  // ── Grid lines
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  // Horizontal grid
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const y = yMin + (i / yTicks) * yRange;
    const cy = toY(y);
    ctx.beginPath();
    ctx.moveTo(PAD.left, cy);
    ctx.lineTo(PAD.left + plotW, cy);
    ctx.stroke();
    // Y label
    ctx.fillStyle = C.textMuted;
    ctx.font = `10px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(y.toFixed(1), PAD.left - 6, cy + 3.5);
  }
  // Vertical grid
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const x = i / xTicks;
    const cx = toX(x);
    ctx.beginPath();
    ctx.moveTo(cx, PAD.top);
    ctx.lineTo(cx, PAD.top + plotH);
    ctx.stroke();
    // X label
    ctx.fillStyle = C.textMuted;
    ctx.font = `10px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(x.toFixed(1), cx, PAD.top + plotH + 16);
  }

  // ── Axes
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
  ctx.stroke();

  // ── Fitted curve
  if (coeffs) {
    ctx.beginPath();
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2;
    let first = true;
    for (let i = 0; i <= curveSamples; i++) {
      const x = i / curveSamples;
      const y = polyEval(coeffs, x);
      const cy = toY(y);
      if (!isFinite(cy) || cy < PAD.top - 200 || cy > PAD.top + plotH + 200) {
        first = true;
        continue;
      }
      if (first) { ctx.moveTo(toX(x), cy); first = false; }
      else ctx.lineTo(toX(x), cy);
    }
    ctx.stroke();
  }

  // ── Validation points (open circles) — drawn first so train is on top
  if (showVal) {
    valPts.forEach(p => {
      const cx = toX(p.x);
      const cy = toY(p.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // ── Train points (filled circles)
  trainPts.forEach(p => {
    const cx = toX(p.x);
    const cy = toY(p.y);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = C.accent;
    ctx.fill();
  });

  // ── Legend
  const legendX = PAD.left + plotW - 120;
  const legendY = PAD.top + 8;
  ctx.font = `10px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'left';

  // Train
  ctx.beginPath();
  ctx.arc(legendX + 5, legendY + 5, 4, 0, Math.PI * 2);
  ctx.fillStyle = C.accent;
  ctx.fill();
  ctx.fillStyle = C.textMid;
  ctx.fillText('train', legendX + 14, legendY + 9);

  if (showVal) {
    // Val
    ctx.beginPath();
    ctx.arc(legendX + 5, legendY + 20, 4, 0, Math.PI * 2);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = C.textMid;
    ctx.fillText('val', legendX + 14, legendY + 24);
  }
}

// ─── Slider component ─────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: C.textMuted,
        minWidth: '60px',
        flexShrink: 0,
      }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1,
          WebkitAppearance: 'none',
          height: '2px',
          background: C.borderLt,
          borderRadius: '2px',
          cursor: 'pointer',
          accentColor: C.accent,
          outline: 'none',
        }}
      />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: C.accent,
        minWidth: '40px',
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {format ? format(value) : value}
      </span>
    </div>
  );
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value, color }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9.5px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: C.textMuted,
        marginBottom: '2px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '18px',
        color: color || C.accent,
        lineHeight: 1.2,
      }}>
        {value}
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function PolynomialFit({ tryThis }) {
  const N_POINTS   = 20;
  const TRAIN_FRAC = 0.8; // fixed 80/20 split

  const [degree,  setDegree]  = useState(3);
  const [sigma,   setSigma]   = useState(0.15);
  const [showVal, setShowVal] = useState(true);

  const canvasRef = useRef(null);

  // Generate all points from the current sigma (fixed seed per sigma to keep
  // point positions stable — the seed encodes the sigma level as an integer
  // bucket so dragging sigma smoothly shifts noise but keeps structure)
  const points = generateData(N_POINTS, sigma, 42);
  const { train, val } = splitData(points, TRAIN_FRAC);

  // Fit polynomial
  const trainXs = train.map(p => p.x);
  const trainYs = train.map(p => p.y);

  let coeffs = null;
  try {
    coeffs = fitPolynomial(trainXs, trainYs, degree);
  } catch (_) {
    coeffs = null;
  }

  const trainMSE = mse(train, coeffs);
  const valMSE   = mse(val,   coeffs);
  const nParams  = degree + 1;

  // Status
  let status = 'good fit';
  let statusColor = C.green;
  if (trainMSE > 0.05 && degree <= 2) {
    status = 'underfit';
    statusColor = C.orange;
  } else if (valMSE > 2 * trainMSE + 0.01 && degree >= 9) {
    status = 'overfit';
    statusColor = C.red;
  } else if (trainMSE < 0.005 && valMSE > 0.05) {
    status = 'overfit';
    statusColor = C.red;
  }

  // Train MSE color
  const trainColor = trainMSE < 0.02 ? C.green : trainMSE > 0.5 ? C.red : C.accent;

  // Val MSE color: compare ratio to train MSE
  let valColor = C.accent;
  if (coeffs) {
    const ratio = trainMSE > 1e-9 ? valMSE / trainMSE : 1;
    valColor = ratio > 3 ? C.red : ratio < 1.5 ? C.green : C.accent;
  }

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawWidget(canvas, train, val, coeffs, showVal);
  }, [train, val, coeffs, showVal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on resize
  useEffect(() => {
    const ro = new ResizeObserver(draw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <WidgetCard title="Polynomial Fit" number="2.1" tryThis={tryThis}>
      {/* Main layout: canvas + stat panel */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            flex: 1,
            height: '220px',
            display: 'block',
            borderRadius: '6px',
            border: `1px solid ${C.border}`,
          }}
        />

        {/* Stat panel */}
        <div style={{
          width: '140px',
          flexShrink: 0,
          background: C.bg2,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '14px 16px',
        }}>
          <StatRow
            label="Train MSE"
            value={trainMSE < 0.0001 ? trainMSE.toExponential(1) : trainMSE.toFixed(4)}
            color={trainColor}
          />
          <StatRow
            label="Val MSE"
            value={valMSE < 0.0001 ? valMSE.toExponential(1) : valMSE.toFixed(4)}
            color={valColor}
          />
          <StatRow
            label="Parameters"
            value={nParams}
            color={C.accent}
          />
          <div style={{ marginBottom: 0 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9.5px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.textMuted,
              marginBottom: '2px',
            }}>
              Status
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              color: statusColor,
              lineHeight: 1.2,
            }}>
              {status}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        marginTop: '16px',
        borderTop: `1px solid ${C.border}`,
        paddingTop: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <Slider
          label="degree"
          value={degree}
          min={1}
          max={20}
          step={1}
          onChange={setDegree}
          format={v => v}
        />
        <Slider
          label="noise σ"
          value={sigma}
          min={0}
          max={0.5}
          step={0.01}
          onChange={setSigma}
          format={v => v.toFixed(2)}
        />

        {/* Show val split toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: C.textMuted,
            minWidth: '60px',
            flexShrink: 0,
          }}>
            show val
          </span>
          <button
            onClick={() => setShowVal(v => !v)}
            style={{
              background: showVal ? 'var(--accent-dim, #0b2422)' : 'transparent',
              border: `1px solid ${showVal ? C.accent : C.borderLt}`,
              borderRadius: '4px',
              color: showVal ? C.accent : C.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '3px 10px',
              cursor: 'pointer',
            }}
          >
            {showVal ? 'on' : 'off'}
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}
