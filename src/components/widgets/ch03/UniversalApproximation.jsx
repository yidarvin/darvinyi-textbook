import { useEffect, useRef, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Constants ────────────────────────────────────────────────────────────────
const N = 100;
const X = Array.from({ length: N }, (_, i) => i / (N - 1));
const UNITS_STEPS = [1, 2, 4, 8, 16, 32, 64];
const FUNC_NAMES = ['Sine', 'Sawtooth', 'Step'];
const ACT_NAMES = ['ReLU', 'Tanh'];
const Y_MIN = -1.25;
const Y_MAX = 1.25;
const ANIM_FRAMES = 20;

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Target functions ─────────────────────────────────────────────────────────
const TARGET_FNS = [
  x => Math.sin(2 * Math.PI * x),
  x => 2 * (x % 0.5) - 0.5,
  x => x < 0.33 ? -0.5 : x < 0.66 ? 0.3 : -0.2,
];

// ─── Activations ──────────────────────────────────────────────────────────────
const ACTIVATIONS = [
  x => Math.max(0, x),  // ReLU
  x => Math.tanh(x),    // Tanh
];

// ─── Least-squares solver (normal equations, Gaussian elimination) ────────────
function solveELM(H, y, rows, cols) {
  // Build H^T H and H^T y
  const HtH = new Float64Array(cols * cols);
  const Hty = new Float64Array(cols);

  for (let i = 0; i < rows; i++) {
    const base = i * cols;
    for (let a = 0; a < cols; a++) {
      const ha = H[base + a];
      Hty[a] += ha * y[i];
      for (let b = a; b < cols; b++) {
        const v = ha * H[base + b];
        HtH[a * cols + b] += v;
        if (b !== a) HtH[b * cols + a] += v;
      }
    }
  }

  // Tikhonov regularization for numerical stability
  for (let i = 0; i < cols; i++) HtH[i * cols + i] += 1e-6;

  // Augmented matrix [HtH | Hty]
  const n = cols;
  const M = new Float64Array(n * (n + 1));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) M[i * (n + 1) + j] = HtH[i * n + j];
    M[i * (n + 1) + n] = Hty[i];
  }

  // Gaussian elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    let maxRow = col, maxVal = Math.abs(M[col * (n + 1) + col]);
    for (let row = col + 1; row < n; row++) {
      const v = Math.abs(M[row * (n + 1) + col]);
      if (v > maxVal) { maxVal = v; maxRow = row; }
    }
    if (maxRow !== col) {
      for (let j = 0; j <= n; j++) {
        const tmp = M[col * (n + 1) + j];
        M[col * (n + 1) + j] = M[maxRow * (n + 1) + j];
        M[maxRow * (n + 1) + j] = tmp;
      }
    }
    const pivot = M[col * (n + 1) + col];
    if (Math.abs(pivot) < 1e-15) continue;
    for (let row = col + 1; row < n; row++) {
      const f = M[row * (n + 1) + col] / pivot;
      for (let j = col; j <= n; j++) M[row * (n + 1) + j] -= f * M[col * (n + 1) + j];
    }
  }

  const w = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i * (n + 1) + n];
    for (let j = i + 1; j < n; j++) s -= M[i * (n + 1) + j] * w[j];
    const d = M[i * (n + 1) + i];
    w[i] = Math.abs(d) > 1e-15 ? s / d : 0;
  }
  return w;
}

