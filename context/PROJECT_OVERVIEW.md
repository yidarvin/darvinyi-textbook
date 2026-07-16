# darvinyi-textbook — Project Overview

## What This Is

An interactive machine learning textbook deployed as a web application. Think Distill.pub but dark-mode — real depth (derivations, worked examples, closing syntheses) with live interactive widgets embedded as first-class, directed figures throughout.

**Philosophy (V2):** Widgets remain the differentiator, but the book no longer treats them as the *only* teacher. Prose carries real depth; every widget gets a hand-off sentence telling the reader what to try and what to notice, and every widget must faithfully compute what it claims (no fabricated or hard-coded simulations — see [`context/V2_PLAN.md`](V2_PLAN.md) for the audit that drove this change). Full mechanical detail: [`context/STYLE_GUIDE.md`](STYLE_GUIDE.md).

**Target audience:** General CS audience. Assumes programming literacy, linear algebra basics. Does not assume ML background — Chapter 1 (Probability & Information for ML) now exists specifically to teach the probability/information-theory vocabulary the rest of the book relies on.

## Tech Stack

```
Frontend:  React + Vite
Routing:   React Router v7 (one route per chapter, code-split via React.lazy)
Math:      KaTeX (render equations)
Charts:    Custom inline SVG + Canvas for interactive widgets (no D3/Recharts — unused, removed)
Styling:   Inline styles + CSS custom properties (responsive tokens), Tailwind for utility classes
Hosting:   Vercel (static frontend, no backend needed)
No backend, no database, no auth.
```

## Repository Structure

```
darvinyi-textbook/
├── public/
├── src/
│   ├── App.jsx                  # Router setup (lazy-loaded chapter routes)
│   ├── main.jsx
│   ├── index.css                # Global styles + CSS variables (incl. responsive tokens)
│   ├── data/
│   │   ├── chapters.js          # Single source of truth: parts, chapters, routes, titles
│   │   └── citations.js         # Single source of truth: paper metadata, keyed by slug
│   ├── hooks/
│   │   └── useMediaQuery.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx      # Chapter navigation (reads chapters.js)
│   │   │   ├── Topbar.jsx       # Breadcrumb + prev/next (reads chapters.js)
│   │   │   ├── TocRail.jsx      # Right-side table of contents
│   │   │   └── MobileNav.jsx    # Mobile "on this page" nav
│   │   ├── shared/
│   │   │   ├── WidgetCard.jsx   # Wrapper for all interactive widgets (tryThis prop, visibility gating)
│   │   │   ├── MathBlock.jsx    # Block equation renderer
│   │   │   ├── InlineMath.jsx   # Inline equation renderer
│   │   │   ├── Citations.jsx    # Citation list at chapter bottom
│   │   │   └── SectionTitle.jsx # H2 with decorative line
│   │   ├── widgets/              # One folder per chapter
│   │   │   ├── ch01/
│   │   │   ├── ch02/
│   │   │   └── ...
│   │   └── diagrams/              # One folder per chapter (static SVG figures)
│   │       └── ...
│   └── pages/
│       ├── Home.jsx             # Landing / table of contents
│       ├── ch01/
│       └── ...
├── context/                     # NOT deployed — reference/planning files
│   ├── PROJECT_OVERVIEW.md      # This file
│   ├── DESIGN_SYSTEM.md         # Retired pre-V2 reference; see index.css + STYLE_GUIDE.md
│   ├── CURRICULUM.md            # Authoritative 25-chapter, 7-part curriculum
│   ├── STYLE_GUIDE.md           # Editorial standard + notational conventions (V2)
│   ├── V2_PLAN.md               # The full critique + overhaul plan driving current work
│   └── WIDGET_SPEC.md           # Retired pre-V2 reference; see STYLE_GUIDE.md + V2_PLAN.md
├── prompts/
│   └── queue.md                 # V2 build queue (drained by ./runqueue.sh)
├── vite.config.js
├── tailwind.config.js
├── package.json
└── vercel.json
```

## Curriculum Summary (25 chapters, 7 parts — V2)

| Part | Chapters | Focus |
|---|---|---|
| I — Foundations | 1-6 | Probability/information theory, statistical learning, neural nets, optimization, training techniques, convolutional networks |
| II — Language & Sequence | 7-10 | Word embeddings & tokenization, RNNs/LSTMs, attention, transformers |
| III — Large Language Models | 11-15 | LLM architectures, reinforcement learning, LLM training & alignment, efficient inference & deployment, multimodal networks |
| IV — Beyond the Transformer | 16-17 | Graph neural networks, state-space models & attention alternatives |
| V — Generative Models | 18-20 | VAEs, GANs & image-to-image, diffusion models |
| VI — Evaluation & Understanding | 21-23 | Datasets & benchmarks, evaluating LLMs & agents, interpretability |
| VII — AI Agents | 24-25 | AI agents, agent harnesses |

The authoritative per-chapter list lives in [CURRICULUM.md](CURRICULUM.md). The V2 migration from the prior 22-chapter structure is complete. [`V2_PLAN.md`](V2_PLAN.md) preserves its rationale, historical mapping, and per-chapter findings.

## Current Status (2026-07)

The V2 overhaul is complete: all 25 chapters are live in the revised reading order, and the queue records the builder/critic history. `context/CURRICULUM.md` and `src/data/chapters.js` are the current sources of truth; older plans and commits retain the previous 22-chapter structure only as history. Q5 removed the obsolete V1 visual curriculum, mock shell, reference-widget prototype, and OpenCode setup guide rather than leaving executable-looking instructions that conflict with V2. Use this overview, `STYLE_GUIDE.md`, `CURRICULUM.md`, `V2_PLAN.md`, and the live `src/` components instead.

## Routing

```jsx
// App.jsx — each chapter route is explicitly declared with React.lazy +
// Suspense. chapters.js remains the source of truth for navigation, route
// paths, titles, and home-page metadata; it does not generate this route table.
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/ch/01" element={L(ProbabilityAndInformation)} />
  <Route path="/ch/02" element={L(StatisticalLearning)} />
  {/* ... etc, plus a path="*" 404 route */}
</Routes>
```

## Deployment

- **Platform:** Vercel
- **Deploy trigger:** Push to `main` branch
- **Build command:** `npm run build`
- **Queue gate:** `npm run check` (production build plus Playwright route smoke tests)
- **Output dir:** `dist`
- **No env vars needed** (no backend, no API keys)

## Key Constraints

1. **No real model inference** — widgets simulate behavior mathematically, they don't run actual neural networks. All visualizations are computed analytically or via simple JS math, and must faithfully implement the equations they claim to (see `STYLE_GUIDE.md` — widget fidelity is a hard requirement in V2, not a nice-to-have).
2. **No external data fetching at runtime** — everything is self-contained in the bundle.
3. **KaTeX for math** — not MathJax (too slow). Its CSS and the self-hosted text-font CSS are module imports in `main.jsx`, so Vite fingerprints and emits their production font assets.
4. **No D3/Recharts** — removed as unused dependencies; all interactive viz is custom inline SVG/Canvas.
5. **Mobile is a supported target** — responsive tokens, off-canvas navigation, code-split routes, and the per-widget mobile pass are shipped.
6. **Dark mode only** — no light mode toggle.
