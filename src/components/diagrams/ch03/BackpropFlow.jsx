const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Nodes along a horizontal axis
const NODE_R   = 22;
const ROW_Y    = 130;
const NODE_CX  = [60, 220, 380, 560];
const NODE_LABELS = ['a⁽⁰⁾', 'a⁽¹⁾', 'a⁽²⁾', 'L'];

// Operation boxes sit between consecutive nodes, centered on the midpoint
const OP_W = 96;
const OP_H = 28;
const OP_LABELS = ['W⁽¹⁾, b⁽¹⁾, σ', 'W⁽²⁾, b⁽²⁾, σ', 'loss'];

// Forward arrows curve over the top of operation boxes (muted grey)
const FWD_LABELS = ['a⁽⁰⁾', 'a⁽¹⁾', 'a⁽²⁾'];

// Backward arrows flow below (teal)
const BWD_LABELS = ['δ⁽⁰⁾', 'δ⁽¹⁾', 'δ⁽²⁾'];
const BWD_OP_LABELS = ['× W⁽¹⁾ᵀ', '× σ′(z⁽¹⁾) · W⁽²⁾ᵀ', '× σ′(z⁽²⁾)'];

function NodeCircle({ cx, label }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={ROW_Y}
        r={NODE_R}
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1.5"
      />
      <text
        x={cx}
        y={ROW_Y + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={C.text}
      >
        {label}
      </text>
    </g>
  );
}

export default function BackpropFlow() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 280"
        width="100%"
        role="img"
        aria-label="Forward and backward signals on a small computation graph"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="bp-arr-muted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
          <marker
            id="bp-arr-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Top row: "forward" label */}
        <text
          x={20}
          y={36}
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted}
        >
          forward →
        </text>

        {/* Operation boxes between nodes */}
        {[0, 1, 2].map(i => {
          const midX = (NODE_CX[i] + NODE_CX[i + 1]) / 2;
          return (
            <g key={`op-${i}`}>
              <rect
                x={midX - OP_W / 2}
                y={ROW_Y - OP_H / 2}
                width={OP_W}
                height={OP_H}
                rx="4"
                fill={C.bg2}
                stroke={C.border}
                strokeWidth="1.5"
              />
              <text
                x={midX}
                y={ROW_Y + 4}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="11"
                fill={C.text}
              >
                {OP_LABELS[i]}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {NODE_CX.map((cx, i) => (
          <NodeCircle key={`node-${i}`} cx={cx} label={NODE_LABELS[i]} />
        ))}

        {/* Forward arrows (above the row, muted) */}
        {[0, 1, 2].map(i => {
          const x1 = NODE_CX[i] + NODE_R;
          const x2 = NODE_CX[i + 1] - NODE_R;
          const midX = (x1 + x2) / 2;
          const arcY = ROW_Y - 56;
          return (
            <g key={`fwd-${i}`}>
              <path
                d={`M ${x1} ${ROW_Y - 4} Q ${midX} ${arcY} ${x2} ${ROW_Y - 4}`}
                stroke={C.muted}
                strokeWidth="1.5"
                fill="none"
                markerEnd="url(#bp-arr-muted)"
              />
              <text
                x={midX}
                y={arcY - 4}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.muted}
              >
                {FWD_LABELS[i]}
              </text>
            </g>
          );
        })}

        {/* Cached value indicators beneath each non-final node */}
        {[0, 1, 2].map(i => (
          <text
            key={`cache-${i}`}
            x={NODE_CX[i]}
            y={ROW_Y + NODE_R + 18}
            textAnchor="middle"
            fontFamily={mono}
            fontSize="10"
            fill={C.muted}
          >
            cache: a{['⁽⁰⁾', '⁽¹⁾', '⁽²⁾'][i]}, z{['⁽⁰⁾', '⁽¹⁾', '⁽²⁾'][i]}
          </text>
        ))}

        {/* Backward arrows (below the row, teal). Pointing LEFT. */}
        <text
          x={620}
          y={36}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.accent}
        >
          ← backward
        </text>
        {[0, 1, 2].map(i => {
          const x1 = NODE_CX[i + 1] - NODE_R;
          const x2 = NODE_CX[i] + NODE_R;
          const midX = (x1 + x2) / 2;
          const arcY = ROW_Y + 80;
          return (
            <g key={`bwd-${i}`}>
              {/* Arrow drawn from right node down to left node (pointing left) */}
              <path
                d={`M ${x1} ${ROW_Y + 4} Q ${midX} ${arcY} ${x2} ${ROW_Y + 4}`}
                stroke={C.accent}
                strokeWidth="1.5"
                fill="none"
                markerEnd="url(#bp-arr-accent)"
              />
              <text
                x={midX}
                y={arcY + 12}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.accent}
              >
                {BWD_LABELS[i]}
              </text>
              <text
                x={midX}
                y={arcY + 26}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="9.5"
                fill={C.muted}
              >
                {BWD_OP_LABELS[i]}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption
        style={{
          fontFamily: sans,
          fontSize: '12px',
          color: C.muted,
          textAlign: 'center',
          marginTop: '8px',
          lineHeight: 1.5,
        }}
      >
        Forward pass caches activations; backward pass reuses them, computing all
        parameter gradients in a single sweep.
      </figcaption>
    </figure>
  );
}
