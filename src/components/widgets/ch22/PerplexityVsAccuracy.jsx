import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";

function Bar({ label, value, max, color, detail }) {
  return <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontFamily: mono, fontSize: 10, color: 'var(--text-muted)' }}>
      <span>{label}</span><span style={{ color }}>{detail}</span>
    </div>
    <div style={{ height: 9, borderRadius: 4, overflow: 'hidden', background: 'var(--bg3)', marginTop: 5 }}>
      <div style={{ width: `${Math.max(1, value / max * 100)}%`, height: '100%', background: color }} />
    </div>
  </div>;
}

export default function PerplexityVsAccuracy({ tryThis }) {
  const [quality, setQuality] = useState(55);
  const scores = useMemo(() => {
    const q = quality / 100;
    // A disclosed two-population toy corpus. Easy continuation tokens dominate
    // corpus likelihood, while the task always tests the rare decision token.
    const easy = 0.55 + 0.445 * q;
    const decision = 0.20 + 0.72 * q;
    const crossEntropy = -(0.95 * Math.log(easy) + 0.05 * Math.log(decision));
    return { easy, decision, crossEntropy, perplexity: Math.exp(crossEntropy) };
  }, [quality]);

  return <WidgetCard title="One likelihood score, two capabilities" number="22.1" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      This disclosed toy corpus is 95% routine continuation tokens and 5% decision tokens. The task asks only for a decision token. The slider changes both conditional probabilities, but routine tokens dominate the mean log loss, so a lower perplexity need not imply a proportional task gain.
    </p>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 18 }}>
      shared model-quality control = {quality}
      <input aria-label="Toy model quality" type="range" min="0" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18, padding: 14, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--code-bg)' }}>
      <div>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '.08em', marginBottom: 12 }}>TOKEN-DISTRIBUTION FIT</div>
        <Bar label="routine token p" value={scores.easy} max={1} color="var(--accent)" detail={scores.easy.toFixed(3)} />
        <Bar label="decision token p" value={scores.decision} max={1} color="var(--purple)" detail={scores.decision.toFixed(3)} />
      </div>
      <div>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '.08em', marginBottom: 12 }}>DERIVED SCORES</div>
        <div style={{ fontFamily: mono, fontSize: 12, color: 'var(--text)', marginBottom: 10 }}>cross-entropy <span style={{ color: 'var(--accent)' }}>{scores.crossEntropy.toFixed(3)} nats/token</span></div>
        <div style={{ fontFamily: mono, fontSize: 12, color: 'var(--text)', marginBottom: 10 }}>perplexity <span style={{ color: 'var(--accent)' }}>{scores.perplexity.toFixed(2)}</span></div>
        <div style={{ fontFamily: mono, fontSize: 12, color: 'var(--text)' }}>decision-task accuracy <span style={{ color: 'var(--purple)' }}>{(scores.decision * 100).toFixed(1)}%</span></div>
      </div>
    </div>
  </WidgetCard>;
}
