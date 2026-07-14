const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  accentDim: '#0b2422',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const PANEL_W = 200;
const PANEL_H = 250;
const PANEL_Y = 48;
const PANEL_XS = [12, 220, 428];
const PANEL_TITLES = [
  'MHA · 8 Q, 8 K, 8 V',
  'MQA · 8 Q, 1 K, 1 V',
  'GQA · 8 Q, 2 K, 2 V',
];
const PANEL_NOTES = [
  'KV cache: 8 · T · d_head',
  'KV cache: 1 · T · d_head',
  'KV cache: 2 · T · d_head',
];
const PANEL_NOTES2 = [
  'baseline',
  '8× smaller',
  '4× smaller, near-MHA quality',
];

const H = 8; // num heads
const Q_W = 16;
const Q_H = 18;
const Q_GAP = 4;
const Q_ROW_Y = PANEL_Y + 60;
const K_ROW_Y = PANEL_Y + 130;
const V_ROW_Y = PANEL_Y + 168;

function qPositions(px) {
  const total = H * Q_W + (H - 1) * Q_GAP;
  const sx = px + (PANEL_W - total) / 2;
  return Array.from({ length: H }, (_, i) => ({
    x: sx + i * (Q_W + Q_GAP),
    cx: sx + i * (Q_W + Q_GAP) + Q_W / 2,
  }));
}

