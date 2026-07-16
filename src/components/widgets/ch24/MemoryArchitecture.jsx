import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  math:      '#fbbf24',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  mid:       '#888888',
  text:      '#e8eaed',
  prose:     '#b8c4cc',
};

// logVal is an order-of-magnitude capacity rank (each +1 ~= 10x more capacity),
// used by both the diagram glow ordering and CapacityChart below — kept on MEM
// itself so the two can't drift out of sync with each other or with capStat.
const MEM = {
  context: {
    name: 'In-Context',
    color: C.accent,
    capacity: '200K – 2M tokens',
    speed: 'Instant (0ms)',
    capStat: '200K – 2M tokens',
    speedStat: '0ms (already loaded)',
    persistStat: 'No (session)',
    logVal: 1,
  },
  external: {
    name: 'External / Vector',
    color: C.orange,
    capacity: 'Billions of docs',
    speed: '50 – 500ms',
    capStat: 'Billions of docs',
    speedStat: '50 – 500ms',
    persistStat: 'Yes (DB)',
    logVal: 6,
  },
  episodic: {
    name: 'Episodic',
    color: C.purple,
    capacity: '10K – 100K episodes',
    speed: '10 – 100ms',
    capStat: '10K – 100K episodes',
    speedStat: '10 – 100ms',
    persistStat: 'Yes (store)',
    logVal: 3,
  },
  working: {
    name: 'Working',
    color: C.math,
    capacity: '~10K tokens',
    speed: 'Instant (0ms)',
    capStat: '~10K tokens',
    speedStat: '0ms (in scratchpad)',
    persistStat: 'Task only',
    logVal: 0,
  },
};

// logVal -> a human-readable "order of magnitude" label for the capacity chart.
const LOG_VAL_LABEL = { 0: '1 unit', 1: '10 units', 3: '1K units', 6: '1M units' };

const SCENARIOS = {
  context: {
    label: 'Current conversation',
    query: 'What did you just tell me about Python syntax?',
    explanation: 'The answer is already in the conversation window. No retrieval needed — pure in-context lookup.',
    steps: ['Receive query', 'Scan context window', 'Return answer directly'],
    speed: '0ms',
  },
  external: {
    label: 'Company policy',
    query: "What does our company's refund policy say?",
    explanation: 'Policy document not in context. Embed the query, find top-k similar chunks, insert into context, then answer.',
    steps: ['Embed query → vector', 'Similarity search top-k', 'Insert chunks into context'],
    speed: '50–500ms',
  },
  episodic: {
    label: 'Past task',
    query: 'What approach did we use for the auth bug last week?',
    explanation: 'Retrieve past episode record from episodic store. Summarize relevant context from past interaction.',
    steps: ['Query episodic store', 'Retrieve episode by relevance', 'Summarize past context'],
    speed: '10–100ms',
  },
  working: {
    label: 'Multi-step',
    query: 'Summarize all 10 files in the /docs folder.',
    explanation: 'Agent maintains running state: {files_done: 4, files_remaining: 6}. Updated at each step without re-reading all context.',
    steps: ['Init state {files_done: 0}', 'Process each file in loop', 'Update state after each step'],
    speed: '0ms',
  },
};

// SVG coordinate space
const VW = 540, VH = 300;
const AGENT = { x: 190, y: 10, w: 160, h: 48 };
// Agent bottom-center: (270, 58)

const BOXES = {
  context:  { x: 20,  y: 110, w: 220, h: 72 },
  external: { x: 300, y: 110, w: 220, h: 72 },
  episodic: { x: 20,  y: 210, w: 220, h: 72 },
  working:  { x: 300, y: 210, w: 220, h: 72 },
};

// Tree-style routing: agent → junction (270,85) → column centers → boxes
// Avoids paths crossing through sibling boxes
const ARROW_PATHS = {
  context:  'M 270,58 L 270,85 L 130,85 L 130,110',
  external: 'M 270,58 L 270,85 L 410,85 L 410,110',
  episodic: 'M 270,58 L 270,85 L 130,85 L 130,210',
  working:  'M 270,58 L 270,85 L 410,85 L 410,210',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'baseline', marginBottom: '3px', gap: '4px',
    }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: C.muted, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: color || C.mid, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }}/>;
}

