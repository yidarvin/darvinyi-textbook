import { useState, useEffect, useRef, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Constants ───────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  red:       '#f87171',
  green:     '#34d399',
  math:      '#fbbf24',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  textMid:   '#888888',
  text:      '#e8eaed',
  codeBg:    '#0a0a0a',
};
const mono  = "'JetBrains Mono', monospace";
const inter = "'Inter', sans-serif";
const D_MODEL = 64;

// ── Math helpers ────────────────────────────────────────────────────────────────
const computeTheta = (i, base = 10000) => Math.pow(base, -2 * i / D_MODEL);

function lerpColor(hexA, hexB, t) {
  const ra = parseInt(hexA.slice(1, 3), 16), ga = parseInt(hexA.slice(3, 5), 16), ba = parseInt(hexA.slice(5, 7), 16);
  const rb = parseInt(hexB.slice(1, 3), 16), gb = parseInt(hexB.slice(3, 5), 16), bb = parseInt(hexB.slice(5, 7), 16);
  return `rgb(${Math.round(ra + t * (rb - ra))},${Math.round(ga + t * (gb - ga))},${Math.round(ba + t * (bb - ba))})`;
}

function scoreColor(v) {
  const c = Math.max(-1, Math.min(1, v));
  if (c >= 0) return lerpColor('#1e1e1e', '#2dd4bf', c);
  return lerpColor('#f87171', '#1e1e1e', c + 1);
}

// ── SVG math helpers ────────────────────────────────────────────────────────────
// Arrow tip + arrowhead polygon (dir = math angle, CCW from +x; SVG y is flipped)
function arrowData(cx, cy, dir, R) {
  const tx = cx + R * Math.cos(dir);
  const ty = cy - R * Math.sin(dir);
  const size = 8, hw = 4;
  const bx = tx - size * Math.cos(dir);
  const by = ty + size * Math.sin(dir);
  const w1x = bx + hw * Math.sin(dir), w1y = by + hw * Math.cos(dir);
  const w2x = bx - hw * Math.sin(dir), w2y = by - hw * Math.cos(dir);
  return {
    tx, ty,
    head: `${tx.toFixed(1)},${ty.toFixed(1)} ${w1x.toFixed(1)},${w1y.toFixed(1)} ${w2x.toFixed(1)},${w2y.toFixed(1)}`,
  };
}

// CCW arc from 0° to angle (positive math direction; sweep=0 = CCW on screen with y-down)
function arcPath(cx, cy, r, angle) {
  let a = angle % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  if (a < 0.02 || a > 2 * Math.PI - 0.02) return '';
  const ex = (cx + r * Math.cos(a)).toFixed(1);
  const ey = (cy - r * Math.sin(a)).toFixed(1);
  return `M ${cx + r} ${cy} A ${r} ${r} 0 ${a > Math.PI ? 1 : 0} 0 ${ex} ${ey}`;
}

