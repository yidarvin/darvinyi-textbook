# darvinyi-textbook — Design System (historical, retired)

This pre-V2 design note is retained only as historical context. Do not use it as an implementation specification: its Google Fonts import, six-part navigation, and short-prose rules conflict with the completed V2 textbook.

Current sources of truth:

- [`STYLE_GUIDE.md`](STYLE_GUIDE.md) defines the V2 editorial standard, directed-widget rule, accessibility requirements, and diagram conventions.
- [`CURRICULUM.md`](CURRICULUM.md) defines the live 25-chapter, seven-part navigation.
- [`../src/index.css`](../src/index.css) and component source define the shipped tokens, layout, and control styles.
- [`../src/main.jsx`](../src/main.jsx) imports the self-hosted `@fontsource` and KaTeX styles as Vite module dependencies. Do not add a remote font import.

When changing a component, preserve the existing dark-mode visual language and verify the rendered desktop and narrow-mobile states. New teaching content must follow the V2 section skeleton rather than the retired short-prose guidance.
