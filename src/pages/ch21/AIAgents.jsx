import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import ReActLoop from "../../components/widgets/ch21/ReActLoop";
import ToolUseFlow from "../../components/widgets/ch21/ToolUseFlow";
import MemoryArchitecture from "../../components/widgets/ch21/MemoryArchitecture";
import MultiAgent from "../../components/widgets/ch21/MultiAgent";
import FailureModes from "../../components/widgets/ch21/FailureModes";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "ReAct: Synergizing Reasoning and Acting in Language Models", authors: "Yao, Zhao, Yu, Du, Shafran, Narasimhan, Cao", venue: "ICLR", year: "2023", tag: "seminal" },
  { num: "[2]", title: "Toolformer: Language Models Can Teach Themselves to Use Tools", authors: "Schick, Dwivedi-Yu, Dessi, Raileanu, Lomeli, Zettlemoyer, Cancedda, Scialom", venue: "NeurIPS", year: "2023", tag: "paper" },
  { num: "[3]", title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models", authors: "Wei, Wang, Schuurmans, Bosma, Ichter, Xia, Chi, Le, Zhou", venue: "NeurIPS", year: "2022", tag: "seminal" },
  { num: "[4]", title: "Generative Agents: Interactive Simulacra of Human Behavior", authors: "Park, O'Brien, Cai, Morris, Liang, Bernstein", venue: "UIST", year: "2023", tag: "paper" },
  { num: "[5]", title: "AutoGPT: An Autonomous GPT-4 Experiment", authors: "Significant Gravitas", venue: "GitHub", year: "2023", tag: "paper" },
  { num: "[6]", title: "LangChain: Building Applications with LLMs through Composability", authors: "Chase", venue: "GitHub", year: "2022", tag: "paper" },
  { num: "[7]", title: "Constitutional AI: Harmlessness from AI Feedback", authors: "Bai, Jones, Ndousse, Askell, Chen, DasSarma, Drain, Fort, Ganguli, Henighan, Joseph, Kadavath, Kernion, Conerly, El-Showk, Elhage, Hatfield-Dodds, Hernandez, Hume, Johnston, Kravec, Lovitt, Nanda, Olsson, Amodei, Brown, Clark, McCandlish, Olah, Mann, Kaplan", venue: "arXiv", year: "2022", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "react-reasoning-and-acting",    label: "ReAct" },
  { id: "tool-use-and-function-calling", label: "Tool Use" },
  { id: "memory-architecture",           label: "Memory" },
  { id: "multi-agent-systems",           label: "Multi-Agent" },
  { id: "failure-modes-and-reliability", label: "Failure Modes" },
];

export default function AIAgents() {
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
        Chapter 21 · Part VII — AI Agents
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
        AI Agents
      </h1>

      <ChapterLede>
        A language model that generates text is a tool. A language model that can
        observe an environment, decide on actions, use external tools, and persist
        state across many steps is an agent. The gap between these two is not just
        architectural — it is a difference in what the system can do in the world.
        Agents fail in ways that language models do not: they can take irreversible
        actions, accumulate errors across long horizons, and make confident mistakes
        that compound. Understanding how they work is inseparable from understanding
        how they break.
      </ChapterLede>

      {/* ── Section 1: ReAct — Reasoning and Acting ──────────────────────────── */}
      <div id="react-reasoning-and-acting">
        <SectionTitle>ReAct — Reasoning and Acting</SectionTitle>
      </div>

      <p style={prose}>
        The ReAct framework interleaves reasoning traces with external actions.
        At each step the model generates a thought (explicit chain-of-thought
        reasoning about what to do next), an action (a structured call to a tool
        or the environment), and then observes the result. This cycle repeats
        until the task is complete. The key insight is that separating reasoning
        from acting — making the internal monologue explicit — dramatically improves
        reliability on multi-step tasks compared to a single forward pass.
      </p>

      <ReActLoop />

      {/* ── Section 2: Tool Use & Function Calling ────────────────────────────── */}
      <div id="tool-use-and-function-calling">
        <SectionTitle>Tool Use &amp; Function Calling</SectionTitle>
      </div>

      <p style={prose}>
        Agents become useful when they can call external tools — search engines,
        code interpreters, APIs, databases, and other models. Tool use requires
        the model to select the right tool from a library, construct valid inputs,
        handle errors gracefully, and integrate the tool's output back into its
        reasoning. Modern inference APIs expose this as structured function calling:
        the model outputs a JSON object specifying which function to call and with
        what arguments, and the runtime handles the actual execution.
      </p>

      <ToolUseFlow />

      {/* ── Section 3: Memory Architecture ───────────────────────────────────── */}
      <div id="memory-architecture">
        <SectionTitle>Memory Architecture</SectionTitle>
      </div>

      <p style={prose}>
        An agent's memory determines what context it can reason over. In-context
        memory is the conversation history within the current window — fast but
        finite. External memory extends this with a vector database: relevant
        documents are retrieved by semantic similarity and inserted into context.
        Episodic memory stores records of past interactions that can be recalled
        later. Working memory is the agent's ability to maintain and manipulate
        intermediate state across steps within a single task. These four types
        interact: a well-designed agent knows which memory type to consult for
        which kind of question.
      </p>

      <MemoryArchitecture />

      {/* ── Section 4: Multi-Agent Systems ───────────────────────────────────── */}
      <div id="multi-agent-systems">
        <SectionTitle>Multi-Agent Systems</SectionTitle>
      </div>

      <p style={prose}>
        Complex tasks can be decomposed across specialized agents: one agent plans,
        another executes code, a third reviews outputs. Multi-agent systems
        introduce new failure modes — agents can contradict each other, enter
        dependency cycles, or collectively hallucinate a false consensus.
        Orchestration frameworks like LangGraph model agent systems as directed
        graphs where each node is an agent and edges define information flow.
        The challenge is not building individual capable agents but composing
        them into reliable pipelines.
      </p>

      <MultiAgent />

      {/* ── Section 5: Failure Modes & Reliability ───────────────────────────── */}
      <div id="failure-modes-and-reliability">
        <SectionTitle>Failure Modes &amp; Reliability</SectionTitle>
      </div>

      <p style={prose}>
        Agents fail differently than language models. A single model call that
        hallucinates produces one wrong sentence. An agent that hallucinates
        about the result of a tool call may take ten subsequent actions based
        on that false premise — each action compounding the error. Long-horizon
        reliability requires error detection, recovery strategies, and human
        checkpoints. Prompt injection — where malicious content in the environment
        instructs the agent to take unintended actions — is a class of failure
        with no analogue in single-pass language modeling.
      </p>

      <FailureModes />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
