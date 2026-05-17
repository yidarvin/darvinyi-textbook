import { useTocSections } from "../../components/layout/TocRail";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import HarnessTaxonomy from "../../components/widgets/ch22/HarnessTaxonomy";
import ClaudeCodeArchitecture from "../../components/widgets/ch22/ClaudeCodeArchitecture";
import ClaudeCodeVsCodex from "../../components/widgets/ch22/ClaudeCodeVsCodex";
import LangChainComposition from "../../components/widgets/ch22/LangChainComposition";
import LangGraphStateMachine from "../../components/widgets/ch22/LangGraphStateMachine";
import CrewAIvsAutoGPT from "../../components/widgets/ch22/CrewAIvsAutoGPT";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: 1.75,
  margin: "0 0 20px",
};

const CITATIONS = [
  { num: "[1]", title: "Building Effective Agents", authors: "Anthropic Engineering", venue: "Anthropic blog", year: "2024", tag: "paper" },
  { num: "[2]", title: "Building Agents with the Claude Agent SDK", authors: "Anthropic Engineering", venue: "Anthropic blog", year: "2025", tag: "paper" },
  { num: "[3]", title: "Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems", authors: "VILA-Lab", venue: "arXiv preprint", year: "2025", tag: "paper" },
  { num: "[4]", title: "LangChain: Building Applications with LLMs through Composability", authors: "Chase", venue: "GitHub", year: "2022", tag: "paper" },
  { num: "[5]", title: "LangGraph: Building Stateful, Multi-Actor Applications with LLMs", authors: "LangChain", venue: "LangChain docs", year: "2024", tag: "paper" },
  { num: "[6]", title: "CrewAI: Framework for Orchestrating Role-playing, Autonomous AI Agents", authors: "Moura", venue: "GitHub", year: "2024", tag: "paper" },
  { num: "[7]", title: "AutoGPT: An Autonomous GPT-4 Experiment", authors: "Significant Gravitas", venue: "GitHub", year: "2023", tag: "paper" },
  { num: "[8]", title: "OpenAI Codex CLI", authors: "OpenAI", venue: "GitHub", year: "2025", tag: "paper" },
  { num: "[9]", title: "Model Context Protocol (MCP) Specification", authors: "Anthropic", venue: "MCP docs", year: "2024", tag: "paper" },
];

const TOC_SECTIONS = [
  { id: "taxonomy",               label: "Harness Design Space" },
  { id: "cli-coding-agents",      label: "CLI Coding Agents" },
  { id: "composition-libraries",  label: "Composition Libraries" },
  { id: "state-machines",         label: "State Machines" },
  { id: "multi-agent-frameworks", label: "Multi-Agent Frameworks" },
];

