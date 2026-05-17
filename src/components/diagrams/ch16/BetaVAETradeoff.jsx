const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.16)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Plot area
const PX_L = 80;    // left x
const PX_R = 560;   // right x
const PY_T = 60;    // top y
const PY_B = 230;   // bottom y (axis)

// β ticks (linear in plot space, labeled with the actual values)
const BETA_TICKS = [
  { label: '0.5',  pos: 0.00 },
  { label: '1',    pos: 0.18 },
  { label: '5',    pos: 0.42 },
  { label: '10',   pos: 0.58 },
  { label: '100',  pos: 1.00 },
];

// Map fractional position (0..1) to plot x
const X = (frac) => PX_L + frac * (PX_R - PX_L);
// Map fractional value (0..1, where 1 = top) to plot y
const Y = (frac) => PY_B - frac * (PY_B - PY_T);

// Reconstruction curve points (decreasing): list of [frac_x, frac_quality]
const RECON_PTS = [
  [0.00, 0.92],
  [0.10, 0.90],
  [0.18, 0.87],
  [0.30, 0.78],
  [0.42, 0.66],
  [0.50, 0.55],
  [0.58, 0.45],
  [0.70, 0.30],
  [0.85, 0.18],
  [1.00, 0.10],
];

// Disentanglement curve (rise then fall, peak around β=4–10)
const DIS_PTS = [
  [0.00, 0.10],
  [0.10, 0.18],
  [0.18, 0.32],
  [0.30, 0.55],
  [0.42, 0.78],
  [0.50, 0.84],
  [0.58, 0.78],
  [0.70, 0.55],
  [0.85, 0.28],
  [1.00, 0.12],
];

function smoothPath(pts) {
  if (pts.length === 0) return '';
  let d = `M ${X(pts[0][0])} ${Y(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [fx, fy] = pts[i];
    const [px, py] = pts[i - 1];
    const cx1 = X(px) + (X(fx) - X(px)) * 0.5;
    const cy1 = Y(py);
    const cx2 = X(px) + (X(fx) - X(px)) * 0.5;
    const cy2 = Y(fy);
    d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${X(fx)} ${Y(fy)}`;
  }
  return d;
}

