# Mobile Responsiveness Pass — Report

## 1. Summary

The textbook now renders at phone widths (≥320 px) without breaking the desktop
baseline. The approach is the lightest-touch one available given the codebase
already uses inline styles everywhere:

- A set of **responsive design tokens** were added to [src/index.css](src/index.css)
  as CSS custom properties (`--chapter-padding`, `--h1-size`, `--prose-size`,
  `--toc-rail-display`, etc.). The desktop values match the existing
  hardcoded values exactly, so desktop is unchanged. Mobile values are
  overridden inside `@media (max-width: 767px)` and `@media (max-width: 479px)`
  blocks.
- All inline `style={{ ... }}` declarations in shared components and the 22
  chapter files were rewritten to reference those tokens via `var(--name)`.
  No content was touched — only the values of `fontSize`, `padding`, `margin`,
  `lineHeight`, `maxWidth`, `display`.
- Where mobile needed a **layout-shape** change rather than a value change, a
  small `useMediaQuery` hook drives conditional rendering:
  - The desktop TocRail is replaced on phones by a sticky collapsible
    [MobileNav](src/components/layout/MobileNav.jsx) at the top of the
    scrolling content area.
  - The desktop Sidebar is hidden on phones and instead opened via a
    hamburger button in the Topbar, sliding in as an off-canvas drawer.
  - The Topbar's prev/next buttons collapse to icon-only arrows on phones, and
    the breadcrumb shortens to just the current title.
- Route-level code-splitting was added (each chapter is now its own chunk
  via `React.lazy` + `Suspense`). The initial JS dropped from ~677 KB gzipped
  to ~77 KB gzipped — the single biggest mobile-network win.
- KaTeX `MathBlock` already had horizontal-scroll behavior; that was
  generalized via the `--mathblock-padding` / `--mathblock-font-size` tokens
  for tighter rendering on phones.
- A reusable [ScrollableFigure](src/components/shared/ScrollableFigure.jsx)
  component is provided for wrapping wide content (tables, fixed-width
  widgets) at call sites where needed. It is **not** retrofitted onto every
  diagram — SVG diagrams that use `viewBox=0 0 640 H` + `width=100%` already
  scale, and the brief is explicit about not changing them.

What's working:
- Tokens flow through shared components and chapter pages, so a single
  breakpoint change in [src/index.css](src/index.css) restyles the whole
  textbook.
- Build succeeds. The Vite output now produces one chunk per chapter
  (16–38 KB gzipped each) instead of one 677-KB monolith.
- No desktop inline-style value was changed in semantics — only wrapped in
  `var(--token, ORIGINAL_VALUE)` so the fallback exactly equals the original.

What's still rough (see §4):
- Individual widget internals weren't audited. Some interactive widgets
  define their own fixed pixel widths inside `WidgetCard`. The `WidgetCard`
  body now has `overflowX: auto` so they horizontally scroll on phones
  rather than break the layout, but they're not laid out *for* phones.
- SVG label text inside diagrams becomes small when the diagram scales to
  fit a 375-px viewport (~7 px effective height). This is acceptable for
  decorative labels but problematic for prose-y annotations.
- No headless-browser/Lighthouse run was performed — see §5.

## 2. Files modified

### Global styles & HTML
- [index.html](index.html) — viewport meta updated to include
  `viewport-fit=cover`.
- [src/index.css](src/index.css) — responsive design tokens added;
  `@media (max-width: 767px)` and `@media (max-width: 479px)` overrides;
  `prefers-reduced-motion` handling; mobile-only slider thumb enlargement
  for touch targets; `body { overflow-x: hidden }` to prevent accidental
  horizontal page scroll.

### App shell / layout
- [src/App.jsx](src/App.jsx) — chapter routes are now `React.lazy` imports
  wrapped in `Suspense`.
- [src/components/layout/Layout.jsx](src/components/layout/Layout.jsx) —
  `useIsMobile`-driven; renders Sidebar on desktop and a sliding
  `MobileSidebarDrawer` (off-canvas) on mobile; renders `MobileNav` inside
  the scrolling content area on mobile; passes a hamburger button into the
  Topbar; `contentInnerStyle` now uses `--chapter-max-width` and
  `--chapter-padding`.
- [src/components/layout/Topbar.jsx](src/components/layout/Topbar.jsx) —
  accepts a `HamburgerSlot` and `isMobile` prop; collapses breadcrumb and
  prev/next labels on mobile; uses `--topbar-height` and
  `--topbar-padding-x` tokens.
- [src/components/layout/TocRail.jsx](src/components/layout/TocRail.jsx) —
  `display: var(--toc-rail-display)` so it hides on mobile via CSS.

### Shared components
- [src/components/shared/SectionTitle.jsx](src/components/shared/SectionTitle.jsx) —
  uses `--section-title-size`, `--section-title-margin-top`,
  `--section-title-margin-bottom`.
- [src/components/shared/ChapterLede.jsx](src/components/shared/ChapterLede.jsx) —
  uses `--lede-size`, `--lede-line-height`, `--lede-margin`, `--lede-padding-left`.
