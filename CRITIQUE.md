# Critique: darvinyi-textbook

2026-07-16 · commit `8413eba` · reviewed by Claude Opus 4.8 via repo-critique (10 parallel subagents: 8 content, 1 code, plus lead synthesis and primary-source verification)

## Verdict

This is a genuinely good interactive ML textbook with an honest engineering spine and a real reason to exist — and it is held back by isolated, highly fixable violations of its own single most important rule. The ambition ("Distill.pub but dark-mode," 25 chapters, a general-CS reader, live widgets that *faithfully compute the math they teach*) is largely met: the build gate is real and green (28/28 route tests), the code is clean and layered, and — crucially — most widgets do compute real mathematics, and the specific fabrication/attribution errors the V1 audit catalogued (ch04 optimizer widgets, ch05 distillation, ch08 LSTM-vs-GRU, ch13 LIMA stats, the ch24–25 product-fact errors) are genuinely fixed, not papered over. But the review found a residual **class** of "display" and "animation" widgets that hard-code authored numbers or scripted trajectories and pair them with prose and UI labels implying live computation, with none of the one-line "illustrative" disclosure that the book's own best widgets already model. Two of these cross into Blocker territory because they present *scripted data as GAN training dynamics* — complete with "Nash equilibrium" and "20 epochs" verdicts — in the one chapter whose central lesson is that GAN training is unstable, teaching the opposite of the truth kinesthetically. A third Blocker is a wrong benchmark number (o1's GPQA score plotted ~19 points too low) sitting in the chapter about benchmark accuracy. None of this is structural; the foundation is absolutely worth building on. The fixes are a disclosure-or-compute pass over ~10 widgets, four one-line factual corrections, and three modest engineering hygiene items.

## Scorecard

| Dimension | Score /10 | One-line justification |
|---|---:|---|
| Widget fidelity (the differentiator) | 6 | Majority faithful and V1 fabrication fixed, but ~10 widgets present hard-coded/scripted output as computed — incl. 2 Blockers and 2 in the exemplar chapter. |
| Factual accuracy | 7 | Strong overall, most perishable claims verify against primary sources; dragged down by the GPQA-chart Blocker, SDXL v-prediction, reversed Mind-the-Gap, and the activation/weight-outlier conflation. |
| Pedagogy & structure | 8 | Section skeleton, worked micro-examples, and "what carries forward" closers are consistently present and good; a few ledes leak mechanism. |
| Prose quality | 8 | Clean, mechanistic, quantitative; low tic density; occasional definition drift across widgets in one chapter. |
| Code architecture & correctness | 8 | Honest build gate, layered ErrorBoundaries, 25/25 routing + citation + widget-count integrity verified; no security holes. |
| Maintainability & DX | 6 | RNG/math helpers copy-pasted (and drifting) across dozens of files; the lint gate is decorative; two dead files. |
| Dependencies & supply chain | 7 | No injection surface, but 5 unpatched advisories (3 high) that `npm audit fix` clears; several minor-version lags. |
| Accessibility | 8 | Native keyboard-operable controls throughout; 98/98 diagrams carry `aria-label`; dark-mode-only is a deliberate, disclosed choice. |
| Originality & value | 8 | Distill is dormant; this fills a real gap with a modern 2026 curriculum and zero-setup interactivity d2l.ai can't match. |

## What genuinely works

The engineering is trustworthy. `npm run check` builds and runs a Playwright smoke over every route (28/28 green), the App.jsx route table maps 1:1 to `chapters.js` with a `path="*"` fallback, every lazy route and every widget body is wrapped in its own `ErrorBoundary` (App.jsx:101-111, WidgetCard.jsx:127), the KaTeX `dangerouslySetInnerHTML` path is author-controlled with `throwOnError:false` + try/catch, and the citation single-source-of-truth resolves cleanly (0 missing slugs, 0 dead entries across 36 shared references). `useMediaQuery.js` even carries SSR guards and a Safari `<14 addListener fallback`.

The faithful widgets are genuinely, verifiably faithful — and there are many. Subagents re-derived computations by hand and confirmed real math in, among others: ch01's samplers (inverse-CDF/Box-Muller) and KL with `+∞` propagation; ch03's `ComputationGraph` (full forward+backprop re-derived, every value exact); ch05's `KnowledgeDistillation` (real Hinton-loss gradient `T·(student_soft − teacher)`); ch10's `ScalingLaws` (real Chinchilla parametric loss with real data points); ch12's entire RL widget set (real TD/REINFORCE/PPO-clip/value-iteration); ch13's `DPOvsRLHF` (real DPO loss = 0.594, correct Bradley-Terry reward); ch14's seven inference widgets (real quantization, in-browser Jacobi-SVD, discrete-event batching); ch20's four diffusion widgets (real closed-form forward noising, real DDPM ancestral + DDIM deterministic sampling); and all of ch22–23 (exact pass@k estimator, SAE coordinate descent, a steering demo re-computed to the digit). Chapter 9's prose and the matrix-orientation convention switch, and chapter 25's product facts (Claude Code dates, the SDK rename, MCP primitives, Codex sandbox model, prompt-caching economics) all verified correct against primary sources. When this book is faithful, it is excellent.

