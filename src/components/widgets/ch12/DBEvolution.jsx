import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Color palette ──────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  orange:    '#fb923c',
  red:       '#f87171',
  green:     '#34d399',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  text:      '#e8eaed',
  textMid:   '#888888',
  textMuted: '#555555',
  codeBg:    '#0a0a0a',
};
const mono  = "'JetBrains Mono', monospace";
const sans  = "'Inter', sans-serif";
const serif = "'Crimson Pro', serif";

// ── Coordinate space ───────────────────────────────────────────────────────
const X_MIN = -3, X_MAX = 3, Y_MAX = 2.5, Y_MIN = -2.5;
const CANVAS_PAD = 24;
const GRID = 40;
const SAVED_EPOCHS = [0, 4, 8, 12, 16, 20];

// ── Discriminator weights for each saved epoch ─────────────────────────────
const WEIGHTS = [
  [0.0, 0.5,  0.3,  0.0,  0.0],
  [0.1, 0.8,  0.5,  0.1,  0.0],
  [0.2, 1.1,  0.8,  0.2,  0.1],
  [0.3, 1.4,  1.0,  0.3,  0.2],
  [0.4, 1.6,  1.2,  0.35, 0.25],
  [0.5, 1.7,  1.3,  0.4,  0.3],
];

const D_ACCURACY     = [58, 68, 76, 82, 87, 91];
const G_QUALITY_LBLS = [
  'random noise', 'vague structure', 'rough clusters',
  'improving', 'near-real', 'realistic',
];

// ── Seeded PRNG ────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleNormal2D(rng, muX, muY, sigma) {
  const u1 = rng(), u2 = rng();
  const r = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10)));
  const theta = 2 * Math.PI * u2;
  return [muX + sigma * r * Math.cos(theta), muY + sigma * r * Math.sin(theta)];
}

// ── Data generation ────────────────────────────────────────────────────────
function generateRealPoints() {
  const rng = mulberry32(33);
  const pts = [];
  for (let i = 0; i < 20; i++) pts.push(sampleNormal2D(rng, 1.2, 1.0, 0.4));
  for (let i = 0; i < 10; i++) pts.push(sampleNormal2D(rng, -0.8, 0.5, 0.35));
  return pts;
}

function generateAllFakeEpochs() {
  const epochs = [];

  const rng0 = mulberry32(44);
  epochs.push(Array.from({ length: 30 }, () => [rng0() * 5 - 2.5, rng0() * 5 - 2.5]));

  const rng4 = mulberry32(45);
  epochs.push(Array.from({ length: 30 }, () => sampleNormal2D(rng4, 0, 0, 1.2)));

  const rng8 = mulberry32(46);
  const e8 = [];
  for (let i = 0; i < 15; i++) e8.push(sampleNormal2D(rng8, 0.8, 0.6, 0.7));
  for (let i = 0; i < 15; i++) e8.push(sampleNormal2D(rng8, -0.5, 0.3, 0.6));
  epochs.push(e8);

  const rng12 = mulberry32(47);
  const e12 = [];
  for (let i = 0; i < 15; i++) e12.push(sampleNormal2D(rng12, 1.0, 0.8, 0.55));
  for (let i = 0; i < 15; i++) e12.push(sampleNormal2D(rng12, -0.65, 0.4, 0.50));
  epochs.push(e12);

  const rng16 = mulberry32(48);
  const e16 = [];
  for (let i = 0; i < 15; i++) e16.push(sampleNormal2D(rng16, 1.1, 0.9, 0.45));
  for (let i = 0; i < 15; i++) e16.push(sampleNormal2D(rng16, -0.72, 0.45, 0.40));
  epochs.push(e16);

  const rng20 = mulberry32(49);
  const e20 = [];
  for (let i = 0; i < 15; i++) e20.push(sampleNormal2D(rng20, 1.18, 0.97, 0.42));
  for (let i = 0; i < 15; i++) e20.push(sampleNormal2D(rng20, -0.78, 0.48, 0.37));
  epochs.push(e20);

  return epochs;
}

// ── Module-level static data (computed once) ───────────────────────────────
const REAL_PTS = generateRealPoints();
const ALL_FAKE = generateAllFakeEpochs();

