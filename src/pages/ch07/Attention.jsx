import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import AttentionHeatmap from "../../components/widgets/ch07/AttentionHeatmap";
import QKVInspector from "../../components/widgets/ch07/QKVInspector";
import MultiHeadAttention from "../../components/widgets/ch07/MultiHeadAttention";
import SoftmaxTemperature from "../../components/widgets/ch07/SoftmaxTemperature";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Neural Machine Translation by Jointly Learning to Align and Translate", authors: "Bahdanau, Cho, Bengio", venue: "ICLR", year: "2015", tag: "seminal" },
  { num: "[2]", title: "Attention Is All You Need", authors: "Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin", venue: "NeurIPS", year: "2017", tag: "seminal" },
  { num: "[3]", title: "Effective Approaches to Attention-based Neural Machine Translation", authors: "Luong, Pham, Manning", venue: "EMNLP", year: "2015", tag: "paper" },
  { num: "[4]", title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness", authors: "Dao, Fu, Ermon, Rudra", venue: "NeurIPS", year: "2022", tag: "paper" },
  { num: "[5]", title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", authors: "Dosovitskiy et al.", venue: "ICLR", year: "2021", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-bottleneck-problem",       label: "The Bottleneck" },
  { id: "scaled-dot-product-attention", label: "Dot-Product Attention" },
  { id: "multi-head-attention",         label: "Multi-Head Attention" },
  { id: "softmax-temperature",          label: "Softmax Temperature" },
];

export default function Attention() {
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
        Chapter 07 · Part II — Architectures
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
        In a standard encoder-decoder RNN, the encoder reads the entire input and
        compresses it into a single context vector — the final hidden state.
        The decoder then generates each output token conditioned only on that one
        vector. For short sentences this works. For long ones, the fixed-size
        bottleneck forces the encoder to discard information, and translation quality
        degrades sharply beyond ~20 words.
      </p>

      <AttentionHeatmap />

      {/* ── Section 2: Scaled Dot-Product Attention ──────────────────────── */}
      <div id="scaled-dot-product-attention">
        <SectionTitle>Scaled Dot-Product Attention</SectionTitle>
      </div>

      <p style={prose}>
        Attention computes a weighted sum of Values, where weights are derived from
        comparing Queries to Keys via dot products. Scaling by the square root of the
        key dimension prevents the dot products from growing large in high dimensions,
        which would push the softmax into regions of vanishingly small gradients.
        The output is a context-sensitive blend of all values — each query attends
        to exactly the information it needs.
      </p>

      <MathBlock>{"Attention(Q, K, V) = softmax( Q Kt / sqrt(dk) ) * V"}</MathBlock>

      <QKVInspector />

      {/* ── Section 3: Multi-Head Attention ──────────────────────────────── */}
      <div id="multi-head-attention">
        <SectionTitle>Multi-Head Attention</SectionTitle>
      </div>

      <p style={prose}>
        A single attention operation can only express one type of relationship between
        tokens at a time. Multi-head attention runs h independent attention operations
        in parallel, each with its own learned Q, K, V projections. One head might
        track syntactic dependencies while another tracks coreference. Their outputs
        are concatenated and projected back to the model dimension, giving the model
        richer representational power than any single head could provide.
      </p>

      <MathBlock>{`MultiHead(Q, K, V) = Concat(head1, ..., headh) * WO
where headi = Attention(Q*WiQ, K*WiK, V*WiV)`}</MathBlock>

      <MultiHeadAttention />

      {/* ── Section 4: Softmax Temperature ───────────────────────────────── */}
      <div id="softmax-temperature">
        <SectionTitle>Softmax Temperature</SectionTitle>
      </div>

      <p style={prose}>
        The sharpness of the attention distribution is controlled by temperature T,
        applied by dividing logits before softmax. At low T the distribution sharpens
        toward one-hot — hard attention, high confidence. At high T it flattens
        toward uniform — soft attention, uncertainty. This same temperature parameter
        appears in knowledge distillation, language model sampling, and contrastive
        learning, making it one of the most broadly applicable ideas in the field.
      </p>

      <MathBlock>{"softmax(z/T)i = exp(zi/T) / sum_j exp(zj/T)"}</MathBlock>

      <SoftmaxTemperature />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
