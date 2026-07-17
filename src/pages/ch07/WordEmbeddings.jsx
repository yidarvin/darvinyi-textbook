import { useTocSections } from "../../components/layout/TocContext";
import { buildCitations } from "../../data/citations";
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
import BPEMerges from "../../components/widgets/ch07/BPEMerges";
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

const CITATIONS = buildCitations([
  { title: "Efficient Estimation of Word Representations in Vector Space (Word2Vec)", authors: "Mikolov, Chen, Corrado, Dean", venue: "ICLR", year: "2013", tag: "seminal" },
  { title: "Distributed Representations of Words and Phrases and their Compositionality (Negative Sampling)", authors: "Mikolov, Sutskever, Chen, Corrado, Dean", venue: "NeurIPS", year: "2013", tag: "seminal" },
  { title: "GloVe: Global Vectors for Word Representation", authors: "Pennington, Socher, Manning", venue: "EMNLP", year: "2014", tag: "seminal" },
  { title: "Enriching Word Vectors with Subword Information (fastText)", authors: "Bojanowski, Grave, Joulin, Mikolov", venue: "TACL", year: "2017", tag: "paper" },
  { title: "Deep contextualized word representations (ELMo)", authors: "Peters, Neumann, Iyyer, Gardner, Clark, Lee, Zettlemoyer", venue: "NAACL", year: "2018", tag: "seminal" },
  "bert",
  { title: "Linguistic Regularities in Continuous Space Word Representations", authors: "Mikolov, Yih, Zweig", venue: "NAACL", year: "2013", tag: "paper" },
  { title: "Neural Machine Translation of Rare Words with Subword Units", authors: "Sennrich, Haddow, Birch", venue: "ACL", year: "2016", tag: "seminal" },
  { title: "Japanese and Korean Voice Search", authors: "Schuster, Nakajima", venue: "ICASSP", year: "2012", tag: "paper" },
  { title: "SentencePiece: A Simple and Language Independent Subword Tokenizer and Detokenizer for Neural Text Processing", authors: "Kudo, Richardson", venue: "EMNLP (Demos)", year: "2018", tag: "paper" },
  { title: "Man is to Computer Programmer as Woman is to Homemaker? Debiasing Word Embeddings", authors: "Bolukbasi, Chang, Zou, Saligrama, Kalai", venue: "NeurIPS", year: "2016", tag: "paper" },
  { title: "Lipstick on a Pig: Debiasing Methods Cover up Systematic Gender Biases in Word Embeddings But do not Remove Them", authors: "Gonen, Goldberg", venue: "NAACL", year: "2019", tag: "paper" },
  { title: "Neural Word Embedding as Implicit Matrix Factorization", authors: "Levy, Goldberg", venue: "NeurIPS", year: "2014", tag: "paper" },
  { title: "Subword Regularization: Improving Neural Network Translation Models with Multiple Subword Candidates", authors: "Kudo", venue: "ACL", year: "2018", tag: "paper" },
]);

