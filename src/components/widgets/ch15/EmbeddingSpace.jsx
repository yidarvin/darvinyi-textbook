import { useState, useRef, useMemo, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  bg2:     '#111111',
  bg3:     '#161616',
  bg4:     '#1e1e1e',
  border:  '#242424',
  borderLt:'#2e2e2e',
  muted:   '#555555',
  textMid: '#888888',
  text:    '#e8eaed',
  codeBg:  '#0a0a0a',
  accent:  '#2dd4bf',
  green:   '#34d399',
  orange:  '#fb923c',
  purple:  '#a78bfa',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

const CAT_COLORS = { animals: C.accent, vehicles: C.orange, nature: C.green };
const MOD_COLORS = { image: C.accent, text: C.purple };

const EMBEDDINGS = {
  cat:      { img: [-0.68,  0.58], txt: [-0.63,  0.54], cat: 'animals'  },
  dog:      { img: [-0.51,  0.69], txt: [-0.46,  0.65], cat: 'animals'  },
  tiger:    { img: [-0.59,  0.41], txt: [-0.54,  0.37], cat: 'animals'  },
  car:      { img: [ 0.61, -0.52], txt: [ 0.56, -0.47], cat: 'vehicles' },
  truck:    { img: [ 0.72, -0.31], txt: [ 0.67, -0.27], cat: 'vehicles' },
  plane:    { img: [ 0.44, -0.68], txt: [ 0.40, -0.63], cat: 'vehicles' },
  tree:     { img: [-0.29, -0.58], txt: [-0.25, -0.53], cat: 'nature'   },
  flower:   { img: [-0.48, -0.38], txt: [-0.44, -0.34], cat: 'nature'   },
  mountain: { img: [ 0.12,  0.79], txt: [ 0.08,  0.74], cat: 'nature'   },
  ocean:    { img: [ 0.31,  0.51], txt: [ 0.27,  0.47], cat: 'nature'   },
  sunset:   { img: [ 0.51,  0.29], txt: [ 0.46,  0.25], cat: 'nature'   },
  snow:     { img: [ 0.19,  0.68], txt: [ 0.15,  0.63], cat: 'nature'   },
};

const ALL_POINTS = Object.entries(EMBEDDINGS).flatMap(([concept, data]) => [
  { concept, modality: 'image', pos: data.img, cat: data.cat },
  { concept, modality: 'text',  pos: data.txt, cat: data.cat },
]);

const VW = 480, VH = 420, PAD = 36;
const UW = VW - 2 * PAD;
const UH = VH - 2 * PAD;

const sx = (x) => PAD + (x + 1) / 2 * UW;
const sy = (y) => PAD + (1 - y) / 2 * UH;

const dist2d = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);

// ── Precomputed global stats ───────────────────────────────────────────────────
const GLOBAL_STATS = (() => {
  const concepts = Object.keys(EMBEDDINGS);
  const avgPairDist = concepts.reduce((s, c) => s + dist2d(EMBEDDINGS[c].img, EMBEDDINGS[c].txt), 0) / concepts.length;

  let withinSum = 0, withinCnt = 0, crossSum = 0, crossCnt = 0;
  for (let i = 0; i < ALL_POINTS.length; i++) {
    for (let j = i + 1; j < ALL_POINTS.length; j++) {
      const d = dist2d(ALL_POINTS[i].pos, ALL_POINTS[j].pos);
      if (ALL_POINTS[i].cat === ALL_POINTS[j].cat) { withinSum += d; withinCnt++; }
      else { crossSum += d; crossCnt++; }
    }
  }
  return {
    avgPairDist,
    avgWithin: withinSum / withinCnt,
    avgCross:  crossSum / crossCnt,
    sep:       (crossSum / crossCnt) / (withinSum / withinCnt),
  };
})();

// ── Category ellipses ─────────────────────────────────────────────────────────
const CAT_ELLIPSES = Object.fromEntries(
  ['animals', 'vehicles', 'nature'].map(cat => {
    const pts = ALL_POINTS.filter(p => p.cat === cat);
    const xs  = pts.map(p => p.pos[0]);
    const ys  = pts.map(p => p.pos[1]);
    const pad = 0.12;
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return [cat, {
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      rx: (maxX - minX) / 2 + pad,
      ry: (maxY - minY) / 2 + pad,
    }];
  })
);

const NN_STYLES = [
  { width: 2.5, opacity: 0.9 },
  { width: 1.8, opacity: 0.6 },
  { width: 1.2, opacity: 0.35 },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function StatRow({ label, val, color }) {
  return (
    <div style={{ marginBottom: '9px' }}>
      <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: '11px', color: color || C.accent, lineHeight: 1.2 }}>
        {val}
      </div>
    </div>
  );
}

