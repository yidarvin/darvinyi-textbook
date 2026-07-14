import { useState, useMemo, useRef, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── PRNG ──────────────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Matrix dimensions ────────────────────────────────────────────────────────
// D rows × K cols, D > K, so the full-rank ceiling min(D,K) = K is a slider
// range that still feels like a meaningful sweep (1..14).
const D = 20, K = 14;

// ── Build an illustrative "weight-like" matrix ───────────────────────────────
// This is a synthetic matrix, not extracted from any trained model — a
// handful of smooth low-frequency outer-product components (the kind of
// structure LoRA's low-rank bet exploits) plus a small full-rank noise floor
// (real weight matrices always have one, which is why they're never *exactly*
// low-rank). Disclosed in the widget copy below; not hidden.
function buildMatrix() {
  const rng = mulberry32(1337);
  const components = [
    { fu: 1, fv: 1, amp: 1.00 },
    { fu: 2, fv: 1, amp: 0.62 },
    { fu: 1, fv: 3, amp: 0.45 },
    { fu: 3, fv: 2, amp: 0.30 },
  ];
  const M = Array.from({ length: D }, () => new Array(K).fill(0));
  for (let i = 0; i < D; i++) {
    for (let j = 0; j < K; j++) {
      let v = 0;
      for (const { fu, fv, amp } of components) {
        v += amp * Math.sin((fu * Math.PI * (i + 0.5)) / D) * Math.cos((fv * Math.PI * (j + 0.5)) / K);
      }
      M[i][j] = v;
    }
  }
  for (let i = 0; i < D; i++) {
    for (let j = 0; j < K; j++) {
      M[i][j] += 0.14 * (rng() * 2 - 1); // noise floor — keeps the matrix technically full rank
    }
  }
  return M;
}

// ── Small dense linear algebra ───────────────────────────────────────────────
// A real SVD, computed in the browser: eigendecompose the K×K Gram matrix
// WᵀW with the classical cyclic Jacobi eigenvalue algorithm, then recover
// singular vectors/values from that eigendecomposition. Standard technique
// for small symmetric matrices; no external math library is loaded (per
// STYLE_GUIDE.md — no external runtime dependencies).
function transpose(M) {
  const rows = M.length, cols = M[0].length;
  const T = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) T[j][i] = M[i][j];
  return T;
}

function matMul(A, B) {
  const p = A.length, q = A[0].length, r = B[0].length;
  const C = Array.from({ length: p }, () => new Array(r).fill(0));
  for (let i = 0; i < p; i++) {
    for (let k = 0; k < q; k++) {
      const a = A[i][k];
      if (a === 0) continue;
      for (let j = 0; j < r; j++) C[i][j] += a * B[k][j];
    }
  }
  return C;
}

function jacobiEigenSymmetric(Ain, n, maxSweeps = 100, tol = 1e-12) {
  const a = Ain.map((row) => row.slice());
  const v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
    if (off < tol) break;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-15) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const sign = theta >= 0 ? 1 : -1;
        const t = sign / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        const app = a[p][p], aqq = a[q][q], apq = a[p][q];
        a[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
        a[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
        a[p][q] = 0; a[q][p] = 0;
        for (let i = 0; i < n; i++) {
          if (i === p || i === q) continue;
          const aip = a[i][p], aiq = a[i][q];
          a[i][p] = c * aip - s * aiq; a[p][i] = a[i][p];
          a[i][q] = s * aip + c * aiq; a[q][i] = a[i][q];
        }
        for (let i = 0; i < n; i++) {
          const vip = v[i][p], viq = v[i][q];
          v[i][p] = c * vip - s * viq;
          v[i][q] = s * vip + c * viq;
        }
      }
    }
  }
  const eigenvalues = Array.from({ length: n }, (_, i) => a[i][i]);
  return { eigenvalues, eigenvectors: v };
}

function computeSVD(W) {
  const Wt = transpose(W);
  const Gram = matMul(Wt, W); // K × K, symmetric positive semi-definite
  const { eigenvalues, eigenvectors } = jacobiEigenSymmetric(Gram, K);
  const order = eigenvalues
    .map((val, idx) => ({ val: Math.max(val, 0), idx }))
    .sort((a, b) => b.val - a.val);

  const S = [], V = [], U = [];
  for (const { val, idx } of order) {
    const sigma = Math.sqrt(val);
    const vCol = eigenvectors.map((row) => row[idx]); // length K, unit norm
    let uCol;
    if (sigma > 1e-9) {
      const raw = W.map((row) => row.reduce((s, wij, j) => s + wij * vCol[j], 0)); // W·v
      uCol = raw.map((x) => x / sigma);
    } else {
      uCol = new Array(D).fill(0);
    }
    S.push(sigma);
    V.push(vCol);
    U.push(uCol);
  }
  return { U, S, V }; // K components, descending by singular value
}

