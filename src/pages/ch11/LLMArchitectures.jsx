import { useTocSections } from "../../components/layout/TocRail";
import { buildCitations } from "../../data/citations";
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

const CITATIONS = buildCitations([
  { title: "Language Models are Unsupervised Multitask Learners (GPT-2)", authors: "Radford, Wu, Child, Luan, Amodei, Sutskever", venue: "OpenAI Blog", year: "2019", tag: "seminal" },
  "gpt3",
  "bert",
  { title: "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer", authors: "Raffel, Shazeer, Roberts, Lee, Narang, Matena, Zhou, Li, Liu", venue: "JMLR", year: "2020", tag: "seminal" },
  { title: "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints", authors: "Ainslie, Lee-Thorp, de Jong, Zemlyanskiy, Lebrón, Sanghai", venue: "EMNLP", year: "2023", tag: "paper" },
  "roformer",
  { title: "Mixtral of Experts", authors: "Jiang, Sablayrolles, Roux, Mensch, Savary, Bamford, Chaplot, de las Casas, Hanna, Bressand, Lengyel, Bour, Lample, Lavaud, Saulnier, Lachaux, Stock, Subramanian, Yang, Antoniak, Scao, Gervet, Lavril, Wang, Lacroix, El Sayed", venue: "arXiv", year: "2024", tag: "paper" },
  "llama2",
  "flashattention",
  { title: "Improving Language Understanding by Generative Pre-Training (GPT)", authors: "Radford, Narasimhan, Salimans, Sutskever", venue: "OpenAI", year: "2018", tag: "seminal" },
  { title: "Fast Transformer Decoding: One Write-Head is All You Need", authors: "Shazeer", venue: "arXiv", year: "2019", tag: "paper" },
  { title: "Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity", authors: "Fedus, Zoph, Shazeer", venue: "JMLR", year: "2022", tag: "paper" },
  { title: "GShard: Scaling Giant Models with Conditional Computation and Automatic Sharding", authors: "Lepikhin, Lee, Xu, Chen, Firat, Huang, Krikun, Shazeer, Chen", venue: "ICLR", year: "2021", tag: "paper" },
  { title: "DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model", authors: "DeepSeek-AI", venue: "arXiv", year: "2024", tag: "paper" },
  { title: "DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models", authors: "Dai, Deng, Zhao, Xu, Gao, Chen, Li, Zeng, Yu, Wu, Xie, Li, Huang, Luo, Ruan, Sui, Liang", venue: "ACL", year: "2024", tag: "paper" },
  { title: "Mistral 7B", authors: "Jiang, Sablayrolles, Mensch, Bamford, Chaplot, de las Casas, Bressand, Lengyel, Lample, Saulnier, Lavaud, Lachaux, Stock, Scao, Lavril, Wang, Lacroix, El Sayed", venue: "arXiv", year: "2023", tag: "paper" },
  { title: "Efficient Streaming Language Models with Attention Sinks", authors: "Xiao, Tian, Chen, Han, Lewis", venue: "arXiv", year: "2023", tag: "paper" },
  { title: "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks", authors: "Reimers, Gurevych", venue: "EMNLP", year: "2019", tag: "paper" },
  { title: "Efficient Memory Management for Large Language Model Serving with PagedAttention", authors: "Kwon, Li, Zhuang, Sheng, Zheng, Yu, Gonzalez, Zhang, Stoica", venue: "SOSP", year: "2023", tag: "paper" },
  { title: "Extending Context Window of Large Language Models via Positional Interpolation", authors: "Chen, Wong, Chen, Tian", venue: "arXiv", year: "2023", tag: "paper" },
  { title: "YaRN: Efficient Context Window Extension of Large Language Models", authors: "Peng, Quesnelle, Fan, Shippole", venue: "ICLR", year: "2024", tag: "paper" },
]);

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
        from the same fundamental operation, and those same choices are what a serving
        stack has to pay for at inference time, one token at a time.
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
        masking schedule or denoising scheme. Second, GPT-2 (Radford et al. 2019)
        showed that a sufficiently large autoregressive model could perform tasks
        zero-shot just by being prompted, and GPT-3 (Brown et al. 2020) generalized
        this to <em>in-context learning</em>{" "}
        — putting a few examples into the prompt and getting the model to extrapolate.
        Neither encoder-only nor encoder-decoder paradigms had a natural way to do
        this; both required task-specific fine-tuning. Third, generation,
        classification, and retrieval can all be cast as next-token prediction, but
        the reverse is not true. The decoder-only paradigm subsumed every other use
        case — Radford et al. (2018) <em>[10]</em>, the original GPT paper, had
        already foreseen this generality before scale made it inarguable.
      </p>

      <p style={prose}>
        The other two families are still alive in narrower niches. Encoder-only
        models <em>[3]</em> remain the default for <em>embeddings</em> — converting
        text into fixed-dimensional vectors for retrieval, clustering, and similarity
        search. Sentence-BERT <em>[18]</em> and its descendants are still the
        workhorses behind
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

      <p style={prose}>
        Click through the encoder, decoder, and encoder-decoder columns below
        and toggle the attention-mask heatmaps on; notice how the encoder's mask
        stays fully open while the decoder's collapses into a lower triangle,
        and how the encoder-decoder column adds a separate cross-attention block
        that reads K, V from the encoder side.
      </p>

      <ThreeParadigms
        tryThis={{
          do: "Toggle the attention-mask heatmaps on and click through the encoder, decoder, and encoder-decoder columns.",
          notice: "The encoder's mask is fully open, the decoder's collapses to a lower triangle (each token sees only itself and the past), and only the encoder-decoder column has a separate cross-attention block reading K, V from the encoder side.",
        }}
      />

      {/* ── Block anatomy, revisited ─────────────────────────────────────── */}
      <p style={prose}>
        One block-level detail closes the loop this chapter's lede opened, before
        moving on to how these paradigms actually get served. Chapter
        10 covers Pre-LN placement and RMSNorm versus LayerNorm in depth, and
        SwiGLU versus GELU feed-forward sub-layers; the one piece it doesn't cover
        is bias removal. Essentially every modern open-weight LLM (Llama, PaLM,
        Mistral, Qwen) drops the bias terms from its linear and attention
        projections entirely, keeping only the weight matrices — one fewer
        parameter tensor per projection, and ablations at scale found it cost
        nothing in quality while making training modestly more stable. Bias-free
        projections, Pre-LN RMSNorm, and a gated SwiGLU FFN together make up the
        specific block recipe nearly every frontier LLM runs today, distinct from
        the biased, Post-LN, ReLU-FFN block the original transformer proposed.
      </p>

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
  \\text{KV size:} \\quad &2 \\cdot L \\cdot h \\cdot d_k \\cdot T \\cdot \\text{bytes}
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"L"}</InlineMath> is the number of layers,{" "}
        <InlineMath>{"h"}</InlineMath> the number of KV heads (or groups, once
        GQA enters the picture below), <InlineMath>{"d_k"}</InlineMath>{" "}
        the per-head dimension (labeled <InlineMath>{"d_{\\text{head}}"}</InlineMath> in
        the widgets below), and <InlineMath>{"T"}</InlineMath> the sequence
        length processed so far; the leading 2 counts keys and values
        separately, and bytes is 2 for FP16 or 1 for INT8.
      </p>

      <KVCacheReuse />

      <p style={prose}>
        Serving a request actually runs in two phases with very different cost
        profiles. <em>Prefill</em> processes the entire prompt in one parallel
        forward pass — every prompt token's attention can be computed at once
        because the whole prompt is already known, so prefill is compute-bound
        and fills the KV cache for the whole prompt in a single shot.{" "}
        <em>Decode</em> then generates the completion one token at a time: each
        step reads the entire, still-growing KV cache to produce a single new
        token, so decode is memory-bandwidth-bound rather than compute-bound —
        the GPU spends most of its time moving cached keys and values out of
        HBM (high-bandwidth memory) rather than doing matrix multiplications.
        This split is why serving
        systems report two separate latency numbers — time-to-first-token
        (dominated by prefill) and time-per-output-token (dominated by decode)
        — and it's the decode phase where the KV cache size below actually bites.
      </p>

      <p style={prose}>
        The memory hierarchy makes decode worse than it looks. Plug Llama
        3&nbsp;70B's real numbers into the KV-size formula above:{" "}
        <InlineMath>{"L = 80"}</InlineMath> layers,{" "}
        <InlineMath>{"h = 8"}</InlineMath> KV groups (GQA — more on this below),{" "}
        <InlineMath>{"d_k = 128"}</InlineMath>,{" "}
        <InlineMath>{"T = 131{,}072"}</InlineMath> (a 128K context), and 2 bytes
        per value for FP16. That's{" "}
        <InlineMath>{"2 \\times 80 \\times 8 \\times 128 \\times 131{,}072 \\times 2 \\approx 42.9 \\times 10^9"}</InlineMath>{" "}
        bytes — roughly 40 GB of KV cache
        <em> per inference request</em>. Multiply by batch size and you saturate
        HBM on even an 80 GB H100. This is why the bottleneck
        for serving LLMs is rarely compute — it's memory bandwidth and capacity.
        Production systems use <em>continuous batching</em> (vLLM's PagedAttention{" "}
        <em>[19]</em> treats the KV cache like virtual memory, with pages of cache
        reused across
        requests) and <em>quantized caches</em> (storing keys and values at FP8 or
        INT8) to fit more requests onto the same GPU.
      </p>

      <p style={prose}>
        FlashAttention sidesteps a different bottleneck <em>[9]</em>. Dao et al.
        (2022) attacked attention from a hardware angle. The
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

      <p style={prose}>
        Step through the token-by-token generation below with Next Token or
        Auto-play; watch the cache heatmap fill in one new column per step
        while the cumulative-FLOPs chart bends away from the red quadratic
        curve and tracks the teal linear one instead.
      </p>

      <KVCache
        tryThis={{
          do: "Click Next Token a few times, then switch to Auto-play.",
          notice: "Each step lights up exactly one new cache column across all layers, and the cumulative-FLOPs chart's teal (cached) curve stays linear while the red (no-cache) curve keeps bending upward.",
        }}
      />

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
  \\text{MHA:} \\quad &Q_i, K_i, V_i \\text{ for } i = 1..h \\qquad &\\text{K entries/layer: } h \\cdot T \\cdot d_k \\\\
  \\text{MQA:} \\quad &Q_i \\text{ for } i = 1..h,\\ K, V \\text{ shared} \\qquad &\\text{K entries/layer: } 1 \\cdot T \\cdot d_k \\\\
  \\text{GQA:} \\quad &Q_i \\text{ for } i = 1..h,\\ K_g, V_g \\text{ for } g = 1..G \\qquad &\\text{K entries/layer: } G \\cdot T \\cdot d_k
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        (Doubling for both K and V, and multiplying by the number of layers{" "}
        <InlineMath>{"L"}</InlineMath>, recovers the full-model byte count from
        the cache-size formula above.)
      </p>

      <MHAvsMQAvsGQA />

      <p style={prose}>
        MQA came first; GQA interpolated <em>[5]</em>. Multi-query attention was
        originally proposed by Shazeer (2019) <em>[11]</em> as a memory optimization
        that traded a small quality drop for a much smaller KV cache. The technique
        worked for some tasks but cost noticeable quality on others — a single
        shared K and V proved too restrictive for capturing diverse positional and
        semantic relationships. Grouped-query attention (Ainslie et al. 2023) gave
        the field a way to interpolate: instead
        of <InlineMath>{"h"}</InlineMath> separate K/V projections (MHA) or 1 shared
        (MQA), use <InlineMath>{"G"}</InlineMath> groups where{" "}
        <InlineMath>{"h/G"}</InlineMath> Q-heads share each K/V projection.
        The original GQA paper showed quality almost matching MHA at the cost of
        MQA. Llama 2 <em>[8]</em> adopted GQA with 8 K/V groups for 64 Q-heads
        (in its 34B and 70B variants — the 7B and 13B variants use plain MHA);
        Llama 3, Mistral, and Gemini all followed.
      </p>

      <p style={prose}>
        Beyond GQA: latent attention. DeepSeek-V2 (2024) <em>[14]</em> introduced
        <em> Multi-head Latent Attention</em> (MLA), which compresses the K
        and V projections through a low-rank latent space before storing them in
        the cache, then decompresses at attention time. This reduces KV cache size
        by another order of magnitude beyond GQA while preserving most of MHA's
        quality. The pattern is clear: every architectural fork in modern LLMs is,
        in part, an effort to manage the KV cache. The model's compute pattern is
        shaped as much by inference memory constraints as by training-time quality
        concerns.
      </p>

      <p style={prose}>
        GQA, MQA, and MLA all attack the same axis — how much has to be stored
        per cached position. A complementary axis attacks how many positions get
        cached at all. <em>Sliding-window attention</em> (Mistral 7B, Jiang et al.
        2023 <em>[16]</em>) restricts each token to attending only over the last{" "}
        <InlineMath>{"w"}</InlineMath> positions instead of the full history,
        bounding the per-token cache to <InlineMath>{"\\mathcal{O}(w)"}</InlineMath>{" "}
        regardless of how long the sequence runs — Mistral 7B uses{" "}
        <InlineMath>{"w = 4096"}</InlineMath>. The catch is that naively dropping
        everything outside the window tends to collapse generation quality once a
        sequence runs past it; Xiao et al. (2023) <em>[17]</em> found that the
        first few tokens of a sequence absorb a disproportionate share of
        attention mass — <em>attention sinks</em> — and must be kept in the cache
        even under a sliding window, or quality degrades sharply. StreamingLLM
        keeps a small fixed set of sink tokens pinned in the cache alongside the
        sliding window, letting a model serve arbitrarily long streams at
        constant memory. Cache-size reduction (GQA/MQA/MLA) and cache-length
        reduction (sliding windows/sinks) are independent axes and are routinely
        combined in the same model.
      </p>

      <p style={prose}>
        Drag the h and G sliders below and watch the GQA column's KV-head bars
        merge into fewer, wider groups as G shrinks toward 1, while the memory
        footprint chart's GQA bar shrinks toward MQA's.
      </p>

      <AttentionVariants
        tryThis={{
          do: "Drag G down toward 1 while keeping h fixed.",
          notice: "The GQA column's KV bars merge into fewer, wider groups and the memory-footprint chart's GQA bar shrinks toward the MQA bar, converging exactly when G = 1.",
        }}
      />

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
        pairs rotate quickly (short wavelength, sensitive to fine-grained local
        position) — <InlineMath>{"\\theta_0 = \\text{base}^0 = 1"}</InlineMath>{" "}
        is the fastest-rotating pair; high-index pairs rotate slowly (long
        wavelength, sensitive to coarse-grained position) as{" "}
        <InlineMath>{"\\theta_i"}</InlineMath> shrinks toward 0. The model sees
        position as a
        <em> multi-scale</em> signal, similar in spirit to sinusoidal encoding but
        baked into the attention operation rather than added to the embedding.
      </p>

      <RoPEFrequencySpectrum />

      <p style={prose}>
        The frequency spectrum directly controls how far the model can reliably
        "see." If the longest wavelength (set by the slowest, highest-index
        pair) is shorter than the training context window, RoPE generalizes
        poorly beyond it. Llama 1 used{" "}
        <InlineMath>{"\\text{base} = 10000"}</InlineMath> for a 2K context window.
        Llama 3 (April 2024) raised{" "}
        <InlineMath>{"\\text{base} = 500000"}</InlineMath>, which slows down
        every frequency proportionally so each wavelength covers more positions —
        but that release still trained at an 8K context window. Reaching 128K
        came with Llama 3.1 (July 2024), which kept the same raised base but
        additionally applied an explicit NTK-aware rope-scaling transform on
        top of it, stretching the long-wavelength pairs further than the raised
        base alone would; the 128K window is the product of both changes together,
        not the base change in isolation. More sophisticated schemes (Position
        Interpolation <em>[20]</em>, NTK-aware scaling, YaRN <em>[21]</em>) interpolate or extrapolate the
        frequencies more selectively still, often
        allowing a model trained with an 8K context window to extend to a 128K one with minimal
        fine-tuning. RoPE's elegance is that all these tricks operate on a
        handful of hyperparameters — the base frequency and a scaling
        transform — rather than requiring architecture changes.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\begin{pmatrix} q'_{2i} \\\\ q'_{2i+1} \\end{pmatrix} &= \\begin{pmatrix} \\cos(m\\theta_i) & -\\sin(m\\theta_i) \\\\ \\sin(m\\theta_i) & \\cos(m\\theta_i) \\end{pmatrix} \\begin{pmatrix} q_{2i} \\\\ q_{2i+1} \\end{pmatrix} \\\\
  \\theta_i &= \\text{base}^{-2i/d}, \\quad \\text{base} = 10000 \\text{ (or } 500000 \\text{ for long-context)}
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        <InlineMath>{"m"}</InlineMath> and <InlineMath>{"n"}</InlineMath> are
        the query and key positions and <InlineMath>{"\\theta_i"}</InlineMath>{" "}
        the pair's rotation frequency from above. Drag the dimension-pair slider
        from <InlineMath>{"i=0"}</InlineMath> to <InlineMath>{"i=31"}</InlineMath>{" "}
        below and watch the rotation angle collapse toward zero, then switch the
        base selector from 10k to 500k and watch the whole frequency spectrum
        stretch so the longest wavelength covers far more positions.
      </p>

      <RoPE
        tryThis={{
          do: "Drag the dim-pair slider from i=0 to i=31, then switch base from 10k to 500k.",
          notice: "Low i rotates fast per step of m (short wavelength); high i barely moves (long wavelength). Raising the base stretches every wavelength, pushing the longest one further out without changing the relative-offset property.",
        }}
      />

      {/* ── Section 5: Mixture of Experts ─────────────────────────────────── */}
      <div id="mixture-of-experts">
        <SectionTitle>Mixture of Experts</SectionTitle>
      </div>

      <p style={prose}>
        A dense transformer layer applies the same FFN (feed-forward network)
        weights to every token.
        A mixture-of-experts (MoE) layer replaces the FFN with{" "}
        <InlineMath>{"E"}</InlineMath> expert networks and a learned router
        that activates only the top-<InlineMath>{"k"}</InlineMath> experts for each
        token. As a generic illustrative example — not any specific model's
        real configuration — take <InlineMath>{"k = 2"}</InlineMath> and{" "}
        <InlineMath>{"E = 64"}</InlineMath>: each token uses 2 expert FFNs
        rather than 1 — similar compute to a dense model — but the total parameter
        count is 32 times larger. More parameters means more capacity for knowledge
        storage without proportional training cost. Mixtral is openly MoE — though
        its actual configuration is smaller than the illustrative numbers above
        (8 experts, top-2; more on its real numbers below) — and GPT-4's and
        Gemini 1.5's architectures are suspected to be MoE as well. The
        architectural cost is communication overhead
        in distributed training and load imbalance: if most tokens route to the
        same few experts, capacity is wasted and training destabilizes. Auxiliary
        load-balancing losses prevent this collapse.
      </p>

      <p style={prose}>
        Dense models pay for every parameter on every forward pass. MoE models pay
        only for the active subset. Switch Transformer (Fedus et al. 2022) <em>[12]</em>{" "}
        — one of the canonical sparse models, building on the earlier GShard
        work of Lepikhin et al. (2021) <em>[13]</em> — demonstrated that you could
        scale total
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

      <p style={prose}>
        <InlineMath>{"G(x)"}</InlineMath> is the router's sparse gate over all{" "}
        <InlineMath>{"E"}</InlineMath> experts (nonzero only at the top-
        <InlineMath>{"k"}</InlineMath> entries), <InlineMath>{"G_i(x)"}</InlineMath>{" "}
        the resulting gate weight for a specific selected expert{" "}
        <InlineMath>{"i"}</InlineMath>, and <InlineMath>{"W_g"}</InlineMath> the
        router's own learned weight matrix that turns the token representation{" "}
        <InlineMath>{"x"}</InlineMath> into per-expert logits before top-k and
        softmax are applied. The diagram below uses a smaller{" "}
        <InlineMath>{"E = 8"}</InlineMath> expert pool purely for visual clarity,
        rather than the illustrative <InlineMath>{"E = 64"}</InlineMath> above.
      </p>

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

      <p style={prose}>
        Mixtral and Switch Transformer both route among a modest number of
        large experts — roughly a dozen or fewer full-size FFNs. DeepSeekMoE
        (Dai et al. 2024) <em>[15]</em>, and the DeepSeek-V2 <em>[14]</em>{" "}
        and DeepSeek-V3 models built on it, take <em>fine-grained</em>{" "}
        segmentation instead: chop the same total FFN capacity into hundreds
        of much smaller experts (DeepSeek-V3 routes among 256 routed experts,
        each a fraction the size of a Mixtral expert) and activate many more
        of them per token, letting the router combine narrow specialists
        instead of picking whole large blocks. DeepSeekMoE also adds a small
        number of <em>shared experts</em> that process every token
        unconditionally, alongside the sparsely-routed ones:
      </p>

      <MathBlock>{`$$y = \\sum_{s \\in \\text{shared}} \\text{FFN}_s(x) \\;+\\; \\sum_{i \\in \\text{TopK}(G(x), k)} G_i(x) \\cdot \\text{FFN}_i(x)$$`}</MathBlock>

      <p style={prose}>
        <InlineMath>{"s"}</InlineMath> ranges over the small, fixed set of
        always-on shared experts and <InlineMath>{"\\text{FFN}_s"}</InlineMath>{" "}
        is just that shared expert's feed-forward network; the second term is
        the same sparsely-gated top-<InlineMath>{"k"}</InlineMath> sum from the
        MathBlock above, so a token's output is simply the two added together.
      </p>

      <p style={prose}>
        The shared experts absorb common, cross-token knowledge so the
        routed experts can specialize more sharply on narrower patterns
        instead of each one re-deriving the same generic features. By
        mid-2020s this fine-grained-plus-shared-expert design, not the
        coarse-grained top-2-of-8 formulation above, is the dominant MoE
        recipe among frontier open-weight models. DeepSeek-V3 also retires the
        auxiliary load-balancing loss itself: rather than adding a loss term,
        it gives each expert a learned bias added to its routing score (but not
        to the gate weight used in the sum above) and nudges that bias up or
        down after every training step based on how overloaded or underloaded
        the expert has been recently — an auxiliary-loss-free way to steer
        tokens toward underused experts.
      </p>

      <p style={prose}>
        Click a few of the preset tokens below (or Process all 5) and watch
        the router bar chart light up its top-2 experts for each token while
        the utilization heatmap accumulates which experts get used most.
      </p>

      <MixtureOfExperts
        tryThis={{
          do: "Click through the 5 preset tokens (or Process all 5) and watch the router.",
          notice: "Each token lights up a different top-2 pair of experts in the bar chart, and the utilization heatmap accumulates unevenly — a few experts get used far more than others, which is exactly the load-imbalance problem the auxiliary loss is fighting.",
        }}
      />

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        Every technique in this chapter — KV caching, MQA/GQA/MLA, sliding
        windows and attention sinks, RoPE's frequency spectrum, MoE routing —
        is fighting the same underlying cost: a transformer's attention is{" "}
        <InlineMath>{"\\mathcal{O}(T^2)"}</InlineMath> and its KV cache is{" "}
        <InlineMath>{"\\mathcal{O}(T)"}</InlineMath>, so serving one gets more
        expensive with every token generated. A separate line of work — S4,
        Mamba, RWKV — replaces attention with a recurrent state-space update
        that carries a fixed-size hidden state instead of a growing cache,
        trading some of the transformer's in-context flexibility for
        constant per-step memory; hybrid designs (Jamba, Zamba, Griffin)
        interleave state-space and attention layers to get most of both.
        Chapter 17 covers state-space models and attention alternatives in
        depth. Within the transformer family itself, the RoPE mechanics,
        attention variants, and KV cache trade-offs built here are exactly
        the inference-cost constraints Chapter 14's deployment material
        assumes as given, and the dense-versus-sparse and attention-variant
        choices made here are inputs to the training and alignment pipeline
        Chapter 13 covers. Chapter 12 comes first, though — reinforcement
        learning, the mechanism that turns a pretrained model shaped by the
        architecture in this chapter into an aligned one.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
