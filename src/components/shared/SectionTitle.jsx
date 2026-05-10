export default function SectionTitle({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        margin: '48px 0 20px',
      }}
    >
      <h2
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: '26px',
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
