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
};
const mono  = "'JetBrains Mono', monospace";
const sans  = "'Inter', sans-serif";
const serif = "'Crimson Pro', serif";

// ── Architecture block data ──────────────────────────────────────────────────
const ENC = [
  { id: 'E1', x: 40,  y: 20, w: 60, h: 40, label: '256' },
  { id: 'E2', x: 120, y: 20, w: 56, h: 36, label: '128' },
  { id: 'E3', x: 200, y: 20, w: 50, h: 32, label: '64'  },
  { id: 'E4', x: 270, y: 20, w: 44, h: 28, label: '32'  },
];
const BOTT = { x: 336, y: 20, w: 38, h: 24, label: '16' };
const DEC  = [
  { id: 'D4', x: 270, y: 155, w: 44, h: 28, label: '32'  },
  { id: 'D3', x: 200, y: 155, w: 50, h: 32, label: '64'  },
  { id: 'D2', x: 120, y: 155, w: 56, h: 36, label: '128' },
  { id: 'D1', x: 40,  y: 155, w: 60, h: 40, label: '256' },
];
const bcx = b => b.x + b.w / 2;
const bcy = b => b.y + b.h / 2;

// ── Patch size data ──────────────────────────────────────────────────────────
const PATCH_SIZES = [1, 16, 70, 256];
const PATCH_INFO = {
  1:   { label: '1×1',     outputN: 8, rfCells: 0.3, positions: '256×256',
         focus: 'Pixel-level color statistics',        result: 'Artifacts — low quality' },
  16:  { label: '16×16',   outputN: 8, rfCells: 1,   positions: '~16×16',
         focus: 'Small local texture patches',         result: 'Fine texture, less coherence' },
  70:  { label: '70×70',   outputN: 6, rfCells: 3,   positions: '30×30 (6×6 shown)',
         focus: 'Texture + structural context',        result: 'Best: sharp + coherent' },
  256: { label: '256×256', outputN: 1, rfCells: 8,   positions: '1×1 (global)',
         focus: 'Entire image (full image disc.)',     result: 'Tends to blur' },
};

// ── Seeded stable patch grids ────────────────────────────────────────────────
function srand(n) { const x = Math.sin(n + 1.6180339) * 10000; return x - Math.floor(x); }

const PATCH_GRIDS = {};
PATCH_SIZES.forEach(ps => {
  const n = PATCH_INFO[ps].outputN;
  PATCH_GRIDS[ps] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => srand(i * 17 + j * 31 + ps * 7) > 0.25 ? 'R' : 'F')
  );
});

