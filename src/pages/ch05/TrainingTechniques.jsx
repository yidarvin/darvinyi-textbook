import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import NormalizationComparison from "../../components/widgets/ch05/NormalizationComparison";
import DropoutVisualizer from "../../components/widgets/ch05/DropoutVisualizer";
import InitializationExplorer from "../../components/widgets/ch05/InitializationExplorer";
import KnowledgeDistillation from "../../components/widgets/ch05/KnowledgeDistillation";
import LoRADecomposition from "../../components/widgets/ch05/LoRADecomposition";
import GradientClipping from "../../components/widgets/ch05/GradientClipping";
import NormalizationRegions from "../../components/diagrams/ch05/NormalizationRegions";
import InitVariancePropagation from "../../components/diagrams/ch05/InitVariancePropagation";
import DistillationSoftLabels from "../../components/diagrams/ch05/DistillationSoftLabels";
import LoRAMatrixShapes from "../../components/diagrams/ch05/LoRAMatrixShapes";
import GradientClipTrajectory from "../../components/diagrams/ch05/GradientClipTrajectory";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift", authors: "Ioffe & Szegedy", venue: "ICML", year: "2015", tag: "seminal" },
  { num: 2, title: "Layer Normalization", authors: "Ba, Kiros, Hinton", venue: "arXiv", year: "2016", tag: "paper" },
  { num: 3, title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting", authors: "Srivastava, Hinton, Krizhevsky, Sutskever, Salakhutdinov", venue: "JMLR", year: "2014", tag: "seminal" },
  { num: 4, title: "Understanding the Difficulty of Training Deep Feedforward Neural Networks", authors: "Glorot & Bengio", venue: "AISTATS", year: "2010", tag: "seminal" },
  { num: 5, title: "Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet", authors: "He, Zhang, Ren, Sun", venue: "ICCV", year: "2015", tag: "paper" },
  { num: 6, title: "Distilling the Knowledge in a Neural Network", authors: "Hinton, Vinyals, Dean", venue: "NeurIPS Workshop", year: "2015", tag: "seminal" },
  { num: 7, title: "LoRA: Low-Rank Adaptation of Large Language Models", authors: "Hu, Shen, Wallis, Allen-Zhu, Li, Wang, Chen", venue: "ICLR", year: "2022", tag: "seminal" },
  { num: 8, title: "QLoRA: Efficient Finetuning of Quantized LLMs", authors: "Dettmers, Pagnoni, Holtzman, Zettlemoyer", venue: "NeurIPS", year: "2023", tag: "paper" },
  { num: 9, title: "MixUp: Beyond Empirical Risk Minimization", authors: "Zhang, Cisse, Dauphin, Lopez-Paz", venue: "ICLR", year: "2018", tag: "paper" },
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
        Chapter 05 · Part I — Foundations
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

      <MathBlock>{"$$\\text{BatchNorm:}\\quad \\hat{x}_i = \\frac{x_i - \\mu_B}{\\sqrt{\\sigma_B^2 + \\varepsilon}} \\qquad y = \\gamma \\hat{x} + \\beta$$"}</MathBlock>

      <NormalizationRegions />

      <p style={prose}>
        Batch Normalization [1] (Ioffe & Szegedy 2015) was originally framed as a fix
        for "internal covariate shift" — the idea that activation distributions drift
        across training, making each layer's input statistics a moving target. That
        framing has not aged well: Santurkar et al. (2018) showed empirically that
        BN's actual benefit is smoothing the loss landscape, making gradients more
        predictable, not reducing covariate shift. The empirical effect is the same —
        training stabilizes, larger learning rates become safe — but the underlying
        cause is mechanical (Hessian conditioning) rather than statistical.
      </p>

      <p style={prose}>
        LayerNorm [2] (Ba, Kiros, Hinton 2016) normalizes within a single example
        across the feature dimension, removing the batch-size dependency that makes
        BN problematic for variable-length sequences and small batches. Every
        transformer since the original 2017 paper uses LayerNorm or a variant. The
        newer twist: starting with LLaMA in 2023, most modern LLMs — LLaMA, Mistral,
        Gemma, Qwen, T5, DeepSeek — have switched to RMSNorm (Zhang & Sennrich 2019),
        which drops LayerNorm's mean-centering step and keeps only the RMS-based
        magnitude rescaling. Empirically, mean-centering contributes nothing
        measurable to quality but accounts for nearly half the operation's compute.
        RMSNorm is faster, simpler, and now standard. (The GPT-3/4 lineage still
        uses LayerNorm.)
      </p>

      <NormalizationComparison />

      {/* ── Section 2: Dropout & Regularization ─────────────────────────── */}
      <div id="dropout-regularization">
        <SectionTitle>Dropout & Regularization</SectionTitle>
      </div>

      <p style={prose}>
        Dropout randomly zeros a fraction <InlineMath>{"p"}</InlineMath> of neurons during training, forcing the
        network to learn redundant representations. At inference, all neurons are
        active but their outputs are scaled by <InlineMath>{"(1 - p)"}</InlineMath>. This acts as an implicit
        ensemble of exponentially many thinned networks.
      </p>

      <p style={prose}>
        Srivastava, Hinton, Krizhevsky, Sutskever & Salakhutdinov (2014) [3]
        introduced dropout with a clean theoretical framing: training with dropout
        rate <InlineMath>{"p"}</InlineMath> is approximately equivalent to training an ensemble of <InlineMath>{"2^N"}</InlineMath> thinned
        subnetworks (where <InlineMath>{"N"}</InlineMath> is the number of dropout-eligible units), all sharing
        weights. At inference, scaling activations by <InlineMath>{"(1 - p)"}</InlineMath> approximates the
        geometric mean of this ensemble's predictions in a single forward pass. The
        redundant representations dropout forces — no single neuron can be relied on
        — are what give the resulting network its robustness.
      </p>

      <MathBlock>{"$$\\text{MixUp:}\\quad \\tilde{x} = \\lambda x_i + (1-\\lambda) x_j,\\quad \\tilde{y} = \\lambda y_i + (1-\\lambda) y_j,\\quad \\lambda \\sim \\text{Beta}(\\alpha, \\alpha)$$"}</MathBlock>

      <p style={prose}>
        Dropout regularizes the function class. MixUp [9] (Zhang, Cisse, Dauphin &
        Lopez-Paz 2018) regularizes the training data instead: for each batch,
        sample two examples <InlineMath>{"(x_i, y_i)"}</InlineMath> and <InlineMath>{"(x_j, y_j)"}</InlineMath>, draw <InlineMath>{"\\lambda \\sim \\text{Beta}(\\alpha, \\alpha)"}</InlineMath>, and train on
        the convex combination <InlineMath>{"(\\lambda x_i + (1-\\lambda) x_j,\\ \\lambda y_i + (1-\\lambda) y_j)"}</InlineMath>. This forces the model
        to behave roughly linearly between training examples, improving
        generalization, calibration, and robustness to adversarial perturbation.
        CutMix (replacing a rectangular patch from one image with another), CutOut
        (zeroing a random patch), and Stochastic Depth (Huang et al. 2016, skipping
        entire residual blocks at random during training) are conceptually adjacent:
        each adds noise at a different point in the pipeline.
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

      <MathBlock>{"$$\\text{Xavier:}\\ \\sigma = \\sqrt{\\frac{2}{n_{\\text{in}} + n_{\\text{out}}}} \\qquad \\text{He:}\\ \\sigma = \\sqrt{\\frac{2}{n_{\\text{in}}}}$$"}</MathBlock>

      <InitVariancePropagation />

      <p style={prose}>
        Consider a layer <InlineMath>{"z = Wx"}</InlineMath> where <InlineMath>{"x"}</InlineMath> has variance <InlineMath>{"\\sigma^2"}</InlineMath> and <InlineMath>{"W"}</InlineMath> has i.i.d. entries
        with variance <InlineMath>{"\\sigma_w^2"}</InlineMath>. Then <InlineMath>{"\\text{Var}(z_i) = n_{\\text{in}} \\cdot \\sigma^2 \\cdot \\sigma_w^2"}</InlineMath>. For activations to
        neither blow up nor shrink across layers we need <InlineMath>{"\\text{Var}(z) = \\text{Var}(x)"}</InlineMath>, which
        forces <InlineMath>{"\\sigma_w^2 = 1 / n_{\\text{in}}"}</InlineMath>. This is the core idea behind Xavier/Glorot
        initialization [4] (Glorot & Bengio 2010), which averages <InlineMath>{"n_{\\text{in}}"}</InlineMath> and <InlineMath>{"n_{\\text{out}}"}</InlineMath> to
        balance forward and backward passes. The derivation assumes a roughly
        symmetric activation — tanh, sigmoid — anything that preserves the input
        variance through the nonlinearity.
      </p>

      <p style={prose}>
        ReLU breaks that assumption: it zeros every negative input, halving the
        variance of activations passing through it (in expectation, for centered
        inputs). He, Zhang, Ren & Sun (2015) [5] compensated by doubling Xavier's
        scale to <InlineMath>{"\\sigma_w^2 = 2 / n_{\\text{in}}"}</InlineMath>. With He init, a 50-layer ReLU network has stable
        activations and gradients from the first forward pass; with Xavier or naive
        Gaussian init, the same network's activations either vanish or explode
        within roughly ten layers and may never recover. This is one of the cleanest
        examples in deep learning of an apparently minor numerical choice making
        the difference between trainable and untrainable.
      </p>

      <InitializationExplorer />

      {/* ── Section 4: Knowledge Distillation ───────────────────────────── */}
      <div id="knowledge-distillation">
        <SectionTitle>Knowledge Distillation</SectionTitle>
      </div>

      <p style={prose}>
        A large teacher model encodes rich information in its output distribution —
        even the probabilities assigned to wrong classes carry structure about
        similarity between categories. Distillation trains a smaller student to match
        the teacher's soft probability distribution at temperature <InlineMath>{"T"}</InlineMath>, not just its
        hard predictions.
      </p>

      <MathBlock>{"$$\\mathcal{L} = \\alpha \\cdot \\text{CE}\\bigl(\\text{softmax}(z_s/T),\\, y_{\\text{hard}}\\bigr) + (1-\\alpha) \\cdot \\text{KL}\\bigl(\\text{softmax}(z_t/T)\\,\\|\\,\\text{softmax}(z_s/T)\\bigr)$$"}</MathBlock>

      <DistillationSoftLabels />

      <p style={prose}>
        Hinton, Vinyals & Dean (2015) [6] coined the term "dark knowledge" for the
        information hidden in a trained model's wrong predictions. A classifier that
        assigns 70% probability to "cat", 20% to "dog", and 9% to "fox" has learned
        that cats are closer to dogs than to foxes — structural knowledge about
        category similarity that a one-hot label cannot convey. Distillation
        extracts this knowledge by training the student to match the teacher's full
        soft distribution, not just its argmax.
      </p>

      <p style={prose}>
        At <InlineMath>{"T = 1"}</InlineMath> the teacher's softmax is often nearly one-hot, and the dark
        knowledge is buried in tiny probability values. Dividing the teacher's
        logits by <InlineMath>{"T > 1"}</InlineMath> flattens the distribution, raises its entropy, and brings
        those small probabilities into a learnable range. The student is trained at
        the same <InlineMath>{"T"}</InlineMath> and then deployed at <InlineMath>{"T = 1"}</InlineMath>. Typical values run from <InlineMath>{"T = 4"}</InlineMath> to
        <InlineMath>{"T = 20"}</InlineMath>. The technique is general — it's used to compress large models for
        deployment, to transfer knowledge between architectures, and in
        self-distillation, where a model is trained to match an earlier checkpoint
        of itself.
      </p>

      <KnowledgeDistillation />

      {/* ── Section 5: LoRA & PEFT ───────────────────────────────────────── */}
      <div id="lora-peft">
        <SectionTitle>LoRA & Parameter-Efficient Fine-Tuning</SectionTitle>
      </div>

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
        Hu et al. (2022) [7] start from an empirical observation: when you fine-tune
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
        QLoRA [8] (Dettmers, Pagnoni, Holtzman & Zettlemoyer 2023) pushed this
        further by quantizing the frozen <InlineMath>{"W_0"}</InlineMath> to 4 bits while keeping the LoRA
        adapters in higher precision. The frozen weights take a fraction of the
        memory; the trainable adapters fit comfortably alongside. QLoRA made it
        possible to fine-tune a 65B-parameter model on a single 48GB GPU — a
        configuration that would otherwise need a multi-GPU setup. The technique is
        the de facto standard for fine-tuning open-source LLMs today.
      </p>

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

      <MathBlock>{"$$g \\leftarrow g \\cdot \\min\\!\\left(1,\\ \\frac{\\text{clip\\_value}}{\\|g\\|_2}\\right)$$"}</MathBlock>

      <GradientClipTrajectory />

      <p style={prose}>
        Gradient norm spikes are most severe in two regimes. In RNNs and long
        sequences, backpropagation through time multiplies gradient terms across
        timesteps, and any amplification factor greater than one compounds
        exponentially — this was the original motivation for clipping (Pascanu,
        Mikolov & Bengio 2013). In early training of transformers, before
        normalization layers' statistics stabilize, a single anomalous batch can
        produce a gradient orders of magnitude larger than typical, and a single
        such update can destroy weeks of progress. The asymmetry matters: clipping
        is cheap insurance against a rare catastrophic event, so practical training
        recipes almost always include it (typical clip values: 1.0 for transformers,
        5.0 to 10.0 for RNNs).
      </p>

      <p style={prose}>
        Global norm clipping (the formula above) preserves the gradient's direction
        and only modulates its magnitude. Value clipping — clamping each gradient
        element individually — distorts direction and is rarely used in modern
        training. Adaptive Gradient Clipping (Brock et al. 2021, used in NFNets)
        clips each parameter's gradient relative to its own weight norm rather than
        against a global threshold, which generalizes better across architectures
        and is one of the techniques that made batch-norm-free deep networks
        competitive.
      </p>

      <GradientClipping />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
