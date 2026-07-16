import { useState, useMemo, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  textMid:   '#888888',
  text:      '#e8eaed',
  codeBg:    '#0a0a0a',
  mid:       '#888888',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ── Scaling law ───────────────────────────────────────────────────────────────
const lossNd = (N, D) =>
  1.69 + 406.4 / Math.pow(N, 0.34) + 410.7 / Math.pow(D, 0.28);

const optimalN = (C_val) => {
  const ratio = (406.4 * 0.34) / (410.7 * 0.28);
  const exp   = 1 / (0.34 + 0.28);
  return Math.pow(ratio, exp) * Math.pow(C_val / 6, 0.28 / (0.34 + 0.28));
};
const optimalD = (C_val, N) => C_val / (6 * N);

// ── Real models ───────────────────────────────────────────────────────────────
// C (training compute) is derived as 6*N*D rather than hardcoded, so it can
// never drift out of sync with the N/D values used everywhere else below.
const MODELS = [
  { name: 'GPT-3',      N: 175e9,  D: 300e9,  C: 6 * 175e9 * 300e9,  color: '#fb923c' },
  { name: 'Chinchilla', N: 70e9,   D: 1.4e12, C: 6 * 70e9  * 1.4e12, color: '#2dd4bf' },
  { name: 'LLaMA-7B',   N: 7e9,    D: 1e12,   C: 6 * 7e9   * 1e12,   color: '#a78bfa' },
  { name: 'LLaMA-65B',  N: 65e9,   D: 1.4e12, C: 6 * 65e9  * 1.4e12, color: '#a78bfa' },
  { name: 'PaLM-540B',  N: 540e9,  D: 780e9,  C: 6 * 540e9 * 780e9,  color: '#f472b6' },
];

// ── Fixed reference curves ────────────────────────────────────────────────────
const FIXED_CURVES = [
  { C: 1e20, color: '#2e2e2e', width: 1, dash: [4, 3], label: '1e20' },
  { C: 1e22, color: '#555555', width: 1, dash: [],      label: '1e22' },
  { C: 1e24, color: '#888888', width: 1.5, dash: [],    label: '1e24' },
];

// ── Number formatters ─────────────────────────────────────────────────────────
function fmtN(v) {
  if (v < 1e9)  return `${(v / 1e6).toFixed(1)}M`;
  if (v < 1e12) return `${(v / 1e9).toFixed(1)}B`;
  return `${(v / 1e12).toFixed(2)}T`;
}

function fmtSci(v) {
  const exp = Math.floor(Math.log10(v));
  const man = v / Math.pow(10, exp);
  return `${man.toFixed(2)}e${exp}`;
}

function cLabel(C_val) {
  if (C_val < 1e21) return 'small LLM';
  if (C_val < 1e23) return 'mid-scale';
  if (C_val < 1e24) return 'GPT-3 scale';
  return 'frontier scale';
}

// ── Coordinate helpers ────────────────────────────────────────────────────────
function logToX(val, xMin, xMax, pxMin, pxMax) {
  const t = (Math.log10(val) - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin));
  return pxMin + t * (pxMax - pxMin);
}
function lossToY(loss, yMin, yMax, pxTop, pxBottom) {
  const t = (loss - yMin) / (yMax - yMin);
  return pxBottom - t * (pxBottom - pxTop);
}

// ── Curve point generators ────────────────────────────────────────────────────
function makeNcurve(C_val) {
  const pts = [];
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const N = Math.pow(10, 7 + t * 5);   // 1e7 .. 1e12
    const D = C_val / (6 * N);
    if (D < 1e8) continue;
    const loss = lossNd(N, D);
    if (!isFinite(loss) || loss > 4.5) continue;
    pts.push({ x: N, y: loss });
  }
  return pts;
}

function makeDcurve(C_val) {
  const pts = [];
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const D = Math.pow(10, 9 + t * 5);   // 1e9 .. 1e14
    const N = C_val / (6 * D);
    if (N < 1e7) continue;
    const loss = lossNd(N, D);
    if (!isFinite(loss) || loss > 4.5) continue;
    pts.push({ x: D, y: loss });
  }
  return pts;
}

