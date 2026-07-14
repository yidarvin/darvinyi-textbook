import { useTocSections } from "../../components/layout/TocRail";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import DistributionExplorer from "../../components/widgets/ch01/DistributionExplorer";
import MLEFitter from "../../components/widgets/ch01/MLEFitter";
import EntropyKLVisualizer from "../../components/widgets/ch01/EntropyKLVisualizer";
import ThresholdROCExplorer from "../../components/widgets/ch01/ThresholdROCExplorer";

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
    title: "On the Mathematical Foundations of Theoretical Statistics",
    authors: "Fisher",
    venue: "Philosophical Transactions of the Royal Society A",
    year: "1922",
    tag: "seminal",
  },
  "shannon-1948",
  "kullback-leibler-1951",
  {
    title: "An Introduction to ROC Analysis",
    authors: "Fawcett",
    venue: "Pattern Recognition Letters",
    year: "2006",
    tag: "paper",
  },
]);

const TOC_SECTIONS = [
  { id: "uncertainty-as-distributions", label: "Distributions" },
  { id: "fitting-distributions-mle",    label: "MLE & MAP" },
  { id: "entropy-cross-entropy-kl",     label: "Entropy & KL" },
  { id: "judging-classifiers",          label: "Judging Classifiers" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProbabilityAndInformation() {
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
        Chapter 01 · Part I — Foundations
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
        Probability & Information for Machine Learning
      </h1>

      <ChapterLede>
        Every prediction a machine makes is a bet on an uncertain world, and
        probability is the language for stating that bet precisely. The rest
        of this book uses maximum likelihood, entropy, and KL divergence
        freely — this chapter is what makes that possible for a reader
        arriving with no machine-learning background. It builds the
        vocabulary from scratch — coin flips to Gaussians, likelihood to
        information theory, confusion matrices to ROC curves — so that
        nothing later in the book is taken on faith.
      </ChapterLede>

      {/* ── Section 1: Uncertainty as Distributions ──────────────────────── */}
      <div id="uncertainty-as-distributions">
        <SectionTitle>Uncertainty as Distributions</SectionTitle>
      </div>

      <p style={prose}>
        A model that reports "this email is 92% likely to be spam" or "the
        next token is probably 'the'" is making a claim about a{" "}
        <em>random variable</em> — a quantity, written with a capital letter
        like <InlineMath>X</InlineMath>, whose exact value is not fixed in
        advance but is drawn from a range of possibilities according to fixed
        probabilities. A <em>probability distribution</em> is the complete
        accounting of those probabilities: for every value{" "}
        <InlineMath>X</InlineMath> could take, how likely is it? Almost every
        quantity a machine learning system reasons about — a label, a pixel
        intensity, a reward, a next token — is modeled as a random variable
        governed by some distribution, chosen because it is simple enough to
        compute with and rich enough to fit the data at hand.
      </p>

      <p style={prose}>
        Distributions split into two families depending on what values the
        random variable can take. A discrete random variable takes one of a
        finite (or countable) set of values, and its distribution is a{" "}
        <em>probability mass function</em> (pmf) — a table of probabilities,
        one per value, that must sum to exactly 1. A continuous random
        variable takes any value in a real interval, and its distribution is
        a <em>probability density function</em> (pdf) instead — a curve whose
        height at a single point is not itself a probability (it can exceed
        1) but whose area under any interval is the probability the variable
        falls in that interval, and whose total area is exactly 1.
      </p>

      <p style={prose}>
        Three distributions do most of the work in this book. The{" "}
        <strong>Bernoulli</strong> distribution models a single yes/no
        outcome — a coin flip, whether a pixel is foreground or background —
        with one parameter <InlineMath>p</InlineMath>, the probability of the
        "yes" outcome. The <strong>categorical</strong> distribution
        generalizes Bernoulli from two outcomes to{" "}
        <InlineMath>K</InlineMath> of them — a die roll, a token drawn from a
        vocabulary — with one probability per outcome, all non-negative and
        summing to 1. The <strong>Gaussian</strong>, or normal, distribution
        is the default continuous choice, written{" "}
        <InlineMath>{"\\mathcal{N}(\\mu, \\sigma^2)"}</InlineMath> and
        characterized by a mean <InlineMath>{"\\mu"}</InlineMath> (where the
        bulk of its probability sits) and a variance{" "}
        <InlineMath>{"\\sigma^2"}</InlineMath> (how spread out it is) — it is
        ubiquitous less because most real quantities are literally
        bell-shaped and more because sums of many small, independent effects
        converge to it, a fact known as the central limit theorem.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{Bernoulli:}\\quad & P(X=x) = p^{x}(1-p)^{1-x}, \\quad x \\in \\{0,1\\} \\\\
  \\text{Categorical:}\\quad & P(X=k) = p_k, \\quad \\sum_{k=1}^{K} p_k = 1 \\\\
  \\text{Gaussian:}\\quad & f(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}}\\exp\\!\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>p</InlineMath> is the Bernoulli's single success
        probability, <InlineMath>{"p_k"}</InlineMath> is the categorical's
        probability of outcome <InlineMath>k</InlineMath>, and{" "}
        <InlineMath>{"\\mu"}</InlineMath> and{" "}
        <InlineMath>{"\\sigma^2"}</InlineMath> are the Gaussian's mean and
        variance; <InlineMath>{"P(\\cdot)"}</InlineMath> denotes a genuine
        probability in the two discrete cases, while{" "}
        <InlineMath>{"f(x)"}</InlineMath> denotes a density, the continuous
        case's stand-in.
      </p>

      <p style={prose}>
        One more piece of notation is worth fixing now, since it resurfaces
        constantly: the <em>expectation</em>{" "}
        <InlineMath>{"\\mathbb{E}[X]"}</InlineMath>, the probability-weighted
        average of a random variable's possible values — the mean{" "}
        <InlineMath>{"\\mu"}</InlineMath> above is exactly{" "}
        <InlineMath>{"\\mathbb{E}[X]"}</InlineMath> for a Gaussian, and the
        same bracket notation reappears throughout this chapter and the rest
        of the book, from an estimator's expected value to a value function
        averaged over trajectories.
      </p>

      <p style={prose}>
        A distribution can be used two ways: evaluate its density or pmf at a
        specific value to ask "how likely is this outcome?", or sample from it
        to actually generate an outcome. Every sampler below reduces to the
        same primitive — draw a uniform random number{" "}
        <InlineMath>u</InlineMath> between 0 and 1 — transformed differently
        for each distribution. For a Bernoulli(<InlineMath>p</InlineMath>),
        compare <InlineMath>u</InlineMath> to <InlineMath>p</InlineMath>{" "}
        directly: output 1 if <InlineMath>{"u < p"}</InlineMath>, else 0. For
        a categorical over <InlineMath>K</InlineMath> outcomes, stack the
        probabilities into a running total{" "}
        <InlineMath>{"c_1 = p_1,\\ c_2 = p_1+p_2,\\ \\ldots"}</InlineMath> and
        output the smallest <InlineMath>k</InlineMath> with{" "}
        <InlineMath>{"u \\leq c_k"}</InlineMath> — a technique called
        inverse-CDF sampling. For a Gaussian, the Box–Muller transform turns a
        pair of uniforms <InlineMath>{"u_1, u_2"}</InlineMath> into a
        standard normal draw,{" "}
        <InlineMath>{"z = \\sqrt{-2\\ln u_1}\\,\\cos(2\\pi u_2)"}</InlineMath>,
        which is then rescaled to{" "}
        <InlineMath>{"\\mu + \\sigma z"}</InlineMath>.
      </p>

      <p style={prose}>
        Switch between Bernoulli, categorical, and Gaussian below, drag each
        distribution's parameters, and resample; watch the live histogram of
        freshly drawn samples — built with exactly the uniform-to-target
        transforms just described — sit noisy and uneven at low sample
        counts, then settle onto the theoretical curve as more samples
        accumulate.
      </p>

      <DistributionExplorer
        tryThis={{
          do: "Switch between Bernoulli, categorical, and Gaussian, drag each distribution's parameter sliders, and resample.",
          notice:
            "The live histogram of freshly drawn samples is noisy and uneven at low sample counts, but settles onto the theoretical density or pmf curve as the sample count grows — the two are the same object, one built by counting draws and the other written down in closed form.",
        }}
      />

      {/* ── Section 2: Fitting Distributions: MLE (and a Nod to MAP) ──────── */}
      <div id="fitting-distributions-mle">
        <SectionTitle>Fitting Distributions: MLE (and a Nod to MAP)</SectionTitle>
      </div>

      <p style={prose}>
        Section 1 assumed the distribution's parameters —{" "}
        <InlineMath>p</InlineMath>, the <InlineMath>{"p_k"}</InlineMath>'s,{" "}
        <InlineMath>{"\\mu"}</InlineMath> and{" "}
        <InlineMath>{"\\sigma^2"}</InlineMath> — were simply given. In
        practice they almost never are; instead there is a batch of observed
        data, and the job is to find the parameter values that best explain
        it. The tool for doing this is the <em>likelihood</em> — the
        probability of the observed data, viewed as a function of the
        parameters rather than as a function of the data. Flip that framing
        and everything changes: fix the data (it already happened), and ask
        which parameter setting makes it look least like a fluke.
      </p>

      <p style={prose}>
        Assume the data points <InlineMath>{"x_1, \\ldots, x_n"}</InlineMath>{" "}
        are i.i.d. (independent and identically distributed — each drawn
        separately from the same distribution), so their joint probability is
        the product of their individual probabilities. Taking the logarithm
        turns this product into a sum, the <em>log-likelihood</em>, which is
        both easier to differentiate and numerically better behaved (a
        product of many small probabilities underflows toward zero; a sum of
        their logarithms does not) — and because the logarithm is
        monotonically increasing, whatever parameter maximizes the
        log-likelihood also maximizes the likelihood itself. The{" "}
        <em>maximum likelihood estimate</em> (MLE), formalized by Fisher
        (1922) [1], is simply the parameter value that maximizes this
        log-likelihood.
      </p>

      <MathBlock>{"$$L(\\theta) = \\prod_{i=1}^{n} p(x_i;\\theta), \\qquad \\ell(\\theta) = \\log L(\\theta) = \\sum_{i=1}^{n}\\log p(x_i;\\theta), \\qquad \\hat\\theta_{\\text{MLE}} = \\arg\\max_{\\theta}\\ \\ell(\\theta)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"L(\\theta)"}</InlineMath> is the likelihood of
        parameter <InlineMath>{"\\theta"}</InlineMath> given the data,{" "}
        <InlineMath>{"\\ell(\\theta)"}</InlineMath> is its logarithm, and{" "}
        <InlineMath>{"\\hat\\theta_{\\text{MLE}}"}</InlineMath> is whichever{" "}
        <InlineMath>{"\\theta"}</InlineMath> makes that log-likelihood
        largest.
      </p>

      <p style={prose}>
        A coin flipped <InlineMath>{"n=10"}</InlineMath> times comes up heads{" "}
        <InlineMath>{"k=7"}</InlineMath> times. Modeling each flip as
        Bernoulli(<InlineMath>p</InlineMath>), the log-likelihood is{" "}
        <InlineMath>{"\\ell(p) = k\\log p + (n-k)\\log(1-p)"}</InlineMath>;
        setting its derivative to zero and solving gives the maximum
        likelihood estimate for a coin's bias as exactly the fraction of
        heads observed — no calculus required in practice, but calculus is
        exactly what justifies the shortcut.
      </p>

      <MathBlock>{"$$\\ell(p) = 7\\log p + 3\\log(1-p), \\qquad \\frac{d\\ell}{dp} = \\frac{7}{p} - \\frac{3}{1-p} = 0 \\;\\;\\Rightarrow\\;\\; \\hat p_{\\text{MLE}} = \\frac{7}{10} = 0.7$$"}</MathBlock>

      <p style={prose}>
        The same logic applies to a continuous distribution. Take five
        measurements — 1.5, 2.0, 2.5, 3.0, 4.0 — and model them as draws from
        a Gaussian with unknown mean and unknown variance. Differentiating
        the Gaussian log-likelihood with respect to{" "}
        <InlineMath>{"\\mu"}</InlineMath> and setting it to zero gives{" "}
        <InlineMath>{"\\hat\\mu_{\\text{MLE}} = \\frac{1}{n}\\sum_i x_i"}</InlineMath>{" "}
        — the ordinary sample mean, 2.6 for these five points, no different
        in spirit from the coin's fraction of heads. Differentiating with
        respect to <InlineMath>{"\\sigma^2"}</InlineMath> instead gives{" "}
        <InlineMath>{"\\hat\\sigma^2_{\\text{MLE}} = \\frac{1}{n}\\sum_i (x_i-\\hat\\mu)^2 = 0.74"}</InlineMath>{" "}
        — but this is a <em>biased</em> estimator: its expectation is exactly{" "}
        <InlineMath>{"\\frac{n-1}{n}\\sigma^2"}</InlineMath>, systematically
        too small, which is exactly why the "corrected" sample variance most
        statistics software reports by default divides by{" "}
        <InlineMath>{"n-1"}</InlineMath> rather than{" "}
        <InlineMath>n</InlineMath>, giving 0.925 for the same five numbers.
        MLE is not magic; it is just the parameter values that best explain
        the data already seen, and "best explains what already happened" and
        "unbiased estimate of the truth" are not always the same promise.
      </p>

      <MathBlock>{"$$\\hat\\mu_{\\text{MLE}} = \\frac{1}{n}\\sum_{i=1}^n x_i = 2.6, \\qquad \\hat\\sigma^2_{\\text{MLE}} = \\frac{1}{n}\\sum_{i=1}^n (x_i-\\hat\\mu)^2 = 0.74, \\qquad \\mathbb{E}\\big[\\hat\\sigma^2_{\\text{MLE}}\\big] = \\frac{n-1}{n}\\sigma^2$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\hat\\mu_{\\text{MLE}}"}</InlineMath> is the sample
        mean, <InlineMath>{"\\hat\\sigma^2_{\\text{MLE}}"}</InlineMath> is the
        MLE variance estimate (dividing by <InlineMath>n</InlineMath>), and
        the expectation identity shows why it runs low by a factor of{" "}
        <InlineMath>{"(n-1)/n"}</InlineMath> — the reason the unbiased sample
        variance divides by <InlineMath>{"n-1"}</InlineMath> instead.
      </p>

      <p style={prose}>
        Maximum likelihood has one blind spot: it only ever looks at the data
        in front of it, with no way to express "I already had a hunch{" "}
        <InlineMath>p</InlineMath> should be close to 0.5" or "I don't trust
        an estimate built from three data points." <em>Maximum a posteriori</em>{" "}
        (MAP) estimation fixes this by folding in a prior — a distribution{" "}
        <InlineMath>{"p(\\theta)"}</InlineMath> over parameter values, chosen
        before any data is seen, that encodes exactly that kind of prior
        belief — and maximizing the product of likelihood and prior instead
        of likelihood alone.
      </p>

      <p style={prose}>
        The name "maximum a posteriori" is literal: <em>Bayes' theorem</em>{" "}
        says the <em>posterior</em> — the updated distribution over{" "}
        <InlineMath>{"\\theta"}</InlineMath> after seeing the data — is
        proportional to likelihood times prior:{" "}
        <InlineMath>{"p(\\theta \\mid x) \\propto p(x \\mid \\theta)\\,p(\\theta)"}</InlineMath>.
        The normalizing constant that turns this into a genuine probability
        distribution does not depend on <InlineMath>{"\\theta"}</InlineMath>{" "}
        and so cannot move the location of its peak, which means maximizing
        likelihood times prior is exactly maximizing the posterior — MAP
        finds the single most probable parameter value{" "}
        <em>given the data</em>, where MLE finds the value that makes the
        data alone look most probable.
      </p>

      <MathBlock>{"$$p(\\theta \\mid x) \\propto p(x \\mid \\theta)\\,p(\\theta), \\qquad \\hat\\theta_{\\text{MAP}} = \\arg\\max_{\\theta}\\ p(\\theta\\mid x) = \\arg\\max_{\\theta}\\Big[\\ell(\\theta) + \\log p(\\theta)\\Big]$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"p(\\theta \\mid x)"}</InlineMath> is the posterior,{" "}
        <InlineMath>{"p(\\theta)"}</InlineMath> is the prior; adding the
        prior's logarithm to the log-likelihood before maximizing is all MAP
        does differently from MLE, and with enough data the likelihood term
        dominates the prior term and the two estimates converge.
      </p>

      <p style={prose}>
        Drag a few coin-flip points below across the midline to flip them
        between heads and tails, or switch to Gaussian μ mode and drag a data
        point along the axis; watch the log-likelihood curve redraw on every
        change, with its peak — the maximum-likelihood estimate — sliding
        live to sit exactly at the current fraction of heads or sample mean
        of whatever data is on screen, not interpolated between preset
        states. Then switch to the Gaussian σ² mode to watch the biased
        estimator from the worked example above happen live: the curve's
        peak sits left of the dashed unbiased marker for essentially every
        configuration of dragged points.
      </p>

      <MLEFitter
        tryThis={{
          do: "Drag a few coin-flip points across the midline to flip them between heads and tails, switch to Gaussian μ mode and drag a data point along the axis, then switch to Gaussian σ² mode.",
          notice:
            "The log-likelihood curve redraws immediately, and its peak — the maximum-likelihood estimate — slides to sit exactly at the fraction of heads (coin mode) or the sample mean (Gaussian μ mode) of whatever data is currently on screen; in Gaussian σ² mode, that same peak sits left of the dashed unbiased-variance marker for essentially any configuration of points, showing the MLE variance's downward bias directly.",
        }}
      />

      {/* ── Section 3: Entropy, Cross-Entropy, KL ────────────────────────── */}
      <div id="entropy-cross-entropy-kl">
        <SectionTitle>Entropy, Cross-Entropy, KL</SectionTitle>
      </div>

      <p style={prose}>
        An outcome that was fully expected carries no information when it
        happens; an outcome that was almost impossible carries a lot.
        Formalizing this, define the <em>surprise</em> of an outcome{" "}
        <InlineMath>x</InlineMath> under a distribution{" "}
        <InlineMath>p</InlineMath> as{" "}
        <InlineMath>{"-\\log p(x)"}</InlineMath>; this section measures
        surprise in <em>bits</em>, using log base 2 throughout, so a certain
        outcome (<InlineMath>{"p=1"}</InlineMath>) has zero bits of surprise
        and a fair coin flip's outcome (<InlineMath>{"p=1/2"}</InlineMath>)
        has exactly one. <em>Entropy</em> is the expected surprise of
        outcomes actually drawn from <InlineMath>p</InlineMath>, averaged
        using <InlineMath>p</InlineMath> itself, since{" "}
        <InlineMath>p</InlineMath> is the distribution actually generating
        the outcomes.
      </p>

      <MathBlock>{"$$H(p) = \\mathbb{E}_{x\\sim p}[-\\log_2 p(x)] = -\\sum_i p_i \\log_2 p_i$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"H(p)"}</InlineMath> is entropy, measured in bits: the
        average number of bits of surprise a draw from{" "}
        <InlineMath>p</InlineMath> carries, maximized when{" "}
        <InlineMath>p</InlineMath> is uniform (maximal uncertainty) and zero
        when <InlineMath>p</InlineMath> places all its mass on one outcome
        (no uncertainty at all).
      </p>

      <p style={prose}>
        Entropy has an operational meaning discovered by Shannon (1948) [2]:
        it is the shortest average number of bits per outcome any code can
        achieve when outcomes truly follow <InlineMath>p</InlineMath>,
        achieved by giving outcome <InlineMath>i</InlineMath> a codeword
        roughly <InlineMath>{"-\\log_2 p_i"}</InlineMath> bits long.{" "}
        <em>Cross-entropy</em> asks a harsher question: what if the code was
        built assuming a different distribution{" "}
        <InlineMath>q</InlineMath>, but outcomes keep arriving from the true{" "}
        <InlineMath>p</InlineMath>? <InlineMath>{"H(p,q)"}</InlineMath>, the
        cross-entropy, is the expected code length paid under that mismatch —
        always at least as large as <InlineMath>{"H(p)"}</InlineMath>, the
        true minimum, and strictly larger whenever{" "}
        <InlineMath>q</InlineMath> disagrees with <InlineMath>p</InlineMath>.
      </p>

      <MathBlock>{"$$H(p,q) = -\\sum_i p_i \\log_2 q_i$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"H(p,q)"}</InlineMath> is cross-entropy — the "cost of
        the wrong code": <InlineMath>p</InlineMath> sets which outcomes
        actually occur and how often, while <InlineMath>q</InlineMath>{" "}
        determines the (possibly wrong) code lengths used to encode them.
      </p>

      <p style={prose}>
        The gap between the code actually used and the best possible code is
        the <em>Kullback–Leibler (KL) divergence</em>, formalized by Kullback
        &amp; Leibler (1951) [3]: the extra bits cross-entropy wastes over
        entropy alone. <InlineMath>{"KL(p\\|q)"}</InlineMath> is zero exactly
        when <InlineMath>{"q=p"}</InlineMath> everywhere, and it is
        asymmetric — <InlineMath>{"KL(p\\|q)"}</InlineMath> is generally not
        equal to <InlineMath>{"KL(q\\|p)"}</InlineMath> — since one measures
        the wasted bits of a <InlineMath>p</InlineMath>-built code judged
        against <InlineMath>q</InlineMath>-generated outcomes and the other
        measures the reverse, a distinction that matters later whenever this
        book has to choose which direction of KL to minimize.
      </p>

      <MathBlock>{"$$KL(p\\|q) = H(p,q) - H(p) = \\sum_i p_i \\log_2 \\frac{p_i}{q_i}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"KL(p\\|q)"}</InlineMath> is the KL divergence from{" "}
        <InlineMath>q</InlineMath> to <InlineMath>p</InlineMath> — always
        non-negative, zero only at equality, and read as the wasted bits of
        using <InlineMath>q</InlineMath>'s code where{" "}
        <InlineMath>p</InlineMath> is the truth.
      </p>

      <p style={prose}>
        These three quantities resurface constantly. Cross-entropy is the
        loss function nearly every classifier in this book is trained with,
        introduced formally in Chapter 3; the evidence lower bound (ELBO)
        that trains variational autoencoders in Chapter 18 is built directly
        from a KL term regularizing a learned distribution toward a prior;
        and the RLHF training objective in Chapter 13 adds an explicit KL
        penalty to keep a fine-tuned policy from straying too far from its
        starting point. Every one of these later uses is the same{" "}
        <InlineMath>{"H(p)"}</InlineMath>, <InlineMath>{"H(p,q)"}</InlineMath>,
        and <InlineMath>{"KL(p\\|q)"}</InlineMath> defined above, applied to a
        different pair of distributions.
      </p>

      <p style={prose}>
        Drag <InlineMath>p</InlineMath>'s sliders toward one category and{" "}
        <InlineMath>q</InlineMath>'s sliders toward a different one below,
        watching both renormalize to sum to 1 after every adjustment; notice{" "}
        <InlineMath>{"KL(p\\|q)"}</InlineMath> grow sharply as{" "}
        <InlineMath>q</InlineMath> assigns near-zero probability to an
        outcome <InlineMath>p</InlineMath> still puts real weight on, while{" "}
        <InlineMath>{"H(p)"}</InlineMath> alone barely moves.
      </p>

      <EntropyKLVisualizer
        tryThis={{
          do: "Drag p's sliders toward one category and q's sliders toward a different one below, watching both renormalize to sum to 1.",
          notice:
            "KL(p‖q) grows sharply — even without bound — as q assigns near-zero probability to an outcome p still puts real weight on, while H(p) alone barely moves, since it only depends on p; the KL term is entirely a statement about q's mismatch to p, not about how uncertain p itself is.",
        }}
      />

      <p style={prose}>
        Going deeper: everything above assumed a discrete distribution. For
        continuous distributions the analogous quantity, differential
        entropy, replaces the sum with an integral — but it loses some of
        discrete entropy's clean properties (it can be negative, and it is
        not invariant to a change of variables), which is one reason this
        book's continuous-KL calculations, such as Chapter 18's Gaussian
        posteriors, work with a closed-form KL between two Gaussians rather
        than reasoning about differential entropy directly.
      </p>

      {/* ── Section 4: Judging Classifiers ───────────────────────────────── */}
      <div id="judging-classifiers">
        <SectionTitle>Judging Classifiers</SectionTitle>
      </div>

      <p style={prose}>
        A trained binary classifier rarely outputs a hard yes/no; more often
        it outputs a continuous score — a probability, a logit (an
        unnormalized pre-probability score), a distance from a decision
        boundary — and a threshold converts that score into a decision.
        Comparing a classifier's decisions against the true labels on a
        held-out set produces four counts, together called the{" "}
        <em>confusion matrix</em>: true positives (<InlineMath>TP</InlineMath>,
        correctly flagged positive), false positives (
        <InlineMath>FP</InlineMath>, incorrectly flagged positive), true
        negatives (<InlineMath>TN</InlineMath>, correctly flagged negative),
        and false negatives (<InlineMath>FN</InlineMath>, incorrectly flagged
        negative).
      </p>

      <p style={prose}>
        Accuracy — the fraction of predictions that were correct — can be
        dangerously misleading whenever the classes are imbalanced: a
        detector that always predicts "negative" scores 99% accuracy on a
        disease that affects 1% of patients while catching not a single true
        case. <em>Precision</em> and <em>recall</em> separate the two ways a
        classifier can be wrong: precision is the fraction of the model's
        positive predictions that were actually correct, while recall is the
        fraction of the true positives the model actually found.{" "}
        <InlineMath>{"F_1"}</InlineMath> combines them into their harmonic
        mean — deliberately not their average — so a model cannot buy a good{" "}
        <InlineMath>{"F_1"}</InlineMath> score by excelling on one axis while
        ignoring the other.
      </p>

      <MathBlock>{"$$\\text{precision} = \\frac{TP}{TP+FP}, \\qquad \\text{recall} = \\frac{TP}{TP+FN}, \\qquad F_1 = 2\\cdot\\frac{\\text{precision}\\cdot\\text{recall}}{\\text{precision}+\\text{recall}}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>TP</InlineMath>, <InlineMath>FP</InlineMath>, and{" "}
        <InlineMath>FN</InlineMath> are drawn from the confusion matrix
        above; precision penalizes false alarms, recall penalizes misses, and{" "}
        <InlineMath>{"F_1"}</InlineMath> stays low unless both are
        simultaneously high.
      </p>

      <p style={prose}>
        Every one of these numbers depends on exactly where the threshold is
        set, and sliding it trades recall for precision continuously: a lower
        threshold flags more points positive, catching more true positives
        (higher recall) at the cost of more false alarms (lower precision),
        while a higher threshold does the reverse. The{" "}
        <em>receiver operating characteristic</em> (ROC) curve plots this
        entire trade-off at once, sweeping the threshold across its full
        range and tracing the true positive rate (
        <InlineMath>{"\\text{TPR}"}</InlineMath>, identical to recall)
        against the false positive rate (
        <InlineMath>{"\\text{FPR}"}</InlineMath>, the fraction of true
        negatives incorrectly flagged positive) at every setting. The area
        under this curve, <InlineMath>{"\\text{AUC}"}</InlineMath>, condenses
        the whole trade-off into a single number with a clean probabilistic
        meaning: it is the probability that a randomly chosen positive
        example receives a higher score than a randomly chosen negative one,
        so an <InlineMath>{"\\text{AUC}"}</InlineMath> of 0.5 is no better
        than a coin flip and an <InlineMath>{"\\text{AUC}"}</InlineMath> of
        1.0 is perfect separation.
      </p>

      <MathBlock>{"$$\\text{TPR} = \\text{recall} = \\frac{TP}{TP+FN}, \\qquad \\text{FPR} = \\frac{FP}{FP+TN}, \\qquad \\text{AUC} = P(\\text{score}_{\\text{pos}} > \\text{score}_{\\text{neg}})$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\text{TPR}"}</InlineMath> is recall under its ROC
        name; <InlineMath>{"\\text{FPR}"}</InlineMath> is the false-positive
        analogue, the fraction of true negatives the classifier mislabels;
        and <InlineMath>{"\\text{AUC}"}</InlineMath> is the area swept out
        under the (<InlineMath>{"\\text{FPR}"}</InlineMath>,{" "}
        <InlineMath>{"\\text{TPR}"}</InlineMath>) curve as the threshold
        sweeps its full range. These same precision, recall, and{" "}
        <InlineMath>{"F_1"}</InlineMath> numbers reappear whenever this book
        scores a real classifier — most directly in Chapter 21, when
        benchmark leaderboards need a way to compare models beyond raw
        accuracy.
      </p>

      <p style={prose}>
        Drag the decision threshold below across the two overlapping
        class-conditional distributions, then widen the separation between
        them; notice precision and recall move in opposite directions as the
        threshold slides, and watch the highlighted point sweep out the ROC
        curve itself as the separation between the classes grows.
      </p>

      <ThresholdROCExplorer
        tryThis={{
          do: "Drag the decision threshold from left to right across the two overlapping class-conditional distributions, then widen the separation between them.",
          notice:
            "Precision and recall move in opposite directions as the threshold slides — recall falls while precision climbs — and the highlighted point sweeps out the ROC curve itself; widening the separation between the two classes pushes the whole curve up and to the left, and the reported AUC climbs toward 1.",
        }}
      />

      <p style={prose}>
        Going deeper: the ROC curve was not invented for machine learning at
        all — it was developed during and after the Second World War to
        describe how well a radar operator could distinguish a genuine target
        from noise on a screen, formalized as signal detection theory.
        Fawcett (2006) [4] gives the standard modern treatment for classifier
        evaluation specifically, and the same curve, under the same name, now
        describes everything from medical diagnostic tests to spam filters to
        the benchmark leaderboards this book returns to in Chapter 21.
      </p>

      {/* ── What carries forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        Chapter 2 opens by writing down the statistical learning problem —
        draw data from an unknown distribution, minimize expected risk under
        a loss function — and this chapter built every piece of that
        vocabulary: a distribution is what Section 1 sampled from, and
        minimizing a loss like log-loss is exactly the maximum likelihood
        principle of Section 2, now applied to a model's predicted
        probabilities instead of a coin's bias; MAP's prior term reappears
        too, as the Gaussian-prior justification behind the L2 regularization
        (weight decay) Chapter 2 introduces and Chapter 4 revisits for AdamW's
        decoupled update. Precision, recall, and F1 reappear directly in
        Chapter 21's benchmark leaderboards; the ROC/AUC toolkit this chapter
        builds is the general lens this book uses whenever a threshold turns
        a score into a decision. What should stick: distributions describe uncertainty,
        likelihood and its Bayesian cousin MAP fit a distribution's
        parameters to data, entropy and KL divergence measure the cost of
        describing one distribution with another, and precision/recall/ROC
        turn a trained classifier's raw scores into a judged verdict. Chapter
        2 picks up immediately with the machinery that turns all four of
        these ideas into something that learns from examples.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
