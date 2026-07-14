import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

// ── Constants ─────────────────────────────────────────────────────────────────
const CW = 500, CH = 500, PAD = 24;
const X1_MIN = -3.5, X1_MAX = 3.5;
const X2_MIN = -3.5, X2_MAX = 3.5;
const INITIAL_POS = [2.5, -2.0];
const ETA = 0.02;
const MAX_TRAIL = 60;
const MAX_ARROW = 22;
const ARROW_SCALE = 14;

const COMPONENTS = [
  { mu: [-1.5, 0],   sigma: 0.6, weight: 0.6 },
  { mu: [1.5,  0.5], sigma: 0.5, weight: 0.4 },
];

// ── Coordinate transforms ─────────────────────────────────────────────────────
function toCanvasX(x1, w) {
  return PAD + ((x1 - X1_MIN) / (X1_MAX - X1_MIN)) * (w - 2 * PAD);
}
function toCanvasY(x2, h) {
  return PAD + ((X2_MAX - x2) / (X2_MAX - X2_MIN)) * (h - 2 * PAD);
}
function fromCanvasX(cx, w) {
  return X1_MIN + ((cx - PAD) / (w - 2 * PAD)) * (X1_MAX - X1_MIN);
}
function fromCanvasY(cy, h) {
  return X2_MAX - ((cy - PAD) / (h - 2 * PAD)) * (X2_MAX - X2_MIN);
}

// ── Math ──────────────────────────────────────────────────────────────────────
function scoreAt(x1, x2, sigmaSmooth) {
  let pTotal = 0, sx = 0, sy = 0;
  for (const c of COMPONENTS) {
    const sigEff = Math.sqrt(c.sigma * c.sigma + sigmaSmooth * sigmaSmooth);
    const dx = x1 - c.mu[0], dy = x2 - c.mu[1];
    const dist2 = (dx * dx + dy * dy) / (2 * sigEff * sigEff);
    const norm = 1 / (2 * Math.PI * sigEff * sigEff);
    const pk = c.weight * norm * Math.exp(-dist2);
    sx += pk * (-dx / (sigEff * sigEff));
    sy += pk * (-dy / (sigEff * sigEff));
    pTotal += pk;
  }
  if (pTotal < 1e-10) return [0, 0];
  return [sx / pTotal, sy / pTotal];
}

function densityAt(x1, x2, sigmaSmooth) {
  let p = 0;
  for (const c of COMPONENTS) {
    const sigEff = Math.sqrt(c.sigma * c.sigma + sigmaSmooth * sigmaSmooth);
    const dx = x1 - c.mu[0], dy = x2 - c.mu[1];
    const dist2 = (dx * dx + dy * dy) / (2 * sigEff * sigEff);
    const norm = 1 / (2 * Math.PI * sigEff * sigEff);
    p += c.weight * norm * Math.exp(-dist2);
  }
  return p;
}

function logPAt(x1, x2, sigmaSmooth) {
  return Math.log(Math.max(1e-10, densityAt(x1, x2, sigmaSmooth)));
}

// Box-Muller
let _spare = null;
function gaussianRandom() {
  if (_spare !== null) { const s = _spare; _spare = null; return s; }
  const u = Math.max(1e-10, Math.random()), v = Math.random();
  const mag = Math.sqrt(-2 * Math.log(u));
  _spare = mag * Math.sin(2 * Math.PI * v);
  return mag * Math.cos(2 * Math.PI * v);
}

function langevinStep(pos, sigmaSmooth) {
  const s = scoreAt(pos[0], pos[1], sigmaSmooth);
  return [
    pos[0] + ETA * s[0] + Math.sqrt(2 * ETA) * gaussianRandom(),
    pos[1] + ETA * s[1] + Math.sqrt(2 * ETA) * gaussianRandom(),
  ];
}

