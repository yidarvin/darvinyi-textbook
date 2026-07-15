const C = { accent: 'var(--accent)', purple: 'var(--purple)', orange: 'var(--orange)', border: 'var(--border)', muted: 'var(--text-muted)' };
const mono = "'JetBrains Mono', monospace";

function Box({ x, y, w, title, detail, color }) {
  return <g><rect x={x} y={y} width={w} height="52" rx="6" fill="var(--code-bg)" stroke={color} /><text x={x + 10} y={y + 21} fill="var(--text)" fontSize="11" fontFamily="JetBrains Mono, monospace">{title}</text><text x={x + 10} y={y + 38} fill={C.muted} fontSize="9" fontFamily="Inter, sans-serif">{detail}</text></g>;
}

export default function ContaminationPathways() {
  return <figure style={{ margin: '28px 0', padding: 16, background: 'var(--bg2)', border: `1px solid ${C.border}`, borderRadius: 8, overflowX: 'auto' }}>
    <svg viewBox="0 0 640 245" role="img" aria-label="Three routes by which public evaluation material can influence a language model before it is measured, and hygiene controls that limit each route" style={{ display: 'block', width: '100%', minWidth: 560 }}>
      <defs><marker id="n22-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={C.muted} /></marker></defs>
      <rect width="640" height="245" rx="5" fill="var(--code-bg)" />
      <text x="22" y="25" fill={C.muted} fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="1">PUBLIC EVAL MATERIAL → MODEL SCORE</text>
      <Box x="25" y="52" w="164" title="public benchmark" detail="items, answers, tests" color={C.accent} />
      <Box x="238" y="52" w="164" title="web / training corpus" detail="pretraining ingestion" color={C.orange} />
      <Box x="451" y="52" w="164" title="evaluated model" detail="score can reflect exposure" color={C.orange} />
      <path d="M189 78 H236" stroke={C.muted} strokeWidth="1.5" markerEnd="url(#n22-arrow)" /><path d="M402 78 H449" stroke={C.muted} strokeWidth="1.5" markerEnd="url(#n22-arrow)" />
      <Box x="238" y="132" w="164" title="fine-tune / prompt set" detail="manual copying or benchmark tuning" color={C.orange} />
      <path d="M107 104 V158 H236" fill="none" stroke={C.muted} strokeWidth="1.5" markerEnd="url(#n22-arrow)" /><path d="M402 158 H482 V106" fill="none" stroke={C.muted} strokeWidth="1.5" markerEnd="url(#n22-arrow)" />
      <text x="25" y="211" fill={C.purple} fontSize="10" fontFamily="JetBrains Mono, monospace">CONTROLS</text>
      <text x="99" y="211" fill={C.muted} fontSize="10" fontFamily="Inter, sans-serif">cutoffs + corpus matching · private/dynamic items · held-out development set · report contamination audits</text>
      <text x="25" y="229" fill={C.muted} fontSize="9" fontFamily="Inter, sans-serif">A clean-looking score is not proof of generalization. These controls reduce particular exposure routes and should be reported with the result.</text>
    </svg>
    <figcaption style={{ fontFamily: mono, fontSize: 10, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>/* Contamination is an evaluation-design problem. Exact matching catches some copied text; paraphrases, derived data, and development feedback can travel through different routes. */</figcaption>
  </figure>;
}
