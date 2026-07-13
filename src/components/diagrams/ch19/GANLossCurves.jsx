const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  bg2:      '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const PANEL_W = 196;
const PANEL_GAP = 14;
const PANEL_START_X = 18;

const PANEL_TOP = 64;
const PANEL_BOT = 220;
const PANEL_H = PANEL_BOT - PANEL_TOP; // 156

const N = 60;
const Y_MAX = 4;

function panelLeft(idx) {
  return PANEL_START_X + idx * (PANEL_W + PANEL_GAP);
}
function plotLeft(idx) {
  return panelLeft(idx) + 22;
}
function plotRight(idx) {
  return panelLeft(idx) + PANEL_W - 10;
}
function yToPx(y) {
  return PANEL_BOT - Math.min(Math.max(y, 0), Y_MAX) / Y_MAX * PANEL_H;
}

function buildPath(idx, fn) {
  const left = plotLeft(idx);
  const right = plotRight(idx);
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = left + t * (right - left);
    const y = yToPx(fn(t * 10));
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
}

// ── Panel curves (deterministic, no randomness) ──
// Panel 0: healthy training — anti-correlated oscillation, balanced
const healthyD = t => 0.85 + 0.22 * Math.sin(1.7 * t) + 0.08 * Math.sin(4.5 * t + 1.1);
const healthyG = t => 1.10 - 0.24 * Math.sin(1.7 * t + 0.3) + 0.07 * Math.cos(4.0 * t + 0.5);

// Panel 1: discriminator dominance — D collapses to 0, G flatlines high
const domD = t => 0.85 * Math.exp(-0.55 * t) + 0.05 + 0.015 * Math.sin(7 * t);
const domG = t => 0.9 + 2.6 * (1 - Math.exp(-0.6 * t)) + 0.06 * Math.sin(8 * t + 0.5);

// Panel 2: mode collapse — looks healthy on the loss curves
const collapseD = t => 0.80 + 0.20 * Math.sin(2.0 * t + 0.4) + 0.06 * Math.sin(5.2 * t);
const collapseG = t => 1.05 - 0.21 * Math.sin(2.0 * t + 0.7) + 0.06 * Math.cos(4.7 * t + 0.3);

function Panel({ idx, title, dFn, gFn, annotation1, annotation2, highlight, children }) {
  const x = panelLeft(idx);
  const strokeColor = highlight ? C.accent : C.border;
  const strokeWidth = highlight ? 1.4 : 1;
  return (
    <g>
      {/* Panel frame */}
      <rect
        x={x}
        y={PANEL_TOP - 32}
        width={PANEL_W}
        height={PANEL_H + 48}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        rx="4"
      />
      {/* Panel title */}
      <text x={x + PANEL_W / 2} y={PANEL_TOP - 14} textAnchor="middle"
            fontFamily={mono} fontSize="11"
            fill={highlight ? C.accent : C.text}>
        {title}
      </text>

      {/* Plot area axes */}
      <line x1={plotLeft(idx)} y1={PANEL_BOT}
            x2={plotRight(idx)} y2={PANEL_BOT}
            stroke={C.border} strokeWidth="1" />
      <line x1={plotLeft(idx)} y1={PANEL_TOP}
            x2={plotLeft(idx)} y2={PANEL_BOT}
            stroke={C.border} strokeWidth="1" />

      {/* Axis labels */}
      <text x={plotLeft(idx) - 6} y={PANEL_TOP + 4} textAnchor="end"
            fontFamily={mono} fontSize="9" fill={C.muted}>
        loss
      </text>
      <text x={plotRight(idx)} y={PANEL_BOT + 12} textAnchor="end"
            fontFamily={mono} fontSize="9" fill={C.muted}>
        steps →
      </text>

      {/* D curve (muted grey) */}
      <path d={buildPath(idx, dFn)} fill="none"
            stroke={C.muted2} strokeWidth="1.4" opacity="0.85" />
      {/* G curve (teal) */}
      <path d={buildPath(idx, gFn)} fill="none"
            stroke={C.accent} strokeWidth="1.6" />

      {/* Optional inset (panel 2) */}
      {children}

      {/* Annotation below plot */}
      <text x={x + PANEL_W / 2} y={PANEL_BOT + 30} textAnchor="middle"
            fontFamily={sans} fontSize="10" fill={C.muted2}>
        {annotation1}
      </text>
      {annotation2 && (
        <text x={x + PANEL_W / 2} y={PANEL_BOT + 44} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted}>
          {annotation2}
        </text>
      )}
    </g>
  );
}

