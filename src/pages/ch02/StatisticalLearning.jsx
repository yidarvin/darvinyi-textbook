import { useTocSections } from "../../components/layout/TocContext";
import { buildCitations } from "../../data/citations";
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
const CITATIONS = buildCitations([
  "elements-of-statistical-learning",
  "bias-variance-dilemma",
  "lack-of-a-priori-distinctions",
  "vc-dimension-learnability",
  "reconciling-bias-variance-tradeoff",
]);

const TOC_SECTIONS = [
  { id: "the-learning-problem",           label: "The Learning Problem"        },
  { id: "linear-and-logistic-regression", label: "Linear & Logistic Regression"},
  { id: "bias-variance-tradeoff",         label: "Bias-Variance Tradeoff"      },
  { id: "the-classical-toolbox",          label: "The Classical Toolbox"       },
  { id: "regularization",                 label: "Regularization"              },
  { id: "decision-boundaries",            label: "Decision Boundaries"         },
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
        Suppose we want a machine to predict an output from an input — a price
        from a house's features, a species from a flower's measurements —
        using only examples it has already seen, not a hand-written rule.
        Statistical learning is the theory of when that kind of guessing can
        be trusted: how to tell a model that has genuinely learned a pattern
        from one that has merely memorized its examples, and how much data
        separates the two. Every architecture in the rest of this book —
        linear, convolutional, recurrent, or attention-based — inherits its
        answer to that question from the ideas in this chapter.
      </ChapterLede>

      {/* ── Section 1: The Learning Problem ──────────────────────────────── */}
      <div id="the-learning-problem">
        <SectionTitle>The Learning Problem</SectionTitle>
      </div>

      <p style={prose}>
        A learning problem starts with a batch of examples and a question:
        what single rule explains them, and will that rule keep working on
        examples we have not seen yet? Formally, we observe{" "}
        <InlineMath>n</InlineMath> input-output pairs{" "}
        <InlineMath>{"(x_i, y_i) \\sim P(X, Y)"}</InlineMath>, drawn i.i.d.
        (independently and identically distributed) from an unknown joint
        distribution. Our goal is to find a function{" "}
        <InlineMath>{"f: X \\to Y"}</InlineMath> from a hypothesis class{" "}
        <InlineMath>H</InlineMath> that minimizes expected risk{" "}
        <InlineMath>{"R(f) = \\mathbb{E}[L(f(x), y)]"}</InlineMath> for some loss{" "}
        <InlineMath>L</InlineMath>.
      </p>

      <MathBlock>{"$$\\hat{f} = \\arg\\min_{f \\in \\mathcal{H}} \\frac{1}{n} \\sum_{i=1}^{n} L\\bigl(f(x_i),\\, y_i\\bigr)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\hat{f}"}</InlineMath> is the function this
        procedure actually returns, <InlineMath>H</InlineMath> is the
        hypothesis class it is chosen from, and{" "}
        <InlineMath>{"L(f(x_i), y_i)"}</InlineMath> is the per-example loss
        being averaged over the training set.
      </p>

      <p style={prose}>
        Because the true distribution <InlineMath>P</InlineMath> is unknown, we
        minimize empirical risk — the average loss over the training set — as a
        proxy. Empirical risk minimization (ERM) is the foundation of most
        supervised learning algorithms, but optimizing training loss alone can
        lead to a function that memorizes noise rather than learning the
        underlying pattern. The gap between training and test performance is
        called the generalization gap, and controlling it is the central
        challenge of the field.
      </p>

      <p style={prose}>
        These abstract pieces become concrete the moment we pick actual
        formulas. For regression, the workhorse is squared error, averaged
        into the mean squared error (MSE); for classification, it is 0-1
        loss — whether a prediction was simply right or wrong — or, for
        models that output a probability, log-loss (also called
        cross-entropy), which penalizes a confident wrong answer far more
        harshly than a tentative one.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{MSE} &= \\frac{1}{n} \\sum_{i=1}^{n} \\bigl(y_i - \\hat{f}(x_i)\\bigr)^2 \\\\
  \\text{0-1 loss} &= \\mathbb{1}\\bigl[f(x_i) \\neq y_i\\bigr] \\\\
  \\text{log-loss} &= -y_i \\log \\hat{p}_i - (1 - y_i)\\log(1 - \\hat{p}_i)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\mathbb{1}[\\cdot]"}</InlineMath> is the indicator
        function (1 if its argument is true, 0 otherwise) and{" "}
        <InlineMath>{"\\hat{p}_i"}</InlineMath> is the model's predicted
        probability that example <InlineMath>i</InlineMath> belongs to class
        1. The polynomial-fitting exercise below is scored with MSE; the
        classifier later in this chapter is trained with log-loss. Minimizing
        log-loss over the training set is exactly maximum likelihood
        estimation for a Bernoulli-distributed label — the same MLE principle
        Chapter 1 introduces for fitting a coin's bias, applied here to a
        model's predicted probability instead of a single fixed parameter.
      </p>

      <p style={prose}>
        One more piece of vocabulary is needed before any of this can be used
        honestly: since fitting <InlineMath>{"\\hat{f}"}</InlineMath> and
        judging how well it generalizes on the very same data would let it
        cheat, practice splits the available examples into a training set (used
        to fit the model), a validation set (held out and used only to compare
        candidate models or hyperparameters — settings chosen by us rather than
        learned from the data), and a test set (touched exactly once, at the
        very end, to report a final number). Averaging this
        validation score over several different splits of the data is called
        cross-validation — a way to estimate generalization error without
        spending the one-time-only test set on every candidate choice.
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
        puzzle we revisit later in this chapter when we meet double descent.
      </p>

      {/* ── Section 2: Linear & Logistic Regression ──────────────────────── */}
      <div id="linear-and-logistic-regression">
        <SectionTitle>Linear & Logistic Regression</SectionTitle>
      </div>

      <p style={prose}>
        The abstract hypothesis class <InlineMath>H</InlineMath> above becomes
        concrete the moment we pick an actual family of functions. The two
        simplest, and still the most widely used in practice, are linear
        regression and its classification counterpart, logistic regression —
        the first two members of <InlineMath>H</InlineMath> most practitioners
        ever fit, and still the right first baseline to try on any new
        tabular dataset before reaching for something fancier.
      </p>

      <p style={prose}>
        Linear regression restricts <InlineMath>H</InlineMath> to affine
        functions of the input: a weighted sum of the input features plus a
        bias term. Fitting the weights by minimizing MSE has a closed-form
        solution — the normal equations{" "}
        <InlineMath>{"w^{*} = (X^{\\top}X)^{-1}X^{\\top}y"}</InlineMath> —
        or can be approximated iteratively by gradient descent (covered in
        Chapter 4), the same two options available for fitting any member of{" "}
        <InlineMath>H</InlineMath>.
      </p>

      <MathBlock>{"$$\\hat{y} = w^{\\top}x + b$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>w</InlineMath> is a learned weight vector, one entry
        per input feature, and <InlineMath>b</InlineMath> is a learned scalar
        bias (intercept). Take four training points{" "}
        <InlineMath>{"(x, y)"}</InlineMath>: <InlineMath>(1, 2)</InlineMath>,{" "}
        <InlineMath>(2, 4)</InlineMath>, <InlineMath>(3, 5)</InlineMath>, and{" "}
        <InlineMath>(4, 8)</InlineMath>. Minimizing squared error over just a
        slope gives <InlineMath>{"\\hat{y} = 1.9x"}</InlineMath> (no intercept
        needed here); the four residuals are 0.1, 0.2, −0.7, and 0.4, for a
        mean squared error of 0.175 — small enough numbers to check by hand, in
        contrast to the millions of weights fit the same way, by the same
        squared-error objective, in later chapters.
      </p>

      <p style={prose}>
        Logistic regression extends this to classification by passing the same
        affine score through the sigmoid link,{" "}
        <InlineMath>{"\\hat{p} = \\sigma(w^{\\top}x + b) = \\frac{1}{1 + e^{-(w^{\\top}x + b)}}"}</InlineMath>,
        squashing an unbounded real number into a valid probability in{" "}
        <InlineMath>{"(0, 1)"}</InlineMath>. A prediction thresholds this
        probability, typically at 0.5. Because there is no closed form for the
        weights that minimize log-loss, logistic regression is fit by gradient
        descent — exactly the procedure the classifier widget later in this
        chapter runs, live in the browser, every time its "Linear" model is
        selected.
      </p>

      <p style={prose}>
        Despite their simplicity, linear and logistic regression remain the
        working baseline every fancier model in this book should be measured
        against: if a deep network cannot beat linear regression on a given
        tabular dataset, the extra complexity is buying nothing.
      </p>

      <p style={prose}>
        Polynomial regression is still linear regression — linear in the{" "}
        <em>coefficients</em>, even though the fitted curve is not a straight
        line — because it simply adds{" "}
        <InlineMath>{"x^2, x^3, \\ldots"}</InlineMath> as extra input features
        and fits the same squared-error objective. Push the degree slider
        below from 1 toward 20; notice validation error tracks training error
        closely at low degree, then diverges sharply upward past roughly degree
        8, even as training error keeps falling toward zero.
      </p>

      <PolynomialFit
        tryThis={{
          do: "Push the degree slider from 1 toward 20.",
          notice:
            "Validation MSE tracks training MSE closely until roughly degree 8, then shoots upward while training MSE keeps falling toward zero — that gap is overfitting.",
        }}
      />

      {/* ── Section 3: Bias-Variance Tradeoff ────────────────────────────── */}
      <div id="bias-variance-tradeoff">
        <SectionTitle>Bias-Variance Tradeoff</SectionTitle>
      </div>

      <p style={prose}>
        The expected test error of any estimator decomposes into three
        irreducible terms: the squared bias (how far the average prediction
        strays from the truth), the variance (how much predictions fluctuate
        across different training sets), and the irreducible noise in the data
        itself. These quantities trade off against each other as model
        complexity grows — gaining flexibility to capture the signal also gains
        flexibility to chase the noise. This decomposition is classical [2].
      </p>

      <p style={prose}>
        A model with too few parameters (high bias) fails to capture the signal;
        a model with too many (high variance) fits training noise and fails to
        transfer. The optimal complexity sits at the sweet spot where total
        expected error is minimized — a point that depends on both the true
        function and the size of the training set, and which the formal
        decomposition makes precise [1]. The dartboard below makes this
        concrete: bias is how far the average shot lands from the bullseye,
        variance is how scattered the shots are.
      </p>

      <BiasVarianceDartboard />

      <MathBlock>{"$$\\mathbb{E}\\bigl[(y - \\hat{f}(x))^2\\bigr] = \\underbrace{\\mathrm{Bias}^2[\\hat{f}(x)]}_{\\text{underfitting}} + \\underbrace{\\mathrm{Var}[\\hat{f}(x)]}_{\\text{overfitting}} + \\sigma^2$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\mathrm{Bias}^2[\\hat{f}(x)]"}</InlineMath> is the
        squared bias, <InlineMath>{"\\mathrm{Var}[\\hat{f}(x)]"}</InlineMath> is
        the variance across resamples of the training set, and{" "}
        <InlineMath>{"\\sigma^2"}</InlineMath> is the Bayes error — the
        irreducible noise floor set by the data-generating process itself,
        which no choice of model can push below.
      </p>

      <p style={prose}>
        The classical U-shape was the dominant view of overfitting for a
        generation. Then Belkin et al. (2019) [5] showed that for many widely
        used models — neural networks, random features, kernel machines, even
        decision trees (introduced later in this chapter) — pushing complexity
        past the <em>interpolation threshold</em> (the point at which training
        error first hits zero) produces a <em>second</em> descent in test
        error: the curve climbs into a sharp peak at the threshold, then falls
        again as the model becomes massively overparameterized. The mechanism
        is intuitive: at the threshold the model is forced into a unique,
        brittle solution that fits the noise rigidly, while past it an entire
        family of zero-error solutions becomes available and the optimizer's
        implicit bias selects smoother members of that family. This{" "}
        <em>double descent</em> is much of the reason scaling up neural
        networks works at all, and we return to the inductive bias of
        optimization itself in later chapters. The curve below traces test
        error against model complexity, laying the classical U-shape and the
        modern double-descent curve over each other so the second descent
        past the interpolation threshold is visible directly.
      </p>

      <DoubleDescentCurve />

      <p style={prose}>
        Complexity is not the only axis worth varying — sample size is the
        other. A learning curve plots training and validation error (the split
        introduced earlier in this chapter) against the number of training
        examples <InlineMath>n</InlineMath>, for one fixed model. In the
        high-bias regime, the two curves converge quickly to a shared, high
        floor: the model is already too simple to exploit more data, so
        gathering more will not help. In the high-variance regime, the curves
        start far apart and converge slowly as <InlineMath>n</InlineMath>{" "}
        grows, telling us that more data — or more regularization — is the
        fix, rather than a different model. Reading these two curves is the
        standard first diagnostic before reaching for a bigger model.
      </p>

      <p style={prose}>
        Drag the complexity slider from 1 toward 3 while watching bias² fall
        sharply and variance start to climb — that trade-off is why the
        widget's optimal-complexity marker sits at degree 3 for almost every
        noise setting. Push further, past 3, and bias² does not keep
        falling: it turns back around and rises alongside variance, gently
        at first and then — past roughly degree 7 — explosively, as fitting
        a high-degree polynomial to just 20 sparse points hits the classic
        Runge's-phenomenon problem (a high-degree fit on non-Chebyshev-spaced
        samples oscillates wildly between them). By degree 15 or higher both
        bias² and variance have exploded by many orders of magnitude, which
        is why the chart's y-axis is log-scaled rather than linear. Raising
        the noise level barely moves the optimal-complexity marker — it
        stays pinned at degree 3 across nearly the whole slider range, and
        only drops to degree 1 once noise is cranked into its top tenth.
      </p>

      <BiasVariance
        tryThis={{
          do: "Drag complexity from 1 to 20, then raise the noise level.",
          notice:
            "Bias² falls sharply to a shallow minimum near degree 3, while variance is still low — that's the sweet spot the 'Optimal d' marker sits at for almost every noise setting. Push complexity further and bias² turns around, rising alongside variance, gently at first and then — past roughly degree 7 — explosively, as the polynomial fit becomes numerically unstable on just 20 training points (the log-scaled y-axis shows this honestly instead of clipping it). The optimal-complexity marker barely moves as noise rises; it only shifts down to degree 1 once noise is near its maximum.",
        }}
      />

      {/* ── Section 4: The Classical Toolbox ─────────────────────────────── */}
      <div id="the-classical-toolbox">
        <SectionTitle>The Classical Toolbox</SectionTitle>
      </div>

      <p style={prose}>
        Before neural networks arrive in Chapter 3, it is worth meeting four
        classical, non-neural hypothesis classes that remain workhorses in
        practice: k-nearest neighbors, decision trees, the ensembles built
        from many of either, and kernel methods.
      </p>

      <p style={prose}>
        k-nearest neighbors (kNN) is the simplest hypothesis class in this
        book: store the entire training set, and to predict a new point, find
        its <InlineMath>k</InlineMath> closest training examples (by, say,
        Euclidean distance) and return their majority class, or their average
        value for regression. There is no training phase at all — the work
        moves entirely into prediction time, one reason kNN falls out of favor
        as datasets grow into the millions.
      </p>

      <p style={prose}>
        kNN's Achilles' heel is dimensionality. In a{" "}
        <InlineMath>d</InlineMath>-dimensional unit hypercube, the fraction of
        volume lying within a fixed distance of the boundary approaches 1 as{" "}
        <InlineMath>d</InlineMath> grows, so distances between random points
        concentrate and "nearest" stops meaning very much. Keeping neighbor
        density fixed as <InlineMath>d</InlineMath> grows requires the sample
        size to grow exponentially in <InlineMath>d</InlineMath>, a phenomenon
        known as the curse of dimensionality; it is the reason kNN and other
        distance-based methods degrade sharply in high dimensions while
        performing well on a handful of features.
      </p>

      <p style={prose}>
        Decision trees take the opposite strategy: rather than compare a new
        point to stored examples, they learn a sequence of axis-aligned splits
        — "is feature 3 greater than 5.2?" — arranged in a binary tree, with
        each leaf predicting the majority class, or mean value, of the
        training points that land there. Splits are chosen greedily to
        maximize the purity of the resulting children, most commonly by
        minimizing Gini impurity or entropy, both zero for a pure leaf and
        largest when classes are evenly mixed.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  G &= 1 - \\sum_{c} p_c^2 \\\\
  H &= -\\sum_{c} p_c \\log p_c
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"p_c"}</InlineMath> is the fraction of training
        points at a given node belonging to class{" "}
        <InlineMath>c</InlineMath>; both <InlineMath>G</InlineMath> and{" "}
        <InlineMath>H</InlineMath> reach their minimum of zero at a pure node.
      </p>

      <p style={prose}>
        A single decision tree is a high-variance model — small changes to the
        training data can flip an early split and cascade into a very
        different tree. Bagging (bootstrap aggregating) tames this by training
        many trees on random resamples of the data and averaging their
        predictions; a random forest adds a second source of randomness,
        restricting each split to a random subset of features, decorrelating
        the trees further. Averaging many high-variance, low-bias models
        cancels out their individual variance while leaving the shared bias
        essentially unchanged — random forests are, in effect, an automated
        way to buy back the variance the bias-variance tradeoff charges for a
        single flexible tree.
      </p>

      <p style={prose}>
        Boosting takes the complementary approach: fit a weak, high-bias model
        (often a shallow tree), then fit a second model to the errors the
        first one made, then a third to what remains, and so on — gradient
        boosting frames this precisely as gradient descent in function space.
        Each new member chips away at the bias the ensemble has not yet
        corrected, at some cost in variance; modern gradient-boosted tree
        libraries remain a leading choice for tabular data even in 2026, often
        outperforming neural networks on exactly this kind of data.
      </p>

      <p style={prose}>
        Kernel methods take yet another strategy: instead of storing raw
        training points as kNN does, or partitioning the space with splits as
        trees do, a kernel measures how similar a new point is to each stored
        training point and blends those points' labels weighted by that
        similarity. A bandwidth parameter controls how local or global the
        blend is — a narrow bandwidth counts only the closest few points as
        similar, so the boundary hugs individual examples tightly, while a
        wide bandwidth lets distant points contribute too, smoothing the
        boundary out. The classifier widget later in this chapter offers
        exactly this kind of model as one of its three options.
      </p>

      <p style={prose}>
        The shapes these hypothesis classes carve out of the input space are
        strikingly different from linear regression's flat boundary — kNN's
        jagged, locally constant regions appear side by side with a linear and
        a kernel boundary later in this chapter, in Decision Boundaries.
      </p>

      {/* ── Section 5: Regularization ─────────────────────────────────────── */}
      <div id="regularization">
        <SectionTitle>Regularization</SectionTitle>
      </div>

      <p style={prose}>
        Regularization shrinks the effective hypothesis class toward simpler
        solutions by attaching a penalty term to the loss being minimized. The
        two most common choices are <InlineMath>{"L_2"}</InlineMath> (ridge),
        which penalizes the squared norm of the weights, and{" "}
        <InlineMath>{"L_1"}</InlineMath> (lasso), which penalizes the absolute
        norm and induces sparsity by driving individual weights exactly to
        zero. A third option, elastic net, blends the two: it applies both
        penalties at once, controlled by a mixing parameter{" "}
        <InlineMath>{"\\alpha"}</InlineMath> that interpolates between pure
        lasso (<InlineMath>{"\\alpha = 1"}</InlineMath>) and pure ridge (
        <InlineMath>{"\\alpha = 0"}</InlineMath>), trading off lasso's sparsity
        against ridge's smoother, more stable handling of correlated
        features.
      </p>

      <MathBlock>{"$$\\hat{f}_{\\lambda} = \\arg\\min_{f \\in \\mathcal{H}} \\frac{1}{n}\\sum_{i=1}^{n} L(f(x_i), y_i) + \\lambda\\,\\Omega(f)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\Omega(f)"}</InlineMath> is the penalty (the{" "}
        <InlineMath>{"L_1"}</InlineMath> or <InlineMath>{"L_2"}</InlineMath>{" "}
        norm of the weights, for the two cases above) and{" "}
        <InlineMath>{"\\lambda"}</InlineMath> is a hyperparameter controlling
        how strongly it is enforced. Geometrically, the{" "}
        <InlineMath>{"L_1"}</InlineMath> constraint region has corners on the
        coordinate axes that the loss contours tend to intersect, which is why
        lasso zeroes out weights while ridge only ever shrinks them.
      </p>

      <L1L2Geometry />

      <p style={prose}>
        The regularization strength <InlineMath>{"\\lambda"}</InlineMath> is a
        hyperparameter that controls the bias-variance tradeoff directly: larger{" "}
        <InlineMath>{"\\lambda"}</InlineMath> increases bias and decreases
        variance. In practice, <InlineMath>{"\\lambda"}</InlineMath> is
        selected via the cross-validation procedure introduced earlier in this
        chapter — fit on the training split for each candidate{" "}
        <InlineMath>{"\\lambda"}</InlineMath>, score on the validation split,
        and keep whichever generalizes best — and the right choice can be the
        single largest lever for improving generalization on a fixed
        architecture.
      </p>

      <p style={prose}>
        More broadly, regularization is the <em>injection of prior belief</em>{" "}
        about what a good function looks like, expressed as a preference for
        simpler solutions in the absence of contrary evidence.{" "}
        <InlineMath>{"L_2"}</InlineMath> says "all weights should be small";{" "}
        <InlineMath>{"L_1"}</InlineMath> says "most weights should be exactly
        zero." Looking ahead, dropout (Chapter 5), convolutional
        weight-sharing (Chapter 6), and stochastic gradient descent (Chapter 4)
        all instantiate this same principle — regularization through
        architecture and optimization rather than an explicit penalty term —
        in different guises.
      </p>

      <p style={prose}>
        Switch between L1, L2, and Elastic Net below while raising{" "}
        <InlineMath>{"\\lambda"}</InlineMath> from 0 toward 1; notice L1
        snapping individual weight bars to exactly zero one at a time, while
        L2 only ever shrinks every bar smoothly toward zero without
        eliminating any of them. Under Elastic Net, with{" "}
        <InlineMath>{"\\lambda"}</InlineMath> held fixed above 0, drag{" "}
        <InlineMath>{"\\alpha"}</InlineMath> from 0 toward 1 and notice more
        bars snap to zero the higher <InlineMath>{"\\alpha"}</InlineMath>{" "}
        climbs — the blend sliding from ridge-like shrinkage toward
        lasso-like sparsity.
      </p>

      <RegularizationExplorer
        tryThis={{
          do: "Switch from L2 to L1 and raise λ past roughly 0.5, then try Elastic Net while dragging α from 0 to 1.",
          notice:
            "L1 snaps individual weight bars to exactly zero one at a time, while L2 only ever shrinks every bar smoothly without eliminating any of them. Under Elastic Net, raising α moves the blend from ridge-like shrinkage toward lasso-like sparsity — more bars snap to zero as α approaches 1.",
        }}
      />

      {/* ── Section 6: Decision Boundaries ───────────────────────────────── */}
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
        The No Free Lunch theorem [3] formalizes just how much this choice
        matters: averaged over all possible data-generating distributions,
        every algorithm performs equally — no model dominates all problems.
        The choice of hypothesis class is therefore always a bet on the
        structure of the specific problem at hand, and understanding the
        geometries a chosen hypothesis class can and cannot represent is
        essential to principled model selection.
      </p>

      <p style={prose}>
        The operational concept here is <em>inductive bias</em>: the set of
        boundary geometries a hypothesis class can express, together with the
        preference ordering over them imposed by the loss and regularizer.
        Linear models bias toward halfspaces; k-nearest neighbors biases
        toward locally constant regions; decision trees bias toward
        axis-aligned partitions; neural networks bias toward compositionally
        structured boundaries whose form is shaped by depth and connectivity.
        None of these ever beats the Bayes-optimal boundary — the best
        achievable decision rule given the true, usually unknown
        class-conditional distributions, and the classification counterpart to
        the Bayes error from the Bias-Variance Tradeoff section — but
        different hypothesis classes approach it from different directions and
        at different rates. Read this way, No Free Lunch does not say all
        models are equal in practice — it says they are equal{" "}
        <em>averaged over all possible problems</em>. Real problems live in a
        vanishingly thin slice of that space, and the entire game of
        supervised learning is matching inductive bias to the structure that
        actually appears in nature.
      </p>

      <p style={prose}>
        The figure below places three of these side by side: a linear
        boundary, a smooth kernel boundary, and 1-nearest-neighbor's jagged,
        locally constant partition, all fit to the same dataset.
      </p>

      <DecisionBoundaryShapes />

      <p style={prose}>
        Switch the model below between Linear, Polynomial, and the RBF
        (radial basis function) kernel — which measures similarity to each
        training point by distance rather than a fixed polynomial degree —
        then raise complexity under RBF; notice the boundary wrap ever more
        tightly around individual points as its bandwidth narrows, with train
        accuracy climbing toward 100% right where that tight wrapping starts
        memorizing noise instead of signal.
      </p>

      <DecisionBoundary
        tryThis={{
          do: "Switch the model to RBF and raise complexity toward 1.",
          notice:
            "The boundary wraps tighter around individual points as its bandwidth narrows, and train accuracy climbs toward 100% right where that tight wrapping starts memorizing noise instead of signal.",
        }}
      />

      {/* ── What carries forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        Every later chapter in this book is, underneath its specific
        architecture, still an instance of the machinery built here: a
        hypothesis class, a loss function, and empirical risk minimization
        standing in for the true risk we cannot compute directly. The
        bias-variance tradeoff, the discipline of holding out validation data,
        regularization as encoded prior belief, and inductive bias as the
        honest name for "why this architecture rather than another" are
        vocabulary every subsequent chapter assumes without re-explaining.
        Chapter 3 gives this hypothesis class its first flexible,
        differentiable form — the neural network — replacing hand-picked
        features like the polynomial and RBF expansions above with features
        the model learns for itself.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
