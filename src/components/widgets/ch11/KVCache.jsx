import { useState, useEffect, useRef, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  red:       '#f87171',
  math:      '#fbbf24',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  textMid:   '#888888',
  text:      '#e8eaed',
  codeBg:    '#0a0a0a',
};
const mono  = "'JetBrains Mono', monospace";
const inter = "'Inter', sans-serif";

const TOKENS = [
  'The', 'sky', 'is', 'blue', 'because', 'of',
  'Rayleigh', 'scattering', 'which', 'affects', 'short', 'wavelengths',
];
const LAYERS    = 4;
const MAX_STEPS = 12;

const cacheFlops   = t => t;
const noCacheFlops = t => t * t;
const totalCache   = s => s * (s + 1) / 2;
const totalNoCache = s => s * (s + 1) * (2 * s + 1) / 6;

// ── Canvas: KV cache heatmap ───────────────────────────────────────────────────
function drawHeatmap(canvas, step) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const { width: W, height: H } = canvas.getBoundingClientRect();
  if (W === 0 || H === 0) return;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.scale(dpr, dpr);

  const lp = 26, rp = 4, tp = 6, bp = 18;
  const cW   = W - lp - rp;
  const cH   = H - tp - bp;
  const colW = cW / MAX_STEPS;
  const rowH = cH / LAYERS;

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  for (let layer = 0; layer < LAYERS; layer++) {
    for (let pos = 0; pos < MAX_STEPS; pos++) {
      const x     = lp + pos * colW;
      const y     = tp + layer * rowH;
      const isNew = pos === step - 1;
      if (pos < step) {
        ctx.fillStyle = isNew ? '#2dd4bf' : 'rgba(45,212,191,0.6)';
        ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
        if (isNew) {
          ctx.strokeStyle = '#2dd4bf';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, colW - 2, rowH - 2);
        }
      } else {
        ctx.fillStyle = C.bg4;
        ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
      }
    }
  }

  ctx.font = `9px ${mono}`;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let l = 0; l < LAYERS; l++) {
    ctx.fillText(`L${l + 1}`, lp - 4, tp + l * rowH + rowH / 2);
  }

  if (step > 0) {
    ctx.font = `7px ${mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (let p = 0; p < step; p++) {
      ctx.fillStyle = p === step - 1 ? C.accent : C.muted;
      ctx.fillText(`t${p + 1}`, lp + p * colW + colW / 2, tp + cH + 13);
    }
  }
}

// ── Canvas: cumulative FLOPs comparison chart ──────────────────────────────────
function drawChart(canvas, step) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const { width: W, height: H } = canvas.getBoundingClientRect();
  if (W === 0 || H === 0) return;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.scale(dpr, dpr);

  const lp = 34, rp = 8, tp = 8, bp = 20;
  const cW   = W - lp - rp;
  const cH   = H - tp - bp;
  const maxY = totalNoCache(MAX_STEPS);

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const y = tp + (1 - f) * cH;
    ctx.beginPath(); ctx.moveTo(lp, y); ctx.lineTo(lp + cW, y); ctx.stroke();
  });

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lp, tp); ctx.lineTo(lp, tp + cH); ctx.lineTo(lp + cW, tp + cH);
  ctx.stroke();

  // No-cache curve (quadratic)
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let t = 1; t <= MAX_STEPS; t++) {
    const x = lp + ((t - 1) / (MAX_STEPS - 1)) * cW;
    const y = tp + cH - (totalNoCache(t) / maxY) * cH;
    t === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Cached curve (linear)
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let t = 1; t <= MAX_STEPS; t++) {
    const x = lp + ((t - 1) / (MAX_STEPS - 1)) * cW;
    const y = tp + cH - (totalCache(t) / maxY) * cH;
    t === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Current step marker
  if (step > 0) {
    const x = lp + ((step - 1) / (MAX_STEPS - 1)) * cW;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x, tp); ctx.lineTo(x, tp + cH); ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.font = `7px ${mono}`;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [0, 0.5, 1].forEach(f => {
    ctx.fillText(Math.round(f * maxY), lp - 3, tp + (1 - f) * cH);
  });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  [1, 4, 8, 12].forEach(t => {
    const x = lp + ((t - 1) / (MAX_STEPS - 1)) * cW;
    ctx.fillText(`t${t}`, x, tp + cH + 14);
  });

  // Legend inside chart area (top-right)
  ctx.font = `7px ${mono}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.red;
  ctx.fillText('No cache', lp + cW, tp + 9);
  ctx.fillStyle = C.accent;
  ctx.fillText('With cache', lp + cW, tp + 18);
}

// ── SVG: generated token sequence ─────────────────────────────────────────────
const CHIP_W = 68, CHIP_H = 30, CHIP_GAP = 6, COLS = 4;
const GL = 15, GT = 28, ROW_H = CHIP_H + CHIP_GAP;
const SVG_W = 320, SVG_H = 200;

