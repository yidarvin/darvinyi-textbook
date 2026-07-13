import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
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

const TOOLS = [
  {
    name: 'web_search', icon: '🔍',
    description: 'Search the web for current information.',
    signature: 'web_search(query: string) -> SearchResult[]',
    example_input: '{ "query": "Marie Curie Nobel Prize year" }',
    example_output: '[ { "title": "...", "snippet": "...", "url": "..." } ]',
    color: C.accent, latency: '1–3 seconds',
    exampleQuery: 'When did Marie Curie win the Nobel Prize?',
  },
  {
    name: 'code_interpreter', icon: '💻',
    description: 'Execute Python code and return stdout.',
    signature: 'code_interpreter(code: string) -> string',
    example_input: '{ "code": "import math\\nprint(math.sqrt(67_000_000))" }',
    example_output: '"8185.352771872449"',
    color: C.orange, latency: '0.1–10 seconds',
    exampleQuery: 'Calculate the square root of 67 million.',
  },
  {
    name: 'read_file', icon: '📄',
    description: 'Read the contents of a file by path.',
    signature: 'read_file(path: string) -> string',
    example_input: '{ "path": "/data/report.txt" }',
    example_output: '"Q3 revenue was $4.2M, up 12% YoY..."',
    color: C.purple, latency: '<100ms',
    exampleQuery: 'What is in /data/report.txt?',
  },
  {
    name: 'send_email', icon: '✉️',
    description: 'Send an email to one or more recipients.',
    signature: 'send_email(to: string[], subject: string, body: string) -> bool',
    example_input: '{ "to": ["alice@example.com"], "subject": "Q3 Summary", "body": "..." }',
    example_output: 'true',
    color: C.math, latency: '1–2 seconds',
    exampleQuery: 'Send the Q3 Summary to alice@example.com.',
  },
  {
    name: 'database_query', icon: '🗄️',
    description: 'Run a SQL query against the database.',
    signature: 'database_query(sql: string) -> Row[]',
    example_input: '{ "sql": "SELECT name, score FROM students ORDER BY score DESC LIMIT 5" }',
    example_output: '[ {"name": "Alice", "score": 98} ]',
    color: C.green, latency: '10–500ms',
    exampleQuery: 'Who are the top 5 students by score?',
  },
  {
    name: 'http_request', icon: '🌐',
    description: 'Make an HTTP GET or POST request.',
    signature: 'http_request(url: string, method: string, body?: object) -> Response',
    example_input: '{ "url": "https://api.weather.com/v1/current", "method": "GET" }',
    example_output: '{ "temp": 22, "condition": "partly cloudy" }',
    color: C.red, latency: '100ms–5 seconds',
    exampleQuery: 'Get the current weather from the API.',
  },
];

const SCENARIOS = {
  A: {
    label: 'Web Search', toolName: 'web_search',
    query: 'What is the current population of Japan?',
    json: '{\n  "query": "current population of Japan 2024"\n}',
    result: 'Japan population ≈ 124.5 million (2024).',
  },
  B: {
    label: 'Code', toolName: 'code_interpreter',
    query: 'What is 347 factorial?',
    json: '{\n  "code": "import math\\nprint(math.factorial(347))"\n}',
    result: '5.148…×10^750 (very large number)',
  },
  C: {
    label: 'Database', toolName: 'database_query',
    query: 'Who are the top 3 customers by revenue?',
    json: '{\n  "sql": "SELECT customer_name,\\n    SUM(amount) revenue\\n    FROM orders\\n    GROUP BY customer_name\\n    ORDER BY revenue DESC LIMIT 3"\n}',
    result: '[{name:"Acme Corp", revenue:142000},...]',
  },
  D: {
    label: 'Email', toolName: 'send_email',
    query: 'Send the Q3 report to the board.',
    json: '{\n  "to": ["board@company.com"],\n  "subject": "Q3 Report",\n  "body": "Please find attached..."\n}',
    result: 'true  (email sent successfully)',
  },
};

// SVG layout
const SVG_W = 380;
const SVG_H = 420;
const BOX_X = 60;
const BOX_W = 260;
const BOX_CX = BOX_X + BOX_W / 2; // 190

