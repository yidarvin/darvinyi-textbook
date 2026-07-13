import { useRef, useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const CW = 480, CH = 220;
const PAD = { top: 18, right: 22, bottom: 40, left: 52 };
const PW = CW - PAD.left - PAD.right;
const PH = CH - PAD.top - PAD.bottom;

const LR_MIN = 1e-4, LR_MAX = 5;
const LOG_MIN = Math.log(LR_MIN), LOG_MAX = Math.log(LR_MAX);
const N_SWEEP = 80, N_STEPS = 50, LOSS_CAP = 3.0;

const SURFACE_FN = {
  'two-valleys': (x, y) => {
    const g = 3*(x-0.25)**2 + 5*(y-0.5)**2;
    const l = 4*(x-0.75)**2 + 5*(y-0.5)**2 + 0.4;
    return Math.min(g, l) + 0.08 * Math.sin(12*x) * Math.sin(8*y) * 0.15;
  },
  'saddle': (x, y) => {
    const cx = x - 0.5, cy = y - 0.5;
    return 2*cx*cx - 2*cy*cy + 0.5 + 0.3*Math.sin(4*x)*Math.cos(4*y)*0.2;
  },
  'ravine': (x, y) =>
    10*(y - x*x)**2 + (1-x)**2 * 0.5 + 0.05*Math.sin(16*x)*Math.sin(16*y)*0.1,
};

function numGrad(f, x, y) {
  const h = 0.002;
  return [(f(x+h,y)-f(x-h,y))/(2*h), (f(x,y+h)-f(x,y-h))/(2*h)];
}

function runSGD(f, lr) {
  let x = 0.8, y = 0.2;
  for (let i = 0; i < N_STEPS; i++) {
    const [gx, gy] = numGrad(f, x, y);
    x -= lr * gx;
    y -= lr * gy;
  }
  const loss = f(x, y);
  return isFinite(loss) ? Math.min(loss, LOSS_CAP) : LOSS_CAP;
}

function computeSweep(surfaceKey) {
  const f = SURFACE_FN[surfaceKey];
  const lrs = [], losses = [];
  for (let i = 0; i < N_SWEEP; i++) {
    const lr = Math.exp(LOG_MIN + (i / (N_SWEEP - 1)) * (LOG_MAX - LOG_MIN));
    lrs.push(lr);
    losses.push(runSGD(f, lr));
  }
  return { lrs, losses };
}

function lrToX(lr) {
  return PAD.left + (Math.log(lr) - LOG_MIN) / (LOG_MAX - LOG_MIN) * PW;
}

function lossToY(loss) {
  return PAD.top + PH - (Math.min(loss, LOSS_CAP) / LOSS_CAP) * PH;
}

function zoneColor(loss) {
  if (loss < 0.3) return '#34d399';
  if (loss < 0.8) return '#fbbf24';
  if (loss < 2.0) return '#fb923c';
  return '#f87171';
}

function zoneLabel(loss) {
  if (loss < 0.3) return 'good';
  if (loss < 0.8) return 'high';
  if (loss < 2.0) return 'unstable';
  return 'diverged';
}

function getRecommendation(sweep, lossAtLR) {
  const goodLRs = sweep.lrs.filter((_, i) => sweep.losses[i] < 0.3);
  if (goodLRs.length > 0) {
    const lo = Math.min(...goodLRs), hi = Math.max(...goodLRs);
    const fmt = v => v < 0.01 ? v.toExponential(1) : v < 0.1 ? v.toFixed(3) : v.toFixed(2);
    const range = `${fmt(lo)}–${fmt(hi)}`;
    if (lossAtLR < 0.3) return `Sweet spot — try ${range} for this surface`;
    if (lossAtLR < 0.8) return `Good range near ${range} — lower slightly`;
    if (lossAtLR < 2.0) return `Unstable here — sweet spot is ${range}`;
    return `Diverged — sweet spot is ${range}`;
  }
  if (lossAtLR >= 2.0) return 'No convergent LR found — surface is very sensitive';
  return 'Marginal convergence — try smaller LR for better results';
}

function drawChart(canvas, sweep, lrIdx) {
  if (!canvas || !sweep) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = CW * dpr;
  canvas.height = CH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const { lrs, losses } = sweep;

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, CW, CH);

  // Grid lines
  ctx.lineWidth = 1;
  for (let v = 0; v <= 3; v += 0.5) {
    const gy = lossToY(v);
    ctx.strokeStyle = v % 1 === 0 ? '#1e1e1e' : '#151515';
    ctx.beginPath();
    ctx.moveTo(PAD.left, gy);
    ctx.lineTo(CW - PAD.right, gy);
    ctx.stroke();
  }

  // Loss curve — colored segments
  for (let i = 0; i < lrs.length - 1; i++) {
    const x1 = lrToX(lrs[i]),   y1 = lossToY(losses[i]);
    const x2 = lrToX(lrs[i+1]), y2 = lossToY(losses[i+1]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = zoneColor((losses[i] + losses[i+1]) / 2);
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Zone labels on the curve
  const zones = [
    { name: 'good',     color: '#34d399', lo: -Infinity, hi: 0.3  },
    { name: 'high',     color: '#fbbf24', lo: 0.3,       hi: 0.8  },
    { name: 'unstable', color: '#fb923c', lo: 0.8,       hi: 2.0  },
    { name: 'diverged', color: '#f87171', lo: 2.0,       hi: Infinity },
  ];
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = 'center';
  for (const zone of zones) {
    const idxs = losses.reduce((acc, l, i) => { if (l >= zone.lo && l < zone.hi) acc.push(i); return acc; }, []);
    if (idxs.length === 0) continue;
    const mid = idxs[Math.floor(idxs.length / 2)];
    const lx = lrToX(lrs[mid]);
    const ly = lossToY(losses[mid]) - 8;
    if (lx < PAD.left + 12 || lx > CW - PAD.right - 12 || ly < PAD.top + 4) continue;
    ctx.fillStyle = zone.color;
    ctx.fillText(zone.name, lx, ly);
  }

  // Vertical dashed indicator at selected LR
  const selLR   = lrs[lrIdx];
  const selLoss = losses[lrIdx];
  const ix = lrToX(selLR);

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ix, PAD.top);
  ctx.lineTo(ix, PAD.top + PH);
  ctx.stroke();
  ctx.restore();

  // Dot at selected position
  const iy = lossToY(selLoss);
  ctx.beginPath();
  ctx.arc(ix, iy, 5, 0, Math.PI*2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix, iy, 3.5, 0, Math.PI*2);
  ctx.fillStyle = zoneColor(selLoss);
  ctx.fill();

  // X axis ticks + labels
  const xTicks = [1e-4, 1e-3, 0.01, 0.1, 1];
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = 'center';
  for (const tick of xTicks) {
    const tx = lrToX(tick);
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, PAD.top + PH);
    ctx.lineTo(tx, PAD.top + PH + 5);
    ctx.stroke();
    ctx.fillStyle = '#555';
    const lbl = tick < 0.01 ? tick.toExponential(0) : String(tick);
    ctx.fillText(lbl, tx, PAD.top + PH + 17);
  }

  // Y axis labels
  ctx.textAlign = 'right';
  for (let v = 0; v <= 3; v++) {
    ctx.fillStyle = '#555';
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillText(v.toFixed(0), PAD.left - 7, lossToY(v) + 4);
  }

  // Axis lines
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + PH);
  ctx.lineTo(CW - PAD.right, PAD.top + PH);
  ctx.stroke();

  // Axis label — x
  ctx.fillStyle = '#444';
  ctx.textAlign = 'center';
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillText('Learning Rate (log scale)', PAD.left + PW / 2, CH - 4);
}

