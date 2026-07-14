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

// Plot bounds
const X0 = 80;
const X1 = 580;
const Y0 = 60;
const Y1 = 240;
const Y_MIN = -4, Y_MAX = 4; // signed range — the two loss forms have opposite sign

const xToPx = x => X0 + x * (X1 - X0);
const yToPx = y => {
  const c = Math.min(Math.max(y, Y_MIN), Y_MAX);
  return Y1 - (c - Y_MIN) / (Y_MAX - Y_MIN) * (Y1 - Y0);
};

function buildPath(fn, xStart, xEnd, n = 220) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = xStart + (xEnd - xStart) * i / n;
    const y = fn(x);
    if (!isFinite(y)) continue;
    const cmd = i === 0 ? 'M' : 'L';
    d += `${cmd} ${xToPx(x).toFixed(1)} ${yToPx(y).toFixed(1)} `;
  }
  return d.trim();
}

export default function NonSaturatingLoss() {
  // log(1 − x) — what G actually minimizes in the original minimax game (no
  // extra negation: G minimizes the second term of V(D,G) directly). Ranges
  // from 0 at x=0 down to −∞ as x→1 — DECREASING, same direction as the
  // non-saturating curve below, just on the negative side of zero.
  const originalPath = buildPath(x => Math.log(1 - x), 0.0, 0.982);
  // −log x — non-saturating loss G minimizes (maximizes log D(G(z))).
  // Ranges from +∞ at x=0 down to 0 at x=1 — also DECREASING.
  const nonSatPath = buildPath(x => -Math.log(x), 0.018, 1.0);

  const xEq = xToPx(0.5);

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 340"
        width="100%"
        role="img"
        aria-label="Original minimax loss vs non-saturating loss as a function of D(G(z))"
        style={{ display: 'block' }}
      >
        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          Generator loss vs D(G(z)) — original minimax vs non-saturating
        </text>

        {/* Axes */}
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke={C.border} strokeWidth="1.5" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke={C.border} strokeWidth="1.5" />

        {/* X tick labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <g key={t}>
            <line x1={xToPx(t)} y1={Y1} x2={xToPx(t)} y2={Y1 + 4}
                  stroke={C.border} strokeWidth="1" />
            <text x={xToPx(t)} y={Y1 + 16} textAnchor="middle"
                  fontFamily={mono} fontSize="10" fill={C.muted}>
              {t.toFixed(t === 0 || t === 1 ? 0 : 2)}
            </text>
          </g>
        ))}
        <text x={(X0 + X1) / 2} y={Y1 + 34} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted}>
          D(G(z))  —  discriminator output on a fake sample
        </text>

        {/* Y axis label */}
        <text
          x={26}
          y={(Y0 + Y1) / 2}
          fontFamily={mono} fontSize="11" fill={C.muted}
          textAnchor="middle"
          transform={`rotate(-90 26 ${(Y0 + Y1) / 2})`}
        >
          generator loss (signed)
        </text>

        {/* Zero line — both curves are decreasing and meet 0 at opposite ends */}
        <line x1={X0} y1={yToPx(0)} x2={X1} y2={yToPx(0)}
              stroke={C.border} strokeWidth="1" strokeDasharray="2,3" opacity="0.6" />
        <text x={X0 - 6} y={yToPx(0) + 3} textAnchor="end"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          0
        </text>

        {/* Equilibrium vertical line */}
        <line x1={xEq} y1={Y0} x2={xEq} y2={Y1}
              stroke={C.muted2} strokeWidth="1" strokeDasharray="3,4" opacity="0.5" />
        <text x={xEq} y={Y0 - 8} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          equilibrium (D = 0.5)
        </text>

        {/* Original minimax — muted grey, dashed */}
        <path d={originalPath} fill="none"
              stroke={C.muted2} strokeWidth="1.6"
              strokeDasharray="5,4" opacity="0.85" />

        {/* Non-saturating — teal solid */}
        <path d={nonSatPath} fill="none"
              stroke={C.accent} strokeWidth="1.8" />

        {/* Annotation near D ≈ 0 for original (flat region, just below zero) */}
        <g>
          <line x1={xToPx(0.06)} y1={yToPx(Math.log(1 - 0.06))}
                x2={xToPx(0.20)} y2={yToPx(-1.3)}
                stroke={C.muted2} strokeWidth="0.9" />
          <text x={xToPx(0.21)} y={yToPx(-1.3) - 4}
                fontFamily={sans} fontSize="10.5" fill={C.muted2}>
            log(1 − D) — near-zero gradient
          </text>
          <text x={xToPx(0.21)} y={yToPx(-1.3) + 9}
                fontFamily={sans} fontSize="10.5" fill={C.muted2}>
            generator can't learn here
          </text>
        </g>

        {/* Annotation near D ≈ 0 for non-saturating (steep region) */}
        <g>
          <line x1={xToPx(0.06)} y1={yToPx(2.85)}
                x2={xToPx(0.18)} y2={yToPx(3.6)}
                stroke={C.accent} strokeWidth="0.9" />
          <text x={xToPx(0.19)} y={yToPx(3.6) - 1}
                fontFamily={sans} fontSize="10.5" fill={C.accent}>
            −log D — large gradient
          </text>
          <text x={xToPx(0.19)} y={yToPx(3.6) + 12}
                fontFamily={sans} fontSize="10.5" fill={C.accent}>
            generator gets a clear signal
          </text>
        </g>

        {/* Bottom annotation */}
        <text x="320" y="320" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}>
          Goodfellow 2014 introduced the non-saturating variant in the original
          GAN paper — almost every implementation uses it.
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
        The original minimax loss has near-zero gradient precisely when the
        generator is starting and the discriminator dominates — Goodfellow's
        non-saturating fix swaps the loss for one with usable gradients in
        that regime.
      </figcaption>
    </figure>
  );
}
