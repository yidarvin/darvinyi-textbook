import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import MinimaxGame from "../../components/widgets/ch17/MinimaxGame";
import TrainingDynamics from "../../components/widgets/ch17/TrainingDynamics";
import ModeCollapse from "../../components/widgets/ch17/ModeCollapse";
import DBEvolution from "../../components/widgets/ch17/DBEvolution";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Generative Adversarial Networks", authors: "Goodfellow, Pouget-Abadie, Mirza, Xu, Warde-Farley, Ozair, Courville, Bengio", venue: "NeurIPS", year: "2014", tag: "seminal" },
  { num: "[2]", title: "Wasserstein GAN", authors: "Arjovsky, Chintala, Bottou", venue: "ICML", year: "2017", tag: "seminal" },
  { num: "[3]", title: "Improved Training of Wasserstein GANs (WGAN-GP)", authors: "Gulrajani, Ahmed, Arjovsky, Dumoulin, Courville", venue: "NeurIPS", year: "2017", tag: "paper" },
  { num: "[4]", title: "Progressive Growing of GANs for Improved Quality, Stability, and Variation", authors: "Karras, Laine, Aila", venue: "ICLR", year: "2018", tag: "paper" },
  { num: "[5]", title: "A Style-Based Generator Architecture for Generative Adversarial Networks (StyleGAN)", authors: "Karras, Laine, Aila", venue: "CVPR", year: "2019", tag: "paper" },
  { num: "[6]", title: "Towards Principled Methods for Training Generative Adversarial Networks", authors: "Arjovsky & Bottou", venue: "ICLR", year: "2017", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-minimax-game",            label: "The Minimax Game" },
  { id: "training-dynamics",           label: "Training Dynamics" },
  { id: "mode-collapse",               label: "Mode Collapse" },
  { id: "decision-boundary-evolution", label: "Boundary Evolution" },
];

export default function GANs() {
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
        Chapter 17 · Part V — Image Generative Models
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
        Generative Adversarial Networks
      </h1>

      <ChapterLede>
        Two networks, one adversarial objective: the generator tries to produce
        data that fools the discriminator; the discriminator tries to distinguish
        real data from generated fakes. Their minimax competition drives both
        toward a theoretical equilibrium where the generator perfectly replicates
        the data distribution and the discriminator can do no better than random
        guessing. Reaching that equilibrium in practice is notoriously unstable —
        and the instability is as instructive as the theory.
      </ChapterLede>

      {/* ── Section 1: The Minimax Game ─────────────────────────────────────── */}
      <div id="the-minimax-game">
        <SectionTitle>The Minimax Game</SectionTitle>
      </div>

      <p style={prose}>
        The GAN objective frames generation as a two-player zero-sum game. The
        discriminator D maximizes its ability to classify real inputs as real and
        generated inputs as fake. The generator G simultaneously maximizes D's
        error on generated data — equivalently, it minimizes log(1 - D(G(z))),
        or in the non-saturating variant, maximizes log D(G(z)). At Nash equilibrium,
        G produces the true data distribution and D outputs 0.5 everywhere — unable
        to do better than chance.
      </p>

      <MathBlock>{`min_G max_D  E_x[log D(x)] + E_z[log(1 - D(G(z)))]`}</MathBlock>

      <MinimaxGame />

      {/* ── Section 2: Training Dynamics & Instability ──────────────────────── */}
      <div id="training-dynamics">
        <SectionTitle>Training Dynamics &amp; Instability</SectionTitle>
      </div>

      <p style={prose}>
        GAN training is a delicate balance. If the discriminator becomes too strong
        too quickly, the gradients it provides to the generator become uninformative —
        the generator receives near-zero signal to improve. If the generator improves
        too fast, the discriminator never learns a useful signal. Common failure modes
        include mode collapse, where the generator produces only a subset of the real
        distribution, and training oscillation, where neither network converges.
        Diagnosing these failures requires watching both loss curves simultaneously.
      </p>

      <TrainingDynamics />

      {/* ── Section 3: Mode Collapse & WGAN ─────────────────────────────────── */}
      <div id="mode-collapse">
        <SectionTitle>Mode Collapse &amp; WGAN</SectionTitle>
      </div>

      <p style={prose}>
        Mode collapse occurs when the generator finds a small set of outputs that
        consistently fool the discriminator, and stops exploring the rest of the
        data distribution. The original GAN loss provides weak gradients when
        the discriminator is confident, making recovery from collapse difficult.
        The Wasserstein GAN replaces the Jensen-Shannon divergence with the
        Wasserstein-1 distance, which provides meaningful gradients even when
        the real and generated distributions do not overlap, making training
        more stable and mode collapse less likely.
      </p>

      <MathBlock>{`L_WGAN = E_x[D(x)] - E_z[D(G(z))]   subject to ||D||_L <= 1`}</MathBlock>

      <ModeCollapse />

      {/* ── Section 4: Decision Boundary Evolution ──────────────────────────── */}
      <div id="decision-boundary-evolution">
        <SectionTitle>Decision Boundary Evolution</SectionTitle>
      </div>

      <p style={prose}>
        The discriminator's decision boundary evolves as training progresses.
        Early in training it is a simple linear separator that distinguishes
        obvious distributional differences. As the generator improves and produces
        more realistic outputs, the boundary must become increasingly complex to
        maintain discrimination ability. Watching this boundary evolve epoch by
        epoch reveals the cat-and-mouse dynamic at the heart of adversarial training.
      </p>

      <DBEvolution />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
