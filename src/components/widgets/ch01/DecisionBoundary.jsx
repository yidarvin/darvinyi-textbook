import { useEffect, useRef, useState, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  accent:   '#2dd4bf',
  math:     '#fbbf24',
  green:    '#34d399',
  red:      '#f87171',
  orange:   '#fb923c',
  border:   '#242424',
  borderLt: '#2e2e2e',
  codeBg:   '#0a0a0a',
  bg2:      '#111111',
  textMid:  '#888888',
  textMuted:'#555555',
  text:     '#e8eaed',
  // class colors
  teal:     '#2dd4bf',
  orangePt: '#fb923c',
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 440;
const CANVAS_H = 300;
const GRID_N   = 40;   // 40×40 probability grid
const PAD      = { top: 12, right: 12, bottom: 12, left: 12 };

// ─── Default points (10 points, pre-seeded) ───────────────────────────────────
const DEFAULT_POINTS = [
  { x: 0.22, y: 0.30, cls: 0 },
  { x: 0.35, y: 0.25, cls: 0 },
  { x: 0.18, y: 0.55, cls: 0 },
  { x: 0.28, y: 0.68, cls: 0 },
  { x: 0.40, y: 0.45, cls: 0 },
  { x: 0.62, y: 0.35, cls: 1 },
  { x: 0.75, y: 0.55, cls: 1 },
  { x: 0.68, y: 0.70, cls: 1 },
  { x: 0.82, y: 0.28, cls: 1 },
  { x: 0.55, y: 0.72, cls: 1 },
];

// ─── Math utilities ───────────────────────────────────────────────────────────
function sigmoid(z) {
  if (z > 30)  return 1.0;
  if (z < -30) return 0.0;
  return 1 / (1 + Math.exp(-z));
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// ─── Feature expansion ────────────────────────────────────────────────────────

// Linear: [1, x, y]
function linearFeatures(x, y) {
  return [1, x, y];
}

// Polynomial degree-2: [1, x, y, x², xy, y²]
function polyFeatures(x, y) {
  return [1, x, y, x * x, x * y, y * y];
}

// RBF: [1, exp(-γ·||·-c||²) for each center]
// Centers are placed at data points; γ is controlled by slider
function rbfFeatures(x, y, centers, gamma) {
  const f = [1];
  for (const c of centers) {
    const dx = x - c.x;
    const dy = y - c.y;
    f.push(Math.exp(-gamma * (dx * dx + dy * dy)));
  }
  return f;
}

// ─── Logistic regression via gradient descent ─────────────────────────────────
function trainLogistic(features, labels, iters = 500, lr = 0.5) {
  if (features.length === 0) return null;
  const D = features[0].length;
  const N = features.length;
  const w = new Array(D).fill(0);

  for (let iter = 0; iter < iters; iter++) {
    const grad = new Array(D).fill(0);
    for (let i = 0; i < N; i++) {
      const p = sigmoid(dot(w, features[i]));
      const err = p - labels[i];
      for (let d = 0; d < D; d++) grad[d] += err * features[i][d];
    }
    for (let d = 0; d < D; d++) w[d] -= (lr / N) * grad[d];
  }
  return w;
}

// ─── Build model ──────────────────────────────────────────────────────────────
// Returns predict(x, y) → probability ∈ [0,1] (class 1 probability)
function buildModel(points, modelType, complexity) {
  if (points.length < 2) return null;

  const hasClass0 = points.some(p => p.cls === 0);
  const hasClass1 = points.some(p => p.cls === 1);
  if (!hasClass0 || !hasClass1) return null;

  const labels = points.map(p => p.cls);

  if (modelType === 'Linear') {
    const feats = points.map(p => linearFeatures(p.x, p.y));
    const w = trainLogistic(feats, labels);
    if (!w) return null;
    return (x, y) => sigmoid(dot(w, linearFeatures(x, y)));
  }

  if (modelType === 'Polynomial') {
    // degree-2 features — complexity slider shifts learning rate / iterations
    const feats = points.map(p => polyFeatures(p.x, p.y));
    const iters = Math.round(200 + complexity * 800); // 200..1000
    const w = trainLogistic(feats, labels, iters, 0.3);
    if (!w) return null;
    return (x, y) => sigmoid(dot(w, polyFeatures(x, y)));
  }

  if (modelType === 'RBF') {
    // Use data points as RBF centers; γ driven by complexity slider
    const gamma = 0.5 + complexity * 19.5; // 0.5..20
    const centers = points;
    const feats = points.map(p => rbfFeatures(p.x, p.y, centers, gamma));
    const iters = 500;
    const w = trainLogistic(feats, labels, iters, 0.5);
    if (!w) return null;
    return (x, y) => sigmoid(dot(w, rbfFeatures(x, y, centers, gamma)));
  }

  return null;
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function drawWidget(canvas, points, predict) {
  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W    = rect.width;
  const H    = rect.height;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // plot area
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  // ── Background
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  // ── Decision-boundary heatmap via ImageData on an offscreen canvas
  if (predict) {
    const offscreen = document.createElement('canvas');
    offscreen.width  = GRID_N;
    offscreen.height = GRID_N;
    const octx = offscreen.getContext('2d');
    const imgData = octx.createImageData(GRID_N, GRID_N);

    for (let row = 0; row < GRID_N; row++) {
      for (let col = 0; col < GRID_N; col++) {
        const nx   = col / (GRID_N - 1);
        const ny   = 1 - row / (GRID_N - 1);
        const prob = predict(nx, ny);
        const idx  = (row * GRID_N + col) * 4;

        if (prob < 0.5) {
          // teal region — opacity proportional to confidence
          const conf = (0.5 - prob) * 2; // 0..1
          imgData.data[idx + 0] = 45;
          imgData.data[idx + 1] = 212;
          imgData.data[idx + 2] = 191;
          imgData.data[idx + 3] = Math.round(conf * 0.15 * 255);
        } else {
          // orange region
          const conf = (prob - 0.5) * 2;
          imgData.data[idx + 0] = 251;
          imgData.data[idx + 1] = 146;
          imgData.data[idx + 2] = 60;
          imgData.data[idx + 3] = Math.round(conf * 0.15 * 255);
        }
      }
    }

    octx.putImageData(imgData, 0, 0);

    // Scale onto canvas plot area with crisp pixels
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreen, PAD.left, PAD.top, plotW, plotH);
    ctx.restore();

    // ── Decision boundary contour at p=0.5
    // Walk horizontal scanlines, detect sign changes in (prob-0.5)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([]);

    const CONTOUR_STEPS = 80;
    for (let row = 0; row < CONTOUR_STEPS; row++) {
      const ny0 = 1 - row       / (CONTOUR_STEPS - 1);
      const ny1 = 1 - (row + 1) / (CONTOUR_STEPS - 1);
      const cy0 = PAD.top + (1 - ny0) * plotH;
      const cy1 = PAD.top + (1 - ny1) * plotH;

      for (let col = 0; col < CONTOUR_STEPS; col++) {
        const nx0 = col       / (CONTOUR_STEPS - 1);
        const nx1 = (col + 1) / (CONTOUR_STEPS - 1);
        const cx0 = PAD.left + nx0 * plotW;
        const cx1 = PAD.left + nx1 * plotW;

        const p00 = predict(nx0, ny0) - 0.5;
        const p10 = predict(nx1, ny0) - 0.5;
        const p01 = predict(nx0, ny1) - 0.5;

        // horizontal crossing
        if (p00 * p10 < 0) {
          const t = p00 / (p00 - p10);
          const cx = cx0 + t * (cx1 - cx0);
          ctx.beginPath();
          ctx.moveTo(cx, cy0);
          ctx.lineTo(cx, cy1);
          ctx.stroke();
        }
        // vertical crossing
        if (p00 * p01 < 0) {
          const t = p00 / (p00 - p01);
          const cy = cy0 + t * (cy1 - cy0);
          ctx.beginPath();
          ctx.moveTo(cx0, cy);
          ctx.lineTo(cx1, cy);
          ctx.stroke();
        }
      }
    }
  }

  // ── Subtle grid
  ctx.strokeStyle = C.border;
  ctx.lineWidth   = 0.5;
  ctx.setLineDash([2, 4]);
  const gridLines = 4;
  for (let i = 1; i < gridLines; i++) {
    const x = PAD.left + (i / gridLines) * plotW;
    const y = PAD.top  + (i / gridLines) * plotH;
    ctx.beginPath();
    ctx.moveTo(x, PAD.top);
    ctx.lineTo(x, PAD.top + plotH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + plotW, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // ── Plot frame
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth   = 1;
  ctx.strokeRect(PAD.left, PAD.top, plotW, plotH);

  // ── Points
  const toCanvasX = nx => PAD.left + nx * plotW;
  const toCanvasY = ny => PAD.top  + (1 - ny) * plotH;

  points.forEach(p => {
    const cx = toCanvasX(p.x);
    const cy = toCanvasY(p.y);

    if (p.cls === 0) {
      // teal filled circle
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = C.teal;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // orange filled circle
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = C.orangePt;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // ── Legend (top-right corner)
  const lx = PAD.left + plotW - 88;
  const ly = PAD.top + 8;
  ctx.fillStyle = 'rgba(10,10,10,0.75)';
  ctx.beginPath();
  ctx.roundRect(lx - 6, ly - 4, 88, 36, 4);
  ctx.fill();

  ctx.font = `10px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'left';

  ctx.beginPath();
  ctx.arc(lx + 4, ly + 6, 4, 0, Math.PI * 2);
  ctx.fillStyle = C.teal;
  ctx.fill();
  ctx.fillStyle = C.textMid;
  ctx.fillText('class 0', lx + 12, ly + 10);

  ctx.beginPath();
  ctx.arc(lx + 4, ly + 22, 4, 0, Math.PI * 2);
  ctx.fillStyle = C.orangePt;
  ctx.fill();
  ctx.fillStyle = C.textMid;
  ctx.fillText('class 1', lx + 12, ly + 26);
}

// ─── Helper: find nearest point index ────────────────────────────────────────
function nearestPoint(points, nx, ny) {
  let best = -1;
  let bestDist = Infinity;
  points.forEach((p, i) => {
    const d = (p.x - nx) ** 2 + (p.y - ny) ** 2;
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────
function TabGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            border: `1px solid ${value === opt ? C.accent : C.borderLt}`,
            background: value === opt ? '#0b2422' : 'transparent',
            color: value === opt ? C.accent : C.textMuted,
            transition: 'all 0.1s',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: C.textMuted,
        minWidth: '72px',
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
export default function DecisionBoundary() {
  const [points,     setPoints]     = useState(DEFAULT_POINTS);
  const [nextClass,  setNextClass]  = useState(0); // alternates 0→1→0→...
  const [modelType,  setModelType]  = useState('Linear');
  const [complexity, setComplexity] = useState(0.5); // 0..1 normalised

  const canvasRef  = useRef(null);
  // Cache predict fn in a ref to avoid stale closure issues in event handlers
  const predictRef = useRef(null);

  // ── Derived: accuracy + counts
  const n0 = points.filter(p => p.cls === 0).length;
  const n1 = points.filter(p => p.cls === 1).length;

  let predict = null;
  try {
    predict = buildModel(points, modelType, complexity);
  } catch (_) {
    predict = null;
  }
  predictRef.current = predict;

  let accuracy = '—';
  let accColor = C.accent;
  if (predict && points.length > 0) {
    const correct = points.filter(p => {
      const prob = predict(p.x, p.y);
      return (prob >= 0.5 ? 1 : 0) === p.cls;
    }).length;
    const acc = correct / points.length;
    accuracy = (acc * 100).toFixed(0) + '%';
    accColor = acc >= 0.9 ? C.green : acc < 0.6 ? C.red : C.accent;
  }

  // ── Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawWidget(canvas, points, predict);
  }, [points, predict]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(draw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  // ── Canvas coordinate helpers (need live rect)
  function canvasToNorm(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const W    = rect.width;
    const H    = rect.height;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top  - PAD.bottom;
    const nx = (clientX - rect.left - PAD.left) / plotW;
    const ny = 1 - (clientY - rect.top - PAD.top) / plotH;
    return { nx, ny };
  }

  // ── Click → add point
  function handleClick(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { nx, ny } = canvasToNorm(canvas, e.clientX, e.clientY);
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;

    setPoints(prev => {
      const newPt = { x: nx, y: ny, cls: nextClass };
      return [...prev, newPt];
    });
    setNextClass(c => 1 - c);
  }

  // ── Right-click → remove nearest point
  function handleContextMenu(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { nx, ny } = canvasToNorm(canvas, e.clientX, e.clientY);

    setPoints(prev => {
      if (prev.length === 0) return prev;
      const idx = nearestPoint(prev, nx, ny);
      if (idx === -1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  }

  // ── Clear
  function handleClear() {
    setPoints([]);
    setNextClass(0);
  }

  return (
    <WidgetCard title="Decision Boundary" number="1.4">
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            flex: 1,
            height: `${CANVAS_H}px`,
            display: 'block',
            borderRadius: '6px',
            border: `1px solid ${C.border}`,
            cursor: 'crosshair',
          }}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
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
          <StatRow label="Train Acc" value={accuracy} color={accColor} />
          <StatRow label="Class 0" value={n0} color={C.teal} />
          <StatRow label="Class 1" value={n1} color={C.orangePt} />
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9.5px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.textMuted,
              marginBottom: '2px',
            }}>
              Model
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              color: C.accent,
              lineHeight: 1.2,
            }}>
              {modelType}
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
        gap: '12px',
      }}>
        {/* Model tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: C.textMuted,
            minWidth: '72px',
            flexShrink: 0,
          }}>
            model
          </span>
          <TabGroup
            options={['Linear', 'Polynomial', 'RBF']}
            value={modelType}
            onChange={setModelType}
          />
        </div>

        {/* Complexity slider */}
        <Slider
          label="complexity"
          value={complexity}
          min={0}
          max={1}
          step={0.01}
          onChange={setComplexity}
          format={v => v.toFixed(2)}
        />

        {/* Clear button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: C.textMuted,
            minWidth: '72px',
            flexShrink: 0,
          }}>
            points
          </span>
          <button
            onClick={handleClear}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              padding: '4px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              border: `1px solid ${C.borderLt}`,
              background: 'transparent',
              color: C.textMuted,
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.red;
              e.currentTarget.style.color = C.red;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.borderLt;
              e.currentTarget.style.color = C.textMuted;
            }}
          >
            Clear
          </button>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: C.textMuted,
            opacity: 0.6,
          }}>
            click=add · right-click=remove
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}
