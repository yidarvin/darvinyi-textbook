import { useTocSections } from "../../components/layout/TocContext";
import { buildCitations } from "../../data/citations";
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

const CITATIONS = buildCitations([
  { title: "Long Short-Term Memory", authors: "Hochreiter, Schmidhuber", venue: "Neural Computation", year: "1997", tag: "seminal" },
  { title: "Learning Long-Term Dependencies with Gradient Descent is Difficult", authors: "Bengio, Simard, Frasconi", venue: "IEEE Transactions on Neural Networks", year: "1994", tag: "seminal" },
  { title: "Empirical Evaluation of Gated Recurrent Neural Networks on Sequence Modeling", authors: "Chung, Gulcehre, Cho, Bengio", venue: "NeurIPS Workshop", year: "2014", tag: "paper" },
  { title: "Sequence to Sequence Learning with Neural Networks", authors: "Sutskever, Vinyals, Le", venue: "NeurIPS", year: "2014", tag: "seminal" },
  { title: "Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation", authors: "Cho, van Merrienboer, Gulcehre, Bahdanau, Bougares, Schwenk, Bengio", venue: "EMNLP", year: "2014", tag: "seminal" },
  { title: "On the Properties of Neural Machine Translation: Encoder-Decoder Approaches", authors: "Cho, van Merrienboer, Bahdanau, Bengio", venue: "EMNLP Workshop (SSST-8)", year: "2014", tag: "paper" },
  { title: "On the Difficulty of Training Recurrent Neural Networks", authors: "Pascanu, Mikolov, Bengio", venue: "ICML", year: "2013", tag: "seminal" },
  { title: "Learning to Forget: Continual Prediction with LSTM", authors: "Gers, Schmidhuber, Cummins", venue: "Neural Computation", year: "2000", tag: "seminal" },
  { title: "Efficiently Modeling Long Sequences with Structured State Spaces (S4)", authors: "Gu, Goel, Ré", venue: "ICLR", year: "2021", tag: "paper" },
  { title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces", authors: "Gu, Dao", venue: "arXiv", year: "2023", tag: "paper" },
  { title: "xLSTM: Extended Long Short-Term Memory", authors: "Beck, Pöppel, Spanring, Auer, Prudnikova, Kopp, Klambauer, Brandstetter, Hochreiter", venue: "NeurIPS", year: "2024", tag: "paper" },
]);

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
        Here <InlineMath>{"W_x"}</InlineMath> and <InlineMath>{"W_h"}</InlineMath> are
        the input-to-hidden and hidden-to-hidden weight matrices and <InlineMath>{"b"}</InlineMath> is
        a bias — all three shared across every timestep, whether the input sequence
        has 5 tokens or 500.
      </p>

      <p style={prose}>
        A recurrent network can be configured for several distinct task shapes depending
        on where inputs are read and outputs are produced along the unrolled chain. The
        diagram below opens with a <em>one-to-one</em> panel — an ordinary feedforward
        classifier with no recurrence at all — shown only as a non-recurrent baseline for
        contrast with the four task shapes that actually use the recurrence.
        <em> One-to-many</em>: a single input produces a sequence (image → caption).
        <em> Many-to-one</em>: a sequence produces a single output (review text →
        sentiment label). <em>Many-to-many, aligned</em>: a sequence produces a
        same-length sequence (part-of-speech tagging, where each input token gets its
        own output). <em>Many-to-many, unaligned</em>, also called seq2seq: a sequence
        produces a different-length sequence (French → English translation). The
        recurrence itself is identical across all four; only the input/output schedule
        differs.
      </p>

      <RNNSequenceModes />

      <p style={prose}>
        A hidden state by itself does not train a network — every recurrent model
        also needs an output layer that turns <InlineMath>{"h_t"}</InlineMath> into
        a prediction, and a loss that scores how good that prediction was. The usual
        choice is a linear projection followed by <b>softmax</b> — a function that
        turns a vector of raw scores (logits) into a probability distribution, every
        entry between 0 and 1 and all of them summing to 1 — giving a predicted
        distribution <InlineMath>{"y_t"}</InlineMath> at each timestep. Training
        minimizes <b>cross-entropy</b> — the loss that scores how much probability
        the model assigned to the correct answer, penalizing confident wrong
        predictions most heavily — between each <InlineMath>{"y_t"}</InlineMath> and
        the true label <InlineMath>{"\\hat{y}_t"}</InlineMath>, summed across the
        sequence.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  y_t &= \\text{softmax}\\bigl(V h_t + c\\bigr) \\\\
  \\mathcal{L} &= \\sum_{t=1}^{T} \\text{CE}\\bigl(y_t, \\hat{y}_t\\bigr)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"V"}</InlineMath> and <InlineMath>{"c"}</InlineMath> are
        the output layer's weight matrix and bias, shared across every timestep just
        like <InlineMath>{"W_x"}</InlineMath>, <InlineMath>{"W_h"}</InlineMath>, and{" "}
        <InlineMath>{"b"}</InlineMath> above, and <InlineMath>{"\\mathcal{L}"}</InlineMath> is
        the total loss over the sequence — the quantity that backpropagation through
        time, covered next, differentiates with respect to every shared weight.
      </p>

      <p style={prose}>
        A standard RNN reads strictly left-to-right, so at timestep <InlineMath>{"t"}</InlineMath> the hidden state{" "}
        <InlineMath>{"h_t"}</InlineMath> encodes only the <em>past</em>. For tasks where the future is also
        informative — named entity recognition, machine translation, speech recognition
        — a bidirectional RNN runs two recurrences in parallel, one forward and one
        backward, and concatenates their hidden states. Each token gets a representation
        that has seen the entire sequence. Bidirectional LSTMs were the workhorse of NLP
        from roughly 2014 until transformers displaced them.
      </p>

      <p style={prose}>
        Step through the core recurrence itself below. Switch to the "Alternating"
        preset, where the input flips between +0.9 and −0.9 every timestep, and press
        "Step →" through all eight steps; notice the hidden state never goes negative
        — it settles into an oscillation between roughly 0.57 and 0.02, because the
        +0.1 bias and the carried-over previous hidden state keep the tanh input
        positive even on the steps where <InlineMath>{"x_t = -0.9"}</InlineMath>.
      </p>

      <RNNUnrolled
        tryThis={{
          do: 'Switch to the "Alternating" preset (input flips between +0.9 and −0.9 every step) and press "Step →" through all eight timesteps.',
          notice: 'The hidden state never goes negative. It settles into an oscillation between about 0.57 and 0.02, because the +0.1 bias and the carried-over previous hidden state keep the tanh input positive even on the steps where x_t = −0.9.',
        }}
      />

      {/* ── Section 2: Vanishing & Exploding Gradients ───────────────────── */}
      <div id="vanishing-exploding-gradients">
        <SectionTitle>Vanishing & Exploding Gradients</SectionTitle>
      </div>

      <p style={prose}>
        Training the loss defined above requires knowing how it changes with respect
        to <InlineMath>{"W_x"}</InlineMath>, <InlineMath>{"W_h"}</InlineMath>, and{" "}
        <InlineMath>{"b"}</InlineMath> — but those same three matrices are reused at
        every timestep, so a change to <InlineMath>{"W_h"}</InlineMath> ripples through
        every hidden state computed from that point onward, not just one.{" "}
        <b>Backpropagation through time</b> (BPTT) handles this by unrolling the
        recurrence for all <InlineMath>{"T"}</InlineMath> steps into one long
        feedforward computation graph — one copy of the recurrent cell per timestep,
        with weights tied across copies — and then running ordinary backpropagation
        through that unrolled graph. The gradient flows backward from the loss
        through the chain of hidden states <InlineMath>{"h_T, h_{T-1}, \\ldots, h_0"}</InlineMath>, and
        because <InlineMath>{"W_x"}</InlineMath>, <InlineMath>{"W_h"}</InlineMath>,
        and <InlineMath>{"b"}</InlineMath> are the literal same matrices at every
        step, the gradient contribution each timestep produces for them is simply
        summed across the whole sequence to get the final gradient used for the
        update.
      </p>

      <p style={prose}>
        Whether that summed gradient signal survives the trip back to early
        timesteps comes down to repeated multiplication. Multiplying a number by 0.9
        a hundred times shrinks it to under a ten-thousandth of its size;
        multiplying by 1.1 a hundred times blows it up more than ten-thousand-fold.
        BPTT performs exactly this kind of repeated multiplication on the gradient
        signal, once per timestep it travels backward through, and the multiplier is
        governed by <InlineMath>{"W_h"}</InlineMath>. If the spectral
        radius <InlineMath>{"\\rho(W_h)"}</InlineMath> — the largest eigenvalue
        magnitude of the recurrent weight matrix, roughly how much it stretches or
        shrinks a vector on each application — is below 1, gradients shrink
        exponentially with the number of steps propagated, and the network
        effectively cannot learn dependencies beyond a handful of steps. If{" "}
        <InlineMath>{"\\rho(W_h)"}</InlineMath> is above 1, gradients <em>can</em> explode
        — but this is necessary, not sufficient: as the equation below shows, each
        step's gradient is also multiplied by <InlineMath>{"\\text{diag}(\\tanh'(z_k))"}</InlineMath>,
        and every entry of <InlineMath>{"\\tanh'"}</InlineMath> is at most 1, so if
        the recurrent units are driven into saturation this term can suppress the
        gradient back toward zero even when <InlineMath>{"\\rho(W_h) > 1"}</InlineMath>.
        A network can have an unstable recurrent matrix and still show vanishing,
        not exploding, gradients in practice. This instability is not a training
        artifact; it is a fundamental consequence of the recurrent structure.
      </p>

      <MathBlock>{"$$\\frac{\\partial L}{\\partial h_0} = \\frac{\\partial L}{\\partial h_t} \\cdot \\prod_{k=1}^{t} \\text{diag}\\bigl(\\tanh'(z_k)\\bigr) W_h$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\text{diag}(\\tanh'(z_k))"}</InlineMath> is a diagonal
        matrix of the tanh derivative evaluated at timestep <InlineMath>{"k"}</InlineMath>'s
        pre-activation — each diagonal entry lies between 0 and 1 — and the gradient
        reaching <InlineMath>{"h_0"}</InlineMath> is the product of{" "}
        <InlineMath>{"t"}</InlineMath> such factors, each paired with another
        multiplication by <InlineMath>{"W_h"}</InlineMath>.
      </p>

      <p style={prose}>
        Bengio et al. (1994) [2] gave the first rigorous proof of the vanishing side
        of this argument: that whenever <InlineMath>{"\\rho(W_h) < 1"}</InlineMath>,
        gradients in a standard recurrent network decay exponentially with the
        number of steps propagated, making long-range dependencies essentially
        unlearnable by gradient descent without architectural intervention. (The
        exploding side is the informal mirror image, and — as the{" "}
        <InlineMath>{"\\tanh'"}</InlineMath> factors above show — is not guaranteed
        by <InlineMath>{"\\rho(W_h) > 1"}</InlineMath> alone.) The "sweet spot" of{" "}
        <InlineMath>{"\\rho = 1"}</InlineMath> is a measure-zero set — generic
        initialization lands the network on one side or the other. This is why the
        next two sections exist: LSTM and GRU are architectural fixes, not
        optimization tweaks.
      </p>

      <GradientMagnitudeOverTime />

      <p style={prose}>
        Three practical mitigations pre-date the LSTM solution and are still used today.
        <em> Gradient clipping</em> (Pascanu et al. (2013) [7], covered in Chapter 5)
        bounds gradient norms to prevent explosion. <em>Truncated BPTT</em> limits how
        far back gradients are propagated — typically 20–50 steps — accepting a biased
        estimator in exchange for tractability and bounded memory.
        <em> Orthogonal weight initialization</em> sets the recurrent matrix <InlineMath>{"W_h"}</InlineMath>{" "}
        to a random orthogonal matrix (spectral radius exactly 1) at initialization,
        delaying the vanishing/exploding problem by many steps. None of these solve the
        problem completely; together they let a vanilla RNN train, slowly, on
        dependencies of perhaps 30–50 timesteps.
      </p>

      <p style={prose}>
        Drag the spectral radius slider down to about 0.5, leaving the sequence
        length near its default of 20; watch the dashed "RNN vanishes at t=…" marker
        appear well inside the plotted window, while the LSTM curve — still governed
        by the default forget gate of 0.95 — never crosses the 1e-4 threshold
        anywhere in the same range. Push the slider above 1.0 instead, and an
        "exploding" marker appears on the RNN curve: the other side of the same
        instability.
      </p>

      <VanishingGradient
        tryThis={{
          do: 'Drag the spectral radius slider down to about 0.5, leaving sequence length near its default of 20.',
          notice: 'The dashed "RNN vanishes at t=…" marker appears well inside the window, while the LSTM curve — still governed by the default forget gate of 0.95 — never crosses the 1e-4 threshold anywhere in the same range. Push the slider above 1.0 instead and an "exploding" marker appears on the RNN curve.',
        }}
      />

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
        Here <InlineMath>{"f_t"}</InlineMath>, <InlineMath>{"i_t"}</InlineMath>,
        and <InlineMath>{"o_t"}</InlineMath> are the forget, input, and output gates
        — each a sigmoid producing values between 0 and 1 that act as soft,
        per-dimension switches — <InlineMath>{"\\tilde{c}_t"}</InlineMath> is the
        candidate cell contents, <InlineMath>{"c_t"}</InlineMath> is the cell state,{" "}
        <InlineMath>{"h_t"}</InlineMath> is the hidden state exposed to the rest of
        the network, and <InlineMath>{"[h_{t-1}, x_t]"}</InlineMath> denotes the
        previous hidden state concatenated with the current input, fed through each
        gate's own weight matrix (<InlineMath>{"W_f"}</InlineMath>,{" "}
        <InlineMath>{"W_i"}</InlineMath>, <InlineMath>{"W_c"}</InlineMath>, or{" "}
        <InlineMath>{"W_o"}</InlineMath>).
      </p>

      <p style={prose}>
        A single numeric pass makes the gate mechanics concrete. Suppose at some
        timestep the forget gate's pre-activation drives it
        to <InlineMath>{"f_t \\approx 0.90"}</InlineMath>, the input gate's
        pre-activation drives it to <InlineMath>{"i_t \\approx 0.12"}</InlineMath>,
        the candidate is <InlineMath>{"\\tilde{c}_t \\approx 0.46"}</InlineMath>, and
        the incoming cell state is <InlineMath>{"c_{t-1} = 0.80"}</InlineMath>. The
        new cell state is <InlineMath>{"c_t = 0.90 \\times 0.80 + 0.12 \\times 0.46 \\approx 0.78"}</InlineMath> —
        dominated by the old value carried in almost unchanged, with only a small
        nudge from the candidate. If the output gate is mostly
        open, <InlineMath>{"o_t \\approx 0.82"}</InlineMath>, the hidden state
        becomes <InlineMath>{"h_t = 0.82 \\times \\tanh(0.78) \\approx 0.54"}</InlineMath>.
        A forget gate near 1 does exactly what the paragraph above described: it
        preserves the old cell state almost additively, while a small input gate
        keeps new information from overwriting it.
      </p>

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
        could not forget irrelevant history. Gers et al. (2000) [8] added
        the forget gate three years later, and it became universal. Modern LSTM
        implementations always include it; what we call "the LSTM" today is actually the
        2000 variant. Other minor variants exist (peephole connections, projection
        layers), but the forget-gated LSTM is the standard.
      </p>

      <p style={prose}>
        Select preset A ("Remember & Forget") and drag the timestep slider to{" "}
        <InlineMath>{"t=3"}</InlineMath>, where the forget gate crashes to 0.08 while
        the input gate spikes to 0.88 in the same step; notice the cell-state reading
        in the stats panel barely moves across that transition, because the input
        gate's simultaneous write refills almost exactly what the crashed forget gate
        just cleared.
      </p>

      <LSTMGates
        tryThis={{
          do: 'Select preset A ("Remember & Forget") and drag the timestep slider to t=3.',
          notice: "The forget gate crashes to 0.08 exactly as the input gate spikes to 0.88 — but the cell-state reading in the stats panel barely moves across that step, since the input gate's simultaneous write refills almost exactly what the crash just cleared.",
        }}
      />

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
        Here <InlineMath>{"r_t"}</InlineMath> is the reset gate, <InlineMath>{"z_t"}</InlineMath> is
        the update gate — both sigmoid outputs between 0 and 1 —{" "}
        <InlineMath>{"\\tilde{h}_t"}</InlineMath> is the candidate hidden state, and{" "}
        <InlineMath>{"[r_t \\odot h_{t-1}, x_t]"}</InlineMath> concatenates the
        reset-modulated previous state with the current input before the shared
        weight matrix <InlineMath>{"W"}</InlineMath> is applied; unlike the LSTM,
        there is no separate cell state — <InlineMath>{"h_t"}</InlineMath> itself
        carries memory forward.
      </p>

      <p style={prose}>
        Cho et al. (2014) [5] introduced the GRU in the same paper that introduced
        the RNN encoder-decoder for machine translation, described below — the two
        contributions share a single paper rather than two separate ones. The GRU
        collapses the LSTM's cell state and hidden state into a single
        representation, and merges the forget and input gates into a
        single <em>update gate</em> <InlineMath>{"z_t"}</InlineMath> that interpolates between the previous
        hidden state and a candidate. With one fewer gate and no separate cell state,
        the GRU uses roughly 25% fewer parameters than a comparably-sized LSTM. Chung
        et al. (2014) [3] benchmarked the two empirically across
        polyphonic music modeling and speech signal modeling — GRU and LSTM performed
        comparably on most tasks, with LSTM slightly favored for very long-range
        dependencies and GRU slightly favored when training data was limited. The
        practical advice that emerged: try GRU first because it's cheaper; fall back
        to LSTM when there is evidence the extra capacity is needed.
      </p>

      <p style={prose}>
        Run the "Step" preset through both cells below and press "▶ Animate";
        notice the highlighted band a few steps in, where the LSTM and GRU hidden
        states diverge most as each cell's gates settle into their steady-state
        response to the constant input — a difference driven by their different
        gating mechanics, not by the sign flip at <InlineMath>{"t=10"}</InlineMath>{" "}
        itself. Compare how few parameters (right panel) the GRU needs to reach a
        similar trajectory.
      </p>

      <GRUvsLSTM
        tryThis={{
          do: 'Switch to the "Step" preset and press "▶ Animate" to watch both cells settle into the constant input, then process the sign flip at t=10.',
          notice: "The highlighted band marks the timestep where the LSTM and GRU hidden states diverge most — during the initial ramp-up, a few steps in, not at the later sign flip — a difference driven by their different gating mechanics; the stats panel on the right shows the GRU reaching a comparable trajectory with roughly 25% fewer parameters.",
        }}
      />

      <p style={prose}>
        The most influential application of LSTM and GRU architectures was the
        encoder-decoder sequence-to-sequence (seq2seq) model, introduced
        independently by two groups in 2014. Sutskever et al. (2014) [4] showed that
        a deep LSTM encoder could compress an entire source sentence into a single
        fixed-size context vector, which a separate LSTM decoder then unrolled into
        the target sentence, one token at a time, without any explicit alignment
        between source and target. Cho et al. (2014) [5] — the same paper that
        introduced the GRU above — built essentially the same encoder-decoder
        pattern: an RNN encoder compresses the source sentence into a fixed vector,
        and an RNN decoder generates the target sentence from it. Both reached
        competitive translation quality, and the pattern dominated neural machine
        translation for the next several years.
      </p>

      <p style={prose}>
        Training a decoder that generates one token at a time raises a practical
        question: what does the decoder read as its "previous token" while training?
        The standard answer is <b>teacher forcing</b> — the decoder is fed the
        ground-truth previous token from the training pair at every step, rather
        than whatever token it just predicted itself. This keeps training stable,
        since the decoder's own early predictions are close to random and would
        otherwise compound into nonsense a few tokens in. At inference time there is
        no ground truth to feed, so the decoder runs autoregressively instead: each
        generated token becomes the next step's input. That training/inference
        mismatch is called <b>exposure bias</b> — a decoder trained only ever to
        continue a near-perfect prefix can struggle to recover once its own mistakes
        put it somewhere it never saw during training.
      </p>

      <p style={prose}>
        These models also exposed the limitation that motivated the next
        architectural shift. In a companion paper the same year, Cho et al. (2014)
        [6] showed that encoder-decoder translation quality degrades sharply as the
        source sentence grows longer and contains more unfamiliar words — direct
        evidence that compressing an entire sentence into one fixed-size vector
        creates a bottleneck that worsens with sequence length, no matter how large
        the encoder is made.
      </p>

      <p style={prose}>
        Beyond the bottleneck, recurrence carries a second, more practical cost:
        computing <InlineMath>{"h_t"}</InlineMath> requires <InlineMath>{"h_{t-1}"}</InlineMath> first,
        so an RNN — encoder or decoder — cannot process a sequence's timesteps in
        parallel; every step must wait for the one before it, on hardware built to
        run thousands of independent operations at once. Attention (Chapter 9)
        removes both restrictions together: every output position can attend
        directly to every input position instead of funneling through one fixed
        vector, and every position's attention computation can run simultaneously.
        That combination — no bottleneck, no sequential wait — is why transformers
        scaled past RNNs and, by 2017, replaced the recurrence entirely.
      </p>

      <Seq2SeqEncoderDecoder />

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        What carries forward is less a single equation than a habit of mind: gating
        — a learned, per-dimension decision about what to keep and what to
        overwrite — is the general mechanism this chapter introduces for making a
        fixed-size summary trainable over long ranges, and some version of it
        resurfaces in nearly every architecture built to manage state over time. The
        vanishing-gradient diagnosis itself is just repeated multiplication by a
        number less than one, here evaluated through <InlineMath>{"W_h"}</InlineMath>'s
        spectral radius, and the same diagnostic habit will recur elsewhere in this
        book. Both of this chapter's two costs — the fixed context-vector bottleneck
        and the sequential-computation limit — are exactly what attention was built
        to remove, and Chapter 9 picks up there directly, replacing the fixed
        context vector with a mechanism that lets every output position look at
        every input position in parallel. State-space models such as S4 (Gu, Goel & Ré
        (2021) [9]), its selective successor Mamba (Gu & Dao (2023) [10]), RWKV, and
        xLSTM (Beck et al. (2024) [11]) later revisit recurrence itself, using training
        tricks that make that sequential computation parallelizable again — Chapter 17
        covers this revival in full.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
