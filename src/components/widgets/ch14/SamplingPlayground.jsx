import { useState, useRef, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Colors (house palette — matches ch13/ch14 widgets) ────────────────────────
const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  text:      '#e8eaed',
  muted:     '#555555',
  mid:       '#888888',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  codeBg:    '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";

// ── mulberry32 PRNG (matches ch20/ForwardDiffusion.jsx, ch01/DistributionExplorer.jsx) ──
// Deterministic 32-bit PRNG: same seed always produces the same stream, so a
// given strategy/parameter combination always draws the same sequence of
// samples — "resample" and slider changes are reproducible, never Math.random().
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Mixes strategy + parameter values into a single 32-bit seed (FNV-1a-style
// avalanche), matching ch01/DistributionExplorer.jsx's makeSeed convention —
// every distinct widget state gets its own reproducible sample stream.
function makeSeed(...parts) {
  let h = 0x811c9dc5;
  for (const part of parts) {
    const x = Math.round(part * 1000) | 0;
    h ^= x;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ── Toy next-token distribution ───────────────────────────────────────────────
// Illustrative only — a hand-picked logit vector shaped like a plausible LLM
// next-token distribution (one dominant candidate, a mid-probability shoulder,
// a long thin tail). Not sampled from any real model.
const PROMPT = 'The weather today is';
const TOKENS = ['sunny', 'cloudy', 'rainy', 'warm', 'cold', 'nice', 'mild', 'bad', 'odd', 'windy'];
const LOGITS = [3.8, 3.2, 2.6, 2.1, 1.7, 1.3, 0.8, 0.1, -0.6, -1.3];
const N = TOKENS.length;

function softmax(logits, T = 1) {
  const scaled = logits.map(z => z / T);
  const mx = Math.max(...scaled);
  const exps = scaled.map(z => Math.exp(z - mx));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// Fixed reference distribution at T=1 — every strategy is computed against this.
const BASE_PROBS = softmax(LOGITS, 1);

function argmax(probs) {
  let best = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
  return best;
}
const ARGMAX_INDEX = argmax(BASE_PROBS);

// Display order: descending by base probability. Fixed across strategies so
// bars don't reshuffle position when the reader switches strategy — only
// height and color change.
const ORDER = TOKENS.map((_, i) => i).sort((a, b) => BASE_PROBS[b] - BASE_PROBS[a]);

const CHART_MAX = Math.max(...BASE_PROBS) * 1.2;
const BAR_H = 120;

// ── Strategy math ──────────────────────────────────────────────────────────────
// Each strategy returns { probs, eligible }: probs is the actual distribution
// that would be sampled from (zeros for excluded tokens, renormalized over the
// rest), eligible is the set of token indices that survive the strategy's cut.
// Top-k / top-p operate on the base (T=1) distribution — combining truncation
// with temperature is common in real decoders but kept separate here so each
// mechanism can be inspected in isolation.
function computeStrategy(strategy, T, k, p) {
  if (strategy === 'greedy') {
    const probs = TOKENS.map((_, i) => (i === ARGMAX_INDEX ? 1 : 0));
    return { probs, eligible: new Set([ARGMAX_INDEX]) };
  }
  if (strategy === 'temperature') {
    const probs = softmax(LOGITS, T);
    return { probs, eligible: new Set(TOKENS.map((_, i) => i)) };
  }
  if (strategy === 'topk') {
    const kept = ORDER.slice(0, k);
    const eligible = new Set(kept);
    const total = kept.reduce((s, i) => s + BASE_PROBS[i], 0);
    const probs = TOKENS.map((_, i) => (eligible.has(i) ? BASE_PROBS[i] / total : 0));
    return { probs, eligible };
  }
  // top-p (nucleus): smallest prefix of the sorted distribution whose
  // cumulative probability reaches p.
  const eligible = new Set();
  let cum = 0;
  for (const i of ORDER) {
    eligible.add(i);
    cum += BASE_PROBS[i];
    if (cum >= p) break;
  }
  const total = [...eligible].reduce((s, i) => s + BASE_PROBS[i], 0);
  const probs = TOKENS.map((_, i) => (eligible.has(i) ? BASE_PROBS[i] / total : 0));
  return { probs, eligible };
}

// Inverse-CDF categorical sampling from a seeded uniform draw.
function sampleCategorical(rng, probs) {
  const u = rng();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (u < cum) return i;
  }
  // Floating-point fallback: land on the last nonzero-probability token
  // rather than an excluded one.
  for (let i = probs.length - 1; i >= 0; i--) {
    if (probs[i] > 0) return i;
  }
  return probs.length - 1;
}

function strategyBlurb(strategy, T, k, p, eligibleCount, retainedMass) {
  const pct = (retainedMass * 100).toFixed(1);
  if (strategy === 'greedy') {
    return `Always emits the single highest-probability token ("${TOKENS[ARGMAX_INDEX]}"). Deterministic — same distribution, same output, every time.`;
  }
  if (strategy === 'temperature') {
    const shape = T < 0.9 ? 'sharpened toward the top token' : T > 1.1 ? 'flattened toward uniform' : 'close to the base distribution';
    return `Samples from softmax(logits / T). At T = ${T.toFixed(2)}, all ${N} tokens stay reachable, but the distribution is ${shape}.`;
  }
  if (strategy === 'topk') {
    return `Keeps only the ${k} highest-probability token${k === 1 ? '' : 's'}, renormalizes, and samples from that truncated set — ${pct}% of the original probability mass.`;
  }
  return `Keeps the smallest high-to-low prefix whose cumulative probability reaches p = ${p.toFixed(2)}. Here that's ${eligibleCount} token${eligibleCount === 1 ? '' : 's'}, carrying ${pct}% of the mass.`;
}

// ── Small shared UI pieces ──────────────────────────────────────────────────────
function SliderRow({ label, min, max, step, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontFamily: mono, fontSize: '11px', color: C.mid, minWidth: '150px', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: C.accent, cursor: 'pointer' }}
      />
    </div>
  );
}

const tabBase = {
  fontFamily: mono, fontSize: '11px', padding: '5px 12px', borderRadius: '4px',
  cursor: 'pointer', border: `1px solid ${C.border}`, background: C.bg4, color: C.mid,
  transition: 'border-color 150ms, background 150ms, color 150ms',
};
const tabActive = { ...tabBase, background: C.accentDim, color: C.accent, borderColor: C.accent };

const btnBase = {
  fontFamily: mono, fontSize: '11px', padding: '5px 12px', borderRadius: '4px',
  cursor: 'pointer', border: `1px solid ${C.border}`, background: C.bg2, color: C.text,
};
const btnDisabled = { ...btnBase, cursor: 'not-allowed', opacity: 0.4 };

const noteStyle = {
  fontFamily: "'Inter', sans-serif", fontSize: '11.5px', fontStyle: 'italic',
  color: C.muted, lineHeight: 1.5,
};

const STRATEGIES = [
  { id: 'greedy',      label: 'Greedy' },
  { id: 'temperature', label: 'Temperature' },
  { id: 'topk',         label: 'Top-k' },
  { id: 'topp',         label: 'Top-p (nucleus)' },
];

// ── Probability chart: base (reference) bar behind, effective (strategy) bar in front ──
function ProbabilityChart({ probs, eligible, currentPick }) {
  return (
    <div style={{ minWidth: '560px' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${BAR_H}px`,
        padding: '18px 4px 0', borderBottom: `1px solid ${C.border}`,
      }}>
        {ORDER.map(i => {
          const isElig = eligible.has(i);
          const refH = Math.max(1, (BASE_PROBS[i] / CHART_MAX) * BAR_H);
          const fgH = Math.max(0, (probs[i] / CHART_MAX) * BAR_H);
          const isPick = currentPick === i;
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isPick && (
                <div style={{ position: 'absolute', top: '-16px', fontSize: '11px', color: C.accent }}>▼</div>
              )}
              <div style={{
                position: 'relative', width: '70%', maxWidth: '34px', height: `${BAR_H}px`,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}>
                {/* reference: base (T=1) probability — always shown, faint */}
                <div style={{
                  position: 'absolute', bottom: 0, width: '100%', height: `${refH}px`,
                  background: C.bg4, border: `1px solid ${C.borderLt}`, borderRadius: '2px 2px 0 0',
                }} />
                {/* effective: probability actually used to sample under the current strategy */}
                <div style={{
                  position: 'absolute', bottom: 0, width: '58%', height: `${fgH}px`,
                  background: isElig ? C.accent : 'transparent', opacity: isElig ? 0.85 : 0,
                  borderRadius: '2px 2px 0 0', transition: 'height 150ms',
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '4px', padding: '5px 4px 0' }}>
        {ORDER.map(i => (
          <div key={i} style={{
            flex: 1, minWidth: 0, textAlign: 'center', fontFamily: mono, fontSize: '9.5px',
            color: eligible.has(i) ? C.text : C.muted,
          }}>
            {TOKENS[i]}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '4px', padding: '2px 4px 0' }}>
        {ORDER.map(i => (
          <div key={i} style={{
            flex: 1, minWidth: 0, textAlign: 'center', fontFamily: mono, fontSize: '8.5px',
            color: C.muted,
          }}>
            {(BASE_PROBS[i] * 100).toFixed(1)}%
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontFamily: mono, fontSize: '9.5px', color: C.muted }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 10, height: 8, background: C.bg4, border: `1px solid ${C.borderLt}`, display: 'inline-block' }} />
          base probability (T=1, reference)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 10, height: 8, background: C.accent, opacity: 0.85, display: 'inline-block' }} />
          probability under current strategy
        </span>
      </div>
    </div>
  );
}

// ── Histogram chart: empirical draw frequency vs. theoretical probability tick ──
function HistogramChart({ counts, totalDraws, probs }) {
  const freqs = ORDER.map(i => (totalDraws > 0 ? counts[i] / totalDraws : 0));
  const histMax = Math.max(0.05, ...ORDER.map(i => probs[i]), ...freqs) * 1.2;

  return (
    <div style={{ minWidth: '560px' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${BAR_H}px`,
        padding: '18px 4px 0', borderBottom: `1px solid ${C.border}`,
      }}>
        {ORDER.map((i, col) => {
          const freqH = Math.max(0, (freqs[col] / histMax) * BAR_H);
          const tickH = Math.max(0, (probs[i] / histMax) * BAR_H);
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                position: 'relative', width: '70%', maxWidth: '34px', height: `${BAR_H}px`,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}>
                <div style={{
                  position: 'absolute', bottom: 0, width: '58%', height: `${freqH}px`,
                  background: C.orange, opacity: 0.85, borderRadius: '2px 2px 0 0',
                  transition: 'height 150ms',
                }} />
                {/* theoretical target tick — where the bar should converge to as draws grow */}
                <div style={{
                  position: 'absolute', bottom: `${tickH}px`, width: '100%', height: '2px',
                  background: C.math,
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '4px', padding: '5px 4px 0' }}>
        {ORDER.map(i => (
          <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontFamily: mono, fontSize: '9.5px', color: C.text }}>
            {TOKENS[i]}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '4px', padding: '2px 4px 0' }}>
        {ORDER.map((i, col) => (
          <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontFamily: mono, fontSize: '8.5px', color: C.muted }}>
            {totalDraws > 0 ? `${(freqs[col] * 100).toFixed(1)}%` : '—'}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontFamily: mono, fontSize: '9.5px', color: C.muted }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 10, height: 8, background: C.orange, opacity: 0.85, display: 'inline-block' }} />
          empirical frequency ({totalDraws} draw{totalDraws === 1 ? '' : 's'})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 10, height: 2, background: C.math, display: 'inline-block' }} />
          theoretical probability (target)
        </span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SamplingPlayground({ tryThis }) {
  const [strategy, setStrategy] = useState('temperature');
  const [T, setT] = useState(1.0);
  const [k, setK] = useState(3);
  const [p, setP] = useState(0.9);

  const [counts, setCounts] = useState(() => new Array(N).fill(0));
  const [totalDraws, setTotalDraws] = useState(0);
  const [lastPick, setLastPick] = useState(null);

  const rngRef = useRef(null);
  if (rngRef.current === null) {
    // Lazy first-mount init: same idea as useState(() => ...), just for a
    // ref — the PRNG object itself never needs to trigger a re-render.
    rngRef.current = mulberry32(makeSeed(1 /* 'temperature' */, T, k, p));
  }

  const { probs, eligible } = useMemo(() => computeStrategy(strategy, T, k, p), [strategy, T, k, p]);

  const strategyIndex = strategy === 'greedy' ? 0 : strategy === 'temperature' ? 1 : strategy === 'topk' ? 2 : 3;

  // Every distinct (strategy, T, k, p) combination gets a fresh, deterministic
  // seed — the same slider position always reseeds the same sample stream and
  // clears counts, since stale counts would describe a distribution that no
  // longer matches the sliders (the "no numbers that contradict the prose" rule).
  // Called directly from the setters below rather than from an effect, so a
  // slider drag never causes an extra cascading render.
  function resetSamplingFor(nextStrategyIndex, nextT, nextK, nextP) {
    setCounts(new Array(N).fill(0));
    setTotalDraws(0);
    setLastPick(null);
    rngRef.current = mulberry32(makeSeed(nextStrategyIndex, nextT, nextK, nextP));
  }

  function handleStrategy(id) {
    setStrategy(id);
    const idx = id === 'greedy' ? 0 : id === 'temperature' ? 1 : id === 'topk' ? 2 : 3;
    resetSamplingFor(idx, T, k, p);
  }
  function handleT(v) { setT(v); resetSamplingFor(strategyIndex, v, k, p); }
  function handleK(v) { setK(v); resetSamplingFor(strategyIndex, T, v, p); }
  function handleP(v) { setP(v); resetSamplingFor(strategyIndex, T, k, v); }
  function handleReset() { resetSamplingFor(strategyIndex, T, k, p); }

  function drawSamples(n) {
    if (strategy === 'greedy' || !rngRef.current) return;
    const rng = rngRef.current;
    const localCounts = new Array(N).fill(0);
    let last = null;
    for (let i = 0; i < n; i++) {
      const idx = sampleCategorical(rng, probs);
      localCounts[idx] += 1;
      last = idx;
    }
    setCounts(prev => prev.map((c, i) => c + localCounts[i]));
    setTotalDraws(td => td + n);
    setLastPick(last);
  }

  const currentPick = strategy === 'greedy' ? ARGMAX_INDEX : lastPick;
  const retainedMass = [...eligible].reduce((s, i) => s + BASE_PROBS[i], 0);

  return (
    <WidgetCard
      title="Sampling Playground — decoding strategies on a toy next-token distribution"
      number="14.2"
      tryThis={tryThis}
    >
      {/* Toy prompt / distribution disclosure */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{
          fontFamily: mono, fontSize: '10px', color: C.muted, marginBottom: '4px',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Illustrative toy distribution — not a real model
        </div>
        <div style={{
          fontFamily: mono, fontSize: '13px', color: C.text, background: C.codeBg,
          border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px',
        }}>
          "{PROMPT} <span style={{ color: C.accent }}>___</span>"
        </div>
        <div style={{ ...noteStyle, marginTop: '6px' }}>
          A fixed distribution over {N} candidate next tokens, hand-picked to look like a
          plausible LLM output (one clear favorite, a mid-probability shoulder, a long thin
          tail) — not sampled from any real model.
        </div>
      </div>

      {/* Strategy tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {STRATEGIES.map(s => (
          <button
            key={s.id}
            onClick={() => handleStrategy(s.id)}
            style={s.id === strategy ? tabActive : tabBase}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Parameter control */}
      <div style={{ marginBottom: '10px' }}>
        {strategy === 'greedy' && (
          <div style={noteStyle}>
            Greedy decoding always takes the single highest-probability token. No parameter,
            no randomness — it's the leftmost bar below, every time.
          </div>
        )}
        {strategy === 'temperature' && (
          <SliderRow label={`Temperature T = ${T.toFixed(2)}`} min={0.1} max={2.5} step={0.05} value={T} onChange={handleT} />
        )}
        {strategy === 'topk' && (
          <SliderRow label={`k = ${k}`} min={1} max={N} step={1} value={k} onChange={v => handleK(Math.round(v))} />
        )}
        {strategy === 'topp' && (
          <SliderRow label={`p = ${p.toFixed(2)}`} min={0.05} max={1.0} step={0.01} value={p} onChange={handleP} />
        )}
      </div>

      <div style={{ ...noteStyle, marginBottom: '14px' }}>
        {strategyBlurb(strategy, T, k, p, eligible.size, retainedMass)}
      </div>

      {/* Probability chart */}
      <div style={{ overflowX: 'auto' }}>
        <ProbabilityChart probs={probs} eligible={eligible} currentPick={currentPick} />
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '14px',
        padding: '10px 14px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px',
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted, marginBottom: '2px' }}>Eligible tokens</div>
          <div style={{ fontFamily: mono, fontSize: '13px', color: C.text }}>{eligible.size} / {N}</div>
        </div>
        <div>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted, marginBottom: '2px' }}>Retained probability mass</div>
          <div style={{ fontFamily: mono, fontSize: '13px', color: C.accent }}>{(retainedMass * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted, marginBottom: '2px' }}>Current pick</div>
          <div style={{ fontFamily: mono, fontSize: '13px', color: C.text }}>
            {currentPick === null ? '— (draw a sample)' : `"${TOKENS[currentPick]}"`}
          </div>
        </div>
      </div>

      {/* Draw controls */}
      <div style={{
        display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
        marginTop: '16px', marginBottom: '10px',
      }}>
        <span style={{ fontFamily: mono, fontSize: '11px', color: C.muted }}>Draw samples</span>
        <button disabled={strategy === 'greedy'} onClick={() => drawSamples(1)} style={strategy === 'greedy' ? btnDisabled : btnBase}>Draw 1</button>
        <button disabled={strategy === 'greedy'} onClick={() => drawSamples(25)} style={strategy === 'greedy' ? btnDisabled : btnBase}>Draw 25</button>
        <button disabled={strategy === 'greedy'} onClick={() => drawSamples(500)} style={strategy === 'greedy' ? btnDisabled : btnBase}>Draw 500</button>
        <button onClick={handleReset} style={btnBase}>↺ Reset</button>
        <span style={{ fontFamily: mono, fontSize: '11px', color: C.muted, marginLeft: 'auto' }}>
          {totalDraws} draw{totalDraws === 1 ? '' : 's'} so far
        </span>
      </div>

      {/* Histogram */}
      {strategy === 'greedy' ? (
        <div style={noteStyle}>
          Greedy is deterministic — every draw returns "{TOKENS[ARGMAX_INDEX]}". There is no
          distribution to build a histogram from; switch strategy to sample.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <HistogramChart counts={counts} totalDraws={totalDraws} probs={probs} />
        </div>
      )}
    </WidgetCard>
  );
}
