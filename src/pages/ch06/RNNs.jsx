import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import RNNUnrolled from "../../components/widgets/ch06/RNNUnrolled";
import VanishingGradient from "../../components/widgets/ch06/VanishingGradient";
import LSTMGates from "../../components/widgets/ch06/LSTMGates";
import GRUvsLSTM from "../../components/widgets/ch06/GRUvsLSTM";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Long Short-Term Memory", authors: "Hochreiter & Schmidhuber", venue: "Neural Computation", year: "1997", tag: "seminal" },
  { num: "[2]", title: "Learning Long-Term Dependencies with Gradient Descent is Difficult", authors: "Bengio, Simard, Frasconi", venue: "IEEE Transactions on Neural Networks", year: "1994", tag: "seminal" },
  { num: "[3]", title: "Empirical Evaluation of Gated Recurrent Neural Networks on Sequence Modeling", authors: "Chung, Gulcehre, Cho, Bengio", venue: "NeurIPS Workshop", year: "2014", tag: "paper" },
  { num: "[4]", title: "Sequence to Sequence Learning with Neural Networks", authors: "Sutskever, Vinyals, Le", venue: "NeurIPS", year: "2014", tag: "seminal" },
  { num: "[5]", title: "On the Properties of Neural Machine Translation: Encoder-Decoder Approaches", authors: "Cho, van Merrienboer, Bahdanau, Bengio", venue: "EMNLP Workshop", year: "2014", tag: "paper" },
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
        Chapter 06 · Part II — Architectures
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
        At each timestep t, an RNN reads the current input x<sub>t</sub> and the previous hidden
        state h<sub>t-1</sub>, producing a new hidden state h<sub>t</sub>. The same weight matrices are
        reused at every timestep — the network processes sequences of arbitrary length
        with a fixed parameter count. This parameter sharing is both the elegance and
        the limitation of vanilla RNNs.
      </p>

      <MathBlock>{"ht = tanh( Wx·xt + Wh·ht-1 + b )"}</MathBlock>

      <RNNUnrolled />

      {/* ── Section 2: Vanishing & Exploding Gradients ───────────────────── */}
      <div id="vanishing-exploding-gradients">
        <SectionTitle>Vanishing & Exploding Gradients</SectionTitle>
      </div>

      <p style={prose}>
        Backpropagation through time multiplies gradient signals by W<sub>h</sub> at each
        timestep. If the spectral radius ρ(W<sub>h</sub>) &lt; 1, gradients shrink exponentially —
        the network cannot learn dependencies beyond a few steps. If ρ(W<sub>h</sub>) &gt; 1,
        gradients explode. This instability is not a training artifact; it is a
        fundamental consequence of the recurrent structure.
      </p>

      <MathBlock>{"dL/dh0 = dL/dht · ∏(k=1 to t) diag(tanh'(zk)) Wh"}</MathBlock>

      <VanishingGradient />

      {/* ── Section 3: Long Short-Term Memory ───────────────────────────── */}
      <div id="long-short-term-memory">
        <SectionTitle>Long Short-Term Memory</SectionTitle>
      </div>

      <p style={prose}>
        LSTMs replace the single hidden state with two: a cell state c<sub>t</sub> that flows
        through time with only additive interactions, and a hidden state h<sub>t</sub> gated
        by an output gate. Three learnable gates — forget, input, output — each
        controlled by a sigmoid, learn when to clear, write, and read the cell state.
        The forget gate is the key insight: by learning to preserve gradients
        multiplicatively near 1, the LSTM sidesteps vanishing gradients.
      </p>

      <MathBlock>
        {`ft = σ(Wf·[ht-1, xt] + bf)
it = σ(Wi·[ht-1, xt] + bi)
c̃t = tanh(Wc·[ht-1, xt] + bc)
ct = ft ⊙ ct-1 + it ⊙ c̃t
ot = σ(Wo·[ht-1, xt] + bo)
ht = ot ⊙ tanh(ct)`}
      </MathBlock>

      <LSTMGates />

      {/* ── Section 4: Gated Recurrent Unit ─────────────────────────────── */}
      <div id="gated-recurrent-unit">
        <SectionTitle>Gated Recurrent Unit</SectionTitle>
      </div>

      <p style={prose}>
        The GRU simplifies the LSTM from 4 gates to 2 — a reset gate and an update
        gate — and merges the cell state and hidden state into one. This reduces
        parameter count by roughly 25% while achieving comparable performance on
        most sequence modeling tasks. Before transformers, GRUs and LSTMs were the
        default architecture for anything sequential.
      </p>

      <MathBlock>
        {`rt = σ(Wr·[ht-1, xt])
zt = σ(Wz·[ht-1, xt])
h̃t = tanh(W·[rt ⊙ ht-1, xt])
ht = (1 - zt) ⊙ ht-1 + zt ⊙ h̃t`}
      </MathBlock>

      <GRUvsLSTM />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
