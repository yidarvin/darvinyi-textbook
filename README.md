# Darvinyi Textbook

An interactive machine-learning textbook built with React, Vite, KaTeX, live mathematical widgets, and inline SVG diagrams.

## Local development

```bash
npm run dev
npm run check
npm run lint
```

The approved curriculum, editorial standards, and chapter specifications live in `context/`. The completed V2 delivery record is preserved in `prompts/queue.md`.

## Queue workflow

The repository uses a high-effort Claude Code builder/critic loop, driven directly by the agent (no separate runner script):

- A build pass implements or resolves one queue item.
- An independent critic subagent reviews it and alone grants `DONE`.
- The item moves `PENDING -> DRAFT -> DONE`; critique history is append-only under `content/critiques/`.

Each stage is a local commit only — nothing is pushed automatically. See `CLAUDE.md` for the complete agent contract.
