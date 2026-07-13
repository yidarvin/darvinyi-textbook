import { useNavigate } from "react-router-dom";
import { CHAPTERS } from "../../data/chapters";

const HOME = { num: null, title: "Home", part: null, path: "/" };

// ─── Derive breadcrumb + prev/next from current path ─────────────────────────
// Chapter data (order, titles, parts) lives in src/data/chapters.js — the same
// source Sidebar reads from, so the two can never drift again.
function useChapterNav(pathname) {
  if (pathname === "/" || !pathname.startsWith("/ch/")) {
    return {
      current: HOME,
      prev: null,
      next: CHAPTERS[0],
    };
  }

  const idx = CHAPTERS.findIndex(c => pathname === c.path || pathname.startsWith(c.path + "/"));
  if (idx === -1) {
    return { current: HOME, prev: null, next: null };
  }

  return {
    current: CHAPTERS[idx],
    prev: idx > 0 ? CHAPTERS[idx - 1] : null,
    next: idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null,
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const topbarStyle = {
  height: "var(--topbar-height, 52px)",
  minHeight: "var(--topbar-height, 52px)",
  background: "var(--bg2)",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  padding: "0 var(--topbar-padding-x, 28px)",
  gap: "10px",
  flexShrink: 0,
};

const breadcrumbStyle = {
  fontSize: "11.5px",
  color: "var(--text-muted)",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "'Inter', sans-serif",
  overflow: "hidden",
};

const sepStyle = {
  opacity: 0.4,
  flexShrink: 0,
};

const currentStyle = {
  color: "var(--text-mid)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const rightStyle = {
  marginLeft: "auto",
  display: "flex",
  gap: "6px",
  alignItems: "center",
  flexShrink: 0,
};

function NavBtn({ label, primary, onClick, disabled, "aria-label": ariaLabel }) {
  const base = {
    fontSize: "11px",
    padding: "4px 12px",
    borderRadius: "5px",
    cursor: disabled ? "default" : "pointer",
    border: "1px solid var(--border)",
    transition: "all .12s",
    fontFamily: "'Inter', sans-serif",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.3 : 1,
    background: primary ? "var(--accent-dim)" : "var(--bg3)",
    color: primary ? "var(--accent)" : "var(--text-muted)",
    borderColor: primary ? "var(--accent)" : "var(--border)",
  };

  return (
    <button
      style={base}
      aria-label={ariaLabel}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.color = primary ? "var(--accent)" : "var(--text)";
          e.currentTarget.style.borderColor = primary ? "var(--accent)" : "var(--border-lt)";
          if (primary) e.currentTarget.style.opacity = "1";
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.color = primary ? "var(--accent)" : "var(--text-muted)";
          e.currentTarget.style.borderColor = primary ? "var(--accent)" : "var(--border)";
          if (primary) e.currentTarget.style.opacity = "0.85";
        }
      }}
    >
      {label}
    </button>
  );
}

export default function Topbar({ pathname, HamburgerSlot, isMobile = false }) {
  const navigate = useNavigate();
  const { current, prev, next } = useChapterNav(pathname);

  const isHome = pathname === "/" || !pathname.startsWith("/ch/");

  return (
    <div style={topbarStyle}>
      {HamburgerSlot}
      {/* Breadcrumb */}
      <div style={breadcrumbStyle}>
        {!isMobile && <span>darvinyi-textbook</span>}
        {!isMobile && !isHome && current.part && (
          <>
            <span style={sepStyle}>›</span>
            <span style={{ flexShrink: 0 }}>{current.part}</span>
          </>
        )}
        {!isHome && (
          <>
            {!isMobile && <span style={sepStyle}>›</span>}
            <span style={currentStyle}>{current.title}</span>
          </>
        )}
        {isHome && (
          <>
            {!isMobile && <span style={sepStyle}>›</span>}
            <span style={currentStyle}>Table of Contents</span>
          </>
        )}
      </div>

      {/* Prev / Next */}
      {!isHome && (
        <div style={rightStyle}>
          <NavBtn
            label={isMobile ? "←" : prev ? `← ${prev.title}` : "← Prev"}
            primary={false}
            disabled={!prev}
            onClick={() => prev && navigate(prev.path)}
            aria-label={prev ? `Previous: ${prev.title}` : "Previous"}
          />
          <NavBtn
            label={isMobile ? "→" : next ? `${next.title} →` : "Next →"}
            primary={true}
            disabled={!next}
            onClick={() => next && navigate(next.path)}
            aria-label={next ? `Next: ${next.title}` : "Next"}
          />
        </div>
      )}
    </div>
  );
}