// ─── Extreme Learning Machine ─────────────────────────────────────────────────
function computeELM(units, funcIdx, actIdx) {
  const seed = (funcIdx + 1) * 1000 + (actIdx + 1) * 100 + units;
  const rng = mulberry32(seed);

  // Random input weights — wider spread for ReLU to ensure diverse activations
  const scale = actIdx === 0 ? 4 : 2;
  const W1 = Float64Array.from({ length: units }, () => (rng() * 2 - 1) * scale);
  const b1 = Float64Array.from({ length: units }, () => (rng() * 2 - 1) * scale * 0.5);

  const act = ACTIVATIONS[actIdx];
  const cols = units + 1; // +1 for bias column

  // Build hidden feature matrix H: N × cols
  const H = new Float64Array(N * cols);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < units; j++)
      H[i * cols + j] = act(X[i] * W1[j] + b1[j]);
    H[i * cols + units] = 1; // bias
  }

  const y = Float64Array.from(X, x => TARGET_FNS[funcIdx](x));
  const w = solveELM(H, y, N, cols);

  // Output = H @ w
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++)
    for (let j = 0; j < cols; j++)
      out[i] += H[i * cols + j] * w[j];

  return out;
}

// ─── Precompute all 42 combinations at module load (<100ms) ──────────────────
const PRECOMPUTED = {};
for (const fi of [0, 1, 2])
  for (const ai of [0, 1])
    for (const u of UNITS_STEPS)
      PRECOMPUTED[`${fi}_${ai}_${u}`] = computeELM(u, fi, ai);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeMSE(approx, funcIdx) {
  let s = 0;
  for (let i = 0; i < N; i++) s += (approx[i] - TARGET_FNS[funcIdx](X[i])) ** 2;
  return s / N;
}

function qualityLabel(mse) {
  if (mse < 0.001) return 'excellent';
  if (mse < 0.01)  return 'good';
  if (mse < 0.05)  return 'okay';
  return 'poor';
}

