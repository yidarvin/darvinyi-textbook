import { useState, useMemo, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  red:       '#f87171',
  candidate: '#38bdf8',
  border:    '#242424',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  codeBg:    '#0a0a0a',
  text:      '#e8eaed',
  mid:       '#888888',
  muted:     '#555555',
};

const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ── Presets ──────────────────────────────────────────────────────────────

// `g` is the candidate cell contents c̃_t = tanh(W_c·[h_{t-1}, x_t] + b_c) — bounded
// to tanh's [-1, 1] range, and NOT a gate (it has no sigmoid, no "how much" semantics).
// It is given here as a per-timestep scenario value, exactly like f/i/o, so that
// c_t = f_t ⊙ c_{t-1} + i_t ⊙ c̃_t can be computed faithfully instead of assuming a
// fixed constant in place of c̃_t (which would make the cell state provably unable
// to ever go negative, contradicting the negative-signal color/interpretation below).
const PRESETS = {
  A: {
    label: 'Remember & Forget',
    f: [0.90, 0.92, 0.88, 0.08, 0.91, 0.89, 0.93, 0.90, 0.06, 0.92],
    i: [0.12, 0.10, 0.75, 0.88, 0.11, 0.13, 0.70, 0.09, 0.91, 0.11],
    o: [0.35, 0.38, 0.40, 0.42, 0.88, 0.91, 0.37, 0.39, 0.41, 0.89],
    g: [0.80, 0.80, 0.80, 0.80, 0.50, 0.60, 0.70, 0.40, -0.90, 0.30],
  },
  B: {
    label: 'Stable Memory',
    f: [0.95, 0.97, 0.96, 0.98, 0.97, 0.96, 0.98, 0.97, 0.96, 0.98],
    i: [0.90, 0.08, 0.07, 0.09, 0.06, 0.08, 0.07, 0.09, 0.06, 0.08],
    o: [0.55, 0.52, 0.54, 0.51, 0.53, 0.55, 0.52, 0.51, 0.54, 0.53],
    g: [0.85, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50],
  },
  C: {
    label: 'Oscillating',
    f: [0.85, 0.20, 0.88, 0.18, 0.87, 0.21, 0.89, 0.19, 0.86, 0.22],
    i: [0.20, 0.82, 0.18, 0.85, 0.19, 0.83, 0.17, 0.84, 0.21, 0.81],
    o: [0.50, 0.52, 0.48, 0.53, 0.49, 0.51, 0.50, 0.52, 0.47, 0.53],
    g: [0.75, 0.85, 0.70, 0.90, 0.72, 0.88, 0.68, 0.92, 0.74, 0.86],
  },
};

function computeCellState(p) {
  const c = new Array(10);
  c[0] = p.i[0] * p.g[0];
  for (let t = 1; t < 10; t++) {
    c[t] = Math.max(-1.5, Math.min(1.5, p.f[t] * c[t - 1] + p.i[t] * p.g[t]));
  }
  return c;
}

// ── Color helpers ─────────────────────────────────────────────────────────

