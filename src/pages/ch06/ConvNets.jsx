import { useTocSections } from "../../components/layout/TocContext";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import ConvolutionExplorer from "../../components/widgets/ch06/ConvolutionExplorer";
import ReceptiveField from "../../components/widgets/ch06/ReceptiveField";
import ArchitectureTimeline from "../../components/widgets/ch06/ArchitectureTimeline";
import SkipConnection from "../../components/widgets/ch06/SkipConnection";
import DilatedConvolution from "../../components/widgets/ch06/DilatedConvolution";
import ConvVsFullyConnected from "../../components/diagrams/ch06/ConvVsFullyConnected";
import ReceptiveFieldGrowth from "../../components/diagrams/ch06/ReceptiveFieldGrowth";
import ImageNetArchitectures from "../../components/diagrams/ch06/ImageNetArchitectures";
import ResidualBlock from "../../components/diagrams/ch06/ResidualBlock";
import DepthwiseSeparableDecomposition from "../../components/diagrams/ch06/DepthwiseSeparableDecomposition";
import InvarianceVsEquivariance from "../../components/diagrams/ch06/InvarianceVsEquivariance";
import RoutingByAgreement from "../../components/diagrams/ch06/RoutingByAgreement";
import CnnVsCapsnet from "../../components/widgets/ch06/CnnVsCapsnet";
import DynamicRouting from "../../components/widgets/ch06/DynamicRouting";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

// Ordered by first in-text appearance; buildCitations assigns `num` by position.
const CITATIONS = buildCitations([
  {
    title: "Receptive Fields, Binocular Interaction and Functional Architecture in the Cat's Visual Cortex",
    authors: "Hubel & Wiesel",
    venue: "The Journal of Physiology",
    year: "1962",
    tag: "seminal",
  },
  {
    title: "Neocognitron: A Self-Organizing Neural Network Model for a Mechanism of Pattern Recognition Unaffected by Shift in Position",
    authors: "Fukushima",
    venue: "Biological Cybernetics",
    year: "1980",
    tag: "seminal",
  },
  { title: "Gradient-Based Learning Applied to Document Recognition", authors: "LeCun, Bottou, Bengio, Haffner", venue: "Proceedings of the IEEE", year: "1998", tag: "seminal" },
  {
    title: "Understanding the Effective Receptive Field in Deep Convolutional Neural Networks",
    authors: "Luo, Li, Urtasun, Zemel",
    venue: "NeurIPS",
    year: "2016",
    tag: "paper",
  },
  {
    title: "Visualizing and Understanding Convolutional Networks",
    authors: "Zeiler & Fergus",
    venue: "ECCV",
    year: "2014",
    tag: "paper",
  },
  { title: "ImageNet Classification with Deep Convolutional Neural Networks", authors: "Krizhevsky, Sutskever, Hinton", venue: "NeurIPS", year: "2012", tag: "seminal" },
  { title: "Very Deep Convolutional Networks for Large-Scale Image Recognition", authors: "Simonyan & Zisserman", venue: "ICLR", year: "2015", tag: "paper" },
  {
    title: "Going Deeper with Convolutions",
    authors: "Szegedy, Liu, Jia, Sermanet, Reed, Anguelov, Erhan, Vanhoucke, Rabinovich",
    venue: "CVPR",
    year: "2015",
    tag: "paper",
  },
  { title: "Deep Residual Learning for Image Recognition", authors: "He, Zhang, Ren, Sun", venue: "CVPR", year: "2016", tag: "seminal" },
  { title: "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks", authors: "Tan & Le", venue: "ICML", year: "2019", tag: "paper" },
  {
    title: "A ConvNet for the 2020s",
    authors: "Liu, Mao, Wu, Feichtenhofer, Darrell, Xie",
    venue: "CVPR",
    year: "2022",
    tag: "paper",
  },
  {
    title: "ConvNeXt V2: Co-designing and Scaling ConvNets with Masked Autoencoders",
    authors: "Woo, Debnath, Hu, Chen, Liu, Kweon, Xie",
    venue: "CVPR",
    year: "2023",
    tag: "paper",
  },
  {
    title: "Xception: Deep Learning with Depthwise Separable Convolutions",
    authors: "Chollet",
    venue: "CVPR",
    year: "2017",
    tag: "paper",
  },
  {
    title: "MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications",
    authors: "Howard, Zhu, Chen, Kalenichenko, Wang, Weyand, Andreetto, Adam",
    venue: "arXiv",
    year: "2017",
    tag: "paper",
  },
  {
    // Published version (ICLR 2016) preferred over the 2015 arXiv preprint.
    title: "Multi-Scale Context Aggregation by Dilated Convolutions",
    authors: "Yu & Koltun",
    venue: "ICLR",
    year: "2016",
    tag: "paper",
  },
  {
    title: "Semantic Image Segmentation with Deep Convolutional Nets and Fully Connected CRFs",
    authors: "Chen, Papandreou, Kokkinos, Murphy, Yuille",
    venue: "ICLR",
    year: "2015",
    tag: "paper",
  },
  {
    title: "WaveNet: A Generative Model for Raw Audio",
    authors: "van den Oord, Dieleman, Zen, Simonyan, Vinyals, Graves, Kalchbrenner, Senior, Kavukcuoglu",
    venue: "arXiv",
    year: "2016",
    tag: "paper",
  },
  { title: "Dynamic Routing Between Capsules", authors: "Sabour, Frosst, Hinton", venue: "NeurIPS", year: "2017", tag: "seminal" },
  { title: "Matrix Capsules with EM Routing", authors: "Hinton, Sabour, Frosst", venue: "ICLR", year: "2018", tag: "paper" },
  { title: "Transforming Auto-encoders", authors: "Hinton, Krizhevsky, Wang", venue: "ICANN", year: "2011", tag: "paper" },
  {
    title: "How to Represent Part-Whole Hierarchies in a Neural Network (GLOM)",
    authors: "Hinton",
    venue: "arXiv",
    year: "2021",
    tag: "paper",
  },
  {
    title: "Capsule Networks – A Survey",
    authors: "Patrick, Adekoya, Mighty, Edward",
    venue: "Journal of King Saud University – Computer and Information Sciences",
    year: "2022",
    tag: "survey",
  },
]);

