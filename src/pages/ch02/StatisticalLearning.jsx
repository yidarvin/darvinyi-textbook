import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import PolynomialFit from "../../components/widgets/ch02/PolynomialFit";
import BiasVariance from "../../components/widgets/ch02/BiasVariance";
import RegularizationExplorer from "../../components/widgets/ch02/RegularizationExplorer";
import DecisionBoundary from "../../components/widgets/ch02/DecisionBoundary";
import BiasVarianceDartboard from "../../components/diagrams/ch02/BiasVarianceDartboard";
import DoubleDescentCurve from "../../components/diagrams/ch02/DoubleDescentCurve";
import L1L2Geometry from "../../components/diagrams/ch02/L1L2Geometry";
import DecisionBoundaryShapes from "../../components/diagrams/ch02/DecisionBoundaryShapes";

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
const CITATIONS = [
  {
    num: 1,
    title: "The Elements of Statistical Learning",
    authors: "Hastie, Tibshirani, Friedman",
    venue: "Springer",
    year: "2001",
    tag: "seminal",
  },
  {
    num: 2,
    title: "Neural Net Bias/Variance Tradeoff",
    authors: "Geman, Bienenstock, Doursat",
    venue: "Neural Computation",
    year: "1992",
    tag: "seminal",
  },
  {
    num: 3,
    title: "No Free Lunch Theorems for Optimization",
    authors: "Wolpert & Macready",
    venue: "IEEE Trans. Evolutionary Computation",
    year: "1997",
    tag: "seminal",
  },
  {
    num: 4,
    title: "Learnability and the Vapnik-Chervonenkis Dimension",
    authors: "Blumer, Ehrenfeucht, Haussler, Warmuth",
    venue: "Journal of the ACM",
    year: "1989",
    tag: "paper",
  },
];

