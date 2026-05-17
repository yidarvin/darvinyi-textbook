import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Colors ───────────────────────────────────────────────────────────
const ACCENT    = '#2dd4bf';
const ORANGE    = '#fb923c';
const BORDER    = '#242424';
const BORDER_LT = '#2e2e2e';
const TEXT_MID  = '#888888';
const TEXT_MUTED= '#555555';
const CODE_BG   = '#0a0a0a';
const BG2       = '#111111';
const GREEN     = '#34d399';
const mono      = "'JetBrains Mono', monospace";

// ── RF math ──────────────────────────────────────────────────────────
function effK(k, d) { return k + (k - 1) * (d - 1); }

// Spatial size at each layer; sizes[0] = 32.
function computeSizes(n, s) {
  const a = [32];
  for (let i = 0; i < n; i++) a.push(Math.ceil(a[a.length - 1] / s));
  return a;
}

// RF in input pixels at each layer; rfs[0] = 1.
// Formula: RF_l = RF_{l-1} + (kEff - 1) × ∏strides_0..l-1
function computeRFs(n, k, s, d) {
  const ke = effK(k, d);
  const r = [1];
  let sp = 1;
  for (let i = 0; i < n; i++) { r.push(r[r.length - 1] + (ke - 1) * sp); sp *= s; }
  return r;
}

// How many neurons in layer `to` does one neuron in layer `from` depend on?
// Runs the RF formula over just the layers [to..from).
function rfSpanInLayer(from, to, k, s, d) {
  const ke = effK(k, d);
  let rf = 1, sp = 1;
  for (let i = to; i < from; i++) { rf += (ke - 1) * sp; sp *= s; }
  return rf;
}

// ── SVG 2-column snake grid layout ───────────────────────────────────
// Layer i → grid row = floor(i/2), grid col = i%2
// 2 columns of 280px each = 560px wide SVG.
const SVG_W   = 560;
const CELL_W  = SVG_W / 2;    // 280
const CELL_H  = 155;
const PAD_Y   = 22;
const DOT_R   = 5;
const DOT_GAP = 14;
const GN      = 6;
const GSZ     = (GN - 1) * DOT_GAP;  // 70px grid extent

// Space below grid dots reserved for labels
const LABEL_H = 30;
// Grid center y within a cell: center in (CELL_H - LABEL_H)
const CY_IN_CELL = (CELL_H - LABEL_H) / 2;  // 62.5

function layerCXY(i) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  return {
    cx: col * CELL_W + CELL_W / 2,
    cy: PAD_Y + row * CELL_H + CY_IN_CELL,
  };
}

function svgH(numLayers) {
  return PAD_Y + Math.ceil((numLayers + 1) / 2) * CELL_H + PAD_Y;
}

// Dot center position within a 6×6 grid
function dotXY(cx, cy, r, c) {
  return { x: cx - GSZ / 2 + c * DOT_GAP, y: cy - GSZ / 2 + r * DOT_GAP };
}

