import { useTocSections } from "../../components/layout/TocRail";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import InlineMath from "../../components/shared/InlineMath";
import MathBlock from "../../components/shared/MathBlock";
import MessagePassing from "../../components/widgets/ch16/MessagePassing";
import GraphAttention from "../../components/widgets/ch16/GraphAttention";
import NodeClassification from "../../components/widgets/ch16/NodeClassification";
import GraphVsGrid from "../../components/widgets/ch16/GraphVsGrid";
import MessagePassingStep from "../../components/diagrams/ch16/MessagePassingStep";
import GCNOverSmoothing from "../../components/diagrams/ch16/GCNOverSmoothing";
import GATLearnedWeights from "../../components/diagrams/ch16/GATLearnedWeights";
import ArchitectureUnification from "../../components/diagrams/ch16/ArchitectureUnification";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = buildCitations([
  { title: "Semi-Supervised Classification with Graph Convolutional Networks", authors: "Kipf & Welling", venue: "ICLR", year: "2017", tag: "seminal" },
  { title: "Graph Attention Networks", authors: "Velickovic, Cucurull, Casanova, Romero, Lio, Bengio", venue: "ICLR", year: "2018", tag: "paper" },
  { title: "Inductive Representation Learning on Large Graphs (GraphSAGE)", authors: "Hamilton, Ying, Leskovec", venue: "NeurIPS", year: "2017", tag: "paper" },
  { title: "Neural Message Passing for Quantum Chemistry", authors: "Gilmer, Schoenholz, Riley, Vinyals, Dahl", venue: "ICML", year: "2017", tag: "paper" },
  { title: "How Powerful are Graph Neural Networks?", authors: "Xu, Hu, Leskovec, Jegelka", venue: "ICLR", year: "2019", tag: "paper" },
  { title: "Deeper Insights into Graph Convolutional Networks for Semi-Supervised Learning", authors: "Li, Han, Wu", venue: "AAAI", year: "2018", tag: "paper" },
  { title: "Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges", authors: "Bronstein, Bruna, Cohen, Velickovic", venue: "arXiv", year: "2021", tag: "paper" },
  { title: "On the Bottleneck of Graph Neural Networks and its Practical Implications", authors: "Alon & Yahav", venue: "ICLR", year: "2021", tag: "paper" },
  { title: "Do Transformers Really Perform Bad for Graph Representation? (Graphormer)", authors: "Ying, Cai, Luo, Zheng, Ke, He, Shen, Liu", venue: "NeurIPS", year: "2021", tag: "paper" },
  { title: "Learning Skillful Medium-Range Global Weather Forecasting (GraphCast)", authors: "Lam, Sanchez-Gonzalez, Willson, Wirnsberger, Fortunato, Alet, Ravuri, Ewalds, Eaton-Rosen, Hu, Merose, Hoyer, Holland, Vinyals, Stott, Pritzel, Mohamed, Battaglia", venue: "Science", year: "2023", tag: "seminal" },
  { title: "Highly Accurate Protein Structure Prediction with AlphaFold", authors: "Jumper, Evans, Pritzel, Green, Figurnov, Ronneberger, Tunyasuvunakool, Bates, Žídek, Potapenko, et al.", venue: "Nature", year: "2021", tag: "seminal" },
]);

