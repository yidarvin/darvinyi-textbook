import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import ForwardDiffusion from "../../components/widgets/ch19/ForwardDiffusion";
import ReverseDenoising from "../../components/widgets/ch19/ReverseDenoising";
import NoiseSchedule from "../../components/widgets/ch19/NoiseSchedule";
import ScoreFunction from "../../components/widgets/ch19/ScoreFunction";
import NoiseInjectionFormula from "../../components/diagrams/ch19/NoiseInjectionFormula";
import ClassifierFreeGuidance from "../../components/diagrams/ch19/ClassifierFreeGuidance";
import SchedulesAndSNR from "../../components/diagrams/ch19/SchedulesAndSNR";
import LatentDiffusionArchitecture from "../../components/diagrams/ch19/LatentDiffusionArchitecture";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Denoising Diffusion Probabilistic Models (DDPM)", authors: "Ho, Jain, Abbeel", venue: "NeurIPS", year: "2020", tag: "seminal" },
  { num: 2, title: "Denoising Diffusion Implicit Models (DDIM)", authors: "Song, Meng, Ermon", venue: "ICLR", year: "2021", tag: "paper" },
  { num: 3, title: "Score-Based Generative Modeling through Stochastic Differential Equations", authors: "Song, Sohl-Dickstein, Kingma, Kumar, Ermon, Poole", venue: "ICLR", year: "2021", tag: "paper" },
  { num: 4, title: "High-Resolution Image Synthesis with Latent Diffusion Models", authors: "Rombach, Blattmann, Lorenz, Esser, Ommer", venue: "CVPR", year: "2022", tag: "paper" },
  { num: 5, title: "Classifier-Free Diffusion Guidance", authors: "Ho & Salimans", venue: "NeurIPS Workshop", year: "2021", tag: "paper" },
  { num: 6, title: "Improved Denoising Diffusion Probabilistic Models", authors: "Nichol & Dhariwal", venue: "ICML", year: "2021", tag: "paper" },
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
        Chapter 19 · Part V — Image Generative Models
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
        The forward process <InlineMath>{"q(x_t \\mid x_{t-1})"}</InlineMath> adds a
        small amount of Gaussian noise at each step, controlled by a variance
        schedule <InlineMath>{"\\beta_t"}</InlineMath>. A key mathematical property
        is that <InlineMath>{"x_t"}</InlineMath> can be sampled directly from{" "}
        <InlineMath>{"x_0"}</InlineMath> without simulating all intermediate steps:{" "}
        <InlineMath>{"x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon"}</InlineMath>,
        where <InlineMath>{"\\varepsilon \\sim \\mathcal{N}(0, I)"}</InlineMath> and{" "}
        <InlineMath>{"\\bar\\alpha_t"}</InlineMath> is the cumulative product of{" "}
        <InlineMath>{"(1 - \\beta_s)"}</InlineMath>. This makes training efficient —
        any timestep can be reached in one operation.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  q(x_t \\mid x_0) &= \\mathcal{N}\\bigl(x_t;\\ \\sqrt{\\bar\\alpha_t}\\, x_0,\\ (1 - \\bar\\alpha_t)\\, I\\bigr) \\\\
  x_t &= \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon, \\quad \\varepsilon \\sim \\mathcal{N}(0, I)
