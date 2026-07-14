import { useTocSections } from "../../components/layout/TocRail";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import Citations from "../../components/shared/Citations";
import MDPExplorer from "../../components/widgets/ch12/MDPExplorer";
import QLearning from "../../components/widgets/ch12/QLearning";
import PolicyGradient from "../../components/widgets/ch12/PolicyGradient";
import PPOClipping from "../../components/widgets/ch12/PPOClipping";
import RLHFPipeline from "../../components/widgets/ch12/RLHFPipeline";
import RLVRvsRLHF from "../../components/widgets/ch12/RLVRvsRLHF";
import AgentEnvironmentLoop from "../../components/diagrams/ch12/AgentEnvironmentLoop";
import DQNStabilization from "../../components/diagrams/ch12/DQNStabilization";
import RLApproachTaxonomy from "../../components/diagrams/ch12/RLApproachTaxonomy";
import TrustRegionAndClipping from "../../components/diagrams/ch12/TrustRegionAndClipping";
import RewardSourceTaxonomy from "../../components/diagrams/ch12/RewardSourceTaxonomy";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = buildCitations([
  { title: "Reinforcement Learning: An Introduction", authors: "Sutton & Barto", venue: "MIT Press", year: "1998", tag: "seminal" },
  { title: "Human-Level Control through Deep Reinforcement Learning (DQN)", authors: "Mnih, Kavukcuoglu, Silver, Rusu, Veness, Bellemare, Graves, Riedmiller, Fidjeland, Ostrovski, Petersen, Beattie, Sadik, Antonoglou, King, Kumaran, Wierstra, Legg, Hassabis", venue: "Nature", year: "2015", tag: "seminal" },
  { title: "Proximal Policy Optimization Algorithms", authors: "Schulman, Wolski, Dhariwal, Radford, Klimov", venue: "arXiv", year: "2017", tag: "seminal" },
  "instructgpt",
  "dpo",
  { title: "DeepSeek-R1 Incentivizes Reasoning in LLMs through Reinforcement Learning", authors: "Guo, Yang, Zhang, Song, Wang, Zhu, Xu, Zhang, Ma, Bi, Zhang, Yu, Wu, Wu, Gou, et al.", venue: "Nature", year: "2025", tag: "paper" },
  { title: "Mastering the Game of Go without Human Knowledge (AlphaGo Zero)", authors: "Silver, Schrittwieser, Simonyan, Antonoglou, Huang, Guez, Hubert, Baker, Lai, Bolton, Chen, Lillicrap, Hui, Sifre, van den Driessche, Graepel, Hassabis", venue: "Nature", year: "2017", tag: "paper" },
  { title: "Asynchronous Methods for Deep Reinforcement Learning (A3C)", authors: "Mnih, Badia, Mirza, Graves, Lillicrap, Harley, Silver, Kavukcuoglu", venue: "ICML", year: "2016", tag: "paper" },
  { title: "Trust Region Policy Optimization", authors: "Schulman, Levine, Moritz, Jordan, Abbeel", venue: "ICML", year: "2015", tag: "paper" },
  { title: "Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning", authors: "Williams", venue: "Machine Learning 8(3-4)", year: "1992", tag: "seminal" },
  { title: "Deep Reinforcement Learning with Double Q-learning", authors: "van Hasselt, Guez, Silver", venue: "AAAI", year: "2016", tag: "paper" },
  { title: "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models", authors: "Shao, Wang, Zhu, Xu, Song, Bi, Zhang, Zhang, Li, Wu, Guo, et al.", venue: "arXiv", year: "2024", tag: "paper" },
  { title: "Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model (MuZero)", authors: "Schrittwieser, Antonoglou, Hubert, Simonyan, Sifre, Schmitt, Guez, Lockhart, Hassabis, Graepel, Lillicrap, Silver", venue: "Nature", year: "2020", tag: "paper" },
  { title: "Mastering Atari Games with Limited Data (EfficientZero)", authors: "Ye, Liu, Kurutach, Abbeel, Gao", venue: "NeurIPS", year: "2021", tag: "paper" },
  { title: "Dueling Network Architectures for Deep Reinforcement Learning", authors: "Wang, Schaul, Hessel, van Hasselt, Lanctot, de Freitas", venue: "ICML", year: "2016", tag: "paper" },
  { title: "Approximately Optimal Approximate Reinforcement Learning", authors: "Kakade, Langford", venue: "ICML", year: "2002", tag: "seminal" },
  { title: "High-Dimensional Continuous Control Using Generalized Advantage Estimation", authors: "Schulman, Moritz, Levine, Jordan, Abbeel", venue: "ICLR", year: "2016", tag: "paper" },
  { title: "DAPO: An Open-Source LLM Reinforcement Learning System at Scale", authors: "Yu, Zhang, Zhu, Yuan, Zuo, Yue, Dai, Fan, Liu, Liu, Liu, Lin, Lin, Ma, Sheng, et al.", venue: "arXiv", year: "2025", tag: "paper" },
  { title: "Group Sequence Policy Optimization (GSPO)", authors: "Zheng, Liu, Li, Chen, Yu, Gao, Dang, Liu, Men, Yang, Zhou, Lin", venue: "arXiv", year: "2025", tag: "paper" },
  { title: "Back to Basics: Revisiting REINFORCE-Style Optimization for Learning from Human Feedback in LLMs (RLOO)", authors: "Ahmadian, Cremer, Gallé, Fadaee, Kreutzer, Pietquin, Üstün, Hooker", venue: "ACL", year: "2024", tag: "paper" },
]);

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
        Chapter 12 · Part III — Large Language Models
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
        Supervised learning requires labeled examples of correct behavior;
        reinforcement learning requires only a reward signal, turning behavior
        into a trial-and-reward search rather than a fixed answer key. From
        Atari games to protein folding strategies to language model alignment,
        reward alone has proven sufficient to produce extraordinarily complex
        behavior. But that same power cuts both ways — a reward that isn't
        precisely the desired behavior gets optimized anyway — and this chapter
        builds the value-function, policy-gradient, and PPO (Proximal Policy
        Optimization) machinery that Chapter 13's alignment pipeline runs on
        top of.
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
        that maximizes the expected cumulative discounted reward — the return{" "}
        <InlineMath>{"G_t = \\sum_{k=0}^{\\infty} \\gamma^k r_{t+k}"}</InlineMath>,
        the sum of every future reward the agent will collect, discounted by
        how far away it is. The Bellman equation expresses two related
        quantities recursively: the optimal value function{" "}
        <InlineMath>{"V^*(s)"}</InlineMath>, the best possible return achievable
        starting from state <InlineMath>{"s"}</InlineMath>, and the optimal
        action-value function <InlineMath>{"Q^*(s, a)"}</InlineMath>, the best
        possible return achievable by taking action <InlineMath>{"a"}</InlineMath>{" "}
        in state <InlineMath>{"s"}</InlineMath> and then acting optimally
        thereafter. Each equals the immediate reward plus the discounted value
        of the best reachable continuation [1].
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
        is overwhelmingly model-free; recent successes like MuZero
        (Schrittwieser et al., 2020) [13] and EfficientZero (Ye et al., 2021)
        [14] show that learned-dynamics planning can be competitive when the
        world model is good enough.
      </p>

      <MathBlock>{`$$\\begin{aligned}
  V^*(s) &= \\max_a \\left[ R(s, a) + \\gamma \\sum_{s'} P(s' \\mid s, a)\\, V^*(s') \\right] \\\\
  Q^*(s, a) &= R(s, a) + \\gamma \\sum_{s'} P(s' \\mid s, a)\\, \\max_{a'} Q^*(s', a')
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"R(s, a)"}</InlineMath> is the expected immediate
        reward for taking action <InlineMath>{"a"}</InlineMath> in state{" "}
        <InlineMath>{"s"}</InlineMath>, <InlineMath>{"P(s' \\mid s, a)"}</InlineMath>{" "}
        the probability of landing in state <InlineMath>{"s'"}</InlineMath>,
        and <InlineMath>{"\\gamma"}</InlineMath> the discount factor weighing
        future value against immediate reward.
      </p>

      <AgentEnvironmentLoop />

      <p style={prose}>
        The Bellman equation is a fixed-point condition, not a procedure —
        computing <InlineMath>{"V^*(s)"}</InlineMath> still requires an
        algorithm. <em>Value iteration</em> is the simplest one: initialize{" "}
        <InlineMath>{"V(s)"}</InlineMath> arbitrarily (zero everywhere works),
        then repeatedly sweep every state and apply the Bellman backup —
        replace <InlineMath>{"V(s)"}</InlineMath> with the best action's
        immediate reward plus its discounted next-state value — stopping once
        the largest change across all states falls below a small threshold.
        Each sweep propagates information one step further backward from any
        rewarding states; the Bellman backup is a contraction, which is what
        guarantees convergence to <InlineMath>{"V^*"}</InlineMath> regardless
        of how <InlineMath>{"V(s)"}</InlineMath> was initialized.
      </p>

      <p style={prose}>
        Run value iteration on the grid below and watch{" "}
        <InlineMath>{"V(s)"}</InlineMath> propagate outward from the goal
        cell, one sweep at a time, before the arrows — the resulting greedy
        policy — settle into a stable path around the walls.
      </p>

      <MDPExplorer
        tryThis={{
          do: "Click Step a few times to watch one Bellman sweep at a time, then click Run VI to convergence.",
          notice: "Values propagate backward from the goal cell a sweep at a time; the arrows freeze into a stable policy once the largest per-sweep change drops below the convergence threshold and the iteration counter stops climbing.",
        }}
      />

      {/* ── Section 2: Q-Learning & DQN ──────────────────────────────────────── */}
      <div id="q-learning-and-dqn">
        <SectionTitle>Q-Learning &amp; DQN</SectionTitle>
      </div>

      <p style={prose}>
        Q-learning learns the action-value function{" "}
        <InlineMath>{"Q(s, a)"}</InlineMath> without a model of the environment
        dynamics, using temporal difference updates: <InlineMath>{"Q(s, a)"}</InlineMath>{" "}
        gets nudged toward the observed reward plus the discounted best Q-value of
        the next state. Deep Q-Networks (DQN) replaced the lookup table with a
        neural network and introduced two crucial stabilizations: experience replay,
        which breaks temporal correlations by randomly sampling past transitions,
        and target networks, which provide stable TD targets by updating the
        target Q-network only periodically.
      </p>

      <p style={prose}>
        Learning <InlineMath>{"Q(s, a)"}</InlineMath> requires acting in the
        environment to generate the transitions the TD update consumes, which
        raises the <em>exploration-exploitation trade-off</em>: acting greedily
        (always taking <InlineMath>{"\\arg\\max_a Q(s, a)"}</InlineMath>) exploits
        current knowledge but never discovers whether an untried action is
        actually better, while acting randomly explores broadly but wastes reward
        on actions already known to be worse. The standard resolution is an{" "}
        <em>epsilon-greedy</em> policy: with probability{" "}
        <InlineMath>{"\\varepsilon"}</InlineMath> take a uniformly random action
        (explore), and with probability{" "}
        <InlineMath>{"1 - \\varepsilon"}</InlineMath> take the current best
        action (exploit). <InlineMath>{"\\varepsilon"}</InlineMath> typically
        starts high, when the Q-value estimates are still unreliable, and decays
        over training as they improve.
      </p>

      <p style={prose}>
        Mnih et al. (2015) [2] published "Human-Level Control
        through Deep Reinforcement Learning" in <em>Nature</em> — the moment deep
        RL went from a research idea to a credible field. A single Q-network
        architecture, trained from raw pixels with the same hyperparameters on
        49 different Atari games, achieved superhuman performance on 29 of them.
        The two stabilization tricks were essential, not optional: experience
        replay broke the temporal correlations between consecutive transitions
        that would otherwise turn the i.i.d. (independent and identically
        distributed) assumption underlying SGD (stochastic gradient descent)
        into a fiction; target networks prevented the moving-target problem
        where Q-values chase themselves into divergence. Without either, deep
        Q-learning was prone to collapse; with both, it worked reliably.
        Q-learning is also <em>off-policy</em> — the policy that explored and
        generated the data can differ from the policy being learned — which is
        what makes experience replay possible at all (on-policy methods can't
        reuse old data, since the policy that generated it has moved on).
      </p>

      <p style={prose}>
        Three years after DQN, Silver et al. (2017)
        demonstrated something more remarkable: <em>AlphaGo Zero</em> [7], a
        Go-playing system trained purely from self-play with no human games or
        expert demonstrations, surpassed every prior Go program — including the
        version of AlphaGo that beat Lee Sedol — within 40 days of training. The
        technique combined a deep neural network (mapping board positions to value
        and policy estimates) with Monte Carlo Tree Search (which simulates many
        random rollouts from a position to estimate which move is strongest) for
        action selection, learning both representations end-to-end from the
        reward signal of game outcomes. AlphaGo Zero is conceptually the precursor
        to the "pure RL produces emergent capability" pattern that
        DeepSeek-R1-Zero would later demonstrate for language models — Section 5
        returns to this connection. Variants like Double DQN (van Hasselt et al.
        2016) [11] and Dueling DQN (Wang et al., 2016) [15] address specific
        failure modes of vanilla Q-learning; the broader family is alive and
        well in domains where pure value-based methods suffice.
      </p>

      <MathBlock>{"$$Q(s, a) \\leftarrow Q(s, a) + \\alpha \\bigl[\\, r + \\gamma \\max_{a'} Q(s', a') - Q(s, a) \\,\\bigr]$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\alpha"}</InlineMath> is the learning rate
        controlling the update's step size, <InlineMath>{"\\gamma"}</InlineMath>{" "}
        the discount factor, and the bracketed term the TD error — the gap
        between the current estimate and the bootstrapped target{" "}
        <InlineMath>{"r + \\gamma \\max_{a'} Q(s', a')"}</InlineMath>.
      </p>

      <p style={prose}>
        A concrete pass through the update makes the mechanics explicit.
        Suppose <InlineMath>{"Q(s, a) = 2.0"}</InlineMath>, the agent takes
        action <InlineMath>{"a"}</InlineMath>, observes reward{" "}
        <InlineMath>{"r = 1"}</InlineMath>, and the best next-state value is{" "}
        <InlineMath>{"\\max_{a'} Q(s', a') = 3.0"}</InlineMath>, with{" "}
        <InlineMath>{"\\alpha = 0.1"}</InlineMath> and{" "}
        <InlineMath>{"\\gamma = 0.9"}</InlineMath>. The TD target is{" "}
        <InlineMath>{"1 + 0.9(3.0) = 3.7"}</InlineMath>, the TD error is{" "}
        <InlineMath>{"3.7 - 2.0 = 1.7"}</InlineMath>, and the update is{" "}
        <InlineMath>{"Q(s, a) \\leftarrow 2.0 + 0.1(1.7) = 2.17"}</InlineMath> —
        a small nudge toward the target rather than a jump to it, which is what
        keeps learning stable. A second update from the same pair, if the next
        observed <InlineMath>{"\\max Q"}</InlineMath> were instead{" "}
        <InlineMath>{"2.5"}</InlineMath>, would nudge{" "}
        <InlineMath>{"Q(s, a)"}</InlineMath> from{" "}
        <InlineMath>{"2.17"}</InlineMath> toward{" "}
        <InlineMath>{"1 + 0.9(2.5) = 3.25"}</InlineMath>, landing at{" "}
        <InlineMath>{"2.17 + 0.1(3.25 - 2.17) = 2.278"}</InlineMath>.
      </p>

      <DQNStabilization />

      <p style={prose}>
        Drop <InlineMath>{"\\varepsilon"}</InlineMath> to near{" "}
        <InlineMath>{"0"}</InlineMath> below and run a few episodes — the agent
        exploits whatever Q-values it already has and can settle into a
        suboptimal path. Then bring <InlineMath>{"\\varepsilon"}</InlineMath>{" "}
        back up to around <InlineMath>{"0.3"}</InlineMath> and run 100 episodes
        at once; watch the Q-value arrows sharpen into a consistent shortest
        path around the wall and penalty cells as more of the grid gets explored.
      </p>

      <QLearning
        tryThis={{
          do: "Drop ε near 0 and run a few episodes, then raise it back to about 0.3 and click Run 100.",
          notice: "At low ε the agent exploits its current, possibly incomplete Q-values and can settle into a suboptimal path; with more exploration the arrows sharpen into a consistent shortest path around the wall and penalty cells.",
        }}
      />

      {/* ── Section 3: Policy Gradients ───────────────────────────────────────── */}
      <div id="policy-gradients">
        <SectionTitle>Policy Gradients</SectionTitle>
      </div>

      <p style={prose}>
        Section 1's <InlineMath>{"V^*(s)"}</InlineMath> and{" "}
        <InlineMath>{"Q^*(s, a)"}</InlineMath> describe value under the{" "}
        <em>optimal</em> policy. Policy gradient methods need the more general,
        fixed-policy versions — the value <InlineMath>{"V^\\pi(s)"}</InlineMath>{" "}
        and action-value <InlineMath>{"Q^\\pi(s, a)"}</InlineMath> of following
        whatever policy <InlineMath>{"\\pi"}</InlineMath> the agent currently
        has, not necessarily the best one:
      </p>

      <MathBlock>{`$$\\begin{aligned}
  V^\\pi(s) &= \\mathbb{E}_\\pi\\!\\left[\\, r + \\gamma\\, V^\\pi(s') \\,\\right] \\\\
  Q^\\pi(s, a) &= \\mathbb{E}\\!\\left[\\, r + \\gamma\\, Q^\\pi(s', a') \\,\\right]
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        Same recursive structure as the Bellman optimality equations, but
        evaluated under the current policy <InlineMath>{"\\pi"}</InlineMath>{" "}
        rather than the best possible one — it's <InlineMath>{"V^\\pi"}</InlineMath>{" "}
        that an actor-critic's critic will actually estimate below.
      </p>

      <p style={prose}>
        Instead of learning a value function, policy gradient methods directly
        optimize the policy by gradient ascent on expected return. The REINFORCE
        algorithm computes gradients using rollout returns — high-return trajectories
        get reinforced, low-return ones get suppressed. Actor-critic methods reduce
        variance by using a value function (the critic) as a baseline, computing
        the advantage <InlineMath>{"A^\\pi(s, a) = Q^\\pi(s, a) - V^\\pi(s)"}</InlineMath>{" "}
        (commonly abbreviated <InlineMath>{"A(s, a)"}</InlineMath> or{" "}
        <InlineMath>{"A_t"}</InlineMath> once the policy is clear from context)
        rather than raw returns.
      </p>

      <p style={prose}>
        Williams (1992) [10] introduced REINFORCE as the first practical policy
        gradient algorithm. The intuition is clean: sample a trajectory, compute
        its return, and push up the log-probability of every action taken
        proportionally to that return. The problem is variance — returns can
        range from very negative to very positive even for similar policies,
        and the gradient signal is noisy enough that learning is slow. Two
        complementary fixes addressed this. <em>Baselines</em>: subtracting any
        state-dependent function <InlineMath>{"b(s)"}</InlineMath> from the
        return leaves the gradient unbiased but can dramatically reduce
        variance — the value function <InlineMath>{"V^\\pi(s)"}</InlineMath> is
        the standard choice, producing the advantage above.{" "}
        <em>Actor-critic methods</em>: a separate
        "critic" network learns <InlineMath>{"V^\\pi(s)"}</InlineMath> while the
        "actor" updates the policy, allowing the advantage to be estimated
        online rather than from full Monte Carlo rollouts.
      </p>

      <p style={prose}>
        Mnih et al. (2016) [8] introduced <em>A3C</em> — Asynchronous Advantage
        Actor-Critic — which spawned a wave of parallel RL methods. Many CPU
        workers run their own copies of the environment, compute gradients on
        their local experience, and asynchronously push updates to a shared
        central network. The diversity of experience across workers naturally
        decorrelates the gradients in the same way experience replay did for
        DQN, often without needing replay at all. A3C and its synchronous
        variant A2C dominated continuous-control benchmarks (MuJoCo, robotics
        simulators) before being largely replaced by PPO. Policy gradient
        methods remain the default for environments with continuous action
        spaces, where the discrete <InlineMath>{"\\arg\\max"}</InlineMath>{" "}
        of Q-learning is infeasible.
      </p>

      <p style={prose}>
        The theorem's odd-looking form — a log-probability gradient times a
        return, rather than a gradient of the return itself — falls out of a
        single algebraic trick. The objective{" "}
        <InlineMath>{"J(\\theta) = \\mathbb{E}_{\\tau \\sim \\pi_\\theta}[R(\\tau)]"}</InlineMath>{" "}
        is an expectation taken under the very distribution{" "}
        <InlineMath>{"\\pi_\\theta"}</InlineMath> that{" "}
        <InlineMath>{"\\nabla_\\theta"}</InlineMath> is differentiating, so
        the gradient can't simply move inside the expectation the way it
        would for a fixed data distribution. The identity{" "}
        <InlineMath>{"\\nabla_\\theta \\log \\pi_\\theta(a \\mid s) = \\nabla_\\theta \\pi_\\theta(a \\mid s) / \\pi_\\theta(a \\mid s)"}</InlineMath>{" "}
        — the <em>log-derivative trick</em> — lets{" "}
        <InlineMath>{"\\nabla_\\theta \\pi_\\theta"}</InlineMath> be rewritten
        as <InlineMath>{"\\pi_\\theta \\cdot \\nabla_\\theta \\log \\pi_\\theta"}</InlineMath>;
        substituting that back inside{" "}
        <InlineMath>{"\\nabla_\\theta J(\\theta)"}</InlineMath> turns the
        gradient of an expectation back into an ordinary expectation — this
        time of <InlineMath>{"\\nabla_\\theta \\log \\pi_\\theta(a \\mid s)"}</InlineMath>{" "}
        weighted by return — which a batch of sampled rollouts can estimate
        by simple averaging instead of requiring the intractable gradient of
        the sampling distribution itself. Swapping the raw return for the
        action-value <InlineMath>{"Q(s, a)"}</InlineMath> (equivalent in
        expectation, and the form the baseline subtraction discussed above
        acts on) gives the policy gradient theorem:
      </p>

      <MathBlock>{"$$\\nabla_\\theta J(\\theta) = \\mathbb{E}_\\pi\\!\\left[\\, \\nabla_\\theta \\log \\pi_\\theta(a \\mid s) \\cdot A(s, a) \\,\\right]$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\theta"}</InlineMath> parameterizes the policy,{" "}
        <InlineMath>{"\\pi_\\theta(a \\mid s)"}</InlineMath> is the probability
        the policy assigns to action <InlineMath>{"a"}</InlineMath> in state{" "}
        <InlineMath>{"s"}</InlineMath>, and <InlineMath>{"A(s, a)"}</InlineMath>{" "}
        is the advantage — positive when the action outperformed the policy's
        average, negative when it underperformed.
      </p>

      <RLApproachTaxonomy />

      <p style={prose}>
        Click Rollout ×10 below several times in a row and watch the Gaussian
        policy curve drift toward the reward function's peak while its spread
        narrows — the log-probability-times-advantage update from the equation
        above, applied many times.
      </p>

      <PolicyGradient
        tryThis={{
          do: "Click Rollout ×10 several times in a row.",
          notice: "The policy curve's mean drifts toward the reward peak and its spread narrows as the policy grows more confident — the same log-probability-times-advantage update from the equation above, repeated many times.",
        }}
      />

      {/* ── Section 4: PPO ────────────────────────────────────────────────────── */}
      <div id="proximal-policy-optimization">
        <SectionTitle>PPO</SectionTitle>
      </div>

      <p style={prose}>
        Section 3's policy gradient theorem is <em>on-policy</em>: its
        expectation is taken under <InlineMath>{"\\pi_\\theta"}</InlineMath>{" "}
        itself, so in principle every gradient step needs fresh rollouts from
        whatever the current policy happens to be. Reusing a batch of rollouts
        for more than one gradient step — which is exactly what makes training
        efficient, since collecting rollouts is the expensive part — requires
        correcting for the fact that the data was actually generated by an
        older policy <InlineMath>{"\\pi_{\\theta_{\\text{old}}}"}</InlineMath>,
        not the current one. Importance sampling supplies that correction:
        reweight each sampled action's contribution by the probability ratio{" "}
        <InlineMath>{"r_t(\\theta) = \\pi_\\theta(a \\mid s) / \\pi_{\\theta_{\\text{old}}}(a \\mid s)"}</InlineMath>,
        giving the surrogate objective below (CPI stands for{" "}
        <em>conservative policy iteration</em>, the algorithm that introduced
        this ratio; Kakade &amp; Langford, 2002 [16]).
      </p>

      <MathBlock>{"$$\\mathcal{L}^{\\text{CPI}}(\\theta) = \\mathbb{E}_t\\!\\left[\\, r_t(\\theta)\\, A_t \\,\\right]$$"}</MathBlock>

      <p style={prose}>
        At <InlineMath>{"\\theta = \\theta_{\\text{old}}"}</InlineMath>,{" "}
        <InlineMath>{"r_t = 1"}</InlineMath> and{" "}
        <InlineMath>{"\\mathcal{L}^{\\text{CPI}}(\\theta_{\\text{old}}) = \\mathbb{E}_t[A_t]"}</InlineMath> —
        a scalar near zero, not <InlineMath>{"J(\\theta)"}</InlineMath> itself.
        What actually matches the ordinary policy gradient is the{" "}
        <em>gradient</em> of <InlineMath>{"\\mathcal{L}^{\\text{CPI}}"}</InlineMath>{" "}
        at <InlineMath>{"\\theta_{\\text{old}}"}</InlineMath>, not the value of{" "}
        <InlineMath>{"\\mathcal{L}^{\\text{CPI}}"}</InlineMath> as a function:{" "}
        <InlineMath>{"\\nabla_\\theta \\mathcal{L}^{\\text{CPI}}(\\theta)\\big|_{\\theta_{\\text{old}}} = \\nabla_\\theta J(\\theta)\\big|_{\\theta_{\\text{old}}}"}</InlineMath>,
        because <InlineMath>{"\\nabla_\\theta r_t(\\theta)\\big|_{\\theta_{\\text{old}}} = \\nabla_\\theta \\log \\pi_\\theta(a \\mid s)\\big|_{\\theta_{\\text{old}}}"}</InlineMath>{" "}
        reproduces exactly the log-derivative term from Section 3's theorem.
        That gradient match is a special case of a deeper fact — Kakade &amp;
        Langford's <em>performance-difference lemma</em> [16] — which shows
        that the surrogate return <InlineMath>{"J(\\theta_{\\text{old}}) + \\mathcal{L}^{\\text{CPI}}(\\theta)"}</InlineMath>{" "}
        agrees with the true objective <InlineMath>{"J(\\theta)"}</InlineMath>{" "}
        to first order at <InlineMath>{"\\theta_{\\text{old}}"}</InlineMath> —
        same value, same gradient — which is the actual reason a small step
        under the surrogate is trustworthy. Maximizing{" "}
        <InlineMath>{"\\mathcal{L}^{\\text{CPI}}"}</InlineMath> directly,
        though, is dangerous precisely because that guarantee is local:
        nothing stops a single update from pushing{" "}
        <InlineMath>{"r_t"}</InlineMath> far from <InlineMath>{"1"}</InlineMath>,
        meaning the policy changes so much in one step that the first-order
        approximation is no longer trustworthy — and the update can destroy
        performance that took many iterations to build.
      </p>

      <p style={prose}>
        TRPO (Trust Region Policy Optimization, Schulman et al. 2015) [9]
        addressed this head-on by constraining the KL divergence between the
        old and new policies{" "}
        <InlineMath>{"\\text{KL}(\\pi_{\\theta_{\\text{old}}} \\,\\|\\, \\pi_\\theta) \\leq \\delta"}</InlineMath>{" "}
        — keeping every update inside a "trust region" where the linear
        approximation is reliable. Critically, that KL ball lives in{" "}
        <em>policy-distribution space</em>, not parameter space: two parameter
        vectors that are numerically close can produce wildly different action
        distributions (and vice versa), so constraining parameter distance
        directly would be the wrong proxy for how much the policy's{" "}
        <em>behavior</em> actually changed. Enforcing the KL constraint exactly
        required a conjugate gradient solver and was notoriously fiddly to
        implement.
      </p>

      <p style={prose}>
        PPO (Schulman et al. 2017) [3] achieved nearly all of TRPO's stability
        with a far simpler heuristic that avoids the constrained-optimization
        machinery entirely: instead of a hard KL constraint, clip the
        probability ratio whenever it strays too far from{" "}
        <InlineMath>{"1"}</InlineMath>, directly inside the objective being
        maximized. This is the dominant on-policy RL algorithm for language
        model fine-tuning today.
      </p>

      <MathBlock>{"$$\\mathcal{L}^{\\text{CLIP}}(\\theta) = \\mathbb{E}_t \\!\\left[\\, \\min\\!\\left(r_t(\\theta)\\, A_t,\\ \\text{clip}\\bigl(r_t(\\theta),\\, 1-\\varepsilon,\\, 1+\\varepsilon\\bigr) A_t\\right) \\right]$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"r_t(\\theta)"}</InlineMath> is the same probability
        ratio as above, <InlineMath>{"A_t"}</InlineMath> the advantage estimate,
        and <InlineMath>{"\\varepsilon"}</InlineMath> the clip range (typically{" "}
        <InlineMath>{"0.1"}</InlineMath>–<InlineMath>{"0.2"}</InlineMath>). The{" "}
        <InlineMath>{"\\min(\\cdot)"}</InlineMath> makes clipping{" "}
        <em>one-sided</em>, not symmetric: when the ratio moves in the
        direction that would increase the objective past the trust-region
        boundary — for example <InlineMath>{"r_t > 1 + \\varepsilon"}</InlineMath>{" "}
        when <InlineMath>{"A_t > 0"}</InlineMath> — the gradient is clipped to
        zero, but movement in the opposite direction, back toward the trust
        region, still receives full gradient signal. This asymmetry lets PPO
        passively correct an overly aggressive update while never penalizing a
        policy for retreating toward its old behavior.
      </p>

      <TrustRegionAndClipping />

      <p style={prose}>
        Set the advantage above zero and drag <InlineMath>{"r"}</InlineMath>{" "}
        past <InlineMath>{"1 + \\varepsilon"}</InlineMath> below; watch the{" "}
        <InlineMath>{"\\partial L / \\partial r"}</InlineMath>{" "}
        readout drop to zero, then drag <InlineMath>{"r"}</InlineMath> back
        down through <InlineMath>{"1"}</InlineMath> toward{" "}
        <InlineMath>{"0"}</InlineMath> and notice the gradient reactivates
        immediately — a shrinking ratio when{" "}
        <InlineMath>{"A_t > 0"}</InlineMath> is movement back toward the trust
        region, not away from it, so nothing clips it.
      </p>

      <PPOClipping
        tryThis={{
          do: "Set A above zero and drag r past 1+ε, then drag it back down through r=1 toward 0.",
          notice: "∂L/∂r drops to zero once r crosses 1+ε — the objective-increasing direction gets clipped — but dragging r back down through and below the trust region never zeroes the gradient for A>0; clipping only ever blocks movement in the direction that would increase the objective past the boundary.",
        }}
      />

      <p style={prose}>
        <strong>Going deeper: the objective PPO actually optimizes.</strong>{" "}
        The clipped policy objective is only part of what a real PPO run
        maximizes. Because the actor and critic (Section 3) typically share
        parameters in practice, the full loss combines three terms: the
        clipped policy objective, a value-function regression loss so the
        critic's <InlineMath>{"V(s)"}</InlineMath> estimates stay accurate, and
        an entropy bonus that discourages the policy from collapsing to a
        deterministic action too early, which would kill exploration.
      </p>

      <MathBlock>{"$$\\mathcal{L}^{\\text{CLIP+VF+S}}(\\theta) = \\mathbb{E}_t\\!\\left[\\, \\mathcal{L}_t^{\\text{CLIP}}(\\theta) - c_1 \\mathcal{L}_t^{\\text{VF}}(\\theta) + c_2\\, S[\\pi_\\theta](s_t) \\,\\right]$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\mathcal{L}^{\\text{VF}}"}</InlineMath> is the
        squared error between the critic's predicted{" "}
        <InlineMath>{"V(s_t)"}</InlineMath> and the observed return,{" "}
        <InlineMath>{"S[\\pi_\\theta]"}</InlineMath> is the policy's entropy at{" "}
        <InlineMath>{"s_t"}</InlineMath>, and{" "}
        <InlineMath>{"c_1, c_2"}</InlineMath> are scalar weights (commonly{" "}
        <InlineMath>{"c_1 \\approx 0.5"}</InlineMath> and{" "}
        <InlineMath>{"c_2"}</InlineMath> small or annealed toward zero) trading
        value accuracy and exploration against the clipped policy term. The
        original PPO paper also proposed a second variant,{" "}
        <em>PPO-Penalty</em>, which keeps the unclipped surrogate but adds an
        adaptive KL penalty instead — the penalty coefficient rises when the
        observed KL divergence exceeds a target and falls otherwise. PPO-Clip
        (derived above) matched or outperformed PPO-Penalty in the original
        experiments and is what nearly every subsequent implementation uses,
        which is why "PPO" is shorthand for PPO-Clip throughout the rest of
        this book.
      </p>

      <p style={prose}>
        One piece the equations above leave unspecified is how{" "}
        <InlineMath>{"A_t"}</InlineMath> itself gets computed. Section 3's
        one-step form <InlineMath>{"A^\\pi(s, a) = Q^\\pi(s, a) - V^\\pi(s)"}</InlineMath>{" "}
        is the simplest option, but real PPO implementations almost always use{" "}
        <em>Generalized Advantage Estimation</em> (GAE, Schulman et al., 2016)
        [17] instead, blending TD residuals across multiple future steps to
        trade off bias and variance:
      </p>

      <MathBlock>{"$$A_t^{\\text{GAE}(\\lambda)} = \\sum_{l=0}^{\\infty} (\\gamma \\lambda)^l\\, \\delta_{t+l}, \\qquad \\delta_t = r_t + \\gamma V(s_{t+1}) - V(s_t)$$"}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\delta_t"}</InlineMath> is the one-step TD residual —
        how much better or worse the actual next state turned out to be than
        the critic predicted — and <InlineMath>{"\\lambda"}</InlineMath>{" "}
        interpolates between a low-variance, high-bias one-step estimate
        (<InlineMath>{"\\lambda = 0"}</InlineMath>, which recovers the
        one-step actor-critic advantage above) and a high-variance, low-bias
        Monte Carlo estimate (<InlineMath>{"\\lambda = 1"}</InlineMath>); PPO
        implementations commonly use <InlineMath>{"\\lambda \\approx 0.95"}</InlineMath>.
      </p>

      <p style={prose}>
        PPO's stability properties made it the default for fine-tuning language
        models with RL — InstructGPT, ChatGPT's earliest training runs, and most
        RLHF pipelines through 2023 used PPO as the policy optimizer. The fit is
        natural: language-model policies have astronomically many parameters,
        are expensive to roll out, and need every gradient step to be reliable.
        <em> GRPO</em> (Group Relative Policy Optimization, Shao et al. 2024
        [12], used in DeepSeek's R1 family) drops the separate value/critic
        network entirely — instead, it samples a <em>group</em> of{" "}
        <InlineMath>{"G"}</InlineMath> outputs for the same prompt and uses
        each output's normalized within-group return as its advantage, and it
        subtracts the KL penalty directly inside the per-token loss rather than
        folding it into the reward the way RLHF does (Section 5):
      </p>

      <MathBlock>{`$$\\begin{aligned}
  \\hat{A}_i &= \\frac{r_i - \\text{mean}(r_1, \\dots, r_G)}{\\text{std}(r_1, \\dots, r_G)} \\\\
  \\mathcal{L}^{\\text{GRPO}}(\\theta) &= \\mathbb{E}\\!\\left[\\, \\min\\!\\left(r_t(\\theta)\\, \\hat{A}_i,\\ \\text{clip}\\bigl(r_t(\\theta),\\, 1-\\varepsilon,\\, 1+\\varepsilon\\bigr) \\hat{A}_i\\right) - \\beta\\, \\text{KL}(\\pi_\\theta \\,\\|\\, \\pi_{\\text{ref}}) \\,\\right]
\\end{aligned}$$`}</MathBlock>

      <p style={prose}>
        <InlineMath>{"\\hat{A}_i"}</InlineMath> is the{" "}
        <InlineMath>{"i"}</InlineMath>-th output's reward standardized against
        its own group of <InlineMath>{"G"}</InlineMath> samples for the same
        prompt — a group-relative baseline in place of a learned critic — and{" "}
        <InlineMath>{"\\beta\\, \\text{KL}(\\pi_\\theta \\,\\|\\, \\pi_{\\text{ref}})"}</InlineMath>{" "}
        is subtracted inside the loss on every token, rather than being blended
        into the reward before the advantage is computed. Dropping the critic
        network roughly halves memory and compute relative to PPO while
        preserving the clipping mechanism, and the recipe is increasingly the
        default for reasoning-model post-training.
      </p>

      <p style={prose}>
        <strong>Going deeper: past GRPO.</strong> GRPO is not the end of the
        line. DAPO (Yu et al., 2025) [18] decouples the clip range's upper and
        lower bounds and adds dynamic sampling, targeting a specific failure
        mode where GRPO's entropy collapses and the policy stops exploring;
        GSPO (Zheng et al., 2025) [19] replaces GRPO's token-level probability
        ratio with a sequence-level one, fixing instability GRPO exhibits when
        training Mixture-of-Experts models; and RLOO (REINFORCE Leave-One-Out,
        Ahmadian et al., 2024) [20] drops PPO's clipping and importance ratio
        entirely, using a simpler leave-one-out baseline within each group
        instead. All three are 2024–2025-era refinements to the same
        group-relative idea introduced here, not replacements for it.
      </p>

      {/* ── Section 5: RLHF, RLEF & RLVR ────────────────────────────────────── */}
      <div id="rlhf-and-rlvr">
        <SectionTitle>RLHF, RLEF &amp; RLVR</SectionTitle>
      </div>

      <p style={prose}>
        This section takes the RL view of aligning language models: RLHF, RLEF,
        and RLVR are three ways to define <em>what counts as reward</em>, and all
        three hand that reward to the same optimizer machinery covered above.
        Chapter 13 covers the full training pipeline — where the reward model
        comes from, why a KL penalty against the SFT policy matters, and how DPO
        sidesteps the RL loop entirely; here the reward model is just another
        reward function. RLEF (from Execution Feedback) uses code execution
        results — correct or incorrect — as a verifiable binary reward, eliminating
        the need for human annotation on coding tasks. RLVR (from Verifiable Rewards)
        generalizes this to any task with a ground-truth verifier: math problems
        with known answers, formal proofs that a theorem-prover validates, logical
        puzzles.
      </p>

      <p style={prose}>
        All three techniques share the same RL machinery — typically PPO or GRPO
        optimizing a policy against some reward function — and differ only in{" "}
        <em>where the reward comes from</em>. RLHF [4] (Ouyang et al. 2022)
        trains a learned reward model from pairwise human preferences; the
        reward is a learned proxy for human judgment. RLEF uses a deterministic
        verifier: code that compiles and passes tests gets reward{" "}
        <InlineMath>{"1"}</InlineMath>, code that fails gets{" "}
        <InlineMath>{"0"}</InlineMath>. The reward is mechanical, cheap to
        compute, and exactly aligned with the task. RLVR generalizes RLEF to any
        task with a ground-truth checker. DPO (Rafailov et al., 2023) [5]
        (covered in Chapter 13) deserves a
        separate mention here as the <em>learned-reward-free</em> alternative to
        RLHF: by reformulating the optimization, DPO uses preference pairs
        directly as a classification target with no explicit reward model and no
        RL loop at all. DPO and RLHF have largely converged in practice for
        open-weight models.
      </p>

      <p style={prose}>
        DeepSeek-R1 (Guo et al., 2025) [6] introduced two distinct models that
        should not be conflated. <em>DeepSeek-R1-Zero</em> was trained from the
        DeepSeek-V3-Base model using <em>only</em> RL with verifiable rewards —
        no supervised fine-tuning, no human preference data, no cold start. It
        showed that reasoning behaviors — long chains of thought, self-verification,
        occasional "aha moments" of strategy revision — could emerge purely from
        the RL signal, given that the rewards came from automatically-verifiable
        math and coding problems. R1-Zero was the breakthrough demonstration; it
        had real usability issues (language mixing, poor readability, formatting
        drift) that made it impractical to ship. This is <em>reward hacking</em>:
        a policy that satisfies the letter of a reward signal — a verifiably
        correct final answer — without the properties the reward's designer
        implicitly wanted, like readable, single-language output. The same
        failure mode threatens RLHF whenever a policy learns to exploit quirks
        of the learned reward model rather than genuinely satisfying it — one
        reason the KL penalty against the SFT policy in Chapter 13's pipeline
        matters as much as the reward term itself. <em>DeepSeek-R1</em>{" "}
        addressed R1-Zero's issues with a multi-stage pipeline: a small
        cold-start SFT on curated chain-of-thought examples, then RL with
        verifiable rewards, then rejection-sampled SFT (generate many candidate
        responses, keep only the ones an automatic checker scores highest, and
        fine-tune on those), then a second RL stage for general helpfulness. So
        R1-Zero is the "RL only" result; R1 is the productionized version that
        added back a small SFT phase. Both used GRPO (Section 4) rather than
        PPO. The conceptual import of R1-Zero parallels AlphaGo Zero (Section 2):
        given the right reward structure, deep RL can produce capabilities — like
        reasoning — that didn't have to be supervised in.
      </p>

      <p style={prose}>
        RLHF, RLEF, and RLVR differ only in where the reward comes from, but
        that difference is visible end-to-end. The diagram below lays out
        human preferences, execution feedback, and verifiable rewards as three
        separate sources feeding the same downstream PPO or GRPO optimizer.
      </p>

      <RewardSourceTaxonomy />

      <p style={prose}>
        Step through the RLHF pipeline below one stage at a time — SFT, reward
        model training, then PPO — and notice that only the final stage
        touches a reward signal at all, and that signal is the reward model's
        learned scalar output minus a KL penalty against the SFT policy, never
        a direct human label.
      </p>

      <RLHFPipeline
        tryThis={{
          do: "Click Next Stage through SFT, reward-model training, and PPO (or toggle Auto-play).",
          notice: "Only the final PPO stage touches a reward signal, and that signal is the reward model's learned scalar output minus a KL penalty against the SFT policy — never a direct human label.",
        }}
      />

      <p style={prose}>
        The widget below opens with both "Show example" and "Show chart" on;
        toggle each off and back on below to isolate what each one adds on
        top of the five always-visible comparison rows: the worked example
        shows the same response scored by a noisy learned reward model versus
        an exact binary verifier, and the scalability chart shows RLHF's curve
        bending as annotator bandwidth caps it while RLVR's keeps climbing.
      </p>

      <RLVRvsRLHF
        tryThis={{
          do: "Toggle 'Show example' off, then back on; do the same for 'Show chart'.",
          notice: "Both default to on. Switching 'Show example' off strips out the worked math-problem panel, leaving only the five comparison rows and summary strip; switching it back on restores RLVR's binary check scoring a response as unambiguously right or wrong next to RLHF's noisier learned-reward-model score. 'Show chart' works the same way for the scalability chart, which shows RLHF bending under annotator bandwidth while RLVR keeps climbing — and the reward-hacking row above both makes explicit why an exact verifier can't be gamed the way a learned reward model can.",
        }}
      />

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        Three pieces of this chapter's machinery recur through the rest of the
        book. Value functions and the Bellman equation — a state's worth
        decomposes into immediate reward plus discounted future value — reappear
        anywhere a system reasons about long-horizon consequences, not only in
        RL proper. Policy gradients and PPO's clipped surrogate objective are the
        actual optimizer Chapter 13's RLHF pipeline runs: every "train the policy
        against a reward model" step in that pipeline is the PPO (or GRPO)
        machinery derived here, complete with the KL penalty and reward-hacking
        risk this chapter names directly. And the RLHF/RLEF/RLVR taxonomy — three
        answers to "what counts as reward" — is the lens Chapter 13 uses to
        organize the modern alignment stack, from InstructGPT's human-preference
        pipeline to DeepSeek-R1's verifiable-reward one. Chapter 13 picks up from
        here with the full training pipeline: where the reward model comes from,
        why the KL penalty against the SFT policy matters in practice, and how
        DPO sidesteps the RL loop entirely.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
