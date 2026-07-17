import { useEffect, useRef, useState, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  codeBg:    '#0a0a0a',
  bg2:       '#111111',
  textMid:   '#888888',
  textMuted: '#555555',
  text:      '#e8eaed',
};

// Fixed-point below 1000, scientific notation above — the real Monte Carlo
// estimate can reach 1e10+ at high degree (Runge's-phenomenon blowup on a
// sparse polynomial fit), where a fixed-decimal readout is unreadable.
function fmtVal(v) {
  if (!isFinite(v)) return '—';
  if (v === 0) return '0.000';
  if (Math.abs(v) < 1000) return v.toFixed(3);
  return v.toExponential(2);
}

// ─── Math: real Monte Carlo bias-variance-noise decomposition ────────────────
// d: polynomial degree 1..20, noiseLevel: 0.1..1.0. Rather than authored
// closed-form curves, this resamples independent noisy training sets, fits a
// real least-squares polynomial to each (same Chebyshev-basis machinery as
// PolynomialFit.jsx), and computes bias²/variance from the resulting
// distribution of fitted functions — the textbook definition, not an
// approximation of its shape.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const TRUE_FN = x => Math.sin(2 * Math.PI * x) * 0.5 + 0.5;
function generateTrainingSet(n, sigma, seed) {
  const rand = mulberry32(seed);
  const points = [];
  for (let i = 0; i < n; i++) {
    const x = rand();
    const y = TRUE_FN(x) + (rand() - 0.5) * 2 * sigma;
    points.push({ x, y });
  }
  return points;
}
function toCentered(x) { return 2 * x - 1; }
function chebyshevRow(t, degree) {
  const row = new Array(degree + 1);
  row[0] = 1;
  if (degree >= 1) row[1] = t;
  for (let d = 2; d <= degree; d++) row[d] = 2 * t * row[d - 1] - row[d - 2];
  return row;
}
function gaussElim(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    if (Math.abs(M[col][col]) < 1e-14) continue; // singular column
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) M[row][k] -= factor * M[col][k];
    }
  }
  return M.map((row, i) => Math.abs(M[i][i]) < 1e-14 ? 0 : row[n] / M[i][i]);
}
function fitPolynomial(xs, ys, degree) {
  const V = xs.map(x => chebyshevRow(toCentered(x), degree));
  const n = degree + 1;
  const VtV = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < V.length; k++) VtV[i][j] += V[k][i] * V[k][j];
  const Vty = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let k = 0; k < V.length; k++) Vty[i] += V[k][i] * ys[k];
  return gaussElim(VtV, Vty);
}
function polyEval(coeffs, x) {
  const row = chebyshevRow(toCentered(x), coeffs.length - 1);
  let y = 0;
  for (let d = 0; d < coeffs.length; d++) y += coeffs[d] * row[d];
  return y;
}

const N_TRAIN = 20;   // matches PolynomialFit.jsx's training-set size
const N_REPEATS = 40; // independent resamples per (degree, noise) estimate
const N_EVAL = 25;    // points across [0,1] the bias/variance is averaged over
const EVAL_XS = Array.from({ length: N_EVAL }, (_, i) => i / (N_EVAL - 1));

// Memoize per (degree, noiseLevel) — the slider drags through the same pairs
// repeatedly, and re-fitting 40 polynomials on every render is wasted work.
const bvCache = new Map();
function computeBiasVarianceNoise(d, noiseLevel) {
  const key = `${d}|${noiseLevel.toFixed(2)}`;
  if (bvCache.has(key)) return bvCache.get(key);

  const preds = EVAL_XS.map(() => []);
  for (let b = 0; b < N_REPEATS; b++) {
    const data = generateTrainingSet(N_TRAIN, noiseLevel, 1000 + b);
    const coeffs = fitPolynomial(data.map(p => p.x), data.map(p => p.y), d);
    EVAL_XS.forEach((x, j) => preds[j].push(polyEval(coeffs, x)));
  }
  let bias2Sum = 0, varSum = 0;
  EVAL_XS.forEach((x, j) => {
    const mean = preds[j].reduce((a, v) => a + v, 0) / N_REPEATS;
    bias2Sum += (mean - TRUE_FN(x)) ** 2;
    varSum += preds[j].reduce((a, p) => a + (p - mean) ** 2, 0) / N_REPEATS;
  });
  const bias2 = bias2Sum / N_EVAL;
  const variance = varSum / N_EVAL;
  // Irreducible error: the data-generating noise is U(-sigma,sigma), whose
  // variance is (2*sigma)^2/12 = sigma^2/3 — a closed form, not a guess.
  const noise = (noiseLevel * noiseLevel) / 3;
  const result = { bias2, variance, noise, total: bias2 + variance + noise };
  bvCache.set(key, result);
  return result;
}