export default function GANLossCurves() {
  // Inset "samples gallery" — six identical glyphs in panel 3
  const insetCx = panelLeft(2) + PANEL_W / 2;
  const insetTop = PANEL_TOP + 14;
  const glyphSize = 14;
  const glyphGap = 4;
  const glyphCount = 6;
  const insetWidth = glyphCount * glyphSize + (glyphCount - 1) * glyphGap;
  const insetLeft = insetCx - insetWidth / 2;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 290"
        width="100%"
        role="img"
        aria-label="Three GAN training loss patterns: healthy, discriminator dominance, mode collapse"
        style={{ display: 'block' }}
      >
        {/* Overall title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          What GAN training failure looks like in practice
        </text>

        {/* Legend */}
        <g>
          <line x1={195} y1={38} x2={215} y2={38}
                stroke={C.muted2} strokeWidth="1.4" opacity="0.85" />
          <text x={219} y={41} fontFamily={mono} fontSize="10" fill={C.muted}>
            D loss
          </text>
          <line x1={285} y1={38} x2={305} y2={38}
                stroke={C.accent} strokeWidth="1.6" />
          <text x={309} y={41} fontFamily={mono} fontSize="10" fill={C.text}>
            G loss
          </text>
        </g>

        <Panel
          idx={0}
          title="Healthy training"
          dFn={healthyD}
          gFn={healthyG}
          annotation1="D and G hover near equilibrium —"
          annotation2="neither winning"
          highlight
        />

        <Panel
          idx={1}
          title="Discriminator dominance"
          dFn={domD}
          gFn={domG}
          annotation1="D too confident → G receives no gradient"
          annotation2="→ no progress"
        />

        <Panel
          idx={2}
          title="Mode collapse"
          dFn={collapseD}
          gFn={collapseG}
          annotation1="losses look fine — but G produces"
          annotation2="near-identical outputs (invisible in loss)"
        >
          {/* Inset samples gallery — six identical glyphs */}
          <g>
            <rect
              x={insetLeft - 6}
              y={insetTop - 6}
              width={insetWidth + 12}
              height={glyphSize + 12}
              fill={C.bg2}
              stroke={C.borderLt}
              strokeWidth="0.8"
              rx="3"
            />
            {Array.from({ length: glyphCount }).map((_, i) => {
              const gx = insetLeft + i * (glyphSize + glyphGap);
              return (
                <g key={i}>
                  <rect
                    x={gx}
                    y={insetTop}
                    width={glyphSize}
                    height={glyphSize}
                    fill="#0a0a0a"
                    stroke={C.borderLt}
                    strokeWidth="0.5"
                    rx="1.5"
                  />
                  {/* Identical "face" glyph — a circle inside each square */}
                  <circle
                    cx={gx + glyphSize / 2}
                    cy={insetTop + glyphSize / 2 - 1}
                    r="3.2"
                    fill="none"
                    stroke={C.muted2}
                    strokeWidth="0.9"
                  />
                  <line
                    x1={gx + 4}
                    y1={insetTop + glyphSize - 3}
                    x2={gx + glyphSize - 4}
                    y2={insetTop + glyphSize - 3}
                    stroke={C.muted2}
                    strokeWidth="0.9"
                  />
                </g>
              );
            })}
            <text
              x={insetCx}
              y={insetTop + glyphSize + 16}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="8.5"
              fill={C.muted}
            >
              G's samples
            </text>
          </g>
        </Panel>
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
        Healthy GAN training shows oscillating, balanced losses; mode collapse
        and discriminator dominance produce characteristic patterns that
        practitioners learn to recognize.
      </figcaption>
    </figure>
  );
}
