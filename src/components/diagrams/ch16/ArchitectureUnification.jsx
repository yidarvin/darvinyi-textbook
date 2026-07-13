const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.18)',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const TITLE_Y = 58;
const GRAPH_CY = 165;
const SUB_Y = 270;
const EQUIV_Y = 298;

function PanelHeader({ cx, title }) {
  return (
    <text x={cx} y={TITLE_Y} textAnchor="middle"
          fontFamily={mono} fontSize="11" fill={C.text}>
      {title}
    </text>
  );
}

function PanelFooter({ cx, sub, equiv }) {
  return (
    <g>
      <text x={cx} y={SUB_Y} textAnchor="middle"
            fontFamily={sans} fontSize="10" fill={C.muted2} fontStyle="italic">
        {sub}
      </text>
      <text x={cx} y={EQUIV_Y} textAnchor="middle"
            fontFamily={mono} fontSize="10" fill={C.muted}>
        {equiv}
      </text>
    </g>
  );
}

function PanelRNN({ cx }) {
  const cy = GRAPH_CY;
  const dx = 26;
  const xs = [cx - 2 * dx, cx - dx, cx, cx + dx, cx + 2 * dx];
  return (
    <g>
      <PanelHeader cx={cx} title="RNN — chain" />
      {/* Arrows between consecutive nodes */}
      {xs.slice(0, -1).map((x, i) => (
        <line key={`e-${i}`}
              x1={x + 8} y1={cy}
              x2={xs[i + 1] - 9} y2={cy}
              stroke={C.muted2} strokeWidth="1.3"
              markerEnd="url(#arch-arrow)" />
      ))}
      {/* Nodes */}
      {xs.map((x, i) => (
        <circle key={`n-${i}`}
                cx={x} cy={cy} r="7"
                fill={C.bg3} stroke={C.borderLt} strokeWidth="1.5" />
      ))}
      <PanelFooter cx={cx}
                   sub="previous-token only"
                   equiv="RNN ≡ MP on a chain" />
    </g>
  );
}

function PanelCNN({ cx }) {
  const sp = 26;
  const gridW = 3 * sp;
  const x0 = cx - gridW / 2;
  const y0 = GRAPH_CY - gridW / 2;
  const nodes = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      nodes.push({ x: x0 + c * sp, y: y0 + r * sp, r, c });
    }
  }
  const cr = 1, cc = 2; // highlighted center
  const isCenter = (n) => n.r === cr && n.c === cc;
  const isNeighbor = (n) =>
    (Math.abs(n.r - cr) === 1 && n.c === cc) ||
    (n.r === cr && Math.abs(n.c - cc) === 1);

  const edges = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (c < 3) edges.push([r * 4 + c, r * 4 + (c + 1)]);
      if (r < 3) edges.push([r * 4 + c, (r + 1) * 4 + c]);
    }
  }

  return (
    <g>
      <PanelHeader cx={cx} title="CNN — grid" />
      {edges.map(([a, b], i) => {
        const na = nodes[a], nb = nodes[b];
        const teal =
          (isCenter(na) && isNeighbor(nb)) ||
          (isCenter(nb) && isNeighbor(na));
        return (
          <line key={i}
                x1={na.x} y1={na.y}
                x2={nb.x} y2={nb.y}
                stroke={teal ? C.accent : C.borderLt}
                strokeWidth={teal ? '1.6' : '1'}
                opacity={teal ? 0.95 : 0.7} />
        );
      })}
      {nodes.map((n, i) => (
        <circle key={i}
                cx={n.x} cy={n.y}
                r={isCenter(n) ? 7 : 4.5}
                fill={isCenter(n) ? C.accentDim : C.bg3}
                stroke={isCenter(n) ? C.accent : C.borderLt}
                strokeWidth="1.5" />
      ))}
      <PanelFooter cx={cx}
                   sub="shared kernel everywhere"
                   equiv="CNN ≡ MP on a 2D grid" />
    </g>
  );
}

