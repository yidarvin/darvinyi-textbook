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

// Stable PRNG for latent-grid noise patterns
function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// A photo-like image glyph (input/output image)
function PhotoGlyph({ cx, cy, w = 38, h = 30, accent = false }) {
  const stroke = accent ? C.accent : C.muted2;
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="3"
            fill={C.bg3} stroke={accent ? C.accent : C.borderLt}
            strokeWidth={accent ? "1.5" : "1"} />
      {/* horizon */}
      <line x1={cx - w / 2 + 3} y1={cy + 4}
            x2={cx + w / 2 - 3} y2={cy + 4}
            stroke={stroke} strokeWidth="1" opacity="0.7" />
      {/* sun/moon */}
      <circle cx={cx + w / 4} cy={cy - 4} r="2.5"
              fill={stroke} opacity="0.7" />
      {/* mountains */}
      <path d={`M ${cx - w / 2 + 3} ${cy + 4}
                L ${cx - w / 4} ${cy - 3}
                L ${cx - 2} ${cy + 4}
                L ${cx + w / 6} ${cy - 1}
                L ${cx + w / 2 - 3} ${cy + 4} Z`}
            fill={stroke} opacity="0.35" />
    </g>
  );
}

// Latent grid — N×N cells, with noise level (0..1)
function LatentGrid({ cx, cy, noise, accent = false, cell = 5, grid = 5, seed = 11 }) {
  const r = rng(seed);
  const w = cell * grid;
  const stroke = accent ? C.accent : C.borderLt;
  const cells = [];
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const baseVal = ((i + j) % 2 === 0) ? 0.55 : 0.25; // signal pattern
      const noiseSample = r();
      const mixed = (1 - noise) * baseVal + noise * noiseSample;
      cells.push({ i, j, v: mixed });
    }
  }
  return (
    <g>
      <rect x={cx - w / 2 - 1} y={cy - w / 2 - 1}
            width={w + 2} height={w + 2} rx="2"
            fill={C.bg3} stroke={stroke}
            strokeWidth={accent ? "1.5" : "1"} />
      {cells.map((c, k) => (
        <rect key={k}
              x={cx - w / 2 + c.j * cell}
              y={cy - w / 2 + c.i * cell}
              width={cell - 0.5} height={cell - 0.5}
              fill={C.muted2}
              opacity={c.v} />
      ))}
    </g>
  );
}

// Generic labeled box
function Box({ cx, cy, w, h, label, sub, accent = false, dashed = false }) {
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="4"
            fill={accent ? C.accentDim : C.bg2}
            stroke={accent ? C.accent : C.borderLt}
            strokeWidth={accent ? "1.5" : "1"}
            strokeDasharray={dashed ? "3 3" : "none"} />
      <text x={cx} y={cy + (sub ? -2 : 3)} textAnchor="middle"
            fontFamily={mono} fontSize="10"
            fill={accent ? C.accent : C.text}>
        {label}
      </text>
      {sub && (
        <text x={cx} y={cy + 11} textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}>
          {sub}
        </text>
      )}
    </g>
  );
}

