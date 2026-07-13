const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.10)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const STRIP_W = 120;
const STRIP_GAP = 8;
const FIRST_X = 6;

const stripX = (i) => FIRST_X + i * (STRIP_W + STRIP_GAP);
const stripCx = (i) => stripX(i) + STRIP_W / 2;

const POINTS = [
  {
    title: 'Raw API calls',
    descLines: [
      'direct anthropic.messages',
      '.create() or openai.chat',
      '.completions.create()',
      'no framework, no deps',
    ],
    tradeoffLines: [
      'maximum control,',
      'every developer',
      'reinvents the same',
      'utilities themselves',
    ],
    teal: false,
  },
  {
    title: 'Thin in-house wrappers',
    descLines: [
      'a few hundred lines of',
      'project-specific utils —',
      'retry, prompt templates,',
      'tool dispatch, logging',
    ],
    tradeoffLines: [
      'fits the application',
      'exactly, no external',
      'deps, requires effort',
      'to build and maintain',
    ],
    teal: false,
  },
  {
    title: 'DSPy / declarative',
    descLines: [
      'declare what the',
      'program should do,',
      'framework optimizes',
      'prompts automatically',
    ],
    tradeoffLines: [
      'decouples prompt',
      'engineering from app',
      'logic, learning curve,',
      'less direct control',
    ],
    teal: true,
  },
  {
    title: 'Specialized libs',
    descLines: [
      'narrow focus —',
      'LlamaIndex (RAG),',
      'Haystack (enterprise',
      'search, retrieval)',
    ],
    tradeoffLines: [
      'excellent if app is',
      'in target domain,',
      'less useful when it',
      "isn't",
    ],
    teal: false,
  },
  {
    title: 'LangChain / heavy',
    descLines: [
      'every primitive —',
      'Chains, Agents, Memory,',
      'Tools, Retrievers, Loaders,',
      'hundreds of integrations',
    ],
    tradeoffLines: [
      'comprehensive starter,',
      'batteries included,',
      'abstractions heavy,',
      'API churn over time',
    ],
    teal: false,
  },
];

export default function CompositionSpectrum() {
  const totalH = 480;
  const ARROW_Y = 78;
  const MARKER_Y = 92;
  const CARD_Y = 112;
  const CARD_H = 290;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg viewBox={`0 0 640 ${totalH}`} width="100%" role="img"
           aria-label="The composition spectrum from raw API calls on the left to comprehensive frameworks on the right."
           style={{ display: 'block' }}>
        <defs>
          <marker id="cs-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          The composition spectrum
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          how much abstraction sits between your code and the model API?
        </text>

        {/* Axis labels */}
        <text x={FIRST_X} y={ARROW_Y - 6} textAnchor="start"
              fontFamily={mono} fontSize="9" fill={C.muted2}>
          ← less abstraction
        </text>
        <text x="634" y={ARROW_Y - 6} textAnchor="end"
              fontFamily={mono} fontSize="9" fill={C.muted2}>
          more abstraction →
        </text>

        {/* Horizontal arrow */}
        <line x1={FIRST_X} y1={ARROW_Y} x2="634" y2={ARROW_Y}
              stroke={C.muted2} strokeWidth="1"
              markerEnd="url(#cs-arrow)" />

        {/* Markers on the arrow + cards below */}
        {POINTS.map((p, i) => {
          const isTeal = p.teal;
          return (
            <g key={i}>
              {/* marker dot on arrow */}
              <circle cx={stripCx(i)} cy={ARROW_Y} r="4"
                      fill={isTeal ? C.accent : C.bg3}
                      stroke={isTeal ? C.accent : C.muted2}
                      strokeWidth="1.2" />

              {/* connector tick to card top */}
              <line x1={stripCx(i)} y1={ARROW_Y + 4}
                    x2={stripCx(i)} y2={CARD_Y - 2}
                    stroke={isTeal ? C.accent : C.borderLt}
                    strokeWidth="0.8" />

              {/* card */}
              <rect x={stripX(i)} y={CARD_Y}
                    width={STRIP_W} height={CARD_H}
                    rx="4"
                    fill={isTeal ? C.accentDim : C.bg3}
                    stroke={isTeal ? C.accent : C.borderLt}
                    strokeWidth={isTeal ? 1.2 : 1} />

              {/* title */}
              <text x={stripCx(i)} y={CARD_Y + 16}
                    textAnchor="middle"
                    fontFamily={mono} fontSize="9.5"
                    fill={isTeal ? C.accent : C.text}
                    fontWeight="600">
                {p.title}
              </text>

              {/* divider */}
              <line x1={stripX(i) + 8} y1={CARD_Y + 24}
                    x2={stripX(i) + STRIP_W - 8} y2={CARD_Y + 24}
                    stroke={C.border} strokeWidth="0.5" />

              {/* description lines */}
              {p.descLines.map((ln, j) => (
                <text key={`d-${j}`}
                      x={stripCx(i)} y={CARD_Y + 38 + j * 11}
                      textAnchor="middle"
                      fontFamily={mono} fontSize="7.5"
                      fill={C.text}>
                  {ln}
                </text>
              ))}

              {/* tradeoff label */}
              <text x={stripCx(i)} y={CARD_Y + 38 + p.descLines.length * 11 + 18}
                    textAnchor="middle"
                    fontFamily={mono} fontSize="8"
                    fill={C.muted}
                    letterSpacing="0.06em">
                TRADEOFF
              </text>
              <line x1={stripX(i) + 28}
                    y1={CARD_Y + 38 + p.descLines.length * 11 + 24}
                    x2={stripX(i) + STRIP_W - 28}
                    y2={CARD_Y + 38 + p.descLines.length * 11 + 24}
                    stroke={C.border} strokeWidth="0.4" />

              {/* tradeoff lines */}
              {p.tradeoffLines.map((ln, j) => (
                <text key={`t-${j}`}
                      x={stripCx(i)}
                      y={CARD_Y + 38 + p.descLines.length * 11 + 38 + j * 11}
                      textAnchor="middle"
                      fontFamily={sans} fontSize="8"
                      fill={C.muted2}
                      fontStyle="italic">
                  {ln}
                </text>
              ))}
            </g>
          );
        })}

        {/* Bottom annotation */}
        <text x="320" y={totalH - 40} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          2025–2026 trend: many production teams started on LangChain and moved toward
        </text>
        <text x="320" y={totalH - 24} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          thinner wrappers — the cost of heavy abstractions often exceeds the benefit
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
        The composition spectrum runs from raw API calls to comprehensive frameworks;
        production teams in 2026 increasingly favor thinner wrappers or in-house code over
        heavy abstractions, except where the framework's primitives fit the application exactly.
      </figcaption>
    </figure>
  );
}
