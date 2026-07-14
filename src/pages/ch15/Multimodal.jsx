import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import ContrastiveLearning from "../../components/widgets/ch15/ContrastiveLearning";
import EmbeddingSpace from "../../components/widgets/ch15/EmbeddingSpace";
import VitPatches from "../../components/widgets/ch15/VitPatches";
import CrossModalRetrieval from "../../components/widgets/ch15/CrossModalRetrieval";
import CLIPContrastiveMatrix from "../../components/diagrams/ch15/CLIPContrastiveMatrix";
import ModalityGap from "../../components/diagrams/ch15/ModalityGap";
import ViTPatchPipeline from "../../components/diagrams/ch15/ViTPatchPipeline";
import ZeroShotClassification from "../../components/diagrams/ch15/ZeroShotClassification";
import WhisperVsCLAP from "../../components/diagrams/ch15/WhisperVsCLAP";
import { buildCitations } from "../../data/citations";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

// Numbered by true first-appearance order in the prose below (not topical
// grouping) — matches the inline [N] markers one-to-one. Papers cited only
// in this chapter (SigLIP, LLaVA, BLIP-2, Chameleon, Fuyu, MusicGen) are
// inline objects here rather than shared data/citations.js entries, per
// that file's own single-chapter convention.
const CITATIONS = buildCitations([
  "clip",
  "simclr",
  {
    title: "Sigmoid Loss for Language Image Pre-Training (SigLIP)",
    authors: "Zhai, Mustafa, Kolesnikov, Beyer",
    venue: "ICCV",
    year: "2023",
    tag: "paper",
  },
  "flamingo",
  {
    title: "Visual Instruction Tuning (LLaVA)",
    authors: "Liu, Li, Wu, Lee",
    venue: "NeurIPS",
    year: "2023",
    tag: "paper",
  },
  {
    title: "BLIP-2: Bootstrapping Language-Image Pre-training with Frozen Image Encoders and Large Language Models",
    authors: "Li, Li, Savarese, Hoi",
    venue: "ICML",
    year: "2023",
    tag: "paper",
  },
  "mind-the-gap",
  "vit",
  {
    title: "Chameleon: Mixed-Modal Early-Fusion Foundation Models",
    authors: "Chameleon Team",
    venue: "arXiv",
    year: "2024",
    tag: "paper",
  },
  {
    title: "Fuyu-8B: A Multimodal Architecture for AI Agents",
    authors: "Bavishi, Elsen, Hawthorne, Nye, Odena, Somani, Taşırlar",
    venue: "Adept AI (blog)",
    year: "2023",
    tag: "paper",
  },
  "whisper",
  "vall-e",
  "soundstream",
  "encodec",
  "audiolm",
  {
    title: "Simple and Controllable Music Generation (MusicGen)",
    authors: "Copet, Kreuk, Gat, Remez, Kant, Synnaeve, Adi, Défossez",
    venue: "NeurIPS",
    year: "2023",
    tag: "paper",
  },
  "clap",
  "laion-clap",
]);

const TOC_SECTIONS = [
  { id: "contrastive-learning",  label: "Contrastive Learning" },
  { id: "embedding-space",       label: "Embedding Space" },
  { id: "vision-transformers",   label: "Vision Transformers" },
  { id: "cross-modal-retrieval", label: "Cross-Modal Retrieval" },
  { id: "audio-modality",        label: "Audio as a Modality" },
];

