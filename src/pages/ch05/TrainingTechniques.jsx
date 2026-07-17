import { useTocSections } from "../../components/layout/TocContext";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import NormalizationComparison from "../../components/widgets/ch05/NormalizationComparison";
import DropoutVisualizer from "../../components/widgets/ch05/DropoutVisualizer";
import InitializationExplorer from "../../components/widgets/ch05/InitializationExplorer";
import KnowledgeDistillation from "../../components/widgets/ch05/KnowledgeDistillation";
import GradientClipping from "../../components/widgets/ch05/GradientClipping";
import NormalizationRegions from "../../components/diagrams/ch05/NormalizationRegions";
import InitVariancePropagation from "../../components/diagrams/ch05/InitVariancePropagation";
import DistillationSoftLabels from "../../components/diagrams/ch05/DistillationSoftLabels";
import GradientClipTrajectory from "../../components/diagrams/ch05/GradientClipTrajectory";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

// ─── Citations data ───────────────────────────────────────────────────────────
// Ordered by first in-text appearance; buildCitations assigns `num` by position.
const CITATIONS = buildCitations([
  {
    title: "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift",
    authors: "Ioffe & Szegedy",
    venue: "ICML",
    year: "2015",
    tag: "seminal",
  },
  {
    title: "How Does Batch Normalization Help Optimization?",
    authors: "Santurkar, Tsipras, Ilyas, Madry",
    venue: "NeurIPS",
    year: "2018",
    tag: "paper",
  },
  {
    title: "Group Normalization",
    authors: "Wu & He",
    venue: "ECCV",
    year: "2018",
    tag: "paper",
  },
  {
    title: "Layer Normalization",
    authors: "Ba, Kiros, Hinton",
    venue: "arXiv",
    year: "2016",
    tag: "paper",
  },
  {
    title: "Root Mean Square Layer Normalization",
    authors: "Zhang & Sennrich",
    venue: "NeurIPS",
    year: "2019",
    tag: "paper",
  },
  {
    title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting",
    authors: "Srivastava, Hinton, Krizhevsky, Sutskever, Salakhutdinov",
    venue: "JMLR",
    year: "2014",
    tag: "seminal",
  },
  {
    title: "MixUp: Beyond Empirical Risk Minimization",
    authors: "Zhang, Cisse, Dauphin, Lopez-Paz",
    venue: "ICLR",
    year: "2018",
    tag: "paper",
  },
  {
    title: "CutMix: Regularization Strategy to Train Strong Classifiers with Localizable Features",
    authors: "Yun, Han, Oh, Chun, Choe, Yoo",
    venue: "ICCV",
    year: "2019",
    tag: "paper",
  },
  {
    title: "Improved Regularization of Convolutional Neural Networks with Cutout",
    authors: "DeVries & Taylor",
    venue: "arXiv",
    year: "2017",
    tag: "paper",
  },
  {
    title: "Deep Networks with Stochastic Depth",
    authors: "Huang, Sun, Liu, Sedra, Weinberger",
    venue: "ECCV",
    year: "2016",
    tag: "paper",
  },
  {
    title: "Rethinking the Inception Architecture for Computer Vision",
    authors: "Szegedy, Vanhoucke, Ioffe, Shlens, Wojna",
    venue: "CVPR",
    year: "2016",
    tag: "paper",
  },
  {
    title: "Understanding the Difficulty of Training Deep Feedforward Neural Networks",
    authors: "Glorot & Bengio",
    venue: "AISTATS",
    year: "2010",
    tag: "seminal",
  },
  {
    title: "Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification",
    authors: "He, Zhang, Ren, Sun",
    venue: "ICCV",
    year: "2015",
    tag: "paper",
  },
  {
    title: "Distilling the Knowledge in a Neural Network",
    authors: "Hinton, Vinyals, Dean",
    venue: "arXiv",
    year: "2015",
    tag: "seminal",
  },
  {
    title: "On the Difficulty of Training Recurrent Neural Networks",
    authors: "Pascanu, Mikolov, Bengio",
    venue: "ICML",
    year: "2013",
    tag: "seminal",
  },
  {
    title: "High-Performance Large-Scale Image Recognition Without Normalization",
    authors: "Brock, De, Smith, Simonyan",
    venue: "ICML",
    year: "2021",
    tag: "paper",
  },
]);

