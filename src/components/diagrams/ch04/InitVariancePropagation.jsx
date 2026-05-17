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

// Plot region
const X0 = 80, X1 = 600;
const Y_TOP = 60, Y_BOT = 250;
const PLOT_W = X1 - X0;
const PLOT_H = Y_BOT - Y_TOP;
const N_LAYERS = 50;

// log10 axis: -4 (bottom) to +4 (top)
const LOG_MIN = -4, LOG_MAX = 4;
const LOG_SPAN = LOG_MAX - LOG_MIN;

function xOf(layer) {
  return X0 + ((layer - 1) / (N_LAYERS - 1)) * PLOT_W;
}
function yOf(log10v) {
  return Y_TOP + (LOG_MAX - log10v) * PLOT_H / LOG_SPAN;
}

// Synthetic variance trajectories (in log10), tuned to match the
// qualitative behavior described in the prose.
function naiveLog10(layer) {
  // Naive Gaussian: explodes; reaches 10⁴ by layer 20, then off-chart
  if (layer >= 20) return LOG_MAX;
  return ((layer - 1) / 19) * LOG_MAX;
}
function xavierLog10(layer) {
  // Xavier on ReLU under-scales: slowly decays toward 10⁻²
  return -((layer - 1) / (N_LAYERS - 1)) * 2;
}
function heLog10(layer) {
  // Stays near 0 with deterministic tiny jitter
  const s = Math.sin(layer * 12.9898) * 43758.5453;
  const noise = (s - Math.floor(s)) * 0.2 - 0.1;
  return noise * 0.6;
}

function curvePoints(fn) {
  const pts = [];
  for (let i = 1; i <= N_LAYERS; i++) {
    const v = fn(i);
    if (v >= LOG_MAX) {
      pts.push(`${xOf(i)},${yOf(LOG_MAX)}`);
      break;
    }
    if (v <= LOG_MIN) {
      pts.push(`${xOf(i)},${yOf(LOG_MIN)}`);
      break;
    }
    pts.push(`${xOf(i)},${yOf(v)}`);
  }
  return pts.join(' ');
}

const Y_TICKS = [
  { log: 4,  label: '10⁴' },
  { log: 2,  label: '10²' },
  { log: 0,  label: '1' },
  { log: -2, label: '10⁻²' },
  { log: -4, label: '10⁻⁴' },
];

const X_TICKS = [1, 10, 20, 30, 40, 50];

export default function InitVariancePropagation() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="Activation variance vs. depth for naive, Xavier, and He initialization"
        style={{ display: 'block' }}
      >
        {/* Title */}
        <text
          x={320}
          y={26}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="12"
          fill={C.text}
        >
          Activation variance across depth (ReLU network)
        </text>

        {/* Explode band: log10 from 2 to 4 */}
        <rect
          x={X0}
          y={yOf(4)}
          width={PLOT_W}
          height={yOf(2) - yOf(4)}
          fill={C.muted}
          opacity="0.08"
        />
        <text
          x={X1 - 8}
          y={yOf(3) + 4}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted2}
        >
          gradients explode
        </text>

        {/* Vanish band: log10 from -4 to -2 */}
        <rect
          x={X0}
          y={yOf(-2)}
          width={PLOT_W}
          height={yOf(-4) - yOf(-2)}
          fill={C.muted}
          opacity="0.08"
        />
        <text
          x={X1 - 8}
          y={yOf(-3) + 4}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted2}
        >
          gradients vanish
        </text>

        {/* Y gridlines + labels */}
        {Y_TICKS.map(t => (
          <g key={`y-${t.log}`}>
            <line
              x1={X0}
              y1={yOf(t.log)}
              x2={X1}
              y2={yOf(t.log)}
              stroke={C.border}
              strokeWidth="1"
              opacity={t.log === 0 ? 0.9 : 0.5}
            />
            <text
              x={X0 - 8}
              y={yOf(t.log) + 4}
              textAnchor="end"
              fontFamily={mono}
              fontSize="10"
              fill={C.muted}
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* X-axis */}
        <line
          x1={X0}
          y1={Y_BOT}
          x2={X1}
          y2={Y_BOT}
          stroke={C.border}
          strokeWidth="1.5"
        />
        {X_TICKS.map(L => (
          <g key={`x-${L}`}>
            <line
              x1={xOf(L)}
              y1={Y_BOT}
              x2={xOf(L)}
              y2={Y_BOT + 4}
              stroke={C.muted}
              strokeWidth="1"
            />
            <text
              x={xOf(L)}
              y={Y_BOT + 16}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="10"
              fill={C.muted}
            >
              {L}
            </text>
          </g>
        ))}
        <text
          x={(X0 + X1) / 2}
          y={Y_BOT + 32}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted}
        >
          layer index
        </text>

        {/* Y-axis label */}
        <text
          x={28}
          y={(Y_TOP + Y_BOT) / 2}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted}
          transform={`rotate(-90 28 ${(Y_TOP + Y_BOT) / 2})`}
        >
          Var(activations), log scale
        </text>

        {/* Curves */}
        <polyline
          points={curvePoints(xavierLog10)}
          fill="none"
          stroke={C.muted2}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <polyline
          points={curvePoints(naiveLog10)}
          fill="none"
          stroke={C.muted2}
          strokeWidth="1.5"
        />
        <polyline
          points={curvePoints(heLog10)}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.8"
        />

        {/* End-of-curve labels */}
        {/* Naive: clipped at layer 20 */}
        <text
          x={xOf(20) + 6}
          y={yOf(4) + 4}
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted2}
        >
          Naive Gaussian (σ=1)
        </text>
        {/* Xavier: ends near (50, -2) */}
        <text
          x={xOf(50) - 4}
          y={yOf(-2) - 6}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted2}
        >
          Xavier (under-scales for ReLU)
        </text>
        {/* He: ends near (50, 0) */}
        <text
          x={xOf(50) - 4}
          y={yOf(0) - 6}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.accent}
        >
          He init — stable
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
        For a ReLU network, only He initialization holds the activation variance
        roughly constant across depth — the precondition for stable training.
      </figcaption>
    </figure>
  );
}
