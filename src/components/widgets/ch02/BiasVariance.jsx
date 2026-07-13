import { useEffect, useRef, useState, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  codeBg:    '#0a0a0a',
  bg2:       '#111111',
  textMid:   '#888888',
  textMuted: '#555555',
  text:      '#e8eaed',
  // Area fill colors (stacked layers)
  noise:     '#1a2a28',   // darkest — bottom layer
  bias:      '#1a2060',   // mid — bias² layer (deep blue-indigo)
  variance:  '#2a1a3a',   // top — variance layer (deep purple)
};

// ─── Math: analytic approximations ───────────────────────────────────────────
// d: degree 1..20, noiseLevel: 0.1..1.0
//
// Bias² depends only on model capacity vs. the true function — a hypothesis
// class that is too simple (low d) mismatches the target regardless of how
// noisy the observations are, so it must NOT depend on noiseLevel.
function getBias2(d) {
  return 0.5 * Math.exp(-d / 3);
}

// Variance grows with model capacity (more free parameters to fit to the
// sample) AND with observation noise (noisier samples wiggle the fit more).
// A nonzero floor (0.15) keeps the noise term from vanishing at low noise,
// so the argmin still shifts smoothly across the whole noise range.
function getVariance(d, noiseLevel) {
  return (d / 20) * (d / 20) * (0.15 + noiseLevel);
}

// Irreducible error: the only term that is a pure function of noiseLevel.
function getNoise(noiseLevel) {
  return noiseLevel;
}

function getTotalError(d, noiseLevel) {
  return getNoise(noiseLevel) + getBias2(d) + getVariance(d, noiseLevel);
}

// Build arrays over complexity 1..20
function buildCurves(noiseLevel) {
  const degrees = Array.from({ length: 20 }, (_, i) => i + 1);
  return degrees.map(d => ({
    d,
    noise:    getNoise(noiseLevel),
    bias2:    getBias2(d),
    variance: getVariance(d, noiseLevel),
    total:    getTotalError(d, noiseLevel),
  }));
}

