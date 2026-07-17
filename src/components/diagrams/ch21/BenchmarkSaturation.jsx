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

// Plot geometry
const X0 = 80, X1 = 580;
const Y0 = 70, Y1 = 350;
const YEAR_MIN = 2018, YEAR_MAX = 2026;

const xOf = (year) => X0 + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (X1 - X0);
const yOf = (pct)  => Y1 - (pct / 100) * (Y1 - Y0);

const YEAR_TICKS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const PCT_TICKS  = [0, 20, 40, 60, 80, 100];

// SOTA trajectories
const SERIES = [
  {
    name: 'GLUE',
    color: C.muted2,
    points: [
      [2018, 70], [2018.5, 78], [2019, 87], [2019.5, 90],
      [2020, 90.5], [2021, 90.8], [2022, 91], [2023, 91],
      [2024, 91], [2025, 91], [2026, 91],
    ],
    humanBaseline: 87,
    labelAt: { year: 2025.3, pct: 96, anchor: 'middle' },
  },
  {
    name: 'SuperGLUE',
    color: C.muted2,
    points: [
      [2019, 70], [2019.5, 78], [2020, 87], [2020.5, 90],
      [2021, 90.5], [2022, 91], [2023, 91.5], [2024, 92],
      [2025, 92], [2026, 92],
    ],
    humanBaseline: 89,
    labelAt: { year: 2018.7, pct: 64, anchor: 'start' },
  },
  {
    // GPT-3.5-era models: ~44 (2021.5); GPT-4: 86.4 at its March 2023 release
    // (OpenAI, 2023); o1-preview: 92.3, crossing the 89.8 human-expert
    // ceiling in September 2024 (OpenAI, "Learning to Reason with LLMs",
    // 2024). MMLU's effective ceiling sits around 91-93 thereafter.
    name: 'MMLU',
    color: C.muted2,
    points: [
      [2021, 25], [2021.5, 44], [2022, 60], [2022.5, 70],
      [2023, 79], [2023.2, 86.4], [2023.5, 87.5], [2024, 88.5],
      [2024.7, 92.3], [2025, 92.8], [2025.5, 93], [2026, 93.2],
    ],
    humanBaseline: 89.8,
    labelAt: { year: 2021.3, pct: 18, anchor: 'start' },
  },
  {
    // Codex-12B 28.8 (2021); GPT-4 67.0 (2023); GPT-4o 90.2 (2024) — matches
    // the model-level data plotted in the BenchmarkLeaderboard widget.
    name: 'HumanEval',
    color: C.muted2,
    points: [
      [2021, 28.8], [2022, 37], [2022.5, 42.7], [2023, 67],
      [2023.5, 78], [2024, 90.2], [2025, 93], [2026, 95],
    ],
    humanBaseline: null,
    labelAt: { year: 2022.3, pct: 80, anchor: 'start' },
  },
  {
    // GPQA alone from its Nov 2023 release: GPT-4 scored 39% on GPQA
    // Diamond at launch (Rein et al. 2023/2024); Claude 3.5 Sonnet reached
    // 59.4% at its June 2024 release (Anthropic, "Introducing Claude 3.5
    // Sonnet," 2024); o1 hit 77.3% zero-shot in its September 2024 release,
    // the first public model to clear the ~69.7% PhD-expert baseline OpenAI
    // measured for that announcement (OpenAI, "Learning to Reason with
    // LLMs," 2024) — matching the reasoning-model jump already shown on the
    // MMLU line above. FrontierMath did not exist until Nov 8, 2024 (Epoch
    // AI) and Humanity's Last Exam not until Jan 2025 (CAIS/Scale AI) — so
    // the unweighted three-benchmark composite only becomes meaningful from
    // January 2025 onward, and it drops sharply right there because
    // FrontierMath and HLE scores start far lower than GPQA's by then.
    name: 'GPQA family',
    color: C.accent,
    points: [
      [2023.85, 39], [2024.46, 59.4], [2024.8, 77.3],
      [2025.05, 29], [2025.5, 36], [2026, 46],
    ],
    humanBaseline: null,
    isFrontier: true,
    compositeFrom: 2025.05,
    labelAt: { year: 2024.1, pct: 68, anchor: 'start' },
  },
];

const polylinePoints = (pts) =>
  pts.map(([y, v]) => `${xOf(y).toFixed(2)},${yOf(v).toFixed(2)}`).join(' ');