- [src/components/shared/MathBlock.jsx](src/components/shared/MathBlock.jsx) —
  uses `--mathblock-font-size`, `--mathblock-padding`, `--mathblock-margin`;
  block has `overflowX: auto`, `overflowY: hidden`, `WebkitOverflowScrolling: touch`
  so wide KaTeX equations scroll inside the block instead of pushing the page.
  De-duplicated the two near-identical block-style objects.
- [src/components/shared/Citations.jsx](src/components/shared/Citations.jsx) —
  uses `--citations-margin-top`, `--citations-padding-top`.
- [src/components/shared/WidgetCard.jsx](src/components/shared/WidgetCard.jsx) —
  uses `--widget-card-padding` and `--widget-card-header-padding`; body
  has `overflowX: auto` so over-wide widget interiors scroll rather than
  break the page on mobile.

### Chapter pages (22 files)
Each of these files had the same eight inline values converted to token
references; no other content changed:

- maxWidth: `"740px"` → `"var(--chapter-max-width, 740px)"`
- padding: `"52px 44px 100px"` → `"var(--chapter-padding, 52px 44px 100px)"`
- chapter eyebrow fontSize: `"10.5px"` → `"var(--chapter-meta-size, 10.5px)"`
- h1 fontSize: `"42px"` → `"var(--h1-size, 42px)"`
- h1 lineHeight: `1.15` → `"var(--h1-line-height, 1.15)"`
- prose fontSize: `"15px"` → `"var(--prose-size, 15px)"`
- prose lineHeight: `1.75` → `"var(--prose-line-height, 1.75)"`
- prose margin: `"0 0 20px"` → `"0 0 var(--prose-margin-bottom, 20px)"`

Touched files: ch01/StatisticalLearning, ch02/NeuralNetworks,
ch03/Optimization, ch04/TrainingTechniques, ch05/WordEmbeddings, ch06/RNNs,
ch07/Attention, ch08/Transformers, ch09/LLMArchitectures, ch10/LLMTraining,
ch11/Multimodal, ch12/ConvNets, ch13/GNNs, ch14/ReinforcementLearning,
ch15/CapsuleNetworks, ch16/VAEs, ch17/GANs, ch18/ImageToImage,
ch19/DiffusionModels, ch20/Datasets, ch21/AIAgents, ch22/AgentHarnesses.

## 3. New files added

- [src/hooks/useMediaQuery.js](src/hooks/useMediaQuery.js) — `useMediaQuery(query)`
  and convenience `useIsMobile()` (matches `(max-width: 767px)`).
- [src/components/layout/MobileNav.jsx](src/components/layout/MobileNav.jsx) —
  sticky collapsible top-of-page section nav for phones. Uses
  `IntersectionObserver` to track the active section (same logic as the
  desktop TocRail). Closed by default; the closed state displays the
  current section as its label.
- [src/components/shared/ScrollableFigure.jsx](src/components/shared/ScrollableFigure.jsx) —
  call-site wrapper for any wide content (tables, fixed-width widgets,
  diagrams) where horizontal scrolling on phones is preferable to scaling.
  Not yet applied anywhere — the existing widgets all scale via SVG
  `viewBox`, and `WidgetCard` now handles overflow itself. Available for
  future targeted wrapping.

## 4. Known mobile issues / not-yet-addressed

These are explicitly *not* fixed in this pass, in keeping with the
"tuning pass, not redesign" scope.

1. **Individual widget interiors not audited.** Widgets that hardcode
   pixel widths internally (e.g. side-by-side flex panels with
   `minWidth: 180px`) will horizontally scroll inside `WidgetCard` on
   phones instead of reflowing. That's better than overflowing the page,
   but it's not native-feeling. Candidates known to be likely affected:
   the BenchmarkLeaderboard (ch20), SPADESynthesis (ch18),
   ScalingLawCurves (ch08), LatentSpaceExplorer (ch16), and most multi-panel
   widgets in chs 14, 18, 21, 22. A targeted second pass per widget could
   wrap them in `ScrollableFigure` at the call site or reflow their
   panels to stack vertically below a breakpoint.

2. **SVG label text becomes small on narrow viewports.** Diagrams using
   `viewBox=0 0 640 H` with `width=100%` scale gracefully but their internal
   11–12 px text renders at ~7 px on a 375-px-wide phone. This is fine for
   numeric tick labels but degrades long-text annotations. Per the brief,
   `viewBox` values were *not* changed; addressing this properly would
   mean per-diagram font-size adjustments in SVG units or restructuring
   horizontal label rows into stacked layouts on phones.

3. **Inline math with `whiteSpace: nowrap`.** [InlineMath](src/components/shared/InlineMath.jsx)
   forces nowrap so symbols stay together. A pathological long inline
   expression on a 320-px viewport can still exceed the prose column, but
   `body { overflow-x: hidden }` keeps it from breaking the page — it
   just gets clipped. Most chapter authors already use `MathBlock` for
   anything over a few characters, so in practice this is benign.

