import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Fixed grid dimensions ─────────────────────────────────────────────────────
const ROWS = 8, COLS = 8, GAP = 2;

// Hidden per-cell spatial (H,W) sample count. Each displayed (sample, feature)
// cell secretly carries HW values standing in for its spatial extent, so
// InstanceNorm has a genuine (H,W) population to normalize over — distinct
// from LayerNorm's per-sample, all-features population — matching the
// (N, C, H, W) volume depicted in NormalizationRegions above this widget.
const HW = 4;

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  accent:   '#2dd4bf',
  codeBg:   '#0a0a0a',
  muted:    '#555555',
  mid:      '#888888',
  teal:     '#2dd4bf',
  orange:   '#fb923c',
  purple:   '#a78bfa',
  green:    '#34d399',
  border:   '#242424',
  bg2:      '#111111',
  bg4:      '#1e1e1e',
};

const NORM_TYPES = [
  { key: 'none',     label: 'None' },
  { key: 'batch',    label: 'BatchNorm' },
  { key: 'layer',    label: 'LayerNorm' },
  { key: 'group',    label: 'GroupNorm' },
  { key: 'instance', label: 'InstanceNorm' },
];

const OVERLAY_COLOR = {
  batch:    C.teal,
  layer:    C.orange,
  group:    C.purple,
  instance: C.green,
};

const NORM_DESC = {
  batch:    'Normalizes across 8 samples, independently per feature.',
  layer:    'Normalizes across 8 features, independently per sample.',
  group:    'Normalizes within groups of 4 features, per sample.',
  instance: 'Normalizes each sample-feature cell across its own hidden spatial (H,W) extent — independent of every other feature and every other sample.',
};

// ── Derive canvas layout from measured container width ────────────────────────
function makeLayout(containerW) {
  const PAD_L = 40, PAD_R = 8, PAD_T = 22, PAD_B = 24;
  const gridW = containerW - PAD_L - PAD_R;
  const CELL_W = Math.max(32, Math.floor((gridW - (COLS - 1) * GAP) / COLS));
  const actualGridW = CELL_W * COLS + (COLS - 1) * GAP;
  const CW = PAD_L + actualGridW + PAD_R;
  const CELL_H = Math.round(CELL_W * 0.58);
  const CH = PAD_T + ROWS * CELL_H + (ROWS - 1) * GAP + PAD_B;
  return { CELL_W, CELL_H, GAP, PAD_L, PAD_T, PAD_R, PAD_B, CW, CH };
}

// ── PRNG ──────────────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateGrid(seed) {
  const rng = mulberry32(seed);
  const gaussian = () => {
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    return 2.0 + 1.5 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => gaussian())
  );
  // Hidden per-cell spatial (H,W) samples. Index 0 is fixed to the cell's own
  // visible value (so InstanceNorm's computation is grounded in real displayed
  // data, not disconnected fake numbers); indices 1..HW-1 are additional
  // spatial draws from the same generator stream, giving each (sample,
  // feature) instance a genuine population to normalize over.
  const spatial = grid.map(row => row.map(v => {
    const extra = Array.from({ length: HW - 1 }, () => gaussian());
    return [v, ...extra];
  }));
  return { grid, spatial };
}

// ── Normalization helpers ──────────────────────────────────────────────────────
function groupStats(vals, eps = 0) {
  const n = vals.length;
  const mu = vals.reduce((a, b) => a + b, 0) / n;
  const variance = vals.reduce((a, v) => a + (v - mu) ** 2, 0) / n;
  const sigma = Math.sqrt(variance);
  const normalized = vals.map(v => (v - mu) / Math.sqrt(variance + eps));
  return { mu, sigma, normalized };
}

