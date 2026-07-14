import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── PRNG ──────────────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng) {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  orange:    '#fb923c',
  orangeDim: 'rgba(251,146,60,0.14)',
  red:       '#f87171',
  math:      '#fbbf24',
  green:     '#34d399',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  mid:       '#888888',
  text:      '#e8eaed',
  codeBg:    '#0a0a0a',
};
const mono  = "'JetBrains Mono', monospace";
const inter = "'Inter', sans-serif";

// ── Illustrative weight matrix ─────────────────────────────────────────────────
// Synthetic, disclosed as such: a handful of channels ("outlier channels") have
// much larger magnitude than the rest, echoing the outlier-feature phenomenon
// reported in real LLM weights/activations. Fixed seed so every reader sees the
// same numbers.
const CHANNELS        = 12;
const N_PER_CHANNEL    = 300;
const OUTLIER_CHANNELS = [2, 8];
const BASE_SIGMA       = 0.35;
const OUTLIER_MULT     = 11;
const SEED             = 4242;

const isOutlier = (c) => OUTLIER_CHANNELS.includes(c);

function generateWeights() {
  const rng = mulberry32(SEED);
  const channels = [];
  for (let c = 0; c < CHANNELS; c++) {
    const sigma = isOutlier(c) ? BASE_SIGMA * OUTLIER_MULT : BASE_SIGMA;
    const vals = new Float64Array(N_PER_CHANNEL);
    for (let i = 0; i < N_PER_CHANNEL; i++) vals[i] = randn(rng) * sigma;
    channels.push(vals);
  }
  return channels;
}

const WEIGHT_CHANNELS = generateWeights();
const ALL_VALUES = (() => {
  const a = [];
  for (const ch of WEIGHT_CHANNELS) for (const v of ch) a.push(v);
  return a;
})();
const GLOBAL_MAX_ABS = Math.max(...ALL_VALUES.map(Math.abs));
const GLOBAL_MEAN_SQ = ALL_VALUES.reduce((s, v) => s + v * v, 0) / ALL_VALUES.length;

const CHANNEL_MAX_ABS = WEIGHT_CHANNELS.map((ch) => {
  let m = 0;
  for (let i = 0; i < ch.length; i++) m = Math.max(m, Math.abs(ch[i]));
  return m;
});
const CHANNEL_MEAN_SQ = WEIGHT_CHANNELS.map((ch) => {
  let s = 0;
  for (let i = 0; i < ch.length; i++) s += ch[i] * ch[i];
  return s / ch.length;
});

// ── Histogram (fixed bins so original vs reconstructed are comparable) ────────
const NBINS    = 40;
const HIST_MAX = GLOBAL_MAX_ABS * 1.05;
const HIST_MIN = -HIST_MAX;
const BIN_W    = (HIST_MAX - HIST_MIN) / NBINS;

function histogram(values) {
  const counts = new Array(NBINS).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - HIST_MIN) / BIN_W);
    if (idx < 0) idx = 0;
    if (idx >= NBINS) idx = NBINS - 1;
    counts[idx]++;
  }
  return counts;
}

const ORIGINAL_HIST = histogram(ALL_VALUES);

// ── Quantization math (real round-to-nearest-grid-point, symmetric signed) ────
// qmax sacrifices one code to keep zero exactly representable, matching common
// symmetric-quantization practice (e.g. INT8 uses -127..127, not -128..127).
function qmaxFor(bits) { return Math.pow(2, bits - 1) - 1; }

function quantizeChannel(values, scale, qmax) {
  const out = new Float64Array(values.length);
  if (scale <= 0) return out;
  for (let i = 0; i < values.length; i++) {
    let q = Math.round(values[i] / scale);
    if (q > qmax) q = qmax;
    if (q < -qmax) q = -qmax;
    out[i] = q * scale;
  }
  return out;
}

