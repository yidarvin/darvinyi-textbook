import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import RNNUnrolled from "../../components/widgets/ch08/RNNUnrolled";
import VanishingGradient from "../../components/widgets/ch08/VanishingGradient";
import LSTMGates from "../../components/widgets/ch08/LSTMGates";
import GRUvsLSTM from "../../components/widgets/ch08/GRUvsLSTM";
import RNNSequenceModes from "../../components/diagrams/ch08/RNNSequenceModes";
import GradientMagnitudeOverTime from "../../components/diagrams/ch08/GradientMagnitudeOverTime";
import LSTMCellDiagram from "../../components/diagrams/ch08/LSTMCellDiagram";
import Seq2SeqEncoderDecoder from "../../components/diagrams/ch08/Seq2SeqEncoderDecoder";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Long Short-Term Memory", authors: "Hochreiter & Schmidhuber", venue: "Neural Computation", year: "1997", tag: "seminal" },
  { num: 2, title: "Learning Long-Term Dependencies with Gradient Descent is Difficult", authors: "Bengio, Simard, Frasconi", venue: "IEEE Transactions on Neural Networks", year: "1994", tag: "seminal" },
  { num: 3, title: "Empirical Evaluation of Gated Recurrent Neural Networks on Sequence Modeling", authors: "Chung, Gulcehre, Cho, Bengio", venue: "NeurIPS Workshop", year: "2014", tag: "paper" },
  { num: 4, title: "Sequence to Sequence Learning with Neural Networks", authors: "Sutskever, Vinyals, Le", venue: "NeurIPS", year: "2014", tag: "seminal" },
  { num: 5, title: "On the Properties of Neural Machine Translation: Encoder-Decoder Approaches", authors: "Cho, van Merrienboer, Bahdanau, Bengio", venue: "EMNLP Workshop", year: "2014", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-recurrent-architecture",    label: "The RNN" },
  { id: "vanishing-exploding-gradients", label: "Vanishing Gradients" },
  { id: "long-short-term-memory",        label: "LSTM" },
  { id: "gated-recurrent-unit",          label: "GRU" },
];