// ── Quadrant-based cell color ────────────────────────────────────────────────
function cellColor(row, col, totalRows = 8, totalCols = 8) {
  const nx = (col + 0.5) / totalCols, ny = (row + 0.5) / totalRows;
  const tl = [45, 212, 191], tr = [251, 146, 60], bl = [167, 139, 250], br = [52, 211, 153];
  const r = tl[0]*(1-nx)*(1-ny) + tr[0]*nx*(1-ny) + bl[0]*(1-nx)*ny + br[0]*nx*ny;
  const g = tl[1]*(1-nx)*(1-ny) + tr[1]*nx*(1-ny) + bl[1]*(1-nx)*ny + br[1]*nx*ny;
  const b = tl[2]*(1-nx)*(1-ny) + tr[2]*nx*(1-ny) + bl[2]*(1-nx)*ny + br[2]*nx*ny;
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.75)`;
}

// Stripe colors for comparison panels (sampled from input grid mid-column)
const STRIPES = [0, 1, 3, 4, 6, 7].map(r => cellColor(r, 3));
const STRIPE_H = 13; // 6 stripes × 13px = 78px

// ── Shared UI components ─────────────────────────────────────────────────────
function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
      <span style={{ fontFamily: mono, fontSize: 9, color: C.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 9, color: color || C.textMid, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
function SHead({ children }) {
  return (
    <div style={{ fontFamily: mono, fontSize: 8, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, marginTop: 4 }}>
      {children}
    </div>
  );
}
function Divider() { return <div style={{ height: 1, background: C.border, margin: '6px 0' }} />; }

function Toggle({ label, on, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!on)} style={{
        width: 26, height: 13, borderRadius: 7,
        background: on ? C.accent : C.bg4,
        border: `1px solid ${on ? C.accent : C.border}`,
        position: 'relative', cursor: 'pointer', flexShrink: 0,
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

function ModePills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
      {[{ v: 'plain', label: 'Plain ED' }, { v: 'unet', label: 'U-Net' }].map((o, i) => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          fontFamily: mono, fontSize: 10, padding: '4px 10px',
          background: value === o.v ? C.accentDim : 'transparent',
          color: value === o.v ? C.accent : C.textMuted,
          border: 'none', borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function PatchPills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
      {PATCH_SIZES.map((ps, i) => (
        <button key={ps} onClick={() => onChange(ps)} style={{
          fontFamily: mono, fontSize: 10, padding: '4px 9px',
          background: value === ps ? C.accentDim : 'transparent',
          color: value === ps ? C.accent : C.textMuted,
          border: 'none', borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
        }}>
          {PATCH_INFO[ps].label}
        </button>
      ))}
    </div>
  );
}

// ── Generator Architecture SVG (with integrated comparison panels) ────────────
function GenArchSVG({ genMode, showSkips }) {
  const skipVis = genMode === 'unet' && showSkips;
  const VW = 555, VH = 225;
  const ELBOW_Y = 95;
  // Comparison panel geometry
  const SEP_X = 484;
  const PX = 489, PW = 62, PH = 78;
  const P1Y = 14, P2Y = 112; // panel 1 top, panel 2 top

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <marker id="p2g" viewBox="0 0 8 6" refX="7" refY="3" markerWidth="6" markerHeight="5" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#555"/>
        </marker>
        <marker id="p2t" viewBox="0 0 8 6" refX="7" refY="3" markerWidth="6" markerHeight="5" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill={C.accent}/>
        </marker>
        <filter id="p2sblur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2"/>
        </filter>
        <clipPath id="p2c1">
          <rect x={PX} y={P1Y} width={PW} height={PH}/>
        </clipPath>
        <clipPath id="p2c2">
          <rect x={PX} y={P2Y} width={PW} height={PH}/>
        </clipPath>
      </defs>

      {/* Row labels */}
      <text x={36} y={15} textAnchor="end" fontFamily={mono} fontSize={8} fill={C.textMuted}>enc</text>
      <text x={36} y={150} textAnchor="end" fontFamily={mono} fontSize={8} fill={C.textMuted}>dec</text>

      {/* Encoder blocks */}
      {ENC.map(b => (
        <g key={b.id}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3}
                fill={C.bg3} stroke={C.borderLt} strokeWidth={1.5}/>
          <text x={bcx(b)} y={bcy(b) + 3.5} textAnchor="middle"
                fontFamily={mono} fontSize={9} fill={C.textMid}>{b.label}</text>
        </g>
      ))}

      {/* Bottleneck */}
      <rect x={BOTT.x} y={BOTT.y} width={BOTT.w} height={BOTT.h} rx={3}
            fill="rgba(251,146,60,0.15)" stroke={C.orange} strokeWidth={2}/>
      <text x={bcx(BOTT)} y={bcy(BOTT) + 3.5} textAnchor="middle"
            fontFamily={mono} fontSize={9} fill={C.orange}>{BOTT.label}</text>
      <text x={bcx(BOTT)} y={BOTT.y - 4} textAnchor="middle"
            fontFamily={mono} fontSize={7.5} fill={C.orange} opacity={0.7}>bottleneck</text>

      {/* Decoder blocks */}
      {DEC.map(b => (
        <g key={b.id}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3}
                fill={C.bg3} stroke={C.borderLt} strokeWidth={1.5}/>
          <text x={bcx(b)} y={bcy(b) + 3.5} textAnchor="middle"
                fontFamily={mono} fontSize={9} fill={C.textMid}>{b.label}</text>
        </g>
      ))}

      {/* Encoder forward arrows */}
      {ENC.slice(0, -1).map((b, i) => {
        const nx = ENC[i + 1];
        return (
          <line key={`ea${i}`} x1={b.x + b.w} y1={bcy(b)} x2={nx.x} y2={bcy(nx)}
                stroke="#555" strokeWidth={1.5} markerEnd="url(#p2g)"/>
        );
      })}
      <line x1={ENC[3].x + ENC[3].w} y1={bcy(ENC[3])} x2={BOTT.x} y2={bcy(BOTT)}
            stroke="#555" strokeWidth={1.5} markerEnd="url(#p2g)"/>

      {/* B → D4 elbow */}
      <path
        d={`M ${bcx(BOTT)},${BOTT.y + BOTT.h} L ${bcx(BOTT)},${ELBOW_Y} L ${bcx(DEC[0])},${ELBOW_Y} L ${bcx(DEC[0])},${DEC[0].y}`}
        stroke="#555" strokeWidth={1.5} fill="none"
        markerEnd="url(#p2g)" strokeLinejoin="round"/>

      {/* Decoder forward arrows (right → left) */}
      {DEC.slice(0, -1).map((b, i) => {
        const nx = DEC[i + 1];
        return (
          <line key={`da${i}`}
                x1={b.x} y1={bcy(b)} x2={nx.x + nx.w} y2={bcy(nx)}
                stroke="#555" strokeWidth={1.5} markerEnd="url(#p2g)"/>
        );
      })}

      {/* Skip connections (E1↔D1 … E4↔D4) */}
      {ENC.map((enc, i) => {
        const dec = DEC[DEC.length - 1 - i];
        const sx = bcx(enc);
        const y1 = enc.y + enc.h, y2 = dec.y;
        const midY = (y1 + y2) / 2;
        return (
          <g key={`sk${i}`} style={{ opacity: skipVis ? 1 : 0, transition: 'opacity 0.2s' }}>
            <line x1={sx} y1={y1} x2={sx} y2={y2}
                  stroke={C.accent} strokeWidth={1.5} strokeDasharray="5 4"
                  markerEnd="url(#p2t)"/>
            {i === 0 && (
              <text x={sx + 4} y={midY + 3}
                    fontFamily={mono} fontSize={9} fill={C.accent}>skip connection</text>
            )}
          </g>
        );
      })}

      {/* Input arrow */}
      <line x1={12} y1={bcy(ENC[0])} x2={ENC[0].x} y2={bcy(ENC[0])}
            stroke="#666" strokeWidth={1.5} markerEnd="url(#p2g)"/>
      <text x={10} y={bcy(ENC[0]) - 6} textAnchor="middle"
            fontFamily={mono} fontSize={10} fill={C.textMid}>x</text>

      {/* Output arrow from D1 bottom */}
      {(() => {
        const d1 = DEC[3];
        const ox = bcx(d1), oy1 = d1.y + d1.h, oy2 = oy1 + 14;
        return (
          <>
            <line x1={ox} y1={oy1} x2={ox} y2={oy2}
                  stroke={C.accent} strokeWidth={1.5} markerEnd="url(#p2t)"/>
            <text x={ox} y={oy2 + 11} textAnchor="middle"
                  fontFamily={mono} fontSize={10} fill={C.accent}>G(x)</text>
          </>
        );
      })()}

      {/* Separator between arch and comparison */}
      <line x1={SEP_X} y1={8} x2={SEP_X} y2={VH - 8}
            stroke={C.border} strokeWidth={1} strokeDasharray="3 4"/>

      {/* Panel 1: plain ED — blurry stripes */}
      <g opacity={genMode === 'plain' ? 1 : 0.42}>
        <rect x={PX} y={P1Y} width={PW} height={PH} rx={3} fill={C.bg3}/>
        <g clipPath="url(#p2c1)">
          <g filter="url(#p2sblur)">
            {STRIPES.map((clr, i) => (
              <rect key={i} x={PX} y={P1Y + i * STRIPE_H} width={PW} height={STRIPE_H} fill={clr}/>
            ))}
          </g>
        </g>
        <rect x={PX} y={P1Y} width={PW} height={PH} rx={3} fill="none"
              stroke={genMode === 'plain' ? C.accent : C.borderLt}
              strokeWidth={genMode === 'plain' ? 1.5 : 1}/>
      </g>
      <text x={PX + PW / 2} y={P1Y + PH + 11} textAnchor="middle"
            fontFamily={mono} fontSize={8}
            fill={genMode === 'plain' ? C.accent : C.textMuted}>plain ED</text>

      {/* Panel 2: U-Net — sharp stripes */}
      <g opacity={genMode === 'unet' ? 1 : 0.42}>
        <rect x={PX} y={P2Y} width={PW} height={PH} rx={3} fill={C.bg3}/>
        <g clipPath="url(#p2c2)">
          {STRIPES.map((clr, i) => (
            <rect key={i} x={PX} y={P2Y + i * STRIPE_H} width={PW} height={STRIPE_H} fill={clr}/>
          ))}
        </g>
        <rect x={PX} y={P2Y} width={PW} height={PH} rx={3} fill="none"
              stroke={genMode === 'unet' ? C.accent : C.borderLt}
              strokeWidth={genMode === 'unet' ? 1.5 : 1}/>
      </g>
      <text x={PX + PW / 2} y={P2Y + PH + 11} textAnchor="middle"
            fontFamily={mono} fontSize={8}
            fill={genMode === 'unet' ? C.accent : C.textMuted}>U-Net</text>
    </svg>
  );
}

// ── Combined PatchGAN SVG (input grid + discriminator output) ─────────────────
function PatchGanSVG({ patchSize }) {
  const GRID_X = 12, GRID_Y = 20, CELL = 20, N = 8;
  const SEP_X = 185;
  const RX = 192, RW = 238; // right panel: x=192, width=238 (total VW=430)
  const VW = 430, VH = 205;

  const info = PATCH_INFO[patchSize];
  const grid = PATCH_GRIDS[patchSize];
  const n    = info.outputN;

  // RF overlay bounds (centered in grid)
  const rfCells = info.rfCells;
  const rfStart = Math.max(0, Math.floor((N - rfCells) / 2));
  const rfEnd   = Math.min(N, rfStart + Math.ceil(rfCells));
  const rfX     = GRID_X + rfStart * CELL;
  const rfY     = GRID_Y + rfStart * CELL;
  const rfW     = (rfEnd - rfStart) * CELL;
  const isTiny  = patchSize === 1;
  const tinyX   = GRID_X + (N / 2) * CELL - 2;
  const tinyY   = GRID_Y + (N / 2) * CELL - 2;

  // Output cell sizing: bounded by available height and panel width
  const availH   = VH - GRID_Y - 22; // 163px usable
  const cellSize = n === 1 ? 80 : Math.min(Math.floor(availH / n), Math.floor((RW - 16) / n));
  const gridW    = n * cellSize;
  const gridX    = RX + Math.floor((RW - gridW) / 2);
  const labelSize = n === 1 ? 24 : 11;

  const realColor = 'rgba(45,212,191,0.35)';
  const fakeColor = 'rgba(248,113,113,0.35)';

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
      {/* Left panel title */}
      <text x={GRID_X + (N * CELL) / 2} y={13} textAnchor="middle"
            fontFamily={mono} fontSize={9} fill={C.textMuted}>input patches</text>

      {/* Input grid cells */}
      {Array.from({ length: N }, (_, row) =>
        Array.from({ length: N }, (_, col) => (
          <rect key={`${row}-${col}`}
                x={GRID_X + col * CELL} y={GRID_Y + row * CELL}
                width={CELL - 1} height={CELL - 1} rx={1}
                fill={cellColor(row, col)}/>
        ))
      )}

      {/* RF overlay */}
      {isTiny ? (
        <>
          <rect x={tinyX} y={tinyY} width={4} height={4} rx={1}
                fill="none" stroke={C.accent} strokeWidth={2}/>
          <text x={tinyX + 6} y={tinyY + 3}
                fontFamily={mono} fontSize={8} fill={C.accent}>1×1 RF</text>
        </>
      ) : (
        <>
          <rect x={rfX} y={rfY} width={rfW} height={rfW} rx={2}
                fill="rgba(45,212,191,0.08)" stroke={C.accent} strokeWidth={2}/>
          <text
            x={patchSize === 256 ? GRID_X + (N * CELL) / 2 : rfX + rfW + 4}
            y={patchSize === 256 ? GRID_Y + (N * CELL) / 2 + 4 : rfY + 10}
            textAnchor={patchSize === 256 ? 'middle' : 'start'}
            fontFamily={mono} fontSize={8.5} fill={C.accent}>
            {info.label} RF
          </text>
        </>
      )}

      {/* Input grid border */}
      <rect x={GRID_X} y={GRID_Y} width={N * CELL} height={N * CELL}
            fill="none" stroke={C.border} strokeWidth={1}/>

      {/* Separator */}
      <line x1={SEP_X} y1={8} x2={SEP_X} y2={VH - 8}
            stroke={C.border} strokeWidth={1}/>

      {/* Right panel title */}
      <text x={RX + RW / 2} y={13} textAnchor="middle"
            fontFamily={mono} fontSize={9} fill={C.textMuted}>disc. output</text>

      {/* Output cells */}
      {grid.map((row, ri) =>
        row.map((cls, ci) => {
          const cx = gridX + ci * cellSize;
          const cy = GRID_Y + ri * cellSize;
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={cx} y={cy} width={cellSize - 1} height={cellSize - 1} rx={2}
                    fill={cls === 'R' ? realColor : fakeColor}/>
              <text x={cx + cellSize / 2 - 0.5} y={cy + cellSize / 2 + labelSize * 0.38}
                    textAnchor="middle" fontFamily={mono} fontSize={labelSize}
                    fill="white" opacity={0.9}>{cls}</text>
            </g>
          );
        })
      )}

      {/* Output grid border */}
      <rect x={gridX} y={GRID_Y} width={gridW} height={n * cellSize}
            fill="none" stroke={C.border} strokeWidth={1}/>

      {/* Bottom annotations */}
      <text x={GRID_X + (N * CELL) / 2} y={VH - 11} textAnchor="middle"
            fontFamily={mono} fontSize={8} fill={C.textMuted}>256×256 overlapping patches</text>
      <text x={RX + RW / 2} y={VH - 18} textAnchor="middle"
            fontFamily={mono} fontSize={8.5} fill={C.textMid}>Average → final loss</text>
      <text x={RX + RW / 2} y={VH - 6} textAnchor="middle"
            fontFamily={mono} fontSize={8} fill={C.textMuted}>per-patch: real / fake</text>
    </svg>
  );
}

// ── Stats panel (horizontal strip below main content) ────────────────────────
function StatsPanel({ genMode, showSkips, patchSize }) {
  const info = PATCH_INFO[patchSize];
  const VDiv = () => (
    <div style={{ width: 1, background: C.border, alignSelf: 'stretch', flexShrink: 0 }}/>
  );
  return (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '10px 16px', marginTop: 12,
    }}>
      {/* Top row: Generator | PatchGAN | Why patches? */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 108 }}>
          <SHead>Generator</SHead>
          <StatRow label="Arch."   value={genMode === 'unet' ? 'U-Net' : 'Plain ED'} color={C.accent}/>
          <StatRow label="Skips"   value={genMode === 'unet' && showSkips ? 'on' : 'off'}
                   color={genMode === 'unet' && showSkips ? C.green : C.textMuted}/>
          <StatRow label="Enc."    value="4 down-blocks"/>
          <StatRow label="Bott."   value="16×16 spatial" color={C.orange}/>
          <StatRow label="Dec."    value="4 up-blocks"/>
        </div>

        <VDiv/>

        <div style={{ minWidth: 108 }}>
          <SHead>PatchGAN</SHead>
          <StatRow label="Patch"   value={info.label}     color={C.accent}/>
          <StatRow label="Outputs" value={info.positions}/>
          <StatRow label="Focus"   value={
            patchSize === 1   ? 'pixel stats' :
            patchSize === 16  ? 'small texture' :
            patchSize === 70  ? 'tex + struct' : 'global'}/>
        </div>

        <VDiv/>

        <div style={{ flex: 1, minWidth: 128 }}>
          <SHead>Why patches?</SHead>
          {[
            '• Focuses high-freq texture',
            '• L1 already covers low freq',
            '• Fewer params, faster train',
            '• Complements L1 loss',
          ].map(t => (
            <div key={t} style={{ fontFamily: mono, fontSize: 8.5, color: C.textMid, marginBottom: 2 }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, margin: '8px 0' }}/>

      {/* Bottom row: Loss */}
      <div>
        <SHead>Loss</SHead>
        <div style={{
          background: C.bg4, borderRadius: 4, padding: '6px 10px',
          fontFamily: mono, fontSize: 9, color: C.math, lineHeight: 1.7,
          display: 'inline-block',
        }}>
          <span>L = L_cGAN + λ·L_L1</span>
          <span style={{ color: C.textMuted, fontSize: 8, marginLeft: 16 }}>λ = 100</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Pix2pixArchitecture({ tryThis } = {}) {
  const [genMode,   setGenMode]   = useState('unet');
  const [patchSize, setPatchSize] = useState(70);
  const [showSkips, setShowSkips] = useState(true);

  const info = PATCH_INFO[patchSize];

  return (
    <WidgetCard title="pix2pix Architecture — U-Net + PatchGAN" number="19.6" tryThis={tryThis}>
        {/* ── Main content ── */}
        <div>

          {/* ── SECTION 1: U-Net Generator ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontFamily: serif, fontSize: 15, color: C.text, lineHeight: 1 }}>
              U-Net Generator
            </div>
            <ModePills value={genMode} onChange={setGenMode}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: sans, fontSize: 10, color: C.textMid }}>
              Encoder–bottleneck–decoder with skip connections
            </div>
            {genMode === 'unet' ? (
              <Toggle label="Show skips" on={showSkips} onChange={setShowSkips}/>
            ) : (
              <span style={{ fontFamily: mono, fontSize: 10, color: C.textMuted }}>No skips</span>
            )}
          </div>

          <div style={{ background: '#0a0a0a', borderRadius: 6, padding: '4px 0' }}>
            <GenArchSVG genMode={genMode} showSkips={showSkips}/>
          </div>

          <div style={{ height: 1, background: C.border, margin: '14px 0' }}/>

          {/* ── SECTION 2: PatchGAN Discriminator ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontFamily: serif, fontSize: 15, color: C.text, lineHeight: 1 }}>
              PatchGAN Discriminator
            </div>
            <PatchPills value={patchSize} onChange={setPatchSize}/>
          </div>
          <div style={{ fontFamily: sans, fontSize: 10, color: C.textMid, marginBottom: 8 }}>
            Classifies N×N patches independently, then averages
          </div>

          <div style={{ background: '#0a0a0a', borderRadius: 6, padding: '4px 0' }}>
            <PatchGanSVG patchSize={patchSize}/>
          </div>

          <div style={{
            fontFamily: sans, fontSize: 10, color: C.textMid, marginTop: 6,
            background: C.bg4, borderRadius: 4, padding: '6px 10px',
            display: 'flex', gap: 10, flexWrap: 'wrap',
          }}>
            <span><span style={{ color: C.textMuted }}>Focus: </span>{info.focus}</span>
            <span style={{ color: C.border }}>|</span>
            <span><span style={{ color: C.textMuted }}>Output: </span>{info.positions}</span>
            <span style={{ color: C.border }}>|</span>
            <span style={{ color: patchSize === 70 ? C.green : C.textMid }}>{info.result}</span>
          </div>

        </div>

        {/* ── Stats panel (below) ── */}
        <StatsPanel genMode={genMode} showSkips={showSkips} patchSize={patchSize}/>
    </WidgetCard>
  );
}
