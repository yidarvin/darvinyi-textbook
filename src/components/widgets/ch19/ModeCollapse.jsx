import { useState, useRef, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  text:      '#e8eaed',
  textMid:   '#888888',
  textMuted: '#555555',
  codeBg:    '#0a0a0a',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
};

const mono = "'JetBrains Mono', monospace";

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genCluster(rng, cx, cy, sigma, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(rng(), 1e-12);
    const u2 = rng();
    const r = Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;
    pts.push([cx + r * Math.cos(theta) * sigma, cy + r * Math.sin(theta) * sigma]);
  }
  return pts;
}

const CLUSTERS = [
  { cx: -2.0, cy: -1.8, sigma: 0.45, color: C.accent },
  { cx:  2.0, cy: -1.8, sigma: 0.45, color: C.orange },
  { cx:  0.0, cy:  1.8, sigma: 0.45, color: C.purple },
];

function generateAll() {
  const rR = mulberry32(77);
  const realByCluster = CLUSTERS.map(({ cx, cy, sigma }) => genCluster(rR, cx, cy, sigma, 27));

  const rH = mulberry32(88);
  const hClusters = CLUSTERS.map(({ cx, cy }) => genCluster(rH, cx, cy, 0.55, 27));
  const healthy = [...hClusters[0], ...hClusters[1], ...hClusters[2].slice(0, 26)];

  const rC = mulberry32(99);
  const collapse = genCluster(rC, -2.0, -1.8, 0.3, 80);

  const rW = mulberry32(110);
  const wClusters = CLUSTERS.map(({ cx, cy }) => genCluster(rW, cx, cy, 0.50, 27));
  const wgan = [...wClusters[0], ...wClusters[1], ...wClusters[2].slice(0, 26)];

  return { realByCluster, healthy, collapse, wgan };
}

// ── Toy FID: the real Fréchet-distance formula applied to (x,y) point
// clouds instead of Inception-embedding features (there is no real image
// generator to embed here — see the disclosure caption below). Still a
// genuine computation: FID = ||μ_r-μ_g||² + Tr(Σ_r+Σ_g-2·sqrtm(Σ_rΣ_g)).
function meanCov(pts) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  pts.forEach(([x, y]) => {
    sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my);
  });
  return { mean: [mx, my], cov: [[sxx / n, sxy / n], [sxy / n, syy / n]] };
}
// Tr(sqrtm(AB)) = sum of sqrt(eigenvalues of AB); for two PD 2×2 matrices
// those eigenvalues are guaranteed real and non-negative, so the closed-form
// quadratic on trace/det of the product is exact — no iterative sqrtm needed.
function traceSqrtProduct(A, B) {
  const M00 = A[0][0]*B[0][0] + A[0][1]*B[1][0], M01 = A[0][0]*B[0][1] + A[0][1]*B[1][1];
  const M10 = A[1][0]*B[0][0] + A[1][1]*B[1][0], M11 = A[1][0]*B[0][1] + A[1][1]*B[1][1];
  const tr = M00 + M11, det = M00 * M11 - M01 * M10;
  const disc = Math.max(0, tr * tr - 4 * det);
  const l1 = (tr + Math.sqrt(disc)) / 2, l2 = (tr - Math.sqrt(disc)) / 2;
  return Math.sqrt(Math.max(0, l1)) + Math.sqrt(Math.max(0, l2));
}
function toyFID(realPts, genPts) {
  const { mean: mr, cov: Sr } = meanCov(realPts);
  const { mean: mg, cov: Sg } = meanCov(genPts);
  const meanDiff2 = (mr[0] - mg[0]) ** 2 + (mr[1] - mg[1]) ** 2;
  const trCov = Sr[0][0] + Sr[1][1] + Sg[0][0] + Sg[1][1];
  return meanDiff2 + trCov - 2 * traceSqrtProduct(Sr, Sg);
}

const VW = 480, VH = 380, PAD = 28;
const DRAW_W = VW - 2 * PAD; // 424
const DRAW_H = VH - 2 * PAD; // 324

function toSVG(x, y) {
  return [
    PAD + ((x + 4) / 8) * DRAW_W,
    PAD + ((3.5 - y) / 7) * DRAW_H,
  ];
}

function nearCluster(pt, cx, cy, sigma) {
  return Math.sqrt((pt[0] - cx) ** 2 + (pt[1] - cy) ** 2) < 2 * sigma;
}

function computeCoverage(pts) {
  return CLUSTERS.map(({ cx, cy, sigma }) => {
    const n = pts.filter(p => nearCluster(p, cx, cy, sigma)).length;
    return { n, pct: pts.length > 0 ? Math.round((n / pts.length) * 100) : 0 };
  });
}

const MODES = ['healthy', 'collapse', 'wgan'];
const MODE_LABELS  = { healthy: 'Healthy GAN', collapse: 'Mode Collapse', wgan: 'WGAN-GP' };
const MODE_DISPLAY = { healthy: 'Healthy',     collapse: 'Collapsed',     wgan: 'WGAN-GP' };

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

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

function StatRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      gap: 4, marginBottom: 3,
    }}>
      <span style={{ fontFamily: mono, fontSize: 9.5, color: C.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 10, color: color || C.textMid, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 8.5, fontWeight: 600,
      color: C.accent, textTransform: 'uppercase',
      letterSpacing: '0.08em', marginBottom: 5, marginTop: 2,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '7px 0' }} />;
}

export default function ModeCollapse({ tryThis } = {}) {
  const [mode, setMode]             = useState('healthy');
  const [showKDE, setShowKDE]       = useState(true);
  const [showReal, setShowReal]     = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [displayPts, setDisplayPts] = useState(null);

  const dataRef       = useRef(null);
  const displayPtsRef = useRef(null);
  const animRef       = useRef(null);

  if (!dataRef.current) dataRef.current = generateAll();

  // Init display points on mount
  useEffect(() => {
    const initial = dataRef.current.healthy.map(p => [p[0], p[1]]);
    displayPtsRef.current = initial;
    setDisplayPts(initial);
  }, []);

  // Animate to new mode on tab change
  useEffect(() => {
    if (!displayPtsRef.current) return;

    const data = dataRef.current;
    const toPts = mode === 'healthy' ? data.healthy
                : mode === 'collapse' ? data.collapse
                : data.wgan;

    const fromPts = displayPtsRef.current.map(p => [p[0], p[1]]);

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const duration = 600;
    const start = performance.now();

    function tick(now) {
      const rawT = Math.min((now - start) / duration, 1);
      const t = easeInOut(rawT);
      const cur = toPts.map((to, i) => {
        const from = fromPts[i];
        return [lerp(from[0], to[0], t), lerp(from[1], to[1], t)];
      });
      displayPtsRef.current = cur;
      setDisplayPts([...cur]);
      if (rawT < 1) animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const pts = displayPts || dataRef.current.healthy;
  const coverage = computeCoverage(pts);
  const modesCovered = coverage.filter(c => c.n > 0).length;
  // Real toy FID (see toyFID above), computed live from the currently
  // displayed point cloud against the pooled real points — not a lookup.
  const fidVal = toyFID(dataRef.current.realByCluster.flat(), pts);

  function getKDEEllipses() {
    if (!pts.length) return [];
    return CLUSTERS.map(({ cx: ccx, cy: ccy }) => {
      const region = pts.filter(p => nearCluster(p, ccx, ccy, 0.45 * 1.5));
      if (region.length < 5) return null;
      const rxs = region.map(p => p[0]);
      const rys = region.map(p => p[1]);
      const cx = rxs.reduce((a, b) => a + b) / rxs.length;
      const cy = rys.reduce((a, b) => a + b) / rys.length;
      const sx = Math.sqrt(rxs.reduce((s, x) => s + (x - cx) ** 2, 0) / rxs.length);
      const sy = Math.sqrt(rys.reduce((s, y) => s + (y - cy) ** 2, 0) / rys.length);
      return { cx, cy, rx: Math.max(sx * 2 + 0.15, 0.15), ry: Math.max(sy * 2 + 0.15, 0.15) };
    }).filter(Boolean);
  }

  const kdeEllipses = getKDEEllipses();
  const data = dataRef.current;

  const GRID_XS = [-2, -1, 0, 1, 2];
  const GRID_YS = [-2, -1, 0, 1, 2];

  return (
    <WidgetCard title="Mode Collapse — GAN covers 1 of 3 modes" number="19.3" tryThis={tryThis}>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {MODES.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              fontFamily: mono, fontSize: 11, padding: '7px 14px',
              borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
              background: mode === m ? C.accent : C.bg3,
              color: mode === m ? '#0a0a0a' : C.textMid,
              border: `1px solid ${mode === m ? C.accent : C.border}`,
              fontWeight: mode === m ? 600 : 400,
              flex: 1,
            }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Canvas + Stats */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

        {/* SVG */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            width="100%"
            style={{ display: 'block', background: C.codeBg, borderRadius: 4 }}
          >
            {/* Background */}
            <rect width={VW} height={VH} fill={C.codeBg} />

            {/* Grid lines */}
            {GRID_XS.map(x => {
              const [sx] = toSVG(x, 0);
              return <line key={`gx${x}`} x1={sx} y1={PAD} x2={sx} y2={VH - PAD}
                stroke={C.border} strokeWidth="0.5" />;
            })}
            {GRID_YS.map(y => {
              const [, sy] = toSVG(0, y);
              return <line key={`gy${y}`} x1={PAD} y1={sy} x2={VW - PAD} y2={sy}
                stroke={C.border} strokeWidth="0.5" />;
            })}

            {/* 1. KDE contour ellipses */}
            {showKDE && kdeEllipses.map((e, i) => {
              const [ecx, ecy] = toSVG(e.cx, e.cy);
              const erx = (e.rx / 8) * DRAW_W;
              const ery = (e.ry / 7) * DRAW_H;
              return (
                <ellipse key={i} cx={ecx} cy={ecy} rx={erx} ry={ery}
                  fill="rgba(136,136,136,0.08)"
                  stroke="rgba(136,136,136,0.25)"
                  strokeWidth="1"
                />
              );
            })}

            {/* 2. Real data points */}
            {showReal && data.realByCluster.map((cluster, ci) =>
              cluster.map((pt, pi) => {
                const [sx, sy] = toSVG(pt[0], pt[1]);
                return (
                  <circle key={`r${ci}-${pi}`} cx={sx} cy={sy} r={5}
                    fill={CLUSTERS[ci].color} stroke="white" strokeWidth="1" />
                );
              })
            )}

            {/* 4. 95% confidence ellipses for real clusters (2σ radius) */}
            {showCoverage && CLUSTERS.map((cl, i) => {
              const [ecx, ecy] = toSVG(cl.cx, cl.cy);
              const erx = (cl.sigma * 2 / 8) * DRAW_W;
              const ery = (cl.sigma * 2 / 7) * DRAW_H;
              return (
                <ellipse key={`conf${i}`} cx={ecx} cy={ecy} rx={erx} ry={ery}
                  fill="none"
                  stroke={cl.color}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                  strokeDasharray="4 3"
                />
              );
            })}

            {/* 3. Generator points (diamonds) */}
            {pts.map((pt, i) => {
              const [sx, sy] = toSVG(pt[0], pt[1]);
              const s = 5;
              return (
                <polygon key={`g${i}`}
                  points={`${sx},${sy - s} ${sx + s},${sy} ${sx},${sy + s} ${sx - s},${sy}`}
                  fill="#888888" stroke="white" strokeWidth="0.8"
                />
              );
            })}

            {/* 5. Coverage indicators (✓/✗) */}
            {showCoverage && CLUSTERS.map((cl, i) => {
              const covered = coverage[i].n > 0;
              const [ecx, ecy] = toSVG(cl.cx, cl.cy);
              return (
                <text key={`cov${i}`}
                  x={ecx} y={ecy - 30}
                  textAnchor="middle"
                  fontSize="18"
                  fill={covered ? C.green : C.red}
                  fontFamily={mono}
                >
                  {covered ? '✓' : '✗'}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Stats panel */}
        <div style={{
          width: 180, flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '12px 14px',
        }}>
          <SectionHead>Generator</SectionHead>
          <StatRow
            label="Mode"
            value={MODE_DISPLAY[mode]}
            color={mode === 'collapse' ? C.red : C.green}
          />

          <Divider />
          <SectionHead>Coverage</SectionHead>
          {CLUSTERS.map((_, i) => {
            const cov = coverage[i];
            const covered = cov.n > 0;
            return (
              <StatRow
                key={i}
                label={`Cluster ${i + 1}`}
                value={`${covered ? 'yes' : 'no'} ${cov.pct}%`}
                color={covered ? C.green : C.red}
              />
            );
          })}
          <StatRow
            label="Total"
            value={`${modesCovered} / 3`}
            color={modesCovered === 3 ? C.green : C.red}
          />

          <Divider />
          <SectionHead>Spread</SectionHead>
          {CLUSTERS.map((_, i) => {
            const cov = coverage[i];
            return (
              <StatRow
                key={i}
                label={`Near C${i + 1}`}
                value={`${cov.n} / 80`}
                color={cov.n > 0 ? C.textMid : C.textMuted}
              />
            );
          })}

          <Divider />
          <SectionHead>FID (toy, 2D)</SectionHead>
          <StatRow
            label="FID"
            value={fidVal.toFixed(2)}
            color={fidVal > 1 ? C.red : mode === 'wgan' ? '#fbbf24' : C.green}
          />

          <Divider />
          <div style={{ fontFamily: mono, fontSize: 8.5, color: C.textMuted, lineHeight: 1.6 }}>
            Near = within 2σ of cluster center
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div style={{ marginTop: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Toggle label="Show KDE"      on={showKDE}      onChange={setShowKDE} />
        <Toggle label="Show real data" on={showReal}     onChange={setShowReal} />
        <Toggle label="Show coverage"  on={showCoverage} onChange={setShowCoverage} />
      </div>

      <div style={{
        marginTop: '10px',
        fontFamily: mono, fontSize: '9.5px', color: C.textMuted,
        fontStyle: 'italic', lineHeight: 1.5,
      }}>
        Illustrative FID: computed live from the exact Fréchet-distance
        formula, ‖μ_r−μ_g‖² + Tr(Σ_r+Σ_g−2·sqrtm(Σ_rΣ_g)), applied to these
        2D (x,y) point clouds rather than 2048-dim Inception features — a
        real statistic, but a toy stand-in for FID's actual feature space.
      </div>

    </WidgetCard>
  );
}
