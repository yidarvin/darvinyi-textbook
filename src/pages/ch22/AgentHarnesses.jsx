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
import WorkflowsToAgentsSpectrum from "../../components/diagrams/ch22/WorkflowsToAgentsSpectrum";
import CLICodingAgentArchetype from "../../components/diagrams/ch22/CLICodingAgentArchetype";
import CompositionSpectrum from "../../components/diagrams/ch22/CompositionSpectrum";
import StateMachineVsFreeForm from "../../components/diagrams/ch22/StateMachineVsFreeForm";
import MultiAgentFrameworkLandscape from "../../components/diagrams/ch22/MultiAgentFrameworkLandscape";

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

      <p style={prose}>
        The most influential framing for this design space comes from Anthropic's
        December 2024 engineering post <em>Building Effective Agents</em> [1]. The
        post draws a sharp distinction: a <em>workflow</em> has predefined paths
        with LLM-driven routing — humans designed the structure, the model makes
        decisions inside it. An <em>agent</em> is a system where the LLM decides
        its own path — fully model-driven control flow. The piece argues, with
        concrete examples, that workflows are sufficient and preferable for most
        production use cases, and that fully autonomous agents are warranted only
        when the task genuinely requires open-ended exploration, parallel
        speculation, or dynamic tool selection that can't be predicted in advance.
        The post then enumerates six concrete patterns that span this spectrum:
        prompt chaining (sequential LLM calls), routing (a classifier dispatches
        to specialized handlers), parallelization (independent LLM calls run
        concurrently), orchestrator-workers (an orchestrator decomposes a task
        and delegates), evaluator-optimizer (an evaluator critiques outputs and
        an optimizer improves them), and autonomous agents (model-driven loops
        with extended tool use). Almost every harness covered in this chapter is
        implementing one or more of these patterns; the differences are in which
        patterns they support, how they expose them to developers, and what
        defaults they choose.
      </p>

      <WorkflowsToAgentsSpectrum />

      <p style={prose}>
        Once a pattern is chosen, every harness has to answer the same recurring
        engineering questions. Where does reasoning live — does the model produce
        its own chain-of-thought, or does the harness drive an explicit reasoning
        loop? How is context managed — full conversation history, summarized,
        retrieved? Compaction at threshold or never? What is the safety posture —
        permissions on each tool call, dangerous-action confirmations, sandboxing?
        How do extensions plug in — built-in plugins, MCP servers, custom Python?
        How is work delegated — single agent with tools, hierarchical subagents,
        parallel workers, peer collaboration? How is state persisted — across
        runs, across sessions, across machines? Each harness gives a different
        combination of answers. As frontier models have converged in raw
        capability through 2025–2026, harnesses are increasingly where the
        user-facing differentiation happens — the gap between a great agent and
        a frustrating one is more often in the harness than the model.
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

      <p style={prose}>
        Anthropic's <em>Building Agents with the Claude Agent SDK</em> [2] (the
        SDK underlying Claude Code, renamed from Claude Code SDK in 2025)
        documented the architectural choices that make terminal coding agents
        work. A small set of file-system primitives — <span className="math">View</span>,
        {' '}<span className="math">Edit</span>, <span className="math">Write</span>,
        {' '}<span className="math">Bash</span>, <span className="math">Glob</span>,
        {' '}<span className="math">Grep</span> — are exposed as the agent's tools,
        deliberately kept simple, each doing one thing well. Subagent delegation
        via a <span className="math">Task</span> tool lets the parent agent spawn
        a focused subagent for a self-contained subtask (for instance, "search
        the codebase for X and return relevant files"), keeping the parent's
        context clean. Context compaction automatically summarizes earlier turns
        of a conversation when context approaches the model's limit, preserving
        recent activity in full while compressing the rest. The permission system
        requires explicit user approval (configurable per-session) for dangerous
        actions like shell execution. Hooks (<span className="math">PreToolUse</span>,
        {' '}<span className="math">PostToolUse</span>, and others) let users
        intercept agent behavior for logging, validation, or override. The
        VILA-Lab paper <em>Dive into Claude Code</em> [3] analyzed these choices
        as a coherent design philosophy: keep primitives small, push complex
        behavior into the model's reasoning, use the harness for safety and
        state management rather than for clever orchestration.
      </p>

      <p style={prose}>
        OpenAI's Codex CLI [8] (released 2025) targets the same use case with a
        different philosophy — fewer harness-level abstractions, more reliance
        on the model's raw decisions, lighter context management. The two
        designs represent a genuine philosophical disagreement: how much
        intelligence should live in the harness versus the model? Cursor, Cline,
        and Aider sit nearby on this spectrum, each making slightly different
        trade-offs between IDE integration, headless operation, and harness
        opinionation. What unifies all of them is the Model Context Protocol
        (MCP) [9], Anthropic's November 2024 specification for tool integration —
        a wire format that lets any MCP-compatible client (Claude Code, Cursor,
        Codex via the OpenAI Agents SDK shim, others) discover and call tools
        exposed by any MCP server (GitHub, Slack, file systems, browsers, dozens
        of others). MCP turns the tool layer into a configurable plugin system
        rather than a custom-coded integration, which is why most major harnesses
        now support it directly or via shims. CLI coding agents are, by 2026,
        the most demonstrably useful agent category — they handle real
        software-engineering tasks in real codebases for real users, and the
        design patterns developed here are increasingly being adapted to other
        agent domains.
      </p>

      <CLICodingAgentArchetype />

      <ClaudeCodeArchitecture />

      <ClaudeCodeVsCodex />

      {/* ── Section 3: Composition Libraries ────────────────────────────────── */}
      <div id="composition-libraries">
        <SectionTitle>Composition Libraries — LangChain</SectionTitle>
      </div>

      <p style={prose}>
        LangChain (Harrison Chase, 2022) [4] was the first major Python library
        to treat LLM applications as compositions of primitives — Chains, Agents,
        Memory, Tools, Retrievers, Output Parsers, Document Loaders — and it
        became the default starting point for thousands of LLM-powered
        applications between 2022 and 2024. Its later LangChain Expression
        Language (LCEL) introduced a more functional composition syntax where
        pipelines are built with the <span className="math">|</span> operator,
        making the chain structure visible in the code rather than buried in
        nested constructor calls. The library's design choice — comprehensive
        coverage of every conceivable LLM-application building block — was a
        strength when developers wanted batteries-included quick-starts, and a
        weakness when the resulting code became hard to debug, refactor, or
        migrate as APIs evolved. The history of API churn has been a recurring
        complaint; LangChain has rewritten its core abstractions multiple times.
      </p>

      <p style={prose}>
        Several alternatives have grown around LangChain. DSPy (Khattab et al.
        2023) takes a declarative approach: developers specify what the program
        should do, and the framework optimizes prompts and demonstrations
        automatically — a compiler-like model that is compelling for production
        teams that want to decouple prompt engineering from application logic.
        LlamaIndex focuses specifically on RAG and document-retrieval pipelines.
        Haystack targets enterprise search and retrieval use cases. But the most
        significant trend in 2025–2026 is in the opposite direction: many teams
        that started on LangChain have moved to lighter wrappers around the
        OpenAI, Anthropic, and Google APIs directly, often a few hundred lines
        of custom code that handles their specific needs. The lesson — articulated
        repeatedly in Anthropic's <em>Building Effective Agents</em> and by other
        practitioners — is that for simpler use cases (which most production use
        cases turn out to be), the cost of a heavy framework's abstractions often
        exceeds the benefit. Composition libraries are useful when their
        primitives match your application; they become an obstacle when they don't.
      </p>

      <CompositionSpectrum />

      <LangChainComposition />

      {/* ── Section 4: State Machines ────────────────────────────────────────── */}
      <div id="state-machines">
        <SectionTitle>State Machines — LangGraph</SectionTitle>
      </div>

      <p style={prose}>
        LangGraph [5] (LangChain, 2024) made explicit what production-grade
        LangChain users had been building informally for years — agent
        applications are state machines, designed by an engineer, with
        humans-in-the-loop checkpoints at critical phases. The framework's
        contribution is making the graph structure first-class: nodes are
        functions (typically LLM calls or tool invocations), edges define how
        state flows, conditional edges let the graph branch based on an LLM's
        decision or a deterministic check, and the full execution trace is
        captured for debugging. Rather than asking an LLM to decide what to do
        next in unstructured prose, the developer defines a state machine and
        the LLM just makes the routing decisions inside it. This sounds like a
        small change but has large consequences: agent behavior becomes auditable
        (you can inspect which path through the graph any particular execution
        took), testable (you can unit-test individual nodes), and incrementally
        improvable (you can replace a node without rewriting the rest).
      </p>

      <p style={prose}>
        LangGraph isn't operating in isolation. Traditional workflow engines
        like Temporal and Inngest have added LLM-specific features and now
        compete in the same space — they bring durable execution (workflows
        that survive process restarts, can pause for hours or days, and handle
        retries automatically) which LangGraph itself only recently added. The
        intellectual debt to traditional state machines and BPMN-style workflow
        modeling is acknowledged — "make the structure explicit, let the model
        make decisions inside it" is not a new engineering principle. LangGraph
        Studio provides visual graph editing; LangSmith provides observability
        and trace inspection across runs. For production agent workflows where
        reliability matters more than flexibility, state-machine-based harnesses
        have become the recommended approach by 2026, with the autonomous-agent
        alternative reserved for cases where the task genuinely requires
        open-ended exploration.
      </p>

      <StateMachineVsFreeForm />

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

      <p style={prose}>
        CrewAI [6] (João Moura, 2024) is the most widely adopted role-based
        multi-agent framework — agents are defined by a role, a goal, a backstory,
        and a toolkit; tasks are assigned to agents; the framework orchestrates
        handoffs and aggregation. AutoGen (Microsoft, 2023) emphasizes
        conversational patterns — agents talk to each other in turn-based
        discussions until they reach a conclusion. OpenAI Swarm (2024, since
        renamed and superseded by the OpenAI Agents SDK) took a minimalist
        approach: a small library where agents are simple objects with handoff
        functions, designed to be easy to read in a single afternoon. AutoGPT
        [7] started the era — a viral 2023 experiment where a single agent
        operated in an unsupervised loop, decomposing tasks and self-evaluating
        progress toward an arbitrary user-specified goal. AutoGPT's fully
        autonomous design proved more fragile than the demos suggested: without
        clear structural delegation, agents drifted, looped, hallucinated
        progress, and accumulated errors over long horizons. The viral demos
        receded; the autonomous-agent paradigm walked back substantially. By
        2026, the multi-agent space has consolidated around more structured
        patterns — role-based with explicit handoffs (CrewAI), graph-based with
        state machines (LangGraph), or supervisor-worker patterns (the model
        Claude Code uses internally with subagents). The recurring lesson from
        Chapter 21 holds: complex multi-agent systems rarely outperform a single
        capable agent unless the task genuinely benefits from specialization,
        parallel exploration, or human-in-the-loop phase gates.
      </p>

      <MultiAgentFrameworkLandscape />

      <CrewAIvsAutoGPT />

      <p style={prose}>
        Several trends are visible in 2026 and likely to continue. Standardization
        at the tool layer: MCP has become the de-facto wire format and is gaining
        adoption beyond Anthropic — the tool ecosystem now exists somewhat
        independently of the harness that uses it. Durable execution becoming
        standard: agent workflows that survive process restarts, pause for human
        input, and handle long-running tasks are moving from a specialty
        workflow-engine feature into baseline harness functionality. Better
        evaluation: agent-specific benchmarks (SWE-Bench Agent, WebArena, GAIA,
        the increasing focus on multi-step task completion rather than single-turn
        correctness) are reshaping how harnesses are compared and chosen. Longer
        horizons: the time scale at which agents can operate reliably is
        extending — from minutes in 2023 to multi-hour sessions in 2026 — and
        the next frontier is multi-day or multi-week durable agent operation.
        Convergence on the workflow majority: the field's center of gravity has
        shifted from "build an autonomous agent" toward "design a workflow with
        LLM-driven steps," reserving the autonomous-agent toolkit for tasks
        that genuinely need it. The textbook closes here, with the field still
        actively defining what "good" looks like for agent harnesses — but with
        the working answers increasingly resembling traditional software
        engineering disciplines (state machines, durable execution, observability,
        evaluation harnesses) more than the autonomous-AI futures imagined in
        2023.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
