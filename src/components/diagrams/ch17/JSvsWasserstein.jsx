const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// ── Top: distribution panel ──
const TOP_X0 = 60;
const TOP_X1 = 580;
const TOP_AXIS_Y = 150;
const TOP_BUMP_TOP = 70;

// ── Bottom: divergence plot ──
const BOT_X0 = 80;
const BOT_X1 = 580;
const BOT_Y0 = 220;
const BOT_Y1 = 390;
const THETA_MAX = 10;
const DIV_MAX = 5;

const thetaToPx = th => BOT_X0 + (th / THETA_MAX) * (BOT_X1 - BOT_X0);
const divToPx = v =>
  BOT_Y1 - Math.min(Math.max(v, 0), DIV_MAX) / DIV_MAX * (BOT_Y1 - BOT_Y0);

// Gaussian bump path (above an axis)
function bumpPath(cx, sigmaPx, height, axisY) {
  const X0 = cx - sigmaPx * 3;
  const X1 = cx + sigmaPx * 3;
  const N = 60;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const x = X0 + (X1 - X0) * i / N;
    const z = (x - cx) / sigmaPx;
    const y = axisY - height * Math.exp(-0.5 * z * z);
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
}

export default function JSvsWasserstein() {
  // Top-half distribution centers
  const cxData = 180;
  const cxG = 420;
  const sigmaPx = 22;
  const bumpHeight = 70;

  // Bottom-half curves
  // JS: 0 at θ=0, then constant log(2) for θ>0. Render as a tiny ramp + flat line.
  const log2 = Math.log(2);
  const epsTheta = 0.15;
  const jsPath =
    `M ${thetaToPx(0).toFixed(1)} ${divToPx(0).toFixed(1)} ` +
    `L ${thetaToPx(epsTheta).toFixed(1)} ${divToPx(log2).toFixed(1)} ` +
    `L ${thetaToPx(THETA_MAX).toFixed(1)} ${divToPx(log2).toFixed(1)}`;
  // Wasserstein: y = θ (clipped). Reaches DIV_MAX at θ = DIV_MAX.
  const wsPath =
    `M ${thetaToPx(0).toFixed(1)} ${divToPx(0).toFixed(1)} ` +
    `L ${thetaToPx(DIV_MAX).toFixed(1)} ${divToPx(DIV_MAX).toFixed(1)}`;

  const thetaMark = 4;
  const xMarkBottom = thetaToPx(thetaMark);

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 460"
        width="100%"
        role="img"
        aria-label="JS divergence vs Wasserstein distance for two distributions with disjoint support"
        style={{ display: 'block' }}
      >
        {/* ─── Top panel: distributions on a line ─── */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          Two distributions with disjoint support
        </text>

        {/* Data axis */}
        <line x1={TOP_X0} y1={TOP_AXIS_Y} x2={TOP_X1} y2={TOP_AXIS_Y}
              stroke={C.border} strokeWidth="1.2" />

        {/* P_data bump (muted grey) */}
        <path d={bumpPath(cxData, sigmaPx, bumpHeight, TOP_AXIS_Y)}
              fill="none" stroke={C.muted2} strokeWidth="1.6" />
        <text x={cxData} y={TOP_BUMP_TOP - 6} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}>
          P_data
        </text>

        {/* P_g bump (teal) */}
        <path d={bumpPath(cxG, sigmaPx, bumpHeight, TOP_AXIS_Y)}
              fill="none" stroke={C.accent} strokeWidth="1.7" />
        <text x={cxG} y={TOP_BUMP_TOP - 6} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.accent}>
          P_g
        </text>

        {/* θ measurement: bracket between the two means */}
        <g>
          <line x1={cxData} y1={TOP_AXIS_Y + 14} x2={cxData} y2={TOP_AXIS_Y + 20}
                stroke={C.muted} strokeWidth="0.9" />
          <line x1={cxG} y1={TOP_AXIS_Y + 14} x2={cxG} y2={TOP_AXIS_Y + 20}
                stroke={C.muted} strokeWidth="0.9" />
          <line x1={cxData} y1={TOP_AXIS_Y + 17} x2={cxG} y2={TOP_AXIS_Y + 17}
                stroke={C.muted} strokeWidth="0.9" />
          <text x={(cxData + cxG) / 2} y={TOP_AXIS_Y + 32} textAnchor="middle"
                fontFamily={mono} fontSize="11" fill={C.muted}>
            θ = 4 (separation)
          </text>
        </g>

        {/* Divider between top and bottom */}
        <line x1={40} y1={200} x2={600} y2={200}
              stroke={C.border} strokeWidth="0.6" strokeDasharray="2,3" />

        {/* ─── Bottom panel: divergence curves ─── */}
        <text x="320" y="216" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          Divergence as a function of separation θ
        </text>

        {/* Axes */}
        <line x1={BOT_X0} y1={BOT_Y1} x2={BOT_X1} y2={BOT_Y1}
              stroke={C.border} strokeWidth="1.5" />
        <line x1={BOT_X0} y1={BOT_Y0} x2={BOT_X0} y2={BOT_Y1}
              stroke={C.border} strokeWidth="1.5" />

        {/* X ticks */}
        {[0, 2, 4, 6, 8, 10].map(t => (
          <g key={t}>
            <line x1={thetaToPx(t)} y1={BOT_Y1} x2={thetaToPx(t)} y2={BOT_Y1 + 4}
                  stroke={C.border} strokeWidth="1" />
            <text x={thetaToPx(t)} y={BOT_Y1 + 16} textAnchor="middle"
                  fontFamily={mono} fontSize="10" fill={C.muted}>
              {t}
            </text>
          </g>
        ))}
        <text x={(BOT_X0 + BOT_X1) / 2} y={BOT_Y1 + 34} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted}>
          θ — distance between distribution centers
        </text>

        {/* Y-axis label */}
        <text x={26} y={(BOT_Y0 + BOT_Y1) / 2} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted}
              transform={`rotate(-90 26 ${(BOT_Y0 + BOT_Y1) / 2})`}>
          divergence value
        </text>

        {/* log(2) gridline */}
        <line x1={BOT_X0} y1={divToPx(log2)} x2={BOT_X1} y2={divToPx(log2)}
              stroke={C.muted} strokeWidth="0.7" strokeDasharray="2,3" opacity="0.5" />
        <text x={BOT_X0 - 6} y={divToPx(log2) + 3} textAnchor="end"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          log 2
        </text>

        {/* JS curve (muted grey) */}
        <path d={jsPath} fill="none"
              stroke={C.muted2} strokeWidth="1.6"
              strokeDasharray="5,4" opacity="0.85" />

        {/* Wasserstein curve (teal) */}
        <path d={wsPath} fill="none"
              stroke={C.accent} strokeWidth="1.8" />

        {/* θ = 4 mark on both curves */}
        <line x1={xMarkBottom} y1={BOT_Y0} x2={xMarkBottom} y2={BOT_Y1}
              stroke={C.muted2} strokeWidth="0.9" strokeDasharray="3,4" opacity="0.55" />
        <text x={xMarkBottom} y={BOT_Y0 - 4} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          θ = 4
        </text>
        {/* Points where curves cross θ=4 */}
        <circle cx={xMarkBottom} cy={divToPx(log2)} r="3.2"
                fill={C.muted2} />
        <circle cx={xMarkBottom} cy={divToPx(4)} r="3.4"
                fill={C.accent} />

        {/* Annotations */}
        <text x={thetaToPx(7.2)} y={divToPx(log2) - 8}
              fontFamily={sans} fontSize="10.5" fill={C.muted2}>
          JS is constant for disjoint distributions
        </text>
        <text x={thetaToPx(7.2)} y={divToPx(log2) + 5}
              fontFamily={sans} fontSize="10.5" fill={C.muted2}>
          — no gradient signal
        </text>

        <text x={thetaToPx(0.5)} y={divToPx(4.2) + 4}
              fontFamily={sans} fontSize="10.5" fill={C.accent}>
          Wasserstein grows smoothly
        </text>
        <text x={thetaToPx(0.5)} y={divToPx(4.2) + 17}
              fontFamily={sans} fontSize="10.5" fill={C.accent}>
          — useful gradient
        </text>

        {/* Legend bottom right */}
        <g>
          <line x1={420} y1={428} x2={448} y2={428}
                stroke={C.muted2} strokeWidth="1.5"
                strokeDasharray="5,4" opacity="0.85" />
          <text x={454} y={432} fontFamily={mono} fontSize="10" fill={C.muted}>
            JS
          </text>
          <line x1={490} y1={428} x2={518} y2={428}
                stroke={C.accent} strokeWidth="1.8" />
          <text x={524} y={432} fontFamily={mono} fontSize="10" fill={C.text}>
            Wasserstein-1
          </text>
        </g>
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
        When distributions have disjoint support, JS divergence is constant and
        provides no gradient — Wasserstein distance scales smoothly with
        separation, giving the generator a usable training signal.
      </figcaption>
    </figure>
  );
}
