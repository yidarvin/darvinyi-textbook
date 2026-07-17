import { useTocSections } from "../../components/layout/TocContext";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import TransformerBlock from "../../components/widgets/ch10/TransformerBlock";
import PositionalEncoding from "../../components/widgets/ch10/PositionalEncoding";
import ResidualStream from "../../components/widgets/ch10/ResidualStream";
import ScalingLaws from "../../components/widgets/ch10/ScalingLaws";
import EncoderDecoderTaxonomy from "../../components/diagrams/ch10/EncoderDecoderTaxonomy";
import RoPEMechanism from "../../components/diagrams/ch10/RoPEMechanism";
import ResidualStreamHighway from "../../components/diagrams/ch10/ResidualStreamHighway";
import ScalingLawCurves from "../../components/diagrams/ch10/ScalingLawCurves";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = buildCitations([
  "attention-is-all-you-need",
  "bert",
  "gpt3",
  { title: "Training Compute-Optimal Large Language Models (Chinchilla)", authors: "Hoffmann et al.", venue: "NeurIPS", year: "2022", tag: "paper" },
  { title: "Scaling Laws for Neural Language Models", authors: "Kaplan et al.", venue: "arXiv", year: "2020", tag: "paper" },
  "roformer",
  { title: "On Layer Normalization in the Transformer Architecture", authors: "Xiong, Yang, He, Zheng, Zheng, Xing, Zhang, Lan, Wang, Liu", venue: "ICML", year: "2020", tag: "paper" },
  { title: "YaRN: Efficient Context Window Extension of Large Language Models", authors: "Peng, Quesnelle, Fan, Shippole", venue: "ICLR", year: "2024", tag: "paper" },
  { title: "Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation", authors: "Press, Smith, Lewis", venue: "ICLR", year: "2022", tag: "paper" },
  { title: "A Mathematical Framework for Transformer Circuits", authors: "Elhage, Nanda, Olsson et al.", venue: "Transformer Circuits Thread", year: "2021", tag: "paper" },
  { title: "In-context Learning and Induction Heads", authors: "Olsson, Elhage, Nanda et al.", venue: "Transformer Circuits Thread", year: "2022", tag: "paper" },
  { title: "Interpretability in the Wild: a Circuit for Indirect Object Identification in GPT-2 small", authors: "Wang, Variengien, Conmy, Shlegeris, Steinhardt", venue: "ICLR", year: "2023", tag: "paper" },
  { title: "Emergent Abilities of Large Language Models", authors: "Wei et al.", venue: "TMLR", year: "2022", tag: "paper" },
  { title: "Are Emergent Abilities of Large Language Models a Mirage?", authors: "Schaeffer, Miranda, Koyejo", venue: "NeurIPS", year: "2023", tag: "paper" },
  { title: "Extending Context Window of Large Language Models via Positional Interpolation", authors: "Chen, Wong, Chen, Tian", venue: "arXiv", year: "2023", tag: "paper" },
  { title: "Gaussian Error Linear Units (GELUs)", authors: "Hendrycks, Gimpel", venue: "arXiv", year: "2016", tag: "paper" },
  { title: "GLU Variants Improve Transformer", authors: "Shazeer", venue: "arXiv", year: "2020", tag: "paper" },
]);

const TOC_SECTIONS = [
  { id: "transformer-block-anatomy",   label: "Block Anatomy" },
  { id: "assembling-the-full-model",   label: "Full-Model Assembly" },
  { id: "positional-encoding",         label: "Positional Encoding" },
  { id: "the-residual-stream",         label: "Residual Stream" },
  { id: "scaling-laws",                label: "Scaling Laws" },
];

