import { useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Constants ──────────────────────────────────────────────────────────────────
const SHRINK   = 0.65;
const SIG_R    = 8;
const SPEED_MS = { slow: 600, normal: 400, fast: 180 };

const C = {
  accent:   '#2dd4bf',
  green:    '#34d399',
  red:      '#f87171',
  orange:   '#fb923c',
  border:   '#242424',
  borderLt: '#2e2e2e',
  bg3:      '#161616',
  muted:    '#555555',
  mid:      '#888888',
  accentDim:'#0b2422',
};

const MONO  = "'JetBrains Mono', monospace";
const INTER = "'Inter', sans-serif";

// ── SVG layout ─────────────────────────────────────────────────────────────────
const SVG_W    = 440;
const DIV_X    = 220;
const LEFT_CX  = 110;
const RIGHT_CX = 330;
const BLOCK_W  = 120;
const BLOCK_H  = 44;
const BLOCK_GAP= 14;
const LEFT_BX  = LEFT_CX - BLOCK_W / 2;   // 50
const RIGHT_BX = RIGHT_CX - BLOCK_W / 2;  // 270
const SKIP_DX  = 25;
const NODE_R   = 5;
const HEADER_Y = 16;
const OUT_Y    = 33;
const BLK_START= OUT_Y + NODE_R + 10;      // 48

// Bezier t=0.5 midpoint x for the skip arc (see derivation in spec)
const SKIP_MX  = RIGHT_BX - 0.75 * SKIP_DX;  // ≈ 251

const blockTop = i => BLK_START + i * (BLOCK_H + BLOCK_GAP);
const blockBot = i => blockTop(i) + BLOCK_H;
const blockMid = i => blockTop(i) + BLOCK_H / 2;
const inNodeY  = N => blockBot(N - 1) + 10 + NODE_R;
const annotY   = N => inNodeY(N) + NODE_R + 14;
const summaryY = N => annotY(N) + 26;
const svgH     = N => Math.max(240, summaryY(N) + 30);

// ── Color lerp ─────────────────────────────────────────────────────────────────
function lerpColor(from, to, t) {
  const p = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [r1,g1,b1] = p(from);
  const [r2,g2,b2] = p(to);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SkipConnection({ tryThis }) {
  const [N,            setN]           = useState(4);
  const [animStep,     setAnimStep]    = useState(-1);
  const [isAnimating,  setIsAnimating] = useState(false);
  const [animDone,     setAnimDone]    = useState(false);
  const [speed,        setSpeed]       = useState('normal');
  const [showVals,     setShowVals]    = useState(true);

  // Reset animation when N changes
  useEffect(() => {
    setIsAnimating(false);
    setAnimStep(-1);
    setAnimDone(false);
  }, [N]);

  // Step the animation forward on each tick
  useEffect(() => {
    if (!isAnimating) return;
    const id = setTimeout(() => {
      setAnimStep(s => {
        if (s >= N - 1) {
          setIsAnimating(false);
          setAnimDone(true);
          return s;
        }
        return s + 1;
      });
    }, SPEED_MS[speed]);
    return () => clearTimeout(id);
  }, [isAnimating, animStep, N, speed]);

  const handleAnimate = () => { setAnimDone(false); setAnimStep(0); setIsAnimating(true); };
  const handleReset   = () => { setIsAnimating(false); setAnimStep(-1); setAnimDone(false); };

  // Derived layout
  const h        = svgH(N);
  const iny      = inNodeY(N);
  const ay       = annotY(N);
  const sy       = summaryY(N);
  const finalMag = Math.pow(SHRINK, N);
  const ratio    = (1 / finalMag).toFixed(1);

  // Signal appearance at current step
  const hasSig   = animStep >= 0;
  const stepMag  = hasSig ? Math.pow(SHRINK, animStep) : 1;
  const sigR     = hasSig ? Math.max(2, SIG_R * stepMag) : 0;
  const sigOp    = hasSig ? Math.max(0.08, stepMag) : 0;
  const sigColor = hasSig ? lerpColor(C.red, C.accent, stepMag) : C.accent;
  const sigY     = hasSig ? blockMid(animStep) : 0;

  return (
    <WidgetCard title="Skip Connections — gradient highway through residuals" number="6.4" tryThis={tryThis}>
      <div style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>

        {/* ── Diagram + controls ─────────────────────────────────────────── */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ background:'#0a0a0a', borderRadius:'6px', overflow:'hidden' }}>
            <svg viewBox={`0 0 ${SVG_W} ${h}`} width="100%" style={{ display:'block' }}>
              <defs>
                {/* Arrowhead for skip connection arcs */}
                <marker id="sc-arr" markerWidth="5" markerHeight="5"
                        refX="5" refY="2.5" orient="auto">
                  <path d="M0,0 L5,2.5 L0,5 Z" fill={C.orange} />
                </marker>
              </defs>

              {/* Center divider */}
              <line x1={DIV_X} y1={0} x2={DIV_X} y2={h}
                    stroke={C.border} strokeWidth={1} />

              {/* Column headers */}
              <text x={LEFT_CX} y={HEADER_Y} textAnchor="middle"
                    fontFamily={INTER} fontSize={11} fill={C.muted}>
                Plain Network
              </text>
              <text x={RIGHT_CX} y={HEADER_Y} textAnchor="middle"
                    fontFamily={INTER} fontSize={11} fill={C.mid}>
                Residual Network
              </text>

              {/* Output nodes + top connectors */}
              {[[LEFT_CX, C.border], [RIGHT_CX, C.borderLt]].map(([cx, sc], ci) => (
                <g key={ci}>
                  <circle cx={cx} cy={OUT_Y} r={NODE_R}
                          fill="none" stroke={C.muted} strokeWidth={1.5} />
                  <text x={cx} y={OUT_Y} textAnchor="middle" dominantBaseline="middle"
                        fontFamily={MONO} fontSize={8} fill={C.muted}>y</text>
                  <line x1={cx} y1={OUT_Y + NODE_R} x2={cx} y2={BLK_START}
                        stroke={sc} strokeWidth={1} />
                </g>
              ))}

              {/* Blocks */}
              {Array.from({ length: N }, (_, i) => {
                const top = blockTop(i);
                const bot = blockBot(i);
                const ny  = i < N - 1 ? blockTop(i + 1) : iny - NODE_R;
                return (
                  <g key={i}>
                    {/* Plain block */}
                    <rect x={LEFT_BX} y={top} width={BLOCK_W} height={BLOCK_H}
                          rx={6} fill={C.bg3} stroke={C.border} strokeWidth={1.5} />
                    <text x={LEFT_CX} y={top + BLOCK_H / 2} textAnchor="middle"
                          dominantBaseline="middle" fontFamily={MONO} fontSize={9} fill={C.muted}>
                      Conv + ReLU
                    </text>
                    <line x1={LEFT_CX} y1={bot} x2={LEFT_CX} y2={ny}
                          stroke={C.border} strokeWidth={1} />

                    {/* Residual block */}
                    <rect x={RIGHT_BX} y={top} width={BLOCK_W} height={BLOCK_H}
                          rx={6} fill={C.bg3} stroke={C.borderLt} strokeWidth={1.5} />
                    <text x={RIGHT_CX} y={top + BLOCK_H / 2} textAnchor="middle"
                          dominantBaseline="middle" fontFamily={MONO} fontSize={9} fill={C.muted}>
                      Conv + ReLU
                    </text>
                    <line x1={RIGHT_CX} y1={bot} x2={RIGHT_CX} y2={ny}
                          stroke={C.borderLt} strokeWidth={1} />

                    {/* Skip connection arc: bottom-left → top-left, curving left */}
                    <path
                      d={`M ${RIGHT_BX},${bot} C ${RIGHT_BX-SKIP_DX},${bot} ${RIGHT_BX-SKIP_DX},${top} ${RIGHT_BX},${top}`}
                      fill="none" stroke={C.orange}
                      strokeWidth={1.5} strokeDasharray="4 3"
                      markerEnd="url(#sc-arr)"
                    />
                  </g>
                );
              })}

              {/* Input nodes */}
              {[LEFT_CX, RIGHT_CX].map((cx, ci) => (
                <g key={ci}>
                  <circle cx={cx} cy={iny} r={NODE_R}
                          fill="none" stroke={C.muted} strokeWidth={1.5} />
                  <text x={cx} y={iny} textAnchor="middle" dominantBaseline="middle"
                        fontFamily={MONO} fontSize={8} fill={C.muted}>x</text>
                </g>
              ))}

              {/* ── Animation signals ── */}
              {hasSig && (
                <g>
                  {/* Plain: shrinking signal */}
                  <circle cx={LEFT_CX} cy={sigY} r={sigR}
                          fill={sigColor} opacity={sigOp} />

                  {/* Residual main path: same shrink behavior */}
                  <circle cx={RIGHT_CX} cy={sigY} r={sigR}
                          fill={sigColor} opacity={sigOp} />

                  {/* Residual skip path: full-strength orange signal on the arc */}
                  <circle cx={SKIP_MX} cy={blockMid(animStep)}
                          r={SIG_R} fill={C.orange} opacity={1} />

                  {/* Merge "+" where skip arc arrives at block top-left */}
                  <text x={RIGHT_BX + 4} y={blockTop(animStep) + 2}
                        dominantBaseline="hanging" fontFamily={MONO}
                        fontSize={11} fill={C.accent} fontWeight={700}>
                    +
                  </text>
                </g>
              )}

              {/* ── Gradient magnitude annotations ── */}
              {showVals && hasSig && (
                <g>
                  <text x={LEFT_CX} y={ay} textAnchor="middle"
                        fontFamily={MONO} fontSize={9} fill={C.red}>
                    {`Plain: ‖g‖ = ${stepMag.toFixed(4)}`}
                  </text>
                  <text x={RIGHT_CX} y={ay} textAnchor="middle"
                        fontFamily={MONO} fontSize={9} fill={C.green}>
                    {`Residual: ‖g‖ = 1.0000`}
                  </text>
                </g>
              )}

              {/* ── Post-animation summary ── */}
              {animDone && (
                <g>
                  <text x={LEFT_CX} y={sy} textAnchor="middle"
                        fontFamily={MONO} fontSize={9} fill={C.red}>
                    {`Input gradient: ${finalMag.toFixed(4)}`}
                  </text>
                  <text x={RIGHT_CX} y={sy} textAnchor="middle"
                        fontFamily={MONO} fontSize={9} fill={C.green}>
                    Input gradient: ≈ 1.0
                  </text>
                  <text x={SVG_W / 2} y={sy + 16} textAnchor="middle"
                        fontFamily={MONO} fontSize={9} fill={C.accent}>
                    {`Ratio: ${ratio}× stronger`}
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div style={{
            marginTop: '8px',
            fontFamily: MONO, fontSize: '9.5px', color: C.muted,
            fontStyle: 'italic', lineHeight: 1.5,
          }}>
            Illustrative, not measured: assumes a fixed 0.65×/block gradient
            decay and that the residual branch's own Jacobian ∂F/∂x
            contributes ~0, so the shortcut's +1 identity term dominates —
            per ∂L/∂x = (∂L/∂y)(1 + ∂F/∂x) above.
          </div>

          {/* ── Controls ── */}
          <div style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {/* N slider */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontFamily:MONO, fontSize:'10px', color:C.muted, width:'72px', flexShrink:0 }}>
                N (blocks)
              </span>
              <input
                type="range" min={2} max={10} step={1} value={N}
                onChange={e => setN(Number(e.target.value))}
                style={{ flex:1, accentColor:C.accent }}
              />
              <span style={{ fontFamily:MONO, fontSize:'10px', color:C.accent, width:'84px', textAlign:'right', flexShrink:0 }}>
                {N} blocks deep
              </span>
            </div>

            {/* Buttons row */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
              <button
                onClick={handleAnimate}
                disabled={isAnimating}
                style={{
                  padding:'5px 12px',
                  background: isAnimating ? C.bg3 : C.accent,
                  color: isAnimating ? C.muted : '#0d0d0d',
                  border:'none', borderRadius:'4px',
                  fontFamily:MONO, fontSize:'10px', fontWeight:600,
                  cursor: isAnimating ? 'not-allowed' : 'pointer',
                  flexShrink:0,
                }}
              >
                ▶ Animate Backprop
              </button>

              {/* Speed pills */}
              <div style={{ display:'flex', gap:'2px' }}>
                {['slow','normal','fast'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    style={{
                      padding:'4px 9px',
                      background: speed === s ? C.accentDim : '#1e1e1e',
                      color: speed === s ? C.accent : C.muted,
                      border:`1px solid ${speed === s ? C.accent : C.border}`,
                      borderRadius:'3px',
                      fontFamily:MONO, fontSize:'9.5px',
                      cursor:'pointer', textTransform:'capitalize',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Show gradient values toggle */}
              <label style={{ display:'flex', alignItems:'center', gap:'5px', cursor:'pointer' }}>
                <input
                  type="checkbox"
                  checked={showVals}
                  onChange={e => setShowVals(e.target.checked)}
                  style={{ accentColor:C.accent, width:'12px', height:'12px' }}
                />
                <span style={{ fontFamily:MONO, fontSize:'9.5px', color:C.muted }}>
                  Show gradient values
                </span>
              </label>

              {/* Reset */}
              <button
                onClick={handleReset}
                style={{
                  padding:'4px 10px',
                  background:'#1e1e1e', color:C.muted,
                  border:`1px solid ${C.border}`, borderRadius:'3px',
                  fontFamily:MONO, fontSize:'9.5px', cursor:'pointer',
                }}
              >
                ↺ Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats panel ── */}
        <div style={{
          width:'156px', flexShrink:0,
          background:'#111111',
          border:`1px solid ${C.border}`,
          borderRadius:'8px', padding:'14px 14px',
        }}>
          <div style={{
            fontFamily:MONO, fontSize:'9px',
            letterSpacing:'0.08em', textTransform:'uppercase',
            color:C.muted, marginBottom:'12px',
          }}>
            Stats
          </div>

          <StatRow label="Blocks (N)"      value={String(N)}  color={C.accent} />
          <StatRow label="Shrink / block"  value="0.65"       color={C.mid}    />

          <div style={{ borderTop:`1px solid ${C.border}`, margin:'10px 0' }} />

          <StatRow
            label="Plain ‖g‖ at input"
            value={animDone ? finalMag.toFixed(4) : '—'}
            color={animDone ? C.red : C.muted}
          />
          <StatRow
            label="Residual ‖g‖"
            value={animDone ? '1.0000' : '—'}
            color={animDone ? C.green : C.muted}
          />
          <StatRow
            label="Ratio"
            value={animDone ? `${ratio}×` : '—'}
            color={animDone ? C.accent : C.muted}
          />
        </div>
      </div>
    </WidgetCard>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px', gap:'4px' }}>
      <span style={{ fontFamily:MONO, color:'#555', fontSize:'9.5px', lineHeight:1.4 }}>
        {label}
      </span>
      <span style={{ fontFamily:MONO, color, fontSize:'12px', fontWeight:500, flexShrink:0 }}>
        {value}
      </span>
    </div>
  );
}
