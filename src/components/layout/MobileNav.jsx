import { useState, useEffect, useRef } from "react";

export default function MobileNav({ sections }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState(sections[0]?.id || "");
  const observerRef = useRef(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!sections.length) return;

    const candidates = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    if (!candidates.length) return;

    const visibleSet = new Set();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visibleSet.add(e.target.id);
          else visibleSet.delete(e.target.id);
        });
        if (visibleSet.size > 0) {
          for (const s of sections) {
            if (visibleSet.has(s.id)) {
              setActiveId(s.id);
              return;
            }
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    candidates.forEach((el) => observerRef.current.observe(el));
    setActiveId(sections[0].id);

    return () => observerRef.current?.disconnect();
  }, [sections]);

  function go(id) {
    setIsOpen(false);
    const el = document.getElementById(id);
    const scrollContainer = document.getElementById("content-scroll");
    if (!el || !scrollContainer) return;
    // Same fix as TocRail: window never scrolls here, so the target must be
    // relative to the scroll container's own position, not window.scrollY.
    const offset = 16;
    const y = scrollContainer.scrollTop
      + el.getBoundingClientRect().top
      - scrollContainer.getBoundingClientRect().top
      - offset;
    scrollContainer.scrollTo({ top: y, behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
  }

  if (!sections.length) return null;

  const activeLabel =
    sections.find((s) => s.id === activeId)?.label || "On this page";

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--bg2)",
        borderBottom: "1px solid var(--border)",
        padding: "0 16px",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-list"
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          background: "transparent",
          border: "none",
          color: "var(--text)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          textAlign: "left",
          padding: "12px 0",
          cursor: "pointer",
          minHeight: "44px",
          letterSpacing: "0.04em",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            On this page
          </span>
          <span
            style={{
              color: "var(--accent)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "60vw",
            }}
          >
            {activeLabel}
          </span>
        </span>
        <span style={{ opacity: 0.6, color: "var(--text-mid)" }}>
          {isOpen ? "▴" : "▾"}
        </span>
      </button>
      {isOpen && (
        <ul
          id="mobile-nav-list"
          style={{
            listStyle: "none",
            padding: "4px 0 12px",
            margin: 0,
            borderTop: "1px solid var(--border)",
          }}
        >
          {sections.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => go(s.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  borderLeft:
                    s.id === activeId
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  padding: "10px 10px",
                  color: s.id === activeId ? "var(--accent)" : "var(--text-mid)",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
