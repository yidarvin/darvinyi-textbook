import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import ConvolutionExplorer from "../../components/widgets/ch12/ConvolutionExplorer";
import ReceptiveField from "../../components/widgets/ch12/ReceptiveField";
import ArchitectureTimeline from "../../components/widgets/ch12/ArchitectureTimeline";
import SkipConnection from "../../components/widgets/ch12/SkipConnection";
import DilatedConvolution from "../../components/widgets/ch12/DilatedConvolution";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Gradient-Based Learning Applied to Document Recognition", authors: "LeCun, Bottou, Bengio, Haffner", venue: "Proceedings of the IEEE", year: "1998", tag: "seminal" },
  { num: "[2]", title: "ImageNet Classification with Deep Convolutional Neural Networks", authors: "Krizhevsky, Sutskever, Hinton", venue: "NeurIPS", year: "2012", tag: "seminal" },
  { num: "[3]", title: "Very Deep Convolutional Networks for Large-Scale Image Recognition", authors: "Simonyan & Zisserman", venue: "ICLR", year: "2015", tag: "paper" },
  { num: "[4]", title: "Deep Residual Learning for Image Recognition", authors: "He, Zhang, Ren, Sun", venue: "CVPR", year: "2016", tag: "seminal" },
  { num: "[5]", title: "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks", authors: "Tan & Le", venue: "ICML", year: "2019", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-convolution-operation",   label: "The Convolution" },
  { id: "receptive-fields",            label: "Receptive Fields" },
  { id: "architecture-evolution",      label: "Architecture Evolution" },
  { id: "residual-learning",           label: "Residual Learning" },
  { id: "depthwise-separable-dilated", label: "Separable & Dilated" },
];

export default function ConvNets() {
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
        Chapter 12 · Part IV — Other Architectures
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
        Convolutional Networks
      </h1>

      <ChapterLede>
        Images have structure that fully-connected layers ignore — nearby pixels are
        related, patterns repeat across locations, and useful features are hierarchical.
        Convolutional networks exploit all three properties through weight sharing,
        local connectivity, and stacked feature extraction.
      </ChapterLede>

      {/* ── Section 1: The Convolution Operation ─────────────────────────── */}
      <div id="the-convolution-operation">
        <SectionTitle>The Convolution Operation</SectionTitle>
      </div>

      <p style={prose}>
        A convolution slides a small filter across the input, computing a dot product
        at each position. The same filter weights are reused everywhere — this weight
        sharing gives CNNs translation equivariance and dramatically reduces the
        parameter count compared to fully-connected layers. Striding the convolution
        reduces spatial size; padding preserves it.
      </p>

      <MathBlock>{"(f ★ g)[i,j] = Σₘ Σₙ f[m,n] · g[i−m, j−n]"}</MathBlock>

      <ConvolutionExplorer />

      {/* ── Section 2: Receptive Fields ──────────────────────────────────── */}
      <div id="receptive-fields">
        <SectionTitle>Receptive Fields</SectionTitle>
      </div>

      <p style={prose}>
        A neuron in a deep layer can only see a limited region of the original input —
        its receptive field. Stacking 3×3 convolutions expands this: two layers give
        a 5×5 receptive field; three give 7×7. Dilated convolutions insert gaps
        between sampled pixels, achieving large receptive fields without increasing
        parameter count or sacrificing resolution.
      </p>

      <ReceptiveField />

      {/* ── Section 3: Architecture Evolution ───────────────────────────── */}
      <div id="architecture-evolution">
        <SectionTitle>Architecture Evolution</SectionTitle>
      </div>

      <p style={prose}>
        The ImageNet competition drove a decade of architectural discovery. AlexNet
        (2012) proved deep CNNs work at scale and introduced ReLU and dropout.
        VGG showed that uniform 3×3 kernels stacked deeply outperform large kernels.
        ResNet (2016) enabled networks over 100 layers deep with skip connections,
        and EfficientNet extended this with compound scaling across depth, width,
        and resolution simultaneously.
      </p>

      <ArchitectureTimeline />

      {/* ── Section 4: Residual Learning & Skip Connections ─────────────── */}
      <div id="residual-learning">
        <SectionTitle>Residual Learning & Skip Connections</SectionTitle>
      </div>

      <p style={prose}>
        Instead of learning a mapping H(x) directly, a residual block learns the
        residual F(x) = H(x) − x, adding x back via a shortcut connection.
        This reformulation makes the identity mapping trivially learnable — if a
        layer should do nothing, F(x) simply converges to zero. Crucially, skip
        connections create a gradient highway through the network, bypassing
        potentially saturated nonlinearities during backpropagation.
      </p>

      <MathBlock>{"y = F(x, {Wᵢ}) + x    where F(x) = W₂ σ(W₁x)"}</MathBlock>

      <SkipConnection />

      {/* ── Section 5: Depthwise Separable & Dilated Convolutions ────────── */}
      <div id="depthwise-separable-dilated">
        <SectionTitle>Depthwise Separable & Dilated Convolutions</SectionTitle>
      </div>

      <p style={prose}>
        A standard d×d convolution over C input channels costs O(d²C) per output
        channel. Depthwise separable convolutions factor this into a per-channel
        spatial filter followed by a 1×1 pointwise convolution, reducing cost by
        roughly 8–9× at comparable capacity. Dilated convolutions achieve exponentially
        growing receptive fields by stacking layers with increasing dilation rates —
        critical for semantic segmentation and audio generation.
      </p>

      <DilatedConvolution />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
