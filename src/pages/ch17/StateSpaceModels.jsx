// SCAFFOLD — not yet wired into any route (see App.jsx and src/data/chapters.js,
// where this chapter is marked `live: false`). Built out fully in queue item
// N17 (context/V2_PLAN.md, Appendix C). Replaces the old standalone Capsule
// Networks chapter, which is demoted to a historical sidebar in Chapter 6
// (see src/pages/ch06/_parked-capsules/).
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
  { id: "the-cost-of-attention",     label: "The Cost of Attention" },
  { id: "state-space-models",        label: "S4 → Mamba" },
  { id: "rwkv-and-linear-attention", label: "RWKV & Linear Attention" },
  { id: "hybrids-in-production",     label: "Hybrids in Production" },
];

export default function StateSpaceModels() {
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
        Chapter 17 · Part IV — Beyond the Transformer
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
        State-Space Models & Attention Alternatives
      </h1>

      <ChapterLede>
        Attention costs grow quadratically with sequence length. State-space
        models, linear attention, and their hybrids offer linear-time
        alternatives — this chapter covers what they trade away for that, and
        why transformers still win in some regimes.
      </ChapterLede>

      <p style={pending}>
        This chapter is in progress. It is not yet linked from the sidebar or
        reachable at a live URL — see queue item N17 in context/V2_PLAN.md for
        the full section-by-section spec.
      </p>

      <div id="the-cost-of-attention">
        <SectionTitle>The Cost of Attention</SectionTitle>
      </div>
      <p style={pending}>
        O(T²) recap (cross-referencing Chapters 9 and 11's KV cache) and what
        linear-time sequence modeling would buy (Appendix C, N17 §1).
      </p>

      <div id="state-space-models">
        <SectionTitle>State-Space Models: S4 → Mamba</SectionTitle>
      </div>
      <p style={pending}>
        Continuous SSM to discretization to the recurrence/convolution
        duality; Mamba's input-dependent selective gating as the unlock.
        Widgets: <em>SSMDuality</em>, <em>SelectiveScan</em> (Appendix C, N17 §2).
      </p>

      <div id="rwkv-and-linear-attention">
        <SectionTitle>RWKV & Linear Attention</SectionTitle>
      </div>
      <p style={pending}>
        Kernelized attention and its RNN reformulation. Widget:{" "}
        <em>ComplexityRace</em> (Appendix C, N17 §3).
      </p>

      <div id="hybrids-in-production">
        <SectionTitle>Hybrids in Production</SectionTitle>
      </div>
      <p style={pending}>
        Jamba/Griffin-style interleaving, when full attention still wins
        (precise recall), and an honest scorecard vs. transformers. Widget:{" "}
        <em>HybridLayerMixer</em> (Appendix C, N17 §4).
      </p>

      <Citations citations={CITATIONS} />
    </article>
  );
}
