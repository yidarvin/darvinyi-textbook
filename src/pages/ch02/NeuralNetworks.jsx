import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import UniversalApproximation from "../../components/widgets/ch02/UniversalApproximation";
import ComputationGraph from "../../components/widgets/ch02/ComputationGraph";
import ActivationZoo from "../../components/widgets/ch02/ActivationZoo";
import LossFunctions from "../../components/widgets/ch02/LossFunctions";

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

// ─── Widget placeholder ───────────────────────────────────────────────────────
function WidgetPlaceholder({ id, title }) {
  return (
    <div
      style={{
        border: "1px dashed var(--border-lt)",
        borderRadius: "8px",
        padding: "40px 24px",
        margin: "28px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        background: "var(--bg2)",
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9.5px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--accent)",
          background: "var(--accent-dim)",
          padding: "2px 8px",
          borderRadius: "3px",
        }}
      >
        Interactive · {id}
      </span>
      <span
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: "18px",
          color: "var(--text-mid)",
          marginTop: "4px",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "12px",
          color: "var(--text-muted)",
        }}
      >
        Widget coming soon
      </span>
    </div>
  );
}

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
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12.5px",
            background: "var(--code-bg)",
            border: "1px solid var(--border-lt)",
            padding: "1px 7px",
            borderRadius: "4px",
            color: "var(--math-color)",
          }}
        >
          z = Wx + b
        </span>
        , followed by a pointwise nonlinearity{" "}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12.5px",
            background: "var(--code-bg)",
            border: "1px solid var(--border-lt)",
            padding: "1px 7px",
            borderRadius: "4px",
            color: "var(--math-color)",
          }}
        >
          a = σ(z)
        </span>
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
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12.5px",
            background: "var(--code-bg)",
            border: "1px solid var(--border-lt)",
            padding: "1px 7px",
            borderRadius: "4px",
            color: "var(--math-color)",
          }}
        >
          max(0, x)
        </span>{" "}
        — dominates modern practice because it is cheap to compute, never
        saturates for positive inputs, and enables gradient flow through deep
        architectures. GELU and Swish generalize ReLU with smooth,
        data-dependent gates that preserve small negative activations and
        eliminate the discontinuous gradient at{" "}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12.5px",
            background: "var(--code-bg)",
            border: "1px solid var(--border-lt)",
            padding: "1px 7px",
            borderRadius: "4px",
            color: "var(--math-color)",
          }}
        >
          x = 0
        </span>
        .
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
        loss modifies cross-entropy by down-weighting easy examples — those
        the model already predicts with high confidence — concentrating
        learning on hard and ambiguous cases [6]. The choice of loss function
        is not cosmetic: it determines exactly what the network optimizes, and
        mismatches between the loss and the downstream evaluation metric are a
        frequent source of production failures.
      </p>

      <LossFunctions />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
