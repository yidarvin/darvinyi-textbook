import { useState, useRef, useEffect, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

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
const sans = "'Inter', sans-serif";

const X_MIN = -4, X_MAX = 4, N_PTS = 200;
const xs = Array.from({ length: N_PTS }, (_, i) => X_MIN + (X_MAX - X_MIN) * i / (N_PTS - 1));

const pdf = (x, mu, sigma) =>
  (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));

const sigmoid = z => 1 / (1 + Math.exp(-z));

const getD = (x, ds) => {
  if (ds >= 20) return 0.5;
  const a = 1.0 + ds * 2.5 / 20;
  const b = -1.0 + ds * 2.5 / 20;
  return sigmoid(a * (x - b));
};

const getMuG    = ds => -1.0 + ds * 0.125;
const getSigmaG  = ds => 1.5 - ds * 0.04;
const getBoundary = ds => -1.0 + ds * 2.5 / 20;
const getSharpness = ds => 1.0 + ds * 2.5 / 20;

function computeJS(muG, sigmaG) {
  const dx = (X_MAX - X_MIN) / (N_PTS - 1);
  let kl_pm = 0, kl_qm = 0;
  for (let i = 0; i < N_PTS; i++) {
    const x = xs[i];
    const p = pdf(x, 1.5, 0.7);
    const q = pdf(x, muG, sigmaG);
    const m = (p + q) / 2;
    if (p > 1e-15 && m > 1e-15) kl_pm += p * Math.log(p / m);
    if (q > 1e-15 && m > 1e-15) kl_qm += q * Math.log(q / m);
  }
  return Math.max(0, 0.5 * (kl_pm + kl_qm) * dx);
}

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
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      gap: 4, marginBottom: 3,
    }}>
      <span style={{ fontFamily: mono, fontSize: 9.5, color: C.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 10, color: color || C.textMid, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 8.5, fontWeight: 600,
      color: C.accent, textTransform: 'uppercase',
      letterSpacing: '0.08em', marginBottom: 5, marginTop: 2,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '7px 0' }} />;
}

