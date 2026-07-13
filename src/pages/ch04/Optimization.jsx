import { useTocSections } from "../../components/layout/TocRail";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import GradientDescentNavigator from "../../components/widgets/ch04/GradientDescentNavigator";
import OptimizerRace from "../../components/widgets/ch04/OptimizerRace";
import LRFinder from "../../components/widgets/ch04/LRFinder";
import LRSchedule from "../../components/widgets/ch04/LRSchedule";
import AdamInternals from "../../components/widgets/ch04/AdamInternals";
import GradientDescentGeometry from "../../components/diagrams/ch04/GradientDescentGeometry";
import MomentumRavine from "../../components/diagrams/ch04/MomentumRavine";
import FlatVsSharpMinima from "../../components/diagrams/ch04/FlatVsSharpMinima";
import AdamUnpacking from "../../components/diagrams/ch04/AdamUnpacking";

// ─── Prose styles ─────────────────────────────────────────────────────────────
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
    title: "On Large-Batch Training for Deep Learning: Generalization Gap and Sharp Minima",
    authors: "Keskar, Mudigere, Nocedal, Smelyanskiy, Tang",
    venue: "ICLR",
    year: "2017",
    tag: "paper",
  },
  {
    title: "Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour",
    authors: "Goyal, Dollár, Girshick, Noordhuis, Wesolowski, Kyrola, Tulloch, Jia, He",
    venue: "arXiv",
    year: "2017",
    tag: "paper",
  },
  {
    title: "An Empirical Model of Large-Batch Training",
    authors: "McCandlish, Kaplan, Amodei, OpenAI Dota Team",
    venue: "arXiv",
    year: "2018",
    tag: "paper",
  },
  {
    title: "Some Methods of Speeding Up the Convergence of Iteration Methods",
    authors: "Polyak",
    venue: "USSR Computational Mathematics and Mathematical Physics",
    year: "1964",
    tag: "seminal",
  },
  {
    title: "A Method for Solving the Convex Programming Problem with Convergence Rate O(1/k²)",
    authors: "Nesterov",
    venue: "Soviet Mathematics Doklady",
    year: "1983",
    tag: "seminal",
  },
  {
    title: "On the Importance of Initialization and Momentum in Deep Learning",
    authors: "Sutskever, Martens, Dahl, Hinton",
    venue: "ICML",
    year: "2013",
    tag: "seminal",
  },
  {
    title: "Adaptive Subgradient Methods for Online Learning and Stochastic Optimization (AdaGrad)",
    authors: "Duchi, Hazan, Singer",
    venue: "JMLR",
    year: "2011",
    tag: "seminal",
  },
  {
    title: "Adam: A Method for Stochastic Optimization",
    authors: "Kingma & Ba",
    venue: "ICLR",
    year: "2015",
    tag: "seminal",
  },
  {
    title: "Decoupled Weight Decay Regularization (AdamW)",
    authors: "Loshchilov & Hutter",
    venue: "ICLR",
    year: "2019",
    tag: "paper",
  },
  {
    title: "Symbolic Discovery of Optimization Algorithms (Lion)",
    authors: "Chen, Liang, Huang, Real, Wang, Liu, Pham, Dong, Luong, Hsieh, Lu, Le",
    venue: "NeurIPS",
    year: "2023",
    tag: "paper",
  },
  {
    title: "Sophia: A Scalable Stochastic Second-order Optimizer for Language Model Pre-training",
    authors: "Liu, Li, Hall, Liang, Ma",
    venue: "arXiv",
    year: "2023",
    tag: "paper",
  },
  {
    title: "Shampoo: Preconditioned Stochastic Tensor Optimization",
    authors: "Gupta, Koren, Singer",
    venue: "ICML",
    year: "2018",
    tag: "paper",
  },
  {
    title: "Adafactor: Adaptive Learning Rates with Sublinear Memory Cost",
    authors: "Shazeer & Stern",
    venue: "ICML",
    year: "2018",
    tag: "paper",
  },
  {
    title: "8-bit Optimizers via Block-wise Quantization",
    authors: "Dettmers, Lewis, Shleifer, Zettlemoyer",
    venue: "ICLR",
    year: "2022",
    tag: "paper",
  },
  {
    title: "Muon is Scalable for LLM Training",
    authors: "Liu, Su, Yao, Jiang, Lai, Du, Qin, Xu, Lu, Yan, et al.",
    venue: "arXiv",
    year: "2025",
    tag: "paper",
  },
  {
    title: "Visualizing the Loss Landscape of Neural Nets",
    authors: "Li, Xu, Taylor, Studer, Goldstein",
    venue: "NeurIPS",
    year: "2018",
    tag: "paper",
  },
  {
    title: "Identifying and Attacking the Saddle Point Problem in High-Dimensional Non-Convex Optimization",
    authors: "Dauphin, Pascanu, Gulcehre, Cho, Ganguli, Bengio",
    venue: "NeurIPS",
    year: "2014",
    tag: "paper",
  },
  {
    title: "Sharpness-Aware Minimization for Efficiently Improving Generalization (SAM)",
    authors: "Foret, Kleiner, Mobahi, Neyshabur",
    venue: "ICLR",
    year: "2021",
    tag: "paper",
  },
  {
    title: "Sharp Minima Can Generalize For Deep Nets",
    authors: "Dinh, Pascanu, Bengio, Bengio",
    venue: "ICML",
    year: "2017",
    tag: "paper",
  },
  {
    title: "SGDR: Stochastic Gradient Descent with Warm Restarts",
    authors: "Loshchilov & Hutter",
    venue: "ICLR",
    year: "2017",
    tag: "paper",
  },
  "attention-is-all-you-need",
  {
    title: "Super-Convergence: Very Fast Training of Neural Networks Using Large Learning Rates",
    authors: "Smith & Topin",
    venue: "Proc. SPIE",
    year: "2019",
    tag: "paper",
  },
  {
    title: "MiniCPM: Unveiling the Potential of Small Language Models with Scalable Training Strategies",
    authors: "Hu et al.",
    venue: "arXiv",
    year: "2024",
    tag: "paper",
  },
  {
    title: "The Road Less Scheduled",
    authors: "Defazio, Yang, Mehta, Mishchenko, Khaled, Cutkosky",
    venue: "NeurIPS",
    year: "2024",
    tag: "paper",
  },
  {
    title: "The Marginal Value of Adaptive Gradient Methods in Machine Learning",
    authors: "Wilson, Roelofs, Stern, Srebro, Recht",
    venue: "NeurIPS",
    year: "2017",
    tag: "paper",
  },
  {
    title: "Loss Surfaces, Mode Connectivity, and Fast Ensembling of DNNs",
    authors: "Garipov, Izmailov, Podoprikhin, Vetrov, Wilson",
    venue: "NeurIPS",
    year: "2018",
    tag: "paper",
  },
  {
    title: "Optimizing Neural Networks with Kronecker-factored Approximate Curvature (K-FAC)",
    authors: "Martens & Grosse",
    venue: "ICML",
    year: "2015",
    tag: "paper",
  },
]);

