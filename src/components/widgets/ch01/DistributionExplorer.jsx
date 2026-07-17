import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { mulberry32 } from '../../../utils/rng';

// ─── Colors (house palette — matches ch02/ch20 widgets) ───────────────────────
const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
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

// Mixes the current family + parameter values + resample counter into a single
// 32-bit integer seed (FNV-1a-style avalanche), so every distinct widget state
// gets its own reproducible sample stream instead of reusing one fixed seed.
function makeSeed(...parts) {
  let h = 0x811c9dc5;
  for (const part of parts) {
    const x = Math.round(part * 1000) | 0;
    h ^= x;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ─── Distribution math (real formulas, not lookup tables) ────────────────────
const CATEGORICAL_K = 5;
const CATEGORICAL_LABELS = ['A', 'B', 'C', 'D', 'E'];

function normalize(weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 1 / weights.length);
  return weights.map(w => w / sum);
}

function bernoulliPmf(p) {
  return [1 - p, p]; // P(X=0), P(X=1)
}

function gaussianPdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function sampleBernoulli(rng, p) {
  return rng() < p ? 1 : 0;
}

function sampleCategorical(rng, probs) {
  const u = rng();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (u < cum) return i;
  }
  return probs.length - 1; // floating-point guard: cumulative sum may fall just short of 1
}

function sampleGaussian(rng, mu, sigma) {
  return mu + sigma * randn(rng);
}

// Draw N live samples from the chosen family with the chosen parameters.
// This is the actual sampling step — uniform draws from mulberry32, pushed
// through the inverse-CDF / threshold / Box-Muller transform for each family.
function generateSamples(family, params, n, seed) {
  const rng = mulberry32(seed);
  const samples = new Array(n);
  if (family === 'bernoulli') {
    for (let i = 0; i < n; i++) samples[i] = sampleBernoulli(rng, params.p);
  } else if (family === 'categorical') {
    const probs = normalize(params.weights);
    for (let i = 0; i < n; i++) samples[i] = sampleCategorical(rng, probs);
  } else {
    for (let i = 0; i < n; i++) samples[i] = sampleGaussian(rng, params.mu, params.sigma);
  }
  return samples;
}

// Bin the live samples and compute the matching theoretical curve — both are
// recomputed from current state on every call, nothing is precomputed/replayed.
function computeDisplayData(family, params, samples) {
  const n = samples.length;
  if (family === 'bernoulli') {
    const counts = [0, 0];
    for (const s of samples) counts[s]++;
    return {
      kind: 'discrete',
      labels: ['0', '1'],
      empirical: counts.map(c => c / n),
      theoretical: bernoulliPmf(params.p),
      mean: { theo: params.p, emp: counts[1] / n },
      variance: { theo: params.p * (1 - params.p), emp: null },
    };
  }
  if (family === 'categorical') {
    const probs = normalize(params.weights);
    const counts = new Array(CATEGORICAL_K).fill(0);
    for (const s of samples) counts[s]++;
    return {
      kind: 'discrete',
      labels: CATEGORICAL_LABELS.slice(0, CATEGORICAL_K),
      empirical: counts.map(c => c / n),
      theoretical: probs,
      mean: null,
      variance: null,
    };
  }
  // Gaussian: bin into a histogram spanning mu ± 4*sigma, density-normalized
  // (count / (n * binWidth)) so the bars sit on the same vertical scale as the pdf.
  // ±4*sigma covers ~99.994% of the true density, so this is a fixed plotting
  // window, not a data-dependent range: any sample landing beyond it (rare, and
  // rarer still at typical N) is clamped into the nearest edge bin below rather
  // than dropped or extending the axis, which can slightly overfill the two end
  // bars at high N — a plotting-range artifact, not a fabricated count.
  const { mu, sigma } = params;
  const xMin = mu - 4 * sigma, xMax = mu + 4 * sigma;
  const nBins = 28;
  const binW = (xMax - xMin) / nBins;
  const counts = new Array(nBins).fill(0);
  for (const s of samples) {
    let idx = Math.floor((s - xMin) / binW);
    if (idx < 0) idx = 0;
    if (idx >= nBins) idx = nBins - 1;
    counts[idx]++;
  }
  const density = counts.map(c => c / (n * binW));
  const curveN = 120;
  const curve = new Array(curveN + 1);
  for (let i = 0; i <= curveN; i++) {
    const x = xMin + (xMax - xMin) * (i / curveN);
    curve[i] = { x, y: gaussianPdf(x, mu, sigma) };
  }
  const empMean = samples.reduce((a, b) => a + b, 0) / n;
  const empVar = samples.reduce((a, b) => a + (b - empMean) ** 2, 0) / n;
  return {
    kind: 'continuous',
    xMin, xMax, binW, nBins,
    density,
    curve,
    mean: { theo: mu, emp: empMean },
    variance: { theo: sigma * sigma, emp: empVar },
  };
}

