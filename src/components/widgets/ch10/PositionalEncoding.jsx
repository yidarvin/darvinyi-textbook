import { useState, useMemo, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  red:       '#f87171',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  textMid:   '#888888',
  text:      '#e8eaed',
  codeBg:    '#0a0a0a',
};
const mono  = { fontFamily: "'JetBrains Mono', monospace" };

// ── PE computation ─────────────────────────────────────────────────────────
function computePE(seqLen, dModel) {
  const pe = [];
  for (let pos = 0; pos < seqLen; pos++) {
    const row = [];
    for (let i = 0; i < dModel / 2; i++) {
      const div = Math.pow(10000, (2 * i) / dModel);
      row.push(Math.sin(pos / div));
      row.push(Math.cos(pos / div));
    }
    pe.push(row);
  }
  return pe;
}

// ── Color helpers ──────────────────────────────────────────────────────────
function lerpColor(hex1, hex2, t) {
  t = Math.max(0, Math.min(1, t));
  const p = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = p(hex1);
  const [r2, g2, b2] = p(hex2);
  return `rgb(${Math.round(r1 + t*(r2-r1))},${Math.round(g1 + t*(g2-g1))},${Math.round(b1 + t*(b2-b1))})`;
}

function peColor(v) {
  if (v < 0) return lerpColor('#f87171', '#1e1e1e', v + 1);
  return lerpColor('#1e1e1e', '#2dd4bf', v);
}

// ── Cosine similarity ──────────────────────────────────────────────────────
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom < 1e-10 ? 1 : dot / denom;
}

function l2norm(v) {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Stat({ label, val, color }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: '11px', color: color || C.accent, lineHeight: 1.3 }}>
        {val}
      </div>
    </div>
  );
}

function PillBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px',
      background: active ? C.accentDim : 'transparent',
      color: active ? C.accent : C.textMid,
      border: 'none',
      cursor: 'pointer',
      ...mono,
      fontSize: '11px',
      fontWeight: active ? 600 : 400,
      transition: 'background 150ms, color 150ms',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  );
}

