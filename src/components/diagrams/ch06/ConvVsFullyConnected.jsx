const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.14)',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const CELL = 16;
const GRID_N = 5;
const GRID_SIZE = GRID_N * CELL; // 80

// Left panel center x = 160; right panel center x = 480
const LEFT_CX = 160;
const RIGHT_CX = 480;
const GRID_Y = 36;

// Filter (right panel) — separate glyph showing 9 shared weights
const FILTER_CELL = 16;
const FILTER_W = 3 * FILTER_CELL;
const FILTER_X = 555;
const FILTER_Y = GRID_Y + (GRID_SIZE - FILTER_W) / 2;

function PixelGrid({ cx, highlightUpperLeft3 = false, gridY = GRID_Y }) {
  const x0 = cx - GRID_SIZE / 2;
  return (
    <g>
      {Array.from({ length: GRID_N }).map((_, r) =>
        Array.from({ length: GRID_N }).map((__, c) => {
          const isHL = highlightUpperLeft3 && r < 3 && c < 3;
          return (
            <rect
              key={`${r}-${c}`}
              x={x0 + c * CELL}
              y={gridY + r * CELL}
              width={CELL}
              height={CELL}
              fill={isHL ? C.accentDim : C.bg3}
              stroke={isHL ? C.accent : C.borderLt}
              strokeWidth={isHL ? '1.4' : '0.9'}
            />
          );
        })
      )}
    </g>
  );
}

