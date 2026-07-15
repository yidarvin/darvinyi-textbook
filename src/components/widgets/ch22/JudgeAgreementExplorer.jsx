import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";
const PAIRS = [
  { human: 0.18, length: 260, first: 'A' }, { human: -0.10, length: -420, first: 'A' },
  { human: 0.05, length: 540, first: 'B' }, { human: -0.22, length: -180, first: 'B' },
  { human: 0.14, length: 120, first: 'A' }, { human: -0.08, length: 380, first: 'B' },
];

function elo(winsA, count) {
  if (!count) return 1000;
  const p = Math.min(.99, Math.max(.01, winsA / count));
  return 1000 + 400 * Math.log10(p / (1 - p));
}

export default function JudgeAgreementExplorer({ tryThis }) {
  const [position, setPosition] = useState(0);
  const [verbosity, setVerbosity] = useState(0);
  const results = useMemo(() => PAIRS.map(pair => {
    const positionTerm = pair.first === 'A' ? position / 100 : -position / 100;
    const judgeMargin = pair.human + positionTerm + (verbosity / 100) * pair.length / 600;
    return { ...pair, judgeMargin, humanA: pair.human >= 0, judgeA: judgeMargin >= 0 };
  }), [position, verbosity]);
  const agreement = results.filter(r => r.humanA === r.judgeA).length / results.length;
  const winsA = results.filter(r => r.judgeA).length;

  return <WidgetCard title="Judge agreement is a measurement model" number="22.3" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      Six synthetic pairwise comparisons have fixed human-quality margins. The simulated judge adds a first-position term and a response-length term before choosing a winner. These are not empirical bias estimates. They make the scoring assumption inspectable.
    </p>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 14 }}>
      first-position bias = {position > 0 ? '+' : ''}{position}
      <input aria-label="First position bias" type="range" min="-30" max="30" value={position} onChange={e => setPosition(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 18 }}>
      verbosity bias = {verbosity > 0 ? '+' : ''}{verbosity}
      <input aria-label="Verbosity bias" type="range" min="-30" max="30" value={verbosity} onChange={e => setVerbosity(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
      <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--code-bg)' }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>PAIRWISE OUTCOMES</div>
        {results.map((r, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', padding: '4px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}><span>pair {i + 1} · first {r.first}</span><span>human {r.humanA ? 'A' : 'B'} / judge <span style={{ color: r.humanA === r.judgeA ? 'var(--accent)' : 'var(--orange)' }}>{r.judgeA ? 'A' : 'B'}</span></span></div>)}
      </div>
      <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--code-bg)' }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>AGGREGATE READOUT</div>
        <div style={{ fontFamily: mono, fontSize: 16, color: 'var(--accent)', marginBottom: 8 }}>agreement {(agreement * 100).toFixed(0)}%</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text)' }}>Elo-style A rating <span style={{ color: 'var(--purple)' }}>{elo(winsA, results.length).toFixed(0)}</span></div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: 1.5, color: 'var(--text-muted)', marginTop: 12 }}>The rating maps the judge's observed A win fraction through a logistic Elo scale. It summarizes this judge, not human preference.</div>
      </div>
    </div>
  </WidgetCard>;
}
