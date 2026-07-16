# darvinyi-textbook — Widget Specification (historical, retired)

This document records pre-V2 widget concepts and chapter numbering. It is retained as historical material only and must not be used as a build specification. Its old 22-chapter inventory, hover-only interaction pattern, and instruction-free guidance conflict with the completed V2 textbook.

Use these current sources instead:

- [`STYLE_GUIDE.md`](STYLE_GUIDE.md) is authoritative for faithful analytic simulations, directed hand-off sentences, populated `tryThis` prompts, accessibility, and diagram rules.
- [`CURRICULUM.md`](CURRICULUM.md) is authoritative for the live 25-chapter order and titles.
- [`V2_PLAN.md`](V2_PLAN.md), including Appendix B, defines chapter-level quality checks and the current queue scope.
- The current widget implementation in `src/components/widgets/` is the source of truth for shipped behavior and controls.

Every new or changed widget must compute the stated mathematics faithfully, disclose any simplification, expose keyboard and touch-equivalent interactions, and be verified on desktop and narrow mobile. The legacy reference HTML and historical inventories are not a substitute for those requirements.
