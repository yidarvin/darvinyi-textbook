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

// ── Main contour plot ─────────────────────────────────────────────
const MAIN_MIN = { x: 430, y: 170 };

// Eccentric ellipses (longer in x). Outer rings extend past the right edge
// of the viewBox and are clipped by the SVG, which is intentional.
const CONTOURS = [
  { rx: 45,  ry: 16  },
  { rx: 95,  ry: 34  },
  { rx: 160, ry: 56  },
  { rx: 235, ry: 82  },
  { rx: 315, ry: 110 },
];

// Damped zigzag trajectory: high curvature in y produces lateral oscillation
// that decays as the optimizer approaches the minimum.
const TRAJ = [
  [90,  90 ], [130, 220], [175, 130], [225, 200],
  [275, 145], [320, 190], [360, 155], [395, 180],
  [420, 168],
];

// Gradient arrow drawn at this trajectory step (TRAJ[i] → TRAJ[i+1])
const GRAD_IDX = 2;
const A = TRAJ[GRAD_IDX];
const B = TRAJ[GRAD_IDX + 1];

// ── Inset panels (three flavors of stochasticity) ─────────────────
const INSET_CY = 388;
const INSET_CONTOURS = [
  { rx: 18, ry: 7  },
  { rx: 38, ry: 14 },
  { rx: 62, ry: 22 },
];

const INSETS = [
  {
    label: 'full-batch',
    minX: 140,
    traj: [
      [60, 358], [80, 368], [102, 376], [122, 382], [138, 386],
    ],
  },
  {
    label: 'SGD',
    minX: 355,
    traj: [
      [275, 358], [292, 380], [280, 395], [305, 372], [322, 395],
      [314, 410], [336, 378], [348, 398], [340, 386], [354, 388],
    ],
  },
  {
    label: 'mini-batch',
    minX: 575,
    traj: [
      [495, 358], [515, 376], [532, 380], [548, 392], [562, 386],
      [573, 388],
    ],
  },
];

export default function GradientDescentGeometry() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 460"
        width="100%"
        role="img"
        aria-label="Gradient descent geometry: steps perpendicular to loss contours, with inset comparing full-batch, SGD, and mini-batch trajectories"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="gdgeo-arr-muted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* Top label */}
        <text x={20} y={24} fontFamily={mono} fontSize="10.5" fill={C.muted}>
          contours of L(θ)
        </text>

        {/* Contour ellipses */}
        {CONTOURS.map((c, i) => (
          <ellipse
            key={`c-${i}`}
            cx={MAIN_MIN.x}
            cy={MAIN_MIN.y}
            rx={c.rx}
            ry={c.ry}
            fill="none"
            stroke={C.border}
            strokeWidth="1.5"
          />
        ))}

        {/* Trajectory segments (skip the gradient-arrow segment) */}
        {TRAJ.slice(0, -1).map((p, i) => {
          if (i === GRAD_IDX) return null;
          const n = TRAJ[i + 1];
          return (
            <line
              key={`seg-${i}`}
              x1={p[0]}
              y1={p[1]}
              x2={n[0]}
              y2={n[1]}
              stroke={C.text}
              strokeWidth="1.5"
            />
          );
        })}

        {/* Gradient arrow at TRAJ[GRAD_IDX] → TRAJ[GRAD_IDX+1] */}
        <line
          x1={A[0]}
          y1={A[1]}
          x2={B[0]}
          y2={B[1]}
          stroke={C.muted2}
          strokeWidth="1.8"
          markerEnd="url(#gdgeo-arr-muted)"
        />
        <text
          x={(A[0] + B[0]) / 2 + 22}
          y={(A[1] + B[1]) / 2 + 2}
          fontFamily={mono}
          fontSize="11"
          fill={C.muted2}
        >
          −η∇L
        </text>

        {/* Trajectory dots */}
        {TRAJ.map((p, i) => (
          <circle
            key={`d-${i}`}
            cx={p[0]}
            cy={p[1]}
            r="3"
            fill={C.text}
          />
        ))}

        {/* Minimum */}
        <circle cx={MAIN_MIN.x} cy={MAIN_MIN.y} r="5" fill={C.accent} />
        <text
          x={MAIN_MIN.x + 12}
          y={MAIN_MIN.y + 4}
          fontFamily={mono}
          fontSize="11"
          fill={C.accent}
        >
          θ*
        </text>

        {/* Divider between main plot and insets */}
        <line
          x1={30}
          y1={325}
          x2={610}
          y2={325}
          stroke={C.border}
          strokeWidth="1"
          strokeDasharray="3,4"
        />

        {/* Inset header */}
        <text x={20} y={348} fontFamily={mono} fontSize="10.5" fill={C.muted}>
          same landscape, different gradient estimator
        </text>

        {/* Three inset panels */}
        {INSETS.map((p, idx) => (
          <g key={`inset-${idx}`}>
            {INSET_CONTOURS.map((c, i) => (
              <ellipse
                key={`ic-${i}`}
                cx={p.minX}
                cy={INSET_CY}
                rx={c.rx}
                ry={c.ry}
                fill="none"
                stroke={C.border}
                strokeWidth="1"
              />
            ))}
            {p.traj.slice(0, -1).map((pt, i) => {
              const next = p.traj[i + 1];
              return (
                <line
                  key={`it-${idx}-${i}`}
                  x1={pt[0]}
                  y1={pt[1]}
                  x2={next[0]}
                  y2={next[1]}
                  stroke={C.muted2}
                  strokeWidth="1.2"
                />
              );
            })}
            {p.traj.map((pt, i) => (
              <circle
                key={`id-${idx}-${i}`}
                cx={pt[0]}
                cy={pt[1]}
                r="1.8"
                fill={C.muted2}
              />
            ))}
            <circle cx={p.minX} cy={INSET_CY} r="3.5" fill={C.accent} />
            <text
              x={(p.traj[0][0] + p.minX) / 2}
              y={INSET_CY + 50}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="11"
              fill={C.text}
            >
              {p.label}
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
        Gradient descent steps perpendicular to loss contours toward the
        minimum; stochastic estimates add noise to the path.
      </figcaption>
    </figure>
  );
}
