import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import AutoencoderVsVAE from "../../components/widgets/ch16/AutoencoderVsVAE";
import LatentSpaceExplorer from "../../components/widgets/ch16/LatentSpaceExplorer";
import KLDivergence from "../../components/widgets/ch16/KLDivergence";
import ELBODecomposition from "../../components/widgets/ch16/ELBODecomposition";
import ELBOTerms from "../../components/diagrams/ch16/ELBOTerms";
import ReparameterizationTrick from "../../components/diagrams/ch16/ReparameterizationTrick";
import LatentInterpolation from "../../components/diagrams/ch16/LatentInterpolation";
import BetaVAETradeoff from "../../components/diagrams/ch16/BetaVAETradeoff";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: "[1]", title: "Auto-Encoding Variational Bayes", authors: "Kingma & Welling", venue: "ICLR", year: "2014", tag: "seminal" },
  { num: "[2]", title: "Stochastic Backpropagation and Approximate Inference in Deep Generative Models", authors: "Rezende, Mohamed, Wierstra", venue: "ICML", year: "2014", tag: "paper" },
  { num: "[3]", title: "beta-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework", authors: "Higgins, Matthey, Pal, Burgess, Glorot, Botvinick, Mohamed, Lerchner", venue: "ICLR", year: "2017", tag: "paper" },
  { num: "[4]", title: "An Introduction to Variational Autoencoders", authors: "Kingma & Welling", venue: "Foundations and Trends in Machine Learning", year: "2019", tag: "survey" },
  { num: "[5]", title: "Understanding disentangling in beta-VAE", authors: "Burgess, Higgins, Pal, Matthey, Watters, Desjardins, Lerchner", venue: "NeurIPS Workshop", year: "2018", tag: "paper" },
];

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
        Chapter 16 · Part V — Image Generative Models
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
        it — but the latent space is unstructured. Points between learned codes decode
        to nonsense. A VAE imposes structure by learning a distribution rather than
        a point: the encoder outputs a mean and variance, a sample is drawn, and the
        decoder reconstructs from that sample. The latent space becomes smooth,
        continuous, and generative by construction.
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
        ambient space. An autoencoder's bottleneck is forced to discover that
        manifold's coordinates: the encoder maps inputs onto it, the decoder
        learns the inverse. The trouble for generation isn't that the manifold
        is wrong — it's that the network only learns it at the training points,
        with no obligation about what happens between them. Variants like
        denoising autoencoders (Vincent et al. 2008) and sparse autoencoders
        patch this by adding regularization, but the basic limitation remains
        until we replace the deterministic latent code with a distribution.
      </p>

      <p style={prose}>
        Whether the gaps matter depends on what you want the autoencoder for. If
        the use case is dimensionality reduction or anomaly detection — encode,
        decode, compare to the input — the gaps are tolerable, because you only
        ever decode from genuine encoded points. For <em>generative</em> use,
        where the goal is to sample new points from the latent space and produce
        coherent outputs, the gaps are fatal. The VAE's contribution is making
        the latent space dense by construction, so every point you might draw
        decodes to something plausible. That's the whole game.
      </p>

      <AutoencoderVsVAE />

      {/* ── Section 2: The Variational Lower Bound ──────────────────────────── */}
      <div id="the-variational-lower-bound">
        <SectionTitle>The Variational Lower Bound</SectionTitle>
      </div>

      <p style={prose}>
        The VAE objective is the Evidence Lower BOund (ELBO), which decomposes
        into two terms. The reconstruction term encourages the decoder to
        faithfully reconstruct inputs from sampled latent codes. The KL
        divergence term penalizes the learned posterior{" "}
        <InlineMath>{"q(z \\mid x)"}</InlineMath> for deviating from a standard
        Gaussian prior <InlineMath>{"p(z) = \\mathcal{N}(0, I)"}</InlineMath>.
        This regularization term is what forces the latent space to be smooth
        and continuous — it prevents the encoder from collapsing each input to
        a single point with zero variance, which would reduce the VAE to a
        standard autoencoder.
      </p>

      <p style={prose}>
        The machinery wasn't invented once — two papers published in 2014
        independently derived essentially the same recipe. Kingma &amp; Welling's{" "}
        <em>Auto-Encoding Variational Bayes</em> [1] framed it as
        neural-network-based amortized variational inference; Rezende, Mohamed
        &amp; Wierstra's <em>Stochastic Backpropagation and Approximate Inference
        in Deep Generative Models</em> [2] derived stochastic backpropagation as
        a general tool for variational inference. Both converged on the same
        core algorithm — encoder produces parameters of a tractable posterior,
        sample from it via a differentiable transformation, decode, optimize the
        ELBO end-to-end. The field credits both lineages; subsequent variants
        (β-VAE, VQ-VAE, importance-weighted autoencoders) tend to build on
        Kingma's notation, while the deeper variational inference literature
        builds on Rezende's framing.
      </p>

      <p style={prose}>
        The ELBO isn't an arbitrary objective — it's a lower bound on the log
        marginal likelihood <InlineMath>{"\\log p(x)"}</InlineMath>, the quantity
        a generative model would maximize if it could be computed directly. The
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

      <ELBOTerms />

      <KLDivergence />

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
        stochastic node. The reparameterization trick [1] resolves this by
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
        Williams 1992) — works in principle but has crippling variance in
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

      <ReparameterizationTrick />

      {/* ── Section 4: Latent Space Exploration ─────────────────────────────── */}
      <div id="latent-space-exploration">
        <SectionTitle>Latent Space Exploration</SectionTitle>
      </div>

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

      <LatentInterpolation />

      <p style={prose}>
        Beyond interpolation, VAE latent spaces support simple algebraic
        operations on attributes. Subtract a "no smile" latent from a "smile"
        latent and you get a direction vector that, added to any face latent,
        makes that face smile. This worked surprisingly well for VAEs and led
        directly to a line of controllable-generation research. Modern systems
        like Stable Diffusion still rely on this intuition: text-to-image
        generation steers a latent code through space using text-conditioned
        guidance, but the underlying assumption — that semantic directions
        exist in latent space — is the one VAEs first made concrete.
      </p>

      <LatentSpaceExplorer />

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
        Higgins et al.'s β-VAE [3] was originally motivated empirically: tune{" "}
        <InlineMath>{"\\beta"}</InlineMath> higher and individual latent
        dimensions start to specialize. Burgess et al. (2018) [5] gave it a
        cleaner explanation through the information-bottleneck lens. The β-VAE
        objective can be rewritten as a constrained optimization: maximize
        reconstruction subject to a fixed budget on the mutual information{" "}
        <InlineMath>{"I(x; z)"}</InlineMath> between input and latent. Higher{" "}
        <InlineMath>{"\\beta"}</InlineMath> tightens the information budget,
        forcing the encoder to use latent dimensions efficiently — and one
        efficient strategy is to make each dimension capture an independent
        factor of variation. The disentanglement isn't a free lunch though: the
        same constraint that produces interpretable dimensions also degrades
        reconstruction quality. The <InlineMath>{"\\beta"}</InlineMath>{" "}
        trade-off is a precise version of the rate-distortion problem.
      </p>

      <p style={prose}>
        Locatello et al. (2019) — <em>Challenging Common Assumptions in the
        Unsupervised Learning of Disentangled Representations</em> — delivered
        a sobering theoretical and empirical result: unsupervised
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

      <BetaVAETradeoff />

      <p style={prose}>
        As standalone generators of high-fidelity images, VAEs lost to GANs and
        then diffusion — samples are characteristically blurry because the
        Gaussian likelihood penalty in the reconstruction term over-smooths
        fine details. But the architectural ideas have been absorbed
        everywhere. <em>Latent Diffusion / Stable Diffusion</em> (Rombach et al.
        2022) trains a VAE-style autoencoder to compress images into a
        low-dimensional latent space where a diffusion model then operates —
        every image generated by Stable Diffusion passes through a VAE encoder
        and decoder. <em>VQ-VAE</em> (van den Oord et al. 2017) replaced the
        Gaussian latent with a discrete codebook and underpins DALL-E, much of
        modern audio generation, and many multimodal systems. <em>Diffusion
        models themselves</em> can be derived as hierarchical VAEs with a
        specific reverse process. The VAE chapter is the foundation; the next
        two chapters (GANs and diffusion) are what eventually surpassed it for
        generation alone — but the latent-variable framework is what they all
        share.
      </p>

      <ELBODecomposition />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