function computeNormed(grid, spatial, normType, eps) {
  const out = grid.map(r => [...r]);
  if (normType === 'none') return out;
  if (normType === 'batch') {
    for (let j = 0; j < COLS; j++) {
      const { normalized } = groupStats(grid.map(r => r[j]), eps);
      normalized.forEach((v, i) => { out[i][j] = v; });
    }
  } else if (normType === 'layer') {
    for (let i = 0; i < ROWS; i++) {
      const { normalized } = groupStats(grid[i], eps);
      normalized.forEach((v, j) => { out[i][j] = v; });
    }
  } else if (normType === 'instance') {
    // Each (sample, feature) cell normalizes independently over its own
    // hidden (H,W) spatial extent — never pooling with other features or
    // other samples, unlike LayerNorm which pools across the whole row.
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        const { normalized } = groupStats(spatial[i][j], eps);
        out[i][j] = normalized[0]; // the cell's own visible value, post-norm
      }
    }
  } else if (normType === 'group') {
    for (let i = 0; i < ROWS; i++) {
      for (let g = 0; g < 2; g++) {
        const s = g * 4;
        const { normalized } = groupStats(grid[i].slice(s, s + 4), eps);
        normalized.forEach((v, k) => { out[i][s + k] = v; });
      }
    }
  }
  return out;
}

function getGroupForCell(normType, row, col) {
  if (normType === 'none')     return null;
  if (normType === 'batch')    return { type: 'col', col };
  if (normType === 'layer')    return { type: 'row', row };
  if (normType === 'instance') return { type: 'cell', row, col };
  if (normType === 'group')    return { type: 'group', row, group: Math.floor(col / 4) };
  return null;
}

function getGroupVals(grid, spatial, group) {
  if (!group) return [];
  if (group.type === 'col')   return grid.map(r => r[group.col]);
  if (group.type === 'row')   return [...grid[group.row]];
  if (group.type === 'cell')  return [...spatial[group.row][group.col]];
  if (group.type === 'group') return grid[group.row].slice(group.group * 4, group.group * 4 + 4);
  return [];
}

function isCellInGroup(group, row, col) {
  if (!group) return false;
  if (group.type === 'col')   return col === group.col;
  if (group.type === 'row')   return row === group.row;
  if (group.type === 'cell')  return row === group.row && col === group.col;
  if (group.type === 'group') return row === group.row && Math.floor(col / 4) === group.group;
  return false;
}

function groupSizeLabel(group) {
  if (!group) return '';
  if (group.type === 'col')   return '8 samples × 1 feature';
  if (group.type === 'row')   return '1 sample × 8 features';
  if (group.type === 'cell')  return `1 sample × 1 feature × ${HW} spatial (H×W)`;
  if (group.type === 'group') return '1 sample × 4 features';
  return '';
}

function fmtEps(v) {
  const exp = Math.floor(Math.log10(v));
  const man = v / Math.pow(10, exp);
  return `${man.toFixed(2)}e${exp}`;
}

// ── Canvas color ──────────────────────────────────────────────────────────────
function valToRgb(t) {
  return `rgb(${Math.round(10 + t * 35)},${Math.round(10 + t * 202)},${Math.round(10 + t * 181)})`;
}

