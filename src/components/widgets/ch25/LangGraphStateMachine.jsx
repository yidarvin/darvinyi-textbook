import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent: '#2dd4bf', accentDim: '#0b2422',
  orange: '#fb923c', orangeDim: 'rgba(251,146,60,0.12)',
  purple: '#a78bfa', purpleDim: 'rgba(167,139,250,0.12)',
  math: '#fbbf24',
  green: '#34d399', red: '#f87171',
  border: '#242424', borderLt: '#2e2e2e',
  bg2: '#111111', bg3: '#161616', bg4: '#1e1e1e',
  codeBg: '#0a0a0a', text: '#e8eaed', mid: '#888888', muted: '#555555',
};

// x,y = center of each node. viewBox 700 × 370.
const NODES = [
  { id: 'START',         type: 'start',  label: 'START',          x: 350, y: 30  },
  { id: 'classify',      type: 'llm',    label: 'Classify query', x: 350, y: 90  },
  { id: 'simple',        type: 'llm',    label: 'Direct answer',  x: 90,  y: 160 },
  { id: 'retrieve',      type: 'tool',   label: 'Retrieve docs',  x: 350, y: 160 },
  { id: 'escalate',      type: 'human',  label: 'Escalate human', x: 610, y: 160 },
  { id: 'answerWithCtx', type: 'llm',    label: 'Answer + ctx',   x: 350, y: 220 },
  { id: 'qualityCheck',  type: 'llm',    label: 'Quality check',  x: 350, y: 280 },
  { id: 'END',           type: 'end',    label: 'END',            x: 350, y: 340 },
];
const NODE_MAP = Object.fromEntries(NODES.map(n => [n.id, n]));

// lx/ly/la = label x, y, anchor for conditional edge labels
const EDGES = [
  { from: 'START',         to: 'classify',      type: 'direct'                                      },
  { from: 'classify',      to: 'simple',        type: 'conditional', label: 'if simple',    lx: 220, ly: 119, la: 'middle' },
  { from: 'classify',      to: 'retrieve',      type: 'conditional', label: 'if complex',   lx: 358, ly: 125, la: 'start'  },
  { from: 'classify',      to: 'escalate',      type: 'conditional', label: 'if sensitive', lx: 480, ly: 119, la: 'middle' },
  { from: 'simple',        to: 'qualityCheck',  type: 'direct'                                      },
  { from: 'retrieve',      to: 'answerWithCtx', type: 'direct'                                      },
  { from: 'answerWithCtx', to: 'qualityCheck',  type: 'direct'                                      },
  { from: 'escalate',      to: 'END',           type: 'direct'                                      },
  { from: 'qualityCheck',  to: 'END',           type: 'conditional', label: 'if approved',  lx: 358, ly: 312, la: 'start'  },
  { from: 'qualityCheck',  to: 'retrieve',      type: 'conditional', label: 'if revise',    lx: 14,  ly: 218, la: 'start'  },
];

const PATHS = {
  simple:    ['START', 'classify', 'simple', 'qualityCheck', 'END'],
  complex:   ['START', 'classify', 'retrieve', 'answerWithCtx', 'qualityCheck', 'END'],
  sensitive: ['START', 'classify', 'escalate', 'END'],
};

const QUERIES = {
  simple:    'What are your business hours?',
  complex:   'Why was I charged twice last month?',
  sensitive: 'Your product gave wrong medical info.',
};

const INIT_STATE = {
  query: null, category: null, retrieved_docs: null,
  draft_answer: null, quality_score: null, iterations: 0, final_answer: null,
};

function stateUpdatesFor(nodeId, preset) {
  switch (nodeId) {
    case 'START':         return { query: QUERIES[preset], iterations: 0 };
    case 'classify':      return { category: preset };
    case 'retrieve':      return { retrieved_docs: ['doc_1', 'doc_2'] };
    case 'answerWithCtx': return { draft_answer: 'Based on your account...' };
    case 'simple':        return { draft_answer: 'Hours: Mon–Fri 9am–5pm.' };
    case 'escalate':      return { final_answer: '[Human agent route]' };
    case 'qualityCheck':  return { quality_score: 0.87, iterations: 1 };
    case 'END':           return { final_answer: preset === 'sensitive' ? '[Human agent route]' : 'Response approved + sent.' };
    default:              return {};
  }
}

