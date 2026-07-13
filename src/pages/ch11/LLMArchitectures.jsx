import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import ThreeParadigms from "../../components/widgets/ch11/ThreeParadigms";
import KVCache from "../../components/widgets/ch11/KVCache";
import AttentionVariants from "../../components/widgets/ch11/AttentionVariants";
import RoPE from "../../components/widgets/ch11/RoPE";
import MixtureOfExperts from "../../components/widgets/ch11/MixtureOfExperts";
import TrainingObjectives from "../../components/diagrams/ch11/TrainingObjectives";
import KVCacheReuse from "../../components/diagrams/ch11/KVCacheReuse";
import MHAvsMQAvsGQA from "../../components/diagrams/ch11/MHAvsMQAvsGQA";
import RoPEFrequencySpectrum from "../../components/diagrams/ch11/RoPEFrequencySpectrum";
import MoERouting from "../../components/diagrams/ch11/MoERouting";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Language Models are Unsupervised Multitask Learners (GPT-2)", authors: "Radford, Wu, Child, Luan, Amodei, Sutskever", venue: "OpenAI Blog", year: "2019", tag: "seminal" },
  { num: 2, title: "Language Models are Few-Shot Learners (GPT-3)", authors: "Brown et al.", venue: "NeurIPS", year: "2020", tag: "seminal" },
  { num: 3, title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", authors: "Devlin, Chang, Lee, Toutanova", venue: "NAACL", year: "2019", tag: "seminal" },
  { num: 4, title: "Exploring the Limits of Transfer Learning with T5", authors: "Raffel, Shazeer, Roberts, Lee, Narang, Matena, Zhou, Li, Liu", venue: "JMLR", year: "2020", tag: "seminal" },
  { num: 5, title: "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints", authors: "Ainslie, Lee-Thorp, de Jong, Zelaski, Sanghai, Xu", venue: "EMNLP", year: "2023", tag: "paper" },
  { num: 6, title: "RoFormer: Enhanced Transformer with Rotary Position Embedding", authors: "Su, Lu, Pan, Murtadha, Wen, Liu", venue: "Neurocomputing", year: "2024", tag: "paper" },
  { num: 7, title: "Mixtral of Experts", authors: "Jiang, Sablayrolles, Roux, Mensch, Savary, Bamford, Chaplot, de las Casas, Hanna, Bressand, Lengyel, Bour, Lample, Lavaud, Saulnier, Lachaux, Stock, Subramanian, Yang, Antoniak, Scao, Gervet, Muennighoff, Villanova, Naval, Bach, Lacroix", venue: "arXiv", year: "2024", tag: "paper" },
  { num: 8, title: "LLaMA: Open and Efficient Foundation Language Models", authors: "Touvron, Lavril, Izacard, Martinet, Lachaux, Lacroix, Rozière, Goyal, Hambro, Azhar, Rodriguez, Joulin, Grave, Lample", venue: "arXiv", year: "2023", tag: "paper" },
  { num: 9, title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness", authors: "Dao, Fu, Ermon, Rudra, Ré", venue: "NeurIPS", year: "2022", tag: "paper" },
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
        Chapter 11 · Part III — Large Language Models
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
        LLM Architectures
      </h1>

      <ChapterLede>
        The transformer block from Chapter 10 is a unit of computation. A large
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

      <p style={prose}>
        Three things tilted the field toward causal language models <em>[1] [2]</em>.
        First, the training objective is dirt-cheap to implement — every token in
        the corpus is simultaneously a training example, requiring no special
        masking schedule or denoising scheme. Second, GPT-2 (Radford, Wu, Child,
        Luan, Amodei &amp; Sutskever 2019) showed that a sufficiently large
        autoregressive model could perform tasks zero-shot just by being prompted,
        and GPT-3 (Brown et al. 2020) generalized this to <em>in-context learning</em>
        — putting a few examples into the prompt and getting the model to extrapolate.
        Neither encoder-only nor encoder-decoder paradigms had a natural way to do
        this; both required task-specific fine-tuning. Third, generation,
        classification, and retrieval can all be cast as next-token prediction, but
        the reverse is not true. The decoder-only paradigm subsumed every other use
        case — Radford et al. (2018), the original GPT paper, had already foreseen
        this generality before scale made it inarguable.
      </p>

      <p style={prose}>
        The other two families are still alive in narrower niches. Encoder-only
        models <em>[3]</em> remain the default for <em>embeddings</em> — converting
        text into fixed-dimensional vectors for retrieval, clustering, and similarity
        search. Sentence-BERT and its descendants are still the workhorses behind
        RAG systems. Encoder-decoder models <em>[4]</em> remain useful for
        sequence-to-sequence tasks where input and output are structurally distinct:
        translation, summarization, structured extraction. T5's "everything is
        text-to-text" framing was elegant but ultimately less scalable than just
        adding a system prompt to a causal LM. A small modern variant —
        <em> prefix-LM</em> (used in some PaLM training) — sits between the families
        by allowing bidirectional attention over the prompt and causal attention
        over the generated completion.
      </p>

      <TrainingObjectives />

      <ThreeParadigms />

      {/* ── Section 2: KV Cache ───────────────────────────────────────────── */}
      <div id="kv-cache">
        <SectionTitle>KV Cache — Making Inference Practical</SectionTitle>
      </div>

      <p style={prose}>
        During autoregressive generation, the model processes one new token per
        step while all previous tokens remain unchanged. Without caching, every
        step recomputes keys and values for all prior tokens — quadratic cost per
        step, cubic total cost across a full generation.
        The KV cache stores the key and value projections from all previous layers
        and all previous tokens, reusing them at each new step. Only the new token's
        keys and values need to be computed. This reduces per-step compute from{" "}
        <InlineMath>{"\\mathcal{O}(T^2 d)"}</InlineMath> to{" "}
        <InlineMath>{"\\mathcal{O}(T d)"}</InlineMath> but introduces a new
        constraint: the KV cache grows linearly with sequence length and consumes
        significant GPU memory — a 70B parameter model with a 128K context window requires
        tens of gigabytes for the cache alone.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{without cache:} \\quad &\\mathcal{O}(T^2 d) \\text{ per token} \\times T \\text{ steps} = \\mathcal{O}(T^3 d) \\text{ total} \\\\
  \\text{with cache:} \\quad &\\mathcal{O}(T d) \\text{ per token} \\times T \\text{ steps} = \\mathcal{O}(T^2 d) \\text{ total} \\\\
  \\text{KV size:} \\quad &2 \\cdot L \\cdot h \\cdot d_{\\text{head}} \\cdot T \\cdot \\text{bytes}
\\end{aligned}$$`}</MathBlock>

      <KVCacheReuse />

      <p style={prose}>
        The memory hierarchy makes this worse than it looks. A 70B-parameter LLM with a 128K context window,
        using FP16 keys and values, runs to roughly 40 GB of KV cache
        <em> per inference request</em>. Multiply by batch size and you saturate HBM
        (high-bandwidth memory) on even an 80 GB H100. This is why the bottleneck
        for serving LLMs is rarely compute — it's memory bandwidth and capacity.
        Production systems use <em>continuous batching</em> (vLLM's PagedAttention
        treats the KV cache like virtual memory, with pages of cache reused across
        requests) and <em>quantized caches</em> (storing keys and values at FP8 or
        INT8) to fit more requests onto the same GPU.
      </p>

      <p style={prose}>
        FlashAttention sidesteps a different bottleneck <em>[9]</em>. Dao, Fu,
        Ermon, Rudra &amp; Ré (2022) attacked attention from a hardware angle. The
        naïve attention computation materializes the full{" "}
        <InlineMath>{"T \\times T"}</InlineMath> attention matrix in HBM and
        reads and writes it multiple times — a memory-bound operation even though
        it looks compute-bound on paper. FlashAttention fuses the softmax-with-V
        step and tiles the computation so the intermediate values stay in SRAM (an
        order of magnitude faster than HBM), never materializing the full attention
        matrix. The result: 2–4× faster attention with no approximation, and
        quadratically less HBM allocation. Every modern inference and training
        stack uses FlashAttention or a descendant (FlashAttention-2,
        FlashAttention-3 for Hopper); without it, training a long-context LLM at
        scale would be impractical.
      </p>

      <KVCache />

      {/* ── Section 3: Attention Variants ─────────────────────────────────── */}
      <div id="attention-variants">
        <SectionTitle>Multi-Head, Multi-Query &amp; Grouped-Query Attention</SectionTitle>
      </div>

      <p style={prose}>
        Standard multi-head attention (MHA) uses{" "}
        <InlineMath>{"h"}</InlineMath> separate Q, K, V projection matrices,
        one per head. At inference, the KV cache must store key-value pairs for
        all <InlineMath>{"h"}</InlineMath> heads — memory-intensive as sequence
        lengths grow. Multi-query attention (MQA) collapses K and V to a single
        shared head while keeping separate Q projections per head: identical
        computation graphs, dramatically smaller KV cache. Grouped-query attention
        (GQA) is the middle ground — K and V are shared within groups of{" "}
        <InlineMath>{"h/G"}</InlineMath> heads. Llama 2 and 3, Mistral, and
        Gemini all adopted GQA: it retains most of MHA's representational capacity
        while cutting KV cache size by a factor of{" "}
        <InlineMath>{"h/G"}</InlineMath>. Quality at inference is nearly
        indistinguishable; memory savings are substantial.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{MHA:} \\quad &Q_i, K_i, V_i \\text{ for } i = 1..h \\qquad &\\text{K entries/layer: } h \\cdot T \\cdot d_{\\text{head}} \\\\
  \\text{MQA:} \\quad &Q_i \\text{ for } i = 1..h,\\ K, V \\text{ shared} \\qquad &\\text{K entries/layer: } 1 \\cdot T \\cdot d_{\\text{head}} \\\\
  \\text{GQA:} \\quad &Q_i \\text{ for } i = 1..h,\\ K_g, V_g \\text{ for } g = 1..G \\qquad &\\text{K entries/layer: } G \\cdot T \\cdot d_{\\text{head}}
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        (Doubling for both K and V, and multiplying by the number of layers{" "}
        <InlineMath>{"L"}</InlineMath>, recovers the full-model byte count from
        the cache-size formula above.)
      </p>

      <MHAvsMQAvsGQA />

      <p style={prose}>
        MQA came first; GQA interpolated <em>[5]</em>. Multi-query attention was
        originally proposed by Shazeer (2019) as a memory optimization that traded
        a small quality drop for a much smaller KV cache. The technique worked for
        some tasks but cost noticeable quality on others — a single shared K and V
        proved too restrictive for capturing diverse positional and semantic
        relationships. Grouped-query attention (Ainslie, Lee-Thorp, de Jong,
        Zelaski, Sanghai &amp; Xu 2023) gave the field a way to interpolate: instead
        of <InlineMath>{"h"}</InlineMath> separate K/V projections (MHA) or 1 shared
        (MQA), use <InlineMath>{"G"}</InlineMath> groups where{" "}
        <InlineMath>{"h/G"}</InlineMath> Q-heads share each K/V projection.
        The original GQA paper showed quality almost matching MHA at the cost of
        MQA. Llama 2 <em>[8]</em> adopted GQA with 8 K/V groups for 32 Q-heads;
        Llama 3, Mistral, and Gemini all followed.
      </p>

      <p style={prose}>
        Beyond GQA: latent attention. DeepSeek-V2 introduced
        <em> Multi-head Latent Attention</em> (MLA, 2024), which compresses the K
        and V projections through a low-rank latent space before storing them in
        the cache, then decompresses at attention time. This reduces KV cache size
        by another order of magnitude beyond GQA while preserving most of MHA's
        quality. The pattern is clear: every architectural fork in modern LLMs is,
        in part, an effort to manage the KV cache. The model's compute pattern is
        shaped as much by inference memory constraints as by training-time quality
        concerns.
      </p>

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
        embeddings <em>[6]</em> encode position by rotating the query and key
        vectors in 2D subspaces of the feature dimension before computing attention
        scores. The dot product between a query at position{" "}
        <InlineMath>{"m"}</InlineMath> and a key at position{" "}
        <InlineMath>{"n"}</InlineMath> then depends only on their relative
        offset <InlineMath>{"(m - n)"}</InlineMath>, not their absolute positions.
        RoPE is now the default choice in Llama, Mistral, Qwen, and most
        open-weight frontier models.
      </p>

      <p style={prose}>
        RoPE doesn't apply a single rotation; it applies many. The feature dimension
        is split into <InlineMath>{"d/2"}</InlineMath> pairs, and each pair{" "}
        <InlineMath>{"(2i, 2i+1)"}</InlineMath> is rotated at a frequency{" "}
        <InlineMath>{"\\theta_i = \\text{base}^{-2i/d}"}</InlineMath>. Low-index
        pairs rotate slowly (long wavelength, sensitive to coarse-grained position);
        high-index pairs rotate quickly (short wavelength, sensitive to
        fine-grained local position). The model sees position as a
        <em> multi-scale</em> signal, similar in spirit to sinusoidal encoding but
        baked into the attention operation rather than added to the embedding.
      </p>

      <RoPEFrequencySpectrum />

      <p style={prose}>
        The frequency spectrum directly controls how far the model can reliably
        "see." If the longest wavelength is shorter than the training context
        window, RoPE generalizes poorly beyond it. Llama 1 used{" "}
        <InlineMath>{"\\text{base} = 10000"}</InlineMath> for a 2K context window.
        Llama 3 extended to a 128K context window by raising{" "}
        <InlineMath>{"\\text{base} = 500000"}</InlineMath>, which slows down
        every frequency proportionally — longer wavelengths cover more positions.
        More sophisticated schemes (Position Interpolation, NTK-aware scaling,
        YaRN) interpolate or extrapolate the frequencies more selectively, often
        allowing a model trained with an 8K context window to extend to a 128K one with minimal
        fine-tuning. RoPE's elegance is that all these tricks operate on a single
        hyperparameter — the base frequency — rather than requiring architecture
        changes.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\begin{pmatrix} q'_{2i} \\\\ q'_{2i+1} \\end{pmatrix} &= \\begin{pmatrix} \\cos(m\\theta_i) & -\\sin(m\\theta_i) \\\\ \\sin(m\\theta_i) & \\cos(m\\theta_i) \\end{pmatrix} \\begin{pmatrix} q_{2i} \\\\ q_{2i+1} \\end{pmatrix} \\\\
  \\theta_i &= \\text{base}^{-2i/d}, \\quad \\text{base} = 10000 \\text{ (or } 500000 \\text{ for long-context)}
\\end{aligned}$$`}</MathBlock>

      <RoPE />

      {/* ── Section 5: Mixture of Experts ─────────────────────────────────── */}
      <div id="mixture-of-experts">
        <SectionTitle>Mixture of Experts</SectionTitle>
      </div>

      <p style={prose}>
        A dense transformer layer applies the same FFN weights to every token.
        A mixture-of-experts (MoE) layer replaces the FFN with{" "}
        <InlineMath>{"E"}</InlineMath> expert networks and a learned router
        that activates only the top-<InlineMath>{"k"}</InlineMath> experts for each
        token. With <InlineMath>{"k = 2"}</InlineMath> and{" "}
        <InlineMath>{"E = 64"}</InlineMath>, each token uses 2 expert FFNs
        rather than 1 — similar compute to a dense model — but the total parameter
        count is 32 times larger. More parameters means more capacity for knowledge
        storage without proportional training cost. GPT-4, Gemini 1.5, and Mixtral
        are believed to use MoE. The architectural cost is communication overhead
        in distributed training and load imbalance: if most tokens route to the
        same few experts, capacity is wasted and training destabilizes. Auxiliary
        load-balancing losses prevent this collapse.
      </p>

      <p style={prose}>
        Dense models pay for every parameter on every forward pass. MoE models pay
        only for the active subset. Switch Transformer (Fedus, Zoph &amp; Shazeer
        2022) — one of the canonical sparse models, building on the earlier GShard
        work of Lepikhin et al. (2020) — demonstrated that you could scale total
        parameters by 10× while keeping per-token compute constant, and quality
        improved as if you'd actually scaled compute. The decomposition decouples
        <em> capacity</em> (total parameters, which holds knowledge) from
        <em> compute</em> (active parameters per forward pass, which costs FLOPs
        at training and inference). This decoupling is the entire pitch: more
        capacity at the same compute, or the same capacity at less compute.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  y &= \\sum_{i \\in \\text{TopK}(G(x), k)} G_i(x) \\cdot \\text{FFN}_i(x) \\\\
  G(x) &= \\text{Softmax}(\\text{TopK}(x W_g,\\, k)) \\\\
  \\text{active params per token} &\\approx \\tfrac{k}{E} \\cdot \\text{dense params}
\\end{aligned}$$`}</MathBlock>

      <MoERouting />

      <p style={prose}>
        Mixtral and the open-source MoE wave <em>[7]</em>. Mixtral 8×7B (Jiang et
        al. 2024) was the first widely-deployed open-weight sparse model: 8 expert
        FFNs per layer, top-2 routing, ~47B total parameters with ~13B active per
        token. It matched Llama 2 70B quality at a fraction of the inference cost
        — and could be served on hardware that wouldn't fit a 70B dense model.
        The architectural cost is real: MoE training requires expert-parallel
        distributed setups, suffers from communication overhead, and needs
        auxiliary losses to keep experts balanced. GPT-4 and Gemini 1.5 are widely
        believed to be MoE based on architectural hints in their inference
        behavior. The trade-off is increasingly clear: dense models are simpler;
        sparse models are bigger.
      </p>

      <MixtureOfExperts />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
