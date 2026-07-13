const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Stream geometry (vertical bar in the middle-left)
const STREAM_X = 180;
const STREAM_W = 14;
const STREAM_TOP = 70;
const STREAM_BOT = 590;

// Component column on the right
const COMP_LEFT = 290;
const COMP_RIGHT = 560;

// Block layout
const N_BLOCKS = 3;
const BLOCK_H = 150;
const BLOCK_TOP_FIRST = 100;

function Block({ index, topY }) {
  // Two components in each block: Attention (upper) and FFN (lower).
  // Each component has read (in) and write (out) connections to the stream.
  const ATTN_Y = topY + 24;
  const ATTN_H = 36;
  const FFN_Y  = topY + 84;
  const FFN_H  = 36;

  // Tap positions on stream — read enters lower edge of component, write exits upper edge.
  const ATTN_READ_Y  = ATTN_Y + ATTN_H - 8;
  const ATTN_WRITE_Y = ATTN_Y + 8;
  const FFN_READ_Y   = FFN_Y + FFN_H - 8;
  const FFN_WRITE_Y  = FFN_Y + 8;

  const STREAM_RIGHT_EDGE = STREAM_X + STREAM_W;

  function ReadWrite({ readY, writeY }) {
    return (
      <g>
        {/* Read: stream → box, muted */}
        <line
          x1={STREAM_RIGHT_EDGE + 1}
          y1={readY}
          x2={COMP_LEFT - 2}
          y2={readY}
          stroke={C.muted}
          strokeWidth="1.2"
          markerEnd="url(#rs-arr-muted)"
        />
        <text x={(STREAM_RIGHT_EDGE + COMP_LEFT) / 2} y={readY - 4} textAnchor="middle" fontFamily={mono} fontSize="9" fill={C.muted}>
          read
        </text>

        {/* Write: box → stream, teal */}
        <line
          x1={COMP_LEFT - 1}
          y1={writeY}
          x2={STREAM_RIGHT_EDGE + 7}
          y2={writeY}
          stroke={C.accent}
          strokeWidth="1.2"
          markerEnd="url(#rs-arr-accent)"
        />
        <text x={(STREAM_RIGHT_EDGE + COMP_LEFT) / 2} y={writeY - 4} textAnchor="middle" fontFamily={mono} fontSize="9" fill={C.accent}>
          write Δ
        </text>

        {/* + node on stream where the write lands */}
        <circle cx={STREAM_X + STREAM_W / 2} cy={writeY} r="6" fill={C.bg2} stroke={C.accent} strokeWidth="1.4" />
        <text x={STREAM_X + STREAM_W / 2} y={writeY + 3.5} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.accent}>
          +
        </text>
      </g>
    );
  }

  return (
    <g>
      {/* Block label on the left of the stream */}
      <text
        x={STREAM_X - 14}
        y={topY + BLOCK_H / 2 + 4}
        textAnchor="end"
        fontFamily={mono}
        fontSize="10.5"
        fill={C.muted2}
      >
        block {index + 1}
      </text>

      {/* Attention component */}
      <rect
        x={COMP_LEFT}
        y={ATTN_Y}
        width={COMP_RIGHT - COMP_LEFT}
        height={ATTN_H}
        rx="4"
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1.5"
      />
      <text
        x={(COMP_LEFT + COMP_RIGHT) / 2}
        y={ATTN_Y + ATTN_H / 2 + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={C.text}
      >
        Attention (heads 1..h)
      </text>
      <ReadWrite readY={ATTN_READ_Y} writeY={ATTN_WRITE_Y} />

      {/* FFN component */}
      <rect
        x={COMP_LEFT}
        y={FFN_Y}
        width={COMP_RIGHT - COMP_LEFT}
        height={FFN_H}
        rx="4"
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1.5"
      />
      <text
        x={(COMP_LEFT + COMP_RIGHT) / 2}
        y={FFN_Y + FFN_H / 2 + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={C.text}
      >
        FFN
      </text>
      <ReadWrite readY={FFN_READ_Y} writeY={FFN_WRITE_Y} />
    </g>
  );
}

export default function ResidualStreamHighway() {
  const H = 700;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 640 ${H}`}
        width="100%"
        role="img"
        aria-label="Residual stream as a highway through transformer blocks"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="rs-arr-muted"
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
            id="rs-arr-accent"
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

        {/* Diagram title */}
        <text x={320} y={24} textAnchor="middle" fontFamily={sans} fontSize="13" fontWeight="500" fill={C.text}>
          Each block adds a delta — never overwrites
        </text>

        {/* Stream label at top of bar */}
        <text x={STREAM_X + STREAM_W / 2} y={STREAM_TOP - 24} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted2}>
          residual stream
        </text>
        <text x={STREAM_X + STREAM_W / 2} y={STREAM_TOP - 10} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted2}>
          x ∈ ℝ^d
        </text>

        {/* Top arrow: stream → unembedding → logits */}
        <line
          x1={STREAM_X + STREAM_W / 2}
          y1={STREAM_TOP}
          x2={STREAM_X + STREAM_W / 2}
          y2={STREAM_TOP - 36}
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#rs-arr-accent)"
        />
        <text x={STREAM_X + 24} y={STREAM_TOP - 40} fontFamily={mono} fontSize="10" fill={C.text}>
          → unembedding → logits
        </text>

        {/* The thick teal vertical residual stream bar */}
        <rect
          x={STREAM_X}
          y={STREAM_TOP}
          width={STREAM_W}
          height={STREAM_BOT - STREAM_TOP}
          fill={C.accent}
          opacity="0.18"
          rx="4"
        />
        <line
          x1={STREAM_X + STREAM_W / 2}
          y1={STREAM_TOP}
          x2={STREAM_X + STREAM_W / 2}
          y2={STREAM_BOT}
          stroke={C.accent}
          strokeWidth="2"
        />

        {/* Bottom arrow: embedding → stream */}
        <line
          x1={STREAM_X + STREAM_W / 2}
          y1={STREAM_BOT + 36}
          x2={STREAM_X + STREAM_W / 2}
          y2={STREAM_BOT + 2}
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#rs-arr-muted)"
        />
        <text x={STREAM_X + 24} y={STREAM_BOT + 28} fontFamily={mono} fontSize="10" fill={C.text}>
          ← token + position embedding
        </text>

        {/* The 3 blocks */}
        {[0, 1, 2].map((i) => (
          <Block key={i} index={i} topY={BLOCK_TOP_FIRST + i * (BLOCK_H + 10)} />
        ))}

        {/* Bottom annotation */}
        <text x={320} y={H - 32} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>
          4096-dim in LLaMA-7B · 12288-dim in GPT-3
        </text>
        <text x={320} y={H - 16} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>
          (the same vector funnels all computation)
        </text>
      </svg>

      <figcaption
        style={{
          fontFamily: sans,
          fontSize: '12px',
          color: C.muted,
          textAlign: 'center',
          marginTop: '10px',
          lineHeight: 1.5,
        }}
      >
        Every transformer component reads a projection of the residual stream and
        writes back a delta — the stream itself is the substrate through which the
        whole network communicates.
      </figcaption>
    </figure>
  );
}
