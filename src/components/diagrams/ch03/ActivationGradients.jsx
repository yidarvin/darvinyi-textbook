const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Layout: two stacked sub-plots per panel, two panels side by side.
const PANEL_W = 280;
const LEFT_X  = 24;
const RIGHT_X = 336;

const X_MIN = -6;
const X_MAX = 6;
const Y_MIN = -0.1;
const Y_MAX = 1.05;

// Per-subplot inner geometry
const SUB_W = PANEL_W - 32;
const SUB_H = 86;
const SUB_LEFT_OFFSET = 28;       // y-axis label space
const TOP_SUB_Y  = 80;
const BOT_SUB_Y  = 200;

function xToPx(x, x0) {
  return x0 + SUB_LEFT_OFFSET + ((x - X_MIN) / (X_MAX - X_MIN)) * (SUB_W - SUB_LEFT_OFFSET);
}
function yToPx(y, yBase, yMax = Y_MAX) {
  const yClamped = Math.min(Math.max(y, Y_MIN), yMax);
  return yBase + SUB_H - ((yClamped - Y_MIN) / (yMax - Y_MIN)) * SUB_H;
}

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function sigmoidDeriv(x) {
  const s = sigmoid(x);
  return s * (1 - s);
}

function buildPath(fn, x0, yBase, yMax = Y_MAX) {
  const N = 80;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + (i / N) * (X_MAX - X_MIN);
    const px = xToPx(x, x0);
    const py = yToPx(fn(x), yBase, yMax);
    d += (i === 0 ? 'M ' : ' L ') + px.toFixed(2) + ' ' + py.toFixed(2);
  }
  return d;
}

function Axes({ x0, yBase, yMaxLabel, yMax = Y_MAX }) {
  const xAxisY = yToPx(0, yBase, yMax);
  return (
    <g>
      {/* x-axis */}
      <line
        x1={xToPx(X_MIN, x0)}
        y1={xAxisY}
        x2={xToPx(X_MAX, x0)}
        y2={xAxisY}
        stroke={C.border}
        strokeWidth="1"
      />
      {/* y-axis */}
      <line
        x1={xToPx(X_MIN, x0)}
        y1={yBase}
        x2={xToPx(X_MIN, x0)}
        y2={yBase + SUB_H}
        stroke={C.border}
        strokeWidth="1"
      />
      {/* y-axis labels */}
      <text
        x={xToPx(X_MIN, x0) - 6}
        y={yToPx(0, yBase, yMax) + 3}
        textAnchor="end"
        fontFamily={mono}
        fontSize="9.5"
        fill={C.muted}
      >
        0
      </text>
      <text
        x={xToPx(X_MIN, x0) - 6}
        y={yToPx(yMaxLabel, yBase, yMax) + 3}
        textAnchor="end"
        fontFamily={mono}
        fontSize="9.5"
        fill={C.muted}
      >
        {Number.isInteger(yMaxLabel) ? yMaxLabel.toString() : yMaxLabel.toFixed(2)}
      </text>
      {/* x ticks: -6, 0, 6 */}
      <text x={xToPx(X_MIN, x0)} y={yBase + SUB_H + 12} textAnchor="middle" fontFamily={mono} fontSize="9" fill={C.muted}>−6</text>
      <text x={xToPx(0, x0)}      y={yBase + SUB_H + 12} textAnchor="middle" fontFamily={mono} fontSize="9" fill={C.muted}>0</text>
      <text x={xToPx(X_MAX, x0)}  y={yBase + SUB_H + 12} textAnchor="middle" fontFamily={mono} fontSize="9" fill={C.muted}>6</text>
    </g>
  );
}

