const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.10)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Activation grid — small 4x4 with numeric values
function ActivationGrid({ x, y, cell = 14, values, fill = C.bg3, stroke = C.borderLt }) {
  const rows = values.length;
  const cols = values[0].length;
  return (
    <g>
      <rect x={x - 2} y={y - 2}
            width={cols * cell + 4} height={rows * cell + 4}
            rx="3" fill={fill} stroke={stroke} strokeWidth="1" />
      {values.map((row, ri) =>
        row.map((v, ci) => (
          <g key={`a-${ri}-${ci}`}>
            <rect x={x + ci * cell} y={y + ri * cell}
                  width={cell} height={cell}
                  fill={C.bg2} stroke={C.border} strokeWidth="0.5" />
            <text x={x + ci * cell + cell / 2}
                  y={y + ri * cell + cell - 4}
                  textAnchor="middle"
                  fontFamily={mono} fontSize="7.5"
                  fill={C.muted2}>
              {v.toFixed(1)}
            </text>
          </g>
        ))
      )}
    </g>
  );
}

// Semantic mask grid — colored cells (class index)
function MaskGrid({ x, y, cell = 14, classes }) {
  // Map class index to a palette color
  const palette = {
    0: '#3a4f7a', // sky-ish dark blue
    1: '#3f6f44', // grass green
    2: '#7a4a2a', // road brown
    3: '#5a5a5a', // building grey
    4: '#704080', // tree-purple
  };
  const rows = classes.length;
  const cols = classes[0].length;
  return (
    <g>
      <rect x={x - 2} y={y - 2}
            width={cols * cell + 4} height={rows * cell + 4}
            rx="3" fill={C.bg3} stroke={C.accent} strokeWidth="1" />
      {classes.map((row, ri) =>
        row.map((cls, ci) => (
          <rect key={`m-${ri}-${ci}`}
                x={x + ci * cell} y={y + ri * cell}
                width={cell} height={cell}
                fill={palette[cls] ?? C.muted2}
                stroke={C.border} strokeWidth="0.4" />
        ))
      )}
    </g>
  );
}

// gamma/beta spatial grid — 4x4 colored intensity grid (continuous)
function ParamGrid({ x, y, cell = 14, values, accent = false }) {
  const rows = values.length;
  const cols = values[0].length;
  const stroke = accent ? C.accent : C.borderLt;
  return (
    <g>
      <rect x={x - 2} y={y - 2}
            width={cols * cell + 4} height={rows * cell + 4}
            rx="3" fill={C.bg3} stroke={stroke} strokeWidth="1" />
      {values.map((row, ri) =>
        row.map((v, ci) => {
          const a = Math.max(0.12, Math.min(0.9, v / 2 + 0.4));
          return (
            <g key={`g-${ri}-${ci}`}>
              <rect x={x + ci * cell} y={y + ri * cell}
                    width={cell} height={cell}
                    fill={accent
                      ? `rgba(45,212,191,${a})`
                      : `rgba(148,163,184,${a})`}
                    stroke={C.border} strokeWidth="0.4" />
              <text x={x + ci * cell + cell / 2}
                    y={y + ri * cell + cell - 4}
                    textAnchor="middle"
                    fontFamily={mono} fontSize="7.5"
                    fill={C.text}>
                {v.toFixed(1)}
              </text>
            </g>
          );
        })
      )}
    </g>
  );
}

