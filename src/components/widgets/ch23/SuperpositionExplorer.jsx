import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";

function vector(i, count) {
  // These are evenly spaced projective directions: the half-open half-circle
  // avoids adding a second, antipodal copy of an existing direction.
  const angle = -Math.PI / 2 + (Math.PI * i) / count;
  return [Math.cos(angle), Math.sin(angle)];
}

export default function SuperpositionExplorer({ tryThis }) {
  const [count, setCount] = useState(5);
  const [active, setActive] = useState(0);
  const model = useMemo(() => {
    const directions = Array.from({ length: count }, (_, i) => vector(i, count));
    const chosen = active % count;
    const partner = chosen + 1;
    const code = directions[chosen].map((v, d) => v + directions[partner][d] * .65);
    const readouts = directions.map(direction => direction[0] * code[0] + direction[1] * code[1]);
    const interference = readouts.map((value, i) => i === chosen || i === partner ? 0 : Math.abs(value)).reduce((a, b) => a + b, 0) / Math.max(1, count - 2);
    const coherence = directions.reduce((max, a, i) => directions.slice(i + 1).reduce((m, b) => Math.max(m, Math.abs(a[0] * b[0] + a[1] * b[1])), max), 0);
    return { directions, chosen, partner, code, readouts, interference, coherence };
  }, [count, active]);

  return <WidgetCard title="Pack more feature directions into two dimensions" number="23.2" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      This two-dimensional toy encodes two active features by adding their unit directions. The directions are evenly spaced across a half-circle, so two features are orthogonal and each added feature crowds the nearest pair closer together. Each feature is read out with a dot product. With more directions than dimensions, non-selected directions receive nonzero readout: that cross-talk is the displayed interference. Real superposition is learned, nonlinear, and often sparse; this is the geometric core.
    </p>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 12 }}>
      number of features = {count} (representation dimensions = 2)
      <input aria-label="Number of superposed features" type="range" min="2" max="9" step="1" value={count} onChange={e => { const next = Number(e.target.value); setCount(next); setActive(v => Math.min(v, next - 2)); }} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 18 }}>
      first active feature = f{model.chosen + 1}; adjacent second = f{model.partner + 1} at 0.65
      <input aria-label="First active feature in superposition toy" type="range" min="0" max={count - 2} step="1" value={model.chosen} onChange={e => setActive(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(190px, .9fr)', gap: 18 }}>
      <svg viewBox="0 0 250 230" role="img" aria-label="Feature directions packed into a two-dimensional representation" style={{ width: '100%', background: 'var(--code-bg)', borderRadius: 6 }}>
        <line x1="125" y1="15" x2="125" y2="215" stroke="var(--border)" /><line x1="15" y1="115" x2="235" y2="115" stroke="var(--border)" />
        {model.directions.map(([x, y], i) => <g key={i}><line x1="125" y1="115" x2={125 + x * 80} y2={115 - y * 80} stroke={i === model.chosen || i === model.partner ? 'var(--accent)' : 'var(--purple)'} strokeWidth={i === model.chosen || i === model.partner ? 3 : 1.5} /><text x={125 + x * 94} y={119 - y * 94} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">f{i + 1}</text></g>)}
        <line x1="125" y1="115" x2={125 + model.code[0] * 70} y2={115 - model.code[1] * 70} stroke="var(--green)" strokeWidth="4" />
        <circle cx={125 + model.code[0] * 70} cy={115 - model.code[1] * 70} r="4" fill="var(--green)" />
        <text x="18" y="25" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">green = encoded activation</text>
      </svg>
      <div style={{ padding: 14, background: 'var(--code-bg)', borderRadius: 6 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 9 }}>DOT-PRODUCT READOUTS</div>
        {model.readouts.map((value, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '26px 1fr 38px', alignItems: 'center', gap: 6, marginBottom: 6, fontFamily: mono, fontSize: 10, color: 'var(--text-muted)' }}><span>f{i + 1}</span><div style={{ height: 7, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: Math.min(100, Math.abs(value) / 1.65 * 100) + '%', background: i === model.chosen || i === model.partner ? 'var(--accent)' : 'var(--purple)' }} /></div><span>{value.toFixed(2)}</span></div>)}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontFamily: mono, fontSize: 11, color: 'var(--text)' }}>nearest-pair coherence <span style={{ color: 'var(--accent)' }}>{model.coherence.toFixed(2)}</span><br />mean inactive cross-talk <span style={{ color: 'var(--purple)' }}>{model.interference.toFixed(2)}</span></div>
      </div>
    </div>
  </WidgetCard>;
}