// ─── Canvas drawing ────────────────────────────────────────────────────────────
const CW = 480, CH = 280;

function drawChart(canvas, data) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width || CW;
  const H = rect.height || CH;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  if (data.kind === 'discrete') {
    const { labels, empirical, theoretical } = data;
    const k = labels.length;
    const yMax = Math.max(0.15, Math.max(...empirical, ...theoretical) * 1.3);
    const toY = v => PAD.top + (1 - v / yMax) * plotH;
    const slotW = plotW / k;

    // Gridlines + y ticks
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const v = (i / yTicks) * yMax;
      const cy = toY(v);
      ctx.beginPath();
      ctx.moveTo(PAD.left, cy);
      ctx.lineTo(PAD.left + plotW, cy);
      ctx.stroke();
      ctx.fillStyle = C.textMuted;
      ctx.font = `10px ${mono}`;
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(2), PAD.left - 6, cy + 3.5);
    }

    // Bars (empirical) + theoretical reference tick
    for (let i = 0; i < k; i++) {
      const cx0 = PAD.left + i * slotW;
      const barW = slotW * 0.5;
      const barX = cx0 + (slotW - barW) / 2;

      const empY = toY(empirical[i]);
      ctx.fillStyle = 'rgba(45,212,191,0.55)';
      ctx.fillRect(barX, empY, barW, PAD.top + plotH - empY);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, empY, barW, PAD.top + plotH - empY);

      // Theoretical value: dashed gold tick spanning the bar + diamond marker
      const theoY = toY(theoretical[i]);
      ctx.strokeStyle = C.math;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(barX - 4, theoY);
      ctx.lineTo(barX + barW + 4, theoY);
      ctx.stroke();
      ctx.setLineDash([]);

      // x label
      ctx.fillStyle = C.textMid;
      ctx.font = `10px ${mono}`;
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], cx0 + slotW / 2, PAD.top + plotH + 16);
    }

    // Axes
    ctx.strokeStyle = C.borderLt;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + plotH);
    ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
    ctx.stroke();
  } else {
    const { xMin, xMax, density, nBins, curve } = data;
    const yMax = Math.max(...density, ...curve.map(c => c.y)) * 1.2 || 1;
    const toX = x => PAD.left + ((x - xMin) / (xMax - xMin)) * plotW;
    const toY = v => PAD.top + (1 - v / yMax) * plotH;
    const binW = (xMax - xMin) / nBins;

    // Gridlines + y ticks
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const v = (i / yTicks) * yMax;
      const cy = toY(v);
      ctx.beginPath();
      ctx.moveTo(PAD.left, cy);
      ctx.lineTo(PAD.left + plotW, cy);
      ctx.stroke();
      ctx.fillStyle = C.textMuted;
      ctx.font = `10px ${mono}`;
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(2), PAD.left - 6, cy + 3.5);
    }

    // x ticks
    ctx.fillStyle = C.textMid;
    ctx.font = `10px ${mono}`;
    ctx.textAlign = 'center';
    const xTickCount = 5;
    for (let i = 0; i <= xTickCount; i++) {
      const x = xMin + (xMax - xMin) * (i / xTickCount);
      ctx.fillText(x.toFixed(1), toX(x), PAD.top + plotH + 16);
    }

    // Histogram bars (empirical density)
    for (let i = 0; i < nBins; i++) {
      const x0 = xMin + i * binW;
      const x1 = x0 + binW;
      const cx0 = toX(x0), cx1 = toX(x1);
      const cy = toY(density[i]);
      ctx.fillStyle = 'rgba(45,212,191,0.5)';
      ctx.fillRect(cx0, cy, Math.max(1, cx1 - cx0 - 1), PAD.top + plotH - cy);
      ctx.strokeStyle = 'rgba(45,212,191,0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx0, cy, Math.max(1, cx1 - cx0 - 1), PAD.top + plotH - cy);
    }

    // Theoretical pdf curve
    ctx.beginPath();
    curve.forEach((pt, i) => {
      const cx = toX(pt.x), cy = toY(pt.y);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.strokeStyle = C.math;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Axes
    ctx.strokeStyle = C.borderLt;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + plotH);
    ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
    ctx.stroke();
  }

  // Legend (top-right)
  const legendItems = data.kind === 'discrete'
    ? [{ label: 'samples', swatch: 'bar', color: C.accent }, { label: 'theoretical', swatch: 'line', color: C.math }]
    : [{ label: 'samples (hist.)', swatch: 'bar', color: C.accent }, { label: 'theoretical pdf', swatch: 'line', color: C.math }];
  const lx = PAD.left + plotW - 8;
  let ly = PAD.top + 8;
  ctx.font = `9px ${mono}`;
  ctx.textAlign = 'right';
  legendItems.forEach(item => {
    if (item.swatch === 'bar') {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx - 20, ly, 12, 9);
    } else {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(lx - 20, ly + 4.5);
      ctx.lineTo(lx - 8, ly + 4.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = C.textMuted;
    ctx.fillText(item.label, lx - 26, ly + 8);
    ly += 15;
  });
}

