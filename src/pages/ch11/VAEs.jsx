import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import AutoencoderVsVAE from "../../components/widgets/ch11/AutoencoderVsVAE";
import LatentSpaceExplorer from "../../components/widgets/ch11/LatentSpaceExplorer";
import KLDivergence from "../../components/widgets/ch11/KLDivergence";
import ELBODecomposition from "../../components/widgets/ch11/ELBODecomposition";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
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
        Chapter 11 · Part III — Generative Models
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
        A standard autoencoder trains an encoder E and decoder D such that D(E(x))
        approximates x. The encoder compresses the input into a latent code z; the
        decoder reconstructs from z. Training minimizes reconstruction loss, which
        produces a latent space that is often irregular — clusters for each training
        class with large gaps between them. Sampling a random point in this space
        and decoding it frequently produces incoherent output because the gaps are
        never visited during training and the decoder learns nothing about them.
      </p>

      <AutoencoderVsVAE />

      {/* ── Section 2: The Variational Lower Bound ──────────────────────────── */}
      <div id="the-variational-lower-bound">
        <SectionTitle>The Variational Lower Bound</SectionTitle>
      </div>

      <p style={prose}>
        The VAE objective is the Evidence Lower BOund (ELBO), which decomposes into
        two terms. The reconstruction term encourages the decoder to faithfully
        reconstruct inputs from sampled latent codes. The KL divergence term penalizes
        the learned posterior q(z|x) for deviating from a standard Gaussian prior
        p(z) = N(0, I). This regularization term is what forces the latent space to be
        smooth and continuous — it prevents the encoder from collapsing each input
        to a single point with zero variance, which would reduce the VAE to a
        standard autoencoder.
      </p>

      <MathBlock>{`ELBO = E_q[log p(x|z)] - KL(q(z|x) || p(z))
     = reconstruction term - regularization term`}</MathBlock>

      <KLDivergence />

      {/* ── Section 3: The Reparameterization Trick ─────────────────────────── */}
      <div id="the-reparameterization-trick">
        <SectionTitle>The Reparameterization Trick</SectionTitle>
      </div>

      <p style={prose}>
        The encoder outputs parameters (mu, sigma) of a Gaussian distribution, and we
        sample z ~ N(mu, sigma^2). But sampling is not differentiable — gradients
        cannot flow through a stochastic node. The reparameterization trick resolves
        this by rewriting the sample as z = mu + sigma * epsilon, where epsilon ~ N(0,1)
        is drawn independently of the parameters. Now gradients flow through mu and
        sigma directly, and epsilon carries the randomness. This simple algebraic
        rearrangement makes variational inference compatible with backpropagation.
      </p>

      <MathBlock>{`z = mu + sigma * epsilon,    epsilon ~ N(0, I)
dL/d_mu = dL/dz,    dL/d_sigma = dL/dz * epsilon`}</MathBlock>

      {/* ── Section 4: Latent Space Exploration ─────────────────────────────── */}
      <div id="latent-space-exploration">
        <SectionTitle>Latent Space Exploration</SectionTitle>
      </div>

      <p style={prose}>
        Because the KL term pushes the posterior toward N(0,1), the entire latent
        space is dense — every point has a reasonable reconstruction. Interpolating
        linearly between two latent codes produces a smooth morphing sequence rather
        than the abrupt jumps of a standard autoencoder. This smooth structure is
        what makes VAE latent spaces useful for generation, editing, and
        disentanglement: moving in the latent space corresponds to meaningful
        transformations in the output space.
      </p>

      <LatentSpaceExplorer />

      {/* ── Section 5: beta-VAE & Disentanglement ───────────────────────────── */}
      <div id="beta-vae-disentanglement">
        <SectionTitle>beta-VAE &amp; Disentanglement</SectionTitle>
      </div>

      <p style={prose}>
        Multiplying the KL term by a factor beta &gt; 1 forces the model to use
        the latent dimensions more efficiently under stronger compression. With
        sufficient beta, individual latent dimensions often become interpretable —
        one dimension encodes rotation, another encodes scale, another encodes color.
        This disentanglement is not guaranteed but emerges because the model learns
        the most compact representation that still allows reconstruction.
      </p>

      <MathBlock>{`L_beta = E_q[log p(x|z)] - beta * KL(q(z|x) || p(z))`}</MathBlock>

      <ELBODecomposition />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
