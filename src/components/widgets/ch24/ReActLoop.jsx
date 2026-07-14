import { useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const TRACES = {
  curie: {
    label: 'Marie Curie',
    task: 'How old was Marie Curie when she won her first Nobel Prize?',
    steps: [
      {
        thought: 'I need to find when Marie Curie won her first Nobel Prize and her birth year to calculate her age at that time. Let me search for Marie Curie Nobel Prize.',
        actionType: 'search',
        actionCall: 'search("Marie Curie Nobel Prize year")',
        observation: 'Marie Curie won the Nobel Prize in Physics in 1903, shared with her husband Pierre Curie and Henri Becquerel, for their research on radiation.',
      },
      {
        thought: 'Good — her first Nobel Prize was in 1903. Now I need her birth year. Let me search for that.',
        actionType: 'search',
        actionCall: 'search("Marie Curie birth year")',
        observation: 'Marie Curie was born on November 7, 1867, in Warsaw, Poland.',
      },
      {
        thought: 'I now have both dates. She was born in 1867 and won the Nobel Prize in 1903. I can calculate her age: 1903 - 1867 = 36. But I should verify whether her birthday had passed by the time of the award.',
        actionType: 'calculate',
        actionCall: 'calculate("1903 - 1867")',
        observation: '36',
      },
      {
        thought: 'The Nobel Prize ceremony is in December. She was born in November. By December 1903, she would have already turned 36 that year. So she was 36 years old when she won the prize.',
        actionType: 'lookup',
        actionCall: 'lookup("Nobel Prize ceremony date 1903")',
        observation: 'The Nobel Prize award ceremony took place on December 10, 1903.',
      },
      {
        thought: 'Confirmed — the ceremony was December 10, 1903. She turned 36 on November 7, 1903 (her birthday), before the December ceremony. Therefore she was definitively 36 years old.',
        actionType: 'finish',
        actionCall: 'finish("Marie Curie was 36 years old when she won her first Nobel Prize in Physics in 1903.")',
        observation: '[Task complete]',
      },
    ],
    finalAnswer: 'Marie Curie was 36 years old when she won her first Nobel Prize.',
  },
  france: {
    label: 'France Population',
    task: 'What is the square root of the population of France?',
    steps: [
      {
        thought: 'I need to find the current population of France and then compute its square root. Let me start by searching for the population.',
        actionType: 'search',
        actionCall: 'search("France population")',
        observation: 'France has a population of approximately 67 million people (67,000,000).',
      },
      {
        thought: 'The population of France is about 67 million. Now I need to calculate the square root of 67,000,000.',
        actionType: 'calculate',
        actionCall: 'calculate("sqrt(67000000)")',
        observation: '8185.35',
      },
      {
        thought: "The square root of 67,000,000 is approximately 8,185.35. I have all the information needed to give the final answer.",
        actionType: 'finish',
        actionCall: "finish(\"The square root of France's population (67M) is approximately 8,185.\")",
        observation: '[Task complete]',
      },
    ],
    finalAnswer: "The square root of France's population (67M) is approximately 8,185.",
  },
  sherlock: {
    label: 'Sherlock Holmes',
    task: 'Who wrote the novel that introduced the character Sherlock Holmes?',
    steps: [
      {
        thought: "I need to find which novel first introduced Sherlock Holmes and then identify its author. Let me search for Sherlock Holmes's first appearance.",
        actionType: 'search',
        actionCall: 'search("Sherlock Holmes first appearance")',
        observation: 'Sherlock Holmes first appeared in "A Study in Scarlet" published in 1887 in Beeton\'s Christmas Annual.',
      },
      {
        thought: 'So the novel is "A Study in Scarlet" (1887). Now I need to confirm who wrote it.',
        actionType: 'search',
        actionCall: 'search("A Study in Scarlet author")',
        observation: '"A Study in Scarlet" was written by Arthur Conan Doyle.',
      },
      {
        thought: 'Arthur Conan Doyle wrote "A Study in Scarlet" in 1887, which introduced Sherlock Holmes to the world. I have everything needed for a complete answer.',
        actionType: 'finish',
        actionCall: "finish(\"Arthur Conan Doyle wrote 'A Study in Scarlet' (1887), which introduced Sherlock Holmes.\")",
        observation: '[Task complete]',
      },
    ],
    finalAnswer: "Arthur Conan Doyle wrote 'A Study in Scarlet' (1887), which introduced Sherlock Holmes.",
  },
};

const ACTION_STYLE = {
  search:    { icon: '🔍', color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  border: '1px solid rgba(251,146,60,0.3)' },
  calculate: { icon: '🧮', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' },
  lookup:    { icon: '📖', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  border: '1px solid rgba(251,191,36,0.3)' },
  finish:    { icon: '✓',  color: '#34d399', bg: 'rgba(52,211,153,0.15)',  border: '1px solid rgba(52,211,153,0.3)' },
};

function estimateTokens(text) {
  if (!text) return 0;
  return Math.round(text.trim().split(/\s+/).length * 1.3);
}

function Badge({ children, bg, color, border }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      background: bg,
      color,
      border: border || '1px solid transparent',
      borderRadius: '4px',
      padding: '2px 8px',
      fontSize: '10px',
      fontFamily: "'Inter', sans-serif",
      whiteSpace: 'nowrap',
      flexShrink: 0,
      lineHeight: 1.5,
    }}>
      {children}
    </span>
  );
}

