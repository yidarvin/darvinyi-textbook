import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import { buildCitations } from "../../data/citations";
import AutoencoderVsVAE from "../../components/widgets/ch18/AutoencoderVsVAE";
import LatentSpaceExplorer from "../../components/widgets/ch18/LatentSpaceExplorer";
import KLDivergence from "../../components/widgets/ch18/KLDivergence";
import ELBODecomposition from "../../components/widgets/ch18/ELBODecomposition";
import ELBOTerms from "../../components/diagrams/ch18/ELBOTerms";
import ReparameterizationTrick from "../../components/diagrams/ch18/ReparameterizationTrick";
import LatentInterpolation from "../../components/diagrams/ch18/LatentInterpolation";
import BetaVAETradeoff from "../../components/diagrams/ch18/BetaVAETradeoff";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = buildCitations([
  { title: "Auto-Encoding Variational Bayes", authors: "Kingma & Welling", venue: "ICLR", year: "2014", tag: "seminal" },
  { title: "Stochastic Backpropagation and Approximate Inference in Deep Generative Models", authors: "Rezende, Mohamed, Wierstra", venue: "ICML", year: "2014", tag: "paper" },
  { title: "beta-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework", authors: "Higgins et al.", venue: "ICLR", year: "2017", tag: "paper" },
  { title: "An Introduction to Variational Autoencoders", authors: "Kingma & Welling", venue: "Foundations and Trends in Machine Learning", year: "2019", tag: "survey" },
  { title: "Understanding disentangling in beta-VAE", authors: "Burgess et al.", venue: "NIPS Workshop", year: "2017", tag: "paper" },
  { title: "Extracting and Composing Robust Features with Denoising Autoencoders", authors: "Vincent, Larochelle, Bengio, Manzagol", venue: "ICML", year: "2008", tag: "paper" },
  { title: "Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning", authors: "Williams", venue: "Machine Learning 8(3-4)", year: "1992", tag: "seminal" },
  { title: "Challenging Common Assumptions in the Unsupervised Learning of Disentangled Representations", authors: "Locatello, Bauer, Lucic, Rätsch, Gelly, Schölkopf, Bachem", venue: "ICML", year: "2019", tag: "paper" },
  "latent-diffusion",
  "vq-vae",
  { title: "Understanding Diffusion Models: A Unified Perspective", authors: "Luo", venue: "arXiv", year: "2022", tag: "paper" },
]);

const TOC_SECTIONS = [
  { id: "autoencoders-and-their-limits", label: "Autoencoders" },
  { id: "the-variational-lower-bound",   label: "The ELBO" },
  { id: "the-reparameterization-trick",  label: "Reparameterization" },
  { id: "latent-space-exploration",      label: "Latent Space" },
  { id: "beta-vae-disentanglement",      label: "beta-VAE" },
];

