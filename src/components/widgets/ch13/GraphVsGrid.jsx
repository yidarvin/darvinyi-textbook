import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Constants ──────────────────────────────────────────────────────────────────

const IMAGE = [
  [0.8, 0.7, 0.6, 0.3, 0.2, 0.1],
  [0.9, 0.8, 0.5, 0.4, 0.1, 0.2],
  [0.7, 0.6, 0.4, 0.5, 0.3, 0.2],
  [0.3, 0.4, 0.6, 0.7, 0.5, 0.4],
  [0.2, 0.3, 0.5, 0.8, 0.7, 0.6],
  [0.1, 0.2, 0.3, 0.6, 0.8, 0.9],
];

const KERNELS = {
  edge:    [[-1,0,1],[-2,0,2],[-1,0,1]],
  blur:    [[1,2,1],[2,4,2],[1,2,1]].map(r => r.map(v => v / 16)),
  sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]],
};

const C = {
  accent: '#2dd4bf', accentDim: '#0b2422', red: '#f87171',
  bg2: '#111111', bg3: '#161616', bg4: '#1e1e1e',
  border: '#242424', borderLt: '#2e2e2e',
  text: '#e8eaed', textMid: '#888888', textMute: '#555555',
  math: '#fbbf24', codeBg: '#0a0a0a',
};

// ── SVG layout — full 616px width, scale 1:1 ─────────────────────────────────
//
//  Left panel (CNN):  x 0..296  (grid 190px + 10px gap + kernel 86px = 296)
//  Right panel (GNN): x 320..616
//
const SVG_W = 616, SVG_H = 276;
const R_OFF = 320;   // right panel x offset

// CNN grid: 30px cells, 2px gaps → 6*32−2 = 190px total
const CELL = 30, GAP = 2, STEP = 32;
const GX = 10, GY = 22, GTOT = 190;

// CNN kernel: 28px cells beside grid, vertically centred with grid
//   Grid right edge: GX+GTOT = 200.  Kernel left edge: 210.  Right edge: 210+86 = 296.
//   Grid centre y: GY+GTOT/2 = 117.  Kernel half-height: (3*28+2)/2 = 43.  KY = 74.
const KCELL = 28, KSTEP = 29;   // KSTEP = 28+1 gap
const KX = 210, KY = 74;

// GNN nodes: 72px spacing, radius 22
const NSP = 72, NR = 22;
const nX = c => c * NSP + 68 + R_OFF;   // [388, 460, 532]
const nY = r => r * NSP + 68;           // [68, 140, 212]
const CX = nX(1), CY = nY(1);           // centre node: (460, 140)

// Shared output y — both panels show output at the same baseline
const Y_PHASE2 = GY + GTOT + 40;   // 252  (phase-2 step text / running sum)
const Y_OUT    = GY + GTOT + 56;   // 268  (phase-3 output)

// ── Helpers ───────────────────────────────────────────────────────────────────

const grayFill = v => { const g = Math.round(v * 255); return `rgb(${g},${g},${g})`; };
const lblCol   = v => v > 0.5 ? '#333333' : '#cccccc';
const edgeCol  = v => v > 0 ? C.accent : v < 0 ? C.red : C.borderLt;

function kFmt(v) {
  if (Math.abs(v) < 0.001) return '0';
  if (Math.abs(v - Math.round(v)) < 0.005) return String(Math.round(v));
  return v.toFixed(3);
}

function getPatch(cr, cc) {
  return Array.from({ length: 3 }, (_, dr) =>
    Array.from({ length: 3 }, (_, dc) => IMAGE[cr - 1 + dr][cc - 1 + dc])
  );
}

