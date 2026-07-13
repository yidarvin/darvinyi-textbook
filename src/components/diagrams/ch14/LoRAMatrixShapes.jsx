const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  border2: '#3f3f46',
  accent:  '#2dd4bf',
  accentDim: '#0b2422',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Matrix shape sizes (exaggerated for legibility, not to literal scale)
const BIG = 120;
const THIN = 14;

// Vertical centerline for matrices
const CY = 132;

// X positions of each matrix's left edge
const W0_X   = 56;
const B_X    = 232;
const A_X    = B_X + THIN;          // A touches B's right edge
const X_X    = 432;

// Operator x positions
const OPEN_X  = 38;
const PLUS_X  = 210;
const CLOSE_X = A_X + BIG + 4;      // 380
const DOT_X   = CLOSE_X + 22;       // 402
const RPAREN_PAD = 8;

const MAT_TOP = CY - BIG / 2;       // 72
const A_TOP   = CY - THIN / 2;      // 125

function MatrixRect({ x, y, w, h, stroke, fill, fillOpacity, label, labelColor }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {label && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={labelColor}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Operator({ x, y, ch, size = 16, color }) {
  return (
    <text
      x={x}
      y={y + 5}
      textAnchor="middle"
      fontFamily={mono}
      fontSize={size}
      fill={color}
    >
      {ch}
    </text>
  );
}

export default function LoRAMatrixShapes() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 360"
        width="100%"
        role="img"
        aria-label="LoRA decomposition: frozen W0 plus low-rank product BA, applied to x"
        style={{ display: 'block' }}
      >
        {/* Top dimension labels */}
        <text x={W0_X + BIG / 2} y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>d × k</text>
        <text x={B_X + THIN / 2} y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.accent}>d × r</text>
        <text x={A_X + BIG / 2}  y={A_TOP - 18} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.accent}>r × k</text>
        <text x={X_X + THIN / 2} y={42} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>k × 1</text>

        {/* Matrix name labels */}
        <text x={W0_X + BIG / 2} y={62} textAnchor="middle" fontFamily={mono} fontSize="13" fill={C.text}>W₀</text>
        <text x={B_X + THIN / 2} y={62} textAnchor="middle" fontFamily={mono} fontSize="13" fill={C.accent}>B</text>
        <text x={A_X + BIG / 2}  y={A_TOP - 4} textAnchor="middle" fontFamily={mono} fontSize="13" fill={C.accent}>A</text>
        <text x={X_X + THIN / 2} y={62} textAnchor="middle" fontFamily={mono} fontSize="13" fill={C.text}>x</text>

        {/* Opening paren */}
        <Operator x={OPEN_X} y={CY} ch="(" size={64} color={C.muted} />

        {/* W₀ — large square, frozen */}
        <MatrixRect
          x={W0_X}
          y={MAT_TOP}
          w={BIG}
          h={BIG}
          stroke={C.border2}
          fill={C.bg2}
          fillOpacity={1}
          label="frozen"
          labelColor={C.muted2}
        />

        {/* Plus operator */}
        <Operator x={PLUS_X} y={CY} ch="+" size={20} color={C.text} />

        {/* B — tall thin */}
        <MatrixRect
          x={B_X}
          y={MAT_TOP}
          w={THIN}
          h={BIG}
          stroke={C.accent}
          fill={C.accent}
          fillOpacity={0.22}
        />

        {/* A — short wide (touches B's right edge) */}
        <MatrixRect
          x={A_X}
          y={A_TOP}
          w={BIG}
          h={THIN}
          stroke={C.accent}
          fill={C.accent}
          fillOpacity={0.22}
        />

        {/* Closing paren */}
        <Operator x={CLOSE_X + RPAREN_PAD} y={CY} ch=")" size={64} color={C.muted} />

        {/* Dot between (W₀+BA) and x */}
        <Operator x={DOT_X + RPAREN_PAD} y={CY} ch="·" size={20} color={C.text} />

        {/* x — column vector */}
        <MatrixRect
          x={X_X}
          y={MAT_TOP}
          w={THIN}
          h={BIG}
          stroke={C.border2}
          fill={C.bg2}
          fillOpacity={1}
        />

        {/* Separator above param-count table */}
        <line
          x1={60}
          y1={224}
          x2={580}
          y2={224}
          stroke={C.border}
          strokeWidth="1"
        />

        {/* Parameter count table (using d=k=4096, r=8) */}
        <text x={60} y={248} fontFamily={mono} fontSize="11" fill={C.muted2}>
          W₀:  d × k = 4096 × 4096 ≈ 16.8M
        </text>
        <text x={420} y={248} fontFamily={mono} fontSize="11" fill={C.muted}>
          (frozen)
        </text>

        <text x={60} y={268} fontFamily={mono} fontSize="11" fill={C.accent}>
          B:   d × r = 4096 × 8 = 32,768
        </text>
        <text x={60} y={286} fontFamily={mono} fontSize="11" fill={C.accent}>
          A:   r × k = 8 × 4096 = 32,768
        </text>

        <line
          x1={60}
          y1={300}
          x2={400}
          y2={300}
          stroke={C.border}
          strokeWidth="1"
        />

        <text x={60} y={320} fontFamily={mono} fontSize="11.5" fill={C.text}>
          LoRA trainable: 65,536
        </text>
        <text x={250} y={320} fontFamily={mono} fontSize="11.5" fill={C.accent}>
          (~0.4% of W₀)
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
        LoRA leaves the pretrained W₀ frozen and learns a low-rank update BA —
        a fraction of a percent of the original parameter count.
      </figcaption>
    </figure>
  );
}
