import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import MessagePassing from "../../components/widgets/ch13/MessagePassing";
import GraphAttention from "../../components/widgets/ch13/GraphAttention";
import NodeClassification from "../../components/widgets/ch13/NodeClassification";
import GraphVsGrid from "../../components/widgets/ch13/GraphVsGrid";
import MessagePassingStep from "../../components/diagrams/ch13/MessagePassingStep";
import GCNOverSmoothing from "../../components/diagrams/ch13/GCNOverSmoothing";
import GATLearnedWeights from "../../components/diagrams/ch13/GATLearnedWeights";
import ArchitectureUnification from "../../components/diagrams/ch13/ArchitectureUnification";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: "[1]", title: "Semi-Supervised Classification with Graph Convolutional Networks", authors: "Kipf & Welling", venue: "ICLR", year: "2017", tag: "seminal" },
  { num: "[2]", title: "Graph Attention Networks", authors: "Velickovic, Cucurull, Casanova, Romero, Lio, Bengio", venue: "ICLR", year: "2018", tag: "paper" },
  { num: "[3]", title: "Inductive Representation Learning on Large Graphs (GraphSAGE)", authors: "Hamilton, Ying, Leskovec", venue: "NeurIPS", year: "2017", tag: "paper" },
  { num: "[4]", title: "Neural Message Passing for Quantum Chemistry", authors: "Gilmer, Schütt, Riley, Vinyals, Dahl, Ghahramani", venue: "ICML", year: "2017", tag: "paper" },
  { num: "[5]", title: "How Powerful are Graph Neural Networks?", authors: "Xu, Hu, Leskovec, Jegelka", venue: "ICLR", year: "2019", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "graphs-and-message-passing",   label: "Message Passing" },
  { id: "graph-convolutional-networks", label: "GCN" },
  { id: "graph-attention-networks",     label: "GAT" },
  { id: "graph-vs-grid",                label: "Graph vs Grid" },
];

