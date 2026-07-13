const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.14)',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const CANDIDATES = [
  { cls: 'dog',   sim: 0.82, best: true },
  { cls: 'cat',   sim: 0.31, best: false },
  { cls: 'car',   sim: 0.09, best: false },
  { cls: 'horse', sim: 0.24, best: false },
];

// Geometry
const IMG = { x: 270, y: 24, w: 100, h: 60 };
const V_EMBED = { x: 285, y: 118, w: 70, h: 26 };

// Text candidate columns (4 columns across viewBox 640)
const COL_COUNT = 4;
const COL_W = 132;
const COL_GAP = 10;
const TOTAL_W = COL_COUNT * COL_W + (COL_COUNT - 1) * COL_GAP; // 562
const COL_X_START = (640 - TOTAL_W) / 2;                       // 39

const colCenter = (i) => COL_X_START + i * (COL_W + COL_GAP) + COL_W / 2;

const TEXT_BOX_Y = 188;
const TEXT_BOX_H = 34;
const T_EMBED_Y = 268;
const T_EMBED_H = 24;
const T_EMBED_W = 60;

const ARGMAX_Y = 358;
const ARGMAX_BOX = { x: 240, y: ARGMAX_Y, w: 160, h: 40 };

function ImageGlyph() {
  const { x, y, w, h } = IMG;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3"
            fill={C.bg3} stroke={C.borderLt} strokeWidth="1.5" />
      {/* Suggest a photo: sun + horizon + small subject */}
      <circle cx={x + 22} cy={y + 18} r="5" fill={C.muted} opacity="0.5" />
      <line x1={x + 6} y1={y + h - 16} x2={x + w - 6} y2={y + h - 16}
            stroke={C.muted} strokeWidth="0.8" opacity="0.55" />
      <polyline
        points={`${x+w-46},${y+h-16} ${x+w-38},${y+h-26} ${x+w-30},${y+h-20} ${x+w-22},${y+h-30} ${x+w-12},${y+h-16}`}
        fill="none" stroke={C.muted} strokeWidth="0.8" opacity="0.55"
      />
      <text x={x + w / 2} y={y - 6} textAnchor="middle"
            fontFamily={mono} fontSize="10.5" fill={C.muted2}>
        image
      </text>
    </g>
  );
}

function EmbeddingGlyph({ x, y, w, h, teal, label, sublabel }) {
  const segments = 5;
  const segW = w / segments;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3"
            fill={teal ? C.accentDim : C.bg3}
            stroke={teal ? C.accent : C.borderLt}
            strokeWidth="1.5" />
      {Array.from({ length: segments - 1 }).map((_, i) => (
        <line key={i}
              x1={x + (i + 1) * segW} y1={y + 3}
              x2={x + (i + 1) * segW} y2={y + h - 3}
              stroke={teal ? C.accent : C.border}
              strokeWidth="0.6" opacity={0.55} />
      ))}
      {label && (
        <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle"
              fontFamily={mono} fontSize="10"
              fill={teal ? C.accent : C.muted2}>
          {label}
        </text>
      )}
      {sublabel && (
        <text x={x + w / 2} y={y + h + 14} textAnchor="middle"
              fontFamily={mono} fontSize="9.5"
              fill={C.muted}>
          {sublabel}
        </text>
      )}
    </g>
  );
}

