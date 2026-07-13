import { useEffect, useRef, useState, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  accentGlow:'rgba(45,212,191,0.15)',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  codeBg:    '#0a0a0a',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  textMid:   '#888888',
  textMuted: '#555555',
  text:      '#e8eaed',
};

// ─── Fixed initial weights (mix of pos/neg, large/small) ─────────────────────
const RAW_WEIGHTS = [
  1.82, -1.45,  0.93, -0.72,  0.51,
 -0.34,  0.22, -0.11,  0.07, -0.04,
];

// ─── Regularization math ─────────────────────────────────────────────────────
// L1 soft-thresholding: sign(w) * max(0, |w| - λ)
function applyL1(weights, lambda) {
  return weights.map(w => Math.sign(w) * Math.max(0, Math.abs(w) - lambda));
}

// L2 weight shrinkage: w / (1 + λ)
function applyL2(weights, lambda) {
  return weights.map(w => w / (1 + lambda));
}

// Elastic net: L1 then L2 in sequence, α controls L1/L2 mix
// α=1 → pure L1, α=0 → pure L2
function applyElasticNet(weights, lambda, alpha) {
  const l1Lambda = lambda * alpha;
  const l2Lambda = lambda * (1 - alpha);
  const afterL1 = applyL1(weights, l1Lambda);
  return applyL2(afterL1, l2Lambda);
}

function computeWeights(type, lambda, alpha) {
  switch (type) {
    case 'L1':         return applyL1(RAW_WEIGHTS, lambda);
    case 'L2':         return applyL2(RAW_WEIGHTS, lambda);
    case 'Elastic Net':return applyElasticNet(RAW_WEIGHTS, lambda, alpha);
    default:           return RAW_WEIGHTS;
  }
}

