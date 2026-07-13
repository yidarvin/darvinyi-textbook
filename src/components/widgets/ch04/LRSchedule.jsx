import { useRef, useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const CH = 180;
const PAD = { top: 14, right: 16, bottom: 36, left: 54 };
const PH = CH - PAD.top - PAD.bottom;

const SCHED = [
  { key: 'step',     label: 'Step decay',   color: '#888888' },
  { key: 'cosine',   label: 'Cosine',       color: '#2dd4bf' },
  { key: 'warmup',   label: 'Warmup+decay', color: '#fb923c' },
  { key: 'onecycle', label: 'OneCycleLR',   color: '#a78bfa' },
  { key: 'wsd',      label: 'WSD',          color: '#4ade80' },
];

const TABS    = ['None', 'Step', 'Cosine', 'Warmup', 'OneCycle', 'WSD'];
const TAB_KEY = { None: null, Step: 'step', Cosine: 'cosine', Warmup: 'warmup', OneCycle: 'onecycle', WSD: 'wsd' };
const TAB_COL = { None: '#666666', Step: '#888888', Cosine: '#2dd4bf', Warmup: '#fb923c', OneCycle: '#a78bfa', WSD: '#4ade80' };

const LOG_MIN  = Math.log(0.0001);
const LOG_MAX  = Math.log(0.1);
const sliderToLR = v  => Math.exp(LOG_MIN + (v / 1000) * (LOG_MAX - LOG_MIN));
const lrToSlider = lr => Math.round(((Math.log(lr) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000);

function computeLR(key, t, { baseLR, totalSteps, warmupSteps, wsdDecayFrac }) {
  const maxLR = baseLR * 10;
  const minLR = baseLR * 0.01;
  switch (key) {
    case 'step': {
      const stepSize = totalSteps / 3;
      return baseLR * Math.pow(0.1, Math.floor(t / stepSize));
    }
    case 'cosine':
      return minLR + 0.5 * (baseLR - minLR) * (1 + Math.cos(Math.PI * t / totalSteps));
    case 'warmup': {
      if (warmupSteps === 0) return Math.max(0, baseLR * (totalSteps - t) / totalSteps);
      const ws = Math.min(warmupSteps, totalSteps - 1);
      if (t < ws) return baseLR * t / ws;
      return Math.max(0, baseLR * (totalSteps - t) / (totalSteps - ws));
    }
    case 'onecycle': {
      const half = totalSteps / 2;
      if (t <= half) return baseLR + (maxLR - baseLR) * t / half;
      const decayT = t - half;
      return baseLR / 10 + 0.5 * (maxLR - baseLR / 10) * (1 + Math.cos(Math.PI * decayT / half));
    }
    case 'wsd': {
      // Warmup - Stable - Decay (Hu et al. 2024): ramp to peak, hold flat at
      // peak for as long as needed (no total-step count required until the
      // decay is triggered), then decay over a short tail.
      const ws = Math.min(warmupSteps, totalSteps - 1);
      const decaySteps = Math.max(1, Math.round(totalSteps * wsdDecayFrac));
      const decayStart = Math.max(ws, totalSteps - decaySteps);
      const floor = baseLR * 0.1;
      if (ws > 0 && t < ws) return baseLR * t / ws;
      if (t < decayStart) return baseLR;
      const decayLen = totalSteps - decayStart; // always >= 1 since ws <= totalSteps - 1
      const frac = Math.min(1, (t - decayStart) / decayLen);
      return baseLR - (baseLR - floor) * frac;
    }
    default: return baseLR;
  }
}

function fmtLR(v) {
  if (v <= 0) return '0.0000';
  if (v < 0.00005) return v.toExponential(2);
  return v.toFixed(4);
}

const mono = { fontFamily: "'JetBrains Mono', monospace" };

export default function LRSchedule({ tryThis }) {
  const canvasRef = useRef(null);
  const [totalSteps,  setTotalSteps]  = useState(500);
  const [warmupSteps, setWarmupSteps] = useState(50);
  const [lrSlider,    setLrSlider]    = useState(lrToSlider(0.01));
  const [currentStep, setCurrentStep] = useState(0);
  const [highlight,   setHighlight]   = useState('None');
  const [wsdDecayPct, setWsdDecayPct] = useState(15);

  const baseLR       = sliderToLR(lrSlider);
  const wsdDecayFrac = wsdDecayPct / 100;
  const params = { baseLR, totalSteps, warmupSteps, wsdDecayFrac };
  const step   = Math.min(currentStep, totalSteps);

  useEffect(() => {
    setCurrentStep(s => Math.min(s, totalSteps));
  }, [totalSteps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cw   = rect.width;
    const pw   = cw - PAD.left - PAD.right;

    canvas.width  = cw * dpr;
    canvas.height = CH * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const maxLR    = baseLR * 10;
    const yMax     = maxLR * 1.2;
    const activeKey = TAB_KEY[highlight];
    const toX = t  => PAD.left + (t / totalSteps) * pw;
    const toY = lr => PAD.top  + PH - Math.max(0, Math.min(1, lr / yMax)) * PH;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, cw, CH);

    // Grid
    ctx.setLineDash([]);
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (i / 4) * PH;
      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + pw, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + PH);
    ctx.lineTo(PAD.left + pw, PAD.top + PH);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#555555';
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = (i / 4) * yMax;
      const y   = PAD.top + PH - (i / 4) * PH;
      ctx.fillText(fmtLR(val), PAD.left - 4, y + 3);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach(frac => {
      ctx.fillText(
        Math.round(frac * totalSteps),
        PAD.left + frac * pw,
        PAD.top + PH + 14
      );
    });

    // Schedule curves
    const N = Math.min(totalSteps, 600);
    for (const { key, color } of SCHED) {
      const active = activeKey === null || key === activeKey;
      ctx.globalAlpha = active ? 1 : 0.15;
      ctx.strokeStyle = color;
      ctx.lineWidth   = key === activeKey ? 3 : 1.5;
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const t  = Math.round((i / N) * totalSteps);
        const lr = computeLR(key, t, params);
        const x  = toX(t);
        const y  = toY(Math.max(0, lr));
        if (i === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Vertical indicator
    const ix = toX(step);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(ix, PAD.top);
    ctx.lineTo(ix, PAD.top + PH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend (top-right)
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = 'right';
    const LX = PAD.left + pw - 2;
    let   LY = PAD.top + 4;
    for (const { key, label, color } of SCHED) {
      const active = activeKey === null || key === activeKey;
      ctx.globalAlpha = active ? 1 : 0.3;
      const tw = ctx.measureText(label).width;
      ctx.strokeStyle = color;
      ctx.lineWidth   = key === activeKey ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(LX - tw - 12, LY + 3);
      ctx.lineTo(LX - tw - 2,  LY + 3);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(label, LX, LY + 6);
      LY += 13;
    }
    ctx.globalAlpha = 1;

  }, [baseLR, totalSteps, warmupSteps, wsdDecayFrac, step, highlight]);

  const lrVals = Object.fromEntries(
    SCHED.map(({ key }) => [key, computeLR(key, step, params)])
  );

  return (
    <WidgetCard title="LR Schedules — step decay, cosine, warmup, OneCycle, WSD" number="4.4" tryThis={tryThis}>
      {/* Canvas — full width */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block', width: '100%', height: CH,
          borderRadius: 6, background: '#0a0a0a',
        }}
      />

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${SCHED.length}, 1fr)`,
        gap: '0 12px', margin: '14px 0 0',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '12px 16px',
      }}>
        {SCHED.map(({ key, label, color }) => (
          <div key={key}>
            <div style={{ ...mono, fontSize: 10, color, opacity: 0.8, marginBottom: 3 }}>{label}</div>
            <div style={{ ...mono, fontSize: 15, color }}>{fmtLR(lrVals[key])}</div>
          </div>
        ))}
      </div>

      {/* Highlight tabs */}
      <div style={{ display: 'flex', gap: 6, margin: '14px 0 10px', alignItems: 'center' }}>
        <span style={{ ...mono, fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>highlight</span>
        {TABS.map(tab => {
          const active = highlight === tab;
          const col    = TAB_COL[tab];
          return (
            <button key={tab} onClick={() => setHighlight(tab)} style={{
              ...mono, fontSize: 11, padding: '3px 10px',
              border: `1px solid ${active ? col : 'var(--border)'}`,
              borderRadius: 4,
              background: active ? 'transparent' : 'var(--bg4)',
              color: active ? col : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: active ? 600 : 400,
            }}>
              {tab}
            </button>
          );
        })}
      </div>

      {/* Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        {[
          { label: `total steps — ${totalSteps}`,   min: 100, max: 2000,       value: totalSteps,  onChange: v => setTotalSteps(v) },
          { label: `warmup steps — ${warmupSteps}`, min: 0,   max: 200,        value: warmupSteps, onChange: v => setWarmupSteps(v) },
          { label: `base LR — ${baseLR.toFixed(4)}`,min: 0,   max: 1000,       value: lrSlider,    onChange: v => setLrSlider(v) },
          { label: `current step t — ${step}`,      min: 0,   max: totalSteps, value: step,        onChange: v => setCurrentStep(v) },
          { label: `WSD decay tail — ${wsdDecayPct}%`, min: 5, max: 30,        value: wsdDecayPct, onChange: v => setWsdDecayPct(v) },
        ].map(({ label, min, max, value, onChange }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <input type="range" min={min} max={max} value={value}
              onChange={e => onChange(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#2dd4bf' }} />
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
