import { useRef, useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

// ── PRNG (identical seed to ForwardDiffusion) ─────────────────────────────────
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

function generatePoints() {
  const rng = mulberry32(55);
  const pts = [];
  for (const [cx, cy, n, color] of [
    [-1.5, -1.5, 67, '#2dd4bf'],
    [ 1.5, -1.5, 67, '#fb923c'],
    [ 0.0,  1.8, 66, '#a78bfa'],
  ]) {
    for (let i = 0; i < n; i++) {
      pts.push({ x: cx + 0.4 * randn(rng), y: cy + 0.4 * randn(rng), color });
    }
  }
  return pts;
}

function generateEps(n) {
  const rng = mulberry32(66);
  const ex = new Float64Array(n), ey = new Float64Array(n);
  for (let i = 0; i < n; i++) { ex[i] = randn(rng); ey[i] = randn(rng); }
  return { ex, ey };
}

function buildAlphaBar() {
  const T = 1000, ab = new Float64Array(T + 1);
  ab[0] = 1.0;
  for (let t = 1; t <= T; t++) {
    const beta = 0.0001 + t * (0.02 - 0.0001) / T;
    ab[t] = ab[t - 1] * (1 - beta);
  }
  return ab;
}

function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function lerpColor(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

// ── Module-level stable data (same seeds → same points as ForwardDiffusion) ───
const POINTS = generatePoints();
const { ex: EPS_X, ey: EPS_Y } = generateEps(POINTS.length);
const AB = buildAlphaBar();

// ── Per-panel canvas coordinate space ─────────────────────────────────────────
const PCW = 220, PCH = 240, PPAD = 12;
const PDW = PCW - 2 * PPAD; // 196
const PDH = PCH - 2 * PPAD; // 216

function pX(x) { return PPAD + (x + 4) / 8 * PDW; }
function pY(y) { return PPAD + (4 - y) / 8 * PDH; }

function drawPanel(canvas, t) {
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

  const ab_t = AB[t];
  const ss = Math.sqrt(ab_t);
  const sn = Math.sqrt(1 - ab_t);
  const colorT = t / 1000;
  const opacity = 1 - 0.3 * colorT;
  const r = 2.5 * Math.min(sx, sy);

  for (let i = 0; i < POINTS.length; i++) {
    const px = ss * POINTS[i].x + sn * EPS_X[i];
    const py = ss * POINTS[i].y + sn * EPS_Y[i];
    ctx.globalAlpha = opacity;
    ctx.fillStyle = lerpColor(POINTS[i].color, '#555555', colorT);
    ctx.beginPath();
    ctx.arc(pX(px) * sx, pY(py) * sy, r, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export default function ReverseDenoising() {
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

  // Canvas redraw whenever progress changes
  useEffect(() => {
    drawPanel(leftRef.current,  Math.round(1000 * (1 - progress)));
    drawPanel(rightRef.current, Math.round((1 - progress) * 50) * 20);
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
    <WidgetCard ref={cardRef} title="Reverse Denoising — DDPM vs DDIM" number="13.2">
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
