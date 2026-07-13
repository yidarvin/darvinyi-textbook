import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import ConditionalGeneration from "../../components/widgets/ch18/ConditionalGeneration";
import Pix2pixArchitecture from "../../components/widgets/ch18/Pix2pixArchitecture";
import PairedTranslation from "../../components/widgets/ch18/PairedTranslation";
import CycleConsistency from "../../components/widgets/ch18/CycleConsistency";
import CycleGANArchitecture from "../../components/widgets/ch18/CycleGANArchitecture";
import SPADESynthesis from "../../components/widgets/ch18/SPADESynthesis";
import ConditioningSpectrum from "../../components/diagrams/ch18/ConditioningSpectrum";
import PatchGANDiscriminator from "../../components/diagrams/ch18/PatchGANDiscriminator";
import CycleConstraintGeometry from "../../components/diagrams/ch18/CycleConstraintGeometry";
import SPADEBlock from "../../components/diagrams/ch18/SPADEBlock";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Image-to-Image Translation with Conditional Adversarial Networks (pix2pix)", authors: "Isola, Zhu, Zhou, Efros", venue: "CVPR", year: "2017", tag: "seminal" },
  { num: 2, title: "Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks (CycleGAN)", authors: "Zhu, Park, Isola, Efros", venue: "ICCV", year: "2017", tag: "seminal" },
  { num: 3, title: "Semantic Image Synthesis with Spatially-Adaptive Normalization (SPADE / GauGAN)", authors: "Park, Liu, Wang, Zhu", venue: "CVPR", year: "2019", tag: "seminal" },
  { num: 4, title: "Conditional Generative Adversarial Nets", authors: "Mirza, Osindero", venue: "arXiv", year: "2014", tag: "seminal" },
  { num: 5, title: "U-Net: Convolutional Networks for Biomedical Image Segmentation", authors: "Ronneberger, Fischer, Brox", venue: "MICCAI", year: "2015", tag: "seminal" },
  { num: 6, title: "High-Resolution Image Synthesis and Semantic Manipulation with Conditional GANs (pix2pixHD)", authors: "Wang, Liu, Zhu, Tao, Kautz, Catanzaro", venue: "CVPR", year: "2018", tag: "paper" },
  { num: 7, title: "StarGAN: Unified Generative Adversarial Networks for Multi-Domain Image-to-Image Translation", authors: "Choi, Choi, Kim, Ha, Kim, Choo", venue: "CVPR", year: "2018", tag: "paper" },
  { num: 8, title: "DualGAN: Unsupervised Dual Learning for Image-to-Image Translation", authors: "Yi, Zhang, Tan, Gong", venue: "ICCV", year: "2017", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "conditional-generation", label: "Conditional Generation" },
  { id: "pix2pix",                label: "pix2pix" },
  { id: "cycle-consistency",      label: "Cycle Consistency" },
  { id: "semantic-synthesis",     label: "Semantic Synthesis" },
];

