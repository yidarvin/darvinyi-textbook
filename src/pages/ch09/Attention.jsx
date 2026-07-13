import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import AttentionHeatmap from "../../components/widgets/ch09/AttentionHeatmap";
import QKVInspector from "../../components/widgets/ch09/QKVInspector";
import MultiHeadAttention from "../../components/widgets/ch09/MultiHeadAttention";
import BottleneckVsAttention from "../../components/diagrams/ch09/BottleneckVsAttention";
import QKVMechanism from "../../components/diagrams/ch09/QKVMechanism";
import ScalingByDk from "../../components/diagrams/ch09/ScalingByDk";
import MultiHeadSplit from "../../components/diagrams/ch09/MultiHeadSplit";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Neural Machine Translation by Jointly Learning to Align and Translate", authors: "Bahdanau, Cho, Bengio", venue: "ICLR", year: "2015", tag: "seminal" },
  { num: 2, title: "Attention Is All You Need", authors: "Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin", venue: "NeurIPS", year: "2017", tag: "seminal" },
  { num: 3, title: "Effective Approaches to Attention-based Neural Machine Translation", authors: "Luong, Pham, Manning", venue: "EMNLP", year: "2015", tag: "paper" },
  { num: 4, title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness", authors: "Dao, Fu, Ermon, Rudra", venue: "NeurIPS", year: "2022", tag: "paper" },
  { num: 5, title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", authors: "Dosovitskiy et al.", venue: "ICLR", year: "2021", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-bottleneck-problem",       label: "The Bottleneck" },
  { id: "scaled-dot-product-attention", label: "Dot-Product Attention" },
  { id: "multi-head-attention",         label: "Multi-Head Attention" },
];