export default function LatentDiffusionArchitecture() {
  // Row Y centers
  const Y1 = 75;     // forward / training row
  const Y2 = 245;    // reverse / sampling row
  const YT = 340;    // text branch row

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 470"
        width="100%"
        role="img"
        aria-label="Stable Diffusion / Latent Diffusion architecture: VAE encode, diffusion in latent space with text-conditioned U-Net, VAE decode"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="ld-arr-muted" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="ld-arr-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* ── Row 1 title ─────────────────────────────────────────────────── */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}
              letterSpacing="0.06em">
          training: encode image, then diffuse in latent space
        </text>

        {/* ── Row 1: image → VAE Enc → z_0 → forward diffusion → z_T ──────── */}
        {/* image x */}
        <PhotoGlyph cx={45} cy={Y1} />
        <text x={45} y={Y1 + 25} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted2}>
          image x
        </text>
        <text x={45} y={Y1 + 36} textAnchor="middle"
              fontFamily={mono} fontSize="8" fill={C.muted}>
          512×512×3
        </text>

        {/* arrow → VAE Enc */}
        <line x1={70} y1={Y1} x2={100} y2={Y1}
              stroke={C.muted2} strokeWidth="1.5"
              markerEnd="url(#ld-arr-muted)" />

        {/* VAE Enc box */}
        <Box cx={140} cy={Y1} w={70} h={34} label="VAE Enc" />
        <text x={140} y={Y1 + 32} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.muted} fontStyle="italic">
          frozen
        </text>

        {/* arrow → z_0 */}
        <line x1={180} y1={Y1} x2={210} y2={Y1}
              stroke={C.muted2} strokeWidth="1.5"
              markerEnd="url(#ld-arr-muted)" />

        {/* z_0 latent + label */}
        <LatentGrid cx={232} cy={Y1} noise={0.05} seed={21} />
        <text x={232} y={Y1 + 25} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted2}>
          z_0
        </text>
        <text x={232} y={Y1 + 36} textAnchor="middle"
              fontFamily={mono} fontSize="8" fill={C.muted}>
          64×64×4 — 48× compressed
        </text>

        {/* forward diffusion chain: z_0 → z_1 → z_2 → z_3 → z_T */}
        {[
          { cx: 310, noise: 0.30, label: 'z_t/4', seed: 31 },
          { cx: 380, noise: 0.55, label: 'z_t/2', seed: 41 },
          { cx: 450, noise: 0.80, label: 'z_3t/4', seed: 51 },
          { cx: 520, noise: 1.00, label: 'z_T',   seed: 61 },
        ].map((p, i, arr) => {
          const prevX = i === 0 ? 254 : arr[i - 1].cx + 20;
          return (
            <g key={i}>
              <line x1={prevX} y1={Y1} x2={p.cx - 18} y2={Y1}
                    stroke={C.muted2} strokeWidth="1"
                    markerEnd="url(#ld-arr-muted)" />
              <LatentGrid cx={p.cx} cy={Y1} noise={p.noise} seed={p.seed} />
              <text x={p.cx} y={Y1 + 25} textAnchor="middle"
                    fontFamily={mono} fontSize="9" fill={C.muted2}>
                {p.label}
              </text>
            </g>
          );
        })}

        {/* "q (forward)" label above the chain */}
        <text x={400} y={Y1 - 28} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          forward q — fixed Gaussian noising in latent space
        </text>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <line x1={40} y1={140} x2={600} y2={140}
              stroke={C.border} strokeWidth="1" strokeDasharray="3 4" />

        {/* ── Row 2 title ─────────────────────────────────────────────────── */}
        <text x="320" y={170} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}
              letterSpacing="0.06em">
          inference: text-conditioned reverse diffusion + decode
        </text>

        {/* ── Row 2: z_T → U-Net cond on text → z_0 → VAE Dec → x̂ ───────── */}
        {/* z_T (sampled noise) */}
        <LatentGrid cx={55} cy={Y2} noise={1.0} seed={71} />
        <text x={55} y={Y2 + 25} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted2}>
          z_T ~ N(0,I)
        </text>

        {/* arrow chain dots — abbreviated */}
        <line x1={80} y1={Y2} x2={115} y2={Y2}
              stroke={C.accent} strokeWidth="1.5"
              markerEnd="url(#ld-arr-accent)" />

        {/* z_t */}
        <LatentGrid cx={138} cy={Y2} noise={0.5} seed={81} accent />
        <text x={138} y={Y2 + 25} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.accent}>
          z_t
        </text>

        {/* arrow → U-Net */}
        <line x1={163} y1={Y2} x2={200} y2={Y2}
              stroke={C.accent} strokeWidth="1.5"
              markerEnd="url(#ld-arr-accent)" />

        {/* U-Net box (highlighted) */}
        <Box cx={260} cy={Y2} w={110} h={64}
             label="U-Net ε_θ"
             sub="cross-attn at every res"
             accent />
        <text x={260} y={Y2 + 44} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.accent} fontStyle="italic">
          the only trained component
        </text>

        {/* arrow → z_{t-1} */}
        <line x1={320} y1={Y2} x2={357} y2={Y2}
              stroke={C.accent} strokeWidth="1.5"
              markerEnd="url(#ld-arr-accent)" />

        {/* z_{t-1} */}
        <LatentGrid cx={380} cy={Y2} noise={0.42} seed={91} accent />
        <text x={380} y={Y2 + 25} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.accent}>
          z_{`{t-1}`}
        </text>

        {/* abbreviated loop back hint */}
        <text x={415} y={Y2 - 26} fontFamily={sans} fontSize="9.5"
              fill={C.muted2} fontStyle="italic">
          repeat 20–50 steps
        </text>
        <path d={`M 405 ${Y2} q 18 -20 36 0`}
              fill="none" stroke={C.muted2} strokeWidth="1"
              strokeDasharray="3 2" />

        {/* arrow → z_0 */}
        <line x1={400} y1={Y2} x2={448} y2={Y2}
              stroke={C.accent} strokeWidth="1.5"
              markerEnd="url(#ld-arr-accent)" />

        {/* z_0 (denoised) */}
        <LatentGrid cx={470} cy={Y2} noise={0.05} seed={101} />
        <text x={470} y={Y2 + 25} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted2}>
          z_0
        </text>

        {/* arrow → VAE Dec */}
        <line x1={494} y1={Y2} x2={520} y2={Y2}
              stroke={C.muted2} strokeWidth="1.5"
              markerEnd="url(#ld-arr-muted)" />

        {/* VAE Dec */}
        <Box cx={555} cy={Y2} w={60} h={34} label="VAE Dec" />
        <text x={555} y={Y2 + 32} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.muted} fontStyle="italic">
          frozen
        </text>

        {/* arrow → x̂ */}
        <line x1={585} y1={Y2} x2={605} y2={Y2}
              stroke={C.muted2} strokeWidth="1.5"
              markerEnd="url(#ld-arr-muted)" />

        {/* x̂ output (subtle teal accent) */}
        <PhotoGlyph cx={620} cy={Y2 + 38} accent />
        <line x1={605} y1={Y2} x2={620} y2={Y2 + 22}
              stroke={C.muted2} strokeWidth="1.5"
              markerEnd="url(#ld-arr-muted)" />
        <text x={620} y={Y2 + 65} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.accent}>
          x̂
        </text>

        {/* ── Text-conditioning branch (feeds into U-Net) ──────────────── */}
        {/* Prompt input */}
        <rect x={40} y={YT - 12} width={170} height={24} rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1" />
        <text x={125} y={YT + 4} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}>
          "a cat wearing a top hat"
        </text>
        <text x={125} y={YT - 17} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted2}>
          text prompt
        </text>

        {/* arrow → CLIP */}
        <line x1={210} y1={YT} x2={235} y2={YT}
              stroke={C.muted2} strokeWidth="1.5"
              markerEnd="url(#ld-arr-muted)" />

        {/* CLIP box */}
        <Box cx={280} cy={YT} w={80} h={28} label="CLIP enc" />
        <text x={280} y={YT + 27} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.muted} fontStyle="italic">
          frozen
        </text>

        {/* arrow up + curve into U-Net via cross-attention */}
        <path d={`M 280 ${YT - 14}
                  C 280 ${YT - 50}, 260 ${Y2 + 60}, 260 ${Y2 + 32}`}
              fill="none" stroke={C.accent} strokeWidth="1.5"
              markerEnd="url(#ld-arr-accent)" />
        <text x={310} y={YT - 30} fontFamily={mono} fontSize="9" fill={C.accent}>
          text embedding
        </text>
        <text x={310} y={YT - 18} fontFamily={sans} fontSize="9" fill={C.accent}
              fontStyle="italic">
          injected via cross-attention
        </text>

        {/* ── Bottom unified annotation ──────────────────────────────────── */}
        <text x="320" y={395} textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}>
          U-Net trained on noise prediction + classifier-free guidance dropout — VAE pair pretrained once and frozen
        </text>
        <text x="320" y={413} textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.accent}>
          diffusion happens entirely in latent space → ~48× less compute than pixel-space diffusion
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
        Stable Diffusion runs diffusion in a VAE-compressed latent space with
        text conditioning injected through cross-attention — the architectural
        recipe behind most modern text-to-image systems.
      </figcaption>
    </figure>
  );
}
