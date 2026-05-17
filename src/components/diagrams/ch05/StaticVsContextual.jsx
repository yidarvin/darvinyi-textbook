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

// Asymmetric panels — the right panel needs more room for long vector labels.
const PANEL_Y       = 30;
const PANEL_H       = 290;
const LEFT_X        = 20;
const LEFT_W        = 240;
const RIGHT_X       = 275;
const RIGHT_W       = 345;

const SENT1 = ['sat', 'on', 'the', 'river', 'bank'];
const SENT2 = ['deposit', 'at', 'the', 'bank'];

// "bank" highlight positions, in chars from the start of each sentence.
const CHAR_W       = 7.2; // approx mono 12 char width
const BANK1_CHARS  = 'sat on the river '.length;
const BANK2_CHARS  = 'deposit at the '.length;

function PanelTitle({ x, y, text }) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={mono}
      fontSize="11"
      fill={C.muted}
      letterSpacing="0.05em"
    >
      {text}
    </text>
  );
}

function Sentence({ x, y, tokens, highlightIdx }) {
  return (
    <text x={x} y={y} fontFamily={mono} fontSize="12">
      {tokens.map((t, i) => (
        <tspan
          key={i}
          fill={i === highlightIdx ? C.accent : C.text}
          fontWeight={i === highlightIdx ? 600 : 400}
        >
          {t}
          {i < tokens.length - 1 ? ' ' : ''}
        </tspan>
      ))}
    </text>
  );
}