const TOC_SECTIONS = [
  { id: "the-convolution-operation",   label: "The Convolution" },
  { id: "receptive-fields",            label: "Receptive Fields" },
  { id: "architecture-evolution",      label: "Architecture Evolution" },
  { id: "residual-learning",           label: "Residual Learning" },
  { id: "depthwise-separable-dilated", label: "Separable & Dilated" },
  { id: "capsule-networks-detour",     label: "Capsules: A Detour" },
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
        Chapter 06 · Part I — Foundations
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
        local connectivity, and stacked feature extraction. That efficiency has a
        price — invariance bought by discarding spatial precision — and this
        chapter's own fault line is exactly where later architectures, from
        residual networks to attention to the capsule detour at its end, each
        answer that trade-off differently.
      </ChapterLede>

      {/* ── Section 1: The Convolution Operation ─────────────────────────── */}
      <div id="the-convolution-operation">
        <SectionTitle>The Convolution Operation</SectionTitle>
      </div>

      <p style={prose}>
        A convolution slides a small filter across the input, computing a dot
        product at each position. The same filter weights are reused everywhere —
        this weight sharing gives CNNs translation equivariance (shift the input
        and the output shifts the same way, rather than staying fixed — the
        opposite of invariance, which we return to in Section 6) and dramatically
        reduces the parameter count compared to fully-connected layers. Striding
        the convolution reduces spatial size; padding preserves it.
      </p>

      <p style={prose}>
        For an input of size <InlineMath>{"W"}</InlineMath>, a kernel of size{" "}
        <InlineMath>{"k"}</InlineMath>, padding <InlineMath>{"p"}</InlineMath>{" "}
        on each side, and stride <InlineMath>{"s"}</InlineMath>, the output size
        along each spatial dimension is:
      </p>

      <MathBlock>{"$$\\text{out} = \\left\\lfloor \\frac{W - k + 2p}{s} \\right\\rfloor + 1$$"}</MathBlock>

      <p style={prose}>
        The floor rounds down whenever the kernel doesn't tile the input evenly;
        larger stride or a smaller kernel both shrink the output, while padding
        grows it back.
      </p>

      <p style={prose}>
        A real convolutional layer rarely operates on a single channel. A color
        image has three (red, green, blue), and hidden layers commonly carry
        dozens to hundreds. Each filter is therefore not{" "}
        <InlineMath>{"k \\times k"}</InlineMath> but{" "}
        <InlineMath>{"k \\times k \\times C_{\\text{in}}"}</InlineMath>, sliding
        across all input channels at once and summing everything into a single
        output channel; a layer with{" "}
        <InlineMath>{"C_{\\text{out}}"}</InlineMath> output channels simply
        stacks <InlineMath>{"C_{\\text{out}}"}</InlineMath> such filters
        side by side. The parameter count follows directly:
      </p>

      <MathBlock>{"$$\\text{params} = k^2 \\, C_{\\text{in}} \\, C_{\\text{out}} + C_{\\text{out}}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"k^2 C_{\\text{in}}"}</InlineMath> is the size of one
        filter, <InlineMath>{"C_{\\text{out}}"}</InlineMath> such filters make
        up the layer, and the trailing{" "}
        <InlineMath>{"+\\,C_{\\text{out}}"}</InlineMath> adds one bias per
        output channel. A 3×3 convolution mapping 3 input channels to 64 output
        channels costs <InlineMath>{"3 \\times 3 \\times 3 \\times 64 = 1{,}728"}</InlineMath>{" "}
        weights (plus 64 biases) — a small fraction of what a fully-connected
        layer would need to connect every input pixel to every output unit,
        which is exactly the saving the diagram below makes concrete for a
        single channel.
      </p>

      <p style={prose}>
        Pooling is the other standard ingredient, and it appears throughout
        this chapter under its own name. It slides a small window — typically
        2×2 — over the feature map and reduces each window to one number,
        discarding everything else. Max pooling keeps the largest value in the
        window; average pooling keeps the mean. A 2×2 max-pool over the four
        values <InlineMath>{"[3, 1, 0, 2]"}</InlineMath> outputs{" "}
        <InlineMath>{"3"}</InlineMath> and throws the rest away, halving
        spatial resolution in each dimension while keeping only the strongest
        activation. This is how CNNs build translation invariance — small
        shifts in the input rarely change which value was the maximum — at the
        cost of exactly the positional precision Section 6 argues capsule
        networks were designed to win back.
      </p>

      <p style={prose}>
        The convolutional architecture was inspired by Hubel and Wiesel's 1962
        study [1] of the cat visual cortex, which found neurons that responded
        to oriented edges in small regions of the visual field — local feature
        detectors that, in aggregate, supported pattern recognition. Fukushima's
        Neocognitron (1980) [2] built on this idea computationally, and LeCun et
        al. (1998) [3] gave it the form we recognize today: stacked
        convolutions and pooling, trained end-to-end with backpropagation.
        Their LeNet-5 architecture was deployed in real banking systems to read
        handwritten checks throughout the late 1990s — a working production CNN
        over a decade before AlexNet made the architecture famous.
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

      <MathBlock>{"$$(f \\star g)[i, j] = \\sum_m \\sum_n f[i + m,\\, j + n] \\cdot g[m, n]$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"f"}</InlineMath> is the input, <InlineMath>{"g"}</InlineMath>{" "}
        the filter, and <InlineMath>{"(i, j)"}</InlineMath> the output position
        being computed; the sums range over the filter's spatial extent{" "}
        <InlineMath>{"(m, n)"}</InlineMath>.
      </p>

      <ConvVsFullyConnected />

      <p style={prose}>
        Keep Edge Detect selected and drag the position slider below until the
        receptive-field box sits inside the flat gray square in the input's
        lower-left quadrant; the patch · kernel readout should drop to almost
        exactly 0.0000, since the edge kernel's weights sum to zero and a
        uniform patch has no edge to detect.
      </p>

      <ConvolutionExplorer
        tryThis={{
          do: "Keep Edge Detect selected and drag the position slider so the receptive-field box sits inside the flat gray square in the input's lower-left quadrant.",
          notice: "The Value readout drops to almost exactly 0.0000 — the edge kernel's weights sum to zero, so a uniform patch with no edge produces no response.",
        }}
      />

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
        Luo et al. (2016) [4] showed that the theoretical receptive
        field overstates what the network actually uses. Even though a neuron in
        a deep layer is <em>connected to</em> a large input region, its
        gradients during training concentrate in a Gaussian-like distribution
        around the center — most of the connection has near-zero effective
        weight. The "effective receptive field" is typically much smaller than
        the theoretical one, often by a factor of 2 or more. This is one of
        several reasons attention-based models (Chapters 9 and 10) eventually outcompeted
        CNNs at long-range tasks: every position in a transformer can attend to
        every other position from layer 1, with no effective-radius decay.
      </p>

      <ReceptiveFieldGrowth />

      <p style={prose}>
        Set stride to 1 and click a neuron in layer L3 below; the stats
        panel's L3 receptive field should read 7×7, matching{" "}
        <InlineMath>{"1 + L(k-1)"}</InlineMath> with{" "}
        <InlineMath>{"L=3"}</InlineMath>, <InlineMath>{"k=3"}</InlineMath>.
        Now raise dilation to 4 and watch that same L3 receptive field jump to
        25×25 while the kernel still samples only 9 pixels.
      </p>

      <ReceptiveField
        tryThis={{
          do: "Set stride to 1, click a neuron in layer L3, then raise dilation to 4.",
          notice: "The L3 receptive field grows from 7×7 to 25×25 while the kernel still only samples 9 pixels — the exponential payoff of dilation.",
        }}
      />

      {/* ── Section 3: Architecture Evolution ───────────────────────────── */}
      <div id="architecture-evolution">
        <SectionTitle>Architecture Evolution</SectionTitle>
      </div>

      <p style={prose}>
        Stacking convolutional layers doesn't just grow the receptive field
        geometrically — it changes what the network represents at each depth.
        Filters in the earliest layers typically learn oriented edges and
        color blobs; middle layers combine these into textures and simple
        parts (corners, curves, motifs); the deepest layers respond to whole
        objects, largely independent of exact position. Zeiler & Fergus (2014)
        [5] made this concrete by visualizing what maximally activates
        individual filters at each depth of a trained network, confirming the
        edges-to-textures-to-parts-to-objects progression directly rather than
        leaving it as a plausible story.
      </p>

      <p style={prose}>
        The ImageNet competition drove a decade of architectural discovery,
        and the story from 2012 to 2019 is largely the story of its
        leaderboard. AlexNet (Krizhevsky et al. 2012) [6] was 8 layers, won
        ImageNet by a 10-point margin, and proved deep CNNs trained on GPUs
        at scale were the right approach. It popularized ReLU, which had
        predated it by about two years (Nair & Hinton, 2010), and dropout —
        a same-year, same-lab technique first described in an unpublished
        July 2012 preprint that AlexNet's own paper cites — which AlexNet
        was the first to demonstrate paid off at ImageNet scale. VGG
        (Simonyan & Zisserman 2015) [7] was 16–19 layers of uniform 3×3
        kernels and showed that depth alone, with no architectural
        cleverness, drove performance gains. GoogLeNet/Inception (Szegedy et
        al. 2015) [8] adopted 1×1 convolutions — introduced the year before
        by Lin, Chen & Yan's Network in Network — and added parallel
        branches of different kernel sizes for more capacity per parameter.
        ResNet (He et al. 2016) [9] solved the "degradation problem" — the
        empirical finding that deeper plain networks performed{" "}
        <em>worse</em> than shallower ones — through residual connections,
        enabling networks of 50, 101, even 152 layers to train successfully.
        EfficientNet (Tan & Le 2019) [10] proposed compound scaling: instead
        of scaling depth, width, or resolution in isolation, scale all three
        together along a learned principal curve.
      </p>

      <p style={prose}>
        From 2021 onward, ViT (covered in Chapter 15) increasingly displaced CNNs on
        large-scale vision benchmarks. By 2022, the conventional wisdom was that
        CNNs were obsolete on anything but small-data tasks. Liu et al. (2022)
        [11] pushed back with ConvNeXt: a CNN
        modernized with the design choices that made ViT work — large kernels
        (7×7 instead of 3×3), Layer Normalization instead of Batch
        Normalization, GELU (the Gaussian Error Linear Unit — Chapter 3's
        smooth, probabilistic alternative to ReLU) instead of ReLU, inverted
        bottlenecks (blocks that widen the channel count before the spatial
        convolution and narrow it back after, the reverse of a classic
        bottleneck), and so on — could match ViT on ImageNet at comparable
        parameter counts. ConvNeXt V2 (Woo et al. 2023) [12] went further,
        pairing the architecture with masked-autoencoder self-supervised
        pretraining and a Global Response Normalization layer (a per-channel
        normalization computed from each channel's global feature magnitude,
        added to stop channels from collapsing into redundant copies of one
        another), narrowing the gap to ViT-based self-supervised
        methods still further. The current
        picture is more nuanced than "transformers won": transformers dominate
        at very large scale and on multimodal tasks, but CNNs remain competitive
        (and often faster at inference) in the regimes where they were
        originally designed — image classification at moderate scale and
        object detection (YOLO and its descendants). Image generation is the
        clearest reversal: U-Net-style convolutional backbones anchored
        diffusion models (Stable Diffusion 1.x/2.x, DALL·E 2) through the
        early 2020s, but most frontier generators have since moved to
        transformer-based Diffusion Transformer (DiT) backbones — Stable
        Diffusion 3, FLUX, Sora — covered in Chapter 20, leaving CNNs'
        foothold in image generation mostly historical.
      </p>

      <p style={prose}>
        These architectures are rarely trained from scratch in practice. The
        dominant pattern is transfer learning: take a backbone pretrained on
        ImageNet, freeze its early layers — which, per the edge-to-object
        hierarchy above, have already converged to generic detectors useful
        for almost any vision task — and fine-tune only the later, more
        task-specific layers (or just a new task head) on the target dataset.
        This is why the filter hierarchy matters practically and not only
        descriptively: pretrained weights transfer well precisely because
        early layers learn similar generic features across tasks.
      </p>

      <ImageNetArchitectures />

      <p style={prose}>
        Set "Size dots by" to Params below and compare AlexNet's dot to
        LeNet-5's: AlexNet swells to nearly the largest dot on the timeline,
        since its 60M parameters are a thousand-fold jump from LeNet-5's
        60K — the scale-up that made ImageNet-era CNNs possible. (Switching
        to Layers makes EfficientNet-B7 balloon the same way, but hover its
        dot: the tooltip flags that its 813 counts Keras' low-level ops, not
        named architectural blocks like ResNet-50's 50, so that particular
        pairing isn't a fair depth comparison.)
      </p>

      <ArchitectureTimeline
        tryThis={{
          do: "Set 'Size dots by' to Params and compare AlexNet's dot to LeNet-5's.",
          notice: "AlexNet swells to nearly the largest dot on the timeline — its 60M parameters are a thousand-fold jump from LeNet-5's 60K, the scale-up that made ImageNet-era CNNs possible. (Layers sizing makes EfficientNet-B7 balloon the same way, but its 813 counts Keras' low-level ops rather than architectural blocks — not a fair comparison to ResNet-50's 50; hover the dot for the caveat.)",
        }}
      />

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
        minimum. He et al. (2016) [9] named this the{" "}
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
        (Chapter 10). Skip connections are now nearly universal: every transformer
        block uses them, every modern CNN uses them, U-Nets use them, even GANs
        and diffusion models use them. The 2016 ResNet paper was the moment
        "skip connection" became a permanent part of the deep learning
        vocabulary.
      </p>

      <MathBlock>{"$$y = F\\!\\bigl(x,\\, \\{W_i\\}\\bigr) + x \\qquad \\text{where}\\quad F(x) = W_2\\, \\sigma(W_1 x)$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"F(x, \\{W_i\\})"}</InlineMath> is the residual branch,
        computed by the block's own weights{" "}
        <InlineMath>{"W_1"}</InlineMath> and <InlineMath>{"W_2"}</InlineMath>{" "}
        with nonlinearity <InlineMath>{"\\sigma"}</InlineMath> between them,
        and <InlineMath>{"x"}</InlineMath> passes through unchanged via the
        shortcut, so <InlineMath>{"y"}</InlineMath> is their sum.
      </p>

      <ResidualBlock />

      <p style={prose}>
        Set N to 10 below and click Animate Backprop; watch the plain
        network's gradient signal shrink to roughly 1% of its original
        magnitude by the time it reaches the input, while the residual path
        holds essentially constant at 1.0 — about a 74× difference at this
        depth.
      </p>

      <SkipConnection
        tryThis={{
          do: "Set N to 10 and click Animate Backprop.",
          notice: "The plain network's gradient shrinks to roughly 1% of its original magnitude by the input, while the residual path holds at ≈1.0 — about a 74× difference at N=10.",
        }}
      />

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
        2017's Xception [13], popularized in Howard et al. 2017's MobileNet [14]) factors
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
        spatial-resolution loss: to see further, standard convolution
        typically downsamples (pooling or strided convolution), which throws
        away resolution that semantic segmentation needs back. Dilated
        convolution (Yu & Koltun 2016) [15]
        breaks this trade-off. By inserting gaps of size{" "}
        <InlineMath>{"d-1"}</InlineMath> between the sampled pixels of a{" "}
        <InlineMath>{"k \\times k"}</InlineMath> filter, the receptive field
        grows to <InlineMath>{"(d(k-1) + 1)^2"}</InlineMath> with the{" "}
        <em>same</em> number of parameters and <em>no</em> resolution loss.
        Stacking layers with exponentially increasing dilation{" "}
        <InlineMath>{"(1, 2, 4, 8, 16, \\ldots)"}</InlineMath> produces
        exponential receptive-field growth in linear depth — the trick behind
        DeepLab's semantic-segmentation networks (Chen et al. 2015 [16]) and
        WaveNet's audio generation (van den Oord et al. 2016 [17]), where
        dilated 1D convolutions reach across thousands of audio samples
        without explicit recurrence.
      </p>

      <p style={prose}>
        Set kernel to 3×3 below and push dilation from d=1 to d=8; the
        effective receptive field grows from 3×3 to 17×17 while the sampled-pixel
        count stays fixed at 9, and the coverage ratio (sampled ÷ RF area)
        collapses from 100% to about 3%.
      </p>

      <DilatedConvolution
        tryThis={{
          do: "Set kernel to 3×3 and push dilation from d=1 to d=8.",
          notice: "The effective receptive field grows from 3×3 to 17×17 while sampled pixels stay fixed at 9 — the coverage ratio drops from 100% to about 3%.",
        }}
      />

      {/* ── Section 6: Going Deeper — Capsule Networks (historical detour) ── */}
      <div id="capsule-networks-detour">
        <SectionTitle>Going Deeper: Capsule Networks — a Historical Detour</SectionTitle>
      </div>

      <p style={prose}>
        Every architecture in this chapter leans on max pooling (or a strided
        convolution standing in for it) to build translation invariance — the
        same answer regardless of exactly where a feature sits. Around 2017,
        Hinton and collaborators argued this throws away exactly the
        information a vision system needs: a face detector that answers
        identically whether the eyes, nose, and mouth sit in the right places
        or are scrambled into nonsense has lost the one thing that matters.
        Capsule networks were their proposed fix — the architecture itself
        never scaled past research-scale image classification, but the
        diagnosis it offers, <em>invariance versus equivariance</em>, outlived
        it. Equivariance means the output transforms predictably with the
        input instead of staying fixed: a capsule replaces a scalar
        activation with a vector whose length is a detection probability and
        whose direction encodes the entity's pose, so rotating the input
        rotates the vector too — something a CNN's pooled scalar cannot
        represent at all.
      </p>

      <InvarianceVsEquivariance />

      <p style={prose}>
        Making "vector length as probability" precise means squashing an
        arbitrary vector to a length strictly below 1 while leaving its
        direction — the pose estimate — untouched:
      </p>

      <MathBlock>{"$$\\text{squash}(v) = \\frac{\\|v\\|^2}{1 + \\|v\\|^2} \\cdot \\frac{v}{\\|v\\|}$$"}</MathBlock>

      <p style={prose}>
        The widget below runs a pooling head and a two-capsule routing head
        over the same drawn face, valid and scrambled. Animating it, the
        CNN's pooled score barely moves (0.91 → 0.89) while the Face
        capsule's length collapses from 0.81 to 0.07 once the parts are
        scrambled.
      </p>

      <CnnVsCapsnet
        tryThis={{
          do: "Hit Animate Routing and compare the two rows as it plays through.",
          notice: "The CNN's pooled score barely moves (0.91 → 0.89) — same parts, same verdict, scrambled or not. The Face capsule's length collapses from 0.81 to 0.07 because Eyes/Nose/Mouth's pose predictions stop agreeing once the parts are scrambled.",
        }}
      />

      <p style={prose}>
        The mechanism behind a capsule's output vector is{" "}
        <em>dynamic routing by agreement</em>: each lower capsule casts a
        vote for a higher capsule's output, and routing iteratively upweights
        votes that agree with each other while downweighting outliers — the
        opposite of pooling's fixed, hand-designed aggregation.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  s_j &= \\sum_i c_{ij}\\, \\hat{u}_{j|i} \\\\
  v_j &= \\text{squash}(s_j) \\\\
  b_{ij} &\\leftarrow b_{ij} + \\hat{u}_{j|i} \\cdot v_j \\\\
  c_{ij} &= \\text{softmax}(b_{ij})
\\end{aligned}$$`}</MathBlock>

      <RoutingByAgreement />

      <p style={prose}>
        The widget below runs this update rule for real on three lower
        capsules voting for two upper ones — nothing here is scripted. Step
        through iterations 0 → 3 (or hit Animate) and watch the couplings
        shift as agreeing votes pull together.
      </p>

      <DynamicRouting
        tryThis={{
          do: "Step through routing iterations 0 → 3 (or hit Animate).",
          notice: "L1 and L2's votes for U1 point in nearly the same direction, so their coupling to U1 climbs each round; L3's vote for U1 disagrees, so its coupling drifts to U2 instead — the couplings emerge from the vote geometry, nothing here is scripted.",
        }}
      />

      <p style={prose}>
        Capsule networks made a major NeurIPS splash (Sabour et al. 2017 [18])
        and a matrix-capsules/EM-routing follow-up (Hinton et al. 2018 [19])
        that improved 3D-pose results on smallNORB, but the architecture
        never reached ImageNet scale: routing iterations are inherently
        sequential, breaking the GPU parallelism training depends on, and its
        extra moving parts — routing iterations, capsule dimensions,
        primary-capsule design — made results notoriously hard to reproduce.
        By 2018 the same routing-by-agreement intuition was being captured
        more flexibly, and at far greater scale, by the attention mechanism
        inside transformers (Chapter 9) — a learned alignment between every
        pair of tokens rather than a hand-designed routing between fixed
        capsule layers. The vector-per-entity idea itself predates the 2017
        paper by six years (Hinton et al. 2011 [20] already grouped neurons
        into "capsules" jointly encoding existence and pose), and Hinton
        later folded some of its insights into GLOM (Hinton 2021 [21]), a
        transformer-shaped architecture. Capsule networks now occupy a
        familiar textbook role: a diagnosis that turned out right, wired to
        a mechanism that turned out to be the wrong one to bet compute on —
        the wider research wave is surveyed by Patrick et al. (2022) [22].
      </p>

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        Convolution's core idea — a small, weight-shared filter applied
        everywhere — recurs throughout the rest of this book in different
        clothing: attention (Chapter 9) replaces the fixed spatial window with
        a learned, content-based one, and the residual connections introduced
        here to fix the degradation problem are now the default skip-connection
        pattern inside every transformer block. The invariance-versus-equivariance
        tension that sank capsule networks resurfaces whenever a later
        architecture has to decide what structure to bake in versus what to
        let the model learn for itself, and depth still buys representational
        hierarchy — edges to textures to parts to objects — regardless of
        whether the layers doing the stacking are convolutional or
        attention-based. Chapter 7 turns from images to text, starting with
        how words become vectors in the first place.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
