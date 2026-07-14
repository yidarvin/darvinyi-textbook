import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  text:      '#e8eaed',
  textMid:   '#888888',
  textMuted: '#555555',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  codeBg:    '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const VW = 580, VH = 460;

const B = {
  realX: { x: 60,  y: 30,  w: 100, h: 60 },
  realY: { x: 420, y: 30,  w: 100, h: 60 },
  G:     { x: 240, y: 110, w: 100, h: 50 },
  fakeY: { x: 420, y: 200, w: 100, h: 60 },
  F:     { x: 240, y: 280, w: 100, h: 50 },
  fakeX: { x: 60,  y: 200, w: 100, h: 60 },
  DX:    { x: 60,  y: 365, w: 100, h: 50 },
  DY:    { x: 420, y: 365, w: 100, h: 50 },
};
const bcx = k => B[k].x + B[k].w / 2;
const bcy = k => B[k].y + B[k].h / 2;

const GROUPS = {
  advGDy:   ['G','fakeY','DY','aRealXG','aGFakeY','aFakeYDY','aRealYDY'],
  advFDx:   ['F','fakeX','DX','aRealYF','aFFakeX','aFakeXDX','aRealXDX'],
  cycleFwd: ['realX','G','fakeY','F','aRealXG','aGFakeY','aCycleFwd'],
  cycleRev: ['realY','F','fakeX','G','aRealYF','aFFakeX','aCycleRev'],
};

const LOSS_TABS = [
  { id: 'none',     label: 'None'       },
  { id: 'advGDy',   label: 'Adv G+D_Y' },
  { id: 'advFDx',   label: 'Adv F+D_X' },
  { id: 'cycleFwd', label: 'X→Y→X'     },
  { id: 'cycleRev', label: 'Y→X→Y'     },
  { id: 'all',      label: 'All'        },
];

const NETWORKS = [
  { id: 'G',  purpose: 'X → Y',       trained: 'Fool D_Y + cycle loss',  isGen: true  },
  { id: 'F',  purpose: 'Y → X',       trained: 'Fool D_X + cycle loss',  isGen: true  },
  { id: 'DX', purpose: 'Real/fake X', trained: 'Classify real vs gen.',  isGen: false },
  { id: 'DY', purpose: 'Real/fake Y', trained: 'Classify real vs gen.',  isGen: false },
];

function tabColor(id) {
  if (id === 'advGDy' || id === 'advFDx') return C.orange;
  if (id === 'cycleFwd' || id === 'cycleRev') return C.green;
  return C.accent;
}

function elOp(id, mode) {
  if (mode === 'none' || mode === 'all') return 1;
  const g = GROUPS[mode];
  return g && g.includes(id) ? 1 : 0.15;
}

function elSW(id, mode, base = 1.5) {
  if (mode === 'none' || mode === 'all') return base;
  const g = GROUPS[mode];
  return g && g.includes(id) ? base + 1 : base;
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '6px 0' }} />;
}

function SHead({ children }) {
  return (
    <div style={{ fontFamily: mono, fontSize: 8, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, marginTop: 8 }}>
      {children}
    </div>
  );
}

function SRow({ label, val, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
      <span style={{ fontFamily: mono, fontSize: 9, color: C.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 9, color: color || C.textMid, textAlign: 'right' }}>{val}</span>
    </div>
  );
}

function Toggle({ label, on, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!on)} style={{
        width: 26, height: 13, borderRadius: 7, flexShrink: 0,
        background: on ? C.accent : C.bg4,
        border: `1px solid ${on ? C.accent : C.border}`,
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 1, left: on ? 13 : 1,
          width: 9, height: 9, borderRadius: '50%',
          background: on ? '#0a0a0a' : C.textMuted,
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: mono, fontSize: 10, color: C.textMid }}>{label}</span>
    </label>
  );
}

