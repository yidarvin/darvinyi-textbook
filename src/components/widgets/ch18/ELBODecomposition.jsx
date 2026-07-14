import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  textMid:   '#888888',
  textMuted: '#555555',
  codeBg:    '#0a0a0a',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
};

const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const BASE_RECON = 0.42;
const BASE_KL    = 2.8;
const Y_MAX      = 4.5;

const calcRecon      = b => BASE_RECON * (1 + b * 0.35);
const calcKL         = b => BASE_KL * Math.exp(-b * 0.45);
const calcWeightedKL = b => b * calcKL(b);
const calcTotal      = b => calcRecon(b) + calcWeightedKL(b);

// Latent space quality is an inverted-U, not a monotonic climb: it rises as
// beta first introduces useful regularization, then falls once beta pushes
// past the sweet spot and the model starts trading the latent code away for
// a cheaper KL — i.e. posterior collapse. Quality must read low/red in
// exactly the regime getRegime below labels "collapse", never high/green.
const QUALITY_RISE_TAU  = 0.6;  // how fast quality climbs from beta=0
const QUALITY_FALL_PEAK = 2.0;  // beta beyond which quality starts declining
const QUALITY_FALL_SIGMA = 1.8; // how sharply it declines past the peak
const calcQuality = b => {
  const rise = 1 - Math.exp(-b / QUALITY_RISE_TAU);
  const fall = b <= QUALITY_FALL_PEAK
    ? 1
    : Math.exp(-((b - QUALITY_FALL_PEAK) ** 2) / (2 * QUALITY_FALL_SIGMA ** 2));
  return Math.max(0, rise * fall);
};

const BETAS   = [0, 0.5, 1, 2, 3, 4, 5];
const BAR_W   = 36;
const BAR_GAP = 10;
const CHART_H = 260;

const RED_RGB   = [248, 113, 113];
const GREEN_RGB = [52,  211, 153];

