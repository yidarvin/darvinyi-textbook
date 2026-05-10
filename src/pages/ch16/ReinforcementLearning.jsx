import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import MathBlock from "../../components/shared/MathBlock";
import Citations from "../../components/shared/Citations";
import MDPExplorer from "../../components/widgets/ch16/MDPExplorer";
import QLearning from "../../components/widgets/ch16/QLearning";
import PolicyGradient from "../../components/widgets/ch16/PolicyGradient";
import PPOClipping from "../../components/widgets/ch16/PPOClipping";
import RLHFPipeline from "../../components/widgets/ch16/RLHFPipeline";
import RLVRvsRLHF from "../../components/widgets/ch16/RLVRvsRLHF";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Reinforcement Learning: An Introduction", authors: "Sutton & Barto", venue: "MIT Press", year: "1998", tag: "seminal" },
  { num: "[2]", title: "Human-Level Control through Deep Reinforcement Learning (DQN)", authors: "Mnih, Kavukcuoglu, Silver, Rusu, Veness, Bellemare, Graves, Riedmiller, Fidjeland, Ostrovski, Petersen, Beattie, Sadik, Antonoglou, King, Kumaran, Wierstra, Legg, Hassabis", venue: "Nature", year: "2015", tag: "seminal" },
  { num: "[3]", title: "Proximal Policy Optimization Algorithms", authors: "Schulman, Wolski, Dhariwal, Radford, Klimov", venue: "arXiv", year: "2017", tag: "seminal" },
  { num: "[4]", title: "Training Language Models to Follow Instructions with Human Feedback (InstructGPT)", authors: "Ouyang, Wu, Jiang, Almeida, Wainwright, Mishkin, Zhang, Agarwal, Slama, Ray, Schulman, Hilton, Kelton, Miller, Simens, Askell, Welinder, Christiano, Leike, Lowe", venue: "NeurIPS", year: "2022", tag: "seminal" },
  { num: "[5]", title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model", authors: "Rafailov, Sharma, Mitchell, Ermon, Manning, Finn", venue: "NeurIPS", year: "2023", tag: "seminal" },
  { num: "[6]", title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning", authors: "DeepSeek-AI", venue: "arXiv", year: "2025", tag: "paper" },
  { num: "[7]", title: "Mastering the Game of Go without Human Knowledge (AlphaGo Zero)", authors: "Silver, Schrittwieser, Simonyan, Antonoglou, Huang, Guez, Hubert, Baker, Lai, Bolton, Chen, Lillicrap, Hui, Sifre, van den Driessche, Graepel, Hassabis", venue: "Nature", year: "2017", tag: "paper" },
  { num: "[8]", title: "Asynchronous Methods for Deep Reinforcement Learning (A3C)", authors: "Mnih, Badia, Mirza, Graves, Lillicrap, Harley, Silver, Kavukcuoglu", venue: "ICML", year: "2016", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "mdps-and-the-bellman-equation", label: "MDPs & Bellman" },
  { id: "q-learning-and-dqn",            label: "Q-Learning & DQN" },
  { id: "policy-gradients",              label: "Policy Gradients" },
  { id: "proximal-policy-optimization",  label: "PPO" },
  { id: "rlhf-and-rlvr",                label: "RLHF & RLVR" },
];

export default function ReinforcementLearning() {
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
        Chapter 16 · Part V — Reinforcement Learning
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
        timestep, an agent in state s takes action a, receives reward r, and
        transitions to a new state s' according to the environment's dynamics
        P(s'|s,a). The agent's goal is to find a policy π(a|s) that maximizes
        the expected cumulative discounted reward — the return. The Bellman equation
        expresses the optimal value function recursively: the value of a state is
        the immediate reward plus the discounted value of the best reachable next state.
      </p>

      <MathBlock>
        {"V*(s) = max_a [ R(s,a) + γ · Σ_{s'} P(s'|s,a) · V*(s') ]\nQ*(s,a) = R(s,a) + γ · Σ_{s'} P(s'|s,a) · max_{a'} Q*(s',a')"}
      </MathBlock>

      <MDPExplorer />

      {/* ── Section 2: Q-Learning & DQN ──────────────────────────────────────── */}
      <div id="q-learning-and-dqn">
        <SectionTitle>Q-Learning &amp; DQN</SectionTitle>
      </div>

      <p style={prose}>
        Q-learning learns the action-value function Q(s,a) without a model of
        the environment dynamics, using temporal difference updates: Q(s,a) gets
        nudged toward the observed reward plus the discounted best Q-value of the
        next state. Deep Q-Networks replaced the lookup table with a neural network
        and introduced two crucial stabilizations: experience replay, which breaks
        temporal correlations by randomly sampling past transitions, and target
        networks, which provide stable TD targets by updating the target Q-network
        only periodically.
      </p>

      <MathBlock>
        {"Q(s,a) ← Q(s,a) + α · [ r + γ · max_{a'} Q(s',a') − Q(s,a) ]"}
      </MathBlock>

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
        the advantage A(s,a) = Q(s,a) − V(s) rather than raw returns.
      </p>

      <MathBlock>
        {"∇_θ J(θ) = 𝔼_π [ ∇_θ log π_θ(a|s) · A(s,a) ]"}
      </MathBlock>

      <PolicyGradient />

      {/* ── Section 4: PPO ────────────────────────────────────────────────────── */}
      <div id="proximal-policy-optimization">
        <SectionTitle>PPO</SectionTitle>
      </div>

      <p style={prose}>
        PPO constrains how much the policy can change in a single update by
        clipping the probability ratio r_t(θ) = π_θ(a|s) / π_θ_old(a|s).
        When the ratio moves outside [1−ε, 1+ε], the gradient is zeroed —
        preventing large destabilizing updates while still allowing steady improvement.
        This simple modification to the policy gradient objective makes training
        far more stable and is the dominant on-policy RL algorithm for language
        model fine-tuning.
      </p>

      <MathBlock>
        {"L^CLIP(θ) = 𝔼_t [ min( r_t(θ) · A_t,  clip(r_t(θ), 1−ε, 1+ε) · A_t ) ]"}
      </MathBlock>

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
        generalizes this to any task with a ground-truth verifier: math proofs,
        logical puzzles, formal verification. DeepSeek-R1 demonstrated that RLVR
        alone, without supervised fine-tuning warm-up, can produce strong chain-of-thought
        reasoning from a base model.
      </p>

      <RLHFPipeline />

      <RLVRvsRLHF />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
