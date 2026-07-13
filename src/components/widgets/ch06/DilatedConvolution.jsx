import { useRef, useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Canvas geometry (base logical pixels) ─────────────────────────────
const GRID        = 16;
const CENTER      = 7;      // 0-indexed center cell
const BASE_W      = 480;    // base canvas width
const BASE_H      = 500;    // base canvas height (extra vertical room for labels)
const BASE_CELL   = 26;     // cell width/height
const BASE_GAP    = 2;      // gap between cells
const BASE_STEP   = BASE_CELL + BASE_GAP;            // 28
const BASE_GRID_PX = GRID * BASE_STEP - BASE_GAP;   // 446
const MX          = (BASE_W - BASE_GRID_PX) / 2;    // horizontal margin = 17
const MY          = (BASE_H - BASE_GRID_PX) / 2;    // vertical margin   = 27

// ── Colors ────────────────────────────────────────────────────────────
const ACCENT  = '#2dd4bf';
const ORANGE  = '#fb923c';
const BG3     = '#161616';
const BG2     = '#111111';
const BORDER  = '#242424';
const CODE_BG = '#0a0a0a';
const TEXT_MID  = '#888888';
const TEXT_MUTED = '#555555';
const GREEN   = '#34d399';
const mono    = "'JetBrains Mono', monospace";

// ── Button style ──────────────────────────────────────────────────────
function btn(active) {
  return {
    fontFamily: mono, fontSize: '11px', padding: '3px 9px',
    borderRadius: '3px', cursor: 'pointer',
    border: `1px solid ${active ? ACCENT : BORDER}`,
    background: active ? '#0b2422' : '#1e1e1e',
    color: active ? ACCENT : TEXT_MUTED,
  };
}

// ── Canvas draw ───────────────────────────────────────────────────────
function drawGrid(ctx, cw, ch, dilation, kernelSize, showGaps, showLines) {
  const sc   = cw / BASE_W;
  const cell = BASE_CELL * sc;
  const step = BASE_STEP * sc;
  const mx   = MX * sc;
  const my   = MY * sc;

  // cell pixel origin helpers
  const px = c => mx + c * step;
  const py = r => my + r * step;

  const halfK = kernelSize === 3 ? 1 : 2;
  const ks    = kernelSize === 3 ? [-1, 0, 1] : [-2, -1, 0, 1, 2];

  // Sampled positions
  const sampled = [];
  for (const i of ks)
    for (const j of ks)
      sampled.push({ row: CENTER + i * dilation, col: CENTER + j * dilation, i, j });

  const sampledSet = new Set(
    sampled
      .filter(s => s.row >= 0 && s.row < GRID && s.col >= 0 && s.col < GRID)
      .map(s => `${s.row},${s.col}`)
  );

  // Bounding box in grid coords
  const bbTop    = CENTER - halfK * dilation;
  const bbBottom = CENTER + halfK * dilation;
  const bbLeft   = CENTER - halfK * dilation;
  const bbRight  = CENTER + halfK * dilation;

  // ── Background ────────────────────────────────────────────────────
  ctx.fillStyle = CODE_BG;
  ctx.fillRect(0, 0, cw, ch);

  // ── Default cells ─────────────────────────────────────────────────
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      ctx.fillStyle = BG3;
      ctx.fillRect(px(c), py(r), cell, cell);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(px(c) + 0.5, py(r) + 0.5, cell - 1, cell - 1);
    }
  }

  // ── Gap cells (faint orange) ──────────────────────────────────────
  if (showGaps) {
    ctx.fillStyle = 'rgba(251,146,60,0.10)';
    for (let r = Math.max(0, bbTop); r <= Math.min(GRID - 1, bbBottom); r++) {
      for (let c = Math.max(0, bbLeft); c <= Math.min(GRID - 1, bbRight); c++) {
        if (!sampledSet.has(`${r},${c}`)) {
          ctx.fillRect(px(c), py(r), cell, cell);
        }
      }
    }
  }

  // ── Connecting lines (center → sampled, dashed) ───────────────────
  const cxPx = px(CENTER) + cell / 2;
  const cyPx = py(CENTER) + cell / 2;

  if (showLines) {
    ctx.save();
    ctx.setLineDash([3 * sc, 3 * sc]);
    ctx.strokeStyle = 'rgba(45,212,191,0.50)';
    ctx.lineWidth = 1.2;
    for (const s of sampled) {
      if (s.i === 0 && s.j === 0) continue;
      if (s.row < 0 || s.row >= GRID || s.col < 0 || s.col >= GRID) continue;
      ctx.beginPath();
      ctx.moveTo(cxPx, cyPx);
      ctx.lineTo(px(s.col) + cell / 2, py(s.row) + cell / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Sampled cells ─────────────────────────────────────────────────
  for (const s of sampled) {
    if (s.row < 0 || s.row >= GRID || s.col < 0 || s.col >= GRID) continue;
    const x = px(s.col), y = py(s.row);
    const isCenter = s.i === 0 && s.j === 0;

    ctx.fillStyle = isCenter ? '#ffffff' : 'rgba(45,212,191,0.85)';
    ctx.fillRect(x, y, cell, cell);
    ctx.strokeStyle = isCenter ? ACCENT : '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
  }

  // ── "center" label (background + text below center cell) ──────────
  const cLabelFontSize = Math.max(7, Math.round(9 * sc));
  ctx.font = `${cLabelFontSize}px ${mono}`;
  const cLabelW = ctx.measureText('center').width;
  const cLabelBgW = cLabelW + 8 * sc;
  const cLabelBgH = cLabelFontSize + 4 * sc;
  const cLabelBgX = cxPx - cLabelBgW / 2;
  const cLabelBgY = py(CENTER) + cell + 2 * sc;

  ctx.fillStyle = 'rgba(8,8,8,0.9)';
  ctx.fillRect(cLabelBgX, cLabelBgY, cLabelBgW, cLabelBgH);
  ctx.fillStyle = TEXT_MID;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('center', cxPx, cLabelBgY + 2 * sc);

  // ── Bounding box (orange dashed rect) ─────────────────────────────
  const bbX1 = px(Math.max(0, bbLeft))        - 3 * sc;
  const bbY1 = py(Math.max(0, bbTop))         - 3 * sc;
  const bbX2 = px(Math.min(GRID - 1, bbRight)) + cell + 3 * sc;
  const bbY2 = py(Math.min(GRID - 1, bbBottom)) + cell + 3 * sc;

  ctx.save();
  ctx.setLineDash([5 * sc, 4 * sc]);
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bbX1, bbY1, bbX2 - bbX1, bbY2 - bbY1);
  ctx.restore();

  // ── RF label (above bounding box top edge) ────────────────────────
  const rfSize     = kernelSize === 3 ? 2 * dilation + 1 : 4 * dilation + 1;
  const rfFontSize = Math.max(9, Math.round(11 * sc));
  ctx.font = `${rfFontSize}px ${mono}`;
  ctx.fillStyle = ORANGE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const rfLabelX = (bbX1 + bbX2) / 2;
  const rfLabelY = Math.max(rfFontSize + 3 * sc, bbY1 - 4 * sc);
  ctx.fillText(`Effective RF: ${rfSize}×${rfSize}`, rfLabelX, rfLabelY);
}

// ── Component ─────────────────────────────────────────────────────────
export default function DilatedConvolution() {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const fadeTimers   = useRef([]);

  const [cw,        setCw]        = useState(0);
  const [dilation,  setDilation]  = useState(1);
  const [kernelSize,setKernelSize]= useState(3);
  const [showGaps,  setShowGaps]  = useState(false);
  const [showLines, setShowLines] = useState(true);
  const [fading,    setFading]    = useState(false);

  // Measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 100) setCw(Math.floor(w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cw < 100) return;
    const ch  = Math.round(cw * (BASE_H / BASE_W));
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width  = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGrid(ctx, cw, ch, dilation, kernelSize, showGaps, showLines);
  }, [cw, dilation, kernelSize, showGaps, showLines]);

  // Cleanup fade timers on unmount
  useEffect(() => () => fadeTimers.current.forEach(clearTimeout), []);

  function changeDilation(d) {
    if (d === dilation) return;
    fadeTimers.current.forEach(clearTimeout);
    setFading(true);
    fadeTimers.current = [
      setTimeout(() => setDilation(d), 100),
      setTimeout(() => setFading(false), 250),
    ];
  }

  // ── Stats calculations ─────────────────────────────────────────────
  const numWeights  = kernelSize * kernelSize;
  const rfSize      = kernelSize === 3 ? 2 * dilation + 1 : 4 * dilation + 1;
  const rfArea      = rfSize * rfSize;
  const gapPx       = Math.max(0, rfArea - numWeights);
  const coveragePct = (numWeights / rfArea * 100).toFixed(1);

  const lbl = { fontFamily: mono, fontSize: '11px', color: TEXT_MUTED };

  function StatRow({ label, value, color = ACCENT }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
        <span style={{ fontFamily: mono, fontSize: '10px', color: TEXT_MUTED, lineHeight: 1.3 }}>
          {label}
        </span>
        <span style={{ fontFamily: mono, fontSize: '12px', color, marginLeft: '6px', flexShrink: 0 }}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <WidgetCard
      title="Dilated Convolution — large receptive field, same parameters"
      number="5.5"
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

        {/* Canvas */}
        <div ref={containerRef} style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              borderRadius: '6px',
              border: `1px solid ${BORDER}`,
              opacity: fading ? 0.55 : 1,
              transition: 'opacity 150ms ease',
            }}
          />
        </div>

        {/* Stats panel */}
        <div style={{
          width: '178px', flexShrink: 0, background: BG2,
          border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px',
        }}>
          <div style={{
            fontFamily: mono, fontSize: '9px', color: TEXT_MUTED,
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px',
          }}>
            Stats
          </div>

          <StatRow label="Kernel size" value={`${kernelSize}×${kernelSize} (${numWeights} wts)`} />
          <StatRow label="Dilation d" value={String(dilation)} />
          <StatRow label="Effective RF" value={`${rfSize}×${rfSize} = ${rfArea}px`} />
          <StatRow label="Sampled pixels" value={String(numWeights)} />
          <StatRow label="Gap pixels" value={String(gapPx)} />
          <StatRow
            label="Coverage ratio"
            value={`${coveragePct}%`}
            color={parseFloat(coveragePct) > 50 ? GREEN : ACCENT}
          />

          <div style={{ borderTop: `1px solid ${BORDER}`, margin: '10px 0 8px' }} />

          <div style={{ fontFamily: mono, fontSize: '9px', color: TEXT_MUTED, lineHeight: 1.65 }}>
            Equiv. standard kernel:
          </div>
          <div style={{ fontFamily: mono, fontSize: '9px', color: TEXT_MID, lineHeight: 1.65 }}>
            {rfSize}×{rfSize} = {rfArea} params
          </div>
          <div style={{
            fontFamily: mono, fontSize: '9px', color: ACCENT, lineHeight: 1.65, marginTop: '6px',
          }}>
            Dilated {kernelSize}×{kernelSize} uses just {numWeights} params
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Dilation — large pill buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={lbl}>Dilation d</span>
          {[1, 2, 4, 8].map(d => (
            <button
              key={d}
              onClick={() => changeDilation(d)}
              style={{
                fontFamily: mono, fontSize: '13px', fontWeight: 500,
                padding: '6px 18px', borderRadius: '20px', cursor: 'pointer',
                border: `1px solid ${dilation === d ? ACCENT : BORDER}`,
                background: dilation === d ? '#0b2422' : '#1e1e1e',
                color: dilation === d ? ACCENT : TEXT_MUTED,
                letterSpacing: '0.02em',
              }}
            >
              d = {d}
            </button>
          ))}
        </div>

        {/* Kernel size + toggles */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={lbl}>Kernel</span>
            {[3, 5].map(k => (
              <button key={k} onClick={() => setKernelSize(k)} style={btn(kernelSize === k)}>
                {k}×{k}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={lbl}>Show gaps</span>
            <button onClick={() => setShowGaps(v => !v)} style={btn(showGaps)}>
              {showGaps ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={lbl}>Show lines</span>
            <button onClick={() => setShowLines(v => !v)} style={btn(showLines)}>
              {showLines ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
