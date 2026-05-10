import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  bg2: '#111111', bg3: '#161616', bg4: '#1e1e1e',
  border: '#242424', borderLt: '#2e2e2e',
  text: '#e8eaed', muted: '#555555', textMid: '#888888',
  accent: '#2dd4bf', accentDim: '#0b2422',
  green: '#34d399', red: '#f87171', orange: '#fb923c',
  math: '#fbbf24', mid: '#888888',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ── Coupling + magnitude tables ───────────────────────────────────────────────
const COUPLINGS = {
  valid:     { 0: [0.50,0.50,0.50], 1: [0.72,0.68,0.65], 2: [0.84,0.80,0.76], 3: [0.88,0.84,0.79] },
  scrambled: { 0: [0.50,0.50,0.50], 1: [0.32,0.29,0.34], 2: [0.24,0.20,0.26], 3: [0.21,0.18,0.23] },
};
const MAGNITUDES = {
  valid:     { 0: 0.50, 1: 0.71, 2: 0.86, 3: 0.93 },
  scrambled: { 0: 0.50, 1: 0.32, 2: 0.19, 3: 0.11 },
};

// ── Face positions (160×180 viewBox) ─────────────────────────────────────────
const VALID_FACE = {
  leftEye:  { cx: 52,  cy: 72  },
  rightEye: { cx: 108, cy: 72  },
  nose:     { cx: 80,  cy: 103 },
  mouth:    { x1: 52, y1: 130, x2: 108, y2: 130, cpx: 80, cpy: 122 },
};
const SCRAMBLED_FACE = {
  leftEye:  { cx: 118, cy: 148 },
  rightEye: { cx: 28,  cy: 32  },
  nose:     { cx: 28,  cy: 140 },
  mouth:    { x1: 78, y1: 45, x2: 134, y2: 45, cpx: 106, cpy: 37 },
};