function TokenSequence({ step, animToken }) {
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
      <text x={SVG_W / 2} y={15} textAnchor="middle"
        fontFamily={inter} fontSize="11" fill={C.textMid}>
        Generated Sequence
      </text>

      {TOKENS.map((tok, i) => {
        const col  = i % COLS;
        const row  = Math.floor(i / COLS);
        const x    = GL + col * (CHIP_W + CHIP_GAP);
        const y    = GT + row * ROW_H;
        const cx   = x + CHIP_W / 2;
        const cy   = y + CHIP_H / 2;
        const done = i < step;
        const cur  = i === step - 1;
        const anim = animToken === i;

        return (
          <g key={i} className={anim ? 'kvc-appear' : undefined}>
            <rect
              x={x} y={y} width={CHIP_W} height={CHIP_H} rx={6}
              fill={done ? (cur ? C.accentDim : C.bg3) : 'none'}
              stroke={done ? (cur ? C.accent : C.borderLt) : C.border}
              strokeWidth={cur ? 2 : 1}
              strokeDasharray={done ? undefined : '3 3'}
              opacity={done ? 1 : 0.35}
            />
            {done && (
              <>
                <text x={cx} y={cy - 3}
                  textAnchor="middle" dominantBaseline="middle"
                  fontFamily={mono} fontSize="9"
                  fill={cur ? C.accent : C.textMid}>
                  {tok}
                </text>
                <text x={cx} y={y + CHIP_H - 4}
                  textAnchor="middle"
                  fontFamily={mono} fontSize="7" fill={C.muted}>
                  t{i + 1}
                </text>
              </>
            )}
          </g>
        );
      })}

      {step > 0 && (
        <text x={SVG_W / 2} y={GT + 3 * ROW_H + 18}
          textAnchor="middle" fontFamily={mono} fontSize="9" fill={C.accent}>
          {`Step ${step}: computing K,V for token ${step} only`}
        </text>
      )}
    </svg>
  );
}

// ── Stat strip cell ────────────────────────────────────────────────────────────
function StatCell({ label, val, vc, note }) {
  return (
    <div style={{ flex: 1, padding: '10px 14px', textAlign: 'center' }}>
      <div style={{ fontFamily: inter, fontSize: '8px', color: C.muted, textTransform: 'uppercase',
                    letterSpacing: '0.07em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: '17px', color: vc || C.textMid,
                    fontWeight: 600, lineHeight: 1 }}>
        {val}
      </div>
      {note && (
        <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted, marginTop: '3px' }}>
          {note}
        </div>
      )}
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: mono, fontSize: '10px', padding: '5px 12px',
      background: active ? C.accentDim : C.bg4,
      border: `1px solid ${active ? C.accent : (disabled ? C.border : C.borderLt)}`,
      borderRadius: '4px',
      color: disabled ? C.muted : (active ? C.accent : C.textMid),
      cursor: disabled ? 'not-allowed' : 'pointer',
      flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────────
