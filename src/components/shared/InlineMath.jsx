export default function InlineMath({ children }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '12.5px',
        fontWeight: 400,
        color: 'var(--math-color)',
        background: 'var(--code-bg)',
        border: '1px solid var(--border-lt)',
        padding: '1px 7px',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
