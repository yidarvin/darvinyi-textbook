# Darvinyi Textbook Agent Guide

This is a Vite/React interactive textbook. `context/V2_PLAN.md` is the approved V2 specification; `prompts/queue.md` is the ordered delivery queue. Read the relevant plan section, `context/STYLE_GUIDE.md`, and `context/CURRICULUM.md` before touching a queue item.

## Codex roles

- Terra (`gpt-5.6-terra`, high effort) builds pending items and resolves critiques.
- Sol (`gpt-5.6-sol`, high effort) independently critiques work. It edits only the current queue row and `content/critiques/<ID>.md`; it never edits site artifacts.
- Use subagents only for independent research or widget/diagram slices. The lead agent owns integration, citations, and verification.

## Queue contract

Work items proceed `PENDING -> DRAFT -> DONE`. A builder changes an item only to `DRAFT`; Sol grants `DONE` after an independent review. `SKIPPED` requires a documented proposal and Sol approval. Critiques are append-only, with line one exactly `verdict: approve`, `verdict: revise`, or `verdict: resolved`.

Run `./runqueue.sh -n 1` for one completed item. It commits stages locally and never pushes. Do not manually advance to a later row while an earlier item is `DRAFT`.

## Quality bar

Use primary sources for factual and time-sensitive claims. Preserve the existing visual language and make every widget use real, disclosed mathematics or simulation rather than scripted outcomes. Every chapter must follow the V2 editorial standard, supply complete citations, and include accessible directed interactions.

Run `npm run check` after every implementation or fix. For changed widgets, also use the dev server to check desktop and narrow mobile behavior, interaction, equation rendering, and browser-console errors. Never commit generated `dist/` output or push unless the user explicitly requests it.
