import { useState, useEffect, useMemo, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  red:       '#f87171',
  orange:    '#fb923c',
  green:     '#34d399',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  codeBg:    '#0a0a0a',
  textMid:   '#888888',
  textMuted: '#555555',
};

const mono = { fontFamily: "'JetBrains Mono', monospace" };

const LEFT_PAD = 50, RIGHT_PAD = 20, TOP_PAD = 20, BOTTOM_PAD = 36;
const LOG_MIN = -10, LOG_MAX = 1;

function logY(val, topPad, chartH) {
  const lv = Math.log10(Math.max(val, 1e-12));
  const c = Math.max(LOG_MIN, Math.min(LOG_MAX, lv));
  return topPad + (1 - (c - LOG_MIN) / (LOG_MAX - LOG_MIN)) * chartH;
}

function fmtSci(val) {
  if (!isFinite(val) || val > 1e15) return '∞';
  if (val < 1e-12) return '< 1e-12';
  const exp = Math.floor(Math.log10(val));
  const mant = val / Math.pow(10, exp);
  return `${mant.toFixed(2)}e${exp}`;
}

export default function VanishingGradient({ tryThis = {
  do: "Set spectral radius ρ above 1.0 (e.g. ρ = 1.2), then drag the new avg tanh' saturation slider down from 1.0 toward 0.5.",
  notice: "the RNN curve still vanishes even though ρ(Wh) > 1 — tanh saturation shrinks the effective per-step growth factor (ρ·s) below 1, so ρ(Wh) > 1 is necessary but not sufficient for exploding gradients.",
} } = {}) {
  const canvasRef = useRef(null);
  const [T, setT] = useState(20);
  const [spectralRadius, setSpectralRadius] = useState(0.90);
  const [forgetGate, setForgetGate] = useState(0.95);
  const [tanhDeriv, setTanhDeriv] = useState(1.0);
  const [showRNN, setShowRNN] = useState(true);
  const [showLSTM, setShowLSTM] = useState(true);

  // Effective per-step growth factor for the RNN gradient product. The true
  // BPTT gradient is a product of W_h^T · diag(tanh'(z_k)) terms (see the
  // MathBlock above in RNNs.jsx), so even when rho(W_h) = spectralRadius > 1,
  // the tanh' factor -- always <= 1, and often << 1 near saturation -- can
  // still pull the effective factor below 1. spectral radius > 1 is
  // necessary but NOT sufficient for exploding gradients; tanhDeriv (an
  // illustrative average of |tanh'(z_k)| across the sequence) lets the
  // reader see that more subtle relationship instead of an unconditional
  // exponential blow-up whenever rho > 1.
  const effRho = spectralRadius * tanhDeriv;

  const { rnnGrads, lstmGrads } = useMemo(() => {
    const rnn = [], lstm = [];
    const eff = spectralRadius * tanhDeriv;
    for (let t = 0; t <= T; t++) {
      rnn.push(Math.pow(eff, T - t));
      lstm.push(Math.pow(forgetGate, T - t));
    }
    return { rnnGrads: rnn, lstmGrads: lstm };
  }, [T, spectralRadius, tanhDeriv, forgetGate]);

  const { tVanishRNN, tVanishLSTM } = useMemo(() => {
    let rnnV = null, lstmV = null;
    const eff = spectralRadius * tanhDeriv;
    if (eff < 1.0) {
      const v = T - Math.floor(Math.log(1e-4) / Math.log(eff));
      if (v >= 0 && v <= T) rnnV = v;
    }
    if (forgetGate < 0.99) {
      const v = T - Math.floor(Math.log(1e-4) / Math.log(forgetGate));
      if (v >= 0 && v <= T) lstmV = v;
    }
    return { tVanishRNN: rnnV, tVanishLSTM: lstmV };
  }, [T, spectralRadius, tanhDeriv, forgetGate]);

  const rnnAt0  = rnnGrads[0];
  const lstmAt0 = lstmGrads[0];
  const ratio   = rnnAt0 < 1e-15 ? Infinity : lstmAt0 / rnnAt0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function draw() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      const W      = rect.width;
      const H      = rect.height;
      const chartW = W - LEFT_PAD - RIGHT_PAD;
      const chartH = H - TOP_PAD - BOTTOM_PAD;
      const axisY  = TOP_PAD + chartH;

      const toX = (t) => LEFT_PAD + (t / T) * chartW;
      const toY = (val) => logY(val, TOP_PAD, chartH);

      // Background
      ctx.fillStyle = C.codeBg;
      ctx.fillRect(0, 0, W, H);

      // Shaded region below 1e-4
      const threshY = toY(1e-4);
      ctx.fillStyle = 'rgba(248,113,113,0.06)';
      ctx.fillRect(LEFT_PAD, threshY, chartW, axisY - threshY);

      // Horizontal grid lines + Y labels
      const GRID = [
        [10,   '10'],
        [1,    '1'],
        [1e-2, '0.01'],
        [1e-4, '1e-4'],
        [1e-6, '1e-6'],
        [1e-8, '1e-8'],
        [1e-10,'1e-10'],
      ];
      ctx.setLineDash([]);
      ctx.font = "9px 'JetBrains Mono', monospace";
      GRID.forEach(([val, label]) => {
        const y = toY(val);
        ctx.strokeStyle = '#1e1e1e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(LEFT_PAD, y);
        ctx.lineTo(LEFT_PAD + chartW, y);
        ctx.stroke();
        ctx.fillStyle = C.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, LEFT_PAD - 4, y);
      });

      // Threshold dashed line
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LEFT_PAD, threshY);
      ctx.lineTo(LEFT_PAD + chartW, threshY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Threshold annotation (inside chart, right side)
      ctx.fillStyle = C.textMuted;
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('1e-4 (effective zero)', LEFT_PAD + chartW - 4, threshY - 2);

      // X-axis ticks
      ctx.font = "9px 'JetBrains Mono', monospace";
      const xTicks = [0, Math.round(T / 4), Math.round(T / 2), Math.round(3 * T / 4), T];
      xTicks.forEach(tick => {
        const x = toX(tick);
        ctx.strokeStyle = C.textMuted;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, axisY);
        ctx.lineTo(x, axisY + 4);
        ctx.stroke();
        ctx.fillStyle = C.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(tick), x, axisY + 6);
      });

      // X-axis end labels (second row)
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textBaseline = 'top';
      ctx.fillStyle = C.textMuted;
      ctx.textAlign = 'right';
      ctx.fillText('T (output step)', LEFT_PAD + chartW, axisY + 20);
      ctx.textAlign = 'left';
      ctx.fillText('0 (input step)', LEFT_PAD, axisY + 20);

      // Draw LSTM line
      if (showLSTM) {
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        lstmGrads.forEach((g, t) => {
          const x = toX(t), y = toY(g);
          t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        // Label at left end (t=0)
        ctx.fillStyle = C.accent;
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('LSTM', LEFT_PAD - 3, toY(lstmGrads[0]));
      }

      // Draw RNN line
      if (showRNN) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        rnnGrads.forEach((g, t) => {
          const x = toX(t), y = toY(g);
          t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        // Label at left end (t=0)
        ctx.fillStyle = C.red;
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const rnnLabelY = toY(Math.max(rnnGrads[0], 1e-11));
        ctx.fillText('RNN', LEFT_PAD - 3, rnnLabelY);
      }

      // RNN vanishing annotation
      if (showRNN && effRho < 1.0 && tVanishRNN !== null) {
        const x = toX(tVanishRNN);
        ctx.strokeStyle = 'rgba(248,113,113,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x, TOP_PAD + 2);
        ctx.lineTo(x, axisY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.red;
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`RNN vanishes at t=${tVanishRNN}`, x, TOP_PAD - 1);
      }

      // Exploding triangle -- keyed on the *effective* growth factor
      // (spectral radius times the average tanh' saturation term), not on
      // spectral radius alone, and only drawn when that factor is strictly
      // greater than 1 so it can never contradict the "stable" classification
      // in the stats panel at the boundary (effRho === 1).
      if (showRNN && effRho > 1.0) {
        const tExit = T - Math.log(10) / Math.log(effRho);
        const triX = tExit >= 0 && tExit <= T ? toX(tExit) : LEFT_PAD + 10;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.moveTo(triX, TOP_PAD + 3);
        ctx.lineTo(triX - 5, TOP_PAD + 13);
        ctx.lineTo(triX + 5, TOP_PAD + 13);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = C.orange;
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = triX < W / 2 ? 'left' : 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('exploding', triX + (triX < W / 2 ? 8 : -8), TOP_PAD + 3);
      }

      // LSTM vanishing annotation
      if (showLSTM && forgetGate < 0.99 && tVanishLSTM !== null) {
        const x = toX(tVanishLSTM);
        ctx.strokeStyle = 'rgba(45,212,191,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x, TOP_PAD + 2);
        ctx.lineTo(x, axisY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.accent;
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`LSTM vanishes at t=${tVanishLSTM}`, x, TOP_PAD - 1);
      }
    }

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [T, spectralRadius, tanhDeriv, effRho, forgetGate, showRNN, showLSTM, rnnGrads, lstmGrads, tVanishRNN, tVanishLSTM]);

  // Raw spectral radius alone is a necessary-but-not-sufficient condition:
  // rho(Wh) > 1 does NOT guarantee exploding gradients once the tanh'
  // saturation term is folded in. effRhoHint / rnnVanishStat below classify
  // the quantity that actually drives the plotted curve (effRho) instead.
  const rhoHint =
    spectralRadius < 1  ? { text: 'ρ(Wh) < 1 alone', color: C.red }
  : spectralRadius > 1  ? { text: 'ρ(Wh) > 1 alone — necessary, not sufficient, for exploding', color: C.orange }
  :                       { text: 'ρ(Wh) = 1 alone', color: C.green };

  const effRhoHint =
    effRho < 1  ? { text: `effective growth ρ·s = ${effRho.toFixed(2)} — actually vanishing`, color: C.red }
  : effRho > 1  ? { text: `effective growth ρ·s = ${effRho.toFixed(2)} — actually exploding`, color: C.orange }
  :               { text: `effective growth ρ·s = ${effRho.toFixed(2)} — stable`, color: C.green };

  const rnnVanishStat =
    effRho > 1              ? { val: 'exploding', color: C.orange }
  : effRho === 1             ? { val: 'stable',    color: C.green }
  : tVanishRNN !== null      ? { val: `t = ${tVanishRNN}`, color: C.red }
  :                            { val: 'beyond T',  color: C.textMid };

  const lstmVanishStat =
    forgetGate >= 0.99  ? { val: 'stable',    color: C.green }
  : tVanishLSTM !== null ? { val: `t = ${tVanishLSTM}`, color: C.accent }
  :                        { val: 'beyond T',  color: C.textMid };

  const stats = [
    { label: 'Effective growth ρ·s',   val: effRho.toFixed(2), color: effRhoHint.color },
    { label: 'RNN gradient at t=0',    val: fmtSci(rnnAt0),  color: C.red },
    { label: 'LSTM gradient at t=0',   val: fmtSci(lstmAt0), color: C.accent },
    { label: 'RNN vanishes at',        val: rnnVanishStat.val,  color: rnnVanishStat.color },
    { label: 'LSTM vanishes at',       val: lstmVanishStat.val, color: lstmVanishStat.color },
    { label: 'Ratio LSTM/RNN at t=0',  val: isFinite(ratio) ? `${ratio.toFixed(1)}x` : '∞', color: C.green },
    { label: 'Sequence length',        val: `T = ${T}`,      color: C.textMid },
  ];

  return (
    <WidgetCard title="Vanishing Gradient — RNN vs LSTM across timesteps" number="8.2" tryThis={tryThis}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

        {/* Canvas + controls */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '280px', display: 'block' }}
            />
          </div>

          {/* Controls */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Sequence length */}
            <SliderRow
              label={`Sequence length  T = ${T}`}
              value={T} min={5} max={50} step={1}
              onChange={v => setT(+v)}
            />

            {/* Spectral radius */}
            <div>
              <SliderRow
                label={`spectral radius  ρ = ${spectralRadius.toFixed(2)}`}
                value={spectralRadius} min={0.50} max={1.50} step={0.01}
                onChange={v => setSpectralRadius(parseFloat(v))}
              />
              <div style={{ ...mono, fontSize: '10px', marginTop: '4px', color: rhoHint.color }}>
                {rhoHint.text}
              </div>
            </div>

            {/* Average tanh' saturation -- the term a raw-spectral-radius
                story drops. Even rho(Wh) > 1 can still yield an effective
                growth factor <= 1 once this is folded in, which is why the
                chart's "exploding"/"vanishing" annotations are keyed on
                effRho = spectralRadius * tanhDeriv, not spectralRadius alone. */}
            <div>
              <SliderRow
                label={`avg |tanh'(z)| saturation  s = ${tanhDeriv.toFixed(2)}`}
                value={tanhDeriv} min={0.20} max={1.00} step={0.05}
                onChange={v => setTanhDeriv(parseFloat(v))}
              />
              <div style={{ ...mono, fontSize: '10px', marginTop: '4px', color: effRhoHint.color }}>
                {effRhoHint.text}
              </div>
              <div style={{ ...mono, fontSize: '9px', marginTop: '3px', color: C.textMuted }}>
                s = 1.0 is the idealized unsaturated (linear) regime; real tanh units saturate toward s → 0, so the true BPTT gradient product is ρ(Wh)·tanh′(z) per step, not ρ(Wh) alone.
              </div>
            </div>

            {/* Forget gate */}
            <div>
              <SliderRow
                label={`LSTM forget gate  f = ${forgetGate.toFixed(2)}`}
                value={forgetGate} min={0.70} max={1.00} step={0.01}
                onChange={v => setForgetGate(parseFloat(v))}
              />
              <div style={{ ...mono, fontSize: '10px', marginTop: '4px', color: C.textMuted }}>
                f near 1.0 = cell retains almost all memory each step
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: '20px' }}>
              {[
                { label: 'Show RNN',  val: showRNN,  set: setShowRNN },
                { label: 'Show LSTM', val: showLSTM, set: setShowLSTM },
              ].map(({ label, val, set }) => (
                <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox" checked={val}
                    onChange={e => set(e.target.checked)}
                    style={{ accentColor: C.accent }}
                  />
                  <span style={{ ...mono, fontSize: '11px', color: C.textMuted }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Stats panel */}
        <div style={{
          width: '180px', flexShrink: 0,
          background: 'var(--bg2)',
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {stats.map(({ label, val, color }) => (
            <div key={label}>
              <div style={{
                ...mono, fontSize: '9px', color: C.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px',
              }}>
                {label}
              </div>
              <div style={{ ...mono, fontSize: '12px', color }}>
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}

function SliderRow({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: '11px', color: C.textMuted, marginBottom: '5px' }}>
        {label}
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', accentColor: C.accent, cursor: 'pointer' }}
      />
    </div>
  );
}
