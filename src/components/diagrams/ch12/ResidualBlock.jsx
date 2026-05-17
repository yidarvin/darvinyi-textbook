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

// Main residual block on the left half
const BLOCK_CX = 200;
const BOX_W = 130;
const BOX_H = 32;

// Vertical positions
const Y_INPUT  = 30;
const Y_W1     = 80;
const Y_SIGMA  = 130;
const Y_W2     = 180;
const Y_PLUS   = 230;
const Y_OUTPUT = 280;

// Skip path runs to the right of the residual column
const SKIP_X = BLOCK_CX + BOX_W / 2 + 32;

// Right inset: gradient flow
const INSET_X0 = 410;
const INSET_X1 = 620;

function Box({ cx, cy, label, sublabel }) {
  return (
    <g>
      <rect
        x={cx - BOX_W / 2}
        y={cy - BOX_H / 2}
        width={BOX_W}
        height={BOX_H}
        rx="4"
        fill={C.bg3}
        stroke={C.borderLt}
        strokeWidth="1.5"
      />
      <text x={cx} y={cy + 4} textAnchor="middle"
            fontFamily={mono} fontSize="11.5" fill={C.text}>
        {label}
      </text>
      {sublabel && (
        <text x={cx + BOX_W / 2 + 8} y={cy + 4}
              fontFamily={sans} fontSize="9.5" fill={C.muted}
              fontStyle="italic">
          {sublabel}
        </text>
      )}
    </g>
  );
}

