import { useNavigate } from "react-router-dom";

// ─── Ordered chapter list for prev/next navigation ───────────────────────────
const CHAPTERS = [
  { num: "01", title: "Statistical Learning",    part: "Foundations",         path: "/ch/01", live: true },
  { num: "02", title: "Neural Networks",          part: "Foundations",         path: "/ch/02", live: true },
  { num: "03", title: "Optimization",             part: "Foundations",         path: "/ch/03", live: true },
  { num: "04", title: "Training Techniques",      part: "Architectures",       path: "/ch/04", live: false },
  { num: "05", title: "Convolutional Nets",       part: "Architectures",       path: "/ch/05", live: false },
  { num: "06", title: "Recurrent Networks",       part: "Architectures",       path: "/ch/06", live: false },
  { num: "07", title: "Attention",                part: "Architectures",       path: "/ch/07", live: false },
  { num: "08", title: "Transformers",             part: "Architectures",       path: "/ch/08", live: false },
  { num: "09", title: "Multimodal Networks",      part: "Architectures",       path: "/ch/09", live: false },
  { num: "10", title: "Capsule Networks",         part: "Architectures",       path: "/ch/10", live: false },
  { num: "11", title: "Variational Autoencoders", part: "Generative",          path: "/ch/11", live: false },
  { num: "12", title: "GANs",                     part: "Generative",          path: "/ch/12", live: false },
  { num: "13", title: "Diffusion Models",         part: "Generative",          path: "/ch/13", live: false },
  { num: "14", title: "Graph Neural Nets",        part: "Advanced",            path: "/ch/14", live: false },
  { num: "15", title: "Datasets & Benchmarks",    part: "Advanced",            path: "/ch/15", live: false },
  { num: "16", title: "Reinforcement Learning",   part: "Reinforcement Learning", path: "/ch/16", live: false },
  { num: "17", title: "AI Agents",                part: "AI Agents",           path: "/ch/17", live: false },
];

const HOME = { num: null, title: "Home", part: null, path: "/" };

// ─── Derive breadcrumb + prev/next from current path ─────────────────────────
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
