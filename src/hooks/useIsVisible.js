import { useState, useEffect, useRef } from "react";

/**
 * Tracks whether a DOM node is on-screen via IntersectionObserver.
 * Returns [ref, isVisible] — attach `ref` to the node to observe.
 * Defaults to visible when IntersectionObserver is unavailable (SSR/old browsers).
 */
export function useIsVisible(options) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver !== "function") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05, ...options }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, isVisible];
}
