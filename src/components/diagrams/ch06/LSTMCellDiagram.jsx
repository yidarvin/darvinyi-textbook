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

const VB_W = 640;
const VB_H = 420;

// Cell outline
const CELL_X1 = 70;
const CELL_X2 = 590;
const CELL_Y1 = 60;
const CELL_Y2 = 360;

// Track y-coordinates
const C_Y = 105;     // cell state highway (top)
const H_Y = 320;     // hidden state track (bottom)
const GATE_Y = 215;
const GATE_H = 30;
const MID_Y = 170;   // intermediate row for i×c̃

// Gate centers (x)
const FX = 175;
const IX = 270;
const CX_GATE = 345;
const OX = 460;
const GATE_W = 60;

// Top-track op positions (centers)
const X_FORGET_MULT = FX;
const X_ADD         = (IX + CX_GATE) / 2;  // 307
const X_TANH        = 525;   // tanh extractor (on down-branch from top track tap)
const X_HOUT_MULT   = 525;   // × producing h_t (below tanh)

// Bottom junction (h_{t-1} + x_t concat point)
const JUNC_X = 115;

function GateBox({ cx, label, act }) {
  const x = cx - GATE_W / 2;
  return (
    <g>
      <rect
        x={x}
        y={GATE_Y}
        width={GATE_W}
        height={GATE_H}
        rx="6"
        fill={C.bg2}
        stroke={C.mid}
        strokeWidth="1.5"
      />
      <text
        x={cx}
        y={GATE_Y + GATE_H / 2 + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={C.text}
      >
        {label} ({act})
      </text>
    </g>
  );
}

function OpCircle({ cx, cy, symbol, accent }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r="9"
        fill={C.bg2}
        stroke={accent ? C.accent : C.mid}
        strokeWidth="1.5"
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="12"
        fill={accent ? C.accent : C.text}
        fontWeight="600"
      >
        {symbol}
      </text>
    </g>
  );
}

