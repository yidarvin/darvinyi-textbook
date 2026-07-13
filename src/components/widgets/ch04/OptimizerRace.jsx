import { useRef, useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

const W = 620, H = 340;

const OPTS = [
  { key: 'sgd',      label: 'SGD',      color: '#888888' },
  { key: 'momentum', label: 'Momentum', color: '#fb923c' },
  { key: 'rmsprop',  label: 'RMSProp',  color: '#a78bfa' },
  { key: 'adam',     label: 'Adam',     color: '#2dd4bf' },
];

const SURFACES = {
  'two-valleys': {
    f(x, y) {
      const g = 3*(x-0.25)**2 + 5*(y-0.5)**2;
      const l = 4*(x-0.75)**2 + 5*(y-0.5)**2 + 0.4;
      return Math.min(g, l) + 0.08 * Math.sin(12*x) * Math.sin(8*y) * 0.15;
    },
    start: [0.8, 0.2],
  },
  'saddle': {
    f(x, y) {
      const cx = x - 0.5, cy = y - 0.5;
      return 2*cx*cx - 2*cy*cy + 0.5 + 0.3*Math.sin(4*x)*Math.cos(4*y)*0.2;
    },
    start: [0.52, 0.52],
  },
  'ravine': {
    f(x, y) {
      return 10*(y - x*x)**2 + (1-x)**2 * 0.5 + 0.05*Math.sin(16*x)*Math.sin(16*y)*0.1;
    },
    start: [0.1, 0.9],
  },
};

function lossColor(t) {
  t = Math.max(0, Math.min(1, t));
  if (t < 0.5) {
    const s = t / 0.5;
    return [Math.round(10 + s*30), Math.round(20 + s*100), Math.round(40 + s*80)];
  }
  const s = (t - 0.5) / 0.5;
  return [Math.round(40 + s*211), Math.round(120 - s*60), Math.round(120 - s*100)];
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3), 16), parseInt(hex.slice(3,5), 16), parseInt(hex.slice(5,7), 16)];
}

function makeState(x, y) {
  return {
    sgd:      { x, y, trail: [{ x, y }] },
    momentum: { x, y, vx: 0, vy: 0, trail: [{ x, y }] },
    rmsprop:  { x, y, vx: 0, vy: 0, trail: [{ x, y }] },
    adam:     { x, y, mx: 0, my: 0, vx: 0, vy: 0, t: 0, trail: [{ x, y }] },
  };
}

