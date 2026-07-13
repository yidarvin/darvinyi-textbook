const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  mid:     '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Panel layout: 4 columns, 145 wide, gap 10, x-offset 15.
const PANEL_W = 145;
const PANEL_X = [15, 170, 325, 480];

// Cell + io square sizes
const CELL_W = 28;
const CELL_H = 20;
const IO_W = 14;
const IO_H = 14;
const STEP_GAP = 6;

function rowX(n, panelX) {
  // returns array of left-x positions for n cells centered in PANEL_W
  const rowW = n * CELL_W + (n - 1) * STEP_GAP;
  const startX = panelX + (PANEL_W - rowW) / 2;
  return Array.from({ length: n }, (_, i) => startX + i * (CELL_W + STEP_GAP));
}

function Cell({ x, y, accent }) {
  return (
    <rect
      x={x}
      y={y}
      width={CELL_W}
      height={CELL_H}
      rx="4"
      fill={C.bg2}
      stroke={accent ? C.accent : C.mid}
      strokeWidth="1.5"
    />
  );
}

function InputSq({ cx, y }) {
  return (
    <rect
      x={cx - IO_W / 2}
      y={y}
      width={IO_W}
      height={IO_H}
      rx="2"
      fill="none"
      stroke={C.muted}
      strokeWidth="1.5"
    />
  );
}

function OutputSq({ cx, y, accent }) {
  return (
    <rect
      x={cx - IO_W / 2}
      y={y}
      width={IO_W}
      height={IO_H}
      rx="2"
      fill="none"
      stroke={accent ? C.accent : C.muted}
      strokeWidth="1.5"
    />
  );
}

function HorizArrow({ x1, x2, y, accent }) {
  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke={accent ? C.accent : C.muted}
      strokeWidth="1.5"
      markerEnd={accent ? 'url(#sm-acc)' : 'url(#sm-arr)'}
    />
  );
}

function VertConnector({ cx, y1, y2 }) {
  return (
    <line
      x1={cx}
      y1={y1}
      x2={cx}
      y2={y2}
      stroke={C.muted}
      strokeWidth="1"
    />
  );
}

function PanelTitle({ x, text }) {
  return (
    <text
      x={x + PANEL_W / 2}
      y={55}
      textAnchor="middle"
      fontFamily={mono}
      fontSize="11"
      fill={C.text}
    >
      {text}
    </text>
  );
}

function PanelCaption({ x, text, y }) {
  return (
    <text
      x={x + PANEL_W / 2}
      y={y}
      textAnchor="middle"
      fontFamily={sans}
      fontSize="10.5"
      fill={C.muted}
      fontStyle="italic"
    >
      {text}
    </text>
  );
}

