import { useTocSections } from "../../components/layout/TocRail";
import { buildCitations } from "../../data/citations";
import SectionTitle from "../../components/shared/SectionTitle";
import ChapterLede from "../../components/shared/ChapterLede";
import Citations from "../../components/shared/Citations";
import HarnessTaxonomy from "../../components/widgets/ch25/HarnessTaxonomy";
import ClaudeCodeArchitecture from "../../components/widgets/ch25/ClaudeCodeArchitecture";
import ClaudeCodeVsCodex from "../../components/widgets/ch25/ClaudeCodeVsCodex";
import LangChainComposition from "../../components/widgets/ch25/LangChainComposition";
import LangGraphStateMachine from "../../components/widgets/ch25/LangGraphStateMachine";
import CrewAIvsAutoGPT from "../../components/widgets/ch25/CrewAIvsAutoGPT";
import WorkflowsToAgentsSpectrum from "../../components/diagrams/ch25/WorkflowsToAgentsSpectrum";
import CLICodingAgentArchetype from "../../components/diagrams/ch25/CLICodingAgentArchetype";
import CompositionSpectrum from "../../components/diagrams/ch25/CompositionSpectrum";
import StateMachineVsFreeForm from "../../components/diagrams/ch25/StateMachineVsFreeForm";
import MultiAgentFrameworkLandscape from "../../components/diagrams/ch25/MultiAgentFrameworkLandscape";

const prose = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "var(--prose-size, 15px)",
  fontWeight: 400,
  color: "#b8c4cc",
  lineHeight: "var(--prose-line-height, 1.75)",
  margin: "0 0 var(--prose-margin-bottom, 20px)",
};

