import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Constants ─────────────────────────────────────────────────────────────────
const C = {
  accent: '#2dd4bf', accentDim: '#0b2422',
  orange: '#fb923c', purple: '#a78bfa',
  green:  '#34d399', red:    '#f87171',
  border: '#242424', borderLt: '#2e2e2e',
  bg2: '#111111',    bg3: '#161616',    bg4: '#1e1e1e',
  codeBg: '#0a0a0a', text: '#e8eaed',  mid: '#888888', muted: '#555555',
};

const AGENTS = [
  { name: 'Planner',  icon: '📋', color: C.accent, role1: 'Decomposes task',  role2: 'into subtasks'   },
  { name: 'Coder',    icon: '💻', color: C.orange, role1: 'Writes Python',    role2: 'implementation'  },
  { name: 'Reviewer', icon: '🔍', color: C.purple, role1: 'Reviews code for', role2: 'correctness'     },
  { name: 'Executor', icon: '⚙️', color: C.green,  role1: 'Runs code and',    role2: 'verifies output' },
];

// SVG agent box layout — viewBox 0 0 616 112 (full usable width)
const VW = 616, VH = 112;
const AW = 130, AH = 88, AY = 12;
// 4 × 130 + 3 × 22 gap = 586px, centered: (616−586)/2 = 15px margin
const AX  = [15, 167, 319, 471];
const ACX = AX.map(x => x + AW / 2);  // [80, 232, 384, 536]
const ARR_Y = AY + AH / 2;            // 56

// ── Scenario data ─────────────────────────────────────────────────────────────
const PLAN_MSG = `Plan:
1. Tokenize input text (lowercase, strip punctuation).
2. Count word frequencies using collections.Counter.
3. Return the N most common words as (word, count) tuples.`;

const CODE_V1 = `from collections import Counter
import re

def top_n_words(text: str, n: int) -> list[tuple[str, int]]:
    words = re.findall(r'\\b[a-z]+\\b', text.lower())
    return Counter(words).most_common(n)`;

const CODE_V2 = `from collections import Counter
import re

def top_n_words(text: str, n: int) -> list[tuple[str, int]]:
    # [^\\W\\d_]+ matches any letter, not just ASCII a-z
    words = re.findall(r'[^\\W\\d_]+', text.lower())
    return Counter(words).most_common(n)`;

const CODE_BUGGY = `from collections import Counter

def top_n_words(text: str, n: int) -> list[tuple[str, int]]:
    # str.most_common() does not exist — hallucination
    return text.most_common(n)`;

const CODE_V3 = `from collections import Counter
import re

def top_n_words(text: str, n: int) -> list[tuple[str, int]]:
    if n <= 0:
        return []
    words = re.findall(r'[^\\W\\d_]+', text.lower())
    return Counter(words).most_common(n)`;