export default function SPADEBlock() {
  // Sample activations y (4x4)
  const yVals = [
    [0.2, -0.3, 1.1, 0.4],
    [-0.5, 0.7, 0.2, -0.8],
    [0.9, 0.1, -0.4, 0.6],
    [0.3, -0.7, 0.5, 0.2],
  ];

  // Semantic mask: top row sky (0), middle building (3), bottom grass (1)
  const mask = [
    [0, 0, 0, 0],
    [3, 3, 3, 0],
    [3, 3, 3, 1],
    [1, 1, 1, 1],
  ];

  // Predicted γ(M) and β(M) — synthetic spatial maps
  const gammaMap = [
    [1.1, 1.0, 1.0, 1.1],
    [0.7, 0.8, 0.8, 1.0],
    [0.7, 0.8, 0.8, 1.3],
    [1.3, 1.4, 1.3, 1.3],
  ];
  const betaMap = [
    [0.2, 0.1, 0.1, 0.2],
    [-0.3, -0.2, -0.2, 0.1],
    [-0.3, -0.2, -0.2, 0.4],
    [0.4, 0.5, 0.4, 0.4],
  ];

  // SPADE output — exactly γ(M)·y_normed + β(M), cell by cell, so the
  // diagram's numbers are internally consistent (y_normed = yVals × 0.9,
  // rounded to 2 places before applying gammaMap/betaMap, then to 1 place
  // for display, matching what's actually rendered above).
  const outVals = [
    [0.4, -0.2, 1.1, 0.6],
    [-0.6, 0.3, -0.1, -0.6],
    [0.3, -0.1, -0.5, 1.1],
    [0.8, -0.4, 1.0, 0.6],
  ];

  // Layout
  const GRID_CELL = 14;
  // y input
  const yX = 40, yY = 64;
  // mask input
  const mX = 40, mY = 220;
  // BN box
  const bnX = 165, bnY = 60, bnW = 100, bnH = 56;
  // y_normed grid
  const ynX = 305, ynY = 64;
  // ConvNet box
  const cnX = 165, cnY = 216, cnW = 100, cnH = 56;
  // gamma / beta grids — stacked vertically, right of convnet
  const gX = 305, gY = 192;
  const bX = 305, bY = 266;
  // Multiply / add ops
  const mulX = 432, mulY = 124;
  const addX = 466, addY = 124;
  // Output
  const outX = 510, outY = 64;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 380"
        width="100%"
        role="img"
        aria-label="The SPADE block — spatially-adaptive denormalization with γ and β predicted from the semantic mask"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="sp-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="sp-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="20" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          SPADE block — γ and β predicted per-pixel from the semantic mask
        </text>

        {/* ── INPUT: activation y ─────────────────────── */}
        <text x={yX + 28} y={yY - 10} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          y
        </text>
        <text x={yX + 28} y={yY - 24} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          activation
        </text>
        <ActivationGrid x={yX} y={yY} cell={GRID_CELL} values={yVals} />

        {/* Arrow y → BN */}
        <line x1={yX + 4 * GRID_CELL + 6} y1={yY + 2 * GRID_CELL}
              x2={bnX - 2} y2={bnY + bnH / 2}
              stroke={C.muted2} strokeWidth="1"
              markerEnd="url(#sp-arrow)" />

        {/* BN box */}
        <rect x={bnX} y={bnY} width={bnW} height={bnH} rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1.3" />
        <text x={bnX + bnW / 2} y={bnY + 22} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          BatchNorm
        </text>
        <text x={bnX + bnW / 2} y={bnY + 40} textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted2}>
          (y − μ) / σ
        </text>

        {/* Arrow BN → y_normed */}
        <line x1={bnX + bnW + 2} y1={bnY + bnH / 2}
              x2={ynX - 4} y2={ynY + 2 * GRID_CELL}
              stroke={C.muted2} strokeWidth="1"
              markerEnd="url(#sp-arrow)" />

        {/* y_normed grid */}
        <text x={ynX + 28} y={ynY - 10} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          y_normed
        </text>
        <ActivationGrid x={ynX} y={ynY} cell={GRID_CELL}
                        values={yVals.map(row => row.map(v => v * 0.9))} />

        {/* ── INPUT: semantic mask M ──────────────────── */}
        <text x={mX + 28} y={mY - 10} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.accent}>
          M
        </text>
        <text x={mX + 28} y={mY - 24} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          semantic mask
        </text>
        <MaskGrid x={mX} y={mY} cell={GRID_CELL} classes={mask} />

        {/* Arrow M → ConvNet */}
        <line x1={mX + 4 * GRID_CELL + 6} y1={mY + 2 * GRID_CELL}
              x2={cnX - 2} y2={cnY + cnH / 2}
              stroke={C.accent} strokeWidth="1"
              markerEnd="url(#sp-arrow-accent)" />

        {/* ConvNet box */}
        <rect x={cnX} y={cnY} width={cnW} height={cnH} rx="4"
              fill={C.bg2} stroke={C.accent} strokeWidth="1.3" />
        <text x={cnX + cnW / 2} y={cnY + 22} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          ConvNet
        </text>
        <text x={cnX + cnW / 2} y={cnY + 40} textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.accent}>
          2 conv layers
        </text>

        {/* Arrows ConvNet → γ and β */}
        <line x1={cnX + cnW + 2} y1={cnY + 14}
              x2={gX - 4} y2={gY + 2 * GRID_CELL}
              stroke={C.accent} strokeWidth="1"
              markerEnd="url(#sp-arrow-accent)" />
        <line x1={cnX + cnW + 2} y1={cnY + cnH - 14}
              x2={bX - 4} y2={bY + 2 * GRID_CELL}
              stroke={C.accent} strokeWidth="1"
              markerEnd="url(#sp-arrow-accent)" />

        {/* γ(M) grid */}
        <text x={gX + 28} y={gY - 6} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.accent}>
          γ(M)
        </text>
        <ParamGrid x={gX} y={gY} cell={GRID_CELL} values={gammaMap} accent />

        {/* β(M) grid */}
        <text x={bX + 28} y={bY - 6} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.accent}>
          β(M)
        </text>
        <ParamGrid x={bX} y={bY} cell={GRID_CELL} values={betaMap} accent />

        {/* ── Combination ─────────────────────────────── */}
        {/* From y_normed to mul */}
        <line x1={ynX + 4 * GRID_CELL + 6} y1={ynY + 2 * GRID_CELL}
              x2={mulX - 10} y2={mulY}
              stroke={C.muted2} strokeWidth="1"
              markerEnd="url(#sp-arrow)" />
        {/* From γ(M) up to mul */}
        <line x1={gX + 4 * GRID_CELL + 6} y1={gY + 2 * GRID_CELL}
              x2={mulX} y2={mulY + 12}
              stroke={C.accent} strokeWidth="1"
              markerEnd="url(#sp-arrow-accent)" />

        {/* Mul operator */}
        <circle cx={mulX} cy={mulY} r="10"
                fill={C.bg2} stroke={C.accent} strokeWidth="1.3" />
        <text x={mulX} y={mulY + 4} textAnchor="middle"
              fontFamily={mono} fontSize="13" fill={C.accent}>
          ⊙
        </text>

        {/* mul → add */}
        <line x1={mulX + 10} y1={mulY}
              x2={addX - 10} y2={addY}
              stroke={C.accent} strokeWidth="1"
              markerEnd="url(#sp-arrow-accent)" />

        {/* From β(M) up to add */}
        <line x1={bX + 4 * GRID_CELL + 6} y1={bY + 2 * GRID_CELL}
              x2={addX} y2={addY + 12}
              stroke={C.accent} strokeWidth="1"
              markerEnd="url(#sp-arrow-accent)" />

        {/* Add operator */}
        <circle cx={addX} cy={addY} r="10"
                fill={C.bg2} stroke={C.accent} strokeWidth="1.3" />
        <text x={addX} y={addY + 4} textAnchor="middle"
              fontFamily={mono} fontSize="13" fill={C.accent}>
          +
        </text>

        {/* Add → y_SPADE */}
        <line x1={addX + 10} y1={addY}
              x2={outX - 4} y2={outY + 2 * GRID_CELL}
              stroke={C.accent} strokeWidth="1"
              markerEnd="url(#sp-arrow-accent)" />

        {/* Output y_SPADE grid */}
        <text x={outX + 28} y={outY - 10} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.accent}>
          y_SPADE
        </text>
        <text x={outX + 28} y={outY - 24} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.accent}>
          output
        </text>
        <ActivationGrid x={outX} y={outY} cell={GRID_CELL}
                        values={outVals}
                        fill={C.accentDim} stroke={C.accent} />

        {/* Bottom comparison annotation */}
        <text x="320" y="332" textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted}>
          standard BatchNorm:  γ, β are learned scalars (1 per channel)
        </text>
        <text x="320" y="352" textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.accent}>
          SPADE:  γ(M), β(M) are 2D spatial maps — different at every pixel
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
        SPADE replaces the scalar affine parameters of standard normalization
        with spatial maps predicted from the semantic mask — keeping class
        information injected at every layer of the generator.
      </figcaption>
    </figure>
  );
}