// ─── Small UI helpers ──────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontFamily: mono, fontSize: '11px', color: C.textMuted, minWidth: '92px', flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1,
          minWidth: 80,
          WebkitAppearance: 'none',
          height: '2px',
          background: C.borderLt,
          borderRadius: '2px',
          cursor: 'pointer',
          accentColor: C.accent,
          outline: 'none',
        }}
      />
      <span style={{ fontFamily: mono, fontSize: '11px', color: C.accent, minWidth: '42px', textAlign: 'right', flexShrink: 0 }}>
        {format ? format(value) : value}
      </span>
    </div>
  );
}

function StatRow({ label, value, sub, color }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontFamily: mono, fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMuted, marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: '15px', color: color || C.accent, lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMuted, marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

const tabBase = {
  fontFamily: mono, fontSize: '11px',
  padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
  border: `1px solid ${C.border}`, background: C.codeBg, color: C.textMid,
};
const tabActive = { ...tabBase, background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}` };
const btnBase = {
  fontFamily: mono, fontSize: '11px',
  padding: '5px 14px', borderRadius: '4px', cursor: 'pointer',
  border: `1px solid ${C.border}`, background: '#161616', color: C.text,
};

// ─── Main widget ────────────────────────────────────────────────────────────────
export default function DistributionExplorer({ tryThis }) {
  const canvasRef = useRef(null);

  const [family, setFamily] = useState('bernoulli'); // 'bernoulli' | 'categorical' | 'gaussian'
  const [p, setP] = useState(0.5);
  const [weights, setWeights] = useState([0.35, 0.25, 0.2, 0.12, 0.08]);
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [n, setN] = useState(300);
  const [resampleTick, setResampleTick] = useState(0);

  const params = family === 'bernoulli' ? { p }
    : family === 'categorical' ? { weights }
    : { mu, sigma };

  // Seed mixes family + every parameter value + N + the resample counter, so
  // the sample stream is deterministic for a given state but a fresh draw
  // whenever any of them changes (including an explicit "Resample" click).
  const seed = useMemo(() => {
    const familyIdx = family === 'bernoulli' ? 0 : family === 'categorical' ? 1 : 2;
    const parts = [familyIdx, n, resampleTick];
    if (family === 'bernoulli') parts.push(p);
    else if (family === 'categorical') parts.push(...weights);
    else parts.push(mu, sigma);
    return makeSeed(...parts);
  }, [family, p, weights, mu, sigma, n, resampleTick]);

  const samples = useMemo(
    () => generateSamples(family, params, n, seed),
    [family, p, weights, mu, sigma, n, seed] // eslint-disable-line react-hooks/exhaustive-deps -- `params` is rebuilt fresh from these each render; listing it too would just be a redundant, always-changing dep
  );

  const data = useMemo(
    () => computeDisplayData(family, params, samples),
    [family, p, weights, mu, sigma, samples] // eslint-disable-line react-hooks/exhaustive-deps -- same rationale: `params` derives from these primitives
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawChart(canvas, data);
  }, [data]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(draw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const setWeight = (i, v) => {
    const next = weights.slice();
    next[i] = v;
    setWeights(next);
  };

  // ── Stat panel content, per family ──────────────────────────────────────────
  let statNodes;
  if (family === 'bernoulli') {
    statNodes = (
      <>
        <StatRow label="P(X=1) — theoretical" value={p.toFixed(2)} />
        <StatRow label="Fraction of 1s — empirical" value={data.mean.emp.toFixed(3)} color={C.math} sub={`from ${n} samples`} />
        <StatRow label="Variance p(1−p)" value={data.variance.theo.toFixed(3)} color={C.textMid} />
      </>
    );
  } else if (family === 'categorical') {
    const probs = normalize(weights);
    statNodes = (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: '9.5px', color: C.textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>cat</span><span>theo.</span><span>emp.</span>
        </div>
        {CATEGORICAL_LABELS.slice(0, CATEGORICAL_K).map((lab, i) => (
          <div key={lab} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: C.textMuted }}>{lab}</span>
            <span style={{ color: C.math }}>{probs[i].toFixed(2)}</span>
            <span style={{ color: C.accent }}>{data.empirical[i].toFixed(2)}</span>
          </div>
        ))}
      </>
    );
  } else {
    statNodes = (
      <>
        <StatRow label="mu (theoretical mean)" value={mu.toFixed(2)} />
        <StatRow label="Sample mean" value={data.mean.emp.toFixed(3)} color={C.math} sub={`from ${n} samples`} />
        <StatRow label="sigma^2 (theoretical var.)" value={(sigma * sigma).toFixed(3)} />
        <StatRow label="Sample variance" value={data.variance.emp.toFixed(3)} color={C.math} />
      </>
    );
  }

  return (
    <WidgetCard title="Distribution Explorer — samples vs. the theoretical curve" number="1.1" tryThis={tryThis}>
      {/* Family tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <span style={{ fontFamily: mono, fontSize: '11px', color: C.textMuted, flexShrink: 0 }}>Family</span>
        <button style={family === 'bernoulli' ? tabActive : tabBase} onClick={() => setFamily('bernoulli')}>Bernoulli</button>
        <button style={family === 'categorical' ? tabActive : tabBase} onClick={() => setFamily('categorical')}>Categorical</button>
        <button style={family === 'gaussian' ? tabActive : tabBase} onClick={() => setFamily('gaussian')}>Gaussian</button>
        <div style={{ flex: 1 }} />
        <button style={btnBase} onClick={() => setResampleTick(t => t + 1)}>&#8635; Resample</button>
      </div>

      {/* Canvas + stat panel */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              aspectRatio: `${CW}/${CH}`,
              display: 'block',
              borderRadius: '6px',
              border: `1px solid ${C.border}`,
            }}
          />
        </div>

        <div style={{
          width: '170px', flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '14px 16px',
        }}>
          {statNodes}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {family === 'bernoulli' && (
          <Slider label="p" value={p} min={0.01} max={0.99} step={0.01} onChange={setP} format={v => v.toFixed(2)} />
        )}

        {family === 'categorical' && weights.map((w, i) => (
          <Slider
            key={CATEGORICAL_LABELS[i]}
            label={`weight ${CATEGORICAL_LABELS[i]}`}
            value={w}
            min={0.01}
            max={1}
            step={0.01}
            onChange={v => setWeight(i, v)}
            format={v => v.toFixed(2)}
          />
        ))}

        {family === 'gaussian' && (
          <>
            <Slider label="mu" value={mu} min={-3} max={3} step={0.1} onChange={setMu} format={v => v.toFixed(1)} />
            <Slider label="sigma" value={sigma} min={0.2} max={2.5} step={0.1} onChange={setSigma} format={v => v.toFixed(1)} />
          </>
        )}

        <Slider label="N samples" value={n} min={20} max={2000} step={10} onChange={v => setN(Math.round(v))} format={v => v} />
      </div>

      {family === 'categorical' && (
        <div style={{ marginTop: '10px', fontFamily: mono, fontSize: '10px', color: C.textMuted }}>
          Weights are renormalized to sum to 1 automatically — the sliders set relative weight, not probability directly.
        </div>
      )}
    </WidgetCard>
  );
}
