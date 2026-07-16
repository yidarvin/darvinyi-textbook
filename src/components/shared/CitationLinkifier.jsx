import { useEffect, useRef } from "react";

const MARKER = /\[(\d+)\]/g;
const EXCLUDED_ANCESTORS = [
  "a",
  "button",
  "code",
  "pre",
  "script",
  "style",
  "svg",
  ".katex",
  ".widget-card",
  "[data-citation-list]",
].join(", ");

function citationTarget(root, number) {
  return root.querySelector(`[id="ref-${number}"]`);
}

function linkifyMarkers(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.includes("[")) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(EXCLUDED_ANCESTORS)) {
        return NodeFilter.FILTER_REJECT;
      }

      MARKER.lastIndex = 0;
      let match;
      while ((match = MARKER.exec(node.nodeValue))) {
        if (citationTarget(root, match[1])) return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const text = node.nodeValue;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let linked = false;

    MARKER.lastIndex = 0;
    let match;
    while ((match = MARKER.exec(text))) {
      const target = citationTarget(root, match[1]);
      if (!target) continue;

      fragment.append(text.slice(lastIndex, match.index));
      const link = document.createElement("a");
      link.className = "citation-marker";
      link.href = `#ref-${match[1]}`;
      link.setAttribute("aria-label", `Jump to reference ${match[1]}`);
      link.title = `Jump to reference ${match[1]}`;
      link.textContent = match[0];
      fragment.append(link);
      lastIndex = match.index + match[0].length;
      linked = true;
    }

    if (linked) {
      fragment.append(text.slice(lastIndex));
      node.replaceWith(fragment);
    }
  }
}

/**
 * Turns the books' uniform [N] citation markers into links after a lazy chapter
 * has rendered. Keeping the transformation at the chapter boundary avoids 25
 * parallel marker implementations while preserving each chapter's prose markup.
 */
export default function CitationLinkifier({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const process = () => linkifyMarkers(root);
    process();

    // A lazy route initially renders its Suspense fallback. Observe until its
    // references arrive, then stop; widgets do not need this transformation.
    if (root.querySelector("[data-citation-list]")) return undefined;

    const observer = new MutationObserver(() => {
      process();
      if (root.querySelector("[data-citation-list]")) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
