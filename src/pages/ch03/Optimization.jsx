import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import GradientDescentNavigator from "../../components/widgets/ch03/GradientDescentNavigator";
import OptimizerRace from "../../components/widgets/ch03/OptimizerRace";
import LRFinder from "../../components/widgets/ch03/LRFinder";
import LRSchedule from "../../components/widgets/ch03/LRSchedule";
import AdamInternals from "../../components/widgets/ch03/AdamInternals";
import GradientDescentGeometry from "../../components/diagrams/ch03/GradientDescentGeometry";
import MomentumRavine from "../../components/diagrams/ch03/MomentumRavine";
import FlatVsSharpMinima from "../../components/diagrams/ch03/FlatVsSharpMinima";
import AdamUnpacking from "../../components/diagrams/ch03/AdamUnpacking";

// ─── Prose styles ─────────────────────────────────────────────────────────────
const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

// ─── Citations data ───────────────────────────────────────────────────────────
const CITATIONS = [
  {
    num: 1,
    title: "Adam: A Method for Stochastic Optimization",
    authors: "Kingma & Ba",
    venue: "ICLR",
    year: "2015",
    tag: "seminal",
  },
  {
    num: 2,
    title: "Decoupled Weight Decay Regularization (AdamW)",
    authors: "Loshchilov & Hutter",
    venue: "ICLR",
    year: "2019",
    tag: "paper",
  },
  {
    num: 3,
    title: "On the Importance of Initialization and Momentum in Deep Learning",
    authors: "Sutskever, Martens, Dahl, Hinton",
    venue: "ICML",
    year: "2013",
    tag: "seminal",
  },
  {
    num: 4,
    title: "Visualizing the Loss Landscape of Neural Nets",
    authors: "Li, Xu, Taylor, Studer, Goldstein",
    venue: "NeurIPS",
    year: "2018",
    tag: "paper",
  },
  {
    num: 5,
    title: "SGDR: Stochastic Gradient Descent with Warm Restarts",
    authors: "Loshchilov & Hutter",
    venue: "ICLR",
    year: "2017",
    tag: "paper",
  },
  {
    num: 6,
    title: "Adaptive Subgradient Methods for Online Learning and Stochastic Optimization (AdaGrad)",
    authors: "Duchi, Hazan, Singer",
    venue: "JMLR",
    year: "2011",
    tag: "seminal",
  },
];

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
        Chapter 03 · Part I — Foundations
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
        Optimization
      </h1>

      <ChapterLede>
        Training a neural network means navigating a high-dimensional loss
        landscape. Gradient descent is the compass — but the choice of
        optimizer, learning rate, and schedule determines whether you reach a
        good minimum or get lost along the way.
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

      <GradientDescentGeometry />

      <p style={prose}>
        The stochastic estimate is unbiased — its expectation equals the true
        full-batch gradient — but the per-step variance is high. Two
        consequences follow. First, the loss curve during training is jagged
        rather than monotonic; this is typical, not a bug. Second, SGD never
        converges to a single point. It wanders within a noise ball around
        the minimum whose radius scales roughly as <InlineMath>{"\\eta \\cdot \\sqrt{\\text{variance} / \\text{batch\\_size}}"}</InlineMath>.
        Tight convergence requires a decaying learning rate; in practice most
        modern training anneals near the end and accepts the noise ball as
        the operating point. The noise itself does useful work — it can knock
        the optimizer out of sharp minima toward flatter ones, a phenomenon
        explored in the loss-landscape section below.
      </p>

      <p style={prose}>
        Batch size is therefore not just a compute knob but a regularization
        knob. Smaller batches mean higher gradient noise, which acts as
        implicit regularization and often improves generalization — Keskar
        et al. (2017) documented a "generalization gap" for large-batch
        training on ImageNet, where very large batches converged to sharper
        minima and tested slightly worse despite matching training loss.
        Larger batches mean lower noise but require proportionally larger
        learning rates to maintain the same effective step size — the linear
        scaling rule of Goyal et al. (2017). Modern recipes split along these
        lines: small batches (32–256) with SGD for vision benchmarks; very
        large batches (millions of tokens) with Adam or AdamW for language
        model pretraining, with linear warmup to keep the early steps from
        destabilizing.
      </p>

      <GradientDescentNavigator />

      {/* ── Section 2: Momentum & Adaptive Methods ───────────────────────── */}
      <div id="momentum-adaptive">
        <SectionTitle>Momentum & Adaptive Methods</SectionTitle>
      </div>

      <p style={prose}>
        The momentum idea predates deep learning by decades — Polyak's
        "heavy ball" method (1964) and Nesterov's accelerated gradient (1983)
        both add a velocity term to gradient descent, smoothing oscillations
        across noisy directions and accelerating along consistently downhill
        ones. Sutskever, Martens, Dahl & Hinton (2013) [3] was the empirical
        revelation for neural networks: properly tuned momentum, combined
        with careful initialization, was enough to train deep networks that
        had previously required exotic pre-training tricks. Their reframing
        of Nesterov momentum — gradient computed at the look-ahead position
        rather than the current one — remains the standard implementation
        today.
      </p>

      <p style={prose}>
        The adaptive lineage runs AdaGrad → RMSProp → Adam → AdamW. AdaGrad
        (Duchi, Hazan & Singer 2011) [6] introduced the idea of a
        per-parameter learning rate, dividing each parameter's update by the
        square root of the sum of all past squared gradients — beautiful in
        convex or sparse settings, fatal in non-convex deep learning because
        the denominator grows monotonically and the effective learning rate
        decays to zero, stalling training. RMSProp (Hinton's unpublished
        Coursera lecture, circa 2012) fixed this by replacing the running
        sum with an exponential moving average, so old gradients fade out of
        the denominator instead of accumulating forever. Adam (Kingma & Ba
        2015) [1] then combined RMSProp's adaptive scaling with momentum
        and added bias correction for the cold-start steps.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\hat{m}_t &= \\frac{m_t}{1 - \\beta_1^t} \\qquad \\hat{v}_t = \\frac{v_t}{1 - \\beta_2^t} \\\\
  \\theta &\\leftarrow \\theta - \\eta \\cdot \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\varepsilon}
