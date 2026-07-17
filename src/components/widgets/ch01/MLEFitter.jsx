import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { mulberry32 } from '../../../utils/rng';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  green:     '#34d399',
  red:       '#f87171',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  codeBg:    '#0a0a0a',
  text:      '#e8eaed',
  textMuted: '#555555',
  textMid:   '#888888',
  accentDim: '#0b2422',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

function randn(rng) {
  // Box-Muller
  const u = 1 - rng(), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── Seeded initial datasets ────────────────────────────────────────────────
const SEED_GAUSS_INIT = 101;
const SEED_BERN_INIT  = 202;
const SEED_ADD_STREAM = 303;

const GAUSS_DOMAIN = [-6, 6];
const BERN_DOMAIN  = [-1, 1];

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

let nextId = 1;
function freshId() { return nextId++; }

function genInitialGauss() {
  const rng = mulberry32(SEED_GAUSS_INIT);
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const x = clamp(1.0 + 1.3 * randn(rng), GAUSS_DOMAIN[0] + 0.3, GAUSS_DOMAIN[1] - 0.3);
    pts.push({ id: freshId(), x: Math.round(x * 100) / 100 });
  }
  return pts;
}

function genInitialBernoulli() {
  const rng = mulberry32(SEED_BERN_INIT);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const heads = rng() < 0.5;
    const jitter = (rng() - 0.5) * 0.3;
    const x = clamp((heads ? 0.55 : -0.55) + jitter, -0.95, 0.95);
    pts.push({ id: freshId(), x: Math.round(x * 100) / 100 });
  }
  return pts;
}

// ─── Log-likelihood formulas (real math, evaluated live) ──────────────────────
function bernoulliLogLik(p, k, n) {
  const eps = 1e-9;
  const pc = clamp(p, eps, 1 - eps);
  return k * Math.log(pc) + (n - k) * Math.log(1 - pc);
}

function gaussianLogLikMu(mu, xs, sigma) {
  const n = xs.length;
  let ss = 0;
  for (const x of xs) ss += (x - mu) * (x - mu);
  return -n / 2 * Math.log(2 * Math.PI * sigma * sigma) - ss / (2 * sigma * sigma);
}

function gaussianLogLikVar(sigma2, xs, mu) {
  const n = xs.length;
  const s2 = Math.max(sigma2, 1e-6);
  let ss = 0;
  for (const x of xs) ss += (x - mu) * (x - mu);
  return -n / 2 * Math.log(2 * Math.PI * s2) - ss / (2 * s2);
}

function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── Coordinate mapping (shared by the drag strip and the curve canvas) ───────
function domainToPx(v, domain, width, pad) {
  const w = width - 2 * pad;
  return pad + ((v - domain[0]) / (domain[1] - domain[0])) * w;
}
function pxToDomain(px, domain, width, pad) {
  const w = width - 2 * pad;
  return domain[0] + ((px - pad) / w) * (domain[1] - domain[0]);
}

// ─── Beeswarm lane assignment so overlapping points stay distinguishable ──────
function assignLanes(points, toPx, minSpacing) {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const laneLastPx = new Map(); // lane -> last placed px
  const out = [];
  for (const p of sorted) {
    const px = toPx(p.x);
    let dir = 0; // probe order: 0, 1, -1, 2, -2, ...
    let lane = 0;
    for (let tries = 0; tries < 9; tries++) {
      lane = dir;
      const last = laneLastPx.get(lane);
      if (last === undefined || Math.abs(px - last) >= minSpacing) break;
      dir = dir > 0 ? -dir : -dir + 1;
    }
    laneLastPx.set(lane, px);
    out.push({ ...p, px, lane });
  }
  return out;
}

// ─── Canvas: draw the log-likelihood curve ─────────────────────────────────────
const PL = 46, PR = 16, PT = 14, PB = 26;

