import { useTocSections } from "../../components/layout/TocContext";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import UniversalApproximation from "../../components/widgets/ch03/UniversalApproximation";
import ComputationGraph from "../../components/widgets/ch03/ComputationGraph";
import ActivationZoo from "../../components/widgets/ch03/ActivationZoo";
import LossFunctions from "../../components/widgets/ch03/LossFunctions";
import ForwardPassSchematic from "../../components/diagrams/ch03/ForwardPassSchematic";
import BackpropFlow from "../../components/diagrams/ch03/BackpropFlow";
import ActivationGradients from "../../components/diagrams/ch03/ActivationGradients";
import FocalLossModulation from "../../components/diagrams/ch03/FocalLossModulation";

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
const CITATIONS = buildCitations([
  {
    title: "Approximation by Superpositions of a Sigmoidal Function",
    authors: "Cybenko",
    venue: "Mathematics of Control, Signals and Systems",
    year: "1989",
    tag: "seminal",
  },
  {
    title: "Multilayer Feedforward Networks With a Nonpolynomial Activation Function Can Approximate Any Function",
    authors: "Leshno, Lin, Pinkus, Schocken",
    venue: "Neural Networks",
    year: "1993",
    tag: "seminal",
  },
  {
    title: "Deep Learning",
    authors: "Goodfellow, Bengio, Courville",
    venue: "MIT Press",
    year: "2016",
    tag: "survey",
  },
  {
    title: "Benefits of Depth in Neural Networks",
    authors: "Telgarsky",
    venue: "COLT (PMLR)",
    year: "2016",
    tag: "paper",
  },
  {
    title: "On the Number of Linear Regions of Deep Neural Networks",
    authors: "Montufar, Pascanu, Cho, Bengio",
    venue: "NeurIPS",
    year: "2014",
    tag: "paper",
  },
  {
    title: "Beyond Regression: New Tools for Prediction and Analysis in the Behavioral Sciences",
    authors: "Werbos",
    venue: "PhD thesis, Harvard University",
    year: "1974",
    tag: "seminal",
  },
  {
    title: "Learning Representations by Back-propagating Errors",
    authors: "Rumelhart, Hinton, Williams",
    venue: "Nature",
    year: "1986",
    tag: "seminal",
  },
  {
    title: "Rectified Linear Units Improve Restricted Boltzmann Machines",
    authors: "Nair, Hinton",
    venue: "ICML",
    year: "2010",
    tag: "paper",
  },
  {
    title: "Gaussian Error Linear Units (GELUs)",
    authors: "Hendrycks, Gimpel",
    venue: "arXiv",
    year: "2016",
    tag: "paper",
  },
  {
    title: "Searching for Activation Functions (Swish)",
    authors: "Ramachandran, Zoph, Le",
    venue: "arXiv",
    year: "2017",
    tag: "paper",
  },
  {
    title: "GLU Variants Improve Transformer",
    authors: "Shazeer",
    venue: "arXiv",
    year: "2020",
    tag: "paper",
  },
  {
    title: "Focal Loss for Dense Object Detection",
    authors: "Lin, Goyal, Girshick, He, Dollár",
    venue: "ICCV",
    year: "2017",
    tag: "paper",
  },
]);

