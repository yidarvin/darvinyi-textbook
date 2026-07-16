# Final consistency audit

Owner: textbook maintainers. Last reviewed: 2026-07-15.

This report replaces the pre-V2 full-codebase audit. It records the final queue audit of the current 25-chapter textbook, rather than retaining findings about the former 22-chapter application.

## Result

The structural and site-quality checks pass. The initial Q5 audit fixed a low-contrast home-card metadata label and added `public/robots.txt` so Vercel serves crawler directives as a static file. Its review also corrected the two published widget totals, installed a single linked inline-citation path, and refreshed the routing description below.

The former `mobile-pass-report.md` has been retired. It described the earlier 22-chapter mobile pass, its historical performance numbers, and issues already resolved by Q1 through Q4. This report is the current audit record.

## Appendix B global checks

Static checks cover the global aspects of Appendix B that can be verified mechanically. They are not a substitute for the chapter-level factual, mathematical, and widget-fidelity reviews recorded in `content/critiques/`.

| Check | Result |
|---|---:|
| Live chapter routes and chapter-data entries | 25 / 25 |
| Chapter pages with a lede, closing synthesis, and citations | 25 / 25 |
| Rendered `WidgetCard` instances / `tryThis` props | 123 / 123 |
| Per-chapter `chapters.js` widget metadata matching rendered `WidgetCard` instances | 25 / 25 |
| Static diagrams with `role="img"` and `aria-label` | 97 / 97 |
| Source range controls | 86, named at runtime by `WidgetAccessibility` when a local label is absent |
| Inline citation markers resolving to a `#ref-N` footer target | all rendered markers across 25 chapters |
| Double-bracket citation markers | 0 |
| Old `Ch` / `Chs` cross-reference form in chapter prose | 0 |
| Unfilled `TODO:` or `{{PLACEHOLDER}}` markers in `src/` | 0 |

The route, page, widget, diagram, citation, cross-reference, and placeholder rows use `rg`/file-inventory checks plus the Playwright route pass. That route pass compares each `chapters.js` widget total with the rendered chapter cards and verifies that every inline `[N]` marker with a local reference has an anchor to its `ref-N` target. The range-control result is based on the source inventory and the shared runtime labeling path in `src/components/shared/WidgetAccessibility.jsx`. Em dashes and stock phrasing are not V2 style-guide rules and are deliberately not reported as audit failures.

## Lighthouse mobile baseline

Captured against a local production preview of the home route with Lighthouse 12.8.2 and Chrome, using `--form-factor=mobile` and the Performance, Accessibility, Best Practices, and SEO categories. Capture timestamp: `2026-07-16T02:33:05.114Z`.

| Category | Score |
|---|---:|
| Performance | 98 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

The measured web-vitals diagnostics were FCP 2.0 s, LCP 2.0 s, TBT 0 ms, CLS 0, Speed Index 2.0 s, and Time to Interactive 2.0 s. Lighthouse estimates 600 ms of render-blocking CSS opportunity and 41 KiB of unused initial JavaScript. Repeated local runs can vary in fractional timing diagnostics (the review repeat measured 1.9 s FCP/LCP/Speed Index/TTI and a 450 ms render-blocking opportunity) while preserving the category scores. These are baseline observations, not claims about a deployed CDN response or field performance.

`public/robots.txt` is included so Vercel serves crawler directives as a real static file instead of routing `/robots.txt` through the SPA fallback. The home-card widget-count text now uses the higher-contrast secondary text token.

## Context-document refresh

`context/CURRICULUM.md` and `context/PROJECT_OVERVIEW.md` now describe the completed 25-chapter V2 migration. The overview accurately records that `App.jsx` keeps explicit lazy imports and `<Route>` declarations, while `src/data/chapters.js` is the metadata source for navigation and home-page cards. `context/PROJECT_OVERVIEW.md` also distinguishes `npm run build` from the full `npm run check` gate. `context/STYLE_GUIDE.md` no longer points to the already-completed Q3 mobile work as future refinement.

## Reproduce

```bash
npm run check
npm run preview -- --host 127.0.0.1 --port 4173
npx --yes lighthouse@12.8.2 http://127.0.0.1:4173/ \
  --form-factor=mobile \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

The Lighthouse command measures a local preview. Run it against the deployed canonical URL separately when a production network baseline is needed.
