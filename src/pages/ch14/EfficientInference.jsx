// SCAFFOLD — not yet wired into any route (see App.jsx and src/data/chapters.js,
// where this chapter is marked `live: false`). Built out fully in queue item
// N14 (context/V2_PLAN.md, Appendix C). Two sections already have real
// content moved in from other chapters during queue item S2 — Section 1's
// temperature material (from old ch07/new ch09 Attention) and Section 5's
// LoRA/PEFT material (from old ch04/new ch05 Training Techniques) — marked
// MOVED-FROM below. The other three sections are placeholders.
import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import LoRADecomposition from "../../components/widgets/ch14/LoRADecomposition";
import SoftmaxTemperature from "../../components/widgets/ch14/SoftmaxTemperature";
import LoRAMatrixShapes from "../../components/diagrams/ch14/LoRAMatrixShapes";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

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

const CITATIONS = [
  { num: 1, title: "LoRA: Low-Rank Adaptation of Large Language Models", authors: "Hu, Shen, Wallis, Allen-Zhu, Li, Wang, Chen", venue: "ICLR", year: "2022", tag: "seminal" },
  { num: 2, title: "QLoRA: Efficient Finetuning of Quantized LLMs", authors: "Dettmers, Pagnoni, Holtzman, Zettlemoyer", venue: "NeurIPS", year: "2023", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "decoding-and-sampling",   label: "Decoding & Sampling" },
  { id: "kv-cache-and-batching",   label: "KV Cache & Batching" },
  { id: "quantization",            label: "Quantization" },
  { id: "speculative-decoding",    label: "Speculative Decoding" },
  { id: "lora-and-peft",           label: "LoRA & PEFT" },
];

