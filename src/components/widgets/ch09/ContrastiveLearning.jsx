import { useState, useRef, useEffect, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

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

const INITIAL_POS = {
  cat:      { img: [-0.72,  0.48], txt: [ 0.61, -0.53] },
  sunset:   { img: [ 0.55,  0.71], txt: [-0.48, -0.62] },
  car:      { img: [-0.31, -0.68], txt: [ 0.70,  0.39] },
  dog:      { img: [ 0.68, -0.42], txt: [-0.59,  0.55] },
  mountain: { img: [-0.44,  0.66], txt: [ 0.38, -0.71] },
  ocean:    { img: [ 0.29, -0.58], txt: [-0.63,  0.44] },
};

const TRAINED_POS = {
  cat:      { img: [-0.65,  0.52], txt: [-0.60,  0.57] },
  sunset:   { img: [ 0.58,  0.63], txt: [ 0.62,  0.58] },
  car:      { img: [ 0.52, -0.55], txt: [ 0.57, -0.51] },
  dog:      { img: [-0.58, -0.48], txt: [-0.53, -0.53] },
  mountain: { img: [-0.08,  0.72], txt: [-0.04,  0.68] },
  ocean:    { img: [ 0.10, -0.72], txt: [ 0.06, -0.68] },
};

const MAX_STEPS = 20;
const ANIM_MS   = 400;

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

function getPosAt(t) {
  const out = {};
  for (const { key } of PAIRS) {
    out[key] = {
      img: lerpP(INITIAL_POS[key].img, TRAINED_POS[key].img, t),
      txt: lerpP(INITIAL_POS[key].txt, TRAINED_POS[key].txt, t),
    };
  }
  return out;
}

function computeStats(pos, tau) {
  let totalLoss = 0, matchSum = 0, nonMatchSum = 0, nonMatchCnt = 0;
  let closestSim = -Infinity, closestName = '';

  for (let i = 0; i < PAIRS.length; i++) {
    const ki   = PAIRS[i].key;
    const imgI = pos[ki].img;

    // Numerically stable softmax via log-sum-exp
    const scaledSims = PAIRS.map(({ key: kj }) => cosSim(imgI, pos[kj].txt) / tau);
    const lse = logSumExp(scaledSims);
    totalLoss += -(scaledSims[i] - lse);
    matchSum  += cosSim(imgI, pos[ki].txt);

    for (let j = 0; j < PAIRS.length; j++) {
      if (j === i) continue;
      const kj = PAIRS[j].key;
      const s  = cosSim(imgI, pos[kj].txt);
      nonMatchSum += s;
      nonMatchCnt++;
      if (s > closestSim) {
        closestSim  = s;
        closestName = `${ki}-${kj}`;
      }
    }
  }

  return {
    loss:        totalLoss / PAIRS.length,
    avgMatchSim: matchSum / PAIRS.length,
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

function Btn({ onClick, disabled, primary, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
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
export default function ContrastiveLearning() {
  const [step,        setStep]        = useState(0);
  const [dispProg,    setDispProg]    = useState(0);
  const [playing,     setPlaying]     = useState(false);
  const [tau,         setTau]         = useState(0.07);
  const [showLabels,  setShowLabels]  = useState(false);
  const [showNonMatch,setShowNonMatch]= useState(false);
  const [hovKey,      setHovKey]      = useState(null);
  const [hovType,     setHovType]     = useState(null);

  const dispRef = useRef(0);
  const rafRef  = useRef(null);

  // Animate dispProg toward step/MAX_STEPS on every step change
  useEffect(() => {
    const target = step / MAX_STEPS;
    cancelAnimationFrame(rafRef.current);
    const from = dispRef.current;
    let t0 = null;

    function frame(ts) {
      if (t0 === null) t0 = ts;
      const elapsed = ts - t0;
      const t = Math.min(elapsed / ANIM_MS, 1);
      const val = lerp(from, target, ease(t));
      dispRef.current = val;
      setDispProg(val);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        dispRef.current = target;
        setDispProg(target);
      }
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step]);

  // Play mode: advance step every 350ms
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep(s => {
        const next = Math.min(s + 1, MAX_STEPS);
        if (next >= MAX_STEPS) setPlaying(false);
        return next;
      });
    }, 350);
    return () => clearInterval(id);
  }, [playing]);

  // Cleanup on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const pos   = useMemo(() => getPosAt(dispProg),       [dispProg]);
  const stats = useMemo(() => computeStats(pos, tau),   [pos, tau]);

  const lineOp    = lerp(0.25, 0.80, dispProg);
  const lossColor = stats.loss > 1.5 ? C.red : stats.loss > 0.8 ? C.orange : C.green;
  const sep       = stats.avgMatchSim - stats.avgNonMatch;
  const sepColor  = sep > 0.4 ? C.green : sep > 0 ? C.accent : C.red;

  function trainStep() {
    if (step < MAX_STEPS) { setStep(s => s + 1); setPlaying(false); }
  }
  function reset()     { setPlaying(false); setStep(0); }
  function playPause() {
    if (playing) { setPlaying(false); return; }
    if (step >= MAX_STEPS) setStep(0);
    setPlaying(true);
  }

  return (
    <WidgetCard
      title="Contrastive Learning — image-text pairs converge during training"
      number="9.1"
    >
      {/* ── Canvas + Stats row ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* SVG scatter plot */}
        <div style={{ flex: 1, minWidth: 0, background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>

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
        </div>

        {/* ── Stats panel ──────────────────────────────────────────────── */}
        <div style={{
          width: 180, flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '14px',
        }}>
          <StatRow label="Training step" val={`${step} / ${MAX_STEPS}`} color={C.accent} />
          <StatRow label="Progress"      val={`${Math.round(dispProg * 100)}%`} />
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
          <Btn onClick={playPause}>
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
