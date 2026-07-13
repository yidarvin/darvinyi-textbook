import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import InlineMath from "../../components/shared/InlineMath";
import InstructionTuning from "../../components/widgets/ch13/InstructionTuning";
import TrainingPipeline from "../../components/widgets/ch13/TrainingPipeline";
import ConstitutionalAI from "../../components/widgets/ch13/ConstitutionalAI";
import ToolCallingTraining from "../../components/widgets/ch13/ToolCallingTraining";
import SafetyRefusal from "../../components/widgets/ch13/SafetyRefusal";
import DPOvsRLHF from "../../components/widgets/ch13/DPOvsRLHF";
import BaseVsSFTBehavior from "../../components/diagrams/ch13/BaseVsSFTBehavior";
import RLHFThreeStep from "../../components/diagrams/ch13/RLHFThreeStep";
import ConstitutionalAILoop from "../../components/diagrams/ch13/ConstitutionalAILoop";
import ToolCallExchange from "../../components/diagrams/ch13/ToolCallExchange";
import SafetyBoundary from "../../components/diagrams/ch13/SafetyBoundary";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = [
  { num: 1, title: "Training Language Models to Follow Instructions with Human Feedback (InstructGPT)", authors: "Ouyang, Wu, Jiang, Almeida, Wainwright, Mishkin, Zhang, Agarwal, Slama, Ray, Schulman, Hilton, Kelton, Miller, Simens, Askell, Welinder, Christiano, Leike, Lowe", venue: "NeurIPS", year: "2022", tag: "seminal" },
  { num: 2, title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model (DPO)", authors: "Rafailov, Sharma, Mitchell, Ermon, Manning, Finn", venue: "NeurIPS", year: "2023", tag: "seminal" },
  { num: 3, title: "Constitutional AI: Harmlessness from AI Feedback", authors: "Bai, Jones, Ndousse, Askell, Chen, DasSarma, Drain, Fort, Ganguli, Henighan, Joseph, Kadavath, Kernion, Conerly, El-Showk, Elhage, Hatfield-Dodds, Hernandez, Hume, Johnston, Kravec, Lovitt, Nanda, Olsson, Amodei, Brown, Clark, McCandlish, Olah, Mann, Kaplan", venue: "arXiv", year: "2022", tag: "seminal" },
  { num: 4, title: "Self-Instruct: Aligning Language Models with Self-Generated Instructions", authors: "Wang, Kordi, Mishra, Liu, Smith, Khashabi, Hajishirzi", venue: "ACL", year: "2023", tag: "paper" },
  { num: 5, title: "Toolformer: Language Models Can Teach Themselves to Use Tools", authors: "Schick, Dwivedi-Yu, Dessì, Raileanu, Lomeli, Zettlemoyer, Cancedda, Scialom", venue: "NeurIPS", year: "2023", tag: "paper" },
  { num: 6, title: "LIMA: Less Is More for Alignment", authors: "Zhou, Liu, Xu, Iyer, Du, Zhou, Lu, Wang, Pampari, Manjunatha, Mishra, Wang, Sukhbaatar, Pisarski, Ross, Steel, Auli, Ramanathan, Sharma, Levy, Lewis", venue: "NeurIPS", year: "2023", tag: "paper" },
  { num: 7, title: "Llama 2: Open Foundation and Fine-Tuned Chat Models", authors: "Touvron, Martin, Stone, Albert, Almahairi, Babaei, Bashlykov, Batra, Bhargava, Bhosale, Bikel, Blecher, Ferrer, Chen, Cucurull, Esiobu, Fernandes, Fu, Fu, Fuller, Gao, Goswami, Goyal, Hartshorn, Hosseini, Hou, Inan, Kardas, Kerkez, Khabsa, Kloumann, Korenev, Koura, Lachaux, Lavril, Lee, Liskovich, Lu, Mao, Martinet, Mihaylov, Mishra, Molybog, Nie, Poulton, Reizenstein, Rungta, Saladi, Schelten, Silva, Smith, Subramanian, Tan, Tang, Taylor, Williams, Kuan, Xu, Yan, Zarov, Zhang, Fan, Kambadur, Narang, Rodriguez, Stojnic, Edunov, Scialom", venue: "arXiv", year: "2023", tag: "paper" },
  { num: 8, title: "Red Teaming Language Models with Language Models", authors: "Perez, Huang, Song, Cai, Ring, Aslanides, Glaese, McAleese, Irving", venue: "EMNLP", year: "2022", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "the-training-pipeline",  label: "Training Pipeline" },
  { id: "instruction-tuning",     label: "Instruction Tuning" },
  { id: "preference-optimization", label: "Preference Optimization" },
  { id: "constitutional-ai",      label: "Constitutional AI" },
  { id: "tool-calling",           label: "Tool Calling" },
  { id: "safety-and-refusal",     label: "Safety & Refusal" },
];

export default function LLMTraining() {
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
        Chapter 13 · Part III — Large Language Models
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
        LLM Training &amp; Alignment
      </h1>

      <ChapterLede>
        A pretrained language model has read most of the public internet and learned
        to continue text in any direction. It does not yet know that "be helpful"
        should override "continue the pattern," that user requests should be answered
        rather than parodied, or that some requests should be declined regardless of
        how the prompt is phrased. The post-training stack — instruction tuning,
        preference optimization, constitutional methods, tool-use training, and
        safety alignment — is what transforms a capable next-token predictor into
        a usable assistant. Each stage is a distinct training objective applied to
        the same set of weights.
      </ChapterLede>

      {/* ── Section 1: The Training Pipeline ─────────────────────────────── */}
      <div id="the-training-pipeline">
        <SectionTitle>The Training Pipeline</SectionTitle>
      </div>

      <p style={prose}>
        A modern frontier model goes through four major training stages, often more.
        Pretraining establishes general language and reasoning capability from
        trillions of tokens of mixed-quality text. Supervised fine-tuning (SFT)
        shapes the model's outputs into a helpful instruction-following format
        using thousands to millions of human-written demonstrations. Preference
        optimization — RLHF, DPO, or a variant — aligns the model's behavior with
        human judgment by learning from comparisons. Safety training applies a
        final layer of refusal patterns, harm avoidance, and policy compliance.
        Each stage modifies the same weights with progressively narrower objectives:
        broad capability first, then format, then preference, then constraint.
      </p>

      <p style={prose}>
        The stages are extremely uneven in cost. Pretraining is overwhelmingly the
        most compute-expensive — for a frontier-class model, it consumes 95–99% of
        the total training budget and runs for weeks to months on thousands of GPUs.
        Every subsequent stage is comparatively cheap. Llama 2 [7] is a useful
        public reference point: roughly <InlineMath>{"1.7 \\times 10^6"}</InlineMath>{" "}
        GPU-hours on pretraining versus a small fraction of that on instruction
        tuning and RLHF combined. The implication is structural — most of the
        model's capability comes from pretraining, while post-training mostly shapes{" "}
        <em>how</em> the model expresses that capability. You cannot SFT a capability
        into a model that doesn't already have it; you can only redirect what's
        already there.
      </p>

      <p style={prose}>
        Each post-training stage applies a narrower objective to a more capable model,
        and the narrowing has a cost. Models often score slightly worse on raw
        benchmarks — perplexity on held-out text, completion accuracy on open-ended
        generation — after alignment than before. This gap is sometimes called the{" "}
        <em>alignment tax</em>. Part of it is inherent (a model that refuses some
        requests is less useful for those specific requests) and part is an artifact
        of imperfect training signals (preference data and constitutional principles
        can over-fit to surface patterns). Modern recipes work hard to minimize the
        tax through better data quality, KL-regularization against the pretrained
        policy, and capability-preserving fine-tuning, but some tax remains.
      </p>

      <TrainingPipeline />

      {/* ── Section 2: Instruction Tuning ─────────────────────────────────── */}
      <div id="instruction-tuning">
        <SectionTitle>Instruction Tuning (SFT)</SectionTitle>
      </div>

      <p style={prose}>
        A base model trained only on next-token prediction does not naturally
        respond to instructions. Given "Translate this to French:", it might
        continue with another similar instruction rather than producing the
        translation. Instruction tuning fixes this by fine-tuning the model on
        a curated dataset of <InlineMath>{"(\\text{instruction},\\, \\text{response})"}</InlineMath>{" "}
        pairs — typically tens to hundreds of thousands of human-written examples
        spanning many tasks. The training objective is unchanged from pretraining
        (cross-entropy on the response tokens), but the format teaches the model
        that the instruction is a request to be fulfilled, not a pattern to extend.
      </p>

      <MathBlock>{"$$\\mathcal{L}_{\\text{SFT}} = -\\mathbb{E}_{(x, y) \\sim \\mathcal{D}_{\\text{SFT}}}\\!\\left[\\sum_t \\log p_\\theta(y_t \\mid x, y_{<t})\\right]$$"}</MathBlock>

      <p style={prose}>
        Hand-writing instruction–response pairs is expensive — labelers cost time
        and don't scale. Wang, Kordi, Mishra, Liu, Smith, Khashabi &amp; Hajishirzi
        (2023) [4] showed that a base LM could <em>generate its own</em> instruction
        tuning data: seed the model with a small handful of human-written examples,
        prompt it to produce more, filter for quality, and use the result as
        training data. The Stanford Alpaca model was famously SFT-trained on roughly
        52K Self-Instruct examples generated by GPT-3.5, and matched far more
        expensive human-annotated alternatives on simple benchmarks. Modern
        instruction datasets increasingly mix human and model-generated examples,
        with care taken to avoid the model-self-distillation failure mode where the
        student inherits the teacher's biases at scale.
      </p>

      <p style={prose}>
        LIMA [6] sharpened a related point. Zhou et al. (2023) fine-tuned LLaMA-65B
        on just 1,000 carefully curated instruction–response pairs and compared to
        the same model fine-tuned on millions. The 1,000-example model was preferred
        to GPT-3.5 in 43% of head-to-head comparisons and to Bard in 58%. The
        interpretation: SFT does not teach new capabilities, it <em>surfaces</em>{" "}
        capabilities already learned during pretraining. A small, high-quality
        dataset is enough to surface them; more data adds diminishing returns and
        can hurt if quality drops. This finding shifted the practical recipe from
        "scrape the largest possible SFT corpus" toward "curate a small clean one."
      </p>

      <BaseVsSFTBehavior />

      <InstructionTuning />

      {/* ── Section 3: Preference Optimization ───────────────────────────── */}
      <div id="preference-optimization">
        <SectionTitle>Preference Optimization — RLHF &amp; DPO</SectionTitle>
      </div>

      <p style={prose}>
        SFT teaches the model what good responses look like, but it cannot easily
        teach the model to prefer one good response over another. Preference
        optimization fills this gap. RLHF trains a reward model from human preference
        comparisons, then uses PPO to optimize the policy against that reward.
        Direct Preference Optimization (DPO) eliminates the reward model entirely
        by reformulating the same objective as a single classification loss over
        preference pairs. DPO is mathematically equivalent to RLHF in the asymptotic
        limit but is far simpler to implement and more stable in practice. Most
        recent open-weight models use DPO or a close variant.
      </p>

      <p style={prose}>
        Ouyang et al. (2022) [1] gave the field its template with InstructGPT, a
        three-stage pipeline that became the de facto standard. <strong>Stage 1</strong>:
        SFT on demonstration data, producing a baseline policy. <strong>Stage 2</strong>:
        collect human preference comparisons over pairs of model outputs and train
        a reward model <InlineMath>{"r_\\phi(x, y)"}</InlineMath> to predict which
        output is preferred. <strong>Stage 3</strong>: optimize the policy{" "}
        <InlineMath>{"\\pi_\\theta"}</InlineMath> against this reward model using
        PPO, with a KL penalty against the SFT policy to prevent reward hacking.
        Without the KL term, the policy quickly finds outputs that fool the reward
        model into giving high scores while drifting away from sensible behavior —
        a classic Goodhart phenomenon. PPO is notoriously fiddly: small
        implementation differences produce dramatic outcomes, hyperparameters need
        careful tuning, and the loop is expensive because every training step
        requires generating samples on-policy.
      </p>

      <p style={prose}>
        Rafailov, Sharma, Mitchell, Ermon, Manning &amp; Finn (2023) [2] noticed
        that under the KL-regularized RLHF objective, the optimal policy has a
        closed-form relationship to the reference policy and reward function:{" "}
        <InlineMath>{"\\pi^*(y \\mid x) \\propto \\pi_{\\text{ref}}(y \\mid x) \\exp(r(x, y) / \\beta)"}</InlineMath>.
        Inverting this expression gives the reward in terms of the policy log-ratios,
        eliminating the explicit reward model entirely. The resulting DPO loss is a
        single binary cross-entropy over preference pairs — no RL loop, no separate
        reward model, no on-policy sampling. In the asymptotic limit DPO is
        mathematically equivalent to RLHF; in practice it is dramatically simpler
        and more stable, and has become the default for open-weight model
        post-training. Several variants now exist — IPO (Identity PO), KTO
        (Kahneman–Tversky), ORPO, SimPO — each tuning the loss form for different
        stability or data-efficiency properties.
      </p>

      <MathBlock>{`$$\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E}_{(x, y_w, y_l) \\sim \\mathcal{D}}\\!\\left[\\log \\sigma\\!\\left(\\beta \\log \\frac{\\pi_\\theta(y_w \\mid x)}{\\pi_{\\text{ref}}(y_w \\mid x)} - \\beta \\log \\frac{\\pi_\\theta(y_l \\mid x)}{\\pi_{\\text{ref}}(y_l \\mid x)}\\right)\\right]$$`}</MathBlock>

      <RLHFThreeStep />

      <DPOvsRLHF />

      {/* ── Section 4: Constitutional AI ──────────────────────────────────── */}
      <div id="constitutional-ai">
        <SectionTitle>Constitutional AI</SectionTitle>
      </div>

      <p style={prose}>
        Constitutional AI replaces human preference labels with AI-generated
        critiques against a written constitution — a set of principles describing
        desired model behavior. The model produces a response, critiques its own
        output against each principle, revises the response, and this revision
        becomes a training example. RLAIF — Reinforcement Learning from AI Feedback —
        then uses these AI-generated preferences in place of human ones. The
        approach scales to volumes that human annotation cannot match and produces
        behavior that is more consistent because the principles are explicit rather
        than implicit in the labelers' judgment. Anthropic developed this approach
        for the Claude model family.
      </p>

      <p style={prose}>
        Bai et al. (2022) [3] introduced the technique with two phases.{" "}
        <strong>SL-CAI (supervised)</strong>: the model produces a response to a
        prompt, then is prompted to critique that response against a written
        principle ("Identify ways the response could be harmful, unethical…"), then
        is prompted to revise the response in light of the critique. The (prompt,
        revised response) pair becomes a training example. <strong>RL-CAI
        (reinforcement)</strong>: a separate model labels preferences over pairs of
        responses according to the same principles — Reinforcement Learning from AI
        Feedback (RLAIF) — and a policy is trained against these AI-generated
        preferences, structurally similar to RLHF but with the labeler replaced by
        the constitutional model.
      </p>

      <p style={prose}>
        The original CAI constitution drew from sources including the UN Universal
        Declaration of Human Rights, Apple's terms of service, and Anthropic's own
        internal research on what makes responses helpful and harmless. Principles
        are written in natural language — for example,{" "}
        <em>"Choose the response that is most respectful of the user's right to
        privacy"</em> — and the model evaluates against them at training time.
        Compared to RLHF, the visible advantage is transparency: the model's training
        objective is a written document anyone can read and critique. The visible
        disadvantage is that the model's behavior depends on the model's <em>own</em>{" "}
        judgment of what each principle means, which can drift. Anthropic and other
        groups have continued to refine the approach, including more recent work on
        Collective Constitutional AI, which sources principles from broader public
        deliberation rather than a single team.
      </p>

      <ConstitutionalAILoop />

      <ConstitutionalAI />

      {/* ── Section 5: Tool Calling ───────────────────────────────────────── */}
      <div id="tool-calling">
        <SectionTitle>Tool Calling as a Trained Capability</SectionTitle>
      </div>

      <p style={prose}>
        A model can be taught to emit structured function calls as part of its
        output. During tool-calling training, the model is given conversations
        where the assistant turn includes a special token sequence — typically
        JSON wrapped in delimiter tokens — that instructs the runtime to execute
        a function with specific arguments. The function result is then inserted
        into the next user turn as an observation, and training continues. After
        sufficient training data, the model reliably distinguishes between
        situations that call for a direct response and situations that require
        calling an external tool. Tool calling is not architectural — any
        transformer can do it once trained.
      </p>

      <p style={prose}>
        Schick, Dwivedi-Yu, Dessì, Raileanu, Lomeli, Zettlemoyer, Cancedda &amp;
        Scialom (2023) [5] introduced one of the cleanest formulations: a language
        model can teach itself to use tools by self-supervised generation. Given a
        text corpus, the model proposes candidate tool calls (calculator, calendar
        lookup, translation API, and so on) at each position, executes them, and
        keeps only those whose result <em>reduces the perplexity of completing the
        surrounding text</em>. The filtered tool-call-augmented corpus becomes the
        training set. The technique works because the supervision signal — "did
        inserting this tool call make the next tokens more predictable?" — is fully
        automatic.
      </p>

      <p style={prose}>
        Frontier models in 2024–2026 have moved well beyond single tool calls. The
        training data now includes multi-turn interactions where the assistant
        calls a tool, observes the result, decides what to call next, observes that
        result, and so on across many steps — an entire agentic trajectory. The
        model learns when to plan, when to execute, when to recover from a failed
        call, and when to stop. The structured-output format (JSON in delimited
        blocks, or function-call syntax inline) is consistent across providers, but
        the depth and reliability of multi-step tool use is one of the main
        capability axes that distinguishes 2024-class models from 2022-class ones.
        Tool calling has stopped being a special trick and become a first-class
        capability.
      </p>

      <ToolCallExchange />

      <ToolCallingTraining />

      {/* ── Section 6: Safety & Refusal ───────────────────────────────────── */}
      <div id="safety-and-refusal">
        <SectionTitle>Safety &amp; Refusal Training</SectionTitle>
      </div>

      <p style={prose}>
        Safety training teaches the model when to decline a request. The training
        data consists of pairs where the prompt is harmful or out-of-policy and
        the response is a graceful refusal explaining why. The challenge is
        calibration: a model that refuses too aggressively becomes unhelpful, while
        a model that refuses too leniently becomes unsafe. The goal is a sharp,
        well-placed decision boundary — declining unambiguous harms while remaining
        helpful on legitimate requests that superficially resemble harmful ones.
        Jailbreak resistance — robustness to adversarial prompts that try to elicit
        forbidden behavior — is a separate axis of safety training, addressed through
        red-teaming and contrastive examples.
      </p>

      <p style={prose}>
        Concretely, a perfectly safe model that refused every request would be
        useless, and a perfectly helpful model that complied with every request
        would be dangerous. Real systems live on a Pareto frontier between these
        failure modes. The frontier is shaped by training data: refusal examples
        teach the model where to decline; helpful examples on superficially-risky
        topics (chemistry, security research, medical questions) teach the model
        where the line is not. Most observed quality regressions in safety releases
        come from training-data imbalance — a few too many over-broad refusal
        examples and the model starts refusing legitimate questions about
        pharmacology or self-defense; a few too many "always be helpful" examples
        and the model loses calibration on actual harm. Both failure modes are
        constantly monitored in practice.
      </p>

      <p style={prose}>
        Perez, Huang, Song, Cai, Ring, Aslanides, Glaese, McAleese &amp; Irving
        (2022) [8] demonstrated that language models themselves can be used to
        systematically find failure modes in other language models — automated red
        teaming. The technique scales beyond what manual red teamers can probe:
        prompt one LM to generate test cases targeting a behavior class ("get the
        target model to produce code for a SQL injection"), evaluate the target
        model's responses, and use the failures as training signal for the next
        round. Beyond automated red teaming, modern adversarial pressure includes{" "}
        <strong>prompt-injection attacks</strong> (embedding instructions in
        retrieved documents), <strong>adversarial suffixes</strong> (Zou et al.
        2023's GCG, which produces token sequences that reliably bypass safety
        training), and <strong>persuasion-based jailbreaks</strong> (multi-turn
        social-engineering of the model). No current model is fully robust to all
        of these; safety training is best understood as defense-in-depth alongside
        system-level mitigations, not as a single trained-in invariant.
      </p>

      <SafetyBoundary />

      <SafetyRefusal />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