function DiagramSVG({ mode, showCycle, showDisc }) {
  const op = id => elOp(id, mode);
  const sw = (id, base) => elSW(id, mode, base);

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <marker id="cgG" viewBox="0 0 8 6" refX="7" refY="3" markerWidth="5" markerHeight="4" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#777"/>
        </marker>
        <marker id="cgR" viewBox="0 0 8 6" refX="7" refY="3" markerWidth="5" markerHeight="4" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="rgba(248,113,113,0.8)"/>
        </marker>
        <marker id="cgA" viewBox="0 0 8 6" refX="7" refY="3" markerWidth="5" markerHeight="4" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#2dd4bf"/>
        </marker>
        <marker id="cgO" viewBox="0 0 8 6" refX="7" refY="3" markerWidth="5" markerHeight="4" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#fb923c"/>
        </marker>
      </defs>

      {/* Domain labels */}
      <text x={110} y={20} textAnchor="middle" fontFamily={mono} fontSize={9} fill={C.accent} opacity={0.7}>X DOMAIN</text>
      <text x={470} y={20} textAnchor="middle" fontFamily={mono} fontSize={9} fill={C.orange} opacity={0.7}>Y DOMAIN</text>

      {/* ── Boxes ── */}
      <g opacity={op('realX')}>
        <rect x={B.realX.x} y={B.realX.y} width={B.realX.w} height={B.realX.h} rx={4}
              fill={C.bg3} stroke={C.accent} strokeWidth={sw('realX', 2)}/>
        <text x={bcx('realX')} y={bcy('realX')-8} textAnchor="middle" fontFamily={mono} fontSize={10} fill={C.accent}>Real x</text>
        <text x={bcx('realX')} y={bcy('realX')+6} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.textMid}>x ∈ X (horse)</text>
      </g>

      <g opacity={op('realY')}>
        <rect x={B.realY.x} y={B.realY.y} width={B.realY.w} height={B.realY.h} rx={4}
              fill={C.bg3} stroke={C.orange} strokeWidth={sw('realY', 2)}/>
        <text x={bcx('realY')} y={bcy('realY')-8} textAnchor="middle" fontFamily={mono} fontSize={10} fill={C.orange}>Real y</text>
        <text x={bcx('realY')} y={bcy('realY')+6} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.textMid}>y ∈ Y (zebra)</text>
      </g>

      <g opacity={op('G')}>
        <rect x={B.G.x} y={B.G.y} width={B.G.w} height={B.G.h} rx={4}
              fill="rgba(45,212,191,0.1)" stroke={C.accent} strokeWidth={sw('G', 2)}/>
        <text x={bcx('G')} y={bcy('G')-5} textAnchor="middle" fontFamily={mono} fontSize={13} fill={C.accent} fontWeight="600">G</text>
        <text x={bcx('G')} y={bcy('G')+9} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.textMid}>X → Y</text>
      </g>

      <g opacity={op('F')}>
        <rect x={B.F.x} y={B.F.y} width={B.F.w} height={B.F.h} rx={4}
              fill="rgba(45,212,191,0.1)" stroke={C.accent} strokeWidth={sw('F', 2)}/>
        <text x={bcx('F')} y={bcy('F')-5} textAnchor="middle" fontFamily={mono} fontSize={13} fill={C.accent} fontWeight="600">F</text>
        <text x={bcx('F')} y={bcy('F')+9} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.textMid}>Y → X</text>
      </g>

      <g opacity={op('fakeY')}>
        <rect x={B.fakeY.x} y={B.fakeY.y} width={B.fakeY.w} height={B.fakeY.h} rx={4}
              fill={C.bg3} stroke={C.orange} strokeWidth={sw('fakeY', 1.5)} strokeDasharray="5 3"/>
        <text x={bcx('fakeY')} y={bcy('fakeY')-8} textAnchor="middle" fontFamily={mono} fontSize={10} fill={C.orange}>G(x)</text>
        <text x={bcx('fakeY')} y={bcy('fakeY')+6} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.textMid}>fake y</text>
      </g>

      <g opacity={op('fakeX')}>
        <rect x={B.fakeX.x} y={B.fakeX.y} width={B.fakeX.w} height={B.fakeX.h} rx={4}
              fill={C.bg3} stroke={C.accent} strokeWidth={sw('fakeX', 1.5)} strokeDasharray="5 3"/>
        <text x={bcx('fakeX')} y={bcy('fakeX')-8} textAnchor="middle" fontFamily={mono} fontSize={10} fill={C.accent}>F(y)</text>
        <text x={bcx('fakeX')} y={bcy('fakeX')+6} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.textMid}>fake x</text>
      </g>

      <g opacity={op('DX')}>
        <rect x={B.DX.x} y={B.DX.y} width={B.DX.w} height={B.DX.h} rx={4}
              fill="rgba(248,113,113,0.1)" stroke={C.red} strokeWidth={sw('DX', 2)}/>
        <text x={bcx('DX')} y={bcy('DX')-5} textAnchor="middle" fontFamily={mono} fontSize={11} fill={C.red} fontWeight="600">D_X</text>
        <text x={bcx('DX')} y={bcy('DX')+8} textAnchor="middle" fontFamily={mono} fontSize={7.5} fill={C.textMid}>real/fake X</text>
      </g>

      <g opacity={op('DY')}>
        <rect x={B.DY.x} y={B.DY.y} width={B.DY.w} height={B.DY.h} rx={4}
              fill="rgba(248,113,113,0.1)" stroke={C.red} strokeWidth={sw('DY', 2)}/>
        <text x={bcx('DY')} y={bcy('DY')-5} textAnchor="middle" fontFamily={mono} fontSize={11} fill={C.red} fontWeight="600">D_Y</text>
        <text x={bcx('DY')} y={bcy('DY')+8} textAnchor="middle" fontFamily={mono} fontSize={7.5} fill={C.textMid}>real/fake Y</text>
      </g>

      {/* ── Generation arrows ── */}
      <line opacity={op('aRealXG')}
            x1={B.realX.x + B.realX.w} y1={bcy('realX')} x2={B.G.x} y2={bcy('G')}
            stroke="#888" strokeWidth={1.5} markerEnd="url(#cgG)"/>

      <g opacity={op('aGFakeY')}>
        <line x1={B.G.x + B.G.w} y1={bcy('G')} x2={B.fakeY.x} y2={bcy('fakeY')}
              stroke="#888" strokeWidth={1.5} markerEnd="url(#cgG)"/>
        <text x={384} y={160} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.textMuted}>G(x)</text>
      </g>

      {/* Real Y → F: curved path routes right of G box */}
      <path opacity={op('aRealYF')}
            d={`M ${B.realY.x},${bcy('realY')} Q 360,180 ${B.F.x + B.F.w},${bcy('F')}`}
            stroke="#888" strokeWidth={1.5} fill="none" markerEnd="url(#cgG)"/>

      <g opacity={op('aFFakeX')}>
        <line x1={B.F.x} y1={bcy('F')} x2={B.fakeX.x + B.fakeX.w} y2={bcy('fakeX')}
              stroke="#888" strokeWidth={1.5} markerEnd="url(#cgG)"/>
        <text x={197} y={268} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.textMuted}>F(y)</text>
      </g>

      {/* ── Discriminator feed arrows ── */}
      {showDisc && (
        <>
          {/* Real X → D_X: runs at x=55, left of fakeX box (fakeX starts at x=60) */}
          <g opacity={op('aRealXDX')}>
            <line x1={55} y1={B.realX.y + B.realX.h} x2={55} y2={B.DX.y}
                  stroke="rgba(248,113,113,0.5)" strokeWidth={1} strokeDasharray="4 3" markerEnd="url(#cgR)"/>
            <text x={55} y={B.DX.y - 4} textAnchor="middle" fontFamily={mono} fontSize={7} fill={C.red} opacity={0.7}>real</text>
          </g>
          <g opacity={op('aFakeXDX')}>
            <line x1={115} y1={B.fakeX.y + B.fakeX.h} x2={115} y2={B.DX.y}
                  stroke="rgba(248,113,113,0.5)" strokeWidth={1} strokeDasharray="4 3" markerEnd="url(#cgR)"/>
            <text x={115} y={B.DX.y - 4} textAnchor="middle" fontFamily={mono} fontSize={7} fill={C.red} opacity={0.7}>fake</text>
          </g>
          {/* Real Y → D_Y: runs at x=525, right of fakeY box (fakeY ends at x=520) */}
          <g opacity={op('aRealYDY')}>
            <line x1={525} y1={B.realY.y + B.realY.h} x2={525} y2={B.DY.y}
                  stroke="rgba(248,113,113,0.5)" strokeWidth={1} strokeDasharray="4 3" markerEnd="url(#cgR)"/>
            <text x={525} y={B.DY.y - 4} textAnchor="middle" fontFamily={mono} fontSize={7} fill={C.red} opacity={0.7}>real</text>
          </g>
          <g opacity={op('aFakeYDY')}>
            <line x1={465} y1={B.fakeY.y + B.fakeY.h} x2={465} y2={B.DY.y}
                  stroke="rgba(248,113,113,0.5)" strokeWidth={1} strokeDasharray="4 3" markerEnd="url(#cgR)"/>
            <text x={465} y={B.DY.y - 4} textAnchor="middle" fontFamily={mono} fontSize={7} fill={C.red} opacity={0.7}>fake</text>
          </g>
        </>
      )}

      {/* ── Cycle consistency arcs ── */}
      {showCycle && (
        <>
          {/* Forward: F(G(x)) ≈ x — wide arc wrapping left side */}
          <g opacity={op('aCycleFwd')}>
            <path d={`M ${B.F.x},${bcy('F')} Q 20,400 ${B.realX.x},${bcy('realX')}`}
                  stroke={C.accent} strokeWidth={1.5} fill="none" strokeDasharray="6 3"
                  markerEnd="url(#cgA)"/>
            <text x={72} y={302} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.accent}>F(G(x)) ≈ x</text>
          </g>
          {/* Reverse: G(F(y)) ≈ y — arc wrapping right side */}
          <g opacity={op('aCycleRev')}>
            <path d={`M ${B.G.x + B.G.w},${B.G.y} Q 560,160 ${B.realY.x + B.realY.w},${bcy('realY')}`}
                  stroke={C.orange} strokeWidth={1.5} fill="none" strokeDasharray="6 3"
                  markerEnd="url(#cgO)"/>
            <text x={508} y={130} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.orange}>G(F(y)) ≈ y</text>
          </g>
        </>
      )}
    </svg>
  );
}

