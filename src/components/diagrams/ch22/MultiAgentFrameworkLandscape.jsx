const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.10)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Plot area
const PX0 = 90;
const PX1 = 600;
const PY0 = 100;  // top
const PY1 = 360;  // bottom
const PW = PX1 - PX0;
const PH = PY1 - PY0;

// xNorm 0..1 → svgX
const sx = (xn) => PX0 + xn * PW;
// yNorm 0 = minimal (bottom), 1 = comprehensive (top) → svgY
const sy = (yn) => PY1 - yn * PH;

const FRAMEWORKS = [
  {
    name: 'AutoGPT',
    year: '2023',
    xn: 0.06, yn: 0.30,
    annotation: ['unsupervised loops,', 'viral demos,', 'fragile in production'],
    teal: false,
    labelOffset: [12, -4],
  },
  {
    name: 'AutoGen',
    year: '2023',
    xn: 0.32, yn: 0.72,
    annotation: ['conversational,', 'turn-based multi-agent'],
    teal: false,
    labelOffset: [12, -4],
  },
  {
    name: 'CrewAI',
    year: '2024',
    xn: 0.58, yn: 0.62,
    annotation: ['role-based,', 'hierarchical or', 'sequential processes'],
    teal: false,
    labelOffset: [12, -4],
  },
  {
    name: 'OpenAI Swarm / Agents SDK',
    year: '2024',
    xn: 0.55, yn: 0.18,
    annotation: ['minimalist, handoff', 'functions, readable', 'in one sitting'],
    teal: false,
    labelOffset: [-170, -4],
  },
  {
    name: 'LangGraph',
    year: '2024',
    xn: 0.85, yn: 0.88,
    annotation: ['explicit state machines,', 'durable execution,', 'production-recommended'],
    teal: true,
    labelOffset: [-140, -4],
  },
  {
    name: 'Claude Code subagents',
    year: '2024–25',
    xn: 0.78, yn: 0.35,
    annotation: ['supervisor-worker', 'pattern inside a', 'single application'],
    teal: false,
    labelOffset: [-140, -4],
  },
];

export default function MultiAgentFrameworkLandscape() {
  const totalH = 480;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg viewBox={`0 0 640 ${totalH}`} width="100%" role="img"
           aria-label="2D positioning of major multi-agent frameworks by coordination structure and abstraction level."
           style={{ display: 'block' }}>
        <defs>
          <marker id="malf-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="malf-arrow-axis" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          Multi-agent framework landscape (2023–2026)
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          positioned by coordination structure and harness abstraction level
        </text>

        {/* Axes */}
        {/* Y axis line */}
        <line x1={PX0} y1={PY0 - 6} x2={PX0} y2={PY1}
              stroke={C.muted} strokeWidth="0.8"
              markerStart="url(#malf-arrow-axis)" />
        {/* X axis line */}
        <line x1={PX0} y1={PY1} x2={PX1 + 6} y2={PY1}
              stroke={C.muted} strokeWidth="0.8"
              markerEnd="url(#malf-arrow-axis)" />

        {/* Y axis labels — at top, bottom, and axis title */}
        <text x={PX0 - 4} y={PY0 - 14}
              textAnchor="end"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}>
          comprehensive
        </text>
        <text x={PX0 - 4} y={PY1 + 4}
              textAnchor="end"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}>
          minimalist
        </text>
        {/* Y axis title — vertical */}
        <text x="22" y={(PY0 + PY1) / 2}
              textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}
              transform={`rotate(-90 22 ${(PY0 + PY1) / 2})`}>
          abstraction level
        </text>

        {/* X axis labels */}
        <text x={PX0} y={PY1 + 16}
              textAnchor="start"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}>
          unstructured / autonomous
        </text>
        <text x={PX1} y={PY1 + 16}
              textAnchor="end"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}>
          structured / state machine
        </text>
        {/* X axis title */}
        <text x={(PX0 + PX1) / 2} y={PY1 + 30}
              textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          coordination structure
        </text>

        {/* Gridlines */}
        {[0.25, 0.5, 0.75].map((v, i) => (
          <g key={`gx-${i}`}>
            <line x1={sx(v)} y1={PY0} x2={sx(v)} y2={PY1}
                  stroke={C.border} strokeWidth="0.4"
                  strokeDasharray="2 4" />
          </g>
        ))}
        {[0.25, 0.5, 0.75].map((v, i) => (
          <g key={`gy-${i}`}>
            <line x1={PX0} y1={sy(v)} x2={PX1} y2={sy(v)}
                  stroke={C.border} strokeWidth="0.4"
                  strokeDasharray="2 4" />
          </g>
        ))}

        {/* Plot points */}
        {FRAMEWORKS.map((f, i) => {
          const x = sx(f.xn);
          const y = sy(f.yn);
          const isTeal = f.teal;
          const r = 5;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={r}
                      fill={isTeal ? C.accent : C.bg3}
                      stroke={isTeal ? C.accent : C.muted2}
                      strokeWidth="1.2" />

              {/* Framework name + year */}
              <text x={x + f.labelOffset[0]}
                    y={y + f.labelOffset[1]}
                    fontFamily={mono} fontSize="10"
                    fill={isTeal ? C.accent : C.text}
                    fontWeight={isTeal ? '600' : '500'}>
                {f.name}
              </text>
              <text x={x + f.labelOffset[0]}
                    y={y + f.labelOffset[1] + 11}
                    fontFamily={mono} fontSize="8"
                    fill={C.muted}>
                {f.year}
              </text>

              {/* Annotation lines */}
              {f.annotation.map((ln, j) => (
                <text key={j}
                      x={x + f.labelOffset[0]}
                      y={y + f.labelOffset[1] + 22 + j * 10}
                      fontFamily={sans} fontSize="8.5"
                      fill={isTeal ? C.accent : C.muted2}
                      fontStyle="italic">
                  {ln}
                </text>
              ))}
            </g>
          );
        })}

        {/* Trajectory arrow at the bottom */}
        <line x1="90" y1={PY1 + 56}
              x2="600" y2={PY1 + 56}
              stroke={C.muted2} strokeWidth="1"
              markerEnd="url(#malf-arrow)" />
        <text x="320" y={PY1 + 50}
              textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted2}>
          2023 → 2026 trajectory: from autonomous loops toward structured patterns
        </text>

        {/* Consensus annotation */}
        <text x="320" y={totalH - 28}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          consensus by 2026: complex multi-agent rarely outperforms a single strong agent —
        </text>
        <text x="320" y={totalH - 12}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          warranted for specialization, parallel exploration, or phase-gate workflows
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
        The multi-agent framework landscape has consolidated around structured patterns —
        state machines, role-based teams, supervisor-worker delegation — as the 2023
        autonomous-agent hype walked back.
      </figcaption>
    </figure>
  );
}
