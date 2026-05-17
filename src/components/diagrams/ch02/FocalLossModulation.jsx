const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Plot geometry — single panel
const PLOT_X0 = 70;
const PLOT_Y0 = 50;
const PLOT_W  = 520;
const PLOT_H  = 220;

// Axis ranges
const X_MIN = 0;
const X_MAX = 1;
// We cap the visual y-axis at 5 so the steep p→0 region doesn't dominate.
// Cross-entropy at p = 1/e ≈ 0.37 is exactly 1 — that's the labeled reference.
const Y_MIN = 0;
const Y_MAX = 5;

function xToPx(x) {
  return PLOT_X0 + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function yToPx(y) {
  const yClamped = Math.min(Math.max(y, Y_MIN), Y_MAX);
  return PLOT_Y0 + PLOT_H - ((yClamped - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

function focalLoss(p, gamma) {
  if (p <= 0) return Y_MAX; // clamp at axis top
  return -Math.pow(1 - p, gamma) * Math.log(p);
}

function buildPath(gamma) {
  const N = 200;
  let d = '';
  let started = false;
  for (let i = 0; i <= N; i++) {
    const p = X_MIN + (i / N) * (X_MAX - X_MIN);
    // skip p exactly 0 (singular)
    if (p < 0.005) continue;
    const lossVal = focalLoss(p, gamma);
    const px = xToPx(p);
    const py = yToPx(lossVal);
    d += (!started ? 'M ' : ' L ') + px.toFixed(2) + ' ' + py.toFixed(2);
    started = true;
  }
  return d;
}

const CURVES = [
  { gamma: 0,   label: 'γ = 0  (cross-entropy)', color: C.muted, isAccent: false, labelP: 0.42 },
  { gamma: 0.5, label: 'γ = 0.5',                color: C.text,  isAccent: false, labelP: 0.32 },
  { gamma: 2,   label: 'γ = 2  (recommended)',   color: C.accent, isAccent: true, labelP: 0.22 },
  { gamma: 5,   label: 'γ = 5',                  color: C.text,  isAccent: false, labelP: 0.14 },
];

export default function FocalLossModulation() {
  // p > 0.6 shading: "easy example" region
  const easyX1 = xToPx(0.6);
  const easyX2 = xToPx(1.0);

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 340"
        width="100%"
        role="img"
        aria-label="Focal loss curves at γ = 0, 0.5, 2, 5"
        style={{ display: 'block' }}
      >
        {/* Easy-example region shading */}
        <rect
          x={easyX1}
          y={PLOT_Y0}
          width={easyX2 - easyX1}
          height={PLOT_H}
          fill={C.muted}
          opacity="0.08"
        />
        <text
          x={(easyX1 + easyX2) / 2}
          y={PLOT_Y0 + 14}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          easy examples
        </text>

        {/* Axes */}
        <line
          x1={PLOT_X0}
          y1={PLOT_Y0 + PLOT_H}
          x2={PLOT_X0 + PLOT_W}
          y2={PLOT_Y0 + PLOT_H}
          stroke={C.border}
          strokeWidth="1"
        />
        <line
          x1={PLOT_X0}
          y1={PLOT_Y0}
          x2={PLOT_X0}
          y2={PLOT_Y0 + PLOT_H}
          stroke={C.border}
          strokeWidth="1"
        />

        {/* y-axis labels: 0 and 1 (CE at p = 1/e) */}
        <text
          x={PLOT_X0 - 8}
          y={yToPx(0) + 4}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          0
        </text>
        <text
          x={PLOT_X0 - 8}
          y={yToPx(1) + 4}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          1
        </text>
        {/* dotted reference line at loss = 1 */}
        <line
          x1={PLOT_X0}
          y1={yToPx(1)}
          x2={PLOT_X0 + PLOT_W}
          y2={yToPx(1)}
          stroke={C.muted}
          strokeWidth="1"
          strokeDasharray="2,3"
          opacity="0.4"
        />

        {/* x-axis ticks: 0, 0.5, 1 */}
        <text x={xToPx(0)}   y={PLOT_Y0 + PLOT_H + 14} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>0</text>
        <text x={xToPx(0.5)} y={PLOT_Y0 + PLOT_H + 14} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>0.5</text>
        <text x={xToPx(1)}   y={PLOT_Y0 + PLOT_H + 14} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>1</text>

        {/* Axis labels */}
        <text
          x={PLOT_X0 + PLOT_W / 2}
          y={PLOT_Y0 + PLOT_H + 32}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted}
        >
          probability of true class&nbsp; p
        </text>
        <text
          x={PLOT_X0 - 44}
          y={PLOT_Y0 + PLOT_H / 2}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted}
          transform={`rotate(-90 ${PLOT_X0 - 44} ${PLOT_Y0 + PLOT_H / 2})`}
        >
          loss
        </text>

        {/* Plot curves (draw γ=0 first as muted background, accent last on top) */}
        {CURVES.map(c => (
          <path
            key={`curve-${c.gamma}`}
            d={buildPath(c.gamma)}
            stroke={c.color}
            strokeWidth={c.isAccent ? 1.8 : 1.5}
            fill="none"
            opacity={c.isAccent ? 1 : (c.gamma === 0 ? 0.7 : 0.9)}
          />
        ))}

        {/* Curve labels, placed near the steep p region where the curves separate */}
        {CURVES.map(c => {
          const yVal = focalLoss(c.labelP, c.gamma);
          const py = yToPx(yVal);
          const px = xToPx(c.labelP);
          return (
            <text
              key={`label-${c.gamma}`}
              x={px + 8}
              y={py - 4}
              fontFamily={mono}
              fontSize="10"
              fill={c.color}
              opacity={c.isAccent ? 1 : 0.9}
            >
              {c.label}
            </text>
          );
        })}
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
        Focal loss multiplies cross-entropy by (1−p)<sup>γ</sup>, suppressing the
        loss contribution of easy, high-confidence examples and concentrating
        learning on hard ones.
      </figcaption>
    </figure>
  );
}
