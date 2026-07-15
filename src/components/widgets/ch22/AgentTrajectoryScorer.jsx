import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";
const STEPS = [
  { action: 'read issue and failing test', credit: 1, note: 'grounds the task in executable evidence' },
  { action: 'inspect the relevant module', credit: 1, note: 'finds the implementation boundary' },
  { action: 'edit an unrelated configuration file', credit: -1, note: 'introduces an unnecessary change' },
  { action: 'patch the faulty branch', credit: 2, note: 'addresses the stated defect' },
  { action: 'run the full test suite', credit: 1, note: 'checks for regressions before finishing' },
];

export default function AgentTrajectoryScorer({ tryThis }) {
  const [shown, setShown] = useState(1);
  const visible = STEPS.slice(0, shown);
  const trajectory = visible.reduce((sum, step) => sum + step.credit, 0) / 4;
  const outcome = shown === STEPS.length ? 1 : 0;

  return <WidgetCard title="The same run, two scoring rules" number="22.4" tryThis={tryThis}>
    <p style={{ margin: '0 0 16px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: 'var(--text-mid)' }}>
      This is a canned, fictional repair run. Outcome scoring gives credit only if the final test suite passes. The trajectory rubric gives +1 for grounding, inspection, and verification, +2 for the relevant repair, and −1 for the unrelated edit, then divides by four. The rubric is deliberately visible because changing it changes the measured agent.
    </p>
    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => setShown(Math.min(STEPS.length, shown + 1))} disabled={shown === STEPS.length} style={{ fontFamily: mono, fontSize: 11, border: '1px solid var(--accent)', borderRadius: 5, background: 'var(--accent-dim)', color: 'var(--text)', padding: '7px 10px', cursor: shown === STEPS.length ? 'default' : 'pointer', opacity: shown === STEPS.length ? .55 : 1 }}>reveal next step</button>
      <button type="button" onClick={() => setShown(1)} style={{ fontFamily: mono, fontSize: 11, border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg3)', color: 'var(--text-muted)', padding: '7px 10px', cursor: 'pointer' }}>reset trace</button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))', gap: 16 }}>
      <div>{visible.map((step, i) => <div key={step.action} style={{ padding: '9px 10px', marginBottom: 7, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--code-bg)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontFamily: mono, fontSize: 10, color: 'var(--text)' }}><span>{i + 1}. {step.action}</span><span style={{ color: step.credit > 0 ? 'var(--accent)' : 'var(--orange)' }}>{step.credit > 0 ? '+' : ''}{step.credit}</span></div><div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>{step.note}</div></div>)}</div>
      <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--code-bg)', alignSelf: 'start' }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>CURRENT SCORES</div>
        <div style={{ fontFamily: mono, fontSize: 12, color: 'var(--text)', marginBottom: 8 }}>outcome-only <span style={{ color: outcome ? 'var(--accent)' : 'var(--orange)' }}>{outcome ? '1.00 pass' : '0.00 pending'}</span></div>
        <div style={{ fontFamily: mono, fontSize: 12, color: 'var(--text)' }}>trajectory rubric <span style={{ color: 'var(--purple)' }}>{trajectory.toFixed(2)}</span></div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 12 }}>A final pass can hide wasteful or risky steps. A process rubric can expose them, but it also imports a human judgment about which steps deserve credit.</div>
      </div>
    </div>
  </WidgetCard>;
}
