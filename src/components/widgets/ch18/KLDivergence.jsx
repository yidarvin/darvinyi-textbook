import { useState, useMemo, useRef, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  text:      '#e8eaed',
  textMid:   '#888888',
  textMuted: '#555555',
  codeBg:    '#0a0a0a',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
};

const mono = "'JetBrains Mono', monospace";
const N_PTS = 200;
const X_MIN = -5, X_MAX = 5;
const xs = Array.from({ length: N_PTS }, (_, i) => X_MIN + (X_MAX - X_MIN) * i / (N_PTS - 1));

const gaussian = (x, mu, sigma) =>
  (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));

const klQP = (mu, sigma) => Math.log(1 / sigma) + (sigma ** 2 + mu ** 2) / 2 - 0.5;
const klPQ = (mu, sigma) => Math.log(sigma) + (1 + mu ** 2) / (2 * sigma ** 2) - 0.5;

const PRESETS = [
  { label: 'Aligned (KL=0)', mu: 0.0, sigma: 1.0 },
  { label: 'Shifted',        mu: 2.0, sigma: 1.0 },
  { label: 'Wide posterior', mu: 0.0, sigma: 2.0 },
  { label: 'Narrow + offset', mu: 1.5, sigma: 0.3 },
];

function Toggle({ label, on, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!on)}
        style={{
          width: 28, height: 14, borderRadius: 7,
          background: on ? C.accent : C.bg4,
          border: `1px solid ${on ? C.accent : C.border}`,
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 1, left: on ? 15 : 1,
          width: 10, height: 10, borderRadius: '50%',
          background: on ? '#0a0a0a' : C.textMuted,
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: mono, fontSize: 11, color: C.textMid }}>{label}</span>
    </label>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4, marginBottom: 3 }}>
      <span style={{ fontFamily: mono, fontSize: 9.5, color: C.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 10, color: color || C.textMid }}>{value}</span>
    </div>
  );
}

