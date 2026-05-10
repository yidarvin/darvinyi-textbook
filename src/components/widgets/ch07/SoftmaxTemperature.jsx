import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Data ──────────────────────────────────────────────────────────────────────
const CITIES = ['Paris', 'London', 'Berlin', 'Rome', 'Madrid', 'Oslo'];
const LOGITS  = [3.2, 1.5, 0.8, -0.3, -1.1, -2.4];
const N       = 6;
const MAX_H   = Math.log2(N); // 2.585

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT = '#2dd4bf';
const MUTED  = '#555555';
const MID    = '#888888';
const BDRLT  = '#2e2e2e';
const BDR    = '#242424';
const BG4    = '#1e1e1e';
const MATH   = '#fbbf24';
const ORANGE = '#fb923c';
const RED    = '#f87171';

// ── Math ──────────────────────────────────────────────────────────────────────
function sliderToT(s) {
  return s <= 50
    ? 0.1 + (s - 1) / 49 * 0.9
    : 1.0 + (s - 50) / 50 * 9.0;
}

function TtoSlider(T) {
  if (T <= 1.0) return Math.round(1 + (T - 0.1) / 0.9 * 49);
  return Math.round(50 + (T - 1.0) / 9.0 * 50);
}

function softmaxT(logits, T) {
  const scaled = logits.map(z => z / T);
  const mx     = Math.max(...scaled);
  const exps   = scaled.map(z => Math.exp(z - mx));
  const sum    = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function calcEntropy(probs) {
  return -probs.reduce((s, p) => s + (p > 1e-10 ? p * Math.log2(p) : 0), 0);
}

function lerp(a, b, t)     { return a + (b - a) * t; }
function lerpArr(a, b, t)  { return a.map((v, i) => lerp(v, b[i], t)); }

// ── Canvas layout constants (logical/CSS pixels) ──────────────────────────────
const LP  = 62;   // left pad  (y-axis labels)
const RP  = 14;   // right pad
// Top chart
const TC_TITLE_Y = 11;
const TC_TOP     = 22;
const TC_BOT     = 126;  // 104px bar area
// Middle zone
const CITY_Y     = 141;
const TLBL_Y     = 156;  // "T=0 (sharp)" / "T=∞ (uniform)"
const TBAR_Y     = 167;  // gradient bar top (8px tall)
const TMKR_Y     = 178;  // triangle marker top
// Bottom chart
const BC_TITLE_Y = 195;
const BC_TOP     = 206;
const BC_BOT     = 310;  // 104px bar area
const CANVAS_H   = 320;

const LOGIT_MIN = -3;
const LOGIT_MAX = 4;

function logitToY(v) {
  return TC_TOP + ((LOGIT_MAX - v) / (LOGIT_MAX - LOGIT_MIN)) * (TC_BOT - TC_TOP);
}
function probToY(p) {
  return BC_BOT - p * (BC_BOT - BC_TOP);
}

// ── Canvas draw ───────────────────────────────────────────────────────────────
function drawCanvas(ctx, W, displayProbs, T) {
  ctx.clearRect(0, 0, W, CANVAS_H);

  const cW    = W - LP - RP;
  const slotW = cW / N;
  const barW  = slotW - 4;

  const barX  = i => LP + i * slotW + 2;
  const barCX = i => LP + i * slotW + slotW / 2;

  // ── TOP CHART ─────────────────────────────────────────────────────────────
  ctx.font      = "10px 'Inter', sans-serif";
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'left';
  ctx.fillText('Raw logits z', LP, TC_TITLE_Y);

  // Y-axis ticks
  ctx.font = "9px 'JetBrains Mono', monospace";
  [-2, 0, 2, 4].forEach(v => {
    const y = logitToY(v);
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'right';
    ctx.fillText(v.toString(), LP - 6, y + 3.5);
    ctx.strokeStyle = '#191919';
    ctx.lineWidth   = 0.5;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(LP, y); ctx.lineTo(W - RP, y); ctx.stroke();
  });

  // Zero line (dashed)
  const zeroYT = logitToY(0);
  ctx.strokeStyle = BDR;
  ctx.lineWidth   = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(LP, zeroYT); ctx.lineTo(W - RP, zeroYT); ctx.stroke();
  ctx.setLineDash([]);

  // Bars
  LOGITS.forEach((logit, i) => {
    const bx = barX(i);
    const cx = barCX(i);
    const zY = logitToY(0);
    const lY = logitToY(logit);

    ctx.fillStyle = BDRLT;
    if (logit >= 0) {
      ctx.fillRect(bx, lY, barW, zY - lY);
    } else {
      ctx.fillRect(bx, zY, barW, lY - zY);
    }

    ctx.font      = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'center';
    if (logit >= 0) {
      ctx.fillText(logit.toFixed(1), cx, lY - 4);
    } else {
      ctx.fillText(logit.toFixed(1), cx, lY + 11);
    }
  });

  // ── SHARED CITY LABELS ────────────────────────────────────────────────────
  ctx.font      = "10px 'Inter', sans-serif";
  ctx.fillStyle = MID;
  ctx.textAlign = 'center';
  CITIES.forEach((city, i) => ctx.fillText(city, barCX(i), CITY_Y));

  // ── TEMPERATURE INDICATOR ─────────────────────────────────────────────────
  const tbLeft  = LP;
  const tbRight = W - RP;
  const tbWidth = tbRight - tbLeft;

  // "T=0 (sharp)" / "T=∞ (uniform)" labels
  ctx.font      = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'left';
  ctx.fillText('T=0 (sharp)', tbLeft, TLBL_Y);
  ctx.textAlign = 'right';
  ctx.fillText('T=∞ (uniform)', tbRight, TLBL_Y);

  // Gradient bar
  const grad = ctx.createLinearGradient(tbLeft, 0, tbRight, 0);
  grad.addColorStop(0, ACCENT);
  grad.addColorStop(1, BG4);
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(tbLeft, TBAR_Y, tbWidth, 8, 4);
  } else {
    ctx.rect(tbLeft, TBAR_Y, tbWidth, 8);
  }
  ctx.fill();

  // Triangle marker at log-scaled T position
  const tNorm = (Math.log10(T) - Math.log10(0.1)) / (Math.log10(10) - Math.log10(0.1));
  const mkX   = tbLeft + tNorm * tbWidth;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(mkX,     TMKR_Y);
  ctx.lineTo(mkX - 5, TMKR_Y + 9);
  ctx.lineTo(mkX + 5, TMKR_Y + 9);
  ctx.closePath();
  ctx.fill();

  // ── BOTTOM CHART ──────────────────────────────────────────────────────────
  ctx.font      = "10px 'Inter', sans-serif";
  ctx.fillStyle = MID;
  ctx.textAlign = 'left';
  ctx.fillText('softmax(z / T)', LP, BC_TITLE_Y);

  // Y-axis ticks
  ctx.font = "9px 'JetBrains Mono', monospace";
  [0, 0.5, 1.0].forEach(v => {
    const y = probToY(v);
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'right';
    ctx.fillText(v.toFixed(1), LP - 6, y + 3.5);
    ctx.strokeStyle = '#191919';
    ctx.lineWidth   = 0.5;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(LP, y); ctx.lineTo(W - RP, y); ctx.stroke();
  });

  // Zero line (dashed)
  ctx.strokeStyle = BDR;
  ctx.lineWidth   = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(LP, probToY(0)); ctx.lineTo(W - RP, probToY(0)); ctx.stroke();
  ctx.setLineDash([]);

  // Bars + labels + dots
  displayProbs.forEach((p, i) => {
    const bx     = barX(i);
    const cx     = barCX(i);
    const barTopY = probToY(p);
    const baseY   = probToY(0);

    ctx.fillStyle = i === 0 ? ACCENT : `rgba(45,212,191,${(p * 0.6 + 0.1).toFixed(3)})`;
    ctx.fillRect(bx, barTopY, barW, baseY - barTopY);

    // Probability label above bar
    ctx.font      = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = i === 0 ? ACCENT : MUTED;
    ctx.textAlign = 'center';
    const lblY    = Math.max(barTopY - 4, BC_TOP + 9);
    ctx.fillText(p.toFixed(3), cx, lblY);

    // White dot at bar top
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(cx, barTopY, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'T=0.1 (sharp)',    T: 0.1  },
  { label: 'T=1.0 (standard)', T: 1.0  },
  { label: 'T=3.0 (soft)',     T: 3.0  },
  { label: 'T=10 (uniform)',   T: 10.0 },
];

// ── Component ─────────────────────────────────────────────────────────────────
const INIT_PROBS = softmaxT(LOGITS, 1.0);

export default function SoftmaxTemperature() {
  const [sliderVal,    setSliderVal]    = useState(50); // maps to T=1.0
  const [showEntropy,  setShowEntropy]  = useState(true);
  const [displayProbs, setDisplayProbs] = useState(INIT_PROBS);

  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const prevRef    = useRef(INIT_PROBS);
  const targetRef  = useRef(INIT_PROBS);
  const animT0Ref  = useRef(null);
  const dispRef    = useRef(INIT_PROBS); // mirror of displayProbs for RAF closures

  const T = sliderToT(sliderVal);

  function startAnimation(newTarget) {
    prevRef.current   = [...dispRef.current];
    targetRef.current = newTarget;
    animT0Ref.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function frame(ts) {
      if (!animT0Ref.current) animT0Ref.current = ts;
      const progress = Math.min((ts - animT0Ref.current) / 200, 1);
      const next     = lerpArr(prevRef.current, targetRef.current, progress);
      dispRef.current = next;
      setDisplayProbs(next);
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  function handleSlider(val) {
    setSliderVal(val);
    startAnimation(softmaxT(LOGITS, sliderToT(val)));
  }

  function handlePreset(presetT) {
    setSliderVal(TtoSlider(presetT));
    startAnimation(softmaxT(LOGITS, presetT));
  }

  // Draw canvas on every displayProbs / T change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const cssW = canvas.getBoundingClientRect().width;
    if (!cssW) return;
    canvas.width  = cssW * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawCanvas(ctx, cssW, displayProbs, T);
  }, [displayProbs, T]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const H = calcEntropy(displayProbs);
  const hPct = (H / MAX_H * 100);

  let distType, distColor;
  if      (H < 0.5) { distType = 'very sharp';   distColor = ACCENT; }
  else if (H < 1.2) { distType = 'moderate';      distColor = MATH;   }
  else if (H < 2.0) { distType = 'diffuse';       distColor = ORANGE; }
  else              { distType = 'near-uniform';   distColor = RED;    }

  const activeIdx = PRESETS.findIndex(p => Math.abs(p.T - T) < 0.055);

  const mono = { fontFamily: "'JetBrains Mono', monospace" };

  return (
    <WidgetCard title="Softmax Temperature — sharpen or flatten attention" number="7.4">
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

        {/* ── Canvas + controls ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#0a0a0a', borderRadius: '6px', overflow: 'hidden' }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: '100%', height: `${CANVAS_H}px` }}
            />
          </div>

          {/* Entropy meter */}
          {showEntropy && (
            <div style={{ marginTop: '10px' }}>
              <div style={{
                ...mono, fontSize: '9px', color: MUTED,
                marginBottom: '5px', display: 'flex', justifyContent: 'space-between',
              }}>
                <span>H = {H.toFixed(2)} bits  /  max 2.59 bits</span>
                <span>{hPct.toFixed(0)}% of max</span>
              </div>
              <div style={{ background: BG4, borderRadius: '3px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: ACCENT, borderRadius: '3px',
                  width: `${hPct.toFixed(2)}%`,
                  transition: 'width 40ms linear',
                }} />
              </div>
            </div>
          )}

          {/* Temperature slider */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ ...mono, fontSize: '11px', color: MID, whiteSpace: 'nowrap', minWidth: '160px' }}>
              Temperature  T = {T.toFixed(1)}
            </span>
            <input
              type="range" min={1} max={100} step={1}
              value={sliderVal}
              onChange={e => handleSlider(Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>

          {/* Preset buttons + entropy toggle */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {PRESETS.map((p, idx) => (
              <button key={p.T} onClick={() => handlePreset(p.T)} style={{
                ...mono, fontSize: '10px', padding: '4px 9px', borderRadius: '4px', cursor: 'pointer',
                border:      `1px solid ${activeIdx === idx ? ACCENT : BDR}`,
                background:  activeIdx === idx ? '#0b2422' : BG4,
                color:       activeIdx === idx ? ACCENT    : MID,
                transition:  'border-color 150ms, background 150ms, color 150ms',
              }}>{p.label}</button>
            ))}
            <button
              onClick={() => setShowEntropy(v => !v)}
              style={{
                ...mono, fontSize: '10px', padding: '4px 9px', borderRadius: '4px', cursor: 'pointer',
                border:     `1px solid ${showEntropy ? ACCENT : BDR}`,
                background: showEntropy ? '#0b2422' : BG4,
                color:      showEntropy ? ACCENT    : MID,
                marginLeft: 'auto',
                transition: 'border-color 150ms, background 150ms, color 150ms',
              }}
            >Show entropy</button>
          </div>
        </div>

        {/* ── Stats panel ── */}
        <div style={{
          width: '176px', flexShrink: 0,
          background: '#111111', border: `1px solid ${BDR}`,
          borderRadius: '8px', padding: '14px',
        }}>
          {/* Per-city probabilities */}
          {CITIES.map((city, i) => (
            <div key={city} style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: '5px',
            }}>
              <span style={{ ...mono, fontSize: '10px', color: i === 0 ? ACCENT : MID }}>
                {`P("${city}")`}
              </span>
              <span style={{ ...mono, fontSize: '10px', color: i === 0 ? ACCENT : MID }}>
                {(displayProbs[i] * 100).toFixed(1)}%
              </span>
            </div>
          ))}

          <div style={{ height: '1px', background: BDR, margin: '9px 0' }} />

          {/* Entropy stats */}
          {[
            { lbl: 'Entropy H',    val: `${H.toFixed(3)} bits`,           color: ACCENT },
            { lbl: 'Max entropy',  val: '2.585 bits',                      color: MID    },
            { lbl: 'H / max',      val: `${hPct.toFixed(1)}%`,            color: MID    },
            { lbl: 'Temperature',  val: T.toFixed(1),                      color: MID    },
          ].map(({ lbl, val, color }) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ ...mono, fontSize: '10px', color: MUTED }}>{lbl}</span>
              <span style={{ ...mono, fontSize: '10px', color }}>{val}</span>
            </div>
          ))}

          <div style={{ height: '1px', background: BDR, margin: '9px 0' }} />

          {/* Distribution type */}
          <div style={{
            ...mono, fontSize: '9px', color: MUTED,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px',
          }}>Distribution type</div>
          <div style={{ ...mono, fontSize: '12px', fontWeight: 600, color: distColor }}>
            {distType}
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
