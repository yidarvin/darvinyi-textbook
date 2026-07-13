const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// ── Box geometry (left-to-right pipeline) ─────────────────────────
const G_T    = { x: 18,  y: 165, w: 60,  h: 36 };

const M_BOX  = { x: 108, y: 80,  w: 170, h: 56 };
const MH_BOX = { x: 306, y: 80,  w: 130, h: 56 };

const V_BOX  = { x: 108, y: 230, w: 170, h: 56 };
const VH_BOX = { x: 306, y: 230, w: 130, h: 56 };

const UPDATE = { x: 458, y: 148, w: 170, h: 70 };

// ── Helpers ───────────────────────────────────────────────────────
function Box({ box, lines, sublabel }) {
  const { x, y, w, h } = box;
  const lineH = 16;
  const totalH = lines.length * lineH;
  const startY = y + h / 2 - totalH / 2 + lineH * 0.72;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1.5"
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={startY + i * lineH}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          {line}
        </text>
      ))}
      {sublabel && (
        <text
          x={x + w / 2}
          y={y + h + 14}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}

// Centerlines for arrow geometry
const G_OUT = { x: G_T.x + G_T.w,    y: G_T.y + G_T.h / 2 };
const M_IN  = { x: M_BOX.x,          y: M_BOX.y + M_BOX.h / 2 };
const M_OUT = { x: M_BOX.x + M_BOX.w, y: M_BOX.y + M_BOX.h / 2 };
const MH_IN = { x: MH_BOX.x,         y: MH_BOX.y + MH_BOX.h / 2 };
const MH_OUT= { x: MH_BOX.x + MH_BOX.w, y: MH_BOX.y + MH_BOX.h / 2 };

const V_IN  = { x: V_BOX.x,          y: V_BOX.y + V_BOX.h / 2 };
const V_OUT = { x: V_BOX.x + V_BOX.w, y: V_BOX.y + V_BOX.h / 2 };
const VH_IN = { x: VH_BOX.x,         y: VH_BOX.y + VH_BOX.h / 2 };
const VH_OUT= { x: VH_BOX.x + VH_BOX.w, y: VH_BOX.y + VH_BOX.h / 2 };

const U_TOP = { x: UPDATE.x, y: UPDATE.y + 20 };
const U_BOT = { x: UPDATE.x, y: UPDATE.y + UPDATE.h - 20 };

function bezier(a, b) {
  const midX = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
}

export default function AdamUnpacking() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 360"
        width="100%"
        role="img"
        aria-label="Adam optimizer block diagram: gradient branches into first and second moment EMAs, bias-corrected, and combined into the parameter update"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="adam-arr-muted"
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
            id="adam-arr-accent"
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

        {/* Title */}
        <text x={20} y={24} fontFamily={mono} fontSize="10.5" fill={C.muted}>
          Adam: gradient → moments → bias correction → step
        </text>

        {/* Input: gₜ */}
        <Box box={G_T} lines={["gₜ"]} sublabel="gradient" />

        {/* Bifurcation: gₜ → mₜ box (top) and gₜ → vₜ box (bottom) */}
        <path
          d={bezier(G_OUT, M_IN)}
          fill="none"
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#adam-arr-muted)"
        />
        <path
          d={bezier(G_OUT, V_IN)}
          fill="none"
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#adam-arr-muted)"
        />

        {/* Top path: mₜ EMA → m̂ₜ bias-corrected */}
        <Box
          box={M_BOX}
          lines={["mₜ = β₁ mₜ₋₁", "      + (1 − β₁) gₜ"]}
          sublabel="EMA of gradient"
        />
        <line
          x1={M_OUT.x}
          y1={M_OUT.y}
          x2={MH_IN.x - 1}
          y2={MH_IN.y}
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#adam-arr-muted)"
        />
        <Box
          box={MH_BOX}
          lines={["m̂ₜ = mₜ", "    / (1 − β₁ᵗ)"]}
          sublabel="bias-corrected"
        />

        {/* Bottom path: vₜ EMA → v̂ₜ bias-corrected */}
        <Box
          box={V_BOX}
          lines={["vₜ = β₂ vₜ₋₁", "      + (1 − β₂) gₜ²"]}
          sublabel="EMA of squared gradient"
        />
        <line
          x1={V_OUT.x}
          y1={V_OUT.y}
          x2={VH_IN.x - 1}
          y2={VH_IN.y}
          stroke={C.muted2}
          strokeWidth="1.5"
          markerEnd="url(#adam-arr-muted)"
        />
        <Box
          box={VH_BOX}
          lines={["v̂ₜ = vₜ", "    / (1 − β₂ᵗ)"]}
          sublabel="bias-corrected"
        />

        {/* Merge: m̂ₜ and v̂ₜ → update box (teal arrows) */}
        <path
          d={bezier(MH_OUT, U_TOP)}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#adam-arr-accent)"
        />
        <path
          d={bezier(VH_OUT, U_BOT)}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.5"
          markerEnd="url(#adam-arr-accent)"
        />

        {/* Update box with teal-highlighted scale-invariant ratio */}
        <rect
          x={UPDATE.x}
          y={UPDATE.y}
          width={UPDATE.w}
          height={UPDATE.h}
          rx="4"
          fill={C.bg2}
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <text
          x={UPDATE.x + UPDATE.w / 2}
          y={UPDATE.y + 28}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
        >
          <tspan fill={C.text}>θ ← θ − η · </tspan>
          <tspan fill={C.accent}>m̂ₜ</tspan>
        </text>
        <text
          x={UPDATE.x + UPDATE.w / 2}
          y={UPDATE.y + 48}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
        >
          <tspan fill={C.text}>/ (</tspan>
          <tspan fill={C.accent}>√v̂ₜ</tspan>
          <tspan fill={C.text}> + ε)</tspan>
        </text>
        <text
          x={UPDATE.x + UPDATE.w / 2}
          y={UPDATE.y + UPDATE.h + 14}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          parameter update
        </text>

        {/* Hyperparameter defaults */}
        <text
          x={UPDATE.x + UPDATE.w / 2}
          y={UPDATE.y + UPDATE.h + 36}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          β₁ = 0.9   β₂ = 0.999   ε = 10⁻⁸
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
        Adam tracks an EMA of the gradient and an EMA of its squared
        magnitude, then steps in the direction of the first scaled by the
        square root of the second.
      </figcaption>
    </figure>
  );
}
