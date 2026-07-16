import { useState, useRef, useEffect, memo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";

const ROWS = 12;
const COLS = 16;
const CELL = 16;
const TOTAL = ROWS * COLS; // 192

const SEMANTIC_CLASSES = [
  { id: 'sky',      name: 'Sky',      paintColor: '#5fa8d3', renderColor: '#7bc4e8' },
  { id: 'tree',     name: 'Tree',     paintColor: '#3a8c3a', renderColor: '#4d9a4d' },
  { id: 'water',    name: 'Water',    paintColor: '#2d6da3', renderColor: '#3a82c0' },
  { id: 'sand',     name: 'Sand',     paintColor: '#d4b677', renderColor: '#e0c693' },
  { id: 'grass',    name: 'Grass',    paintColor: '#7cb342', renderColor: '#8bc051' },
  { id: 'building', name: 'Building', paintColor: '#888888', renderColor: '#9c9c9c' },
  { id: 'road',     name: 'Road',     paintColor: '#3a3a3a', renderColor: '#454545' },
  { id: 'mountain', name: 'Mountain', paintColor: '#6b5b73', renderColor: '#7a6b82' },
];

const CLASS_BY_ID = Object.fromEntries(SEMANTIC_CLASSES.map(c => [c.id, c]));

// ── Grid utilities ────────────────────────────────────────────────────────────

function createEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill('none'));
}

function cHash(r, c, s = 0) {
  return (((r * 37 + c * 17 + s * 97) * 2654435761) >>> 0) / 4294967296;
}

// ── Preset generators ─────────────────────────────────────────────────────────

function makeBeach() {
  const g = createEmptyGrid();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r < 4) g[r][c] = 'sky';
      else if (r < 7) g[r][c] = 'water';
      else g[r][c] = 'sand';
    }
    if (r >= 3 && r < 10) {
      g[r][0] = 'tree';
      if (r >= 4 && r < 9) g[r][1] = 'tree';
    }
  }
  return g;
}

function makeMountain() {
  const g = createEmptyGrid();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r < 5) g[r][c] = 'sky';
      else if (r < 8) g[r][c] = 'mountain';
      else if (r < 10) g[r][c] = 'grass';
      else g[r][c] = 'road';
    }
  }
  return g;
}

function makeCity() {
  const g = createEmptyGrid();
  const heights = [5, 3, 6, 4, 5, 6, 3, 5, 4, 6, 5, 3, 6, 4, 5, 4];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (r >= 8) g[r][c] = 'road';
      else if (r >= 8 - heights[c]) g[r][c] = 'building';
      else g[r][c] = 'sky';
    }
  }
  return g;
}

function makeForest() {
  const g = createEmptyGrid();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r < 3) {
        g[r][c] = (c >= 3 && c <= 12) ? 'sky' : 'tree';
      } else if (r >= 10) {
        g[r][c] = (c < 4 || c >= 12) ? 'grass' : 'road';
      } else {
        const roadC = Math.round(7.5 + Math.sin((r - 2.5) * 0.85) * 2.5);
        g[r][c] = (c >= roadC - 1 && c <= roadC + 1) ? 'road' : 'tree';
      }
    }
  }
  return g;
}

const PRESET_MAP = {
  beach: makeBeach,
  mountain: makeMountain,
  city: makeCity,
  forest: makeForest,
};

// Pre-computed grids for mechanism comparison
const BEACH_CLEAN = makeBeach();
const BEACH_DEGRADED = (() => {
  const g = BEACH_CLEAN.map(r => [...r]);
  for (let c = 5; c < 11; c++) g[3][c] = 'water';
  for (let c = 8; c < 14; c++) g[6][c] = 'sky';
  for (let c = 7; c < 12; c++) g[8][c] = 'tree';
  for (let c = 13; c < 16; c++) { g[4][c] = 'sand'; g[5][c] = 'sand'; }
  return g;
})();

// ── Cell texture component ────────────────────────────────────────────────────

