export default function ChapterLede({ children }) {
  return (
    <p
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '15px',
        fontWeight: 400,
        color: '#b8c4cc',
        lineHeight: 1.75,
        margin: '20px 0 36px',
        paddingLeft: '16px',
        borderLeft: '3px solid var(--accent)',
      }}
    >
      {children}
    </p>
  );
}
