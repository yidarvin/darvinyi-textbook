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

// Long, narrow ravine centered at (450, 195). Aspect ratio ≈ 5.5 : 1.
const MIN = { x: 450, y: 195 };
const CONTOURS = [
  { rx: 40,  ry: 12 },
  { rx: 85,  ry: 18 },
  { rx: 140, ry: 26 },
  { rx: 205, ry: 36 },
  { rx: 275, ry: 48 },
  { rx: 355, ry: 62 },
];

// Vanilla SGD: violent cross-axis oscillation, slow progress along the long axis
const SGD_TRAJ = [
  [62, 138], [78, 252], [98, 142], [122, 250],
  [150, 144], [180, 248], [212, 148], [248, 242],
  [284, 152], [320, 238], [358, 158], [392, 232],
  [418, 168],
];

// SGD + momentum: brief initial wobble, then a steady sweep along the long axis
const MOM_TRAJ = [
  [62, 138], [88, 178], [128, 192], [185, 197],
  [250, 196], [320, 195], [388, 195], [435, 195],
];

// Index of segment to annotate for each trajectory
const SGD_ANNOT_IDX = 5; // segment SGD_TRAJ[5] → SGD_TRAJ[6]: a steep cross-axis swing
const MOM_ANNOT_IDX = 4; // segment MOM_TRAJ[4] → MOM_TRAJ[5]: long axial sweep

const SGD_NOTE_A = SGD_TRAJ[SGD_ANNOT_IDX];
const SGD_NOTE_B = SGD_TRAJ[SGD_ANNOT_IDX + 1];
const SGD_NOTE_MID = {
  x: (SGD_NOTE_A[0] + SGD_NOTE_B[0]) / 2,
  y: (SGD_NOTE_A[1] + SGD_NOTE_B[1]) / 2,
};

const MOM_NOTE_A = MOM_TRAJ[MOM_ANNOT_IDX];
const MOM_NOTE_B = MOM_TRAJ[MOM_ANNOT_IDX + 1];
const MOM_NOTE_MID = {
  x: (MOM_NOTE_A[0] + MOM_NOTE_B[0]) / 2,
  y: (MOM_NOTE_A[1] + MOM_NOTE_B[1]) / 2,
};

export default function MomentumRavine() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 360"
        width="100%"
        role="img"
        aria-label="Narrow ravine: vanilla SGD zig-zags across the narrow axis while momentum sweeps along the long axis"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="rav-arr-muted"
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
          narrow ravine — high curvature ⟂ long axis
        </text>

        {/* Legend */}
        <g>
          <line x1={460} y1={20} x2={490} y2={20} stroke={C.muted2} strokeWidth="1.5" />
          <text x={496} y={24} fontFamily={mono} fontSize="10.5" fill={C.muted2}>
            SGD
          </text>
          <line x1={540} y1={20} x2={570} y2={20} stroke={C.accent} strokeWidth="2" />
          <text x={576} y={24} fontFamily={mono} fontSize="10.5" fill={C.accent}>
            + momentum
          </text>
        </g>

        {/* Contour ellipses */}
        {CONTOURS.map((c, i) => (
          <ellipse
            key={`c-${i}`}
            cx={MIN.x}
            cy={MIN.y}
            rx={c.rx}
            ry={c.ry}
            fill="none"
            stroke={C.border}
            strokeWidth="1.5"
          />
        ))}

        {/* Minimum */}
        <circle cx={MIN.x} cy={MIN.y} r="5" fill={C.accent} />

        {/* SGD trajectory (muted, drawn first/behind) */}
        {SGD_TRAJ.slice(0, -1).map((p, i) => {
          const n = SGD_TRAJ[i + 1];
          return (
            <line
              key={`sgd-${i}`}
              x1={p[0]}
              y1={p[1]}
              x2={n[0]}
              y2={n[1]}
              stroke={C.muted2}
              strokeWidth="1.5"
            />
          );
        })}
        {SGD_TRAJ.map((p, i) => (
          <circle
            key={`sgdd-${i}`}
            cx={p[0]}
            cy={p[1]}
            r="2.4"
            fill={C.muted2}
          />
        ))}

        {/* Momentum trajectory (teal, drawn on top) */}
        {MOM_TRAJ.slice(0, -1).map((p, i) => {
          const n = MOM_TRAJ[i + 1];
          return (
            <line
              key={`mom-${i}`}
              x1={p[0]}
              y1={p[1]}
              x2={n[0]}
              y2={n[1]}
              stroke={C.accent}
              strokeWidth="2"
            />
          );
        })}
        {MOM_TRAJ.map((p, i) => (
          <circle
            key={`momd-${i}`}
            cx={p[0]}
            cy={p[1]}
            r="3"
            fill={C.accent}
          />
        ))}

        {/* SGD annotation: leader from label down to a zig-zag segment midpoint */}
        <line
          x1={SGD_NOTE_MID.x}
          y1={SGD_NOTE_MID.y - 5}
          x2={SGD_NOTE_MID.x}
          y2={88}
          stroke={C.muted2}
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        <text
          x={SGD_NOTE_MID.x}
          y={78}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted2}
        >
          wasted lateral motion
        </text>

        {/* Momentum annotation: leader from label up to an axial segment midpoint */}
        <line
          x1={MOM_NOTE_MID.x}
          y1={MOM_NOTE_MID.y + 5}
          x2={MOM_NOTE_MID.x}
          y2={308}
          stroke={C.accent}
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        <text
          x={MOM_NOTE_MID.x}
          y={322}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.accent}
        >
          velocity accumulates
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
        In narrow ravines, momentum cancels cross-axis oscillation and
        accelerates along the long axis — the geometry where it gives the
        most lift.
      </figcaption>
    </figure>
  );
}
