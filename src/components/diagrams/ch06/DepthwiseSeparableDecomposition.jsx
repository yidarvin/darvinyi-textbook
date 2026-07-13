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
  faceLight:'#1c1c1c',
  faceMid: '#161616',
  faceDark:'#0e0e0e',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

/* Isometric-style box. Width/height are the front face dims; depth is the depth axis (drawn up-right). */
function IsoBox({ x, y, w, h, d, label, sublabel, teal = false }) {
  const depthDX = d * 0.55;
  const depthDY = -d * 0.42;
  const fillFront = teal ? C.accentDim : C.faceLight;
  const fillTop = teal ? C.accentDim : C.faceMid;
  const fillSide = teal ? C.accentDim : C.faceDark;
  const stroke = teal ? C.accent : C.borderLt;

  return (
    <g>
      {/* Top face */}
      <polygon
        points={`${x},${y} ${x + w},${y} ${x + w + depthDX},${y + depthDY} ${x + depthDX},${y + depthDY}`}
        fill={fillTop}
        stroke={stroke}
        strokeWidth="1"
      />
      {/* Side face */}
      <polygon
        points={`${x + w},${y} ${x + w + depthDX},${y + depthDY} ${x + w + depthDX},${y + h + depthDY} ${x + w},${y + h}`}
        fill={fillSide}
        stroke={stroke}
        strokeWidth="1"
      />
      {/* Front face */}
      <rect
        x={x} y={y} width={w} height={h}
        fill={fillFront}
        stroke={stroke}
        strokeWidth="1.3"
      />
      {/* Label below */}
      {label && (
        <text x={x + w / 2 + depthDX / 2} y={y + h + 14}
              textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={teal ? C.accent : C.muted2}>
          {label}
        </text>
      )}
      {sublabel && (
        <text x={x + w / 2 + depthDX / 2} y={y + h + 26}
              textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.muted}
              fontStyle="italic">
          {sublabel}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, label }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={C.muted2} strokeWidth="1.4"
            markerEnd="url(#dws-arrow)" />
      {label && (
        <text x={(x1 + x2) / 2} y={y1 - 6} textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted2}>
          {label}
        </text>
      )}
    </g>
  );
}

