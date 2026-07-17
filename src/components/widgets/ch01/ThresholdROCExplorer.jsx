import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { mulberry32 } from '../../../utils/rng';

// ─── Colors (house palette — matches ch01/DistributionExplorer.jsx, ch02/ch20 widgets) ──
const C = {
  accent:    '#2dd4bf', // negative class (label 0) / true negatives
  accentDim: '#0b2422',
  math:      '#fbbf24', // false negatives ("missed" positives)
  green:     '#34d399', // true positives
  red:       '#f87171', // false positives
  orange:    '#fb923c', // positive class (label 1)
  purple:    '#a78bfa', // ROC curve
  border:    '#242424',
  borderLt:  '#2e2e2e',
  codeBg:    '#0a0a0a',
  bg2:       '#111111',
  textMid:   '#888888',
  textMuted: '#555555',
  text:      '#e8eaed',
};
const mono = "'JetBrains Mono', monospace";

// Box-Muller: two independent uniforms -> one standard-normal draw.
function randn(rng) {
  const u = 1 - rng(), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Real Gaussian density formula (used for the two curves drawn on the axis) ──
function gaussianPdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

// ─── Seeded base draws, fixed once at module load (same convention as
// ch20/ForwardDiffusion.jsx's fixed epsilon array). Each class's actual score
// is a live reparameterization score = mu + sigma * z of this *same* fixed z,
// so dragging separation or spread moves the same 500 points continuously —
// nothing is resampled or replayed, and the rug plot below never flickers. ──
const N_PER_CLASS = 500;
const NEG_Z = (() => { const rng = mulberry32(1013); return Array.from({ length: N_PER_CLASS }, () => randn(rng)); })();
const POS_Z = (() => { const rng = mulberry32(7919); return Array.from({ length: N_PER_CLASS }, () => randn(rng)); })();

// ─── Empirical ROC curve, computed by actually walking the combined,
// actually-sampled score list from high to low (the standard non-parametric
// ROC construction — every point on this curve corresponds to a real
// threshold position over the real samples, not an interpolated guess). ──
function computeROC(scoresNeg, scoresPos) {
  const nNeg = scoresNeg.length, nPos = scoresPos.length;
  const combined = new Array(nNeg + nPos);
  let k = 0;
  for (let i = 0; i < nPos; i++) combined[k++] = { s: scoresPos[i], label: 1 };
  for (let i = 0; i < nNeg; i++) combined[k++] = { s: scoresNeg[i], label: 0 };
  combined.sort((a, b) => b.s - a.s); // descending: as if sweeping the threshold down from +infinity

  const points = new Array(combined.length + 1);
  points[0] = { fpr: 0, tpr: 0 };
  let tp = 0, fp = 0;
  for (let i = 0; i < combined.length; i++) {
    if (combined[i].label === 1) tp++; else fp++;
    points[i + 1] = { fpr: fp / nNeg, tpr: tp / nPos };
  }

  // Trapezoidal AUC over the traced curve — the area actually under the
  // points just drawn, not a separately fabricated number.
  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    auc += (points[i].fpr - points[i - 1].fpr) * (points[i].tpr + points[i - 1].tpr) / 2;
  }
  return { points, auc };
}

// Confusion matrix at an arbitrary threshold, counted directly from the real
// sample arrays (predict positive when score >= threshold) — no fabricated
// numbers, and the same ">=" rule computeROC's sweep implicitly uses.
function confusionAt(scoresNeg, scoresPos, threshold) {
  let tp = 0, fn = 0, fp = 0, tn = 0;
  for (let i = 0; i < scoresPos.length; i++) { if (scoresPos[i] >= threshold) tp++; else fn++; }
  for (let i = 0; i < scoresNeg.length; i++) { if (scoresNeg[i] >= threshold) fp++; else tn++; }
  return { tp, fn, fp, tn };
}

