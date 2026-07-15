import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";

function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  k = Math.min(k, n - k);
  let total = 0;
  for (let i = 1; i <= k; i += 1) total += Math.log(n - k + i) - Math.log(i);
  return total;
}

function passAtK(samples, correct, k) {
  if (k > samples) return null;
  if (correct === 0) return 0;
  if (k > samples - correct) return 1;
  return 1 - Math.exp(logChoose(samples - correct, k) - logChoose(samples, k));
}

export default function PassAtKCalculator({ tryThis }) {
  const [samples, setSamples] = useState(20);
  const [correct, setCorrect] = useState(3);
  const values = useMemo(() => [1, 10, 100].map(k => ({ k, value: passAtK(samples, correct, k) })), [samples, correct]);

  return <WidgetCard title="pass@k: sample without replacement" number="22.2" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      This is the finite-sample estimator used when a benchmark has <code>n</code> generated completions and <code>c</code> pass its tests. It is the probability that a uniformly chosen set of <code>k</code> of those completions contains at least one correct program, not a claim that independent samples are guaranteed.
    </p>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 14 }}>
      generated completions n = {samples}
      <input aria-label="Number of generated completions" type="range" min="1" max="100" value={samples} onChange={e => { const n = Number(e.target.value); setSamples(n); setCorrect(c => Math.min(c, n)); }} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 18 }}>
      correct completions c = {correct}
      <input aria-label="Number of correct completions" type="range" min="0" max={samples} value={correct} onChange={e => setCorrect(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <div style={{ padding: 14, background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: 7 }}>
      <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text)', lineHeight: 1.65, marginBottom: 14 }}>pass@k = 1 − C(n − c, k) / C(n, k)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {values.map(({ k, value }) => <div key={k} style={{ padding: '10px 8px', border: '1px solid var(--border)', borderRadius: 5 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)' }}>PASS@{k}</div>
          <div style={{ fontFamily: mono, fontSize: 18, color: value === null ? 'var(--text-muted)' : 'var(--accent)', marginTop: 4 }}>{value === null ? 'n/a' : `${(value * 100).toFixed(1)}%`}</div>
        </div>)}
      </div>
    </div>
  </WidgetCard>;
}