const TOC_SECTIONS = [
  { id: "the-learning-problem",   label: "The Learning Problem"   },
  { id: "bias-variance-tradeoff", label: "Bias-Variance Tradeoff" },
  { id: "regularization",         label: "Regularization"         },
  { id: "decision-boundaries",    label: "Decision Boundaries"    },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StatisticalLearning() {
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
        Chapter 02 · Part I — Foundations
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
        Statistical Learning
      </h1>

      <ChapterLede>
        Statistical learning is the study of how machines infer structure from
        data. Rather than programming explicit rules, we specify a hypothesis
        class and a loss function, then search for the function that best
        explains the observations — balancing the twin pressures of fitting
        training data and generalizing to unseen examples. The concepts
        developed here underpin every architecture and algorithm in the rest
        of this book.
      </ChapterLede>

      {/* ── Section 1: The Learning Problem ──────────────────────────────── */}
      <div id="the-learning-problem">
        <SectionTitle>The Learning Problem</SectionTitle>
      </div>

      <p style={prose}>
        Formally, we observe <InlineMath>n</InlineMath> input-output pairs{" "}
        <InlineMath>{"(x_i, y_i) ~ P(X, Y)"}</InlineMath> drawn i.i.d. from an
        unknown joint distribution. Our goal is to find a function{" "}
        <InlineMath>{"f: X → Y"}</InlineMath> from a hypothesis class{" "}
        <InlineMath>H</InlineMath> that minimizes expected risk{" "}
        <InlineMath>{"R(f) = E[L(f(x), y)]"}</InlineMath> for some loss{" "}
        <InlineMath>L</InlineMath>.
      </p>

      <MathBlock>{"$$\\hat{f} = \\arg\\min_{f \\in \\mathcal{H}} \\frac{1}{n} \\sum_{i=1}^{n} L\\bigl(f(x_i),\\, y_i\\bigr)$$"}</MathBlock>

      <p style={prose}>
        Because the true distribution <InlineMath>P</InlineMath> is unknown, we
        minimize empirical risk — the average loss over the training set — as a
        proxy. Empirical risk minimization (ERM) is the foundation of most
        supervised learning algorithms, but optimizing training loss alone can
        lead to a function that memorizes noise rather than learning the
        underlying pattern. The gap between training and test performance is
        called generalization error, and controlling it is the central challenge
        of the field.
      </p>

      <p style={prose}>
        ERM admits a rigorous justification through learning theory [4]: under
        mild assumptions, with high probability the gap between empirical and
        true risk is bounded by a quantity that grows with the capacity of the
        hypothesis class — formalized through its Vapnik–Chervonenkis dimension{" "}
        <InlineMath>d</InlineMath> — and shrinks with the sample size{" "}
        <InlineMath>n</InlineMath>, roughly as{" "}
        <InlineMath>{"O(\\sqrt{d/n})"}</InlineMath>. The intuition is simple: a
        small hypothesis class cannot overfit much, because it contains too few
        functions to memorize noise; a large class can, unless{" "}
        <InlineMath>n</InlineMath> is also large enough to single out the right
        one. This is the formal reason that gathering more data works — it
        tightens the bound. Modern deep networks complicate this picture, since
        their effective capacity is enormous and yet they generalize anyway, a
        puzzle we return to in the next section.
      </p>

      <PolynomialFit />

      {/* ── Section 2: Bias-Variance Tradeoff ────────────────────────────── */}
      <div id="bias-variance-tradeoff">
        <SectionTitle>Bias-Variance Tradeoff</SectionTitle>
      </div>

      <p style={prose}>
        The expected test error of any estimator decomposes into three
        irreducible terms [2]: the squared bias (how far the average prediction
        strays from the truth), the variance (how much predictions fluctuate
        across different training sets), and irreducible noise from the data
        itself. These quantities trade off against each other as model
        complexity grows — gaining flexibility to capture the signal also gains
        flexibility to chase the noise.
      </p>

      <p style={prose}>
        A model with too few parameters (high bias) fails to capture the signal;
        a model with too many (high variance) fits training noise and fails to
        transfer. The optimal complexity sits at the sweet spot where total
        expected error is minimized — a point that depends on both the true
        function and the size of the training set, and which the formal
        decomposition makes precise [1].
      </p>

      <BiasVarianceDartboard />

      <MathBlock>{"$$\\mathbb{E}\\bigl[(y - \\hat{f}(x))^2\\bigr] = \\underbrace{\\mathrm{Bias}^2[\\hat{f}(x)]}_{\\text{underfitting}} + \\underbrace{\\mathrm{Var}[\\hat{f}(x)]}_{\\text{overfitting}} + \\sigma^2$$"}</MathBlock>

      <p style={prose}>
        The classical U-shape was the dominant view of overfitting for a
        generation. Then Belkin, Hsu, Ma, and Mandal (2019) showed that for many
        widely used models — neural networks, random features, kernel machines,
        even decision trees — pushing complexity past the{" "}
        <em>interpolation threshold</em> (the point at which training error
        first hits zero) produces a <em>second</em> descent in test error: the
        curve climbs into a sharp peak at the threshold, then falls again as
        the model becomes massively overparameterized. The mechanism is
        intuitive: at the threshold the model is forced into a unique, brittle
        solution that fits the noise rigidly, while past it an entire family of
        zero-error solutions becomes available and the optimizer's implicit
        bias selects smoother members of that family. This <em>double
        descent</em> is much of the reason scaling up neural networks works at
        all, and we return to the inductive bias of optimization itself in
        later chapters.
      </p>

      <DoubleDescentCurve />

      <BiasVariance />

      {/* ── Section 3: Regularization ─────────────────────────────────────── */}
      <div id="regularization">
        <SectionTitle>Regularization</SectionTitle>
      </div>

      <p style={prose}>
        Regularization adds a penalty term <InlineMath>{"Ω(f)"}</InlineMath> to
        the empirical risk, shrinking the hypothesis class toward simpler
        solutions. The two most common choices are{" "}
        <InlineMath>L2</InlineMath> (ridge), which penalizes the squared norm of
        the weights, and <InlineMath>L1</InlineMath> (lasso), which penalizes
        the absolute norm and induces sparsity by driving individual weights
        exactly to zero — geometrically, because the L1 constraint region has
        corners on the coordinate axes that the loss contours tend to intersect.
      </p>

      <MathBlock>{"$$\\hat{f}_{\\lambda} = \\arg\\min_{f \\in \\mathcal{H}} \\frac{1}{n}\\sum_{i=1}^{n} L(f(x_i), y_i) + \\lambda\\,\\Omega(f)$$"}</MathBlock>

      <L1L2Geometry />

      <p style={prose}>
        The regularization strength <InlineMath>λ</InlineMath> is a
        hyperparameter that controls the bias-variance tradeoff directly: larger{" "}
        <InlineMath>λ</InlineMath> increases bias and decreases variance. In
        practice, <InlineMath>λ</InlineMath> is selected via cross-validation,
        and the right choice can be the single largest lever for improving
        generalization on a fixed architecture.
      </p>

      <p style={prose}>
        More broadly, regularization is the <em>injection of prior belief</em>{" "}
        about what a good function looks like, expressed as a preference for
        simpler solutions in the absence of contrary evidence. <InlineMath>L2</InlineMath>{" "}
        says "all weights should be small"; <InlineMath>L1</InlineMath> says
        "most weights should be exactly zero." This view generalizes far beyond
        explicit norms: dropout is regularization by input noise, early stopping
        is regularization through finite optimization time, data augmentation
        encodes invariance priors, and weight tying enforces shared structure.
        In modern deep learning much of the work is in fact done by{" "}
        <em>implicit</em> regularization — the architecture itself acts as a
        structural prior (a CNN's translation equivariance is a hardcoded
        invariance, not a learned one), and the optimizer adds its own bias
        (SGD with small batches preferentially settles into flatter minima that
        generalize better).
      </p>

      <RegularizationExplorer />

      {/* ── Section 4: Decision Boundaries ───────────────────────────────── */}
      <div id="decision-boundaries">
        <SectionTitle>Decision Boundaries</SectionTitle>
      </div>

      <p style={prose}>
        In classification, a learned model partitions the input space into
        regions assigned to each class; the surfaces separating these regions
        are called decision boundaries. The geometry of these boundaries
        — linear, piecewise-linear, or smooth and curved — is determined by the
        hypothesis class chosen and the inductive biases encoded by the loss and
        regularizer.
      </p>

      <p style={prose}>
        The No Free Lunch theorem [3] formalizes this: averaged over all
        possible data-generating distributions, every algorithm performs
        equally — no model dominates all problems. The choice of hypothesis
        class is therefore always a bet on the structure of the specific
        problem at hand, and understanding the geometries your model can and
        cannot represent is essential to principled model selection.
      </p>

      <p style={prose}>
        The operational concept here is <em>inductive bias</em>: the set of
        boundary geometries a hypothesis class can express, together with the
        preference ordering over them imposed by the loss and regularizer.
        Linear models bias toward halfspaces; <InlineMath>k</InlineMath>-nearest
        neighbours biases toward locally constant regions; decision trees bias
        toward axis-aligned partitions; neural networks bias toward
        compositionally structured boundaries whose form is shaped by depth and
        connectivity. Read this way, No Free Lunch does not say all models are
        equal in practice — it says they are equal{" "}
        <em>averaged over all possible problems</em>. Real problems live in a
        vanishingly thin slice of that space, and the entire game of supervised
        learning is matching inductive bias to the structure that actually
        appears in nature.
      </p>

      <DecisionBoundaryShapes />

      <DecisionBoundary />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
