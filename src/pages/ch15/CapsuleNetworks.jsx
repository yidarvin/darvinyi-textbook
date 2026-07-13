import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import CnnVsCapsnet from "../../components/widgets/ch15/CnnVsCapsnet";
import CapsuleVector from "../../components/widgets/ch15/CapsuleVector";
import DynamicRouting from "../../components/widgets/ch15/DynamicRouting";
import InvarianceVsEquivariance from "../../components/diagrams/ch15/InvarianceVsEquivariance";
import CapsuleAnatomy from "../../components/diagrams/ch15/CapsuleAnatomy";
import RoutingByAgreement from "../../components/diagrams/ch15/RoutingByAgreement";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Dynamic Routing Between Capsules", authors: "Sabour, Frosst, Hinton", venue: "NeurIPS", year: "2017", tag: "seminal" },
  { num: 2, title: "Matrix Capsules with EM Routing", authors: "Hinton, Sabour, Frosst", venue: "ICLR", year: "2018", tag: "paper" },
  { num: 3, title: "Transforming Auto-encoders", authors: "Hinton, Krizhevsky, Wang", venue: "ICANN", year: "2011", tag: "paper" },
  { num: 4, title: "A Survey of Capsule Networks", authors: "Gu", venue: "Applied Sciences", year: "2021", tag: "survey" },
];

const TOC_SECTIONS = [
  { id: "the-pooling-problem", label: "The Pooling Problem" },
  { id: "capsules-as-vectors", label: "Capsules as Vectors" },
  { id: "dynamic-routing",     label: "Dynamic Routing" },
];

