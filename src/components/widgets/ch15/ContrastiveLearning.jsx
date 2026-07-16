import { useState, useRef, useEffect, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg2:     '#111111',
  bg3:     '#161616',
  bg4:     '#1e1e1e',
  border:  '#242424',
  borderLt:'#2e2e2e',
  muted:   '#555555',
  textMid: '#888888',
  text:    '#e8eaed',
  codeBg:  '#0a0a0a',
  accent:  '#2dd4bf',
  green:   '#34d399',
  red:     '#f87171',
  orange:  '#fb923c',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ── Pair data ─────────────────────────────────────────────────────────────────
const PAIRS = [
  { key: 'cat',      color: '#2dd4bf', label: 'cat' },
  { key: 'sunset',   color: '#fb923c', label: 'sunset' },
  { key: 'car',      color: '#a78bfa', label: 'car' },
  { key: 'dog',      color: '#34d399', label: 'dog' },
  { key: 'mountain', color: '#fbbf24', label: 'mountain' },
  { key: 'ocean',    color: '#f472b6', label: 'ocean' },
];

// Untrained starting layout — image/text embeddings scattered with no relation
// to their pairing. Everything past this point is reached by real gradient
// descent on the loss shown in the stats panel, not by scripting toward a
// pre-baked "trained" answer.
const INITIAL_POS = {
  cat:      { img: [-0.72,  0.48], txt: [ 0.61, -0.53] },
  sunset:   { img: [ 0.55,  0.71], txt: [-0.48, -0.62] },
  car:      { img: [-0.31, -0.68], txt: [ 0.70,  0.39] },
  dog:      { img: [ 0.68, -0.42], txt: [-0.59,  0.55] },
  mountain: { img: [-0.44,  0.66], txt: [ 0.38, -0.71] },
  ocean:    { img: [ 0.29, -0.58], txt: [-0.63,  0.44] },
};

// Each embedding's starting radius — real CLIP L2-normalizes image/text
// embeddings before the dot product, so only direction (not magnitude) should
// carry similarity information. We re-project onto this fixed radius after
// every gradient step so the 2D toy embeddings behave the same way.
const INIT_NORM = {};
for (const { key } of PAIRS) {
  INIT_NORM[key] = {
    img: Math.hypot(INITIAL_POS[key].img[0], INITIAL_POS[key].img[1]),
    txt: Math.hypot(INITIAL_POS[key].txt[0], INITIAL_POS[key].txt[1]),
  };
}

const MAX_STEPS = 20;
const ANIM_MS   = 400;
// Gradient-descent hyperparameters, tuned empirically so training visibly
// converges within MAX_STEPS across the full temperature slider range
// (tau = 0.01–0.5) without diverging at low tau.
const LR        = 0.5;    // SGD learning rate applied to the (clipped) gradient
const GRAD_CLIP = 0.8;    // global gradient-norm clip — keeps steps stable when
                           // low tau makes the raw InfoNCE gradient very sharp
const FD_H      = 0.002;  // central-difference step for the numerical gradient
                           // (same convention as ch04's GradientDescentNavigator)

// ── SVG coordinate system ─────────────────────────────────────────────────────
const VW = 460, VH = 380, PAD = 32;
const UW = VW - 2 * PAD; // 396
const UH = VH - 2 * PAD; // 316

const toX = (x) => PAD + (x + 1) / 2 * UW;
const toY = (y) => PAD + (1 - y) / 2 * UH;

const diamondPts = (cx, cy, size) => {
  const h = size / 2;
  return `${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`;
};

// ── Math helpers ──────────────────────────────────────────────────────────────
const lerp  = (a, b, t) => a + (b - a) * t;
const ease  = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const lerpP = (p0, p1, t) => [lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t)];

const cosSim = (u, v) => {
  const dot = u[0] * v[0] + u[1] * v[1];
  const nu  = Math.sqrt(u[0] ** 2 + u[1] ** 2);
  const nv  = Math.sqrt(v[0] ** 2 + v[1] ** 2);
  return dot / (nu * nv + 1e-8);
};