function StepBlock({ step, index, animate }) {
  const as = ACTION_STYLE[step.actionType];
  const isTaskComplete = step.observation === '[Task complete]';

  return (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '14px 16px',
      marginBottom: '10px',
      position: 'relative',
      animation: animate ? 'reactSlideIn 300ms ease-out forwards' : 'none',
    }}>
      <span style={{
        position: 'absolute',
        top: '8px',
        right: '10px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        color: 'var(--text-muted)',
      }}>
        Step {index + 1}
      </span>

      {/* Thought */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Badge bg="rgba(45,212,191,0.15)" color="var(--accent)" border="1px solid rgba(45,212,191,0.3)">
          💭 Thought
        </Badge>
        <p style={{
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          color: '#b8c4cc',
          lineHeight: 1.55,
          fontStyle: 'italic',
        }}>
          {step.thought}
        </p>
      </div>

      {/* Action */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '8px' }}>
        <Badge bg={as.bg} color={as.color} border={as.border}>
          {as.icon} {step.actionType}
        </Badge>
        <code style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: '#fbbf24',
          background: 'var(--code-bg)',
          padding: '4px 8px',
          borderRadius: '4px',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          lineHeight: 1.5,
          display: 'inline-block',
        }}>
          {step.actionCall}
        </code>
      </div>

      {/* Observation */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '8px' }}>
        <Badge bg="rgba(136,136,136,0.12)" color="#888888" border="1px solid rgba(136,136,136,0.2)">
          👁 Observation
        </Badge>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: isTaskComplete ? '#34d399' : '#888888',
          lineHeight: 1.5,
        }}>
          {step.observation}
        </span>
      </div>
    </div>
  );
}

function FinalAnswer({ answer, animate }) {
  return (
    <div style={{
      background: 'rgba(52,211,153,0.08)',
      border: '1px solid #34d399',
      borderRadius: '8px',
      padding: '14px 16px',
      marginBottom: '10px',
      animation: animate
        ? 'reactSlideIn 300ms ease-out forwards, reactGreenPulse 800ms ease-out 200ms both'
        : 'none',
    }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Badge bg="rgba(52,211,153,0.15)" color="#34d399" border="1px solid rgba(52,211,153,0.4)">
          ✓ Final Answer
        </Badge>
        <p style={{
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: 'var(--text)',
          lineHeight: 1.5,
        }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />;
}

function StatRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#555555' }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: valueColor || '#2dd4bf',
        fontWeight: 500,
      }}>
        {value}
      </span>
    </div>
  );
}

function StatsPanel({ trace, stepsShown, finalShown }) {
  const visibleSteps = trace.steps.slice(0, stepsShown);
  const counts = { search: 0, calculate: 0, lookup: 0, finish: 0 };
  let thoughtTok = 0;
  let obsTok = 0;

  visibleSteps.forEach(s => {
    counts[s.actionType] = (counts[s.actionType] || 0) + 1;
    thoughtTok += estimateTokens(s.thought);
    obsTok += estimateTokens(s.observation);
  });

  const totalTok = thoughtTok + obsTok;
  const nCycles = trace.steps.filter(s => s.actionType !== 'finish').length;

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '12px',
      position: 'sticky',
      top: '20px',
    }}>
      <StatRow label="Task" value={trace.label} valueColor="#e8eaed" />
      <StatRow label="Steps" value={`${stepsShown} / ${trace.steps.length}`} />

      <Divider />

      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        color: '#555555',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '5px',
      }}>
        Actions used
      </div>
      <StatRow label="search" value={counts.search} />
      <StatRow label="calculate" value={counts.calculate} />
      <StatRow label="lookup" value={counts.lookup} />
      <StatRow label="finish" value={finalShown ? 1 : counts.finish} />

      <Divider />

      <StatRow label="thought ~tok" value={`~${thoughtTok}`} />
      <StatRow label="obs ~tok" value={`~${obsTok}`} />
      <StatRow label="total ~tok" value={`~${totalTok}`} />

      <Divider />

      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        color: '#555555',
        lineHeight: 1.8,
      }}>
        <span style={{ color: '#888888' }}>Pattern:</span><br />
        Thought → Action<br />
        → Obs × {nCycles}<br />
        → Finish
      </div>
    </div>
  );
}