export default function MinimaxGame({ tryThis } = {}) {
  const [step, setStep]             = useState(0);
  const [displayStep, setDisplayStep] = useState(0);
  const [showD, setShowD]           = useState(true);
  const [showOverlap, setShowOverlap] = useState(true);
  const [playing, setPlaying]       = useState(false);

  const canvasRef      = useRef(null);
  const animRef        = useRef(null);
  const playRef        = useRef(null);
  const displayStepRef = useRef(0);

  // Pause the continuous play loop when scrolled off-screen; never auto-run for reduced motion.
  const [cardRef, isVisible] = useIsVisible();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisibleRef         = useRef(true);
  isVisibleRef.current = isVisible;

  // Stop playing at step 20
  useEffect(() => {
    if (step >= 20 && playing) setPlaying(false);
  }, [step, playing]);

  // Lerp displayStep toward integer step over 500ms
  useEffect(() => {
    const from = displayStepRef.current;
    const to   = step;
    if (Math.abs(from - to) < 0.001) return;

    const duration  = 500;
    const startTime = performance.now();
    if (animRef.current) cancelAnimationFrame(animRef.current);

    function tick(now) {
      const t     = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - t) ** 2;
      const cur   = from + (to - from) * eased;
      displayStepRef.current = cur;
      setDisplayStep(cur);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
  }, [step]);

  // Auto-play interval: one step per 700ms (pauses off-screen, resumes back in view)
  useEffect(() => {
    if (!playing || !isVisibleRef.current) {
      if (playRef.current) clearInterval(playRef.current);
      return;
    }
    playRef.current = setInterval(() => {
      setStep(s => (s >= 20 ? s : s + 1));
    }, 700);
    return () => clearInterval(playRef.current);
  }, [playing, isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (playRef.current) clearInterval(playRef.current);
    };
  }, []);

  // Canvas draw
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

    const PAD = { l: 44, r: 16, t: 20, b: 36 };
    const cW  = W - PAD.l - PAD.r;
    const cH  = H - PAD.t - PAD.b;

    const ds     = displayStep;
    const muG    = getMuG(ds);
    const sigmaG = getSigmaG(ds);
    const yMax   = Math.max(pdf(1.5, 1.5, 0.7), pdf(muG, muG, sigmaG)) * 1.15;

    const xToC = x => PAD.l + ((x - X_MIN) / (X_MAX - X_MIN)) * cW;
    const yToC = y => PAD.t + (1 - y / yMax) * cH;
    const dToC = d => PAD.t + (1 - d) * cH;

    // Background
    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, 0, W, H);

    // 1. Discriminator background strips
    if (showD) {
      const nStrips = 80;
      const stripW  = cW / nStrips;
      for (let i = 0; i < nStrips; i++) {
        const xc    = X_MIN + (X_MAX - X_MIN) * (i + 0.5) / nStrips;
        const d     = getD(xc, ds);
        const delta = Math.abs(d - 0.5);
        if (delta < 0.001) continue;
        const alpha = delta * 0.3;
        ctx.fillStyle = d > 0.5
          ? `rgba(45,212,191,${alpha.toFixed(3)})`
          : `rgba(248,113,113,${alpha.toFixed(3)})`;
        ctx.fillRect(PAD.l + i * stripW, PAD.t, stripW + 0.5, cH);
      }
    }

    // Precompute PDF values
    const pdataVals = xs.map(x => pdf(x, 1.5, 0.7));
    const pGVals    = xs.map(x => pdf(x, muG, sigmaG));

    // Helper: draw filled curve
    function filledCurve(vals, fillColor, strokeColor) {
      ctx.beginPath();
      ctx.moveTo(xToC(xs[0]), yToC(0));
      for (let i = 0; i < N_PTS; i++) ctx.lineTo(xToC(xs[i]), yToC(vals[i]));
      ctx.lineTo(xToC(xs[N_PTS - 1]), yToC(0));
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.setLineDash([]);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < N_PTS; i++) {
        const xc = xToC(xs[i]), yc = yToC(vals[i]);
        if (i === 0) ctx.moveTo(xc, yc); else ctx.lineTo(xc, yc);
      }
      ctx.stroke();
    }

    // 2. p_data
    filledCurve(pdataVals, 'rgba(45,212,191,0.25)', C.accent);

    // 3. p_G
    filledCurve(pGVals, 'rgba(251,146,60,0.25)', C.orange);

    // Overlap shading
    if (showOverlap) {
      ctx.beginPath();
      ctx.moveTo(xToC(xs[0]), yToC(0));
      for (let i = 0; i < N_PTS; i++) {
        ctx.lineTo(xToC(xs[i]), yToC(Math.min(pdataVals[i], pGVals[i])));
      }
      ctx.lineTo(xToC(xs[N_PTS - 1]), yToC(0));
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
    }

    // 4. D(x) curve
    if (showD) {
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < N_PTS; i++) {
        const xc = xToC(xs[i]);
        const yc = dToC(getD(xs[i], ds));
        if (i === 0) ctx.moveTo(xc, yc); else ctx.lineTo(xc, yc);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // D(x) right label
      ctx.font = `10px ${mono}`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'left';
      ctx.fillText('D(x)', PAD.l + cW + 2, dToC(getD(X_MAX, ds)) + 4);
    }

    // 5. D=0.5 horizontal dashed line
    if (showD) {
      const y05 = dToC(0.5);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.l, y05);
      ctx.lineTo(PAD.l + cW, y05);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `8px ${mono}`;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'right';
      ctx.fillText('D=0.5', PAD.l + cW - 4, y05 - 3);
    }

    // 6. Vertical dashed line at muG (orange)
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(xToC(muG), PAD.t);
    ctx.lineTo(xToC(muG), PAD.t + cH);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    // 7. Vertical dashed line at x=1.5 (teal)
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(xToC(1.5), PAD.t);
    ctx.lineTo(xToC(1.5), PAD.t + cH);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

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
    [-3, -2, -1, 0, 1, 2, 3].forEach(xVal => {
      const xc = xToC(xVal);
      ctx.fillText(String(xVal), xc, PAD.t + cH + 14);
      ctx.strokeStyle = C.borderLt;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xc, PAD.t + cH);
      ctx.lineTo(xc, PAD.t + cH + 3);
      ctx.stroke();
    });

    // Y-axis tick labels
    ctx.textAlign = 'right';
    [0, 0.2, 0.4, 0.6].forEach(yVal => {
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

    // Legend — top-left of chart area
    const lx = PAD.l + 6;
    let ly = PAD.t + 8;

    // p_data swatch
    ctx.fillStyle = 'rgba(45,212,191,0.45)';
    ctx.fillRect(lx, ly, 14, 8);
    ctx.setLineDash([]);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(lx, ly, 14, 8);
    ctx.font = `10px ${sans}`;
    ctx.fillStyle = C.textMid;
    ctx.textAlign = 'left';
    ctx.fillText('p_data (real)', lx + 18, ly + 7);

    ly += 16;
    // p_G swatch
    ctx.fillStyle = 'rgba(251,146,60,0.45)';
    ctx.fillRect(lx, ly, 14, 8);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(lx, ly, 14, 8);
    ctx.font = `10px ${sans}`;
    ctx.fillStyle = C.textMid;
    ctx.fillText('p_G (generator)', lx + 18, ly + 7);

    if (showD) {
      ly += 16;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly + 4);
      ctx.lineTo(lx + 14, ly + 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `10px ${sans}`;
      ctx.fillStyle = C.textMid;
      ctx.fillText('D(x) (discrim.)', lx + 18, ly + 7);
    }
  }, [displayStep, showD, showOverlap]);

  // Computed stats from displayStep
  const ds      = displayStep;
  const muG     = getMuG(ds);
  const sigmaG  = getSigmaG(ds);
  const bnd     = getBoundary(ds);
  const sharp   = getSharpness(ds);
  const dAtData = getD(1.5, ds);
  const dAtG    = getD(muG, ds);
  const distMu  = Math.abs(muG - 1.5);
  const distSig = Math.abs(sigmaG - 0.7);
  const jsd     = useMemo(() => computeJS(muG, sigmaG), [muG, sigmaG]);
  const isNash  = jsd < 0.01;

  function handleTrainStep() {
    setStep(s => Math.min(s + 1, 20));
  }

  function handleReset() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (playRef.current) clearInterval(playRef.current);
    setPlaying(false);
    displayStepRef.current = 0;
    setDisplayStep(0);
    setStep(0);
  }

  function handlePlay() {
    if (prefersReducedMotion) return; // reduced motion: no continuous auto-play
    if (!playing && step >= 20) {
      // Reset and start fresh
      if (animRef.current) cancelAnimationFrame(animRef.current);
      displayStepRef.current = 0;
      setDisplayStep(0);
      setStep(0);
      setPlaying(true);
      return;
    }
    setPlaying(p => !p);
  }

  const btnBase = {
    fontFamily: mono, fontSize: 11, padding: '5px 12px',
    borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
  };
  const btnPrimary = {
    ...btnBase,
    background: C.accentDim, border: `1px solid ${C.accent}`,
    color: C.accent,
  };
  const btnSecondary = {
    ...btnBase,
    background: 'transparent', border: `1px solid ${C.border}`,
    color: C.textMid,
  };

  return (
    <WidgetCard ref={cardRef} title="GAN Minimax — generator chases the real distribution" number="19.1" tryThis={tryThis}>

      {/* Canvas + Stats panel */}
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
          <SectionHead>Overview</SectionHead>
          <StatRow label="Step" value={`${step} / 20`} color={C.accent} />

          <Divider />
          <SectionHead>Generator p_G</SectionHead>
          <StatRow label="Mean" value={muG.toFixed(2)}    color={C.orange} />
          <StatRow label="Std"  value={sigmaG.toFixed(2)} color={C.orange} />

          <Divider />
          <SectionHead>Real p_data</SectionHead>
          <StatRow label="Mean" value="1.50" color={C.accent} />
          <StatRow label="Std"  value="0.70" color={C.accent} />

          <Divider />
          <SectionHead>Distance</SectionHead>
          <StatRow label="|Δμ|" value={distMu.toFixed(2)}  color={distMu  < 0.05 ? C.green : C.textMid} />
          <StatRow label="|Δσ|" value={distSig.toFixed(2)} color={distSig < 0.05 ? C.green : C.textMid} />

          <Divider />
          <SectionHead>Discriminator</SectionHead>
          <StatRow label="Bound." value={`x=${bnd.toFixed(2)}`}  color={C.textMid} />
          <StatRow label="Sharp a" value={sharp.toFixed(2)}       color={C.textMid} />
          <StatRow label="D(μ_r)" value={dAtData.toFixed(2)}
            color={Math.abs(dAtData - 0.5) < 0.05 ? C.green : C.textMid} />
          <StatRow label="D(μ_G)" value={dAtG.toFixed(2)}
            color={Math.abs(dAtG - 0.5) < 0.05 ? C.green : C.textMid} />

          <Divider />
          <SectionHead>JS Divergence</SectionHead>
          <StatRow
            label="JS"
            value={jsd.toFixed(3)}
            color={isNash ? C.green : jsd < 0.05 ? C.math : C.textMid}
          />
          {isNash && (
            <div style={{
              fontFamily: mono, fontSize: 8.5, color: C.green,
              textAlign: 'center', marginTop: 4, letterSpacing: '0.02em',
            }}>
              Nash equilibrium
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Row 1: step controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleTrainStep}
            disabled={step >= 20}
            style={{
              ...btnPrimary,
              opacity: step >= 20 ? 0.4 : 1,
              cursor: step >= 20 ? 'not-allowed' : 'pointer',
            }}
          >
            Train step
          </button>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.textMid }}>
            Step {step} / 20
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={handlePlay}
            disabled={prefersReducedMotion}
            title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
            style={{
              ...btnSecondary,
              cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
              opacity: prefersReducedMotion ? 0.5 : 1,
            }}
          >
            {playing ? 'Pause' : '▶ Play'}
          </button>
          <button onClick={handleReset} style={btnSecondary}>
            ↺ Reset
          </button>
        </div>

        {/* Row 2: toggles */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Toggle label="Show D(x)"    on={showD}       onChange={setShowD} />
          <Toggle label="Show overlap" on={showOverlap} onChange={setShowOverlap} />
        </div>
      </div>

    </WidgetCard>
  );
}