\\end{aligned}$$`}</MathBlock>

      <NoiseInjectionFormula />

      <p style={prose}>
        Ho, Jain &amp; Abbeel's <em>Denoising Diffusion Probabilistic Models</em> [1]
        is the landmark 2020 paper that brought diffusion into mainstream practice —
        but the core math was sitting in the literature for years before. Sohl-Dickstein,
        Weiss, Maheswaranathan &amp; Ganguli (2015) proposed the same
        forward-noising / reverse-denoising structure, derived as a non-equilibrium
        statistical-physics analogy. Their version was theoretically clean but
        practically slow and didn't generate competitive samples. The DDPM paper's
        contributions were primarily empirical and architectural: a specific
        parameterization of the reverse process (predict the noise{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> rather than the mean of the reverse
        Gaussian), a U-Net architecture for the noise predictor, and a training
        objective that simplifies dramatically when you assume fixed forward-process
        variances. These choices took the same math from "interesting but slow" to
        "competitive with GANs on CIFAR-10," and within two years to "state of the
        art for image generation."
      </p>

      <p style={prose}>
        A naive implementation of the forward process would require simulating all{" "}
        <InlineMath>{"T"}</InlineMath> noising steps to obtain{" "}
        <InlineMath>{"x_T"}</InlineMath>. With <InlineMath>{"T = 1000"}</InlineMath>{" "}
        (DDPM's choice), this would make training a hundred-times slower than
        necessary. The closed-form expression{" "}
        <InlineMath>{"x_t = \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon"}</InlineMath>{" "}
        lets training proceed by sampling a random timestep{" "}
        <InlineMath>{"t"}</InlineMath>, jumping directly from{" "}
        <InlineMath>{"x_0"}</InlineMath> to <InlineMath>{"x_t"}</InlineMath> in one
        operation, and computing the loss at that single timestep. The cumulative
        product{" "}
        <InlineMath>{"\\bar\\alpha_t = \\prod_{s=1}^{t}(1 - \\beta_s)"}</InlineMath>{" "}
        can be precomputed once and indexed into during training — no per-step
        simulation needed. This single property is why diffusion training is
        computationally tractable.
      </p>

      <ForwardDiffusion />

      {/* ── Section 2: Reverse Denoising ────────────────────────────────────── */}
      <div id="reverse-denoising">
        <SectionTitle>Reverse Denoising</SectionTitle>
      </div>

      <p style={prose}>
        The reverse process{" "}
        <InlineMath>{"p_\\theta(x_{t-1} \\mid x_t)"}</InlineMath> is parameterized by
        a neural network that predicts the noise{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> added at each step. The training
        objective simplifies to a mean squared error between the true noise and
        the predicted noise — equivalent to maximizing the variational lower bound.
        At inference, the model generates by running the reverse process from{" "}
        <InlineMath>{"x_T \\sim \\mathcal{N}(0, I)"}</InlineMath>: at each step, it
        predicts and subtracts noise, adding a small amount of controlled randomness
        to avoid deterministic outputs.
      </p>

      <MathBlock>{"$$\\mathcal{L}_{\\text{simple}} = \\mathbb{E}_{t, x_0, \\varepsilon}\\!\\left[\\, \\bigl\\| \\varepsilon - \\varepsilon_\\theta\\bigl(\\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon,\\ t\\bigr) \\bigr\\|^2 \\,\\right]$$"}</MathBlock>

      <p style={prose}>
        DDPM's training loss is in principle the variational lower bound on{" "}
        <InlineMath>{"\\log p(x)"}</InlineMath> — a sum of KL divergences across all{" "}
        <InlineMath>{"T"}</InlineMath> timesteps, structurally analogous to the
        hierarchical VAE objective. Ho et al. [1] showed that with one natural
        reparameterization — predicting the noise{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> that was added rather than the mean
        of <InlineMath>{"p_\\theta(x_{t-1} \\mid x_t)"}</InlineMath> — and dropping
        the per-timestep weighting, the loss simplifies to the clean MSE between
        true and predicted noise shown above. This isn't quite the variational bound
        anymore (it's a reweighted version), but in practice it works better than
        the exact bound. The connection to the VAE framework matters: diffusion can
        be derived as a hierarchical VAE with a fixed Gaussian encoder, a
        Markov-chain decoder, and <InlineMath>{"T"}</InlineMath> latent layers —
        which is why the same techniques (reparameterization trick, ELBO
        maximization) apply.
      </p>

      <p style={prose}>
        Almost every diffusion model uses a <strong>U-Net</strong> as the noise
        predictor — the same architecture introduced in Ch 18 for pix2pix. The
        reasons are similar: predicting noise at every pixel requires both global
        semantic understanding (what's in this image?) and pixel-precise
        localization (which pixels look slightly wrong?). The skip connections
        preserve high-resolution information through the bottleneck. Modern
        diffusion U-Nets also incorporate <strong>cross-attention layers</strong>{" "}
        at multiple resolutions, where each spatial position attends to an external
        conditioning sequence — most commonly a text embedding from a CLIP or T5
        encoder. This is how text-to-image models inject "a cat in a hat" into the
        generative process: the conditioning passes through cross-attention at
        every U-Net stage, steering the denoising direction at every step.
      </p>

      <p style={prose}>
        DDPM sampling requires running the reverse process for all{" "}
        <InlineMath>{"T = 1000"}</InlineMath> steps — every image takes a thousand
        forward passes through the U-Net. Song, Meng &amp; Ermon's{" "}
        <em>Denoising Diffusion Implicit Models</em> (DDIM) [2] showed that the
        reverse process can be rewritten as a <em>non-Markovian</em> chain that's{" "}
        <em>deterministic</em> in the limit, allowing the same trained network to
        sample in 10 to 50 steps with negligible quality loss. The key observation:
        the forward process's closed-form expression doesn't actually require the
        Markov property, so the reverse process doesn't need it either. DDIM and
        its many descendants (DPM-Solver, PNDM, UniPC) are what made diffusion
        practical for interactive use. Modern inference uses 20–50 steps almost
        universally; DDPM's 1000-step ancestral sampling is a teaching baseline,
        not a deployment configuration.
      </p>

      <p style={prose}>
        Two practical advances in 2021–2022 transformed diffusion from a research
        curiosity into the dominant production paradigm.{" "}
        <strong>Classifier-free guidance</strong> (Ho &amp; Salimans 2021) [5]
        solved conditional generation: train the same network to predict noise
        both with and without conditioning (by randomly dropping the condition
        during training ~10% of the time), then at inference combine the two
        predictions as{" "}
        <InlineMath>{"\\hat\\varepsilon = \\varepsilon_\\text{uncond} + w \\cdot (\\varepsilon_\\text{cond} - \\varepsilon_\\text{uncond})"}</InlineMath>.
        The guidance scale <InlineMath>{"w"}</InlineMath> (typically 7.5 for Stable
        Diffusion) amplifies the conditional direction beyond what the model would
        naturally produce. Without CFG, conditional samples barely respect their
        conditions; with CFG, text-to-image generation works.{" "}
        <strong>Latent Diffusion</strong> (Rombach, Blattmann, Lorenz, Esser &amp;
        Ommer 2022) [4] made diffusion computationally feasible at high
        resolution: train a VAE-style autoencoder to compress images into a
        smaller latent space (4× spatial downsampling, 4 channels), then run
        diffusion entirely in that latent space. A 512×512 image becomes a
        64×64×4 latent — 48× fewer values to denoise at each step.{" "}
        <strong>Stable Diffusion</strong> is Latent Diffusion with text
        conditioning via CLIP, and is the open-weight foundation that most of the
        2022–2026 image-generation explosion is built on.
      </p>

      <ClassifierFreeGuidance />

      <ReverseDenoising />

      {/* ── Section 3: Noise Schedules ───────────────────────────────────────── */}
      <div id="noise-schedules">
        <SectionTitle>Noise Schedules</SectionTitle>
      </div>

      <p style={prose}>
        The noise schedule <InlineMath>{"\\{\\beta_t\\}"}</InlineMath> determines how
        quickly structure is destroyed during the forward process. The original
        DDPM used a linear schedule where{" "}
        <InlineMath>{"\\beta_t"}</InlineMath> increases uniformly. The cosine
        schedule, introduced later, was designed so that the signal-to-noise ratio
        decreases more gradually — the model sees useful signal for more of the{" "}
        <InlineMath>{"T"}</InlineMath> timesteps, leading to better generation
        quality. At high timesteps the linear schedule drops SNR to near zero very
        quickly, wasting training capacity on near-pure-noise inputs.
      </p>

      <p style={prose}>
        Nichol &amp; Dhariwal's <em>Improved Denoising Diffusion Probabilistic
        Models</em> [6] analyzed the linear schedule and found a structural
        problem: signal-to-noise ratio (SNR) drops to nearly zero too quickly. By
        the time <InlineMath>{"t = T/2"}</InlineMath>, most of the image's
        structure has already been destroyed under a linear schedule, and the
        remaining <InlineMath>{"T/2"}</InlineMath> timesteps are spent on
        near-pure-noise inputs where the network learns very little. The{" "}
        <strong>cosine schedule</strong> they proposed defines{" "}
        <InlineMath>{"\\bar\\alpha_t = \\cos^2\\!\\bigl(\\tfrac{t/T + s}{1 + s} \\cdot \\tfrac{\\pi}{2}\\bigr)"}</InlineMath>{" "}
        with a small offset <InlineMath>{"s"}</InlineMath> — keeping SNR usable for
        longer, so the model sees meaningful signal across more of the timestep
        range. Improved DDPM showed this single change improved sample quality and
        training stability across multiple datasets. Almost every modern diffusion
        model uses a cosine or cosine-like schedule; linear is now mostly a
        teaching reference.
      </p>

      <SchedulesAndSNR />

      <p style={prose}>
        The schedule is one of several diffusion hyperparameters that look small
        but have outsized impact. Different schedules favor different content types
        — image-generation models tend to use shapes similar to cosine; video
        models use schedules tuned to preserve temporal coherence; latent-space
        diffusion (Stable Diffusion) uses schedules different from pixel-space
        diffusion because the data distribution in latent space has different
        statistics. The interpretation through SNR — at each{" "}
        <InlineMath>{"t"}</InlineMath>, what fraction of{" "}
        <InlineMath>{"x_t"}</InlineMath>'s variance comes from signal vs noise —
        gives a unified way to compare schedules across these contexts. SNR-based
        formulations (sometimes called "v-prediction" or "EDM-style
        parameterization," following Karras, Aittala, Aila &amp; Laine 2022)
        re-parameterize the diffusion process directly in terms of the SNR ratio,
        making different schedules easier to compare and combine.
      </p>

      <NoiseSchedule />

      {/* ── Section 4: Score Functions & Score Matching ──────────────────────── */}
      <div id="score-functions">
        <SectionTitle>Score Functions &amp; Score Matching</SectionTitle>
      </div>

      <p style={prose}>
        The score function of a distribution is the gradient of its log probability
        with respect to the data:{" "}
        <InlineMath>{"\\nabla_x \\log p(x)"}</InlineMath>. It points in the
        direction of increasing data density — toward regions where real data
        lives. A diffusion model implicitly learns the score function at every
        noise level. Sampling by following the score field with Langevin dynamics
        is equivalent to running the diffusion reverse process, and this connection
        gives diffusion models a rigorous theoretical foundation in score-based
        generative modeling.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{score}(x) &= \\nabla_x \\log p(x) \\\\
  \\text{Langevin update:} \\quad x &\\leftarrow x + \\tfrac{\\eta}{2}\\, \\nabla_x \\log p(x) + \\sqrt{\\eta}\\, \\varepsilon, \\quad \\varepsilon \\sim \\mathcal{N}(0, I)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Song, Sohl-Dickstein, Kingma, Kumar, Ermon &amp; Poole's score-based SDE
        paper [3] provided the most general theoretical framework for diffusion.
        The forward noising process can be written as a <em>stochastic
        differential equation</em> (SDE) — a continuous-time formulation where
        discrete DDPM is just one possible discretization. The reverse-time SDE
        has a closed-form expression in terms of the score function{" "}
        <InlineMath>{"\\nabla_x \\log p_t(x)"}</InlineMath> of the data
        distribution at time <InlineMath>{"t"}</InlineMath> — and training a neural
        network to predict the noise at each step is mathematically equivalent (up
        to a constant) to training it to predict the score. This unification has
        practical consequences. DDPM, score matching with Langevin dynamics, DDIM,
        and the deterministic <em>probability-flow ODE</em> are all the same
        underlying machinery, just discretized differently. Once you train a
        single noise-predicting U-Net, you can sample using any of these methods —
        different speed/quality tradeoffs, same trained model. The SDE perspective
        also makes it natural to use any ODE solver (Heun's method, Runge-Kutta)
        at sampling time, leading to the family of fast samplers (DPM-Solver,
        UniPC) that dominate modern inference pipelines.
      </p>

      <p style={prose}>
        The score-based framing has a complementary view worth naming explicitly:
        the diffusion model can be derived as a hierarchical VAE — a generative
        model with <InlineMath>{"T"}</InlineMath> latent layers stacked between
        the data and a fixed Gaussian prior. The encoder is the forward noising
        process (no parameters, fixed by the schedule); the decoder is the reverse
        denoising process (one U-Net shared across all layers, the network's only
        parameters). The ELBO of this VAE is the principled diffusion objective;
        the simplified <InlineMath>{"\\varepsilon"}</InlineMath>-prediction loss
        is a reweighted version of it. This framing also clarifies why diffusion
        succeeded where deeper VAEs traditionally struggled: the per-step KL
        divergences in diffusion remain small (because each step only adds a small
        amount of noise), while a deep VAE without diffusion structure tends to
        collapse most layers to triviality. Diffusion is a hierarchical VAE that
        works because the hierarchy is engineered to be well-conditioned at every
        level.
      </p>

      <p style={prose}>
        The 2020 DDPM paper started a five-year research wave that defined modern
        generative modeling. Beyond image generation: video diffusion (Sora, Veo,
        Runway Gen-3) extends the same machinery to spatiotemporal data; audio
        diffusion underpins much of modern music and speech generation; 3D
        diffusion is being applied to NeRF-like representations. Within image
        generation, several reformulations of the underlying math have become
        competitive. <strong>Flow Matching</strong> (Lipman, Chen, Ben-Hamu,
        Nickel &amp; Le 2023) trains a network to predict velocity fields instead
        of noise, with a cleaner mathematical derivation and equivalent empirical
        results. <strong>Rectified Flow</strong> (Liu, Gong &amp; Liu 2023)
        straightens trajectories between data and noise, allowing very-few-step
        sampling — Stable Diffusion 3 is built on rectified flow.{" "}
        <strong>Consistency Models</strong> (Song, Dhariwal, Chen &amp; Sutskever
        2023) train networks that can sample in a single step.{" "}
        <strong>Diffusion Transformers (DiT)</strong> (Peebles &amp; Xie 2023)
        replace the U-Net backbone with a transformer, which scales better —
        Sora's video model and FLUX's image model are DiT-based. The field has
        converged on the rough picture that started with DDPM: corrupt data with
        noise on a continuous-time process, train a network to undo the
        corruption, sample by integrating the reverse process. Almost everything
        else — exact loss formulation, network architecture, sampling algorithm,
        conditioning method — is being actively rebuilt every six months.
      </p>

      <LatentDiffusionArchitecture />

      <ScoreFunction />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
