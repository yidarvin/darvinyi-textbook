// SCAFFOLD — not yet wired into any route (see App.jsx and src/data/chapters.js,
// where this chapter is marked `live: false`). Built out fully in queue item
// N22 (context/V2_PLAN.md, Appendix C).
import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";

const pending = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "13px",
  fontStyle: "italic",
  color: "var(--text-muted)",
  margin: "0 0 20px",
  padding: "14px 16px",
  border: "1px dashed var(--border-lt)",
  borderRadius: "8px",
};

const CITATIONS = [];

const TOC_SECTIONS = [
  { id: "perplexity-vs-task-performance", label: "Perplexity vs Task Perf." },
  { id: "pass-at-k",                      label: "pass@k" },
  { id: "llm-as-judge",                   label: "LLM-as-Judge" },
  { id: "contamination-and-hygiene",      label: "Contamination" },
  { id: "evaluating-agents",              label: "Evaluating Agents" },
];

export default function EvaluatingLLMsAndAgents() {
  useTocSections(TOC_SECTIONS);

  return (
    <article
      style={{
        maxWidth: "var(--chapter-max-width, 740px)",
        margin: "0 auto",
        padding: "var(--chapter-padding, 52px 44px 100px)",
      }}
    >
      {/* Chapter header */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "var(--chapter-meta-size, 10.5px)",
          fontWeight: 400,
          letterSpacing: "0.1em",
          color: "var(--accent)",
          opacity: 0.7,
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        Chapter 22 · Part VI — Evaluation & Understanding
      </div>

      <h1
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: "var(--h1-size, 42px)",
          fontWeight: 600,
          color: "var(--text)",
          margin: "0 0 0",
          lineHeight: "var(--h1-line-height, 1.15)",
        }}
      >
        Evaluating LLMs & Agents
      </h1>

      <ChapterLede>
        Chapter 21 catalogs which benchmarks exist. This chapter covers how
        evaluation actually works — the methodology behind the numbers, and
        where it quietly breaks.
      </ChapterLede>

      <p style={pending}>
        This chapter is in progress. It is not yet linked from the sidebar or
        reachable at a live URL — see queue item N22 in context/V2_PLAN.md for
        the full section-by-section spec.
      </p>

      <div id="perplexity-vs-task-performance">
        <SectionTitle>Perplexity vs. Task Performance</SectionTitle>
      </div>
      <p style={pending}>
        What perplexity measures and where it diverges from usefulness.
        Widget: <em>PerplexityVsAccuracy</em> (Appendix C, N22 §1).
      </p>

      <div id="pass-at-k">
        <SectionTitle>Sampling-Based Evaluation: pass@k</SectionTitle>
      </div>
      <p style={pending}>
        The unbiased estimator, and why k matters for coding evals. Widget:{" "}
        <em>PassAtKCalculator</em> (Appendix C, N22 §2).
      </p>

      <div id="llm-as-judge">
        <SectionTitle>LLM-as-Judge</SectionTitle>
      </div>
      <p style={pending}>
        Rubrics, pairwise vs. absolute scoring, position/verbosity biases, and
        agreement with humans. Widget: <em>JudgeAgreementExplorer</em>{" "}
        (Appendix C, N22 §3).
      </p>

      <div id="contamination-and-hygiene">
        <SectionTitle>Contamination & Benchmark Hygiene</SectionTitle>
      </div>
      <p style={pending}>
        Train-test leakage at web scale, canary strings, dynamic/private
        benchmarks — cross-referencing Chapter 21's HLE/LMArena coverage
        (Appendix C, N22 §4).
      </p>

      <div id="evaluating-agents">
        <SectionTitle>Evaluating Agents</SectionTitle>
      </div>
      <p style={pending}>
        Trajectory vs. outcome scoring, SWE-Bench/WebArena methodology, and
        cost/reliability axes. Widget: <em>AgentTrajectoryScorer</em>{" "}
        (Appendix C, N22 §5).
      </p>

      <Citations citations={CITATIONS} />
    </article>
  );
}