const CellTexture = memo(function CellTexture({ cls, x, y, r, c }) {
  const h1 = cHash(r, c, 0);
  const h2 = cHash(r, c, 1);
  const h3 = cHash(r, c, 2);
  const S = CELL;

  switch (cls) {
    case 'sky': {
      const b = Math.round(h1 * 25);
      return <rect x={x} y={y} width={S} height={S} fill={`rgb(${95+b},${168+b},${211+b})`} />;
    }
    case 'tree':
      return (
        <g>
          <rect x={x} y={y} width={S} height={S} fill="#4d9a4d" />
          <circle cx={x+3+h1*6} cy={y+3+h2*6} r={2.5+h3} fill="#2a6b2a" />
          <circle cx={x+S-4} cy={y+S-4} r={1.5+h1} fill="#367a36" />
        </g>
      );
    case 'water':
      return (
        <g>
          <rect x={x} y={y} width={S} height={S} fill="#3a82c0" />
          <line x1={x} y1={y+Math.round(h1*3)+4} x2={x+S} y2={y+Math.round(h1*3)+4}
                stroke="#5aa8d8" strokeWidth="1.5" opacity="0.65" />
          <line x1={x} y1={y+Math.round(h2*3)+10} x2={x+S} y2={y+Math.round(h2*3)+10}
                stroke="#5aa8d8" strokeWidth="0.8" opacity="0.4" />
        </g>
      );
    case 'sand':
      return (
        <g>
          <rect x={x} y={y} width={S} height={S} fill="#e0c693" />
          <circle cx={x+1+h1*10} cy={y+1+h2*10} r={0.8} fill="#b89a5e" />
          <circle cx={x+5+h3*7} cy={y+7+h1*5} r={0.6} fill="#c4a870" />
          <circle cx={x+9+h2*5} cy={y+3+h3*8} r={0.7} fill="#b89a5e" />
        </g>
      );
    case 'grass':
      return (
        <g>
          <rect x={x} y={y} width={S} height={S} fill="#8bc051" />
          {[1, 4, 7, 11, 14].map((px, i) => {
            const jit = cHash(r, c, i+5) * 2;
            const ht = 4 + cHash(r, c, i+10) * 4;
            return <line key={i} x1={x+px+jit} y1={y+S} x2={x+px+jit-1} y2={y+S-ht}
                         stroke="#5a8a28" strokeWidth="1.2" />;
          })}
        </g>
      );
    case 'building':
      return (
        <g>
          <rect x={x} y={y} width={S} height={S} fill="#9c9c9c" />
          <line x1={x+5} y1={y} x2={x+5} y2={y+S} stroke="#6a6a6a" strokeWidth="0.8" />
          <line x1={x+11} y1={y} x2={x+11} y2={y+S} stroke="#6a6a6a" strokeWidth="0.8" />
          <rect x={x+2} y={y+2} width={3} height={3} fill={h1>0.45?'#6a8ab5':'#666'} opacity="0.9" />
          <rect x={x+8} y={y+8} width={3} height={3} fill={h2>0.45?'#6a8ab5':'#666'} opacity="0.9" />
        </g>
      );
    case 'road':
      return <rect x={x} y={y} width={S} height={S} fill="#454545" />;
    case 'mountain': {
      const shade = Math.round(h1 * 20);
      return (
        <g>
          <rect x={x} y={y} width={S} height={S} fill={`rgb(${100+shade},${90+shade},${108+shade})`} />
          <polygon points={`${x},${y+S} ${x+S/2},${y+Math.round(h2*8)} ${x+S},${y+S}`}
                   fill="rgba(150,140,160,0.35)" />
        </g>
      );
    }
    default:
      return <rect x={x} y={y} width={S} height={S} fill="#0a0a0a" />;
  }
});

// ── Grid line overlay ─────────────────────────────────────────────────────────

