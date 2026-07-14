import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── PRNG (mulberry32 — house convention, see ch20/ForwardDiffusion.jsx) ───────
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  bg2:       '#111111',
  bg3:       '#161616',
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
  purple:    '#a78bfa',
  codeBg:    '#0a0a0a',
};
const mono  = "'JetBrains Mono', monospace";
const inter = "'Inter', sans-serif";

const K_MIN = 1, K_MAX = 8;
const P_MIN = 0.05, P_MAX = 0.95;
const TD_MIN = 2, TD_MAX = 16;
const TT_MIN = 15, TT_MAX = 60;
const DEFAULT_SEED = 7;

/* ───────────────────────────────────────────────────────────
   Core simulation — one round of speculative decoding
   ───────────────────────────────────────────────────────────
   The draft model always proposes k tokens up front (it doesn't know the
   verification outcome while drafting), so k rng() draws are consumed every
   round regardless of where the first rejection lands. The target model
   verifies all k positions in one parallel pass: everything before the first
   rejected draft is kept, the rejected position is overwritten with the
   target's own (correct) token, and anything drafted after it is discarded
   unused. If every draft token is accepted, the same verification pass also
   yields one "bonus" token sampled from the target's distribution at
   position k+1 — a free token, since the target already computed that
   distribution while checking position k. */
function simulateRound(rng, k, p) {
  const draws = [];
  for (let i = 0; i < k; i++) draws.push(rng());
  let rejectedAt = -1;
  for (let i = 0; i < k; i++) {
    if (draws[i] >= p) { rejectedAt = i; break; }
  }
  const slots = draws.map((d, i) => {
    if (rejectedAt === -1 || i < rejectedAt) return { type: 'accept', draw: d };
    if (i === rejectedAt) return { type: 'correct', draw: d };
    return { type: 'discarded', draw: d };
  });
  let roundLength;
  if (rejectedAt === -1) {
    slots.push({ type: 'bonus' });
    roundLength = k + 1;
  } else {
    roundLength = rejectedAt + 1;
  }
  return { slots, roundLength };
}

// P(round produces exactly length j), j = 1..k+1 — closed form, for comparison
// against the empirical histogram built from actual simulated rounds.
function theoreticalLengthProbs(k, p) {
  const probs = [];
  for (let j = 1; j <= k; j++) probs.push(Math.pow(p, j - 1) * (1 - p));
  probs.push(Math.pow(p, k));
  return probs;
}

function expectedTokensPerRound(k, p) {
  if (p >= 0.999) return k + 1;
  return (1 - Math.pow(p, k + 1)) / (1 - p);
}

/* ─────────────────────────────────────────────────────────── */

function LabeledSlider({ label, value, onChange, min, max, step, format }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: mono, fontSize: 10.5, color: C.muted, width: 118, flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, minWidth: 60, accentColor: C.accent, cursor: 'pointer' }}
      />
      <span style={{ fontFamily: mono, fontSize: 11, color: C.text, width: 58, textAlign: 'right', flexShrink: 0 }}>
        {format ? format(value) : value}
      </span>
    </div>
  );
}

function Btn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: mono, fontSize: '10.5px', padding: '6px 12px',
      background: active ? C.accentDim : C.bg4,
      border: `1px solid ${active ? C.accent : (disabled ? C.border : C.borderLt)}`,
      borderRadius: '4px',
      color: disabled ? C.muted : (active ? C.accent : C.mid),
      cursor: disabled ? 'not-allowed' : 'pointer',
      flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

const SLOT_STYLE = {
  accept:    { bg: 'rgba(52,211,153,0.12)',  border: C.green,  text: C.green,  label: '✓',  sub: 'accept'    },
  correct:   { bg: 'rgba(251,146,60,0.14)',  border: C.orange, text: C.orange, label: '↺',  sub: 'corrected' },
  discarded: { bg: 'transparent',             border: C.border, text: C.muted,  label: '·',  sub: 'discarded' },
  bonus:     { bg: 'rgba(167,139,250,0.14)', border: C.purple, text: C.purple, label: '+1', sub: 'bonus'     },
};

