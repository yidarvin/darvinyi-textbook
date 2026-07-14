const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.14)',
  accentDim2:'rgba(45,212,191,0.05)',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Panel geometry: three side-by-side panels in 640w viewBox
const PANEL_W = 200;
const PANEL_GAP = 10;
const PANEL_X_START = 10;
const PANEL_Y = 54;
const PANEL_H = 420;

const panelX = (i) => PANEL_X_START + i * (PANEL_W + PANEL_GAP);

function PanelFrame({ i, title, accent }) {
  const x = panelX(i);
  return (
    <g>
      <rect
        x={x} y={PANEL_Y}
        width={PANEL_W} height={PANEL_H}
        rx="6"
        fill={accent ? C.accentDim2 : C.bg2}
        stroke={accent ? C.accent : C.border}
        strokeWidth={accent ? 1.5 : 1}
      />
      <text
        x={x + PANEL_W / 2}
        y={PANEL_Y + 26}
        textAnchor="middle"
        fontFamily={mono} fontSize="12"
        fill={accent ? C.accent : C.text}
        fontWeight="500"
      >
        {title}
      </text>
    </g>
  );
}

// ─── Reusable input/output glyphs ──────────────────────────────────────
function StateGlyph({ cx, cy }) {
  return (
    <g>
      <circle
        cx={cx} cy={cy} r="14"
        fill={C.bg3}
        stroke={C.borderLt}
        strokeWidth="1.4"
      />
      <text
        x={cx} y={cy + 4}
        textAnchor="middle"
        fontFamily={mono} fontSize="11"
        fill={C.text}
      >
        s
      </text>
    </g>
  );
}

