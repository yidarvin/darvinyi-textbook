import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO = "'JetBrains Mono', monospace";
const CLR = {
  accent:   '#2dd4bf',
  green:    '#34d399',
  red:      '#f87171',
  orange:   '#fb923c',
  math:     '#fbbf24',
  muted:    '#555555',
  borderLt: '#2e2e2e',
};

const PAD = { left: 44, right: 16, top: 20, bottom: 36 };
const X_MAX = 2.5;
const N = 200;

const Lu  = (r, A)      => r * A;
const Lc  = (r, eps, A) => Math.max(1 - eps, Math.min(1 + eps, r)) * A;
const Lpp = (r, eps, A) => Math.min(Lu(r, A), Lc(r, eps, A));

// ── component ─────────────────────────────────────────────────────────────────

export default function PPOClipping() {
  const [eps, setEps]           = useState(0.20);
  const [A, setA]               = useState(1.0);
  const [rCurrent, setRCurrent] = useState(1.0);
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const plotW = width  - PAD.left - PAD.right;
    const plotH = height - PAD.top  - PAD.bottom;

    // ── data ──────────────────────────────────────────────────────────────────
    const xs       = Array.from({ length: N }, (_, i) => (i / (N - 1)) * X_MAX);
    const unclipYs = xs.map(r => Lu(r, A));
    const clipYs   = xs.map(r => Lc(r, eps, A));
    const ppoYs    = xs.map(r => Lpp(r, eps, A));

    // ── Y scale ───────────────────────────────────────────────────────────────
    let yMax, yMin;
    if (Math.abs(A) < 0.001) {
      yMax = 0.5; yMin = -0.5;
    } else {
      const rawMax = Math.max(...ppoYs, ...unclipYs);
      const rawMin = Math.min(...ppoYs, ...unclipYs);
      yMax = rawMax > 0 ? rawMax * 1.1 : 0.1;
      yMin = rawMin < 0 ? rawMin * 1.1 : -0.1;
    }

    const xToC = (x) => PAD.left + (x / X_MAX) * plotW;
    const yToC = (y) => PAD.top  + (1 - (y - yMin) / (yMax - yMin)) * plotH;
    const yZero = yToC(0);

    // ── background ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // ── clipped drawing region ────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD.left, PAD.top, plotW, plotH);
    ctx.clip();

    // clip region shading
    if (Math.abs(A) > 0.001) {
      ctx.fillStyle = 'rgba(248,113,113,0.06)';
      if (A > 0) {
        const xS = xToC(1 + eps);
        ctx.fillRect(xS, PAD.top, PAD.left + plotW - xS, plotH);
      } else {
        const xE = xToC(Math.max(0, 1 - eps));
        ctx.fillRect(PAD.left, PAD.top, xE - PAD.left, plotH);
      }
    }

    // L=0 horizontal
    if (yZero >= PAD.top && yZero <= PAD.top + plotH) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(PAD.left, yZero);
      ctx.lineTo(PAD.left + plotW, yZero);
      ctx.stroke();
    }

    // r=1 reference
    const xR1 = xToC(1);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xR1, PAD.top);
    ctx.lineTo(xR1, PAD.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // clip boundary verticals
    [1 - eps, 1 + eps].forEach(v => {
      if (v <= 0 || v >= X_MAX) return;
      const xV = xToC(v);
      ctx.strokeStyle = CLR.math;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xV, PAD.top);
      ctx.lineTo(xV, PAD.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // three curves
    const strokeLine = (ys, color, lw, dash = []) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.setLineDash(dash);
      ctx.beginPath();
      xs.forEach((x, i) => {
        if (i === 0) ctx.moveTo(xToC(x), yToC(ys[i]));
        else ctx.lineTo(xToC(x), yToC(ys[i]));
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };
    strokeLine(unclipYs, CLR.borderLt, 1.5, [6, 3]);
    strokeLine(clipYs,   CLR.orange,   1.5);
    strokeLine(ppoYs,    CLR.accent,   2.5);

    // current r marker
    const xR  = xToC(rCurrent);
    const yPP = yToC(Lpp(rCurrent, eps, A));
    ctx.strokeStyle = CLR.accent;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(xR, PAD.top);
    ctx.lineTo(xR, PAD.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(xR, yPP, 4, 0, Math.PI * 2);
    ctx.fillStyle = CLR.accent;
    ctx.fill();
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore(); // end clip

    // ── labels (drawn unclipped, on top) ─────────────────────────────────────

    ctx.font = `9px ${MONO}`;

    // clip boundary labels — stagger when close
    const xLo = xToC(1 - eps), xHi = xToC(1 + eps);
    const stagger = (xHi - xLo) < 58;
    ctx.fillStyle = CLR.math;
    ctx.textAlign = 'center';
    if (1 - eps > 0.01)  ctx.fillText(`1-ε=${(1-eps).toFixed(2)}`, xLo, PAD.top + 9);
    if (1 + eps < X_MAX) ctx.fillText(`1+ε=${(1+eps).toFixed(2)}`, xHi, stagger ? PAD.top + 19 : PAD.top + 9);

    // r=1 label
    ctx.font = `8px ${MONO}`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center';
    const r1YOff = (Math.abs(xR1 - xLo) < 28 || Math.abs(xR1 - xHi) < 28) ? 10 : 0;
    ctx.fillText('r=1', xR1, PAD.top + 9 + r1YOff);

    // unclipped label
    ctx.font = `9px ${MONO}`;
    {
      const rL = 2.2;
      const yL = yToC(Lu(rL, A));
      if (yL > PAD.top + 4 && yL < PAD.top + plotH - 2) {
        ctx.fillStyle = CLR.muted;
        ctx.textAlign = 'right';
        ctx.fillText('r·A (unclipped)', PAD.left + plotW - 2, yL + (A >= 0 ? -5 : 10));
      }
    }

    // clipped label
    {
      const rL = A >= 0 ? 1.7 : 0.35;
      const yL = yToC(Lc(rL, eps, A));
      if (yL > PAD.top + 4 && yL < PAD.top + plotH - 2) {
        ctx.fillStyle = CLR.orange;
        ctx.textAlign = A >= 0 ? 'left' : 'right';
        ctx.fillText('clip(r)·A', xToC(rL) + (A >= 0 ? 4 : -4), yL - 5);
      }
    }

    // PPO label with arrow
    {
      const rL = A >= 0
        ? Math.min(2.0, 1 + eps + 0.5)
        : Math.max(0.22, 1 - eps - 0.3);
      const yPPOlbl = yToC(Lpp(rL, eps, A));
      const yOff = A >= 0 ? -22 : 22;
      const yLabel = yPPOlbl + yOff;
      if (yLabel > PAD.top + 4 && yLabel < PAD.top + plotH - 4) {
        ctx.strokeStyle = CLR.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xToC(rL), yPPOlbl + (A >= 0 ? -4 : 4));
        ctx.lineTo(xToC(rL), yLabel + (A >= 0 ? 3 : -3));
        ctx.stroke();
        ctx.fillStyle = CLR.accent;
        ctx.textAlign = 'center';
        ctx.fillText('L^CLIP (PPO)', xToC(rL), yLabel);
      }
    }

    // gradient-zeroed annotation
    if (Math.abs(A) > 0.001) {
      ctx.font = `8px ${MONO}`;
      ctx.fillStyle = 'rgba(248,113,113,0.6)';
      if (A > 0 && 1 + eps < X_MAX - 0.1) {
        const xA = xToC(1 + eps + 0.3);
        if (xA + 54 < PAD.left + plotW) {
          ctx.textAlign = 'left';
          ctx.fillText('gradient', xA, PAD.top + plotH * 0.4);
          ctx.fillText('zeroed',   xA, PAD.top + plotH * 0.4 + 11);
        }
      } else if (A < 0 && 1 - eps > 0.12) {
        const xA = xToC((1 - eps) * 0.45);
        if (xA > PAD.left + 2) {
          ctx.textAlign = 'center';
          ctx.fillText('gradient', xA, PAD.top + plotH * 0.4);
          ctx.fillText('zeroed',   xA, PAD.top + plotH * 0.4 + 11);
        }
      }
    }

    // ── axes ──────────────────────────────────────────────────────────────────
    ctx.setLineDash([]);

    ctx.strokeStyle = CLR.muted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top + plotH);
    ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
    ctx.stroke();

    ctx.font = `9px ${MONO}`;
    ctx.fillStyle = CLR.muted;
    ctx.textAlign = 'center';
    [0, 0.5, 1.0, 1.5, 2.0, 2.5].forEach(v => {
      const x = xToC(v);
      ctx.fillText(v.toFixed(1), x, PAD.top + plotH + 14);
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = CLR.muted;
      ctx.beginPath();
      ctx.moveTo(x, PAD.top + plotH);
      ctx.lineTo(x, PAD.top + plotH + 4);
      ctx.stroke();
    });

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + plotH);
    ctx.stroke();

    ctx.textAlign = 'right';
    for (let i = 0; i <= 3; i++) {
      const v = yMin + (i / 3) * (yMax - yMin);
      const y = yToC(v);
      if (y < PAD.top - 2 || y > PAD.top + plotH + 2) continue;
      ctx.fillText(v.toFixed(1), PAD.left - 4, y + 3);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left - 3, y);
      ctx.stroke();
    }

  }, [eps, A, rCurrent]);

  useEffect(() => { draw(); }, [draw]);

  // ── computed stats ─────────────────────────────────────────────────────────
  const lUnclip = Lu(rCurrent, A);
  const lClip   = Lc(rCurrent, eps, A);
  const lPPO    = Lpp(rCurrent, eps, A);

  const dr   = 0.001;
  const rS   = Math.max(dr * 2, Math.min(X_MAX - dr * 2, rCurrent));
  const grad = (Lpp(rS + dr, eps, A) - Lpp(rS - dr, eps, A)) / (2 * dr);

  const inTrust = rCurrent >= 1 - eps && rCurrent <= 1 + eps;
  let statusMsg, statusColor;
  if (inTrust) {
    statusMsg = 'within trust region — gradient active';
    statusColor = CLR.accent;
  } else if (rCurrent > 1 + eps && A > 0) {
    statusMsg = 'outside — gradient zeroed (too aggressive)';
    statusColor = CLR.red;
  } else if (rCurrent < 1 - eps && A < 0) {
    statusMsg = 'outside — gradient zeroed (too conservative)';
    statusColor = CLR.red;
  } else {
    statusMsg = 'outside clip — no additional penalty';
    statusColor = CLR.orange;
  }

  const AColor = A > 0 ? CLR.green : A < 0 ? CLR.red : CLR.muted;
  const mono   = { fontFamily: MONO };

  // advantage diagram: two panels side-by-side in a single SVG
  // viewBox "0 0 280 68" — left panel [0,130], divider, right panel [150,280]
  const rToL = r => 10  + (r - 0.5) * 108;  // left panel x
  const rToR = r => 160 + (r - 0.5) * 108;  // right panel x
  const midL  = rToL(1);
  const midR  = rToR(1);
  const wallG = rToL(Math.min(1 + eps, 1.49));
  const wallR = rToR(Math.max(1 - eps, 0.51));

  return (
    <WidgetCard title="PPO Clipping — constrained policy updates" number="16.4">

      {/* full-width canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '240px',
                 borderRadius: '4px', background: '#0a0a0a', marginBottom: '10px' }}
      />

      {/* bottom row: trust-region diagram  +  controls / stats */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* left: trust-region diagram */}
        <div style={{ flex: '0 0 auto', width: '45%', background: '#0a0a0a',
                      borderRadius: '4px', border: '1px solid var(--border)',
                      padding: '10px 12px' }}>
          <div style={{ ...mono, fontSize: '8px', color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        marginBottom: '6px' }}>
            Trust Region
          </div>

          <svg width="100%" viewBox="0 0 280 70" style={{ display: 'block' }}>
            <defs>
              <marker id="ppo-ag" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <path d="M0 0L6 2L0 4z" fill={CLR.green} />
              </marker>
              <marker id="ppo-ar" markerWidth="6" markerHeight="4" refX="1" refY="2" orient="auto">
                <path d="M6 0L0 2L6 4z" fill={CLR.red} />
              </marker>
            </defs>

            {/* panel separator */}
            <line x1="140" y1="4" x2="140" y2="66" stroke="#1e1e1e" strokeWidth="1" />

            {/* ── LEFT: A > 0 ── */}
            <text x={midL} y="12" textAnchor="middle" fill={CLR.green}
                  fontSize="9" fontFamily={MONO} fontWeight="500">A &gt; 0</text>
            <line x1="10"  y1="44" x2="128" y2="44" stroke="#2e2e2e" strokeWidth="1" />
            <line x1={midL} y1="39" x2={midL} y2="49" stroke="#555" strokeWidth="1" />
            <text x={midL} y="60" textAnchor="middle" fill="#555" fontSize="7" fontFamily={MONO}>r=1</text>
            {wallG - midL > 12 && (
              <line x1={midL + 3} y1="32" x2={wallG - 5} y2="32"
                    stroke={CLR.green} strokeWidth="1.5" markerEnd="url(#ppo-ag)" />
            )}
            <text x={Math.min((midL + wallG) / 2, 122)} y="26"
                  textAnchor="middle" fill={CLR.green} fontSize="7.5" fontFamily={MONO}>
              increase r
            </text>
            <line x1={wallG} y1="14" x2={wallG} y2="54" stroke={CLR.math} strokeWidth="2" />
            {[18, 26, 34, 44].map(y => (
              <line key={y} x1={wallG} y1={y}
                    x2={Math.min(wallG + 6, 136)} y2={y - 5}
                    stroke={CLR.math} strokeWidth="1" />
            ))}
            <text x={wallG > 112 ? wallG - 2 : wallG + 2} y="10"
                  textAnchor={wallG > 112 ? 'end' : 'start'}
                  fill={CLR.math} fontSize="7.5" fontFamily={MONO}>
              {(1 + eps).toFixed(2)}
            </text>

            {/* ── RIGHT: A < 0 ── */}
            <text x={midR} y="12" textAnchor="middle" fill={CLR.red}
                  fontSize="9" fontFamily={MONO} fontWeight="500">A &lt; 0</text>
            <line x1="152" y1="44" x2="270" y2="44" stroke="#2e2e2e" strokeWidth="1" />
            <line x1={midR} y1="39" x2={midR} y2="49" stroke="#555" strokeWidth="1" />
            <text x={midR} y="60" textAnchor="middle" fill="#555" fontSize="7" fontFamily={MONO}>r=1</text>
            {midR - wallR > 12 && (
              <line x1={midR - 3} y1="32" x2={wallR + 5} y2="32"
                    stroke={CLR.red} strokeWidth="1.5" markerEnd="url(#ppo-ar)" />
            )}
            <text x={Math.max((midR + wallR) / 2, 158)} y="26"
                  textAnchor="middle" fill={CLR.red} fontSize="7.5" fontFamily={MONO}>
              decrease r
            </text>
            <line x1={wallR} y1="14" x2={wallR} y2="54" stroke={CLR.math} strokeWidth="2" />
            {[18, 26, 34, 44].map(y => (
              <line key={y} x1={Math.max(wallR - 6, 152)} y1={y - 5}
                    x2={wallR} y2={y} stroke={CLR.math} strokeWidth="1" />
            ))}
            <text x={wallR < 170 ? wallR + 2 : wallR - 2} y="10"
                  textAnchor={wallR < 170 ? 'start' : 'end'}
                  fill={CLR.math} fontSize="7.5" fontFamily={MONO}>
              {(1 - eps).toFixed(2)}
            </text>

            {/* shared note */}
            <text x="140" y="68" textAnchor="middle" fill="#444"
                  fontSize="7" fontFamily={MONO}>
              gradient zeroed outside [1-ε, 1+ε]
            </text>
          </svg>
        </div>

        {/* right: sliders + stats */}
        <div style={{ flex: 1, minWidth: 0, background: 'var(--bg2)',
                      border: '1px solid var(--border)', borderRadius: '6px',
                      padding: '10px 14px' }}>

          {/* 3-column slider grid */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <SliderCol label="ε" val={eps.toFixed(2)}
                       min="0.05" max="0.50" step="0.01" value={eps}
                       onChange={setEps} valColor={CLR.math} />
            <SliderCol label="A" val={(A >= 0 ? '+' : '') + A.toFixed(1)}
                       min="-3.0" max="3.0" step="0.1" value={A}
                       onChange={setA} valColor={AColor} />
            <SliderCol label="r" val={rCurrent.toFixed(2)}
                       min="0.1" max="2.5" step="0.05" value={rCurrent}
                       onChange={setRCurrent} valColor="var(--text)" />
          </div>
          <div style={{ ...mono, fontSize: '8.5px', color: 'var(--text-muted)',
                        marginBottom: '8px' }}>
            PPO typically uses ε = 0.1 to 0.3
          </div>

          <Divider />

          {/* objectives */}
          <SLabel>Objectives at r = {rCurrent.toFixed(2)}</SLabel>
          <SRow k="r · A  (unclipped)"  v={lUnclip.toFixed(3)} />
          <SRow k="clip(r) · A"         v={lClip.toFixed(3)} />
          <SRow k="L^CLIP  (PPO)"       v={lPPO.toFixed(3)}   vc={CLR.accent} />

          <Divider />

          <div style={{ ...mono, fontSize: '8px', color: statusColor,
                        lineHeight: 1.4, marginBottom: '5px' }}>
            {statusMsg}
          </div>
          <SRow k="∂L/∂r" v={grad.toFixed(3)}
                vc={Math.abs(grad) < 0.01 ? CLR.muted : CLR.accent} />
        </div>
      </div>

    </WidgetCard>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────────

const MS = { fontFamily: "'JetBrains Mono', monospace" };

function SliderCol({ label, val, min, max, step, value, onChange, valColor = 'var(--text)' }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ ...MS, fontSize: '9px', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ ...MS, fontSize: '11px', color: valColor, letterSpacing: '0.02em' }}>{val}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={e => onChange(parseFloat(e.target.value))}
             style={{ width: '100%' }} />
    </div>
  );
}

function SLabel({ children }) {
  return (
    <div style={{ ...MS, fontSize: '8px', color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: '4px' }}>
      {children}
    </div>
  );
}

function SRow({ k, v, vc = 'var(--text)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', marginBottom: '2px' }}>
      <span style={{ ...MS, fontSize: '9px', color: 'var(--text-muted)' }}>{k}</span>
      <span style={{ ...MS, fontSize: '10px', color: vc }}>{v}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />;
}