// ─── TOC sections ─────────────────────────────────────────────────────────────
const TOC_SECTIONS = [
  { id: "gradient-descent",    label: "Gradient Descent"          },
  { id: "momentum-adaptive",   label: "Momentum & Adaptive"       },
  { id: "loss-landscapes",     label: "Loss Landscapes"           },
  { id: "lr-schedules",        label: "LR Schedules"              },
  { id: "adam-internals",      label: "Adam Internals"            },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Optimization() {
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
        Chapter 04 · Part I — Foundations
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
        Optimization
      </h1>

      <ChapterLede>
        A trained network is defined entirely by the values of its
        parameters, and training is nothing more than a search for a good
        set of values. Gradient descent is the search algorithm behind
        every model in this book — take a step opposite the direction the
        loss is increasing fastest, repeat millions of times — but this
        chapter's real subject is everything that turns that one-line idea
        into something that actually works: which optimizer computes the
        step, how large the step should be, and how that size should
        change as training proceeds. Get these choices wrong and a network
        that could have trained in an afternoon instead diverges, stalls,
        or quietly settles for a worse solution than its architecture was
        capable of; get them right, and every later chapter — from
        convolutional networks through the largest language models — can
        simply assume a well-behaved training loop and move on.
      </ChapterLede>

      {/* ── Section 1: Gradient Descent ──────────────────────────────────── */}
      <div id="gradient-descent">
        <SectionTitle>Gradient Descent</SectionTitle>
      </div>

      <p style={prose}>
        Gradient descent updates parameters by stepping opposite the gradient
        of the loss, proportional to the learning rate <InlineMath>{"\\eta"}</InlineMath> — the core
        optimization primitive used across all neural network training.
        Stochastic gradient descent (SGD) estimates this gradient from a
        single random sample, drastically reducing computation per step but
        introducing noise that can prevent convergence to a precise minimum.
        Mini-batch gradient descent strikes a balance: averaging the gradient
        over a small batch of 32–512 examples reduces variance enough for
        reliable progress while preserving the throughput advantage of
        parallelism over full-batch computation.
      </p>

      <MathBlock>{"$$\\theta \\leftarrow \\theta - \\eta\\, \\nabla_\\theta L(\\theta)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\theta"}</InlineMath> is the parameter vector, <InlineMath>{"\\eta"}</InlineMath> the learning
        rate, and <InlineMath>{"\\nabla_\\theta L(\\theta)"}</InlineMath> the gradient of the loss with
        respect to <InlineMath>{"\\theta"}</InlineMath> — the update simply steps a fixed fraction of
        the way down that gradient.
      </p>

      <GradientDescentGeometry />

      <p style={prose}>
        The stochastic estimate is unbiased — its expectation (its long-run
        average value) equals the true full-batch gradient — but the
        per-step variance (how spread out the estimates are around that
        average) is high. Two consequences follow: the loss curve during
        training is jagged rather than monotonic, which is typical and not a
        bug, and SGD never converges to a single point, wandering instead
        within a noise ball around the minimum whose radius scales roughly
        as <InlineMath>{"\\sqrt{\\eta \\cdot \\text{variance} / \\text{batch\\_size}}"}</InlineMath>. Tight
        convergence requires a decaying learning rate; in practice most
        modern training anneals near the end and accepts the noise ball as
        the operating point. The noise itself does useful work — it can knock
        the optimizer out of sharp minima toward flatter ones, a phenomenon
        explored in the loss-landscape section below.
      </p>

      <p style={prose}>
        Batch size is therefore not just a compute knob but a regularization
        knob. Smaller batches mean higher gradient noise, which acts as
        implicit regularization and often improves generalization — Keskar
        et al. (2017) [1] documented a "generalization gap" for large-batch
        training on MNIST, TIMIT, and CIFAR-10/100 networks, where very
        large batches converged to sharper minima and tested slightly worse
        despite matching training loss. Larger batches mean lower noise but
        require proportionally larger learning rates to maintain the same
        effective step size — the linear scaling rule of Goyal et al.
        (2017) [2], demonstrated by training a large CNN on ImageNet in
        under an hour without losing accuracy. Modern recipes split along
        these lines: small batches (32–256) with SGD for vision benchmarks;
        very large batches (millions of tokens) with an adaptive method
        such as Adam or AdamW — introduced next — for language model
        pretraining, with linear warmup to keep the early steps from
        destabilizing.
      </p>

      <p style={prose}>
        How large a batch is worth using has a quantitative answer.
        McCandlish et al. (2018) [3] defined the gradient noise scale —
        roughly the ratio of the per-example gradient variance to the
        squared norm of the true gradient — as the batch size beyond which
        adding more examples per step stops buying proportionally faster
        training. Below that scale, doubling the batch (and, per the linear
        scaling rule above, the learning rate) roughly halves the number of
        steps needed; above it, extra examples mostly cancel each other's
        noise without adding new information, so throughput keeps rising
        while progress per step does not. This is the quantitative reason
        batch sizes for large language model pretraining have grown into
        the millions of tokens: the noise scale itself grows with model
        size and data quantity, so larger models can profitably absorb far
        larger batches before linear scaling breaks down.
      </p>

      <p style={prose}>
        The Optimizer selector in the widget below previews Momentum and
        Adam, both covered in the next section — leave it on SGD for now.
        Click the Ravine preset, then press Play; notice the loss oscillate
        sharply for about the first 30 steps before settling into a slow
        crawl that stalls around 0.45 by step 200, well short of the
        landscape's true minimum near zero.
      </p>

      <GradientDescentNavigator
        tryThis={{
          do: "Click the Ravine preset, then press Play with SGD selected (the default).",
          notice:
            "The loss oscillates sharply for about the first 30 steps, then settles into a slow crawl that stalls around 0.45 by step 200 — well short of the landscape's true minimum near zero.",
        }}
      />

      {/* ── Section 2: Momentum & Adaptive Methods ───────────────────────── */}
      <div id="momentum-adaptive">
        <SectionTitle>Momentum & Adaptive Methods</SectionTitle>
      </div>

      <p style={prose}>
        The momentum idea predates deep learning by decades — Polyak's
        "heavy ball" method (1964) [4] and Nesterov's accelerated gradient
        (1983) [5] both add a velocity term to gradient descent, smoothing
        oscillations across noisy directions and accelerating along
        consistently downhill ones. Sutskever et al. (2013) [6] was the
        empirical revelation for neural networks: properly tuned momentum,
        combined with careful initialization, was enough to train deep
        networks that had previously required exotic pre-training tricks.
        The form below is the classical (Polyak) update, evaluating the
        gradient at the current parameters; Nesterov's original formulation
        instead evaluates it at a look-ahead point nudged by the existing
        velocity, a distinction that matters more for convergence
        guarantees than for the qualitative behavior shown in this chapter.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  v_t &\\leftarrow \\beta\\, v_{t-1} + \\eta\\, \\nabla_\\theta L(\\theta) \\\\
  \\theta &\\leftarrow \\theta - v_t
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"v_t"}</InlineMath> is the velocity — an exponential moving average of
        recent gradients — <InlineMath>{"\\beta"}</InlineMath> (typically 0.9) controls how much past
        velocity carries over, and <InlineMath>{"\\eta"}</InlineMath> is the same learning rate as plain
        gradient descent.
      </p>

      <MomentumRavine />

      <p style={prose}>
        The adaptive lineage runs AdaGrad → RMSProp → Adam → AdamW. AdaGrad
        (Duchi et al. 2011) [7] introduced the idea of a per-parameter
        learning rate, dividing each parameter's update by the square root
        of the sum of all past squared gradients — beautiful in convex or
        sparse settings, fatal in the non-convex (having multiple local
        minima, unlike a bowl-shaped convex loss with exactly one)
        landscapes of deep learning, because the denominator grows
        monotonically and the effective learning rate decays to zero,
        stalling training. RMSProp (Hinton's unpublished
        Coursera lecture, circa 2012) fixed this by replacing the running
        sum with an exponential moving average, so old gradients fade out of
        the denominator instead of accumulating forever. Adam (Kingma & Ba
        2015) [8] then combined RMSProp's adaptive scaling with momentum
        and added bias correction for the cold-start steps.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  m_t &= \\beta_1 m_{t-1} + (1-\\beta_1)\\, g_t, \\qquad v_t = \\beta_2 v_{t-1} + (1-\\beta_2)\\, g_t^2 \\\\
  \\hat{m}_t &= \\frac{m_t}{1 - \\beta_1^t}, \\qquad\\ \\hat{v}_t = \\frac{v_t}{1 - \\beta_2^t} \\\\
  \\theta &\\leftarrow \\theta - \\eta \\cdot \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\varepsilon}
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"g_t"}</InlineMath> is the gradient at step <InlineMath>{"t"}</InlineMath>; <InlineMath>{"m_t"}</InlineMath> and{" "}
        <InlineMath>{"v_t"}</InlineMath> are exponential moving averages of the gradient and its
        square, decaying at rates <InlineMath>{"\\beta_1"}</InlineMath> and <InlineMath>{"\\beta_2"}</InlineMath>; and{" "}
        <InlineMath>{"\\hat{m}_t"}</InlineMath>, <InlineMath>{"\\hat{v}_t"}</InlineMath> are those same quantities rescaled to
        correct for their zero initialization, the subject of the Adam
        Internals section below. (Adam's <InlineMath>{"v_t"}</InlineMath> denotes a second-moment
        estimate, not the velocity <InlineMath>{"v_t"}</InlineMath> in the momentum update above — the
        shared letter is a notational coincidence between the two original
        papers.)
      </p>

      <p style={prose}>
        AdamW is the modern default, but it took years to get there. Adam has
        one subtle defect: when L2 regularization is added as <InlineMath>{"\\lambda \\|\\theta\\|^2"}</InlineMath> to the
        loss, the gradient of that term gets scaled by Adam's per-parameter{" "}
        <InlineMath>{"1/\\sqrt{\\hat{v}}"}</InlineMath> factor — which is not the same as classical weight decay.
        Loshchilov & Hutter (2019) [9] showed that this scaling
        materially hurts performance and proposed AdamW, which decouples
        weight decay from the gradient and applies it directly to the
        parameters as <InlineMath>{"\\theta \\leftarrow (1 - \\eta \\lambda)\\, \\theta"}</InlineMath> at each step. AdamW is now the
        standard optimizer for transformer training — transformers being the
        attention-based sequence architecture covered in Chapters 9 and
        10 — and nearly every large language model of the past five years
        uses it.
      </p>

      <p style={prose}>
        Going deeper, AdamW has not been the final word since 2019. Lion
        (Chen et al. 2023) [10], discovered by large-scale symbolic search
        over update rules rather than hand design, replaces Adam's moment
        ratio with the sign of a momentum term and has matched or beaten
        AdamW on several large-scale runs at lower memory cost. Sophia
        (Liu et al. 2023) [11] instead adds a cheap, infrequently-updated
        estimate of the Hessian — the matrix of the loss's second
        derivatives with respect to every pair of parameters — to
        approximate curvature without paying full second-order cost, while
        Shampoo (Gupta et al. 2018) [12] captures curvature a different
        way, preconditioning each tensor dimension of a weight matrix
        separately rather than treating every parameter independently. A
        third lineage optimizes for memory rather than curvature: Adafactor
        (Shazeer & Stern 2018) [13] factors Adam's second-moment estimate
        into row and column statistics instead of storing it in full, and
        8-bit optimizers (Dettmers et al. 2022) [14] quantize the running
        statistics themselves — both exist because Adam's two extra numbers
        per parameter become the binding memory constraint once a model
        reaches billions of parameters.
      </p>

      <p style={prose}>
        The newest entrant is Muon, formalized and scaled up by Liu et al.
        (2025) [15]: instead of Adam's per-parameter rescaling, it
        orthogonalizes each weight matrix's momentum update using a few
        iterations of the Newton-Schulz method, and now trains the
        hidden-layer weight matrices of several frontier models — Moonshot
        AI's Kimi K2 among them — alongside AdamW for everything else.
      </p>

      <p style={prose}>
        Select the Ravine surface below and press Play; notice SGD (gray)
        stall around a loss of about 0.45 while RMSProp (purple) and Adam
        (teal) race ahead to losses near 0.05 and 0.02 by step 200, with
        momentum (orange) in between around 0.21.
      </p>

      <OptimizerRace
        tryThis={{
          do: "Select the Ravine surface and press Play.",
          notice:
            "SGD (gray) stalls around a loss of 0.45 while RMSProp (purple) and Adam (teal) race ahead to losses near 0.05 and 0.02 by step 200, with momentum (orange) in between around 0.21.",
        }}
      />

      {/* ── Section 3: Loss Landscapes ───────────────────────────────────── */}
      <div id="loss-landscapes">
        <SectionTitle>Loss Landscapes</SectionTitle>
      </div>

      <p style={prose}>
        Real loss surfaces are highly non-convex: they contain ridges,
        plateaus, curved ravines, and isolated valleys, making it
        computationally intractable to verify that any point found during
        training is the global minimum. In high-dimensional parameter
        spaces, saddle points — critical points where the gradient vanishes
        but the Hessian, the matrix of the loss's second derivatives with
        respect to every pair of parameters, has at least one negative
        eigenvalue (a direction of downward curvature) — vastly outnumber
        true local minima, yet gradient noise often helps optimizers escape
        them naturally. In practice, the many local minima that gradient
        methods do reach in over-parameterized networks tend to be nearly
        as good as each other and are often connected by paths of
        near-constant low loss, a finding usually called mode connectivity
        [26]. Flat minima, where the loss surface is shallow in all
        directions, tend to generalize better than sharp minima: small
        perturbations to a flat minimum produce only small changes in loss,
        correlating with better robustness to distribution shift.
      </p>

      <p style={prose}>
        The dominance of saddle points over genuine minima becomes
        mathematically inevitable in high dimensions, as Dauphin et al.
        (2014) [17] made precise. For a critical point to be a minimum in{" "}
        <InlineMath>{"N"}</InlineMath>-dimensional space, all <InlineMath>{"N"}</InlineMath> Hessian eigenvalues must be positive;
        under reasonable randomness assumptions this is exponentially
        unlikely, with the probability that a random critical point is a
        minimum dropping roughly as <InlineMath>{"2^{-N}"}</InlineMath>. Almost every gradient-zero point
        in a deep network's parameter space — where <InlineMath>{"N"}</InlineMath> is in the millions —
        is a saddle, not a local minimum. The empirical fact that SGD still
        escapes them comes down to gradient noise: any non-zero curvature in
        a negative direction is amplified stochastically and pulls the
        optimizer off the saddle within a few steps.
      </p>

      <p style={prose}>
        Going deeper: the Hessian's curvature information could in
        principle be used directly — Newton's method and natural-gradient
        methods such as K-FAC [27] precondition each step by the local
        curvature, converging in far fewer steps than gradient descent
        alone. Neither is practical at neural-network scale: storing the
        full Hessian costs <InlineMath>{"O(N^2)"}</InlineMath> memory and inverting it costs{" "}
        <InlineMath>{"O(N^3)"}</InlineMath> time, both impossible once <InlineMath>{"N"}</InlineMath> reaches the millions or
        billions of parameters typical of modern networks. Sophia and
        Shampoo, introduced above, are the practical compromise — cheap
        diagonal or block-structured estimates of curvature rather than
        the real thing.
      </p>

      <p style={prose}>
        Visualizing high-dimensional loss surfaces is genuinely hard — we
        can only see 2D slices, and naive slices distort the geometry. Li
        et al. (2018) [16] introduced "filter normalization" to make slices
        visually comparable across architectures, then used the technique to
        show that residual connections (the skip-connection design covered
        in Chapter 6) produce dramatically smoother landscapes: a ResNet's
        loss surface around its solution looks nearly convex, while the
        same network with the skip connections removed shows chaotic,
        ridge-filled terrain. This is one of the cleanest empirical
        pictures we have for why residual networks train so well — they
        restructure the optimization problem before any optimizer touches
        it.
      </p>

      <FlatVsSharpMinima />

      <p style={prose}>
        The flat-versus-sharp framing has a direct practical consequence:
        Sharpness-Aware Minimization (SAM, Foret et al. 2021) [18] modifies
        the optimization objective itself, first perturbing the parameters
        toward the worst nearby point within a small neighborhood, then
        descending using the gradient measured there — a min-max
        formulation that explicitly seeks out flat regions rather than
        hoping gradient noise finds them incidentally. The framing needs
        one caveat, though: Dinh et al. (2017) [19] showed that a network's
        sharpness is not invariant to reparameterization — rescaling
        weights between layers in a way that leaves the computed function
        unchanged can make a minimum look arbitrarily sharper or flatter —
        so "flat generalizes better" claims should be read as a correlation
        observed under standard parameterizations, not a
        parameterization-independent law.
      </p>

      {/* ── Section 4: Learning Rate Schedules ───────────────────────────── */}
      <div id="lr-schedules">
        <SectionTitle>Learning Rate Schedules</SectionTitle>
      </div>

      <p style={prose}>
        Before scheduling how the learning rate changes over training, it
        helps to first find a starting value that actually converges. An
        LR range test sweeps the learning rate from tiny to huge over a
        handful of training steps and records where the resulting loss
        stays low, goes high, turns unstable, or diverges outright — cheap
        enough to run before committing to a full training run, and often
        the fastest way to locate a usable starting point for whatever
        schedule follows.
      </p>

      <p style={prose}>
        Select the Ravine surface below and drag the learning-rate slider
        from its low end toward its high end; notice the zone label move
        from "unstable" through "high" into a green "good" band from about{" "}
        <InlineMath>{"3.9\\times10^{-4}"}</InlineMath> to 0.036, then flicker between "good," "high,"
        and "unstable" as ripples in the surface make the outcome noisy,
        before settling into "diverged" for good once the rate crosses
        about 0.49.
      </p>

      <LRFinder
        tryThis={{
          do: "Select the Ravine surface and drag the learning-rate slider from low to high.",
          notice:
            'The zone label moves from "unstable" through "high" into a green "good" band from about 3.9×10⁻⁴ to 0.036, then flickers between "good," "high," and "unstable" as ripples in the surface make the outcome noisy, before settling into "diverged" for good once the rate crosses about 0.49.',
        }}
      />

      <p style={prose}>
        Learning rate is widely regarded as the single most sensitive
        hyperparameter: too high and updates overshoot the loss basin,
        diverging rapidly; too low and training stalls in whatever region the
        network starts in. Linear warmup holds the learning rate at a low
        value for the first few hundred steps, giving the optimizer time to
        build up reliable gradient estimates before large updates can disrupt
        early representation formation. Cosine annealing then decays the
        learning rate smoothly from its peak to near zero following a
        half-cosine curve [20], avoiding the abrupt drops of step-decay
        schedules and allowing the optimizer to settle tightly into a minimum
        at the end of training.
      </p>

      <MathBlock>{"$$\\eta_t = \\eta_{\\min} + \\tfrac{1}{2}(\\eta_{\\max} - \\eta_{\\min})\\bigl(1 + \\cos(\\pi t / T)\\bigr)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"t"}</InlineMath> is the current training step, <InlineMath>{"T"}</InlineMath> the total number of
        steps in the cycle, and <InlineMath>{"\\eta_{\\min}"}</InlineMath> / <InlineMath>{"\\eta_{\\max}"}</InlineMath> the schedule's
        floor and peak learning rates.
      </p>

      <p style={prose}>
        Warmup is non-negotiable for transformer training, but not for the
        reason the raw numbers suggest: bias correction, established above,
        means Adam's corrected step size is never actually near zero or
        undersized at step 1. The real risk is that early moment estimates
        are built from only a handful of gradients, so they are noisy and
        unrepresentative of the loss landscape the network will train on
        for the rest of the run, while the corrected step size is still
        large enough to overshoot a freshly-initialized network whose
        representations are still close to random. Large early updates
        under these conditions can destabilize training irrecoverably,
        producing a sudden spike in the loss curve partway through a run
        that forces practitioners to restart from an earlier checkpoint
        with a lower rate. Linear warmup, typically over the first few
        hundred to few thousand steps, holds the learning rate low while
        the moment estimates accumulate enough history to become
        representative before allowing full step sizes. The trick was used
        in the original transformer (Vaswani et al. 2017) [21] and has been
        standard ever since.
      </p>

      <p style={prose}>
        SGDR (Loshchilov & Hutter 2017) [20] paired the cosine annealing
        shape introduced above with periodic warm restarts: when the
        schedule reaches its minimum, the learning rate snaps back to peak
        and another cosine begins.
        Restarts can help the optimizer escape sharp minima found in earlier
        cycles, though for modern transformer pretraining a single
        warmup-then-cosine schedule has become more common — restarts
        complicate the loss-curve signal that practitioners use to judge
        training health.
      </p>

      <p style={prose}>
        Leslie Smith's one-cycle policy (Smith & Topin 2019) [22] goes the
        other direction: a single aggressive warmup-and-cooldown cycle with
        a larger peak learning rate than would otherwise be stable, often
        combined with cyclical momentum that runs in the opposite phase. On
        smaller benchmarks the policy produces "super-convergence" — final
        accuracy in a fraction of the usual epochs — and remains a
        practical recipe outside large-scale pretraining, where the
        simplicity of warmup-then-cosine usually wins.
      </p>

      <p style={prose}>
        Two more recent schedules address a specific pain point: committing
        to a schedule shape requires knowing the total step count in
        advance, which is awkward when a training run gets extended or
        restarted. Warmup-Stable-Decay (WSD, Hu et al. 2024) [23] resolves
        this by holding the learning rate at its peak through a long stable
        phase — most of training — and applying a short, steep decay only
        once the run is actually ending; any checkpoint saved during the
        stable phase is a valid starting point for a longer or shorter run,
        since no schedule shape has been committed to yet.
      </p>

      <p style={prose}>
        Schedule-free optimization (Defazio et al. 2024) [24] removes the
        commitment entirely: it replaces both warmup and decay with a
        particular running average of the iterates themselves, requiring no
        schedule and no advance knowledge of the total step count, while
        matching or beating tuned cosine schedules across a range of tasks.
      </p>

      <p style={prose}>
        Drag "current step t" below to 250, the halfway point of the
        default 500-step schedule; notice OneCycleLR (purple) has climbed
        to about 0.1 — ten times the base learning rate — while Step decay
        (gray) and Cosine (teal) have already decayed to at or below their
        starting value.
      </p>

      <LRSchedule
        tryThis={{
          do: "Drag \"current step t\" to 250, the halfway point of the default 500-step schedule.",
          notice:
            "OneCycleLR (purple) has climbed to about 0.1 — ten times the base learning rate — while Step decay (gray) and Cosine (teal) have already decayed to at or below their starting value.",
        }}
      />

      {/* ── Section 5: Adam Internals ─────────────────────────────────────── */}
      <div id="adam-internals">
        <SectionTitle>Adam Internals</SectionTitle>
      </div>

      <p style={prose}>
        Adam maintains two running estimates per parameter: the first moment{" "}
        <InlineMath>{"\\hat{m}_t"}</InlineMath> tracks the mean direction of recent gradients, while the second
        moment <InlineMath>{"\\hat{v}_t"}</InlineMath> tracks their uncentered variance — the average of
        the squared gradient values themselves, rather than the spread
        around their mean — together determining an effective
        per-parameter learning rate that adapts continuously to gradient
        history. Both estimates are initialized at zero and divided
        by <InlineMath>{"(1 - \\beta^t)"}</InlineMath> to correct for the resulting cold-start bias [8] — how
        quickly that correction fades depends heavily on <InlineMath>{"\\beta"}</InlineMath>, as the next
        paragraph works out concretely.
      </p>

      <p style={prose}>
        The Kingma & Ba defaults — <InlineMath>{"\\beta_1 = 0.9"}</InlineMath>, <InlineMath>{"\\beta_2 = 0.999"}</InlineMath>, <InlineMath>{"\\varepsilon = 10^{-8}"}</InlineMath> — have
        proven remarkably robust across architectures and tasks. <InlineMath>{"\\beta_1 = 0.9"}</InlineMath>{" "}
        means the first moment is an EMA with an effective window of roughly
        10 steps; <InlineMath>{"\\beta_2 = 0.999"}</InlineMath> means the second moment averages over roughly
        1,000 steps. Both estimates start at zero, so both are biased
        toward zero in early steps — but not by the same amount, and the
        mismatch matters. At step 1 with gradient <InlineMath>{"g_1"}</InlineMath>, the uncorrected
        first moment is <InlineMath>{"m_1 = (1-\\beta_1)\\,g_1 = 0.1\\,g_1"}</InlineMath>, while the uncorrected
        second moment is <InlineMath>{"v_1 = (1-\\beta_2)\\,g_1^2 = 0.001\\,g_1^2"}</InlineMath>. Since the update
        divides the first by the square root of the second, the uncorrected
        step ratio is <InlineMath>{"m_1/\\sqrt{v_1} = 0.1\\,g_1 / (\\sqrt{0.001}\\,|g_1|) \\approx 3.16 \\cdot \\text{sign}(g_1)"}</InlineMath> — more
        than three times larger than the bias-corrected ratio{" "}
        <InlineMath>{"\\hat{m}_1/\\sqrt{\\hat{v}_1} = \\text{sign}(g_1)"}</InlineMath>, because <InlineMath>{"v_1"}</InlineMath>'s bias sits
        inside a square root while <InlineMath>{"m_1"}</InlineMath>'s does not. Left uncorrected, Adam's
        first real step would be oversized, not undersized — the opposite
        of what the raw first-moment number alone suggests — which is why
        bias correction exists: it rescales the early steps back down to
        the steady-state size rather than rescuing a slow start.
      </p>

      <p style={prose}>
        The two correction factors also fade at very different rates,
        because <InlineMath>{"\\beta_1"}</InlineMath> and <InlineMath>{"\\beta_2"}</InlineMath> differ by two orders of magnitude in how
        much history they retain. For <InlineMath>{"\\beta_1 = 0.9"}</InlineMath>, the correction{" "}
        <InlineMath>{"1/(1-\\beta_1^t)"}</InlineMath> drops below 1.1× — a 10% adjustment — once{" "}
        <InlineMath>{"t"}</InlineMath> exceeds roughly 23 steps. For <InlineMath>{"\\beta_2 = 0.999"}</InlineMath>, that same 10%
        threshold isn't crossed until <InlineMath>{"t"}</InlineMath> exceeds roughly 2,400 steps —
        even at step 100, <InlineMath>{"1-0.999^{100} \\approx 0.095"}</InlineMath>, so the second-moment
        correction is still a factor of about 10.5×, far from negligible.
        In practice this means the first-moment correction disappears
        almost immediately, while the second-moment correction keeps
        mattering for thousands of steps into training.
      </p>

      <AdamUnpacking />

      <p style={prose}>
        Set the gradient pattern to Constant and drag step t down to 1;
        notice <InlineMath>{"m_t = 0.05000"}</InlineMath> and <InlineMath>{"v_t = 0.000250"}</InlineMath> give an uncorrected
        ratio of about 3.16, while the bias-corrected{" "}
        <InlineMath>{"\\hat{m}_t = 0.50000"}</InlineMath> and <InlineMath>{"\\hat{v}_t = 0.250000"}</InlineMath> give exactly 1 — the
        same gap worked out in the paragraph above.
      </p>

      <AdamInternals
        tryThis={{
          do: "Set the gradient pattern to Constant and drag step t down to 1.",
          notice:
            "mₜ = 0.05000 and vₜ = 0.000250 give an uncorrected ratio of about 3.16, while the bias-corrected m̂ₜ = 0.50000 and v̂ₜ = 0.250000 give exactly 1 — the same gap worked out in the paragraph above.",
        }}
      />

      <p style={prose}>
        The effective per-parameter learning rate <InlineMath>{"\\eta \\cdot \\hat{m}_t / \\sqrt{\\hat{v}_t}"}</InlineMath> makes Adam
        roughly invariant to gradient scale — large-gradient parameters get
        small steps and vice versa, automatically — which is why Adam needs
        much less learning-rate tuning than SGD. The cost is
        well-documented: on many vision benchmarks, Adam-trained networks
        generalize slightly worse than SGD-with-momentum-trained ones
        (Wilson et al. 2017) [25], and the cause is still actively debated.
        Despite this, Adam and AdamW are the universal default for sequence
        models, where SGD reliably fails to train transformers — the
        adaptive scaling is essentially required to handle the very
        different gradient magnitudes across the attention mechanism
        (Chapter 9), token embeddings, and bias terms.
      </p>

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        This chapter's vocabulary is assumed everywhere from here on: SGD
        as the noisy baseline, momentum and Adam/AdamW as the
        adaptive-scaling lineage that replaced hand-tuned per-parameter
        rates, and warmup followed by cosine decay (or, increasingly, WSD)
        as the default schedule shape. Keep the noise ball and the
        loss-landscape picture in mind too — they are why a single
        training run's final loss is not a precise number but a
        distribution, and why comparing two models fairly means comparing
        several runs, not one. The optimizer question is now settled enough
        that later chapters treat "pick AdamW, warm up, decay" as a default
        worth stating once and reusing; what changes chapter to chapter is
        what gets fed into that loop. Chapter 5 (Training Techniques) picks
        up from here, covering normalization, regularization, and
        initialization — techniques that make the optimizer's job easier
        without changing the update rule itself.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