export default function Multimodal() {
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
        Chapter 15 · Part III — Large Language Models
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
        Multimodal Networks
      </h1>

      <ChapterLede>
        A model that can only read text cannot describe an image. A model that can
        only see cannot answer questions about what it sees. Multimodal networks
        learn shared representations that bridge modalities — aligning images and text
        in a common embedding space so that similarity in one modality corresponds to
        similarity in the other. The result is zero-shot transfer: a model trained
        on image-text pairs can retrieve images from text queries it has never
        explicitly been trained on.
      </ChapterLede>

      {/* ── Section 1: Contrastive Learning & CLIP ───────────────────────── */}
      <div id="contrastive-learning">
        <SectionTitle>Contrastive Learning &amp; CLIP</SectionTitle>
      </div>

      <p style={prose}>
        CLIP trains a vision encoder and a text encoder jointly on 400 million
        image-text pairs from the internet. The contrastive loss pulls matching
        image-text pairs together in embedding space and pushes non-matching pairs
        apart. After training, the cosine similarity between an image embedding and
        a text embedding is a direct measure of semantic alignment — no task-specific
        fine-tuning required. Zero-shot classification follows naturally: embed the
        image and all candidate class descriptions, return the most similar.
      </p>

      <p style={prose}>
        CLIP (Radford et al. 2021) [1] pairs a vision encoder (ViT — Vision
        Transformer, covered in Section 3 — or ResNet)
        with a text transformer of comparable size, both trained from scratch on
        400M image-text pairs scraped from the open web ("WebImageText" / WIT). At
        each training step, a batch of <InlineMath>{"N"}</InlineMath> image-text
        pairs is encoded into two batches of <InlineMath>{"N"}</InlineMath>{" "}
        embeddings. The loss is <em>symmetric InfoNCE</em>: for each image, treat
        its matched caption as the positive and the other{" "}
        <InlineMath>{"N-1"}</InlineMath> captions as negatives; do the same with
        images as the negatives for each caption; average the two cross-entropies.
        The full batch becomes <InlineMath>{"N"}</InlineMath> positives and{" "}
        <InlineMath>{"N(N-1)"}</InlineMath> implicit negatives — a free-data
        scaling regime, since every other example in the batch is a negative
        without additional annotation. The same InfoNCE framing was already
        established in self-supervised vision by SimCLR (Chen et al. 2020) [2],
        which applied contrastive learning to image-image pairs (augmentations of
        the same image as positives); CLIP's contribution was wiring it across
        modalities.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\mathcal{L}_{i2t} &= -\\frac{1}{N} \\sum_{i=1}^{N} \\log \\frac{\\exp\\!\\bigl(\\text{sim}(v_i, t_i)/\\tau\\bigr)}{\\sum_{j=1}^{N} \\exp\\!\\bigl(\\text{sim}(v_i, t_j)/\\tau\\bigr)} \\\\
  \\mathcal{L}_{t2i} &= -\\frac{1}{N} \\sum_{i=1}^{N} \\log \\frac{\\exp\\!\\bigl(\\text{sim}(v_i, t_i)/\\tau\\bigr)}{\\sum_{j=1}^{N} \\exp\\!\\bigl(\\text{sim}(v_j, t_i)/\\tau\\bigr)} \\\\
  \\mathcal{L} &= \\tfrac{1}{2}\\bigl(\\mathcal{L}_{i2t} + \\mathcal{L}_{t2i}\\bigr)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\tau"}</InlineMath> plays the same sharpening role as the
        sampling temperature <InlineMath>{"T"}</InlineMath> introduced in Chapter 14 — dividing similarities before
        a softmax controls how peaked the distribution is — but here it is a
        learned parameter optimized alongside the encoders, conventionally
        written <InlineMath>{"\\tau"}</InlineMath> rather than <InlineMath>{"T"}</InlineMath> to mark that difference.
      </p>

      <CLIPContrastiveMatrix />

      <p style={prose}>
        The most consequential downstream application of CLIP wasn't classification
        or retrieval — it was conditioning for text-to-image generation. Stable
        Diffusion and DALL-E 2 use a CLIP or OpenCLIP text encoder as the
        conditioning signal for a diffusion U-Net, since its embeddings are already
        anchored to a shared image-text space. But Google's Imagen conditions on
        T5-XXL instead — a pure text-to-text encoder trained by{" "}
        <em>span-corruption denoising</em> (predicting masked-out spans of text),
        with no image supervision and no cross-modal training at all — and generates
        images just as well. That's evidence against the necessity claim: text-to-image
        conditioning needs an encoder that captures rich language semantics, not one
        that is cross-modally aligned; contrastive alignment is one route to that,
        not a requirement. Stability's SD3 makes a related but different point:
        rather than replacing CLIP with T5-XXL, it concatenates three text
        encoders — CLIP ViT-L/14, OpenCLIP ViT-bigG/14, and T5-XXL — and feeds
        the diffusion transformer all three at once, showing that a
        contrastively-aligned encoder and a pure text-to-text encoder aren't
        mutually exclusive choices; a model can combine both kinds of
        conditioning signal rather than pick one. CLIP itself has been largely superseded by larger and
        better-trained variants — SigLIP, EVA-CLIP, and the text encoders inside
        modern VLMs — but the contrastive-alignment recipe it established remains
        the default choice for cross-modal conditioning even where it isn't strictly
        necessary.
      </p>

      <p style={prose}>
        SigLIP (Zhai et al. 2023) [3] swaps CLIP's softmax InfoNCE loss for an
        independent sigmoid loss, and the difference is about batch-size
        economics as much as accuracy.
        CLIP's softmax normalizes every row and column of the similarity matrix
        over the full batch of <InlineMath>{"N"}</InlineMath> negatives, which
        couples each pair's loss to the entire batch and forces expensive
        cross-device all-gather of embeddings to make big batches (tens of
        thousands of pairs) informative enough. SigLIP instead scores each
        (image, text) pair independently as a binary match/non-match problem —
        pushing matched pairs toward 1 and unmatched pairs toward 0 — with no
        batch-wide normalizing constant at all.
      </p>

      <MathBlock>{`$$\\mathcal{L}_{ij} = \\begin{cases}
  -\\log \\sigma\\!\\bigl(s \\cdot \\text{sim}(v_i, t_j) + b\\bigr) & \\text{matched pair} \\\\
  -\\log\\!\\bigl(1 - \\sigma(s \\cdot \\text{sim}(v_i, t_j) + b)\\bigr) & \\text{non-matched pair}
\\end{cases}$$`}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\sigma"}</InlineMath> is the logistic sigmoid, and{" "}
        <InlineMath>{"s"}</InlineMath> and <InlineMath>{"b"}</InlineMath> are
        learned scale and bias terms (the SigLIP paper itself calls the scale
        term <InlineMath>{"t"}</InlineMath>, but this chapter reserves{" "}
        <InlineMath>{"t"}</InlineMath> for a text/caption embedding
        elsewhere, so it's renamed <InlineMath>{"s"}</InlineMath> here to
        avoid the collision); because every pair contributes its own
        independent term instead of competing inside one softmax row, the loss no
        longer depends on batch size, which is what lets SigLIP train efficiently
        at far smaller per-device batches than CLIP needs.
      </p>

      <p style={prose}>
        Contrastive models like CLIP can <em>score</em> image-text compatibility
        but cannot <em>generate</em> text grounded in an image — turning a vision
        encoder into part of a captioning or chat system means fusing it with a
        language model, and three architecturally distinct patterns have emerged
        for doing that fusion.
      </p>

      <p style={prose}>
        Cross-attention fusion, introduced by Flamingo (Alayrac et al. 2022) [4],
        keeps a frozen pretrained language model intact and inserts new gated
        cross-attention layers between its existing blocks; visual features stay
        a separate sequence that the language model looks up rather than reads as
        part of its own input. Prefix/projection fusion, the approach LLaVA
        (Liu et al. 2023) [5] popularized, is the simplest of the three: a linear
        or two-layer MLP maps
        each ViT patch embedding straight into the LLM's embedding space, and the
        projected patches are concatenated as extra input tokens the LLM treats
        exactly like text — cheap and direct, but the token count scales with
        image resolution, so a high-resolution image can consume most of the
        context window. Resampler fusion, used by the Q-Former in BLIP-2
        (Li et al. 2023) [6] and by
        Flamingo's own Perceiver Resampler stage upstream of its cross-attention
        layers, trains a small fixed set of learned query tokens to cross-attend
        to a large, variable-length pool of vision features and compress them
        into a fixed token budget regardless of image size — a lossy bottleneck
        that decouples compute and context cost from resolution. GPT-4V, Claude's
        multimodal models, and Gemini haven't published their exact fusion
        mechanism, but all extend one of these three patterns rather than
        inventing a fourth.
      </p>

      <p style={prose}>
        Not every cross-modal model follows CLIP's contrastive-encoder recipe,
        though. The next modality this chapter takes up, audio, is dominated by a
        different pattern entirely — a sequence-to-sequence model that
        transcribes rather than aligns — with genuine contrastive alignment
        appearing as a separate, purpose-built variant rather than the default.
        Once a modality can be turned into tokens or embeddings a
        transformer can consume, virtually any text-conditioned task becomes
        reachable — but which recipe applies is not automatic, as the next
        section works out in detail.
      </p>

      <p style={prose}>
        Press Train step repeatedly (or hit Play) below and watch each
        image-text pair's dot and diamond pull together; notice the contrastive
        loss fall in the stats panel as average matching similarity climbs and
        separates from average non-matching similarity.
      </p>

      <ContrastiveLearning
        tryThis={{
          do: "Press Train step repeatedly (or Play) to advance training, then drag the temperature slider τ.",
          notice: "The contrastive loss falls as average matching similarity climbs while average non-matching similarity stays low — a lower τ sharpens how hard the loss penalizes any residual gap between the two.",
        }}
      />

      {/* ── Section 2: The Joint Embedding Space ─────────────────────────── */}
      <div id="embedding-space">
        <SectionTitle>The Joint Embedding Space</SectionTitle>
      </div>

      <p style={prose}>
        A well-trained multimodal embedding space has a structure that mirrors
        conceptual relationships across modalities. The vector from a dog image
        embedding to a cat image embedding approximates the vector from the text
        embedding of "dog" to "cat". This algebraic structure enables cross-modal
        arithmetic and explains why nearest-neighbor search retrieves semantically
        meaningful results across modalities rather than just superficially similar ones.
      </p>

      <p style={prose}>
        A common simplification of multimodal learning says the model maps images
        and text into the <em>same</em> space. The geometric truth is more
        nuanced: image and text encoders produce vectors in the same{" "}
        <InlineMath>{"\\mathbb{R}^d"}</InlineMath> by construction (a final linear
        projection brings them to a common dimensionality), and contrastive
        training pulls matched pairs close. But image embeddings and text
        embeddings remain distinguishable as point clouds — they occupy different
        regions of the joint space, even after training. The "shared" space is
        shared at the <em>relational</em> level: distances between related
        concepts are aligned, not the absolute positions of individual embeddings.
      </p>

      <p style={prose}>
        This phenomenon was surfaced sharply in "Mind the Gap" (Liang et al.
        2022) [7], which showed that despite contrastive training, CLIP's image
        embeddings and text embeddings cluster into two narrow cones separated by
        a substantial angle — the "modality gap." The gap exists at
        initialization (the two encoders start with random weights in different
        parts of the space) and contrastive training only partially closes it.
        Surprisingly, <em>closing</em> the gap by simple subtraction actually{" "}
        <em>hurts</em> downstream performance: the gap seems to encode useful
        information about which modality an embedding came from. Practical
        implication: cross-modal retrieval works well because relative distances
        are aligned within each cone-pair, but treating the joint space as a
        single isotropic space (e.g., applying PCA or k-means across modalities)
        can produce surprising failures.
      </p>

      <ModalityGap />

      <p style={prose}>
        The widget below makes this concrete with twelve concepts spanning three
        categories — animals, vehicles, and nature. Click any embedding to trace
        its three nearest neighbors with distance labels; notice that a concept's
        own cross-modal pair is consistently its closest neighbor, well inside
        the distance to any other concept, while whole categories still separate
        into their own regions of the space — the relational structure holds
        even though modality and category are two different axes of
        organization.
      </p>

      <EmbeddingSpace
        tryThis={{
          do: "Click any embedding to trace its three nearest neighbors with distance labels, then toggle Color by between category and modality.",
          notice: "Each concept's own cross-modal pair is consistently its nearest neighbor, and the panel's average within-category distance sits well below the average cross-category distance — the space organizes by meaning first.",
        }}
      />

      {/* ── Section 3: Vision Transformers ───────────────────────────────── */}
      <div id="vision-transformers">
        <SectionTitle>Vision Transformers</SectionTitle>
      </div>

      <p style={prose}>
        ViT adapts the transformer to images by dividing each image into fixed-size
        patches, flattening each patch into a vector, and linearly projecting them
        into token embeddings. A learnable [CLS] token is prepended; its final
        representation is used for classification. With sufficient training data,
        ViT matches or exceeds CNN performance while being more scalable — the same
        architecture, with the same training recipe, works for both text and images.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  z_0 &= [\\, x_{\\text{cls}};\\ x_p^1 E;\\ x_p^2 E;\\ \\ldots;\\ x_p^N E\\,] + E_{\\text{pos}} \\\\
  &\\text{where}\\ E \\in \\mathbb{R}^{(P^2 \\cdot C) \\times D},\\ N = HW/P^2
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        <InlineMath>{"z_0"}</InlineMath> is the sequence fed into the
        transformer: the learnable class token <InlineMath>{"x_{\\text{cls}}"}</InlineMath>,
        prepended to the <InlineMath>{"N"}</InlineMath> flattened patches{" "}
        <InlineMath>{"x_p^i"}</InlineMath> each right-multiplied by the shared
        projection matrix <InlineMath>{"E"}</InlineMath>, plus a learned
        positional embedding <InlineMath>{"E_{\\text{pos}}"}</InlineMath> added
        elementwise so patch order survives the flattening;{" "}
        <InlineMath>{"P"}</InlineMath> is the patch's side length in pixels,{" "}
        <InlineMath>{"C"}</InlineMath> the number of image channels, and{" "}
        <InlineMath>{"D"}</InlineMath> the token embedding dimension.
      </p>

      <ViTPatchPipeline />

      <p style={prose}>
        Before 2020, the assumption was that CNNs were the right tool for images
        because their architectural priors — translation equivariance, local
        receptive fields, hierarchical features — matched the structure of natural
        images. Transformers, by contrast, had no spatial inductive bias at all:
        an image is just a sequence of patches, treated as a permutation-invariant
        set until positional embeddings break the symmetry. The expectation was
        that ViT (Dosovitskiy et al. 2021) [8] would underperform CNNs at any
        reasonable scale. The empirical finding was the opposite, but with a
        caveat: ViT <em>underperforms</em> CNNs on ImageNet-scale datasets, and{" "}
        <em>matches or exceeds</em> them once pretrained on JFT-300M (300 million
        labeled images) or similar massive corpora. The lesson generalizes the
        bitter-lesson observation in vision: architectural inductive bias matters
        less than data scale.
      </p>

      <p style={prose}>
        The most consequential thing about ViT for the rest of this chapter is not
        its accuracy on ImageNet — it's that the transformer block from Chapter 10
        turned out to be modality-agnostic. Once a modality can be tokenized
        (images as patches, audio as spectrogram patches or waveform chunks, video
        as spatio-temporal patches), it can be fed into the same transformer
        stack the LLM uses. Every fusion pattern from the previous section —
        Flamingo's cross-attention, LLaVA's projector, BLIP-2's Q-Former — is
        still <em>late fusion</em>: a separately pretrained vision encoder and a
        separately pretrained LLM, bolted together afterward through an adapter
        or attention bridge. Early-fusion models skip the bolting-together step
        entirely. Chameleon (Chameleon Team, 2024) [9] tokenizes images into
        discrete codes with a VQ-style image tokenizer — vector quantization:
        an encoder's continuous output is snapped to the nearest entry in a
        learned codebook of discrete vectors, replacing it with that entry's
        index, the same mechanism Section 5 explains in detail for audio
        codecs — mixes those codes into the same
        vocabulary as text tokens, and trains one decoder-only transformer
        end-to-end on interleaved image/text sequences under a single
        next-token objective — including generating image tokens back out, not
        just consuming them. Fuyu (Bavishi et al. 2023) [10] goes further still: image
        patches are linearly projected straight into the decoder's input
        embedding space, with no separate pretrained vision tower at all. GPT-4o
        and Gemini are widely believed, though not publicly confirmed, to follow
        this early-fusion family — one transformer, one shared vocabulary, one
        training objective, ingesting tokens from any modality at any position
        instead of stitching modality-specific encoders together after the fact.
        ViT was the proof-of-concept that a plain transformer could consume a
        non-text modality at all; early fusion is what happens once that stops
        being a special case.
      </p>

      <p style={prose}>
        Click ▶ Animate tokenization below to watch the image sweep into the
        patch-token row underneath it, then drag the patch size selector between
        P=8 and P=64; notice how sequence length is fixed by (image size / patch
        size)², so a smaller patch trades a much longer, more expensive sequence
        for finer per-token spatial detail.
      </p>

      <VitPatches
        tryThis={{
          do: "Click Animate tokenization, then switch patch size between P=8 and P=64.",
          notice: "At P=16 a 256×256 image becomes a 257-token sequence (16² patches plus the CLS token); dropping to P=8 quadruples it to 1025 tokens, while P=64 shrinks it to just 17 — patch size trades sequence length for spatial resolution per token.",
        }}
      />

      {/* ── Section 4: Cross-Modal Retrieval ─────────────────────────────── */}
      <div id="cross-modal-retrieval">
        <SectionTitle>Cross-Modal Retrieval</SectionTitle>
      </div>

      <p style={prose}>
        Once images and text share an embedding space, retrieval is nearest-neighbor
        search. A text query is embedded as a vector; the k images with highest
        cosine similarity are returned. This works zero-shot — the model was never
        trained on a retrieval objective, only on contrastive alignment. The same
        mechanism powers image search engines, visual question answering systems,
        and multimodal chat interfaces that can discuss the contents of uploaded images.
      </p>

      <p style={prose}>
        CLIP's most famous demonstration was zero-shot ImageNet classification.
        The mechanic is exactly retrieval: take all 1000 class names from
        ImageNet, prepend a prompt template ("a photo of a {`{class}`}"), embed
        each via the text encoder, and embed the test image via the vision
        encoder. Return the class whose text embedding has highest cosine
        similarity to the image embedding. No fine-tuning, no labeled training
        data. CLIP achieved ~76% top-1 zero-shot accuracy on ImageNet —
        competitive with fully-supervised ResNet-50 trained on ImageNet's full
        1.3M labeled examples. The framing generalizes: any classification problem
        can be cast as text-image similarity if the classes can be articulated in
        natural language.
      </p>

      <ZeroShotClassification />

      <p style={prose}>
        That ~76% headline number is worth a caveat. CLIP's contrastive
        objective doesn't force word-order or attribute-binding sensitivity, so
        it behaves closer to a bag-of-words matcher than a compositional parser
        in some regimes: it often scores "a red cube on a blue sphere" and "a
        blue cube on a red sphere" as nearly equally similar to the same image —
        a compositionality failure that benchmarks built specifically to test
        attribute binding, like Winoground, are designed to surface. CLIP is
        also vulnerable to <em>typographic attacks</em>: pasting a printed word —
        "iPod," say — onto a photo of an unrelated object like an apple can flip
        the model's zero-shot prediction to the printed word's class, because the
        training data taught it to treat rendered text as strongly as visual
        content. Neither failure mode shows up in a single clean retrieval query;
        both matter once retrieval or classification runs at scale on inputs
        nobody curated.
      </p>

      <p style={prose}>
        A model that outputs a 512-dim embedding for each image produces, on a
        1M-image corpus, a 1M×512 matrix that would otherwise be scanned linearly
        per query (slow). Production systems index these embeddings with
        approximate-nearest-neighbor structures — FAISS, HNSW, ScaNN — that return
        top-<InlineMath>{"k"}</InlineMath> candidates in sub-millisecond time at
        the cost of small recall imperfection. Multimodal RAG systems (retrieving
        relevant images for a text query before passing both to a VLM) and image
        search engines (text → images) both rely on this. The same embeddings
        that make zero-shot classification work make retrieval work, because
        they're the same vectors in the same shared space.
      </p>

      <p style={prose}>
        Click through the four text queries below and watch the six results
        re-rank and re-color by similarity score; notice the top match's score
        and the top-3/bottom-3 separation update together in the stats panel —
        the same nearest-neighbor mechanism zero-shot classification just used,
        now returning ranked images instead of a single class label.
      </p>

      <CrossModalRetrieval
        tryThis={{
          do: "Click through the four queries, then drag the threshold slider up past 0.30.",
          notice: "Raising the threshold knocks out the bottom-ranked results (dimmed 'below threshold') while the top 3 stay clear of it — the separation stat in the panel is exactly that gap.",
        }}
      />

      {/* ── Section 5: Audio as a Modality ───────────────────────────────── */}
      <div id="audio-modality">
        <SectionTitle>Audio as a Modality</SectionTitle>
      </div>

      <p style={prose}>
        Audio doesn't tokenize the way images do. A ViT patch is a small, fixed
        grid of pixels — a natural unit. Raw audio is a one-dimensional waveform
        sampled 16,000 to 44,100 times per second; a ten-second clip is hundreds
        of thousands of numbers, far too long a sequence to feed a transformer
        directly. The standard fix converts the waveform into a{" "}
        <em>log-Mel spectrogram</em> — a 2D time-by-frequency image, computed with
        a short-time Fourier transform and a perceptually-weighted frequency
        scale — which can then be sliced into patches exactly like ViT slices an
        image, or passed through a small convolutional stem first. Once audio
        looks like a grid of numbers, every trick this chapter has built for
        vision becomes available again: encode it, and either generate from it
        (seq2seq) or align it with text (contrastive). Which one a given audio
        model does is not a detail — it determines what the model can and
        cannot be asked to do, and the two are easy to conflate.
      </p>

      <p style={prose}>
        Whisper (Radford et al. 2023) [11] is the model most readers will have
        encountered, and it is worth being precise about what it is: a standard
        encoder-decoder transformer, architecturally the same family as the
        original Vaswani et al. transformer from Chapter 10, not a dual-encoder
        contrastive model. A log-Mel spectrogram is fed through a transformer
        encoder; a transformer decoder then generates the transcript
        autoregressively, one token at a time, cross-attending to the encoder's
        output at every step — the same cross-attention mechanism Flamingo uses
        to let a language model attend over image features, just with audio
        features instead. Training is ordinary sequence-to-sequence
        cross-entropy: predict the next transcript token given the audio and the
        tokens generated so far. There is no contrastive loss, no pair of
        independently-pooled embeddings, and no cosine similarity anywhere in the
        pipeline — Whisper cannot score how well an audio clip matches an
        arbitrary caption, only generate the specific text it was trained to
        produce. The "large-scale weak supervision" in the paper's title refers
        to the training data, not the loss: 680,000 hours of audio paired with
        transcripts scraped from the internet, noisy and uncurated rather than
        hand-labeled, but each pair still supervises the decoder directly. The
        payoff of scale is a single multitask model — Whisper casts
        transcription, translation, language identification, and timestamping
        all as different token sequences the same decoder can produce, selected
        by special tokens in its vocabulary, the same "every task is text
        generation" trick T5 uses for language.
      </p>

      <p style={prose}>
        Text-to-speech runs the same transformation in reverse, and at the
        intuition level it splits into two generations of approach. Classical
        neural TTS (Tacotron-style pipelines) is itself seq2seq: an encoder
        reads phonemes or text tokens, a decoder autoregressively predicts a
        mel-spectrogram frame by frame, and a separate <em>vocoder</em> network
        (WaveNet, HiFi-GAN, and similar) converts that spectrogram into an
        audible waveform, since a spectrogram discards the phase information
        needed to reconstruct actual air-pressure samples. Newer systems (VALL-E
        (Wang et al. 2023) [12] and similar) instead treat TTS as language
        modeling over the discrete audio tokens described next: condition an
        autoregressive transformer on text, and have it predict a sequence of
        audio-codec tokens rather than a spectrogram, handing those tokens to a
        neural codec decoder for the final waveform. Either way, the shape of
        the problem is the same seq2seq shape as Whisper, just with the
        modalities swapped — text in, audio out, instead of audio in, text out.
      </p>

      <p style={prose}>
        That token-based route depends on being able to discretize audio in the
        first place, and the mechanism generalizes past speech to music and
        general sound. A neural audio codec — SoundStream (Zeghidour et al.
        2021) [13], EnCodec (Défossez et al. 2023) [14] — runs a short frame of
        waveform through a convolutional encoder to get a continuous vector,
        then snaps that vector to the nearest entry in a learned{" "}
        <em>codebook</em> — a fixed bank of <InlineMath>{"K"}</InlineMath>{" "}
        candidate vectors trained alongside the encoder.
      </p>

      <MathBlock>{"$$k^{*} = \\arg\\min_{k \\in \\{1,\\ldots,K\\}} \\lVert z - e_k \\rVert_2^2$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"z"}</InlineMath> is the encoder's continuous output for one
        frame; <InlineMath>{"e_k"}</InlineMath> is the{" "}
        <InlineMath>{"k"}</InlineMath>-th codeword; the frame is replaced by the
        single integer <InlineMath>{"k^{*}"}</InlineMath>, the index of its
        nearest codeword — the same nearest-neighbor snap VQ-VAE applies to
        image patches (Chapter 18 covers this quantization trick from the image
        side), now applied to audio frames. In practice one quantizer isn't
        precise enough, so codecs chain several: a first codebook quantizes{" "}
        <InlineMath>{"z"}</InlineMath>, a second codebook quantizes the leftover
        residual <InlineMath>{"z - e_{k^*}"}</InlineMath>, a third quantizes what
        that misses, and so on — <em>residual vector quantization</em> (RVQ) —
        so one audio frame becomes a short stack of token IDs instead of one.
        AudioLM (Borsos et al. 2023) [15] and MusicGen (Copet et al. 2023) [16]
        build on exactly this:
        once a waveform is a sequence of discrete tokens, generating audio is no
        different from generating text — train a decoder-only autoregressive
        transformer, the same architecture family from Chapter 11, to predict
        the next audio token given the previous ones (and, for MusicGen, given a
        text prompt as additional conditioning). AudioLM specifically cascades
        this in stages: coarse "semantic" tokens first, capturing long-range
        structure like melody or prosody, then finer RVQ "acoustic" tokens
        layered on top, capturing timbre and speaker identity —
        coarse-to-fine, but autoregressive token-by-token generation at every
        stage.
      </p>

      <p style={prose}>
        None of that is CLIP's recipe. The actual CLIP-for-audio analogy is CLAP
        — Contrastive Language-Audio Pretraining (Elizalde et al. 2023) [17],
        later scaled up as open-source LAION-CLAP by Wu et al. (2023) [18]. CLAP
        takes the symmetric InfoNCE loss from the very first section of this
        chapter and swaps in an audio encoder for the vision encoder: an audio
        clip and a natural-language caption ("a dog barking in the rain") are
        each encoded independently, pulled together in embedding space if
        they're a matched pair and pushed apart otherwise, with every other clip
        in the batch serving as a free negative — architecturally identical to
        CLIP, just one modality over. CLAP has no decoder and cannot generate
        anything; what it produces is a pair of embeddings whose cosine
        similarity measures semantic alignment, which is exactly enough for
        zero-shot audio classification and text-to-audio retrieval, the same two
        party tricks Section 1 demonstrated for images. This is the contrast
        worth keeping straight: CLAP can measure how well a library of sound
        clips matches the caption "footsteps on gravel" without generating a
        word; Whisper can transcribe speech with high accuracy but has no way to
        answer that question at all, because nothing in its training ever
        produced a pair of comparable embeddings.
      </p>

      <p style={prose}>
        The diagram below puts the two architectures side by side. It is worth
        pausing on directly, since conflating them is the single most common
        mistake made about audio-language models — an easy one to make, since
        both are "large audio model trained with weak supervision from the
        internet," and only one of them is contrastive.
      </p>

      <WhisperVsCLAP />

      <p style={prose}>
        The pattern that emerges is the same one this chapter has been building
        since Section 1, just with a second axis added: a modality can be{" "}
        <em>aligned</em> with text (contrastive, CLIP and CLAP) or{" "}
        <em>generated</em> conditioned on text or on itself (seq2seq or
        autoregressive, Whisper, TTS, and AudioLM), and a growing number of
        systems do both. Video, taken up in Chapter 20, mostly reuses the
        generation side of this pair — a clip becomes a sequence of
        spatio-temporal patches or codes, and the tokenize-then-generate recipe
        that made AudioLM possible runs again with one more axis of structure.
      </p>

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        What carries forward is a choice between two recipes, not a single
        algorithm: contrastive alignment (CLIP, SigLIP, CLAP) trains a pair of
        encoders to agree on embeddings without generating anything, while
        seq2seq or autoregressive generation (Whisper, TTS, AudioLM, VALL-E)
        conditions on one modality to produce another, token by token. Whichever
        recipe a system uses, the joint space it builds is not the single
        isotropic space it's tempting to assume — the modality gap means
        distances are aligned relationally, not embeddings colocated
        absolutely, and treating a multimodal embedding space as one uniform
        cloud is a reliable way to get surprised. Underneath both recipes sits
        the same enabling trick: tokenize a modality into a fixed-length
        sequence — ViT's patches for images, spectrogram patches or codec
        tokens for audio — and any transformer built for text can consume it
        with no architecture change. Chapter 16 leaves this modality-fusion
        problem behind for a structural one: graphs, where the thing to
        tokenize isn't a grid of patches but a set of nodes and the edges
        connecting them.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