export default function RNNSequenceModes() {
  // Y coordinates for "row layouts"
  // Standard (panels 1, 2, 3, and panel 4 top half)
  const ROW1_INPUT_Y = 85;
  const ROW1_CELL_Y  = 115;
  const ROW1_OUT_Y   = 150;
  const ROW1_CAP_Y   = 185;

  // Panel 4 bottom (seq2seq)
  const SEP_Y        = 215;
  const ROW2_TITLE_Y = 235;
  const ROW2_ENC_Y   = 250;
  const CTX_Y        = 285;
  const ROW2_DEC_Y   = 315;
  const ROW2_OUT_Y   = 350;
  const ROW2_CAP_Y   = 385;

  // Panel 1: one-to-one — single cell
  const p1cellX = PANEL_X[0] + (PANEL_W - CELL_W) / 2;
  const p1cx    = p1cellX + CELL_W / 2;

  // Panel 2: one-to-many — 3 cells, input on first, outputs on all
  const p2 = rowX(3, PANEL_X[1]);

  // Panel 3: many-to-one — 3 cells, inputs on all, output on last
  const p3 = rowX(3, PANEL_X[2]);

  // Panel 4 — top: aligned many-to-many; bottom: seq2seq
  const p4top = rowX(3, PANEL_X[3]);
  const p4enc = rowX(3, PANEL_X[3]);
  const p4dec = rowX(3, PANEL_X[3]);

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 410"
        width="100%"
        role="img"
        aria-label="The four sequence-mode configurations of recurrent networks"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="sm-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
          <marker id="sm-acc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Main title */}
        <text
          x="320"
          y="22"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="12"
          fill={C.text}
          letterSpacing="0.05em"
        >
          SEQUENCE MODES OF RECURRENCE
        </text>

        {/* ── Panel 1: one-to-one ───────────────────────────── */}
        <PanelTitle x={PANEL_X[0]} text="one-to-one" />
        <InputSq cx={p1cx} y={ROW1_INPUT_Y} />
        <VertConnector cx={p1cx} y1={ROW1_INPUT_Y + IO_H} y2={ROW1_CELL_Y} />
        <Cell x={p1cellX} y={ROW1_CELL_Y} />
        <VertConnector cx={p1cx} y1={ROW1_CELL_Y + CELL_H} y2={ROW1_OUT_Y} />
        <OutputSq cx={p1cx} y={ROW1_OUT_Y} />
        <PanelCaption x={PANEL_X[0]} text="feedforward" y={ROW1_CAP_Y} />
        <PanelCaption x={PANEL_X[0]} text="(classification)" y={ROW1_CAP_Y + 14} />

        {/* ── Panel 2: one-to-many ──────────────────────────── */}
        <PanelTitle x={PANEL_X[1]} text="one-to-many" />
        {/* input only on first cell */}
        <InputSq cx={p2[0] + CELL_W / 2} y={ROW1_INPUT_Y} />
        <VertConnector cx={p2[0] + CELL_W / 2} y1={ROW1_INPUT_Y + IO_H} y2={ROW1_CELL_Y} />
        {/* cells */}
        {p2.map((x, i) => <Cell key={`p2c-${i}`} x={x} y={ROW1_CELL_Y} />)}
        {/* horizontal recurrence arrows */}
        {p2.slice(0, -1).map((x, i) => (
          <HorizArrow
            key={`p2a-${i}`}
            x1={x + CELL_W}
            x2={p2[i + 1]}
            y={ROW1_CELL_Y + CELL_H / 2}
          />
        ))}
        {/* outputs on all */}
        {p2.map((x, i) => {
          const cx = x + CELL_W / 2;
          return (
            <g key={`p2o-${i}`}>
              <VertConnector cx={cx} y1={ROW1_CELL_Y + CELL_H} y2={ROW1_OUT_Y} />
              <OutputSq cx={cx} y={ROW1_OUT_Y} />
            </g>
          );
        })}
        <PanelCaption x={PANEL_X[1]} text="image captioning" y={ROW1_CAP_Y} />

        {/* ── Panel 3: many-to-one ──────────────────────────── */}
        <PanelTitle x={PANEL_X[2]} text="many-to-one" />
        {/* inputs on all */}
        {p3.map((x, i) => {
          const cx = x + CELL_W / 2;
          return (
            <g key={`p3i-${i}`}>
              <InputSq cx={cx} y={ROW1_INPUT_Y} />
              <VertConnector cx={cx} y1={ROW1_INPUT_Y + IO_H} y2={ROW1_CELL_Y} />
            </g>
          );
        })}
        {/* cells */}
        {p3.map((x, i) => <Cell key={`p3c-${i}`} x={x} y={ROW1_CELL_Y} />)}
        {p3.slice(0, -1).map((x, i) => (
          <HorizArrow
            key={`p3a-${i}`}
            x1={x + CELL_W}
            x2={p3[i + 1]}
            y={ROW1_CELL_Y + CELL_H / 2}
          />
        ))}
        {/* output only on last (teal highlight) */}
        <VertConnector cx={p3[2] + CELL_W / 2} y1={ROW1_CELL_Y + CELL_H} y2={ROW1_OUT_Y} />
        <OutputSq cx={p3[2] + CELL_W / 2} y={ROW1_OUT_Y} accent />
        <PanelCaption x={PANEL_X[2]} text="sentiment label" y={ROW1_CAP_Y} />

        {/* ── Panel 4 top: aligned many-to-many ─────────────── */}
        <PanelTitle x={PANEL_X[3]} text="many-to-many" />
        {/* inputs above each */}
        {p4top.map((x, i) => {
          const cx = x + CELL_W / 2;
          return (
            <g key={`p4ti-${i}`}>
              <InputSq cx={cx} y={ROW1_INPUT_Y} />
              <VertConnector cx={cx} y1={ROW1_INPUT_Y + IO_H} y2={ROW1_CELL_Y} />
            </g>
          );
        })}
        {p4top.map((x, i) => <Cell key={`p4tc-${i}`} x={x} y={ROW1_CELL_Y} />)}
        {p4top.slice(0, -1).map((x, i) => (
          <HorizArrow
            key={`p4ta-${i}`}
            x1={x + CELL_W}
            x2={p4top[i + 1]}
            y={ROW1_CELL_Y + CELL_H / 2}
          />
        ))}
        {/* outputs below each */}
        {p4top.map((x, i) => {
          const cx = x + CELL_W / 2;
          return (
            <g key={`p4to-${i}`}>
              <VertConnector cx={cx} y1={ROW1_CELL_Y + CELL_H} y2={ROW1_OUT_Y} />
              <OutputSq cx={cx} y={ROW1_OUT_Y} />
            </g>
          );
        })}
        <PanelCaption x={PANEL_X[3]} text="aligned · POS tagging" y={ROW1_CAP_Y} />

        {/* dashed separator inside panel 4 */}
        <line
          x1={PANEL_X[3] + 8}
          x2={PANEL_X[3] + PANEL_W - 8}
          y1={SEP_Y}
          y2={SEP_Y}
          stroke={C.border}
          strokeDasharray="3,4"
          strokeWidth="1"
        />

        {/* sub-title for seq2seq */}
        <text
          x={PANEL_X[3] + PANEL_W / 2}
          y={ROW2_TITLE_Y}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          unaligned (seq2seq)
        </text>

        {/* encoder row */}
        {p4enc.map((x, i) => {
          const cx = x + CELL_W / 2;
          return (
            <g key={`p4ei-${i}`}>
              <InputSq cx={cx} y={ROW2_ENC_Y - IO_H - 2} />
              <VertConnector cx={cx} y1={ROW2_ENC_Y - 2} y2={ROW2_ENC_Y} />
            </g>
          );
        })}
        {p4enc.map((x, i) => <Cell key={`p4ec-${i}`} x={x} y={ROW2_ENC_Y} />)}
        {p4enc.slice(0, -1).map((x, i) => (
          <HorizArrow
            key={`p4ea-${i}`}
            x1={x + CELL_W}
            x2={p4enc[i + 1]}
            y={ROW2_ENC_Y + CELL_H / 2}
          />
        ))}

        {/* context vector (teal, highlighted) — arrow from last encoder to first decoder */}
        <line
          x1={PANEL_X[3] + PANEL_W / 2}
          y1={ROW2_ENC_Y + CELL_H}
          x2={PANEL_X[3] + PANEL_W / 2}
          y2={CTX_Y - 6}
          stroke={C.accent}
          strokeWidth="2"
          markerEnd="url(#sm-acc)"
        />
        <text
          x={PANEL_X[3] + PANEL_W / 2}
          y={CTX_Y + 2}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.accent}
          fontWeight="600"
        >
          context vector
        </text>
        <line
          x1={PANEL_X[3] + PANEL_W / 2}
          y1={CTX_Y + 8}
          x2={PANEL_X[3] + PANEL_W / 2}
          y2={ROW2_DEC_Y}
          stroke={C.accent}
          strokeWidth="2"
          markerEnd="url(#sm-acc)"
        />

        {/* decoder row */}
        {p4dec.map((x, i) => <Cell key={`p4dc-${i}`} x={x} y={ROW2_DEC_Y} />)}
        {p4dec.slice(0, -1).map((x, i) => (
          <HorizArrow
            key={`p4da-${i}`}
            x1={x + CELL_W}
            x2={p4dec[i + 1]}
            y={ROW2_DEC_Y + CELL_H / 2}
          />
        ))}
        {p4dec.map((x, i) => {
          const cx = x + CELL_W / 2;
          return (
            <g key={`p4do-${i}`}>
              <VertConnector cx={cx} y1={ROW2_DEC_Y + CELL_H} y2={ROW2_OUT_Y} />
              <OutputSq cx={cx} y={ROW2_OUT_Y} />
            </g>
          );
        })}
        <PanelCaption x={PANEL_X[3]} text="translation" y={ROW2_CAP_Y} />
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
        The same recurrence supports several distinct task shapes — what changes is
        only where inputs are read and outputs are produced.
      </figcaption>
    </figure>
  );
}
