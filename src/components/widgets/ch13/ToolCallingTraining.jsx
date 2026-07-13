import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  text:      '#e8eaed',
  muted:     '#555555',
  mid:       '#888888',
  math:      '#fbbf24',
  red:       '#f87171',
  purple:    '#a78bfa',
  codeBg:    '#0a0a0a',
  prose:     '#b8c4cc',
};

const HAS_LOSS = {
  user_text:         false,
  user_delim:        false,
  assistant_delim:   true,
  tool_use_delim:    true,
  tool_use_json:     true,
  tool_result_delim: false,
  tool_result_json:  false,
  final_response:    true,
};

function chipStyle(type) {
  switch (type) {
    case 'user_text':
      return { background: C.bg4, border: `1px solid ${C.border}`, color: C.muted };
    case 'user_delim':
      return { background: C.bg4, border: `1px dashed ${C.borderLt}`, color: C.math };
    case 'assistant_delim':
      return { background: C.accentDim, border: `1px dashed ${C.accent}`, color: C.accent };
    case 'tool_use_delim':
      return { background: 'rgba(167,139,250,0.15)', border: `1px dashed rgba(167,139,250,0.4)`, color: C.purple };
    case 'tool_use_json':
      return { background: 'rgba(167,139,250,0.15)', border: `1px solid rgba(167,139,250,0.3)`, color: C.purple };
    case 'tool_result_delim':
      return { background: 'rgba(251,191,36,0.12)', border: `1px dashed rgba(251,191,36,0.35)`, color: C.math };
    case 'tool_result_json':
      return { background: 'rgba(251,191,36,0.12)', border: `1px solid rgba(251,191,36,0.25)`, color: C.math };
    case 'final_response':
      return { background: C.accentDim, border: `1px solid ${C.accent}`, color: C.accent };
    default:
      return { background: C.bg4, border: `1px solid ${C.border}`, color: C.muted };
  }
}

function displayText(type, text) {
  if (type === 'tool_use_json') {
    try {
      const obj = JSON.parse(text);
      return `{"name": "${obj.name}", "arguments": {...}}`;
    } catch {
      return text.slice(0, 40) + '...';
    }
  }
  if (type === 'tool_result_json') {
    return text.length > 48 ? text.slice(0, 45) + '...' : text;
  }
  if (type === 'final_response') {
    return text.length > 60 ? text.slice(0, 57) + '...' : text;
  }
  return text;
}

// Split flat chunk list into 4 semantic turn groups
function groupChunks(chunks) {
  const user = [], toolCall = [], toolResult = [], response = [];
  chunks.forEach(c => {
    if (c.type === 'user_delim' || c.type === 'user_text') {
      user.push(c);
    } else if (c.type === 'tool_result_delim' || c.type === 'tool_result_json') {
      toolResult.push(c);
    } else if (c.type === 'final_response' || (c.type === 'assistant_delim' && c.text === '</assistant>')) {
      response.push(c);
    } else {
      toolCall.push(c);
    }
  });
  return { user, toolCall, toolResult, response };
}

