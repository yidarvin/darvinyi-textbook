import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  codeBg:    '#0a0a0a',
  bg2:       '#111111',
  border:    '#242424',
  text:      '#e8eaed',
  textMid:   '#888888',
  textMuted: '#555555',
  accent:    '#2dd4bf',
};
const mono   = { fontFamily: "'JetBrains Mono', monospace" };
const inter  = { fontFamily: "'Inter', sans-serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

const HEAD_COLORS = ['#2dd4bf', '#fb923c', '#a78bfa', '#34d399'];
const HEAD_NAMES  = ['Head 1', 'Head 2', 'Head 3', 'Head 4'];
const HEAD_LABELS = ['Local', 'Global', 'Identity', 'Semantic'];
const HEAD_SPECS  = [
  'Local / Adjacent',
  'Global Context / First Token',
  'Identity / Self-Attention',
  'Semantic / Content-Based',
];
const HEAD_DESCS = [
  'This head tracks local context by attending primarily to immediately neighboring tokens. Each token looks one step left and right, capturing short-range dependencies like modifier-noun pairs and verb-adjacent structure. This local inductive bias appears consistently in the lower layers of trained transformers, resembling the receptive field of a small convolutional kernel. It gives the model a local smoothing operation before higher heads reason over longer distances.',
  'Every token routes a large fraction of its attention to the first token, which acts as a global anchor for the entire sequence. This pattern is observed in BERT-style models where the [CLS] token aggregates sequence-level information. All positions share a common reference point, enabling global information broadcast without direct token-to-token edges across the full graph. Heads like this are especially useful for sentence-level classification tasks.',
  'The attention matrix is nearly diagonal — each token attends most strongly to itself. This identity pass-through preserves a token\'s own representation across the layer without diluting it with context. Models use these low-entropy "no-op" heads to ensure that even in deep stacks, individual token information remains accessible. Entropy is very low here: the distribution is sharply peaked on the diagonal.',
  'Content words attend to their semantically related counterparts. Verbs attend to objects, modifiers cluster with the words they modify, and nouns reference their governing verbs. This reflects a soft learned version of dependency parsing — the head has internalized relational sentence structure. Attention entropy is moderate: more diffuse than identity heads, but far from uniform.',
];

// ── math (scaled dot-product attention, same pipeline as QKVInspector) ──────
function matMul(A, B) {
  return A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
}
function transpose(M) { return M[0].map((_, j) => M.map(r => r[j])); }
function softmax(arr) {
  const mx = Math.max(...arr);
  const ex = arr.map(v => Math.exp(v - mx));
  const sm = ex.reduce((a, b) => a + b, 0);
  return ex.map(v => v / sm);
}
function softmaxRows(M) { return M.map(softmax); }
function attention(Q, K, d) {
  const S = matMul(Q, transpose(K));
  return softmaxRows(S.map(row => row.map(v => v / Math.sqrt(d))));
}

// Each of the four heads below gets its own hand-authored Q/K construction —
// a position-only feature map for the three structural archetypes, a
// part-of-speech feature map for the semantic one — then the displayed
// weights are the REAL output of matmul + scale + softmax on those vectors,
// not authored directly. This is the same "toy input, real computation"
// approach QKVInspector.jsx and AttentionHeatmap.jsx use; see
// STYLE_GUIDE.md's widget-fidelity rule. These idealized archetypes are
// illustrative of patterns reported in BERT-style models (Voita et al. 2019,
// Clark et al. 2019), not extracted from any specific trained model.
const D = 4;

// Head 1 — Local: dot(Q_i,K_j) = -(i-j)^2 * TEMP, a real closed-form
// quadratic-distance kernel (expand -(i-j)^2 = -i^2+2ij-j^2 into two
// matching feature maps), so nearby positions score highest by construction.
const LOCAL_TEMP = 0.5;
function headLocal(n) {
  const Q = Array.from({ length: n }, (_, i) => [-LOCAL_TEMP, 2 * i * LOCAL_TEMP, -(i * i) * LOCAL_TEMP, 0]);
  const K = Array.from({ length: n }, (_, j) => [j * j, j, 1, 0]);
  return attention(Q, K, D);
}

// Head 2 — Global/anchor: token 0's key carries a large shared-direction
// component that every query has a fixed component in, so every row routes
// a large share of its mass to position 0 regardless of query identity —
// the query-agnostic broadcast pattern real CLS/anchor heads show.
const ANCHOR_MAG = 4.5, ANCHOR_OTHER = 0.5;
function headGlobal(n) {
  const K = Array.from({ length: n }, (_, j) =>
    j === 0 ? [ANCHOR_MAG, 0, 0.1, 0] : [0, ANCHOR_OTHER * Math.sin(j), 0.15, 0.1 * j]);
  const Q = Array.from({ length: n }, (_, i) => [0.6, 0.15, 0.15 * i, 0.08]);
  return attention(Q, K, D);
}

// Head 3 — Identity: positions on a unit circle, Q=K, so dot(Q_i,K_j) =
// SCALE^2*cos(2π(i-j)/n), maximized at i=j; the scale sharpens softmax into
// a near-one-hot diagonal.
const IDENTITY_SCALE = 2.5;
function headIdentity(n) {
  const QK = Array.from({ length: n }, (_, i) => {
    const th = (2 * Math.PI * i) / n;
    return [Math.cos(th) * IDENTITY_SCALE, Math.sin(th) * IDENTITY_SCALE, 0, 0];
  });
  return attention(QK, QK, D);
}

// Head 4 — Semantic: each token's query points toward the part-of-speech
// direction it semantically depends on (verbs and modifiers seek nouns,
// nouns seek their governing verb) rather than toward its own type, giving
// genuine cross-type dependency-like peaks instead of a diagonal.
const SEM_SCALE = 1.5;
const KDIR = { ART: [1,0,0,0], PRON: [1,0,0,0], NOUN: [0,1,0,0], VERB: [0,0,1,0], ADJ: [0,0,0,1], ADV: [0,0,0,1] };
const QDIR = { ART: [0,1,0,0], PRON: [0,0,1,0], NOUN: [0,0,1,0], VERB: [0,1,0,0], ADJ: [0,1,0,0], ADV: [0,0,1,0] };
function headSemantic(types) {
  const Q = types.map(t => QDIR[t].map(v => v * SEM_SCALE));
  const K = types.map(t => KDIR[t].map(v => v * SEM_SCALE));
  return attention(Q, K, D);
}

function buildHeads(types) {
  const n = types.length;
  return [headLocal(n), headGlobal(n), headIdentity(n), headSemantic(types)];
}

const TOKENS_A = ['The', 'model', 'learns', 'many', 'patterns'];
const SHORT_A  = ['The', 'mod', 'lea', 'man', 'pat'];
const TYPES_A  = ['ART', 'NOUN', 'VERB', 'ADJ', 'NOUN'];
const WEIGHTS_A = buildHeads(TYPES_A);

const TOKENS_B = ['She', 'quickly', 'reads', 'every', 'book'];
const SHORT_B  = ['She', 'qui', 'rea', 'eve', 'boo'];
const TYPES_B  = ['PRON', 'ADV', 'VERB', 'ADJ', 'NOUN'];
const WEIGHTS_B = buildHeads(TYPES_B);

// ─── Utility ─────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function wColor(w, hex) {
  w = Math.max(0, Math.min(1, w));
  const bg = [10,10,10], fg = hexToRgb(hex);
  return `rgb(${Math.round(bg[0]+w*(fg[0]-bg[0]))},${Math.round(bg[1]+w*(fg[1]-bg[1]))},${Math.round(bg[2]+w*(fg[2]-bg[2]))})`;
}

