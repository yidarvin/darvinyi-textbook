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

// Shared axes for both panels: same θ range, same loss y-scale, so the
// rendered ΔL is directly comparable across the two.
const THETA_RANGE = [-100, 100];
const LOSS_RANGE  = [0.3, 4.0];
const DELTA_THETA = 25;

const Y_BOTTOM = 280;
const Y_TOP    = 80;

const PANEL_1 = { left: 40,  right: 300 };
const PANEL_2 = { left: 340, right: 600 };

const flatLoss  = (t) => 0.4 + 0.0003  * t * t;
const sharpLoss = (t) => 0.4 + 0.002   * t * t;

function thetaToX(theta, p) {
  const t = (theta - THETA_RANGE[0]) / (THETA_RANGE[1] - THETA_RANGE[0]);
  return p.left + t * (p.right - p.left);
}

function lossToY(loss) {
  const clamped = Math.min(Math.max(loss, LOSS_RANGE[0]), LOSS_RANGE[1]);
  const t = (clamped - LOSS_RANGE[0]) / (LOSS_RANGE[1] - LOSS_RANGE[0]);
  return Y_BOTTOM - t * (Y_BOTTOM - Y_TOP);
}

function curvePath(fn, p) {
  const N = 80;
  const cmds = [];
  for (let i = 0; i <= N; i++) {
    const theta = THETA_RANGE[0] + (i / N) * (THETA_RANGE[1] - THETA_RANGE[0]);
    const x = thetaToX(theta, p).toFixed(1);
    const y = lossToY(fn(theta)).toFixed(1);
    cmds.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }
  return cmds.join(' ');
}

function Panel({ fn, p, label, annot }) {
  const xMin  = thetaToX(0, p);
  const xPert = thetaToX(DELTA_THETA, p);
  const yMin  = lossToY(fn(0));
  const yPert = lossToY(fn(DELTA_THETA));
  const cx    = (p.left + p.right) / 2;

  return (
    <g>
      {/* x-axis baseline */}
      <line
        x1={p.left}
        y1={Y_BOTTOM}
        x2={p.right}
        y2={Y_BOTTOM}
        stroke={C.border}
        strokeWidth="1"
      />
      {/* θ-axis label tick at center */}
      <text
        x={cx}
        y={Y_BOTTOM + 14}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="10"
        fill={C.muted}
      >
        θ
      </text>

      {/* Loss curve */}
      <path
        d={curvePath(fn, p)}
        fill="none"
        stroke={C.text}
        strokeWidth="1.5"
      />

      {/* Horizontal Δθ indicator at the minimum's loss level */}
      <line
        x1={xMin}
        y1={yMin}
        x2={xPert - 1}
        y2={yMin}
        stroke={C.muted2}
        strokeWidth="1.5"
        markerEnd="url(#fvs-arr-muted)"
      />
      <text
        x={(xMin + xPert) / 2}
        y={yMin - 6}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={C.muted2}
      >
        Δθ
      </text>

      {/* Vertical ΔL indicator from minimum's loss level up to perturbed loss */}
      <line
        x1={xPert}
        y1={yMin}
        x2={xPert}
        y2={yPert + 1}
        stroke={C.muted2}
        strokeWidth="1.5"
        markerEnd="url(#fvs-arr-muted)"
      />
      <text
        x={xPert + 8}
        y={(yMin + yPert) / 2 + 3}
        fontFamily={mono}
        fontSize="11"
        fill={C.muted2}
      >
        ΔL
      </text>

      {/* Perturbed point dot */}
      <circle cx={xPert} cy={yPert} r="2.6" fill={C.text} />

      {/* Minimum (teal) */}
      <circle cx={xMin} cy={yMin} r="4" fill={C.accent} />

      {/* Panel name and consequence annotation */}
      <text
        x={cx}
        y={Y_BOTTOM + 38}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11.5"
        fill={C.text}
      >
        {label}
      </text>
      <text
        x={cx}
        y={Y_BOTTOM + 56}
        textAnchor="middle"
        fontFamily={sans}
        fontSize="11"
        fill={C.muted}
      >
        {annot}
      </text>
    </g>
  );
}

export default function FlatVsSharpMinima() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 380"
        width="100%"
        role="img"
        aria-label="Flat minimum vs sharp minimum: same parameter perturbation produces small ΔL in the flat basin, large ΔL in the sharp cusp"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="fvs-arr-muted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* Top title spanning both panels */}
        <text
          x={320}
          y={32}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11.5"
          fill={C.muted}
        >
          same Δθ, different consequence
        </text>

        {/* Faint divider between the two panels */}
        <line
          x1={320}
          y1={60}
          x2={320}
          y2={Y_BOTTOM + 62}
          stroke={C.border}
          strokeWidth="1"
          strokeDasharray="2,5"
        />

        <Panel
          fn={flatLoss}
          p={PANEL_1}
          label="Flat minimum"
          annot="small ΔL → robust"
        />
        <Panel
          fn={sharpLoss}
          p={PANEL_2}
          label="Sharp minimum"
          annot="large ΔL → brittle"
        />
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
        Flat minima absorb parameter perturbations with little loss change;
        sharp minima don't — and that asymmetry correlates with
        generalization.
      </figcaption>
    </figure>
  );
}
