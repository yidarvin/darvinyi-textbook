import { useTocSections } from "../../components/layout/TocRail";
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
  { title: "Scaling Laws for Neural Language Models", authors: "Kaplan, McCandlish, Henighan et al.", venue: "arXiv", year: "2020", tag: "paper" },
  "roformer",
]);

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
        before each sub-layer (Pre-LN, analyzed in detail by Xiong et al. 2020)
        rather than after (Post-LN as in the original transformer [1]), which
        improves gradient flow in very deep models. The residual connections
        create a persistent information highway that makes the blocks easier to
        train and lets the network dynamically choose how much each layer
        contributes.
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
        4096 for a 1024-dim model, 16384 for LLaMA-7B. This is where most of a
        transformer's parameters live: roughly two-thirds of the parameter count
        in a typical block is in the FFN, not the attention. The original
        transformer used ReLU; modern LLMs use GELU (BERT, GPT-2/3) or SwiGLU
        (Llama, PaLM, Mistral). The exact nonlinearity matters less than getting
        the dimensions right.
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

      <TransformerBlock />

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
        Between the original sinusoidal idea and modern rotary embeddings sits
        the most pragmatic alternative: just train an embedding lookup table
        indexed by position. BERT [2] and GPT-2 do exactly this — they allocate
        a separate learned vector for positions 0 through 511 (or 1023) and add
        it to the token embedding. Learned embeddings work well in practice but
        have one fatal limitation: they cannot generalize to positions beyond
        the maximum seen at training time. A model trained at 1024 tokens has no
        embedding for position 1024 — extension requires either retraining or
        interpolation, neither of which is free.
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
        major open-source LLM since 2023. ALiBi (Press, Smith & Lewis 2022) is
        the other widely-used relative-position scheme, used in BLOOM and MPT.
        Chapter 11 covers RoPE's frequency spectrum and long-context extension
        in depth.
      </p>

      <RoPEMechanism />

      <PositionalEncoding />

      {/* ── Section 3: The Residual Stream ───────────────────────────────── */}
      <div id="the-residual-stream">
        <SectionTitle>The Residual Stream</SectionTitle>
      </div>

      <p style={prose}>
        From the mechanistic interpretability perspective, each transformer
        block reads from and writes to a shared residual stream — the running
        sum of all previous layer contributions. Attention heads extract Q, K, V
        from the stream and write their output back via a residual addition.
        Feed-forward layers do the same. The final token representation is the
        accumulated sum of the initial embedding plus every attention and FFN
        contribution across all layers — this additive structure means each
        layer can be understood as a refinement rather than a transformation.
      </p>

      <MathBlock>{"$$x_{\\ell+1} = x_{\\ell} + \\sum_{h} \\text{Attn}_h^{(\\ell)}(x_{\\ell}) + \\text{FFN}^{(\\ell)}(x_{\\ell})$$"}</MathBlock>

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
        et al. 2021) gave this view its sharpest formulation: each attention
        head and each FFN can be decomposed into a <em>read</em> operation (a
        learned linear projection of the current residual stream) followed by a{" "}
        <em>write</em> operation (a learned linear projection back into the
        stream, added as a delta). This means each component "communicates" with
        every other component only through the residual stream's vector basis.
        Mechanistic interpretability has used this framework to find concrete
        computational circuits — induction heads (Olsson et al. 2022) that
        implement in-context learning, indirect-object-identification circuits
        (Wang et al. 2022), and others — by tracing what each head reads and
        writes.
      </p>

      <ResidualStreamHighway />

      <ResidualStream />

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
        capabilities at scale (Wei et al. 2022) seemed at odds with the smooth
        underlying loss curves.
      </p>

      <MathBlock>{"$$L(N, D) \\approx \\left(\\frac{N_c}{N}\\right)^{\\alpha_N} + \\left(\\frac{D_c}{D}\\right)^{\\alpha_D}$$"}</MathBlock>

      <p style={prose}>
        Kaplan, McCandlish, Henighan et al. (2020) [5] ran the first systematic
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
        inference cost favors smaller models trained longer.
      </p>

      <ScalingLawCurves />

      <ScalingLaws />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
