const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  accentDim: '#0b2422',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const X_INPUT      = 24;
const ROUTER_X     = 100;
const ROUTER_W     = 70;
const EXPERT_X     = 270;
const EXPERT_W     = 80;
const EXPERT_H     = 24;
const SUM_X        = 446;
const OUT_X        = 564;

const EXPERTS = 8;
const EXPERT_GAP = 6;
const EXPERT_TOTAL = EXPERTS * EXPERT_H + (EXPERTS - 1) * EXPERT_GAP;
const EXPERT_TOP = 50;
const EXPERT_CY = (i) => EXPERT_TOP + i * (EXPERT_H + EXPERT_GAP) + EXPERT_H / 2;

const ROUTER_CY = EXPERT_TOP + EXPERT_TOTAL / 2;

const SCORES = ['0.02', '0.65', '0.03', '0.18', '0.01', '0.04', '0.05', '0.02'];
const TOP_K = [1, 3]; // indices of top-2 (0-indexed) — FFN_2 and FFN_4

export default function MoERouting() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 340"
        width="100%"
        role="img"
        aria-label="Mixture of experts top-k routing"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="moe-arr-muted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted2} />
          </marker>
          <marker
            id="moe-arr-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
        </defs>

        <text
          x={320}
          y={22}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="12"
          fill={C.muted2}
        >
          One token's forward pass through an MoE layer  ·  top-2 of 8
        </text>

        {/* Input x */}
        <rect
          x={X_INPUT}
          y={ROUTER_CY - 14}
          width={46}
          height={28}
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={X_INPUT + 23}
          y={ROUTER_CY + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="12"
          fill={C.text}
        >
          x
        </text>

        {/* x → router arrow */}
        <line
          x1={X_INPUT + 46}
          y1={ROUTER_CY}
          x2={ROUTER_X - 2}
          y2={ROUTER_CY}
          stroke={C.muted2}
          strokeWidth="1.2"
          markerEnd="url(#moe-arr-muted)"
        />

        {/* Router box */}
        <rect
          x={ROUTER_X}
          y={ROUTER_CY - 22}
          width={ROUTER_W}
          height={44}
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={ROUTER_X + ROUTER_W / 2}
          y={ROUTER_CY - 3}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          Router
        </text>
        <text
          x={ROUTER_X + ROUTER_W / 2}
          y={ROUTER_CY + 12}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted2}
        >
          W_g
        </text>

        {/* Fan-out from router to each expert with routing score */}
        {Array.from({ length: EXPERTS }, (_, i) => {
          const isTop = TOP_K.includes(i);
          const ecy = EXPERT_CY(i);
          return (
            <g key={`route-${i}`}>
              <line
                x1={ROUTER_X + ROUTER_W}
                y1={ROUTER_CY}
                x2={EXPERT_X - 2}
                y2={ecy}
                stroke={isTop ? C.accent : C.muted}
                strokeWidth={isTop ? 1.4 : 0.8}
                opacity={isTop ? 1 : 0.5}
                markerEnd={isTop ? 'url(#moe-arr-accent)' : 'url(#moe-arr-muted)'}
              />
              <text
                x={(ROUTER_X + ROUTER_W + EXPERT_X) / 2}
                y={(ROUTER_CY + ecy) / 2 - 2}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="9.5"
                fill={isTop ? C.accent : C.muted}
              >
                {SCORES[i]}
              </text>

              {/* Expert FFN box */}
              <rect
                x={EXPERT_X}
                y={ecy - EXPERT_H / 2}
                width={EXPERT_W}
                height={EXPERT_H}
                rx="4"
                fill={isTop ? C.accentDim : 'none'}
                stroke={isTop ? C.accent : C.muted}
                strokeWidth={isTop ? 1.5 : 1}
                strokeDasharray={isTop ? '' : '3 3'}
                opacity={isTop ? 1 : 0.6}
              />
              <text
                x={EXPERT_X + EXPERT_W / 2}
                y={ecy + 4}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10.5"
                fill={isTop ? C.accent : C.muted}
              >
                {`FFN_${i + 1}`}
              </text>

              {/* From active experts: arrow into weighted sum */}
              {isTop && (
                <line
                  x1={EXPERT_X + EXPERT_W}
                  y1={ecy}
                  x2={SUM_X - 2}
                  y2={ROUTER_CY}
                  stroke={C.accent}
                  strokeWidth="1.4"
                  markerEnd="url(#moe-arr-accent)"
                />
              )}
            </g>
          );
        })}

        {/* Weighted sum operator */}
        <circle
          cx={SUM_X + 22}
          cy={ROUTER_CY}
          r="22"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={SUM_X + 22}
          y={ROUTER_CY + 6}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="18"
          fill={C.text}
        >
          Σ
        </text>
        <text
          x={SUM_X + 22}
          y={ROUTER_CY + 38}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="10"
          fill={C.muted}
        >
          weighted sum
        </text>

        {/* Σ → output */}
        <line
          x1={SUM_X + 44}
          y1={ROUTER_CY}
          x2={OUT_X - 2}
          y2={ROUTER_CY}
          stroke={C.muted2}
          strokeWidth="1.2"
          markerEnd="url(#moe-arr-muted)"
        />
        <rect
          x={OUT_X}
          y={ROUTER_CY - 14}
          width={46}
          height={28}
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={OUT_X + 23}
          y={ROUTER_CY + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="12"
          fill={C.text}
        >
          y
        </text>

        {/* Footer annotation */}
        <text
          x={320}
          y={314}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted}
        >
          for this token: 2 / 8 experts active  →  2× dense FFN compute,
          4× total parameters available
        </text>
      </svg>

      <figcaption
        style={{
          fontFamily: sans,
          fontSize: '12px',
          color: C.muted,
          textAlign: 'center',
          marginTop: '8px',
          lineHeight: 1.5,
        }}
      >
        Each token passes through only its top-k experts; the router learns
        which experts specialize in which kinds of inputs.
      </figcaption>
    </figure>
  );
}
