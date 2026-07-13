import { useState, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Inter', sans-serif";

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  border:    '#242424',
  codeBg:    '#0a0a0a',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  text:      '#e8eaed',
  mid:       '#888888',
  muted:     '#555555',
};

// ── The training corpus ────────────────────────────────────────────────────
// A tiny toy corpus, on purpose: small enough to trace by hand, large enough
// to have a real winner (and real ties) at every step.
const END = '_'; // end-of-word marker — keeps "low" (a whole word) distinct
                 // from "low" as a prefix of "lower", the same way real BPE
                 // implementations mark word boundaries before merging.

const CORPUS = [
  { word: 'low',    freq: 5 },
  { word: 'lower',  freq: 2 },
  { word: 'newest', freq: 6 },
  { word: 'widest', freq: 3 },
];

// ── Real BPE — every function below is the actual algorithm, not a stand-in ─

function initialWords() {
  return CORPUS.map(w => [...w.word.split(''), END]);
}

// Count every adjacent symbol pair across the corpus, weighted by word
// frequency. A Map preserves insertion order, so pairs are recorded in the
// order they're first encountered scanning the corpus left to right — this
// is what makes tie-breaking below deterministic and reproducible.
function countPairs(words, freqs) {
  const counts = new Map();
  words.forEach((tokens, wi) => {
    const f = freqs[wi];
    for (let i = 0; i < tokens.length - 1; i++) {
      const key = `${tokens[i]}|${tokens[i + 1]}`;
      counts.set(key, (counts.get(key) || 0) + f);
    }
  });
  return counts;
}

// Merge every non-overlapping occurrence of (a, b) into a single new token,
// left to right, in one word.
function mergePairInSeq(tokens, a, b) {
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
      out.push(a + b);
      i += 2;
    } else {
      out.push(tokens[i]);
      i += 1;
    }
  }
  return out;
}

function mergeInAllWords(words, a, b) {
  return words.map(tokens => mergePairInSeq(tokens, a, b));
}

// Precompute the full merge trace once, at module load. Every count, every
// merge order, and every resulting token below is the actual output of
// running this algorithm on the corpus above — nothing here is a scripted
// sequence standing in for the computation.
function computeTrace() {
  let words = initialWords();
  const freqs = CORPUS.map(w => w.freq);
  const trace = [];
  for (let iter = 0; iter < 40; iter++) {
    const counts = countPairs(words, freqs);
    if (counts.size === 0) break;
    // Sort by count descending. Array.prototype.sort is stable (ES2019+),
    // so pairs that tie on count keep the first-encountered order they had
    // in the Map — that's the tie-break rule, applied mechanically rather
    // than picked by hand.
    const sortedPairs = [...counts.entries()]
      .map(([key, count]) => {
        const [a, b] = key.split('|');
        return { a, b, count };
      })
      .sort((p, q) => q.count - p.count);
    const winner = sortedPairs[0];
    const wordsAfter = mergeInAllWords(words, winner.a, winner.b);
    trace.push({
      a: winner.a,
      b: winner.b,
      merged: winner.a + winner.b,
      count: winner.count,
      pairTable: sortedPairs,
      wordsAfter,
    });
    words = wordsAfter;
  }
  return trace;
}

const TRACE          = computeTrace();
const MAX_STEPS       = TRACE.length;
const INITIAL_WORDS   = initialWords();
const BASE_VOCAB      = [...new Set(INITIAL_WORDS.flat())].sort();

function wordsAtStep(step) {
  return step === 0 ? INITIAL_WORDS : TRACE[step - 1].wordsAfter;
}

// Apply a list of learned merges, in the order they were learned, to any
// string — this is exactly how a trained BPE tokenizer encodes new text.
function bpeEncode(word, merges) {
  let tokens = [...word.split(''), END];
  for (const { a, b } of merges) tokens = mergePairInSeq(tokens, a, b);
  return tokens;
}

const SAMPLE_PRESETS = [
  { word: 'widest', note: 'in corpus' },
  { word: 'lowest', note: 'unseen' },
  { word: 'slower', note: 'unseen' },
  { word: 'newer',  note: 'unseen' },
];

// ── Small display helpers ───────────────────────────────────────────────────

function TokenPill({ text, kind }) {
  const kindStyle = {
    base:   { color: C.mid,    border: `1px solid ${C.border}`, background: 'transparent' },
    merged: { color: C.accent, border: `1px solid ${C.accent}`, background: `${C.accent}1a` },
    fresh:  { color: C.green,  border: `1px solid ${C.green}`,  background: `${C.green}26` },
    next:   { color: C.math,   border: `1px solid ${C.math}`,   background: `${C.math}26` },
  }[kind] || { color: C.mid, border: `1px solid ${C.border}` };

  return (
    <span style={{
      fontFamily: MONO, fontSize: '11px', padding: '3px 7px', borderRadius: '5px',
      display: 'inline-block', lineHeight: 1.2, ...kindStyle,
    }}>
      {text}
    </span>
  );
}

