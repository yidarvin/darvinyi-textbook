import { useTocSections } from "../../components/layout/TocRail";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import AttentionHeatmap from "../../components/widgets/ch09/AttentionHeatmap";
import QKVInspector from "../../components/widgets/ch09/QKVInspector";
import MultiHeadAttention from "../../components/widgets/ch09/MultiHeadAttention";
import BottleneckVsAttention from "../../components/diagrams/ch09/BottleneckVsAttention";
import QKVMechanism from "../../components/diagrams/ch09/QKVMechanism";
import ScalingByDk from "../../components/diagrams/ch09/ScalingByDk";
import MultiHeadSplit from "../../components/diagrams/ch09/MultiHeadSplit";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = buildCitations([
  { title: "Sequence to Sequence Learning with Neural Networks", authors: "Sutskever, Vinyals, Le", venue: "NeurIPS", year: "2014", tag: "seminal" },
  { title: "Neural Machine Translation by Jointly Learning to Align and Translate", authors: "Bahdanau, Cho, Bengio", venue: "ICLR", year: "2015", tag: "seminal" },
  { title: "Effective Approaches to Attention-based Neural Machine Translation", authors: "Luong, Pham, Manning", venue: "EMNLP", year: "2015", tag: "paper" },
  "attention-is-all-you-need",
  { title: "Attention is not Explanation", authors: "Jain, Wallace", venue: "NAACL", year: "2019", tag: "paper" },
  { title: "Attention is not not Explanation", authors: "Wiegreffe, Pinter", venue: "EMNLP", year: "2019", tag: "paper" },
]);

const TOC_SECTIONS = [
  { id: "the-bottleneck-problem",           label: "The Bottleneck" },
  { id: "scaled-dot-product-attention",     label: "Dot-Product Attention" },
  { id: "self-cross-attention-and-masking", label: "Cross-Attention & Masking" },
  { id: "multi-head-attention",             label: "Multi-Head Attention" },
];

