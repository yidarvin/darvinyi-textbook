import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";

import MinimaxGame from "../../components/widgets/ch19/MinimaxGame";
import TrainingDynamics from "../../components/widgets/ch19/TrainingDynamics";
import ModeCollapse from "../../components/widgets/ch19/ModeCollapse";
import DBEvolution from "../../components/widgets/ch19/DBEvolution";
import ConditionalGeneration from "../../components/widgets/ch19/ConditionalGeneration";
import Pix2pixArchitecture from "../../components/widgets/ch19/Pix2pixArchitecture";
import PairedTranslation from "../../components/widgets/ch19/PairedTranslation";
import CycleConsistency from "../../components/widgets/ch19/CycleConsistency";
import CycleGANArchitecture from "../../components/widgets/ch19/CycleGANArchitecture";
import SPADESynthesis from "../../components/widgets/ch19/SPADESynthesis";

import NonSaturatingLoss from "../../components/diagrams/ch19/NonSaturatingLoss";
import GANLossCurves from "../../components/diagrams/ch19/GANLossCurves";
import JSvsWasserstein from "../../components/diagrams/ch19/JSvsWasserstein";
import GANArchitectureLineage from "../../components/diagrams/ch19/GANArchitectureLineage";
import ConditioningSpectrum from "../../components/diagrams/ch19/ConditioningSpectrum";
import PatchGANDiscriminator from "../../components/diagrams/ch19/PatchGANDiscriminator";
import CycleConstraintGeometry from "../../components/diagrams/ch19/CycleConstraintGeometry";
import SPADEBlock from "../../components/diagrams/ch19/SPADEBlock";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Generative Adversarial Networks", authors: "Goodfellow, Pouget-Abadie, Mirza, Xu, Warde-Farley, Ozair, Courville, Bengio", venue: "NeurIPS", year: "2014", tag: "seminal" },
  { num: 2, title: "Wasserstein GAN", authors: "Arjovsky, Chintala, Bottou", venue: "ICML", year: "2017", tag: "seminal" },
  { num: 3, title: "Improved Training of Wasserstein GANs (WGAN-GP)", authors: "Gulrajani, Ahmed, Arjovsky, Dumoulin, Courville", venue: "NeurIPS", year: "2017", tag: "paper" },
  { num: 4, title: "Progressive Growing of GANs for Improved Quality, Stability, and Variation", authors: "Karras, Laine, Aila", venue: "ICLR", year: "2018", tag: "paper" },
  { num: 5, title: "A Style-Based Generator Architecture for Generative Adversarial Networks (StyleGAN)", authors: "Karras, Laine, Aila", venue: "CVPR", year: "2019", tag: "paper" },
  { num: 6, title: "Towards Principled Methods for Training Generative Adversarial Networks", authors: "Arjovsky & Bottou", venue: "ICLR", year: "2017", tag: "paper" },
  { num: 7, title: "GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium", authors: "Heusel, Ramsauer, Unterthiner, Nessler, Hochreiter", venue: "NeurIPS", year: "2017", tag: "paper" },
  { num: 8, title: "Spectral Normalization for Generative Adversarial Networks", authors: "Miyato, Kataoka, Koyama, Yoshida", venue: "ICLR", year: "2018", tag: "paper" },
  { num: 9, title: "Which Training Methods for GANs do actually Converge?", authors: "Mescheder, Geiger, Nowozin", venue: "ICML", year: "2018", tag: "paper" },
  { num: 10, title: "Conditional Generative Adversarial Nets", authors: "Mirza, Osindero", venue: "arXiv", year: "2014", tag: "paper" },
  { num: 11, title: "Image-to-Image Translation with Conditional Adversarial Networks (pix2pix)", authors: "Isola, Zhu, Zhou, Efros", venue: "CVPR", year: "2017", tag: "seminal" },
  { num: 12, title: "Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks (CycleGAN)", authors: "Zhu, Park, Isola, Efros", venue: "ICCV", year: "2017", tag: "seminal" },
  { num: 13, title: "Semantic Image Synthesis with Spatially-Adaptive Normalization (SPADE / GauGAN)", authors: "Park, Liu, Wang, Zhu", venue: "CVPR", year: "2019", tag: "paper" },
  { num: 14, title: "Contrastive Learning for Unpaired Image-to-Image Translation (CUT)", authors: "Park, Efros, Zhang, Zhu", venue: "ECCV", year: "2020", tag: "paper" },
  { num: 15, title: "CycleGAN, a Master of Steganography", authors: "Chu, Zhmoginov, Sandler", venue: "NeurIPS Workshop", year: "2017", tag: "paper" },
  { num: 16, title: "The Unreasonable Effectiveness of Deep Features as a Perceptual Metric (LPIPS)", authors: "Zhang, Isola, Efros, Shechtman, Wang", venue: "CVPR", year: "2018", tag: "paper" },
  { num: 17, title: "Unsupervised Representation Learning with Deep Convolutional Generative Adversarial Networks (DCGAN)", authors: "Radford, Metz, Chintala", venue: "ICLR", year: "2016", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-minimax-game",            label: "The Minimax Game" },
  { id: "training-dynamics",           label: "Training Dynamics" },
  { id: "mode-collapse",               label: "Mode Collapse & WGAN" },
  { id: "decision-boundary-evolution", label: "Architecture Lineage & Boundary" },
  { id: "latent-space-editing",        label: "Latent Space & GAN Inversion" },
  { id: "conditional-generation",      label: "Conditional Generation" },
  { id: "pix2pix",                     label: "pix2pix: Paired Translation" },
  { id: "cyclegan",                    label: "CycleGAN: Unpaired Translation" },
  { id: "spade",                       label: "SPADE (Brief)" },
];

