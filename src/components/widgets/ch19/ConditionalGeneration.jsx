import { useState, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg2: '#111111', bg3: '#161616', bg4: '#1e1e1e',
  border: '#242424', borderLt: '#2e2e2e',
  muted: '#555555', textMid: '#888888', text: '#e8eaed',
  accent: '#2dd4bf', accentDim: '#0b2422',
  orange: '#fb923c', green: '#34d399',
};

// ── Seeded PRNG (mulberry32) ───────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── SVG dimensions ─────────────────────────────────────────────────────────────
const VW = 580, VH = 406;

// ── SVG rect + label box, centered at (cx, cy) ────────────────────────────────
function Box({ cx, cy, w, h, fill, stroke, label, labelSize = 9 }) {
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h}
            rx={3} fill={fill} stroke={stroke} strokeWidth={1} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fontFamily="'JetBrains Mono', monospace" fontSize={labelSize}
            fill={C.text}>
        {label}
      </text>
    </g>
  );
}

// ── Procedural face (unconditional output) ─────────────────────────────────────
function FaceSVG({ face, cx, cy }) {
  const { headW, headH, eyeSpacing, mouthCurve, skinR, skinG, skinB, eyeSize } = face;
  const sc = `rgb(${skinR | 0},${skinG | 0},${skinB | 0})`;
  const ey = cy - headH * 0.1;
  const my = cy + headH * 0.25;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={headW / 2} ry={headH / 2}
               fill={sc} stroke={C.borderLt} strokeWidth={0.8} />
      <circle cx={cx - eyeSpacing / 2} cy={ey} r={eyeSize} fill="#0d0d20" />
      <circle cx={cx + eyeSpacing / 2} cy={ey} r={eyeSize} fill="#0d0d20" />
      <circle cx={cx - eyeSpacing / 2 + 1.5} cy={ey - 1.5} r={1.5}
              fill="rgba(255,255,255,0.75)" />
      <circle cx={cx + eyeSpacing / 2 + 1.5} cy={ey - 1.5} r={1.5}
              fill="rgba(255,255,255,0.75)" />
      <path d={`M ${cx - 12} ${my} Q ${cx} ${my + mouthCurve} ${cx + 12} ${my}`}
            fill="none" stroke="#7a3030" strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

// ── Preset: shoe sketch / filled shoe ─────────────────────────────────────────
function PresetShoe({ cx, cy, filled }) {
  const s = cx, t = cy;
  if (!filled) {
    return (
      <g stroke={C.borderLt} strokeWidth={1.5} fill="none" strokeLinecap="round">
        <path d={`M ${s-28} ${t+14} Q ${s-18} ${t+21} ${s+28} ${t+19} L ${s+33} ${t+14} Q ${s+18} ${t+7} ${s-23} ${t+9} Z`} />
        <path d={`M ${s-23} ${t+9} Q ${s-18} ${t-9} ${s-4} ${t-17} Q ${s+9} ${t-21} ${s+18} ${t-14} Q ${s+28} ${t-4} ${s+33} ${t+14}`} />
        <line x1={s-9} y1={t-3} x2={s+9} y2={t-7} />
        <line x1={s-7} y1={t+3} x2={s+11} y2={t-0.5} />
      </g>
    );
  }
  return (
    <g>
      <path d={`M ${s-28} ${t+14} Q ${s-18} ${t+21} ${s+28} ${t+19} L ${s+33} ${t+14} Q ${s+18} ${t+7} ${s-23} ${t+9} Z`}
            fill="#555" stroke="#333" strokeWidth={0.8} />
      <path d={`M ${s-23} ${t+9} Q ${s-18} ${t-9} ${s-4} ${t-17} Q ${s+9} ${t-21} ${s+18} ${t-14} Q ${s+28} ${t-4} ${s+33} ${t+14} L ${s-23} ${t+9}`}
            fill="#8B5E3C" stroke="#6B4020" strokeWidth={0.8} />
      <path d={`M ${s-14} ${t-7} Q ${s+1} ${t-17} ${s+14} ${t-11}`}
            fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.2} />
      <line x1={s-9} y1={t-3} x2={s+9} y2={t-7} stroke="white" strokeWidth={1.2} />
      <line x1={s-7} y1={t+3} x2={s+11} y2={t-0.5} stroke="white" strokeWidth={1.2} />
    </g>
  );
}

