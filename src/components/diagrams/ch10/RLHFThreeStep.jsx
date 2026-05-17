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

const W = 640;
const H = 470;

// Three horizontal panels with comfortable gaps so cross-flow arrows have room.
const PANEL_W = 192;
const PANEL_H = 300;
const PANEL_Y = 78;
const P1_X = 14;
const P2_X = 224;
const P3_X = 434;

// Inter-panel horizontal arrow channels (y positions chosen so they don't
// cross any internal box of a panel they pass next to).
const CHAN_TOP_Y    = PANEL_Y + 92;   // P1 → P2 (input feed-forward)
const CHAN_MID_Y    = PANEL_Y + 92;   // P2 → P3 (input feed-forward)
// Skip channel: P1 → P3, routed below all panels.
const SKIP_Y        = PANEL_Y + PANEL_H + 28;

function Box({ x, y, w, h, label, sub, accent, dashed }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={C.bg2}
        stroke={accent ? C.accent : C.border}
        strokeWidth="1.5"
        strokeDasharray={dashed ? "3,4" : undefined}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + (sub ? -3 : 4)}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="10.5"
        fill={accent ? C.accent : C.text}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function VArrow({ x, y1, y2, color = C.muted }) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2 - 6} stroke={color} strokeWidth="1.2" />
      <polygon points={`${x - 4},${y2 - 7} ${x + 4},${y2 - 7} ${x},${y2}`} fill={color} />
    </g>
  );
}

function HArrow({ x1, x2, y, color = C.muted }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 6} y2={y} stroke={color} strokeWidth="1.2" />
      <polygon points={`${x2 - 7},${y - 4} ${x2 - 7},${y + 4} ${x2},${y}`} fill={color} />
    </g>
  );
}

