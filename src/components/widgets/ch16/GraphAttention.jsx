import { useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Graph definition (same layout as Widget 16.1) ─────────────────────────────

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
  ['A', 'B'], ['A', 'D'], ['B', 'C'], ['B', 'E'],
  ['C', 'F'], ['D', 'E'], ['E', 'F'], ['B', 'F'],
];
const NEIGHBORS = {
  A: ['B', 'D'],
  B: ['A', 'C', 'E', 'F'],
  C: ['B', 'F'],
  D: ['A', 'E'],
  E: ['B', 'D', 'F'],
  F: ['C', 'B', 'E'],
};

const SVG_W = 560;
const SVG_H = 340;
const NODE_R = 24;

// ── Attention weights ─────────────────────────────────────────────────────────

// GAT: e_ij = LeakyReLU(a^T[Wh_i‖Wh_j]) = LeakyReLU(a_src·Wh_i + a_dst·Wh_j)
// (Veličković et al. 2018's own additive decomposition — mathematically
// exact, not a simplification), α_ij = softmax_j(e_ij) over i's neighbors.
// H, W, and a_src/a_dst are hand-authored illustrative constants (no real
// GNN training happened in-browser — see STYLE_GUIDE.md), but the weights
// below ARE genuinely computed from them via that formula, not picked
// directly — the same "toy input, real computation" pattern QKVInspector.jsx
// uses. Contrast GCN_WEIGHTS below, whose values are fixed by graph topology
// alone with no features involved at all.
const NODE_FEATURES = {
  A: [0.9, 0.1, -0.3, 0.4],
  B: [0.2, 0.8, 0.5, -0.2],
  C: [-0.4, 0.6, 0.9, 0.1],
  D: [0.7, -0.5, 0.2, 0.6],
  E: [0.1, 0.3, -0.6, 0.8],
  F: [-0.3, 0.4, 0.7, -0.5],
};
// Scaled 3x from a unit-magnitude base so the resulting attention is
// clearly peaked rather than near-uniform — real trained GAT attention is
// often sharply concentrated (Veličković et al. 2018 Fig. 2), which a
// smaller scale wouldn't visibly demonstrate.
const GAT_W = [
  [1.8, 0.3, -0.6, 0.9],
  [0.6, 2.1, 0.3, -0.3],
  [-0.3, 0.9, 1.8, 0.6],
  [0.9, -0.6, 0.6, 1.5],
];
const GAT_A_SRC = [0.5, -0.3, 0.4, 0.2];
const GAT_A_DST = [0.3, 0.4, -0.2, 0.5];

function matVec(M, v) { return M.map(row => row.reduce((s, x, i) => s + x * v[i], 0)); }
function dotVec(a, b) { return a.reduce((s, x, i) => s + x * b[i], 0); }
function leakyRelu(x, slope = 0.2) { return x >= 0 ? x : slope * x; }
function softmaxArr(arr) {
  const mx = Math.max(...arr);
  const ex = arr.map(v => Math.exp(v - mx));
  const sm = ex.reduce((a, b) => a + b, 0);
  return ex.map(v => v / sm);
}

function computeGATWeights() {
  const Wh = {};
  NODE_IDS.forEach(v => { Wh[v] = matVec(GAT_W, NODE_FEATURES[v]); });
  const srcProj = {}, dstProj = {};
  NODE_IDS.forEach(v => {
    srcProj[v] = dotVec(GAT_A_SRC, Wh[v]);
    dstProj[v] = dotVec(GAT_A_DST, Wh[v]);
  });
  const weights = {};
  NODE_IDS.forEach(i => {
    const nbrs = NEIGHBORS[i];
    const scores = nbrs.map(j => leakyRelu(srcProj[i] + dstProj[j]));
    const alphas = softmaxArr(scores);
    weights[i] = {};
    nbrs.forEach((j, k) => { weights[i][j] = alphas[k]; });
  });
  return weights;
}
const GAT_WEIGHTS = computeGATWeights();

// GCN's true symmetric-normalization weight for edge (u, v) is
// 1 / sqrt(d̃_u · d̃_v), where d̃ = degree + 1 (the self-loop from Ã = A + I).
// Computed from this graph's actual degrees — deg(A,C,D)=2, deg(E,F)=3, deg(B)=4,
// so d̃ = 3, 3, 3, 4, 4, 5 respectively — these are fixed by topology alone,
// not learned, and are unequal across a node's own neighbors whenever those
// neighbors' degrees differ (contrast with GAT_WEIGHTS below, which vary with
// node features instead).
const GCN_WEIGHTS = {
  A: { B: 0.258, D: 0.333 },
  B: { A: 0.258, C: 0.258, E: 0.224, F: 0.224 },
  C: { B: 0.258, F: 0.289 },
  D: { A: 0.333, E: 0.289 },
  E: { B: 0.224, D: 0.289, F: 0.250 },
  F: { C: 0.289, B: 0.224, E: 0.250 },
};

