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

const TOKENS = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'];
const CENTER_IDX = 3; // "fox"
const WINDOW = 2;

const BOX_W = 60;
const BOX_H = 30;
const GAP   = 6;
const ROW_TOTAL_W = TOKENS.length * BOX_W + (TOKENS.length - 1) * GAP; // 9*60 + 8*6 = 588
const ROW_X0 = (640 - ROW_TOTAL_W) / 2;
const ROW_Y  = 150;

const cellX = (i) => ROW_X0 + i * (BOX_W + GAP);
const cellCenter = (i) => cellX(i) + BOX_W / 2;

const CONTEXT_INDICES = [1, 2, 4, 5];
const CONTEXT_LABELS = {
  1: 'P(quick | fox)',
  2: 'P(brown | fox)',
  4: 'P(jumps | fox)',
  5: 'P(over  | fox)',
};

export default function SkipGramWindow() {
  const centerX = cellCenter(CENTER_IDX);
  const centerY = ROW_Y + BOX_H / 2;

  // Bracket above window
  const bracketLeft  = cellX(CENTER_IDX - WINDOW) - 4;
  const bracketRight = cellX(CENTER_IDX + WINDOW) + BOX_W + 4;
  const bracketY     = ROW_Y - 36;

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 290"
        width="100%"
        role="img"
        aria-label="Skip-gram window slides across a sentence"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="sgw-arr-accent"
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

        {/* Window bracket above */}
        <path
          d={`M ${bracketLeft} ${bracketY + 12}
              L ${bracketLeft} ${bracketY}
              L ${bracketRight} ${bracketY}
              L ${bracketRight} ${bracketY + 12}`}
          fill="none"
          stroke={C.mid}
          strokeWidth="1.5"
        />
        <text
          x={(bracketLeft + bracketRight) / 2}
          y={bracketY - 8}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.mid}
        >
          window size = 2 (on each side)
        </text>

        {/* Sentence row */}
        {TOKENS.map((tok, i) => {
          const isCenter = i === CENTER_IDX;
          const inWindow = Math.abs(i - CENTER_IDX) <= WINDOW && !isCenter;
          const stroke = isCenter ? C.accent : C.border;
          const fill   = isCenter ? C.accent : (inWindow ? C.text : C.mid);
          return (
            <g key={`tok-${i}`}>
              <rect
                x={cellX(i)}
                y={ROW_Y}
                width={BOX_W}
                height={BOX_H}
                rx="4"
                fill={C.bg2}
                stroke={stroke}
                strokeWidth="1.5"
              />
              <text
                x={cellCenter(i)}
                y={ROW_Y + BOX_H / 2 + 4}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="12"
                fill={fill}
              >
                {tok}
              </text>
            </g>
          );
        })}

        {/* Arrows from center to context words, labeled with P(...|fox) */}
        {CONTEXT_INDICES.map((idx) => {
          const targetX = cellCenter(idx);
          const isLeft  = idx < CENTER_IDX;
          // Curved path above the row from center to context
          const startY = ROW_Y;
          const endY   = ROW_Y;
          const midX   = (centerX + targetX) / 2;
          const midY   = ROW_Y - 18 - Math.abs(idx - CENTER_IDX) * 2;
          const d = `M ${centerX} ${startY} Q ${midX} ${midY} ${targetX} ${endY}`;
          // Label sits above the arrow midpoint
          const labelY = midY - 4;
          return (
            <g key={`ctx-${idx}`}>
              <path
                d={d}
                fill="none"
                stroke={C.accent}
                strokeWidth="1.5"
                markerEnd="url(#sgw-arr-accent)"
                opacity="0.85"
              />
              <text
                x={midX}
                y={labelY}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.accent}
              >
                {CONTEXT_LABELS[idx]}
              </text>
            </g>
          );
        })}

        {/* "center word" tag below fox */}
        <text
          x={centerX}
          y={ROW_Y + BOX_H + 18}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.accent}
        >
          center word
        </text>

        {/* Bottom annotation */}
        <text
          x="320"
          y="252"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          skip-gram: for each center word, predict every word within ±c positions
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
        Skip-gram slides a window across the corpus and trains each center word
        to predict its neighbors — the embeddings emerge as a byproduct.
      </figcaption>
    </figure>
  );
}
