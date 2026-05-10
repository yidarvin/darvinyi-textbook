import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import PolynomialFit from "../../components/widgets/ch01/PolynomialFit";
import BiasVariance from "../../components/widgets/ch01/BiasVariance";
import RegularizationExplorer from "../../components/widgets/ch01/RegularizationExplorer";
import DecisionBoundary from "../../components/widgets/ch01/DecisionBoundary";

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

// ─── Widget placeholder ───────────────────────────────────────────────────────
function WidgetPlaceholder({ id, title }) {
  return (
    <div
      className="widget-placeholder"
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
export default function StatisticalLearning() {
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
        Chapter 01 · Foundations
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
      <SectionTitle>The Learning Problem</SectionTitle>

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

      <PolynomialFit />

      {/* ── Section 2: Bias-Variance Tradeoff ────────────────────────────── */}
      <SectionTitle>Bias-Variance Tradeoff</SectionTitle>

      <p style={prose}>
        The expected test error of any estimator decomposes into three
        irreducible terms: the squared bias (how far the average prediction
        strays from the truth), the variance (how much predictions fluctuate
        across different training sets), and irreducible noise. These two
        quantities trade off against each other as model complexity grows.
      </p>

      <MathBlock>{"$$\\mathbb{E}\\bigl[(y - \\hat{f}(x))^2\\bigr] = \\underbrace{\\mathrm{Bias}^2[\\hat{f}(x)]}_{\\text{underfitting}} + \\underbrace{\\mathrm{Var}[\\hat{f}(x)]}_{\\text{overfitting}} + \\sigma^2$$"}</MathBlock>

      <p style={prose}>
        A model with too few parameters (high bias) fails to capture the signal;
        a model with too many (high variance) fits training noise and fails to
        transfer. The optimal complexity sits at the sweet spot where total
        expected error is minimized — a point that depends on both the true
        function and the size of the training set.
      </p>

      <BiasVariance />

      {/* ── Section 3: Regularization ─────────────────────────────────────── */}
      <SectionTitle>Regularization</SectionTitle>

      <p style={prose}>
        Regularization adds a penalty term <InlineMath>{"Ω(f)"}</InlineMath> to
        the empirical risk, shrinking the hypothesis class toward simpler
        solutions. The two most common choices are{" "}
        <InlineMath>L2</InlineMath> (ridge), which penalizes the squared norm of
        the weights, and <InlineMath>L1</InlineMath> (lasso), which penalizes
        the absolute norm and induces sparsity by driving individual weights
        exactly to zero.
      </p>

      <MathBlock>{"$$\\hat{f}_{\\lambda} = \\arg\\min_{f \\in \\mathcal{H}} \\frac{1}{n}\\sum_{i=1}^{n} L(f(x_i), y_i) + \\lambda\\,\\Omega(f)$$"}</MathBlock>

      <p style={prose}>
        The regularization strength <InlineMath>λ</InlineMath> is a
        hyperparameter that controls the bias-variance tradeoff directly: larger{" "}
        <InlineMath>λ</InlineMath> increases bias and decreases variance. In
        practice, <InlineMath>λ</InlineMath> is selected via cross-validation,
        and the right choice can be the single largest lever for improving
        generalization on a fixed architecture.
      </p>

      <RegularizationExplorer />

      {/* ── Section 4: Decision Boundaries ───────────────────────────────── */}
      <SectionTitle>Decision Boundaries</SectionTitle>

      <p style={prose}>
        In classification, a learned model partitions the input space into
        regions assigned to each class; the surfaces separating these regions
        are called decision boundaries. The geometry of these boundaries
        — linear, piecewise-linear, or smooth and curved — is determined by the
        hypothesis class chosen and the inductive biases encoded by the loss and
        regularizer.
      </p>

      <p style={prose}>
        The No Free Lunch theorem [3] formalizes the intuition that no single
        model dominates all problems: averaged over all possible data-generating
        distributions, every algorithm performs equally. This means the choice
        of hypothesis class is always a bet on the structure of the specific
        problem at hand, and understanding the geometry your model can and
        cannot represent is essential for principled model selection.
      </p>

      <DecisionBoundary />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
