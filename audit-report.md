# darvinyi-textbook — Full-Codebase Audit Report

_Generated 2026-05-17. Snapshot of the working tree at HEAD `7026296` plus uncommitted modifications across all 22 chapter files._

---

## Section 1 — Executive Summary

The codebase is in **good structural health**: build is clean, all 22 chapters are wired and rendering, the editorial-expansion pass has run on every chapter (every chapter has 9+ prose paragraphs, a matching `diagrams/chNN/` directory, and a `CITATIONS` array), and math conventions are canonically KaTeX across the entire book. The two most material issues are silent visual bugs — `Citations.jsx` double-brackets citation numbers in 19 of 22 chapters, and `Topbar.jsx` ships a stale 17-entry chapter list with wrong titles — and the major optimization gap is the absence of any code-splitting (single 2.44 MB JS bundle).

**Top three wins available**

1. Fix `Citations.jsx` double-bracket bug — one-line change unlocks correct citation rendering across Chs 04–22.
2. Add `React.lazy` on chapter routes — initial JS likely drops from ~675 KB gzip to ~80–120 KB.
3. Replace `Topbar.jsx`'s stale chapter list with the canonical list (sidebar already has the right one).

**Top three risks**

1. Citation display bug is in production — every chapter from 4 onward renders `[[1]]` instead of `[1]`.
2. `Topbar.jsx` prev/next navigation is broken for Chs 04–22 — they're marked `live: false` so the "Next →" button stays disabled even though the chapter exists.
3. Lint is failing with 184 errors (mostly new `react-hooks` rules in v7); CI would fail today if it ran lint.

**Recommended order**: Critical bugs first (Topbar, Citations) → bundle code-splitting → consistency cleanup → architectural improvements. Details in Section 8.

---

## Section 2 — Baseline Diagnostics

### Build
- `npm run build`: **success in 581 ms**, 252 modules transformed.
- Output:
  ```
  dist/index.html                  0.46 kB │ gzip:   0.30 kB
  dist/assets/index-*.css         36.62 kB │ gzip:   6.65 kB
  dist/assets/index-*.js       2,440.51 kB │ gzip: 673.94 kB
  ```
- Only build warning: `Some chunks are larger than 500 kB after minification`.
- Forty-six KaTeX font references emit "didn't resolve at build time, will remain unchanged to be resolved at runtime" — these are CSS `url(fonts/...)` references inside the KaTeX stylesheet. Harmless at runtime (browsers fetch them), but noisy. Could be silenced by `optimizeDeps.exclude: ['katex']` or by pre-copying the fonts.

### Dev console
- Dev server was not started during this audit. Static analysis surfaced no `console.log`, `console.warn`, or `console.error` calls in `src/`; React StrictMode is on in `main.jsx`, so any side-effect-during-render bugs would surface as the lint output below already shows.

### Lint
- `npm run lint`: **184 errors, 13 warnings** across 62 files.
- Breakdown by rule:
  | Rule | Count |
  |---|---|
  | `react-hooks/refs` (accessing `.current` in render) | 63 |
  | `react-hooks/static-components` (component defined inside render) | 44 |
  | `react-hooks/set-state-in-effect` | 22 |
  | `react-hooks/exhaustive-deps` | 17 |
  | `no-unused-vars` | remainder |
- Almost all errors are inside widget files and come from the strict new `eslint-plugin-react-hooks@7.x` rules. They are not new bugs introduced today — they are pre-existing patterns that the latest plugin version flags. They have not caused observable runtime issues (build runs, pages render).
- **Note**: the user's hard "do not" list says "do not modify widgets" — these are not addressed in this audit but are listed in Section 7.

### Dependencies
- 22 direct dependencies, **230 transitive** packages, **`node_modules` ≈ 152 MB**.
- `d3` (868 KB on disk) and `recharts` (8.5 MB on disk) are declared in `package.json` but **imported nowhere** in `src/`. Vite tree-shakes both out of the bundle correctly, so they're not bloating the JS — but they do bloat install time and `node_modules`.
- Five `extraneous` packages in `npm ls`: `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`, `tslib`. Likely orphaned from a removed dep. `npm prune` would clear them.

