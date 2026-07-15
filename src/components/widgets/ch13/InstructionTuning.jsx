import { useState, useMemo, useRef, useEffect } from 'react';
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
  prose:     '#b8c4cc',
};

const PRESETS = {
  arithmetic: {
    label: 'Arithmetic',
    prompt: 'What is 17 + 28?',
    sftOutput: '17 + 28 = 45',
    baseOutput: 'What is 17 + 28? What is 17 + 28? I will explain this arithmetic problem step by step. First, we have 17. Then we add 28...',
  },
  translation: {
    label: 'Translation',
    prompt: "Translate to French: 'Hello, how are you?'",
    sftOutput: "Bonjour, comment ça va ?",
    baseOutput: "Translate to French: 'Hello, how are you?' Translate to German: 'Hello, how are you?' Translate to Spanish: ...",
  },
  summarization: {
    label: 'Summarization',
    prompt: "Summarize in one sentence: 'The Renaissance was a period in European history marking the transition from the Middle Ages to modernity.'",
    sftOutput: "The Renaissance was a transformative European cultural movement that revived classical ideas and bridged medieval and modern eras.",
    baseOutput: "Summarize in one sentence: 'The Renaissance was a period in European history...' Summarize this paragraph: '...'",
  },
  qa: {
    label: 'Q&A',
    prompt: 'What is the capital of Japan?',
    sftOutput: 'The capital of Japan is Tokyo.',
    baseOutput: 'What is the capital of Japan? This is a common geography question. Many people know that the capital of Japan is Tokyo, but let me first explain what a capital is...',
  },
};

function splitText(text) {
  return text.trim().split(/\s+/).map((w, i) => (i === 0 ? w : ' ' + w));
}

function tokenize(prompt, sftOutput) {
  const userTokens = splitText(prompt);
  const responseTokens = splitText(sftOutput);
  return [
    { text: '<user>', type: 'delim' },
    ...userTokens.map(t => ({ text: t, type: 'user' })),
    { text: '</user>', type: 'delim' },
    { text: '<assistant>', type: 'delim' },
    ...responseTokens.map(t => ({ text: t, type: 'response' })),
    { text: '</assistant>', type: 'delim' },
  ];
}

function hashLoss(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(h ^ text.charCodeAt(i), 16777619)) >>> 0;
  }
  return 0.15 + ((h % 850) / 1000);
}

