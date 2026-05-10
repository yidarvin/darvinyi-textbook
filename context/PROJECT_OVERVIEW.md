# darvinyi-textbook — Project Overview

## What This Is

An interactive machine learning textbook deployed as a web application. Think Distill.pub but dark-mode, with live interactive widgets embedded inline with minimal prose explanations.

**Philosophy:** Every concept gets ~3-5 sentences of explanation, then a live interactive widget that lets the reader feel the math rather than just read about it. Widgets > text.

**Target audience:** General CS audience. Assumes programming literacy, linear algebra basics. Does not assume ML background.

## Tech Stack

```
Frontend:  React + Vite
Routing:   React Router v6 (one route per chapter)
Math:      KaTeX (render equations)
Charts:    D3.js (custom interactive viz), Recharts (simple charts)
Styling:   Tailwind CSS (utility classes only, no custom CSS framework)
Hosting:   Vercel (static frontend, no backend needed)
No backend, no database, no auth.
```

## Repository Structure

```
darvinyi-textbook/
├── public/
├── src/
│   ├── App.jsx                  # Router setup
│   ├── main.jsx
│   ├── index.css                # Global styles + CSS variables
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx      # Chapter navigation
│   │   │   ├── Topbar.jsx       # Breadcrumb + prev/next
│   │   │   └── TocRail.jsx      # Right-side table of contents
│   │   ├── shared/
│   │   │   ├── WidgetCard.jsx   # Wrapper for all interactive widgets
│   │   │   ├── MathBlock.jsx    # Block equation renderer
│   │   │   ├── InlineMath.jsx   # Inline equation renderer
│   │   │   ├── Citations.jsx    # Citation list at chapter bottom
│   │   │   └── SectionTitle.jsx # H2 with decorative line
│   │   └── widgets/             # One folder per chapter
│   │       ├── ch01/
│   │       ├── ch02/
│   │       ├── ch03/
│   │       └── ...
│   └── pages/
│       ├── Home.jsx             # Landing / table of contents
│       ├── ch01/
│       │   └── StatisticalLearning.jsx
│       ├── ch02/
│       │   └── NeuralNetworks.jsx
│       └── ...
├── context/                     # NOT deployed — OpenCode reference files
│   ├── PROJECT_OVERVIEW.md      # This file
│   ├── DESIGN_SYSTEM.md         # Colors, typography, components
│   ├── CURRICULUM.md            # All 17 chapters, sections, widgets, citations
│   ├── WIDGET_SPEC.md           # Widget interaction patterns
│   └── REFERENCE_WIDGET.html   # The gradient descent widget (built, reference impl)
├── vite.config.js
├── tailwind.config.js
├── package.json
└── vercel.json
```

## Curriculum Summary (17 chapters, 6 parts)

| Part | Chapters | Focus |
|---|---|---|
| I — Foundations | 1-4 | Statistical learning, neural nets, optimization, training techniques |
| II — Architectures | 5-10 | CNNs, RNNs, attention, transformers, multimodal, capsule nets |
| III — Generative | 11-13 | VAEs, GANs, diffusion models |
| IV — Advanced | 14-15 | GNNs, datasets & benchmarks |
| V — Reinforcement Learning | 16 | Q-learning → DQN → PPO → RLHF/RLEF/RLVR |
| VI — AI Agents | 17 | ReAct, tool use, LangGraph, multi-agent systems |

## V1 Scope (build first)

1. Chapter 1 — Statistical Learning
2. Chapter 2 — Neural Networks
3. Chapter 3 — Optimization (gradient descent widget already built)

Everything else is scaffolded (routes exist, pages are placeholder) but content comes later.

## Widget Count by Chapter

- Ch 1: 4 widgets (Polynomial Fit, Bias-Variance, Regularization, Decision Boundary)
- Ch 2: 4 widgets (Universal Approx, Computation Graph, Activation Zoo, Loss Function)
- Ch 3: 5 widgets (Gradient Descent Navigator [BUILT], Optimizer Race, LR Finder, LR Schedule, Adam Internals)
- Ch 4: 6 widgets
- Ch 5: 5 widgets
- Ch 6: 4 widgets
- Ch 7: 4 widgets
- Ch 8: 4 widgets
- Ch 9: 4 widgets
- Ch 10: 3 widgets
- Ch 11: 4 widgets
- Ch 12: 4 widgets
- Ch 13: 4 widgets
- Ch 14: 4 widgets
- Ch 15: 3 widgets
- Ch 16: 6 widgets
- Ch 17: 5 widgets
**Total: ~75 widgets**

## Routing

```jsx
// App.jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/ch/01" element={<StatisticalLearning />} />
  <Route path="/ch/02" element={<NeuralNetworks />} />
  <Route path="/ch/03" element={<Optimization />} />
  {/* ... etc */}
</Routes>
```

## Deployment

- **Platform:** Vercel
- **Deploy trigger:** Push to `main` branch
- **Build command:** `npm run build`
- **Output dir:** `dist`
- **No env vars needed** (no backend, no API keys)

## Key Constraints

1. **No real model inference** — widgets simulate behavior mathematically, they don't run actual neural networks. All visualizations are computed analytically or via simple JS math.
2. **No external data fetching at runtime** — everything is self-contained in the bundle.
3. **KaTeX for math** — not MathJax (too slow). Import KaTeX CSS in index.html.
4. **D3 for custom interactive viz** — Recharts for simple charts only.
5. **Mobile is NOT a priority** — desktop-first, minimum viewport 1024px.
6. **Dark mode only** — no light mode toggle.