function computeAll(perChannel, bits) {
  const qmax = qmaxFor(bits);
  const scales = perChannel
    ? CHANNEL_MAX_ABS.map((m) => m / qmax)
    : WEIGHT_CHANNELS.map(() => GLOBAL_MAX_ABS / qmax);

  const reconChannels = WEIGHT_CHANNELS.map((ch, c) => quantizeChannel(ch, scales[c], qmax));

  const channelStats = WEIGHT_CHANNELS.map((ch, c) => {
    let se = 0;
    const rc = reconChannels[c];
    for (let i = 0; i < ch.length; i++) {
      const d = ch[i] - rc[i];
      se += d * d;
    }
    const mse = se / ch.length;
    const relPct = CHANNEL_MEAN_SQ[c] > 0 ? (mse / CHANNEL_MEAN_SQ[c]) * 100 : 0;
    return { channel: c, mse, se, relPct, isOutlier: isOutlier(c), scale: scales[c] };
  });

  const totalSE = channelStats.reduce((s, cs) => s + cs.se, 0);
  const totalMSE = totalSE / ALL_VALUES.length;
  const relOverallPct = GLOBAL_MEAN_SQ > 0 ? (totalMSE / GLOBAL_MEAN_SQ) * 100 : 0;
  const outlierSE = channelStats.filter((cs) => cs.isOutlier).reduce((s, cs) => s + cs.se, 0);
  const outlierSharePct = totalSE > 0 ? (outlierSE / totalSE) * 100 : 0;

  const reconFlat = [];
  for (const rc of reconChannels) for (const v of rc) reconFlat.push(v);
  const reconHist = histogram(reconFlat);

  return { qmax, scales, channelStats, totalMSE, relOverallPct, outlierSharePct, reconHist };
}

// ── Small presentational pieces ────────────────────────────────────────────────
function fmtSci(x) {
  if (x === 0) return '0';
  return x.toExponential(2);
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      cursor: 'pointer', userSelect: 'none',
    }}>
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: '30px', height: '16px', borderRadius: '8px',
          background: checked ? C.accent : C.bg4,
          border: `1px solid ${checked ? C.accent : C.border}`,
          position: 'relative',
          transition: 'background 0.15s, border-color 0.15s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '1px',
          left: checked ? '15px' : '1px',
          width: '12px', height: '12px', borderRadius: '50%',
          background: checked ? '#0a0a0a' : C.muted,
          transition: 'left 0.15s',
        }} />
      </div>
      <span style={{ fontFamily: mono, fontSize: '11.5px', color: checked ? C.accent : C.mid }}>
        {label}
      </span>
    </label>
  );
}

function StatCell({ label, value, color, note }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{
        fontFamily: inter, fontSize: '8px', color: C.muted, textTransform: 'uppercase',
        letterSpacing: '0.07em', marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: '14px', color: color || C.text, fontWeight: 600, lineHeight: 1.2 }}>
        {value}
      </div>
      {note && (
        <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted, marginTop: '3px' }}>
          {note}
        </div>
      )}
    </div>
  );
}

// ── Histogram: original vs reconstructed (real dequantized values) ────────────
function HistogramChart({ reconHist }) {
  const VW = 620, VH = 190;
  const padL = 34, padR = 10, padT = 10, padB = 22;
  const chartW = VW - padL - padR;
  const chartH = VH - padT - padB;
  const barW = chartW / NBINS;

  const maxCount = Math.max(1, ...ORIGINAL_HIST, ...reconHist);

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
      {/* gridlines */}
      {[0, 0.5, 1].map((f) => {
        const y = padT + (1 - f) * chartH;
        return (
          <line key={f} x1={padL} y1={y} x2={padL + chartW} y2={y}
            stroke="#1c1c1c" strokeWidth={1} />
        );
      })}
      {/* axis */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke={C.border} strokeWidth={1} />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke={C.border} strokeWidth={1} />

      {Array.from({ length: NBINS }, (_, i) => {
        const x = padL + i * barW;
        const origH  = (ORIGINAL_HIST[i] / maxCount) * chartH;
        const reconH = (reconHist[i]     / maxCount) * chartH;
        return (
          <g key={i}>
            <rect
              x={x} y={padT + chartH - origH}
              width={Math.max(0.5, barW - 0.5)} height={origH}
              fill={C.borderLt} opacity={0.9}
            />
            <rect
              x={x + barW * 0.12} y={padT + chartH - reconH}
              width={Math.max(0.5, barW * 0.76)} height={reconH}
              fill={C.accent} opacity={0.6}
            />
          </g>
        );
      })}

      {/* zero line */}
      {(() => {
        const zx = padL + ((0 - HIST_MIN) / (HIST_MAX - HIST_MIN)) * chartW;
        return (
          <line x1={zx} y1={padT} x2={zx} y2={padT + chartH}
            stroke={C.muted} strokeWidth={0.75} strokeDasharray="2 2" />
        );
      })()}

      {/* axis labels */}
      <text x={padL} y={padT + chartH + 14} fontFamily={mono} fontSize="8.5" fill={C.muted} textAnchor="start">
        {HIST_MIN.toFixed(1)}
      </text>
      <text x={padL + chartW / 2} y={padT + chartH + 14} fontFamily={mono} fontSize="8.5" fill={C.muted} textAnchor="middle">
        0
      </text>
      <text x={padL + chartW} y={padT + chartH + 14} fontFamily={mono} fontSize="8.5" fill={C.muted} textAnchor="end">
        {HIST_MAX.toFixed(1)}
      </text>
      <text x={4} y={padT + 8} fontFamily={mono} fontSize="8" fill={C.muted} textAnchor="start">
        count
      </text>
    </svg>
  );
}