function outerScaled(u, v, scale) {
  return u.map((ui) => v.map((vj) => ui * vj * scale));
}
function addInPlace(A, B) {
  for (let i = 0; i < A.length; i++) for (let j = 0; j < A[0].length; j++) A[i][j] += B[i][j];
  return A;
}
function frobNorm(M) {
  let s = 0;
  for (const row of M) for (const v of row) s += v * v;
  return Math.sqrt(s);
}
function subtract(A, B) {
  return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}

// ── Precomputed once at module load: the matrix, its real SVD, and the
//    cumulative rank-r reconstructions / errors / explained variance for
//    every rank 0..K. Nothing here depends on component state — moving the
//    slider only ever indexes into arrays that were honestly computed. ──────
const W = buildMatrix();
const W_FROB = frobNorm(W);
const SVD = computeSVD(W);
const RANK_MAX = K; // = min(D, K)

const RECON_AT_RANK = [Array.from({ length: D }, () => new Array(K).fill(0))];
for (let r = 1; r <= RANK_MAX; r++) {
  const prev = RECON_AT_RANK[r - 1].map((row) => row.slice());
  addInPlace(prev, outerScaled(SVD.U[r - 1], SVD.V[r - 1], SVD.S[r - 1]));
  RECON_AT_RANK.push(prev);
}

const TOTAL_ENERGY = SVD.S.reduce((s, sig) => s + sig * sig, 0); // == W_FROB^2
const CUM_ENERGY = [0];
for (let r = 1; r <= RANK_MAX; r++) CUM_ENERGY.push(CUM_ENERGY[r - 1] + SVD.S[r - 1] * SVD.S[r - 1]);

const REL_ERROR_AT_RANK = RECON_AT_RANK.map((Wr) => frobNorm(subtract(W, Wr)) / W_FROB);
const EXPLAINED_VAR_AT_RANK = CUM_ENERGY.map((e) => (TOTAL_ENERGY > 0 ? (e / TOTAL_ENERGY) * 100 : 0));

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  accent: '#2dd4bf',
  red: '#f87171',
  bg2: '#111111',
  bg4: '#1e1e1e',
  border: '#242424',
  borderLt: '#2e2e2e',
  muted: '#555555',
  mid: '#888888',
  text: '#e8eaed',
  accentDim: '#0b2422',
  green: '#34d399',
  orange: '#fb923c',
};

function hexRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
const [AR, AG, AB] = hexRgb(C.accent);
const [RR, RG, RB] = hexRgb(C.red);
const [NR, NG, NB] = hexRgb(C.bg4);

function valColor(val) {
  const v = Math.max(-1, Math.min(1, val));
  const lerp = (a, b, t) => Math.round(a + t * (b - a));
  if (v <= 0) {
    const t = v + 1;
    return `rgb(${lerp(RR, NR, t)},${lerp(RG, NG, t)},${lerp(RB, NB, t)})`;
  }
  return `rgb(${lerp(NR, AR, v)},${lerp(NG, AG, v)},${lerp(NB, AB, v)})`;
}

function normalizeMax(M) {
  const maxAbs = Math.max(...M.flat().map(Math.abs), 1e-9);
  return M.map((row) => row.map((v) => v / maxAbs));
}

// ── SVG layout constants — heatmap row ────────────────────────────────────────
const CELL = 8;
const MATW = K * CELL; // 112
const MATH_ = D * CELL; // 160
const LBL = 16;
const PAD = 6;
const HGAP = 16;
const HX1 = PAD;
const HX2 = HX1 + MATW + HGAP;
const HX3 = HX2 + MATW + HGAP;
const HVW = HX3 + MATW + PAD; // 380
const HVH = LBL + MATH_ + PAD; // 182

// ── SVG layout constants — spectrum chart ────────────────────────────────────
const BAR_VW = HVW;
const BAR_VH = 92;
const BAR_PAD = 6;
const BAR_GAP = 3;
const BAR_W = (BAR_VW - 2 * BAR_PAD - (RANK_MAX - 1) * BAR_GAP) / RANK_MAX;
const BAR_MAXH = 58;
const BAR_BASE = BAR_VH - 22;
const SIGMA_MAX = SVD.S[0] || 1;