// ── Preset: schematic map / aerial photo ───────────────────────────────────────
function PresetMap({ cx, cy, filled }) {
  const s = cx, t = cy;
  if (!filled) {
    return (
      <g>
        <rect x={s-32} y={t-22} width={64} height={44} fill="#1e1e1e" rx={2}
              stroke={C.border} strokeWidth={0.5} />
        <rect x={s-32} y={t-4} width={64} height={7} fill="#3a3a3a" />
        <rect x={s+4}  y={t-22} width={7} height={44} fill="#3a3a3a" />
        <rect x={s-29} y={t-19} width={28} height={12} fill="#2a2a2a" />
        <rect x={s-29} y={t+7}  width={28} height={12} fill="#2a2a2a" />
        <rect x={s+14} y={t-19} width={13} height={12} fill="#2a2a2a" />
        <rect x={s+14} y={t+7}  width={13} height={12} fill="#2a2a2a" />
      </g>
    );
  }
  return (
    <g>
      <rect x={s-32} y={t-22} width={64} height={44} fill="#2d3a22" rx={2}
            stroke={C.border} strokeWidth={0.5} />
      <rect x={s-32} y={t-4} width={64} height={7} fill="#555" />
      <rect x={s+4}  y={t-22} width={7} height={44} fill="#555" />
      <rect x={s-29} y={t-19} width={28} height={12} fill="#2d5a1b" />
      <rect x={s-29} y={t+7}  width={28} height={12} fill="#3a6a22" />
      <rect x={s+14} y={t-19} width={13} height={12} fill="#555" />
      <rect x={s+14} y={t+7}  width={13} height={12} fill="#4a4a4a" />
    </g>
  );
}

// ── Preset: edge map / filled photo ───────────────────────────────────────────
function PresetEdges({ cx, cy, filled }) {
  const s = cx, t = cy;
  if (!filled) {
    return (
      <g>
        <rect x={s-32} y={t-22} width={64} height={44} fill="#080808" rx={2}
              stroke={C.borderLt} strokeWidth={0.5} />
        <ellipse cx={s} cy={t-4} rx={18} ry={13}
                 fill="none" stroke="white" strokeWidth={0.8} />
        <rect x={s-22} y={t+10} width={44} height={10} rx={2}
              fill="none" stroke="white" strokeWidth={0.8} />
        <line x1={s-12} y1={t-4} x2={s+12} y2={t-4} stroke="white" strokeWidth={0.6} />
      </g>
    );
  }
  return (
    <g>
      <rect x={s-32} y={t-22} width={64} height={44} fill="#151820" rx={2}
            stroke={C.border} strokeWidth={0.5} />
      <ellipse cx={s} cy={t-4} rx={18} ry={13}
               fill="#3a6a8a" stroke="#2a5a7a" strokeWidth={0.8} />
      <ellipse cx={s-5} cy={t-9} rx={7} ry={4}
               fill="rgba(255,255,255,0.12)" />
      <rect x={s-22} y={t+10} width={44} height={10} rx={2}
            fill="#5a3a1a" stroke="#3a2010" strokeWidth={0.8} />
    </g>
  );
}

// ── Stats panel helpers ────────────────────────────────────────────────────────
function StatRow({ label, val, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', gap: '4px' }}>
      <span style={{ color: C.muted, fontSize: '9px' }}>{label}</span>
      <span style={{ color: color || C.textMid, fontSize: '9px', textAlign: 'right' }}>{val}</span>
    </div>
  );
}
function StatHead({ children }) {
  return (
    <div style={{ color: C.text, fontSize: '9.5px', fontWeight: 600, margin: '2px 0 4px' }}>
      {children}
    </div>
  );
}
function Divider() {
  return <div style={{ borderTop: `1px solid ${C.border}`, margin: '7px 0' }} />;
}

