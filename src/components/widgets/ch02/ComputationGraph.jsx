import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Precomputed forward + backward pass ────────────────────────────────────
// Network: x=[0.8,0.3], tanh hidden, sigmoid output, L=½(ŷ−1)²
// W1=[[0.5,−0.3,0.8],[0.2,0.7,−0.5]], b1=[0.1,−0.2,0.3]
// W2=[0.6,−0.4,0.7], b2=0.1
//
// Forward:  z1=[0.56,−0.23,0.79] → h=[0.508,−0.226,0.658]
//           z2=0.956 → ŷ=0.722  →  L=0.039
// Backward: dL/dŷ=−0.278, dL/dz2=−0.056
//           dL/dh=[−0.033,+0.022,−0.039]
//           dL/dx=[−0.036,+0.021]

const R = 22; // node radius px
const ANN_W = 150, ANN_H = 26; // annotation box size

// annotDx/annotDy: offset from node center to annotation box center
const NODES = [
  { id: 'x1',   label: 'x₁', x:  60, y:  70, value:  0.800, grad: -0.036, annotDx:  25, annotDy: -44 },
  { id: 'x2',   label: 'x₂', x:  60, y: 130, value:  0.300, grad: +0.021, annotDx:  25, annotDy: +44 },
  { id: 'h1',   label: 'h₁', x: 220, y:  43, value:  0.508, grad: -0.033, annotDx:  36, annotDy:   0 },
  { id: 'h2',   label: 'h₂', x: 220, y: 100, value: -0.226, grad: +0.022, annotDx:  36, annotDy:   0 },
  { id: 'h3',   label: 'h₃', x: 220, y: 157, value:  0.658, grad: -0.039, annotDx:  36, annotDy:   0 },
  { id: 'yhat', label: 'ŷ',  x: 380, y: 100, value:  0.722, grad: -0.278, annotDx:   0, annotDy: -44 },
  { id: 'L',    label: 'L',  x: 500, y: 100, value:  0.039, grad:  1.000, annotDx: -90, annotDy:   0 },
];

const NODE_MAP = Object.fromEntries(NODES.map(n => [n.id, n]));

// gradMag = |dL/dW| for that weight edge (or |dL/dz2| for ŷ→L)
const EDGES = [
  { id: 'x1-h1',   from: 'x1',   to: 'h1',   gradMag: 0.020 },
  { id: 'x1-h2',   from: 'x1',   to: 'h2',   gradMag: 0.017 },
  { id: 'x1-h3',   from: 'x1',   to: 'h3',   gradMag: 0.018 },
  { id: 'x2-h1',   from: 'x2',   to: 'h1',   gradMag: 0.007 },
  { id: 'x2-h2',   from: 'x2',   to: 'h2',   gradMag: 0.006 },
  { id: 'x2-h3',   from: 'x2',   to: 'h3',   gradMag: 0.007 },
  { id: 'h1-yhat', from: 'h1',   to: 'yhat', gradMag: 0.028 },
  { id: 'h2-yhat', from: 'h2',   to: 'yhat', gradMag: 0.013 },
  { id: 'h3-yhat', from: 'h3',   to: 'yhat', gradMag: 0.037 },
  { id: 'yhat-L',  from: 'yhat', to: 'L',    gradMag: 0.056 },
];

const MAX_GRAD_MAG = 0.056;

// Edges + nodes lit on backward path from each node to L
const PATHS = {
  x1:   {
    nodes: new Set(['x1',  'h1','h2','h3','yhat','L']),
    edges: new Set(['x1-h1','x1-h2','x1-h3','h1-yhat','h2-yhat','h3-yhat','yhat-L']),
  },
  x2:   {
    nodes: new Set(['x2',  'h1','h2','h3','yhat','L']),
    edges: new Set(['x2-h1','x2-h2','x2-h3','h1-yhat','h2-yhat','h3-yhat','yhat-L']),
  },
  h1:   { nodes: new Set(['h1','yhat','L']),   edges: new Set(['h1-yhat','yhat-L']) },
  h2:   { nodes: new Set(['h2','yhat','L']),   edges: new Set(['h2-yhat','yhat-L']) },
  h3:   { nodes: new Set(['h3','yhat','L']),   edges: new Set(['h3-yhat','yhat-L']) },
  yhat: { nodes: new Set(['yhat','L']),         edges: new Set(['yhat-L']) },
  L:    { nodes: new Set(['L']),                edges: new Set() },
};

const MONO = "'JetBrains Mono', monospace";

// Returns clipped edge endpoints at node circumference
function edgePts(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d  = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / d, uy = dy / d;
  return {
    x1: a.x + ux * R,        y1: a.y + uy * R,
    x2: b.x - ux * (R + 7),  y2: b.y - uy * (R + 7), // 7px for arrowhead
  };
}

function gradSign(g) {
  return g >= 0 ? `+${g.toFixed(3)}` : g.toFixed(3);
}

