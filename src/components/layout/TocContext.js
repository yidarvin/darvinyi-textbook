import { createContext, useContext, useEffect } from "react";

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
