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

// Precompute schedules at T=1000 and downsample for the curves
function computeSchedules() {
  const T = 1000;
  const linBetas = new Array(T);
  for (let t = 0; t < T; t++) {
    linBetas[t] = 0.0001 + (0.02 - 0.0001) * (t / (T - 1));
  }
  const linAlphas = new Array(T);
  let prod = 1;
  for (let t = 0; t < T; t++) {
    prod *= (1 - linBetas[t]);
    linAlphas[t] = prod;
  }

  const s = 0.008;
  const cosAlphas = new Array(T + 1);
  for (let t = 0; t <= T; t++) {
    const v = Math.cos(((t / T + s) / (1 + s)) * Math.PI / 2);
    cosAlphas[t] = v * v;
  }
  const cosBetas = new Array(T);
  for (let t = 1; t <= T; t++) {
    cosBetas[t - 1] = Math.min(0.999, 1 - cosAlphas[t] / cosAlphas[t - 1]);
  }

  // Downsample to 100 points
  const N = 100;
  const sample = (arr) => {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      const idx = Math.min(T - 1, Math.round((i / (N - 1)) * (T - 1)));
      out[i] = arr[idx];
    }
    return out;
  };
  return {
    linBetas: sample(linBetas),
    linAlphas: sample(linAlphas),
    cosBetas: sample(cosBetas),
    cosAlphas: sample(cosAlphas.slice(1)),
  };
}

// Build an SVG path through (xs, ys), in pixel coordinates
function toPath(xs, ys) {
  return xs.map((x, i) => (i === 0 ? `M ${x.toFixed(1)} ${ys[i].toFixed(1)}`
                                    : `L ${x.toFixed(1)} ${ys[i].toFixed(1)}`)).join(' ');
}

