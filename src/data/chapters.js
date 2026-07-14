// ─── Single source of truth for chapter navigation ──────────────────────────
// Consumed by Sidebar (parts + chapter list) and Topbar (breadcrumb + prev/next).
//
// V2 curriculum (25 chapters, 7 parts) — see context/V2_PLAN.md and
// context/CURRICULUM.md. Three chapters (17, 22, 23) are still new; each
// has a scaffold page (lede + TOC + "in progress" note) but no route yet, so
// they are marked `live: false` here — Sidebar renders them as inert "soon"
// placeholders and Topbar's prev/next skips over them. Wire up a route in
// App.jsx and flip `live: true` once queue item N17/N22/N23 finishes
// building the chapter out. Chapters 01 and 14 finished this process
// (queue items N1 and N14).

export const PARTS = [
  {
    label: "Part I — Foundations",
    color: "var(--accent)",
    chapters: [
      { num: "01", title: "Probability & Information for Machine Learning", widgets: 4, live: true },
      { num: "02", title: "Statistical Learning", widgets: 4, live: true },
      { num: "03", title: "Neural Networks", widgets: 4, live: true },
      { num: "04", title: "Optimization", widgets: 5, live: true },
      { num: "05", title: "Training Techniques", widgets: 6, live: true },
      { num: "06", title: "Convolutional Networks", widgets: 7, live: true },
    ],
  },
  {
    label: "Part II — Language & Sequence",
    color: "var(--purple)",
    chapters: [
      { num: "07", title: "Word Embeddings & Tokenization", widgets: 6, live: true },
      { num: "08", title: "Recurrent Networks & LSTMs", widgets: 4, live: true },
      { num: "09", title: "Attention", widgets: 4, live: true },
      { num: "10", title: "Transformers", widgets: 4, live: true },
    ],
  },
  {
    label: "Part III — Large Language Models",
    color: "#a78bfa",
    chapters: [
      { num: "11", title: "LLM Architectures", widgets: 5, live: true },
      { num: "12", title: "Reinforcement Learning", widgets: 6, live: true },
      { num: "13", title: "LLM Training & Alignment", widgets: 6, live: true },
      { num: "14", title: "Efficient Inference & Deployment", widgets: 7, live: true },
      { num: "15", title: "Multimodal Networks", widgets: 4, live: true },
    ],
  },
  {
    label: "Part IV — Beyond the Transformer",
    color: "var(--green)",
    chapters: [
      { num: "16", title: "Graph Neural Networks", widgets: 4, live: true },
      { num: "17", title: "State-Space Models & Attention Alternatives", widgets: 0, live: false },
    ],
  },
  {
    label: "Part V — Generative Models",
    color: "var(--orange)",
    chapters: [
      { num: "18", title: "Variational Autoencoders", widgets: 4, live: true },
      { num: "19", title: "GANs & Image-to-Image Translation", widgets: 10, live: true },
      { num: "20", title: "Diffusion Models", widgets: 4, live: true },
    ],
  },
  {
    label: "Part VI — Evaluation & Understanding",
    color: "var(--green)",
    chapters: [
      { num: "21", title: "Datasets & Benchmarks", widgets: 3, live: true },
      { num: "22", title: "Evaluating LLMs & Agents", widgets: 0, live: false },
      { num: "23", title: "Interpretability", widgets: 0, live: false },
    ],
  },
  {
    label: "Part VII — AI Agents",
    color: "#38bdf8",
    chapters: [
      { num: "24", title: "AI Agents", widgets: 5, live: true },
      { num: "25", title: "Agent Harnesses", widgets: 6, live: true },
    ],
  },
];

// Part label with the "Part N — " prefix stripped, e.g. "Sequence & Attention".
function shortPartLabel(label) {
  return label.replace(/^Part [IVX]+ — /, "");
}

export function chapterPath(num) {
  return `/ch/${num}`;
}

// Flattened, ordered list of every LIVE chapter with its route path and part
// metadata — the shape Topbar's prev/next and breadcrumb logic needs. Not-yet-
// built chapters (live: false) are excluded here since they have no route.
export const CHAPTERS = PARTS.flatMap(part =>
  part.chapters
    .filter(ch => ch.live)
    .map(ch => ({
      ...ch,
      path: chapterPath(ch.num),
      part: shortPartLabel(part.label),
      partLabel: part.label,
      partColor: part.color,
    }))
);

export function findChapterByPath(pathname) {
  return CHAPTERS.find(c => pathname === c.path || pathname.startsWith(c.path + "/"));
}
