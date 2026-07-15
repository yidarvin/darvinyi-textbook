import { useMemo, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";
const tokens = ['A', 'B', 'C', 'A'];

export default function InductionHeadTracer({ tryThis }) {
  const [step, setStep] = useState(0);
  const state = useMemo(() => ({
    previous: tokens.map((_, i) => (i === 0 ? '∅' : tokens[i - 1])),
    // At the final A, the induction head queries for a key carrying A. The
    // previous-token head put A into position B's key, so layer 2 reads B.
    inductionSource: 1,
  }), []);

  const explain = [
    'Layer 0 supplies the token identities. We are at the second A and want the next token.',
    'Layer 1 uses a previous-token head. Each position receives the identity immediately to its left.',
    'Layer 2 queries from the final A. It attends to B because B now carries previous = A, then copies B toward the next-token logits.',
  ][step];

  return <WidgetCard title="Trace a two-head induction circuit" number="23.3" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      This is an attention-only toy circuit, not a language model run. The first head writes each previous token into the next position; the second head uses that copied key to retrieve what followed an earlier A. The displayed arrows are the exact nonzero attention pattern in this hand-built circuit.
    </p>
    <div role="group" aria-label="Induction circuit step" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      {['tokens', 'previous-token head', 'induction head'].map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} aria-pressed={step === index} style={{ fontFamily: mono, fontSize: 10, color: step === index ? 'var(--bg)' : 'var(--text-muted)', background: step === index ? 'var(--accent)' : 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 9px', cursor: 'pointer' }}>{index + 1}. {label}</button>)}
    </div>
    <div style={{ padding: 13, marginBottom: 14, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--code-bg)', fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.55 }}>{explain}</div>
    <svg viewBox="0 0 620 235" role="img" aria-label="A repeated-token sequence flowing through a previous-token head and an induction head" style={{ display: 'block', width: '100%', minWidth: 560, background: 'var(--code-bg)', borderRadius: 6 }}>
      <defs><marker id="induction-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--accent)" /></marker></defs>
      <text x="22" y="27" fill="var(--text-muted)" fontSize="10" fontFamily="JetBrains Mono, monospace">PROMPT: A  B  C  A  →  ?</text>
      {tokens.map((token, i) => {
        const x = 50 + i * 125;
        const focused = i === 3;
        return <g key={token + i}><rect x={x} y="47" width="64" height="35" rx="5" fill={focused ? 'var(--accent-dim)' : 'var(--bg3)'} stroke={focused ? 'var(--accent)' : 'var(--border)'} /><text x={x + 32} y="69" textAnchor="middle" fill="var(--text)" fontSize="15" fontFamily="JetBrains Mono, monospace">{token}</text><text x={x + 32} y="101" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">pos {i + 1}</text></g>;
      })}
      {step >= 1 && tokens.slice(1).map((_, i) => {
        const x = 50 + (i + 1) * 125 + 32;
        return <g key={i}><path d={`M${x} 112 C${x} 142 ${x - 125} 142 ${x - 125} 112`} fill="none" stroke="var(--purple)" strokeWidth="2" markerEnd="url(#induction-arrow)" /><text x={x - 63} y="154" textAnchor="middle" fill="var(--purple)" fontSize="9" fontFamily="JetBrains Mono, monospace">writes prev = {state.previous[i + 1]}</text></g>;
      })}
      {step >= 1 && tokens.map((_, i) => <text key={i} x={82 + i * 125} y="176" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="JetBrains Mono, monospace">key: {state.previous[i]}</text>)}
      {step >= 2 && <><path d="M457 184 C420 222 240 222 207 184" fill="none" stroke="var(--accent)" strokeWidth="3" markerEnd="url(#induction-arrow)" /><text x="331" y="226" textAnchor="middle" fill="var(--accent)" fontSize="11" fontFamily="JetBrains Mono, monospace">query A matches key A at B; read token B</text><rect x="536" y="159" width="58" height="32" rx="5" fill="var(--accent-dim)" stroke="var(--accent)" /><text x="565" y="180" textAnchor="middle" fill="var(--text)" fontSize="12" fontFamily="JetBrains Mono, monospace">next B</text></>}
    </svg>
  </WidgetCard>;
}