export default function CapsuleNetworks() {
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
        Chapter 15 · Part IV — Other Architectures
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
        Capsule Networks
      </h1>

      <ChapterLede>
        Max pooling is a lossy operation — it discards the precise spatial
        relationships between detected features, keeping only whether something
        was present. Capsule networks, proposed by Hinton, preserve this spatial
        structure by representing detected entities as vectors rather than scalars.
        The vector's magnitude encodes existence probability; its direction encodes
        pose. Routing by agreement replaces pooling as the mechanism for building
        hierarchical representations.
      </ChapterLede>

      {/* ── Section 1: The Pooling Problem ───────────────────────────────── */}
      <div id="the-pooling-problem">
        <SectionTitle>The Pooling Problem</SectionTitle>
      </div>

      <p style={prose}>
        A convolutional network with max pooling can reliably detect the presence
        of facial features — eyes, a nose, a mouth — but discards their spatial
        arrangement. A face with those same features scrambled into arbitrary
        positions produces nearly identical activations. This is not a minor
        limitation: it means the network cannot represent the spatial hierarchy
        of parts that defines most visual concepts. Capsules address this by
        routing detected parts through an agreement mechanism that requires
        consistent spatial relationships to activate higher-level capsules.
      </p>

      <p style={prose}>
        The deeper diagnosis behind the scrambled-face problem is a property
        choice. Max pooling builds <em>invariance</em>: translate or scramble the
        input, and the output stays roughly the same. That is exactly what you
        want for a classifier asking "is this a face?" — and exactly what you do
        not want for any task that needs to know <em>where</em> or <em>how</em>{" "}
        parts are arranged. The alternative property is <em>equivariance</em>:
        transform the input, and the output transforms predictably in response.
        A capsule's output vector is equivariant — rotating the input rotates
        the vector; translating the input shifts the encoded pose parameters.
        The same network can then represent both "yes, there is a face"
        (vector magnitude) and "in this exact orientation and position" (vector
        direction). The fundamental capsule pitch is that equivariance, not
        invariance, is the right symmetry for vision.
      </p>

      <InvarianceVsEquivariance />

      <p style={prose}>
        The vector-output-per-entity idea predates the famous 2017 paper by six
        years. Hinton, Krizhevsky &amp; Wang (2011) — <em>Transforming
        Auto-encoders</em> [3] — already proposed groups of neurons (which they
        called "capsules") that jointly represented an entity's existence and
        its instantiation parameters, trained by tasking the network with
        reconstructing transformed versions of the input. The capsule program is,
        at this point, one of the longest-running architectural research threads
        in deep learning — second only to recurrence in how long it took to find
        a working formulation, and arguably still without one.
      </p>

      <CnnVsCapsnet />

      {/* ── Section 2: Capsules as Vectors ───────────────────────────────── */}
      <div id="capsules-as-vectors">
        <SectionTitle>Capsules as Vectors</SectionTitle>
      </div>

      <p style={prose}>
        A capsule outputs a vector rather than a scalar activation. The length of
        the vector — its magnitude — represents the probability that the entity
        the capsule detects is present in the input. The direction of the vector
        encodes the entity's instantiation parameters: its pose, position, scale,
        and orientation. The squash function maps any input vector to a length
        strictly between 0 and 1, preserving direction while interpreting magnitude
        as probability.
      </p>

      <p style={prose}>
        Sabour, Frosst &amp; Hinton (2017) [1] made the vector interpretation
        concrete: typical capsule dimensions are 8 or 16, and each component is
        meant to encode one <em>instantiation parameter</em> of the detected
        entity — pose angle, scale, deformation, lighting, position relative to
        a reference frame. The network is never told which dimension means what;
        the supervision signal (typically a reconstruction loss alongside the
        classification objective) implicitly shapes them. After training, sweeping
        one dimension of a capsule's output while keeping the others fixed
        visibly varies one property of the reconstructed image — rotation,
        thickness, skew. This was the most striking empirical result of the
        original paper: capsule dimensions correspond to interpretable visual
        transformations without ever being labeled as such.
      </p>

      <MathBlock>{"$$\\text{squash}(v) = \\frac{\\|v\\|^2}{1 + \\|v\\|^2} \\cdot \\frac{v}{\\|v\\|}$$"}</MathBlock>

      <p style={prose}>
        The squash function chosen by Sabour et al. has two properties worth
        naming. It maps any input vector to a length strictly between{" "}
        <InlineMath>{"0"}</InlineMath> and <InlineMath>{"1"}</InlineMath> —
        letting magnitude be read as a probability. And it preserves direction
        exactly — the unit vector <InlineMath>{"v / \\|v\\|"}</InlineMath> is
        unchanged; only the scaling factor varies. The factor{" "}
        <InlineMath>{"\\|v\\|^2 / (1 + \\|v\\|^2)"}</InlineMath> approaches{" "}
        <InlineMath>{"1"}</InlineMath> as <InlineMath>{"\\|v\\|"}</InlineMath>{" "}
        grows large and approaches <InlineMath>{"0"}</InlineMath> as it shrinks,
        smoothly. Other length-bounding functions could substitute — a sigmoid
        of magnitude, for instance — and later variants did. But the original
        choice has stuck as the canonical "capsule activation."
      </p>

      <CapsuleAnatomy />

      <CapsuleVector />

      {/* ── Section 3: Dynamic Routing by Agreement ───────────────────────── */}
      <div id="dynamic-routing">
        <SectionTitle>Dynamic Routing by Agreement</SectionTitle>
      </div>

      <p style={prose}>
        Each lower-level capsule <InlineMath>{"i"}</InlineMath> makes a prediction
        about what the output of each higher-level capsule{" "}
        <InlineMath>{"j"}</InlineMath> should be — computed as a learned linear
        transform <InlineMath>{"\\hat{u}_{j|i} = W_{ij}\\, u_i"}</InlineMath> of
        capsule <InlineMath>{"i"}</InlineMath>'s own output. Coupling coefficients{" "}
        <InlineMath>{"c_{ij}"}</InlineMath> (softmax-normalized over{" "}
        <InlineMath>{"j"}</InlineMath>) weight these predictions [1]. The key
        update rule is agreement-driven: when capsule{" "}
        <InlineMath>{"i"}</InlineMath>'s prediction for capsule{" "}
        <InlineMath>{"j"}</InlineMath> agrees with capsule{" "}
        <InlineMath>{"j"}</InlineMath>'s actual output, the coupling coefficient
        increases. After three iterations, each lower capsule routes primarily
        to the one higher capsule it agrees with most — a soft, learned
        assignment rather than a fixed pooling operation.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  s_j &= \\sum_i c_{ij}\\, \\hat{u}_{j|i} \\\\
  v_j &= \\text{squash}(s_j) \\\\
  b_{ij} &\\leftarrow b_{ij} + \\hat{u}_{j|i} \\cdot v_j \\\\
  c_{ij} &= \\text{softmax}(b_{ij})
\\end{aligned}$$`}</MathBlock>

      <RoutingByAgreement />

      <p style={prose}>
        Sabour et al.'s original routing was a clean intuition but theoretically
        ad hoc — three iterations of agreement-driven softmax updates with no
        clear convergence analysis. Hinton, Sabour &amp; Frosst (2018) [2] replaced
        it with a more principled formulation: <em>EM routing on matrix
        capsules</em>, where each capsule outputs a <InlineMath>{"4 \\times 4"}</InlineMath>{" "}
        pose matrix and a separate activation scalar, and the routing computes
        a soft assignment via expectation-maximization. The capsules-as-mixture-components
        framing is mathematically cleaner: EM routing is doing inference in a
        Gaussian mixture where each higher-level capsule is one mixture component,
        and the routing coefficients are posterior probabilities. The matrix-capsules
        paper achieved better results on smallNORB (a 3D-pose-aware benchmark)
        and remains the deepest theoretical treatment of the capsule idea.
      </p>

      <p style={prose}>
        Capsule networks were a major NeurIPS 2017 event and inspired a research
        wave (surveyed by Gu, 2021 [4]), but never scaled to ImageNet-class
        results. Three factors compounded. <em>Compute cost</em>: routing
        iterations are sequential and break the parallelism that makes CNN and
        transformer training efficient on GPUs. <em>Engineering complexity</em>:
        capsule architectures involve more hyperparameters (routing iterations,
        capsule dimensions, primary-capsule layer design) than equivalent CNN or
        transformer baselines, and reproducing reported results was notoriously
        finicky. <em>Attention happened</em>: by 2018, the routing-by-agreement
        intuition was being captured more flexibly and at greater scale by the
        attention mechanism inside transformers — a learned alignment between
        every pair of tokens, rather than a hand-designed routing between fixed
        capsule layers. Hinton himself later moved to a different formulation
        (GLOM, 2021) that incorporated some capsule insights inside a
        transformer-shaped architecture. Capsule networks now occupy the textbook
        role of an idea whose time was wrong — important conceptually,
        supplanted in practice.
      </p>

      <DynamicRouting />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