function getDomain(muPos, sigma, threshold) {
  let xMin = Math.min(0, muPos) - 3.2 * sigma;
  let xMax = Math.max(0, muPos) + 3.2 * sigma;
  xMin = Math.min(xMin, threshold - 0.5);
  xMax = Math.max(xMax, threshold + 0.5);
  return { xMin, xMax };
}

// ─── Confusion-outcome legend ────────────────────────────────────────────────
const OUTCOME = {
  tp: { label: 'TP', color: C.green,  bg: 'rgba(52,211,153,0.12)' },
  fp: { label: 'FP', color: C.red,    bg: 'rgba(248,113,113,0.12)' },
  fn: { label: 'FN', color: C.math,   bg: 'rgba(251,191,36,0.12)' },
  tn: { label: 'TN', color: C.accent, bg: 'rgba(45,212,191,0.12)' },
};

// ─── Distribution canvas (design-space coordinates, scaled to actual size) ──
const DIST_CW = 600, DIST_CH = 216;
const DIST_PAD = { top: 18, right: 18, left: 48, bottom: 20 };
const BASELINE_Y = 132;
const CURVE_TOP = DIST_PAD.top;
const CURVE_PLOT_H = BASELINE_Y - CURVE_TOP;
const ROW_NEG_Y = 152;
const ROW_POS_Y = 172;
const TICK_HALF_H = 5;
const XLABEL_Y = 196;
const HARD_MIN = -6, HARD_MAX = 12;