## Findings

### Blockers

**B-01 · `MinimaxGame` presents a scripted trajectory as GAN training, with a "Nash equilibrium" verdict** — `src/components/widgets/ch19/MinimaxGame.jsx:34-42` (stats at :517-535); hand-off `src/pages/ch19/GANs.jsx:234-235`
Evidence: `getD = (x, ds) => { if (ds>=20) return 0.5; ... return sigmoid(a*(x-b)); }` — the discriminator depends only on the input `x` and the step counter `ds`, and *never* on the generator params `muG`/`sigmaG` or the densities, even though `pdataVals`/`pGVals` are already computed at :233-234. The generator is a hard-coded linear ramp (`getMuG = ds => -1.0 + ds*0.125`, `getSigmaG = ds => 1.5 - ds*0.04`) that lands exactly on the fixed real parameters. A "Train step" button, a "Step X / 20" counter, and a printed "Nash equilibrium" conclusion frame this as optimization; the prose says D "flattens toward 0.5 … exactly as the optimal-discriminator formula above predicts" — but the widget's D never touches that formula.
Why it matters: This is the flagship widget of the GANs chapter, and it teaches that adversarial training smoothly, reliably converges to equilibrium — the exact opposite of the chapter's own thesis that GAN training is unstable. It violates STYLE_GUIDE.md:40 (the #1 rule) and mislabels a canned interpolation as a reached equilibrium (STYLE_GUIDE.md:42 forbids exactly this). `computeJS` at :46-58 is a genuine Jensen-Shannon Riemann sum — the honest scaffolding is already present.
Fix: task R-01.

**B-02 · `DBEvolution` labels hand-authored keyframes "20 epochs of adversarial training" and hard-codes the accuracy readout** — `src/components/widgets/ch19/DBEvolution.jsx:32-39, 81-115, :49`; prose `src/pages/ch19/GANs.jsx:478-482`
Evidence: `WEIGHTS` is six hard-coded discriminator weight-vectors, `generateAllFakeEpochs()` hard-codes six fake point-clouds, and the animation merely `lerp`s between them. `D_ACCURACY = [92,81,71,63,55,51]` is displayed as "D accuracy: {dAccPct}%", and the prose reads these off as measured fact. The title is "Decision Boundary Evolution — 20 epochs of adversarial training" with a Play button and epoch slider. (Mitigant, verified: the decision-field, the marching-squares D=0.5 boundary, and the distance stats *are* genuinely computed from `sigmoid(w0+w1x+w2y+w3x²+w4y²)` — only the weight trajectory and accuracy are scripted.)
Why it matters: Same wrong-mental-model problem as B-01, presented with a specific fabricated accuracy curve stated as data in a general-audience reference.
Fix: task R-02.