export default function GANs() {
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
        Chapter 19 · Part V — Generative Models
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
        Generative Adversarial Networks &amp; Image-to-Image Translation
      </h1>

      <ChapterLede>
        Two networks play a single minimax game — a generator manufacturing
        data to fool a discriminator — and their competition drives both
        toward a theoretical equilibrium where the generator's output becomes
        indistinguishable from real data, though reaching that equilibrium in
        practice is notoriously unstable. Feed the generator more than noise —
        a class label, a sketch, a full photograph — and the same adversarial
        machinery turns from an unconstrained sampler into a general-purpose
        mapping tool: this is the idea that pix2pix and CycleGAN, the two
        architectures that made image-to-image translation practical, are
        built on. This chapter develops the theory first — the game, its
        instability, and the fixes for both — then follows conditioning all
        the way to those two architectures and one more, SPADE.
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
        <InlineMath>{"\\log D(G(z))"}</InlineMath>. At the game's{" "}
        <em>Nash equilibrium</em> — the standoff where neither player can
        improve its outcome by unilaterally changing strategy —{" "}
        <InlineMath>G</InlineMath> produces the true data distribution and{" "}
        <InlineMath>D</InlineMath> outputs <InlineMath>0.5</InlineMath>{" "}
        everywhere — unable to do better than chance.
      </p>

      <MathBlock>{"$$\\min_G \\max_D\\ \\mathbb{E}_{x \\sim p_{\\text{data}}}[\\log D(x)] + \\mathbb{E}_{z \\sim p_z}[\\log(1 - D(G(z)))]$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>x</InlineMath> is a real example drawn from the data
        distribution <InlineMath>{"p_{\\text{data}}"}</InlineMath>, and{" "}
        <InlineMath>z</InlineMath> is a latent noise vector drawn from a
        simple prior <InlineMath>{"p_z"}</InlineMath> (typically a standard
        Gaussian) that seeds the generator. <InlineMath>D</InlineMath> sees
        both; <InlineMath>G</InlineMath> only ever sees <InlineMath>z</InlineMath>.
      </p>

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
        precisely when it needs the most. Goodfellow et al.
        (2014)<sup>[1]</sup> proposed the <em>non-saturating</em>{" "}
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

      <p style={prose}>
        That equilibrium claim is not just intuition — it has a closed-form
        proof. For any <em>fixed</em> generator <InlineMath>G</InlineMath>,
        the discriminator that maximizes the minimax value has an exact
        expression in terms of the two densities it is trying to separate:
      </p>

      <MathBlock>{"$$D^*(x) = \\frac{p_{\\text{data}}(x)}{p_{\\text{data}}(x) + p_g(x)}$$"}</MathBlock>

      <p style={prose}>
        Substituting <InlineMath>{"D^*"}</InlineMath> back into the minimax
        value <InlineMath>{"V(D,G)"}</InlineMath> and simplifying turns the
        whole objective into a statement about a single divergence between the
        data and generator distributions:
      </p>

      <MathBlock>{"$$C(G) = \\max_D V(D,G) = -\\log 4 + 2\\cdot \\text{JSD}(p_{\\text{data}} \\,\\|\\, p_g)$$"}</MathBlock>

      <p style={prose}>
        Jensen-Shannon divergence is always <InlineMath>{"\\geq 0"}</InlineMath>,
        with equality only when the two distributions are identical. So{" "}
        <InlineMath>{"C(G)"}</InlineMath> is minimized — at its floor of{" "}
        <InlineMath>{"-\\log 4"}</InlineMath> — exactly when{" "}
        <InlineMath>{"p_g = p_{\\text{data}}"}</InlineMath>. This is the actual
        derivation behind the claim, used loosely throughout this chapter, that
        "GAN training minimizes JS divergence": it's not a metaphor, it falls
        directly out of assuming the discriminator reaches its optimum{" "}
        <InlineMath>{"D^*"}</InlineMath> at every step. In practice{" "}
        <InlineMath>D</InlineMath> never actually reaches{" "}
        <InlineMath>{"D^*"}</InlineMath> — it's a neural network updated by a
        few gradient steps, not a closed-form optimum — which is part of why
        real training looks messier than this clean picture.
      </p>

      <p style={prose}>
        Step through training below and watch the two filled curves —{" "}
        <InlineMath>{"p_{\\text{data}}"}</InlineMath> in teal,{" "}
        <InlineMath>{"p_g"}</InlineMath> in orange. Notice that as the
        generator's curve slides over to overlap the data curve, the dashed{" "}
        <InlineMath>D(x)</InlineMath> curve doesn't sharpen to compensate — it
        flattens toward the horizontal <InlineMath>0.5</InlineMath> line,
        exactly as the optimal-discriminator formula above predicts once{" "}
        <InlineMath>{"p_g = p_{\\text{data}}"}</InlineMath>.
      </p>

      <MinimaxGame
        tryThis={{
          do: "Step through training to the end, then toggle the D(x) curve on and off.",
          notice: "By the final step D(x) is nearly flat at 0.5 across the whole region where the two curves overlap — D has stopped being able to tell real from fake, matching the Nash-equilibrium prediction above.",
        }}
      />

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
        Diagnosing these failures requires watching both loss curves simultaneously —
        though, as the panel below shows, mode collapse specifically does <em>not</em>{" "}
        show up in the loss curves at all, which is exactly what makes it dangerous.
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
        <em>Two-timescale updates</em> (TTUR, Heusel et al. 2017)<sup>[7]</sup> use
        different learning rates for the discriminator and generator.{" "}
        <em>Spectral normalization</em> (Miyato et al. 2018)<sup>[8]</sup> constrains the
        Lipschitz norm of the discriminator by dividing each weight matrix by
        its largest singular value — cleaner than weight clipping and more
        stable than gradient penalties. <em>Label smoothing</em> replaces the
        discriminator's hard targets of <InlineMath>0</InlineMath> and{" "}
        <InlineMath>1</InlineMath> with softened values like{" "}
        <InlineMath>0.1</InlineMath> and <InlineMath>0.9</InlineMath>,
        preventing it from becoming overconfident.{" "}
        <em>R1 / R2 regularization</em> (Mescheder et al. 2018)<sup>[9]</sup>
        penalizes the discriminator's gradient norm only at real or only at
        fake samples. Different combinations of these stabilizers are what
        made StyleGAN training reliable.
      </p>

      <GANLossCurves />

      <p style={prose}>
        Switch between the three scenarios below and step through training.
        Notice that in the "Discriminator Dominance" tab, the generator's loss
        rises rather than falls once the discriminator's loss bottoms out near
        zero — the opposite of what a healthy run looks like, and a direct
        symptom of the vanishing-gradient problem described above.
      </p>

      <TrainingDynamics
        tryThis={{
          do: "Open the Discriminator Dominance tab and step through to the end, watching both loss curves together.",
          notice: "D_loss collapses toward 0 while G_loss climbs rather than falls — G is getting weaker gradient signal exactly as D becomes more confident, not the mirror-image trade-off healthy training shows.",
        }}
      />

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
        Arjovsky et al.'s <em>Wasserstein GAN</em>
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

      <p style={prose}>
        A function <InlineMath>f</InlineMath> is <InlineMath>K</InlineMath>-Lipschitz
        if it cannot change faster than a fixed rate: for all inputs{" "}
        <InlineMath>{"x_1, x_2"}</InlineMath>,{" "}
        <InlineMath>{"|f(x_1) - f(x_2)| \\leq K\\,|x_1 - x_2|"}</InlineMath>. The
        Kantorovich-Rubinstein duality underlying WGAN requires the critic to
        be <InlineMath>1</InlineMath>-Lipschitz — its output can change by at
        most as much as its input does. Weight clipping, spectral
        normalization, and the gradient penalty below are three different ways
        of approximately enforcing that one constraint.
      </p>

      <MathBlock>{"$$\\mathcal{L}_{\\text{WGAN}} = \\mathbb{E}_{x \\sim p_{\\text{data}}}[D(x)] - \\mathbb{E}_{z \\sim p_z}[D(G(z))] \\quad \\text{subject to } \\|D\\|_L \\leq 1$$"}</MathBlock>

      <p style={prose}>
        Gulrajani et al. (2017)
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

      <p style={prose}>
        A third loss family, less theoretically motivated than minimax or
        Wasserstein but empirically effective at scale, is the{" "}
        <em>hinge loss</em>. The discriminator is trained as a margin
        classifier and the generator simply maximizes the critic's score on
        its own outputs:
      </p>

      <MathBlock>{"$$\\mathcal{L}_D = \\mathbb{E}_{x}\\big[\\max(0,\\,1 - D(x))\\big] + \\mathbb{E}_z\\big[\\max(0,\\,1 + D(G(z)))\\big], \\qquad \\mathcal{L}_G = -\\mathbb{E}_z[D(G(z))]$$"}</MathBlock>

      <p style={prose}>
        Hinge loss is the discriminator loss used in BigGAN and StyleGAN2, and
        it plays well with spectral normalization — the combination is one of
        the most common recipes in large-scale GAN training since roughly
        2018.
      </p>

      <JSvsWasserstein />

      <p style={prose}>
        Switch between the three tabs below. Notice that the "Mode Collapse"
        tab's generated points pile onto a single tight cluster while the FID
        stat roughly sextuples versus the healthy run (~12 to ~84) — a case
        where the failure is visible in the point cloud well before it would
        show up as an obviously broken loss curve.
      </p>

      <ModeCollapse
        tryThis={{
          do: "Cycle through Healthy GAN, Mode Collapse, and WGAN-GP.",
          notice: "Mode Collapse's points cluster onto roughly one of the three real modes and its FID (~84) is far worse than either Healthy (~12) or WGAN-GP (~18) — WGAN-GP doesn't fully match the healthy run, but it recovers most of the lost mode coverage.",
        }}
      />

      <p style={prose}>
        The "FID (approx)" stat in the panel above is the standard way GAN
        sample quality gets measured. <em>Fréchet Inception Distance</em>{" "}
        (Heusel et al. 2017<sup>[7]</sup>, the same paper that introduced TTUR)
        passes both real and generated images through a pretrained Inception
        network, fits a Gaussian to the resulting feature activations for each
        set, and measures the distance between those two Gaussians:
      </p>

      <MathBlock>{"$$\\text{FID} = \\|\\mu_{\\text{real}} - \\mu_g\\|_2^2 + \\text{Tr}\\!\\left(\\Sigma_{\\text{real}} + \\Sigma_g - 2(\\Sigma_{\\text{real}}\\Sigma_g)^{1/2}\\right)$$"}</MathBlock>

      <p style={prose}>
        Lower is better; FID rewards both fidelity (matching means — do
        individual samples look real?) and diversity (matching covariances —
        does the generator cover the full spread of the data, or has it mode
        collapsed onto a narrow region of feature space?). It's imperfect —
        it depends on the specific Inception checkpoint and is sensitive to
        sample count — but it remains the field's default single-number
        summary for "how good are these generated images," and it is what
        essentially every GAN paper after 2017 reports.
      </p>

      {/* ── Section 4: Architecture Lineage & the Decision Boundary ─────────── */}
      <div id="decision-boundary-evolution">
        <SectionTitle>Architecture Lineage &amp; the Decision Boundary</SectionTitle>
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
        <em>DCGAN</em> (Radford et al. 2016)<sup>[17]</sup> was the first stable
        architectural recipe — strided convolutions instead of pooling, batch
        normalization in generator and discriminator, no fully-connected
        hidden layers, ReLU / LeakyReLU activations. Almost every GAN since
        uses some descendant. <em>ProGAN</em> (Karras et al. 2018)
        <sup>[4]</sup> introduced <em>progressive growing</em>: start training
        at low resolution (<InlineMath>{"4 \\times 4"}</InlineMath>), add
        layers to both networks as training stabilizes, ending at{" "}
        <InlineMath>{"1024 \\times 1024"}</InlineMath>. This dramatically
        improved both stability and final quality. <em>StyleGAN</em> (Karras
        et al. 2019)<sup>[5]</sup> reorganized the generator
        entirely around a separately-learned style space and adaptive instance
        normalization at each layer, with noise injection providing
        stochastic detail. The "this person does not exist" website and the
        explosion of GAN-generated faces in 2019–2021 came from StyleGAN.
        StyleGAN2 (2020) fixed visual artifacts; StyleGAN3 (2021) achieved
        better equivariance under rotation and translation.
      </p>

      <GANArchitectureLineage />

      <p style={prose}>
        Step through the 20 epochs below and watch the discriminator's
        accuracy stat alongside the fake points. Notice that accuracy trends
        down, from roughly 92% at epoch 0 toward roughly 51% by epoch 20, as
        the fake cluster centers drift onto the real ones — the boundary
        isn't getting better at its job, it's running out of real differences
        to exploit.
      </p>

      <DBEvolution
        tryThis={{
          do: "Step to epoch 20 and hover a fake point sitting inside the larger, denser real cluster (the one with more points).",
          notice: "D(x) there is still confidently high — close to 1 — because the discriminator judges location, not origin, and G has learned to land its fakes exactly where that real cluster already is. (Near the smaller cluster the overlap is less exact, so D stays closer to 0.5 — the collapse toward chance is uneven across modes, not uniform.) That's what a falling accuracy stat actually means: not indecision, but confident misclassification.",
        }}
      />

      {/* ── Section 5: Latent Space Editing & GAN Inversion ─────────────────── */}
      <div id="latent-space-editing">
        <SectionTitle>Latent Space &amp; GAN Inversion</SectionTitle>
      </div>

      <p style={prose}>
        StyleGAN's biggest practical legacy may not be its sample quality but
        its <em>latent space</em>. Feeding <InlineMath>z</InlineMath> through
        the mapping network before it reaches the synthesis network produces a
        second space, <InlineMath>{"\\mathcal{W}"}</InlineMath>, that is
        empirically much more <em>disentangled</em> than{" "}
        <InlineMath>{"\\mathcal{Z}"}</InlineMath>: directions in{" "}
        <InlineMath>{"\\mathcal{W}"}</InlineMath> correspond more cleanly to
        single semantic factors — age, pose, smile, hair — because the
        mapping network can warp the simple Gaussian prior into whatever shape
        makes the data manifold locally linear. Feeding a{" "}
        <em>different</em> style vector to each of StyleGAN's layers instead
        of one shared vector defines an even more expressive space,{" "}
        <InlineMath>{"\\mathcal{W}+"}</InlineMath>, which trades some
        disentanglement for far better reconstruction of specific real images.
      </p>

      <p style={prose}>
        That reconstruction problem — given a real photograph, find the latent
        code that generates it — is called <em>GAN inversion</em>. It has no
        closed form; a generator is not invertible in general. Practical
        approaches either optimize a latent code directly to minimize
        reconstruction error (slow, one image at a time, but accurate) or
        train a separate encoder network to predict a latent code in one
        forward pass (fast, but less precise, and the two are often combined —
        encoder for a good initialization, then a short optimization refinement).
        Once a real image has a latent code, arithmetic in that latent space —
        walking along a learned "smile" or "age" direction (as in InterFaceGAN
        and GANSpace) — edits the semantic attribute while leaving the rest of
        the image largely intact. This is the mechanism behind most
        commercial face-editing tools built on StyleGAN, and it predates and
        parallels the text-driven latent editing that diffusion models do with
        cross-attention (Chapter 20).
      </p>

      {/* ── Section 6: Conditional Generation ────────────────────────────────── */}
      <div id="conditional-generation">
        <SectionTitle>Conditional Generation</SectionTitle>
      </div>

      <p style={prose}>
        Everything so far generates from noise alone: sample{" "}
        <InlineMath>{"z \\sim p_z"}</InlineMath>, get an arbitrary sample from{" "}
        <InlineMath>{"p_{\\text{data}}"}</InlineMath>, with no control over
        which one. Mirza &amp; Osindero (2014)<sup>[10]</sup> showed that
        feeding an additional signal <InlineMath>y</InlineMath> — a class
        label, a sketch, a full image — into <em>both</em> the generator and
        the discriminator turns unconditional sampling into a mapping problem:
        the generator learns <InlineMath>{"p(x \\mid y)"}</InlineMath> instead
        of <InlineMath>{"p(x)"}</InlineMath>, and the discriminator has to
        judge not just "is this real" but "is this a real match for{" "}
        <InlineMath>y</InlineMath>."
      </p>

      <MathBlock>{"$$\\mathcal{L}_{\\text{cGAN}}(G,D) = \\mathbb{E}_{x,y}[\\log D(x,y)] + \\mathbb{E}_{y,z}[\\log(1 - D(G(z,y),y))]$$"}</MathBlock>

      <p style={prose}>
        The amount of information carried by the condition is a spectrum. A
        one-hot class label is a handful of bits — enough to pick a
        <em> category</em> but not to pin down a specific instance. A full
        input image, as in the image-to-image setting below, carries millions
        of bits — enough to determine almost the entire output, with the GAN
        contributing texture and plausibility rather than content. Everything
        from class-conditional ImageNet GANs to text-to-image diffusion to
        ControlNet inherits this same conditioning framework; what changes
        across that whole lineage is how rich the condition is and how it gets
        injected into the network, not the basic idea.
      </p>

      <ConditioningSpectrum />

      <p style={prose}>
        Toggle the discriminator's conditional input on and off below and
        compare the two columns of stats. Notice that switching from
        unconditional to conditional doesn't just add an input — it flips the
        generator's job from open-ended sampling ("diversity: high, relation:
        none") to a constrained mapping ("relation: structural"), which is
        exactly the shift pix2pix and CycleGAN exploit next.
      </p>

      <ConditionalGeneration
        tryThis={{
          do: "Switch between the three presets (Sketch → Shoe, Map → Aerial, Edges → Photo) with the conditional input toggled on.",
          notice: "The generator's output changes completely between presets even though nothing about the noise z changed — the condition x, not z, is doing almost all the work of determining content.",
        }}
      />

      {/* ── Section 7: pix2pix ───────────────────────────────────────────────── */}
      <div id="pix2pix">
        <SectionTitle>pix2pix: Paired Translation</SectionTitle>
      </div>

      <p style={prose}>
        Isola et al. (2017)<sup>[11]</sup> took the conditional
        GAN framework and specialized it for a specific, extremely useful
        condition: another image, aligned pixel-for-pixel with the target.
        Sketch → photo, map → satellite image, day → night, labels → facade —
        any task where paired{" "}
        <InlineMath>{"(x, y)"}</InlineMath> training examples exist. The
        generator is a <em>U-Net</em>: an encoder-decoder with skip
        connections between mirrored layers, so low-level spatial detail
        (edges, exact pixel positions) can bypass the bottleneck entirely
        instead of being forced through a compressed representation and
        reconstructed from scratch.
      </p>

      <p style={prose}>
        The discriminator is a <em>PatchGAN</em>: instead of a single real/fake
        judgment for the whole image, it slides a small classifier across the
        output and scores every local window independently, then averages the
        results into the final loss. For the paper's standard configuration —
        a discriminator with a <InlineMath>{"70 \\times 70"}</InlineMath>{" "}
        pixel receptive field, applied to a{" "}
        <InlineMath>{"256 \\times 256"}</InlineMath> image via strided
        convolutions — that produces a{" "}
        <InlineMath>{"30 \\times 30"}</InlineMath> grid of output positions,{" "}
        <em>not</em> <InlineMath>{"30 \\times 30"}</InlineMath> disjoint
        crops: neighboring output positions' receptive fields overlap
        heavily, since the classifier slides across the image with a stride
        much smaller than its receptive-field size. Restricting the
        discriminator's field of view like this pushes it to focus on
        high-frequency texture and local structure, while a pixel-wise{" "}
        <InlineMath>{"L_1"}</InlineMath> loss handles low-frequency color and
        layout — the two losses are complementary by design.
      </p>

      <MathBlock>{"$$G^* = \\arg\\min_G \\max_D\\ \\mathcal{L}_{\\text{cGAN}}(G,D) + \\lambda\\, \\mathcal{L}_{L1}(G), \\qquad \\mathcal{L}_{L1}(G) = \\mathbb{E}_{x,y,z}\\big[\\|y - G(x,z)\\|_1\\big]$$"}</MathBlock>

      <p style={prose}>
        Switch the generator below between a plain encoder-decoder and a
        U-Net. Notice the skip connections aren't a minor detail — without
        them the bottleneck has to carry every pixel's exact position through
        a heavily downsampled representation, and fine boundaries visibly
        soften.
      </p>

      <Pix2pixArchitecture
        tryThis={{
          do: "Toggle Plain ED vs U-Net, then cycle the discriminator's patch size from 1×1 up to 256×256 (global).",
          notice: "1×1 keeps only per-pixel color statistics and produces visible artifacts; 256×256 sees the whole image at once and tends to blur; 70×70 — the paper's default — is the sweet spot that stays sharp without losing coherence.",
        }}
      />

      <p style={prose}>
        The diagram below makes that 70×70 patch geometry concrete: watch how
        the three dashed receptive-field squares overlap rather than tile.
      </p>

      <PatchGANDiscriminator />

      <p style={prose}>
        Drag the slider across each task pair below. Notice how much of the
        output pix2pix gets right purely from the paired-image condition —
        color, shading, and texture — versus where it visibly guesses (shadow
        direction, fine material detail) when the input alone underdetermines
        the answer.
      </p>

      <PairedTranslation
        tryThis={{
          do: "Cycle through all five task tabs and drag each comparison slider fully across.",
          notice: "The same U-Net + PatchGAN recipe handles sketches, maps, facades, and relighting without any task-specific architecture change — only the paired training set differs from one tab to the next.",
        }}
      />

      <p style={prose}>
        Later work in the pix2pix family often supplements or replaces the raw{" "}
        <InlineMath>{"L_1"}</InlineMath> term with a <em>perceptual loss</em>:
        pass both the generated and target image through a network pretrained
        on a different task (typically a VGG classifier) and penalize the
        distance between their intermediate feature activations rather than
        raw pixels. Because those features encode texture and structure at
        multiple scales, perceptual loss tends to produce sharper, more
        natural-looking results than pixel-wise <InlineMath>{"L_1"}</InlineMath>{" "}
        alone, which tends to average over plausible outputs and blur.{" "}
        <em>Feature matching</em> — penalizing the difference between the
        discriminator's own intermediate activations on real versus generated
        pairs, rather than only its final real/fake score — is a related trick
        used to stabilize training in higher-resolution pix2pix-family models
        such as pix2pixHD.
      </p>

      <p style={prose}>
        Evaluating translation quality reuses machinery from earlier in this
        chapter: FID compares the distribution of generated outputs to real
        target images. When a ground-truth output is available for a given
        input (as it is for paired data), <em>LPIPS</em> (Zhang et al. 2018)
        <sup>[16]</sup> — the same deep-feature-distance idea as perceptual
        loss, but used as a metric rather than a training signal — measures
        per-image similarity to that ground truth, and correlates with human
        judgments of similarity far better than pixel-wise metrics like PSNR
        or SSIM.
      </p>

      {/* ── Section 8: CycleGAN ──────────────────────────────────────────────── */}
      <div id="cyclegan">
        <SectionTitle>CycleGAN: Unpaired Translation</SectionTitle>
      </div>

      <p style={prose}>
        pix2pix needs <em>paired</em> data — an exact photo for every sketch,
        an exact satellite tile for every map tile. For most interesting
        translation tasks — horses into zebras, photos into a specific
        painter's style, summer into winter — no such pairing exists or could
        ever be collected. Zhu et al. (2017)<sup>[12]</sup>{" "}
        solved this with <em>cycle consistency</em>: train two generators,{" "}
        <InlineMath>{"G: X \\to Y"}</InlineMath> and{" "}
        <InlineMath>{"F: Y \\to X"}</InlineMath>, and require that translating
        an image and then translating it back reproduces the original,{" "}
        <InlineMath>{"F(G(x)) \\approx x"}</InlineMath> and{" "}
        <InlineMath>{"G(F(y)) \\approx y"}</InlineMath>.
      </p>

      <p style={prose}>
        Without that constraint, an adversarial loss alone is satisfied by any{" "}
        <InlineMath>G</InlineMath> that produces realistic-looking{" "}
        <InlineMath>Y</InlineMath> images regardless of what{" "}
        <InlineMath>x</InlineMath> it started from — including the degenerate
        mapping that sends every horse to the same convincing zebra. Cycle
        consistency rules that out: a many-to-one mapping cannot be inverted,
        so it cannot satisfy <InlineMath>{"F(G(x)) \\approx x"}</InlineMath>{" "}
        for every <InlineMath>x</InlineMath>. Among all the mappings that fool
        the discriminator, cycle consistency picks out the ones that preserve
        enough information about the input to be invertible — which in
        practice means preserving content and structure while changing only
        style or domain-specific appearance.
      </p>

      <CycleConstraintGeometry />

      <p style={prose}>
        Step through the forward cycle below, then press "Break cycle" and
        step through again. Notice the cycle loss jumps by more than an order
        of magnitude when the round trip stops reconstructing the original
        image — that gap is the entire signal ruling out degenerate mappings.
      </p>

      <CycleConsistency
        tryThis={{
          do: "Run the full X → Y → X cycle once normally, then toggle Break cycle and run it again.",
          notice: "The reconstructed image visibly diverges from the original once the cycle is broken, and the displayed cycle-consistency loss jumps from roughly 0.1 to over 2 — a concrete stand-in for what 'not invertible' costs in the loss.",
        }}
      />

      <MathBlock>{"$$\\mathcal{L}(G,F,D_X,D_Y) = \\mathcal{L}_{\\text{GAN}}(G,D_Y,X,Y) + \\mathcal{L}_{\\text{GAN}}(F,D_X,Y,X) + \\lambda\\, \\mathcal{L}_{\\text{cyc}}(G,F)$$"}</MathBlock>

      <p style={prose}>
        The diagram below lays out all four networks and four loss terms at
        once. Trace one full pass — adversarial loss on each domain plus the
        cycle loss tying them together — before moving on to where this setup
        costs more than pix2pix's simpler two-network recipe.
      </p>

      <CycleGANArchitecture
        tryThis={{
          do: "Click through the mode toggles (forward cycle, reverse cycle, each adversarial loss) one at a time.",
          notice: "Four separate loss terms have to be balanced simultaneously — twice the networks of pix2pix, even though the total parameter count is smaller.",
        }}
      />

      <p style={prose}>
        Cycle consistency is elegant but not free of pathology.{" "}
        <InlineMath>{"F(G(x)) \\approx x"}</InlineMath> only asks that{" "}
        <InlineMath>x</InlineMath> be <em>recoverable</em> from{" "}
        <InlineMath>{"G(x)"}</InlineMath> — it does not require that{" "}
        <InlineMath>{"G(x)"}</InlineMath> be a <em>genuine</em> semantic
        translation. Chu et al. (2017)<sup>[15]</sup> showed
        that CycleGAN can satisfy the cycle loss by hiding a low-amplitude,
        near-imperceptible high-frequency signal in the translated image —
        effectively steganographically encoding information{" "}
        <InlineMath>F</InlineMath> needs to reconstruct{" "}
        <InlineMath>x</InlineMath>, rather than actually inferring it from the
        translated content. The cycle loss goes down either way, which means a
        low cycle-consistency loss is not on its own proof of a semantically
        faithful mapping.
      </p>

      <p style={prose}>
        Park et al. (2020)<sup>[14]</sup> proposed{" "}
        <em>CUT</em> (Contrastive Unpaired Translation) as an alternative that
        sidesteps cycle consistency's steganography risk and its cost: CUT
        trains only <em>one</em> generator and <em>one</em> discriminator,
        not two of each. In place of the cycle loss, it uses a{" "}
        <em>patchwise contrastive loss</em> (PatchNCE): a patch in the
        generated output should be more similar, in a learned feature space,
        to the corresponding patch in the input than to other, unrelated
        patches from the same input. That directly encourages the output to
        share local content with the input, without needing an inverse
        mapping to prove it — training with roughly half the network and no
        separate reconstruction pass.
      </p>

      {/* ── Section 9: SPADE (brief) ─────────────────────────────────────────── */}
      <div id="spade">
        <SectionTitle>SPADE (Brief)</SectionTitle>
      </div>

      <p style={prose}>
        One more conditioning trick worth a brief mention: normalization
        layers deep in a generator tend to wash out spatial structure —
        BatchNorm's <InlineMath>{"\\gamma, \\beta"}</InlineMath> are ordinarily
        a single learned scalar per channel, identical at every spatial
        location, which fights against a conditioning signal (like a semantic
        segmentation mask) that varies across the image. Park et al.
        (2019)<sup>[13]</sup>'s <em>SPADE</em> — the generator behind
        NVIDIA's GauGAN — fixes this by predicting{" "}
        <InlineMath>{"\\gamma"}</InlineMath> and{" "}
        <InlineMath>{"\\beta"}</InlineMath> as full spatial maps from the mask
        itself, <InlineMath>{"y_{\\text{SPADE}} = \\gamma(M) \\odot y_{\\text{norm}} + \\beta(M)"}</InlineMath>,
        and re-injecting them at every layer so the semantic labels stay
        legible even after repeated normalization.
      </p>

      <SPADEBlock />

      <p style={prose}>
        Paint a segmentation mask below, then switch to Mechanism Mode.
        Notice that <InlineMath>{"\\gamma"}</InlineMath> and{" "}
        <InlineMath>{"\\beta"}</InlineMath> are literally spatial images
        themselves, painted onto the feature map cell by cell to match
        whatever class you brushed there.
      </p>

      <SPADESynthesis
        tryThis={{
          do: "Paint a few regions with different classes in Paint Mode, then flip to Mechanism Mode.",
          notice: "The gamma/beta maps visibly follow the brushed mask's boundaries rather than staying uniform across the image — the fix for BatchNorm's spatial blindness, made concrete.",
        }}
      />

      <p style={prose}>
        SPADE is a specialized technique for one conditioning modality
        (dense semantic masks) rather than a general-purpose successor to
        pix2pix or CycleGAN — the conditional-GAN objective and cycle
        consistency remain the two ideas that carry the rest of this chapter.
        Modern conditional image generation — ControlNet, InstructPix2Pix,
        T2I-Adapter, IP-Adapter — has largely moved onto diffusion backbones
        instead of GANs; that family gets its own treatment in Chapter 20.
      </p>

      <p style={prose}>
        As the default for high-fidelity unconditional image generation, GANs
        were eclipsed by diffusion models (Chapter 20) starting around 2021–2022.
        Diffusion produces cleaner samples, has more stable training, supports
        better text conditioning, and scales more straightforwardly — and most
        large image generators released since 2022 (Stable Diffusion, DALL-E 3,
        Midjourney, Imagen) are diffusion-based. GANs didn't disappear, and the
        line between the two families has blurred rather than stayed sharp:
        GigaGAN (2023) showed a GAN could still match diffusion-model quality
        at scale for text-to-image generation, and methods like Adversarial
        Diffusion Distillation (ADD, used in SDXL-Turbo) and adversarial
        variants of latent-consistency distillation use a GAN discriminator
        loss to compress a slow multi-step diffusion model into a
        one-or-few-step generator — adversarial training as a distillation
        tool for diffusion, not a competitor to it. Beyond that crossover,
        GANs remain the default in three regimes.{" "}
        <em>Real-time generation</em>: a GAN inference is one forward pass
        through the generator; a diffusion sample requires dozens to thousands
        of denoising steps. For video generation, real-time face synthesis, or
        anything with latency constraints, GANs are still competitive.{" "}
        <em>Face synthesis specifically</em>: StyleGAN variants remain state of
        the art for high-resolution faces and are widely deployed in avatars,
        synthetic-media pipelines, and deepfake-detection benchmarks.{" "}
        <em>Image-to-image translation</em>: pix2pix and CycleGAN's paired and
        unpaired translation architectures are still widely used for domain
        transfer (photo → painting, day → night, sketch → image) whenever a
        one-shot forward pass matters more than the extra fidelity diffusion
        can offer. GANs occupy the role VAEs do (Chapter 18): not the dominant
        generative method anymore, but embedded in production pipelines
        wherever their specific tradeoffs win.
      </p>

      <p style={prose}>
        What carries forward from this chapter is less any one architecture
        than three reusable ideas. The <em>adversarial loss</em> itself
        outlives GANs as the dominant generative model — it reappears in
        Chapter 20 as the mechanism behind diffusion distillation, training a
        fast few-step generator to fool a discriminator into accepting its
        output as indistinguishable from a full slow sampling run.{" "}
        <em>Conditioning by concatenation</em> — feeding a sketch, mask, or
        photo alongside the noise, as pix2pix and SPADE do here — is the same
        move classifier-free guidance and ControlNet make inside a diffusion
        U-Net. And the <em>U-Net itself</em>, introduced here as pix2pix's
        generator, returns in the next chapter as the noise-predicting
        backbone underneath essentially every diffusion model in production.
        Chapter 20 picks up the generative thread where GANs left off:
        diffusion models, the architecture that took the position of default
        high-fidelity image generator away from the machinery built in this
        chapter.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