\\end{aligned}$$`}</MathBlock>

      <MomentumRavine />

      <p style={prose}>
        AdamW is the modern default, but it took years to get there. Adam has
        one subtle defect: when L2 regularization is added as <InlineMath>{"\\lambda \\|\\theta\\|^2"}</InlineMath> to the
        loss, the gradient of that term gets scaled by Adam's per-parameter
        <InlineMath>{"1/\\sqrt{\\hat{v}}"}</InlineMath> factor — which is not the same as classical weight decay.
        Loshchilov & Hutter (2019) [2] showed that this scaling
        materially hurts performance and proposed AdamW, which decouples
        weight decay from the gradient and applies it directly to the
        parameters as <InlineMath>{"\\theta \\leftarrow (1 - \\eta \\lambda)\\, \\theta"}</InlineMath> at each step. AdamW is now the
        standard optimizer for transformer training; nearly every large
        language model in the past five years uses it.
      </p>

      <OptimizerRace />

      {/* ── Section 3: Loss Landscapes ───────────────────────────────────── */}
      <div id="loss-landscapes">
        <SectionTitle>Loss Landscapes</SectionTitle>
      </div>

      <p style={prose}>
        Real loss surfaces are highly non-convex: they contain ridges,
        plateaus, curved ravines, and isolated valleys, making the global
        minimum in principle unreachable by any local method. In
        high-dimensional parameter spaces, first-order saddle points — where
        the gradient vanishes but the Hessian has at least one negative
        eigenvalue — vastly outnumber true local minima, yet gradient noise
        often helps optimizers escape them naturally. Flat minima, where the
        loss surface is shallow in all directions, tend to generalize better
        than sharp minima: small perturbations to a flat minimum produce only
        small changes in loss, correlating with better robustness to
        distribution shift [4].
      </p>

      <p style={prose}>
        The dominance of saddle points over genuine minima becomes
        mathematically inevitable in high dimensions, as Dauphin et al.
        (2014) made precise. For a critical point to be a minimum in
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
        Visualizing high-dimensional loss surfaces is genuinely hard — you
        can only see 2D slices, and naive slices distort the geometry. Li
        et al. (2018) [4] introduced "filter normalization" to make slices
        visually comparable across architectures, then used the technique to
        show that residual connections produce dramatically smoother
        landscapes: a ResNet's loss surface around its solution looks
        nearly convex, while the same network with skip connections removed
        shows chaotic, ridge-filled terrain. This is one of the cleanest
        empirical pictures we have for why residual networks train so well —
        they restructure the optimization problem before any optimizer
        touches it.
      </p>

      <FlatVsSharpMinima />

      <LRFinder />

      {/* ── Section 4: Learning Rate Schedules ───────────────────────────── */}
      <div id="lr-schedules">
        <SectionTitle>Learning Rate Schedules</SectionTitle>
      </div>

      <p style={prose}>
        Learning rate is widely regarded as the single most sensitive
        hyperparameter: too high and updates overshoot the loss basin,
        diverging rapidly; too low and training stalls in whatever region the
        network starts in. Linear warmup holds the learning rate at a low
        value for the first few hundred steps, giving the optimizer time to
        build up reliable gradient estimates before large updates can disrupt
        early representation formation. Cosine annealing then decays the
        learning rate smoothly from its peak to near zero following a
        half-cosine curve [5], avoiding the abrupt drops of step-decay
        schedules and allowing the optimizer to settle tightly into a minimum
        at the end of training.
      </p>

      <MathBlock>{"$$\\eta_t = \\eta_{\\min} + \\tfrac{1}{2}(\\eta_{\\max} - \\eta_{\\min})\\bigl(1 + \\cos(\\pi t / T)\\bigr)$$"}</MathBlock>

      <p style={prose}>
        Warmup is non-negotiable for transformer training. At step 0, Adam's
        second-moment estimate <InlineMath>{"\\hat{v}"}</InlineMath> is near zero and noisy, which makes the
        effective per-parameter learning rate <InlineMath>{"\\eta / \\sqrt{\\hat{v}}"}</InlineMath> enormous and chaotic.
        Combined with a freshly-initialized network whose representations
        are still random, large early updates can destabilize training
        irrecoverably — the loss-spike failure mode familiar to anyone who
        has trained a transformer. Linear warmup, typically over the first
        few hundred to few thousand steps, gives <InlineMath>{"\\hat{v}"}</InlineMath> time to accumulate
        before allowing full step sizes. The trick was used in the original
        Transformer (Vaswani et al. 2017) and has been standard ever since.
      </p>

      <p style={prose}>
        SGDR (Loshchilov & Hutter 2017) [5] extended cosine annealing
        with periodic warm restarts: when the schedule reaches its minimum,
        the learning rate snaps back to peak and another cosine begins.
        Restarts can help the optimizer escape sharp minima found in earlier
        cycles, though for modern transformer pretraining a single
        warmup-then-cosine schedule has become more common — restarts
        complicate the loss-curve signal that practitioners use to judge
        training health.
      </p>

      <p style={prose}>
        Leslie Smith's one-cycle policy goes the other direction: a single
        aggressive warmup-and-cooldown cycle with a larger peak learning
        rate than would otherwise be stable, often combined with cyclical
        momentum that runs in the opposite phase. On smaller benchmarks the
        policy produces "super-convergence" — final accuracy in a fraction
        of the usual epochs — and remains a practical recipe outside
        large-scale pretraining, where the simplicity of warmup-then-cosine
        usually wins.
      </p>

      <LRSchedule />

      {/* ── Section 5: Adam Internals ─────────────────────────────────────── */}
      <div id="adam-internals">
        <SectionTitle>Adam Internals</SectionTitle>
      </div>

      <p style={prose}>
        Adam maintains two running estimates per parameter: the first moment
        <InlineMath>{"\\hat{m}_t"}</InlineMath> tracks the mean direction of recent gradients, while the second
        moment <InlineMath>{"\\hat{v}_t"}</InlineMath> tracks their uncentered variance — together determining an
        effective per-parameter learning rate that adapts continuously to
        gradient history. Both estimates are initialized at zero and divided
        by <InlineMath>{"(1 - \\beta^t)"}</InlineMath> to correct for cold-start bias in the first few steps,
        after which the correction factor becomes negligible and Adam behaves
        like a fully adaptive method [1].
      </p>

      <p style={prose}>
        The Kingma & Ba defaults — <InlineMath>{"\\beta_1 = 0.9"}</InlineMath>, <InlineMath>{"\\beta_2 = 0.999"}</InlineMath>, <InlineMath>{"\\varepsilon = 10^{-8}"}</InlineMath> — have
        proven remarkably robust across architectures and tasks. <InlineMath>{"\\beta_1 = 0.9"}</InlineMath>
        means the first moment is an EMA with an effective window of roughly
        10 steps; <InlineMath>{"\\beta_2 = 0.999"}</InlineMath> means the second moment averages over roughly
        1000 steps. The bias correction matters most at the very beginning:
        at step 1, the uncorrected <InlineMath>{"m_1"}</InlineMath> equals <InlineMath>{"(1 - \\beta_1)\\, g_1 = 0.1\\, g_1"}</InlineMath> — a tenth
        of the true gradient, which would make the network learn ten times
        too slowly. Dividing by <InlineMath>{"1 - \\beta_1^t"}</InlineMath> restores <InlineMath>{"\\hat{m}_1"}</InlineMath> to approximately <InlineMath>{"g_1"}</InlineMath>.
        By step 100 or so, the correction factor is negligible and Adam runs
        in its steady-state regime.
      </p>

      <p style={prose}>
        The effective per-parameter learning rate <InlineMath>{"\\eta \\cdot \\hat{m}_t / \\sqrt{\\hat{v}_t}"}</InlineMath> makes Adam
        roughly invariant to gradient scale — large-gradient parameters get
        small steps and vice versa, automatically — which is why Adam needs
        much less learning-rate tuning than SGD. The cost is
        well-documented: on many vision benchmarks, Adam-trained networks
        generalize slightly worse than SGD-with-momentum-trained ones
        (Wilson et al. 2017), and the cause is still actively debated.
        Despite this, Adam and AdamW are the universal default for sequence
        models, where SGD reliably fails to train transformers — the
        adaptive scaling is essentially required to handle the very
        different gradient magnitudes across attention layers, embeddings,
        and biases.
      </p>

      <AdamUnpacking />

      <AdamInternals />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
