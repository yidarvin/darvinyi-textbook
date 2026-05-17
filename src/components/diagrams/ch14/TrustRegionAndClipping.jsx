const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.18)',
  accentDim2:'rgba(45,212,191,0.06)',
  math:    '#fbbf24',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const PL = { x: 14,  y: 56, w: 304, h: 380 };
const PR = { x: 322, y: 56, w: 304, h: 380 };

// ─── Left panel: TRPO trust region (2D parameter-space) ─────────────────
const TR_CTR = { cx: PL.x + PL.w / 2, cy: PL.y + 220 };
const TR_R = 70; // trust region radius

// θ_new inside trust region (target of constrained step)
const TR_NEW = { x: TR_CTR.cx + 50, y: TR_CTR.cy - 30 };
// θ_unconstrained outside trust region (what gradient wanted)
const TR_UNC = { x: TR_CTR.cx + 120, y: TR_CTR.cy - 90 };

// ─── Right panel: algorithmic simplification ───────────────────────────
const TRPO_BOX = { x: PR.x + 22, y: PR.y + 80,  w: PR.w - 44, h: 96 };
const PPO_BOX  = { x: PR.x + 22, y: PR.y + 232, w: PR.w - 44, h: 96 };

function PanelFrame({ p, title }) {
  return (
    <g>
      <rect
        x={p.x} y={p.y}
        width={p.w} height={p.h}
        rx="6"
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1"
      />
      <text
        x={p.x + p.w / 2}
        y={p.y + 26}
        textAnchor="middle"
        fontFamily={mono} fontSize="12"
        fill={C.text}
        fontWeight="500"
      >
        {title}
      </text>
    </g>
  );
}

