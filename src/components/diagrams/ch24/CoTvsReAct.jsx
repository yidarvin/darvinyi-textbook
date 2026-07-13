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
  red:      '#f87171',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Column geometry
const COL_W = 270;
const LEFT_X = 26;
const RIGHT_X = 344;
const DIVIDER_X = 320;

// ReAct trajectory turns: each entry is { tag, text } where tag is T / A / O
const REACT_TURNS = [
  { tag: 'T', text: "I need OpenAI's HQ location." },
  { tag: 'A', text: 'search("OpenAI HQ location")' },
  { tag: 'O', text: 'OpenAI HQ is at Pioneer' },
  { tag: 'O', text: 'Building, San Francisco.' },
  { tag: '',  text: '' },
  { tag: 'T', text: "Now I need SF's population." },
  { tag: 'A', text: 'search("SF population 2024")' },
  { tag: 'O', text: 'SF population (2024) is' },
  { tag: 'O', text: 'approximately 808,000.' },
  { tag: '',  text: '' },
  { tag: 'T', text: 'I have both pieces. Done.' },
  { tag: 'A', text: 'finish("808,000")' },
];

const COT_LINES = [
  "Thought: OpenAI's headquarters",
  "is in San Francisco. The",
  "population of San Francisco is",
  "around 800,000.",
  "",
  "Answer: ~800,000 people.",
];

// Color per ReAct tag
const tagColor = (tag) => {
  if (tag === 'T') return C.muted2;
  if (tag === 'A') return C.accent;
  if (tag === 'O') return C.text;
  return C.muted;
};

