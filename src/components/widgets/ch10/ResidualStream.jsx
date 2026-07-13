import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:   '#2dd4bf',
  accentDim:'#0b2422',
  orange:   '#fb923c',
  border:   '#242424',
  borderLt: '#2e2e2e',
  muted:    '#555555',
  mid:      '#888888',
  text:     '#e8eaed',
  bg2:      '#111111',
  codeBg:   '#0a0a0a',
  white:    '#ffffff',
};

const STREAM_DATA = {
  the: {
    attn: [0.12, 0.09, 0.11, 0.08, 0.10, 0.09],
    ffn:  [0.08, 0.06, 0.07, 0.09, 0.06, 0.08],
    desc: 'Function words accumulate small, distributed contributions. They carry mostly syntactic information which is established early.',
  },
  cat: {
    attn: [0.18, 0.31, 0.14, 0.22, 0.12, 0.09],
    ffn:  [0.14, 0.12, 0.28, 0.16, 0.10, 0.11],
    desc: 'Content nouns show large contributions at mid-layers where semantic binding happens. Layer 2 attention and layer 3 FFN are dominant.',
  },
  sat: {
    attn: [0.11, 0.14, 0.19, 0.34, 0.21, 0.15],
    ffn:  [0.10, 0.11, 0.14, 0.12, 0.29, 0.13],
    desc: 'Verbs show increasing contribution magnitude at deeper layers as argument structure and tense are resolved.',
  },
  mat: {
    attn: [0.22, 0.10, 0.12, 0.10, 0.13, 0.28],
    ffn:  [0.16, 0.09, 0.10, 0.11, 0.12, 0.22],
    desc: 'The final noun accumulates positional and semantic information early, then gets a late burst as cross-sentence relationships resolve.',
  },
};

const TOKENS = ['the', 'cat', 'sat', 'mat'];
const N_LAYERS = 6;
const EMBED_NORM = 1.0;

// Canvas layout
const CW = 500;
const CH = 260;
const L_PAD = 48;
const R_PAD = 52;
const T_PAD = 24;
const B_PAD = 36;
const CHART_W = CW - L_PAD - R_PAD; // 400
const CHART_H = CH - T_PAD - B_PAD; // 200
const BAR_W = 36;

// Left Y-axis max: max total bar * 1.2
const LEFT_MAX = (() => {
  let max = 0;
  for (const tok of TOKENS) {
    const d = STREAM_DATA[tok];
    for (let l = 0; l < N_LAYERS; l++) {
      const t = d.attn[l] + d.ffn[l];
      if (t > max) max = t;
    }
  }
  return max * 1.2; // 0.50 * 1.2 = 0.60
})();

const NORM_MIN = 1.0;
const NORM_MAX = 3.0;

function leftToY(v) {
  return T_PAD + CHART_H * (1 - v / LEFT_MAX);
}

function rightToY(v) {
  return T_PAD + CHART_H * (1 - (v - NORM_MIN) / (NORM_MAX - NORM_MIN));
}

function barCenterX(l) {
  return L_PAD + (CHART_W / N_LAYERS) * (l + 0.5);
}

function computeNorms(attn, ffn) {
  const norms = [];
  let cum = EMBED_NORM;
  for (let l = 0; l < N_LAYERS; l++) {
    cum += attn[l] + ffn[l];
    norms.push(cum);
  }
  return norms;
}

function lerpArr(a, b, t) {
  return a.map((v, i) => v + (b[i] - v) * t);
}

function argmax(arr) {
  return arr.reduce((best, v, i) => v > arr[best] ? i : best, 0);
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatRow({ label, val, color, italic }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '11px',
        color: C.mid,
        fontStyle: italic ? 'italic' : 'normal',
        flex: 1,
        lineHeight: 1.4,
      }}>
        {label}
      </span>
      {val !== undefined && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: color || C.accent,
          flexShrink: 0,
          lineHeight: 1.6,
        }}>
          {val}
        </span>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px',
      background: active ? C.accentDim : 'transparent',
      color: active ? C.accent : C.mid,
      border: 'none',
      cursor: 'pointer',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      fontWeight: active ? 600 : 400,
      transition: 'background 150ms, color 150ms',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  );
}

