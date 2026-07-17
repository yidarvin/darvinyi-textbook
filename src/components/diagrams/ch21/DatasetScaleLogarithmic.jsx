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
const X0 = 80, X1 = 580;        // x-axis pixel range
const Y0 = 60, Y1 = 340;        // y-axis pixel range (Y0 = top, Y1 = bottom)
const YEAR_MIN = 1998, YEAR_MAX = 2026;
const LOG_MIN = 4, LOG_MAX = 14;

const xOf = (year) => X0 + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (X1 - X0);
const yOf = (value) => {
  const lv = Math.log10(value);
  return Y1 - ((lv - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (Y1 - Y0);
};

const DATASETS = [
  { name: 'MNIST',         year: 1998, value: 7e4,    units: 'images',  cat: 'vision',  dx: 6,  dy: 3 },
  { name: 'CIFAR-10',      year: 2009, value: 6e4,    units: 'images',  cat: 'vision',  dx: -6, dy: 14, anchor: 'end' },
  { name: 'ImageNet',      year: 2009, value: 1.2e6,  units: 'images',  cat: 'vision',  dx: 6,  dy: -4 },
  // Common Crawl: 410B tokens is the filtered Common Crawl figure GPT-3 trained on (Brown et al.
  // 2020, Table 2.2) — the standard citable token count, and consistent with it being the raw
  // superset that the smaller, further-filtered C4 (156B) and The Pile (300B) below it derive from.
  { name: 'Common Crawl',  year: 2008, value: 4.1e11, units: 'tokens',  cat: 'lm',      dx: 6,  dy: 18 },
  { name: 'C4',            year: 2019, value: 1.56e11, units: 'tokens', cat: 'lm',      dx: -6, dy: -3, anchor: 'end' },
  { name: 'The Pile',      year: 2020, value: 3e11,   units: 'tokens',  cat: 'lm',      dx: 6,  dy: 12 },
  { name: 'LAION-5B',      year: 2022, value: 5.85e9, units: 'pairs',   cat: 'multi',   dx: 6,  dy: 4 },
  { name: 'GPT-4 (est.)',  year: 2023, value: 1.3e13, units: 'tokens',  cat: 'lm',      dx: -6, dy: 4,  anchor: 'end' },
  { name: 'Llama 3',       year: 2024, value: 1.5e13, units: 'tokens',  cat: 'lm',      dx: 6,  dy: 4 },
];

// Decades to label on Y axis
const DECADES = [
  { exp: 4,  label: '10⁴' },
  { exp: 5,  label: '10⁵' },
  { exp: 6,  label: '10⁶' },
  { exp: 7,  label: '10⁷' },
  { exp: 8,  label: '10⁸' },
  { exp: 9,  label: '10⁹' },
  { exp: 10, label: '10¹⁰' },
  { exp: 11, label: '10¹¹' },
  { exp: 12, label: '10¹²' },
  { exp: 13, label: '10¹³' },
  { exp: 14, label: '10¹⁴' },
];

const YEAR_TICKS = [1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026];

// Trend line through the language-model dataset points (skip LAION-5B / vision)
const TREND_POINTS = DATASETS.filter(d => d.cat === 'lm');

const colorOf = (cat) => {
  if (cat === 'vision') return C.muted2;
  if (cat === 'multi')  return '#a78bfa';
  return C.text; // lm — primary line of points
};

export default function DatasetScaleLogarithmic() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 460"
        width="100%"
        role="img"
        aria-label="Log-scale plot of major ML dataset sizes from 1998 to 2026, showing roughly 10x growth every two to three years and a projected data-exhaustion window of 2026–2032."
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="ds-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="ds-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.muted2}
              letterSpacing="0.06em">
          training-dataset scale, 1998 — 2026 (log)
        </text>

        {/* Plot frame */}
        <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} rx="4"
              fill="transparent" stroke={C.border} strokeWidth="1" />

        {/* Horizontal decade gridlines + Y labels */}
        {DECADES.map((d) => {
          const y = yOf(Math.pow(10, d.exp));
          return (
            <g key={d.exp}>
              <line x1={X0} y1={y} x2={X1} y2={y}
                    stroke={C.border} strokeWidth="0.5"
                    strokeDasharray="2 3" />
              <text x={X0 - 6} y={y + 3} textAnchor="end"
                    fontFamily={mono} fontSize="9.5" fill={C.muted}>
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Y-axis title */}
        <text x="22" y="200" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}
              transform="rotate(-90 22 200)">
          dataset size (examples / tokens)
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

        {/* Trend line through language-model points */}
        <polyline
          points={TREND_POINTS.map(d => `${xOf(d.year)},${yOf(d.value)}`).join(' ')}
          fill="none" stroke={C.muted} strokeWidth="1"
          strokeDasharray="4 3" opacity="0.7" />

        {/* Trend slope annotation */}
        <text x={xOf(2016)} y={yOf(1e9) - 4}
              fontFamily={mono} fontSize="9.5" fill={C.muted}
              fontStyle="italic">
          ≈ 10× every 2–3 years
        </text>

        {/* Data-exhaustion shaded band — from 2026 to right edge,
            represents the leading edge of the 2026–2032 projection */}
        <rect x={xOf(2026)} y={Y0}
              width={X1 - xOf(2026)} height={Y1 - Y0}
              fill={C.accent} opacity="0.06" />

        {/* Dashed line at right edge of plot */}
        <line x1={X1} y1={Y0} x2={X1} y2={Y1}
              stroke={C.accent} strokeWidth="1.2"
              strokeDasharray="4 3" opacity="0.9" />

        {/* Data-exhaustion annotation — teal callout */}
        <text x={X1 - 4} y={Y0 + 14} textAnchor="end"
              fontFamily={mono} fontSize="9.5" fill={C.accent}
              fontWeight="600">
          data-exhaustion estimates
        </text>
        <text x={X1 - 4} y={Y0 + 26} textAnchor="end"
              fontFamily={mono} fontSize="9.5" fill={C.accent}>
          2026 — 2032
        </text>

        {/* Dataset points + labels */}
        {DATASETS.map((d) => {
          const cx = xOf(d.year);
          const cy = yOf(d.value);
          const fill = colorOf(d.cat);
          return (
            <g key={d.name}>
              <circle cx={cx} cy={cy} r="3.2"
                      fill={fill} stroke={C.bg3} strokeWidth="1" />
              <text x={cx + d.dx} y={cy + d.dy}
                    textAnchor={d.anchor || 'start'}
                    fontFamily={mono} fontSize="9.5" fill={C.text}>
                {d.name}
              </text>
            </g>
          );
        })}

        {/* Legend (top-left of plot) */}
        <g transform={`translate(${X0 + 10}, ${Y0 + 14})`}>
          <rect x="-6" y="-10" width="180" height="48" rx="3"
                fill={C.bg2} stroke={C.borderLt} strokeWidth="0.8" opacity="0.9" />
          <circle cx="2" cy="0" r="3" fill={C.muted2} />
          <text x="10" y="3" fontFamily={mono} fontSize="9" fill={C.muted2}>
            vision (images)
          </text>
          <circle cx="2" cy="14" r="3" fill={C.text} />
          <text x="10" y="17" fontFamily={mono} fontSize="9" fill={C.text}>
            language (tokens)
          </text>
          <circle cx="2" cy="28" r="3" fill="#a78bfa" />
          <text x="10" y="31" fontFamily={mono} fontSize="9" fill="#a78bfa">
            multimodal (image-text pairs)
          </text>
        </g>

        {/* Below-plot note about units */}
        <text x="320" y={Y1 + 60} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          Note: image datasets and text datasets use different units (examples vs. tokens).
        </text>
        <text x="320" y={Y1 + 76} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          The vertical comparison gives a rough order-of-magnitude sense, not a precise apples-to-apples comparison.
        </text>

        {/* Bottom legend / source row */}
        <line x1={X0} y1={Y1 + 96} x2={X1} y2={Y1 + 96}
              stroke={C.border} strokeWidth="0.5" />
        <text x="320" y={Y1 + 110} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          sizes are approximate where exact training-corpus figures have not been disclosed
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
        Training datasets grew roughly 10× every two to three years for two decades —
        a pace the data-exhaustion projections suggest is now approaching structural limits.
      </figcaption>
    </figure>
  );
}
