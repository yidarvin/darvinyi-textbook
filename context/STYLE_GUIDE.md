# darvinyi-textbook — Style Guide (V2)

This supersedes the "~3-5 sentences per concept" charter in the original PROJECT_OVERVIEW.md. As of the V2 overhaul (2026-07), the book commits to being a **fuller textbook**: real depth (derivations, worked examples, closing syntheses) with widgets embedded as first-class, *directed* figures rather than decorative asides. Widgets remain the differentiator — they are just no longer the *only* thing carrying the teaching load.

Full context and the per-chapter findings driving this pass live in [`V2_PLAN.md`](V2_PLAN.md).

## Section skeleton

Every taught concept follows this shape:

(a) **Concept paragraph(s)** — plain-language first sentence, citation-free opener. Depth is welcome (derivations, mechanism, history) but keep one idea per paragraph, ≤6 sentences each.

(b) **MathBlock**, immediately followed by a one-sentence symbol gloss (what each symbol means, in words).

(c) **Widget hand-off** — 1–2 sentences containing an imperative and a predicted observation. Example: "Drag the degree slider past 9; notice test error climbing while train error falls." **Hard rule: no widget without a hand-off sentence immediately before it.**

(d) **The widget itself**, with a populated `tryThis` prop (see Widgets below).

(e) *Optional* "Going deeper" paragraph — history, frontier developments, paper-level detail. This is where dense citation-heavy material belongs; it's explicitly opt-in reading, not required to follow the main thread.

## Chapter shape

- 4–6 sections per chapter.
- **Lede: exactly 3 beats** — plain-language hook, the chapter's core move, stakes/forward connection. No notation and no mechanism detail in the lede.
- **Every chapter ends with a "What carries forward" closer**: 3–4 sentences on what to retain and where it reappears, plus a one-line pointer to the next chapter. (Prior to V2, 21 of 22 chapters just stopped after the last widget + citations — this is now mandatory.)
- **One worked micro-example with concrete numbers** per chapter (e.g. a 4-token attention computation, a two-step Q-value update, one forward-noising step with real α values).

## Voice

- House exemplar: the Attention chapter (new ch09, old ch07) — concrete, mechanistic, quantitative, at most one rhetorical flourish per section. Match this register.
- "We" for exposition; "you" only in widget directives.
- **First-use gloss rule**: any term of art gets a short appositive at first use *per chapter* — don't assume a term defined three chapters ago is remembered. (i.i.d., BLEU, perplexity, ELBO, logits, convexity, and similar terms have historically been used unglossed — fix on sight.)
- Citations inline as "Name et al. (year) [n]" — max two surnames, never an author roll-call.
- Cross-references are spelled out: "Chapter 9", never "Ch 9" or "Chs 7, 8".
- No component names leaking into reader-facing prose ("the equation above", never "the section's MathBlock").
- "Transformer" is lowercase except inside paper titles.

## Widgets

- **Simulation must be faithful to the stated math.** No silent simplifications dressed up as the real thing — either implement the real computation or explicitly disclose the simplification in the prose/widget copy. (V1 shipped multiple widgets that fabricate or hard-code their output while claiming to simulate the underlying process — see `V2_PLAN.md` Appendix A. This is the single most important rule in this guide.)
- Status labels must be truthful: never label a divergent run "good," never say "converged" for a run that merely exhausted its step budget.
- Named preset buttons for "aha" configurations are encouraged — give the reader a one-click path to the revealing state.
- Populate the `tryThis` prop (added to `WidgetCard` in queue item V5) for every widget: a short "Try: … Notice: …" string.

## Convention Decisions

Book-wide notational and terminological conventions, enforced by queue items V1–V4:

| Topic | Convention |
|---|---|
| Expectation | `\mathbb{E}` everywhere |
| Loss | `\mathcal{L}` for named objectives; plain `L` only inside derivative expressions |
| Matrix orientation | Column-vector (`Wx`) through the Part I–II RNN chapters; row-vector (`xW`) from the Attention chapter onward, with one explicit transposition sentence given where the convention switches |
| Per-head dimension | `d_k` (note `d_head = d_k` if an alternate symbol is otherwise natural) |
| Projection matrices | Superscript style: `W_i^Q` |
| Temperature | `T` for sampling/distillation; `τ` for learned contrastive temperature (one reconciliation note where both appear) |
| Position symbols (RoPE) | `m`, `n` |
| Model names | "LLaMA" for the original 2023 model only; "Llama 2", "Llama 3" (space, no hyphen) thereafter |
| Cross-references | Spelled-out "Chapter N" |
| Inline citations | Plain `[N]`, anchor-linked to the References section |
| Citation data | `src/data/citations.js`, keyed by slug; each chapter imports its list and gets `num` assigned at import time — a paper's metadata (authors/venue/year) exists in exactly one place |

## Non-negotiables carried over from V1

- No real model inference in widgets — all visualizations are computed analytically or via simple JS math, faithfully implementing the stated equations (see Widgets above).
- No external data fetching at runtime.
- KaTeX for math (not MathJax).
- Diagrams: static SVG, `viewBox="0 0 640 H"`, `role="img"` + `aria-label`, one `<figcaption>`.
- Dark mode only.

## No longer true as of V2 — do not carry forward

- ~~"Every concept gets ~3-5 sentences of explanation"~~ — superseded by the section skeleton above.
- ~~"Mobile is NOT a priority — desktop-first, minimum viewport 1024px"~~ — the responsive and per-widget mobile passes have shipped. Mobile is a supported target.