export default function SchedulesAndSNR() {
  const { linBetas, linAlphas, cosBetas, cosAlphas } = computeSchedules();
  const N = linBetas.length;
  const ts = new Array(N);
  for (let i = 0; i < N; i++) ts[i] = i / (N - 1);

  // Plot regions
  const LX = 60,  LY = 60,  LW = 240, LH = 160;  // left (β)
  const RX = 360, RY = 60,  RW = 240, RH = 160;  // right (SNR)

  // β plot mapping: y goes 0..0.022
  const betaMax = 0.022;
  const xL = (t) => LX + t * LW;
  const yL = (b) => LY + LH - (b / betaMax) * LH;

  // SNR plot mapping: log scale y from 1e-4 to 1e3
  const snrMin = 1e-4, snrMax = 1e3;
  const logMin = Math.log10(snrMin), logMax = Math.log10(snrMax);
  const xR = (t) => RX + t * RW;
  const yR = (snr) => {
    const lg = Math.log10(Math.max(snrMin, Math.min(snrMax, snr)));
    return RY + RH - ((lg - logMin) / (logMax - logMin)) * RH;
  };

  // Build curves
  const linBetaPath  = toPath(ts.map(xL), linBetas.map(yL));
  const cosBetaPath  = toPath(ts.map(xL), cosBetas.map((b) => yL(Math.min(betaMax, b))));

  const snrLin = linAlphas.map((a) => a / Math.max(1e-12, 1 - a));
  const snrCos = cosAlphas.map((a) => a / Math.max(1e-12, 1 - a));

  const linSnrPath = toPath(ts.map(xR), snrLin.map(yR));
  const cosSnrPath = toPath(ts.map(xR), snrCos.map(yR));

  // Helper for a single axis
  const Axes = ({ X, Y, W, H, yTicks, yLabels, yLabelOffset = -8, xLabel, yLabel }) => (
    <g>
      {/* frame */}
      <rect x={X} y={Y} width={W} height={H} rx="3"
            fill={C.bg3} stroke={C.border} strokeWidth="1" />
      {/* x ticks at 0, 0.25, 0.5, 0.75, 1.0 */}
      {[0, 0.25, 0.5, 0.75, 1].map((tt) => (
        <g key={`xt-${tt}`}>
          <line x1={X + tt * W} y1={Y + H} x2={X + tt * W} y2={Y + H + 4}
                stroke={C.borderLt} strokeWidth="1" />
          <text x={X + tt * W} y={Y + H + 14} textAnchor="middle"
                fontFamily={mono} fontSize="9" fill={C.muted}>
            {tt}
          </text>
        </g>
      ))}
      {/* y ticks */}
      {yTicks.map((y, i) => (
        <g key={`yt-${i}`}>
          <line x1={X} y1={y} x2={X - 4} y2={y}
                stroke={C.borderLt} strokeWidth="1" />
          <text x={X - 7} y={y + 3} textAnchor="end"
                fontFamily={mono} fontSize="9" fill={C.muted}>
            {yLabels[i]}
          </text>
        </g>
      ))}
      {/* axis labels */}
      <text x={X + W / 2} y={Y + H + 28} textAnchor="middle"
            fontFamily={mono} fontSize="9.5" fill={C.muted2}>
        {xLabel}
      </text>
      <text x={X + yLabelOffset - 22} y={Y + H / 2}
            textAnchor="middle"
            fontFamily={mono} fontSize="9.5" fill={C.muted2}
            transform={`rotate(-90 ${X + yLabelOffset - 22} ${Y + H / 2})`}>
        {yLabel}
      </text>
    </g>
  );

  // Left axis ticks: β values 0, 0.005, 0.01, 0.015, 0.02
  const betaTickVals = [0, 0.005, 0.01, 0.015, 0.02];
  const leftYTicks  = betaTickVals.map(yL);
  const leftYLabels = ['0', '.005', '.010', '.015', '.020'];

  // Right axis ticks (log): 0.0001, 0.01, 1, 100
  const snrTickVals = [1e-4, 1e-2, 1, 1e2];
  const rightYTicks  = snrTickVals.map(yR);
  const rightYLabels = ['10⁻⁴', '10⁻²', '10⁰', '10²'];

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="Linear vs cosine noise schedules: the per-step variance and the resulting signal-to-noise ratio plotted on a log scale"
        style={{ display: 'block' }}
      >
        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.muted2}
              letterSpacing="0.06em">
          linear vs cosine — schedule shape and resulting SNR
        </text>

        {/* Panel titles */}
        <text x={LX + LW / 2} y={45} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          β_t  (noise per step)
        </text>
        <text x={RX + RW / 2} y={45} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          SNR(t) = ᾱ_t / (1 − ᾱ_t)
        </text>

        {/* LEFT PANEL — β_t */}
        <Axes X={LX} Y={LY} W={LW} H={LH}
              yTicks={leftYTicks} yLabels={leftYLabels}
              xLabel="t / T" yLabel="β_t" />

        {/* linear β — muted */}
        <path d={linBetaPath} fill="none" stroke={C.muted2} strokeWidth="1.5" />
        {/* cosine β — accent */}
        <path d={cosBetaPath} fill="none" stroke={C.accent} strokeWidth="1.8" />

        {/* legend / labels */}
        <text x={LX + 14} y={LY + 18} fontFamily={mono} fontSize="9.5" fill={C.muted2}>
          linear
        </text>
        <line x1={LX + 50} y1={LY + 15} x2={LX + 70} y2={LY + 15}
              stroke={C.muted2} strokeWidth="1.5" />
        <text x={LX + 14} y={LY + 32} fontFamily={mono} fontSize="9.5" fill={C.accent}>
          cosine
        </text>
        <line x1={LX + 50} y1={LY + 29} x2={LX + 70} y2={LY + 29}
              stroke={C.accent} strokeWidth="1.8" />

        {/* RIGHT PANEL — SNR */}
        <Axes X={RX} Y={RY} W={RW} H={RH}
              yTicks={rightYTicks} yLabels={rightYLabels}
              xLabel="t / T" yLabel="SNR (log)" />

        {/* SNR = 1 reference line */}
        <line x1={RX} y1={yR(1)} x2={RX + RW} y2={yR(1)}
              stroke={C.border} strokeWidth="0.8" strokeDasharray="2 3" />
        <text x={RX + RW - 4} y={yR(1) - 3} textAnchor="end"
              fontFamily={mono} fontSize="8" fill={C.muted}>
          SNR = 1
        </text>

        {/* linear SNR — muted */}
        <path d={linSnrPath} fill="none" stroke={C.muted2} strokeWidth="1.5" />
        {/* cosine SNR — accent */}
        <path d={cosSnrPath} fill="none" stroke={C.accent} strokeWidth="1.8" />

        {/* in-plot callouts */}
        <text x={RX + 28} y={RY + 130} fontFamily={sans} fontSize="9" fill={C.muted}
              fontStyle="italic">
          linear collapses early
        </text>
        <text x={RX + 105} y={RY + 60} fontFamily={sans} fontSize="9" fill={C.accent}
              fontStyle="italic">
          cosine stays usable
        </text>

        {/* Bottom unified annotation */}
        <text x="320" y="303" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}>
          Nichol &amp; Dhariwal 2021 ("Improved DDPM"): cosine schedule preserves usable SNR longer → better sample quality
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
        The cosine schedule keeps signal-to-noise ratio in a useful range across
        more timesteps, letting the model learn from meaningful inputs rather
        than near-pure noise.
      </figcaption>
    </figure>
  );
}