const logSumExp = (vals) => {
  const m = Math.max(...vals);
  return m + Math.log(vals.reduce((s, v) => s + Math.exp(v - m), 0));
};

// sim[i][j] = cosine similarity between image i and text j
function buildSimMatrix(pos) {
  return PAIRS.map(({ key: ki }) => PAIRS.map(({ key: kj }) => cosSim(pos[ki].img, pos[kj].txt)));
}

// Symmetric InfoNCE: average the image->text cross-entropy (softmax over texts
// for each image anchor) and the text->image cross-entropy (softmax over images
// for each text anchor) — matches the "average the two cross-entropies" claim
// in the surrounding prose, rather than only the one-directional form.
function lossFromSim(sim, tau) {
  const N = PAIRS.length;

  let i2t = 0;
  for (let i = 0; i < N; i++) {
    const row = sim[i].map(s => s / tau);
    i2t += -(row[i] - logSumExp(row));
  }
  i2t /= N;

  let t2i = 0;
  for (let j = 0; j < N; j++) {
    const col = sim.map(row => row[j] / tau);
    t2i += -(col[j] - logSumExp(col));
  }
  t2i /= N;

  return (i2t + t2i) / 2;
}

function totalLoss(pos, tau) {
  return lossFromSim(buildSimMatrix(pos), tau);
}

function clonePos(pos) {
  const out = {};
  for (const { key } of PAIRS) {
    out[key] = { img: [pos[key].img[0], pos[key].img[1]], txt: [pos[key].txt[0], pos[key].txt[1]] };
  }
  return out;
}

// Numerical gradient of the symmetric InfoNCE loss w.r.t. every 2D coordinate,
// via central differences — same technique as computeGrad() in
// src/components/widgets/ch04/GradientDescentNavigator.jsx.
function numGrad(pos, tau) {
  const grad = {};
  for (const { key } of PAIRS) {
    grad[key] = { img: [0, 0], txt: [0, 0] };
    for (const mod of ['img', 'txt']) {
      for (let d = 0; d < 2; d++) {
        const plus  = clonePos(pos); plus[key][mod][d]  += FD_H;
        const minus = clonePos(pos); minus[key][mod][d] -= FD_H;
        grad[key][mod][d] = (totalLoss(plus, tau) - totalLoss(minus, tau)) / (2 * FD_H);
      }
    }
  }
  return grad;
}

function renormalize(v, targetNorm) {
  const n = Math.hypot(v[0], v[1]);
  if (n < 1e-6) return [targetNorm, 0];
  const s = targetNorm / n;
  return [v[0] * s, v[1] * s];
}

// One real SGD step on the symmetric InfoNCE loss: compute the gradient at the
// current positions, clip its global norm for stability (raw gradients get very
// sharp at low tau), then descend. tau therefore genuinely shapes both the
// direction and the size of every step, unlike a pre-scripted animation.
function gradStep(pos, tau, lr, clip) {
  const grad = numGrad(pos, tau);

  let gradNormSq = 0;
  for (const { key } of PAIRS) {
    for (const mod of ['img', 'txt']) {
      gradNormSq += grad[key][mod][0] ** 2 + grad[key][mod][1] ** 2;
    }
  }
  const gradNorm = Math.sqrt(gradNormSq);
  const scale = gradNorm > clip ? clip / gradNorm : 1;

  const next = {};
  for (const { key } of PAIRS) {
    const img = [
      pos[key].img[0] - lr * scale * grad[key].img[0],
      pos[key].img[1] - lr * scale * grad[key].img[1],
    ];
    const txt = [
      pos[key].txt[0] - lr * scale * grad[key].txt[0],
      pos[key].txt[1] - lr * scale * grad[key].txt[1],
    ];
    next[key] = {
      img: renormalize(img, INIT_NORM[key].img),
      txt: renormalize(txt, INIT_NORM[key].txt),
    };
  }
  return next;
}

