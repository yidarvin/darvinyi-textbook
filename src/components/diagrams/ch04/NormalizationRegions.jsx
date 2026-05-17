const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  border:   '#2e2e2e',
  accent:   '#2dd4bf',
  accent2:  '#5eead4',
  bg2:      '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const PANEL_W = 160;
const PANEL_NAMES = ['BatchNorm', 'LayerNorm', 'InstanceNorm', 'GroupNorm'];

const COLS = 4;          // N (batch) — horizontal
const ROWS = 4;          // C (channel) — vertical
const CELL = 14;
const DEPTH_DX = 9;
const DEPTH_DY = 9;
const VOL_W = COLS * CELL;
const VOL_H = ROWS * CELL;

// Returns 0 (unshaded), 1 (group A teal), or 2 (group B lighter teal)
function shadeAt(panelIdx, col, row) {
  if (panelIdx === 0) {
    // BatchNorm: all N (every col) at a single C (one row)
    return row === 1 ? 1 : 0;
  }
  if (panelIdx === 1) {
    // LayerNorm: single N (one col) across all C (every row)
    return col === 1 ? 1 : 0;
  }
  if (panelIdx === 2) {
    // InstanceNorm: single (n, c) cell
    return col === 1 && row === 1 ? 1 : 0;
  }
  // GroupNorm: single N (one col), two groups of channels
  if (col !== 1) return 0;
  return row < 2 ? 1 : 2;
}

function Panel({ panelIdx }) {
  const px = panelIdx * PANEL_W;
  // Center the 3D volume in the panel
  const fx = px + Math.round(PANEL_W / 2 - (VOL_W + DEPTH_DX) / 2);
  const fy = 92;             // top of front face
  const bx = fx + DEPTH_DX;  // back face origin
  const by = fy - DEPTH_DY;

  const cells = [];
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const s = shadeAt(panelIdx, col, row);
      const isOn = s !== 0;
      const fill = s === 0 ? C.bg2 : s === 1 ? C.accent : C.accent2;
      const stroke = isOn ? C.accent : C.border;
      cells.push(
        <rect
          key={`c-${panelIdx}-${col}-${row}`}
          x={fx + col * CELL}
          y={fy + row * CELL}
          width={CELL}
          height={CELL}
          fill={fill}
          fillOpacity={s === 2 ? 0.55 : 1}
          stroke={stroke}
          strokeWidth="1"
        />
      );
    }
  }

  return (
    <g>
      {/* Panel name */}
      <text
        x={px + PANEL_W / 2}
        y={62}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="12"
        fill={C.text}
      >
        {PANEL_NAMES[panelIdx]}
      </text>

      {/* Back-face outline */}
      <rect
        x={bx}
        y={by}
        width={VOL_W}
        height={VOL_H}
        fill="none"
        stroke={C.muted}
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Corner connectors */}
      <line x1={fx} y1={fy} x2={bx} y2={by} stroke={C.muted} strokeWidth="1" opacity="0.5" />
      <line x1={fx + VOL_W} y1={fy} x2={bx + VOL_W} y2={by} stroke={C.muted} strokeWidth="1" opacity="0.5" />
      <line x1={fx} y1={fy + VOL_H} x2={bx} y2={by + VOL_H} stroke={C.muted} strokeWidth="1" opacity="0.5" />
      <line x1={fx + VOL_W} y1={fy + VOL_H} x2={bx + VOL_W} y2={by + VOL_H} stroke={C.muted} strokeWidth="1" opacity="0.5" />

      {/* Front-face cells */}
      {cells}

      {/* Axis labels — N (bottom), C (left), H,W (back) */}
      <text
        x={fx + VOL_W / 2}
        y={fy + VOL_H + 18}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="10.5"
        fill={C.muted}
      >
        N →
      </text>
      <text
        x={fx - 8}
        y={fy + VOL_H / 2 + 4}
        textAnchor="end"
        fontFamily={mono}
        fontSize="10.5"
        fill={C.muted}
      >
        C ↑
      </text>
      <text
        x={bx + VOL_W + 4}
        y={by - 3}
        fontFamily={mono}
        fontSize="10"
        fill={C.muted}
      >
        H,W ↘
      </text>
    </g>
  );
}

export default function NormalizationRegions() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 220"
        width="100%"
        role="img"
        aria-label="Normalization regions: which slice of the (N, C, H, W) volume each scheme averages over"
        style={{ display: 'block' }}
      >
        {/* Overall title */}
        <text
          x={320}
          y={28}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="12"
          fill={C.text}
        >
          Which dimensions does each norm average over?
        </text>

        {[0, 1, 2, 3].map(i => <Panel key={`panel-${i}`} panelIdx={i} />)}
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
        Each normalization scheme averages over a different slice of the
        (batch, channel, spatial) volume.
      </figcaption>
    </figure>
  );
}