export default function TrustRegionAndClipping() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 478"
        width="100%"
        role="img"
        aria-label="TRPO trust region vs. PPO clip — geometric and algorithmic comparison"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="trc-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="trc-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5"
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
          TWO WAYS TO KEEP THE NEW POLICY NEAR THE OLD ONE
        </text>

        {/* ════════════════ LEFT PANEL: TRPO GEOMETRY ════════════════ */}
        <PanelFrame p={PL} title="Geometry: hard KL ball in θ-space" />

        {/* θ_1, θ_2 axes (drawn as faint cross at center) */}
        <line
          x1={TR_CTR.cx - 110} y1={TR_CTR.cy}
          x2={TR_CTR.cx + 130} y2={TR_CTR.cy}
          stroke={C.border}
          strokeWidth="1"
        />
        <line
          x1={TR_CTR.cx} y1={TR_CTR.cy - 130}
          x2={TR_CTR.cx} y2={TR_CTR.cy + 100}
          stroke={C.border}
          strokeWidth="1"
        />
        <text
          x={TR_CTR.cx + 134} y={TR_CTR.cy + 4}
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          θ₁
        </text>
        <text
          x={TR_CTR.cx + 4} y={TR_CTR.cy - 134}
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          θ₂
        </text>

        {/* Trust region circle */}
        <circle
          cx={TR_CTR.cx} cy={TR_CTR.cy}
          r={TR_R}
          fill={C.accentDim}
          stroke={C.accent}
          strokeWidth="1.5"
          strokeDasharray="4,3"
          opacity="0.7"
        />

        {/* θ_old point */}
        <circle cx={TR_CTR.cx} cy={TR_CTR.cy} r="4" fill={C.text} />
        <text
          x={TR_CTR.cx - 10} y={TR_CTR.cy + 16}
          textAnchor="end"
          fontFamily={mono} fontSize="11"
          fill={C.text}
        >
          θ_old
        </text>

        {/* Constrained step arrow → θ_new (teal, inside region) */}
        <line
          x1={TR_CTR.cx + 4} y1={TR_CTR.cy - 2}
          x2={TR_NEW.x - 4} y2={TR_NEW.y + 2}
          stroke={C.accent}
          strokeWidth="1.8"
          markerEnd="url(#trc-arrow-teal)"
        />
        <circle cx={TR_NEW.x} cy={TR_NEW.y} r="3.5" fill={C.accent} />
        <text
          x={TR_NEW.x + 8} y={TR_NEW.y - 4}
          fontFamily={mono} fontSize="11"
          fill={C.accent}
          fontWeight="500"
        >
          θ_new
        </text>
        <text
          x={TR_NEW.x + 8} y={TR_NEW.y + 10}
          fontFamily={sans} fontSize="9.5"
          fill={C.muted}
          fontStyle="italic"
        >
          (constrained)
        </text>

        {/* Unconstrained step arrow → outside (dashed grey, rejected) */}
        <line
          x1={TR_CTR.cx + 4} y1={TR_CTR.cy - 2}
          x2={TR_UNC.x - 4} y2={TR_UNC.y + 4}
          stroke={C.muted}
          strokeWidth="1.4"
          strokeDasharray="3,3"
          opacity="0.6"
          markerEnd="url(#trc-arrow)"
        />
        <circle cx={TR_UNC.x} cy={TR_UNC.y} r="3" fill={C.muted}
                opacity="0.7" />
        <text
          x={TR_UNC.x + 6} y={TR_UNC.y - 4}
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          θ_unconstrained
        </text>
        <text
          x={TR_UNC.x + 6} y={TR_UNC.y + 8}
          fontFamily={sans} fontSize="9.5"
          fill={C.muted}
          fontStyle="italic"
        >
          (rejected)
        </text>

        {/* Trust region label inside circle (bottom of θ_old) */}
        <text
          x={TR_CTR.cx - 24} y={TR_CTR.cy + TR_R - 8}
          textAnchor="middle"
          fontFamily={mono} fontSize="10"
          fill={C.accent}
          opacity="0.85"
        >
          KL ≤ δ
        </text>

        {/* Bottom annotation */}
        <text
          x={PL.x + PL.w / 2}
          y={PL.y + PL.h - 36}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          KL ball lives in policy-parameter space
        </text>
        <text
          x={PL.x + PL.w / 2}
          y={PL.y + PL.h - 18}
          textAnchor="middle"
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          all updates must stay inside the ball
        </text>

        {/* ════════════════ RIGHT PANEL: ALGORITHMIC SIMPLIFICATION ════════ */}
        <PanelFrame p={PR} title="Algorithm: solver vs clamp" />

        {/* TRPO method box */}
        <rect
          x={TRPO_BOX.x} y={TRPO_BOX.y}
          width={TRPO_BOX.w} height={TRPO_BOX.h}
          rx="5"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.4"
        />
        <text
          x={TRPO_BOX.x + 14} y={TRPO_BOX.y + 18}
          fontFamily={mono} fontSize="10"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          TRPO · 2015
        </text>
        <text
          x={TRPO_BOX.x + TRPO_BOX.w / 2} y={TRPO_BOX.y + 42}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.text}
        >
          max J(θ)
        </text>
        <text
          x={TRPO_BOX.x + TRPO_BOX.w / 2} y={TRPO_BOX.y + 60}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.text}
        >
          s.t. KL(π_old ‖ π_θ) ≤ δ
        </text>
        <text
          x={TRPO_BOX.x + TRPO_BOX.w / 2} y={TRPO_BOX.y + 84}
          textAnchor="middle"
          fontFamily={sans} fontSize="10.5"
          fill={C.muted2}
          fontStyle="italic"
        >
          needs conjugate gradient solver
        </text>

        {/* Simplification arrow (TRPO → PPO) */}
        <line
          x1={TRPO_BOX.x + TRPO_BOX.w / 2}
          y1={TRPO_BOX.y + TRPO_BOX.h + 4}
          x2={TRPO_BOX.x + TRPO_BOX.w / 2}
          y2={PPO_BOX.y - 6}
          stroke={C.accent}
          strokeWidth="1.6"
          markerEnd="url(#trc-arrow-teal)"
        />
        <text
          x={TRPO_BOX.x + TRPO_BOX.w / 2 + 10}
          y={(TRPO_BOX.y + TRPO_BOX.h + PPO_BOX.y) / 2 + 4}
          fontFamily={mono} fontSize="11"
          fill={C.accent}
          fontWeight="500"
        >
          simplify
        </text>
        <text
          x={TRPO_BOX.x + TRPO_BOX.w / 2 - 10}
          y={(TRPO_BOX.y + TRPO_BOX.h + PPO_BOX.y) / 2 + 4}
          textAnchor="end"
          fontFamily={sans} fontSize="10"
          fill={C.muted}
          fontStyle="italic"
        >
          drop the solver
        </text>

        {/* PPO method box (highlighted teal) */}
        <rect
          x={PPO_BOX.x} y={PPO_BOX.y}
          width={PPO_BOX.w} height={PPO_BOX.h}
          rx="5"
          fill={C.accentDim2}
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <text
          x={PPO_BOX.x + 14} y={PPO_BOX.y + 18}
          fontFamily={mono} fontSize="10"
          fill={C.accent}
          letterSpacing="0.05em"
        >
          PPO · 2017
        </text>
        <text
          x={PPO_BOX.x + PPO_BOX.w / 2} y={PPO_BOX.y + 42}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.text}
        >
          max L^CLIP =
        </text>
        <text
          x={PPO_BOX.x + PPO_BOX.w / 2} y={PPO_BOX.y + 60}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.text}
        >
          {"E[ min(r·A, clip(r, 1±ε)·A) ]"}
        </text>
        <text
          x={PPO_BOX.x + PPO_BOX.w / 2} y={PPO_BOX.y + 84}
          textAnchor="middle"
          fontFamily={sans} fontSize="10.5"
          fill={C.accent}
          fontStyle="italic"
        >
          just a clamp on r — single line of code
        </text>

        {/* Bottom: pointer to widget below */}
        <text
          x={PR.x + PR.w / 2} y={PR.y + PR.h - 36}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          near-identical stability,
        </text>
        <text
          x={PR.x + PR.w / 2} y={PR.y + PR.h - 18}
          textAnchor="middle"
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          fraction of the implementation effort
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
        TRPO enforces a hard KL constraint geometrically in parameter space; PPO
        replaces the constraint with a clamp on the probability ratio — almost
        the same stability for a fraction of the code.
      </figcaption>
    </figure>
  );
}
