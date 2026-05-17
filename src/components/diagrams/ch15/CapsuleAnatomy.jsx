const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.16)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const LEFT_CX = 150;

// Right-panel vector cells
const VEC_X = 330;
const VEC_Y = 70;
const VEC_W = 56;
const VEC_H = 16;
const VEC_VALUES = [
  '+0.40',
  '-0.70',
  '+0.30',
  '+0.10',
  '+0.60',
  '-0.20',
  '+0.50',
  '+0.80',
];
const VEC_TOTAL_H = VEC_VALUES.length * VEC_H;

const VEC_DIM_LABELS = [
  'rotation',
  'scale',
  'skew',
  'thickness',
  'position-x',
  'position-y',
  'lighting',
  'deformation',
];

export default function CapsuleAnatomy() {
  // Length-bracket position (to the right of the vector column)
  const lenBracketX = VEC_X + VEC_W + 10;
  // Direction-bracket inner labels start
  const dimLabelX = VEC_X + VEC_W + 70;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 340"
        width="100%"
        role="img"
        aria-label="CNN scalar activation vs capsule vector output"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="ca-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* ── Panel borders ───────────────────────────── */}
        <rect x="20" y="18" width="260" height="280" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />
        <rect x="300" y="18" width="320" height="280" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />

        {/* ── Panel titles ────────────────────────────── */}
        <text x={LEFT_CX} y="36" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          CNN: scalar activation
        </text>
        <text x="460" y="36" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          Capsule: vector output
        </text>

        {/* ── LEFT PANEL: scalar neuron ────────────────── */}
        <circle cx={LEFT_CX} cy="120" r="36"
                fill={C.bg2} stroke={C.borderLt} strokeWidth="1.5" />
        <text x={LEFT_CX} y="124" textAnchor="middle"
              fontFamily={mono} fontSize="18" fill={C.muted2}>
          0.87
        </text>

        <text x={LEFT_CX} y="180" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted2}
              fontStyle="italic">
          probability feature is present
        </text>

        <line x1="60" y1="220" x2="240" y2="220"
              stroke={C.border} strokeWidth="0.8" />
        <text x={LEFT_CX} y="245" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          1 number
        </text>
        <text x={LEFT_CX} y="265" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}
              fontStyle="italic">
          → presence only
        </text>

        {/* ── RIGHT PANEL: vector column ─────────────── */}
        {/* "v =" label */}
        <text x={VEC_X - 14} y={VEC_Y + VEC_TOTAL_H / 2 + 4} textAnchor="end"
              fontFamily={mono} fontSize="11.5" fill={C.muted2}>
          v =
        </text>

        {/* Vector cells */}
        {VEC_VALUES.map((val, i) => (
          <g key={`vc-${i}`}>
            <rect
              x={VEC_X}
              y={VEC_Y + i * VEC_H}
              width={VEC_W}
              height={VEC_H}
              fill={C.bg2}
              stroke={C.borderLt}
              strokeWidth="0.9"
            />
            <text
              x={VEC_X + VEC_W / 2}
              y={VEC_Y + i * VEC_H + VEC_H / 2 + 3.5}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="9.5"
              fill={C.text}
            >
              {val}
            </text>
          </g>
        ))}
        {/* Outer rectangle for visual emphasis */}
        <rect x={VEC_X} y={VEC_Y} width={VEC_W} height={VEC_TOTAL_H}
              fill="none" stroke={C.accent} strokeWidth="1.5" rx="3" />

        {/* ── LENGTH bracket (highlighted teal — top half) ─── */}
        <path
          d={`M ${lenBracketX} ${VEC_Y}
              L ${lenBracketX + 8} ${VEC_Y}
              L ${lenBracketX + 8} ${VEC_Y + VEC_TOTAL_H}
              L ${lenBracketX} ${VEC_Y + VEC_TOTAL_H}`}
          fill="none" stroke={C.accent} strokeWidth="1.3" />
        <text x={lenBracketX + 14} y={VEC_Y + 12}
              fontFamily={mono} fontSize="10.5" fill={C.accent}>
          ‖v‖ ≈ 1.45
        </text>
        <text x={lenBracketX + 14} y={VEC_Y + 28}
              fontFamily={mono} fontSize="10" fill={C.accent}>
          → squash → 0.68
        </text>
        <text x={lenBracketX + 14} y={VEC_Y + 44}
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          = probability
        </text>

        {/* ── DIRECTION annotation (lower half) ─── */}
        <text x={lenBracketX + 14} y={VEC_Y + 78}
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          direction:
        </text>
        <text x={lenBracketX + 14} y={VEC_Y + 92}
              fontFamily={sans} fontSize="9.5" fill={C.muted}
              fontStyle="italic">
          per-dim pose params*
        </text>

        {/* Inline per-dim labels next to each cell — compact */}
        {VEC_DIM_LABELS.map((lab, i) => (
          <text
            key={`dim-${i}`}
            x={lenBracketX + 75}
            y={VEC_Y + i * VEC_H + VEC_H / 2 + 3.5}
            fontFamily={mono}
            fontSize="8.5"
            fill={C.muted}
          >
            {`dim ${i + 1}: ${lab}`}
          </text>
        ))}

        {/* ── Right-panel bottom annotation ─── */}
        <text x="460" y="245" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          length → probability  ·  direction → pose
        </text>
        <text x="460" y="265" textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted}
              fontStyle="italic">
          * dimension labels illustrative — actual semantics are learned, not assigned
        </text>

        {/* ── Bottom comparison strip across both panels ─── */}
        <line x1="60" y1="312" x2="580" y2="312"
              stroke={C.border} strokeWidth="0.8" />
        <text x="320" y="328" textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          scalar: presence detector  ·  vector: presence + pose, in one output
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
        A capsule's output is a vector whose magnitude reads as probability of
        entity presence and whose direction encodes the entity's instantiation
        parameters.
      </figcaption>
    </figure>
  );
}