// ── Sub-components ────────────────────────────────────────────────────────────
function Heatmap({ matrix, x, y, normMatrix, onHover, id }) {
  return (
    <>
      {matrix.flatMap((row, i) =>
        row.map((val, j) => {
          const dv = normMatrix[i][j];
          return (
            <rect
              key={`${id}-${i}-${j}`}
              x={x + j * CELL}
              y={y + i * CELL}
              width={Math.max(1, CELL - 0.5)}
              height={Math.max(1, CELL - 0.5)}
              fill={valColor(dv)}
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => onHover({ id, row: i, col: j, val })}
              onMouseLeave={() => onHover(null)}
            />
          );
        })
      )}
    </>
  );
}

function MatBorder({ x, y, w, h }) {
  return <rect x={x} y={y} width={w} height={h} fill="none" stroke={C.border} strokeWidth={0.75} />;
}

function MatLabel({ cx, y, text }) {
  return (
    <text x={cx} y={y} fontFamily="'JetBrains Mono', monospace" fontSize={8} fill={C.muted} textAnchor="middle">
      {text}
    </text>
  );
}

function StatRow({ label, value, color, note }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', color: C.muted, marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: color || C.accent, lineHeight: 1 }}>
        {value}
      </div>
      {note && (
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '9.5px', fontStyle: 'italic', color: C.mid, marginTop: '3px', lineHeight: 1.4 }}>
          {note}
        </div>
      )}
    </div>
  );
}