const TOC_SECTIONS = [
  { id: "normalization",          label: "Normalization" },
  { id: "dropout-regularization", label: "Dropout" },
  { id: "weight-initialization",  label: "Initialization" },
  { id: "knowledge-distillation", label: "Distillation" },
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
        across every layer and every step. Get them right and every technique in
        the chapters ahead inherits stable ground to build on; get any one of them
        wrong and no amount of architectural cleverness later will save the run.
      </ChapterLede>

      {/* ── Section 1: Normalization ─────────────────────────────────────── */}
      <div id="normalization">
        <SectionTitle>Normalization</SectionTitle>
      </div>

      <p style={prose}>
        Batch Normalization normalizes activations across the batch dimension,
        stabilizing training by reducing internal covariate shift. Layer Normalization
        normalizes across features within a single example, making it batch-size
        independent and the standard choice in transformers (Chapter 10). Group and
        Instance Norm occupy the space between, normalizing over subsets of channels.
      </p>

      <MathBlock>{"$$\\text{BatchNorm:}\\quad \\hat{x}_i = \\frac{x_i - \\mu_B}{\\sqrt{\\sigma_B^2 + \\varepsilon}} \\qquad y = \\gamma \\hat{x} + \\beta$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\mu_B"}</InlineMath> and <InlineMath>{"\\sigma_B^2"}</InlineMath> are
        the current mini-batch's mean and variance, and <InlineMath>{"\\gamma"}</InlineMath> and{" "}
        <InlineMath>{"\\beta"}</InlineMath> are learned per-channel scale and shift parameters —
        they hand back the representational freedom that pure normalization removes,
        letting a layer recover its original scale, or any other, if that is what fits best.
      </p>

      <NormalizationRegions />

      <p style={prose}>
        Batch Normalization (Ioffe & Szegedy 2015) [1] was originally framed as a fix
        for "internal covariate shift" — the idea that activation distributions drift
        across training, making each layer's input statistics a moving target. That
        framing has not aged well: Santurkar et al. (2018) [2] showed empirically that
        BN's actual benefit is smoothing the loss landscape, making gradients more
        predictable, not reducing covariate shift. The empirical effect is the same —
        training stabilizes, larger learning rates become safe — but the underlying
        cause is mechanical (Hessian conditioning — how well-scaled the loss surface's
        second-derivative curvature is) rather than statistical.
      </p>

      <p style={prose}>
        BatchNorm also behaves differently at train and test time. During training,
        each layer normalizes using the current mini-batch's <InlineMath>{"\\mu_B"}</InlineMath> and{" "}
        <InlineMath>{"\\sigma_B^2"}</InlineMath>, but a single test example has no batch to draw
        statistics from — and even if it did, a prediction shouldn't depend on which
        other examples happen to share its batch. The standard fix is to track a
        running (exponential moving average) estimate of the mean and variance
        throughout training, typically with a momentum around 0.1, and switch to
        these fixed statistics at inference. This also exposes BN's main failure
        mode: with small batches (fewer than about 8, common in object detection,
        segmentation, and reinforcement learning), per-batch statistics are noisy
        and BN's quality degrades — the original motivation for Group Normalization
        (Wu & He 2018) [3], which normalizes over channel groups within a single
        example and so never depends on batch size.
      </p>

      <p style={prose}>
        LayerNorm (Ba et al. 2016) [4] normalizes within a single example across the
        feature dimension, removing the batch-size dependency that makes BN
        problematic for variable-length sequences and small batches. Every
        transformer (Chapter 10) since the original 2017 paper uses LayerNorm or a
        variant. Where normalization sits relative to the residual connection (the
        skip-connection that adds a sub-layer's input directly to its output,
        covered in Chapter 6) — before or after the sub-layer, known as pre-LN
        versus post-LN — is itself a separate, consequential design choice;
        Chapter 10 covers this placement question in the context of the
        transformer block.
      </p>

      <p style={prose}>
        RMSNorm (Zhang & Sennrich 2019) [5] drops LayerNorm's mean-centering step and
        keeps only a root-mean-square-based magnitude rescaling:
      </p>

      <MathBlock>{"$$\\text{RMSNorm:}\\quad \\hat{x}_i = \\frac{x_i}{\\text{RMS}(x)}\\cdot\\gamma_i, \\qquad \\text{RMS}(x) = \\sqrt{\\frac{1}{n}\\sum_{j=1}^{n} x_j^2 + \\varepsilon}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\text{RMS}(x)"}</InlineMath> is the root-mean-square magnitude of the
        feature vector and <InlineMath>{"\\gamma"}</InlineMath> is again a learned per-feature
        scale; unlike LayerNorm there is no <InlineMath>{"\\beta"}</InlineMath> shift and no
        subtraction of the mean before rescaling. Empirically, mean-centering
        contributes nothing measurable to quality but accounts for nearly half the
        operation's compute, so dropping it is close to a free efficiency win.
      </p>

      <p style={prose}>
        RMSNorm has been in use since T5 (2019) and Gopher/Chinchilla (2021–22), but
        adoption became close to universal only with the LLaMA-era generation of
        open models (2023 onward): Llama, Mistral, Gemma, Qwen, and DeepSeek all use
        it, while the GPT-3/4 lineage still uses LayerNorm.
      </p>

      <p style={prose}>
        Switch between norm types in the widget below and hover any cell in the
        grid; notice which region gets outlined — a full column for BatchNorm, a
        full row for LayerNorm, a single cell for InstanceNorm, a half-row for
        GroupNorm — and watch the "Mean after" and "Std after" readouts settle to
        about 0 and 1 for whichever group you're hovering.
      </p>

      <NormalizationComparison
        tryThis={{
          do: "Switch between norm types and hover any cell in the grid.",
          notice: 'Which region gets outlined (a full column for BatchNorm, a full row for LayerNorm, a single cell for InstanceNorm, a half-row for GroupNorm), and how the "Mean after" / "Std after" readouts settle to about 0 and 1 for whichever group you\'re hovering.',
        }}
      />

      {/* ── Section 2: Dropout & Regularization ─────────────────────────── */}
      <div id="dropout-regularization">
        <SectionTitle>Dropout & Regularization</SectionTitle>
      </div>

      <p style={prose}>
        Dropout randomly zeros a fraction <InlineMath>{"p"}</InlineMath> of neurons during
        training, forcing the network to learn redundant representations rather than
        relying on any single unit; the result acts as an implicit ensemble of
        exponentially many "thinned" sub-networks that all share the same weights.
      </p>

      <p style={prose}>
        Srivastava et al. (2014) [6] introduced dropout with a clean theoretical
        framing: training with dropout rate <InlineMath>{"p"}</InlineMath> is approximately
        equivalent to training an ensemble of <InlineMath>{"2^N"}</InlineMath> thinned
        subnetworks (where <InlineMath>{"N"}</InlineMath> is the number of dropout-eligible
        units), all sharing weights. The textbook description of inference keeps
        every neuron active and scales its output by <InlineMath>{"(1 - p)"}</InlineMath>,
        approximating the geometric mean of this ensemble's predictions in a single
        forward pass. Production frameworks (PyTorch, TensorFlow) instead implement
        "inverted dropout": the <InlineMath>{"1/(1-p)"}</InlineMath> rescaling happens on the
        surviving activations during training itself, so inference needs no
        rescaling at all — mathematically equivalent, but simpler to implement and
        free of any extra cost on the far more frequent inference path. The
        redundant representations dropout forces — no single neuron can be relied
        on — are what give the resulting network its robustness.
      </p>

      <p style={prose}>
        Drag the dropout rate toward p = 0.9 and click Apply Dropout below; notice
        the active-neuron count and highlighted sub-network shrink, then toggle
        Inference Mode to see every neuron switch back on at the (1−p)-scaled
        activation this widget illustrates — the textbook convention above, rather
        than the inverted-dropout convention production frameworks actually
        implement. Switch between Classic and Inverted scaling and watch the live
        scale-factor readout flip which phase carries the correction: Classic
        leaves training unscaled and multiplies by (1−p) at inference, Inverted
        multiplies by 1/(1−p) during training and leaves inference unscaled.
      </p>

      <DropoutVisualizer
        tryThis={{
          do: "Drag the dropout rate toward p = 0.9 and click Apply Dropout, then toggle Inference Mode and switch between Classic and Inverted scaling.",
          notice: "The active-neuron count and highlighted sub-network shrink as p rises, toggling Inference Mode switches every neuron back on at the (1−p)-scaled activation this widget illustrates, and switching Classic/Inverted moves the live scale-factor readout between training and inference.",
        }}
      />

      <p style={prose}>
        Dropout regularizes the function class by injecting noise into which units
        fire; MixUp (Zhang et al. 2018) [7] regularizes the training data instead.
        The idea: rather than training on real examples one at a time, blend two
        randomly chosen examples — both their inputs and their labels — into one
        synthetic training point, so the model never sees a perfectly "clean"
        example and has to interpolate smoothly between classes.
      </p>

      <MathBlock>{"$$\\text{MixUp:}\\quad \\tilde{x} = \\lambda x_i + (1-\\lambda) x_j,\\quad \\tilde{y} = \\lambda y_i + (1-\\lambda) y_j,\\quad \\lambda \\sim \\text{Beta}(\\alpha, \\alpha)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"(x_i, y_i)"}</InlineMath> and <InlineMath>{"(x_j, y_j)"}</InlineMath> are
        two examples drawn from the batch, and <InlineMath>{"\\lambda \\in [0,1]"}</InlineMath> —
        drawn from a <InlineMath>{"\\text{Beta}(\\alpha,\\alpha)"}</InlineMath> distribution — sets
        the blend: a value near 0 or 1 mostly keeps one example, while a value near
        0.5 mixes them evenly. This forces the model to behave roughly linearly
        between training examples, improving generalization, calibration, and
        robustness to adversarial perturbation.
      </p>

      <p style={prose}>
        CutMix (Yun et al. 2019) [8], which replaces a rectangular patch from one
        image with another, CutOut (DeVries & Taylor 2017) [9], which zeroes a
        random patch, and Stochastic Depth (Huang et al. 2016) [10], which skips
        entire residual blocks at random during training, are conceptually
        adjacent: each adds noise at a different point in the pipeline. Label
        smoothing (Szegedy et al. 2016) [11] is a lighter-weight relative that
        touches neither data nor architecture: replacing one-hot targets with{" "}
        <InlineMath>{"(1-\\epsilon)"}</InlineMath> on the true class and the
        remaining <InlineMath>{"\\epsilon"}</InlineMath> spread evenly over the other classes
        prevents overconfidence and improves calibration in much the same spirit.
      </p>

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

      <p style={prose}>
        Here <InlineMath>{"\\sigma"}</InlineMath> is the standard deviation used to sample each
        weight, and <InlineMath>{"n_{\\text{in}}"}</InlineMath>, <InlineMath>{"n_{\\text{out}}"}</InlineMath>{" "}
        are the layer's fan-in and fan-out — the number of connections feeding into
        and out of it.
      </p>

      <InitVariancePropagation />

      <p style={prose}>
        Consider a layer <InlineMath>{"z = Wx"}</InlineMath> where <InlineMath>{"x"}</InlineMath> has variance <InlineMath>{"\\sigma^2"}</InlineMath> and <InlineMath>{"W"}</InlineMath> has i.i.d.
        (independent and identically distributed) entries with variance <InlineMath>{"\\sigma_w^2"}</InlineMath>. Then <InlineMath>{"\\text{Var}(z_i) = n_{\\text{in}} \\cdot \\sigma^2 \\cdot \\sigma_w^2"}</InlineMath>. For activations to
        neither blow up nor shrink across layers we need <InlineMath>{"\\text{Var}(z) = \\text{Var}(x)"}</InlineMath>, which
        forces <InlineMath>{"\\sigma_w^2 = 1 / n_{\\text{in}}"}</InlineMath>. This is the core idea behind Xavier/Glorot
        initialization (Glorot & Bengio 2010) [12], which averages <InlineMath>{"n_{\\text{in}}"}</InlineMath> and <InlineMath>{"n_{\\text{out}}"}</InlineMath> to
        balance forward and backward passes. The derivation assumes a roughly
        symmetric activation — tanh, sigmoid — anything that preserves the input
        variance through the nonlinearity. Concretely, for a layer with{" "}
        <InlineMath>{"n_{\\text{in}} = 256"}</InlineMath>, Xavier gives{" "}
        <InlineMath>{"\\sigma_w^2 = 2/(256+256) \\approx 0.0039"}</InlineMath>, i.e.{" "}
        <InlineMath>{"\\sigma_w \\approx 0.062"}</InlineMath>: each weight is drawn from a
        distribution barely wider than a spike at zero, which is the point — with
        256 inputs summed together, even a tiny per-weight variance adds up to a
        unit-variance output.
      </p>

      <p style={prose}>
        ReLU breaks that assumption: it zeros every negative input, halving the
        variance of activations passing through it (in expectation, for centered
        inputs). He et al. (2015) [13] compensated by doubling Xavier's
        scale to <InlineMath>{"\\sigma_w^2 = 2 / n_{\\text{in}}"}</InlineMath>. With He init, a 50-layer ReLU network has stable
        activations and gradients from the first forward pass; with Xavier or naive
        Gaussian init, the same network's activations either vanish or explode
        within roughly ten layers and may never recover. This is one of the cleanest
        examples in deep learning of an apparently minor numerical choice making
        the difference between trainable and untrainable.
      </p>

      <p style={prose}>
        Drag the neuron-count slider and switch between ReLU and Tanh below; notice
        the "Zero" curve flatline at variance 0 while "Too large" shoots off the top
        of the chart within a layer or two — a graphic reminder that it's scale, not
        sign, that initialization has to get right.
      </p>

      <InitializationExplorer
        tryThis={{
          do: "Drag the neuron-count slider and switch between ReLU and Tanh.",
          notice: 'The "Zero" curve flatlines at variance 0 while "Too large" shoots off the top of the chart within a layer or two — scale, not sign, is what initialization has to get right.',
        }}
      />

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

      <MathBlock>{"$$\\mathcal{L} = \\alpha \\cdot \\text{CE}\\bigl(\\text{softmax}(z_s),\\, y_{\\text{hard}}\\bigr) + (1-\\alpha) \\cdot T^2 \\cdot \\text{KL}\\bigl(\\text{softmax}(z_t/T)\\,\\|\\,\\text{softmax}(z_s/T)\\bigr)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"z_s"}</InlineMath> and <InlineMath>{"z_t"}</InlineMath> are the student's
        and teacher's logits (pre-softmax scores), <InlineMath>{"y_{\\text{hard}}"}</InlineMath> is
        the ground-truth label, and <InlineMath>{"\\alpha \\in [0,1]"}</InlineMath> is a
        hyperparameter — commonly 0.1 to 0.5 — trading off fidelity to the hard label
        against fidelity to the teacher's soft distribution. CE is cross-entropy
        against the hard label, computed at the student's ordinary{" "}
        <InlineMath>{"T=1"}</InlineMath> softmax; KL is the Kullback-Leibler divergence between
        the temperature-softened teacher and student distributions, defined
        precisely below.
      </p>

      <DistillationSoftLabels />

      <p style={prose}>
        Hinton et al. (2015) [14] coined the term "dark knowledge" for the
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
        logits (its pre-softmax scores <InlineMath>{"z_t"}</InlineMath>) by <InlineMath>{"T > 1"}</InlineMath> flattens the distribution, raises its entropy
        (a measure, introduced in Chapter 1, of how spread out versus peaked a
        probability distribution is), and brings
        those small probabilities into a learnable range. The student is trained at
        the same <InlineMath>{"T"}</InlineMath> and then deployed at <InlineMath>{"T = 1"}</InlineMath>. Typical values run from <InlineMath>{"T = 4"}</InlineMath> to{" "}
        <InlineMath>{"T = 20"}</InlineMath>. The technique is general — it's used to compress large models for
        deployment, to transfer knowledge between architectures, and in
        self-distillation, where a model is trained to match an earlier checkpoint
        of itself. In production this is routine rather than exotic: Google's
        Gemma 2 2B and 9B models (2024) were trained by distillation from larger
        teachers instead of plain next-token prediction, and Meta distilled
        Llama 3.2's 1B and 3B models (2024) from the larger Llama 3.1 checkpoints
        specifically to hit the on-device, low-latency deployment targets those
        sizes are built for.
      </p>

      <p style={prose}>
        To make "how far apart" precise:
      </p>

      <MathBlock>{"$$\\text{KL}(P\\|Q) = \\sum_x P(x)\\log\\frac{P(x)}{Q(x)}$$"}</MathBlock>

      {/* forward cross-ref to Chapter 1 (Probability & Information for ML) once
          N1 lands — that chapter is the designated owner of entropy/cross-entropy/KL */}

      <p style={prose}>
        <InlineMath>{"\\text{KL}(P\\|Q)"}</InlineMath> measures the extra bits — or, with a
        natural log, nats — needed to encode samples from <InlineMath>{"P"}</InlineMath> using a
        code optimized for <InlineMath>{"Q"}</InlineMath>: zero exactly when the two match, and
        strictly positive otherwise. In the loss above it is applied to the
        temperature-softened teacher and student distributions, and the{" "}
        <InlineMath>{"T^2"}</InlineMath> factor is not optional: because the soft-target
        gradient scales as <InlineMath>{"1/T^2"}</InlineMath>, dropping it would let the
        hard-label term dominate at high temperature purely as an artifact of the
        scaling, not because the soft targets became less informative.
      </p>

      <p style={prose}>
        Drag the temperature slider from T = 1 toward T = 10 below; notice the
        teacher's distribution flatten from a near one-hot spike into a much more
        uniform bar chart, revealing probability mass on "dog" and "tiger" that was
        invisible at T = 1 — then drag α toward 0 to shift the loss weighting
        entirely onto that soft-target term. Click Train student to watch the
        student actually learn by gradient descent against that soft target: the
        KL(teacher‖student) and Total student loss readouts start high — the
        student begins from zero logits, a maximally uncertain guess — and fall
        toward zero as the training-step counter climbs.
      </p>

      <KnowledgeDistillation
        tryThis={{
          do: "Drag the temperature slider from T = 1 toward T = 10, then drag α toward 0, then click Train student.",
          notice: 'The teacher\'s distribution flattens from a near one-hot spike into a much more uniform bar chart, revealing probability mass on "dog" and "tiger" invisible at T = 1; dragging α toward 0 shifts the loss weighting entirely onto the soft-target term; and clicking Train student runs real gradient descent, with the KL(teacher‖student) and Total student loss readouts falling from their untrained starting values toward near zero as training proceeds.',
        }}
      />

      {/* LoRA & Parameter-Efficient Fine-Tuning moved to Chapter 14 (Efficient
          Inference & Deployment) — see context/V2_PLAN.md queue item S2. */}

      {/* ── Section 5: Gradient Clipping ─────────────────────────────────── */}
      <div id="gradient-clipping">
        <SectionTitle>Gradient Clipping</SectionTitle>
      </div>

      <p style={prose}>
        When gradient norms spike — particularly in recurrent networks (Chapter 8)
        or during early training — a single bad update can destabilize weeks of
        training. Gradient clipping rescales the gradient vector to a maximum norm,
        preserving its direction while bounding its magnitude.
      </p>

      <MathBlock>{"$$g \\leftarrow g \\cdot \\min\\!\\left(1,\\ \\frac{\\text{clip\\_value}}{\\|g\\|_2}\\right)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"g"}</InlineMath> is the full gradient vector (every parameter's
        partial derivative, stacked), <InlineMath>{"\\|g\\|_2"}</InlineMath> is its Euclidean
        norm, and <InlineMath>{"\\text{clip\\_value}"}</InlineMath> is the maximum norm allowed
        — when the norm is already under the limit, the <InlineMath>{"\\min(\\cdot)"}</InlineMath>{" "}
        is 1 and nothing changes. As a worked example: a gradient with{" "}
        <InlineMath>{"\\|g\\|_2 = 4.2"}</InlineMath> and <InlineMath>{"\\text{clip\\_value} = 1.0"}</InlineMath>{" "}
        gets rescaled by <InlineMath>{"\\min(1,\\, 1.0/4.2) \\approx 0.238"}</InlineMath>, so every
        component of <InlineMath>{"g"}</InlineMath> shrinks to about 23.8% of its original size
        while its direction is left untouched.
      </p>

      <GradientClipTrajectory />

      <p style={prose}>
        Gradient norm spikes are most severe in two regimes. In recurrent networks
        (Chapter 8), whose gradients are multiplied across many repeated
        applications of the same weights via backpropagation through time, any
        amplification factor greater than one compounds exponentially — this was
        the original motivation for clipping (Pascanu et al. 2013) [15]. In early
        training of transformers (Chapter 10), before normalization layers'
        statistics stabilize, a single anomalous batch can produce a gradient
        orders of magnitude larger than typical, and a single such update can
        destroy weeks of progress. The asymmetry matters: clipping is cheap
        insurance against a rare catastrophic event, so practical training recipes
        almost always include it (typical clip values: 1.0 for transformers, 5.0 to
        10.0 for recurrent networks).
      </p>

      <p style={prose}>
        Global norm clipping (the formula above) preserves the gradient's direction
        and only modulates its magnitude. Value clipping — clamping each gradient
        element individually — distorts direction and is rarely used in modern
        training. Adaptive Gradient Clipping (Brock et al. 2021) [16], used in
        NFNets, clips each parameter's gradient relative to its own weight norm
        rather than against a global threshold, which generalizes better across
        architectures and is one of the techniques that made batch-norm-free deep
        networks competitive.
      </p>

      <p style={prose}>
        Set the clip threshold to about 2.0 below and click Animate; notice the
        dashed unclipped trajectory spike well above the threshold around step 40,
        while the solid clipped line holds flat at 2.0 and the "Clipping active"
        readout flips to YES for exactly the duration of the spike.
      </p>

      <GradientClipping
        tryThis={{
          do: "Set the clip threshold to about 2.0 and click Animate.",
          notice: 'The dashed unclipped trajectory spikes well above the threshold around step 40, the solid clipped line holds flat at 2.0, and the "Clipping active" readout flips to YES for exactly the duration of the spike.',
        }}
      />

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        The techniques in this chapter rarely get named again individually, but
        they are load-bearing everywhere from here on: every architecture in this
        book normalizes its activations, initializes its weights following the
        fan-in/fan-out logic derived here, and treats dropout-style noise injection
        and gradient clipping as defaults rather than special cases. Distillation's
        temperature-scaled soft targets reappear in spirit wherever a smaller model
        is trained to imitate a larger one, a pattern most modern deployment
        pipelines depend on. Chapter 6 (Convolutional Networks) is where these
        defaults are first exercised inside a complete architecture, including the
        residual blocks that Stochastic Depth skips and that become the standard
        building block for every deep network from here on.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
