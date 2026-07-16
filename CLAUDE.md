# Darvinyi Textbook — Claude Code Guide

This is a Vite/React interactive ML textbook. `context/V2_PLAN.md` is the approved V2 specification (Appendix A = per-chapter findings, Appendix B = per-chapter rubric, Appendix C = new-chapter specs); `prompts/queue.md` is the ordered delivery queue. Read the relevant plan section, `context/STYLE_GUIDE.md`, and `context/CURRICULUM.md` before touching a queue item.

This is an established, older-style refsite: it intentionally has **no `content/registry.json`**. Do not scaffold a template or infer missing files from generic refsite procedures — this repository's queue contract (below) overrides them.

## Skill-override notice

The `refsite-runner` skill's generic procedure — slug-keyed queue rows, `content/registry.json`, `scripts/*.py` (`mark.py`, `validate.py`, `new_chapter.py`), `.mdx` chapters — **does not apply here**. This repo is ID-keyed (`E1`, `Q5`, `N17`), chapters are `.jsx`, and there is no registry by design. If that skill would otherwise trigger on this repo (it pattern-matches on `prompts/queue.md`), defer to its own "repo ships its own contract → repo wins" escape hatch and follow the contract in this file instead.

## Queue contract

`prompts/queue.md` is a GFM table `| ID | Title | Status |`. Work items proceed `PENDING -> DRAFT -> DONE`. A builder changes an item only to `DRAFT`; the critic grants `DONE` after an independent review. `SKIPPED` requires a documented `<!-- skip proposed: reason -->` comment on that row and critic approval. Critiques are append-only under `content/critiques/<ID>.md`, with line one exactly `verdict: approve`, `verdict: revise`, or `verdict: resolved`, and body sections `## Critique round N` (and `## Builder resolution` when a revision is resolved).

Do not manually advance to a later row while an earlier item is `DRAFT`.

## Build/critique loop

There is no shell runner — Claude Code drives the loop directly, at **high reasoning effort**, one item at a time:

1. **Build.** Read `context/V2_PLAN.md`'s relevant section, `context/STYLE_GUIDE.md`, and `context/CURRICULUM.md`. Implement the item, research time-sensitive or factual claims with primary sources, run `npm run check`, then change only that queue row `PENDING -> DRAFT` and commit as `build: <ID> -- <title>`. Do not mark it `DONE`, do not write a critique verdict, do not push, and do not start another queue item. If the item is genuinely inapplicable, leave it `DRAFT` and append `<!-- skip proposed: reason -->` to that row for the critic to decide.
2. **Critique.** Launch an **independent subagent** (Agent tool) to critique the `DRAFT` item. It must re-derive the work from the current artifacts rather than trusting the builder's reasoning, read the full critique history if one exists, run `npm run check`, and spot-check factual claims against primary sources. It may edit **only** `prompts/queue.md` and `content/critiques/<ID>.md` — never source, chapters, styles, tests, or other docs. It appends a `## Critique round N` section with REQUIRED and ADVISORY findings. If any REQUIRED finding remains: set line one to `verdict: revise`, leave the row `DRAFT`, commit `critique: <ID> -- revise`. If the item meets spec: set `verdict: approve` and change the row to `DONE` (or `SKIPPED` only for a justified pending-skip proposal), commit `critique: <ID> -- approve`.
3. **Resolve** (only on `revise`). Read the full critique history and apply every REQUIRED finding without unrelated rewrites. Re-check changed factual claims and widget math. Run `npm run check`, append a dated `## Builder resolution` section describing the fixes and prior rounds re-verified, set the critique's line one to `verdict: resolved`, keep the row `DRAFT`, commit `resolve critique: <ID>`. Then re-critique (step 2).

Never push unless the user explicitly requests it — all stages are local commits only. Never commit generated `dist/` output.

## Gate & environment

`npm run check` = `vite build` + Playwright route smoke, and is the required gate after every build/resolve/critique stage. On a fresh checkout, run `npx playwright install chromium` once before the first `npm run check`. For changed widgets, also use the dev server (`npm run dev`, or `/run`) to check desktop and narrow-mobile (375px) behavior, interaction, equation rendering, and browser-console errors.

## Quality bar

Use primary sources for factual and time-sensitive claims. Preserve the existing visual language and make every widget use real, disclosed mathematics or simulation rather than scripted outcomes. Every chapter must follow the V2 editorial standard, supply complete citations, and include accessible directed interactions. Use subagents only for independent research or widget/diagram slices — the lead agent owns integration, citations, and verification.