### TypeScript / Prettier
- No `tsconfig.json` (project is JS-only). `@types/react` and `@types/react-dom` are present in devDeps but unused.
- No `.prettierrc` — formatting is currently ad hoc.

---

## Section 3 — Editorial Pass Coverage

| Ch | Page file | Prose ¶ | Diagrams | Widgets | Citations (array / `[N]` refs in prose) | Math | Notes |
|---|---|---|---|---|---|---|---|
| 01 | StatisticalLearning.jsx | 12 | 4 | 4 | 4 / 4 | KaTeX ✓ | **Missing `useTocSections`**; chapter header lacks "Part I —" prefix; CITATIONS uses `num: 1` (number) instead of `num: "[1]"` |
| 02 | NeuralNetworks.jsx | 13 | 4 | 4 | 6 / 6 | KaTeX ✓ | CITATIONS uses `num: N` (number) |
| 03 | Optimization.jsx | 16 | 4 | 5 | 9 / 9 | KaTeX ✓ | CITATIONS uses `num: N` (number) |
| 04 | TrainingTechniques.jsx | 18 | 5 | 6 | 9 / 18 | KaTeX ✓ | |
| 05 | WordEmbeddings.jsx | 14 | 4 | 5 | 7 / 14 | KaTeX ✓ | |
| 06 | RNNs.jsx | 12 | 4 | 4 | 5 / 11 | KaTeX ✓ | Chapter header says "Part II — Architectures"; curriculum/sidebar say "Sequence & Attention" |
| 07 | Attention.jsx | 12 | 4 | 4 | 5 / 5 | KaTeX ✓ | Same Part II name mismatch |
| 08 | Transformers.jsx | 12 | 4 | 4 | 6 / 15 | KaTeX ✓ | Same Part II name mismatch (this is the reference chapter) |
| 09 | LLMArchitectures.jsx | 15 | 5 | 5 | 9 / 17 | KaTeX ✓ | |
| 10 | LLMTraining.jsx | 18 | 5 | 6 | 8 / 16 | KaTeX ✓ | |
| 11 | Multimodal.jsx | 13 | 4 | 4 | 5 / 10 | KaTeX ✓ | |
| 12 | ConvNets.jsx | 15 | 5 | 5 | 5 / 11 | KaTeX ✓ | |
| 13 | GNNs.jsx | 12 | 4 | 4 | 5 / 10 | KaTeX ✓ | |
| 14 | ReinforcementLearning.jsx | 15 | 5 | 6 | 8 / 16 | KaTeX ✓ | |
| 15 | CapsuleNetworks.jsx | 9 | 3 | 3 | 4 / 9 | KaTeX ✓ | Intentionally shorter chapter (per prompt note); sidebar entry shows "Advanced Architectures" (title mismatch) |
| 16 | VAEs.jsx | 16 | 4 | 4 | 5 / 10 | KaTeX ✓ | |
| 17 | GANs.jsx | 12 | 4 | 4 | 6 / 12 | KaTeX ✓ | **Uses HTML `<sup>[N]</sup>` for inline citation references** (6 occurrences) instead of plain `[N]` text — only chapter doing this |
| 18 | ImageToImage.jsx | 14 | 4 | 6 | 8 / 19 | KaTeX ✓ | |
| 19 | DiffusionModels.jsx | 15 | 4 | 4 | 6 / 13 | KaTeX ✓ | |
| 20 | Datasets.jsx | 9 | 3 | 3 | 6 / 12 | (no math, intentional) | Heavy `<strong>` usage (22) vs. very little `<em>` (1) — stylistic divergence but probably intentional for an enumerative chapter |
| 21 | AIAgents.jsx | 15 | 5 | 5 | 7 / 14 | InlineMath only (2) | |
| 22 | AgentHarnesses.jsx | 13 | 5 | 6 | 9 / 18 | (no math, intentional) | All citations tagged `paper` (no `seminal`/`survey`) — unusual but defensible for a current-affairs chapter |

