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

// Image with grid
const IMG = { x: 30, y: 50, w: 130, h: 130 };
const CELL_W = IMG.w / 4;
const CELL_H = IMG.h / 4;
const HIGHLIGHT = { row: 1, col: 2 };

// Token row
const TOK_Y = 80;
const TOK_H = 50;
const TOK_W = 28;
const TOK_GAP = 6;
const TOK_X_START = 260;

const TOKENS = [
  { sub: '[CLS]', teal: true },
  { sub: 'p_1',   teal: false },
  { sub: 'p_2',   teal: false },
  { sub: 'p_3',   teal: false },
  { sub: '...',   teal: false, isEllipsis: true },
  { sub: 'p_N',   teal: false },
];

function ImageGrid() {
  return (
    <g>
      {/* Image rect */}
      <rect
        x={IMG.x} y={IMG.y}
        width={IMG.w} height={IMG.h}
        rx="3"
        fill={C.bg3}
        stroke={C.borderLt}
        strokeWidth="1.5"
      />

      {/* Faint image-like content suggestion */}
      <circle cx={IMG.x + 32} cy={IMG.y + 38} r="14"
              fill={C.muted} opacity="0.18" />
      <polyline
        points={`${IMG.x+8},${IMG.y+IMG.h-22} ${IMG.x+38},${IMG.y+IMG.h-48} ${IMG.x+70},${IMG.y+IMG.h-30} ${IMG.x+100},${IMG.y+IMG.h-58} ${IMG.x+IMG.w-8},${IMG.y+IMG.h-34}`}
        fill="none"
        stroke={C.muted}
        strokeWidth="0.9"
        opacity="0.4"
      />

      {/* Highlighted patch (drawn before grid so grid lines remain visible) */}
      <rect
        x={IMG.x + HIGHLIGHT.col * CELL_W}
        y={IMG.y + HIGHLIGHT.row * CELL_H}
        width={CELL_W}
        height={CELL_H}
        fill={C.accentDim}
        stroke={C.accent}
        strokeWidth="1.5"
      />

      {/* Grid lines */}
      {[1, 2, 3].map((i) => (
        <line key={`v-${i}`}
              x1={IMG.x + i * CELL_W} y1={IMG.y}
              x2={IMG.x + i * CELL_W} y2={IMG.y + IMG.h}
              stroke={C.border} strokeWidth="0.8" />
      ))}
      {[1, 2, 3].map((i) => (
        <line key={`h-${i}`}
              x1={IMG.x} y1={IMG.y + i * CELL_H}
              x2={IMG.x + IMG.w} y2={IMG.y + i * CELL_H}
              stroke={C.border} strokeWidth="0.8" />
      ))}
    </g>
  );
}

function TokenGlyph({ x, y, w, h, teal, isEllipsis, sub }) {
  if (isEllipsis) {
    return (
      <g>
        <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle"
              fontFamily={mono} fontSize="16" fill={C.muted2}>
          ⋯
        </text>
      </g>
    );
  }
  const segments = 4;
  const segH = h / segments;
  return (
    <g>
      <rect
        x={x} y={y}
        width={w} height={h}
        rx="3"
        fill={teal ? C.accentDim : C.bg3}
        stroke={teal ? C.accent : C.borderLt}
        strokeWidth="1.5"
      />
      {Array.from({ length: segments - 1 }).map((_, i) => (
        <line key={i}
              x1={x + 3} y1={y + (i + 1) * segH}
              x2={x + w - 3} y2={y + (i + 1) * segH}
              stroke={teal ? C.accent : C.border}
              strokeWidth="0.7"
              opacity={0.55} />
      ))}
    </g>
  );
}

