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

// Each panel is a circular target with concentric rings.
const PANEL_CENTERS = [
  { cx: 170, cy: 170 },  // TL
  { cx: 470, cy: 170 },  // TR
  { cx: 170, cy: 480 },  // BL
  { cx: 470, cy: 480 },  // BR
];

const LABELS = [
  'low bias  ·  low variance',
  'low bias  ·  high variance',
  'high bias  ·  low variance',
  'high bias  ·  high variance',
];

// Dot offsets from panel center (≈10 dots per panel).
// Designed so that:
//   TL: tight cluster on center
//   TR: scattered, centroid on center
//   BL: tight cluster, offset upper-left
//   BR: scattered, centroid offset upper-left
const DOTS = [
  [ [-8,-4],[5,-10],[-3,6],[10,2],[1,-1],[-9,1],[3,8],[-4,-8],[7,-3],[0,0] ],
  [ [-55,-35],[60,30],[-25,50],[40,-55],[-60,15],[50,-15],[-20,-65],[15,60],[-35,75],[30,-60] ],
  [ [-48,-36],[-32,-45],[-38,-38],[-30,-34],[-44,-32],[-40,-45],[-32,-42],[-36,-32],[-42,-45],[-34,-38] ],
  [ [-70,-55],[10,-10],[-55,-75],[15,-25],[-75,-25],[-35,-75],[-25,-45],[-55,-10],[-15,-65],[-20,-25] ],
];

function Target({ cx, cy, dots, showCentroid, centroid }) {
  return (
    <g>
      {/* Concentric rings */}
      <circle cx={cx} cy={cy} r="110" fill="none" stroke={C.border} strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="75"  fill="none" stroke={C.border} strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="40"  fill="none" stroke={C.border} strokeWidth="1.5" />
      {/* Bullseye */}
      <circle cx={cx} cy={cy} r="6" fill={C.muted} />

      {/* Prediction dots */}
      {dots.map(([dx, dy], i) => (
        <circle
          key={i}
          cx={cx + dx}
          cy={cy + dy}
          r="3.6"
          fill={C.muted2}
        />
      ))}

      {/* Centroid marker (teal +) only on the low-bias / high-variance panel */}
      {showCentroid && (
        <g stroke={C.accent} strokeWidth="1.8" strokeLinecap="round">
          <line x1={cx + centroid[0] - 7} y1={cy + centroid[1]}     x2={cx + centroid[0] + 7} y2={cy + centroid[1]} />
          <line x1={cx + centroid[0]}     y1={cy + centroid[1] - 7} x2={cx + centroid[0]}     y2={cy + centroid[1] + 7} />
        </g>
      )}
    </g>
  );
}

export default function BiasVarianceDartboard() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 660"
        width="100%"
        role="img"
        aria-label="Bias-variance dartboard: four panels showing combinations of bias and variance"
        style={{ display: 'block' }}
      >
        {PANEL_CENTERS.map((p, i) => (
          <g key={i}>
            <Target
              cx={p.cx}
              cy={p.cy}
              dots={DOTS[i]}
              showCentroid={i === 1}
              centroid={[0, 0]}
            />
            <text
              x={p.cx}
              y={p.cy + 150}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="11.5"
              fill={i === 1 ? C.accent : C.text}
            >
              {LABELS[i]}
            </text>
          </g>
        ))}

        {/* Light vertical and horizontal dividers between the four panels */}
        <line x1="320" y1="40"  x2="320" y2="620" stroke={C.border} strokeWidth="1" strokeDasharray="2,5" />
        <line x1="40"  y1="330" x2="600" y2="330" stroke={C.border} strokeWidth="1" strokeDasharray="2,5" />
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
        Bias measures how far the average prediction is from the truth; variance
        measures how scattered predictions are across training sets.
      </figcaption>
    </figure>
  );
}
