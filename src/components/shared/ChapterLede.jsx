export default function ChapterLede({ children }) {
  return (
    <p
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 'var(--lede-size, 15px)',
        fontWeight: 400,
        color: '#b8c4cc',
        lineHeight: 'var(--lede-line-height, 1.75)',
        margin: 'var(--lede-margin, 20px 0 36px)',
        paddingLeft: 'var(--lede-padding-left, 16px)',
        borderLeft: '3px solid var(--accent)',
      }}
    >
      {children}
    </p>
  );
}
