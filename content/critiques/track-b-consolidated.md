verdict: resolved

## Track B consolidated critique

Independent re-review of all 7 Track B commits (`b08477d`, `d3165d9`, `2b7e351`, `e5adeaa`, `4b6db8b`, `94030cd`, `ecc2b29`) against `CRITIQUE.md`. Re-derived from the current diffs and primary sources rather than trusting commit messages; ran the gate; wrote standalone Node reproductions where the task called for them.

### REQUIRED

**R-04 / M-02 is only half-fixed — the widget disclosure CRITIQUE.md named still repeats the factual error the prose fix was supposed to remove.**
`src/components/widgets/ch14/QuantizationExplorer.jsx:336-340` (rendered disclosure text)

CRITIQUE.md's M-02 finding and its R-04 remediation task both explicitly named *two* locations: `src/pages/ch14/EfficientInference.jsx:476-489` (prose) **and** `src/components/widgets/ch14/QuantizationExplorer.jsx:345-348` (widget disclosure) — quoting the widget's exact offending string: *"model the outlier-channel phenomenon reported in real LLM **weights**"* and noting "real weight matrices are near-Gaussian without 11× channels." R-04's Accept line requires "each cited line reads per Desired."

`git log --oneline --all -- src/components/widgets/ch14/QuantizationExplorer.jsx` shows exactly two commits ever touched this file: the original ch14 chapter build, and `4b6db8b` (R-08's RNG-import migration — an unrelated mechanical change, `mulberry32` import only). `b08477d` (R-03/R-04) never touched it, despite the commit message claiming "Fixes CRITIQUE.md ... M-02."

The widget still renders (confirmed by reading the current file, lines 336-340):
> "Illustrative weight distribution, not values from a real checkpoint: 12 channels × 300 weights each, roughly Gaussian, with 2 channels (marked ★) scaled ~11× larger to model the outlier-channel phenomenon reported in real LLM **weights**."

This is now in direct, adjacent contradiction with the page prose `b08477d` *did* correctly fix on `EfficientInference.jsx`, which explicitly states weight matrices have "a milder version of the same unevenness, **without true outliers**" and that the 10–100× outlier magnitude is an *activation* phenomenon (LLM.int8(), Dettmers et al. 2022 — verified against arxiv.org/abs/2208.07339). The widget's own simulated data (`OUTLIER_MULT = 11`, applied to `WEIGHT_CHANNELS`) and its disclosure string still assert the opposite: that real LLM *weights* have ~11× outlier channels. A reader who reads the corrected prose and then plays with the widget two paragraphs later gets the exact misconception the fix was meant to eliminate, sourced from the widget CRITIQUE.md called out by name.

Fix: either (a) reframe the widget's simulated phenomenon and disclosure text around per-channel weight-*scale variation* (a real, milder, non-outlier effect, per the corrected prose) rather than describing it as "the outlier-channel phenomenon reported in real LLM weights," or (b) relabel the simulated data as illustrating the *activation*-outlier mechanism (and adjust the quantization-target framing accordingly) if that's closer to what the widget's per-channel-scale mechanic is meant to teach. Either way, the widget and the now-corrected prose need to agree.

### Everything else checked out

**Scope.** All 7 diffs (`git show --stat` + full diff) touch only what their commit messages claim. No drive-by edits found in any of the seven.

**Factual claims — 17 independently verified against primary/authoritative sources** (exceeding the ≥10 required):
- Claude 3.5 Sonnet GPQA-Diamond 59.4% (Anthropic launch announcement) — confirmed.
- o1 GPQA-Diamond 77.3% zero-shot / 78.0% consensus, vs. 69.7% PhD baseline (OpenAI "Learning to Reason with LLMs") — confirmed, matches `BenchmarkSaturation.jsx`'s new points exactly.
- SDXL trained with plain ε-prediction; v-prediction SDXL variants are third-party uptrains (NovelAI) — confirmed via NovelAI's own technical report and Stability's `generative-models` repo discussion.
- Liang et al. 2022 "Mind the Gap" (arXiv:2203.02053): increasing the modality gap reduces CLIP zero-shot racial-classification bias with negligible accuracy cost; the paper's finding is that gap distance affects performance in both directions, not that closing it uniformly hurts — confirmed.
- fastText (Bojanowski et al. 2017): word vector is a **sum**, not average/normalized-average, of n-gram vectors — confirmed. Hand-verified the "playing" → `<pl, pla, lay, ayi, yin, ing, ng>` length-3-with-boundary-marker decomposition arithmetically correct (9-character `<playing>` string, 7 length-3 substrings).
- S4 correctly attributed to Gu, Goel & Ré, ICLR 2021 (not lumped under Mamba's Gu & Dao 2023) — confirmed.
- Llama 3.1 128K context vs. Llama 3(.0) 8K — confirmed (Meta AI blog).
- InstructGPT reward-model training set ≈33K prompts (not "~40K comparisons") — confirmed against the paper.
- Llama 2 70B pretraining = 1,720,320 GPU-hours ≈ 1.7×10⁶; family total (7B+13B+70B) = 3,311,616 ≈ 3.3×10⁶ — confirmed exactly against Meta's model card table.
- BERT GLUE test average: BERT-large = 80.5, BERT-base = 78.3 (Devlin et al. 2019, Table 1) — confirmed against the widely-cited paper figures.
- XLNet GLUE test average = 88.4 (Yang et al. 2019) — confirmed.
- GPT-3 Table 2.2: Common Crawl contributes 410B BPE tokens — confirmed.
- CrewAI ships sequential and hierarchical process types only, no peer-debate/consensus mode — confirmed against CrewAI's own docs.
- OpenAI Operator and Google Project Mariner both retired/folded into ChatGPT Agent and Gemini Agent respectively — confirmed via recent coverage of both shutdowns.
- Codex CLI has a real two-layer approval-policy + sandbox system (not "no harness-level permission system") — confirmed against OpenAI's Codex docs.
- AlexNet single-crop top-1 = 57.1% (BVLC Caffe model zoo) — confirmed exactly.
- ResNet-152 single-crop top-1 ≈ 77.8% (fb.resnet.torch, 22.16% error) — confirmed closely (a secondary source reports 22.25%; within expected cross-run variance, correct order of magnitude and correct citation to the single-crop re-evaluation rather than the paper's own 10-crop/dense numbers).
- SSMDuality's new pulse preset `[1,0,0,...]` with `decay=0.75` hand-verified to reproduce the page's worked example `[1, 0.75, 0.5625]` exactly (x₁ = 0.75·1 = 0.75, x₂ = 0.75·0.75 = 0.5625).

**R-07 (lint gate) — verified genuinely real, not decorative.** `npx eslint .` on the current tree: 0 errors, 205 warnings, exit 0. Injected a deliberate `react-hooks/set-state-in-effect` violation into a scratch file under `src/components/layout/` (outside the widgets/diagrams carve-out) and reran: 2 errors, **exit code 1** — confirms the gate fails builds on real violations. `package.json`'s `check` script is `eslint . && npm run build && npm run smoke`. Read the `Layout.jsx`/`MobileNav.jsx`/`TocRail.jsx` diffs directly: the fix is React's documented "adjust state during render" pattern (a synchronous `if (x !== lastX) { setLastX(x); setState(...) }` during render, replacing the prior `useEffect(() => setState(...), [...])`), not a suppression or eslint-disable. Confirmed genuine.

**R-08 (RNG consolidation) — no seed drift.** `grep -rc "function mulberry32" src` returns exactly 1 (`src/utils/rng.js`). Wrote a standalone Node comparison of the canonical `mulberry32` against the `BiasVariance.jsx`-style variant (which omits the initial `>>>0` normalization) across seeds `{42, 0, 1000, -5, 4294967295, 12345, -999999, 2147483647, 2147483648}` × 5 outputs each: **all match byte-for-byte**. This is expected — `x |= 0` and `x >>> 0` followed by `|= 0` are equivalent 32-bit reinterpretations, so the formatting differences never affected output. 20 widget files correctly migrated to import from `src/utils/rng.js`.

**R-09 (citation validation).** Read `buildCitations` in `src/data/citations.js:321-331`: throws `Error('buildCitations: unknown citation slug "..."')` when a string entry isn't in `CITATIONS`. Reproduced standalone in Node (not editing the real file): confirmed it throws for an unrecognized slug and passes through valid ones.

**R-06 (dependency advisories).** `npm audit` on the current tree: **0 vulnerabilities**. Diff is package-lock.json only (400 lines), consistent with an in-range `npm audit fix` as claimed.

**Nits.** `find src -path '*_parked*'` returns nothing. `ErrorBoundary.jsx`'s `componentDidCatch(error, info) { console.error(error, info); }` present and correctly logs both the error and component stack, no longer silently swallowing.

**Gate.** `npm run check` (eslint + vite build + Playwright smoke) passes clean: 0 lint errors, build succeeds, **28/28 Playwright route tests pass**.

### ADVISORY

- `InitializationExplorer.jsx`'s tanh `activationFactor` was changed from an empirical-looking `0.667` to exactly `1.0`, which makes Xavier-init variance perfectly flat across all 10 layers by construction (`n · varW.xavier · 1.0 ≡ 1`). This is mathematically the correct rendering of Glorot & Bengio's own linear-approximation derivation (tanh′(0)=1) and resolves the CRITIQUE.md contradiction cleanly — but it does mean the widget can no longer show *any* visible variance decay for Xavier+tanh, even though real deep tanh networks do see some decay from nonlinear saturation the idealized derivation doesn't capture. Worth a one-line caption at some point noting this models the linear-regime theory, not a full nonlinear forward simulation — not required, since the fix genuinely resolves the specific prose/widget contradiction that was flagged.
- `ch12/RLVRvsRLHF.jsx`'s InstructGPT note now reads "tens of thousands of expert-ranked prompts," which is accurate but doesn't state the verified ≈33K figure the commit message itself cites — a minor missed opportunity for precision, not an error.

## Builder resolution — 2026-07-17

Fixed the REQUIRED finding: `src/components/widgets/ch14/QuantizationExplorer.jsx`'s disclosure text (previously "...scaled ~11x larger to model the outlier-channel phenomenon reported in real LLM weights") now reads "...to model the milder per-channel magnitude variation real LLM weight matrices show — not the sharper activation outliers Dettmers et al. (2022) found, which are a separate phenomenon this widget doesn't model." Also fixed the same conflict in the hand-off prose immediately above the widget in `src/pages/ch14/EfficientInference.jsx` ("...a thin outlier tail..." -> "...a couple of channels running a larger typical magnitude than the rest, not the sharper activation-style outliers described above...", and "the outlier tail alone was responsible for" -> "those wider-magnitude channels alone were responsible for"), since it had the identical wording conflict the critic didn't cite by line number but which sits two paragraphs above the widget it hands off to. No variable/data renaming (`OUTLIER_CHANNELS`, `OUTLIER_MULT` left as internal identifiers, not reader-facing) -- only the reader-facing copy changed, keeping the diff surgical. `npm run check` re-run clean: 28/28 Playwright routes, build succeeds. The two ADVISORY notes were read and are correctly non-blocking as the critic assessed; no changes made for those.