export default function CoTvsReAct() {
  const totalH = 560;

  // Trajectory box geometry (right column)
  const TRAJ_X = RIGHT_X + 10;
  const TRAJ_Y = 130;
  const TRAJ_W = COL_W - 20;
  const TRAJ_LINE_H = 16;
  const TRAJ_TOP_PAD = 20;
  const TRAJ_BOT_PAD = 14;
  const TRAJ_H = TRAJ_TOP_PAD + REACT_TURNS.length * TRAJ_LINE_H + TRAJ_BOT_PAD;

  // CoT box geometry (left column)
  const COT_X = LEFT_X + 10;
  const COT_Y = 130;
  const COT_W = COL_W - 20;
  const COT_LINE_H = 16;
  const COT_TOP_PAD = 20;
  const COT_BOT_PAD = 14;
  const COT_H = COT_TOP_PAD + COT_LINES.length * COT_LINE_H + COT_BOT_PAD;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 640 ${totalH}`}
        width="100%"
        role="img"
        aria-label="Side-by-side comparison of Chain-of-Thought and ReAct on the same task. The left column shows a single-pass model output reasoning from its own knowledge; the right column shows an interleaved Thought/Action/Observation trajectory grounded by tool calls."
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="cotr-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          same task, two approaches
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          "What is the population of the city where OpenAI is headquartered?"
        </text>

        {/* Divider */}
        <line x1={DIVIDER_X} y1="60" x2={DIVIDER_X} y2={totalH - 60}
              stroke={C.border} strokeWidth="0.8" strokeDasharray="3 4" />

        {/* ─── LEFT COLUMN — Chain-of-Thought ─── */}
        <text x={LEFT_X + COL_W / 2} y="78" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text} fontWeight="600">
          Chain-of-Thought
        </text>
        <text x={LEFT_X + COL_W / 2} y="93" textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          Wei et al. 2022
        </text>
        <text x={LEFT_X + COL_W / 2} y="112" textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          single forward pass — model reasons internally
        </text>

        {/* CoT output box */}
        <rect x={COT_X} y={COT_Y} width={COT_W} height={COT_H} rx="4"
              fill={C.bg3} stroke={C.borderLt} strokeWidth="1" />
        <text x={COT_X + 10} y={COT_Y + 14}
              fontFamily={mono} fontSize="8.5" fill={C.muted}
              letterSpacing="0.06em">
          MODEL OUTPUT
        </text>
        {COT_LINES.map((line, i) => (
          <text key={i}
                x={COT_X + 10}
                y={COT_Y + COT_TOP_PAD + 12 + i * COT_LINE_H}
                fontFamily={mono} fontSize="10.5"
                fill={i === COT_LINES.length - 1 ? C.text : C.text}
                fontWeight={i === COT_LINES.length - 1 ? '600' : '400'}>
            {line}
          </text>
        ))}

        {/* CoT footer risk */}
        <text x={LEFT_X + COL_W / 2} y={COT_Y + COT_H + 24}
              textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          one round-trip, no external check
        </text>
        <rect x={COT_X} y={COT_Y + COT_H + 36}
              width={COT_W} height="34" rx="4"
              fill="transparent" stroke={C.red} strokeWidth="0.8"
              strokeDasharray="3 3" opacity="0.7" />
        <text x={LEFT_X + COL_W / 2} y={COT_Y + COT_H + 52}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.red}
              fontStyle="italic">
          risk: model's knowledge may be stale
        </text>
        <text x={LEFT_X + COL_W / 2} y={COT_Y + COT_H + 64}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.red}
              fontStyle="italic">
          or wrong — no way to verify
        </text>

        {/* ─── RIGHT COLUMN — ReAct (highlighted teal) ─── */}
        <text x={RIGHT_X + COL_W / 2} y="78" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.accent}
              fontWeight="600">
          ReAct
        </text>
        <text x={RIGHT_X + COL_W / 2} y="93" textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          Yao et al. 2023
        </text>
        <text x={RIGHT_X + COL_W / 2} y="112" textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          multiple turns — each fact verified by a tool call
        </text>

        {/* ReAct trajectory box */}
        <rect x={TRAJ_X} y={TRAJ_Y} width={TRAJ_W} height={TRAJ_H} rx="4"
              fill={C.bg3} stroke={C.accent} strokeWidth="1.2" />
        <text x={TRAJ_X + 10} y={TRAJ_Y + 14}
              fontFamily={mono} fontSize="8.5" fill={C.accent}
              letterSpacing="0.06em">
          AGENT TRAJECTORY
        </text>

        {REACT_TURNS.map((turn, i) => {
          const y = TRAJ_Y + TRAJ_TOP_PAD + 12 + i * TRAJ_LINE_H;
          if (turn.text === '') return null;
          return (
            <g key={i}>
              <text x={TRAJ_X + 10} y={y}
                    fontFamily={mono} fontSize="9.5"
                    fill={tagColor(turn.tag)}
                    fontWeight="600">
                {turn.tag}
              </text>
              <text x={TRAJ_X + 28} y={y}
                    fontFamily={mono} fontSize="10.5"
                    fill={turn.tag === 'A' ? C.accent : C.text}>
                {turn.text}
              </text>
            </g>
          );
        })}

        {/* ReAct footer risk */}
        <text x={RIGHT_X + COL_W / 2} y={TRAJ_Y + TRAJ_H + 24}
              textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          interleaved with the environment
        </text>
        <rect x={TRAJ_X} y={TRAJ_Y + TRAJ_H + 36}
              width={TRAJ_W} height="34" rx="4"
              fill={C.accentDim} stroke={C.accent} strokeWidth="0.8"
              opacity="0.85" />
        <text x={RIGHT_X + COL_W / 2} y={TRAJ_Y + TRAJ_H + 52}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.accent}
              fontStyle="italic">
          tradeoff: longer trajectory, more tool calls
        </text>
        <text x={RIGHT_X + COL_W / 2} y={TRAJ_Y + TRAJ_H + 64}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.accent}
              fontStyle="italic">
          — but factually grounded
        </text>

        {/* Legend for T / A / O */}
        <g transform={`translate(${RIGHT_X + 8}, ${totalH - 22})`}>
          <text x="0" y="0" fontFamily={mono} fontSize="8.5"
                fill={C.muted2} fontWeight="600">T</text>
          <text x="12" y="0" fontFamily={mono} fontSize="8.5"
                fill={C.muted}>= thought</text>
          <text x="78" y="0" fontFamily={mono} fontSize="8.5"
                fill={C.accent} fontWeight="600">A</text>
          <text x="90" y="0" fontFamily={mono} fontSize="8.5"
                fill={C.muted}>= action</text>
          <text x="148" y="0" fontFamily={mono} fontSize="8.5"
                fill={C.text} fontWeight="600">O</text>
          <text x="160" y="0" fontFamily={mono} fontSize="8.5"
                fill={C.muted}>= observation</text>
        </g>
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
        Chain-of-thought makes reasoning explicit within a single forward pass; ReAct interleaves
        reasoning with external actions, grounding each step in tool-verified facts.
      </figcaption>
    </figure>
  );
}
