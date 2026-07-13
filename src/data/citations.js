// ─── Shared citation metadata, keyed by slug ─────────────────────────────────
// Every paper cited in 2+ chapters lives here exactly once, so a metadata fix
// (or a preprint graduating to a published venue) never has to be repeated
// per chapter. Papers cited in only one chapter can stay as inline objects in
// that chapter's own CITATIONS array — there's nothing to keep in sync.
//
// Usage in a chapter file:
//   import { buildCitations } from "../../data/citations";
//   const CITATIONS = buildCitations([
//     "attention-is-all-you-need",
//     "bert",
//     { title: "...", authors: "...", venue: "...", year: "...", tag: "..." }, // chapter-specific
//   ]);

export const CITATIONS = {
  "attention-is-all-you-need": {
    title: "Attention Is All You Need",
    authors: "Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin",
    venue: "NeurIPS",
    year: "2017",
    tag: "seminal",
  },
  "bert": {
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    authors: "Devlin, Chang, Lee, Toutanova",
    venue: "NAACL",
    year: "2019",
    tag: "seminal",
  },
  "gpt3": {
    title: "Language Models are Few-Shot Learners (GPT-3)",
    authors: "Brown et al.",
    venue: "NeurIPS",
    year: "2020",
    tag: "seminal",
  },
  "roformer": {
    // Published version preferred over the 2021 arXiv preprint — previously
    // cited both ways in different chapters.
    title: "RoFormer: Enhanced Transformer with Rotary Position Embedding",
    authors: "Su, Lu, Pan, Murtadha, Wen, Liu",
    venue: "Neurocomputing",
    year: "2024",
    tag: "paper",
  },
  "flashattention": {
    // Previously cited with "Ré" dropped from the author list in one chapter.
    title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
    authors: "Dao, Fu, Ermon, Rudra, Ré",
    venue: "NeurIPS",
    year: "2022",
    tag: "paper",
  },
  "instructgpt": {
    title: "Training Language Models to Follow Instructions with Human Feedback (InstructGPT)",
    authors: "Ouyang, Wu, Jiang, Almeida, Wainwright, Mishkin, Zhang, Agarwal, Slama, Ray, Schulman, Hilton, Kelton, Miller, Simens, Askell, Welinder, Christiano, Leike, Lowe",
    venue: "NeurIPS",
    year: "2022",
    tag: "seminal",
  },
  "toolformer": {
    title: "Toolformer: Language Models Can Teach Themselves to Use Tools",
    authors: "Schick, Dwivedi-Yu, Dessì, Raileanu, Lomeli, Zettlemoyer, Cancedda, Scialom",
    venue: "NeurIPS",
    year: "2023",
    tag: "paper",
  },
  "constitutional-ai": {
    title: "Constitutional AI: Harmlessness from AI Feedback",
    authors: "Bai, Jones, Ndousse, Askell, Chen, DasSarma, Drain, Fort, Ganguli, Henighan, Joseph, Kadavath, Kernion, Conerly, El-Showk, Elhage, Hatfield-Dodds, Hernandez, Hume, Johnston, Kravec, Lovitt, Nanda, Olsson, Amodei, Brown, Clark, McCandlish, Olah, Mann, Kaplan",
    venue: "arXiv",
    year: "2022",
    tag: "seminal",
  },
  "langchain": {
    title: "LangChain: Building Applications with LLMs through Composability",
    authors: "Chase",
    venue: "GitHub",
    year: "2022",
    tag: "paper",
  },
  "autogpt": {
    title: "AutoGPT: An Autonomous GPT-4 Experiment",
    authors: "Significant Gravitas",
    venue: "GitHub",
    year: "2023",
    tag: "paper",
  },
  "elements-of-statistical-learning": {
    title: "The Elements of Statistical Learning",
    authors: "Hastie, Tibshirani, Friedman",
    venue: "Springer",
    year: "2001",
    tag: "seminal",
  },
  "bias-variance-dilemma": {
    title: "Neural Networks and the Bias/Variance Dilemma",
    authors: "Geman, Bienenstock, Doursat",
    venue: "Neural Computation",
    year: "1992",
    tag: "seminal",
  },
  "lack-of-a-priori-distinctions": {
    // The supervised-learning No Free Lunch result — distinct from Wolpert &
    // Macready's 1997 optimization-focused NFL paper, which is about
    // black-box search over objective functions, not learning algorithms.
    title: "The Lack of A Priori Distinctions Between Learning Algorithms",
    authors: "Wolpert",
    venue: "Neural Computation",
    year: "1996",
    tag: "seminal",
  },
  "vc-dimension-learnability": {
    title: "Learnability and the Vapnik-Chervonenkis Dimension",
    authors: "Blumer, Ehrenfeucht, Haussler, Warmuth",
    venue: "Journal of the ACM",
    year: "1989",
    tag: "paper",
  },
  "reconciling-bias-variance-tradeoff": {
    title: "Reconciling Modern Machine-Learning Practice and the Classical Bias-Variance Trade-off",
    authors: "Belkin, Hsu, Ma, Mandal",
    venue: "PNAS",
    year: "2019",
    tag: "seminal",
  },
};

// Build a chapter's numbered citation list from an ordered array of entries.
// Each entry is either a slug (string, looked up in CITATIONS above) or a
// full { title, authors, venue, year, tag } object for a paper unique to
// that chapter. `num` is assigned by position, matching the chapter's own
// inline [N] markers.
export function buildCitations(entries) {
  return entries.map((entry, i) => ({
    num: i + 1,
    ...(typeof entry === "string" ? CITATIONS[entry] : entry),
  }));
}
