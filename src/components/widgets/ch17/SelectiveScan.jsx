import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const PRESETS = {
  remember: [{ t: 'fact', u: 1, retain: .98, write: 1 }, { t: 'filler', u: 0, retain: .98, write: 0 }, { t: 'filler', u: 0, retain: .98, write: 0 }, { t: 'query', u: 0, retain: .98, write: 0 }],
  replace: [{ t: 'old fact', u: 1, retain: .96, write: 1 }, { t: 'new fact', u: -1, retain: .10, write: 1 }, { t: 'query', u: 0, retain: .98, write: 0 }, { t: 'query', u: 0, retain: .98, write: 0 }],
};
const C = { accent: 'var(--accent)', border: 'var(--border)', muted: 'var(--text-muted)' };

export default function SelectiveScan({ tryThis }) {
  const [preset, setPreset] = useState('remember');
  const rows = PRESETS[preset];
  const trace = rows.reduce((acc, row) => {
    const previous = acc.length ? acc[acc.length - 1].state : 0;
    return [...acc, { ...row, state: row.retain * previous + row.write * row.u }];
  }, []);
  return <WidgetCard title="Selective scan: choose what state keeps" number="17.2" tryThis={tryThis}>
    <p style={{ margin: '0 0 14px', fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.5, color: 'var(--text-mid)' }}>Each token supplies an input-dependent retention gate <code>aₜ</code> and write gate <code>bₜ</code>. This toy scan computes <code>xₜ = aₜxₜ₋₁ + bₜuₜ</code> exactly. The gates are shown rather than learned, so their effect is inspectable.</p>
    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{Object.keys(PRESETS).map(name => <button type="button" key={name} onClick={() => setPreset(name)} style={{ border: `1px solid ${preset === name ? C.accent : C.border}`, background: preset === name ? 'var(--accent-dim)' : 'var(--bg3)', color: preset === name ? C.accent : 'var(--text-mid)', borderRadius: 4, padding: '5px 9px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: 'pointer' }}>{name} state</button>)}</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr repeat(4, .8fr)', gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 5, overflow: 'hidden', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
      {['token', 'uₜ', 'retain aₜ', 'write bₜ', 'state xₜ'].map(h => <div key={h} style={{ background: 'var(--bg3)', padding: 8, color: C.muted }}>{h}</div>)}
      {trace.flatMap((r, i) => [<div key={`${i}-t`} style={{ background: 'var(--code-bg)', padding: 8, color: 'var(--text)' }}>{r.t}</div>, <div key={`${i}-u`} style={{ background: 'var(--code-bg)', padding: 8 }}>{r.u}</div>, <div key={`${i}-a`} style={{ background: 'var(--code-bg)', padding: 8 }}>{r.retain.toFixed(2)}</div>, <div key={`${i}-b`} style={{ background: 'var(--code-bg)', padding: 8 }}>{r.write.toFixed(2)}</div>, <div key={`${i}-x`} style={{ background: 'var(--code-bg)', padding: 8, color: C.accent }}>{r.state.toFixed(3)}</div>])}
    </div>
  </WidgetCard>;
}