function lerpHex(h1, h2, t) {
  t = Math.max(0, Math.min(1, t));
  const parse = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = parse(h1);
  const [r2, g2, b2] = parse(h2);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

const forgetColor = v =>
  v <= 0.5 ? lerpHex('#1a0030', C.bg4, v / 0.5)
           : lerpHex(C.bg4, C.accent, (v - 0.5) / 0.5);

const inputColor  = v => lerpHex(C.codeBg, C.orange, v);
const outputColor = v => lerpHex(C.codeBg, C.purple, v);

// Candidate c̃_t is a tanh output, bounded to [-1, 1] (not [0, 1] like the gates).
const candidateColor = v =>
  v <= 0 ? lerpHex(C.red, C.bg4, (v + 1) / 1)
         : lerpHex(C.bg4, C.candidate, v / 1);

const cellColor = v =>
  v <= 0 ? lerpHex(C.red, C.bg4, (v + 1.5) / 1.5)
         : lerpHex(C.bg4, C.math, v / 1.5);

// ── Interpretation helpers ────────────────────────────────────────────────

const forgetInterp = v =>
  v < 0.2 ? 'Almost all previous memory erased' :
  v < 0.5 ? 'Most previous memory forgotten' :
  v < 0.8 ? 'Some memory retained' :
             'Most memory preserved';

const inputInterp = v =>
  v < 0.2 ? 'No new information written' :
  v < 0.5 ? 'Small write to cell state' :
  v < 0.8 ? 'Moderate new information written' :
             'Strongly writing new information';

const outputInterp = v =>
  v < 0.2 ? 'Cell state hidden from output' :
  v < 0.5 ? 'Partially exposing cell state' :
  v < 0.8 ? 'Moderately exposing cell state' :
             'Cell state strongly influencing output';

const cellInterp = v =>
  v < -0.5 ? 'Cell holding strong negative signal' :
  v <  0.5 ? 'Cell near neutral' :
              'Cell holding strong positive signal';

const candidateInterp = v =>
  v < -0.3 ? 'New content would push the cell sharply negative' :
  v <  0.3 ? 'New content is near-neutral' :
              'New content would push the cell sharply positive';

// ── SVG layout constants ──────────────────────────────────────────────────

const CELL_W = 46, CELL_H = 46, GAP = 3;
const SVG_LEFT = 90, SVG_TOP = 36;
const VB_W = 580;

const cx = col => SVG_LEFT + col * (CELL_W + GAP);
const cy = row => SVG_TOP + row * (CELL_H + GAP);

// ── Row definitions ───────────────────────────────────────────────────────

// Row 3 (candidate) is deliberately NOT labeled a "gate" — it has no sigmoid and no
// "how much" semantics, unlike rows 0-2. Rows 3-4 use signed (tanh/clamped) values;
// rows 0-2 are sigmoid outputs in [0, 1].
const ROW_DEFS = [
  { sym: 'f', name: 'forget',    color: C.accent,    colorFn: forgetColor,    interpFn: forgetInterp,    displayName: 'Forget Gate' },
  { sym: 'i', name: 'input',     color: C.orange,    colorFn: inputColor,     interpFn: inputInterp,     displayName: 'Input Gate'  },
  { sym: 'o', name: 'output',    color: C.purple,    colorFn: outputColor,    interpFn: outputInterp,    displayName: 'Output Gate' },
  { sym: 'c̃', name: 'cand.',     color: C.candidate, colorFn: candidateColor, interpFn: candidateInterp, displayName: 'Candidate Update' },
  { sym: 'c', name: 'cell',      color: C.math,       colorFn: cellColor,     interpFn: cellInterp,      displayName: 'Cell State'  },
];

const SIGNED_ROW_START = 3; // rows >= this index are signed (candidate, cell state)

// ── Component ─────────────────────────────────────────────────────────────

export default function LSTMGates({ tryThis }) {
  const [preset, setPreset]               = useState('A');
  const [highlightCol, setHighlightCol]   = useState(3);
  const [showCellState, setShowCellState] = useState(true);
  const [hoveredCell, setHoveredCell]     = useState(null);
  const [tooltipPos, setTooltipPos]       = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  const p         = PRESETS[preset];
  const cellState = useMemo(() => computeCellState(PRESETS[preset]), [preset]);
  const numRows   = showCellState ? 5 : 3;

  const VB_H       = SVG_TOP + numRows * (CELL_H + GAP) - GAP + 16;
  const highlightH = numRows * (CELL_H + GAP) - GAP;

  const rowData = [p.f, p.i, p.o, p.g, cellState];

  // Stats at highlighted timestep
  const t    = highlightCol;
  const ft   = p.f[t], it = p.i[t], ot = p.o[t], gt = p.g[t], ct = cellState[t];
  const meanF = p.f.reduce((a, b) => a + b, 0) / 10;
  const meanI = p.i.reduce((a, b) => a + b, 0) / 10;
  const cMin  = Math.min(...cellState);
  const cMax  = Math.max(...cellState);
  const gMin  = Math.min(...p.g);
  const gMax  = Math.max(...p.g);

  const handleCellEnter = (row, col, e) => {
    if (!containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    setHoveredCell({ row, col });
    setTooltipPos({ x: e.clientX - cr.left, y: e.clientY - cr.top });
  };

  const handleMouseMove = (e) => {
    if (!hoveredCell || !containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - cr.left, y: e.clientY - cr.top });
  };

  // Tooltip data
  let ttData = null;
  if (hoveredCell) {
    const { row, col } = hoveredCell;
    const rd  = ROW_DEFS[row];
    const val = rowData[row][col];
    ttData = {
      name: rd.displayName,
      t: col,
      val,
      valStr: row >= SIGNED_ROW_START ? (val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)) : val.toFixed(2),
      meaning: rd.interpFn(val),
    };
  }

  const ttop  = tooltipPos.y < 90 ? tooltipPos.y + 14 : tooltipPos.y - 88;
  const tleft = tooltipPos.x + 14;

  const signedCell = v => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2));

  return (
    <WidgetCard title="LSTM Gate Inspector — gates, candidate, and cell state" number="8.3" tryThis={tryThis}>
      <div ref={containerRef} style={{ position: 'relative' }} onMouseMove={handleMouseMove}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

          {/* ── Canvas + controls ──────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: C.codeBg, borderRadius: '6px' }}>
              <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ display: 'block' }}>

                {/* Column highlight */}
                <rect
                  x={cx(highlightCol)} y={SVG_TOP - 1}
                  width={CELL_W} height={highlightH + 2}
                  fill="rgba(45,212,191,0.06)"
                  pointerEvents="none"
                />
                <line
                  x1={cx(highlightCol)}          y1={SVG_TOP - 1}
                  x2={cx(highlightCol)}          y2={SVG_TOP + highlightH + 1}
                  stroke={C.accent} strokeWidth="1" pointerEvents="none"
                />
                <line
                  x1={cx(highlightCol) + CELL_W} y1={SVG_TOP - 1}
                  x2={cx(highlightCol) + CELL_W} y2={SVG_TOP + highlightH + 1}
                  stroke={C.accent} strokeWidth="1" pointerEvents="none"
                />

                {/* Column headers */}
                {Array.from({ length: 10 }, (_, j) => (
                  <text
                    key={j}
                    x={cx(j) + CELL_W / 2} y={SVG_TOP - 8}
                    textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize="10"
                    fill={C.muted}
                  >
                    t={j}
                  </text>
                ))}

                {/* Rows */}
                {ROW_DEFS.slice(0, numRows).map((rd, row) => (
                  <g key={row}>
                    {/* Row label: symbol + subscript t + name */}
                    <text
                      x={SVG_LEFT - 8}
                      y={cy(row) + CELL_H / 2}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fill={rd.color}
                    >
                      <tspan fontFamily="'JetBrains Mono', monospace" fontSize="13">{rd.sym}</tspan>
                      <tspan fontFamily="'JetBrains Mono', monospace" fontSize="9" dy="3">t</tspan>
                      <tspan fontFamily="'Inter', sans-serif" fontSize="13" dy="-3">  {rd.name}</tspan>
                    </text>

                    {/* Cells */}
                    {Array.from({ length: 10 }, (_, col) => {
                      const val       = rowData[row][col];
                      const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
                      const dispVal   = row >= SIGNED_ROW_START
                        ? (val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2))
                        : val.toFixed(2);

                      return (
                        <g key={col}>
                          <rect
                            x={cx(col)} y={cy(row)}
                            width={CELL_W} height={CELL_H}
                            fill={rd.colorFn(val)}
                            stroke={isHovered ? 'white' : 'none'}
                            strokeWidth={isHovered ? 2 : 0}
                            style={{ cursor: 'crosshair' }}
                            aria-label={`${rd.displayName}, timestep ${col}: ${dispVal}`}
                            onMouseEnter={e => handleCellEnter(row, col, e)}
                            onMouseLeave={() => setHoveredCell(null)}
                          />
                          <text
                            x={cx(col) + CELL_W / 2}
                            y={cy(row) + CELL_H / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontFamily="'JetBrains Mono', monospace"
                            fontSize="10"
                            fill="rgba(255,255,255,0.9)"
                            style={{ pointerEvents: 'none' }}
                          >
                            {dispVal}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                ))}
              </svg>
            </div>

            {/* Controls */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Preset tabs */}
              <div>
                <div style={{ ...mono, fontSize: '11px', color: C.muted, marginBottom: '6px' }}>preset</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {Object.entries(PRESETS).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setPreset(key)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: `1px solid ${preset === key ? C.accent : C.border}`,
                        background: preset === key ? C.accentDim : 'transparent',
                        color: preset === key ? C.accent : C.muted,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlight timestep slider */}
              <div>
                <div style={{ ...mono, fontSize: '11px', color: C.muted, marginBottom: '5px' }}>
                  Highlight timestep  t = {highlightCol}
                </div>
                <input
                  type="range" min={0} max={9} step={1} value={highlightCol}
                  onChange={e => setHighlightCol(+e.target.value)}
                  style={{ width: '100%', accentColor: C.accent, cursor: 'pointer' }}
                />
              </div>

              {/* Show cell state toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showCellState}
                  onChange={e => setShowCellState(e.target.checked)}
                  style={{ accentColor: C.accent }}
                />
                <span style={{ ...mono, fontSize: '11px', color: C.muted }}>Show candidate &amp; cell state</span>
              </label>
            </div>
          </div>

          {/* ── Stats panel ────────────────────────────────────────────── */}
          <div style={{
            width: '180px', flexShrink: 0,
            background: C.bg2,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              at  t = {highlightCol}
            </div>

            {[
              { key: 'ft', label: 'ft', valStr: ft.toFixed(2),       interp: forgetInterp(ft),    color: C.accent    },
              { key: 'it', label: 'it', valStr: it.toFixed(2),       interp: inputInterp(it),     color: C.orange    },
              { key: 'ot', label: 'ot', valStr: ot.toFixed(2),       interp: outputInterp(ot),    color: C.purple    },
              { key: 'gt', label: 'c̃t', valStr: signedCell(gt),      interp: candidateInterp(gt), color: C.candidate },
              { key: 'ct', label: 'ct', valStr: signedCell(ct),       interp: null,               color: C.math      },
            ].map(({ key, label, valStr, interp, color }) => (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: interp ? '2px' : 0 }}>
                  <span style={{ ...mono, fontSize: '10px', color }}>{label}</span>
                  <span style={{ ...mono, fontSize: '13px', color }}>{valStr}</span>
                </div>
                {interp && (
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '10px',
                    color: C.mid, fontStyle: 'italic', lineHeight: 1.3,
                  }}>
                    {interp}
                  </div>
                )}
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${C.border}` }} />

            {[
              { key: 'mf', label: 'Mean forget gate',  val: meanF.toFixed(2), color: C.accent },
              { key: 'mi', label: 'Mean input gate',   val: meanI.toFixed(2), color: C.orange },
              { key: 'gr', label: 'Candidate range',   val: `${gMin.toFixed(2)} to ${gMax.toFixed(2)}`, color: C.candidate },
              { key: 'cr', label: 'Cell state range',  val: `${cMin.toFixed(2)} to ${cMax.toFixed(2)}`, color: C.math },
            ].map(({ key, label, val, color }) => (
              <div key={key}>
                <div style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                  {label}
                </div>
                <div style={{ ...mono, fontSize: '12px', color }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tooltip ──────────────────────────────────────────────────── */}
        {ttData && (
          <div style={{
            position: 'absolute',
            left: tleft,
            top: ttop,
            background: C.bg2,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '170px',
            maxWidth: '220px',
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: '11px',
              fontWeight: 600, color: C.text, marginBottom: '4px',
            }}>
              {ttData.name} · t={ttData.t}
            </div>
            <div style={{ ...mono, fontSize: '13px', color: C.accent, marginBottom: '4px' }}>
              {ttData.valStr}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: '11px',
              color: C.mid, fontStyle: 'italic',
            }}>
              {ttData.meaning}
            </div>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
