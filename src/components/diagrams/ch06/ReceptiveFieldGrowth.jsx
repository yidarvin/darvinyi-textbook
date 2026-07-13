const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.18)',
  accentDim2:'rgba(45,212,191,0.30)',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// 15×15 grid per panel
const N = 15;
const CELL = 9;
const GRID_SIZE = N * CELL; // 135

// Three panels centered at:
const PANEL_CX = [110, 320, 530];
const GRID_Y = 50;

function GridPanel({ cx, isShaded, label }) {
  const x0 = cx - GRID_SIZE / 2;
  return (
    <g>
      {Array.from({ length: N }).map((_, r) =>
        Array.from({ length: N }).map((__, c) => {
          const shaded = isShaded(r, c);
          return (
            <rect
              key={`${r}-${c}`}
              x={x0 + c * CELL}
              y={GRID_Y + r * CELL}
              width={CELL}
              height={CELL}
              fill={shaded ? C.accentDim2 : C.bg3}
              stroke={shaded ? C.accent : C.border}
              strokeWidth={shaded ? '0.9' : '0.5'}
            />
          );
        })
      )}
      {/* Outer border */}
      <rect
        x={x0}
        y={GRID_Y}
        width={GRID_SIZE}
        height={GRID_SIZE}
        fill="none"
        stroke={C.borderLt}
        strokeWidth="1.2"
      />
    </g>
  );
}

export default function ReceptiveFieldGrowth() {
  // Panel 1: 3×3 center shaded
  const shade1 = (r, c) => r >= 6 && r <= 8 && c >= 6 && c <= 8;
  // Panel 2: 7×7 center shaded
  const shade2 = (r, c) => r >= 4 && r <= 10 && c >= 4 && c <= 10;
  // Panel 3: nearly everything shaded (RF 31×31, larger than this 15×15 grid)
  // Leave only the four 1×1 corners unshaded to suggest "still bigger than visible"
  const shade3 = (r, c) => {
    const isCorner =
      (r === 0 && c === 0) ||
      (r === 0 && c === N - 1) ||
      (r === N - 1 && c === 0) ||
      (r === N - 1 && c === N - 1);
    return !isCorner;
  };

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="Receptive field growth: linear with depth, exponential with dilation"
        style={{ display: 'block' }}
      >
        {/* Panel titles */}
        <text x={PANEL_CX[0]} y={26} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          layer 1, 3×3 kernel
        </text>
        <text x={PANEL_CX[1]} y={26} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          layer 3, stacked 3×3
        </text>
        <text x={PANEL_CX[2]} y={26} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          layer 4, dilated 1,2,4,8
        </text>

        {/* Three grids */}
        <GridPanel cx={PANEL_CX[0]} isShaded={shade1} />
        <GridPanel cx={PANEL_CX[1]} isShaded={shade2} />
        <GridPanel cx={PANEL_CX[2]} isShaded={shade3} />

        {/* RF labels under each panel */}
        <text x={PANEL_CX[0]} y={GRID_Y + GRID_SIZE + 18}
              textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.accent}>
          RF = 3×3
        </text>
        <text x={PANEL_CX[1]} y={GRID_Y + GRID_SIZE + 18}
              textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.accent}>
          RF = 7×7
        </text>
        <text x={PANEL_CX[2]} y={GRID_Y + GRID_SIZE + 18}
              textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.accent}>
          RF = 31×31
        </text>

        {/* Sub-annotations */}
        <text x={PANEL_CX[0]} y={GRID_Y + GRID_SIZE + 33}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted}
              fontStyle="italic">
          1 layer
        </text>
        <text x={PANEL_CX[1]} y={GRID_Y + GRID_SIZE + 33}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted}
              fontStyle="italic">
          3 layers (linear)
        </text>
        <text x={PANEL_CX[2]} y={GRID_Y + GRID_SIZE + 33}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted}
              fontStyle="italic">
          4 layers (exponential)
        </text>

        {/* Bottom formula reminder */}
        <line x1="60" y1={GRID_Y + GRID_SIZE + 48}
              x2="580" y2={GRID_Y + GRID_SIZE + 48}
              stroke={C.border} strokeWidth="0.8" />
        <text x="320" y={GRID_Y + GRID_SIZE + 65}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          stacked: RF_L = 1 + L(k−1)    ·    dilated 2^i: RF_L = 2^(L+1) − 1
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
        Stacked 3×3 convolutions grow the receptive field linearly with depth;
        exponentially-dilated stacks grow it exponentially with the same
        parameter count.
      </figcaption>
    </figure>
  );
}