export default function AgentHarnesses() {
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
        Chapter 22 · Part VII — AI Agents
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
        AI Agent Harnesses
      </h1>

      <ChapterLede>
        Chapter 21 covered what agents are. This chapter covers the systems that
        actually run them. A harness is everything around the model — the loop that
        calls it, the tools it can reach, the way context is managed, the safety
        gates that wrap each action, the storage of session state across runs.
        As models converge in capability, the harness becomes the differentiator.
        Claude Code, OpenAI Codex CLI, LangChain, LangGraph, and CrewAI each answer
        the same recurring design questions differently: where reasoning lives,
        how the iteration loop is structured, what safety posture to adopt, how
        extensions plug in, and how work is delegated.
      </ChapterLede>

      {/* ── Section 1: The Harness Design Space ─────────────────────────────── */}
      <div id="taxonomy">
        <SectionTitle>The Harness Design Space</SectionTitle>
      </div>

      <p style={prose}>
        Agent harnesses are not a monolithic category. They sit along several
        distinct axes. Some are command-line tools that wrap a model with file-system
        access (Claude Code, Codex CLI). Others are composition libraries that
        let developers build agents by chaining primitives (LangChain). Still
        others are orchestration frameworks for explicit state machines (LangGraph)
        or for role-based multi-agent collaboration (CrewAI). And some are fully
        autonomous loops designed to operate without human intervention (AutoGPT
        and its descendants). Each design optimizes for different priorities —
        developer velocity, reliability, interpretability, or autonomy — and the
        choice of harness shapes what is even possible to build.
      </p>

      <HarnessTaxonomy />

      {/* ── Section 2: CLI Coding Agents ────────────────────────────────────── */}
      <div id="cli-coding-agents">
        <SectionTitle>CLI Coding Agents — Claude Code &amp; Codex</SectionTitle>
      </div>

      <p style={prose}>
        Terminal-based coding agents have become the dominant interface for
        software engineering tasks. Claude Code, released by Anthropic in 2024
        and renamed from Claude Code SDK to Claude Agent SDK in 2025, exposes a
        small set of primitive tools — file read/write, shell execution, search —
        and wraps them with a permission system, a context compaction pipeline,
        and a subagent delegation mechanism. OpenAI's Codex CLI took a similar
        approach with a different philosophy: simpler abstractions, more reliance
        on the model's raw capabilities, less harness-level structure. The two
        designs represent contrasting bets about where intelligence should live.
      </p>

      <ClaudeCodeArchitecture />

      <ClaudeCodeVsCodex />

      {/* ── Section 3: Composition Libraries ────────────────────────────────── */}
      <div id="composition-libraries">
        <SectionTitle>Composition Libraries — LangChain</SectionTitle>
      </div>

      <p style={prose}>
        LangChain emerged in 2022 as a Python library for composing the building
        blocks of LLM applications. Its core abstractions — Chains, Agents, Memory,
        Tools, Retrievers — let developers wire together LLM calls, vector
        databases, search APIs, and custom logic with minimal boilerplate. The
        library's strength and weakness are the same: it is comprehensive. Hundreds
        of integrations exist for popular models, databases, and APIs. The downside
        is that the abstractions sometimes feel heavy, and the rate of API changes
        has historically been high. LangChain's value is less in any single
        primitive and more in the surface area it covers.
      </p>

      <LangChainComposition />

      {/* ── Section 4: State Machines ────────────────────────────────────────── */}
      <div id="state-machines">
        <SectionTitle>State Machines — LangGraph</SectionTitle>
      </div>

      <p style={prose}>
        LangGraph extends LangChain with explicit graph-based agent control flow.
        Each node in the graph is a function — often an LLM call or tool use —
        and edges define how state flows between nodes. Conditional edges allow
        the graph to branch based on the agent's decisions. This makes agent
        behavior auditable: rather than asking an LLM to decide what to do next
        in unstructured prose, the developer defines a state machine and the LLM
        just makes the routing decisions. LangGraph has become the recommended
        approach for production agent workflows where reliability matters more
        than flexibility.
      </p>

      <LangGraphStateMachine />

      {/* ── Section 5: Multi-Agent Frameworks ───────────────────────────────── */}
      <div id="multi-agent-frameworks">
        <SectionTitle>Multi-Agent Frameworks — CrewAI &amp; AutoGPT</SectionTitle>
      </div>

      <p style={prose}>
        Multi-agent frameworks compose multiple specialized agents into a team.
        CrewAI takes a role-based approach: each agent has a role description,
        a goal, a set of tools, and a backstory that shapes its behavior. Tasks
        are assigned to specific agents, and the framework orchestrates handoffs.
        AutoGPT, one of the earliest autonomous agent frameworks, took a
        fundamentally different approach: a single agent in an unsupervised loop
        that decomposes tasks, executes them, and self-evaluates. AutoGPT's
        fully autonomous design proved more fragile than expected — without
        clear delegation structure, agents tend to drift. The trend has moved
        toward more structured, role-based, or graph-based designs.
      </p>

      <CrewAIvsAutoGPT />

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
