import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  orange:    '#fb923c',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  textMid:   '#888888',
  text:      '#e8eaed',
};

const mono  = { fontFamily: "'JetBrains Mono', monospace" };
const inter = { fontFamily: "'Inter', sans-serif" };

const Y_PRE  = { input: 20, ln1: 60, mha: 120, add1: 194, ln2: 244, ffn: 304, add2: 378, output: 428 };
const Y_POST = { input: 20, mha: 60, add1: 134, ln1: 184, ffn: 244, add2: 318, ln2: 368, output: 428 };
const BOX_H  = { ln1: 36, mha: 52, add1: 28, ln2: 36, ffn: 52, add2: 28 };

const PRE_ORDER  = ['input','ln1','mha','add1','ln2','ffn','add2','output'];
const POST_ORDER = ['input','mha','add1','ln1','ffn','add2','ln2','output'];

// Each field that varies by mode is { pre, post }.
// skip1/skip2: 0=dim  1=faint  2=bright
const STEPS = [
  {
    step: 1,
    title:    { pre: 'Input',             post: 'Input' },
    activeId: { pre: 'input',             post: 'input' },
    skip1:    { pre: 0,                   post: 0 },
    skip2:    { pre: 0,                   post: 0 },
    desc: {
      pre:  "Token embeddings enter the block, each a d-dimensional vector. In the original transformer d=512; in GPT-3 d=12,288. These embeddings already contain positional information added before the first layer. The same computation runs independently for every token in the sequence.",
      post: "Token embeddings enter the block, each a d-dimensional vector. In the original transformer d=512; in GPT-3 d=12,288. These embeddings already contain positional information added before the first layer. The same computation runs independently for every token in the sequence.",
    },
  },
  {
    step: 2,
    title:    { pre: 'Layer Norm 1',       post: 'Multi-Head Attention' },
    activeId: { pre: 'ln1',               post: 'mha' },
    skip1:    { pre: 0,                   post: 1 },
    skip2:    { pre: 0,                   post: 0 },
    desc: {
      pre:  "Pre-LN normalizes each token's feature vector to zero mean and unit variance before attention. This stabilizes the scale of inputs to the attention operation and improves gradient flow during training. The original transformer used Post-LN (normalization after the residual add) — toggle above to see the difference.",
      post: "Each token attends to all other tokens via h parallel attention heads. In Post-LN, raw embeddings enter attention without prior normalization — the layer norm comes after the residual add. Outputs from all heads are concatenated and projected back to d dimensions. For n tokens this costs O(n² × d), the famous quadratic scaling.",
    },
  },
  {
    step: 3,
    title:    { pre: 'Multi-Head Attention', post: 'Residual Add 1' },
    activeId: { pre: 'mha',               post: 'add1' },
    skip1:    { pre: 1,                   post: 2 },
    skip2:    { pre: 0,                   post: 0 },
    desc: {
      pre:  "Each token attends to all other tokens via h parallel attention heads. Every head has its own learned Q, K, V projection matrices. Outputs from all heads are concatenated and projected back to d dimensions. For a sequence of n tokens, this costs O(n² × d) — the famous quadratic scaling that limits naive transformers to ~2K token contexts.",
      post: "The attention output is added to the original input x. In Post-LN this residual add comes before the first layer norm, so the gradient path must pass through the normalization on its way back to earlier layers — a key difference from Pre-LN that can cause instability in very deep networks.",
    },
  },
  {
    step: 4,
    title:    { pre: 'Residual Add 1',     post: 'Layer Norm 1' },
    activeId: { pre: 'add1',              post: 'ln1' },
    skip1:    { pre: 2,                   post: 0 },
    skip2:    { pre: 0,                   post: 0 },
    desc: {
      pre:  "The attention output is added to the original input x — not the layer-normed input, but the original. This residual connection means the gradient can flow straight from the loss to the input without passing through any nonlinearities. If the attention head learns nothing useful, the residual path carries the signal unchanged.",
      post: "Layer Norm 1 normalizes the sum of the original input and the attention output. In Post-LN, normalization happens after the residual add, so LN1 sees a combined signal rather than the raw embedding. Separate gamma and beta parameters let the model calibrate scale and shift independently of the preceding layers.",
    },
  },
  {
    step: 5,
    title:    { pre: 'Layer Norm 2',       post: 'Feed-Forward Network' },
    activeId: { pre: 'ln2',               post: 'ffn' },
    skip1:    { pre: 0,                   post: 0 },
    skip2:    { pre: 0,                   post: 1 },
    desc: {
      pre:  "A second normalization before the feed-forward sub-layer. Using separate layer norms for attention and FFN sub-layers lets each develop independently calibrated scale parameters (gamma, beta). In practice this matters most in very deep models where small numerical differences compound across hundreds of layers.",
      post: "Two linear layers with a nonlinearity between them, applied identically to each token: σ(xW₁ + b₁)W₂ + b₂ (shown here with ReLU, the original transformer's choice; modern models typically use GELU or SwiGLU). In Post-LN the FFN receives a layer-normalized input from LN1. The intermediate dimension is typically 4× the model dimension. Unlike attention, there is no cross-token interaction — each position is processed independently.",
    },
  },
  {
    step: 6,
    title:    { pre: 'Feed-Forward Network', post: 'Residual Add 2' },
    activeId: { pre: 'ffn',               post: 'add2' },
    skip1:    { pre: 0,                   post: 0 },
    skip2:    { pre: 1,                   post: 2 },
    desc: {
      pre:  "Two linear layers with a nonlinearity between them, applied identically to each token: σ(xW₁ + b₁)W₂ + b₂ (shown here with ReLU, the original transformer's choice; modern models typically use GELU or SwiGLU). The intermediate dimension is typically 4× the model dimension (e.g. d=512 → inner=2048). Unlike attention, this has no interaction between tokens — each position is processed independently. The FFN is thought to store factual associations learned during training.",
      post: "The FFN output is added to the stream — the second residual connection. In Post-LN this add comes before Layer Norm 2, mirroring the first sub-block's (Attn → Add → LN) pattern. The symmetric structure means both sub-blocks normalize their outputs before passing them on, keeping activations bounded throughout the stack.",
    },
  },
  {
    step: 7,
    title:    { pre: 'Residual Add 2 + Output', post: 'Layer Norm 2 + Output' },
    activeId: { pre: 'add2',              post: 'ln2' },
    skip1:    { pre: 0,                   post: 0 },
    skip2:    { pre: 2,                   post: 0 },
    desc: {
      pre:  "The FFN output is added back to the stream — same residual pattern as after attention. The output y has exactly the same shape as the input x. Stack N of these blocks for depth. GPT-3 uses 96 blocks; modern frontier models may use 120 or more. Each block refines the representation, adding new information while preserving what came before.",
      post: "Layer Norm 2 normalizes the final residual sum, producing the block's output y. In Post-LN both norms sit at sub-block outputs, so y is always normalized before entering the next block. The output has exactly the same shape as input x — stack N of these blocks for depth. GPT-3 uses 96; modern frontier models may use 120 or more.",
    },
  },
];