function PanelTransformer({ cx }) {
  const cy = GRAPH_CY;
  const r = 46;
  const angles = [90, 30, -30, -90, -150, 150];
  const nodes = angles.map((a) => {
    const rad = (a * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  });
  const hi = 0;
  const edges = [];
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) {
      edges.push([i, j]);
    }
  }
  return (
    <g>
      <PanelHeader cx={cx} title="Transformer — K_n" />
      {edges.map(([a, b], i) => {
        const teal = a === hi || b === hi;
        return (
          <line key={i}
                x1={nodes[a].x} y1={nodes[a].y}
                x2={nodes[b].x} y2={nodes[b].y}
                stroke={teal ? C.accent : C.borderLt}
                strokeWidth={teal ? '1.4' : '0.9'}
                opacity={teal ? 0.85 : 0.5} />
        );
      })}
      {nodes.map((n, i) => (
        <circle key={i}
                cx={n.x} cy={n.y}
                r={i === hi ? 7 : 4.5}
                fill={i === hi ? C.accentDim : C.bg3}
                stroke={i === hi ? C.accent : C.borderLt}
                strokeWidth="1.5" />
      ))}
      <PanelFooter cx={cx}
                   sub="learned attention α_ij"
                   equiv="Tfmr ≡ GAT on K_n" />
    </g>
  );
}

function PanelGNN({ cx }) {
  // Local coords centered on (0,0), shifted by cx and GRAPH_CY
  const local = [
    { x: -42, y: -50 },
    { x:   2, y: -38 },
    { x:  46, y: -56 },
    { x: -24, y:   0 },
    { x:  22, y:  14 },
    { x: -48, y:  42 },
    { x:   0, y:  56 },
    { x:  48, y:  38 },
  ];
  const nodes = local.map((p) => ({ x: cx + p.x, y: GRAPH_CY + p.y }));
  const edges = [
    [0, 1], [1, 2], [1, 3], [1, 4], [2, 4],
    [3, 4], [3, 5], [4, 7], [5, 6], [6, 7], [4, 6],
  ];
  const hi = 4;
  return (
    <g>
      <PanelHeader cx={cx} title="GNN — arbitrary" />
      {edges.map(([a, b], i) => {
        const teal = a === hi || b === hi;
        return (
          <line key={i}
                x1={nodes[a].x} y1={nodes[a].y}
                x2={nodes[b].x} y2={nodes[b].y}
                stroke={teal ? C.accent : C.borderLt}
                strokeWidth={teal ? '1.4' : '1'}
                opacity={teal ? 0.85 : 0.7} />
        );
      })}
      {nodes.map((n, i) => (
        <circle key={i}
                cx={n.x} cy={n.y}
                r={i === hi ? 7 : 4.5}
                fill={i === hi ? C.accentDim : C.bg3}
                stroke={i === hi ? C.accent : C.borderLt}
                strokeWidth="1.5" />
      ))}
      <PanelFooter cx={cx}
                   sub="topology from data"
                   equiv="GNN ≡ MP on any graph" />
    </g>
  );
}

export default function ArchitectureUnification() {
  // Panel centers across viewBox width 640: 4 panels of 160 each → centers 80, 240, 400, 560
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg viewBox="0 0 640 340" width="100%" role="img"
           aria-label="RNN, CNN, transformer, and GNN as message passing on different graph topologies"
           style={{ display: 'block' }}>
        <defs>
          <marker id="arch-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* Top label */}
        <text x="320" y="26" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.muted2}
              letterSpacing="0.1em">
          ONE OPERATION · FOUR TOPOLOGIES
        </text>

        {/* Panels */}
        <PanelRNN cx={80} />
        <PanelCNN cx={240} />
        <PanelTransformer cx={400} />
        <PanelGNN cx={560} />

        {/* Panel dividers */}
        <line x1="160" y1="42" x2="160" y2="315"
              stroke={C.border} strokeWidth="1"
              strokeDasharray="3,3" opacity="0.6" />
        <line x1="320" y1="42" x2="320" y2="315"
              stroke={C.border} strokeWidth="1"
              strokeDasharray="3,3" opacity="0.6" />
        <line x1="480" y1="42" x2="480" y2="315"
              stroke={C.border} strokeWidth="1"
              strokeDasharray="3,3" opacity="0.6" />
      </svg>

      <figcaption style={{
        fontFamily: sans, fontSize: '12px', color: C.muted,
        textAlign: 'center', marginTop: '10px', lineHeight: 1.5,
      }}>
        RNN, CNN, Transformer, and GNN are all instances of message passing —
        what differs is the graph structure each operates over.
      </figcaption>
    </figure>
  );
}
