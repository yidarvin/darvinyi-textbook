import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import NormalizationComparison from "../../components/widgets/ch04/NormalizationComparison";
import DropoutVisualizer from "../../components/widgets/ch04/DropoutVisualizer";
import InitializationExplorer from "../../components/widgets/ch04/InitializationExplorer";
import KnowledgeDistillation from "../../components/widgets/ch04/KnowledgeDistillation";
import LoRADecomposition from "../../components/widgets/ch04/LoRADecomposition";
import GradientClipping from "../../components/widgets/ch04/GradientClipping";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift", authors: "Ioffe & Szegedy", venue: "ICML", year: "2015", tag: "seminal" },
  { num: "[2]", title: "Layer Normalization", authors: "Ba, Kiros, Hinton", venue: "arXiv", year: "2016", tag: "paper" },
  { num: "[3]", title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting", authors: "Srivastava, Hinton, Krizhevsky, Sutskever, Salakhutdinov", venue: "JMLR", year: "2014", tag: "seminal" },
  { num: "[4]", title: "Understanding the Difficulty of Training Deep Feedforward Neural Networks", authors: "Glorot & Bengio", venue: "AISTATS", year: "2010", tag: "seminal" },
  { num: "[5]", title: "Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet", authors: "He, Zhang, Ren, Sun", venue: "ICCV", year: "2015", tag: "paper" },
  { num: "[6]", title: "Distilling the Knowledge in a Neural Network", authors: "Hinton, Vinyals, Dean", venue: "NeurIPS Workshop", year: "2015", tag: "seminal" },
  { num: "[7]", title: "LoRA: Low-Rank Adaptation of Large Language Models", authors: "Hu, Shen, Wallis, Allen-Zhu, Li, Wang, Chen", venue: "ICLR", year: "2022", tag: "seminal" },
  { num: "[8]", title: "QLoRA: Efficient Finetuning of Quantized LLMs", authors: "Dettmers, Pagnoni, Holtzman, Zettlemoyer", venue: "NeurIPS", year: "2023", tag: "paper" },
  { num: "[9]", title: "MixUp: Beyond Empirical Risk Minimization", authors: "Zhang, Cisse, Dauphin, Lopez-Paz", venue: "ICLR", year: "2018", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "normalization",          label: "Normalization" },
  { id: "dropout-regularization", label: "Dropout" },
  { id: "weight-initialization",  label: "Initialization" },
  { id: "knowledge-distillation", label: "Distillation" },
  { id: "lora-peft",              label: "LoRA & PEFT" },
  { id: "gradient-clipping",      label: "Gradient Clipping" },
];

export default function TrainingTechniques() {
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
        Chapter 04 · Part I — Foundations
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
        Training Techniques
      </h1>

      <ChapterLede>
        The difference between a model that trains stably and one that diverges is
        rarely the architecture. It is the normalization strategy, initialization
        scheme, and regularization choices — engineering decisions that compound
        across every layer and every step.
      </ChapterLede>

      {/* ── Section 1: Normalization ─────────────────────────────────────── */}
      <div id="normalization">
        <SectionTitle>Normalization</SectionTitle>
      </div>

      <p style={prose}>
        Batch Normalization normalizes activations across the batch dimension,
        stabilizing training by reducing internal covariate shift. Layer Normalization
        normalizes across features within a single example, making it batch-size
        independent and the standard choice in transformers. Group and Instance Norm
        occupy the space between, normalizing over subsets of channels.
      </p>

      <MathBlock>{"BatchNorm:  x̂ᵢ = (xᵢ − μ_B) / √(σ²_B + ε)    y = γx̂ + β"}</MathBlock>

      <NormalizationComparison />

      {/* ── Section 2: Dropout & Regularization ─────────────────────────── */}
      <div id="dropout-regularization">
        <SectionTitle>Dropout & Regularization</SectionTitle>
      </div>

      <p style={prose}>
        Dropout randomly zeros a fraction p of neurons during training, forcing the
        network to learn redundant representations. At inference, all neurons are
        active but their outputs are scaled by (1−p). This acts as an implicit
        ensemble of exponentially many thinned networks.
      </p>

      <DropoutVisualizer />

      {/* ── Section 3: Weight Initialization ────────────────────────────── */}
      <div id="weight-initialization">
        <SectionTitle>Weight Initialization</SectionTitle>
      </div>

      <p style={prose}>
        The initial weight scale determines whether gradients vanish or explode before
        the first update. Xavier initialization preserves variance for symmetric
        activations like tanh. He initialization doubles the scale for ReLU, which
        zeros half its inputs. Poor initialization can take thousands of steps to
        overcome — if the network recovers at all.
      </p>

      <MathBlock>{"Xavier: σ = √(2 / (nᵢₙ + nₒᵤₜ))    He: σ = √(2 / nᵢₙ)"}</MathBlock>

      <InitializationExplorer />

      {/* ── Section 4: Knowledge Distillation ───────────────────────────── */}
      <div id="knowledge-distillation">
        <SectionTitle>Knowledge Distillation</SectionTitle>
      </div>

      <p style={prose}>
        A large teacher model encodes rich information in its output distribution —
        even the probabilities assigned to wrong classes carry structure about
        similarity between categories. Distillation trains a smaller student to match
        the teacher's soft probability distribution at temperature T, not just its
        hard predictions.
      </p>

      <MathBlock>{"L = α · CE(softmax(zₛ/T), y_hard) + (1−α) · KL(softmax(zₜ/T) ‖ softmax(zₛ/T))"}</MathBlock>

      <KnowledgeDistillation />

      {/* ── Section 5: LoRA & PEFT ───────────────────────────────────────── */}
      <div id="lora-peft">
        <SectionTitle>LoRA & Parameter-Efficient Fine-Tuning</SectionTitle>
      </div>

      <p style={prose}>
        Fine-tuning all parameters of a large pretrained model is expensive and often
        unnecessary. LoRA freezes the original weights W₀ and learns a low-rank
        perturbation ΔW = BA, where r ≪ min(d, k). At rank r=8, a 7B-parameter model
        can be adapted with under 0.1% additional parameters. QLoRA combines this with
        4-bit quantization for even greater efficiency.
      </p>

      <MathBlock>{"h = W₀x + ΔWx = W₀x + BAx    where B ∈ ℝᵈˣʳ, A ∈ ℝʳˣᵏ, r ≪ min(d,k)"}</MathBlock>

      <LoRADecomposition />

      {/* ── Section 6: Gradient Clipping ────────────────────────────────── */}
      <div id="gradient-clipping">
        <SectionTitle>Gradient Clipping</SectionTitle>
      </div>

      <p style={prose}>
        When gradient norms spike — particularly in RNNs or during early training —
        a single bad update can destabilize weeks of training. Gradient clipping
        rescales the gradient vector to a maximum norm, preserving its direction
        while bounding its magnitude.
      </p>

      <MathBlock>{"g ← g · min(1, clip_value / ‖g‖₂)"}</MathBlock>

      <GradientClipping />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
