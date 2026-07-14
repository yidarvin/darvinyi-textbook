const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.14)',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Layout
const AGENT     = { x: 70,  y: 90,  w: 200, h: 130 };
const ENV       = { x: 370, y: 90,  w: 220, h: 130 };
const TOP_Y     = 124;   // top arrow y (action)
const BOT_Y     = 186;   // bottom arrow y (state + reward)

// Inset box (V/Q definitions)
const INSET     = { x: 70, y: 290, w: 520, h: 90 };

export default function AgentEnvironmentLoop() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 410"
        width="100%"
        role="img"
        aria-label="Agent-environment loop: actions out, states and rewards in"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="ael-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="ael-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Section eyebrow */}
        <text
          x="320" y="34"
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          THE MDP CYCLE
        </text>

        {/* ── Agent box ─────────────────────────────────── */}
        <rect
          x={AGENT.x} y={AGENT.y}
          width={AGENT.w} height={AGENT.h}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text
          x={AGENT.x + AGENT.w / 2}
          y={AGENT.y + 30}
          textAnchor="middle"
          fontFamily={mono} fontSize="14"
          fill={C.text}
          fontWeight="500"
        >
          Agent
        </text>
        <text
          x={AGENT.x + AGENT.w / 2}
          y={AGENT.y + 58}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          chooses actions
        </text>
        <text
          x={AGENT.x + AGENT.w / 2}
          y={AGENT.y + AGENT.h - 18}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.muted2}
        >
          policy π(a | s)
        </text>

        {/* ── Environment box ───────────────────────────── */}
        <rect
          x={ENV.x} y={ENV.y}
          width={ENV.w} height={ENV.h}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text
          x={ENV.x + ENV.w / 2}
          y={ENV.y + 30}
          textAnchor="middle"
          fontFamily={mono} fontSize="14"
          fill={C.text}
          fontWeight="500"
        >
          Environment
        </text>
        <text
          x={ENV.x + ENV.w / 2}
          y={ENV.y + 58}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          changes state, emits reward
        </text>
        <text
          x={ENV.x + ENV.w / 2}
          y={ENV.y + ENV.h - 32}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.muted2}
        >
          dynamics P(s' | s, a)
        </text>
        <text
          x={ENV.x + ENV.w / 2}
          y={ENV.y + ENV.h - 16}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.muted2}
        >
          reward R(s, a)
        </text>

        {/* ── Top arrow: Agent → Environment ────────────── */}
        <line
          x1={AGENT.x + AGENT.w + 4}
          y1={TOP_Y}
          x2={ENV.x - 6}
          y2={TOP_Y}
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#ael-arrow)"
        />
        <text
          x={(AGENT.x + AGENT.w + ENV.x) / 2}
          y={TOP_Y - 8}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.text}
        >
          action a_t
        </text>

        {/* ── Bottom arrow: Environment → Agent ─────────── */}
        <line
          x1={ENV.x - 4}
          y1={BOT_Y}
          x2={AGENT.x + AGENT.w + 6}
          y2={BOT_Y}
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#ael-arrow)"
        />
        {/* Bottom-arrow label: "state s_{t+1}" muted, "reward r_t" teal */}
        <text
          x={(AGENT.x + AGENT.w + ENV.x) / 2}
          y={BOT_Y + 18}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
        >
          <tspan fill={C.text}>{"state s_{t+1},"}</tspan>
          <tspan fill={C.accent} fontWeight="500">{" reward r_t"}</tspan>
        </text>

        {/* ── MDP annotation (below loop) ───────────────── */}
        <text
          x="320" y="252"
          textAnchor="middle"
          fontFamily={mono} fontSize="11.5"
          fill={C.muted2}
        >
          MDP = (S, A, P, R, γ)
        </text>
        <text
          x="320" y="270"
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted}
          fontStyle="italic"
        >
          states · actions · transition dynamics · reward function · discount
        </text>

        {/* ── V/Q inset box ─────────────────────────────── */}
        <rect
          x={INSET.x} y={INSET.y}
          width={INSET.w} height={INSET.h}
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={INSET.x + 14}
          y={INSET.y + 22}
          fontFamily={mono} fontSize="10.5"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          VALUE FUNCTIONS
        </text>
        <text
          x={INSET.x + 14}
          y={INSET.y + 48}
          fontFamily={mono} fontSize="11.5"
          fill={C.text}
        >
          <tspan>V*(s)</tspan>
          <tspan fill={C.muted2}>{"   = best possible return starting from s"}</tspan>
        </text>
        <text
          x={INSET.x + 14}
          y={INSET.y + 72}
          fontFamily={mono} fontSize="11.5"
          fill={C.text}
        >
          <tspan>Q*(s, a)</tspan>
          <tspan fill={C.muted2}>{" = best possible return after taking a in s"}</tspan>
        </text>
      </svg>

      <figcaption
        style={{
          fontFamily: sans,
          fontSize: '12px',
          color: C.muted,
          textAlign: 'center',
          marginTop: '10px',
          lineHeight: 1.5,
        }}
      >
        The agent-environment loop: take an action, observe the next state and
        reward, update the policy — repeat until convergence or task end.
      </figcaption>
    </figure>
  );
}