// ── FaceCanvas (SVG, 160×180 coordinate space) ───────────────────────────────
function FaceCanvas({ positions, showPooling }) {
  const { leftEye, rightEye, nose, mouth } = positions;
  return (
    <svg viewBox="0 0 160 180" width="100%" style={{ display: 'block' }}>
      <rect width={160} height={180} fill={C.bg3} rx="8" />
      <ellipse cx={80} cy={90} rx={65} ry={80}
        fill={C.bg4} stroke={C.borderLt} strokeWidth={2} />

      {[leftEye, rightEye].map((eye, i) => (
        <g key={i}>
          <circle cx={eye.cx} cy={eye.cy} r={9}
            fill="#1a1a1a" stroke={C.text} strokeWidth={2} />
          <circle cx={eye.cx} cy={eye.cy} r={4} fill={C.text} />
        </g>
      ))}

      <polygon
        points={`${nose.cx},${nose.cy} ${nose.cx-6},${nose.cy-10} ${nose.cx+6},${nose.cy-10}`}
        fill={C.bg4} stroke={C.mid} strokeWidth={1.5} />

      <path
        d={`M ${mouth.x1} ${mouth.y1} Q ${mouth.cpx} ${mouth.cpy} ${mouth.x2} ${mouth.y2}`}
        stroke={C.mid} strokeWidth={2} fill="none" strokeLinecap="round" />

      {showPooling && [[0,0],[80,0],[0,90],[80,90]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={80} height={90}
            fill="rgba(251,191,36,0.05)" stroke={C.math}
            strokeWidth={1} strokeDasharray="3 2" />
          <text x={x+40} y={y+45} textAnchor="middle" dominantBaseline="middle"
            fill={C.math} fontSize={8} fontFamily="'JetBrains Mono', monospace">
            pool
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── CNN feature-bar panel ─────────────────────────────────────────────────────
function CnnPanel({ scores, isValid }) {
  const avg = ((scores.eyes + scores.nose + scores.mouth) / 3).toFixed(2);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {[['Eyes', scores.eyes], ['Nose', scores.nose], ['Mouth', scores.mouth]].map(([feat, score]) => (
        <div key={feat}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ ...mono, fontSize: '8px', color: C.textMid }}>{feat} detected</span>
            <span style={{ ...mono, fontSize: '8px', color: C.accent }}>{score.toFixed(2)}</span>
          </div>
          <div style={{ height: '5px', background: C.bg3, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score * 100}%`, background: C.accent, borderRadius: '3px' }} />
          </div>
        </div>
      ))}

      {/* Score box */}
      <div style={{ marginTop: '4px', padding: '7px 8px', background: C.bg3,
        borderRadius: '5px', border: `1px solid ${C.border}` }}>
        <div style={{ ...mono, fontSize: '7px', color: C.muted, marginBottom: '3px' }}>
          Face detected (avg)
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '4px' }}>
          <span style={{ ...mono, fontSize: '18px', color: C.green, lineHeight: 1 }}>{avg}</span>
          <span style={{ ...mono, fontSize: '9px', color: C.green }}>✓ detected</span>
        </div>
        <div style={{ ...mono, fontSize: '8px', color: C.orange, fontStyle: 'italic', lineHeight: 1.35 }}>
          Cannot distinguish spatial arrangement
        </div>
      </div>
    </div>
  );
}

// ── Routing diagram (190×116 viewBox) ────────────────────────────────────────
function RoutingDiagram({ couplings, magnitude, isValid }) {
  const W = 190, H = 116;
  const partX = 24, partR = 13;
  const faceX = 158, faceY = 58;
  const partYs = [18, 58, 98];
  const faceR = Math.round(13 + magnitude * 8);
  const markerId = isValid ? 'mkv' : 'mks';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <marker id={markerId} markerWidth="5" markerHeight="5"
          refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 z"
            fill={isValid ? C.accent : C.borderLt} />
        </marker>
      </defs>

      {/* Arrows */}
      {partYs.map((py, i) => {
        const c = couplings[i];
        const sw = Math.max(0.5, c * 5);
        const color = c > 0.5 ? C.accent : C.borderLt;
        const op = Math.max(0.15, c);
        const x1 = partX + partR, y1 = py;
        const x2 = faceX - faceR, y2 = faceY;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color} strokeWidth={sw} opacity={op}
              markerEnd={`url(#${markerId})`} />
            {!isValid && (
              <g>
                <circle cx={mx} cy={my} r={6} fill={C.red} />
                <text x={mx} y={my + 2.5} textAnchor="middle"
                  fill="white" fontSize={6}
                  fontFamily="'JetBrains Mono', monospace">✗</text>
              </g>
            )}
          </g>
        );
      })}

      {/* Part capsules */}
      {['Eyes','Nose','Mouth'].map((name, i) => (
        <g key={i}>
          <circle cx={partX} cy={partYs[i]} r={partR}
            fill={C.bg4} stroke={C.borderLt} strokeWidth={1} />
          <text x={partX} y={partYs[i] + 2} textAnchor="middle"
            fill={C.textMid} fontSize={7}
            fontFamily="'JetBrains Mono', monospace">{name}</text>
          <text x={partX} y={partYs[i] + 10} textAnchor="middle"
            fill={isValid ? C.accent : C.muted} fontSize={6}
            fontFamily="'JetBrains Mono', monospace">{couplings[i].toFixed(2)}</text>
        </g>
      ))}

      {/* Face capsule */}
      <circle cx={faceX} cy={faceY} r={faceR}
        fill={isValid ? C.accentDim : C.bg3}
        stroke={isValid ? C.accent : C.border}
        strokeWidth={isValid ? 2 : 1} />
      <text x={faceX} y={faceY - 2} textAnchor="middle"
        fill={isValid ? C.accent : C.muted} fontSize={7}
        fontFamily="'JetBrains Mono', monospace">Face</text>
      <text x={faceX} y={faceY + 8} textAnchor="middle"
        fill={isValid ? C.green : C.red} fontSize={6.5}
        fontFamily="'JetBrains Mono', monospace">{magnitude.toFixed(2)}</text>
    </svg>
  );
}

// ── CapsNet panel ─────────────────────────────────────────────────────────────
function CapsnetPanel({ couplings, magnitude, isValid }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ background: C.bg3, borderRadius: '5px',
        border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <RoutingDiagram couplings={couplings} magnitude={magnitude} isValid={isValid} />
      </div>

      <div style={{ padding: '7px 8px', background: C.bg3,
        borderRadius: '5px', border: `1px solid ${C.border}` }}>
        <div style={{ ...mono, fontSize: '7px', color: C.muted, marginBottom: '3px' }}>
          Face capsule: ‖v‖
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: isValid ? 0 : '4px' }}>
          <span style={{ ...mono, fontSize: '18px', color: isValid ? C.green : C.red, lineHeight: 1 }}>
            {magnitude.toFixed(2)}
          </span>
          <span style={{ ...mono, fontSize: '9px', color: isValid ? C.green : C.red }}>
            {isValid ? '✓ detected' : '✗ rejected'}
          </span>
        </div>
        {!isValid && (
          <div style={{ ...mono, fontSize: '8px', color: C.accent, lineHeight: 1.35 }}>
            Spatial disagreement → low routing
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bottom stats strip ────────────────────────────────────────────────────────
function StatsStrip({ iteration, animating }) {
  const cells = [
    { label: 'Valid · CNN',         val: '0.91', color: C.green,  note: '✓' },
    { label: 'Valid · CapsNet ‖v‖', val: '0.93', color: C.green,  note: '✓' },
    { label: 'Scrambled · CNN',     val: '0.89', color: C.orange, note: '✓ wrong!' },
    { label: 'Scrambled · ‖v‖',    val: '0.11', color: C.red,    note: '✗ correct!' },
    { label: 'CapsNet Δ',           val: '0.82', color: C.accent, note: 'separation' },
    { label: 'Routing iter',        val: `${iteration}/3`, color: animating ? C.accent : C.textMid, note: '' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0',
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: '8px', overflow: 'hidden', marginTop: '10px' }}>
      {cells.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{ padding: '8px 10px', flex: 1 }}>
            <div style={{ ...mono, fontSize: '7px', color: C.muted, textTransform: 'uppercase',
              letterSpacing: '0.07em', marginBottom: '3px', whiteSpace: 'nowrap' }}>{c.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ ...mono, fontSize: '14px', color: c.color, lineHeight: 1 }}>{c.val}</span>
              {c.note && <span style={{ ...mono, fontSize: '7px', color: c.color, whiteSpace: 'nowrap' }}>{c.note}</span>}
            </div>
          </div>
          {i < cells.length - 1 && (
            <div style={{ width: '1px', alignSelf: 'stretch', background: C.border }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Shared column label ───────────────────────────────────────────────────────
function ColLabel({ children }) {
  return (
    <div style={{ ...mono, fontSize: '8px', color: C.accent, textTransform: 'uppercase',
      letterSpacing: '0.09em', marginBottom: '5px', textAlign: 'center' }}>
      {children}
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function CnnVsCapsnet() {
  const [iteration,   setIteration]   = useState(3);
  const [animating,   setAnimating]   = useState(false);
  const [showPooling, setShowPooling] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function animate() {
    if (animating) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setIteration(0);
    setAnimating(true);
    [1, 2, 3].forEach(iter => {
      const t = setTimeout(() => {
        setIteration(iter);
        if (iter === 3) setAnimating(false);
      }, iter * 650);
      timers.current.push(t);
    });
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAnimating(false);
    setIteration(3);
  }

  const vc  = COUPLINGS.valid[iteration];
  const sc  = COUPLINGS.scrambled[iteration];
  const vm  = MAGNITUDES.valid[iteration];
  const sm  = MAGNITUDES.scrambled[iteration];

  const CNN_V = { eyes: 0.94, nose: 0.91, mouth: 0.88 };
  const CNN_S = { eyes: 0.92, nose: 0.89, mouth: 0.87 };

  // Face column: 110px. CNN + CapsNet: flex:1 each. Gaps: 8px.
  // Total: 110 + 8 + flex + 8 + flex = 616px → each flex ≈ 245px. ✓
  const FACE_W = 110;

  return (
    <WidgetCard title="CNN vs CapsNet — spatial arrangement matters" number="10.1">

      {/* Column headers */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        <div style={{ width: FACE_W, flexShrink: 0 }} />
        <div style={{ flex: 1 }}><ColLabel>CNN + Max Pooling</ColLabel></div>
        <div style={{ flex: 1 }}><ColLabel>CapsNet + Routing</ColLabel></div>
      </div>

      {/* ROW 1 — Valid face */}
      <div style={{ ...mono, fontSize: '8px', color: C.textMid, textTransform: 'uppercase',
        letterSpacing: '0.07em', marginBottom: '5px' }}>Valid Face</div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ width: FACE_W, flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
          <FaceCanvas positions={VALID_FACE} showPooling={showPooling} />
        </div>
        <div style={{ flex: 1, padding: '9px', background: C.bg4,
          borderRadius: '6px', border: `1px solid ${C.border}` }}>
          <CnnPanel scores={CNN_V} isValid={true} />
        </div>
        <div style={{ flex: 1, padding: '9px', background: C.bg4,
          borderRadius: '6px', border: `1px solid ${C.border}` }}>
          <CapsnetPanel couplings={vc} magnitude={vm} isValid={true} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: C.border, margin: '2px 0 10px' }} />

      {/* ROW 2 — Scrambled face */}
      <div style={{ ...mono, fontSize: '8px', color: C.textMid, textTransform: 'uppercase',
        letterSpacing: '0.07em', marginBottom: '5px' }}>Scrambled Face</div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ width: FACE_W, flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
          <FaceCanvas positions={SCRAMBLED_FACE} showPooling={showPooling} />
        </div>
        <div style={{ flex: 1, padding: '9px', background: C.bg4,
          borderRadius: '6px', border: `1px solid ${C.border}` }}>
          <CnnPanel scores={CNN_S} isValid={false} />
        </div>
        <div style={{ flex: 1, padding: '9px', background: C.bg4,
          borderRadius: '6px', border: `1px solid ${C.border}` }}>
          <CapsnetPanel couplings={sc} magnitude={sm} isValid={false} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={animate} disabled={animating} style={{
          ...mono, fontSize: '11px', borderRadius: '4px', padding: '5px 13px',
          cursor: animating ? 'not-allowed' : 'pointer',
          border: `1px solid ${C.accent}`, background: C.accent, color: '#000',
          opacity: animating ? 0.5 : 1,
        }}>
          {animating ? `Iterating ${iteration}/3…` : '▶ Animate Routing'}
        </button>
        <button onClick={reset} style={{
          ...mono, fontSize: '11px', borderRadius: '4px', padding: '5px 11px',
          cursor: 'pointer', border: `1px solid ${C.borderLt}`,
          background: C.bg4, color: C.textMid,
        }}>
          ↺ Reset
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showPooling}
            onChange={e => setShowPooling(e.target.checked)}
            style={{ accentColor: C.accent, width: 12, height: 12, cursor: 'pointer' }} />
          <span style={{ ...mono, fontSize: '10px', color: C.muted }}>Show pooling regions</span>
        </label>
      </div>

      {/* Stats strip */}
      <StatsStrip iteration={iteration} animating={animating} />
    </WidgetCard>
  );
}
