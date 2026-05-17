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

// Vector length in svg units
const VLEN = 58;
// Original vector angle (radians, math convention: counter-clockwise from +x)
const THETA0 = Math.PI / 4;       // 45° starting angle
const ROT    = (35 * Math.PI) / 180; // rotation step per position
const AXIS_HALF = 72;

function rotPoint(cx, cy, len, angle) {
  // SVG y is inverted vs. math y
  return [cx + len * Math.cos(angle), cy - len * Math.sin(angle)];
}

function Vector({ cx, cy, angle, len, color, dashed, label, labelOffset }) {
  const [x, y] = rotPoint(cx, cy, len, angle);
  return (
    <g>
      <line
        x1={cx}
        y1={cy}
        x2={x}
        y2={y}
        stroke={color}
        strokeWidth="1.8"
        strokeDasharray={dashed ? '4,3' : undefined}
        markerEnd={`url(#rope-arr-${dashed ? 'muted' : 'accent'})`}
      />
      {label && (
        <text
          x={x + (labelOffset?.[0] ?? 6)}
          y={y + (labelOffset?.[1] ?? -4)}
          fontFamily={mono}
          fontSize="10"
          fill={color}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function AngleArc({ cx, cy, fromAngle, toAngle, radius, color, label, labelRadius }) {
  // Sweep arc from fromAngle to toAngle (math angles, counter-clockwise)
  const [x1, y1] = rotPoint(cx, cy, radius, fromAngle);
  const [x2, y2] = rotPoint(cx, cy, radius, toAngle);
  // SVG arc: large-arc-flag = 0 if delta < 180°, sweep-flag = 0 because y is inverted (math CCW = SVG CW visually)
  const delta = toAngle - fromAngle;
  const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;
  // For math-CCW rotation in SVG, sweep should be 0 (since y is flipped).
  const sweep = delta > 0 ? 0 : 1;
  const midAngle = (fromAngle + toAngle) / 2;
  const [lx, ly] = rotPoint(cx, cy, labelRadius ?? radius + 12, midAngle);
  return (
    <g>
      <path
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
      />
      {label && (
        <text
          x={lx}
          y={ly + 3}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={color}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Plane({ cx, cy, title, subtitle }) {
  return (
    <g>
      {/* Axes */}
      <line x1={cx - AXIS_HALF} y1={cy} x2={cx + AXIS_HALF} y2={cy} stroke={C.border} strokeWidth="1" />
      <line x1={cx} y1={cy - AXIS_HALF} x2={cx} y2={cy + AXIS_HALF} stroke={C.border} strokeWidth="1" />
      {/* axis labels */}
      <text x={cx + AXIS_HALF + 4} y={cy + 4} fontFamily={mono} fontSize="9.5" fill={C.muted}>x0</text>
      <text x={cx + 4} y={cy - AXIS_HALF - 2} fontFamily={mono} fontSize="9.5" fill={C.muted}>x1</text>
      {/* origin tick */}
      <circle cx={cx} cy={cy} r="1.8" fill={C.muted} />
      {/* title above panel */}
      <text x={cx} y={cy - AXIS_HALF - 22} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.text}>
        {title}
      </text>
      <text x={cx} y={cy - AXIS_HALF - 8} textAnchor="middle" fontFamily={mono} fontSize="9.5" fill={C.muted}>
        {subtitle}
      </text>
    </g>
  );
}

export default function RoPEMechanism() {
  const H = 440;
  const CY = 130;
  const P1_CX = 110;
  const P2_CX = 320;
  const P3_CX = 530;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 640 ${H}`}
        width="100%"
        role="img"
        aria-label="Rotary position embedding rotates feature pairs by an angle proportional to position"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="rope-arr-accent"
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
            id="rope-arr-muted"
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

        {/* Diagram title */}
        <text x={320} y={20} textAnchor="middle" fontFamily={sans} fontSize="13" fontWeight="500" fill={C.text}>
          RoPE rotates each feature pair by an angle proportional to position
        </text>

        {/* ===== Panel 1: p = 0 ===== */}
        <Plane cx={P1_CX} cy={CY} title="p = 0" subtitle="original q" />
        <Vector cx={P1_CX} cy={CY} angle={THETA0} len={VLEN} color={C.muted2} label="q" labelOffset={[6, -4]} />

        {/* ===== Panel 2: p = 1, rotated by θ ===== */}
        <Plane cx={P2_CX} cy={CY} title="p = 1" subtitle="rotated by θ" />
        {/* faded original */}
        <Vector cx={P2_CX} cy={CY} angle={THETA0} len={VLEN} color={C.muted2} dashed />
        {/* rotated */}
        <Vector cx={P2_CX} cy={CY} angle={THETA0 + ROT} len={VLEN} color={C.accent} label="R(θ)q" labelOffset={[4, -6]} />
        <AngleArc cx={P2_CX} cy={CY} fromAngle={THETA0} toAngle={THETA0 + ROT} radius={26} color={C.accent} label="θ" labelRadius={36} />

        {/* ===== Panel 3: p = 5, rotated by 5θ ===== */}
        <Plane cx={P3_CX} cy={CY} title="p = 5" subtitle="rotated by 5θ" />
        <Vector cx={P3_CX} cy={CY} angle={THETA0} len={VLEN} color={C.muted2} dashed />
        <Vector cx={P3_CX} cy={CY} angle={THETA0 + 5 * ROT} len={VLEN} color={C.accent} label="R(5θ)q" labelOffset={[-44, -6]} />
        <AngleArc cx={P3_CX} cy={CY} fromAngle={THETA0} toAngle={THETA0 + 5 * ROT} radius={22} color={C.accent} label="5θ" labelRadius={34} />

        {/* ===== Inset: relative-position consequence ===== */}
        <rect
          x={40}
          y={270}
          width={560}
          height={130}
          rx="6"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.2"
        />

        <text x={320} y={294} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.text}>
          Dot product depends only on the relative position
        </text>

        {/* Centered equation */}
        <g>
          <text x={320} y={332} textAnchor="middle" fontFamily={mono} fontSize="13" fill={C.text}>
            <tspan>⟨q</tspan>
            <tspan baselineShift="sub" fontSize="9">p</tspan>
            <tspan>, k</tspan>
            <tspan baselineShift="sub" fontSize="9">p′</tspan>
            <tspan>⟩  =  ⟨R(pθ) q, R(p′θ) k⟩  =  q</tspan>
            <tspan baselineShift="super" fontSize="9">T</tspan>
            <tspan> R(</tspan>
            <tspan fill={C.accent}>(p′ − p)</tspan>
            <tspan> θ) k</tspan>
          </text>
        </g>

        <text x={320} y={368} textAnchor="middle" fontFamily={sans} fontSize="11.5" fill={C.muted}>
          The two rotations combine — absolute positions cancel, only the
          <tspan fill={C.accent}> relative offset </tspan>
          survives.
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
        RoPE rotates feature pairs by an angle proportional to position; the dot
        product of two rotated vectors depends only on their relative position.
      </figcaption>
    </figure>
  );
}