export default function KLDivergence({ tryThis }) {
  const [mu, setMu]                     = useState(1.0);
  const [sigma, setSigma]               = useState(1.0);
  const [showKLpq, setShowKLpq]         = useState(false);
  const [showOverlap, setShowOverlap]   = useState(false);
  const [showGapShading, setShowGap]    = useState(true);
  const [activePreset, setActivePreset] = useState(null);
  const canvasRef = useRef(null);

  const { qVals, pVals, yMax } = useMemo(() => {
    const pVals = xs.map(x => gaussian(x, 0, 1));
    const qVals = xs.map(x => gaussian(x, mu, sigma));
    const yMax  = Math.max(gaussian(mu, mu, sigma), gaussian(0, 0, 1)) * 1.15;
    return { qVals, pVals, yMax };
  }, [mu, sigma]);

  const kl          = klQP(mu, sigma);
  const klRev       = klPQ(mu, sigma);
  const term1       = Math.log(1 / sigma);
  const term2       = (sigma ** 2 + mu ** 2) / 2;
  const klColor     = kl < 0.1 ? C.green : kl < 1.0 ? C.math : kl < 3.0 ? C.orange : C.red;
  const dGradSigma  = sigma - 1 / sigma;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr   = window.devicePixelRatio || 1;
    const W     = rect.width;
    const H     = rect.height;
    const physW = Math.round(W * dpr);
    const physH = Math.round(H * dpr);

    if (canvas.width !== physW || canvas.height !== physH) {
      canvas.width  = physW;
      canvas.height = physH;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const PAD = { l: 48, r: 16, t: 20, b: 36 };
    const cW  = W - PAD.l - PAD.r;
    const cH  = H - PAD.t - PAD.b;

    const xToC = x => PAD.l + ((x - X_MIN) / (X_MAX - X_MIN)) * cW;
    const yToC = y => PAD.t + (1 - y / yMax) * cH;

    // Background
    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Y grid lines
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    [0.2, 0.4].forEach(yVal => {
      if (yVal > yMax) return;
      const y = yToC(yVal);
      ctx.beginPath();
      ctx.moveTo(PAD.l, y);
      ctx.lineTo(PAD.l + cW, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Gap shading — trapezoid per segment where |q−p| > 0.001
    if (showGapShading) {
      ctx.fillStyle = 'rgba(248,113,113,0.12)';
      for (let i = 0; i < N_PTS - 1; i++) {
        if (Math.abs(qVals[i] - pVals[i]) <= 0.001 &&
            Math.abs(qVals[i + 1] - pVals[i + 1]) <= 0.001) continue;
        const x0 = xToC(xs[i]), x1 = xToC(xs[i + 1]);
        ctx.beginPath();
        ctx.moveTo(x0, yToC(Math.max(qVals[i],     pVals[i])));
        ctx.lineTo(x1, yToC(Math.max(qVals[i + 1], pVals[i + 1])));
        ctx.lineTo(x1, yToC(Math.min(qVals[i + 1], pVals[i + 1])));
        ctx.lineTo(x0, yToC(Math.min(qVals[i],     pVals[i])));
        ctx.closePath();
        ctx.fill();
      }
    }

    // Overlap shading — fill min(q, p) area in faint teal
    if (showOverlap) {
      const y0c = yToC(0);
      ctx.beginPath();
      ctx.moveTo(xToC(xs[0]), y0c);
      for (let i = 0; i < N_PTS; i++) {
        ctx.lineTo(xToC(xs[i]), yToC(Math.min(qVals[i], pVals[i])));
      }
      ctx.lineTo(xToC(xs[N_PTS - 1]), y0c);
      ctx.closePath();
      ctx.fillStyle = 'rgba(45,212,191,0.08)';
      ctx.fill();
    }

    // p(z) — white dashed, drawn first (behind q)
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(232,234,237,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < N_PTS; i++) {
      const xc = xToC(xs[i]), yc = yToC(pVals[i]);
      if (i === 0) ctx.moveTo(xc, yc); else ctx.lineTo(xc, yc);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // q(z|x) — teal solid, on top
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < N_PTS; i++) {
      const xc = xToC(xs[i]), yc = yToC(qVals[i]);
      if (i === 0) ctx.moveTo(xc, yc); else ctx.lineTo(xc, yc);
    }
    ctx.stroke();

    // Vertical line at x=0 (prior mean)
    const x0c = xToC(0);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = C.borderLt;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0c, PAD.t);
    ctx.lineTo(x0c, PAD.t + cH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `9px ${mono}`;
    ctx.fillStyle = C.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('μp=0', x0c, PAD.t - 5);

    // Vertical line at x=mu (posterior mean) — only when mu ≠ 0
    if (Math.abs(mu) > 0.01) {
      const xMc = xToC(mu);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = C.math;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xMc, PAD.t);
      ctx.lineTo(xMc, PAD.t + cH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `9px ${mono}`;
      ctx.fillStyle = C.math;
      ctx.textAlign = mu > 0 ? 'left' : 'right';
      ctx.fillText(`μq=${mu.toFixed(2)}`, xMc + (mu > 0 ? 4 : -4), PAD.t - 5);
    }

    // Axes
    ctx.strokeStyle = C.borderLt;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t + cH);
    ctx.lineTo(PAD.l + cW, PAD.t + cH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t);
    ctx.lineTo(PAD.l, PAD.t + cH);
    ctx.stroke();

    // X-axis tick labels
    ctx.font = `9px ${mono}`;
    ctx.fillStyle = C.textMuted;
    ctx.textAlign = 'center';
    [-4, -2, 0, 2, 4].forEach(xVal => {
      const xc = xToC(xVal);
      ctx.strokeStyle = C.borderLt;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xc, PAD.t + cH);
      ctx.lineTo(xc, PAD.t + cH + 3);
      ctx.stroke();
      ctx.fillStyle = C.textMuted;
      ctx.fillText(String(xVal), xc, PAD.t + cH + 13);
    });

    // "z" axis label at right end
    ctx.font = `10px 'Inter', sans-serif`;
    ctx.fillStyle = C.textMuted;
    ctx.textAlign = 'left';
    ctx.fillText('z', PAD.l + cW + 4, PAD.t + cH + 13);

    // Y-axis tick labels
    ctx.font = `9px ${mono}`;
    ctx.textAlign = 'right';
    [0, 0.2, 0.4].forEach(yVal => {
      if (yVal > yMax * 1.05) return;
      const yc = yToC(yVal);
      ctx.fillStyle = C.textMuted;
      ctx.fillText(yVal.toFixed(1), PAD.l - 5, yc + 3);
      ctx.strokeStyle = C.borderLt;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.l, yc);
      ctx.lineTo(PAD.l - 3, yc);
      ctx.stroke();
    });
  }, [mu, sigma, qVals, pVals, yMax, showGapShading, showOverlap]);

  const handleMu    = val => { setMu(Number(val));    setActivePreset(null); };
  const handleSigma = val => { setSigma(Number(val)); setActivePreset(null); };
  const handlePreset = idx => {
    setMu(PRESETS[idx].mu);
    setSigma(PRESETS[idx].sigma);
    setActivePreset(idx);
  };

  return (
    <WidgetCard title="KL Divergence — posterior vs prior, live formula" number="18.2" tryThis={tryThis}>

      {/* ── Canvas + Stats ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

        <div style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '260px', display: 'block', borderRadius: 4 }}
          />
        </div>

        {/* Stats panel */}
        <div style={{
          width: 180, flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '12px 14px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            q ~ N(μ, σ²)
          </div>
          <StatRow label="μ"  value={mu.toFixed(3)}           color={C.accent} />
          <StatRow label="σ"  value={sigma.toFixed(3)}         color={C.accent} />
          <StatRow label="σ²" value={(sigma ** 2).toFixed(3)}  color={C.textMid} />

          <div style={{ height: 1, background: C.border, margin: '8px 0' }} />

          <div style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            KL Breakdown
          </div>
          <StatRow label="log(1/σ)"  value={term1.toFixed(3)}  color={term1 < 0 ? C.red : C.math} />
          <StatRow label="(σ²+μ²)/2" value={term2.toFixed(3)}  color={C.math} />
          <StatRow label="− 1/2"     value="−0.500"            color={C.textMuted} />
          <StatRow label="KL(q||p)"  value={kl.toFixed(4)}     color={klColor} />

          {showKLpq && (
            <>
              <div style={{ height: 1, background: C.border, margin: '6px 0' }} />
              <StatRow label="KL(p||q)" value={klRev.toFixed(4)}              color={C.orange} />
              <StatRow label="|Δ KL|"   value={Math.abs(kl - klRev).toFixed(3)} color={C.textMid} />
            </>
          )}

          <div style={{ height: 1, background: C.border, margin: '8px 0' }} />

          <div style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            VAE Gradient
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: C.textMid, lineHeight: 1.75 }}>
            <div>∂KL/∂μ = <span style={{ color: C.math }}>{mu.toFixed(2)}</span></div>
            <div>∂KL/∂σ = <span style={{ color: C.math }}>{dGradSigma.toFixed(3)}</span></div>
          </div>
        </div>
      </div>

      {/* ── KL Display ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: mono, fontSize: 20, color: klColor }}>
          KL(q || p) = {kl.toFixed(4)}
        </div>
        {showKLpq && (
          <>
            <div style={{ fontFamily: mono, fontSize: 14, color: C.orange, marginTop: 4 }}>
              KL(p || q) = {klRev.toFixed(4)}
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.textMuted, fontStyle: 'italic', marginTop: 2 }}>
              KL(q||p) ≠ KL(p||q) — asymmetry
            </div>
          </>
        )}
      </div>

      {/* ── Formula Breakdown ───────────────────────────────────────────── */}
      <div style={{
        marginTop: 10,
        background: C.codeBg,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: '10px 14px',
      }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.math }}>
          KL(q||p) = log(1/σ) + (σ² + μ²)/2 − 1/2
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.textMid, marginTop: 4 }}>
          {'= '}
          <span style={{ color: term1 >= 0 ? C.math : C.red }}>{term1.toFixed(3)}</span>
          <span style={{ color: 'rgba(136,136,136,0.5)' }}> + </span>
          <span style={{ color: C.math }}>{term2.toFixed(3)}</span>
          <span style={{ color: 'rgba(136,136,136,0.5)' }}> − </span>
          <span style={{ color: 'rgba(136,136,136,0.4)' }}>0.500</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, marginTop: 4 }}>
          <span style={{ color: C.textMuted }}>= </span>
          <span style={{ color: klColor }}>{kl.toFixed(4)}</span>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* mu slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.textMid, width: 80, flexShrink: 0 }}>
            μ = {mu.toFixed(2)}
          </span>
          <input
            type="range" min={-3.0} max={3.0} step={0.05} value={mu}
            onChange={e => handleMu(e.target.value)}
            style={{ flex: 1, minWidth: 80, accentColor: C.accent, cursor: 'pointer' }}
          />
        </div>

        {/* sigma slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.textMid, width: 80, flexShrink: 0 }}>
            σ = {sigma.toFixed(2)}
          </span>
          <input
            type="range" min={0.10} max={3.0} step={0.05} value={sigma}
            onChange={e => handleSigma(e.target.value)}
            style={{ flex: 1, minWidth: 80, accentColor: C.accent, cursor: 'pointer' }}
          />
        </div>

        {/* Preset buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => handlePreset(i)}
              style={{
                fontFamily: mono, fontSize: 10,
                padding: '4px 10px', borderRadius: 4,
                cursor: 'pointer',
                background: activePreset === i ? C.accentDim : 'transparent',
                border:     `1px solid ${activePreset === i ? C.accent : C.border}`,
                color:      activePreset === i ? C.accent : C.textMid,
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Toggle label="Show KL(p||q)"    on={showKLpq}      onChange={setShowKLpq} />
          <Toggle label="Show overlap"     on={showOverlap}   onChange={setShowOverlap} />
          <Toggle label="Show gap shading" on={showGapShading} onChange={setShowGap} />
        </div>
      </div>

    </WidgetCard>
  );
}
