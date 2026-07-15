import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  math:      '#fbbf24',
  green:     '#34d399',
  blue:      '#60a5fa',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  codeBg:    '#0a0a0a',
  text:      '#e8eaed',
  mid:       '#888888',
  muted:     '#555555',
};

function hexRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const PRIMITIVES = [
  { id: 'llm',       name: 'LLM / ChatModel',  icon: '🧠', color: C.accent,
    desc: 'The language model itself. Inputs text, outputs text.',
    apiNote: 'ChatAnthropic, ChatOpenAI, etc.' },
  { id: 'prompt',    name: 'Prompt Template',   icon: '📝', color: C.orange,
    desc: 'Parameterized prompt with input variables to fill in.',
    apiNote: 'ChatPromptTemplate.from_messages([...])' },
  { id: 'retriever', name: 'Retriever',          icon: '📚', color: C.purple,
    desc: 'Fetches relevant documents from a vector store.',
    apiNote: 'VectorStoreRetriever, BM25Retriever, ...' },
  { id: 'tool',      name: 'Tool',               icon: '🔧', color: C.math,
    desc: "Function the agent can call. Has name, description, schema.",
    apiNote: '@tool decorator or Tool() class' },
  { id: 'memory',    name: 'Memory',             icon: '💾', color: C.green,
    desc: 'Stores conversation history, summaries, or other state.',
    apiNote: 'MemorySaver / checkpointers (LangGraph)' },
  { id: 'chain',     name: 'Chain / Runnable',   icon: '⛓',  color: C.blue,
    desc: 'Composes other primitives into a runnable sequence.',
    apiNote: 'primitive | primitive | ... (LCEL syntax)' },
];

const PRIM_MAP = Object.fromEntries(PRIMITIVES.map(p => [p.id, p]));

const PRESET_PRIMS = {
  basicRag:     new Set(['llm', 'prompt', 'retriever', 'chain']),
  toolAgent:    new Set(['llm', 'prompt', 'tool', 'memory', 'chain']),
  convRagTools: new Set(['llm', 'prompt', 'retriever', 'tool', 'memory', 'chain']),
};

const PRESETS = [
  { key: 'basicRag',     label: 'Basic RAG',            name: 'Basic RAG' },
  { key: 'toolAgent',    label: 'Tool-Using Agent',      name: 'Tool-Using Agent' },
  { key: 'convRagTools', label: 'Conversational + Tools', name: 'Conv. RAG + Tools' },
];

// which presets each primitive appears in
const PRIM_PRESETS = {
  llm:       'A, B, C',
  prompt:    'A, B, C',
  retriever: 'A, C only',
  tool:      'B, C only',
  memory:    'B, C only',
  chain:     'A, B, C',
};

// ── SVG Building Blocks ───────────────────────────────────────────────────────

function ArrDef({ id = 'arr' }) {
  return (
    <defs>
      <marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M 0,0 L 5,3 L 0,6 Z" fill={C.mid} />
      </marker>
    </defs>
  );
}

// Primitive-colored flowchart box
function PBox({ x, y, w = 230, h = 44, prim, desc }) {
  const p = PRIM_MAP[prim];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={C.bg3} stroke={p.color} strokeWidth={1.5} />
      {/* header strip */}
      <rect x={x} y={y} width={w} height={17} rx={5} fill={hexRgba(p.color, 0.12)} />
      <rect x={x} y={y + 11} width={w} height={6} fill={hexRgba(p.color, 0.12)} />
      <text x={x + 8} y={y + 9} fontSize={10} fill={p.color}
            fontFamily="Inter, sans-serif" dominantBaseline="middle">
        {p.icon} {p.name}
      </text>
      <text x={x + 8} y={y + 30} fontSize={9} fill={C.mid}
            fontFamily="Inter, sans-serif" dominantBaseline="middle">
        {desc}
      </text>
    </g>
  );
}

// Neutral box (user input / response nodes)
function NBox({ x, y, w = 150, h = 30, label }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={C.bg4} stroke={C.borderLt} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + h / 2} fontSize={11} fill={C.text}
            fontFamily="Inter, sans-serif" textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </g>
  );
}

