# darvinyi-textbook — Full Critique & V2 Improvement Plan

> Mirrored into the repo so headless `runqueue.sh` runs (which start with no memory of the planning session) can read Appendix A/B/C, the Editorial Standard, and Convention Decisions. `prompts/queue.md` items reference sections of this document by name — read the relevant section before starting an item. This is the source of truth for the V2 overhaul; treat it as authoritative over any summary.

> Status: COMPLETE — all 22 chapters critiqued (per-chapter expert critics + 4 cross-cutting reviews; correctness claims adversarially verified where budget allowed). Every chapter graded B− or C+ against a truly-high-quality bar; none reached A-tier. Appendix A has the full per-chapter findings.

## Context

The repo is a 22-chapter interactive ML textbook (React + Vite SPA, dark-mode Distill-style, KaTeX math, ~101 interactive widgets + ~93 static SVG diagrams, deployed on Vercel). V1 is "done" (all chapters live), and the owner wants a critique-driven overhaul to reach a **truly high-quality textbook** bar.

A multi-agent critique (curriculum architecture, cross-chapter consistency, site/UX engineering, prose/pedagogy, per-chapter expert critics with adversarial verification) was run on 2026-07-12. Its findings drive this plan.

**Owner decisions (2026-07-12):**
1. **Full freedom** to restructure the curriculum (add/cut/merge/reorder chapters).
2. **Delivery as a runqueue-compatible work queue**: step 0 creates `prompts/queue.md` + an `npm run check` gate; the owner drains it with `./runqueue.sh` (already in repo, untracked).
3. **Fuller-textbook direction**: richer prose with derivations, worked examples, closing syntheses; widgets embedded as first-class, *directed* figures. Update the philosophy docs to match.
4. **Everything in scope**: content + site experience + engineering health.

## Critique — Executive Summary

**The good:** LLM-era content (ch08–10, 20–22) is impressively current (KV cache/GQA/MoE, DPO, Constitutional AI, MCP, SWE-Bench, LMArena). Page structure is uniform; all 93 diagrams have `role="img"`+labels; widget animation cleanup hygiene is perfect; core equations are mostly correct; ch07 (Attention) is the house-voice exemplar. Code-splitting is done (77 KB initial gzip).

**The five structural problems:**

