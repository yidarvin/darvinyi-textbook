const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.10)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Small "image" — a stylized building, drawn into a given rect (x,y,w,h)
function ImageContent({ x, y, w, h, stroke = C.muted2, fill = C.bg3 }) {
  // building base
  const bx = x + w * 0.18;
  const by = y + h * 0.45;
  const bw = w * 0.64;
  const bh = h * 0.45;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      {/* sky tint */}
      <rect x={x} y={y} width={w} height={h * 0.5}
            fill="rgba(148,163,184,0.06)" />
      {/* building */}
      <rect x={bx} y={by} width={bw} height={bh}
            fill="rgba(148,163,184,0.10)" stroke={stroke} strokeWidth="1" />
      {/* roof line */}
      <path d={`M ${bx - 4} ${by} L ${x + w / 2} ${y + h * 0.22} L ${bx + bw + 4} ${by}`}
            fill="rgba(148,163,184,0.18)" stroke={stroke} strokeWidth="1" />
      {/* windows */}
      <rect x={bx + bw * 0.12} y={by + bh * 0.20} width={bw * 0.18} height={bh * 0.22}
            fill={stroke} opacity="0.45" />
      <rect x={bx + bw * 0.42} y={by + bh * 0.20} width={bw * 0.18} height={bh * 0.22}
            fill={stroke} opacity="0.45" />
      <rect x={bx + bw * 0.72} y={by + bh * 0.20} width={bw * 0.18} height={bh * 0.22}
            fill={stroke} opacity="0.45" />
      {/* door */}
      <rect x={bx + bw * 0.42} y={by + bh * 0.55} width={bw * 0.16} height={bh * 0.40}
            fill={stroke} opacity="0.55" />
    </g>
  );
}

