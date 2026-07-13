import { useRef, useState, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

// ── PRNG ──────────────────────────────────────────────────────────────────────
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
  // Box-Muller
  const u = 1 - rng(), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── Initial points (seeded, stable across renders) ───────────────────────────
function generatePoints() {
  const rng = mulberry32(55);
  const points = [];
  const clusters = [
    { cx: -1.5, cy: -1.5, n: 67, color: '#2dd4bf' }, // --accent
    { cx:  1.5, cy: -1.5, n: 67, color: '#fb923c' }, // --orange
    { cx:  0.0, cy:  1.8, n: 66, color: '#a78bfa' }, // --purple
  ];
  for (const { cx, cy, n, color } of clusters) {
    for (let i = 0; i < n; i++) {
      points.push({
        x: cx + 0.4 * randn(rng),
        y: cy + 0.4 * randn(rng),
        color,
        cluster: clusters.indexOf(clusters.find(c => c.color === color)),
      });
    }
  }
  return points;
}

// ── Noise vectors (seeded, stable) ────────────────────────────────────────────
function generateEps(n) {
  const rng = mulberry32(66);
  const ex = new Float64Array(n), ey = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    ex[i] = randn(rng);
    ey[i] = randn(rng);
  }
  return { ex, ey };
}

// ── Alpha-bar schedules ───────────────────────────────────────────────────────
function computeAlphaBar(schedule) {
  const T = 1000;
  const ab = new Float64Array(T + 1);
  ab[0] = 1.0;
  if (schedule === 'linear') {
    for (let t = 1; t <= T; t++) {
      const beta = 0.0001 + t * (0.02 - 0.0001) / T;
      ab[t] = ab[t - 1] * (1 - beta);
    }
  } else {
    const s = 0.008;
    const f = (step) => Math.cos(((step / T) + s) / (1 + s) * Math.PI / 2) ** 2;
    const f0 = f(0);
    for (let t = 1; t <= T; t++) {
      ab[t] = Math.max(0.001, f(t) / f0);
    }
  }
  return ab;
}

// ── Color helpers ─────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerpColor(hex1, hex2, t) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

// ── Coordinate mapping ────────────────────────────────────────────────────────
const CW = 460, CH = 380, PAD = 24;
const DATA_W = CW - 2 * PAD; // 412
const DATA_H = CH - 2 * PAD; // 332

function toCanvasX(x) { return PAD + (x + 4) / 8 * DATA_W; }
function toCanvasY(y) { return PAD + (4 - y) / 8 * DATA_H; }

// ── Qualitative label ─────────────────────────────────────────────────────────
function qualLabel(t) {
  if (t === 0)    return 'Clean data — structure fully visible';
  if (t <= 100)   return 'Light noise — clusters still clear';
  if (t <= 300)   return 'Moderate noise — structure blurring';
  if (t <= 600)   return 'Heavy noise — clusters barely visible';
  if (t <= 900)   return 'Severe noise — structure nearly gone';
  return 'Pure noise — all structure destroyed';
}

// ── Cluster centroid distance ─────────────────────────────────────────────────
function clusterSeparation(points, ab, t, ex, ey) {
  const ab_t = ab[t];
  const ss = Math.sqrt(ab_t), sn = Math.sqrt(1 - ab_t);
  // Each cluster has 67, 67, 66 points
  const sizes = [67, 67, 66];
  const centroids = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  let idx = 0;
  for (let c = 0; c < 3; c++) {
    const n = sizes[c];
    for (let i = 0; i < n; i++, idx++) {
      centroids[c].x += ss * points[idx].x + sn * ex[idx];
      centroids[c].y += ss * points[idx].y + sn * ey[idx];
    }
    centroids[c].x /= n;
    centroids[c].y /= n;
  }
  const d01 = Math.hypot(centroids[0].x - centroids[1].x, centroids[0].y - centroids[1].y);
  const d02 = Math.hypot(centroids[0].x - centroids[2].x, centroids[0].y - centroids[2].y);
  const d12 = Math.hypot(centroids[1].x - centroids[2].x, centroids[1].y - centroids[2].y);
  return (d01 + d02 + d12) / 3;
}

// ── Stable data (generated once outside component) ───────────────────────────
const POINTS = generatePoints();
const { ex: EPS_X, ey: EPS_Y } = generateEps(POINTS.length);

const CLUSTER_CENTERS = [
  { x: -1.5, y: -1.5, label: 'A', color: '#2dd4bf' },
  { x:  1.5, y: -1.5, label: 'B', color: '#fb923c' },
  { x:  0.0, y:  1.8, label: 'C', color: '#a78bfa' },
];

