import { Link } from "react-router-dom";
import { PARTS, CHAPTERS, chapterPath } from "../data/chapters";

const heroWrap = {
  padding: "72px 0 56px",
  borderBottom: "1px solid var(--border)",
  marginBottom: "48px",
};

const eyebrow = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "10.5px",
  fontWeight: 400,
  letterSpacing: "0.1em",
  color: "var(--accent)",
  opacity: 0.7,
  textTransform: "uppercase",
  marginBottom: "12px",
};

const h1Style = {
  fontFamily: "'Crimson Pro', serif",
  fontSize: "48px",
  fontWeight: 600,
  color: "var(--text)",
  margin: "0 0 20px",
  lineHeight: 1.15,
};

const pitch = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "16px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.7,
  margin: "0 0 32px",
  maxWidth: "620px",
};

const ctaStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontFamily: "'Inter', sans-serif",
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--accent)",
  background: "var(--accent-dim)",
  border: "1px solid var(--accent)",
  borderRadius: "8px",
  padding: "11px 20px",
  textDecoration: "none",
};

const partSectionStyle = {
  marginBottom: "44px",
};

const partLabelStyle = (color) => ({
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color,
  marginBottom: "16px",
});

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "12px",
};

const cardBase = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "16px 18px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--bg2)",
  textDecoration: "none",
};

const cardNumStyle = (color) => ({
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "11px",
  color,
  opacity: 0.8,
});

const cardTitleStyle = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--text)",
  lineHeight: 1.35,
};

const cardMetaStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "10.5px",
  color: "var(--text-mid)",
};

function ChapterCard({ chapter, color }) {
  const content = (
    <>
      <span style={cardNumStyle(color)}>{chapter.num}</span>
      <span style={cardTitleStyle}>{chapter.title}</span>
      <span style={cardMetaStyle}>
        {chapter.live ? `${chapter.widgets} widgets` : "Coming soon"}
      </span>
    </>
  );

  if (!chapter.live) {
    return (
      <div style={{ ...cardBase, opacity: 0.45, cursor: "default" }}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={chapterPath(chapter.num)}
      style={cardBase}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-lt)";
        e.currentTarget.style.background = "var(--bg3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "var(--bg2)";
      }}
    >
      {content}
    </Link>
  );
}

export default function Home() {
  const firstChapter = CHAPTERS[0];

  return (
    <div>
      <div style={heroWrap}>
        <div style={eyebrow}>Interactive Machine Learning</div>
        <h1 style={h1Style}>darvinyi-textbook</h1>
        <p style={pitch}>
          A textbook you feel your way through. Every concept — from bias-
          variance tradeoffs to attention mechanisms to diffusion models —
          pairs prose with a live widget you can drag, break, and rebuild,
          across {CHAPTERS.length} chapters spanning statistical learning,
          deep architectures, large language models, generative models, and
          AI agents.
        </p>
        {firstChapter && (
          <Link to={chapterPath(firstChapter.num)} style={ctaStyle}>
            Start with Chapter {firstChapter.num} — {firstChapter.title} →
          </Link>
        )}
      </div>

      {PARTS.map((part) => (
        <div key={part.label} style={partSectionStyle}>
          <div style={partLabelStyle(part.color)}>{part.label}</div>
          <div style={gridStyle}>
            {part.chapters.map((chapter) => (
              <ChapterCard key={chapter.num} chapter={chapter} color={part.color} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