const TOC_SECTIONS = [
  { id: "graphs-and-message-passing",   label: "Message Passing" },
  { id: "graph-convolutional-networks", label: "GCN" },
  { id: "graph-attention-networks",     label: "GAT" },
  { id: "tasks-and-applications",       label: "Tasks & Applications" },
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
        Chapter 16 · Part IV — Beyond the Transformer
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
        and knowledge bases are relational structures where the connections
        between entities carry as much information as the entities
        themselves. Graph neural networks extend deep learning to these
        irregular structures through message passing: every node repeatedly
        gathers information from the entities it's connected to and folds
        that into its own representation. It's a strictly more general lens
        than anything covered so far — the convolutional networks and
        transformers built in earlier chapters turn out to be message passing
        running on two particular, highly regular graphs, and this chapter
        builds the general case first.
      </ChapterLede>

      {/* ── Section 1: Graphs & Message Passing ─────────────────────────────── */}
      <div id="graphs-and-message-passing">
        <SectionTitle>Graphs &amp; Message Passing</SectionTitle>
      </div>

      <p style={prose}>
        A graph <InlineMath>{"G = (V, E)"}</InlineMath> consists of nodes with
        feature vectors and edges defining pairwise relationships — unlike a
        grid or a sequence, a graph has no fixed neighborhood shape and no
        canonical ordering of its nodes. The message-passing framework
        handles that generality directly: at each round{" "}
        <InlineMath>{"\\ell"}</InlineMath>, every node{" "}
        <InlineMath>v</InlineMath> aggregates messages from its neighbors{" "}
        <InlineMath>{"\\mathcal{N}(v)"}</InlineMath>, then updates its own
        representation using the aggregated message together with its
        current state. The choice of aggregation function — sum, mean, or
        max — and the choice of update function together define a specific
        GNN variant. After <InlineMath>k</InlineMath> rounds,{" "}
        <InlineMath>{"h_v^{(k)}"}</InlineMath> encodes the full structure of{" "}
        <InlineMath>v</InlineMath>'s <InlineMath>k</InlineMath>-hop
        neighborhood.
      </p>

      <p style={prose}>
        Because a graph carries no canonical node ordering — relabeling every
        node with a different numbering doesn't change what graph it is — a
        valid GNN operation cannot depend on the arbitrary order in which a
        node's neighbors happen to be listed. This is the central inductive
        bias of the whole architecture family, playing the same role here
        that locality plays for CNNs or sequential order plays for RNNs. For
        a node-level output, the network must be <em>permutation
        equivariant</em>: relabel the nodes and the outputs relabel the same
        way. For a graph-level output, it must be{" "}
        <em>permutation invariant</em>: relabel the nodes and the output
        doesn't change at all. This is exactly why AGGREGATE is restricted to
        symmetric functions like sum, mean, or max rather than something
        order-sensitive — a function that treated one neighbor differently
        from another based on list position would give different answers
        depending on an arbitrary indexing choice, and a graph offers no
        canonical index to fall back on.
      </p>

      <p style={prose}>
        That output can live at three different granularities, depending on
        what needs predicting. Node-level tasks read a prediction directly
        off each node's final representation — classifying which community a
        user belongs to, for instance. Edge-level tasks combine a pair of
        node representations into a single score, most commonly to predict
        whether a link should exist between them. Graph-level tasks pool
        every node's final representation into one fixed-size vector and
        predict something about the whole structure, such as a molecule's
        toxicity. This chapter builds a node-level example first and returns
        to the edge- and graph-level cases — link prediction, readout, and a
        pair of large-scale applications — once GCN and GAT are on the
        table.
      </p>

      <p style={prose}>
        Gilmer et al. (2017) [4] made a striking observation: nearly every
        graph neural network in the literature could be cast in the same
        two-step <em>message-passing</em> template — aggregate from
        neighbors, then update. GCN, GAT, GraphSAGE, Interaction Networks,
        and dozens of others differ only in their choice of message
        function, aggregation function (sum, mean, max, or
        attention-weighted), and update function (MLP, GRU, or
        concatenate-then-linear). This was the field's "transformer-block
        moment": once everything fits one abstraction, the architectural
        design space collapses to a small set of orthogonal choices. The
        paper's specific application — predicting quantum-chemical
        properties of small molecules — became a canonical GNN benchmark,
        and modern equivariant descendants of message-passing networks
        remain a leading approach to molecular property prediction today.
      </p>

      <p style={prose}>
        Early GNNs like GCN are typically used <em>transductively</em>: the
        standard formulation multiplies node features through the full
        graph's normalized adjacency matrix as one global operation, so both
        training and inference assume the complete, fixed graph is known in
        advance. That is not because GCN's parameters are tied to node
        identities — its weight matrices are shared functions of features,
        unlike shallow embedding methods (DeepWalk, node2vec) that learn one
        vector per node and truly cannot generalize to a node they didn't
        train on. Hamilton et al. (2017) [3] introduced{" "}
        <strong>GraphSAGE</strong> — Sample And aGgrEgate — to make the
        inductive case explicit: instead of propagating through a fixed
        full-graph adjacency matrix, GraphSAGE learns a{" "}
        <em>function</em> that produces a representation from a node's
        features and a sampled subset of its neighbors, so the same learned
        function applies directly to nodes and graphs it has never seen.
        GraphSAGE also addressed scalability: for very large graphs where a
        node might have thousands of neighbors, sampling a fixed-size subset
        (e.g., 25 random neighbors) keeps message passing tractable.
        Production GNN systems at scale — Pinterest's PinSAGE, large-scale
        recommendation graphs — are descendants of this work, and, as the
        third section of this chapter makes precise, the task PinSAGE
        actually solves is edge-level, not node-level.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  m_v^{(\\ell)} &= \\text{AGGREGATE}\\!\\left(\\{ h_u^{(\\ell-1)} : u \\in \\mathcal{N}(v) \\}\\right) \\\\
  h_v^{(\\ell)} &= \\text{UPDATE}\\!\\left(h_v^{(\\ell-1)},\\ m_v^{(\\ell)}\\right)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here AGGREGATE pools the incoming messages from a node's neighbors
        into one fixed-size summary, and UPDATE folds that summary together
        with the node's own previous state{" "}
        <InlineMath>{"h_v^{(\\ell-1)}"}</InlineMath> to produce its next
        representation — every GNN variant in this chapter is one choice of
        these two functions.
      </p>

      <p style={prose}>
        The diagram below draws exactly this: four neighbors sending
        messages into an AGGREGATE box, whose output combines with the
        target node's own prior state inside UPDATE.
      </p>

      <MessagePassingStep />

      <p style={prose}>
        The widget below runs several rounds of this update on a small,
        six-node graph. Step through Round 0 → 1 a few times under Mean
        aggregation, then switch to Sum and reset; notice that Mean settles
        toward a stable value while Sum keeps growing every round, since
        summing unbounded neighbor counts has no natural ceiling — the
        instability GCN's degree normalization, covered next, is designed to
        prevent.
      </p>

      <MessagePassing
        tryThis={{
          do: "Step through a few rounds under Mean aggregation, then switch to Sum and step through again.",
          notice: "Mean-aggregated values settle toward a stable range, while Sum-aggregated values keep climbing round after round — an instability degree normalization exists specifically to prevent.",
        }}
      />

      {/* ── Section 2: Graph Convolutional Networks ──────────────────────────── */}
      <div id="graph-convolutional-networks">
        <SectionTitle>Graph Convolutional Networks</SectionTitle>
      </div>

      <p style={prose}>
        GCN defines message passing as a normalized spectral graph
        convolution — a convolution whose filter comes from the graph's
        eigenstructure rather than a spatial kernel of fixed shape. In
        practice this reduces to something concrete: each node's new
        representation is a weighted sum of its neighbors' current features,
        where the weight on each edge is normalized by the square root of
        the product of <em>both</em> endpoints' degrees — a node's degree
        being the number of edges incident to it. This symmetric
        normalization prevents nodes with many neighbors from dominating: a
        node with 100 neighbors does not simply receive{" "}
        <InlineMath>{"100\\times"}</InlineMath> the signal of a node with
        one neighbor, and a high-degree neighbor's contribution to any one
        node is damped relative to a low-degree neighbor's. Stacking{" "}
        <InlineMath>k</InlineMath> GCN layers gives each node access to a{" "}
        <InlineMath>k</InlineMath>-hop neighborhood.
      </p>

      <p style={prose}>
        Concretely: take a four-node graph where A connects to both B and D,
        and B additionally connects to C. Before self-loops, A and B each
        have degree 2 while C and D each have degree 1; after adding the
        self-loop that GCN's <InlineMath>{"\\tilde{A} = A + I"}</InlineMath>{" "}
        introduces, every node's degree increases by one, giving{" "}
        <InlineMath>{"\\tilde{d}_A = 3"}</InlineMath>,{" "}
        <InlineMath>{"\\tilde{d}_B = 3"}</InlineMath>,{" "}
        <InlineMath>{"\\tilde{d}_C = 2"}</InlineMath>, and{" "}
        <InlineMath>{"\\tilde{d}_D = 2"}</InlineMath>. Node B's edge weight
        to A is <InlineMath>{"1/\\sqrt{3 \\cdot 3} = 1/3 \\approx 0.33"}</InlineMath>,
        but its edge weight to C is{" "}
        <InlineMath>{"1/\\sqrt{3 \\cdot 2} = 1/\\sqrt{6} \\approx 0.41"}</InlineMath>{" "}
        — C, the lower-degree neighbor, receives noticeably more weight than
        A, the higher-degree one. Both numbers are unequal, and both are
        entirely determined by the graph's topology before any training
        happens — degree-dependent, not learned, and not uniform.
      </p>

      <p style={prose}>
        <strong>Going deeper: where this rule comes from.</strong> GCN's
        precise form traces back to spectral graph theory. The "proper"
        graph convolution multiplies a signal by a filter defined in the
        graph's spectral domain — the eigenbasis of the graph Laplacian, a
        matrix (degree minus adjacency) whose eigenvectors play the same
        role for graphs that Fourier modes play for ordinary signals — but
        computing that eigendecomposition costs{" "}
        <InlineMath>{"\\mathcal{O}(|V|^3)"}</InlineMath>, prohibitive for
        graphs of any real size. Kipf &amp; Welling (2017) [1] showed that
        truncating a Chebyshev-polynomial approximation of the spectral
        filter to its first-order term (the ChebNet construction, restricted
        to <InlineMath>{"K=1"}</InlineMath>) and tying its two remaining
        parameters together to curb overfitting collapses the whole
        machinery to a single matrix multiplication. A second step, the{" "}
        <em>renormalization trick</em> — adding a self-loop to every node via{" "}
        <InlineMath>{"\\tilde{A} = A + I"}</InlineMath> before normalizing —
        then stabilizes the result against exploding or vanishing values
        under repeated application. What survives is the simple,
        aggregate-and-normalize rule below; the spectral theory motivates it
        but is not needed to use it.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  H^{(\\ell+1)} &= \\sigma\\!\\left(\\tilde{D}^{-1/2}\\, \\tilde{A}\\, \\tilde{D}^{-1/2}\\, H^{(\\ell)}\\, W^{(\\ell)}\\right) \\\\
  &\\text{where}\\ \\tilde{A} = A + I,\\ \\ \\tilde{D} = \\text{degree matrix of } \\tilde{A}
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>A</InlineMath> is the graph's adjacency matrix,{" "}
        <InlineMath>I</InlineMath> adds a self-loop to every node so a
        node's own previous features participate in its update, and{" "}
        <InlineMath>{"\\tilde{D}"}</InlineMath> is the resulting degree
        matrix — a diagonal matrix holding each self-looped node's degree,
        whose inverse square root on both sides produces the symmetric,
        degree-dependent weighting worked through above.
      </p>

      <p style={prose}>
        Stacking GCN layers seems like a natural way to give each node
        access to a deeper neighborhood, but in practice performance
        degrades sharply beyond two or three layers. The cause is{" "}
        <strong>over-smoothing</strong>: with each layer, every node's
        representation becomes a weighted average of an increasingly large
        region, and repeated averaging is a contraction — it erases
        differences faster than added depth can contribute expressive power.
        Li et al. (2018) [6] showed this is intrinsic to GCN's propagation
        rule, not an artifact of poor training: in the limit of many layers,
        node representations converge toward a shared low-rank subspace
        determined only by each node's degree, losing the ability to
        distinguish nodes in different parts of the graph (on a regular
        graph, where every node shares the same degree, that subspace
        collapses to a single shared vector). The practical implication is
        severe — GNN depth has been roughly capped at two to three layers
        for most applications, in stark contrast to CNNs and transformers,
        where deeper is almost always better. Skip connections, edge
        dropout, and explicit residual connections all partially mitigate
        but do not fully solve it.
      </p>

      <p style={prose}>
        Over-smoothing is not the only way depth hurts a GNN, and the two are
        easy to conflate. A node's <InlineMath>k</InlineMath>-hop
        neighborhood grows exponentially with{" "}
        <InlineMath>k</InlineMath> in most real graphs, but every UPDATE
        step still compresses whatever arrives into a single fixed-size
        vector — so as <InlineMath>k</InlineMath> grows, exponentially more
        information is forced through a bottleneck of constant width. Alon
        &amp; Yahav (2021) [8] named and formalized this{" "}
        <strong>over-squashing</strong>: long-range signals get squashed
        into an information bottleneck long before over-smoothing sets in,
        and graphs with structural bottlenecks — a small cut separating two
        otherwise dense regions — are hit hardest, since a message from one
        side must funnel through very few edges to reach the other. Where
        over-smoothing is a problem of too much averaging, over-squashing is
        a problem of too little capacity to carry what depth should be
        delivering — and escaping local neighborhoods entirely, the graph
        transformer approach taken up later in this chapter, is one of the
        more direct fixes for it.
      </p>

      <p style={prose}>
        The panels below trace over-smoothing directly: watch how the
        six-node graph's per-node colors, each a distinct representation
        after one layer, blur into a single shared hue by ten layers.
      </p>

      <GCNOverSmoothing />

      {/* ── Section 3: Graph Attention Networks ─────────────────────────────── */}
      <div id="graph-attention-networks">
        <SectionTitle>Graph Attention Networks</SectionTitle>
      </div>

      <p style={prose}>
        GCN's per-edge weights are fixed the moment the graph is built —
        degree-dependent, as the worked example above showed, but entirely
        determined by topology, with no way for the network to decide that
        one neighbor's features matter more than another's. Graph Attention
        Networks (GAT) replace that fixed rule with{" "}
        <em>learned</em> attention coefficients: each node computes, from
        its own and its neighbor's features, how much weight to place on
        that neighbor — the same way a transformer computes how much one
        token should attend to another. Velickovic et al. (2018) [2]
        introduced GAT to let neighbor importance be learned from data
        rather than read off the graph's degree sequence, useful whenever
        some neighbors genuinely matter more than others: a citation network
        where one cited paper is far more relevant than another, or a
        molecule where one bonded atom dominates a property and the rest are
        incidental. The attention coefficient{" "}
        <InlineMath>{"\\alpha_{ij}"}</InlineMath> is computed from the
        features of nodes <InlineMath>i</InlineMath> and{" "}
        <InlineMath>j</InlineMath> via a small learned function, then
        softmax-normalized across all of <InlineMath>i</InlineMath>'s
        neighbors, so the weights on any one node's outgoing edges still sum
        to one. The functional form differs slightly from transformer
        attention — GAT concatenates the two projected feature vectors and
        passes them through a learned vector and a LeakyReLU nonlinearity,
        where transformers use a scaled dot product — but the principle is
        identical: the network learns how much to weight each interaction,
        and multi-head attention works exactly as it does in a transformer,
        with heads concatenated or averaged at the output.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\alpha_{ij} &= \\text{softmax}_j\\!\\left(\\text{LeakyReLU}\\!\\left(\\vec{a}^{\\,\\top}\\, [W h_i \\,\\Vert\\, W h_j]\\right)\\right) \\\\
  h_i' &= \\sigma\\!\\left(\\sum_{j \\in \\mathcal{N}(i)} \\alpha_{ij}\\, W h_j\\right)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\alpha_{ij}"}</InlineMath> is the learned,
        softmax-normalized weight node <InlineMath>i</InlineMath> places on
        neighbor <InlineMath>j</InlineMath>; <InlineMath>W</InlineMath> is a
        learned projection applied to every node's features; and{" "}
        <InlineMath>{"\\vec{a}"}</InlineMath> is a learned vector that scores
        a concatenated pair of projected features before the LeakyReLU and
        softmax turn those scores into normalized weights.
      </p>

      <p style={prose}>
        The two panels below put GCN's fixed weights next to GAT's learned
        ones over the same five-neighbor layout; compare how sharply GAT
        concentrates weight on a single neighbor while GCN's spread stays
        close to uniform, varying only with degree.
      </p>

      <GATLearnedWeights />

      <p style={prose}>
        The widget below runs the comparison live on a six-node graph. Click
        node B — the highest-degree node — in GAT mode, then switch to GCN
        mode and click B again; notice GAT concentrates most of its weight
        on one or two neighbors while GCN's four weights stay close together,
        differing only with each neighbor's degree.
      </p>

      <GraphAttention
        tryThis={{
          do: "Click node B in GAT mode, then switch to GCN mode and click B again.",
          notice: "GAT concentrates most of its weight on one or two neighbors, while GCN's weights across the same four neighbors stay close together and track only each neighbor's degree.",
        }}
      />

      <p style={prose}>
        This connection between GAT and self-attention is worth making
        explicit, because it sets up the rest of this section. A transformer
        self-attention layer is structurally a GAT applied to a{" "}
        <em>complete graph</em> — one where every token is connected to every
        other token. <InlineMath>{"Q,\\ K,\\ V"}</InlineMath> projections
        produce node-specific embeddings; the softmax-normalized attention
        weights are exactly the <InlineMath>{"\\alpha_{ij}"}</InlineMath>{" "}
        coefficients; the weighted sum of <InlineMath>V</InlineMath> is the
        message aggregation. The only differences are that transformers add
        positional encoding (since a complete graph has no inherent geometry
        to encode) and use a scaled dot product instead of GAT's additive
        form. Once this equivalence is visible, the question shifts from
        "should I use a GNN or a transformer?" to "what graph structure
        should my model attend over?"
      </p>

      <p style={prose}>
        That question has a direct answer for graphs suffering from
        over-squashing: attend over every node, not just the 1-hop
        neighborhood, and let the network learn which distant nodes matter
        rather than restricting it to whatever local message passing can
        reach in a fixed number of layers. Graph transformers such as
        Graphormer (Ying et al., 2021 [9]) do exactly this — but
        complete-graph attention, taken alone, throws away the one thing a
        GNN's local structure gave it for free: the graph's topology. In
        place of a sequence's positional encoding, graph transformers inject
        structural information directly into each node's input — most
        commonly a node's coordinates in the eigenbasis of the graph
        Laplacian (<em>Laplacian positional encodings</em>) or a summary of
        how likely a short random walk is to return to or reach other nodes
        (<em>random-walk structural encodings</em>). Whether the better fix
        for over-squashing is attending globally with structural encodings
        or rewiring the graph locally to shorten worst-case distances
        remains an active research question; both are direct responses to
        the bottleneck described in the previous section, not just a
        stronger architecture for its own sake.
      </p>

      <p style={prose}>
        Node classification is the task most of this section's machinery has
        been building toward: a handful of nodes carry known labels, and the
        goal is to infer labels for the rest from graph structure and
        features alone. Message passing does this by propagation — each
        round lets a node's representation absorb a little more of its
        labeled neighbors' signal, so nodes many hops from any labeled seed
        take longer to acquire a confident label than ones sitting right
        next to one, and nodes roughly equidistant between two
        differently-labeled communities are genuinely ambiguous until more
        information — deeper layers, or more seeds — resolves them.
      </p>

      <p style={prose}>
        The widget below is a receptive-field analogy for that process, not
        a trained classifier's output: its "depth k" slider grows each
        node's neighborhood by unweighted hop-distance to the nearest seed
        rather than running learned aggregation over features, so read its
        predictions as how far label information could travel in k rounds,
        not the accuracy a real trained GNN would achieve. Drag depth k from
        0 to 4 and watch the three seed nodes' labels flood outward; notice
        the nodes sitting right at a community boundary stay{" "}
        <em>contested</em> — tied between two labels — for the longest.
      </p>

      <NodeClassification
        tryThis={{
          do: "Drag depth k from 0 to 4 and watch the three seed nodes' labels flood outward.",
          notice: "Nodes sitting right at a community boundary stay 'contested' — tied between two labels — well after most of the graph has resolved to a single class.",
        }}
      />

      {/* ── Section 4: Tasks, Readout & Applications ─────────────────────────── */}
      <div id="tasks-and-applications">
        <SectionTitle>Tasks, Readout &amp; Applications</SectionTitle>
      </div>

      <p style={prose}>
        Edge-level tasks — the second granularity introduced at the start of
        this chapter — predict something about a pair of nodes rather than a
        single one. <strong>Link prediction</strong> is the dominant example:
        given two nodes' final representations, combine them (a dot product,
        or a small MLP over their concatenation) into a single score
        estimating whether an edge should exist between them. This is what
        powers recommendation at scale — Pinterest's PinSAGE, built on the
        GraphSAGE machinery from earlier in this chapter, scores pin-board
        pairs this way rather than assigning any single pin a class label —
        and it's the standard approach to knowledge-graph completion, where
        the task is inferring which missing (entity, relation, entity)
        triples are probably true.
      </p>

      <p style={prose}>
        Graph-level tasks need one further step beyond anything covered so
        far: a single prediction for the entire graph, not one per node or
        edge. After the final round of message passing, a{" "}
        <strong>readout</strong> function pools every node's representation
        into one fixed-size graph embedding — most simply by summing or
        averaging them, mirroring the same permutation-invariance
        requirement that constrains AGGREGATE, since the graph's prediction
        cannot depend on the arbitrary order its nodes happen to be listed
        in. Molecular property prediction, the benchmark task that made
        message-passing networks famous, is a graph-level task in exactly
        this shape: pool a molecule's final per-atom representations into
        one vector, then run a standard regressor on top to predict
        solubility, toxicity, or binding affinity. More expressive learned
        readouts — hierarchical pooling methods like DiffPool, which learn
        to cluster nodes into coarser super-nodes across several pooling
        layers rather than flattening everything in one shot — exist for
        graphs where a single sum or mean loses too much structure, but
        plain sum-pooling is a strong, common default; it is also, as the
        next section's discussion of GIN makes precise, the specific
        pooling choice that preserves the most graph-distinguishing
        information.
      </p>

      <p style={prose}>
        Two of the most consequential real-world applications of message
        passing are recent enough to still feel like frontier work.
        GraphCast (Lam et al., 2023 [10]) represents Earth's atmosphere as a
        mesh graph — nodes at fixed points across the globe, edges
        connecting nearby points at several spatial scales — and trains a
        GNN to predict how atmospheric variables evolve one step ahead;
        chaining these steps forward produces ten-day forecasts that beat
        traditional numerical weather prediction on most measured variables,
        at a small fraction of the compute cost, precisely because
        multi-scale message passing lets a signal at one point of the globe
        reach distant points in only a few rounds. AlphaFold (Jumper et al.,
        2021 [11]) solves a different structural problem — predicting a
        protein's three-dimensional shape from its amino-acid sequence —
        using representations built over a graph of residues, reasoning
        jointly about which residues end up close together in the folded
        structure the same way a GNN reasons about which nodes are
        connected in a graph. Neither system resembles the small-molecule
        benchmarks that made message passing famous, but both rest on the
        same underlying idea: some problems are naturally structured as
        entities and the relationships between them, and a graph is the
        honest way to represent that structure.
      </p>

      {/* ── Section 5: Graph vs Grid — CNN as a Special Case ─────────────────── */}
      <div id="graph-vs-grid">
        <SectionTitle>Graph vs Grid — CNN as a Special Case</SectionTitle>
      </div>

      <p style={prose}>
        A convolutional neural network is a graph neural network applied to
        a grid graph. Each pixel is a node. Its eight immediate neighbors
        are connected by edges. The convolution kernel weights correspond to
        the message weights for each neighbor direction. Weight sharing in
        CNNs — the same kernel everywhere — is equivalent to using identical
        aggregation weights at every node in the graph. Understanding CNNs
        as a special case of GNNs shows why GNNs generalize to arbitrary
        topologies.
      </p>

      <p style={prose}>
        The CNN-as-grid-graph framing extends to almost every architecture
        in this book. <strong>RNN</strong>: a chain graph where each node
        connects only to the next position — message passing along a single
        path. <strong>CNN</strong>: a 2D grid graph where each pixel
        connects to its local neighbors, with weight sharing across
        positions. <strong>Transformer</strong>: a complete graph where
        every node connects to every other node, with learned attention
        weights. <strong>GNN</strong>: an arbitrary graph topology, with
        learned attention or fixed aggregation. From this vantage point,
        every architecture is "message passing on a graph" — what differs is
        which graph and what aggregation function. This unification was made
        fully explicit by the Geometric Deep Learning program (Bronstein et
        al., 2021 [7]), which framed GNNs, CNNs, and transformers as
        instances of <em>equivariant</em> operations — operations where
        permuting or transforming the input produces a correspondingly
        permuted or transformed output, rather than an unrelated one —
        applied to different geometric domains (graphs, grids, sets,
        manifolds).
      </p>

      <p style={prose}>
        The four panels below draw all four architectures as the same
        aggregate-then-update operation running over a different topology;
        compare how much of each node's neighborhood the highlighted node
        actually reaches under a chain, a grid, a complete graph, and an
        arbitrary graph.
      </p>

      <ArchitectureUnification />

      <p style={prose}>
        The widget below runs the equivalence live: pick a kernel and an
        image patch on the left, and watch the identical computation play
        out as neighbor-aggregate-then-sum on a nine-node graph on the
        right.
      </p>

      <GraphVsGrid
        tryThis={{
          do: "Pick a kernel, click an interior pixel to move the patch, then press Compute.",
          notice: "The CNN's step-by-step dot product on the left and the GNN's neighbor-aggregate-then-sum on the right land on the identical output number.",
        }}
      />

      <p style={prose}>
        Even with the right structure, GNNs have intrinsic representational
        limits. Xu et al. (2019) [5] proved that no message-passing GNN can
        distinguish certain pairs of <em>non-isomorphic</em> graphs —
        graphs that are genuinely structurally different, as opposed to the
        same graph with its nodes relabeled — specifically, those that the{" "}
        <em>1-Weisfeiler-Lehman test</em> cannot distinguish: a classical
        algorithm that iteratively relabels each node by a hash of its own
        and its neighbors' labels, then checks whether two graphs end up
        with the same multiset of labels. They proposed{" "}
        <strong>GIN</strong> (Graph Isomorphism Network) with a specific
        aggregation choice — sum, followed by an MLP update — that provably
        matches the 1-WL upper bound, the most expressive any
        message-passing GNN can be; sum is the choice that matters here
        because, unlike mean or max, it preserves the multiset of neighbor
        values rather than collapsing counts away. Real-world graphs almost
        never trigger these edge cases, but the theoretical result mattered:
        it told the field exactly how powerful message passing can be in
        principle, and motivated higher-order GNNs (3-WL, k-WL) for the
        rarer problems where the limit binds. The pattern is similar to
        universal approximation in Chapter 3 — a clean theoretical bound on
        what is possible, even if the practical recipe usually does not
        approach it.
      </p>

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        What carries forward is the message-passing pattern itself, not any
        one architecture: aggregate from a defined, permutation-invariant
        neighborhood, then update — general enough to recover RNNs (chain
        neighborhoods), CNNs (grid neighborhoods), and transformers
        (complete-graph neighborhoods) as special cases, with GCN's fixed
        degree-based weights and GAT's learned attention marking two points
        along the same spectrum. The over-squashing problem that motivated
        this chapter's graph-transformer detour is really a special case of
        a more general one: standard attention itself scales quadratically
        with the number of things attended over, whether those things are
        graph nodes or sequence tokens. Chapter 17 takes up that cost
        directly, looking at state-space models and other attention
        alternatives that trade away some of the transformer's flexibility
        for linear-time processing over long sequences.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