export default function ResidualBlock() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 380"
        width="100%"
        role="img"
        aria-label="A residual block: input forks into skip path and residual path, merged by addition"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="res-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="res-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* ── Section title for the inset ─────────────────────── */}
        <text x={(INSET_X0 + INSET_X1) / 2} y={20} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}>
          gradient flow (backward)
        </text>

        {/* ── Main residual block ─────────────────────────────── */}
        {/* Input x */}
        <text x={BLOCK_CX} y={Y_INPUT - 6} textAnchor="middle"
              fontFamily={mono} fontSize="13" fill={C.text}>
          x
        </text>
        {/* Fork point */}
        <circle cx={BLOCK_CX} cy={Y_INPUT + 4} r="2.5" fill={C.muted2} />

        {/* Skip path: from fork to + node (teal) */}
        <path
          d={`M ${BLOCK_CX} ${Y_INPUT + 4} L ${SKIP_X} ${Y_INPUT + 4} L ${SKIP_X} ${Y_PLUS} L ${BLOCK_CX + 12} ${Y_PLUS}`}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.6"
          markerEnd="url(#res-arrow-teal)"
        />
        <text x={SKIP_X + 8} y={(Y_INPUT + 4 + Y_PLUS) / 2 + 4}
              fontFamily={mono} fontSize="10.5" fill={C.accent}>
          skip (identity)
        </text>

        {/* Residual path: arrows between boxes */}
        <line x1={BLOCK_CX} y1={Y_INPUT + 6}
              x2={BLOCK_CX} y2={Y_W1 - BOX_H / 2}
              stroke={C.muted2} strokeWidth="1.4"
              markerEnd="url(#res-arrow)" />

        <Box cx={BLOCK_CX} cy={Y_W1} label="W₁ · x" />

        <line x1={BLOCK_CX} y1={Y_W1 + BOX_H / 2}
              x2={BLOCK_CX} y2={Y_SIGMA - BOX_H / 2}
              stroke={C.muted2} strokeWidth="1.4"
              markerEnd="url(#res-arrow)" />

        <Box cx={BLOCK_CX} cy={Y_SIGMA} label="σ (ReLU)" />

        <line x1={BLOCK_CX} y1={Y_SIGMA + BOX_H / 2}
              x2={BLOCK_CX} y2={Y_W2 - BOX_H / 2}
              stroke={C.muted2} strokeWidth="1.4"
              markerEnd="url(#res-arrow)" />

        <Box cx={BLOCK_CX} cy={Y_W2} label="W₂ · σ(W₁x)" />

        {/* Arrow from W2 box down to plus node — labeled F(x) */}
        <line x1={BLOCK_CX} y1={Y_W2 + BOX_H / 2}
              x2={BLOCK_CX} y2={Y_PLUS - 12}
              stroke={C.muted2} strokeWidth="1.4"
              markerEnd="url(#res-arrow)" />
        <text x={BLOCK_CX + 14} y={(Y_W2 + Y_PLUS) / 2 + 3}
              fontFamily={mono} fontSize="11" fill={C.muted2}>
          F(x)
        </text>

        {/* Plus node */}
        <circle cx={BLOCK_CX} cy={Y_PLUS} r="11"
                fill={C.bg2} stroke={C.borderLt} strokeWidth="1.5" />
        <text x={BLOCK_CX} y={Y_PLUS + 4} textAnchor="middle"
              fontFamily={mono} fontSize="14" fill={C.text}>
          +
        </text>

        {/* Output y arrow */}
        <line x1={BLOCK_CX} y1={Y_PLUS + 11}
              x2={BLOCK_CX} y2={Y_OUTPUT - 6}
              stroke={C.muted2} strokeWidth="1.4"
              markerEnd="url(#res-arrow)" />
        <text x={BLOCK_CX} y={Y_OUTPUT + 6} textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          y = F(x) + x
        </text>

        {/* Bottom annotation under the main block */}
        <text x={BLOCK_CX} y={Y_OUTPUT + 36} textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted2}
              fontStyle="italic">
          if the block should do nothing,
        </text>
        <text x={BLOCK_CX} y={Y_OUTPUT + 51} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}>
          F(x) → 0  ⇒  y → x  trivially
        </text>

        {/* ── Inset: gradient flow ─────────────────────────────── */}
        {/* Inset box */}
        <rect
          x={INSET_X0}
          y={30}
          width={INSET_X1 - INSET_X0}
          height={310}
          rx="6"
          fill="none"
          stroke={C.border}
          strokeWidth="0.8"
          strokeDasharray="3,3"
        />

        {/* Output of block at bottom of inset */}
        <text x={(INSET_X0 + INSET_X1) / 2} y={310} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          ∂L / ∂y
        </text>

        {/* Inset block (small) */}
        <rect
          x={(INSET_X0 + INSET_X1) / 2 - 35}
          y={195}
          width={70}
          height={50}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.2"
        />
        <text x={(INSET_X0 + INSET_X1) / 2} y={222} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          residual
        </text>
        <text x={(INSET_X0 + INSET_X1) / 2} y={235} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          block
        </text>

        {/* Bottom arrow up into the block */}
        <line
          x1={(INSET_X0 + INSET_X1) / 2}
          y1={295}
          x2={(INSET_X0 + INSET_X1) / 2}
          y2={250}
          stroke={C.muted2}
          strokeWidth="1.4"
          markerEnd="url(#res-arrow)"
        />

        {/* Two arrows going UP from the block: one via F (left), one via skip (right, teal) */}
        {/* Residual gradient path (left) */}
        <path
          d={`M ${(INSET_X0 + INSET_X1) / 2 - 22} 195 C ${(INSET_X0 + INSET_X1) / 2 - 40} 150, ${(INSET_X0 + INSET_X1) / 2 - 40} 110, ${(INSET_X0 + INSET_X1) / 2 - 22} 80`}
          fill="none"
          stroke={C.muted2}
          strokeWidth="1.4"
          markerEnd="url(#res-arrow)"
        />
        <text x={(INSET_X0 + INSET_X1) / 2 - 60} y={140}
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          ∂F/∂x
        </text>

        {/* Skip gradient path (right, teal) — the "1" highway */}
        <path
          d={`M ${(INSET_X0 + INSET_X1) / 2 + 22} 195 C ${(INSET_X0 + INSET_X1) / 2 + 40} 150, ${(INSET_X0 + INSET_X1) / 2 + 40} 110, ${(INSET_X0 + INSET_X1) / 2 + 22} 80`}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.8"
          markerEnd="url(#res-arrow-teal)"
        />
        <text x={(INSET_X0 + INSET_X1) / 2 + 30} y={140}
              fontFamily={mono} fontSize="11" fill={C.accent}>
          × 1
        </text>

        {/* Upstream gradient at top */}
        <text x={(INSET_X0 + INSET_X1) / 2} y={68} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          ∂L / ∂x
        </text>
        <text x={(INSET_X0 + INSET_X1) / 2} y={50} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          = (∂L/∂y) · (1 + ∂F/∂x)
        </text>

        <text x={(INSET_X0 + INSET_X1) / 2} y={330} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted}
              fontStyle="italic">
          the "1" never vanishes
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
        A residual block adds the input back to its own transformed version —
        making the identity mapping easy to learn and creating a direct
        gradient pathway during backpropagation.
      </figcaption>
    </figure>
  );
}