function drawDistribution(canvas, muPos, sigma, threshold, scoresNeg, scoresPos) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || DIST_CW, h = rect.height || DIST_CH;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);
  const sx = w / DIST_CW, sy = h / DIST_CH;

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, w, h);

  const { xMin, xMax } = getDomain(muPos, sigma, threshold);
  const plotW = DIST_CW - DIST_PAD.left - DIST_PAD.right;
  const toX = x => (DIST_PAD.left + (x - xMin) / (xMax - xMin) * plotW) * sx;

  // Real Gaussian pdf, sampled densely across the visible domain — the curve
  // shape is the actual formula, not a canned SVG path.
  const M = 160;
  const negPts = new Array(M + 1), posPts = new Array(M + 1);
  for (let i = 0; i <= M; i++) {
    const x = xMin + (xMax - xMin) * (i / M);
    negPts[i] = { x, y: gaussianPdf(x, 0, sigma) };
    posPts[i] = { x, y: gaussianPdf(x, muPos, sigma) };
  }
  const yMax = Math.max(...negPts.map(p => p.y), ...posPts.map(p => p.y)) * 1.15 || 1;
  const toY = d => (BASELINE_Y - (d / yMax) * CURVE_PLOT_H) * sy;
  const baselineYs = BASELINE_Y * sy;

  // Split each curve at the threshold and fill the two halves with the
  // confusion-outcome color they represent (e.g. the area of the positive
  // curve left of the threshold literally is the false-negative region).
  function fillSplit(points, mu, leftColor, rightColor) {
    const dThresh = gaussianPdf(threshold, mu, sigma);
    const left = points.filter(p => p.x <= threshold);
    const right = points.filter(p => p.x >= threshold);
    if (left.length === 0 || left[left.length - 1].x < threshold) left.push({ x: threshold, y: dThresh });
    if (right.length === 0 || right[0].x > threshold) right.unshift({ x: threshold, y: dThresh });

    if (left.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toX(left[0].x), baselineYs);
      left.forEach(p => ctx.lineTo(toX(p.x), toY(p.y)));
      ctx.lineTo(toX(left[left.length - 1].x), baselineYs);
      ctx.closePath();
      ctx.fillStyle = leftColor;
      ctx.fill();
    }
    if (right.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toX(right[0].x), baselineYs);
      right.forEach(p => ctx.lineTo(toX(p.x), toY(p.y)));
      ctx.lineTo(toX(right[right.length - 1].x), baselineYs);
      ctx.closePath();
      ctx.fillStyle = rightColor;
      ctx.fill();
    }
  }
  fillSplit(negPts, 0,     'rgba(45,212,191,0.22)', 'rgba(248,113,113,0.22)'); // TN | FP
  fillSplit(posPts, muPos, 'rgba(251,191,36,0.22)',  'rgba(52,211,153,0.22)'); // FN | TP

  function strokeCurve(points, color) {
    ctx.beginPath();
    points.forEach((p, i) => { const cx = toX(p.x), cy = toY(p.y); i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy); });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.75 * Math.min(sx, sy);
    ctx.stroke();
  }
  strokeCurve(negPts, C.accent);
  strokeCurve(posPts, C.orange);

  // Baseline
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(DIST_PAD.left * sx, baselineYs);
  ctx.lineTo((DIST_CW - DIST_PAD.right) * sx, baselineYs);
  ctx.stroke();

  // Rug rows: every one of the 500+500 actual sampled points, ticked at its
  // real score, colored by whether the current threshold gets it right.
  function drawRug(scores, rowY, colorFn) {
    const ry = rowY * sy;
    ctx.lineWidth = 1.1 * Math.min(sx, sy);
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < scores.length; i++) {
      const cx = toX(scores[i]);
      ctx.strokeStyle = colorFn(scores[i]);
      ctx.beginPath();
      ctx.moveTo(cx, ry - TICK_HALF_H * sy);
      ctx.lineTo(cx, ry + TICK_HALF_H * sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  drawRug(scoresNeg, ROW_NEG_Y, s => (s >= threshold ? C.red : C.accent));
  drawRug(scoresPos, ROW_POS_Y, s => (s >= threshold ? C.green : C.math));

  ctx.font = `${10 * sx}px ${mono}`;
  ctx.fillStyle = C.textMuted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('neg', (DIST_PAD.left - 8) * sx, ROW_NEG_Y * sy);
  ctx.fillText('pos', (DIST_PAD.left - 8) * sx, ROW_POS_Y * sy);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const xv = xMin + (xMax - xMin) * (i / ticks);
    ctx.fillStyle = C.textMuted;
    ctx.fillText(xv.toFixed(1), toX(xv), XLABEL_Y * sy);
  }

  // Threshold line + drag handle
  const tx = toX(threshold);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.5 * Math.min(sx, sy);
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(tx, (CURVE_TOP - 8) * sy);
  ctx.lineTo(tx, (ROW_POS_Y + TICK_HALF_H + 4) * sy);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.moveTo(tx - 5 * sx, (CURVE_TOP - 8) * sy);
  ctx.lineTo(tx + 5 * sx, (CURVE_TOP - 8) * sy);
  ctx.lineTo(tx, (CURVE_TOP + 2) * sy);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${11 * sx}px ${mono}`;
  ctx.fillStyle = C.text;
  ctx.fillText(`t = ${threshold.toFixed(2)}`, tx, (CURVE_TOP - 12) * sy);

  // Legend
  const legX = DIST_CW - DIST_PAD.right;
  let legY = DIST_PAD.top + 6;
  ctx.font = `${9.5 * sx}px ${mono}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [['neg (label 0)', C.accent], ['pos (label 1)', C.orange]].forEach(([label, color]) => {
    ctx.fillStyle = color;
    ctx.fillRect((legX - 68) * sx, (legY - 1) * sy, 14 * sx, 2 * sy);
    ctx.fillStyle = C.textMid;
    ctx.fillText(label, legX * sx, legY * sy);
    legY += 13;
  });

  ctx.restore();
}

// ─── ROC canvas ───────────────────────────────────────────────────────────────
const ROC_CW = 220, ROC_CH = 210;
const ROC_PAD = { top: 14, right: 14, bottom: 30, left: 40 };

