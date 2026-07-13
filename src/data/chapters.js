// ─── Single source of truth for chapter navigation ──────────────────────────
// Consumed by Sidebar (parts + chapter list) and Topbar (breadcrumb + prev/next).
//
// NOTE: this still reflects the ORIGINAL 22-chapter numbering and reading order.
// The V2 renumbering (25 chapters, new part structure) lands in queue item S1 —
// see context/V2_PLAN.md and context/CURRICULUM.md for the target structure.

export const PARTS = [
  {
    label: "Part I — Foundations",
    color: "var(--accent)",
    chapters: [
      { num: "01", title: "Statistical Learning", widgets: 4, live: true },
      { num: "02", title: "Neural Networks", widgets: 4, live: true },
      { num: "03", title: "Optimization", widgets: 5, live: true },
      { num: "04", title: "Training Techniques", widgets: 6, live: true },
      { num: "05", title: "Word Embeddings", widgets: 5, live: true },
    ],
  },
  {
    label: "Part II — Sequence & Attention",
    color: "var(--purple)",
    chapters: [
      { num: "06", title: "Recurrent Networks & LSTMs", widgets: 4, live: true },
      { num: "07", title: "Attention", widgets: 4, live: true },
      { num: "08", title: "Transformers", widgets: 4, live: true },
    ],
  },
  {
    label: "Part III — Large Language Models",
    color: "#a78bfa",
    chapters: [
      { num: "09", title: "LLM Architectures", widgets: 5, live: true },
      { num: "10", title: "LLM Training & Alignment", widgets: 6, live: true },
      { num: "11", title: "Multimodal Networks", widgets: 4, live: true },
    ],
  },
  {
    label: "Part IV — Other Architectures",
    color: "var(--green)",
    chapters: [
      { num: "12", title: "Convolutional Networks", widgets: 5, live: true },
      { num: "13", title: "Graph Neural Networks", widgets: 4, live: true },
      { num: "14", title: "Reinforcement Learning", widgets: 6, live: true },
      { num: "15", title: "Capsule Networks", widgets: 3, live: true },
    ],
  },
  {
    label: "Part V — Image Generative Models",
    color: "var(--orange)",
    chapters: [
      { num: "16", title: "Variational Autoencoders", widgets: 4, live: true },
      { num: "17", title: "Generative Adversarial Networks", widgets: 4, live: true },
      { num: "18", title: "Image-to-Image Translation", widgets: 6, live: true },
      { num: "19", title: "Diffusion Models", widgets: 4, live: true },
    ],
  },
  {
    label: "Part VI — Evaluation",
    color: "var(--green)",
    chapters: [
      { num: "20", title: "Datasets & Benchmarks", widgets: 3, live: true },
    ],
  },
  {
    label: "Part VII — AI Agents",
    color: "#38bdf8",
    chapters: [
      { num: "21", title: "AI Agents", widgets: 5, live: true },
      { num: "22", title: "Agent Harnesses", widgets: 6, live: true },
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

// Flattened, ordered list of every chapter with its route path and part metadata —
// the shape Topbar's prev/next and breadcrumb logic needs.
export const CHAPTERS = PARTS.flatMap(part =>
  part.chapters.map(ch => ({
    ...ch,
    path: `/ch/${ch.num}`,
    part: shortPartLabel(part.label),
    partLabel: part.label,
    partColor: part.color,
  }))
);

export function findChapterByPath(pathname) {
  return CHAPTERS.find(c => pathname === c.path || pathname.startsWith(c.path + "/"));
}