function VecGlyph({ x, y, w, label, accent, fontSize = 11 }) {
  const h = 30;
  return (
    <g>
      <rect
        x={x}
        y={y - h / 2}
        width={w}
        height={h}
        rx="4"
        fill={C.bg2}
        stroke={accent ? C.accent : C.border}
        strokeWidth="1.5"
      />
      <text
        x={x + w / 2}
        y={y + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize={fontSize}
        fill={accent ? C.accent : C.text}
      >
        {label}
      </text>
    </g>
  );
}

export default function StaticVsContextual() {
  // ── Left panel: static ────────────────────────────────────────────────────
  const L_SENT_X  = LEFT_X + 14;
  const L_SENT1_Y = PANEL_Y + 70;
  const L_SENT2_Y = PANEL_Y + 130;
  const L_VEC_W   = 110;
  const L_VEC_X   = LEFT_X + LEFT_W - L_VEC_W - 14;
  const L_VEC_Y   = (L_SENT1_Y + L_SENT2_Y) / 2 + 30;
  const L_BANK1_X = L_SENT_X + BANK1_CHARS * CHAR_W;
  const L_BANK2_X = L_SENT_X + BANK2_CHARS * CHAR_W;

  // ── Right panel: contextual ──────────────────────────────────────────────
  const R_SENT_X  = RIGHT_X + 14;
  const R_SENT1_Y = PANEL_Y + 70;
  const R_SENT2_Y = PANEL_Y + 200;
  const R_VEC_W   = 170;
  const R_VEC_X   = RIGHT_X + RIGHT_W - R_VEC_W - 14;
  const R_VEC1_Y  = R_SENT1_Y + 50;
  const R_VEC2_Y  = R_SENT2_Y + 30;
  const R_BANK1_X = R_SENT_X + BANK1_CHARS * CHAR_W;
  const R_BANK2_X = R_SENT_X + BANK2_CHARS * CHAR_W;

  // Cluster dots — placed inside the panel near each vec, avoiding overlap.
  // For vec1 ("river ___"): cluster sits below the glyph.
  const cluster1 = [
    { x: R_VEC_X + 24, y: R_VEC1_Y + 32, label: 'water'  },
    { x: R_VEC_X + 88, y: R_VEC1_Y + 28, label: 'shore'  },
    { x: R_VEC_X + 56, y: R_VEC1_Y + 48, label: 'stream' },
  ];
  // For vec2 ("Federal ___"): cluster sits above the glyph.
  const cluster2 = [
    { x: R_VEC_X + 28, y: R_VEC2_Y - 36, label: 'loan'    },
    { x: R_VEC_X + 80, y: R_VEC2_Y - 30, label: 'account' },
    { x: R_VEC_X + 124, y: R_VEC2_Y - 38, label: 'deposit' },
  ];

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 380"
        width="100%"
        role="img"
        aria-label="Static vs contextual word embeddings for the word bank"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="svc-arr-muted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
          <marker
            id="svc-arr-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* ── Left panel ── */}
        <rect
          x={LEFT_X}
          y={PANEL_Y}
          width={LEFT_W}
          height={PANEL_H}
          rx="4"
          fill="none"
          stroke={C.border}
          strokeWidth="1"
        />
        <PanelTitle x={LEFT_X + 10} y={PANEL_Y - 8} text="STATIC EMBEDDING" />

        <Sentence x={L_SENT_X} y={L_SENT1_Y} tokens={SENT1} highlightIdx={4} />
        <Sentence x={L_SENT_X} y={L_SENT2_Y} tokens={SENT2} highlightIdx={3} />

        {/* Both arrows converge into a single shared vector */}
        <line
          x1={L_BANK1_X + 18}
          y1={L_SENT1_Y + 6}
          x2={L_VEC_X + L_VEC_W / 2}
          y2={L_VEC_Y - 16}
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#svc-arr-accent)"
        />
        <line
          x1={L_BANK2_X + 18}
          y1={L_SENT2_Y + 6}
          x2={L_VEC_X + L_VEC_W / 2}
          y2={L_VEC_Y - 16}
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#svc-arr-accent)"
        />

        <VecGlyph x={L_VEC_X} y={L_VEC_Y} w={L_VEC_W} label="v(bank)" accent />

        <text
          x={LEFT_X + LEFT_W / 2}
          y={PANEL_Y + PANEL_H - 22}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          one word → one vector
        </text>

        {/* ── Right panel ── */}
        <rect
          x={RIGHT_X}
          y={PANEL_Y}
          width={RIGHT_W}
          height={PANEL_H}
          rx="4"
          fill="none"
          stroke={C.border}
          strokeWidth="1"
        />
        <PanelTitle x={RIGHT_X + 10} y={PANEL_Y - 8} text="CONTEXTUAL EMBEDDING" />

        <Sentence x={R_SENT_X} y={R_SENT1_Y} tokens={SENT1} highlightIdx={4} />
        <Sentence x={R_SENT_X} y={R_SENT2_Y} tokens={SENT2} highlightIdx={3} />

        {/* Cluster dots (muted) */}
        {cluster1.map((p, i) => (
          <g key={`c1-${i}`}>
            <circle cx={p.x} cy={p.y} r="2.5" fill={C.mid} opacity="0.6" />
            <text
              x={p.x + 5}
              y={p.y + 3}
              fontFamily={mono}
              fontSize="9.5"
              fill={C.mid}
            >
              {p.label}
            </text>
          </g>
        ))}
        {cluster2.map((p, i) => (
          <g key={`c2-${i}`}>
            <circle cx={p.x} cy={p.y} r="2.5" fill={C.mid} opacity="0.6" />
            <text
              x={p.x + 5}
              y={p.y + 3}
              fontFamily={mono}
              fontSize="9.5"
              fill={C.mid}
            >
              {p.label}
            </text>
          </g>
        ))}

        {/* Arrow from bank-1 → vec-1 (muted: river ___) */}
        <line
          x1={R_BANK1_X + 18}
          y1={R_SENT1_Y + 6}
          x2={R_VEC_X + R_VEC_W / 2}
          y2={R_VEC1_Y - 16}
          stroke={C.muted}
          strokeWidth="1.5"
          markerEnd="url(#svc-arr-muted)"
        />
        {/* Arrow from bank-2 → vec-2 (accent: Federal ___) */}
        <line
          x1={R_BANK2_X + 18}
          y1={R_SENT2_Y + 6}
          x2={R_VEC_X + R_VEC_W / 2}
          y2={R_VEC2_Y - 16}
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#svc-arr-accent)"
        />

        <VecGlyph x={R_VEC_X} y={R_VEC1_Y} w={R_VEC_W} label="v(bank | river ___)" fontSize={10.5} />
        <VecGlyph x={R_VEC_X} y={R_VEC2_Y} w={R_VEC_W} label="v(bank | Federal ___)" accent fontSize={10.5} />

        <text
          x={RIGHT_X + RIGHT_W / 2}
          y={PANEL_Y + PANEL_H - 22}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          same word → different vectors, depending on context
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
        Static embeddings give each word one vector; contextual embeddings give
        each occurrence its own vector, conditioned on its surrounding sentence.
      </figcaption>
    </figure>
  );
}
