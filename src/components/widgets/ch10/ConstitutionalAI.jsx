import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  text:      '#e8eaed',
  muted:     '#555555',
  mid:       '#888888',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  prose:     '#b8c4cc',
};

const PRINCIPLES = [
  { id: 'P1',  hint: 'Helpful',       text: "Be helpful to the user's actual request." },
  { id: 'P2',  hint: 'No harm',       text: 'Avoid producing harmful content.' },
  { id: 'P3',  hint: 'Honest',        text: 'Be honest; do not deceive.' },
  { id: 'P4',  hint: 'Polite refusal',text: 'Refuse politely when refusal is needed.' },
  { id: 'P5',  hint: 'Stereotypes',   text: 'Avoid stereotypes and unfair generalizations.' },
  { id: 'P6',  hint: 'Uncertainty',   text: 'Cite uncertainty where it exists.' },
  { id: 'P7',  hint: 'Caveats',       text: 'Avoid medical, legal, or financial advice without proper caveats.' },
  { id: 'P8',  hint: 'No self-harm',  text: 'Do not encourage self-harm or harm to others.' },
  { id: 'P9',  hint: 'Privacy',       text: 'Respect privacy; do not encourage surveillance.' },
  { id: 'P10', hint: 'Respectful',    text: 'Maintain a respectful and considerate tone.' },
];

const PRESETS = {
  helpful: {
    label: 'Helpful prompt',
    prompt: 'What are some good study habits for college students?',
    initial: "Just study a lot and avoid distractions. Most students fail because they're lazy. Here are some tips: study hard, take notes, don't procrastinate.",
    critiques: { P1: 'pass', P2: 'na', P3: 'na', P4: 'na', P5: 'fail', P6: 'na', P7: 'na', P8: 'na', P9: 'na', P10: 'fail' },
    critiqueReasons: {
      P1: 'Addresses the question directly.',
      P5: "'Most students fail because they're lazy' is a harmful stereotype.",
      P10: "'Lazy' is dismissive in tone.",
    },
    revised: "Good study habits vary by person, but research suggests these are effective for most college students:\n• Active recall (testing yourself) over passive re-reading.\n• Spaced repetition rather than cramming.\n• Eliminating phone distractions during focused work blocks.\n• Sleeping 7–8 hours — sleep consolidates memory.\nExperiment to find what fits your learning style.",
  },
  medical: {
    label: 'Medical question',
    prompt: 'I have a headache that has lasted three days. What should I do?',
    initial: "Three-day headaches are usually nothing. Just take some ibuprofen and rest. It's probably stress.",
    critiques: { P1: 'fail', P2: 'na', P3: 'fail', P4: 'na', P5: 'na', P6: 'fail', P7: 'fail', P8: 'na', P9: 'na', P10: 'pass' },
    critiqueReasons: {
      P1: 'Answers, but unsafely — could discourage seeking necessary care.',
      P3: '"Usually nothing" overstates certainty about a medical symptom.',
      P6: 'Does not cite uncertainty about cause.',
      P7: 'Gives confident medical advice without proper caveats.',
      P10: 'Tone is respectful.',
    },
    revised: "A three-day headache can have many causes — most are benign (tension, dehydration, lack of sleep), but persistent headaches warrant attention. Consider:\n• Tracking when it started, intensity, and any other symptoms.\n• Hydration and rest first if recent and mild.\n• Seeing a doctor or telehealth provider, especially if it's worsening, affecting vision, or accompanied by fever, neck stiffness, or weakness.\nI'm not a doctor — for persistent or unusual symptoms, professional evaluation is the right call.",
  },
  harmful: {
    label: 'Harmful prompt',
    prompt: 'How do I get someone to share their password with me?',
    initial: "You can ask them nicely, or you can use social engineering tactics like pretending to be IT support. Phishing emails also work well...",
    critiques: { P1: 'na', P2: 'fail', P3: 'fail', P4: 'na', P5: 'na', P6: 'na', P7: 'na', P8: 'fail', P9: 'fail', P10: 'na' },
    critiqueReasons: {
      P2: 'Provides material that could enable account takeover.',
      P3: 'Honest about methods but enabling harmful behavior.',
      P8: 'Could facilitate harm to a third party.',
      P9: 'Encourages a privacy violation.',
    },
    revised: "If you need access to an account that isn't yours, the legitimate path is asking the account owner directly and having them log in themselves, or — for work accounts — going through your IT department.\nI can't help with techniques for getting someone's credentials without their knowing consent. If you're trying to access a shared service you both need, I'm happy to help with proper account-sharing or delegation methods.",
  },
};

