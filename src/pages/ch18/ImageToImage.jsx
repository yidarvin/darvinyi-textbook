import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import ConditionalGeneration from "../../components/widgets/ch18/ConditionalGeneration";
import Pix2pixArchitecture from "../../components/widgets/ch18/Pix2pixArchitecture";
import PairedTranslation from "../../components/widgets/ch18/PairedTranslation";
import CycleConsistency from "../../components/widgets/ch18/CycleConsistency";
import CycleGANArchitecture from "../../components/widgets/ch18/CycleGANArchitecture";
import SPADESynthesis from "../../components/widgets/ch18/SPADESynthesis";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Image-to-Image Translation with Conditional Adversarial Networks (pix2pix)", authors: "Isola, Zhu, Zhou, Efros", venue: "CVPR", year: "2017", tag: "seminal" },
  { num: "[2]", title: "Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks (CycleGAN)", authors: "Zhu, Park, Isola, Efros", venue: "ICCV", year: "2017", tag: "seminal" },
  { num: "[3]", title: "Semantic Image Synthesis with Spatially-Adaptive Normalization (SPADE / GauGAN)", authors: "Park, Liu, Wang, Zhu", venue: "CVPR", year: "2019", tag: "seminal" },
  { num: "[4]", title: "Conditional Generative Adversarial Nets", authors: "Mirza, Osindero", venue: "arXiv", year: "2014", tag: "seminal" },
  { num: "[5]", title: "U-Net: Convolutional Networks for Biomedical Image Segmentation", authors: "Ronneberger, Fischer, Brox", venue: "MICCAI", year: "2015", tag: "seminal" },
  { num: "[6]", title: "High-Resolution Image Synthesis and Semantic Manipulation with Conditional GANs (pix2pixHD)", authors: "Wang, Liu, Zhu, Tao, Kautz, Catanzaro", venue: "CVPR", year: "2018", tag: "paper" },
  { num: "[7]", title: "StarGAN: Unified Generative Adversarial Networks for Multi-Domain Image-to-Image Translation", authors: "Choi, Choi, Kim, Ha, Kim, Choo", venue: "CVPR", year: "2018", tag: "paper" },
  { num: "[8]", title: "DualGAN: Unsupervised Dual Learning for Image-to-Image Translation", authors: "Yi, Zhang, Tan, Gong", venue: "ICCV", year: "2017", tag: "paper" },
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
        Chapter 18 · Part V — Image Generative Models
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
        A vanilla GAN samples z ~ N(0, I) and produces G(z) — an image with no
        external control over what gets generated. Conditional GANs (cGANs) add
        an input condition x: the generator becomes G(x, z) and the discriminator
        becomes D(x, y), where y is a real or fake image paired with x. For image
        translation, the condition is itself an image — a sketch, a label map,
        a low-resolution photograph. The output is a translated version of that
        input. The randomness z is often removed entirely in modern image
        translation models: the input image carries enough information to define
        the output, and added noise tends to be ignored by the generator anyway.
      </p>

      <MathBlock>{`Unconditional GAN: G(z) -> y          D(y) -> real/fake
Conditional GAN:   G(x, z) -> y       D(x, y) -> real/fake`}</MathBlock>

      <ConditionalGeneration />

      {/* ── Section 2: pix2pix — Paired Translation ─────────────────────────── */}
      <div id="pix2pix">
        <SectionTitle>pix2pix — Paired Translation</SectionTitle>
      </div>

      <p style={prose}>
        pix2pix learns a mapping G: X -&gt; Y from paired training examples. Two
        architectural choices made pix2pix work where earlier conditional GANs had
        struggled. The generator uses a U-Net with skip connections from each
        encoder layer to the corresponding decoder layer — this lets low-level
        detail like edges flow directly from input to output, bypassing the
        information bottleneck of the bottom layer. The discriminator is a PatchGAN:
        instead of classifying the whole image as real or fake, it classifies each
        N x N patch independently and averages the result. This produces sharper
        outputs by focusing the adversarial signal on high-frequency texture rather
        than the low-frequency content that the L1 loss already captures.
      </p>

      <MathBlock>{`L_pix2pix = L_cGAN(G, D) + lambda * L_L1(G)
L_L1(G) = E_{x,y} [ ||y - G(x)||_1 ]`}</MathBlock>

      <Pix2pixArchitecture />

      <PairedTranslation />

      {/* ── Section 3: Cycle Consistency — Translation Without Pairs ─────────── */}
      <div id="cycle-consistency">
        <SectionTitle>Cycle Consistency — Translation Without Pairs</SectionTitle>
      </div>

      <p style={prose}>
        Paired data is expensive. For most interesting translation tasks — turning
        horses into zebras, summer landscapes into winter ones, photographs into
        Monets — paired examples do not exist. CycleGAN sidesteps this entirely by
        training two generators G: X -&gt; Y and F: Y -&gt; X with a cycle consistency
        loss: F(G(x)) should approximately equal x, and G(F(y)) should approximately
        equal y. This constraint prevents the generators from producing arbitrary
        images that happen to fool their discriminator — the output must contain
        enough information to reconstruct the original input. The result is a
        self-supervised translation objective that works without correspondence.
      </p>

      <MathBlock>{`L_cyc(G, F) = E_x [ ||F(G(x)) - x||_1 ] + E_y [ ||G(F(y)) - y||_1 ]
L_total = L_GAN(G, D_Y) + L_GAN(F, D_X) + lambda * L_cyc(G, F)`}</MathBlock>

      <CycleConsistency />

      <CycleGANArchitecture />

      {/* ── Section 4: Semantic Synthesis — SPADE ───────────────────────────── */}
      <div id="semantic-synthesis">
        <SectionTitle>Semantic Synthesis — SPADE</SectionTitle>
      </div>

      <p style={prose}>
        A specialized form of image translation takes a semantic segmentation map
        as input and produces a photorealistic scene as output. Each pixel in the
        input is colored by its class — sky, road, tree, building — and the model
        must produce realistic textures consistent with that semantic layout.
        The SPADE (Spatially-Adaptive Denormalization) module replaced the standard
        batch normalization in the generator with a normalization whose affine
        parameters are predicted from the semantic map itself. This preserves the
        semantic information through the network rather than washing it out in the
        deep layers, producing images where every pixel respects the intended
        class assignment.
      </p>

      <MathBlock>{`SPADE: gamma(M), beta(M) = ConvNet(M)
y_normed = (y - mu) / sigma
y_SPADE = gamma(M) * y_normed + beta(M)
where M is the semantic mask, mu/sigma are channel-wise statistics`}</MathBlock>

      <SPADESynthesis />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