4. **Hover-only interactions.** A handful of widgets show information on
   `:hover` (no equivalent `:focus` or `tap`-style handler). On touch,
   hover state can stick after a tap and there is no clean way to "unhover."
   Not changed here because it would require touching widget internals.
   A separate hover-state audit is worth scheduling.

5. **Ch 01 has no `useTocSections` call.** The MobileNav (and the desktop
   TocRail) therefore don't render at all on the first chapter. This was
   pre-existing — fixing it means adding a `TOC_SECTIONS` array to
   StatisticalLearning.jsx, which I left for a content pass.

6. **No SSR / no first-paint flicker mitigation.** `useIsMobile()` returns
   the correct value synchronously on the client via lazy `useState` +
   `matchMedia`, but if the app were ever rendered server-side it would
   default to desktop and re-render. Since this build is purely
   client-rendered (Vite SPA on Vercel) this isn't a real issue today.

## 5. Performance notes

### Bundle size (gzipped)

Before this pass — single bundle:

```
dist/assets/index-BWReRLlR.js   2,450 KB  /  677 KB gzipped
```

After lazy-loading chapter routes:

```
dist/assets/index-tLSQekX1.js                 246 KB / 77 KB gz   (app shell)
dist/assets/InlineMath-DpzZn8pf.js            257 KB / 77 KB gz   (KaTeX, shared)
dist/assets/WidgetCard / MathBlock / runtime  ~13 KB / ~5 KB gz   (shared)
dist/assets/<Chapter>-*.js                   52–155 KB / 15–38 KB gz each
```

**Initial download** for a cold visit to the home page is now ~77 KB
gzipped (down from 677 KB) — roughly an 88 % reduction. KaTeX (77 KB
gzipped) loads lazily on the first chapter visit and is cached for
subsequent chapters. Each chapter's own widgets/diagrams (15–38 KB gz)
load only when the user navigates into it.

### Lighthouse

A Lighthouse mobile audit was **not** captured — this environment doesn't
include a headless browser. Recommend running
`npx lighthouse http://localhost:5173 --form-factor=mobile --view`
after deploy to capture a real baseline.

### Other mobile-perf touches landed

- `prefers-reduced-motion` is now respected globally in
  [src/index.css](src/index.css#L135-L141) — any transition or animation
  is reduced to ~0ms when the user has reduced-motion enabled.
- KaTeX CSS still imports synchronously at the top of `index.css`. Not
  lazy-loaded — the brief flagged this as worth considering but it would
  add complexity (we'd need to defer the font CSS and re-inject it before
  the first equation paint). Left as a follow-up.
- Slider thumbs are larger on phones to meet the ~44-px touch target
  (`@media (max-width: 767px)` block at the bottom of index.css). The
  visible track stays 2 px to preserve the design language.

## 6. Suggested follow-ups

- **Per-widget mobile audit.** Sample widgets at 375 px and either flag
  them in this file or wrap them in `ScrollableFigure` at the call site.
  Most-trafficked widgets to address first: the gradient-descent widget
  (ch03), bias/variance dartboard (ch01), transformer block (ch08),
  benchmark leaderboard (ch20), and the agent-trajectory widgets (chs 21–22).
- **Hover-only interaction audit.** Identify widgets that depend on hover
  for revealing information; introduce equivalent tap or focus-visible
  behavior.
- **Per-diagram SVG label review.** For SVGs that are content-rich (e.g.
  taxonomy charts, layered architecture diagrams), enlarge label font sizes
  in SVG units, or rebuild a phone-specific stacked variant.
- **Lazy KaTeX CSS.** Defer the `katex.min.css` import out of the critical
  path. Will require care so equations don't flash unstyled on first paint.
- **`prefers-color-scheme` is moot** (textbook is dark-mode only), but
  consider `prefers-contrast` and `forced-colors` for accessibility.
- **Add `TOC_SECTIONS` to Ch 01** so the MobileNav has something to show
  there.
- **Lighthouse / PSI baseline.** Capture mobile Performance, Accessibility,
  Best Practices, and SEO scores in a follow-up commit so future
  regressions are visible.
- **Optional: install a Vercel cache header for the per-chapter chunks.**
  Vite's content-hashed filenames make this trivially safe — chapter
  chunks can be `Cache-Control: public, max-age=31536000, immutable`.

## 7. How to verify

1. `npm run dev` and open `http://localhost:5173` at desktop widths
   (1280 / 1024 / 800). Visual rendering should be identical to `main`.
2. Resize the viewport below 768 px:
   - Left Sidebar disappears.
   - A hamburger button appears in the Topbar; tapping it opens a
     drawer with the chapter sidebar.
   - The right-hand TOC rail disappears; a sticky bar appears at the top
     of the content scroll showing "On this page · Current Section".
     Tapping it expands the section list.
   - Prev/Next collapse to single-character ← / → buttons.
3. At 320 px (e.g. iPhone SE width via DevTools), the chapter body
   still has comfortable padding and no horizontal page-level scroll.
   Math blocks scroll internally if they're wider than the container.
4. `npm run build` — single shared chunk is now small; per-chapter
   chunks split out.