function getBias2(d, noiseLevel) { return computeBiasVarianceNoise(d, noiseLevel).bias2; }
function getVariance(d, noiseLevel) { return computeBiasVarianceNoise(d, noiseLevel).variance; }
function getNoise(noiseLevel) { return (noiseLevel * noiseLevel) / 3; }
function getTotalError(d, noiseLevel) { return computeBiasVarianceNoise(d, noiseLevel).total; }

// Build arrays over complexity 1..20
function buildCurves(noiseLevel) {
  const degrees = Array.from({ length: 20 }, (_, i) => i + 1);
  return degrees.map(d => {
    const r = computeBiasVarianceNoise(d, noiseLevel);
    return { d, noise: r.noise, bias2: r.bias2, variance: r.variance, total: r.total };
  });
}

function findOptimalComplexity(noiseLevel) {
  const curves = buildCurves(noiseLevel);
  let minTotal = Infinity;
  let optD = 1;
  curves.forEach(({ d, total }) => {
    if (total < minTotal) { minTotal = total; optD = d; }
  });
  return optD;
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────
function drawChart(canvas, complexity, noiseLevel) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const PAD = { top: 16, right: 20, bottom: 36, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  const curves = buildCurves(noiseLevel);
  const optD   = findOptimalComplexity(noiseLevel);

  // Log-scale y-axis: real bias²/variance from the Monte Carlo estimate
  // spans many orders of magnitude at high degree (Runge's-phenomenon
  // blowup when fitting a degree-15+ polynomial to 20 sparse noisy
  // points) — a linear axis or stacked area can't represent that
  // honestly, so this plots three lines (noise, bias², variance) plus
  // the dashed total on a shared log axis, floored at EPS to avoid
  // log(0).
  const EPS = 1e-4;
  const maxVal = Math.max(...curves.map(c => c.total), EPS) * 1.3;
  const logMin = Math.log10(EPS);
  const logMax = Math.log10(maxVal);
  const logRange = logMax - logMin || 1;

  // Map degree 1..20 to x pixels
  const toX = d => PAD.left + ((d - 1) / 19) * plotW;
  const toY = v => PAD.top + (1 - (Math.log10(Math.max(v, EPS)) - logMin) / logRange) * plotH;

  // ── Background
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  // ── Grid lines — a fixed number of evenly-spaced log decades, not one per
  // decade (the real dynamic range can span 15+ orders of magnitude once
  // high-degree blowup enters the picture, which would otherwise crowd the
  // axis with gridlines).
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  const N_GRID = 5;
  const gridDecades = Array.from({ length: N_GRID + 1 }, (_, i) =>
    Math.round(logMin + (i / N_GRID) * logRange));
  const seenDecades = new Set();
  gridDecades.forEach(dec => {
    if (seenDecades.has(dec)) return;
    seenDecades.add(dec);
    const v = 10 ** dec;
    const cy = toY(v);
    ctx.beginPath();
    ctx.moveTo(PAD.left, cy);
    ctx.lineTo(PAD.left + plotW, cy);
    ctx.stroke();
    ctx.fillStyle = C.textMuted;
    ctx.font = `9px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`1e${dec}`, PAD.left - 6, cy + 3.5);
  });
  const xTicks = [1, 4, 8, 12, 16, 20];
  xTicks.forEach(d => {
    const cx = toX(d);
    ctx.beginPath();
    ctx.strokeStyle = C.border;
    ctx.moveTo(cx, PAD.top);
    ctx.lineTo(cx, PAD.top + plotH);
    ctx.stroke();
    ctx.fillStyle = C.textMuted;
    ctx.font = `10px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(d, cx, PAD.top + plotH + 16);
  });

  // ── Axes
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
  ctx.stroke();

  // ─ Helper: draw one curve as a line
  function drawLine(vals, color, width, dash) {
    ctx.beginPath();
    vals.forEach((v, i) => {
      const cx = toX(i + 1);
      const cy = toY(v);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Noise (constant — the closed-form irreducible-error floor)
  drawLine(curves.map(c => c.noise), 'rgba(45,212,191,0.7)', 1.5);
  // ── Bias² (typically falls as degree grows)
  drawLine(curves.map(c => c.bias2), 'rgba(99,102,241,0.85)', 1.5);
  // ── Variance (typically rises, then explodes at high degree)
  drawLine(curves.map(c => c.variance), 'rgba(167,139,250,0.85)', 1.5);

  // ── Dashed total error line
  ctx.beginPath();
  curves.forEach((c, i) => {
    const cx = toX(c.d);
    const cy = toY(c.total);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.strokeStyle = C.math;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Optimal complexity star
  const optCurve = curves[optD - 1];
  const starX = toX(optD);
  const starY = toY(optCurve.total);
  drawStar(ctx, starX, starY, 6, 3, 5, C.math);

  // ── Vertical highlight line (current complexity)
  const hlX = toX(complexity);
  ctx.beginPath();
  ctx.moveTo(hlX, PAD.top);
  ctx.lineTo(hlX, PAD.top + plotH);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Small circle on total error line at current complexity
  const curCurve = curves[complexity - 1];
  ctx.beginPath();
  ctx.arc(hlX, toY(curCurve.total), 4, 0, Math.PI * 2);
  ctx.fillStyle = C.accent;
  ctx.fill();

  // ── Axis labels
  ctx.fillStyle = C.textMuted;
  ctx.font = `10px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('model complexity', PAD.left + plotW / 2, H - 2);

  // ── Legend (top-right corner)
  const lx = PAD.left + plotW - 8;
  const ly = PAD.top + 8;
  const legendItems = [
    { label: 'noise',     color: 'rgba(45,212,191,0.4)' },
    { label: 'bias²',     color: 'rgba(99,102,241,0.6)' },
    { label: 'variance',  color: 'rgba(167,139,250,0.6)' },
    { label: 'total err', color: C.math },
  ];
  ctx.font = `9px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'right';
  legendItems.forEach((item, i) => {
    const iy = ly + i * 16;
    ctx.fillStyle = item.color;
    ctx.fillRect(lx - 20, iy, 12, 9);
    ctx.fillStyle = C.textMuted;
    ctx.fillText(item.label, lx - 26, iy + 8);
  });
}

// ─── Draw a 5-pointed star ────────────────────────────────────────────────────
function drawStar(ctx, cx, cy, outerR, innerR, points, color) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ─── Slider component ─────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: C.textMuted,
        minWidth: '78px',
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
        minWidth: '36px',
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {format ? format(value) : value}
      </span>
    </div>
  );
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value, color, sub }) {
  return (
    <div style={{ marginBottom: '14px' }}>
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
      {sub && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: C.textMuted,
          marginTop: '2px',
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function BiasVariance({ tryThis }) {
  const [complexity,  setComplexity]  = useState(5);
  const [noiseLevel,  setNoiseLevel]  = useState(0.4);

  const canvasRef = useRef(null);

  const optD      = findOptimalComplexity(noiseLevel);
  const bias2Val  = getBias2(complexity, noiseLevel);
  const varVal    = getVariance(complexity, noiseLevel);
  const noiseVal  = getNoise(noiseLevel);
  const totalVal  = getTotalError(complexity, noiseLevel);

  // Bias color: high when complexity is low
  const bias2Color  = bias2Val > noiseLevel * 0.5 ? C.red : bias2Val < noiseLevel * 0.15 ? C.green : C.accent;
  // Variance color: high when complexity is high
  const varColor    = varVal   > noiseLevel * 0.5 ? C.red : varVal   < noiseLevel * 0.15 ? C.green : C.accent;
  // Optimal star label
  const isOptimal   = complexity === optD;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawChart(canvas, complexity, noiseLevel);
  }, [complexity, noiseLevel]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(draw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <WidgetCard title="Bias-Variance Decomposition" number="2.2" tryThis={tryThis}>
      {/* Canvas + stat panel */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            flex: 1,
            height: '200px',
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
            label="Bias²"
            value={fmtVal(bias2Val)}
            color={bias2Color}
          />
          <StatRow
            label="Variance"
            value={fmtVal(varVal)}
            color={varColor}
          />
          <StatRow
            label="Noise"
            value={fmtVal(noiseVal)}
            color={C.textMid}
          />
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '10px', marginTop: '2px' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9.5px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.textMuted,
              marginBottom: '4px',
            }}>
              Optimal d ★
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '22px',
              color: isOptimal ? C.math : C.accent,
              lineHeight: 1.1,
            }}>
              {optD}
            </div>
            {isOptimal && (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: C.math,
                marginTop: '3px',
              }}>
                ← you're here
              </div>
            )}
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
          label="complexity"
          value={complexity}
          min={1}
          max={20}
          step={1}
          onChange={setComplexity}
          format={v => v}
        />
        <Slider
          label="noise level"
          value={noiseLevel}
          min={0.1}
          max={1.0}
          step={0.05}
          onChange={setNoiseLevel}
          format={v => v.toFixed(2)}
        />
      </div>
    </WidgetCard>
  );
}
