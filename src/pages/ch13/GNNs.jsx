import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import MessagePassing from "../../components/widgets/ch13/MessagePassing";
import GraphAttention from "../../components/widgets/ch13/GraphAttention";
import NodeClassification from "../../components/widgets/ch13/NodeClassification";
import GraphVsGrid from "../../components/widgets/ch13/GraphVsGrid";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
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
        Chapter 13 · Part IV — Other Architectures
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
        A graph G = (V, E) consists of nodes with feature vectors and edges defining
        pairwise relationships. The message passing framework is elegant in its
        generality: at each round l, every node v aggregates messages from its
        neighbors N(v), then updates its own representation using the aggregated
        message and its current state. The aggregation function — sum, mean, or
        max — and the update function together define the GNN variant. After k
        rounds, h_v^(k) encodes the full structure of v's k-hop neighborhood.
      </p>

      <MathBlock>{`m_v^(l) = AGGREGATE({ h_u^(l-1) : u in N(v) })
h_v^(l) = UPDATE( h_v^(l-1), m_v^(l) )`}</MathBlock>

      <MessagePassing />

      {/* ── Section 2: Graph Convolutional Networks ──────────────────────────── */}
      <div id="graph-convolutional-networks">
        <SectionTitle>Graph Convolutional Networks</SectionTitle>
      </div>

      <p style={prose}>
        GCN defines message passing as a normalized spectral graph convolution.
        Each node's new representation is a weighted sum of its neighbors' current
        features, normalized by the square root of their degrees. This normalization
        prevents nodes with many neighbors from dominating — a node with 100
        neighbors does not simply receive 100x the signal of a node with 1 neighbor.
        Stacking k GCN layers gives each node access to a k-hop neighborhood.
      </p>

      <MathBlock>{`H^(l+1) = sigma( D_tilde^(-1/2) * A_tilde * D_tilde^(-1/2) * H^(l) * W^(l) )
where A_tilde = A + I  (adjacency with self-loops),  D_tilde = degree matrix of A_tilde`}</MathBlock>

      <GraphAttention />

      {/* ── Section 3: Graph Attention Networks ─────────────────────────────── */}
      <div id="graph-attention-networks">
        <SectionTitle>Graph Attention Networks</SectionTitle>
      </div>

      <p style={prose}>
        GCN assigns equal normalized weight to all neighbors. Graph Attention Networks
        (GAT) learn attention coefficients over neighbors, allowing each node to weight
        the importance of its neighbors dynamically based on their features. The
        attention mechanism is the same scaled dot-product attention from transformers,
        applied to node feature pairs. Multi-head attention can be used here too,
        with heads concatenated or averaged at the output.
      </p>

      <MathBlock>{`alpha_ij = softmax_j( LeakyReLU( a^T * [W*h_i || W*h_j] ) )
h_i' = sigma( sum_{j in N(i)} alpha_ij * W * h_j )`}</MathBlock>

      <NodeClassification />

      {/* ── Section 4: Graph vs Grid — CNN as a Special Case ─────────────────── */}
      <div id="graph-vs-grid">
        <SectionTitle>Graph vs Grid — CNN as a Special Case</SectionTitle>
      </div>

      <p style={prose}>
        A convolutional neural network is a graph neural network applied to a grid
        graph. Each pixel is a node. Its 8 immediate neighbors are connected by
        edges. The convolution kernel weights correspond to the message weights for
        each neighbor direction. Weight sharing in CNNs — the same kernel everywhere
        — is equivalent to using identical aggregation weights at every node in the
        graph. Understanding CNNs as a special case of GNNs shows why GNNs
        generalize to arbitrary topologies.
      </p>

      <GraphVsGrid />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
