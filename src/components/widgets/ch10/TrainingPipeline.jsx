import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  green:     '#34d399',
  orange:    '#fb923c',
  math:      '#fbbf24',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  mid:       '#888888',
  text:      '#e8eaed',
  codeBg:    '#0a0a0a',
  prose:     '#b8c4cc',
};
const mono  = "'JetBrains Mono', monospace";
const inter = "'Inter', sans-serif";

// Per-stage accent colors
const STAGE_COLORS = [C.accent, C.accent, C.orange, C.green];

// ── SVG diagram geometry ──────────────────────────────────────────────────────
// viewBox matches container width (616px) so scale = 1
const SVG_W = 616;
const SVG_H = 200;
const BOX_W = 130;
const BOX_H = 90;
const BOX_Y = (SVG_H - BOX_H) / 2;        // 55
const BOX_XS = [10, 165, 320, 475];        // 25px gaps
const ARROW_Y = BOX_Y + BOX_H / 2;         // 100
const ARROWS = [
  { x1: BOX_XS[0] + BOX_W, x2: BOX_XS[1] },
  { x1: BOX_XS[1] + BOX_W, x2: BOX_XS[2] },
  { x1: BOX_XS[2] + BOX_W, x2: BOX_XS[3] },
];

// ── Static stage data ─────────────────────────────────────────────────────────
const STAGE_DEFS = [
  { label: 'Stage 0', sublabel: 'Base',       icon: '📚', body: 'Pretraining',        bottom: 'Trillions of tokens', modelName: 'Base model' },
  { label: 'Stage 1', sublabel: 'SFT',        icon: '📝', body: 'Instruction Tuning', bottom: '10K-100K demos',      modelName: 'Instruction-tuned' },
  { label: 'Stage 2', sublabel: 'Preference', icon: '👍', body: 'RLHF / DPO',         bottom: '10K-500K pairs',      modelName: 'Preference-tuned' },
  { label: 'Stage 3', sublabel: 'Safety',     icon: '🛡️', body: 'Refusal Training',   bottom: 'Const. + red-team',  modelName: 'Aligned assistant' },
];

const STAGE_DETAILS = [
  {
    title: 'Base Model',
    dataLabel: 'Web text, books, code',
    volume: '1-10T tokens',
    objective: 'L = -Σ log p(x_t | x_<t)',
    objNote: null,
    behaviors: [
      'Predicts likely continuations',
      'Has broad world knowledge',
      'Cannot follow instructions',
      'Mimics whatever pattern is fed in',
    ],
    compute: 'Months on thousands of GPUs',
  },
  {
    title: 'Instruction-Tuned Model',
    dataLabel: 'Human-written (instruction, response) pairs',
    volume: '10K-100K examples',
    objective: 'L_SFT = -Σ log p(y_t | x, y_<t)',
    objNote: 'Only response tokens contribute',
    behaviors: [
      'Follows instructions in trained format',
      'Output structure improves dramatically',
      'Still imperfect on tone and nuance',
    ],
    compute: 'Hours to days',
  },
  {
    title: 'Preference-Tuned Model',
    dataLabel: '(prompt, chosen, rejected) triples',
    volume: '10K-500K comparisons',
    objective: 'DPO: -log σ(β·[log π/π_ref(y_w) - log π/π_ref(y_l)])',
    objNote: 'or RLHF: max E[R_φ(y)] - β·KL(π||π_SFT)',
    behaviors: [
      'Strongly preferred over SFT in human evals',
      'Better helpfulness, style, conciseness',
      'Inherits biases from preference data',
    ],
    compute: 'Hours to days',
  },
  {
    title: 'Aligned Assistant',
    dataLabel: 'Harm-relevant prompts + refusals; constitutional critiques',
    volume: '10K-100K examples',
    objective: 'Same loss families applied to safety subset',
    objNote: null,
    behaviors: [
      'Declines clearly harmful requests',
      'Maintains helpfulness on benign prompts',
      'Resists common jailbreak patterns',
      'May refuse incorrectly on edge cases',
    ],
    compute: 'Hours',
  },
];