function NetworkBox({ x, y, w, h, label, sublabel, teal }) {
  return (
    <g>
      <rect
        x={x} y={y}
        width={w} height={h}
        rx="4"
        fill={teal ? C.accentDim : C.bg3}
        stroke={teal ? C.accent : C.borderLt}
        strokeWidth="1.5"
      />
      <text
        x={x + w / 2}
        y={y + (sublabel ? 19 : h / 2 + 4)}
        textAnchor="middle"
        fontFamily={mono} fontSize="11"
        fill={teal ? C.accent : C.text}
        fontWeight="500"
      >
        {label}
      </text>
      {sublabel && (
        <text
          x={x + w / 2}
          y={y + h - 8}
          textAnchor="middle"
          fontFamily={mono} fontSize="9.5"
          fill={C.muted}
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}

export default function RLApproachTaxonomy() {
  // For each panel, derive an internal center
  const cx0 = panelX(0) + PANEL_W / 2;
  const cx1 = panelX(1) + PANEL_W / 2;
  const cx2 = panelX(2) + PANEL_W / 2;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 520"
        width="100%"
        role="img"
        aria-label="Three families of RL methods: value-based, policy-based, actor-critic"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="rlt-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="rlt-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text
          x="320" y="28"
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          THREE FAMILIES OF RL METHODS
        </text>

        {/* ═══════════ PANEL 1: Value-based ════════════════ */}
        <PanelFrame i={0} title="Value-based" />

        <StateGlyph cx={cx0} cy={PANEL_Y + 64} />

        {/* arrow down */}
        <line
          x1={cx0} y1={PANEL_Y + 80}
          x2={cx0} y2={PANEL_Y + 102}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rlt-arrow)"
        />

        <NetworkBox
          x={cx0 - 75} y={PANEL_Y + 104}
          w={150} h={48}
          label="Q-network"
          sublabel={null}
        />

        {/* arrow down */}
        <line
          x1={cx0} y1={PANEL_Y + 154}
          x2={cx0} y2={PANEL_Y + 174}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rlt-arrow)"
        />

        {/* Q-values list */}
        <rect
          x={cx0 - 75} y={PANEL_Y + 176}
          width={150} height={50}
          rx="3"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.2"
        />
        <text x={cx0} y={PANEL_Y + 192} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          Q-values
        </text>
        <text x={cx0} y={PANEL_Y + 208} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          Q(s, a₁), Q(s, a₂), …
        </text>

        {/* arrow down */}
        <line
          x1={cx0} y1={PANEL_Y + 228}
          x2={cx0} y2={PANEL_Y + 248}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rlt-arrow)"
        />

        {/* argmax */}
        <rect
          x={cx0 - 50} y={PANEL_Y + 250}
          width={100} height={32}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text x={cx0} y={PANEL_Y + 270} textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          argmax_a
        </text>

        {/* annotation */}
        <text
          x={cx0} y={PANEL_Y + 312}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          learn Q, derive policy
        </text>
        <text
          x={cx0} y={PANEL_Y + 328}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          as argmax
        </text>

        {/* examples */}
        <text
          x={cx0} y={PANEL_Y + 372}
          textAnchor="middle"
          fontFamily={mono} fontSize="10"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          EXAMPLES
        </text>
        <text
          x={cx0} y={PANEL_Y + 392}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.text}
        >
          Q-learning
        </text>
        <text
          x={cx0} y={PANEL_Y + 408}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.text}
        >
          DQN, Double DQN
        </text>

        {/* ═══════════ PANEL 2: Policy-based ════════════════ */}
        <PanelFrame i={1} title="Policy-based" />

        <StateGlyph cx={cx1} cy={PANEL_Y + 64} />

        <line
          x1={cx1} y1={PANEL_Y + 80}
          x2={cx1} y2={PANEL_Y + 102}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rlt-arrow)"
        />

        <NetworkBox
          x={cx1 - 75} y={PANEL_Y + 104}
          w={150} h={48}
          label="Policy network"
          sublabel={null}
        />

        <line
          x1={cx1} y1={PANEL_Y + 154}
          x2={cx1} y2={PANEL_Y + 174}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rlt-arrow)"
        />

        {/* π(a|s) distribution glyph: small bar chart */}
        <g>
          <rect
            x={cx1 - 75} y={PANEL_Y + 176}
            width={150} height={50}
            rx="3"
            fill={C.bg3}
            stroke={C.borderLt}
            strokeWidth="1.2"
          />
          <text x={cx1} y={PANEL_Y + 192} textAnchor="middle"
                fontFamily={mono} fontSize="10" fill={C.muted}>
            π(a | s)
          </text>
          {/* tiny bars */}
          {[
            { dx: -28, h: 8 },
            { dx: -14, h: 14 },
            { dx: 0,   h: 6 },
            { dx: 14,  h: 12 },
            { dx: 28,  h: 4 },
          ].map((b, i) => (
            <rect
              key={`bar-${i}`}
              x={cx1 + b.dx - 4}
              y={PANEL_Y + 220 - b.h}
              width={8}
              height={b.h}
              fill={C.muted2}
            />
          ))}
        </g>

        <line
          x1={cx1} y1={PANEL_Y + 228}
          x2={cx1} y2={PANEL_Y + 248}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rlt-arrow)"
        />

        {/* sample box */}
        <rect
          x={cx1 - 50} y={PANEL_Y + 250}
          width={100} height={32}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text x={cx1} y={PANEL_Y + 270} textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          sample a ∼ π
        </text>

        <text
          x={cx1} y={PANEL_Y + 312}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          learn π directly,
        </text>
        <text
          x={cx1} y={PANEL_Y + 328}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          no value function
        </text>

        <text
          x={cx1} y={PANEL_Y + 372}
          textAnchor="middle"
          fontFamily={mono} fontSize="10"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          EXAMPLES
        </text>
        <text
          x={cx1} y={PANEL_Y + 392}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.text}
        >
          REINFORCE
        </text>

        {/* ═══════════ PANEL 3: Actor-Critic (TEAL) ═══════════ */}
        <PanelFrame i={2} title="Actor-Critic" accent />

        <StateGlyph cx={cx2} cy={PANEL_Y + 64} />

        {/* Two branching arrows: state → Actor and state → Critic */}
        <line
          x1={cx2 - 4} y1={PANEL_Y + 78}
          x2={cx2 - 36} y2={PANEL_Y + 102}
          stroke={C.muted2} strokeWidth="1.3"
          markerEnd="url(#rlt-arrow)"
        />
        <line
          x1={cx2 + 4} y1={PANEL_Y + 78}
          x2={cx2 + 36} y2={PANEL_Y + 102}
          stroke={C.muted2} strokeWidth="1.3"
          markerEnd="url(#rlt-arrow)"
        />

        {/* Actor box (top-left) */}
        <NetworkBox
          x={cx2 - 88} y={PANEL_Y + 104}
          w={80} h={48}
          label="Actor"
          sublabel="π(a|s)"
          teal
        />
        {/* Critic box (top-right) */}
        <NetworkBox
          x={cx2 + 8} y={PANEL_Y + 104}
          w={80} h={48}
          label="Critic"
          sublabel="V(s)"
        />

        {/* Critic → Actor: advantage line (mid section) */}
        <line
          x1={cx2 + 8} y1={PANEL_Y + 170}
          x2={cx2 - 8} y2={PANEL_Y + 170}
          stroke={C.accent}
          strokeWidth="1.4"
          strokeDasharray="3,3"
          markerEnd="url(#rlt-arrow-teal)"
        />
        <text
          x={cx2} y={PANEL_Y + 192}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.accent}
        >
          A = Q − V
        </text>
        <text
          x={cx2} y={PANEL_Y + 206}
          textAnchor="middle"
          fontFamily={sans} fontSize="10"
          fill={C.muted}
          fontStyle="italic"
        >
          low-variance gradient
        </text>

        {/* Policy update box */}
        <line
          x1={cx2 - 48} y1={PANEL_Y + 152}
          x2={cx2 - 48} y2={PANEL_Y + 234}
          stroke={C.muted2}
          strokeWidth="1.2"
          strokeDasharray="2,3"
        />
        <line
          x1={cx2 - 48} y1={PANEL_Y + 234}
          x2={cx2 - 28} y2={PANEL_Y + 254}
          stroke={C.muted2}
          strokeWidth="1.2"
          strokeDasharray="2,3"
          markerEnd="url(#rlt-arrow)"
        />

        <rect
          x={cx2 - 60} y={PANEL_Y + 250}
          width={120} height={32}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text x={cx2} y={PANEL_Y + 270} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          policy update
        </text>

        <text
          x={cx2} y={PANEL_Y + 312}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          policy + value
        </text>
        <text
          x={cx2} y={PANEL_Y + 328}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          function together
        </text>

        <text
          x={cx2} y={PANEL_Y + 372}
          textAnchor="middle"
          fontFamily={mono} fontSize="10"
          fill={C.accent}
          letterSpacing="0.05em"
        >
          EXAMPLES
        </text>
        <text
          x={cx2} y={PANEL_Y + 392}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.text}
        >
          A2C, A3C
        </text>
        <text
          x={cx2} y={PANEL_Y + 408}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.text}
        >
          PPO
        </text>

        {/* Bottom annotation */}
        <text
          x="320" y="498"
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.muted2}
        >
          actor-critic dominates modern practice
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
        Value-based methods learn Q and derive a policy; policy-based methods
        learn π directly; actor-critic combines both, using the value function as
        a variance-reducing baseline. GRPO (Section 4) is not listed under
        Actor-Critic above: it drops the learned critic entirely and estimates
        advantage via group-relative reward normalization, so it doesn't fit
        this box's literal actor/critic computation graph despite otherwise
        replacing PPO in modern LLM RL pipelines.
      </figcaption>
    </figure>
  );
}
