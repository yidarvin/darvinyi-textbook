import { useRef, useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const W = 620, H = 340, LH = 90, STEPS = 200;

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

export default function GradientDescentNavigator() {
  const landscapeRef = useRef(null);
  const losscurveRef = useRef(null);
  const animRef      = useRef(null);

  // Simulation refs (read inside animation loop — avoids stale closures)
  const bxRef      = useRef(undefined);
  const byRef      = useRef(undefined);
  const vxRef      = useRef(0);
  const vyRef      = useRef(0);
  const mxRef      = useRef(0);
  const myRef      = useRef(0);
  const vvxRef     = useRef(0);
  const vvyRef     = useRef(0);
  const adamTRef   = useRef(0);
  const historyRef     = useRef([]);
  const lossHistoryRef = useRef([]);
  const cachedImageRef   = useRef(null);
  const cachedSurfaceRef = useRef(null);

  // Control mirrors (refs for animation loop access)
  const playingRef   = useRef(false);
  const optimizerRef = useRef('sgd');
  const surfaceRef   = useRef('two-valleys');
  const lrRef        = useRef(0.05);
  const speedRef     = useRef(5);

  // Display state
  const [playing,   setPlaying]   = useState(false);
  const [optimizer, setOptimizer] = useState('sgd');
  const [surface,   setSurface]   = useState('two-valleys');
  const [lr,        setLr]        = useState(0.05);
  const [speed,     setSpeed]     = useState(5);
  const [dispStep,  setDispStep]  = useState(0);
  const [dispLoss,  setDispLoss]  = useState(null);
  const [dispGrad,  setDispGrad]  = useState(null);
  const [status,    setStatus]    = useState('ready');

  // ── Canvas setup ──────────────────────────────────────────────
  useEffect(() => {
    const lc  = landscapeRef.current;
    const lcc = losscurveRef.current;
    const dpr = window.devicePixelRatio || 1;
    lc.width  = W * dpr;  lc.height  = H  * dpr;
    lcc.width = W * dpr;  lcc.height = LH * dpr;
    lc.getContext('2d').scale(dpr, dpr);
    lcc.getContext('2d').scale(dpr, dpr);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ── Invalidate cache + reset when surface changes ─────────────
  useEffect(() => {
    if (!landscapeRef.current) return;
    cachedSurfaceRef.current = null;
    surfaceRef.current = surface;
    doStopPlay();
    doInitBall(...SURFACES[surface].start);
    setStatus('ready');
  }, [surface]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drawing ───────────────────────────────────────────────────
  function buildLandscape() {
    const surf = surfaceRef.current;
    if (cachedSurfaceRef.current === surf) return;
    cachedSurfaceRef.current = surf;

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
    const oc  = off.getContext('2d');
    const img = oc.createImageData(W, H);

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const t = (vals[r*cols+c] - minL) / (maxL - minL + 1e-9);
        const [rr, gg, bb] = lossColor(t);
        for (let pr = 0; pr < res && r*res+pr < H; pr++)
          for (let pc = 0; pc < res && c*res+pc < W; pc++) {
            const i = ((r*res+pr)*W + c*res+pc) * 4;
            img.data[i] = rr; img.data[i+1] = gg;
            img.data[i+2] = bb; img.data[i+3] = 255;
          }
      }
    oc.putImageData(img, 0, 0);

    // Contour lines
    oc.lineWidth = 0.8;
    for (let ci = 0; ci <= 12; ci++) {
      const thresh = minL + (ci/12) * (maxL - minL);
      for (let r = 1; r < rows-1; r++)
        for (let c = 1; c < cols-1; c++)
          if ((vals[r*cols+c] < thresh) !== (vals[r*cols+c+1] < thresh)) {
            oc.beginPath();
            oc.arc(c*res + res/2, r*res + res/2, 0.6, 0, Math.PI*2);
            oc.fillStyle = 'rgba(0,0,0,0.4)';
            oc.fill();
          }
    }
    cachedImageRef.current = off;
  }

  function drawFrame() {
    const lc = landscapeRef.current;
    if (!lc) return;
    buildLandscape();
    const ctx = lc.getContext('2d');
    ctx.drawImage(cachedImageRef.current, 0, 0, W, H);

    const hist = historyRef.current;
    if (hist.length > 1) {
      for (let i = 1; i < hist.length; i++) {
        const a = hist[i-1], b = hist[i];
        ctx.beginPath();
        ctx.moveTo(a.x*W, a.y*H);
        ctx.lineTo(b.x*W, b.y*H);
        ctx.strokeStyle = `rgba(45,212,191,${0.15 + 0.6*(i/hist.length)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      for (let i = 0; i < hist.length-1; i += 5) {
        ctx.beginPath();
        ctx.arc(hist[i].x*W, hist[i].y*H, 2, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(45,212,191,0.35)';
        ctx.fill();
      }
    }

    const bx = bxRef.current, by = byRef.current;
    if (bx !== undefined) {
      const px = bx*W, py = by*H;
      const grd = ctx.createRadialGradient(px, py, 0, px, py, 18);
      grd.addColorStop(0, 'rgba(45,212,191,0.4)');
      grd.addColorStop(1, 'rgba(45,212,191,0)');
      ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI*2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI*2);
      ctx.fillStyle = '#2dd4bf'; ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
    }
  }

  function drawLossCurve() {
    const lcc = losscurveRef.current;
    if (!lcc) return;
    const lctx = lcc.getContext('2d');
    lctx.clearRect(0, 0, W, LH);
    lctx.fillStyle = '#0a0a0a';
    lctx.fillRect(0, 0, W, LH);

    const lh = lossHistoryRef.current;
    if (lh.length < 2) return;

    const maxL = Math.max(...lh), minL = Math.min(...lh);
    const range = maxL - minL || 1;
    const pad = 16, cw = W - pad*2, ch = LH - pad*2;

    lctx.strokeStyle = '#1a1a1a'; lctx.lineWidth = 1;
    lctx.beginPath();
    lctx.moveTo(pad, pad+ch/2); lctx.lineTo(pad+cw, pad+ch/2);
    lctx.stroke();

    lctx.beginPath();
    for (let i = 0; i < lh.length; i++) {
      const x = pad + (i/STEPS)*cw;
      const y = pad + ch - ((lh[i]-minL)/range)*ch;
      i === 0 ? lctx.moveTo(x, y) : lctx.lineTo(x, y);
    }
    lctx.strokeStyle = '#2dd4bf'; lctx.lineWidth = 1.5; lctx.stroke();

    const fg = lctx.createLinearGradient(0, pad, 0, pad+ch);
    fg.addColorStop(0, 'rgba(45,212,191,0.2)');
    fg.addColorStop(1, 'rgba(45,212,191,0)');
    lctx.lineTo(pad + ((lh.length-1)/STEPS)*cw, pad+ch);
    lctx.lineTo(pad, pad+ch);
    lctx.closePath();
    lctx.fillStyle = fg; lctx.fill();
  }

  // ── Simulation ────────────────────────────────────────────────
  function computeGrad(x, y) {
    const h = 0.002, f = SURFACES[surfaceRef.current].f;
    return [(f(x+h,y)-f(x-h,y))/(2*h), (f(x,y+h)-f(x,y-h))/(2*h)];
  }

  function doInitBall(nx, ny) {
    bxRef.current  = Math.max(0.01, Math.min(0.99, nx));
    byRef.current  = Math.max(0.01, Math.min(0.99, ny));
    vxRef.current  = 0; vyRef.current  = 0;
    mxRef.current  = 0; myRef.current  = 0;
    vvxRef.current = 0; vvyRef.current = 0;
    adamTRef.current = 0;
    historyRef.current = [];
    lossHistoryRef.current = [];

    const loss = SURFACES[surfaceRef.current].f(bxRef.current, byRef.current);
    historyRef.current.push({ x: bxRef.current, y: byRef.current, loss });
    lossHistoryRef.current.push(loss);

    const [gx, gy] = computeGrad(bxRef.current, byRef.current);
    setDispStep(1);
    setDispLoss(loss);
    setDispGrad(Math.sqrt(gx*gx + gy*gy));
    drawFrame();
    drawLossCurve();
  }

  function doStep() {
    if (historyRef.current.length >= STEPS) {
      doStopPlay();
      setStatus('converged');
      return false;
    }
    const bx = bxRef.current, by = byRef.current;
    const [gx, gy] = computeGrad(bx, by);
    const lr = lrRef.current;
    const opt = optimizerRef.current;

    if (opt === 'sgd') {
      bxRef.current = bx - lr*gx;
      byRef.current = by - lr*gy;
    } else if (opt === 'momentum') {
      const beta = 0.85;
      vxRef.current = beta*vxRef.current + lr*gx;
      vyRef.current = beta*vyRef.current + lr*gy;
      bxRef.current = bx - vxRef.current;
      byRef.current = by - vyRef.current;
    } else {
      // Adam with bias correction
      adamTRef.current++;
      const b1 = 0.9, b2 = 0.999, eps = 1e-8, t = adamTRef.current;
      mxRef.current  = b1*mxRef.current  + (1-b1)*gx;
      myRef.current  = b1*myRef.current  + (1-b1)*gy;
      vvxRef.current = b2*vvxRef.current + (1-b2)*gx*gx;
      vvyRef.current = b2*vvyRef.current + (1-b2)*gy*gy;
      const mxh = mxRef.current  / (1 - b1**t);
      const myh = myRef.current  / (1 - b1**t);
      const vxh = vvxRef.current / (1 - b2**t);
      const vyh = vvyRef.current / (1 - b2**t);
      bxRef.current = bx - lr * mxh / (Math.sqrt(vxh) + eps);
      byRef.current = by - lr * myh / (Math.sqrt(vyh) + eps);
    }

    bxRef.current = Math.max(0.01, Math.min(0.99, bxRef.current));
    byRef.current = Math.max(0.01, Math.min(0.99, byRef.current));

    const loss = SURFACES[surfaceRef.current].f(bxRef.current, byRef.current);
    historyRef.current.push({ x: bxRef.current, y: byRef.current, loss });
    lossHistoryRef.current.push(loss);

    if (loss > 10) {
      doStopPlay();
      setStatus('diverged!');
      return false;
    }
    return true;
  }

  function syncDispStats() {
    const bx = bxRef.current, by = byRef.current;
    if (bx === undefined) return;
    const loss = SURFACES[surfaceRef.current].f(bx, by);
    const [gx, gy] = computeGrad(bx, by);
    setDispStep(historyRef.current.length);
    setDispLoss(loss);
    setDispGrad(Math.sqrt(gx*gx + gy*gy));
  }

  function doAnimate() {
    for (let i = 0; i < speedRef.current; i++) {
      if (!doStep()) {
        drawFrame(); drawLossCurve(); syncDispStats();
        return;
      }
    }
    drawFrame(); drawLossCurve(); syncDispStats();
    if (playingRef.current) animRef.current = requestAnimationFrame(doAnimate);
  }

  function doStopPlay() {
    playingRef.current = false;
    setPlaying(false);
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }

  function doStartPlay() {
    if (bxRef.current === undefined) doInitBall(...SURFACES[surfaceRef.current].start);
    playingRef.current = true;
    setPlaying(true);
    setStatus('running');
    animRef.current = requestAnimationFrame(doAnimate);
  }

  function doReset() {
    doStopPlay();
    cachedSurfaceRef.current = null;
    doInitBall(...SURFACES[surfaceRef.current].start);
    setStatus('ready');
  }

  // ── Handlers ──────────────────────────────────────────────────
  function handleTogglePlay() {
    playingRef.current ? doStopPlay() : doStartPlay();
  }

  function handleOptimizer(opt) {
    optimizerRef.current = opt;
    setOptimizer(opt);
    if (playingRef.current) doReset();
  }

  function handleLR(v) {
    const val = (Number(v) / 100) * 0.5;
    lrRef.current = val; setLr(val);
  }

  function handleSpeed(v) {
    const val = parseInt(v, 10);
    speedRef.current = val; setSpeed(val);
  }

  function handleSurface(s) {
    surfaceRef.current = s;
    setSurface(s); // triggers useEffect([surface])
  }

  function handleCanvasClick(e) {
    const rect = landscapeRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top)  / rect.height;
    doStopPlay();
    doInitBall(nx, ny);
    setStatus('placed');
  }

  // ── Derived colors ────────────────────────────────────────────
  const lossDisplayColor = dispLoss === null ? 'var(--accent)'
    : dispLoss < 0.05 ? 'var(--green)'
    : dispLoss > 2    ? 'var(--red)'
    : 'var(--accent)';

  const statusColor = status === 'converged' ? 'var(--green)'
    : status === 'diverged!' ? 'var(--red)'
    : 'var(--accent)';

  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const ctrlLbl = { ...mono, fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '.08em' };

  // ── Render ────────────────────────────────────────────────────
  return (
    <WidgetCard title="Gradient Descent — navigate a loss landscape" number="3.1">
      {/* Negate WidgetCard body padding so canvas is edge-to-edge */}
      <div style={{ margin: '-20px -18px' }}>
        <div style={{ display: 'flex' }}>

          {/* Left column: landscape + loss curve stacked */}
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column',
          }}>

            {/* Landscape canvas — grows to fill remaining height */}
            <div style={{
              flex: 1,
              background: '#0a0a0a',
              borderRight: '1px solid var(--border)',
              position: 'relative', overflow: 'hidden',
            }}>
              <canvas
                ref={landscapeRef}
                style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
                onClick={handleCanvasClick}
              />
              <div style={{
                position: 'absolute', top: 10, left: 12,
                ...mono, fontSize: 10, color: '#666',
                display: 'flex', flexDirection: 'column', gap: 3,
                pointerEvents: 'none',
              }}>
                <div>step &nbsp;<span style={{ color: 'var(--accent)' }}>{dispStep}</span></div>
                <div>loss &nbsp;<span style={{ color: 'var(--accent)' }}>{dispLoss !== null ? dispLoss.toFixed(4) : '—'}</span></div>
                <div>∇L &nbsp;&nbsp;<span style={{ color: 'var(--accent)' }}>{dispGrad !== null ? dispGrad.toFixed(3) : '—'}</span></div>
              </div>
            </div>

            {/* Loss curve */}
            <div style={{
              background: '#0a0a0a',
              borderTop: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
              position: 'relative',
            }}>
              <canvas ref={losscurveRef} style={{ display: 'block', width: '100%' }} />
              <div style={{
                position: 'absolute', top: 8, left: 12,
                ...mono, fontSize: 9, color: '#666',
                textTransform: 'uppercase', letterSpacing: '.08em',
                pointerEvents: 'none',
              }}>Loss over steps</div>
            </div>

          </div>

          {/* Right panel */}
          <div style={{
            width: 220,
            display: 'flex', flexDirection: 'column',
            padding: '18px 16px', gap: 20,
          }}>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '.1em' }}>Current Loss</div>
                <div style={{ ...mono, fontSize: 22, fontWeight: 500, lineHeight: 1, color: lossDisplayColor }}>
                  {dispLoss !== null ? dispLoss.toFixed(4) : '—'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '.1em' }}>Step</div>
                <div style={{ ...mono, fontSize: 14, fontWeight: 500, lineHeight: 1, color: 'var(--accent)' }}>
                  {dispStep} / {STEPS}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '.1em' }}>Status</div>
                <div style={{ ...mono, fontSize: 14, fontWeight: 500, lineHeight: 1, color: statusColor }}>
                  {status}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Optimizer tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={ctrlLbl}>Optimizer</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[['sgd','SGD'],['momentum','Mom.'],['adam','Adam']].map(([key, label]) => (
                  <button key={key} onClick={() => handleOptimizer(key)} style={{
                    flex: 1, ...mono, fontSize: 10,
                    padding: '5px 4px', borderRadius: 4, cursor: 'pointer', textAlign: 'center',
                    background: optimizer === key ? 'var(--accent-dim)' : 'var(--bg3)',
                    color:      optimizer === key ? 'var(--accent)'     : '#666',
                    border: `1px solid ${optimizer === key ? 'var(--accent)' : 'var(--border)'}`,
                    transition: 'all .12s',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Learning rate */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={ctrlLbl}>Learning Rate</span>
                <span style={{ ...mono, fontSize: 11, color: 'var(--accent)' }}>{lr.toFixed(3)}</span>
              </div>
              <input type="range" min="1" max="100"
                value={Math.round(lr / 0.5 * 100)}
                onChange={e => handleLR(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Speed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={ctrlLbl}>Speed</span>
                <span style={{ ...mono, fontSize: 11, color: 'var(--accent)' }}>{speed}</span>
              </div>
              <input type="range" min="1" max="20"
                value={speed}
                onChange={e => handleSpeed(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Surface presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={ctrlLbl}>Surface</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['two-valleys','Two Valleys'],['saddle','Saddle Point'],['ravine','Ravine']].map(([key, label]) => (
                  <button key={key} onClick={() => handleSurface(key)} style={{
                    ...mono, fontSize: 10,
                    padding: '6px 10px', borderRadius: 5, cursor: 'pointer', textAlign: 'left',
                    background: surface === key ? 'var(--accent-dim)' : 'var(--bg3)',
                    color:      surface === key ? 'var(--accent)'     : '#666',
                    border: `1px solid ${surface === key ? 'var(--accent)' : 'var(--border)'}`,
                    transition: 'all .12s',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Play controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleTogglePlay} style={{
                  flex: 1, ...mono, fontSize: 11,
                  padding: '7px 14px', borderRadius: 5, cursor: 'pointer',
                  background: 'var(--accent-dim)', color: 'var(--accent)',
                  border: '1px solid var(--accent)', transition: 'all .12s',
                  whiteSpace: 'nowrap',
                }}>
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button onClick={doReset} style={{
                  ...mono, fontSize: 11,
                  padding: '7px 14px', borderRadius: 5, cursor: 'pointer',
                  background: 'var(--bg3)', color: '#999',
                  border: '1px solid var(--border)', transition: 'all .12s',
                }}>↺</button>
              </div>
              <div style={{ fontSize: 10.5, color: '#666', fontStyle: 'italic', lineHeight: 1.5, marginTop: -4 }}>
                Click the landscape to place the ball at any starting point.
              </div>
            </div>

          </div>

        </div>
      </div>
    </WidgetCard>
  );
}
