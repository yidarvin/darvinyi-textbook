import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const PRESETS = {
  pulse: [0, 0, 1, 0, 0, 0, 0, 0],
  rhythm: [1, 0, 0.4, 0, 0, 0.8, 0, 0],
  alternating: [1, -0.8, 1, -0.8, 1, -0.8, 1, -0.8],
};
const C = { accent: 'var(--accent)', purple: 'var(--purple)', border: 'var(--border)', bg: 'var(--code-bg)', muted: 'var(--text-muted)' };

function bars(values, color, label, max) {
  return <div style={{ flex: 1, minWidth: 220 }}><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.muted, marginBottom: 8 }}>{label}</div><div style={{ display: 'flex', alignItems: 'center', height: 118, gap: 5, borderBottom: `1px solid ${C.border}` }}>{values.map((v, i) => <div key={i} style={{ flex: 1, height: '100%', position: 'relative' }}><div title={`${label}[${i}] = ${v.toFixed(4)}`} style={{ position: 'absolute', left: 0, right: 0, bottom: v >= 0 ? '50%' : `calc(50% - ${Math.abs(v) / max * 50}%)`, height: `${Math.abs(v) / max * 50}%`, background: color, opacity: .85, borderRadius: 2 }} /><span style={{ position: 'absolute', bottom: -17, width: '100%', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.muted }}>{i}</span></div>)}</div></div>;
}

export default function SSMDuality({ tryThis }) {
  const [decay, setDecay] = useState(0.72);
  const [preset, setPreset] = useState('pulse');
  const u = PRESETS[preset];
  const { recurrence, kernel, convolution, error } = useMemo(() => {
    const b = 1, c = 1;
    const k = u.map((_, lag) => c * b * decay ** lag);
    const rec = []; let state = 0;
    for (const input of u) { state = decay * state + b * input; rec.push(c * state); }
    const conv = u.map((_, t) => u.slice(0, t + 1).reduce((sum, input, i) => sum + k[t - i] * input, 0));
    return { recurrence: rec, kernel: k, convolution: conv, error: Math.max(...rec.map((v, i) => Math.abs(v - conv[i]))) };
  }, [decay, u]);

  return <WidgetCard title="One SSM, two exact computations" number="17.1" tryThis={tryThis}>
    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 14 }}>
      This is the scalar discrete SSM <code>xₜ = a xₜ₋₁ + uₜ</code>, <code>yₜ = xₜ</code>. The convolution panel uses its exact causal kernel <code>kℓ = aℓ</code>, not a fitted approximation.
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>{Object.keys(PRESETS).map(name => <button type="button" key={name} onClick={() => setPreset(name)} style={{ border: `1px solid ${preset === name ? C.accent : C.border}`, background: preset === name ? 'var(--accent-dim)' : 'var(--bg3)', color: preset === name ? C.accent : 'var(--text-mid)', borderRadius: 4, padding: '5px 9px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: 'pointer' }}>{name}</button>)}</div>
    <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text)', marginBottom: 20 }}>decay a = {decay.toFixed(2)}<input aria-label="SSM state decay" type="range" min="0" max="0.95" step="0.01" value={decay} onChange={e => setDecay(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: 9 }} /></label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: 12, background: C.bg, borderRadius: 5 }}>{bars(u, 'var(--text-mid)', 'input uₜ', 1)}{bars(kernel, C.purple, 'causal kernel kℓ', 1)}{bars(recurrence, C.accent, 'recurrence yₜ', Math.max(1, ...recurrence.map(Math.abs)))}{bars(convolution, C.accent, 'convolution yₜ', Math.max(1, ...convolution.map(Math.abs)))}</div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.muted, marginTop: 22 }}>max |recurrence − convolution| = {error.toExponential(2)} (floating-point roundoff)</div>
  </WidgetCard>;
}
