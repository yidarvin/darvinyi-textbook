import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import ContrastiveLearning from "../../components/widgets/ch09/ContrastiveLearning";
import EmbeddingSpace from "../../components/widgets/ch09/EmbeddingSpace";
import VitPatches from "../../components/widgets/ch09/VitPatches";
import CrossModalRetrieval from "../../components/widgets/ch09/CrossModalRetrieval";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
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
        Chapter 09 · Part II — Architectures
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

      <MathBlock>{`L = -1/N * sum_i [ log( exp(sim(vi, ti)/tau) / sum_j exp(sim(vi, tj)/tau) ) ]`}</MathBlock>

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

      <MathBlock>{`x = [x_cls; x^1_p E; x^2_p E; ...; x^N_p E] + E_pos
where E in R^(P^2*C x D), N = HW/P^2`}</MathBlock>

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

      <CrossModalRetrieval />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