// gap=24px between boxes; total: 20+40+24+44+24+72+24+40+24+40+24+32+12 = 420 ✓
const FLOW_BOXES = [
  { id: 0, y: 20,  h: 40, fill: C.bg4    }, // User Query
  { id: 1, y: 84,  h: 44, fill: C.bg3    }, // LLM selects tool (taller: 2 rows)
  { id: 2, y: 152, h: 72, fill: C.codeBg }, // JSON function call (taller: 4 lines)
  { id: 3, y: 248, h: 40, fill: C.bg3    }, // Runtime executes
  { id: 4, y: 312, h: 40, fill: C.bg3    }, // Result → context
  { id: 5, y: 376, h: 32, fill: C.bg3    }, // LLM continues
];

function getMainKey(example_input) {
  const m = (example_input || '').match(/"(\w+)"\s*:/);
  return m ? m[1] : 'input';
}

function getOutputType(example_output) {
  const s = (example_output || '').trim();
  if (s.startsWith('[')) return 'array';
  if (s.startsWith('"')) return 'string';
  if (s === 'true' || s === 'false') return 'boolean';
  if (s.startsWith('{')) return 'object';
  return 'any';
}

function Divider() {
  return <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />;
}

function ToolCard({ tool, isActive, animHighlight, onClick }) {
  return (
    <div
      onClick={() => onClick(tool.name)}
      title={tool.signature}
      style={{
        background: isActive ? `${tool.color}12` : C.bg3,
        border: `${isActive ? '2px' : '1px'} solid ${isActive ? tool.color : C.border}`,
        borderRadius: '6px',
        padding: '7px 10px',
        cursor: 'pointer',
        transition: 'border 150ms, background 150ms, box-shadow 150ms',
        boxShadow: animHighlight ? `0 0 10px ${tool.color}50` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
        <span style={{ fontSize: '11px', lineHeight: 1 }}>{tool.icon}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: isActive ? tool.color : C.mid,
          fontWeight: isActive ? 500 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {tool.name}
        </span>
      </div>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '9px',
        color: C.muted,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {tool.description}
      </div>
    </div>
  );
}

function StatsPanel({ tool }) {
  if (!tool) return null;
  const mainKey = getMainKey(tool.example_input);
  const outputType = getOutputType(tool.example_output);
  const mono = { fontFamily: "'JetBrains Mono', monospace" };

  return (
    <div style={{
      background: C.bg2,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      padding: '10px 12px',
    }}>
      <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
        Selected tool
      </div>
      <div style={{ ...mono, fontSize: '11px', color: tool.color, fontWeight: 500, marginBottom: '4px' }}>
        {tool.icon} {tool.name}
      </div>

      <Divider />

      <div style={{ ...mono, fontSize: '8px', color: C.muted, marginBottom: '3px' }}>Signature</div>
      <div style={{ ...mono, fontSize: '8px', color: C.math, wordBreak: 'break-word', lineHeight: 1.5, marginBottom: '4px' }}>
        {tool.signature}
      </div>

      <Divider />

      <div style={{ ...mono, fontSize: '8px', color: C.muted, marginBottom: '3px' }}>Input format</div>
      <div style={{ ...mono, fontSize: '9px', color: C.mid, marginBottom: '1px' }}>JSON object</div>
      <div style={{ ...mono, fontSize: '8px', color: C.muted, marginBottom: '4px' }}>
        key: <span style={{ color: C.math }}>{mainKey}</span>
      </div>

      <Divider />

      <div style={{ ...mono, fontSize: '8px', color: C.muted, marginBottom: '3px' }}>Output format</div>
      <div style={{ ...mono, fontSize: '9px', color: C.mid, marginBottom: '4px' }}>{outputType}</div>

      <Divider />

      <div style={{ ...mono, fontSize: '8px', color: C.muted, marginBottom: '3px' }}>Typical latency</div>
      <div style={{ ...mono, fontSize: '9px', color: C.mid }}>{tool.latency}</div>
    </div>
  );
}

function FlowDiagram({ animStep, jsonContent, query, result, activeToolObj }) {
  const b = FLOW_BOXES;
  const isActive  = (i) => animStep === i;
  const isReached = (i) => animStep >= i && animStep >= 0;

  const getFill   = (i) => isActive(i) ? C.accentDim : b[i].fill;
  const getStroke = (i) => isActive(i) ? C.accent    : C.borderLt;
  const getSW     = (i) => isActive(i) ? 2 : 1;
  const arrowOn   = (fromI) => animStep === fromI + 1;

  // JSON lines: split by \n, truncate each to 44 chars (260px box → 244px usable at 9px mono)
  const jsonLines = (jsonContent || '').split('\n').map(l =>
    l.length > 44 ? l.slice(0, 43) + '…' : l
  );

  // Truncate display strings (260px box → ~40 chars Inter 10px)
  const qDisplay = (query  || '').length > 40 ? (query  || '').slice(0, 39) + '…' : (query  || '');
  const rDisplay = (result || '').length > 40 ? (result || '').slice(0, 39) + '…' : (result || '');

  // Spinner sits left of center in box 3
  const spX = BOX_CX - 50;
  const spY = b[3].y + b[3].h / 2;

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <marker id="tuf-arr" viewBox="0 0 6 6" refX="5" refY="3"
          markerWidth="5" markerHeight="5" orient="auto">
          <polygon points="0,0 6,3 0,6" fill={C.borderLt} />
        </marker>
        <marker id="tuf-arr-a" viewBox="0 0 6 6" refX="5" refY="3"
          markerWidth="5" markerHeight="5" orient="auto">
          <polygon points="0,0 6,3 0,6" fill={C.accent} />
        </marker>
        <style>{`
          @keyframes tuf-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .tuf-sp {
            transform-box: fill-box;
            transform-origin: center;
            animation: tuf-spin 0.8s linear infinite;
          }
          @keyframes tuf-fi {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .tuf-res { animation: tuf-fi 0.3s ease-out both; }
        `}</style>
      </defs>

      {/* Arrows — from box[i].bottom+2 to box[i+1].top-4 */}
      {[0, 1, 2, 3, 4].map(i => {
        const active = arrowOn(i);
        return (
          <line key={i}
            x1={BOX_CX} y1={b[i].y + b[i].h + 2}
            x2={BOX_CX} y2={b[i + 1].y - 4}
            stroke={active ? C.accent : C.borderLt}
            strokeWidth={active ? 1.5 : 1}
            markerEnd={`url(#${active ? 'tuf-arr-a' : 'tuf-arr'})`}
          />
        );
      })}

      {/* ── Box 0 — User Query (h=40) ── */}
      <rect x={BOX_X} y={b[0].y} width={BOX_W} height={b[0].h} rx={8}
        fill={getFill(0)} stroke={getStroke(0)} strokeWidth={getSW(0)} />
      <text x={BOX_CX} y={b[0].y + 13} textAnchor="middle"
        fontSize={8} fontFamily="JetBrains Mono" fill={C.muted} letterSpacing="0.06em">
        USER QUERY
      </text>
      <text x={BOX_CX} y={b[0].y + 30} textAnchor="middle"
        fontSize={10} fontFamily="Inter" fill={isActive(0) ? C.text : C.mid}>
        {qDisplay}
      </text>

      {/* ── Box 1 — LLM selects tool (h=44, 2 rows) ── */}
      <rect x={BOX_X} y={b[1].y} width={BOX_W} height={b[1].h} rx={8}
        fill={getFill(1)} stroke={getStroke(1)} strokeWidth={getSW(1)} />
      <text x={BOX_CX} y={b[1].y + 17} textAnchor="middle"
        fontSize={11} fontFamily="Inter" fill={isReached(1) ? C.text : C.mid}>
        LLM selects tool
      </text>
      {/* Second row: selected tool name, shown once LLM selects step is reached */}
      {isReached(1) && activeToolObj && (
        <text x={BOX_CX} y={b[1].y + 34} textAnchor="middle"
          fontSize={9} fontFamily="JetBrains Mono" fill={activeToolObj.color}>
          {'→ '}{activeToolObj.icon}{' '}{activeToolObj.name}
        </text>
      )}

      {/* ── Box 2 — JSON function call (h=72, 4 lines) ── */}
      <rect x={BOX_X} y={b[2].y} width={BOX_W} height={b[2].h} rx={8}
        fill={getFill(2)} stroke={getStroke(2)} strokeWidth={getSW(2)} />
      <text x={BOX_X + 8} y={b[2].y + 12} textAnchor="start"
        fontSize={8} fontFamily="JetBrains Mono" fill={C.muted}>
        JSON function call
      </text>
      {jsonLines.slice(0, 4).map((line, i) => (
        <text key={i}
          x={BOX_X + 8} y={b[2].y + 26 + i * 13}
          textAnchor="start" fontSize={9} fontFamily="JetBrains Mono" fill={C.math}>
          {line}
        </text>
      ))}

      {/* ── Box 3 — Runtime executes (h=40) ── */}
      <rect x={BOX_X} y={b[3].y} width={BOX_W} height={b[3].h} rx={8}
        fill={getFill(3)} stroke={getStroke(3)} strokeWidth={getSW(3)} />
      {animStep === 3 ? (
        <>
          <circle className="tuf-sp" cx={spX} cy={spY} r={7}
            fill="none" stroke={C.accent} strokeWidth={1.5} strokeDasharray="24 9" />
          <text x={spX + 15} y={spY + 4} textAnchor="start"
            fontSize={10} fontFamily="Inter" fill={C.accent}>
            executing...
          </text>
        </>
      ) : (
        <text x={BOX_CX} y={b[3].y + 24} textAnchor="middle"
          fontSize={11} fontFamily="Inter" fill={isReached(3) ? C.text : C.mid}>
          Runtime executes
        </text>
      )}

      {/* ── Box 4 — Result → context (h=40) ── */}
      <rect x={BOX_X} y={b[4].y} width={BOX_W} height={b[4].h} rx={8}
        fill={getFill(4)} stroke={getStroke(4)} strokeWidth={getSW(4)} />
      {animStep >= 4 ? (
        <>
          <text x={BOX_CX} y={b[4].y + 13} textAnchor="middle"
            fontSize={8} fontFamily="JetBrains Mono" fill={C.muted} letterSpacing="0.05em">
            RESULT → CONTEXT
          </text>
          <text className="tuf-res"
            x={BOX_CX} y={b[4].y + 30} textAnchor="middle"
            fontSize={10} fontFamily="Inter" fill={C.green}>
            {rDisplay}
          </text>
        </>
      ) : (
        <text x={BOX_CX} y={b[4].y + 24} textAnchor="middle"
          fontSize={11} fontFamily="Inter" fill={C.mid}>
          Result → context
        </text>
      )}

      {/* ── Box 5 — LLM continues (h=32) ── */}
      <rect x={BOX_X} y={b[5].y} width={BOX_W} height={b[5].h} rx={8}
        fill={getFill(5)} stroke={getStroke(5)} strokeWidth={getSW(5)} />
      <text x={BOX_CX} y={b[5].y + 20} textAnchor="middle"
        fontSize={11} fontFamily="Inter" fill={isReached(5) ? C.text : C.mid}>
        LLM continues
      </text>
    </svg>
  );
}

export default function ToolUseFlow() {
  const [scenarioKey, setScenarioKey]   = useState('A');
  const [animStep,    setAnimStep]       = useState(-1);
  const [isPlaying,   setIsPlaying]      = useState(false);
  const [speed,       setSpeed]          = useState('normal');
  const [displayedJson, setDisplayedJson] = useState('');
  const [toolPreview, setToolPreview]    = useState(null);

  const timeoutIds      = useRef([]);
  const typingIvRef     = useRef(null);
  const typingCharRef   = useRef(0);
  const isPausedRef     = useRef(false);
  const scenarioRef     = useRef(SCENARIOS.A);
  const speedRef        = useRef('normal');

  useEffect(() => { scenarioRef.current = SCENARIOS[scenarioKey]; }, [scenarioKey]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const clearTimers = () => {
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];
    if (typingIvRef.current) { clearInterval(typingIvRef.current); typingIvRef.current = null; }
  };

  const resetAnim = () => {
    clearTimers();
    isPausedRef.current = false;
    typingCharRef.current = 0;
    setAnimStep(-1);
    setIsPlaying(false);
    setDisplayedJson('');
  };

  useEffect(() => { resetAnim(); setToolPreview(null); }, [scenarioKey]);
  useEffect(() => () => clearTimers(), []);

  const addTimeout = (fn, delay) => {
    const id = setTimeout(fn, delay);
    timeoutIds.current.push(id);
  };

  const runFromPhase = (phase) => {
    if (isPausedRef.current) return;
    const scn = scenarioRef.current;
    const ms  = speedRef.current === 'fast' ? 10 : 40;

    setAnimStep(phase);

    if (phase === 0) {
      addTimeout(() => runFromPhase(1), 200);

    } else if (phase === 1) {
      addTimeout(() => runFromPhase(2), 400);

    } else if (phase === 2) {
      setDisplayedJson(scn.json.slice(0, typingCharRef.current));
      const iv = setInterval(() => {
        if (isPausedRef.current) { clearInterval(iv); typingIvRef.current = null; return; }
        typingCharRef.current++;
        const ch = typingCharRef.current;
        setDisplayedJson(scn.json.slice(0, ch));
        if (ch >= scn.json.length) {
          clearInterval(iv); typingIvRef.current = null;
          addTimeout(() => runFromPhase(3), 200);
        }
      }, ms);
      typingIvRef.current = iv;

    } else if (phase === 3) {
      addTimeout(() => runFromPhase(4), 800);

    } else if (phase === 4) {
      addTimeout(() => runFromPhase(5), 300);

    } else if (phase === 5) {
      addTimeout(() => { setAnimStep(6); setIsPlaying(false); }, 300);
    }
  };

  const handleRun = () => {
    clearTimers();
    isPausedRef.current  = false;
    typingCharRef.current = 0;
    setDisplayedJson('');
    setToolPreview(null);
    setIsPlaying(true);
    runFromPhase(0);
  };

  const handlePauseResume = () => {
    if (isPlaying) {
      isPausedRef.current = true;
      clearTimers();
      setIsPlaying(false);
    } else {
      const cur = animStep;
      if (cur < 0 || cur > 5) return;
      isPausedRef.current = false;
      setIsPlaying(true);
      if (cur === 2) {
        runFromPhase(2);
      } else if (cur < 5) {
        runFromPhase(cur + 1);
      } else {
        setAnimStep(6); setIsPlaying(false);
      }
    }
  };

  const handleReset = () => { resetAnim(); setToolPreview(null); };

  const handleToolCardClick = (toolName) => {
    if (animStep >= 0 && animStep <= 5) return;
    const tool = TOOLS.find(t => t.name === toolName);
    if (!tool) return;
    clearTimers();
    isPausedRef.current  = false;
    typingCharRef.current = 0;
    setDisplayedJson('');
    setIsPlaying(false);
    setAnimStep(-1);
    setToolPreview({ toolName, json: tool.example_input, query: tool.exampleQuery });
  };

  const scenario   = SCENARIOS[scenarioKey];
  const isRunning  = animStep >= 0 && animStep <= 5;
  const isDone     = animStep === 6;
  const isIdle     = animStep === -1;

  const displayQuery   = isRunning ? scenario.query    : (toolPreview?.query    ?? scenario.query);
  const jsonContent    = isRunning ? displayedJson      : (toolPreview?.json     ?? '');
  const activeToolName = isRunning ? scenario.toolName  : (toolPreview?.toolName ?? scenario.toolName);
  const activeToolObj  = TOOLS.find(t => t.name === activeToolName);

  const btnBase = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px', padding: '6px 12px', borderRadius: '6px',
    cursor: 'pointer', border: `1px solid ${C.border}`,
    background: C.bg4, color: C.text, transition: 'opacity 150ms',
  };
  const btnOff = { ...btnBase, opacity: 0.35, cursor: 'not-allowed' };

  return (
    <WidgetCard title="Tool Use Flow — from query to function call to result" number="17.2">

      {/* Scenario tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {Object.entries(SCENARIOS).map(([key, s]) => (
          <button key={key} onClick={() => setScenarioKey(key)} style={{
            ...btnBase,
            border:     `1px solid ${scenarioKey === key ? C.accent : C.border}`,
            background: scenarioKey === key ? C.accentDim : C.bg4,
            color:      scenarioKey === key ? C.accent    : C.mid,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button onClick={handleRun} disabled={isRunning}
          style={isRunning ? btnOff : { ...btnBase, background: C.accent, color: '#0d0d0d', border: 'none', fontWeight: 600 }}>
          {isDone ? '↺ Re-run' : '▶ Run'}
        </button>

        <button onClick={handlePauseResume} disabled={isIdle || isDone}
          style={isIdle || isDone ? btnOff : btnBase}>
          {isPlaying ? '⏸ Pause' : '▶ Resume'}
        </button>

        <button onClick={handleReset} style={btnBase}>↺ Reset</button>

        <button onClick={() => setSpeed(s => s === 'normal' ? 'fast' : 'normal')}
          style={{ ...btnBase, color: speed === 'fast' ? C.orange : C.text }}>
          Speed: {speed === 'normal' ? 'Normal' : 'Fast'}
        </button>
      </div>

      {/* Main: diagram + right panel */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Left: SVG flow diagram */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <FlowDiagram
            animStep={animStep}
            jsonContent={jsonContent}
            query={displayQuery}
            result={scenario.result}
            activeToolObj={activeToolObj}
          />
        </div>

        {/* Right: tool cards + stats */}
        <div style={{ width: '180px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
            {TOOLS.map(tool => (
              <ToolCard
                key={tool.name}
                tool={tool}
                isActive={tool.name === activeToolName}
                animHighlight={tool.name === activeToolName && animStep === 1}
                onClick={handleToolCardClick}
              />
            ))}
          </div>
          <StatsPanel tool={activeToolObj} />
        </div>
      </div>

    </WidgetCard>
  );
}