const TRAINING_EXAMPLES = {
  weather: [
    { type: 'user_delim',        text: '<user>' },
    { type: 'user_text',         text: "What's the weather in Tokyo right now?" },
    { type: 'user_delim',        text: '</user>' },
    { type: 'assistant_delim',   text: '<assistant>' },
    { type: 'tool_use_delim',    text: '<tool_use>' },
    { type: 'tool_use_json',     text: '{"name":"get_weather","arguments":{"location":"Tokyo, Japan"}}' },
    { type: 'tool_use_delim',    text: '</tool_use>' },
    { type: 'tool_result_delim', text: '<tool_result>' },
    { type: 'tool_result_json',  text: '{"temp_c":22,"condition":"partly cloudy","humidity":65}' },
    { type: 'tool_result_delim', text: '</tool_result>' },
    { type: 'final_response',    text: "It's currently 22°C and partly cloudy in Tokyo, with 65% humidity." },
    { type: 'assistant_delim',   text: '</assistant>' },
  ],
  math: [
    { type: 'user_delim',        text: '<user>' },
    { type: 'user_text',         text: 'What is 347 × 28?' },
    { type: 'user_delim',        text: '</user>' },
    { type: 'assistant_delim',   text: '<assistant>' },
    { type: 'tool_use_delim',    text: '<tool_use>' },
    { type: 'tool_use_json',     text: '{"name":"calculate","arguments":{"expression":"347 * 28"}}' },
    { type: 'tool_use_delim',    text: '</tool_use>' },
    { type: 'tool_result_delim', text: '<tool_result>' },
    { type: 'tool_result_json',  text: '{"result":9716}' },
    { type: 'tool_result_delim', text: '</tool_result>' },
    { type: 'final_response',    text: '347 × 28 = 9,716.' },
    { type: 'assistant_delim',   text: '</assistant>' },
  ],
  search: [
    { type: 'user_delim',        text: '<user>' },
    { type: 'user_text',         text: 'Who won the 2024 Nobel Prize in Physics?' },
    { type: 'user_delim',        text: '</user>' },
    { type: 'assistant_delim',   text: '<assistant>' },
    { type: 'tool_use_delim',    text: '<tool_use>' },
    { type: 'tool_use_json',     text: '{"name":"web_search","arguments":{"query":"2024 Nobel Prize Physics winners"}}' },
    { type: 'tool_use_delim',    text: '</tool_use>' },
    { type: 'tool_result_delim', text: '<tool_result>' },
    { type: 'tool_result_json',  text: '{"results":"Hopfield & Hinton awarded for foundational ML work"}' },
    { type: 'tool_result_delim', text: '</tool_result>' },
    { type: 'final_response',    text: 'The 2024 Nobel Prize in Physics was awarded to Hopfield and Hinton for foundational ML work.' },
    { type: 'assistant_delim',   text: '</assistant>' },
  ],
};

const COMPARISONS = {
  weather: {
    prompt: "What's the weather in Tokyo right now?",
    withoutTools: {
      text: "It depends on the season. Tokyo is generally warm in summer and cool in winter. I don't have access to real-time weather data.",
      annotation: "Model has no way to access current data.",
    },
    withTools: {
      toolCall: 'get_weather({"location": "Tokyo, Japan"})',
      toolResult: '[Tool returns: 22°C, partly cloudy]',
      response: "It's currently 22°C and partly cloudy in Tokyo.",
      annotation: "Model recognized tool need and produced valid JSON call.",
    },
  },
  math: {
    prompt: "What is 347 × 28?",
    withoutTools: {
      text: "347 times 28 equals 9716. Let me double check... yes, 9716.",
      annotation: "Model attempts mental math, may be wrong, no verification.",
    },
    withTools: {
      toolCall: 'calculate({"expression": "347 * 28"})',
      toolResult: '[Tool returns: 9716]',
      response: "347 × 28 = 9,716.",
      annotation: "Delegated to calculator — exact and verifiable.",
    },
  },
  search: {
    prompt: "Who won the 2024 Nobel Prize in Physics?",
    withoutTools: {
      text: "I cannot verify recent events. My training data may not include 2024 Nobel Prize information.",
      annotation: "Model correctly acknowledges knowledge cutoff.",
    },
    withTools: {
      toolCall: 'web_search({"query": "2024 Nobel Prize Physics winners"})',
      toolResult: '[Tool returns: Hopfield & Hinton, neural networks]',
      response: "The 2024 Nobel Prize in Physics was awarded to John Hopfield and Geoffrey Hinton.",
      annotation: "Retrieved current information beyond training cutoff.",
    },
  },
};