export default function ForwardDiffusion() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  // Pause the continuous play loop when scrolled off-screen; never auto-run for reduced motion.
  const [cardRef, isVisible] = useIsVisible();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisibleRef         = useRef(true);
  isVisibleRef.current = isVisible;

  const [t, setT]           = useState(0);
  const [schedule, setSched] = useState('linear');
  const [playing, setPlaying] = useState(false);
  const [reverse, setReverse] = useState(false);

  // Precompute alpha_bar on schedule change
  const abRef = useRef(computeAlphaBar('linear'));
  useEffect(() => {
    abRef.current = computeAlphaBar(schedule);
  }, [schedule]);

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback((tVal) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;

    // Scale factors from CSS size to canvas coordinate space
    const sx = w / CW, sy = h / CH;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const ab = abRef.current;

    // ── Grid lines ──────────────────────────────────────────────────────────
    ctx.strokeStyle = '#242424';
    ctx.lineWidth = 0.5;
    for (let v = -3; v <= 3; v++) {
      const cx = toCanvasX(v) * sx;
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
      const cy = toCanvasY(v) * sy;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    }

    // ── Axis tick labels ────────────────────────────────────────────────────
    ctx.fillStyle = '#555555';
    ctx.font = `${8 * sx}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = -3; v <= 3; v++) {
      if (v === 0) continue;
      ctx.fillText(String(v), toCanvasX(v) * sx, (toCanvasY(0) + 3) * sy);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = -3; v <= 3; v++) {
      if (v === 0) continue;
      ctx.fillText(String(v), (toCanvasX(0) - 3) * sx, toCanvasY(v) * sy);
    }

    // ── Points ──────────────────────────────────────────────────────────────
    const ab_t   = ab[tVal];
    const ss     = Math.sqrt(ab_t);
    const sn     = Math.sqrt(1 - ab_t);
    const colorT = tVal / 1000;
    const opacity = 1 - 0.3 * colorT;

    for (let i = 0; i < POINTS.length; i++) {
      const px = ss * POINTS[i].x + sn * EPS_X[i];
      const py = ss * POINTS[i].y + sn * EPS_Y[i];
      const cx = toCanvasX(px) * sx;
      const cy = toCanvasY(py) * sy;
      const col = lerpColor(POINTS[i].color, '#666666', colorT);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5 * Math.min(sx, sy), 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Cluster labels ───────────────────────────────────────────────────────
    const labelOpacity = Math.max(0, 1 - tVal / 200);
    if (labelOpacity > 0) {
      ctx.font = `500 ${11 * sx}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const { x, y, label, color } of CLUSTER_CENTERS) {
        ctx.globalAlpha = labelOpacity;
        ctx.fillStyle = color;
        ctx.fillText(label, toCanvasX(x) * sx, toCanvasY(y) * sy);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, []);

  // Redraw on t or schedule change
  useEffect(() => {
    draw(t);
  }, [t, schedule, draw]);

  // ── Animation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !isVisibleRef.current) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    let current = t;
    const step = () => {
      current += reverse ? -4 : 4;
      if (reverse && current <= 0) {
        current = 0;
        setT(0);
        setPlaying(false);
        return;
      }
      if (!reverse && current >= 1000) {
        current = 1000;
        setT(1000);
        setPlaying(false);
        return;
      }
      setT(current);
      if (isVisibleRef.current) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null; // off-screen: this effect resumes the loop when it scrolls back in
      }
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing, reverse, isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  const handlePlay = () => {
    if (prefersReducedMotion) return;
    if (playing) { setPlaying(false); return; }
    if (t >= 1000) setT(0);
    setReverse(false);
    setPlaying(true);
  };

  const handleReverse = () => {
    if (prefersReducedMotion) return;
    if (playing) { setPlaying(false); return; }
    if (t <= 0) setT(1000);
    setReverse(true);
    setPlaying(true);
  };

  const handleReset = () => {
    setPlaying(false);
    setT(0);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const ab = abRef.current;
  const ab_t = ab[t];
  const snr = ab_t < 0.0001 ? 0 : ab_t / (1 - ab_t);
  const sep = clusterSeparation(POINTS, ab, t, EPS_X, EPS_Y);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const monoSm = { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' };
  const statKey = { ...monoSm, color: '#555555', marginBottom: '2px' };
  const statVal = { fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#2dd4bf' };
  const divider = { borderTop: '1px solid #242424', margin: '8px 0' };
  const tabBase = {
    ...monoSm,
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid #242424',
    background: '#111111',
    color: '#888888',
  };
  const tabActive = { ...tabBase, background: '#0b2422', color: '#2dd4bf', borderColor: '#2dd4bf' };
  const btnBase = {
    ...monoSm,
    padding: '5px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid #242424',
    background: '#161616',
    color: '#e8eaed',
  };

  return (
    <WidgetCard ref={cardRef} title="Forward Diffusion — data dissolves into noise" number="13.1">
      {/* Main layout: canvas + stats side-by-side */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', aspectRatio: `${CW}/${CH}`, display: 'block', borderRadius: '6px' }}
          />
        </div>

        {/* Stats panel */}
        <div style={{
          width: 180, flexShrink: 0,
          background: '#111111', border: '1px solid #242424',
          borderRadius: '8px', padding: '14px 16px',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={statKey}>Timestep t</div>
          <div style={statVal}>{t}</div>

          <div style={{ ...statKey, marginTop: '8px' }}>Schedule</div>
          <div style={{ ...statVal, fontSize: '12px', textTransform: 'capitalize' }}>{schedule}</div>

          <div style={divider} />

          <div style={statKey}>alpha_bar_t</div>
          <div style={statVal}>{ab_t.toFixed(4)}</div>

          <div style={{ ...statKey, marginTop: '6px' }}>1 − alpha_bar_t</div>
          <div style={statVal}>{(1 - ab_t).toFixed(4)}</div>

          <div style={{ ...statKey, marginTop: '6px' }}>SNR</div>
          <div style={{ ...statVal, color: snr > 1 ? '#34d399' : snr < 0.01 ? '#f87171' : '#2dd4bf' }}>
            {snr > 999 ? '>999' : snr.toFixed(3)}
          </div>

          <div style={{ ...statKey, marginTop: '6px' }}>√ᾱ_t</div>
          <div style={statVal}>{Math.sqrt(ab_t).toFixed(3)}</div>

          <div style={{ ...statKey, marginTop: '6px' }}>√(1−ᾱ_t)</div>
          <div style={statVal}>{Math.sqrt(1 - ab_t).toFixed(3)}</div>

          <div style={divider} />

          <div style={statKey}>Structure</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#888888', lineHeight: 1.4 }}>
            {t === 0 ? 'Fully visible' :
             t <= 100 ? 'Clusters clear' :
             t <= 300 ? 'Blurring' :
             t <= 600 ? 'Barely visible' :
             t <= 900 ? 'Nearly gone' : 'Destroyed'}
          </div>

          <div style={{ ...statKey, marginTop: '6px' }}>Cluster sep.</div>
          <div style={statVal}>{sep.toFixed(2)}</div>
        </div>
      </div>

      {/* Qualitative label below canvas */}
      <div style={{
        marginTop: '8px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10.5px',
        color: '#888888',
        minHeight: '16px',
      }}>
        {qualLabel(t)}
      </div>

      {/* Controls */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Slider row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...monoSm, color: '#555555', flexShrink: 0 }}>t = {t}</span>
          <input
            type="range" min={0} max={1000} step={1} value={t}
            onChange={e => { setPlaying(false); setT(Number(e.target.value)); }}
            style={{ flex: 1, minWidth: 80, accentColor: '#2dd4bf', cursor: 'pointer' }}
          />
        </div>

        {/* Schedule tabs + play buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ ...monoSm, color: '#555555', flexShrink: 0 }}>Schedule</span>
          <button
            style={schedule === 'linear' ? tabActive : tabBase}
            onClick={() => { setSched('linear'); setPlaying(false); }}
          >Linear</button>
          <button
            style={schedule === 'cosine' ? tabActive : tabBase}
            onClick={() => { setSched('cosine'); setPlaying(false); }}
          >Cosine</button>

          <div style={{ flex: 1 }} />

          <button
            disabled={prefersReducedMotion}
            title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
            style={{
              ...btnBase,
              cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
              opacity: prefersReducedMotion ? 0.5 : 1,
            }}
            onClick={handlePlay}>
            {playing && !reverse ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            disabled={prefersReducedMotion}
            title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
            style={{
              ...btnBase,
              cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
              opacity: prefersReducedMotion ? 0.5 : 1,
            }}
            onClick={handleReverse}>
            {playing && reverse ? '⏸ Pause' : '↩ Reverse'}
          </button>
          <button style={btnBase} onClick={handleReset}>↺ Reset</button>
        </div>
      </div>
    </WidgetCard>
  );
}
