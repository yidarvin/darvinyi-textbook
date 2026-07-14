import { useState, useEffect, useRef, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Palette ──────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  math:      '#fbbf24',
  text:      '#e8eaed',
  mid:       '#888888',
  muted:     '#555555',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  codeBg:    '#0a0a0a',
};

// ── CrewAI data ──────────────────────────────────────────────────────────
const ROLES = [
  { id: 'researcher', name: 'Market Researcher', goal: 'audience + competitors', color: C.green,  glyph: '◎' },
  { id: 'strategist', name: 'Content Strategist', goal: 'messaging calendar',    color: C.math,   glyph: '✎' },
  { id: 'creative',   name: 'Creative Director',  goal: 'visuals + aesthetic',   color: C.purple, glyph: '◐' },
  { id: 'manager',    name: 'Campaign Manager',   goal: 'final synthesis',       color: C.accent, glyph: '⧉' },
];

const ROLE_BY_ID = Object.fromEntries(ROLES.map(r => [r.id, r]));

// Task graph node positions in viewBox(280 x 150)
const TASKS = [
  { id: 'task1', label: 'T1 · Research',  role: 'researcher', cx: 140, cy: 26  },
  { id: 'task2', label: 'T2 · Strategy',  role: 'strategist', cx: 62,  cy: 76  },
  { id: 'task3', label: 'T3 · Creative',  role: 'creative',   cx: 218, cy: 76  },
  { id: 'task4', label: 'T4 · Final',     role: 'manager',    cx: 140, cy: 126 },
];

const TASK_EDGES = [
  ['task1', 'task2'],
  ['task1', 'task3'],
  ['task2', 'task4'],
  ['task3', 'task4'],
];

const CREW_EVENTS = [
  { t: 0,    log: '1. Researcher → researching market...',         status: { task1: 'running' } },
  { t: 700,  log: '2. Researcher → done. 5 key findings.',         status: { task1: 'done' },                            kind: 'progress' },
  { t: 900,  log: '3. Strategist + Creative → start (parallel).',  status: { task2: 'running', task3: 'running' } },
  { t: 1900, log: '4. Strategist → done. Drafted messaging.',      status: { task2: 'done' },                            kind: 'progress' },
  { t: 2200, log: '5. Creative → done. Mood board concept.',       status: { task3: 'done' },                            kind: 'progress' },
  { t: 2500, log: '6. Manager → synthesizing...',                  status: { task4: 'running' } },
  { t: 3500, log: '7. ✓ Plan delivered.',                          status: { task4: 'done' },  outcome: 'done',          kind: 'success' },
];

// ── AutoGPT data ─────────────────────────────────────────────────────────
const AUTO_EVENTS = [
  { t: 0,    log: '1. Goal: plan campaign (vegan ice cream).',    type: 'info',    goalStack: ['Plan campaign'],                                                       step: 1 },
  { t: 600,  log: '2. Decompose: research the market first.',     type: 'info',    goalStack: ['Plan campaign', 'Research market'],                                    step: 2 },
  { t: 1300, log: "3. → search('vegan ice cream market')",        type: 'info',                                                                                        step: 3 },
  { t: 2000, log: '4. ← results stored.',                         type: 'success',                                                                                     step: 4 },
  { t: 2700, log: "5. → search('competitor brands')",             type: 'info',                                                                                        step: 5 },
  { t: 3400, log: '6. ← results stored. Draft messaging next.',   type: 'success', goalStack: ['Plan campaign', 'Research market', 'Draft messaging'],                 step: 6 },
  { t: 4200, log: '7. Reconsider: revisit the audience?',         type: 'drift',   goalStack: ['Plan campaign', 'Research market', 'Draft messaging', 'Revisit audience'], step: 7, drift: true },
  { t: 5100, log: "8. → search('vegan demographics 2024')",       type: 'drift',                                                                                       step: 8, drift: true },
  { t: 6000, log: "9. → search('competitor brands') [repeat]",    type: 'drift',                                                                                       step: 9, drift: true },
  { t: 6900, log: '10. Stuck-loop detected — breaking out.',      type: 'error',                                                                                       step: 10 },
  { t: 7700, log: '11. → write final plan (incomplete).',         type: 'error',   outcome: 'partial',                                                                 step: 11 },
];

