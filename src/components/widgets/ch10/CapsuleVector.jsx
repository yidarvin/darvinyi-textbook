import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  bg2: '#111111', bg3: '#161616', bg4: '#1e1e1e',
  border: '#242424', borderLt: '#2e2e2e',
  text: '#e8eaed', muted: '#555555', mid: '#888888',
  accent: '#2dd4bf', accentDim: '#0b2422',
  math: '#fbbf24', orange: '#fb923c',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ViewBox: 430×380 — extra 50px on right for magnitude bar labels
const VBW = 430, VBH = 380;
const CX = 190, CY = 190, R = 150;

function squash(v) {
  const mag = Math.sqrt(v[0] ** 2 + v[1] ** 2);
  if (mag < 1e-8) return [0, 0];
  const scale = (mag ** 2) / (1 + mag ** 2);
  return [v[0] / mag * scale, v[1] / mag * scale];
}

function toSVG(v) {
  return [CX + v[0] * R, CY - v[1] * R];
}

function Arrowhead({ from, to, color, size = 9 }) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < size) return null;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const bx = to[0] - ux * size, by = to[1] - uy * size;
  const w = size * 0.45;
  return (
    <polygon
      points={`${to[0]},${to[1]} ${bx + px * w},${by + py * w} ${bx - px * w},${by - py * w}`}
      fill={color}
    />
  );
}

function SquashPlot({ rawMag }) {
  const W = 200, H = 96;
  const pad = { l: 28, r: 8, t: 8, b: 22 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const xMax = 5;
  const toX = x => pad.l + (x / xMax) * pw;
  const toY = y => pad.t + ph - y * ph;
  const curMag = Math.min(rawMag, xMax);
  const curSq = (curMag * curMag) / (1 + curMag * curMag);
  const pts = Array.from({ length: 101 }, (_, i) => {
    const x = (i / 100) * xMax;
    const y = (x * x) / (1 + x * x);
    return `${toX(x)},${toY(y)}`;
  }).join(' ');

  return (
    <div style={{
      background: C.bg4, border: `1px solid ${C.border}`,
      borderRadius: '6px', padding: '8px 10px', marginTop: '4px',
    }}>
      <div style={{ ...mono, fontSize: '8px', color: C.muted, marginBottom: '4px' }}>
        squash(‖v‖) vs ‖v‖ — asymptote at 1
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Asymptote */}
        <line x1={pad.l} y1={pad.t} x2={pad.l + pw} y2={pad.t}
          stroke={C.borderLt} strokeWidth={0.5} strokeDasharray="3 2" />
        {/* Axes */}
        <line x1={pad.l} y1={pad.t + ph} x2={pad.l + pw} y2={pad.t + ph}
          stroke={C.border} strokeWidth={0.8} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + ph}
          stroke={C.border} strokeWidth={0.8} />
        {/* Curve */}
        <polyline points={pts} fill="none" stroke={C.accent} strokeWidth={1.5} />
        {/* Current x vertical */}
        <line x1={toX(curMag)} y1={pad.t} x2={toX(curMag)} y2={pad.t + ph}
          stroke={C.orange} strokeWidth={1} strokeDasharray="2 2" />
        {/* Current y horizontal */}
        <line x1={pad.l} y1={toY(curSq)} x2={toX(curMag)} y2={toY(curSq)}
          stroke={C.accent} strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
        <circle cx={toX(curMag)} cy={toY(curSq)} r={3} fill={C.accent} />
        {/* X axis ticks */}
        {[0, 1, 2, 3, 4, 5].map(v => (
          <text key={v} x={toX(v)} y={pad.t + ph + 10} textAnchor="middle"
            fill={C.muted} fontSize={6} fontFamily="'JetBrains Mono', monospace">{v}</text>
        ))}
        {/* Y axis ticks */}
        {[0, 0.5, 1].map(v => (
          <text key={v} x={pad.l - 3} y={toY(v) + 2} textAnchor="end"
            fill={C.muted} fontSize={6} fontFamily="'JetBrains Mono', monospace">{v}</text>
        ))}
        <text x={pad.l + pw / 2} y={H - 2} textAnchor="middle"
          fill={C.muted} fontSize={6} fontFamily="'JetBrains Mono', monospace">‖v‖</text>
      </svg>
    </div>
  );
}