export default function BenchmarkSaturation() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 470"
        width="100%"
        role="img"
        aria-label="Time-series plot of NLP and reasoning benchmark state-of-the-art performance from 2018 to 2026, showing GLUE, SuperGLUE, and MMLU saturating within a few years of release, HumanEval approaching its ceiling by 2024, and GPQA — joined by FrontierMath and Humanity's Last Exam from January 2025 — still well below saturation."
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="bs-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="bs-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          each benchmark generation saturates within 2–4 years of release
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          state-of-the-art accuracy on each benchmark over time
        </text>

        {/* Plot frame */}
        <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} rx="4"
              fill="transparent" stroke={C.border} strokeWidth="1" />

        {/* Horizontal gridlines + Y labels */}
        {PCT_TICKS.map((p) => {
          const y = yOf(p);
          return (
            <g key={p}>
              <line x1={X0} y1={y} x2={X1} y2={y}
                    stroke={C.border} strokeWidth="0.5"
                    strokeDasharray="2 3" />
              <text x={X0 - 6} y={y + 3} textAnchor="end"
                    fontFamily={mono} fontSize="9.5" fill={C.muted}>
                {p}%
              </text>
            </g>
          );
        })}

        {/* Y-axis title */}
        <text x="22" y="210" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}
              transform="rotate(-90 22 210)">
          state-of-the-art (%)
        </text>

        {/* Vertical year ticks + labels */}
        {YEAR_TICKS.map((y) => {
          const x = xOf(y);
          return (
            <g key={y}>
              <line x1={x} y1={Y1} x2={x} y2={Y1 + 4}
                    stroke={C.muted2} strokeWidth="1" />
              <text x={x} y={Y1 + 16} textAnchor="middle"
                    fontFamily={mono} fontSize="9.5" fill={C.muted2}>
                {y}
              </text>
            </g>
          );
        })}

        {/* X-axis title */}
        <text x={(X0 + X1) / 2} y={Y1 + 32} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          year
        </text>

        {/* Vertical line at 2024 — saturation pivot */}
        <line x1={xOf(2024)} y1={Y0} x2={xOf(2024)} y2={Y1}
              stroke={C.muted} strokeWidth="1"
              strokeDasharray="3 3" opacity="0.7" />
        <text x={xOf(2024) - 4} y={Y0 + 12} textAnchor="end"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          MMLU &amp; HumanEval effectively saturated
        </text>
        <text x={xOf(2024) - 4} y={Y0 + 24} textAnchor="end"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          → field shifts to harder benchmarks
        </text>

        {/* Human baseline lines (very subtle) */}
        {SERIES.filter(s => s.humanBaseline != null).map((s) => {
          const y = yOf(s.humanBaseline);
          // Only span the years where the benchmark is active
          const xStart = xOf(s.points[0][0]);
          const xEnd = X1;
          return (
            <g key={`hb-${s.name}`}>
              <line x1={xStart} y1={y} x2={xEnd} y2={y}
                    stroke={C.muted} strokeWidth="0.8"
                    strokeDasharray="2 4" opacity="0.5" />
            </g>
          );
        })}

        {/* Series polylines */}
        {SERIES.map((s) => (
          <g key={s.name}>
            <polyline
              points={polylinePoints(s.points)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.isFrontier ? '2.2' : '1.6'}
              opacity={s.isFrontier ? 1 : 0.85}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* End dot */}
            <circle
              cx={xOf(s.points[s.points.length - 1][0])}
              cy={yOf(s.points[s.points.length - 1][1])}
              r={s.isFrontier ? 3.5 : 2.8}
              fill={s.color}
              stroke={C.bg3}
              strokeWidth="1"
            />
            {/* Series label */}
            <text
              x={xOf(s.labelAt.year)}
              y={yOf(s.labelAt.pct)}
              textAnchor={s.labelAt.anchor}
              fontFamily={mono}
              fontSize="10"
              fill={s.color}
              fontWeight={s.isFrontier ? '600' : '400'}
            >
              {s.name}
            </text>
          </g>
        ))}

        {/* Composite-transition marker — where FrontierMath + HLE join GPQA */}
        <line x1={xOf(2025.05)} y1={Y0} x2={xOf(2025.05)} y2={Y1}
              stroke={C.accent} strokeWidth="1"
              strokeDasharray="2 3" opacity="0.55" />
        <text x={xOf(2025.05) + 4} y={yOf(66)}
              fontFamily={mono} fontSize="8.5" fill={C.accent} opacity="0.85">
          FrontierMath + HLE join
        </text>
        <text x={xOf(2025.05) + 4} y={yOf(60)}
              fontFamily={mono} fontSize="8.5" fill={C.accent} opacity="0.85">
          the composite here
        </text>

        {/* Frontier annotation — teal callout */}
        <line
          x1={xOf(2025.6)} y1={yOf(20)}
          x2={xOf(2024.8)} y2={yOf(40)}
          stroke={C.accent} strokeWidth="1" opacity="0.7" />
        <text x={xOf(2024.7)} y={yOf(42)} textAnchor="end"
              fontFamily={mono} fontSize="9" fill={C.accent}
              fontStyle="italic">
          current measurement frontier
        </text>
        <text x={xOf(2024.7)} y={yOf(36)} textAnchor="end"
              fontFamily={mono} fontSize="9" fill={C.accent}
              fontStyle="italic">
          not yet saturated
        </text>

        {/* Human baseline legend */}
        <g transform={`translate(${X0 + 8}, ${Y1 - 8})`}>
          <line x1="0" y1="0" x2="22" y2="0"
                stroke={C.muted} strokeWidth="0.8"
                strokeDasharray="2 4" opacity="0.7" />
          <text x="28" y="3" fontFamily={mono} fontSize="9" fill={C.muted}>
            human-expert baseline
          </text>
        </g>

        {/* Bottom note */}
        <line x1={X0} y1={Y1 + 56} x2={X1} y2={Y1 + 56}
              stroke={C.border} strokeWidth="0.5" />
        <text x="320" y={Y1 + 76} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          Trajectories trace published SOTA on each benchmark; exact scores vary across reported runs.
        </text>
        <text x="320" y={Y1 + 92} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          The teal line is GPQA alone through 2024, then an unweighted average of GPQA, FrontierMath, and Humanity's Last Exam
        </text>
        <text x="320" y={Y1 + 106} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          from January 2025 onward — the two later benchmarks did not exist before November 2024 and January 2025 respectively.
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
        Benchmarks repeatedly follow the same arc: introduced as challenging, saturated within a
        few years, supplanted by harder successors — a cycle that has accelerated as model capability scaled.
      </figcaption>
    </figure>
  );
}
