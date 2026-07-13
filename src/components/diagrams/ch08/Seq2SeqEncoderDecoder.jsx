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
const VB_H = 360;

// Cell dims
const CELL_W = 46;
const CELL_H = 34;
const TOK_W = 40;
const TOK_H = 22;

// Encoder layout
const ENC_X = [18, 70, 122, 174];   // 4 cells, width 46, gap 6
const ENC_Y = 130;

// Context vector
const CTX_X = 245;
const CTX_W = 68;
const CTX_Y = 124;   // slightly taller
const CTX_H = 46;

// Decoder layout
const DEC_X = [338, 390, 442, 494];
const DEC_Y = 130;

// Token rows
const SRC_TOK_Y = 84;
const TGT_TOK_Y = 196;

const SRC = ['Je', 'mange', 'une', 'pomme'];
const TGT = ['I', 'eat', 'an', 'apple'];

function Cell({ x, y, label }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CELL_W}
        height={CELL_H}
        rx="5"
        fill={C.bg2}
        stroke={C.mid}
        strokeWidth="1.5"
      />
      <text
        x={x + CELL_W / 2}
        y={y + CELL_H / 2 + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="10.5"
        fill={C.text}
      >
        {label}
      </text>
    </g>
  );
}

function Token({ x, y, text, accent }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={TOK_W}
        height={TOK_H}
        rx="3"
        fill="none"
        stroke={accent ? C.accent : C.muted}
        strokeWidth="1.5"
      />
      <text
        x={x + TOK_W / 2}
        y={y + TOK_H / 2 + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="10.5"
        fill={accent ? C.accent : C.text}
      >
        {text}
      </text>
    </g>
  );
}