// ── Arrow drawing ─────────────────────────────────────────────────────────────
function drawArrow(ctx, x1, y1, dx, dy) {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.1) return;
  const ux = dx / len, uy = dy / len;
  const endX = x1 + dx, endY = y1 + dy;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(endX, endY); ctx.stroke();
  const hs = 5;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - hs * (ux + 0.5 * uy), endY - hs * (uy - 0.5 * ux));
  ctx.lineTo(endX - hs * (ux - 0.5 * uy), endY - hs * (uy + 0.5 * ux));
  ctx.closePath(); ctx.fill();
}

// ── Simple marching squares for contours ─────────────────────────────────────
function marchingSquaresContour(grid, nx, ny, threshold) {
  const segments = [];
  const idx = (xi, yi) => yi * nx + xi;

  for (let yi = 0; yi < ny - 1; yi++) {
    for (let xi = 0; xi < nx - 1; xi++) {
      const v00 = grid[idx(xi,     yi    )];
      const v10 = grid[idx(xi + 1, yi    )];
      const v01 = grid[idx(xi,     yi + 1)];
      const v11 = grid[idx(xi + 1, yi + 1)];

      const b00 = v00 >= threshold ? 1 : 0;
      const b10 = v10 >= threshold ? 1 : 0;
      const b01 = v01 >= threshold ? 1 : 0;
      const b11 = v11 >= threshold ? 1 : 0;
      const cfg = b00 | (b10 << 1) | (b01 << 2) | (b11 << 3);
      if (cfg === 0 || cfg === 15) continue;

      // Interpolate edge crossings
      const lerp = (a, b, va, vb) => a + (b - a) * (threshold - va) / (vb - va);

      const points = {
        top:    [lerp(xi, xi + 1, v00, v10), yi],
        bottom: [lerp(xi, xi + 1, v01, v11), yi + 1],
        left:   [xi,     lerp(yi, yi + 1, v00, v01)],
        right:  [xi + 1, lerp(yi, yi + 1, v10, v11)],
      };

      const edges = [];
      if ((b00 ^ b10)) edges.push('top');
      if ((b01 ^ b11)) edges.push('bottom');
      if ((b00 ^ b01)) edges.push('left');
      if ((b10 ^ b11)) edges.push('right');

      if (edges.length === 2) {
        segments.push([points[edges[0]], points[edges[1]]]);
      }
    }
  }
  return segments;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ScoreFunction({ tryThis }) {
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const trailRef    = useRef([]);
  const particleRef = useRef([...INITIAL_POS]);
  const stepsRef    = useRef(0);

  // Pause the continuous play loop when scrolled off-screen; never auto-run for reduced motion.
  const [cardRef, isVisible] = useIsVisible();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisibleRef         = useRef(true);
  isVisibleRef.current = isVisible;

  const [sigmaSmooth, setSigmaSmooth] = useState(1.0);
  const [playing, setPlaying]         = useState(false);
  const [showField, setShowField]     = useState(true);
  const [showDensity, setShowDensity] = useState(true);
  const [showContours, setShowContours] = useState(true);

  // Force re-render for stats display
  const [tick, setTick] = useState(0);

  // ── Score field grid (recompute on sigma change) ───────────────────────────
  const scoreGrid = useMemo(() => {
    const GX = 14, GY = 14;
    const grid = [];
    for (let j = 0; j < GY; j++) {
      for (let i = 0; i < GX; i++) {
        const x1 = X1_MIN + (i + 0.5) / GX * (X1_MAX - X1_MIN);
        const x2 = X2_MIN + (j + 0.5) / GY * (X2_MAX - X2_MIN);
        const [sx, sy] = scoreAt(x1, x2, sigmaSmooth);
        grid.push({ x1, x2, sx, sy });
      }
    }
    return grid;
  }, [sigmaSmooth]);

  // ── Density grid (recompute on sigma change) ──────────────────────────────
  const densityGrid = useMemo(() => {
    const DX = 60, DY = 50;
    const vals = new Float64Array(DX * DY);
    let maxP = 0;
    for (let j = 0; j < DY; j++) {
      for (let i = 0; i < DX; i++) {
        const x1 = X1_MIN + (i + 0.5) / DX * (X1_MAX - X1_MIN);
        const x2 = X2_MIN + (j + 0.5) / DY * (X2_MAX - X2_MIN);
        const p = densityAt(x1, x2, sigmaSmooth);
        vals[j * DX + i] = p;
        if (p > maxP) maxP = p;
      }
    }
    return { vals, maxP, DX, DY };
  }, [sigmaSmooth]);

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width  = Math.round(rect.width  * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // ── 1. Density heatmap ─────────────────────────────────────────────────
    if (showDensity) {
      const { vals, maxP, DX, DY } = densityGrid;
      const cellW = (w - 2 * PAD) / DX;
      const cellH = (h - 2 * PAD) / DY;
      for (let j = 0; j < DY; j++) {
        for (let i = 0; i < DX; i++) {
          const t = maxP > 0 ? vals[j * DX + i] / maxP : 0;
          const alpha = t * 0.3;
          ctx.fillStyle = `rgba(45,212,191,${alpha.toFixed(3)})`;
          const cx = PAD + i * cellW;
          const cy = PAD + (DY - 1 - j) * cellH;
          ctx.fillRect(cx, cy, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // ── 2. Contours ────────────────────────────────────────────────────────
    if (showContours) {
      const { vals, maxP, DX, DY } = densityGrid;
      const levels = [0.20, 0.40, 0.60, 0.80, 0.95];
      const alphas = [0.15, 0.18, 0.22, 0.28, 0.35];
      const cellW = (w - 2 * PAD) / DX;
      const cellH = (h - 2 * PAD) / DY;

      for (let li = 0; li < levels.length; li++) {
        const threshold = levels[li] * maxP;
        const segs = marchingSquaresContour(vals, DX, DY, threshold);
        ctx.strokeStyle = `rgba(255,255,255,${alphas[li]})`;
        ctx.lineWidth = 1;
        for (const [[x0, y0], [x1, y1]] of segs) {
          // x is i-index, y is j-index (bottom-left origin in our grid)
          const cx0 = PAD + x0 * cellW + cellW * 0.5;
          const cy0 = PAD + (DY - 1 - y0) * cellH + cellH * 0.5;
          const cx1 = PAD + x1 * cellW + cellW * 0.5;
          const cy1 = PAD + (DY - 1 - y1) * cellH + cellH * 0.5;
          ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx1, cy1); ctx.stroke();
        }
      }
    }

    // ── 3. Score field ─────────────────────────────────────────────────────
    if (showField) {
      ctx.strokeStyle = 'rgba(45,212,191,0.7)';
      ctx.fillStyle   = 'rgba(45,212,191,0.7)';
      ctx.lineWidth = 1.5;
      for (const { x1, x2, sx, sy } of scoreGrid) {
        const mag = Math.sqrt(sx * sx + sy * sy);
        if (mag < 0.05) continue;
        const scale = Math.min(MAX_ARROW, mag * ARROW_SCALE) / mag;
        const cx = toCanvasX(x1, w);
        const cy = toCanvasY(x2, h);
        // score y points up in data space, down in canvas space
        drawArrow(ctx, cx, cy, sx * scale, -sy * scale);
      }
    }

    // ── 4. Trail ───────────────────────────────────────────────────────────
    const trail = trailRef.current;
    for (let i = 0; i < trail.length; i++) {
      const age = trail.length - 1 - i;
      const t = age / MAX_TRAIL;
      const radius = 5 * (1 - t * 0.6);
      const alpha = 1 - t * 0.9;
      const r = Math.round(47 + (251 - 47) * t);
      const g = Math.round(46 + (146 - 46) * t);
      const b = Math.round(46 + (60  - 46) * t);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(toCanvasX(trail[i][0], w), toCanvasY(trail[i][1], h), radius, 0, 2 * Math.PI);
      ctx.fill();
    }

    // ── 5. Current particle ────────────────────────────────────────────────
    const pos = particleRef.current;
    const px = toCanvasX(pos[0], w);
    const py = toCanvasY(pos[1], h);
    ctx.fillStyle = '#fb923c';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // When paused, show immediate score vector as larger arrow
    if (!playing) {
      const [sx, sy] = scoreAt(pos[0], pos[1], sigmaSmooth);
      const mag = Math.sqrt(sx * sx + sy * sy);
      if (mag > 0.05) {
        const scale = Math.min(MAX_ARROW * 1.8, mag * ARROW_SCALE * 2) / mag;
        ctx.strokeStyle = 'rgba(251,146,60,0.85)';
        ctx.fillStyle   = 'rgba(251,146,60,0.85)';
        ctx.lineWidth = 2;
        drawArrow(ctx, px, py, sx * scale, -sy * scale);
      }
    }

    ctx.restore();
  }, [scoreGrid, densityGrid, showField, showDensity, showContours, playing, sigmaSmooth]);

  // Redraw on relevant state changes
  useEffect(() => {
    draw();
  }, [draw, tick]);

  // ── Animation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !isVisibleRef.current) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const step = () => {
      const newPos = langevinStep(particleRef.current, sigmaSmooth);
      particleRef.current = newPos;
      trailRef.current = [...trailRef.current, newPos].slice(-MAX_TRAIL);
      stepsRef.current += 1;
      setTick(t => t + 1);
      if (isVisibleRef.current) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null; // off-screen: this effect resumes the loop when it scrolls back in
      }
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing, sigmaSmooth, isVisible]);

  // Cleanup
  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // ── Canvas click ──────────────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const x1 = fromCanvasX(cx, rect.width);
    const x2 = fromCanvasY(cy, rect.height);
    particleRef.current = [x1, x2];
    trailRef.current = [];
    stepsRef.current = 0;
    setTick(t => t + 1);
  }, []);

  // ── Control handlers ──────────────────────────────────────────────────────
  const handleReset = () => {
    setPlaying(false);
    particleRef.current = [...INITIAL_POS];
    trailRef.current = [];
    stepsRef.current = 0;
    setTick(t => t + 1);
  };

  const handleNewParticle = () => {
    const x1 = X1_MIN + Math.random() * (X1_MAX - X1_MIN);
    const x2 = X2_MIN + Math.random() * (X2_MAX - X2_MIN);
    particleRef.current = [x1, x2];
    trailRef.current = [];
    stepsRef.current = 0;
    setTick(t => t + 1);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pos = particleRef.current;
  const [sx, sy] = scoreAt(pos[0], pos[1], sigmaSmooth);
  const scoreMag = Math.sqrt(sx * sx + sy * sy);
  const logP = logPAt(pos[0], pos[1], sigmaSmooth);
  const pAtParticle = densityAt(pos[0], pos[1], sigmaSmooth);

  const mode1 = COMPONENTS[0].mu, mode2 = COMPONENTS[1].mu;
  const d1 = Math.hypot(pos[0] - mode1[0], pos[1] - mode1[1]);
  const d2 = Math.hypot(pos[0] - mode2[0], pos[1] - mode2[1]);
  const nearestMode = d1 <= d2 ? 'Mode 1' : 'Mode 2';
  const distToMode  = Math.min(d1, d2);

  const p1 = densityAt(mode1[0], mode1[1], sigmaSmooth);
  const p2 = densityAt(mode2[0], mode2[1], sigmaSmooth);

  let status, statusColor;
  if (distToMode > 2.0) {
    status = 'Far from modes — score field guides';
    statusColor = '#f87171';
  } else if (distToMode > 0.5) {
    status = 'Approaching mode — score field steepening';
    statusColor = '#fbbf24';
  } else {
    status = 'Near mode — near equilibrium';
    statusColor = '#34d399';
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const statKey = { ...mono, fontSize: '10px', color: '#555555', marginBottom: '1px' };
  const statVal = { ...mono, fontSize: '12px', color: '#2dd4bf', marginBottom: '5px' };
  const divider = { borderTop: '1px solid #242424', margin: '6px 0' };
  const btnBase = {
    ...mono, fontSize: '11px',
    padding: '5px 11px', borderRadius: '4px', cursor: 'pointer',
    border: '1px solid #242424', background: '#161616', color: '#e8eaed',
    flexShrink: 0,
  };
  const toggleBase = (on) => ({
    ...mono, fontSize: '10px',
    padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
    border: `1px solid ${on ? '#2dd4bf' : '#242424'}`,
    background: on ? '#0b2422' : '#111111',
    color: on ? '#2dd4bf' : '#888888',
    flexShrink: 0,
  });

  return (
    <WidgetCard ref={cardRef} title="Score Function — the gradient field that guides denoising" number="20.4" tryThis={tryThis}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              width: '100%',
              aspectRatio: `${CW}/${CH}`,
              display: 'block',
              borderRadius: '6px',
              cursor: 'crosshair',
            }}
          />
        </div>

        {/* Stats panel */}
        <div style={{
          width: 160, flexShrink: 0,
          background: '#111111', border: '1px solid #242424',
          borderRadius: '8px', padding: '12px 14px',
          ...mono,
        }}>
          <div style={statKey}>pos</div>
          <div style={{ ...statVal, fontSize: '11px' }}>({pos[0].toFixed(2)}, {pos[1].toFixed(2)})</div>

          <div style={statKey}>log p(x)</div>
          <div style={statVal}>{logP.toFixed(3)}</div>

          <div style={statKey}>‖score‖</div>
          <div style={statVal}>{scoreMag.toFixed(3)}</div>

          <div style={statKey}>steps</div>
          <div style={statVal}>{stepsRef.current}</div>

          <div style={divider} />

          <div style={statKey}>nearest mode</div>
          <div style={{ ...statVal, color: d1 <= d2 ? '#2dd4bf' : '#a78bfa' }}>{nearestMode}</div>

          <div style={statKey}>dist to mode</div>
          <div style={statVal}>{distToMode.toFixed(2)}</div>

          <div style={statKey}>p(x) here</div>
          <div style={statVal}>{pAtParticle.toFixed(4)}</div>

          <div style={statKey}>p(x) Mode 1</div>
          <div style={{ ...statVal, color: '#888888' }}>{p1.toFixed(4)}</div>

          <div style={statKey}>p(x) Mode 2</div>
          <div style={{ ...statVal, color: '#888888' }}>{p2.toFixed(4)}</div>

          <div style={divider} />

          <div style={statKey}>sigma</div>
          <div style={{ ...statVal, marginBottom: '6px' }}>{sigmaSmooth.toFixed(2)}</div>

          <div style={divider} />

          <div style={{ ...mono, fontSize: '10px', color: statusColor, lineHeight: 1.45 }}>
            {status}
          </div>
        </div>
      </div>

      {/* Controls — single row */}
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ ...mono, fontSize: '11px', color: '#555555', flexShrink: 0 }}>
          σ = {sigmaSmooth.toFixed(2)}
        </span>
        <input
          type="range" min={0.01} max={2.5} step={0.05} value={sigmaSmooth}
          onChange={e => setSigmaSmooth(Number(e.target.value))}
          style={{ flex: 1, minWidth: 80, accentColor: '#2dd4bf', cursor: 'pointer' }}
        />
        <button
          disabled={prefersReducedMotion}
          title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
          style={{
            ...btnBase,
            background: playing ? '#1a2e1a' : '#161616',
            color: playing ? '#34d399' : '#e8eaed',
            cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
            opacity: prefersReducedMotion ? 0.5 : 1,
          }}
          onClick={() => { if (prefersReducedMotion) return; setPlaying(p => !p); }}>
          {playing ? '⏸' : '▶'}
        </button>
        <button style={btnBase} onClick={handleNewParticle}>New</button>
        <button style={btnBase} onClick={handleReset}>↺</button>
        <div style={{ width: 1, background: '#242424', alignSelf: 'stretch' }} />
        <button style={toggleBase(showDensity)}  onClick={() => setShowDensity(v => !v)}>Density</button>
        <button style={toggleBase(showField)}    onClick={() => setShowField(v => !v)}>Field</button>
        <button style={toggleBase(showContours)} onClick={() => setShowContours(v => !v)}>Contours</button>
      </div>
    </WidgetCard>
  );
}