function SDivider() {
  return <div style={{ height: '1px', background: C.border, margin: '8px 0 10px' }} />;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input
        type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: C.accent, width: 12, height: 12, cursor: 'pointer' }}
      />
      <span style={{ ...mono, fontSize: '10px', color: C.muted }}>{label}</span>
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmbeddingSpace({ tryThis }) {
  const [selected,   setSelected]   = useState(null); // { concept, modality }
  const [hovered,    setHovered]    = useState(null); // { concept, modality }
  const [colorBy,    setColorBy]    = useState('category');
  const [showLabels, setShowLabels] = useState(true);
  const [showPairs,  setShowPairs]  = useState(true);
  const [showZones,  setShowZones]  = useState(false);
  const [zoom,       setZoom]       = useState(1.0);
  const [pan,        setPan]        = useState({ x: 0, y: 0 });
  const [dragging,   setDragging]   = useState(false);
  const dragStart = useRef(null);
  const panStart  = useRef(null);

  const getColor = useCallback((p) =>
    colorBy === 'modality' ? MOD_COLORS[p.modality] : CAT_COLORS[p.cat]
  , [colorBy]);

  const nnData = useMemo(() => {
    if (!selected) return null;
    const sel = ALL_POINTS.find(p => p.concept === selected.concept && p.modality === selected.modality);
    if (!sel) return null;
    const others = ALL_POINTS
      .filter(p => !(p.concept === selected.concept && p.modality === selected.modality))
      .map(p => ({ p, d: dist2d(sel.pos, p.pos) }))
      .sort((a, b) => a.d - b.d);
    return { sel, nn: others.slice(0, 3) };
  }, [selected]);

  const pairDist = useMemo(() => {
    if (!selected) return null;
    const otherMod = selected.modality === 'image' ? 'text' : 'image';
    const sel   = ALL_POINTS.find(p => p.concept === selected.concept && p.modality === selected.modality);
    const other = ALL_POINTS.find(p => p.concept === selected.concept && p.modality === otherMod);
    return { d: dist2d(sel.pos, other.pos), otherMod };
  }, [selected]);

  const isSelected = (p) => selected && p.concept === selected.concept && p.modality === selected.modality;
  const isNNPoint  = (p) => nnData && nnData.nn.some(n => n.p.concept === p.concept && n.p.modality === p.modality);
  const getOpacity = (p) => {
    if (!selected) return 1;
    if (isSelected(p) || isNNPoint(p)) return 1;
    return 0.25;
  };

  function onMouseDown(e) {
    if (zoom <= 1.0) return;
    const tag = e.target.tagName.toLowerCase();
    if (!['rect', 'svg', 'line', 'ellipse'].includes(tag)) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current  = { x: pan.x, y: pan.y };
    e.preventDefault();
  }
  function onMouseMove(e) {
    if (!dragging || !dragStart.current) return;
    const svgEl = e.currentTarget;
    const rect  = svgEl.getBoundingClientRect();
    const scaleX = VW / rect.width;
    const scaleY = VH / rect.height;
    const dx = (e.clientX - dragStart.current.x) * scaleX / zoom;
    const dy = (e.clientY - dragStart.current.y) * scaleY / zoom;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }
  function onMouseUp() { setDragging(false); }

  function handleBgClick(e) {
    if (!dragging && e.target === e.currentTarget) setSelected(null);
  }
  function handlePointClick(e, concept, modality) {
    e.stopPropagation();
    if (selected?.concept === concept && selected?.modality === modality) setSelected(null);
    else setSelected({ concept, modality });
  }

  const transform = `translate(${VW / 2},${VH / 2}) scale(${zoom}) translate(${-VW / 2 + pan.x},${-VH / 2 + pan.y})`;
  const GRID = [-0.5, 0, 0.5];

  return (
    <WidgetCard title="Embedding Space — image and text clustered by concept" number="15.2" tryThis={tryThis}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* ── SVG canvas ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, background: C.codeBg, borderRadius: '6px', overflow: 'hidden' }}>
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            width="100%"
            style={{ display: 'block', cursor: dragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default', userSelect: 'none' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={handleBgClick}
          >
            <rect width={VW} height={VH} fill={C.codeBg} />

            <g transform={transform}>

              {/* Grid */}
              {GRID.map(v => (
                <g key={v}>
                  <line x1={sx(v)} y1={PAD} x2={sx(v)} y2={VH - PAD}
                    stroke={C.border} strokeWidth="1" style={{ pointerEvents: 'none' }} />
                  <line x1={PAD} y1={sy(v)} x2={VW - PAD} y2={sy(v)}
                    stroke={C.border} strokeWidth="1" style={{ pointerEvents: 'none' }} />
                </g>
              ))}

              {/* Category zone ellipses */}
              {showZones && Object.entries(CAT_ELLIPSES).map(([cat, e]) => (
                <ellipse key={cat}
                  cx={sx(e.cx)} cy={sy(e.cy)}
                  rx={e.rx * UW / 2} ry={e.ry * UH / 2}
                  fill={CAT_COLORS[cat]} fillOpacity={0.04}
                  stroke="none" style={{ pointerEvents: 'none' }}
                />
              ))}

              {/* Pair connecting lines */}
              {showPairs && Object.entries(EMBEDDINGS).map(([concept, data]) => {
                const active = selected?.concept === concept;
                const op = selected && !active ? 0.08 : 0.3;
                const color = colorBy === 'modality' ? C.textMid : CAT_COLORS[data.cat];
                return (
                  <line key={`pair-${concept}`}
                    x1={sx(data.img[0])} y1={sy(data.img[1])}
                    x2={sx(data.txt[0])} y2={sy(data.txt[1])}
                    stroke={color} strokeWidth="1" strokeOpacity={op}
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })}

              {/* NN lines */}
              {nnData && nnData.nn.map(({ p, d }, i) => {
                const x1 = sx(nnData.sel.pos[0]), y1 = sy(nnData.sel.pos[1]);
                const x2 = sx(p.pos[0]),           y2 = sy(p.pos[1]);
                const mx = (x1 + x2) / 2,          my = (y1 + y2) / 2;
                const s  = NN_STYLES[i];
                return (
                  <g key={`nn-${i}`} style={{ pointerEvents: 'none' }}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={C.accent} strokeWidth={s.width} strokeOpacity={s.opacity} />
                    <text x={mx} y={my - 3} textAnchor="middle"
                      fill={C.accent} fontSize="8" fontFamily="JetBrains Mono, monospace"
                      opacity={s.opacity}>
                      {d.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Concept labels (above image point) */}
              {showLabels && Object.entries(EMBEDDINGS).map(([concept, data]) => {
                const imgPt = ALL_POINTS.find(p => p.concept === concept && p.modality === 'image');
                const color = colorBy === 'modality' ? MOD_COLORS.image : CAT_COLORS[data.cat];
                return (
                  <text key={`lbl-${concept}`}
                    x={sx(data.img[0])} y={sy(data.img[1]) - 13}
                    textAnchor="middle" fill={color} fontSize="9"
                    fontFamily="Inter, sans-serif"
                    opacity={getOpacity(imgPt)}
                    style={{ pointerEvents: 'none' }}
                  >
                    {concept}
                  </text>
                );
              })}

              {/* Text embeddings — rounded squares (draw before circles so circles on top) */}
              {ALL_POINTS.filter(p => p.modality === 'text').map(p => {
                const cx   = sx(p.pos[0]), cy = sy(p.pos[1]);
                const hov  = hovered?.concept === p.concept && hovered?.modality === p.modality;
                const sel  = isSelected(p);
                const size = hov ? 18 : 14;
                return (
                  <rect key={`${p.concept}-text`}
                    x={cx - size / 2} y={cy - size / 2} width={size} height={size}
                    rx={3} ry={3}
                    fill={getColor(p)} stroke="white" strokeWidth={sel ? 3 : 1.5}
                    opacity={getOpacity(p)}
                    style={{
                      cursor: 'pointer',
                      filter: sel ? 'drop-shadow(0 0 5px rgba(255,255,255,0.45))' : undefined,
                    }}
                    onMouseEnter={() => setHovered({ concept: p.concept, modality: p.modality })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={e => handlePointClick(e, p.concept, p.modality)}
                  />
                );
              })}

              {/* Image embeddings — circles */}
              {ALL_POINTS.filter(p => p.modality === 'image').map(p => {
                const cx  = sx(p.pos[0]), cy = sy(p.pos[1]);
                const hov = hovered?.concept === p.concept && hovered?.modality === p.modality;
                const sel = isSelected(p);
                const r   = hov ? 12 : 8;
                return (
                  <circle key={`${p.concept}-image`}
                    cx={cx} cy={cy} r={r}
                    fill={getColor(p)} stroke="white" strokeWidth={sel ? 3 : 1.5}
                    opacity={getOpacity(p)}
                    style={{
                      cursor: 'pointer',
                      filter: sel ? 'drop-shadow(0 0 5px rgba(255,255,255,0.45))' : undefined,
                    }}
                    onMouseEnter={() => setHovered({ concept: p.concept, modality: p.modality })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={e => handlePointClick(e, p.concept, p.modality)}
                  />
                );
              })}

              {/* Hover tooltip */}
              {hovered && (() => {
                const p = ALL_POINTS.find(pt => pt.concept === hovered.concept && pt.modality === hovered.modality);
                if (!p) return null;
                const cx      = sx(p.pos[0]);
                const cy      = sy(p.pos[1]);
                const offset  = p.modality === 'image' ? 16 : 14;
                const label   = `${p.concept} — ${p.modality} embedding`;
                const tipW    = label.length * 5.8 + 16;
                const tipX    = Math.min(Math.max(cx, tipW / 2 + PAD), VW - tipW / 2 - PAD);
                const tipY    = cy - offset - 8;
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect x={tipX - tipW / 2} y={tipY - 15} width={tipW} height={18}
                      rx={3} fill={C.bg2} stroke={C.border} strokeWidth="1" />
                    <text x={tipX} y={tipY - 4} textAnchor="middle"
                      fill={C.text} fontSize="11" fontFamily="JetBrains Mono, monospace">
                      {label}
                    </text>
                  </g>
                );
              })()}

              {/* Legend */}
              <g transform={`translate(${PAD}, ${VH - 15})`} style={{ pointerEvents: 'none' }}>
                <circle cx={0} cy={-1} r={5} fill={C.muted} stroke="white" strokeWidth="0.8" />
                <text x={9} y={3} fontSize="8" fontFamily="Inter, sans-serif" fill={C.muted}>image embed</text>
                <rect x={80} y={-8} width={10} height={10} rx={2} fill={C.muted} stroke="white" strokeWidth="0.8" />
                <text x={94} y={3} fontSize="8" fontFamily="Inter, sans-serif" fill={C.muted}>text embed</text>
              </g>

            </g>
          </svg>
        </div>

        {/* ── Stats panel ─────────────────────────────────────────────────── */}
        <div style={{
          width: 180, flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '14px',
        }}>
          {!selected ? (
            <>
              <StatRow label="Total points"  val="24 (12 img + 12 txt)" />
              <StatRow label="Concepts"      val="12" />
              <StatRow label="Categories"    val="3" color={C.textMid} />
              <SDivider />
              <StatRow label="Avg within-pair dist" val={GLOBAL_STATS.avgPairDist.toFixed(3)} />
              <SDivider />
              <StatRow label="Avg within-category"  val={GLOBAL_STATS.avgWithin.toFixed(3)} color={C.green}  />
              <StatRow label="Avg cross-category"   val={GLOBAL_STATS.avgCross.toFixed(3)}  color={C.orange} />
              <StatRow label="Separation ratio"
                val={GLOBAL_STATS.sep.toFixed(2)}
                color={GLOBAL_STATS.sep > 2 ? C.green : C.accent}
              />
            </>
          ) : (
            <>
              <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Selected</div>
              <div style={{ ...mono, fontSize: '11px', color: C.accent, marginBottom: '8px', lineHeight: 1.4 }}>
                {selected.concept} — {selected.modality}
              </div>
              {(() => {
                const p = ALL_POINTS.find(pt => pt.concept === selected.concept && pt.modality === selected.modality);
                return <StatRow label="Position" val={`(${p.pos[0].toFixed(2)}, ${p.pos[1].toFixed(2)})`} color={C.textMid} />;
              })()}
              <SDivider />
              {nnData?.nn.map(({ p, d }, i) => (
                <StatRow key={i}
                  label={`Nearest ${i + 1}`}
                  val={`${p.concept} ${p.modality.slice(0, 3)}  d=${d.toFixed(2)}`}
                  color={C.textMid}
                />
              ))}
              <SDivider />
              {pairDist && (
                <>
                  <StatRow label="Own pair dist" val={pairDist.d.toFixed(3)} />
                  <StatRow label="Cross-modal nn"
                    val={nnData?.nn[0]?.p.modality !== selected.modality ? 'yes' : 'no'}
                    color={nnData?.nn[0]?.p.modality !== selected.modality ? C.green : C.textMid}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Color by */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Color by
          </span>
          {['category', 'modality'].map(opt => (
            <button key={opt}
              onClick={() => setColorBy(opt)}
              style={{
                ...mono, fontSize: '10px',
                padding: '3px 10px', borderRadius: '4px',
                border: `1px solid ${colorBy === opt ? C.accent : C.borderLt}`,
                background: colorBy === opt ? 'rgba(45,212,191,0.12)' : C.bg4,
                color: colorBy === opt ? C.accent : C.textMid,
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Show toggles */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Toggle label="Labels"         checked={showLabels} onChange={setShowLabels} />
          <Toggle label="Pair lines"     checked={showPairs}  onChange={setShowPairs}  />
          <Toggle label="Category zones" checked={showZones}  onChange={setShowZones}  />
        </div>

        {/* Zoom slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Zoom
            </span>
            <span style={{ ...mono, fontSize: '11px', color: C.accent }}>
              {zoom.toFixed(1)}×
            </span>
          </div>
          <input
            type="range" min={1.0} max={3.0} step={0.1} value={zoom}
            onChange={e => {
              const v = Number(e.target.value);
              setZoom(v);
              if (v <= 1.0) setPan({ x: 0, y: 0 });
            }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </WidgetCard>
  );
}
