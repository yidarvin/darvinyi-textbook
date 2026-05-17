import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import UniversalApproximation from "../../components/widgets/ch02/UniversalApproximation";
import ComputationGraph from "../../components/widgets/ch02/ComputationGraph";
import ActivationZoo from "../../components/widgets/ch02/ActivationZoo";
import LossFunctions from "../../components/widgets/ch02/LossFunctions";
import ForwardPassSchematic from "../../components/diagrams/ch02/ForwardPassSchematic";
import BackpropFlow from "../../components/diagrams/ch02/BackpropFlow";
import ActivationGradients from "../../components/diagrams/ch02/ActivationGradients";
import FocalLossModulation from "../../components/diagrams/ch02/FocalLossModulation";

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
    title: "Learning Representations by Back-propagating Errors",
    authors: "Rumelhart, Hinton, Williams",
    venue: "Nature",
    year: "1986",
    tag: "seminal",
  },
  {
    num: 2,
    title: "Approximation by Superpositions of a Sigmoidal Function",
    authors: "Cybenko",
    venue: "Mathematics of Control, Signals and Systems",
    year: "1989",
    tag: "seminal",
  },
  {
    num: 3,
    title: "Deep Learning",
    authors: "Goodfellow, Bengio, Courville",
    venue: "MIT Press",
    year: "2016",
    tag: "survey",
  },
  {
    num: 4,
    title: "Gaussian Error Linear Units (GELUs)",
    authors: "Hendrycks & Gimpel",
    venue: "arXiv",
    year: "2016",
    tag: "paper",
  },
  {
    num: 5,
    title: "Searching for Activation Functions (Swish)",
    authors: "Ramachandran, Zoph, Le",
    venue: "arXiv",
    year: "2017",
    tag: "paper",
  },
  {
    num: 6,
    title: "Focal Loss for Dense Object Detection",
    authors: "Lin, Goyal, Girshick, He, Dollár",
    venue: "ICCV",
    year: "2017",
    tag: "paper",
  },
];

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
        Chapter 02 · Part I — Foundations
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
        Neural Networks
      </h1>

      <ChapterLede>
        A neural network is a parameterized function — layers of linear
        transformations interleaved with nonlinearities. The power is not in
        any single layer but in their composition, which can approximate any
        continuous function given enough capacity.
      </ChapterLede>

      {/* ── Section 1: The Forward Pass ───────────────────────────────────── */}
      <div id="forward-pass">
        <SectionTitle>The Forward Pass</SectionTitle>
      </div>

      <p style={prose}>
        Each layer of a neural network computes an affine transformation{" "}
        <InlineMath>{"z = Wx + b"}</InlineMath>
        , followed by a pointwise nonlinearity{" "}
        <InlineMath>{"a = \\sigma(z)"}</InlineMath>
        , producing an activation vector that serves as input to the next
        layer. Stacking L such layers composes L functions, each with its own
        learned weight matrix and bias, building progressively more abstract
        representations of the input. The full forward pass is a chain of
        these (linear, nonlinear) pairs evaluated sequentially from input to
        output.
      </p>

      <MathBlock>
        {"$$a^{(\\ell)} = \\sigma\\!\\left(W^{(\\ell)}\\,a^{(\\ell-1)} + b^{(\\ell)}\\right)$$"}
      </MathBlock>

      <ForwardPassSchematic />

      <p style={prose}>
        That this composition can express anything useful is the content of the{" "}
        <em>universal approximation theorem</em>: a single hidden layer with a
        sigmoidal nonlinearity can approximate any continuous function on a
        compact set to arbitrary accuracy, given enough hidden units (Cybenko,
        1989 [2]; extended by Hornik in 1991 to essentially any non-polynomial
        activation). This is the result that retroactively justified neural
        networks as a general-purpose function class. The catch is that the
        width required can be enormous — for hard functions, exponential in the
        input dimension — so the theorem guarantees expressivity but says
        nothing about how to actually find a useful approximation, or how
        compactly it can be represented. Goodfellow, Bengio & Courville's{" "}
        <em>Deep Learning</em> [3] is the standard textbook treatment of these
        and the results that follow.
      </p>

      <p style={prose}>
        Depth wins anyway, and for a sharper reason. Universal approximation is
        a representability result, not an efficiency one. Telgarsky (2016)
        proved that there exist functions a depth-{" "}
        <InlineMath>{"k"}</InlineMath>{" "}
        network can represent with constant width per layer, but which any
        network of depth{" "}
        <InlineMath>{"O(\\log k)"}</InlineMath>{" "}
        requires exponentially many neurons to even approximate. Depth gives
        compounding expressivity — each layer composes on the previous, so the
        number of distinct linear pieces a ReLU network can carve into input
        space grows polynomially in width but{" "}
        <strong style={{ color: "var(--text)" }}>exponentially in depth</strong>.
        This is the formal reason modern architectures stack many layers rather
        than widening a few.
      </p>

      <UniversalApproximation />

      {/* ── Section 2: Backpropagation ────────────────────────────────────── */}
      <div id="backpropagation">
        <SectionTitle>Backpropagation</SectionTitle>
      </div>

      <p style={prose}>
        Training a neural network requires computing the gradient of the
        scalar loss with respect to every weight in every layer — a task made
        tractable by the chain rule of calculus applied to the computation
        graph. Backpropagation reuses intermediate quantities from the forward
        pass to propagate error signals layer by layer from the output back to
        the input, accumulating gradient contributions along each path. Each
        weight update requires only a single backward pass, making the total
        cost proportional to the number of parameters rather than the square
        of it.
      </p>

      <MathBlock>
        {"$$\\frac{\\partial L}{\\partial W^{(\\ell)}} = \\delta^{(\\ell)} \\cdot \\left(a^{(\\ell-1)}\\right)^\\top \\qquad \\text{where} \\qquad \\delta^{(\\ell)} = \\left(W^{(\\ell+1)\\top}\\delta^{(\\ell+1)}\\right) \\odot \\sigma'\\!\\left(z^{(\\ell)}\\right)$$"}
      </MathBlock>

      <BackpropFlow />

      <p style={prose}>
        Backpropagation was discovered independently several times — Werbos's
        1974 PhD thesis is the usual first citation — before Rumelhart, Hinton
        & Williams' 1986{" "}
        <em>Nature</em> paper [1] made it the central training algorithm for
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
        <InlineMath>{"\\partial L / \\partial w"}</InlineMath>{" "}
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
        training stalls. The architectural and activation-function choices in
        the next sections are largely about keeping that recursive product
        well-conditioned.
      </p>

      <ComputationGraph />

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
        for two decades. ReLU (Nair & Hinton, 2010, popularizing it for deep
        nets) cut that knot by having gradient{" "}
        <InlineMath>{"1"}</InlineMath>{" "}
        for all positive inputs — no saturation in the active regime.
      </p>

      <ActivationGradients />

      <p style={prose}>
        ReLU has a sharp downside: its gradient is exactly zero for any negative
        input, so a neuron pushed into the negative regime by a bad update can
        stop learning entirely — the <em>dead ReLU problem</em>. Leaky ReLU and
        PReLU patch this with a small slope below zero. GELU [4] (Hendrycks &
        Gimpel, 2016) and Swish/SiLU [5] (Ramachandran, Zoph & Le, 2017) take a
        different route: smooth, learnable gates that approach ReLU for large{" "}
        <InlineMath>{"|x|"}</InlineMath>{" "}
        but allow small negative values to leak through near zero. GELU is now
        standard in transformers (BERT, GPT-2, GPT-3); modern LLMs increasingly
        use SwiGLU, a gated variant.
      </p>

      <ActivationZoo />

      {/* ── Section 4: Loss Functions ─────────────────────────────────────── */}
      <div id="loss-functions">
        <SectionTitle>Loss Functions</SectionTitle>
      </div>

      <p style={prose}>
        The loss function translates model error into a scalar signal that
        gradient descent can minimize: mean squared error penalizes regression
        residuals quadratically, while cross-entropy penalizes the
        log-probability of the correct class in classification settings. Focal
        loss modifies cross-entropy by down-weighting easy examples — those the
        model already predicts with high confidence — concentrating learning on
        hard and ambiguous cases [6]. The choice of loss function is not
        cosmetic: it determines exactly what the network optimizes, and
        mismatches between the loss and the downstream evaluation metric are a
        frequent source of production failures.
      </p>

      <MathBlock>
        {"$$\\text{MSE} = \\frac{1}{n}\\sum_i (y_i - \\hat{y}_i)^2 \\qquad \\text{CE} = -\\sum_i y_i \\log \\hat{y}_i \\qquad \\text{Focal} = -(1-\\hat{p})^\\gamma \\log \\hat{p}$$"}
      </MathBlock>

      <p style={prose}>
        MSE and cross-entropy are not arbitrary choices — both fall out of{" "}
        <em>maximum likelihood estimation</em> under different noise models.
        Minimizing MSE is equivalent to MLE under the assumption that
        observations are Gaussian-noisy around the model's prediction;
        minimizing categorical cross-entropy is equivalent to MLE under the
        assumption that the label is drawn from a categorical distribution over
        classes with probabilities{" "}
        <InlineMath>{"\\text{softmax}(\\text{logits})"}</InlineMath>
        . This is why each loss <em>fits</em> its problem type: the loss is the
        noise model.
      </p>

      <p style={prose}>
        Beyond likelihood, the <em>shape</em> of the gradient matters for
        optimization. MSE on top of a sigmoid produces a gradient that vanishes
        when the model is confidently wrong — exactly when you want it to learn
        fastest. Cross-entropy on top of a softmax has the opposite property:
        its gradient with respect to the logits reduces to{" "}
        <InlineMath>{"\\hat{p} - y"}</InlineMath>
        , which is large precisely when the model is confidently wrong. This is
        why cross-entropy is the universal choice for classification — and it
        isn't a small detail; it's the reason classification networks train at
        all.
      </p>

      <FocalLossModulation />

      <LossFunctions />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
