import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";
const directions = {
  warmth: { label: 'warmth', vector: [1, 0.15] },
  caution: { label: 'caution', vector: [-0.35, 1] },
};
const outputs = [
  { label: 'direct answer', vector: [0.85, -0.1] },
  { label: 'warm answer', vector: [1.1, 0.5] },
  { label: 'cautious answer', vector: [-0.35, 1.05] },
];
const base = [0.25, 0.35];

function softmax(values) {
  const max = Math.max(...values);
  const raw = values.map(value => Math.exp(value - max));
  const total = raw.reduce((sum, value) => sum + value, 0);
  return raw.map(value => value / total);
}

export default function SteeringDemo({ tryThis }) {
  const [kind, setKind] = useState('warmth');
  const [strength, setStrength] = useState(0.8);
  const result = useMemo(() => {
    const vector = directions[kind].vector;
    const steered = [base[0] + strength * vector[0], base[1] + strength * vector[1]];
    const probabilities = softmax(outputs.map(output => output.vector[0] * steered[0] + output.vector[1] * steered[1]));
    return { vector, steered, probabilities };
  }, [kind, strength]);

  return <WidgetCard title="Add a steering vector to a toy residual state" number="23.5" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      A fixed two-dimensional residual state is modified as <span style={{ fontFamily: mono }}>h′ = h + λv</span>. A frozen three-logit toy decoder then applies softmax. Every probability below is calculated from that addition; real activation steering also depends on the chosen layer, vector construction, and model.
    </p>
    <div role="group" aria-label="Steering direction" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
      {Object.entries(directions).map(([key, direction]) => <button key={key} type="button" onClick={() => setKind(key)} aria-pressed={kind === key} style={{ fontFamily: mono, fontSize: 10, color: kind === key ? 'var(--bg)' : 'var(--text-muted)', background: kind === key ? 'var(--accent)' : 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 10px', cursor: 'pointer' }}>steer toward {direction.label}</button>)}
    </div>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 16 }}>strength λ = {strength.toFixed(1)}<input aria-label="Steering strength" type="range" min="-1.5" max="1.5" step="0.1" value={strength} onChange={event => setStrength(Number(event.target.value))} style={{ display: 'block', width: '100%', marginTop: 8 }} /></label>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, .9fr) minmax(240px, 1.1fr)', gap: 16 }}>
      <svg viewBox="0 0 260 225" role="img" aria-label="Base residual state plus steering vector in a two-concept activation space" style={{ width: '100%', background: 'var(--code-bg)', borderRadius: 6 }}>
        <line x1="130" y1="16" x2="130" y2="210" stroke="var(--border)" /><line x1="16" y1="113" x2="245" y2="113" stroke="var(--border)" /><text x="235" y="106" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">warmth</text><text x="137" y="27" fill="var(--text-muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">caution</text>
        <line x1="130" y1="113" x2={130 + base[0] * 62} y2={113 - base[1] * 62} stroke="var(--text-muted)" strokeWidth="3" /><circle cx={130 + base[0] * 62} cy={113 - base[1] * 62} r="4" fill="var(--text-muted)" /><text x={137 + base[0] * 62} y={108 - base[1] * 62} fill="var(--text-muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">h</text>
        <line x1={130 + base[0] * 62} y1={113 - base[1] * 62} x2={130 + result.steered[0] * 62} y2={113 - result.steered[1] * 62} stroke="var(--accent)" strokeWidth="3" /><circle cx={130 + result.steered[0] * 62} cy={113 - result.steered[1] * 62} r="5" fill="var(--accent)" /><text x={137 + result.steered[0] * 62} y={108 - result.steered[1] * 62} fill="var(--accent)" fontSize="9" fontFamily="JetBrains Mono, monospace">h′</text>
        <text x="18" y="198" fill="var(--text-muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">v = [{result.vector.map(value => value.toFixed(2)).join(', ')}]</text><text x="18" y="214" fill="var(--text-muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">h′ = [{result.steered.map(value => value.toFixed(2)).join(', ')}]</text>
      </svg>
      <div style={{ padding: 13, background: 'var(--code-bg)', borderRadius: 6 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>TOY NEXT-RESPONSE DISTRIBUTION</div>
        {outputs.map((output, i) => <div key={output.label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 42px', alignItems: 'center', gap: 8, marginBottom: 10, fontFamily: mono, fontSize: 10, color: 'var(--text-muted)' }}><span>{output.label}</span><div style={{ height: 9, background: 'var(--bg3)', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', width: `${result.probabilities[i] * 100}%`, background: i === 1 && kind === 'warmth' || i === 2 && kind === 'caution' ? 'var(--accent)' : 'var(--purple)' }} /></div><span>{(result.probabilities[i] * 100).toFixed(1)}%</span></div>)}
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)', fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: 1.5, color: 'var(--text-mid)' }}>A strong vector can move several logits at once. A shifted output is causal evidence for this intervention, not a complete explanation of the behavior.</div>
      </div>
    </div>
  </WidgetCard>;
}
