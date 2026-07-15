# Darvinyi Textbook

An interactive machine-learning textbook built with React, Vite, KaTeX, live mathematical widgets, and inline SVG diagrams.

## Local development

```bash
npm run dev
npm run check
npm run lint
```

The approved curriculum, editorial standards, and chapter specifications live in `context/`. The remaining V2 work is ordered in `prompts/queue.md`.

## Codex queue workflow

The repository uses a high-effort Codex builder/critic loop:

- Terra (`gpt-5.6-terra`) builds or resolves one queue item.
- Sol (`gpt-5.6-sol`) independently critiques it and alone grants `DONE`.
- The item moves `PENDING -> DRAFT -> DONE`; critique history is append-only under `content/critiques/`.

Run one completed item at a time:

```bash
./runqueue.sh -n 1
```

Use `./runqueue.sh --dry-run` to inspect the next role and exact Codex command. The runner makes local commits only and never pushes. See `AGENTS.md` for the complete agent contract.