export default function Attention() {
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
        Chapter 09 · Part II — Language & Sequence
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
        Attention
      </h1>

      <ChapterLede>
        Recurrent seq2seq models compress an entire input sequence into a single
        fixed-size vector — a bottleneck that loses information for long sequences.
        Attention solves this by letting the decoder look back at all encoder hidden
        states directly, weighting each by its relevance to the current generation step.
        The mechanism is simple. Its consequences were not.
      </ChapterLede>

      {/* ── Section 1: The Seq2Seq Bottleneck ────────────────────────────── */}
      <div id="the-bottleneck-problem">
        <SectionTitle>The Seq2Seq Bottleneck</SectionTitle>
      </div>

      <p style={prose}>
        Chapter 8 ended with exactly this problem. In the original encoder-decoder
        RNN of Sutskever et al., the encoder reads the entire source sentence one
        token at a time and folds everything it has seen into a single hidden
        state — a vector typically of dimension 256 to 1024. That one vector is
        the only thing the decoder receives. Every output token, for every
        position, is generated conditioned on the same fixed summary. Information
        about early tokens has already been overwritten by the time the encoder
        reaches the end.
      </p>

      <p style={prose}>
        The empirical signature is unmistakable. BLEU scores on translation degrade
        sharply once the source passes roughly twenty to thirty tokens. The model
        has not forgotten how to translate — it has simply run out of bits. A few
        hundred floats cannot losslessly encode an arbitrary paragraph, and the
        decoder has no way to consult the source again once generation begins.
      </p>

      <p style={prose}>
        Bahdanau, Cho, and Bengio proposed the fix in 2015. Rather than collapse the
        encoder's output to a single vector, keep all hidden states <InlineMath>{"h_1, \\ldots, h_T"}</InlineMath> and
        let the decoder, at each output step, compute a weighted combination of
        them. The weights — the alignment — come from a small feed-forward network
        that compares the decoder's current state to each encoder state. This is
        additive attention. It was the conceptual breakthrough; the dot-product
        simplification came later. Every refinement in the rest of this chapter —
        queries and keys and values, scaling, multi-head — generalizes this one
        idea.
      </p>

      <BottleneckVsAttention />

      <AttentionHeatmap />

      {/* ── Section 2: Scaled Dot-Product Attention ──────────────────────── */}
      <div id="scaled-dot-product-attention">
        <SectionTitle>Scaled Dot-Product Attention</SectionTitle>
      </div>

      <p style={prose}>
        Luong, Pham, and Manning replaced Bahdanau's learned alignment network with
        a plain dot product <InlineMath>{"q^{\\top} k"}</InlineMath>. The two formulations have the same theoretical
        complexity, but the dot-product variant is dramatically faster in practice:
        a single matrix multiply, fully vectorized on GPU. The Vaswani paper notes
        this directly — dot-product attention is faster and more memory-efficient
        because it reduces to highly optimized matmul kernels. The shift from
        additive to multiplicative was the unlock that made attention cheap enough
        to apply everywhere.
      </p>

      <QKVMechanism />

      <p style={prose}>
        Generalize away from the seq2seq setting. A query is what the current
        position is asking for. A key is what each candidate position advertises
        about itself. A value is what each candidate contributes if it is selected.
        The output is a query-weighted blend of values, where the blend coefficients
        come from query-key similarity. The crucial structural point is that <InlineMath>{"Q"}</InlineMath>, <InlineMath>{"K"}</InlineMath>,
        and <InlineMath>{"V"}</InlineMath> are produced by separate learned linear projections of the same
        underlying inputs. The model can learn what to ask, what to advertise, and
        what to pay out, each independently. From here on, tokens are row vectors
        and projections right-multiply — <InlineMath>{"Q = XW_Q"}</InlineMath>, not{" "}
        <InlineMath>{"Q = W_Q X"}</InlineMath> — the convention used throughout the attention
        literature, and a transpose of the <InlineMath>{"Wx"}</InlineMath> column-vector convention
        the earlier chapters used for a single example.
      </p>

      <MathBlock>{"$$\\text{Attention}(Q, K, V) = \\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right) V$$"}</MathBlock>

      <p style={prose}>
        The <InlineMath>{"\\sqrt{d_k}"}</InlineMath> in the denominator is not cosmetic. If the components of <InlineMath>{"q"}</InlineMath> and <InlineMath>{"k"}</InlineMath>
        are independent with mean 0 and variance 1, then <InlineMath>{"q^{\\top} k = \\sum_i q_i k_i"}</InlineMath> has mean 0
        and variance <InlineMath>{"d_k"}</InlineMath>. As <InlineMath>{"d_k"}</InlineMath> grows — 64, 512, larger — the dot products spread
        out and grow large in magnitude. Softmax of large logits is nearly one-hot,
        and the gradient of softmax in that regime is near zero: training stalls.
        Dividing by <InlineMath>{"\\sqrt{d_k}"}</InlineMath> rescales the variance back to 1, keeping softmax in its
        responsive range. <InlineMath>{"1/\\sqrt{d_k}"}</InlineMath> is exactly the right factor; dividing by <InlineMath>{"d_k"}</InlineMath>
        itself would shrink real differences too aggressively and blur useful
        signal.
      </p>

      <ScalingByDk />

      <QKVInspector />

      {/* ── Section 3: Multi-Head Attention ──────────────────────────────── */}
      <div id="multi-head-attention">
        <SectionTitle>Multi-Head Attention</SectionTitle>
      </div>

      <p style={prose}>
        A single attention map has one set of projections (<InlineMath>{"W_Q, W_K, W_V"}</InlineMath>), so it
        can learn one notion of similarity. But "what relates to what" in a sentence
        is multi-faceted. Subject-verb agreement is a syntactic dependency. A
        pronoun resolving to its antecedent is coreference. Positional locality is
        another channel entirely, as is semantic similarity. One head, one signal —
        and the model is asked to compress all of these into a single attention
        pattern.
      </p>

      <p style={prose}>
        The original Transformer uses <InlineMath>{"d_{\\text{model}} = 512"}</InlineMath> and <InlineMath>{"h = 8"}</InlineMath> heads, with
        <InlineMath>{"d_k = d_v = d_{\\text{model}} / h = 64"}</InlineMath>. Each head receives its own learned
        projections <InlineMath>{"W_i^Q, W_i^K, W_i^V"}</InlineMath> that map from 512 down to 64, runs scaled
        dot-product attention in that 64-dimensional subspace, and produces a
        64-dim output. The eight outputs are concatenated back to 512 and passed
        through a final learned projection <InlineMath>{"W_O \\in \\mathbb{R}^{512 \\times 512}"}</InlineMath>. The compute
        accounting is the punch line: because each head operates at reduced
        dimension, the total cost of multi-head attention is essentially the same
        as a single head at full dimensionality. Multi-head is not more
        expensive — it is the same flops, rearranged into parallel subspaces.
      </p>

      <p style={prose}>
        Probing work on trained Transformers has found heads that specialize in
        syntactic relations, positional patterns, and coreference, though the
        specialization is messier than the clean stories suggest. The architectural
        argument stands on its own: giving the model multiple independent
        similarity functions is cheap, and it consistently outperforms cramming
        the same signal into one.
      </p>

      <MultiHeadSplit />

      <MathBlock>{`$$\\begin{aligned}
  \\text{MultiHead}(Q, K, V) &= \\text{Concat}(\\text{head}_1, \\ldots, \\text{head}_h)\\, W^O \\\\
  \\text{where}\\ \\text{head}_i &= \\text{Attention}(Q W_i^Q,\\ K W_i^K,\\ V W_i^V)
\\end{aligned}$$`}</MathBlock>

      <MultiHeadAttention />

      {/* Softmax Temperature moved to Chapter 14 (Efficient Inference &
          Deployment) — see context/V2_PLAN.md queue item S2. */}

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