export default function ZeroShotClassification() {
  // v origin point for similarity connectors
  const vCx = V_EMBED.x + V_EMBED.w / 2;
  const vCyBottom = V_EMBED.y + V_EMBED.h;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 480"
        width="100%"
        role="img"
        aria-label="Zero-shot classification: image embedding compared to class-prompt embeddings via cosine similarity"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="zs-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="zs-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* ── Image input ───────────────────────────────── */}
        <ImageGlyph />

        {/* Vision-encoder arrow */}
        <line
          x1={IMG.x + IMG.w / 2}
          y1={IMG.y + IMG.h + 4}
          x2={IMG.x + IMG.w / 2}
          y2={V_EMBED.y - 6}
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#zs-arrow)"
        />
        <text
          x={IMG.x + IMG.w / 2 + 10}
          y={(IMG.y + IMG.h + V_EMBED.y) / 2 + 4}
          fontFamily={mono} fontSize="10.5" fill={C.muted2}
        >
          vision encoder
        </text>

        {/* Image embedding v */}
        <EmbeddingGlyph
          x={V_EMBED.x} y={V_EMBED.y}
          w={V_EMBED.w} h={V_EMBED.h}
          teal
          label="v"
          sublabel="v ∈ ℝ^d"
        />

        {/* ── Text candidate boxes ──────────────────────── */}
        {CANDIDATES.map((cand, i) => {
          const x = COL_X_START + i * (COL_W + COL_GAP);
          return (
            <g key={`text-${i}`}>
              <rect
                x={x} y={TEXT_BOX_Y}
                width={COL_W} height={TEXT_BOX_H}
                rx="4"
                fill={C.bg3}
                stroke={C.borderLt}
                strokeWidth="1.5"
              />
              <text
                x={x + COL_W / 2}
                y={TEXT_BOX_Y + TEXT_BOX_H / 2 + 4}
                textAnchor="middle"
                fontFamily={mono} fontSize="10.5"
                fill={C.text}
              >
                {`"a photo of a ${cand.cls}"`}
              </text>
            </g>
          );
        })}

        {/* Section label */}
        <text
          x={320} y={TEXT_BOX_Y - 12}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          CLASS-NAME PROMPTS
        </text>

        {/* Text-encoder arrows */}
        {CANDIDATES.map((_, i) => {
          const cx = colCenter(i);
          return (
            <g key={`txt-enc-${i}`}>
              <line
                x1={cx}
                y1={TEXT_BOX_Y + TEXT_BOX_H + 2}
                x2={cx}
                y2={T_EMBED_Y - 6}
                stroke={C.muted2}
                strokeWidth="1.4"
                markerEnd="url(#zs-arrow)"
              />
            </g>
          );
        })}
        <text
          x={colCenter(0) + 38}
          y={TEXT_BOX_Y + TEXT_BOX_H + 26}
          fontFamily={mono} fontSize="10.5" fill={C.muted2}
        >
          text encoder (×4)
        </text>

        {/* Text embeddings t_i */}
        {CANDIDATES.map((cand, i) => {
          const cx = colCenter(i);
          return (
            <EmbeddingGlyph
              key={`t-${i}`}
              x={cx - T_EMBED_W / 2}
              y={T_EMBED_Y}
              w={T_EMBED_W}
              h={T_EMBED_H}
              teal={false}
              label={`t_${i + 1}`}
              sublabel={null}
            />
          );
        })}

        {/* ── Similarity connectors: from v to each t_i ─── */}
        {CANDIDATES.map((cand, i) => {
          const cx = colCenter(i);
          const x2 = cx;
          const y2 = T_EMBED_Y;
          const isBest = cand.best;
          const stroke = isBest ? C.accent : C.borderLt;
          const sw = isBest ? 1.6 : 1.0;
          const dash = isBest ? '4,3' : '3,4';
          // Place sim label near the midpoint of the connector
          const mx = (vCx + x2) / 2;
          const my = (vCyBottom + y2) / 2;
          return (
            <g key={`sim-${i}`}>
              <line
                x1={vCx} y1={vCyBottom}
                x2={x2} y2={y2}
                stroke={stroke}
                strokeWidth={sw}
                strokeDasharray={dash}
                opacity={isBest ? 1 : 0.65}
              />
            </g>
          );
        })}

        {/* Similarity scores: small badges below each t_i */}
        {CANDIDATES.map((cand, i) => {
          const cx = colCenter(i);
          const isBest = cand.best;
          return (
            <g key={`score-${i}`}>
              <rect
                x={cx - 30}
                y={T_EMBED_Y + T_EMBED_H + 10}
                width={60}
                height={22}
                rx="4"
                fill={isBest ? C.accentDim : C.bg3}
                stroke={isBest ? C.accent : C.borderLt}
                strokeWidth="1.5"
              />
              <text
                x={cx}
                y={T_EMBED_Y + T_EMBED_H + 25}
                textAnchor="middle"
                fontFamily={mono} fontSize="11"
                fill={isBest ? C.accent : C.muted2}
              >
                {cand.sim.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* "cos(v, t_i)" annotation row */}
        <text
          x={colCenter(3) + 60}
          y={T_EMBED_Y + T_EMBED_H + 25}
          fontFamily={mono} fontSize="10" fill={C.muted}
        >
          ← cos(v, t_i)
        </text>

        {/* ── Argmax → "dog" ───────────────────────────── */}
        {/* Convergence line from best similarity score down to argmax box */}
        <line
          x1={colCenter(0)}
          y1={T_EMBED_Y + T_EMBED_H + 34}
          x2={ARGMAX_BOX.x + ARGMAX_BOX.w / 2}
          y2={ARGMAX_BOX.y - 4}
          stroke={C.accent}
          strokeWidth="1.5"
          strokeDasharray="4,3"
          markerEnd="url(#zs-arrow-teal)"
        />

        <rect
          x={ARGMAX_BOX.x} y={ARGMAX_BOX.y}
          width={ARGMAX_BOX.w} height={ARGMAX_BOX.h}
          rx="5"
          fill={C.accentDim}
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <text
          x={ARGMAX_BOX.x + ARGMAX_BOX.w / 2}
          y={ARGMAX_BOX.y + ARGMAX_BOX.h / 2 + 5}
          textAnchor="middle"
          fontFamily={mono} fontSize="13"
          fill={C.accent}
          fontWeight="500"
        >
          argmax → "dog"
        </text>

        {/* ── Bottom annotation ─────────────────────────── */}
        <text
          x="320"
          y="430"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted2}
        >
          no fine-tuning, no labeled training data
        </text>
        <text
          x="320"
          y="448"
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted}
          fontStyle="italic"
        >
          model was only trained to align image–caption pairs
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
        Zero-shot classification is retrieval: embed the image, embed each class
        name, return the most similar.
      </figcaption>
    </figure>
  );
}
