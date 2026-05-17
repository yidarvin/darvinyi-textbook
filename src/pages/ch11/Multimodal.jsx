import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import ContrastiveLearning from "../../components/widgets/ch11/ContrastiveLearning";
import EmbeddingSpace from "../../components/widgets/ch11/EmbeddingSpace";
import VitPatches from "../../components/widgets/ch11/VitPatches";
import CrossModalRetrieval from "../../components/widgets/ch11/CrossModalRetrieval";
import CLIPContrastiveMatrix from "../../components/diagrams/ch11/CLIPContrastiveMatrix";
import ModalityGap from "../../components/diagrams/ch11/ModalityGap";
import ViTPatchPipeline from "../../components/diagrams/ch11/ViTPatchPipeline";
import ZeroShotClassification from "../../components/diagrams/ch11/ZeroShotClassification";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: "[1]", title: "Learning Transferable Visual Models From Natural Language Supervision (CLIP)", authors: "Radford, Kim, Hallacy, Ramesh, Goh, Agarwal, Sastry, Askell, Mishkin, Clark, Krueger, Sutskever", venue: "ICML", year: "2021", tag: "seminal" },
  { num: "[2]", title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale (ViT)", authors: "Dosovitskiy, Beyer, Kolesnikov, Weissenborn, Zhai, Unterthiner, Dehghani, Minderer, Heigold, Gelly, Uszkoreit, Houlsby", venue: "ICLR", year: "2021", tag: "seminal" },
  { num: "[3]", title: "Flamingo: a Visual Language Model for Few-Shot Learning", authors: "Alayrac, Donahue, Luc, Miech, Barr, Hasson, Lenc, Mensch, Millican, Reynolds, Ring, Rutherford, Cabi, Han, Gong, Samangooei, Monteiro, Menick, Borgeaud, Brock, Nematzadeh, Sharifzadeh, Binkowski, Barreira, Vinyals, Zisserman, Simonyan", venue: "NeurIPS", year: "2022", tag: "paper" },
  { num: "[4]", title: "A Simple Framework for Contrastive Learning of Visual Representations (SimCLR)", authors: "Chen, Kornblith, Norouzi, Hinton", venue: "ICML", year: "2020", tag: "paper" },
  { num: "[5]", title: "Robust Speech Recognition via Large-Scale Weak Supervision (Whisper)", authors: "Radford, Kim, Xu, Brockman, McLeavey, Sutskever", venue: "ICML", year: "2023", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "contrastive-learning",  label: "Contrastive Learning" },
  { id: "embedding-space",       label: "Embedding Space" },
  { id: "vision-transformers",   label: "Vision Transformers" },
  { id: "cross-modal-retrieval", label: "Cross-Modal Retrieval" },
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
        Chapter 11 · Part III — Large Language Models
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
        CLIP <span style={{ color: "var(--accent)", opacity: 0.85 }}>[1]</span>{" "}
        (Radford, Kim, Hallacy et al. 2021) pairs a vision encoder (ViT or ResNet)
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
        established in self-supervised vision by SimCLR{" "}
        <span style={{ color: "var(--accent)", opacity: 0.85 }}>[4]</span> (Chen,
        Kornblith, Norouzi &amp; Hinton 2020), which applied contrastive learning
        to image-image pairs (augmentations of the same image as positives);
        CLIP's contribution was wiring it across modalities.
      </p>

      <MathBlock>{"$$\\mathcal{L} = -\\frac{1}{N} \\sum_{i=1}^{N} \\log \\frac{\\exp\\!\\bigl(\\text{sim}(v_i, t_i)/\\tau\\bigr)}{\\sum_{j=1}^{N} \\exp\\!\\bigl(\\text{sim}(v_i, t_j)/\\tau\\bigr)}$$"}</MathBlock>

      <CLIPContrastiveMatrix />

      <p style={prose}>
        The most consequential downstream application of CLIP wasn't classification
        or retrieval — it was conditioning for text-to-image generation. Stable
        Diffusion, DALL-E 2, and most open-source image generators use a CLIP text
        encoder (or a derivative like OpenCLIP, T5-XXL in newer systems) as the
        conditioning signal for a diffusion U-Net. Without a text encoder that
        produces conceptually-aligned embeddings, "a corgi in a spacesuit" would
        have no path to becoming pixels. CLIP itself has been largely superseded by
        larger and better-trained variants — SigLIP (sigmoid loss instead of
        softmax, better at scale), EVA-CLIP, and the text encoders inside modern
        VLMs — but the contrastive-alignment recipe it established remains the
        default for almost every cross-modal model.
      </p>

      <p style={prose}>
        Contrastive models like CLIP can <em>score</em> image-text compatibility
        but cannot <em>generate</em> text grounded in an image. Flamingo (Alayrac
        et al. 2022){" "}
        <span style={{ color: "var(--accent)", opacity: 0.85 }}>[3]</span> was an
        early step beyond: a frozen CLIP-style vision encoder feeding visual
        features into a frozen language model via lightweight cross-attention
        adapters, trained to caption and answer questions about images. Modern
        vision-language models — GPT-4V, Claude 3+ multimodal, Gemini, LLaVA,
        BLIP-2 — extend this pattern, generally with the vision encoder producing
        patch tokens that are projected into the LLM's residual stream as if they
        were extra input tokens. The same contrastive-alignment idea has been
        ported to audio: Whisper (Radford, Kim, Xu, Brockman, McLeavey &amp;
        Sutskever 2023){" "}
        <span style={{ color: "var(--accent)", opacity: 0.85 }}>[5]</span> aligned
        speech with text via large-scale weakly-supervised training, producing
        zero-shot transcription across 99 languages. Once you have an encoder that
        maps a modality into a shared space with text, virtually any
        text-conditioned task generalizes.
      </p>

      <ContrastiveLearning />

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
        This phenomenon was surfaced sharply in "Mind the Gap" (Liang, Zhang, Cui,
        Lin &amp; Zou 2022), which showed that despite contrastive training,
        CLIP's image embeddings and text embeddings cluster into two narrow cones
        separated by a substantial angle — the "modality gap." The gap exists at
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

      <EmbeddingSpace />

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

      <ViTPatchPipeline />

      <p style={prose}>
        Before 2020, the assumption was that CNNs were the right tool for images
        because their architectural priors — translation equivariance, local
        receptive fields, hierarchical features — matched the structure of natural
        images. Transformers, by contrast, had no spatial inductive bias at all:
        an image is just a sequence of patches, treated as a permutation-invariant
        set until positional embeddings break the symmetry. The expectation was
        that ViT (Dosovitskiy, Beyer, Kolesnikov et al. 2021){" "}
        <span style={{ color: "var(--accent)", opacity: 0.85 }}>[2]</span> would
        underperform CNNs at any reasonable scale. The empirical finding was the
        opposite, but with a caveat: ViT <em>underperforms</em> CNNs on
        ImageNet-scale datasets, and <em>matches or exceeds</em> them once
        pretrained on JFT-300M (300 million labeled images) or similar massive
        corpora. The lesson generalizes the bitter-lesson observation in vision:
        architectural inductive bias matters less than data scale.
      </p>

      <p style={prose}>
        The most consequential thing about ViT for the rest of this chapter is not
        its accuracy on ImageNet — it's that the transformer block from Chapter 8
        turned out to be modality-agnostic. Once you can tokenize a modality
        (images as patches, audio as spectrogram patches or waveform chunks, video
        as spatio-temporal patches), you can feed it into the same transformer
        stack the LLM uses. This is what made native multimodal models like GPT-4o
        and Gemini possible: instead of late-fusing modality-specific encoders,
        the architecture can ingest tokens from any modality at any position. ViT
        was the proof-of-concept that this would work.
      </p>

      <VitPatches />

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
        can be cast as text-image similarity if you can articulate the classes in
        natural language.
      </p>

      <ZeroShotClassification />

      <p style={prose}>
        A model that outputs a 512-dim embedding for each image gives you, on a
        1M-image corpus, a 1M×512 matrix that you'd otherwise scan linearly per
        query (slow). Production systems index these embeddings with
        approximate-nearest-neighbor structures — FAISS, HNSW, ScaNN — that return
        top-<InlineMath>{"k"}</InlineMath> candidates in sub-millisecond time at
        the cost of small recall imperfection. Multimodal RAG systems (retrieving
        relevant images for a text query before passing both to a VLM) and image
        search engines (text → images) both rely on this. The same embeddings
        that make zero-shot classification work make retrieval work, because
        they're the same vectors in the same shared space.
      </p>

      <CrossModalRetrieval />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