export default function RLHFThreeStep() {
  // Vertical content y-positions inside each panel (consistent across panels)
  const inputY    = PANEL_Y + 22;
  const inputCapY = PANEL_Y + 80;
  const midBoxY   = PANEL_Y + 108;
  const midBoxH   = 44;
  const arrowY1   = midBoxY + midBoxH;
  const outBoxY   = PANEL_Y + 188;
  const outBoxH   = 44;
  const noteY     = PANEL_Y + 268;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="The three-stage InstructGPT RLHF pipeline"
        style={{ display: 'block' }}
      >
        {/* Panel backgrounds */}
        {[P1_X, P2_X, P3_X].map((x, i) => (
          <rect
            key={i}
            x={x}
            y={PANEL_Y}
            width={PANEL_W}
            height={PANEL_H}
            rx="6"
            fill="none"
            stroke={C.border}
            strokeWidth="1"
            strokeDasharray="3,4"
          />
        ))}

        {/* Panel titles */}
        {[
          { x: P1_X, num: 'STEP 1', name: 'SFT' },
          { x: P2_X, num: 'STEP 2', name: 'Reward Model' },
          { x: P3_X, num: 'STEP 3', name: 'PPO' },
        ].map((p, i) => (
          <g key={i}>
            <text x={p.x + PANEL_W / 2} y={PANEL_Y - 26} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted} letterSpacing="0.1em">
              {p.num}
            </text>
            <text x={p.x + PANEL_W / 2} y={PANEL_Y - 10} textAnchor="middle" fontFamily={mono} fontSize="12" fill={C.text}>
              {p.name}
            </text>
          </g>
        ))}

        {/* ── Panel 1: SFT ── */}
        {/* Input icon: stack of three small boxes */}
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={P1_X + 58 + i * 6}
            y={inputY + i * 4}
            width={64}
            height={16}
            rx="2"
            fill={C.bg2}
            stroke={C.muted}
            strokeWidth="1"
          />
        ))}
        <text x={P1_X + PANEL_W / 2} y={inputCapY} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          human demonstrations
        </text>
        <Box x={P1_X + 28} y={midBoxY} w={PANEL_W - 56} h={midBoxH} label="base LM" />
        <VArrow x={P1_X + PANEL_W / 2} y1={arrowY1} y2={outBoxY} />
        <Box x={P1_X + 28} y={outBoxY} w={PANEL_W - 56} h={outBoxH} label="π_SFT" sub="SFT policy" />
        <text x={P1_X + PANEL_W / 2} y={noteY} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          ~10K–1M examples
        </text>

        {/* ── Panel 2: Reward Model ── */}
        {/* Input: pairwise preferences */}
        <rect x={P2_X + 32} y={inputY} width={50} height={20} rx="2" fill={C.bg2} stroke={C.muted} strokeWidth="1" />
        <text x={P2_X + 57} y={inputY + 14} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted2}>y_w</text>
        <text x={P2_X + 95} y={inputY + 15} textAnchor="middle" fontFamily={mono} fontSize="13" fill={C.text}>{'>'}</text>
        <rect x={P2_X + 110} y={inputY} width={50} height={20} rx="2" fill={C.bg2} stroke={C.muted} strokeWidth="1" />
        <text x={P2_X + 135} y={inputY + 14} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted2}>y_l</text>
        <text x={P2_X + PANEL_W / 2} y={inputCapY} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          pairwise preferences
        </text>
        <Box x={P2_X + 14} y={midBoxY} w={PANEL_W - 28} h={midBoxH} label="train reward model" />
        <VArrow x={P2_X + PANEL_W / 2} y1={arrowY1} y2={outBoxY} />
        <Box x={P2_X + 28} y={outBoxY} w={PANEL_W - 56} h={outBoxH} label="r_φ(x, y)" sub="reward model" />
        <text x={P2_X + PANEL_W / 2} y={noteY} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          humans rank pairs
        </text>

        {/* ── Panel 3: PPO ── */}
        <text x={P3_X + PANEL_W / 2} y={inputY + 10} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.text}>
          π_SFT + r_φ
        </text>
        <text x={P3_X + PANEL_W / 2} y={inputCapY} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          inputs from Step 1 &amp; 2
        </text>
        {/* PPO loop box with circular arrow */}
        <rect
          x={P3_X + 14}
          y={midBoxY - 6}
          width={PANEL_W - 28}
          height={66}
          rx="6"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        {/* Circular arrow indicator */}
        <path
          d={`M ${P3_X + 32} ${midBoxY + 18} a 10 10 0 1 1 -0.1 0`}
          fill="none"
          stroke={C.muted2}
          strokeWidth="1.4"
        />
        <polygon
          points={`${P3_X + 32},${midBoxY + 16} ${P3_X + 28},${midBoxY + 12} ${P3_X + 36},${midBoxY + 12}`}
          fill={C.muted2}
        />
        <text x={P3_X + 50} y={midBoxY + 22} fontFamily={mono} fontSize="10.5" fill={C.text}>
          PPO loop
        </text>
        <text x={P3_X + PANEL_W / 2} y={midBoxY + 44} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted2}>
          max  E[ r_φ − β · KL(π_θ ‖ π_SFT) ]
        </text>

        <VArrow x={P3_X + PANEL_W / 2} y1={midBoxY + 66} y2={outBoxY} />
        <Box x={P3_X + 28} y={outBoxY} w={PANEL_W - 56} h={outBoxH} label="π_RLHF" sub="aligned policy" accent />
        <text x={P3_X + PANEL_W / 2} y={noteY} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          KL anchors π_θ near π_SFT
        </text>

        {/* ── Inter-panel horizontal arrows in the gaps ── */}
        {/* P1 → P2 */}
        <HArrow x1={P1_X + PANEL_W + 2} x2={P2_X - 2} y={outBoxY + outBoxH / 2} />
        <text
          x={(P1_X + PANEL_W + P2_X) / 2}
          y={outBoxY + outBoxH / 2 - 8}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          samples
        </text>

        {/* P2 → P3 */}
        <HArrow x1={P2_X + PANEL_W + 2} x2={P3_X - 2} y={outBoxY + outBoxH / 2} />
        <text
          x={(P2_X + PANEL_W + P3_X) / 2}
          y={outBoxY + outBoxH / 2 - 8}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          r_φ
        </text>

        {/* P1 → P3 skip routed below all panels */}
        {(() => {
          const startX = P1_X + PANEL_W / 2;
          const endX = P3_X + PANEL_W / 2;
          const dipY = SKIP_Y;
          const panelBottom = PANEL_Y + PANEL_H;
          // Down stub from P1 bottom, across, up stub into P3 bottom.
          return (
            <g>
              <path
                d={`M ${startX} ${panelBottom} L ${startX} ${dipY} L ${endX} ${dipY} L ${endX} ${panelBottom + 8}`}
                fill="none"
                stroke={C.muted}
                strokeWidth="1.2"
                strokeDasharray="4,3"
              />
              <polygon
                points={`${endX - 4},${panelBottom + 8} ${endX + 4},${panelBottom + 8} ${endX},${panelBottom}`}
                fill={C.muted}
              />
              <text
                x={(startX + endX) / 2}
                y={dipY + 16}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10"
                fill={C.muted}
              >
                π_SFT  ·  init policy + KL reference
              </text>
            </g>
          );
        })()}
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
        The InstructGPT RLHF pipeline. DPO collapses this three-stage process
        into a single classification loss with no explicit reward model.
      </figcaption>
    </figure>
  );
}