export default function ImageToImage() {
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
        Chapter 18 · Part V — Image Generative Models
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
        Image-to-Image Translation
      </h1>

      <ChapterLede>
        A GAN trained on faces generates faces from noise. An image-to-image
        translation model generates one image from another — a photograph from a
        sketch, a satellite view from a map, a Monet from a photograph, a daytime
        scene from a nighttime one. The unconditional generation paradigm becomes
        a conditional one. Two architectures dominate this space: pix2pix for
        paired data and CycleGAN for unpaired. Both prove that the conditional
        distribution p(y|x) over images can be learned from far less supervision
        than anyone expected.
      </ChapterLede>

      {/* ── Section 1: From Unconditional to Conditional Generation ────────── */}
      <div id="conditional-generation">
        <SectionTitle>From Unconditional to Conditional Generation</SectionTitle>
      </div>

      <p style={prose}>
        A vanilla GAN samples <InlineMath>{"z \\sim \\mathcal{N}(0, I)"}</InlineMath>{" "}
        and produces <InlineMath>{"G(z)"}</InlineMath> — an image with no
        external control over what gets generated. Conditional GANs (cGANs) add
        an input condition <InlineMath>x</InlineMath>: the generator becomes{" "}
        <InlineMath>{"G(x, z)"}</InlineMath> and the discriminator becomes{" "}
        <InlineMath>{"D(x, y)"}</InlineMath>, where <InlineMath>y</InlineMath>{" "}
        is a real or fake image paired with <InlineMath>x</InlineMath>. For
        image translation, the condition is itself an image — a sketch, a
        label map, a low-resolution photograph. The output is a translated
        version of that input. The randomness <InlineMath>z</InlineMath> is
        often removed entirely in modern image translation models: the input
        image carries enough information to define the output, and added noise
        tends to be ignored by the generator anyway.
      </p>

      <p style={prose}>
        Mirza &amp; Osindero <strong>[4]</strong> introduced the conditional
        GAN formulation in 2014, only months after Goodfellow's original GAN
        paper. Their setup was simple: concatenate the conditioning variable
        (originally a class label encoded as a one-hot vector) into both the
        generator's input and the discriminator's input. The discriminator now
        scores whether <InlineMath>{"(x, y)"}</InlineMath> pairs are real —
        meaning whether the image <InlineMath>y</InlineMath> is <em>real</em>{" "}
        <em>and</em> consistent with the condition <InlineMath>x</InlineMath>.
        This bookkeeping change opened up the entire territory of controlled
        generation: class-conditional sampling, attribute editing, and
        eventually image-to-image translation. The conditioning signal types
        have expanded enormously since — text embeddings in text-to-image,
        edge maps in ControlNet, depth maps in depth-conditioned generation —
        but the mathematical structure is what Mirza &amp; Osindero defined.
      </p>

      <p style={prose}>
        When the condition <InlineMath>x</InlineMath> is a class label, it
        carries a few bits of information ("this should be a dog"). When{" "}
        <InlineMath>x</InlineMath> is an image — a sketch, a segmentation
        map, a low-resolution photo — it carries millions of pixels worth of
        constraint. The generator's job changes from "produce a sample from
        this class" to "produce <em>this specific output</em> mostly determined
        by this input." The deterministic limit (no noise injected) is often
        the right choice for translation tasks where each input has essentially
        one correct output. For tasks with genuine ambiguity — colorizing
        grayscale photos, for instance, where the colors aren't uniquely
        determined — some randomness can still help, but most modern image
        translation models are functionally deterministic given the input.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{Unconditional GAN:} \\quad &G(z) \\to y, \\quad D(y) \\to \\text{real/fake} \\\\
  \\text{Conditional GAN:} \\quad &G(x, z) \\to y, \\quad D(x, y) \\to \\text{real/fake}
\\end{aligned}$$`}</MathBlock>

      <ConditioningSpectrum />

      <ConditionalGeneration />

      {/* ── Section 2: pix2pix — Paired Translation ─────────────────────────── */}
      <div id="pix2pix">
        <SectionTitle>pix2pix — Paired Translation</SectionTitle>
      </div>

      <p style={prose}>
        pix2pix <strong>[1]</strong> learns a mapping{" "}
        <InlineMath>{"G: X \\to Y"}</InlineMath> from paired training examples.
        Two architectural choices made pix2pix work where earlier conditional
        GANs had struggled. The generator uses a U-Net with skip connections
        from each encoder layer to the corresponding decoder layer — this lets
        low-level detail like edges flow directly from input to output,
        bypassing the information bottleneck of the bottom layer. The
        discriminator is a PatchGAN: instead of classifying the whole image as
        real or fake, it classifies each <InlineMath>{"N \\times N"}</InlineMath>{" "}
        patch independently and averages the result. This produces sharper
        outputs by focusing the adversarial signal on high-frequency texture
        rather than the low-frequency content that the L1 loss already captures.
      </p>

      <p style={prose}>
        Ronneberger, Fischer &amp; Brox introduced the U-Net architecture in
        2015 <strong>[5]</strong> for biomedical image segmentation — a context
        that needed both high-level semantic understanding and pixel-precise
        output localization. The key insight was the <em>skip connection</em>{" "}
        structure: at each downsampling stage, copy the feature map directly
        across to the corresponding upsampling stage. This gives the decoder
        direct access to high-resolution information that would otherwise be
        lost in the bottleneck. Isola, Zhu, Zhou &amp; Efros (2017){" "}
        <strong>[1]</strong> recognized that image translation has the same
        dual demand: the output must respect global structure (it's a photo
        of a building, not a horse) and preserve fine local detail (the windows
        line up with the sketch's lines). pix2pix's U-Net generator was a
        near-direct port of the segmentation architecture into the conditional
        GAN framework, and it remains the dominant generator topology for
        translation tasks years later.
      </p>

      <p style={prose}>
        A pix2pix model trained with only an adversarial loss can fool the
        discriminator while ignoring the input — there's no signal pulling the
        output toward the <em>correct</em> translation. An L1 loss alone
        produces blurry outputs because L1 is minimized by averaging over
        plausible outputs. The pix2pix recipe combines both: L1 captures the
        low-frequency content (overall layout, color tones) where blurring is
        acceptable, while the PatchGAN's adversarial signal captures
        high-frequency texture and edges. The{" "}
        <InlineMath>{"\\lambda \\approx 100"}</InlineMath> weighting on L1 in
        the original paper is large precisely because the L1 term is the
        workhorse. Wang, Liu, Zhu, Tao, Kautz &amp; Catanzaro's <em>pix2pixHD</em>{" "}
        <strong>[6]</strong> (2018) extended this to 2048×1024 high-resolution
        outputs with a multi-scale generator and discriminator, addressing the
        resolution ceiling of the original pix2pix.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\mathcal{L}_{\\text{pix2pix}} &= \\mathcal{L}_{\\text{cGAN}}(G, D) + \\lambda\\, \\mathcal{L}_{L1}(G) \\\\
  \\mathcal{L}_{L1}(G) &= \\mathbb{E}_{x, y}\\bigl[\\, \\|y - G(x)\\|_1 \\,\\bigr]
\\end{aligned}$$`}</MathBlock>

      <PatchGANDiscriminator />

      <Pix2pixArchitecture />

      <PairedTranslation />

      {/* ── Section 3: Cycle Consistency — Translation Without Pairs ─────────── */}
      <div id="cycle-consistency">
        <SectionTitle>Cycle Consistency — Translation Without Pairs</SectionTitle>
      </div>

      <p style={prose}>
        Paired data is expensive. For most interesting translation tasks —
        turning horses into zebras, summer landscapes into winter ones,
        photographs into Monets — paired examples do not exist. CycleGAN{" "}
        <strong>[2]</strong> sidesteps this entirely by training two
        generators <InlineMath>{"G: X \\to Y"}</InlineMath> and{" "}
        <InlineMath>{"F: Y \\to X"}</InlineMath> with a cycle consistency loss:{" "}
        <InlineMath>{"F(G(x)) \\approx x"}</InlineMath> and{" "}
        <InlineMath>{"G(F(y)) \\approx y"}</InlineMath>. This constraint
        prevents the generators from producing arbitrary images that happen to
        fool their discriminator — the output must contain enough information
        to reconstruct the original input. The result is a self-supervised
        translation objective that works without correspondence.
      </p>

      <p style={prose}>
        Without pairs, there are infinitely many functions{" "}
        <InlineMath>{"G: X \\to Y"}</InlineMath> that map every sample from{" "}
        <InlineMath>X</InlineMath> to some image in <InlineMath>Y</InlineMath>{" "}
        that looks real. Zhu, Park, Isola &amp; Efros (2017){" "}
        <strong>[2]</strong> needed an additional constraint to pick out the
        "right" function — the one that preserves enough about the input to
        be invertible. The cycle loss is exactly this: requiring{" "}
        <InlineMath>{"F(G(x)) \\approx x"}</InlineMath> says that whatever{" "}
        <InlineMath>G</InlineMath> does to <InlineMath>x</InlineMath>, it must
        be <em>reversible</em> by another network <InlineMath>F</InlineMath>.
        A degenerate mapping that sends every horse to the same zebra fails
        this constraint immediately, because <InlineMath>F</InlineMath>{" "}
        couldn't recover the original horse from one identical zebra. The
        cycle constraint is a soft form of <em>information preservation</em>:
        the translated output must encode enough about the input that another
        network can reconstruct it. This isn't quite bijectivity in a
        mathematical sense, but it serves a similar purpose in practice.
      </p>

      <p style={prose}>
        CycleGAN was not alone. Yi, Zhang, Tan &amp; Gong's <em>DualGAN</em>{" "}
        <strong>[8]</strong> (also ICCV 2017) and DiscoGAN (Kim et al. ICML
        2017) derived nearly the same cycle-consistent setup independently
        within months — a clear case of an idea whose time had arrived. The
        CycleGAN paper became the standard reference largely because of its
        compelling demonstrations (horse↔zebra, summer↔winter, photo↔Monet)
        and clean writing. <em>StarGAN</em> (Choi, Choi, Kim, Ha, Kim &amp; Choo
        2018) <strong>[7]</strong> extended cycle consistency to{" "}
        <em>multi-domain</em> translation: a single generator handles
        translations between many domains (e.g., five different attributes of
        facial expression), conditioned on the target domain. StarGAN scales
        much better than <InlineMath>{"N(N-1)"}</InlineMath> separate
        CycleGANs for <InlineMath>N</InlineMath> domains. The lineage
        continues — StarGAN-v2, U-GAT-IT, NICE-GAN — but the core idea, that
        cycle consistency makes unpaired translation tractable, comes from
        this 2017 cluster of papers.
      </p>

      <p style={prose}>
        Cycle consistency works best for translations that preserve geometric
        structure — texture transfer, color shift, season change, painter
        style. It struggles with translations that require shape change.
        Turning a photograph of a dog into a photograph of a cat doesn't work
        well: the cat's ears need to be in different places, its face shape
        is different, and the cycle constraint actively penalizes the
        necessary geometric changes. Researchers explored geometric extensions
        (UNIT, MUNIT, the "swapping autoencoder" line of work), but the
        fundamental limit — cycle-consistent translation favors mappings that{" "}
        <em>preserve content while changing style</em> — has stayed.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\mathcal{L}_{\\text{cyc}}(G, F) &= \\mathbb{E}_x\\bigl[\\, \\|F(G(x)) - x\\|_1 \\,\\bigr] + \\mathbb{E}_y\\bigl[\\, \\|G(F(y)) - y\\|_1 \\,\\bigr] \\\\
  \\mathcal{L}_{\\text{total}} &= \\mathcal{L}_{\\text{GAN}}(G, D_Y) + \\mathcal{L}_{\\text{GAN}}(F, D_X) + \\lambda\\, \\mathcal{L}_{\\text{cyc}}(G, F)