function SlotChip({ slot, index }) {
  const cfg = SLOT_STYLE[slot.type];
  return (
    <div
      className={slot.type !== 'discarded' ? 'specrace-pop' : undefined}
      style={{
        width: 54, padding: '8px 4px', borderRadius: 6,
        background: cfg.bg, border: `1.5px solid ${cfg.border}`,
        textAlign: 'center', opacity: slot.type === 'discarded' ? 0.45 : 1,
        flexShrink: 0,
      }}
    >
      <div style={{ fontFamily: mono, fontSize: 15, color: cfg.text, fontWeight: 700, lineHeight: 1.2 }}>
        {cfg.label}
      </div>
      <div style={{ fontFamily: mono, fontSize: 8, color: cfg.text, marginTop: 2 }}>{cfg.sub}</div>
      <div style={{ fontFamily: mono, fontSize: 7, color: C.muted, marginTop: 2 }}>
        {slot.type === 'bonus' ? 'target' : `draft ${index + 1}`}
      </div>
    </div>
  );
}

function RoundSlots({ lastRound, k }) {
  if (!lastRound) {
    return (
      <div style={{
        fontFamily: mono, fontSize: 11, color: C.muted,
        padding: '18px 0', textAlign: 'center',
      }}>
        No rounds run yet — click "Run 1 round" below to draft and verify a round.
      </div>
    );
  }
  const { slots, roundLength } = lastRound;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {slots.map((s, i) => <SlotChip key={i} slot={s} index={i} />)}
      </div>
      <div style={{ marginTop: 8, fontFamily: mono, fontSize: 10.5, color: C.mid }}>
        Drafted {k} token{k === 1 ? '' : 's'} → kept <span style={{ color: C.accent }}>{roundLength}</span>{' '}
        {roundLength === k + 1
          ? '(every draft accepted, plus 1 bonus token sampled from the target)'
          : `(target rejected draft position ${roundLength}, supplied the correction, rest discarded)`}
      </div>
    </div>
  );
}

function LengthHistogram({ histogram, roundsRun, k, p }) {
  const theo = theoreticalLengthProbs(k, p);
  const empirical = histogram.map(c => (roundsRun > 0 ? c / roundsRun : 0));
  const maxFreq = Math.max(0.05, ...theo, ...empirical);
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 84 }}>
        {histogram.map((count, i) => {
          const empH = (empirical[i] / maxFreq) * 100;
          const theoH = (theo[i] / maxFreq) * 100;
          return (
            <div key={i} style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%', height: `${empH}%`,
                background: 'rgba(45,212,191,0.35)', border: `1px solid ${C.accent}`,
                borderRadius: '3px 3px 0 0', transition: 'height 0.2s ease-out',
              }} />
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: `${theoH}%`,
                height: 2, background: C.math,
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {histogram.map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: mono, fontSize: 8, color: C.muted }}>
            {i + 1}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, marginTop: 8 }}>
        <span style={{ color: C.accent }}>■</span> empirical — this run's {roundsRun} simulated round{roundsRun === 1 ? '' : 's'}
        {'   '}
        <span style={{ color: C.math }}>—</span> theoretical p^(j−1)(1−p), j = tokens kept this round
      </div>
    </div>
  );
}

