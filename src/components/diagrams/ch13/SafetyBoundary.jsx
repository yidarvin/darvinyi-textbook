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

const W = 640;
const H = 410;

// Axis geometry
const AX_X0 = 50;
const AX_X1 = W - 50;
const AX_Y  = 330;

// Decision boundaries (x positions)
const X_IDEAL  = 410;
const X_OVER   = 320;   // over-refusal — too far left
const X_UNDER  = 480;   // under-refusal — too far right

// Distribution band
const BAND_Y = 130;
const BAND_H = 80;

// Example dots
const DOTS = [
  { x: 110, label: '"how do aspirin work?"', side: 'safe', anchor: 'middle' },
  { x: 270, label: '"household chemicals that are dangerous?"', side: 'safe', anchor: 'middle' },
  { x: 555, label: '"step-by-step nerve-agent synthesis"', side: 'harmful', anchor: 'end', lx: 590 },
];

export default function SafetyBoundary() {
  // Distribution band — denser in the middle. We render via vertical bars whose
  // height follows a bell curve.
  const bars = [];
  const nBars = 60;
  const sigma = 0.18;
  for (let i = 0; i < nBars; i++) {
    const t = i / (nBars - 1);
    const u = (t - 0.5) / sigma;
    const dens = Math.exp(-0.5 * u * u);
    const x = AX_X0 + t * (AX_X1 - AX_X0);
    const h = 8 + dens * (BAND_H - 8);
    bars.push({ x, h });
  }

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Calibrated safety boundary in request space"
        style={{ display: 'block' }}
      >
        {/* ── Shaded miscalibration regions ── */}
        {/* False refusals: between over-refusal line and ideal line */}
        <rect
          x={X_OVER}
          y={AX_Y - 240}
          width={X_IDEAL - X_OVER}
          height={240}
          fill={C.muted}
          opacity="0.12"
        />
        {/* False allows: between ideal line and under-refusal line */}
        <rect
          x={X_IDEAL}
          y={AX_Y - 240}
          width={X_UNDER - X_IDEAL}
          height={240}
          fill={C.muted}
          opacity="0.12"
        />

        {/* ── Distribution band ── */}
        {bars.map((b, i) => (
          <line
            key={i}
            x1={b.x}
            y1={BAND_Y + (BAND_H - b.h)}
            x2={b.x}
            y2={BAND_Y + BAND_H}
            stroke={C.muted2}
            strokeWidth="2"
            opacity="0.5"
          />
        ))}
        <text
          x={AX_X0}
          y={BAND_Y - 8}
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          request distribution (denser in the middle)
        </text>

        {/* ── Example dots & labels ── */}
        {DOTS.map((d, i) => (
          <g key={i}>
            <circle
              cx={d.x}
              cy={AX_Y - 12}
              r="5"
              fill={d.side === 'safe' ? C.muted2 : C.text}
              stroke={C.bg2}
              strokeWidth="1.5"
            />
            <text
              x={d.lx !== undefined ? d.lx : d.x}
              y={AX_Y - 24}
              textAnchor={d.anchor || 'middle'}
              fontFamily={mono}
              fontStyle="italic"
              fontSize="10"
              fill={C.muted2}
            >
              {d.label}
            </text>
          </g>
        ))}

        {/* ── Axis ── */}
        <line x1={AX_X0} y1={AX_Y} x2={AX_X1} y2={AX_Y} stroke={C.border} strokeWidth="1.5" />
        {/* Axis arrow tip */}
        <polygon
          points={`${AX_X1},${AX_Y} ${AX_X1 - 8},${AX_Y - 4} ${AX_X1 - 8},${AX_Y + 4}`}
          fill={C.border}
        />
        <text x={AX_X0} y={AX_Y + 22} fontFamily={mono} fontSize="11" fill={C.muted}>
          clearly safe
        </text>
        <text x={AX_X1} y={AX_Y + 22} textAnchor="end" fontFamily={mono} fontSize="11" fill={C.muted}>
          clearly harmful
        </text>
        <text x={(AX_X0 + AX_X1) / 2} y={AX_Y + 38} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.text}>
          request harmfulness →
        </text>

        {/* ── Boundaries ── */}
        {/* Over-refusal (dashed, muted) */}
        <line x1={X_OVER} y1={90} x2={X_OVER} y2={AX_Y} stroke={C.muted} strokeWidth="1.5" strokeDasharray="5,4" />
        <text x={X_OVER} y={80} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          over-refusal
        </text>

        {/* Under-refusal (dashed, muted) */}
        <line x1={X_UNDER} y1={90} x2={X_UNDER} y2={AX_Y} stroke={C.muted} strokeWidth="1.5" strokeDasharray="5,4" />
        <text x={X_UNDER} y={80} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          under-refusal
        </text>

        {/* Ideal (solid teal) */}
        <line x1={X_IDEAL} y1={70} x2={X_IDEAL} y2={AX_Y} stroke={C.accent} strokeWidth="2" />
        <text x={X_IDEAL} y={60} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.accent}>
          ideal boundary
        </text>

        {/* Region labels */}
        <text x={(X_OVER + X_IDEAL) / 2} y={AX_Y - 250} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted2}>
          false refusals
        </text>
        <text x={(X_OVER + X_IDEAL) / 2} y={AX_Y - 236} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          (legitimate requests declined)
        </text>
        <text x={(X_IDEAL + X_UNDER) / 2} y={AX_Y - 250} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted2}>
          false allows
        </text>
        <text x={(X_IDEAL + X_UNDER) / 2} y={AX_Y - 236} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          (harmful requests permitted)
        </text>

        {/* Bottom annotation */}
        <text x={W / 2} y={H - 16} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.muted}>
          calibration: place the line so safe dots fall left, harmful dots right
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
        Safety training places a decision boundary in request space; over-refusal
        makes the model unhelpful, under-refusal makes it unsafe — the goal is a
        sharp, well-placed line.
      </figcaption>
    </figure>
  );
}
