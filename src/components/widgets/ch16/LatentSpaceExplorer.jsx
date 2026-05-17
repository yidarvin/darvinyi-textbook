import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";
const inter = "'Inter', sans-serif";

const C = {
  accent:    '#2dd4bf',
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
  accentDim: '#0b2422',
};

const SPACING = 52;
const PAD = 26;
const GW = 380;
const GH = 380;

const GRID_CELLS = [];
for (let i = 0; i < 7; i++)
  for (let j = 0; j < 7; j++)
    GRID_CELLS.push({ i, j });

function gx(i) { return PAD + i * SPACING; }
function gy(j) { return PAD + j * SPACING; }
function latZ1(i) { return (i - 3) / 3.0; }
function latZ2(j) { return (j - 3) / 3.0; }
function lerp(a, b, t) { return a + (b - a) * t; }

function shapeColor(z1, z2) {
  const h = Math.round(180 + z1 * 60 + z2 * 30);
  const s = Math.round(60 + Math.abs(z2) * 20);
  const l = Math.round(35 + Math.abs(z1) * 15);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function triPoints(cx, cy, r, angleDeg) {
  return [0, 1, 2].map(k => {
    const a = (90 + k * 120 + angleDeg) * Math.PI / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy - r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function getShapeProps(z1, z2) {
  const shapeType = z1 < -0.33 ? 'circle' : z1 < 0.33 ? 'square' : 'triangle';
  const size = 30 + 35 * (Math.abs(z1) + Math.abs(z2)) / 2;
  const angle = z2 * 90;
  const color = shapeColor(z1, z2);
  const fillStyle = z1 + z2 > 0.6 ? 'solid' : z1 + z2 < -0.6 ? 'outline' : 'semi';
  return { shapeType, size, angle, color, fillStyle };
}

function ShapeEl({ z1, z2, cx = 80, cy = 80, r: rOverride }) {
  const { shapeType, size, angle, color, fillStyle } = getShapeProps(z1, z2);
  const r = rOverride ?? size;
  let fill = color, stroke = 'none', sw = 0, opacity = 1;
  if (fillStyle === 'outline') { fill = 'none'; stroke = color; sw = rOverride ? 1.5 : 2; }
  else if (fillStyle === 'semi') { opacity = 0.5; }
  const tf = `rotate(${angle}, ${cx}, ${cy})`;

  if (shapeType === 'circle') {
    return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={opacity} stroke={stroke} strokeWidth={sw} transform={tf} />;
  } else if (shapeType === 'square') {
    return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={fill} fillOpacity={opacity} stroke={stroke} strokeWidth={sw} transform={tf} />;
  } else {
    return <polygon points={triPoints(cx, cy, r, angle)} fill={fill} fillOpacity={opacity} stroke={stroke} strokeWidth={sw} />;
  }
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontFamily: mono, fontSize: 9.5, color: C.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 10.5, color: color || C.accent, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function Toggle({ label, on, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!on)}
        style={{
          width: 26, height: 13, borderRadius: 7, flexShrink: 0,
          background: on ? C.accent : C.bg4,
          border: `1px solid ${on ? C.accent : C.border}`,
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 1.5, left: on ? 13 : 1.5,
          width: 8, height: 8, borderRadius: '50%',
          background: on ? '#0a0a0a' : C.textMuted,
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: mono, fontSize: 11, color: C.textMid, whiteSpace: 'nowrap' }}>{label}</span>
    </label>
  );
}

const PATH_TS = [0, 0.25, 0.5, 0.75, 1.0];

export default function LatentSpaceExplorer() {
  const [hovered, setHovered]           = useState(null);
  const [mode, setMode]                 = useState('hover');
  const [pointA, setPointA]             = useState(null);
  const [pointB, setPointB]             = useState(null);
  const [interpT, setInterpT]           = useState(0.5);
  const [showPathShapes, setShowPathShapes] = useState(true);
  const [showCoords, setShowCoords]     = useState(false);

  // Display z1/z2 — interpolated when both points set, else hovered
  let dz1 = null, dz2 = null;
  if (mode === 'interpolate' && pointA && pointB) {
    dz1 = lerp(latZ1(pointA.i), latZ1(pointB.i), interpT);
    dz2 = lerp(latZ2(pointA.j), latZ2(pointB.j), interpT);
  } else if (mode === 'interpolate' && pointA) {
    dz1 = latZ1(pointA.i); dz2 = latZ2(pointA.j);
  } else if (hovered) {
    dz1 = latZ1(hovered.i); dz2 = latZ2(hovered.j);
  }

  const shapeProps = dz1 !== null ? getShapeProps(dz1, dz2) : null;

  const distance = pointA && pointB
    ? Math.sqrt((latZ1(pointB.i) - latZ1(pointA.i)) ** 2 + (latZ2(pointB.j) - latZ2(pointA.j)) ** 2)
    : null;

  function handleClick(i, j) {
    if (mode !== 'interpolate') return;
    if (!pointA) {
      setPointA({ i, j });
    } else if (!pointB) {
      if (i === pointA.i && j === pointA.j) { setPointA(null); }
      else { setPointB({ i, j }); }
    } else {
      if ((i === pointA.i && j === pointA.j) || (i === pointB.i && j === pointB.j)) {
        setPointA(null); setPointB(null);
      } else {
        setPointA({ i, j }); setPointB(null);
      }
    }
  }

  function toggleMode() {
    if (mode === 'hover') {
      setMode('interpolate');
    } else {
      setMode('hover');
      setPointA(null);
      setPointB(null);
    }
  }

  return (
    <WidgetCard title="Latent Space Explorer — hover to decode, drag to interpolate" number="11.2">
      <div style={{ display: 'flex', gap: 0 }}>

        {/* ── Grid SVG ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg
            viewBox={`0 0 ${GW} ${GH}`}
            width="100%"
            style={{ display: 'block' }}
            onMouseLeave={() => setHovered(null)}
          >
            <rect width={GW} height={GH} fill={C.codeBg} />

            {/* Grid lines */}
            {Array.from({ length: 7 }, (_, j) => (
              <line key={`h${j}`} x1={gx(0)} y1={gy(j)} x2={gx(6)} y2={gy(j)}
                stroke={C.border} strokeWidth={0.5} />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`v${i}`} x1={gx(i)} y1={gy(0)} x2={gx(i)} y2={gy(6)}
                stroke={C.border} strokeWidth={0.5} />
            ))}

            {/* Crosshair on hovered point */}
            {hovered && (
              <>
                <line x1={0} y1={gy(hovered.j)} x2={GW} y2={gy(hovered.j)}
                  stroke={C.accent} strokeWidth={1} strokeOpacity={0.2} />
                <line x1={gx(hovered.i)} y1={0} x2={gx(hovered.i)} y2={GH}
                  stroke={C.accent} strokeWidth={1} strokeOpacity={0.2} />
              </>
            )}

            {/* Interpolation dashed line */}
            {mode === 'interpolate' && pointA && pointB && (
              <line
                x1={gx(pointA.i)} y1={gy(pointA.j)}
                x2={gx(pointB.i)} y2={gy(pointB.j)}
                stroke={C.textMid} strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.7}
              />
            )}

            {/* Path shape thumbnails */}
            {mode === 'interpolate' && showPathShapes && pointA && pointB && PATH_TS.map(t => {
              const tx  = lerp(gx(pointA.i),    gx(pointB.i),    t);
              const ty  = lerp(gy(pointA.j),    gy(pointB.j),    t);
              const tz1 = lerp(latZ1(pointA.i), latZ1(pointB.i), t);
              const tz2 = lerp(latZ2(pointA.j), latZ2(pointB.j), t);
              return (
                <g key={t} style={{ pointerEvents: 'none' }}>
                  <circle cx={tx} cy={ty} r={14} fill={C.codeBg} fillOpacity={0.9} />
                  <circle cx={tx} cy={ty} r={14} fill="none" stroke={C.border} strokeWidth={0.5} />
                  <ShapeEl z1={tz1} z2={tz2} cx={tx} cy={ty} r={10} />
                </g>
              );
            })}

            {/* Interpolated position diamond */}
            {mode === 'interpolate' && pointA && pointB && (() => {
              const ipx = lerp(gx(pointA.i), gx(pointB.i), interpT);
              const ipy = lerp(gy(pointA.j), gy(pointB.j), interpT);
              const d = 7;
              return (
                <polygon
                  points={`${ipx},${ipy - d} ${ipx + d},${ipy} ${ipx},${ipy + d} ${ipx - d},${ipy}`}
                  fill="white" stroke="rgba(0,0,0,0.5)" strokeWidth={0.5}
                  style={{ pointerEvents: 'none' }}
                />
              );
            })()}

            {/* Grid points */}
            {GRID_CELLS.map(({ i, j }) => {
              const z1v  = latZ1(i), z2v = latZ2(j);
              const dist = Math.abs(z1v) + Math.abs(z2v);
              const isHov = hovered?.i === i && hovered?.j === j;
              const isA   = pointA?.i === i && pointA?.j === j;
              const isB   = pointB?.i === i && pointB?.j === j;

              let dotFill = dist < 0.5 ? '#1e1e1e' : dist > 1.5 ? '#0f0f0f' : '#161616';
              let r = 5, strokeC = C.borderLt, strokeW = 1;
              if (isA)       { dotFill = C.orange; strokeC = 'white'; strokeW = 1.5; r = 7; }
              else if (isB)  { dotFill = C.purple; strokeC = 'white'; strokeW = 1.5; r = 7; }
              else if (isHov){ dotFill = C.accent; strokeC = 'white'; strokeW = 1.5; r = 7; }

              return (
                <g key={`p${i}-${j}`}>
                  <circle cx={gx(i)} cy={gy(j)} r={r}
                    fill={dotFill} stroke={strokeC} strokeWidth={strokeW} />
                  {showCoords && (
                    <text x={gx(i)} y={gy(j) - 9} textAnchor="middle"
                      fontSize={6.5} fill={C.textMuted} fontFamily={mono}
                      style={{ pointerEvents: 'none' }}>
                      {z1v.toFixed(1)},{z2v.toFixed(1)}
                    </text>
                  )}
                  {/* Large transparent hit area */}
                  <circle cx={gx(i)} cy={gy(j)} r={20} fill="transparent"
                    onMouseEnter={() => setHovered({ i, j })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleClick(i, j)}
                    style={{ cursor: mode === 'interpolate' ? 'pointer' : 'crosshair' }}
                  />
                </g>
              );
            })}

            {/* Axis labels */}
            <text x={GW / 2} y={GH - 5} textAnchor="middle"
              fontSize={10} fill={C.textMuted} fontFamily={inter}>
              z1 →
            </text>
            <text x={10} y={GH / 2} textAnchor="middle"
              fontSize={10} fill={C.textMuted} fontFamily={inter}
              transform={`rotate(-90, 10, ${GH / 2})`}>
              z2 →
            </text>
            <text x={gx(0)} y={gy(6) + 16} textAnchor="middle"
              fontSize={8} fill={C.textMuted} fontFamily={mono}>-1</text>
            <text x={gx(6)} y={gy(0) - 8} textAnchor="middle"
              fontSize={8} fill={C.textMuted} fontFamily={mono}>+1</text>
          </svg>
        </div>

        {/* ── Reconstruction Panel ── */}
        <div style={{
          width: 220, flexShrink: 0,
          background: C.bg3, borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          padding: '14px 12px', gap: 10,
          overflowY: 'auto',
        }}>
          {dz1 !== null ? (
            <>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.accent, textAlign: 'center', letterSpacing: '0.02em' }}>
                z1 = {dz1.toFixed(2)}  z2 = {dz2.toFixed(2)}
              </div>
              <div style={{ fontFamily: inter, fontSize: 11, color: C.textMid, textAlign: 'center' }}>
                {shapeProps.shapeType}
              </div>

              {/* Shape canvas */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg viewBox="0 0 160 160" width={160} height={160}
                  style={{ display: 'block', background: C.codeBg, borderRadius: 4 }}>
                  <ShapeEl z1={dz1} z2={dz2} cx={80} cy={80} />
                </svg>
              </div>

              {/* Point stats */}
              <div style={{
                background: C.bg2, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '8px 10px',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <StatRow label="z1"       value={dz1.toFixed(2)} />
                <StatRow label="z2"       value={dz2.toFixed(2)} />
                <StatRow label="Shape"    value={shapeProps.shapeType}                         color={C.text} />
                <StatRow label="Size"     value={`${Math.round(shapeProps.size)}px`}           color={C.text} />
                <StatRow label="Rotation" value={`${Math.round(shapeProps.angle)}°`}           color={C.text} />
                <StatRow label="Fill"     value={shapeProps.fillStyle}                         color={C.text} />
              </div>

              {/* Interpolation stats */}
              {mode === 'interpolate' && pointA && pointB && (
                <div style={{
                  background: C.bg2, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: '8px 10px',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{
                    fontFamily: mono, fontSize: 8, color: C.accent,
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2,
                  }}>Interpolation</div>
                  <StatRow label="A"
                    value={`(${latZ1(pointA.i).toFixed(2)}, ${latZ2(pointA.j).toFixed(2)})`}
                    color={C.orange} />
                  <StatRow label="B"
                    value={`(${latZ1(pointB.i).toFixed(2)}, ${latZ2(pointB.j).toFixed(2)})`}
                    color={C.purple} />
                  <StatRow label="Dist"    value={distance.toFixed(2)} />
                  <StatRow label="t"       value={interpT.toFixed(2)} />
                  <StatRow label="Now"
                    value={`(${dz1.toFixed(2)}, ${dz2.toFixed(2)})`}
                    color={C.accent} />
                </div>
              )}
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: inter, fontSize: 11, color: C.textMuted,
              fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6,
            }}>
              Hover a point<br />to decode it
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Mode pill + status hint */}
        {mode === 'interpolate' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: mono, fontSize: 9.5, color: C.accent,
              background: C.accentDim, padding: '2px 8px', borderRadius: 3, letterSpacing: '0.05em',
            }}>Interpolate mode</span>
            {pointA && !pointB && (
              <span style={{ fontFamily: mono, fontSize: 10, color: C.orange }}>
                A set — click B
              </span>
            )}
            {!pointA && (
              <span style={{ fontFamily: mono, fontSize: 10, color: C.textMuted }}>
                Click two points
              </span>
            )}
          </div>
        )}

        {/* Buttons + slider row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggleMode} style={{
            background: mode === 'interpolate' ? C.accentDim : 'transparent',
            border: `1px solid ${mode === 'interpolate' ? C.accent : C.border}`,
            color: mode === 'interpolate' ? C.accent : C.textMid,
            fontFamily: mono, fontSize: 11,
            padding: '5px 12px', borderRadius: 5, cursor: 'pointer', flexShrink: 0,
          }}>Interpolate</button>

          {mode === 'interpolate' && (
            <button onClick={() => { setPointA(null); setPointB(null); }} style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.textMid, fontFamily: mono, fontSize: 11,
              padding: '5px 12px', borderRadius: 5, cursor: 'pointer', flexShrink: 0,
            }}>Clear</button>
          )}

          {mode === 'interpolate' && pointA && pointB && (
            <>
              <div style={{ width: 1, background: C.border, alignSelf: 'stretch', flexShrink: 0 }} />
              <span style={{
                fontFamily: mono, fontSize: 11, color: C.textMid,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>A← t={interpT.toFixed(2)} →B</span>
              <input
                type="range" min={0} max={1} step={0.01} value={interpT}
                onChange={e => setInterpT(Number(e.target.value))}
                style={{ flex: 1, minWidth: 80, accentColor: C.accent, cursor: 'pointer' }}
              />
            </>
          )}
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {mode === 'interpolate' && (
            <Toggle label="Show path shapes" on={showPathShapes} onChange={setShowPathShapes} />
          )}
          <Toggle label="Show coordinates" on={showCoords} onChange={setShowCoords} />
        </div>
      </div>
    </WidgetCard>
  );
}
