import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import Citations from "../../components/shared/Citations";
import MDPExplorer from "../../components/widgets/ch14/MDPExplorer";
import QLearning from "../../components/widgets/ch14/QLearning";
import PolicyGradient from "../../components/widgets/ch14/PolicyGradient";
import PPOClipping from "../../components/widgets/ch14/PPOClipping";
import RLHFPipeline from "../../components/widgets/ch14/RLHFPipeline";
import RLVRvsRLHF from "../../components/widgets/ch14/RLVRvsRLHF";
import AgentEnvironmentLoop from "../../components/diagrams/ch14/AgentEnvironmentLoop";
import DQNStabilization from "../../components/diagrams/ch14/DQNStabilization";
import RLApproachTaxonomy from "../../components/diagrams/ch14/RLApproachTaxonomy";
import TrustRegionAndClipping from "../../components/diagrams/ch14/TrustRegionAndClipping";
import RewardSourceTaxonomy from "../../components/diagrams/ch14/RewardSourceTaxonomy";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Reinforcement Learning: An Introduction", authors: "Sutton & Barto", venue: "MIT Press", year: "1998", tag: "seminal" },
  { num: 2, title: "Human-Level Control through Deep Reinforcement Learning (DQN)", authors: "Mnih, Kavukcuoglu, Silver, Rusu, Veness, Bellemare, Graves, Riedmiller, Fidjeland, Ostrovski, Petersen, Beattie, Sadik, Antonoglou, King, Kumaran, Wierstra, Legg, Hassabis", venue: "Nature", year: "2015", tag: "seminal" },
  { num: 3, title: "Proximal Policy Optimization Algorithms", authors: "Schulman, Wolski, Dhariwal, Radford, Klimov", venue: "arXiv", year: "2017", tag: "seminal" },
  { num: 4, title: "Training Language Models to Follow Instructions with Human Feedback (InstructGPT)", authors: "Ouyang, Wu, Jiang, Almeida, Wainwright, Mishkin, Zhang, Agarwal, Slama, Ray, Schulman, Hilton, Kelton, Miller, Simens, Askell, Welinder, Christiano, Leike, Lowe", venue: "NeurIPS", year: "2022", tag: "seminal" },
  { num: 5, title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model", authors: "Rafailov, Sharma, Mitchell, Ermon, Manning, Finn", venue: "NeurIPS", year: "2023", tag: "seminal" },
  { num: 6, title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning", authors: "DeepSeek-AI", venue: "arXiv", year: "2025", tag: "paper" },
  { num: 7, title: "Mastering the Game of Go without Human Knowledge (AlphaGo Zero)", authors: "Silver, Schrittwieser, Simonyan, Antonoglou, Huang, Guez, Hubert, Baker, Lai, Bolton, Chen, Lillicrap, Hui, Sifre, van den Driessche, Graepel, Hassabis", venue: "Nature", year: "2017", tag: "paper" },
  { num: 8, title: "Asynchronous Methods for Deep Reinforcement Learning (A3C)", authors: "Mnih, Badia, Mirza, Graves, Lillicrap, Harley, Silver, Kavukcuoglu", venue: "ICML", year: "2016", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "mdps-and-the-bellman-equation", label: "MDPs & Bellman" },
  { id: "q-learning-and-dqn",            label: "Q-Learning & DQN" },
  { id: "policy-gradients",              label: "Policy Gradients" },
  { id: "proximal-policy-optimization",  label: "PPO" },
  { id: "rlhf-and-rlvr",                label: "RLHF, RLEF & RLVR" },
];

export default function ReinforcementLearning() {
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
        Chapter 14 · Part IV — Other Architectures
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
        Reinforcement Learning
      </h1>

      <ChapterLede>
        Supervised learning requires labeled examples of correct behavior.
        Reinforcement learning requires only a reward signal. An agent observes
        the state of the world, takes an action, receives a scalar reward, and
        updates its policy to make better decisions in the future. From Atari games
        to protein folding strategies to language model alignment, RL has proven
        that specifying what you want through reward is sufficient to learn
        extraordinarily complex behavior — and that specifying what you want
        precisely enough is one of the hardest problems in machine learning.
      </ChapterLede>

      {/* ── Section 1: MDPs & the Bellman Equation ───────────────────────────── */}
      <div id="mdps-and-the-bellman-equation">
        <SectionTitle>MDPs &amp; the Bellman Equation</SectionTitle>
      </div>

      <p style={prose}>
        A Markov Decision Process formalizes sequential decision-making. At each
        timestep, an agent in state <InlineMath>{"s"}</InlineMath> takes action{" "}
        <InlineMath>{"a"}</InlineMath>, receives reward <InlineMath>{"r"}</InlineMath>,
        and transitions to a new state <InlineMath>{"s'"}</InlineMath> according
        to the environment's dynamics <InlineMath>{"P(s' \\mid s, a)"}</InlineMath>.
        The agent's goal is to find a policy <InlineMath>{"\\pi(a \\mid s)"}</InlineMath>{" "}
        that maximizes the expected cumulative discounted reward — the return.
        The Bellman equation expresses the optimal value function recursively:
        the value of a state is the immediate reward plus the discounted value
        of the best reachable next state [1].
      </p>

      <p style={prose}>
        Two formal commitments deserve attention. First, the <em>Markov property</em>:
        the next state depends only on the current state and action, not on history.
        Real environments rarely satisfy this strictly — humans remember things,
        physical systems have momentum — so the "state" in practice is usually a
        rich representation engineered to be Markovian (e.g., a stack of four
        Atari frames captures velocity, which a single frame would miss). Second,
        the <em>discount factor</em> <InlineMath>{"\\gamma \\in [0, 1)"}</InlineMath>:
        rewards <InlineMath>{"k"}</InlineMath> steps in the future are weighted
        by <InlineMath>{"\\gamma^k"}</InlineMath>. Typical values are{" "}
        <InlineMath>{"0.99"}</InlineMath> for long-horizon tasks,{" "}
        <InlineMath>{"0.9"}</InlineMath> to <InlineMath>{"0.95"}</InlineMath> for
        shorter ones. The discount has two roles: it expresses time preference
        (immediate rewards are worth more), and it mathematically guarantees that
        the sum of rewards remains finite for non-terminating environments.
        Sutton &amp; Barto's <em>Reinforcement Learning: An Introduction</em>{" "}
        (1998, second edition 2018) is the field's textbook anchor; nearly every
        notation choice in this section comes from it.
      </p>

      <p style={prose}>
        A subtle structural choice runs through everything that follows: an agent
        can either <em>learn the environment dynamics</em>{" "}
        <InlineMath>{"P(s' \\mid s, a)"}</InlineMath> and plan against them
        (model-based), or directly <em>learn a policy or value function</em> by
        interacting and getting feedback (model-free). Model-based methods are
        more sample-efficient — the agent can learn from imagined trajectories
        generated by its world model — but they require an accurate dynamics
        model, which is hard to learn for complex environments. Model-free methods
        are simpler and tend to scale better empirically. The rest of this chapter
        is overwhelmingly model-free; recent successes like MuZero and EfficientZero
        show that learned-dynamics planning can be competitive when the world
        model is good enough.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  V^*(s) &= \\max_a \\left[ R(s, a) + \\gamma \\sum_{s'} P(s' \\mid s, a)\\, V^*(s') \\right] \\\\
  Q^*(s, a) &= R(s, a) + \\gamma \\sum_{s'} P(s' \\mid s, a)\\, \\max_{a'} Q^*(s', a')
\\end{aligned}$$`}</MathBlock>

      <AgentEnvironmentLoop />

      <MDPExplorer />

      {/* ── Section 2: Q-Learning & DQN ──────────────────────────────────────── */}
      <div id="q-learning-and-dqn">
        <SectionTitle>Q-Learning &amp; DQN</SectionTitle>
      </div>

      <p style={prose}>
        Q-learning learns the action-value function{" "}
        <InlineMath>{"Q(s, a)"}</InlineMath> without a model of the environment
        dynamics, using temporal difference updates: <InlineMath>{"Q(s, a)"}</InlineMath>{" "}
        gets nudged toward the observed reward plus the discounted best Q-value of
        the next state. Deep Q-Networks replaced the lookup table with a neural
        network and introduced two crucial stabilizations: experience replay,
        which breaks temporal correlations by randomly sampling past transitions,
        and target networks, which provide stable TD targets by updating the
        target Q-network only periodically.
      </p>

      <p style={prose}>
        Mnih, Kavukcuoglu, Silver et al. (2015) [2] published "Human-Level Control
        through Deep Reinforcement Learning" in <em>Nature</em> — the moment deep
        RL went from a research idea to a credible field. A single Q-network
        architecture, trained from raw pixels with the same hyperparameters on
        49 different Atari games, achieved superhuman performance on 29 of them.
        The two stabilization tricks were essential, not optional: experience
        replay broke the temporal correlations between consecutive transitions
        that would otherwise turn the i.i.d. assumption underlying SGD into a
        fiction; target networks prevented the moving-target problem where
        Q-values chase themselves into divergence. Without either, deep Q-learning
        was prone to collapse; with both, it worked reliably. Q-learning is also{" "}
        <em>off-policy</em> — the policy that explored and generated the data
        can differ from the policy being learned — which is what makes experience
        replay possible at all (on-policy methods can't reuse old data, since the
        policy that generated it has moved on).
      </p>

      <p style={prose}>
        Three years after DQN, Silver, Schrittwieser, Simonyan et al. (2017)
        demonstrated something more remarkable: <em>AlphaGo Zero</em> [7], a
        Go-playing system trained purely from self-play with no human games or
        expert demonstrations, surpassed every prior Go program — including the
        version of AlphaGo that beat Lee Sedol — within 40 days of training. The
        technique combined a deep neural network (mapping board positions to value
        and policy estimates) with Monte Carlo Tree Search for action selection,
        learning both representations end-to-end from the reward signal of game
        outcomes. AlphaGo Zero is conceptually the precursor to the "pure RL
        produces emergent capability" pattern that DeepSeek-R1-Zero would later
        demonstrate for language models — Section 5 returns to this connection.
        Variants like Double DQN (van Hasselt et al. 2016) and Dueling DQN address
        specific failure modes of vanilla Q-learning; the broader family is alive
        and well in domains where pure value-based methods suffice.
      </p>

      <MathBlock>{"$$Q(s, a) \\leftarrow Q(s, a) + \\alpha \\bigl[\\, r + \\gamma \\max_{a'} Q(s', a') - Q(s, a) \\,\\bigr]$$"}</MathBlock>

      <DQNStabilization />

      <QLearning />

      {/* ── Section 3: Policy Gradients ───────────────────────────────────────── */}
      <div id="policy-gradients">
        <SectionTitle>Policy Gradients</SectionTitle>
      </div>

      <p style={prose}>
        Instead of learning a value function, policy gradient methods directly
        optimize the policy by gradient ascent on expected return. The REINFORCE
        algorithm computes gradients using rollout returns — high-return trajectories
        get reinforced, low-return ones get suppressed. Actor-critic methods reduce
        variance by using a value function (the critic) as a baseline, computing
        the advantage <InlineMath>{"A(s, a) = Q(s, a) - V(s)"}</InlineMath> rather
        than raw returns.
      </p>

      <p style={prose}>
        Williams (1992) introduced REINFORCE as the first practical policy gradient
        algorithm. The intuition is clean: sample a trajectory, compute its return,
        and push up the log-probability of every action taken proportionally to
        that return. The problem is variance — returns can range from very negative
        to very positive even for similar policies, and the gradient signal is
        noisy enough that learning is slow. Two complementary fixes addressed
        this. <em>Baselines</em>: subtracting any state-dependent function{" "}
        <InlineMath>{"b(s)"}</InlineMath> from the return leaves the gradient
        unbiased but can dramatically reduce variance — the value function{" "}
        <InlineMath>{"V(s)"}</InlineMath> is the standard choice, producing the
        advantage <InlineMath>{"A(s, a) = Q(s, a) - V(s)"}</InlineMath> already
        in the section's MathBlock. <em>Actor-critic methods</em>: a separate
        "critic" network learns <InlineMath>{"V(s)"}</InlineMath> while the "actor"
        updates the policy, allowing the advantage to be estimated online rather
        than from full Monte Carlo rollouts.
      </p>

      <p style={prose}>
        Mnih, Badia, Mirza, Graves, Lillicrap, Harley, Silver &amp; Kavukcuoglu
        (2016) [8] introduced <em>A3C</em> — Asynchronous Advantage Actor-Critic
        — which spawned a wave of parallel RL methods. Many CPU workers run their
        own copies of the environment, compute gradients on their local experience,
        and asynchronously push updates to a shared central network. The diversity
        of experience across workers naturally decorrelates the gradients in the
        same way experience replay did for DQN, often without needing replay at
        all. A3C and its synchronous variant A2C dominated continuous-control
        benchmarks (MuJoCo, robotics simulators) before being largely replaced
        by PPO. Policy gradient methods remain the default for environments with
        continuous action spaces, where the discrete <InlineMath>{"\\arg\\max"}</InlineMath>{" "}
        of Q-learning is infeasible.
      </p>

      <MathBlock>{"$$\\nabla_\\theta J(\\theta) = \\mathbb{E}_\\pi\\!\\left[\\, \\nabla_\\theta \\log \\pi_\\theta(a \\mid s) \\cdot A(s, a) \\,\\right]$$"}</MathBlock>

      <RLApproachTaxonomy />

      <PolicyGradient />

      {/* ── Section 4: PPO ────────────────────────────────────────────────────── */}
      <div id="proximal-policy-optimization">
        <SectionTitle>PPO</SectionTitle>
      </div>

      <p style={prose}>
        PPO constrains how much the policy can change in a single update by
        clipping the probability ratio{" "}
        <InlineMath>{"r_t(\\theta) = \\pi_\\theta(a \\mid s) / \\pi_{\\theta_{\\text{old}}}(a \\mid s)"}</InlineMath>.
        When the ratio moves outside <InlineMath>{"[1 - \\varepsilon, 1 + \\varepsilon]"}</InlineMath>,
        the gradient is zeroed — preventing large destabilizing updates while
        still allowing steady improvement. This simple modification to the policy
        gradient objective makes training far more stable and is the dominant
        on-policy RL algorithm for language model fine-tuning [3].
      </p>

      <p style={prose}>
        PPO didn't appear from nowhere — it was a deliberate simplification of
        TRPO (Trust Region Policy Optimization, Schulman et al. 2015). The
        motivating problem: vanilla policy gradient with a fixed learning rate
        is unstable, because a single large update can collapse the policy
        entirely. TRPO solved this by constraining the KL divergence between the
        old and new policies{" "}
        <InlineMath>{"\\text{KL}(\\pi_{\\theta_{\\text{old}}} \\,\\|\\, \\pi_\\theta) \\leq \\delta"}</InlineMath>{" "}
        — keeping every update inside a "trust region" where the linear
        approximation to the objective is reliable. The math required a conjugate
        gradient solver and was notoriously fiddly to implement. PPO (Schulman,
        Wolski, Dhariwal, Radford &amp; Klimov 2017) achieved nearly all of
        TRPO's stability with a far simpler heuristic: instead of a hard KL
        constraint, clip the probability ratio whenever it strays too far from{" "}
        <InlineMath>{"1"}</InlineMath>. The clipping objective shown below is
        differentiable, requires no special solver, and works well across a
        remarkable range of tasks.
      </p>

      <p style={prose}>
        PPO's stability properties made it the default for fine-tuning language
        models with RL — InstructGPT, ChatGPT's earliest training runs, and most
        RLHF pipelines through 2023 used PPO as the policy optimizer. The fit is
        natural: language-model policies have astronomically many parameters,
        are expensive to roll out, and need every gradient step to be reliable.
        Two recent variants matter for Section 5. <em>GRPO</em> (Group Relative
        Policy Optimization, used in DeepSeek's R1 family) drops the separate
        value/critic network entirely — instead, it samples a <em>group</em> of{" "}
        <InlineMath>{"G"}</InlineMath> outputs for each prompt and uses their
        normalized within-group returns as advantages. This roughly halves memory
        and compute relative to PPO while preserving the clipping mechanism. The
        recipe is increasingly the default for reasoning-model post-training.
      </p>

      <MathBlock>{"$$\\mathcal{L}^{\\text{CLIP}}(\\theta) = \\mathbb{E}_t \\!\\left[\\, \\min\\!\\left(r_t(\\theta)\\, A_t,\\ \\text{clip}\\bigl(r_t(\\theta),\\, 1-\\varepsilon,\\, 1+\\varepsilon\\bigr) A_t\\right) \\right]$$"}</MathBlock>

      <TrustRegionAndClipping />

      <PPOClipping />

      {/* ── Section 5: RLHF, RLEF & RLVR ────────────────────────────────────── */}
      <div id="rlhf-and-rlvr">
        <SectionTitle>RLHF, RLEF &amp; RLVR</SectionTitle>
      </div>

      <p style={prose}>
        RLHF (Reinforcement Learning from Human Feedback) trains a reward model
        from human preference comparisons, then optimizes the language model against
        that reward using PPO. RLEF (from Execution Feedback) uses code execution
        results — correct or incorrect — as a verifiable binary reward, eliminating
        the need for human annotation on coding tasks. RLVR (from Verifiable Rewards)
        generalizes this to any task with a ground-truth verifier: math problems
        with known answers, formal proofs that a theorem-prover validates, logical
        puzzles.
      </p>

      <p style={prose}>
        All three techniques share the same RL machinery — typically PPO or GRPO
        optimizing a policy against some reward function — and differ only in{" "}
        <em>where the reward comes from</em>. RLHF [4] (Ouyang, Wu, Jiang et al.
        2022) trains a learned reward model from pairwise human preferences; the
        reward is a learned proxy for human judgment. RLEF uses a deterministic
        verifier: code that compiles and passes tests gets reward{" "}
        <InlineMath>{"1"}</InlineMath>, code that fails gets{" "}
        <InlineMath>{"0"}</InlineMath>. The reward is mechanical, cheap to
        compute, and exactly aligned with the task. RLVR generalizes RLEF to any
        task with a ground-truth checker. DPO [5] (covered in Ch 10) deserves a
        separate mention here as the <em>learned-reward-free</em> alternative to
        RLHF: by reformulating the optimization, DPO uses preference pairs
        directly as a classification target with no explicit reward model and no
        RL loop at all. DPO and RLHF have largely converged in practice for
        open-weight models.
      </p>

      <p style={prose}>
        The DeepSeek-R1 paper (2025) [6] introduced two distinct models that
        should not be conflated. <em>DeepSeek-R1-Zero</em> was trained from the
        DeepSeek-V3-Base model using <em>only</em> RL with verifiable rewards —
        no supervised fine-tuning, no human preference data, no cold start. It
        showed that reasoning behaviors — long chains of thought, self-verification,
        occasional "aha moments" of strategy revision — could emerge purely from
        the RL signal, given that the rewards came from automatically-verifiable
        math and coding problems. R1-Zero was the breakthrough demonstration; it
        had real usability issues (language mixing, poor readability, formatting
        drift) that made it impractical to ship. <em>DeepSeek-R1</em> addressed
        those issues with a multi-stage pipeline: a small cold-start SFT on
        curated chain-of-thought examples, then RL with verifiable rewards, then
        rejection-sampled SFT, then a second RL stage for general helpfulness.
        So R1-Zero is the "RL only" result; R1 is the productionized version that
        added back a small SFT phase. Both used GRPO (Section 4) rather than PPO.
        The conceptual import of R1-Zero parallels AlphaGo Zero (Section 2):
        given the right reward structure, deep RL can produce capabilities — like
        reasoning — that didn't have to be supervised in.
      </p>

      <RewardSourceTaxonomy />

      <RLHFPipeline />

      <RLVRvsRLHF />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
