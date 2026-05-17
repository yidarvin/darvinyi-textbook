---
name: project-overview
description: Core facts about the darvinyi-textbook project — stack, constraints, widget count
metadata:
  type: project
---

Interactive ML textbook built in React+Vite. Dark mode only. No backend, no runtime ML inference.

**Why:** Distill.pub-style pedagogy: ~3-5 sentences prose then a live widget to "feel" the math.

**Stack:** React, Vite, TailwindCSS, KaTeX, D3/Recharts. Deployed on Vercel.

**Content:** 17 chapters (~75 widgets total). Ch 1-3 are V1 scope; rest scaffolded.

**Key constraints:**
- 616px usable widget width (740px content − 88px padding)
- Stats panel right (180px) only for single-canvas widgets; move below for 2+ side-by-side charts
- All embedding/simulation values are fixed constants — no runtime ML
- SVG must use viewBox + width="100%" (never fixed px width)
- Canvas: always scale by devicePixelRatio; use ResizeObserver for responsive sizing

**How to apply:** When building widgets, always budget pixel widths before coding; follow the panel-placement rules from WIDGET_SPEC.md.
