const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.18)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const LEFT_CX = 160;
const RIGHT_CX = 480;

// Higher capsule (top of panel)
const HC_Y_TOP = 70;
const HC_W = 70;
const HC_H = 38;

// Lower capsules (bottom of panel)
const LC_Y_TOP = 220;
const LC_W = 38;
const LC_H = 22;
const LC_DX = 80; // spread between adjacent lower capsules

// Arrow utility — draws a small vector glyph (arrow) starting at (x,y) with given angle/length
function VectorGlyph({ x, y, angleDeg, length = 14, color = C.muted2, strokeWidth = 1.4 }) {
  const a = (angleDeg * Math.PI) / 180;
  const x2 = x + length * Math.cos(a);
  const y2 = y + length * Math.sin(a);
  const ah = 5;
  const ux = Math.cos(a), uy = Math.sin(a);
  const px = -uy, py = ux;
  const bx = x2 - ux * ah, by = y2 - uy * ah;
  const w = ah * 0.5;
  return (
    <g>
      <line x1={x} y1={y} x2={x2} y2={y2}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <polygon
        points={`${x2},${y2} ${bx + px * w},${by + py * w} ${bx - px * w},${by - py * w}`}
        fill={color}
      />
    </g>
  );
}

// Prediction arrow — long arrow from lower capsule top → higher-capsule region
function PredictionArrow({ fromX, fromY, toX, toY, color, opacity = 1, label, labelOffset = { dx: -10, dy: -3 } }) {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ah = 7;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const bx = toX - ux * ah, by = toY - uy * ah;
  const w = ah * 0.45;
  // midpoint for label
  const mx = fromX + dx * 0.55;
  const my = fromY + dy * 0.55;
  return (
    <g opacity={opacity}>
      <line x1={fromX} y1={fromY} x2={toX} y2={toY}
            stroke={color} strokeWidth="1.4" />
      <polygon
        points={`${toX},${toY} ${bx + px * w},${by + py * w} ${bx - px * w},${by - py * w}`}
        fill={color}
      />
      {label && (
        <text x={mx + labelOffset.dx} y={my + labelOffset.dy}
              fontFamily={mono} fontSize="9" fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}

function HigherCapsule({ cx, highlight, vectorAngleDeg }) {
  const x = cx - HC_W / 2;
  const stroke = highlight ? C.accent : C.borderLt;
  const fill = highlight ? C.accentDim : C.bg2;
  return (
    <g>
      <rect x={x} y={HC_Y_TOP} width={HC_W} height={HC_H} rx="4"
            fill={fill} stroke={stroke} strokeWidth="1.5" />
      {/* internal vector glyph */}
      <VectorGlyph
        x={cx - 12}
        y={HC_Y_TOP + HC_H / 2}
        angleDeg={vectorAngleDeg}
        length={22}
        color={highlight ? C.accent : C.muted2}
        strokeWidth={highlight ? 1.7 : 1.3}
      />
      <text x={cx} y={HC_Y_TOP - 6} textAnchor="middle"
            fontFamily={mono} fontSize="10" fill={highlight ? C.accent : C.muted2}>
        v_j
      </text>
    </g>
  );
}

function LowerCapsule({ cx, label, vectorAngleDeg }) {
  const x = cx - LC_W / 2;
  return (
    <g>
      <rect x={x} y={LC_Y_TOP} width={LC_W} height={LC_H} rx="3"
            fill={C.bg2} stroke={C.borderLt} strokeWidth="1.3" />
      <VectorGlyph
        x={cx - 8}
        y={LC_Y_TOP + LC_H / 2}
        angleDeg={vectorAngleDeg}
        length={14}
        color={C.muted2}
        strokeWidth={1.2}
      />
      <text x={cx} y={LC_Y_TOP + LC_H + 11} textAnchor="middle"
            fontFamily={mono} fontSize="9.5" fill={C.muted2}>
        {label}
      </text>
    </g>
  );
}

export default function RoutingByAgreement() {
  // Per-panel layout: 3 lower capsules at xs centered around cx, higher capsule at cx top.
  const lowerXOffsets = [-LC_DX, 0, LC_DX];

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 380"
        width="100%"
        role="img"
        aria-label="Routing by agreement: high-coupling vs low-coupling scenarios"
        style={{ display: 'block' }}
      >
        {/* ── Top label ────────────────────────── */}
        <text x="320" y="20" textAnchor="middle"
              fontFamily={sans} fontSize="12" fill={C.text}
              fontStyle="italic">
          After 3 iterations of routing
        </text>

        {/* ── Panel borders ────────────────────── */}
        <rect x="20" y="36" width="290" height="328" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />
        <rect x="330" y="36" width="290" height="328" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />

        {/* ── Panel titles ─────────────────────── */}
        <text x={LEFT_CX} y="54" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          Agreement — high coupling
        </text>
        <text x={RIGHT_CX} y="54" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}>
          Disagreement — low coupling
        </text>

        {/* ───────── LEFT PANEL: agreement ───────── */}
        <HigherCapsule cx={LEFT_CX} highlight={true} vectorAngleDeg={-35} />
        {lowerXOffsets.map((dx, i) => (
          <LowerCapsule
            key={`L-low-${i}`}
            cx={LEFT_CX + dx}
            label={`u_${i + 1}`}
            vectorAngleDeg={-30 + (i - 1) * 5}
          />
        ))}

        {/* Prediction arrows all converging near same direction */}
        {/* Each lower capsule's "prediction" ends near the higher capsule's vector tip */}
        {lowerXOffsets.map((dx, i) => {
          const fromX = LEFT_CX + dx;
          const fromY = LC_Y_TOP - 2;
          // All three converge to similar target around higher capsule's vector tip
          const toX = LEFT_CX + 6 + (i - 1) * 6;
          const toY = HC_Y_TOP + HC_H / 2 - 4;
          return (
            <PredictionArrow
              key={`L-pred-${i}`}
              fromX={fromX} fromY={fromY}
              toX={toX} toY={toY}
              color={C.accent}
              opacity={0.85}
              label={`û_{j|${i + 1}}`}
              labelOffset={{ dx: i === 0 ? 8 : i === 2 ? -32 : -28, dy: -2 }}
            />
          );
        })}

        {/* Below-panel annotation */}
        <text x={LEFT_CX} y="282" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted2}
              fontStyle="italic">
          predictions agree
        </text>
        <text x={LEFT_CX} y="298" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.accent}>
          → c_ij increase
        </text>

        {/* Coupling coefficients */}
        <text x={LEFT_CX} y="324" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}>
          c_1j = 0.42  ·  c_2j = 0.39
        </text>
        <text x={LEFT_CX} y="340" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}>
          c_3j = 0.19
        </text>
        <text x={LEFT_CX} y="356" textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted}
              fontStyle="italic">
          higher capsule strongly activated
        </text>

        {/* ───────── RIGHT PANEL: disagreement ───────── */}
        <HigherCapsule cx={RIGHT_CX} highlight={false} vectorAngleDeg={-10} />
        {lowerXOffsets.map((dx, i) => (
          <LowerCapsule
            key={`R-low-${i}`}
            cx={RIGHT_CX + dx}
            label={`u_${i + 1}`}
            vectorAngleDeg={[-60, 10, 50][i]}
          />
        ))}

        {/* Prediction arrows scattering in different directions */}
        {lowerXOffsets.map((dx, i) => {
          const fromX = RIGHT_CX + dx;
          const fromY = LC_Y_TOP - 2;
          // Scattered endpoints — three very different directions
          const scatterTargets = [
            { x: RIGHT_CX - 60, y: HC_Y_TOP + 8 },
            { x: RIGHT_CX + 18, y: HC_Y_TOP - 8 },
            { x: RIGHT_CX + 70, y: HC_Y_TOP + 18 },
          ];
          const { x: toX, y: toY } = scatterTargets[i];
          return (
            <PredictionArrow
              key={`R-pred-${i}`}
              fromX={fromX} fromY={fromY}
              toX={toX} toY={toY}
              color={C.muted2}
              opacity={0.8}
              label={`û_{j|${i + 1}}`}
              labelOffset={{ dx: i === 0 ? 6 : i === 2 ? -34 : -30, dy: -2 }}
            />
          );
        })}

        {/* Below-panel annotation */}
        <text x={RIGHT_CX} y="282" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted2}
              fontStyle="italic">
          predictions disagree
        </text>
        <text x={RIGHT_CX} y="298" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          → c_ij stay low
        </text>

        {/* Coupling coefficients */}
        <text x={RIGHT_CX} y="324" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}>
          c_1j = 0.34  ·  c_2j = 0.33
        </text>
        <text x={RIGHT_CX} y="340" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}>
          c_3j = 0.33
        </text>
        <text x={RIGHT_CX} y="356" textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted}
              fontStyle="italic">
          no specialization — weakly activated
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
        Lower-level capsules predict where higher-level capsules' outputs should
        sit. When predictions agree, routing concentrates; when they disagree,
        routing stays diffuse.
      </figcaption>
    </figure>
  );
}