function drawROC(canvas, rocPoints, currentPt, auc) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || ROC_CW, h = rect.height || ROC_CH;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);
  const sx = w / ROC_CW, sy = h / ROC_CH;

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, w, h);

  const plotW = ROC_CW - ROC_PAD.left - ROC_PAD.right;
  const plotH = ROC_CH - ROC_PAD.top - ROC_PAD.bottom;
  const toX = fpr => (ROC_PAD.left + fpr * plotW) * sx;
  const toY = tpr => (ROC_PAD.top + (1 - tpr) * plotH) * sy;

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.font = `${9 * sx}px ${mono}`;
  [0, 0.25, 0.5, 0.75, 1].forEach(v => {
    const gx = toX(v), gy = toY(v);
    ctx.beginPath(); ctx.moveTo(ROC_PAD.left * sx, gy); ctx.lineTo((ROC_CW - ROC_PAD.right) * sx, gy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx, ROC_PAD.top * sy); ctx.lineTo(gx, (ROC_CH - ROC_PAD.bottom) * sy); ctx.stroke();
    ctx.fillStyle = C.textMuted;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(v.toFixed(2), (ROC_PAD.left - 5) * sx, gy);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(v.toFixed(2), gx, (ROC_CH - ROC_PAD.bottom + 4) * sy);
  });

  // Random-classifier diagonal
  ctx.strokeStyle = C.textMuted;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(toX(0), toY(0)); ctx.lineTo(toX(1), toY(1)); ctx.stroke();
  ctx.setLineDash([]);

  // Traced ROC curve
  ctx.beginPath();
  rocPoints.forEach((p, i) => {
    const cx = toX(p.fpr), cy = toY(p.tpr);
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  });
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 1.8 * Math.min(sx, sy);
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Current threshold's point, highlighted
  const cx = toX(currentPt.fpr), cy = toY(currentPt.tpr);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.setLineDash([2, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, toY(0)); ctx.lineTo(cx, cy); ctx.lineTo(toX(0), cy); ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(cx, cy, 4.5 * Math.min(sx, sy), 0, 2 * Math.PI);
  ctx.fillStyle = C.text;
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2 * Math.min(sx, sy);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = C.textMid;
  ctx.font = `${10 * sx}px ${mono}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('FPR', (ROC_PAD.left + plotW / 2) * sx, (ROC_CH - 14) * sy);
  ctx.save();
  ctx.translate(12 * sx, (ROC_PAD.top + plotH / 2) * sy);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('TPR', 0, 0);
  ctx.restore();

  ctx.fillStyle = C.text;
  ctx.font = `600 ${11 * sx}px ${mono}`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`AUC = ${auc.toFixed(3)}`, (ROC_PAD.left + 4) * sx, (ROC_PAD.top + 3) * sy);

  ctx.restore();
}

// ─── Small UI helpers (same shapes as ch01/DistributionExplorer.jsx) ────────
function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontFamily: mono, fontSize: '11px', color: C.textMuted, minWidth: '92px', flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1, minWidth: 80, WebkitAppearance: 'none', height: '2px',
          background: C.borderLt, borderRadius: '2px', cursor: 'pointer',
          accentColor: C.accent, outline: 'none',
        }}
      />
      <span style={{ fontFamily: mono, fontSize: '11px', color: C.accent, minWidth: '46px', textAlign: 'right', flexShrink: 0 }}>
        {format ? format(value) : value}
      </span>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMuted, marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: '17px', color: color || C.accent, lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}

function MatrixCell({ outcome, count }) {
  return (
    <div style={{
      background: outcome.bg,
      border: `1px solid ${outcome.color}55`,
      borderRadius: '6px',
      padding: '7px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: mono, fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', color: outcome.color, marginBottom: '2px' }}>
        {outcome.label}
      </div>
      <div style={{ fontFamily: mono, fontSize: '17px', color: C.text }}>{count}</div>
    </div>
  );
}

const headerCellStyle = {
  fontFamily: mono, fontSize: '9px', color: C.textMuted,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

const btnBase = {
  fontFamily: mono, fontSize: '11px',
  padding: '5px 12px', borderRadius: '4px', cursor: 'pointer',
  border: `1px solid ${C.border}`, background: '#161616', color: C.text,
};

const PRESETS = [
  { label: 'Heavy overlap',  separation: 1.0, sigma: 0.9 },
  { label: 'Balanced',       separation: 2.4, sigma: 0.7 },
  { label: 'Well separated', separation: 4.2, sigma: 0.5 },
];

// ─── Main widget ────────────────────────────────────────────────────────────
export default function ThresholdROCExplorer({ tryThis }) {
  const distRef = useRef(null);
  const rocRef  = useRef(null);
  const isDraggingRef = useRef(false);

  const [separation, setSeparation] = useState(2.4); // mu_pos; mu_neg fixed at 0
  const [sigma, setSigma]           = useState(0.7); // shared standard deviation
  const [threshold, setThreshold]   = useState(1.2); // decision threshold

  const muPos = separation;

  // Reparameterized scores: same fixed base draws, transformed live by the
  // current mean/sigma — see the NEG_Z/POS_Z comment above.
  const scoresNeg = useMemo(() => NEG_Z.map(z => sigma * z), [sigma]);
  const scoresPos = useMemo(() => POS_Z.map(z => muPos + sigma * z), [muPos, sigma]);

  const { points: rocPoints, auc } = useMemo(
    () => computeROC(scoresNeg, scoresPos),
    [scoresNeg, scoresPos]
  );

  const confusion = useMemo(
    () => confusionAt(scoresNeg, scoresPos, threshold),
    [scoresNeg, scoresPos, threshold]
  );

  const { tp, fn, fp, tn } = confusion;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : null;
  const recall    = (tp + fn) > 0 ? tp / (tp + fn) : null;
  const f1        = (precision !== null && recall !== null && (precision + recall) > 0)
    ? 2 * precision * recall / (precision + recall) : null;
  const accuracy  = (tp + tn + fp + fn) > 0 ? (tp + tn) / (tp + tn + fp + fn) : null;
  const currentPt = useMemo(
    () => ({ fpr: (fp + tn) > 0 ? fp / (fp + tn) : 0, tpr: (tp + fn) > 0 ? tp / (tp + fn) : 0 }),
    [fp, tn, tp, fn]
  );

  const fmtPct = v => (v === null ? 'n/a' : v.toFixed(3));

  // ── Draw ──────────────────────────────────────────────────────────────────
  const drawDist = useCallback(() => {
    if (distRef.current) drawDistribution(distRef.current, muPos, sigma, threshold, scoresNeg, scoresPos);
  }, [muPos, sigma, threshold, scoresNeg, scoresPos]);

  const drawRocCanvas = useCallback(() => {
    if (rocRef.current) drawROC(rocRef.current, rocPoints, currentPt, auc);
  }, [rocPoints, currentPt, auc]);

  useEffect(() => { drawDist(); }, [drawDist]);
  useEffect(() => { drawRocCanvas(); }, [drawRocCanvas]);

  useEffect(() => {
    const ro = new ResizeObserver(() => { drawDist(); });
    if (distRef.current) ro.observe(distRef.current);
    return () => ro.disconnect();
  }, [drawDist]);

  useEffect(() => {
    const ro = new ResizeObserver(() => { drawRocCanvas(); });
    if (rocRef.current) ro.observe(rocRef.current);
    return () => ro.disconnect();
  }, [drawRocCanvas]);

  // ── Drag-to-set-threshold on the distribution canvas ────────────────────
  const updateThresholdFromClientX = useCallback((clientX) => {
    const canvas = distRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const designX = (clientX - rect.left) * (DIST_CW / rect.width);
    const { xMin, xMax } = getDomain(muPos, sigma, threshold);
    const plotW = DIST_CW - DIST_PAD.left - DIST_PAD.right;
    const nx = (designX - DIST_PAD.left) / plotW;
    const score = xMin + nx * (xMax - xMin);
    setThreshold(clamp(score, HARD_MIN, HARD_MAX));
  }, [muPos, sigma, threshold]);

  const handlePointerDown = e => {
    e.preventDefault();
    const canvas = distRef.current;
    if (!canvas) return;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* unsupported in some test environments */ }
    isDraggingRef.current = true;
    updateThresholdFromClientX(e.clientX);
  };
  const handlePointerMove = e => {
    if (!isDraggingRef.current) return;
    updateThresholdFromClientX(e.clientX);
  };
  const endDrag = e => {
    isDraggingRef.current = false;
    const canvas = distRef.current;
    if (canvas) { try { canvas.releasePointerCapture(e.pointerId); } catch { /* already released */ } }
  };

  const applyPreset = p => {
    setSeparation(p.separation);
    setSigma(p.sigma);
    setThreshold(p.separation / 2);
  };

  return (
    <WidgetCard title="Threshold & ROC — trading precision for recall" number="1.4" tryThis={tryThis}>
      {/* Distribution plot with draggable threshold */}
      <canvas
        ref={distRef}
        style={{
          width: '100%',
          aspectRatio: `${DIST_CW}/${DIST_CH}`,
          display: 'block',
          borderRadius: '6px',
          border: `1px solid ${C.border}`,
          cursor: 'ew-resize',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div style={{ marginTop: '6px', fontFamily: mono, fontSize: '10px', color: C.textMuted }}>
        Drag the white marker (or anywhere on the plot) to move the decision threshold. Each row is {N_PER_CLASS} seeded samples from that class's Gaussian — tick color shows whether the current threshold classifies that point correctly.
      </div>

      {/* ROC curve + confusion matrix / metrics */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '18px' }}>
        <div style={{ width: '220px', flexShrink: 0 }}>
          <canvas
            ref={rocRef}
            style={{
              width: '100%',
              aspectRatio: `${ROC_CW}/${ROC_CH}`,
              display: 'block',
              borderRadius: '6px',
              border: `1px solid ${C.border}`,
            }}
          />
        </div>

        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          {/* Confusion matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
            <div />
            <div style={headerCellStyle}>pred +</div>
            <div style={headerCellStyle}>pred −</div>

            <div style={{ ...headerCellStyle, justifyContent: 'flex-end', paddingRight: '4px' }}>actual +</div>
            <MatrixCell outcome={OUTCOME.tp} count={tp} />
            <MatrixCell outcome={OUTCOME.fn} count={fn} />

            <div style={{ ...headerCellStyle, justifyContent: 'flex-end', paddingRight: '4px' }}>actual −</div>
            <MatrixCell outcome={OUTCOME.fp} count={fp} />
            <MatrixCell outcome={OUTCOME.tn} count={tn} />
          </div>

          {/* Metrics */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px',
            background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px 14px',
          }}>
            <StatRow label="Precision" value={fmtPct(precision)} color={C.green} />
            <StatRow label="Recall"    value={fmtPct(recall)}    color={C.orange} />
            <StatRow label="F1"        value={fmtPct(f1)}        color={C.purple} />
            <StatRow label="Accuracy"  value={fmtPct(accuracy)}  color={C.text} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '18px', borderTop: `1px solid ${C.border}`, paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Slider label="separation Δμ" value={separation} min={0} max={5} step={0.1} onChange={setSeparation} format={v => v.toFixed(1)} />
        <Slider label="spread σ"      value={sigma}       min={0.3} max={1.5} step={0.05} onChange={setSigma} format={v => v.toFixed(2)} />
        <Slider label="threshold t"   value={threshold}   min={HARD_MIN} max={HARD_MAX} step={0.05} onChange={setThreshold} format={v => v.toFixed(2)} />
        <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMuted, marginTop: '-2px' }}>
          Δμ moves the positive class's mean; the negative class's mean is fixed at 0. σ is shared by both classes.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
          <span style={{ fontFamily: mono, fontSize: '11px', color: C.textMuted, flexShrink: 0 }}>Presets</span>
          {PRESETS.map(p => (
            <button key={p.label} style={btnBase} onClick={() => applyPreset(p)}>{p.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button style={btnBase} onClick={() => setThreshold(separation / 2)}>Reset t to midpoint</button>
        </div>
      </div>
    </WidgetCard>
  );
}
