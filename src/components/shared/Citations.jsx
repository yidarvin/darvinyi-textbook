const TAG_STYLES = {
  seminal: {
    background: '#2e1a0d',
    color: 'var(--orange)',
  },
  survey: {
    background: '#0d2e2b',
    color: 'var(--accent)',
  },
  paper: {
    background: '#1a1a2e',
    color: 'var(--purple)',
  },
};

function CitationTag({ tag }) {
  const style = TAG_STYLES[tag] ?? TAG_STYLES.paper;
  return (
    <span
      style={{
        ...style,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: '3px',
        flexShrink: 0,
        alignSelf: 'flex-start',
        marginTop: '2px',
      }}
    >
      {tag}
    </span>
  );
}

export default function Citations({ citations = [] }) {
  if (!citations.length) return null;

  return (
    <div
      style={{
        marginTop: '64px',
        borderTop: '1px solid var(--border)',
        paddingTop: '32px',
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9.5px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '20px',
        }}
      >
        References
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {citations.map((c) => (
          <div
            key={c.num}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            {/* Citation number */}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: 'var(--text-muted)',
                flexShrink: 0,
                minWidth: '28px',
                paddingTop: '1px',
              }}
            >
              [{c.num}]
            </span>

            {/* Citation body */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 400,
                  color: 'var(--text)',
                  lineHeight: 1.4,
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginTop: '2px',
                  lineHeight: 1.4,
                }}
              >
                {[c.authors, c.venue, c.year].filter(Boolean).join(' — ')}
              </div>
            </div>

            {/* Tag */}
            {c.tag && <CitationTag tag={c.tag} />}
          </div>
        ))}
      </div>
    </div>
  );
}