function skipOpacity(level) {
  return level === 0 ? 0.18 : level === 1 ? 0.5 : 1.0;
}

function btnStyle(disabled, primary = false) {
  return {
    padding: '6px 14px',
    background: disabled ? 'transparent' : primary ? C.accentDim : 'transparent',
    color: disabled ? C.muted : primary ? C.accent : C.textMid,
    border: `1px solid ${disabled ? C.border : primary ? C.accent : C.borderLt}`,
    borderRadius: '5px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    transition: 'background 150ms, color 150ms, border-color 150ms',
    opacity: disabled ? 0.4 : 1,
    flexShrink: 0,
  };
}

export default function TransformerBlock({ tryThis }) {
  const [step,      setStep]      = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [normMode,  setNormMode]  = useState('pre');
  const intervalRef = useRef(null);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStep(s => {
          if (s >= 7) { setIsPlaying(false); return 7; }
          return s + 1;
        });
      }, 2000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  const sd    = STEPS[step - 1];
  const m     = normMode;  // shorthand
  const yMap  = m === 'pre' ? Y_PRE  : Y_POST;
  const order = m === 'pre' ? PRE_ORDER : POST_ORDER;

  // Skip connection paths — snap to current mode positions
  const a1y    = yMap.add1;
  const a2y    = yMap.add2;
  const s1path = `M 240,30 C 270,30 270,${a1y + 14} 240,${a1y + 14}`;
  const s2path = `M 240,${a1y + 28} C 270,${a1y + 28} 270,${a2y + 14} 240,${a2y + 14}`;
  const s1op   = skipOpacity(sd.skip1[m]);
  const s2op   = skipOpacity(sd.skip2[m]);

  function getDy(id) {
    return m === 'post' ? Y_POST[id] - Y_PRE[id] : 0;
  }

  const isBox   = id => sd.activeId[m] === id;
  const isInput = () => sd.activeId[m] === 'input';
  const isOut   = () => step === 7;

  function wideBox(id, label) {
    const active = isBox(id);
    const dy = getDy(id);
    const y  = Y_PRE[id];
    const h  = BOX_H[id];
    return (
      <g key={id}
        style={{ transform: `translateY(${dy}px)`, transition: 'transform 200ms ease' }}
        filter={active ? 'url(#tb-glow)' : undefined}
      >
        <rect x={40} y={y} width={200} height={h} rx={6}
          fill={active ? C.accentDim : C.bg3}
          stroke={active ? C.accent : C.border}
          strokeWidth={active ? 2 : 1.5}
        />
        <text x={140} y={y + h / 2} textAnchor="middle" dominantBaseline="central"
          fontFamily="'JetBrains Mono', monospace" fontSize={11}
          fill={active ? C.accent : C.muted}
        >{label}</text>
      </g>
    );
  }

  function addBox(id) {
    const active = isBox(id);
    const dy = getDy(id);
    const y  = Y_PRE[id];
    const h  = BOX_H[id];
    return (
      <g key={id}
        style={{ transform: `translateY(${dy}px)`, transition: 'transform 200ms ease' }}
        filter={active ? 'url(#tb-glow)' : undefined}
      >
        <rect x={90} y={y} width={100} height={h} rx={4}
          fill={active ? '#1a1a0a' : C.bg4}
          stroke={active ? C.orange : C.border}
          strokeWidth={active ? 2 : 1}
          strokeDasharray={active ? undefined : '4 3'}
        />
        <text x={140} y={y + h / 2} textAnchor="middle" dominantBaseline="central"
          fontFamily="'JetBrains Mono', monospace" fontSize={14}
          fill={active ? C.orange : C.muted}
        >+</text>
      </g>
    );
  }

  return (
    <WidgetCard title="Transformer Block — step through the architecture" number="10.1" tryThis={tryThis}>
      <style>{`@keyframes tb-fadein { from { opacity:0 } to { opacity:1 } }`}</style>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* ── SVG diagram ────────────────────────────────────────────────── */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <svg viewBox="0 0 280 460" width="100%" style={{ display: 'block' }}>
            <defs>
              <filter id="tb-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <marker id="tb-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={C.borderLt}/>
              </marker>
            </defs>

            {/* Input dashed entry */}
            <g filter={isInput() ? 'url(#tb-glow)' : undefined}>
              <line x1={140} y1={4} x2={140} y2={18}
                stroke={isInput() ? C.accent : C.borderLt} strokeWidth={1.5}
                strokeDasharray="4 3" markerEnd="url(#tb-arrow)"/>
              <text x={155} y={14} fontFamily="'JetBrains Mono', monospace"
                fontSize={11} fill={isInput() ? C.accent : C.muted}>x</text>
            </g>

            {/* Connecting arrows — snap to current mode positions */}
            {order.map((id, i) => {
              if (i === order.length - 1) return null;
              const nxt = order[i + 1];
              const fy = id === 'input' ? yMap[id] + 10 : yMap[id] + BOX_H[id];
              const ty = yMap[nxt];
              return (
                <line key={`arr-${id}-${nxt}`}
                  x1={140} y1={fy} x2={140} y2={ty - 2}
                  stroke={C.borderLt} strokeWidth={1.5}
                  markerEnd="url(#tb-arrow)"
                />
              );
            })}

            {/* Skip connection 1 */}
            <path d={s1path} fill="none" stroke={C.orange}
              strokeWidth={1.5} strokeDasharray="5 3" opacity={s1op}
              style={{ transition: 'opacity 200ms ease' }}/>
            <text x={248} y={42} fontFamily="'JetBrains Mono', monospace"
              fontSize={10} fill={C.orange} opacity={s1op}
              style={{ transition: 'opacity 200ms ease' }}>x</text>

            {/* Skip connection 2 */}
            <path d={s2path} fill="none" stroke={C.orange}
              strokeWidth={1.5} strokeDasharray="5 3" opacity={s2op}
              style={{ transition: 'opacity 200ms ease' }}/>

            {/* Wide boxes */}
            {wideBox('ln1', 'Layer Norm 1')}
            {wideBox('mha', 'Multi-Head Attn')}
            {wideBox('ln2', 'Layer Norm 2')}
            {wideBox('ffn', 'Feed-Forward')}

            {/* Add (+) boxes */}
            {addBox('add1')}
            {addBox('add2')}

            {/* Output dashed exit */}
            <g filter={isOut() ? 'url(#tb-glow)' : undefined}>
              <line x1={140} y1={428} x2={140} y2={450}
                stroke={isOut() ? C.accent : C.borderLt} strokeWidth={1.5}
                strokeDasharray="4 3" markerEnd="url(#tb-arrow)"/>
              <text x={155} y={442} fontFamily="'JetBrains Mono', monospace"
                fontSize={11} fill={isOut() ? C.accent : C.muted}>y</text>
            </g>
          </svg>
        </div>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Pre-LN / Post-LN toggle */}
          <div style={{
            display: 'inline-flex', border: `1px solid ${C.border}`,
            borderRadius: 6, overflow: 'hidden', alignSelf: 'flex-start',
          }}>
            {['pre', 'post'].map((mv, i) => (
              <button key={mv} onClick={() => setNormMode(mv)} style={{
                padding: '5px 12px',
                background: m === mv ? C.accentDim : 'transparent',
                color: m === mv ? C.accent : C.textMid,
                border: 'none',
                borderRight: i === 0 ? `1px solid ${C.border}` : 'none',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                transition: 'background 150ms, color 150ms',
              }}>
                {mv === 'pre' ? 'Pre-LN (modern)' : 'Post-LN (original)'}
              </button>
            ))}
          </div>

          {/* Prev / Next / Auto-play */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              disabled={step === 1}
              onClick={() => { setIsPlaying(false); setStep(s => Math.max(1, s - 1)); }}
              style={btnStyle(step === 1)}
            >← Prev</button>
            <button
              disabled={step === 7}
              onClick={() => { setIsPlaying(false); setStep(s => Math.min(7, s + 1)); }}
              style={btnStyle(step === 7, true)}
            >Next →</button>
            <button
              onClick={() => {
                if (step >= 7 && !isPlaying) {
                  setStep(1);
                  setTimeout(() => setIsPlaying(true), 50);
                  return;
                }
                setIsPlaying(p => !p);
              }}
              style={btnStyle(false)}
            >{isPlaying ? 'Pause' : 'Auto-play'}</button>
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
            {[1,2,3,4,5,6,7].map(n => (
              <div key={n}
                onClick={() => { setIsPlaying(false); setStep(n); }}
                style={{
                  width: n === step ? 10 : 6,
                  height: n === step ? 10 : 6,
                  borderRadius: '50%',
                  background: n === step ? C.accent : C.borderLt,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Description panel */}
          <div
            key={`desc-${step}-${m}`}
            style={{
              background: C.bg3,
              borderTop: `1px solid ${C.border}`,
              borderRadius: '6px',
              padding: '16px 20px',
              flex: 1,
              animation: 'tb-fadein 200ms ease',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '10px',
            }}>
              <span style={{ ...mono, fontSize: '12px', fontWeight: 700, color: C.accent }}>
                {sd.title[m]}
              </span>
              <span style={{ ...mono, fontSize: '11px', color: C.muted }}>
                {step} / 7
              </span>
            </div>
            <p style={{ ...inter, fontSize: '13px', color: '#b8c4cc', lineHeight: 1.65, margin: 0 }}>
              {sd.desc[m]}
            </p>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
