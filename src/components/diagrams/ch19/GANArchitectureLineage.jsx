const C = {
  text:      '#e5e7eb',
  muted:     '#6b7280',
  muted2:    '#94a3b8',
  border:    '#2e2e2e',
  borderLt:  '#3a3a3a',
  accent:    '#2dd4bf',
  accentDim: 'rgba(45,212,191,0.16)',
  blockFill: '#1a1a1a',
  blockAlt:  '#262626',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const ENTRY_CX = [64, 192, 320, 448, 576];

const STACK_TOP = 80;
const STACK_BOT = 200;
const STACK_H = STACK_BOT - STACK_TOP; // 120

const TITLE_Y = 46;
const SUB_Y = 60;

// ── Stack renderers per entry ────────────────────────────────

// Simple uniform stack of N blocks
function UniformStack({ cx, blocks, blockW, highlight }) {
  const gap = 2;
  const blockH = (STACK_H - (blocks - 1) * gap) / blocks;
  const stroke = highlight ? C.accent : C.borderLt;
  return (
    <g>
      <rect
        x={cx - blockW / 2 - 4}
        y={STACK_TOP - 4}
        width={blockW + 8}
        height={STACK_H + 8}
        fill="none"
        stroke={highlight ? C.accent : C.border}
        strokeWidth={highlight ? 1.2 : 0.8}
        rx="4"
      />
      {Array.from({ length: blocks }).map((_, i) => (
        <rect
          key={i}
          x={cx - blockW / 2}
          y={STACK_TOP + i * (blockH + gap)}
          width={blockW}
          height={blockH}
          fill={i % 2 === 0 ? C.blockFill : C.blockAlt}
          stroke={stroke}
          strokeWidth="0.5"
          rx="1.5"
        />
      ))}
    </g>
  );
}

// Pyramid (progressive growing) — blocks get wider toward the top
function PyramidStack({ cx }) {
  const blocks = 6;
  const gap = 2;
  const blockH = (STACK_H - (blocks - 1) * gap) / blocks;
  return (
    <g>
      <rect
        x={cx - 42}
        y={STACK_TOP - 4}
        width={84}
        height={STACK_H + 8}
        fill="none"
        stroke={C.border}
        strokeWidth="0.8"
        rx="4"
      />
      {Array.from({ length: blocks }).map((_, i) => {
        // i=0 is BOTTOM (narrow); i=blocks-1 is TOP (wide)
        const idxFromBottom = blocks - 1 - i; // 0 at top, n-1 at bottom (paint order top→bottom)
        const widthFrac = 0.30 + 0.70 * (1 - i / (blocks - 1)); // i=0 (top of paint) → wide
        const w = 72 * widthFrac;
        return (
          <rect
            key={i}
            x={cx - w / 2}
            y={STACK_TOP + i * (blockH + gap)}
            width={w}
            height={blockH}
            fill={i % 2 === 0 ? C.blockFill : C.blockAlt}
            stroke={C.borderLt}
            strokeWidth="0.5"
            rx="1.5"
          />
        );
      })}
      {/* Arrow indicating growth direction */}
      <line
        x1={cx + 50}
        y1={STACK_BOT}
        x2={cx + 50}
        y2={STACK_TOP + 4}
        stroke={C.muted}
        strokeWidth="0.9"
        markerEnd="url(#archArrow)"
      />
      <text
        x={cx + 56}
        y={STACK_TOP + STACK_H / 2 + 3}
        fontFamily={mono}
        fontSize="8.5"
        fill={C.muted}
      >
        grow
      </text>
    </g>
  );
}

// StyleGAN: mapping network on left → main generator stack with AdaIN markers
function StyleGANStack({ cx, highlight }) {
  const mapW = 14;
  const mapH = 80;
  const mapX = cx - 40;
  const mapY = STACK_TOP + (STACK_H - mapH) / 2;
  const mainCx = cx + 12;
  const mainW = 28;
  const blocks = 5;
  const gap = 4;
  const blockH = (STACK_H - (blocks - 1) * gap) / blocks;

  const frameStroke = highlight ? C.accent : C.border;
  const frameWidth = highlight ? 1.2 : 0.8;

  return (
    <g>
      <rect
        x={cx - 50}
        y={STACK_TOP - 4}
        width={100}
        height={STACK_H + 8}
        fill={highlight ? C.accentDim : 'none'}
        stroke={frameStroke}
        strokeWidth={frameWidth}
        rx="4"
      />
      {/* Mapping network — small narrow stack */}
      <rect
        x={mapX}
        y={mapY}
        width={mapW}
        height={mapH}
        fill={C.blockAlt}
        stroke={C.borderLt}
        strokeWidth="0.5"
        rx="2"
      />
      <text
        x={mapX + mapW / 2}
        y={mapY - 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="8"
        fill={C.muted2}
      >
        map
      </text>
      <text
        x={mapX + mapW / 2}
        y={mapY + mapH + 9}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="8"
        fill={highlight ? C.accent : C.muted2}
      >
        z'
      </text>

      {/* Arrow from mapping → each AdaIN modulation */}
      {Array.from({ length: blocks }).map((_, i) => {
        const by = STACK_TOP + i * (blockH + gap) + blockH / 2;
        return (
          <g key={`arr-${i}`}>
            <line
              x1={mapX + mapW + 1}
              y1={by}
              x2={mainCx - mainW / 2 - 4}
              y2={by}
              stroke={highlight ? C.accent : C.muted2}
              strokeWidth="0.7"
              opacity="0.8"
            />
            {/* AdaIN marker */}
            <circle
              cx={mainCx - mainW / 2 - 6}
              cy={by}
              r="2.2"
              fill={highlight ? C.accent : C.muted2}
            />
          </g>
        );
      })}

      {/* Main generator stack */}
      {Array.from({ length: blocks }).map((_, i) => (
        <rect
          key={`b-${i}`}
          x={mainCx - mainW / 2}
          y={STACK_TOP + i * (blockH + gap)}
          width={mainW}
          height={blockH}
          fill={i % 2 === 0 ? C.blockFill : C.blockAlt}
          stroke={C.borderLt}
          strokeWidth="0.5"
          rx="1.5"
        />
      ))}
    </g>
  );
}

// StyleGAN2/3 stack — similar to StyleGAN with a refinement indicator
function StyleGAN23Stack({ cx }) {
  const mainW = 28;
  const blocks = 5;
  const gap = 4;
  const blockH = (STACK_H - (blocks - 1) * gap) / blocks;
  return (
    <g>
      <rect
        x={cx - 28}
        y={STACK_TOP - 4}
        width={56}
        height={STACK_H + 8}
        fill="none"
        stroke={C.border}
        strokeWidth="0.8"
        rx="4"
      />
      {Array.from({ length: blocks }).map((_, i) => (
        <rect
          key={i}
          x={cx - mainW / 2}
          y={STACK_TOP + i * (blockH + gap)}
          width={mainW}
          height={blockH}
          fill={i % 2 === 0 ? C.blockFill : C.blockAlt}
          stroke={C.borderLt}
          strokeWidth="0.5"
          rx="1.5"
        />
      ))}
      {/* Small refinement tick marks */}
      {[0, 2, 4].map(i => {
        const by = STACK_TOP + i * (blockH + gap) + blockH / 2;
        return (
          <line
            key={i}
            x1={cx + mainW / 2 + 2}
            y1={by}
            x2={cx + mainW / 2 + 7}
            y2={by}
            stroke={C.muted2}
            strokeWidth="0.9"
          />
        );
      })}
    </g>
  );
}

function EntryLabels({ cx, title, year, lines, highlight }) {
  return (
    <g>
      <text x={cx} y={TITLE_Y} textAnchor="middle"
            fontFamily={mono} fontSize="11"
            fill={highlight ? C.accent : C.text}>
        {title}
      </text>
      <text x={cx} y={SUB_Y} textAnchor="middle"
            fontFamily={sans} fontSize="9.5" fill={C.muted}>
        {year}
      </text>
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={STACK_BOT + 18 + i * 13}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="9.5"
          fill={i === 0 ? (highlight ? C.accent : C.muted2) : C.muted}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export default function GANArchitectureLineage() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 360"
        width="100%"
        role="img"
        aria-label="GAN architectural lineage: DCGAN, WGAN-GP, ProGAN, StyleGAN, StyleGAN2/3"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="archArrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted} />
          </marker>
          <marker
            id="qualityArrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Overall title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          The architectural lineage that drove GAN sample quality
        </text>

        {/* Entry 1: DCGAN */}
        <UniformStack cx={ENTRY_CX[0]} blocks={4} blockW={36} />
        <EntryLabels
          cx={ENTRY_CX[0]}
          title="DCGAN"
          year="2016"
          lines={[
            'first stable architecture',
            '64×64',
            'BatchNorm + LeakyReLU',
          ]}
        />

        {/* Entry 2: WGAN-GP */}
        <UniformStack cx={ENTRY_CX[1]} blocks={4} blockW={36} />
        <EntryLabels
          cx={ENTRY_CX[1]}
          title="WGAN-GP"
          year="2017"
          lines={[
            'gradient penalty',
            '128×128',
            'objective fix only',
          ]}
        />

        {/* Entry 3: ProGAN */}
        <PyramidStack cx={ENTRY_CX[2]} />
        <EntryLabels
          cx={ENTRY_CX[2]}
          title="ProGAN"
          year="2018"
          lines={[
            'progressive growing',
            '4×4 → 1024×1024',
            'add layers as you train',
          ]}
        />

        {/* Entry 4: StyleGAN (highlighted) */}
        <StyleGANStack cx={ENTRY_CX[3]} highlight />
        <EntryLabels
          cx={ENTRY_CX[3]}
          title="StyleGAN"
          year="2019"
          lines={[
            'style-based generator',
            'AdaIN per layer',
            'noise injection',
          ]}
          highlight
        />

        {/* Entry 5: StyleGAN2/3 */}
        <StyleGAN23Stack cx={ENTRY_CX[4]} />
        <EntryLabels
          cx={ENTRY_CX[4]}
          title="StyleGAN2/3"
          year="2020–2021"
          lines={[
            'artifacts fixed (SG2)',
            'rotation equivariance (SG3)',
            '',
          ]}
        />

        {/* Quality trend arrow */}
        <line
          x1={36}
          y1={310}
          x2={604}
          y2={310}
          stroke={C.accent}
          strokeWidth="1.4"
          markerEnd="url(#qualityArrow)"
        />
        <text x="320" y="332" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.accent}
              fontStyle="italic">
          sample quality dramatically improved through architecture, not just objective
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
        GAN sample quality advanced primarily through architectural innovation —
        most notably ProGAN's progressive growing and StyleGAN's style-based
        generator.
      </figcaption>
    </figure>
  );
}
