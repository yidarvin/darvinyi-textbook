import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: "var(--chapter-max-width, 740px)",
        margin: "0 auto",
        padding: "var(--chapter-padding, 52px 44px 100px)",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "var(--chapter-meta-size, 10.5px)",
          fontWeight: 400,
          letterSpacing: "0.1em",
          color: "var(--accent)",
          opacity: 0.7,
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        404
      </div>

      <h1
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: "var(--h1-size, 42px)",
          fontWeight: 600,
          color: "var(--text)",
          margin: "0 0 20px",
          lineHeight: "var(--h1-line-height, 1.15)",
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "var(--prose-size, 15px)",
          color: "#b8c4cc",
          lineHeight: "var(--prose-line-height, 1.75)",
          margin: "0 0 28px",
        }}
      >
        There's no chapter at this address. It may have moved, or the link may
        be out of date.
      </p>

      <Link
        to="/"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "13px",
          color: "var(--accent)",
          textDecoration: "none",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          padding: "8px 16px",
          display: "inline-block",
        }}
      >
        ← Back to the table of contents
      </Link>
    </div>
  );
}