export default function ActivationGradients() {
  // Pre-compute paths. ReLU's top subplot uses a taller y-range so the
  // y = x branch reads as a gradual diagonal rather than a near-vertical wall.
  const RELU_TOP_Y_MAX = 6;
  const sigPath        = buildPath(sigmoid, LEFT_X,  TOP_SUB_Y);
  const sigDerivPath   = buildPath(sigmoidDeriv, LEFT_X, BOT_SUB_Y);
  const reluPath       = buildPath(x => Math.max(0, x), RIGHT_X, TOP_SUB_Y, RELU_TOP_Y_MAX);
  // ReLU derivative is the step function; we build two separate segments
  const reluDerivLeftX1  = xToPx(X_MIN, RIGHT_X);
  const reluDerivLeftX2  = xToPx(0, RIGHT_X);
  const reluDerivRightX1 = xToPx(0, RIGHT_X);
  const reluDerivRightX2 = xToPx(X_MAX, RIGHT_X);
  const reluDerivZeroY   = yToPx(0, BOT_SUB_Y);
  const reluDerivOneY    = yToPx(1, BOT_SUB_Y);

  // Saturated regions (|x| > 4) on the sigmoid panel
  const satLeftX1  = xToPx(X_MIN, LEFT_X);
  const satLeftX2  = xToPx(-4, LEFT_X);
  const satRightX1 = xToPx(4, LEFT_X);
  const satRightX2 = xToPx(X_MAX, LEFT_X);

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 340"
        width="100%"
        role="img"
        aria-label="Sigmoid and ReLU activations with their derivatives"
        style={{ display: 'block' }}
      >
        {/* Title above both panels */}
        <text
          x="320"
          y="22"
          textAnchor="middle"
          fontFamily={sans}
          fontSize="12"
          fill={C.text}
          fontWeight="500"
        >
          Activation function and its derivative
        </text>

        {/* ── LEFT panel: Sigmoid ── */}
        <text x={LEFT_X} y={50} fontFamily={mono} fontSize="11" fill={C.text}>
          Sigmoid
        </text>

        {/* Saturated region shading on TOP subplot */}
        <rect
          x={satLeftX1}
          y={TOP_SUB_Y}
          width={satLeftX2 - satLeftX1}
          height={SUB_H}
          fill={C.muted}
          opacity="0.08"
        />
        <rect
          x={satRightX1}
          y={TOP_SUB_Y}
          width={satRightX2 - satRightX1}
          height={SUB_H}
          fill={C.muted}
          opacity="0.08"
        />
        {/* Saturated region shading on BOT subplot */}
        <rect
          x={satLeftX1}
          y={BOT_SUB_Y}
          width={satLeftX2 - satLeftX1}
          height={SUB_H}
          fill={C.muted}
          opacity="0.08"
        />
        <rect
          x={satRightX1}
          y={BOT_SUB_Y}
          width={satRightX2 - satRightX1}
          height={SUB_H}
          fill={C.muted}
          opacity="0.08"
        />

        <Axes x0={LEFT_X} yBase={TOP_SUB_Y} yMaxLabel={1} />
        <path d={sigPath} stroke={C.text} strokeWidth="1.5" fill="none" />
        <text
          x={xToPx(X_MAX, LEFT_X) - 4}
          y={TOP_SUB_Y + 14}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          σ(x)
        </text>

        <Axes x0={LEFT_X} yBase={BOT_SUB_Y} yMaxLabel={0.25} />
        <path d={sigDerivPath} stroke={C.text} strokeWidth="1.5" fill="none" />
        {/* dotted max = 0.25 line */}
        <line
          x1={xToPx(X_MIN, LEFT_X)}
          y1={yToPx(0.25, BOT_SUB_Y)}
          x2={xToPx(X_MAX, LEFT_X)}
          y2={yToPx(0.25, BOT_SUB_Y)}
          stroke={C.muted}
          strokeWidth="1"
          strokeDasharray="2,3"
        />
        <text
          x={xToPx(X_MAX, LEFT_X) - 4}
          y={yToPx(0.25, BOT_SUB_Y) - 4}
          textAnchor="end"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          max = 0.25
        </text>
        <text
          x={xToPx(X_MAX, LEFT_X) - 4}
          y={BOT_SUB_Y + 14}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          σ′(x)
        </text>

        {/* ── RIGHT panel: ReLU ── */}
        <text x={RIGHT_X} y={50} fontFamily={mono} fontSize="11" fill={C.text}>
          ReLU
        </text>

        <Axes x0={RIGHT_X} yBase={TOP_SUB_Y} yMaxLabel={RELU_TOP_Y_MAX} yMax={RELU_TOP_Y_MAX} />
        <path d={reluPath} stroke={C.text} strokeWidth="1.5" fill="none" />
        <text
          x={xToPx(X_MAX, RIGHT_X) - 4}
          y={TOP_SUB_Y + 14}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          max(0, x)
        </text>

        <Axes x0={RIGHT_X} yBase={BOT_SUB_Y} yMaxLabel={1} />
        {/* ReLU derivative: 0 for x<0, 1 for x>0 */}
        {/* Teal fill on the positive region */}
        <rect
          x={reluDerivRightX1}
          y={reluDerivOneY}
          width={reluDerivRightX2 - reluDerivRightX1}
          height={reluDerivZeroY - reluDerivOneY}
          fill={C.accent}
          opacity="0.15"
        />
        {/* zero segment (x < 0) */}
        <line
          x1={reluDerivLeftX1}
          y1={reluDerivZeroY}
          x2={reluDerivLeftX2}
          y2={reluDerivZeroY}
          stroke={C.text}
          strokeWidth="1.5"
        />
        {/* vertical jump */}
        <line
          x1={reluDerivRightX1}
          y1={reluDerivZeroY}
          x2={reluDerivRightX1}
          y2={reluDerivOneY}
          stroke={C.text}
          strokeWidth="1.5"
          strokeDasharray="2,3"
          opacity="0.5"
        />
        {/* one segment (x > 0) — teal */}
        <line
          x1={reluDerivRightX1}
          y1={reluDerivOneY}
          x2={reluDerivRightX2}
          y2={reluDerivOneY}
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <text
          x={(reluDerivRightX1 + reluDerivRightX2) / 2}
          y={reluDerivOneY - 6}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.accent}
        >
          gradient survives
        </text>
        <text
          x={xToPx(X_MAX, RIGHT_X) - 4}
          y={BOT_SUB_Y + 14}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          d/dx max(0, x)
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
        Sigmoid's gradient never exceeds 0.25 and vanishes at saturation; ReLU's
        gradient is exactly 1 in its active region, letting error signals
        propagate through deep networks unchanged.
      </figcaption>
    </figure>
  );
}
