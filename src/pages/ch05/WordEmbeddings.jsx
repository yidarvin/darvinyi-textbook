import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import OneHotVsEmbedding from "../../components/widgets/ch05/OneHotVsEmbedding";
import SkipGram from "../../components/widgets/ch05/SkipGram";
import SemanticArithmetic from "../../components/widgets/ch05/SemanticArithmetic";
import GloVeFastText from "../../components/widgets/ch05/GloVeFastText";
import ContextualEmbeddings from "../../components/widgets/ch05/ContextualEmbeddings";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Efficient Estimation of Word Representations in Vector Space (Word2Vec)", authors: "Mikolov, Chen, Corrado, Dean", venue: "ICLR", year: "2013", tag: "seminal" },
  { num: "[2]", title: "Distributed Representations of Words and Phrases and their Compositionality (Negative Sampling)", authors: "Mikolov, Sutskever, Chen, Corrado, Dean", venue: "NeurIPS", year: "2013", tag: "seminal" },
  { num: "[3]", title: "GloVe: Global Vectors for Word Representation", authors: "Pennington, Socher, Manning", venue: "EMNLP", year: "2014", tag: "seminal" },
  { num: "[4]", title: "Enriching Word Vectors with Subword Information (fastText)", authors: "Bojanowski, Grave, Joulin, Mikolov", venue: "TACL", year: "2017", tag: "paper" },
  { num: "[5]", title: "Deep contextualized word representations (ELMo)", authors: "Peters, Neumann, Iyyer, Gardner, Clark, Lee, Zettlemoyer", venue: "NAACL", year: "2018", tag: "seminal" },
  { num: "[6]", title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", authors: "Devlin, Chang, Lee, Toutanova", venue: "NAACL", year: "2019", tag: "seminal" },
  { num: "[7]", title: "Linguistic Regularities in Continuous Space Word Representations", authors: "Mikolov, Yih, Zweig", venue: "NAACL", year: "2013", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "from-tokens-to-vectors", label: "Tokens to Vectors" },
  { id: "word2vec-skip-gram",     label: "Word2Vec" },
  { id: "semantic-arithmetic",    label: "Semantic Arithmetic" },
  { id: "glove-and-fasttext",     label: "GloVe & fastText" },
  { id: "contextual-embeddings",  label: "Contextual Embeddings" },
];