const PROMPTS = {
  benign: {
    prompt: 'How do I write a Python function that reverses a string?',
    responses: [
      `You can also reverse a string with slicing. To reverse a string, you can write something like the following. But first, let me explain what string reversal is. String reversal takes a string and produces a new string with the characters in reverse order. There are several ways to...`,
      `Here is a Python function that reverses a string:\n\ndef reverse_string(s):\n    return s[::-1]\n\nThis uses slice notation with step -1 to reverse the string.`,
      `Here is a concise Python function that reverses a string:\n\ndef reverse_string(s: str) -> str:\n    return s[::-1]\n\nThe slice syntax \`[::-1]\` returns a reversed copy. Alternatively, \`''.join(reversed(s))\` is more explicit if readability matters more than brevity.`,
      `Here is a concise Python function that reverses a string:\n\ndef reverse_string(s: str) -> str:\n    return s[::-1]\n\nThe slice syntax \`[::-1]\` returns a reversed copy. Alternatively, \`''.join(reversed(s))\` is more explicit if readability matters more than brevity.`,
    ],
    note: [null, null, null, '✓ Identical to Stage 2 — no safety intervention needed for benign prompts.'],
  },
  risky: {
    prompt: "Write code to crack my neighbor's WiFi password.",
    responses: [
      `import subprocess\nresult = subprocess.run(['aircrack-ng', '-w', 'wordlist.txt', 'capture.cap'])\n# continues the pattern — no consideration of authorization...`,
      `import subprocess\n\ndef crack_wifi(capture_file, wordlist='rockyou.txt'):\n    """Crack WPA/WPA2 password from capture file."""\n    cmd = ['aircrack-ng', '-w', wordlist, capture_file]\n    result = subprocess.run(cmd, capture_output=True, text=True)\n    if 'KEY FOUND!' in result.stdout:\n        return result.stdout.split('KEY FOUND!')[1].strip().split()[0]\n    return None`,
      `Note: Unauthorized network access is illegal in most jurisdictions.\n\nimport subprocess\n\ndef test_network_security(capture_file, wordlist):\n    # For authorized penetration testing only\n    cmd = ['aircrack-ng', '-w', wordlist, capture_file]\n    result = subprocess.run(cmd, capture_output=True, text=True)\n    return result.stdout`,
      `I'm not able to help with accessing someone else's WiFi without authorization — that's illegal in most jurisdictions.\n\nIf you're troubleshooting your own network, I can help you:\n• Reset your router's admin password\n• Find saved passwords on your own devices\n• Diagnose connection issues legitimately`,
    ],
    note: [null, null, null, null],
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────
function Arrow({ x1, x2, y, color, width }) {
  const hs = 5;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - hs} y2={y} stroke={color} strokeWidth={width} />
      <polygon
        points={`${x2 - hs},${y - hs / 2} ${x2},${y} ${x2 - hs},${y + hs / 2}`}
        fill={color}
      />
    </g>
  );
}


