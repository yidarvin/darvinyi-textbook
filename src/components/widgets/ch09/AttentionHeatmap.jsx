import { useState, useEffect, useRef, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  bg2:       '#111111',
  bg3:       '#161616',
  border:    '#242424',
  codeBg:    '#0a0a0a',
  text:      '#e8eaed',
  textMid:   '#888888',
  textMuted: '#555555',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

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

// Each token gets a 4-dim query/key vector built from a coarse part-of-speech
// direction (so same-type tokens naturally resemble each other) plus a small
// fixed per-position offset (so ties break and the pattern isn't perfectly
// symmetric) — the same "hand-authored toy Q/K, then real matmul+softmax"
// approach QKVInspector.jsx uses. These are illustrative embeddings, not
// weights read off a trained model (no real model inference in-browser —
// see STYLE_GUIDE.md); the attention weights below ARE genuinely computed
// from them via S=QKᵀ, scaled by √4, and softmax row-wise.
const TYPE_VEC = {
  ART:  [1.0, 0.0, 0.0, 0.0],
  NOUN: [0.0, 1.0, 0.0, 0.0],
  VERB: [0.0, 0.0, 1.0, 0.0],
  PREP: [0.0, 0.0, 0.0, 1.0],
  PRON: [0.5, 0.0, 0.0, 0.6],
  ADJ:  [0.3, 0.6, 0.0, 0.0],
};
const Q_SCALE = 1.4, K_SCALE = 1.08;
const OFFSET_Q = [
  [0.05, 0.10, -0.05, 0.00], [0.10, 0.00, 0.05, -0.05], [-0.05, 0.10, 0.00, 0.05],
  [0.05, -0.05, 0.10, 0.00], [-0.05, 0.05, 0.10, 0.00], [0.05, -0.10, 0.00, 0.05],
];
const OFFSET_K = [
  [0.00, 0.05, 0.05, -0.05], [0.05, 0.00, 0.00, 0.10], [0.00, 0.05, 0.00, 0.00],
  [0.10, 0.00, 0.00, 0.00], [0.05, -0.05, 0.00, 0.05], [0.00, 0.10, 0.05, 0.00],
];

function buildWeights(types) {
  const Q = types.map((t, i) => TYPE_VEC[t].map((v, j) => v * Q_SCALE + OFFSET_Q[i % 6][j]));
  const K = types.map((t, i) => TYPE_VEC[t].map((v, j) => v * K_SCALE + OFFSET_K[i % 6][j]));
  const S_raw = matMul(Q, transpose(K));
  const S_sc  = S_raw.map(row => row.map(v => v / Math.sqrt(4)));
  return softmaxRows(S_sc);
}

const SENTENCES = {
  A: {
    label:   'The cat sat...',
    tokens:  ['The', 'cat', 'sat', 'on', 'the', 'mat'],
    types:   ['ART', 'NOUN', 'VERB', 'PREP', 'ART', 'NOUN'],
  },
  B: {
    label:   'She loves to...',
    tokens:  ['She', 'loves', 'to', 'eat', 'ice', 'cream'],
    types:   ['PRON', 'VERB', 'PREP', 'VERB', 'ADJ', 'NOUN'],
  },
  C: {
    label:   'The quick brown...',
    tokens:  ['The', 'quick', 'brown', 'fox', 'jumps'],
    types:   ['ART', 'ADJ', 'ADJ', 'NOUN', 'VERB'],
  },
};
Object.values(SENTENCES).forEach(s => { s.weights = buildWeights(s.types); });

const LEFT_MARGIN = 48;
const TOP_MARGIN  = 32;
const RIGHT_PAD   = 8;
const BOTTOM_PAD  = 8;
const STATS_W     = 152;
const FLEX_GAP    = 12;
// Maximum cell sizes from spec (62px for 6-token, 74px for 5-token)
const MAX_CELL    = { 5: 74, 6: 62 };

function weightToColor(w) {
  w = Math.max(0, Math.min(1, w));
  const c1 = [10, 10, 10];    // #0a0a0a
  const c2 = [13, 46, 43];    // #0d2e2b
  const c3 = [45, 212, 191];  // #2dd4bf
  let r, g, b;
  if (w <= 0.5) {
    const t = w * 2;
    r = c1[0] + t * (c2[0] - c1[0]);
    g = c1[1] + t * (c2[1] - c1[1]);
    b = c1[2] + t * (c2[2] - c1[2]);
  } else {
    const t = (w - 0.5) * 2;
    r = c2[0] + t * (c3[0] - c2[0]);
    g = c2[1] + t * (c3[1] - c2[1]);
    b = c2[2] + t * (c3[2] - c2[2]);
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function calcEntropy(row) {
  return -row.reduce((s, p) => (p > 1e-10 ? s + p * Math.log(p) : s), 0);
}

export default function AttentionHeatmap({ tryThis }) {
  const [sentence, setSentence]     = useState('A');
  const [pinnedRow, setPinnedRow]   = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showValues, setShowValues] = useState(true);
  const [normalizeDisp, setNorm]    = useState(false);
  const [barsReady, setBarsReady]   = useState(false);
  // Track actual container width for responsive cell sizing
  const [containerWidth, setContainerWidth] = useState(608);

  const canvasRef     = useRef(null);
  const containerRef  = useRef(null);
  const hoveredRowRef = useRef(null);
  const lastPinnedRef = useRef(null);

  hoveredRowRef.current = hoveredRow;
  if (pinnedRow !== null) lastPinnedRef.current = pinnedRow;
  const displayPinned = pinnedRow !== null ? pinnedRow : lastPinnedRef.current;

  const { tokens, weights } = SENTENCES[sentence];
  const N = tokens.length;

  // Responsive cell size: fill the canvas column, capped at spec max
  const canvasColW  = Math.max(120, containerWidth - STATS_W - FLEX_GAP);
  const cellSize    = Math.min(MAX_CELL[N] ?? 62, Math.max(30, Math.floor((canvasColW - LEFT_MARGIN - RIGHT_PAD) / N)));
  const canvasW     = LEFT_MARGIN + N * cellSize + RIGHT_PAD;
  const canvasH     = TOP_MARGIN  + N * cellSize + BOTTOM_PAD;

  // Measure container width whenever it changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setContainerWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset state on sentence change
  useEffect(() => {
    setPinnedRow(null);
    setHoveredRow(null);
    setBarsReady(false);
    lastPinnedRef.current = null;
  }, [sentence]);

  // Trigger bar animation on pin change
  useEffect(() => {
    if (pinnedRow === null) { setBarsReady(false); return; }
    setBarsReady(false);
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setBarsReady(true))
    );
    return () => cancelAnimationFrame(id);
  }, [pinnedRow]);

  // Draw heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const dispW = normalizeDisp
      ? weights.map(row => { const mx = Math.max(...row); return row.map(w => w / mx); })
      : weights;

    const activeRow = pinnedRow !== null ? pinnedRow : hoveredRow;

    // Cell fills + highlight overlay
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const x = LEFT_MARGIN + c * cellSize;
        const y = TOP_MARGIN  + r * cellSize;
        ctx.fillStyle = weightToColor(dispW[r][c]);
        ctx.fillRect(x, y, cellSize, cellSize);
        if (r === activeRow) {
          ctx.fillStyle = 'rgba(45,212,191,0.10)';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }

    // Teal 3px left border on active row
    if (activeRow !== null) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(LEFT_MARGIN, TOP_MARGIN + activeRow * cellSize, 3, cellSize);
    }

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= N; r++) {
      ctx.beginPath();
      ctx.moveTo(LEFT_MARGIN,              TOP_MARGIN + r * cellSize);
      ctx.lineTo(LEFT_MARGIN + N*cellSize, TOP_MARGIN + r * cellSize);
      ctx.stroke();
    }
    for (let c = 0; c <= N; c++) {
      ctx.beginPath();
      ctx.moveTo(LEFT_MARGIN + c * cellSize, TOP_MARGIN);
      ctx.lineTo(LEFT_MARGIN + c * cellSize, TOP_MARGIN + N * cellSize);
      ctx.stroke();
    }

    // Weight text (only when cells are large enough to read)
    if (showValues && cellSize >= 36) {
      const fontSize = Math.max(8, Math.min(10, cellSize - 52));
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const w = weights[r][c];
          ctx.fillStyle = w >= 0.2 ? '#ffffff' : C.textMuted;
          ctx.fillText(
            w.toFixed(2),
            LEFT_MARGIN + c * cellSize + cellSize / 2,
            TOP_MARGIN  + r * cellSize + cellSize / 2,
          );
        }
      }
    }

    // Column headers (Key tokens — top)
    const headerFont = Math.max(9, Math.min(12, cellSize - 50));
    ctx.font        = `${headerFont}px 'JetBrains Mono', monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle   = C.textMid;
    for (let c = 0; c < N; c++) {
      ctx.fillText(tokens[c], LEFT_MARGIN + c * cellSize + cellSize / 2, TOP_MARGIN - 4);
    }

    // Row headers (Query tokens — left)
    ctx.textAlign   = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < N; r++) {
      ctx.fillStyle = r === activeRow ? C.accent : C.textMid;
      ctx.fillText(tokens[r], LEFT_MARGIN - 6, TOP_MARGIN + r * cellSize + cellSize / 2);
    }

    // Axis labels
    ctx.font      = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = C.textMuted;
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Key →', LEFT_MARGIN, 3);
    ctx.textAlign   = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Query →', LEFT_MARGIN - 6, TOP_MARGIN - 4);

    if (normalizeDisp) {
      ctx.textAlign   = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('normalized per row', canvasW - RIGHT_PAD, 3);
    }
  }, [tokens, weights, N, cellSize, canvasW, canvasH, hoveredRow, pinnedRow, showValues, normalizeDisp]);

  // Mouse handlers
  const handleMouseMove = useCallback((e) => {
    const row = Math.floor((e.nativeEvent.offsetY - TOP_MARGIN) / cellSize);
    setHoveredRow(row >= 0 && row < N ? row : null);
  }, [N, cellSize]);

  const handleMouseLeave = useCallback(() => setHoveredRow(null), []);

  const handleClick = useCallback(() => {
    const hr = hoveredRowRef.current;
    if (hr !== null) setPinnedRow(prev => (prev === hr ? null : hr));
  }, []);

  // Stats
  const maxWeight = Math.max(...weights.flat());
  const avgDiag   = weights.reduce((s, row, i) => s + row[i], 0) / N;

  const pinnedWeights = pinnedRow !== null ? weights[pinnedRow] : null;
  let mostIdx = 0, leastIdx = 0;
  if (pinnedWeights) {
    pinnedWeights.forEach((w, i) => {
      if (w > pinnedWeights[mostIdx]) mostIdx = i;
      if (w < pinnedWeights[leastIdx]) leastIdx = i;
    });
  }
  const selfAttn = pinnedRow !== null ? weights[pinnedRow][pinnedRow] : null;
  const ent      = pinnedRow !== null ? calcEntropy(weights[pinnedRow]) : null;
  const entHint  = ent !== null
    ? ent < 1.0 ? 'sharp (focused)' : ent < 1.5 ? 'moderate' : 'diffuse'
    : null;

  const barWeights   = displayPinned !== null ? weights[displayPinned] : null;
  const barTokenName = displayPinned !== null ? tokens[displayPinned] : '';

  return (
    <WidgetCard title="Attention Heatmap — token-to-token attention weights" number="9.1" tryThis={tryThis}>

      {/* Controls — sentence tabs on row 1, toggles on row 2 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          display: 'inline-flex',
          border: `1px solid ${C.border}`,
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '8px',
        }}>
          {Object.entries(SENTENCES).map(([key, s], idx, arr) => (
            <button
              key={key}
              onClick={() => setSentence(key)}
              style={{
                padding: '5px 11px',
                background: sentence === key ? 'var(--accent-dim)' : 'transparent',
                color: sentence === key ? C.accent : C.textMid,
                border: 'none',
                borderRight: idx < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                cursor: 'pointer',
                ...mono,
                fontSize: '11px',
                fontWeight: sentence === key ? 600 : 400,
                transition: 'background 150ms, color 150ms',
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Toggle checked={showValues}    onChange={setShowValues} label="Show values" />
          <Toggle checked={normalizeDisp} onChange={setNorm}       label="Normalize display" />
        </div>
      </div>

      {/* Main content — measured by containerRef */}
      <div
        ref={containerRef}
        style={{ display: 'flex', gap: FLEX_GAP, alignItems: 'flex-start' }}
      >
        {/* Canvas + bar chart column */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: C.codeBg, borderRadius: '6px', overflow: 'hidden', display: 'inline-block' }}>
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Attention-weight heatmap. Use the query-token selector below to inspect and pin a row."
              style={{ width: canvasW, height: canvasH, display: 'block', cursor: 'pointer' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            />
          </div>
          <select
            className="a11y-data-selector"
            aria-label="Inspect attention query token"
            value={pinnedRow ?? ""}
            onChange={event => {
              const row = event.target.value === "" ? null : Number(event.target.value);
              setHoveredRow(row);
              setPinnedRow(row);
            }}
          >
            <option value="">Select a query token</option>
            {tokens.map((token, index) => <option key={`${token}-${index}`} value={index}>{`${token}: attention row ${index + 1}`}</option>)}
          </select>

          {/* Bar chart panel — slides in when a row is pinned */}
          <div style={{
            width: canvasW,
            maxHeight: pinnedRow !== null ? '400px' : '0px',
            overflow: 'hidden',
            opacity: pinnedRow !== null ? 1 : 0,
            transition: 'max-height 300ms ease, opacity 250ms ease',
          }}>
            <div style={{ background: 'var(--bg3)', borderTop: `1px solid ${C.border}`, padding: '10px 12px' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.text, marginBottom: '8px' }}>
                "{barTokenName}" attends to:
              </div>
              {barWeights && tokens.map((token, i) => {
                const w = barWeights[i];
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: i < N - 1 ? '4px' : '0',
                  }}>
                    <span style={{ ...mono, fontSize: '11px', color: C.textMid, width: '44px', textAlign: 'right', flexShrink: 0 }}>
                      {token}
                    </span>
                    <div style={{ flex: 1, height: '18px', background: '#181818', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '18px',
                        width: barsReady ? `${w * 100}%` : '0%',
                        background: C.accent,
                        borderRadius: '2px',
                        transition: barsReady ? 'width 300ms ease-out' : 'none',
                      }} />
                    </div>
                    <span style={{ ...mono, fontSize: '11px', color: C.accent, width: '34px', textAlign: 'right', flexShrink: 0 }}>
                      {w.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats panel */}
        <div style={{
          width: STATS_W,
          flexShrink: 0,
          background: C.bg2,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
        }}>
          {pinnedRow === null ? (
            <>
              <Stat label="Sentence"      val={sentence} />
              <Stat label="Tokens"        val={String(N)} />
              <Stat label="Max weight"    val={maxWeight.toFixed(2)} />
              <Stat label="Avg self-attn" val={avgDiag.toFixed(2)} />
              <div style={{ ...mono, fontSize: '9px', color: C.textMuted, lineHeight: 1.6, marginTop: '2px' }}>
                Click a row to inspect
              </div>
            </>
          ) : (
            <>
              <Stat label="Query token"
                    val={`"${tokens[pinnedRow]}"`} />
              <Stat label="Attends most to"
                    val={`"${tokens[mostIdx]}" (${weights[pinnedRow][mostIdx].toFixed(2)})`} />
              <Stat label="Attends least to"
                    val={`"${tokens[leastIdx]}" (${weights[pinnedRow][leastIdx].toFixed(2)})`} />
              <Stat label="Self-attention"
                    val={selfAttn.toFixed(2)} />
              <Stat label="Entropy H (nats)"
                    val={ent.toFixed(3)} />
              <div style={{ ...mono, fontSize: '9px', color: C.textMuted, marginTop: '2px' }}>
                {entHint}
              </div>
            </>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}

function Stat({ label, val }) {
  return (
    <div>
      <div style={{
        ...mono, fontSize: '9px', color: C.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px',
      }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: '11px', color: C.accent }}>
        {val}
      </div>
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
