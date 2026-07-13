const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.08)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Stable noise dot positions — deterministic per (seed, count)
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
      rad: 0.7 + r() * 1.4,
      op: 0.35 + r() * 0.55,
    });
  }
  return out;
}

// A stylized face that fades with signal strength, with overlay noise that grows
function ImageGlyph({ cx, cy, size = 60, alphaBar, accent = false }) {
  const stroke = accent ? C.accent : C.muted2;
  const sigOp = Math.sqrt(Math.max(0, Math.min(1, alphaBar)));
  const noiseOp = Math.sqrt(Math.max(0, Math.min(1, 1 - alphaBar)));
  const dots = noiseDots(13, 55, cx - size / 2, cy - size / 2, size, size);

  return (
    <g>
      <rect x={cx - size / 2} y={cy - size / 2}
            width={size} height={size} rx="4"
            fill={C.bg3}
            stroke={accent ? C.accent : C.borderLt}
            strokeWidth={accent ? "1.5" : "1"} />

      {/* Face — fades as signal drops */}
      <g opacity={sigOp}>
        <circle cx={cx} cy={cy - 1} r={size / 3.4}
                fill="none" stroke={stroke} strokeWidth="1.6" />
        <circle cx={cx - size / 7.5} cy={cy - 5} r="1.6" fill={stroke} />
        <circle cx={cx + size / 7.5} cy={cy - 5} r="1.6" fill={stroke} />
        <path d={`M ${cx - size / 9} ${cy + 3} q ${size / 9} ${size / 13} ${size / 4.5} 0`}
              fill="none" stroke={stroke} strokeWidth="1.4" />
      </g>

      {/* Noise — grows as signal drops */}
      <g opacity={noiseOp}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.rad}
                  fill={C.muted2} opacity={d.op} />
        ))}
      </g>
    </g>
  );
}

export default function NoiseInjectionFormula() {
  // Five timesteps with stylized ᾱ values
  const panels = [
    { t: 't = 0',     alphaLabel: 'ᾱ_t ≈ 1.00', alphaBar: 1.00, sigCoef: '1.00', noiCoef: '0.00', status: 'clean' },
    { t: 't = T/4',   alphaLabel: 'ᾱ_t ≈ 0.70', alphaBar: 0.70, sigCoef: '0.84', noiCoef: '0.55', status: 'mostly signal' },
    { t: 't = T/2',   alphaLabel: 'ᾱ_t ≈ 0.30', alphaBar: 0.30, sigCoef: '0.55', noiCoef: '0.84', status: 'crossover', accent: true },
    { t: 't = 3T/4',  alphaLabel: 'ᾱ_t ≈ 0.05', alphaBar: 0.05, sigCoef: '0.22', noiCoef: '0.97', status: 'mostly noise' },
    { t: 't = T',     alphaLabel: 'ᾱ_t ≈ 0.00', alphaBar: 0.00, sigCoef: '0.00', noiCoef: '1.00', status: 'pure noise' },
  ];

  // Layout: 5 columns spanning 600px content width inside 640 viewBox
  const startX = 70;
  const stepX  = 125;
  const imgY   = 160;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 290"
        width="100%"
        role="img"
        aria-label="The closed-form forward jump applied at five timesteps, showing progressive corruption from clean image to pure noise"
        style={{ display: 'block' }}
      >
        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.muted2}
              letterSpacing="0.06em">
          closed-form forward jump
        </text>

        {/* Formula box */}
        <rect x="120" y="38" width="400" height="34" rx="5"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1" />
        <text x="320" y="60" textAnchor="middle"
              fontFamily={mono} fontSize="13" fill={C.text}>
          x_t = √ᾱ_t · x_0  +  √(1 − ᾱ_t) · ε
        </text>

        {/* Per-panel headers + glyphs */}
        {panels.map((p, i) => {
          const cx = startX + i * stepX;
          const accent = !!p.accent;
          return (
            <g key={i}>
              {/* highlight box for crossover panel */}
              {accent && (
                <rect x={cx - 56} y={92} width="112" height="170" rx="6"
                      fill={C.accentDim} stroke={C.accent} strokeWidth="1"
                      strokeDasharray="none" />
              )}

              {/* timestep header */}
              <text x={cx} y={106} textAnchor="middle"
                    fontFamily={mono} fontSize="11"
                    fill={accent ? C.accent : C.text}>
                {p.t}
              </text>

              {/* alpha bar value */}
              <text x={cx} y={123} textAnchor="middle"
                    fontFamily={mono} fontSize="10"
                    fill={accent ? C.accent : C.muted2}>
                {p.alphaLabel}
              </text>

              {/* image glyph */}
              <ImageGlyph cx={cx} cy={imgY} size={56}
                          alphaBar={p.alphaBar} accent={accent} />

              {/* coefficients */}
              <text x={cx} y={210} textAnchor="middle"
                    fontFamily={mono} fontSize="9"
                    fill={accent ? C.accent : C.muted}>
                √ᾱ = {p.sigCoef}
              </text>
              <text x={cx} y={222} textAnchor="middle"
                    fontFamily={mono} fontSize="9"
                    fill={accent ? C.accent : C.muted}>
                √(1−ᾱ) = {p.noiCoef}
              </text>

              {/* status */}
              <text x={cx} y={246} textAnchor="middle"
                    fontFamily={sans} fontSize="10"
                    fill={accent ? C.accent : C.muted2}
                    fontStyle="italic">
                {p.status}
              </text>
            </g>
          );
        })}

        {/* Bottom unified annotation */}
        <text x="320" y="278" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}>
          x_t computed directly from x_0 — no need to simulate all 1000 intermediate steps during training
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
        The closed-form forward jump lets training sample any timestep directly
        from <em>x_0</em>, making diffusion training computationally tractable
        despite the long noising chain.
      </figcaption>
    </figure>
  );
}