**B-03 · GPQA state-of-the-art trajectory understated by ~19 points, in the benchmarks chapter** — `src/components/diagrams/ch21/BenchmarkSaturation.jsx:87-90`
Evidence: the GPQA line plots `[2024.3, 48], [2024.8, 58]` on an axis titled "state-of-the-art (%)". Verified against primary sources: o1 reached **77.3% (78.0% consensus)** on GPQA Diamond in September 2024, and even the non-reasoning frontier (Claude 3.5 Sonnet, June 2024) was 59.4% (https://openai.com/index/learning-to-reason-with-llms/). The chart's own MMLU line *does* include o1 at 92.3 (line 60), so it is internally inconsistent. This is the same error class the V1 audit explicitly flagged ("o1 GPQA numbers halved").
Why it matters: A wrong, checkable benchmark number plotted as history — in the chapter whose entire subject is measuring models accurately — is the most credibility-damaging error a reference work of this kind can ship, and it materially distorts the "still well below saturation" narrative.
Fix: task R-03.

### Major

**M-01 · Systemic: a class of widgets present hard-coded/scripted output as computed, with no disclosure** — 8 widgets (table below)
Evidence: beyond the two Blockers, eight more widgets fabricate numeric output and display it with false precision (decimals, "nats", "%", "learned", "Converged") while the prose implies live computation — none carrying the one-line disclosure that sibling widgets `ResidualStream.jsx:18-23` ("an invented toy example, not measurements") and `SkipConnection.jsx:264-267` ("Illustrative, not measured") already model.

| Widget | Location | What's fabricated | Disclosed? |
|---|---|---|---|
| `BiasVariance` | ch02, :31-46 (shown :435-468) | `Bias²`, Variance, "Optimal d★" from `0.5*exp(-d/3)` etc., shown to 3 decimals as measured | No |
| `AttentionHeatmap` | ch09, :16-52 | Authored weight matrices shown as "a single softmax lookup"; no Q/K/V/softmax in file | No |
| `MultiHeadAttention` | ch09, :33-49 | Authored 5×5 head matrices shown as real per-head behavior | No |
| `GraphAttention` (GAT) | ch16, :34-41 | Static `GAT_WEIGHTS` labeled "GAT learns which neighbors matter most" | No |
| `ELBODecomposition` | ch18, :22-45 | recon/KL/quality curves from tuned constants, shown as "nats"/"ELBO=−…"/"%" | No |
| `TrainingDynamics` | ch19, :34-64 | Synthetic loss curves + "Converged: yes/no" verdict | No |
| `CycleConsistency` | ch19, :261 | Invented cycle-loss `‖F(G(x))−x‖₁` value + a conceptually wrong λ→loss coupling | No |
| `ToolUseFlow` | ch24, :97 | Hard-coded `347! = 2.907…×10^732` while prose says "the code interpreter actually executing" | No |
Why it matters: the differentiated promise of this book is *faithful* widgets; every undisclosed fabrication spends the credibility the faithful ones earn. Two of these sit in the declared house-exemplar chapter (ch09), and one (`CycleConsistency`) also encodes a genuine conceptual error — λ weights the L_cyc term in the objective, it is not a factor of the reconstruction norm.
Fix: task R-05 (per-widget: compute-live where cheap — BiasVariance via resampling, AttentionHeatmap/MultiHeadAttention via real softmax(QK^T/√d), GAT via stored features, ToolUseFlow via `BigInt` — else add the sibling disclosure line).

**M-02 · ch14 conflates *activation* outliers with *weight*-scale stretch (prose + widget)** — `src/pages/ch14/EfficientInference.jsx:476-489`; `src/components/widgets/ch14/QuantizationExplorer.jsx:345-348`
Evidence: the text attributes to Dettmers et al. (2022) "a handful of activation channels … carry values 10 to 100 times larger," then says a single weight-quant scale `s = max|x|/(2^{b-1}-1)` "as in the formula above" must stretch to cover them. Verified (https://arxiv.org/abs/2208.07339): LLM.int8()'s outliers are in *activations/hidden states*, do not enter the weight scale, and are handled by mixed-precision decomposition — not per-channel weight quantization. The widget disclosure repeats the error ("model the outlier-channel phenomenon reported in real LLM **weights**"); real weight matrices are near-Gaussian without 11× channels.
Why it matters: a skeptical reader will catch that activation outliers cannot stretch a weight-tensor scale; the mechanism is taught backwards.
Fix: task R-04.

**M-03 · ch15 reverses the "Mind the Gap" finding** — `src/pages/ch15/Multimodal.jsx:347-350`
Evidence: the chapter states "closing the gap by simple subtraction actually hurts downstream performance." The paper (Liang et al., NeurIPS 2022, https://arxiv.org/abs/2203.02053) finds the opposite framing: *modifying* the modality-gap distance can *improve* zero-shot performance and fairness; the effect is directional/task-dependent, not a blanket "closing hurts."
Why it matters: a specific, checkable claim about a named paper, stated backwards.
Fix: task R-04.

**M-04 · ch20 falsely states SDXL uses v-prediction** — `src/pages/ch20/DiffusionModels.jsx:461-466`
Evidence: "Stable Diffusion 2.x and SDXL both use v-prediction variants in their higher-resolution checkpoints." Web-verified: SDXL base and refiner are trained with ε-prediction; v-prediction is the SD 2.x "-v" checkpoints (2.0-v / 2.1-768).
Why it matters: specific false statement about a flagship model in a general-audience text.
Fix: task R-04.

**M-05 · ch12 and ch13 contradict each other on whether verifiable rewards can be "hacked"** — `src/pages/ch12/ReinforcementLearning.jsx:736` vs `src/pages/ch13/LLMTraining.jsx:604-607`
Evidence: ch12 calls R1-Zero's language-mixing "reward hacking"; ch13 states RLVR "has no learned component in the loop … so there is no reward surface to hack" and "removes the ceiling on how long an RL run can be pushed." The book itself documents RLVR entropy-collapse and gaming (ch12:674-685; `RLVRvsRLHF.jsx:564-565`), so ch13 overstates, and the term "reward hacking" is used imprecisely (language mixing under an exact-correctness reward is specification under-specification, not learned-proxy hacking).
Why it matters: a load-bearing conceptual claim taught two contradictory ways across adjacent chapters.
Fix: task R-04.

**M-06 · The lint gate is decorative — `npm run check` never runs eslint** — `package.json` (`check`)
Evidence: `"check": "npm run build && npm run smoke"`, `"smoke": "playwright test"`; `lint` is a separate script the gate never invokes. So the 6 error-level lint violations (and 204 warnings) never fail the required gate, and the config's error/warning split buys nothing.
Why it matters: lint rot accumulates invisibly; the one warning that matters is buried in 204.
Fix: task R-07.

**M-07 · RNG/math helpers are copy-pasted across dozens of widget files and have already drifted** — `src/components/widgets/**` (no `src/utils` exists)
Evidence: `mulberry32` is defined in 19 files, `lerp` in 23, `clamp` in 11, `gaussian` in 10, `softmax` in 6, `randn` in 6 — and the `mulberry32` copies are not byte-identical (mixed `>>> 0` vs `| 0`), so they have already diverged. There is no shared math/RNG module.
Why it matters: the single largest maintainability trap in the codebase — a seed-reproducibility or numerical fix must be applied in up to 23 places, and "the same" helper is no longer the same.
Fix: task R-08.

**M-08 · `buildCitations` silently renders a blank reference for an unknown slug** — `src/data/citations.js:321-326`
Evidence: `...(typeof entry === "string" ? CITATIONS[entry] : entry)` — a mistyped slug makes `CITATIONS[entry]` `undefined`, the spread contributes nothing, and Citations.jsx renders a numbered row with empty title, no error thrown at build or runtime. (The current corpus is clean — all 36 slugs resolve — but nothing prevents the next typo.)
Why it matters: a wrong slug ships as a silently blank citation instead of failing loudly.
Fix: task R-09.

### Minor

- **ch04 momentum β mismatch**: prose "typically 0.9" vs widgets hard-code 0.85 — `Optimization.jsx:410` vs `GradientDescentNavigator.jsx:322`, `OptimizerRace.jsx:241`.
- **ch05 InitializationExplorer contradicts its prose**: Xavier+tanh visibly decays (~0.667/layer) while the prose says Xavier "preserves variance for tanh" — `InitializationExplorer.jsx:254` vs `TrainingTechniques.jsx:393-394`.
- **ch05 GradientClipping** synthetic `RAW_NORMS` spike trace undisclosed (clip op itself is exact) — `GradientClipping.jsx:29-43`.
- **ch06 CnnVsCapsnet** prose says the widget "runs" a CNN head, but CNN scores are hard-coded (the widget itself honestly labels them "fixed illustrative scores") — `ConvNets.jsx:690-691`.
- **ch09 entropy units** differ within one chapter: `QKVInspector`/`AttentionHeatmap` use nats, `MultiHeadAttention` uses bits — standardize.
- **ch10 "cumulative norm only ever climbs"** — the plotted quantity is a sum of positive magnitudes (monotonic by construction), not the L2 norm of the accumulated vector; call it "cumulative contribution magnitude" or soften — `Transformers.jsx:399-404`.
- **ch07 fastText** described as an "average" of n-gram vectors, but the cited paper (Bojanowski 2017 [4]) sums; and the two worked decompositions of "playing" disagree on n-gram size and boundary markers — `WordEmbeddings.jsx:390-393, 456-459`.
- **ch08 S4 attribution**: "S4 and Mamba (Gu & Dao (2023) [9])" groups S4 (actually Gu, Goel & Ré 2021) under Mamba's citation — `RNNs.jsx:527-530`.
- **ch11 perishable precision**: Gemini stated as a confirmed GQA adopter (closed architecture, unverifiable); "64 Q-heads" attributed to the never-released Llama 2 34B; 128K context labeled "Llama 3 70B" (it is Llama 3.1) — `LLMArchitectures.jsx:253-254, 318, 349-351`.
- **ch13 Llama 2 "1.7×10⁶ GPU-hours"** is the 70B figure; family total ≈3.3M — `LLMTraining.jsx:138`. **InstructGPT "~40K expert comparisons"** imprecise (~33K prompts) — `RLVRvsRLHF.jsx:535`.
- **ch17 worked micro-example** (`a=0.75`, inputs `[1,0,0]`) is not reproducible in `SSMDuality` (defaults `decay=0.72`, pulse preset `[0,0,1,…]`) — `StateSpaceModels.jsx:52`.
- **ch19 ModeCollapse** hard-coded FID strings (`~12/~84/~18`) — coverage math is real, metric is fabricated — `ModeCollapse.jsx:95`.
- **ch20 "exactly the Langevin update"** — prose `η/2 + √η` vs widget `η + √(2η)` (both valid, different convention) — `DiffusionModels.jsx:494-497`.
- **ch21 benchmark precision cluster**: BERT-base plotted with BERT-large's 80.5 GLUE; ImageNet example count 1.4M vs 1.2M across three figures; Common Crawl 100B vs 50B tokens across two figures; several inflated ImageNet top-1 values (GoogLeNet 74.8 vs real single-model 68.7); XLNet GLUE 85.5 (published 88.4) — `BenchmarkLeaderboard.jsx:8-24`, `DatasetTimeline.jsx:47,94`.
- **ch24 MultiAgentTopologies** classifies CrewAI as a debate-swarm, contradicting ch25's "role-based with explicit handoffs" — `MultiAgentTopologies.jsx:372` vs `AgentHarnesses.jsx:581`. **"OpenAI's Operator"** cited present-tense (retired/folded into ChatGPT agent in 2025) — `AIAgents.jsx:264-266`.
- **ch25 HarnessTaxonomy** says Codex CLI has "no harness-level permission system" (it has an approval-policy), in mild tension with the sibling `ClaudeCodeVsCodex` widget — `HarnessTaxonomy.jsx:45`. **CrewAIvsAutoGPT** scripted trace undisclosed (prose describes it, so low risk) — `CrewAIvsAutoGPT.jsx:49-72`.
- **Lede purity**: ch02, ch03, ch04 ledes leak mechanism detail the style guide forbids — `StatisticalLearning.jsx:90-95`, `NeuralNetworks.jsx:165-166`, `Optimization.jsx:271-273`.
- **Code**: `ErrorBoundary` has no `componentDidCatch` logging (`shared/ErrorBoundary.jsx:13-19`); two dead files under `_parked-capsules/` (ch06); the 6 lint errors are all in `layout/` and are benign (verified: no render loops or stale refs) but block a clean `eslint`.

### Nits

- `MathBlock.jsx:32` always passes `displayMode:true` (harmless; the computed var only drives delimiter slicing).
- ch03 "Swish/SiLU [10] (Ramachandran et al., 2017)" elides SiLU's separate origin (Elfwing 2017; Hendrycks & Gimpel 2016).
- ch15 "InfoNCE" named before it is glossed — `Multimodal.jsx:170`.
- ch17 `ComplexityCurves` draws SSM and linear-attention as pixel-identical O(T) lines.
- ch04 "SGD reliably fails to train transformers" — softens to "reliably underperforms."
- ch05 "GPT-3/4 lineage still uses LayerNorm" states GPT-4's undisclosed architecture as fact (recurring pattern with the Gemini/GQA nit).
- ch25 `dontAsk` placed on the "autonomous" end of the permission spectrum, though it auto-*denies*.

## Claim verification

| # | Claim (quoted) | Location | Verdict | Source | Note |
|---|---|---|---|---|---|
| 1 | GPQA SOTA `[2024.8, 58]` | ch21 BenchmarkSaturation.jsx:87-90 | **Wrong** | openai.com/index/learning-to-reason-with-llms | o1 = 77.3% Sept 2024; ~19pt low (B-03) |
| 2 | "SD 2.x and SDXL both use v-prediction" | ch20 DiffusionModels.jsx:461-466 | **Wrong** | Stability SDXL report | SDXL is ε-prediction (M-04) |
| 3 | "closing the gap … actually hurts downstream performance" | ch15 Multimodal.jsx:348 | **Wrong** | arxiv.org/abs/2203.02053 | paper: modifying gap can *improve* (M-03) |
| 4 | activation outliers stretch the *weight* scale | ch14 EfficientInference.jsx:477-489 | **Wrong** | arxiv.org/abs/2208.07339 | outliers are in activations; fix is mixed-precision (M-02) |
| 5 | "no reward surface to hack … removes the ceiling" | ch13 LLMTraining.jsx:604-607 | **Contested/overstated** | book's own ch12:674-685 | contradicts ch12 (M-05) |
| 6 | Gemini "adopted GQA" | ch11 LLMArchitectures.jsx:318 | **Unverifiable** | — | closed architecture; drop or hedge |
| 7 | "Llama 3 70B … T=131,072 (128K)" | ch11 LLMArchitectures.jsx:253 | **Outdated** | Meta Llama 3.1 release | 128K is Llama 3.1; base 3.0 70B = 8K |
| 8 | XLNet GLUE = 85.5 | ch21 BenchmarkLeaderboard.jsx:20 | **Wrong** | Yang et al. 2019 | published test avg 88.4 |
| 9 | BERT-base GLUE = 80.5 | ch21 BenchmarkLeaderboard.jsx:19 | **Wrong** | aclanthology.org/N19-1423 | 80.5 is BERT-large; base = 78.3 |
| 10 | LIMA "43% … GPT-4 … 58% … Bard" | ch13 LLMTraining.jsx:224 | **Verified** | LIMA paper | V1 flag confirmed fixed |
| 11 | Claude Code "research preview Feb 2025 … GA May 2025"; SDK rename Sept 2025 | ch25 AgentHarnesses.jsx:214-233 | **Verified** | platform.claude.com release notes | all four V1 product errors fixed |
| 12 | MCP host/client/server + tools/resources/prompts, "Nov 2024" | ch25 AgentHarnesses.jsx:304-323 | **Verified** | MCP spec | correct |
| 13 | Claude Code "6 permission modes"; "~30 hook events"; "5 hook types" | ch25 ClaudeCodeArchitecture.jsx:33-124 | **Verified** | code.claude.com/docs | correct for 2026 — do NOT revert to old 4-mode model |
| 14 | Kimi K2 Muon/MuonClip + AdamW | ch04 Optimization.jsx:494 | **Verified** | arxiv.org/abs/2507.20534 | |
| 15 | Gemma 2 / Llama 3.2 distillation | ch05 TrainingTechniques.jsx:505-509 | **Verified** | Gemma 2 paper; Meta blog | |
| 16 | CLIP ~76% zero-shot ImageNet | ch15 Multimodal.jsx:495 | **Verified** | CLIP paper | 76.2% ViT-L/14-336 |
| 17 | Mamba → COLM 2024 | ch17 StateSpaceModels.jsx:18 | **Verified** | COLM 2024 | ICLR-rejected, COLM-accepted |
| 18 | 347! = 2.907×10^732 (733 digits) | ch24 ToolUseFlow.jsx:97 | **Verified (value)** | recomputed | value right; widget hard-codes it (M-01) |
| 19 | Terminal-Bench (2025), SWE-bench Verified (500 tasks, Aug 2024) | ch25 AgentHarnesses.jsx:406-422 | **Verified** | Laude Institute; OpenAI | |
| 20 | pix2pix 70×70 RF → 30×30 grid | ch19 GANs.jsx:607 | **Verified** | pix2pix paper | |

## Comparative analysis

The reference points a serious reader would actually reach for are **Distill.pub**, **Dive into Deep Learning (d2l.ai)**, and the intuition-first canon (3Blue1Brown, The Illustrated Transformer). The single most important external fact for this project's reason to exist: **Distill has been on indefinite hiatus since July 2021** and is not accepting submissions — so the interactive-explanation niche it defined is largely dormant. That is a real, open gap. This repo is not competing with Distill; it is one of the few things still working in that space. What it does not (yet) match is Distill's *bespoke-per-article* craft — Distill's interactives were each hand-built for one idea, whereas this book's widgets are a more uniform template. That uniformity is a reasonable trade for shipping 25 chapters, but it is why the fabrication findings sting: a templated widget that fakes its output reads as a systemic choice, not a one-off.

Against **d2l.ai** — the incumbent free interactive DL textbook (v1.0.3, ~500 universities, runnable multi-framework notebooks) — the honest scorecard is symmetric. d2l wins on breadth, on *runnable real code* (you execute actual training loops), and on academic authority and citations of record. This repo wins on zero-setup in-browser interactivity (no notebook, no GPU), on a genuinely *modern 2026 curriculum* (agents, agent harnesses, SSMs/Mamba, efficient inference, interpretability, RLVR/reasoning-model post-training — all areas where d2l is thin or silent), and on unified visual design and directed pedagogy. The differentiated 20% is real and nameable: **mathematically-faithful micro-widgets embedded at the exact point of the concept, on a current LLM-era curriculum, with zero setup** — d2l hands you a heavyweight notebook; this hands you a tuned knob next to the equation. That differentiation is *entirely* contingent on the "faithful" half of that sentence holding. Every Blocker and M-01 instance is an attack on the one thing this book does that d2l does not. Fix them and the differentiation is defensible; leave them and the book degrades toward "a prettier d2l whose knobs sometimes lie." The 3Blue1Brown/Alammar tier beats everyone on one-concept intuition but is not a reference text and is not interactive-in-page — not a substitute for what this is.

## Remediation plan

Execute top-to-bottom. Wave 1 restores the truth of the flagship claims; Wave 2 clears the systemic majors; Wave 3 is polish. Every task's Accept line is a command to run or an observation to make. For any widget task, "faithful" means: the displayed numbers are produced by code implementing the stated math on the current inputs, OR the panel carries a visible one-line disclosure in the style of `ResidualStream.jsx:18-23`.

### R-01 · Make `MinimaxGame` compute a real (or honestly-disclosed) discriminator  [M] deps: none
Files: src/components/widgets/ch19/MinimaxGame.jsx, src/pages/ch19/GANs.jsx
Current: `getD` ignores the densities and returns a step-indexed sigmoid; the generator is a linear ramp to the fixed answer; UI prints "Nash equilibrium" (B-01).
Desired: `D(x) = p_data(x) / (p_data(x) + p_g(x))` computed from the two Gaussians already built at :233-234, and generator params updated by real alternating gradient steps on the JS objective (`computeJS` at :46-58 already exists); OR, if a real optimizer is out of scope, replace the "Train step / Nash equilibrium" framing with an explicit "illustrative interpolation, not a trained run" disclosure.
Change sketch: replace `getD` body with the density ratio; drive `muG/sigmaG` from a gradient step or keep the ramp but relabel; keep `computeJS`.
Accept: `grep -n "muG\|sigmaG\|pGVals" src/components/widgets/ch19/MinimaxGame.jsx` shows `getD` (or its replacement) referencing the generator densities; OR the rendered panel shows a disclosure string and no "Nash equilibrium" verdict. Manual: dragging the real params changes D(x)'s shape.

### R-02 · Make `DBEvolution` accuracy live and disclose or compute the weight trajectory  [M] deps: none
Files: src/components/widgets/ch19/DBEvolution.jsx, src/pages/ch19/GANs.jsx
Current: `WEIGHTS` and fake-point clouds are hard-coded keyframes; `D_ACCURACY` is a hard-coded array shown as "D accuracy: {}%"; titled "20 epochs of adversarial training" (B-02).
Desired: compute accuracy live from the already-real D-field (fraction of real points with D>0.5 plus fake points with D<0.5); either run a real logistic-D update against the fake clouds or relabel the sequence "illustrative keyframes" and drop "20 epochs of adversarial training."
Accept: `grep -n "D_ACCURACY" src/components/widgets/ch19/DBEvolution.jsx` returns nothing (accuracy now derived); OR the title no longer claims "20 epochs" and a disclosure line is present. Manual: accuracy readout tracks the visible boundary.

### R-03 · Correct the GPQA benchmark trajectory  [S] deps: none
Files: src/components/diagrams/ch21/BenchmarkSaturation.jsx
Current: GPQA points `[2024.3, 48], [2024.8, 58]` (B-03).
Desired: real GPQA-Diamond SOTA — ~59% (Claude 3.5 Sonnet, mid-2024) rising to ~77% (o1, Sept 2024) — OR a visible note that the pre-2025 GPQA segment excludes reasoning models (and apply the same caveat to the MMLU line for consistency).
Accept: the plotted 2024 GPQA value is ≥59 and the late-2024 value ≥77, consistent with the MMLU line's inclusion of o1; `npm run check` passes.

### R-04 · Four one-line factual corrections  [S] deps: none
Files: src/pages/ch20/DiffusionModels.jsx:461-466; src/pages/ch15/Multimodal.jsx:347-350; src/pages/ch14/EfficientInference.jsx:476-489 + src/components/widgets/ch14/QuantizationExplorer.jsx:345-348; src/pages/ch12/ReinforcementLearning.jsx:736 + src/pages/ch13/LLMTraining.jsx:604-607
Current/Desired: (a) drop "and SDXL" from the v-prediction sentence (M-04); (b) rewrite Mind-the-Gap to "modifying the gap distance can *improve* zero-shot accuracy and fairness" (M-03); (c) reframe the outlier paragraph and the widget disclosure around per-channel *weight*-scale variation, or tie activation outliers to LLM.int8()'s mixed-precision fix (M-02); (d) reconcile the reward-hacking framing — verifiable rewards remove the *learned-proxy* surface, not all gaming, and do not "remove the ceiling" (M-05).
Accept: each cited line reads per Desired; `grep -n "SDXL" src/pages/ch20/DiffusionModels.jsx` no longer couples SDXL to v-prediction; `npm run check` passes.

### R-05 · Widget fidelity/disclosure pass over the 8 M-01 widgets  [L] deps: R-01, R-02
Files: ch02 BiasVariance.jsx; ch09 AttentionHeatmap.jsx, MultiHeadAttention.jsx; ch16 GraphAttention.jsx; ch18 ELBODecomposition.jsx; ch19 TrainingDynamics.jsx, CycleConsistency.jsx; ch24 ToolUseFlow.jsx
Current: each fabricates output shown as computed (M-01 table).
Desired, per widget — compute-live where cheap, else disclose in the `ResidualStream.jsx:18-23` style: BiasVariance → resample noisy train sets and fit (PolynomialFit already does real resampled fits); AttentionHeatmap + MultiHeadAttention → `softmax(QK^T/√d)` from small stored Q/K (copy `QKVInspector`); GAT → softmax(LeakyReLU) over stored node features; ToolUseFlow → `BigInt` factorial (value is already correct); ELBODecomposition, TrainingDynamics → add the disclosure line (or drive from a real toy closed-form); CycleConsistency → remove the numeric readout and the wrong λ→loss coupling (λ is the objective weight only).
Accept: for each of the 8 files, either the displayed numbers are computed from inputs (verify by reading the render path) OR `grep -iE "illustrative|not measured|toy|schematic" <file>` matches a rendered string. Manual: changing an input changes the computed readout for the compute-live widgets.

### R-06 · Patch dependency advisories  [S] deps: none
Files: package.json, package-lock.json
Current: 5 advisories (3 high): react-router 7.14.2 (DoS/CSRF), vite 8.0.10 (fs.deny bypass), brace-expansion.
Desired: `npm audit fix` (react-router-dom → ≥7.18.1, vite → ≥8.1.5); re-run the gate.
Accept: `npm audit` reports 0 high vulnerabilities; `npm run check` passes 28/28.

### R-07 · Make the lint gate real  [S] deps: none
Files: package.json, and the 6 error sites (src/components/layout/Layout.jsx, MobileNav.jsx, TocRail.jsx)
Current: `check` never runs eslint; 6 error-level violations sit unenforced (M-06).
Desired: clear the 6 errors (move `TocContext`/`useTocSections` out of TocRail.jsx into a `TocContext.js`; derive drawer state instead of setting it in effects) and add `eslint .` to `check` (`"check": "eslint . && vite build && npm run smoke"`).
Accept: `npx eslint .` exits 0 for error severity; `npm run check` exits non-zero if an error-level rule is later violated.

### R-08 · Extract shared RNG/math utilities  [M] deps: none
Files: new src/utils/rng.js + src/utils/math.js; migrate widgets under src/components/widgets/
Current: `mulberry32`×19, `lerp`×23, `clamp`×11, `gaussian`×10, etc., duplicated and drifting (M-07).
Desired: canonical `mulberry32`, `randn`/`gaussian`, `lerp`, `clamp`, `softmax` in src/utils; widgets import them.
Accept: `grep -rc "function mulberry32" src/components` returns 1 (the util file, if any local copy remains) or 0; `grep -rl "from ['\"].*utils/rng" src/components/widgets | wc -l` is large; `npm run check` passes.

### R-09 · Fail loudly on an unknown citation slug  [S] deps: none
Files: src/data/citations.js
Current: unknown slug → silently blank citation (M-08).
Desired: `buildCitations` throws (or `console.error`s) with the offending slug when `typeof entry === "string" && !CITATIONS[entry]`.
Accept: temporarily referencing a non-existent slug fails `vite build` or logs an explicit error naming the slug; revert the test.

### R-10 · Minor accuracy + consistency batch  [M] deps: none
Files: the Minor findings above (ch04 β, ch05 init/clipping, ch07 fastText, ch08 S4, ch09 entropy units, ch10 norm label, ch11 Gemini/Llama-3.1/34B, ch13 GPU-hours/InstructGPT, ch17 preset, ch19 ModeCollapse, ch20 Langevin, ch21 BERT/XLNet/ImageNet/CommonCrawl numbers, ch24 CrewAI/Operator, ch25 Codex-permission)
Desired: apply each one-line correction as specified in the Minor list; for ch21, source every benchmark row to one leaderboard and note the eval protocol.
Accept: `npm run check` passes; spot-check that ch21 numbers match a cited source; a reviewer re-reading the Minor list finds each item addressed.

### R-11 · Polish & hygiene  [S] deps: none
Files: src/pages/ch02, ch03, ch04 (ledes); src/components/shared/ErrorBoundary.jsx; src/components/widgets/ch06/_parked-capsules/, src/components/diagrams/ch06/_parked-capsules/; the Nits list
Desired: rewrite the three ledes to hook/core-move/stakes with no mechanism; add `componentDidCatch(e,i){ console.error(e,i); }`; delete the `_parked-capsules/` dirs; clear the Nits.
Accept: `find src -path '*_parked*'` returns nothing; a thrown widget logs to console while the fallback renders; `npm run check` passes.

## Appendix

**Coverage.** All 25 chapters were reviewed: every chapter's page prose was read in full, and every widget flagged as load-bearing had its actual computation read and, where feasible, re-derived by hand or verified against a computed expectation. Diagrams were sampled per chapter. Reviewed by 8 content subagents (ch01-03, 04-06, 07-10, 11-13, 14/15/17, 16/18-20, 21-23, 24-25) plus lead synthesis. The following widgets were read but their fidelity was confirmed by the lead rather than the chapter subagent, and all passed: ch18 `KLDivergence` (computes the real closed-form KL, both directions — `citations`-verified live), ch16 `MessagePassing` (real mean/sum aggregation including the self-term). Not exhaustively re-derived (reduced confidence, no findings asserted): ch18 `AutoencoderVsVAE`/`LatentSpaceExplorer` reparameterization internals; ch16 `GraphVsGrid`/`NodeClassification`; a minority of static diagrams. No chapter was skipped.

**Method.** Commands run on commit `8413eba` (macOS): `python3 scripts/inventory.py` (census); `npm run check` → build + Playwright **28/28 pass**; `npm run lint` → **210 problems (6 errors, 204 warnings)**, all 6 errors in `src/components/layout/` and verified benign; `npm audit` → **5 vulns (3 high, 1 moderate, 1 low)**, all `npm audit fix`-able; `npm outdated`; targeted greps for injection surface (`dangerouslySetInnerHTML` ×2, both KaTeX; no `eval`), control accessibility (native `<button>`×112, `<input type=range>`×64, so keyboard-operable), and helper duplication. External verification: ~30 primary-source checks across subagents and lead (arXiv papers, OpenAI/Anthropic/Meta/Stability release notes, MCP spec, benchmark leaderboards), logged with URLs in the claim table.

**Confidence notes.** Widget-fidelity findings are high-confidence (the offending computation was read at the cited lines). Factual "Wrong" verdicts in the claim table were each checked against a primary source named in the table. Benchmark-number Minors in ch21 are flagged as "source-to-a-stated-leaderboard" rather than hard-wrong where reimplementation values legitimately vary; the GPQA Blocker is hard-wrong (o1's 77.3% is a published headline number). The 6 lint errors are asserted benign on the basis of reading each site — they are strict react-hooks-v7/react-refresh triggers, not observed runtime bugs. Runtime claims rest on a successful local build + route smoke; no production/CDN behavior was measured.
