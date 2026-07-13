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

// Panel layout: three panels in row
const PANEL_CX  = [115, 320, 525];
const PANEL_CY  = 140;
const HALF      = 85;        // SVG half-extent for the [-1, 1] coord square
const PANEL_W   = 180;
const PANEL_H   = 220;

// Convert panel-relative coord (range −1..1) to SVG coords inside panel i.
const X = (i, c) => PANEL_CX[i] + c * HALF;
const Y = (_, c) => PANEL_CY - c * HALF;   // flip y so +y is up

// Dataset — identical across all three panels.
// Class A — predominantly inside a soft central region, with 2 outliers.
const CLASS_A = [
  [-0.2, 0.1], [0.3, -0.1], [0.0, 0.4], [-0.4, -0.3], [0.5, 0.2],
  [-0.1, -0.4], [0.4, -0.4], [-0.3, 0.5], [0.2, 0.0], [0.0, -0.2],
  [-0.5, 0.0], [0.1, 0.5], [0.45, -0.25],
  // outliers (class A in the outer ring — sources of variance for k-NN)
  [-0.85, 0.3], [0.8, 0.6],
];

// Class B — predominantly outside; 2 outliers leak inside.
const CLASS_B = [
  [-0.9, 0.0], [0.0, -0.9], [0.9, -0.05], [0.05, 0.9], [-0.75, 0.5],
  [0.75, -0.5], [-0.7, -0.55], [0.7, 0.55], [-0.85, 0.75], [0.85, -0.75],
  [-0.5, -0.85], [0.5, 0.85], [-0.9, -0.7],
  // outliers (class B leaking inside — source of irreducible noise)
  [0.3, 0.3], [-0.2, -0.4],
];

// Vertex sequence for the 1-NN region enclosing class A, computed as the true
// nearest-neighbor (Voronoi-union) boundary for the CLASS_A/CLASS_B points
// above, clipped to the plotted [-1, 1] square. This guarantees the
// zero-training-error property of 1-NN: every CLASS_A point falls strictly
// inside a drawn region and every CLASS_B point strictly outside. Note the
// outlier at [-0.85, 0.3] is not an isolated island — its cell is connected
// to the main cluster by an open corridor with no class-B point in between,
// so it appears as a peninsula reaching the left edge of the plot.
const JAGGED_MAIN = [
  [-1.0, 0.17], [-0.7, 0.12], [-0.7, -0.24], [-0.42, -0.58], [-0.22, -0.18],
  [-0.15, -0.25], [-0.15, -0.67], [0.15, -0.61], [0.43, -0.83], [0.49, -0.75],
  [0.59, -0.38], [0.72, -0.24], [0.63, -0.04], [0.81, 0.25], [0.49, 0.44],
  [0.34, 0.12], [0.1, 0.2], [0.15, 0.35], [0.38, 0.58], [0.26, 0.72],
  [-0.1, 0.68], [-0.42, 0.96], [-0.53, 0.74], [-0.53, 0.3], [-0.56, 0.28], [-1.0, 0.5],
];

// The outlier at [0.8, 0.6] does form its own separate cell, but that cell is
// unbounded (nearest-neighbor territory extending away from the cluster), so
// clipped to the plot bounds it reaches the top-right corner rather than
// forming a small closed island.
const ISLAND_TR = [[1.0, 1.0], [0.88, 1.0], [0.67, 0.74], [0.9, 0.28], [1.0, 0.3]];

// Build SVG polygon `points` string from panel index + coord array.
function pts(i, arr) {
  return arr.map(([cx, cy]) => `${X(i, cx).toFixed(1)},${Y(i, cy).toFixed(1)}`).join(' ');
}

function PanelFrame({ i, title }) {
  return (
    <g>
      {/* Title above the panel */}
      <text
        x={PANEL_CX[i]}
        y={22}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={C.muted}
        letterSpacing="0.05em"
      >
        {title}
      </text>
      {/* Panel frame */}
      <rect
        x={PANEL_CX[i] - PANEL_W / 2}
        y={PANEL_CY - PANEL_H / 2}
        width={PANEL_W}
        height={PANEL_H}
        rx="4"
        fill="none"
        stroke={C.border}
        strokeWidth="1"
      />
    </g>
  );
}

function Points({ i }) {
  return (
    <g>
      {/* Class A — open circles */}
      {CLASS_A.map(([cx, cy], k) => (
        <circle
          key={`a-${k}`}
          cx={X(i, cx)}
          cy={Y(i, cy)}
          r="3.6"
          fill="none"
          stroke={C.muted2}
          strokeWidth="1.4"
        />
      ))}
      {/* Class B — filled circles */}
      {CLASS_B.map(([cx, cy], k) => (
        <circle
          key={`b-${k}`}
          cx={X(i, cx)}
          cy={Y(i, cy)}
          r="3.6"
          fill={C.muted2}
        />
      ))}
    </g>
  );
}

export default function DecisionBoundaryShapes() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 300"
        width="100%"
        role="img"
        aria-label="Decision boundaries for linear, kernel, and 1-NN classifiers on the same dataset"
        style={{ display: 'block' }}
      >
        {/* ── Panel 0: Linear ─────────────────────────────── */}
        <PanelFrame i={0} title="LINEAR" />
        {/* Straight separating line (a tilted halfspace) */}
        <line
          x1={X(0, -1)}
          y1={Y(0, 0.55)}
          x2={X(0,  1)}
          y2={Y(0, -0.55)}
          stroke={C.accent}
          strokeWidth="1.8"
        />
        <Points i={0} />
        <text x={PANEL_CX[0]} y={282} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>
          logistic regression
        </text>

        {/* ── Panel 1: Smooth kernel boundary ─────────────── */}
        <PanelFrame i={1} title="KERNEL" />
        {/* Smooth elliptical boundary */}
        <ellipse
          cx={X(1, 0.02)}
          cy={Y(1, 0.0)}
          rx={0.66 * HALF}
          ry={0.62 * HALF}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.8"
          transform={`rotate(-12 ${X(1, 0.02)} ${Y(1, 0.0)})`}
        />
        <Points i={1} />
        <text x={PANEL_CX[1]} y={282} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>
          smooth kernel boundary
        </text>

        {/* ── Panel 2: 1-NN jagged ────────────────────────── */}
        <PanelFrame i={2} title="1-NN" />
        {/* Main jagged region */}
        <polygon
          points={pts(2, JAGGED_MAIN)}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.5"
        />
        {/* Separate unbounded cell around the top-right outlier, clipped to the panel */}
        <polygon
          points={pts(2, ISLAND_TR)}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <Points i={2} />
        <text x={PANEL_CX[2]} y={282} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>
          k-nearest neighbors, k = 1
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
        Different hypothesis classes induce different boundary geometries —
        choosing one is a bet on the structure of the problem.
      </figcaption>
    </figure>
  );
}
