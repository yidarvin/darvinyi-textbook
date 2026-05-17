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

const COL_W = 110;
const COL_XS = [40, 180, 320];
const COL_TOP = 60;
const CELL_H = 28;

const STEPS = [
  {
    title: 't = 1  ·  "The"',
    cells: [{ label: '(K₁, V₁)', state: 'new' }],
    note: 'compute new K, V;',
    note2: 'cache them',
  },
  {
    title: 't = 2  ·  "cat"',
    cells: [
      { label: '(K₁, V₁)', state: 'cached' },
      { label: '(K₂, V₂)', state: 'new' },
    ],
    note: 'reuse K₁,V₁;',
    note2: 'append K₂,V₂',
  },
  {
    title: 't = 3  ·  "sat"',
    cells: [
      { label: '(K₁, V₁)', state: 'cached' },
      { label: '(K₂, V₂)', state: 'cached' },
      { label: '(K₃, V₃)', state: 'new' },
    ],
    note: 'reuse all prior;',
    note2: 'compute only the new',
  },
];

export default function KVCacheReuse() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 340"
        width="100%"
        role="img"
        aria-label="KV cache growth during autoregressive decoding"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="kvc-arr"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted2} />
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
          Cache state across three generation steps (one layer)
        </text>

        {STEPS.map((step, si) => {
          const px = COL_XS[si];
          const colHeight = 4 * CELL_H + 24;
          return (
            <g key={`step-${si}`}>
              <text
                x={px + COL_W / 2}
                y={COL_TOP - 14}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="11"
                fill={C.text}
              >
                {step.title}
              </text>
              <rect
                x={px}
                y={COL_TOP}
                width={COL_W}
                height={colHeight}
                rx="4"
                fill="none"
                stroke={C.border}
                strokeWidth="1"
              />
              {step.cells.map((cell, ci) => {
                const cy = COL_TOP + 12 + ci * CELL_H;
                const isNew = cell.state === 'new';
                return (
                  <g key={`cell-${si}-${ci}`}>
                    <rect
                      x={px + 8}
                      y={cy}
                      width={COL_W - 16}
                      height={CELL_H - 4}
                      rx="4"
                      fill={isNew ? C.accentDim : C.bg2}
                      stroke={isNew ? C.accent : C.border}
                      strokeWidth="1.5"
                    />
                    <text
                      x={px + COL_W / 2}
                      y={cy + (CELL_H - 4) / 2 + 4}
                      textAnchor="middle"
                      fontFamily={mono}
                      fontSize="10.5"
                      fill={isNew ? C.accent : C.muted2}
                    >
                      {cell.label}
                    </text>
                  </g>
                );
              })}
              <text
                x={px + COL_W / 2}
                y={COL_TOP + colHeight + 22}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                {step.note}
              </text>
              <text
                x={px + COL_W / 2}
                y={COL_TOP + colHeight + 36}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                {step.note2}
              </text>
            </g>
          );
        })}

        {/* arrows between columns */}
        {[0, 1].map((i) => {
          const x1 = COL_XS[i] + COL_W + 6;
          const x2 = COL_XS[i + 1] - 6;
          const y = COL_TOP + 60;
          return (
            <line
              key={`flow-${i}`}
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke={C.muted2}
              strokeWidth="1"
              markerEnd="url(#kvc-arr)"
            />
          );
        })}

        {/* continuation: arrow then ellipsis after last column */}
        <line
          x1={COL_XS[2] + COL_W + 6}
          y1={COL_TOP + 60}
          x2={COL_XS[2] + COL_W + 32}
          y2={COL_TOP + 60}
          stroke={C.muted2}
          strokeWidth="1"
          markerEnd="url(#kvc-arr)"
        />
        <text
          x={COL_XS[2] + COL_W + 56}
          y={COL_TOP + 64}
          fontFamily={mono}
          fontSize="18"
          fill={C.muted2}
        >
          ⋮
        </text>

        {/* memory footprint */}
        <text
          x={320}
          y={282}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          cache size = 2 · L · h · d_head · T · bytes
        </text>
        <text
          x={320}
          y={306}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.accent}
        >
          LLaMA-70B at T = 128K  →  ≈ 40 GB per request
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
        Each new token computes its own K and V; all previous K, V are reused
        from cache. The cache grows linearly with sequence length.
      </figcaption>
    </figure>
  );
}
