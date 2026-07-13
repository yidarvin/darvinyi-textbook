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

const CLASSES = ['cat', 'dog', 'fox', 'wolf', 'car', 'truck'];
const HARD = [1.00, 0.00, 0.00, 0.00, 0.00, 0.00];
const SOFT = [0.55, 0.20, 0.12, 0.08, 0.03, 0.02];

const PANEL_W = 280;
const PANEL_PAD_L = 32;
const PANEL_PAD_R = 16;
const BARS_W = PANEL_W - PANEL_PAD_L - PANEL_PAD_R;       // 232
const SLOT_W = BARS_W / CLASSES.length;                    // ~38.7
const BAR_W = 24;
const BASELINE_Y = 218;
const MAX_BAR_H = 130;

function slotX(panelX0, i) {
  return panelX0 + PANEL_PAD_L + i * SLOT_W;
}

function Bar({ x, prob, isTarget }) {
  const h = prob * MAX_BAR_H;
  const fill = isTarget ? C.accent : C.muted2;
  const opacity = isTarget ? 1 : 0.65;
  return (
    <g>
      {prob > 0 ? (
        <rect
          x={x}
          y={BASELINE_Y - h}
          width={BAR_W}
          height={h}
          fill={fill}
          fillOpacity={opacity}
          rx="2"
        />
      ) : (
        // empty-slot stub
        <line
          x1={x + 2}
          y1={BASELINE_Y - 1}
          x2={x + BAR_W - 2}
          y2={BASELINE_Y - 1}
          stroke={C.border}
          strokeWidth="1"
        />
      )}
      {prob >= 0.02 && (
        <text
          x={x + BAR_W / 2}
          y={BASELINE_Y - h - 5}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={isTarget ? C.accent : C.muted2}
        >
          {prob.toFixed(2)}
        </text>
      )}
    </g>
  );
}

function Panel({ panelX0, title, probs, annotation }) {
  return (
    <g>
      {/* Title */}
      <text
        x={panelX0 + PANEL_W / 2}
        y={32}
        textAnchor="middle"
        fontFamily={sans}
        fontSize="12"
        fill={C.text}
      >
        {title}
      </text>

      {/* Y-axis tick line at top (prob=1.0 reference) */}
      <line
        x1={panelX0 + PANEL_PAD_L - 6}
        y1={BASELINE_Y - MAX_BAR_H}
        x2={panelX0 + PANEL_PAD_L - 2}
        y2={BASELINE_Y - MAX_BAR_H}
        stroke={C.muted}
        strokeWidth="1"
      />
      <text
        x={panelX0 + PANEL_PAD_L - 8}
        y={BASELINE_Y - MAX_BAR_H + 4}
        textAnchor="end"
        fontFamily={mono}
        fontSize="9.5"
        fill={C.muted}
      >
        1.0
      </text>
      <text
        x={panelX0 + PANEL_PAD_L - 8}
        y={BASELINE_Y + 4}
        textAnchor="end"
        fontFamily={mono}
        fontSize="9.5"
        fill={C.muted}
      >
        0
      </text>

      {/* Baseline */}
      <line
        x1={panelX0 + PANEL_PAD_L - 4}
        y1={BASELINE_Y}
        x2={panelX0 + PANEL_W - PANEL_PAD_R + 4}
        y2={BASELINE_Y}
        stroke={C.border}
        strokeWidth="1.5"
      />

      {/* Bars + class labels */}
      {CLASSES.map((cls, i) => {
        const x = slotX(panelX0, i) + (SLOT_W - BAR_W) / 2;
        const isTarget = i === 0;
        return (
          <g key={`b-${panelX0}-${i}`}>
            <Bar x={x} prob={probs[i]} isTarget={isTarget} />
            <text
              x={x + BAR_W / 2}
              y={BASELINE_Y + 14}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="10"
              fill={C.muted2}
            >
              {cls}
            </text>
          </g>
        );
      })}

      {/* Group bracket: animals vs vehicles (right panel only via annotation) */}
      {/* Annotation below */}
      <text
        x={panelX0 + PANEL_W / 2}
        y={BASELINE_Y + 38}
        textAnchor="middle"
        fontFamily={sans}
        fontSize="11"
        fill={C.muted2}
        fontStyle="italic"
      >
        {annotation}
      </text>
    </g>
  );
}

export default function DistillationSoftLabels() {
  // Layout: two panels of width 280 with 40px gap between, 20px outer margin
  const LEFT_X  = 20;
  const RIGHT_X = LEFT_X + PANEL_W + 40;

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="Hard one-hot label vs. soft teacher distribution over six classes"
        style={{ display: 'block' }}
      >
        <Panel
          panelX0={LEFT_X}
          title="Hard target (y_true)"
          probs={HARD}
          annotation="no inter-class information"
        />
        <Panel
          panelX0={RIGHT_X}
          title="Soft target (teacher at T=4)"
          probs={SOFT}
          annotation={'dog/fox/wolf → "dark knowledge"'}
        />

        {/* Input caption centered at bottom */}
        <text
          x={320}
          y={296}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted}
        >
          input: image of a cat
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
        At T &gt; 1, the teacher's soft distribution reveals which wrong classes are
        close to the right one — the structural information distillation transfers.
      </figcaption>
    </figure>
  );
}