// ── Per-channel relative error bars ────────────────────────────────────────────
function ChannelErrorBars({ channelStats }) {
  const maxDisplay = 150; // % — clamps bar width, text still shows true value
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {channelStats.map((cs) => {
        const w = Math.min(cs.relPct, maxDisplay) / maxDisplay * 100;
        const color = cs.isOutlier ? C.orange : C.accent;
        return (
          <div key={cs.channel} style={{ display: 'grid', gridTemplateColumns: '46px 1fr 56px', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontFamily: mono, fontSize: '9.5px', color: cs.isOutlier ? C.orange : C.mid, textAlign: 'right' }}>
              ch{cs.channel}{cs.isOutlier ? ' ★' : ''}
            </div>
            <div style={{ background: C.codeBg, borderRadius: '2px', height: '9px', position: 'relative' }}>
              <div style={{
                width: `${w}%`, height: '100%', background: color,
                opacity: cs.isOutlier ? 0.85 : 0.75, borderRadius: '2px',
                transition: 'width 0.2s ease',
              }} />
            </div>
            <div style={{ fontFamily: mono, fontSize: '9.5px', color, textAlign: 'right' }}>
              {cs.relPct.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────────
export default function QuantizationExplorer({ tryThis }) {
  const [bits, setBits] = useState(4);
  const [perChannel, setPerChannel] = useState(false);

  const result = useMemo(() => computeAll(perChannel, bits), [perChannel, bits]);
  const { qmax, channelStats, totalMSE, relOverallPct, outlierSharePct, reconHist } = result;

  const levels = 2 * qmax + 1;
  const scaleRange = perChannel
    ? `${Math.min(...result.scales).toFixed(4)} – ${Math.max(...result.scales).toFixed(4)}`
    : result.scales[0].toFixed(4);

  return (
    <WidgetCard
      title="Quantization — reconstruction error from real round-to-grid quantization"
      number="14.4"
      tryThis={tryThis}
    >
      {/* Disclosure */}
      <div style={{
        fontFamily: mono, fontSize: '10px', color: C.muted, lineHeight: 1.5,
        marginBottom: '12px', padding: '8px 12px', background: C.codeBg,
        border: `1px solid ${C.border}`, borderRadius: '6px',
      }}>
        Illustrative weight distribution, not values from a real checkpoint: {CHANNELS} channels ×{' '}
        {N_PER_CHANNEL} weights each, roughly Gaussian, with {OUTLIER_CHANNELS.length} channels
        (marked ★) scaled ~{OUTLIER_MULT}× larger to model the outlier-channel phenomenon reported
        in real LLM weights.
      </div>

      {/* Histogram: original vs dequantized */}
      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: inter, fontSize: '11px', color: C.mid }}>
          Value distribution — original vs. quantized-then-dequantized
        </span>
        <span style={{ display: 'flex', gap: '12px', fontFamily: mono, fontSize: '9.5px', color: C.muted }}>
          <span><span style={{ display: 'inline-block', width: 9, height: 9, background: C.borderLt, marginRight: 4, verticalAlign: '-1px' }} />original</span>
          <span><span style={{ display: 'inline-block', width: 9, height: 9, background: C.accent, opacity: 0.6, marginRight: 4, verticalAlign: '-1px' }} />reconstructed</span>
        </span>
      </div>
      <div style={{ background: C.codeBg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px' }}>
        <HistogramChart reconHist={reconHist} />
      </div>

      {/* Per-channel error + stats, side by side */}
      <div style={{ marginTop: '14px', display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1.3 1 260px', minWidth: 0 }}>
          <div style={{ fontFamily: inter, fontSize: '11px', color: C.mid, marginBottom: '8px' }}>
            Relative reconstruction error by channel (MSE ÷ channel mean-square)
          </div>
          <ChannelErrorBars channelStats={channelStats} />
        </div>

        <div style={{
          flex: '1 1 220px', minWidth: '220px',
          background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <StatCell label="Bit-width" value={`${bits}-bit`} color={C.math} />
            <StatCell label="Levels" value={levels} note={`qmax=${qmax}`} />
            <StatCell label="Mode" value={perChannel ? 'Per-channel' : 'Naive'} color={perChannel ? C.accent : C.orange} />
          </div>
          <div style={{ borderTop: `1px solid ${C.border}` }} />
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <StatCell label="Overall MSE" value={fmtSci(totalMSE)} color={C.text} />
            <StatCell label="Rel. error" value={`${relOverallPct.toFixed(1)}%`}
              color={relOverallPct > 15 ? C.red : relOverallPct > 3 ? C.orange : C.green} />
          </div>
          <div style={{ borderTop: `1px solid ${C.border}` }} />
          <div style={{ padding: '9px 12px' }}>
            <div style={{ fontFamily: inter, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
              Scale (Δ per level)
            </div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: C.text }}>{scaleRange}</div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}` }} />
          <div style={{ padding: '9px 12px' }}>
            <div style={{ fontFamily: inter, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
              Outlier channels' share of total squared error
            </div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: C.orange }}>
              {outlierSharePct.toFixed(0)}% &nbsp;
              <span style={{ color: C.muted, fontSize: '9.5px' }}>({OUTLIER_CHANNELS.length}/{CHANNELS} channels)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic caption */}
      <div style={{ marginTop: '10px', fontFamily: mono, fontSize: '10.5px', color: C.muted, lineHeight: 1.5 }}>
        {perChannel
          ? `Per-channel scales: each channel is quantized against its own range, so the ${CHANNELS - OUTLIER_CHANNELS.length} ordinary channels keep their resolution — overall relative error is ${relOverallPct.toFixed(1)}%, and what error remains is now concentrated in the ★ outlier channels (${outlierSharePct.toFixed(0)}% of total squared error).`
          : `Naive per-tensor scale: one scale, set by the widest channel, is applied everywhere — ordinary channels are forced onto the same coarse grid as the ★ outlier channels, so overall relative error is ${relOverallPct.toFixed(1)}%.`}
      </div>

      {/* Controls */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '14px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: mono, fontSize: '11px', color: C.muted }}>bits</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[8, 4, 3, 2].map((b) => {
              const active = bits === b;
              return (
                <button
                  key={b}
                  onClick={() => setBits(b)}
                  style={{
                    fontFamily: mono, fontSize: '11px', fontWeight: active ? 600 : 400,
                    color: active ? '#0a0a0a' : C.muted,
                    background: active ? C.math : 'transparent',
                    border: `1px solid ${active ? C.math : C.border}`,
                    borderRadius: '4px', padding: '4px 11px', cursor: 'pointer',
                  }}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ width: '1px', height: '18px', background: C.border }} />

        <Toggle
          label="Per-channel (outlier-aware) scales"
          checked={perChannel}
          onChange={setPerChannel}
        />

        <div style={{ flex: 1 }} />

        <button
          onClick={() => { setBits(4); setPerChannel(false); }}
          style={{
            fontFamily: mono, fontSize: '11px', color: C.muted, background: 'transparent',
            border: `1px solid ${C.border}`, borderRadius: '4px', padding: '4px 12px', cursor: 'pointer',
          }}
        >
          ↺ Reset
        </button>
      </div>
    </WidgetCard>
  );
}