export default function KVCache({ tryThis }) {
  const [step,      setStep]      = useState(0);
  const [playing,   setPlaying]   = useState(false);
  const [fastMode,  setFastMode]  = useState(false);
  const [animToken, setAnimToken] = useState(null);

  const heatmapRef = useRef(null);
  const chartRef   = useRef(null);
  const playTimer  = useRef(null);
  const animTimer  = useRef(null);

  useEffect(() => { drawHeatmap(heatmapRef.current, step); }, [step]);
  useEffect(() => { drawChart(chartRef.current, step); },   [step]);

  const doNext = useCallback(() => {
    if (step >= MAX_STEPS) return;
    setStep(step + 1);
    setAnimToken(step);
    clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => setAnimToken(null), 400);
  }, [step]);

  useEffect(() => {
    if (!playing) return;
    if (step >= MAX_STEPS) { setPlaying(false); return; }
    playTimer.current = setTimeout(doNext, fastMode ? 250 : 700);
    return () => clearTimeout(playTimer.current);
  }, [playing, step, fastMode, doNext]);

  useEffect(() => () => {
    clearTimeout(playTimer.current);
    clearTimeout(animTimer.current);
  }, []);

  function reset() {
    setPlaying(false);
    setStep(0);
    setAnimToken(null);
    clearTimeout(playTimer.current);
    clearTimeout(animTimer.current);
  }

  const t      = step;
  const ncStep = noCacheFlops(t);
  const cStep  = cacheFlops(t);
  const ncTot  = totalNoCache(t);
  const cTot   = totalCache(t);
  const totSpd = cTot > 0 ? (ncTot / cTot).toFixed(1) : '—';
  const kvKB   = ((t * LAYERS * 4 * 8 * 2 * 2) / 1024).toFixed(2);
  const pairs  = t * LAYERS * 4 * 2;

  return (
    <WidgetCard title="KV Cache — linear vs quadratic inference cost" number="11.2" tryThis={tryThis}>
      <style>{`
        @keyframes kvcAppear {
          0%   { transform: scale(1);    }
          40%  { transform: scale(1.12); }
          100% { transform: scale(1);    }
        }
        .kvc-appear {
          transform-box: fill-box;
          transform-origin: center;
          animation: kvcAppear 300ms ease-out;
        }
      `}</style>

      {/* ── Row 1: token sequence + heatmap, equal split ─────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        <div style={{ flex: 1, minWidth: 0 }}>
          <TokenSequence step={step} animToken={animToken} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: inter, fontSize: '11px', color: C.textMid, marginBottom: '4px' }}>
            KV Cache (4 layers × {t} positions)
          </div>
          <canvas ref={heatmapRef}
            style={{ display: 'block', width: '100%', height: '160px', borderRadius: '4px' }} />
          <div style={{ marginTop: '6px', fontFamily: mono, fontSize: '10px', color: C.textMid }}>
            Demo: <span style={{ color: C.math }}>{kvKB} KB</span>
            <span style={{ color: C.muted, fontSize: '8px', marginLeft: '10px' }}>
              Real 70B · 128K ctx ≈ 40 GB
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 2: comparison chart, always visible, full width ──────── */}
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontFamily: inter, fontSize: '10px', color: C.muted, marginBottom: '4px' }}>
          Cumulative FLOPs vs step —{' '}
          <span style={{ color: C.accent }}>with cache (linear)</span>
          {' vs '}
          <span style={{ color: C.red }}>without cache (quadratic)</span>
        </div>
        <canvas ref={chartRef}
          style={{ display: 'block', width: '100%', height: '88px', borderRadius: '4px' }} />
      </div>

      {/* ── Row 3: compute counter, two columns + speedup callout ─────── */}
      <div style={{
        marginTop: '12px', display: 'flex',
        background: C.bg3, border: `1px solid ${C.border}`,
        borderRadius: '6px', overflow: 'hidden',
      }}>
        {/* No-cache */}
        <div style={{ flex: 1, padding: '11px 16px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.red, marginBottom: '5px' }}>
            ⚠ Without KV Cache
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid }}>
            Step {t}:{' '}
            <span style={{ color: C.red, fontWeight: 700 }}>{ncStep}</span> units
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid, marginTop: '2px' }}>
            Total:{' '}
            <span style={{ color: C.red, fontWeight: 700 }}>{ncTot}</span> units
          </div>
        </div>

        {/* Cached */}
        <div style={{ flex: 1, padding: '11px 16px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.accent, marginBottom: '5px' }}>
            ✓ With KV Cache
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid }}>
            Step {t}:{' '}
            <span style={{ color: C.accent, fontWeight: 700 }}>{cStep}</span> units
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid, marginTop: '2px' }}>
            Total:{' '}
            <span style={{ color: C.accent, fontWeight: 700 }}>{cTot}</span> units
          </div>
        </div>

        {/* Speedup callout */}
        <div style={{
          flexShrink: 0, width: '128px', padding: '11px 12px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase',
                        letterSpacing: '0.08em', marginBottom: '3px' }}>
            Speedup
          </div>
          <div style={{ fontFamily: mono, fontSize: '24px', color: C.math, fontWeight: 700, lineHeight: 1 }}>
            {t > 0 ? `${t}×` : '—'}
          </div>
          <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted, marginTop: '2px' }}>
            this step
          </div>
          {t > 0 && (
            <div style={{ fontFamily: mono, fontSize: '10px', color: C.math, marginTop: '5px' }}>
              {totSpd}× cumulative
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: stats strip ───────────────────────────────────────── */}
      <div style={{
        marginTop: '10px', display: 'flex',
        background: C.bg3, border: `1px solid ${C.border}`,
        borderRadius: '6px', overflow: 'hidden',
      }}>
        <StatCell label="Tokens"   val={t} />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StatCell label="K+V pairs" val={pairs} note={`${LAYERS}L × 4H × 2`} />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StatCell label="Cache size" val={`${kvKB} KB`} vc={C.math} />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StatCell label="This step ×" val={t > 0 ? `${t}×` : '—'} vc={t > 1 ? C.math : C.textMid} />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StatCell label="Total ×" val={`${totSpd}×`} vc={t > 0 ? C.math : C.textMid} />
      </div>

      {/* ── Row 5: controls ──────────────────────────────────────────── */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Btn onClick={doNext} disabled={step >= MAX_STEPS}>Next Token</Btn>
        <Btn onClick={() => setPlaying(p => !p)} disabled={step >= MAX_STEPS} active={playing}>
          {playing ? 'Pause' : 'Auto-play'}
        </Btn>
        <Btn onClick={reset}>Reset</Btn>
        <div style={{ width: '1px', height: '20px', background: C.border, flexShrink: 0 }} />
        <Btn onClick={() => setFastMode(false)} active={!fastMode}>Normal</Btn>
        <Btn onClick={() => setFastMode(true)}  active={fastMode}>Fast</Btn>
      </div>
    </WidgetCard>
  );
}
