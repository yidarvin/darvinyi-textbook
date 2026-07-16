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
| Live static diagrams with `role="img"` and `aria-label` | 97 / 97 (one additional capsule diagram is deliberately parked) |
| Source range controls | 86, named at runtime by `WidgetAccessibility` when a local label is absent |
| Inline citation markers resolving to a `#ref-N` footer target | all 372 rendered markers across 25 chapters |
| Double-bracket citation markers | 0 |
| Rendered KaTeX error nodes | 0 across all 25 chapter routes |
| Old `Ch` / `Chs` cross-reference form in chapter prose | 0 |
| Unfilled `TODO:` or `{{PLACEHOLDER}}` markers in `src/` | 0 |
| Production font faces | Inter 400, JetBrains Mono 400, Crimson Pro 600, and KaTeX_Main 400 load in the production preview |

The route, page, widget, diagram, citation, cross-reference, placeholder, math, and font rows use `rg`/file-inventory checks plus the Playwright route pass. That route pass compares each `chapters.js` widget total with the rendered chapter cards, rejects every eligible bare `[N]` marker and every broken citation target, requires zero `.katex-error` nodes on every chapter route, and waits for the production browser's font set before requiring each of the four shipped text and math faces to load at least one real face. This fails when an emitted font URL is missing or returns non-font content. The range-control result is based on the source inventory and the shared runtime labeling path in `src/components/shared/WidgetAccessibility.jsx`. Em dashes and stock phrasing are not V2 style-guide rules and are deliberately not reported as audit failures.

`npm run lint` remains advisory rather than a Q5 gate. After the Chapter 22 escape fixes, it reports 6 errors and 204 warnings, all outside the resolved malformed equations; `npm run check` remains the required production build and route-smoke gate.

## Lighthouse mobile baseline

The production route smoke starts an isolated Vite preview on `127.0.0.1:4174`
with `reuseExistingServer: false` and `--strictPort`; it therefore cannot attach to
an unrelated development server on Vite's default preview port. `npm run check`
builds first and then runs that isolated smoke suite.

Captured against the final local production preview of the home route with Lighthouse 12.8.2 and Chrome, using `--form-factor=mobile` and the Performance, Accessibility, Best Practices, and SEO categories. Capture timestamp: `2026-07-16T03:26:23.052Z`.

| Category | Score |
|---|---:|
| Performance | 94 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

The final-build mobile capture measured 94 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO. Its diagnostics were FCP 2.3 s, LCP 2.3 s, TBT 0 ms, CLS 0.076, Speed Index 2.3 s, and Time to Interactive 2.3 s. Lighthouse estimates 900 ms of render-blocking CSS opportunity and 42 KiB of unused initial JavaScript. These are baseline observations, not claims about a deployed CDN response or field performance; recapture after a build or font-pipeline change rather than comparing them to an earlier local run.

`public/robots.txt` is included so Vercel serves crawler directives as a real static file instead of routing `/robots.txt` through the SPA fallback. The home-card widget-count text now uses the higher-contrast secondary text token.

## Context-document refresh

`context/CURRICULUM.md` and `context/PROJECT_OVERVIEW.md` now describe the completed 25-chapter V2 migration. The overview accurately records that `App.jsx` keeps explicit lazy imports and `<Route>` declarations, while `src/data/chapters.js` is the metadata source for navigation and home-page cards. `context/PROJECT_OVERVIEW.md` also distinguishes `npm run build` from the full `npm run check` gate. `context/STYLE_GUIDE.md` no longer points to the already-completed Q3 mobile work as future refinement. `context/DESIGN_SYSTEM.md` and `context/WIDGET_SPEC.md` are explicitly retired pre-V2 references, with pointers to the current V2 and runtime sources of truth. Q5 removed `CURRICULUM_VISUAL.html`, `MOCKUP_SHELL.html`, `REFERENCE_WIDGET.html`, and `darvinyi_textbook_OpenCode_Guide.docx`: each was a V1 artifact with stale curriculum, accessibility, dependency, font, or setup instructions. Current implementation guidance lives in this report, `PROJECT_OVERVIEW.md`, the V2 documents, and live source.

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
