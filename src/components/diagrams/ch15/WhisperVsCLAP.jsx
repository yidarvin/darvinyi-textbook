const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.16)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// ── Left panel (Whisper): single column, cx = 160 ─────────────────────
const L_CX = 160;
const L_BOX = { x: 70, w: 180 };

// ── Right panel (CLAP): two columns ────────────────────────────────────
const R_COL_A_CX = 400; // audio branch
const R_COL_B_CX = 560; // text branch
const R_BOX = { w: 110 };

function FlowBox({ x, y, w, h, lines, fontSize = 10.5, teal = false }) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx="4"
        fill={teal ? C.accentDim : C.bg3}
        stroke={teal ? C.accent : C.borderLt}
        strokeWidth="1.4"
      />
      {lines.map((line, i) => {
        const totalLines = lines.length;
        const lineHeight = 13;
        const startY = y + h / 2 - ((totalLines - 1) * lineHeight) / 2 + 3.5;
        return (
          <text
            key={i}
            x={x + w / 2}
            y={startY + i * lineHeight}
            textAnchor="middle"
            fontFamily={mono}
            fontSize={fontSize}
            fill={teal ? C.accent : C.text}
          >
            {line}
          </text>
        );
      })}
    </g>
  );
}

function DownArrow({ x, y1, y2, marker = 'wvc-arrow' }) {
  return (
    <line
      x1={x} y1={y1} x2={x} y2={y2}
      stroke={C.muted2}
      strokeWidth="1.4"
      markerEnd={`url(#${marker})`}
    />
  );
}

