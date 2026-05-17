import katex from 'katex';

export default function InlineMath({ children }) {
  const raw = typeof children === 'string' ? children : String(children ?? '');

  let html;
  try {
    html = katex.renderToString(raw, {
      displayMode: false,
      throwOnError: false,
      strict: false,
      output: 'html',
    });
  } catch {
    html = raw;
  }

  return (
    <span
      style={{
        color: 'var(--math-color)',
        whiteSpace: 'nowrap',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
