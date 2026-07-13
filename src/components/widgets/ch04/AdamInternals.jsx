import { useRef, useState, useEffect, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const ALPHA   = 0.001;
const EPS     = 1e-8;
const N       = 200;
const SUB_H   = 70;
const GAP     = 8;
const CANVAS_H = 3 * SUB_H + 2 * GAP; // 226px
const PAD_L   = 34;
const PAD_R   = 8;
const PAD_T   = 8;
const PAD_B   = 8;

const C = {
  accent:   '#2dd4bf',
  red:      '#f87171',
  orange:   '#fb923c',
  purple:   '#a78bfa',
  codeBg:   '#0a0a0a',
  border:   '#242424',
  borderLt: '#2e2e2e',
  textMid:  '#888888',
  textMute: '#555555',
};

const PATTERNS = ['Constant', 'Oscillating', 'Sparse'];
const mono = { fontFamily: "'JetBrains Mono', monospace" };

function makeGradients(pattern) {
  const g = new Float64Array(N + 1);
  for (let t = 1; t <= N; t++) {
    if (pattern === 'Constant')         g[t] = 0.5;
    else if (pattern === 'Oscillating') g[t] = 0.5 * Math.sin(t * 0.3);
    else                                g[t] = t % 10 === 0 ? 2.0 : 0.0;
  }
  return g;
}

function computeAdam(g, b1, b2) {
  const m      = new Float64Array(N + 1);
  const v      = new Float64Array(N + 1);
  const mh     = new Float64Array(N + 1);
  const vh     = new Float64Array(N + 1);
  const elr    = new Float64Array(N + 1);
  const vCorr  = new Float64Array(N + 1); // bias-correction factor 1/(1-b2^t) applied to v_t
  let b1t = 1, b2t = 1;
  for (let t = 1; t <= N; t++) {
    b1t *= b1; b2t *= b2;
    m[t]     = b1 * m[t - 1] + (1 - b1) * g[t];
    v[t]     = b2 * v[t - 1] + (1 - b2) * g[t] * g[t];
    mh[t]    = m[t] / (1 - b1t);
    vh[t]    = v[t] / (1 - b2t);
    vCorr[t] = 1 / (1 - b2t);
    elr[t]   = ALPHA / (Math.sqrt(Math.max(0, vh[t])) + EPS);
  }
  return { m, v, mh, vh, elr, vCorr };
}

function fmt(x, d = 4) {
  if (!isFinite(x) || isNaN(x)) return '—';
  return x.toFixed(d);
}

function mapY(val, lo, hi, y0, h) {
  if (hi <= lo) return y0 + h / 2;
  return y0 + PAD_T + (1 - (val - lo) / (hi - lo)) * (h - PAD_T - PAD_B);
}

function drawLinePath(ctx, arr, lo, hi, y0, plotW) {
  ctx.beginPath();
  const xStep = plotW / N;
  for (let t = 1; t <= N; t++) {
    const x = PAD_L + (t - 0.5) * xStep;
    const y = mapY(arr[t], lo, hi, y0, SUB_H);
    t === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export default function AdamInternals({ tryThis }) {
  const canvasRef = useRef(null);
  const [step,    setStep]    = useState(50);
  const [beta1,   setBeta1]   = useState(0.9);
  const [beta2,   setBeta2]   = useState(0.999);
  const [pattern, setPattern] = useState('Constant');

  const gradients = useMemo(() => makeGradients(pattern), [pattern]);
  const adam      = useMemo(() => computeAdam(gradients, beta1, beta2), [gradients, beta1, beta2]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const CW   = rect.width;
    if (CW === 0) return;
    canvas.width  = CW * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const plotW = CW - PAD_L - PAD_R;
    const barW  = plotW / N;

    // Background
    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, 0, CW, CANVAS_H);

    // ── Sub-plot 1: gradient bars ────────────────────────────────────────
    {
      const y0 = 0;
      let gMin = 0, gMax = 0;
      for (let t = 1; t <= N; t++) {
        if (gradients[t] < gMin) gMin = gradients[t];
        if (gradients[t] > gMax) gMax = gradients[t];
      }
      const absMax = Math.max(Math.abs(gMin), Math.abs(gMax), 0.01);
      if (gMin < 0) { gMin = -absMax; gMax = absMax; } else { gMin = 0; }

      const zY = mapY(0, gMin, gMax, y0, SUB_H);

      ctx.strokeStyle = C.borderLt;
      ctx.lineWidth   = 0.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(PAD_L, zY); ctx.lineTo(PAD_L + plotW, zY);
      ctx.stroke();

      for (let t = 1; t <= N; t++) {
        const gv = gradients[t];
        const x  = PAD_L + (t - 1) * barW;
        const bw = Math.max(0.8, barW - 0.5);
        const y  = mapY(gv, gMin, gMax, y0, SUB_H);
        ctx.fillStyle = gv >= 0 ? C.accent : C.red;
        if (gv >= 0) ctx.fillRect(x, y, bw, Math.max(1, zY - y));
        else         ctx.fillRect(x, zY, bw, Math.max(1, y - zY));
      }

      ctx.font      = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = C.accent;
      ctx.textAlign = 'right';
      ctx.fillText('gₜ', PAD_L - 4, y0 + SUB_H / 2 + 4);
    }

    // ── Sub-plot 2: mₜ (dashed) and m̂ₜ (solid) ──────────────────────────
    {
      const y0 = SUB_H + GAP;
      let lo = Infinity, hi = -Infinity;
      for (let t = 1; t <= N; t++) {
        lo = Math.min(lo, adam.m[t], adam.mh[t]);
        hi = Math.max(hi, adam.m[t], adam.mh[t]);
      }
      if (!isFinite(lo)) lo = -0.1;
      if (!isFinite(hi)) hi =  0.1;
      if (hi - lo < 1e-10) { lo -= 0.1; hi += 0.1; }

      if (lo < 0 && hi > 0) {
        const zy = mapY(0, lo, hi, y0, SUB_H);
        ctx.strokeStyle = C.borderLt;
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(PAD_L, zy); ctx.lineTo(PAD_L + plotW, zy);
        ctx.stroke();
      }

      ctx.strokeStyle = C.orange;
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      drawLinePath(ctx, adam.m, lo, hi, y0, plotW);

      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      drawLinePath(ctx, adam.mh, lo, hi, y0, plotW);

      ctx.font      = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = C.orange;
      ctx.textAlign = 'right';
      ctx.fillText('m̂ₜ', PAD_L - 4, y0 + SUB_H / 2 + 4);
    }

    // ── Sub-plot 3: vₜ (dashed) and v̂ₜ (solid) ──────────────────────────
    {
      const y0 = 2 * (SUB_H + GAP);
      let hi = -Infinity;
      for (let t = 1; t <= N; t++) {
        hi = Math.max(hi, adam.v[t], adam.vh[t]);
      }
      if (!isFinite(hi) || hi < 1e-10) hi = 1;
      const lo = 0;

      ctx.strokeStyle = C.purple;
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      drawLinePath(ctx, adam.v, lo, hi, y0, plotW);

      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      drawLinePath(ctx, adam.vh, lo, hi, y0, plotW);

      ctx.font      = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = C.purple;
      ctx.textAlign = 'right';
      ctx.fillText('v̂ₜ', PAD_L - 4, y0 + SUB_H / 2 + 4);
    }

    // ── Vertical indicator at current step ───────────────────────────────
    {
      const indX = PAD_L + (step - 0.5) * barW;
      ctx.strokeStyle  = C.accent;
      ctx.lineWidth    = 1;
      ctx.globalAlpha  = 0.7;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(indX, 0);
      ctx.lineTo(indX, CANVAS_H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha  = 1;
    }

  }, [gradients, adam, step]);

  const t     = step;
  const gv    = gradients[t];
  const mt    = adam.m[t];
  const mht   = adam.mh[t];
  const vt    = adam.v[t];
  const vht   = adam.vh[t];
  const elr   = adam.elr[t];
  const vcorr = adam.vCorr[t]; // v̂ₜ / vₜ = 1 / (1 - β₂ᵗ) — how much bias-correction is still inflating the second moment at this step

  const stats = [
    { key: 'gₜ',        val: fmt(gv,  4), color: C.accent  },
    { key: 'mₜ',        val: fmt(mt,  5), color: C.orange  },
    { key: 'm̂ₜ',       val: fmt(mht, 5), color: C.orange  },
    { key: 'vₜ',        val: fmt(vt,  6), color: C.purple  },
    { key: 'v̂ₜ',       val: fmt(vht, 6), color: C.purple  },
    { key: 'v̂ₜ / vₜ',  val: `${fmt(vcorr, 2)}×`, color: C.purple },
    { key: 'Eff. LR',   val: fmt(elr, 5), color: C.textMid },
  ];

  const sliders = [
    { label: 'step t', value: step,  min: 1,   max: N,      sliderStep: 1,      onChange: v => setStep(v),   display: String(step)         },
    { label: 'β₁',    value: beta1, min: 0.5,  max: 0.999,  sliderStep: 0.001,  onChange: v => setBeta1(v),  display: beta1.toFixed(3)      },
    { label: 'β₂',    value: beta2, min: 0.9,  max: 0.9999, sliderStep: 0.0001, onChange: v => setBeta2(v),  display: beta2.toFixed(4)      },
  ];

  return (
    <WidgetCard title="Adam Internals — moment estimation step by step" number="4.5" tryThis={tryThis}>
      {/* Canvas + stat panel */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, borderRadius: '6px', overflow: 'hidden', background: C.codeBg }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: `${CANVAS_H}px` }}
          />
        </div>

        <div style={{
          minWidth: '136px',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
          flexShrink: 0,
        }}>
          {stats.map(({ key, val, color }) => (
            <div key={key}>
              <div style={{
                ...mono,
                fontSize: '9px',
                color: C.textMute,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '1px',
              }}>
                {key}
              </div>
              <div style={{ ...mono, fontSize: '13px', color }}>
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {/* Pattern tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ ...mono, fontSize: '11px', color: C.textMute, minWidth: '98px' }}>
            gradient pattern
          </span>
          <div style={{ display: 'flex', gap: '5px' }}>
            {PATTERNS.map(p => (
              <button
                key={p}
                onClick={() => setPattern(p)}
                style={{
                  padding: '3px 11px',
                  borderRadius: '4px',
                  border: `1px solid ${p === pattern ? C.accent : C.border}`,
                  background: p === pattern ? 'var(--accent-dim)' : 'var(--bg4)',
                  color: p === pattern ? C.accent : C.textMid,
                  ...mono,
                  fontSize: '11px',
                  cursor: 'pointer',
                  letterSpacing: '0.03em',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        {sliders.map(({ label, value, min, max, sliderStep, onChange, display }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ ...mono, fontSize: '11px', color: C.textMute, minWidth: '98px' }}>
              {label}
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={sliderStep}
              value={value}
              onChange={e => onChange(parseFloat(e.target.value))}
              style={{
                flex: 1,
                WebkitAppearance: 'none',
                height: '2px',
                background: 'var(--border-lt)',
                borderRadius: '2px',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
            <span style={{
              ...mono,
              fontSize: '11px',
              color: C.textMid,
              minWidth: '48px',
              textAlign: 'right',
            }}>
              {display}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