function StatRow({ label, value, color, dim }) {
  return (
    <div style={{ marginBottom: dim ? '5px' : '9px' }}>
      <div style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: '8.5px',
        color: C.muted,
        marginBottom: '2px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: dim ? '10px' : '12px',
        color: color || C.accent,
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

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

function TokenChip({ token, index, loss, showMarkers, onEnter, onLeave }) {
  const { type, text } = token;

  const chipStyle = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '34px',
    padding: '0 7px',
    borderRadius: '4px',
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: type === 'delim' ? '9px' : '10px',
    whiteSpace: 'nowrap',
    cursor: 'default',
    ...(type === 'user' && {
      background: C.bg4,
      border: `1px solid ${C.border}`,
      color: C.muted,
    }),
    ...(type === 'delim' && {
      background: C.bg4,
      border: `1px dashed ${C.borderLt}`,
      color: C.math,
    }),
    ...(type === 'response' && {
      background: C.accentDim,
      border: `1.5px solid ${C.accent}`,
      color: C.accent,
      fontWeight: 600,
    }),
  };

  const showBadge = showMarkers && (type === 'user' || type === 'delim' || type === 'response');

  return (
    <button
      type="button"
      aria-label={`Inspect token ${token.trim()}, loss ${loss.toFixed(2)}`}
      style={chipStyle}
      onMouseEnter={(e) => onEnter(index, token, loss, e)}
      onMouseLeave={onLeave}
      onFocus={(e) => onEnter(index, token, loss, e)}
      onBlur={onLeave}
      onClick={(e) => onEnter(index, token, loss, e)}
    >
      {showBadge && (
        <span style={{
          position: 'absolute',
          top: '-5px',
          right: '-2px',
          fontSize: '7px',
          fontFamily: "'JetBrains Mono',monospace",
          color: type === 'response' ? C.accent : C.muted,
          background: C.bg2,
          padding: '0 2px',
          borderRadius: '2px',
          lineHeight: 1,
          zIndex: 1,
        }}>
          {type === 'response' ? 'L' : 'M'}
        </span>
      )}
      {text}
    </button>
  );
}

export default function InstructionTuning({ tryThis }) {
  const [preset, setPreset] = useState('arithmetic');
  const [showMarkers, setShowMarkers] = useState(true);
  const [showBars, setShowBars] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const [contentOpacity, setContentOpacity] = useState(1);
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  const p = PRESETS[preset];
  const tokens = useMemo(() => tokenize(p.prompt, p.sftOutput), [preset]);
  const lossValues = useMemo(
    () => tokens.map(t => (t.type === 'response' ? hashLoss(t.text) : 0)),
    [tokens],
  );

  const stats = useMemo(() => {
    const userCount    = tokens.filter(t => t.type === 'user').length;
    const delimCount   = tokens.filter(t => t.type === 'delim').length;
    const responseCount = tokens.filter(t => t.type === 'response').length;
    const totalLoss    = lossValues.reduce((s, v) => s + v, 0);
    return {
      total: tokens.length,
      userCount,
      delimCount,
      responseCount,
      maskedCount: userCount + delimCount,
      totalLoss,
    };
  }, [tokens, lossValues]);

  // Draw loss chart canvas
  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const N = tokens.length;
    if (N === 0) return;

    const padL = 6, padR = 108, padT = 20, padB = 14;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const step   = chartW / N;
    const barW   = Math.max(1, step - 1);

    // Section title
    ctx.font      = `400 9px Inter, sans-serif`;
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText('Cross-entropy on response tokens only', padL, 13);

    // Baseline
    ctx.strokeStyle = C.border;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT + chartH);
    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.stroke();

    // Bars
    tokens.forEach((token, i) => {
      const loss = lossValues[i];
      const x    = padL + i * step;
      const barH = loss * chartH;
      const y    = padT + chartH - barH;

      if (token.type === 'response') {
        ctx.globalAlpha = 0.82;
        ctx.fillStyle   = C.accent;
        ctx.fillRect(x, y, barW, barH);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = token.type === 'delim' ? C.borderLt : C.border;
        ctx.fillRect(x, padT + chartH - 2, barW, 2);
      }
    });

    // Loss sum (right side)
    const midY = padT + chartH / 2;
    ctx.font      = `400 9px 'JetBrains Mono', monospace`;
    ctx.fillStyle = C.mid;
    ctx.textAlign = 'left';
    ctx.fillText('Sim. L_SFT =', padL + chartW + 8, midY - 5);
    ctx.font      = `600 13px 'JetBrains Mono', monospace`;
    ctx.fillStyle = C.accent;
    ctx.fillText(stats.totalLoss.toFixed(2), padL + chartW + 8, midY + 10);
  }, [tokens, lossValues, showBars]);

  const handlePresetChange = (key) => {
    if (key === preset) return;
    setContentOpacity(0);
    setTimeout(() => {
      setPreset(key);
      setContentOpacity(1);
    }, 200);
  };

  const handleTokenEnter = (index, token, loss, e) => {
    if (!containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const tr = e.currentTarget.getBoundingClientRect();
    setTooltip({
      index, token, loss,
      x: tr.left - cr.left + tr.width / 2,
      y: tr.top  - cr.top  - 2,
    });
  };

  // Build token chip list with optional section break before <assistant>
  const tokenElements = [];
  tokens.forEach((token, i) => {
    if (token.text === '<assistant>' && showBoundaries) {
      tokenElements.push(
        <div key={`sep-${i}`} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: '6px', margin: '3px 0 2px', flexShrink: 0,
        }}>
          <div style={{ flex: 1, borderTop: `1px dotted ${C.borderLt}` }} />
          <span style={{ fontSize: '8px', color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
            assistant
          </span>
          <div style={{ flex: 1, borderTop: `1px dotted ${C.borderLt}` }} />
        </div>,
      );
    }
    tokenElements.push(
      <TokenChip
        key={i}
        token={token}
        index={i}
        loss={lossValues[i]}
        showMarkers={showMarkers}
        onEnter={handleTokenEnter}
        onLeave={() => setTooltip(null)}
      />,
    );
  });

  return (
    <WidgetCard title="Instruction Tuning — loss masking and behavior change" number="13.2" tryThis={tryThis}>
      {/* Preset tabs */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: '14px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {Object.entries(PRESETS).map(([key, pd]) => {
          const active = key === preset;
          return (
            <button
              key={key}
              onClick={() => handlePresetChange(key)}
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
              {pd.label}
            </button>
          );
        })}
      </div>

      {/* Main layout: content + right stats panel */}
      <div
        ref={containerRef}
        style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', position: 'relative' }}
      >
        {/* Left: visualization (fades on preset switch) */}
        <div style={{ flex: 1, minWidth: 0, opacity: contentOpacity, transition: 'opacity 0.2s ease' }}>

          {/* Token stream */}
          <div style={{
            background: '#0a0a0a',
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            padding: '10px 10px 12px',
            marginBottom: '8px',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: '8.5px',
              color: C.muted,
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}>
              TOKEN STREAM
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center' }}>
              {tokenElements}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {[
              { bg: C.bg4, border: `1px solid ${C.border}`,        color: C.muted,  label: 'User tokens (masked)' },
              { bg: C.bg4, border: `1px dashed ${C.borderLt}`,     color: C.math,   label: 'Delimiters' },
              { bg: C.accentDim, border: `1.5px solid ${C.accent}`, color: C.accent, label: 'Response tokens (loss)' },
            ].map(({ bg, border, color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '24px', height: '13px', borderRadius: '3px', background: bg, border, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: C.mid }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Loss chart (canvas) */}
          {showBars && (
            <div style={{
              background: '#0a0a0a',
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              padding: '4px 4px 2px',
              marginBottom: '12px',
            }}>
              <canvas
                ref={chartRef}
                style={{ width: '100%', height: '88px', display: 'block' }}
              />
            </div>
          )}

          {/* Side-by-side comparison */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Base model */}
            <div style={{
              flex: 1,
              borderRadius: '6px',
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid rgba(248,113,113,0.4)`,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '5px 10px',
                background: C.bg4,
                borderBottom: `1px solid ${C.border}`,
                fontFamily: "'Inter',sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                color: C.red,
              }}>
                Base (no SFT)
              </div>
              <div style={{
                padding: '5px 10px',
                background: '#0a0a0a',
                borderBottom: `1px solid ${C.border}`,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: '9.5px',
                color: C.muted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                User: {p.prompt}
              </div>
              <div style={{
                padding: '10px',
                fontFamily: "'Inter',sans-serif",
                fontSize: '12px',
                color: C.prose,
                lineHeight: 1.6,
              }}>
                {p.baseOutput}
              </div>
            </div>

            {/* SFT model */}
            <div style={{
              flex: 1,
              borderRadius: '6px',
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${C.accent}`,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '5px 10px',
                background: C.bg4,
                borderBottom: `1px solid ${C.border}`,
                fontFamily: "'Inter',sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                color: C.accent,
              }}>
                After SFT
              </div>
              <div style={{
                padding: '5px 10px',
                background: '#0a0a0a',
                borderBottom: `1px solid ${C.border}`,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: '9.5px',
                color: C.muted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                User: {p.prompt}
              </div>
              <div style={{
                padding: '10px',
                fontFamily: "'Inter',sans-serif",
                fontSize: '12px',
                color: C.prose,
                lineHeight: 1.6,
              }}>
                {p.sftOutput}
              </div>
            </div>
          </div>

          {/* Annotation */}
          <p style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: '11px',
            color: C.muted,
            fontStyle: 'italic',
            lineHeight: 1.5,
            margin: '8px 0 0',
          }}>
            ↑ SFT teaches the model that "instruction" is a request to fulfill, not a pattern to continue.
          </p>
        </div>

        {/* Stats panel */}
        <div style={{
          width: '176px',
          flexShrink: 0,
          background: C.bg2,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '12px 13px',
          alignSelf: 'flex-start',
        }}>
          <StatRow label="Prompt" value={p.label} color={C.text} />

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />

          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '8.5px', color: C.muted, letterSpacing: '0.06em', marginBottom: '8px' }}>
            SEQUENCE
          </div>
          <StatRow label="Total tokens"    value={String(stats.total)}         dim />
          <StatRow label="User tokens"     value={String(stats.userCount)}     color={C.mid} dim />
          <StatRow label="Structural"      value={String(stats.delimCount)}    color={C.mid} dim />
          <StatRow label="Response tokens" value={String(stats.responseCount)} dim />

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />

          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '8.5px', color: C.muted, letterSpacing: '0.06em', marginBottom: '8px' }}>
            LOSS MASKING
          </div>
          <StatRow label="Masked"   value={String(stats.maskedCount)}   color={C.mid} dim />
          <StatRow label="Unmasked" value={String(stats.responseCount)} dim />

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />

          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '8.5px', color: C.muted, letterSpacing: '0.06em', marginBottom: '6px' }}>
            TRAINING SIGNAL
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: '9px',
            color: C.mid,
            lineHeight: 1.7,
            marginBottom: '8px',
          }}>
            L_SFT = Σ over<br />response tokens<br />= −Σ log p_θ(y_t)
          </div>
          <StatRow label="Simulated L_SFT" value={stats.totalLoss.toFixed(2)} />

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />

          <p style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: '10px',
            color: C.muted,
            fontStyle: 'italic',
            lineHeight: 1.55,
            margin: 0,
          }}>
            "The model learns to predict the response GIVEN the instruction — not the instruction itself."
          </p>
        </div>

        {/* Hover tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: tooltip.x + 10,
            top: Math.max(0, tooltip.y - 46),
            pointerEvents: 'none',
            background: C.bg2,
            border: `1px solid ${C.border}`,
            borderRadius: '4px',
            padding: '5px 9px',
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: '10px',
            color: C.text,
            zIndex: 20,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}>
            {tooltip.token.type === 'response'
              ? `Token ${tooltip.index}: '${tooltip.token.text}' | UNMASKED | −log p_θ ≈ ${tooltip.loss.toFixed(2)}`
              : tooltip.token.type === 'delim'
              ? `Token ${tooltip.index}: '${tooltip.token.text}' | delimiter | no loss`
              : `Token ${tooltip.index}: '${tooltip.token.text}' | masked | no loss contribution`}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        paddingTop: '12px',
        marginTop: '14px',
        borderTop: `1px solid ${C.border}`,
      }}>
        <Toggle label="Loss markers" checked={showMarkers} onChange={setShowMarkers} />
        <Toggle label="Loss bars"    checked={showBars}    onChange={setShowBars} />
        <Toggle label="Boundaries"   checked={showBoundaries} onChange={setShowBoundaries} />
      </div>
    </WidgetCard>
  );
}
