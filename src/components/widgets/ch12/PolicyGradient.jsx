import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── constants ─────────────────────────────────────────────────────────────────
const MONO = "'JetBrains Mono', monospace";
const CLR = {
  accent: '#2dd4bf',
  green:  '#34d399',
  red:    '#f87171',
  muted:  '#555555',
  border: '#242424',
};

const X_MIN = -2, X_MAX = 2;
const PAD = { left: 44, right: 16, top: 20, bottom: 36 };
const INIT_MU = -0.5, INIT_SIGMA = 0.8;
const INIT_LOG_SIG = Math.log(INIT_SIGMA);

// ── math helpers ──────────────────────────────────────────────────────────────
const gaussianPDF = (x, mu, sigma) =>
  (1 / (sigma * Math.sqrt(2 * Math.PI))) *
  Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));

const rewardFn = (a) =>
  Math.min(2.0, Math.max(-0.5,
    2.0 * Math.exp(-((a - 0.6) ** 2) / (2 * 0.15 ** 2)) -
    0.3 * Math.exp(-((a + 0.8) ** 2) / (2 * 0.25 ** 2))));

const sampleGaussian = (mu, sigma) => {
  const u = Math.random(), v = Math.random();
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ── component ─────────────────────────────────────────────────────────────────
export default function PolicyGradient({ tryThis }) {
  // policy & training state (for stats panel)
  const [mu, setMu]                     = useState(INIT_MU);
  const [sigma, setSigma]               = useState(INIT_SIGMA);
  const [baseline, setBaseline]         = useState(0);
  const [totalRollouts, setTotalRollouts] = useState(0);
  const [batchSize, setBatchSize]       = useState(1);
  const [samples, setSamples]           = useState([]); // [{a, r}] ordered oldest→newest
  const [lastRollout, setLastRollout]   = useState(null); // {a, r, A}
  const [showReward, setShowReward]     = useState(true);
  const [showTicks, setShowTicks]       = useState(true);
  const [popup, setPopup]               = useState(null); // {a, r, key}

  // policy computation refs
  const muRef        = useRef(INIT_MU);
  const logSigRef    = useRef(INIT_LOG_SIG);
  const baselineRef  = useRef(0);
  const batchSizeRef = useRef(1);
  const samplesRef   = useRef([]);

  // canvas animation refs
  const canvasRef       = useRef(null);
  const displayMuRef    = useRef(INIT_MU);
  const displaySigRef   = useRef(INIT_SIGMA);
  const animFrameRef    = useRef(null);
  const animStartRef    = useRef(null);
  const animFromMuRef   = useRef(INIT_MU);
  const animFromSigRef  = useRef(INIT_SIGMA);
  const animTargMuRef   = useRef(INIT_MU);
  const animTargSigRef  = useRef(INIT_SIGMA);

  // draw-trigger refs (updated before state, so useEffect sees correct values)
  const showRewardRef = useRef(true);
  const showTicksRef  = useRef(true);
  const popupTimerRef = useRef(null);

  // keep refs in sync with state
  useEffect(() => { batchSizeRef.current  = batchSize;  }, [batchSize]);
  useEffect(() => { showRewardRef.current = showReward; }, [showReward]);
  useEffect(() => { showTicksRef.current  = showTicks;  }, [showTicks]);

  // ── canvas draw (reads only from refs) ────────────────────────────────────
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

    const dMu  = displayMuRef.current;
    const dSig = displaySigRef.current;
    const plotW = width  - PAD.left - PAD.right;
    const plotH = height - PAD.top  - PAD.bottom;

    const xToC = (a) => PAD.left + ((a - X_MIN) / (X_MAX - X_MIN)) * plotW;
    const pdfPeak = 1 / (dSig * Math.sqrt(2 * Math.PI));
    const Y_MAX = Math.min(3.0, Math.max(pdfPeak * 1.1, 1.2));
    const yToC  = (v) => PAD.top + (1 - Math.min(v, Y_MAX) / Y_MAX) * plotH;
    const yBase = yToC(0);

    const N = 250;
    const pts = Array.from({ length: N + 1 }, (_, i) => X_MIN + i * (X_MAX - X_MIN) / N);

    // background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // ── 1. reward curve ───────────────────────────────────────────────────────
    if (showRewardRef.current) {
      let maxR = -Infinity;
      pts.forEach(a => { const r = rewardFn(a); if (r > maxR) maxR = r; });
      const rNorm = (a) => rewardFn(a) / maxR;

      // fill
      ctx.beginPath();
      ctx.moveTo(xToC(pts[0]), yBase);
      pts.forEach(a => ctx.lineTo(xToC(a), yToC(rNorm(a))));
      ctx.lineTo(xToC(pts[N]), yBase);
      ctx.closePath();
      ctx.fillStyle = 'rgba(52,211,153,0.12)';
      ctx.fill();

      // dashed stroke
      ctx.beginPath();
      ctx.setLineDash([6, 3]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = CLR.green;
      pts.forEach((a, i) => {
        if (i === 0) ctx.moveTo(xToC(a), yToC(rNorm(a)));
        else ctx.lineTo(xToC(a), yToC(rNorm(a)));
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // peak label
      ctx.font = `9px ${MONO}`;
      ctx.fillStyle = CLR.green;
      ctx.textAlign = 'center';
      ctx.fillText('R(a) peak', xToC(0.6), yToC(1.0) - 5);
    }

    // ── 2. sigma band ─────────────────────────────────────────────────────────
    {
      const x1 = Math.max(PAD.left, xToC(dMu - dSig));
      const x2 = Math.min(width - PAD.right, xToC(dMu + dSig));
      ctx.fillStyle = 'rgba(45,212,191,0.06)';
      ctx.fillRect(x1, PAD.top, x2 - x1, plotH);

      ctx.font = `8px ${MONO}`;
      ctx.fillStyle = CLR.accent;
      ctx.textAlign = 'left';
      const sigLabelX = Math.min(x2 + 3, width - PAD.right - 12);
      ctx.fillText('±σ', sigLabelX, PAD.top + 10);
    }

    // ── 3. policy PDF ─────────────────────────────────────────────────────────
    {
      // fill
      ctx.beginPath();
      ctx.moveTo(xToC(pts[0]), yBase);
      pts.forEach(a => ctx.lineTo(xToC(a), yToC(gaussianPDF(a, dMu, dSig))));
      ctx.lineTo(xToC(pts[N]), yBase);
      ctx.closePath();
      ctx.fillStyle = 'rgba(45,212,191,0.20)';
      ctx.fill();

      // stroke
      ctx.beginPath();
      pts.forEach((a, i) => {
        const y = yToC(gaussianPDF(a, dMu, dSig));
        if (i === 0) ctx.moveTo(xToC(a), y);
        else ctx.lineTo(xToC(a), y);
      });
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = CLR.accent;
      ctx.stroke();
    }

    // ── 4. sample ticks ───────────────────────────────────────────────────────
    if (showTicksRef.current) {
      const samps = samplesRef.current;
      const n = samps.length;
      samps.forEach((s, i) => {
        const opacity = n <= 1 ? 1 : 0.2 + 0.8 * (i / (n - 1));
        const color = s.r > 0.5 ? CLR.green : s.r < 0 ? CLR.red : CLR.muted;
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xToC(s.a), yBase);
        ctx.lineTo(xToC(s.a), yBase - 10);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    // ── 5. optimal action marker ──────────────────────────────────────────────
    {
      const x = xToC(0.6);
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = CLR.green;
      ctx.beginPath();
      ctx.moveTo(x, PAD.top + 16);
      ctx.lineTo(x, yBase);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `8px ${MONO}`;
      ctx.fillStyle = CLR.green;
      ctx.textAlign = 'center';
      ctx.fillText('optimal a=0.6', x, PAD.top + 14);
    }

    // ── 6. mu indicator ───────────────────────────────────────────────────────
    {
      const x = xToC(dMu);
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = CLR.accent;
      ctx.beginPath();
      ctx.moveTo(x, PAD.top + 16);
      ctx.lineTo(x, yBase);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `9px ${MONO}`;
      ctx.fillStyle = CLR.accent;
      ctx.textAlign = Math.abs(dMu - 0.6) < 0.3 ? 'right' : 'center';
      const labelX = Math.abs(dMu - 0.6) < 0.3 ? x - 4 : x;
      ctx.fillText(`μ=${dMu.toFixed(2)}`, labelX, PAD.top + 9);
    }

    // ── 7. axes ───────────────────────────────────────────────────────────────
    {
      ctx.strokeStyle = CLR.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.left, yBase);
      ctx.lineTo(width - PAD.right, yBase);
      ctx.stroke();

      ctx.font = `9px ${MONO}`;
      ctx.fillStyle = CLR.muted;
      [-2, -1, 0, 0.6, 1, 2].forEach(v => {
        const x = xToC(v);
        ctx.textAlign = 'center';
        ctx.fillText(v === 0.6 ? '0.6' : String(v), x, yBase + 14);
        ctx.strokeStyle = CLR.muted;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, yBase);
        ctx.lineTo(x, yBase + 4);
        ctx.stroke();
      });

      ctx.textAlign = 'right';
      ctx.fillText('action a', width - PAD.right, yBase + 14);
      ctx.textAlign = 'right';
      ctx.fillText('0', PAD.left - 3, yBase + 3);
    }
  }, []);

  // ── policy curve lerp ─────────────────────────────────────────────────────
  const startLerp = useCallback((targetMu, targetSig) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFromMuRef.current  = displayMuRef.current;
    animFromSigRef.current = displaySigRef.current;
    animTargMuRef.current  = targetMu;
    animTargSigRef.current = targetSig;
    animStartRef.current   = null;

    const DURATION = 300;
    const step = (ts) => {
      if (!animStartRef.current) animStartRef.current = ts;
      const t = Math.min(1, (ts - animStartRef.current) / DURATION);
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out
      displayMuRef.current  = animFromMuRef.current  + e * (animTargMuRef.current  - animFromMuRef.current);
      displaySigRef.current = animFromSigRef.current + e * (animTargSigRef.current - animFromSigRef.current);
      draw();
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        displayMuRef.current  = targetMu;
        displaySigRef.current = targetSig;
        animFrameRef.current  = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, [draw]);

  // ── redraw on state changes ───────────────────────────────────────────────
  useEffect(() => { draw(); }, [draw, mu, sigma, samples, showReward, showTicks]);

  // ── rollout steps ─────────────────────────────────────────────────────────
  const doSteps = useCallback((numSteps) => {
    let curMu       = muRef.current;
    let curLogSig   = logSigRef.current;
    let curBaseline = baselineRef.current;
    const curSamples = [...samplesRef.current];

    let lastA = 0, lastR = 0, lastA_adv = 0;
    let newRollouts = 0;

    for (let s = 0; s < numSteps; s++) {
      const bs = batchSizeRef.current;
      let sumDMu = 0, sumDLogSig = 0;

      for (let i = 0; i < bs; i++) {
        const sig = Math.exp(curLogSig);
        const a   = sampleGaussian(curMu, sig);
        const r   = rewardFn(a);
        const A   = r - curBaseline;

        sumDMu     += 0.05 * A * (a - curMu) / sig ** 2;
        sumDLogSig += 0.02 * A * ((a - curMu) ** 2 / sig ** 2 - 1);
        curBaseline = 0.9 * curBaseline + 0.1 * r;
        curSamples.push({ a, r });
        newRollouts++;

        lastA = a; lastR = r; lastA_adv = A;
      }

      curMu     += sumDMu / batchSizeRef.current;
      curLogSig  = Math.max(Math.log(0.05), Math.min(Math.log(2.0),
                    curLogSig + sumDLogSig / batchSizeRef.current));
    }

    const newSig = Math.exp(curLogSig);
    const kept   = curSamples.slice(-20);

    muRef.current       = curMu;
    logSigRef.current   = curLogSig;
    baselineRef.current = curBaseline;
    samplesRef.current  = kept;

    setMu(curMu);
    setSigma(newSig);
    setBaseline(curBaseline);
    setSamples([...kept]);
    setTotalRollouts(t => t + newRollouts);
    setLastRollout({ a: lastA, r: lastR, A: lastA_adv });

    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    setPopup({ a: lastA, r: lastR, key: Date.now() });
    popupTimerRef.current = setTimeout(() => setPopup(null), 700);

    startLerp(curMu, newSig);
  }, [startLerp]);

  // ── reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    muRef.current       = INIT_MU;
    logSigRef.current   = INIT_LOG_SIG;
    baselineRef.current = 0;
    samplesRef.current  = [];
    displayMuRef.current  = INIT_MU;
    displaySigRef.current = INIT_SIGMA;
    animFrameRef.current  = null;
    setMu(INIT_MU);
    setSigma(INIT_SIGMA);
    setBaseline(0);
    setSamples([]);
    setTotalRollouts(0);
    setLastRollout(null);
    setPopup(null);
  }, []);

  // ── inject keyframe + cleanup ─────────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById('pg-style')) {
      const s = document.createElement('style');
      s.id = 'pg-style';
      s.textContent =
        '@keyframes pg-pop{' +
        '0%{opacity:0;transform:translateX(-50%) translateY(0)}' +
        '15%{opacity:1;transform:translateX(-50%) translateY(-4px)}' +
        '80%{opacity:1;transform:translateX(-50%) translateY(-12px)}' +
        '100%{opacity:0;transform:translateX(-50%) translateY(-20px)}' +
        '}';
      document.head.appendChild(s);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  // ── derived ───────────────────────────────────────────────────────────────
  const distToOpt = Math.abs(mu - 0.6);
  const converged = distToOpt < 0.05 && sigma < 0.2;

  // popup left position: calc(${44 - frac*60}px + ${frac*100}%)
  const popupFrac = popup ? Math.max(0, Math.min(1, (popup.a - X_MIN) / (X_MAX - X_MIN))) : 0;

  // ── styles ─────────────────────────────────────────────────────────────────
  const mono = { fontFamily: MONO };

  const btnBase = { ...mono, fontSize: '11px', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', flexShrink: 0, border: '1px solid' };
  const btn = (active) => ({
    ...btnBase,
    background:  active ? 'var(--accent-dim)' : 'var(--bg4)',
    color:       active ? 'var(--accent)'     : 'var(--text-muted)',
    borderColor: active ? 'var(--accent)'     : 'var(--border-lt)',
  });

  // shared cell style helpers for the stats strip
  const cell = (label, value, color = 'var(--accent)') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <span style={{ ...mono, fontSize: '8.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ ...mono, fontSize: '13px', color, lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );

  const vdiv = <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />;

  return (
    <WidgetCard title="Policy Gradient — REINFORCE shifts the distribution toward reward" number="12.3" tryThis={tryThis}>

      {/* full-width canvas */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '280px',
                   borderRadius: '6px', background: '#0a0a0a' }}
        />
        {popup && (
          <div
            key={popup.key}
            style={{
              position: 'absolute',
              left: `calc(${(44 - popupFrac * 60).toFixed(1)}px + ${(popupFrac * 100).toFixed(1)}%)`,
              bottom: '36px',
              pointerEvents: 'none',
              fontFamily: MONO, fontSize: '11px', fontWeight: 600,
              color: popup.r > 0.5 ? CLR.green : popup.r < 0 ? CLR.red : CLR.muted,
              animation: 'pg-pop 700ms ease forwards',
            }}
          >
            {popup.r >= 0 ? `+${popup.r.toFixed(2)}` : popup.r.toFixed(2)}
          </div>
        )}
      </div>

      {/* stats strip */}
      <div style={{
        marginTop: '10px',
        display: 'flex', gap: '0', alignItems: 'stretch',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '8px', overflow: 'hidden',
      }}>
        {/* Policy */}
        <div style={{ flex: 1, display: 'flex', gap: '10px', padding: '10px 14px', alignItems: 'flex-end' }}>
          {cell('μ', mu.toFixed(3))}
          {cell('σ', sigma.toFixed(3))}
          {cell('|μ−0.6|', distToOpt.toFixed(3), distToOpt < 0.05 ? CLR.green : 'var(--accent)')}
        </div>
        {vdiv}
        {/* Training */}
        <div style={{ flex: 1, display: 'flex', gap: '10px', padding: '10px 14px', alignItems: 'flex-end' }}>
          {cell('Rollouts', totalRollouts)}
          {cell('Batch', batchSize)}
          {cell('Baseline', baseline.toFixed(3))}
        </div>
        {vdiv}
        {/* Last rollout */}
        <div style={{ flex: 1, display: 'flex', gap: '10px', padding: '10px 14px', alignItems: 'flex-end' }}>
          {cell('Sampled a', lastRollout ? lastRollout.a.toFixed(3) : '—')}
          {cell('R(a)',
            lastRollout ? lastRollout.r.toFixed(3) : '—',
            lastRollout ? (lastRollout.r > 0.5 ? CLR.green : lastRollout.r < 0 ? CLR.red : 'var(--accent)') : 'var(--text-muted)'
          )}
          {cell('A',
            lastRollout ? lastRollout.A.toFixed(3) : '—',
            lastRollout ? (lastRollout.A > 0 ? CLR.green : CLR.red) : 'var(--text-muted)'
          )}
          {cell('Converged', converged ? 'yes' : 'no', converged ? CLR.green : 'var(--text-muted)')}
        </div>
      </div>

      {/* controls */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => doSteps(1)} style={btn(false)}>Rollout</button>
        <button onClick={() => doSteps(10)} style={btn(false)}>Rollout ×10</button>
        <button onClick={reset} style={btn(false)}>Reset</button>

        <div style={{ width: 1, height: 18, background: 'var(--border)', alignSelf: 'center', margin: '0 2px' }} />

        <span style={{ ...mono, fontSize: '10px', color: 'var(--text-muted)' }}>Batch:</span>
        {[1, 5, 10].map(n => (
          <button
            key={n}
            onClick={() => { setBatchSize(n); batchSizeRef.current = n; }}
            style={{ ...btn(batchSize === n), padding: '5px 8px' }}
          >
            {n}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button onClick={() => setShowReward(v => !v)} style={btn(showReward)}>
          {showReward ? 'R(a) on' : 'R(a) off'}
        </button>
        <button onClick={() => setShowTicks(v => !v)} style={btn(showTicks)}>
          {showTicks ? 'ticks on' : 'ticks off'}
        </button>
      </div>
    </WidgetCard>
  );
}
