// SCAFFOLD — not yet wired into any route (see App.jsx and src/data/chapters.js,
// where this chapter is marked `live: false`). Built out fully in queue item
// N23 (context/V2_PLAN.md, Appendix C).
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
  { id: "understanding-a-model",      label: "What Is Understanding?" },
  { id: "features-and-superposition", label: "Features & Superposition" },
  { id: "circuits-and-induction",     label: "Circuits & Induction Heads" },
  { id: "sparse-autoencoders",        label: "Sparse Autoencoders" },
  { id: "steering-and-limits",        label: "Steering & Limits" },
];

export default function Interpretability() {
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
        Chapter 23 · Part VI — Evaluation & Understanding
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
        Interpretability
      </h1>

      <ChapterLede>
        Chapter 10's residual-stream section seeded the idea that a
        transformer's internals can be read, not just its outputs. This
        chapter extends that seed to features, circuits, and the sparse
        autoencoders that found them at scale.
      </ChapterLede>

      <p style={pending}>
        This chapter is in progress. It is not yet linked from the sidebar or
        reachable at a live URL — see queue item N23 in context/V2_PLAN.md for
        the full section-by-section spec.
      </p>

      <div id="understanding-a-model">
        <SectionTitle>What Would It Mean to Understand a Model?</SectionTitle>
      </div>
      <p style={pending}>
        Behavioral vs. mechanistic understanding, and the limits of probing.
        Widget: <em>ProbingPlayground</em> (Appendix C, N23 §1).
      </p>

      <div id="features-and-superposition">
        <SectionTitle>Features & Superposition</SectionTitle>
      </div>
      <p style={pending}>
        Features as directions, and superposition when there are more
        features than dimensions. Widget: <em>SuperpositionExplorer</em>{" "}
        (Appendix C, N23 §2).
      </p>

      <div id="circuits-and-induction">
        <SectionTitle>Circuits & Induction Heads</SectionTitle>
      </div>
      <p style={pending}>
        Extends Chapter 10's residual-stream section rather than duplicating
        it; induction heads as the canonical circuit. Widget:{" "}
        <em>InductionHeadTracer</em> (Appendix C, N23 §3).
      </p>

      <div id="sparse-autoencoders">
        <SectionTitle>Sparse Autoencoders & Dictionary Learning</SectionTitle>
      </div>
      <p style={pending}>
        Decomposing activations into interpretable features, and what SAEs
        found in frontier models (2024–26). Widget: <em>SAEFeatureBrowser</em>{" "}
        (Appendix C, N23 §4).
      </p>

      <div id="steering-and-limits">
        <SectionTitle>Steering & the Limits of Interpretability</SectionTitle>
      </div>
      <p style={pending}>
        Activation addition / steering vectors, and an honest account of the
        field's limits. Widget: <em>SteeringDemo</em> (Appendix C, N23 §5).
      </p>

      <Citations citations={CITATIONS} />
    </article>
  );
}
