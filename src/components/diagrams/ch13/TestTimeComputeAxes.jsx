const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const W = 640;
const H = 380;

const PANEL_W = 260;
const PANEL_H = 220;
const PANEL_Y = 66;
const PANEL_X = [40, 340];

// Schematic concave (log-linear-ish) curve, computed rather than hand-drawn —
// not measured data, just a smooth diminishing-returns shape for illustration.
function curvePoints(x0, y0, x1, y1, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // 1 - e^{-kt} normalized to [0,1] — concave, log-linear in feel.
    const k = 3.2;
    const raw = 1 - Math.exp(-k * t);
    const norm = raw / (1 - Math.exp(-k));
    const x = x0 + t * (x1 - x0);
    const y = y0 - norm * (y0 - y1);
    pts.push([x, y]);
  }
  return pts;
}

function Panel({ x, title, sub, curveColor }) {
  const axX0 = x + 34;
  const axX1 = x + PANEL_W - 14;
  const axY0 = PANEL_Y + PANEL_H - 34;
  const axY1 = PANEL_Y + 30;

  const pts = curvePoints(axX0, axY0, axX1, axY1);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  return (
    <g>
      <rect
        x={x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="6"
        fill={C.bg2} stroke={C.border} strokeWidth="1"
      />
      <text x={x + PANEL_W / 2} y={PANEL_Y + 22} textAnchor="middle"
            fontFamily={mono} fontSize="12" fontWeight="500" fill={C.text}>
        {title}
      </text>

      {/* axes */}
      <line x1={axX0} y1={axY0} x2={axX1} y2={axY0} stroke={C.borderLt} strokeWidth="1.3" />
      <line x1={axX0} y1={axY0} x2={axX0} y2={axY1 - 6} stroke={C.borderLt} strokeWidth="1.3" />

      {/* curve */}
      <path d={path} fill="none" stroke={curveColor} strokeWidth="2.2" />

      {/* axis labels */}
      <text x={(axX0 + axX1) / 2} y={axY0 + 20} textAnchor="middle"
            fontFamily={mono} fontSize="9.5" fill={C.muted}>
        {sub} (log) →
      </text>
      <text x={axX0 - 10} y={(axY0 + axY1) / 2} textAnchor="middle"
            fontFamily={mono} fontSize="9.5" fill={C.muted}
            transform={`rotate(-90 ${axX0 - 10} ${(axY0 + axY1) / 2})`}>
        accuracy →
      </text>
    </g>
  );
}

export default function TestTimeComputeAxes() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Two independent compute axes: train-time compute and test-time compute both improve accuracy"
        style={{ display: 'block' }}
      >
        <text x={W / 2} y={28} textAnchor="middle" fontFamily={mono} fontSize="11"
              fill={C.muted} letterSpacing="0.05em">
          TWO WAYS TO BUY ACCURACY
        </text>

        <Panel
          x={PANEL_X[0]}
          title="train-time compute"
          sub="RL training compute"
          curveColor={C.muted2}
        />
        <Panel
          x={PANEL_X[1]}
          title="test-time compute"
          sub="reasoning tokens / query"
          curveColor={C.accent}
        />

        <text x={PANEL_X[0] + PANEL_W / 2} y={PANEL_Y + PANEL_H + 26} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2} fontStyle="italic">
          bigger model, more RL steps
        </text>
        <text x={PANEL_X[1] + PANEL_W / 2} y={PANEL_Y + PANEL_H + 26} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2} fontStyle="italic">
          same weights, longer reasoning trace
        </text>

        <text x={W / 2} y={H - 18} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>
          each axis trades a different kind of compute for the same accuracy gain
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
        Schematic, not measured data: OpenAI's o1 report shows accuracy improving
        roughly log-linearly along train-time and test-time compute independently —
        a fixed model can be made more accurate by letting it reason longer at
        inference, without any further training.
      </figcaption>
    </figure>
  );
}