export default function BetaVAETradeoff() {
  // Region band x ranges (fractional)
  const REGIONS = [
    { x0: 0.00, x1: 0.16, label: 'under-regularized',  sub: 'entangled, sharp',
      fill: 'rgba(255,255,255,0.025)' },
    { x0: 0.30, x1: 0.62, label: 'sweet spot',          sub: 'disentangled, usable',
      fill: 'rgba(45,212,191,0.10)', highlight: true },
    { x0: 0.78, x1: 1.00, label: 'over-regularized',   sub: 'posterior collapse',
      fill: 'rgba(248,113,113,0.06)' },
  ];

  // Recon-asymptote callout position (right end)
  const reconCalloutX = X(0.95);
  const reconCalloutY = Y(0.12);

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="β-VAE trade-off between reconstruction quality and disentanglement"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="bv-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* ── Title ────────────────────────────────────── */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={sans} fontSize="12" fill={C.text}
              fontStyle="italic">
          β controls a trade-off between reconstruction and disentanglement
        </text>

        {/* ── Shaded region bands ─────────────────────── */}
        {REGIONS.map((r, i) => (
          <rect key={`reg-${i}`}
                x={X(r.x0)} y={PY_T}
                width={X(r.x1) - X(r.x0)} height={PY_B - PY_T}
                fill={r.fill}
                stroke={r.highlight ? C.accent : 'none'}
                strokeWidth={r.highlight ? '1' : '0'}
                strokeDasharray={r.highlight ? '3 3' : ''}
          />
        ))}

        {/* ── Axes ────────────────────────────────────── */}
        {/* x axis */}
        <line x1={PX_L} y1={PY_B} x2={PX_R} y2={PY_B}
              stroke={C.borderLt} strokeWidth="1" />
        {/* left y axis */}
        <line x1={PX_L} y1={PY_T} x2={PX_L} y2={PY_B}
              stroke={C.borderLt} strokeWidth="1" />
        {/* right y axis */}
        <line x1={PX_R} y1={PY_T} x2={PX_R} y2={PY_B}
              stroke={C.borderLt} strokeWidth="1" />

        {/* y-axis ticks: bottom and top markers, on both sides */}
        <text x={PX_L - 8} y={PY_T + 4} textAnchor="end"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          high
        </text>
        <text x={PX_L - 8} y={PY_B} textAnchor="end"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          low
        </text>
        <text x={PX_R + 8} y={PY_T + 4} textAnchor="start"
              fontFamily={mono} fontSize="9" fill={C.accent}>
          high
        </text>
        <text x={PX_R + 8} y={PY_B} textAnchor="start"
              fontFamily={mono} fontSize="9" fill={C.accent}>
          low
        </text>

        {/* y axis labels — vertical (rotated) */}
        <text
          transform={`rotate(-90 ${PX_L - 38} ${(PY_T + PY_B) / 2})`}
          x={PX_L - 38} y={(PY_T + PY_B) / 2}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          reconstruction quality
        </text>
        <text
          transform={`rotate(-90 ${PX_R + 38} ${(PY_T + PY_B) / 2})`}
          x={PX_R + 38} y={(PY_T + PY_B) / 2}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5" fill={C.accent}>
          disentanglement score
        </text>

        {/* x-axis ticks */}
        {BETA_TICKS.map((t, i) => (
          <g key={`tick-${i}`}>
            <line x1={X(t.pos)} y1={PY_B}
                  x2={X(t.pos)} y2={PY_B + 4}
                  stroke={C.borderLt} strokeWidth="1" />
            <text x={X(t.pos)} y={PY_B + 16} textAnchor="middle"
                  fontFamily={mono} fontSize="10" fill={C.text}>
              {t.label}
            </text>
          </g>
        ))}
        <text x={(PX_L + PX_R) / 2} y={PY_B + 32} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}>
          β value
        </text>

        {/* ── Reconstruction curve (muted, decreasing) ─── */}
        <path d={smoothPath(RECON_PTS)}
              fill="none" stroke={C.muted2} strokeWidth="1.6" />

        {/* Reconstruction asymptote callout */}
        <line x1={reconCalloutX - 16} y1={reconCalloutY - 4}
              x2={reconCalloutX - 38} y2={reconCalloutY - 22}
              stroke={C.muted} strokeWidth="0.9"
              strokeDasharray="2 3" />
        <text x={reconCalloutX - 40} y={reconCalloutY - 26}
              textAnchor="end"
              fontFamily={sans} fontSize="10" fill={C.muted}
              fontStyle="italic">
          samples blur out
        </text>

        {/* ── Disentanglement curve (teal, peak around β≈5) ─── */}
        <path d={smoothPath(DIS_PTS)}
              fill="none" stroke={C.accent} strokeWidth="1.7" />

        {/* peak marker */}
        <circle cx={X(0.50)} cy={Y(0.84)} r="3.2"
                fill={C.accent} />
        <line x1={X(0.50)} y1={Y(0.84) - 6}
              x2={X(0.50) + 30} y2={Y(0.84) - 30}
              stroke={C.accent} strokeWidth="0.9"
              strokeDasharray="2 3" />
        <text x={X(0.50) + 34} y={Y(0.84) - 30}
              fontFamily={mono} fontSize="10" fill={C.accent}>
          peak ≈ β 4–10
        </text>

        {/* ── Legend (top-left, inside plot) ──────────── */}
        <g transform={`translate(${PX_L + 12} ${PY_T + 8})`}>
          <line x1="0" y1="0" x2="14" y2="0"
                stroke={C.muted2} strokeWidth="1.6" />
          <text x="20" y="3" fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            reconstruction
          </text>
          <line x1="0" y1="14" x2="14" y2="14"
                stroke={C.accent} strokeWidth="1.7" />
          <text x="20" y="17" fontFamily={mono} fontSize="9.5" fill={C.accent}>
            disentanglement
          </text>
        </g>

        {/* ── Region labels (below the plot in the band area) ── */}
        {REGIONS.map((r, i) => {
          const cx = (X(r.x0) + X(r.x1)) / 2;
          const labelColor = r.highlight ? C.accent : C.muted;
          return (
            <g key={`reglab-${i}`}>
              <text x={cx} y={PY_T - 26} textAnchor="middle"
                    fontFamily={mono} fontSize="10" fill={labelColor}>
                {r.label}
              </text>
              <text x={cx} y={PY_T - 12} textAnchor="middle"
                    fontFamily={sans} fontSize="9.5" fill={r.highlight ? C.muted2 : C.muted}
                    fontStyle="italic">
                {r.sub}
              </text>
            </g>
          );
        })}

        {/* ── Bottom annotation ───────────────────────── */}
        <text x="320" y="290" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}
              fontStyle="italic">
          disentanglement is empirical, not guaranteed —
        </text>
        <text x="320" y="305" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}
              fontStyle="italic">
          Locatello et al. 2019 showed it requires inductive bias
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
        β-VAE trades reconstruction fidelity for latent-space structure; the
        disentanglement sweet spot exists empirically but isn't guaranteed by
        the objective.
      </figcaption>
    </figure>
  );
}
