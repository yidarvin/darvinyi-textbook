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

const BLOCK_H = 26;
const BLOCK_GAP = 6;
const BLOCK_W = 140;
const SUB_BLOCK_W = 90;

function Block({ x, y, w, indicator, indicatorColor }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={BLOCK_H}
        rx="4"
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1.5"
      />
      <text
        x={x + w / 2}
        y={y + BLOCK_H / 2 + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={indicatorColor || C.muted2}
      >
        {indicator}
      </text>
    </g>
  );
}

function TokenBox({ x, y, w, label, highlight }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={20}
        rx="3"
        fill={C.bg2}
        stroke={highlight ? C.accent : C.border}
        strokeWidth="1.5"
      />
      <text
        x={x + w / 2}
        y={y + 14}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="9.5"
        fill={highlight ? C.accent : C.text}
      >
        {label}
      </text>
    </g>
  );
}

function tokenRow(tokens, centerX, w, gap, y, highlightIdx) {
  const total = tokens.length * w + (tokens.length - 1) * gap;
  const startX = centerX - total / 2;
  return tokens.map((t, i) => (
    <TokenBox
      key={i}
      x={startX + i * (w + gap)}
      y={y}
      w={w}
      label={t}
      highlight={highlightIdx === i}
    />
  ));
}

function Stack({ centerX, w, n, indicator, indicatorColor, yTop }) {
  const blocks = [];
  for (let i = 0; i < n; i++) {
    const y = yTop + i * (BLOCK_H + BLOCK_GAP);
    blocks.push(
      <Block
        key={i}
        x={centerX - w / 2}
        y={y}
        w={w}
        indicator={indicator}
        indicatorColor={indicatorColor}
      />
    );
  }
  return <g>{blocks}</g>;
}

