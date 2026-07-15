import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";
const dictionary = [
  { label: 'code syntax', vector: [1, 0], color: 'var(--accent)' },
  { label: 'formal proof', vector: [0, 1], color: 'var(--purple)' },
  { label: 'type signature', vector: [0.72, 0.72], color: 'var(--orange)' },
  { label: 'negation', vector: [-0.72, 0.72], color: 'var(--green)' },
];
const inputs = [
  { text: 'function returns a string', activation: [1.14, 0.18] },
  { text: 'prove the lemma by induction', activation: [0.16, 1.08] },
  { text: 'type mismatch in the function', activation: [0.82, 0.73] },
  { text: 'this claim is not true', activation: [-0.54, 0.78] },
];

function sparseCode(x, lambda = 0.3) {
  // Non-negative coordinate descent for min_z ||x - Dz||² + λΣz_j.
  const z = dictionary.map(() => 0);
  for (let sweep = 0; sweep < 36; sweep += 1) {
    dictionary.forEach((feature, j) => {
      const reconstructionWithout = dictionary.reduce((sum, other, k) => k === j ? sum : [sum[0] + z[k] * other.vector[0], sum[1] + z[k] * other.vector[1]], [0, 0]);
      const residual = [x[0] - reconstructionWithout[0], x[1] - reconstructionWithout[1]];
      const normSquared = feature.vector[0] ** 2 + feature.vector[1] ** 2;
      z[j] = Math.max(0, (feature.vector[0] * residual[0] + feature.vector[1] * residual[1] - lambda / 2) / normSquared);
    });
  }
  const reconstruction = dictionary.reduce((sum, feature, i) => [sum[0] + z[i] * feature.vector[0], sum[1] + z[i] * feature.vector[1]], [0, 0]);
  return { z, reconstruction, error: Math.hypot(x[0] - reconstruction[0], x[1] - reconstruction[1]) };
}

export default function SAEFeatureBrowser({ tryThis }) {
  const [inputIndex, setInputIndex] = useState(2);
  const [selected, setSelected] = useState(2);
  const codes = useMemo(() => inputs.map(input => sparseCode(input.activation)), []);
  const code = codes[inputIndex];
  const ranked = inputs.map((input, i) => ({ ...input, value: codes[i].z[selected] })).sort((a, b) => b.value - a.value);

  return <WidgetCard title="Decompose an activation with a sparse dictionary" number="23.4" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      Each input has a fixed two-dimensional activation. The widget solves a non-negative sparse-coding objective with four fixed dictionary vectors, then shows the reconstruction and feature activations. This is the SAE objective in miniature, not a claim that these labels came from a trained model.
    </p>
    <div role="group" aria-label="Toy input" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
      {inputs.map((input, i) => <button key={input.text} type="button" onClick={() => setInputIndex(i)} aria-pressed={inputIndex === i} style={{ fontFamily: mono, fontSize: 10, color: inputIndex === i ? 'var(--bg)' : 'var(--text-muted)', background: inputIndex === i ? 'var(--accent)' : 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>input {i + 1}</button>)}
    </div>
    <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 15 }}>“{inputs[inputIndex].text}”</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(210px, 1fr)', gap: 16 }}>
      <svg viewBox="0 0 260 230" role="img" aria-label="A toy activation and its sparse dictionary reconstruction" style={{ width: '100%', background: 'var(--code-bg)', borderRadius: 6 }}>
        <line x1="130" y1="15" x2="130" y2="215" stroke="var(--border)" /><line x1="15" y1="115" x2="245" y2="115" stroke="var(--border)" />
        {dictionary.map((feature, i) => <g key={feature.label}><line x1="130" y1="115" x2={130 + feature.vector[0] * 70} y2={115 - feature.vector[1] * 70} stroke={feature.color} strokeWidth={i === selected ? 3 : 1.2} opacity={i === selected ? 1 : .55} /><text x={130 + feature.vector[0] * 84} y={119 - feature.vector[1] * 84} textAnchor="middle" fill={feature.color} fontSize="9" fontFamily="JetBrains Mono, monospace">f{i + 1}</text></g>)}
        <line x1="130" y1="115" x2={130 + inputs[inputIndex].activation[0] * 70} y2={115 - inputs[inputIndex].activation[1] * 70} stroke="var(--text)" strokeWidth="3" /><circle cx={130 + inputs[inputIndex].activation[0] * 70} cy={115 - inputs[inputIndex].activation[1] * 70} r="4" fill="var(--text)" />
        <line x1="130" y1="115" x2={130 + code.reconstruction[0] * 70} y2={115 - code.reconstruction[1] * 70} stroke="var(--accent)" strokeWidth="3" strokeDasharray="5 3" /><text x="18" y="25" fill="var(--text-muted)" fontSize="10" fontFamily="JetBrains Mono, monospace">white = activation; dashed = reconstruction</text>
      </svg>
      <div style={{ padding: 13, background: 'var(--code-bg)', borderRadius: 6 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 9 }}>SPARSE FEATURE ACTIVATIONS</div>
        {dictionary.map((feature, i) => <button key={feature.label} type="button" onClick={() => setSelected(i)} aria-pressed={selected === i} style={{ display: 'grid', gridTemplateColumns: '18px 1fr 40px', alignItems: 'center', gap: 8, width: '100%', marginBottom: 7, padding: 0, textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: mono, fontSize: 10, color: selected === i ? 'var(--text)' : 'var(--text-muted)' }}><span style={{ color: feature.color }}>f{i + 1}</span><span>{feature.label}</span><span>{code.z[i].toFixed(2)}</span></button>)}
        <div style={{ marginTop: 13, paddingTop: 10, borderTop: '1px solid var(--border)', fontFamily: mono, fontSize: 10, lineHeight: 1.55, color: 'var(--text-muted)' }}>||x − Dz||₂ = {code.error.toFixed(2)}<br />λ = 0.30 keeps many coefficients at zero.</div>
      </div>
    </div>
    <div style={{ marginTop: 15, padding: 12, background: 'var(--code-bg)', borderRadius: 6 }}>
      <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 7 }}>TOP ACTIVATIONS FOR f{selected + 1}: {dictionary[selected].label}</div>
      {ranked.map((item, i) => <div key={item.text} style={{ display: 'grid', gridTemplateColumns: '18px 1fr 38px', gap: 8, fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.6 }}><span style={{ fontFamily: mono, color: 'var(--text-muted)' }}>{i + 1}</span><span>{item.text}</span><span style={{ fontFamily: mono, color: dictionary[selected].color }}>{item.value.toFixed(2)}</span></div>)}
    </div>
  </WidgetCard>;
}
