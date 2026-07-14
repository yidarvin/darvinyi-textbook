import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Graph definition ──────────────────────────────────────────────────────────

const NODE_POS = {
  1:  { x: 80,  y: 100 },
  2:  { x: 60,  y: 200 },
  3:  { x: 150, y: 70  },
  4:  { x: 140, y: 220 },
  5:  { x: 280, y: 80  },
  6:  { x: 260, y: 180 },
  7:  { x: 340, y: 140 },
  8:  { x: 310, y: 260 },
  9:  { x: 450, y: 90  },
  10: { x: 480, y: 190 },
  11: { x: 400, y: 230 },
  12: { x: 430, y: 310 },
};

const EDGES = [
  [1,2],[1,3],[2,4],[3,4],
  [5,6],[5,7],[6,8],[7,8],[6,7],
  [9,10],[9,11],[10,12],[11,12],[10,11],
  [3,5],[4,6],[7,9],[8,11],
];

const BRIDGE_SET = new Set(['3-5','5-3','4-6','6-4','7-9','9-7','8-11','11-8']);

const SEEDS  = { 1: 'A', 7: 'B', 10: 'C' };
const COMM   = { 1:1, 2:1, 3:1, 4:1, 5:2, 6:2, 7:2, 8:2, 9:3, 10:3, 11:3, 12:3 };

const SVG_W = 560, SVG_H = 340, R = 18;

// ── Colors ────────────────────────────────────────────────────────────────────

const C = {
  accent:   '#2dd4bf',
  orange:   '#fb923c',
  purple:   '#a78bfa',
  bg2:      '#111111',
  bg3:      '#161616',
  bg4:      '#1e1e1e',
  border:   '#242424',
  borderLt: '#2e2e2e',
  textMid:  '#888888',
  textMute: '#555555',
  codeBg:   '#0a0a0a',
  math:     '#fbbf24',
  green:    '#34d399',
  red:      '#f87171',
};

const CLS_COLOR  = { A: C.accent,  B: C.orange,  C: C.purple  };
const COMM_COLOR = { 1: C.accent,  2: C.orange,  3: C.purple  };

const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ── BFS distances from each seed ──────────────────────────────────────────────

const ADJ = (() => {
  const a = {};
  for (let i = 1; i <= 12; i++) a[i] = [];
  for (const [u, v] of EDGES) { a[u].push(v); a[v].push(u); }
  return a;
})();

function bfsDist(start) {
  const d = new Array(13).fill(Infinity);
  d[start] = 0;
  const q = [start];
  while (q.length) {
    const u = q.shift();
    for (const v of ADJ[u]) {
      if (d[v] === Infinity) { d[v] = d[u] + 1; q.push(v); }
    }
  }
  return d;
}

const DIST_A = bfsDist(1);
const DIST_B = bfsDist(7);
const DIST_C = bfsDist(10);

// ── Precompute predictions for all depths ─────────────────────────────────────

function computePred(nodeId, k) {
  const reach = [];
  if (DIST_A[nodeId] <= k) reach.push(['A', DIST_A[nodeId]]);
  if (DIST_B[nodeId] <= k) reach.push(['B', DIST_B[nodeId]]);
  if (DIST_C[nodeId] <= k) reach.push(['C', DIST_C[nodeId]]);
  if (!reach.length) return null;
  const minD = Math.min(...reach.map(([, d]) => d));
  const winners = reach.filter(([, d]) => d === minD).map(([c]) => c);
  return winners.length === 1 ? winners[0] : 'contested';
}

const PRED = {};
for (let k = 0; k <= 4; k++) {
  PRED[k] = {};
  for (let i = 1; i <= 12; i++) PRED[k][i] = computePred(i, k);
}

// Returns [leftClass, rightClass] sorted alphabetically for a contested node
function contestClasses(nodeId) {
  const tied = [];
  const minD = Math.min(DIST_A[nodeId], DIST_B[nodeId], DIST_C[nodeId]);
  if (DIST_A[nodeId] === minD) tied.push('A');
  if (DIST_B[nodeId] === minD) tied.push('B');
  if (DIST_C[nodeId] === minD) tied.push('C');
  tied.sort();
  return tied;
}