\\end{aligned}$$`}</MathBlock>

      <CycleConstraintGeometry />

      <CycleConsistency />

      <CycleGANArchitecture />

      {/* ── Section 4: Semantic Synthesis — SPADE ───────────────────────────── */}
      <div id="semantic-synthesis">
        <SectionTitle>Semantic Synthesis — SPADE</SectionTitle>
      </div>

      <p style={prose}>
        A specialized form of image translation takes a semantic segmentation
        map as input and produces a photorealistic scene as output. Each pixel
        in the input is colored by its class — sky, road, tree, building — and
        the model must produce realistic textures consistent with that semantic
        layout. The SPADE (Spatially-Adaptive Denormalization) module{" "}
        <strong>[3]</strong> replaced the standard batch normalization in the
        generator with a normalization whose affine parameters are predicted
        from the semantic map itself. This preserves the semantic information
        through the network rather than washing it out in the deep layers,
        producing images where every pixel respects the intended class
        assignment.
      </p>

      <p style={prose}>
        Park, Liu, Wang &amp; Zhu (2019) <strong>[3]</strong> diagnosed a
        specific failure mode in earlier semantic-to-photo synthesis methods
        like pix2pixHD: the semantic information present at the input degrades
        as it passes through deep network layers. Batch normalization in
        particular <em>washes out</em> the semantic signal by re-normalizing
        every layer's activations to zero mean and unit variance — by the time
        signal reaches the late decoder layers, the explicit class assignments
        from the input mask are barely detectable. SPADE's fix is precise:
        instead of standard batch normalization, use{" "}
        <em>spatially-adaptive denormalization</em> — the per-channel{" "}
        <InlineMath>{"\\gamma"}</InlineMath> and{" "}
        <InlineMath>{"\\beta"}</InlineMath> affine parameters are{" "}
        <em>predicted</em> from the semantic mask at each layer, via a small
        two-layer convolution. The mask is therefore "re-injected" at every
        normalization point in the generator, preserving semantic information
        all the way through. The famous "GauGAN" demonstration from NVIDIA —
        paint a rough sketch of sky, grass, mountains, and watch the network
        produce a photorealistic landscape in real time — was the public face
        of this technique and remains one of the most-shared GAN
        demonstrations of all time.
      </p>

      <p style={prose}>
        The GAN-based translation methods covered here (pix2pix, CycleGAN,
        SPADE) dominated their domain from roughly 2017 to 2022 and remain
        widely deployed where their specific tradeoffs win — real-time
        inference, small-domain tasks, and as components in larger pipelines.
        But the broader image-to-image problem has been substantially absorbed
        by diffusion-based methods. ControlNet (Zhang, Rao &amp; Agrawala
        2023) attaches lightweight conditioning networks to a pretrained
        diffusion model, enabling conditioning on edge maps, depth,
        segmentation, pose, scribbles, and dozens of other modalities — a
        unified framework that subsumes most of the pix2pix-style task list.
        InstructPix2Pix (Brooks, Holynski &amp; Efros 2023) uses
        text-instruction-conditioned diffusion for image editing. T2I-Adapter
        (Mou et al. 2023) and IP-Adapter (Ye et al. 2023) are
        parameter-efficient adapters that condition diffusion on additional
        images or layouts. For new translation work, the diffusion-based
        approach is generally the default because it produces higher-quality
        outputs, supports better text conditioning, and integrates with the
        broader generative-model ecosystem. The GAN-based methods retain
        advantages in specific niches: real-time inference (a single forward
        pass vs dozens of denoising steps), well-defined narrow domains
        (where training a specialist GAN is faster than fine-tuning a
        diffusion model), and deployment scenarios with tight latency or
        memory budgets. The transition is gradual, not complete — many
        production image-translation pipelines still use a mix of GAN and
        diffusion components.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\gamma(M),\\, \\beta(M) &= \\text{ConvNet}(M) \\\\
  y_{\\text{normed}} &= \\frac{y - \\mu}{\\sigma} \\\\
  y_{\\text{SPADE}} &= \\gamma(M) \\odot y_{\\text{normed}} + \\beta(M)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>M</InlineMath> is the semantic mask;{" "}
        <InlineMath>{"\\mu"}</InlineMath> and{" "}
        <InlineMath>{"\\sigma"}</InlineMath> are channel-wise activation
        statistics, as in standard batch normalization.
      </p>

      <SPADEBlock />

      <SPADESynthesis />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