function TabGroup({ children }) {
  return (
    <div style={{
      display: 'inline-flex',
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────
const CANVAS_W    = 560;
const LEFT_MARGIN = 40;
const BOT_MARGIN  = 32;

export default function PositionalEncoding({ tryThis }) {
  const [seqLen,      setSeqLen]      = useState(32);
  const [dModel,      setDModel]      = useState(64);
  const [viewMode,    setViewMode]    = useState('heatmap'); // 'heatmap' | 'slice'
  const [selectedPos, setSelectedPos] = useState(0);
  const [showSim,     setShowSim]     = useState(false);

  const pe = useMemo(() => computePE(seqLen, dModel), [seqLen, dModel]);

  const clampedPos = Math.min(selectedPos, seqLen - 1);

  const heatmapRef = useRef(null);
  const sliceRef   = useRef(null);

  // ── Draw heatmap ───────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'heatmap') return;
    const canvas = heatmapRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = CANVAS_W;
    const H = 300;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, 0, W, H);

    const plotW = W - LEFT_MARGIN;
    const plotH = H - BOT_MARGIN;
    const cellW = plotW / dModel;
    const cellH = plotH / seqLen;

    // Draw cells
    for (let pos = 0; pos < seqLen; pos++) {
      for (let dim = 0; dim < dModel; dim++) {
        const x = LEFT_MARGIN + dim * cellW;
        const y = pos * cellH;
        ctx.fillStyle = peColor(pe[pos][dim]);
        ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
      }
    }

    // Y-axis labels (position indices)
    const yLabelPositions = [0, Math.floor(seqLen/4), Math.floor(seqLen/2), Math.floor(3*seqLen/4), seqLen-1];
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const p of yLabelPositions) {
      const y = p * cellH + cellH / 2;
      ctx.fillText(String(p), LEFT_MARGIN - 4, y);
    }

    // X-axis labels (dimension indices)
    const xLabelDims = [0, 16, 32, 48, dModel - 1];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const d of xLabelDims) {
      const x = LEFT_MARGIN + d * cellW + cellW / 2;
      ctx.fillText(String(d), x, plotH + 4);
    }

    // Axis titles
    ctx.font = "10px 'Inter', sans-serif";
    ctx.fillStyle = C.muted;

    // "Position" — rotated 90°
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(10, plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Position', 0, 0);
    ctx.restore();

    // "Dimension"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Dimension', LEFT_MARGIN + plotW / 2, H);

    // ── Cosine similarity inset ──────────────────────────────────────────
    if (showSim && pe.length > 0) {
      const insetX = W - 130;
      const insetY = 8;
      const insetW = 122;
      const insetH = 82;

      ctx.fillStyle = C.bg3;
      ctx.fillRect(insetX, insetY, insetW, insetH);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(insetX, insetY, insetW, insetH);

      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Cosine sim to pos 0', insetX + 4, insetY + 3);

      const padL = 4, padR = 4, padT = 14, padB = 6;
      const pw = insetW - padL - padR;
      const ph = insetH - padT - padB;

      const sims = pe.map(row => cosineSim(pe[0], row));

      ctx.beginPath();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 1.5;
      for (let p = 0; p < sims.length; p++) {
        const x = insetX + padL + (p / (seqLen - 1)) * pw;
        const y = insetY + padT + (1 - sims[p]) * ph;
        if (p === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [viewMode, pe, seqLen, dModel, showSim]);

  // ── Draw 1D slice ──────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'slice') return;
    const canvas = sliceRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = CANVAS_W;
    const H = 200;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const padL = 48, padR = 16, padT = 28, padB = 32;
    const pw = W - padL - padR;
    const ph = H - padT - padB;

    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, 0, W, H);

    // Y range: -1.1 to 1.1
    const yMin = -1.1, yMax = 1.1;
    const toX = (dim) => padL + (dim / (dModel - 1)) * pw;
    const toY = (v)   => padT + (1 - (v - yMin) / (yMax - yMin)) * ph;

    // Horizontal dashed line y=0
    ctx.beginPath();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.moveTo(padL, toY(0));
    ctx.lineTo(padL + pw, toY(0));
    ctx.stroke();
    ctx.setLineDash([]);

    function drawLine(posIdx, color, width, dashed) {
      if (posIdx < 0 || posIdx >= seqLen) return;
      const row = pe[posIdx];
      ctx.beginPath();
      if (dashed) ctx.setLineDash([4, 3]);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      for (let dim = 0; dim < dModel; dim++) {
        const x = toX(dim);
        const y = toY(row[dim]);
        if (dim === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Neighboring positions
    drawLine(clampedPos - 1, C.borderLt, 1, true);
    drawLine(clampedPos + 1, C.borderLt, 1, true);
    // Main line
    drawLine(clampedPos, C.accent, 2, false);

    // X-axis ticks
    const xTicks = [0, 16, 32, 48, dModel - 1];
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const d of xTicks) {
      ctx.fillText(String(d), toX(d), padT + ph + 4);
    }

    // Y-axis ticks
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const v of [-1, 0, 1]) {
      ctx.fillText(String(v), padL - 4, toY(v));
    }

    // "Position N" annotation
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = C.accent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Position ${clampedPos}`, padL + 4, padT + 4);

    // Axis titles
    ctx.font = "10px 'Inter', sans-serif";
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Dimension', padL + pw / 2, H);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(10, padT + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('PE value', 0, 0);
    ctx.restore();
  }, [viewMode, pe, seqLen, dModel, clampedPos]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const simToPos0 = cosineSim(pe[0] || [], pe[clampedPos] || []);
  const norm      = pe[clampedPos] ? l2norm(pe[clampedPos]) : 0;
  const midDim    = Math.floor(dModel / 2);

  return (
    <WidgetCard title="Positional Encoding — sinusoidal position fingerprints" number="10.2" tryThis={tryThis}>

      {/* ── Controls row ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '14px' }}>

        {/* View mode */}
        <div>
          <div style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
            View mode
          </div>
          <TabGroup>
            {['heatmap', 'slice'].map((mode, i) => (
              <div key={mode} style={{ borderRight: i === 0 ? `1px solid ${C.border}` : 'none' }}>
                <PillBtn active={viewMode === mode} onClick={() => setViewMode(mode)}>
                  {mode === 'heatmap' ? 'Heatmap' : '1D Slice'}
                </PillBtn>
              </div>
            ))}
          </TabGroup>
        </div>

        {/* d_model selector */}
        <div>
          <div style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
            d_model
          </div>
          <TabGroup>
            {[64, 128, 256].map((d, i, arr) => (
              <div key={d} style={{ borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <PillBtn active={dModel === d} onClick={() => setDModel(d)}>
                  {d}
                </PillBtn>
              </div>
            ))}
          </TabGroup>
        </div>

        {/* Sequence length slider */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sequence length
            </span>
            <span style={{ ...mono, fontSize: '11px', color: C.accent }}>
              {seqLen} positions
            </span>
          </div>
          <input
            type="range" min={8} max={64} step={4} value={seqLen}
            onChange={e => setSeqLen(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Conditional: position slider (slice mode) or show similarity toggle (heatmap mode) */}
        {viewMode === 'slice' && (
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Position
              </span>
              <span style={{ ...mono, fontSize: '11px', color: C.accent }}>
                {clampedPos}
              </span>
            </div>
            <input
              type="range" min={0} max={seqLen - 1} step={1} value={clampedPos}
              onChange={e => setSelectedPos(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {viewMode === 'heatmap' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', paddingBottom: '2px' }}>
            <input
              type="checkbox"
              checked={showSim}
              onChange={e => setShowSim(e.target.checked)}
              style={{ accentColor: C.accent }}
            />
            <span style={{ ...mono, fontSize: '11px', color: C.muted }}>Show similarity</span>
          </label>
        )}
      </div>

      {/* ── Canvas + Stats ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Canvas area */}
        <div style={{ flex: 1, minWidth: 0, background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
          {viewMode === 'heatmap' ? (
            <canvas
              ref={heatmapRef}
              style={{ width: '100%', display: 'block' }}
            />
          ) : (
            <canvas
              ref={sliceRef}
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </div>

        {/* Stats panel */}
        <div style={{
          width: 180,
          flexShrink: 0,
          background: C.bg2,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {viewMode === 'heatmap' ? (
            <>
              <Stat label="Sequence length" val={String(seqLen)} />
              <Stat label="d_model"         val={String(dModel)} />
              <Stat label="Total PE values" val={`${seqLen} × ${dModel} = ${seqLen * dModel}`} />
              <Stat label="PE value range"  val="-1.000 to 1.000" />
              <Stat label="Unique positions" val={String(seqLen)} />
            </>
          ) : (
            <>
              <Stat label="Position"             val={String(clampedPos)} />
              <Stat label={`PE[${clampedPos}][0]`}  val={pe[clampedPos] ? pe[clampedPos][0].toFixed(3) : '—'} />
              <Stat label={`PE[${clampedPos}][1]`}  val={pe[clampedPos] ? pe[clampedPos][1].toFixed(3) : '—'} />
              <Stat label={`PE[${clampedPos}][${midDim}]`} val={pe[clampedPos] ? pe[clampedPos][midDim].toFixed(3) : '—'} />
              <Stat label="L2 norm"              val={norm.toFixed(3)} />
              <Stat label="Cos sim to pos 0"     val={simToPos0.toFixed(3)} />
            </>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
