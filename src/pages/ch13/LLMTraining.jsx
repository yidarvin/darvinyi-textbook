import { useTocSections } from "../../components/layout/TocContext";
import { buildCitations } from "../../data/citations";
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
import TestTimeComputeAxes from "../../components/diagrams/ch13/TestTimeComputeAxes";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = buildCitations([
  "instructgpt",
  "dpo",
  "constitutional-ai",
  { title: "Self-Instruct: Aligning Language Models with Self-Generated Instructions", authors: "Wang, Kordi, Mishra, Liu, Smith, Khashabi, Hajishirzi", venue: "ACL", year: "2023", tag: "paper" },
  "toolformer",
  { title: "LIMA: Less Is More for Alignment", authors: "Zhou, Liu, Xu, Iyer, Sun, Mao, Ma, Efrat, Yu, Yu, Zhang, Ghosh, Lewis, Zettlemoyer, Levy", venue: "NeurIPS", year: "2023", tag: "paper" },
  "llama2",
  { title: "Red Teaming Language Models with Language Models", authors: "Perez, Huang, Song, Cai, Ring, Aslanides, Glaese, McAleese, Irving", venue: "EMNLP", year: "2022", tag: "paper" },
  { title: "Learning to Reason with LLMs", authors: "OpenAI", venue: "OpenAI Blog", year: "2024", tag: "paper" },
  "deepseek-r1",
  "deepseekmath",
  { title: "Universal and Transferable Adversarial Attacks on Aligned Language Models", authors: "Zou, Wang, Kolter, Fredrikson", venue: "arXiv", year: "2023", tag: "paper" },
  { title: "Self-Consistency Improves Chain of Thought Reasoning in Language Models", authors: "Wang, Wei, Schuurmans, Le, Chi, Narang, Chowdhery, Zhou", venue: "ICLR", year: "2023", tag: "paper" },
  { title: "Alpaca: A Strong, Replicable Instruction-Following Model", authors: "Taori, Gulrajani, Zhang, Dubois, Li, Guestrin, Liang, Hashimoto", venue: "Stanford CRFM", year: "2023", tag: "paper" },
  { title: "A General Theoretical Paradigm to Understand Learning from Human Preferences (IPO)", authors: "Azar, Rowland, Piot, Guo, Calandriello, Valko, Munos", venue: "AISTATS", year: "2024", tag: "paper" },
  { title: "KTO: Model Alignment as Prospect Theoretic Optimization", authors: "Ethayarajh, Xu, Muennighoff, Jurafsky, Kiela", venue: "arXiv", year: "2024", tag: "paper" },
  { title: "ORPO: Monolithic Preference Optimization without Reference Model", authors: "Hong, Lee, Thorne", venue: "EMNLP", year: "2024", tag: "paper" },
  { title: "SimPO: Simple Preference Optimization with a Reference-Free Reward", authors: "Meng, Xia, Chen", venue: "NeurIPS", year: "2024", tag: "paper" },
  { title: "Collective Constitutional AI: Aligning a Language Model with Public Input", authors: "Huang, Siddarth, Lovitt, Liao, Durmus, Tamkin, Ganguli", venue: "FAccT", year: "2024", tag: "paper" },
  { title: "Let's Verify Step by Step", authors: "Lightman, Kosaraju, Burda, Edwards, Baker, Lee, Leike, Schulman, Sutskever, Cobbe", venue: "arXiv", year: "2023", tag: "paper" },
]);

