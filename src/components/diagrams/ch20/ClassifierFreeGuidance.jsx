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

// Stable noise dots (reused pattern)
function noiseDots(seed, count, x0, y0, w, h) {
  let s = seed | 0;
  const r = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: x0 + r() * w,
      y: y0 + r() * h,
      rad: 0.5 + r() * 1.0,
      op: 0.3 + r() * 0.4,
    });
  }
  return out;
}

// A tiny cat-in-a-hat glyph that varies with guidance scale
function CatGlyph({ cx, cy, mode }) {
  // mode: 'low' (faint cat, lots of noise), 'mid' (clean), 'high' (oversaturated)
  const accent = mode === 'mid';
  const stroke = accent ? C.accent : C.muted2;
  const size = 44;
  const sigOp  = mode === 'low' ? 0.35 : (mode === 'mid' ? 0.95 : 1);
  const noiseOp = mode === 'low' ? 0.85 : (mode === 'mid' ? 0.15 : 0.4);
  const dots = noiseDots(21 + (mode === 'high' ? 9 : 0), 30,
                         cx - size / 2, cy - size / 2, size, size);

  const burnt = mode === 'high';
  const catColor = burnt ? '#f87171' : stroke;

  return (
    <g>
      <rect x={cx - size / 2} y={cy - size / 2}
            width={size} height={size} rx="3"
            fill={C.bg3}
            stroke={accent ? C.accent : C.borderLt}
            strokeWidth={accent ? "1.5" : "1"} />

      {/* base cat — face circle + ears + hat */}
      <g opacity={sigOp}>
        {/* head */}
        <circle cx={cx} cy={cy + 4} r="9"
                fill="none" stroke={catColor} strokeWidth="1.4" />
        {/* ears */}
        <path d={`M ${cx - 6} ${cy - 2} l -2 -5 l 5 2 z`}
              fill={catColor} opacity="0.7" />
        <path d={`M ${cx + 6} ${cy - 2} l 2 -5 l -5 2 z`}
              fill={catColor} opacity="0.7" />
        {/* hat brim */}
        <line x1={cx - 9} y1={cy - 6} x2={cx + 9} y2={cy - 6}
              stroke={catColor} strokeWidth="1.6" />
        {/* hat top */}
        <rect x={cx - 5} y={cy - 13} width="10" height="8"
              fill="none" stroke={catColor} strokeWidth="1.4" />
        {/* eyes */}
        <circle cx={cx - 3} cy={cy + 3} r="0.9" fill={catColor} />
        <circle cx={cx + 3} cy={cy + 3} r="0.9" fill={catColor} />
      </g>

      {/* noise overlay */}
      <g opacity={noiseOp}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.rad}
                  fill={burnt ? '#f87171' : C.muted2} opacity={d.op} />
        ))}
      </g>
    </g>
  );
}

