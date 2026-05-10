import katex from 'katex';

export default function MathBlock({ children }) {
  const isLatex = typeof children === 'string' && children.trim().startsWith('$');

  if (isLatex) {
    // Strip surrounding $ or $$ delimiters
    const raw = children.trim();
    const displayMode = raw.startsWith('$$');
    const inner = displayMode
      ? raw.slice(2, raw.endsWith('$$') ? raw.length - 2 : raw.length).trim()
      : raw.slice(1, raw.endsWith('$') ? raw.length - 1 : raw.length).trim();

    let html;
    try {
      html = katex.renderToString(inner, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      html = inner;
    }

    return (
      <div
        style={{
          background: 'var(--code-bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '18px 24px',
          margin: '24px 0',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          color: 'var(--math-color)',
          textAlign: 'center',
          lineHeight: 2,
          overflowX: 'auto',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Plain unicode / text math
  return (
    <div
      style={{
        background: 'var(--code-bg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '18px 24px',
        margin: '24px 0',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px',
        color: 'var(--math-color)',
        textAlign: 'center',
        lineHeight: 2,
        overflowX: 'auto',
      }}
    >
      {children}
    </div>
  );
}