// ── Comparison table ──────────────────────────────────────────────────────────
function ComparisonTable() {
  const rows = [
    ['Generator input',    'z (noise only)',  'x (image) + z'],
    ['Discriminator input','y (image)',        '(x, y) pair'],
    ['Generator output',   'random sample',   'translation of x'],
    ['Use case',           'image synthesis', 'image translation'],
  ];
  const th = hi => ({
    fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 600,
    color: hi ? C.accent : C.textMid,
    background: hi ? 'rgba(45,212,191,0.06)' : 'transparent',
    padding: '5px 8px', borderBottom: `1px solid ${C.border}`,
  });
  const td = hi => ({
    fontFamily: "'Inter', sans-serif", fontSize: '10px',
    color: hi ? C.text : C.textMid,
    background: hi ? 'rgba(45,212,191,0.03)' : 'transparent',
    padding: '4px 8px', borderBottom: `1px solid ${C.border}`,
  });
  return (
    <div style={{
      background: C.bg4, borderRadius: '8px', marginTop: '12px',
      border: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr' }}>
        <div style={th(false)}>Property</div>
        <div style={th(false)}>Unconditional</div>
        <div style={th(true)}>Conditional</div>
        {rows.flatMap(([p, u, co], i) => [
          <div key={`p${i}`} style={td(false)}>{p}</div>,
          <div key={`u${i}`} style={td(false)}>{u}</div>,
          <div key={`c${i}`} style={td(true)}>{co}</div>,
        ])}
      </div>
    </div>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────────
export default function ConditionalGeneration({ tryThis } = {}) {
  const [sampleCount, setSampleCount] = useState(0);
  const [preset, setPreset]           = useState('sketch');
  const [showDInputs, setShowDInputs] = useState(true);
  const [pulsing, setPulsing]         = useState(false);

  const handleSample = useCallback(() => {
    setSampleCount(c => c + 1);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 350);
  }, []);

  const handleReset = useCallback(() => {
    setSampleCount(0);
    setPulsing(false);
  }, []);

  // ── Derived values from sample seed ─────────────────────────────────────────
  const noiseRng  = mulberry32(sampleCount * 3 + 1);
  const noiseVals = Array.from({ length: 16 }, () => Math.floor(noiseRng() * 195 + 35));

  const faceRng = mulberry32(sampleCount * 7 + 42);
  const face = {
    headW:      50 + faceRng() * 25,
    headH:      55 + faceRng() * 20,
    eyeSpacing: 18 + faceRng() * 8,
    mouthCurve: -3 + faceRng() * 6,
    skinR:      160 + faceRng() * 60,
    skinG:      120 + faceRng() * 50,
    skinB:      90  + faceRng() * 40,
    eyeSize:    4.5 + faceRng() * 2.5,
  };

  const jRng = mulberry32(sampleCount * 13 + 77);
  const jDx  = (jRng() - 0.5) * 3;
  const jDy  = (jRng() - 0.5) * 3;

  const showCallout = sampleCount >= 10;

  // ── Conditional styling ──────────────────────────────────────────────────────
  const dStroke      = showDInputs ? C.orange    : C.borderLt;
  const dFill        = showDInputs ? 'rgba(251,146,60,0.15)' : 'rgba(251,146,60,0.07)';
  const dArrowM      = showDInputs ? 'url(#arr-orange)' : 'url(#arr)';
  const dArrowStroke = showDInputs ? C.orange    : C.borderLt;
  const gFilter      = pulsing ? 'drop-shadow(0 0 5px #2dd4bf)' : 'none';

  const presetNames = { sketch: 'Sketch → Shoe', map: 'Map → Aerial', edges: 'Edges → Photo' };
  const PresetComp  = preset === 'sketch' ? PresetShoe
                    : preset === 'map'    ? PresetMap
                    :                       PresetEdges;

  const btnBase = {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
    padding: '5px 14px', borderRadius: '5px', cursor: 'pointer', border: '1px solid',
  };

  return (
    <WidgetCard
      title="Conditional vs Unconditional — image-to-image as a mapping problem"
      number="19.5"
      tryThis={tryThis}
    >
      {/* ── Preset tabs ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
          color: C.muted, flexShrink: 0,
        }}>PRESET:</span>
        {['sketch', 'map', 'edges'].map(p => (
          <button key={p} onClick={() => setPreset(p)} style={{
            ...btnBase,
            borderColor: preset === p ? C.accent : C.border,
            background:  preset === p ? C.accentDim : C.bg4,
            color:       preset === p ? C.accent : C.textMid,
          }}>
            {presetNames[p]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* ── Main SVG area ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
            <defs>
              <marker id="arr" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0,6 2,0 4" fill={C.borderLt} />
              </marker>
              <marker id="arr-orange" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0,6 2,0 4" fill={C.orange} />
              </marker>
              <marker id="arr-accent" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0,6 2,0 4" fill={C.accent} />
              </marker>
            </defs>

            {/* Panel outlines */}
            <rect x={1}   y={1} width={278} height={VH - 2} rx={4}
                  fill="none" stroke={C.border}  strokeWidth={0.5} />
            <rect x={301} y={1} width={278} height={VH - 2} rx={4}
                  fill="none" stroke={C.accent}  strokeWidth={0.5} opacity={0.35} />

            {/* Column titles */}
            <text x={140} y={15} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Inter', sans-serif" fontSize={12} fontWeight={500}
                  fill={C.textMid}>Unconditional GAN</text>
            <text x={440} y={15} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Inter', sans-serif" fontSize={12} fontWeight={500}
                  fill={C.accent}>Conditional GAN</text>

            {/* ══════ UNCONDITIONAL ARCH (y 22–195) ══════ */}

            {/* z box */}
            <Box cx={35}  cy={45} w={58} h={20}
                 fill={C.bg4} stroke={C.borderLt} label="z ~ N(0,I)" labelSize={8} />

            {/* G box with pulse filter */}
            <g style={{ filter: gFilter, transition: 'filter 0.35s ease' }}>
              <Box cx={125} cy={45} w={34} h={30}
                   fill={C.accentDim} stroke={C.accent} label="G" labelSize={13} />
            </g>

            {/* G(z) box */}
            <Box cx={215} cy={45}  w={52} h={20}
                 fill={C.bg3} stroke={C.borderLt} label="G(z)" labelSize={10} />

            {/* real image box */}
            <Box cx={215} cy={118} w={52} h={20}
                 fill={C.bg3} stroke={C.borderLt} label="y_real" labelSize={9} />

            {/* D box */}
            <Box cx={125} cy={118} w={34} h={30}
                 fill={dFill} stroke={dStroke} label="D" labelSize={13} />

            {/* output box */}
            <Box cx={125} cy={176} w={74} h={18}
                 fill={C.bg4} stroke={C.borderLt} label="real / fake" labelSize={9} />

            {/* Arrows — unconditional */}
            <path d="M 64 45 L 108 45"
                  fill="none" stroke={C.borderLt} strokeWidth={1.5} markerEnd="url(#arr)" />
            <path d="M 142 45 L 189 45"
                  fill="none" stroke={C.borderLt} strokeWidth={1.5} markerEnd="url(#arr)" />
            {/* G(z) → D: down then left */}
            <path d="M 215 55 L 215 88 L 142 88 L 142 103"
                  fill="none" stroke={dArrowStroke} strokeWidth={1.5} markerEnd={dArrowM} />
            {/* real → D */}
            <path d="M 189 118 L 142 118"
                  fill="none" stroke={dArrowStroke} strokeWidth={1.5} markerEnd={dArrowM} />
            {/* D → output */}
            <path d="M 125 133 L 125 167"
                  fill="none" stroke={C.borderLt} strokeWidth={1.5} markerEnd="url(#arr)" />

            {/* ══════ CONDITIONAL ARCH (y 22–195) ══════ */}

            {/* x input box */}
            <Box cx={335} cy={45}  w={64} h={20}
                 fill={C.bg3} stroke={C.accent} label="x (input)" labelSize={9} />

            {/* G box with pulse filter */}
            <g style={{ filter: gFilter, transition: 'filter 0.35s ease' }}>
              <Box cx={425} cy={45} w={34} h={30}
                   fill={C.accentDim} stroke={C.accent} label="G" labelSize={13} />
            </g>

            {/* G(x) box */}
            <Box cx={515} cy={45}  w={48} h={20}
                 fill={C.bg3} stroke={C.borderLt} label="G(x)" labelSize={10} />

            {/* x also box */}
            <Box cx={335} cy={118} w={64} h={20}
                 fill={C.bg3} stroke={C.accent} label="x (also)" labelSize={9} />

            {/* D box */}
            <Box cx={425} cy={118} w={34} h={30}
                 fill={dFill} stroke={dStroke} label="D" labelSize={13} />

            {/* real pair box */}
            <Box cx={518} cy={118} w={56} h={20}
                 fill={C.bg3} stroke={C.borderLt} label="(x,y_real)" labelSize={8} />

            {/* output box */}
            <Box cx={425} cy={176} w={82} h={18}
                 fill={C.bg4} stroke={C.borderLt} label="real / fake" labelSize={9} />

            {/* Arrows — conditional */}
            {/* x → G (teal: condition flows in) */}
            <path d="M 367 45 L 408 45"
                  fill="none" stroke={C.accent} strokeWidth={1.5} markerEnd="url(#arr-accent)"
                  opacity={0.8} />
            {/* G → G(x) */}
            <path d="M 442 45 L 491 45"
                  fill="none" stroke={C.borderLt} strokeWidth={1.5} markerEnd="url(#arr)" />
            {/* G(x) → D: down then left */}
            <path d="M 515 55 L 515 88 L 442 88 L 442 103"
                  fill="none" stroke={dArrowStroke} strokeWidth={1.5} markerEnd={dArrowM} />
            {/* x_also → D */}
            <path d="M 367 118 L 408 118"
                  fill="none" stroke={dArrowStroke} strokeWidth={1.5} markerEnd={dArrowM} />
            {/* real_pair → D */}
            <path d="M 490 118 L 442 118"
                  fill="none" stroke={dArrowStroke} strokeWidth={1.5} markerEnd={dArrowM} />
            {/* D → output */}
            <path d="M 425 133 L 425 167"
                  fill="none" stroke={C.borderLt} strokeWidth={1.5} markerEnd="url(#arr)" />

            {/* "pair" bracket — highlights what D sees as a pair */}
            <g opacity={showDInputs ? 1 : 0.18}>
              <path d="M 449 101 L 453 101 L 453 121 L 449 121"
                    fill="none" stroke={C.accent} strokeWidth={0.8} />
              <text x={455} y={111} textAnchor="start" dominantBaseline="central"
                    fontFamily="'JetBrains Mono', monospace" fontSize={7} fill={C.accent}>
                pair
              </text>
            </g>

            {/* ══ Vertical divider ══ */}
            <line x1={290} y1={22} x2={290} y2={VH - 10}
                  stroke={C.border} strokeWidth={1} />

            {/* ══ Horizontal section separators ══ */}
            {[200, 278].map(yy => (
              <g key={yy}>
                <line x1={5}   y1={yy} x2={275} y2={yy} stroke={C.border} strokeWidth={0.5} />
                <line x1={305} y1={yy} x2={575} y2={yy} stroke={C.border} strokeWidth={0.5} />
              </g>
            ))}

            {/* ══════ INPUT PANELS (y 200–278) ══════ */}

            <text x={140} y={210} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'JetBrains Mono', monospace" fontSize={9} fontWeight={600}
                  fill={C.muted} letterSpacing={1}>INPUT</text>
            <text x={440} y={210} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'JetBrains Mono', monospace" fontSize={9} fontWeight={600}
                  fill={C.muted} letterSpacing={1}>INPUT</text>

            {/* Noise grid (unconditional: random z) */}
            {noiseVals.map((v, i) => (
              <rect key={i}
                    x={120 + (i % 4) * 10} y={217 + Math.floor(i / 4) * 10}
                    width={9} height={9} rx={1}
                    fill={`rgb(${v},${v},${v})`} />
            ))}
            <text x={140} y={264} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Inter', sans-serif" fontSize={8} fill={C.muted}>
              z (random latent)
            </text>

            {/* Conditional input (preset, fixed — x stays the same!) */}
            <PresetComp cx={440} cy={237} filled={false} />
            <text x={440} y={264} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Inter', sans-serif" fontSize={8} fill={C.muted}>
              x (condition: input image)
            </text>

            {/* ══════ OUTPUT PANELS (y 278–406) ══════ */}

            <text x={140} y={290} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'JetBrains Mono', monospace" fontSize={9} fontWeight={600}
                  fill={C.muted} letterSpacing={1}>OUTPUT</text>
            <text x={440} y={290} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'JetBrains Mono', monospace" fontSize={9} fontWeight={600}
                  fill={C.muted} letterSpacing={1}>OUTPUT</text>

            {/* Procedural face (new every sample) */}
            <FaceSVG face={face} cx={140} cy={345} />
            <text x={140} y={393} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Inter', sans-serif" fontSize={8} fill={C.muted}>
              G(z) — arbitrary face from noise
            </text>

            {/* Conditional output (same structure, subtle jitter each sample) */}
            <PresetComp cx={440 + jDx} cy={345 + jDy} filled={true} />
            <text x={440} y={393} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Inter', sans-serif" fontSize={8} fill={C.muted}>
              G(x) — translation of x
            </text>
          </svg>

          {/* Callout after 10 samples */}
          {showCallout && (
            <div style={{
              background: C.bg4, borderRadius: '8px', padding: '11px 14px',
              marginTop: '10px', border: `1px solid ${C.borderLt}`,
              fontFamily: "'Inter', sans-serif", fontSize: '11px',
              color: C.textMid, lineHeight: 1.6, fontStyle: 'italic',
            }}>
              Notice: Unconditional outputs are all over the place. Conditional outputs
              cluster around the input — they translate it.
            </div>
          )}

          {/* Comparison table */}
          <ComparisonTable />

          {/* Controls row */}
          <div style={{
            display: 'flex', gap: '8px', marginTop: '10px',
            alignItems: 'center', flexWrap: 'wrap',
          }}>
            <button onClick={handleSample} style={{
              ...btnBase, borderColor: C.accent, background: C.accentDim, color: C.accent,
            }}>Sample</button>
            <button onClick={handleReset} style={{
              ...btnBase, borderColor: C.borderLt, background: C.bg4, color: C.textMid,
            }}>Reset</button>
            <div style={{ flex: 1 }} />
            <label style={{
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.textMid,
            }}>
              <input type="checkbox" checked={showDInputs}
                     onChange={e => setShowDInputs(e.target.checked)}
                     style={{ accentColor: C.accent, width: '13px', height: '13px' }} />
              Show D inputs
            </label>
          </div>
        </div>

        {/* ── Stats panel ── */}
        <div style={{
          width: 180, flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '12px 14px',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <StatRow label="Samples" val={sampleCount} color={C.accent} />
          <StatRow label="Preset"  val={presetNames[preset].split(' ')[0]} />
          <Divider />
          <StatHead>Unconditional</StatHead>
          <StatRow label="G input"   val="z (noise)" />
          <StatRow label="D input"   val="y (image)" />
          <StatRow label="Diversity" val="high"      color={C.orange} />
          <StatRow label="Relation"  val="none" />
          <Divider />
          <StatHead>Conditional</StatHead>
          <StatRow label="G input"   val="x (+ z via dropout)" />
          <StatRow label="D input"   val="(x, y)" />
          <StatRow label="Diversity" val="constrained" color={C.green} />
          <StatRow label="Relation"  val="structural"  color={C.accent} />
          <Divider />
          <div style={{ color: C.accent, fontSize: '9px', marginBottom: '4px' }}>
            Key insight:
          </div>
          <div style={{ color: C.muted, fontSize: '9px', lineHeight: 1.55 }}>
            Conditional GANs treat generation as a mapping problem, not a sampling problem.
          </div>
          <Divider />
          <div style={{ color: C.textMid, fontSize: '9px', marginBottom: '3px' }}>Loss:</div>
          <div style={{ color: C.muted, fontSize: '9px', lineHeight: 1.6 }}>
            <div>Uncond: match p(y)</div>
            <div>Cond: match p(y|x)</div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
