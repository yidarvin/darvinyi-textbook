---
name: widget-patterns
description: Validated implementation patterns for widgets in this textbook — canvas, SVG, stats panel placement
metadata:
  type: feedback
---

Standard canvas pattern used in ch05 widgets (GloVeFastText, ContextualEmbeddings):
```jsx
const drawFn = useCallback(() => {
  const canvas = ref.current;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  // draw using rect.width / rect.height
}, [deps]);

useEffect(() => { drawFn(); }, [drawFn]);
useEffect(() => {
  const obs = new ResizeObserver(() => drawFn());
  if (ref.current) obs.observe(ref.current);
  return () => obs.disconnect();
}, [drawFn]);
```

SVG: always `viewBox="0 0 VW VH" width="100%"`, never fixed pixel width.

**Stats panel placement:** 2 side-by-side panels + 180px stats = 3 visual columns. Math: 616−180−12 = 424px ÷ 2 = 212px each. Just over 180px minimum — works but tight. For 3+ true visual columns, always move stats below as a horizontal strip.

**Bar charts with negative values:** Extend y-axis to [−1, 1] with baseline at 0. Draw positive bars upward, negative bars downward. More informative than clamping to [0,1] when cosine sims go negative.

**Why:** These patterns were confirmed working across multiple ch05 widgets.
**How to apply:** Copy the canvas boilerplate verbatim; derive VW/VH from layout arithmetic before writing.
