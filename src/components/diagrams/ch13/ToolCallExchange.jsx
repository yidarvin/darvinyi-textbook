const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
  toolBg:  '#1a1a1f',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const W = 640;
const ROLE_X = 16;
const BOX_X = 110;
const BOX_W = W - BOX_X - 16;

const TURNS = [
  {
    role: 'user',
    lines: ['What\'s the current price of TSLA?'],
    style: 'plain',
  },
  {
    role: 'assistant',
    lines: [
      '<tool_call>',
      '  {"name": "get_stock_price",',
      '   "arguments": {"ticker": "TSLA"}}',
      '</tool_call>',
    ],
    style: 'tool_call',
  },
  {
    role: 'tool',
    lines: [
      '<tool_result>',
      '  {"price": 248.50, "currency": "USD",',
      '   "timestamp": "2026-05-16T14:30:00Z"}',
      '</tool_result>',
    ],
    style: 'tool_result',
  },
  {
    role: 'assistant',
    lines: ['TSLA is currently trading at $248.50.'],
    style: 'plain',
  },
];

const LINE_H = 18;
const PAD_Y = 12;
const GAP = 14;

export default function ToolCallExchange() {
  // Compute y positions per turn
  let y = 40;
  const placed = TURNS.map((t) => {
    const h = PAD_Y * 2 + t.lines.length * LINE_H;
    const entry = { ...t, y, h };
    y += h + GAP;
    return entry;
  });
  const H = y + 60;

  const annotationY = y + 22;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Structured tool-call exchange between user, assistant, tool runtime"
        style={{ display: 'block' }}
      >
        {placed.map((t, i) => {
          let stroke = C.border;
          let fill = C.bg2;
          let textColor = C.text;
          let labelColor = C.muted;
          if (t.style === 'tool_call') {
            stroke = C.accent;
            fill = C.bg2;
            textColor = C.accent;
            labelColor = C.accent;
          } else if (t.style === 'tool_result') {
            stroke = C.muted2;
            fill = C.toolBg;
            textColor = C.muted2;
            labelColor = C.muted2;
          }
          return (
            <g key={i}>
              <text
                x={ROLE_X}
                y={t.y + PAD_Y + 12}
                fontFamily={mono}
                fontSize="10.5"
                fill={labelColor}
                letterSpacing="0.05em"
              >
                [{t.role}]
              </text>
              <rect
                x={BOX_X}
                y={t.y}
                width={BOX_W}
                height={t.h}
                rx="4"
                fill={fill}
                stroke={stroke}
                strokeWidth="1.5"
              />
              {t.lines.map((line, j) => (
                <text
                  key={j}
                  x={BOX_X + 14}
                  y={t.y + PAD_Y + 12 + j * LINE_H}
                  fontFamily={mono}
                  fontSize="11.5"
                  fill={textColor}
                  style={{ whiteSpace: 'pre' }}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}

        <text
          x={W / 2}
          y={annotationY}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          training data: synthetic + curated multi-turn conversations with realistic
        </text>
        <text
          x={W / 2}
          y={annotationY + 18}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          tool calls and responses
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
        Tool-calling training shapes the model to emit a structured call format at
        the right moment, then incorporate the runtime-injected result into its
        next response.
      </figcaption>
    </figure>
  );
}