// --- SVG geometry ---
const HW = 60, HH = 18, CR = 22;

// Prefer vertical exit/entry for any meaningful vertical distance — gives a clean tree look.
function exitPt(n, tx, ty) {
  const dx = tx - n.x, dy = ty - n.y;
  if (n.type === 'start' || n.type === 'end') {
    const d = Math.hypot(dx, dy) || 1;
    return [n.x + (dx / d) * CR, n.y + (dy / d) * CR];
  }
  if (Math.abs(dy) > 25) return [n.x, n.y + (dy >= 0 ? HH : -HH)];
  return [n.x + (dx >= 0 ? HW : -HW), n.y];
}

function entryPt(n, fx, fy) {
  const dx = fx - n.x, dy = fy - n.y;
  if (n.type === 'start' || n.type === 'end') {
    const d = Math.hypot(dx, dy) || 1;
    return [n.x + (dx / d) * CR, n.y + (dy / d) * CR];
  }
  if (Math.abs(dy) > 25) return [n.x, n.y + (dy >= 0 ? HH : -HH)];
  return [n.x + (dx >= 0 ? HW : -HW), n.y];
}

function edgePath(fromId, toId) {
  // Revision loop: curve far left around the central column.
  if (fromId === 'qualityCheck' && toId === 'retrieve') {
    return 'M 290,280 C 30,280 30,160 290,160';
  }
  // Escalate dives down the right side to merge into END.
  if (fromId === 'escalate' && toId === 'END') {
    return 'M 610,178 C 610,290 460,328 368,328';
  }
  const fn = NODE_MAP[fromId], tn = NODE_MAP[toId];
  const [ex, ey] = exitPt(fn, tn.x, tn.y);
  const [nx, ny] = entryPt(tn, fn.x, fn.y);
  // S-curve cubic Bezier: stays vertical at start/end, transitions horizontally in the middle.
  const midY = (ey + ny) / 2;
  return `M ${ex},${ey} C ${ex},${midY} ${nx},${midY} ${nx},${ny}`;
}

function typeColor(type) {
  return type === 'llm' ? C.accent : type === 'tool' ? C.orange : type === 'human' ? C.purple : C.mid;
}

function typeIcon(type) {
  return type === 'llm' ? '🧠' : type === 'tool' ? '🔧' : type === 'human' ? '👤' : '';
}

function fmtVal(val) {
  if (val === null || val === undefined) return 'null';
  if (Array.isArray(val)) return `[${val.join(', ')}]`;
  if (typeof val === 'number') return String(val);
  const s = val.length > 26 ? val.slice(0, 25) + '…' : val;
  return `"${s}"`;
}

// --- State panel: horizontal grid of field cells ---
function FieldCell({ name, value, flashed }) {
  return (
    <div style={{
      background: flashed ? 'rgba(45,212,191,0.10)' : C.bg3,
      border: `1px solid ${flashed ? C.accent : C.border}`,
      borderRadius: '5px',
      padding: '5px 9px',
      minHeight: '38px',
      transition: 'background 280ms, border-color 280ms',
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '8.5px',
        color: C.accent, letterSpacing: '0.02em', marginBottom: '2px',
      }}>
        {name}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
        color: flashed ? C.accent : C.mid,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {fmtVal(value)}
      </div>
    </div>
  );
}

function StatePanel({ agentState, flashedFields }) {
  const row1 = ['query', 'category', 'retrieved_docs', 'draft_answer'];
  const row2 = ['quality_score', 'iterations', 'final_answer'];
  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        ...mono, fontSize: '9px', color: C.muted,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: '6px',
      }}>
        State <span style={{ color: C.muted, opacity: 0.65 }}>— passed between nodes</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
        {row1.map(f => <FieldCell key={f} name={f} value={agentState[f]} flashed={flashedFields.has(f)} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {row2.map(f => <FieldCell key={f} name={f} value={agentState[f]} flashed={flashedFields.has(f)} />)}
        <div />
      </div>
    </div>
  );
}