const SPEED_MAP = { normal: 1, fast: 2.4 };

// ── Sub: CrewAI architecture diagrams ───────────────────────────────────
function CrewDiagrams({ status }) {
  // viewBox dims chosen to share aspect with column width
  const VBW = 280;

  // Role grid (2 × 2)
  const cellW = 124, cellH = 58;
  const cells = [
    { x: 8,   y: 16,  role: ROLES[0] },
    { x: 148, y: 16,  role: ROLES[1] },
    { x: 8,   y: 88,  role: ROLES[2] },
    { x: 148, y: 88,  role: ROLES[3] },
  ];

  return (
    <>
      {/* ── Crew roster ─────────────────────────────────────────────── */}
      <svg viewBox={`0 0 ${VBW} 156`} width="100%" style={{ display: 'block' }}>
        <text x={VBW / 2} y={10} textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace" fontSize="8.5"
              fill={C.muted} letterSpacing="0.08em">
          CREW · 4 ROLES
        </text>
        {cells.map(({ x, y, role }) => (
          <g key={role.id}>
            <rect x={x} y={y} width={cellW} height={cellH} rx="5"
                  fill={C.bg3} stroke={role.color} strokeWidth="1.4" />
            <text x={x + 9} y={y + 17}
                  fontFamily="'JetBrains Mono', monospace" fontSize="11"
                  fill={role.color} fontWeight="600">{role.glyph}</text>
            <text x={x + 22} y={y + 17}
                  fontFamily="'Inter', sans-serif" fontSize="10.5"
                  fill={C.text} fontWeight="500">{role.name}</text>
            <text x={x + 9} y={y + 33}
                  fontFamily="'JetBrains Mono', monospace" fontSize="8.5"
                  fill={C.muted}>goal:</text>
            <text x={x + 9} y={y + 46}
                  fontFamily="'JetBrains Mono', monospace" fontSize="8.5"
                  fill={C.mid}>{role.goal}</text>
          </g>
        ))}
      </svg>

      {/* ── Task DAG ────────────────────────────────────────────────── */}
      <svg viewBox={`0 0 ${VBW} 150`} width="100%"
           style={{ display: 'block', marginTop: '6px' }}>
        <defs>
          {ROLES.map(r => (
            <marker key={r.id} id={`crew-arrow-${r.id}`} viewBox="0 0 10 10"
                    refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={C.borderLt} />
            </marker>
          ))}
          <marker id="crew-arrow-base" viewBox="0 0 10 10"
                  refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={C.borderLt} />
          </marker>
        </defs>

        <text x={VBW / 2} y={10} textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace" fontSize="8.5"
              fill={C.muted} letterSpacing="0.08em">
          TASK DEPENDENCY GRAPH
        </text>

        {/* Edges */}
        {TASK_EDGES.map(([a, b]) => {
          const ta = TASKS.find(t => t.id === a);
          const tb = TASKS.find(t => t.id === b);
          const dx = tb.cx - ta.cx, dy = tb.cy - ta.cy;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len, uy = dy / len;
          const r1 = 18, r2 = 18;
          const x1 = ta.cx + ux * r1, y1 = ta.cy + uy * r1;
          const x2 = tb.cx - ux * r2, y2 = tb.cy - uy * r2;
          const aDone = status[a] === 'done';
          return (
            <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={aDone ? C.mid : C.borderLt}
                  strokeWidth={aDone ? 1.4 : 1}
                  markerEnd="url(#crew-arrow-base)" />
          );
        })}

        {/* Task nodes */}
        {TASKS.map(t => {
          const role = ROLE_BY_ID[t.role];
          const st = status[t.id] || 'idle';
          const fill = st === 'done'
            ? role.color
            : st === 'running'
              ? `${role.color}55`
              : C.bg3;
          const stroke = st === 'idle' ? C.borderLt : role.color;
          const labelColor = st === 'done' ? C.codeBg : C.text;

          return (
            <g key={t.id}>
              {/* Pulsing ring while running */}
              {st === 'running' && (
                <circle cx={t.cx} cy={t.cy} r={22}
                        fill="none" stroke={role.color} strokeWidth="0.8"
                        strokeDasharray="3 3" opacity="0.65">
                  <animate attributeName="r" values="20;26;20" dur="1.1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.65;0.15;0.65" dur="1.1s" repeatCount="indefinite" />
                </circle>
              )}
              <rect x={t.cx - 50} y={t.cy - 12} width="100" height="24" rx="4"
                    fill={fill} stroke={stroke} strokeWidth="1.3" />
              <text x={t.cx} y={t.cy + 3} textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace" fontSize="9.5"
                    fill={labelColor} fontWeight={st === 'done' ? 600 : 500}>
                {t.label}
              </text>
            </g>
          );
        })}
      </svg>
    </>
  );
}