// ── Canvas draw ───────────────────────────────────────────────────────────────
const CHART_W  = 260;
const CHART_H  = 300;
const PAD_L    = 48;
const PAD_B    = 36;
const PAD_T    = 20;
const Y_MIN    = 1.7;
const Y_MAX    = 4.5;

function drawChart(ctx, W, H, {
  xMin, xMax, xLabels,
  title,
  curves,        // [{pts, color, width, dash, label}]
  starPt,        // {x, y, label} | null
  models,        // [{x, y, color, name}] | []
  showModels,
  showStar,
}) {
  const pxL = PAD_L;
  const pxR = W;
  const pxT = PAD_T;
  const pxB = H - PAD_B;

  const toX = (v) => logToX(v, xMin, xMax, pxL, pxR);
  const toY = (v) => lossToY(v, Y_MIN, Y_MAX, pxT, pxB);

  // Background
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.setLineDash([2, 4]);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  for (const yv of [1.7, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5]) {
    const y = toY(yv);
    ctx.beginPath(); ctx.moveTo(pxL, y); ctx.lineTo(pxR, y); ctx.stroke();
  }
  for (const xv of xLabels.map(l => l.val)) {
    const x = toX(xv);
    ctx.beginPath(); ctx.moveTo(x, pxT); ctx.lineTo(x, pxB); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Axes
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pxL, pxT); ctx.lineTo(pxL, pxB); ctx.lineTo(pxR, pxB); ctx.stroke();

  // Y-axis labels
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const yv of [1.7, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5]) {
    ctx.fillText(yv.toFixed(1), pxL - 4, toY(yv));
  }

  // X-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const { val, label } of xLabels) {
    ctx.fillText(label, toX(val), pxB + 4);
  }

  // Title
  ctx.font = "11px 'Inter', sans-serif";
  ctx.fillStyle = C.mid;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, pxL + 4, 4);

  // Curves
  for (const curve of curves) {
    if (!curve.pts || curve.pts.length < 2) continue;
    ctx.beginPath();
    ctx.strokeStyle = curve.color;
    ctx.lineWidth = curve.width || 1;
    ctx.setLineDash(curve.dash || []);
    let first = true;
    for (const { x, y } of curve.pts) {
      const cx = toX(x);
      const cy = toY(y);
      if (cx < pxL - 1 || cx > pxR + 1) continue;
      if (cy < pxT - 1 || cy > pxB + 1) continue;
      if (first) { ctx.moveTo(cx, cy); first = false; }
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve end label
    if (curve.label && curve.pts.length > 0) {
      const last = curve.pts[curve.pts.length - 1];
      const lx = toX(last.x);
      const ly = toY(last.y);
      if (lx > pxL && lx < pxR && ly > pxT && ly < pxB) {
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillStyle = curve.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(curve.label, Math.min(lx + 2, pxR - 24), ly - 2);
      }
    }
  }

  // Model dots
  if (showModels) {
    for (const m of models) {
      const mx = toX(m.x);
      const my = toY(m.y);
      if (mx < pxL || mx > pxR || my < pxT || my > pxB) continue;
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = "9px 'Inter', sans-serif";
      ctx.fillStyle = C.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(m.name, mx + 7, my + 2);
    }
  }

  // Star marker
  if (showStar && starPt) {
    const sx = toX(starPt.x);
    const sy = toY(starPt.y);
    if (sx >= pxL && sx <= pxR && sy >= pxT && sy <= pxB) {
      ctx.font = 'bold 14px serif';
      ctx.fillStyle = C.accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', sx, sy);
      // Annotation
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = C.accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(starPt.label, sx, sy - 9);
    }
  }
}

// ── Stat cell (horizontal layout) ────────────────────────────────────────────
function Stat({ label, val, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: '12px', color: color || C.accent, lineHeight: 1 }}>
        {val}
      </div>
    </div>
  );
}

function StatDivider() {
  return <div data-mobile-divider style={{ width: 1, background: C.border, alignSelf: 'stretch', margin: '0 4px' }} />;
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: C.accent, cursor: 'pointer' }} />
      <span style={{ ...mono, fontSize: '10px', color: C.muted }}>{label}</span>
    </label>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