export default function MHAvsMQAvsGQA() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 340"
        width="100%"
        role="img"
        aria-label="Multi-head, multi-query, and grouped-query attention compared"
        style={{ display: 'block' }}
      >
        <text
          x={320}
          y={22}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="12"
          fill={C.muted2}
        >
          Sharing K and V across heads — the modern KV-cache reduction trick
        </text>

        {PANEL_XS.map((px, pi) => (
          <g key={`panel-${pi}`}>
            <rect
              x={px}
              y={PANEL_Y}
              width={PANEL_W}
              height={PANEL_H}
              rx="4"
              fill="none"
              stroke={C.border}
              strokeWidth="1"
            />
            <text
              x={px + PANEL_W / 2}
              y={PANEL_Y + 18}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="11"
              fill={C.text}
            >
              {PANEL_TITLES[pi]}
            </text>
            <text
              x={px + PANEL_W / 2}
              y={PANEL_Y + 36}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="9.5"
              fill={C.muted}
            >
              Q heads
            </text>
          </g>
        ))}

        {/* Panel 1 — MHA */}
        {(() => {
          const px = PANEL_XS[0];
          const qs = qPositions(px);
          return (
            <g key="mha">
              {qs.map((q, i) => (
                <g key={`mha-q-${i}`}>
                  <rect
                    x={q.x}
                    y={Q_ROW_Y - Q_H / 2}
                    width={Q_W}
                    height={Q_H}
                    rx="3"
                    fill={C.bg2}
                    stroke={C.border}
                    strokeWidth="1.5"
                  />
                  <text
                    x={q.cx}
                    y={Q_ROW_Y + 4}
                    textAnchor="middle"
                    fontFamily={mono}
                    fontSize="8.5"
                    fill={C.muted2}
                  >
                    {`Q${i + 1}`}
                  </text>
                  {/* K box */}
                  <rect
                    x={q.x}
                    y={K_ROW_Y - Q_H / 2}
                    width={Q_W}
                    height={Q_H}
                    rx="3"
                    fill={C.bg2}
                    stroke={C.border}
                    strokeWidth="1.5"
                  />
                  <text
                    x={q.cx}
                    y={K_ROW_Y + 4}
                    textAnchor="middle"
                    fontFamily={mono}
                    fontSize="8.5"
                    fill={C.muted2}
                  >
                    {`K${i + 1}`}
                  </text>
                  {/* V box */}
                  <rect
                    x={q.x}
                    y={V_ROW_Y - Q_H / 2}
                    width={Q_W}
                    height={Q_H}
                    rx="3"
                    fill={C.bg2}
                    stroke={C.border}
                    strokeWidth="1.5"
                  />
                  <text
                    x={q.cx}
                    y={V_ROW_Y + 4}
                    textAnchor="middle"
                    fontFamily={mono}
                    fontSize="8.5"
                    fill={C.muted2}
                  >
                    {`V${i + 1}`}
                  </text>
                  {/* connect Q→K (vertical) */}
                  <line
                    x1={q.cx}
                    y1={Q_ROW_Y + Q_H / 2}
                    x2={q.cx}
                    y2={K_ROW_Y - Q_H / 2}
                    stroke={C.muted}
                    strokeWidth="0.8"
                  />
                </g>
              ))}
            </g>
          );
        })()}

        {/* Panel 2 — MQA */}
        {(() => {
          const px = PANEL_XS[1];
          const qs = qPositions(px);
          const sharedX = px + 28;
          const sharedW = PANEL_W - 56;
          return (
            <g key="mqa">
              {qs.map((q, i) => (
                <g key={`mqa-q-${i}`}>
                  <rect
                    x={q.x}
                    y={Q_ROW_Y - Q_H / 2}
                    width={Q_W}
                    height={Q_H}
                    rx="3"
                    fill={C.bg2}
                    stroke={C.border}
                    strokeWidth="1.5"
                  />
                  <text
                    x={q.cx}
                    y={Q_ROW_Y + 4}
                    textAnchor="middle"
                    fontFamily={mono}
                    fontSize="8.5"
                    fill={C.muted2}
                  >
                    {`Q${i + 1}`}
                  </text>
                  {/* fan-in line to shared K */}
                  <line
                    x1={q.cx}
                    y1={Q_ROW_Y + Q_H / 2}
                    x2={sharedX + sharedW / 2}
                    y2={K_ROW_Y - Q_H / 2}
                    stroke={C.accent}
                    strokeWidth="0.8"
                    opacity="0.45"
                  />
                </g>
              ))}
              {/* shared K */}
              <rect
                x={sharedX}
                y={K_ROW_Y - Q_H / 2}
                width={sharedW}
                height={Q_H}
                rx="4"
                fill={C.accentDim}
                stroke={C.accent}
                strokeWidth="1.5"
              />
              <text
                x={sharedX + sharedW / 2}
                y={K_ROW_Y + 4}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10"
                fill={C.accent}
              >
                K (shared)
              </text>
              {/* shared V */}
              <rect
                x={sharedX}
                y={V_ROW_Y - Q_H / 2}
                width={sharedW}
                height={Q_H}
                rx="4"
                fill={C.accentDim}
                stroke={C.accent}
                strokeWidth="1.5"
              />
              <text
                x={sharedX + sharedW / 2}
                y={V_ROW_Y + 4}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10"
                fill={C.accent}
              >
                V (shared)
              </text>
            </g>
          );
        })()}

        {/* Panel 3 — GQA */}
        {(() => {
          const px = PANEL_XS[2];
          const qs = qPositions(px);
          const G = 2;
          // 2 wider boxes for K_g and V_g
          const groupW = (PANEL_W - 56) / 2 - 6;
          const groupGap = 12;
          const groupStartX = px + 28;
          const groupCx = (g) => groupStartX + g * (groupW + groupGap) + groupW / 2;
          return (
            <g key="gqa">
              {qs.map((q, i) => {
                const g = Math.floor(i / (H / G));
                return (
                  <g key={`gqa-q-${i}`}>
                    <rect
                      x={q.x}
                      y={Q_ROW_Y - Q_H / 2}
                      width={Q_W}
                      height={Q_H}
                      rx="3"
                      fill={C.bg2}
                      stroke={C.border}
                      strokeWidth="1.5"
                    />
                    <text
                      x={q.cx}
                      y={Q_ROW_Y + 4}
                      textAnchor="middle"
                      fontFamily={mono}
                      fontSize="8.5"
                      fill={C.muted2}
                    >
                      {`Q${i + 1}`}
                    </text>
                    <line
                      x1={q.cx}
                      y1={Q_ROW_Y + Q_H / 2}
                      x2={groupCx(g)}
                      y2={K_ROW_Y - Q_H / 2}
                      stroke={C.accent}
                      strokeWidth="0.8"
                      opacity="0.45"
                    />
                  </g>
                );
              })}
              {/* Group bracket above K's */}
              {Array.from({ length: G }, (_, g) => {
                const cx = groupCx(g);
                return (
                  <g key={`gqa-k-${g}`}>
                    <rect
                      x={cx - groupW / 2}
                      y={K_ROW_Y - Q_H / 2}
                      width={groupW}
                      height={Q_H}
                      rx="4"
                      fill={C.accentDim}
                      stroke={C.accent}
                      strokeWidth="1.5"
                    />
                    <text
                      x={cx}
                      y={K_ROW_Y + 4}
                      textAnchor="middle"
                      fontFamily={mono}
                      fontSize="10"
                      fill={C.accent}
                    >
                      {`K${g + 1}`}
                    </text>
                    <rect
                      x={cx - groupW / 2}
                      y={V_ROW_Y - Q_H / 2}
                      width={groupW}
                      height={Q_H}
                      rx="4"
                      fill={C.accentDim}
                      stroke={C.accent}
                      strokeWidth="1.5"
                    />
                    <text
                      x={cx}
                      y={V_ROW_Y + 4}
                      textAnchor="middle"
                      fontFamily={mono}
                      fontSize="10"
                      fill={C.accent}
                    >
                      {`V${g + 1}`}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* Per-panel notes */}
        {PANEL_XS.map((px, pi) => (
          <g key={`note-${pi}`}>
            <text
              x={px + PANEL_W / 2}
              y={PANEL_Y + PANEL_H - 30}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="10"
              fill={C.text}
            >
              {PANEL_NOTES[pi]}
            </text>
            <text
              x={px + PANEL_W / 2}
              y={PANEL_Y + PANEL_H - 14}
              textAnchor="middle"
              fontFamily={sans}
              fontSize="10.5"
              fill={C.muted}
            >
              {PANEL_NOTES2[pi]}
            </text>
          </g>
        ))}
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
        GQA is the practical middle ground: most of MHA's representational
        capacity, at a fraction of MHA's cache — though still a multiple of
        MQA's smaller cache.
      </figcaption>
    </figure>
  );
}
