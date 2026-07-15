const C = {
  accent: 'var(--accent)', green: 'var(--green)', purple: 'var(--purple)',
  border: 'var(--border)', muted: 'var(--text-muted)', surface: 'var(--bg2)',
};

function pathFor(fn, maxY) {
  const left = 64, right = 606, top = 28, bottom = 194;
  const points = Array.from({ length: 80 }, (_, i) => {
    const u = i / 79;
    const x = left + u * (right - left);
    const y = bottom - (fn(u) / maxY) * (bottom - top);
    return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return points.join(' ');
}

export default function ComplexityCurves() {
  const quadratic = u => 0.03 + 0.97 * u * u;
  const linear = u => 0.03 + 0.23 * u;

  return (
    <figure style={{ margin: '28px 0', padding: '16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', overflowX: 'auto' }}>
      <svg viewBox="0 0 640 230" role="img" aria-label="Comparison of attention's quadratic pairwise score work with linear state-space and linear-attention sequence work as sequence length grows" style={{ display: 'block', width: '100%', minWidth: '520px' }}>
        <rect width="640" height="230" fill="var(--code-bg)" rx="5" />
        {[0, 1, 2, 3, 4].map(i => {
          const y = 194 - i * 41.5;
          return <g key={i}><line x1="64" y1={y} x2="606" y2={y} stroke={C.border} strokeWidth="1" /><text x="56" y={y + 3} fill={C.muted} fontSize="9" textAnchor="end" fontFamily="JetBrains Mono, monospace">{i === 4 ? 'T²' : i === 0 ? '0' : ''}</text></g>;
        })}
        {[0, 1, 2, 3, 4].map(i => {
          const x = 64 + i * 135.5;
          return <g key={i}><line x1={x} y1="28" x2={x} y2="194" stroke={C.border} strokeWidth="1" /><text x={x} y="211" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{['1K', '4K', '16K', '64K', '256K'][i]}</text></g>;
        })}
        <path d={pathFor(quadratic, 1)} fill="none" stroke={C.accent} strokeWidth="2.5" />
        <path d={pathFor(linear, 1)} fill="none" stroke={C.green} strokeWidth="2.5" />
        <path d={pathFor(u => linear(u) + 0.012, 1)} fill="none" stroke={C.purple} strokeWidth="2" strokeDasharray="5 4" />
        <text x="72" y="23" fill={C.muted} fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="1">PREFILL WORK (RELATIVE)</text>
        <text x="606" y="224" fill={C.muted} fontSize="9" textAnchor="end" fontFamily="JetBrains Mono, monospace">sequence length T</text>
        <g fontSize="10" fontFamily="JetBrains Mono, monospace">
          <line x1="354" y1="48" x2="374" y2="48" stroke={C.accent} strokeWidth="2.5" /><text x="380" y="52" fill="var(--text)">full attention: O(T²)</text>
          <line x1="354" y1="67" x2="374" y2="67" stroke={C.green} strokeWidth="2.5" /><text x="380" y="71" fill="var(--text)">SSM scan: O(T)</text>
          <line x1="354" y1="86" x2="374" y2="86" stroke={C.purple} strokeWidth="2" strokeDasharray="5 4" /><text x="380" y="90" fill="var(--text)">linear attention: O(T)</text>
        </g>
      </svg>
      <figcaption style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.muted, lineHeight: 1.5, marginTop: '10px' }}>
        /* The attention curve counts all query-key pairs during prefill. Constants, width, kernels, and hardware matter, but the number of pairs grows as T² while a scan visits each position once. */
      </figcaption>
    </figure>
  );
}