// Vertical downward arrow
function VArr({ cx, y1, y2, label, aid = 'arr' }) {
  return (
    <g>
      <line x1={cx} y1={y1} x2={cx} y2={y2} stroke={C.mid} strokeWidth={1.5}
            markerEnd={`url(#${aid})`} />
      {label && (
        <text x={cx + 7} y={(y1 + y2) / 2} fontSize={9} fill={C.muted}
              fontFamily="Inter, sans-serif" dominantBaseline="middle">
          {label}
        </text>
      )}
    </g>
  );
}

// ── Flowchart A: Basic RAG ────────────────────────────────────────────────────

function BasicRagSVG() {
  const cx = 192, bw = 222, bx = cx - bw / 2;
  const nw = 148, nx = cx - nw / 2;
  const bh = 44, nbh = 30;
  const y1 = 10, y2 = 54, y3 = 114, y4 = 174, y5 = 234;
  // bracket spans retriever → llm bottom
  const bkTop = y2 - 4, bkBot = y4 + bh + 4;
  const bkX = bx + bw + 6;

  return (
    <svg viewBox="0 0 390 272" width="100%" style={{ display: 'block' }}>
      <ArrDef />

      <NBox x={nx} y={y1} w={nw} h={nbh} label="User Question" />
      <VArr cx={cx} y1={y1 + nbh} y2={y2} label="query" />

      <PBox x={bx} y={y2} w={bw} h={bh} prim="retriever" desc="Fetches relevant documents" />
      <VArr cx={cx} y1={y2 + bh} y2={y3} label="docs" />

      <PBox x={bx} y={y3} w={bw} h={bh} prim="prompt" desc="Assembles context + question" />
      <VArr cx={cx} y1={y3 + bh} y2={y4} />

      <PBox x={bx} y={y4} w={bw} h={bh} prim="llm" desc="Generates the answer" />
      <VArr cx={cx} y1={y4 + bh} y2={y5} />

      <NBox x={nx} y={y5} w={nw} h={nbh} label="Answer" />

      {/* Chain bracket (right side) */}
      <line x1={bkX} y1={bkTop} x2={bkX} y2={bkBot} stroke={hexRgba(C.blue, 0.35)} strokeWidth={1} strokeDasharray="3,3" />
      <line x1={bx + bw + 2} y1={bkTop} x2={bkX} y2={bkTop} stroke={hexRgba(C.blue, 0.35)} strokeWidth={1} />
      <line x1={bx + bw + 2} y1={bkBot} x2={bkX} y2={bkBot} stroke={hexRgba(C.blue, 0.35)} strokeWidth={1} />
      <text
        x={bkX + 9} y={(bkTop + bkBot) / 2}
        fontSize={8} fill={hexRgba(C.blue, 0.6)}
        fontFamily="Inter, sans-serif" textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(-90, ${bkX + 9}, ${(bkTop + bkBot) / 2})`}
      >
        ⛓ Chain (LCEL)
      </text>
    </svg>
  );
}

// ── Flowchart B: Tool-Using Agent ─────────────────────────────────────────────

function ToolAgentSVG() {
  const cx = 192, bw = 222, bx = cx - bw / 2;
  const nw = 148, nx = cx - nw / 2;
  const bh = 44, nbh = 30;
  // main column nodes
  const y1 = 10, y2 = 54, y3 = 112, y4 = 170;
  // branch fork
  const forkStem = y4 + bh;       // 214
  const forkBar  = forkStem + 16; // 230
  const branchY  = forkBar + 8;   // 238
  // branch centers
  const lcx = 100, rcx = 284;
  const bBw = 142;
  const lbx = lcx - bBw / 2, rbx = rcx - bBw / 2;
  const rh = 44;

  return (
    <svg viewBox="0 0 390 300" width="100%" style={{ display: 'block' }}>
      <ArrDef id="arr2" />

      <NBox x={nx} y={y1} w={nw} h={nbh} label="User Input" />
      <VArr cx={cx} y1={y1 + nbh} y2={y2} aid="arr2" />

      <PBox x={bx} y={y2} w={bw} h={bh} prim="memory" desc="Loads conversation history" />
      <VArr cx={cx} y1={y2 + bh} y2={y3} aid="arr2" />

      <PBox x={bx} y={y3} w={bw} h={bh} prim="prompt" desc="Msgs + tool descriptions" />
      <VArr cx={cx} y1={y3 + bh} y2={y4} aid="arr2" />

      <PBox x={bx} y={y4} w={bw} h={bh} prim="llm" desc="Respond or call tool?" />

      {/* Fork stem */}
      <line x1={cx} y1={forkStem} x2={cx} y2={forkBar} stroke={C.mid} strokeWidth={1.5} />
      {/* Horizontal bar */}
      <line x1={lcx} y1={forkBar} x2={rcx} y2={forkBar} stroke={C.mid} strokeWidth={1.5} />
      {/* Left drop */}
      <line x1={lcx} y1={forkBar} x2={lcx} y2={branchY} stroke={C.mid} strokeWidth={1.5} markerEnd="url(#arr2)" />
      {/* Right drop */}
      <line x1={rcx} y1={forkBar} x2={rcx} y2={branchY} stroke={C.mid} strokeWidth={1.5} markerEnd="url(#arr2)" />

      {/* Branch labels */}
      <text x={lcx} y={forkBar - 4} fontSize={8} fill={C.muted} fontFamily="Inter, sans-serif" textAnchor="middle">
        respond
      </text>
      <text x={rcx} y={forkBar - 4} fontSize={8} fill={C.muted} fontFamily="Inter, sans-serif" textAnchor="middle">
        call tool
      </text>

      {/* Left branch: Response */}
      <NBox x={lbx} y={branchY} w={bBw} h={nbh} label="Response" />

      {/* Right branch: Tool */}
      <PBox x={rbx} y={branchY} w={bBw} h={rh} prim="tool" desc="Executes, returns result" />

      {/* Return loop: Tool → LLM */}
      <path
        d={`M ${rbx + bBw},${branchY + rh / 2} C 378,${branchY + rh / 2} 378,${y4 + bh / 2} ${bx + bw},${y4 + bh / 2}`}
        fill="none" stroke={hexRgba(C.math, 0.45)} strokeWidth={1.5} strokeDasharray="4,3"
        markerEnd="url(#arr2)"
      />
      <text x={380} y={(branchY + y4 + bh) / 2} fontSize={8} fill={hexRgba(C.math, 0.6)}
            fontFamily="Inter, sans-serif" textAnchor="middle" dominantBaseline="middle"
            transform={`rotate(-90, 380, ${(branchY + y4 + bh) / 2})`}>
        result ↑
      </text>
    </svg>
  );
}

// ── Flowchart C: Conversational RAG + Tools ───────────────────────────────────

function ConvRagToolsSVG() {
  const cx = 192, bw = 222, bx = cx - bw / 2;
  const nw = 148, nx = cx - nw / 2;
  const bh = 40, nbh = 28;
  const gap = 12;
  // y positions
  const y0 = 10;                             // User Msg (neutral)
  const y1 = y0 + nbh + gap;                // Memory     50
  const y2 = y1 + bh + gap;                 // Retriever  102
  const y3 = y2 + bh + gap;                 // Prompt     154
  const y4 = y3 + bh + gap;                 // LLM        206
  const y5 = y4 + bh + gap;                 // Tool       258
  const y6 = y5 + bh + gap;                 // Response   310
  const totalH = y6 + nbh + 8;              // 346

  // feedback loop curve (right side): response → memory
  const memR   = bx + bw;   // right edge of Memory box
  const respR  = bx + bw;   // right edge of Response box (same column)
  const loopX  = 364;       // x for the curve's right extent

  return (
    <svg viewBox={`0 0 390 ${totalH}`} width="100%" style={{ display: 'block' }}>
      <ArrDef id="arr3" />

      <NBox x={nx} y={y0} w={nw} h={nbh} label="User Msg" />
      <VArr cx={cx} y1={y0 + nbh} y2={y1} aid="arr3" />

      <PBox x={bx} y={y1} w={bw} h={bh} prim="memory" desc="Loads conversation context" />
      <VArr cx={cx} y1={y1 + bh} y2={y2} aid="arr3" />

      <PBox x={bx} y={y2} w={bw} h={bh} prim="retriever" desc="Fetches relevant docs" />
      <VArr cx={cx} y1={y2 + bh} y2={y3} aid="arr3" />

      <PBox x={bx} y={y3} w={bw} h={bh} prim="prompt" desc="Combines history + docs + query" />
      <VArr cx={cx} y1={y3 + bh} y2={y4} aid="arr3" />

      <PBox x={bx} y={y4} w={bw} h={bh} prim="llm" desc="Reason + plan tool calls" />
      <VArr cx={cx} y1={y4 + bh} y2={y5} label="if needed" aid="arr3" />

      <PBox x={bx} y={y5} w={bw} h={bh} prim="tool" desc="Optional: executes tool(s)" />
      <VArr cx={cx} y1={y5 + bh} y2={y6} aid="arr3" />

      <NBox x={nx} y={y6} w={nw} h={nbh} label="Response" />

      {/* Feedback arrow: Response right → Memory right (next turn) */}
      <path
        d={`M ${nx + nw},${y6 + nbh / 2} C ${loopX},${y6 + nbh / 2} ${loopX},${y1 + bh / 2} ${memR},${y1 + bh / 2}`}
        fill="none" stroke={hexRgba(C.green, 0.4)} strokeWidth={1.5} strokeDasharray="4,3"
        markerEnd="url(#arr3)"
      />
      <text
        x={loopX + 8} y={(y1 + y6) / 2}
        fontSize={8} fill={hexRgba(C.green, 0.55)}
        fontFamily="Inter, sans-serif" textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(-90, ${loopX + 8}, ${(y1 + y6) / 2})`}
      >
        next turn
      </text>
    </svg>
  );
}

