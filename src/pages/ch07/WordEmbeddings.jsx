import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import OneHotVsEmbedding from "../../components/widgets/ch07/OneHotVsEmbedding";
import SkipGram from "../../components/widgets/ch07/SkipGram";
import SemanticArithmetic from "../../components/widgets/ch07/SemanticArithmetic";
import GloVeFastText from "../../components/widgets/ch07/GloVeFastText";
import ContextualEmbeddings from "../../components/widgets/ch07/ContextualEmbeddings";
import SkipGramWindow from "../../components/diagrams/ch07/SkipGramWindow";
import AnalogyParallelogram from "../../components/diagrams/ch07/AnalogyParallelogram";
import FastTextSubwords from "../../components/diagrams/ch07/FastTextSubwords";
import StaticVsContextual from "../../components/diagrams/ch07/StaticVsContextual";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Efficient Estimation of Word Representations in Vector Space (Word2Vec)", authors: "Mikolov, Chen, Corrado, Dean", venue: "ICLR", year: "2013", tag: "seminal" },
  { num: 2, title: "Distributed Representations of Words and Phrases and their Compositionality (Negative Sampling)", authors: "Mikolov, Sutskever, Chen, Corrado, Dean", venue: "NeurIPS", year: "2013", tag: "seminal" },
  { num: 3, title: "GloVe: Global Vectors for Word Representation", authors: "Pennington, Socher, Manning", venue: "EMNLP", year: "2014", tag: "seminal" },
  { num: 4, title: "Enriching Word Vectors with Subword Information (fastText)", authors: "Bojanowski, Grave, Joulin, Mikolov", venue: "TACL", year: "2017", tag: "paper" },
  { num: 5, title: "Deep contextualized word representations (ELMo)", authors: "Peters, Neumann, Iyyer, Gardner, Clark, Lee, Zettlemoyer", venue: "NAACL", year: "2018", tag: "seminal" },
  { num: 6, title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", authors: "Devlin, Chang, Lee, Toutanova", venue: "NAACL", year: "2019", tag: "seminal" },
  { num: 7, title: "Linguistic Regularities in Continuous Space Word Representations", authors: "Mikolov, Yih, Zweig", venue: "NAACL", year: "2013", tag: "paper" },
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
    <article style={{ maxWidth: "var(--chapter-max-width, 740px)", margin: "0 auto", padding: "var(--chapter-padding, 52px 44px 100px)" }}>

      {/* ── Chapter header ─────────────────────────────────────────────────── */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "var(--chapter-meta-size, 10.5px)",
        fontWeight: 400,
        letterSpacing: "0.1em",
        color: "var(--accent)",
        opacity: 0.7,
        textTransform: "uppercase",
        marginBottom: "12px",
      }}>
        Chapter 07 · Part II — Language & Sequence
      </div>

      <h1 style={{
        fontFamily: "'Crimson Pro', serif",
        fontSize: "var(--h1-size, 42px)",
        fontWeight: 600,
        color: "var(--text)",
        margin: "0 0 0",
        lineHeight: "var(--h1-line-height, 1.15)",
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

      <MathBlock>{`$$\\begin{aligned}
  \\text{one-hot:} \\quad &v_{\\text{king}} = [0, 0, \\ldots, 1, \\ldots, 0], \\quad \\dim = |V| \\\\
  \\text{embedding:} \\quad &v_{\\text{king}} = [0.41,\\, -0.28,\\, 0.73,\\, \\ldots], \\quad \\dim = 50\\text{--}300
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        The reason dense embeddings work at all is Firth's distributional hypothesis
        (1957): <i>"You shall know a word by the company it keeps."</i> If "cat" and
        "dog" tend to appear in the same kinds of sentences — near "pet", "vet",
        "leash", "fur" — then training a model to predict context will inevitably
        place their embeddings near each other in the learned space. This is a
        strong inductive bias: meaning is co-occurrence statistics, and co-occurrence
        statistics are computable from raw text without labels. Every embedding
        method in this chapter is, at root, a different way of summarizing those
        statistics into a vector.
      </p>

      <p style={prose}>
        Modern systems do not embed words. They embed <i>subword tokens</i> produced
        by tokenizers like Byte Pair Encoding (BPE, used by GPT), WordPiece (BERT),
        and SentencePiece (T5, Llama). A subword tokenizer splits "unconscionable"
        into chunks like <code>un / con / scion / able</code>, allowing the model to
        recognize morphological components and handle out-of-vocabulary words
        gracefully — "tweetable", a word the tokenizer has never seen, decomposes
        into known subwords. The embedding layer is the same as in this chapter;
        only the unit being embedded has shrunk. Everything that follows applies to
        subword embeddings just as well as to word embeddings — the conceptual leap
        is the same.
      </p>

      <OneHotVsEmbedding />

      {/* ── Section 2: Word2Vec — Skip-Gram ──────────────────────────────── */}
      <div id="word2vec-skip-gram">
        <SectionTitle>Word2Vec — Skip-Gram</SectionTitle>
      </div>

      <p style={prose}>
        Word2Vec [1] introduced two efficient training objectives on large text
        corpora. The skip-gram model takes a center word and tries to predict the
        surrounding context words within a window. The continuous bag-of-words
        (CBOW) model does the inverse: predict the center word from its context.
        Both are trained with a shallow neural network using noise-contrastive
        estimation to avoid computing a full softmax over the entire vocabulary.
        The learned weights of the hidden layer are the embeddings. No labels are
        required — the text itself provides the supervision signal.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{skip-gram:} \\quad &\\max \\sum_{-c \\leq j \\leq c,\\ j \\neq 0} \\log P(w_{t+j} \\mid w_t) \\\\
  &P(w_O \\mid w_I) = \\frac{\\exp\\bigl(v'^{\\top}_{w_O} v_{w_I}\\bigr)}{\\sum_{w=1}^{W} \\exp\\bigl(v'^{\\top}_w v_{w_I}\\bigr)}
\\end{aligned}$$`}</MathBlock>

      <SkipGramWindow />

      <p style={prose}>
        The architecture is shallower than it looks. Word2Vec is, mechanically, a
        two-layer neural network: a linear projection from the input one-hot vector
        into a hidden embedding (just a lookup into the embedding matrix), followed
        by a linear output layer producing a softmax over the entire vocabulary.
        The hidden layer's weights <i>are</i> the embeddings — once trained, the
        network is discarded and only the embedding matrix is kept. Skip-gram trains
        a single center word to predict each of its surrounding context words
        (within a window of usually 5–10 tokens). CBOW does the reverse: average
        the context word embeddings and predict the center word. Skip-gram trains
        slower but produces better embeddings for rare words; CBOW is faster and
        smoother for common words.
      </p>

      <p style={prose}>
        Computing the full softmax over a 100,000-word vocabulary for every training
        pair is prohibitively expensive. Mikolov, Sutskever, Chen, Corrado &amp; Dean
        (2013) [2] introduced <b>negative sampling</b>: instead of the full softmax,
        for each true (center, context) pair, sample <InlineMath>{"k"}</InlineMath> random "noise" words
        (typically <InlineMath>{"k = 5"}</InlineMath> to <InlineMath>{"20"}</InlineMath>), and train a binary classifier to distinguish the
        true pair from the noise pairs. The loss becomes a sum of <InlineMath>{"k+1"}</InlineMath> simple sigmoid
        terms rather than a softmax over the whole vocabulary. Negative sampling is
        a specific case of the broader noise-contrastive estimation framework, and
        it is the technique that made Word2Vec fast enough to train on billions of
        tokens of text on a single machine.
      </p>

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

      <MathBlock>{`$$\\begin{aligned}
  v(\\text{king}) - v(\\text{man}) + v(\\text{woman}) &\\approx v(\\text{queen}) \\\\
  v(\\text{France}) - v(\\text{Paris}) + v(\\text{Rome}) &\\approx v(\\text{Italy})
\\end{aligned}$$`}</MathBlock>

      <AnalogyParallelogram />

      <p style={prose}>
        Mikolov, Yih &amp; Zweig (2013) [7] systematized this observation into a
        benchmark of analogies across syntactic and semantic relationships: gender
        (man:woman :: king:queen), capital cities (France:Paris :: Italy:Rome),
        comparatives (good:better :: bad:worse), verb tense (run:ran ::
        walk:walked), country-currency, plurality, and more. Word2Vec-style
        embeddings scored remarkably well — typically 50–75% accuracy on these
        tasks — <i>without ever being trained on the concept of "analogy"</i>. The
        structure emerged purely from co-occurrence statistics. The discovery
        wasn't a one-off curiosity; it was a reproducible property of the learned
        geometry.
      </p>

      <p style={prose}>
        The same geometry inherits the biases of its training corpus. Bolukbasi,
        Chang, Zou, Saligrama &amp; Kalai (2016) — in a paper titled "Man is to
        Computer Programmer as Woman is to Homemaker?" — showed the same arithmetic
        that gives <InlineMath>{"\\text{king} - \\text{man} + \\text{woman} \\approx \\text{queen}"}</InlineMath> also produces <InlineMath>{"\\text{programmer} - \\text{man} + \\text{woman} \\approx \\text{homemaker}"}</InlineMath> and <InlineMath>{"\\text{doctor} - \\text{he} + \\text{she} \\approx \\text{nurse}"}</InlineMath>. Word embeddings amplify
        whatever social biases are present in the training text, and naive analogy
        completion will surface them on demand. This is not a bug fixable by
        post-processing — Gonen &amp; Goldberg (2019) later showed that "debiased"
        embeddings still cluster biased words together; the bias lives in the
        geometry, not just on a single axis. Modern systems built on these
        embeddings have inherited the problem.
      </p>

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

      <MathBlock>{`$$\\begin{aligned}
  \\text{GloVe loss:} \\quad &\\sum_{i,j} f(X_{ij})\\bigl(v_i^{\\top} v_j + b_i + b_j - \\log X_{ij}\\bigr)^2 \\\\
  \\text{fastText:} \\quad &v(\\text{word}) = \\frac{1}{|G_w|} \\sum_{g \\in G_w} z_g
\\end{aligned}$$`}</MathBlock>

      <FastTextSubwords />

      <p style={prose}>
        Pennington, Socher &amp; Manning (2014) [3] argued that local-context methods
        like Word2Vec underuse the global co-occurrence statistics that are already
        implicit in the corpus. Their key observation: it's not the <i>individual</i>{" "}
        co-occurrence probabilities that encode meaning best, but their <i>ratios</i>.
        The ratio <InlineMath>{"P(\\text{ice} \\mid k) / P(\\text{steam} \\mid k)"}</InlineMath> is large when <InlineMath>{"k = \\text{``solid''}"}</InlineMath>, near zero
        when <InlineMath>{"k = \\text{``gas''}"}</InlineMath>, and near one when <InlineMath>{"k"}</InlineMath> is unrelated to either (like "water").
        GloVe's loss function is designed so that the dot product of two word
        vectors approximates the log of this ratio — making the learned geometry an
        explicit, interpretable summary of global co-occurrence structure. On many
        analogy benchmarks GloVe slightly outperforms Word2Vec, but the gap is
        small; both are alive in the wild.
      </p>

      <p style={prose}>
        Bojanowski, Grave, Joulin &amp; Mikolov (2017) [4] attacked a different
        limitation: Word2Vec treats "play", "plays", "played", and "playing" as
        four unrelated tokens and learns them independently. fastText represents
        each word as the sum of its character n-grams — "playing" becomes the
        average of vectors for &lt;pl, pla, lay, ayi, yin, ing, ng&gt;, plus the
        whole-word vector. Words with shared morphology share embedding components
        automatically, and <i>out-of-vocabulary</i> words receive sensible
        embeddings — "unfollowable" is built from familiar subword pieces even if
        no training sentence contained that exact form. This makes fastText
        especially strong on morphologically rich languages (Finnish, Turkish,
        Russian) and on social-media text full of slang and typos.
      </p>

      <GloVeFastText />

      {/* ── Section 5: From Static to Contextual ─────────────────────────── */}
      <div id="contextual-embeddings">
        <SectionTitle>From Static to Contextual</SectionTitle>
      </div>

      <p style={prose}>
        Word2Vec, GloVe, and fastText all share one constraint: each word gets one
        vector, fixed forever. The same "bank" embedding is used for <i>"deposit at
        the bank"</i> and <i>"sat on the river bank"</i> — the model has no mechanism
        to distinguish. ELMo (Peters, Neumann, Iyyer, Gardner, Clark, Lee &amp;
        Zettlemoyer 2018) [5] was the first widely-adopted fix: run a bidirectional
        LSTM over the whole sentence and use the LSTM's hidden states <i>as</i> the
        embeddings. Now "bank" in the financial sentence and "bank" in the river
        sentence get genuinely different vectors, because each is conditioned on a
        different surrounding sequence.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{static:} \\quad &v(\\text{bank}) \\quad \\text{— same vector everywhere} \\\\
  \\text{contextual:} \\quad &v(\\text{bank} \\mid \\text{\`\`river ___''}) \\neq v(\\text{bank} \\mid \\text{\`\`Federal ___''})
\\end{aligned}$$`}</MathBlock>

      <StaticVsContextual />

      <p style={prose}>
        BERT (Devlin, Chang, Lee &amp; Toutanova 2019) [6] replaced ELMo's biLSTM
        with a transformer encoder and trained it with <i>masked language modeling</i>
        — randomly hiding 15% of tokens and asking the model to predict them from
        the surrounding context. The result was a single pretrained model that
        could produce strong contextual embeddings for any token in any sentence,
        fine-tunable to dozens of downstream tasks with small task-specific heads.
        BERT-style pretraining became the foundation of NLP from 2019 onward.
        Static word embeddings are now mostly a teaching tool — in production,
        every modern model is some descendant of BERT or GPT, and "word embedding"
        usually means a contextual token representation extracted from one of those
        models.
      </p>

      <ContextualEmbeddings />

      {/* ── Citations ──────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />

    </article>
  );
}
