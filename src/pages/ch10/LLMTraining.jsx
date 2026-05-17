import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import MathBlock from "../../components/shared/MathBlock";
import InstructionTuning from "../../components/widgets/ch10/InstructionTuning";
import TrainingPipeline from "../../components/widgets/ch10/TrainingPipeline";
import ConstitutionalAI from "../../components/widgets/ch10/ConstitutionalAI";
import ToolCallingTraining from "../../components/widgets/ch10/ToolCallingTraining";
import SafetyRefusal from "../../components/widgets/ch10/SafetyRefusal";
import DPOvsRLHF from "../../components/widgets/ch10/DPOvsRLHF";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Training Language Models to Follow Instructions with Human Feedback (InstructGPT)", authors: "Ouyang, Wu, Jiang, Almeida, Wainwright, Mishkin, Zhang, Agarwal, Slama, Ray, Schulman, Hilton, Kelton, Miller, Simens, Askell, Welinder, Christiano, Leike, Lowe", venue: "NeurIPS", year: "2022", tag: "seminal" },
  { num: "[2]", title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model (DPO)", authors: "Rafailov, Sharma, Mitchell, Ermon, Manning, Finn", venue: "NeurIPS", year: "2023", tag: "seminal" },
  { num: "[3]", title: "Constitutional AI: Harmlessness from AI Feedback", authors: "Bai, Jones, Ndousse, Askell, Chen, DasSarma, Drain, Fort, Ganguli, Henighan, Joseph, Kadavath, Kernion, Conerly, El-Showk, Elhage, Hatfield-Dodds, Hernandez, Hume, Johnston, Kravec, Lovitt, Nanda, Olsson, Amodei, Brown, Clark, McCandlish, Olah, Mann, Kaplan", venue: "arXiv", year: "2022", tag: "seminal" },
  { num: "[4]", title: "Self-Instruct: Aligning Language Models with Self-Generated Instructions", authors: "Wang, Kordi, Mishra, Liu, Smith, Khashabi, Hajishirzi", venue: "ACL", year: "2023", tag: "paper" },
  { num: "[5]", title: "Toolformer: Language Models Can Teach Themselves to Use Tools", authors: "Schick, Dwivedi-Yu, Dessì, Raileanu, Lomeli, Zettlemoyer, Cancedda, Scialom", venue: "NeurIPS", year: "2023", tag: "paper" },
  { num: "[6]", title: "LIMA: Less Is More for Alignment", authors: "Zhou, Liu, Xu, Iyer, Du, Zhou, Lu, Wang, Pampari, Manjunatha, Mishra, Wang, Sukhbaatar, Pisarski, Ross, Steel, Auli, Ramanathan, Sharma, Levy, Lewis", venue: "NeurIPS", year: "2023", tag: "paper" },
  { num: "[7]", title: "Llama 2: Open Foundation and Fine-Tuned Chat Models", authors: "Touvron, Martin, Stone, Albert, Almahairi, Babaei, Bashlykov, Batra, Bhargava, Bhosale, Bikel, Blecher, Ferrer, Chen, Cucurull, Esiobu, Fernandes, Fu, Fu, Fuller, Gao, Goswami, Goyal, Hartshorn, Hosseini, Hou, Inan, Kardas, Kerkez, Khabsa, Kloumann, Korenev, Koura, Lachaux, Lavril, Lee, Liskovich, Lu, Mao, Martinet, Mihaylov, Mishra, Molybog, Nie, Poulton, Reizenstein, Rungta, Saladi, Schelten, Silva, Smith, Subramanian, Tan, Tang, Taylor, Williams, Kuan, Xu, Yan, Zarov, Zhang, Fan, Kambadur, Narang, Rodriguez, Stojnic, Edunov, Scialom", venue: "arXiv", year: "2023", tag: "paper" },
  { num: "[8]", title: "Red Teaming Language Models with Language Models", authors: "Perez, Huang, Song, Cai, Ring, Aslanides, Glaese, McAleese, Irving", venue: "EMNLP", year: "2022", tag: "paper" },
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
        Chapter 10 · Part III — Large Language Models
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
        a curated dataset of (instruction, response) pairs — typically tens to
        hundreds of thousands of human-written examples spanning many tasks.
        The training objective is unchanged from pretraining (cross-entropy on
        the response tokens), but the format teaches the model that the instruction
        is a request to be fulfilled, not a pattern to extend.
      </p>

      <MathBlock>{`L_SFT = -E_{(x, y) ~ D_SFT} [ sum_t log p_theta(y_t | x, y_<t) ]`}</MathBlock>

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

      <MathBlock>{`L_DPO = -E [ log sigma( beta * log(pi_theta(y_w|x)/pi_ref(y_w|x))
                       - beta * log(pi_theta(y_l|x)/pi_ref(y_l|x)) ) ]`}</MathBlock>

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

      <SafetyRefusal />

      {/* ── Citations ─────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