// ── Canvas draw ───────────────────────────────────────────────────────────────
function drawCanvas(ctx, dpr, { grid, normed, normType, eps, hovered, layout }) {
  const { CELL_W, CELL_H, GAP, PAD_L, PAD_T, PAD_R, PAD_B, CW, CH } = layout;

  ctx.clearRect(0, 0, CW * dpr, CH * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  const allVals = grid.flat();
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const span = maxV - minV || 1;

  const cx = j => PAD_L + j * (CELL_W + GAP);
  const cy = i => PAD_T + i * (CELL_H + GAP);

  const hovGroup = hovered && normType !== 'none'
    ? getGroupForCell(normType, hovered.row, hovered.col)
    : null;

  // Cell font size scaled to cell width
  const cellFontSize = Math.max(8, Math.min(11, Math.round(CELL_W * 0.19)));

  // Draw cells
  ctx.font = `${cellFontSize}px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const x = cx(j), y = cy(i);
      const t = (grid[i][j] - minV) / span;
      ctx.fillStyle = valToRgb(t);
      ctx.fillRect(x, y, CELL_W, CELL_H);
      ctx.fillStyle = t > 0.35 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.6)';
      ctx.fillText(grid[i][j].toFixed(1), x + CELL_W / 2, y + CELL_H / 2);
    }
  }

  // Dim non-group cells when hovering
  if (hovGroup) {
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        if (!isCellInGroup(hovGroup, i, j)) {
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.fillRect(cx(j), cy(i), CELL_W, CELL_H);
        }
      }
    }
  }

  // Group overlays
  if (normType !== 'none') {
    const oc = OVERLAY_COLOR[normType];
    ctx.lineWidth = 1.5;
    if (normType === 'batch') {
      for (let j = 0; j < COLS; j++) {
        const isHov = hovGroup?.type === 'col' && hovGroup.col === j;
        ctx.strokeStyle = isHov ? oc : oc + '60';
        ctx.strokeRect(cx(j) - 1, cy(0) - 1, CELL_W + 2, ROWS * CELL_H + (ROWS - 1) * GAP + 2);
      }
    } else if (normType === 'layer') {
      for (let i = 0; i < ROWS; i++) {
        const isHov = hovGroup?.type === 'row' && hovGroup.row === i;
        ctx.strokeStyle = isHov ? oc : oc + '60';
        ctx.strokeRect(cx(0) - 1, cy(i) - 1, COLS * CELL_W + (COLS - 1) * GAP + 2, CELL_H + 2);
      }
    } else if (normType === 'instance') {
      // Each cell is its own independent normalization group (over hidden
      // H,W), so every cell gets its own outline rather than a shared row.
      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          const isHov = hovGroup?.type === 'cell' && hovGroup.row === i && hovGroup.col === j;
          ctx.strokeStyle = isHov ? oc : oc + '40';
          ctx.lineWidth = isHov ? 2 : 1;
          ctx.strokeRect(cx(j) - 1, cy(i) - 1, CELL_W + 2, CELL_H + 2);
        }
      }
      ctx.lineWidth = 1.5;
    } else if (normType === 'group') {
      for (let i = 0; i < ROWS; i++) {
        for (let g = 0; g < 2; g++) {
          const isHov = hovGroup?.type === 'group' && hovGroup.row === i && hovGroup.group === g;
          ctx.strokeStyle = isHov ? oc : oc + '60';
          const x0 = cx(g * 4) - 1, x1 = cx(g * 4 + 3) + CELL_W + 1;
          ctx.strokeRect(x0, cy(i) - 1, x1 - x0, CELL_H + 2);
        }
      }
    }
  }

  // BatchNorm: column μ/σ above grid
  if (normType === 'batch') {
    const labelFontSize = Math.max(7, Math.min(9, Math.round(CELL_W * 0.15)));
    ctx.font = `${labelFontSize}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = C.teal + 'cc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let j = 0; j < COLS; j++) {
      const { mu, sigma } = groupStats(grid.map(r => r[j]), eps);
      ctx.fillText(`μ${mu.toFixed(1)} σ${sigma.toFixed(1)}`, cx(j) + CELL_W / 2, PAD_T / 2);
    }
  }

  // GroupNorm: "Group 0 / 1" labels above each half
  if (normType === 'group') {
    ctx.font = `8px 'JetBrains Mono', monospace`;
    ctx.fillStyle = C.purple + 'aa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let g = 0; g < 2; g++) {
      const x0 = cx(g * 4), x1 = cx(g * 4 + 3) + CELL_W;
      ctx.fillText(`Group ${g}`, (x0 + x1) / 2, PAD_T / 2);
    }
  }

  // Axis: row numbers (left)
  ctx.font = `8px 'JetBrains Mono', monospace`;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < ROWS; i++) {
    ctx.fillText(i, PAD_L - 5, cy(i) + CELL_H / 2);
  }

  // Axis: feature numbers (bottom)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const gridBot = cy(ROWS - 1) + CELL_H + 4;
  for (let j = 0; j < COLS; j++) {
    ctx.fillText(j, cx(j) + CELL_W / 2, gridBot);
  }

  // Axis: "Samples (batch)" rotated left label
  ctx.save();
  ctx.font = `8px 'JetBrains Mono', monospace`;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const gridMidY = PAD_T + (ROWS * CELL_H + (ROWS - 1) * GAP) / 2;
  ctx.translate(9, gridMidY);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Samples (batch)', 0, 0);
  ctx.restore();

  // Axis: "Features (channels)" bottom center
  ctx.font = `8px 'JetBrains Mono', monospace`;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Features (channels)', PAD_L + (COLS * CELL_W + (COLS - 1) * GAP) / 2, CH - 3);

  ctx.restore();
}