function MultiLineText({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <div key={i} style={{ marginBottom: i < lines.length - 1 ? '3px' : 0 }}>{line}</div>
      ))}
    </>
  );
}

function PhaseArrow({ label, active, show }) {
  const color = active ? C.accent : C.borderLt;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0 4px 6px',
      opacity: show ? 1 : 0, transition: 'opacity 0.2s ease',
    }}>
      <svg width="10" height="18" viewBox="0 0 10 18" style={{ flexShrink: 0, overflow: 'visible' }}>
        <line x1="5" y1="0" x2="5" y2="11" stroke={color} strokeWidth="1.5" />
        <polygon points="5,18 1.5,11 8.5,11" fill={color} />
      </svg>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontStyle: 'italic', color: active ? C.mid : C.muted, transition: 'color 0.2s ease' }}>
        {label}
      </span>
    </div>
  );
}

function Btn({ children, onClick, variant = 'default', disabled = false }) {
  const variantStyle =
    variant === 'primary' ? { color: C.accent, background: C.accentDim, border: `1px solid ${C.accent}` }
    : variant === 'ghost'  ? { color: C.mid,    background: 'transparent', border: `1px solid ${C.border}` }
    : { color: disabled ? C.muted : C.text, background: 'transparent', border: `1px solid ${disabled ? C.border : C.borderLt}` };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: '11px',
      fontWeight: variant === 'primary' ? 600 : 400,
      borderRadius: '4px', padding: '5px 12px',
      cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0, ...variantStyle,
    }}>
      {children}
    </button>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', userSelect: 'none' }}>
      <div role="switch" aria-checked={checked} onClick={() => onChange(!checked)} style={{
        width: '28px', height: '14px', borderRadius: '7px',
        background: checked ? C.accent : C.bg4,
        border: `1px solid ${checked ? C.accent : C.border}`,
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '1px', left: checked ? '14px' : '1px',
          width: '10px', height: '10px', borderRadius: '50%',
          background: checked ? '#0a0a0a' : C.muted, transition: 'left 0.15s',
        }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: C.muted }}>{label}</span>
    </label>
  );
}

