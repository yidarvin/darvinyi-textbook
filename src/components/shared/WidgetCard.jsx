export default function WidgetCard({ title, number, children }) {
  return (
    <div
      style={{
        background: 'var(--widget-bg, #111111)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
        margin: '28px 0',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--widget-card-header-padding, 12px 18px)',
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* [Interactive] pill */}
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            background: 'var(--accent-dim)',
            padding: '2px 8px',
            borderRadius: '3px',
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
          }}
        >
          Interactive
        </span>

        {/* Title */}
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text)',
            flex: 1,
          }}
        >
          {title}
        </span>

        {/* Number */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 400,
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          {number}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: 'var(--widget-card-padding, 20px 18px)', overflowX: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