// ── Stat bar (horizontal, below canvas) ───────────────────────────────────────
function StatBar({ hovGroup, hovStats, hovAfterStats, normType }) {
  const hasData = hovGroup && hovStats && normType !== 'none';

  const boxStyle = {
    flex: 1,
    background: C.bg4,
    borderRadius: '5px',
    padding: '8px 10px',
    minWidth: 0,
  };
  const labelSt = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9px', color: C.muted,
    marginBottom: '3px', whiteSpace: 'nowrap',
  };
  const valSt = (color = C.accent) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px', color, lineHeight: 1,
  });

  if (!hasData) {
    return (
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10px', color: C.muted,
        padding: '8px 2px',
      }}>
        {normType === 'none' ? 'Select a norm type to see group stats.' : 'Hover a cell to inspect its normalization group.'}
      </div>
    );
  }

  const muAfter  = hovAfterStats?.mu ?? 0;
  const sigAfter = hovAfterStats?.sigma ?? 0;

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={boxStyle}>
        <div style={labelSt}>Mean before</div>
        <div style={valSt()}>{hovStats.mu.toFixed(3)}</div>
      </div>
      <div style={boxStyle}>
        <div style={labelSt}>Std before</div>
        <div style={valSt()}>{hovStats.sigma.toFixed(3)}</div>
      </div>
      <div style={boxStyle}>
        <div style={labelSt}>Mean after</div>
        <div style={valSt(Math.abs(muAfter) < 0.005 ? C.green : C.accent)}>
          {muAfter.toFixed(3)}
        </div>
      </div>
      <div style={boxStyle}>
        <div style={labelSt}>Std after</div>
        <div style={valSt(Math.abs(sigAfter - 1) < 0.005 ? C.green : C.accent)}>
          {sigAfter.toFixed(3)}
        </div>
      </div>
      <div style={{ ...boxStyle, flex: '1.5' }}>
        <div style={labelSt}>Group size</div>
        <div style={valSt(C.mid)}>{groupSizeLabel(hovGroup)}</div>
      </div>
    </div>
  );
}

