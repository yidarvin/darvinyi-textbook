const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const TOKENS = ['I', 'saw', 'a', 'cat', 'on', 'mat'];

// Encoder cell x positions (width 52, gap 10)
const CELL_W = 52;
const CELL_H = 30;
const CELL_X = [30, 92, 154, 216, 278, 340];
const DECODER_X = 510;
const DECODER_W = 78;

function EncoderCell({ x, y, label, highlight }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CELL_W}
        height={CELL_H}
        rx="4"
        fill={C.bg2}
        stroke={highlight ? C.accent : C.border}
        strokeWidth="1.5"
      />
      <text
        x={x + CELL_W / 2}
        y={y + CELL_H / 2 + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={highlight ? C.accent : C.text}
      >
        {label}
      </text>
    </g>
  );
}

function DecoderCell({ x, y }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={DECODER_W}
        height={CELL_H}
        rx="4"
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1.5"
      />
      <text
        x={x + DECODER_W / 2}
        y={y + CELL_H / 2 + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={C.text}
      >
        dec → Je
      </text>
    </g>
  );
}

export default function BottleneckVsAttention() {
  // Top panel layout
  const TOP_ROW_Y = 80;
  // Bottom panel layout
  const BOT_ROW_Y = 330;
  const ATTN_Y    = 250;
  const ATTN_CX   = DECODER_X + DECODER_W / 2;

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 430"
        width="100%"
        role="img"
        aria-label="Comparison of seq2seq bottleneck vs attention"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="arr-muted"
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
            id="arr-accent"
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

        {/* ── Top panel ── */}
        <text
          x="30"
          y="32"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          SEQ2SEQ WITH BOTTLENECK
        </text>

        {/* encoder cells */}
        {TOKENS.map((t, i) => (
          <EncoderCell
            key={`top-${i}`}
            x={CELL_X[i]}
            y={TOP_ROW_Y}
            label={t}
            highlight={i === TOKENS.length - 1}
          />
        ))}

        {/* arrows between encoder cells */}
        {CELL_X.slice(0, -1).map((x, i) => (
          <line
            key={`top-arr-${i}`}
            x1={x + CELL_W}
            y1={TOP_ROW_Y + CELL_H / 2}
            x2={CELL_X[i + 1]}
            y2={TOP_ROW_Y + CELL_H / 2}
            stroke={C.muted}
            strokeWidth="1.5"
            markerEnd="url(#arr-muted)"
          />
        ))}

        {/* context label below last cell */}
        <text
          x={CELL_X[5] + CELL_W / 2}
          y={TOP_ROW_Y + CELL_H + 18}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.accent}
        >
          context
        </text>
        <text
          x={CELL_X[5] + CELL_W / 2}
          y={TOP_ROW_Y + CELL_H + 34}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="10.5"
          fill={C.muted}
        >
          one vector — must encode everything
        </text>

        {/* arrow from context to decoder */}
        <line
          x1={CELL_X[5] + CELL_W}
          y1={TOP_ROW_Y + CELL_H / 2}
          x2={DECODER_X}
          y2={TOP_ROW_Y + CELL_H / 2}
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#arr-accent)"
        />

        <DecoderCell x={DECODER_X} y={TOP_ROW_Y} />

        {/* ── Divider ── */}
        <line
          x1="30"
          y1="195"
          x2="610"
          y2="195"
          stroke={C.border}
          strokeWidth="1"
          strokeDasharray="3,4"
        />

        {/* ── Bottom panel ── */}
        <text
          x="30"
          y="222"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          WITH ATTENTION
        </text>

        {/* attention node */}
        <rect
          x={ATTN_CX - 50}
          y={ATTN_Y - 16}
          width="100"
          height="32"
          rx="4"
          fill={C.bg2}
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <text
          x={ATTN_CX}
          y={ATTN_Y + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.accent}
        >
          attention
        </text>

        {/* lines from each encoder cell up to attention node */}
        {CELL_X.map((x, i) => (
          <line
            key={`bot-up-${i}`}
            x1={x + CELL_W / 2}
            y1={BOT_ROW_Y}
            x2={ATTN_CX}
            y2={ATTN_Y + 16}
            stroke={C.accent}
            strokeWidth="1"
            opacity="0.55"
          />
        ))}

        {/* sample weight labels on two of the lines */}
        <text
          x={(CELL_X[3] + CELL_W / 2 + ATTN_CX) / 2 - 18}
          y={(BOT_ROW_Y + ATTN_Y + 16) / 2 - 4}
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          0.7
        </text>
        <text
          x={(CELL_X[0] + CELL_W / 2 + ATTN_CX) / 2 - 12}
          y={(BOT_ROW_Y + ATTN_Y + 16) / 2 - 4}
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          0.1
        </text>

        {/* encoder cells (bottom) */}
        {TOKENS.map((t, i) => (
          <EncoderCell
            key={`bot-${i}`}
            x={CELL_X[i]}
            y={BOT_ROW_Y}
            label={t}
            highlight={false}
          />
        ))}

        {/* arrows between encoder cells (bottom) */}
        {CELL_X.slice(0, -1).map((x, i) => (
          <line
            key={`bot-arr-${i}`}
            x1={x + CELL_W}
            y1={BOT_ROW_Y + CELL_H / 2}
            x2={CELL_X[i + 1]}
            y2={BOT_ROW_Y + CELL_H / 2}
            stroke={C.muted}
            strokeWidth="1.5"
            markerEnd="url(#arr-muted)"
          />
        ))}

        {/* attention -> decoder */}
        <line
          x1={ATTN_CX}
          y1={ATTN_Y + 16}
          x2={DECODER_X + DECODER_W / 2}
          y2={BOT_ROW_Y}
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#arr-accent)"
        />

        <DecoderCell x={DECODER_X} y={BOT_ROW_Y} />
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
        Attention removes the single-vector bottleneck by letting the decoder read
        every encoder state, weighted by relevance.
      </figcaption>
    </figure>
  );
}