// ─── TOC sections ─────────────────────────────────────────────────────────────
const TOC_SECTIONS = [
  { id: "forward-pass",         label: "The Forward Pass"      },
  { id: "backpropagation",      label: "Backpropagation"       },
  { id: "activation-functions", label: "Activation Functions"  },
  { id: "loss-functions",       label: "Loss Functions"        },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NeuralNetworks() {
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
        Chapter 03 · Part I — Foundations
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
        Neural Networks
      </h1>

      <ChapterLede>
        A neural network is a machine for building complicated functions out
        of many simple, adjustable pieces stacked together. Its real power
        isn't any one piece — it's that stacking enough of them lets the
        network approximate almost any function worth learning, discovered
        from data rather than hand-designed. Every architecture covered later
        in this book — convolutional, recurrent, attention-based — is this
        same idea wearing a different connectivity pattern, which is why the
        vocabulary built here never gets re-explained.
      </ChapterLede>

      {/* ── Section 1: The Forward Pass ───────────────────────────────────── */}
      <div id="forward-pass">
        <SectionTitle>The Forward Pass</SectionTitle>
      </div>

      <p style={prose}>
        A neural network's smallest building block is already familiar:
        Chapter 2's logistic regression unit — a weighted sum of inputs plus
        a bias, squashed by a nonlinearity into a bounded output — is exactly
        one neuron. Concretely, take a single neuron with weights{" "}
        <InlineMath>{"w = [0.5, -0.3]"}</InlineMath>, bias{" "}
        <InlineMath>{"b = 0.1"}</InlineMath>, sigmoid nonlinearity, and input{" "}
        <InlineMath>{"x = [2, 1]"}</InlineMath>. The pre-activation is{" "}
        <InlineMath>{"z = w \\cdot x + b = (0.5)(2) + (-0.3)(1) + 0.1 = 0.8"}</InlineMath>,
        and the neuron's output is{" "}
        <InlineMath>{"a = \\sigma(0.8) \\approx 0.690"}</InlineMath> — the
        same weighted-sum-then-squash computation as logistic regression,
        just relabeled <InlineMath>a</InlineMath> instead of{" "}
        <InlineMath>{"\\hat{p}"}</InlineMath>. A layer is simply many such
        neurons run side by side in parallel, each with its own weights, so
        the layer's combined output becomes a vector instead of a scalar.
      </p>

      <p style={prose}>
        Each layer of a neural network therefore computes an affine
        transformation of its input — a weighted sum of the incoming
        activations plus a bias term, written{" "}
        <InlineMath>{"z = Wx + b"}</InlineMath> — followed by a pointwise
        nonlinearity <InlineMath>{"a = \\sigma(z)"}</InlineMath>, producing an
        activation vector that serves as input to the next layer. Stacking{" "}
        <InlineMath>L</InlineMath> such layers composes{" "}
        <InlineMath>L</InlineMath> functions, each with its own learned
        weight matrix and bias, building progressively more abstract
        representations of the input. The full forward pass is a chain of
        these (linear, nonlinear) pairs evaluated sequentially from input to
        output.
      </p>

      <MathBlock>
        {"$$a^{(\\ell)} = \\sigma\\!\\left(W^{(\\ell)}\\,a^{(\\ell-1)} + b^{(\\ell)}\\right)$$"}
      </MathBlock>

      <p style={prose}>
        Here <InlineMath>{"a^{(\\ell)}"}</InlineMath> is the vector of
        activations leaving layer <InlineMath>{"\\ell"}</InlineMath> (with{" "}
        <InlineMath>{"a^{(0)} = x"}</InlineMath>, the raw input),{" "}
        <InlineMath>{"W^{(\\ell)}"}</InlineMath> and{" "}
        <InlineMath>{"b^{(\\ell)}"}</InlineMath> are that layer's learned
        weight matrix and bias vector, and <InlineMath>{"\\sigma"}</InlineMath>{" "}
        is whichever pointwise nonlinearity the layer uses — the choices
        compared in Activation Functions below.
      </p>

      <p style={prose}>
        The schematic below lays out this chain end to end: an input vector
        passes through three linear-then-nonlinear blocks before reaching an
        output.
      </p>

      <ForwardPassSchematic />

      <p style={prose}>
        That this composition can express anything useful is the content of
        the <em>universal approximation theorem</em>: a single{" "}
        <em>hidden layer</em> — a layer of neurons sitting between the
        network's input and output, never directly observed — with a
        sigmoidal nonlinearity can approximate any continuous function on a{" "}
        <em>compact set</em> (informally, a closed, bounded region of input
        space) to arbitrary accuracy, given enough <em>hidden units</em>, the
        neurons that make up that layer (Cybenko, 1989 [1]; extended by
        Leshno et al. (1993) [2] to essentially any non-polynomial
        activation). This is the
        result that retroactively justified neural networks as a
        general-purpose function class. The catch is that the width required
        can be enormous — for hard functions, exponential in the input
        dimension — so the theorem guarantees expressivity but says nothing
        about how to actually find a useful approximation, or how compactly
        it can be represented. Goodfellow et al.'s{" "}
        <em>Deep Learning</em> [3] is the standard textbook treatment of
        these and the results that follow.
      </p>

      <p style={prose}>
        Depth wins anyway, and for a sharper reason. Universal approximation
        is a representability result, not an efficiency one. Telgarsky
        (2016) [4] proved that there exist functions a depth-{" "}
        <InlineMath>{"\\Theta(k^3)"}</InlineMath> network can represent with
        constant width per layer, but which any network of depth{" "}
        <InlineMath>{"O(k)"}</InlineMath> requires exponentially many —{" "}
        <InlineMath>{"\\Omega(2^k)"}</InlineMath> — neurons to even
        approximate. Depth gives compounding expressivity — each layer
        composes on the previous, so the number of distinct linear pieces a{" "}
        <em>ReLU network</em> (using the{" "}
        <InlineMath>{"\\max(0, x)"}</InlineMath> nonlinearity formally
        introduced in Activation Functions below) can carve into input space
        grows polynomially in width but{" "}
        <strong style={{ color: "var(--text)" }}>exponentially in depth</strong>{" "}
        [5], a distinct result from Telgarsky's depth-vs-width separation
        above. This is the formal reason modern architectures stack many
        layers rather than widening a few.
      </p>

      <p style={prose}>
        Bringing that width question back down to earth: drag the
        hidden-units slider below from 1 to 64 on the sine target with ReLU
        active; notice mean-squared error fall from about 0.18 (poor) to
        under 0.0001 (excellent) as extra hidden units let the fit trace the
        curve's peaks and troughs.
      </p>

      <UniversalApproximation
        tryThis={{
          do: "Drag the hidden-units slider from 1 to 64 on the sine target with ReLU active.",
          notice:
            "MSE falls from about 0.18 (poor) to under 0.0001 (excellent) as extra hidden units let the fit trace the curve's peaks and troughs.",
        }}
      />

      {/* ── Section 2: Backpropagation ────────────────────────────────────── */}
      <div id="backpropagation">
        <SectionTitle>Backpropagation</SectionTitle>
      </div>

      <p style={prose}>
        Training a neural network requires computing the gradient of the
        scalar loss with respect to every weight in every layer — a task made
        tractable by the chain rule of calculus applied to the computation
        graph. Backpropagation reuses intermediate quantities from the
        forward pass to propagate error signals layer by layer from the
        output back to the input, accumulating gradient contributions along
        each path. Each weight update requires only a single backward pass,
        making the total cost proportional to the number of parameters
        rather than the square of it.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\frac{\\partial \\mathcal{L}}{\\partial W^{(\\ell)}} &= \\delta^{(\\ell)} \\left(a^{(\\ell-1)}\\right)^\\top, \\qquad \\frac{\\partial \\mathcal{L}}{\\partial b^{(\\ell)}} = \\delta^{(\\ell)} \\\\
  \\delta^{(\\ell)} &= \\left(W^{(\\ell+1)\\top}\\delta^{(\\ell+1)}\\right) \\odot \\sigma'\\!\\left(z^{(\\ell)}\\right), \\qquad \\ell < L \\\\
  \\delta^{(L)} &= \\nabla_{a^{(L)}}\\mathcal{L} \\;\\odot\\; \\sigma'\\!\\left(z^{(L)}\\right)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\delta^{(\\ell)} = \\partial \\mathcal{L} / \\partial z^{(\\ell)}"}</InlineMath>{" "}
        is the error signal at layer <InlineMath>{"\\ell"}</InlineMath> — how
        much the loss would change per unit change in that layer's
        pre-activation — and it also gives the weight and bias gradients
        directly once combined with the incoming activation{" "}
        <InlineMath>{"a^{(\\ell-1)}"}</InlineMath>. The recursion needs a
        starting point: at the output layer <InlineMath>L</InlineMath>,{" "}
        <InlineMath>{"\\delta^{(L)}"}</InlineMath> is seeded directly from the
        loss gradient, most simply{" "}
        <InlineMath>{"\\delta^{(L)} = \\hat{p} - y"}</InlineMath> when the
        output uses softmax and cross-entropy; the equations above then
        propagate it backward through every earlier layer. That seed is a
        special case worth flagging: softmax is not a pointwise function like
        the sigmoid or ReLU above, so its Jacobian is a full matrix rather
        than a diagonal one, and the elementwise{" "}
        <InlineMath>{"\\odot\\,\\sigma'(z^{(L)})"}</InlineMath> formula in the
        box above does not literally apply to it. Softmax paired with
        cross-entropy is the one combination where the math still works out
        cleanly despite that — the two Jacobians combine to collapse back
        down to the simple difference <InlineMath>{"\\hat{p} - y"}</InlineMath>,
        derived in full in Loss Functions below.
      </p>

      <p style={prose}>
        The figure below traces this recursion on a small computation graph:
        the forward pass (top) caches each node's value on the way to the
        loss, and the backward pass (bottom) reuses those cached values,
        multiplying by a local weight or derivative at every step to produce
        each layer's <InlineMath>{"\\delta"}</InlineMath>.
      </p>

      <BackpropFlow />

      <p style={prose}>
        Backpropagation was discovered independently several times —
        Werbos's 1974 PhD thesis [6] is the usual first citation — before
        Rumelhart et al.'s 1986{" "}
        <em>Nature</em> paper [7] made it the central training algorithm for
        neural networks. In modern framing, backprop is just{" "}
        <em>reverse-mode automatic differentiation</em> applied to a feed-forward
        computation graph: every operation that produces a scalar output can be
        differentiated by recursively applying the chain rule from the output
        back to each input, and any modern framework (PyTorch, JAX, TensorFlow)
        implements this same mechanism for arbitrary graphs.
      </p>

      <p style={prose}>
        The key efficiency insight is what makes this practical. Naïvely,
        computing{" "}
        <InlineMath>{"\\partial \\mathcal{L} / \\partial w"}</InlineMath>{" "}
        for each of{" "}
        <InlineMath>{"N"}</InlineMath>{" "}
        parameters by perturbing them one at a time would cost{" "}
        <InlineMath>{"N"}</InlineMath>{" "}
        forward passes — intractable for modern networks with billions of
        parameters. Backprop's central trick is that{" "}
        <strong style={{ color: "var(--text)" }}>all</strong> gradients are
        computed in a single backward pass, with the same asymptotic cost as one
        forward pass, by caching activations during the forward pass and reusing
        them on the way down. Total training cost is{" "}
        <InlineMath>{"O(\\text{forward pass})"}</InlineMath>{" "}
        per step, not{" "}
        <InlineMath>{"O(N \\times \\text{forward pass})"}</InlineMath>
        . This is why training a billion-parameter network is feasible at all.
      </p>

      <p style={prose}>
        Backprop's reliance on recursively multiplied terms also explains its
        characteristic failure mode: when those terms shrink or blow up across
        many layers, gradients reaching early layers vanish or explode and
        training stalls. The activation-function choices in the next section
        are largely about keeping that recursive product well-conditioned;
        architectural fixes like residual connections (Chapter 6) and
        normalization (Chapter 5) tackle the same problem structurally.
      </p>

      <p style={prose}>
        Hover over any node in the graph below to trace how its gradient
        accumulates on the way back from the loss.
      </p>

      <ComputationGraph
        tryThis={{
          do: "Hover over x₁, the leftmost input node.",
          notice:
            "Its backward path lights up through all three hidden units to ŷ and the loss, ending in an annotation showing the accumulated gradient ≈ −0.036; toggle 'show gradients' to see edge thickness track each step's magnitude, thickest right at the output.",
        }}
      />

      {/* ── Section 3: Activation Functions ──────────────────────────────── */}
      <div id="activation-functions">
        <SectionTitle>Activation Functions</SectionTitle>
      </div>

      <p style={prose}>
        A network without nonlinear activations is just a linear map
        regardless of depth: any composition of affine transforms is itself
        affine, collapsing representational capacity to a single matrix
        multiply. ReLU — the rectified linear unit, defined as{" "}
        <InlineMath>{"\\max(0, x)"}</InlineMath>{" "}
        — dominates modern practice because it is cheap to compute, never
        saturates for positive inputs, and enables gradient flow through deep
        architectures. GELU and Swish generalize ReLU with smooth,
        data-dependent gates that preserve small negative activations and
        eliminate the discontinuous gradient at{" "}
        <InlineMath>{"x = 0"}</InlineMath>
        .
      </p>

      <MathBlock>
        {"$$\\sigma(x) = \\frac{1}{1+e^{-x}} \\qquad \\text{ReLU}(x) = \\max(0, x) \\qquad \\text{GELU}(x) = x\\,\\Phi(x) \\qquad \\text{Swish}(x) = x\\,\\sigma(\\beta x)$$"}
      </MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\Phi"}</InlineMath> is the standard normal CDF,
        so GELU weights <InlineMath>x</InlineMath> by how likely a standard
        Gaussian variable is to fall below it; <InlineMath>{"\\beta"}</InlineMath>{" "}
        is a shape parameter (often fixed at 1, sometimes learned)
        controlling how sharply Swish transitions from its smooth dip near
        zero toward the identity line for large <InlineMath>x</InlineMath>.
      </p>

      <p style={prose}>
        Before ReLU, the field ran on sigmoid{" "}
        <InlineMath>{"\\sigma(x) = 1/(1 + e^{-x})"}</InlineMath>{" "}
        and tanh, which dominated through roughly 2010. Both{" "}
        <em>saturate</em>: for large{" "}
        <InlineMath>{"|x|"}</InlineMath>
        , the derivative vanishes —{" "}
        <InlineMath>{"\\sigma'(x) = \\sigma(x)(1 - \\sigma(x)) \\leq 0.25"}</InlineMath>
        , and at saturation is essentially zero. In a deep network, multiplying
        such small derivatives across many layers attenuated error signals
        exponentially before they reached the early layers: the{" "}
        <em>vanishing gradient problem</em> that stalled training of deep nets
        for two decades. ReLU (Nair & Hinton, 2010 [8], popularizing it for deep
        nets) cut that knot by having gradient{" "}
        <InlineMath>{"1"}</InlineMath>{" "}
        for all positive inputs — no saturation in the active regime.
      </p>

      <p style={prose}>
        The panels below plot sigmoid and ReLU alongside their derivatives,
        with saturated regions shaded: notice how flat sigmoid's slope goes
        inside the shaded zones, while ReLU's derivative panel stays a
        constant, unshaded 1 across its entire positive half.
      </p>

      <ActivationGradients />

      <p style={prose}>
        ReLU has a sharp downside: its gradient is exactly zero for any negative
        input, so a neuron pushed into the negative regime by a bad update can
        stop learning entirely — the <em>dead ReLU problem</em>. Leaky ReLU and
        PReLU patch this with a small slope below zero. GELU [9] (Hendrycks &
        Gimpel, 2016) and Swish/SiLU [10] (Ramachandran et al., 2017) take a
        different route: smooth, learnable gates that approach ReLU for large{" "}
        <InlineMath>{"|x|"}</InlineMath>{" "}
        but allow small negative values to leak through near zero. GELU is now
        standard in transformers (BERT, GPT-2, GPT-3); modern LLMs increasingly
        use SwiGLU [11] (Shazeer, 2020), a gated variant. (Swish/SiLU has three
        independent origins worth knowing about: Ramachandran, Zoph & Le
        (2017) [10] found it via architecture search and named it Swish;
        Elfwing, Uchibe & Doya (2017) had already proposed the identical
        function as "SiLU"; and it appears as a special case inside
        Hendrycks & Gimpel's GELU paper [9] a year earlier still.)
      </p>

      <p style={prose}>
        Enable "show derivative" and toggle on Swish alongside ReLU and GELU
        below; notice ReLU's dashed derivative line pin to exactly 0 for any{" "}
        <InlineMath>{"x < 0"}</InlineMath>, while GELU's and Swish's taper
        smoothly to small nonzero values instead — about −0.09 at{" "}
        <InlineMath>{"x = -2"}</InlineMath> rather than a hard 0.
      </p>

      <ActivationZoo
        tryThis={{
          do: "Enable 'show derivative' and toggle on Swish alongside ReLU and GELU.",
          notice:
            "ReLU's dashed derivative line pins to exactly 0 for any x < 0, while GELU's and Swish's taper smoothly to small nonzero values instead — about −0.09 at x = −2 rather than a hard 0.",
        }}
      />

      {/* ── Section 4: Loss Functions ─────────────────────────────────────── */}
      <div id="loss-functions">
        <SectionTitle>Loss Functions</SectionTitle>
      </div>

      <p style={prose}>
        A network's output layer is itself a design choice tied to the task
        at hand: identity (no nonlinearity) for regression, paired with mean
        squared error; sigmoid for binary classification, paired with
        cross-entropy; or softmax for multi-class classification, paired
        with categorical cross-entropy. This pairing is not incidental —
        each loss below is only interpretable as a likelihood once its
        matching output nonlinearity is in place, as the maximum-likelihood
        argument later in this section makes precise.
      </p>

      <p style={prose}>
        The loss function translates model error into a scalar signal that
        gradient descent (the update rule covered in Chapter 4) can minimize:
        mean squared error penalizes regression residuals quadratically, while
        cross-entropy penalizes the log-probability of the correct class in
        classification settings. Focal loss modifies cross-entropy by
        down-weighting easy examples — those the model already predicts with
        high confidence — concentrating learning on hard and ambiguous cases
        [12]. The choice of loss function is not cosmetic: it determines
        exactly what the network optimizes, and mismatches between the loss
        and the downstream evaluation metric are a frequent source of
        production failures.
      </p>

      <MathBlock>
        {"$$\\text{MSE} = \\frac{1}{n}\\sum_i (y_i - \\hat{y}_i)^2 \\qquad \\text{CE} = -\\sum_i y_i \\log \\hat{y}_i \\qquad \\text{Focal} = -(1-\\hat{p})^\\gamma \\log \\hat{p}$$"}
      </MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\hat p"}</InlineMath> is the model's predicted
        probability for the true class and <InlineMath>{"\\gamma"}</InlineMath>{" "}
        is focal loss's <em>focusing parameter</em>: larger{" "}
        <InlineMath>{"\\gamma"}</InlineMath> down-weights already-confident,
        easy examples more aggressively, concentrating the remaining gradient
        signal on the hard ones. The index <InlineMath>i</InlineMath> is doing
        two different jobs in the equation above: in MSE it ranges over the{" "}
        <InlineMath>n</InlineMath> examples in a batch, each contributing one{" "}
        <InlineMath>{"(y_i - \\hat{y}_i)^2"}</InlineMath> term to the average;
        in cross-entropy it instead ranges over the classes within a single
        one-hot-labeled example, where <InlineMath>{"y_i"}</InlineMath> is 1
        for the true class and 0 for every other class. Same symbol, two
        unrelated ranges — worth keeping straight before the two formulas get
        compared side by side.
      </p>

      <p style={prose}>
        MSE and cross-entropy are not arbitrary choices — both fall out of{" "}
        <em>maximum likelihood estimation</em>, or MLE: fitting parameters by
        maximizing the probability the model assigns to the observed data
        (Chapter 1's treatment of probability and information for ML covers
        the general principle; here it's applied to two specific noise
        models). Minimizing MSE is equivalent to MLE under the assumption
        that
        observations are Gaussian-noisy around the model's prediction;
        minimizing categorical cross-entropy is equivalent to MLE under the
        assumption that the label is drawn from a categorical distribution over
        classes with probabilities{" "}
        <InlineMath>{"\\text{softmax}(\\text{logits})"}</InlineMath> — logits
        being the network's raw, pre-normalization output scores (one per
        class), and softmax the multi-class generalization of the sigmoid
        link from Chapter 2's logistic regression, turning any vector of
        logits into a valid probability distribution over classes:
      </p>

      <MathBlock>
        {"$$\\text{softmax}(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$$"}
      </MathBlock>

      <p style={prose}>
        This is why each loss <em>fits</em> its problem type: the loss is the
        noise model.
      </p>

      <p style={prose}>
        Beyond likelihood, the <em>shape</em> of the gradient matters for
        optimization. MSE on top of a sigmoid produces a gradient that
        vanishes when the model is confidently wrong — exactly when learning
        matters most. Cross-entropy on top of a softmax has the opposite
        property: its gradient with respect to the logits reduces to{" "}
        <InlineMath>{"\\hat{p} - y"}</InlineMath>
        , which is large precisely when the model is confidently wrong. This is
        why cross-entropy is the universal choice for classification: it
        supplies a strong, informative gradient exactly where MSE would
        supply almost none.
      </p>

      <p style={prose}>
        The curves below show cross-entropy (<InlineMath>{"\\gamma = 0"}</InlineMath>)
        against the recommended <InlineMath>{"\\gamma = 2"}</InlineMath> focal
        curve. Read them at three points: at{" "}
        <InlineMath>{"p = 0.3"}</InlineMath> (a hard, middling-confidence
        example) cross-entropy sits far above the focal curve, a gap of about
        0.61; by <InlineMath>{"p = 0.6"}</InlineMath>, just inside the shaded
        "easy examples" zone, that gap has already shrunk to about 0.43; and
        by <InlineMath>{"p = 0.99"}</InlineMath> the two curves have nearly
        merged, a gap of about 0.01. The gap is widest for hard, lower-confidence
        examples and shrinks steadily as confidence rises — which is exactly
        focal loss's point: it suppresses the well-classified, easy examples'
        contribution almost to nothing while leaving hard examples' loss
        close to cross-entropy's.
      </p>

      <FocalLossModulation />

      <p style={prose}>
        Set the true label to 1 below and drag the predicted-{" "}
        <InlineMath>{"\\hat y"}</InlineMath> slider down toward 0; notice
        cross-entropy's loss shoot up steeply while MSE's stays capped at 1 —
        that steep rise is the large gradient signal cross-entropy supplies
        exactly when the prediction is most confidently wrong.
      </p>

      <LossFunctions
        tryThis={{
          do: "Set the true label to 1 and drag the predicted-ŷ slider down toward 0.",
          notice:
            "Cross-entropy's loss shoots up steeply toward the top of the chart while MSE's stays capped at 1 — that steep rise is the large gradient signal cross-entropy supplies exactly when the prediction is most confidently wrong.",
        }}
      />

      {/* ── What Carries Forward ──────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        The vocabulary built in this chapter — the forward pass as a chain of
        (linear, nonlinear) pairs, backpropagation's{" "}
        <InlineMath>{"\\delta"}</InlineMath> recursion, the activation-function
        menu, and the output-head/loss-function pairing — is used without
        re-explanation for the rest of this book: every later architecture,
        from convolutional networks to attention-based transformers, is still
        layers of the same two operations trained by the same backward pass.
        Keep the recursion itself in mind too — each layer's error signal is
        the next layer's error signal times a local weight and a local
        derivative, which is the lens later chapters use to explain why
        certain architectures train more easily than others. Also worth
        retaining is the loss-function discipline from this chapter: pick the
        output nonlinearity and loss as a matched pair, and check that pairing
        against whatever noise model the task actually implies. This chapter
        assumed that a gradient, once computed, can simply be subtracted from
        a weight; Chapter 4 (Optimization) covers what actually happens at
        that update step — learning rates, momentum, and adaptive methods
        like Adam that turn a raw gradient into a well-behaved parameter
        update.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