// ── Interpolation helpers ──────────────────────────────────────────────────
function epochSegment(epoch) {
  if (epoch <= 0)  return { i: 0, t: 0 };
  if (epoch >= 20) return { i: 4, t: 1 };
  let i = 0;
  while (i < 4 && SAVED_EPOCHS[i + 1] <= epoch) i++;
  const t = (epoch - SAVED_EPOCHS[i]) / (SAVED_EPOCHS[i + 1] - SAVED_EPOCHS[i]);
  return { i, t };
}

function lerpWeights(epoch) {
  const { i, t } = epochSegment(epoch);
  return WEIGHTS[i].map((v, j) => v + (WEIGHTS[i + 1][j] - v) * t);
}

function lerpFakePts(epoch) {
  const { i, t } = epochSegment(epoch);
  return ALL_FAKE[i].map((pt, j) => [
    pt[0] + (ALL_FAKE[i + 1][j][0] - pt[0]) * t,
    pt[1] + (ALL_FAKE[i + 1][j][1] - pt[1]) * t,
  ]);
}

function lerpScalar(epoch, arr) {
  const { i, t } = epochSegment(epoch);
  return arr[i] + (arr[i + 1] - arr[i]) * t;
}

// ── Discriminator ──────────────────────────────────────────────────────────
function discriminatorD(x, y, w) {
  return 1 / (1 + Math.exp(-(w[0] + w[1]*x + w[2]*y + w[3]*x*x + w[4]*y*y)));
}