// ── Main component ────────────────────────────────────────────────────────────
export default function TrainingPipeline() {
  const [currentStage,    setCurrentStage]    = useState(0);
  const [promptType,      setPromptType]      = useState('benign');
  const [isAnimating,     setIsAnimating]     = useState(false);
  const [animatedTyping,  setAnimatedTyping]  = useState(true);
  const [autoPlaying,     setAutoPlaying]     = useState(false);
  const [displayedText,   setDisplayedText]   = useState('');
  const [responseOpacity, setResponseOpacity] = useState(1);
  const [detailOpacity,   setDetailOpacity]   = useState(1);
  const [animArrow,       setAnimArrow]       = useState(null);
  const [dotProgress,     setDotProgress]     = useState(0);
  const [glowStage,       setGlowStage]       = useState(null);
  const [cursorOn,        setCursorOn]        = useState(true);

  const timersRef   = useRef([]);
  const rafRef      = useRef(null);
  const typingRef   = useRef(null);
  const autoRef     = useRef(null);
  const stageRef    = useRef(0);
  const promptRef   = useRef('benign');
  const typingOnRef = useRef(true);
  const autoOnRef   = useRef(false);

  useEffect(() => { stageRef.current  = currentStage;   }, [currentStage]);
  useEffect(() => { promptRef.current = promptType;     }, [promptType]);
  useEffect(() => { typingOnRef.current = animatedTyping; }, [animatedTyping]);
  useEffect(() => { autoOnRef.current = autoPlaying;    }, [autoPlaying]);

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Init on mount + cleanup
  useEffect(() => {
    showResponse(0, 'benign');
    return () => {
      clearAll();
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-display current text when typing mode toggles (skip first render)
  const isFirstTypingChange = useRef(true);
  useEffect(() => {
    if (isFirstTypingChange.current) { isFirstTypingChange.current = false; return; }
    if (typingRef.current) { clearInterval(typingRef.current); typingRef.current = null; }
    if (!isAnimating) showResponse(stageRef.current, promptRef.current);
  }, [animatedTyping]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer utilities ─────────────────────────────────────────────────────────
  function clearAll() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (autoRef.current) { clearTimeout(autoRef.current); autoRef.current = null; }
  }

  function addTimer(fn, delay) {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter(t => t !== id);
      fn();
    }, delay);
    timersRef.current.push(id);
  }

  // ── Response display ────────────────────────────────────────────────────────
  function startTypewriter(stage, pt) {
    const fullText = PROMPTS[pt].responses[stage];
    let idx = 0;
    if (typingRef.current) clearInterval(typingRef.current);
    setDisplayedText('');
    typingRef.current = setInterval(() => {
      idx++;
      setDisplayedText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(typingRef.current);
        typingRef.current = null;
      }
    }, 20);
  }

  function showResponse(stage, pt) {
    if (typingOnRef.current) {
      startTypewriter(stage, pt);
    } else {
      if (typingRef.current) { clearInterval(typingRef.current); typingRef.current = null; }
      setDisplayedText(PROMPTS[pt].responses[stage]);
    }
  }

  // ── Animation sequence ──────────────────────────────────────────────────────
  function doAdvance(nextStage) {
    setIsAnimating(true);
    setAnimArrow(nextStage - 1);
    setDotProgress(0);

    // Dot travels along arrow: starts at 200ms, runs 400ms
    addTimer(() => {
      const t0 = Date.now();
      function frame() {
        const p = Math.min((Date.now() - t0) / 400, 1);
        setDotProgress(p);
        if (p < 1) { rafRef.current = requestAnimationFrame(frame); }
      }
      rafRef.current = requestAnimationFrame(frame);
    }, 200);

    // Glow new stage box at 600ms
    addTimer(() => { setGlowStage(nextStage); }, 600);

    // Fade out response + detail at 900ms
    addTimer(() => { setResponseOpacity(0); setDetailOpacity(0); }, 900);

    // Finalize at 1200ms
    addTimer(() => {
      setAnimArrow(null);
      setGlowStage(null);
      setDotProgress(0);
      stageRef.current = nextStage;
      setCurrentStage(nextStage);
      setResponseOpacity(1);
      setDetailOpacity(1);
      setIsAnimating(false);
      showResponse(nextStage, promptRef.current);
      if (autoOnRef.current) scheduleAutoPlay();
    }, 1200);
  }

  // ── User actions ────────────────────────────────────────────────────────────
  function advanceStage() {
    if (isAnimating || stageRef.current >= 3) return;
    doAdvance(stageRef.current + 1);
  }

  function resetWidget(newPromptType) {
    clearAll();
    if (typingRef.current) { clearInterval(typingRef.current); typingRef.current = null; }
    const pt = newPromptType ?? promptRef.current;
    stageRef.current = 0;
    autoOnRef.current = false;
    setCurrentStage(0);
    setIsAnimating(false);
    setAutoPlaying(false);
    setAnimArrow(null);
    setDotProgress(0);
    setGlowStage(null);
    setResponseOpacity(1);
    setDetailOpacity(1);
    showResponse(0, pt);
  }

  function scheduleAutoPlay() {
    if (!autoOnRef.current || stageRef.current >= 3) {
      setAutoPlaying(false);
      autoOnRef.current = false;
      return;
    }
    autoRef.current = setTimeout(() => {
      if (!autoOnRef.current || stageRef.current >= 3) {
        setAutoPlaying(false);
        autoOnRef.current = false;
        return;
      }
      doAdvance(stageRef.current + 1);
    }, 3000);
  }

  function toggleAutoPlay() {
    if (autoPlaying) {
      autoOnRef.current = false;
      setAutoPlaying(false);
      if (autoRef.current) { clearTimeout(autoRef.current); autoRef.current = null; }
    } else {
      if (stageRef.current >= 3) return;
      autoOnRef.current = true;
      setAutoPlaying(true);
      scheduleAutoPlay();
    }
  }

  function switchPrompt(type) {
    promptRef.current = type;
    setPromptType(type);
    resetWidget(type);
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const dotX = animArrow !== null
    ? ARROWS[animArrow].x1 + dotProgress * (ARROWS[animArrow].x2 - ARROWS[animArrow].x1)
    : null;

  const stageColor   = STAGE_COLORS[currentStage];
  const stageDef     = STAGE_DEFS[currentStage];
  const detail       = STAGE_DETAILS[currentStage];
  const fullResponse = PROMPTS[promptType].responses[currentStage];
  const currentNote  = PROMPTS[promptType].note[currentStage];
  const isTyping     = typingRef.current !== null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <WidgetCard title="Training Pipeline — from base model to aligned assistant" number="10.1">

      {/* ── Prompt tabs + typing toggle ─── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', alignItems: 'center' }}>
        {['benign', 'risky'].map(t => {
          const isActive = promptType === t;
          const activeColor = t === 'risky' ? C.orange : C.accent;
          const activeBg    = t === 'risky' ? '#2e1a0d' : C.accentDim;
          return (
            <button key={t} onClick={() => switchPrompt(t)}
              style={{
                fontFamily: mono, fontSize: '11px', padding: '5px 12px',
                borderRadius: '4px', cursor: 'pointer',
                border: `1px solid ${isActive ? activeColor : C.borderLt}`,
                background: isActive ? activeBg : C.bg4,
                color: isActive ? activeColor : C.mid,
                transition: 'all 0.15s',
              }}>
              {t === 'benign' ? 'Benign request' : 'Risky request'}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px',
                        cursor: 'pointer', userSelect: 'none' }}>
          <div onClick={() => setAnimatedTyping(v => !v)}
            style={{ width: 28, height: 16, borderRadius: 8, position: 'relative',
                     background: animatedTyping ? C.accent : C.borderLt,
                     cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 2, width: 12, height: 12,
                          borderRadius: '50%', background: '#fff',
                          left: animatedTyping ? 14 : 2, transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontFamily: mono, fontSize: '10px', color: C.mid }}>
            Animated typing
          </span>
        </label>
      </div>

      {/* ── Pipeline SVG — full width ─── */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%"
           style={{ display: 'block', marginBottom: '12px', borderRadius: '6px' }}>
        <defs>
          {[0, 1, 2, 3].map(i => (
            <filter key={i} id={`tp-glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* SVG background */}
        <rect width={SVG_W} height={SVG_H} fill={C.bg3} />

        {/* Connector arrows */}
        {ARROWS.map((arr, i) => {
          const active = animArrow === i;
          return (
            <Arrow key={i} x1={arr.x1} x2={arr.x2} y={ARROW_Y}
                   color={active ? C.accent : C.borderLt}
                   width={active ? 2 : 1.5} />
          );
        })}

        {/* Animated dot travelling along active arrow */}
        {dotX !== null && (
          <circle cx={dotX} cy={ARROW_Y} r={4} fill={C.accent}
                  style={{ filter: `drop-shadow(0 0 5px ${C.accent})` }} />
        )}

        {/* Stage boxes */}
        {STAGE_DEFS.map((s, i) => {
          const bx = BOX_XS[i];
          const by = BOX_Y;
          const active  = currentStage === i;
          const glowing = glowStage === i;
          const sc = STAGE_COLORS[i];
          const strokeCol = active || glowing ? sc : C.borderLt;
          const sw        = active || glowing ? 2.5 : 1.5;

          return (
            <g key={i} filter={active || glowing ? `url(#tp-glow-${i})` : undefined}>
              {/* Box background */}
              <rect x={bx} y={by} width={BOX_W} height={BOX_H} rx={8}
                    fill={C.bg4} stroke={strokeCol} strokeWidth={sw} />
              {/* Active header tint */}
              {(active || glowing) && (
                <rect x={bx + sw / 2} y={by + sw / 2} width={BOX_W - sw} height={27}
                      rx={7} fill={`${sc}22`} />
              )}
              {/* "Stage X" label */}
              <text x={bx + 8} y={by + 13}
                    fontFamily={mono} fontSize={10} fill={C.muted}>
                {s.label}
              </text>
              {/* Sublabel */}
              <text x={bx + 8} y={by + 25}
                    fontFamily={mono} fontSize={12} fontWeight={active ? 600 : 400}
                    fill={active ? sc : C.text}>
                {s.sublabel}
              </text>
              {/* Header divider */}
              <line x1={bx + 1} y1={by + 29} x2={bx + BOX_W - 1} y2={by + 29}
                    stroke={C.border} strokeWidth={1} />
              {/* Icon */}
              <text x={bx + BOX_W / 2} y={by + 56} textAnchor="middle" fontSize={18}>
                {s.icon}
              </text>
              {/* Body label */}
              <text x={bx + BOX_W / 2} y={by + 71} textAnchor="middle"
                    fontFamily={inter} fontSize={11} fill={C.mid}>
                {s.body}
              </text>
              {/* Bottom strip */}
              <text x={bx + BOX_W / 2} y={by + 84} textAnchor="middle"
                    fontFamily={mono} fontSize={8} fill={C.muted}>
                {s.bottom}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Response panel — full width ─── */}
      <div style={{
        background: C.bg3, borderRadius: '8px', padding: '14px 18px',
        borderLeft: `3px solid ${stageColor}`,
        opacity: responseOpacity, transition: 'opacity 0.2s',
        marginBottom: '8px',
      }}>
        {/* User prompt */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start',
                      marginBottom: '10px' }}>
          <span style={{
            fontFamily: mono, fontSize: '9px', color: C.muted,
            background: C.bg4, border: `1px solid ${C.borderLt}`,
            padding: '2px 6px', borderRadius: '3px', flexShrink: 0, marginTop: '1px',
          }}>User:</span>
          <span style={{ fontFamily: mono, fontSize: '12px', color: C.text, lineHeight: 1.5 }}>
            {PROMPTS[promptType].prompt}
          </span>
        </div>
        <div style={{ height: '1px', background: C.border, marginBottom: '10px' }} />
        {/* Model response */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <span style={{
            fontFamily: mono, fontSize: '9px', color: stageColor,
            background: `${stageColor}18`, border: `1px solid ${stageColor}44`,
            padding: '2px 6px', borderRadius: '3px',
            flexShrink: 0, marginTop: '1px', whiteSpace: 'nowrap',
          }}>
            {stageDef.modelName}:
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <pre style={{
              fontFamily: mono, fontSize: '12px', color: C.prose,
              lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {displayedText}
              {isTyping && animatedTyping && (
                <span style={{ opacity: cursorOn ? 1 : 0, color: stageColor }}>▊</span>
              )}
            </pre>
            {currentNote && !isTyping && displayedText === fullResponse && (
              <div style={{
                marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${C.border}`,
                fontFamily: mono, fontSize: '10px', color: C.green, lineHeight: 1.5,
              }}>
                {currentNote}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stage detail — full-width 3-column card ─── */}
      <div style={{
        display: 'flex', background: C.bg3,
        border: `1px solid ${C.border}`, borderRadius: '8px',
        overflow: 'hidden', marginBottom: '10px',
        opacity: detailOpacity, transition: 'opacity 0.2s',
      }}>
        {/* Col 1 — Meta: title, data, volume, compute */}
        <div style={{ width: '190px', flexShrink: 0, padding: '12px 14px',
                      borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: mono, fontSize: '9px', color: stageColor,
                        letterSpacing: '0.08em', marginBottom: '2px' }}>
            STAGE {currentStage}
          </div>
          <div style={{ fontFamily: inter, fontSize: '13px', fontWeight: 500,
                        color: C.text, marginBottom: '10px', lineHeight: 1.25 }}>
            {detail.title}
          </div>
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          marginBottom: '2px' }}>Data</div>
            <div style={{ fontFamily: inter, fontSize: '10px', color: C.prose,
                          lineHeight: 1.45 }}>{detail.dataLabel}</div>
          </div>
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          marginBottom: '2px' }}>Vol.</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: stageColor }}>
              {detail.volume}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          marginBottom: '2px' }}>Compute</div>
            <div style={{ fontFamily: inter, fontSize: '11px', color: C.prose }}>
              {detail.compute}
            </div>
            {currentStage === 0 && (
              <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted,
                            marginTop: '4px', lineHeight: 1.5 }}>
                ≈ 99% of total training compute
              </div>
            )}
            {currentStage > 0 && (
              <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted,
                            marginTop: '4px', lineHeight: 1.5 }}>
                ≈ &lt;1% of total compute
              </div>
            )}
          </div>
        </div>

        {/* Col 2 — Objective */}
        <div style={{ width: '210px', flexShrink: 0, padding: '12px 14px',
                      borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        marginBottom: '6px' }}>
            Objective
          </div>
          <div style={{
            fontFamily: mono, fontSize: '10px', color: C.math,
            background: C.codeBg, border: `1px solid ${C.border}`,
            borderRadius: '4px', padding: '7px 9px',
            lineHeight: 1.7, wordBreak: 'break-all',
          }}>
            {detail.objective}
          </div>
          {detail.objNote && (
            <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted,
                          marginTop: '5px', lineHeight: 1.5, fontStyle: 'italic' }}>
              {detail.objNote}
            </div>
          )}
        </div>

        {/* Col 3 — Behaviors */}
        <div style={{ flex: 1, padding: '12px 14px' }}>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        marginBottom: '6px' }}>
            Behavior
          </div>
          {detail.behaviors.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px',
                                  alignItems: 'flex-start' }}>
              <span style={{ color: stageColor, fontSize: '10px',
                             flexShrink: 0, marginTop: '1px' }}>•</span>
              <span style={{ fontFamily: inter, fontSize: '11px', color: C.prose,
                             lineHeight: 1.45 }}>
                {b}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls + stage progress ─── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={advanceStage}
          disabled={isAnimating || currentStage >= 3}
          style={{
            fontFamily: mono, fontSize: '11px', padding: '6px 14px', borderRadius: '4px',
            cursor: isAnimating || currentStage >= 3 ? 'not-allowed' : 'pointer',
            border: `1px solid ${C.accent}`, background: C.accentDim, color: C.accent,
            opacity: isAnimating || currentStage >= 3 ? 0.38 : 1,
            transition: 'opacity 0.2s',
          }}>
          Advance stage →
        </button>
        <button onClick={() => resetWidget()}
          style={{
            fontFamily: mono, fontSize: '11px', padding: '6px 14px', borderRadius: '4px',
            cursor: 'pointer',
            border: `1px solid ${C.borderLt}`, background: C.bg4, color: C.mid,
          }}>
          Reset to base
        </button>
        <button onClick={toggleAutoPlay}
          disabled={!autoPlaying && (isAnimating || currentStage >= 3)}
          style={{
            fontFamily: mono, fontSize: '11px', padding: '6px 14px', borderRadius: '4px',
            cursor: 'pointer',
            border: `1px solid ${autoPlaying ? C.orange : C.borderLt}`,
            background: autoPlaying ? '#2e1a0d' : C.bg4,
            color: autoPlaying ? C.orange : C.mid,
            opacity: !autoPlaying && (isAnimating || currentStage >= 3) ? 0.38 : 1,
            transition: 'all 0.15s',
          }}>
          {autoPlaying ? '⏸ Pause' : '▶ Auto-play'}
        </button>
        {/* Stage progress dots + label */}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: i === currentStage ? 8 : 6,
              height: i === currentStage ? 8 : 6,
              borderRadius: '50%',
              background: i <= currentStage ? STAGE_COLORS[i] : C.borderLt,
              opacity: i < currentStage ? 0.5 : 1,
              transition: 'all 0.3s',
              boxShadow: i === currentStage ? `0 0 6px ${STAGE_COLORS[i]}` : 'none',
            }} />
          ))}
          <span style={{ fontFamily: mono, fontSize: '10px', color: C.mid, marginLeft: '2px' }}>
            {currentStage} / 3
          </span>
        </div>
      </div>

    </WidgetCard>
  );
}
