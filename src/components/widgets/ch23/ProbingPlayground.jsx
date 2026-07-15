import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";
const samples = [-1, -1, -1, -1, 1, 1, 1, 1];
const noise = [[.2,-.35],[-.45,.1],[.15,.42],[-.25,-.2],[.35,.2],[-.18,.42],[.42,-.1],[-.3,-.3]];
const layerSignal = [.12, .28, .58, .9, 1.25, .72];

function fitProbe(points, labels) {
  // Ridge least squares on [1, x1, x2]: w = (X'X + lambda I)^-1 X'y.
  const xtx = [[.05, 0, 0], [0, .05, 0], [0, 0, .05]];
  const xty = [0, 0, 0];
  points.forEach(([x, y], i) => {
    const row = [1, x, y];
    row.forEach((a, r) => row.forEach((b, c) => { xtx[r][c] += a * b; }));
    row.forEach((a, r) => { xty[r] += a * labels[i]; });
  });
  const a = xtx.map((row, r) => [...row, xty[r]]);
  for (let col = 0; col < 3; col += 1) {
    const pivot = a.slice(col).reduce((best, row, i) => Math.abs(row[col]) > Math.abs(a[best][col]) ? col + i : best, col);
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const scale = a[col][col] || 1;
    for (let j = col; j < 4; j += 1) a[col][j] /= scale;
    for (let r = 0; r < 3; r += 1) if (r !== col) {
      const factor = a[r][col];
      for (let j = col; j < 4; j += 1) a[r][j] -= factor * a[col][j];
    }
  }
  return a.map(row => row[3]);
}

function layerData(layer) {
  const signal = layerSignal[layer];
  return samples.map((label, i) => [
    label * signal + noise[i][0] * .58,
    (i % 2 ? .25 : -.25) + noise[i][1] * .65,
  ]);
}

export default function ProbingPlayground({ tryThis }) {
  const [layer, setLayer] = useState(3);
  const result = useMemo(() => {
    const points = layerData(layer);
    const weights = fitProbe(points, samples);
    const predictions = points.map(([x, y]) => weights[0] + weights[1] * x + weights[2] * y);
    const correct = predictions.filter((p, i) => (p >= 0 ? 1 : -1) === samples[i]).length;
    const curve = layerSignal.map((_, l) => {
      const p = layerData(l);
      const w = fitProbe(p, samples);
      return p.filter(([x, y], i) => (w[0] + w[1] * x + w[2] * y >= 0 ? 1 : -1) === samples[i]).length / p.length;
    });
    return { points, weights, accuracy: correct / samples.length, curve };
  }, [layer]);

  return <WidgetCard title="Train a linear probe on toy hidden states" number="23.1" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      Each layer has eight fixed two-dimensional hidden states for a binary toy concept. The widget fits ridge least squares to labels −1/+1 on all eight states, then thresholds its prediction at zero. It is a demonstration of decodability, not evidence that the model uses this direction to make a decision.
    </p>
    <label style={{ display: 'block', fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 14 }}>
      inspected layer = {layer + 1}
      <input aria-label="Layer for linear probe" type="range" min="0" max="5" step="1" value={layer} onChange={e => setLayer(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: 8 }} />
    </label>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(230px, 1.1fr) minmax(180px, .9fr)', gap: 18 }}>
      <svg viewBox="0 0 260 210" role="img" aria-label="Toy hidden states and the fitted linear-probe boundary" style={{ width: '100%', background: 'var(--code-bg)', borderRadius: 6 }}>
        <line x1="20" y1="105" x2="240" y2="105" stroke="var(--border)" />
        <line x1="130" y1="18" x2="130" y2="192" stroke="var(--border)" />
        {result.points.map(([x, y], i) => {
          const px = 130 + x * 62; const py = 105 - y * 62;
          return <g key={i}><circle cx={px} cy={py} r="7" fill={samples[i] > 0 ? 'var(--accent)' : 'var(--purple)'} /><text x={px} y={py + 3.5} textAnchor="middle" fill="var(--bg)" fontSize="8">{samples[i] > 0 ? '+' : '−'}</text></g>;
        })}
        {Math.abs(result.weights[2]) > .001 && (() => {
          const yAt = x => -(result.weights[0] + result.weights[1] * x) / result.weights[2];
          const x1 = -1.6; const x2 = 1.6;
          return <line x1={130 + x1 * 62} y1={105 - yAt(x1) * 62} x2={130 + x2 * 62} y2={105 - yAt(x2) * 62} stroke="var(--green)" strokeWidth="2" />;
        })()}
        <text x="22" y="26" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">probe decision boundary</text>
      </svg>
      <div style={{ padding: 14, background: 'var(--code-bg)', borderRadius: 6 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text)', marginBottom: 10 }}>probe accuracy <span style={{ color: 'var(--accent)' }}>{(result.accuracy * 100).toFixed(0)}%</span></div>
        <div style={{ display: 'flex', alignItems: 'end', gap: 5, height: 74, marginBottom: 8 }}>
          {result.curve.map((value, i) => <div key={i} style={{ flex: 1, height: (value * 100) + '%', minHeight: 3, background: i === layer ? 'var(--accent)' : 'var(--purple)', borderRadius: '3px 3px 0 0' }} title={'Layer ' + (i + 1) + ': ' + (value * 100).toFixed(0) + '%'} />)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 9, color: 'var(--text-muted)' }}><span>layer 1</span><span>layer 6</span></div>
        <div style={{ marginTop: 16, fontFamily: mono, fontSize: 10, lineHeight: 1.55, color: 'var(--text-muted)' }}>
          fitted weights: [{result.weights.map(w => w.toFixed(2)).join(', ')}]<br />
          rising accuracy says a linear readout can recover the label; it does not establish causal use.
        </div>
      </div>
    </div>
  </WidgetCard>;
}
