import { useRef, useState, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

// ── Input image (12×12, fixed synthetic pattern) ────────────────────
const INPUT_IMG = (() => {
  const img = Array.from({ length: 12 }, () => new Array(12).fill(0));
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      if (r < 6 && c < 6) {
        img[r][c] = (r + c) % 2 === 0 ? 0.9 : 0.15;
      } else if (r < 6) {
        img[r][c] = 0.1 + ((c - 6) / 5) * 0.8;
      } else if (c < 6) {
        img[r][c] = 0.5;
      } else {
        img[r][c] = (r - 6) + (c - 6) < 5 ? 0.8 : 0.2;
      }
    }
  }
  return img;
})();

// ── Kernels ─────────────────────────────────────────────────────────
const KERNELS = {
  'Edge Detect': [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
  'Blur':        [[1, 2, 1], [2, 4, 2], [1, 2, 1]].map(r => r.map(v => v / 16)),
  'Sharpen':     [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  'Emboss':      [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
};
const FILTER_NAMES = ['Edge Detect', 'Blur', 'Sharpen', 'Emboss'];

// ── Padded inputs (precomputed) ──────────────────────────────────────
const PADDED = {
  Valid: INPUT_IMG,
  Same: Array.from({ length: 14 }, (_, r) =>
    Array.from({ length: 14 }, (_, c) =>
      r >= 1 && r <= 12 && c >= 1 && c <= 12 ? INPUT_IMG[r - 1][c - 1] : 0
    )
  ),
};

// ── Precompute all 16 output maps ────────────────────────────────────
function computeOutput(filterName, stride, padding) {
  const kernel = KERNELS[filterName];
  const input  = PADDED[padding];
  const inH = input.length, inW = input[0].length;
  const outH = Math.floor((inH - 3) / stride) + 1;
  const outW = Math.floor((inW - 3) / stride) + 1;

  const raw = Array.from({ length: outH }, (_, r) =>
    Array.from({ length: outW }, (_, c) => {
      let sum = 0;
      for (let kr = 0; kr < 3; kr++)
        for (let kc = 0; kc < 3; kc++)
          sum += input[r * stride + kr][c * stride + kc] * kernel[kr][kc];
      return sum;
    })
  );

  let min = Infinity, max = -Infinity;
  raw.forEach(row => row.forEach(v => { if (v < min) min = v; if (v > max) max = v; }));
  const range = max - min || 1;
  const normalized = raw.map(row => row.map(v => (v - min) / range));
  return { raw, normalized, outH, outW };
}

const OUTPUTS = {};
for (const f of FILTER_NAMES) {
  OUTPUTS[f] = {};
  for (const s of [1, 2]) {
    OUTPUTS[f][s] = {};
    for (const p of ['Valid', 'Same'])
      OUTPUTS[f][s][p] = computeOutput(f, s, p);
  }
}

// ── Canvas layout — fully dynamic, computed from measured width ───────
// Both grids are the same pixel size; the kernel sits exactly between them.
const CH     = 280;
const KDIV_W = 56;  // center column reserved for kernel display (3×14 + margins)

// Given cw, compute all layout values for the draw call.
function layout(cw, outW) {
  // Each grid gets half the space after the kernel column and outer margins (8px each side).
  const gridBudget = Math.floor((cw - KDIV_W - 16) / 2);
  const inCell  = Math.min(20, Math.max(6, Math.floor((gridBudget - 11) / 12)));
  const inGrid  = 12 * inCell + 11;           // actual pixel width of input grid (square)

  // Center the trio [inGrid | KDIV_W | inGrid] in the canvas
  const leftOff = Math.floor((cw - (2 * inGrid + KDIV_W)) / 2);
  const inX0    = leftOff;
  const inY0    = Math.floor((CH - inGrid) / 2);
  const divX    = inX0 + inGrid;              // left edge of kernel column
  const outX0   = divX + KDIV_W;             // left edge of output area

  // Output cell: fill the same pixel width as the input grid
  const outCell = Math.max(4, Math.floor((inGrid - (outW - 1)) / outW));
  const outGridW = outW * outCell + (outW - 1);
  const outGridH = outW === outW ? outW * outCell + (outW - 1) : 0; // placeholder; caller uses outH
  const oXOff   = outX0 + Math.floor((inGrid - outGridW) / 2);

  // Kernel cells: 14 px each, 1 px gap → 44 px total
  const kcell = 14, kgrid = 3 * kcell + 2;   // 44
  const kx0   = divX + Math.floor((KDIV_W - kgrid) / 2);
  const ky0   = Math.floor((CH - kgrid) / 2);

  return { inCell, inGrid, inX0, inY0, divX, outX0, outCell, outGridW, oXOff, kcell, kgrid, kx0, ky0 };
}

// ── Colors ───────────────────────────────────────────────────────────
const ACCENT   = '#2dd4bf';
const BG4      = '#1e1e1e';
const CODE_BG  = '#0a0a0a';
const TEXT_MID = '#888888';
const TEXT     = '#e8eaed';
const RED      = '#f87171';

function gray(v) {
  const g = Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${g},${g},${g})`;
}
function kernelColor(v, maxAbs) {
  if (maxAbs === 0) return BG4;
  const a = (Math.abs(v) / maxAbs) * 0.75 + 0.2;
  return v < 0 ? `rgba(248,113,113,${a.toFixed(2)})` : v > 0 ? `rgba(45,212,191,${a.toFixed(2)})` : BG4;
}

// ── Draw ─────────────────────────────────────────────────────────────
function draw(ctx, position, filterName, stride, padding, cw) {
  const { outH, outW, normalized } = OUTPUTS[filterName][stride][padding];
  const curRow = Math.floor(position / outW);
  const curCol = position % outW;

  const L = layout(cw, outW);
  const { inCell, inGrid, inX0, inY0, divX, outX0, outCell, oXOff, kcell, kgrid, kx0, ky0 } = L;

  ctx.fillStyle = CODE_BG;
  ctx.fillRect(0, 0, cw, CH);

  // Input grid
  for (let r = 0; r < 12; r++)
    for (let c = 0; c < 12; c++) {
      ctx.fillStyle = gray(INPUT_IMG[r][c]);
      ctx.fillRect(inX0 + c * (inCell + 1), inY0 + r * (inCell + 1), inCell, inCell);
    }

  // Receptive field overlay
  const rfR0 = padding === 'Same' ? curRow * stride - 1 : curRow * stride;
  const rfC0 = padding === 'Same' ? curCol * stride - 1 : curCol * stride;
  for (let kr = 0; kr < 3; kr++)
    for (let kc = 0; kc < 3; kc++) {
      const ir = rfR0 + kr, ic = rfC0 + kc;
      if (ir >= 0 && ir < 12 && ic >= 0 && ic < 12) {
        ctx.fillStyle = 'rgba(45,212,191,0.15)';
        ctx.fillRect(inX0 + ic * (inCell + 1), inY0 + ir * (inCell + 1), inCell, inCell);
      }
    }

  // Teal border around receptive field (clamped to valid input)
  const bR0 = Math.max(0, rfR0), bR1 = Math.min(11, rfR0 + 2);
  const bC0 = Math.max(0, rfC0), bC1 = Math.min(11, rfC0 + 2);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    inX0 + bC0 * (inCell + 1) - 1,
    inY0 + bR0 * (inCell + 1) - 1,
    (bC1 - bC0) * (inCell + 1) + inCell + 2,
    (bR1 - bR0) * (inCell + 1) + inCell + 2
  );

  // Kernel display — centered between the two grids
  const kernel  = KERNELS[filterName];
  const maxAbsK = Math.max(...kernel.flat().map(Math.abs), 0.001);
  const kCenterX = divX + KDIV_W / 2;

  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('kernel', kCenterX, ky0 - 6);

  for (let kr = 0; kr < 3; kr++)
    for (let kc = 0; kc < 3; kc++) {
      ctx.fillStyle = kernelColor(kernel[kr][kc], maxAbsK);
      ctx.fillRect(kx0 + kc * (kcell + 1), ky0 + kr * (kcell + 1), kcell, kcell);
    }

  ctx.font = '14px sans-serif';
  ctx.fillStyle = TEXT_MID;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('→', kCenterX, ky0 + kgrid + 12);

  // Output grid — same pixel width as input grid, centered in its area
  const outGridH = outH * outCell + (outH - 1);
  const oYOff    = Math.floor((CH - outGridH) / 2);

  for (let r = 0; r < outH; r++)
    for (let c = 0; c < outW; c++) {
      ctx.fillStyle = (r === curRow && c === curCol) ? ACCENT : gray(normalized[r][c]);
      ctx.fillRect(oXOff + c * (outCell + 1), oYOff + r * (outCell + 1), outCell, outCell);
    }
}

// ── Style helpers ─────────────────────────────────────────────────────
const mono = "'JetBrains Mono', monospace";

const tabStyle = active => ({
  fontFamily: mono, fontSize: '11px', padding: '4px 10px',
  borderRadius: '4px', cursor: 'pointer',
  border: `1px solid ${active ? '#2dd4bf' : '#242424'}`,
  background: active ? '#0b2422' : '#1e1e1e',
  color: active ? '#2dd4bf' : '#555555',
});
const smBtn = active => ({
  fontFamily: mono, fontSize: '11px', padding: '3px 9px',
  borderRadius: '3px', cursor: 'pointer',
  border: `1px solid ${active ? '#2dd4bf' : '#242424'}`,
  background: active ? '#0b2422' : '#1e1e1e',
  color: active ? '#2dd4bf' : '#555555',
});
const primaryBtn = {
  fontFamily: mono, fontSize: '11px', padding: '4px 14px', borderRadius: '4px',
  cursor: 'pointer', border: '1px solid #2dd4bf', background: '#0b2422', color: '#2dd4bf',
};
const secBtn = {
  fontFamily: mono, fontSize: '11px', padding: '4px 10px', borderRadius: '4px',
  cursor: 'pointer', border: '1px solid #242424', background: '#1e1e1e', color: '#555555',
};
const lbl = { fontFamily: mono, fontSize: '11px', color: '#555555' };

// ── Component ─────────────────────────────────────────────────────────
export default function ConvolutionExplorer() {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const animRef      = useRef(null);
  const playingRef   = useRef(false);
  const frameRef     = useRef(0);
  const speedRef     = useRef(1);
  const totalRef     = useRef(100);

  // Pause the continuous play loop when scrolled off-screen; never auto-run for reduced motion.
  const [cardRef, isVisible]   = useIsVisible();
  const prefersReducedMotion   = usePrefersReducedMotion();
  const isVisibleRef           = useRef(true);
  isVisibleRef.current = isVisible;

  const [cw,       setCw]       = useState(0);
  const [filter,   setFilter]   = useState('Edge Detect');
  const [stride,   setStride]   = useState(1);
  const [padding,  setPadding]  = useState('Valid');
  const [playing,  setPlaying]  = useState(false);
  const [position, setPosition] = useState(0);
  const [speed,    setSpeed]    = useState(1);

  const { outH, outW, raw } = OUTPUTS[filter][stride][padding];
  const total  = outH * outW;
  const curRow = Math.floor(position / outW);
  const curCol = position % outW;

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { totalRef.current = total; }, [total]);

  // Measure container width, keep canvas in sync
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

  // Resize + redraw whenever cw or drawing params change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cw < 100) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = cw * dpr;
    canvas.height = CH * dpr;
    canvas.style.width  = `${cw}px`;
    canvas.style.height = `${CH}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, position, filter, stride, padding, cw);
  }, [cw, position, filter, stride, padding]);

  // Animation loop
  const animate = useCallback(() => {
    frameRef.current = (frameRef.current + 1) % 120;
    const fpStep = speedRef.current === 5 ? 1 : speedRef.current === 2 ? 3 : 6;
    if (frameRef.current % fpStep === 0) {
      setPosition(prev => {
        const next = prev + 1;
        if (next >= totalRef.current) {
          playingRef.current = false;
          setPlaying(false);
          return prev;
        }
        return next;
      });
    }
    if (playingRef.current && isVisibleRef.current) {
      animRef.current = requestAnimationFrame(animate);
    } else {
      animRef.current = null; // off-screen: the visibility effect resumes this when it scrolls back in
    }
  }, []);

  // ── Resume the loop if it scrolls back into view mid-play ─────
  useEffect(() => {
    if (isVisible && playingRef.current && !animRef.current) {
      animRef.current = requestAnimationFrame(animate);
    }
  }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
  }, []);

  const play = () => {
    if (prefersReducedMotion) return; // reduced motion: no continuous auto-play
    if (position >= total - 1) return;
    playingRef.current = true;
    setPlaying(true);
    frameRef.current = 0;
    animRef.current = requestAnimationFrame(animate);
  };

  const reset = (newFilter, newStride, newPadding) => {
    pause();
    setPosition(0);
    if (newFilter  !== undefined) setFilter(newFilter);
    if (newStride  !== undefined) setStride(newStride);
    if (newPadding !== undefined) setPadding(newPadding);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // Dot product
  const kernel      = KERNELS[filter];
  const paddedInput = PADDED[padding];
  const dpTerms = [];
  for (let kr = 0; kr < 3; kr++)
    for (let kc = 0; kc < 3; kc++)
      dpTerms.push({ iv: paddedInput[curRow * stride + kr][curCol * stride + kc], kv: kernel[kr][kc] });
  const dpResult  = dpTerms.reduce((s, t) => s + t.iv * t.kv, 0);
  const rawOutVal = raw[curRow]?.[curCol] ?? 0;
  const totalMACs = outH * outW * 9;

  const stats = [
    ['Input',    '12 × 12'],
    ['Kernel',   '3 × 3'],
    ['Stride',   String(stride)],
    ['Padding',  padding],
    ['Output',   `${outH} × ${outW}`],
    ['Position', `r${curRow} c${curCol}`],
    ['Value',    rawOutVal.toFixed(4)],
    ['MACs',     totalMACs.toLocaleString()],
  ];

  return (
    <WidgetCard ref={cardRef} title="Convolution Explorer — watch the kernel slide" number="5.1">

      {/* Canvas — fills full widget width */}
      <div ref={containerRef} style={{ width: '100%' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', borderRadius: '6px', border: '1px solid #242424' }}
        />
      </div>

      {/* Stats grid — 4 columns × 2 rows */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        marginTop: '10px',
      }}>
        {stats.map(([key, val]) => (
          <div key={key} style={{
            background: '#111111', border: '1px solid #242424',
            borderRadius: '5px', padding: '6px 10px',
          }}>
            <div style={{ fontFamily: mono, fontSize: '9px', color: '#555555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>
              {key}
            </div>
            <div style={{ fontFamily: mono, fontSize: '12px', color: key === 'Value' ? ACCENT : TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {val}
            </div>
          </div>
        ))}
      </div>

      {/* Dot product display */}
      <div style={{
        marginTop: '8px', background: CODE_BG, border: '1px solid #242424',
        borderRadius: '5px', padding: '8px 12px',
        fontFamily: mono, fontSize: '11px', lineHeight: 1.6,
      }}>
        <span style={{ color: TEXT_MID }}>patch · kernel = </span>
        {dpTerms.slice(0, 3).map((t, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: TEXT_MID }}> + </span>}
            <span style={{ color: TEXT }}>{t.iv.toFixed(2)}</span>
            <span style={{ color: TEXT_MID }}> × </span>
            <span style={{ color: t.kv < 0 ? RED : t.kv > 0 ? ACCENT : TEXT_MID }}>{t.kv.toFixed(2)}</span>
          </span>
        ))}
        <span style={{ color: TEXT_MID }}> + …  </span>
        <span style={{ color: ACCENT }}>= {dpResult.toFixed(4)}</span>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {FILTER_NAMES.map(f => (
            <button key={f} onClick={() => reset(f)} style={tabStyle(filter === f)}>{f}</button>
          ))}
        </div>

        {/* Stride + Padding */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={lbl}>Stride</span>
            {[1, 2].map(s => (
              <button key={s} onClick={() => reset(undefined, s)} style={smBtn(stride === s)}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={lbl}>Padding</span>
            {['Valid', 'Same'].map(p => (
              <button key={p} onClick={() => reset(undefined, undefined, p)} style={smBtn(padding === p)}>{p}</button>
            ))}
          </div>
        </div>

        {/* Play controls + position slider + speed */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={playing ? pause : play}
            disabled={prefersReducedMotion}
            title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
            style={{
              ...primaryBtn,
              cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
              opacity: prefersReducedMotion ? 0.5 : 1,
            }}
          >{playing ? '⏸ Pause' : '▶ Play'}</button>
          <button onClick={() => { pause(); setPosition(p => Math.min(p + 1, total - 1)); }} style={secBtn}>Step →</button>
          <button onClick={() => reset()} style={secBtn}>↺ Reset</button>

          <span style={lbl}>Pos</span>
          <input
            type="range" min={0} max={total - 1} value={position}
            onChange={e => { pause(); setPosition(Number(e.target.value)); }}
            style={{
              flex: 1, minWidth: '60px', appearance: 'none', WebkitAppearance: 'none',
              height: '2px', background: '#2e2e2e', borderRadius: '2px', outline: 'none', cursor: 'pointer',
            }}
          />
          <span style={{ fontFamily: mono, fontSize: '11px', color: ACCENT, minWidth: '40px' }}>
            {position}/{total - 1}
          </span>

          <span style={lbl}>Speed</span>
          {[1, 2, 5].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={smBtn(speed === s)}>{s}×</button>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