// Nats (natural log), matching QKVInspector.jsx and AttentionHeatmap.jsx —
// entropy is reported in the same units across all three ch09 widgets.
function calcEntropy(weights) {
  const rowH = weights.map(row =>
    -row.reduce((s,p) => s + (p > 0 ? p * Math.log(p + 1e-10) : 0), 0)
  );
  return rowH.reduce((a,b) => a+b, 0) / weights.length;
}

function bestNonSelfPair(weights, tokens) {
  let best = { w: 0, r: 0, c: 1 };
  weights.forEach((row, r) => row.forEach((w, c) => {
    if (r !== c && w > best.w) best = { w, r, c };
  }));
  return `${tokens[best.r]} → ${tokens[best.c]} (${best.w.toFixed(2)})`;
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function drawHeatmap(canvas, { weights, tokens, color, cell, lm, tm, showVals }) {
  if (!canvas) return;
  const N = tokens.length;
  const W = lm + N * cell + 4;
  const H = tm + N * cell + 4;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      ctx.fillStyle = wColor(weights[r][c], color);
      ctx.fillRect(lm + c*cell, tm + r*cell, cell, cell);
    }
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= N; i++) {
    ctx.beginPath(); ctx.moveTo(lm, tm + i*cell); ctx.lineTo(lm + N*cell, tm + i*cell); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lm + i*cell, tm); ctx.lineTo(lm + i*cell, tm + N*cell); ctx.stroke();
  }

  if (showVals) {
    const fs = Math.max(7, Math.min(10, cell - 22));
    ctx.font = `${fs}px 'JetBrains Mono', monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        ctx.fillStyle = weights[r][c] >= 0.27 ? 'rgba(255,255,255,0.88)' : C.textMuted;
        ctx.fillText(weights[r][c].toFixed(2), lm + c*cell + cell/2, tm + r*cell + cell/2);
      }
    }
  }

  const hf = Math.max(8, Math.min(11, cell - 20));
  ctx.font = `${hf}px 'JetBrains Mono', monospace`;
  ctx.fillStyle    = C.textMid;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'bottom';
  for (let c = 0; c < N; c++) {
    ctx.fillText(tokens[c], lm + c*cell + cell/2, tm - 3);
  }

  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < N; r++) {
    ctx.fillStyle = C.textMuted;
    ctx.fillText(tokens[r], lm - 4, tm + r*cell + cell/2);
  }
}

function drawThumb(canvas, weights, color) {
  if (!canvas) return;
  const N = weights.length, S = 80, cell = S / N;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(S * dpr);
  canvas.height = Math.round(S * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, S, S);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      ctx.fillStyle = wColor(weights[r][c], color);
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SM_CELL = 38, SM_LM = 36, SM_TM = 24;
const LG_CELL = 60, LG_LM = 68, LG_TM = 36;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SmallHeatmap({ weights, tokens, color, headLabel, specLabel, showVals, showDesc, onClick }) {
  const ref = useRef(null);
  const N   = tokens.length;
  const cW  = SM_LM + N * SM_CELL + 4;
  const cH  = SM_TM + N * SM_CELL + 4;

  useEffect(() => {
    drawHeatmap(ref.current, { weights, tokens, color, cell: SM_CELL, lm: SM_LM, tm: SM_TM, showVals });
  }, [weights, tokens, color, showVals]);

  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ ...mono, fontSize: '12px', fontWeight: 700, color, marginBottom: '3px' }}>
        {headLabel}
      </div>
      {showDesc && (
        <div style={{ ...mono, fontSize: '10px', color: C.textMid, marginBottom: '6px' }}>
          {specLabel}
        </div>
      )}
      <div style={{ background: C.codeBg, borderRadius: '4px', overflow: 'hidden', display: 'inline-block', border: `1px solid ${C.border}` }}>
        <canvas ref={ref} style={{ width: cW, height: cH, display: 'block' }} />
      </div>
    </div>
  );
}

function ThumbnailCanvas({ weights, color, headName, active, onClick }) {
  const ref = useRef(null);

  useEffect(() => {
    drawThumb(ref.current, weights, color);
  }, [weights, color]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div
        onClick={onClick}
        style={{
          cursor: 'pointer',
          borderRadius: '4px',
          overflow: 'hidden',
          border: `${active ? 2 : 1}px solid ${active ? C.accent : C.border}`,
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <canvas ref={ref} style={{ width: 80, height: 80, display: 'block' }} />
      </div>
      <span style={{ ...mono, fontSize: '9px', color: active ? color : C.textMuted }}>
        {headName}
      </span>
    </div>
  );
}

function StatRow({ label, val, valColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
      <span style={{ ...mono, fontSize: '10px', color: C.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ ...mono, fontSize: '11px', color: valColor || C.accent, textAlign: 'right' }}>{val}</span>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: C.accent }}
      />
      <span style={{ ...mono, fontSize: '11px', color: C.textMuted }}>{label}</span>
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MultiHeadAttention({ tryThis }) {
  const [expandedHead, setExpandedHead] = useState(null);
  const [showValues,   setShowValues]   = useState(false);
  const [showDescs,    setShowDescs]    = useState(true);
  const [sentence,     setSentence]     = useState('A');

  const allWeights = sentence === 'A' ? WEIGHTS_A : WEIGHTS_B;
  const tokens     = sentence === 'A' ? TOKENS_A  : TOKENS_B;
  const shortToks  = sentence === 'A' ? SHORT_A   : SHORT_B;

  const expandedRef = useRef(null);

  const lgCanvasW = LG_LM + tokens.length * LG_CELL + 4;
  const lgCanvasH = LG_TM + tokens.length * LG_CELL + 4;

  useEffect(() => {
    if (expandedHead === null) return;
    drawHeatmap(expandedRef.current, {
      weights:  allWeights[expandedHead],
      tokens,
      color:    HEAD_COLORS[expandedHead],
      cell:     LG_CELL,
      lm:       LG_LM,
      tm:       LG_TM,
      showVals: true,
    });
  }, [expandedHead, allWeights, tokens]);

  const avgEntropies = allWeights.map(calcEntropy);

  const tabBtn = (active) => ({
    padding: '5px 12px',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? C.accent : C.textMid,
    border: 'none',
    cursor: 'pointer',
    ...mono,
    fontSize: '11px',
    fontWeight: active ? 600 : 400,
    transition: 'background 150ms, color 150ms',
    whiteSpace: 'nowrap',
  });

  return (
    <WidgetCard title="Multi-Head Attention — 4 heads, 4 different patterns" number="9.3" tryThis={tryThis}>

      {/* ── Controls ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
        <div style={{
          display: 'inline-flex',
          border: `1px solid ${C.border}`,
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <button onClick={() => setSentence('A')} style={{ ...tabBtn(sentence === 'A'), borderRight: `1px solid ${C.border}` }}>
            Sentence A
          </button>
          <button onClick={() => setSentence('B')} style={{ ...tabBtn(sentence === 'B') }}>
            Sentence B
          </button>
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          <Toggle checked={showValues} onChange={setShowValues} label="Show values" />
          <Toggle checked={showDescs}  onChange={setShowDescs}  label="Show descriptions" />
        </div>
      </div>

      {/* ── Grid view ────────────────────────────────────────────────── */}
      {expandedHead === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 2×2 grid — full width */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[0,1,2,3].map(i => (
              <SmallHeatmap
                key={i}
                weights={allWeights[i]}
                tokens={shortToks}
                color={HEAD_COLORS[i]}
                headLabel={`${HEAD_NAMES[i]} — ${HEAD_LABELS[i]}`}
                specLabel={HEAD_SPECS[i]}
                showVals={showValues}
                showDesc={showDescs}
                onClick={() => setExpandedHead(i)}
              />
            ))}
          </div>

          {/* Stats bar — compact single line */}
          <div style={{
            background: C.bg2,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '9px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}>
            <span style={{ ...mono, fontSize: '11px', color: C.textMid }}>
              4 heads · {tokens.length} tokens
            </span>
            <span style={{ color: C.border, userSelect: 'none' }}>|</span>
            {[0,1,2,3].map((i, _, arr) => (
              <span key={i} style={{ ...mono, fontSize: '11px' }}>
                <span style={{ color: C.textMuted }}>H{i+1} </span>
                <span style={{ color: HEAD_COLORS[i] }}>{avgEntropies[i].toFixed(2)}</span>
                {i < arr.length - 1 && <span style={{ color: C.border }}> ·</span>}
              </span>
            ))}
            <span style={{ ...mono, fontSize: '9px', color: C.textMuted }}>avg entropy (nats)</span>
            <span style={{ ...mono, fontSize: '9px', color: C.textMuted, marginLeft: 'auto' }}>
              click a head to expand
            </span>
          </div>
        </div>
      )}

      {/* ── Expanded view ─────────────────────────────────────────────── */}
      {expandedHead !== null && (
        <div>
          {/* Heatmap + description row */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '16px' }}>

            {/* Large heatmap */}
            <div
              onClick={() => setExpandedHead(null)}
              title="Click to collapse"
              style={{
                background: C.codeBg,
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'inline-block',
                cursor: 'pointer',
                border: `1px solid ${C.border}`,
                flexShrink: 0,
              }}
            >
              <canvas
                ref={expandedRef}
                style={{ display: 'block', width: lgCanvasW, height: lgCanvasH }}
              />
            </div>

            {/* Description panel */}
            {showDescs && (
              <div style={{ width: 200, flexShrink: 0, paddingTop: '2px' }}>
                <div style={{ ...crimson, fontSize: '20px', fontWeight: 600, color: HEAD_COLORS[expandedHead], marginBottom: '4px' }}>
                  {HEAD_NAMES[expandedHead]}
                </div>
                <div style={{ ...inter, fontSize: '13px', color: C.text, marginBottom: '10px' }}>
                  {HEAD_SPECS[expandedHead]}
                </div>
                <div style={{ ...inter, fontSize: '12px', color: '#b8c4cc', lineHeight: 1.6, marginBottom: '14px' }}>
                  {HEAD_DESCS[expandedHead]}
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div style={{ ...mono, fontSize: '11px', color: C.textMid }}>
                    Attention entropy (nats):{' '}
                    <span style={{ color: HEAD_COLORS[expandedHead] }}>
                      {avgEntropies[expandedHead].toFixed(2)}
                    </span>
                  </div>
                  <div style={{ ...mono, fontSize: '11px', color: C.textMid }}>
                    {bestNonSelfPair(allWeights[expandedHead], tokens)}
                  </div>
                </div>
                <div style={{ ...mono, fontSize: '9px', color: C.textMuted, marginTop: '12px' }}>
                  Click heatmap to collapse
                </div>
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[0,1,2,3].map(i => (
              <ThumbnailCanvas
                key={i}
                weights={allWeights[i]}
                color={HEAD_COLORS[i]}
                headName={HEAD_NAMES[i]}
                active={i === expandedHead}
                onClick={() => setExpandedHead(i)}
              />
            ))}
          </div>
        </div>
      )}

    </WidgetCard>
  );
}