const btnBase = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '12px',
  borderRadius: '6px',
  padding: '7px 14px',
  cursor: 'pointer',
  border: '1px solid var(--border)',
  background: 'var(--bg4)',
  color: 'var(--text)',
  transition: 'opacity 150ms',
};

const btnDisabled = {
  ...btnBase,
  opacity: 0.4,
  cursor: 'not-allowed',
};

export default function ReActLoop({ tryThis }) {
  const [selectedTask, setSelectedTask] = useState('curie');
  // 0..N: steps shown; N+1: final answer shown
  const [shownSteps, setShownSteps] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [skipAnim, setSkipAnim] = useState(false);

  const trace = TRACES[selectedTask];
  const N = trace.steps.length;
  const finalShown = shownSteps > N;
  const allDone = finalShown;

  useEffect(() => {
    setShownSteps(0);
    setIsPlaying(false);
    setSkipAnim(false);
  }, [selectedTask]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setShownSteps(s => (s <= N ? s + 1 : s));
    }, 2000);
    return () => clearInterval(id);
  }, [isPlaying, N]);

  useEffect(() => {
    if (allDone && isPlaying) setIsPlaying(false);
  }, [allDone, isPlaying]);

  function handleNextStep() {
    if (allDone) return;
    setSkipAnim(false);
    setShownSteps(s => s + 1);
  }

  function handleTogglePlay() {
    if (allDone) return;
    setIsPlaying(p => !p);
  }

  function handleReset() {
    setShownSteps(0);
    setIsPlaying(false);
    setSkipAnim(false);
  }

  function handleShowAll() {
    if (allDone) return;
    setSkipAnim(true);
    setIsPlaying(false);
    setShownSteps(N + 1);
  }

  const stepsShown = Math.min(shownSteps, N);

  return (
    <WidgetCard title="ReAct Loop — Thought, Action, Observation" number="24.1" tryThis={tryThis}>
      <style>{`
        @keyframes reactSlideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes reactGreenPulse {
          0%   { box-shadow: 0 0 0 0 rgba(52,211,153,0); border-color: #34d399; }
          40%  { box-shadow: 0 0 0 8px rgba(52,211,153,0.2); border-color: #6ee7b7; }
          100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); border-color: #34d399; }
        }
      `}</style>

      {/* Task tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {Object.entries(TRACES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setSelectedTask(key)}
            style={{
              background: selectedTask === key ? 'var(--accent-dim)' : 'var(--bg4)',
              color: selectedTask === key ? 'var(--accent)' : 'var(--text-mid)',
              border: `1px solid ${selectedTask === key ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '6px',
              padding: '5px 12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main: trace + stats panel */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Trace column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Task header */}
          <div style={{
            background: 'var(--bg4)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}>
            <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: 1.4 }}>📋</span>
            <div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#555555',
              }}>
                Task:{' '}
              </span>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: 'var(--text)',
                lineHeight: 1.5,
              }}>
                {trace.task}
              </span>
            </div>
          </div>

          {/* Empty state */}
          {shownSteps === 0 && (
            <div style={{
              color: '#555555',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              padding: '24px 0',
              textAlign: 'center',
            }}>
              Press "Next Step →" to begin the trace
            </div>
          )}

          {/* Step blocks */}
          {trace.steps.slice(0, stepsShown).map((step, i) => (
            <StepBlock
              key={`${selectedTask}-${i}`}
              step={step}
              index={i}
              animate={!skipAnim}
            />
          ))}

          {/* Final answer */}
          {finalShown && (
            <FinalAnswer answer={trace.finalAnswer} animate={!skipAnim} />
          )}
        </div>

        {/* Stats panel */}
        <div style={{ width: '180px', flexShrink: 0 }}>
          <StatsPanel
            trace={trace}
            stepsShown={stepsShown}
            finalShown={finalShown}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleNextStep}
          disabled={allDone}
          style={allDone ? {
            ...btnDisabled,
            background: 'var(--bg4)',
            border: '1px solid transparent',
            color: '#555555',
          } : {
            ...btnBase,
            background: 'var(--accent)',
            color: '#0d0d0d',
            border: '1px solid transparent',
            fontWeight: 600,
          }}
        >
          Next Step →
        </button>

        <button
          onClick={handleTogglePlay}
          disabled={allDone}
          style={allDone ? btnDisabled : btnBase}
        >
          {isPlaying ? 'Pause' : 'Auto-play'}
        </button>

        <button onClick={handleReset} style={btnBase}>
          Reset
        </button>

        <button
          onClick={handleShowAll}
          disabled={allDone}
          style={allDone ? btnDisabled : btnBase}
        >
          Show all
        </button>
      </div>
    </WidgetCard>
  );
}
