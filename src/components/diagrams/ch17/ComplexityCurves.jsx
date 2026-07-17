const C = {
  accent: 'var(--accent)', green: 'var(--green)', purple: 'var(--purple)',
  border: 'var(--border)', muted: 'var(--text-muted)', surface: 'var(--bg2)',
};

const TICKS = [1024, 4096, 16384, 65536, 262144];

function log4(value) {
  return Math.log(value) / Math.log(4);
}

function xFor(tokens) {
  const left = 64, right = 606;
  return left + (log4(tokens / TICKS[0]) / log4(TICKS.at(-1) / TICKS[0])) * (right - left);
}

function yFor(relativeWork) {
  const top = 28, bottom = 194;
  return bottom - (log4(relativeWork) / log4(65536)) * (bottom - top);
}

function pathFor(work) {
  const left = 64, right = 606;
  const points = Array.from({ length: 80 }, (_, i) => {
    const logTokens = log4(TICKS[0]) + i / 79 * log4(TICKS.at(-1) / TICKS[0]);
    const tokens = 4 ** logTokens;
    const x = left + i / 79 * (right - left);
    const y = yFor(work(tokens));
    return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return points.join(' ');
}

export default function ComplexityCurves() {
  const attentionWork = tokens => tokens * (tokens + 1) / 2 / (TICKS[0] * (TICKS[0] + 1) / 2);
  const scanWork = tokens => tokens / TICKS[0];
  // Linear attention is also O(T), but its per-token cost carries a larger constant
  // than a compact SSM recurrence (a feature-map projection vs. a single state update)
  // -- drawn with an illustrative 1.6x constant so the two O(T) lines are visually
  // distinguishable rather than pixel-identical.
  const linearAttnWork = tokens => (tokens / TICKS[0]) * 1.6;

  return (
    <figure style={{ margin: '28px 0', padding: '16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', overflowX: 'auto' }}>
      <svg viewBox="0 0 640 230" role="img" aria-label="Comparison of attention's quadratic pairwise score work with linear state-space and linear-attention sequence work as sequence length grows" style={{ display: 'block', width: '100%', minWidth: '520px' }}>
        <rect width="640" height="230" fill="var(--code-bg)" rx="5" />
        {[1, 16, 256, 4096, 65536].map(work => {
          const y = yFor(work);
          return <g key={work}><line x1="64" y1={y} x2="606" y2={y} stroke={C.border} strokeWidth="1" /><text x="56" y={y + 3} fill={C.muted} fontSize="9" textAnchor="end" fontFamily="JetBrains Mono, monospace">{work >= 1024 ? `${work / 1024}K×` : `${work}×`}</text></g>;
        })}
        {TICKS.map(tokens => {
          const x = xFor(tokens);
          return <g key={tokens}><line x1={x} y1="28" x2={x} y2="194" stroke={C.border} strokeWidth="1" /><text x={x} y="211" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{`${tokens / 1024}K`}</text></g>;
        })}
        <path d={pathFor(attentionWork)} fill="none" stroke={C.accent} strokeWidth="2.5" />
        <path d={pathFor(scanWork)} fill="none" stroke={C.green} strokeWidth="2.5" />
        <path d={pathFor(linearAttnWork)} fill="none" stroke={C.purple} strokeWidth="2" strokeDasharray="5 4" />
        <text x="72" y="23" fill={C.muted} fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="1">PREFILL WORK (RELATIVE · LOG SCALE)</text>
        <text x="606" y="224" fill={C.muted} fontSize="9" textAnchor="end" fontFamily="JetBrains Mono, monospace">sequence length T · log₄ scale</text>
        <g fontSize="10" fontFamily="JetBrains Mono, monospace">
          <line x1="354" y1="48" x2="374" y2="48" stroke={C.accent} strokeWidth="2.5" /><text x="380" y="52" fill="var(--text)">full attention: O(T²)</text>
          <line x1="354" y1="67" x2="374" y2="67" stroke={C.green} strokeWidth="2.5" /><text x="380" y="71" fill="var(--text)">SSM scan: O(T)</text>
          <line x1="354" y1="86" x2="374" y2="86" stroke={C.purple} strokeWidth="2" strokeDasharray="5 4" /><text x="380" y="90" fill="var(--text)">linear attention: O(T)</text>
        </g>
      </svg>
      <figcaption style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.muted, lineHeight: 1.5, marginTop: '10px' }}>
        /* Both axes are logarithmic. The points use T = 1K, 4K, 16K, 64K, and 256K; relative attention work is T(T+1)/2 and scan work is T, each normalized at 1K. SSM scan and linear attention are both O(T) but plotted with different illustrative constants (not measured) so the two lines stay visually distinguishable rather than overlapping exactly. */
      </figcaption>
    </figure>
  );
}