// Hard-assign contested node to first alphabetical winner
function hardAssign(nodeId, k) {
  const p = PRED[k][nodeId];
  if (p !== 'contested') return p;
  return contestClasses(nodeId)[0];
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function getStats(k, showContested) {
  let countA = 0, countB = 0, countC = 0, cntd = 0, unlabeled = 0;
  let correct = 0, totalLabeled = 0;
  for (let i = 1; i <= 12; i++) {
    const raw = PRED[k][i];
    if (raw === null) { unlabeled++; continue; }
    totalLabeled++;
    const trueCls = COMM[i] === 1 ? 'A' : COMM[i] === 2 ? 'B' : 'C';
    if (raw === 'contested' && showContested) {
      cntd++;
    } else {
      const eff = showContested ? raw : hardAssign(i, k);
      if (eff === 'A') countA++;
      else if (eff === 'B') countB++;
      else countC++;
      if (eff === trueCls) correct++;
    }
  }
  return { countA, countB, countC, cntd, unlabeled, correct, totalLabeled,
           accuracy: totalLabeled > 0 ? correct / totalLabeled : null };
}

// ── SVG animation styles ──────────────────────────────────────────────────────

const ANIM_CSS = `
  .nc-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: nc-kf 0.45s ease-in-out;
  }
  @keyframes nc-kf {
    0%   { transform: scale(1);    }
    50%  { transform: scale(1.25); }
    100% { transform: scale(1);    }
  }
`;

// ── Button helper ─────────────────────────────────────────────────────────────

function btnSty(active = false) {
  return {
    padding: '5px 12px', borderRadius: '4px',
    border: `1px solid ${active ? C.accent : C.borderLt}`,
    background: active ? 'var(--accent-dim)' : C.bg4,
    color: active ? C.accent : C.textMid,
    ...mono, fontSize: '11px', cursor: 'pointer', flexShrink: 0,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NodeClassification({ tryThis }) {
  const [depth,        setDepth]        = useState(0);
  const [showGT,       setShowGT]       = useState(false);
  const [showContested,setShowContested]= useState(true);
  const [playing,      setPlaying]      = useState(false);
  const [pulsing,      setPulsing]      = useState(new Set());

  const prevDepthRef = useRef(0);
  const timerRef     = useRef(null);

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) return;
    if (depth >= 4) { setPlaying(false); return; }
    timerRef.current = setTimeout(() => setDepth(d => d + 1), 800);
    return () => clearTimeout(timerRef.current);
  }, [playing, depth]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Pulse nodes that change status when depth changes
  useEffect(() => {
    const prev = prevDepthRef.current;
    prevDepthRef.current = depth;
    if (prev === depth) return;
    const changed = new Set();
    for (let i = 1; i <= 12; i++) {
      if (PRED[prev]?.[i] !== PRED[depth]?.[i]) changed.add(i);
    }
    if (changed.size) {
      setPulsing(changed);
      const t = setTimeout(() => setPulsing(new Set()), 500);
      return () => clearTimeout(t);
    }
  }, [depth]);

  function handlePlay() {
    if (depth >= 4) { setDepth(0); setPlaying(true); }
    else setPlaying(p => !p);
  }

  function handleSlider(e) {
    setPlaying(false);
    setDepth(+e.target.value);
  }

  // Effective prediction respecting showContested toggle
  function effPred(id) {
    const raw = PRED[depth][id];
    if (!showContested && raw === 'contested') return hardAssign(id, depth);
    return raw;
  }

  function nodeFill(id) {
    const p = effPred(id);
    if (!p || p === 'contested') return C.bg3;
    return CLS_COLOR[p];
  }

  function nodeStroke(id) {
    return effPred(id) ? 'rgba(255,255,255,0.7)' : C.borderLt;
  }

  function bridgeInfo(id) {
    const p = effPred(id);
    if (!p)            return { text: '—',         color: C.textMute };
    if (p === 'contested') return { text: 'contested', color: C.math   };
    return { text: `Class ${p}`, color: CLS_COLOR[p] };
  }

  const stats = getStats(depth, showContested);

  return (
    <WidgetCard title="Node Classification — labels spread through the graph" number="16.3" tryThis={tryThis}>

      {/* ── Canvas + Stats ── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* SVG Canvas */}
        <div style={{ flex: 1, minWidth: 0, background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
            <style>{ANIM_CSS}</style>
            <rect x={0} y={0} width={SVG_W} height={SVG_H} fill={C.codeBg} />

            {/* Edges */}
            {EDGES.map(([u, v]) => (
              <line key={`e${u}-${v}`}
                x1={NODE_POS[u].x} y1={NODE_POS[u].y}
                x2={NODE_POS[v].x} y2={NODE_POS[v].y}
                stroke={BRIDGE_SET.has(`${u}-${v}`) ? '#3d3d3d' : C.borderLt}
                strokeWidth={1.5}
              />
            ))}

            {/* Nodes */}
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(id => {
              const { x: cx, y: cy } = NODE_POS[id];
              const raw       = PRED[depth][id];
              const isUnlabeled = raw === null;
              const isCntd    = raw === 'contested' && showContested;
              const isSeed    = id in SEEDS;
              const cCls      = isCntd ? contestClasses(id) : null;

              return (
                <g key={`n${id}`}
                  className={pulsing.has(id) ? 'nc-pulse' : undefined}
                  opacity={isUnlabeled ? 0.7 : 1}
                >
                  {/* Ground truth community ring */}
                  {showGT && (
                    <circle cx={cx} cy={cy} r={R + 5}
                      fill="none"
                      stroke={COMM_COLOR[COMM[id]]}
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      opacity={0.55}
                    />
                  )}

                  {/* Node fill: split circle for contested, solid for others */}
                  {isCntd ? (
                    <>
                      <path
                        d={`M ${cx} ${cy} L ${cx} ${cy - R} A ${R} ${R} 0 0 0 ${cx} ${cy + R} Z`}
                        fill={CLS_COLOR[cCls[0]]}
                      />
                      <path
                        d={`M ${cx} ${cy} L ${cx} ${cy - R} A ${R} ${R} 0 0 1 ${cx} ${cy + R} Z`}
                        fill={CLS_COLOR[cCls[1]]}
                      />
                      <circle cx={cx} cy={cy} r={R}
                        fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5}
                      />
                    </>
                  ) : (
                    <circle cx={cx} cy={cy} r={R}
                      fill={nodeFill(id)}
                      stroke={nodeStroke(id)}
                      strokeWidth={1.5}
                      style={{ transition: 'fill 400ms ease' }}
                    />
                  )}

                  {/* Node label */}
                  <text x={cx} y={cy} dy="0.35em"
                    textAnchor="middle"
                    fill={isCntd || effPred(id) ? 'white' : C.textMid}
                    fontSize={9}
                    fontFamily="JetBrains Mono, monospace"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {isCntd ? '?' : String(id)}
                  </text>

                  {/* Seed badge ★ */}
                  {isSeed && (
                    <text x={cx + 14} y={cy - 14}
                      textAnchor="middle"
                      fill={CLS_COLOR[SEEDS[id]]}
                      fontSize={8}
                      fontFamily="JetBrains Mono, monospace"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      ★
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Stats Panel */}
        <div style={{
          width: 180, flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>

          {/* Depth */}
          <div>
            <div style={{ ...mono, fontSize: '9px', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>
              Depth k
            </div>
            <div style={{ ...mono, fontSize: '22px', color: C.accent }}>{depth}</div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: 0 }} />

          {/* Label counts */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ ...mono, fontSize: '9px', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Labeled
              </span>
              <span style={{ ...mono, fontSize: '11px', color: C.textMid }}>
                {stats.countA + stats.countB + stats.countC + stats.cntd} / 12
              </span>
            </div>
            {(['A', 'B', 'C']).map(cls => (
              <div key={cls} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ ...mono, fontSize: '10px', color: C.textMute }}>Class {cls}</span>
                <span style={{ ...mono, fontSize: '10px', color: CLS_COLOR[cls] }}>
                  {cls === 'A' ? stats.countA : cls === 'B' ? stats.countB : stats.countC}
                </span>
              </div>
            ))}
            {showContested && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ ...mono, fontSize: '10px', color: C.textMute }}>Contested</span>
                <span style={{ ...mono, fontSize: '10px', color: C.math }}>{stats.cntd}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ ...mono, fontSize: '10px', color: C.textMute }}>Unlabeled</span>
              <span style={{ ...mono, fontSize: '10px', color: C.textMid }}>{stats.unlabeled}</span>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: 0 }} />

          {/* Accuracy */}
          <div>
            <div style={{ ...mono, fontSize: '9px', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
              Accuracy
            </div>
            {stats.accuracy !== null ? (
              <>
                <div style={{ ...mono, fontSize: '10px', color: C.textMid, marginBottom: '2px' }}>
                  {stats.correct} / {stats.totalLabeled}
                </div>
                <div style={{ ...mono, fontSize: '16px', color: stats.accuracy >= 0.9 ? C.green : stats.accuracy >= 0.7 ? C.math : C.red }}>
                  {(stats.accuracy * 100).toFixed(1)}%
                </div>
              </>
            ) : (
              <div style={{ ...mono, fontSize: '12px', color: C.textMute }}>—</div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: 0 }} />

          {/* Bridge nodes */}
          <div>
            <div style={{ ...mono, fontSize: '9px', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Bridge nodes
            </div>
            {[[4,'A–B'],[9,'B–C']].map(([nid, lbl]) => {
              const bi = bridgeInfo(nid);
              return (
                <div key={nid} style={{ marginBottom: '5px' }}>
                  <div style={{ ...mono, fontSize: '9px', color: C.textMute }}>
                    Node {nid} ({lbl})
                  </div>
                  <div style={{ ...mono, fontSize: '10px', color: bi.color }}>
                    {bi.text}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Depth slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...mono, fontSize: '11px', color: C.textMute, flexShrink: 0 }}>
            GNN depth k
          </span>
          <input type="range" min={0} max={4} step={1} value={depth}
            onChange={handleSlider}
            style={{ flex: 1, minWidth: 80 }}
          />
          <span style={{ ...mono, fontSize: '13px', color: C.accent, flexShrink: 0, minWidth: '14px', textAlign: 'right' }}>
            {depth}
          </span>
        </div>

        <div style={{ ...mono, fontSize: '10px', color: C.textMute, marginTop: '-4px' }}>
          Each node sees its {depth}-hop neighborhood.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handlePlay} style={btnSty(playing)}>
            {playing ? '⏸ Pause' : depth >= 4 ? '↺ Replay' : '▶ Play'}
          </button>
          <button onClick={() => setShowGT(g => !g)} style={btnSty(showGT)}>
            Ground truth {showGT ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setShowContested(c => !c)} style={btnSty(showContested)}>
            Contested {showContested ? 'ON' : 'OFF'}
          </button>
        </div>

      </div>
    </WidgetCard>
  );
}