function MemoryDiagram({ active }) {
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
      <defs>
        {Object.entries(MEM).map(([key, m]) => (
          <filter key={key} id={`ma-glow-${key}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
            <feFlood floodColor={m.color} floodOpacity="0.4" result="flood"/>
            <feComposite in="flood" in2="blur" operator="in" result="cg"/>
            <feMerge><feMergeNode in="cg"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        ))}

        {Object.entries(BOXES).map(([key, b]) => (
          <clipPath key={key} id={`ma-clip-${key}`}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={8}/>
          </clipPath>
        ))}

        <marker id="ma-arr-dim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill={C.borderLt}/>
        </marker>
        {Object.entries(MEM).map(([key, m]) => (
          <marker key={key} id={`ma-arr-${key}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0,8 3,0 6" fill={m.color}/>
          </marker>
        ))}
      </defs>

      {/* Arrows */}
      {Object.entries(ARROW_PATHS).map(([key, d]) => {
        const isActive = key === active;
        const m = MEM[key];
        return (
          <g key={key}>
            <path
              id={`ma-path-${key}`}
              d={d}
              fill="none"
              stroke={isActive ? m.color : C.borderLt}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray={isActive ? undefined : '4 3'}
              markerEnd={`url(#${isActive ? `ma-arr-${key}` : 'ma-arr-dim'})`}
              style={{ transition: 'stroke 300ms ease, stroke-width 300ms ease' }}
            />
            {isActive && (
              <circle r={4} fill={m.color}>
                <animateMotion dur="1.4s" repeatCount="indefinite">
                  <mpath href={`#ma-path-${key}`}/>
                </animateMotion>
              </circle>
            )}
          </g>
        );
      })}

      {/* Agent box */}
      <g filter={active ? `url(#ma-glow-${active})` : undefined}>
        <rect
          x={AGENT.x} y={AGENT.y} width={AGENT.w} height={AGENT.h} rx={8}
          fill={C.bg4}
          stroke={active ? MEM[active].color : C.border}
          strokeWidth={1.5}
          style={{ transition: 'stroke 300ms ease' }}
        />
        <text
          x={AGENT.x + AGENT.w / 2} y={AGENT.y + AGENT.h / 2}
          textAnchor="middle" dominantBaseline="central"
          fontFamily="'Inter', sans-serif" fontSize={13}
          fill={C.text}
        >
          Agent
        </text>
      </g>

      {/* Memory boxes */}
      {Object.entries(BOXES).map(([key, b]) => {
        const isActive = key === active;
        const m = MEM[key];
        return (
          <g key={key} filter={isActive ? `url(#ma-glow-${key})` : undefined}>
            <g clipPath={`url(#ma-clip-${key})`}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={8} fill={C.bg3}/>
              <rect x={b.x} y={b.y} width={b.w} height={28} fill={m.color} fillOpacity={0.15}/>
              <rect x={b.x + 10} y={b.y + 9} width={10} height={10} rx={2} fill={m.color} opacity={0.8}/>
              <text
                x={b.x + 26} y={b.y + 14} dominantBaseline="central"
                fontFamily="'JetBrains Mono', monospace" fontSize={11}
                fill={m.color}
              >{m.name}</text>
              <text
                x={b.x + 10} y={b.y + 45}
                fontFamily="'Inter', sans-serif" fontSize={9}
                fill={C.muted}
              >Capacity: {m.capacity}</text>
              <text
                x={b.x + 10} y={b.y + 61}
                fontFamily="'Inter', sans-serif" fontSize={9}
                fill={C.muted}
              >Speed: {m.speed}</text>
            </g>
            <rect
              x={b.x} y={b.y} width={b.w} height={b.h} rx={8}
              fill="none"
              stroke={isActive ? m.color : C.border}
              strokeWidth={isActive ? 2 : 1.5}
              style={{ transition: 'stroke 300ms ease, stroke-width 300ms ease' }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function DetailPanel({ active }) {
  const sc = active ? SCENARIOS[active] : null;
  const m = active ? MEM[active] : null;

  return (
    <div style={{
      overflow: 'hidden',
      maxHeight: active ? '220px' : '0px',
      transition: 'max-height 300ms ease',
    }}>
      {sc && m && (
        <div style={{ background: C.bg3, borderTop: `1px solid ${C.border}`, padding: '14px 18px' }}>
          {/* Query */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '9px' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
              color: C.muted, paddingTop: '2px', flexShrink: 0,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Query</span>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: '12px',
              color: C.text, fontStyle: 'italic', lineHeight: 1.4,
            }}>
              "{sc.query}"
            </span>
          </div>

          {/* Memory type badge + speed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: C.muted }}>
              Memory type used:
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
              color: m.color,
              background: `${m.color}22`,
              border: `1px solid ${m.color}55`,
              borderRadius: '4px', padding: '2px 8px',
            }}>{m.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: C.mid }}>
              {sc.speed}
            </span>
          </div>

          {/* Explanation */}
          <p style={{
            margin: '0 0 8px',
            fontFamily: "'Inter', sans-serif", fontSize: '12px',
            color: C.prose, lineHeight: 1.55,
          }}>
            {sc.explanation}
          </p>

          {/* How: steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
              color: C.muted, flexShrink: 0,
            }}>How:</span>
            {sc.steps.map((step, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {i > 0 && <span style={{ color: C.muted, fontSize: '9px' }}>→</span>}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.mid }}>
                  {step}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CapacityChart() {
  // Derived from MEM's own logVal (not a second hand-maintained ranking) so
  // this chart can't silently drift out of sync with MEM's capStat figures.
  const order = ['context', 'working', 'episodic', 'external'];
  const entries = order.map(key => ({
    key,
    label: MEM[key].name,
    logVal: MEM[key].logVal,
    valueLabel: LOG_VAL_LABEL[MEM[key].logVal],
  }));

  return (
    <div style={{
      marginTop: '10px',
      padding: '12px 14px',
      background: C.bg4,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
        color: C.muted, marginBottom: '10px',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Relative capacity — log scale (each step = 10×)
      </div>
      {entries.map(({ key, label, valueLabel, logVal }) => {
        const m = MEM[key];
        const pct = Math.max(5, ((logVal + 1) / 7) * 100);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
            <div style={{
              width: '110px', flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
              color: m.color, textAlign: 'right',
            }}>
              {label}
            </div>
            <div style={{
              flex: 1, height: '8px',
              background: C.border, borderRadius: '4px', overflow: 'hidden',
            }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: m.color, opacity: 0.7, borderRadius: '4px',
              }}/>
            </div>
            <div style={{
              width: '52px', flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
              color: C.mid,
            }}>
              {valueLabel}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatsPanel({ active }) {
  const sc = active ? SCENARIOS[active] : null;
  const m = active ? MEM[active] : null;

  return (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: '8px', padding: '12px',
    }}>
      <StatRow label="Mem types" value="4" color={C.accent}/>
      <Divider/>

      {Object.entries(MEM).map(([key, mem]) => (
        <div key={key} style={{ marginBottom: '10px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
            color: mem.color, marginBottom: '3px',
          }}>
            {mem.name}:
          </div>
          <StatRow label="Capacity" value={mem.capStat}/>
          <StatRow label="Speed" value={mem.speedStat}/>
          <StatRow label="Persist" value={mem.persistStat}/>
        </div>
      ))}

      <Divider/>
      <StatRow label="Scene" value={sc ? sc.label : '—'} color={m ? m.color : C.muted}/>
      <StatRow label="Mem used" value={m ? m.name : '—'} color={m ? m.color : C.muted}/>
      <StatRow label="Retrieval" value={sc ? sc.speed : '—'} color={m ? m.color : C.muted}/>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MemoryArchitecture({ tryThis }) {
  const [active, setActive] = useState(null);
  const [showCap, setShowCap] = useState(false);

  function tabStyle(key) {
    const on = key === active;
    const col = MEM[key].color;
    return {
      padding: '5px 12px',
      background: on ? `${col}22` : C.bg4,
      color: on ? col : C.mid,
      border: `1px solid ${on ? col : C.border}`,
      borderRadius: '6px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      cursor: 'pointer',
      transition: 'all 150ms ease',
    };
  }

  const capToggleStyle = {
    padding: '4px 10px',
    background: showCap ? C.accentDim : 'transparent',
    color: showCap ? C.accent : C.mid,
    border: `1px solid ${showCap ? C.accent : C.borderLt}`,
    borderRadius: '5px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  return (
    <WidgetCard title="Memory Architecture — four types of agent memory" number="24.3" tryThis={tryThis}>
      {/* Scenario tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button
            key={key}
            onClick={() => setActive(prev => prev === key ? null : key)}
            style={tabStyle(key)}
          >
            {sc.label}
          </button>
        ))}
      </div>

      {/* Main area: diagram + stats panel */}
      <div data-mobile-stack style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Left column: diagram + detail + controls */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <MemoryDiagram active={active}/>
          <DetailPanel active={active}/>

          {/* Hint when nothing selected */}
          {!active && (
            <div style={{
              padding: '10px 14px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px', color: C.muted,
              borderTop: `1px solid ${C.border}`,
            }}>
              ← Select a query to see which memory it uses.
            </div>
          )}

          {/* Capacity comparison toggle */}
          <div style={{ marginTop: '12px' }}>
            <button onClick={() => setShowCap(s => !s)} style={capToggleStyle}>
              {showCap ? '▾' : '▸'} Capacity comparison
            </button>
          </div>

          {showCap && <CapacityChart/>}
        </div>

        {/* Right column: stats panel */}
        <div data-mobile-panel style={{ width: 180, flexShrink: 0 }}>
          <StatsPanel active={active}/>
        </div>
      </div>
    </WidgetCard>
  );
}