export default function Transformers() {
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
        Chapter 10 · Part II — Language & Sequence
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
        Transformers
      </h1>

      <ChapterLede>
        The transformer abandoned recurrence entirely — and in doing so became the
        dominant architecture across language, vision, audio, and scientific computing.
        Its core insight is that attention over all positions simultaneously, combined
        with position encodings and residual stacks, is sufficient to learn arbitrarily
        complex sequence relationships without any notion of order built into the
        architecture itself. This chapter takes that block apart piece by piece, then
        reassembles it into the full stack that scales — with only a handful of design
        choices changed along the way — from a few million parameters to hundreds of
        billions.
      </ChapterLede>

      {/* ── Section 1: Transformer Block Anatomy ─────────────────────────── */}
      <div id="transformer-block-anatomy">
        <SectionTitle>Transformer Block Anatomy</SectionTitle>
      </div>

      <p style={prose}>
        Each transformer block applies two sub-layers with residual connections:
        multi-head self-attention and a position-wise feed-forward network.
        Layer normalization stabilizes training — modern implementations apply it
        before each sub-layer (Pre-LN, analyzed in detail by Xiong et al. 2020 [7])
        rather than after (Post-LN as in the original transformer [1]), which
        improves gradient flow in very deep models. Many current LLMs (Llama,
        Mistral, Gemma, Qwen) replace LayerNorm with RMSNorm, which drops the
        mean-centering step and rescales activations only by their root-mean-square
        magnitude — see Chapter 5 for the normalization-variant comparison. The
        residual connections create a persistent information highway that makes
        the blocks easier to train and lets the network dynamically choose how
        much each layer contributes.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  x &\\leftarrow x + \\text{MHA}\\bigl(\\text{LN}(x)\\bigr) \\\\
  x &\\leftarrow x + \\text{FFN}\\bigl(\\text{LN}(x)\\bigr)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        The "position-wise feed-forward network" sounds elaborate but is just two
        linear layers with a nonlinearity between them, applied independently to
        each token:{" "}
        <InlineMath>{"\\text{FFN}(x) = \\sigma(x W_1 + b_1) W_2 + b_2"}</InlineMath>.
        The hidden dimension is conventionally{" "}
        <InlineMath>{"4 \\times d_{\\text{model}}"}</InlineMath> —
        4096 for a 1024-dim model, and roughly 11008 for LLaMA-7B's 4096-dim
        stream (SwiGLU scales the hidden dimension to about{" "}
        <InlineMath>{"8/3 \\times d_{\\text{model}}"}</InlineMath> rather than a
        plain 4×, so its extra gating matrix keeps total FFN parameter count
        comparable to a plain-4× design). This is where most of a transformer's
        parameters live: roughly two-thirds of the parameter count in a typical
        block is in the FFN, not the attention. The original transformer used
        ReLU; modern LLMs use GELU [16] (Gaussian Error Linear Unit, a smooth
        ReLU-like nonlinearity; BERT, GPT-2/3) or SwiGLU [17] (a gated linear
        unit built on the Swish/SiLU activation; Llama, PaLM, Mistral). The
        exact nonlinearity matters less than getting the dimensions right.
      </p>

      <p style={prose}>
        The same building block — Pre-LN → multi-head attention → +residual →
        Pre-LN → FFN → +residual — is reused across three distinct architectures
        that handle attention differently. <strong>Encoder-only</strong> models
        [2] (BERT, RoBERTa, ELECTRA) use bidirectional attention, every token
        sees every other token, trained with masked language modeling.{" "}
        <strong>Decoder-only</strong> models [3] (GPT family, Llama, Claude) use
        causal masking — each token attends only to itself and earlier positions
        — and are trained with next-token prediction.{" "}
        <strong>Encoder-decoder</strong> models [1] (original transformer, T5,
        BART) pair a bidirectional encoder with an autoregressive decoder
        connected via cross-attention. The decoder-only design has won the LLM
        era almost entirely — it is simpler, scales better, and has proven
        adequate for tasks that traditionally needed an encoder.
      </p>

      <EncoderDecoderTaxonomy />

      <p style={prose}>
        Step through the seven-stage anatomy of a single block below,
        toggling between Pre-LN and Post-LN as you go; notice how the
        toggle moves where each layer norm sits relative to the residual
        add without changing what either sub-layer actually computes.
      </p>

      <TransformerBlock
        tryThis={{
          do: "Switch from Pre-LN to Post-LN and step through all seven stages again.",
          notice: "The residual add moves from after the layer norm (Pre-LN) to before it (Post-LN) — the same two sub-layers, just a different point in the stream where each one reads and writes.",
        }}
      />

      {/* ── Section 1.5: Assembling the Full Model ───────────────────────── */}
      <div id="assembling-the-full-model">
        <SectionTitle>Assembling the Full Model</SectionTitle>
      </div>

      <p style={prose}>
        Stack <InlineMath>{"L"}</InlineMath> copies of the block above and
        the transformer becomes a language model. Token embeddings — the
        same lookup table Chapter 7 introduces, now indexed by subword
        token — enter the first block already carrying positional
        information; every block after that reads the residual stream,
        writes its attention and FFN contributions back into it, and hands
        the unchanged-in-shape result to the next block. After the last
        block, a final normalization layer (LayerNorm or RMSNorm) settles
        the stream one last time, and an <em>unembedding</em> matrix
        projects the <InlineMath>{"d_{\\text{model}}"}</InlineMath>-dimensional
        vector at each position up to a vocabulary-sized vector of{" "}
        <em>logits</em> — the raw, pre-softmax scores over every token in
        the vocabulary. Many implementations tie the unembedding matrix to
        the input embedding matrix (<em>weight tying</em>), reusing one
        learned matrix for both directions and roughly halving the
        parameter count of the two largest matrices in the model at
        essentially no cost in quality.
      </p>

      <MathBlock>{"$$\\hat{y}_t = \\text{softmax}\\bigl(x_t^{(L)} W_U\\bigr), \\qquad \\mathcal{L}_{\\text{CE}} = \\text{CE}\\bigl(x_{t+1},\\, \\hat{y}_t\\bigr)$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"x_t^{(L)}"}</InlineMath> is the residual stream's
        value at position <InlineMath>{"t"}</InlineMath> after the final,{" "}
        <InlineMath>{"L"}</InlineMath>-th block, <InlineMath>{"W_U"}</InlineMath>{" "}
        is the unembedding matrix, softmax turns the resulting logits into
        a probability distribution over the vocabulary, and cross-entropy
        (Chapter 1) compares that distribution, <InlineMath>{"\\hat{y}_t"}</InlineMath>,
        against <InlineMath>{"x_{t+1}"}</InlineMath> — the token that
        actually came next. Summed over every position in every sequence
        in a batch, this is the loss the model's weights are trained to
        minimize.
      </p>

      <p style={prose}>
        This is also where causal masking earns its keep across the whole
        stack, not just one attention layer. Every decoder block's
        attention sub-layer adds the same mask from Chapter 9 to its own
        scores —{" "}
        <InlineMath>{"\\text{softmax}(QK^\\top/\\sqrt{d_k} + M)V"}</InlineMath>,
        with <InlineMath>{"M_{ij} = -\\infty"}</InlineMath> whenever key
        position <InlineMath>{"j"}</InlineMath> is later than query
        position <InlineMath>{"i"}</InlineMath> — at every layer, so a
        token's slice of the residual stream never mixes in information
        from a later position, no matter how many blocks deep it travels.
        Because the mask is the only thing standing between "every
        position attends to every position" and "each position attends
        only to the past," an entire training sequence can be scored —
        every position's loss computed — in one parallel forward pass,
        while generation still has to proceed one token at a time: the
        token at position <InlineMath>{"t+1"}</InlineMath> does not exist
        until position <InlineMath>{"t"}</InlineMath> has actually been
        sampled. Chapter 11's KV cache section depends on exactly this
        asymmetry — caching only works because a past position's keys and
        values never change once computed.
      </p>

      {/* ── Section 2: Positional Encoding ───────────────────────────────── */}
      <div id="positional-encoding">
        <SectionTitle>Positional Encoding</SectionTitle>
      </div>

      <p style={prose}>
        Self-attention is permutation-equivariant — it treats its input as a set,
        not a sequence. Positional encodings break this symmetry by adding
        position-dependent signals to each token embedding before it enters the
        transformer. The original transformer [1] used <em>sinusoidal</em>{" "}
        encodings: sine and cosine functions at different frequencies across the
        embedding dimensions, giving each position a unique fingerprint that the
        model can learn to read. Because the frequencies span many octaves, both
        coarse and fine positional structure is encoded simultaneously.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  PE(\\text{pos},\\, 2i) &= \\sin\\!\\bigl(\\text{pos} / 10000^{2i/d}\\bigr) \\\\
  PE(\\text{pos},\\, 2i+1) &= \\cos\\!\\bigl(\\text{pos} / 10000^{2i/d}\\bigr)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        A concrete instance: for a toy model with{" "}
        <InlineMath>{"d_{\\text{model}} = 4"}</InlineMath> and{" "}
        <InlineMath>{"\\text{pos} = 2"}</InlineMath>, the two frequency bands
        (<InlineMath>{"i = 0"}</InlineMath> and <InlineMath>{"i = 1"}</InlineMath>)
        give{" "}
        <InlineMath>
          {"PE(2) = [\\sin(2/1),\\ \\cos(2/1),\\ \\sin(2/100),\\ \\cos(2/100)] \\approx [0.909,\\ -0.416,\\ 0.020,\\ 0.9998]"}
        </InlineMath>
        . The first pair (dividing by <InlineMath>{"10000^0 = 1"}</InlineMath>)
        oscillates quickly across positions and encodes fine-grained order;
        the second pair (dividing by{" "}
        <InlineMath>{"10000^{0.5} = 100"}</InlineMath>) barely moves between
        adjacent positions and encodes coarse, long-range position instead.
      </p>

      <p style={prose}>
        Between the original sinusoidal idea and modern rotary embeddings sits
        the most pragmatic alternative: just train an embedding lookup table
        indexed by position. BERT [2] and GPT-2 do exactly this — they allocate
        a separate learned vector for positions 0 through 511 (or 1023) and add
        it to the token embedding. Learned embeddings work well in practice but
        have one fatal limitation: they cannot generalize to positions beyond
        the maximum seen at training time. A model trained at 1024 tokens has no
        embedding for position 1024 — extension requires either retraining or
        interpolation, neither of which is free. Models built on RoPE (Rotary
        Position Embedding — it rotates query/key features by an angle
        proportional to position, detailed just below) hit the same wall but
        have a practical escape hatch: techniques named Position Interpolation
        (Chen et al. 2023) [15] and YaRN (Peng et al. 2024) [8] rescale the
        rotation frequencies so a model trained at, say, 4K tokens can be
        adapted to 32K tokens or more without training from scratch.
      </p>

      <p style={prose}>
        Rotary Position Embedding [6] takes a different approach: instead of{" "}
        <em>adding</em> a position signal to the token embedding, it{" "}
        <em>rotates</em> pairs of features in the query and key vectors by an
        angle proportional to position, so that the dot product between a
        query at position <InlineMath>m</InlineMath> and a key at position{" "}
        <InlineMath>n</InlineMath> depends only on the <em>relative</em> offset{" "}
        <InlineMath>{"m - n"}</InlineMath>, never the absolute positions. RoPE
        generalizes naturally to longer sequences than seen at training and is
        now used in Llama, Mistral, Qwen, Gemma, and Phi — essentially every
        major open-source LLM since 2023. ALiBi (Press et al. 2022) [9] is
        the other widely-used relative-position scheme, used in BLOOM and MPT.
        Chapter 11 covers RoPE's frequency spectrum and long-context extension
        in depth.
      </p>

      <RoPEMechanism />

      <p style={prose}>
        The widget below computes the real sinusoidal table, not a canned
        example; switch to the 1D Slice view and drag the position slider
        while comparing the two ends of the dimension axis. Notice how the
        neighboring-position curves (dashed) diverge sharply at low-index
        dimensions but nearly overlap at high-index ones — the
        fast-oscillating dimensions carry fine-grained position
        information, the slow ones carry coarse, long-range position
        instead.
      </p>

      <PositionalEncoding
        tryThis={{
          do: "Switch to 1D Slice view and drag the position slider while watching low vs. high dimension indices.",
          notice: "The neighboring-position curves (dashed) diverge sharply on the left (fast-oscillating, low-index dimensions) but nearly overlap on the right (slow-oscillating, high-index dimensions) — both fine and coarse position information are encoded at once.",
        }}
      />

      {/* ── Section 3: The Residual Stream ───────────────────────────────── */}
      <div id="the-residual-stream">
        <SectionTitle>The Residual Stream</SectionTitle>
      </div>

      <p style={prose}>
        From the mechanistic interpretability perspective, each transformer
        block reads from and writes to a shared residual stream — the running
        sum of all previous layer contributions. Attention heads extract Q, K, V
        from the stream and write their output back via a residual addition;
        the feed-forward layer then reads that updated stream in turn and
        writes its own contribution back on top of it. The final token
        representation is the accumulated sum of the initial embedding plus
        every attention and FFN contribution across all layers — this
        additive structure means each layer can be understood as a
        refinement rather than a transformation.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  x_{\\ell + \\frac{1}{2}} &= x_{\\ell} + \\sum_{h} \\text{Attn}_h^{(\\ell)}(x_{\\ell}) \\\\
  x_{\\ell + 1} &= x_{\\ell + \\frac{1}{2}} + \\text{FFN}^{(\\ell)}\\bigl(x_{\\ell + \\frac{1}{2}}\\bigr)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\ell"}</InlineMath> indexes the block and{" "}
        <InlineMath>{"h"}</InlineMath> indexes attention heads; the half-step{" "}
        <InlineMath>{"x_{\\ell + 1/2}"}</InlineMath> is the stream immediately
        after attention has added its contribution and before the FFN reads
        it — the same two sequential sub-layer updates from Section 1,
        written here as they act on the shared stream one block at a time.
      </p>

      <p style={prose}>
        The residual stream is a vector of dimension{" "}
        <InlineMath>{"d_{\\text{model}}"}</InlineMath> that flows from the input embedding
        all the way to the output unembedding, accumulating contributions at
        every block. Concrete numbers: 512 in the original transformer, 768 in
        BERT-base, 1600 in GPT-2-XL, 4096 in LLaMA-7B, 12288 in GPT-3-175B. The
        entire computational power of the model funnels through this single
        shared vector — every attention head, every FFN, every layer reads from
        it and writes to it. The width of the residual stream is one of the
        most consequential scaling choices, since it bounds the amount of
        parallel information any single layer can write.
      </p>

      <p style={prose}>
        Anthropic's "A Mathematical Framework for Transformer Circuits" (Elhage
        et al. 2021) [10] gave this view its sharpest formulation: each attention
        head and each FFN can be decomposed into a <em>read</em> operation (a
        learned linear projection of the current residual stream) followed by a{" "}
        <em>write</em> operation (a learned linear projection back into the
        stream, added as a delta). This means each component "communicates" with
        every other component only through the residual stream's vector basis.
        Mechanistic interpretability has used this framework to find concrete
        computational circuits — induction heads (Olsson et al. 2022) [11] that
        implement in-context learning, indirect-object-identification circuits
        (Wang et al. 2023) [12], and others — by tracing what each head reads and
        writes.
      </p>

      <ResidualStreamHighway />

      <p style={prose}>
        Switch between the four tokens below and watch the bars update;
        notice that the cumulative-norm line (white) only ever climbs —
        every block's attention and FFN contribution adds onto the stream,
        it never overwrites what earlier blocks already wrote.
      </p>

      <ResidualStream
        tryThis={{
          do: "Switch between the four tokens and toggle Normalize on.",
          notice: "The cumulative stream norm only grows, never shrinks — confirming the additive, never-overwriting structure the equation above describes.",
        }}
      />

      {/* ── Section 4: Scaling Laws ───────────────────────────────────────── */}
      <div id="scaling-laws">
        <SectionTitle>Scaling Laws</SectionTitle>
      </div>

      <p style={prose}>
        Neural language model performance improves as a smooth power law in
        compute, dataset size, and parameter count. Within a wide regime, the
        loss curve is monotonic and predictable from small-scale experiments — a
        property that allows AI labs to plan a 100B-parameter training run by
        extrapolating from 1B-parameter runs. This regularity is also part of
        what surprised the community most, because the abrupt appearance of new
        capabilities at scale (Wei et al. 2022) [13] seemed at odds with the
        smooth underlying loss curves. Schaeffer et al. (2023) [14] pushed
        back: score the same capability with a smooth metric — such as
        token-level log-likelihood — instead of exact-match accuracy, and
        performance on many supposedly emergent tasks turns out to improve
        gradually after all. Whether any emergent abilities reflect a genuine
        phase transition in the underlying computation, rather than an
        artifact of the metric used to look for one, remains an open and
        actively debated question.
      </p>

      <MathBlock>{"$$L(N, D) \\approx \\left(\\frac{N_c}{N}\\right)^{\\alpha_N} + \\left(\\frac{D_c}{D}\\right)^{\\alpha_D}$$"}</MathBlock>

      <p style={prose}>
        Kaplan et al. (2020) [5] ran the first systematic
        study of how language model loss depends on model size{" "}
        <InlineMath>N</InlineMath>, dataset size <InlineMath>D</InlineMath>, and
        training compute <InlineMath>C</InlineMath>. Their finding: each
        dependence is a clean power law over many orders of magnitude. Double
        the model size and (under the right conditions) the loss decreases by a
        predictable amount. The empirical fit looks like the equation above,
        with both exponents around 0.07–0.1. Their analysis suggested that for
        a fixed compute budget the right thing to do was to scale model size
        much faster than dataset size — and most pre-2022 LLMs (GPT-3 at 175B
        parameters and only ~300B tokens) were trained accordingly.
      </p>

      <p style={prose}>
        Hoffmann et al. (2022) [4] re-ran Kaplan's analysis with a key
        methodological fix: they retuned the learning rate at each scale,
        instead of using a single learning rate for all sizes as Kaplan did. The
        recomputed law was strikingly different.{" "}
        <strong>
          Compute-optimal training requires model size and dataset size to scale
          roughly equally.
        </strong>{" "}
        A 70B-parameter model needs roughly 1.4 trillion tokens to be
        compute-optimal — a 20-tokens-per-parameter ratio. By this standard,
        most pre-2022 LLMs were dramatically undertrained. Chinchilla itself was
        a 70B-parameter model trained on 1.4T tokens that outperformed GPT-3
        despite being less than half the size. Every major LLM trained after
        2022 takes the Chinchilla finding seriously, and many — including
        Llama 3 — train on far more tokens than even Chinchilla-optimal, because
        inference cost favors smaller models trained longer. This is only the
        surface: Part III returns to scaling laws when it covers how frontier
        labs actually choose model size, data composition, and training
        budgets (Chapter 13), and how architectural choices interact with
        compute-optimal scaling (Chapter 11).
      </p>

      <ScalingLawCurves />

      <p style={prose}>
        Drag the compute-budget slider below with the real-model overlay and
        optimal-point marker both on; notice how the predicted
        tokens-per-parameter ratio shifts as compute grows, and how the
        historical models don't always sit exactly on the curve for their
        own compute budget — a reminder that "compute-optimal" is a moving,
        model-dependent target, not a single fixed ratio.
      </p>

      <ScalingLaws
        tryThis={{
          do: "Drag the compute slider from small to frontier scale with 'Show real models' and 'Show optimal point' both on.",
          notice: "The predicted tokens-per-parameter ratio shifts with the compute budget, and the historical-model dots don't always land on the curve — a reminder that the compute-optimal frontier is a moving target, not a single fixed number.",
        }}
      />

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        What carries forward is the block itself: Pre-LN, multi-head
        attention, and a feed-forward sub-layer, each wrapped in its own
        residual connection, stacked <InlineMath>{"L"}</InlineMath> times
        and read out through one shared residual stream that runs from the
        input embedding to the final logits. Positional information is no
        longer a single object bolted onto the input once — RoPE (and the
        schemes built on it) inject it fresh into every attention
        computation as a per-layer, relative rotation rather than an
        absolute label. The scaling-law relationship between model size,
        data, and compute is now something every frontier lab treats as a
        planning input rather than a curiosity, even as exactly what
        "optimal" means keeps getting revised. Chapter 11 takes this same
        block apart one more time and rebuilds it the way current
        production LLMs actually run it — deeper RoPE mechanics,
        grouped-query and multi-query attention, the KV cache, and
        mixture-of-experts routing.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
