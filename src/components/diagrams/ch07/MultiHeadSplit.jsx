const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Column x positions
const X_INPUT       = 16;
const X_PROJ_Q      = 100;
const X_PROJ_K      = 152;
const X_PROJ_V      = 204;
const X_SDPA        = 268;
const X_CONCAT      = 446;
const X_WO          = 506;
const X_OUTPUT      = 568;

// Per-head row centers (heads 1, 2, ⋮, 8 — 4 visible rows)
const ROW_Y = [80, 130, 180, 230];
const ROW_LABEL = ['1', '2', '⋮', '8'];

const PROJ_BOX_W = 44;
const PROJ_BOX_H = 24;
const SDPA_BOX_W = 168;
const SDPA_BOX_H = 28;

function ProjBox({ x, y, label, isDots }) {
  if (isDots) {
    return (
      <text
        x={x + PROJ_BOX_W / 2}
        y={y + 5}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="13"
        fill={C.muted}
      >
        ⋮
      </text>
    );
  }
  return (
    <g>
      <rect
        x={x}
        y={y - PROJ_BOX_H / 2}
        width={PROJ_BOX_W}
        height={PROJ_BOX_H}
        rx="4"
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1.5"
      />
      <text
        x={x + PROJ_BOX_W / 2}
        y={y + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="10.5"
        fill={C.text}
      >
        {label}
      </text>
    </g>
  );
}

export default function MultiHeadSplit() {
  const TOP_Y    = ROW_Y[0] - 18;
  const BOT_Y    = ROW_Y[3] + 18;
  const MID_Y    = (TOP_Y + BOT_Y) / 2;

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 360"
        width="100%"
        role="img"
        aria-label="Multi-head attention pipeline"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="mh-arr"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
        </defs>

        {/* Column headers */}
        <text x={X_INPUT + 24}   y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>input</text>
        <text x={X_PROJ_Q + 22}  y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>W_Q</text>
        <text x={X_PROJ_K + 22}  y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>W_K</text>
        <text x={X_PROJ_V + 22}  y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>W_V</text>
        <text x={X_SDPA + 84}    y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>per-head attention</text>
        <text x={X_CONCAT + 24}  y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>concat</text>
        <text x={X_WO + 26}      y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>W_O</text>
        <text x={X_OUTPUT + 32}  y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>output</text>

        {/* Input X */}
        <rect
          x={X_INPUT}
          y={MID_Y - 30}
          width="56"
          height="60"
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={X_INPUT + 28}
          y={MID_Y - 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          X
        </text>
        <text
          x={X_INPUT + 28}
          y={MID_Y + 14}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          n × 512
        </text>

        {/* Arrows X → each projection column */}
        {[X_PROJ_Q, X_PROJ_K, X_PROJ_V].map((px, j) => (
          <line
            key={`x2p-${j}`}
            x1={X_INPUT + 56}
            y1={MID_Y}
            x2={px - 2}
            y2={MID_Y}
            stroke={C.muted}
            strokeWidth="1"
            opacity="0.6"
          />
        ))}

        {/* Q / K / V projection columns */}
        {ROW_Y.map((y, i) => {
          const isDots = ROW_LABEL[i] === '⋮';
          const labelSuffix = ROW_LABEL[i];
          return (
            <g key={`row-${i}`}>
              <ProjBox x={X_PROJ_Q} y={y} label={`Q${labelSuffix}`} isDots={isDots} />
              <ProjBox x={X_PROJ_K} y={y} label={`K${labelSuffix}`} isDots={isDots} />
              <ProjBox x={X_PROJ_V} y={y} label={`V${labelSuffix}`} isDots={isDots} />
            </g>
          );
        })}

        {/* SDPA boxes per visible head */}
        {ROW_Y.map((y, i) => {
          const isDots = ROW_LABEL[i] === '⋮';
          if (isDots) {
            return (
              <text
                key={`sdpa-${i}`}
                x={X_SDPA + SDPA_BOX_W / 2}
                y={y + 5}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="13"
                fill={C.muted}
              >
                ⋮
              </text>
            );
          }
          return (
            <g key={`sdpa-${i}`}>
              {/* arrow from V column to SDPA */}
              <line
                x1={X_PROJ_V + PROJ_BOX_W}
                y1={y}
                x2={X_SDPA - 2}
                y2={y}
                stroke={C.muted}
                strokeWidth="1"
                markerEnd="url(#mh-arr)"
              />
              <rect
                x={X_SDPA}
                y={y - SDPA_BOX_H / 2}
                width={SDPA_BOX_W}
                height={SDPA_BOX_H}
                rx="4"
                fill={C.bg2}
                stroke={C.border}
                strokeWidth="1.5"
              />
              <text
                x={X_SDPA + SDPA_BOX_W / 2}
                y={y + 4}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.text}
              >
                Scaled Dot-Product Attn
              </text>
              {/* arrow SDPA → concat */}
              <line
                x1={X_SDPA + SDPA_BOX_W}
                y1={y}
                x2={X_CONCAT - 2}
                y2={y}
                stroke={C.muted}
                strokeWidth="1"
                markerEnd="url(#mh-arr)"
              />
            </g>
          );
        })}

        {/* Concat block (spans the head rows vertically) */}
        <rect
          x={X_CONCAT}
          y={ROW_Y[0] - 24}
          width="48"
          height={ROW_Y[3] - ROW_Y[0] + 48}
          rx="6"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={X_CONCAT + 24}
          y={MID_Y - 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          concat
        </text>
        <text
          x={X_CONCAT + 24}
          y={MID_Y + 12}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          8 × 64
        </text>

        {/* concat → W_O */}
        <line
          x1={X_CONCAT + 48}
          y1={MID_Y}
          x2={X_WO - 2}
          y2={MID_Y}
          stroke={C.muted}
          strokeWidth="1"
          markerEnd="url(#mh-arr)"
        />

        {/* W_O block */}
        <rect
          x={X_WO}
          y={MID_Y - 24}
          width="52"
          height="48"
          rx="6"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={X_WO + 26}
          y={MID_Y - 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          W_O
        </text>
        <text
          x={X_WO + 26}
          y={MID_Y + 12}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          512 × 512
        </text>

        {/* W_O → output */}
        <line
          x1={X_WO + 52}
          y1={MID_Y}
          x2={X_OUTPUT - 2}
          y2={MID_Y}
          stroke={C.muted}
          strokeWidth="1"
          markerEnd="url(#mh-arr)"
        />
        <rect
          x={X_OUTPUT}
          y={MID_Y - 24}
          width="64"
          height="48"
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={X_OUTPUT + 32}
          y={MID_Y - 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          Y
        </text>
        <text
          x={X_OUTPUT + 32}
          y={MID_Y + 12}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          n × 512
        </text>

        {/* Highlight: head-dim annotation in teal */}
        <text
          x="320"
          y="305"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="12"
          fill={C.accent}
        >
          d_k = d_v = d_model / h = 64
        </text>
        <text
          x="320"
          y="324"
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted}
        >
          each head operates in a 64-dim subspace
        </text>
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
        Eight heads, each operating in a 64-dim subspace, concatenated and
        projected. Total compute is the same as a single head at full dimension.
      </figcaption>
    </figure>
  );
}
