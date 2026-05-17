const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.10)',
  red:      '#f87171',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Small horse-glyph (silhouette)
function HorseDot({ cx, cy, color = C.muted2, opacity = 0.85, scale = 1 }) {
  const s = scale;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {/* body */}
      <ellipse cx="0" cy="0" rx="6.5" ry="3" fill={color} opacity={opacity} />
      {/* neck */}
      <path d="M 4 -1 L 7 -4 L 8 -1 z" fill={color} opacity={opacity} />
      {/* head */}
      <circle cx="8" cy="-4" r="2" fill={color} opacity={opacity} />
      {/* legs */}
      <line x1="-3" y1="3" x2="-3" y2="6" stroke={color} strokeWidth="1.3" opacity={opacity} />
      <line x1="3"  y1="3" x2="3"  y2="6" stroke={color} strokeWidth="1.3" opacity={opacity} />
    </g>
  );
}

// Small zebra-glyph — horse silhouette with stripes
function ZebraDot({ cx, cy, color = C.muted2, opacity = 0.85, scale = 1 }) {
  const s = scale;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="6.5" ry="3" fill={color} opacity={opacity} />
      {/* stripes */}
      <line x1="-4" y1="-2.5" x2="-4" y2="2.5" stroke={C.bg3} strokeWidth="0.9" />
      <line x1="-1.5" y1="-3" x2="-1.5" y2="3" stroke={C.bg3} strokeWidth="0.9" />
      <line x1="1.5"  y1="-3" x2="1.5"  y2="3" stroke={C.bg3} strokeWidth="0.9" />
      <line x1="4"  y1="-2.5" x2="4"  y2="2.5" stroke={C.bg3} strokeWidth="0.9" />
      {/* neck/head */}
      <path d="M 4 -1 L 7 -4 L 8 -1 z" fill={color} opacity={opacity} />
      <circle cx="8" cy="-4" r="2" fill={color} opacity={opacity} />
      <line x1="-3" y1="3" x2="-3" y2="6" stroke={color} strokeWidth="1.3" opacity={opacity} />
      <line x1="3"  y1="3" x2="3"  y2="6" stroke={color} strokeWidth="1.3" opacity={opacity} />
    </g>
  );
}

// Row layout
function Row({ y, label, labelColor, accent }) {
  return (
    <g>
      <rect x="20" y={y - 38} width="600" height="76" rx="6"
            fill={accent ? C.accentDim : 'transparent'}
            stroke={accent ? C.accent : C.border}
            strokeWidth="1" strokeDasharray={accent ? 'none' : '3 3'} />
      <text x="38" y={y - 22} fontFamily={mono} fontSize="10.5" fill={labelColor}>
        {label}
      </text>
    </g>
  );
}