export default function Seq2SeqEncoderDecoder() {
  // Token x positions centered above/below their cells
  const srcTokX = (i) => ENC_X[i] + CELL_W / 2 - TOK_W / 2;
  const tgtTokX = (i) => DEC_X[i] + CELL_W / 2 - TOK_W / 2;

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        role="img"
        aria-label="Seq2seq encoder-decoder showing the context-vector bottleneck"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="s2-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
          <marker id="s2-mid" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.mid} />
          </marker>
          <marker id="s2-acc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* ── Top labels ──────────────────────────────── */}
        <text
          x={(ENC_X[0] + ENC_X[3] + CELL_W) / 2}
          y={56}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          source (French)
        </text>
        <text
          x={(DEC_X[0] + DEC_X[3] + CELL_W) / 2}
          y={56}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          target (English)
        </text>

        {/* ── Source tokens row ───────────────────────── */}
        {SRC.map((t, i) => (
          <Token key={`src-${i}`} x={srcTokX(i)} y={SRC_TOK_Y} text={t} />
        ))}

        {/* Source → encoder connectors */}
        {SRC.map((_, i) => {
          const cx = ENC_X[i] + CELL_W / 2;
          return (
            <line
              key={`srcc-${i}`}
              x1={cx}
              y1={SRC_TOK_Y + TOK_H}
              x2={cx}
              y2={ENC_Y}
              stroke={C.mid}
              strokeWidth="1"
              markerEnd="url(#s2-mid)"
            />
          );
        })}

        {/* ── Encoder LSTM cells ──────────────────────── */}
        {ENC_X.map((x, i) => (
          <Cell key={`enc-${i}`} x={x} y={ENC_Y} label="LSTM" />
        ))}

        {/* Encoder recurrence arrows */}
        {ENC_X.slice(0, -1).map((x, i) => (
          <line
            key={`enca-${i}`}
            x1={x + CELL_W}
            y1={ENC_Y + CELL_H / 2}
            x2={ENC_X[i + 1]}
            y2={ENC_Y + CELL_H / 2}
            stroke={C.mid}
            strokeWidth="1.5"
            markerEnd="url(#s2-mid)"
          />
        ))}

        {/* Last encoder → context */}
        <line
          x1={ENC_X[3] + CELL_W}
          y1={ENC_Y + CELL_H / 2}
          x2={CTX_X}
          y2={CTX_Y + CTX_H / 2}
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#s2-acc)"
        />

        {/* ── Context vector (highlighted) ───────────── */}
        <rect
          x={CTX_X}
          y={CTX_Y}
          width={CTX_W}
          height={CTX_H}
          rx="6"
          fill={C.bg2}
          stroke={C.accent}
          strokeWidth="2"
        />
        <text
          x={CTX_X + CTX_W / 2}
          y={CTX_Y + CTX_H / 2 + 5}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="14"
          fill={C.accent}
          fontWeight="600"
        >
          c
        </text>
        {/* BOTTLENECK label with thin pointer */}
        <text
          x={CTX_X + CTX_W / 2}
          y={CTX_Y - 18}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.accent}
          letterSpacing="0.08em"
          fontWeight="600"
        >
          BOTTLENECK
        </text>
        <line
          x1={CTX_X + CTX_W / 2}
          y1={CTX_Y - 12}
          x2={CTX_X + CTX_W / 2}
          y2={CTX_Y - 2}
          stroke={C.accent}
          strokeWidth="1"
        />
        <text
          x={CTX_X + CTX_W / 2}
          y={CTX_Y + CTX_H + 14}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="10.5"
          fill={C.accent}
          fontStyle="italic"
        >
          encodes whole sentence
        </text>

        {/* Context → first decoder */}
        <line
          x1={CTX_X + CTX_W}
          y1={CTX_Y + CTX_H / 2}
          x2={DEC_X[0]}
          y2={DEC_Y + CELL_H / 2}
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#s2-acc)"
        />

        {/* ── Decoder LSTM cells ──────────────────────── */}
        {DEC_X.map((x, i) => (
          <Cell key={`dec-${i}`} x={x} y={DEC_Y} label="LSTM" />
        ))}

        {/* Decoder recurrence arrows */}
        {DEC_X.slice(0, -1).map((x, i) => (
          <line
            key={`deca-${i}`}
            x1={x + CELL_W}
            y1={DEC_Y + CELL_H / 2}
            x2={DEC_X[i + 1]}
            y2={DEC_Y + CELL_H / 2}
            stroke={C.mid}
            strokeWidth="1.5"
            markerEnd="url(#s2-mid)"
          />
        ))}

        {/* Decoder → target connectors */}
        {TGT.map((_, i) => {
          const cx = DEC_X[i] + CELL_W / 2;
          return (
            <line
              key={`tgtc-${i}`}
              x1={cx}
              y1={DEC_Y + CELL_H}
              x2={cx}
              y2={TGT_TOK_Y}
              stroke={C.mid}
              strokeWidth="1"
              markerEnd="url(#s2-mid)"
            />
          );
        })}

        {/* ── Target tokens ───────────────────────────── */}
        {TGT.map((t, i) => (
          <Token key={`tgt-${i}`} x={tgtTokX(i)} y={TGT_TOK_Y} text={t} />
        ))}

        {/* Autoregressive dashed feedback: target token i → cell i+1 */}
        {TGT.slice(0, -1).map((_, i) => {
          const fromX = tgtTokX(i) + TOK_W / 2;
          const fromY = TGT_TOK_Y + TOK_H;
          const toX = DEC_X[i + 1] + CELL_W / 2;
          const toY = DEC_Y + CELL_H + 2;
          // path: down a bit, right, up to next cell bottom
          const dipY = TGT_TOK_Y + TOK_H + 16;
          const d = `M${fromX} ${fromY} L${fromX} ${dipY} L${toX} ${dipY} L${toX} ${toY}`;
          return (
            <path
              key={`ar-${i}`}
              d={d}
              fill="none"
              stroke={C.muted}
              strokeWidth="1"
              strokeDasharray="3,3"
              markerEnd="url(#s2-arr)"
            />
          );
        })}

        {/* Bottom annotation */}
        <text
          x={VB_W / 2}
          y={VB_H - 40}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted}
          fontStyle="italic"
        >
          Chapter 9 fixes the bottleneck by letting the decoder read every encoder
          state.
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
        Seq2seq compresses the entire source sequence into a single context vector —
        the bottleneck that motivated attention.
      </figcaption>
    </figure>
  );
}
