import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import TransformerBlock from "../../components/widgets/ch08/TransformerBlock";
import PositionalEncoding from "../../components/widgets/ch08/PositionalEncoding";
import ResidualStream from "../../components/widgets/ch08/ResidualStream";
import ScalingLaws from "../../components/widgets/ch08/ScalingLaws";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Attention Is All You Need", authors: "Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin", venue: "NeurIPS", year: "2017", tag: "seminal" },
  { num: "[2]", title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", authors: "Devlin, Chang, Lee, Toutanova", venue: "NAACL", year: "2019", tag: "seminal" },
  { num: "[3]", title: "Language Models are Few-Shot Learners (GPT-3)", authors: "Brown et al.", venue: "NeurIPS", year: "2020", tag: "seminal" },
  { num: "[4]", title: "Training Compute-Optimal Large Language Models (Chinchilla)", authors: "Hoffmann et al.", venue: "NeurIPS", year: "2022", tag: "paper" },
  { num: "[5]", title: "Scaling Laws for Neural Language Models", authors: "Kaplan, McCandlish, Henighan et al.", venue: "arXiv", year: "2020", tag: "paper" },
  { num: "[6]", title: "RoFormer: Enhanced Transformer with Rotary Position Embedding", authors: "Su, Lu, Pan, Murtadha, Wen, Liu", venue: "arXiv", year: "2021", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "transformer-block-anatomy", label: "Block Anatomy" },
  { id: "positional-encoding",       label: "Positional Encoding" },
  { id: "the-residual-stream",       label: "Residual Stream" },
  { id: "scaling-laws",              label: "Scaling Laws" },
];

export default function Transformers() {
  useTocSections(TOC_SECTIONS);

  return (
    <article
      style={{
        maxWidth: "740px",
        margin: "0 auto",
        padding: "52px 44px 100px",
      }}
    >
      {/* Chapter header */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10.5px",
          fontWeight: 400,
          letterSpacing: "0.1em",
          color: "var(--accent)",
          opacity: 0.7,
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        Chapter 08 · Part II — Architectures
      </div>

      <h1
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: "42px",
          fontWeight: 600,
          color: "var(--text)",
          margin: "0 0 0",
          lineHeight: 1.15,
        }}
      >
        Transformers
      </h1>

      <ChapterLede>
        The transformer abandoned recurrence entirely — and in doing so became the
        dominant architecture across language, vision, audio, and scientific computing.
        Its core insight is that attention over all positions simultaneously, combined
        with position encodings and residual stacks, is sufficient to learn arbitrarily
        complex sequence relationships without any notion of order built into the
        architecture itself.
      </ChapterLede>

      {/* ── Section 1: Transformer Block Anatomy ─────────────────────────── */}
      <div id="transformer-block-anatomy">
        <SectionTitle>Transformer Block Anatomy</SectionTitle>
      </div>

      <p style={prose}>
        Each transformer block applies two sub-layers with residual connections:
        multi-head self-attention and a position-wise feed-forward network.
        Layer normalization stabilizes training — modern implementations apply it
        before each sub-layer (Pre-LN) rather than after (Post-LN), which improves
        gradient flow in very deep models. The residual connections create a
        persistent information highway that makes the blocks easier to train and
        lets the network dynamically choose how much each layer contributes.
      </p>

      <TransformerBlock />

      {/* ── Section 2: Positional Encoding ───────────────────────────────── */}
      <div id="positional-encoding">
        <SectionTitle>Positional Encoding</SectionTitle>
      </div>

      <p style={prose}>
        Self-attention is permutation-equivariant — it treats its input as a set,
        not a sequence. Positional encodings break this symmetry by adding
        position-dependent signals to each token embedding before it enters the
        transformer. Sinusoidal encodings use sine and cosine functions at different
        frequencies across the embedding dimensions, giving each position a unique
        fingerprint that the model can learn to read. Rotary embeddings (RoPE) encode
        relative position directly in the attention dot product, enabling better
        generalization to sequence lengths not seen during training.
      </p>

      <MathBlock>{`PE(pos, 2i)   = sin( pos / 10000^(2i/d) )
PE(pos, 2i+1) = cos( pos / 10000^(2i/d) )`}</MathBlock>

      <PositionalEncoding />

      {/* ── Section 3: The Residual Stream ───────────────────────────────── */}
      <div id="the-residual-stream">
        <SectionTitle>The Residual Stream</SectionTitle>
      </div>

      <p style={prose}>
        From the mechanistic interpretability perspective, each transformer block
        reads from and writes to a shared residual stream — the running sum of all
        previous layer contributions. Attention heads extract Q, K, V from the stream
        and write their output back via a residual addition. Feed-forward layers do
        the same. The final token representation is the accumulated sum of the initial
        embedding plus every attention and FFN contribution across all layers.
        This additive structure means each layer can be understood as a refinement
        rather than a transformation.
      </p>

      <ResidualStream />

      {/* ── Section 4: Scaling Laws ───────────────────────────────────────── */}
      <div id="scaling-laws">
        <SectionTitle>Scaling Laws</SectionTitle>
      </div>

      <p style={prose}>
        Neural language model performance improves as a smooth power law in compute,
        dataset size, and parameter count. The Chinchilla paper (2022) overturned
        the prevailing assumption that larger models were always better — it showed
        that for a fixed compute budget, training a smaller model on proportionally
        more tokens consistently outperforms training a larger model on fewer steps.
        The optimal ratio is roughly 20 tokens per parameter. Most models released
        before 2022 were undertrained by this standard.
      </p>

      <ScalingLaws />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
