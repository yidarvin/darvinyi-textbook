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

const AXIS_Y = 90;
const AXIS_LEFT = 60;
const AXIS_RIGHT = 580;

const SAMPLE_XS = [
  AXIS_LEFT + 20,                                       // i = 0
  (AXIS_LEFT + AXIS_RIGHT) / 2,                         // i = d/4
  AXIS_RIGHT - 20,                                      // i = d/2
];

// Arc: drawn as a circle segment, sweep angle visualises rotation frequency.
function Arc({ cx, cy, r, sweep }) {
  // Draw arc from angle -90 (top) sweeping clockwise by `sweep` degrees.
  const start = -90;
  const end = -90 + sweep;
  const toRad = (a) => (a * Math.PI) / 180;
  const sx = cx + r * Math.cos(toRad(start));
  const sy = cy + r * Math.sin(toRad(start));
  const ex = cx + r * Math.cos(toRad(end));
  const ey = cy + r * Math.sin(toRad(end));
  const largeArc = sweep > 180 ? 1 : 0;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth="1" strokeDasharray="2 3" />
      <path
        d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
        fill="none"
        stroke={C.muted2}
        strokeWidth="1.8"
      />
      {/* radial start tick */}
      <line x1={cx} y1={cy} x2={sx} y2={sy} stroke={C.muted} strokeWidth="0.8" />
      {/* radial end tick */}
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={C.muted} strokeWidth="0.8" />
    </g>
  );
}

const SAMPLES = [
  {
    label: 'i = 0',
    theta: 'θ₀ = 1.0',
    sub: 'one rotation per ~6 positions',
    note: 'sensitive to coarse position',
    r: 30,
    sweep: 300,
  },
  {
    label: 'i = d/4',
    theta: 'θ_{d/4} ≈ 0.01',
    sub: 'one rotation per ~600 positions',
    note: null,
    r: 24,
    sweep: 90,
  },
  {
    label: 'i = d/2',
    theta: 'θ_{d/2} ≈ 0.0001',
    sub: 'one rotation per ~60K positions',
    note: 'sensitive to fine-grained local position',
    r: 18,
    sweep: 14,
  },
];

export default function RoPEFrequencySpectrum() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 340"
        width="100%"
        role="img"
        aria-label="RoPE rotation frequency across the feature dimension"
        style={{ display: 'block' }}
      >
        <text
          x={320}
          y={22}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="12"
          fill={C.muted2}
        >
          Rotation frequency varies across the feature-dimension pair index
        </text>

        {/* Axis line */}
        <line
          x1={AXIS_LEFT}
          y1={AXIS_Y}
          x2={AXIS_RIGHT}
          y2={AXIS_Y}
          stroke={C.border}
          strokeWidth="1.5"
        />
        {/* Tick marks */}
        {SAMPLE_XS.map((x, i) => (
          <g key={`tick-${i}`}>
            <line x1={x} y1={AXIS_Y - 4} x2={x} y2={AXIS_Y + 4} stroke={C.muted2} strokeWidth="1" />
            <text
              x={x}
              y={AXIS_Y - 12}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="10"
              fill={C.muted2}
            >
              {SAMPLES[i].label}
            </text>
          </g>
        ))}
        <text
          x={(AXIS_LEFT + AXIS_RIGHT) / 2}
          y={AXIS_Y + 22}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="10.5"
          fill={C.muted}
        >
          feature dimension pair index i  ·  0 → d/2
        </text>

        {/* Arcs and labels at each sample */}
        {SAMPLE_XS.map((x, i) => {
          const arcY = AXIS_Y + 100;
          return (
            <g key={`arc-${i}`}>
              <Arc cx={x} cy={arcY} r={SAMPLES[i].r} sweep={SAMPLES[i].sweep} />
              <text
                x={x}
                y={arcY + 60}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="11"
                fill={C.text}
              >
                {SAMPLES[i].theta}
              </text>
              <text
                x={x}
                y={arcY + 76}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                {SAMPLES[i].sub}
              </text>
              {SAMPLES[i].note && (
                <text
                  x={x}
                  y={arcY + 92}
                  textAnchor="middle"
                  fontFamily={sans}
                  fontSize="10"
                  fill={C.muted2}
                  fontStyle="italic"
                >
                  {SAMPLES[i].note}
                </text>
              )}
            </g>
          );
        })}

        {/* Base-frequency comparison */}
        <line
          x1={AXIS_LEFT}
          y1={300}
          x2={AXIS_RIGHT}
          y2={300}
          stroke={C.border}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text
          x={AXIS_LEFT}
          y={290}
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted2}
        >
          base = 10000
        </text>
        <text
          x={AXIS_LEFT + 130}
          y={290}
          fontFamily={sans}
          fontSize="10.5"
          fill={C.muted}
        >
          longest wavelength ≈ 6K positions  ·  LLaMA 1, 2K context
        </text>
        <text
          x={AXIS_LEFT}
          y={318}
          fontFamily={mono}
          fontSize="10.5"
          fill={C.accent}
        >
          base = 500000
        </text>
        <text
          x={AXIS_LEFT + 130}
          y={318}
          fontFamily={sans}
          fontSize="10.5"
          fill={C.accent}
        >
          longest wavelength ≈ 300K positions  ·  LLaMA 3, 128K context
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
        RoPE applies a different rotation frequency to each feature-dimension
        pair, creating a multi-scale position signal; raising the base
        frequency extends the longest wavelength to support longer contexts.
      </figcaption>
    </figure>
  );
}