function SpectrumChart({ rank }) {
  return (
    <svg width="100%" viewBox={`0 0 ${BAR_VW} ${BAR_VH}`} style={{ display: 'block' }} role="img" aria-label="Bar chart of singular values, largest to smallest, with bars up to the chosen rank highlighted">
      {SVD.S.map((sigma, i) => {
        const h = Math.max(1, (sigma / SIGMA_MAX) * BAR_MAXH);
        const x = BAR_PAD + i * (BAR_W + BAR_GAP);
        const y = BAR_BASE - h;
        const kept = i < rank;
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={BAR_W} height={h}
              fill={kept ? C.accent : C.bg4}
              stroke={kept ? 'none' : C.borderLt}
              strokeWidth={kept ? 0 : 0.6}
              rx={1}
            />
            <text
              x={x + BAR_W / 2} y={BAR_VH - 8}
              fontFamily="'JetBrains Mono', monospace" fontSize={6.5}
              fill={kept ? C.mid : C.muted} textAnchor="middle"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
      <line x1={BAR_PAD} y1={BAR_BASE} x2={BAR_VW - BAR_PAD} y2={BAR_BASE} stroke={C.border} strokeWidth={0.75} />
    </svg>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function LoRARankExplorer({ tryThis }) {
  const [rank, setRank] = useState(3);
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const Wr = RECON_AT_RANK[rank];
  const relErr = REL_ERROR_AT_RANK[rank];
  const explainedVar = EXPLAINED_VAR_AT_RANK[rank];

  const errMat = useMemo(() => subtract(W, Wr), [Wr]);

  const W_norm = useMemo(() => normalizeMax(W), []);
  const Wr_norm = useMemo(() => normalizeMax(Wr), [Wr]);
  const err_norm = useMemo(() => normalizeMax(errMat), [errMat]);

  const fullParams = D * K;
  const loraParams = rank * (D + K);
  const paramDelta = ((fullParams - loraParams) / fullParams) * 100; // positive = savings

  const sigmaKept = SVD.S[rank - 1];
  const sigmaNext = rank < RANK_MAX ? SVD.S[rank] : null;

  const handleHover = useCallback((info) => setHovered(info), []);
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  const monoSm = { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' };

  return (
    <WidgetCard title="LoRA rank explorer — how much of a matrix does rank r capture?" number="14.7" tryThis={tryThis}>
      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: '11.5px', fontStyle: 'italic',
        color: C.mid, margin: '0 0 14px', lineHeight: 1.55,
      }}>
        The 20×14 matrix below is synthetic — a few smooth components plus a
        noise floor, not weights pulled from a trained model — but its
        rank-r approximation is a real truncated SVD (singular value
        decomposition), computed from scratch in your browser via the Jacobi
        eigenvalue algorithm, not a canned number.
      </p>

      <div
        ref={containerRef}
        style={{ position: 'relative' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          {/* ── Visualization column ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <svg width="100%" viewBox={`0 0 ${HVW} ${HVH}`} style={{ display: 'block', overflow: 'visible' }}>
              <MatLabel cx={HX1 + MATW / 2} y={LBL - 5} text="W (illustrative)" />
              <MatLabel cx={HX2 + MATW / 2} y={LBL - 5} text={`Ŵ_r,  r=${rank}`} />
              <MatLabel cx={HX3 + MATW / 2} y={LBL - 5} text="W − Ŵ_r" />

              <Heatmap matrix={W} x={HX1} y={LBL} normMatrix={W_norm} onHover={handleHover} id="W" />
              <MatBorder x={HX1} y={LBL} w={MATW} h={MATH_} />

              <Heatmap matrix={Wr} x={HX2} y={LBL} normMatrix={Wr_norm} onHover={handleHover} id="Wr" />
              <MatBorder x={HX2} y={LBL} w={MATW} h={MATH_} />

              <Heatmap matrix={errMat} x={HX3} y={LBL} normMatrix={err_norm} onHover={handleHover} id="err" />
              <MatBorder x={HX3} y={LBL} w={MATW} h={MATH_} />
            </svg>

            <div style={{ marginTop: '14px' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', color: C.muted, marginBottom: '5px' }}>
                Singular value spectrum σ₁ … σ_{RANK_MAX} — teal bars are kept at the current rank, grey bars discarded
              </div>
              <SpectrumChart rank={rank} />
            </div>
          </div>

          {/* ── Stats panel ── */}
          <div style={{
            width: '180px', flexShrink: 0, background: C.bg2, border: `1px solid ${C.border}`,
            borderRadius: '8px', padding: '14px', alignSelf: 'flex-start',
          }}>
            <StatRow label="Full matrix params (D×K)" value={`${D}×${K} = ${fullParams}`} color={C.mid} />
            <StatRow label="Low-rank params r(D+K)" value={`${rank}×${D + K} = ${loraParams}`} />
            <StatRow
              label="Parameter change"
              value={`${paramDelta >= 0 ? '−' : '+'}${Math.abs(paramDelta).toFixed(1)}%`}
              color={paramDelta > 0 ? C.green : C.orange}
              note={paramDelta <= 0 ? 'r(D+K) now exceeds DK — low-rank only saves parameters when r ≪ D,K, which holds for real weight matrices (thousands of dims) but not this small toy one.' : undefined}
            />

            <div style={{ borderTop: `1px solid ${C.border}`, margin: '10px 0' }} />

            <StatRow label="‖W−Ŵ_r‖_F / ‖W‖_F" value={relErr.toFixed(4)} color={relErr < 0.1 ? C.accent : C.orange} />
            <StatRow label="Explained variance" value={`${explainedVar.toFixed(1)}%`} color={explainedVar > 90 ? C.green : C.accent} />

            <div style={{ borderTop: `1px solid ${C.border}`, margin: '10px 0' }} />

            <StatRow label="σ_r (smallest kept)" value={sigmaKept.toFixed(4)} color={C.mid} />
            <StatRow label="σ_(r+1) (first discarded)" value={sigmaNext === null ? '— (full rank)' : sigmaNext.toFixed(4)} color={C.mid} />
          </div>
        </div>

        {hovered && (
          <div style={{
            position: 'absolute', left: mousePos.x + 14, top: Math.max(0, mousePos.y - 36),
            pointerEvents: 'none', background: C.bg2, border: `1px solid ${C.border}`,
            borderRadius: '4px', padding: '4px 8px', fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px', color: C.text, zIndex: 20, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}>
            {hovered.id === 'W' ? 'W' : hovered.id === 'Wr' ? 'Ŵ_r' : 'W−Ŵ_r'}[{hovered.row},{hovered.col}] = {hovered.val.toFixed(4)}
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ ...monoSm, color: C.muted, minWidth: '70px' }}>
            rank r = {rank}
          </span>
          <input
            type="range"
            min={1} max={RANK_MAX} step={1}
            value={rank}
            onChange={(e) => setRank(Number(e.target.value))}
            style={{ width: '160px', accentColor: C.accent, cursor: 'pointer' }}
          />
          <span style={{ ...monoSm, fontSize: '10px', color: C.mid }}>
            max rank = min(D,K) = {RANK_MAX}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ ...monoSm, color: C.muted, minWidth: '70px' }}>presets</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 8, RANK_MAX].map((r) => {
              const active = rank === r;
              return (
                <button
                  key={r}
                  onClick={() => setRank(r)}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
                    fontWeight: active ? 600 : 400, color: active ? '#0a0a0a' : C.muted,
                    background: active ? C.accent : 'transparent',
                    border: `1px solid ${active ? C.accent : C.border}`,
                    borderRadius: '4px', padding: '4px 10px', cursor: 'pointer',
                  }}
                >
                  {r === RANK_MAX ? 'full' : r}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