const CITATIONS = buildCitations([
  { title: "Building Effective Agents", authors: "Schluntz, Zhang", venue: "Anthropic (engineering blog)", year: "2024", tag: "paper" },
  { title: "Building Agents with the Claude Agent SDK", authors: "Shihipar", venue: "Anthropic (blog)", year: "2025", tag: "paper" },
  { title: "Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems", authors: "Liu, Zhao, Shang, Shen", venue: "arXiv preprint", year: "2026", tag: "paper" },
  { title: "OpenAI Codex CLI", authors: "OpenAI", venue: "GitHub", year: "2025", tag: "paper" },
  { title: "Introducing Gemini CLI: Your Open-Source AI Agent", authors: "Google", venue: "Google blog", year: "2025", tag: "paper" },
  { title: "OpenHands: An Open Platform for AI Software Developers as Generalist Agents", authors: "Wang, Li, Song, Xu, Tang, Zhuge, Pan, et al.", venue: "ICLR", year: "2025", tag: "paper" },
  { title: "Introducing Devin, the First AI Software Engineer", authors: "Cognition", venue: "Cognition (blog)", year: "2024", tag: "paper" },
  { title: "SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering", authors: "Yang, Jimenez, Wettig, Lieret, Yao, Narasimhan, Press", venue: "NeurIPS", year: "2024", tag: "paper" },
  { title: "Model Context Protocol (MCP) Specification", authors: "Anthropic", venue: "MCP docs", year: "2024", tag: "paper" },
  { title: "Terminal-Bench: Benchmarking Agents on Hard, Realistic Tasks in Command Line Interfaces", authors: "Laude Institute", venue: "arXiv preprint", year: "2026", tag: "paper" },
  { title: "Introducing SWE-bench Verified", authors: "OpenAI", venue: "OpenAI (blog)", year: "2024", tag: "paper" },
  "langchain",
  { title: "DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines", authors: "Khattab, Singhvi, Maheshwari, et al.", venue: "arXiv preprint", year: "2023", tag: "paper" },
  { title: "LangGraph: Building Stateful, Multi-Actor Applications with LLMs", authors: "LangChain", venue: "LangChain docs", year: "2024", tag: "paper" },
  { title: "CrewAI: Framework for Orchestrating Role-playing, Autonomous AI Agents", authors: "Moura", venue: "GitHub", year: "2023", tag: "paper" },
  { title: "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation", authors: "Wu, Bansal, Zhang, et al.", venue: "Microsoft Research / arXiv", year: "2023", tag: "paper" },
  { title: "Swarm", authors: "OpenAI", venue: "GitHub", year: "2024", tag: "paper" },
  "autogpt",
]);

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
        Chapter 25 · Part VII — AI Agents
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
        AI Agent Harnesses
      </h1>

      <ChapterLede>
        Chapter 24 covered what agents are. This chapter covers the systems that
        actually run them. A harness is everything wrapped around the model —
        the loop, the tools, and the guardrails — that turns a language model
        into a working piece of software. As models converge in capability,
        the harness increasingly is the differentiator.
      </ChapterLede>

      {/* ── Section 1: The Harness Design Space ─────────────────────────────── */}
      <div id="taxonomy">
        <SectionTitle>The Harness Design Space</SectionTitle>
      </div>

      <p style={prose}>
        Agent harnesses are not a monolithic category — they sit along
        several distinct axes. Some are command-line tools that wrap a model
        with file-system access (Claude Code, Codex CLI). Others are
        composition libraries that let developers build agents by chaining
        primitives (LangChain). Still others are orchestration frameworks for
        explicit state machines (LangGraph) or for role-based multi-agent
        collaboration (CrewAI). And some are fully autonomous loops designed
        to operate without human intervention (AutoGPT and its descendants).
        Each design optimizes for different priorities — developer velocity,
        reliability, interpretability, or autonomy — and the choice of
        harness shapes what is even possible to build.
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
        loop? How is context managed — kept as full conversation history,
        retrieved on demand, or compacted (summarized down when it grows too
        large for the model's context window)? What is the safety posture —
        permissions on each tool call, dangerous-action confirmations, sandboxing
        (running the model's actions inside an isolated environment with
        restricted file, network, or system access)? How do extensions plug in —
        built-in plugins, MCP servers, custom code? How is work delegated —
        single agent with tools, hierarchical subagents, parallel workers, peer
        collaboration? How is state persisted — across runs, across sessions,
        across machines? Each harness gives a different combination of answers.
        As frontier models have converged in raw capability through 2025–2026,
        harnesses are increasingly where the user-facing differentiation happens
        — the gap between a great agent and a frustrating one is more often in
        the harness than the model.
      </p>

      <p style={prose}>
        Sandboxing deserves its own look because it is the one axis where the
        harnesses profiled in this chapter diverge structurally rather than
        just stylistically. Both Claude Code and Codex CLI can enforce isolation
        at the operating-system level — a Seatbelt profile on macOS, bubblewrap
        plus Landlock and seccomp on Linux — that blocks network access and
        confines writes to the working directory, independent of anything the
        model decides to do. The real difference is the default: Codex CLI runs
        every session inside that OS-level sandbox unless a developer opts out,
        while Claude Code's sandbox is opt-in (enabled per-session), leaning by
        default on the permission-mode system instead — every tool call passes
        through a check the user configures, so isolation is enforced by asking
        rather than by walling off the process unless the sandbox is turned on.
        LangGraph and CrewAI ship no sandboxing of their own at all — whatever a
        node's or agent's tools can reach, the graph can reach, so isolation is
        whatever the developer builds around the tool implementations. Fully
        autonomous frameworks and hosted coding agents typically run each task
        inside a disposable container instead, trading the flexibility of a
        shared environment for a hard reset between runs. None of these is
        strictly safer than the others in the abstract; they trade off
        differently between reliability, developer effort, and how much of the
        isolation is on by default versus left for the user to turn on.
      </p>

      <p style={prose}>
        Filter the plot below to CLI coding tools, then to multi-agent
        frameworks; notice that Claude Code and Codex CLI cluster in the
        interactive-helper quadrant despite the previous paragraph's
        default-on-versus-opt-in sandboxing contrast, while AutoGPT sits alone
        at the fully autonomous, low-structure extreme — the empirical range
        this section has just described in the abstract.
      </p>

      <HarnessTaxonomy
        tryThis={{
          do: "Filter to 'Multi-agent', then to 'CLI coding', clicking each dot to open its detail card.",
          notice: "the autonomy bar for AutoGPT dwarfs everything else on the plot, while its reusability bar is the lowest of the six — high autonomy and low reusability travel together here.",
        }}
      />

      {/* ── Section 2: CLI Coding Agents ────────────────────────────────────── */}
      <div id="cli-coding-agents">
        <SectionTitle>CLI Coding Agents — Claude Code &amp; Codex</SectionTitle>
      </div>

      <p style={prose}>
        Terminal-based coding agents have become the dominant interface for
        software-engineering tasks. Claude Code, released by Anthropic as a
        research preview in February 2025 alongside Claude 3.7 Sonnet and
        reaching general availability in May 2025, exposes a small set of
        primitive tools — file read/write, shell execution, search — and wraps
        them with a permission system, a context compaction pipeline, and a
        subagent delegation mechanism. OpenAI's Codex CLI targets the same job
        with a different default: fewer harness-level abstractions and its
        operating-system-level sandbox turned on by default, where Claude Code
        leans by default on its configurable permission system and leaves the
        equivalent OS-level sandbox opt-in. The two designs represent
        contrasting bets about which layer should carry the safety burden by
        default — the harness's permission logic, or the operating system
        underneath it — while both make the other layer available too.
      </p>

      <p style={prose}>
        Anthropic's <em>Building Agents with the Claude Agent SDK</em> [2] (the
        SDK underlying Claude Code, renamed from Claude Code SDK to Claude Agent
        SDK in September 2025 — the CLI product itself kept its name)
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
        Hooks are also the harness's answer to a threat model distinct from the
        prompt injection covered in Chapter 24. That earlier chapter's injection
        arrives through the user's own prompt; this one arrives through a tool
        result the harness itself must treat as untrusted — a web page a fetch
        call returns with embedded instructions, a file comment engineered to
        look like a system message, an MCP server response from a source of
        unknown provenance. A harness that treats every tool result as trusted
        context is vulnerable regardless of how carefully the original prompt
        was screened. PreToolUse and PostToolUse hooks give a concrete
        interception point: a hook can inspect a pending tool call before it
        runs, or scan a tool's output before it re-enters the model's context,
        and block or rewrite it — turning the harness itself into part of the
        security boundary rather than relying on the model to recognize an
        embedded instruction as illegitimate.
      </p>

      <p style={prose}>
        OpenAI's Codex CLI [4] (released 2025) targets the same job with a real,
        technically enforced safety mechanism rather than a weaker one: its
        default posture runs every command inside an operating-system sandbox —
        Seatbelt (<span className="math">sandbox-exec</span>) on macOS, a
        combination of bubblewrap, Landlock, and seccomp on Linux — that blocks
        network access and confines file writes to the workspace, paired with an
        approval policy that asks for explicit confirmation before anything
        needs to escalate beyond that sandbox. This is not "less safety" than
        Claude Code's permission system, just a different layer of enforcement:
        Claude Code gates actions by asking a human or a classifier before they
        run, while Codex CLI's sandbox makes an entire class of actions
        structurally impossible regardless of what is asked. Google's Gemini
        CLI [5], released as an open-source terminal agent in June 2025, occupies
        similar territory to both — another entrant competing on largely the
        same primitives. A related but architecturally distinct category is the
        fully autonomous software-engineering agent: OpenHands [6] (formerly
        OpenDevin) is the leading open-source entry, Cognition's Devin [7]
        popularized the "autonomous software engineer" framing in 2024, and
        SWE-agent [8] is the academic reference scaffold behind the SWE-bench
        benchmark discussed later in this chapter — all three aim for less
        human involvement per task than the CLI tools do, at the cost of more
        difficulty verifying what happened along the way. Cursor, Cline, and
        Aider sit nearer the CLI-tool end of this spectrum, each trading off
        IDE integration, headless operation, and harness opinionation slightly
        differently.
      </p>

      <p style={prose}>
        What unifies almost all of these tools at the tool layer is the Model
        Context Protocol (MCP) [9], Anthropic's November 2024 specification for
        tool integration. MCP defines three roles: a <em>host</em> is the
        application the user actually interacts with (Claude Code, Cursor,
        Codex CLI via a compatibility shim); a <em>client</em> is the connector
        instance the host creates, one per server, that speaks the protocol;
        and a <em>server</em> is the process — often a separate program,
        possibly on a different machine — that exposes some capability, such as
        GitHub, Slack, a file system, or a browser. A server can expose three
        kinds of primitive over that connection: tools are model-invoked
        actions with a name, a description, and a schema, functionally
        identical to the function-calling tools introduced in Chapter 24;
        resources are addressable pieces of context — a file, a database row, a
        URL — that the host can read and inject into the model's context
        without the model having to ask for them by name; and prompts are
        reusable, templated instructions a server exposes for the host to
        surface to the user, distinct from either. Most day-to-day MCP usage is
        just the tools primitive, which is why MCP is often described loosely
        as "a plugin standard for tools" — but the resources and prompts
        primitives are what let a server expose structured, addressable context
        rather than only actions, and harnesses that implement only the tools
        half of the spec are missing part of what an MCP server can offer. The
        practical effect either way is the same: MCP turns the tool layer into
        a configurable plugin system rather than a custom-coded integration,
        which is why most major harnesses now support it directly or via a
        shim — and it is a large part of why CLI coding agents are, by 2026,
        the most demonstrably useful agent category in production, with the
        design patterns developed here increasingly adapted to other agent
        domains.
      </p>

      <CLICodingAgentArchetype />

      <p style={prose}>
        Click through the five subsystems in the diagram below — permissions,
        extensibility, compaction, subagents, and storage — to see how each
        one answers a different piece of the design-question list from the
        previous section; notice that the permission system alone spans six
        named modes, while the storage subsystem underneath it has no modes
        at all — some design questions warrant that much configurability, and
        some don't.
      </p>

      <ClaudeCodeArchitecture
        tryThis={{
          do: "Click each subsystem in turn, starting with Permission System, then open the stats strip.",
          notice: "the permission system's six modes range from fully manual to fully unattended, while the storage subsystem has no modes at all — different design questions warrant different amounts of configurability.",
        }}
      />

      <p style={prose}>
        One convention has converged across nearly every harness in this
        category: a plain markdown file, auto-loaded into context at the start
        of a session, that holds project-specific conventions, build commands,
        and architecture notes the model would otherwise have to rediscover on
        every run. Claude Code calls this file CLAUDE.md; Codex CLI and the
        broader OpenAI ecosystem converged on the same idea under the name
        AGENTS.md; Cursor's equivalent is <span className="math">.cursorrules</span>.
        None of these is a system prompt in the formal sense — the file's
        contents load as ordinary context, not privileged instructions — but
        functionally they answer the state-persistence design question from
        the taxonomy section for the one kind of state that changes slowest:
        not the conversation, and not the session, but the project itself.
      </p>

      <p style={prose}>
        Expand the safety-posture and extensibility rows below and toggle
        "Highlight differences"; notice that the highlighted phrases describe
        two different enforcement layers — permission gating versus OS-level
        sandboxing — rather than one harness simply being stricter than the
        other.
      </p>

      <ClaudeCodeVsCodex
        tryThis={{
          do: "Expand the safety-posture row, then click 'Highlight differences'.",
          notice: "the highlighted phrases name two different enforcement layers, not one harness being stricter than the other — permission gating on one side, an OS-level sandbox on the other.",
        }}
      />

      <p style={prose}>
        Context compaction addresses one half of the long-session problem —
        the model's context window is finite — but a second, purely economic
        half is what actually makes multi-hour sessions affordable: prompt
        caching. An agent loop resends its accumulated conversation on every
        turn, and without caching the provider would reprocess the entire
        growing prefix from scratch each time — cost and latency that scale
        with the whole conversation, not with what changed. With caching, a
        harness marks the stable prefix (system prompt, tool definitions,
        everything before the newest turn) as reusable; a cache write costs a
        premium — for Claude, about 1.25 times the normal input price — but
        every subsequent turn that hits the cache pays roughly a tenth of the
        normal input price for that same span, with only the new turn's
        tokens billed at full price. Concretely: two turns already break even
        against never caching at all (1.25× plus roughly 0.1× is close to the
        2× a second uncached pass would cost), so a fifty-turn coding session
        ends up costing close to fifty times one marginal turn rather than the
        sum of fifty ever-growing conversations. This is why harnesses that
        manage context carefully — ordering tool definitions and the system
        prompt first, appending new turns at the end rather than editing
        history in place — get a real, measurable cost advantage over ones
        that don't, independent of how good the underlying model is.
      </p>

      <p style={prose}>
        The comparison this section has been making qualitatively —
        architecture, safety posture, extensibility — is also made
        empirically, and the benchmarks used to make it have shifted since
        Chapter 21's evaluation chapter. Terminal-Bench [10], launched in
        2025, is the current standard for comparing terminal and CLI coding
        agents specifically: it scores agents on realistic, hard command-line
        tasks rather than isolated coding problems. SWE-bench Verified [11], a
        human-filtered 500-task subset of the original SWE-bench released by
        OpenAI in August 2024, has become the standard for the narrower
        question of whether an agent can resolve a real, previously filed
        GitHub issue in an existing codebase — the same task shape CLI coding
        agents spend most of their time on. Both benchmarks measure multi-step
        task completion rather than single-turn correctness, which matters
        because a harness's compaction, permission, and tool-result-handling
        choices — everything this section has covered — show up directly in
        the pass rate in a way a single-prompt benchmark never would.
      </p>

      {/* ── Section 3: Composition Libraries ────────────────────────────────── */}
      <div id="composition-libraries">
        <SectionTitle>Composition Libraries — LangChain</SectionTitle>
      </div>

      <p style={prose}>
        LangChain — Chase (2022) [12] — was the first major Python library to
        treat LLM applications as compositions of primitives — Chains, Agents,
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
        Several alternatives have grown around LangChain. DSPy — Khattab et al.
        (2023) [13] — takes a declarative approach: developers specify what the
        program should do, and the framework optimizes prompts and
        demonstrations automatically — a compiler-like model that is compelling
        for production teams that want to decouple prompt engineering from
        application logic. LlamaIndex focuses specifically on RAG
        (retrieval-augmented generation, covered in Chapter 24) and
        document-retrieval pipelines. Haystack targets enterprise search and
        retrieval use cases. But the most significant trend in 2025–2026 is in
        the opposite direction: many teams that started on LangChain have moved
        to lighter wrappers around the OpenAI, Anthropic, and Google APIs
        directly, often a few hundred lines of custom code that handles their
        specific needs. The lesson — articulated repeatedly in Anthropic's
        <em> Building Effective Agents</em> and by other practitioners — is that
        for simpler use cases (which most production use cases turn out to be),
        the cost of a heavy framework's abstractions often exceeds the benefit.
        Composition libraries are useful when their primitives match the
        application at hand; they become an obstacle when they don't.
      </p>

      <CompositionSpectrum />

      <p style={prose}>
        Switch between the three presets below — Basic RAG, Tool-Using Agent,
        and Conversational RAG + Tools — and watch which primitives light up
        in the palette on the left; notice that Memory and Tool only ever
        appear together, never Memory alone, since LangChain's own
        agent-construction pattern couples the two.
      </p>

      <LangChainComposition
        tryThis={{
          do: "Switch through all three presets and leave 'Highlight used primitives' on.",
          notice: "Memory and Tool always light up together, never Memory alone — LangChain's agent construction couples the two even when a task barely needs conversation history.",
        }}
      />

      {/* ── Section 4: State Machines ────────────────────────────────────────── */}
      <div id="state-machines">
        <SectionTitle>State Machines — LangGraph</SectionTitle>
      </div>

      <p style={prose}>
        LangGraph [14] (LangChain, 2024) made explicit what production-grade
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
        small change but has large consequences: agent behavior becomes
        auditable — the path any particular execution took through the graph
        can be inspected — testable, since individual nodes can be
        unit-tested, and incrementally improvable, since a node can be
        replaced without rewriting the rest.
      </p>

      <p style={prose}>
        LangGraph isn't operating in isolation. Traditional workflow engines
        like Temporal and Inngest have added LLM-specific features and now
        compete in the same space — they bring durable execution (workflows
        that survive process restarts, can pause for hours or days, and handle
        retries automatically) which LangGraph itself only recently added. The
        intellectual debt to traditional state machines and BPMN-style
        workflow modeling — the box-and-arrow process-diagram notation long
        used to formalize enterprise workflows — is acknowledged; "make the
        structure explicit, let the model make decisions inside it" is not a
        new engineering principle. LangGraph Studio provides visual graph
        editing; LangSmith provides observability and trace inspection across
        runs. For production agent workflows where reliability matters more
        than flexibility, state-machine-based harnesses have become the
        recommended approach by 2026, with the autonomous-agent alternative
        reserved for cases where the task genuinely requires open-ended
        exploration.
      </p>

      <StateMachineVsFreeForm />

      <p style={prose}>
        Run the "sensitive" preset below and watch which node the graph routes
        to instead of the retrieval path the "complex" preset takes; notice
        that the routing decision is the only thing the model controls — the
        escalate-to-human node, and every other node in the graph, was fixed
        by the developer before the session ever ran.
      </p>

      <LangGraphStateMachine
        tryThis={{
          do: "Run the 'Sensitive' preset, then the 'Complex' preset, watching the state panel update at each step.",
          notice: "the routing decision at 'classify' is the only thing the model actually controls — the escalate-to-human node, and every other node the path can reach, was fixed by the developer before the session ran.",
        }}
      />

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
        CrewAI — Moura (2023) [15] — is the most widely adopted role-based
        multi-agent framework — agents are defined by a role, a goal, a
        backstory, and a toolkit; tasks are assigned to agents; the framework
        orchestrates handoffs and aggregation. AutoGen — Wu et al. (2023) [16]
        — emphasizes conversational patterns: agents talk to each other in
        turn-based discussions until they reach a conclusion. OpenAI Swarm [17]
        (2024, since renamed and superseded by the OpenAI Agents SDK) took a
        minimalist approach: a small library where agents are simple objects
        with handoff functions, designed to be easy to read in a single
        afternoon. AutoGPT [18] started the era — a viral 2023 experiment where
        a single agent operated in an unsupervised loop, decomposing tasks and
        self-evaluating progress toward an arbitrary user-specified goal.
        AutoGPT's fully autonomous design proved more fragile than the demos
        suggested: without clear structural delegation, agents drifted, looped,
        hallucinated progress, and accumulated errors over long horizons. The
        viral demos receded; the autonomous-agent paradigm walked back
        substantially. By 2026, the multi-agent space has consolidated around
        more structured patterns — role-based with explicit handoffs (CrewAI),
        graph-based with state machines (LangGraph), or supervisor-worker
        patterns (the model Claude Code uses internally with subagents). The
        recurring lesson from Chapter 24 holds: complex multi-agent systems
        rarely outperform a single capable agent unless the task genuinely
        benefits from specialization, parallel exploration, or human-in-the-loop
        phase gates.
      </p>

      <MultiAgentFrameworkLandscape />

      <p style={prose}>
        Run both simulations below at once and compare the two execution logs
        side by side; notice that CrewAI's task graph completes in a fixed
        seven steps every time, while AutoGPT's goal stack keeps growing until
        step 10 detects a repeated search query and forces a stuck-loop break.
      </p>

      <CrewAIvsAutoGPT
        tryThis={{
          do: "Click 'Run both', then compare the two execution logs once they finish.",
          notice: "CrewAI's task graph completes in a fixed seven steps every run, while AutoGPT's goal stack keeps growing until step 10 detects a repeated search query and forces a stuck-loop break.",
        }}
      />

      <p style={prose}>
        Several trends visible in 2026 are likely to continue. Standardization
        at the tool layer keeps deepening: MCP has become the de facto wire
        format for tool integration, and the tool ecosystem increasingly exists
        independently of whichever harness happens to be calling it. Durable
        execution — workflows that survive process restarts, pause for human
        input, and resume long-running tasks without losing state — is moving
        from a specialty workflow-engine feature into baseline harness
        functionality. Evaluation methodology keeps maturing too, beyond the
        CLI-specific benchmarks already covered: broader multi-step agent
        benchmarks like WebArena (web-browsing tasks) and GAIA (a
        general-assistant benchmark spanning browsing, tool use, and multi-step
        reasoning) are pushing evaluation away from single-turn correctness and
        toward whether an agent actually finishes a real task. The time horizon
        over which agents can operate reliably is extending, from minutes in
        2023 to multi-hour sessions by 2026, and the mechanisms making that
        extension affordable — compaction, caching, durable execution — are
        engineering wins rather than a change in how autonomous the underlying
        model has become. And the field's center of gravity has shifted from
        "build an autonomous agent" toward "design a workflow with LLM-driven
        steps," reserving the autonomous-agent toolkit for the cases that
        genuinely need it.
      </p>

      <p style={prose}>
        What carries forward from this chapter is the workflow-versus-agent
        lens itself, together with the recurring list of design questions it
        forces on every harness — where reasoning lives, how context and state
        persist, what the safety posture is, how extensions plug in, how work
        gets delegated. That lens reaches back across the whole book: a harness
        is the last layer of engineering wrapped around everything covered
        earlier, from the statistical-learning foundations and the training
        techniques that make a model learnable, through attention,
        transformers, and the alignment methods that make a model
        instructable, to the loop that finally lets a trained model act on its
        own. The chapters before this one built the model; this one showed
        what happens once that model is given a loop, a set of tools, and
        permission to act — with the field's working answers, as of 2026,
        looking more like traditional software engineering (state machines,
        durable execution, observability, evaluation harnesses) than the
        autonomous-AI futures once imagined in 2023.
      </p>

      {/* ── Citations ─────────────────────────────────────────────────────────── */}
      <Citations citations={CITATIONS} />
    </article>
  );
}
