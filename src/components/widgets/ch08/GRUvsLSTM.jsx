import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  orange:    '#fb923c',
  border:    '#242424',
  bg2:       '#111111',
  codeBg:    '#0a0a0a',
  text:      '#e8eaed',
  mid:       '#888888',
  muted:     '#555555',
};

const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ── Input sequences ───────────────────────────────────────────────────────

function makeInputs(preset) {
  if (preset === 'Sine') return Array.from({ length: 20 }, (_, t) => Math.sin(t * 0.4));
  if (preset === 'Step') return Array.from({ length: 20 }, (_, t) => t < 10 ? 0.8 : -0.8);
  return [0.6,-0.3,0.8,0.1,-0.7,0.4,-0.2,0.9,-0.5,0.3,0.7,-0.8,0.2,0.6,-0.4,0.1,0.8,-0.6,0.3,-0.1];
}

function computeHidden(x, wX, wH) {
  const h = new Array(20);
  h[0] = Math.tanh(wX * x[0]);
  for (let t = 1; t < 20; t++) h[t] = Math.tanh(wX * x[t] + wH * h[t - 1]);
  return h;
}

// ── Panel drawing ─────────────────────────────────────────────────────────

function drawPanel(ctx, px, py, pw, ph, opts) {
  const { title, h0, h1, dim, showHighlight, hlMin, hlEnd, divVal, showAnnot, endT } = opts;

  const PL = 40, PR = 12, PT = 28, PB = 36;
  const plotW = pw - PL - PR;
  const plotH = ph - PT - PB;
  const YMIN = -1.2, YMAX = 1.2;

  const toX = t  => px + PL + (t  / 19)           * plotW;
  const toY = v  => py + PT + ((YMAX - v) / (YMAX - YMIN)) * plotH;

  // Background
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(px, py, pw, ph);

  // Title
  ctx.save();
  ctx.fillStyle = C.text;
  ctx.font = "16px 'Crimson Pro', serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, px + pw / 2, py + 7);
  ctx.restore();

  // Y = 0 dashed guide
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + PL, toY(0));
  ctx.lineTo(px + PL + plotW, toY(0));
  ctx.stroke();
  ctx.restore();

  // Y-axis ticks and labels
  ctx.save();
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const v of [-1, 0, 1]) {
    ctx.fillText(v.toString(), px + PL - 5, toY(v));
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + PL, toY(v));
    ctx.lineTo(px + PL + plotW, toY(v));
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // X-axis ticks and labels
  ctx.save();
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const t of [0, 5, 10, 15, 19]) {
    ctx.fillText(t.toString(), toX(t), py + PT + plotH + 6);
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toX(t), py + PT);
    ctx.lineTo(toX(t), py + PT + plotH);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Divergence shading
  if (showHighlight) {
    const x0 = toX(hlMin);
    const x1 = toX(hlEnd);
    ctx.fillStyle = 'rgba(251,191,36,0.12)';
    ctx.fillRect(x0, py + PT, x1 - x0, plotH);

    if (showAnnot) {
      const label = `max Δ=${divVal.toFixed(2)}`;
      ctx.save();
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = C.math;
      ctx.textBaseline = 'top';
      const approxW = label.length * 5.5;
      const ax = (x1 + 4 + approxW > px + pw - 4) ? x0 - approxW - 4 : x1 + 4;
      ctx.textAlign = 'left';
      ctx.fillText(label, ax, py + PT + 4);
      ctx.restore();
    }
  }

  // Line drawing helper
  const drawLine = (data, color, dashed, lw) => {
    if (!data) return;
    const lastT = Math.min(endT, 19);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (let t = 1; t <= lastT; t++) ctx.lineTo(toX(t), toY(data[t]));
    ctx.stroke();
    // Dot at current tip during animation
    if (lastT < 19) {
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(toX(lastT), toY(data[lastT]), lw + 1, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.restore();
  };

  if (dim !== 'h[1] only') drawLine(h0, C.accent, false, 2);
  if (dim !== 'h[0] only') drawLine(h1, C.orange, true, 1.5);

  // Legend
  const legY = py + ph - 10;
  const legX = px + PL;

  if (dim !== 'h[1] only') {
    ctx.save();
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 14, legY);
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = "10px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('h[0]', legX + 17, legY);
    ctx.restore();
  }

  if (dim !== 'h[0] only') {
    const ox = dim === 'Both' ? 52 : 0;
    ctx.save();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(legX + ox, legY);
    ctx.lineTo(legX + ox + 14, legY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.muted;
    ctx.font = "10px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('h[1]', legX + ox + 17, legY);
    ctx.restore();
  }
}

// ── Component ─────────────────────────────────────────────────────────────

export default function GRUvsLSTM() {
  const [preset,        setPreset]        = useState('Sine');
  const [dim,           setDim]           = useState('Both');
  const [showHighlight, setShowHighlight] = useState(true);
  const [animStep,      setAnimStep]      = useState(20);

  const canvasRef    = useRef(null);
  const animRef      = useRef(null);
  const animStepRef  = useRef(20);

  const states = useMemo(() => {
    const x = makeInputs(preset);
    return {
      lstmH0: computeHidden(x, 0.7,  0.90),
      lstmH1: computeHidden(x, 1.1,  0.30),
      gruH0:  computeHidden(x, 0.7,  0.75),
      gruH1:  computeHidden(x, 1.1,  0.25),
    };
  }, [preset]);

  const divInfo = useMemo(() => {
    const arr  = states.lstmH0.map((v, t) => Math.abs(v - states.gruH0[t]));
    const tMax = arr.indexOf(Math.max(...arr));
    return { tMax, tMin: Math.max(0, tMax - 1), tEnd: Math.min(19, tMax + 1), maxVal: arr[tMax] };
  }, [states]);

  const draw = useCallback((endT) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = window.devicePixelRatio || 1;
    const cw  = Math.round(rect.width  * dpr);
    const ch  = Math.round(rect.height * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width  = cw;
      canvas.height = ch;
    }
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const gap  = 20;
    const pw   = (rect.width - gap) / 2;
    const ph   = rect.height;
    const et   = Math.min(endT, 19);

    const shared = {
      dim, showHighlight,
      hlMin: divInfo.tMin, hlEnd: divInfo.tEnd,
      divVal: divInfo.maxVal, endT: et,
    };

    drawPanel(ctx, 0,        0, pw, ph, { ...shared, title: 'LSTM', h0: states.lstmH0, h1: states.lstmH1, showAnnot: false });
    drawPanel(ctx, pw + gap, 0, pw, ph, { ...shared, title: 'GRU',  h0: states.gruH0,  h1: states.gruH1,  showAnnot: true  });

    ctx.restore();
  }, [states, dim, showHighlight, divInfo]);

  useEffect(() => { draw(animStep); }, [draw, animStep]);

  const stopAnim = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }, []);

  const startAnim = useCallback(() => {
    stopAnim();
    animStepRef.current = 0;
    setAnimStep(0);
    let last = 0;
    function frame(now) {
      if (now - last >= 30) {
        last = now;
        animStepRef.current += 1;
        if (animStepRef.current >= 19) {
          setAnimStep(20);
          animRef.current = null;
          return;
        }
        setAnimStep(animStepRef.current);
      }
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }, [stopAnim]);

  useEffect(() => () => stopAnim(), [stopAnim]);

  const { lstmH0, gruH0 } = states;

  return (
    <WidgetCard title="GRU vs LSTM — same sequence, different memory" number="6.4">
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

        {/* Canvas + controls */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '300px', display: 'block', borderRadius: '4px' }}
          />

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <CtrlRow label="Sequence">
              {['Sine', 'Step', 'Noisy'].map(p => (
                <Tab key={p} active={p === preset} onClick={() => setPreset(p)}>{p}</Tab>
              ))}
            </CtrlRow>

            <CtrlRow label="Dimension">
              {['h[0] only', 'h[1] only', 'Both'].map(d => (
                <Tab key={d} active={d === dim} onClick={() => setDim(d)}>{d}</Tab>
              ))}
            </CtrlRow>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showHighlight}
                  onChange={e => setShowHighlight(e.target.checked)}
                  style={{ accentColor: C.accent }}
                />
                <span style={{ ...mono, fontSize: '11px', color: C.muted }}>Highlight divergence</span>
              </label>
              <button
                onClick={startAnim}
                style={{
                  padding: '4px 12px', borderRadius: '4px',
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.accent, ...mono, fontSize: '11px', cursor: 'pointer', outline: 'none',
                }}
              >
                ▶ Animate
              </button>
            </div>
          </div>
        </div>

        {/* Stats panel */}
        <div style={{
          width: '180px', flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <StatSection label="Parameters (approx)">
            <StatRow label="LSTM"      val="24"         color={C.accent} />
            <StatRow label="GRU"       val="18"         color={C.orange} />
            <StatRow label="GRU saves" val="25% fewer"  color={C.muted}  />
          </StatSection>

          <Divider />

          <StatSection label="Divergence (h[0])">
            <StatItem label="Max Δ"    val={divInfo.maxVal.toFixed(3)} color={C.math}  />
            <StatItem label="At timestep"  val={`t = ${divInfo.tMax}`}     color={C.text}  />
            <StatItem label="Sequence"     val={preset}                     color={C.text}  />
          </StatSection>

          <Divider />

          <StatSection label="h[0] at t=19">
            <StatRow label="LSTM" val={lstmH0[19].toFixed(3)} color={C.accent} />
            <StatRow label="GRU"  val={gruH0[19].toFixed(3)}  color={C.orange} />
          </StatSection>
        </div>
      </div>
    </WidgetCard>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: '4px',
      border: `1px solid ${active ? C.accent : C.border}`,
      background: active ? C.accentDim : 'transparent',
      color: active ? C.accent : C.muted,
      ...mono, fontSize: '11px', cursor: 'pointer', outline: 'none',
    }}>
      {children}
    </button>
  );
}

function CtrlRow({ label, children }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: '11px', color: C.muted, marginBottom: '6px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

function StatSection({ label, children }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, val, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
      <span style={{ ...mono, fontSize: '10px', color: C.muted }}>{label}</span>
      <span style={{ ...mono, fontSize: '10px', color }}>{val}</span>
    </div>
  );
}

function StatItem({ label, val, color }) {
  return (
    <div style={{ marginBottom: '5px' }}>
      <div style={{ ...mono, fontSize: '9px', color: C.muted }}>{label}</div>
      <div style={{ ...mono, fontSize: '12px', color }}>{val}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: `1px solid ${C.border}` }} />;
}
