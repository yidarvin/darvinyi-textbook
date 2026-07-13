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

const TAGS = ['dog', 'cat', 'car', 'tree', 'house', 'boat'];

const SIM = [
  [0.86, 0.18, 0.07, 0.22, 0.14, 0.11],
  [0.21, 0.83, 0.09, 0.17, 0.12, 0.08],
  [0.06, 0.11, 0.88, 0.13, 0.19, 0.27],
  [0.24, 0.15, 0.10, 0.79, 0.21, 0.16],
  [0.13, 0.09, 0.22, 0.18, 0.84, 0.14],
  [0.10, 0.13, 0.25, 0.20, 0.17, 0.81],
];

// Matrix layout
const CELL = 42;
const N = 6;
const M_X = 200;          // matrix left
const M_Y = 110;          // matrix top
const M_W = CELL * N;     // 252
const M_H = CELL * N;     // 252

// Column-glyph (image) area above matrix
const IMG_W = 30;
const IMG_H = 38;
const IMG_Y = 30;

// Row-label (text) area left of matrix
const TXT_X_RIGHT = M_X - 12;

function ImageGlyph({ cx, cy, tag, i }) {
  // Small image glyph: rect with a few internal strokes suggesting an image
  const x = cx - IMG_W / 2;
  const y = cy - IMG_H / 2;
  return (
    <g>
      <rect
        x={x} y={y}
        width={IMG_W} height={IMG_H}
        rx="3"
        fill={C.bg3}
        stroke={C.borderLt}
        strokeWidth="1"
      />
      {/* faint internal strokes */}
      <line x1={x + 4} y1={y + 22} x2={x + IMG_W - 4} y2={y + 22}
            stroke={C.muted} strokeWidth="0.8" opacity="0.6" />
      <circle cx={x + 9} cy={y + 12} r="2.2" fill={C.muted} opacity="0.65" />
      <polyline points={`${x+4},${y+IMG_H-5} ${x+12},${y+IMG_H-14} ${x+20},${y+IMG_H-8} ${x+IMG_W-4},${y+IMG_H-12}`}
                fill="none" stroke={C.muted} strokeWidth="0.8" opacity="0.6" />
      <text x={cx} y={cy + IMG_H / 2 + 12}
            textAnchor="middle"
            fontFamily={mono}
            fontSize="9.5"
            fill={C.muted2}>
        {`img ${i + 1}`}
      </text>
      <text x={cx} y={cy + IMG_H / 2 + 24}
            textAnchor="middle"
            fontFamily={mono}
            fontSize="9.5"
            fill={C.text}>
        {tag}
      </text>
    </g>
  );
}

export default function CLIPContrastiveMatrix() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 480"
        width="100%"
        role="img"
        aria-label="CLIP symmetric contrastive matrix: image-text similarities in a batch"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="clip-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* ── Image glyphs above the matrix ─────────────── */}
        {TAGS.map((tag, i) => (
          <ImageGlyph
            key={`img-${i}`}
            cx={M_X + i * CELL + CELL / 2}
            cy={IMG_Y + IMG_H / 2}
            tag={tag}
            i={i}
          />
        ))}

        {/* ── Text labels to the left of the matrix ─────── */}
        {TAGS.map((tag, j) => (
          <text
            key={`txt-${j}`}
            x={TXT_X_RIGHT}
            y={M_Y + j * CELL + CELL / 2 + 4}
            textAnchor="end"
            fontFamily={mono}
            fontSize="11"
            fill={C.text}
          >
            {`"a photo of a ${tag}"`}
          </text>
        ))}

        {/* ── Matrix cells ──────────────────────────────── */}
        {SIM.map((row, j) =>
          row.map((v, i) => {
            const isDiag = i === j;
            const cx = M_X + i * CELL;
            const cy = M_Y + j * CELL;
            return (
              <g key={`cell-${i}-${j}`}>
                <rect
                  x={cx + 1.5}
                  y={cy + 1.5}
                  width={CELL - 3}
                  height={CELL - 3}
                  rx="3"
                  fill={isDiag ? C.accentDim : C.bg3}
                  stroke={isDiag ? C.accent : C.border}
                  strokeWidth="1.5"
                />
                <text
                  x={cx + CELL / 2}
                  y={cy + CELL / 2 + 4}
                  textAnchor="middle"
                  fontFamily={mono}
                  fontSize="10.5"
                  fill={isDiag ? C.accent : C.muted2}
                >
                  {v.toFixed(2)}
                </text>
              </g>
            );
          })
        )}

        {/* ── Annotation: positives arrow ───────────────── */}
        <g>
          <line
            x1={M_X + M_W + 90}
            y1={M_Y + 18}
            x2={M_X + M_W - 6}
            y2={M_Y + CELL / 2}
            stroke={C.accent}
            strokeWidth="1.2"
            strokeDasharray="3,3"
            markerEnd="url(#clip-arrow)"
          />
          <text
            x={M_X + M_W + 14}
            y={M_Y - 4}
            fontFamily={mono}
            fontSize="10.5"
            fill={C.accent}
          >
            positives
          </text>
          <text
            x={M_X + M_W + 14}
            y={M_Y + 10}
            fontFamily={sans}
            fontSize="10.5"
            fill={C.muted2}
            fontStyle="italic"
          >
            matched pairs
          </text>
        </g>

        {/* ── Annotation: negatives arrow ───────────────── */}
        <g>
          <line
            x1={M_X + M_W + 90}
            y1={M_Y + M_H - 30}
            x2={M_X + M_W - 6}
            y2={M_Y + M_H - CELL - CELL / 2}
            stroke={C.muted2}
            strokeWidth="1.2"
            strokeDasharray="3,3"
            markerEnd="url(#clip-arrow)"
          />
          <text
            x={M_X + M_W + 14}
            y={M_Y + M_H - 12}
            fontFamily={mono}
            fontSize="10.5"
            fill={C.text}
          >
            negatives
          </text>
          <text
            x={M_X + M_W + 14}
            y={M_Y + M_H + 2}
            fontFamily={sans}
            fontSize="10.5"
            fill={C.muted2}
            fontStyle="italic"
          >
            mismatched · free
          </text>
        </g>

        {/* ── Bottom annotation ─────────────────────────── */}
        <text
          x={M_X + M_W / 2}
          y={M_Y + M_H + 38}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted2}
        >
          loss = cross-entropy along rows AND columns, summed
        </text>

        {/* ── Axis labels ───────────────────────────────── */}
        <text
          x={M_X + M_W / 2}
          y={IMG_Y - 18}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          IMAGES  (vision encoder)
        </text>
        <text
          x={26}
          y={M_Y + M_H / 2}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted}
          letterSpacing="0.05em"
          transform={`rotate(-90 26 ${M_Y + M_H / 2})`}
        >
          TEXT  (text encoder)
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
        CLIP's symmetric InfoNCE: every other pair in the batch is implicitly a
        negative, scaling training pairs to billions without per-pair annotation.
      </figcaption>
    </figure>
  );
}
