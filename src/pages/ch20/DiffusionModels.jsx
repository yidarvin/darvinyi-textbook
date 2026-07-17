import { useTocSections } from "../../components/layout/TocContext";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import { buildCitations } from "../../data/citations";
import ForwardDiffusion from "../../components/widgets/ch20/ForwardDiffusion";
import ReverseDenoising from "../../components/widgets/ch20/ReverseDenoising";
import NoiseSchedule from "../../components/widgets/ch20/NoiseSchedule";
import ScoreFunction from "../../components/widgets/ch20/ScoreFunction";
import NoiseInjectionFormula from "../../components/diagrams/ch20/NoiseInjectionFormula";
import ClassifierFreeGuidance from "../../components/diagrams/ch20/ClassifierFreeGuidance";
import SchedulesAndSNR from "../../components/diagrams/ch20/SchedulesAndSNR";
import LatentDiffusionArchitecture from "../../components/diagrams/ch20/LatentDiffusionArchitecture";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = buildCitations([
  { title: "Denoising Diffusion Probabilistic Models (DDPM)", authors: "Ho, Jain, Abbeel", venue: "NeurIPS", year: "2020", tag: "seminal" },
  { title: "Deep Unsupervised Learning using Nonequilibrium Thermodynamics", authors: "Sohl-Dickstein, Weiss, Maheswaranathan, Ganguli", venue: "ICML", year: "2015", tag: "seminal" },
  { title: "Denoising Diffusion Implicit Models (DDIM)", authors: "Song, Meng, Ermon", venue: "ICLR", year: "2021", tag: "paper" },
  { title: "Diffusion Models Beat GANs on Image Synthesis", authors: "Dhariwal, Nichol", venue: "NeurIPS", year: "2021", tag: "paper" },
  { title: "Classifier-Free Diffusion Guidance", authors: "Ho, Salimans", venue: "NeurIPS Workshop", year: "2021", tag: "paper" },
  "latent-diffusion",
  { title: "Improved Denoising Diffusion Probabilistic Models", authors: "Nichol, Dhariwal", venue: "ICML", year: "2021", tag: "paper" },
  { title: "Progressive Distillation for Fast Sampling of Diffusion Models", authors: "Salimans, Ho", venue: "ICLR", year: "2022", tag: "paper" },
  { title: "Elucidating the Design Space of Diffusion-Based Generative Models (EDM)", authors: "Karras, Aittala, Aila, Laine", venue: "NeurIPS", year: "2022", tag: "paper" },
  { title: "Generative Modeling by Estimating Gradients of the Data Distribution", authors: "Song, Ermon", venue: "NeurIPS", year: "2019", tag: "seminal" },
  { title: "Score-Based Generative Modeling through Stochastic Differential Equations", authors: "Song, Sohl-Dickstein, Kingma, Kumar, Ermon, Poole", venue: "ICLR", year: "2021", tag: "paper" },
  { title: "Flow Matching for Generative Modeling", authors: "Lipman, Chen, Ben-Hamu, Nickel, Le", venue: "ICLR", year: "2023", tag: "paper" },
  { title: "Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow", authors: "Liu, Gong, Liu", venue: "ICLR", year: "2023", tag: "paper" },
  { title: "Consistency Models", authors: "Song, Dhariwal, Chen, Sutskever", venue: "ICML", year: "2023", tag: "paper" },
  { title: "Scalable Diffusion Models with Transformers (DiT)", authors: "Peebles, Xie", venue: "ICCV", year: "2023", tag: "paper" },
  { title: "Latent Consistency Models: Synthesizing High-Resolution Images with Few-Step Inference", authors: "Luo, Tan, Huang, Li, Zhao", venue: "arXiv", year: "2023", tag: "paper" },
  { title: "Adversarial Diffusion Distillation", authors: "Sauer, Lorenz, Blattmann, Rombach", venue: "arXiv", year: "2023", tag: "paper" },
  { title: "Genie: Generative Interactive Environments", authors: "Bruce et al.", venue: "ICML", year: "2024", tag: "paper" },
]);

