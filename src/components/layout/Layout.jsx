import { useContext, useEffect, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TocRail, { TocContext, TocProvider } from "./TocRail";
import MobileNav from "./MobileNav";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { findChapterByPath } from "../../data/chapters";

const SITE_TITLE = "darvinyi-textbook";

// ─── Styles ──────────────────────────────────────────────────────────────────
const rootStyle = {
  display: "flex",
  height: "100vh",
  overflow: "hidden",
  background: "var(--bg)",
  fontFamily: "'Inter', sans-serif",
  WebkitFontSmoothing: "antialiased",
};

const mainStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  minWidth: 0,
};

const contentWrapStyle = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const contentScrollStyle = {
  flex: 1,
  overflowY: "auto",
  minWidth: 0,
};

const contentInnerStyle = {
  maxWidth: "var(--chapter-max-width, 740px)",
  margin: "0 auto",
  padding: "var(--chapter-padding, 52px 44px 100px)",
};

// ─── MobileNavMount: reads sections from TocContext and renders MobileNav.
// Wrapped with data-mobile-only so it's hidden on desktop via CSS.
function MobileNavMount() {
  const { sections } = useContext(TocContext);
  if (!sections.length) return null;
  return (
    <div data-mobile-only>
      <MobileNav sections={sections} />
    </div>
  );
}

// ─── MobileSidebarDrawer: slide-out drawer wrapping the Sidebar on mobile.
function MobileSidebarDrawer({ open, onClose }) {
  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.18s ease",
          zIndex: 90,
        }}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chapters"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(280px, 84vw)",
          background: "var(--bg2)",
          borderRight: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s ease",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Sidebar />
      </div>
    </>
  );
}

function HamburgerButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open chapter menu"
      data-mobile-only
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: 6,
        width: 36,
        height: 36,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text)",
        cursor: "pointer",
        flexShrink: 0,
        padding: 0,
        marginRight: 6,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M2 4h12M2 8h12M2 12h12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

// ─── On route change: scroll #content-scroll to the top, or to the section
// named by the URL hash if one is present (shareable deep links). Chapter
// pages are React.lazy, so the target section's element may not exist in the
// DOM yet on the first effect run — poll a few frames until it mounts.
function scrollToHashOrTop(hash) {
  const scrollContainer = document.getElementById("content-scroll");
  if (!scrollContainer) return;

  if (!hash) {
    scrollContainer.scrollTo({ top: 0 });
    return;
  }

  const id = hash.slice(1);
  const offset = 20;
  let attempts = 0;
  const tryScroll = () => {
    const el = document.getElementById(id);
    if (el) {
      const y = scrollContainer.scrollTop
        + el.getBoundingClientRect().top
        - scrollContainer.getBoundingClientRect().top
        - offset;
      scrollContainer.scrollTo({ top: y });
      return;
    }
    attempts += 1;
    if (attempts < 60) requestAnimationFrame(tryScroll);
  };
  tryScroll();
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer whenever the route changes (e.g. user picks a chapter)
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Reset scroll position on navigation — either to the top of the new
  // chapter, or to the section named by a URL hash (deep link / TOC click).
  useEffect(() => {
    scrollToHashOrTop(location.hash);
  }, [location.pathname, location.hash]);

  // Per-route document.title — every chapter, tab, and bookmark otherwise
  // shows the same static title.
  useEffect(() => {
    if (location.pathname === "/") {
      document.title = SITE_TITLE;
      return;
    }
    const chapter = findChapterByPath(location.pathname);
    document.title = chapter
      ? `Ch ${chapter.num} · ${chapter.title} — ${SITE_TITLE}`
      : `Page not found — ${SITE_TITLE}`;
  }, [location.pathname]);

  // Close drawer when switching to desktop
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  return (
    <TocProvider>
      <div id="app-shell" style={rootStyle}>
        {/* Left sidebar — sticky on desktop, drawer on mobile */}
        {!isMobile && <Sidebar />}
        {isMobile && (
          <MobileSidebarDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />
        )}

        {/* Main column: topbar + scrollable content + right TOC */}
        <div id="main-column" style={mainStyle}>
          <Topbar
            pathname={location.pathname}
            isMobile={isMobile}
            HamburgerSlot={
              isMobile ? (
                <HamburgerButton onClick={() => setDrawerOpen(true)} />
              ) : null
            }
          />

          <div id="content-wrap" style={contentWrapStyle}>
            {/* Scrollable content area */}
            <div id="content-scroll" style={contentScrollStyle}>
              <MobileNavMount />
              <div style={contentInnerStyle}>
                <Outlet />
              </div>
            </div>

            {/* Right TOC rail — sticky, independently scrollable (CSS hides on mobile) */}
            <TocRail />
          </div>
        </div>
      </div>
    </TocProvider>
  );
}