function StatCell({ label, val, vc, note }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center', minWidth: 0 }}>
      <div style={{
        fontFamily: inter, fontSize: '8px', color: C.muted, textTransform: 'uppercase',
        letterSpacing: '0.06em', marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: '15px', color: vc || C.mid, fontWeight: 600, lineHeight: 1.2 }}>
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

function RaceBars({ specTokens, baselineTokens }) {
  const max = Math.max(specTokens, baselineTokens, 1);
  const rows = [
    { label: 'Speculative', value: specTokens, color: C.accent },
    { label: 'Baseline (same wall-clock)', value: baselineTokens, color: C.mid },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(r => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: C.mid, width: 168, flexShrink: 0 }}>
            {r.label}
          </span>
          <div style={{ flex: 1, background: C.codeBg, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden', height: 16 }}>
            <div style={{
              width: `${(r.value / max) * 100}%`, height: '100%',
              background: r.color, opacity: 0.85, transition: 'width 0.2s ease-out',
            }} />
          </div>
          <span style={{ fontFamily: mono, fontSize: 11, color: r.color, width: 70, textAlign: 'right', flexShrink: 0 }}>
            {r.value.toFixed(1)} tok
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

export default function SpeculativeRace({ tryThis }) {
  const [k, setK]           = useState(4);
  const [p, setP]           = useState(0.7);
  const [tDraft, setTDraft] = useState(6);
  const [tTarget, setTTarget] = useState(30);
  const [seed, setSeed]     = useState(DEFAULT_SEED);

  const rngRef = useRef(mulberry32(DEFAULT_SEED));

  const [roundsRun, setRoundsRun]     = useState(0);
  const [specTokens, setSpecTokens]   = useState(0);
  const [histogram, setHistogram]     = useState(() => new Array(4 + 1).fill(0));
  const [lastRound, setLastRound]     = useState(null);

  // Resimulating from scratch whenever k, p, or seed change keeps the
  // accumulated histogram/tokens honest: mixing rounds simulated under a
  // different k or p into the same statistics would misrepresent both.
  // Draft/target timing (tDraft, tTarget) do NOT trigger a reset — round
  // cost is a fixed k·t_draft + t_target regardless of outcome, so the
  // elapsed-time and throughput figures below simply recompute live from
  // roundsRun without needing to redraw any random outcomes.
  useEffect(() => {
    rngRef.current = mulberry32(seed);
    setRoundsRun(0);
    setSpecTokens(0);
    setHistogram(new Array(k + 1).fill(0));
    setLastRound(null);
  }, [k, p, seed]);

  const runRounds = useCallback((n) => {
    const rng = rngRef.current;
    let tokensAdd = 0;
    const histAdd = new Array(k + 1).fill(0);
    let last = null;
    for (let i = 0; i < n; i++) {
      const res = simulateRound(rng, k, p);
      tokensAdd += res.roundLength;
      histAdd[res.roundLength - 1] += 1;
      last = res;
    }
    setRoundsRun(r => r + n);
    setSpecTokens(t => t + tokensAdd);
    setHistogram(h => h.map((v, i) => v + histAdd[i]));
    setLastRound(last);
  }, [k, p]);

  const reset = useCallback(() => {
    rngRef.current = mulberry32(seed);
    setRoundsRun(0);
    setSpecTokens(0);
    setHistogram(new Array(k + 1).fill(0));
    setLastRound(null);
  }, [k, seed]);

  // ── Derived quantities — every number below is computed from either the
  // live accumulated simulation (roundsRun, specTokens, histogram) or a
  // closed-form expression over the same k, p, t_draft, t_target the reader
  // is controlling. Nothing here is a hard-coded result. ─────────────────
  const roundTimeMs       = k * tDraft + tTarget;
  const specTimeMs        = roundsRun * roundTimeMs;
  const specTimeSec       = specTimeMs / 1000;
  const specTokPerSec     = specTimeMs > 0 ? specTokens / specTimeSec : 0;
  const baselineTokPerSec = 1000 / tTarget;
  const baselineTokensInSameTime = specTimeMs > 0 ? specTimeMs / tTarget : 0;
  const empSpeedup        = roundsRun > 0 ? specTokPerSec / baselineTokPerSec : 0;

  const theoTokensPerRound = expectedTokensPerRound(k, p);
  const theoSpeedup        = theoTokensPerRound * tTarget / roundTimeMs;

  return (
    <WidgetCard
      title="Speculative Decoding Race — draft, verify in parallel, keep what survives"
      number="14.5"
      tryThis={tryThis}
    >
      <style>{`
        @keyframes specracePop {
          0%   { transform: scale(0.85); opacity: 0.4; }
          60%  { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        .specrace-pop { animation: specracePop 260ms ease-out; }
      `}</style>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px',
        background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '14px 16px', marginBottom: 14,
      }}>
        <LabeledSlider label="Draft tokens k" value={k} min={K_MIN} max={K_MAX} step={1}
          onChange={setK} format={v => `${v}`} />
        <LabeledSlider label="Accept prob. p" value={p} min={P_MIN} max={P_MAX} step={0.05}
          onChange={setP} format={v => v.toFixed(2)} />
        <LabeledSlider label="t_draft (ms/tok)" value={tDraft} min={TD_MIN} max={TD_MAX} step={1}
          onChange={setTDraft} format={v => `${v} ms`} />
        <LabeledSlider label="t_target (ms/pass)" value={tTarget} min={TT_MIN} max={TT_MAX} step={1}
          onChange={setTTarget} format={v => `${v} ms`} />
      </div>

      <p style={{ fontFamily: inter, fontSize: 11, color: C.muted, fontStyle: 'italic', margin: '0 0 14px' }}>
        p is an illustrative stand-in for how often the cheap draft model's guess matches what the
        target model would have produced — a real draft/target pair's agreement rate depends on the
        pair and the text. Verification cost is held fixed at t_target regardless of k: checking k+1
        positions in one parallel pass costs about the same as generating one token autoregressively,
        since decoding is bandwidth-bound rather than compute-bound at these scales. A very large k
        would eventually raise this cost; we keep it fixed here for clarity.
      </p>

      {/* ── Last round visualization ─────────────────────────────────── */}
      <div style={{
        background: C.codeBg, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '14px 16px', marginBottom: 14,
      }}>
        <div style={{ fontFamily: inter, fontSize: 11, color: C.mid, marginBottom: 10 }}>
          Most recent round
        </div>
        <RoundSlots lastRound={lastRound} k={k} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Btn onClick={() => runRounds(1)}>Run 1 round</Btn>
        <Btn onClick={() => runRounds(20)}>Run 20 rounds</Btn>
        <Btn onClick={() => runRounds(200)}>Run 200 rounds</Btn>
        <Btn onClick={reset}>↺ Reset</Btn>
        <Btn onClick={() => setSeed(s => s + 1)}>New seed ({seed})</Btn>
      </div>

      {/* ── Throughput race ──────────────────────────────────────────── */}
      <div style={{
        background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '14px 16px', marginBottom: 14,
      }}>
        <div style={{ fontFamily: inter, fontSize: 11, color: C.mid, marginBottom: 10 }}>
          Tokens produced in the same elapsed time — speculative vs. one-token-per-forward-pass baseline
        </div>
        <RaceBars specTokens={specTokens} baselineTokens={baselineTokensInSameTime} />
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', background: C.bg3, border: `1px solid ${C.border}`,
        borderRadius: '6px', overflow: 'hidden', marginBottom: 14, flexWrap: 'wrap',
      }}>
        <StatCell label="Rounds run" val={roundsRun} />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StatCell label="Round cost" val={`${roundTimeMs} ms`} note={`${k}×${tDraft} + ${tTarget}`} />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StatCell label="Spec. tok/s" val={roundsRun > 0 ? specTokPerSec.toFixed(1) : '—'} vc={C.accent} note="simulated" />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StatCell label="Baseline tok/s" val={baselineTokPerSec.toFixed(1)} vc={C.mid} note="1000 / t_target" />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StatCell label="Speedup (sim.)" val={roundsRun > 0 ? `${empSpeedup.toFixed(2)}×` : '—'} vc={C.math} />
        <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />
        <StatCell label="Speedup (theory)" val={`${theoSpeedup.toFixed(2)}×`} vc={C.math} note="converges as rounds → ∞" />
      </div>

      <div style={{
        fontFamily: mono, fontSize: 10.5, color: C.mid, textAlign: 'center', marginBottom: 16,
        background: C.codeBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px',
      }}>
        E[tokens / round] = (1 − p^(k+1)) / (1 − p) = {theoTokensPerRound.toFixed(2)} tokens,
        at k = {k}, p = {p.toFixed(2)}
      </div>

      {/* ── Round-length histogram ───────────────────────────────────── */}
      <div style={{
        background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px',
      }}>
        <div style={{ fontFamily: inter, fontSize: 11, color: C.mid, marginBottom: 10 }}>
          Distribution of tokens kept per round (j = 1 … k+1)
        </div>
        <LengthHistogram histogram={histogram} roundsRun={roundsRun} k={k} p={p} />
      </div>
    </WidgetCard>
  );
}