// ─── Toggle button ────────────────────────────────────────────────────────────
function Toggle({ label, on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      fontFamily: MONO, fontSize: '11px', padding: '4px 10px',
      borderRadius: '4px', border: '1px solid', cursor: 'pointer',
      borderColor: on ? 'var(--accent)' : 'var(--border)',
      background:  on ? 'var(--accent-dim)' : 'transparent',
      color:       on ? 'var(--accent)' : 'var(--text-muted)',
      transition: 'all 0.12s',
    }}>
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ComputationGraph() {
  const [hovered,       setHovered]       = useState(null);
  const [pinned,        setPinned]        = useState(null);
  const [showValues,    setShowValues]    = useState(true);
  const [showGradients, setShowGradients] = useState(false);

  const active = pinned ?? hovered;
  const path   = active ? PATHS[active] : null;

  function handleEnter(id) { if (!pinned) setHovered(id); }
  function handleLeave()   { if (!pinned) setHovered(null); }
  function handleClick(id) {
    setPinned(prev => {
      if (prev === id) { setHovered(null); return null; }
      return id;
    });
  }

  return (
    <WidgetCard title="Computation Graph — hover to trace gradients" number="2.2">

      {/* ── SVG graph ── */}
      <div style={{
        background: '#0a0a0a', borderRadius: '6px',
        border: '1px solid var(--border)', overflow: 'hidden',
        marginBottom: '14px',
      }}>
        <svg viewBox="0 0 560 200" width="100%" style={{ display: 'block', height: '200px' }}>
          <defs>
            {/* dim arrowhead */}
            <marker id="cg-arr" markerWidth="7" markerHeight="7"
              refX="6" refY="3.5" orient="auto">
              <path d="M0,1 L0,6 L5.5,3.5 z" fill="#2e2e2e" />
            </marker>
            {/* accent arrowhead */}
            <marker id="cg-arr-a" markerWidth="7" markerHeight="7"
              refX="6" refY="3.5" orient="auto">
              <path d="M0,1 L0,6 L5.5,3.5 z" fill="#2dd4bf" />
            </marker>
          </defs>

          {/* ── Edges ── */}
          {EDGES.map(edge => {
            const fn = NODE_MAP[edge.from], tn = NODE_MAP[edge.to];
            const pts = edgePts(fn, tn);
            const isOn  = path?.edges.has(edge.id) ?? false;
            const isDim = !!path && !isOn;
            const gradW = showGradients
              ? 1.2 + 3.3 * (edge.gradMag / MAX_GRAD_MAG)
              : 1.2;
            return (
              <line key={edge.id}
                x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
                stroke={isOn ? '#2dd4bf' : '#2e2e2e'}
                strokeWidth={isOn ? 2.5 : gradW}
                strokeOpacity={isDim ? 0.2 : 1}
                markerEnd={isOn ? 'url(#cg-arr-a)' : 'url(#cg-arr)'}
              />
            );
          })}

          {/* ── Nodes ── */}
          {NODES.map(node => {
            const isOn  = path?.nodes.has(node.id) ?? false;
            const isDim = !!path && !isOn;
            return (
              <g key={node.id}
                onMouseEnter={() => handleEnter(node.id)}
                onMouseLeave={handleLeave}
                onClick={() => handleClick(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow ring */}
                {isOn && (
                  <circle cx={node.x} cy={node.y} r={R + 7}
                    fill="rgba(45,212,191,0.07)" />
                )}
                {/* Body */}
                <circle
                  cx={node.x} cy={node.y} r={R}
                  fill={isOn ? '#0b2422' : '#161616'}
                  fillOpacity={isDim ? 0.45 : 1}
                  stroke={isOn ? '#2dd4bf' : '#2e2e2e'}
                  strokeWidth={isOn ? 2 : 1.5}
                  strokeOpacity={isDim ? 0.25 : 1}
                />
                {/* Label */}
                <text
                  x={node.x} y={node.y + (showValues ? -5 : 4)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontFamily={MONO} fontSize="10"
                  fill={isOn ? '#2dd4bf' : isDim ? '#444444' : '#888888'}
                >
                  {node.label}
                </text>
                {/* Value */}
                {showValues && (
                  <text
                    x={node.x} y={node.y + 9}
                    textAnchor="middle" dominantBaseline="middle"
                    fontFamily={MONO} fontSize="7.5"
                    fill={isOn ? 'rgba(45,212,191,0.65)' : isDim ? '#333333' : '#555555'}
                  >
                    {node.value.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Annotation on active node ── */}
          {active && (() => {
            const n  = NODE_MAP[active];
            const cx = n.x + n.annotDx;
            const cy = n.y + n.annotDy;
            const bx = cx - ANN_W / 2;
            const by = cy - ANN_H / 2;
            const text = `∂L/∂${n.label} = ${gradSign(n.grad)}`;
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={bx} y={by} width={ANN_W} height={ANN_H} rx="4"
                  fill="#161616" stroke="#2dd4bf" strokeWidth="1"
                />
                <text
                  x={cx} y={cy + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontFamily={MONO} fontSize="9.5"
                  fill="#fbbf24"
                >
                  {text}
                </text>
              </g>
            );
          })()}

          {/* Layer labels */}
          {[['input', 60], ['hidden', 220], ['output', 380], ['loss', 500]].map(([lbl, lx]) => (
            <text key={lbl} x={lx} y={194}
              textAnchor="middle" fontFamily={MONO} fontSize="8"
              fill="#333333" letterSpacing="0.05em">
              {lbl}
            </text>
          ))}
        </svg>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)',
          flex: 1,
        }}>
          {pinned
            ? `pinned: ${NODE_MAP[pinned].label} — click again to unpin`
            : 'hover a node to trace its gradient path to L'}
        </span>
        <Toggle label="show values"    on={showValues}    onToggle={() => setShowValues(v => !v)} />
        <Toggle label="show gradients" on={showGradients} onToggle={() => setShowGradients(v => !v)} />
      </div>

    </WidgetCard>
  );
}