function findOptimalComplexity(noiseLevel) {
  const curves = buildCurves(noiseLevel);
  let minTotal = Infinity;
  let optD = 1;
  curves.forEach(({ d, total }) => {
    if (total < minTotal) { minTotal = total; optD = d; }
  });
  return optD;
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────
function drawChart(canvas, complexity, noiseLevel) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const PAD = { top: 16, right: 20, bottom: 36, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  const curves = buildCurves(noiseLevel);
  const optD   = findOptimalComplexity(noiseLevel);

  // Y range: max total error + small margin
  const maxY = Math.max(...curves.map(c => c.total)) * 1.12;
  const minY = 0;
  const yRange = maxY - minY || 1;

  // Map degree 1..20 to x pixels
  const toX = d => PAD.left + ((d - 1) / 19) * plotW;
  const toY = v => PAD.top + (1 - (v - minY) / yRange) * plotH;

  // ── Background
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  // ── Grid lines
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const v = (i / yTicks) * maxY;
    const cy = toY(v);
    ctx.beginPath();
    ctx.moveTo(PAD.left, cy);
    ctx.lineTo(PAD.left + plotW, cy);
    ctx.stroke();
    ctx.fillStyle = C.textMuted;
    ctx.font = `10px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(v.toFixed(2), PAD.left - 6, cy + 3.5);
  }
  const xTicks = [1, 4, 8, 12, 16, 20];
  xTicks.forEach(d => {
    const cx = toX(d);
    ctx.beginPath();
    ctx.strokeStyle = C.border;
    ctx.moveTo(cx, PAD.top);
    ctx.lineTo(cx, PAD.top + plotH);
    ctx.stroke();
    ctx.fillStyle = C.textMuted;
    ctx.font = `10px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(d, cx, PAD.top + plotH + 16);
  });

  // ── Axes
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
  ctx.stroke();

  // ─ Helper: build a path for a stacked area from baseArr to topArr
  function filledArea(baseVals, topVals) {
    ctx.beginPath();
    // Forward along top edge
    topVals.forEach((v, i) => {
      const d = i + 1;
      const cx = toX(d);
      const cy = toY(v);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    // Backward along base edge
    for (let i = baseVals.length - 1; i >= 0; i--) {
      const d = i + 1;
      ctx.lineTo(toX(d), toY(baseVals[i]));
    }
    ctx.closePath();
  }

  // ── Stacked area: noise (bottom)
  // noise area: from y=0 to y=noise (constant)
  const noiseBase  = curves.map(() => 0);
  const noiseTop   = curves.map(c => c.noise);
  filledArea(noiseBase, noiseTop);
  ctx.fillStyle = C.noise;
  ctx.fill();
  // noise area border
  ctx.beginPath();
  noiseTop.forEach((v, i) => {
    const cx = toX(i + 1);
    const cy = toY(v);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.strokeStyle = 'rgba(45,212,191,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Stacked area: bias² (middle): from noise to noise + bias²
  const bias2Base = curves.map(c => c.noise);
  const bias2Top  = curves.map(c => c.noise + c.bias2);
  filledArea(bias2Base, bias2Top);
  ctx.fillStyle = C.bias;
  ctx.fill();
  ctx.beginPath();
  bias2Top.forEach((v, i) => {
    const cx = toX(i + 1);
    if (i === 0) ctx.moveTo(cx, toY(v));
    else ctx.lineTo(cx, toY(v));
  });
  ctx.strokeStyle = 'rgba(99,102,241,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Stacked area: variance (top): from noise+bias² to total
  const varBase = curves.map(c => c.noise + c.bias2);
  const varTop  = curves.map(c => c.total);
  filledArea(varBase, varTop);
  ctx.fillStyle = C.variance;
  ctx.fill();
  ctx.beginPath();
  varTop.forEach((v, i) => {
    const cx = toX(i + 1);
    if (i === 0) ctx.moveTo(cx, toY(v));
    else ctx.lineTo(cx, toY(v));
  });
  ctx.strokeStyle = 'rgba(167,139,250,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Dashed total error line
  ctx.beginPath();
  curves.forEach((c, i) => {
    const cx = toX(c.d);
    const cy = toY(c.total);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.strokeStyle = C.math;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Optimal complexity star
  const optCurve = curves[optD - 1];
  const starX = toX(optD);
  const starY = toY(optCurve.total);
  drawStar(ctx, starX, starY, 6, 3, 5, C.math);

  // ── Vertical highlight line (current complexity)
  const hlX = toX(complexity);
  ctx.beginPath();
  ctx.moveTo(hlX, PAD.top);
  ctx.lineTo(hlX, PAD.top + plotH);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Small circle on total error line at current complexity
  const curCurve = curves[complexity - 1];
  ctx.beginPath();
  ctx.arc(hlX, toY(curCurve.total), 4, 0, Math.PI * 2);
  ctx.fillStyle = C.accent;
  ctx.fill();

  // ── Axis labels
  ctx.fillStyle = C.textMuted;
  ctx.font = `10px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('model complexity', PAD.left + plotW / 2, H - 2);

  // ── Legend (top-right corner)
  const lx = PAD.left + plotW - 8;
  const ly = PAD.top + 8;
  const legendItems = [
    { label: 'noise',     color: 'rgba(45,212,191,0.4)' },
    { label: 'bias²',     color: 'rgba(99,102,241,0.6)' },
    { label: 'variance',  color: 'rgba(167,139,250,0.6)' },
    { label: 'total err', color: C.math },
  ];
  ctx.font = `9px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'right';
  legendItems.forEach((item, i) => {
    const iy = ly + i * 16;
    ctx.fillStyle = item.color;
    ctx.fillRect(lx - 20, iy, 12, 9);
    ctx.fillStyle = C.textMuted;
    ctx.fillText(item.label, lx - 26, iy + 8);
  });
}

// ─── Draw a 5-pointed star ────────────────────────────────────────────────────
function drawStar(ctx, cx, cy, outerR, innerR, points, color) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ─── Slider component ─────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: C.textMuted,
        minWidth: '78px',
        flexShrink: 0,
      }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1,
          WebkitAppearance: 'none',
          height: '2px',
          background: C.borderLt,
          borderRadius: '2px',
          cursor: 'pointer',
          accentColor: C.accent,
          outline: 'none',
        }}
      />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: C.accent,
        minWidth: '36px',
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {format ? format(value) : value}
      </span>
    </div>
  );
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value, color, sub }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9.5px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: C.textMuted,
        marginBottom: '2px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '18px',
        color: color || C.accent,
        lineHeight: 1.2,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: C.textMuted,
          marginTop: '2px',
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function BiasVariance({ tryThis }) {
  const [complexity,  setComplexity]  = useState(5);
  const [noiseLevel,  setNoiseLevel]  = useState(0.4);

  const canvasRef = useRef(null);

  const optD      = findOptimalComplexity(noiseLevel);
  const bias2Val  = getBias2(complexity);
  const varVal    = getVariance(complexity, noiseLevel);
  const noiseVal  = getNoise(noiseLevel);
  const totalVal  = getTotalError(complexity, noiseLevel);

  // Bias color: high when complexity is low
  const bias2Color  = bias2Val > noiseLevel * 0.5 ? C.red : bias2Val < noiseLevel * 0.15 ? C.green : C.accent;
  // Variance color: high when complexity is high
  const varColor    = varVal   > noiseLevel * 0.5 ? C.red : varVal   < noiseLevel * 0.15 ? C.green : C.accent;
  // Optimal star label
  const isOptimal   = complexity === optD;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawChart(canvas, complexity, noiseLevel);
  }, [complexity, noiseLevel]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(draw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <WidgetCard title="Bias-Variance Decomposition" number="2.2" tryThis={tryThis}>
      {/* Canvas + stat panel */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            flex: 1,
            height: '200px',
            display: 'block',
            borderRadius: '6px',
            border: `1px solid ${C.border}`,
          }}
        />

        {/* Stat panel */}
        <div style={{
          width: '140px',
          flexShrink: 0,
          background: C.bg2,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '14px 16px',
        }}>
          <StatRow
            label="Bias²"
            value={bias2Val.toFixed(3)}
            color={bias2Color}
          />
          <StatRow
            label="Variance"
            value={varVal.toFixed(3)}
            color={varColor}
          />
          <StatRow
            label="Noise"
            value={noiseVal.toFixed(3)}
            color={C.textMid}
          />
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '10px', marginTop: '2px' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9.5px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.textMuted,
              marginBottom: '4px',
            }}>
              Optimal d ★
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '22px',
              color: isOptimal ? C.math : C.accent,
              lineHeight: 1.1,
            }}>
              {optD}
            </div>
            {isOptimal && (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: C.math,
                marginTop: '3px',
              }}>
                ← you're here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        marginTop: '16px',
        borderTop: `1px solid ${C.border}`,
        paddingTop: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <Slider
          label="complexity"
          value={complexity}
          min={1}
          max={20}
          step={1}
          onChange={setComplexity}
          format={v => v}
        />
        <Slider
          label="noise level"
          value={noiseLevel}
          min={0.1}
          max={1.0}
          step={0.05}
          onChange={setNoiseLevel}
          format={v => v.toFixed(2)}
        />
      </div>
    </WidgetCard>
  );
}