const TOC_SECTIONS = [
  { id: "from-tokens-to-vectors", label: "Tokens to Vectors" },
  { id: "word2vec-skip-gram",     label: "Word2Vec" },
  { id: "semantic-arithmetic",    label: "Semantic Arithmetic" },
  { id: "glove-and-fasttext",     label: "GloVe & fastText" },
  { id: "contextual-embeddings",  label: "Contextual Embeddings" },
  { id: "tokenization-bpe",       label: "Tokenization & BPE" },
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
        Word Embeddings &amp; Tokenization
      </h1>

      <ChapterLede>
        Computers operate on numbers. Language consists of tokens — words, subwords,
        punctuation — that carry meaning but have no inherent numeric form. Word
        embeddings solve this mismatch by learning dense vector representations of
        tokens from the statistical patterns of co-occurrence in large text corpora.
        The resulting geometry is one of the most surprising results in machine
        learning: meaning has shape, synonyms cluster, and analogies become
        arithmetic, all learned from nothing but which word appeared next to which
        other word.
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
        Here <InlineMath>{"v_{\\text{king}}"}</InlineMath> denotes the vector
        representing "king" under each scheme: the one-hot version needs one
        dimension per vocabulary word (<InlineMath>{"|V|"}</InlineMath>,
        easily in the hundreds of thousands), while the dense embedding packs
        the same word into a small, fixed number of real-valued dimensions
        regardless of how large the vocabulary gets.
      </p>

      {/* Firth (1957) is treated as informal historical color, not a numbered
          citation — it's the conceptual epigraph for the whole chapter rather
          than a specific result being drawn on, matching the Editorial
          Standard's "Going deeper" allowance for uncited context. Not an
          oversight. */}
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

      <p style={prose}>
        How do we tell whether two embeddings actually ended up close
        together? The standard tool is <b>cosine similarity</b>: the cosine
        of the angle between two vectors, which asks only whether they point
        in the same direction and ignores how long either vector is.
      </p>

      <MathBlock>{`$$\\cos(u, v) = \\frac{u \\cdot v}{\\lVert u \\rVert \\, \\lVert v \\rVert}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"u"}</InlineMath> and <InlineMath>{"v"}</InlineMath>{" "}
        are two embedding vectors, <InlineMath>{"u \\cdot v"}</InlineMath> is
        their dot product, and <InlineMath>{"\\lVert u \\rVert"}</InlineMath>,{" "}
        <InlineMath>{"\\lVert v \\rVert"}</InlineMath> are their Euclidean
        norms; dividing by the norms is what makes the score depend only on
        direction, ranging from <InlineMath>{"-1"}</InlineMath> (opposite) to{" "}
        <InlineMath>{"1"}</InlineMath> (identical direction), with{" "}
        <InlineMath>{"0"}</InlineMath> meaning no linear relationship at all.
      </p>

      <p style={prose}>
        Click any two words below to compare their one-hot and dense cosine
        similarities; notice that one-hot similarity is always exactly zero
        for any two distinct words — every one-hot vector is orthogonal to
        every other — while dense similarity is high for related pairs like
        "king"/"queen" or "cat"/"dog" and low (or negative) for unrelated ones.
      </p>

      <OneHotVsEmbedding
        tryThis={{
          do: 'Click any two words to compare their one-hot and dense cosine similarities, then toggle "Show all similarities" for the full pairwise heatmap.',
          notice: 'One-hot cosine similarity is always exactly 0 for any two distinct words. Dense cosine similarity is not — related pairs like king/queen or cat/dog score close to 1, while an unrelated pair like king/Paris scores low or negative.',
        }}
      />

      {/* ── Section 2: Word2Vec — Skip-Gram ──────────────────────────────── */}
      <div id="word2vec-skip-gram">
        <SectionTitle>Word2Vec — Skip-Gram</SectionTitle>
      </div>

      <p style={prose}>
        Word2Vec introduced two efficient training objectives for learning
        embeddings from large text corpora. The skip-gram model takes a center
        word and tries to predict the surrounding context words within a window [1].
        The continuous bag-of-words (CBOW) model does the inverse: predict the
        center word from its context. Both are trained with a shallow neural
        network using a technique related to noise-contrastive estimation,
        explained below as negative sampling. The learned weights of the hidden
        layer are the embeddings. No labels are required — the text itself
        provides the supervision signal.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{skip-gram:} \\quad &\\max \\sum_{-c \\leq j \\leq c,\\ j \\neq 0} \\log P(w_{t+j} \\mid w_t) \\\\
  &P(w_O \\mid w_I) = \\frac{\\exp\\bigl(v'^{\\top}_{w_O} v_{w_I}\\bigr)}{\\sum_{w=1}^{W} \\exp\\bigl(v'^{\\top}_w v_{w_I}\\bigr)}
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"w_t"}</InlineMath> is the center word and{" "}
        <InlineMath>{"w_{t+j}"}</InlineMath> each context word inside a window
        of radius <InlineMath>{"c"}</InlineMath> (excluding{" "}
        <InlineMath>{"j = 0"}</InlineMath>); the softmax line — softmax turns a
        vector of raw scores into a probability distribution over the whole
        vocabulary, all entries summing to 1 — renames these{" "}
        <InlineMath>{"w_I"}</InlineMath> (input, the center) and{" "}
        <InlineMath>{"w_O"}</InlineMath> (output, a context word), with{" "}
        <InlineMath>{"v"}</InlineMath> the input embedding matrix and{" "}
        <InlineMath>{"v'"}</InlineMath> a separate output embedding matrix —
        only <InlineMath>{"v"}</InlineMath> survives training as the shipped
        embedding matrix, while <InlineMath>{"v'"}</InlineMath> is discarded.
      </p>

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
        pair is prohibitively expensive. Mikolov et al. (2013) [2] introduced{" "}
        <b>negative sampling</b>: instead of the full softmax,
        for each true (center, context) pair, sample <InlineMath>{"k"}</InlineMath> random "noise" words
        (typically <InlineMath>{"k = 5"}</InlineMath> to <InlineMath>{"20"}</InlineMath>), and train a binary classifier to distinguish the
        true pair from the noise pairs. The loss becomes a sum of <InlineMath>{"k+1"}</InlineMath> simple sigmoid
        terms rather than a softmax over the whole vocabulary. Negative sampling is
        a specific case of the broader noise-contrastive estimation framework, and
        it is the technique that made Word2Vec fast enough to train on billions of
        tokens of text on a single machine.
      </p>

      <p style={prose}>
        The same papers pair negative sampling with two complementary
        efficiency tricks. <b>Frequent-word subsampling</b> randomly discards
        common tokens like "the" or "a" during training, since they co-occur
        with almost everything and contribute little signal once learned; a
        word <InlineMath>{"w"}</InlineMath> is dropped with probability{" "}
        <InlineMath>{"P(w) = 1 - \\sqrt{t / f(w)}"}</InlineMath>, where{" "}
        <InlineMath>{"f(w)"}</InlineMath> is its corpus frequency and{" "}
        <InlineMath>{"t"}</InlineMath> is a small threshold (typically{" "}
        <InlineMath>{"10^{-5}"}</InlineMath>). <b>Hierarchical softmax</b>,
        offered in the original papers as an alternative to negative sampling,
        replaces the flat softmax with a binary tree over the vocabulary so
        that scoring one word costs{" "}
        <InlineMath>{"O(\\log|V|)"}</InlineMath> instead of{" "}
        <InlineMath>{"O(|V|)"}</InlineMath>.
      </p>

      <p style={prose}>
        The widget below runs this update rule for real on an eight-word toy
        sentence — nothing here is scripted. Pick a center word, hit "Train
        Step" a few times (or "Train 10"), and watch the PCA (principal
        component analysis) scatter plot — a way to project the toy
        embeddings' several dimensions down to 2 for plotting — and the
        cosine-similarity readout move: "cat" and "mat" never land in
        each other's context window directly, but both repeatedly co-occur
        with "the," so training tends to pull their embeddings together
        faster than the unrelated "the"/"on" pair.
      </p>

      <SkipGram
        tryThis={{
          do: 'Cycle the center word across the sentence, then hit "Train Step" or "Train 10" a few times and watch the PCA scatter plot on the left.',
          notice: 'The stats panel tracks cosine similarity for two pairs: cat/mat (which share the neighbor "the" but never sit in each other\'s window) and the/on (unrelated function words). Training tends to pull cat/mat closer together relative to the/on, the same mechanism that clusters synonyms at scale.',
        }}
      />

      {/* ── Section 3: Semantic Arithmetic ───────────────────────────────── */}
      <div id="semantic-arithmetic">
        <SectionTitle>Semantic Arithmetic</SectionTitle>
      </div>

      <p style={prose}>
        The most celebrated property of word embeddings is that linear operations
        in the embedding space correspond to semantic relationships. The vector
        from "man" to "woman" approximates the vector from "king" to "queen."
        Subtracting "France" from "Paris" and adding "Italy" yields a vector close
        to "Rome." These relationships emerge from co-occurrence statistics without
        any explicit programming of semantic knowledge. The embedding space has
        learned a compressed model of the semantic relationships encoded in the
        training text — imperfect and biased, but structurally rich.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  v(\\text{king}) - v(\\text{man}) + v(\\text{woman}) &\\approx v(\\text{queen}) \\\\
  v(\\text{Paris}) - v(\\text{France}) + v(\\text{Italy}) &\\approx v(\\text{Rome})
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"v(\\text{word})"}</InlineMath> denotes that word's
        embedding vector, and <InlineMath>{"\\approx"}</InlineMath> means the
        vector arithmetic on the left lands <i>close to</i> — not exactly
        equal to — the vector on the right; "close" is measured by cosine
        similarity, defined above.
      </p>

      <AnalogyParallelogram />

      <p style={prose}>
        Mikolov et al. (2013) [7] systematized this observation into a
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
        Benchmarks like this are <b>intrinsic evaluation</b>: they test whether
        the embedding space itself has good structure — analogies solve
        correctly, similar words score high on human similarity judgments —
        without touching any downstream task. The complementary approach,{" "}
        <b>extrinsic evaluation</b>, plugs the embeddings into an actual system
        (a sentiment classifier, a named-entity tagger, a translation model)
        and measures whether task performance improves. The two don't always
        agree — an embedding space can win on analogy benchmarks and still
        transfer worse to a real task than a plainer alternative — so
        production systems ultimately validate embeddings extrinsically, even
        though intrinsic benchmarks are cheaper and easier to interpret.
      </p>

      <p style={prose}>
        The same geometry inherits the biases of its training corpus. Bolukbasi
        et al. (2016) [11] — in a paper titled "Man is to
        Computer Programmer as Woman is to Homemaker?" — showed the same arithmetic
        that gives <InlineMath>{"\\text{king} - \\text{man} + \\text{woman} \\approx \\text{queen}"}</InlineMath> also produces <InlineMath>{"\\text{programmer} - \\text{man} + \\text{woman} \\approx \\text{homemaker}"}</InlineMath> and <InlineMath>{"\\text{doctor} - \\text{he} + \\text{she} \\approx \\text{nurse}"}</InlineMath>. Word embeddings amplify
        whatever social biases are present in the training text, and naive analogy
        completion will surface them on demand. This is not a bug fixable by
        post-processing — Gonen &amp; Goldberg (2019) [12] later showed that "debiased"
        embeddings still cluster biased words together; the bias lives in the
        geometry, not just on a single axis. Modern systems built on these
        embeddings have inherited the problem.
      </p>

      <p style={prose}>
        Build an equation with the selectors below, or click the "Paris −
        France + Italy" preset; notice "Rome" emerges as the clear nearest
        neighbor, well ahead of the second-closest word, "London," which is
        in turn well ahead of "England" — the embedding space has captured
        the "capital-of" direction cleanly enough to land on the right city,
        not just the right general neighborhood of European capitals.
      </p>

      <SemanticArithmetic
        tryThis={{
          do: 'Click the "Paris − France + Italy" preset, then try building your own equation with the selectors and Compute.',
          notice: 'Rome is the clear nearest neighbor (cosine similarity ≈0.945), well ahead of the second-closest word, "London" (≈0.819), which is itself well ahead of the third-closest, "England" (≈0.668) — the embedding cleanly captures the "capital-of" relationship rather than just a generic "European capital city" direction.',
        }}
      />

      {/* ── Section 4: GloVe & fastText ──────────────────────────────────── */}
      <div id="glove-and-fasttext">
        <SectionTitle>GloVe & fastText</SectionTitle>
      </div>

      <p style={prose}>
        GloVe (Global Vectors) trains on the global word-word co-occurrence matrix
        rather than local windows, giving the dot product of two word vectors an
        explicit numerical target instead of Word2Vec's local prediction objective.
        FastText extends the word2vec
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

      <p style={prose}>
        Here <InlineMath>{"X_{ij}"}</InlineMath> is the co-occurrence count of
        words <InlineMath>{"i"}</InlineMath> and{" "}
        <InlineMath>{"j"}</InlineMath>, <InlineMath>{"v_i"}</InlineMath> and{" "}
        <InlineMath>{"v_j"}</InlineMath> are their embeddings,{" "}
        <InlineMath>{"b_i"}</InlineMath> and <InlineMath>{"b_j"}</InlineMath>{" "}
        are per-word bias terms that absorb overall frequency differences, and{" "}
        <InlineMath>{"f(X_{ij})"}</InlineMath> is a weighting function that
        caps the influence of very frequent pairs; in the fastText line,{" "}
        <InlineMath>{"G_w"}</InlineMath> is the set of character n-grams for
        word <InlineMath>{"w"}</InlineMath> and{" "}
        <InlineMath>{"z_g"}</InlineMath> is the embedding of n-gram{" "}
        <InlineMath>{"g"}</InlineMath>.
      </p>

      <FastTextSubwords />

      <p style={prose}>
        Pennington et al. (2014) [3] argued that local-context methods
        like Word2Vec underuse the global co-occurrence statistics that are already
        implicit in the corpus. Their key observation: it's not the <i>individual</i>{" "}
        co-occurrence probabilities that encode meaning best, but their <i>ratios</i>.
        The ratio <InlineMath>{"P(k \\mid \\text{ice}) / P(k \\mid \\text{steam})"}</InlineMath> is large when <InlineMath>{"k = \\text{``solid''}"}</InlineMath>, near zero
        when <InlineMath>{"k = \\text{``gas''}"}</InlineMath>, and near one when <InlineMath>{"k"}</InlineMath> is unrelated to either (like "water").
        GloVe's loss function is designed so that the dot product of two word
        vectors (plus a pair of bias terms) approximates the log of their
        co-occurrence count. Because this holds for every pair, the{" "}
        <i>difference</i> between two such dot products approximates the log of
        a co-occurrence ratio — giving the learned geometry an explicit,
        interpretable link to Pennington et al.'s ratio observation. On many
        analogy benchmarks GloVe slightly outperforms Word2Vec, but the gap is
        small; both are alive in the wild.
      </p>

      <p style={prose}>
        Word2Vec's negative-sampling objective isn't just a speed hack — it's
        implicitly doing something familiar from the classical count-based
        distributional tradition GloVe draws on above. Levy &amp; Goldberg (2014)
        [13] proved that skip-gram with negative sampling implicitly factorizes
        a word-context matrix whose entries are the pointwise mutual information
        (PMI) between each word and context, shifted by a constant depending on
        the number of negative samples <InlineMath>{"k"}</InlineMath>:{" "}
        <InlineMath>{"\\text{PMI}(w, c) - \\log k"}</InlineMath>. Two lineages
        that look unrelated on the surface — Word2Vec's predictive neural
        objective and the count-then-factorize tradition GloVe belongs to —
        turn out to be different routes to essentially the same underlying
        matrix, which is part of why the two methods tend to perform similarly
        in practice.
      </p>

      <p style={prose}>
        Bojanowski et al. (2017) [4] attacked a different
        limitation: Word2Vec treats "play", "plays", "played", and "playing" as
        four unrelated tokens and learns them independently. fastText represents
        each word as the average of its character n-gram vectors — "playing"
        averages together the vectors for &lt;pl, pla, lay, ayi, yin, ing, ng&gt;
        and the whole-word vector itself. Words with shared morphology share embedding components
        automatically, and <i>out-of-vocabulary</i> words receive sensible
        embeddings — "unfollowable" is built from familiar subword pieces even if
        no training sentence contained that exact form. This makes fastText
        especially strong on morphologically rich languages (Finnish, Turkish,
        Russian) and on social-media text full of slang and typos.
      </p>

      <p style={prose}>
        Click any off-diagonal cell in the co-occurrence heatmap below to see
        how its raw count feeds the GloVe loss, then type a word into the
        fastText panel on the right; notice that a made-up word like
        "unfollowable" still gets a full n-gram decomposition and is flagged
        out-of-vocabulary, while "playing" is in-vocabulary and still benefits
        from sharing n-grams with "played" and "player."
      </p>

      <GloVeFastText
        tryThis={{
          do: 'Click an off-diagonal cell in the co-occurrence heatmap, then type "unfollowable" into the fastText box on the right.',
          notice: 'The heatmap panel shows X_ij, log X_ij, and f(X_ij) for whatever pair you select, feeding directly into the GloVe loss above. "unfollowable" is flagged out-of-vocabulary yet still decomposes into real character n-grams — fastText can embed it anyway, unlike Word2Vec or GloVe.',
        }}
      />

      {/* ── Section 5: From Static to Contextual ─────────────────────────── */}
      <div id="contextual-embeddings">
        <SectionTitle>From Static to Contextual</SectionTitle>
      </div>

      <p style={prose}>
        Word2Vec, GloVe, and fastText all share one constraint: each word gets one
        vector, fixed forever. The same "bank" embedding is used for <i>"deposit at
        the bank"</i> and <i>"sat on the river bank"</i> — the model has no mechanism
        to distinguish. ELMo (Peters et al. 2018) [5] was the first widely-adopted
        fix: run a bidirectional LSTM — a recurrent network that reads the
        sentence forward and backward, built formally in Chapter 8 — over the
        whole sentence and use its hidden states <i>as</i> the
        embeddings. Now "bank" in the financial sentence and "bank" in the river
        sentence get genuinely different vectors, because each is conditioned on a
        different surrounding sequence.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{static:} \\quad &v(\\text{bank}) \\quad \\text{(same vector everywhere)} \\\\
  \\text{contextual:} \\quad &v(\\text{bank} \\mid \\text{river [blank]}) \\neq v(\\text{bank} \\mid \\text{Federal [blank]})
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"v(\\text{bank})"}</InlineMath> in the static line
        is the same fixed vector this chapter has used all along, while{" "}
        <InlineMath>{"v(\\text{bank} \\mid c)"}</InlineMath> in the contextual
        line denotes the embedding "bank" receives when conditioned on
        surrounding context <InlineMath>{"c"}</InlineMath> — the vertical bar
        reads "given" — so the same word now maps to different vectors
        depending on which sentence it appears in.
      </p>

      <StaticVsContextual />

      <p style={prose}>
        BERT (Devlin et al. 2019) [6] replaced ELMo's biLSTM
        with a transformer encoder — the self-attention architecture built from
        the ground up in Chapters 9 and 10 — and trained it with{" "}
        <i>masked language modeling</i>
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

      <p style={prose}>
        Compare the static and contextual panels for the default "bank" preset
        below, then switch to "run"; notice the static panel's similarity
        between every sentence pair is pinned at a hard-coded 1.000, since
        it's the exact same vector reused each time, while the contextual
        panel's three similarities differ from each other and track real
        meaning — the two financial senses of "bank" end up far closer to
        each other than either does to the riverbank sense.
      </p>

      <ContextualEmbeddings
        tryThis={{
          do: 'Compare the static and contextual panels for the "bank" preset, then switch to "run" and read the three cosine-similarity badges in each panel.',
          notice: 'The static panel\'s similarity is always exactly 1.000 — it\'s the same vector reused verbatim in every sentence. The contextual panel\'s three similarities are all different: for "bank," the two financial-sense sentences (S1, S3) score far higher against each other (≈0.99) than either does against the river sense S2 (≈−0.6).',
        }}
      />

      {/* ── Section 6: Tokenization & Byte-Pair Encoding ─────────────────── */}
      <div id="tokenization-bpe">
        <SectionTitle>Tokenization & Byte-Pair Encoding</SectionTitle>
      </div>

      <p style={prose}>
        Every embedding method in this chapter has quietly assumed a fixed
        vocabulary — a finite list of tokens, each with its own row in the
        embedding matrix. Where does that list come from? The obvious answer
        is "the words of English," but a fixed word-level vocabulary breaks
        the moment real text arrives: new product names, misspellings, code
        identifiers, emoji, and words from languages the vocabulary was never
        built for all lack a row in the matrix. This is the{" "}
        <b>out-of-vocabulary (OOV) problem</b> — a token the model has never
        assigned an embedding to — and it is not a corner case; any
        vocabulary built from a finite training corpus will eventually meet a
        token it has never seen. "Ignore it" or "map it to one generic{" "}
        <code>&lt;unk&gt;</code> vector" both throw away information the
        model badly needs.
      </p>

      <p style={prose}>
        One fix is to abandon words entirely and tokenize at the level of
        individual characters or raw bytes. A byte-level vocabulary needs
        only 256 entries — one per possible byte value — and by construction
        can represent any string in any language with no out-of-vocabulary
        token possible: every input decomposes into bytes, and every byte is
        already in the vocabulary. The cost is granularity. "Unconscionable"
        becomes fourteen separate tokens instead of one, so a model has to
        spend attention and depth just reassembling characters into words
        before it can reason about meaning, and the effective context window,
        measured in words rather than tokens, shrinks by roughly a factor of
        five. Character- and byte-level tokenization solve the OOV problem
        completely and buy nothing else.
      </p>

      <p style={prose}>
        Byte-pair encoding (BPE) sits between these two extremes, and it gets
        there by learning the vocabulary from data rather than declaring it
        in advance. Sennrich et al. (2016) [8] adapted a
        decades-old byte-level compression trick to language modeling: start
        from an alphabet of individual characters (or bytes), count how often
        every adjacent pair of symbols occurs across the training corpus, and
        merge the single most frequent pair into one new, longer token. Add
        that token to the vocabulary and repeat — count pairs again, now over
        an alphabet that includes the new token, merge the new winner, and
        continue until the vocabulary reaches a target size, typically tens
        of thousands of tokens for a production tokenizer. Common whole words
        end up as single tokens after enough merges, because their component
        pairs kept winning; rare or unseen words simply merge less far and
        fall back toward smaller subwords or individual characters. Every
        string remains representable — BPE inherits the byte-level
        tokenizer's immunity to OOV — while ordinary text compresses down to
        roughly one token per word.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  (x^*, y^*) &= \\arg\\max_{(x,y)} \\ \\text{count}(x, y) \\\\
  \\mathcal{V} &\\leftarrow \\mathcal{V} \\cup \\{x^*y^*\\}, \\quad \\text{repeat until } |\\mathcal{V}| = V_{\\text{target}}
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"(x, y)"}</InlineMath> ranges over every adjacent
        pair of symbols currently appearing in the corpus,{" "}
        <InlineMath>{"\\text{count}(x, y)"}</InlineMath> is how often that
        pair occurs (weighted by word frequency), each iteration adds only
        the single most frequent pair's concatenation to the vocabulary{" "}
        <InlineMath>{"\\mathcal{V}"}</InlineMath>, and the loop stops once{" "}
        <InlineMath>{"\\mathcal{V}"}</InlineMath> reaches a chosen target size{" "}
        <InlineMath>{"V_{\\text{target}}"}</InlineMath>.
      </p>

      <p style={prose}>
        The toy corpus below has four words — low (×5), lower (×2), newest
        (×6), and widest (×3) — split into characters plus an end-of-word
        marker. Press "Merge next pair" through all fifteen rounds, then
        select the preset word "lowest" (never part of training) below the
        corpus; notice the first three merges — (e, s), (es, t), and
        (est, _) — tie at a count of 9 each, more than any other pair in the
        corpus, and that "lowest" still settles into exactly two tokens,{" "}
        <code>low</code> and <code>est_</code>, assembled from pieces the
        algorithm learned on two entirely different training words.
      </p>

      <BPEMerges
        tryThis={{
          do: 'Press "Merge next pair" until all fifteen merges are done, then select the preset word "lowest" below the corpus.',
          notice:
            'The first three merges — (e, s), (es, t), (est, _) — tie at a count of 9 each, more than any other pair. "lowest" was never in the training corpus, yet it settles into exactly two tokens, low and est_, stitched from pieces learned on two different words.',
        }}
      />

      <p style={prose}>
        Going deeper: two named variants show up constantly in production
        systems, and one of them isn't actually a merge algorithm at all.
        WordPiece (Schuster &amp; Nakajima 2012 [9], later adopted by BERT)
        runs the same bottom-up merge loop as BPE but scores candidate merges
        by how much they increase the training corpus's likelihood under a
        simple language model, rather than by raw frequency — a pair that is
        common but already well-predicted by its parts gets merged later than
        raw frequency alone would suggest. SentencePiece (Kudo &amp; Richardson
        2018 [10], used by T5 and Llama) is a tokenizer library with two
        different modes: its BPE mode changes only the input, treating
        whitespace as an ordinary character to be merged like any other so
        tokenization no longer depends on a language having spaces between
        words at all — a prerequisite for tokenizing Chinese, Japanese, or
        Thai text with the same machinery as English. Its default mode,
        however, implements Kudo's unigram language-model algorithm (2018)
        [14], which abandons bottom-up merging entirely: it starts from a
        large candidate vocabulary of substrings, assigns each one a
        probability, and repeatedly prunes the least-useful entries via
        expectation-maximization until the vocabulary shrinks to the target
        size — the reverse direction from BPE's build-it-up-from-characters
        approach. Production tokenizers push the vocabulary size to
        30,000–200,000 tokens and, like GPT's, often operate directly on raw
        UTF-8 bytes, so that even a novel emoji or an unrecognized script
        decomposes into bytes rather than triggering an unknown-token
        failure.
      </p>

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        Every architecture in the rest of this book starts from the same
        place: a lookup into a learned embedding matrix, whether the tokens
        are words, subwords, image patches, or audio frames. That same matrix
        often reappears at the far end of a transformer language model, tied
        to the output projection that turns final hidden states back into
        vocabulary logits, so the model spends half as many parameters
        learning to read and write the same space (Chapter 10). The
        distributional idea itself scales up too — averaging or encoding
        whole sentences into single vectors turns similarity search from a
        per-word operation into the backbone of retrieval-augmented
        generation (Chapter 14). Chapter 8 picks up these token embeddings as
        the input to recurrent networks, the first architecture built to
        model the order between them.
      </p>

      {/* ── Citations ──────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />

    </article>
  );
}