function qualityColor(mse) {
  if (mse < 0.01)  return '#34d399';
  if (mse < 0.05)  return '#2dd4bf';
  return '#f87171';
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const MONO = "'JetBrains Mono', monospace";

function statLabel(text) {
  return {
    fontFamily: MONO, fontSize: '9px', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px',
  };
}

function statVal(color) {
  return { fontFamily: MONO, fontSize: '18px', color, lineHeight: 1.1 };
}

function tabStyle(active) {
  return {
    fontFamily: MONO, fontSize: '11px', padding: '4px 12px',
    borderRadius: '4px', border: '1px solid',
    cursor: 'pointer',
    borderColor: active ? 'var(--accent)' : 'var(--border)',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    transition: 'all 0.12s',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function UniversalApproximation() {
  const [funcIdx,  setFuncIdx]  = useState(0);
  const [actIdx,   setActIdx]   = useState(0);
  const [unitsIdx, setUnitsIdx] = useState(3); // default index 3 → 8 units

  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  // { prev: Float64Array|null, next: Float64Array, frame: number }
  const animState = useRef({ prev: null, next: null, frame: ANIM_FRAMES });

  const units  = UNITS_STEPS[unitsIdx];
  const approx = PRECOMPUTED[`${funcIdx}_${actIdx}_${units}`];
  const mse    = computeMSE(approx, funcIdx);
  const params = units * 3 + 1;
  const qColor = qualityColor(mse);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = PRECOMPUTED[`${funcIdx}_${actIdx}_${units}`];

    // Snapshot current displayed position before starting new animation
    const anim = animState.current;
    let currentDisplay;
    if (anim.prev !== null && anim.frame < ANIM_FRAMES) {
      const t    = anim.frame / ANIM_FRAMES;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      currentDisplay = new Float64Array(N);
      for (let i = 0; i < N; i++)
        currentDisplay[i] = anim.prev[i] * (1 - ease) + anim.next[i] * ease;
    } else {
      currentDisplay = anim.next ?? target;
    }

    animState.current = { prev: currentDisplay, next: target, frame: 0 };
    if (animRef.current) cancelAnimationFrame(animRef.current);

    // Size canvas once per effect run
    const rect = canvas.getBoundingClientRect();
    const cssW  = rect.width  || 440;
    const cssH  = rect.height || 220;
    const dpr   = window.devicePixelRatio || 1;
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    // Capture loop variables in closure
    const capFuncIdx = funcIdx;

    function draw() {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const W = cssW, H = cssH;
      const PL = 32, PR = 10, PT = 10, PB = 20;
      const plotW = W - PL - PR;
      const plotH = H - PT - PB;

      const xToC = x => PL + x * plotW;
      const yToC = y => PT + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      // Horizontal grid lines at y = −1, 0, 1
      for (const gy of [-1, 0, 1]) {
        const cy = yToC(gy);
        ctx.strokeStyle = gy === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PL, cy);
        ctx.lineTo(PL + plotW, cy);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.font = `9px ${MONO}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(gy === 0 ? '0' : gy > 0 ? '1' : '−1', PL - 5, cy);
      }

      // Target function — dashed white
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const cx = xToC(X[i]);
        const cy = yToC(TARGET_FNS[capFuncIdx](X[i]));
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Approximation — interpolated, clamped, teal
      const a  = animState.current;
      const t  = Math.min(a.frame / ANIM_FRAMES, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const v  = a.prev[i] * (1 - ease) + a.next[i] * ease;
        const cx = xToC(X[i]);
        const cy = yToC(Math.max(Y_MIN, Math.min(Y_MAX, v)));
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      a.frame++;
      if (a.frame <= ANIM_FRAMES) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [funcIdx, actIdx, units]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WidgetCard title="Universal Approximation — hidden units vs fit quality" number="2.1">

      {/* ── Canvas + Stats ── */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>

        <canvas
          ref={canvasRef}
          style={{
            flex: 1, height: '220px',
            background: '#0a0a0a', borderRadius: '6px',
            border: '1px solid var(--border)', display: 'block',
          }}
        />

        <div style={{
          width: '126px', flexShrink: 0,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '14px 14px',
          display: 'flex', flexDirection: 'column', gap: '13px',
        }}>
          <div>
            <div style={statLabel('MSE')}>MSE</div>
            <div style={statVal(qColor)}>{mse < 0.0001 ? mse.toExponential(1) : mse.toFixed(4)}</div>
          </div>
          <div>
            <div style={statLabel()}>Parameters</div>
            <div style={statVal('var(--accent)')}>{params}</div>
          </div>
          <div>
            <div style={statLabel()}>Activation</div>
            <div style={{ fontFamily: MONO, fontSize: '12px', color: 'var(--text)' }}>
              {ACT_NAMES[actIdx]}
            </div>
          </div>
          <div>
            <div style={statLabel()}>Quality</div>
            <div style={{ fontFamily: MONO, fontSize: '12px', color: qColor, fontWeight: 600 }}>
              {qualityLabel(mse)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Hidden units slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
            <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)' }}>
              hidden units
            </span>
            <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--accent)' }}>
              {units}
            </span>
          </div>
          <input
            type="range" min={0} max={6} step={1} value={unitsIdx}
            onChange={e => setUnitsIdx(+e.target.value)}
            style={{ width: '100%' }}
          />
          {/* Tick labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingRight: '1px' }}>
            {UNITS_STEPS.map(u => (
              <span key={u} style={{
                fontFamily: MONO, fontSize: '9px',
                color: u === units ? 'var(--accent)' : 'var(--text-muted)',
                minWidth: '0', textAlign: 'center',
              }}>
                {u}
              </span>
            ))}
          </div>
        </div>

        {/* Target function tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)', minWidth: '60px' }}>
            target
          </span>
          {FUNC_NAMES.map((name, i) => (
            <button key={name} onClick={() => setFuncIdx(i)} style={tabStyle(funcIdx === i)}>
              {name}
            </button>
          ))}
        </div>

        {/* Activation tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)', minWidth: '60px' }}>
            activation
          </span>
          {ACT_NAMES.map((name, i) => (
            <button key={name} onClick={() => setActIdx(i)} style={tabStyle(actIdx === i)}>
              {name}
            </button>
          ))}
        </div>
      </div>

    </WidgetCard>
  );
}