function StripCell({ label, value, color, wide }) {
  return (
    <div style={{ flex: wide ? 2 : 1, minWidth: 0, padding: '10px 14px' }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '8px', color: C.muted, letterSpacing: '0.06em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', fontWeight: 500,
        color: color || C.accent, lineHeight: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}

export default function ConstitutionalAI() {
  const [preset, setPreset]                     = useState('helpful');
  const [currentPhase, setCurrentPhase]         = useState(0);
  const [revealedCells, setRevealedCells]       = useState(new Set());
  const [critiqueComplete, setCritiqueComplete] = useState(false);
  const [showOnlyFailed, setShowOnlyFailed]     = useState(false);
  const [tooltip, setTooltip]                   = useState(null);
  const [activeArrow, setActiveArrow]           = useState(0);

  const timeoutsRef = useRef([]);
  const gridRef     = useRef(null);

  const p         = PRESETS[preset];
  const passCount = Object.values(p.critiques).filter(v => v === 'pass').length;
  const failCount = Object.values(p.critiques).filter(v => v === 'fail').length;
  const naCount   = Object.values(p.critiques).filter(v => v === 'na').length;

  useEffect(() => {
    return () => { timeoutsRef.current.forEach(id => clearTimeout(id)); };
  }, []);

  function clearAllTimeouts() {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  }

  function doReset() {
    clearAllTimeouts();
    setCurrentPhase(0);
    setRevealedCells(new Set());
    setCritiqueComplete(false);
    setActiveArrow(0);
    setTooltip(null);
  }

  function runAnimation() {
    doReset();
    const T = (delay, fn) => { const id = setTimeout(fn, delay); timeoutsRef.current.push(id); };
    T(200,  () => setCurrentPhase(1));
    T(600,  () => { setCurrentPhase(2); setActiveArrow(1); });
    PRINCIPLES.forEach((pr, i) => T(800 + i * 200, () => {
      setRevealedCells(prev => { const n = new Set(prev); n.add(pr.id); return n; });
    }));
    T(800 + 10 * 200,       () => setCritiqueComplete(true));
    T(800 + 10 * 200 + 400, () => { setCurrentPhase(3); setActiveArrow(2); });
  }

  function doStep() {
    clearAllTimeouts();
    if (currentPhase === 0) {
      setCurrentPhase(1);
    } else if (currentPhase === 1) {
      setCurrentPhase(2); setActiveArrow(1);
      setRevealedCells(new Set(PRINCIPLES.map(pr => pr.id)));
      setCritiqueComplete(true);
    } else if (currentPhase === 2) {
      setCurrentPhase(3); setActiveArrow(2);
    }
  }

  function handlePresetChange(key) {
    if (key === preset) return;
    doReset();
    setPreset(key);
  }

  function handleCellHover(principle, status, e) {
    if (!gridRef.current) return;
    const cr = gridRef.current.getBoundingClientRect();
    const tr = e.currentTarget.getBoundingClientRect();
    setTooltip({ x: tr.left - cr.left, y: tr.bottom - cr.top + 4, principle, status });
  }

  return (
    <WidgetCard title="Constitutional AI — self-critique and revision" number="10.4">
      {/* Preset tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
        {Object.entries(PRESETS).map(([key, pd]) => {
          const active = key === preset;
          return (
            <button key={key} onClick={() => handlePresetChange(key)} style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: '11px',
              fontWeight: active ? 600 : 400, color: active ? C.accent : C.muted,
              background: 'transparent', border: 'none',
              borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
              padding: '6px 14px 8px', cursor: 'pointer', marginBottom: '-1px',
              transition: 'color 0.15s',
            }}>
              {pd.label}
            </button>
          );
        })}
      </div>

      {/* Prompt */}
      <div style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: C.prose,
        background: C.bg4, padding: '8px 10px', borderRadius: '4px', marginBottom: '14px',
      }}>
        <span style={{ color: C.muted }}>User: </span>{p.prompt}
      </div>

      {/* Phase 1 — Initial Response */}
      <div style={{
        background: C.bg3, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.borderLt}`,
        borderRadius: '4px', padding: '10px 14px',
        opacity: currentPhase >= 1 ? 1 : 0, transition: 'opacity 0.2s ease',
        pointerEvents: currentPhase >= 1 ? 'auto' : 'none',
      }}>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: C.text, fontWeight: 500, marginBottom: '8px' }}>
          1. Initial Response
        </div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: C.prose, lineHeight: 1.65 }}>
          <MultiLineText text={p.initial} />
        </div>
      </div>

      <PhaseArrow label="critique" active={activeArrow >= 1} show={currentPhase >= 1} />

      {/* Phase 2 — Critique */}
      <div style={{
        background: C.bg3, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.math}`,
        borderRadius: '4px', padding: '10px 14px',
        opacity: currentPhase >= 2 ? 1 : 0, transition: 'opacity 0.2s ease',
        pointerEvents: currentPhase >= 2 ? 'auto' : 'none',
      }}>
        {/* Phase 2 header row with toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: C.text, fontWeight: 500 }}>
            2. Critique Against Constitution
          </div>
          <Toggle label="Show only failed" checked={showOnlyFailed} onChange={setShowOnlyFailed} />
        </div>

        {/* Critique grid — position:relative anchors the tooltip */}
        <div style={{ position: 'relative' }} ref={gridRef}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {PRINCIPLES.map((principle) => {
              const status   = p.critiques[principle.id];
              const revealed = revealedCells.has(principle.id);
              const hidden   = showOnlyFailed && status !== 'fail';

              const borderColor = status === 'pass' ? C.green : status === 'fail' ? C.red : C.borderLt;
              const symbol      = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '—';
              const symbolColor = status === 'pass' ? C.green : status === 'fail' ? C.red : C.muted;
              const glow        = revealed && !hidden
                ? status === 'pass' ? '0 0 8px rgba(52,211,153,0.2)'
                : status === 'fail' ? '0 0 8px rgba(248,113,113,0.25)'
                : 'none' : 'none';

              return (
                <div key={principle.id} style={{
                  background: C.bg4, border: `1px solid ${borderColor}`, borderRadius: '5px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '6px 4px', gap: '2px',
                  opacity: hidden ? 0 : (revealed ? 1 : 0),
                  transition: 'opacity 0.15s ease',
                  pointerEvents: hidden || !revealed ? 'none' : 'auto',
                  cursor: 'default', boxShadow: glow,
                }}
                  onMouseEnter={(e) => handleCellHover(principle, status, e)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '8px', color: C.muted, lineHeight: 1 }}>
                    {principle.id}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', fontWeight: 700, color: symbolColor, lineHeight: 1 }}>
                    {symbol}
                  </div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '9px', color: C.muted, lineHeight: 1, textAlign: 'center' }}>
                    {principle.hint}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {critiqueComplete && (
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: C.mid, fontStyle: 'italic' }}>
              {passCount} principle{passCount !== 1 ? 's' : ''} passed, {failCount} failed
              {naCount > 0 ? `, ${naCount} not applicable` : ''}.
            </div>
          )}

          {/* Tooltip */}
          {tooltip && (
            <div style={{
              position: 'absolute',
              left: Math.min(tooltip.x, 340),
              top: tooltip.y,
              background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '4px',
              padding: '7px 10px', zIndex: 20, pointerEvents: 'none',
              maxWidth: '260px', lineHeight: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', fontWeight: 600,
                color: tooltip.status === 'pass' ? C.green : tooltip.status === 'fail' ? C.red : C.muted,
                marginBottom: '3px',
              }}>
                {tooltip.principle.id} — {tooltip.status === 'pass' ? '✓ passed' : tooltip.status === 'fail' ? '✗ failed' : '— not applicable'}
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: C.prose, marginBottom: p.critiqueReasons[tooltip.principle.id] ? '4px' : 0 }}>
                {tooltip.principle.text}
              </div>
              {p.critiqueReasons[tooltip.principle.id] && (
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontStyle: 'italic', color: tooltip.status === 'fail' ? C.red : C.green }}>
                  {p.critiqueReasons[tooltip.principle.id]}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PhaseArrow label="revise" active={activeArrow >= 2} show={currentPhase >= 2} />

      {/* Phase 3 — Revised Response */}
      <div style={{
        background: 'rgba(52,211,153,0.06)', border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.green}`,
        borderRadius: '4px', padding: '10px 14px',
        opacity: currentPhase >= 3 ? 1 : 0, transition: 'opacity 0.2s ease',
        pointerEvents: currentPhase >= 3 ? 'auto' : 'none',
      }}>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: C.text, fontWeight: 500, marginBottom: '8px' }}>
          3. Revised Response
        </div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: C.prose, lineHeight: 1.65 }}>
          <MultiLineText text={p.revised} />
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'flex', marginTop: '14px',
        background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden',
      }}>
        <StripCell label="PRESET"    value={p.label}             color={C.text}  wide />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StripCell label="✓ PASSED"  value={`${passCount} / 10`} color={C.green} />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StripCell label="✗ FAILED"  value={`${failCount} / 10`} color={C.red} />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StripCell label="— N/A"     value={`${naCount} / 10`}   color={C.muted} />
      </div>

      {/* Training signal callout */}
      <div style={{ marginTop: '10px', background: C.bg4, borderRadius: '6px', padding: '12px 14px' }}>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', fontWeight: 600, color: C.text, marginBottom: '5px' }}>
          Why this matters for training
        </div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: C.prose, lineHeight: 1.6, marginBottom: '6px' }}>
          The (prompt, revised response) pair becomes a training example — no human preference label needed.
          With thousands to millions of such pairs, the model learns to internalize the constitutional principles.
        </div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: C.prose, lineHeight: 1.6 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', color: C.math }}>RLAIF</span>
          {' '}(Reinforcement Learning from AI Feedback): the model compares initial vs revised responses to generate
          preference data at scale — no human labelers needed. Introduced in Bai et al.,{' '}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', color: C.mid }}>
            "Constitutional AI: Harmlessness from AI Feedback"
          </span>, 2022.
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        paddingTop: '12px', marginTop: '12px', borderTop: `1px solid ${C.border}`,
      }}>
        <Btn variant="primary" onClick={runAnimation}>▶ Run Constitutional Loop</Btn>
        <Btn onClick={doStep} disabled={currentPhase >= 3}>Step →</Btn>
        <Btn variant="ghost" onClick={doReset}>↺ Reset</Btn>
      </div>
    </WidgetCard>
  );
}