function classifyToken(tokens, i, next, freshToken) {
  const tok = tokens[i];
  if (next && (
    (tokens[i] === next.a && tokens[i + 1] === next.b) ||
    (i > 0 && tokens[i - 1] === next.a && tok === next.b)
  )) return 'next';
  if (freshToken && tok === freshToken) return 'fresh';
  return tok.length > 1 ? 'merged' : 'base';
}

function StatCell({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: '8.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: '13px', color: color || C.accent }}>
        {value}
      </div>
    </div>
  );
}

function btnStyle(disabled) {
  return {
    fontFamily: MONO, fontSize: '11px', cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? C.muted : C.accent,
    background: disabled ? 'transparent' : C.accentDim,
    border: `1px solid ${disabled ? C.border : C.accent}`,
    borderRadius: '5px', padding: '6px 13px', opacity: disabled ? 0.5 : 1,
  };
}

// ── Main component ──────────────────────────────────────────────────────────

export default function BPEMerges({ tryThis }) {
  const [step, setStep]             = useState(0);
  const [sampleWord, setSampleWord] = useState('lowest');

  const wordsNow    = wordsAtStep(step);
  const next        = step < MAX_STEPS ? TRACE[step] : null;
  const freshToken  = step > 0 ? TRACE[step - 1].merged : null;
  const vocabSize   = BASE_VOCAB.length + step;

  const mergesSoFar = useMemo(
    () => TRACE.slice(0, step).map(t => ({ a: t.a, b: t.b })),
    [step]
  );

  const cleanSample = sampleWord.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14);
  const encoded = useMemo(
    () => (cleanSample ? bpeEncode(cleanSample, mergesSoFar) : []),
    [cleanSample, mergesSoFar]
  );
  const sampleInCorpus = CORPUS.some(w => w.word === cleanSample);

  const topPairs  = next ? next.pairTable.slice(0, 8) : [];
  const maxCount  = topPairs.length ? topPairs[0].count : 1;
  const morePairs = next ? Math.max(0, next.pairTable.length - topPairs.length) : 0;

  return (
    <WidgetCard title="Byte-Pair Encoding — building a vocabulary one merge at a time" number="7.6" tryThis={tryThis}>

      {/* ── Training corpus ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{ fontFamily: SANS, fontSize: '11px', color: C.text, marginBottom: '2px' }}>
          Training corpus
        </div>
        <div style={{ fontFamily: SANS, fontSize: '9.5px', color: C.muted, marginBottom: '8px' }}>
          Each word is split into characters plus an end-of-word marker <code style={{ color: C.mid }}>_</code>.
          {next
            ? <> The pair about to merge is highlighted in <span style={{ color: C.math }}>amber</span>.</>
            : ' Every word has fully merged into a single whole-word token.'}
        </div>
      </div>

      <div style={{ background: C.codeBg, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '10px 14px' }}>
        {CORPUS.map((w, wi) => (
          <div key={w.word} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '5px 0', borderBottom: wi < CORPUS.length - 1 ? `1px solid ${C.border}` : 'none',
          }}>
            <span style={{ fontFamily: MONO, fontSize: '10px', color: C.muted, width: '44px', flexShrink: 0 }}>
              {w.word} ×{w.freq}
            </span>
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {wordsNow[wi].map((tok, i) => (
                <TokenPill key={i} text={tok} kind={classifyToken(wordsNow[wi], i, next, freshToken)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Vocabulary ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontFamily: MONO, fontSize: '8.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
          Vocabulary — {BASE_VOCAB.length} base symbols + {step} merged = {vocabSize} tokens
        </div>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {BASE_VOCAB.map(t => <TokenPill key={t} text={t} kind="base" />)}
          {TRACE.slice(0, step).map((t, i) => (
            <TokenPill key={t.merged + i} text={t.merged} kind={i === step - 1 ? 'fresh' : 'merged'} />
          ))}
        </div>
      </div>

      {/* ── Pair-frequency table ─────────────────────────────────────────── */}
      <div style={{ marginTop: '14px', background: C.bg3, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '10px 14px' }}>
        <div style={{ fontFamily: MONO, fontSize: '8.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          Adjacent-pair frequencies {next ? `(top ${topPairs.length}${morePairs ? ` of ${next.pairTable.length}` : ''})` : ''}
        </div>

        {next ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {topPairs.map((p, i) => {
              const isWinner = i === 0;
              return (
                <div key={`${p.a}|${p.b}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: MONO, fontSize: '10px', width: '78px', flexShrink: 0,
                    color: isWinner ? C.math : C.mid,
                  }}>
                    ({p.a}, {p.b})
                  </span>
                  <div style={{ flex: 1, height: '10px', background: C.codeBg, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(p.count / maxCount) * 100}%`,
                      background: isWinner ? C.math : C.accent, opacity: isWinner ? 1 : 0.55,
                      transition: 'width 0.2s ease',
                    }} />
                  </div>
                  <span style={{
                    fontFamily: MONO, fontSize: '10px', width: '20px', textAlign: 'right', flexShrink: 0,
                    color: isWinner ? C.math : C.mid,
                  }}>
                    {p.count}
                  </span>
                </div>
              );
            })}
            {morePairs > 0 && (
              <div style={{ fontFamily: MONO, fontSize: '9px', color: C.muted, marginTop: '2px' }}>
                + {morePairs} more pair{morePairs === 1 ? '' : 's'} not shown
              </div>
            )}
            <div style={{ fontFamily: SANS, fontSize: '10px', color: C.math, marginTop: '6px' }}>
              Next merge: ({next.a}, {next.b}) → "{next.merged}", count = {next.count}
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: SANS, fontSize: '10px', color: C.muted }}>
            No adjacent pairs remain — nothing left to merge.
          </div>
        )}
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px',
      }}>
        <button onClick={() => setStep(0)} disabled={step === 0} style={btnStyle(step === 0)}>
          ↺ Reset
        </button>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={btnStyle(step === 0)}>
          ◂ Undo
        </button>
        <button onClick={() => setStep(s => Math.min(MAX_STEPS, s + 1))} disabled={!next} style={btnStyle(!next)}>
          Merge next pair ▸
        </button>
        <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />
        <span style={{ fontFamily: MONO, fontSize: '10.5px', color: C.mid }}>
          step <span style={{ color: C.accent }}>{step}</span> / {MAX_STEPS}
        </span>
      </div>

      {/* ── Sample-word tokenization ──────────────────────────────────────── */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontFamily: SANS, fontSize: '11px', color: C.text, marginBottom: '8px' }}>
          Tokenize a word with the merges learned so far
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {SAMPLE_PRESETS.map(p => (
            <button key={p.word} onClick={() => setSampleWord(p.word)} style={{
              fontFamily: MONO, fontSize: '10px', cursor: 'pointer',
              padding: '4px 10px', borderRadius: '12px',
              background: cleanSample === p.word ? `${C.accent}20` : 'transparent',
              border: `1px solid ${cleanSample === p.word ? C.accent : C.border}`,
              color: cleanSample === p.word ? C.accent : C.mid,
            }}>
              {p.word} <span style={{ color: C.muted }}>· {p.note}</span>
            </button>
          ))}
          <input
            type="text"
            value={sampleWord}
            placeholder="type a word…"
            maxLength={14}
            onChange={e => setSampleWord(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 14))}
            style={{
              width: '110px', boxSizing: 'border-box',
              background: C.bg4, border: `1px solid ${C.border}`,
              borderRadius: '4px', padding: '4px 9px',
              fontFamily: MONO, fontSize: '11px', color: C.text, outline: 'none',
            }}
          />
        </div>

        <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '10px 14px' }}>
          {cleanSample ? (
            <>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {encoded.map((tok, i) => (
                  <TokenPill key={i} text={tok} kind={tok.length > 1 ? 'merged' : 'base'} />
                ))}
              </div>
              <div style={{ fontFamily: SANS, fontSize: '9.5px', color: C.muted, lineHeight: 1.4 }}>
                {encoded.length} token{encoded.length === 1 ? '' : 's'}
                {sampleInCorpus ? ' — this word is in the training corpus.' : ' — never seen during training; built from learned pieces.'}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: MONO, fontSize: '10px', color: C.muted }}>Type a word above.</div>
          )}
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <div style={{
        marginTop: '12px', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap',
        background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 16px',
      }}>
        <StatCell label="vocab size"  value={vocabSize} />
        <StatCell label="merges done" value={step} />
        <StatCell label="next pair"   value={next ? `(${next.a},${next.b})=${next.count}` : '—'} color={next ? C.math : C.muted} />
        <StatCell label="sample tokens" value={cleanSample ? encoded.length : '—'} />
      </div>

    </WidgetCard>
  );
}
