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

// Plot bounds
const X0 = 80;
const X1 = 510;
const Y0 = 60;
const Y1 = 320;

// X axis: log-scale, 10^16 .. 10^24 → 8 decades
const X_DECADES = [16, 18, 20, 22, 24];
function xForDecade(d) {
  return X0 + ((d - 16) / 8) * (X1 - X0);
}

// Y axis: just labelled tick values for "test loss"
const Y_TICKS = [
  { y: 80,  label: '3.0' },
  { y: 140, label: '2.5' },
  { y: 200, label: '2.0' },
  { y: 260, label: '1.7' },
];

export default function ScalingLawCurves() {
  // Two parallel descending lines on log-log.
  // Kaplan curve: from (80, 90) to (510, 240).
  // Chinchilla curve: parallel but ~22px lower (= lower loss = higher SVG y).
  const kaplanFrom  = [X0, 95];
  const kaplanTo    = [X1, 250];
  const chinchillaFrom = [X0, 118];
  const chinchillaTo   = [X1, 280];

  // Annotated points
  // GPT-3 175B trained on ~3.14e23 FLOPs (Brown et al.) — place on Kaplan curve
  const GPT3_X = xForDecade(23.5);
  const GPT3_Y = kaplanFrom[1] +
    ((kaplanTo[1] - kaplanFrom[1]) * (GPT3_X - kaplanFrom[0])) /
    (kaplanTo[0] - kaplanFrom[0]);

  // Chinchilla 70B trained on 5.76e23 FLOPs — place on Chinchilla curve
  const CHI_X = xForDecade(23.8);
  const CHI_Y = chinchillaFrom[1] +
    ((chinchillaTo[1] - chinchillaFrom[1]) * (CHI_X - chinchillaFrom[0])) /
    (chinchillaTo[0] - chinchillaFrom[0]);

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 420"
        width="100%"
        role="img"
        aria-label="Log-log scaling-law curves: Kaplan suggestion vs Chinchilla-optimal frontier"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="sl-arr-muted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
          <marker
            id="sl-arr-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text x={320} y={24} textAnchor="middle" fontFamily={sans} fontSize="13" fontWeight="500" fill={C.text}>
          Loss is a power law in compute — Chinchilla corrected the slope
        </text>

        {/* Axes */}
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke={C.border} strokeWidth="1.5" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke={C.border} strokeWidth="1.5" />

        {/* X-axis tick labels (log decades) */}
        {X_DECADES.map((d) => (
          <g key={d}>
            <line x1={xForDecade(d)} y1={Y1} x2={xForDecade(d)} y2={Y1 + 4} stroke={C.border} strokeWidth="1" />
            <text
              x={xForDecade(d)}
              y={Y1 + 18}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="10"
              fill={C.muted}
            >
              {`10^${d}`}
            </text>
          </g>
        ))}

        {/* X-axis label */}
        <text
          x={(X0 + X1) / 2}
          y={Y1 + 40}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          compute  (FLOPs, log scale)
        </text>

        {/* Y-axis tick labels */}
        {Y_TICKS.map((t) => (
          <g key={t.y}>
            <line x1={X0 - 4} y1={t.y} x2={X0} y2={t.y} stroke={C.border} strokeWidth="1" />
            <text x={X0 - 8} y={t.y + 3.5} textAnchor="end" fontFamily={mono} fontSize="10" fill={C.muted}>
              {t.label}
            </text>
          </g>
        ))}

        {/* Y-axis label */}
        <text
          x={28}
          y={(Y0 + Y1) / 2}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
          transform={`rotate(-90 28 ${(Y0 + Y1) / 2})`}
        >
          test loss  (log scale)
        </text>

        {/* Kaplan curve (muted, dashed) */}
        <line
          x1={kaplanFrom[0]}
          y1={kaplanFrom[1]}
          x2={kaplanTo[0]}
          y2={kaplanTo[1]}
          stroke={C.muted2}
          strokeWidth="1.7"
          strokeDasharray="5,4"
          opacity="0.85"
        />

        {/* Chinchilla curve (teal, solid) */}
        <line
          x1={chinchillaFrom[0]}
          y1={chinchillaFrom[1]}
          x2={chinchillaTo[0]}
          y2={chinchillaTo[1]}
          stroke={C.accent}
          strokeWidth="1.9"
        />

        {/* GPT-3 marker on Kaplan curve */}
        <circle cx={GPT3_X} cy={GPT3_Y} r="4" fill={C.bg2} stroke={C.muted2} strokeWidth="1.5" />
        <line
          x1={GPT3_X}
          y1={GPT3_Y - 6}
          x2={GPT3_X - 30}
          y2={GPT3_Y - 36}
          stroke={C.muted}
          strokeWidth="1"
        />
        <text x={GPT3_X - 34} y={GPT3_Y - 42} textAnchor="end" fontFamily={mono} fontSize="10" fill={C.muted2}>
          GPT-3 175B
        </text>
        <text x={GPT3_X - 34} y={GPT3_Y - 30} textAnchor="end" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          too big, too few tokens
        </text>

        {/* Chinchilla marker on Chinchilla curve */}
        <circle cx={CHI_X} cy={CHI_Y} r="4" fill={C.bg2} stroke={C.accent} strokeWidth="1.5" />
        <line
          x1={CHI_X}
          y1={CHI_Y + 6}
          x2={CHI_X - 30}
          y2={CHI_Y + 32}
          stroke={C.accent}
          strokeWidth="1"
          opacity="0.7"
        />
        <text x={CHI_X - 34} y={CHI_Y + 36} textAnchor="end" fontFamily={mono} fontSize="10" fill={C.accent}>
          Chinchilla 70B / 1.4T tokens
        </text>
        <text x={CHI_X - 34} y={CHI_Y + 48} textAnchor="end" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          compute-optimal
        </text>

        {/* Right-side annotation box: Chinchilla rule */}
        <rect
          x={538}
          y={90}
          width={92}
          height={120}
          rx="6"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.2"
        />
        <text x={584} y={110} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted2}>
          optimal N : D
        </text>
        <text x={584} y={140} textAnchor="middle" fontFamily={mono} fontSize="16" fill={C.accent}>
          1 : 20
        </text>
        <text x={584} y={162} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          1 param
        </text>
        <text x={584} y={176} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          ↔
        </text>
        <text x={584} y={192} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          20 tokens
        </text>

        {/* Legend below right-side box */}
        <g transform={`translate(538, 232)`}>
          <line x1={0} y1={6} x2={20} y2={6} stroke={C.muted2} strokeWidth="1.7" strokeDasharray="5,4" opacity="0.85" />
          <text x={26} y={10} fontFamily={mono} fontSize="9.5" fill={C.muted}>
            Kaplan 2020
          </text>
          <line x1={0} y1={24} x2={20} y2={24} stroke={C.accent} strokeWidth="1.9" />
          <text x={26} y={28} fontFamily={mono} fontSize="9.5" fill={C.text}>
            Chinchilla 2022
          </text>
        </g>

        {/* Bottom annotation */}
        <text
          x={320}
          y={400}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11.5"
          fill={C.muted}
        >
          Kaplan 2020 → Chinchilla 2022 corrected the law: scale model and data equally.
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
        Loss falls as a power law in compute; Chinchilla showed the compute-optimal
        frontier requires balancing model size and dataset size, not just growing the
        model.
      </figcaption>
    </figure>
  );
}