const FIXED_N_CURVES = FIXED_CURVES.map(fc => ({ ...fc, pts: makeNcurve(fc.C) }));
const FIXED_D_CURVES = FIXED_CURVES.map(fc => ({ ...fc, pts: makeDcurve(fc.C) }));

const N_X_LABELS = [
  { val: 1e7,  label: '10M' },
  { val: 1e8,  label: '100M' },
  { val: 1e9,  label: '1B' },
  { val: 1e10, label: '10B' },
  { val: 1e11, label: '100B' },
  { val: 1e12, label: '1T' },
];
const D_X_LABELS = [
  { val: 1e9,  label: '1B' },
  { val: 1e10, label: '10B' },
  { val: 1e11, label: '100B' },
  { val: 1e12, label: '1T' },
  { val: 1e13, label: '10T' },
  { val: 1e14, label: '100T' },
];

export default function ScalingLaws({ tryThis }) {
  const [sliderVal,    setSliderVal]    = useState(60);
  const [showIso,      setShowIso]      = useState(true);
  const [showModels,   setShowModels]   = useState(true);
  const [showOptimal,  setShowOptimal]  = useState(true);

  const leftRef  = useRef(null);
  const rightRef = useRef(null);

  const C_val = Math.pow(10, 19 + (sliderVal / 100) * 7);

  const { nStar, dStar, lossStar, selNcurve, selDcurve } = useMemo(() => {
    const nStar = optimalN(C_val);
    const dStar = optimalD(C_val, nStar);
    const lossStar = lossNd(nStar, dStar);
    const selNcurve = makeNcurve(C_val);
    const selDcurve = makeDcurve(C_val);
    return { nStar, dStar, lossStar, selNcurve, selDcurve };
  }, [C_val]);

  const modelPts = useMemo(() =>
    MODELS.map(m => ({ ...m, loss: lossNd(m.N, m.D) })),
  []);

  const nearest = useMemo(() => {
    let best = null, bestDiff = Infinity;
    for (const m of modelPts) {
      const diff = Math.abs(m.loss - lossStar);
      if (diff < bestDiff) { bestDiff = diff; best = m; }
    }
    return best;
  }, [lossStar, modelPts]);

  // Loss the nearest model *itself* could have reached at its OWN training
  // compute (6*N*D) — not at the slider's arbitrary C. Comparing a real
  // model's loss to the optimum of a different compute budget is a category
  // error, so "vs optimal" below is always computed at the model's own C.
  const nearestOwnLossStar = useMemo(() => {
    if (!nearest) return null;
    const ownC = 6 * nearest.N * nearest.D;
    const ownN = optimalN(ownC);
    const ownD = optimalD(ownC, ownN);
    return lossNd(ownN, ownD);
  }, [nearest]);

  // Draw left chart
  useEffect(() => {
    const canvas = leftRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(CHART_W * dpr);
    canvas.height = Math.round(CHART_H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const curves = [];
    if (showIso) {
      for (const fc of FIXED_N_CURVES) curves.push(fc);
    }
    curves.push({ pts: selNcurve, color: C.accent, width: 2.5, dash: [], label: fmtSci(C_val) });

    const mDots = modelPts.map(m => ({ x: m.N, y: m.loss, color: m.color, name: m.name }));

    drawChart(ctx, CHART_W, CHART_H, {
      xMin: 1e7, xMax: 1e12,
      xLabels: N_X_LABELS,
      title: 'Loss vs Parameters',
      curves,
      starPt: showOptimal ? { x: nStar, y: lossStar, label: `N*=${fmtN(nStar)}` } : null,
      models: mDots,
      showModels,
      showStar: showOptimal,
    });
  }, [sliderVal, showIso, showModels, showOptimal, selNcurve, nStar, lossStar, C_val]);

  // Draw right chart
  useEffect(() => {
    const canvas = rightRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(CHART_W * dpr);
    canvas.height = Math.round(CHART_H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const curves = [];
    if (showIso) {
      for (const fc of FIXED_D_CURVES) curves.push(fc);
    }
    curves.push({ pts: selDcurve, color: C.accent, width: 2.5, dash: [], label: fmtSci(C_val) });

    const mDots = modelPts.map(m => ({ x: m.D, y: m.loss, color: m.color, name: m.name }));

    drawChart(ctx, CHART_W, CHART_H, {
      xMin: 1e9, xMax: 1e14,
      xLabels: D_X_LABELS,
      title: 'Loss vs Tokens',
      curves,
      starPt: showOptimal ? { x: dStar, y: lossStar, label: `D*=${fmtN(dStar)}` } : null,
      models: mDots,
      showModels,
      showStar: showOptimal,
    });
  }, [sliderVal, showIso, showModels, showOptimal, selDcurve, dStar, lossStar, C_val]);

  const tokensPerParam = dStar / nStar;
  const nearestLoss    = nearest ? nearest.loss : null;
  const lossOverOptimal = (nearest && nearestOwnLossStar != null)
    ? nearest.loss - nearestOwnLossStar
    : null;

  return (
    <WidgetCard title="Scaling Laws — Chinchilla optimal compute allocation" number="10.4" tryThis={tryThis}>

      {/* ── Compute slider ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Compute Budget C
          </span>
          <span style={{ ...mono, fontSize: '11px', color: C.accent }}>
            C = {fmtSci(C_val)} ({cLabel(C_val)})
          </span>
        </div>
        <input
          type="range" min={0} max={100} step={0.5} value={sliderVal}
          onChange={e => setSliderVal(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* ── Charts (full width) ─────────────────────────────────────────── */}
      <div data-mobile-stack style={{ display: 'flex', gap: '0px', background: C.codeBg, borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
        <canvas ref={leftRef}  style={{ width: '50%', display: 'block' }} />
        <canvas ref={rightRef} style={{ width: '50%', display: 'block' }} />
      </div>

      {/* ── Stats panel (below charts, horizontal) ──────────────────────── */}
      <div data-mobile-stat-strip style={{
        background: C.bg2, border: `1px solid ${C.border}`,
        borderRadius: '8px', padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
        marginBottom: '10px',
      }}>
        <Stat label="Compute C" val={fmtSci(C_val)} />
        <StatDivider />
        <Stat label="Optimal N*" val={fmtN(nStar)} />
        <Stat label="Optimal D*" val={fmtN(dStar)} />
        <Stat label="Tokens / param" val={`${tokensPerParam.toFixed(1)}×`} />
        <StatDivider />
        <Stat label="Predicted loss L*" val={lossStar.toFixed(3)} />
        {nearest && (
          <>
            <StatDivider />
            <Stat label="Nearest model" val={nearest.name} color={nearest.color} />
            <Stat label="Model loss"    val={nearestLoss.toFixed(3)} />
            <Stat label="vs its own optimum"
              val={`${lossOverOptimal >= 0 ? '+' : ''}${lossOverOptimal.toFixed(3)}`}
              color={lossOverOptimal < 0.05 ? '#34d399' : lossOverOptimal < 0.2 ? C.accent : '#f87171'} />
          </>
        )}
      </div>

      {/* ── Caption ──────────────────────────────────────────────────────── */}
      <div style={{
        fontFamily: "'Inter', sans-serif", fontSize: '10.5px', color: C.textMid,
        fontStyle: 'italic', lineHeight: 1.5, marginBottom: '10px',
      }}>
        This fitted power law's compute-optimal ratio (D*/N*) grows with the
        compute budget — from roughly 30× at the slider's low end to 150×+ at
        the high end — rather than sitting fixed at 20×. The "~20 tokens/param"
        figure above describes the real, fixed-compute Chinchilla model itself;
        "vs its own optimum" compares each historical model's loss to the
        optimum <em>at that model's own training compute</em>, not the
        slider's.
      </div>

      {/* ── Toggles ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap' }}>
        <Toggle checked={showIso}     onChange={setShowIso}     label="Show iso-compute curves" />
        <Toggle checked={showModels}  onChange={setShowModels}  label="Show real models" />
        <Toggle checked={showOptimal} onChange={setShowOptimal} label="Show optimal point" />
      </div>

    </WidgetCard>
  );
}
