const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Layout: two panels side by side
const PANEL_W = 280;
const LEFT_X  = 20;
const RIGHT_X = 340;

// Histogram area (top of each panel)
const HIST_Y0 = 56;
const HIST_H  = 90;
// Softmax bars area (bottom of each panel)
const SMAX_Y0 = 192;
const SMAX_H  = 90;

// Histogram bins on a shared x-scale spanning roughly [-50, +50].
// Left (d_k=8): tight bell, mass concentrated near 0.
// Right (d_k=512): wide bell, mass spread across the full axis.
const BINS_TIGHT = [
  0.00, 0.00, 0.00, 0.00, 0.02, 0.10, 0.34, 0.78, 1.00, 0.78, 0.34, 0.10, 0.02, 0.00, 0.00, 0.00, 0.00,
];
const BINS_WIDE = [
  0.08, 0.18, 0.32, 0.48, 0.62, 0.78, 0.88, 0.95, 1.00, 0.95, 0.88, 0.78, 0.62, 0.48, 0.32, 0.18, 0.08,
];

// Softmax output values
const SOFT_LEFT  = [0.10, 0.18, 0.32, 0.25, 0.15];
const SOFT_RIGHT = [0.00, 0.01, 0.97, 0.02, 0.00];

function Histogram({ x0, y0, w, h, bins, xLabel, accent }) {
  const binW = w / bins.length;
  return (
    <g>
      {/* baseline */}
      <line
        x1={x0}
        y1={y0 + h}
        x2={x0 + w}
        y2={y0 + h}
        stroke={C.border}
        strokeWidth="1"
      />
      {bins.map((v, i) => {
        const bh = v * h * 0.92;
        return (
          <rect
            key={i}
            x={x0 + i * binW + 1}
            y={y0 + h - bh}
            width={binW - 2}
            height={bh}
            rx="1"
            fill={accent ? C.accent : C.muted}
            opacity={accent ? 0.55 : 0.5}
          />
        );
      })}
      {/* x-axis tick labels */}
      <text x={x0}         y={y0 + h + 14} fontFamily={mono} fontSize="10" fill={C.muted}>{xLabel[0]}</text>
      <text x={x0 + w / 2} y={y0 + h + 14} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>0</text>
      <text x={x0 + w}     y={y0 + h + 14} textAnchor="end"  fontFamily={mono} fontSize="10" fill={C.muted}>{xLabel[1]}</text>
    </g>
  );
}

function SoftmaxBars({ x0, y0, w, h, values, highlightMax }) {
  const n = values.length;
  const gap = 6;
  const barW = (w - (n - 1) * gap) / n;
  const maxIdx = values.indexOf(Math.max(...values));
  return (
    <g>
      <line
        x1={x0}
        y1={y0 + h}
        x2={x0 + w}
        y2={y0 + h}
        stroke={C.border}
        strokeWidth="1"
      />
      {values.map((v, i) => {
        const bh = v * h * 0.95;
        const isMax = highlightMax && i === maxIdx;
        return (
          <g key={i}>
            <rect
              x={x0 + i * (barW + gap)}
              y={y0 + h - bh}
              width={barW}
              height={bh}
              rx="2"
              fill={isMax ? C.accent : C.muted}
              opacity={isMax ? 0.9 : 0.55}
            />
            <text
              x={x0 + i * (barW + gap) + barW / 2}
              y={y0 + h + 14}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="9.5"
              fill={isMax ? C.accent : C.muted}
            >
              {v.toFixed(2)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default function ScalingByDk() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 360"
        width="100%"
        role="img"
        aria-label="Dot-product variance grows with d_k, softmax saturates"
        style={{ display: 'block' }}
      >
        {/* ── LEFT panel: d_k = 8 ── */}
        <text x={LEFT_X} y={28} fontFamily={mono} fontSize="11" fill={C.text}>
          d_k = 8
        </text>
        <text x={LEFT_X} y={44} fontFamily={sans} fontSize="10.5" fill={C.muted}>
          dot products (q·k)
        </text>

        <Histogram
          x0={LEFT_X}
          y0={HIST_Y0}
          w={PANEL_W}
          h={HIST_H}
          bins={BINS_TIGHT}
          xLabel={['−50', '+50']}
        />

        <text x={LEFT_X} y={SMAX_Y0 - 12} fontFamily={sans} fontSize="10.5" fill={C.muted}>
          softmax output
        </text>
        <SoftmaxBars
          x0={LEFT_X}
          y0={SMAX_Y0}
          w={PANEL_W}
          h={SMAX_H}
          values={SOFT_LEFT}
          highlightMax={false}
        />

        {/* ── Center annotation ── */}
        <line
          x1="320"
          y1="50"
          x2="320"
          y2="310"
          stroke={C.border}
          strokeWidth="1"
          strokeDasharray="2,4"
        />
        <rect
          x="262"
          y="150"
          width="116"
          height="36"
          rx="6"
          fill="#0d0d0d"
          stroke={C.border}
          strokeWidth="1"
        />
        <text
          x="320"
          y="166"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          Var(q·k) = d_k
        </text>
        <text
          x="320"
          y="180"
          textAnchor="middle"
          fontFamily={sans}
          fontSize="10"
          fill={C.muted}
        >
          spread grows with d_k
        </text>

        {/* ── RIGHT panel: d_k = 512 ── */}
        <text x={RIGHT_X} y={28} fontFamily={mono} fontSize="11" fill={C.text}>
          d_k = 512
        </text>
        <text x={RIGHT_X} y={44} fontFamily={sans} fontSize="10.5" fill={C.muted}>
          dot products (q·k)
        </text>

        <Histogram
          x0={RIGHT_X}
          y0={HIST_Y0}
          w={PANEL_W}
          h={HIST_H}
          bins={BINS_WIDE}
          xLabel={['−50', '+50']}
        />

        <text x={RIGHT_X} y={SMAX_Y0 - 12} fontFamily={sans} fontSize="10.5" fill={C.muted}>
          softmax output
        </text>
        <SoftmaxBars
          x0={RIGHT_X}
          y0={SMAX_Y0}
          w={PANEL_W}
          h={SMAX_H}
          values={SOFT_RIGHT}
          highlightMax
        />

        {/* footer annotation */}
        <text
          x="320"
          y="340"
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted}
        >
          larger d_k → saturated softmax → vanishing gradient
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
        Dot-product variance grows linearly with d_k. Without scaling, softmax
        saturates and gradients vanish — hence the 1/√d_k factor.
      </figcaption>
    </figure>
  );
}
