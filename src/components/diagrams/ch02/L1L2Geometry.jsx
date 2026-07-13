const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const O1 = { x: 165, y: 195 };  // panel 1 origin (L2)
const O2 = { x: 475, y: 195 };  // panel 2 origin (L1)
const R = 55;                   // constraint radius

// Loss minimum offset from origin (same in both panels — same loss function)
const LOSS_DX = 90;
const LOSS_DY = -45;

// Three concentric, self-similar contour ellipses around the loss minimum
// (all share CONTOUR_ANGLE and the same rx:ry aspect ratio — true level sets
// of one quadratic loss are always scaled copies of the same ellipse shape).
// The outermost ellipse's (rx, ry) is solved so it is genuinely TANGENT to
// the L1 diamond's right corner T2 = (O2.x + R, O2.y): it passes exactly
// through T2 (ellipse value 1.0000) AND stays outside the diamond's two
// adjacent edges everywhere else (min value ~1.0000 along the top edge,
// ~1.0028 along the bottom edge, verified numerically by sampling 1000
// points per edge) — the earlier rx=72/ry=56.04 pair only satisfied the
// first condition, so the contour visibly cut through the diamond's edge
// before reaching the corner. The inner two contours are the same shape
// scaled down (matching the original 72→50→24 relative spacing).
const CONTOURS = [
  { rx: 55,    ry: 64.59 },
  { rx: 38.19, ry: 44.85 },
  { rx: 18.33, ry: 21.53 },
];
const CONTOUR_ANGLE = -22;

function Axes({ origin }) {
  const x0 = origin.x - 120;
  const x1 = origin.x + 130;
  const y0 = origin.y - 110;
  const y1 = origin.y + 75;
  return (
    <g>
      {/* x-axis */}
      <line x1={x0} y1={origin.y} x2={x1} y2={origin.y} stroke={C.border} strokeWidth="1" />
      {/* y-axis */}
      <line x1={origin.x} y1={y0} x2={origin.x} y2={y1} stroke={C.border} strokeWidth="1" />
      {/* axis labels */}
      <text x={x1 - 2} y={origin.y - 6} textAnchor="end" fontFamily={mono} fontSize="11" fill={C.muted}>w₁</text>
      <text x={origin.x + 8} y={y0 + 10} fontFamily={mono} fontSize="11" fill={C.muted}>w₂</text>
    </g>
  );
}

function Contours({ cx, cy }) {
  return (
    <g>
      {CONTOURS.map((e, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={e.rx}
          ry={e.ry}
          fill="none"
          stroke={C.muted}
          strokeWidth="1"
          opacity={0.45 + i * 0.18}
          transform={`rotate(${CONTOUR_ANGLE} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r="2.5" fill={C.muted2} />
    </g>
  );
}

export default function L1L2Geometry() {
  // Loss centers
  const L1c = { x: O1.x + LOSS_DX, y: O1.y + LOSS_DY };
  const L2c = { x: O2.x + LOSS_DX, y: O2.y + LOSS_DY };

  // L2 touch point (closest point on circle along the line from origin to loss center)
  const dist = Math.hypot(LOSS_DX, LOSS_DY);
  const T1 = {
    x: O1.x + (LOSS_DX * R) / dist,
    y: O1.y + (LOSS_DY * R) / dist,
  };

  // L1 touch — right corner of diamond
  const T2 = { x: O2.x + R, y: O2.y };

  // Diamond vertices for L1
  const diamond = `${O2.x + R},${O2.y} ${O2.x},${O2.y - R} ${O2.x - R},${O2.y} ${O2.x},${O2.y + R}`;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 360"
        width="100%"
        role="img"
        aria-label="L1 vs L2 constraint geometry showing sparsity of the lasso"
        style={{ display: 'block' }}
      >
        {/* Panel titles */}
        <text x={O1.x} y={28} textAnchor="middle" fontFamily={mono} fontSize="11.5" fill={C.text} letterSpacing="0.05em">
          L2  ·  ridge
        </text>
        <text x={O2.x} y={28} textAnchor="middle" fontFamily={mono} fontSize="11.5" fill={C.text} letterSpacing="0.05em">
          L1  ·  lasso
        </text>

        {/* ── Panel 1: L2 ───────────────────────────────── */}
        <Axes origin={O1} />

        {/* L2 constraint disc */}
        <circle
          cx={O1.x}
          cy={O1.y}
          r={R}
          fill="rgba(45,212,191,0.06)"
          stroke={C.accent}
          strokeWidth="1.5"
        />

        <Contours cx={L1c.x} cy={L1c.y} />

        {/* Touch point */}
        <circle cx={T1.x} cy={T1.y} r="4" fill={C.accent} stroke={C.bg2} strokeWidth="1.5" />
        <text x={T1.x + 8} y={T1.y - 6} fontFamily={mono} fontSize="10.5" fill={C.accent}>
          ŵ_ridge
        </text>

        {/* Constraint label */}
        <text
          x={O1.x}
          y={325}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          ‖w‖₂ ≤ t
        </text>

        {/* ── Panel 2: L1 ───────────────────────────────── */}
        <Axes origin={O2} />

        {/* L1 constraint diamond */}
        <polygon
          points={diamond}
          fill="rgba(45,212,191,0.06)"
          stroke={C.accent}
          strokeWidth="1.5"
        />

        <Contours cx={L2c.x} cy={L2c.y} />

        {/* Highlighted corner */}
        <circle cx={T2.x} cy={T2.y} r="6" fill="none" stroke={C.accent} strokeWidth="1.5" opacity="0.45" />
        <circle cx={T2.x} cy={T2.y} r="4" fill={C.accent} stroke={C.bg2} strokeWidth="1.5" />
        <text x={T2.x + 8} y={T2.y - 8} fontFamily={mono} fontSize="10.5" fill={C.accent}>
          ŵ_lasso
        </text>

        {/* Constraint label */}
        <text
          x={O2.x}
          y={325}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          ‖w‖₁ ≤ t
        </text>

        {/* Divider between panels */}
        <line x1="320" y1="40" x2="320" y2="310" stroke={C.border} strokeWidth="1" strokeDasharray="2,5" />
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
        The L1 constraint region has corners on the axes; loss contours
        preferentially intersect them, driving weights exactly to zero.
      </figcaption>
    </figure>
  );
}