const TOC_SECTIONS = [
  { id: "forward-diffusion",     label: "Forward Process" },
  { id: "reverse-denoising",     label: "Reverse Denoising" },
  { id: "noise-schedules",       label: "Noise Schedules" },
  { id: "score-functions",       label: "Score Functions" },
  { id: "video-and-world-models", label: "Video & World Models" },
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
        Chapter 20 · Part V — Generative Models
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
        A network is trained to reverse a slow, fixed corruption process —
        not to leap from noise to a finished image in one act of creation,
        but to walk that path backward, one small denoising move at a time.
        That idea, refined between 2020 and 2022, is the machinery behind
        Stable Diffusion, Sora, and most of the image- and video-generation
        systems built since.
      </ChapterLede>

      {/* ── Section 1: The Forward Process ──────────────────────────────────── */}
      <div id="forward-diffusion">
        <SectionTitle>The Forward Process</SectionTitle>
      </div>

      <p style={prose}>
        The forward process is a fixed <strong>Markov chain</strong> — a
        sequence of random variables where each step depends only on the one
        immediately before it, not on the full history — that gradually
        corrupts a data point into pure noise. At each of{" "}
        <InlineMath>{"T"}</InlineMath> steps, a small amount of Gaussian
        noise is mixed in, controlled by a variance schedule{" "}
        <InlineMath>{"\\beta_t"}</InlineMath> that decides how much noise
        enters at that step. Because every step depends only on its immediate
        predecessor, the whole chain factors into a product of simple
        single-step transitions:
      </p>

      <MathBlock>{"$$q(x_t \\mid x_{t-1}) = \\mathcal{N}\\bigl(x_t;\\ \\sqrt{1-\\beta_t}\\, x_{t-1},\\ \\beta_t\\, I\\bigr)$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"x_{t-1}"}</InlineMath> is the sample one step less
        noisy than <InlineMath>{"x_t"}</InlineMath>: each step shrinks the
        previous mean by a factor <InlineMath>{"\\sqrt{1-\\beta_t}"}</InlineMath>{" "}
        and adds fresh noise with variance{" "}
        <InlineMath>{"\\beta_t"}</InlineMath>. Unrolling this recursion across
        all <InlineMath>{"T"}</InlineMath> steps — repeatedly substituting one
        Gaussian into the next — collapses the entire chain into a single
        closed-form jump directly from <InlineMath>{"x_0"}</InlineMath>:
      </p>

      <MathBlock>{`$$\\begin{aligned}
  q(x_t \\mid x_0) &= \\mathcal{N}\\bigl(x_t;\\ \\sqrt{\\bar\\alpha_t}\\, x_0,\\ (1 - \\bar\\alpha_t)\\, I\\bigr) \\\\
  x_t &= \\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon, \\quad \\varepsilon \\sim \\mathcal{N}(0, I)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\bar\\alpha_t = \\prod_{s=1}^{t}(1-\\beta_s)"}</InlineMath>{" "}
        is the cumulative product of the single-step retention factors above,
        and <InlineMath>{"\\varepsilon \\sim \\mathcal{N}(0, I)"}</InlineMath>{" "}
        is one fresh standard Gaussian draw — this closed form reaches any
        timestep directly from <InlineMath>{"x_0"}</InlineMath> without
        simulating the intermediate chain. Concretely, under the cosine
        schedule used later in this chapter, <InlineMath>{"\\bar\\alpha_{500} \\approx 0.49"}</InlineMath>,
        so <InlineMath>{"x_{500} \\approx 0.70\\, x_0 + 0.71\\, \\varepsilon"}</InlineMath> —
        a specific data point and a specific noise draw mixed in almost
        exactly equal proportion, the crossover point where signal and noise
        carry equal variance.
      </p>

      <NoiseInjectionFormula />

      <p style={prose}>
        Ho et al.'s (2020) <em>Denoising Diffusion Probabilistic Models</em>{" "}
        [1] is the landmark paper that brought diffusion into mainstream
        practice — but the core math was sitting in the literature for years
        before. Sohl-Dickstein et al. (2015) [2] proposed the same
        forward-noising / reverse-denoising structure, derived as a
        non-equilibrium statistical-physics analogy. Their version was
        theoretically clean but practically slow and didn't generate
        competitive samples. The DDPM paper's contributions were primarily
        empirical and architectural: a specific parameterization of the
        reverse process (predict the noise{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> rather than the mean of the
        reverse Gaussian), a U-Net architecture for the noise predictor, and
        a training objective that simplifies dramatically once the
        forward-process variances are held fixed. These choices took the
        same math from "interesting but slow" to "competitive with GANs on
        CIFAR-10," and within two years to "state of the art for image
        generation."
      </p>

      <p style={prose}>
        A naive implementation of the forward process would require
        simulating all <InlineMath>{"T"}</InlineMath> noising steps to obtain{" "}
        <InlineMath>{"x_T"}</InlineMath>. With <InlineMath>{"T = 1000"}</InlineMath>{" "}
        (DDPM's choice), this would make training up to a thousand-times
        slower than necessary. The closed-form expression above lets training
        proceed by sampling a random timestep <InlineMath>{"t"}</InlineMath>,
        jumping directly from <InlineMath>{"x_0"}</InlineMath> to{" "}
        <InlineMath>{"x_t"}</InlineMath> in one operation, and computing the
        loss at that single timestep. We can precompute the cumulative
        product <InlineMath>{"\\bar\\alpha_t"}</InlineMath> once and index
        into it during training — no per-step simulation needed. This single
        property is why diffusion training is computationally tractable.
      </p>

      <p style={prose}>
        Drag the timestep slider below from <InlineMath>{"t=0"}</InlineMath>{" "}
        toward <InlineMath>{"t=1000"}</InlineMath> and compare the Linear and
        Cosine schedules. Notice how quickly the three clusters blur together
        under Linear well before the halfway point, while Cosine keeps them
        faintly separable for much longer.
      </p>

      <ForwardDiffusion
        tryThis={{
          do: "Drag the timestep slider from t = 0 to t = 1000 and switch between the Linear and Cosine schedules.",
          notice: "Cluster separation collapses well before the halfway point under Linear, while Cosine keeps the three clusters faintly distinguishable much later in the schedule.",
        }}
      />

      {/* ── Section 2: Reverse Denoising ────────────────────────────────────── */}
      <div id="reverse-denoising">
        <SectionTitle>Reverse Denoising</SectionTitle>
      </div>

      <p style={prose}>
        Sampling reverses the forward process: start from pure noise and walk
        the chain backward, undoing one step of corruption at a time. The
        reverse process <InlineMath>{"p_\\theta(x_{t-1} \\mid x_t)"}</InlineMath>{" "}
        is parameterized by a neural network that predicts the noise{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> added at each step. The
        training objective simplifies to a mean squared error between the
        true noise and the predicted noise — equivalent to maximizing the
        variational lower bound. At inference, the model generates by running
        the reverse process from <InlineMath>{"x_T \\sim \\mathcal{N}(0, I)"}</InlineMath>:
        at each step, it predicts and subtracts noise, adding a small amount
        of controlled randomness to avoid deterministic outputs.
      </p>

      <MathBlock>{"$$\\mathcal{L}_{\\text{simple}} = \\mathbb{E}_{t, x_0, \\varepsilon}\\!\\left[\\, \\bigl\\| \\varepsilon - \\varepsilon_\\theta\\bigl(\\sqrt{\\bar\\alpha_t}\\, x_0 + \\sqrt{1 - \\bar\\alpha_t}\\, \\varepsilon,\\ t\\bigr) \\bigr\\|^2 \\,\\right]$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\varepsilon_\\theta"}</InlineMath> is the network's
        noise prediction given the noisy sample and the timestep, and the
        loss is simply squared error between that prediction and the noise{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> actually used to build{" "}
        <InlineMath>{"x_t"}</InlineMath> — no reconstruction term, no
        explicit KL divergence in sight, despite the principled derivation
        underneath. This trained noise predictor plugs directly into the
        per-step update actually used at inference:
      </p>

      <MathBlock>{"$$x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}}\\left(x_t - \\frac{1-\\alpha_t}{\\sqrt{1-\\bar\\alpha_t}}\\,\\varepsilon_\\theta(x_t, t)\\right) + \\sigma_t z, \\qquad z \\sim \\mathcal{N}(0, I)$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\alpha_t = \\bar\\alpha_t / \\bar\\alpha_{t-1}"}</InlineMath>{" "}
        is the single-step retention factor implied by the schedule,{" "}
        <InlineMath>{"\\sigma_t^2 = \\beta_t"}</InlineMath> sets how much
        fresh randomness re-enters at each step, and <InlineMath>{"z"}</InlineMath>{" "}
        is a new standard Gaussian draw at every step except the last, where
        it's set to zero so the final denoising move is deterministic. Repeat
        this update <InlineMath>{"T"}</InlineMath> times, starting from pure
        noise, and the output is a sample from the learned data distribution.
      </p>

      <p style={prose}>
        DDPM's training loss is, in principle, the variational lower bound on{" "}
        <InlineMath>{"\\log p(x)"}</InlineMath> — a sum of KL divergences
        across all <InlineMath>{"T"}</InlineMath> timesteps, structurally
        analogous to the hierarchical VAE objective from Chapter 18. Ho et
        al. [1] showed that with one natural reparameterization — predicting
        the noise <InlineMath>{"\\varepsilon"}</InlineMath> that was added
        rather than the mean of{" "}
        <InlineMath>{"p_\\theta(x_{t-1} \\mid x_t)"}</InlineMath> — and
        dropping the per-timestep weighting, the loss simplifies to the clean
        MSE shown above. This isn't quite the variational bound anymore (it's
        a reweighted version), but in practice it works better than the exact
        bound. The connection to the VAE framework matters: diffusion can be
        derived as a hierarchical VAE with a fixed Gaussian encoder, a
        Markov-chain decoder, and <InlineMath>{"T"}</InlineMath> latent
        layers — which is why the same techniques (the reparameterization
        trick, ELBO — evidence lower bound — maximization) apply here too.
      </p>

      <p style={prose}>
        Almost every diffusion model uses a <strong>U-Net</strong> as the
        noise predictor — the same architecture introduced in Chapter 19 for
        pix2pix. The reasons are similar: predicting noise at every pixel
        requires both global semantic understanding (what's in this image?)
        and pixel-precise localization (which pixels look slightly wrong?).
        The skip connections preserve high-resolution information through
        the bottleneck. Modern diffusion U-Nets also incorporate{" "}
        <strong>cross-attention layers</strong> at multiple resolutions,
        where each spatial position attends to an external conditioning
        sequence — most commonly a text embedding from a CLIP or T5 encoder.
        This is how text-to-image models inject "a cat in a hat" into the
        generative process: the conditioning passes through cross-attention
        at every U-Net stage, steering the denoising direction at every step.
      </p>

      <p style={prose}>
        DDPM sampling requires running the reverse process for all{" "}
        <InlineMath>{"T = 1000"}</InlineMath> steps — every image takes a
        thousand forward passes through the U-Net. Song et al.'s (2021) DDIM
        paper [3] showed that the reverse process can be rewritten as a{" "}
        <em>non-Markovian</em> chain that's <em>deterministic</em> in the
        limit, allowing the same trained network to sample in 10 to 50 steps
        with negligible quality loss. The key observation: the forward
        process's closed-form expression doesn't actually require the Markov
        property, so the reverse process doesn't need it either. DDIM and its
        many descendants (DPM-Solver, PNDM, UniPC) are what made diffusion
        practical for interactive use. Modern inference uses 20–50 steps
        almost universally; DDPM's 1000-step ancestral sampling is a teaching
        baseline, not a deployment configuration.
      </p>

      <p style={prose}>
        Press play on both panels below and let progress run from 0% to
        100%. Notice that both start as an unlabeled, scattered cloud of pure
        noise and organize into the same three color clusters — DDPM (1000
        steps) and DDIM (50 steps) converge to visually equivalent results
        despite DDIM using 5% of the network evaluations, which is the
        practical payoff of DDIM's non-Markovian reformulation.
      </p>

      <ReverseDenoising
        tryThis={{
          do: "Press play on both panels and let progress run from 0% to 100%.",
          notice: "Both panels start as an unlabeled grey noise cloud and organize into the same three color clusters — DDPM (1000 steps) and DDIM (50 steps) converge to visually equivalent results despite DDIM using 5% of the network evaluations.",
        }}
      />

      <p style={prose}>
        Guidance — steering generation toward a class label or a text
        condition — didn't start with classifier-free guidance. Dhariwal
        &amp; Nichol (2021) [4] first showed that a separately trained
        classifier <InlineMath>{"p(y \\mid x_t)"}</InlineMath>, trained to
        recognize labels from noisy images at every noise level, could steer
        sampling by adding its gradient{" "}
        <InlineMath>{"\\nabla_{x_t} \\log p(y \\mid x_t)"}</InlineMath>{" "}
        (scaled by a guidance weight) to the score or noise prediction at
        each step. It worked — this classifier-guidance recipe is what first
        let diffusion models beat GANs on ImageNet — but it required training
        and maintaining a second, noise-robust classifier that had to
        generalize across every noise level the diffusion process would ever
        produce, and it didn't extend naturally to open-ended text prompts
        with no fixed label set.
      </p>

      <p style={prose}>
        Two practical advances in 2021–2022 transformed diffusion from a
        research curiosity into the dominant production paradigm.{" "}
        <strong>Classifier-free guidance</strong> (Ho &amp; Salimans 2021)
        [5] removed the separate classifier entirely: train the same network
        to predict noise both with and without conditioning (by randomly
        dropping the condition during training ~10% of the time), then at
        inference combine the two predictions as{" "}
        <InlineMath>{"\\hat\\varepsilon = \\varepsilon_\\text{uncond} + w \\cdot (\\varepsilon_\\text{cond} - \\varepsilon_\\text{uncond})"}</InlineMath>.
        The guidance scale <InlineMath>{"w"}</InlineMath> (typically 7.5 for
        Stable Diffusion) amplifies the conditional direction beyond what the
        model would naturally produce. Without CFG, conditional samples
        barely respect their conditions; with CFG, text-to-image generation
        works. Pushed too far, CFG has its own failure modes — oversaturated
        colors and over-sharpened, artifact-heavy images at high{" "}
        <InlineMath>{"w"}</InlineMath> — which is why production systems now
        commonly add dynamic thresholding (clamping pixel values back into
        range) or restrict guidance to a middle band of timesteps rather than
        applying it uniformly across the whole schedule.{" "}
        <strong>Latent Diffusion</strong> (Rombach et al. 2022) [6] made
        diffusion computationally feasible at high resolution: train a
        VAE-style autoencoder to compress images into a smaller latent space
        (8× spatial downsampling, 4 channels), then run diffusion entirely in
        that latent space. A 512×512 image becomes a 64×64×4 latent — 48×
        fewer values to denoise at each step. <strong>Stable Diffusion</strong>{" "}
        is Latent Diffusion with text conditioning via CLIP, and is the
        open-weight foundation that most of the 2022–2026 image-generation
        explosion is built on. A related idea, <strong>ControlNet-style
        conditioning</strong>, extends the same cross-attention mechanism
        spatially: an auxiliary encoder branch, initialized from a copy of
        the frozen U-Net's early layers, injects an edge map, pose skeleton,
        or depth map at every resolution, giving pixel-level structural
        control over generation without retraining the base model.
      </p>

      <ClassifierFreeGuidance />

      {/* ── Section 3: Noise Schedules ───────────────────────────────────────── */}
      <div id="noise-schedules">
        <SectionTitle>Noise Schedules</SectionTitle>
      </div>

      <p style={prose}>
        The noise schedule <InlineMath>{"\\{\\beta_t\\}"}</InlineMath>{" "}
        determines how quickly structure is destroyed during the forward
        process. The original DDPM used a linear schedule where{" "}
        <InlineMath>{"\\beta_t"}</InlineMath> increases uniformly. The cosine
        schedule, introduced later, was designed so that the signal-to-noise
        ratio decreases more gradually — the model sees useful signal for
        more of the <InlineMath>{"T"}</InlineMath> timesteps, leading to
        better generation quality. At high timesteps the linear schedule
        drops SNR to near zero very quickly, wasting training capacity on
        near-pure-noise inputs.
      </p>

      <p style={prose}>
        Nichol &amp; Dhariwal's (2021) <em>Improved Denoising Diffusion
        Probabilistic Models</em> [7] analyzed the linear schedule and found
        a structural problem: signal-to-noise ratio (SNR) drops to nearly
        zero too quickly. By the time <InlineMath>{"t = T/2"}</InlineMath>,
        most of the image's structure has already been destroyed under a
        linear schedule, and the remaining <InlineMath>{"T/2"}</InlineMath>{" "}
        timesteps are spent on near-pure-noise inputs where the network
        learns very little. The <strong>cosine schedule</strong> they
        proposed keeps SNR usable for longer:
      </p>

      <MathBlock>{"$$\\bar\\alpha_t = \\cos^2\\!\\left(\\frac{t/T + s}{1 + s}\\cdot\\frac{\\pi}{2}\\right)$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"s"}</InlineMath> is a small offset (0.008 in the
        original paper) that keeps <InlineMath>{"\\beta_t"}</InlineMath> from
        vanishing near <InlineMath>{"t=0"}</InlineMath>, and the resulting
        curve keeps <InlineMath>{"\\bar\\alpha_t"}</InlineMath> away from
        both extremes for a larger fraction of the schedule than the linear
        alternative. Improved DDPM showed this single change improved sample
        quality and training stability across multiple datasets. Almost
        every modern diffusion model uses a cosine or cosine-like schedule;
        linear is now mostly a teaching reference.
      </p>

      <SchedulesAndSNR />

      <p style={prose}>
        Drag the <InlineMath>{"t"}</InlineMath> slider below to find where
        each curve crosses <InlineMath>{"\\text{SNR}=1"}</InlineMath>, then
        toggle <InlineMath>{"\\beta_t"}</InlineMath> on. Notice that cosine's
        crossing lands well past linear's — the "buys N steps" statistic
        quantifies exactly how many more timesteps of useful signal the
        cosine schedule preserves.
      </p>

      <NoiseSchedule
        tryThis={{
          do: "Drag the t slider to find where each curve crosses SNR = 1, then toggle β_t on.",
          notice: "Cosine's crossing lands well past Linear's — the \"buys N steps\" stat quantifies exactly how many more timesteps of useful signal the cosine schedule preserves.",
        }}
      />

      <p style={prose}>
        So far the network has been described as predicting the noise{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> that was added — but that's
        only one of three interchangeable targets for the same underlying
        model, and different noise regimes favor different choices.{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath>-prediction works well
        across most of the schedule but becomes ill-conditioned at very high
        noise, where <InlineMath>{"x_t"}</InlineMath> is nearly pure noise
        and the tiny signal component <InlineMath>{"\\varepsilon_\\theta"}</InlineMath>{" "}
        needs to recover shrinks toward zero along with{" "}
        <InlineMath>{"\\bar\\alpha_t"}</InlineMath>.{" "}
        <InlineMath>{"x_0"}</InlineMath>-prediction — training the network to
        output the clean image directly rather than the noise — flips the
        failure mode: it's stable at high noise but ill-conditioned at low
        noise, where <InlineMath>{"x_t"}</InlineMath> is nearly clean and the
        noise component being discarded is tiny.
      </p>

      <MathBlock>{"$$v_t = \\sqrt{\\bar\\alpha_t}\\,\\varepsilon - \\sqrt{1-\\bar\\alpha_t}\\,x_0$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"v_t"}</InlineMath> is a fixed rotation of{" "}
        <InlineMath>{"(\\varepsilon, x_0)"}</InlineMath> by an angle that
        depends on <InlineMath>{"t"}</InlineMath>; predicting it directly
        keeps the training target well-scaled at every noise level, unlike{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> or{" "}
        <InlineMath>{"x_0"}</InlineMath> alone. Salimans &amp; Ho (2022) [8]
        introduced this <strong>v-prediction</strong> parameterization;
        Stable Diffusion 2.x's higher-resolution ("-v") checkpoints use it,
        though the original SDXL was trained with plain{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath>-prediction — v-prediction
        variants of SDXL exist only as later third-party uptrains. All three
        targets — noise, clean
        image, and this rotated combination — are algebraically
        interconvertible given <InlineMath>{"(x_t, t)"}</InlineMath>: a
        network trained on one recovers the others by a change of variables,
        not by retraining. Karras et al.'s (2022) EDM framework [9] is a
        related but distinct contribution: rather than choosing among these
        three targets, it reparameterizes the entire diffusion
        process — network inputs, outputs, and the noise schedule itself —
        around the signal-to-noise ratio, so the network always sees
        roughly unit-variance inputs and targets regardless of the noise
        level.
      </p>

      {/* ── Section 4: Score Functions & Score Matching ──────────────────────── */}
      <div id="score-functions">
        <SectionTitle>Score Functions &amp; Score Matching</SectionTitle>
      </div>

      <p style={prose}>
        The score function of a distribution is the gradient of its log
        probability with respect to the data:{" "}
        <InlineMath>{"\\nabla_x \\log p(x)"}</InlineMath>. It points in the
        direction of increasing data density — toward regions where real
        data lives. A diffusion model implicitly learns the score function
        at every noise level, and it can be followed directly with{" "}
        <strong>Langevin dynamics</strong> — a sampling procedure that walks
        uphill along the score while injecting fresh noise at every step to
        stay stochastic rather than collapsing onto a single mode.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\text{score}(x) &= \\nabla_x \\log p(x) \\\\
  \\text{Langevin update:} \\quad x &\\leftarrow x + \\tfrac{\\eta}{2}\\, \\nabla_x \\log p(x) + \\sqrt{\\eta}\\, \\varepsilon, \\quad \\varepsilon \\sim \\mathcal{N}(0, I)
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\eta"}</InlineMath> is the step size, and the update
        is repeated many times; as <InlineMath>{"\\eta \\to 0"}</InlineMath>{" "}
        and the number of steps grows, the walk's stationary distribution
        converges to <InlineMath>{"p(x)"}</InlineMath> itself — noisy
        gradient ascent on log-density. Training a network to approximate
        this score function is called <strong>score matching</strong>, and it
        turns out to be the same computation the reverse-denoising network
        from Section 2 already performs: at noise level{" "}
        <InlineMath>{"t"}</InlineMath>, the score is exactly{" "}
        <InlineMath>{"-\\varepsilon_\\theta(x_t,t)/\\sqrt{1-\\bar\\alpha_t}"}</InlineMath>{" "}
        under the forward process defined earlier. Minimizing the{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath>-prediction MSE loss from
        Section 2 is therefore denoising score matching in disguise — the two
        training objectives are the same computation viewed through
        different notation.
      </p>

      <p style={prose}>
        Before diffusion's 2020 breakout, Song &amp; Ermon (2019) [10] had
        already shown that a network trained to match the score function via
        denoising score matching, then sampled with annealed Langevin
        dynamics across a sequence of noise levels, could generate
        competitive images. Their Noise-Conditional Score Networks (NCSN) are
        mechanically the same recipe as the walk shown above, and they
        predate DDPM by a year. DDPM and NCSN were independently discovered
        instances of the same underlying idea, unified two years later.
      </p>

      <p style={prose}>
        Song et al.'s (2021) score-based SDE paper [11] provided the most
        general theoretical framework for diffusion. The forward noising
        process can be written as a <em>stochastic differential equation</em>{" "}
        (SDE) — a continuous-time formulation where discrete DDPM is just one
        possible discretization. The reverse-time SDE has a closed-form
        expression in terms of the score function{" "}
        <InlineMath>{"\\nabla_x \\log p_t(x)"}</InlineMath> of the data
        distribution at time <InlineMath>{"t"}</InlineMath> — and training a
        network to predict the noise at each step is mathematically
        equivalent (up to a constant) to training it to predict the score.
        This unification has practical consequences. DDPM, score matching
        with Langevin dynamics, DDIM, and the deterministic{" "}
        <em>probability-flow ODE</em> (ordinary differential equation) are
        all the same underlying machinery, discretized differently. Once a
        single noise-predicting U-Net is trained, we can sample using any of
        these methods — different speed/quality tradeoffs, same trained
        model. The SDE perspective also makes it natural to use any ODE
        solver (Heun's method, Runge-Kutta) at sampling time, leading to the
        family of fast samplers (DPM-Solver, UniPC) that dominate modern
        inference pipelines.
      </p>

      <p style={prose}>
        The score-based framing has a complementary view worth naming
        explicitly: the diffusion model can be derived as a hierarchical
        VAE — a generative model with <InlineMath>{"T"}</InlineMath> latent
        layers stacked between the data and a fixed Gaussian prior. The
        encoder is the forward noising process (no parameters, fixed by the
        schedule); the decoder is the reverse denoising process (one U-Net
        shared across all layers, the network's only parameters). The ELBO
        of this VAE is the principled diffusion objective; the simplified{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath>-prediction loss is a
        reweighted version of it. This framing also clarifies why diffusion
        succeeded where deeper VAEs traditionally struggled: the per-step KL
        divergences in diffusion remain small (because each step only adds a
        small amount of noise), while a deep VAE without diffusion structure
        tends to collapse most layers to triviality. Diffusion is a
        hierarchical VAE that works because the hierarchy is engineered to
        be well-conditioned at every level.
      </p>

      <p style={prose}>
        The 2020 DDPM paper started a five-year research wave that defined
        modern generative modeling, and several reformulations of the
        underlying math have become competitive within image generation
        alone. <strong>Flow Matching</strong> (Lipman et al. 2023) [12]
        trains a network to predict velocity fields instead of noise, with a
        cleaner mathematical derivation and equivalent empirical results.{" "}
        <strong>Rectified Flow</strong> (Liu et al. 2023) [13] straightens
        trajectories between data and noise, allowing very-few-step sampling
        — Stable Diffusion 3 is built on rectified flow.{" "}
        <strong>Consistency Models</strong> (Song et al. 2023) [14] train
        networks that can sample in a single step. <strong>Diffusion
        Transformers (DiT)</strong> (Peebles &amp; Xie 2023) [15] replace the
        U-Net backbone with a transformer, which scales better — Sora's video
        model and FLUX's image model are DiT-based.
      </p>

      <p style={prose}>
        A second research thread distills an already-trained, many-step
        diffusion model down into one that samples in a handful of steps,
        rather than reformulating the process from scratch. Latent
        Consistency Models (Luo et al. 2023) [16] distill a pretrained latent
        diffusion model by training it to map any point on a solver's ODE
        trajectory directly to that trajectory's endpoint, collapsing 20–50
        steps into 2–4. Adversarial Diffusion Distillation (Sauer et al.
        2023) [17], the recipe behind SDXL-Turbo, adds a GAN discriminator
        loss on top of distillation so a single forward pass already produces
        a plausible image. FLUX.1-schnell applies a similar few-step
        distillation to a DiT-based flow model. This is the machinery behind
        interactive, near-real-time image tools: 1–4 network evaluations
        instead of 20–50.
      </p>

      <p style={prose}>
        The field has converged on the rough picture that started with
        DDPM: corrupt data with noise on a continuous-time process, train a
        network to undo the corruption, sample by integrating the reverse
        process. Almost everything else — exact loss formulation, network
        architecture, sampling algorithm, conditioning method — is being
        actively rebuilt every six months. The same corrupt-then-undo
        machinery is not even limited to continuous pixel data: diffusion
        language models generate text by denoising a whole sequence of
        masked or corrupted tokens in parallel, rather than emitting one
        token at a time left-to-right, a genuine structural alternative to
        the autoregressive language models built in Part III of this book —
        still less mature at scale as of this writing, but proof that
        "corrupt, then learn to undo it" is not a pixel-specific idea.
      </p>

      <p style={prose}>
        Click anywhere on the canvas below to drop a new particle, then press
        play. Notice that the particle drifts along the arrows toward the
        nearest density mode and settles near it — following the score field
        one step at a time is exactly the Langevin update shown above.
      </p>

      <ScoreFunction
        tryThis={{
          do: "Click anywhere on the canvas to drop a new particle, then press play.",
          notice: "The particle drifts along the arrows toward the nearest density mode and settles near it — following the score field is exactly the Langevin update shown above, run one step at a time.",
        }}
      />

      <LatentDiffusionArchitecture />

      {/* ── Section 5: Video & World Models ──────────────────────────────────── */}
      <div id="video-and-world-models">
        <SectionTitle>Video &amp; World Models</SectionTitle>
      </div>

      <p style={prose}>
        Everything so far has treated a single image as one point being
        denoised. Video diffusion extends the same recipe to a sequence of
        frames, and the architectural change is a shift from two dimensions
        to three: the same U-Net or DiT backbone gains a temporal axis
        alongside height and width. Most video diffusion models factorize
        attention into two passes at every block — a spatial pass that
        attends within each frame the way image diffusion already does, and
        a temporal pass that attends across the same spatial location at
        different timesteps. This factorization keeps compute roughly linear
        in the number of frames rather than quadratic in frames times pixels,
        while still letting the model enforce that an object's appearance
        stays consistent from one frame to the next. Some systems, including
        OpenAI's Sora, instead treat video as one long sequence of
        space-time patches and apply full DiT-style attention across all of
        them jointly — trading the factorization's efficiency for a model
        that can, in principle, learn arbitrary space-time dependencies
        (camera motion, object permanence, physical dynamics) without an
        architectural prior forcing any particular split.
      </p>

      <p style={prose}>
        Predicting the next frame of a video, conditioned on past frames and
        possibly an action, is formally the same problem diffusion already
        solves: given a corrupted or unknown future state, denoise toward a
        plausible one. Framed this way, a video diffusion model that also
        conditions on an agent's actions becomes a <strong>world
        model</strong> — a learned simulator of an environment's dynamics
        that can be queried for "what happens if this action is taken from
        this state?" rather than merely "what image comes next?" Interactive
        world models such as Genie (Bruce et al. 2024) [18] train exactly
        this way: unlabeled video supplies the supervision, a latent action
        space is discovered rather than given, and the resulting model can be
        driven frame by frame like a simulated environment nobody hand
        programmed. This reframes video generation from a media-production
        tool into a research direction for learning environment dynamics
        directly from observation — relevant to the embodied agents and
        reinforcement-learning settings of Chapter 12 as much as to content
        creation.
      </p>

      <p style={prose}>
        Three problems remain substantially unsolved. Long-sequence temporal
        consistency — a face, object, or piece of on-screen text staying
        coherent over tens of seconds rather than a handful — degrades as
        sequence length grows, because errors compound across the
        autoregressive or windowed generation schemes most video models still
        rely on to avoid holding an entire clip in memory at once.{" "}
        <strong>Controllability</strong> lags behind image diffusion's
        cross-attention conditioning: steering a specific camera trajectory,
        object motion, or physical interaction precisely, rather than
        approximately matching a text prompt, is still an open interface
        problem, not just a capacity problem. And <strong>compute
        cost</strong> is roughly the frame count multiplied against image
        diffusion's already-substantial cost, which is why production video
        systems lean hard on the same latent-space compression, few-step
        distillation, and efficient-attention tricks discussed earlier in
        this chapter — video diffusion inherits image diffusion's tricks
        because it needs every one of them.
      </p>

      <p style={prose}>
        What carries forward from this chapter is less any single equation
        than a working method: define a noising process that can be
        inverted, train a network to predict what was removed at each step,
        and treat generation as iterative denoising rather than a single
        leap. That method reappears across every modality touched in this
        section, and its core primitive — a score function estimated by a
        trained network — is now understood well enough that swapping in a
        video, audio, or 3D signal changes only what's being denoised, not
        the recipe. Chapter 21 turns from how these generative models are
        built to how they, and every other model in this book, are actually
        measured — datasets, benchmarks, and the evaluation metrics (FID,
        CLIP score, human preference) that diffusion models' own outputs are
        judged against.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
