import { NavLink, useLocation } from "react-router-dom";
import { PARTS, chapterPath } from "../../data/chapters";

// ─── Chapter data lives in src/data/chapters.js (single source of truth,
// shared with Topbar). ────────────────────────────────────────────────────

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  sidebar: {
    width: "252px",
    minWidth: "252px",
    background: "var(--bg2)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    height: "100%",
  },
  logoArea: {
    padding: "22px 20px 18px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  logoMark: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginBottom: "4px",
  },
  logoIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "5px",
    background: "var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    color: "#000",
    fontFamily: "'JetBrains Mono', monospace",
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: ".04em",
    color: "var(--text)",
    fontFamily: "'JetBrains Mono', monospace",
  },
  logoSub: {
    fontSize: "11px",
    color: "var(--text-muted)",
    paddingLeft: "33px",
  },
  section: {
    padding: "12px 0 4px",
  },
  sectionLabel: {
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: ".12em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    padding: "0 18px",
    marginBottom: "4px",
  },
  divider: {
    height: "1px",
    background: "var(--border)",
    margin: "4px 18px 0",
  },
};

function ChapterItem({ chapter, partColor }) {
  const location = useLocation();
  const isActive = location.pathname === chapter.path ||
    location.pathname.startsWith(chapter.path + "/");

  const itemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 18px",
    cursor: chapter.live ? "pointer" : "default",
    fontSize: "12.5px",
    color: isActive ? partColor : "var(--text-muted)",
    background: isActive ? "var(--accent-dim)" : "transparent",
    borderLeft: isActive ? `2px solid ${partColor}` : "2px solid transparent",
    textDecoration: "none",
    transition: "all .12s ease",
    userSelect: "none",
  };

  const numStyle = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: isActive ? partColor : "var(--border-lt)",
    minWidth: "20px",
    flexShrink: 0,
    opacity: isActive ? 0.7 : 1,
  };

  const badgeStyle = chapter.live
    ? {
        fontSize: "9px",
        padding: "2px 5px",
        borderRadius: "3px",
        background: isActive ? "var(--accent-dim)" : "var(--bg4)",
        color: isActive ? partColor : "var(--text-muted)",
        flexShrink: 0,
        fontFamily: "'JetBrains Mono', monospace",
      }
    : {
        fontSize: "9px",
        padding: "2px 5px",
        borderRadius: "3px",
        background: "var(--bg4)",
        color: "var(--border-lt)",
        flexShrink: 0,
        fontFamily: "'JetBrains Mono', monospace",
      };

  const content = (
    <>
      <span style={numStyle}>{chapter.num}</span>
      <span style={{ flex: 1 }}>{chapter.title}</span>
      <span style={badgeStyle}>
        {chapter.live ? chapter.widgets : "soon"}
      </span>
    </>
  );

  if (chapter.live) {
    return (
      <NavLink
        to={chapter.path}
        style={({ isActive: navActive }) => ({
          ...itemStyle,
          color: navActive ? partColor : "var(--text-muted)",
          background: navActive ? "var(--accent-dim)" : "transparent",
          borderLeft: navActive ? `2px solid ${partColor}` : "2px solid transparent",
        })}
        onMouseEnter={e => {
          if (!e.currentTarget.classList.contains("active-nav")) {
            e.currentTarget.style.color = "var(--text)";
            e.currentTarget.style.background = "var(--bg3)";
          }
        }}
        onMouseLeave={e => {
          const isNavActive = location.pathname === chapter.path ||
            location.pathname.startsWith(chapter.path + "/");
          e.currentTarget.style.color = isNavActive ? partColor : "var(--text-muted)";
          e.currentTarget.style.background = isNavActive ? "var(--accent-dim)" : "transparent";
        }}
      >
        {({ isActive: navActive }) => (
          <>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: navActive ? partColor : "var(--border-lt)",
              minWidth: "20px",
              flexShrink: 0,
              opacity: navActive ? 0.7 : 1,
            }}>
              {chapter.num}
            </span>
            <span style={{ flex: 1 }}>{chapter.title}</span>
            <span style={{
              fontSize: "9px",
              padding: "2px 5px",
              borderRadius: "3px",
              background: navActive ? "var(--accent-dim)" : "var(--bg4)",
              color: navActive ? partColor : "var(--text-muted)",
              flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {chapter.widgets}
            </span>
          </>
        )}
      </NavLink>
    );
  }

  return (
    <div
      style={itemStyle}
      onMouseEnter={e => {
        e.currentTarget.style.color = "var(--text-mid)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      {content}
    </div>
  );
}

export default function Sidebar() {
  return (
    <nav style={s.sidebar}>
      {/* Logo */}
      <div style={s.logoArea}>
        <div style={s.logoMark}>
          <div style={s.logoIcon}>ML</div>
          <div style={s.logoTitle}>darvinyi-textbook</div>
        </div>
        <div style={s.logoSub}>Interactive Machine Learning</div>
      </div>

      {/* Parts + chapters */}
      {PARTS.map((part, pi) => (
        <div key={pi}>
          {pi > 0 && <div style={s.divider} />}
          <div style={s.section}>
            <div style={{ ...s.sectionLabel, color: part.color, opacity: 0.7 }}>
              {part.label}
            </div>
            {part.chapters.map(ch => (
              <ChapterItem
                key={ch.num}
                chapter={{ ...ch, path: chapterPath(ch.num) }}
                partColor={part.color}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