// ── Code Preview ──────────────────────────────────────────────────────────────

const kw = s => <span style={{ color: C.purple }}>{s}</span>;
const st = s => <span style={{ color: C.green }}>{s}</span>;
const fn = s => <span style={{ color: C.accent }}>{s}</span>;
const cm = s => <span style={{ color: C.muted }}>{s}</span>;
const v  = s => <span style={{ color: C.text }}>{s}</span>;

const CODE = {
  basicRag: (
    <>
      {cm('# Basic RAG with LangChain')}{'\n'}
      {v('retriever')} {'= '}{fn('vectorstore.as_retriever')}{'()'}{'\n'}
      {v('prompt')} {'= '}{fn('ChatPromptTemplate.from_template')}{'('}{'\n'}
      {'    '}{st('"Answer based on:\\n{context}\\n\\nQ: {question}"')}{'\n'}
      {')'}{'\n'}
      {v('llm')} {'= '}{fn('ChatAnthropic')}{'(model='}{st('"claude-sonnet-4"')}{')'}{'\n'}
      {'\n'}
      {v('chain')} {'= ('}{'\n'}
      {'    {'}{'"context": '}{v('retriever')}{', "question": '}{fn('RunnablePassthrough')}{'()'}{'}'}{'\n'}
      {'    '}{kw('|')}{' '}{v('prompt')}{' '}{kw('|')}{' '}{v('llm')}{' '}{kw('|')}{' '}{fn('StrOutputParser')}{'()'}{'\n'}
      {')'}
    </>
  ),
  toolAgent: (
    <>
      {cm('# Tool-using agent (legacy langchain_classic API — current idiom is create_agent)')}{'\n'}
      {v('tools')} {'= ['}{v('search_tool')}{', '}{v('calculator_tool')}{']'}{'\n'}
      {v('memory')} {'= '}{fn('ConversationBufferMemory')}{'()'}{'\n'}
      {v('agent')} {'= '}{fn('create_tool_calling_agent')}{'('}{'\n'}
      {'    '}{v('llm')}{'='}{fn('ChatAnthropic')}{'(model='}{st('"claude-opus-4"')}{')'}{','}{'\n'}
      {'    '}{v('tools')}{'='}{v('tools')}{','}{'\n'}
      {'    '}{v('prompt')}{'='}{v('agent_prompt')}{','}{'\n'}
      {')'}{'\n'}
      {v('executor')} {'= '}{fn('AgentExecutor')}{'('}{'\n'}
      {'    '}{v('agent')}{'='}{v('agent')}{', '}{v('tools')}{'='}{v('tools')}{', '}{v('memory')}{'='}{v('memory')}{','}{'\n'}
      {')'}
    </>
  ),
  convRagTools: (
    <>
      {cm('# Conversational RAG with tools (legacy langchain_classic API)')}{'\n'}
      {v('retriever')} {'= '}{fn('vectorstore.as_retriever')}{'()'}{'\n'}
      {v('tools')} {'= ['}{v('retriever_tool')}{', '}{v('search_tool')}{', '}{v('calc_tool')}{']'}{'\n'}
      {v('memory')} {'= '}{fn('ConversationSummaryMemory')}{'(llm='}{v('llm')}{')'}{'\n'}
      {'\n'}
      {v('agent')} {'= '}{fn('create_tool_calling_agent')}{'('}{'\n'}
      {'    '}{v('llm')}{'='}{v('llm')}{', '}{v('tools')}{'='}{v('tools')}{', '}{v('prompt')}{'='}{v('agent_prompt')}{','}{'\n'}
      {')'}{'\n'}
      {v('executor')} {'= '}{fn('AgentExecutor')}{'('}{'\n'}
      {'    '}{v('agent')}{'='}{v('agent')}{', '}{v('tools')}{'='}{v('tools')}{', '}{v('memory')}{'='}{v('memory')}{','}{'\n'}
      {')'}
    </>
  ),
};