export default function GNNs() {
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
        Chapter 13 · Part IV — Other Architectures
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
        Graph Neural Networks
      </h1>

      <ChapterLede>
        Most data is not a grid. Social networks, molecules, citation graphs,
        and knowledge bases are relational structures where the connections between
        entities carry as much information as the entities themselves. Graph neural
        networks extend deep learning to these irregular structures through a
        simple and general framework: message passing. Each node aggregates
        information from its neighbors, updates its representation, and repeats —
        after k rounds, every node reflects its full k-hop neighborhood.
      </ChapterLede>

      {/* ── Section 1: Graphs & Message Passing ─────────────────────────────── */}
      <div id="graphs-and-message-passing">
        <SectionTitle>Graphs &amp; Message Passing</SectionTitle>
      </div>

      <p style={prose}>
        A graph <InlineMath>{"G = (V, E)"}</InlineMath> consists of nodes with
        feature vectors and edges defining pairwise relationships. The message
        passing framework is elegant in its generality: at each round{" "}
        <InlineMath>{"\\ell"}</InlineMath>, every node{" "}
        <InlineMath>v</InlineMath> aggregates messages from its neighbors{" "}
        <InlineMath>{"\\mathcal{N}(v)"}</InlineMath>, then updates its own
        representation using the aggregated message and its current state. The
        aggregation function — sum, mean, or max — and the update function
        together define the GNN variant. After <InlineMath>k</InlineMath>{" "}
        rounds, <InlineMath>{"h_v^{(k)}"}</InlineMath> encodes the full
        structure of <InlineMath>v</InlineMath>'s{" "}
        <InlineMath>k</InlineMath>-hop neighborhood.
      </p>

      <p style={prose}>
        Gilmer, Schütt, Riley, Vinyals, Dahl, and Ghahramani [4] made a
        striking observation in 2017: nearly every graph neural network in the
        literature could be cast in the same two-step{" "}
        <em>message-passing</em> template — aggregate from neighbors, then
        update. GCN, GAT, GraphSAGE, Interaction Networks, and dozens of others
        differ only in their choice of message function, aggregation function
        (sum, mean, max, or attention-weighted), and update function (MLP, GRU,
        or concatenate-then-linear). This was the field's "transformer-block
        moment": once everything fits one abstraction, the architectural design
        space collapses to a small set of orthogonal choices. The paper's
        specific application — predicting quantum-chemical properties of small
        molecules — became a canonical GNN benchmark, and message-passing
        networks remain the state of the art for molecular property prediction
        today.
      </p>

      <p style={prose}>
        Early GNNs like GCN were <em>transductive</em>: they trained on a
        single fixed graph and learned representations tied to the specific
        node identities in that graph. Adding a new node required retraining.
        Hamilton, Ying, and Leskovec [3] introduced <strong>GraphSAGE</strong>{" "}
        — Sample And aGgrEgate — as an inductive alternative. Instead of
        learning a representation for each specific node, GraphSAGE learns a{" "}
        <em>function</em> that produces representations from a node's features
        and a sampled subset of its neighbors. The same learned function
        applies to new nodes and even new graphs. GraphSAGE also addressed
        scalability: for very large graphs where a node might have thousands of
        neighbors, sampling a fixed-size subset (e.g., 25 random neighbors)
        keeps message passing tractable. Production GNN systems at scale —
        Pinterest's PinSAGE, large-scale recommendation graphs — are
        descendants of this work.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  m_v^{(\\ell)} &= \\text{AGGREGATE}\\!\\left(\\{ h_u^{(\\ell-1)} : u \\in \\mathcal{N}(v) \\}\\right) \\\\
  h_v^{(\\ell)} &= \\text{UPDATE}\\!\\left(h_v^{(\\ell-1)},\\ m_v^{(\\ell)}\\right)
\\end{aligned}$$`}</MathBlock>

      <MessagePassingStep />

      <MessagePassing />

      {/* ── Section 2: Graph Convolutional Networks ──────────────────────────── */}
      <div id="graph-convolutional-networks">
        <SectionTitle>Graph Convolutional Networks</SectionTitle>
      </div>

      <p style={prose}>
        GCN defines message passing as a normalized spectral graph convolution.
        Each node's new representation is a weighted sum of its neighbors'
        current features, normalized by the square root of their degrees. This
        normalization prevents nodes with many neighbors from dominating — a
        node with 100 neighbors does not simply receive{" "}
        <InlineMath>{"100\\times"}</InlineMath> the signal of a node with one
        neighbor. Stacking <InlineMath>k</InlineMath> GCN layers gives each
        node access to a <InlineMath>k</InlineMath>-hop neighborhood.
      </p>

      <p style={prose}>
        GCN (Kipf &amp; Welling, 2017 [1]) is best understood as a first-order
        Taylor approximation to a spectral graph convolution. The "proper" form
        of graph convolution uses the eigendecomposition of the graph
        Laplacian and is computationally prohibitive — eigendecomposing a graph
        with <InlineMath>{"|V|"}</InlineMath> nodes is{" "}
        <InlineMath>{"\\mathcal{O}(|V|^3)"}</InlineMath>. Kipf and Welling
        showed that under specific approximations — restrict to first-order
        Chebyshev polynomials, share the renormalization trick across input
        and output — the spectral convolution collapses to the simple
        multiplication-by-normalized-adjacency form shown below. The result is
        computationally cheap, conceptually clean ("aggregate from neighbors,
        normalize by degree"), and connects classical spectral graph theory to
        modern deep learning. The degree normalization{" "}
        <InlineMath>{"\\tilde{D}^{-1/2}\\,\\tilde{A}\\,\\tilde{D}^{-1/2}"}</InlineMath>{" "}
        is what prevents high-degree nodes from dominating the aggregated
        signal.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  H^{(\\ell+1)} &= \\sigma\\!\\left(\\tilde{D}^{-1/2}\\, \\tilde{A}\\, \\tilde{D}^{-1/2}\\, H^{(\\ell)}\\, W^{(\\ell)}\\right) \\\\
  &\\text{where}\\ \\tilde{A} = A + I,\\ \\ \\tilde{D} = \\text{degree matrix of } \\tilde{A}
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Stacking GCN layers seems like a natural way to give each node access
        to a deeper neighborhood, but in practice GCN performance degrades
        sharply beyond two or three layers. The cause is{" "}
        <strong>over-smoothing</strong>: with each layer, every node's
        representation becomes a weighted average of an increasingly large
        region. In the limit, all node representations within a connected
        component converge to the same vector — completely losing the ability
        to distinguish nodes. Theoretical analyses (Li, Han &amp; Wu, 2018)
        showed this is intrinsic to GCN's averaging mechanism. The practical
        implication is severe: GNN depth has been roughly capped at 2–3 layers
        for most applications, in stark contrast to CNNs and transformers
        where deeper is almost always better. Skip connections, edge dropout,
        and explicit residual reasoning all partially mitigate but do not
        fully solve it.
      </p>

      <GCNOverSmoothing />

      <GraphAttention />

      {/* ── Section 3: Graph Attention Networks ─────────────────────────────── */}
      <div id="graph-attention-networks">
        <SectionTitle>Graph Attention Networks</SectionTitle>
      </div>

      <p style={prose}>
        GCN assigns equal normalized weight to all neighbors. Graph Attention
        Networks (GAT) learn attention coefficients over neighbors, allowing
        each node to weight the importance of its neighbors dynamically based
        on their features. The attention mechanism is closely related to the
        scaled dot-product attention from transformers, applied to node
        feature pairs. Multi-head attention can be used here too, with heads
        concatenated or averaged at the output.
      </p>

      <p style={prose}>
        GCN's degree-normalized averaging treats all neighbors as equally
        informative within the normalization. For citation networks or
        molecular bonds, this often misses what matters — some neighbors are
        far more relevant than others. Velickovic, Cucurull, Casanova, Romero,
        Lio, and Bengio [2] introduced GAT in 2018 to learn neighbor importance
        from data. The attention coefficient{" "}
        <InlineMath>{"\\alpha_{ij}"}</InlineMath> is computed from the features
        of nodes <InlineMath>i</InlineMath> and <InlineMath>j</InlineMath> via
        a small learned function, softmaxed across all neighbors of{" "}
        <InlineMath>i</InlineMath>. The functional form differs slightly from
        transformer attention — GAT uses concatenation plus a learned vector
        and LeakyReLU, where transformers use scaled dot product — but the
        principle is identical: the network learns how much to weight each
        interaction. Multi-head attention works in GAT exactly as in
        transformers, with heads concatenated or averaged at the output.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\alpha_{ij} &= \\text{softmax}_j\\!\\left(\\text{LeakyReLU}\\!\\left(\\vec{a}^{\\,\\top}\\, [W h_i \\,\\Vert\\, W h_j]\\right)\\right) \\\\
  h_i' &= \\sigma\\!\\left(\\sum_{j \\in \\mathcal{N}(i)} \\alpha_{ij}\\, W h_j\\right)
\\end{aligned}$$`}</MathBlock>

      <GATLearnedWeights />

      <p style={prose}>
        This connection between GAT and self-attention is worth making
        explicit, because it sets up the next section. A transformer
        self-attention layer is structurally a GAT applied to a{" "}
        <em>complete graph</em> — one where every token is connected to every
        other token. <InlineMath>{"Q,\\ K,\\ V"}</InlineMath> projections
        produce node-specific embeddings; the softmax-normalized attention
        weights are exactly the <InlineMath>{"\\alpha_{ij}"}</InlineMath>{" "}
        coefficients; the weighted sum of <InlineMath>V</InlineMath> is the
        message aggregation. The only differences are that transformers add
        positional encoding (since the complete graph has no inherent
        geometry) and use scaled dot product instead of GAT's additive form.
        Once you see this equivalence, the question shifts from "should I use
        a GNN or a transformer?" to "what graph structure should my model
        attend over?"
      </p>

      <NodeClassification />

      {/* ── Section 4: Graph vs Grid — CNN as a Special Case ─────────────────── */}
      <div id="graph-vs-grid">
        <SectionTitle>Graph vs Grid — CNN as a Special Case</SectionTitle>
      </div>

      <p style={prose}>
        A convolutional neural network is a graph neural network applied to a
        grid graph. Each pixel is a node. Its eight immediate neighbors are
        connected by edges. The convolution kernel weights correspond to the
        message weights for each neighbor direction. Weight sharing in CNNs —
        the same kernel everywhere — is equivalent to using identical
        aggregation weights at every node in the graph. Understanding CNNs as
        a special case of GNNs shows why GNNs generalize to arbitrary
        topologies.
      </p>

      <p style={prose}>
        The CNN-as-grid-graph framing extends to almost every architecture in
        this book. <strong>RNN</strong>: a chain graph where each node connects
        only to the next position — message passing along a single path.{" "}
        <strong>CNN</strong>: a 2D grid graph where each pixel connects to its
        local neighbors, with weight sharing across positions.{" "}
        <strong>Transformer</strong>: a complete graph where every node
        connects to every other node, with learned attention weights.{" "}
        <strong>GNN</strong>: an arbitrary graph topology, with learned
        attention or fixed aggregation. From this vantage point, every
        architecture is "message passing on a graph" — what differs is which
        graph and what aggregation function. This unification was made fully
        explicit by the Geometric Deep Learning program (Bronstein, Bruna,
        Cohen &amp; Velickovic, 2021), which framed GNNs, CNNs, and
        transformers as instances of equivariant operations on different
        geometric domains (graphs, grids, sets, manifolds).
      </p>

      <ArchitectureUnification />

      <p style={prose}>
        Even with the right structure, GNNs have intrinsic representational
        limits. Xu, Hu, Leskovec, and Jegelka [5] proved in 2019 that no
        message-passing GNN can distinguish certain pairs of non-isomorphic
        graphs — specifically, those that the{" "}
        <em>1-Weisfeiler-Lehman graph isomorphism test</em> cannot
        distinguish. They proposed <strong>GIN</strong> (Graph Isomorphism
        Network) with a specific aggregation choice (sum, plus an MLP update)
        that exactly matches the 1-WL upper bound. Real-world graphs almost
        never trigger these edge cases, but the theoretical result mattered:
        it told the field exactly how powerful message passing can be in
        principle, and motivated higher-order GNNs (3-WL, k-WL) for problems
        where the limit binds. The pattern is similar to universal
        approximation in Chapter 2 — a clean theoretical bound that tells you
        what is possible, even if the practical recipe usually does not
        approach it.
      </p>

      <GraphVsGrid />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