// ── Canvas: heatmap ─────────────────────────────────────────────────────────────
// m=0 at bottom row (y = tp + 15*cell), m=15 at top row (y = tp)
function drawHeatmap(canvas, data, m, n) {
  if (!canvas) return;
  const { width: cw, height: ch } = canvas.getBoundingClientRect();
  if (!cw || !ch) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const lp = 32, bp = 26, tp = 5, rp = 4;
  const cell = Math.min((cw - lp - rp) / 16, (ch - tp - bp) / 16);

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, cw, ch);

  // Cells
  for (let mi = 0; mi < 16; mi++) {
    for (let ni = 0; ni < 16; ni++) {
      ctx.fillStyle = scoreColor(data[mi * 16 + ni]);
      ctx.fillRect(lp + ni * cell + 0.5, tp + (15 - mi) * cell + 0.5, cell - 1, cell - 1);
    }
  }

  // Diagonal m=n (bottom-left to top-right)
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(lp, tp + 16 * cell);
  ctx.lineTo(lp + 16 * cell, tp);
  ctx.stroke();

  // Cursor lines
  ctx.strokeStyle = C.math;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  const vx = lp + n * cell + cell / 2;
  ctx.beginPath(); ctx.moveTo(vx, tp); ctx.lineTo(vx, tp + 16 * cell); ctx.stroke();
  const hy = tp + (15 - m) * cell + cell / 2;
  ctx.beginPath(); ctx.moveTo(lp, hy); ctx.lineTo(lp + 16 * cell, hy); ctx.stroke();
  ctx.setLineDash([]);

  // Axis labels
  ctx.font = `7px ${mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  [0, 4, 8, 12, 15].forEach(ni => {
    ctx.fillStyle = ni === n ? C.math : C.muted;
    ctx.fillText(ni, lp + ni * cell + cell / 2, tp + 16 * cell + 3);
  });
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [0, 4, 8, 12, 15].forEach(mi => {
    ctx.fillStyle = mi === m ? C.math : C.muted;
    ctx.fillText(mi, lp - 4, tp + (15 - mi) * cell + cell / 2);
  });

  // Axis titles
  ctx.fillStyle = C.muted;
  ctx.font = `6.5px ${mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Key pos n →', lp + 8 * cell, ch - 1);

  ctx.save();
  ctx.translate(8, tp + 8 * cell);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Query pos m ↑', 0, 0);
  ctx.restore();

  // Diagonal label (m=n)
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.font = `6px ${mono}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('m=n (offset 0)', lp + 9 * cell + 3, tp + 5 * cell);
}

// ── Sub-components ──────────────────────────────────────────────────────────────
function Btn({ children, onClick, active, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: mono, fontSize: '10px', padding: '4px 10px',
      background: active ? C.accentDim : C.bg4,
      border: `1px solid ${active ? C.accent : C.borderLt}`,
      color: disabled ? C.muted : active ? C.accent : C.textMid,
      borderRadius: '4px', cursor: disabled ? 'default' : 'pointer',
      flexShrink: 0, lineHeight: 1,
    }}>
      {children}
    </button>
  );
}

// ── Left panel: rotation circle SVG ────────────────────────────────────────────
const CX = 130, CY = 145, CIRC_R = 100;
const ORIG_DIR = Math.PI / 6; // 30°

function RotationCircle({ m, dimI, theta, rotAngle }) {
  const arcNorm = ((rotAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const rotDir  = ORIG_DIR + rotAngle;

  const orig = arrowData(CX, CY, ORIG_DIR, CIRC_R);
  const rot  = arrowData(CX, CY, rotDir, CIRC_R);

  const midAng = arcNorm / 2;
  const arcLR  = 43;
  const arcLX  = CX + arcLR * Math.cos(midAng);
  const arcLY  = CY - arcLR * Math.sin(midAng);

  // Clamp label within viewBox (10-250, 10-276)
  const rLX = Math.max(10, Math.min(250, CX + (CIRC_R + 14) * Math.cos(rotDir)));
  const rLY = Math.max(10, Math.min(276, CY - (CIRC_R + 14) * Math.sin(rotDir)));

  const arcD   = arcPath(CX, CY, 30, arcNorm);
  const rotDeg = rotAngle * 180 / Math.PI;

  return (
    <svg viewBox="0 0 260 292" width="100%" style={{ display: 'block' }}>
      <rect width="260" height="292" fill={C.codeBg} />

      {/* Axes */}
      <line x1="24" y1={CY} x2="236" y2={CY} stroke={C.border} strokeWidth="1" />
      <line x1={CX} y1="36" x2={CX} y2="254" stroke={C.border} strokeWidth="1" />

      {/* Unit circle */}
      <circle cx={CX} cy={CY} r={CIRC_R} fill="none" stroke={C.borderLt} strokeWidth="1" />

      {/* Angle arc */}
      {arcD && (
        <>
          <path d={arcD} fill="none" stroke={C.math} strokeWidth="1" />
          <text x={arcLX.toFixed(1)} y={arcLY.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily={mono} fontSize="9" fill={C.math}>
            {`${(arcNorm * 180 / Math.PI).toFixed(1)}°`}
          </text>
        </>
      )}

      {/* Original vector (dashed, no arrowhead) */}
      <line x1={CX} y1={CY} x2={orig.tx.toFixed(1)} y2={orig.ty.toFixed(1)}
        stroke={C.borderLt} strokeWidth="1.5" strokeDasharray="4 3" />
      <text
        x={(CX + (CIRC_R + 11) * Math.cos(ORIG_DIR)).toFixed(1)}
        y={(CY - (CIRC_R + 11) * Math.sin(ORIG_DIR)).toFixed(1)}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily={mono} fontSize="9" fill={C.muted}>q</text>

      {/* Rotated vector (solid, teal, with arrowhead) */}
      <line x1={CX} y1={CY} x2={rot.tx.toFixed(1)} y2={rot.ty.toFixed(1)}
        stroke={C.accent} strokeWidth="2.5" />
      <polygon points={rot.head} fill={C.accent} />
      <text x={rLX.toFixed(1)} y={rLY.toFixed(1)}
        textAnchor={rot.tx >= CX ? 'start' : 'end'} dominantBaseline="middle"
        fontFamily={mono} fontSize="9" fill={C.accent}>R_m(q)</text>

      {/* Angle info labels */}
      <text x="130" y="264" textAnchor="middle" fontFamily={mono} fontSize="9" fill={C.math}>
        {`m = ${m}, dim i = ${dimI}`}
      </text>
      <text x="130" y="276" textAnchor="middle" fontFamily={mono} fontSize="9" fill={C.math}>
        {`theta_i = ${theta.toFixed(4)}`}
      </text>
      <text x="130" y="288" textAnchor="middle" fontFamily={mono} fontSize="9" fill={C.math}>
        {`rot = ${rotAngle.toFixed(2)} rad = ${rotDeg.toFixed(1)}°`}
      </text>
    </svg>
  );
}

// ── Frequency spectrum SVG ──────────────────────────────────────────────────────
function FreqSpectrum({ thetas, dimI }) {
  const W = 260, H = 88;
  const lp = 12, rp = 10, tp = 14, bp = 16;
  const cW = W - lp - rp, cH = H - tp - bp;
  const logMin = -4, logMax = 0;

  const pts = thetas.map((t, i) => {
    const x = lp + (i / 31) * cW;
    const logT = Math.log10(Math.max(t, 1e-5));
    const y = tp + (1 - (logT - logMin) / (logMax - logMin)) * cH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const mx = (lp + (dimI / 31) * cW).toFixed(1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', marginTop: '2px' }}>
      <rect width={W} height={H} fill={C.codeBg} />

      <text x={W / 2} y={10} textAnchor="middle" fontFamily={inter} fontSize="9" fill={C.muted}>
        Rotation freq by dimension pair
      </text>

      <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" />

      <line x1={mx} y1={tp} x2={mx} y2={tp + cH}
        stroke={C.math} strokeWidth="1" strokeDasharray="3 3" />

      <text x={lp} y={H - 2} fontFamily={inter} fontSize="7.5" fill={C.muted} textAnchor="start">
        Low i = fast (local)
      </text>
      <text x={W - rp} y={H - 2} fontFamily={inter} fontSize="7.5" fill={C.muted} textAnchor="end">
        High i = slow (far)
      </text>
    </svg>
  );
}

// ── Stats panel row ─────────────────────────────────────────────────────────────
function SR({ label, val, vc }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', gap: '4px' }}>
      <span style={{ fontFamily: mono, fontSize: '9px', color: C.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: '9px', color: vc || C.accent, textAlign: 'right' }}>{val}</span>
    </div>
  );
}

function SH({ children }) {
  return (
    <div style={{ fontFamily: mono, fontSize: '7.5px', color: C.textMid, textTransform: 'uppercase',
                  letterSpacing: '0.07em', marginBottom: '5px' }}>
      {children}
    </div>
  );
}

function SDivider() {
  return <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />;
}

// ── Main widget ─────────────────────────────────────────────────────────────────
export default function RoPE() {
  const [m,         setM]         = useState(8);
  const [n,         setN]         = useState(5);
  const [dimI,      setDimI]      = useState(0);
  const [base,      setBase]      = useState(10000);
  const [animating, setAnimating] = useState(false);

  const heatmapRef   = useRef(null);
  const animTimerRef = useRef(null);

  const thetas   = useMemo(() => Array.from({ length: 32 }, (_, i) => computeTheta(i, base)), [base]);
  const theta    = thetas[dimI];
  const rotAngle = m * theta;
  const offset   = m - n;
  const score    = Math.cos(offset * theta);

  const heatData = useMemo(() => {
    const d = new Float64Array(256);
    for (let mi = 0; mi < 16; mi++)
      for (let ni = 0; ni < 16; ni++)
        d[mi * 16 + ni] = Math.cos((mi - ni) * theta);
    return d;
  }, [theta]);

  // Redraw heatmap
  useEffect(() => {
    const id = requestAnimationFrame(() => drawHeatmap(heatmapRef.current, heatData, m, n));
    return () => cancelAnimationFrame(id);
  }, [heatData, m, n]);

  // Animation: increment m 0→15 at 400ms per step
  useEffect(() => {
    if (!animating) return;
    if (m >= 15) { setAnimating(false); return; }
    animTimerRef.current = setTimeout(() => setM(p => p + 1), 400);
    return () => clearTimeout(animTimerRef.current);
  }, [animating, m]);

  useEffect(() => () => clearTimeout(animTimerRef.current), []);

  function toggleAnimate() {
    if (animating) {
      setAnimating(false);
    } else {
      setM(0);
      setAnimating(true);
    }
  }

  const baseLabels = { 10000: '10k (std)', 500000: '500k (Llama3)', 1000000: '1M (ultra)' };

  return (
    <WidgetCard title="RoPE — rotating query and key vectors to encode relative position" number="9.4">
      <style>{`
        .rope-range { -webkit-appearance: none; height: 2px; background: #2e2e2e;
          border-radius: 2px; cursor: pointer; outline: none; }
        .rope-range::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px;
          border-radius: 50%; background: #2dd4bf; box-shadow: 0 0 6px rgba(45,212,191,0.15); }
      `}</style>

      {/* ── Main visualization ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* LEFT: circle + freq spectrum */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <RotationCircle m={m} dimI={dimI} theta={theta} rotAngle={rotAngle} />
          <FreqSpectrum thetas={thetas} dimI={dimI} />
        </div>

        {/* CENTER: heatmap + score display */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: inter, fontSize: '10px', color: C.text, marginBottom: '4px', lineHeight: 1.35 }}>
            cos((m−n) × theta_i)
            <span style={{ color: C.muted }}> — depends only on offset (m−n)</span>
          </div>

          <canvas ref={heatmapRef}
            style={{ display: 'block', width: '100%', aspectRatio: '1' }} />

          {/* Score display */}
          <div style={{ marginTop: '8px', fontFamily: mono, fontSize: '10px', lineHeight: 1.75, color: C.math }}>
            <div>Query at m={m}, Key at n={n}</div>
            <div>Offset: m − n = {offset}</div>
            <div>
              cos({offset} × {theta.toFixed(4)}) ={' '}
              <span style={{ color: C.accent }}>{score.toFixed(4)}</span>
            </div>
          </div>

          {/* Relativity proof */}
          <div style={{ marginTop: '5px', fontFamily: mono, fontSize: '9px', color: C.green, lineHeight: 1.65 }}>
            <div>
              cos(({m + 3}−{n + 3}) × theta_{dimI}) = {score.toFixed(4)} ✓
            </div>
            <div style={{ fontFamily: inter, fontSize: '8.5px', color: C.muted, fontStyle: 'italic', marginTop: '1px' }}>
              Absolute positions don&apos;t matter — only the offset.
            </div>
          </div>
        </div>

        {/* RIGHT: stats panel */}
        <div style={{
          width: 178, flexShrink: 0,
          background: C.bg3, border: `1px solid ${C.border}`,
          borderRadius: '6px', padding: '11px 11px',
        }}>
          <SH>RoPE Config</SH>
          <SR label="Base"       val={base.toLocaleString()} />
          <SR label="d_model"    val="64" vc={C.textMid} />
          <SR label="Dim pairs"  val="32" vc={C.textMid} />

          <SDivider />
          <SH>Selected</SH>
          <SR label="Query m"  val={m}      vc={C.math} />
          <SR label="Key n"    val={n}      vc={C.math} />
          <SR label="Offset"   val={offset} vc={C.math} />
          <SR label="Dim pair" val={dimI}   vc={C.math} />

          <SDivider />
          <SR label="theta_i" val={theta.toFixed(6)} />
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted, marginBottom: '2px' }}>
            Rotation angle:
          </div>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.accent, paddingLeft: '6px', marginBottom: '2px' }}>
            {`m×theta = ${rotAngle.toFixed(3)} rad`}
          </div>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.accent, paddingLeft: '6px', marginBottom: '2px' }}>
            {`= ${(rotAngle * 180 / Math.PI).toFixed(1)}°`}
          </div>

          <SDivider />
          <SH>RoPE Score</SH>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted, marginBottom: '3px' }}>
            cos((m−n)×theta):
          </div>
          <div style={{ fontFamily: mono, fontSize: '15px', color: C.accent, fontWeight: 600, marginBottom: '5px', lineHeight: 1 }}>
            {score.toFixed(4)}
          </div>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.muted, marginBottom: '2px' }}>
            At (m+3, n+3):
          </div>
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.green }}>
            {score.toFixed(4)} ✓
          </div>

          <SDivider />
          <div style={{ fontFamily: inter, fontSize: '9px', color: C.muted, fontStyle: 'italic', lineHeight: 1.5 }}>
            RoPE encodes relative position. Adding a constant to both m and n leaves the score unchanged.
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

        {/* Query position m */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: mono, fontSize: '10px', color: C.muted, width: '118px', flexShrink: 0 }}>
            Query position m
          </span>
          <input type="range" className="rope-range" min={0} max={15} value={m}
            onChange={e => { setAnimating(false); setM(+e.target.value); }}
            style={{ flex: 1, minWidth: '80px' }} />
          <span style={{ fontFamily: mono, fontSize: '10px', color: C.math, width: '18px', textAlign: 'right' }}>
            {m}
          </span>
        </div>

        {/* Key position n */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: mono, fontSize: '10px', color: C.muted, width: '118px', flexShrink: 0 }}>
            Key position n
          </span>
          <input type="range" className="rope-range" min={0} max={15} value={n}
            onChange={e => setN(+e.target.value)}
            style={{ flex: 1, minWidth: '80px' }} />
          <span style={{ fontFamily: mono, fontSize: '10px', color: C.math, width: '18px', textAlign: 'right' }}>
            {n}
          </span>
        </div>

        {/* Dimension pair i */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: mono, fontSize: '10px', color: C.muted, width: '118px', flexShrink: 0 }}>
            {`Dim pair i = ${dimI}`}
          </span>
          <input type="range" className="rope-range" min={0} max={31} value={dimI}
            onChange={e => setDimI(+e.target.value)}
            style={{ flex: 1, minWidth: '80px' }} />
          <span style={{ fontFamily: mono, fontSize: '9px', color: C.math, width: '78px', textAlign: 'right' }}>
            {`θ=${theta.toFixed(4)}`}
          </span>
        </div>

        {/* Base selector + animate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: mono, fontSize: '10px', color: C.muted, flexShrink: 0 }}>Base</span>
          {[10000, 500000, 1000000].map(b => (
            <Btn key={b} active={base === b} onClick={() => setBase(b)}>
              {baseLabels[b]}
            </Btn>
          ))}
          <div style={{ flex: 1 }} />
          <Btn active={animating} onClick={toggleAnimate}>
            {animating ? 'Pause' : 'Animate rotation'}
          </Btn>
        </div>
      </div>
    </WidgetCard>
  );
}