function GridLines() {
  return (
    <>
      {Array.from({ length: ROWS + 1 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i*CELL} x2={COLS*CELL} y2={i*CELL}
              stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" />
      ))}
      {Array.from({ length: COLS + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i*CELL} y1={0} x2={i*CELL} y2={ROWS*CELL}
              stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" />
      ))}
    </>
  );
}

// ── Mechanism diagram components ──────────────────────────────────────────────

function Arr({ x1, y1, x2, y2, col = '#555' }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 0.5) return null;
  const ux = dx/len, uy = dy/len;
  const ah = 8, aw = 4;
  const px = -uy, py = ux;
  const bx = x2 - ux*ah, by = y2 - uy*ah;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={col} strokeWidth="1.5" />
      <polygon points={`${x2},${y2} ${bx+px*aw},${by+py*aw} ${bx-px*aw},${by-py*aw}`} fill={col} />
    </g>
  );
}

function FlowBox({ x, y, w, h, label, sub, accent = false }) {
  const ac = '#2dd4bf';
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3}
            fill={accent ? 'rgba(45,212,191,0.1)' : '#1a1a1a'}
            stroke={accent ? ac : '#333'}
            strokeWidth={accent ? 1.5 : 1} />
      <text x={x+w/2} y={y+h/2+(sub?-4:5)} textAnchor="middle"
            fontFamily={mono} fontSize="9.5"
            fill={accent ? ac : '#e8eaed'} fontWeight={accent ? '600' : '400'}>
        {label}
      </text>
      {sub && (
        <text x={x+w/2} y={y+h/2+8} textAnchor="middle"
              fontFamily={mono} fontSize="7.5"
              fill={accent ? 'rgba(45,212,191,0.65)' : '#666'}>
          {sub}
        </text>
      )}
    </g>
  );
}