// ── Canvas utilities ───────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Main canvas draw ───────────────────────────────────────────────────────
function drawEverything(canvas, { displayEpoch, showBoundary, showBackground, hoveredPoint }) {
  if (!canvas) return;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (!cssW || !cssH) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const W = cssW, H = cssH;
  const PAD = CANVAS_PAD;
  const chartW = W - 2 * PAD;
  const chartH = H - 2 * PAD;

  const toPixX = (x) => PAD + (x - X_MIN) / (X_MAX - X_MIN) * chartW;
  const toPixY = (y) => PAD + (Y_MAX - y) / (Y_MAX - Y_MIN) * chartH;

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  const w        = lerpWeights(displayEpoch);
  const fakePts  = lerpFakePts(displayEpoch);

  // ── 1. Discriminator background grid ─────────────────────────────────────
  if (showBackground) {
    const cellW = chartW / GRID;
    const cellH = chartH / GRID;
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const x = X_MIN + (gx + 0.5) / GRID * (X_MAX - X_MIN);
        const y = Y_MAX - (gy + 0.5) / GRID * (Y_MAX - Y_MIN);
        const d = discriminatorD(x, y, w);
        const alpha = Math.abs(d - 0.5) * 0.5;
        ctx.fillStyle = d > 0.5
          ? `rgba(45,212,191,${alpha.toFixed(3)})`
          : `rgba(251,146,60,${alpha.toFixed(3)})`;
        ctx.fillRect(PAD + gx * cellW, PAD + gy * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }

  // ── 2. Decision boundary (marching squares) ───────────────────────────────
  if (showBoundary) {
    const D = [];
    for (let gy = 0; gy <= GRID; gy++) {
      D.push([]);
      const y = Y_MAX - (gy / GRID) * (Y_MAX - Y_MIN);
      for (let gx = 0; gx <= GRID; gx++) {
        D[gy].push(discriminatorD(X_MIN + (gx / GRID) * (X_MAX - X_MIN), y, w));
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';

    const lerp1d = (d1, d2, v1, v2) => {
      const denom = d2 - d1;
      if (Math.abs(denom) < 1e-9) return (v1 + v2) / 2;
      return v1 + ((0.5 - d1) / denom) * (v2 - v1);
    };

    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const tl = D[gy][gx],     tr = D[gy][gx + 1];
        const br = D[gy + 1][gx + 1], bl = D[gy + 1][gx];
        const x0 = X_MIN + (gx / GRID)       * (X_MAX - X_MIN);
        const x1 = X_MIN + ((gx + 1) / GRID) * (X_MAX - X_MIN);
        const y0 = Y_MAX - (gy / GRID)       * (Y_MAX - Y_MIN); // top in data
        const y1 = Y_MAX - ((gy + 1) / GRID) * (Y_MAX - Y_MIN); // bottom in data

        const pts = [];
        if ((tl > 0.5) !== (tr > 0.5)) pts.push([toPixX(lerp1d(tl, tr, x0, x1)), toPixY(y0)]);
        if ((tr > 0.5) !== (br > 0.5)) pts.push([toPixX(x1),                      toPixY(lerp1d(tr, br, y0, y1))]);
        if ((br > 0.5) !== (bl > 0.5)) pts.push([toPixX(lerp1d(br, bl, x1, x0)), toPixY(y1)]);
        if ((bl > 0.5) !== (tl > 0.5)) pts.push([toPixX(x0),                      toPixY(lerp1d(bl, tl, y1, y0))]);

        if (pts.length >= 2) {
          ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.stroke();
          if (pts.length === 4) {
            ctx.beginPath(); ctx.moveTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]); ctx.stroke();
          }
        }
      }
    }
  }

  // ── 3. Subtle grid lines ──────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(46,46,46,0.55)';
  ctx.lineWidth   = 1;
  [-2,-1,0,1,2].forEach(v => {
    ctx.beginPath(); ctx.moveTo(toPixX(v), PAD); ctx.lineTo(toPixX(v), PAD + chartH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, toPixY(v)); ctx.lineTo(PAD + chartW, toPixY(v)); ctx.stroke();
  });

  // ── 4. Real data points ───────────────────────────────────────────────────
  REAL_PTS.forEach(([x, y]) => {
    const px = toPixX(x), py = toPixY(y);
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle   = C.accent;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  });

  // ── 5. Fake data points ───────────────────────────────────────────────────
  fakePts.forEach(([x, y]) => {
    const px = toPixX(x), py = toPixY(y);
    if (px < -20 || px > W + 20 || py < -20 || py > H + 20) return;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle   = C.orange;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  });

  // ── 6. Axis labels ────────────────────────────────────────────────────────
  ctx.fillStyle = C.textMuted;
  ctx.font      = `8px ${mono}`;
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'top';
  [-2,-1,0,1,2].forEach(v => ctx.fillText(String(v), toPixX(v), PAD + chartH + 4));
  ctx.textAlign     = 'right';
  ctx.textBaseline  = 'middle';
  [-2,-1,0,1,2].forEach(v => ctx.fillText(String(v), PAD - 4, toPixY(v)));

  // ── 7. Legend ─────────────────────────────────────────────────────────────
  ctx.font = `9px ${sans}`;
  let lx   = PAD + 4;
  const ly = PAD + 9;

  const legendItems = [
    { color: C.accent,                  label: 'Real data',         dot: true  },
    { color: C.orange,                  label: 'Generated (fake)',   dot: true  },
    { color: 'rgba(255,255,255,0.92)', label: 'D(x)=0.5 boundary', dot: false },
  ];

  legendItems.forEach(({ color, label, dot }) => {
    if (dot) {
      ctx.beginPath();
      ctx.arc(lx + 4, ly, 4, 0, Math.PI * 2);
      ctx.fillStyle   = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth   = 1;
      ctx.stroke();
      lx += 11;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + 13, ly);
      ctx.stroke();
      lx += 16;
    }
    ctx.fillStyle    = C.textMid;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, ly);
    lx += ctx.measureText(label).width + 10;
  });

  // ── 8. Hover highlight + tooltip ─────────────────────────────────────────
  if (hoveredPoint) {
    const { x, y, type, dVal } = hoveredPoint;
    const px = toPixX(x), py = toPixY(y);

    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    const line1 = type === 'real' ? 'Real point' : 'Fake point';
    const line2 = `D(x) = ${dVal.toFixed(3)}`;
    ctx.font      = `9px ${mono}`;
    const tw      = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width);
    const bW = tw + 14, bH = 30;
    let tx = px + 12, ty = py - 15;
    if (tx + bW > W - 4)  tx = px - bW - 12;
    if (ty < 4)            ty = py + 8;
    if (ty + bH > H - 4)  ty = H - bH - 4;

    roundRect(ctx, tx, ty, bW, bH, 4);
    ctx.fillStyle   = 'rgba(17,17,17,0.93)';
    ctx.fill();
    ctx.strokeStyle = C.borderLt;
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.fillStyle    = type === 'real' ? C.accent : C.orange;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(line1, tx + 7, ty + 4);
    ctx.fillStyle = C.textMid;
    ctx.fillText(line2, tx + 7, ty + 16);
  }
}

