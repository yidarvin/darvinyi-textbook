import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import MinimaxGame from "../../components/widgets/ch17/MinimaxGame";
import TrainingDynamics from "../../components/widgets/ch17/TrainingDynamics";
import ModeCollapse from "../../components/widgets/ch17/ModeCollapse";
import DBEvolution from "../../components/widgets/ch17/DBEvolution";
import NonSaturatingLoss from "../../components/diagrams/ch17/NonSaturatingLoss";
import GANLossCurves from "../../components/diagrams/ch17/GANLossCurves";
import JSvsWasserstein from "../../components/diagrams/ch17/JSvsWasserstein";
import GANArchitectureLineage from "../../components/diagrams/ch17/GANArchitectureLineage";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Generative Adversarial Networks", authors: "Goodfellow, Pouget-Abadie, Mirza, Xu, Warde-Farley, Ozair, Courville, Bengio", venue: "NeurIPS", year: "2014", tag: "seminal" },
  { num: "[2]", title: "Wasserstein GAN", authors: "Arjovsky, Chintala, Bottou", venue: "ICML", year: "2017", tag: "seminal" },
  { num: "[3]", title: "Improved Training of Wasserstein GANs (WGAN-GP)", authors: "Gulrajani, Ahmed, Arjovsky, Dumoulin, Courville", venue: "NeurIPS", year: "2017", tag: "paper" },
  { num: "[4]", title: "Progressive Growing of GANs for Improved Quality, Stability, and Variation", authors: "Karras, Laine, Aila", venue: "ICLR", year: "2018", tag: "paper" },
  { num: "[5]", title: "A Style-Based Generator Architecture for Generative Adversarial Networks (StyleGAN)", authors: "Karras, Laine, Aila", venue: "CVPR", year: "2019", tag: "paper" },
  { num: "[6]", title: "Towards Principled Methods for Training Generative Adversarial Networks", authors: "Arjovsky & Bottou", venue: "ICLR", year: "2017", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-minimax-game",            label: "The Minimax Game" },
  { id: "training-dynamics",           label: "Training Dynamics" },
  { id: "mode-collapse",               label: "Mode Collapse" },
  { id: "decision-boundary-evolution", label: "Boundary Evolution" },
];