1. **Prerequisite inversions.** RLHF/PPO (ch10) is taught 4 chapters before RL/PPO is derived (ch14); Vision Transformers (ch11) one chapter before convolutions are explained (ch12); LoRA/PEFT sits in ch04 before transformers exist.
2. **2026-relevance inversion.** Capsule Networks get a full chapter while Mamba/SSMs, tokenization, decoding/sampling, quantization/serving, post-2022 interpretability, speech, video/world-models get zero-to-one paragraph. Missing foundations too: no probability/information theory (KL, entropy, MLE are used but never taught), no classical baselines (reader's first-ever model is a neural net), no precision/recall/ROC anywhere.
3. **Widgets are undirected AND frequently unfaithful.** Two problems. (a) *Direction:* not one sentence in the book points at a widget, says what to try, or what to notice (verified by grep). No worked examples, no closing syntheses (21 of 22 chapters just stop). WidgetCard has no caption/try-this slot. (b) *Fidelity — the more serious one, since widgets are the book's whole differentiator:* a large fraction of flagship widgets present fabricated or hard-coded simulations that contradict their own displayed data or the prose. Confirmed examples: ch06 "LSTM vs GRU" panels are both vanilla RNNs with different constants (no gates, no cell state); ch15 DynamicRouting's hard-coded trajectory is provably the *opposite* of what routing computes on its own vote vectors; ch08 ScalingLaws uses the real Hoffmann constants whose optimum is 32–153 tokens/param, numerically contradicting the chapter's "20 tokens/param" headline; ch08 ResidualStream presents invented per-token contributions with authoritative linguistic claims; ch04 NormalizationComparison computes InstanceNorm identically to LayerNorm; ch04 KnowledgeDistillation's "student loss" is a clamp artifact (KL against a one-hot is infinite); ch05 SkipGram starts from pre-clustered weights so it can't show the learning it claims; ch01 BiasVariance's noise slider provably changes nothing but axis labels; ch17 has three widgets whose numbers contradict each other on GAN dynamics; ch20 BenchmarkLeaderboard plots fabricated human baselines. This pattern (analytic shortcuts dressed as simulation) recurs in most chapters and is the single highest-value content fix.
4. **Consistency drift.** Matrix convention silently flips (Wx in ch02/06/12 vs xW in ch07/08/11/13, mixed within ch09); citations render `[[1]]` in 19 chapters; 4 inline-citation markups; concepts fully re-explained twice with no cross-refs (RoPE, Toolformer, distillation temperature, RLHF pipeline, Constitutional AI); ch06 contradicts itself on LSTM gate count; notation drift (𝓛 vs L, T vs τ, d_k vs d_head, LLaMA/Llama); ch01 is a structural outlier (no TOC, pseudo-LaTeX that KaTeX renders wrong).
5. **Site gaps.** Topbar has a stale 17-chapter list (breadcrumbs wrong ch04+, prev/next dead-ends at ch17, ch18–22 unreachable by paging); TOC click-to-scroll computes wrong offsets once scrolled (core nav broken mid-session); no scroll reset on route change; Home is a 9-line stub; no error boundaries (one widget throw blanks the app); no 404, no per-chapter `document.title`/meta; no search, no hash deep-links, citations unlinked; widget a11y thin (60 unlabeled sliders, 16 hover-only widgets); printing broken; render-blocking Google Fonts; dead deps (d3, recharts) and dead files.

**Sample chapter depth (per-chapter critics):** ch02 graded B− (Telgarsky's theorem misstated; ActivationZoo renders ELU with α=0.1 mutated by the leaky-ReLU slider; UniversalApproximation is secretly an ELM — random features, only readout fitted — while prose implies a trained net; δ never defined in backprop recursion; softmax/logits used but never defined; ~6 name-checked works missing from CITATIONS). ch03 graded C+ (Adam bias-correction story is backwards — uncorrected first step is ~3× too LARGE, not "10× too slow"; "negligible by step 100" false for β₂=0.999; LRFinder widget labels divergent runs "good" and is orphaned in the wrong section; noise-ball radius has wrong power of η; every widget deterministic in a chapter about gradient noise; no momentum equation anywhere; stale — no SAM/Lion/Muon/WSD/second-order context). **Full per-chapter findings: see Appendix A.**

---

## Target Curriculum (25 chapters, 7 parts)

Renumbering is handled by a one-time migration (item S1) introducing a single source of truth `src/data/chapters.js`. Old→new mapping in parentheses.

**Part I — Foundations**
- 01 Probability & Information for ML — **NEW** (distributions, MLE/MAP, entropy/cross-entropy/KL, precision/recall/ROC)
- 02 Statistical Learning (old ch01, + linear/logistic regression as first hypothesis classes, + short classical-toolbox survey: trees/ensembles/kNN)
- 03 Neural Networks (old ch02)
- 04 Optimization (old ch03)
- 05 Training Techniques (old ch04, − LoRA/PEFT section → new ch14)
- 06 Convolutional Networks (old ch12, moved; + one-section historical sidebar absorbing Capsule Networks from old ch15)

**Part II — Language & Sequence**
- 07 Word Embeddings & Tokenization (old ch05, + full BPE/tokenization section w/ interactive BPE-merge widget)
- 08 RNNs & LSTMs (old ch06)
- 09 Attention (old ch07, − softmax-temperature section → new ch14; + cross-attention & masking material)
- 10 Transformers (old ch08; scaling-laws section stays as explicit teaser w/ forward ref to Part III)

**Part III — Large Language Models**
- 11 LLM Architectures (old ch09; owns RoPE deep treatment; + SSM cross-ref)
- 12 Reinforcement Learning (old ch14, moved before LLM training; owns PPO derivation; RLHF section becomes "the RL view of Chapter 13's pipeline")
- 13 LLM Training & Alignment (old ch10; + Reasoning Models & Test-Time Compute section; PPO exposition becomes cross-ref to ch12)
- 14 Efficient Inference & Deployment — **NEW** (decoding/sampling incl. temperature [from old ch07], KV-cache recap, quantization GPTQ/AWQ/FP8, speculative decoding, batching/vLLM, LoRA/QLoRA/PEFT [from old ch04], Retrieval & Grounding/RAG)
- 15 Multimodal Networks (old ch11, + Audio as a Modality section: ASR/TTS/audio tokens)

**Part IV — Beyond the Transformer**
- 16 Graph Neural Networks (old ch13)
- 17 State-Space Models & Attention Alternatives — **NEW** (S4/Mamba, RWKV, linear attention, hybrids Jamba/Griffin) — replaces Capsule Networks
​
**Part V — Generative Models** (renamed from "Image Generative Models")
- 18 Variational Autoencoders (old ch16)
- 19 GANs & Image-to-Image (old ch17 + old ch18 merged: conditional GANs + cycle consistency kept; SPADE etc. compressed)
- 20 Diffusion Models (old ch19, + closing section From Images to Video & World Models; ControlNet-style conditioning absorbed here)

**Part VI — Evaluation & Understanding**
- 21 Datasets & Benchmarks (old ch20)
- 22 Evaluating LLMs & Agents — **NEW** (perplexity vs task evals, LLM-as-judge, pass@k, contamination, agent-eval methodology)
- 23 Interpretability — **NEW** (probing, circuits/induction heads [cross-ref ch10's residual stream], SAEs/dictionary learning, activation steering)

**Part VII — AI Agents**
- 24 AI Agents (old ch21; owns multi-agent concepts; RAG narrows to memory w/ cross-ref to ch14)
- 25 Agent Harnesses (old ch22; AutoGPT compressed to historical note; multi-agent section becomes harness-consequences w/ cross-ref)

---

## Execution Architecture

### Step 0 — Queue bootstrap (first thing Sonnet does)
1. Add `"check"` script to package.json: `vite build` (later items extend it with smoke tests). Lint is NOT part of check yet (184 pre-existing react-hooks v7 errors; relaxed in item E6).
2. Create `prompts/queue.md` from the **Queue Manifest** below — GFM pipe table, one row per item, columns: `| id | title | status |` with status ∈ PENDING/DONE/SKIPPED (runqueue.sh counts status cells by shape).
3. Create `context/STYLE_GUIDE.md` from the **Editorial Standard** section below (verbatim), and update `context/PROJECT_OVERVIEW.md` + `context/CURRICULUM.md` to match owner decision #3 and the target curriculum (kill the "3-5 sentences" charter, the "17 chapters" remnant, the stale [in development] flags, "Mobile is NOT a priority", and "Dark mode only" if contradicted — mobile IS now supported).
4. Commit. Every subsequent queue item = one commit, marked DONE in queue.md in the same commit (runqueue.sh requires clean tree + queue progress per run).

### Queue item protocol
Each item's queue row links to its plan section here. Chapter items follow **critique→fix→verify**: re-read the chapter + its widgets/diagrams, apply the baked findings from Appendix A *plus* anything newly discovered against the rubric (Appendix B), then `npm run check` before commit.

### Ordering rationale
Bugs first (readers see them today) → structure second (so content passes hit final chapter shapes) → conventions third (mechanical, book-wide) → per-chapter deep passes (bulk of work, in reading order) → new chapters → site polish/QA last.

---

## Queue Manifest

### Phase E — Reader-visible bug fixes (small, do first)

- **E1. Navigation data + Topbar fix.** Create `src/data/chapters.js` (single source of truth: number, slug, dir, title, part, route) exporting PARTS+CHAPTERS; rewire `Sidebar.jsx` and `Topbar.jsx` (delete its stale 17-entry local list — fixes wrong breadcrumbs ch04+, prev/next dead-end at ch17, unreachable ch18–22). Fix Sidebar ch15 label. *(Keeps OLD numbering until S1.)*
- **E2. Citations render + data normalize.** `Citations.jsx:85` renders `[{c.num}]`; ch04–22 store `num:"[1]"` → renders `[[1]]`. Normalize ALL chapters to numeric `num` and keep component-owned brackets. Same item: link inline `[N]` markers to reference anchors (pick one markup — plain text with an anchor link; see V4).
- **E3. Scroll correctness.** (a) TocRail.jsx:140-152 and MobileNav.jsx:41-53 compute scroll targets with `window.scrollY` (always 0 — the scroll container is `#content-scroll`): use `scrollContainer.scrollTop + el.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top - offset`, or `scrollIntoView` + `scroll-margin-top`. (b) Add scroll-reset-to-top on route change in Layout.jsx. (c) Hash deep-links: on mount scroll to `location.hash`; TOC clicks update the hash.
- **E4. ch01 TOC + eyebrow labels.** Add `TOC_SECTIONS` + `useTocSections` + id'd section divs to old-ch01 (pattern from ch02). Fix eyebrows: ch01 → "Part I — Foundations"; ch06/07/08 → "Part II — Sequence & Attention" (canonical names come from chapters.js after E1).
- **E5. Resilience + metadata.** ErrorBoundary component wrapping (a) each lazy route in App.jsx's `L()` helper (catches widget crashes AND stale-chunk load failures, with reload fallback), (b) WidgetCard body (card-level degradation). Add `path="*"` 404 route. Per-route `document.title` from chapters.js. Meta description + OG tags in index.html.
- **E6. Hygiene.** Remove `d3` + `recharts` from package.json (unimported; ~9 MB, 200+ transitive deps) + `npm install`; delete `src/App.css`, `src/assets/{react.svg,vite.svg,hero.png}`, `.widget-placeholder` CSS; fix or delete ScrollableFigure (its `min(640px,100%)` defeats its purpose; if kept: `minWidth: '640px'`). Relax the failing react-hooks v7 lint rules in eslint.config.js to warnings so `npm run lint` is usable (fixing 101 widgets' patterns is NOT in scope).
- **E7. Fonts + print.** Self-host Inter/JetBrains Mono/Crimson Pro as woff2 `@font-face` (removes render-blocking cross-origin `@import`). Add ~30-line `@media print` stylesheet (unset 100vh/overflow shell, hide chrome, light palette).

### Phase S — Structural reorganization

- **S1. The renumbering migration.** Enact the Target Curriculum mapping in one mechanical item: rename `src/pages/chNN/` + `src/components/{widgets,diagrams}/chNN/` dirs to new numbers (existing chapters only; new chapters get scaffolds in Phase N), update chapters.js, routes, all imports, eyebrows, and in-prose "Chapter N" references (grep-verify against the old→new map). Old ch15 (Capsules) content parks in `src/pages/ch06/` as a section-in-waiting (integrated properly in C6). Old ch18 parks with ch19→new-19 for the C19 merge. `npm run check` + click-through smoke.
- **S2. Section moves.** Move (verbatim, with a `{/* MOVED-FROM */}` comment for the later content pass): LoRA/PEFT section old-ch04→new-ch14 scaffold; softmax-temperature section old-ch07→new-ch14 scaffold; distillation stays new-ch05 (old ch04) with ch09's temperature paragraph pointing back. Create empty scaffolds (lede + TOC + "in progress" note, hidden from sidebar `live:false` flag in chapters.js) for new ch01/14/17/22/23.
- **S3. Home landing page.** Build from chapters.js: hero (title, one-paragraph pitch, "Start with Chapter 1" CTA) + 7-part grid of chapter cards (number/title/widget count). Topbar already calls this route "Table of Contents" — make it true.

### Phase V — Book-wide conventions (mechanical sweeps; full spec in "Convention Decisions")

- **V1. Math notation sweep.** Enforce: `\mathbb{E}` everywhere; `\mathcal{L}` for named objectives, plain L only in gradient expressions; row-vector (xW) convention from Attention chapter onward with the one-sentence transposition note added in new-ch09; fix ch09 MoE router to `x W_g`; unify per-head dim to `d_k`; `W_i^Q` superscript style; τ for learned contrastive temperature, T for sampling/distillation (with reconciliation sentence); rewrite old-ch01's pseudo-LaTeX (`~` → `\sim`, Unicode → LaTeX, E → `\mathbb{E}`).
- **V2. Terminology sweep.** "Llama 2/3" (space) vs "LLaMA" (original only); lowercase "transformer" outside titles; "context window"; "Chapter N" cross-ref style (kill "Ch N"/"Chs N, M"); ban component names in prose (ch14's "already in the section's MathBlock" → "the equation above").
- **V3. Dedup + cross-link sweep.** Assign owning chapters and convert duplicates to cross-refs: RoPE→ch11 owns (ch10 gets 1 para + pointer, unify symbol to m/n); Toolformer→ch13 owns (ch24 one sentence); distillation temperature→ch05 owns; RLHF pipeline→ch13 owns (ch12 §5 reframes as "the RL view"); Constitutional AI→ch13 owns. Add the ~8 missing cross-links (attention→RNN bottleneck handoff, transformers→attention, embeddings→RNN/transformer forward refs, CLIP-τ→temperature, agents-tools→training-tools, datasets-scaling→scaling-laws). Fix ch06 LSTM "three gates" vs "4 gates to 2" contradiction (standardize: 3 gates; candidate is not a gate). Fix ch09 KV-cache internal inconsistencies (prose "quadratic" vs math O(T³d); two different "KV size" formulas — label scopes).
- **V4. Citations infrastructure.** Extract `src/data/citations.js` keyed by slug (each paper's metadata exists once — fixes RoFormer venue conflict, FlashAttention author drop); chapters import their lists. One inline marker style everywhere (plain `[N]` linked per E2). Remove ch07's orphaned FlashAttention/ViT entries; add markers for its discussed-but-unmarked papers.
- **V5. WidgetCard upgrade.** Add `tryThis` prop rendered under the header as "Try: … Notice: …". Add `useIsVisible` (IntersectionObserver) + `prefers-reduced-motion` gating hook for the 29 RAF-driven widgets (pause off-screen; respect reduced motion). Populating tryThis happens per-chapter in Phase C.

### Phase C — Per-chapter deep passes (one item per chapter, new reading order)

Protocol per chapter (full rubric: Appendix B; baked findings: Appendix A):
1. Fix all Appendix A findings for the chapter (critical → major → minor).
2. Apply the Editorial Standard: section skeleton, widget hand-offs + tryThis for every widget, one worked micro-example with concrete numbers, first-use glosses, closing "What carries forward" + next-chapter pointer, lede check.
3. Complete citations (add name-checked-but-missing entries via citations.js).
4. Currency check to mid-2026 (each chapter's Appendix A entry lists specifics).
5. `npm run check`; visual spot-check of changed widgets via dev server if available.

Items C2–C25 cover existing chapters (C2=new-ch02 Statistical Learning … C25=Agent Harnesses), skipping the five new chapters (Phase N). C6 integrates the Capsules sidebar into ConvNets; C19 executes the GANs+I2I merge; C2 adds linear/logistic regression + classical toolbox sections; C7 adds the tokenization section + BPE widget; C13 adds reasoning/test-time-compute section; C15 adds the audio section; C20 adds the video/world-models section; C21 adds eval-methodology depth (coordinating with N22).

### Phase N — New chapters (spec'd in Appendix C)

- **N1.** ch01 Probability & Information for ML (4-5 sections, 4 widgets — e.g. distribution explorer, MLE fitter, entropy/KL visualizer, ROC/threshold explorer)
- **N14.** ch14 Efficient Inference & Deployment (5 sections, 5-6 widgets — sampling playground, KV-cache/batching sim, quantization error explorer, speculative-decoding race, LoRA rank explorer)
- **N17.** ch17 SSMs & Attention Alternatives (4 sections, 4 widgets — recurrence↔convolution duality, selective-scan gating, complexity-vs-length race, hybrid layer-mixer)
- **N22.** ch22 Evaluating LLMs & Agents (4 sections, 3-4 widgets — pass@k calculator, LLM-judge agreement explorer, contamination demo, agent-trajectory scorer)
- **N23.** ch23 Interpretability (4-5 sections, 4 widgets — probing playground, induction-head tracer, SAE feature browser sim, activation-steering demo)

New chapters follow the Editorial Standard and widget conventions (viewBox `0 0 640 H` diagrams, WidgetCard, no real inference — analytic/simulated math only). **Widget fidelity is mandatory** (see the cross-cutting finding): a widget must actually compute what it claims, or visibly disclose the simplification — no hard-coded trajectories, no numbers that contradict the prose. Flip `live:true` in chapters.js on completion. Full section/widget specs: Appendix C.

### Phase Q — Site polish & QA (last)

- **Q1. Accessibility pass.** TocRail items → `<button>`s; `aria-label` on all ~60 range sliders (shared LabeledSlider or per-widget); focus/tap equivalents for the 16 hover-only widgets.
- **Q2. Search/filter.** Sidebar filter box over chapter+section titles (TOC_SECTIONS data already exists; no index infra).
- **Q3. Mobile widget pass.** Audit worst offenders at 375px (BenchmarkLeaderboard, SPADESynthesis-successor, ScalingLawCurves, LatentSpaceExplorer, multi-panel widgets in RL/agents chapters): stack panels below breakpoint or wrap in fixed ScrollableFigure.
- **Q4. Tests + CI.** Playwright smoke: visit every route from chapters.js, assert render + zero console errors; extend `npm run check` to include it; GitHub Actions workflow (build + smoke + lint-as-warnings).
- **Q5. Final consistency audit.** Re-run the Appendix B global checks (grep-driven); Lighthouse mobile baseline; update audit-report.md/mobile-pass-report.md status or delete; final pass over context/ docs.

---

## Editorial Standard (→ context/STYLE_GUIDE.md, adapted for "fuller textbook" decision)

**Section skeleton:** (a) concept paragraphs — plain-language first sentence, citation-free opener; depth welcome (derivations, mechanism) but one idea per paragraph, ≤6 sentences each; (b) MathBlock immediately followed by a one-sentence symbol gloss; (c) **widget hand-off: 1–2 sentences containing an imperative and a predicted observation** ("Drag the degree slider past 9; notice test error climbing while train error falls") — hard rule: NO widget without a hand-off; (d) widget with populated `tryThis`; (e) optional "Going deeper" paragraph (history/frontier/papers).
**Chapter shape:** 4–6 sections; lede = 3 beats (plain-language hook, the chapter's core move, stakes/forward connection — no notation); **every chapter ends with a 3–4 sentence "What carries forward" + one-line pointer to the next chapter**; one worked micro-example with concrete numbers per chapter.
**Voice:** ch09-Attention (old ch07) is the house exemplar — concrete, mechanistic, quantitative, ≤1 rhetorical flourish per section. "We" for exposition, "you" for widget directives. First-use gloss rule: any term of art gets an appositive at first use per chapter (i.i.d., BLEU, perplexity, ELBO, logits, convexity…). Citations inline as "Name et al. (year) [n]" — max two surnames, no author roll-calls.
**Widgets:** simulation must be faithful to the stated math (no silent simplifications — disclose or fix, cf. ch02's ELM issue); named preset buttons for "aha" configurations; status labels must be truthful (no "converged" for exhausted step budgets, cf. ch03).

## Convention Decisions (referenced by V1–V4)

| Topic | Convention |
|---|---|
| Expectation | `\mathbb{E}` everywhere |
| Loss | `\mathcal{L}` for named objectives; plain `L` only inside derivatives |
| Matrix orientation | Column (Wx) through Part I–II RNN chapters; row (xW) from Attention onward, with one explicit transposition sentence in the Attention chapter |
| Per-head dim | `d_k` (note `d_head = d_k` if needed) |
| Projections | `W_i^Q` superscript style |
| Temperature | `T` sampling/distillation; `τ` learned contrastive (one reconciliation note) |
| Position symbols (RoPE) | m/n |
| Model names | "LLaMA" 2023 original only; "Llama 2", "Llama 3" |
| "transformer" | lowercase except in paper titles |
| Cross-refs | Spelled-out "Chapter N" |
| Inline citations | plain `[N]`, anchor-linked to References |
| Citation data | `src/data/citations.js`, keyed by slug, `num` assigned per chapter at import |

## Verification

- Gate on every item: `npm run check` (build; + Playwright smoke after Q4) — runqueue.sh runs it automatically after each item.
- Phase E/S items: manual click-through (nav to ch18–22 via prev/next, TOC clicks after scrolling, citation rendering, 404, home page).
- Chapter items: render chapter in dev server; exercise each changed widget; verify equations render (KaTeX errors are silent-ish — grep console).
- Queue hygiene: every item commits queue.md status flip in the same commit; tree clean after each run.

---

## Appendix A — Per-chapter findings (from critique fan-out)

All 22 existing chapters graded B− or C+; all scoped "moderate rewrite". Chapters referenced by CURRENT number (→ new number). CRIT = critical (wrong/broken as rendered), verified where marked ✓. Each Phase-C item must fix all CRIT + major issues for its chapter; only the load-bearing ones are listed here — the fuller issue lists live in the workflow journal at `subagents/workflows/wf_430c0093-696/journal.jsonl` and the per-chapter JSON in scratchpad if deeper detail is needed. **Recurring across nearly every chapter:** (i) widget fidelity failures (fabricated/hard-coded sims), (ii) terms used before definition for the no-ML audience, (iii) name-checked papers missing from CITATIONS, (iv) staleness vs mid-2026. Assume all four apply per chapter unless noted.

**ch01→02 Statistical Learning (B−).** CRIT✓: first equation `(x_i,y_i) ~ P(X,Y)` — KaTeX eats `~`, distributed-as symbol vanishes (StatisticalLearning.jsx:115 → `\sim`). CRIT✓: BiasVariance widget — noise factors out entirely (optimal d always 4, chart pixel-identical at every noise; bias² wrongly scales with noise). Use smoothly-decaying noise-independent bias e.g. `bias2=0.5·exp(−d/3)`, `variance=(d/20)²·(0.1+noise)` — *verifier flagged the critic's own first fix as still pinning d=4; test on the integer grid before shipping*. 3 of 4 diagrams have geometric infidelities (DecisionBoundaryShapes 1-NN panel has zero training error yet claims to show overfitting; L1L2Geometry contours not tangent to constraint sets). Belkin 2019 (double descent) discussed + in a figure but absent from refs; NFL cites the optimization paper not the supervised one; Geman title wrong. Missing: train/val/test + CV protocol (used, never defined), concrete losses (MSE/0-1/log), Bayes error, curse of dimensionality, learning curves. Add linear/logistic regression + classical-toolbox sections here per curriculum.

**ch02→03 Neural Networks (B−).** CRIT✓: Telgarsky 2016 misstated (it's a Θ(k³)-depth vs O(k)-depth separation, not "exp neurons at depth O(log k)"). CRIT✓: ActivationZoo draws ELU with α=0.1 (leaky-ReLU slider's value) not 1.0 — ELU looks like ReLU. CRIT: CE-gradient=p̂−y argument depends on softmax/logits, neither defined for a no-ML reader. UniversalApproximation is secretly an ELM (random frozen hidden weights, only readout fit) while prose implies a trained net — disclose or train the tiny net in-browser. δ never defined in backprop recursion; no base case, no bias gradient. Missing: perceptron/single-neuron on-ramp, softmax/output-head design, affine-collapse one-liner. Missing refs: Telgarsky, Hornik (also: non-poly UAT is Leshno 1993 not Hornik), Werbos, Nair&Hinton, Shazeer/SwiGLU.

**ch03→04 Optimization (C+).** CRIT✓: Adam bias-correction story backwards — uncorrected first step is ~3× too LARGE (√v₁ is biased low too), not "10× too slow." CRIT✓: LRFinder unclamped on the unbounded saddle surface → divergent LRs get loss −10^40 and are colored green "good," polluting the recommendation. Major✓: "negligible by step 100" false for β₂=0.999 (1−0.999¹⁰⁰≈0.095, still ~10× correction). Noise-ball radius has wrong power of η (√η not η); Keskar was CIFAR/MNIST not ImageNet; "global minimum in principle unreachable" is wrong/stale. Momentum update rule never written; Adam's m_t/v_t used before defined. Every widget deterministic in a chapter about gradient noise. Missing (currency): SAM + Dinh reparam caveat, Lion/Sophia/Muon/Shampoo/Adafactor/8-bit, WSD/schedule-free, second-order context, gradient-noise-scale.

**ch04→05 Training Techniques (C+).** FIVE CRIT: (1) distillation loss MathBlock applies T to the hard-label term + omits T² on KL — nonstandard, inconsistent with its own widget; (2) KnowledgeDistillation widget's "student loss" is a clamp artifact (KL vs one-hot = ∞); (3) NormalizationComparison computes InstanceNorm identically to LayerNorm (tabs change only color, contradicting the diagram above); (4) "starting with LLaMA, models switched to RMSNorm" self-refuting (T5 2019, Gopher/Chinchilla 2021-22 predate it); (5) InitializationExplorer tanh mode decays Xavier below its own "stable zone" while recommending Xavier. Missing: inverted dropout, BN inference/running-stats + small-batch failure, learnable γ/β, KL definition, LoRA α + init, pre-LN vs post-LN. **Note:** LoRA/PEFT section moves out to new-ch14 (S2); distillation stays and becomes the owner (V3).

**ch05→07 Word Embeddings (B−).** CRIT✓: analogy written backwards — prose "France − Paris + Italy ≈ Rome" contradicts the MathBlock below it (should be Paris − France + Italy, or Rome). CRIT: GloVe "dot product approximates log of the *ratio*" — false, it fits w·w̃+b+b̃≈log X_ij (only the *difference* gives the ratio). CRIT: SkipGram INIT_W_IN pre-clustered (cos(cat,mat)=0.995 before any step) so it can't show learning. Missing: cosine-sim definition, count-based/PMI lineage + Levy&Goldberg SGNS≈shifted-PMI, intrinsic/extrinsic eval, subsampling/hierarchical-softmax, modern sentence embeddings + vector search/RAG, embedding layers inside LLMs (weight tying → ch10). Add the tokenization section + BPE widget here per curriculum.

**ch06→08 RNNs & LSTMs (C+).** FOUR CRIT: (1)✓ "GRU simplifies LSTM from 4 gates to 2" contradicts the chapter's own "three gates" (candidate c̃ isn't a gate); (2)✓ GRUvsLSTM widget — both panels are the identical vanilla-RNN update with different constants (no gating/cell state/GRU at all); (3) "spectral radius >1 ⇒ exploding gradients" false (necessary not sufficient; tanh saturation can still kill gradients); (4) GRU + encoder-decoder misattributed to the wrong Cho 2014 paper. Missing: BPTT as an algorithm, output layer + training objective, the parallelism limitation (the real reason transformers won), SSM/Mamba/xLSTM revival, teacher forcing.

**ch07→09 Attention (B−, house voice exemplar).** FOUR CRIT: (1)✓ QKVInspector hard-codes the highlighted cell to column 2 but the true argmax is column 1 for 2 of 4 query tokens — widget contradicts its caption; (2)✓ step-5 "max contribution" stat labels an output *feature dimension* as a *token*; (3)✓ QKVMechanism diagram's weights [.02,.74,.18,.06] aren't the softmax of its own scores (true: [.02,.86,.09,.03]); (4)✓ six JSX-whitespace-stripped renders ("d_kitself", "the1/√d_k"…). Zero inline citation markers (breaks house convention); FlashAttention/ViT are orphaned refs (belong to ch09/ch11). Missing: self vs cross attention (never defined though widgets show self-attn), O(n²) cost, causal/padding masks, additive-Bahdanau math (Section 1 has zero math), "attention is not explanation" caveat. Move softmax-temperature §4 out to new-ch14 (S2); add cross-attention + masking to fill the space.

**ch08→10 Transformers (C+).** FIVE CRIT: (1)✓ ScalingLaws widget's Hoffmann constants give 32–153 tokens/param across the slider (never ~20), contradicting the chapter's "20 tokens/param" headline and showing Chinchilla as suboptimal; (2)✓ ResidualStream widget fabricates per-token contributions with authoritative linguistic claims; (3)✓ residual-stream MathBlock writes the parallel-block variant (FFN on pre-attn stream) while the block equations define sequential; (4)✓ "FFN hidden = 4×d_model = 16384 for LLaMA-7B" wrong (it's 11008; SwiGLU uses ≈8/3·d); (5)✓ ResidualStreamHighway diagram is drawn upside-down vs its own flow. Missing: full-model assembly (embed→blocks→final-norm→unembed→softmax→CE), causal-masking mechanics, RMSNorm cross-ref to ch04, YaRN/position-interpolation by name, emergence-vs-metric-artifact debate. Scaling-laws stays as an explicit teaser with forward ref (curriculum).

**ch09→11 LLM Architectures (C+, most issues: 7 CRIT / 16 major).** RoPE frequency ordering inverted in BOTH prose and the RoPEFrequencySpectrum diagram (θ_i=base^(−2i/d): i=0 is FASTEST/fine, not coarse) — and that diagram's footer wavelengths are ~10× off; the chapter's own widget is correct, so it self-contradicts. AttentionVariants: GQA cache ratio computed as 1/G but true is G/h (panel says 0.5× while the chart beside it correctly shows 25%); "G× smaller" label should be h/G. KVCache widget "140 GB" vs prose "40 GB" vs diagram "40 GB" (40 is correct for GQA-8 70B FP16). MHAvsMQAvsGQA figcaption inverts GQA vs MQA cache. Missing: modern block anatomy (pre-norm/RMSNorm/SwiGLU/bias-removal), prefill vs decode, sliding-window/attention-sinks, SSM/hybrid paragraph, DeepSeek-era fine-grained+shared-expert MoE. **This chapter owns RoPE (V3).**

**ch10→13 LLM Training & Alignment (B−).** CRIT: for a mid-2026 chapter, RL-from-verifiable-rewards / reasoning-model post-training (o1/R1, GRPO, long-CoT RL) is entirely absent and DPO is still framed as "the default" (stale). CRIT: LIMA stats misattributed (43% equiv-or-preferred vs GPT-4, not "vs GPT-3.5"). CRIT: BaseVsSFTBehavior diagram says Llama-2 used ~1M SFT pairs — it used ~27,540 (the 1M is preference comparisons). Broken ch17 cross-ref. Reward-model/Bradley-Terry loss never shown though the DPO narrative depends on it; uses PPO/KL before ch14 teaches them. Add the Reasoning & Test-Time Compute section here (curriculum). **Owns RLHF pipeline + Constitutional AI (V3).**

**ch11→15 Multimodal (C+).** CRIT✓: Whisper described as contrastive alignment — it's a weakly-supervised seq2seq encoder-decoder, not CLIP-for-audio. Misleading claim that text-to-image needs cross-modally-aligned text encoders (T5-based Imagen/SD3 refute it; T5-XXL mislabeled a CLIP derivative). ContrastiveLearning widget fakes training with a canned interpolation; all four widgets mislabeled "9.x" in an (old) ch11. Missing: VLM fusion architectures (LLaVA projectors, Q-Former/Perceiver, cross-attn vs prefix), CLIP failure modes (compositionality, typographic attacks), SigLIP sigmoid loss explained, early-fusion native multimodal (Chameleon/Fuyu/4o), audio done correctly (CLAP). Add the Audio-as-a-Modality section (curriculum).

**ch12→06 ConvNets (B−).** CRIT: ConvVsFullyConnected diagram headline "~50M FC weights" for a 224×224 input — it's ~50K (off ~1000×). CRIT: "U-Net backbones of every modern image generator" false in 2026 (SD3/Flux/Sora are DiT). CRIT: "AlexNet introduced ReLU and dropout" — ReLU is Nair&Hinton 2010, dropout Hinton 2012; AlexNet popularized them. CRIT: ArchitectureTimeline plots LeNet's 99.2% MNIST on the same axis as ImageNet top-1. Missing (for no-ML audience): pooling, multi-channel convolution + param formula, output-size formula, equivariance-vs-invariance, learned-filter hierarchy, transfer learning. Currency: DiT, large-kernel revival, ConvNeXt V2. **Moves to Part I; absorbs the Capsule Networks historical sidebar (C6).**

**ch13→16 GNNs (B−).** CRIT✓: transductivity explanation wrong ("GCN ties representations to node identities, adding a node needs retraining" — GCN learns weight matrices on features, is inductive à la GraphSAGE). CRIT: thrice-repeated "GCN weighs all neighbors equally" contradicts symmetric normalization 1/√(d̃_i d̃_j). Garbled spectral derivation; widgets rendered before their concept; zero framing prose for the widgets. Missing: graph-level readout/pooling + graph classification, task taxonomy incl. link prediction, over-squashing, graph transformers + positional/structural encodings, permutation invariance stated as THE inductive bias, substantive applications (GraphCast, AlphaFold).

**ch14→12 Reinforcement Learning (B−).** CRIT✓: "gradient is zeroed outside the clip range" wrong — the min() makes clipping one-sided (contradicted by the chapter's own widget). CRIT✓: RLVRvsRLHF widget conflates R1 with R1-Zero, contradicting the page text. TRPO diagram says the KL ball "lives in policy-parameter space" (inverts TRPO's point); MDPExplorer double-counts the goal reward. Missing: exploration/ε-greedy (used, never taught), value iteration as an algorithm (widget runs it, prose doesn't describe it), formal G_t/V^π/Q^π in page math, reward hacking named, stochastic transitions ever exercised. **Moves before ch13; owns the PPO derivation (V3).**

**ch15 Capsule Networks (C+) — being DEMOTED to a §sidebar in ConvNets (new-ch06).** THREE CRIT (all widget/diagram fabrications): DynamicRouting's hard-coded couplings are the opposite of what routing computes on its own votes; CnnVsCapsnet shows sub-1 couplings to a single output capsule (softmax over j forces 1.0); RoutingByAgreement diagram normalizes over the wrong index. Keep the good "why capsules lost" postmortem + invariance/equivariance framing as the sidebar's spine; drop the broken widgets. Freed slot → new-ch17 SSMs.

**ch16→18 VAEs (B−).** THREE CRIT (all widgets): LatentSpaceExplorer decoder is discontinuous (shape snaps at z1=±0.33) yet prose claims "smooth morphing"; its z2 axis is mislabeled/inverted; ELBODecomposition's "latent quality" rises to 97% green exactly where its own regime text says "posterior collapse." Math on the page verifies exactly — but KL is never formally defined anywhere in the book, and the core motivation (why log p(x) is intractable) is missing. Missing: latent-variable setup, closed-form diagonal-Gaussian KL, posterior collapse in prose, decoder likelihoods (Bernoulli/Gaussian), explicit generation recipe, VQ-VAE content (matters for ch11 tie-in). KL definition arrives in new-ch01 (N1), so this becomes a cross-ref.

**ch17→19 GANs (C+).** THREE CRIT: NonSaturatingLoss diagram plots a sign-flipped generator loss (−log(1−x)); TrainingDynamics labels discriminator-dominance "Mode Collapse," contradicting the adjacent GANLossCurves which correctly says collapse is invisible in losses; DBEvolution's "D accuracy 91%" contradicts its own D(x)=0.99-on-fakes and inverts real dynamics (D accuracy should fall to 50%). Missing: optimal-discriminator theorem + C(G)=2·JSD−log4, conditional GANs/BigGAN, FID definition (shown in a widget, defined nowhere), Lipschitz/JSD definitions, hinge loss, GAN latent-space editing/inversion, 2023-26 currency (diffusion distillation w/ adversarial loss, GigaGAN). **Merges old-ch18 Image-to-Image (C19).**

**ch18 Image-to-Image (B−) — MERGING into GANs (new-ch19).** THREE CRIT: param comparison reverses reality (pix2pix U-Net ~54M ≫ CycleGAN); SPADEBlock numeric grid doesn't satisfy γ·y+β; PatchGAN "outputs" imply non-overlapping tiling (70×70 → 30×30 real). Keep conditional-GAN + cycle-consistency spine; compress SPADE. Missing: CUT (contrastive unpaired), perceptual/feature-matching losses, translation eval (FID/LPIPS), cycle-consistency steganography failure. Modern conditional generation (ControlNet/InstructPix2Pix) is diffusion — route to new-ch20.

**ch19→20 Diffusion (B−).** CRIT✓: ReverseDenoising widget isn't reverse denoising — it replays the forward closed-form backwards with fixed ε, so "DDPM" and "DDIM" both deterministically recover the original point (conflates generation with rewinding). CRIT: "4× spatial downsampling" but 512→64 is 8× (f=8). CRIT (pedagogy): the single-step forward kernel q(x_t|x_{t−1})=N(√(1−β_t)x_{t−1}, β_t I) and the reverse sampling update are NEVER written — reader can't see where ᾱ_t comes from or how sampling works. Missing: classifier guidance as precursor to CFG, ε vs x_0 vs v prediction, few-step distillation (LCM/Turbo/schnell), Song&Ermon NCSN lineage (uncited). Add the video/world-models closing section (curriculum).

**ch20→21 Datasets & Benchmarks (C+).** FOUR CRIT: BenchmarkLeaderboard plots a wrong ImageNet human baseline (95.5% is top-5-derived, on a top-1 chart → "Surpassed: Not yet") and a fabricated HumanEval baseline (85%, "surpassed 2024"); BenchmarkSaturation MMLU trajectory lags real SOTA ~1.5 yrs (GPT-4 hit 86.4 in Mar 2023, chart says 2024) and shows frontier benchmarks at ~half real scores (o1 hit ~78% GPQA-diamond late 2024). Common Crawl dated 2008/2014/2017 on one page. Chapter has zero math though it's the Evaluation chapter. Missing: metric fundamentals (top-1/5, F1, BLEU, perplexity — defined nowhere in the book), pass@k + estimator, Elo/Bradley-Terry mechanics, adaptive overfitting (ImageNet-v2, label noise), contamination practice, data-curation pipeline (RedPajama/Dolma/FineWeb). Eval *methodology* depth splits to new-ch22.

**ch21→24 AI Agents (B−, strong 2026 framing).** CRIT✓: ToolUseFlow says math.factorial(347)=5.148×10^750; true ≈2.907×10^732 — a wrong constant in the widget whose lesson is "code gives exact answers." CRIT: MemoryArchitecture CapacityChart ranks Working (10) 10× above In-Context (1) while its own StatsPanel says Working ~10K tokens vs In-Context 128K–1M — inverted. Overstated "prompt injection unique to agents"; oversimplified "Claude Code/Cursor are internally multi-agent." Thin citations (WebArena/GAIA/SWE-bench/MCP named, not in refs). Missing: formal agent loop ↔ RL formalism (ch12), computer-use/GUI agents, Reflexion/plan-execute, workflow-vs-agent spectrum, sandboxing/least-privilege as prose, cost/latency economics. **Owns multi-agent concepts (V3); RAG narrows to memory.**

**ch22→25 Agent Harnesses (B−).** FOUR CRIT: Claude Code dated 2024 (launched Feb 24 2025) + false "renamed from Claude Code SDK to Claude Agent SDK"; Codex CLI safety inverted (its default is approval-required suggest mode + Seatbelt/Landlock sandboxing, not "approve-by-default, less scaffolding"); WorkflowsToAgentsSpectrum diagram lists different "six patterns" than the paragraph above it; "7 permission modes" mixes real + invented names and omits plan mode. Missing: MCP mechanics (host/client/server, tools vs resources vs prompts), sandboxing as a design axis, harness security (injection via tool results), broader landscape (Gemini CLI/OpenHands/Devin/SWE-agent), CLAUDE.md/AGENTS.md memory, prompt-caching economics, head-to-head eval (Terminal-Bench/SWE-bench Verified). AutoGPT deep-dive → one historical paragraph.

## Appendix B — Per-chapter critique rubric (for Phase C items)

1. **Correctness:** verify every equation (dimensions, signs, standard form), factual/historical claim, and number; read widget code line-by-line — does it compute what the prose claims? Flag unfaithful simulations.
2. **Pedagogy:** prerequisite check against the NEW chapter order; definitions before use; intuition before formalism; widget placement and hand-offs.
3. **Coverage/depth vs a high-quality mid-2026 chapter** on the topic; flag stale/missing frontier material.
4. **Prose:** Editorial Standard compliance.
5. **Citations:** entries correct (authors/venue/year), name-checked works present, markers match.
6. **Widgets:** effective? faithful? edge cases (clamps, divergence labels, unbounded state)? tryThis populated?

## Appendix C — New chapter specs

All new chapters: 4–6 sections, Editorial Standard throughout, static SVG diagrams (viewBox `0 0 640 H`, `role="img"`+aria-label, one figcaption), widgets analytic-only (no real inference), citations via citations.js. Cross-reference existing chapters rather than re-explaining.

### N1 — ch01 "Probability & Information for Machine Learning"
Purpose: teach the vocabulary the whole book silently assumes (MLE in ch03-losses, KL in ch13/ch18, entropy everywhere), for the no-ML-background reader.
1. **Uncertainty as distributions** — random variables, common distributions (Bernoulli/categorical/Gaussian), sampling vs density. *Widget: DistributionExplorer* (sliders for params; overlay samples histogram vs density).
2. **Fitting distributions: MLE (and a nod to MAP)** — likelihood as "probability of the data as a function of parameters"; log-likelihood; worked micro-example: MLE for a coin and for a Gaussian mean. *Widget: MLEFitter* (drag data points; watch likelihood surface + argmax move).
3. **Entropy, cross-entropy, KL** — surprise → entropy; cross-entropy as "cost of the wrong code"; KL as the gap; forward pointer: "cross-entropy loss (Chapter 3), the ELBO (Chapter 18), the RLHF KL penalty (Chapter 13)". *Widget: EntropyKLVisualizer* (two adjustable discrete distributions; live H(p), H(p,q), KL(p‖q) bars).
4. **Judging classifiers** — confusion matrix, precision/recall/F1, ROC/AUC, threshold trade-off (book-wide gap: these appear nowhere today). *Widget: ThresholdROCExplorer* (slide a decision threshold along two class-conditional Gaussians; confusion matrix + ROC point trace live).
Closing: "What carries forward" → Chapter 2 uses this vocabulary to define learning itself.

### N14 — ch14 "Efficient Inference & Deployment"
Purpose: "how does a trained LLM actually run, get cheap, and get adapted" — absorbs softmax-temperature (old ch07 §4) and LoRA/PEFT (old ch04).
1. **Decoding & sampling** — greedy/temperature/top-k/top-p, beam vs sampling; absorbed temperature material becomes the anchor. *Widget: SamplingPlayground* (fixed toy next-token distribution; switch strategies, see selected-token histograms).
2. **The memory bill: KV cache & batching** — recap ch11's KV cache (cross-ref, don't re-derive); continuous batching/PagedAttention intuition. *Widget: ServingSimulator* (requests arrive; toggle static vs continuous batching; GPU-utilization bars).
3. **Quantization** — INT8/FP8/GPTQ/AWQ intuition: outliers, per-channel scales; quality-vs-bits. *Widget: QuantizationExplorer* (quantize a weight histogram at chosen bit-width; reconstruction error + outlier handling toggle).
4. **Speculative decoding** — draft/verify; acceptance math at intuition level. *Widget: SpeculativeRace* (draft model proposes k tokens; accept/reject animation; tokens/sec counter vs baseline).
5. **Adapting cheaply: LoRA/QLoRA & PEFT** (moved section, updated: rank intuition, merged-at-inference, QLoRA = quantized base + LoRA) + **Retrieval & Grounding** (RAG as the deployment-side pattern; cross-ref ch24's memory framing). *Widget: LoRARankExplorer* (low-rank approximation of a weight matrix; rank slider vs reconstruction quality; existing old-ch04 LoRA widget may be adapted).

### N17 — ch17 "State-Space Models & Attention Alternatives"
Purpose: fix the book's most dated omission (zero mentions of Mamba/S4/RWKV/linear attention today).
1. **The cost of attention** — O(T²) recap (cross-ref ch09/ch11 KV-cache); what "linear-time sequence modeling" would buy. *Diagram: complexity curves.*
2. **State-space models: S4 → Mamba** — continuous SSM → discretization → the recurrence↔convolution duality; Mamba's selectivity (input-dependent gating) as the unlock. *Widget: SSMDuality* (same SSM run as recurrence and as convolution; toggle views; kernel visualization). *Widget: SelectiveScan* (tokens flow through a gated state; watch state contents persist/reset based on input).
3. **RWKV & linear attention** — kernelized attention, the RNN reformulation. *Widget: ComplexityRace* (attention vs SSM vs linear attention: latency/memory vs sequence length, analytic curves with interactive T).
4. **Hybrids in production** — Jamba/Griffin-style interleaving; when full attention still wins (precise recall); honest scorecard vs transformers. *Widget: HybridLayerMixer* (compose a stack from attention/SSM/MLP layers; live param + KV-memory + long-context-recall heuristic readout).
Closing → cross-ref ch23 (interpretability of transformers is another reason they persist).

### N22 — ch22 "Evaluating LLMs & Agents"
Purpose: methodology counterpart to ch21's benchmark catalog (which stays as-is, cross-referenced).
1. **Perplexity vs task performance** — what perplexity measures and where it diverges from usefulness. *Widget: PerplexityVsAccuracy* (toy model quality slider; per-token loss vs downstream task success curves diverge).
2. **Sampling-based evaluation: pass@k** — the unbiased estimator, why k matters for coding evals. *Widget: PassAtKCalculator* (per-problem success prob sliders → pass@1/10/100 with the estimator formula live).
3. **LLM-as-judge** — rubrics, pairwise vs absolute, position/verbosity biases, agreement with humans. *Widget: JudgeAgreementExplorer* (simulated judge with bias knobs; watch rankings flip; Elo-style aggregation).
4. **Contamination & benchmark hygiene** — train-test leakage at web scale, canary strings, dynamic/private benchmarks (cross-ref ch21's HLE/LMArena coverage). *Diagram: contamination pathways.*
5. **Evaluating agents** — trajectory vs outcome scoring, SWE-Bench/WebArena methodology, cost/reliability axes (pass^k vs pass@k for reliability). *Widget: AgentTrajectoryScorer* (step through a canned agent trajectory; score outcome-only vs per-step; see how the two disagree).

### N23 — ch23 "Interpretability"
Purpose: extend ch10's residual-stream/circuits seed (2022) to the 2024–26 story; cross-ref, don't duplicate.
1. **What would it mean to understand a model?** — behavioral vs mechanistic; probing and its limits. *Widget: ProbingPlayground* (toy hidden states; train a linear probe (closed-form) for a concept; accuracy vs layer curve).
2. **Features & superposition** — features as directions; superposition when features > dimensions. *Widget: SuperpositionExplorer* (2D visualization of n>2 features packed into 2 dims; interference readout as feature count grows).
3. **Circuits & induction heads** — recap+extend ch10's residual-stream section (explicit cross-ref); induction as the canonical circuit. *Widget: InductionHeadTracer* (step a repeated-token sequence through 2 attention layers; watch the prev-token head + induction head pattern light up).
4. **Sparse autoencoders & dictionary learning** — decomposing activations into interpretable features; what SAEs found in frontier models (2024–26). *Widget: SAEFeatureBrowser* (simulated activation vectors → sparse feature decomposition; select a feature, see top-activating toy inputs).
5. **Steering & the limits of interpretability** — activation addition/steering vectors; honest state of the field. *Widget: SteeringDemo* (toy 2-concept space; add a steering vector, watch simulated outputs shift).
