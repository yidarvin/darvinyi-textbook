const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Geometry
const ROW_Y    = 110;          // vertical center of the pipeline
const LIN_W    = 64;
const LIN_H    = 40;
const SIGMA_R  = 16;
const GAP      = 22;           // gap between linear box and σ circle (and successor)
const BLOCK_W  = LIN_W + GAP + SIGMA_R * 2 + GAP;  // 64 + 22 + 32 + 22 = 140

// Input glyph
const INPUT_X  = 16;
const INPUT_W  = 40;
const INPUT_H  = 56;
const INPUT_Y  = ROW_Y - INPUT_H / 2;

// First block start
const BLOCK_X0 = INPUT_X + INPUT_W + GAP;  // 16 + 40 + 22 = 78

// Output glyph
const OUT_W    = 40;
const OUT_H    = 40;
const OUT_X    = BLOCK_X0 + BLOCK_W * 3 + GAP;     // 78 + 420 + 22 = 520
const OUT_Y    = ROW_Y - OUT_H / 2;

function LinearBox({ x, ell }) {
  return (
    <g>
      <rect
        x={x}
        y={ROW_Y - LIN_H / 2}
        width={LIN_W}
        height={LIN_H}
        rx="4"
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1.5"
      />
      <text
        x={x + LIN_W / 2}
        y={ROW_Y + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={C.text}
      >
        W{ell}·+b{ell}
      </text>
    </g>
  );
}

function SigmaCircle({ cx, highlight }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={ROW_Y}
        r={SIGMA_R}
        fill={highlight ? '#0b2422' : C.bg2}
        stroke={highlight ? C.accent : C.border}
        strokeWidth="1.5"
      />
      <text
        x={cx}
        y={ROW_Y + 5}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="13"
        fill={highlight ? C.accent : C.text}
      >
        σ
      </text>
    </g>
  );
}

// Superscript ell strings as unicode for compactness inside SVG
const ELL = ['⁽¹⁾', '⁽²⁾', '⁽³⁾'];

export default function ForwardPassSchematic() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 200"
        width="100%"
        role="img"
        aria-label="Forward pass: chain of linear and nonlinear blocks"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="fp-arr"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
        </defs>

        {/* Input glyph: a small column of dots inside a rounded rectangle */}
        <rect
          x={INPUT_X}
          y={INPUT_Y}
          width={INPUT_W}
          height={INPUT_H}
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        {[0, 1, 2, 3].map(i => (
          <circle
            key={i}
            cx={INPUT_X + INPUT_W / 2}
            cy={INPUT_Y + 12 + i * 11}
            r="2.2"
            fill={C.muted}
          />
        ))}
        <text
          x={INPUT_X + INPUT_W / 2}
          y={INPUT_Y + INPUT_H + 18}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          x ∈ ℝᵈ
        </text>

        {/* Arrow: input → first linear box */}
        <line
          x1={INPUT_X + INPUT_W}
          y1={ROW_Y}
          x2={BLOCK_X0 - 2}
          y2={ROW_Y}
          stroke={C.muted}
          strokeWidth="1.5"
          markerEnd="url(#fp-arr)"
        />

        {/* Three (linear, nonlinear) blocks */}
        {[0, 1, 2].map(i => {
          const blockX = BLOCK_X0 + i * BLOCK_W;
          const linEndX = blockX + LIN_W;
          const sigmaCx = linEndX + GAP + SIGMA_R;
          const sigmaEndX = sigmaCx + SIGMA_R;
          const nextStartX = sigmaEndX + GAP;
          // last block's a^(L) arrow goes to OUT_X - 2
          const aTargetX = (i === 2) ? OUT_X - 2 : nextStartX - 2;
          // Highlight the middle σ in teal
          const isHi = (i === 1);
          return (
            <g key={i}>
              <LinearBox x={blockX} ell={ELL[i]} />
              {/* z^(ℓ) arrow: linear → sigma */}
              <line
                x1={linEndX}
                y1={ROW_Y}
                x2={sigmaCx - SIGMA_R - 1}
                y2={ROW_Y}
                stroke={C.muted}
                strokeWidth="1.5"
                markerEnd="url(#fp-arr)"
              />
              <text
                x={(linEndX + sigmaCx - SIGMA_R) / 2}
                y={ROW_Y - 8}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.muted}
              >
                z{ELL[i]}
              </text>
              <SigmaCircle cx={sigmaCx} highlight={isHi} />
              {/* a^(ℓ) arrow: sigma → next block (or output) */}
              <line
                x1={sigmaEndX}
                y1={ROW_Y}
                x2={aTargetX}
                y2={ROW_Y}
                stroke={C.muted}
                strokeWidth="1.5"
                markerEnd="url(#fp-arr)"
              />
              <text
                x={(sigmaEndX + aTargetX) / 2}
                y={ROW_Y - 8}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.muted}
              >
                a{ELL[i]}
              </text>
            </g>
          );
        })}

        {/* Output glyph */}
        <rect
          x={OUT_X}
          y={OUT_Y}
          width={OUT_W}
          height={OUT_H}
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={OUT_X + OUT_W / 2}
          y={ROW_Y + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          ŷ
        </text>
        <text
          x={OUT_X + OUT_W / 2}
          y={OUT_Y + OUT_H + 18}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          ŷ ∈ ℝᵏ
        </text>

        {/* Bracket spanning the three blocks: "L layers" */}
        {(() => {
          const bX1 = BLOCK_X0;
          const bX2 = BLOCK_X0 + BLOCK_W * 3 - GAP;
          const bY  = ROW_Y - 44;
          return (
            <g>
              <path
                d={`M ${bX1} ${bY + 6} L ${bX1} ${bY} L ${bX2} ${bY} L ${bX2} ${bY + 6}`}
                stroke={C.muted}
                strokeWidth="1"
                fill="none"
              />
              <text
                x={(bX1 + bX2) / 2}
                y={bY - 6}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={C.muted}
              >
                L layers
              </text>
            </g>
          );
        })()}
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
        The forward pass is a chain of (linear, nonlinear) pairs — composition is
        where depth's power comes from.
      </figcaption>
    </figure>
  );
}