// ── Colors ────────────────────────────────────────────────────────────────────

const CLR = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  text:      '#e8eaed',
  textMid:   '#888888',
  textMute:  '#555555',
  codeBg:    '#0a0a0a',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };
const SVG_MONO = 'JetBrains Mono, monospace';

// ── Utilities ─────────────────────────────────────────────────────────────────

function edgeDispWeight(u, v, weights) {
  return ((weights[u]?.[v] ?? 0) + (weights[v]?.[u] ?? 0)) / 2;
}

function lerpHex(c1, c2, t) {
  t = Math.max(0, Math.min(1, t));
  const p = s => parseInt(s, 16);
  const [r1, g1, b1] = [p(c1.slice(1, 3)), p(c1.slice(3, 5)), p(c1.slice(5, 7))];
  const [r2, g2, b2] = [p(c2.slice(1, 3)), p(c2.slice(3, 5)), p(c2.slice(5, 7))];
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function calcEntropy(wObj) {
  return -Object.values(wObj).reduce((s, w) => (w > 0 ? s + w * Math.log(w) : s), 0);
}

function edgeGeom(u, v) {
  const x1 = NODES[u].x, y1 = NODES[u].y;
  const x2 = NODES[v].x, y2 = NODES[v].y;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  return {
    mx: (x1 + x2) / 2,
    my: (y1 + y2) / 2,
    px: -dy / len,
    py:  dx / len,
  };
}

function computeStats(weights) {
  const all = [];
  for (const [u, nbrs] of Object.entries(weights)) {
    for (const [v, w] of Object.entries(nbrs)) all.push({ u, v, w });
  }
  const ws = all.map(e => e.w);
  const mean = ws.reduce((a, b) => a + b, 0) / ws.length;
  const std = Math.sqrt(ws.reduce((a, x) => a + (x - mean) ** 2, 0) / ws.length);
  const maxEdge = all.reduce((a, e) => (e.w > a.w ? e : a), all[0]);
  const minEdge = all.reduce((a, e) => (e.w < a.w ? e : a), all[0]);
  return { mean, std, maxEdge, minEdge };
}

const GCN_STATS = (() => {
  const st = computeStats(GCN_WEIGHTS);
  const avgH = NODE_IDS.reduce((s, v) => s + calcEntropy(GCN_WEIGHTS[v]), 0) / NODE_IDS.length;
  return { ...st, avgH };
})();

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCell({ label, val, hi }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <span style={{ ...mono, fontSize: '9px', color: CLR.textMute, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
      <span style={{ ...mono, fontSize: '12px', color: hi ? CLR.accent : CLR.textMid }}>
        {val}
      </span>
    </div>
  );
}

function VSep() {
  return <div style={{ width: '1px', background: CLR.border, alignSelf: 'stretch', flexShrink: 0 }} />;
}

function ToggleBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: '4px',
      border: `1px solid ${active ? CLR.accent : CLR.border}`,
      background: active ? CLR.accentDim : CLR.bg4,
      color: active ? CLR.accent : CLR.textMid,
      ...mono, fontSize: '10px', cursor: 'pointer', flexShrink: 0,
    }}>
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GraphAttention({ tryThis }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [mode, setMode] = useState('gat');
  const [showAllWeights, setShowAllWeights] = useState(false);
  const [showSelfLoops, setShowSelfLoops] = useState(false);
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    setBarsVisible(false);
    if (!selectedNode) return;
    const t = setTimeout(() => setBarsVisible(true), 20);
    return () => clearTimeout(t);
  }, [selectedNode, mode]);

  const weights = mode === 'gat' ? GAT_WEIGHTS : GCN_WEIGHTS;
  const stats = computeStats(weights);
  const gatStats = computeStats(GAT_WEIGHTS);

  const selNeighbors = selectedNode ? NEIGHBORS[selectedNode] : [];
  const sortedNeighbors = selectedNode
    ? [...selNeighbors].sort((a, b) => (weights[selectedNode]?.[b] ?? 0) - (weights[selectedNode]?.[a] ?? 0))
    : [];
  const nodeH = selectedNode ? calcEntropy(weights[selectedNode] ?? {}) : null;
  const nodeMost = sortedNeighbors[0] ?? null;
  const nodeLeast = sortedNeighbors[sortedNeighbors.length - 1] ?? null;

  function handleNodeClick(v, e) {
    e.stopPropagation();
    setSelectedNode(prev => (prev === v ? null : v));
  }

  function changeMode(m) {
    setMode(m);
    setSelectedNode(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <WidgetCard title="Graph Attention Weights — which neighbors matter most" number="16.2" tryThis={tryThis}>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{ ...mono, fontSize: '11px', color: CLR.textMute, flexShrink: 0 }}>Mode</span>
        <div style={{ display: 'flex', border: `1px solid ${CLR.border}`, borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
          {[['gat', 'GAT'], ['gcn', 'GCN']].map(([val, lbl], i) => (
            <button key={val} onClick={() => changeMode(val)} style={{
              padding: '4px 18px',
              background: val === mode ? CLR.accentDim : CLR.bg4,
              color: val === mode ? CLR.accent : CLR.textMid,
              border: 'none',
              borderRight: i === 0 ? `1px solid ${CLR.border}` : 'none',
              ...mono, fontSize: '11px', cursor: 'pointer',
            }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <ToggleBtn label="Show all weights" active={showAllWeights} onClick={() => setShowAllWeights(v => !v)} />
        <ToggleBtn label="Self-loops" active={showSelfLoops} onClick={() => setShowSelfLoops(v => !v)} />
      </div>

      {/* Full-width SVG graph */}
      <div style={{ background: CLR.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', cursor: 'default' }}
          onClick={() => setSelectedNode(null)}
        >
          <rect x={0} y={0} width={SVG_W} height={SVG_H} fill={CLR.codeBg} />

          {/* ── Background/dimmed edges ── */}
          {EDGES.map(([u, v]) => {
            const isAdj = selectedNode && (u === selectedNode || v === selectedNode);
            if (isAdj) return null;

            const w = edgeDispWeight(u, v, weights);
            const opacity = selectedNode ? 0.08 : (0.3 + w * 0.7);
            const strokeWidth = selectedNode ? 1.5 : (1 + w * 8);
            const { mx, my, px, py } = edgeGeom(u, v);
            const showLbl = showAllWeights && !selectedNode;

            return (
              <g key={`e-${u}${v}`}>
                <line
                  x1={NODES[u].x} y1={NODES[u].y}
                  x2={NODES[v].x} y2={NODES[v].y}
                  stroke={CLR.borderLt}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeLinecap="round"
                />
                {showLbl && (
                  <text
                    x={mx + px * 10} y={my + py * 10}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={CLR.textMid} fontSize={8} fontFamily={SVG_MONO}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {w.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Outgoing attention edges from selected node ── */}
          {selectedNode && EDGES.map(([u, v]) => {
            const isAdj = u === selectedNode || v === selectedNode;
            if (!isAdj) return null;

            const other = u === selectedNode ? v : u;
            const w = weights[selectedNode]?.[other] ?? 0;
            const opacity = 0.2 + w * 0.8;
            const strokeWidth = Math.max(0.5, w * 10);
            const { mx, my, px, py } = edgeGeom(u, v);

            return (
              <g key={`eo-${u}${v}`}>
                <line
                  x1={NODES[u].x} y1={NODES[u].y}
                  x2={NODES[v].x} y2={NODES[v].y}
                  stroke={CLR.accent}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeLinecap="round"
                />
                <text
                  x={mx + px * 10} y={my + py * 10}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={CLR.accent} fontSize={9} fontFamily={SVG_MONO}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {w.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* ── Self-loops (decorative) ── */}
          {showSelfLoops && NODE_IDS.map(v => {
            const { x: cx, y: cy } = NODES[v];
            return (
              <path key={`sl-${v}`}
                d={`M ${cx - 8} ${cy - NODE_R} C ${cx - 30} ${cy - 56} ${cx + 30} ${cy - 56} ${cx + 8} ${cy - NODE_R}`}
                fill="none"
                stroke={CLR.borderLt}
                strokeWidth={1.5}
                strokeDasharray="4,3"
                opacity={0.45}
              />
            );
          })}

          {/* ── Nodes ── */}
          {NODE_IDS.map(v => {
            const { x: cx, y: cy } = NODES[v];
            const isSel = selectedNode === v;
            const isNbr = selectedNode ? NEIGHBORS[selectedNode].includes(v) : false;
            const isDim = selectedNode && !isSel && !isNbr;
            const outW = isNbr ? (weights[selectedNode]?.[v] ?? 0) : 0;

            const fill = isSel
              ? CLR.accentDim
              : isNbr
                ? lerpHex(CLR.bg3, CLR.accentDim, outW)
                : CLR.bg3;
            const stroke = (isSel || isNbr) ? CLR.accent : CLR.borderLt;
            const strokeWidth = isSel ? 2.5 : 1.5;
            const strokeOpacity = isNbr ? Math.max(0.2, outW) : 1;

            return (
              <g key={v}
                opacity={isDim ? 0.25 : 1}
                onClick={e => handleNodeClick(v, e)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={cx} cy={cy} r={NODE_R}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                />
                <circle cx={cx} cy={cy} r={NODE_R + 4} fill="transparent" />
                <text
                  x={cx} y={isNbr ? cy - 6 : cy}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={isSel ? CLR.accent : CLR.textMid}
                  fontSize={11} fontFamily={SVG_MONO}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {v}
                </text>
                {isNbr && (
                  <text
                    x={cx} y={cy + 11}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={CLR.accent} fontSize={9} fontFamily={SVG_MONO}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {outW.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Attention bar chart (full width, when node selected) ── */}
      {selectedNode && (
        <div style={{
          marginTop: '8px',
          background: CLR.bg3,
          border: `1px solid ${CLR.border}`,
          borderRadius: '6px',
          padding: '12px 16px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginBottom: '10px', gap: '8px',
          }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: CLR.text, flexShrink: 0 }}>
              "Node {selectedNode}" attends to:
            </span>
            <span style={{ ...mono, fontSize: '9px', color: CLR.textMute, textAlign: 'right' }}>
              {mode === 'gat'
                ? 'GAT: softmax(LeakyReLU(a·[Wh_i‖Wh_j])) from node features'
                : 'GCN weights are fixed by degree, not features'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sortedNeighbors.map(nbr => {
              const w = weights[selectedNode]?.[nbr] ?? 0;
              return (
                <div key={nbr} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ ...mono, fontSize: '11px', color: CLR.textMid, width: '14px', flexShrink: 0, textAlign: 'center' }}>
                    {nbr}
                  </span>
                  <div style={{ flex: 1, height: '14px', background: CLR.bg4, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: barsVisible ? `${w * 100}%` : '0%',
                      height: '14px',
                      background: CLR.accent,
                      borderRadius: '2px',
                      transition: 'width 300ms ease-out',
                    }} />
                  </div>
                  <span style={{ ...mono, fontSize: '11px', color: CLR.accent, width: '32px', textAlign: 'right', flexShrink: 0 }}>
                    {w.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stats strip ── */}
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'center',
        background: CLR.bg2, border: `1px solid ${CLR.border}`,
        borderRadius: '8px', padding: '10px 16px', marginTop: '8px',
        flexWrap: 'wrap', rowGap: '8px',
      }}>
        <StatCell label="Mode" val={mode.toUpperCase()} hi />
        <VSep />
        <StatCell label="Max wt" val={`${stats.maxEdge.w.toFixed(2)} ${stats.maxEdge.u}→${stats.maxEdge.v}`} />
        <StatCell label="Min wt" val={`${stats.minEdge.w.toFixed(2)} ${stats.minEdge.u}→${stats.minEdge.v}`} />
        <StatCell label="Mean" val={stats.mean.toFixed(2)} />
        <StatCell label="Std" val={stats.std.toFixed(2)} />
        <VSep />
        <StatCell
          label="Node"
          val={selectedNode ?? '—'}
          hi={!!selectedNode}
        />
        <StatCell
          label="Most"
          val={selectedNode && nodeMost ? `${nodeMost} (${(weights[selectedNode]?.[nodeMost] ?? 0).toFixed(2)})` : '—'}
          hi={!!selectedNode}
        />
        <StatCell
          label="Least"
          val={selectedNode && nodeLeast ? `${nodeLeast} (${(weights[selectedNode]?.[nodeLeast] ?? 0).toFixed(2)})` : '—'}
        />
        <StatCell label="Ent H" val={nodeH?.toFixed(3) ?? '—'} />
        <VSep />
        <StatCell label="GAT σ" val={gatStats.std.toFixed(3)} hi />
        <StatCell label="GCN σ" val={GCN_STATS.std.toFixed(3)} />
        <StatCell label="GCN ent" val={GCN_STATS.avgH.toFixed(3)} />
      </div>

    </WidgetCard>
  );
}