// ── Normalized values row ─────────────────────────────────────────────────────
function NormedRow({ normedRow, normType, cellW }) {
  const oc = OVERLAY_COLOR[normType] || C.accent;

  if (!normedRow) {
    return (
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.muted, margin: '8px 0 4px' }}>
        Normalized values → <span style={{ opacity: 0.45 }}>hover a cell to inspect</span>
      </div>
    );
  }

  const minV = Math.min(...normedRow);
  const maxV = Math.max(...normedRow);
  const span = maxV - minV || 1;
  const displayW = cellW || 54;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 4px', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.muted, whiteSpace: 'nowrap' }}>
        Normalized values →
      </span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {normedRow.map((v, j) => {
          const t = (v - minV) / span;
          return (
            <div key={j} style={{
              width: `${displayW}px`, height: '26px',
              background: valToRgb(t),
              border: `1px solid ${oc}55`,
              borderRadius: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '8px', color: 'rgba(255,255,255,0.9)',
            }}>
              {v.toFixed(1)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NormalizationComparison({ tryThis }) {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const dprRef       = useRef(1);

  const [normType,   setNormType]   = useState('none');
  const [epsLog,     setEpsLog]     = useState(0);
  const [seed,       setSeed]       = useState(42);
  const [hovered,    setHovered]    = useState(null);
  const [canvasW,    setCanvasW]    = useState(520); // updated after mount

  // Measure actual available width
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = Math.floor(containerRef.current.getBoundingClientRect().width);
        if (w > 100) setCanvasW(w);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const layout = useMemo(() => makeLayout(canvasW), [canvasW]);

  const eps = useMemo(() => {
    const LO = Math.log(1e-5), HI = Math.log(0.1);
    return Math.exp(LO + epsLog * (HI - LO));
  }, [epsLog]);

  const { grid, spatial } = useMemo(() => generateGrid(seed), [seed]);
  const normed = useMemo(() => computeNormed(grid, spatial, normType, eps), [grid, spatial, normType, eps]);

  const hovGroup = useMemo(() =>
    hovered && normType !== 'none' ? getGroupForCell(normType, hovered.row, hovered.col) : null,
    [hovered, normType]
  );
  const hovVals = useMemo(() =>
    hovGroup ? getGroupVals(grid, spatial, hovGroup) : null,
    [grid, spatial, hovGroup]
  );
  const hovStats = useMemo(() =>
    hovVals ? groupStats(hovVals, eps) : null,
    [hovVals, eps]
  );
  const hovAfterStats = useMemo(() =>
    hovStats ? groupStats(hovStats.normalized) : null,
    [hovStats]
  );

  const displayNormedRow = hovered ? normed[hovered.row] : null;

  // Canvas resize + HiDPI setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width  = layout.CW * dpr;
    canvas.height = layout.CH * dpr;
    canvas.style.width  = layout.CW + 'px';
    canvas.style.height = layout.CH + 'px';
  }, [layout]);

  // Redraw
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    drawCanvas(ctx, dprRef.current, { grid, normed, normType, eps, hovered, layout });
  }, [grid, normed, normType, eps, hovered, layout]);

  // Mouse tracking — uses live layout via closure over layout ref
  const layoutRef = useRef(layout);
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  const handleMouseMove = useCallback((e) => {
    const { CELL_W, CELL_H, PAD_L, PAD_T } = layoutRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        const x = PAD_L + j * (CELL_W + GAP);
        const y = PAD_T + i * (CELL_H + GAP);
        if (mx >= x && mx < x + CELL_W && my >= y && my < y + CELL_H) {
          setHovered(prev => (prev?.row === i && prev?.col === j ? prev : { row: i, col: j }));
          return;
        }
      }
    }
    setHovered(null);
  }, []);

  const handleMouseLeave = useCallback(() => setHovered(null), []);
  const randomize = useCallback(() => setSeed(s => s + 1), []);

  return (
    <WidgetCard title="Normalization — which dimensions are normalized" number="5.1" tryThis={tryThis}>
      {/* Measure container — canvas fills this exactly */}
      <div ref={containerRef} style={{ width: '100%' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block', cursor: 'crosshair',
            width: layout.CW + 'px', height: layout.CH + 'px',
            background: C.codeBg, borderRadius: '4px',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* Stat bar */}
      <div style={{ marginTop: '10px' }}>
        <StatBar
          hovGroup={hovGroup}
          hovStats={hovStats}
          hovAfterStats={hovAfterStats}
          normType={normType}
        />
      </div>

      {/* Normalized values row */}
      {normType !== 'none' && (
        <NormedRow normedRow={displayNormedRow} normType={normType} cellW={layout.CELL_W} />
      )}

      {/* Description */}
      {normType !== 'none' && (
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px', color: OVERLAY_COLOR[normType],
          margin: '2px 0 12px', opacity: 0.85,
        }}>
          {NORM_DESC[normType]}
        </p>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
        {/* Norm type tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {NORM_TYPES.map(({ key, label }) => {
            const active = normType === key;
            return (
              <button key={key}
                onClick={() => { setNormType(key); setHovered(null); }}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '4px', padding: '5px 10px', cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ε slider + Randomize */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              ε = {fmtEps(eps)}
            </span>
            <input type="range" min={0} max={1} step={0.01} value={epsLog}
              onChange={e => setEpsLog(Number(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
          <button onClick={randomize} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
            color: 'var(--text-muted)', background: 'var(--bg4)',
            border: '1px solid var(--border)', borderRadius: '4px',
            padding: '5px 12px', cursor: 'pointer',
          }}>
            Randomize
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}
