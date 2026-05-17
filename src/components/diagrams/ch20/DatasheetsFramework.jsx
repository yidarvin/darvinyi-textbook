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

const SECTIONS = [
  {
    n: '01',
    title: 'Motivation',
    q: 'Why was this dataset created? Who funded its creation?',
  },
  {
    n: '02',
    title: 'Composition',
    q: 'What do instances represent? How many are there? Are pieces missing?',
  },
  {
    n: '03',
    title: 'Collection',
    q: 'How was the data acquired? Scraped, donated, directly collected? Was consent obtained?',
  },
  {
    n: '04',
    title: 'Preprocessing / Cleaning',
    q: 'Was data filtered, normalized, or labeled? Were any subsets excluded — and why?',
  },
  {
    n: '05',
    title: 'Uses',
    q: 'What tasks has the dataset been used for? What tasks should it NOT be used for?',
  },
  {
    n: '06',
    title: 'Distribution',
    q: 'How is the dataset distributed? Under what license? Any copyright restrictions?',
  },
  {
    n: '07',
    title: 'Maintenance',
    q: 'Who maintains the dataset? Will it be updated, corrected, or deprecated?',
  },
];

const PARALLELS = [
  { text: 'Hardware components ship with datasheets',           accent: false },
  { text: 'Pharmaceuticals ship with safety information',       accent: false },
  { text: 'Foods ship with nutrition labels',                   accent: false },
  { text: 'Datasets should ship with documentation',            accent: true  },
];

// Card geometry
const CARD_X = 30;
const CARD_Y = 60;
const CARD_W = 380;
const HEADER_H = 32;
const SECTION_H = 54;
const CARD_H = HEADER_H + SECTION_H * SECTIONS.length + 12;
// 32 + 54*7 + 12 = 32 + 378 + 12 = 422

// Right column
const ANNO_X = 430;
const ANNO_Y = 80;
const ANNO_W = 180;

export default function DatasheetsFramework() {
  const totalH = CARD_Y + CARD_H + 90; // ~ 572
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 640 ${totalH}`}
        width="100%"
        role="img"
        aria-label="Datasheet documentation card showing seven sections from the Datasheets for Datasets framework — motivation, composition, collection, preprocessing, uses, distribution, maintenance — with real-world documentation parallels listed alongside."
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="dsf-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="26" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.muted2}
              letterSpacing="0.06em">
          datasheets for datasets — the documentation framework
        </text>

        {/* Card outer border */}
        <rect x={CARD_X} y={CARD_Y} width={CARD_W} height={CARD_H} rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1.2" />

        {/* Card header bar */}
        <rect x={CARD_X} y={CARD_Y} width={CARD_W} height={HEADER_H} rx="4"
              fill={C.bg3} stroke="none" />
        {/* mask the bottom curves of the header rect so it appears as a top-only rounded bar */}
        <rect x={CARD_X} y={CARD_Y + HEADER_H - 4} width={CARD_W} height="4"
              fill={C.bg3} />
        <line x1={CARD_X} y1={CARD_Y + HEADER_H} x2={CARD_X + CARD_W}
              y2={CARD_Y + HEADER_H}
              stroke={C.borderLt} strokeWidth="1" />

        <text x={CARD_X + 14} y={CARD_Y + 20}
              fontFamily={mono} fontSize="11" fill={C.accent}
              letterSpacing="0.18em" fontWeight="600">
          DATASHEET
        </text>
        <text x={CARD_X + CARD_W - 14} y={CARD_Y + 20} textAnchor="end"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          Gebru et al. — CACM 2021
        </text>

        {/* Section blocks */}
        {SECTIONS.map((s, i) => {
          const sy = CARD_Y + HEADER_H + i * SECTION_H;
          return (
            <g key={s.n}>
              {/* divider */}
              {i > 0 && (
                <line x1={CARD_X + 14} y1={sy}
                      x2={CARD_X + CARD_W - 14} y2={sy}
                      stroke={C.border} strokeWidth="0.6" />
              )}
              {/* section number */}
              <text x={CARD_X + 14} y={sy + 18}
                    fontFamily={mono} fontSize="9" fill={C.muted}
                    letterSpacing="0.08em">
                {s.n}
              </text>
              {/* section title */}
              <text x={CARD_X + 44} y={sy + 18}
                    fontFamily={mono} fontSize="10.5" fill={C.text}
                    fontWeight="600">
                {s.title}
              </text>
              {/* question */}
              <text x={CARD_X + 44} y={sy + 36}
                    fontFamily={sans} fontSize="10.5" fill={C.muted2}>
                {s.q}
              </text>
            </g>
          );
        })}

        {/* Right column: real-world parallels */}
        <text x={ANNO_X} y={ANNO_Y - 6}
              fontFamily={mono} fontSize="10" fill={C.muted2}
              letterSpacing="0.04em">
          real-world parallels
        </text>
        <line x1={ANNO_X} y1={ANNO_Y - 2} x2={ANNO_X + ANNO_W} y2={ANNO_Y - 2}
              stroke={C.border} strokeWidth="0.8" />

        {PARALLELS.map((p, i) => {
          const py = ANNO_Y + 16 + i * 38;
          return (
            <g key={i}>
              <rect x={ANNO_X} y={py - 12} width={ANNO_W} height="28" rx="4"
                    fill={p.accent ? C.accentDim : 'transparent'}
                    stroke={p.accent ? C.accent : C.borderLt}
                    strokeWidth={p.accent ? '1.2' : '0.8'} />
              <circle cx={ANNO_X + 10} cy={py + 2} r="2.4"
                      fill={p.accent ? C.accent : C.muted2} />
              <text x={ANNO_X + 20} y={py + 5}
                    fontFamily={sans} fontSize="10"
                    fill={p.accent ? C.accent : C.muted2}
                    fontWeight={p.accent ? '600' : '400'}>
                {p.text}
              </text>
            </g>
          );
        })}

        {/* Arrow from the "Datasets should ship..." parallel back to the datasheet card */}
        <line
          x1={ANNO_X - 4}
          y1={ANNO_Y + 16 + 3 * 38 + 2}
          x2={CARD_X + CARD_W + 6}
          y2={ANNO_Y + 16 + 3 * 38 + 2}
          stroke={C.accent} strokeWidth="1"
          strokeDasharray="3 3" opacity="0.85"
          markerEnd="url(#dsf-arrow-accent)" />

        {/* Bottom annotation */}
        <line x1={CARD_X} y1={CARD_Y + CARD_H + 24}
              x2={CARD_X + CARD_W + ANNO_W + 30 - CARD_X}
              y2={CARD_Y + CARD_H + 24}
              stroke={C.border} strokeWidth="0.6" />
        <text x="320" y={CARD_Y + CARD_H + 44} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          Gebru et al. 2021: documentation is not an audit — it makes the dataset's choices visible
        </text>
        <text x="320" y={CARD_Y + CARD_H + 60} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          so downstream users can make informed decisions.
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
        The Datasheets for Datasets framework treats dataset documentation as a structural
        requirement — what a hardware component or pharmaceutical ships with, every dataset should ship with too.
      </figcaption>
    </figure>
  );
}