const TOC_SECTIONS = [
  { id: "the-training-pipeline",  label: "Training Pipeline" },
  { id: "instruction-tuning",     label: "Instruction Tuning" },
  { id: "preference-optimization", label: "Preference Optimization" },
  { id: "constitutional-ai",      label: "Constitutional AI" },
  { id: "tool-calling",           label: "Tool Calling" },
  { id: "safety-and-refusal",     label: "Safety & Refusal" },
  { id: "reasoning-and-test-time-compute", label: "Reasoning Models & Test-Time Compute" },
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
        Every subsequent stage is comparatively cheap. Llama 2 70B [7] is a useful
        public reference point: roughly <InlineMath>{"1.7 \\times 10^6"}</InlineMath>{" "}
        GPU-hours on pretraining versus a small fraction of that on instruction
        tuning and RLHF combined. The implication is structural — most of the
        model's capability comes from pretraining, while post-training mostly shapes{" "}
        <em>how</em> the model expresses that capability. SFT cannot install a
        capability the model doesn't already have; it can only redirect what's
        already there.
      </p>

      <p style={prose}>
        Each post-training stage applies a narrower objective to a more capable model,
        and the narrowing has a cost. Models often score slightly worse on raw
        benchmarks — perplexity (how surprised the model is by the next token,
        lower is better) on held-out text, completion accuracy on open-ended
        generation — after alignment than before. This gap is sometimes called the{" "}
        <em>alignment tax</em>. Part of it is inherent (a model that refuses some
        requests is less useful for those specific requests) and part is an artifact
        of imperfect training signals (preference data and constitutional principles
        can over-fit to surface patterns). Modern recipes work hard to minimize the
        tax through better data quality, KL-regularization against the pretrained
        policy, and capability-preserving fine-tuning, but some tax remains.
      </p>

      <p style={prose}>
        Switch the widget below to the risky prompt and step through all four
        stages; notice that Stage 1 (SFT) already produces working exploit code
        and Stage 2 (preference tuning) only adds a disclaimer on top of it — the
        harmful content itself is removed only at Stage 3, safety training.
      </p>

      <TrainingPipeline
        tryThis={{
          do: "Switch to the Risky request tab, then click Advance stage through all four stages.",
          notice: "the response only turns into an outright refusal at Stage 3 — Stage 1 already produces working exploit code and Stage 2 merely adds a disclaimer on top of it; only safety training removes the harmful content.",
        }}
      />

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
        Here <InlineMath>{"x"}</InlineMath> is the instruction and{" "}
        <InlineMath>{"y"}</InlineMath> the demonstrated response, drawn together
        from the SFT dataset <InlineMath>{"\\mathcal{D}_{\\text{SFT}}"}</InlineMath>;{" "}
        <InlineMath>{"p_\\theta"}</InlineMath> is the model's own next-token
        distribution, and <InlineMath>{"y_t"}</InlineMath> conditioned on{" "}
        <InlineMath>{"y_{<t}"}</InlineMath> means each response token is predicted
        from the instruction and every response token generated so far. It is the
        same next-token cross-entropy pretraining uses, just restricted to
        response tokens and conditioned on the instruction.
      </p>

      <p style={prose}>
        Hand-writing instruction–response pairs is expensive — labelers cost time
        and don't scale. Wang et al. (2023) [4] showed that a base LM could{" "}
        <em>generate its own</em> instruction
        tuning data: seed the model with a small handful of human-written examples,
        prompt it to produce more, filter for quality, and use the result as
        training data. The Stanford Alpaca model [14] was famously SFT-trained on
        roughly 52K Self-Instruct examples generated by GPT-3.5, and matched far more
        expensive human-annotated alternatives on simple benchmarks. Modern
        instruction datasets increasingly mix human and model-generated examples,
        with care taken to avoid the model-self-distillation failure mode where the
        student inherits the teacher's biases at scale.
      </p>

      <p style={prose}>
        LIMA [6] sharpened a related point. Zhou et al. (2023) fine-tuned LLaMA-65B
        on just 1,000 carefully curated instruction–response pairs and compared to
        the same model fine-tuned on millions. The 1,000-example model was rated
        equivalent to or preferred over GPT-4 in 43% of head-to-head comparisons,
        and equivalent to or preferred over Bard in 58%. The
        interpretation: SFT does not teach new capabilities, it <em>surfaces</em>{" "}
        capabilities already learned during pretraining. A small, high-quality
        dataset is enough to surface them; more data adds diminishing returns and
        can hurt if quality drops. This finding shifted the practical recipe from
        "scrape the largest possible SFT corpus" toward "curate a small clean one."
      </p>

      <p style={prose}>
        The diagram below puts a base model and its SFT counterpart side by
        side on the same prompt, making concrete what "surfacing" a capability
        rather than adding one looks like.
      </p>

      <BaseVsSFTBehavior />

      <p style={prose}>
        Switch between the four presets in the widget below and hover over
        individual tokens in the stream; notice that only response tokens carry
        an <InlineMath>{"L"}</InlineMath> (loss) badge, while user tokens and the
        delimiter tokens both carry an <InlineMath>{"M"}</InlineMath> (masked)
        badge — delimiters are masked just like user tokens, so only response
        tokens contribute to <InlineMath>{"\\mathcal{L}_{\\text{SFT}}"}</InlineMath>.
      </p>

      <InstructionTuning
        tryThis={{
          do: "Switch between the four presets and hover over individual tokens in the stream.",
          notice: "user and delimiter tokens both carry an M (masked, zero loss) badge, and only response tokens carry an L (loss) badge — user, delimiter, and masked tokens alike contribute nothing to the loss, and the bar chart height for each token reflects only those unmasked response-token losses.",
        }}
      />

      {/* ── Section 3: Preference Optimization ───────────────────────────── */}
      <div id="preference-optimization">
        <SectionTitle>Preference Optimization — RLHF &amp; DPO</SectionTitle>
      </div>

      <p style={prose}>
        SFT teaches the model what good responses look like, but it cannot easily
        teach the model to prefer one good response over another. Preference
        optimization fills this gap. RLHF trains a reward model from human preference
        comparisons, then uses PPO (Proximal Policy Optimization — Chapter 12 derives
        it in full) to optimize the policy against that reward.
        Direct Preference Optimization (DPO) eliminates the reward model entirely
        by reformulating the same objective as a single classification loss over
        preference pairs. DPO is mathematically equivalent to RLHF in the asymptotic
        limit but is far simpler to implement and more stable in practice. DPO or a
        close variant is the standard choice for general-purpose preference tuning
        in open-weight models — matching human taste on writing, dialogue, and
        open-ended requests.
      </p>

      <p style={prose}>
        Ouyang et al. (2022) [1] gave the field its template with InstructGPT, a
        three-stage pipeline that became the de facto standard. <strong>Stage 1</strong>:
        SFT on demonstration data, producing a baseline policy. <strong>Stage 2</strong>:
        collect human preference comparisons over pairs of model outputs and train
        a reward model <InlineMath>{"r_\\phi(x, y)"}</InlineMath> to predict which
        output is preferred, fit with the pairwise loss below. <strong>Stage 3</strong>:
        optimize the policy <InlineMath>{"\\pi_\\theta"}</InlineMath> against this
        reward model using PPO, with a KL penalty — the same KL divergence Chapter 1
        defines — against the SFT policy to
        prevent reward hacking. Chapter 12 derives why that KL term is what keeps the policy from
        exploiting the reward model — the reward-hacking failure mode — and why
        PPO's hyperparameters are famously fiddly to tune; here it is enough to
        know the pipeline runs SFT → reward model → PPO-against-that-model-plus-KL-penalty.
      </p>

      <MathBlock>{"$$\\mathcal{L}_{\\text{RM}}(\\phi) = -\\mathbb{E}_{(x, y_w, y_l) \\sim \\mathcal{D}}\\!\\left[\\log \\sigma\\bigl(r_\\phi(x, y_w) - r_\\phi(x, y_l)\\bigr)\\right]$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"y_w"}</InlineMath> and <InlineMath>{"y_l"}</InlineMath>{" "}
        are the preferred ("win") and dispreferred ("lose") completions in a
        human comparison and <InlineMath>{"\\sigma"}</InlineMath> is the logistic
        function; the reward model is trained so it scores the human-preferred
        response higher than the rejected one, following the Bradley-Terry
        pairwise-comparison model.
      </p>

      <p style={prose}>
        Rafailov et al. (2023) [2] noticed
        that under the KL-regularized RLHF objective, the optimal policy has a
        closed-form relationship to the reference policy and reward function:{" "}
        <InlineMath>{"\\pi^*(y \\mid x) \\propto \\pi_{\\text{ref}}(y \\mid x) \\exp(r(x, y) / \\beta)"}</InlineMath>.
        Inverting this expression gives the reward in terms of the policy log-ratios,
        eliminating the explicit reward model entirely. The resulting DPO loss is a
        single binary cross-entropy over preference pairs — no RL loop, no separate
        reward model, no on-policy sampling. In the asymptotic limit DPO is
        mathematically equivalent to RLHF; in practice it is dramatically simpler
        and more stable, and became the default for open-weight preference tuning
        through 2024. Several variants now exist — IPO (Identity PO) [15], KTO
        (Kahneman–Tversky) [16], ORPO [17], SimPO [18] — each tuning the loss form
        for different stability or data-efficiency properties. DPO remains the standard for
        general-purpose alignment, but it is not how the frontier reasoning models
        train: <em>Reasoning Models &amp; Test-Time Compute</em> below covers the
        RL-based alternative — training against verifiable rewards rather than
        preference pairs — that has taken over for math- and code-heavy
        post-training since.
      </p>

      <MathBlock>{`$$\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E}_{(x, y_w, y_l) \\sim \\mathcal{D}}\\!\\left[\\log \\sigma\\!\\left(\\beta \\log \\frac{\\pi_\\theta(y_w \\mid x)}{\\pi_{\\text{ref}}(y_w \\mid x)} - \\beta \\log \\frac{\\pi_\\theta(y_l \\mid x)}{\\pi_{\\text{ref}}(y_l \\mid x)}\\right)\\right]$$`}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"\\beta"}</InlineMath> is a temperature-like scale on
        the preference margin and <InlineMath>{"\\pi_{\\text{ref}}"}</InlineMath>{" "}
        is the frozen SFT policy; the loss pushes the policy's log-probability
        ratio for the chosen response above that for the rejected one, with no
        reward model and no sampling required.
      </p>

      <p style={prose}>
        The diagram below lays out InstructGPT's three-stage pipeline end to
        end, from the SFT baseline through reward-model training to the PPO
        loop that optimizes against it.
      </p>

      <RLHFThreeStep />

      <p style={prose}>
        Click through Steps 1–3 in the widget below on the same preference
        pair, then enable "Show RLHF expansion" once you reach Step 3; notice
        how many extra moving parts RLHF needs for an objective the DPO loss
        reaches in one supervised step.
      </p>

      <DPOvsRLHF
        tryThis={{
          do: "Click through Steps 1-3 in the walkthrough, then enable 'Show RLHF expansion' at Step 3.",
          notice: "the same preference pair that DPO turns into a single loss value (0.594) requires RLHF to train a separate reward model, sample fresh rollouts, and run a KL-constrained PPO update — several extra moving parts for an asymptotically equivalent objective.",
        }}
      />

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
        Collective Constitutional AI [19], which sources principles from broader
        public deliberation rather than a single team.
      </p>

      <p style={prose}>
        The loop below traces both phases end to end: SL-CAI's critique-and-revise
        cycle producing training data, then RL-CAI's AI-labeled preference
        comparisons feeding a policy update.
      </p>

      <ConstitutionalAILoop />

      <p style={prose}>
        Run the Constitutional Loop on the medical-question preset below, then
        hover the failed principle cells; notice that four principles fail —
        unsafe confidence, overstated certainty, no uncertainty caveat, no
        medical caveat — while only the tone principle passes, and that the
        revised response in phase 3 adds exactly those missing caveats instead
        of relying on a human preference label.
      </p>

      <ConstitutionalAI
        tryThis={{
          do: "Click 'Run Constitutional Loop' on the Medical question preset, then hover the red failed principle cells.",
          notice: "four principles fail (unsafe helpfulness, overstated certainty, no uncertainty caveat, no medical caveat) while only the tone principle passes — the revised response in phase 3 adds exactly the missing caveats and a doctor referral, becoming the training example instead of a human label.",
        }}
      />

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
        Schick et al. (2023) [5] introduced one of the cleanest formulations: a
        language model can teach itself to use tools by self-supervised generation.
        Given a
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

      <p style={prose}>
        The exchange below traces one such call end to end: the assistant
        emits a delimited call, the runtime executes it and injects the
        result, and the assistant's final turn consumes that result.
      </p>

      <ToolCallExchange />

      <p style={prose}>
        Switch to the Math preset in the widget below and toggle "Show loss
        badges"; notice that the tool-result JSON carries an{" "}
        <InlineMath>{"M"}</InlineMath> (masked) badge — the model is not
        trained to predict tool output verbatim — while the tool-call JSON
        and the final response both carry an <InlineMath>{"L"}</InlineMath>{" "}
        (loss) badge.
      </p>

      <ToolCallingTraining
        tryThis={{
          do: "Switch to the Math preset and toggle 'Show loss badges'.",
          notice: "the tool_result chunks between the call and the final response carry an M (masked) badge — the model isn't trained to predict tool output verbatim, only to emit the call and use the result — while the tool-call JSON and final response both carry L badges.",
        }}
      />

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
        Perez et al. (2022) [8] demonstrated that language models themselves can
        be used to systematically find failure modes in other language models —
        automated red teaming. The technique scales beyond what manual red
        teamers can probe: prompt one LM to generate test cases targeting a
        behavior class ("get the target model to produce code for a SQL
        injection"), evaluate the target model's responses, and use the
        failures as training signal for the next round. Beyond automated red
        teaming, modern adversarial pressure includes{" "}
        <strong>prompt-injection attacks</strong> (embedding instructions in
        retrieved documents), <strong>adversarial suffixes</strong> (the GCG
        attack, Zou et al. (2023) [12], which produces token sequences that
        reliably bypass safety training), and{" "}
        <strong>persuasion-based jailbreaks</strong>{" "}
        (multi-turn social-engineering of the model). No current model is fully
        robust to all of these; safety training is best understood as
        defense-in-depth alongside system-level mitigations, not as a single
        trained-in invariant.
      </p>

      <p style={prose}>
        The boundary below makes that trade-off spatial: each request sits at
        a point in harm-versus-helpfulness space, and safety training's job is
        choosing where to draw the line between them.
      </p>

      <SafetyBoundary />

      <p style={prose}>
        Drag the threshold line in the widget below from its default of 5.0
        down below 2 (to around 1.9); notice the regime label flips to
        "Over-aggressive" and the false-refusal count climbs as legitimate but
        harm-adjacent requests — explaining how antidepressants work,
        describing nuclear reactors — get swept into the refuse region.
      </p>

      <SafetyRefusal
        tryThis={{
          do: "Drag the threshold line from the default 5.0 down below 2 (to around 1.9).",
          notice: "the regime label flips to 'Over-aggressive' and the false-refusal count climbs in the confusion matrix — legitimate requests that merely mention a harm-adjacent topic (antidepressants, nuclear reactors) get swept into the refuse region even though their ground-truth label is 'help'.",
        }}
      />

      {/* ── Section 7: Reasoning Models & Test-Time Compute ──────────────────── */}
      <div id="reasoning-and-test-time-compute">
        <SectionTitle>Reasoning Models &amp; Test-Time Compute</SectionTitle>
      </div>

      <p style={prose}>
        Every alignment method covered so far treats inference as fixed: the
        model trains once, over a long stretch of compute, and then generates
        a single pass of output tokens per response. OpenAI's o1 [9] broke that
        assumption by training a model to spend a variable, self-chosen amount
        of computation on a hidden chain of thought before answering — trading
        inference-time computation for accuracy, the way a person might think
        longer about a hard problem before speaking. The training signal that
        makes this trade pay off is the RLVR (RL from Verifiable Rewards)
        distinction Chapter 12 introduces: reward the model with an
        automatically checkable outcome — a math answer, a passing test suite —
        rather than a human preference label.
      </p>

      <p style={prose}>
        Chapter 12 formalizes RLVR as part of a broader taxonomy and derives the
        PPO and GRPO (Group Relative Policy Optimization) machinery it optimizes
        against; the summary that matters
        here is why the reward source changes what long training runs can
        produce. RLHF's reward comes from a learned model trained on human
        preference comparisons — a proxy that can be gamed, since running PPO
        against it for too many steps lets the policy find outputs that score
        well under the reward model without being genuinely better, the
        reward-hacking failure Chapter 12 names directly. RLVR's reward comes
        from a deterministic checker with no learned component in the loop: a
        correct proof is correct no matter how the policy phrases it, so there
        is no learned reward <em>model</em> for the policy to exploit the way it
        can exploit PPO's learned reward model — the checker itself can't be
        fooled into scoring a wrong answer as right. That removes one entire
        failure mode from long training runs, and it is exactly that extended
        optimization — thousands of RL steps against a reward that cannot be
        talked into misjudging correctness — that produces long chains of
        thought as a side effect, not a designed-in feature. It does not
        remove every failure mode: a policy can still satisfy the literal
        correctness check while drifting on properties the checker never
        looks at, like readability or which language it answers in — precisely
        the specification-gaming Chapter 12 documents in R1-Zero. Verifiable
        rewards close off the learned-proxy exploit; they don't guarantee the
        checker asked for everything you actually wanted.
      </p>

      <p style={prose}>
        Chapter 12 traces DeepSeek-R1 and R1-Zero's [10] training pipelines
        move for move — R1-Zero's pure-RL run with no supervised cold start,
        and R1's multi-stage recipe that fixed R1-Zero's readability problems.
        The behavioral pattern that recipe produces is the point here: response
        length grows steadily over the course of RL training without ever being
        directly rewarded for length, and the model spontaneously exhibits
        behaviors nobody wrote training data for — re-deriving an intermediate
        result a second way to check it, noticing a contradiction mid-derivation
        and backtracking, spending visibly more tokens on problems it "finds"
        harder. DeepSeek's paper calls the point where backtracking first
        appears during training an "aha moment." OpenAI reports the same
        qualitative pattern independently for o1, and deliberately hides the raw
        reasoning trace from the end user — the product surfaces a summary, not
        the verbatim chain of thought — while still metering and billing for the
        hidden "reasoning tokens" the model consumes to produce it.
      </p>

      <p style={prose}>
        R1's paper reports a further finding worth flagging: distilling R1's
        long chain-of-thought outputs into smaller base models (Qwen, Llama
        checkpoints) via plain SFT outperformed running the same RL recipe
        directly on those smaller models [10] — the reasoning behavior
        transfers through imitation more reliably than a small model can
        discover it on its own through RL.
      </p>

      <p style={prose}>
        Pretraining scale has historically had two knobs: model size (parameter
        count) and training data (token count), traded off against a fixed
        compute budget. Long-CoT RL training adds a third — inference-time, or{" "}
        <em>test-time</em>, compute: how many tokens the model spends reasoning,
        or how many independent attempts it samples, before committing to an
        answer. OpenAI's o1 report shows accuracy on reasoning benchmarks
        improving roughly log-linearly along both axes independently: more RL
        training compute helps, and, separately, letting a fixed model think
        longer at inference helps on its own, with no further training at all.
        The practical consequence is a lever product teams can pull per query —
        a routine request gets a short reasoning trace and a cheap, fast answer,
        while a hard request gets a long one, the same weights spending a
        different inference-time compute budget at the cost of higher per-query
        latency rather than a one-time training cost.
      </p>

      <p style={prose}>
        The diagram below plots those two axes independently — train-time
        compute and test-time compute both driving accuracy up on their own,
        with neither one substituting for the other.
      </p>

      <TestTimeComputeAxes />

      <p style={prose}>
        Longer reasoning traces are one way to spend test-time compute; sampling
        many independent attempts and combining them is another. The simplest
        version, self-consistency [13], draws several reasoning traces from the
        same policy for the same prompt and keeps the answer the majority agree on.
      </p>

      <MathBlock>{"$$\\hat{y} = \\text{mode}\\bigl\\{y^{(1)}, y^{(2)}, \\dots, y^{(N)}\\bigr\\}, \\qquad y^{(i)} \\sim \\pi_\\theta(\\cdot \\mid x) \\ \\text{independently}$$"}</MathBlock>

      <p style={prose}>
        Here <InlineMath>{"y^{(i)}"}</InlineMath> is the{" "}
        <InlineMath>{"i"}</InlineMath>-th of <InlineMath>{"N"}</InlineMath>{" "}
        reasoning traces sampled independently from the same policy{" "}
        <InlineMath>{"\\pi_\\theta"}</InlineMath> for prompt{" "}
        <InlineMath>{"x"}</InlineMath>, and <InlineMath>{"\\hat{y}"}</InlineMath>{" "}
        is the most common final answer among them. Accuracy climbs smoothly as{" "}
        <InlineMath>{"N"}</InlineMath> grows, because wrong derivations tend to
        disagree with each other while the correct one recurs — and, as with a
        longer single trace, the added compute is spent entirely at inference,
        never during training.
      </p>

      <p style={prose}>
        A third axis skips majority voting for structured search: sample many
        candidate completions or intermediate steps, score each with a separate
        verifier, and keep only the highest-scoring path. Best-of-N reranking
        samples N full completions and keeps the one a reward model scores
        highest; tree- or beam-search variants apply that same scoring
        step-by-step, guided by a process reward model that grades individual
        reasoning steps rather than only the final answer — Lightman et al.
        (2023) [20] showed step-level supervision like this outperforms an
        outcome-only reward model on math benchmarks. The cost is a verifier to
        train and more sampled completions per query, but no additional RL
        training run.
      </p>

      <p style={prose}>
        DeepSeek-R1's RL stage uses GRPO [11] rather than PPO — Chapter 12
        derives the algorithm in full, including its within-group advantage
        normalization and the DAPO and GSPO refinements that followed it.
        Dropping the separate value network cuts GRPO's compute overhead enough
        relative to PPO to make many-thousand-step RL runs on reasoning tasks
        economical, which is part of why long-CoT RL became practical only
        recently rather than in the original 2022 RLHF era.
      </p>

      <p style={prose}>
        <strong>Going deeper: where test-time compute stops helping.</strong>{" "}
        The technique works cleanly where RLVR itself works — domains with a
        cheap, automatic checker. Math and code benchmarks improve smoothly with
        more reasoning tokens or more sampled attempts, particularly when a
        checker or majority vote can select among them. Open-ended tasks without
        a checker — creative writing, subjective judgment calls, most everyday
        chat — have no equivalent "more thinking, more score" training signal,
        so long-CoT RL and its test-time-compute payoff mostly benefit the
        reasoning-heavy slice of real usage rather than the full distribution of
        what these models are asked to do. Whether verifiable-reward training
        generalizes reasoning skill to non-verifiable domains, or stays confined
        to the domains it was trained on, remains an open empirical question.
      </p>

      {/* ── What Carries Forward ─────────────────────────────────────────── */}
      <SectionTitle>What Carries Forward</SectionTitle>

      <p style={prose}>
        The pipeline shape from this chapter — pretraining, then progressively
        narrower objectives layered on the same weights — is the lens for how
        every modern LLM is actually built: SFT to surface capability in the
        right format, preference optimization (RLHF's reward model plus PPO,
        or DPO's reward-free reformulation of the same Bradley-Terry loss) to
        match human taste, and safety training to place a calibrated refusal
        boundary. Constitutional AI's critique-and-revise loop and RLAIF are
        the AI-feedback variant of that same preference-optimization stage,
        and Chapter 12's RLHF/RLVR distinction is what separates it from the
        verifiable-reward recipe — GRPO against a deterministic checker — that
        trains reasoning models like DeepSeek-R1. Whichever reward source is
        used, the KL penalty against the reference policy is what keeps
        optimization from drifting into reward hacking, the throughline
        connecting Chapter 12's derivation to every training stage here.
        Chapter 14 turns to what happens after this pipeline finishes: serving
        the resulting model efficiently at inference time.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