// Anatomy always shows the weather tool call as the canonical example
const ANATOMY_LINES = [
  { code: '<tool_use>',                        annotation: null },
  { code: '{',                                  annotation: null },
  { code: '  "name": "get_weather",',          annotation: 'Tool name (matches schema)' },
  { code: '  "arguments": {',                  annotation: 'Arguments object' },
  { code: '    "location": "Tokyo, Japan",',   annotation: 'Parameter value' },
  { code: '    "units": "celsius"',            annotation: 'Optional parameter' },
  { code: '  }',                               annotation: null },
  { code: '}',                                  annotation: null },
  { code: '</tool_use>',                       annotation: null },
];

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', userSelect: 'none' }}>
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: '28px', height: '14px', borderRadius: '7px',
          background: checked ? C.accent : C.bg4,
          border: `1px solid ${checked ? C.accent : C.border}`,
          position: 'relative', cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '1px',
          left: checked ? '14px' : '1px',
          width: '10px', height: '10px', borderRadius: '50%',
          background: checked ? '#0a0a0a' : C.muted,
          transition: 'left 0.15s',
        }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: C.muted }}>
        {label}
      </span>
    </label>
  );
}

function TokenChip({ chunk, showLoss }) {
  const { type, text } = chunk;
  const lossOn = HAS_LOSS[type];
  const cs = chipStyle(type);

  return (
    <div
      title={text}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        height: '26px',
        padding: '0 7px',
        borderRadius: '4px',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: '10px',
        whiteSpace: 'nowrap',
        cursor: 'default',
        ...cs,
      }}
    >
      {showLoss && (
        <span style={{
          position: 'absolute',
          top: '-5px', right: '-2px',
          fontSize: '7px',
          fontFamily: "'JetBrains Mono',monospace",
          color: lossOn ? C.accent : C.muted,
          background: C.bg2,
          padding: '0 2px',
          borderRadius: '2px',
          lineHeight: 1,
          zIndex: 1,
          border: `1px solid ${C.border}`,
        }}>
          {lossOn ? 'L' : 'M'}
        </span>
      )}
      {displayText(type, text)}
    </div>
  );
}

// Labeled turn group inside the token stream
function TurnGroup({ label, lossOn, chunks, showLoss }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: '7.5px',
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          flexShrink: 0,
        }}>
          {label}
        </span>
        <div style={{ flex: 1, height: '1px', background: C.border }} />
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: '7px',
          padding: '1px 6px',
          borderRadius: '2px',
          flexShrink: 0,
          color: lossOn ? C.accent : C.mid,
          background: lossOn ? 'rgba(45,212,191,0.08)' : 'transparent',
          border: `1px solid ${lossOn ? 'rgba(45,212,191,0.2)' : C.border}`,
        }}>
          {lossOn ? 'LOSS' : 'MASKED'}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center', paddingLeft: '2px' }}>
        {chunks.map((chunk, i) => (
          <TokenChip key={i} chunk={chunk} showLoss={showLoss} />
        ))}
      </div>
    </div>
  );
}

