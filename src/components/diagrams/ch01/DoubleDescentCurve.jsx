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

// Plot bounds
const X0 = 70;     // left
const X1 = 610;    // right
const Y0 = 50;     // top (high error)
const Y1 = 320;    // bottom (low error)
const X_THRESH = 410;   // interpolation threshold x

export default function DoubleDescentCurve() {
  // Classical U-curve: starts low-mid, descends to sweet spot, then climbs steadily.
  const classicalPath =
    `M ${X0} 215 ` +
    `C 130 270, 180 290, 230 290 ` +
    `C 290 285, 330 240, 360 180 ` +
    `C 390 115, 430 80, 480 65 ` +
    `L 560 55`;

  // Modern double-descent: matches classical through the U, climbs sharply to a
  // peak at the interpolation threshold, then descends in the overparam regime.
  const modernPath =
    `M ${X0} 215 ` +
    `C 130 270, 180 290, 230 290 ` +
    `C 290 285, 330 245, 360 195 ` +
    `C 385 145, 400 95, ${X_THRESH} 65 ` +
    `C 425 110, 450 150, 480 185 ` +
    `C 520 225, 560 260, ${X1} 270`;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 400"
        width="100%"
        role="img"
        aria-label="Double-descent test-error curve vs model complexity"
        style={{ display: 'block' }}
      >
        {/* Axes */}
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke={C.border} strokeWidth="1.5" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke={C.border} strokeWidth="1.5" />

        {/* Y-axis label */}
        <text
          x={20}
          y={(Y0 + Y1) / 2}
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
          transform={`rotate(-90 20 ${(Y0 + Y1) / 2})`}
          textAnchor="middle"
        >
          test error
        </text>

        {/* X-axis label */}
        <text
          x={(X0 + X1) / 2}
          y={385}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          model complexity
        </text>

        {/* Interpolation threshold vertical */}
        <line
          x1={X_THRESH}
          y1={Y0}
          x2={X_THRESH}
          y2={Y1}
          stroke={C.accent}
          strokeWidth="1"
          strokeDasharray="3,4"
          opacity="0.55"
        />
        <text
          x={X_THRESH}
          y={Y0 - 8}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.accent}
        >
          interpolation threshold
        </text>

        {/* Classical U-curve (dashed muted) */}
        <path
          d={classicalPath}
          fill="none"
          stroke={C.muted2}
          strokeWidth="1.5"
          strokeDasharray="5,4"
          opacity="0.75"
        />

        {/* Modern double-descent (teal solid) */}
        <path
          d={modernPath}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.8"
        />

        {/* Regime brackets just below the x-axis */}
        {(() => {
          const REGIMES = [
            { x0: X0, x1: 230, label: 'underfitting' },
            { x0: 230, x1: X_THRESH, label: 'classical overfitting' },
            { x0: X_THRESH, x1: X1, label: 'modern overparameterization' },
          ];
          const Y_BR = Y1 + 12;
          const Y_TX = Y1 + 32;
          return REGIMES.map((r, i) => (
            <g key={i}>
              <line x1={r.x0 + 4} y1={Y_BR} x2={r.x1 - 4} y2={Y_BR} stroke={C.muted} strokeWidth="1" />
              <line x1={r.x0 + 4} y1={Y_BR - 3} x2={r.x0 + 4} y2={Y_BR + 3} stroke={C.muted} strokeWidth="1" />
              <line x1={r.x1 - 4} y1={Y_BR - 3} x2={r.x1 - 4} y2={Y_BR + 3} stroke={C.muted} strokeWidth="1" />
              <text
                x={(r.x0 + r.x1) / 2}
                y={Y_TX}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.muted}
              >
                {r.label}
              </text>
            </g>
          ));
        })()}

        {/* Legend, top-right */}
        <g>
          <line x1={420} y1={Y0 + 18} x2={448} y2={Y0 + 18} stroke={C.muted2} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.75" />
          <text x={454} y={Y0 + 22} fontFamily={mono} fontSize="10.5" fill={C.muted}>classical U</text>
          <line x1={420} y1={Y0 + 36} x2={448} y2={Y0 + 36} stroke={C.accent} strokeWidth="1.8" />
          <text x={454} y={Y0 + 40} fontFamily={mono} fontSize="10.5" fill={C.text}>Belkin et al., 2019</text>
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
        Past the interpolation threshold — the point where the model fits training
        data exactly — test error can decrease again in the overparameterized regime.
      </figcaption>
    </figure>
  );
}
