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

const WEIGHTS_A = [
  [[0.42,0.38,0.11,0.05,0.04],[0.31,0.33,0.22,0.09,0.05],[0.08,0.28,0.36,0.21,0.07],[0.05,0.08,0.26,0.38,0.23],[0.04,0.06,0.12,0.36,0.42]],
  [[0.52,0.18,0.12,0.10,0.08],[0.44,0.28,0.12,0.09,0.07],[0.41,0.20,0.22,0.10,0.07],[0.38,0.19,0.15,0.20,0.08],[0.40,0.17,0.16,0.14,0.13]],
  [[0.62,0.12,0.10,0.09,0.07],[0.10,0.65,0.12,0.08,0.05],[0.09,0.11,0.61,0.12,0.07],[0.07,0.09,0.12,0.63,0.09],[0.06,0.07,0.10,0.11,0.66]],
  [[0.35,0.22,0.18,0.14,0.11],[0.08,0.22,0.34,0.14,0.22],[0.07,0.28,0.24,0.12,0.29],[0.10,0.14,0.18,0.32,0.26],[0.08,0.24,0.28,0.18,0.22]],
];
const TOKENS_A = ['The', 'model', 'learns', 'many', 'patterns'];
const SHORT_A  = ['The', 'mod', 'lea', 'man', 'pat'];

const WEIGHTS_B = [
  [[0.45,0.35,0.12,0.05,0.03],[0.32,0.34,0.21,0.09,0.04],[0.07,0.27,0.38,0.22,0.06],[0.04,0.07,0.27,0.39,0.23],[0.03,0.05,0.11,0.38,0.43]],
  [[0.50,0.20,0.13,0.10,0.07],[0.46,0.26,0.13,0.09,0.06],[0.42,0.18,0.23,0.11,0.06],[0.39,0.17,0.16,0.21,0.07],[0.41,0.16,0.17,0.13,0.13]],
  [[0.63,0.11,0.10,0.09,0.07],[0.09,0.66,0.12,0.08,0.05],[0.08,0.10,0.62,0.12,0.08],[0.07,0.08,0.11,0.65,0.09],[0.06,0.06,0.09,0.12,0.67]],
  [[0.36,0.20,0.19,0.13,0.12],[0.09,0.21,0.32,0.14,0.24],[0.06,0.27,0.23,0.11,0.33],[0.10,0.13,0.17,0.33,0.27],[0.07,0.22,0.30,0.16,0.25]],
];
const TOKENS_B = ['She', 'quickly', 'reads', 'every', 'book'];
const SHORT_B  = ['She', 'qui', 'rea', 'eve', 'boo'];

// ─── Utility ─────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function wColor(w, hex) {
  w = Math.max(0, Math.min(1, w));
  const bg = [10,10,10], fg = hexToRgb(hex);
  return `rgb(${Math.round(bg[0]+w*(fg[0]-bg[0]))},${Math.round(bg[1]+w*(fg[1]-bg[1]))},${Math.round(bg[2]+w*(fg[2]-bg[2]))})`;
}

function calcEntropy(weights) {
  const rowH = weights.map(row =>
    -row.reduce((s,p) => s + (p > 0 ? p * Math.log2(p + 1e-10) : 0), 0)
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
            <span style={{ ...mono, fontSize: '9px', color: C.textMuted }}>avg entropy (bits)</span>
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
                    Attention entropy (bits):{' '}
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