export default function ToolCallingTraining() {
  const [preset, setPreset] = useState('weather');
  const [showLoss, setShowLoss] = useState(true);
  const [showAnatomy, setShowAnatomy] = useState(true);
  const [contentOpacity, setContentOpacity] = useState(1);

  const chunks = TRAINING_EXAMPLES[preset];
  const comp = COMPARISONS[preset];
  const groups = groupChunks(chunks);

  const handlePreset = (key) => {
    if (key === preset) return;
    setContentOpacity(0);
    setTimeout(() => {
      setPreset(key);
      setContentOpacity(1);
    }, 180);
  };

  return (
    <WidgetCard title="Tool Calling Training — teaching the model to emit function calls" number="10.5">

      {/* Preset tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '16px', borderBottom: `1px solid ${C.border}` }}>
        {[['weather', 'Weather'], ['math', 'Math'], ['search', 'Search']].map(([key, label]) => {
          const active = key === preset;
          return (
            <button
              key={key}
              onClick={() => handlePreset(key)}
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: '11px',
                fontWeight: active ? 600 : 400,
                color: active ? C.accent : C.muted,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
                padding: '6px 14px 8px',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Section 1: Token stream — organized by turn ───────────────────── */}
      <div
        style={{
          background: C.codeBg,
          border: `1px solid ${C.border}`,
          borderRadius: '6px',
          padding: '12px 14px 8px',
          marginBottom: '10px',
          opacity: contentOpacity,
          transition: 'opacity 0.18s ease',
        }}
      >
        {/* Header + legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: '8.5px',
            color: C.muted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Training example — token stream
          </span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { bg: C.bg4,                   border: `1px solid ${C.border}`,           label: 'User' },
              { bg: 'rgba(167,139,250,0.15)', border: `1px solid rgba(167,139,250,0.3)`, label: 'Tool call' },
              { bg: 'rgba(251,191,36,0.12)',  border: `1px solid rgba(251,191,36,0.25)`, label: 'Tool result' },
              { bg: C.accentDim,             border: `1px solid ${C.accent}`,           label: 'Response' },
            ].map(({ bg, border, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '18px', height: '10px', borderRadius: '2px', background: bg, border, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '9.5px', color: C.mid }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Four labeled turn groups */}
        <TurnGroup label="User turn" lossOn={false} chunks={groups.user} showLoss={showLoss} />
        <TurnGroup label="Assistant → tool call" lossOn={true} chunks={groups.toolCall} showLoss={showLoss} />
        <TurnGroup label="Tool result" lossOn={false} chunks={groups.toolResult} showLoss={showLoss} />
        <TurnGroup label="Final response" lossOn={true} chunks={groups.response} showLoss={showLoss} />
      </div>

      {/* ── Section 2: Comparison — same prompt, two models ───────────────── */}
      <div
        style={{
          border: `1px solid ${C.border}`,
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: showAnatomy ? '10px' : '10px',
          opacity: contentOpacity,
          transition: 'opacity 0.18s ease',
        }}
      >
        {/* Shared prompt header */}
        <div style={{
          padding: '6px 12px',
          background: C.bg4,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          gap: '6px',
          alignItems: 'baseline',
        }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', color: C.mid, flexShrink: 0 }}>
            User:
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', color: C.muted }}>
            {comp.prompt}
          </span>
        </div>

        {/* Two response panels */}
        <div style={{ display: 'flex' }}>

          {/* Without tool training */}
          <div style={{ flex: 1, borderRight: `1px solid ${C.border}`, borderLeft: `3px solid ${C.red}`, background: 'rgba(248,113,113,0.04)' }}>
            <div style={{
              padding: '5px 12px',
              borderBottom: `1px solid ${C.border}`,
              fontFamily: "'Inter',sans-serif",
              fontSize: '11px',
              fontWeight: 500,
              color: C.red,
            }}>
              Base SFT (no tools)
            </div>
            <div style={{
              padding: '10px 12px',
              fontFamily: "'Inter',sans-serif",
              fontSize: '12px',
              color: C.prose,
              lineHeight: 1.6,
              minHeight: '72px',
            }}>
              {comp.withoutTools.text}
            </div>
            <div style={{
              padding: '5px 12px 8px',
              borderTop: `1px solid ${C.border}`,
              fontFamily: "'Inter',sans-serif",
              fontSize: '10px',
              color: C.muted,
              fontStyle: 'italic',
            }}>
              {comp.withoutTools.annotation}
            </div>
          </div>

          {/* After tool training */}
          <div style={{ flex: 1, borderLeft: `3px solid ${C.accent}`, background: 'rgba(45,212,191,0.04)' }}>
            <div style={{
              padding: '5px 12px',
              borderBottom: `1px solid ${C.border}`,
              fontFamily: "'Inter',sans-serif",
              fontSize: '11px',
              fontWeight: 500,
              color: C.accent,
            }}>
              After tool training
            </div>
            <div style={{ padding: '10px 12px', minHeight: '72px' }}>
              <div style={{
                background: 'rgba(167,139,250,0.1)',
                border: `1px solid rgba(167,139,250,0.25)`,
                borderRadius: '4px',
                padding: '4px 9px',
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: '10.5px',
                color: C.purple,
                marginBottom: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                ▸ Calling {comp.withTools.toolCall}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: '10px',
                color: C.math,
                fontStyle: 'italic',
                marginBottom: '6px',
              }}>
                {comp.withTools.toolResult}
              </div>
              <div style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: '12px',
                color: C.prose,
                lineHeight: 1.6,
              }}>
                {comp.withTools.response}
              </div>
            </div>
            <div style={{
              padding: '5px 12px 8px',
              borderTop: `1px solid ${C.border}`,
              fontFamily: "'Inter',sans-serif",
              fontSize: '10px',
              color: C.muted,
              fontStyle: 'italic',
            }}>
              {comp.withTools.annotation}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Anatomy — static, weather canonical example ────────── */}
      {showAnatomy && (
        <div style={{
          background: C.codeBg,
          border: `1px solid ${C.border}`,
          borderRadius: '6px',
          padding: '12px 14px',
          marginBottom: '10px',
        }}>
          <div style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: '11px',
            color: C.text,
            marginBottom: '8px',
          }}>
            Anatomy of a tool call
          </div>
          {ANATOMY_LINES.map((line, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              minHeight: '19px',
            }}>
              {/* Code — fixed 240px so annotations align in a column */}
              <div style={{
                width: '240px',
                flexShrink: 0,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: '11px',
                color: C.purple,
                whiteSpace: 'pre',
              }}>
                {line.code}
              </div>
              {/* Arrow + annotation */}
              {line.annotation && (
                <>
                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: '10px',
                    color: C.purple,
                    opacity: 0.5,
                    flexShrink: 0,
                  }}>
                    ←
                  </div>
                  <div style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: '10px',
                    color: C.mid,
                    fontStyle: 'italic',
                  }}>
                    {line.annotation}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Section 4: Info strip — key facts ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        border: `1px solid ${C.border}`,
        borderRadius: '6px',
        overflow: 'hidden',
        background: C.bg4,
        marginBottom: '14px',
      }}>
        {/* Cell 1: Key insight */}
        <div style={{ flex: 1, padding: '10px 13px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: C.text, marginBottom: '5px' }}>
            Key insight
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', color: C.accent, marginBottom: '4px' }}>
            TRAINED, not architectural.
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '8.5px', color: C.muted, lineHeight: 1.6 }}>
            Any transformer can learn to emit tool calls. It's a training objective, not a model architecture change.
          </div>
        </div>

        {/* Cell 2: Loss masking */}
        <div style={{ flex: 1, padding: '10px 13px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: C.text, marginBottom: '5px' }}>
            Loss masking
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '8.5px', color: C.muted, lineHeight: 1.7 }}>
            <span style={{ color: C.accent }}>ON: </span>assistant tokens + tool_use<br />
            <span style={{ color: C.mid }}>OFF: </span>user input + tool_result<br />
            <span style={{ color: C.muted, fontSize: '8px' }}>
              Tool results come from external execution — not from the model, so not trained on.
            </span>
          </div>
        </div>

        {/* Cell 3: Training scale */}
        <div style={{ flex: 1, padding: '10px 13px' }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: C.text, marginBottom: '5px' }}>
            Training requirements
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '8.5px', color: C.muted, lineHeight: 1.7 }}>
            ~10K–100K conversations<br />
            50–500 distinct tools<br />
            error handling + negative examples<br />
            <span style={{ color: C.mid, fontSize: '8px', fontStyle: 'italic' }}>
              Ch17 W17.2 shows runtime tool use.
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        paddingTop: '12px',
        borderTop: `1px solid ${C.border}`,
      }}>
        <Toggle label="Show loss badges" checked={showLoss} onChange={setShowLoss} />
        <Toggle label="Show anatomy"    checked={showAnatomy} onChange={setShowAnatomy} />
      </div>
    </WidgetCard>
  );
}