function MechanismDiagram({ showSPADEPath }) {
  // Layout: viewBox 560×290, renders into flex:1 container (~424px after 180px stats+gap)
  // Internal coordinates use 560 units so box labels have comfortable breathing room
  const VW = 560, VH = 300;
  const ac = '#2dd4bf';

  // Box widths — proportionally wider than the 424px version
  const BW_F = 90, BW_BN = 90, BW_OP = 130, BW_OUT = 68;
  const ARR = 34, BH = 40;

  // Standard BN x positions
  const s1x = 8, s2x = s1x+BW_F+ARR, s3x = s2x+BW_BN+ARR, s4x = s3x+BW_OP+ARR;
  // s4x + BW_OUT = 8+90+34+90+34+130+34+68 = 488 < 560 ✓

  // y positions — VH=300 gives comfortable spacing at BH=40
  const SBN_TY = 16, SBN_BY = 32;
  const SP_TY = 160, SP_BY = 176;
  // MASK_BY leaves 20px between feature row bottom and mask row top (for the vertical arrow)
  const MASK_BY = SP_BY + BH + 20;

  // γ,β param box center x
  const paramCX = s3x + BW_OP/2;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block', minWidth: VW }}>
      <rect width={VW} height={VH} fill="#111" rx="6" />

      {/* ── Standard BN ──────────────────────────────────────── */}
      <text x={VW/2} y={SBN_TY} textAnchor="middle" fontFamily={mono}
            fontSize="10" fill="#888" fontWeight="600">
        Standard Batch Normalization
      </text>

      <FlowBox x={s1x} y={SBN_BY} w={BW_F} h={BH} label="Feature F" sub="input" />
      <Arr x1={s1x+BW_F} y1={SBN_BY+BH/2} x2={s2x} y2={SBN_BY+BH/2} />
      <FlowBox x={s2x} y={SBN_BY} w={BW_BN} h={BH} label="BatchNorm" sub="μ, σ" />
      <Arr x1={s2x+BW_BN} y1={SBN_BY+BH/2} x2={s3x} y2={SBN_BY+BH/2} />
      <FlowBox x={s3x} y={SBN_BY} w={BW_OP} h={BH} label="× γ + β" sub="affine" />
      <Arr x1={s3x+BW_OP} y1={SBN_BY+BH/2} x2={s4x} y2={SBN_BY+BH/2} />
      <FlowBox x={s4x} y={SBN_BY} w={BW_OUT} h={BH} label="Output" />

      {/* γ, β fixed param annotation */}
      <Arr x1={paramCX} y1={SBN_BY+BH} x2={paramCX} y2={SBN_BY+BH+20} col="#444" />
      <FlowBox x={paramCX-52} y={SBN_BY+BH+20} w={104} h={22} label="γ, β: fixed params" />

      <text x={VW/2} y={SBN_BY+BH+55} textAnchor="middle" fontFamily={mono}
            fontSize="8" fill="#505050" fontStyle="italic">
        normalization erases semantic info in deep layers
      </text>

      {/* Separator */}
      <line x1={20} y1={SP_TY-6} x2={VW-20} y2={SP_TY-6} stroke="#242424" strokeWidth="1" />

      {/* ── SPADE ─────────────────────────────────────────────── */}
      <text x={VW/2} y={SP_TY} textAnchor="middle" fontFamily={mono} fontSize="10"
            fill={showSPADEPath ? ac : '#888'} fontWeight="600">
        SPADE — Spatially-Adaptive Denormalization
      </text>

      {/* Feature flow */}
      <FlowBox x={s1x} y={SP_BY} w={BW_F} h={BH} label="Feature F" sub="input" />
      <Arr x1={s1x+BW_F} y1={SP_BY+BH/2} x2={s2x} y2={SP_BY+BH/2} />
      <FlowBox x={s2x} y={SP_BY} w={BW_BN} h={BH} label="BatchNorm" sub="μ, σ" />
      <Arr x1={s2x+BW_BN} y1={SP_BY+BH/2} x2={s3x} y2={SP_BY+BH/2} />
      <FlowBox x={s3x} y={SP_BY} w={BW_OP} h={BH} label="×γ(M) + β(M)" sub="spatial affine"
               accent={showSPADEPath} />
      <Arr x1={s3x+BW_OP} y1={SP_BY+BH/2} x2={s4x} y2={SP_BY+BH/2} />
      <FlowBox x={s4x} y={SP_BY} w={BW_OUT} h={BH} label="Output" />

      {/* Mask pathway — always rendered, dimmed when toggle is off */}
      <g opacity={showSPADEPath ? 1 : 0.18}>
        {/* Vertical arrow: mask output → operation box */}
        <Arr x1={s3x+BW_OP/2} y1={MASK_BY} x2={s3x+BW_OP/2} y2={SP_BY+BH} col={ac} />

        <FlowBox x={s1x} y={MASK_BY} w={BW_F} h={BH} label="Mask M" sub="semantic" accent />
        <Arr x1={s1x+BW_F} y1={MASK_BY+BH/2} x2={s2x} y2={MASK_BY+BH/2} col={ac} />
        <FlowBox x={s2x} y={MASK_BY} w={BW_BN} h={BH} label="ConvNet" accent />
        <Arr x1={s2x+BW_BN} y1={MASK_BY+BH/2} x2={s3x} y2={MASK_BY+BH/2} col={ac} />
        <FlowBox x={s3x} y={MASK_BY} w={BW_OP} h={BH} label="γ(M), β(M)" sub="spatial maps" accent />
      </g>

      <text x={VW/2} y={VH-8} textAnchor="middle" fontFamily={mono} fontSize="8"
            fill={showSPADEPath ? 'rgba(45,212,191,0.6)' : '#444'} fontStyle="italic">
        {showSPADEPath
          ? 'mask M re-injected at every layer via γ(M), β(M)'
          : 'toggle SPADE pathway to see the mask injection'}
      </text>
    </svg>
  );
}

// ── Stat helpers ──────────────────────────────────────────────────────────────

