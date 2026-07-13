// SCAFFOLD — not yet wired into any route (see App.jsx and src/data/chapters.js,
// where this chapter is marked `live: false`). Built out fully in queue item
// N1 (context/V2_PLAN.md, Appendix C).
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
  { id: "uncertainty-as-distributions", label: "Distributions" },
  { id: "fitting-distributions-mle",    label: "MLE & MAP" },
  { id: "entropy-cross-entropy-kl",     label: "Entropy & KL" },
  { id: "judging-classifiers",          label: "Judging Classifiers" },
];

export default function ProbabilityAndInformation() {
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
        Chapter 01 · Part I — Foundations
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
        Probability & Information for Machine Learning
      </h1>

      <ChapterLede>
        The rest of this book uses maximum likelihood, entropy, and KL
        divergence freely, on the assumption that a reader with no ML
        background already has this vocabulary. This chapter builds it from
        scratch, so nothing later is taken on faith.
      </ChapterLede>

      <p style={pending}>
        This chapter is in progress. It is not yet linked from the sidebar or
        reachable at a live URL — see queue item N1 in context/V2_PLAN.md for
        the full section-by-section spec.
      </p>

      <div id="uncertainty-as-distributions">
        <SectionTitle>Uncertainty as Distributions</SectionTitle>
      </div>
      <p style={pending}>
        Random variables, common distributions (Bernoulli/categorical/Gaussian),
        sampling vs. density. Widget: <em>DistributionExplorer</em> (Appendix C,
        N1 §1).
      </p>

      <div id="fitting-distributions-mle">
        <SectionTitle>Fitting Distributions: MLE (and a Nod to MAP)</SectionTitle>
      </div>
      <p style={pending}>
        Likelihood as "probability of the data as a function of parameters";
        log-likelihood; a worked MLE example for a coin and a Gaussian mean.
        Widget: <em>MLEFitter</em> (Appendix C, N1 §2).
      </p>

      <div id="entropy-cross-entropy-kl">
        <SectionTitle>Entropy, Cross-Entropy, KL</SectionTitle>
      </div>
      <p style={pending}>
        Surprise to entropy; cross-entropy as "cost of the wrong code"; KL as
        the gap — with forward pointers to cross-entropy loss (Chapter 3), the
        ELBO (Chapter 18), and the RLHF KL penalty (Chapter 13). Widget:{" "}
        <em>EntropyKLVisualizer</em> (Appendix C, N1 §3).
      </p>

      <div id="judging-classifiers">
        <SectionTitle>Judging Classifiers</SectionTitle>
      </div>
      <p style={pending}>
        Confusion matrix, precision/recall/F1, ROC/AUC, the threshold
        trade-off — currently a book-wide gap. Widget:{" "}
        <em>ThresholdROCExplorer</em> (Appendix C, N1 §4).
      </p>

      <Citations citations={CITATIONS} />
    </article>
  );
}