export default function EfficientInference() {
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
        Chapter 14 · Part III — Large Language Models
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
        Efficient Inference & Deployment
      </h1>

      <ChapterLede>
        A trained LLM is only useful once it runs cheaply, at scale, and can be
        adapted without retraining from scratch. This chapter covers how a model
        actually generates text token by token, how serving systems manage the
        memory and compute that costs, and how it gets adapted cheaply to new
        tasks with LoRA and PEFT.
      </ChapterLede>

      <p style={pending}>
        This chapter is in progress. It is not yet linked from the sidebar or
        reachable at a live URL — see queue item N14 in context/V2_PLAN.md for
        the full section-by-section spec.
      </p>

      {/* ── Section 1: Decoding & Sampling ───────────────────────────────── */}
      <div id="decoding-and-sampling">
        <SectionTitle>Decoding & Sampling</SectionTitle>
      </div>

      <p style={prose}>
        Greedy decoding, beam search, and sampling strategies (top-k, top-p,
        temperature) trade off determinism against diversity when turning a
        model's next-token distribution into actual text.
      </p>

      {/* MOVED-FROM ch09 (Attention), Section 4 "Softmax Temperature" —
          originally the closing section of the Attention chapter; it belongs
          here as the anchor for decoding strategy, not attention mechanics. */}
      <p style={prose}>
        Dividing logits by a scalar <InlineMath>{"T"}</InlineMath> before applying softmax controls the
        sharpness of the output distribution. As <InlineMath>{"T \\to 0"}</InlineMath> the distribution collapses
        toward argmax — hard attention, single winner. At <InlineMath>{"T = 1"}</InlineMath> it is the standard
        softmax. As <InlineMath>{"T \\to \\infty"}</InlineMath> it flattens toward uniform.
      </p>

      <MathBlock>{"$$\\text{softmax}(z/T)_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}$$"}</MathBlock>

      <p style={prose}>
        This is one of the most reused tricks in deep learning. In knowledge
        distillation (Hinton et al., 2015), a student is trained to match a
        teacher's softmax outputs at high <InlineMath>{"T"}</InlineMath>, which exposes the teacher's relative
        confidences across non-top classes — the so-called dark knowledge that a
        plain one-hot label cannot transmit. In language model sampling, <InlineMath>{"T"}</InlineMath>
        controls the trade-off between deterministic and creative generation:
        <InlineMath>{"T < 1"}</InlineMath> makes outputs sharper and more predictable, <InlineMath>{"T > 1"}</InlineMath> wilder. In
        contrastive learning — CLIP, SimCLR, and their descendants — the
        temperature on the contrastive softmax is a tuned hyperparameter that
        controls how strongly negatives are pushed away from the anchor.
      </p>

      <SoftmaxTemperature />

      <p style={pending}>
        Still to write: greedy vs. beam search, top-k / top-p (nucleus)
        sampling, and the <em>SamplingPlayground</em> widget (Appendix C, N14 §1).
      </p>

      {/* ── Section 2: KV Cache & Batching ───────────────────────────────── */}
      <div id="kv-cache-and-batching">
        <SectionTitle>The Memory Bill: KV Cache & Batching</SectionTitle>
      </div>

      <p style={pending}>
        Recaps the KV cache (Chapter 11) from a serving-cost angle and covers
        continuous batching / PagedAttention. Widget: <em>ServingSimulator</em>{" "}
        (Appendix C, N14 §2).
      </p>

      {/* ── Section 3: Quantization ───────────────────────────────────────── */}
      <div id="quantization">
        <SectionTitle>Quantization</SectionTitle>
      </div>

      <p style={pending}>
        INT8/FP8/GPTQ/AWQ intuition: outlier handling, per-channel scales,
        quality-vs-bits trade-offs. Widget: <em>QuantizationExplorer</em>{" "}
        (Appendix C, N14 §3).
      </p>

      {/* ── Section 4: Speculative Decoding ───────────────────────────────── */}
      <div id="speculative-decoding">
        <SectionTitle>Speculative Decoding</SectionTitle>
      </div>

      <p style={pending}>
        Draft-model-proposes / target-model-verifies decoding, and the
        acceptance-rate math behind its speedup. Widget: <em>SpeculativeRace</em>{" "}
        (Appendix C, N14 §4).
      </p>

      {/* ── Section 5: LoRA & PEFT ────────────────────────────────────────── */}
      <div id="lora-and-peft">
        <SectionTitle>Adapting Cheaply: LoRA & PEFT</SectionTitle>
      </div>

      {/* MOVED-FROM ch05 (Training Techniques), Section 5 "LoRA & Parameter-
          Efficient Fine-Tuning" — belongs with deployment/adaptation, not
          general training technique, now that this chapter exists. */}
      <p style={prose}>
        Fine-tuning all parameters of a large pretrained model is expensive and often
        unnecessary. LoRA freezes the original weights <InlineMath>{"W_0"}</InlineMath> and learns a low-rank
        perturbation <InlineMath>{"\\Delta W = BA"}</InlineMath>, where <InlineMath>{"r \\ll \\min(d, k)"}</InlineMath>. At rank <InlineMath>{"r=8"}</InlineMath>, a 7B-parameter model
        can be adapted with under 0.1% additional parameters. QLoRA combines this with
        4-bit quantization for even greater efficiency.
      </p>

      <MathBlock>{"$$h = W_0 x + \\Delta W x = W_0 x + BAx \\quad\\text{where}\\quad B \\in \\mathbb{R}^{d \\times r},\\ A \\in \\mathbb{R}^{r \\times k},\\ r \\ll \\min(d, k)$$"}</MathBlock>

      <LoRAMatrixShapes />

      <p style={prose}>
        Hu et al. (2022) [1] start from an empirical observation: when you fine-tune
        a large pretrained model, the matrix of weight changes <InlineMath>{"\\Delta W"}</InlineMath> tends to have very
        low intrinsic rank — often a rank of 8 or 16 captures nearly all of the
        update signal. LoRA exploits this directly: freeze the pretrained <InlineMath>{"W_0"}</InlineMath> and
        parameterize the update as <InlineMath>{"\\Delta W = BA"}</InlineMath>, with <InlineMath>{"B \\in \\mathbb{R}^{d \\times r}"}</InlineMath>, <InlineMath>{"A \\in \\mathbb{R}^{r \\times k}"}</InlineMath>, and
        <InlineMath>{"r \\ll \\min(d, k)"}</InlineMath>. Only <InlineMath>{"B"}</InlineMath> and <InlineMath>{"A"}</InlineMath> are trained. For a 7B-parameter model,
        fine-tuning at rank 8 adds well under 0.1% additional trainable parameters.
        At inference time, <InlineMath>{"BA"}</InlineMath> can be folded back into <InlineMath>{"W_0 + BA"}</InlineMath> so there is no latency
        cost.
      </p>

      <p style={prose}>
        QLoRA [2] (Dettmers, Pagnoni, Holtzman & Zettlemoyer 2023) pushed this
        further by quantizing the frozen <InlineMath>{"W_0"}</InlineMath> to 4 bits while keeping the LoRA
        adapters in higher precision. The frozen weights take a fraction of the
        memory; the trainable adapters fit comfortably alongside. QLoRA made it
        possible to fine-tune a 65B-parameter model on a single 48GB GPU — a
        configuration that would otherwise need a multi-GPU setup. The technique is
        the de facto standard for fine-tuning open-source LLMs today.
      </p>

      <LoRADecomposition />

      <p style={pending}>
        Still to write: the <em>LoRARankExplorer</em> widget (rank slider vs.
        reconstruction quality) and a Retrieval & Grounding subsection
        cross-referencing Chapter 24's memory framing (Appendix C, N14 §5).
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