export default function LRFinder() {
  const canvasRef = useRef(null);
  const [surface, setSurface] = useState('two-valleys');
  const [lrIdx,   setLrIdx]   = useState(40);
  const [sweep,   setSweep]   = useState(() => computeSweep('two-valleys'));

  useEffect(() => {
    setSweep(computeSweep(surface));
  }, [surface]);

  useEffect(() => {
    drawChart(canvasRef.current, sweep, lrIdx);
  }, [sweep, lrIdx]);

  const currentLR   = sweep.lrs[lrIdx];
  const currentLoss = sweep.losses[lrIdx];
  const zone        = zoneLabel(currentLoss);
  const zCol        = zoneColor(currentLoss);
  const rec         = getRecommendation(sweep, currentLoss);

  const mono    = { fontFamily: "'JetBrains Mono', monospace" };
  const ctrlLbl = { ...mono, fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '.08em' };

  return (
    <WidgetCard title="Learning Rate Finder — find the sweet spot" number="3.3">
      <div style={{ margin: '-20px -18px' }}>

        <div style={{ display: 'flex' }}>

          {/* Canvas */}
          <div style={{ flex: 1, minWidth: 0, background: '#0a0a0a', borderRight: '1px solid var(--border)' }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: '100%', height: `${CH}px` }}
            />
          </div>

          {/* Stats panel */}
          <div style={{
            width: 196, flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            padding: '18px 16px', gap: 14,
          }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ ...mono, fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '.1em' }}>LR</div>
                <div style={{ ...mono, fontSize: 21, fontWeight: 500, lineHeight: 1, color: 'var(--accent)' }}>
                  {currentLR.toFixed(4)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ ...mono, fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '.1em' }}>Final Loss</div>
                <div style={{ ...mono, fontSize: 21, fontWeight: 500, lineHeight: 1, color: zCol }}>
                  {currentLoss.toFixed(4)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ ...mono, fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '.1em' }}>Zone</div>
                <div style={{ ...mono, fontSize: 15, fontWeight: 600, lineHeight: 1, color: zCol }}>
                  {zone}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ ...mono, fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '.1em' }}>Recommendation</div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>{rec}</div>
            </div>

          </div>
        </div>

        {/* Controls */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={ctrlLbl}>Learning Rate</span>
              <span style={{ ...mono, fontSize: 11, color: 'var(--accent)' }}>
                {currentLR.toExponential(3)}
              </span>
            </div>
            <input
              type="range" min={0} max={N_SWEEP - 1}
              value={lrIdx}
              onChange={e => setLrIdx(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={ctrlLbl}>Surface</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['two-valleys','Two Valleys'],['saddle','Saddle'],['ravine','Ravine']].map(([key, label]) => (
                <button key={key} onClick={() => setSurface(key)} style={{
                  ...mono, fontSize: 10,
                  padding: '5px 10px', borderRadius: 4, cursor: 'pointer',
                  background: surface === key ? 'var(--accent-dim)' : 'var(--bg3)',
                  color:      surface === key ? 'var(--accent)'     : '#666',
                  border: `1px solid ${surface === key ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all .12s',
                }}>{label}</button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </WidgetCard>
  );
}