export default function ViTPatchPipeline() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 380"
        width="100%"
        role="img"
        aria-label="ViT pipeline: image is patched, flattened, embedded, and fed to a transformer encoder"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="vit-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* ── Image with grid ───────────────────────────── */}
        <ImageGrid />

        {/* Image label */}
        <text x={IMG.x + IMG.w / 2} y={IMG.y + IMG.h + 18}
              textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          image 224×224×3
        </text>
        <text x={IMG.x + IMG.w / 2} y={IMG.y + IMG.h + 33}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted}
              fontStyle="italic">
          (shown 4×4; actually 14×14 = 196 patches)
        </text>

        {/* Highlighted patch callout */}
        <line
          x1={IMG.x + (HIGHLIGHT.col + 1) * CELL_W}
          y1={IMG.y + HIGHLIGHT.row * CELL_H + CELL_H / 2}
          x2={IMG.x + IMG.w + 18}
          y2={20}
          stroke={C.accent}
          strokeWidth="1"
          strokeDasharray="2,3"
        />
        <text x={IMG.x + IMG.w + 22} y={18}
              fontFamily={mono} fontSize="10.5" fill={C.accent}>
          one 16×16 patch
        </text>

        {/* ── Arrow: flatten + linearly project ─────────── */}
        <line
          x1={IMG.x + IMG.w + 12}
          y1={TOK_Y + TOK_H / 2}
          x2={TOK_X_START - 8}
          y2={TOK_Y + TOK_H / 2}
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#vit-arrow)"
        />
        <text
          x={(IMG.x + IMG.w + TOK_X_START) / 2}
          y={TOK_Y + TOK_H / 2 - 14}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted2}
        >
          flatten + project
        </text>
        <text
          x={(IMG.x + IMG.w + TOK_X_START) / 2}
          y={TOK_Y + TOK_H / 2 + 26}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          E ∈ ℝ^(P²C×D)
        </text>

        {/* ── Token row ──────────────────────────────── */}
        {TOKENS.map((t, i) => {
          const x = TOK_X_START + i * (TOK_W + TOK_GAP);
          return (
            <g key={`tok-${i}`}>
              <TokenGlyph
                x={x} y={TOK_Y}
                w={TOK_W} h={TOK_H}
                teal={t.teal}
                isEllipsis={t.isEllipsis}
              />
              <text
                x={x + TOK_W / 2}
                y={TOK_Y - 6}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="9.5"
                fill={t.teal ? C.accent : C.muted2}
              >
                {t.sub}
              </text>
            </g>
          );
        })}

        {/* ── "+" between rows ─────────────────────────── */}
        <text
          x={TOK_X_START + 3 * (TOK_W + TOK_GAP) + TOK_W / 2}
          y={TOK_Y + TOK_H + 24}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="20"
          fill={C.muted2}
        >
          +
        </text>

        {/* ── Position-embedding row ────────────────── */}
        {TOKENS.map((t, i) => {
          const x = TOK_X_START + i * (TOK_W + TOK_GAP);
          const py = TOK_Y + TOK_H + 36;
          const ph = 38;
          return (
            <g key={`pos-${i}`}>
              {t.isEllipsis ? (
                <text x={x + TOK_W / 2} y={py + ph / 2 + 4}
                      textAnchor="middle"
                      fontFamily={mono} fontSize="14" fill={C.muted2}>
                  ⋯
                </text>
              ) : (
                <>
                  <rect
                    x={x} y={py}
                    width={TOK_W} height={ph}
                    rx="3"
                    fill={C.bg3}
                    stroke={C.border}
                    strokeWidth="1"
                  />
                  <line x1={x + 3} y1={py + ph / 2}
                        x2={x + TOK_W - 3} y2={py + ph / 2}
                        stroke={C.border} strokeWidth="0.7" opacity={0.6} />
                </>
              )}
            </g>
          );
        })}

        {/* E_pos label to the right */}
        <text
          x={TOK_X_START + 6 * (TOK_W + TOK_GAP) + 6}
          y={TOK_Y + TOK_H + 36 + 24}
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted2}
        >
          E_pos
        </text>

        {/* ── Final arrow → transformer encoder ───────── */}
        {(() => {
          const tokensEnd = TOK_X_START + 5 * (TOK_W + TOK_GAP) + TOK_W;
          const arrowY = TOK_Y + TOK_H + 8;
          return (
            <g>
              <line
                x1={tokensEnd + 50}
                y1={arrowY}
                x2={620}
                y2={arrowY}
                stroke={C.muted2}
                strokeWidth="1.5"
                markerEnd="url(#vit-arrow)"
              />
              <text
                x={(tokensEnd + 50 + 620) / 2}
                y={arrowY - 8}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.muted2}
              >
                → encoder
              </text>
              <text
                x={(tokensEnd + 50 + 620) / 2}
                y={arrowY + 16}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="9.5"
                fill={C.muted}
              >
                (same as text)
              </text>
            </g>
          );
        })()}

        {/* ── Bottom annotation ─────────────────────────── */}
        <text
          x="320"
          y="290"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted2}
        >
          same transformer stack as text — only the tokenizer changes
        </text>

        {/* Equation under the bottom annotation */}
        <text
          x="320"
          y="318"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted}
        >
          z₀ = [ x_cls ; x_p¹E ; … ; x_p^N E ] + E_pos
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
        ViT converts an image into a sequence of patch tokens; the transformer
        architecture itself is unchanged from the language case.
      </figcaption>
    </figure>
  );
}
