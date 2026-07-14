import { useRef, useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

// ── PRNG (identical construction to ForwardDiffusion; independent seeds) ──────
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function randn(rng) {
  const u = 1 - rng(), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── Data distribution — mirrors ForwardDiffusion's generatePoints(): a
//    3-component isotropic Gaussian mixture, std sigma0, ~equal weights ──────
const GMM = [
  { mu: [-1.5, -1.5], n: 67, color: '#2dd4bf' },
  { mu: [ 1.5, -1.5], n: 67, color: '#fb923c' },
  { mu: [ 0.0,  1.8], n: 66, color: '#a78bfa' },
];
const SIGMA0   = 0.4;
const N_PTS    = GMM.reduce((s, c) => s + c.n, 0); // 200
const GMM_LOGW = GMM.map(c => Math.log(c.n / N_PTS));

function buildAlphaBar() {
  const T = 1000, ab = new Float64Array(T + 1);
  ab[0] = 1.0;
  for (let t = 1; t <= T; t++) {
    const beta = 0.0001 + t * (0.02 - 0.0001) / T;
    ab[t] = ab[t - 1] * (1 - beta);
  }
  return ab;
}
const AB = buildAlphaBar();

// ── Exact score of the noised marginal q(x_t) = Σ_k w_k N(x_t; √ᾱ_t μ_k, v_t I),
//    v_t = ᾱ_t σ0² + (1 − ᾱ_t). r_k is the standard Gaussian-mixture posterior
//    responsibility (softmax over negative squared distances). ───────────────
function respAndScore(x, y, t) {
  const ab_t = AB[t];
  const v_t  = ab_t * SIGMA0 * SIGMA0 + (1 - ab_t);
  const ss   = Math.sqrt(ab_t);
  const logw = new Array(GMM.length);
  let maxLw = -Infinity;
  for (let k = 0; k < GMM.length; k++) {
    const mx = ss * GMM[k].mu[0], my = ss * GMM[k].mu[1];
    const dx = x - mx, dy = y - my;
    const lw = GMM_LOGW[k] - (dx * dx + dy * dy) / (2 * v_t);
    logw[k] = lw;
    if (lw > maxLw) maxLw = lw;
  }
  let sumExp = 0;
  const resp = new Array(GMM.length);
  for (let k = 0; k < GMM.length; k++) { resp[k] = Math.exp(logw[k] - maxLw); sumExp += resp[k]; }
  let sx = 0, sy = 0;
  for (let k = 0; k < GMM.length; k++) {
    resp[k] /= sumExp;
    const mx = ss * GMM[k].mu[0], my = ss * GMM[k].mu[1];
    sx += resp[k] * (-(x - mx) / v_t);
    sy += resp[k] * (-(y - my) / v_t);
  }
  return { resp, sx, sy };
}

// eps_theta(x_t, t) = -√(1-ᾱ_t) · score(x_t, t) — the analytic "oracle" noise
// prediction a perfectly-trained network would output for this toy density.
function epsThetaAt(x, y, t) {
  const { sx, sy } = respAndScore(x, y, t);
  const sn = Math.sqrt(1 - AB[t]);
  return [-sn * sx, -sn * sy];
}

// ── Independent pure-noise starting points — NOT derived from any known x_0.
//    A real generative sampler starts from unlabeled N(0,I) noise. ───────────
function generateXT(n, seed) {
  const rng = mulberry32(seed);
  const x = new Float64Array(n), y = new Float64Array(n);
  for (let i = 0; i < n; i++) { x[i] = randn(rng); y[i] = randn(rng); }
  return { x, y };
}

// ── DDPM ancestral sampling, every t: 1000 → 1 ────────────────────────────────
//    x_{t-1} = (1/√α_t)(x_t − (β_t/√(1-ᾱ_t)) ε_θ(x_t,t)) + σ_t z, σ_t² = β_t,
//    z = 0 at the final step (t=1), matching Ho et al. Algorithm 2.
function buildDdpmTrajectory(xt, zSeed) {
  const T = 1000;
  const rng = mulberry32(zSeed);
  const trajX = new Float32Array((T + 1) * N_PTS);
  const trajY = new Float32Array((T + 1) * N_PTS);
  for (let i = 0; i < N_PTS; i++) { trajX[T * N_PTS + i] = xt.x[i]; trajY[T * N_PTS + i] = xt.y[i]; }
  for (let t = T; t >= 1; t--) {
    const ab_t = AB[t], ab_prev = AB[t - 1];
    const alpha_t = ab_t / ab_prev;
    const beta_t  = 1 - alpha_t;
    const invSqrtAlpha = 1 / Math.sqrt(alpha_t);
    const sqrt1mAbt = Math.sqrt(1 - ab_t);
    const sigma_t = Math.sqrt(beta_t);
    const rowIn = t * N_PTS, rowOut = (t - 1) * N_PTS;
    for (let i = 0; i < N_PTS; i++) {
      const x = trajX[rowIn + i], y = trajY[rowIn + i];
      const [ex, ey] = epsThetaAt(x, y, t);
      const meanX = invSqrtAlpha * (x - (beta_t / sqrt1mAbt) * ex);
      const meanY = invSqrtAlpha * (y - (beta_t / sqrt1mAbt) * ey);
      const zx = t > 1 ? randn(rng) : 0;
      const zy = t > 1 ? randn(rng) : 0;
      trajX[rowOut + i] = meanX + sigma_t * zx;
      trajY[rowOut + i] = meanY + sigma_t * zy;
    }
  }
  return { trajX, trajY };
}

// ── DDIM deterministic sampling, stride Δ ─────────────────────────────────────
//    x0_hat = (x_t − √(1-ᾱ_t) ε_θ) / √ᾱ_t
//    x_{t-Δ} = √ᾱ_{t-Δ} x0_hat + √(1-ᾱ_{t-Δ}) ε_θ
function buildDdimTrajectory(xt, stride) {
  const T = 1000, nSteps = T / stride; // 50
  const trajX = new Float32Array((nSteps + 1) * N_PTS);
  const trajY = new Float32Array((nSteps + 1) * N_PTS);
  for (let i = 0; i < N_PTS; i++) { trajX[i] = xt.x[i]; trajY[i] = xt.y[i]; }
  for (let m = 0; m < nSteps; m++) {
    const t = T - m * stride, tPrev = t - stride;
    const ab_t = AB[t], ab_prev = AB[tPrev];
    const sqrtAbt = Math.sqrt(ab_t), sqrt1mAbt = Math.sqrt(1 - ab_t);
    const sqrtAbPrev = Math.sqrt(ab_prev), sqrt1mAbPrev = Math.sqrt(1 - ab_prev);
    const rowIn = m * N_PTS, rowOut = (m + 1) * N_PTS;
    for (let i = 0; i < N_PTS; i++) {
      const x = trajX[rowIn + i], y = trajY[rowIn + i];
      const [ex, ey] = epsThetaAt(x, y, t);
      const x0x = (x - sqrt1mAbt * ex) / sqrtAbt;
      const x0y = (y - sqrt1mAbt * ey) / sqrtAbt;
      trajX[rowOut + i] = sqrtAbPrev * x0x + sqrt1mAbPrev * ex;
      trajY[rowOut + i] = sqrtAbPrev * x0y + sqrt1mAbPrev * ey;
    }
  }
  return { trajX, trajY };
}

// Color a point by whichever mixture component it's closest to (its posterior
// responsibility at t=0) once generation has completed — a real sampler only
// learns a point's identity after the fact, never from a pre-assigned label.
function finalColors(trajX, trajY, finalIdx) {
  const base = finalIdx * N_PTS;
  const colors = new Array(N_PTS);
  for (let i = 0; i < N_PTS; i++) {
    const { resp } = respAndScore(trajX[base + i], trajY[base + i], 0);
    let best = 0;
    for (let k = 1; k < resp.length; k++) if (resp[k] > resp[best]) best = k;
    colors[i] = GMM[best].color;
  }
  return colors;
}

function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function lerpColor(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

// ── Module-level: two independent reverse trajectories, each seeded from its
//    own fresh N(0,I) draw — never from a known x_0 or a fixed forward eps ────
const XT_DDPM = generateXT(N_PTS, 77);
const XT_DDIM = generateXT(N_PTS, 78);
const DDPM = buildDdpmTrajectory(XT_DDPM, 88);
const DDIM = buildDdimTrajectory(XT_DDIM, 20);
DDPM.colors = finalColors(DDPM.trajX, DDPM.trajY, 1000);
DDIM.colors = finalColors(DDIM.trajX, DDIM.trajY, 50);

// ── Per-panel canvas coordinate space ─────────────────────────────────────────
const PCW = 220, PCH = 240, PPAD = 12;
const PDW = PCW - 2 * PPAD; // 196
const PDH = PCH - 2 * PPAD; // 216

function pX(x) { return PPAD + (x + 4) / 8 * PDW; }
function pY(y) { return PPAD + (4 - y) / 8 * PDH; }

function drawPanel(canvas, trajX, trajY, colors, idx, tForColor) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  if (canvas.width !== Math.round(rect.width * dpr)) {
    canvas.width  = Math.round(rect.width  * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  const sx = w / PCW, sy = h / PCH;

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#1e1e1e';
  ctx.lineWidth = 0.5;
  for (let v = -3; v <= 3; v++) {
    const cx = pX(v) * sx;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    const cy = pY(v) * sy;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  }

  const colorT = tForColor / 1000;
  const opacity = 1 - 0.3 * colorT;
  const r = 2.5 * Math.min(sx, sy);
  const base = idx * N_PTS;

  for (let i = 0; i < N_PTS; i++) {
    const px = trajX[base + i];
    const py = trajY[base + i];
    ctx.globalAlpha = opacity;
    ctx.fillStyle = lerpColor(colors[i], '#555555', colorT);
    ctx.beginPath();
    ctx.arc(pX(px) * sx, pY(py) * sy, r, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export default function ReverseDenoising({ tryThis }) {
  const leftRef  = useRef(null);
  const rightRef = useRef(null);
  const animRef  = useRef(null);
  const speedRef = useRef(1);

  // Pause the continuous play loop when scrolled off-screen; never auto-run for reduced motion.
  const [cardRef, isVisible] = useIsVisible();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisibleRef         = useRef(true);
  isVisibleRef.current = isVisible;

  const [progress,  setProgress]  = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed,     setSpeed]     = useState(1);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Derived values
  const tDdpm     = Math.round(1000 * (1 - progress));
  const tDdim     = Math.round((1 - progress) * 50) * 20;
  const stepsDdpm = 1000 - tDdpm;
  const stepsDdim = (1000 - tDdim) / 20;
  const ab_ddpm   = AB[tDdpm];
  const ab_ddim   = AB[tDdim];

  // Canvas redraw whenever progress changes — index straight into the
  // precomputed reverse-sampler trajectories (DDPM by timestep, DDIM by step).
  useEffect(() => {
    const tDdpmNow = Math.round(1000 * (1 - progress));
    const tDdimNow = Math.round((1 - progress) * 50) * 20;
    const mDdim    = (1000 - tDdimNow) / 20;
    drawPanel(leftRef.current,  DDPM.trajX, DDPM.trajY, DDPM.colors, tDdpmNow, tDdpmNow);
    drawPanel(rightRef.current, DDIM.trajX, DDIM.trajY, DDIM.colors, mDdim,    tDdimNow);
  }, [progress]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !isVisibleRef.current) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const animate = () => {
      setProgress(p => {
        const next = p + speedRef.current / 360;
        if (next >= 1) { setIsPlaying(false); return 1; }
        return next;
      });
      if (isVisibleRef.current) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        animRef.current = null; // off-screen: this effect resumes the loop when it scrolls back in
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying, speed, isVisible]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  const handlePlay = () => {
    if (prefersReducedMotion) return;
    if (isPlaying) { setIsPlaying(false); return; }
    if (progress >= 1) setProgress(0);
    setIsPlaying(true);
  };

  const handleReset = () => { setIsPlaying(false); setProgress(0); };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const mono    = { fontFamily: "'JetBrains Mono', monospace" };
  const sKey    = { ...mono, fontSize: '10px', color: '#555555', marginBottom: '2px' };
  const sValT   = { ...mono, fontSize: '13px', color: '#2dd4bf' };
  const sValP   = { ...mono, fontSize: '13px', color: '#a78bfa' };
  const hr      = { borderTop: '1px solid #242424', margin: '8px 0' };
  const btnBase = { ...mono, fontSize: '11px', padding: '5px 14px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #242424', background: '#161616', color: '#e8eaed' };
  const tabBase = { ...mono, fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #242424', background: '#111111', color: '#888888' };
  const tabAct  = { ...tabBase, background: '#0b2422', color: '#2dd4bf', borderColor: '#2dd4bf' };

  return (
    <WidgetCard ref={cardRef} title="Reverse Denoising — DDPM vs DDIM" number="20.2" tryThis={tryThis}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* ── Left: two panels + NFE + scrubber + controls ─────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Two canvas panels */}
          <div style={{ display: 'flex', gap: '20px' }}>

            {/* DDPM panel */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ textAlign: 'center', fontFamily: "'Crimson Pro', serif", fontSize: '15px', color: '#e8eaed', marginBottom: '2px' }}>
                DDPM
              </div>
              <div style={{ textAlign: 'center', ...mono, fontSize: '10px', color: '#555555', marginBottom: '6px' }}>
                1000 steps
              </div>
              <canvas
                ref={leftRef}
                style={{ width: '100%', aspectRatio: `${PCW}/${PCH}`, display: 'block', borderRadius: '4px' }}
              />
              <div style={{ textAlign: 'center', ...mono, fontSize: '11px', color: '#888888', marginTop: '6px' }}>
                Step {stepsDdpm} / 1000
              </div>
              <div style={{ height: '4px', borderRadius: '2px', background: '#2e2e2e', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '2px', background: '#2dd4bf', width: `${progress * 100}%` }} />
              </div>
            </div>

            {/* DDIM panel */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ textAlign: 'center', fontFamily: "'Crimson Pro', serif", fontSize: '15px', color: '#e8eaed', marginBottom: '2px' }}>
                DDIM
              </div>
              <div style={{ textAlign: 'center', ...mono, fontSize: '10px', color: '#555555', marginBottom: '6px' }}>
                50 steps
              </div>
              <canvas
                ref={rightRef}
                style={{ width: '100%', aspectRatio: `${PCW}/${PCH}`, display: 'block', borderRadius: '4px' }}
              />
              <div style={{ textAlign: 'center', ...mono, fontSize: '11px', color: '#888888', marginTop: '6px' }}>
                Step {stepsDdim} / 50
              </div>
              <div style={{ height: '4px', borderRadius: '2px', background: '#2e2e2e', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '2px', background: '#a78bfa', width: `${progress * 100}%` }} />
              </div>
            </div>

          </div>

          {/* NFE display */}
          <div style={{ marginTop: '12px', background: '#0d0d0d', border: '1px solid #242424', borderRadius: '6px', padding: '10px 14px' }}>
            <div style={{ ...mono, fontSize: '10px', color: '#555555', marginBottom: '6px' }}>
              Neural function evaluations (NFE):
            </div>
            <div style={{ display: 'flex', gap: '28px', alignItems: 'baseline' }}>
              <div>
                <span style={{ ...mono, fontSize: '10px', color: '#555555' }}>DDPM </span>
                <span style={{ ...mono, fontSize: '14px', color: '#2dd4bf' }}>{stepsDdpm}</span>
                <span style={{ ...mono, fontSize: '10px', color: '#555555' }}> / 1000</span>
              </div>
              <div>
                <span style={{ ...mono, fontSize: '10px', color: '#555555' }}>DDIM </span>
                <span style={{ ...mono, fontSize: '14px', color: '#a78bfa' }}>{stepsDdim}</span>
                <span style={{ ...mono, fontSize: '10px', color: '#555555' }}> / 50</span>
              </div>
            </div>
            <div style={{ ...mono, fontSize: '10px', color: '#888888', marginTop: '6px' }}>
              DDIM uses 5% of the NFE of DDPM for comparable quality.
            </div>
          </div>

          {/* Shared progress scrubber */}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ ...mono, fontSize: '11px', color: '#555555', flexShrink: 0, minWidth: 104 }}>
              Progress = {Math.round(progress * 100)}%
            </span>
            <input
              type="range" min={0} max={1} step={0.01} value={progress}
              onChange={e => { setIsPlaying(false); setProgress(Number(e.target.value)); }}
              style={{ flex: 1, minWidth: 80, accentColor: '#2dd4bf', cursor: 'pointer' }}
            />
          </div>

          {/* Controls */}
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              disabled={prefersReducedMotion}
              title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
              style={{
                ...btnBase,
                cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
                opacity: prefersReducedMotion ? 0.5 : 1,
              }}
              onClick={handlePlay}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button style={btnBase} onClick={handleReset}>↺ Reset</button>
            <div style={{ width: 1, background: '#242424', alignSelf: 'stretch' }} />
            <span style={{ ...mono, fontSize: '11px', color: '#555555' }}>Speed</span>
            {[1, 5, 10].map(s => (
              <button key={s} style={speed === s ? tabAct : tabBase} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </div>

        </div>

        {/* ── Stats panel ───────────────────────────────────────────────── */}
        <div style={{
          width: 180, flexShrink: 0,
          background: '#111111', border: '1px solid #242424',
          borderRadius: '8px', padding: '14px 16px',
        }}>
          <div style={sKey}>Progress</div>
          <div style={sValT}>{Math.round(progress * 100)}%</div>

          <div style={hr} />

          <div style={{ ...mono, fontSize: '10px', color: '#2dd4bf', fontWeight: 600, marginBottom: '6px' }}>DDPM</div>
          <div style={sKey}>Current t</div>
          <div style={sValT}>{tDdpm}</div>
          <div style={{ ...sKey, marginTop: '6px' }}>Steps taken</div>
          <div style={{ ...mono, fontSize: '11px', color: '#888888' }}>{stepsDdpm} / 1000</div>
          <div style={{ ...sKey, marginTop: '6px' }}>NFE</div>
          <div style={sValT}>{stepsDdpm}</div>

          <div style={hr} />

          <div style={{ ...mono, fontSize: '10px', color: '#a78bfa', fontWeight: 600, marginBottom: '6px' }}>DDIM</div>
          <div style={sKey}>Current t</div>
          <div style={sValP}>{tDdim}</div>
          <div style={{ ...sKey, marginTop: '6px' }}>Steps taken</div>
          <div style={{ ...mono, fontSize: '11px', color: '#888888' }}>{stepsDdim} / 50</div>
          <div style={{ ...sKey, marginTop: '6px' }}>NFE</div>
          <div style={sValP}>{stepsDdim}</div>

          <div style={hr} />

          <div style={sKey}>NFE ratio</div>
          <div style={{ ...mono, fontSize: '12px', color: '#fbbf24' }}>
            {stepsDdpm > 0 ? `${(stepsDdim / stepsDdpm * 100).toFixed(1)}%` : '—'}
          </div>

          <div style={hr} />

          <div style={sKey}>DDPM ᾱ_t</div>
          <div style={{ ...mono, fontSize: '11px', color: '#2dd4bf' }}>{ab_ddpm.toFixed(4)}</div>
          <div style={{ ...sKey, marginTop: '6px' }}>DDIM ᾱ_t</div>
          <div style={{ ...mono, fontSize: '11px', color: '#a78bfa' }}>{ab_ddim.toFixed(4)}</div>
        </div>

      </div>
    </WidgetCard>
  );
}
