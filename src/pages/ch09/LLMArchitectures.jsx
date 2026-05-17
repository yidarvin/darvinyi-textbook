import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import ThreeParadigms from "../../components/widgets/ch09/ThreeParadigms";
import KVCache from "../../components/widgets/ch09/KVCache";
import AttentionVariants from "../../components/widgets/ch09/AttentionVariants";
import RoPE from "../../components/widgets/ch09/RoPE";
import MixtureOfExperts from "../../components/widgets/ch09/MixtureOfExperts";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Language Models are Unsupervised Multitask Learners (GPT-2)", authors: "Radford, Wu, Child, Luan, Amodei, Sutskever", venue: "OpenAI Blog", year: "2019", tag: "seminal" },
  { num: "[2]", title: "Language Models are Few-Shot Learners (GPT-3)", authors: "Brown et al.", venue: "NeurIPS", year: "2020", tag: "seminal" },
  { num: "[3]", title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", authors: "Devlin, Chang, Lee, Toutanova", venue: "NAACL", year: "2019", tag: "seminal" },
  { num: "[4]", title: "Exploring the Limits of Transfer Learning with T5", authors: "Raffel, Shazeer, Roberts, Lee, Narang, Matena, Zhou, Li, Liu", venue: "JMLR", year: "2020", tag: "seminal" },
  { num: "[5]", title: "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints", authors: "Ainslie, Lee-Thorp, de Jong, Zelaski, Sanghai, Xu", venue: "EMNLP", year: "2023", tag: "paper" },
  { num: "[6]", title: "RoFormer: Enhanced Transformer with Rotary Position Embedding", authors: "Su, Lu, Pan, Murtadha, Wen, Liu", venue: "Neurocomputing", year: "2024", tag: "paper" },
  { num: "[7]", title: "Mixtral of Experts", authors: "Jiang, Sablayrolles, Roux, Mensch, Savary, Bamford, Chaplot, de las Casas, Hanna, Bressand, Lengyel, Bour, Lample, Lavaud, Saulnier, Lachaux, Stock, Subramanian, Yang, Antoniak, Scao, Gervet, Muennighoff, Villanova, Naval, Bach, Lacroix", venue: "arXiv", year: "2024", tag: "paper" },
  { num: "[8]", title: "LLaMA: Open and Efficient Foundation Language Models", authors: "Touvron, Lavril, Izacard, Martinet, Lachaux, Lacroix, Rozière, Goyal, Hambro, Azhar, Rodriguez, Joulin, Grave, Lample", venue: "arXiv", year: "2023", tag: "paper" },
  { num: "[9]", title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness", authors: "Dao, Fu, Ermon, Rudra, Ré", venue: "NeurIPS", year: "2022", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "three-paradigms",    label: "Three Paradigms" },
  { id: "kv-cache",           label: "KV Cache" },
  { id: "attention-variants", label: "Attention Variants" },
  { id: "rotary-embeddings",  label: "RoPE" },
  { id: "mixture-of-experts", label: "Mixture of Experts" },
];

export default function LLMArchitectures() {
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
        Chapter 09 · Part III — Large Language Models
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
        LLM Architectures
      </h1>

      <ChapterLede>
        The transformer block from Chapter 8 is a unit of computation. A large
        language model is what happens when you stack hundreds of those units, train
        them on a trillion tokens, and make specific architectural choices about
        which directions to attend in, how positions are encoded, and which parameters
        to activate on any given forward pass. The choices made between 2017 and 2025
        — decoder-only versus encoder-only, sinusoidal versus rotary position, dense
        versus sparse activation — produced radically different capability profiles
        from the same fundamental operation. Understanding those choices is the
        difference between knowing how transformers work and knowing how language
        models work.
      </ChapterLede>

      {/* ── Section 1: Three Paradigms ───────────────────────────────────── */}
      <div id="three-paradigms">
        <SectionTitle>Three Paradigms: Decoder, Encoder, Encoder-Decoder</SectionTitle>
      </div>

      <p style={prose}>
        The original transformer had both an encoder and a decoder. Subsequent work
        split this into three families. GPT (decoder-only) masks future tokens and
        trains by predicting the next one — natural for generation, capable of
        arbitrary-length continuation. BERT (encoder-only) attends bidirectionally
        over the full input and trains by masking random tokens — natural for
        classification and retrieval, not generative. T5 (encoder-decoder) processes
        an input sequence with bidirectional attention and generates an output
        sequence with causal attention, treating every task as text-to-text. The
        decoder-only paradigm ultimately dominated: GPT-3 demonstrated that a
        sufficiently large causal language model could perform tasks it was never
        explicitly trained on, simply through in-context learning.
      </p>

      <ThreeParadigms />

      {/* ── Section 2: KV Cache ───────────────────────────────────────────── */}
      <div id="kv-cache">
        <SectionTitle>KV Cache — Making Inference Practical</SectionTitle>
      </div>

      <p style={prose}>
        During autoregressive generation, the model processes one new token per
        step while all previous tokens remain unchanged. Without caching, every
        step recomputes keys and values for all prior tokens — quadratic total cost.
        The KV cache stores the key and value projections from all previous layers
        and all previous tokens, reusing them at each new step. Only the new token's
        keys and values need to be computed. This reduces per-step compute from
        O(T²d) to O(Td) but introduces a new constraint: the KV cache grows linearly
        with sequence length and consumes significant GPU memory — a 70B parameter
        model at 128K context requires tens of gigabytes for the cache alone.
      </p>

      <MathBlock>{`Without cache: O(T^2 * d) per token over T steps = O(T^3 * d) total
With cache:    O(T * d) per token over T steps = O(T^2 * d) total
KV cache size: 2 * num_layers * num_heads * head_dim * seq_len * bytes_per_element`}</MathBlock>

      <KVCache />

      {/* ── Section 3: Attention Variants ─────────────────────────────────── */}
      <div id="attention-variants">
        <SectionTitle>Multi-Head, Multi-Query &amp; Grouped-Query Attention</SectionTitle>
      </div>

      <p style={prose}>
        Standard multi-head attention (MHA) uses h separate Q, K, V projection
        matrices, one per head. At inference, the KV cache must store key-value
        pairs for all h heads — memory-intensive as sequence lengths grow. Multi-query
        attention (MQA) collapses K and V to a single shared head while keeping
        separate Q projections per head: identical computation graphs, dramatically
        smaller KV cache. Grouped-query attention (GQA) is the middle ground — K
        and V are shared within groups of g heads. LLaMA 2 and 3, Mistral, and
        Gemini all adopted GQA: it retains most of MHA's representational capacity
        while cutting KV cache size by a factor of g. Quality at inference is nearly
        indistinguishable; memory savings are substantial.
      </p>

      <MathBlock>{`MHA:  Q_i, K_i, V_i for i = 1..h     KV size: h * seq_len * d_head
MQA:  Q_i for i = 1..h, K, V shared   KV size: 1 * seq_len * d_head
GQA:  Q_i for i = 1..h, K_g, V_g for g = 1..G   KV size: G * seq_len * d_head`}</MathBlock>

      <AttentionVariants />

      {/* ── Section 4: Rotary Embeddings ──────────────────────────────────── */}
      <div id="rotary-embeddings">
        <SectionTitle>Rotary Position Embeddings (RoPE)</SectionTitle>
      </div>

      <p style={prose}>
        Sinusoidal positional encodings add a fixed vector to each token embedding
        before the transformer. This works but has limitations: the model sees
        absolute position, not relative position, and generalizing to sequence
        lengths longer than those seen in training is unreliable. Rotary positional
        embeddings encode position by rotating the query and key vectors in 2D
        subspaces of the feature dimension before computing attention scores.
        The dot product between a query at position m and a key at position n
        then depends only on their relative offset (m − n), not their absolute
        positions. RoPE is now the default choice in LLaMA, Mistral, Qwen, and
        most open-weight frontier models.
      </p>

      <MathBlock>{`RoPE rotation of dimension pair (2i, 2i+1) at position m:
[q_{2i}' ]   [cos(m*theta_i)  -sin(m*theta_i)] [q_{2i} ]
[q_{2i+1}'] = [sin(m*theta_i)   cos(m*theta_i)] [q_{2i+1}]
theta_i = base^(-2i / d),   base = 10000 (or 500000 for long-context)`}</MathBlock>

      <RoPE />

      {/* ── Section 5: Mixture of Experts ─────────────────────────────────── */}
      <div id="mixture-of-experts">
        <SectionTitle>Mixture of Experts</SectionTitle>
      </div>

      <p style={prose}>
        A dense transformer layer applies the same FFN weights to every token.
        A mixture-of-experts (MoE) layer replaces the FFN with E expert networks
        and a learned router that activates only the top-k experts for each token.
        With k=2 and E=64, each token uses 2 expert FFNs rather than 1 — similar
        compute to a dense model — but the total parameter count is 32 times larger.
        More parameters means more capacity for knowledge storage without proportional
        training cost. GPT-4, Gemini 1.5, and Mixtral are believed to use MoE.
        The architectural cost is communication overhead in distributed training
        and load imbalance: if most tokens route to the same few experts, capacity
        is wasted and training destabilizes. Auxiliary load-balancing losses prevent
        this collapse.
      </p>

      <MathBlock>{`MoE output: y = sum_{i in TopK(G(x),k)} G_i(x) * FFN_i(x)
Router: G(x) = Softmax(TopK(W_g * x, k))
Params: num_layers * k/E * dense_params  (active per token)`}</MathBlock>

      <MixtureOfExperts />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