export default function VAEs() {
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
        Chapter 18 · Part V — Generative Models
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
        Variational Autoencoders
      </h1>

      <ChapterLede>
        A standard autoencoder compresses data into a latent code and reconstructs
        it — but the latent space it learns is unstructured, full of gaps that
        decode to nonsense. A variational autoencoder replaces that single latent
        code with a learned distribution, so every neighborhood of the latent
        space means something. The result is a latent space smooth and dense
        enough to generate from, not just compress into — the property every
        later generative model in this book inherits in some form.
      </ChapterLede>

      {/* ── Section 1: Autoencoders & Their Limits ──────────────────────────── */}
      <div id="autoencoders-and-their-limits">
        <SectionTitle>Autoencoders &amp; Their Limits</SectionTitle>
      </div>

      <p style={prose}>
        A standard autoencoder trains an encoder <InlineMath>{"E"}</InlineMath> and
        decoder <InlineMath>{"D"}</InlineMath> such that <InlineMath>{"D(E(x))"}</InlineMath>{" "}
        approximates <InlineMath>{"x"}</InlineMath>. The encoder compresses the
        input into a latent code <InlineMath>{"z"}</InlineMath>; the decoder
        reconstructs from <InlineMath>{"z"}</InlineMath>. Training minimizes
        reconstruction loss, which produces a latent space that is often
        irregular — clusters for each training class with large gaps between
        them. Sampling a random point in this space and decoding it frequently
        produces incoherent output because the gaps are never visited during
        training and the decoder learns nothing about them.
      </p>

      <p style={prose}>
        The deeper way to read this is through the <em>manifold hypothesis</em>:
        natural data — images of faces, recordings of speech, sentences — is
        believed to lie on a low-dimensional manifold inside its high-dimensional
        ambient space. (A manifold is simply a lower-dimensional curved surface
        sitting inside a bigger space — the way a 2-D sheet of paper stays 2-D
        even after being crumpled into a 3-D ball.) An autoencoder's bottleneck
        is forced to discover that manifold's coordinates: the encoder maps
        inputs onto it, the decoder learns the inverse. The trouble for
        generation isn't that the manifold is wrong — it's that the network only
        learns it at the training points, with no obligation about what happens
        between them. Variants like denoising autoencoders (Vincent et al.
        (2008) [6]) and sparse autoencoders patch this by adding regularization,
        but the basic limitation remains until we replace the deterministic
        latent code with a distribution.
      </p>

      <p style={prose}>
        Whether the gaps matter depends on what the autoencoder is used for. If
        the use case is dimensionality reduction or anomaly detection — encode,
        decode, compare to the input — the gaps are tolerable, because
        reconstruction only ever touches genuinely encoded points. For{" "}
        <em>generative</em> use, where the goal is to sample new points from the
        latent space and produce coherent outputs, the gaps are fatal. The
        VAE's contribution is making the latent space dense by construction, so
        every point drawn from it decodes to something plausible. That's the
        whole game.
      </p>

      <p style={prose}>
        Click Sample a few times in each panel below; notice how often the
        standard autoencoder's point lands in the gap between clusters, while
        the VAE's rarely does, staying inside a meaningful region even near
        the edges of the distribution. Then drag the A→B slider and watch the
        interpolation path cross empty space on the left but stay coherent on
        the right.
      </p>

      <AutoencoderVsVAE
        tryThis={{
          do: "Click Sample several times in each panel, then drag the A→B slider from 0 to 1.",
          notice: "The autoencoder's samples and interpolation path repeatedly land in the gap between clusters, while the VAE's almost always decode to something meaningful — the density heatmap has far fewer gaps to fall into.",
        }}
      />

      {/* ── Section 2: The Variational Lower Bound ──────────────────────────── */}
      <div id="the-variational-lower-bound">
        <SectionTitle>The Variational Lower Bound</SectionTitle>
      </div>

      <p style={prose}>
        A VAE is a <em>latent-variable model</em>: it assumes every observed{" "}
        <InlineMath>{"x"}</InlineMath> was generated by first drawing a latent
        code <InlineMath>{"z"}</InlineMath> from a simple prior{" "}
        <InlineMath>{"p(z)"}</InlineMath>, then drawing{" "}
        <InlineMath>{"x"}</InlineMath> from a decoder likelihood{" "}
        <InlineMath>{"p(x \\mid z)"}</InlineMath>. Training by maximum
        likelihood would maximize the probability the model assigns the data —
        the log marginal likelihood <InlineMath>{"\\log p(x)"}</InlineMath> —
        obtained by marginalizing the latent variable out of the joint
        distribution entirely.
      </p>

      <MathBlock>{"$$\\log p(x) = \\log \\int p(x \\mid z)\\, p(z) \\, dz$$"}</MathBlock>

      <p style={prose}>
        This integral has no closed form once <InlineMath>{"p(x \\mid z)"}</InlineMath>{" "}
        is a neural network: nothing about a nonlinear decoder is conjugate to
        a Gaussian prior, so there's no algebraic shortcut that collapses the
        integral to a formula. Evaluating it numerically by sampling{" "}
        <InlineMath>{"z"}</InlineMath> from the prior and averaging{" "}
        <InlineMath>{"p(x \\mid z)"}</InlineMath> doesn't work either — for any
        specific <InlineMath>{"x"}</InlineMath>, the overwhelming majority of{" "}
        <InlineMath>{"z"}</InlineMath> drawn from <InlineMath>{"p(z)"}</InlineMath>{" "}
        decode to something with vanishing probability of producing that
        particular <InlineMath>{"x"}</InlineMath>, so the Monte Carlo estimate
        never settles. What's needed is a way to concentrate sampling on the{" "}
        <InlineMath>{"z"}</InlineMath> values that plausibly could have
        produced <InlineMath>{"x"}</InlineMath>, rather than sampling blindly
        from the prior — exactly what an encoder network supplies.
      </p>

      <p style={prose}>
        The VAE sidesteps the intractable integral by maximizing a tractable
        stand-in instead: the Evidence Lower BOund (ELBO), a quantity that is
        always computable and is guaranteed to sit at or below the true{" "}
        <InlineMath>{"\\log p(x)"}</InlineMath>. An encoder network outputs the
        parameters of a distribution <InlineMath>{"q(z \\mid x)"}</InlineMath>{" "}
        — the <em>posterior</em>, the encoder's belief about which latent codes
        could plausibly have produced this particular{" "}
        <InlineMath>{"x"}</InlineMath> — and the ELBO decomposes into two terms
        built from it. The reconstruction term encourages the decoder to
        faithfully reconstruct inputs from codes sampled out of{" "}
        <InlineMath>{"q(z \\mid x)"}</InlineMath>. The KL divergence term —
        short for Kullback-Leibler divergence, the same quantity Chapter 1
        defines: a measure of how far one
        probability distribution sits from another, equal to zero only when
        the two match exactly — penalizes{" "}
        <InlineMath>{"q(z \\mid x)"}</InlineMath> for straying from a standard
        Gaussian <em>prior</em> <InlineMath>{"p(z) = \\mathcal{N}(0, I)"}</InlineMath>:
        a fixed reference distribution, chosen before any data is seen, that
        every encoded point is pulled toward. This regularization term is what
        forces the latent space to be smooth and continuous — it prevents the
        encoder from collapsing each input to a single point with zero
        variance, which would reduce the VAE back to a standard autoencoder.
      </p>

      <p style={prose}>
        The machinery wasn't invented once — two papers published in 2014
        independently derived essentially the same recipe. Kingma &amp;
        Welling's (2014) <em>Auto-Encoding Variational Bayes</em> [1] framed it
        as <em>amortized variational inference</em>: one trained network
        predicts every input's posterior directly, instead of re-solving a
        separate optimization for each data point from scratch. Rezende et al.
        (2014) [2] derived stochastic backpropagation as a general tool for
        variational inference. Both converged on the same core algorithm —
        encoder produces parameters of a tractable posterior, sample from it
        via a differentiable transformation, decode, optimize the ELBO
        end-to-end. Subsequent variants build on this pattern in different
        directions: β-VAE reweights the KL term (covered later in this
        chapter), VQ-VAE replaces the Gaussian latent with a discrete codebook
        (also covered later), and importance-weighted autoencoders tighten the
        bound itself by averaging the reconstruction term over several samples
        of <InlineMath>{"z"}</InlineMath> per input rather than one, trading
        extra compute for a strictly tighter estimate of{" "}
        <InlineMath>{"\\log p(x)"}</InlineMath>. Kingma &amp; Welling's (2019)
        survey [4] is the standard consolidated reference for the whole
        framework.
      </p>

      <p style={prose}>
        The ELBO isn't an arbitrary objective — it's a lower bound on the log
        marginal likelihood <InlineMath>{"\\log p(x)"}</InlineMath> itself. The
        exact relationship is{" "}
        <InlineMath>{"\\log p(x) = \\text{ELBO} + \\text{KL}(q(z \\mid x) \\,\\|\\, p(z \\mid x))"}</InlineMath>.
        The KL term is non-negative, so the ELBO is genuinely a lower bound — and
        maximizing it simultaneously pushes the marginal likelihood up and pulls
        the approximate posterior <InlineMath>{"q(z \\mid x)"}</InlineMath>{" "}
        toward the true posterior <InlineMath>{"p(z \\mid x)"}</InlineMath>. The
        reconstruction term keeps the decoder honest; the KL-to-prior term keeps
        the latent space well-behaved. The two are in tension — pushing one up
        tends to push the other down — and tuning that tension is what makes
        VAE training nontrivial.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{ELBO} &= \\mathbb{E}_{q(z \\mid x)}[\\log p(x \\mid z)] - \\text{KL}\\bigl(q(z \\mid x) \\,\\|\\, p(z)\\bigr) \\\\
  &= \\underbrace{\\text{reconstruction term}}_{\\text{decoder fidelity}} - \\underbrace{\\text{regularization term}}_{\\text{posterior near prior}}
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"q(z \\mid x)"}</InlineMath> is the encoder's
        approximate posterior, <InlineMath>{"p(z)"}</InlineMath> the
        standard-normal prior, and <InlineMath>{"p(x \\mid z)"}</InlineMath>{" "}
        the decoder's reconstruction likelihood.
      </p>

      <p style={prose}>
        The diagram below draws both terms as one pipeline: trace the
        reconstruction path on the left against the posterior-vs-prior
        comparison on the right.
      </p>

      <ELBOTerms />

      <p style={prose}>
        The reconstruction term's exact form depends on what{" "}
        <InlineMath>{"p(x \\mid z)"}</InlineMath> is assumed to be. For binary
        or near-binary pixels (MNIST-style black-and-white digits), the
        standard choice is an independent Bernoulli likelihood per pixel, and
        the reconstruction term reduces to (negative) binary cross-entropy
        between the decoder's output and the input. For continuous-valued
        pixels, the standard choice is an independent Gaussian likelihood with
        fixed or learned variance, and the reconstruction term reduces to
        (weighted) mean-squared error instead. The choice isn't cosmetic: a
        Gaussian likelihood is mean-seeking, so it averages over plausible
        reconstructions rather than committing to one — the direct cause of
        the characteristic blur in VAE samples discussed later in this
        chapter.
      </p>

      <p style={prose}>
        The KL term also has a closed form worth writing out, because it's the
        line of code every VAE implementation actually runs. When both{" "}
        <InlineMath>{"q(z \\mid x)"}</InlineMath> and{" "}
        <InlineMath>{"p(z)"}</InlineMath> are diagonal Gaussians —{" "}
        <InlineMath>{"q(z \\mid x) = \\mathcal{N}(\\mu, \\text{diag}(\\sigma^2))"}</InlineMath>{" "}
        and <InlineMath>{"p(z) = \\mathcal{N}(0, I)"}</InlineMath> — the KL
        divergence has an exact algebraic expression, summed independently
        over each latent dimension <InlineMath>{"i"}</InlineMath>:
      </p>

      <MathBlock>{"$$\\text{KL}(q \\,\\|\\, p) = \\frac{1}{2}\\sum_i \\left(\\mu_i^2 + \\sigma_i^2 - 1 - \\log \\sigma_i^2\\right)$$"}</MathBlock>

      <p style={prose}>
        Each latent dimension contributes its own term, so a wider latent
        space just sums more of them; a dimension that already matches the
        prior exactly (<InlineMath>{"\\mu_i = 0"}</InlineMath>,{" "}
        <InlineMath>{"\\sigma_i = 1"}</InlineMath>) contributes zero. As one
        concrete case: a single latent dimension with{" "}
        <InlineMath>{"\\mu = 0.3"}</InlineMath> and{" "}
        <InlineMath>{"\\sigma = 0.8"}</InlineMath> contributes{" "}
        <InlineMath>{"\\frac{1}{2}(0.3^2 + 0.8^2 - 1 - \\log 0.8^2) = \\frac{1}{2}(0.09 + 0.64 - 1 + 0.446) \\approx 0.088"}</InlineMath>{" "}
        nats of KL penalty — a small nudge back toward the prior, since this
        dimension is already close to it.
      </p>

      <p style={prose}>
        The panel below makes this same formula interactive: drag{" "}
        <InlineMath>{"\\sigma"}</InlineMath> down toward its minimum with{" "}
        <InlineMath>{"\\mu"}</InlineMath> near 0 and watch KL crater toward
        zero, then drag <InlineMath>{"\\mu"}</InlineMath> out toward 3 and
        watch KL climb — the penalty tracking only how far the posterior has
        drifted from the prior.
      </p>

      <KLDivergence
        tryThis={{
          do: "Drag σ down near its minimum with μ close to 0, then drag μ out toward 3.",
          notice: "KL falls toward zero when the posterior sits on top of the prior, and climbs steadily as μ drifts away — exactly the closed-form sum above, computed live.",
        }}
      />

      {/* ── Section 3: The Reparameterization Trick ─────────────────────────── */}
      <div id="the-reparameterization-trick">
        <SectionTitle>The Reparameterization Trick</SectionTitle>
      </div>

      <p style={prose}>
        The encoder outputs parameters{" "}
        <InlineMath>{"(\\mu, \\sigma)"}</InlineMath> of a Gaussian distribution,
        and we sample{" "}
        <InlineMath>{"z \\sim \\mathcal{N}(\\mu, \\sigma^2)"}</InlineMath>. But
        sampling is not differentiable — gradients cannot flow through a
        stochastic node. The reparameterization trick [1, 2] resolves this by
        rewriting the sample as{" "}
        <InlineMath>{"z = \\mu + \\sigma \\odot \\varepsilon"}</InlineMath>,
        where{" "}
        <InlineMath>{"\\varepsilon \\sim \\mathcal{N}(0, I)"}</InlineMath> is
        drawn independently of the parameters. Now gradients flow through{" "}
        <InlineMath>{"\\mu"}</InlineMath> and{" "}
        <InlineMath>{"\\sigma"}</InlineMath> directly, and{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> carries the randomness. This
        simple algebraic rearrangement makes variational inference compatible
        with backpropagation.
      </p>

      <p style={prose}>
        It's worth pausing on why this is hard without the trick. The naïve
        alternative — treating <InlineMath>{"z"}</InlineMath> as a stochastic
        node and using score-function gradient estimators (REINFORCE-style,
        Williams (1992) [7]) — works in principle but has crippling variance in
        practice. Score-function estimators don't propagate gradients{" "}
        <em>through</em> the random variable; they propagate gradients to the{" "}
        <em>parameters of its distribution</em> via the log-derivative trick.
        The variance of this estimator grows with the dimensionality of{" "}
        <InlineMath>{"z"}</InlineMath>, and VAE latents are typically tens to
        hundreds of dimensions. Reparameterization sidesteps this entirely by
        moving the randomness <em>outside</em> the parameterized component —
        gradients now flow through <InlineMath>{"\\mu"}</InlineMath> and{" "}
        <InlineMath>{"\\sigma"}</InlineMath> exactly as in any deterministic
        computation graph, and the random source{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> doesn't carry parameters at
        all.
      </p>

      <p style={prose}>
        The reparameterization trick — express a sample from a parameterized
        distribution as a deterministic function of the parameters and an
        independent noise variable — is one of the most-reused ideas in modern
        deep learning. <em>Normalizing flows</em> are built entirely on this: a
        sample from a complex distribution is constructed by transforming a
        sample from a simple base distribution through an invertible network.{" "}
        <em>Diffusion models</em> apply the same logic recursively over hundreds
        of denoising steps. Even certain RL methods use it for
        continuous-action policies. The VAE paper introduced it as a technical
        fix for one specific problem; in retrospect it was a more general
        lesson about how to make stochastic models trainable end-to-end.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  z &= \\mu + \\sigma \\odot \\varepsilon, \\quad \\varepsilon \\sim \\mathcal{N}(0, I) \\\\
  \\frac{\\partial \\mathcal{L}}{\\partial \\mu} &= \\frac{\\partial \\mathcal{L}}{\\partial z}, \\qquad \\frac{\\partial \\mathcal{L}}{\\partial \\sigma} = \\frac{\\partial \\mathcal{L}}{\\partial z} \\odot \\varepsilon
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\varepsilon"}</InlineMath> is noise drawn
        independently of the network's parameters, so the partial derivatives
        show gradients passing straight through{" "}
        <InlineMath>{"\\mu"}</InlineMath> and being scaled by{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> on their way to{" "}
        <InlineMath>{"\\sigma"}</InlineMath>.
      </p>

      <p style={prose}>
        The diagram below contrasts the two computation graphs directly:
        follow the gradient that dead-ends at the stochastic sampling node on
        the left against the one that flows straight through on the right.
      </p>

      <ReparameterizationTrick />

      {/* ── Section 4: Latent Space Exploration ─────────────────────────────── */}
      <div id="latent-space-exploration">
        <SectionTitle>Latent Space Exploration</SectionTitle>
      </div>

      <p style={prose}>
        Once trained, a VAE can generate a genuinely new{" "}
        <InlineMath>{"x"}</InlineMath> without starting from any real input at
        all. The recipe is direct: (1) sample a latent code{" "}
        <InlineMath>{"z \\sim \\mathcal{N}(0, I)"}</InlineMath> straight from
        the prior, with no encoder involved; (2) pass{" "}
        <InlineMath>{"z"}</InlineMath> through the trained decoder; (3) take
        the decoder's output — the mean of{" "}
        <InlineMath>{"p(x \\mid z)"}</InlineMath>, or a sample drawn from it —
        as the generated <InlineMath>{"x"}</InlineMath>. Every interpolation
        and attribute-arithmetic trick in this section is really an
        elaboration of that same three-step recipe, applied to a{" "}
        <InlineMath>{"z"}</InlineMath> chosen deliberately rather than drawn
        at random.
      </p>

      <p style={prose}>
        Because the KL term pushes the posterior toward{" "}
        <InlineMath>{"\\mathcal{N}(0, I)"}</InlineMath>, the entire latent space
        is dense — every point has a reasonable reconstruction. Interpolating
        linearly between two latent codes produces a smooth morphing sequence
        rather than the abrupt jumps of a standard autoencoder. This smooth
        structure is what makes VAE latent spaces useful for generation,
        editing, and disentanglement: moving in the latent space corresponds to
        meaningful transformations in the output space.
      </p>

      <p style={prose}>
        The famous demonstrations from 2015–2018 made this concrete: continuously
        morphing one MNIST digit into another, sweeping a face VAE's latent
        dimensions to vary expression / glasses / pose without changing
        identity, rotating 3D-rendered chairs smoothly through orientation
        space. These weren't gimmicks — they were direct evidence that the
        latent space had absorbed the variational structure of the data. A
        point exactly between two training images decodes to a coherent image
        that interpolates their content, because the KL regularization left no
        holes for the decoder to fail on.
      </p>

      <p style={prose}>
        The panel below steps through exactly that interpolation: watch the
        decoded output change smoothly frame by frame rather than jumping
        between the two endpoints.
      </p>

      <LatentInterpolation />

      <p style={prose}>
        Beyond interpolation, VAE latent spaces support simple algebraic
        operations on attributes. Subtracting a "no smile" latent from a
        "smile" latent produces a direction vector that, added to any face
        latent, makes that face smile. This kind of attribute arithmetic
        worked well for VAEs and — alongside similar demonstrations from
        GAN-based image models around the same period — led directly to a
        line of controllable-generation research. Modern systems like Stable
        Diffusion still rely on this intuition: text-to-image generation
        steers a latent code through space using text-conditioned guidance,
        but the underlying assumption — that semantic directions exist in
        latent space — is one VAEs helped make concrete early on.
      </p>

      <p style={prose}>
        Switch the panel below to interpolate mode, click a point near one
        corner and another point across the grid, then drag{" "}
        <InlineMath>{"t"}</InlineMath> from 0 to 1; notice the shape's size,
        rotation, and fill all shift continuously with no snap between
        categories.
      </p>

      <LatentSpaceExplorer
        tryThis={{
          do: "Switch to interpolate mode, click a point near one corner and another across the grid, then drag t from 0 to 1.",
          notice: "Every property — shape, size, rotation, fill — morphs continuously along the path; nothing snaps between categories, even as the path crosses from circle-like to square-like to triangle-like regions.",
        }}
      />

      {/* ── Section 5: beta-VAE & Disentanglement ───────────────────────────── */}
      <div id="beta-vae-disentanglement">
        <SectionTitle>beta-VAE &amp; Disentanglement</SectionTitle>
      </div>

      <p style={prose}>
        Multiplying the KL term by a factor{" "}
        <InlineMath>{"\\beta > 1"}</InlineMath> forces the model to use the
        latent dimensions more efficiently under stronger compression. With
        sufficient <InlineMath>{"\\beta"}</InlineMath>, individual latent
        dimensions often become interpretable — one dimension encodes rotation,
        another encodes scale, another encodes color. This disentanglement is
        not guaranteed but emerges because the model learns the most compact
        representation that still allows reconstruction.
      </p>

      <p style={prose}>
        Higgins et al.'s (2017) β-VAE [3] was originally motivated
        empirically: tune <InlineMath>{"\\beta"}</InlineMath> higher and
        individual latent dimensions start to specialize. Burgess et al.
        (2017) [5] gave it a cleaner explanation through the
        information-bottleneck lens: the β-VAE objective can be rewritten as a
        constrained optimization — maximize reconstruction subject to a fixed
        budget on the mutual information{" "}
        <InlineMath>{"I(x; z)"}</InlineMath> between input and latent, roughly
        how many bits about <InlineMath>{"x"}</InlineMath> can be recovered
        just by looking at <InlineMath>{"z"}</InlineMath>. Higher{" "}
        <InlineMath>{"\\beta"}</InlineMath> tightens that information budget,
        forcing the encoder to use latent dimensions efficiently — and one
        efficient strategy is to make each dimension capture an independent
        factor of variation. The disentanglement isn't a free lunch though: the
        same constraint that produces interpretable dimensions also degrades
        reconstruction quality. The <InlineMath>{"\\beta"}</InlineMath>{" "}
        trade-off is a precise version of the rate-distortion problem — the
        classic engineering trade-off between how few bits are spent encoding
        something (rate) and how much fidelity is sacrificed doing so
        (distortion).
      </p>

      <p style={prose}>
        Locatello et al.'s (2019) <em>Challenging Common Assumptions in the
        Unsupervised Learning of Disentangled Representations</em> [8]
        delivered a sobering theoretical and empirical result: unsupervised
        disentanglement is <em>fundamentally impossible</em> without inductive
        biases on the model or the data. They proved that for any disentangled
        representation, there exists an infinite family of equally-good
        entangled representations consistent with the same observations.
        β-VAE's apparent disentanglement comes from architectural choices (the
        diagonal Gaussian posterior, the specific prior, the network capacity)
        that implicitly bias the solution — not from the objective itself. The
        takeaway: disentanglement in β-VAE is real but fragile, depends on
        hyperparameters, and doesn't always replicate across seeds.
        Researchers now treat it as a useful empirical phenomenon rather than
        a guaranteed property.
      </p>

      <MathBlock>{"$$\\mathcal{L}_\\beta = \\mathbb{E}_{q(z \\mid x)}[\\log p(x \\mid z)] - \\beta \\cdot \\text{KL}\\bigl(q(z \\mid x) \\,\\|\\, p(z)\\bigr)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\beta"}</InlineMath> scales the KL penalty
        relative to reconstruction, so larger{" "}
        <InlineMath>{"\\beta"}</InlineMath> trades reconstruction fidelity for
        more compressed, more interpretable latent dimensions.
      </p>

      <p style={prose}>
        The diagram below traces that trade-off directly: follow
        reconstruction quality declining as <InlineMath>{"\\beta"}</InlineMath>{" "}
        increases, and disentanglement rising then falling as{" "}
        <InlineMath>{"\\beta"}</InlineMath> pushes past the sweet spot into
        over-regularization.
      </p>

      <BetaVAETradeoff />

      <p style={prose}>
        Push <InlineMath>{"\\beta"}</InlineMath> far enough and the trade-off
        breaks down in a specific, well-known way: <em>posterior collapse</em>.
        At high <InlineMath>{"\\beta"}</InlineMath>, the cheapest way for the
        model to satisfy the KL penalty is for the encoder to stop using the
        input at all — <InlineMath>{"q(z \\mid x)"}</InlineMath> collapses to
        (nearly) the prior <InlineMath>{"p(z)"}</InlineMath> for every{" "}
        <InlineMath>{"x"}</InlineMath>, driving the KL term toward zero
        regardless of what was actually encoded. With the latent now
        informationally empty, the decoder learns to ignore{" "}
        <InlineMath>{"z"}</InlineMath> entirely and reconstructs from whatever
        weak signal remains, which is why reconstruction quality craters in
        this regime rather than gracefully degrading. Collapse shows up most
        often with powerful decoders — autoregressive or otherwise expressive
        enough to model <InlineMath>{"p(x)"}</InlineMath> on their own — since
        they have less need for the latent code to begin with. Common
        mitigations include KL annealing (starting{" "}
        <InlineMath>{"\\beta"}</InlineMath> near zero and raising it gradually
        during training), a "free bits" floor that stops penalizing KL below
        some minimum per dimension, or simply using a weaker decoder that's
        forced to lean on <InlineMath>{"z"}</InlineMath>.
      </p>

      <p style={prose}>
        The panel below sweeps <InlineMath>{"\\beta"}</InlineMath> from 0 to 5
        directly: drag it upward and watch the reconstruction and
        weighted-KL bars trade off, and the quality meter climb through the
        VAE regime, peak partway into the beta-VAE regime, then decline the
        rest of the way into collapse.
      </p>

      <ELBODecomposition
        tryThis={{
          do: "Drag beta from 0 up to 5, or press Animate sweep.",
          notice: "Latent space quality climbs through the VAE regime, peaks around beta≈2, then declines for the rest of the beta-VAE regime and drops further once beta crosses into collapse — even as reconstruction loss keeps climbing the whole time.",
        }}
      />

      <p style={prose}>
        As standalone generators of high-fidelity images, VAEs lost out to
        GANs and then diffusion models — samples are characteristically
        blurry because the mean-seeking Gaussian likelihood in the
        reconstruction term averages over plausible reconstructions instead of
        committing to sharp detail. But the architectural ideas have been
        absorbed everywhere. Latent Diffusion, the architecture behind Stable
        Diffusion (Rombach et al. (2022) [9]), trains a VAE-style autoencoder
        to compress images into a low-dimensional latent space where a
        diffusion model then operates — every image Stable Diffusion
        generates passes through a VAE encoder and decoder around the
        diffusion process itself.
      </p>

      <p style={prose}>
        VQ-VAE (van den Oord et al. (2017) [10]) keeps the encoder-decoder
        structure but replaces the continuous Gaussian latent with a discrete
        one. A learned codebook holds{" "}
        <InlineMath>{"K"}</InlineMath> embedding vectors{" "}
        <InlineMath>{"\\{e_1, \\ldots, e_K\\}"}</InlineMath>; the encoder's
        continuous output is snapped to whichever codebook vector is nearest
        by Euclidean distance, and that vector's index becomes the discrete
        latent code the decoder reconstructs from. Nearest-neighbor lookup has
        zero gradient almost everywhere, so training uses the{" "}
        <em>straight-through estimator</em>: on the backward pass, the
        gradient arriving at the decoder's input is copied directly back to
        the encoder's output, skipping the quantization step as if it were
        the identity function. A commitment loss term is added to keep the
        encoder's output from drifting too far from the codebook vector it
        keeps getting snapped to.
      </p>

      <MathBlock>{"$$z_q = e_k, \\quad k = \\arg\\min_j \\lVert z_e - e_j \\rVert_2, \\qquad \\frac{\\partial \\mathcal{L}}{\\partial z_e} \\approx \\frac{\\partial \\mathcal{L}}{\\partial z_q}$$"}</MathBlock>

      <p style={prose}>
        The left equation is the nearest-codebook lookup that produces the
        discrete code; the right equation is the straight-through estimator —
        the gradient simply copies across the non-differentiable lookup as if
        it weren't there. This discrete-codebook idea now underpins DALL-E,
        much of modern audio generation, and many multimodal tokenizers. Its
        main failure mode, <em>codebook collapse</em> (most inputs snapping to
        only a handful of the <InlineMath>{"K"}</InlineMath> vectors while the
        rest go unused), motivated finite scalar quantization — a 2023-era
        successor that sidesteps a learned codebook entirely by rounding each
        latent dimension to a small fixed grid of values, now common in newer
        autoregressive image and video tokenizers.
      </p>

      <p style={prose}>
        Diffusion models themselves can be derived as a special case of this
        same framework: a hierarchical VAE with many latent variables chained
        in a fixed sequence instead of one, and a specific, non-learned
        encoder — a fixed Gaussian noising process rather than a trained
        network. Hierarchical VAE architectures such as NVAE and Very Deep
        VAEs worked out that direction directly, stacking dozens of latent
        layers to reach image quality competitive with early diffusion
        models. Luo's (2022) <em>Understanding Diffusion Models: A Unified
        Perspective</em> [11] formalizes the full bridge, showing that
        optimizing a diffusion model's training objective is equivalent to
        optimizing the ELBO of a Markovian hierarchical VAE.
      </p>

      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        What carries forward is the latent-variable recipe itself, not any one
        architecture's sample fidelity: compress into a distribution,
        regularize it toward a simple prior, decode by sampling. Stable
        Diffusion still trains a VAE-style encoder-decoder to compress images
        before diffusion ever runs on them, and VQ-VAE's discrete-codebook
        variant of the same idea underpins DALL-E and much of modern audio
        generation. Chapter 19 (GANs &amp; Image-to-Image Translation) turns
        to a different generative recipe entirely — trading the ELBO's
        explicit likelihood for an adversarial signal, giving up this
        chapter's stable training for sharper samples. The comparison is
        worth holding onto: same goal, sample from a learned distribution over
        data, two structurally different ways of getting there.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
