# V2 Overhaul Build Queue

Source of truth: [`context/V2_PLAN.md`](../context/V2_PLAN.md) — the full approved critique + plan (Appendix A = per-chapter findings, Appendix B = per-chapter rubric, Appendix C = new-chapter specs, plus the Editorial Standard and Convention Decisions used by every content item). **Read the relevant section of that file before starting any item below** — this queue only gives you the item ID and a one-line pointer; the actual spec lives there.

Also read [`context/STYLE_GUIDE.md`](../context/STYLE_GUIDE.md) (Editorial Standard, mechanically applied by every Phase C/N item) and [`context/CURRICULUM.md`](../context/CURRICULUM.md) (target 25-chapter structure) before any content item.

## Protocol

- Process rows **top to bottom**. Phases are ordered by dependency: bug fixes (E) → structural reorg (S) → book-wide conventions (V) → per-chapter deep passes (C) → new chapters (N) → site polish/QA (Q). Do not skip ahead — later items assume earlier ones landed (e.g. every Phase C item assumes S1's renumbering already happened).
- **One item per run.** Pick the first PENDING row, do the work, run `npm run check`, flip its status to `DONE` (or `SKIPPED` with a one-line reason appended in a trailing `<!-- -->` comment on that row if the item turns out not to apply), commit everything for that item in one commit, done.
- **Phase C / N items** (chapter passes) follow the critique→fix→verify protocol in the plan's "Queue item protocol" section: re-read the chapter + its widgets/diagrams, apply Appendix A's baked findings for that chapter plus anything newly found against the Appendix B rubric, apply the Editorial Standard, complete citations, check currency, then `npm run check` and a dev-server spot-check of any changed widget.
- **Phase E / S / V / Q items** are direct spec execution — the plan section for that ID has the concrete instructions.
- Never mark an item DONE with a dirty tree or a failing `npm run check`.

### Phase E — Reader-visible bug fixes

| ID | Title | Status |
|---|---|---|
| E1 | Navigation data + Topbar fix (`src/data/chapters.js`, rewire Sidebar/Topbar, fix stale 17-chapter list) | DONE |
| E2 | Citations render fix (`[[1]]` bug) + data normalize + linked inline markers | DONE |
| E3 | Scroll correctness — TOC/MobileNav offset math, scroll-reset on route change, hash deep-links | DONE |
| E4 | ch01 TOC sections + eyebrow part-label fixes (ch01, ch06, ch07, ch08) | DONE |
| E5 | Resilience + metadata — ErrorBoundary (routes + WidgetCard), 404 route, per-route title/meta | DONE |
| E6 | Hygiene — remove d3/recharts, delete dead files, fix/delete ScrollableFigure, relax lint rules | DONE |
| E7 | Self-host fonts (woff2 `@font-face`) + `@media print` stylesheet | DONE |

### Phase S — Structural reorganization

| ID | Title | Status |
|---|---|---|
| S1 | The renumbering migration — 22→25 chapters, new reading order, `chapters.js` single source of truth | DONE |
| S2 | Section moves (LoRA→ch14, softmax-temp→ch14) + empty scaffolds for new ch01/14/17/22/23 | DONE |
| S3 | Home landing page (hero + 7-part chapter-card grid from `chapters.js`) | DONE |

### Phase V — Book-wide conventions

| ID | Title | Status |
|---|---|---|
| V1 | Math notation sweep (𝔼, 𝓛, matrix-orientation convention, d_k, W_i^Q, τ/T, ch01 pseudo-LaTeX) | DONE |
| V2 | Terminology sweep (Llama naming, "transformer" casing, "context window", "Chapter N" style, no component names in prose) | DONE |
| V3 | Dedup + cross-link sweep (RoPE/Toolformer/distillation-temp/RLHF-pipeline/Constitutional-AI ownership; ch06 LSTM gate-count fix; ch09 KV-cache fix) | DONE (partial — see commit; remaining cross-links deferred to Phase C) |
| V4 | Citations infrastructure — `src/data/citations.js` keyed by slug, one inline marker style | DONE |
| V5 | WidgetCard upgrade — `tryThis` prop, `useIsVisible` + `prefers-reduced-motion` gating hook | DONE (partial — see commit; `tryThis` populated per-chapter in Phase C) |

### Phase C — Per-chapter deep passes (new reading order; skips new-chapter slots 1/14/17/22/23)

| ID | Title | Status |
|---|---|---|
| C2 | Ch02 Statistical Learning — deep pass (Appendix A: ch01→02) | DONE |
| C3 | Ch03 Neural Networks — deep pass (Appendix A: ch02→03) | DONE |
| C4 | Ch04 Optimization — deep pass (Appendix A: ch03→04) | DONE |
| C5 | Ch05 Training Techniques — deep pass (Appendix A: ch04→05) | DONE |
| C6 | Ch06 Convolutional Networks — deep pass + absorb Capsule Networks historical sidebar (Appendix A: ch12→06, ch15) | DONE |
| C7 | Ch07 Word Embeddings & Tokenization — deep pass + new tokenization/BPE section (Appendix A: ch05→07) | DONE |
| C8 | Ch08 RNNs & LSTMs — deep pass (Appendix A: ch06→08) | DONE |
| C9 | Ch09 Attention — deep pass + cross-attention/masking material (Appendix A: ch07→09) | DONE |
| C10 | Ch10 Transformers — deep pass (Appendix A: ch08→10) | DONE |
| C11 | Ch11 LLM Architectures — deep pass, owns RoPE (Appendix A: ch09→11) | DONE |
| C12 | Ch12 Reinforcement Learning — deep pass, owns PPO derivation (Appendix A: ch14→12) | DONE |
| C13 | Ch13 LLM Training & Alignment — deep pass + Reasoning/Test-Time-Compute section (Appendix A: ch10→13) | DONE |
| C15 | Ch15 Multimodal Networks — deep pass + Audio-as-a-Modality section (Appendix A: ch11→15) | PENDING |
| C16 | Ch16 Graph Neural Networks — deep pass (Appendix A: ch13→16) | PENDING |
| C18 | Ch18 Variational Autoencoders — deep pass (Appendix A: ch16→18) | PENDING |
| C19 | Ch19 GANs & Image-to-Image — merge old ch17+ch18, deep pass (Appendix A: ch17→19, ch18) | PENDING |
| C20 | Ch20 Diffusion Models — deep pass + video/world-models closing section (Appendix A: ch19→20) | PENDING |
| C21 | Ch21 Datasets & Benchmarks — deep pass (Appendix A: ch20→21) | PENDING |
| C24 | Ch24 AI Agents — deep pass, owns multi-agent concepts (Appendix A: ch21→24) | PENDING |
| C25 | Ch25 Agent Harnesses — deep pass (Appendix A: ch22→25) | PENDING |

### Phase N — New chapters (specs in `context/V2_PLAN.md` Appendix C)

| ID | Title | Status |
|---|---|---|
| N1 | Ch01 "Probability & Information for Machine Learning" — new chapter (Appendix C: N1) | PENDING |
| N14 | Ch14 "Efficient Inference & Deployment" — new chapter (Appendix C: N14) | PENDING |
| N17 | Ch17 "State-Space Models & Attention Alternatives" — new chapter (Appendix C: N17) | PENDING |
| N22 | Ch22 "Evaluating LLMs & Agents" — new chapter (Appendix C: N22) | PENDING |
| N23 | Ch23 "Interpretability" — new chapter (Appendix C: N23) | PENDING |

### Phase Q — Site polish & QA (last)

| ID | Title | Status |
|---|---|---|
| Q1 | Accessibility pass — TocRail buttons, slider aria-labels, hover-only widget focus/tap equivalents | PENDING |
| Q2 | Search/filter over chapter + section titles | PENDING |
| Q3 | Mobile widget pass at 375px on worst offenders | PENDING |
| Q4 | Tests + CI — Playwright smoke over all routes, GitHub Actions workflow | PENDING |
| Q5 | Final consistency audit — re-run Appendix B global checks, Lighthouse baseline, retire/refresh stale audit docs | PENDING |