function CodePreview({ preset }) {
  return (
    <div style={{
      background: C.codeBg, borderRadius: '6px', padding: '10px 14px',
      marginTop: '8px', maxHeight: '118px', overflow: 'hidden',
    }}>
      <pre style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
        color: C.text, margin: 0, lineHeight: 1.65,
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {CODE[preset]}
      </pre>
    </div>
  );
}

// ── Palette Card ──────────────────────────────────────────────────────────────

function PrimCard({ prim, used, highlightUsed, hoveredId, setHoveredId, pulsedId, setPulsedId }) {
  const p = PRIM_MAP[prim.id];
  const isHovered = hoveredId === prim.id;
  const isPulsed  = pulsedId  === prim.id;
  const dimmed = highlightUsed && !used;
  const glowing = highlightUsed && used;

  return (
    <button
      type="button"
      style={{
        position: 'relative',
        background: isPulsed ? hexRgba(p.color, 0.12) : C.bg3,
        borderLeft: `3px solid ${p.color}`,
        borderTop: `1px solid ${glowing ? hexRgba(p.color, 0.4) : C.border}`,
        borderRight: `1px solid ${glowing ? hexRgba(p.color, 0.4) : C.border}`,
        borderBottom: `1px solid ${glowing ? hexRgba(p.color, 0.4) : C.border}`,
        borderRadius: '6px',
        padding: '8px 10px',
        opacity: dimmed ? 0.38 : 1,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'opacity 200ms, background 200ms, border-color 200ms',
        boxShadow: glowing ? `0 0 0 1px ${hexRgba(p.color, 0.25)}` : 'none',
      }}
      onMouseEnter={() => setHoveredId(prim.id)}
      onMouseLeave={() => setHoveredId(null)}
      onFocus={() => setHoveredId(prim.id)}
      onBlur={() => setHoveredId(null)}
      onClick={() => {
        setPulsedId(prim.id);
        setTimeout(() => setPulsedId(null), 380);
      }}
    >
      {/* Top row: icon + name */}
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
        <span style={{ fontSize: '12px' }}>{p.icon}</span>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: '11px',
          fontWeight: 500, color: p.color,
        }}>{p.name}</span>
      </span>
      {/* Description (truncated) */}
      <span style={{
        display: 'block',
        fontFamily: "'Inter', sans-serif", fontSize: '9px',
        color: C.mid, lineHeight: 1.35,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>{p.desc}</span>

      {/* Tooltip: apiNote */}
      {isHovered && (
        <span style={{
          display: 'block',
          position: 'absolute', left: '100%', top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px',
          background: C.bg2, border: `1px solid ${C.borderLt}`,
          borderRadius: '5px', padding: '5px 9px',
          fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px',
          color: p.color, whiteSpace: 'nowrap', zIndex: 20,
          pointerEvents: 'none',
        }}>
          {p.apiNote}
        </span>
      )}
    </button>
  );
}

