import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import ConvolutionExplorer from "../../components/widgets/ch12/ConvolutionExplorer";
import ReceptiveField from "../../components/widgets/ch12/ReceptiveField";
import ArchitectureTimeline from "../../components/widgets/ch12/ArchitectureTimeline";
import SkipConnection from "../../components/widgets/ch12/SkipConnection";
import DilatedConvolution from "../../components/widgets/ch12/DilatedConvolution";
import ConvVsFullyConnected from "../../components/diagrams/ch12/ConvVsFullyConnected";
import ReceptiveFieldGrowth from "../../components/diagrams/ch12/ReceptiveFieldGrowth";
import ImageNetArchitectures from "../../components/diagrams/ch12/ImageNetArchitectures";
import ResidualBlock from "../../components/diagrams/ch12/ResidualBlock";
import DepthwiseSeparableDecomposition from "../../components/diagrams/ch12/DepthwiseSeparableDecomposition";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
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
        Chapter 12 · Part IV — Other Architectures
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
        A convolution slides a small filter across the input, computing a dot
        product at each position. The same filter weights are reused everywhere —
        this weight sharing gives CNNs translation equivariance and dramatically
        reduces the parameter count compared to fully-connected layers. Striding
        the convolution reduces spatial size; padding preserves it.
      </p>

      <p style={prose}>
        The convolutional architecture was inspired by Hubel and Wiesel's 1962
        study of the cat visual cortex, which found neurons that responded to
        oriented edges in small regions of the visual field — local feature
        detectors that, in aggregate, supported pattern recognition. Fukushima's
        Neocognitron (1980) built on this idea computationally, and LeCun,
        Bottou, Bengio & Haffner (1998) [1] gave it the form we recognize today:
        stacked convolutions and pooling, trained end-to-end with backpropagation.
        Their LeNet-5 architecture was deployed in real banking systems to read
        handwritten checks throughout the late 1990s — a working production CNN
        a decade before AlexNet made the architecture famous.
      </p>

      <p style={prose}>
        A semantic detail worth flagging: the "convolution" in deep learning is
        almost always implemented as <em>cross-correlation</em> — the filter is
        not flipped before sliding. Mathematical convolution flips the kernel;
        cross-correlation does not. Networks trained with one or the other learn
        equivalent filters, so the distinction makes no practical difference, but
        it does mean the formula below is the cross-correlation form used in
        every modern framework, not the textbook convolution. The same naming
        inconsistency exists in classical signal processing; the deep-learning
        community has just standardized on the wrong word for it.
      </p>

      <MathBlock>{"$$(f \\star g)[i, j] = \\sum_m \\sum_n f[m, n] \\cdot g[i + m,\\, j + n]$$"}</MathBlock>

      <ConvVsFullyConnected />

      <ConvolutionExplorer />

      {/* ── Section 2: Receptive Fields ──────────────────────────────────── */}
      <div id="receptive-fields">
        <SectionTitle>Receptive Fields</SectionTitle>
      </div>

      <p style={prose}>
        A neuron in a deep layer can only see a limited region of the original
        input — its receptive field. Stacking 3×3 convolutions expands this: two
        layers give a 5×5 receptive field; three give 7×7. Dilated convolutions
        insert gaps between sampled pixels, achieving large receptive fields
        without increasing parameter count or sacrificing resolution.
      </p>

      <p style={prose}>
        For a stack of <InlineMath>{"L"}</InlineMath> convolutional layers with
        kernel size <InlineMath>{"k"}</InlineMath> and stride 1, the receptive
        field grows linearly with depth:{" "}
        <InlineMath>{"\\mathrm{RF}_L = 1 + L(k-1)"}</InlineMath>. So a 10-layer
        stack of 3×3 convolutions sees a 21×21 region of the input — a tiny
        fraction of a typical image. Strided convolutions and pooling layers
        multiply this growth: each stride-2 layer doubles the effective
        receptive field per remaining layer. Dilated convolutions skip the
        stride trade-off entirely — with dilation rate{" "}
        <InlineMath>{"d"}</InlineMath>, a 3×3 kernel covers{" "}
        <InlineMath>{"(2d+1)\\times(2d+1)"}</InlineMath> of the input while
        still computing only 9 multiplications. Stacking dilated layers with
        exponentially increasing rates{" "}
        <InlineMath>{"(1, 2, 4, \\ldots, 2^{L-1})"}</InlineMath> produces{" "}
        <em>exponential</em> receptive-field growth — closed form{" "}
        <InlineMath>{"\\mathrm{RF}_L = 2^{L+1} - 1"}</InlineMath> for{" "}
        <InlineMath>{"L"}</InlineMath> stacked 3×3 dilated layers, so just four
        layers cover a 31×31 region with 36 total parameters.
      </p>

      <p style={prose}>
        Luo, Li, Urtasun & Zemel (2016) showed that the theoretical receptive
        field overstates what the network actually uses. Even though a neuron in
        a deep layer is <em>connected to</em> a large input region, its
        gradients during training concentrate in a Gaussian-like distribution
        around the center — most of the connection has near-zero effective
        weight. The "effective receptive field" is typically much smaller than
        the theoretical one, often by a factor of 2 or more. This is one of
        several reasons attention-based models (Chs 7, 8) eventually outcompeted
        CNNs at long-range tasks: every position in a transformer can attend to
        every other position from layer 1, with no effective-radius decay.
      </p>

      <ReceptiveFieldGrowth />

      <ReceptiveField />

      {/* ── Section 3: Architecture Evolution ───────────────────────────── */}
      <div id="architecture-evolution">
        <SectionTitle>Architecture Evolution</SectionTitle>
      </div>

      <p style={prose}>
        The ImageNet competition drove a decade of architectural discovery.
        AlexNet (2012) proved deep CNNs work at scale and introduced ReLU and
        dropout. VGG showed that uniform 3×3 kernels stacked deeply outperform
        large kernels. ResNet (2016) enabled networks over 100 layers deep with
        skip connections, and EfficientNet extended this with compound scaling
        across depth, width, and resolution simultaneously.
      </p>

      <p style={prose}>
        The story of CNN architectures from 2012 to 2019 is the story of
        ImageNet leaderboards. AlexNet (Krizhevsky, Sutskever & Hinton 2012) [2]
        was 8 layers, used ReLU and dropout, and won ImageNet by a 10-point
        margin — proving deep CNNs trained on GPUs at scale were the right
        approach. VGG (Simonyan & Zisserman 2015) [3] was 16–19 layers of
        uniform 3×3 kernels and demonstrated that depth alone (with no
        architectural cleverness) drove performance gains. GoogLeNet/Inception
        introduced 1×1 convolutions and parallel branches for parameter
        efficiency. ResNet (He, Zhang, Ren & Sun 2016) [4] solved the
        "degradation problem" — the empirical finding that deeper plain networks
        performed <em>worse</em> than shallower ones — through residual
        connections, enabling networks of 50, 101, even 152 layers to train
        successfully. EfficientNet (Tan & Le 2019) [5] proposed compound
        scaling: instead of scaling depth, width, or resolution in isolation,
        scale all three together along a learned principal curve.
      </p>

      <p style={prose}>
        From 2021 onward, ViT (covered in Ch 11) increasingly displaced CNNs on
        large-scale vision benchmarks. By 2022, the conventional wisdom was that
        CNNs were obsolete on anything but small-data tasks. Liu, Mao, Wu,
        Feichtenhofer, Darrell & Xie (2022) pushed back with ConvNeXt: a CNN
        modernized with the design choices that made ViT work — large kernels
        (7×7 instead of 3×3), Layer Normalization instead of Batch
        Normalization, GELU instead of ReLU, inverted bottlenecks, and so on —
        could match ViT on ImageNet at comparable parameter counts. The current
        picture is more nuanced than "transformers won": transformers dominate
        at very large scale and on multimodal tasks, but CNNs remain competitive
        (and often faster at inference) in the regimes where they were
        originally designed — image classification at moderate scale, object
        detection (YOLO and its descendants), and the U-Net backbones of every
        modern image-generation model.
      </p>

      <ImageNetArchitectures />

      <ArchitectureTimeline />

      {/* ── Section 4: Residual Learning & Skip Connections ─────────────── */}
      <div id="residual-learning">
        <SectionTitle>Residual Learning & Skip Connections</SectionTitle>
      </div>

      <p style={prose}>
        Instead of learning a mapping <InlineMath>{"H(x)"}</InlineMath>{" "}
        directly, a residual block learns the residual{" "}
        <InlineMath>{"F(x) = H(x) - x"}</InlineMath>, adding{" "}
        <InlineMath>{"x"}</InlineMath> back via a shortcut connection. This
        reformulation makes the identity mapping trivially learnable — if a
        layer should do nothing, <InlineMath>{"F(x)"}</InlineMath> simply
        converges to zero. Crucially, skip connections create a gradient
        highway through the network, bypassing potentially saturated
        nonlinearities during backpropagation.
      </p>

      <p style={prose}>
        Before residual connections, the conventional wisdom was "deeper is
        better, up to a point." In 2015, plain CNNs at 20+ layers consistently{" "}
        <em>underperformed</em> their 16-layer counterparts on ImageNet — the
        deeper network had strictly more capacity but trained to a worse
        minimum. He, Zhang, Ren & Sun (2016) [4] named this the{" "}
        <strong>degradation problem</strong>: not vanishing gradients (which
        careful initialization had largely fixed), not overfitting (training
        loss was also higher), but an optimization failure where the deeper
        network couldn't even <em>match</em> the shallower one's training loss.
        Their reframing was elegant: if a layer can learn nothing useful and its
        block should reduce to the identity, the residual formulation makes
        that trivial. <InlineMath>{"F(x) \\to 0"}</InlineMath> gives{" "}
        <InlineMath>{"y = x"}</InlineMath>. The plain formulation would require
        the network to learn <InlineMath>{"H(x) = x"}</InlineMath> through
        nonlinearities — a non-trivial optimization target.
      </p>

      <p style={prose}>
        Skip connections have a second effect beyond the identity argument:
        they create a direct gradient pathway from the loss back to early
        layers. The gradient through a residual block is{" "}
        <InlineMath>{"\\partial L/\\partial x = (\\partial L/\\partial y)(1 + \\partial F/\\partial x)"}</InlineMath>{" "}
        — the constant <InlineMath>{"1"}</InlineMath> term ensures the upstream
        gradient never vanishes regardless of what{" "}
        <InlineMath>{"\\partial F/\\partial x"}</InlineMath> does. This is the
        same mechanism that makes the residual stream work in transformers
        (Ch 8). Skip connections are now nearly universal: every transformer
        block uses them, every modern CNN uses them, U-Nets use them, even GANs
        and diffusion models use them. The 2016 ResNet paper was the moment
        "skip connection" became a permanent part of the deep learning
        vocabulary.
      </p>

      <MathBlock>{"$$y = F\\!\\bigl(x,\\, \\{W_i\\}\\bigr) + x \\qquad \\text{where}\\quad F(x) = W_2\\, \\sigma(W_1 x)$$"}</MathBlock>

      <ResidualBlock />

      <SkipConnection />

      {/* ── Section 5: Depthwise Separable & Dilated Convolutions ────────── */}
      <div id="depthwise-separable-dilated">
        <SectionTitle>Depthwise Separable & Dilated Convolutions</SectionTitle>
      </div>

      <p style={prose}>
        A standard <InlineMath>{"d \\times d"}</InlineMath> convolution over{" "}
        <InlineMath>{"C"}</InlineMath> input channels costs{" "}
        <InlineMath>{"\\mathcal{O}(d^2 C)"}</InlineMath> per output channel.
        Depthwise separable convolutions factor this into a per-channel spatial
        filter followed by a 1×1 pointwise convolution, reducing cost by roughly
        8–9× at comparable capacity. Dilated convolutions achieve exponentially
        growing receptive fields by stacking layers with increasing dilation
        rates — critical for semantic segmentation and audio generation.
      </p>

      <p style={prose}>
        A standard{" "}
        <InlineMath>{"k \\times k \\times C_{\\text{in}} \\times C_{\\text{out}}"}</InlineMath>{" "}
        convolution couples spatial filtering and cross-channel mixing in a
        single operation, with cost{" "}
        <InlineMath>{"\\mathcal{O}(k^2 C_{\\text{in}} C_{\\text{out}})"}</InlineMath>{" "}
        per output spatial position. Depthwise separable convolution (Chollet
        2017's Xception, popularized in Howard et al. 2017's MobileNet) factors
        this into two cheaper operations: a <em>depthwise</em> convolution
        applies one <InlineMath>{"k \\times k"}</InlineMath> filter per input
        channel independently (cost{" "}
        <InlineMath>{"\\mathcal{O}(k^2 C_{\\text{in}})"}</InlineMath>), and a{" "}
        <em>pointwise</em> <InlineMath>{"1 \\times 1"}</InlineMath> convolution
        mixes across channels (cost{" "}
        <InlineMath>{"\\mathcal{O}(C_{\\text{in}} C_{\\text{out}})"}</InlineMath>).
        Total cost is{" "}
        <InlineMath>{"\\mathcal{O}(k^2 C_{\\text{in}} + C_{\\text{in}} C_{\\text{out}})"}</InlineMath>,
        an 8–9× reduction for typical 3×3 kernels with hundreds of channels —
        at the cost of some expressive power, since the joint k×k×channel
        mixing is now factorized. MobileNet, EfficientNet, and most on-device
        vision models use this decomposition; the architectural trade-off pays
        for itself in latency.
      </p>

      <DepthwiseSeparableDecomposition />

      <p style={prose}>
        Standard convolution couples receptive-field growth with
        spatial-resolution loss: to see further, you typically downsample
        (pooling or strided convolution), which throws away resolution that
        semantic segmentation needs back. Dilated convolution (Yu & Koltun 2015)
        breaks this trade-off. By inserting gaps of size{" "}
        <InlineMath>{"d-1"}</InlineMath> between the sampled pixels of a{" "}
        <InlineMath>{"k \\times k"}</InlineMath> filter, the receptive field
        grows to <InlineMath>{"(d(k-1) + 1)^2"}</InlineMath> with the{" "}
        <em>same</em> number of parameters and <em>no</em> resolution loss.
        Stacking layers with exponentially increasing dilation{" "}
        <InlineMath>{"(1, 2, 4, 8, 16, \\ldots)"}</InlineMath> produces
        exponential receptive-field growth in linear depth — the trick behind
        DeepLab's semantic-segmentation networks and WaveNet's audio generation
        (van den Oord et al. 2016), where dilated 1D convolutions reach across
        thousands of audio samples without explicit recurrence.
      </p>

      <DilatedConvolution />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
