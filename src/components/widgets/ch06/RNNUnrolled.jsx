import { useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const WX = 0.6, WH = 0.8, B = 0.1;

const SEQUENCES = {
  Sine:        [0.8, 0.6, 0.2, -0.2, -0.6, -0.8, -0.6, -0.2],
  Random:      [0.5, -0.7, 0.3, 0.9, -0.4, 0.1, -0.8, 0.6],
  Alternating: [0.9, -0.9, 0.9, -0.9, 0.9, -0.9, 0.9, -0.9],
};

function computeH(xs) {
  const h = new Array(8);
  let prev = 0;
  for (let t = 0; t < 8; t++) {
    h[t] = Math.tanh(WX * xs[t] + WH * prev + B);
    prev = h[t];
  }
  return h;
}

const PRECOMPUTED = Object.fromEntries(
  Object.entries(SEQUENCES).map(([name, xs]) => [name, computeH(xs)])
);

function lerpHex(c1, c2, t) {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function hColor(h) {
  const v = Math.max(-1, Math.min(1, h));
  return v < 0 ? lerpHex('#f87171', '#1e1e1e', v + 1) : lerpHex('#1e1e1e', '#2dd4bf', v);
}

const C = {
  accent:   '#2dd4bf',
  red:      '#f87171',
  bg3:      '#161616',
  bg4:      '#1e1e1e',
  border:   '#242424',
  borderLt: '#2e2e2e',
  textMid:  '#888888',
  textMute: '#555555',
  math:     '#fbbf24',
  codeBg:   '#0a0a0a',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

const SVG_W = 680, SVG_H = 220;
const COL_X = Array.from({ length: 8 }, (_, i) => 60 + i * 80);
const Y_INPUT = 175, Y_HIDDEN = 100, Y_OUTPUT = 30;
const R_INPUT = 12, R_HIDDEN = 18, R_OUTPUT = 10;

function BtnStyle(disabled, active = false) {
  return {
    padding: '5px 12px',
    borderRadius: '4px',
    border: `1px solid ${active ? C.accent : disabled ? C.border : C.borderLt}`,
    background: active ? 'var(--accent-dim)' : C.bg4,
    color: disabled ? C.textMute : active ? C.accent : C.textMid,
    ...mono,
    fontSize: '11px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}

export default function RNNUnrolled() {
  const [currentStep, setCurrentStep] = useState(0);
  const [preset, setPreset]           = useState('Sine');
  const [playing, setPlaying]         = useState(false);
  const [showValues, setShowValues]   = useState(true);
  const [showOutput, setShowOutput]   = useState(false);
  const [pulseStep, setPulseStep]     = useState(-1);

  const xs = SEQUENCES[preset];
  const hs = PRECOMPUTED[preset];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentStep(s => {
        if (s >= 7) { setPlaying(false); return s; }
        const next = s + 1;
        setPulseStep(next);
        setTimeout(() => setPulseStep(p => p === next ? -1 : p), 300);
        return next;
      });
    }, 900);
    return () => clearInterval(id);
  }, [playing]);

  function advance() {
    if (currentStep >= 7) return;
    const next = currentStep + 1;
    setCurrentStep(next);
    setPulseStep(next);
    setTimeout(() => setPulseStep(p => p === next ? -1 : p), 300);
  }

  function retreat() { if (currentStep > 0) setCurrentStep(s => s - 1); }

  function reset() { setCurrentStep(0); setPlaying(false); setPulseStep(-1); }

  function changePreset(name) { setPreset(name); setCurrentStep(0); setPlaying(false); setPulseStep(-1); }

  const xt       = xs[currentStep];
  const ht       = hs[currentStep];
  const htPrev   = currentStep > 0 ? hs[currentStep - 1] : 0.0;
  const tanhIn   = WX * xt + WH * htPrev + B;

  return (
    <WidgetCard title="RNN Unrolled — step through a sequence" number="6.1">
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

        {/* Left column: diagram + formula */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* SVG diagram */}
          <div style={{ background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
              <style>{`
                .rnn-pulse {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: rnn-pulse-anim 0.3s ease-in-out;
                }
                @keyframes rnn-pulse-anim {
                  0%   { transform: scale(1.0); }
                  50%  { transform: scale(1.2); }
                  100% { transform: scale(1.0); }
                }
              `}</style>

              {/* Vertical xt → ht edges */}
              {COL_X.map((cx, t) => (
                <line
                  key={`xi-${t}`}
                  x1={cx} y1={Y_INPUT - R_INPUT}
                  x2={cx} y2={Y_HIDDEN + R_HIDDEN}
                  stroke={C.borderLt} strokeWidth={1}
                  opacity={t > currentStep ? 0.15 : 1}
                />
              ))}

              {/* Vertical ht → yt edges (showOutput only) */}
              {showOutput && COL_X.map((cx, t) => (
                t <= currentStep && (
                  <line
                    key={`hy-${t}`}
                    x1={cx} y1={Y_HIDDEN - R_HIDDEN}
                    x2={cx} y2={Y_OUTPUT + R_OUTPUT}
                    stroke={C.borderLt} strokeWidth={1}
                  />
                )
              ))}

              {/* Recurrent ht-1 → ht bezier edges */}
              {Array.from({ length: 7 }, (_, i) => {
                const t   = i + 1;
                const x1  = COL_X[t - 1], x2 = COL_X[t];
                const mx  = (x1 + x2) / 2;
                const isActive = t === currentStep;
                const isPast   = t < currentStep;
                return (
                  <path
                    key={`rec-${t}`}
                    d={`M ${x1} ${Y_HIDDEN} Q ${mx} ${Y_HIDDEN - 20} ${x2} ${Y_HIDDEN}`}
                    stroke={C.accent}
                    strokeWidth={isActive ? 2 : 1.5}
                    fill="none"
                    opacity={isActive ? 1.0 : isPast ? 0.4 : 0.1}
                  />
                );
              })}

              {/* Input nodes xt */}
              {COL_X.map((cx, t) => (
                <g key={`x-${t}`} opacity={t > currentStep ? 0.2 : 1}>
                  <circle cx={cx} cy={Y_INPUT} r={R_INPUT} fill={C.bg4} stroke={C.borderLt} strokeWidth={1.5} />
                  <text x={cx} y={Y_INPUT + 3.5} textAnchor="middle" fill={C.textMute} fontSize={9} fontFamily="'JetBrains Mono', monospace">
                    {`x${t}`}
                  </text>
                </g>
              ))}

              {/* Hidden nodes ht */}
              {COL_X.map((cx, t) => {
                const isFuture  = t > currentStep;
                const isCurrent = t === currentStep;
                const isPulsing = t === pulseStep;
                const fill      = isFuture ? C.bg3 : hColor(hs[t]);
                const stroke    = isCurrent ? C.accent : C.borderLt;
                const sw        = isCurrent ? 2.5 : 1.5;
                const label     = showValues && !isFuture ? hs[t].toFixed(2) : `h${t}`;
                const labelFill = isFuture ? C.textMute : showValues ? 'white' : C.textMid;
                return (
                  <g key={`h-${t}`} className={isPulsing ? 'rnn-pulse' : undefined} opacity={isFuture ? 0.2 : 1}>
                    <circle cx={cx} cy={Y_HIDDEN} r={R_HIDDEN} fill={fill} stroke={stroke} strokeWidth={sw} />
                    <text x={cx} y={Y_HIDDEN + 3.5} textAnchor="middle" fill={labelFill} fontSize={9} fontFamily="'JetBrains Mono', monospace">
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Output nodes yt */}
              {showOutput && COL_X.map((cx, t) => (
                t <= currentStep && (
                  <g key={`y-${t}`}>
                    <circle cx={cx} cy={Y_OUTPUT} r={R_OUTPUT} fill={C.bg4} stroke={C.border} strokeWidth={1} />
                    <text x={cx} y={Y_OUTPUT + 3} textAnchor="middle" fill={C.textMute} fontSize={8} fontFamily="'JetBrains Mono', monospace">
                      {`y${t}`}
                    </text>
                  </g>
                )
              ))}
            </svg>
          </div>

          {/* Formula display */}
          <div style={{
            marginTop: '10px',
            background: C.codeBg,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            padding: '10px 14px',
          }}>
            {[
              <>
                <span style={{ color: C.textMute }}>ht = tanh( Wx · xt + Wh · ht-1 + b )</span>
              </>,
              <>
                <span style={{ color: C.textMute }}>h[{currentStep}] = tanh( </span>
                <span style={{ color: C.math }}>0.6</span>
                <span style={{ color: C.textMute }}> × </span>
                <span style={{ color: C.math }}>{xt.toFixed(3)}</span>
                <span style={{ color: C.textMute }}> + </span>
                <span style={{ color: C.math }}>0.8</span>
                <span style={{ color: C.textMute }}> × </span>
                <span style={{ color: C.math }}>{htPrev.toFixed(3)}</span>
                <span style={{ color: C.textMute }}> + </span>
                <span style={{ color: C.math }}>0.1</span>
                <span style={{ color: C.textMute }}> )</span>
              </>,
              <>
                <span style={{ color: C.textMute }}>{'     = tanh( '}</span>
                <span style={{ color: C.math }}>{tanhIn.toFixed(3)}</span>
                <span style={{ color: C.textMute }}>{' )'}</span>
              </>,
              <>
                <span style={{ color: C.textMute }}>{'     = '}</span>
                <span style={{ color: C.math }}>{ht.toFixed(3)}</span>
              </>,
            ].map((line, i) => (
              <div key={i} style={{ ...mono, fontSize: '12px', lineHeight: 1.85 }}>{line}</div>
            ))}
          </div>
        </div>

        {/* Stats panel */}
        <div style={{
          width: '158px',
          flexShrink: 0,
          background: 'var(--bg2)',
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {[
            { label: 'Current step', val: `t = ${currentStep}` },
            { label: 'xₜ',          val: xt.toFixed(3) },
            { label: 'hₜ₋₁',        val: htPrev.toFixed(3) },
            { label: 'hₜ',          val: ht.toFixed(3) },
            { label: 'tanh input',  val: tanhIn.toFixed(3) },
            { label: 'Sequence',    val: preset },
          ].map(({ label, val }) => (
            <div key={label}>
              <div style={{ ...mono, fontSize: '9px', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                {label}
              </div>
              <div style={{ ...mono, fontSize: '12px', color: C.accent }}>
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Step/play buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={retreat} disabled={currentStep <= 0} style={BtnStyle(currentStep <= 0)}>← Back</button>
          <button onClick={advance} disabled={currentStep >= 7} style={BtnStyle(currentStep >= 7)}>Step →</button>
          <button
            onClick={() => currentStep >= 7 ? (reset(), setPlaying(true)) : setPlaying(p => !p)}
            style={BtnStyle(false, playing)}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={reset} style={BtnStyle(false)}>↺ Reset</button>
        </div>

        {/* Sequence tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...mono, fontSize: '11px', color: C.textMute, minWidth: '68px' }}>Sequence</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['Sine', 'Random', 'Alternating'].map(name => (
              <button
                key={name}
                onClick={() => changePreset(name)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: `1px solid ${name === preset ? C.accent : C.border}`,
                  background: name === preset ? 'var(--accent-dim)' : C.bg4,
                  color: name === preset ? C.accent : C.textMid,
                  ...mono, fontSize: '11px', cursor: 'pointer',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { label: 'Show h values', val: showValues, set: setShowValues },
            { label: 'Show output',   val: showOutput, set: setShowOutput },
          ].map(({ label, val, set }) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor: C.accent }} />
              <span style={{ ...mono, fontSize: '11px', color: C.textMute }}>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