const SCENARIOS = {
  normal: {
    label: 'Normal',
    outcome: { text: '✓ Task complete', color: C.green },
    steps: [
      { sender: 0, receiver: 1, type: 'plan',
        message: PLAN_MSG },
      { sender: 1, receiver: null, type: 'code', isRevision: false,
        message: CODE_V1 },
      { sender: 1, receiver: 2, type: 'prose',
        message: 'Please review this implementation for correctness.' },
      { sender: 2, receiver: 1, type: 'review-rejection',
        message: "Issue: '\\b[a-z]+\\b' only matches ASCII lowercase letters. A word with an accented character (e.g. 'café') has no [a-z]+ run bounded by \\b on both sides, so re.findall silently drops it instead of matching the ASCII part. Use a Unicode-aware word pattern." },
      { sender: 1, receiver: null, type: 'code', isRevision: true,
        message: CODE_V2 },
      { sender: 2, receiver: 3, type: 'review-approval',
        message: 'Approved. Unicode-aware pattern correctly counts accented words instead of silently dropping them.' },
      { sender: 3, receiver: null, type: 'result',
        message: `Tests passed.
Input: 'the quick brown fox the the fox'
top_n_words(text, 2) → [('the', 3), ('fox', 2)] ✓
Input: 'café naïve café résumé café'
top_n_words(text, 2) → [('café', 3), ('naïve', 1)] ✓
All tests pass.` },
    ],
  },
  hallucinated: {
    label: 'Hallucinated API',
    outcome: { text: '✗ Runtime error caught', color: C.red },
    steps: [
      { sender: 0, receiver: 1, type: 'plan',
        message: PLAN_MSG },
      { sender: 1, receiver: null, type: 'code', isRevision: false,
        message: CODE_BUGGY },
      { sender: 1, receiver: 2, type: 'prose',
        message: 'Please review this implementation for correctness.' },
      { sender: 2, receiver: 3, type: 'review-approval',
        message: 'Approved. Implementation looks correct.' },
      { sender: 3, receiver: null, type: 'error',
        message: `Execution failed.
AttributeError: 'str' object has no attribute 'most_common'

  top_n_words('the quick brown fox', 2)
  → return text.most_common(n)

Hallucinated method call breaks the entire pipeline.` },
      { sender: 3, receiver: 1, type: 'error-route',
        message: 'Execution failed. Routing back to Coder for fix.' },
    ],
  },
  reviewLoop: {
    label: 'Review Loop',
    outcome: { text: '✗ Max retries exceeded', color: C.red },
    steps: [
      { sender: 0, receiver: 1, type: 'plan',
        message: PLAN_MSG },
      { sender: 1, receiver: null, type: 'code', isRevision: false,
        message: CODE_V1 },
      { sender: 1, receiver: 2, type: 'prose',
        message: 'Please review this implementation for correctness.' },
      { sender: 2, receiver: 1, type: 'review-rejection',
        message: "Cycle 1/3 — Issue: '\\b[a-z]+\\b' only matches ASCII lowercase letters, so words containing accented characters are silently dropped from the count entirely. Use a Unicode-aware word pattern instead." },
      { sender: 1, receiver: null, type: 'code', isRevision: true,
        message: CODE_V2 },
      { sender: 2, receiver: 1, type: 'review-rejection',
        message: 'Cycle 2/3 — Issue: n parameter not validated. Passing n=0 or n<0 produces unexpected results. Guard against invalid n values.' },
      { sender: 1, receiver: null, type: 'code', isRevision: true,
        message: CODE_V3 },
      { sender: 2, receiver: 1, type: 'review-rejection',
        message: 'Cycle 3/3 — Issue: type annotations not enforced at runtime. Need isinstance() checks for text and n to reject invalid callers.' },
      { sender: null, receiver: null, type: 'fail',
        message: 'Maximum retries exceeded — task failed.\nReviewer rejected 3 consecutive revisions without convergence.' },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getBorderColor(type) {
  if (type === 'plan')                                          return C.accent;
  if (type === 'code')                                          return C.orange;
  if (type === 'review-rejection')                              return C.red;
  if (type === 'review-approval' || type === 'result')          return C.green;
  if (type === 'error' || type === 'error-route' || type === 'fail') return C.red;
  return C.borderLt;
}

function getActiveSegments(sender, receiver) {
  if (sender === null || receiver === null || sender === receiver) return new Set();
  const lo = Math.min(sender, receiver);
  const hi = Math.max(sender, receiver);
  const segs = new Set();
  for (let i = lo; i < hi; i++) segs.add(i);
  return segs;
}

function getAgentStatuses(shownMessages, activeAgent, scenarioKey, isDone) {
  return AGENTS.map((agent, idx) => {
    if (activeAgent === idx) return { label: 'Active', color: agent.color };
    const myMsgs = shownMessages.filter(m => m.sender === idx);
    if (myMsgs.length === 0)                                           return { label: 'Idle',     color: C.muted   };
    if (scenarioKey === 'reviewLoop'    && idx === 2 && isDone)        return { label: 'Stuck',    color: C.red     };
    if (scenarioKey === 'hallucinated'  && idx === 3 && isDone)        return { label: 'Error',    color: C.red     };
    if (idx === 1 && myMsgs.some(m => m.isRevision) && !isDone)       return { label: 'Revising', color: C.orange  };
    return { label: 'Done', color: C.green };
  });
}

// ── AgentSVG ──────────────────────────────────────────────────────────────────
function AgentSVG({ activeAgent, dotState, scenarioKey, shownMessages }) {
  const loopFailed = scenarioKey === 'reviewLoop' && shownMessages.some(m => m.type === 'fail');
  const activeSegs = dotState.show
    ? getActiveSegments(dotState.sender, dotState.receiver)
    : new Set();

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
      {/* ── Arrow segments ── */}
      {[0, 1, 2].map(i => {
        const x1 = AX[i] + AW + 1;
        const x2 = AX[i + 1] - 1;
        const active = activeSegs.has(i);
        const color  = active ? (dotState.color || C.accent) : C.borderLt;
        return (
          <g key={i}>
            <line
              x1={x1} y1={ARR_Y} x2={x2 - 5} y2={ARR_Y}
              stroke={color} strokeWidth={active ? 2 : 1}
              strokeDasharray={active ? 'none' : '3,3'}
            />
            <polygon
              points={`${x2 - 5},${ARR_Y - 3} ${x2},${ARR_Y} ${x2 - 5},${ARR_Y + 3}`}
              fill={color}
            />
          </g>
        );
      })}

      {/* ── Traveling dot ── */}
      {dotState.show && (
        <circle cx={dotState.x} cy={ARR_Y} r={5} fill={dotState.color} opacity={0.92} />
      )}

      {/* ── Agent boxes ── */}
      {AGENTS.map((agent, i) => {
        const ax = AX[i];
        const cx = ACX[i];
        const isActive = activeAgent === i;

        return (
          <g key={i}>
            {/* Glow ring when active */}
            {isActive && (
              <rect
                x={ax - 2} y={AY - 2} width={AW + 4} height={AH + 4} rx={10}
                fill="none" stroke={agent.color} strokeWidth={1}
                style={{ opacity: 0.5, animation: 'maAgentPulse 1.2s ease-in-out infinite' }}
              />
            )}

            {/* Box background */}
            <rect x={ax} y={AY} width={AW} height={AH} rx={8} fill={C.bg3} />

            {/* Header tint (rounded-top rectangle) */}
            <rect x={ax} y={AY}      width={AW} height={26} rx={6}   fill={agent.color + '1e'} />
            <rect x={ax} y={AY + 18} width={AW} height={8}            fill={agent.color + '1e'} />

            {/* Header separator */}
            <line
              x1={ax} y1={AY + 26} x2={ax + AW} y2={AY + 26}
              stroke={agent.color + '28'} strokeWidth={1}
            />

            {/* Box border — drawn on top to cover header overflow */}
            <rect
              x={ax} y={AY} width={AW} height={AH} rx={8}
              fill="none" stroke={agent.color} strokeWidth={isActive ? 2 : 1.5}
            />

            {/* Icon + name */}
            <text
              x={cx} y={AY + 18} textAnchor="middle"
              fontSize={12} fontFamily="'JetBrains Mono', monospace" fill={agent.color}
            >
              {agent.icon} {agent.name}
            </text>

            {/* Role text */}
            <text x={cx} y={AY + 52} textAnchor="middle" fontSize={10} fontFamily="'Inter', sans-serif" fill={C.muted}>
              {agent.role1}
            </text>
            <text x={cx} y={AY + 67} textAnchor="middle" fontSize={10} fontFamily="'Inter', sans-serif" fill={C.muted}>
              {agent.role2}
            </text>

            {/* Review loop failed — red X on Reviewer */}
            {loopFailed && i === 2 && (
              <>
                <line x1={ax + 16} y1={AY + 12} x2={ax + AW - 16} y2={AY + AH - 12} stroke={C.red} strokeWidth={2.5} opacity={0.82} />
                <line x1={ax + AW - 16} y1={AY + 12} x2={ax + 16} y2={AY + AH - 12} stroke={C.red} strokeWidth={2.5} opacity={0.82} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isCode = msg.type === 'code';
  const sender   = msg.sender   !== null ? AGENTS[msg.sender]   : null;
  const receiver = msg.receiver !== null ? AGENTS[msg.receiver] : null;
  const borderColor = getBorderColor(msg.type);

  const pill      = sender
    ? `${sender.icon} ${sender.name}${receiver ? ' → ' + receiver.name : ''}`
    : '⚠ System';
  const pillColor = sender ? sender.color : C.red;

  return (
    <div style={{ marginBottom: '8px', animation: 'maSlideUp 280ms ease-out both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{
          background: pillColor + '18', color: pillColor,
          border: `1px solid ${pillColor}40`,
          borderRadius: '4px', padding: '2px 7px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px', lineHeight: 1.5, whiteSpace: 'nowrap',
        }}>
          {pill}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px', color: C.muted, flexShrink: 0, marginLeft: '6px',
        }}>
          Step {msg.stepIdx + 1}/{msg.totalSteps}
        </span>
      </div>

      {isCode ? (
        <pre style={{
          margin: 0,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px', lineHeight: 1.55,
          background: C.bg3, color: C.text,
          borderRadius: '4px', padding: '8px 10px',
          borderLeft: `3px solid ${borderColor}`,
          overflowX: 'auto', whiteSpace: 'pre',
        }}>
          {msg.message}
        </pre>
      ) : (
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px', color: '#b8c4cc', lineHeight: 1.55,
          borderLeft: `3px solid ${borderColor}`,
          paddingLeft: '8px', whiteSpace: 'pre-wrap',
        }}>
          {msg.message}
        </div>
      )}
    </div>
  );
}

// ── StatsStrip (horizontal, full-width) ───────────────────────────────────────
function StatsStrip({ scenarioKey, steps, shownMessages, activeAgent, isDone }) {
  const scenario      = SCENARIOS[scenarioKey];
  const statuses      = getAgentStatuses(shownMessages, activeAgent, scenarioKey, isDone);
  const codeRevisions = shownMessages.filter(m => m.type === 'code' && m.isRevision).length;
  const reviewCycles  = shownMessages.filter(m => m.type === 'review-rejection').length;
  const scenarioLabel = scenario.label;

  const mono  = { fontFamily: "'JetBrains Mono', monospace" };
  const lbl   = { ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' };
  const vDiv  = { width: 1, background: C.border, alignSelf: 'stretch', flexShrink: 0 };

  return (
    <div data-mobile-stat-strip style={{
      display: 'flex', alignItems: 'stretch',
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: '8px', marginTop: '8px', overflow: 'hidden',
    }}>

      {/* ── Scenario + Step ── */}
      <div style={{ padding: '10px 16px', flexShrink: 0 }}>
        <div style={lbl}>Scenario</div>
        <div style={{ ...mono, fontSize: '13px', color: C.text, fontWeight: 500, marginBottom: '8px' }}>
          {scenarioLabel}
        </div>
        <div style={lbl}>Step</div>
        <div style={{ ...mono, fontSize: '13px', color: C.accent, fontWeight: 500 }}>
          {shownMessages.length} / {steps.length}
        </div>
      </div>

      <div data-mobile-divider style={vDiv} />

      {/* ── Agent status (2 × 2 grid) ── */}
      <div style={{ padding: '10px 16px', flex: 1, minWidth: 0 }}>
        <div style={lbl}>Agent status</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 16px' }}>
          {AGENTS.map((agent, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
              <span style={{ fontSize: '11px', lineHeight: 1, flexShrink: 0 }}>{agent.icon}</span>
              <span style={{ ...mono, fontSize: '10px', color: C.mid, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {agent.name}
              </span>
              <span style={{ ...mono, fontSize: '10px', color: statuses[i].color, fontWeight: 600, flexShrink: 0 }}>
                {statuses[i].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div data-mobile-divider style={vDiv} />

      {/* ── Counters ── */}
      <div style={{ padding: '10px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={lbl}>Counters</div>
        {[
          { label: 'Messages',   value: shownMessages.length },
          { label: 'Revisions',  value: codeRevisions },
          { label: 'Rev cycles', value: reviewCycles },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
            <span style={{ ...mono, fontSize: '10px', color: C.muted }}>{label}</span>
            <span style={{ ...mono, fontSize: '12px', color: C.accent, fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      <div data-mobile-divider style={vDiv} />

      {/* ── Outcome ── */}
      <div style={{ padding: '10px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 120 }}>
        <div style={lbl}>Outcome</div>
        <div style={{
          ...mono, fontSize: '12px',
          color: isDone ? scenario.outcome.color : C.muted,
          fontWeight: isDone ? 700 : 400,
          lineHeight: 1.4,
        }}>
          {isDone ? scenario.outcome.text : 'In progress…'}
        </div>
      </div>

    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const BTN = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px', padding: '6px 12px', borderRadius: '6px',
  cursor: 'pointer', border: `1px solid ${C.border}`,
  background: C.bg4, color: C.text, transition: 'opacity 150ms',
};
const BTN_OFF = { ...BTN, opacity: 0.35, cursor: 'not-allowed' };

const DOT_RESET = { show: false, x: 0, sender: null, receiver: null, color: C.accent };

export default function MultiAgent({ tryThis }) {
  const [scenarioKey,   setScenarioKey]   = useState('normal');
  const [shownMessages, setShownMessages] = useState([]);
  const [activeAgent,   setActiveAgent]   = useState(null);
  const [dotState,      setDotState]      = useState(DOT_RESET);
  const [busy,          setBusy]          = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isDone,        setIsDone]        = useState(false);
  const [speed,         setSpeed]         = useState('normal');

  const rAFRef        = useRef(null);
  const timeoutIds    = useRef([]);
  const isAutoRef     = useRef(false);
  const speedRef      = useRef('normal');
  const scenarioKeyRef = useRef('normal');
  const runStepRef    = useRef(null);
  const feedRef       = useRef(null);

  useEffect(() => { speedRef.current      = speed;       }, [speed]);
  useEffect(() => { scenarioKeyRef.current = scenarioKey; }, [scenarioKey]);

  const clearAll = () => {
    if (rAFRef.current) { cancelAnimationFrame(rAFRef.current); rAFRef.current = null; }
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];
    isAutoRef.current = false;
  };

  // Reset on scenario change
  useEffect(() => {
    clearAll();
    setShownMessages([]);
    setActiveAgent(null);
    setDotState(DOT_RESET);
    setBusy(false);
    setIsAutoRunning(false);
    setIsDone(false);
  }, [scenarioKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll feed to bottom when new message appears
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [shownMessages.length]);

  // ── Core step runner ──────────────────────────────────────────────────────
  function runStep(stepIdx, auto) {
    const scn        = SCENARIOS[scenarioKeyRef.current];
    const steps      = scn.steps;
    const totalSteps = steps.length;

    if (stepIdx >= totalSteps) {
      isAutoRef.current = false;
      setIsAutoRunning(false);
      setBusy(false);
      setActiveAgent(null);
      setDotState(DOT_RESET);
      setIsDone(true);
      return;
    }

    const step        = steps[stepIdx];
    const fast        = speedRef.current === 'fast';
    const totalDelay  = fast ? 400 : 1200;
    const dotDuration = fast ? 200 : 500;
    const pauseAfterDot    = fast ? 80  : 250;
    const pauseBeforeNext  = fast ? 120 : 480;

    setBusy(true);
    if (step.sender !== null) setActiveAgent(step.sender);

    function appendMessage() {
      setActiveAgent(null);
      setDotState(DOT_RESET);
      setShownMessages(prev => [...prev, { ...step, stepIdx, totalSteps }]);
      if (auto && isAutoRef.current) {
        const tid = setTimeout(() => {
          if (isAutoRef.current) runStepRef.current(stepIdx + 1, true);
        }, pauseBeforeNext);
        timeoutIds.current.push(tid);
      } else {
        setBusy(false);
      }
    }

    if (step.sender !== null && step.receiver !== null) {
      // Dot travels edge-to-edge between boxes
      let x1, x2;
      if (step.sender < step.receiver) {
        x1 = AX[step.sender] + AW;
        x2 = AX[step.receiver];
      } else {
        x1 = AX[step.sender];
        x2 = AX[step.receiver] + AW;
      }
      const agentColor = AGENTS[step.sender].color;
      const startTime  = performance.now();

      const frame = (now) => {
        const p = Math.min((now - startTime) / dotDuration, 1);
        setDotState({ show: true, x: x1 + (x2 - x1) * p, sender: step.sender, receiver: step.receiver, color: agentColor });
        if (p < 1) {
          rAFRef.current = requestAnimationFrame(frame);
        } else {
          rAFRef.current = null;
          const tid = setTimeout(appendMessage, pauseAfterDot);
          timeoutIds.current.push(tid);
        }
      };
      rAFRef.current = requestAnimationFrame(frame);
    } else {
      // No arrow — just pause then show message
      const tid = setTimeout(appendMessage, totalDelay * 0.35);
      timeoutIds.current.push(tid);
    }
  }
  runStepRef.current = runStep;

  // ── Derived state ─────────────────────────────────────────────────────────
  const steps   = SCENARIOS[scenarioKey].steps;
  const nextIdx = shownMessages.length;
  const canStep = !busy && !isDone && nextIdx < steps.length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleNextStep() {
    if (!canStep) return;
    isAutoRef.current = false;
    runStepRef.current(nextIdx, false);
  }

  function handleRunPipeline() {
    clearAll();
    setShownMessages([]);
    setActiveAgent(null);
    setDotState(DOT_RESET);
    setIsDone(false);
    setBusy(false);
    isAutoRef.current = true;
    setIsAutoRunning(true);
    runStepRef.current(0, true);
  }

  function handleReset() {
    clearAll();
    setShownMessages([]);
    setActiveAgent(null);
    setDotState(DOT_RESET);
    setBusy(false);
    setIsAutoRunning(false);
    setIsDone(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <WidgetCard title="Multi-Agent System — plan, code, review, execute" number="24.4" tryThis={tryThis}>
      <style>{`
        @keyframes maSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes maAgentPulse {
          0%   { opacity: 0.3; }
          50%  { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
      `}</style>

      {/* ── Scenario tabs ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {Object.entries(SCENARIOS).map(([key, scn]) => (
          <button key={key} onClick={() => setScenarioKey(key)} style={{
            ...BTN,
            border:     `1px solid ${scenarioKey === key ? C.accent  : C.border}`,
            background: scenarioKey === key ? C.accentDim : C.bg4,
            color:      scenarioKey === key ? C.accent    : C.mid,
          }}>
            {scn.label}
          </button>
        ))}
      </div>

      {/* ── Task description ── */}
      <div style={{
        background: C.bg4, borderRadius: '6px', padding: '7px 11px', marginBottom: '10px',
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: C.muted }}>
          Task{'  '}
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.text }}>
          Write a Python function that finds the N most common words in a text.
        </span>
      </div>

      {/* ── Agent SVG — full width ── */}
      <AgentSVG
        activeAgent={activeAgent}
        dotState={dotState}
        scenarioKey={scenarioKey}
        shownMessages={shownMessages}
      />

      {/* ── Message feed — full width ── */}
      <div
        ref={feedRef}
        style={{
          marginTop: '6px',
          maxHeight: '260px', overflowY: 'auto',
          background: C.codeBg,
          borderTop: `1px solid ${C.border}`,
          borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px',
          padding: '12px 14px',
        }}
      >
        {shownMessages.length === 0 ? (
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px', color: C.muted,
            textAlign: 'center', padding: '24px 0',
          }}>
            Press "Run Pipeline" or "Next Step" to begin
          </div>
        ) : shownMessages.map((msg, i) => (
          <MessageBubble key={`${scenarioKey}-${i}`} msg={msg} />
        ))}
      </div>

      {/* ── Stats strip — full width, horizontal ── */}
      <StatsStrip
        scenarioKey={scenarioKey}
        steps={steps}
        shownMessages={shownMessages}
        activeAgent={activeAgent}
        isDone={isDone}
      />

      {/* ── Controls ── */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleRunPipeline} style={{
          ...BTN, background: C.accent, color: '#0d0d0d', border: 'none', fontWeight: 600,
        }}>
          {isDone ? '↺ Re-run' : '▶ Run Pipeline'}
        </button>

        <button onClick={handleNextStep} disabled={!canStep} style={canStep ? BTN : BTN_OFF}>
          Next Step →
        </button>

        <button onClick={handleReset} style={BTN}>
          Reset
        </button>

        <button
          onClick={() => setSpeed(s => s === 'normal' ? 'fast' : 'normal')}
          style={{ ...BTN, color: speed === 'fast' ? C.orange : C.text }}
        >
          Speed: {speed === 'normal' ? 'Normal' : 'Fast'}
        </button>
      </div>
    </WidgetCard>
  );
}