export default function DepthwiseSeparableDecomposition() {
  // ── TOP row: standard convolution ───────────────────────────
  const TOP_Y = 50;

  // ── BOTTOM row: depthwise separable ─────────────────────────
  const BOT_Y = 240;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 460"
        width="100%"
        role="img"
        aria-label="Depthwise separable convolution decomposes standard convolution into two cheaper operations"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="dws-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* ── Section A: Standard convolution ──────────────────── */}
        <text x="30" y="30" fontFamily={mono} fontSize="11.5" fill={C.text}>
          standard convolution
        </text>

        {/* Input H×W×C_in */}
        <IsoBox
          x={40} y={TOP_Y} w={56} h={56} d={36}
          label="H × W × C_in"
          sublabel="input"
        />

        <Arrow x1={155} y1={TOP_Y + 30} x2={205} y2={TOP_Y + 30} label="" />

        {/* Filter k×k×C_in */}
        <IsoBox
          x={215} y={TOP_Y + 12} w={32} h={32} d={28}
          label="k × k × C_in"
          sublabel="filter (×C_out)"
        />

        <Arrow x1={295} y1={TOP_Y + 30} x2={345} y2={TOP_Y + 30} />

        {/* Output H×W×C_out */}
        <IsoBox
          x={355} y={TOP_Y} w={56} h={56} d={48}
          label="H × W × C_out"
          sublabel="output"
        />

        {/* Standard cost annotation */}
        <rect x={460} y={TOP_Y + 6} width={158} height={62}
              rx="4" fill={C.bg2} stroke={C.border} strokeWidth="0.8" />
        <text x={539} y={TOP_Y + 22} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          cost per position
        </text>
        <text x={539} y={TOP_Y + 40} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          k² · C_in · C_out
        </text>
        <text x={539} y={TOP_Y + 56} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          = 9 · 64 · 128 = 73,728
        </text>

        {/* Divider */}
        <line x1="20" y1="180" x2="620" y2="180"
              stroke={C.border} strokeWidth="0.8" strokeDasharray="3,3" />

        {/* ── Section B: Depthwise separable ─────────────────── */}
        <text x="30" y="220" fontFamily={mono} fontSize="11.5" fill={C.text}>
          depthwise separable
        </text>

        {/* Input */}
        <IsoBox
          x={30} y={BOT_Y} w={46} h={46} d={32}
          label="H × W × C_in"
        />

        <Arrow x1={120} y1={BOT_Y + 24} x2={155} y2={BOT_Y + 24} />

        {/* Depthwise filters: three small k×k glyphs stacked */}
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x={165 + i * 4}
                y={BOT_Y + 6 + i * 4}
                width={26}
                height={26}
                rx="2"
                fill={C.faceLight}
                stroke={C.borderLt}
                strokeWidth="1.1"
              />
            </g>
          ))}
          <text x={186} y={BOT_Y + 56} textAnchor="middle"
                fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            k×k per channel
          </text>
          <text x={186} y={BOT_Y + 68} textAnchor="middle"
                fontFamily={sans} fontSize="9" fill={C.muted}
                fontStyle="italic">
            (depthwise)
          </text>
        </g>

        <Arrow x1={222} y1={BOT_Y + 24} x2={255} y2={BOT_Y + 24} />

        {/* Intermediate H×W×C_in */}
        <IsoBox
          x={265} y={BOT_Y} w={46} h={46} d={32}
          label="H × W × C_in"
        />

        <Arrow x1={357} y1={BOT_Y + 24} x2={395} y2={BOT_Y + 24} />

        {/* Pointwise 1×1×C_in */}
        <g>
          <rect
            x={400} y={BOT_Y + 12}
            width={22} height={22}
            rx="2"
            fill={C.faceLight}
            stroke={C.borderLt}
            strokeWidth="1.1"
          />
          <text x={411} y={BOT_Y + 56} textAnchor="middle"
                fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            1×1 × C_in
          </text>
          <text x={411} y={BOT_Y + 68} textAnchor="middle"
                fontFamily={sans} fontSize="9" fill={C.muted}
                fontStyle="italic">
            (pointwise ×C_out)
          </text>
        </g>

        <Arrow x1={435} y1={BOT_Y + 24} x2={468} y2={BOT_Y + 24} />

        {/* Output H×W×C_out */}
        <IsoBox
          x={478} y={BOT_Y} w={46} h={46} d={42}
          label="H × W × C_out"
        />

        {/* Comparison annotation box at bottom */}
        <rect
          x={70}
          y={350}
          width={500}
          height={90}
          rx="6"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="0.8"
        />

        <text x={320} y={370} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          example: k=3, C_in=64, C_out=128
        </text>

        <text x={90} y={392}
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          standard:
        </text>
        <text x={250} y={392}
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          k² · C_in · C_out
        </text>
        <text x={550} y={392} textAnchor="end"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          = 73,728
        </text>

        <text x={90} y={410}
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          separable:
        </text>
        <text x={250} y={410}
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          k² · C_in + C_in · C_out
        </text>
        <text x={550} y={410} textAnchor="end"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          = 8,768
        </text>

        <line x1={90} y1={418} x2={550} y2={418}
              stroke={C.border} strokeWidth="0.6" />

        <text x={90} y={433}
              fontFamily={mono} fontSize="11" fill={C.accent}>
          ratio:
        </text>
        <text x={550} y={433} textAnchor="end"
              fontFamily={mono} fontSize="11" fill={C.accent}>
          ≈ 8.4× cheaper
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
        Factoring standard convolution into per-channel spatial filtering
        plus per-position channel mixing reduces FLOPs by roughly an order
        of magnitude — the recipe behind MobileNet and EfficientNet.
      </figcaption>
    </figure>
  );
}