export default function PatchGANDiscriminator() {
  // Top half — whole-image discriminator
  const TOP_Y_BAND = 80;
  const imgTopX = 70, imgTopY = TOP_Y_BAND - 36, imgTopW = 72, imgTopH = 72;

  // Bottom half — PatchGAN, grid
  const BOT_Y_BAND = 230;
  const imgBotX = 70, imgBotY = BOT_Y_BAND - 36, imgBotW = 72, imgBotH = 72;

  // 4x4 grid scores (visual sample)
  const GRID = [
    [0.81, 0.42, 0.93, 0.68],
    [0.71, 0.25, 0.58, 0.90],
    [0.84, 0.66, 0.31, 0.77],
    [0.55, 0.79, 0.62, 0.48],
  ];

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 360"
        width="100%"
        role="img"
        aria-label="Whole-image discriminator versus PatchGAN — one decision per image vs many decisions per patch"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="pg-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="pg-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Divider line */}
        <line x1="20" y1="170" x2="620" y2="170"
              stroke={C.border} strokeWidth="1" strokeDasharray="3 4" />

        {/* ──────────────── TOP HALF ──────────────── */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text} letterSpacing="0.04em">
          Standard discriminator — one decision
        </text>

        {/* Input image */}
        <g>
          <rect x={imgTopX} y={imgTopY} width={imgTopW} height={imgTopH} rx="4"
                fill={C.bg3} stroke={C.borderLt} strokeWidth="1" />
          <ImageContent x={imgTopX + 1} y={imgTopY + 1} w={imgTopW - 2} h={imgTopH - 2} />
        </g>
        <text x={imgTopX + imgTopW / 2} y={imgTopY + imgTopH + 14}
              textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
          generated image
        </text>

        {/* Arrow into discriminator */}
        <line x1={imgTopX + imgTopW + 8} y1={TOP_Y_BAND}
              x2={245} y2={TOP_Y_BAND}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#pg-arrow)" />

        {/* Discriminator box */}
        <rect x="245" y={TOP_Y_BAND - 18} width="100" height="36" rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1.3" />
        <text x="295" y={TOP_Y_BAND + 4} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          discriminator
        </text>

        {/* Arrow to scalar output */}
        <line x1="345" y1={TOP_Y_BAND} x2="395" y2={TOP_Y_BAND}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#pg-arrow)" />

        {/* Scalar output */}
        <rect x="395" y={TOP_Y_BAND - 14} width="92" height="28" rx="3"
              fill={C.bg3} stroke={C.borderLt} strokeWidth="1" />
        <text x="441" y={TOP_Y_BAND + 4} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}>
          D(x) = 0.73
        </text>

        {/* Top annotation */}
        <text x="320" y="148" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted} fontStyle="italic">
          evaluates the whole image as one entity — loss focuses on global content
        </text>

        {/* ──────────────── BOTTOM HALF ──────────────── */}
        <text x="320" y="195" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.accent} letterSpacing="0.04em">
          PatchGAN — many decisions
        </text>

        {/* Input image with OVERLAPPING receptive-field boxes (not a disjoint grid) */}
        <g>
          <rect x={imgBotX} y={imgBotY} width={imgBotW} height={imgBotH} rx="4"
                fill={C.bg3} stroke={C.accent} strokeWidth="1.3" />
          <ImageContent x={imgBotX + 1} y={imgBotY + 1} w={imgBotW - 2} h={imgBotH - 2} stroke={C.accent} />
          {/* Three overlapping receptive-field squares, each shifted by less than
              its own width — this is the actual PatchGAN geometry: a 70×70
              receptive field slides across a 256×256 image with stride 2,
              so adjacent output positions' receptive fields overlap heavily. */}
          {[
            { dx: 0,  dy: 0,  color: C.accent },
            { dx: 14, dy: 10, color: '#f87171' },
            { dx: 24, dy: -6, color: '#fbbf24' },
          ].map((rf, i) => {
            const rfW = imgBotW * 0.62;
            const rx = imgBotX + 6 + rf.dx;
            const ry = imgBotY + 6 + rf.dy;
            return (
              <rect key={`rf-${i}`} x={rx} y={ry} width={rfW} height={rfW}
                    fill="none" stroke={rf.color} strokeWidth="1.2"
                    strokeDasharray="3 2" opacity="0.85" />
            );
          })}
        </g>
        <text x={imgBotX + imgBotW / 2} y={imgBotY + imgBotH + 14}
              textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.accent}>
          70×70 receptive fields — heavily overlapping
        </text>

        {/* Arrow to shared D */}
        <line x1={imgBotX + imgBotW + 8} y1={BOT_Y_BAND}
              x2={245} y2={BOT_Y_BAND}
              stroke={C.accent} strokeWidth="1" markerEnd="url(#pg-arrow-accent)" />

        {/* Shared D box */}
        <rect x="245" y={BOT_Y_BAND - 18} width="100" height="36" rx="4"
              fill={C.bg2} stroke={C.accent} strokeWidth="1.3" />
        <text x="295" y={BOT_Y_BAND - 2} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          shared
        </text>
        <text x="295" y={BOT_Y_BAND + 11} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          patch-D
        </text>

        {/* Arrow to grid of scores */}
        <line x1="345" y1={BOT_Y_BAND} x2="395" y2={BOT_Y_BAND}
              stroke={C.accent} strokeWidth="1" markerEnd="url(#pg-arrow-accent)" />

        {/* Output: 4×4 illustrative sample of the true 30×30 score grid
            (a 70×70-receptive-field PatchGAN on a 256×256 image produces a
            30×30 output via strided convs — too fine to render cell-by-cell
            here, so this shows a representative corner, not the actual size) */}
        <g>
          {GRID.map((row, ri) =>
            row.map((v, ci) => {
              const cellW = 22, cellH = 14;
              const gx = 395 + ci * (cellW + 1);
              const gy = BOT_Y_BAND - 2 * cellH - 1 + ri * (cellH + 1);
              const highlight = (ri === 0 && ci === 0) || (ri === 0 && ci === 2) ||
                                (ri === 2 && ci === 2);
              return (
                <g key={`s-${ri}-${ci}`}>
                  <rect x={gx} y={gy} width={cellW} height={cellH} rx="1.5"
                        fill={highlight ? C.accentDim : C.bg3}
                        stroke={highlight ? C.accent : C.borderLt}
                        strokeWidth="0.9" />
                  <text x={gx + cellW / 2} y={gy + cellH - 3.5}
                        textAnchor="middle"
                        fontFamily={mono} fontSize="8.5"
                        fill={highlight ? C.accent : C.muted2}>
                    {v.toFixed(2)}
                  </text>
                </g>
              );
            })
          )}
        </g>

        {/* Output grid label */}
        <text x="441" y={BOT_Y_BAND + 38}
              textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted2}>
          4×4 corner of the 30×30 grid · per-patch real/fake
        </text>

        {/* Aggregate */}
        <line x1="487" y1={BOT_Y_BAND}
              x2="525" y2={BOT_Y_BAND}
              stroke={C.accent} strokeWidth="1" markerEnd="url(#pg-arrow-accent)" />
        <rect x="525" y={BOT_Y_BAND - 14} width="80" height="28" rx="3"
              fill={C.bg3} stroke={C.accent} strokeWidth="1" />
        <text x="565" y={BOT_Y_BAND + 4} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.accent}>
          mean → loss
        </text>

        {/* Bottom-half annotation */}
        <text x="320" y="320" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted} fontStyle="italic">
          70×70 RF on a 256×256 image → 30×30 output positions, via strided
          convolutions — not 30×30 disjoint crops
        </text>

        {/* Bottom note */}
        <text x="320" y="346" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}>
          Neighboring receptive fields overlap heavily — this is not a disjoint tiling
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
        PatchGAN scores every receptive-field-sized window of the output — for
        the standard 70×70 configuration on a 256×256 image that's a 30×30 grid
        of heavily overlapping windows, not 30×30 disjoint tiles.
      </figcaption>
    </figure>
  );
}
