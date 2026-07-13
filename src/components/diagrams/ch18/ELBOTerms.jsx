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

// Small abstract image glyph — three circles inside a rounded rect
function ImageGlyph({ x, y, w = 36, h = 30, stroke = C.muted2, fill = C.bg3 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4"
            fill={fill} stroke={stroke} strokeWidth="1.3" />
      <circle cx={x + 9}  cy={y + 11} r="3.2" fill={stroke} opacity="0.85" />
      <circle cx={x + 19} cy={y + 17} r="2.6" fill={stroke} opacity="0.6" />
      <circle cx={x + 27} cy={y + 9}  r="2.0" fill={stroke} opacity="0.7" />
    </g>
  );
}

// Small labeled box (encoder / decoder)
function Box({ x, y, w, h, label }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4"
            fill={C.bg2} stroke={C.borderLt} strokeWidth="1.3" />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle"
            fontFamily={mono} fontSize="10.5" fill={C.text}>
        {label}
      </text>
    </g>
  );
}

// Gaussian curve path generator (for the right panel)
function gaussianPath(cx, baseY, amp, sigma, xs) {
  let d = '';
  xs.forEach((x, i) => {
    const u = (x - cx) / sigma;
    const y = baseY - amp * Math.exp(-0.5 * u * u);
    d += (i === 0 ? 'M ' : ' L ') + x.toFixed(1) + ' ' + y.toFixed(1);
  });
  return d;
}

export default function ELBOTerms() {
  // Right-panel gaussian setup
  const plotL = 350, plotR = 615, baseY = 200;
  const xs = [];
  for (let x = plotL; x <= plotR; x += 2) xs.push(x);

  // Prior centered, posterior offset
  const priorCx  = (plotL + plotR) / 2;       // ~482
  const postCx   = priorCx + 18;
  const amp = 70;
  const sigmaP = 30;
  const sigmaQ = 24;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="The two terms of the ELBO — reconstruction and KL regularization"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="elbo-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="elbo-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* ── Top: ELBO equation ───────────────────────── */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          <tspan>ELBO = </tspan>
          <tspan fill={C.accent}>reconstruction</tspan>
          <tspan> − </tspan>
          <tspan fill={C.muted2}>KL</tspan>
        </text>

        {/* ── Panel divider ─────────────────────────────── */}
        <line x1="320" y1="40" x2="320" y2="300"
              stroke={C.border} strokeWidth="1" strokeDasharray="3 3" />

        {/* ── Panel borders ─────────────────────────────── */}
        <rect x="20" y="40" width="300" height="260" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />
        <rect x="320" y="40" width="300" height="260" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />

        {/* ── Panel titles ──────────────────────────────── */}
        <text x="170" y="58" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.accent}>
          Reconstruction term
        </text>
        <text x="470" y="58" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.muted2}>
          KL regularization term
        </text>

        {/* ──────────────── LEFT PANEL ──────────────── */}
        {/* Input image glyph */}
        <ImageGlyph x={36}  y={102} stroke={C.accent} />
        <text x={54} y={150} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          x
        </text>

        {/* Arrow to encoder */}
        <line x1="78" y1="117" x2="100" y2="117"
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#elbo-arrow)" />

        {/* Encoder box */}
        <Box x={100} y={104} w={56} h={26} label="encoder" />

        {/* (μ, σ) → z */}
        <line x1="156" y1="117" x2="174" y2="117"
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#elbo-arrow)" />
        <text x={186} y={113} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          (μ, σ)
        </text>
        <text x={186} y={128} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}>
          → z
        </text>

        {/* Arrow to decoder */}
        <line x1="198" y1="117" x2="216" y2="117"
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#elbo-arrow)" />

        {/* Decoder box */}
        <Box x={216} y={104} w={56} h={26} label="decoder" />

        {/* Arrow to reconstructed image */}
        <line x1="272" y1="117" x2="288" y2="117"
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#elbo-arrow)" />

        {/* Reconstructed image glyph — placed wrapping; positioned cleanly */}
        <g>
          {/* place reconstructed glyph just past the arrow but inside the panel */}
        </g>
        {/* Actually let's put the reconstruction below to keep arrows clean */}
        {/* Re-do layout: input top, then enc → z → dec, output below */}

        {/* Annotation arrow connecting x and x_hat (reconstruction error) */}
        <path d="M 54 138 Q 54 200 54 200"
              stroke="none" fill="none" />

        {/* Drop reconstructed glyph below the decoder area */}
        <ImageGlyph x={196} y={172} stroke={C.accent} />
        <text x={214} y={216} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          x̂
        </text>

        {/* Compare arrow between x and x̂ (dashed teal) */}
        <path d={`M 54 138 Q 54 190 196 188`}
              stroke={C.accent} strokeWidth="1.2" fill="none"
              strokeDasharray="3 3" markerEnd="url(#elbo-arrow-accent)" />
        <text x="125" y="200" textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.accent}>
          E[log p(x|z)]
        </text>

        {/* Bottom annotation */}
        <text x="170" y="262" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}
              fontStyle="italic">
          decoder must faithfully
        </text>
        <text x="170" y="276" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}
              fontStyle="italic">
          reconstruct the input
        </text>

        {/* ──────────────── RIGHT PANEL ──────────────── */}
        {/* axes */}
        <line x1={plotL - 4} y1={baseY} x2={plotR + 4} y2={baseY}
              stroke={C.borderLt} strokeWidth="1" />
        <line x1={priorCx} y1={baseY + 4} x2={priorCx} y2={baseY - amp - 18}
              stroke={C.border} strokeWidth="0.8" strokeDasharray="2 3" />
        <text x={priorCx} y={baseY + 16} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          0
        </text>

        {/* Prior p(z) = N(0, I) — muted grey, centered */}
        <path d={gaussianPath(priorCx, baseY, amp, sigmaP, xs)}
              fill="none" stroke={C.muted2} strokeWidth="1.5"
              strokeDasharray="3 2" />
        <text x={priorCx - 60} y={baseY - amp + 10}
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          p(z) = N(0, I)
        </text>

        {/* Posterior q(z|x) — teal, slightly off-center & tighter */}
        <path d={gaussianPath(postCx, baseY, amp * 0.85, sigmaQ, xs)}
              fill="none" stroke={C.accent} strokeWidth="1.7" />
        <text x={postCx + 38} y={baseY - amp * 0.85 + 6}
              fontFamily={mono} fontSize="10" fill={C.accent}>
          q(z | x)
        </text>

        {/* Annotation: KL divergence between distributions */}
        <path d={`M ${priorCx - 36} ${baseY - 30} Q ${priorCx} ${baseY - 55} ${postCx + 26} ${baseY - 30}`}
              stroke={C.muted2} strokeWidth="1" strokeDasharray="3 3"
              fill="none" />
        <text x={priorCx + 4} y={baseY - 60} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          KL( q || p )
        </text>

        {/* Bottom annotation */}
        <text x="470" y="262" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}
              fontStyle="italic">
          posterior must stay near the prior —
        </text>
        <text x="470" y="276" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}
              fontStyle="italic">
          keeps latent space dense
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
        The ELBO balances two pressures: the decoder must reconstruct faithfully,
        and the encoder's posterior must stay close to the prior — together
        producing a dense, decodable latent space.
      </figcaption>
    </figure>
  );
}