// ── Stats Strip ───────────────────────────────────────────────────────────────

function StatsStrip({ preset }) {
  const used = PRESET_PRIMS[preset];
  const usedCount = used.size;
  const mono = { fontFamily: "'JetBrains Mono', monospace" };

  const cell = (label, val, color) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
      <div style={{ ...mono, fontSize: '7.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: '10.5px', color: color || C.text, whiteSpace: 'nowrap' }}>
        {val}
      </div>
    </div>
  );

  const divider = <div style={{ width: 1, background: C.border, alignSelf: 'stretch', flexShrink: 0 }} />;

  return (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px',
      padding: '10px 14px', marginTop: '10px',
    }}>
      {/* Row 1: LangChain meta + current preset */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {cell('Library', 'LangChain', C.accent)}
        {divider}
        {cell('Style', 'Composition lib.')}
        {divider}
        {cell('Language', 'Python (+ JS)')}
        {divider}
        {cell('License', 'MIT', C.green)}
        {divider}
        {cell('Preset', PRESETS.find(p => p.key === preset)?.name, C.orange)}
        {divider}
        {cell('Used', `${usedCount} / 6`, usedCount === 6 ? C.accent : C.text)}
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />

      {/* Row 2: per-primitive presence + trade-offs */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Primitive grid */}
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ ...mono, fontSize: '7.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
            Primitive usage across presets
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '3px 14px' }}>
            {PRIMITIVES.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ ...mono, fontSize: '9px', color: p.color }}>{p.icon}</span>
                <span style={{ ...mono, fontSize: '8px', color: C.muted }}>{PRIM_PRESETS[p.id]}</span>
              </div>
            ))}
          </div>
        </div>

        {divider}

        {/* Trade-offs */}
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{ ...mono, fontSize: '7.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
            Trade-offs
          </div>
          {[
            ['+', 'Huge integration count',     C.green],
            ['+', 'Battery-included primitives', C.green],
            ['−', 'API has churned over time',   C.muted],
            ['−', 'Some abstractions feel heavy', C.muted],
          ].map(([sign, txt, color]) => (
            <div key={txt} style={{ display: 'flex', gap: '5px', marginBottom: '2px' }}>
              <span style={{ ...mono, fontSize: '9px', color, flexShrink: 0 }}>{sign}</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: C.mid }}>{txt}</span>
            </div>
          ))}
        </div>

        {divider}

        {/* Quote */}
        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontSize: '10px',
            color: C.muted, fontStyle: 'italic', lineHeight: 1.55,
          }}>
            "LangChain's value is the breadth of integrations, not the elegance of abstractions."
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LangChainComposition({ tryThis }) {
  const [preset, setPreset]             = useState('basicRag');
  const [showCode, setShowCode]         = useState(true);
  const [highlightUsed, setHighlight]   = useState(true);
  const [hoveredId, setHoveredId]       = useState(null);
  const [pulsedId, setPulsedId]         = useState(null);

  const usedSet = PRESET_PRIMS[preset];

  const btnBase = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px', padding: '4px 11px', borderRadius: '20px',
    cursor: 'pointer', border: `1px solid ${C.border}`,
    background: C.bg4, color: C.mid,
    transition: 'background 150ms, border-color 150ms, color 150ms',
  };

  const toggle = (label, val, set) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input
        type="checkbox" checked={val} onChange={e => set(e.target.checked)}
        style={{ accentColor: C.accent, width: 12, height: 12 }}
      />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.muted,
      }}>{label}</span>
    </label>
  );

  return (
    <WidgetCard title="LangChain — composing primitives into agents" number="25.4" tryThis={tryThis}>

      {/* ── Main row: palette + canvas section ── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>

        {/* Left: Primitive Palette */}
        <div style={{ width: 192, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '8px',
            color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: '4px',
          }}>
            Core Primitives
          </div>
          {PRIMITIVES.map(p => (
            <PrimCard
              key={p.id}
              prim={p}
              used={usedSet.has(p.id)}
              highlightUsed={highlightUsed}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              pulsedId={pulsedId}
              setPulsedId={setPulsedId}
            />
          ))}
        </div>

        {/* Right: preset tabs + flowchart + code */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Preset tabs */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
            {PRESETS.map(({ key, label }) => {
              const active = preset === key;
              return (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  style={{
                    ...btnBase,
                    background:   active ? C.accent    : C.bg4,
                    borderColor:  active ? C.accent    : C.border,
                    color:        active ? '#000'      : C.mid,
                    fontWeight:   active ? 600         : 400,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* SVG flowchart canvas */}
          <div style={{
            background: C.codeBg, borderRadius: '6px', overflow: 'hidden',
            padding: '8px 0 4px',
          }}>
            {preset === 'basicRag'     && <BasicRagSVG />}
            {preset === 'toolAgent'    && <ToolAgentSVG />}
            {preset === 'convRagTools' && <ConvRagToolsSVG />}
          </div>

          {/* Code preview */}
          {showCode && <CodePreview preset={preset} />}

          {/* Controls */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
            {toggle('Show code preview', showCode, setShowCode)}
            {toggle('Highlight used primitives', highlightUsed, setHighlight)}
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <StatsStrip preset={preset} />

    </WidgetCard>
  );
}