function StatRow({ label, val, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: '5px', gap: '6px' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: mono, flexShrink: 0 }}>
        {label}:
      </span>
      <span style={{ color: color || 'var(--text)', fontSize: '11px', fontFamily: mono,
                     textAlign: 'right' }}>
        {val}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SPADESynthesis({ tryThis } = {}) {
  const [viewMode, setViewMode]       = useState('paint');
  const [grid, setGrid]               = useState(makeBeach);
  const [activeClass, setActiveClass] = useState('sky');
  const [brushSize, setBrushSize]     = useState(1);
  const [presetName, setPresetName]   = useState('beach');
  const [showSPADEPath, setShowSPADEPath] = useState(true);

  const svgInputRef  = useRef(null);
  const isPaintRef   = useRef(false);
  const isEraseRef   = useRef(false);
  const activePointerIdRef = useRef(null);
  const lastCellRef = useRef(null);

  // Computed stats
  const allCells = grid.flat();
  const totalPainted = allCells.filter(c => c !== 'none').length;
  const classCounts = Object.fromEntries(SEMANTIC_CLASSES.map(c => [c.id, 0]));
  allCells.forEach(c => { if (c in classCounts) classCounts[c]++; });
  const classesUsed = Object.values(classCounts).filter(v => v > 0).length;
  const topClass = SEMANTIC_CLASSES.reduce(
    (best, cls) => classCounts[cls.id] > (best ? classCounts[best.id] : -1) ? cls : best, null
  );
  const topCoverage = topClass && totalPainted > 0
    ? `${Math.round(classCounts[topClass.id] / TOTAL * 100)}%` : '—';
  const activeName = activeClass === 'none' ? 'Eraser' : (CLASS_BY_ID[activeClass]?.name ?? '—');

  // Painting
  function getCellFromEvent(e) {
    const svg = svgInputRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    if (!rect.width || !rect.height || !viewBox.width || !viewBox.height) return null;
    // Convert viewport pixels back into the fixed SVG coordinate system before
    // selecting a cell, so touch painting remains accurate after mobile scaling.
    const x = viewBox.x + (e.clientX - rect.left) * (viewBox.width / rect.width);
    const y = viewBox.y + (e.clientY - rect.top) * (viewBox.height / rect.height);
    const col = Math.floor(x / CELL);
    const row = Math.floor(y / CELL);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return { row, col };
  }

  function applyBrush(row, col, cls) {
    setGrid(g => {
      const ng = g.map(r => [...r]);
      const half = Math.floor(brushSize / 2);
      for (let dr = -half; dr <= half; dr++)
        for (let dc = -half; dc <= half; dc++) {
          const nr = row + dr, nc = col + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) ng[nr][nc] = cls;
        }
      return ng;
    });
  }

  function paintToCell(cell) {
    const cls = isEraseRef.current ? 'none' : activeClass;
    const previous = lastCellRef.current;
    if (previous) {
      // Fill between coalesced pointer events so a quick finger drag does not
      // leave unpainted gaps in the semantic map.
      const steps = Math.max(Math.abs(cell.row - previous.row), Math.abs(cell.col - previous.col));
      for (let step = 1; step <= steps; step++) {
        const progress = step / steps;
        applyBrush(
          Math.round(previous.row + (cell.row - previous.row) * progress),
          Math.round(previous.col + (cell.col - previous.col) * progress),
          cls
        );
      }
    } else {
      applyBrush(cell.row, cell.col, cls);
    }
    lastCellRef.current = cell;
  }

  function handlePointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    isPaintRef.current = true;
    isEraseRef.current = e.button === 2;
    activePointerIdRef.current = e.pointerId;
    lastCellRef.current = null;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const cell = getCellFromEvent(e);
    if (cell) paintToCell(cell);
  }

  function handlePointerMove(e) {
    if (!isPaintRef.current || activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (cell) paintToCell(cell);
  }

  function handlePointerEnd(e) {
    if (activePointerIdRef.current !== e.pointerId) return;
    isPaintRef.current = false;
    isEraseRef.current = false;
    activePointerIdRef.current = null;
    lastCellRef.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function handleContextMenu(e) {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (cell) applyBrush(cell.row, cell.col, 'none');
  }

  function applyPreset(name) {
    setPresetName(name);
    if (name === 'clear') setGrid(createEmptyGrid());
    else if (PRESET_MAP[name]) setGrid(PRESET_MAP[name]());
  }

  // ── Shared styles ──────────────────────────────────────────────────────────

  const panelTitle = {
    fontFamily: mono, fontSize: '9.5px', fontWeight: 600,
    color: 'var(--accent)', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: '6px', textAlign: 'center',
  };

  function tabBtn(active) {
    return {
      fontFamily: mono, fontSize: '10px', padding: '5px 10px',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: '4px', cursor: 'pointer',
      background: active ? 'var(--accent-dim)' : 'var(--bg4)',
      color: active ? 'var(--accent)' : 'var(--text-mid)',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.12s',
    };
  }

  const PRESET_TABS = ['beach', 'mountain', 'city', 'forest', 'clear'];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <WidgetCard
      title="SPADE — semantic synthesis via spatially-adaptive normalization"
      number="19.10"
      tryThis={tryThis}
    >
      {/* View toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[['paint', 'Paint Mode'], ['mechanism', 'Mechanism Mode']].map(([m, label]) => (
          <button key={m} onClick={() => setViewMode(m)} style={tabBtn(viewMode === m)}>
            {label}
          </button>
        ))}
      </div>

      {viewMode === 'paint' ? (

        /* ── PAINT MODE ─────────────────────────────────────────────────────── */
        <div>
          {/* Preset tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {PRESET_TABS.map(name => (
              <button key={name} onClick={() => applyPreset(name)} style={tabBtn(presetName === name)}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </button>
            ))}
            <button onClick={() => setPresetName('custom')} style={tabBtn(presetName === 'custom')}>
              Custom
            </button>
          </div>

          {/* Canvases — full usable width, stats strip below */}
          <div data-mobile-stack style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

            {/* Input: semantic map */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={panelTitle}>Semantic map (your input)</div>
              <svg
                ref={svgInputRef}
                viewBox={`0 0 ${COLS*CELL} ${ROWS*CELL}`}
                width="100%"
                style={{
                  display: 'block', background: '#0a0a0a', borderRadius: '4px',
                  cursor: activeClass === 'none' ? 'cell' : 'crosshair',
                  userSelect: 'none', touchAction: 'none',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                 onLostPointerCapture={handlePointerEnd}
                onContextMenu={handleContextMenu}
              >
                {grid.flatMap((rowArr, r) => rowArr.map((cls, c) => (
                  <rect key={`i-${r}-${c}`}
                        x={c*CELL} y={r*CELL} width={CELL} height={CELL}
                        fill={cls !== 'none' ? CLASS_BY_ID[cls].paintColor : '#0a0a0a'} />
                )))}
                <GridLines />
              </svg>
            </div>

            {/* Output: synthesized scene */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={panelTitle}>Synthesized scene G(M)</div>
              <svg
                viewBox={`0 0 ${COLS*CELL} ${ROWS*CELL}`}
                width="100%"
                style={{ display: 'block', borderRadius: '4px' }}
              >
                {grid.flatMap((rowArr, r) => rowArr.map((cls, c) => (
                  <CellTexture key={`o-${r}-${c}`} cls={cls} x={c*CELL} y={r*CELL} r={r} c={c} />
                )))}
              </svg>
            </div>

          </div>

          {/* Palette — 8 × flex:1 buttons fill the full canvas width */}
          <div data-mobile-palette style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
            {SEMANTIC_CLASSES.map(cls => (
              <button
                key={cls.id}
                onClick={() => setActiveClass(cls.id)}
                style={{
                  flex: 1, height: '54px', padding: '4px 2px',
                  border: `${activeClass === cls.id ? 2 : 1}px solid ${activeClass === cls.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '4px',
                  background: activeClass === cls.id ? 'var(--accent-dim)' : 'var(--bg4)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '3px',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{
                  width: '28px', height: '22px',
                  background: cls.paintColor, borderRadius: '2px', flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: mono, fontSize: '8px', lineHeight: 1,
                  color: activeClass === cls.id ? 'var(--accent)' : 'var(--text-mid)',
                }}>
                  {cls.name}
                </span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
              Brush:
            </span>
            {[1, 2, 4].map(sz => (
              <button key={sz} onClick={() => setBrushSize(sz)} style={{
                ...tabBtn(brushSize === sz),
                padding: '4px 8px', minWidth: '30px',
              }}>
                {sz}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
            <button
              onClick={() => setActiveClass('none')}
              style={{ ...tabBtn(activeClass === 'none'), padding: '4px 10px' }}
            >
              Eraser
            </button>
            <button
              onClick={() => { applyPreset('clear'); }}
              style={{
                fontFamily: mono, fontSize: '10px', padding: '4px 10px',
                border: '1px solid #3a1a1a', borderRadius: '4px',
                background: 'var(--bg4)', color: 'var(--red)', cursor: 'pointer',
              }}
            >
              Clear all
            </button>
          </div>

          {/* Stats strip */}
          <div data-mobile-stat-strip style={{
            display: 'flex', marginTop: '10px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '8px', overflow: 'hidden',
          }}>
            {/* Brush */}
            <div style={{ flex: 1, padding: '10px 14px', minWidth: 0 }}>
              <div style={{ fontFamily: mono, fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Brush</div>
              <div style={{ fontFamily: mono, fontSize: '13px', color: 'var(--accent)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeName}</div>
              <div style={{ fontFamily: mono, fontSize: '9px', color: '#777' }}>{brushSize} cell{brushSize !== 1 ? 's' : ''}</div>
            </div>
            <div data-mobile-divider style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />
            {/* Coverage */}
            <div style={{ flex: 1, padding: '10px 14px', minWidth: 0 }}>
              <div style={{ fontFamily: mono, fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Painted</div>
              <div style={{ fontFamily: mono, fontSize: '13px', color: 'var(--text)', marginBottom: '2px' }}>
                {totalPainted}<span style={{ fontSize: '9px', color: '#555' }}>/192</span>
              </div>
              <div style={{ fontFamily: mono, fontSize: '9px', color: '#777' }}>{classesUsed} class{classesUsed !== 1 ? 'es' : ''}</div>
            </div>
            <div data-mobile-divider style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />
            {/* Dominant */}
            <div style={{ flex: 1, padding: '10px 14px', minWidth: 0 }}>
              <div style={{ fontFamily: mono, fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Dominant</div>
              <div style={{ fontFamily: mono, fontSize: '13px', color: 'var(--green)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topClass?.name ?? '—'}</div>
              <div style={{ fontFamily: mono, fontSize: '9px', color: '#777' }}>{topCoverage} coverage</div>
            </div>
            <div data-mobile-divider style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />
            {/* SPADE */}
            <div style={{ flex: 2, padding: '10px 14px', minWidth: 0 }}>
              <div style={{ fontFamily: mono, fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>SPADE generator</div>
              <div style={{ fontFamily: mono, fontSize: '9px', color: '#888', lineHeight: 1.65 }}>
                M → ConvNet → γ(M), β(M) &nbsp;·&nbsp; output: image H×W×3<br />
                GauGAN (NVIDIA) &nbsp;·&nbsp; scene editing &nbsp;·&nbsp; asset gen
              </div>
            </div>
          </div>
        </div>

      ) : (

        /* ── MECHANISM MODE ──────────────────────────────────────────────────── */
        <div data-mobile-stack style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

          {/* Left: diagram + comparison + callout */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div data-mobile-scroll>
              <MechanismDiagram showSPADEPath={showSPADEPath} />
            </div>

            {/* Toggle */}
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showSPADEPath}
                  onChange={e => setShowSPADEPath(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text-mid)' }}>
                  Show SPADE pathway
                </span>
              </label>
            </div>

            {/* Comparison */}
            <div data-mobile-stack style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: mono, fontSize: '9px', color: 'var(--red)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: '5px', textAlign: 'center',
                }}>
                  Without SPADE
                </div>
                <div style={{ border: '1px solid var(--red)', borderRadius: '4px', overflow: 'hidden' }}>
                  <svg viewBox={`0 0 ${COLS*CELL} ${ROWS*CELL}`} width="100%" style={{ display: 'block' }}>
                    {BEACH_DEGRADED.flatMap((rowArr, r) => rowArr.map((cls, c) => (
                      <CellTexture key={`d-${r}-${c}`} cls={cls} x={c*CELL} y={r*CELL} r={r} c={c} />
                    )))}
                  </svg>
                </div>
              </div>

              <div data-mobile-panel style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: mono, fontSize: '9px', color: 'var(--accent)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: '5px', textAlign: 'center',
                }}>
                  With SPADE
                </div>
                <div style={{ border: '1px solid var(--accent)', borderRadius: '4px', overflow: 'hidden' }}>
                  <svg viewBox={`0 0 ${COLS*CELL} ${ROWS*CELL}`} width="100%" style={{ display: 'block' }}>
                    {BEACH_CLEAN.flatMap((rowArr, r) => rowArr.map((cls, c) => (
                      <CellTexture key={`cl-${r}-${c}`} cls={cls} x={c*CELL} y={r*CELL} r={r} c={c} />
                    )))}
                  </svg>
                </div>
              </div>
            </div>

            {/* Callout */}
            <div style={{
              marginTop: '14px', padding: '12px 16px',
              background: 'var(--bg4)', borderRadius: '6px',
              border: '1px solid var(--border)',
            }}>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: '12px',
                color: '#b8c4cc', lineHeight: 1.7, margin: 0,
              }}>
                In a deep generator, normalization layers tend to homogenize features — they erase the semantic
                distinctions in the input mask. SPADE prevents this by re-injecting the semantic structure at
                every layer through the normalization parameters. The result: every pixel in the output
                respects the class assignment of the corresponding pixel in the input.
              </p>
            </div>
          </div>

          {/* Right: stats panel */}
          <div data-mobile-panel style={{
            width: 180, flexShrink: 0,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '12px 14px', fontFamily: mono,
          }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '5px' }}>
              Standard BN:
            </div>
            <div style={{ fontSize: '9px', color: '#888', lineHeight: 1.65, marginBottom: '10px' }}>
              γ, β: shared across<br />
              all spatial locations.<br />
              One scalar per channel.
            </div>
            <Divider />
            <div style={{ fontSize: '9px', color: 'var(--accent)', marginBottom: '5px' }}>
              SPADE:
            </div>
            <div style={{ fontSize: '9px', color: '#888', lineHeight: 1.65, marginBottom: '10px' }}>
              γ(M), β(M): predicted<br />
              from mask M.<br />
              Spatially varying.<br />
              Semantic-aware.
            </div>
            <Divider />
            <StatRow label="Input"  val="M (mask)" />
            <StatRow label="Params" val="γ(M), β(M)" />
            <StatRow label="Via"    val="ConvNet" />
            <Divider />
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>Formula:</div>
            <div style={{ fontSize: '9px', color: '#fbbf24', lineHeight: 1.75 }}>
              F_norm = BN(F)<br />
              out = γ(M)·F_norm<br />
              {'     '} + β(M)
            </div>
            <Divider />
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>Used in:</div>
            <div style={{ fontSize: '9px', color: '#888', lineHeight: 1.65 }}>
              GauGAN (NVIDIA)<br />
              pix2pixHD<br />
              OASIS, SEAN
            </div>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