// ── Canvas drawing ──────────────────────────────────────────────────────────

function paintCanvas(ctx, { attn, ffn }, { showAttn, showFFN, showNorm, normalize }) {
  const chartBottom = T_PAD + CHART_H;
  const rightEdge   = L_PAD + CHART_W;

  // Background
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, CW, CH);

  // Horizontal grid lines
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  for (const v of [0.1, 0.2, 0.3, 0.4, 0.5]) {
    if (normalize) continue; // grid not meaningful in % mode
    const y = leftToY(v);
    ctx.beginPath();
    ctx.moveTo(L_PAD, y);
    ctx.lineTo(rightEdge, y);
    ctx.stroke();
  }
  if (normalize) {
    for (const pct of [25, 50, 75]) {
      const y = T_PAD + CHART_H * (1 - pct / 100);
      ctx.beginPath();
      ctx.moveTo(L_PAD, y);
      ctx.lineTo(rightEdge, y);
      ctx.stroke();
    }
  }

  // Initial embed baseline (dashed) at rightToY(1.0) = chartBottom
  const baselineY = rightToY(EMBED_NORM);
  ctx.beginPath();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.moveTo(L_PAD, baselineY);
  ctx.lineTo(rightEdge, baselineY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "italic 9px 'Inter', sans-serif";
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('initial embed', L_PAD + 3, baselineY - 2);

  // ── Bars ────────────────────────────────────────────────────────────────
  for (let l = 0; l < N_LAYERS; l++) {
    const cx = barCenterX(l);
    const bx = cx - BAR_W / 2;

    let ffnH, attnH;
    if (normalize) {
      const total = attn[l] + ffn[l];
      ffnH  = total > 0 ? (ffn[l]  / total) * CHART_H : 0;
      attnH = total > 0 ? (attn[l] / total) * CHART_H : 0;
    } else {
      ffnH  = (ffn[l]  / LEFT_MAX) * CHART_H;
      attnH = (attn[l] / LEFT_MAX) * CHART_H;
    }

    if (showFFN && ffnH > 0) {
      ctx.fillStyle = C.orange;
      ctx.fillRect(bx, chartBottom - ffnH, BAR_W, ffnH);
    }

    if (showAttn && attnH > 0) {
      const base = showFFN ? chartBottom - ffnH : chartBottom;
      ctx.fillStyle = C.accent;
      ctx.fillRect(bx, base - attnH, BAR_W, attnH);
    }
  }

  // ── Left Y-axis ──────────────────────────────────────────────────────────
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L_PAD, T_PAD);
  ctx.lineTo(L_PAD, chartBottom);
  ctx.stroke();

  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const leftTicks = normalize ? [0, 25, 50, 75, 100] : [0, 0.2, 0.4, 0.6];
  for (const v of leftTicks) {
    const y = normalize
      ? T_PAD + CHART_H * (1 - v / 100)
      : leftToY(v);
    ctx.fillStyle = C.muted;
    ctx.fillText(normalize ? `${v}%` : v.toFixed(1), L_PAD - 4, y);
    ctx.strokeStyle = C.borderLt;
    ctx.beginPath();
    ctx.moveTo(L_PAD - 3, y);
    ctx.lineTo(L_PAD, y);
    ctx.stroke();
  }

  // ── Right Y-axis ─────────────────────────────────────────────────────────
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rightEdge, T_PAD);
  ctx.lineTo(rightEdge, chartBottom);
  ctx.stroke();

  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = C.mid;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const v of [1.0, 1.5, 2.0, 2.5]) {
    const y = rightToY(v);
    ctx.fillText(v.toFixed(1), rightEdge + 4, y);
    ctx.strokeStyle = C.borderLt;
    ctx.beginPath();
    ctx.moveTo(rightEdge, y);
    ctx.lineTo(rightEdge + 3, y);
    ctx.stroke();
  }

  // Right Y-axis title (rotated)
  ctx.save();
  ctx.font = "9px 'Inter', sans-serif";
  ctx.fillStyle = C.mid;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(CW - 8, T_PAD + CHART_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('cumulative ‖stream‖', 0, 0);
  ctx.restore();

  // ── X-axis ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L_PAD, chartBottom);
  ctx.lineTo(rightEdge, chartBottom);
  ctx.stroke();

  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let l = 0; l < N_LAYERS; l++) {
    ctx.fillText(`L${l + 1}`, barCenterX(l), chartBottom + 5);
  }

  // ── Cumulative norm line ──────────────────────────────────────────────────
  if (showNorm) {
    const norms = computeNorms(attn, ffn);
    const startX = L_PAD - BAR_W / 2;
    const startY = rightToY(EMBED_NORM);

    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let l = 0; l < N_LAYERS; l++) {
      ctx.lineTo(barCenterX(l), rightToY(norms[l]));
    }
    ctx.stroke();

    // Dots
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(startX, startY, 4, 0, Math.PI * 2);
    ctx.fill();
    for (let l = 0; l < N_LAYERS; l++) {
      ctx.beginPath();
      ctx.arc(barCenterX(l), rightToY(norms[l]), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Legend ────────────────────────────────────────────────────────────────
  const legendItems = [
    { color: C.accent, label: 'Attention', type: 'square' },
    { color: C.orange, label: 'FFN',       type: 'square' },
    { color: C.white,  label: 'Cumulative norm', type: 'line' },
  ];
  ctx.font = "10px 'Inter', sans-serif";
  const legY = T_PAD + 9;
  // Measure total width then right-align inside chart
  const gaps = 8;
  const iconW = 12;
  const totalW = legendItems.reduce((s, item, i) => {
    return s + iconW + 4 + ctx.measureText(item.label).width + (i < legendItems.length - 1 ? gaps : 0);
  }, 0);
  let lx = rightEdge - 4 - totalW;
  for (const item of legendItems) {
    if (item.type === 'square') {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, legY - 5, iconW, iconW);
    } else {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, legY);
      ctx.lineTo(lx + iconW, legY);
      ctx.stroke();
    }
    ctx.fillStyle = C.mid;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, lx + iconW + 4, legY);
    lx += iconW + 4 + ctx.measureText(item.label).width + gaps;
  }
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ResidualStream() {
  const [token,     setToken]     = useState('cat');
  const [showAttn,  setShowAttn]  = useState(true);
  const [showFFN,   setShowFFN]   = useState(true);
  const [showNorm,  setShowNorm]  = useState(true);
  const [normalize, setNormalize] = useState(false);

  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const displayRef = useRef({
    attn: [...STREAM_DATA.cat.attn],
    ffn:  [...STREAM_DATA.cat.ffn],
  });
  // Always-current settings for use inside RAF callbacks
  const settingsRef = useRef({ showAttn: true, showFFN: true, showNorm: true, normalize: false });
  settingsRef.current = { showAttn, showFFN, showNorm, normalize };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(CW * dpr);
    canvas.height = Math.round(CH * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    paintCanvas(ctx, displayRef.current, settingsRef.current);
  }, []); // reads only refs — stable forever

  const startAnim = useCallback((newTok) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = { attn: [...displayRef.current.attn], ffn: [...displayRef.current.ffn] };
    const to   = { attn: [...STREAM_DATA[newTok].attn], ffn: [...STREAM_DATA[newTok].ffn] };
    let t0 = null;

    function step(ts) {
      if (!t0) t0 = ts;
      const t = Math.min((ts - t0) / 300, 1);
      displayRef.current = {
        attn: lerpArr(from.attn, to.attn, t),
        ffn:  lerpArr(from.ffn,  to.ffn,  t),
      };
      draw();
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
  }, [draw]);

  function handleToken(tok) {
    setToken(tok);
    startAnim(tok);
  }

  // Redraw when display settings change
  useEffect(() => { draw(); }, [showAttn, showFFN, showNorm, normalize, draw]);

  // Mount / unmount
  useEffect(() => {
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  // ── Stats from actual (non-animated) token data ──────────────────────────
  const data       = STREAM_DATA[token];
  const norms      = computeNorms(data.attn, data.ffn);
  const attnMaxIdx = argmax(data.attn);
  const ffnMaxIdx  = argmax(data.ffn);
  const totalAttn  = data.attn.reduce((s, v) => s + v, 0);
  const totalFFN   = data.ffn.reduce((s, v) => s + v, 0);
  const finalNorm  = norms[N_LAYERS - 1];
  const growth     = finalNorm - EMBED_NORM;
  const growthPct  = Math.round((growth / EMBED_NORM) * 100);

  const mono = { fontFamily: "'JetBrains Mono', monospace" };

  return (
    <WidgetCard title="Residual Stream — accumulated representations across layers" number="8.3">

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>

        {/* Token tabs */}
        <div>
          <div style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
            Token
          </div>
          <div style={{ display: 'inline-flex', border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
            {TOKENS.map((tok, i) => (
              <div key={tok} style={{ borderRight: i < TOKENS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <TabBtn active={token === tok} onClick={() => handleToken(tok)}>
                  &ldquo;{tok}&rdquo;
                </TabBtn>
              </div>
            ))}
          </div>
        </div>

        {/* Show toggles */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Show
          </span>
          {[
            { label: 'Attention',       val: showAttn,  set: setShowAttn  },
            { label: 'FFN',             val: showFFN,   set: setShowFFN   },
            { label: 'Cumulative norm', val: showNorm,  set: setShowNorm  },
          ].map(({ label, val, set }) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={val}
                onChange={e => set(e.target.checked)}
                style={{ accentColor: C.accent }}
              />
              <span style={{ ...mono, fontSize: '11px', color: C.muted }}>{label}</span>
            </label>
          ))}
        </div>

        {/* Normalize toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={normalize}
            onChange={e => setNormalize(e.target.checked)}
            style={{ accentColor: C.accent }}
          />
          <span style={{ ...mono, fontSize: '11px', color: C.muted }}>Normalize</span>
        </label>
      </div>

      {/* ── Canvas + Stats ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0, background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
          <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
        </div>

        {/* Stats panel */}
        <div style={{
          width: 180,
          flexShrink: 0,
          background: C.bg2,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ ...mono, fontSize: '11px', color: C.accent, marginBottom: '2px' }}>
            &ldquo;{token}&rdquo;
          </div>

          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            color: C.mid,
            fontStyle: 'italic',
            lineHeight: 1.45,
            paddingBottom: '8px',
            borderBottom: `1px solid ${C.border}`,
          }}>
            {data.desc}
          </div>

          <StatRow
            label="Largest attn layer"
            val={`L${attnMaxIdx + 1} (${data.attn[attnMaxIdx].toFixed(2)})`}
          />
          <StatRow
            label="Largest FFN layer"
            val={`L${ffnMaxIdx + 1} (${data.ffn[ffnMaxIdx].toFixed(2)})`}
          />
          <StatRow label="Total attn"      val={totalAttn.toFixed(2)} />
          <StatRow label="Total FFN"       val={totalFFN.toFixed(2)} />
          <StatRow label="Attn / FFN ratio" val={(totalAttn / totalFFN).toFixed(2)} />
          <StatRow label="Final stream norm" val={finalNorm.toFixed(3)} />
          <StatRow
            label="Growth from embed"
            val={`+${growth.toFixed(2)} (${growthPct}%)`}
            color={C.mid}
          />
        </div>
      </div>
    </WidgetCard>
  );
}