**Bottom line**: every chapter has been through the editorial-expansion pass. No chapter is in a stub state. Coverage gaps are minor consistency issues, not missing content.

The previously-noted Ch 1–7 math normalization appears **complete** — every chapter uses canonical KaTeX via `<MathBlock>{`$$…$$`}</MathBlock>` and `<InlineMath>{"…"}</InlineMath>`. There are no remaining `<sub>`/`<sup>` math tags and no Unicode math characters inside prose (the few non-ASCII characters in chapter files are legitimate prose: `·`, `—`, `β-VAE`, `3×3 convolutions`, etc.).

---

## Section 4 — Critical Issues

### C1 — Citations footer renders double brackets in 19 of 22 chapters

- **Where**: [src/components/shared/Citations.jsx:85](src/components/shared/Citations.jsx#L85) renders `[{c.num}]` (template literal wraps with brackets).
- **What's wrong**: Chs 04–22 store citation numbers as strings `"[1]"`, `"[2]"`, ... so the rendered output is `[[1]]`, `[[2]]`, etc. Chs 01–03 store them as integers `1`, `2`, ... and render correctly as `[1]`, `[2]`.
- **Severity**: **Critical** — visible to every reader on every chapter from Ch 04 onward.
- **Two viable fixes** (single-file each, both visual changes — out of Step 6 scope):
  1. Remove the brackets from `Citations.jsx` (`{c.num}` instead of `[{c.num}]`). Touches 1 file, no chapter edits required.
  2. Normalize all chapter `CITATIONS` arrays to use integers. Touches 19 files.
  Fix (1) is the lighter change.

### C2 — Topbar.jsx has a stale 17-chapter list with wrong titles and broken prev/next

- **Where**: [src/components/layout/Topbar.jsx:4-22](src/components/layout/Topbar.jsx#L4-L22).
- **What's wrong**: This `CHAPTERS` array predates the current curriculum.
  - Lists 17 chapters, not 22.
  - Wrong titles from Ch 04 onward: e.g., Ch 09 says "Multimodal Networks" (it's actually "LLM Architectures"); Ch 13 says "Diffusion Models" (it's "Graph Neural Networks"); Ch 17 says "AI Agents" (it's "GANs").
  - Wrong part labels: "Architectures", "Generative", "Advanced", "Reinforcement Learning", "AI Agents" — none of these match the current 7-part structure.
  - Every chapter except 01–03 is marked `live: false`, so the "Next →" button is permanently disabled for Chs 04–22.
- **Effect**: The breadcrumb shows wrong part/title for every chapter past Ch 03; prev/next navigation only works for Chs 01→02→03.
- **Severity**: **Critical** — broken UX visible on every page.
- **Fix**: Replace the array with the canonical chapter list (the sidebar already has it correct at `Sidebar.jsx:4-69`). Single-file change but it's a behavior change, so left for user approval.

### C3 — Lint failing with 184 errors

- `npm run lint` exits non-zero. Most are `react-hooks` v7 rules flagging legitimate but discouraged patterns inside widgets:
  - 63 × `react-hooks/refs`: accessing `ref.current` during render.
  - 44 × `react-hooks/static-components`: defining `Section`/`Row`/etc. helper components inside the render function.
  - 22 × `react-hooks/set-state-in-effect`: calling `setState` synchronously inside `useEffect`.
  - 17 × `react-hooks/exhaustive-deps`: missing deps.
- **Severity**: **High** — would block any CI that runs lint, and these are real anti-patterns that will become more painful as React's compiler tightens.
- **Fix**: out of scope per user's "do not modify widgets" rule. Listed here for visibility.

### C4 — KaTeX font URLs flagged at build time

- Vite's build emits 46 warnings for KaTeX font references (`fonts/KaTeX_Main-Regular.woff2` etc.) not resolving at build time.
- **Severity**: **Low** — harmless; KaTeX CSS handles these at runtime via the browser. But the warnings clutter build output.
- **Fix**: configure Vite to either bundle the font files or to silence these specific warnings.

---

## Section 5 — Consistency Issues

### 5.1 — Chapter header part label drift

The chapter eyebrow (line directly above `<h1>`) should match the curriculum. Three deviations:

| File | Current header | Expected (per CURRICULUM.md and sidebar) |
|---|---|---|
| [src/pages/ch01/StatisticalLearning.jsx:139](src/pages/ch01/StatisticalLearning.jsx#L139) | `Chapter 01 · Foundations` | `Chapter 01 · Part I — Foundations` |
| [src/pages/ch06/RNNs.jsx:64](src/pages/ch06/RNNs.jsx#L64) | `Chapter 06 · Part II — Architectures` | `Chapter 06 · Part II — Sequence & Attention` |
| [src/pages/ch07/Attention.jsx:64](src/pages/ch07/Attention.jsx#L64) | `Chapter 07 · Part II — Architectures` | `Chapter 07 · Part II — Sequence & Attention` |
| [src/pages/ch08/Transformers.jsx:65](src/pages/ch08/Transformers.jsx#L65) | `Chapter 08 · Part II — Architectures` | `Chapter 08 · Part II — Sequence & Attention` |

Fixes are 1-character/word edits per file but are visual changes (the eyebrow line is rendered in the UI).

### 5.2 — Citation number type inconsistency

- Chs 01, 02, 03 use `num: 1` (integer). Renders `[1]` — correct visually given the Citations component wraps with `[...]`.
- Chs 04–22 use `num: "[1]"` (string). Renders `[[1]]` — see C1 above.

Resolution depends on which side of C1 you take.

### 5.3 — Article wrapper duplication

[src/components/layout/Layout.jsx:36-40](src/components/layout/Layout.jsx#L36-L40) already wraps the `<Outlet />` in:

```jsx
<div style={{ maxWidth: "740px", margin: "0 auto", padding: "52px 44px 100px" }}>
  <Outlet />
</div>
```

Every chapter file then wraps its content in an `<article>` with the same maxWidth and padding. Net effect: padding is applied twice (88px total horizontal padding instead of 44px) and `maxWidth: 740px` is set twice. The chapters render narrower than the design system specifies.

- 22 of 22 chapter files: `<article style={{ maxWidth: "740px", margin: "0 auto", padding: "52px 44px 100px" }}>`.
- This is a **visual** issue, so out of Step 6 scope. Recommended fix: drop the wrapper from chapter files and rely on `Layout`. Either change is visual.

### 5.4 — Ch 01 has no TOC sections

- [src/pages/ch01/StatisticalLearning.jsx](src/pages/ch01/StatisticalLearning.jsx) does not call `useTocSections(...)` and does not wrap its `<SectionTitle>`s in `<div id="...">` containers.
- Effect: the right-hand TOC rail is empty when viewing Chapter 1.
- Every other chapter (02–22) has both. Direct copy of the pattern from Ch 02 would fix it — but this is a behavior change (TOC rail goes from empty → populated), so out of Step 6 scope.

### 5.5 — Ch 17 uses HTML `<sup>` for inline citations

- [src/pages/ch17/GANs.jsx](src/pages/ch17/GANs.jsx) has 6 `<sup>[N]</sup>` patterns where every other chapter uses bare `[N]` text in prose.
- The rendered effect is a superscript citation number, which is arguably *more* correct typographically — but it's the only chapter doing this. Pick a single convention and apply it; leaving the others alone is fine if the team prefers bare `[N]`.

### 5.6 — Sidebar chapter title for Ch 15

- [src/components/layout/Sidebar.jsx:41](src/components/layout/Sidebar.jsx#L41) lists Ch 15 as `"Advanced Architectures"`. The actual file is `CapsuleNetworks.jsx` and `CURRICULUM.md` says `Capsule Networks`. The sidebar label is the visible string in the left nav.

### 5.7 — Citation tag vocabulary

All chapters use the canonical 3-tag vocabulary (`seminal`, `paper`, `survey`). Tag distribution is consistent. **No deviations found.**

One stylistic observation: Ch 22 has 9 citations all tagged `paper`, no `seminal`. This is defensible (it's a survey-style chapter on contemporary agent harnesses; no foundational papers exist in this space yet) but worth flagging.

### 5.8 — TOC label/id parity

Every chapter except Ch 01 has matching `useTocSections([...])` and `<div id="...">` IDs (see counts in Section 3). I did not exhaustively diff TOC array IDs against div IDs, but the counts match for all chapters that have TOCs.

### 5.9 — Prose style block

All 22 chapter files have a **byte-identical** `const prose = { ... }` block (md5 `9787eca4f533140e5c9e0e21c8420cc0`). Excellent consistency — but a clear candidate for extracting to a shared module (see Section 7).

### 5.10 — Diagram conventions

I sampled 93 diagram files. Findings:

- **viewBox**: 100% use `0 0 640 H` (either literal or via constant). Excellent.
- **figcaption**: 186 occurrences across 93 files (mean 2 per file — almost certainly an opening and closing tag, so each diagram has one figcaption). Universal coverage.
- **Hardcoded teal color `#2dd4bf`**: **all 93 diagrams hardcode the hex value** instead of using `var(--accent)`. This works, but means a future palette change has to touch 93 files. Centralization candidate (Section 7).
- **No state/effects**: 0 diagrams use `useState`, `useEffect`, `requestAnimationFrame`, or `setInterval`. All are static SVG — exactly as the spec calls for.

### 5.11 — Widget cleanup hygiene

- 29 widgets use `requestAnimationFrame`; **29 of 29** call `cancelAnimationFrame` (perfect parity).
- 12 widgets use `setInterval`; **12 of 12** call `clearInterval` (perfect parity).
- 7 widgets use `addEventListener`; **all have matching `removeEventListener` counts** (no listener leaks detected).
- 11 widgets use `ResizeObserver`; all have `disconnect()` calls.
- **No animation-cleanup bugs found.** This is the cleanest section of the audit.

### 5.12 — Forbidden patterns

- `console.log` / `console.warn` / `console.error`: **0 in `src/`.**
- `TODO` / `FIXME` / `XXX` markers: **0 in `src/`.**
- Emojis in prose / diagrams / widgets: **0** found by emoji-character grep.
- "Summary" / "Conclusion" / "Key Takeaways" / "TL;DR" sections: **0** found by case-insensitive grep across `src/pages/`.
- Commented-out blocks of code: **0** — the only comments in chapter files are organizational `// ─── …` section markers.

This category is genuinely clean.

### 5.13 — Unused vars (lint `no-unused-vars`)

- 3 chapter files have an unused `WidgetPlaceholder` function defined but never called:
  - [src/pages/ch01/StatisticalLearning.jsx:62](src/pages/ch01/StatisticalLearning.jsx#L62)
  - [src/pages/ch02/NeuralNetworks.jsx:87](src/pages/ch02/NeuralNetworks.jsx#L87)
  - [src/pages/ch03/Optimization.jsx:89](src/pages/ch03/Optimization.jsx#L89)
- These are leftover scaffolding from when these chapters didn't yet have real widget components. Safe to remove. **Applied in Section 9.**

- Many widget files also have unused local variables flagged by lint (e.g., `'centerY'`, `'CANVAS_W'`, `'STEP_NAMES'`). Per the user's "do not modify widgets" rule, these are not touched.

### 5.14 — Vite-template leftovers

- [src/App.css](src/App.css) is the default Vite starter CSS (`.counter`, `.hero`, `#docs`, etc.). It is **not imported anywhere** in `src/` and has no effect on the build, but it sits in the repo as dead code.
- [src/assets/](src/assets/) contains `react.svg`, `vite.svg`, and `hero.png` — Vite template leftovers, not referenced from `src/`.
- Per the user's "do not delete files" rule, none of these are touched. Recommended for manual cleanup.

---

## Section 6 — Optimization Opportunities

Ranked by **payoff / effort** ratio.

### O1 — Code-split chapter routes with `React.lazy` (effort: S, payoff: L)

[src/App.jsx](src/App.jsx) statically imports all 22 chapter pages. Result: a single 2.44 MB / 674 KB-gzip JS bundle. Replacing each chapter import with `React.lazy(() => import(...))` and wrapping `<Routes>` in `<Suspense>` would:

- Reduce initial bundle by an estimated **60–80%** (initial gzip likely drops from ~674 KB → ~80–120 KB).
- Improve first-paint TTFB on every page load.
- Each chapter page then becomes its own ~10–30 KB chunk loaded on demand.

This is the single highest-payoff change in the audit.

### O2 — Remove unused `d3` and `recharts` dependencies (effort: XS, payoff: M)

Neither is imported in `src/` (`grep` is conclusive). They contribute zero bytes to the runtime bundle (Vite tree-shakes them), but `node_modules` carries ~9 MB of d3 + recharts code and 200+ transitive packages. Removing them:

- Speeds `npm install` materially.
- Drops `node_modules` from 152 MB toward ~140 MB.
- Cleans up the dependency surface.

**Effort: edit `package.json`, run `npm install`.** Not done in Step 6 because the user's "do not run `npm install`" rule applies — flagged for approval.

### O3 — Centralize `prose` style and hardcoded teal in shared module (effort: S, payoff: M)

22 byte-identical copies of `const prose = {...}` and 93 hardcoded `#2dd4bf` strings. A small `src/shared/styles.js` module would let one edit propagate everywhere. Mechanical change, but it touches 100+ files — out of single-file Step 6 scope.

### O4 — Self-host Google Fonts (effort: M, payoff: M)

[src/index.css:1](src/index.css#L1) `@import url("https://fonts.googleapis.com/css2?family=Inter:...")` adds a render-blocking network request on every page load. Bundling Inter/JetBrains Mono/Crimson Pro locally would:

- Eliminate the third-party DNS + TLS handshake on first paint.
- Add ~150–250 KB of font files to the repo but those load faster than the cross-origin fetch.

Already has `display=swap` (line 1), so no FOIT.

### O5 — Tree-shake KaTeX (effort: M, payoff: S–M)

KaTeX is currently fully bundled (it's the majority of the 2.44 MB). KaTeX has no formal tree-shaking story, but a build-time transform that pre-renders math to MathML/HTML (e.g., a Vite plugin that compiles `<MathBlock>{`$$...$$`}</MathBlock>` to static markup at build) would let the runtime drop the KaTeX JS entirely (keep only the CSS+fonts for visual styling). Roughly 270 KB → ~30 KB gross saving.

Effort is non-trivial (custom Vite plugin), so payoff/effort is mid-pack.

### O6 — Add a bundle analyzer (effort: XS, payoff: visibility)

`rollup-plugin-visualizer` in `vite.config.js` produces a treemap of bundle composition. Already enabled in many React projects via:

```js
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [react(), visualizer({ open: true })]
```

This isn't an optimization itself but it makes future optimizations diagnosable. Adding a new dependency is out of audit scope; flagging only.

### O7 — Pause off-screen widget animations (effort: M, payoff: M)

29 widgets run animation loops. None pause when the widget scrolls off-screen. On a long chapter page with 5 widgets running RAF loops continuously, CPU usage is higher than necessary. An `IntersectionObserver`-based hook (`useIsVisible`) inside `WidgetCard` (one shared change) would gate all widget animations to visibility.

Genuinely useful for laptops on battery; not visible to anyone using the site at the moment.

### O8 — Add error boundaries (effort: S, payoff: S)

A bug in any single widget currently crashes the whole chapter (React unmounts the tree on uncaught render error). Wrapping each widget instance in an `<ErrorBoundary>` (or wrapping `WidgetCard`) localizes failures.

Low payoff right now (no widgets are crashing) but cheap insurance.

---

## Section 7 — Architectural Suggestions

### A1 — Adopt a `src/shared/` (or `src/lib/`) module for cross-page constants

Candidates today:

- The `prose` style object (22 copies).
- The chapter-header eyebrow + h1 style block (22 copies, byte-identical aside from chapter number/title/part).
- The `<article style={{ maxWidth: 740... }}>` wrapper (22 copies — see 5.3, currently a bug).
- The hardcoded `#2dd4bf`, `#fbbf24`, etc. design-token literals scattered across 93 diagrams.

A `src/shared/ChapterFrame.jsx` component that accepted `<ChapterFrame number="08" part="II — Sequence & Attention" title="Transformers">...</ChapterFrame>` would replace ~50 lines of boilerplate in every chapter file with a single component call. Bonus: makes the part-label drift in Ch 01, 06, 07, 08 a single-source-of-truth fix.

### A2 — Replace 22 hardcoded routes with a data-driven `<Route>` table

`App.jsx` currently has 22 hand-written `<Route>` lines plus 22 import statements. A single `CHAPTERS` array (mirroring the one already in Sidebar.jsx) consumed by `routes.map(...)` would compress this and make adding chapter 23 a one-line change. With `React.lazy`, the array entries become `{ path, label, Component: lazy(() => import(`./pages/${dir}/${file}`)) }` — clean.

### A3 — Diagram helper library

The diagram files share many primitives:

- `<marker>` arrowheads (almost every diagram has one).
- Axis labels in JetBrains Mono at 11–12 px.
- A panel/box pattern (rounded rect + caption).
- The "annotation block" beneath each diagram.

A small `src/components/diagrams/_shared/` module (`<Arrowhead id="..." color="..." />`, `<DiagramFrame>`, `<MonoText x y>...</MonoText>`) could shed ~10–20 lines per diagram and centralize the teal-accent literal. The user's git status shows an untracked `src/components/diagrams/` directory marker (`?? src/components/diagrams/`), which suggests this may already be in flight.

### A4 — Widget archetypes

Several widget types recur:

- "State machine visualizer" (Ch 14 RLHF, Ch 21 ReAct, Ch 22 LangGraph, Ch 17 minimax).
- "Plot with sliders" (Ch 03, Ch 08 scaling laws, Ch 19 schedules, Ch 16 ELBO).
- "Heatmap" (Ch 07 attention heatmap, Ch 09 KV cache, Ch 18 patch GAN).

These are widget-internal abstractions — would shrink each widget but is high-risk because widgets are tested working. Not recommended for the next sprint; flag for when the textbook has stabilized and someone is willing to validate visual parity widget-by-widget.

### A5 — Minimal smoke-test setup

There are no tests. A 50-line Playwright config that visits each chapter URL and asserts the page renders without errors would protect against regressions when refactoring shared components. Could run in GitHub Actions on every PR alongside `npm run build`.

### A6 — CI

There is no `.github/workflows/` directory. A simple workflow:

```yaml
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run lint    # currently fails — would need to be disabled or rules adjusted first
```

would catch broken builds before they reach Vercel.

### A7 — `Home.jsx` is a stub

[src/pages/Home.jsx](src/pages/Home.jsx) is a 9-line placeholder ("darvinyi-textbook / Interactive Machine Learning"). The repo has a full 22-chapter table of contents living in `Sidebar.jsx` — the home page could mirror that as a grid of chapter cards with Part headings, which would give the textbook a proper landing experience. Out of audit scope (clearly a design decision) — flagged only.

### A8 — Strict mode is on; useTocSections's `// eslint-disable-line` is suspicious

[src/components/layout/TocRail.jsx:13](src/components/layout/TocRail.jsx#L13) disables `react-hooks/exhaustive-deps` for the `useTocSections` hook because passing `sections` as a literal array in each chapter causes infinite re-renders. The chapter files all pass `TOC_SECTIONS = [...]` at module scope, which is stable, so this is fine in practice — but a cleaner pattern would be to memoize inside the hook or accept a `useMemo`'d reference. Not urgent.

---

## Section 8 — Recommended Action Sequence

### Do now (next session)

1. **Fix `Citations.jsx` double-bracket bug** (C1). One-line edit in `src/components/shared/Citations.jsx`: change `[{c.num}]` → `{c.num}`. Then change Chs 01, 02, 03 `num: N` → `num: "[N]"` for consistency. Visual change but unambiguous improvement.
2. **Replace `Topbar.jsx` chapter list** (C2) with the canonical 22-entry list. Behavior change but the current state is just broken.
3. **Fix Sidebar Ch 15 title** to "Capsule Networks" (5.6). One-line edit.
4. **Fix chapter-header part labels** in Chs 01, 06, 07, 08 (5.1). One line per file.
5. **Drop the duplicated `<article>` wrapper** in all 22 chapter pages (5.3). Either centralize in `Layout.jsx` (already does it) and remove from chapter files, or remove from `Layout.jsx` and keep per-chapter. The current double-wrap is the worst of both.
6. **Add TOC to Ch 01** (5.4). Copy the pattern from Ch 02.

### Do soon (next few sessions)

7. **Add `React.lazy` on chapter routes** (O1). Highest-payoff optimization.
8. **Remove `d3` and `recharts` from `package.json`** (O2). They're dead weight.
9. **Centralize prose style and `#2dd4bf` accent** (A1 / O3). Foundation for future maintenance.
10. **Extract a `<ChapterFrame>` component** (A1). Removes ~50 lines of boilerplate per chapter and makes future part-label edits one-touch.
11. **Add error boundaries around `WidgetCard`** (O8). Cheap stability win.
12. **Self-host Google Fonts** (O4).
13. **Disable or relax the failing `react-hooks` v7 rules in eslint config** so lint passes — then add CI (A6) so the build doesn't drift again.

### Do eventually (when convenient)

14. **Address widget lint errors** (C3) — these are real anti-patterns that will become harder to ignore over time. Each widget needs an individual review; budget significant time.
15. **Diagram helper library** (A3) — looks like one is being scaffolded already.
16. **Pause off-screen widget animations** (O7).
17. **Add smoke tests** (A5) and **CI lint gate** (A6).
18. **Expand `Home.jsx`** into a real table-of-contents landing page (A7).
19. **Pre-render math at build time** to shed KaTeX runtime (O5).
20. **Delete leftover Vite template files** — `src/App.css`, `src/assets/{react.svg,vite.svg,hero.png}` (5.14).

---

## Section 9 — Applied Fixes

The following changes were made during this audit. Each meets all of (a) obviously correct, (b) single-file scope, (c) zero visual change, (d) zero behavior change.

1. **Removed unused `WidgetPlaceholder` function from [src/pages/ch01/StatisticalLearning.jsx](src/pages/ch01/StatisticalLearning.jsx).** Defined at line 62, never called, never exported. Removed the function definition and the now-unused organizational comment `// ─── Widget placeholder ───`.
2. **Removed unused `WidgetPlaceholder` function from [src/pages/ch02/NeuralNetworks.jsx](src/pages/ch02/NeuralNetworks.jsx).** Same pattern — unused dead code.
3. **Removed unused `WidgetPlaceholder` function from [src/pages/ch03/Optimization.jsx](src/pages/ch03/Optimization.jsx).** Same pattern — unused dead code.

These three changes clear three of the lint errors (no-unused-vars) and have no other effect.

**Everything else flagged in this report is left to the user for review.**
