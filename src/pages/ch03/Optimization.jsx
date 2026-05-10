import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import GradientDescentNavigator from "../../components/widgets/ch03/GradientDescentNavigator";
import OptimizerRace from "../../components/widgets/ch03/OptimizerRace";
import LRFinder from "../../components/widgets/ch03/LRFinder";
import LRSchedule from "../../components/widgets/ch03/LRSchedule";
import AdamInternals from "../../components/widgets/ch03/AdamInternals";

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
        of the loss, proportional to the learning rate η — the core
        optimization primitive used across all neural network training.
        Stochastic gradient descent (SGD) estimates this gradient from a
        single random sample, drastically reducing computation per step but
        introducing noise that can prevent convergence to a precise minimum.
        Mini-batch gradient descent strikes a balance: averaging the gradient
        over a small batch of 32–512 examples reduces variance enough for
        reliable progress while preserving the throughput advantage of
        parallelism over full-batch computation.
      </p>

      <MathBlock>{"θ ← θ − η ∇_θ L(θ)"}</MathBlock>

      <GradientDescentNavigator />

      {/* ── Section 2: Momentum & Adaptive Methods ───────────────────────── */}
      <div id="momentum-adaptive">
        <SectionTitle>Momentum & Adaptive Methods</SectionTitle>
      </div>

      <p style={prose}>
        Momentum augments gradient descent by accumulating an exponential
        moving average of past gradients — a velocity term that helps the
        optimizer build speed across consistently downhill directions and
        dampen oscillation in noisy directions. RMSProp adapts the learning
        rate per parameter by dividing each gradient by the root mean square
        of recent gradient magnitudes, automatically scaling down updates for
        frequently-activated parameters and scaling up those that receive rare
        signals. Adam unifies both ideas: it maintains a first moment (mean
        gradient) and a second moment (uncentered variance), then applies
        bias-correction factors to compensate for the zero-initialization of
        these estimates during the first few steps.
      </p>

      <MathBlock>
        {"m̂ₜ = mₜ / (1 − β₁ᵗ)     v̂ₜ = vₜ / (1 − β₂ᵗ)     θ ← θ − η · m̂ₜ / (√v̂ₜ + ε)"}
      </MathBlock>

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

      <LRSchedule />

      {/* ── Section 5: Adam Internals ─────────────────────────────────────── */}
      <div id="adam-internals">
        <SectionTitle>Adam Internals</SectionTitle>
      </div>

      <p style={prose}>
        Adam maintains two running estimates per parameter: the first moment
        m̂ₜ tracks the mean direction of recent gradients, while the second
        moment v̂ₜ tracks their uncentered variance — together determining an
        effective per-parameter learning rate that adapts continuously to
        gradient history. Both estimates are initialized at zero and divided
        by (1 − βᵗ) to correct for cold-start bias in the first few steps,
        after which the correction factor becomes negligible and Adam behaves
        like a fully adaptive method [1].
      </p>

      <AdamInternals />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
