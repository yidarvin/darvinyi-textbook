const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  mid:     '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Panel geometry — two panels side-by-side in a 640-wide viewBox
const PANEL_W = 290;
const PANEL_H = 230;
const PANEL_Y = 30;
const LEFT_X  = 20;
const RIGHT_X = 330;

function Axis({ x, y, w, h }) {
  // Faint axis lines
  return (
    <g>
      <line x1={x + 10} y1={y + h - 16} x2={x + w - 10} y2={y + h - 16} stroke={C.border} strokeWidth="1" />
      <line x1={x + 24} y1={y + 12}     x2={x + 24}     y2={y + h - 6}  stroke={C.border} strokeWidth="1" />
    </g>
  );
}

function Dot({ cx, cy, accent }) {
  return (
    <circle cx={cx} cy={cy} r="4" fill={accent ? C.accent : C.text} stroke="none" />
  );
}

function WordLabel({ x, y, text, accent, anchor = 'middle' }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={mono}
      fontSize="11.5"
      fill={accent ? C.accent : C.text}
    >
      {text}
    </text>
  );
}

function PanelTitle({ x, y, text }) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={mono}
      fontSize="11"
      fill={C.muted}
      letterSpacing="0.05em"
    >
      {text}
    </text>
  );
}

export default function AnalogyParallelogram() {
  // ── Left panel: Gender ────────────────────────────────────────────────────
  // Parallelogram corners (inside the panel). Slight tilt for visual interest.
  // TL: man, TR: king (teal), BL: woman, BR: queen
  const L_TL = { x: LEFT_X + 70,  y: PANEL_Y + 60  };
  const L_TR = { x: LEFT_X + 220, y: PANEL_Y + 50  };
  const L_BL = { x: LEFT_X + 80,  y: PANEL_Y + 170 };
  const L_BR = { x: LEFT_X + 230, y: PANEL_Y + 160 };

  // ── Right panel: Capital cities ──────────────────────────────────────────
  // TL: France, TR: Paris, BL: Italy, BR: Rome (teal)
  const R_TL = { x: RIGHT_X + 70,  y: PANEL_Y + 60  };
  const R_TR = { x: RIGHT_X + 220, y: PANEL_Y + 50  };
  const R_BL = { x: RIGHT_X + 80,  y: PANEL_Y + 170 };
  const R_BR = { x: RIGHT_X + 230, y: PANEL_Y + 160 };

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="Two parallelograms illustrating analogy structure in embedding space"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="ap-arr-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
          <marker
            id="ap-arr-dashed"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.mid} />
          </marker>
        </defs>

        {/* ── Left panel frame ── */}
        <rect
          x={LEFT_X}
          y={PANEL_Y}
          width={PANEL_W}
          height={PANEL_H}
          rx="4"
          fill="none"
          stroke={C.border}
          strokeWidth="1"
        />
        <PanelTitle x={LEFT_X + 12} y={PANEL_Y - 8} text="GENDER" />
        <Axis x={LEFT_X} y={PANEL_Y} w={PANEL_W} h={PANEL_H} />

        {/* Parallel arrows (the "royalty" vector) */}
        <line
          x1={L_TL.x} y1={L_TL.y} x2={L_TR.x} y2={L_TR.y}
          stroke={C.accent} strokeWidth="1.5" markerEnd="url(#ap-arr-accent)"
        />
        <line
          x1={L_BL.x} y1={L_BL.y} x2={L_BR.x} y2={L_BR.y}
          stroke={C.accent} strokeWidth="1.5" markerEnd="url(#ap-arr-accent)"
        />

        {/* Dashed completion arrow: woman + (king-man) ≈ queen */}
        <line
          x1={L_BL.x} y1={L_BL.y} x2={L_BR.x - 8} y2={L_BR.y + 2}
          stroke={C.mid}
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity="0.55"
        />

        {/* Dots */}
        <Dot cx={L_TL.x} cy={L_TL.y} />
        <Dot cx={L_TR.x} cy={L_TR.y} accent />
        <Dot cx={L_BL.x} cy={L_BL.y} />
        <Dot cx={L_BR.x} cy={L_BR.y} />

        {/* Labels */}
        <WordLabel x={L_TL.x - 8} y={L_TL.y - 8} text="man"   anchor="end"   />
        <WordLabel x={L_TR.x + 8} y={L_TR.y - 8} text="king"  anchor="start" accent />
        <WordLabel x={L_BL.x - 8} y={L_BL.y + 14} text="woman" anchor="end"   />
        <WordLabel x={L_BR.x + 8} y={L_BR.y + 14} text="queen" anchor="start" />

        {/* Vector annotation */}
        <text
          x={(L_TL.x + L_TR.x) / 2}
          y={(L_TL.y + L_TR.y) / 2 - 8}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={C.accent}
          opacity="0.85"
        >
          royalty
        </text>

        {/* ── Right panel frame ── */}
        <rect
          x={RIGHT_X}
          y={PANEL_Y}
          width={PANEL_W}
          height={PANEL_H}
          rx="4"
          fill="none"
          stroke={C.border}
          strokeWidth="1"
        />
        <PanelTitle x={RIGHT_X + 12} y={PANEL_Y - 8} text="CAPITAL CITIES" />
        <Axis x={RIGHT_X} y={PANEL_Y} w={PANEL_W} h={PANEL_H} />

        {/* Parallel arrows (the "capital of" vector) */}
        <line
          x1={R_TL.x} y1={R_TL.y} x2={R_TR.x} y2={R_TR.y}
          stroke={C.accent} strokeWidth="1.5" markerEnd="url(#ap-arr-accent)"
        />
        <line
          x1={R_BL.x} y1={R_BL.y} x2={R_BR.x} y2={R_BR.y}
          stroke={C.accent} strokeWidth="1.5" markerEnd="url(#ap-arr-accent)"
        />

        {/* Dashed completion arrow: Italy + (Paris-France) ≈ Rome */}
        <line
          x1={R_BL.x} y1={R_BL.y} x2={R_BR.x - 8} y2={R_BR.y + 2}
          stroke={C.mid}
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity="0.55"
        />

        {/* Dots */}
        <Dot cx={R_TL.x} cy={R_TL.y} />
        <Dot cx={R_TR.x} cy={R_TR.y} />
        <Dot cx={R_BL.x} cy={R_BL.y} />
        <Dot cx={R_BR.x} cy={R_BR.y} accent />

        {/* Labels */}
        <WordLabel x={R_TL.x - 8} y={R_TL.y - 8} text="France" anchor="end"   />
        <WordLabel x={R_TR.x + 8} y={R_TR.y - 8} text="Paris"  anchor="start" />
        <WordLabel x={R_BL.x - 8} y={R_BL.y + 14} text="Italy" anchor="end"   />
        <WordLabel x={R_BR.x + 8} y={R_BR.y + 14} text="Rome"  anchor="start" accent />

        {/* Vector annotation */}
        <text
          x={(R_TL.x + R_TR.x) / 2}
          y={(R_TL.y + R_TR.y) / 2 - 8}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={C.accent}
          opacity="0.85"
        >
          capital-of
        </text>

        {/* Bottom annotation across both panels */}
        <text
          x="320"
          y="295"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          opposite sides are parallel — the same vector connects both pairs
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
        Linear directions in embedding space encode semantic relationships — but
        only because those relationships appeared in the training text, biases and all.
      </figcaption>
    </figure>
  );
}
