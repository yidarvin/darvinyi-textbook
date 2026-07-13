const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.14)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Two panels: left = CNN (invariant), right = Capsule (equivariant)
const LEFT_CX = 160;
const RIGHT_CX = 480;
const FACE_R = 20;

function Face({ cx, cy, rotateDeg = 0, stroke = C.muted2 }) {
  return (
    <g transform={`rotate(${rotateDeg} ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={FACE_R}
              fill={C.bg3} stroke={stroke} strokeWidth="1.5" />
      {/* eyes */}
      <circle cx={cx - 7} cy={cy - 5} r={2.2} fill={stroke} />
      <circle cx={cx + 7} cy={cy - 5} r={2.2} fill={stroke} />
      {/* nose */}
      <line x1={cx} y1={cy - 1} x2={cx} y2={cy + 4}
            stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      {/* mouth */}
      <path d={`M ${cx - 6} ${cy + 9} Q ${cx} ${cy + 13} ${cx + 6} ${cy + 9}`}
            stroke={stroke} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </g>
  );
}

function VectorArrow({ x, y, angleDeg, length, color, highlight }) {
  const a = (angleDeg * Math.PI) / 180;
  const x2 = x + length * Math.cos(a);
  const y2 = y + length * Math.sin(a);
  // arrowhead
  const ah = 6;
  const ux = Math.cos(a), uy = Math.sin(a);
  const px = -uy, py = ux;
  const bx = x2 - ux * ah, by = y2 - uy * ah;
  const w = ah * 0.5;
  return (
    <g>
      <line x1={x} y1={y} x2={x2} y2={y2}
            stroke={color} strokeWidth={highlight ? '2' : '1.5'} strokeLinecap="round" />
      <polygon
        points={`${x2},${y2} ${bx + px * w},${by + py * w} ${bx - px * w},${by - py * w}`}
        fill={color}
      />
    </g>
  );
}

export default function InvarianceVsEquivariance() {
  // Face positions
  const faceY = 90;
  // Left panel face centers
  const LF1 = LEFT_CX - 50, LF2 = LEFT_CX + 50;
  // Right panel face centers
  const RF1 = RIGHT_CX - 50, RF2 = RIGHT_CX + 50;

  // Output centers (below faces)
  const outY = 175;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 330"
        width="100%"
        role="img"
        aria-label="CNN invariance vs capsule equivariance under input rotation"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="ive-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* ── Overall title ───────────────────────────── */}
        <text x="320" y="20" textAnchor="middle"
              fontFamily={sans} fontSize="12" fill={C.text}
              fontStyle="italic">
          What pooling discards, capsules preserve
        </text>

        {/* ── Panel borders ───────────────────────────── */}
        <rect x="20" y="36" width="290" height="270" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />
        <rect x="330" y="36" width="290" height="270" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />

        {/* ── Panel titles ────────────────────────────── */}
        <text x={LEFT_CX} y="54" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          CNN + pooling: invariant
        </text>
        <text x={RIGHT_CX} y="54" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          Capsule network: equivariant
        </text>

        {/* ── Faces row ───────────────────────────────── */}
        <Face cx={LF1} cy={faceY} rotateDeg={0} />
        <Face cx={LF2} cy={faceY} rotateDeg={45} />
        <Face cx={RF1} cy={faceY} rotateDeg={0} />
        <Face cx={RF2} cy={faceY} rotateDeg={45} />

        {/* Rotation arrow + label between the two faces, each panel */}
        <line x1={LF1 + FACE_R + 4} y1={faceY} x2={LF2 - FACE_R - 4} y2={faceY}
              stroke={C.muted} strokeWidth="1" markerEnd="url(#ive-arrow)" />
        <text x={LEFT_CX} y={faceY - 9} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          rotate 45°
        </text>

        <line x1={RF1 + FACE_R + 4} y1={faceY} x2={RF2 - FACE_R - 4} y2={faceY}
              stroke={C.muted} strokeWidth="1" markerEnd="url(#ive-arrow)" />
        <text x={RIGHT_CX} y={faceY - 9} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          rotate 45°
        </text>

        {/* ── LEFT PANEL OUTPUTS: two identical scalars ───────── */}
        {[LF1, LF2].map((cx, i) => (
          <g key={`scalar-${i}`}>
            <rect x={cx - 24} y={outY - 14} width="48" height="28" rx="4"
                  fill={C.bg2} stroke={C.borderLt} strokeWidth="1.3" />
            <text x={cx} y={outY + 4} textAnchor="middle"
                  fontFamily={mono} fontSize="11" fill={C.muted2}>
              0.94
            </text>
          </g>
        ))}
        <text x={LEFT_CX} y={outY + 32} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          output: "face!" — identical
        </text>
        <text x={LEFT_CX} y={outY + 70} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          pose information discarded —
        </text>
        <text x={LEFT_CX} y={outY + 84} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          network cannot tell which orientation
        </text>

        {/* ── RIGHT PANEL OUTPUTS: two equal-magnitude vectors, different directions ───────── */}
        {/* Vector glyph background boxes */}
        <rect x={RF1 - 26} y={outY - 22} width="52" height="44" rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1.3" />
        <rect x={RF2 - 26} y={outY - 22} width="52" height="44" rx="4"
              fill={C.bg2} stroke={C.accent} strokeWidth="1.5" />

        {/* Origin dot + vector for face 1 (upright → pointing right) */}
        <circle cx={RF1} cy={outY} r={1.8} fill={C.muted2} />
        <VectorArrow x={RF1} y={outY} angleDeg={0} length={18}
                     color={C.muted2} />
        {/* Origin dot + vector for face 2 (rotated → pointing diagonally — teal highlight) */}
        <circle cx={RF2} cy={outY} r={1.8} fill={C.accent} />
        <VectorArrow x={RF2} y={outY} angleDeg={-45} length={18}
                     color={C.accent} highlight />

        <text x={RIGHT_CX} y={outY + 38} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          ‖v‖ equal, direction differs
        </text>
        <text x={RIGHT_CX} y={outY + 70} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          same magnitude (entity present),
        </text>
        <text x={RIGHT_CX} y={outY + 84} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          different direction (different pose)
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
        Pooling builds invariance — the same answer regardless of how the input
        is transformed. Capsules build equivariance — the answer's direction
        tracks the transformation.
      </figcaption>
    </figure>
  );
}