function dotProduct(patch, kernel) {
  let s = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s += patch[r][c] * kernel[r][c];
  return s;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GraphVsGrid() {
  const [center,    setCenter]    = useState({ r: 2, c: 2 });
  const [kName,     setKName]     = useState('edge');
  const [animT,     setAnimT]     = useState(null);
  const [showSteps, setShowSteps] = useState(true);

  const rafRef = useRef(null);
  const t0Ref  = useRef(0);

  const kernel   = KERNELS[kName];
  const patch    = getPatch(center.r, center.c);
  const output   = dotProduct(patch, kernel);
  const products = Array.from({ length: 9 }, (_, i) => {
    const dr = Math.floor(i / 3), dc = i % 3;
    return { pv: patch[dr][dc], kv: kernel[dr][dc], prod: patch[dr][dc] * kernel[dr][dc] };
  });

  const TOTAL  = showSteps ? 1300 : 300;
  const P1_END = showSteps ? 600  : 0;
  const P2_END = showSteps ? 1000 : 0;

  const isAnim = animT !== null && animT < TOTAL;
  const isDone = animT !== null && animT >= TOTAL;

  let phase = null, pp = 0;
  if (animT !== null) {
    if (!showSteps || animT >= P2_END) {
      phase = 3; pp = Math.min(1, (animT - P2_END) / 300);
    } else if (animT < P1_END) {
      phase = 1; pp = animT / P1_END;
    } else {
      phase = 2; pp = (animT - P1_END) / (P2_END - P1_END);
    }
  }

  const flashIdx  = phase === 1 ? Math.min(8, Math.floor(pp * 9)) : -1;
  const flashSubP = phase === 1 ? pp * 9 - Math.max(0, flashIdx)  : 0;
  const msgProg   = phase === 1 ? pp : (phase !== null && phase > 1 ? 1 : 0);
  const showMsgs  = phase === 1;

  // Running sum for phase 2 GNN annotation
  const rSumN = phase === 2
    ? Math.min(9, Math.floor(pp * 9) + 1)
    : (phase === 3 || isDone ? 9 : 0);
  let rSum = 0;
  for (let i = 0; i < rSumN; i++) {
    const dr = Math.floor(i / 3), dc = i % 3;
    rSum += patch[dr][dc] * kernel[dr][dc];
  }

  const prodIdx = phase === 2 ? Math.floor(pp * 9) : (phase === 3 || isDone ? 9 : -1);
  const outVal  = phase === 3 ? output * pp : (isDone ? output : null);

  // ── Animation control ───────────────────────────────────────────────────────

  function startAnim() {
    if (isAnim) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    t0Ref.current = performance.now();
    setAnimT(0);
    const total = showSteps ? 1300 : 300;
    function tick(ts) {
      const e = ts - t0Ref.current;
      setAnimT(e);
      if (e < total) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function resetAnim() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimT(null);
  }

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  function handleCellClick(r, c) {
    if (r < 1 || r > 4 || c < 1 || c > 4) return;
    resetAnim();
    setCenter({ r, c });
  }

  // ── Shared style helpers ────────────────────────────────────────────────────

  const mono = { fontFamily: "'JetBrains Mono', monospace" };

  function tabBtn(active, onClick, label) {
    return (
      <button key={label} onClick={onClick}
        style={{
          padding: '3px 10px', borderRadius: '4px', ...mono, fontSize: '11px',
          border: `1px solid ${active ? C.accent : C.border}`,
          background: active ? C.accentDim : C.bg4,
          color: active ? C.accent : C.textMid,
          cursor: 'pointer', flexShrink: 0,
        }}>
        {label}
      </button>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <WidgetCard title="Graph vs Grid — CNN is a special case of GNN" number="14.4">

      {/* Full-width SVG — no right stats column, scale 1:1 */}
      <div style={{ background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
          <rect width={SVG_W} height={SVG_H} fill={C.codeBg} />

          {/* Panel tints */}
          <rect x={0}     y={0} width={296} height={SVG_H} fill={C.bg2} opacity={0.22} />
          <rect x={R_OFF} y={0} width={296} height={SVG_H} fill={C.bg3} opacity={0.22} />

          {/* Separator */}
          <line x1={308} y1={14} x2={308} y2={SVG_H - 14}
            stroke={C.border} strokeWidth={0.5} strokeDasharray="4 3" />

          {/* Panel labels */}
          {['CNN VIEW', 'GNN VIEW'].map((t, i) => (
            <text key={t} x={i === 0 ? 148 : 468} y={14}
              textAnchor="middle" fill={C.textMute}
              fontSize={9} fontFamily="JetBrains Mono, monospace" letterSpacing="0.09em">
              {t}
            </text>
          ))}

          {/* ── LEFT: 6×6 pixel grid ── */}
          {Array.from({ length: 6 }, (_, gr) =>
            Array.from({ length: 6 }, (_, gc) => {
              const cx  = GX + gc * STEP;
              const cy  = GY + gr * STEP;
              const v   = IMAGE[gr][gc];
              const isC = gr === center.r && gc === center.c;
              const inN = Math.abs(gr - center.r) <= 1 && Math.abs(gc - center.c) <= 1;
              const dr  = gr - (center.r - 1);
              const dc  = gc - (center.c - 1);
              const fo  = (inN && flashIdx === dr * 3 + dc)
                ? Math.sin(flashSubP * Math.PI) * 0.38 : 0;
              const isValid = gr >= 1 && gr <= 4 && gc >= 1 && gc <= 4;
              return (
                <g key={`g${gr}${gc}`}
                  onClick={() => handleCellClick(gr, gc)}
                  style={{ cursor: isValid ? 'pointer' : 'default' }}>
                  <rect x={cx} y={cy} width={CELL} height={CELL}
                    fill={grayFill(v)}
                    stroke={isC ? C.accent : C.border}
                    strokeWidth={isC ? 2 : 0.5} rx={1}
                    opacity={isValid ? 1 : 0.65} />
                  {inN && (
                    <rect x={cx} y={cy} width={CELL} height={CELL}
                      fill={isC ? 'rgba(45,212,191,0.25)' : 'rgba(45,212,191,0.15)'}
                      rx={1} style={{ pointerEvents: 'none' }} />
                  )}
                  {fo > 0 && (
                    <rect x={cx} y={cy} width={CELL} height={CELL}
                      fill={`rgba(255,255,255,${fo})`}
                      rx={1} style={{ pointerEvents: 'none' }} />
                  )}
                  <text x={cx + CELL / 2} y={cy + CELL / 2 + 4}
                    textAnchor="middle" fill={lblCol(v)}
                    fontSize={8} fontFamily="JetBrains Mono, monospace"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {v.toFixed(1)}
                  </text>
                </g>
              );
            })
          ).flat()}

          {/* ── LEFT: kernel display (beside grid, vertically centred) ── */}
          <text x={KX + 43} y={KY - 6} textAnchor="middle"
            fill={C.textMute} fontSize={8} fontFamily="JetBrains Mono, monospace">
            {`kernel · ${kName}`}
          </text>
          {Array.from({ length: 3 }, (_, kr) =>
            Array.from({ length: 3 }, (_, kc) => {
              const kx = KX + kc * KSTEP;
              const ky = KY + kr * KSTEP;
              const kv = kernel[kr][kc];
              const bg = kv > 0 ? 'rgba(45,212,191,0.32)'
                       : kv < 0 ? 'rgba(248,113,113,0.32)' : C.bg4;
              return (
                <g key={`kc${kr}${kc}`}>
                  <rect x={kx} y={ky} width={KCELL} height={KCELL}
                    fill={bg} stroke={C.borderLt} strokeWidth={0.5} rx={1} />
                  <text x={kx + KCELL / 2} y={ky + KCELL / 2 + 4}
                    textAnchor="middle"
                    fill={kv > 0 ? C.accent : kv < 0 ? C.red : C.textMid}
                    fontSize={9} fontFamily="JetBrains Mono, monospace"
                    style={{ userSelect: 'none' }}>
                    {kFmt(kv)}
                  </text>
                </g>
              );
            })
          ).flat()}

          {/* Phase 2 CNN: current multiplication step */}
          {showSteps && (phase === 2 || phase === 3 || isDone) && (() => {
            const i = Math.min(8, phase === 2 ? Math.floor(pp * 9) : 8);
            const { pv, kv, prod } = products[i];
            return (
              <text x={148} y={Y_PHASE2}
                textAnchor="middle" fill={C.math}
                fontSize={9} fontFamily="JetBrains Mono, monospace">
                {`${pv.toFixed(2)} × ${kFmt(kv)} = ${prod.toFixed(3)}`}
              </text>
            );
          })()}

          {/* Phase 3 CNN: output (same y as GNN output) */}
          {(phase === 3 || isDone) && (
            <text x={148} y={Y_OUT}
              textAnchor="middle" fill={C.accent}
              fontSize={13} fontFamily="JetBrains Mono, monospace" fontWeight="600">
              {`Out = ${(outVal ?? output).toFixed(3)}`}
            </text>
          )}

          {/* ── RIGHT: GNN edges ── */}
          {Array.from({ length: 3 }, (_, nr) =>
            Array.from({ length: 3 }, (_, nc) => {
              if (nr === 1 && nc === 1) return null;
              const kv = kernel[nr][nc];
              const ew = kv === 0 ? 0.5 : Math.max(0.5, Math.abs(kv) * 2.5);
              return (
                <line key={`e${nr}${nc}`}
                  x1={CX} y1={CY} x2={nX(nc)} y2={nY(nr)}
                  stroke={edgeCol(kv)} strokeWidth={ew} opacity={0.55} />
              );
            })
          ).flat().filter(Boolean)}

          {/* Edge weight labels — skip zero to reduce clutter */}
          {Array.from({ length: 3 }, (_, nr) =>
            Array.from({ length: 3 }, (_, nc) => {
              if (nr === 1 && nc === 1) return null;
              const kv = kernel[nr][nc];
              if (kv === 0) return null;
              const ex = nX(nc), ey = nY(nr);
              const mx = (CX + ex) / 2, my = (CY + ey) / 2;
              const dx = ex - CX, dy = ey - CY;
              const len = Math.sqrt(dx * dx + dy * dy);
              const px = (-dy / len) * 10, py = (dx / len) * 10;
              return (
                <text key={`el${nr}${nc}`}
                  x={mx + px} y={my + py}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={edgeCol(kv)} fontSize={9}
                  fontFamily="JetBrains Mono, monospace">
                  {kFmt(kv)}
                </text>
              );
            })
          ).flat().filter(Boolean)}

          {/* Self-loop for non-zero centre kernel weight (upper-right arc) */}
          {(() => {
            const kv = kernel[1][1];
            if (kv === 0) return null;
            const ew = Math.max(0.5, Math.abs(kv) * 2.2);
            const sx = CX + 14, sy = CY - 17;
            return (
              <g key="self">
                <path d={`M ${sx} ${sy} C ${sx+34} ${sy-34} ${sx+50} ${sy+8} ${sx} ${sy}`}
                  fill="none" stroke={edgeCol(kv)} strokeWidth={ew} opacity={0.8} />
                <text x={sx + 52} y={sy - 5}
                  fill={edgeCol(kv)} fontSize={9}
                  fontFamily="JetBrains Mono, monospace">
                  {kFmt(kv)}
                </text>
              </g>
            );
          })()}

          {/* Message travelers (phase 1) */}
          {showMsgs && Array.from({ length: 3 }, (_, nr) =>
            Array.from({ length: 3 }, (_, nc) => {
              if (nr === 1 && nc === 1) return null;
              const kv = kernel[nr][nc];
              const ex = nX(nc), ey = nY(nr);
              const pv = patch[nr][nc];
              const tx = ex + (CX - ex) * msgProg;
              const ty = ey + (CY - ey) * msgProg;
              return (
                <g key={`msg${nr}${nc}`}>
                  <circle cx={tx} cy={ty} r={6}
                    fill={grayFill(pv)}
                    stroke="rgba(255,255,255,0.5)" strokeWidth={0.5} />
                  {kv !== 0 && (
                    <text x={tx + 7} y={ty - 4}
                      fill={edgeCol(kv)} fontSize={7}
                      fontFamily="JetBrains Mono, monospace">
                      {`×${kFmt(kv)}`}
                    </text>
                  )}
                </g>
              );
            })
          ).flat().filter(Boolean)}

          {/* GNN nodes */}
          {Array.from({ length: 3 }, (_, nr) =>
            Array.from({ length: 3 }, (_, nc) => {
              const nx2 = nX(nc), ny2 = nY(nr);
              const isC = nr === 1 && nc === 1;
              const pv  = patch[nr][nc];
              return (
                <g key={`n${nr}${nc}`}>
                  <circle cx={nx2} cy={ny2} r={NR}
                    fill={grayFill(pv)}
                    stroke={isC ? C.accent : C.borderLt}
                    strokeWidth={isC ? 2.5 : 1.5} />
                  <text x={nx2} y={ny2 + 4}
                    textAnchor="middle" fill={lblCol(pv)}
                    fontSize={10} fontFamily="JetBrains Mono, monospace"
                    style={{ userSelect: 'none' }}>
                    {pv.toFixed(2)}
                  </text>
                  {isC && (
                    <text x={nx2} y={ny2 + NR + 13}
                      textAnchor="middle" fill={C.accent}
                      fontSize={8} fontFamily="JetBrains Mono, monospace">
                      center
                    </text>
                  )}
                </g>
              );
            })
          ).flat()}

          {/* Phase 2 GNN: running sum */}
          {showSteps && (phase === 2 || phase === 3 || isDone) && (
            <text x={468} y={Y_PHASE2}
              textAnchor="middle" fill={C.math}
              fontSize={10} fontFamily="JetBrains Mono, monospace">
              {`Σ = ${rSum.toFixed(3)}`}
            </text>
          )}

          {/* Phase 3 GNN: output (same y as CNN output) */}
          {(phase === 3 || isDone) && (
            <text x={468} y={Y_OUT}
              textAnchor="middle" fill={C.accent}
              fontSize={13} fontFamily="JetBrains Mono, monospace" fontWeight="600">
              {`Out = ${(outVal ?? output).toFixed(3)}`}
            </text>
          )}
        </svg>
      </div>

      {/* ── Stats strip — full width, horizontal ── */}
      <div style={{
        marginTop: '8px',
        background: C.bg2, border: `1px solid ${C.border}`,
        borderRadius: '8px', padding: '10px 16px',
        display: 'flex', gap: '0', alignItems: 'stretch',
        ...mono, fontSize: '10px', color: C.textMid,
      }}>

        {/* Kernel + weights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '16px', minWidth: 120 }}>
          <div style={{ fontSize: '8.5px', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1px' }}>
            Kernel
          </div>
          <div style={{ color: C.accent, fontSize: '11px' }}>
            {kName === 'edge' ? 'Edge Detect' : kName === 'blur' ? 'Blur' : 'Sharpen'}
          </div>
          {[0, 1, 2].map(kr => (
            <div key={kr} style={{ color: C.math, fontSize: '10px', whiteSpace: 'pre' }}>
              {`[${kernel[kr].map(v => kFmt(v).padStart(5)).join('')}]`}
            </div>
          ))}
          <div style={{ color: C.textMute, fontSize: '9px', marginTop: '4px' }}>
            ({center.r},{center.c}) val {patch[1][1].toFixed(2)}
          </div>
        </div>

        <div style={{ width: 1, background: C.border, flexShrink: 0, margin: '0 16px' }} />

        {/* Computation — 3×3 grid matching kernel layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '8.5px', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1px' }}>
            Computation
          </div>
          {[0, 1, 2].map(kr => (
            <div key={kr} style={{ display: 'flex', gap: '6px' }}>
              {[0, 1, 2].map(kc => {
                const i = kr * 3 + kc;
                const { pv, kv, prod } = products[i];
                const active = prodIdx >= 0 && (i <= prodIdx || isDone);
                return (
                  <div key={kc} style={{ flex: 1, fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <span style={{ color: active ? C.textMid : C.textMute }}>
                      {`${pv.toFixed(2)}×${kFmt(kv)}`}
                    </span>
                    <span style={{ color: active ? C.math : C.textMute }}>
                      {`=${prod.toFixed(2)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '4px', marginTop: '2px', color: C.accent, fontSize: '10px' }}>
            Sum = {output.toFixed(3)}
          </div>
        </div>

        <div style={{ width: 1, background: C.border, flexShrink: 0, margin: '0 16px' }} />

        {/* Output + equivalence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 110 }}>
          <div style={{ fontSize: '8.5px', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1px' }}>
            Output
          </div>
          <div style={{ fontSize: '22px', color: C.accent, lineHeight: 1, minHeight: '26px', ...mono }}>
            {output.toFixed(3)}
          </div>
          <div style={{ fontSize: '9px', color: isDone ? C.accent : C.textMute, marginTop: '2px' }}>
            CNN = GNN
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '4px', marginTop: 'auto', fontSize: '9px', color: C.textMid, lineHeight: 1.6 }}>
            9 msgs, 9 weights<br />
            msg_i = px_i × w_i
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button disabled={isAnim} onClick={startAnim}
            style={{
              padding: '6px 18px', borderRadius: '4px', ...mono, fontSize: '11px', fontWeight: 600,
              border: `1px solid ${isAnim ? C.border : C.accent}`,
              background: isAnim ? C.bg4 : C.accentDim,
              color: isAnim ? C.textMute : C.accent,
              cursor: isAnim ? 'not-allowed' : 'pointer',
              opacity: isAnim ? 0.5 : 1, flexShrink: 0,
            }}>
            {isAnim ? 'Computing…' : 'Compute'}
          </button>
          {animT !== null && (
            <button onClick={resetAnim}
              style={{
                padding: '5px 12px', borderRadius: '4px', ...mono, fontSize: '11px',
                border: `1px solid ${C.borderLt}`, background: C.bg4,
                color: C.textMid, cursor: 'pointer', flexShrink: 0,
              }}>
              ↺ Reset
            </button>
          )}
          <div style={{ width: 1, background: C.border, alignSelf: 'stretch', flexShrink: 0 }} />
          <span style={{ ...mono, fontSize: '11px', color: C.textMute, flexShrink: 0 }}>Kernel</span>
          {[['edge','Edge Detect'],['blur','Blur'],['sharpen','Sharpen']].map(([k, lbl]) =>
            tabBtn(k === kName, () => { setKName(k); resetAnim(); }, lbl)
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ ...mono, fontSize: '11px', color: C.textMute, flexShrink: 0 }}>Steps</span>
          {tabBtn(showSteps, () => { setShowSteps(s => !s); resetAnim(); }, showSteps ? 'On' : 'Off')}
          <span style={{ ...mono, fontSize: '10px', color: C.textMute }}>
            Click any interior pixel to move center
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}
