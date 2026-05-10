import { useState, useMemo, useRef, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── PRNG (mulberry32) ─────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianPair(rng) {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1));
  return [r * Math.cos(2 * Math.PI * u2), r * Math.sin(2 * Math.PI * u2)];
}

// ── COLORS ────────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  red:       '#f87171',
  green:     '#34d399',
  text:      '#e8eaed',
  textMid:   '#888888',
  textMuted: '#555555',
  codeBg:    '#0a0a0a',
  border:    '#242424',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  accentDim: '#0b2422',
};

const mono = "'JetBrains Mono', monospace";

// ── CLUSTER CONFIGS ───────────────────────────────────────────────────────────
const AE_CFG = [
  { center: [-0.62,  0.54], sigma: 0.06, color: C.accent, label: 'A' },
  { center: [ 0.55,  0.48], sigma: 0.06, color: C.orange, label: 'B' },
  { center: [ 0.02, -0.61], sigma: 0.06, color: C.purple, label: 'C' },
];

const VAE_CFG = [
  { center: [-0.38,  0.34], sigma: 0.22, color: C.accent, label: 'A' },
  { center: [ 0.34,  0.29], sigma: 0.22, color: C.orange, label: 'B' },
  { center: [ 0.02, -0.38], sigma: 0.22, color: C.purple, label: 'C' },
];

// ── SVG COORDINATE SYSTEM ─────────────────────────────────────────────────────
// Two 280×300 panels with a 20px gap (total 580px wide).
// Coordinate area per panel: 256w × 260h with 12px side margins, 20px top margin.
const VW     = 580;
const VH     = 300;
const PL_AE  = 0;
const PL_VAE = 300;   // 280 panel + 20 gap

function px(x, panelLeft) {
  return panelLeft + 12 + ((x + 1) / 2) * 256;
}
function py(y) {
  return 20 + ((1 - y) / 2) * 260;
}

// sigma → 95% CI ellipse radii in SVG units
function sigmaToRxRy(sigma) {
  return { rx: 2 * sigma * 128, ry: 2 * sigma * 130 };
}

// Panel title center x
const TITLE_AE  = PL_AE  + 140;
const TITLE_VAE = PL_VAE + 140;

// ── STAR POLYGON ─────────────────────────────────────────────────────────────
function starPointsStr(cx, cy, outerR, innerR) {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i * Math.PI) / 12 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// ── CLUSTER HELPERS ───────────────────────────────────────────────────────────
function distToCluster(pt, c) {
  const dx = pt[0] - c.center[0];
  const dy = pt[1] - c.center[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function inAnyCluster(pt, clusters) {
  return clusters.some(c => distToCluster(pt, c) < 2 * c.sigma);
}

function nearestClusterColor(pt, clusters) {
  let best = clusters[0], bestDist = distToCluster(pt, clusters[0]);
  for (let i = 1; i < clusters.length; i++) {
    const d = distToCluster(pt, clusters[i]);
    if (d < bestDist) { bestDist = d; best = clusters[i]; }
  }
  return best.color;
}

function minDistToAny(pt, clusters) {
  return Math.min(...clusters.map(c => distToCluster(pt, c)));
}

// ── HEATMAP ───────────────────────────────────────────────────────────────────
function computeHeatmap(clusters) {
  const N = 20;
  const cells = [];
  let maxD = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = -1 + (i + 0.5) / (N / 2);
      const y = -1 + (j + 0.5) / (N / 2);
      let d = 0;
      for (const c of clusters) {
        const dx = x - c.center[0], dy = y - c.center[1];
        d += Math.exp(-(dx * dx + dy * dy) / (2 * c.sigma * c.sigma));
      }
      if (d > maxD) maxD = d;
      cells.push({ i, j, d });
    }
  }
  return { cells, maxD, N };
}

// ── INTERPOLATION ─────────────────────────────────────────────────────────────
const A_PT = [-0.6, 0.5];
const B_PT = [0.5, 0.45];