export default function WordEmbeddings() {
  useTocSections(TOC_SECTIONS);

  return (
    <article style={{ maxWidth: "740px", margin: "0 auto", padding: "52px 44px 100px" }}>

      {/* ── Chapter header ─────────────────────────────────────────────────── */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10.5px",
        fontWeight: 400,
        letterSpacing: "0.1em",
        color: "var(--accent)",
        opacity: 0.7,
        textTransform: "uppercase",
        marginBottom: "12px",
      }}>
        Chapter 05 · Part I — Foundations
      </div>

      <h1 style={{
        fontFamily: "'Crimson Pro', serif",
        fontSize: "42px",
        fontWeight: 600,
        color: "var(--text)",
        margin: "0 0 0",
        lineHeight: 1.15,
      }}>
        Word Embeddings
      </h1>

      <ChapterLede>
        Computers operate on numbers. Language consists of tokens — words, subwords,
        punctuation — that carry meaning but have no inherent numeric form. Word
        embeddings solve this mismatch by learning dense vector representations of
        tokens from the statistical patterns of co-occurrence in large text corpora.
        The resulting geometry is one of the most surprising results in machine
        learning: meaning has shape. Synonyms cluster. Analogies become arithmetic.
        Concepts that belong together end up near each other in a space that was
        learned from nothing but which word appeared next to which other word.
      </ChapterLede>

      {/* ── Section 1: From Tokens to Vectors ─────────────────────────────── */}
      <div id="from-tokens-to-vectors">
        <SectionTitle>From Tokens to Vectors</SectionTitle>
      </div>

      <p style={prose}>
        Early NLP represented words as one-hot vectors — a vector of length equal
        to the vocabulary size, with a single 1 at the word's index and 0 everywhere
        else. One-hot encoding is both enormous and meaningless: every word is
        equidistant from every other word, and the representation of "king" gives
        no information about its relationship to "queen." Dense embeddings replace
        this with short vectors — typically 50 to 300 dimensions — learned from data.
        Two words that appear in similar contexts end up with similar vectors.
        The vocabulary problem that seemed to require millions of dimensions collapses
        into a compact, information-rich representation.
      </p>

      <MathBlock>{`one-hot: v_king = [0, 0, ..., 1, ..., 0]   dim = |V|
embedding: v_king = [0.41, -0.28, 0.73, ...]  dim = 50-300`}</MathBlock>

      <OneHotVsEmbedding />

      {/* ── Section 2: Word2Vec — Skip-Gram ──────────────────────────────── */}
      <div id="word2vec-skip-gram">
        <SectionTitle>Word2Vec — Skip-Gram</SectionTitle>
      </div>

      <p style={prose}>
        Word2Vec introduced two efficient training objectives on large text corpora.
        The skip-gram model takes a center word and tries to predict the surrounding
        context words within a window. The continuous bag-of-words (CBOW) model
        does the inverse: predict the center word from its context. Both are trained
        with a shallow neural network using noise-contrastive estimation to avoid
        computing a full softmax over the entire vocabulary. The learned weights
        of the hidden layer are the embeddings. No labels are required — the text
        itself provides the supervision signal.
      </p>

      <MathBlock>{`skip-gram: maximize sum_{-c <= j <= c, j!=0} log P(w_{t+j} | w_t)
P(w_O | w_I) = exp(v'_{w_O}^T * v_{w_I}) / sum_{w=1}^{W} exp(v'_w^T * v_{w_I})`}</MathBlock>

      <SkipGram />

      {/* ── Section 3: Semantic Arithmetic ───────────────────────────────── */}
      <div id="semantic-arithmetic">
        <SectionTitle>Semantic Arithmetic</SectionTitle>
      </div>

      <p style={prose}>
        The most celebrated property of word embeddings is that linear operations
        in the embedding space correspond to semantic relationships. The vector
        from "man" to "woman" approximates the vector from "king" to "queen."
        Subtracting "Paris" from "France" and adding "Italy" yields a vector close
        to "Rome." These relationships emerge from co-occurrence statistics without
        any explicit programming of semantic knowledge. The embedding space has
        learned a compressed model of the semantic relationships encoded in the
        training text — imperfect and biased, but structurally rich.
      </p>

      <MathBlock>{`v("king") - v("man") + v("woman") ≈ v("queen")
v("France") - v("Paris") + v("Rome") ≈ v("Italy")`}</MathBlock>

      <SemanticArithmetic />

      {/* ── Section 4: GloVe & fastText ──────────────────────────────────── */}
      <div id="glove-and-fasttext">
        <SectionTitle>GloVe & fastText</SectionTitle>
      </div>

      <p style={prose}>
        GloVe (Global Vectors) trains on the global word-word co-occurrence matrix
        rather than local windows. Its loss function explicitly models the ratio of
        co-occurrence probabilities, giving it a clear objective for what the dot
        product of two word vectors should represent. FastText extends the word2vec
        approach by representing each word as a bag of character n-grams: "playing"
        is the average of vectors for "play", "layi", "ayin", "ying", and the full
        word. This allows fastText to generate reasonable embeddings for out-of-vocabulary
        words and is particularly effective on morphologically rich languages where
        word forms vary heavily.
      </p>

      <MathBlock>{`GloVe loss: sum_{i,j} f(X_ij)(v_i^T * v_j + b_i + b_j - log X_ij)^2
fastText: v(word) = (1/|G_w|) * sum_{g in G_w} z_g`}</MathBlock>

      <GloVeFastText />

      {/* ── Section 5: From Static to Contextual ─────────────────────────── */}
      <div id="contextual-embeddings">
        <SectionTitle>From Static to Contextual</SectionTitle>
      </div>

      <p style={prose}>
        Word2Vec, GloVe, and fastText produce a single fixed vector per word.
        "Bank" has one embedding regardless of whether the sentence is about a
        riverbank or a financial institution. ELMo (Embeddings from Language Models)
        was the first widely-adopted contextual embedding — it ran a bidirectional
        LSTM over the whole sentence and produced a different vector for each word
        depending on its context. BERT extended this to a transformer architecture
        trained with masked language modeling, producing contextual embeddings that
        became the foundation of modern NLP. The shift from static to contextual
        is the shift from lookup tables to representation — and sets the stage for
        everything the remaining chapters cover.
      </p>

      <ContextualEmbeddings />

      {/* ── Citations ──────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />

    </article>
  );
}