export default function CycleConstraintGeometry() {
  // Domain X region (left) and Y region (right) -- per row, varying y center
  // Three rows
  const rowYs = [70, 175, 280];

  // X-domain rect (per row): x∈[80, 230]
  // Y-domain rect (per row): x∈[400, 550]
  // Centered "x" axis between rows; arrows go left→right (G).

  const xRect = { x: 80, w: 150 };
  const yRect = { x: 400, w: 150 };

  // Horse positions (per row, varied for visual interest)
  const horses = [
    { dx: 30, dy: -12, scale: 1.2 },
    { dx: 65, dy: 14,  scale: 1.0 },
    { dx: 100, dy: -8, scale: 0.9 },
    { dx: 125, dy: 18, scale: 1.1 },
  ];

  // Zebras row 1 — all map to one (degenerate)
  const zebrasDegenerateTarget = { dx: 75, dy: 0, scale: 1.1 };

  // Zebras row 2 — scattered (arbitrary)
  const zebrasArbitrary = [
    { dx: 110, dy: 15, scale: 0.9 },
    { dx: 30,  dy: -10, scale: 1.1 },
    { dx: 80,  dy: 22, scale: 0.85 },
    { dx: 130, dy: -18, scale: 1.2 },
  ];

  // Zebras row 3 — cycle-consistent (structure preserved: same dx/dy relative shape)
  const zebrasCycle = horses.map(h => ({ dx: h.dx, dy: h.dy, scale: h.scale }));

  // Helper: pos in X panel
  const xpX = (row, dx) => xRect.x + dx;
  const xpY = (row, dy) => rowYs[row] + dy;
  const ypX = (row, dx) => yRect.x + dx;
  const ypY = (row, dy) => rowYs[row] + dy;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 400"
        width="100%"
        role="img"
        aria-label="Why cycle consistency picks out structure-preserving translations among possible mappings"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="cc-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="cc-arrow-red" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.red} />
          </marker>
          <marker id="cc-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Domain labels (top) */}
        <text x={xRect.x + xRect.w / 2} y="18" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          X (horses)
        </text>
        <text x={yRect.x + yRect.w / 2} y="18" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          Y (zebras)
        </text>

        {/* ── Row 1: Degenerate ────────────────────────── */}
        <Row y={rowYs[0]} label="degenerate: every horse → same zebra" labelColor={C.red} />
        {/* X panel content */}
        <rect x={xRect.x} y={rowYs[0] - 30} width={xRect.w} height="60" rx="4"
              fill={C.bg3} stroke={C.borderLt} strokeWidth="0.8" />
        <rect x={yRect.x} y={rowYs[0] - 30} width={yRect.w} height="60" rx="4"
              fill={C.bg3} stroke={C.borderLt} strokeWidth="0.8" />
        {horses.map((h, i) => (
          <HorseDot key={`h0-${i}`}
                    cx={xpX(0, h.dx)} cy={xpY(0, h.dy)}
                    color={C.muted2} scale={h.scale * 0.7} />
        ))}
        <ZebraDot
          cx={ypX(0, zebrasDegenerateTarget.dx)}
          cy={ypY(0, zebrasDegenerateTarget.dy)}
          color={C.red}
          scale={zebrasDegenerateTarget.scale * 0.75}
        />
        {horses.map((h, i) => (
          <line key={`a0-${i}`}
                x1={xpX(0, h.dx) + 8} y1={xpY(0, h.dy)}
                x2={ypX(0, zebrasDegenerateTarget.dx) - 8} y2={ypY(0, zebrasDegenerateTarget.dy)}
                stroke={C.red} strokeWidth="0.9" opacity="0.55"
                markerEnd="url(#cc-arrow-red)" />
        ))}
        <text x={320} y={rowYs[0] - 18} textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.red}>
          G
        </text>
        <text x={320} y={rowYs[0] + 26} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted} fontStyle="italic">
          fools D_Y but no info preserved
        </text>

        {/* ── Row 2: Arbitrary ─────────────────────────── */}
        <Row y={rowYs[1]} label="arbitrary: random pairings, no preserved structure" labelColor={C.muted2} />
        <rect x={xRect.x} y={rowYs[1] - 30} width={xRect.w} height="60" rx="4"
              fill={C.bg3} stroke={C.borderLt} strokeWidth="0.8" />
        <rect x={yRect.x} y={rowYs[1] - 30} width={yRect.w} height="60" rx="4"
              fill={C.bg3} stroke={C.borderLt} strokeWidth="0.8" />
        {horses.map((h, i) => (
          <HorseDot key={`h1-${i}`}
                    cx={xpX(1, h.dx)} cy={xpY(1, h.dy)}
                    color={C.muted2} scale={h.scale * 0.7} />
        ))}
        {zebrasArbitrary.map((z, i) => (
          <ZebraDot key={`z1-${i}`}
                    cx={ypX(1, z.dx)} cy={ypY(1, z.dy)}
                    color={C.muted2} scale={z.scale * 0.7} />
        ))}
        {/* arrows: horse i → zebra (i+2) mod 4 (visually random) */}
        {horses.map((h, i) => {
          const z = zebrasArbitrary[(i + 2) % zebrasArbitrary.length];
          return (
            <line key={`a1-${i}`}
                  x1={xpX(1, h.dx) + 8} y1={xpY(1, h.dy)}
                  x2={ypX(1, z.dx) - 8} y2={ypY(1, z.dy)}
                  stroke={C.muted2} strokeWidth="0.9" opacity="0.55"
                  markerEnd="url(#cc-arrow)" />
          );
        })}
        <text x={320} y={rowYs[1] - 18} textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted2}>
          G
        </text>
        <text x={320} y={rowYs[1] + 26} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted} fontStyle="italic">
          each horse maps somewhere, but pairings are random
        </text>

        {/* ── Row 3: Cycle-consistent ─────────────────── */}
        <Row y={rowYs[2]} label="cycle-consistent: G preserves enough that F can invert" labelColor={C.accent} accent />
        <rect x={xRect.x} y={rowYs[2] - 30} width={xRect.w} height="60" rx="4"
              fill={C.bg3} stroke={C.accent} strokeWidth="0.9" opacity="0.85" />
        <rect x={yRect.x} y={rowYs[2] - 30} width={yRect.w} height="60" rx="4"
              fill={C.bg3} stroke={C.accent} strokeWidth="0.9" opacity="0.85" />
        {horses.map((h, i) => (
          <HorseDot key={`h2-${i}`}
                    cx={xpX(2, h.dx)} cy={xpY(2, h.dy)}
                    color={C.muted2} scale={h.scale * 0.7} />
        ))}
        {zebrasCycle.map((z, i) => (
          <ZebraDot key={`z2-${i}`}
                    cx={ypX(2, z.dx)} cy={ypY(2, z.dy)}
                    color={C.accent} scale={z.scale * 0.7} />
        ))}
        {/* Forward: horse i -> zebra i  (preserves shape) */}
        {horses.map((h, i) => {
          const z = zebrasCycle[i];
          return (
            <g key={`a2-${i}`}>
              <line
                x1={xpX(2, h.dx) + 8} y1={xpY(2, h.dy)}
                x2={ypX(2, z.dx) - 8} y2={ypY(2, z.dy)}
                stroke={C.accent} strokeWidth="1" opacity="0.85"
                markerEnd="url(#cc-arrow-accent)" />
              {/* Reverse F: thin dashed back */}
              <line
                x1={ypX(2, z.dx) - 8} y1={ypY(2, z.dy) + 6}
                x2={xpX(2, h.dx) + 8} y2={xpY(2, h.dy) + 6}
                stroke={C.accent} strokeWidth="0.7" opacity="0.55"
                strokeDasharray="3 3" markerEnd="url(#cc-arrow-accent)" />
            </g>
          );
        })}
        <text x={320} y={rowYs[2] - 18} textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.accent}>
          G → · ← F
        </text>
        <text x={320} y={rowYs[2] + 26} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.accent} fontStyle="italic">
          content preserved, only style changes
        </text>

        {/* Bottom annotation */}
        <text x="320" y="362" textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          L_cyc = ‖ F(G(x)) − x ‖₁ + ‖ G(F(y)) − y ‖₁
        </text>
        <text x="320" y="382" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}>
          penalizes mappings that lose information about the input
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
        Without paired data, infinitely many mappings can fool the
        discriminator; cycle consistency picks out the ones that preserve
        enough information about the input to be invertible.
      </figcaption>
    </figure>
  );
}
