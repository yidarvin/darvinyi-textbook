const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.16)',
  accentDim2:'rgba(45,212,191,0.05)',
  green:   '#34d399',
  red:     '#f87171',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const PANEL_W = 200;
const PANEL_GAP = 10;
const PANEL_X_START = 10;
const PANEL_Y = 54;
const PANEL_H = 470;

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

export default function RewardSourceTaxonomy() {
  const cx0 = panelX(0) + PANEL_W / 2;
  const cx1 = panelX(1) + PANEL_W / 2;
  const cx2 = panelX(2) + PANEL_W / 2;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 580"
        width="100%"
        role="img"
        aria-label="Reward sources: RLHF (humans), RLEF (executor), RLVR + GRPO (verifier)"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="rst-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="rst-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5"
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
          WHERE DOES THE REWARD COME FROM?
        </text>

        {/* ═══════════ PANEL 1: RLHF ════════════════ */}
        <PanelFrame i={0} title="RLHF" />

        {/* Two response candidates A and B */}
        <g>
          <rect x={cx0 - 80} y={PANEL_Y + 50}
                width={66} height={36} rx="4"
                fill={C.bg3} stroke={C.borderLt} strokeWidth="1.4" />
          <text x={cx0 - 47} y={PANEL_Y + 72}
                textAnchor="middle"
                fontFamily={mono} fontSize="11" fill={C.text}>
            resp. A
          </text>
          <rect x={cx0 + 14} y={PANEL_Y + 50}
                width={66} height={36} rx="4"
                fill={C.bg3} stroke={C.borderLt} strokeWidth="1.4" />
          <text x={cx0 + 47} y={PANEL_Y + 72}
                textAnchor="middle"
                fontFamily={mono} fontSize="11" fill={C.muted2}>
            resp. B
          </text>
        </g>
        {/* "humans prefer A > B" indicator */}
        <text x={cx0} y={PANEL_Y + 104}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5"
              fill={C.muted2}>
          humans prefer A &gt; B
        </text>

        {/* arrow down to reward model */}
        <line
          x1={cx0} y1={PANEL_Y + 112}
          x2={cx0} y2={PANEL_Y + 138}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rst-arrow)"
        />

        {/* Reward Model box */}
        <rect
          x={cx0 - 80} y={PANEL_Y + 140}
          width={160} height={48}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text x={cx0} y={PANEL_Y + 162}
              textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          Reward Model
        </text>
        <text x={cx0} y={PANEL_Y + 178}
              textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          R̂(prompt, response)
        </text>

        {/* arrow down to LLM policy */}
        <line
          x1={cx0} y1={PANEL_Y + 192}
          x2={cx0} y2={PANEL_Y + 222}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rst-arrow)"
        />
        <text x={cx0 + 6} y={PANEL_Y + 212}
              fontFamily={mono} fontSize="9" fill={C.muted}>
          PPO
        </text>

        {/* LLM policy box */}
        <rect
          x={cx0 - 80} y={PANEL_Y + 224}
          width={160} height={48}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text x={cx0} y={PANEL_Y + 246}
              textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          LLM policy
        </text>
        <text x={cx0} y={PANEL_Y + 262}
              textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          optimized
        </text>

        {/* annotation */}
        <text x={cx0} y={PANEL_Y + 308}
              textAnchor="middle"
              fontFamily={sans} fontSize="11"
              fill={C.muted2} fontStyle="italic">
          reward = learned proxy
        </text>
        <text x={cx0} y={PANEL_Y + 324}
              textAnchor="middle"
              fontFamily={sans} fontSize="11"
              fill={C.muted2} fontStyle="italic">
          for human judgment
        </text>

        {/* tag at bottom */}
        <text x={cx0} y={PANEL_Y + 374}
              textAnchor="middle"
              fontFamily={mono} fontSize="10"
              fill={C.muted}
              letterSpacing="0.05em">
          USE CASES
        </text>
        <text x={cx0} y={PANEL_Y + 394}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5"
              fill={C.text}>
          writing, dialogue,
        </text>
        <text x={cx0} y={PANEL_Y + 410}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5"
              fill={C.text}>
          creative work
        </text>

        {/* ═══════════ PANEL 2: RLEF ════════════════ */}
        <PanelFrame i={1} title="RLEF" />

        {/* Code snippet box */}
        <rect
          x={cx1 - 80} y={PANEL_Y + 50}
          width={160} height={56}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.4"
        />
        <text x={cx1 - 72} y={PANEL_Y + 66}
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          def f(x):
        </text>
        <text x={cx1 - 72} y={PANEL_Y + 80}
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          {"  return x * x"}
        </text>
        <text x={cx1 - 72} y={PANEL_Y + 96}
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          assert f(3) == 9
        </text>

        {/* arrow down */}
        <line
          x1={cx1} y1={PANEL_Y + 112}
          x2={cx1} y2={PANEL_Y + 138}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rst-arrow)"
        />

        {/* Code Executor box */}
        <rect
          x={cx1 - 80} y={PANEL_Y + 140}
          width={160} height={48}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text x={cx1} y={PANEL_Y + 162}
              textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          Code Executor
        </text>
        <text x={cx1} y={PANEL_Y + 178}
              textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          run tests
        </text>

        {/* arrow down */}
        <line
          x1={cx1} y1={PANEL_Y + 192}
          x2={cx1} y2={PANEL_Y + 220}
          stroke={C.muted2} strokeWidth="1.4"
          markerEnd="url(#rst-arrow)"
        />

        {/* Binary reward indicators */}
        <g>
          <rect x={cx1 - 70} y={PANEL_Y + 224}
                width={64} height={38} rx="4"
                fill={C.bg3} stroke={C.green} strokeWidth="1.5" />
          <text x={cx1 - 38} y={PANEL_Y + 244}
                textAnchor="middle"
                fontFamily={mono} fontSize="11" fill={C.green}>
            pass
          </text>
          <text x={cx1 - 38} y={PANEL_Y + 258}
                textAnchor="middle"
                fontFamily={mono} fontSize="11" fill={C.green}
                fontWeight="500">
            r = 1
          </text>

          <rect x={cx1 + 6} y={PANEL_Y + 224}
                width={64} height={38} rx="4"
                fill={C.bg3} stroke={C.red} strokeWidth="1.5" />
          <text x={cx1 + 38} y={PANEL_Y + 244}
                textAnchor="middle"
                fontFamily={mono} fontSize="11" fill={C.red}>
            fail
          </text>
          <text x={cx1 + 38} y={PANEL_Y + 258}
                textAnchor="middle"
                fontFamily={mono} fontSize="11" fill={C.red}
                fontWeight="500">
            r = 0
          </text>
        </g>

        {/* annotation */}
        <text x={cx1} y={PANEL_Y + 308}
              textAnchor="middle"
              fontFamily={sans} fontSize="11"
              fill={C.muted2} fontStyle="italic">
          reward = deterministic
        </text>
        <text x={cx1} y={PANEL_Y + 324}
              textAnchor="middle"
              fontFamily={sans} fontSize="11"
              fill={C.muted2} fontStyle="italic">
          verifier, cheap and exact
        </text>

        {/* tag */}
        <text x={cx1} y={PANEL_Y + 374}
              textAnchor="middle"
              fontFamily={mono} fontSize="10"
              fill={C.muted}
              letterSpacing="0.05em">
          USE CASES
        </text>
        <text x={cx1} y={PANEL_Y + 394}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5"
              fill={C.text}>
          coding, math
        </text>
        <text x={cx1} y={PANEL_Y + 410}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5"
              fill={C.text}>
          (with answer key)
        </text>

        {/* ═══════════ PANEL 3: RLVR + GRPO (TEAL) ════════════════ */}
        <PanelFrame i={2} title="RLVR + GRPO" accent />

        {/* Math problem box */}
        <rect
          x={cx2 - 88} y={PANEL_Y + 50}
          width={176} height={42}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.4"
        />
        <text x={cx2} y={PANEL_Y + 66}
              textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          prompt
        </text>
        <text x={cx2} y={PANEL_Y + 82}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          3x + 5 = 14, find x
        </text>

        {/* arrow down */}
        <line
          x1={cx2} y1={PANEL_Y + 96}
          x2={cx2} y2={PANEL_Y + 118}
          stroke={C.accent} strokeWidth="1.4"
          markerEnd="url(#rst-arrow-teal)"
        />
        <text x={cx2 + 8} y={PANEL_Y + 113}
              fontFamily={mono} fontSize="9" fill={C.accent}>
          sample G
        </text>

        {/* Three CoT candidates, one teal (correct) */}
        <g>
          {/* Candidate 1 (correct) - TEAL */}
          <rect x={cx2 - 88} y={PANEL_Y + 120}
                width={176} height={40} rx="4"
                fill={C.accentDim} stroke={C.accent} strokeWidth="1.5" />
          <text x={cx2 - 80} y={PANEL_Y + 134}
                fontFamily={mono} fontSize="9" fill={C.accent}>
            CoT₁:
          </text>
          <text x={cx2 - 80} y={PANEL_Y + 148}
                fontFamily={mono} fontSize="9.5" fill={C.text}>
            3x = 9 → x = 3 ✓
          </text>
          <text x={cx2 + 60} y={PANEL_Y + 156}
                fontFamily={mono} fontSize="10"
                fill={C.accent} fontWeight="500">
            +1
          </text>

          {/* Candidate 2 (wrong) */}
          <rect x={cx2 - 88} y={PANEL_Y + 164}
                width={176} height={40} rx="4"
                fill={C.bg3} stroke={C.borderLt} strokeWidth="1.2" />
          <text x={cx2 - 80} y={PANEL_Y + 178}
                fontFamily={mono} fontSize="9" fill={C.muted}>
            CoT₂:
          </text>
          <text x={cx2 - 80} y={PANEL_Y + 192}
                fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            x = 4.66... ✗
          </text>
          <text x={cx2 + 60} y={PANEL_Y + 200}
                fontFamily={mono} fontSize="10"
                fill={C.muted}>
            0
          </text>

          {/* Candidate 3 (wrong) */}
          <rect x={cx2 - 88} y={PANEL_Y + 208}
                width={176} height={40} rx="4"
                fill={C.bg3} stroke={C.borderLt} strokeWidth="1.2" />
          <text x={cx2 - 80} y={PANEL_Y + 222}
                fontFamily={mono} fontSize="9" fill={C.muted}>
            CoT₃:
          </text>
          <text x={cx2 - 80} y={PANEL_Y + 236}
                fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            x = 9 ✗
          </text>
          <text x={cx2 + 60} y={PANEL_Y + 244}
                fontFamily={mono} fontSize="10"
                fill={C.muted}>
            0
          </text>
        </g>

        {/* GRPO advantage normalization callout */}
        <text x={cx2} y={PANEL_Y + 270}
              textAnchor="middle"
              fontFamily={mono} fontSize="10"
              fill={C.accent}>
          A_i = (r_i − mean) / std
        </text>
        <text x={cx2} y={PANEL_Y + 286}
              textAnchor="middle"
              fontFamily={sans} fontSize="10"
              fill={C.muted}
              fontStyle="italic">
          (within-group normalization,
        </text>
        <text x={cx2} y={PANEL_Y + 300}
              textAnchor="middle"
              fontFamily={sans} fontSize="10"
              fill={C.muted}
              fontStyle="italic">
          no separate value network)
        </text>

        {/* annotation */}
        <text x={cx2} y={PANEL_Y + 332}
              textAnchor="middle"
              fontFamily={sans} fontSize="11"
              fill={C.muted2} fontStyle="italic">
          reward = automatic
        </text>
        <text x={cx2} y={PANEL_Y + 348}
              textAnchor="middle"
              fontFamily={sans} fontSize="11"
              fill={C.muted2} fontStyle="italic">
          verifier on math / code
        </text>

        {/* tag */}
        <text x={cx2} y={PANEL_Y + 384}
              textAnchor="middle"
              fontFamily={mono} fontSize="10"
              fill={C.accent}
              letterSpacing="0.05em">
          USE CASES
        </text>
        <text x={cx2} y={PANEL_Y + 404}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5"
              fill={C.text}>
          reasoning emergence
        </text>
        <text x={cx2} y={PANEL_Y + 420}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5"
              fill={C.text}>
          (DeepSeek-R1-Zero)
        </text>

        {/* Bottom annotation */}
        <text
          x="320" y="556"
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.muted2}
        >
          same RL machinery — different reward source
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
        RLHF, RLEF, and RLVR share the same RL machinery; what differs is whether
        the reward is a learned proxy (humans), a deterministic verifier (code),
        or an automatic checker (math/proofs).
      </figcaption>
    </figure>
  );
}