export default function Attention() {
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
        Chapter 09 · Part II — Language & Sequence
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
        Attention
      </h1>

      <ChapterLede>
        Recurrent seq2seq models compress an entire input sequence into a single
        fixed-size vector — a bottleneck that loses information for long sequences.
        Attention solves this by letting the decoder look back at all encoder hidden
        states directly, weighting each by its relevance to the current generation step.
        The mechanism is simple. Its consequences were not.
      </ChapterLede>

      {/* ── Section 1: The Seq2Seq Bottleneck ────────────────────────────── */}
      <div id="the-bottleneck-problem">
        <SectionTitle>The Seq2Seq Bottleneck</SectionTitle>
      </div>

      <p style={prose}>
        Chapter 8 ended with exactly this problem. In the original encoder-decoder
        RNN of Sutskever et al. (2014) [1], the encoder reads the entire source
        sentence one token at a time and folds everything it has seen into a single hidden
        state — a vector typically of dimension 256 to 1024. That one vector is
        the only thing the decoder receives. Every output token, for every
        position, is generated conditioned on the same fixed summary. Information
        about early tokens has already been overwritten by the time the encoder
        reaches the end.
      </p>

      <p style={prose}>
        The empirical signature is unmistakable. BLEU — a standard machine-translation
        quality score that compares n-gram overlap against a reference translation —
        degrades sharply once the source passes roughly twenty to thirty tokens. The
        model has not forgotten how to translate — it has simply run out of bits. A
        few hundred floats cannot losslessly encode an arbitrary paragraph, and the
        decoder has no way to consult the source again once generation begins.
      </p>

      <p style={prose}>
        Bahdanau et al. (2015) [2] proposed the fix. Rather than collapse the
        encoder's output to a single vector, keep all hidden states <InlineMath>{"h_1, \\ldots, h_T"}</InlineMath> and
        let the decoder, at each output step, compute a weighted combination of
        them. The weights — the alignment — come from a small feed-forward network
        that compares the decoder's current state to each encoder state, rather
        than from a similarity computed directly between the two. This is additive
        attention.
      </p>

      <MathBlock>{"$$e_{ij} = v_a^{\\top} \\tanh(W_a s_{i-1} + U_a h_j), \\qquad \\alpha_{ij} = \\text{softmax}_j(e_{ij}), \\qquad c_i = \\sum_j \\alpha_{ij} h_j$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"s_{i-1}"}</InlineMath> is the decoder's previous hidden state, <InlineMath>{"h_j"}</InlineMath> is
        encoder hidden state <InlineMath>{"j"}</InlineMath>, <InlineMath>{"v_a, W_a, U_a"}</InlineMath> are learned
        alignment parameters, and <InlineMath>{"c_i"}</InlineMath> is the context vector handed to the
        decoder at output step <InlineMath>{"i"}</InlineMath>. <InlineMath>{"\\alpha_{ij}"}</InlineMath> is the raw
        score <InlineMath>{"e_{ij}"}</InlineMath> passed through softmax — the function that turns a
        vector of raw scores into a probability distribution, nonnegative
        values that sum to 1 — so it is the normalized share of attention
        encoder position <InlineMath>{"j"}</InlineMath> receives.
      </p>

      <p style={prose}>
        Additive attention was the conceptual breakthrough; the dot-product
        simplification covered next came later. Every refinement in the rest of
        this chapter — queries and keys and values, scaling, multi-head —
        generalizes this one idea. Because the query <InlineMath>{"s_{i-1}"}</InlineMath> comes from the
        decoder while the keys and values <InlineMath>{"h_j"}</InlineMath> come from the encoder, this
        worked example is itself an instance of <em>cross-attention</em>, a distinction
        made precise later in this chapter.
      </p>

      <BottleneckVsAttention />

      <p style={prose}>
        Switch between the three example sentences below and click a row to pin
        it — this is <em>self-attention</em>: every token plays all three roles
        (query, key, and value) within one sequence, in contrast to the
        cross-attention setup just described. Notice how every token can look
        directly at every other token in a single softmax lookup, regardless of
        distance.
      </p>

      <AttentionHeatmap
        tryThis={{
          do: "Switch between the three example sentences and click a row to pin it.",
          notice: "Every token can look directly at every other token in one softmax lookup, regardless of distance — no recurrence, no fixed-size bottleneck to pass through.",
        }}
      />

      {/* ── Section 2: Scaled Dot-Product Attention ──────────────────────── */}
      <div id="scaled-dot-product-attention">
        <SectionTitle>Scaled Dot-Product Attention</SectionTitle>
      </div>

      <p style={prose}>
        Bahdanau's alignment network is itself a small neural net that has to run
        for every query-key pair, which adds real cost on top of the comparison it
        is making. Luong et al. (2015) [3] replaced Bahdanau's learned alignment
        network with a plain dot product <InlineMath>{"q^{\\top} k"}</InlineMath>. The two formulations have the same theoretical
        complexity, but the dot-product variant is dramatically faster in practice:
        a single matrix multiply, fully vectorized on GPU. Vaswani et al. (2017) [4]
        note this directly — dot-product attention is faster and more memory-efficient
        because it reduces to highly optimized matmul kernels. The shift from
        additive to multiplicative was the unlock that made attention cheap enough
        to apply everywhere.
      </p>

      <QKVMechanism />

      <p style={prose}>
        Generalize away from the seq2seq setting. A query is what the current
        position is asking for. A key is what each candidate position advertises
        about itself. A value is what each candidate contributes if it is selected.
        The output is a query-weighted blend of values, where the blend coefficients
        come from query-key similarity. The crucial structural point is that <InlineMath>{"Q"}</InlineMath>, <InlineMath>{"K"}</InlineMath>,
        and <InlineMath>{"V"}</InlineMath> are produced by separate learned linear projections of the same
        underlying inputs. The model can learn what to ask, what to advertise, and
        what to pay out, each independently. From here on, tokens are row vectors
        and projections right-multiply — <InlineMath>{"Q = XW_Q"}</InlineMath>, not{" "}
        <InlineMath>{"Q = W_Q X"}</InlineMath> — the convention used throughout the attention
        literature, and a transpose of the <InlineMath>{"Wx"}</InlineMath> column-vector convention
        the earlier chapters used for a single example.
      </p>

      <MathBlock>{"$$\\text{Attention}(Q, K, V) = \\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right) V$$"}</MathBlock>

      <p style={prose}>
        The <InlineMath>{"\\sqrt{d_k}"}</InlineMath> in the denominator is not cosmetic. If the components of <InlineMath>{"q"}</InlineMath> and <InlineMath>{"k"}</InlineMath>{" "}
        are independent with mean 0 and variance 1, then <InlineMath>{"q^{\\top} k = \\sum_i q_i k_i"}</InlineMath> has mean 0
        and variance <InlineMath>{"d_k"}</InlineMath>. As <InlineMath>{"d_k"}</InlineMath> grows — 64, 512, larger — the dot products spread
        out and grow large in magnitude. Softmax of large logits — the raw, pre-softmax
        scores — is nearly one-hot, and the gradient of softmax in that regime is
        near zero: training stalls. Dividing by <InlineMath>{"\\sqrt{d_k}"}</InlineMath> rescales the variance
        back to 1, keeping softmax in its responsive range. <InlineMath>{"1/\\sqrt{d_k}"}</InlineMath> is exactly
        the right factor; dividing by <InlineMath>{"d_k"}</InlineMath>{" "}
        itself would shrink real differences too aggressively and blur useful
        signal.
      </p>

      <ScalingByDk />

      <p style={prose}>
        Step through the five stages below for a chosen query token; notice how
        scaling (stage 3) pulls the raw dot-product scores back before softmax
        (stage 4) turns them into a normalized attention distribution.
      </p>

      <QKVInspector
        tryThis={{
          do: 'Step through all five stages for a chosen query token, then switch the query and repeat.',
          notice: "The scaling step rescales the raw dot-product scores before softmax turns them into a normalized, per-row attention distribution — the same operation the equation above writes in one line.",
        }}
      />

      {/* ── Section 3: Self-Attention, Cross-Attention, and Masking ──────── */}
      <div id="self-cross-attention-and-masking">
        <SectionTitle>Self-Attention, Cross-Attention, and Masking</SectionTitle>
      </div>

      <p style={prose}>
        Every worked example so far — the heatmap above, the query token you just
        stepped through — has <InlineMath>{"Q"}</InlineMath>, <InlineMath>{"K"}</InlineMath>, and{" "}
        <InlineMath>{"V"}</InlineMath> all produced from the same sequence: this is{" "}
        <em>self-attention</em>. Section 1's Bahdanau example is the other case: the
        query comes from the decoder's own state while the keys and values come
        from a different sequence, the encoder's hidden states — this is{" "}
        <em>cross-attention</em>. The two are the same equation applied to
        different inputs, not two different mechanisms.
      </p>

      <MathBlock>{"$$\\text{Attention}(XW_Q,\\ YW_K,\\ YW_V), \\qquad X = Y \\Rightarrow \\text{self-attention}, \\quad X \\neq Y \\Rightarrow \\text{cross-attention}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"X"}</InlineMath> is the sequence supplying the queries and{" "}
        <InlineMath>{"Y"}</InlineMath> is the sequence supplying the keys and values — a Transformer
        decoder's cross-attention sub-layer sets <InlineMath>{"X"}</InlineMath> to its own sequence
        and <InlineMath>{"Y"}</InlineMath> to the encoder's output, exactly Section 1's setup with the
        alignment network replaced by learned projections.
      </p>

      <p style={prose}>
        This is also the moment to name the cost. The score matrix <InlineMath>{"QK^{\\top}"}</InlineMath>{" "}
        is <InlineMath>{"n \\times m"}</InlineMath> for a length-<InlineMath>{"n"}</InlineMath> query sequence
        attending to a length-<InlineMath>{"m"}</InlineMath> key/value sequence — <InlineMath>{"n \\times n"}</InlineMath>{" "}
        in the self-attention case — so both the compute and the memory a single
        attention layer needs scale quadratically in sequence length. That quadratic
        cost is the price of removing the RNN's fixed-size bottleneck: every
        position now scores explicitly against every other position instead of
        passing through one compressed summary. Chapter 11 revisits this cost
        directly when it introduces the KV cache, and Chapter 17 covers
        state-space alternatives built specifically to avoid it.
      </p>

      <p style={prose}>
        Self-attention as defined so far is bidirectional — every position can see
        every other position, including ones later in the sequence. An
        autoregressive decoder cannot allow that: predicting token <InlineMath>{"t"}</InlineMath>{" "}
        from tokens <InlineMath>{"t+1, t+2, \\ldots"}</InlineMath> would let training trivially
        cheat by reading the answer. The fix is a <em>causal mask</em>: before
        softmax, add <InlineMath>{"-\\infty"}</InlineMath> to every score whose key position is later
        than its query position, so softmax assigns it exactly zero weight. The
        same trick handles batches of different-length sequences — a{" "}
        <em>padding mask</em> sends <InlineMath>{"-\\infty"}</InlineMath> to every pad-token position so
        real tokens never attend to filler.
      </p>

      <MathBlock>{"$$\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}} + M\\right) V, \\qquad M_{ij} = \\begin{cases} 0 & \\text{position } j \\text{ allowed} \\\\ -\\infty & \\text{position } j \\text{ masked} \\end{cases}$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"M"}</InlineMath> is added once, before the softmax in the equation from
        Section 2 — every other step of the computation is unchanged. This one
        addition is what lets a Transformer train on an entire sequence in
        parallel while still generating, at inference time, one token after
        another with no access to the future, which is exactly the mechanism
        Chapter 10's decoder relies on.
      </p>

      {/* ── Section 4: Multi-Head Attention ──────────────────────────────── */}
      <div id="multi-head-attention">
        <SectionTitle>Multi-Head Attention</SectionTitle>
      </div>

      <p style={prose}>
        A single attention map has one set of projections (<InlineMath>{"W_Q, W_K, W_V"}</InlineMath>), so it
        can learn one notion of similarity. But "what relates to what" in a sentence
        is multi-faceted. Subject-verb agreement is a syntactic dependency. A
        pronoun resolving to its antecedent is coreference. Positional locality is
        another channel entirely, as is semantic similarity. One head, one signal —
        and the model is asked to compress all of these into a single attention
        pattern.
      </p>

      <p style={prose}>
        The original Transformer uses <InlineMath>{"d_{\\text{model}} = 512"}</InlineMath> and <InlineMath>{"h = 8"}</InlineMath> heads, with{" "}
        <InlineMath>{"d_k = d_v = d_{\\text{model}} / h = 64"}</InlineMath>. Each head receives its own learned
        projections <InlineMath>{"W_i^Q, W_i^K, W_i^V"}</InlineMath> that map from 512 down to 64, runs scaled
        dot-product attention in that 64-dimensional subspace, and produces a
        64-dim output. The eight outputs are concatenated back to 512 and passed
        through a final learned projection <InlineMath>{"W_O \\in \\mathbb{R}^{512 \\times 512}"}</InlineMath>. The compute
        accounting is the punch line: because each head operates at reduced
        dimension, the total cost of multi-head attention is essentially the same
        as a single head at full dimensionality. The same total flops are simply
        split across parallel subspaces instead of one full-width computation.
      </p>

      <p style={prose}>
        Probing work on trained Transformers has found heads that specialize in
        syntactic relations, positional patterns, and coreference, though the
        specialization is messier than the clean stories suggest. The architectural
        argument stands on its own: giving the model multiple independent
        similarity functions is cheap, and it consistently outperforms cramming
        the same signal into one.
      </p>

      <MultiHeadSplit />

      <MathBlock>{`$$\\begin{aligned}
  \\text{MultiHead}(Q, K, V) &= \\text{Concat}(\\text{head}_1, \\ldots, \\text{head}_h)\\, W^O \\\\
  \\text{where}\\ \\text{head}_i &= \\text{Attention}(Q W_i^Q,\\ K W_i^K,\\ V W_i^V)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Expand each of the four heads below and compare them; notice how Head 3
        stays nearly diagonal — a low-entropy (entropy: how spread out, high,
        or concentrated, low, a probability distribution is), self-focused
        pass-through — while Head 4 spreads its weight toward semantically
        related content words at noticeably higher entropy.
      </p>

      <MultiHeadAttention
        tryThis={{
          do: "Expand Head 3 (Identity) and Head 4 (Semantic) and compare their entropy stat.",
          notice: "Head 3's entropy is the lowest of the four — it is nearly a diagonal pass-through — while Head 4 runs noticeably higher as its weight spreads across semantically related words.",
        }}
      />

      <p style={prose}>
        Going deeper: a high attention weight on a token is not proof that the
        token caused the output. Jain & Wallace (2019) [5] showed that alternative
        inputs can produce near-identical predictions under very different
        attention distributions, and that gradient-based attribution often
        disagrees with attention's own ranking of importance — evidence against
        reading attention weights as an explanation. Wiegreffe & Pinter (2019) [6]
        pushed back: attention can still be a <em>plausible</em> account of a
        decision even where it is not a <em>necessary</em> one, so the weights
        above are worth inspecting, just not worth trusting as the whole story.
      </p>

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        What carries forward is the retrieval primitive itself: any time a model
        needs to pull information from a set of candidates weighted by relevance,
        the query-key-value pattern established here is the tool, whether the
        candidates come from the same sequence (self-attention) or a different
        one (cross-attention). Scaling by <InlineMath>{"1/\\sqrt{d_k}"}</InlineMath> is a
        numerical-stability trick that recurs anywhere a dot product feeds a
        softmax, and masking — adding <InlineMath>{"-\\infty"}</InlineMath> before that softmax — is
        how the same equation is made causal or batch-safe without changing its
        shape. Multi-head is the cheap insight that several independent
        similarity functions in parallel beat one at full width, at essentially
        no extra cost. Chapter 10 assembles all four pieces — Q/K/V projections,
        scaled dot-product scoring, masking, and multi-head splitting — into the
        encoder and decoder blocks of the full Transformer.
      </p>

      {/* Softmax Temperature moved to Chapter 14 (Efficient Inference &
          Deployment) — see context/V2_PLAN.md queue item S2. */}

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