function NetworkTable() {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
      {/* header */}
      <div style={{ display: 'flex', background: C.bg3, borderBottom: `1px solid ${C.border}` }}>
        {[['Net', '0 0 36px'], ['Role', '0 0 72px'], ['Objective', '1']].map(([h, flex]) => (
          <div key={h} style={{ flex, padding: '5px 8px', fontFamily: mono, fontSize: 9, color: C.textMuted }}>
            {h}
          </div>
        ))}
      </div>
      {NETWORKS.map((r, i) => (
        <div key={r.id} style={{ display: 'flex', background: i % 2 === 0 ? C.bg3 : C.bg4, borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}>
          <div style={{ flex: '0 0 36px', padding: '5px 8px', fontFamily: mono, fontSize: 10, fontWeight: 600, color: r.isGen ? C.accent : C.red }}>
            {r.id}
          </div>
          <div style={{ flex: '0 0 72px', padding: '5px 8px', fontFamily: mono, fontSize: 9, color: C.textMid }}>
            {r.purpose}
          </div>
          <div style={{ flex: 1, padding: '5px 8px', fontFamily: mono, fontSize: 9, color: C.textMid }}>
            {r.trained}
          </div>
        </div>
      ))}
    </div>
  );
}

function LossDisplay() {
  return (
    <div style={{ background: C.codeBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px' }}>
      {/* Total loss equation */}
      <div style={{ fontFamily: mono, fontSize: 10, lineHeight: 2 }}>
        <span style={{ color: C.math }}>L_total</span>
        <span style={{ color: C.textMuted }}> = </span>
        <span style={{ color: C.orange }}>L_GAN(G, D_Y, X, Y)</span>
        <br/>
        <span style={{ color: C.textMuted }}>{'         + '}</span>
        <span style={{ color: '#c4a35a' }}>L_GAN(F, D_X, Y, X)</span>
        <br/>
        <span style={{ color: C.textMuted }}>{'         + λ · '}</span>
        <span style={{ color: C.green }}>L_cyc(G, F)</span>
      </div>
      <Divider/>
      {/* Cycle loss expansion — split across two lines to avoid overflow in narrow column */}
      <div style={{ fontFamily: mono, fontSize: 9, color: C.math, lineHeight: 1.8 }}>
        <div>L_cyc = E_x[‖F(G(x)) − x‖₁]</div>
        <div style={{ paddingLeft: 14, color: C.math }}>+ E_y[‖G(F(y)) − y‖₁]</div>
      </div>
      <Divider/>
      {/* Per-term annotations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { term: 'L_GAN(G, D_Y)', note: 'G fools D_Y — realistic y\'s', col: C.orange },
          { term: 'L_GAN(F, D_X)', note: 'F fools D_X — realistic x\'s', col: '#c4a35a' },
          { term: 'L_cyc(G, F)',   note: 'cycle consistency — no mode drop', col: C.green },
        ].map(({ term, note, col }) => (
          <div key={term} style={{ fontFamily: sans, fontSize: 10, color: C.textMid }}>
            <span style={{ color: col, fontFamily: mono }}>{term}</span>: {note}
          </div>
        ))}
      </div>
      <Divider/>
      {/* Identity loss note */}
      <div style={{ fontFamily: sans, fontSize: 10, color: C.textMuted, lineHeight: 1.5 }}>
        <span style={{ color: C.textMid }}>Optional identity loss:</span>
        {' '}L_id = ‖G(y)−y‖₁ + ‖F(x)−x‖₁{' '}
        — preserves color/style when input already matches the target domain.
      </div>
    </div>
  );
}

function Callout() {
  const params = [
    { k: 'λ cycle',    v: '10'          },
    { k: 'LR',         v: '2e-4'        },
    { k: 'Optimizer',  v: 'Adam'        },
    { k: 'β₁ / β₂',   v: '0.5 / 0.999' },
  ];
  return (
    <div style={{ background: C.bg4, borderRadius: 6, padding: '12px 16px', marginTop: 12, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      {/* Comparison text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>
          Why CycleGAN is harder to train than pix2pix
        </div>
        <p style={{ fontFamily: sans, fontSize: 11, color: '#b8c4cc', lineHeight: 1.55, margin: 0 }}>
          CycleGAN trains 4 networks simultaneously:<br/>
          {'  '}• G, F: each ~7–11M params (ResNet-based)<br/>
          {'  '}• D_X, D_Y: each ~3M params (PatchGAN)<br/>
          {'  '}• Total: ~25–30M parameters<br/>
          <br/>
          pix2pix trains only 2 networks, but its U-Net-256 generator alone is
          ~54M params — pix2pix's total (~57M) is more than double CycleGAN's.
          CycleGAN's disadvantage isn't parameter count; it's balancing 4
          losses across 4 networks instead of 2 — more delicate to train, but
          it works on <em>unpaired</em> data.
        </p>
      </div>
      {/* Hyperparams */}
      <div style={{ flexShrink: 0, width: 148 }}>
        <SHead>Hyperparams</SHead>
        {params.map(({ k, v }) => <SRow key={k} label={k} val={v}/>)}
      </div>
    </div>
  );
}

export default function CycleGANArchitecture({ tryThis } = {}) {
  const [mode, setMode]           = useState('all');
  const [showCycle, setShowCycle] = useState(true);
  const [showDisc,  setShowDisc]  = useState(true);

  function handleMode(m) {
    setMode(m);
    if (m === 'cycleFwd' || m === 'cycleRev') setShowCycle(true);
    if (m === 'advGDy'   || m === 'advFDx')   setShowDisc(true);
  }

  return (
    <WidgetCard title="CycleGAN Architecture — two generators, two discriminators, four losses" number="19.9" tryThis={tryThis}>

      {/* ── Full-width diagram (616px → viewBox 580×460 scales to ~487px tall) ── */}
      <div style={{ background: C.codeBg, borderRadius: 6, padding: '6px 4px' }}>
        <DiagramSVG mode={mode} showCycle={showCycle} showDisc={showDisc}/>
      </div>

      {/* ── Controls row: tabs left, toggles right ── */}
      {/* Verified budget: ~380px tabs + 24px gaps + 104px toggle + 92px toggle + 16px spacer = 616px */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {LOSS_TABS.map(t => {
            const active = mode === t.id;
            const col = tabColor(t.id);
            const activeBg = col === C.accent  ? C.accentDim
                           : col === C.orange  ? 'rgba(251,146,60,0.12)'
                           :                     'rgba(52,211,153,0.12)';
            return (
              <button key={t.id} onClick={() => handleMode(t.id)} style={{
                fontFamily: mono, fontSize: 10, padding: '3px 9px',
                background: active ? activeBg : 'transparent',
                color:      active ? col : C.textMuted,
                border:    `1px solid ${active ? col : C.border}`,
                borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {t.label}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }}/>
        <Toggle label="Cycle arrows" on={showCycle} onChange={setShowCycle}/>
        <Toggle label="Disc. feeds"  on={showDisc}  onChange={setShowDisc}/>
      </div>

      {/* ── Two-column row: network table (42%) + loss formula (58%) ── */}
      {/* 616px − 12px gap = 604px; 42%×616 = 259px table, 345px formula */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 42%' }}>
          <NetworkTable/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <LossDisplay/>
        </div>
      </div>

      {/* ── Callout with inline hyperparams ── */}
      <Callout/>

    </WidgetCard>
  );
}
