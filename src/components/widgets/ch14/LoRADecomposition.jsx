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

const D = 8, K = 8;

function makeW0() {
  const rng = mulberry32(99);
  return Array.from({ length: D }, () =>
    Array.from({ length: K }, () => rng() * 2 - 1)
  );
}

function makeA(r) {
  const rng = mulberry32(200 + r * 7);
  const scale = 1 / Math.sqrt(r);
  return Array.from({ length: r }, () =>
    Array.from({ length: K }, () => (rng() * 2 - 1) * scale)
  );
}

function makeZeroB(r) {
  return Array.from({ length: D }, () => Array(r).fill(0));
}

function makeRandomB(r, seed) {
  const rng = mulberry32(seed);
  return Array.from({ length: D }, () =>
    Array.from({ length: r }, () => {
      const u1 = Math.max(1e-10, rng());
      const u2 = rng();
      return 0.1 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    })
  );
}

function matMul(B, A) {
  const r = B[0].length;
  return Array.from({ length: D }, (_, i) =>
    Array.from({ length: K }, (_, j) => {
      let s = 0;
      for (let k = 0; k < r; k++) s += B[i][k] * A[k][j];
      return s;
    })
  );
}

function matAddScaled(W0, dW, scale) {
  return W0.map((row, i) => row.map((v, j) => v + scale * dW[i][j]));
}

function frobNorm(M) {
  return Math.sqrt(M.flat().reduce((s, v) => s + v * v, 0));
}

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  red:       '#f87171',
  bg4:       '#1e1e1e',
  bg2:       '#111111',
  border:    '#242424',
  muted:     '#555555',
  mid:       '#888888',
  text:      '#e8eaed',
  accentDim: '#0b2422',
  green:     '#34d399',
  orange:    '#fb923c',
};

function hexRgb(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}
const [AR,AG,AB] = hexRgb(C.accent);
const [RR,RG,RB] = hexRgb(C.red);
const [NR,NG,NB] = hexRgb(C.bg4);

function valColor(val) {
  const v = Math.max(-1, Math.min(1, val));
  const lerp = (a, b, t) => Math.round(a + t * (b - a));
  if (v <= 0) {
    const t = v + 1;
    return `rgb(${lerp(RR,NR,t)},${lerp(RG,NG,t)},${lerp(RB,NB,t)})`;
  }
  return `rgb(${lerp(NR,AR,v)},${lerp(NG,AG,v)},${lerp(NB,AB,v)})`;
}

function normalizeMax(M) {
  const maxAbs = Math.max(...M.flat().map(Math.abs), 1e-9);
  return M.map(row => row.map(v => v / maxAbs));
}

// ── SVG layout constants ──────────────────────────────────────────────────────
const CELL = 18;          // 8×8 matrix cell size (px in viewBox units)
const MAT  = D * CELL;   // 144 — full matrix side
const BW   = 72;          // B total width (fixed; cell = BW/r)
const AH   = 50;          // A total height (fixed; cell = AH/r)
const LBL  = 18;          // label row height above matrices
const PAD  = 8;

const W0X  = PAD;
const BX   = W0X + MAT + 30;    // 182
const AX   = BX + BW + 20;      // 274
const WEX  = AX + MAT + 30;     // 448
const VW   = WEX + MAT + PAD;   // 600
const VH   = LBL + MAT + PAD;   // 170

const OPY  = LBL + MAT / 2;
const PLUSX = (W0X + MAT + BX) / 2;   // 167
const DOTX  = (BX + BW + AX) / 2;     // 264
const EQX   = (AX + MAT + WEX) / 2;   // 433