export default function LSTMCellDiagram() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        role="img"
        aria-label="LSTM cell with forget, input, candidate, and output gates"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="lc-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
          <marker id="lc-acc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
          <marker id="lc-mid" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.mid} />
          </marker>
        </defs>

        {/* Cell outline */}
        <rect
          x={CELL_X1}
          y={CELL_Y1}
          width={CELL_X2 - CELL_X1}
          height={CELL_Y2 - CELL_Y1}
          rx="10"
          fill="none"
          stroke={C.border}
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
        <text
          x={CELL_X2 - 10}
          y={CELL_Y1 + 18}
          textAnchor="end"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          LSTM CELL
        </text>

        {/* ── Cell state highway (top, teal, thick) ────────────────── */}
        <text x={28} y={C_Y - 10} fontFamily={mono} fontSize="11" fill={C.accent}>c_t-1</text>
        <text x={VB_W - 28} y={C_Y - 10} textAnchor="end" fontFamily={mono} fontSize="11" fill={C.accent}>c_t</text>
        <line
          x1={10}
          y1={C_Y}
          x2={VB_W - 10}
          y2={C_Y}
          stroke={C.accent}
          strokeWidth="3"
          markerEnd="url(#lc-acc)"
        />

        {/* ── Hidden state track (h_t-1 in, h_t out) ─────────────── */}
        <text x={28} y={H_Y + 4} fontFamily={mono} fontSize="11" fill={C.text}>h_t-1</text>
        <text x={VB_W - 28} y={H_Y + 4} textAnchor="end" fontFamily={mono} fontSize="11" fill={C.text}>h_t</text>

        <line x1={45} y1={H_Y} x2={JUNC_X} y2={H_Y} stroke={C.mid} strokeWidth="1.5" />
        <line
          x1={X_HOUT_MULT + 9}
          y1={H_Y}
          x2={VB_W - 45}
          y2={H_Y}
          stroke={C.mid}
          strokeWidth="1.5"
          markerEnd="url(#lc-mid)"
        />

        {/* x_t input from below */}
        <text x={JUNC_X} y={VB_H - 12} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.text}>x_t</text>
        <line
          x1={JUNC_X}
          y1={VB_H - 26}
          x2={JUNC_X}
          y2={H_Y}
          stroke={C.mid}
          strokeWidth="1.5"
        />

        {/* junction dot */}
        <circle cx={JUNC_X} cy={H_Y} r="2.5" fill={C.mid} />

        {/* fan-out riser + horizontal feeders to gates */}
        <line
          x1={JUNC_X}
          y1={H_Y}
          x2={JUNC_X}
          y2={GATE_Y + GATE_H / 2}
          stroke={C.muted}
          strokeWidth="1"
        />
        {[FX, IX, CX_GATE, OX].map((gx, i) => (
          <line
            key={`feed-${i}`}
            x1={JUNC_X}
            y1={GATE_Y + GATE_H / 2}
            x2={gx - GATE_W / 2}
            y2={GATE_Y + GATE_H / 2}
            stroke={C.muted}
            strokeWidth="1"
          />
        ))}
        {/* small dot at junction-riser turn */}
        <circle cx={JUNC_X} cy={GATE_Y + GATE_H / 2} r="2" fill={C.muted} />

        {/* concat annotation */}
        <text
          x={JUNC_X + 8}
          y={H_Y - 8}
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          [h, x]
        </text>

        {/* ── Gates ───────────────────────────────────────────────── */}
        <GateBox cx={FX} label="f" act="σ" />
        <GateBox cx={IX} label="i" act="σ" />
        <GateBox cx={CX_GATE} label="c̃" act="tanh" />
        <GateBox cx={OX} label="o" act="σ" />

        {/* ── Forget × on top track ──────────────────────────────── */}
        <line
          x1={FX}
          y1={GATE_Y}
          x2={FX}
          y2={C_Y + 9}
          stroke={C.muted}
          strokeWidth="1"
          markerEnd="url(#lc-arr)"
        />
        <OpCircle cx={X_FORGET_MULT} cy={C_Y} symbol="×" accent />
        <text x={FX + 12} y={C_Y - 14} fontFamily={mono} fontSize="10" fill={C.muted}>f_t</text>

        {/* ── Input × candidate at MID_Y, then + on top ──────────── */}
        {/* i_t up + over */}
        <line x1={IX} y1={GATE_Y} x2={IX} y2={MID_Y} stroke={C.muted} strokeWidth="1" />
        <line x1={IX} y1={MID_Y} x2={X_ADD - 9} y2={MID_Y} stroke={C.muted} strokeWidth="1" />
        <text x={IX - 16} y={MID_Y - 6} fontFamily={mono} fontSize="10" fill={C.muted}>i_t</text>

        {/* c̃ up + over */}
        <line x1={CX_GATE} y1={GATE_Y} x2={CX_GATE} y2={MID_Y} stroke={C.muted} strokeWidth="1" />
        <line x1={CX_GATE} y1={MID_Y} x2={X_ADD + 9} y2={MID_Y} stroke={C.muted} strokeWidth="1" />
        <text x={CX_GATE + 6} y={MID_Y - 6} fontFamily={mono} fontSize="10" fill={C.muted}>c̃_t</text>

        {/* mid × */}
        <OpCircle cx={X_ADD} cy={MID_Y} symbol="×" />

        {/* From mid × up to + on top track */}
        <line
          x1={X_ADD}
          y1={MID_Y - 9}
          x2={X_ADD}
          y2={C_Y + 9}
          stroke={C.muted}
          strokeWidth="1"
          markerEnd="url(#lc-arr)"
        />
        <OpCircle cx={X_ADD} cy={C_Y} symbol="+" accent />

        {/* ── Output side: top-track tap → tanh → × with o_t → h_t ── */}
        {/* Tap dot on top track */}
        <circle cx={X_TANH} cy={C_Y} r="2.5" fill={C.accent} />
        {/* down to tanh box */}
        <line
          x1={X_TANH}
          y1={C_Y}
          x2={X_TANH}
          y2={MID_Y - 12}
          stroke={C.muted}
          strokeWidth="1"
        />
        <rect
          x={X_TANH - 22}
          y={MID_Y - 12}
          width={44}
          height={24}
          rx="5"
          fill={C.bg2}
          stroke={C.mid}
          strokeWidth="1.5"
        />
        <text
          x={X_TANH}
          y={MID_Y + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.text}
        >
          tanh
        </text>
        {/* down from tanh to × at H_Y */}
        <line
          x1={X_TANH}
          y1={MID_Y + 12}
          x2={X_TANH}
          y2={H_Y - 9}
          stroke={C.muted}
          strokeWidth="1"
        />

        {/* o_t over to × from the LEFT */}
        <line
          x1={OX + GATE_W / 2}
          y1={GATE_Y + GATE_H / 2}
          x2={X_HOUT_MULT - 9}
          y2={GATE_Y + GATE_H / 2}
          stroke={C.muted}
          strokeWidth="1"
        />
        <line
          x1={X_HOUT_MULT - 9}
          y1={GATE_Y + GATE_H / 2}
          x2={X_HOUT_MULT - 9}
          y2={H_Y}
          stroke={C.muted}
          strokeWidth="1"
        />
        <text
          x={OX + GATE_W / 2 + 4}
          y={GATE_Y + GATE_H / 2 - 6}
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          o_t
        </text>

        {/* The h_t merge × */}
        <OpCircle cx={X_HOUT_MULT} cy={H_Y} symbol="×" />

        {/* annotation: constant error carousel — placed mid-top, between + and tap */}
        <text
          x={(X_ADD + X_TANH) / 2}
          y={C_Y - 18}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="10.5"
          fill={C.accent}
          fontStyle="italic"
        >
          constant error carousel
        </text>
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
        The cell state runs straight across the top of the cell — gates modulate what
        is forgotten, written, and read, but the gradient pathway through c is purely
        additive.
      </figcaption>
    </figure>
  );
}