function lerpPositions(a, b, t) {
  const out = {};
  for (const { key } of PAIRS) {
    out[key] = { img: lerpP(a[key].img, b[key].img, t), txt: lerpP(a[key].txt, b[key].txt, t) };
  }
  return out;
}

// Blend between the two nearest *real, gradient-computed* keyframes for smooth
// on-screen motion — the keyframes themselves are genuine training steps, only
// the sub-step interpolation between them is for visual smoothness.
function getDisplayPos(posSteps, stepFloat) {
  const lastIdx = posSteps.length - 1;
  const lo = Math.max(0, Math.min(lastIdx, Math.floor(stepFloat)));
  const hi = Math.min(lastIdx, lo + 1);
  const frac = Math.min(1, Math.max(0, stepFloat - lo));
  return lerpPositions(posSteps[lo], posSteps[hi], frac);
}

function computeStats(pos, tau) {
  const N = PAIRS.length;
  const sim = buildSimMatrix(pos);
  const loss = lossFromSim(sim, tau);

  let matchSum = 0, nonMatchSum = 0, nonMatchCnt = 0;
  let closestSim = -Infinity, closestName = '';

  for (let i = 0; i < N; i++) {
    matchSum += sim[i][i];
    for (let j = 0; j < N; j++) {
      if (j === i) continue;
      const s = sim[i][j];
      nonMatchSum += s;
      nonMatchCnt++;
      if (s > closestSim) {
        closestSim  = s;
        closestName = `${PAIRS[i].key}-${PAIRS[j].key}`;
      }
    }
  }

  return {
    loss,
    avgMatchSim: matchSum / N,
    avgNonMatch: nonMatchSum / nonMatchCnt,
    closestName,
    closestSim,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatRow({ label, val, color }) {
  return (
    <div style={{ marginBottom: '9px' }}>
      <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: '12px', color: color || C.accent, lineHeight: 1 }}>
        {val}
      </div>
    </div>
  );
}

function SDiv() {
  return <div style={{ height: '1px', background: C.border, margin: '8px 0 10px' }} />;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input
        type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: C.accent, width: 12, height: 12, cursor: 'pointer' }}
      />
      <span style={{ ...mono, fontSize: '10px', color: C.muted }}>{label}</span>
    </label>
  );
}

const btnBase = {
  ...mono,
  fontSize: '11px',
  borderRadius: '4px',
  padding: '5px 12px',
  cursor: 'pointer',
  border: `1px solid ${C.borderLt}`,
  background: C.bg4,
  color: C.textMid,
  whiteSpace: 'nowrap',
};

