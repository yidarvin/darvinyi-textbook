import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Graph definition ─────────────────────────────────────────────────────────
// Nodes spread to fill the full 560×340 canvas (~40px padding on all sides)

const NODES = {
  A: { x: 78,  y: 96  },
  B: { x: 280, y: 64  },
  C: { x: 483, y: 106 },
  D: { x: 64,  y: 255 },
  E: { x: 294, y: 276 },
  F: { x: 496, y: 244 },
};
const NODE_IDS = ['A', 'B', 'C', 'D', 'E', 'F'];

const EDGES = [
  ['A','B'], ['A','D'], ['B','C'], ['B','E'],
  ['C','F'], ['D','E'], ['E','F'], ['B','F'],
];

const NEIGHBORS = {
  A: ['B', 'D'],
  B: ['A', 'C', 'E', 'F'],
  C: ['B', 'F'],
  D: ['A', 'E'],
  E: ['B', 'D', 'F'],
  F: ['C', 'B', 'E'],
};

const INIT = { A: 0.80, B: 0.30, C: 0.65, D: 0.10, E: 0.90, F: 0.45 };

const SVG_W = 560;
const SVG_H = 340;

// ── Colors ───────────────────────────────────────────────────────────────────

const C = {
  accent:   '#2dd4bf',
  math:     '#fbbf24',
  bg2:      '#111111',
  bg3:      '#161616',
  bg4:      '#1e1e1e',
  border:   '#242424',
  borderLt: '#2e2e2e',
  textMid:  '#888888',
  textMute: '#555555',
  codeBg:   '#0a0a0a',
  midTeal:  '#1a3a38',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ── Timing (ms) ──────────────────────────────────────────────────────────────

const DUR = {
  normal: { send: 600, p1: 200, agg: 400, p2: 200, update: 400 },
  fast:   { send: 200, p1:  70, agg: 140, p2:  70, update: 120 },
};

// ── Popup box positions (top-left corner) for new spread node layout ──────────
// No overlaps; all within 560×340 SVG bounds.

const POPUP_POS = {
  A: { x: 110, y: 73  },   // right of A
  B: { x: 240, y: 96  },   // below B (centered)
  C: { x: 371, y: 83  },   // left of C
  D: { x: 96,  y: 232 },   // right of D
  E: { x: 254, y: 184 },   // above E (centered)
  F: { x: 384, y: 221 },   // left of F
};
const POPUP_W    = 80;
const POPUP_LINE = 12;
const POPUP_PAD  = 6;

// ── Precomputed features ──────────────────────────────────────────────────────

function computeRounds(agg) {
  const rounds = [{ ...INIT }];
  for (let r = 1; r <= 3; r++) {
    const prev = rounds[r - 1];
    const curr = {};
    for (const v of NODE_IDS) {
      const vals = NEIGHBORS[v].map(u => prev[u]);
      if (agg === 'mean')     curr[v] = vals.reduce((s, x) => s + x, 0) / vals.length;
      else if (agg === 'sum') curr[v] = vals.reduce((s, x) => s + x, 0);
      else                    curr[v] = Math.max(...vals);
    }
    rounds.push(curr);
  }
  const features = {};
  for (const v of NODE_IDS) features[v] = rounds.map(r => r[v]);
  return features;
}

const ALL = {
  mean: computeRounds('mean'),
  sum:  computeRounds('sum'),
  max:  computeRounds('max'),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpHex(c1, c2, t) {
  const h = s => parseInt(s, 16);
  const r1 = h(c1.slice(1,3)), g1 = h(c1.slice(3,5)), b1 = h(c1.slice(5,7));
  const r2 = h(c2.slice(1,3)), g2 = h(c2.slice(3,5)), b2 = h(c2.slice(5,7));
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

function featureColor(h, maxH = 1.0) {
  const t = Math.max(0, Math.min(1, h / Math.max(maxH, 0.001)));
  return t <= 0.5 ? lerpHex(C.bg4, C.midTeal, t * 2) : lerpHex(C.midTeal, C.accent, (t - 0.5) * 2);
}

function getPhase(t, speed) {
  if (t === null) return { phase: null, sendProg: 0, updateProg: 0 };
  const d = DUR[speed];
  const total = d.send + d.p1 + d.agg + d.p2 + d.update;
  const ms = t * total;
  if (ms < d.send)                         return { phase: 'send',   sendProg: ms / d.send, updateProg: 0 };
  if (ms < d.send + d.p1)                  return { phase: null,     sendProg: 1, updateProg: 0 };
  if (ms < d.send + d.p1 + d.agg)         return { phase: 'agg',    sendProg: 1, updateProg: 0 };
  if (ms < d.send + d.p1 + d.agg + d.p2) return { phase: null,     sendProg: 1, updateProg: 0 };
  return { phase: 'update', sendProg: 1, updateProg: (ms - d.send - d.p1 - d.agg - d.p2) / d.update };
}

function aggResult(vals, agg) {
  if (agg === 'mean') return vals.reduce((a, b) => a + b, 0) / vals.length;
  if (agg === 'sum')  return vals.reduce((a, b) => a + b, 0);
  return Math.max(...vals);
}

function netStats(hMap) {
  const vals = NODE_IDS.map(v => hMap[v]);
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, x) => a + (x - m) ** 2, 0) / vals.length;
  return { mean: m, std: Math.sqrt(variance), variance };
}

function btnS(disabled = false, active = false) {
  return {
    padding: '5px 12px', borderRadius: '4px',
    border: `1px solid ${active ? C.accent : disabled ? C.border : C.borderLt}`,
    background: active ? 'var(--accent-dim)' : C.bg4,
    color: disabled ? C.textMute : active ? C.accent : C.textMid,
    ...mono, fontSize: '11px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCell({ label, val, hi }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <span style={{ ...mono, fontSize: '9px', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
      <span style={{ ...mono, fontSize: '12px', color: hi ? C.accent : C.textMid }}>
        {val}
      </span>
    </div>
  );
}

function VSep() {
  return <div style={{ width: '1px', background: C.border, alignSelf: 'stretch', flexShrink: 0 }} />;
}

function HistoryPanel({ node, features, agg, currentRound }) {
  const vals    = features[node];
  const maxVals = [0,1,2,3].map(r =>
    agg === 'sum' ? Math.max(...NODE_IDS.map(v => features[v][r])) : 1.0
  );

  // Use a wide viewBox to fill the full-width container
  const VW = 540, VH = 88;
  const BAR_W = 80, GAP = 57, PAD_L = 41;
  const CHART_TOP = 20, CHART_H = 48;

  const trend = (() => {
    const d = vals[3] - vals[0];
    if (Math.abs(d) < 0.01) return 'stable';
    return d > 0 ? '↑ increasing' : '↓ decreasing';
  })();

  return (
    <div style={{
      marginTop: '8px',
      background: C.codeBg,
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
      padding: '10px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ ...mono, fontSize: '10px', color: C.textMid }}>
          Node {node} — feature history
        </span>
        <span style={{ ...mono, fontSize: '10px', color: trend.startsWith('↑') ? C.accent : trend.startsWith('↓') ? '#f87171' : C.textMute }}>
          {trend}
        </span>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
        {[0, 1, 2, 3].map(r => {
          const bx  = PAD_L + r * (BAR_W + GAP);
          const bh  = Math.max(3, (vals[r] / Math.max(maxVals[r], 0.001)) * CHART_H);
          const by  = CHART_TOP + CHART_H - bh;
          const col = featureColor(vals[r], maxVals[r]);
          const cur = r === currentRound;
          return (
            <g key={r}>
              <rect x={bx} y={by} width={BAR_W} height={bh}
                fill={col} rx={2}
                stroke={cur ? 'white' : 'none'} strokeWidth={cur ? 1.5 : 0} />
              <text x={bx + BAR_W / 2} y={by - 4}
                textAnchor="middle" fill={C.math}
                fontSize={9} fontFamily="JetBrains Mono, monospace">
                {vals[r].toFixed(3)}
              </text>
              <text x={bx + BAR_W / 2} y={CHART_TOP + CHART_H + 14}
                textAnchor="middle"
                fill={cur ? C.accent : C.textMute}
                fontSize={10} fontFamily="JetBrains Mono, monospace">
                R{r}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MessagePassing() {
  const [round, setRound]               = useState(0);
  const [animT, setAnimT]               = useState(null);
  const [animNext, setAnimNext]         = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [aggregation, setAggregation]   = useState('mean');
  const [speed, setSpeed]               = useState('normal');
  const [popupRound, setPopupRound]     = useState(null); // round whose agg data stays visible

  const rafRef  = useRef(null);
  const t0Ref   = useRef(0);
  const lockRef = useRef(false);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const isAnim   = animT !== null;
  const features = ALL[aggregation];

  const { phase, sendProg, updateProg } = getPhase(animT, speed);

  const dispH = {};
  for (const v of NODE_IDS) {
    const cur = features[v][round];
    dispH[v] = (phase === 'update' && animNext !== null)
      ? lerp(cur, features[v][animNext], updateProg)
      : cur;
  }

  const maxH = aggregation === 'sum'
    ? Math.max(...NODE_IDS.map(v => dispH[v]))
    : 1.0;

  const travelers = phase === 'send'
    ? EDGES.flatMap(([u, v]) => {
        const cu = featureColor(features[u][round], maxH);
        const cv = featureColor(features[v][round], maxH);
        return [
          { key: `${u}${v}`, x: lerp(NODES[u].x, NODES[v].x, sendProg), y: lerp(NODES[u].y, NODES[v].y, sendProg), col: cu },
          { key: `${v}${u}`, x: lerp(NODES[v].x, NODES[u].x, sendProg), y: lerp(NODES[v].y, NODES[u].y, sendProg), col: cv },
        ];
      })
    : [];

  const edgeOpacity = phase === 'send'
    ? 0.5 + 0.5 * Math.abs(Math.sin(sendProg * Math.PI * 3))
    : 1;

  function startNextRound() {
    if (lockRef.current || round >= 3) return;
    const next = round + 1;
    lockRef.current = true;
    setAnimNext(next);
    setPopupRound(round);
    const d     = DUR[speed];
    const total = d.send + d.p1 + d.agg + d.p2 + d.update;
    t0Ref.current = performance.now();
    function tick(ts) {
      const t = Math.min(1, (ts - t0Ref.current) / total);
      setAnimT(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRound(next);
        setAnimT(null);
        setAnimNext(null);
        lockRef.current = false;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function reset() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lockRef.current = false;
    setRound(0); setAnimT(null); setAnimNext(null); setSelectedNode(null); setPopupRound(null);
  }

  function changeAgg(agg) {
    if (isAnim) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lockRef.current = false;
    setAggregation(agg); setRound(0); setAnimT(null); setAnimNext(null); setSelectedNode(null); setPopupRound(null);
  }

  function handleNodeClick(v, e) {
    e.stopPropagation();
    setSelectedNode(prev => prev === v ? null : v);
  }

  const stats   = netStats(dispH);
  const minNode = NODE_IDS.reduce((a, b) => dispH[a] <= dispH[b] ? a : b);
  const maxNode = NODE_IDS.reduce((a, b) => dispH[a] >= dispH[b] ? a : b);

  const nextBtnDisabled = round >= 3 || isAnim;

  const stripStyle = {
    display: 'flex', gap: '14px', alignItems: 'center',
    background: C.bg2, border: `1px solid ${C.border}`,
    borderRadius: '8px', padding: '10px 16px', marginTop: '8px',
    flexWrap: 'wrap', rowGap: '8px',
  };

  return (
    <WidgetCard title="Message Passing — neighbors share information" number="14.1">

      {/* ── Graph canvas — full width ── */}
      <div style={{ background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', cursor: 'default' }}
          onClick={() => setSelectedNode(null)}
        >
          <style>{`
            .mp-pulse {
              transform-box: fill-box;
              transform-origin: center;
              animation: mp-pulse-kf 0.4s ease-in-out;
            }
            @keyframes mp-pulse-kf {
              0%   { transform: scale(1.0); }
              50%  { transform: scale(1.2); }
              100% { transform: scale(1.0); }
            }
          `}</style>

          <rect x={0} y={0} width={SVG_W} height={SVG_H} fill={C.codeBg} />

          {/* Edges */}
          {EDGES.map(([u, v]) => (
            <line key={`e-${u}${v}`}
              x1={NODES[u].x} y1={NODES[u].y}
              x2={NODES[v].x} y2={NODES[v].y}
              stroke={phase === 'send' ? C.accent : C.borderLt}
              strokeWidth={phase === 'send' ? 2.5 : 1.5}
              opacity={phase === 'send' ? edgeOpacity : 1}
            />
          ))}

          {/* Travelers */}
          {travelers.map(tr => (
            <circle key={tr.key} cx={tr.x} cy={tr.y} r={7}
              fill={tr.col} stroke="rgba(255,255,255,0.5)" strokeWidth={0.5} />
          ))}

          {/* Nodes */}
          {NODE_IDS.map(v => {
            const { x: cx, y: cy } = NODES[v];
            const fill  = featureColor(dispH[v], maxH);
            const isSel = selectedNode === v;
            return (
              <g key={v}
                className={phase === 'agg' ? 'mp-pulse' : undefined}
                onClick={e => handleNodeClick(v, e)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={cx} cy={cy} r={28}
                  fill={fill}
                  stroke={isSel ? 'white' : C.borderLt}
                  strokeWidth={isSel ? 2.5 : 1.5}
                />
                <text x={cx} y={cy - 4} textAnchor="middle"
                  fill="white" fontSize={13} fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {v}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle"
                  fill={C.math} fontSize={10} fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {dispH[v].toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Aggregation popups — shown during agg phase and persist after */}
          {popupRound !== null && NODE_IDS.map(v => {
            const pos    = POPUP_POS[v];
            const nbrs   = NEIGHBORS[v];
            const lines  = nbrs.map(u => `${u}: ${features[u][popupRound].toFixed(2)}`);
            const resVal = aggResult(nbrs.map(u => features[u][popupRound]), aggregation);
            lines.push(`→${aggregation.slice(0, 3)}: ${resVal.toFixed(3)}`);
            const boxH   = lines.length * POPUP_LINE + POPUP_PAD * 2;
            return (
              <g key={`pop-${v}`}>
                <rect x={pos.x} y={pos.y} width={POPUP_W} height={boxH}
                  fill={C.bg3} stroke={C.accent} strokeWidth={0.5}
                  rx={3} opacity={0.93} />
                {lines.map((ln, i) => (
                  <text key={i}
                    x={pos.x + POPUP_PAD}
                    y={pos.y + POPUP_PAD + 9 + i * POPUP_LINE}
                    fill={i === lines.length - 1 ? C.accent : C.textMid}
                    fontSize={9} fontFamily="JetBrains Mono, monospace">
                    {ln}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Stats strip ── */}
      <div style={stripStyle}>
        <StatCell label="round" val={String(round)} />
        <StatCell label="mode"  val={aggregation[0].toUpperCase() + aggregation.slice(1)} />
        <VSep />
        <StatCell label="μ"   val={stats.mean.toFixed(2)} />
        <StatCell label="σ"   val={stats.std.toFixed(2)} />
        <VSep />
        <StatCell label="min" val={`${dispH[minNode].toFixed(2)} (${minNode})`} />
        <StatCell label="max" val={`${dispH[maxNode].toFixed(2)} (${maxNode})`} />
        <VSep />
        <StatCell label="var" val={stats.variance.toFixed(3)} />
        {selectedNode && (
          <>
            <VSep />
            <StatCell label="node" val={selectedNode} hi />
            {[0,1,2,3].map(r => (
              <StatCell key={r} label={`R${r}`}
                val={features[selectedNode][r].toFixed(3)}
                hi={r === round} />
            ))}
          </>
        )}
      </div>

      {/* ── Feature history panel ── */}
      {selectedNode && (
        <HistoryPanel
          node={selectedNode}
          features={features}
          agg={aggregation}
          currentRound={round}
        />
      )}

      {/* ── Controls ── */}
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button disabled={nextBtnDisabled} onClick={startNextRound}
            style={{ ...btnS(nextBtnDisabled, !nextBtnDisabled), padding: '6px 16px' }}>
            {round >= 3 ? 'Max rounds reached' : `Round ${round} → ${round + 1}`}
          </button>
          <button onClick={reset} style={btnS(false)}>↺ Reset</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...mono, fontSize: '11px', color: C.textMute, flexShrink: 0 }}>Aggregation</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['mean', 'sum', 'max'].map(agg => (
              <button key={agg} disabled={isAnim} onClick={() => changeAgg(agg)}
                style={{
                  padding: '3px 10px', borderRadius: '4px',
                  border: `1px solid ${agg === aggregation ? C.accent : C.border}`,
                  background: agg === aggregation ? 'var(--accent-dim)' : C.bg4,
                  color: agg === aggregation ? C.accent : C.textMid,
                  ...mono, fontSize: '11px',
                  cursor: isAnim ? 'not-allowed' : 'pointer',
                  opacity: isAnim ? 0.5 : 1,
                }}>
                {agg[0].toUpperCase() + agg.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...mono, fontSize: '11px', color: C.textMute, flexShrink: 0 }}>Speed</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[['normal','Normal'],['fast','Fast']].map(([s, lbl]) => (
              <button key={s} disabled={isAnim} onClick={() => setSpeed(s)}
                style={{
                  padding: '3px 10px', borderRadius: '4px',
                  border: `1px solid ${s === speed ? C.accent : C.border}`,
                  background: s === speed ? 'var(--accent-dim)' : C.bg4,
                  color: s === speed ? C.accent : C.textMid,
                  ...mono, fontSize: '11px',
                  cursor: isAnim ? 'not-allowed' : 'pointer',
                  opacity: isAnim ? 0.5 : 1,
                }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

    </WidgetCard>
  );
}
