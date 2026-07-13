const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.16)',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
  blockFill:'#1a1a1a',
  blockFC: '#262626',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Drawing area for each stack
const STACK_TOP = 70;
const STACK_BOT = 320;
const STACK_H = STACK_BOT - STACK_TOP; // 250

const STACK_CX = [90, 240, 400, 560];

function Stack({ cx, blocks, blockWidth, skipIndices = [] }) {
  const n = blocks.length;
  const gap = n > 30 ? 0.4 : n > 10 ? 1.4 : 2.5;
  const totalGap = (n - 1) * gap;
  const blockH = Math.max(2.2, (STACK_H - totalGap) / n);

  return (
    <g>
      {/* Stack outline */}
      <rect
        x={cx - blockWidth / 2 - 4}
        y={STACK_TOP - 4}
        width={blockWidth + 8}
        height={STACK_H + 8}
        fill="none"
        stroke={C.border}
        strokeWidth="0.8"
        rx="4"
      />

      {/* Blocks */}
      {blocks.map((b, i) => {
        const y = STACK_TOP + i * (blockH + gap);
        const fill = b.type === 'fc' ? C.blockFC : C.blockFill;
        return (
          <rect
            key={i}
            x={cx - blockWidth / 2}
            y={y}
            width={blockWidth}
            height={blockH}
            fill={fill}
            stroke={C.borderLt}
            strokeWidth="0.5"
            rx="1.5"
          />
        );
      })}

      {/* Skip-connection arrows (drawn to the right side of the stack) */}
      {skipIndices.map(([from, to], i) => {
        const y1 = STACK_TOP + from * (blockH + gap) + blockH / 2;
        const y2 = STACK_TOP + to * (blockH + gap) + blockH / 2;
        const rightEdge = cx + blockWidth / 2;
        const bulge = rightEdge + 9;
        return (
          <g key={`skip-${i}`}>
            <path
              d={`M ${rightEdge} ${y1} Q ${bulge} ${(y1 + y2) / 2} ${rightEdge} ${y2}`}
              fill="none"
              stroke={C.accent}
              strokeWidth="1.2"
              opacity="0.85"
            />
            <text
              x={bulge + 4}
              y={(y1 + y2) / 2 + 3}
              fontFamily={mono}
              fontSize="8"
              fill={C.accent}
            >
              +
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default function ImageNetArchitectures() {
  // AlexNet: 5 conv + 3 fc = 8 blocks
  const alex = [
    { type: 'conv' }, { type: 'conv' }, { type: 'conv' }, { type: 'conv' },
    { type: 'conv' }, { type: 'fc' }, { type: 'fc' }, { type: 'fc' },
  ];
  // VGG-16
  const vgg = Array.from({ length: 16 }, (_, i) => ({
    type: i >= 13 ? 'fc' : 'conv',
  }));
  // ResNet-50
  const resnet = Array.from({ length: 50 }, () => ({ type: 'conv' }));
  // ResNet-50 skip pairs (every 3rd group)
  const resnetSkips = [];
  for (let i = 1; i < 50; i += 3) {
    if (i + 2 < 50) resnetSkips.push([i, i + 2]);
  }
  // EfficientNet-B7 (~50 mobile inverted bottleneck blocks; we draw 28 to keep it readable)
  const efficient = Array.from({ length: 28 }, () => ({ type: 'conv' }));

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 400"
        width="100%"
        role="img"
        aria-label="Four CNN architectures: AlexNet, VGG-16, ResNet-50, EfficientNet-B7"
        style={{ display: 'block' }}
      >
        {/* Overall title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          ImageNet's decade of architectural search
        </text>

        {/* Per-stack titles */}
        <text x={STACK_CX[0]} y={42} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          AlexNet
        </text>
        <text x={STACK_CX[0]} y={55} textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted}>
          2012 · 8 layers
        </text>

        <text x={STACK_CX[1]} y={42} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          VGG-16
        </text>
        <text x={STACK_CX[1]} y={55} textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted}>
          2015 · 16 layers
        </text>

        <text x={STACK_CX[2]} y={42} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          ResNet-50
        </text>
        <text x={STACK_CX[2]} y={55} textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted}>
          2016 · 50 layers
        </text>

        <text x={STACK_CX[3]} y={42} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          EfficientNet-B7
        </text>
        <text x={STACK_CX[3]} y={55} textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted}>
          2019 · compound scaled
        </text>

        {/* Stacks */}
        <Stack cx={STACK_CX[0]} blocks={alex} blockWidth={50} />
        <Stack cx={STACK_CX[1]} blocks={vgg} blockWidth={42} />
        <Stack cx={STACK_CX[2]} blocks={resnet} blockWidth={36} skipIndices={resnetSkips} />
        <Stack cx={STACK_CX[3]} blocks={efficient} blockWidth={64} />

        {/* "wider channels" callout on EfficientNet (single block highlighted) */}
        {(() => {
          // pick a block index and outline it
          const n = efficient.length;
          const gap = 1.4;
          const blockH = (STACK_H - (n - 1) * gap) / n;
          const idx = 12;
          const y = STACK_TOP + idx * (blockH + gap);
          return (
            <g>
              <rect
                x={STACK_CX[3] - 64 / 2 - 1}
                y={y - 0.5}
                width={64 + 2}
                height={blockH + 1}
                fill="none"
                stroke={C.accent}
                strokeWidth="1.2"
                rx="2"
              />
              <line
                x1={STACK_CX[3] + 32 + 2}
                y1={y + blockH / 2}
                x2={STACK_CX[3] + 50}
                y2={y + blockH / 2}
                stroke={C.accent}
                strokeWidth="0.9"
                strokeDasharray="2,2"
              />
              <text
                x={STACK_CX[3] + 52}
                y={y + blockH / 2 + 3.5}
                fontFamily={mono}
                fontSize="9"
                fill={C.accent}
              >
                wider
              </text>
            </g>
          );
        })()}

        {/* Bottom stat lines */}
        <text x={STACK_CX[0]} y={STACK_BOT + 22} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          60M params
        </text>
        <text x={STACK_CX[0]} y={STACK_BOT + 36} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          84% top-5
        </text>

        <text x={STACK_CX[1]} y={STACK_BOT + 22} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          138M params
        </text>
        <text x={STACK_CX[1]} y={STACK_BOT + 36} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          92% top-5
        </text>

        <text x={STACK_CX[2]} y={STACK_BOT + 22} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          25M params
        </text>
        <text x={STACK_CX[2]} y={STACK_BOT + 36} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          93% top-5
        </text>

        <text x={STACK_CX[3]} y={STACK_BOT + 22} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          66M params
        </text>
        <text x={STACK_CX[3]} y={STACK_BOT + 36} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          97% top-5
        </text>

        {/* Teal callout label for the skip-connection innovation */}
        <text x={STACK_CX[2]} y={STACK_BOT + 56} textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.accent}
              fontStyle="italic">
          ↑ skip connections
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
        Each generation found a different lever — depth (VGG), trainability
        (ResNet's skip connections), or compound scaling (EfficientNet) —
        before transformers reset the search.
      </figcaption>
    </figure>
  );
}