export default function ClassifierFreeGuidance() {
  // Vector origin
  const Ox = 175, Oy = 210;
  // Tip endpoints relative to origin
  const uncond = { dx: 70, dy: -25 };
  const cond   = { dx: 55, dy: -65 };
  // guided = uncond + w*(cond - uncond), w = 3
  const wDraw = 3;
  const diff  = { dx: cond.dx - uncond.dx, dy: cond.dy - uncond.dy };
  const guided = { dx: uncond.dx + wDraw * diff.dx,
                   dy: uncond.dy + wDraw * diff.dy };

  // Absolute tip coords
  const uncondTip = { x: Ox + uncond.dx, y: Oy + uncond.dy };
  const condTip   = { x: Ox + cond.dx,   y: Oy + cond.dy };
  const guidedTip = { x: Ox + guided.dx, y: Oy + guided.dy };

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 380"
        width="100%"
        role="img"
        aria-label="Classifier-free guidance shown as a vector operation in noise-prediction space, with three image glyphs at different guidance scales"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="cfg-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="cfg-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.muted2}
              letterSpacing="0.06em">
          noise-prediction space — guidance as vector amplification
        </text>

        {/* LEFT PANEL — vector diagram */}
        <rect x="40" y="42" width="290" height="232" rx="6"
              fill="transparent" stroke={C.border} strokeWidth="1"
              strokeDasharray="3 3" />

        {/* coordinate axes (subtle) */}
        <line x1="55" y1={Oy} x2="320" y2={Oy}
              stroke={C.border} strokeWidth="1" />
        <line x1={Ox} y1="60" x2={Ox} y2="265"
              stroke={C.border} strokeWidth="1" />

        {/* origin dot */}
        <circle cx={Ox} cy={Oy} r="2.5" fill={C.muted2} />
        <text x={Ox - 6} y={Oy + 14} textAnchor="end"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          0
        </text>

        {/* dashed diff vector between tips */}
        <line x1={uncondTip.x} y1={uncondTip.y}
              x2={condTip.x}   y2={condTip.y}
              stroke={C.muted} strokeWidth="1"
              strokeDasharray="3 2" />
        <text x={(uncondTip.x + condTip.x) / 2 + 10}
              y={(uncondTip.y + condTip.y) / 2 - 2}
              fontFamily={mono} fontSize="9" fill={C.muted}>
          ε_cond − ε_uncond
        </text>

        {/* ε_uncond — muted */}
        <line x1={Ox} y1={Oy} x2={uncondTip.x} y2={uncondTip.y}
              stroke={C.muted2} strokeWidth="1.5"
              markerEnd="url(#cfg-arrow-muted)" />
        <text x={uncondTip.x + 4} y={uncondTip.y + 4}
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          ε_uncond
        </text>

        {/* ε_cond — teal but thinner */}
        <line x1={Ox} y1={Oy} x2={condTip.x} y2={condTip.y}
              stroke={C.accent} strokeWidth="1.5"
              opacity="0.7"
              markerEnd="url(#cfg-arrow-accent)" />
        <text x={condTip.x + 4} y={condTip.y - 2}
              fontFamily={mono} fontSize="10" fill={C.accent}
              opacity="0.85">
          ε_cond
        </text>

        {/* ε_guided — teal, bold */}
        <line x1={Ox} y1={Oy} x2={guidedTip.x} y2={guidedTip.y}
              stroke={C.accent} strokeWidth="2.2"
              markerEnd="url(#cfg-arrow-accent)" />
        <text x={guidedTip.x + 6} y={guidedTip.y + 3}
              fontFamily={mono} fontSize="10.5" fill={C.accent}
              fontWeight="600">
          ε_guided
        </text>

        {/* formula box */}
        <rect x="45" y="247" width="280" height="22" rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1" />
        <text x="185" y="262" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}>
          ε_guided = ε_uncond + w · (ε_cond − ε_uncond)
        </text>

        {/* RIGHT PANEL — image glyphs */}
        <rect x="360" y="42" width="240" height="232" rx="6"
              fill="transparent" stroke={C.border} strokeWidth="1"
              strokeDasharray="3 3" />
        <text x="480" y="60" textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          same prompt at three scales
        </text>

        {/* Three cat glyphs vertically */}
        <CatGlyph cx={480} cy={102} mode="low" />
        <text x={538} y={102} fontFamily={mono} fontSize="9.5" fill={C.muted}>
          w = 1
        </text>
        <text x={538} y={113} fontFamily={sans} fontSize="9" fill={C.muted}
              fontStyle="italic">
          weak adherence
        </text>

        <CatGlyph cx={480} cy={170} mode="mid" />
        <text x={538} y={170} fontFamily={mono} fontSize="9.5" fill={C.accent}>
          w = 7.5
        </text>
        <text x={538} y={181} fontFamily={sans} fontSize="9" fill={C.accent}
              fontStyle="italic">
          clean condition
        </text>

        <CatGlyph cx={480} cy={238} mode="high" />
        <text x={538} y={238} fontFamily={mono} fontSize="9.5" fill={C.muted}>
          w = 15
        </text>
        <text x={538} y={249} fontFamily={sans} fontSize="9" fill={C.muted}
              fontStyle="italic">
          burnt / artifacts
        </text>

        {/* BOTTOM — guidance scale strip */}
        <text x="40" y="298" fontFamily={mono} fontSize="10" fill={C.muted2}>
          guidance scale w:
        </text>

        {/* scale axis */}
        <line x1="60" y1="320" x2="580" y2="320"
              stroke={C.borderLt} strokeWidth="1.5" />

        {/* tick marks + labels */}
        {[
          { x: 60,  label: 'w = 0',   sub: 'unconditional', accent: false },
          { x: 200, label: 'w = 1',   sub: 'just ε_cond',   accent: false },
          { x: 400, label: 'w = 7.5', sub: 'SD default',    accent: true  },
          { x: 560, label: 'w = 15',  sub: 'over-guided',   accent: false },
        ].map((tk, i) => (
          <g key={i}>
            <line x1={tk.x} y1="315" x2={tk.x} y2="325"
                  stroke={tk.accent ? C.accent : C.muted2} strokeWidth="1.5" />
            <circle cx={tk.x} cy="320" r={tk.accent ? 4 : 2.5}
                    fill={tk.accent ? C.accent : C.muted2} />
            <text x={tk.x} y="343" textAnchor="middle"
                  fontFamily={mono} fontSize="10"
                  fill={tk.accent ? C.accent : C.text}>
              {tk.label}
            </text>
            <text x={tk.x} y="357" textAnchor="middle"
                  fontFamily={sans} fontSize="9.5"
                  fill={tk.accent ? C.accent : C.muted}
                  fontStyle="italic">
              {tk.sub}
            </text>
          </g>
        ))}
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
        Classifier-free guidance amplifies the conditional direction in
        noise-prediction space — the guidance scale <em>w</em> trades faithful
        adherence to the prompt for sample diversity.
      </figcaption>
    </figure>
  );
}