function StatRow({ label, val, color, note }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
      <span style={{ ...mono, fontSize: '8px', color: C.muted }}>{label}</span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
        {note && <span style={{ ...mono, fontSize: '7px', color: C.borderLt }}>{note}</span>}
        <span style={{ ...mono, fontSize: '11px', color }}>{val}</span>
      </div>
    </div>
  );
}

export default function CapsuleVector() {
  const [rawVec, setRawVec] = useState([1.4, 0.9]);
  const [isDragging, setIsDragging] = useState(false);
  const [showPlot, setShowPlot] = useState(false);
  const svgRef = useRef(null);

  const rawMag = Math.sqrt(rawVec[0] ** 2 + rawVec[1] ** 2);
  const angle = rawMag < 1e-8 ? 0 : Math.atan2(rawVec[1], rawVec[0]) * 180 / Math.PI;
  const displayAngle = ((angle % 360) + 360) % 360;
  const sqVec = squash(rawVec);
  const sqMag = Math.sqrt(sqVec[0] ** 2 + sqVec[1] ** 2);
  const compressionRatio = rawMag < 1e-8 ? null : sqMag / rawMag;

  const rawTip = toSVG(rawVec);
  const sqTip = toSVG(sqVec);

  // Arc from positive x-axis to vector direction
  const θRad = displayAngle * Math.PI / 180;
  const arcR = 30;
  const arcEndX = CX + arcR * Math.cos(θRad);
  const arcEndY = CY - arcR * Math.sin(θRad);
  const largeArc = displayAngle > 180 ? 1 : 0;
  const arcMidθ = (displayAngle / 2) * Math.PI / 180;
  const arcLabelX = CX + (arcR + 14) * Math.cos(arcMidθ);
  const arcLabelY = CY - (arcR + 14) * Math.sin(arcMidθ);
  const showArc = rawMag > 0.05 && displayAngle > 0.5 && displayAngle < 359.5;

  // Raw vector label rotation (keep text readable, never upside-down)
  const rawAngleSVG = Math.atan2(-(rawVec[1]), rawVec[0]) * 180 / Math.PI;
  const labelAngle = (rawAngleSVG > 90 || rawAngleSVG < -90) ? rawAngleSVG + 180 : rawAngleSVG;
  const midRaw = [(CX + rawTip[0]) / 2, (CY + rawTip[1]) / 2];

  // squash(v) label — offset beyond tip in vector direction
  const sqDir = sqMag > 1e-8 ? [sqVec[0] / sqMag, sqVec[1] / sqMag] : [1, 0];
  const sqLabelX = CX + sqDir[0] * (sqMag * R + 22);
  const sqLabelY = CY - sqDir[1] * (sqMag * R + 22);
  const sqLabelAnchor = sqDir[0] > 0.2 ? 'start' : sqDir[0] < -0.2 ? 'end' : 'middle';

  // Magnitude bar
  const barX = 394, barY1 = 50, barY2 = 330, barH = barY2 - barY1;
  const rawBarY = barY2 - (Math.min(rawMag, 3) / 3) * barH;
  const sqBarY = barY2 - sqMag * barH;

  function handleMouseDown(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleMouseMove(e) {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vbX = (e.clientX - rect.left) / rect.width * VBW;
    const vbY = (e.clientY - rect.top) / rect.height * VBH;
    const vx = (vbX - CX) / R;
    const vy = -(vbY - CY) / R;
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag < 1e-8) {
      setRawVec([0, 0]);
    } else if (mag > 3) {
      setRawVec([vx / mag * 3, vy / mag * 3]);
    } else {
      setRawVec([vx, vy]);
    }
  }

  // Global mouseup so releasing outside SVG also stops drag
  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  function handleMagSlider(val) {
    const dir = rawMag < 1e-8 ? [1, 0] : [rawVec[0] / rawMag, rawVec[1] / rawMag];
    setRawVec([dir[0] * val, dir[1] * val]);
  }

  function handleAngleSlider(deg) {
    const rad = deg * Math.PI / 180;
    setRawVec([rawMag * Math.cos(rad), rawMag * Math.sin(rad)]);
  }

  return (
    <WidgetCard
      title="Capsule as Vector — magnitude encodes existence, direction encodes pose"
      number="10.2"
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* ── Canvas + Controls ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#0a0a0a', borderRadius: '8px', overflow: 'hidden' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VBW} ${VBH}`}
              width="100%"
              style={{ display: 'block', cursor: isDragging ? 'grabbing' : 'default', userSelect: 'none' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setIsDragging(false)}
            >
              {/* Axes */}
              <line x1={40} y1={CY} x2={340} y2={CY} stroke={C.border} strokeWidth={1} />
              <line x1={CX} y1={40} x2={CX} y2={340} stroke={C.border} strokeWidth={1} />

              {/* Concentric rings */}
              {[0.25, 0.5, 0.75].map(f => (
                <g key={f}>
                  <circle cx={CX} cy={CY} r={f * R}
                    fill="none" stroke={C.border} strokeWidth={0.8} strokeDasharray="4 3" />
                  <text x={CX + f * R + 3} y={CY - 4}
                    fill={C.muted} fontSize={8} fontFamily="'JetBrains Mono', monospace">
                    {f.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Unit circle */}
              <circle cx={CX} cy={CY} r={R}
                fill="none" stroke={C.borderLt} strokeWidth={1.5} strokeDasharray="6 3" />
              <text x={CX + R + 4} y={CY - 4}
                fill={C.mid} fontSize={9} fontFamily="'JetBrains Mono', monospace">1.0</text>

              {/* Direction arc */}
              {showArc && (
                <>
                  <path
                    d={`M ${CX + arcR} ${CY} A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcEndX} ${arcEndY}`}
                    fill="none" stroke={C.borderLt} strokeWidth={1}
                  />
                  <text x={arcLabelX} y={arcLabelY} textAnchor="middle" dominantBaseline="middle"
                    fill={C.math} fontSize={9} fontFamily="'JetBrains Mono', monospace">
                    {Math.round(displayAngle)}°
                  </text>
                </>
              )}

              {/* Raw vector — dashed gray */}
              {rawMag > 0.02 && (
                <>
                  <line x1={CX} y1={CY} x2={rawTip[0]} y2={rawTip[1]}
                    stroke={C.mid} strokeWidth={2} strokeDasharray="5 3" />
                  <Arrowhead from={[CX, CY]} to={rawTip} color={C.mid} size={9} />
                  <text
                    x={midRaw[0]} y={midRaw[1]}
                    fill={C.mid} fontSize={9} fontFamily="'JetBrains Mono', monospace"
                    textAnchor="middle" dy={-6}
                    transform={`rotate(${labelAngle}, ${midRaw[0]}, ${midRaw[1]})`}
                  >
                    v (raw)
                  </text>
                </>
              )}

              {/* Squashed vector — solid teal */}
              {sqMag > 0.02 && (
                <>
                  <line x1={CX} y1={CY} x2={sqTip[0]} y2={sqTip[1]}
                    stroke={C.accent} strokeWidth={2.5} />
                  <Arrowhead from={[CX, CY]} to={sqTip} color={C.accent} size={9} />
                  <text x={sqLabelX} y={sqLabelY}
                    fill={C.accent} fontSize={9} fontFamily="'JetBrains Mono', monospace"
                    textAnchor={sqLabelAnchor} dominantBaseline="middle">
                    squash(v)
                  </text>
                </>
              )}

              {/* Draggable handle */}
              <circle
                cx={rawTip[0]} cy={rawTip[1]} r={10}
                fill={C.orange} stroke="white" strokeWidth={1.5}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
              />

              {/* Magnitude indicator bar */}
              <line x1={barX} y1={barY1} x2={barX} y2={barY2}
                stroke={C.border} strokeWidth={1} />
              <text x={barX} y={barY1 - 6} textAnchor="middle"
                fill={C.muted} fontSize={7} fontFamily="'JetBrains Mono', monospace">3</text>
              <text x={barX} y={barY2 + 10} textAnchor="middle"
                fill={C.muted} fontSize={7} fontFamily="'JetBrains Mono', monospace">0</text>

              {/* Raw magnitude tick */}
              <line x1={barX - 6} y1={rawBarY} x2={barX + 6} y2={rawBarY}
                stroke={C.orange} strokeWidth={3} />
              <text x={barX + 9} y={rawBarY + 3}
                fill={C.orange} fontSize={8} fontFamily="'JetBrains Mono', monospace">
                {`‖v‖=${rawMag.toFixed(2)}`}
              </text>

              {/* Squashed magnitude tick */}
              <line x1={barX - 6} y1={sqBarY} x2={barX + 6} y2={sqBarY}
                stroke={C.accent} strokeWidth={3} />
              <text x={barX + 9} y={sqBarY + 3}
                fill={C.accent} fontSize={8} fontFamily="'JetBrains Mono', monospace">
                {`sq=${sqMag.toFixed(2)}`}
              </text>
            </svg>
          </div>

          {/* Controls */}
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ ...mono, fontSize: '10px', color: C.mid, width: '100px', flexShrink: 0 }}>
                Magnitude ‖v‖
              </span>
              <input type="range" min={0} max={3} step={0.05}
                value={parseFloat(rawMag.toFixed(2))}
                onChange={e => handleMagSlider(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: C.accent, cursor: 'pointer' }} />
              <span style={{ ...mono, fontSize: '10px', color: C.orange, width: '32px', textAlign: 'right' }}>
                {rawMag.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ ...mono, fontSize: '10px', color: C.mid, width: '100px', flexShrink: 0 }}>
                Angle
              </span>
              <input type="range" min={0} max={360} step={1}
                value={Math.round(displayAngle)}
                onChange={e => handleAngleSlider(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: C.accent, cursor: 'pointer' }} />
              <span style={{ ...mono, fontSize: '10px', color: C.math, width: '32px', textAlign: 'right' }}>
                {Math.round(displayAngle)}°
              </span>
            </div>

            <button
              onClick={() => setShowPlot(p => !p)}
              style={{
                ...mono, fontSize: '10px', padding: '4px 11px',
                background: showPlot ? C.accentDim : C.bg4,
                border: `1px solid ${showPlot ? C.accent : C.borderLt}`,
                color: showPlot ? C.accent : C.mid,
                borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start',
              }}
            >
              {showPlot ? '▼ Squash plot' : '▶ Squash plot'}
            </button>

            {showPlot && <SquashPlot rawMag={rawMag} />}
          </div>
        </div>

        {/* ── Stats panel ── */}
        <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px' }}>
            <div style={{ ...mono, fontSize: '7.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Raw vector v
            </div>
            <StatRow label="Direction" val={`${Math.round(displayAngle)}°`} color={C.math} />
            <StatRow label="Magnitude ‖v‖" val={rawMag.toFixed(3)} color={C.orange} />
            <StatRow label="Components" val={`(${rawVec[0].toFixed(3)}, ${rawVec[1].toFixed(3)})`} color={C.mid} />
          </div>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px' }}>
            <div style={{ ...mono, fontSize: '7.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              After squash(v)
            </div>
            <StatRow label="Direction" val={`${Math.round(displayAngle)}°`} color={C.math} note="same" />
            <StatRow label="Magnitude" val={sqMag.toFixed(3)} color={C.accent} />
            <StatRow label="Components" val={`(${sqVec[0].toFixed(3)}, ${sqVec[1].toFixed(3)})`} color={C.mid} />
          </div>

          <div style={{ background: C.accentDim, border: `1px solid ${C.borderLt}`, borderRadius: '8px', padding: '12px' }}>
            <StatRow label="Entity probability" val={sqMag.toFixed(3)} color={C.accent} />
            <StatRow label="Pose encoding" val={`${Math.round(displayAngle)}°`} color={C.math} />
            <div style={{ height: '1px', background: C.border, margin: '8px 0' }} />
            <StatRow
              label="Compression ratio"
              val={compressionRatio !== null ? compressionRatio.toFixed(3) : '—'}
              color={C.mid}
            />
            <div style={{ ...mono, fontSize: '7px', color: C.muted, marginTop: '7px', lineHeight: 1.5, fontStyle: 'italic' }}>
              squash maps ℝⁿ → (0,1)ⁿ, never reaches 1
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