function computeStats(weights) {
  const nonZero = weights.filter(w => Math.abs(w) > 1e-9).length;
  const l1Norm  = weights.reduce((s, w) => s + Math.abs(w), 0);
  const l2Norm  = Math.sqrt(weights.reduce((s, w) => s + w * w, 0));
  return { nonZero, l1Norm, l2Norm };
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────
function drawBars(canvas, rawWeights, regWeights) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const n = rawWeights.length;
  const PAD = { top: 16, right: 16, bottom: 28, left: 16 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  // Background
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  // Find max absolute value for y scale (use raw weights for stable scale)
  const maxAbs = Math.max(...rawWeights.map(Math.abs)) * 1.15;

  // Zero line
  const zeroY = PAD.top + plotH / 2;

  // Grid lines at ±0.5, ±1.0, ±1.5
  const gridVals = [-1.5, -1.0, -0.5, 0.5, 1.0, 1.5];
  gridVals.forEach(v => {
    if (Math.abs(v) > maxAbs) return;
    const cy = PAD.top + (1 - (v / maxAbs) * 0.5 - 0.5) * plotH;
    ctx.beginPath();
    ctx.moveTo(PAD.left, cy);
    ctx.lineTo(PAD.left + plotW, cy);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Zero axis line
  ctx.beginPath();
  ctx.moveTo(PAD.left, zeroY);
  ctx.lineTo(PAD.left + plotW, zeroY);
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Bar geometry
  const totalBarW = plotW / n;
  const barW = totalBarW * 0.55;
  const gap  = totalBarW * 0.45;

  const toY = v => PAD.top + (1 - (v / maxAbs) * 0.5 - 0.5) * plotH;

  for (let i = 0; i < n; i++) {
    const rawW = rawWeights[i];
    const regW = regWeights[i];
    const cx = PAD.left + (i + 0.5) * totalBarW;
    const barX = cx - barW / 2;

    // Ghost bar (raw weight) — very dim
    const rawTop    = toY(Math.max(0, rawW));
    const rawBottom = toY(Math.min(0, rawW));
    const rawH      = Math.abs(rawBottom - rawTop);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(barX, rawTop, barW, rawH || 1);

    // Active bar (regularized weight)
    const isZero   = Math.abs(regW) < 1e-9;
    const barColor = isZero ? C.textMuted : rawW >= 0 ? C.accent : C.orange;

    if (isZero) {
      // Draw a small tick at zero
      ctx.beginPath();
      ctx.arc(cx, zeroY, 3, 0, Math.PI * 2);
      ctx.fillStyle = C.textMuted;
      ctx.fill();
    } else {
      const regTop    = toY(Math.max(0, regW));
      const regBottom = toY(Math.min(0, regW));
      const regH      = Math.abs(regBottom - regTop);

      // Bar fill
      ctx.fillStyle = barColor + '55'; // semi-transparent fill
      ctx.fillRect(barX, regTop, barW, regH || 1);

      // Bar border
      ctx.strokeStyle = barColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, regTop, barW, regH || 1);
    }

    // Weight index label
    ctx.fillStyle = C.textMuted;
    ctx.font = `9px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`w${i + 1}`, cx, PAD.top + plotH + 18);
  }

  // Y-axis tick labels at ±maxAbs
  ctx.fillStyle = C.textMuted;
  ctx.font = `9px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`+${(maxAbs / 1.15).toFixed(1)}`, 2, PAD.top + 10);
  ctx.fillText(`−${(maxAbs / 1.15).toFixed(1)}`, 2, PAD.top + plotH - 2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TabGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {options.map(opt => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: active ? 600 : 400,
              padding: '4px 10px',
              borderRadius: '4px',
              border: `1px solid ${active ? C.accent : C.border}`,
              background: active ? C.accentDim : 'transparent',
              color: active ? C.accent : C.textMid,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              letterSpacing: '0.04em',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format, disabled }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      opacity: disabled ? 0.35 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      transition: 'opacity 0.15s ease',
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: C.textMuted,
        minWidth: '24px',
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
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1,
          WebkitAppearance: 'none',
          height: '2px',
          background: C.borderLt,
          borderRadius: '2px',
          cursor: disabled ? 'default' : 'pointer',
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
        fontSize: '20px',
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

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{
      display: 'flex',
      gap: '14px',
      marginTop: '8px',
    }}>
      {[
        { color: 'rgba(255,255,255,0.18)', label: 'original' },
        { color: C.accent,                label: '+weight'   },
        { color: C.orange,                label: '−weight'   },
        { color: C.textMuted,             label: 'zeroed'    },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{
            width: '10px', height: '10px',
            borderRadius: '2px',
            background: color,
            border: `1px solid ${color}`,
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: C.textMuted,
          }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function RegularizationExplorer({ tryThis }) {
  const [regType, setRegType] = useState('L1');
  const [lambda,  setLambda]  = useState(0.3);
  const [alpha,   setAlpha]   = useState(0.5);

  const canvasRef = useRef(null);

  const regWeights = computeWeights(regType, lambda, alpha);
  const stats      = computeStats(regWeights);

  // Color for non-zero count: more zeroed = more "sparse" = good for L1
  const nonZeroColor = stats.nonZero <= 3 ? C.green
                     : stats.nonZero <= 7 ? C.accent
                     : C.textMid;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBars(canvas, RAW_WEIGHTS, regWeights);
  }, [regWeights]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(draw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <WidgetCard title="Regularization Explorer" number="2.3" tryThis={tryThis}>
      {/* Canvas + stat panel */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '180px',
              display: 'block',
              borderRadius: '6px',
              border: `1px solid ${C.border}`,
            }}
          />
          <Legend />
        </div>

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
            label="Non-zero"
            value={`${stats.nonZero} / 10`}
            color={nonZeroColor}
            sub="weights active"
          />
          <StatRow
            label="L1 norm"
            value={stats.l1Norm.toFixed(3)}
            color={C.math}
          />
          <StatRow
            label="L2 norm"
            value={stats.l2Norm.toFixed(3)}
            color={C.purple}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{
        marginTop: '16px',
        borderTop: `1px solid ${C.border}`,
        paddingTop: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Type tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: C.textMuted,
            minWidth: '24px',
            flexShrink: 0,
          }}>
            type
          </span>
          <TabGroup
            options={['L1', 'L2', 'Elastic Net']}
            value={regType}
            onChange={setRegType}
          />
        </div>

        {/* λ slider */}
        <Slider
          label="λ"
          value={lambda}
          min={0}
          max={2}
          step={0.01}
          onChange={setLambda}
          format={v => v.toFixed(2)}
        />

        {/* α slider — only for Elastic Net */}
        <Slider
          label="α"
          value={alpha}
          min={0}
          max={1}
          step={0.01}
          onChange={setAlpha}
          format={v => v.toFixed(2)}
          disabled={regType !== 'Elastic Net'}
        />
      </div>

      {/* Formula display */}
      <div style={{
        marginTop: '10px',
        padding: '8px 12px',
        background: C.codeBg,
        border: `1px solid ${C.border}`,
        borderRadius: '6px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: C.math,
        letterSpacing: '0.02em',
      }}>
        {regType === 'L1' && (
          <>w&#x27; = sign(w) &middot; max(0, |w| &minus; &lambda;)</>
        )}
        {regType === 'L2' && (
          <>w&#x27; = w / (1 + &lambda;)</>
        )}
        {regType === 'Elastic Net' && (
          <>w&#x27; = L2(L1(w, &lambda;&alpha;), &lambda;(1&minus;&alpha;))</>
        )}
      </div>
      <div style={{
        marginTop: '6px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9.5px',
        color: C.textMuted,
        lineHeight: 1.4,
      }}>
        Closed form shown for an orthogonal/uncorrelated design; with correlated features, shrinkage couples across weights instead of applying independently per-weight.
      </div>
    </WidgetCard>
  );
}