function drawLikelihoodCurve(canvas, W, H, cfg) {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const { xs, ys, xDomain, argmaxX, argmaxY, xLabel, secondaryX, secondaryLabel, curveColor } = cfg;

  const plotW = W - PL - PR;
  const plotH = H - PT - PB;

  // Y-domain comes only from the sampled curve itself (not from argmaxY): a
  // degenerate configuration (e.g. all Gaussian points dragged to ~the same
  // value) sends the true log-likelihood peak toward +Infinity as sigma^2 -> 0,
  // which is mathematically real but would otherwise squash the rest of the
  // curve. The argmax marker is clamped into view below instead of stretching
  // the axis to fit it.
  const finiteYs = ys.filter(v => isFinite(v));
  let yMin = Math.min(...finiteYs);
  let yMax = Math.max(...finiteYs);
  const yPad = (yMax - yMin) * 0.08 || 1;
  yMin -= yPad;
  yMax += yPad;

  const toX = x => PL + (x - xDomain[0]) / (xDomain[1] - xDomain[0]) * plotW;
  const toY = y => PT + (1 - (clamp(y, yMin, yMax) - yMin) / (yMax - yMin)) * plotH;

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  // Grid + y labels
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 0.5;
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const yv = yMin + (i / yTicks) * (yMax - yMin);
    const py = toY(yv);
    ctx.beginPath();
    ctx.moveTo(PL, py);
    ctx.lineTo(PL + plotW, py);
    ctx.stroke();
    ctx.fillStyle = C.textMuted;
    ctx.textAlign = 'right';
    ctx.fillText(yv.toFixed(1), PL - 5, py + 3);
  }

  // X ticks
  ctx.textAlign = 'center';
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const xv = xDomain[0] + (i / xTicks) * (xDomain[1] - xDomain[0]);
    ctx.fillStyle = C.textMuted;
    ctx.fillText(xv.toFixed(2), toX(xv), PT + plotH + 14);
  }
  ctx.fillStyle = C.textMid;
  ctx.fillText(xLabel, PL + plotW / 2, PT + plotH + 24);

  // Axes
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PL, PT);
  ctx.lineTo(PL, PT + plotH);
  ctx.lineTo(PL + plotW, PT + plotH);
  ctx.stroke();

  // Curve
  ctx.beginPath();
  ctx.strokeStyle = curveColor || C.accent;
  ctx.lineWidth = 2;
  let first = true;
  for (let i = 0; i < xs.length; i++) {
    const cx = toX(xs[i]);
    const cy = toY(ys[i]);
    if (first) { ctx.moveTo(cx, cy); first = false; }
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  // Secondary marker (e.g. unbiased variance) — drawn before the argmax so argmax sits on top
  if (secondaryX !== undefined && secondaryX >= xDomain[0] && secondaryX <= xDomain[1]) {
    const sx = toX(secondaryX);
    ctx.save();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1.25;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sx, PT);
    ctx.lineTo(sx, PT + plotH);
    ctx.stroke();
    ctx.restore();
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = C.orange;
    ctx.textAlign = sx > PL + plotW - 60 ? 'right' : 'left';
    ctx.fillText(secondaryLabel, sx + (sx > PL + plotW - 60 ? -5 : 5), PT + 10);
  }

  // Argmax marker
  const ax = toX(clamp(argmaxX, xDomain[0], xDomain[1]));
  const ay = toY(argmaxY);
  ctx.save();
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(ax, PT);
  ctx.lineTo(ax, PT + plotH);
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(ax, ay, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = C.accent;
  ctx.fill();
  ctx.strokeStyle = C.codeBg;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ─── Small UI pieces ────────────────────────────────────────────────────────
function StatRow({ label, value, color }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ ...mono, fontSize: '9px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.textMuted, marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: '17px', color: color || C.accent, lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...mono,
        fontSize: '11px',
        fontWeight: active ? 600 : 400,
        color: active ? C.accent : C.textMid,
        background: active ? C.accentDim : 'transparent',
        border: `1px solid ${active ? C.accent : C.border}`,
        borderRadius: '4px',
        padding: '5px 11px',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SmallButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...mono,
        fontSize: '11px',
        color: disabled ? C.textMuted : C.text,
        background: C.bg4,
        border: `1px solid ${C.border}`,
        borderRadius: '4px',
        padding: '4px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ─── Main widget ────────────────────────────────────────────────────────────
export default function MLEFitter({ tryThis }) {
  const [mode, setMode] = useState('bernoulli'); // 'bernoulli' | 'gauss-mu' | 'gauss-var'
  const [bernPoints, setBernPoints] = useState(genInitialBernoulli);
  const [gaussPoints, setGaussPoints] = useState(genInitialGauss);
  const [knownSigma, setKnownSigma] = useState(1.2);
  const [draggingId, setDraggingId] = useState(null);

  const addStreamRef = useRef(mulberry32(SEED_ADD_STREAM));
  const containerRef = useRef(null);
  const stripRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [panelW, setPanelW] = useState(420);
  const [canvasW, setCanvasW] = useState(240);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = Math.floor(containerRef.current.getBoundingClientRect().width);
        if (w > 60) setPanelW(w);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const measure = () => {
      if (canvasWrapRef.current) {
        const w = Math.floor(canvasWrapRef.current.getBoundingClientRect().width);
        if (w > 60) setCanvasW(w);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (canvasWrapRef.current) ro.observe(canvasWrapRef.current);
    return () => ro.disconnect();
  }, []);

  const isBern = mode === 'bernoulli';
  const domain = isBern ? BERN_DOMAIN : GAUSS_DOMAIN;
  const points = isBern ? bernPoints : gaussPoints;
  const setPoints = isBern ? setBernPoints : setGaussPoints;

  const STRIP_PAD = 26;

  // ── Drag handling (pointer capture keeps events flowing to the same handle) ─
  const handlePointerDown = useCallback((e, id) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingId(id);
  }, []);

  const handlePointerMove = useCallback((e, id) => {
    if (draggingId !== id) return;
    const strip = stripRef.current;
    if (!strip) return;
    const rect = strip.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const raw = pxToDomain(px, domain, rect.width, STRIP_PAD);
    const v = clamp(raw, domain[0], domain[1]);
    setPoints(prev => prev.map(p => (p.id === id ? { ...p, x: v } : p)));
  }, [draggingId, domain, setPoints]);

  const handlePointerUp = useCallback((e) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    setDraggingId(null);
  }, []);

  // ── Derived quantities — recomputed every render from current point state ──
  const n = points.length;

  // Bernoulli
  const k = isBern ? bernPoints.filter(p => p.x >= 0).length : 0;
  const phat = isBern ? k / n : null;

  // Gaussian
  const gaussXs = gaussPoints.map(p => p.x);
  const muHat = gaussXs.length ? mean(gaussXs) : 0;
  const ssResid = gaussXs.reduce((acc, x) => acc + (x - muHat) * (x - muHat), 0);
  const varMLE = gaussXs.length ? ssResid / gaussXs.length : 0;
  const varUnbiased = gaussXs.length > 1 ? ssResid / (gaussXs.length - 1) : varMLE;

  // ── Curve data for the active mode ──────────────────────────────────────────
  const curve = useMemo(() => {
    const N_SAMPLES = 160;
    if (mode === 'bernoulli') {
      const lo = 0.01, hi = 0.99;
      const xs = [], ys = [];
      for (let i = 0; i <= N_SAMPLES; i++) {
        const p = lo + (i / N_SAMPLES) * (hi - lo);
        xs.push(p);
        ys.push(bernoulliLogLik(p, k, n));
      }
      const argmaxX = n > 0 ? k / n : 0.5;
      // xDomain matches [lo, hi] exactly (not the nominal [0,1] p-range) so the
      // argmax marker — clamped to the same [lo, hi] below — always lands on a
      // pixel the plotted curve actually passes through, even at k=0 or k=n.
      return {
        xs, ys, xDomain: [lo, hi],
        argmaxX, argmaxY: bernoulliLogLik(clamp(argmaxX, lo, hi), k, n),
        xLabel: 'candidate p',
        curveColor: C.accent,
      };
    }
    if (mode === 'gauss-mu') {
      const xs = [], ys = [];
      for (let i = 0; i <= N_SAMPLES; i++) {
        const mu = GAUSS_DOMAIN[0] + (i / N_SAMPLES) * (GAUSS_DOMAIN[1] - GAUSS_DOMAIN[0]);
        xs.push(mu);
        ys.push(gaussianLogLikMu(mu, gaussXs, knownSigma));
      }
      return {
        xs, ys, xDomain: GAUSS_DOMAIN,
        argmaxX: muHat, argmaxY: gaussianLogLikMu(muHat, gaussXs, knownSigma),
        xLabel: 'candidate μ',
        curveColor: C.purple,
      };
    }
    // gauss-var
    const s2Lo = 0.05;
    const hi = Math.max(2, varUnbiased * 2.5 + 0.5);
    const xs = [], ys = [];
    for (let i = 0; i <= N_SAMPLES; i++) {
      const s2 = s2Lo + (i / N_SAMPLES) * (hi - s2Lo);
      xs.push(s2);
      ys.push(gaussianLogLikVar(s2, gaussXs, muHat));
    }
    // xDomain starts at s2Lo (not 0) to match the curve's actual sweep range —
    // otherwise a tightly clustered configuration (varMLE < s2Lo) would place the
    // argmax marker to the left of where the plotted curve begins.
    return {
      xs, ys, xDomain: [s2Lo, hi],
      argmaxX: varMLE, argmaxY: gaussianLogLikVar(Math.max(varMLE, s2Lo), gaussXs, muHat),
      xLabel: 'candidate σ²',
      curveColor: C.orange,
      secondaryX: varUnbiased,
      secondaryLabel: 'unbiased (÷n−1)',
    };
  }, [mode, k, n, gaussXs, muHat, varMLE, varUnbiased, knownSigma]);

  // ── Draw curve canvas ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawLikelihoodCurve(canvas, canvasW, 170, curve);
  }, [curve, canvasW]);

  // ── Add / remove points ─────────────────────────────────────────────────────
  const addPoint = () => {
    const rng = addStreamRef.current;
    if (isBern) {
      if (bernPoints.length >= 16) return;
      const heads = rng() < 0.5;
      const jitter = (rng() - 0.5) * 0.3;
      const x = clamp((heads ? 0.55 : -0.55) + jitter, -0.95, 0.95);
      setBernPoints(prev => [...prev, { id: freshId(), x }]);
    } else {
      if (gaussPoints.length >= 16) return;
      const x = clamp(1.0 + 1.3 * randn(rng), GAUSS_DOMAIN[0] + 0.3, GAUSS_DOMAIN[1] - 0.3);
      setGaussPoints(prev => [...prev, { id: freshId(), x }]);
    }
  };
  const removePoint = () => {
    if (isBern) {
      if (bernPoints.length <= 3) return;
      setBernPoints(prev => prev.slice(0, -1));
    } else {
      if (gaussPoints.length <= 3) return;
      setGaussPoints(prev => prev.slice(0, -1));
    }
  };
  const resetPoints = () => {
    if (isBern) setBernPoints(genInitialBernoulli());
    else setGaussPoints(genInitialGauss());
  };

  // ── Beeswarm layout for the drag strip ──────────────────────────────────────
  const laidOut = useMemo(() => {
    const toPx = v => domainToPx(v, domain, panelW, STRIP_PAD);
    return assignLanes(points, toPx, 20);
  }, [points, domain, panelW]);

  const STRIP_H = 84;
  const LANE_STEP = 15;

  return (
    <WidgetCard title="MLE Fitter — the likelihood surface moves with the data" number="1.2" tryThis={tryThis}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <TabButton active={mode === 'bernoulli'} onClick={() => setMode('bernoulli')}>Bernoulli p (coin flips)</TabButton>
        <TabButton active={mode === 'gauss-mu'} onClick={() => setMode('gauss-mu')}>Gaussian μ</TabButton>
        <TabButton active={mode === 'gauss-var'} onClick={() => setMode('gauss-var')}>Gaussian σ²</TabButton>
      </div>

      {/* Drag strip */}
      <div ref={containerRef} style={{ width: '100%' }}>
        <div
          ref={stripRef}
          style={{
            position: 'relative',
            width: panelW + 'px',
            maxWidth: '100%',
            height: STRIP_H + 'px',
            background: C.codeBg,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            overflow: 'visible',
            touchAction: 'none',
          }}
        >
          {/* Bernoulli half-zone tint */}
          {isBern && (
            <>
              <div style={{
                position: 'absolute', left: STRIP_PAD, top: 0,
                width: `calc(50% - ${STRIP_PAD}px)`, height: '100%',
                background: 'rgba(248,113,113,0.05)',
              }} />
              <div style={{
                position: 'absolute', left: '50%', top: 0,
                right: STRIP_PAD, height: '100%',
                background: 'rgba(45,212,191,0.05)',
              }} />
              <div style={{
                position: 'absolute', left: STRIP_PAD + 4, top: 4,
                ...mono, fontSize: '9px', color: C.red, letterSpacing: '0.06em',
              }}>TAILS (0)</div>
              <div style={{
                position: 'absolute', right: STRIP_PAD + 4, top: 4,
                ...mono, fontSize: '9px', color: C.accent, letterSpacing: '0.06em',
              }}>HEADS (1)</div>
            </>
          )}

          {/* Axis line */}
          <div style={{
            position: 'absolute', left: STRIP_PAD, right: STRIP_PAD, top: '50%',
            height: '1px', background: C.borderLt,
          }} />
          {/* Threshold divider for Bernoulli */}
          {isBern && (
            <div style={{
              position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px',
              background: C.borderLt, transform: 'translateX(-0.5px)',
            }} />
          )}
          {/* Zero tick for Gaussian */}
          {!isBern && (
            <div style={{
              position: 'absolute',
              left: domainToPx(0, domain, panelW, STRIP_PAD),
              top: '50%', width: '1px', height: '10px', marginTop: '-5px',
              background: C.borderLt,
            }} />
          )}

          {/* Draggable points */}
          {laidOut.map(p => {
            const isHeads = isBern && p.x >= 0;
            const color = isBern ? (isHeads ? C.accent : C.red) : C.purple;
            return (
              <div
                key={p.id}
                onPointerDown={e => handlePointerDown(e, p.id)}
                onPointerMove={e => handlePointerMove(e, p.id)}
                onPointerUp={handlePointerUp}
                style={{
                  position: 'absolute',
                  left: p.px + 'px',
                  top: `calc(50% - ${p.lane * LANE_STEP}px)`,
                  transform: 'translate(-50%, -50%)',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: color,
                  border: `1.5px solid ${C.codeBg}`,
                  boxShadow: draggingId === p.id ? `0 0 0 3px ${color}55` : '0 1px 3px rgba(0,0,0,0.5)',
                  cursor: draggingId === p.id ? 'grabbing' : 'grab',
                  zIndex: draggingId === p.id ? 5 : 1,
                }}
              />
            );
          })}
        </div>
        <div style={{ ...mono, fontSize: '10px', color: C.textMuted, marginTop: '6px' }}>
          Drag any point along the line. {isBern
            ? 'Crossing the midline flips it between tails and heads.'
            : 'Its position is its value.'}
        </div>
      </div>

      {/* Curve + stats */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginTop: '16px', flexWrap: 'wrap' }}>
        <div ref={canvasWrapRef} style={{ flex: 1, minWidth: 220 }}>
          <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '6px' }} />
        </div>

        <div style={{
          width: '168px', flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '14px 16px',
        }}>
          <StatRow label="n" value={n} color={C.textMid} />
          {isBern ? (
            <>
              <StatRow label="heads (k)" value={k} color={C.accent} />
              <StatRow label="MLE: p̂ = k/n" value={phat.toFixed(3)} color={C.accent} />
              <StatRow label="log-lik at p̂" value={bernoulliLogLik(phat, k, n).toFixed(3)} color={C.textMid} />
            </>
          ) : mode === 'gauss-mu' ? (
            <>
              <StatRow label="MLE: μ̂ = mean(x)" value={muHat.toFixed(3)} color={C.purple} />
              <StatRow label="assumed σ" value={knownSigma.toFixed(2)} color={C.textMid} />
              <StatRow label="log-lik at μ̂" value={gaussianLogLikMu(muHat, gaussXs, knownSigma).toFixed(3)} color={C.textMid} />
            </>
          ) : (
            <>
              <StatRow label="MLE: σ̂² = ss/n" value={varMLE.toFixed(3)} color={C.orange} />
              <StatRow label="unbiased ss/(n−1)" value={varUnbiased.toFixed(3)} color={C.textMid} />
              <StatRow
                label="bias"
                value={`${varMLE < varUnbiased ? '−' : '+'}${Math.abs(varMLE - varUnbiased).toFixed(3)}`}
                color={C.red}
              />
            </>
          )}
        </div>
      </div>

      {mode === 'gauss-var' && (
        <div style={{
          marginTop: '10px', padding: '9px 12px',
          background: 'rgba(251,146,60,0.08)', border: `1px solid ${C.orange}44`,
          borderRadius: '6px', ...mono, fontSize: '10.5px', color: C.textMid, lineHeight: 1.5,
        }}>
          The peak of this curve — the MLE — divides the squared error by n, not n−1. It sits
          left of the orange unbiased marker for essentially every draggable configuration:
          maximum likelihood variance is a <strong style={{ color: C.orange }}>biased</strong> estimator,
          systematically too small.
        </div>
      )}

      {/* Controls */}
      <div style={{
        marginTop: '14px', borderTop: `1px solid ${C.border}`, paddingTop: '12px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {mode === 'gauss-mu' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ ...mono, fontSize: '11px', color: C.textMuted, minWidth: '110px', flexShrink: 0 }}>
              assumed σ (known)
            </span>
            <input
              type="range" min={0.4} max={3} step={0.05} value={knownSigma}
              onChange={e => setKnownSigma(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: C.purple, cursor: 'pointer' }}
            />
            <span style={{ ...mono, fontSize: '11px', color: C.purple, minWidth: '36px', textAlign: 'right' }}>
              {knownSigma.toFixed(2)}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <SmallButton onClick={addPoint} disabled={points.length >= 16}>+ point</SmallButton>
          <SmallButton onClick={removePoint} disabled={points.length <= 3}>− point</SmallButton>
          <SmallButton onClick={resetPoints}>↺ reset</SmallButton>
        </div>
      </div>
    </WidgetCard>
  );
}
