const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  mid:     '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
  red:     '#f87171',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Plot dimensions
const VB_W = 640;
const VB_H = 340;
const ML = 64;
const MR = 170;
const MT = 40;
const MB = 52;
const PW = VB_W - ML - MR;
const PH = VB_H - MT - MB;

// Log scale: log10(v) ∈ [-4, 4]
const LOG_MIN = -4;
const LOG_MAX = 4;
const LOG_RANGE = LOG_MAX - LOG_MIN;

const T_MAX = 40;
const N_POINTS = 80;

function xAt(t) {
  return ML + (t / T_MAX) * PW;
}

function yAt(v) {
  const clamped = Math.max(1e-5, Math.min(1e5, v));
  const lg = Math.log10(clamped);
  return MT + PH - ((lg - LOG_MIN) / LOG_RANGE) * PH;
}

function pathFor(fn) {
  const pts = [];
  for (let i = 0; i <= N_POINTS; i++) {
    const t = (i / N_POINTS) * T_MAX;
    const v = fn(t);
    pts.push(`${xAt(t).toFixed(1)},${yAt(v).toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
}

const vanishing = (t) => Math.pow(0.55, t);
const exploding = (t) => Math.pow(1.85, t);
const stable    = (t) => 1 + 0.18 * Math.sin(t * 0.55) + 0.05 * Math.sin(t * 0.18);

const Y_TICKS = [1e4, 1e2, 1, 1e-2, 1e-4];

function fmtTick(v) {
  if (v === 1) return '1';
  const lg = Math.round(Math.log10(v));
  if (lg > 0) return `10^${lg}`;
  return `10^${lg}`;
}

export default function GradientMagnitudeOverTime() {
  // shaded thresholds
  const yExpHi = MT;             // top of explode band (10^4)
  const yExpLo = yAt(1e2);       // 10^2 boundary
  const yVanHi = yAt(1e-2);      // 10^-2 boundary
  const yVanLo = MT + PH;        // bottom (10^-4)

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        role="img"
        aria-label="Gradient magnitude over backprop steps for vanilla RNN vs LSTM cell state"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="gm-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
        </defs>

        {/* Shaded "explode" region */}
        <rect
          x={ML}
          y={yExpHi}
          width={PW}
          height={yExpLo - yExpHi}
          fill={C.muted}
          opacity="0.07"
        />
        <text
          x={ML + 8}
          y={yExpHi + 16}
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted}
          letterSpacing="0.04em"
        >
          gradients explode
        </text>

        {/* Shaded "vanish" region */}
        <rect
          x={ML}
          y={yVanHi}
          width={PW}
          height={yVanLo - yVanHi}
          fill={C.muted}
          opacity="0.07"
        />
        <text
          x={ML + 8}
          y={yVanLo - 8}
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted}
          letterSpacing="0.04em"
        >
          gradients vanish
        </text>

        {/* Axes */}
        <line x1={ML} y1={MT} x2={ML} y2={MT + PH} stroke={C.border} strokeWidth="1" />
        <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke={C.border} strokeWidth="1" />

        {/* Y gridlines + ticks */}
        {Y_TICKS.map((v) => {
          const y = yAt(v);
          return (
            <g key={`yt-${v}`}>
              <line
                x1={ML}
                y1={y}
                x2={ML + PW}
                y2={y}
                stroke={C.border}
                strokeWidth="0.7"
                strokeDasharray="2,3"
              />
              <text
                x={ML - 8}
                y={y + 3}
                textAnchor="end"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.mid}
              >
                {fmtTick(v)}
              </text>
            </g>
          );
        })}

        {/* X ticks */}
        {[0, 10, 20, 30, 40].map((t) => {
          const x = xAt(t);
          return (
            <g key={`xt-${t}`}>
              <line
                x1={x}
                y1={MT + PH}
                x2={x}
                y2={MT + PH + 4}
                stroke={C.border}
                strokeWidth="1"
              />
              <text
                x={x}
                y={MT + PH + 16}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.mid}
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={ML + PW / 2}
          y={VB_H - 12}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.mid}
        >
          backprop step t (steps back into the past)
        </text>
        <text
          x={20}
          y={MT + PH / 2}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.mid}
          transform={`rotate(-90, 20, ${MT + PH / 2})`}
        >
          |∂L/∂h₀|
        </text>

        {/* Curves */}
        {/* Vanishing — muted grey */}
        <path
          d={pathFor(vanishing)}
          fill="none"
          stroke={C.mid}
          strokeWidth="1.5"
          opacity="0.75"
        />
        {/* Exploding — muted grey */}
        <path
          d={pathFor(exploding)}
          fill="none"
          stroke={C.mid}
          strokeWidth="1.5"
          opacity="0.75"
        />
        {/* Stable LSTM cell state — teal, prominent */}
        <path
          d={pathFor(stable)}
          fill="none"
          stroke={C.accent}
          strokeWidth="2"
        />

        {/* Curve labels in right margin */}
        {/* Exploding label — top right */}
        <text
          x={ML + PW + 12}
          y={MT + 30}
          fontFamily={mono}
          fontSize="11"
          fill={C.mid}
        >
          ρ(Wh) {'>'} 1
        </text>
        <text
          x={ML + PW + 12}
          y={MT + 44}
          fontFamily={sans}
          fontSize="10.5"
          fill={C.muted}
          fontStyle="italic"
        >
          vanilla RNN, exploding
        </text>

        {/* Stable LSTM label — middle right */}
        <text
          x={ML + PW + 12}
          y={yAt(1) - 8}
          fontFamily={mono}
          fontSize="11"
          fill={C.accent}
          fontWeight="600"
        >
          LSTM cell state
        </text>
        <text
          x={ML + PW + 12}
          y={yAt(1) + 6}
          fontFamily={sans}
          fontSize="10.5"
          fill={C.accent}
          fontStyle="italic"
        >
          preserved
        </text>

        {/* Vanishing label — bottom right */}
        <text
          x={ML + PW + 12}
          y={MT + PH - 26}
          fontFamily={mono}
          fontSize="11"
          fill={C.mid}
        >
          ρ(Wh) {'<'} 1
        </text>
        <text
          x={ML + PW + 12}
          y={MT + PH - 12}
          fontFamily={sans}
          fontSize="10.5"
          fill={C.muted}
          fontStyle="italic"
        >
          vanilla RNN, vanishing
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
        In a vanilla RNN, gradients decay or explode exponentially in temporal
        distance; the LSTM cell state's additive update keeps them roughly constant
        across hundreds of steps.
      </figcaption>
    </figure>
  );
}