function lerp2(a, b, t) {
  return [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t];
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function StatCell({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: mono, fontSize: 8.5, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ fontFamily: mono, fontSize: 12, color: color || C.accent, whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  );
}

function Toggle({ label, on, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!on)}
        style={{
          width: 28, height: 14, borderRadius: 7,
          background: on ? C.accent : C.bg4,
          border: `1px solid ${on ? C.accent : C.border}`,
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 1, left: on ? 15 : 1,
          width: 10, height: 10, borderRadius: '50%',
          background: on ? '#0a0a0a' : C.textMuted,
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: mono, fontSize: 11, color: C.textMid }}>{label}</span>
    </label>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AutoencoderVsVAE() {
  const [samples, setSamples]           = useState([]);
  const [tInterp, setTInterp]           = useState(0);
  const [showEllipses, setShowEllipses] = useState(true);
  const [showHeatmap, setShowHeatmap]   = useState(true);
  const sampleIdRef = useRef(0);

  // ── Generate cluster points (deterministic, seed=11) ─────────────────────
  const { aePoints, vaePoints } = useMemo(() => {
    const rng = mulberry32(11);
    const rawSamples = Array.from({ length: 60 }, () => gaussianPair(rng));

    const aePoints = AE_CFG.map((c, ci) =>
      rawSamples.slice(ci * 20, (ci + 1) * 20).map(([z1, z2]) => [
        Math.max(-0.98, Math.min(0.98, c.center[0] + c.sigma * z1)),
        Math.max(-0.98, Math.min(0.98, c.center[1] + c.sigma * z2)),
      ])
    );
    const vaePoints = VAE_CFG.map((c, ci) =>
      rawSamples.slice(ci * 20, (ci + 1) * 20).map(([z1, z2]) => [
        Math.max(-0.98, Math.min(0.98, c.center[0] + c.sigma * z1)),
        Math.max(-0.98, Math.min(0.98, c.center[1] + c.sigma * z2)),
      ])
    );
    return { aePoints, vaePoints };
  }, []);

  const heatmap = useMemo(() => computeHeatmap(VAE_CFG), []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const interpPt = lerp2(A_PT, B_PT, tInterp);

  const handleSample = useCallback(() => {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    setSamples(prev => [...prev.slice(-4), { x, y, id: sampleIdRef.current++ }]);
  }, []);

  const handleClear = useCallback(() => setSamples([]), []);

  const latestSample = samples.length > 0 ? samples[samples.length - 1] : null;

  const aeSampleResult = latestSample
    ? (inAnyCluster([latestSample.x, latestSample.y], AE_CFG)
        ? { text: '✓ valid region',     color: C.green, type: 'valid' }
        : { text: '✗ gap — no meaning', color: C.red,   type: 'gap'  })
    : null;

  const vaeSampleResult = latestSample
    ? (() => {
        const pt = [latestSample.x, latestSample.y];
        if (inAnyCluster(pt, VAE_CFG))      return { text: '✓ meaningful decode',    color: C.green,   type: 'valid' };
        if (minDistToAny(pt, VAE_CFG) > 0.9) return { text: '~ edge of distribution', color: C.textMid, type: 'edge'  };
        return { text: '✓ meaningful decode', color: C.green, type: 'valid' };
      })()
    : null;

  const aeInterpInGap     = !inAnyCluster(interpPt, AE_CFG);
  const showGapAnnotation = tInterp >= 0.35 && tInterp <= 0.65;

  // ── SVG helpers ───────────────────────────────────────────────────────────
  function renderEllipses(clusters, panelLeft) {
    return clusters.map((c, i) => {
      const { rx, ry } = sigmaToRxRy(c.sigma);
      return (
        <ellipse key={i}
          cx={px(c.center[0], panelLeft)} cy={py(c.center[1])}
          rx={rx} ry={ry}
          fill="none" stroke={c.color}
          strokeOpacity={0.4} strokeWidth={1} strokeDasharray="3 2"
        />
      );
    });
  }

  function renderStars(panelLeft, clusters, isVAE) {
    const reversed = [...samples].reverse();
    const opacities = [1.0, 0.6, 0.4, 0.25, 0.15];
    return reversed.map((sample, pos) => {
      const cx = px(sample.x, panelLeft);
      const cy = py(sample.y);
      const isNewest = pos === 0;
      const outerR = isNewest ? 8 : 5;
      const innerR = isNewest ? 4 : 2.5;
      const opacity = opacities[pos] ?? 0;
      const pt = [sample.x, sample.y];
      const fillColor = isVAE
        ? (inAnyCluster(pt, clusters) ? nearestClusterColor(pt, clusters) : C.textMid)
        : (inAnyCluster(pt, clusters) ? nearestClusterColor(pt, clusters) : C.red);

      return (
        <g key={sample.id} style={{ opacity, transition: 'opacity 3s ease-out' }}>
          <g transform={`translate(${cx},${cy})`}>
            <polygon points={starPointsStr(0, 0, outerR, innerR)}
              fill={fillColor} stroke="rgba(0,0,0,0.35)" strokeWidth={0.5}>
              {isNewest && (
                <animateTransform attributeName="transform" type="scale"
                  from="0" to="1" dur="0.3s" fill="freeze" />
              )}
            </polygon>
          </g>
        </g>
      );
    });
  }

  function renderInterpPath(panelLeft, isVAE) {
    const ax = px(A_PT[0], panelLeft), ay = py(A_PT[1]);
    const bx = px(B_PT[0], panelLeft), by = py(B_PT[1]);

    const p40 = lerp2(A_PT, B_PT, 0.4), p60 = lerp2(A_PT, B_PT, 0.6);
    const p40x = px(p40[0], panelLeft), p40y = py(p40[1]);
    const p60x = px(p60[0], panelLeft), p60y = py(p60[1]);

    const ipx = px(interpPt[0], panelLeft), ipy = py(interpPt[1]);
    const ds = 6;
    const diamond = `${ipx},${ipy-ds} ${ipx+ds},${ipy} ${ipx},${ipy+ds} ${ipx-ds},${ipy}`;
    const midX = (ax + bx) / 2;
    const midY = Math.min(ay, by) - 12;

    return (
      <g>
        {isVAE
          ? <line x1={ax} y1={ay} x2={bx} y2={by}
              stroke="rgba(45,212,191,0.08)" strokeWidth={18} strokeLinecap="round" />
          : <line x1={p40x} y1={p40y} x2={p60x} y2={p60y}
              stroke="rgba(248,113,113,0.18)" strokeWidth={18} strokeLinecap="round" />
        }
        <line x1={ax} y1={ay} x2={bx} y2={by}
          stroke={C.textMid} strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.7} />
        <circle cx={ax} cy={ay} r={4} fill={C.accent} />
        <circle cx={bx} cy={by} r={4} fill={C.orange} />
        <polygon points={diamond} fill="white" stroke="rgba(0,0,0,0.4)" strokeWidth={0.5} />
        {!isVAE && showGapAnnotation && (
          <text x={midX} y={midY} textAnchor="middle"
            fontSize={8} fill={C.red} fontFamily={mono} opacity={0.9}>
            gap → garbled output
          </text>
        )}
      </g>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <WidgetCard title="Autoencoder vs VAE — discrete clusters vs smooth manifold" number="11.1">

      {/* ── SVG canvas (full width) ── */}
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <clipPath id="clip-ae11">
            <rect x={PL_AE}  y={0} width={280} height={VH} />
          </clipPath>
          <clipPath id="clip-vae11">
            <rect x={PL_VAE} y={0} width={280} height={VH} />
          </clipPath>
        </defs>

        {/* ══ AE PANEL ══════════════════════════════════════════════════════ */}
        <rect x={PL_AE} y={0} width={280} height={VH} fill={C.codeBg} rx={4} />
        <text x={TITLE_AE} y={15} textAnchor="middle"
          fontSize={12} fill={C.text} fontFamily="Inter, sans-serif" fontWeight={500}>
          Standard Autoencoder
        </text>

        <g clipPath="url(#clip-ae11)">
          {aePoints.map((cluster, ci) =>
            cluster.map((pt, pi) => (
              <circle key={`ae-${ci}-${pi}`}
                cx={px(pt[0], PL_AE)} cy={py(pt[1])}
                r={4} fill={AE_CFG[ci].color} fillOpacity={0.85} />
            ))
          )}
          {showEllipses && renderEllipses(AE_CFG, PL_AE)}
          {renderInterpPath(PL_AE, false)}
          {renderStars(PL_AE, AE_CFG, false)}
        </g>

        {aeSampleResult && (
          <text x={TITLE_AE} y={292} textAnchor="middle"
            fontSize={9} fill={aeSampleResult.color} fontFamily={mono}>
            {aeSampleResult.text}
          </text>
        )}

        {/* ══ VAE PANEL ══════════════════════════════════════════════════════ */}
        <rect x={PL_VAE} y={0} width={280} height={VH} fill={C.codeBg} rx={4} />
        <text x={TITLE_VAE} y={15} textAnchor="middle"
          fontSize={12} fill={C.text} fontFamily="Inter, sans-serif" fontWeight={500}>
          Variational Autoencoder
        </text>

        <g clipPath="url(#clip-vae11)">
          {showHeatmap && (() => {
            const { cells, maxD, N } = heatmap;
            const cellW = 256 / N, cellH = 260 / N;
            return cells.map(({ i, j, d }) => (
              <rect key={`hm-${i}-${j}`}
                x={PL_VAE + 12 + i * cellW}
                y={20 + (N - 1 - j) * cellH}
                width={cellW + 0.5} height={cellH + 0.5}
                fill={`rgba(45,212,191,${((d / maxD) * 0.15).toFixed(3)})`}
              />
            ));
          })()}

          {vaePoints.map((cluster, ci) =>
            cluster.map((pt, pi) => (
              <circle key={`vae-${ci}-${pi}`}
                cx={px(pt[0], PL_VAE)} cy={py(pt[1])}
                r={4} fill={VAE_CFG[ci].color} fillOpacity={0.85} />
            ))
          )}
          {showEllipses && renderEllipses(VAE_CFG, PL_VAE)}
          {renderInterpPath(PL_VAE, true)}
          {renderStars(PL_VAE, VAE_CFG, true)}
        </g>

        {vaeSampleResult && (
          <text x={TITLE_VAE} y={292} textAnchor="middle"
            fontSize={9} fill={vaeSampleResult.color} fontFamily={mono}>
            {vaeSampleResult.text}
          </text>
        )}
      </svg>

      {/* ── Stats strip ── */}
      <div style={{
        display: 'flex', marginTop: 10,
        background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8,
      }}>
        {/* AE section */}
        <div style={{ flex: 1, padding: '8px 12px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Autoencoder
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatCell label="σ"    value="0.06" />
            <StatCell label="cov"  value="~15%" color={C.red} />
            <StatCell label="gap"  value="~85%" color={C.red} />
            <StatCell label="last"
              value={aeSampleResult?.type ?? '—'}
              color={aeSampleResult?.color ?? C.textMuted} />
          </div>
        </div>

        {/* VAE section */}
        <div style={{ flex: 1, padding: '8px 12px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            VAE
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatCell label="σ"    value="0.22" />
            <StatCell label="cov"  value="~95%" color={C.green} />
            <StatCell label="gap"  value="~5%"  color={C.green} />
            <StatCell label="last"
              value={vaeSampleResult?.type ?? '—'}
              color={vaeSampleResult?.color ?? C.textMuted} />
          </div>
        </div>

        {/* Interpolation section */}
        <div style={{ flex: 1, padding: '8px 12px' }}>
          <div style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Interpolation
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatCell label="t" value={tInterp.toFixed(2)} />
            <StatCell label="x" value={interpPt[0].toFixed(2)} />
            <StatCell label="y" value={interpPt[1].toFixed(2)} />
            {aeInterpInGap && <StatCell label="AE" value="in gap" color={C.red} />}
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Buttons + interpolation in one row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleSample} style={{
            background: C.accentDim, border: `1px solid ${C.accent}`,
            color: C.accent, fontFamily: mono, fontSize: 11,
            padding: '5px 12px', borderRadius: 5, cursor: 'pointer', flexShrink: 0,
          }}>
            Sample
          </button>
          <button onClick={handleClear} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textMid, fontFamily: mono, fontSize: 11,
            padding: '5px 12px', borderRadius: 5, cursor: 'pointer', flexShrink: 0,
          }}>
            Clear
          </button>

          <div style={{ width: 1, background: C.border, alignSelf: 'stretch', margin: '0 4px', flexShrink: 0 }} />

          <span style={{ fontFamily: mono, fontSize: 11, color: C.textMid, whiteSpace: 'nowrap', flexShrink: 0 }}>
            A→B t={tInterp.toFixed(2)}
          </span>
          <input type="range" min={0} max={1} step={0.01} value={tInterp}
            onChange={e => setTInterp(Number(e.target.value))}
            style={{ flex: 1, minWidth: 80, accentColor: C.accent, cursor: 'pointer' }} />
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 24 }}>
          <Toggle label="Show 95% ellipses"    on={showEllipses} onChange={setShowEllipses} />
          <Toggle label="Show density heatmap" on={showHeatmap}  onChange={setShowHeatmap} />
        </div>
      </div>
    </WidgetCard>
  );
}