// ── Sub: AutoGPT diagrams ────────────────────────────────────────────────
function AutoDiagrams({ activeStep, goals, stuck }) {
  const VBW = 280;

  // Cycle nodes
  const cycle = [
    { id: 'plan',    label: 'Plan',    cx: 140, cy: 78 },
    { id: 'act',     label: 'Act',     cx: 210, cy: 128 },
    { id: 'reflect', label: 'Reflect', cx: 70,  cy: 128 },
  ];
  const cycleEdges = [
    ['plan', 'act'],
    ['act', 'reflect'],
    ['reflect', 'plan'],
  ];

  // Which cycle stage is "lit" based on step number
  const stage = activeStep === 0 ? null
    : (activeStep % 3 === 1 ? 'plan' : activeStep % 3 === 2 ? 'act' : 'reflect');

  // Goal stack viewBox(280 × 150)
  const VBW2 = 280;
  const slots = 4;
  const visibleGoals = goals.slice(-slots);

  return (
    <>
      {/* ── Agent + self-loop ──────────────────────────────────────── */}
      <svg viewBox={`0 0 ${VBW} 156`} width="100%" style={{ display: 'block' }}>
        <defs>
          <marker id="auto-arrow" viewBox="0 0 10 10"
                  refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={C.borderLt} />
          </marker>
        </defs>

        <text x={VBW / 2} y={10} textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace" fontSize="8.5"
              fill={C.muted} letterSpacing="0.08em">
          AGENT · 1 ROLE
        </text>

        {/* Agent box */}
        <rect x={40} y={20} width={200} height={36} rx="6"
              fill={stuck ? `${C.red}22` : C.bg3}
              stroke={stuck ? C.red : C.red}
              strokeWidth="1.4" />
        <text x={140} y={36} textAnchor="middle"
              fontFamily="'Inter', sans-serif" fontSize="11" fill={C.text} fontWeight="500">
          Autonomous Agent
        </text>
        <text x={140} y={49} textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fill={C.muted}>
          {stuck ? 'state: stuck loop' : activeStep > 0 ? `step ${activeStep}` : 'idle'}
        </text>

        {/* Cycle edges */}
        {cycleEdges.map(([a, b], i) => {
          const na = cycle.find(c => c.id === a);
          const nb = cycle.find(c => c.id === b);
          const dx = nb.cx - na.cx, dy = nb.cy - na.cy;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len, uy = dy / len;
          const x1 = na.cx + ux * 26, y1 = na.cy + uy * 12;
          const x2 = nb.cx - ux * 26, y2 = nb.cy - uy * 12;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={C.borderLt} strokeWidth="1"
                  markerEnd="url(#auto-arrow)" />
          );
        })}

        {/* Cycle nodes */}
        {cycle.map(n => {
          const isStage = stage === n.id;
          return (
            <g key={n.id}>
              {isStage && (
                <circle cx={n.cx} cy={n.cy} r={18}
                        fill="none" stroke={C.red} strokeWidth="0.8"
                        opacity="0.5">
                  <animate attributeName="r" values="16;22;16" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}
              <rect x={n.cx - 26} y={n.cy - 12} width="52" height="24" rx="4"
                    fill={isStage ? `${C.red}33` : C.bg3}
                    stroke={isStage ? C.red : C.borderLt} strokeWidth="1.2" />
              <text x={n.cx} y={n.cy + 3} textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace" fontSize="9.5"
                    fill={isStage ? C.red : C.mid}>
                {n.label}
              </text>
            </g>
          );
        })}

        {/* Arrow from agent down into cycle */}
        <line x1={140} y1={56} x2={140} y2={62}
              stroke={C.borderLt} strokeWidth="1" markerEnd="url(#auto-arrow)" />
      </svg>

      {/* ── Goal stack ─────────────────────────────────────────────── */}
      <svg viewBox={`0 0 ${VBW2} 150`} width="100%"
           style={{ display: 'block', marginTop: '6px' }}>
        <text x={VBW2 / 2} y={10} textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace" fontSize="8.5"
              fill={C.muted} letterSpacing="0.08em">
          GOAL STACK · live
        </text>

        {/* Stack slots */}
        {Array.from({ length: slots }).map((_, i) => {
          const y = 22 + i * 28;
          const goal = visibleGoals[i];
          const isTop = i === visibleGoals.length - 1;
          return (
            <g key={i}>
              <rect x={14} y={y} width={252} height={22} rx="4"
                    fill={goal ? (isTop ? `${C.red}22` : C.bg3) : 'transparent'}
                    stroke={goal ? (isTop ? C.red : C.borderLt) : `${C.border}88`}
                    strokeWidth="1"
                    strokeDasharray={goal ? '' : '2 3'} />
              {goal && (
                <>
                  <text x={22} y={y + 14}
                        fontFamily="'JetBrains Mono', monospace" fontSize="9"
                        fill={isTop ? C.text : C.mid}>
                    {goal}
                  </text>
                  <text x={258} y={y + 14} textAnchor="end"
                        fontFamily="'JetBrains Mono', monospace" fontSize="8"
                        fill={isTop ? C.red : C.muted}>
                    {isTop ? 'in progress' : 'pending'}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </>
  );
}

// ── Sub: Execution log ───────────────────────────────────────────────────
function ExecLog({ lines, height = 120 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);
  return (
    <div
      ref={ref}
      style={{
        height: `${height}px`,
        background: C.codeBg,
        border: `1px solid ${C.border}`,
        borderRadius: '6px',
        padding: '8px 10px',
        marginTop: '6px',
        overflowY: 'auto',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        lineHeight: 1.55,
      }}
    >
      {lines.length === 0 && (
        <div style={{ color: C.muted, fontStyle: 'italic' }}>
          idle — press Run to start
        </div>
      )}
      {lines.map((ln, i) => (
        <div key={i} style={{ color: ln.color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {ln.text}
        </div>
      ))}
    </div>
  );
}

// ── Sub: Comparison table ────────────────────────────────────────────────
const COMPARISON_ROWS = [
  ['Decomposition',  'Pre-defined by developer',  'Done by the agent'],
  ['Coordination',   'Task dependency graph',     'Self-managed iteration'],
  ['Failure mode',   'Bad role definitions',      'Drift, loops, no goal'],
  ['Best for',       'Known workflows',           'Open-ended exploration'],
  ['Production use', 'Common',                    'Rare (mostly research)'],
];

function ComparisonTable() {
  const cellBase = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    padding: '7px 10px',
    borderTop: `1px solid ${C.border}`,
  };
  return (
    <div style={{
      background: C.bg4,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      padding: '12px 14px',
      marginTop: '14px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 1fr',
        rowGap: 0,
      }}>
        <div style={{ ...cellBase, color: C.muted, borderTop: 'none' }}>Aspect</div>
        <div style={{ ...cellBase, color: C.green, borderTop: 'none' }}>CrewAI</div>
        <div style={{ ...cellBase, color: C.red,   borderTop: 'none' }}>AutoGPT</div>
        {COMPARISON_ROWS.map(([aspect, crew, auto]) => [
          <div key={`${aspect}-a`} style={{ ...cellBase, color: C.muted }}>{aspect}</div>,
          <div key={`${aspect}-b`} style={{ ...cellBase, color: C.mid   }}>{crew}</div>,
          <div key={`${aspect}-c`} style={{ ...cellBase, color: C.mid   }}>{auto}</div>,
        ])}
      </div>

      <div style={{
        marginTop: '12px',
        fontFamily: "'Inter', sans-serif",
        fontSize: '11px',
        color: '#b8c4cc',
        lineHeight: 1.55,
      }}>
        CrewAI succeeds when the workflow shape is known up front. AutoGPT was a powerful
        demonstration of emergent autonomy but struggles to stay focused on production tasks.
        The trend has moved toward structured frameworks like CrewAI and LangGraph.
      </div>
    </div>
  );
}

// ── Sub: Stats strip ─────────────────────────────────────────────────────
function StatsStrip({ crewStatus, crewOutcome, autoStep, autoGoalsPeak, autoDrift, autoOutcome, isRunning }) {
  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const cell = (label, val, valColor) => (
    <div style={{ flexShrink: 0 }}>
      <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase',
                    letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
      <div style={{ ...mono, fontSize: '11px', color: valColor || C.text, whiteSpace: 'nowrap' }}>
        {val}
      </div>
    </div>
  );
  const vdiv = (
    <div style={{ width: 1, background: C.border, alignSelf: 'stretch', flexShrink: 0, margin: '0 12px' }} />
  );

  const crewDoneCt = Object.values(crewStatus).filter(s => s === 'done').length;
  const crewStatusLabel = crewOutcome === 'done'
    ? 'done'
    : crewDoneCt > 0 ? 'running' : 'idle';
  const crewStatusColor = crewOutcome === 'done' ? C.green
    : crewDoneCt > 0 ? C.accent : C.muted;

  const autoStatusLabel = autoOutcome === 'partial'
    ? 'stuck'
    : autoStep > 0 ? 'running' : 'idle';
  const autoStatusColor = autoOutcome === 'partial' ? C.red
    : autoStep > 0 ? C.accent : C.muted;

  const autoOutcomeLabel = autoOutcome === 'partial'
    ? '⚠ partial'
    : autoStep === AUTO_EVENTS.length ? '⚠ partial' : '—';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: C.bg2,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      padding: '10px 14px',
      marginTop: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '2px', background: C.green }} />
        <div style={{ ...mono, fontSize: '9px', color: C.green, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          CrewAI
        </div>
      </div>
      {vdiv}
      {cell('Roles', '4')}
      {vdiv}
      {cell('Tasks', `${crewDoneCt} / 4`)}
      {vdiv}
      {cell('Status', crewStatusLabel, crewStatusColor)}
      {vdiv}
      {cell('Outcome', crewOutcome === 'done' ? '✓ delivered' : '—',
            crewOutcome === 'done' ? C.green : C.muted)}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '2px', background: C.red }} />
        <div style={{ ...mono, fontSize: '9px', color: C.red, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          AutoGPT
        </div>
      </div>
      {vdiv}
      {cell('Steps', `${autoStep} / 11`)}
      {vdiv}
      {cell('Peak stack', `${autoGoalsPeak}`)}
      {vdiv}
      {cell('Drift', `${autoDrift}`, autoDrift > 0 ? C.orange : C.text)}
      {vdiv}
      {cell('Status', autoStatusLabel, autoStatusColor)}
      {vdiv}
      {cell('Outcome', autoOutcomeLabel, autoOutcome === 'partial' ? C.red : C.muted)}
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────
const btnBase = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
  padding: '5px 12px',
  borderRadius: '5px',
  border: `1px solid ${C.borderLt}`,
  background: C.bg4,
  color: C.mid,
  cursor: 'pointer',
  transition: 'all 150ms',
  flexShrink: 0,
};

function Btn({ active, accent, disabled, children, onClick }) {
  const col = accent || C.accent;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1px solid ${active ? col : C.borderLt}`,
        background: active ? `${col}1A` : C.bg4,
        color: active ? col : C.mid,
      }}
    >
      {children}
    </button>
  );
}

// ── Main widget ──────────────────────────────────────────────────────────
export default function CrewAIvsAutoGPT({ tryThis }) {
  // applied event counts (drives all derived state)
  const [crewApplied, setCrewApplied] = useState(0);
  const [autoApplied, setAutoApplied] = useState(0);
  const [isRunning, setIsRunning]     = useState(false);
  const [speedMode, setSpeedMode]     = useState('normal');
  const [activeSide, setActiveSide]   = useState('both'); // 'crew' | 'auto' | 'both'

  const timeoutsRef = useRef([]);

  // Clean up timers on unmount
  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  function clearTimers() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  // Derived: crew state from applied events
  const crewStatus = useMemo(() => {
    const s = {};
    for (let i = 0; i < crewApplied; i++) {
      Object.assign(s, CREW_EVENTS[i].status || {});
    }
    return s;
  }, [crewApplied]);

  const crewLog = useMemo(() =>
    CREW_EVENTS.slice(0, crewApplied).map(ev => ({
      text:  ev.log,
      color: ev.kind === 'success' ? C.green
           : ev.kind === 'progress' ? C.mid
           : C.text,
    })),
  [crewApplied]);

  const crewOutcome = useMemo(() => {
    const last = CREW_EVENTS.slice(0, crewApplied).reverse().find(e => e.outcome);
    return last?.outcome || null;
  }, [crewApplied]);

  // Derived: auto state from applied events
  const autoLog = useMemo(() =>
    AUTO_EVENTS.slice(0, autoApplied).map(ev => ({
      text:  ev.log,
      color: ev.type === 'success' ? C.mid
           : ev.type === 'drift'   ? C.orange
           : ev.type === 'error'   ? C.red
           : C.text,
    })),
  [autoApplied]);

  const autoGoals = useMemo(() => {
    let stack = [];
    for (let i = 0; i < autoApplied; i++) {
      if (AUTO_EVENTS[i].goalStack) stack = AUTO_EVENTS[i].goalStack;
    }
    return stack;
  }, [autoApplied]);

  const autoGoalsPeak = useMemo(() => {
    let peak = 0;
    for (let i = 0; i < autoApplied; i++) {
      if (AUTO_EVENTS[i].goalStack) {
        peak = Math.max(peak, AUTO_EVENTS[i].goalStack.length);
      }
    }
    return peak;
  }, [autoApplied]);

  const autoStep = useMemo(() =>
    autoApplied === 0 ? 0 : AUTO_EVENTS[autoApplied - 1].step,
  [autoApplied]);

  const autoDrift = useMemo(() =>
    AUTO_EVENTS.slice(0, autoApplied).filter(e => e.drift).length,
  [autoApplied]);

  const autoOutcome = useMemo(() => {
    const last = AUTO_EVENTS.slice(0, autoApplied).reverse().find(e => e.outcome);
    return last?.outcome || null;
  }, [autoApplied]);

  const stuck = autoApplied >= 10;

  // ── Controls ──────────────────────────────────────────────────────────
  function reset() {
    clearTimers();
    setCrewApplied(0);
    setAutoApplied(0);
    setIsRunning(false);
  }

  function scheduleSide(events, setApplied, fromIdx = 0) {
    const speed = SPEED_MAP[speedMode];
    const baseT = events[fromIdx]?.t || 0;
    for (let i = fromIdx; i < events.length; i++) {
      const delay = (events[i].t - baseT) / speed;
      const id = setTimeout(() => setApplied(i + 1), delay);
      timeoutsRef.current.push(id);
    }
    // Final timer to clear isRunning
    const last = events[events.length - 1];
    const totalDelay = (last.t - baseT) / speed + 50;
    return totalDelay;
  }

  function run(side) {
    clearTimers();
    setIsRunning(true);
    setActiveSide(side);

    // Reset only the sides being re-run from scratch
    if (side === 'crew' || side === 'both') setCrewApplied(0);
    if (side === 'auto' || side === 'both') setAutoApplied(0);

    let maxDelay = 0;
    if (side === 'crew' || side === 'both') {
      maxDelay = Math.max(maxDelay, scheduleSide(CREW_EVENTS, setCrewApplied));
    }
    if (side === 'auto' || side === 'both') {
      maxDelay = Math.max(maxDelay, scheduleSide(AUTO_EVENTS, setAutoApplied));
    }
    const doneId = setTimeout(() => setIsRunning(false), maxDelay);
    timeoutsRef.current.push(doneId);
  }

  function step() {
    if (isRunning) return;
    if (activeSide === 'crew') {
      setCrewApplied(n => Math.min(n + 1, CREW_EVENTS.length));
    } else if (activeSide === 'auto') {
      setAutoApplied(n => Math.min(n + 1, AUTO_EVENTS.length));
    } else {
      setCrewApplied(n => Math.min(n + 1, CREW_EVENTS.length));
      setAutoApplied(n => Math.min(n + 1, AUTO_EVENTS.length));
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <WidgetCard title="CrewAI vs AutoGPT — role-based vs autonomous multi-agent" number="25.6" tryThis={tryThis}>

      {/* Shared task banner */}
      <div style={{
        background: C.codeBg,
        border: `1px solid ${C.border}`,
        borderRadius: '6px',
        padding: '8px 12px',
        marginBottom: '12px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          color: C.accent,
          background: C.accentDim,
          padding: '2px 7px',
          borderRadius: '3px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          shared goal
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.text }}>
          "Plan a marketing campaign for a new vegan ice cream brand."
        </span>
      </div>

      {/* Two columns: CrewAI | AutoGPT */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* ─── CrewAI column ─────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: '16px', color: C.green }}>
              CrewAI
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: C.muted }}>
              Role-based · Declarative tasks
            </div>
          </div>
          <CrewDiagrams status={crewStatus} />
          <ExecLog lines={crewLog} />
        </div>

        {/* ─── AutoGPT column ────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: '16px', color: C.red }}>
              AutoGPT
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: C.muted }}>
              Autonomous loop · Self-decomposing
            </div>
          </div>
          <AutoDiagrams activeStep={autoStep} goals={autoGoals} stuck={stuck} />
          <ExecLog lines={autoLog} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Btn onClick={() => run('both')} accent={C.accent} disabled={isRunning}>
          ▶ Run both
        </Btn>
        <Btn onClick={() => run('crew')} accent={C.green} disabled={isRunning}>
          ▶ CrewAI only
        </Btn>
        <Btn onClick={() => run('auto')} accent={C.red} disabled={isRunning}>
          ▶ AutoGPT only
        </Btn>
        <Btn onClick={step} disabled={isRunning}>
          ⏭ Step
        </Btn>
        <Btn onClick={reset}>
          ↺ Reset
        </Btn>

        <div style={{ flex: 1 }} />

        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.muted }}>
          speed
        </span>
        <Btn active={speedMode === 'normal'} onClick={() => setSpeedMode('normal')}>
          Normal
        </Btn>
        <Btn active={speedMode === 'fast'} onClick={() => setSpeedMode('fast')}>
          Fast
        </Btn>
      </div>

      {/* Comparison table */}
      <ComparisonTable />

      {/* Stats strip */}
      <StatsStrip
        crewStatus={crewStatus}
        crewOutcome={crewOutcome}
        autoStep={autoStep}
        autoGoalsPeak={autoGoalsPeak}
        autoDrift={autoDrift}
        autoOutcome={autoOutcome}
        isRunning={isRunning}
      />
    </WidgetCard>
  );
}
