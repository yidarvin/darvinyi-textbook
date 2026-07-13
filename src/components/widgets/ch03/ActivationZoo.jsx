import { useEffect, useRef, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Domain ───────────────────────────────────────────────────────────────────
const N = 200;
const X_MIN = -5, X_MAX = 5;
const Y_MIN = -2, Y_MAX = 5;
const XS = Array.from({ length: N }, (_, i) => X_MIN + (i / (N - 1)) * (X_MAX - X_MIN));
const MONO = "'JetBrains Mono', monospace";
const H_DERIV = 0.001;

const FN_DEFS = [
  { id: 'sigmoid',   name: 'Sigmoid',    color: '#f87171' },
  { id: 'tanh',      name: 'Tanh',       color: '#fb923c' },
  { id: 'relu',      name: 'ReLU',       color: '#2dd4bf' },
  { id: 'leakyRelu', name: 'Leaky ReLU', color: '#34d399' },
  { id: 'elu',       name: 'ELU',        color: '#a78bfa' },
  { id: 'gelu',      name: 'GELU',       color: '#38bdf8' },
  { id: 'swish',     name: 'Swish',      color: '#fbbf24' },
  { id: 'mish',      name: 'Mish',       color: '#f472b6' },
];

function makeFn(id, alpha) {
  switch (id) {
    case 'sigmoid':   return x => 1 / (1 + Math.exp(-x));
    case 'tanh':      return x => Math.tanh(x);
    case 'relu':      return x => Math.max(0, x);
    case 'leakyRelu': return x => x >= 0 ? x : alpha * x;
    case 'elu':       return x => x >= 0 ? x : alpha * (Math.exp(x) - 1);
    case 'gelu':      return x => x * 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
    case 'swish':     return x => x / (1 + Math.exp(-x));
    case 'mish':      return x => x * Math.tanh(Math.log(1 + Math.exp(x)));
    default:          return x => x;
  }
}

function nd(f, x) {
  return (f(x + H_DERIV) - f(x - H_DERIV)) / (2 * H_DERIV);
}

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// Dead-zone tolerance for the derivative sign-change check below. This only
// needs to absorb finite-difference/float noise (which is ~1e-9 or smaller
// for H_DERIV=0.001 on these smooth functions) -- it must NOT be large enough
// to swallow real sign changes. Swish's derivative crosses zero near x~-1.28
// with values as small as ~-0.0006 just before the crossing, so anything
// approaching 1e-3 (the old tolerance) is unsafe.
const MONOTONIC_EPS = 1e-6;

function isMonotonic(f) {
  let prev = nd(f, XS[0]);
  for (let i = 1; i < XS.length; i++) {
    const d = nd(f, XS[i]);
    if (prev > MONOTONIC_EPS && d < -MONOTONIC_EPS) return false;
    if (prev < -MONOTONIC_EPS && d > MONOTONIC_EPS) return false;
    prev = d;
  }
  return true;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ActivationZoo({ tryThis }) {
  const [active, setActive] = useState(new Set(['relu', 'gelu']));
  const [showDeriv, setShowDeriv] = useState(false);
  const [showSat, setShowSat] = useState(false);
  const [leakyAlpha, setLeakyAlpha] = useState(0.1);
  const [eluAlpha, setEluAlpha] = useState(1.0);
  const canvasRef = useRef(null);

  function toggle(id) {
    setActive(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const activeFns = FN_DEFS
    .filter(d => active.has(d.id))
    .map(d => ({
      ...d,
      fn: makeFn(d.id, d.id === 'elu' ? eluAlpha : d.id === 'leakyRelu' ? leakyAlpha : undefined),
    }));

  const firstFn = activeFns[0] ?? null;

  const stats = firstFn ? (() => {
    const f = firstFn.fn;
    const ys = XS.map(x => f(x));
    const gradAt0 = nd(f, 0);
    const gradAt3 = nd(f, 3);
    const mono = isMonotonic(f);
    return {
      yMin: Math.min(...ys),
      yMax: Math.max(...ys),
      gradAt0,
      gradAt3,
      mono,
    };
  })() : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || 500;
    const cssH = rect.height || 240;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = cssW, H = cssH;
    const PL = 36, PR = 10, PT = 10, PB = 36;
    const plotW = W - PL - PR;
    const plotH = H - PT - PB;

    const xToC = x => PL + (x - X_MIN) / (X_MAX - X_MIN) * plotW;
    const yToC = y => PT + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // ── Saturation zones (before clip so they don't bleed into margins) ──
    if (showSat && activeFns.length > 0) {
      const satMask = new Uint8Array(N);
      for (const { fn } of activeFns) {
        for (let i = 0; i < N; i++) {
          if (Math.abs(nd(fn, XS[i])) < 0.05) satMask[i] = 1;
        }
      }
      ctx.fillStyle = 'rgba(248,113,113,0.08)';
      let inZone = false, zoneX = 0;
      for (let i = 0; i < N; i++) {
        if (satMask[i] && !inZone) { inZone = true; zoneX = xToC(XS[i]); }
        if (!satMask[i] && inZone) {
          ctx.fillRect(zoneX, PT, xToC(XS[i]) - zoneX, plotH);
          inZone = false;
        }
      }
      if (inZone) ctx.fillRect(zoneX, PT, xToC(XS[N - 1]) - zoneX, plotH);
    }

    // ── Grid lines at y = -2, -1, 1, 2 ──────────────────────────────────
    ctx.font = `9px ${MONO}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const gy of [-2, -1, 1, 2]) {
      const cy = yToC(gy);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(PL, cy); ctx.lineTo(PL + plotW, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText(String(gy), PL - 5, cy);
    }

    // ── X-axis at y=0 ────────────────────────────────────────────────────
    {
      const cy = yToC(0);
      ctx.strokeStyle = '#242424';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(PL, cy); ctx.lineTo(PL + plotW, cy); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText('0', PL - 5, cy);
    }

    // ── Y-axis at x=0 ────────────────────────────────────────────────────
    {
      const cx = xToC(0);
      ctx.strokeStyle = '#242424';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, PT); ctx.lineTo(cx, PT + plotH); ctx.stroke();
    }

    // ── X-axis labels ─────────────────────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (const gx of [-4, -2, 0, 2, 4]) {
      ctx.fillText(String(gx), xToC(gx), PT + plotH + 3);
    }

    // ── Clip to plot area for curves ──────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(PL, PT, plotW, plotH);
    ctx.clip();

    for (const { fn, color } of activeFns) {
      // Function curve
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const cx = xToC(XS[i]);
        const cy = yToC(fn(XS[i]));
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // Derivative curve
      if (showDeriv) {
        ctx.strokeStyle = hexToRgba(color, 0.6);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const cx = xToC(XS[i]);
          const cy = yToC(nd(fn, XS[i]));
          i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();

    // ── Legend ────────────────────────────────────────────────────────────
    if (activeFns.length > 0) {
      ctx.font = `9.5px ${MONO}`;
      ctx.textBaseline = 'middle';
      const row1 = activeFns.slice(0, Math.ceil(activeFns.length / 2));
      const row2 = activeFns.slice(Math.ceil(activeFns.length / 2));
      const rows = row2.length > 0 ? [row1, row2] : [row1];
      const rowH = 14;
      const legendTop = H - PB + 4;

      rows.forEach((row, ri) => {
        const y = legendTop + ri * rowH + rowH / 2;
        const itemW = plotW / row.length;
        row.forEach(({ name, color }, ci) => {
          const x0 = PL + ci * itemW;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x0 + 5, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.textAlign = 'left';
          ctx.fillText(name, x0 + 13, y);
        });
      });
    }
  }, [active, showDeriv, showSat, leakyAlpha, eluAlpha]); // eslint-disable-line react-hooks/exhaustive-deps

  const leakyOn = active.has('leakyRelu');
  const eluOn = active.has('elu');

  return (
    <WidgetCard title="Activation Functions — compare all 8" number="3.3" tryThis={tryThis}>

      {/* Canvas + Stats */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
        <canvas
          ref={canvasRef}
          style={{
            flex: 1, height: '240px', display: 'block',
            background: '#0a0a0a', borderRadius: '6px',
            border: '1px solid var(--border)',
          }}
        />

        <div style={{
          width: '128px', flexShrink: 0,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '14px 14px',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          {stats ? (
            <>
              <div>
                <div style={labelStyle}>output range</div>
                <div style={{ fontFamily: MONO, fontSize: '12px', color: 'var(--accent)', lineHeight: 1.4 }}>
                  {stats.yMin.toFixed(2)}
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}> – </span>
                  {stats.yMax.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={labelStyle}>grad at x=0</div>
                <div style={{ fontFamily: MONO, fontSize: '20px', color: 'var(--accent)', lineHeight: 1.1 }}>
                  {stats.gradAt0.toFixed(3)}
                </div>
              </div>
              <div>
                <div style={labelStyle}>grad at x=3</div>
                <div style={{
                  fontFamily: MONO, fontSize: '20px', lineHeight: 1.1,
                  color: Math.abs(stats.gradAt3) < 0.05 ? '#f87171' : 'var(--accent)',
                }}>
                  {stats.gradAt3.toFixed(3)}
                </div>
              </div>
              <div>
                <div style={labelStyle}>monotonic</div>
                <div style={{
                  fontFamily: MONO, fontSize: '13px', fontWeight: 600,
                  color: stats.mono ? '#34d399' : '#fb923c',
                }}>
                  {stats.mono ? 'yes' : 'no'}
                </div>
              </div>
              <div style={{ marginTop: 'auto', fontFamily: MONO, fontSize: '9px', color: firstFn?.color, opacity: 0.65 }}>
                ↑ {firstFn?.name}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '40px' }}>
              select a function
            </div>
          )}
        </div>
      </div>

      {/* Toggle buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        marginBottom: '14px',
      }}>
        {FN_DEFS.map(({ id, name, color }) => {
          const on = active.has(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              style={{
                fontFamily: MONO,
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '20px',
                border: `1px solid ${on ? color : 'var(--border)'}`,
                background: on ? hexToRgba(color, 0.2) : 'var(--bg3)',
                color: on ? color : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.12s',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showDeriv} onChange={e => setShowDeriv(e.target.checked)} />
          <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)' }}>show derivative</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showSat} onChange={e => setShowSat(e.target.checked)} />
          <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)' }}>show saturation zones</span>
        </label>

        {leakyOn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)' }}>leaky α</span>
            <input
              type="range" min={0.01} max={0.5} step={0.01} value={leakyAlpha}
              onChange={e => setLeakyAlpha(+e.target.value)}
              style={{ width: '80px' }}
            />
            <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--accent)', minWidth: '30px' }}>
              {leakyAlpha.toFixed(2)}
            </span>
          </div>
        )}

        {eluOn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)' }}>ELU α</span>
            <input
              type="range" min={0.1} max={2.0} step={0.1} value={eluAlpha}
              onChange={e => setEluAlpha(+e.target.value)}
              style={{ width: '80px' }}
            />
            <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--accent)', minWidth: '30px' }}>
              {eluAlpha.toFixed(1)}
            </span>
          </div>
        )}
      </div>

    </WidgetCard>
  );
}

const labelStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '9px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '3px',
};