// ── Component ──────────────────────────────────────────────────────────────
export default function DBEvolution() {
  const [epoch,          setEpoch]          = useState(0);
  const [displayEpoch,   setDisplayEpoch]   = useState(0);
  const [playing,        setPlaying]        = useState(false);
  const [showBoundary,   setShowBoundary]   = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [hoveredPoint,   setHoveredPoint]   = useState(null);

  const canvasRef     = useRef(null);
  const rafRef        = useRef(null);
  const playRef       = useRef(null);
  const dispEpochRef  = useRef(0); // float, updated by RAF

  // Animate displayEpoch toward epoch when epoch changes
  useEffect(() => {
    const from = dispEpochRef.current;
    const to   = epoch;
    if (from === to) return;

    const t0 = performance.now();
    cancelAnimationFrame(rafRef.current);

    const step = (now) => {
      const progress  = Math.min((now - t0) / 300, 1);
      const next      = from + (to - from) * progress;
      dispEpochRef.current = next;
      setDisplayEpoch(next);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [epoch]);

  // Redraw canvas whenever visible state changes
  useEffect(() => {
    drawEverything(canvasRef.current, { displayEpoch, showBoundary, showBackground, hoveredPoint });
  }, [displayEpoch, showBoundary, showBackground, hoveredPoint]);

  // Play animation: advance 1 epoch every 600ms
  useEffect(() => {
    if (!playing) return;
    playRef.current = setInterval(() => {
      setEpoch(e => {
        if (e >= 20) { setPlaying(false); return 20; }
        return e + 1;
      });
    }, 600);
    return () => clearInterval(playRef.current);
  }, [playing]);

  // Cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearInterval(playRef.current);
  }, []);

  const handleReset = useCallback(() => {
    setPlaying(false);
    clearInterval(playRef.current);
    setEpoch(0);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const PAD    = CANVAS_PAD;
    const chartW = rect.width  - 2 * PAD;
    const chartH = rect.height - 2 * PAD;
    const toPixX = (x) => PAD + (x - X_MIN) / (X_MAX - X_MIN) * chartW;
    const toPixY = (y) => PAD + (Y_MAX - y) / (Y_MAX - Y_MIN) * chartH;

    const ep = dispEpochRef.current;
    const w  = lerpWeights(ep);
    const fp = lerpFakePts(ep);

    let best = null, bestDist = 14;

    REAL_PTS.forEach(([x, y]) => {
      const d = Math.hypot(mouseX - toPixX(x), mouseY - toPixY(y));
      if (d < bestDist) { bestDist = d; best = { x, y, type: 'real', dVal: discriminatorD(x, y, w) }; }
    });
    fp.forEach(([x, y]) => {
      const d = Math.hypot(mouseX - toPixX(x), mouseY - toPixY(y));
      if (d < bestDist) { bestDist = d; best = { x, y, type: 'fake', dVal: discriminatorD(x, y, w) }; }
    });

    setHoveredPoint(best);
  }, []);

  const handleMouseLeave = useCallback(() => setHoveredPoint(null), []);

  // ── Derived stats for panel + epoch label ──────────────────────────────
  const w        = lerpWeights(displayEpoch);
  const fakePts  = lerpFakePts(displayEpoch);
  const dAccPct  = Math.round(lerpScalar(displayEpoch, D_ACCURACY));
  const gQIdx    = Math.min(5, Math.round(displayEpoch / 4));
  const gQuality = G_QUALITY_LBLS[gQIdx];
  const bdyCmplx = displayEpoch < 5 ? 'Linear' : displayEpoch < 12 ? 'Quadratic' : 'Complex curved';

  const cFakeX = fakePts.reduce((s, p) => s + p[0], 0) / fakePts.length;
  const cFakeY = fakePts.reduce((s, p) => s + p[1], 0) / fakePts.length;
  const dist   = Math.hypot(cFakeX - 1.0, cFakeY - 0.8);
  const approaching = dist < 0.5;
  const dAtReal = discriminatorD(1.0, 0.8, w);
  const dAtFake = discriminatorD(cFakeX, cFakeY, w);

  return (
    <WidgetCard title="Decision Boundary Evolution — 20 epochs of adversarial training" number="12.4">

      {/* ── Canvas + Stats panel ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            flex: 1, minWidth: 0, display: 'block',
            height: '360px', borderRadius: '4px', cursor: 'crosshair',
          }}
        />

        {/* Stats panel */}
        <div style={{
          width: '180px', flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '12px 13px',
        }}>
          <SRow label="Epoch"      val={Math.round(displayEpoch)} />
          <SRow label="D accuracy" val={`${dAccPct}%`} color={C.accent} />
          <SRow label="G quality"  val={gQuality} small />
          <Divider />

          <SLabel>Boundary</SLabel>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.accent, marginBottom: '8px' }}>
            {bdyCmplx}
          </div>

          <SLabel>Fake centroid</SLabel>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid, marginBottom: '8px' }}>
            ({cFakeX.toFixed(1)}, {cFakeY.toFixed(1)})
          </div>

          <SLabel>Real centroid</SLabel>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid, marginBottom: '8px' }}>
            (1.0, 0.8)
          </div>

          <SLabel>Distance</SLabel>
          <div style={{ fontFamily: mono, fontSize: '10px', color: approaching ? C.green : C.textMid }}>
            {dist.toFixed(2)}
          </div>
          {approaching && (
            <div style={{ fontFamily: mono, fontSize: '9px', color: C.green, marginBottom: '6px', marginTop: '2px' }}>
              Approaching real data
            </div>
          )}
          {!approaching && <div style={{ marginBottom: '8px' }} />}

          <Divider />
          <SRow label="D(real ctd)" val={dAtReal.toFixed(2)} color={dAtReal > 0.5 ? C.accent : C.red} />
          <SRow label="D(fake ctd)" val={dAtFake.toFixed(2)} color={dAtFake < 0.5 ? C.orange : C.red} />

          <Divider />
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.textMuted, lineHeight: 1.55 }}>
            Hover a point to see D(x,y) at that location.
          </div>
        </div>
      </div>

      {/* ── Epoch label ─────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
        <div style={{ fontFamily: serif, fontSize: '18px', color: C.text }}>
          Epoch {Math.round(displayEpoch)}
        </div>
        <div style={{ fontFamily: mono, fontSize: '11px', color: C.textMid, marginTop: '3px' }}>
          D accuracy: {dAccPct}%&nbsp;&nbsp;|&nbsp;&nbsp;G quality: {gQuality}
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div>
        {/* Epoch slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontFamily: mono, fontSize: '11px', color: C.textMuted, flexShrink: 0, width: '76px' }}>
            Epoch = {epoch}
          </span>
          <input
            type="range"
            min={0} max={20} step={1}
            value={epoch}
            onChange={e => { setPlaying(false); setEpoch(Number(e.target.value)); }}
            style={{ flex: 1, minWidth: 80, accentColor: C.accent, cursor: 'pointer' }}
          />
        </div>

        {/* Button row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn primary onClick={() => setPlaying(p => !p)}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </Btn>
          <Btn onClick={handleReset}>↺ Reset</Btn>
          <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />
          <Toggle active={showBoundary}   onClick={() => setShowBoundary(v => !v)}>
            Show boundary
          </Toggle>
          <Toggle active={showBackground} onClick={() => setShowBackground(v => !v)}>
            Show D(x) bg
          </Toggle>
        </div>
      </div>

    </WidgetCard>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SRow({ label, val, color, small }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'baseline' }}>
      <span style={{ fontFamily: mono, fontSize: '9px', color: C.textMuted }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: small ? '9px' : '10px', color: color || C.accent }}>{val}</span>
    </div>
  );
}
function Divider() {
  return <div style={{ width: '100%', height: '1px', background: C.border, margin: '8px 0' }} />;
}
function SLabel({ children }) {
  return <div style={{ fontFamily: mono, fontSize: '9px', color: C.textMuted, marginBottom: '3px' }}>{children}</div>;
}
function Btn({ children, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: mono, fontSize: '10px', fontWeight: 500,
      padding: '5px 14px', borderRadius: '4px',
      border: `1px solid ${primary ? C.accent : C.border}`,
      background: primary ? '#0b2422' : C.bg4,
      color: primary ? C.accent : C.textMid,
      cursor: 'pointer', flexShrink: 0,
      transition: 'border-color 0.15s, color 0.15s',
    }}>
      {children}
    </button>
  );
}
function Toggle({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: mono, fontSize: '10px', fontWeight: 500,
      padding: '4px 10px', borderRadius: '4px',
      border: `1px solid ${active ? C.accent : C.border}`,
      background: active ? '#0b2422' : C.bg4,
      color: active ? C.accent : C.textMuted,
      cursor: 'pointer',
      transition: 'border-color 0.15s, color 0.15s',
    }}>
      {children}
    </button>
  );
}
