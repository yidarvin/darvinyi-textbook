import { useRef, useEffect, useState, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  codeBg:    '#0a0a0a',
  text:      '#e8eaed',
  textMuted: '#555555',
  textMid:   '#888888',
  accentDim: '#0b2422',
};

// ─── Loss functions ───────────────────────────────────────────────────────────
const mse = (p, y) => (p - y) ** 2;

const ce = (p, y) => {
  const pc = Math.max(0.001, Math.min(0.999, p));
  return -(y * Math.log(pc) + (1 - y) * Math.log(1 - pc));
};

const focal = (p, y, g) => {
  const pc = Math.max(0.001, Math.min(0.999, p));
  return (
    -Math.pow(1 - pc, g) * y * Math.log(pc)
    - Math.pow(pc, g) * (1 - y) * Math.log(1 - pc)
  );
};

// ─── Canvas constants ─────────────────────────────────────────────────────────
const CW = 440, CH = 200;
const PL = 44, PR = 12, PT = 30, PB = 26;
const N = 100;

// ─── Component ────────────────────────────────────────────────────────────────
export default function LossFunctions() {
  const canvasRef = useRef(null);
  const [trueLabel, setTrueLabel] = useState(1);
  const [predY, setPredY]         = useState(0.5);
  const [gamma, setGamma]         = useState(2);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width  = CW + 'px';
    canvas.style.height = CH + 'px';
    canvas.width  = CW * dpr;
    canvas.height = CH * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const plotW = CW - PL - PR;
    const plotH = CH - PT - PB;

    const xs = Array.from({ length: N }, (_, i) => i / (N - 1));

    const mseCurve   = xs.map(x => mse(x, trueLabel));
    const ceCurve    = xs.map(x => ce(x, trueLabel));
    const focalCurve = xs.map(x => focal(x, trueLabel, gamma));

    const rawMax = Math.max(...mseCurve, ...ceCurve, ...focalCurve);
    const yMax   = Math.min(5, rawMax * 1.08);

    const toX = t => PL + t * plotW;
    const toY = v => PT + plotH * (1 - Math.min(v, yMax) / yMax);

    // Background
    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, 0, CW, CH);

    // Horizontal grid lines + y-axis labels
    ctx.font = '9px "JetBrains Mono", monospace';
    for (let i = 0; i <= 4; i++) {
      const t  = i / 4;
      const yv = t * yMax;
      const py = toY(yv);

      ctx.strokeStyle = C.border;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(PL, py);
      ctx.lineTo(CW - PR, py);
      ctx.stroke();

      ctx.fillStyle = C.textMuted;
      ctx.textAlign = 'right';
      ctx.fillText(yv.toFixed(1), PL - 4, py + 3);
    }

    // X-axis tick labels
    ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach(t => {
      ctx.fillStyle = C.textMuted;
      ctx.fillText(t.toFixed(2), toX(t), PT + plotH + 14);
    });

    // X-axis label
    ctx.fillStyle = C.textMid;
    ctx.fillText('ŷ', CW - PR, PT + plotH + 14);

    // Draw a curve
    const drawCurve = (data, color) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.75;
      ctx.lineJoin = 'round';
      data.forEach((v, i) => {
        const x = toX(xs[i]);
        const y = toY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    drawCurve(mseCurve,   C.accent);
    drawCurve(ceCurve,    C.orange);
    drawCurve(focalCurve, C.purple);

    // Vertical dashed indicator at predY
    const ix = toX(predY);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(ix, PT);
    ctx.lineTo(ix, PT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Dots on each curve at predY
    [
      [mse(predY, trueLabel),          C.accent],
      [ce(predY, trueLabel),           C.orange],
      [focal(predY, trueLabel, gamma), C.purple],
    ].forEach(([v, color]) => {
      const dotY = toY(v);
      ctx.beginPath();
      ctx.arc(ix, dotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = C.codeBg;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Legend — top-right, drawn right-to-left
    const legendItems = [
      { label: 'MSE',                  color: C.accent },
      { label: 'CE',                   color: C.orange },
      { label: `Focal γ=${gamma.toFixed(1)}`, color: C.purple },
    ];
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    let lx = CW - PR - 2;
    [...legendItems].reverse().forEach(({ label, color }) => {
      ctx.fillStyle = color;
      ctx.fillText(label, lx, PT - 12);
      const tw = ctx.measureText(label).width;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.moveTo(lx - tw - 16, PT - 15);
      ctx.lineTo(lx - tw - 4,  PT - 15);
      ctx.stroke();
      lx -= tw + 24;
    });
  }, [trueLabel, predY, gamma]);

  useEffect(() => { draw(); }, [draw]);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const mseVal   = mse(predY, trueLabel);
  const ceVal    = ce(predY, trueLabel);
  const focalVal = focal(predY, trueLabel, gamma);
  const pc       = Math.max(0.001, Math.min(0.999, predY));
  const easyFactor = trueLabel === 1
    ? Math.pow(1 - pc, gamma)
    : Math.pow(pc, gamma);

  // ── Sub-components ─────────────────────────────────────────────────────────
  const StatRow = ({ name, value, color }) => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px', fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: C.textMuted, marginBottom: '1px',
      }}>
        {name}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '20px', color,
      }}>
        {value.toFixed(4)}
      </div>
    </div>
  );

  const sliderBase = {
    WebkitAppearance: 'none',
    width: '100%', height: '2px',
    borderRadius: '2px', background: C.borderLt,
    cursor: 'pointer', outline: 'none',
  };

  const labelStyle = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px', color: C.textMuted,
    width: '100px', flexShrink: 0,
  };

  const valStyle = (color) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px', color,
    width: '36px', textAlign: 'right', flexShrink: 0,
  });

  return (
    <WidgetCard title="Loss Functions — MSE, cross-entropy, focal" number="3.4">

      {/* ── Canvas + Stats ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

        <canvas
          ref={canvasRef}
          style={{ display: 'block', borderRadius: '4px', flexShrink: 0 }}
        />

        {/* Stats panel */}
        <div style={{
          background: C.bg2,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '14px 16px',
          flex: 1, minWidth: 0,
        }}>
          <StatRow name="MSE"           value={mseVal}   color={C.accent} />
          <StatRow name="Cross-entropy" value={ceVal}    color={C.orange} />
          <StatRow name="Focal loss"    value={focalVal} color={C.purple} />

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '10px', marginTop: '2px' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: C.textMuted, marginBottom: '3px',
            }}>
              Focal reduces easy loss by
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '18px', color: C.purple,
            }}>
              ×{easyFactor.toFixed(4)}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px', color: C.textMuted, marginTop: '2px',
            }}>
              {trueLabel === 1 ? '(1−ŷ)^γ' : 'ŷ^γ'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* True label toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={labelStyle}>true label y</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0, 1].map(v => (
              <button
                key={v}
                onClick={() => setTrueLabel(v)}
                style={{
                  padding: '3px 16px',
                  borderRadius: '4px',
                  border: `1px solid ${trueLabel === v ? C.accent : C.border}`,
                  background: trueLabel === v ? C.accentDim : C.bg4,
                  color: trueLabel === v ? C.accent : C.textMid,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'border-color 0.1s, background 0.1s',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Predicted ŷ slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={labelStyle}>predicted ŷ</span>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={predY}
            onChange={e => setPredY(+e.target.value)}
            style={{ ...sliderBase, flex: 1 }}
          />
          <span style={valStyle(C.accent)}>{predY.toFixed(2)}</span>
        </div>

        {/* Focal γ slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={labelStyle}>focal γ</span>
          <input
            type="range"
            min={0} max={5} step={0.1}
            value={gamma}
            onChange={e => setGamma(+e.target.value)}
            style={{ ...sliderBase, flex: 1 }}
          />
          <span style={valStyle(C.purple)}>{gamma.toFixed(1)}</span>
        </div>

      </div>
    </WidgetCard>
  );
}
