export default function ExerciseCard({ number, children }) {
  return <section style={{ border: '1px solid var(--border)', background: 'var(--bg2)', borderRadius: '7px', padding: '15px 16px', margin: '12px 0' }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '.08em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 7 }}>exercise_{number}</div>
    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', lineHeight: 1.55, color: 'var(--text-mid)' }}>{children}</div>
  </section>;
}
