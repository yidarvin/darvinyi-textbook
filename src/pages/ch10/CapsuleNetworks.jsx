import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import CnnVsCapsnet from "../../components/widgets/ch10/CnnVsCapsnet";
import CapsuleVector from "../../components/widgets/ch10/CapsuleVector";
import DynamicRouting from "../../components/widgets/ch10/DynamicRouting";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Dynamic Routing Between Capsules", authors: "Sabour, Frosst, Hinton", venue: "NeurIPS", year: "2017", tag: "seminal" },
  { num: "[2]", title: "Matrix Capsules with EM Routing", authors: "Hinton, Sabour, Frosst", venue: "ICLR", year: "2018", tag: "paper" },
  { num: "[3]", title: "Transforming Auto-encoders", authors: "Hinton, Krizhevsky, Wang", venue: "ICANN", year: "2011", tag: "paper" },
  { num: "[4]", title: "A Survey of Capsule Networks", authors: "Gu", venue: "Applied Sciences", year: "2021", tag: "survey" },
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
        Chapter 10 · Part II — Architectures
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

      <MathBlock>{`squash(v) = ( ||v||^2 / (1 + ||v||^2) ) * ( v / ||v|| )`}</MathBlock>

      <CapsuleVector />

      {/* ── Section 3: Dynamic Routing by Agreement ───────────────────────── */}
      <div id="dynamic-routing">
        <SectionTitle>Dynamic Routing by Agreement</SectionTitle>
      </div>

      <p style={prose}>
        Each lower-level capsule i makes a prediction about what the output of each
        higher-level capsule j should be, computed as a learned linear transform of
        capsule i's own output. Coupling coefficients (softmax normalized over j)
        weight these predictions. The key update rule is agreement-driven: when
        capsule i's prediction for capsule j agrees with capsule j's actual output,
        the coupling coefficient increases. After 3 iterations, each lower capsule
        routes primarily to the one higher capsule it agrees with most — a soft,
        learned assignment rather than a fixed pooling operation.
      </p>

      <MathBlock>{`s_j = sum_i c_{ij} * u-hat_{j|i}
v_j = squash(s_j)
b_{ij} <- b_{ij} + u-hat_{j|i} . v_j
c_{ij} = softmax(b_{ij})`}</MathBlock>

      <DynamicRouting />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