export default function ConvVsFullyConnected() {
  const leftX0 = LEFT_CX - GRID_SIZE / 2;
  const rightX0 = RIGHT_CX - GRID_SIZE / 2;

  // Output neuron coords (left panel)
  const NEURON_X = LEFT_CX;
  const NEURON_Y = 240;
  const NEURON_R = 14;

  // Three labeled (highlighted) edges on the FC side
  const labeledCells = [
    { r: 0, c: 0, label: 'w_1' },
    { r: 2, c: 2, label: 'w_2' },
    { r: 4, c: 4, label: 'w_3' },
  ];

  // Three filter positions on conv grid: upper-left (solid), middle (dashed), lower-right (dashed)
  const filterPositions = [
    { r: 0, c: 0, solid: true },
    { r: 1, c: 1, solid: false },
    { r: 2, c: 2, solid: false },
  ];

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 340"
        width="100%"
        role="img"
        aria-label="Fully connected vs convolutional: weight count comparison"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="cvfc-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* ── Panel titles ─────────────────────────────────────── */}
        <text x={LEFT_CX} y={20} textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          fully connected
        </text>
        <text x={RIGHT_CX} y={20} textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          convolutional, 3×3 filter
        </text>

        {/* ── LEFT PANEL: FC grid + neuron + edges ─────────────── */}
        <PixelGrid cx={LEFT_CX} />

        {/* All 25 edges (muted) */}
        {Array.from({ length: GRID_N }).map((_, r) =>
          Array.from({ length: GRID_N }).map((__, c) => {
            const x1 = leftX0 + c * CELL + CELL / 2;
            const y1 = GRID_Y + r * CELL + CELL / 2;
            const labeled = labeledCells.find(lc => lc.r === r && lc.c === c);
            return (
              <line
                key={`fc-${r}-${c}`}
                x1={x1}
                y1={y1}
                x2={NEURON_X}
                y2={NEURON_Y}
                stroke={labeled ? C.accent : C.border}
                strokeWidth={labeled ? '1' : '0.6'}
                opacity={labeled ? 0.9 : 0.5}
              />
            );
          })
        )}

        {/* Output neuron */}
        <circle cx={NEURON_X} cy={NEURON_Y} r={NEURON_R}
                fill={C.bg3} stroke={C.borderLt} strokeWidth="1.5" />
        <text x={NEURON_X} y={NEURON_Y + 4} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}>
          y
        </text>

        {/* Labels for 3 of the weights */}
        {labeledCells.map(({ r, c, label }, i) => {
          const cx = leftX0 + c * CELL + CELL / 2;
          const cy = GRID_Y + r * CELL + CELL / 2;
          // midpoint between cell and neuron
          const mx = (cx + NEURON_X) / 2;
          const my = (cy + NEURON_Y) / 2;
          // small offset to avoid overlapping the line
          const offX = i === 0 ? -12 : i === 2 ? 12 : -14;
          return (
            <text
              key={`lbl-${i}`}
              x={mx + offX}
              y={my}
              fontFamily={mono}
              fontSize="9.5"
              fill={C.accent}
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* Bottom annotation for FC */}
        <text x={LEFT_CX} y={285} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          25 unique parameters
        </text>
        <text x={LEFT_CX} y={300} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          per output neuron
        </text>

        {/* ── RIGHT PANEL: conv grid + filter glyph ────────────── */}
        <PixelGrid cx={RIGHT_CX} highlightUpperLeft3={true} />

        {/* Dashed copies of the filter at two other positions */}
        {filterPositions.filter(p => !p.solid).map(({ r, c }, i) => (
          <rect
            key={`fp-${i}`}
            x={rightX0 + c * CELL}
            y={GRID_Y + r * CELL}
            width={3 * CELL}
            height={3 * CELL}
            fill="none"
            stroke={C.accent}
            strokeWidth="1.2"
            strokeDasharray="3,3"
            opacity={0.75}
          />
        ))}

        {/* Filter glyph (showing the 9 shared weights) */}
        <text x={FILTER_X + FILTER_W / 2} y={FILTER_Y - 6}
              textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.accent}>
          filter
        </text>
        {Array.from({ length: 3 }).map((_, r) =>
          Array.from({ length: 3 }).map((__, c) => {
            const idx = r * 3 + c + 1;
            return (
              <g key={`fk-${r}-${c}`}>
                <rect
                  x={FILTER_X + c * FILTER_CELL}
                  y={FILTER_Y + r * FILTER_CELL}
                  width={FILTER_CELL}
                  height={FILTER_CELL}
                  fill={C.accentDim}
                  stroke={C.accent}
                  strokeWidth="1.2"
                />
                <text
                  x={FILTER_X + c * FILTER_CELL + FILTER_CELL / 2}
                  y={FILTER_Y + r * FILTER_CELL + FILTER_CELL / 2 + 3.5}
                  textAnchor="middle"
                  fontFamily={mono}
                  fontSize="8.5"
                  fill={C.accent}
                >
                  {`w${idx}`}
                </text>
              </g>
            );
          })
        )}

        {/* Dashed connectors from filter glyph to the two dashed positions */}
        {filterPositions.filter(p => !p.solid).map(({ r, c }, i) => {
          const cx = rightX0 + (c + 1.5) * CELL;
          const cy = GRID_Y + (r + 1.5) * CELL;
          return (
            <line
              key={`fc-${i}`}
              x1={FILTER_X}
              y1={FILTER_Y + FILTER_W / 2}
              x2={cx}
              y2={cy}
              stroke={C.accent}
              strokeWidth="0.7"
              strokeDasharray="2,3"
              opacity={0.55}
            />
          );
        })}

        {/* Bottom annotation for conv */}
        <text x={RIGHT_CX} y={285} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          9 unique parameters
        </text>
        <text x={RIGHT_CX} y={300} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          reused at every position
        </text>

        {/* ── Bottom comparison annotation across both panels ───── */}
        <line x1="60" y1="318" x2="580" y2="318"
              stroke={C.border} strokeWidth="0.8" />
        <text x="320" y="333" textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          224×224 input: ~50K FC weights per neuron vs 9 conv weights total
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
        The convolution's weight sharing — the same filter at every position —
        is what reduces a CNN's parameter count by orders of magnitude and
        gives it translation equivariance.
      </figcaption>
    </figure>
  );
}