export default function EncoderDecoderTaxonomy() {
  const H = 440;
  const PANEL_TOP = 36;
  const HEADER_Y = 56;
  const OUT_Y = 88;
  const STACK_TOP = 122;
  const N_BLOCKS = 4;
  const STACK_BOTTOM = STACK_TOP + N_BLOCKS * (BLOCK_H + BLOCK_GAP) - BLOCK_GAP;
  const IN_Y = STACK_BOTTOM + 16;
  const FAMILY_LABEL_Y = IN_Y + 50;
  const SUB_LABEL_Y = FAMILY_LABEL_Y + 18;

  // Panel anchors
  const P1_CX = 100;
  const P2_CX = 320;
  const P3_ENC_CX = 480;
  const P3_DEC_CX = 590;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 640 ${H}`}
        width="100%"
        role="img"
        aria-label="Three transformer architecture families: encoder-only, decoder-only, encoder-decoder"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="taxa-arr-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
          <marker
            id="taxa-arr-muted"
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

        {/* Title */}
        <text
          x={320}
          y={20}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="13"
          fontWeight="500"
          fill={C.text}
        >
          Same building blocks, three attention regimes
        </text>

        {/* Vertical dividers between panels */}
        <line x1={200} y1={PANEL_TOP} x2={200} y2={FAMILY_LABEL_Y + 8} stroke={C.border} strokeWidth="1" strokeDasharray="2,5" />
        <line x1={420} y1={PANEL_TOP} x2={420} y2={FAMILY_LABEL_Y + 8} stroke={C.border} strokeWidth="1" strokeDasharray="2,5" />

        {/* ===== Panel 1: Encoder-only ===== */}
        <text x={P1_CX} y={HEADER_Y} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.text}>
          Encoder-only
        </text>
        <text x={P1_CX} y={HEADER_Y + 14} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          BERT · RoBERTa
        </text>

        {/* Output predictions row — show [MASK] position highlighted */}
        {tokenRow(['h', 'h', 'h', 'h', 'h'], P1_CX, 24, 4, OUT_Y, 2)}

        <Stack centerX={P1_CX} w={BLOCK_W} n={N_BLOCKS} indicator="↔" indicatorColor={C.muted2} yTop={STACK_TOP} />

        {/* Inputs */}
        {tokenRow(['[CLS]', 'the', '[MASK]', 'sat', 'down'], P1_CX, 30, 3, IN_Y, 2)}

        {/* Annotation arrow pointing to highlighted output */}
        <text
          x={P1_CX}
          y={OUT_Y - 6}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.accent}
        >
          predict masked token
        </text>

        <text x={P1_CX} y={FAMILY_LABEL_Y} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.text}>
          bidirectional
        </text>
        <text x={P1_CX} y={SUB_LABEL_Y} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          MLM pretraining
        </text>

        {/* ===== Panel 2: Decoder-only ===== */}
        <text x={P2_CX} y={HEADER_Y} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.text}>
          Decoder-only
        </text>
        <text x={P2_CX} y={HEADER_Y + 14} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          GPT · LLaMA · Claude
        </text>

        {tokenRow(['h', 'h', 'h', 'h'], P2_CX, 24, 4, OUT_Y, 3)}

        <Stack centerX={P2_CX} w={BLOCK_W} n={N_BLOCKS} indicator="→" indicatorColor={C.muted2} yTop={STACK_TOP} />

        {tokenRow(['The', 'cat', 'sat', 'on'], P2_CX, 30, 4, IN_Y, 3)}

        <text
          x={P2_CX}
          y={OUT_Y - 6}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.accent}
        >
          predict next token
        </text>

        <text x={P2_CX} y={FAMILY_LABEL_Y} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.text}>
          causal
        </text>
        <text x={P2_CX} y={SUB_LABEL_Y} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          next-token prediction
        </text>

        {/* ===== Panel 3: Encoder-decoder ===== */}
        <text x={(P3_ENC_CX + P3_DEC_CX) / 2} y={HEADER_Y} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.text}>
          Encoder-decoder
        </text>
        <text x={(P3_ENC_CX + P3_DEC_CX) / 2} y={HEADER_Y + 14} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          T5 · BART · original Transformer
        </text>

        {/* Output predictions: only on decoder side */}
        {tokenRow(['I', 'eat', 'an', 'apple'], P3_DEC_CX, 22, 3, OUT_Y, null)}
        <text
          x={P3_DEC_CX}
          y={OUT_Y - 6}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          target (en)
        </text>

        {/* Encoder stack (3 blocks) and decoder stack (3 blocks) */}
        <Stack centerX={P3_ENC_CX} w={SUB_BLOCK_W} n={3} indicator="↔" indicatorColor={C.muted2} yTop={STACK_TOP + 16} />
        <Stack centerX={P3_DEC_CX} w={SUB_BLOCK_W} n={3} indicator="→" indicatorColor={C.muted2} yTop={STACK_TOP + 16} />

        {/* Cross-attention arrows from encoder stack to decoder blocks */}
        {(() => {
          const ENC_RIGHT = P3_ENC_CX + SUB_BLOCK_W / 2;
          const DEC_LEFT  = P3_DEC_CX - SUB_BLOCK_W / 2;
          const arrows = [];
          for (let i = 0; i < 3; i++) {
            const decY = STACK_TOP + 16 + i * (BLOCK_H + BLOCK_GAP) + BLOCK_H / 2;
            // Source: middle of the encoder stack on its right edge
            const srcY = STACK_TOP + 16 + 16; // somewhere mid-encoder
            arrows.push(
              <path
                key={i}
                d={`M ${ENC_RIGHT} ${srcY} C ${(ENC_RIGHT + DEC_LEFT) / 2} ${srcY}, ${(ENC_RIGHT + DEC_LEFT) / 2} ${decY}, ${DEC_LEFT - 2} ${decY}`}
                fill="none"
                stroke={C.accent}
                strokeWidth="1.2"
                markerEnd="url(#taxa-arr-accent)"
                opacity="0.9"
              />
            );
          }
          return arrows;
        })()}

        {/* Cross-attention label */}
        <text
          x={(P3_ENC_CX + P3_DEC_CX) / 2}
          y={STACK_TOP + 6}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.accent}
        >
          cross-attn
        </text>

        {/* Inputs */}
        {tokenRow(['Je', 'mange', 'une', 'pomme'], P3_ENC_CX, 22, 3, IN_Y, null)}
        <text
          x={P3_ENC_CX}
          y={IN_Y + 35}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          source (fr)
        </text>

        {/* Decoder shifted-right inputs */}
        {tokenRow(['<s>', 'I', 'eat', 'an'], P3_DEC_CX, 22, 3, IN_Y, null)}
        <text
          x={P3_DEC_CX}
          y={IN_Y + 35}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          shifted target
        </text>

        <text x={(P3_ENC_CX + P3_DEC_CX) / 2} y={FAMILY_LABEL_Y} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.text}>
          bidir encoder + causal decoder
        </text>
        <text x={(P3_ENC_CX + P3_DEC_CX) / 2} y={SUB_LABEL_Y} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          translation · summarization
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
        The transformer block is universal; what differs is which positions attend to
        which, and what objective the model is trained on.
      </figcaption>
    </figure>
  );
}
