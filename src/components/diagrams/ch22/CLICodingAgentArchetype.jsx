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

const CX = 170;
const CY = 250;
const R_TOOLS = 96;
const R_DASH = 148;

// Tools placed around the agent. Angles in degrees from 12 o'clock, clockwise.
// 8 tools, every 45°.
const TOOLS = [
  { angle: 0,    label: 'View / Read',     teal: false },
  { angle: 45,   label: 'Edit / Write',    teal: false },
  { angle: 90,   label: 'Bash',            teal: false },
  { angle: 135,  label: 'Glob / Grep',     teal: false },
  { angle: 180,  label: 'Task / Subagent', teal: false },
  { angle: 225,  label: 'MCP servers',     teal: true  },
  { angle: 270,  label: 'WebFetch',        teal: false },
  { angle: 315,  label: 'TodoWrite',       teal: false },
];

const toolPos = (angle) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + R_TOOLS * Math.cos(rad), y: CY + R_TOOLS * Math.sin(rad) };
};

// Table geometry — right side
const T_X = 330;
const T_Y = 90;
const COL_NAME = T_X;
const COL_CC = T_X + 142;
const COL_CODEX = T_X + 180;
const COL_CURSOR = T_X + 222;
const COL_AIDER = T_X + 264;

const TABLE_ROWS = [
  ['View / Read',        '✓', '✓', '✓', '✓'],
  ['Edit / Write',       '✓', '✓', '✓', '✓'],
  ['Bash',               '✓', '✓', '✓', '✓'],
  ['Subagents',          '✓', '—', '✓', '—'],
  ['MCP',                '✓', '✓', '✓', '3rd-party'],
  ['Context compaction', '✓', '—', 'partial', 'manual'],
  ['Hooks',              '✓', '—', '—', '—'],
];