// --- Stats panel: 4-column horizontal sections ---
function StatsPanel({ preset, stepIdx, takenPath, totalPath }) {
  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const activeNode = totalPath && stepIdx >= 0 && stepIdx < totalPath.length ? totalPath[stepIdx] : null;
  const directCt = EDGES.filter(e => e.type === 'direct').length;
  const condCt = EDGES.filter(e => e.type === 'conditional').length;

  const SHORT = { START: 'START', classify: 'classify', simple: 'simple', retrieve: 'retrieve',
    answerWithCtx: '+ctx', escalate: 'escalate', qualityCheck: 'check', END: 'END' };
  const pathStr = takenPath.length > 0 ? takenPath.map(id => SHORT[id] || id).join(' → ') : '—';

  const Section = ({ title, titleColor, children }) => (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: '6px', padding: '8px 10px',
    }}>
      <div style={{
        ...mono, fontSize: '9px', color: titleColor || C.muted,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        marginBottom: '5px', fontWeight: 600,
      }}>
        {title}
      </div>
      {children}
    </div>
  );

  const Row = ({ label, value, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
      <span style={{ ...mono, fontSize: '8.5px', color: C.muted }}>{label}</span>
      <span style={{ ...mono, fontSize: '8.5px', color: color || C.mid, textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
      <Section title="LangGraph" titleColor={C.accent}>
        <Row label="Style" value="state-mach" />
        <Row label="Built on" value="Standalone (same maintainer)" />
        <Row label="Language" value="Python, JS" />
      </Section>

      <Section title="Graph">
        <Row label="Nodes" value={NODES.length} />
        <Row label="Direct" value={directCt} />
        <Row label="Cond." value={condCt} />
        <Row label="LLM" value={NODES.filter(n => n.type === 'llm').length} color={C.accent} />
        <Row label="Tool" value={NODES.filter(n => n.type === 'tool').length} color={C.orange} />
        <Row label="Human" value={NODES.filter(n => n.type === 'human').length} color={C.purple} />
      </Section>

      <Section title="Current run">
        <Row label="Preset" value={preset || '—'} />
        <Row label="Active" value={activeNode || '—'} color={activeNode ? C.accent : undefined} />
        <div style={{ ...mono, fontSize: '7.5px', color: C.muted, marginTop: '4px', marginBottom: '2px' }}>Path</div>
        <div style={{ ...mono, fontSize: '7.5px', color: C.mid, wordBreak: 'break-all', lineHeight: 1.5 }}>
          {pathStr}
        </div>
      </Section>

      <Section title="Trade-offs">
        {[
          { c: C.green, t: '+ Auditable flow' },
          { c: C.green, t: '+ Explicit loops' },
          { c: C.green, t: '+ Prod. reliable' },
          { c: C.red,   t: '− Upfront design' },
          { c: C.red,   t: '− Less flexible'  },
        ].map(({ c, t }) => (
          <div key={t} style={{ ...mono, fontSize: '8.5px', color: c, marginBottom: '2px' }}>{t}</div>
        ))}
      </Section>
    </div>
  );
}

// --- Main component ---
export default function LangGraphStateMachine({ tryThis }) {
  const [preset, setPreset] = useState('simple');
  const [stepIdx, setStepIdx] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [takenPath, setTakenPath] = useState([]);
  const [agentState, setAgentState] = useState(INIT_STATE);
  const [flashedFields, setFlashedFields] = useState(new Set());
  const [activeEdge, setActiveEdge] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [speed, setSpeed] = useState('normal');
  const [showLabels, setShowLabels] = useState(true);
  const [showState, setShowState] = useState(true);

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const runTimerRef = useRef(null);

  useEffect(() => {
    setIsAnimating(false);
    setStepIdx(-1);
    setTakenPath([]);
    setAgentState(INIT_STATE);
    setFlashedFields(new Set());
    setActiveEdge(null);
  }, [preset]);

  useEffect(() => {
    return () => { if (runTimerRef.current) clearTimeout(runTimerRef.current); };
  }, []);

  useEffect(() => {
    if (!isAnimating || stepIdx < 0) return;
    const path = PATHS[preset];
    if (stepIdx >= path.length - 1) {
      setIsAnimating(false);
      return;
    }

    const fromId = path[stepIdx];
    const toId = path[stepIdx + 1];
    const dd = speedRef.current === 'fast' ? 250 : 600;

    setActiveEdge({ from: fromId, to: toId });

    const t1 = setTimeout(() => {
      setActiveEdge(null);
      const next = stepIdx + 1;
      setStepIdx(next);
      setTakenPath(path.slice(0, next + 1));
      const updates = stateUpdatesFor(toId, preset);
      setAgentState(prev => ({ ...prev, ...updates }));
      setFlashedFields(new Set(Object.keys(updates)));
    }, dd);
    const t2 = setTimeout(() => setFlashedFields(new Set()), dd + 450);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isAnimating, stepIdx, preset]);

  function handleReset() {
    if (runTimerRef.current) clearTimeout(runTimerRef.current);
    setIsAnimating(false);
    setStepIdx(-1);
    setTakenPath([]);
    setAgentState(INIT_STATE);
    setFlashedFields(new Set());
    setActiveEdge(null);
  }

  function handleRun() {
    if (runTimerRef.current) clearTimeout(runTimerRef.current);
    setIsAnimating(false);
    setActiveEdge(null);
    runTimerRef.current = setTimeout(() => {
      const path = PATHS[preset];
      const updates = stateUpdatesFor(path[0], preset);
      setStepIdx(0);
      setTakenPath([path[0]]);
      setAgentState({ ...INIT_STATE, ...updates });
      setFlashedFields(new Set(Object.keys(updates)));
      setTimeout(() => setFlashedFields(new Set()), 450);
      setIsAnimating(true);
    }, 60);
  }

  function handleStep() {
    if (isAnimating) return;
    const path = PATHS[preset];
    if (stepIdx < 0) {
      const updates = stateUpdatesFor(path[0], preset);
      setStepIdx(0);
      setTakenPath([path[0]]);
      setAgentState({ ...INIT_STATE, ...updates });
      setFlashedFields(new Set(Object.keys(updates)));
      setTimeout(() => setFlashedFields(new Set()), 450);
      return;
    }
    if (stepIdx >= path.length - 1) return;

    const next = stepIdx + 1;
    const toId = path[next];
    setStepIdx(next);
    setTakenPath(path.slice(0, next + 1));
    const updates = stateUpdatesFor(toId, preset);
    setAgentState(prev => ({ ...prev, ...updates }));
    setFlashedFields(new Set(Object.keys(updates)));
    setTimeout(() => setFlashedFields(new Set()), 450);
  }

  const currentPath = PATHS[preset];
  const dotDur = speedRef.current === 'fast' ? 250 : 600;

  function getEdgeState(edge) {
    const key = `${edge.from}-${edge.to}`;
    if (activeEdge && `${activeEdge.from}-${activeEdge.to}` === key) return 'active';
    for (let i = 0; i < takenPath.length - 1; i++) {
      if (takenPath[i] === edge.from && takenPath[i + 1] === edge.to) return 'taken';
    }
    if (takenPath.length > 0 && takenPath.includes(edge.from)) return 'dim';
    return 'default';
  }

  function getNodeState(nodeId) {
    if (stepIdx >= 0 && currentPath[stepIdx] === nodeId) return 'active';
    if (takenPath.includes(nodeId)) return 'visited';
    return 'default';
  }

  function renderEdge(edge) {
    const eState = getEdgeState(edge);
    const isHov = hoveredEdge === `${edge.from}-${edge.to}`;
    const color = (eState === 'active' || eState === 'taken' || isHov)
      ? C.accent
      : edge.type === 'conditional' ? C.math : C.mid;
    const opacity = eState === 'dim' ? 0.2 : eState === 'taken' ? 0.72 : 1;
    const sw = eState === 'active' ? 2.5 : 1.5;
    const dash = edge.type === 'conditional' && eState !== 'active' && eState !== 'taken' ? '6 4' : undefined;
    const markerId = color === C.accent ? 'arrow-accent' : color === C.math ? 'arrow-math' : 'arrow-mid';
    const d = edgePath(edge.from, edge.to);

    return (
      <g key={`e-${edge.from}-${edge.to}`} opacity={opacity}
        onMouseEnter={() => setHoveredEdge(`${edge.from}-${edge.to}`)}
        onMouseLeave={() => setHoveredEdge(null)}
      >
        <path d={d} fill="none" stroke="transparent" strokeWidth={14} style={{ cursor: 'default' }} />
        <path d={d} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={dash} markerEnd={`url(#${markerId})`}
          style={{ transition: 'stroke 180ms, opacity 180ms' }}
        />
        {showLabels && edge.label && (
          <text x={edge.lx} y={edge.ly} textAnchor={edge.la}
            fill={color} fontSize={9} fontFamily="Inter, sans-serif" fontStyle="italic"
            opacity={eState === 'dim' ? 0.3 : 0.85}
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  }

  function renderNode(node) {
    const nState = getNodeState(node.id);
    const isActive = nState === 'active';
    const color = typeColor(node.type);
    const icon = typeIcon(node.type);

    const nodeOpacity = (takenPath.length > 0 || isAnimating) && !takenPath.includes(node.id) && !isActive
      ? 0.38 : 1;

    const fillRgb = node.type === 'llm' ? '45,212,191'
      : node.type === 'tool' ? '251,146,60'
      : node.type === 'human' ? '167,139,250'
      : '45,212,191';
    const fill = (node.type === 'start' || node.type === 'end')
      ? (isActive ? C.accentDim : 'rgba(15,15,15,0.9)')
      : `rgba(${fillRgb},${isActive ? 0.28 : 0.14})`;

    const strokeColor = isActive
      ? (node.type === 'start' || node.type === 'end' ? C.accent : color)
      : color;
    const sw = isActive ? 2.5 : 1.5;
    const filter = isActive ? `drop-shadow(0 0 6px rgba(${fillRgb},0.55))` : undefined;

    if (node.type === 'start' || node.type === 'end') {
      return (
        <g key={node.id} opacity={nodeOpacity} style={filter ? { filter } : undefined}>
          <circle cx={node.x} cy={node.y} r={CR} fill={fill} stroke={strokeColor} strokeWidth={sw} />
          <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle"
            fill={isActive ? C.accent : C.mid}
            fontSize={11} fontFamily="JetBrains Mono, monospace" fontWeight="600"
          >
            {node.label}
          </text>
        </g>
      );
    }

    return (
      <g key={node.id} opacity={nodeOpacity} style={filter ? { filter } : undefined}>
        <rect x={node.x - HW} y={node.y - HH} width={120} height={36} rx={8}
          fill={fill} stroke={strokeColor} strokeWidth={sw}
          strokeDasharray={node.type === 'human' ? '6 3' : undefined}
        />
        {icon && (
          <text x={node.x - 50} y={node.y + 1}
            textAnchor="start" dominantBaseline="middle" fontSize={13}
          >
            {icon}
          </text>
        )}
        <text
          x={icon ? node.x - 32 : node.x}
          y={node.y}
          textAnchor={icon ? 'start' : 'middle'}
          dominantBaseline="middle"
          fill={color} fontSize={11} fontFamily="Inter, sans-serif"
        >
          {node.label}
        </text>
      </g>
    );
  }

  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const btnBase = {
    ...mono, fontSize: '10px', padding: '5px 12px', borderRadius: '5px',
    cursor: 'pointer', border: `1px solid ${C.border}`,
    background: C.bg4, color: C.text,
    transition: 'background 150ms, border-color 150ms, color 150ms',
  };
  const activeBtnStyle = { border: `1px solid ${C.accent}`, background: C.accentDim, color: C.accent };

  const canCompleteStep = !isAnimating && stepIdx < currentPath.length - 1;

  return (
    <WidgetCard title="LangGraph — agent control as a state machine" number="25.5" tryThis={tryThis}>

      {/* Row 1: preset tabs + speed */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {['simple', 'complex', 'sensitive'].map(p => (
          <button key={p} onClick={() => setPreset(p)} style={{
            ...btnBase, ...(preset === p ? activeBtnStyle : {}),
          }}>
            {p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ ...mono, fontSize: '9px', color: C.muted }}>Speed:</span>
        {['normal', 'fast'].map(s => (
          <button key={s} onClick={() => setSpeed(s)} style={{
            ...btnBase, ...(speed === s ? activeBtnStyle : {}),
          }}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Query display */}
      <div style={{
        ...mono, fontSize: '10px', color: C.math,
        background: C.bg3, padding: '5px 12px', borderRadius: '5px',
        marginBottom: '12px', borderLeft: `2px solid ${C.math}`,
      }}>
        Query: "{QUERIES[preset]}"
      </div>

      {/* SVG diagram — full width */}
      <div style={{ marginBottom: '12px' }}>
        <svg viewBox="0 0 700 370" width="100%"
          style={{ display: 'block', background: C.codeBg, borderRadius: '8px' }}
        >
          <defs>
            {[
              { id: 'arrow-mid',    color: C.mid    },
              { id: 'arrow-math',   color: C.math   },
              { id: 'arrow-accent', color: C.accent },
            ].map(({ id, color }) => (
              <marker key={id} id={id}
                viewBox="0 0 10 7" refX="8" refY="3.5"
                markerWidth="7" markerHeight="7" orient="auto"
              >
                <path d="M 0 0 L 10 3.5 L 0 7 z" fill={color} />
              </marker>
            ))}
            {EDGES.map(edge => (
              <path key={`ep-${edge.from}-${edge.to}`}
                id={`ep-${edge.from}-${edge.to}`}
                d={edgePath(edge.from, edge.to)}
                fill="none"
              />
            ))}
          </defs>

          {EDGES.map(edge => renderEdge(edge))}

          {activeEdge && (
            <circle key={`dot-${stepIdx}`} r={5} fill={C.accent}
              style={{ filter: `drop-shadow(0 0 4px ${C.accent})` }}
            >
              <animateMotion dur={`${dotDur / 1000}s`} fill="freeze">
                <mpath href={`#ep-${activeEdge.from}-${activeEdge.to}`} />
              </animateMotion>
            </circle>
          )}

          {NODES.map(node => renderNode(node))}
        </svg>
      </div>

      {/* Action controls + toggles */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleRun} disabled={isAnimating} style={{
          ...btnBase,
          background: isAnimating ? C.bg3 : C.accentDim,
          border: `1px solid ${isAnimating ? C.border : C.accent}`,
          color: isAnimating ? C.muted : C.accent,
          cursor: isAnimating ? 'not-allowed' : 'pointer',
        }}>
          ▶ Run Graph
        </button>
        <button onClick={handleStep} disabled={!canCompleteStep} style={{
          ...btnBase,
          opacity: canCompleteStep ? 1 : 0.45,
          cursor: canCompleteStep ? 'pointer' : 'not-allowed',
        }}>
          Step →
        </button>
        <button onClick={handleReset} style={btnBase}>↺ Reset</button>

        <div style={{ flex: 1 }} />

        <label style={{ ...mono, fontSize: '10px', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)}
            style={{ accentColor: C.accent }} />
          Edge labels
        </label>
        <label style={{ ...mono, fontSize: '10px', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input type="checkbox" checked={showState} onChange={e => setShowState(e.target.checked)}
            style={{ accentColor: C.accent }} />
          State panel
        </label>
      </div>

      {/* State panel — horizontal grid below the diagram */}
      {showState && (
        <StatePanel agentState={agentState} flashedFields={flashedFields} />
      )}

      {/* Stats panel — 4-column horizontal sections */}
      <StatsPanel
        preset={preset}
        stepIdx={stepIdx}
        takenPath={takenPath}
        totalPath={currentPath}
      />

      {/* Benefits callout */}
      <div style={{
        background: C.bg4, borderRadius: '8px', padding: '14px 18px',
      }}>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: '12px',
          fontWeight: 600, color: C.text, marginBottom: '6px',
        }}>
          Why graph-based control matters
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: '11px',
          color: '#b8c4cc', lineHeight: 1.55,
        }}>
          An LLM that decides what to do next in unstructured prose tends to drift.
          A state machine that gives the LLM only routing decisions to make is easier
          to evaluate, debug, and reproduce. The trade is upfront design work for
          runtime reliability — preferred when production reliability matters more
          than agent flexibility.
        </div>
      </div>

    </WidgetCard>
  );
}