// ── RF rect math ──────────────────────────────────────────────────────
// Convert neuron index in a layer of `sz` neurons → display offset within GSZ.
// Handles sz=1 (single neuron → center).
function neuronToDisp(idx, sz) {
  if (sz <= 1) return GSZ / 2;
  return (idx / (sz - 1)) * GSZ;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Build RF rect(s) for a clicked neuron.
// Returns { rects: [{x,y,w,h,primary}], annotX, annotY, rfSize }
function buildRFRects(clicked, sizes, kernelSize, stride, dilation, showIntermed) {
  if (!clicked) return { rects: [], annotX: 0, annotY: 0, rfSize: 0 };

  const { layer: cL, row: cRow, col: cCol } = clicked;
  const szL = sizes[cL];

  // Map 6×6 dot → actual neuron index in layer cL
  const aRow = Math.round(cRow * (szL - 1) / (GN - 1));
  const aCol = Math.round(cCol * (szL - 1) / (GN - 1));

  const rects = [];

  for (let m = 0; m < cL; m++) {
    const primary = (m === 0);
    if (!primary && !showIntermed) continue;

    const szM = sizes[m];
    const { cx: cmx, cy: cmy } = layerCXY(m);
    const gx = cmx - GSZ / 2;
    const gy = cmy - GSZ / 2;

    // Center of RF projection at layer m (in m's neuron-index space).
    // A neuron at aRow in layer cL traces back to position
    // aRow * stride^(cL-m) in layer m.
    const ctrRow = aRow * Math.pow(stride, cL - m);
    const ctrCol = aCol * Math.pow(stride, cL - m);

    // RF footprint at layer m in neurons.
    const rfN = rfSpanInLayer(cL, m, kernelSize, stride, dilation);

    // Scale: 1 neuron = (GSZ / (szM-1)) display pixels.
    // If szM=1 the whole grid represents one neuron, scale = GSZ.
    const scM = szM > 1 ? GSZ / (szM - 1) : GSZ;

    // RF display size — capped at GSZ (full-grid highlight when RF > layer).
    const rfD = Math.min(rfN * scM, GSZ);

    // Display center — clamped to grid bounds.
    const dcRow = clamp(neuronToDisp(ctrRow, szM), 0, GSZ);
    const dcCol = clamp(neuronToDisp(ctrCol, szM), 0, GSZ);

    // Rect top-left: keep rect inside grid [0, GSZ - rfD].
    const rx = gx + clamp(dcCol - rfD / 2, 0, Math.max(0, GSZ - rfD));
    const ry = gy + clamp(dcRow - rfD / 2, 0, Math.max(0, GSZ - rfD));

    rects.push({ x: rx, y: ry, w: rfD, h: rfD, primary });
  }

  const inputRect = rects[0];
  const rfSize    = Math.round(rfSpanInLayer(cL, 0, kernelSize, stride, dilation));
  const annotX    = inputRect ? inputRect.x + inputRect.w / 2 : 0;
  const annotY    = inputRect ? Math.max(14, inputRect.y - 6) : 0;

  return { rects, annotX, annotY, rfSize };
}

// ── Button style ─────────────────────────────────────────────────────
function btn(active) {
  return {
    fontFamily: mono, fontSize: '11px', padding: '3px 9px', borderRadius: '3px',
    cursor: 'pointer', border: `1px solid ${active ? ACCENT : BORDER}`,
    background: active ? '#0b2422' : '#1e1e1e', color: active ? ACCENT : TEXT_MUTED,
  };
}
const lbl = { fontFamily: mono, fontSize: '11px', color: TEXT_MUTED };

// ── Component ─────────────────────────────────────────────────────────
export default function ReceptiveField() {
  const [numLayers,    setNumLayers]    = useState(3);
  const [kernelSize,   setKernelSize]   = useState(3);
  const [stride,       setStride]       = useState(2);
  const [dilation,     setDilation]     = useState(1);
  const [showIntermed, setShowIntermed] = useState(true);
  const [clicked,      setClicked]      = useState(null); // { layer, row, col }

  const sizes = computeSizes(numLayers, stride);
  const rfs   = computeRFs(numLayers, kernelSize, stride, dilation);

  function handleDot(layer, row, col) {
    if (layer === 0) return;
    setClicked(prev =>
      prev && prev.layer === layer && prev.row === row && prev.col === col
        ? null : { layer, row, col }
    );
  }

  function resetControls(u) {
    setClicked(null);
    if (u.numLayers  !== undefined) setNumLayers(u.numLayers);
    if (u.kernelSize !== undefined) setKernelSize(u.kernelSize);
    if (u.stride     !== undefined) setStride(u.stride);
    if (u.dilation   !== undefined) setDilation(u.dilation);
  }

  const { rects, annotX, annotY, rfSize } =
    buildRFRects(clicked, sizes, kernelSize, stride, dilation, showIntermed);

  const deepRF   = rfs[numLayers];
  const coverage = Math.min(100, deepRF * deepRF / (32 * 32) * 100).toFixed(1);
  const SH       = svgH(numLayers);

  return (
    <WidgetCard title="Receptive Field — what each neuron sees" number="5.2">
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

        {/* SVG — 2-column snake grid, height scales with numLayers */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg
            width="100%" viewBox={`0 0 ${SVG_W} ${SH}`}
            style={{ display: 'block', background: CODE_BG, borderRadius: '6px', border: `1px solid ${BORDER}` }}
          >
            {/* RF rectangles — drawn under dots */}
            {rects.map((r, i) => (
              <rect key={i}
                x={r.x} y={r.y} width={Math.max(r.w, 1)} height={Math.max(r.h, 1)}
                fill={r.primary ? 'rgba(45,212,191,0.15)' : 'rgba(251,146,60,0.12)'}
                stroke={r.primary ? ACCENT : ORANGE}
                strokeWidth={r.primary ? 2 : 1.5}
                strokeDasharray={r.primary ? undefined : '3 2'}
              />
            ))}

            {/* RF annotation above input rect */}
            {clicked && rects.length > 0 && (
              <text x={annotX} y={annotY}
                textAnchor="middle" fontFamily={mono} fontSize="10" fill={ACCENT}>
                RF: {rfSize} × {rfSize} px
              </text>
            )}

            {/* Layer columns */}
            {Array.from({ length: numLayers + 1 }, (_, i) => {
              const { cx, cy } = layerCXY(i);
              return (
                <g key={i}>
                  {/* Dots */}
                  {Array.from({ length: GN }, (_, r) =>
                    Array.from({ length: GN }, (_, c) => {
                      const { x, y } = dotXY(cx, cy, r, c);
                      const active   = clicked?.layer === i && clicked?.row === r && clicked?.col === c;
                      return (
                        <circle key={`${r}-${c}`}
                          cx={x} cy={y} r={DOT_R}
                          fill={active ? ACCENT : BORDER_LT}
                          style={{ cursor: i > 0 ? 'pointer' : 'default' }}
                          onClick={() => handleDot(i, r, c)}
                        />
                      );
                    })
                  )}
                  {/* Labels */}
                  <text x={cx} y={cy + GSZ / 2 + 16}
                    textAnchor="middle" fontFamily={mono} fontSize="10" fill={TEXT_MID}>
                    {i === 0 ? 'Input' : `L${i}`}
                  </text>
                  <text x={cx} y={cy + GSZ / 2 + 28}
                    textAnchor="middle" fontFamily={mono} fontSize="9" fill={TEXT_MUTED}>
                    {sizes[i]}×{sizes[i]}
                  </text>
                </g>
              );
            })}
          </svg>

          <div style={{ fontFamily: mono, fontSize: '10px', color: TEXT_MUTED, marginTop: '6px', textAlign: 'center' }}>
            click a neuron in any conv layer to reveal its receptive field
          </div>
        </div>

        {/* Stats panel */}
        <div style={{
          width: '178px', flexShrink: 0, background: BG2,
          border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px',
        }}>
          <div style={{ fontFamily: mono, fontSize: '9px', color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
            RF Size
          </div>
          {rfs.map((rf, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', color: TEXT_MUTED }}>
                {i === 0 ? 'Input' : `L${i}`}
              </span>
              <span style={{ fontFamily: mono, fontSize: '12px', color: i === 0 ? TEXT_MID : ACCENT }}>
                {rf} × {rf}
              </span>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${BORDER}`, margin: '10px 0 8px' }} />
          <div style={{ fontFamily: mono, fontSize: '9px', color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Coverage (L{numLayers})
          </div>
          <div style={{ fontFamily: mono, fontSize: '20px', color: parseFloat(coverage) >= 80 ? GREEN : ACCENT }}>
            {coverage}%
          </div>
          <div style={{ fontFamily: mono, fontSize: '9px', color: TEXT_MUTED, marginTop: '1px' }}>
            of 32×32 input
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, margin: '10px 0 8px' }} />
          <div style={{ fontFamily: mono, fontSize: '9px', color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Clicked
          </div>
          {clicked ? (
            <>
              <div style={{ fontFamily: mono, fontSize: '11px', color: ACCENT }}>
                (r{clicked.row}, c{clicked.col})
              </div>
              <div style={{ fontFamily: mono, fontSize: '11px', color: TEXT_MID }}>
                Layer {clicked.layer}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: mono, fontSize: '11px', color: TEXT_MUTED }}>—</div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={lbl}>Num layers</span>
            <input type="range" min={1} max={4} step={1} value={numLayers}
              onChange={e => resetControls({ numLayers: Number(e.target.value) })}
              style={{ width: '72px', appearance: 'none', WebkitAppearance: 'none', height: '2px', background: BORDER_LT, borderRadius: '2px', outline: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: mono, fontSize: '11px', color: ACCENT }}>{numLayers}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={lbl}>Kernel</span>
            {[3, 5, 7].map(k => (
              <button key={k} style={btn(kernelSize === k)} onClick={() => resetControls({ kernelSize: k })}>{k}×{k}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={lbl}>Stride</span>
            {[1, 2].map(s => (
              <button key={s} style={btn(stride === s)} onClick={() => resetControls({ stride: s })}>{s}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={lbl}>Dilation</span>
            {[1, 2, 4].map(d => (
              <button key={d} style={btn(dilation === d)} onClick={() => resetControls({ dilation: d })}>{d}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={lbl}>Show intermediate RFs</span>
          <button style={btn(showIntermed)} onClick={() => setShowIntermed(v => !v)}>
            {showIntermed ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}
