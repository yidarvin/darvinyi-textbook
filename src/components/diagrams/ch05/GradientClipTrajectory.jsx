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

// Plot rect
const X0 = 40, X1 = 600;
const Y0 = 30, Y1 = 340;

// Bowl center (the minimum)
const BOWL_CX = 180;
const BOWL_CY = 200;

// Contour rings around the bowl
const CONTOURS = [
  { rx: 50,  ry: 38 },
  { rx: 92,  ry: 70 },
  { rx: 134, ry: 102 },
  { rx: 176, ry: 134 },
  { rx: 218, ry: 166 },
];

// Cliff zone (vertical band on the right of the plot)
const CLIFF_X0 = 410;
const CLIFF_X1 = X1;

// Shared start point — inside the cliff zone
const START = { x: 478, y: 198 };

// Clipped trajectory: walks around the cliff toward the minimum
const CLIP_TRAJ = [
  [478, 198], [468, 208], [452, 222], [432, 238],
  [400, 250], [360, 254], [318, 246], [275, 232],
  [235, 218], [205, 208], [188, 202], [180, 200],
];

// Unclipped trajectory: tight cluster of 3 small steps
const NOCLIP_CLUSTER = [
  [478, 198], [476, 196], [473, 193],
];
// then a giant arrow off the top-right edge
const NOCLIP_END = { x: 632, y: 18 };

export default function GradientClipTrajectory() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 380"
        width="100%"
        role="img"
        aria-label="Loss-landscape trajectories with and without gradient clipping"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="clip-arr-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
          <marker
            id="clip-arr-muted"
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

        {/* Plot frame */}
        <rect
          x={X0}
          y={Y0}
          width={X1 - X0}
          height={Y1 - Y0}
          rx="4"
          fill="none"
          stroke={C.border}
          strokeWidth="1"
        />

        {/* Cliff zone shading */}
        <rect
          x={CLIFF_X0}
          y={Y0}
          width={CLIFF_X1 - CLIFF_X0}
          height={Y1 - Y0}
          fill={C.muted}
          opacity="0.08"
        />
        {/* Cliff edge line */}
        <line
          x1={CLIFF_X0}
          y1={Y0}
          x2={CLIFF_X0}
          y2={Y1}
          stroke={C.muted2}
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.55"
        />
        {/* Cliff label */}
        <text
          x={(CLIFF_X0 + CLIFF_X1) / 2}
          y={Y1 - 12}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted2}
        >
          ‖∇L‖ spike
        </text>

        {/* Contour rings around the bowl */}
        {CONTOURS.map((c, i) => (
          <ellipse
            key={`contour-${i}`}
            cx={BOWL_CX}
            cy={BOWL_CY}
            rx={c.rx}
            ry={c.ry}
            fill="none"
            stroke={C.muted}
            strokeWidth="1"
            opacity={0.35 + i * 0.05}
          />
        ))}

        {/* Bowl minimum marker */}
        <circle
          cx={BOWL_CX}
          cy={BOWL_CY}
          r="3.5"
          fill={C.accent}
        />
        <text
          x={BOWL_CX}
          y={BOWL_CY - 10}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.accent}
        >
          minimum
        </text>

        {/* ── Unclipped trajectory ─────────────────────────────────── */}
        {/* 3 tight cluster points */}
        {NOCLIP_CLUSTER.map(([x, y], i) => (
          <circle
            key={`noclip-${i}`}
            cx={x}
            cy={y}
            r="2"
            fill={C.muted2}
          />
        ))}
        {/* Connecting lines between cluster points */}
        <polyline
          points={NOCLIP_CLUSTER.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke={C.muted2}
          strokeWidth="1"
        />
        {/* Giant arrow off the top-right edge */}
        <line
          x1={NOCLIP_CLUSTER[2][0]}
          y1={NOCLIP_CLUSTER[2][1]}
          x2={NOCLIP_END.x}
          y2={NOCLIP_END.y}
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#clip-arr-muted)"
        />
        {/* Norm label along the giant arrow */}
        <text
          x={560}
          y={86}
          textAnchor="end"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted2}
        >
          ‖∇L‖ ≈ 10³
        </text>
        <text
          x={622}
          y={38}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted2}
        >
          diverged
        </text>

        {/* ── Clipped trajectory ───────────────────────────────────── */}
        <polyline
          points={CLIP_TRAJ.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#clip-arr-accent)"
        />
        {CLIP_TRAJ.slice(0, -1).map(([x, y], i) => (
          <circle
            key={`clip-${i}`}
            cx={x}
            cy={y}
            r="1.8"
            fill={C.accent}
          />
        ))}

        {/* Start marker (shared start point) */}
        <circle
          cx={START.x}
          cy={START.y}
          r="3.5"
          fill="none"
          stroke={C.text}
          strokeWidth="1.5"
        />
        <text
          x={START.x + 8}
          y={START.y + 16}
          fontFamily={mono}
          fontSize="10"
          fill={C.text}
        >
          start
        </text>

        {/* Legend at the bottom */}
        <line x1={70} y1={358} x2={102} y2={358} stroke={C.muted2} strokeWidth="1.5" />
        <text x={110} y={362} fontFamily={mono} fontSize="11" fill={C.muted2}>
          no clipping
        </text>
        <line x1={260} y1={358} x2={292} y2={358} stroke={C.accent} strokeWidth="1.5" />
        <text x={300} y={362} fontFamily={mono} fontSize="11" fill={C.accent}>
          clipped to ‖g‖ ≤ 1.0
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
        A single un-clipped gradient spike can launch the optimizer out of the
        trainable region; clipping bounds the step magnitude while preserving its
        direction.
      </figcaption>
    </figure>
  );
}