function lerpColor(c1, c2, t) {
  return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * t)},${Math.round(c1[1] + (c2[1] - c1[1]) * t)},${Math.round(c1[2] + (c2[2] - c1[2]) * t)})`;
}

// Thresholds align with the preset buttons below: beta=4 is still labeled
// "beta-VAE" there, so the collapse regime must start above it (4.5), not
// below it — otherwise the preset's own label and the computed regime
// contradict each other at the same beta value.
function getRegime(b) {
  if (b < 0.1) return 'AE';
  if (b < 1.5) return 'VAE';
  if (b < 4.5) return 'beta-VAE';
  return 'collapse';
}

function getRegimeDesc(b) {
  if (b < 0.1) return 'Autoencoder — no regularization. Latent space unstructured.';
  if (b < 1.5) return 'VAE regime — balanced reconstruction and regularity.';
  if (b < 4.5) return 'beta-VAE — increased compression, possible disentanglement.';
  return 'High beta — posterior collapse. Decoder ignores latent code.';
}

const PRESETS = [
  { label: 'beta=0 (AE)',       value: 0.0 },
  { label: 'beta=1 (VAE)',      value: 1.0 },
  { label: 'beta=4 (beta-VAE)', value: 4.0 },
  { label: 'beta=5 (max)',      value: 5.0 },
];

function MiniBar({ value, maxVal, color }) {
  const w = Math.min((value / maxVal) * 166, 166);
  return (
    <div style={{ height: 8, background: C.bg4, borderRadius: 3, overflow: 'hidden', marginBottom: 2 }}>
      <div style={{ height: '100%', width: `${w}px`, background: color, borderRadius: 3, transition: 'width 0.08s linear' }} />
    </div>
  );
}

// stats strip: 7 cells × ~62px + 2 dividers × 21px = 476px < 588px usable ✓
function StatCell({ label, val, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
      <span style={{ fontFamily: mono, fontSize: 8, color: C.textMuted, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 11, color: color || C.textMid, whiteSpace: 'nowrap' }}>{val}</span>
    </div>
  );
}

function Div() {
  return <div style={{ width: 1, background: C.border, alignSelf: 'stretch', margin: '0 10px', flexShrink: 0 }} />;
}

export default function ELBODecomposition({ tryThis }) {
  const [beta, setBeta]           = useState(1.0);
  const [animating, setAnimating] = useState(false);
  const canvasRef                 = useRef(null);
  const animRef                   = useRef(null);

  const vals = useMemo(() => ({
    r:  calcRecon(beta),
    k:  calcKL(beta),
    wk: calcWeightedKL(beta),
    t:  calcTotal(beta),
    q:  calcQuality(beta),
  }), [beta]);

  const handleAnimate = useCallback(() => {
    if (animating) {
      clearInterval(animRef.current);
      setAnimating(false);
      return;
    }
    setAnimating(true);
    let cur = beta >= 4.99 ? 0 : beta;
    setBeta(+(cur).toFixed(2));
    animRef.current = setInterval(() => {
      cur = +(Math.min(cur + 0.05, 5.0)).toFixed(2);
      setBeta(cur);
      if (cur >= 5.0) {
        clearInterval(animRef.current);
        setAnimating(false);
      }
    }, 40);
  }, [animating, beta]);

  useEffect(() => () => clearInterval(animRef.current), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    const W   = rect.width;
    const H   = rect.height;
    const pw  = Math.round(W * dpr);
    const ph  = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width  = pw;
      canvas.height = ph;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const PAD    = { l: 38, r: 14, t: 32, b: 38 };
    const chartW = W - PAD.l - PAD.r;
    const chartH = H - PAD.t - PAD.b;
    const baseY  = PAD.t + chartH;

    // Bar sizing: fill available width, 75% bar / 25% gap
    const barStep    = chartW / BETAS.length;
    const barW       = barStep * 0.74;
    const barX       = i => PAD.l + i * barStep;
    const barCenterX = i => barX(i) + barW / 2;

    const yToC = y => PAD.t + (1 - y / Y_MAX) * chartH;

    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    [0.5, 1.0, 1.5, 2.0, 2.5, 3.0].forEach(yv => {
      const yc = yToC(yv);
      ctx.beginPath(); ctx.moveTo(PAD.l, yc); ctx.lineTo(W - PAD.r, yc); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Y axis labels
    ctx.font = `9px ${mono}`;
    ctx.fillStyle = C.textMuted;
    ctx.textAlign = 'right';
    [0, 1, 2, 3, 4].forEach(yv => ctx.fillText(String(yv), PAD.l - 5, yToC(yv) + 3));

    // Y axis title
    ctx.save();
    ctx.font = `9px ${sans}`;
    ctx.fillStyle = C.textMuted;
    ctx.textAlign = 'center';
    ctx.translate(9, PAD.t + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Loss', 0, 0);
    ctx.restore();

    // Legend
    ctx.fillStyle = C.red;
    ctx.fillRect(PAD.l, 10, 9, 8);
    ctx.font = `10px ${sans}`;
    ctx.fillStyle = C.textMuted;
    ctx.textAlign = 'left';
    ctx.fillText('Reconstruction', PAD.l + 13, 18);
    ctx.fillStyle = C.orange;
    ctx.fillRect(PAD.l + 122, 10, 9, 8);
    ctx.fillStyle = C.textMuted;
    ctx.fillText('beta × KL', PAD.l + 135, 18);

    // Bars
    BETAS.forEach((b, i) => {
      const x   = barX(i);
      const rh  = (calcRecon(b)      / Y_MAX) * chartH;
      const klh = (calcWeightedKL(b) / Y_MAX) * chartH;

      ctx.fillStyle = C.red;
      ctx.fillRect(x, baseY - rh, barW, rh);
      ctx.fillStyle = C.orange;
      ctx.fillRect(x, baseY - rh - klh, barW, klh);

      const reg = b === 0 ? 'AE' : b === 1 ? 'VAE' : b === 4 ? 'β-VAE' : b === 5 ? 'collapse' : '';
      if (reg) {
        ctx.font = `8px ${sans}`;
        ctx.fillStyle = 'rgba(136,136,136,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(reg, barCenterX(i), baseY - rh - klh - 4);
      }

      ctx.font = `9px ${mono}`;
      ctx.fillStyle = C.textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(String(b), barCenterX(i), baseY + 14);
    });

    // Beta indicator
    const clamp = Math.max(0, Math.min(5, beta));
    const hi    = BETAS.findIndex(b => b > clamp);
    let indX;
    if (hi <= 0) {
      indX = barCenterX(hi === -1 ? BETAS.length - 1 : 0);
    } else {
      const t = (clamp - BETAS[hi - 1]) / (BETAS[hi] - BETAS[hi - 1]);
      indX = barCenterX(hi - 1) + t * (barCenterX(hi) - barCenterX(hi - 1));
    }
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(indX, PAD.t - 8); ctx.lineTo(indX, baseY); ctx.stroke();
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = C.borderLt;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD.l, baseY); ctx.lineTo(W - PAD.r, baseY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, baseY);     ctx.stroke();
  }, [beta]);

  const { r, k, wk, t, q } = vals;
  const qualityPct   = (q * 100).toFixed(0);
  const qualityColor = lerpColor(RED_RGB, GREEN_RGB, q);
  const elboColor    = beta < 0.1 ? C.textMuted : beta <= 1.5 ? C.accent : C.orange;
  const elboLabel    = beta < 0.1 ? 'no structure' : beta <= 1.5 ? 'balanced' : 'high compression';
  const activePreset = PRESETS.findIndex(p => Math.abs(p.value - beta) < 0.001);

  return (
    <WidgetCard title="ELBO Decomposition — reconstruction vs KL tradeoff" number="18.4" tryThis={tryThis}>

      {/* ── Chart + right panel, both pinned to CHART_H ──────────────────────── */}
      <div style={{ display: 'flex', gap: 12, height: CHART_H }}>

        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', borderRadius: 4 }}
          />
        </div>

        {/* Current state panel */}
        <div style={{
          width: 190, flexShrink: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '10px 12px',
          background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6,
        }}>

          <div>
            <div style={{ fontFamily: mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>Reconstruction loss</div>
            <MiniBar value={r} maxVal={Y_MAX} color={C.red} />
            <div style={{ fontFamily: mono, fontSize: 10, color: C.red, textAlign: 'right' }}>{r.toFixed(3)} nats</div>
          </div>

          <div>
            <div style={{ fontFamily: mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>
              beta×KL = {beta.toFixed(1)} × {k.toFixed(3)}
            </div>
            <MiniBar value={wk} maxVal={Y_MAX} color={C.orange} />
            <div style={{ fontFamily: mono, fontSize: 10, color: C.orange, textAlign: 'right' }}>{wk.toFixed(3)} nats</div>
          </div>

          <div>
            <div style={{ fontFamily: mono, fontSize: 17, color: elboColor, lineHeight: 1.2 }}>
              ELBO = &minus;{t.toFixed(3)}
            </div>
            <div style={{ fontFamily: mono, fontSize: 9, color: elboColor, marginTop: 3, fontStyle: 'italic' }}>
              {elboLabel}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>Latent space quality</div>
            <MiniBar value={q} maxVal={1} color={qualityColor} />
            <div style={{ fontFamily: mono, fontSize: 10, color: qualityColor, textAlign: 'right' }}>{qualityPct}%</div>
          </div>

          <div style={{ fontFamily: sans, fontSize: 11, color: C.textMid, fontStyle: 'italic', lineHeight: 1.5, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
            {getRegimeDesc(beta)}
          </div>
        </div>
      </div>

      {/* ── Stats strip — 7 cells × flex:1 + 2 dividers = fits 616px ─────────── */}
      <div style={{
        marginTop: 10,
        display: 'flex', alignItems: 'stretch',
        background: C.bg2, border: `1px solid ${C.border}`,
        borderRadius: 6, padding: '8px 12px',
        gap: 0,
      }}>
        <StatCell label="beta"    val={beta.toFixed(1)}    color={C.accent} />
        <Div />
        <StatCell label="recon"   val={r.toFixed(3)}       color={C.red} />
        <StatCell label="raw KL"  val={k.toFixed(3)}       color={C.textMid} />
        <StatCell label="β×KL"    val={wk.toFixed(3)}      color={C.orange} />
        <StatCell label="total"   val={t.toFixed(3)}       color={C.textMid} />
        <StatCell label="ELBO"    val={`−${t.toFixed(3)}`} color={elboColor} />
        <Div />
        <StatCell label="quality" val={`${qualityPct}%`}   color={qualityColor} />
        <StatCell label="regime"  val={getRegime(beta)}    color={C.textMid} />
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.textMid, width: 72, flexShrink: 0 }}>
            beta = {beta.toFixed(1)}
          </span>
          <input
            type="range" min={0} max={5} step={0.1} value={beta}
            onChange={e => setBeta(+e.target.value)}
            style={{ flex: 1, minWidth: 80, accentColor: C.accent, cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESETS.map((p, i) => {
            const active = activePreset === i;
            return (
              <button key={i} onClick={() => setBeta(p.value)} style={{
                fontFamily: mono, fontSize: 10,
                padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                background: active ? C.accentDim : 'transparent',
                border:     `1px solid ${active ? C.accent : C.border}`,
                color:      active ? C.accent : C.textMid,
                transition: 'all 0.15s',
              }}>
                {p.label}
              </button>
            );
          })}
          <button onClick={handleAnimate} style={{
            fontFamily: mono, fontSize: 10,
            padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
            background: animating ? C.accentDim : 'transparent',
            border:     `1px solid ${animating ? C.accent : C.borderLt}`,
            color:      animating ? C.accent : C.textMid,
            transition: 'all 0.15s',
          }}>
            {animating ? '⏸ Pause' : '▶ Animate sweep'}
          </button>
        </div>
      </div>

    </WidgetCard>
  );
}
