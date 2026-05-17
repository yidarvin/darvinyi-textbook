export default function SectionTitle({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginTop: 'var(--section-title-margin-top, 48px)',
        marginBottom: 'var(--section-title-margin-bottom, 20px)',
      }}
    >
      <h2
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: 'var(--section-title-size, 26px)',
          fontWeight: 600,
          color: 'var(--text)',
          margin: 0,
          lineHeight: 1.2,
          flexShrink: 0,
        }}
      >
        {children}
      </h2>

      {/* Decorative gradient line to the right */}
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(to right, var(--border-lt), transparent)',
          minWidth: '20px',
        }}
      />
    </div>
  );
}
