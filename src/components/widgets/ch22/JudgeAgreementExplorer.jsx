import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";
const PAIRS = [
  { quality: 0.18, length: 0.45, first: 'A' }, { quality: -0.10, length: 0.25, first: 'A' },
  { quality: 0.05, length: 0.60, first: 'A' }, { quality: -0.22, length: 0.30, first: 'B' },
  { quality: 0.14, length: 0.20, first: 'A' }, { quality: -0.08, length: 0.45, first: 'B' },
];

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function elo(winsA, count) {
  if (!count) return 1000;
  const p = Math.min(.99, Math.max(.01, winsA / count));
  return 1000 + 400 * Math.log10(p / (1 - p));
}

export default function JudgeAgreementExplorer({ tryThis }) {
  const [position, setPosition] = useState(0);
  const [verbosity, setVerbosity] = useState(0);
  const results = useMemo(() => PAIRS.map(pair => {
    const positionTerm = pair.first === 'A' ? position : -position;
    const lengthTerm = verbosity * pair.length;
    const judgeMargin = pair.quality + positionTerm + lengthTerm;
    const probabilityA = sigmoid(judgeMargin);
    return { ...pair, judgeMargin, probabilityA, humanA: pair.quality >= 0 };
  }), [position, verbosity]);
  const expectedAgreement = results.reduce((sum, result) => sum + (result.humanA ? result.probabilityA : 1 - result.probabilityA), 0) / results.length;
  const expectedWinsA = results.reduce((sum, result) => sum + result.probabilityA, 0);

  return <WidgetCard title="Judge agreement is a measurement model" number="22.3" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      Six synthetic pairwise comparisons have fixed quality margins. For each row, the judge probability is σ(quality + position term + length term). The aggregate is an expected win rate, not sampled outcomes. These synthetic bias terms make the scoring assumption inspectable.
    </p>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 14 }}>
      first-position bias = {position > 0 ? '+' : ''}{position.toFixed(2)} log-odds
      <input aria-label="First position bias" type="range" min="-1" max="1" step="0.05" value={position} onChange={e => setPosition(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 18 }}>
      length coefficient = {verbosity > 0 ? '+' : ''}{verbosity.toFixed(2)} log-odds
      <input aria-label="Length coefficient" type="range" min="-1" max="1" step="0.05" value={verbosity} onChange={e => setVerbosity(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
      <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--code-bg)' }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>PAIRWISE OUTCOMES</div>
        {results.map((r, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', padding: '4px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}><span>pair {i + 1} · first {r.first}</span><span>human {r.humanA ? 'A' : 'B'} / P(A) <span style={{ color: 'var(--accent)' }}>{r.probabilityA.toFixed(2)}</span></span></div>)}
      </div>
      <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--code-bg)' }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>EXPECTED AGGREGATE</div>
        <div style={{ fontFamily: mono, fontSize: 16, color: 'var(--accent)', marginBottom: 8 }}>expected agreement {(expectedAgreement * 100).toFixed(0)}%</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 8 }}>expected A win rate <span style={{ color: 'var(--accent)' }}>{(expectedWinsA / results.length * 100).toFixed(0)}%</span></div>
        <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text)' }}>Elo-style A rating <span style={{ color: 'var(--purple)' }}>{elo(expectedWinsA, results.length).toFixed(0)}</span></div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: 1.5, color: 'var(--text-muted)', marginTop: 12 }}>This maps the model-implied expected A win rate through a logistic Elo scale. It is not an observed sample or a fitted human-preference rating.</div>
      </div>
    </div>
  </WidgetCard>;
}