export default function CLICodingAgentArchetype() {
  const totalH = 480;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg viewBox={`0 0 640 ${totalH}`} width="100%" role="img"
           aria-label="CLI coding agent archetype with shared primitives radiating from a central agent loop, and a comparison table of implementations."
           style={{ display: 'block' }}>
        <defs>
          <marker id="cli-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          CLI coding agent — shared archetype
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          small primitive toolkit, harness-level differences above it
        </text>

        {/* Dashed permission circle */}
        <circle cx={CX} cy={CY} r={R_DASH}
                fill="none" stroke={C.muted}
                strokeWidth="0.8" strokeDasharray="4 4" opacity="0.8" />
        {/* Permission label — top arc */}
        <text x={CX} y={CY - R_DASH - 6}
              textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          Permission system — dangerous actions require user approval
        </text>

        {/* Lines from agent to each tool */}
        {TOOLS.map((t, i) => {
          const p = toolPos(t.angle);
          // shorten line to not overlap with rect
          const dx = p.x - CX;
          const dy = p.y - CY;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len;
          const uy = dy / len;
          const x1 = CX + ux * 28;
          const y1 = CY + uy * 18;
          const x2 = p.x - ux * 30;
          const y2 = p.y - uy * 10;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={C.borderLt} strokeWidth="0.8" opacity="0.7" />
          );
        })}

        {/* Central agent */}
        <rect x={CX - 56} y={CY - 18} width="112" height="36" rx="6"
              fill={C.bg3} stroke={C.accent} strokeWidth="1.5" />
        <text x={CX} y={CY - 2}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.accent}
              fontWeight="600">
          Coding Agent
        </text>
        <text x={CX} y={CY + 12}
              textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted2}>
          (LLM loop)
        </text>

        {/* Tools */}
        {TOOLS.map((t, i) => {
          const p = toolPos(t.angle);
          const w = 62;
          const h = 20;
          return (
            <g key={i}>
              <rect x={p.x - w / 2} y={p.y - h / 2}
                    width={w} height={h} rx="4"
                    fill={t.teal ? C.accentDim : C.bg2}
                    stroke={t.teal ? C.accent : C.borderLt}
                    strokeWidth={t.teal ? 1.2 : 0.9} />
              <text x={p.x} y={p.y + 3}
                    textAnchor="middle"
                    fontFamily={mono}
                    fontSize="8.5"
                    fill={t.teal ? C.accent : C.text}
                    fontWeight={t.teal ? '600' : '400'}>
                {t.label}
              </text>
            </g>
          );
        })}

        {/* Comparison table */}
        <text x={T_X} y={T_Y - 4}
              fontFamily={mono} fontSize="9" fill={C.muted}
              letterSpacing="0.06em">
          IMPLEMENTATION COMPARISON
        </text>

        {/* Column headers */}
        <line x1={T_X} y1={T_Y + 6} x2={T_X + 290} y2={T_Y + 6}
              stroke={C.borderLt} strokeWidth="0.6" />
        <text x={COL_NAME} y={T_Y + 4} fontFamily={mono} fontSize="8.5"
              fill={C.muted2}>Tool</text>
        <text x={COL_CC} y={T_Y + 4} textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}>CC</text>
        <text x={COL_CODEX} y={T_Y + 4} textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}>Codex</text>
        <text x={COL_CURSOR} y={T_Y + 4} textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}>Cursor</text>
        <text x={COL_AIDER} y={T_Y + 4} textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}>Aider</text>

        {/* Rows */}
        {TABLE_ROWS.map((row, i) => {
          const y = T_Y + 22 + i * 18;
          const isMCP = row[0] === 'MCP';
          return (
            <g key={i}>
              <line x1={T_X} y1={y - 12} x2={T_X + 290} y2={y - 12}
                    stroke={C.border} strokeWidth="0.4" />
              <text x={COL_NAME} y={y} fontFamily={mono} fontSize="9"
                    fill={isMCP ? C.accent : C.text}
                    fontWeight={isMCP ? '600' : '400'}>
                {row[0]}
              </text>
              <text x={COL_CC} y={y} textAnchor="middle" fontFamily={mono}
                    fontSize="9" fill={isMCP ? C.accent : C.muted2}>
                {row[1]}
              </text>
              <text x={COL_CODEX} y={y} textAnchor="middle" fontFamily={mono}
                    fontSize="9" fill={isMCP ? C.accent : C.muted2}>
                {row[2]}
              </text>
              <text x={COL_CURSOR} y={y} textAnchor="middle" fontFamily={mono}
                    fontSize="9" fill={isMCP ? C.accent : C.muted2}>
                {row[3]}
              </text>
              <text x={COL_AIDER} y={y} textAnchor="middle" fontFamily={mono}
                    fontSize="9" fill={isMCP ? C.accent : C.muted2}>
                {row[4]}
              </text>
            </g>
          );
        })}

        {/* Bottom note */}
        <text x={T_X} y={T_Y + 22 + TABLE_ROWS.length * 18 + 16}
              fontFamily={sans} fontSize="9.5" fill={C.muted2}
              fontStyle="italic">
          CC = Claude Code. State as of 2026;
        </text>
        <text x={T_X} y={T_Y + 22 + TABLE_ROWS.length * 18 + 28}
              fontFamily={sans} fontSize="9.5" fill={C.muted2}
              fontStyle="italic">
          harness features above the primitives diverge most.
        </text>

        {/* MCP highlight note */}
        <text x="320" y={totalH - 36} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.accent}
              fontStyle="italic">
          MCP is the consolidation point — same wire format across all major harnesses
        </text>
        <text x="320" y={totalH - 18} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          tool layer is now configurable plugins rather than custom-coded integrations
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
        CLI coding agents share a small primitive toolkit (file ops, shell, search)
        and diverge in higher-level harness features — context compaction, subagent
        delegation, hooks, permission systems.
      </figcaption>
    </figure>
  );
}
