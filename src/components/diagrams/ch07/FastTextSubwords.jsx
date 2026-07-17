const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  mid:     '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const NGRAMS = ['<pl', 'pla', 'lay', 'ayi', 'yin', 'ing', 'ng>'];
const FULL_WORD = '<playing>';

// Layout
const TOP_WORD_Y = 38;
const COL_TOP    = 80;
const BOX_W = 90;
const BOX_H = 26;
const COL_X = 200;       // x of the n-gram column (left edge)
const ROW_GAP = 6;       // gap between rows
const FULLWORD_GAP = 12; // extra gap before the highlighted full-word row

const SUM_X = 430;
const SUM_R = 22;
const VEC_X = 530;
const VEC_W = 84;
const VEC_H = 32;

export default function FastTextSubwords() {
  // Compute row Ys
  const rowY = (i) => COL_TOP + i * (BOX_H + ROW_GAP);
  const fullWordRowY = COL_TOP + NGRAMS.length * (BOX_H + ROW_GAP) + FULLWORD_GAP;
  const totalRows = NGRAMS.length + 1;
  const colBottom = fullWordRowY + BOX_H;

  // Center of the column block (for routing into Σ)
  const SUM_Y = (COL_TOP + colBottom) / 2;
  const VEC_Y = SUM_Y;

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 380"
        width="100%"
        role="img"
        aria-label="fastText represents a word as the sum of its character n-grams"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="fts-arr-muted"
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
            id="fts-arr-accent"
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

        {/* Top word */}
        <text
          x="320"
          y={TOP_WORD_Y}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="22"
          fill={C.text}
        >
          {FULL_WORD}
        </text>

        {/* Arrow down from top word to column */}
        <line
          x1="320"
          y1={TOP_WORD_Y + 8}
          x2="320"
          y2={COL_TOP - 6}
          stroke={C.muted}
          strokeWidth="1.5"
          markerEnd="url(#fts-arr-muted)"
        />
        <text
          x="332"
          y={(TOP_WORD_Y + COL_TOP) / 2 + 2}
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted}
        >
          character n-grams (n = 3)
        </text>

        {/* N-gram boxes */}
        {NGRAMS.map((g, i) => (
          <g key={`ng-${i}`}>
            <rect
              x={COL_X}
              y={rowY(i)}
              width={BOX_W}
              height={BOX_H}
              rx="4"
              fill={C.bg2}
              stroke={C.border}
              strokeWidth="1.5"
            />
            <text
              x={COL_X + BOX_W / 2}
              y={rowY(i) + BOX_H / 2 + 4}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="12"
              fill={C.text}
            >
              {g}
            </text>
          </g>
        ))}

        {/* Full word box (highlighted) */}
        <rect
          x={COL_X}
          y={fullWordRowY}
          width={BOX_W}
          height={BOX_H}
          rx="4"
          fill={C.bg2}
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <text
          x={COL_X + BOX_W / 2}
          y={fullWordRowY + BOX_H / 2 + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="12"
          fill={C.accent}
        >
          {FULL_WORD}
        </text>
        <text
          x={COL_X - 8}
          y={fullWordRowY + BOX_H / 2 + 4}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10"
          fill={C.accent}
        >
          whole word
        </text>

        {/* Arrows from each row → Σ */}
        {[...Array(totalRows)].map((_, i) => {
          const y = i < NGRAMS.length ? rowY(i) + BOX_H / 2 : fullWordRowY + BOX_H / 2;
          const isFull = i === NGRAMS.length;
          return (
            <line
              key={`r2sum-${i}`}
              x1={COL_X + BOX_W}
              y1={y}
              x2={SUM_X - SUM_R}
              y2={SUM_Y}
              stroke={isFull ? C.accent : C.muted}
              strokeWidth="1"
              opacity={isFull ? 0.85 : 0.5}
            />
          );
        })}

        {/* Σ / |G| operator */}
        <circle
          cx={SUM_X}
          cy={SUM_Y}
          r={SUM_R}
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={SUM_X}
          y={SUM_Y + 2}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="14"
          fill={C.text}
        >
          Σ
        </text>
        <text
          x={SUM_X}
          y={SUM_Y + 16}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9"
          fill={C.muted}
        >
          / |G|
        </text>

        {/* Σ → final vector */}
        <line
          x1={SUM_X + SUM_R}
          y1={SUM_Y}
          x2={VEC_X - 2}
          y2={VEC_Y}
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#fts-arr-accent)"
        />

        {/* Final vector glyph */}
        <rect
          x={VEC_X}
          y={VEC_Y - VEC_H / 2}
          width={VEC_W}
          height={VEC_H}
          rx="4"
          fill={C.bg2}
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <text
          x={VEC_X + VEC_W / 2}
          y={VEC_Y + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.accent}
        >
          v(&quot;playing&quot;)
        </text>

        {/* Bottom annotation */}
        <text
          x="320"
          y={colBottom + 50}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          morphological neighbors share subwords
        </text>
        <text
          x="320"
          y={colBottom + 68}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          → share embedding components automatically
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
        fastText represents each word as the sum of its character n-gram vectors,
        sharing structure across morphologically related forms.
      </figcaption>
    </figure>
  );
}