// ── Sub-components (render inside SVG) ───────────────────────────────────────
function Heatmap({ matrix, x, y, cellW, cellH, normMatrix, onHover, name }) {
  return (
    <>
      {matrix.flatMap((row, i) =>
        row.map((val, j) => {
          const dv = normMatrix ? normMatrix[i][j] : val;
          return (
            <rect
              key={`${i}-${j}`}
              x={x + j * cellW}
              y={y + i * cellH}
              width={Math.max(1, cellW - 0.5)}
              height={Math.max(1, cellH - 0.5)}
              fill={valColor(dv)}
              style={{ cursor: 'crosshair', transition: 'fill 0.25s ease' }}
              aria-label={`${name}, row ${i + 1}, column ${j + 1}: ${val.toFixed(4)}`}
              onMouseEnter={() => onHover({ row: i, col: j, val })}
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
    <text x={cx} y={y} fontFamily="'JetBrains Mono', monospace" fontSize={8.5} fill={C.muted} textAnchor="middle">
      {text}
    </text>
  );
}

function Op({ x, y, text }) {
  return (
    <text x={x} y={y} fontFamily="'JetBrains Mono', monospace" fontSize={13} fill={C.muted} textAnchor="middle" dominantBaseline="central">
      {text}
    </text>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────
function StatRow({ label, value, color }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color: C.muted, marginBottom:'2px' }}>
        {label}
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color: color || C.accent, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

// ── W₀ precomputed once ───────────────────────────────────────────────────────
const W0      = makeW0();
const W0_NORM = normalizeMax(W0);
const W0_FROB = frobNorm(W0);

// ── Main widget ───────────────────────────────────────────────────────────────
export default function LoRADecomposition({ tryThis }) {
  const [rank,    setRank]   = useState(2);
  const [alpha,   setAlpha]  = useState(8);
  const [bState,  setBState] = useState({ zero: true, seed: 0 });
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const A = useMemo(() => makeA(rank), [rank]);
  const B = useMemo(() =>
    bState.zero ? makeZeroB(rank) : makeRandomB(rank, bState.seed),
    [rank, bState]
  );

  const dW   = useMemo(() => matMul(B, A), [B, A]);
  const scale = alpha / rank;
  const Weff = useMemo(() => matAddScaled(W0, dW, scale), [dW, scale]);

  const B_norm    = useMemo(() => normalizeMax(B),    [B]);
  const A_norm    = useMemo(() => normalizeMax(A),    [A]);
  const dW_norm   = useMemo(() => normalizeMax(dW),   [dW]);
  const Weff_norm = useMemo(() => normalizeMax(Weff), [Weff]);

  const dW_frob    = useMemo(() => frobNorm(dW), [dW]);
  const loraParams  = D * rank + rank * K;
  const paramPct    = ((64 - loraParams) / 64 * 100).toFixed(1);
  const adaptRatio  = dW_frob / W0_FROB;

  const bCellW = BW / rank;
  const aCellH = AH / rank;

  const handleHover = useCallback((info) => setHovered(info), []);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleRankChange = (r) => {
    setRank(r);
    if (!bState.zero) setBState(s => ({ ...s, seed: s.seed + 1 }));
  };

  const handleRandomize = () =>
    setBState({ zero: false, seed: Math.floor(Math.random() * 1e6) + 1 });

  const handleResetB = () => setBState({ zero: true, seed: 0 });

  return (
    <WidgetCard title="LoRA — low-rank weight adaptation visualized" number="14.6" tryThis={tryThis}>
      <div
        ref={containerRef}
        style={{ position: 'relative' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          {/* ── Visualization column ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Main row SVG */}
            <svg
              width="100%"
              viewBox={`0 0 ${VW} ${VH}`}
              style={{ display: 'block', overflow: 'visible' }}
            >
              {/* Labels */}
              <MatLabel cx={W0X + MAT/2}  y={LBL - 5} text="W₀ (frozen)" />
              <MatLabel cx={BX  + BW/2}   y={LBL - 5} text={`B (8×${rank})`} />
              <MatLabel cx={AX  + MAT/2}  y={LBL - 5} text={`A (${rank}×8)`} />
              <MatLabel cx={WEX + MAT/2}  y={LBL - 5} text="W_eff = W₀ + ΔW" />

              {/* W₀ */}
              <Heatmap matrix={W0}   x={W0X} y={LBL} cellW={CELL}   cellH={CELL} normMatrix={W0_NORM}  onHover={handleHover} name="Frozen weights W0" />
              <MatBorder x={W0X} y={LBL} w={MAT} h={MAT} />

              <Op x={PLUSX} y={OPY} text="+" />

              {/* B */}
              <Heatmap matrix={B}    x={BX}  y={LBL} cellW={bCellW} cellH={CELL} normMatrix={B_norm}   onHover={handleHover} name="LoRA matrix B" />
              <MatBorder x={BX} y={LBL} w={BW} h={MAT} />

              <Op x={DOTX} y={OPY} text="·" />

              {/* A */}
              <Heatmap matrix={A}    x={AX}  y={LBL} cellW={CELL}   cellH={aCellH} normMatrix={A_norm} onHover={handleHover} name="LoRA matrix A" />
              <MatBorder x={AX} y={LBL} w={MAT} h={AH} />

              <Op x={EQX} y={OPY} text="=" />

              {/* W_eff */}
              <Heatmap matrix={Weff} x={WEX} y={LBL} cellW={CELL}   cellH={CELL} normMatrix={Weff_norm} onHover={handleHover} name="Effective weights" />
              <MatBorder x={WEX} y={LBL} w={MAT} h={MAT} />
            </svg>

            {/* ΔW section */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color: C.muted, marginBottom:'5px' }}>
                ΔW = B·A &nbsp; (learned perturbation)
              </div>
              <svg width={MAT + PAD * 2} height={MAT + PAD} style={{ display: 'block' }}>
                <Heatmap matrix={dW} x={PAD} y={PAD / 2} cellW={CELL} cellH={CELL} normMatrix={dW_norm} onHover={handleHover} name="Learned perturbation" />
                <MatBorder x={PAD} y={PAD / 2} w={MAT} h={MAT} />
              </svg>
            </div>
          </div>

          {/* ── Stats panel ── */}
          <div style={{
            width: '172px',
            flexShrink: 0,
            background: C.bg2,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '14px',
            alignSelf: 'flex-start',
          }}>
            <StatRow label="Full fine-tune params"  value="8 × 8 = 64"                     color={C.mid} />
            <StatRow label="LoRA params (B + A)"    value={`${D}×${rank} + ${rank}×${K} = ${loraParams}`} />
            <StatRow label="Param reduction"        value={`${paramPct}%`}                  color={parseFloat(paramPct) > 50 ? C.green : C.accent} />

            <div style={{ borderTop:`1px solid ${C.border}`, margin:'10px 0' }} />

            <StatRow label="‖ΔW‖_F"         value={dW_frob < 1e-8 ? '≈ 0'          : dW_frob.toFixed(4)}   color={dW_frob < 1e-8 ? C.muted : C.accent} />
            <StatRow label="‖W₀‖_F"         value={W0_FROB.toFixed(4)}                                       color={C.mid} />
            <StatRow label="Adaptation ratio" value={dW_frob < 1e-8 ? '0.0000' : adaptRatio.toFixed(4)}     color={adaptRatio > 0.1 ? C.orange : C.accent} />

            <div style={{ borderTop:`1px solid ${C.border}`, margin:'10px 0' }} />

            <StatRow label="Current rank r"      value={String(rank)} />
            <StatRow label="Effective scale α/r" value={`${alpha}/${rank} = ${scale.toFixed(2)}`} />
          </div>
        </div>

        {/* Tooltip */}
        {hovered && (
          <div style={{
            position: 'absolute',
            left: mousePos.x + 14,
            top:  Math.max(0, mousePos.y - 36),
            pointerEvents: 'none',
            background: C.bg2,
            border: `1px solid ${C.border}`,
            borderRadius: '4px',
            padding: '4px 8px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: C.text,
            zIndex: 20,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}>
            [{hovered.row},{hovered.col}] = {hovered.val.toFixed(4)}
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Rank selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color: C.muted, minWidth:'54px' }}>
            rank r
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 4, 8].map(r => {
              const active = rank === r;
              return (
                <button
                  key={r}
                  onClick={() => handleRankChange(r)}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#0a0a0a' : C.muted,
                    background: active ? C.accent : 'transparent',
                    border: `1px solid ${active ? C.accent : C.border}`,
                    borderRadius: '4px',
                    padding: '4px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alpha slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color: C.muted, minWidth:'54px' }}>
            α = {alpha}
          </span>
          <input
            type="range"
            min={1} max={32} step={1}
            value={alpha}
            onChange={e => setAlpha(Number(e.target.value))}
            style={{ width: '130px' }}
          />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color: C.mid }}>
            effective scale = α/r = {scale.toFixed(2)}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleRandomize}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: C.accent,
              background: C.accentDim,
              border: `1px solid ${C.accent}`,
              borderRadius: '4px',
              padding: '5px 14px',
              cursor: 'pointer',
            }}
          >
            Randomize B
          </button>
          <button
            onClick={handleResetB}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: C.muted,
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: '4px',
              padding: '5px 14px',
              cursor: 'pointer',
            }}
          >
            Reset B to zero
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}