export default function RNNs() {
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
        Chapter 08 · Part II — Language & Sequence
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
        Recurrent Networks & LSTMs
      </h1>

      <ChapterLede>
        Sequential data — text, audio, time series — has a property that feedforward
        networks ignore: order matters. A recurrent network processes sequences step
        by step, maintaining a hidden state that summarizes everything it has seen so
        far. The central challenge is making that memory persist across hundreds of
        steps without vanishing into noise.
      </ChapterLede>

      {/* ── Section 1: The Recurrent Architecture ────────────────────────── */}
      <div id="the-recurrent-architecture">
        <SectionTitle>The Recurrent Architecture</SectionTitle>
      </div>

      <p style={prose}>
        At each timestep <InlineMath>{"t"}</InlineMath>, an RNN reads the current input <InlineMath>{"x_t"}</InlineMath> and the previous hidden
        state <InlineMath>{"h_{t-1}"}</InlineMath>, producing a new hidden state <InlineMath>{"h_t"}</InlineMath>. The same weight matrices are
        reused at every timestep — the network processes sequences of arbitrary length
        with a fixed parameter count. This parameter sharing is both the elegance and
        the limitation of vanilla RNNs.
      </p>

      <MathBlock>{"$$h_t = \\tanh\\!\\bigl(W_x x_t + W_h h_{t-1} + b\\bigr)$$"}</MathBlock>

      <p style={prose}>
        A recurrent network can be configured for several distinct task shapes depending
        on where inputs are read and outputs are produced along the unrolled chain.
        <em> One-to-many</em>: a single input produces a sequence (image → caption).
        <em> Many-to-one</em>: a sequence produces a single output (review text →
        sentiment label). <em>Many-to-many, aligned</em>: a sequence produces a
        same-length sequence (part-of-speech tagging, where each input token gets its
        own output). <em>Many-to-many, unaligned</em>, also called seq2seq: a sequence
        produces a different-length sequence (English → French translation). The
        recurrence itself is identical across all four; only the input/output schedule
        differs.
      </p>

      <RNNSequenceModes />

      <p style={prose}>
        A standard RNN reads strictly left-to-right, so at timestep <InlineMath>{"t"}</InlineMath> the hidden state
        <InlineMath>{"h_t"}</InlineMath> encodes only the <em>past</em>. For tasks where the future is also
        informative — named entity recognition, machine translation, speech recognition
        — a bidirectional RNN runs two recurrences in parallel, one forward and one
        backward, and concatenates their hidden states. Each token gets a representation
        that has seen the entire sequence. Bidirectional LSTMs were the workhorse of NLP
        from roughly 2014 until transformers displaced them.
      </p>

      <RNNUnrolled />

      {/* ── Section 2: Vanishing & Exploding Gradients ───────────────────── */}
      <div id="vanishing-exploding-gradients">
        <SectionTitle>Vanishing & Exploding Gradients</SectionTitle>
      </div>

      <p style={prose}>
        Backpropagation through time multiplies gradient signals by <InlineMath>{"W_h"}</InlineMath> at each
        timestep. If the spectral radius <InlineMath>{"\\rho(W_h) < 1"}</InlineMath>, gradients shrink exponentially —
        the network cannot learn dependencies beyond a few steps. If <InlineMath>{"\\rho(W_h) > 1"}</InlineMath>,
        gradients explode. This instability is not a training artifact; it is a
        fundamental consequence of the recurrent structure.
      </p>

      <MathBlock>{"$$\\frac{\\partial L}{\\partial h_0} = \\frac{\\partial L}{\\partial h_t} \\cdot \\prod_{k=1}^{t} \\text{diag}\\bigl(\\tanh'(z_k)\\bigr) W_h$$"}</MathBlock>

      <p style={prose}>
        The result is foundational, not incidental [2]. Bengio, Simard & Frasconi (1994)
        gave the first rigorous proof that learning long-range dependencies with
        gradient descent in standard recurrent networks is essentially impossible
        without architectural intervention. Their result is mechanical: any RNN whose
        recurrent weight matrix has spectral radius below 1 will exhibit
        exponentially-decaying gradients, and any RNN with spectral radius above 1 will
        exhibit exponentially-growing gradients. The "sweet spot" of <InlineMath>{"\\rho = 1"}</InlineMath> is a
        measure-zero set — generic initialization lands you on one side or the other.
        This is why the next two sections exist: LSTM and GRU are architectural fixes,
        not optimization tweaks.
      </p>

      <GradientMagnitudeOverTime />

      <p style={prose}>
        Three practical mitigations pre-date the LSTM solution and are still used today.
        <em> Gradient clipping</em> (Pascanu, Mikolov & Bengio 2013, covered in Chapter 5)
        bounds gradient norms to prevent explosion. <em>Truncated BPTT</em> limits how
        far back gradients are propagated — typically 20–50 steps — accepting a biased
        estimator in exchange for tractability and bounded memory.
        <em> Orthogonal weight initialization</em> sets the recurrent matrix <InlineMath>{"W_h"}</InlineMath>
        to a random orthogonal matrix (spectral radius exactly 1) at initialization,
        delaying the vanishing/exploding problem by many steps. None of these solve the
        problem completely; together they let a vanilla RNN train, slowly, on
        dependencies of perhaps 30–50 timesteps.
      </p>

      <VanishingGradient />

      {/* ── Section 3: Long Short-Term Memory ───────────────────────────── */}
      <div id="long-short-term-memory">
        <SectionTitle>Long Short-Term Memory</SectionTitle>
      </div>

      <p style={prose}>
        LSTMs replace the single hidden state with two: a cell state <InlineMath>{"c_t"}</InlineMath> that flows
        through time with only additive interactions, and a hidden state <InlineMath>{"h_t"}</InlineMath> gated
        by an output gate. Three learnable gates — forget, input, output — each
        controlled by a sigmoid, learn when to clear, write, and read the cell state.
        The forget gate is the key insight: by learning to preserve gradients
        multiplicatively near 1, the LSTM sidesteps vanishing gradients.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  f_t &= \\sigma\\bigl(W_f \\cdot [h_{t-1}, x_t] + b_f\\bigr) \\\\
  i_t &= \\sigma\\bigl(W_i \\cdot [h_{t-1}, x_t] + b_i\\bigr) \\\\
  \\tilde{c}_t &= \\tanh\\bigl(W_c \\cdot [h_{t-1}, x_t] + b_c\\bigr) \\\\
  c_t &= f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t \\\\
  o_t &= \\sigma\\bigl(W_o \\cdot [h_{t-1}, x_t] + b_o\\bigr) \\\\
  h_t &= o_t \\odot \\tanh(c_t)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Hochreiter & Schmidhuber (1997) [1] identified the precise mechanism behind
        vanishing gradients and designed the LSTM to bypass it. The key is the cell
        state's update equation: <InlineMath>{"c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t"}</InlineMath>. When the forget gate <InlineMath>{"f_t"}</InlineMath> is near 1,
        the cell state is <em>added to</em>, not transformed by a multiplicative weight
        matrix — there is no <InlineMath>{"\\tanh'"}</InlineMath> or <InlineMath>{"W_h"}</InlineMath> factor sitting on the gradient
        pathway through time. Hochreiter and Schmidhuber called this gradient-preserving
        pathway the "constant error carousel"; modern descriptions usually just call it
        the cell state highway. Gradients can travel through hundreds of timesteps
        unchanged, <em>provided</em> the network learns to set <InlineMath>{"f_t \\approx 1"}</InlineMath> when
        long-range memory is needed.
      </p>

      <LSTMCellDiagram />

      <p style={prose}>
        A historical note on the forget gate: the original 1997 LSTM did not include
        one — the cell state had no mechanism to clear itself, which meant the network
        could not forget irrelevant history. Gers, Schmidhuber & Cummins (2000) added
        the forget gate three years later, and it became universal. Modern LSTM
        implementations always include it; what we call "the LSTM" today is actually the
        2000 variant. Other minor variants exist (peephole connections, projection
        layers), but the forget-gated LSTM is the standard.
      </p>

      <LSTMGates />

      {/* ── Section 4: Gated Recurrent Unit ─────────────────────────────── */}
      <div id="gated-recurrent-unit">
        <SectionTitle>Gated Recurrent Unit</SectionTitle>
      </div>

      <p style={prose}>
        The GRU simplifies the LSTM's three gates and separate cell state down to
        two gates — a reset gate and an update gate — merging the cell state and
        hidden state into one. This reduces
        parameter count by roughly 25% while achieving comparable performance on
        most sequence modeling tasks. Before transformers, GRUs and LSTMs were the
        default architecture for anything sequential.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  r_t &= \\sigma\\bigl(W_r \\cdot [h_{t-1}, x_t]\\bigr) \\\\
  z_t &= \\sigma\\bigl(W_z \\cdot [h_{t-1}, x_t]\\bigr) \\\\
  \\tilde{h}_t &= \\tanh\\bigl(W \\cdot [r_t \\odot h_{t-1}, x_t]\\bigr) \\\\
  h_t &= (1 - z_t) \\odot h_{t-1} + z_t \\odot \\tilde{h}_t
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Cho, van Merrienboer, Bahdanau & Bengio introduced the GRU in 2014 specifically
        for neural machine translation. It collapses LSTM's cell state and hidden state
        into a single representation, and merges the forget and input gates into a
        single <em>update gate</em> <InlineMath>{"z_t"}</InlineMath> that interpolates between the previous
        hidden state and a candidate. With one fewer gate and no separate cell state,
        the GRU uses roughly 25% fewer parameters than a comparably-sized LSTM. Chung,
        Gulcehre, Cho & Bengio (2014) [3] benchmarked the two empirically across
        polyphonic music modeling and speech signal modeling — GRU and LSTM performed
        comparably on most tasks, with LSTM slightly favored for very long-range
        dependencies and GRU slightly favored when training data was limited. The
        practical advice that emerged: try GRU first because it's cheaper; fall back to
        LSTM if you have evidence you need the extra capacity.
      </p>

      <p style={prose}>
        The peak of RNNs was seq2seq [4] [5]. The most influential application of LSTM
        and GRU architectures was the encoder-decoder seq2seq model. Sutskever, Vinyals
        & Le (2014) [4] showed that a deep LSTM encoder could compress an entire source
        sentence into a single fixed-size context vector, which a separate LSTM decoder
        then unrolled into the target sentence — without any explicit alignment between
        source and target. Cho et al. [5] developed a parallel RNN-based encoder-decoder
        for machine translation in the same year. These models reached competitive
        translation quality and dominated NMT for several years. They also exposed the
        limitation that motivated the next major architectural shift: compressing a full
        sentence into one vector creates a bottleneck that worsens with sequence length.
        Chapter 9 picks up exactly here, with the attention mechanism (Bahdanau, Cho &
        Bengio 2015) that broke the bottleneck — and, by 2017, replaced the recurrence
        entirely.
      </p>

      <Seq2SeqEncoderDecoder />

      <GRUvsLSTM />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
