import { useState, useEffect, useRef, createContext, useContext } from "react";

// ─── Context so chapter pages can register their headings ────────────────────
export const TocContext = createContext({ sections: [], setActivePath: () => {} });

// ─── Hook page components use to push their section list into the TOC ────────
// Usage: useTocSections([{ id: "forward-pass", label: "The Forward Pass" }, ...])
export function useTocSections(sections) {
  const { setSections } = useContext(TocContext);
  useEffect(() => {
    setSections(sections);
    return () => setSections([]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Provider lives inside Layout, stores the active section list ─────────────
export function TocProvider({ children }) {
  const [sections, setSections] = useState([]);
  return (
    <TocContext.Provider value={{ sections, setSections }}>
      {children}
    </TocContext.Provider>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const railStyle = {
  width: "var(--toc-rail-width, 180px)",
  minWidth: "var(--toc-rail-width, 180px)",
  flexShrink: 0,
  background: "var(--bg2)",
  borderLeft: "1px solid var(--border)",
  overflowY: "auto",
  height: "100%",
  display: "var(--toc-rail-display, block)",
};

const innerStyle = {
  padding: "36px 0 36px 16px",
};

const labelStyle = {
  fontSize: "9.5px",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: ".12em",
  color: "var(--text-muted)",
  marginBottom: "12px",
};

function TocItem({ id, label, active, onClick }) {
  const style = {
    fontSize: "12px",
    color: active ? "var(--accent)" : "var(--text-muted)",
    padding: "5px 10px",
    borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
    cursor: "pointer",
    transition: "all .12s",
    marginBottom: "1px",
    lineHeight: "1.4",
    width: "100%",
    textAlign: "left",
    background: "transparent",
    borderTop: 0,
    borderRight: 0,
    borderBottom: 0,
  };

  return (
    <button
      type="button"
      style={style}
      aria-current={active ? "location" : undefined}
      onClick={() => onClick(id)}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = "var(--text-mid)";
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      {label}
    </button>
  );
}

// ─── Main TOC Rail ────────────────────────────────────────────────────────────
export default function TocRail() {
  const { sections } = useContext(TocContext);
  const [activeId, setActiveId] = useState(null);
  const observerRef = useRef(null);

  // Wire up IntersectionObserver whenever section list changes
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!sections.length) {
      setActiveId(null);
      return;
    }

    const candidates = sections.map(s => document.getElementById(s.id)).filter(Boolean);

    if (!candidates.length) return;

    // Track which sections are currently intersecting
    const visibleSet = new Set();

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleSet.add(entry.target.id);
          } else {
            visibleSet.delete(entry.target.id);
          }
        });

        // Activate topmost visible section (or the last one we passed)
        if (visibleSet.size > 0) {
          // Pick whichever section appears earliest in the sections array
          for (const section of sections) {
            if (visibleSet.has(section.id)) {
              setActiveId(section.id);
              return;
            }
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    candidates.forEach(el => observerRef.current.observe(el));

    // Set first section as default active on mount
    setActiveId(sections[0].id);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [sections]);

  function scrollToSection(id) {
    const el = document.getElementById(id);
    const scrollContainer = document.getElementById("content-scroll");
    if (!el || !scrollContainer) return;
    // The window never scrolls in this layout — #content-scroll is the only
    // scrollable element — so the target must be computed relative to its own
    // scroll position, not window.scrollY (which is always 0 here).
    const offset = 20;
    const y = scrollContainer.scrollTop
      + el.getBoundingClientRect().top
      - scrollContainer.getBoundingClientRect().top
      - offset;
    scrollContainer.scrollTo({ top: y, behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
  }

  if (!sections.length) {
    return <div id="toc-rail" style={railStyle} />;
  }

  return (
    <div id="toc-rail" style={railStyle}>
      <div style={innerStyle}>
        <div style={labelStyle}>On this page</div>
        {sections.map(s => (
          <TocItem
            key={s.id}
            id={s.id}
            label={s.label}
            active={activeId === s.id}
            onClick={scrollToSection}
          />
        ))}
      </div>
    </div>
  );
}