export default function WhisperVsCLAP() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 300"
        width="100%"
        role="img"
        aria-label="Whisper's sequence-to-sequence transcription architecture contrasted with CLAP's dual-encoder contrastive architecture"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="wvc-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* ── Panel titles ─────────────────────────────────── */}
        <text x={L_CX} y="20" textAnchor="middle" fontFamily={mono}
              fontSize="10.5" fill={C.muted} letterSpacing="0.05em">
          WHISPER — SEQ2SEQ ASR
        </text>
        <text x="480" y="20" textAnchor="middle" fontFamily={mono}
              fontSize="10.5" fill={C.muted} letterSpacing="0.05em">
          CLAP — CONTRASTIVE ALIGNMENT
        </text>

        {/* ── Divider ──────────────────────────────────────── */}
        <line x1="320" y1="16" x2="320" y2="270"
              stroke={C.border} strokeWidth="1" strokeDasharray="3,4" />

        {/* ══════════════════ LEFT: WHISPER ══════════════════ */}

        {/* Stage 1: spectrogram input */}
        <FlowBox x={L_BOX.x} y={34} w={L_BOX.w} h={30}
                 lines={['log-Mel spectrogram']} fontSize={10} />
        <DownArrow x={L_CX} y1={64} y2={88} />

        {/* Stage 2: encoder */}
        <FlowBox x={L_BOX.x} y={88} w={L_BOX.w} h={30}
                 lines={['encoder (transformer)']} fontSize={9.5} />

        {/* Encoder → decoder, cross-attention */}
        <DownArrow x={L_CX} y1={118} y2={142} />
        <text x="256" y="134" textAnchor="middle" fontFamily={sans}
              fontSize="9.5" fill={C.muted2} fontStyle="italic">
          cross-attention
        </text>

        {/* Stage 3: decoder */}
        <FlowBox x={L_BOX.x} y={142} w={L_BOX.w} h={30}
                 lines={['decoder (autoregressive)']} fontSize={9} />
        <DownArrow x={L_CX} y1={172} y2={196} />

        {/* Stage 4: generated token row */}
        {['<s>', 'The', 'cat', '…'].map((tok, i) => {
          const w = 38, gap = 8;
          const startX = L_CX - (4 * w + 3 * gap) / 2;
          const x = startX + i * (w + gap);
          return (
            <g key={tok}>
              <FlowBox x={x} y={196} w={w} h={24} lines={[tok]} fontSize={10} />
              {i < 3 && (
                <text x={x + w + gap / 2} y={212} textAnchor="middle"
                      fontFamily={mono} fontSize="10" fill={C.muted2}>
                  →
                </text>
              )}
            </g>
          );
        })}

        {/* Left captions */}
        <text x={L_CX} y="244" textAnchor="middle" fontFamily={mono}
              fontSize="10.5" fill={C.muted2}>
          next-token cross-entropy loss
        </text>
        <text x={L_CX} y="259" textAnchor="middle" fontFamily={sans}
              fontSize="9.5" fill={C.muted} fontStyle="italic">
          one encoder → one decoder, not two
        </text>

        {/* ══════════════════ RIGHT: CLAP ══════════════════ */}

        {/* Stage 1: inputs */}
        <FlowBox x={R_COL_A_CX - R_BOX.w / 2} y={34} w={R_BOX.w} h={30}
                 lines={['audio clip']} fontSize={10.5} />
        <FlowBox x={R_COL_B_CX - R_BOX.w / 2} y={34} w={R_BOX.w} h={30}
                 lines={['text caption']} fontSize={10.5} />
        <DownArrow x={R_COL_A_CX} y1={64} y2={88} />
        <DownArrow x={R_COL_B_CX} y1={64} y2={88} />

        {/* Stage 2: two independent encoders */}
        <FlowBox x={R_COL_A_CX - R_BOX.w / 2} y={88} w={R_BOX.w} h={30}
                 lines={['audio encoder']} fontSize={9.5} />
        <FlowBox x={R_COL_B_CX - R_BOX.w / 2} y={88} w={R_BOX.w} h={30}
                 lines={['text encoder']} fontSize={9.5} />
        <DownArrow x={R_COL_A_CX} y1={118} y2={142} />
        <DownArrow x={R_COL_B_CX} y1={118} y2={142} />

        {/* Stage 3: embeddings */}
        <FlowBox x={R_COL_A_CX - 26} y={142} w={52} h={28}
                 lines={['a']} fontSize={13} teal />
        <FlowBox x={R_COL_B_CX - 26} y={142} w={52} h={28}
                 lines={['t']} fontSize={13} teal />
        <text x={R_COL_A_CX} y="186" textAnchor="middle" fontFamily={mono}
              fontSize="9" fill={C.muted}>
          a ∈ ℝ^d
        </text>
        <text x={R_COL_B_CX} y="186" textAnchor="middle" fontFamily={mono}
              fontSize="9" fill={C.muted}>
          t ∈ ℝ^d
        </text>

        {/* Connector + similarity badge */}
        <line x1={R_COL_A_CX + 26} y1="156" x2={R_COL_B_CX - 26} y2="156"
              stroke={C.accent} strokeWidth="1.2" strokeDasharray="3,3" opacity="0.7" />
        <rect x={R_COL_A_CX + 32} y="145" width={(R_COL_B_CX - 32) - (R_COL_A_CX + 32)}
              height="22" rx="4" fill={C.accentDim} stroke={C.accent} strokeWidth="1.2" />
        <text x={(R_COL_A_CX + R_COL_B_CX) / 2} y="160" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.accent}>
          cos(a,t)=0.87
        </text>

        {/* Right captions */}
        <text x="480" y="222" textAnchor="middle" fontFamily={mono}
              fontSize="10.5" fill={C.muted2}>
          symmetric InfoNCE loss
        </text>
        <text x="480" y="237" textAnchor="middle" fontFamily={sans}
              fontSize="9.5" fill={C.muted} fontStyle="italic">
          two independent encoders — CLIP's recipe, ported to audio
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
        Same input modality, incompatible architectures. Whisper is a seq2seq
        encoder–decoder trained to transcribe — it has no embedding-similarity
        output. CLAP is a dual encoder trained to align embeddings — it cannot
        generate text. Conflating the two is the most common mistake made about
        audio-language models. (The similarity score shown is illustrative, not
        measured.)
      </figcaption>
    </figure>
  );
}
