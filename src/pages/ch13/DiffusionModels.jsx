import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import ForwardDiffusion from "../../components/widgets/ch13/ForwardDiffusion";
import ReverseDenoising from "../../components/widgets/ch13/ReverseDenoising";
import NoiseSchedule from "../../components/widgets/ch13/NoiseSchedule";
import ScoreFunction from "../../components/widgets/ch13/ScoreFunction";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Denoising Diffusion Probabilistic Models (DDPM)", authors: "Ho, Jain, Abbeel", venue: "NeurIPS", year: "2020", tag: "seminal" },
  { num: "[2]", title: "Denoising Diffusion Implicit Models (DDIM)", authors: "Song, Meng, Ermon", venue: "ICLR", year: "2021", tag: "paper" },
  { num: "[3]", title: "Score-Based Generative Modeling through Stochastic Differential Equations", authors: "Song, Sohl-Dickstein, Kingma, Kumar, Ermon, Poole", venue: "ICLR", year: "2021", tag: "paper" },
  { num: "[4]", title: "High-Resolution Image Synthesis with Latent Diffusion Models", authors: "Rombach, Blattmann, Lorenz, Esser, Ommer", venue: "CVPR", year: "2022", tag: "paper" },
  { num: "[5]", title: "Classifier-Free Diffusion Guidance", authors: "Ho & Salimans", venue: "NeurIPS Workshop", year: "2021", tag: "paper" },
  { num: "[6]", title: "Improved Denoising Diffusion Probabilistic Models", authors: "Nichol & Dhariwal", venue: "ICML", year: "2021", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "forward-diffusion",  label: "Forward Process" },
  { id: "reverse-denoising",  label: "Reverse Denoising" },
  { id: "noise-schedules",    label: "Noise Schedules" },
  { id: "score-functions",    label: "Score Functions" },
];

export default function DiffusionModels() {
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
        Chapter 13 · Part III — Generative Models
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
        Diffusion Models
      </h1>

      <ChapterLede>
        Diffusion models learn to generate by learning to undo destruction.
        The forward process defines a fixed Markov chain that gradually corrupts
        any data point into pure Gaussian noise over T timesteps. A neural network
        learns the reverse: given a noisy version at step t, predict the noise that
        was added. Sampling then becomes denoising — starting from noise and
        iteratively removing it using the learned network, guided by what the
        network knows about the data distribution.
      </ChapterLede>

      {/* ── Section 1: The Forward Process ──────────────────────────────────── */}
      <div id="forward-diffusion">
        <SectionTitle>The Forward Process</SectionTitle>
      </div>

      <p style={prose}>
        The forward process q(x_t | x_{"{t-1}"}) adds a small amount of Gaussian noise
        at each step, controlled by a variance schedule β_t. A key mathematical
        property is that x_t can be sampled directly from x_0 without simulating
        all intermediate steps: x_t = √ᾱ_t · x_0 + √(1 − ᾱ_t) · ε,
        where ε ~ N(0,I) and ᾱ_t is the cumulative product of (1 − β_s).
        This makes training efficient — any timestep can be reached in one operation.
      </p>

      <MathBlock>{`q(x_t | x_0) = N(x_t ; sqrt(alpha_bar_t) * x_0 ,  (1 - alpha_bar_t) * I)
x_t = sqrt(alpha_bar_t) * x_0 + sqrt(1 - alpha_bar_t) * eps ,   eps ~ N(0, I)`}</MathBlock>

      <ForwardDiffusion />

      {/* ── Section 2: Reverse Denoising ────────────────────────────────────── */}
      <div id="reverse-denoising">
        <SectionTitle>Reverse Denoising</SectionTitle>
      </div>

      <p style={prose}>
        The reverse process p_θ(x_{"{t-1}"} | x_t) is parameterized by a neural
        network that predicts the noise ε added at each step. The training
        objective simplifies to a mean squared error between the true noise and
        the predicted noise — equivalent to maximizing the variational lower bound.
        At inference, the model generates by running the reverse process from
        x_T ~ N(0,I): at each step, it predicts and subtracts noise, adding a
        small amount of controlled randomness to avoid deterministic outputs.
      </p>

      <MathBlock>{`L = E_{t, x_0, eps} [ || eps - eps_theta( sqrt(alpha_bar_t)*x_0 + sqrt(1-alpha_bar_t)*eps, t ) ||^2 ]`}</MathBlock>

      <ReverseDenoising />

      {/* ── Section 3: Noise Schedules ───────────────────────────────────────── */}
      <div id="noise-schedules">
        <SectionTitle>Noise Schedules</SectionTitle>
      </div>

      <p style={prose}>
        The noise schedule {"{β_t}"} determines how quickly structure is destroyed
        during the forward process. The original DDPM used a linear schedule where
        β_t increases uniformly. The cosine schedule, introduced later, was
        designed so that the signal-to-noise ratio decreases more gradually —
        the model sees useful signal for more of the T timesteps, leading to better
        generation quality. At high timesteps the linear schedule drops SNR to near
        zero very quickly, wasting training capacity on near-pure-noise inputs.
      </p>

      <NoiseSchedule />

      {/* ── Section 4: Score Functions & Score Matching ──────────────────────── */}
      <div id="score-functions">
        <SectionTitle>Score Functions &amp; Score Matching</SectionTitle>
      </div>

      <p style={prose}>
        The score function of a distribution is the gradient of its log probability
        with respect to the data: ∇_x log p(x). It points in the direction of
        increasing data density — toward regions where real data lives. A diffusion
        model implicitly learns the score function at every noise level. Sampling
        by following the score field with Langevin dynamics is equivalent to running
        the diffusion reverse process, and this connection gives diffusion models
        a rigorous theoretical foundation in score-based generative modeling.
      </p>

      <MathBlock>{`score(x) = nabla_x log p(x)
Langevin step: x <- x + (eta/2) * nabla_x log p(x) + sqrt(eta) * eps`}</MathBlock>

      <ScoreFunction />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
