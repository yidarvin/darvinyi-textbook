export default function ScrollableFigure({ children, caption, minWidth = 640 }) {
  return (
    <figure
      style={{
        margin: "32px 0",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div style={{ minWidth: `${minWidth}px` }}>{children}</div>
      {caption && (
        <figcaption
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "#94a3b8",
            marginTop: "12px",
            lineHeight: 1.5,
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