export default function OptimizerRace({ tryThis }) {
  const canvasRef     = useRef(null);
  const animRef       = useRef(null);
  const optsRef       = useRef(null);
  const cachedImgRef  = useRef(null);
  const cachedSurfRef = useRef(null);
  const surfaceRef    = useRef('two-valleys');
  const lrRef         = useRef(0.05);
  const playingRef    = useRef(false);
  const stepRef       = useRef(0);

  // Pause the continuous play loop when scrolled off-screen; never auto-run for reduced motion.
  const [cardRef, isVisible]   = useIsVisible();
  const prefersReducedMotion   = usePrefersReducedMotion();
  const isVisibleRef           = useRef(true);
  isVisibleRef.current = isVisible;

  const [playing, setPlaying] = useState(false);
  const [surface, setSurface] = useState('two-valleys');
  const [lr, setLr]           = useState(0.05);
  const [dispStep, setDispStep] = useState(0);
  const [dispLoss, setDispLoss] = useState(
    Object.fromEntries(OPTS.map(o => [o.key, null]))
  );

  // ── Resume the loop if it scrolls back into view mid-play ─────
  useEffect(() => {
    if (isVisible && playingRef.current && !animRef.current) {
      animRef.current = requestAnimationFrame(doAnimate);
    }
  }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Canvas setup ──────────────────────────────────────────────
  useEffect(() => {
    const c = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    c.width  = W * dpr;
    c.height = H * dpr;
    c.getContext('2d').scale(dpr, dpr);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ── Surface change: invalidate cache, reset all ───────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    cachedSurfRef.current = null;
    surfaceRef.current = surface;
    doStopPlay();
    initAll(...SURFACES[surface].start);
  }, [surface]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Landscape rendering ───────────────────────────────────────
  function buildLandscape() {
    const surf = surfaceRef.current;
    if (cachedSurfRef.current === surf) return;
    cachedSurfRef.current = surf;

    const res = 3, cols = Math.ceil(W/res), rows = Math.ceil(H/res);
    let minL = Infinity, maxL = -Infinity;
    const vals = [];
    const f = SURFACES[surf].f;

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const v = f(c/cols, r/rows);
        vals.push(v);
        if (v < minL) minL = v;
        if (v > maxL) maxL = v;
      }

    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const oc = off.getContext('2d');
    const img = oc.createImageData(W, H);

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const t = (vals[r*cols+c] - minL) / (maxL - minL + 1e-9);
        const [rr, gg, bb] = lossColor(t);
        for (let pr = 0; pr < res && r*res+pr < H; pr++)
          for (let pc = 0; pc < res && c*res+pc < W; pc++) {
            const idx = ((r*res+pr)*W + c*res+pc) * 4;
            img.data[idx] = rr; img.data[idx+1] = gg;
            img.data[idx+2] = bb; img.data[idx+3] = 255;
          }
      }
    oc.putImageData(img, 0, 0);

    for (let ci = 0; ci <= 12; ci++) {
      const thresh = minL + (ci/12) * (maxL - minL);
      for (let r = 1; r < rows-1; r++)
        for (let c = 1; c < cols-1; c++)
          if ((vals[r*cols+c] < thresh) !== (vals[r*cols+c+1] < thresh)) {
            oc.beginPath();
            oc.arc(c*res + res/2, r*res + res/2, 0.6, 0, Math.PI*2);
            oc.fillStyle = 'rgba(0,0,0,0.4)'; oc.fill();
          }
    }
    cachedImgRef.current = off;
  }

  function drawFrame() {
    const c = canvasRef.current;
    if (!c) return;
    buildLandscape();
    const ctx = c.getContext('2d');
    ctx.drawImage(cachedImgRef.current, 0, 0, W, H);

    const state = optsRef.current;
    if (!state) return;

    // Trails (draw all before balls so balls render on top)
    OPTS.forEach(({ key, color }) => {
      const [r, g, b] = hexToRgb(color);
      const trail = state[key].trail;
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i-1], bp = trail[i];
        const op = 0.1 + 0.5 * (i / trail.length);
        ctx.beginPath();
        ctx.moveTo(a.x*W, a.y*H);
        ctx.lineTo(bp.x*W, bp.y*H);
        ctx.strokeStyle = `rgba(${r},${g},${b},${op.toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // Balls
    OPTS.forEach(({ key, color }) => {
      const [r, g, b] = hexToRgb(color);
      const s = state[key];
      const px = s.x*W, py = s.y*H;
      const grd = ctx.createRadialGradient(px, py, 0, px, py, 14);
      grd.addColorStop(0, `rgba(${r},${g},${b},0.3)`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI*2);
      ctx.fillStyle = grd; ctx.fill();

      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1;
      ctx.fill(); ctx.stroke();
    });
  }

  // ── Optimizer math ────────────────────────────────────────────
  function grad(x, y) {
    const h = 0.002, f = SURFACES[surfaceRef.current].f;
    return [(f(x+h,y)-f(x-h,y))/(2*h), (f(x,y+h)-f(x,y-h))/(2*h)];
  }

  function clamp(v) { return Math.max(0.01, Math.min(0.99, v)); }

  function initAll(nx, ny) {
    nx = clamp(nx); ny = clamp(ny);
    optsRef.current = makeState(nx, ny);
    stepRef.current = 0;
    const loss = SURFACES[surfaceRef.current].f(nx, ny);
    setDispStep(0);
    setDispLoss(Object.fromEntries(OPTS.map(o => [o.key, loss])));
    drawFrame();
  }

  function doStep() {
    const state = optsRef.current;
    const lr = lrRef.current;

    { // SGD: Δ = lr * grad
      const s = state.sgd;
      const [gx, gy] = grad(s.x, s.y);
      s.x = clamp(s.x - lr*gx);
      s.y = clamp(s.y - lr*gy);
      s.trail.push({ x: s.x, y: s.y });
    }

    { // Momentum: v = 0.85*v + lr*grad; Δ = v
      const s = state.momentum;
      const [gx, gy] = grad(s.x, s.y);
      s.vx = 0.85*s.vx + lr*gx;
      s.vy = 0.85*s.vy + lr*gy;
      s.x = clamp(s.x - s.vx);
      s.y = clamp(s.y - s.vy);
      s.trail.push({ x: s.x, y: s.y });
    }

    { // RMSProp: v = 0.9*v + 0.1*grad²; Δ = lr*grad / (√v + ε)
      const s = state.rmsprop;
      const [gx, gy] = grad(s.x, s.y);
      s.vx = 0.9*s.vx + 0.1*gx*gx;
      s.vy = 0.9*s.vy + 0.1*gy*gy;
      s.x = clamp(s.x - lr*gx / (Math.sqrt(s.vx) + 1e-8));
      s.y = clamp(s.y - lr*gy / (Math.sqrt(s.vy) + 1e-8));
      s.trail.push({ x: s.x, y: s.y });
    }

    { // Adam: bias-corrected first & second moments
      const s = state.adam;
      const [gx, gy] = grad(s.x, s.y);
      s.t++;
      s.mx = 0.9*s.mx + 0.1*gx;
      s.my = 0.9*s.my + 0.1*gy;
      s.vx = 0.999*s.vx + 0.001*gx*gx;
      s.vy = 0.999*s.vy + 0.001*gy*gy;
      const mhx = s.mx / (1 - 0.9**s.t);
      const mhy = s.my / (1 - 0.9**s.t);
      const vhx = s.vx / (1 - 0.999**s.t);
      const vhy = s.vy / (1 - 0.999**s.t);
      s.x = clamp(s.x - lr * mhx / (Math.sqrt(vhx) + 1e-8));
      s.y = clamp(s.y - lr * mhy / (Math.sqrt(vhy) + 1e-8));
      s.trail.push({ x: s.x, y: s.y });
    }

    stepRef.current++;
  }

  function syncStats() {
    const state = optsRef.current;
    if (!state) return;
    const f = SURFACES[surfaceRef.current].f;
    setDispLoss(Object.fromEntries(OPTS.map(({ key }) => [key, f(state[key].x, state[key].y)])));
    setDispStep(stepRef.current);
  }

  // ── Animation loop ────────────────────────────────────────────
  function doAnimate() {
    for (let i = 0; i < 3; i++) doStep();
    drawFrame();
    syncStats();
    if (playingRef.current && isVisibleRef.current) {
      animRef.current = requestAnimationFrame(doAnimate);
    } else {
      animRef.current = null; // off-screen: the visibility effect resumes this when it scrolls back in
    }
  }

  function doStopPlay() {
    playingRef.current = false;
    setPlaying(false);
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }

  function doStartPlay() {
    if (prefersReducedMotion) return; // reduced motion: no continuous auto-play
    if (!optsRef.current) initAll(...SURFACES[surfaceRef.current].start);
    playingRef.current = true;
    setPlaying(true);
    animRef.current = requestAnimationFrame(doAnimate);
  }

  function doReset() {
    doStopPlay();
    cachedSurfRef.current = null;
    initAll(...SURFACES[surfaceRef.current].start);
  }

  function handleCanvasClick(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top)  / rect.height;
    doStopPlay();
    initAll(nx, ny);
  }

  // ── Derived display values ────────────────────────────────────
  const lossValues = OPTS.map(o => dispLoss[o.key]);
  const minLoss = lossValues[0] !== null ? Math.min(...lossValues) : null;

  const mono    = { fontFamily: "'JetBrains Mono', monospace" };
  const ctrlLbl = { ...mono, fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '.08em' };

  return (
    <WidgetCard ref={cardRef} title="Optimizer Race — four algorithms, one landscape" number="4.2" tryThis={tryThis}>
      <div style={{ margin: '-20px -18px' }}>
        <div style={{ display: 'flex' }}>

          {/* ── Canvas ─────────────────────────────────────────── */}
          <div style={{
            flex: 1, minWidth: 0,
            background: '#0a0a0a',
            borderRight: '1px solid var(--border)',
            position: 'relative', overflow: 'hidden',
          }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
              onClick={handleCanvasClick}
            />
            {/* Legend overlay */}
            <div style={{
              position: 'absolute', top: 10, left: 12,
              display: 'flex', flexDirection: 'column', gap: 4,
              pointerEvents: 'none',
            }}>
              {OPTS.map(({ key, label, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span style={{ ...mono, fontSize: 9, color: 'rgba(200,200,200,0.65)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel ────────────────────────────────────── */}
          <div style={{ width: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px', gap: 18 }}>

            {/* Stats table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={ctrlLbl}>Loss</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {OPTS.map(({ key, label, color }) => {
                  const loss = dispLoss[key];
                  const isMin = minLoss !== null && loss === minLoss;
                  return (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '5px 8px', borderRadius: 4,
                      background: isMin ? 'rgba(52,211,153,0.07)' : 'transparent',
                      border: `1px solid ${isMin ? 'rgba(52,211,153,0.2)' : 'transparent'}`,
                      transition: 'background .15s, border .15s',
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ ...mono, fontSize: 10, color: '#888', flex: 1 }}>{label}</span>
                      <span style={{ ...mono, fontSize: 11, color: isMin ? 'var(--green)' : '#aaa' }}>
                        {loss !== null ? loss.toFixed(4) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ ...mono, fontSize: 10, color: '#444', paddingLeft: 2 }}>
                step <span style={{ color: 'var(--accent)' }}>{dispStep}</span>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Learning rate */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={ctrlLbl}>Learning Rate</span>
                <span style={{ ...mono, fontSize: 11, color: 'var(--accent)' }}>{lr.toFixed(3)}</span>
              </div>
              <input type="range" min="0.001" max="0.3" step="0.001"
                value={lr}
                onChange={e => { const v = parseFloat(e.target.value); lrRef.current = v; setLr(v); }}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Surface presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={ctrlLbl}>Surface</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[['two-valleys','Two Valleys'],['saddle','Saddle'],['ravine','Ravine']].map(([key, label]) => (
                  <button key={key}
                    onClick={() => { surfaceRef.current = key; setSurface(key); }}
                    style={{
                      ...mono, fontSize: 10,
                      padding: '6px 10px', borderRadius: 5, cursor: 'pointer', textAlign: 'left',
                      background: surface === key ? 'var(--accent-dim)' : 'var(--bg3)',
                      color:      surface === key ? 'var(--accent)'     : '#666',
                      border: `1px solid ${surface === key ? 'var(--accent)' : 'var(--border)'}`,
                      transition: 'all .12s',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Play controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => playingRef.current ? doStopPlay() : doStartPlay()}
                  disabled={prefersReducedMotion}
                  title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
                  style={{
                    flex: 1, ...mono, fontSize: 11,
                    padding: '7px 14px', borderRadius: 5,
                    cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
                    opacity: prefersReducedMotion ? 0.5 : 1,
                    background: 'var(--accent-dim)', color: 'var(--accent)',
                    border: '1px solid var(--accent)', transition: 'all .12s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button onClick={doReset} style={{
                  ...mono, fontSize: 11,
                  padding: '7px 14px', borderRadius: 5, cursor: 'pointer',
                  background: 'var(--bg3)', color: '#999',
                  border: '1px solid var(--border)', transition: 'all .12s',
                }}>↺</button>
              </div>
              <div style={{ fontSize: 10.5, color: '#555', fontStyle: 'italic', lineHeight: 1.5 }}>
                Click landscape to place all four starting points.
              </div>
            </div>

          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