function Btn({ onClick, disabled, primary, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...btnBase,
        ...(primary ? { background: C.accent, color: '#000', border: `1px solid ${C.accent}` } : {}),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function ContrastiveLearning({ tryThis }) {
  const [step,          setStep]          = useState(0);
  const [dispStepFloat, setDispStepFloat] = useState(0);
  const [playing,       setPlaying]       = useState(false);
  const [tau,           setTau]           = useState(0.07);
  const [showLabels,    setShowLabels]    = useState(false);
  const [showNonMatch,  setShowNonMatch]  = useState(false);
  const [hovKey,        setHovKey]        = useState(null);
  const [hovType,       setHovType]       = useState(null);
  // posSteps[n] = embeddings after n real gradient-descent steps, grown
  // lazily by the effect below as training advances.
  const [posSteps,      setPosSteps]      = useState([INITIAL_POS]);

  const dispRef = useRef(0);
  const rafRef  = useRef(null);
  const tauRef  = useRef(tau);

  // Pause the continuous play loop when scrolled off-screen; never auto-run for reduced motion.
  const [cardRef, isVisible] = useIsVisible();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisibleRef         = useRef(true);
  isVisibleRef.current = isVisible;

  useEffect(() => { tauRef.current = tau; }, [tau]);

  // Keep posSteps caught up with step: each new entry is one real gradient
  // step from the previous entry, taken at whatever temperature was current
  // at that moment — exactly like real training, where changing a
  // hyperparameter only affects future steps, never rewrites steps already
  // taken.
  useEffect(() => {
    setPosSteps(prev => {
      if (prev.length > step) return prev;
      const next = [...prev];
      while (next.length <= step) {
        next.push(gradStep(next[next.length - 1], tauRef.current, LR, GRAD_CLIP));
      }
      return next;
    });
  }, [step]);

  // Animate dispStepFloat toward the target step on every step change. Reset
  // (step 0) snaps on the next frame — there's no gradient path "backwards"
  // to animate along.
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (step === 0) {
      dispRef.current = 0;
      rafRef.current = requestAnimationFrame(() => setDispStepFloat(0));
      return () => cancelAnimationFrame(rafRef.current);
    }
    const target = step;
    const from   = dispRef.current;
    let t0 = null;

    function frame(ts) {
      if (t0 === null) t0 = ts;
      const elapsed = ts - t0;
      const t = Math.min(elapsed / ANIM_MS, 1);
      const val = lerp(from, target, ease(t));
      dispRef.current = val;
      setDispStepFloat(val);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        dispRef.current = target;
        setDispStepFloat(target);
      }
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step]);

  // Play mode: advance step every 350ms (pauses off-screen, resumes back in view)
  useEffect(() => {
    if (!playing || !isVisibleRef.current) return;
    const id = setInterval(() => {
      setStep(s => {
        const next = Math.min(s + 1, MAX_STEPS);
        if (next >= MAX_STEPS) setPlaying(false);
        return next;
      });
    }, 350);
    return () => clearInterval(id);
  }, [playing, isVisible]);

  // Cleanup on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const pos   = useMemo(() => getDisplayPos(posSteps, dispStepFloat), [posSteps, dispStepFloat]);
  const stats = useMemo(() => computeStats(pos, tau),                 [pos, tau]);

  const lineOp    = lerp(0.25, 0.80, dispStepFloat / MAX_STEPS);
  const lossColor = stats.loss > 1.5 ? C.red : stats.loss > 0.8 ? C.orange : C.green;
  const sep       = stats.avgMatchSim - stats.avgNonMatch;
  const sepColor  = sep > 0.4 ? C.green : sep > 0 ? C.accent : C.red;

  function trainStep() {
    if (step < MAX_STEPS) {
      setStep(s => s + 1);
      setPlaying(false);
    }
  }
  function reset() {
    setPlaying(false);
    setPosSteps([INITIAL_POS]);
    setStep(0);
  }
  function playPause() {
    if (prefersReducedMotion) return; // reduced motion: no continuous auto-play
    if (playing) { setPlaying(false); return; }
    if (step >= MAX_STEPS) {
      setPosSteps([INITIAL_POS]);
      setStep(0);
    }
    setPlaying(true);
  }

  return (
    <WidgetCard
      ref={cardRef}
      title="Contrastive Learning — image-text pairs converge during training"
      number="15.1"
      tryThis={tryThis}
    >
      {/* ── Canvas + Stats row ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* SVG scatter plot */}
        <div style={{ flex: 1, minWidth: 0, background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" data-a11y-explorer="manual" role="img" aria-label="Contrastive-learning embedding chart. Use the embedding selector below to inspect an image or text embedding." style={{ display: 'block' }}>

            {/* Background */}
            <rect width={VW} height={VH} fill={C.codeBg} />

            {/* Axis lines */}
            <line x1={toX(0)} y1={PAD}       x2={toX(0)}       y2={VH - PAD}
              stroke="#242424" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={PAD}    y1={toY(0)}     x2={VW - PAD}     y2={toY(0)}
              stroke="#242424" strokeWidth="1" strokeDasharray="4 4" />

            {/* Non-matching lines */}
            {showNonMatch && PAIRS.flatMap(({ key: ki }) =>
              PAIRS.filter(({ key: kj }) => kj !== ki).map(({ key: kj }) => (
                <line key={`nm-${ki}-${kj}`}
                  x1={toX(pos[ki].img[0])} y1={toY(pos[ki].img[1])}
                  x2={toX(pos[kj].txt[0])} y2={toY(pos[kj].txt[1])}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"
                />
              ))
            )}

            {/* Pair connecting lines */}
            {PAIRS.map(({ key, color }) => {
              const isHov = hovKey === key;
              return (
                <line key={`ln-${key}`}
                  x1={toX(pos[key].img[0])} y1={toY(pos[key].img[1])}
                  x2={toX(pos[key].txt[0])} y2={toY(pos[key].txt[1])}
                  stroke={color}
                  strokeWidth={isHov ? 2.5 : 1.5}
                  strokeOpacity={isHov ? 1 : lineOp}
                />
              );
            })}

            {/* Labels near image dots (shown when showLabels or hovered) */}
            {PAIRS.map(({ key, color, label }) => {
              if (!showLabels && hovKey !== key) return null;
              const isHov = hovKey === key && hovType === 'img';
              const sx = toX(pos[key].img[0]);
              const sy = toY(pos[key].img[1]);
              const r  = (hovKey === key) ? 14 : 10;
              return (
                <text key={`lbl-${key}`}
                  x={sx} y={sy - r - 4}
                  textAnchor="middle" fill={color}
                  fontSize="9" fontFamily="Inter, sans-serif"
                  style={{ pointerEvents: 'none' }}
                  opacity={isHov ? 0 : 1}
                >
                  {label}
                </text>
              );
            })}

            {/* Tooltip for hovered dot */}
            {hovKey && (() => {
              const pair  = PAIRS.find(p => p.key === hovKey);
              const p     = pos[hovKey][hovType];
              const sx    = toX(p[0]);
              const sy    = toY(p[1]);
              const rPad  = hovType === 'img' ? 14 : 10;
              const ty    = sy - rPad - 18;
              const tipW  = 126;
              const label = `${hovKey} — ${hovType === 'img' ? 'image' : 'text'} embed`;
              return (
                <g key="tooltip" style={{ pointerEvents: 'none' }}>
                  <rect x={sx - tipW / 2} y={ty - 13} width={tipW} height={16}
                    rx={3} fill="rgba(0,0,0,0.78)" />
                  <text x={sx} y={ty} textAnchor="middle"
                    fill={pair.color} fontSize="9" fontFamily="Inter, sans-serif">
                    {label}
                  </text>
                </g>
              );
            })()}

            {/* Image embeddings — circles */}
            {PAIRS.map(({ key, color }) => {
              const isHov = hovKey === key;
              const sx = toX(pos[key].img[0]);
              const sy = toY(pos[key].img[1]);
              return (
                <circle key={`img-${key}`}
                  cx={sx} cy={sy} r={isHov ? 14 : 10}
                  fill={color} stroke="white" strokeWidth="1.5"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => { setHovKey(key); setHovType('img'); }}
                  onMouseLeave={() => { setHovKey(null); setHovType(null); }}
                />
              );
            })}

            {/* Text embeddings — diamonds */}
            {PAIRS.map(({ key, color }) => {
              const isHov = hovKey === key;
              const sx = toX(pos[key].txt[0]);
              const sy = toY(pos[key].txt[1]);
              return (
                <polygon key={`txt-${key}`}
                  points={diamondPts(sx, sy, isHov ? 20 : 14)}
                  fill={color} stroke="white" strokeWidth="1.5"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => { setHovKey(key); setHovType('txt'); }}
                  onMouseLeave={() => { setHovKey(null); setHovType(null); }}
                />
              );
            })}

            {/* Legend */}
            <g transform={`translate(${PAD + 4}, ${VH - 14})`}>
              <circle cx={0} cy={-1} r={5} fill={C.muted} stroke="white" strokeWidth="0.8" />
              <text x={9} y={3} fontSize="8" fontFamily="Inter, sans-serif" fill={C.muted}>
                image embed
              </text>
              <polygon points={diamondPts(86, -1, 9)} fill={C.muted} stroke="white" strokeWidth="0.8" />
              <text x={95} y={3} fontSize="8" fontFamily="Inter, sans-serif" fill={C.muted}>
                text embed
              </text>
            </g>
          </svg>
          <select
            className="a11y-data-selector"
            aria-label="Inspect contrastive-learning embedding"
            value={hovKey && hovType ? `${hovKey}:${hovType}` : ""}
            onChange={event => {
              const [key, type] = event.target.value.split(":");
              setHovKey(key || null);
              setHovType(type || null);
            }}
          >
            <option value="">Select an embedding</option>
            {PAIRS.flatMap(({ key, label }) => [
              <option key={`${key}-img`} value={`${key}:img`}>{`${label}: image embedding`}</option>,
              <option key={`${key}-txt`} value={`${key}:txt`}>{`${label}: text embedding`}</option>,
            ])}
          </select>
        </div>

        {/* ── Stats panel ──────────────────────────────────────────────── */}
        <div style={{
          width: 180, flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '14px',
        }}>
          <StatRow label="Training step" val={`${step} / ${MAX_STEPS}`} color={C.accent} />
          <StatRow label="Progress"      val={`${Math.round((dispStepFloat / MAX_STEPS) * 100)}%`} />
          <StatRow label="Contrastive loss" val={stats.loss.toFixed(3)} color={lossColor} />
          <SDiv />
          <StatRow
            label="Avg matching sim"
            val={stats.avgMatchSim.toFixed(3)}
            color={stats.avgMatchSim > 0.9 ? C.green : C.accent}
          />
          <StatRow
            label="Avg non-match sim"
            val={stats.avgNonMatch.toFixed(3)}
            color={stats.avgNonMatch < 0.1 ? C.green : C.textMid}
          />
          <StatRow
            label="Separation"
            val={sep.toFixed(3)}
            color={sepColor}
          />
          <SDiv />
          <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Closest non-match
          </div>
          <div style={{ ...mono, fontSize: '11px', color: C.textMid, marginBottom: '3px' }}>
            {stats.closestName}
          </div>
          <div style={{ ...mono, fontSize: '11px', color: C.textMid }}>
            sim: {stats.closestSim.toFixed(2)}
          </div>
        </div>
      </div>

      {/* ── Loss display ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        margin: '10px 0',
        padding: '8px 14px',
        background: C.bg3, borderRadius: '6px', border: `1px solid ${C.border}`,
      }}>
        <span style={{ ...mono, fontSize: '13px', color: lossColor }}>
          Contrastive loss: {stats.loss.toFixed(3)}
        </span>
        <span style={{ ...mono, fontSize: '10px', color: C.muted }}>
          τ = {tau.toFixed(2)}
        </span>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Buttons + step counter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn onClick={trainStep} disabled={step >= MAX_STEPS || playing} primary>
            Train step
          </Btn>
          <Btn
            onClick={playPause}
            disabled={prefersReducedMotion}
            title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </Btn>
          <Btn onClick={reset}>
            ↺ Reset
          </Btn>
          <span style={{ ...mono, fontSize: '10px', color: C.muted }}>
            Step {step} / {MAX_STEPS}
          </span>
        </div>

        {/* Temperature slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Temperature
            </span>
            <span style={{ ...mono, fontSize: '11px', color: C.accent }}>
              τ = {tau.toFixed(2)}
            </span>
          </div>
          <input
            type="range" min={0.01} max={0.5} step={0.01} value={tau}
            onChange={e => setTau(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Toggle label="Show labels"             checked={showLabels}   onChange={setShowLabels}   />
          <Toggle label="Show non-matching lines" checked={showNonMatch} onChange={setShowNonMatch} />
        </div>
      </div>
    </WidgetCard>
  );
}
