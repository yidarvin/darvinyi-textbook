const mono = "'JetBrains Mono', monospace";

const rows = [
  ['behavioral test', 'Does the system succeed or fail?', 'useful outcome evidence'],
  ['linear probe', 'Can a readout decode a concept?', 'decodability, not use'],
  ['circuit hypothesis', 'Which paths carry the computation?', 'mechanistic prediction'],
  ['causal intervention', 'Does a targeted change alter behavior?', 'stronger causal evidence'],
];

export default function MechanisticEvidenceLadder() {
  return <figure style={{ margin: '28px 0', padding: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflowX: 'auto' }}>
    <svg viewBox="0 0 640 266" role="img" aria-label="An evidence ladder from behavioral tests through probes and circuits to causal interventions" style={{ display: 'block', width: '100%', minWidth: 560 }}>
      <rect width="640" height="266" rx="5" fill="var(--code-bg)" />
      <text x="22" y="26" fill="var(--text-muted)" fontSize="10" fontFamily={mono} letterSpacing="1">INTERPRETABILITY EVIDENCE IS NOT ONE THING</text>
      <text x="25" y="51" fill="var(--text-muted)" fontSize="9" fontFamily={mono}>QUESTION</text><text x="188" y="51" fill="var(--text-muted)" fontSize="9" fontFamily={mono}>OBSERVATION</text><text x="448" y="51" fill="var(--text-muted)" fontSize="9" fontFamily={mono}>WHAT IT SUPPORTS</text>
      {rows.map((row, i) => { const y = 65 + i * 43; const color = i === 3 ? 'var(--accent)' : 'var(--purple)'; return <g key={row[0]}><rect x="20" y={y} width="600" height="34" rx="4" fill="var(--bg3)" stroke="var(--border)" /><rect x="20" y={y} width="5" height="34" rx="2" fill={color} /><text x="35" y={y + 21} fill="var(--text)" fontSize="11" fontFamily={mono}>{row[0]}</text><text x="188" y={y + 21} fill="var(--text-muted)" fontSize="10" fontFamily="Inter, sans-serif">{row[1]}</text><text x="448" y={y + 21} fill={i === 3 ? 'var(--accent)' : 'var(--text-muted)'} fontSize="10" fontFamily="Inter, sans-serif">{row[2]}</text></g>; })}
      <path d="M320 244 V232" stroke="var(--accent)" strokeWidth="2" /><path d="M315 238 L320 232 L325 238" fill="none" stroke="var(--accent)" strokeWidth="2" /><text x="333" y="242" fill="var(--accent)" fontSize="10" fontFamily={mono}>increasingly direct evidence about a proposed mechanism</text>
    </svg>
    <figcaption style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>/* A probe can reveal information without showing that the model relies on it. A causal intervention tests a sharper claim, but still only the intervention and setting actually measured. */</figcaption>
  </figure>;
}