export default function GANs() {
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
        Chapter 17 · Part V — Image Generative Models
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
        Generative Adversarial Networks
      </h1>

      <ChapterLede>
        Two networks, one adversarial objective: the generator tries to produce
        data that fools the discriminator; the discriminator tries to distinguish
        real data from generated fakes. Their minimax competition drives both
        toward a theoretical equilibrium where the generator perfectly replicates
        the data distribution and the discriminator can do no better than random
        guessing. Reaching that equilibrium in practice is notoriously unstable —
        and the instability is as instructive as the theory.
      </ChapterLede>

      {/* ── Section 1: The Minimax Game ─────────────────────────────────────── */}
      <div id="the-minimax-game">
        <SectionTitle>The Minimax Game</SectionTitle>
      </div>

      <p style={prose}>
        The GAN objective frames generation as a two-player zero-sum game. The
        discriminator <InlineMath>D</InlineMath> maximizes its ability to
        classify real inputs as real and generated inputs as fake. The
        generator <InlineMath>G</InlineMath> simultaneously maximizes{" "}
        <InlineMath>D</InlineMath>'s error on generated data — equivalently, it
        minimizes <InlineMath>{"\\log(1 - D(G(z)))"}</InlineMath>, or in the
        non-saturating variant, maximizes{" "}
        <InlineMath>{"\\log D(G(z))"}</InlineMath>. At Nash equilibrium,{" "}
        <InlineMath>G</InlineMath> produces the true data distribution and{" "}
        <InlineMath>D</InlineMath> outputs <InlineMath>0.5</InlineMath>{" "}
        everywhere — unable to do better than chance.
      </p>

      <MathBlock>{"$$\\min_G \\max_D\\ \\mathbb{E}_{x \\sim p_{\\text{data}}}[\\log D(x)] + \\mathbb{E}_{z \\sim p_z}[\\log(1 - D(G(z)))]$$"}</MathBlock>

      <NonSaturatingLoss />

      <p style={prose}>
        The minimax objective as written has a fatal practical problem. Early
        in training, the generator's outputs are obviously fake — the
        discriminator quickly learns to output{" "}
        <InlineMath>{"D(G(z)) \\approx 0"}</InlineMath>. At that point, the
        gradient of <InlineMath>{"\\log(1 - D(G(z)))"}</InlineMath> with
        respect to the generator's parameters is <em>nearly zero</em> — the
        function flattens out as <InlineMath>D</InlineMath> approaches{" "}
        <InlineMath>0</InlineMath>. The generator gets almost no signal
        precisely when it needs the most. Goodfellow, Pouget-Abadie, Mirza
        et al. (2014)<sup>[1]</sup> proposed the <em>non-saturating</em>{" "}
        variant in the same paper that introduced GANs: instead of minimizing{" "}
        <InlineMath>{"\\log(1 - D(G(z)))"}</InlineMath>, maximize{" "}
        <InlineMath>{"\\log D(G(z))"}</InlineMath>. The two are equivalent at
        the equilibrium but behave very differently away from it. The
        non-saturating loss has steep gradients when the discriminator is
        confident, so the generator can recover from early failures. Almost
        every GAN implementation in the wild uses this fix; the original
        minimax form is essentially a theoretical reference, not a practical
        one.
      </p>

      <p style={prose}>
        At the Nash equilibrium, the generator's distribution exactly matches
        the data distribution, and the optimal discriminator outputs{" "}
        <InlineMath>0.5</InlineMath> everywhere — the two distributions are
        indistinguishable. Reaching this equilibrium in practice is rare; in
        fact, <em>recognizing</em> you've reached it is impossible, because
        both losses fluctuate forever around their equilibrium values rather
        than converging in any clean sense. This makes GAN training
        fundamentally different from supervised learning: there is no monotonic
        training-loss curve to watch and no clean stopping criterion. The two
        next sections cover why.
      </p>

      <MinimaxGame />

      {/* ── Section 2: Training Dynamics & Instability ──────────────────────── */}
      <div id="training-dynamics">
        <SectionTitle>Training Dynamics &amp; Instability</SectionTitle>
      </div>

      <p style={prose}>
        GAN training is a delicate balance. If the discriminator becomes too strong
        too quickly, the gradients it provides to the generator become uninformative —
        the generator receives near-zero signal to improve. If the generator improves
        too fast, the discriminator never learns a useful signal. Common failure modes
        include mode collapse, where the generator produces only a subset of the real
        distribution, and training oscillation, where neither network converges.
        Diagnosing these failures requires watching both loss curves simultaneously.
      </p>

      <p style={prose}>
        Arjovsky &amp; Bottou (2017)<sup>[6]</sup> — <em>Towards Principled
        Methods for Training Generative Adversarial Networks</em> — gave the
        field its sharpest understanding of <em>why</em> GAN training is
        fundamentally fragile. The original GAN objective is equivalent to
        minimizing the Jensen-Shannon divergence between the data distribution
        and the generator's distribution. JS divergence has a critical
        pathology: when the two distributions have <em>disjoint support</em> —
        which is almost always true at the start of training, since the
        generator initially produces noise that lives nowhere near the data
        manifold — JS divergence is <em>constant</em> at{" "}
        <InlineMath>{"\\log 2"}</InlineMath>. A constant divergence has zero
        gradient everywhere. The generator receives no signal about which
        direction would bring its distribution closer to the data; it's
        optimizing a flat landscape. This isn't a hyperparameter problem or an
        implementation bug; it's a structural failure of the JS objective on
        the kinds of high-dimensional, low-dimensional-manifold distributions
        that natural data lives on.
      </p>

      <p style={prose}>
        Several techniques became standard recipes for fighting instability
        without changing the objective entirely.{" "}
        <em>Two-timescale updates</em> (TTUR, Heusel et al. 2017) use
        different learning rates for the discriminator and generator.{" "}
        <em>Spectral normalization</em> (Miyato et al. 2018) constrains the
        Lipschitz norm of the discriminator by dividing each weight matrix by
        its largest singular value — cleaner than weight clipping and more
        stable than gradient penalties. <em>Label smoothing</em> replaces the
        discriminator's hard targets of <InlineMath>0</InlineMath> and{" "}
        <InlineMath>1</InlineMath> with softened values like{" "}
        <InlineMath>0.1</InlineMath> and <InlineMath>0.9</InlineMath>,
        preventing it from becoming overconfident.{" "}
        <em>R1 / R2 regularization</em> (Mescheder, Geiger &amp; Nowozin 2018)
        penalizes the discriminator's gradient norm only at real or only at
        fake samples. Different combinations of these stabilizers are what
        made StyleGAN training reliable.
      </p>

      <GANLossCurves />

      <TrainingDynamics />

      {/* ── Section 3: Mode Collapse & WGAN ─────────────────────────────────── */}
      <div id="mode-collapse">
        <SectionTitle>Mode Collapse &amp; WGAN</SectionTitle>
      </div>

      <p style={prose}>
        Mode collapse occurs when the generator finds a small set of outputs that
        consistently fool the discriminator, and stops exploring the rest of the
        data distribution. The original GAN loss provides weak gradients when
        the discriminator is confident, making recovery from collapse difficult.
        The Wasserstein GAN replaces the Jensen-Shannon divergence with the
        Wasserstein-1 distance, which provides meaningful gradients even when
        the real and generated distributions do not overlap, making training
        more stable and mode collapse less likely.
      </p>

      <p style={prose}>
        Arjovsky, Chintala &amp; Bottou's <em>Wasserstein GAN</em>
        <sup>[2]</sup> replaced JS divergence with the Wasserstein-1 distance
        (also called Earth-Mover's distance). The key property: Wasserstein
        distance has <em>meaningful, non-zero gradients</em> even when the two
        distributions have disjoint support. Intuitively, it measures the
        minimum amount of "mass × distance" needed to transport one
        distribution into the other — even if they don't overlap, the answer
        is finite and depends smoothly on how far apart they are. This single
        change converted the optimization from a flat-everywhere landscape
        into one with usable slopes. The original WGAN paper enforced the
        required Lipschitz constraint on the discriminator (now called the
        "critic") by clipping all weights to a small range — a crude approach
        that worked but had its own problems.
      </p>

      <MathBlock>{"$$\\mathcal{L}_{\\text{WGAN}} = \\mathbb{E}_{x \\sim p_{\\text{data}}}[D(x)] - \\mathbb{E}_{z \\sim p_z}[D(G(z))] \\quad \\text{subject to } \\|D\\|_L \\leq 1$$"}</MathBlock>

      <p style={prose}>
        Gulrajani, Ahmed, Arjovsky, Dumoulin &amp; Courville (2017)
        <sup>[3]</sup> showed that weight clipping pushes the critic's weights
        toward the clipping boundaries, distorting its capacity. They replaced
        it with a <em>gradient penalty</em>: add a term{" "}
        <InlineMath>{"(\\|\\nabla_{\\hat{x}} D(\\hat{x})\\|_2 - 1)^2"}</InlineMath>{" "}
        to the loss, computed at randomly-interpolated points{" "}
        <InlineMath>{"\\hat{x}"}</InlineMath> between real and fake samples.
        This softly enforces the 1-Lipschitz constraint while letting weights
        vary freely. Spectral normalization (Miyato et al. 2018, mentioned in
        Section 2) became the more common alternative in practice — it
        enforces Lipschitz continuity via a simple division by spectral norm
        at each weight matrix, with no extra loss term. Modern GAN training
        almost always uses one of WGAN-GP or spectral normalization; vanilla
        GAN training with the original loss is rare outside teaching contexts.
      </p>

      <JSvsWasserstein />

      <ModeCollapse />

      {/* ── Section 4: Decision Boundary Evolution ──────────────────────────── */}
      <div id="decision-boundary-evolution">
        <SectionTitle>Decision Boundary Evolution</SectionTitle>
      </div>

      <p style={prose}>
        The discriminator's decision boundary evolves as training progresses.
        Early in training it is a simple linear separator that distinguishes
        obvious distributional differences. As the generator improves and produces
        more realistic outputs, the boundary must become increasingly complex to
        maintain discrimination ability. Watching this boundary evolve epoch by
        epoch reveals the cat-and-mouse dynamic at the heart of adversarial training.
      </p>

      <p style={prose}>
        The theoretical advances of Sections 2–3 were paralleled by an
        architectural lineage that drove visible sample quality forward.{" "}
        <em>DCGAN</em> (Radford, Metz &amp; Chintala 2015) was the first stable
        architectural recipe — strided convolutions instead of pooling, batch
        normalization in generator and discriminator, no fully-connected
        hidden layers, ReLU / LeakyReLU activations. Almost every GAN since
        uses some descendant. <em>ProGAN</em> (Karras, Laine &amp; Aila 2018)
        <sup>[4]</sup> introduced <em>progressive growing</em>: start training
        at low resolution (<InlineMath>{"4 \\times 4"}</InlineMath>), add
        layers to both networks as training stabilizes, ending at{" "}
        <InlineMath>{"1024 \\times 1024"}</InlineMath>. This dramatically
        improved both stability and final quality. <em>StyleGAN</em> (Karras,
        Laine &amp; Aila 2019)<sup>[5]</sup> reorganized the generator
        entirely around a separately-learned style space and adaptive instance
        normalization at each layer, with noise injection providing
        stochastic detail. The "this person does not exist" website and the
        explosion of GAN-generated faces in 2019–2021 came from StyleGAN.
        StyleGAN2 (2020) fixed visual artifacts; StyleGAN3 (2021) achieved
        better equivariance under rotation and translation.
      </p>

      <GANArchitectureLineage />

      <p style={prose}>
        As the default for high-fidelity unconditional image generation, GANs
        were eclipsed by diffusion models (Ch 19) starting around 2021–2022.
        Diffusion produces cleaner samples, has more stable training, supports
        better text conditioning, and scales more straightforwardly — and most
        large image generators released since 2022 (Stable Diffusion, DALL-E 3,
        Midjourney, Imagen) are diffusion-based. GANs didn't disappear. They
        remain the default in three regimes.{" "}
        <em>Real-time generation</em>: a GAN inference is one forward pass
        through the generator; a diffusion sample requires dozens to thousands
        of denoising steps. For video generation, real-time face synthesis, or
        anything with latency constraints, GANs are still competitive.{" "}
        <em>Face synthesis specifically</em>: StyleGAN variants remain state of
        the art for high-resolution faces and are widely deployed in avatars,
        synthetic-media pipelines, and deepfake-detection benchmarks.{" "}
        <em>Image-to-image translation</em>: Pix2Pix (Isola et al. 2017) and
        CycleGAN (Zhu et al. 2017) introduced paired and unpaired translation
        architectures that are still widely used for domain transfer (photo →
        painting, day → night, sketch → image) and are the focus of the next
        chapter. GANs occupy the role VAEs do (Ch 16): not the dominant
        generative method anymore, but embedded in production pipelines
        wherever their specific tradeoffs win.
      </p>

      <DBEvolution />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
