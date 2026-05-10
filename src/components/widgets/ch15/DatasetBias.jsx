import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Data ──────────────────────────────────────────────────────────────────────

const IMAGENET_CLASSES = [
  { name: "Dog breeds",      pct: 11.7, note: "117 distinct dog breed classes" },
  { name: "Bird species",    pct: 5.9,  note: "59 bird species" },
  { name: "Insects",         pct: 2.7,  note: "Many exotic species rarely seen" },
  { name: "Fruits/Food",     pct: 2.6,  note: "Western food items" },
  { name: "Vehicles",        pct: 2.6,  note: "Cars, trucks, planes, boats" },
  { name: "Sports equip.",   pct: 1.9,  note: "Mostly American sports" },
  { name: "Fish",            pct: 1.6,  note: "Aquatic animals" },
  { name: "Reptiles",        pct: 1.4,  note: "Snakes, lizards, turtles" },
  { name: "Architecture",    pct: 1.4,  note: "Mostly Western buildings" },
  { name: "Clothing",        pct: 1.3,  note: "Mostly Western fashion" },
  { name: "Fungi/Mushrooms", pct: 1.2,  note: "Foraged foods" },
  { name: "Tools",           pct: 1.1,  note: "Hardware and workshop tools" },
  { name: "Furniture",       pct: 1.0,  note: "Household items" },
  { name: "Musical instr.",  pct: 0.9,  note: "Mostly Western instruments" },
  { name: "Other",           pct: 56.7, note: "600+ remaining classes", isOther: true },
];

const IMAGENET_GEO = [
  { region: "USA",          pct: 42, color: '#2dd4bf', note: "Flickr dominant source, US users" },
  { region: "Europe",       pct: 28, color: '#fb923c', note: "UK, Germany, France" },
  { region: "East Asia",    pct: 14, color: '#a78bfa', note: "Japan, South Korea, Taiwan" },
  { region: "Rest of Asia", pct: 8,  color: '#fbbf24', note: "India, Southeast Asia" },
  { region: "Other",        pct: 8,  color: '#2e2e2e', note: "Africa, Latin America, Middle East" },
];

const COMMONCRAWL_LANGS = [
  { name: "English",    pct: 46.0, note: "Dominant web language globally" },
  { name: "German",     pct: 8.5,  note: "2nd largest Wikipedia" },
  { name: "French",     pct: 7.5,  note: "Major European language" },
  { name: "Russian",    pct: 5.5,  note: "Large web presence" },
  { name: "Japanese",   pct: 4.0,  note: "High web penetration" },
  { name: "Spanish",    pct: 4.0,  note: "500M+ speakers, underrepresented" },
  { name: "Portuguese", pct: 3.5,  note: "Brazil has large web presence" },
  { name: "Chinese",    pct: 3.0,  note: "1.4B speakers, under-indexed" },
  { name: "Italian",    pct: 2.5,  note: "European language" },
  { name: "Dutch",      pct: 2.0,  note: "High web penetration per capita" },
  { name: "Other",      pct: 13.5, note: "7000+ other languages combined", isOther: true },
];

const COMMONCRAWL_GEO = [
  { region: "North America", pct: 38, color: '#2dd4bf', note: "US-hosted domains dominant" },
  { region: "Europe",        pct: 35, color: '#fb923c', note: "Western European servers" },
  { region: "East Asia",     pct: 14, color: '#a78bfa', note: "Japan, South Korea, China" },
  { region: "Rest of world", pct: 13, color: '#fbbf24', note: "All other regions combined" },
];

const DATASETS = {
  imagenet: {
    label: 'ImageNet',
    classes: IMAGENET_CLASSES,
    geo: IMAGENET_GEO,
    xMax: 60,
    totalCats: '1000 classes',
    uniformPct: 0.1,
    chartTitle: 'ImageNet — Superclass Distribution',
    consequence: 'Models trained on ImageNet can identify 117 dog breeds but have no concept of most tools used in Africa, food in South Asia, or architecture outside the Western world.',
    missing: 'Africa, Latin America, and South/Southeast Asia represent ~65% of the world\'s population but an estimated 8–13% of ImageNet\'s source images.',
    keyImbalance: 'Dogs (11.7%) vs all food (2.6%)',
    worldPopTop3: 33,
  },
  commoncrawl: {
    label: 'Common Crawl',
    classes: COMMONCRAWL_LANGS,
    geo: COMMONCRAWL_GEO,
    xMax: 50,
    totalCats: '~7000 languages',
    uniformPct: 0.014,
    chartTitle: 'Common Crawl — Language Share',
    consequence: 'Models trained on Common Crawl speak English far more fluently than Swahili, Hindi, or Yoruba — even though more humans speak those languages than several of the overrepresented ones.',
    missing: '7000+ human languages are compressed into 13.5% of Common Crawl. A model trained on this data \'knows\' less about the majority of human linguistic experience.',
    keyImbalance: 'English (46%) vs Hindi (~0.1%)',
    worldPopTop3: 33,
  },
};

// ── Colors ────────────────────────────────────────────────────────────────────

const C = {
  accent:   '#2dd4bf',
  orange:   '#fb923c',
  purple:   '#a78bfa',
  math:     '#fbbf24',
  borderLt: '#2e2e2e',
  border:   '#242424',
  bg2:      '#111111',
  bg3:      '#161616',
  bg4:      '#1e1e1e',
  codeBg:   '#0a0a0a',
  mid:      '#888888',
  muted:    '#555555',
  text:     '#e8eaed',
  prose:    '#b8c4cc',
};

function lerpColor(a, b, t) {
  const h = s => [
    parseInt(s.slice(1,3),16),
    parseInt(s.slice(3,5),16),
    parseInt(s.slice(5,7),16),
  ];
  const [ar,ag,ab] = h(a), [br,bg,bb] = h(b);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}

function barColor(idx) {
  if (idx === 0) return C.accent;
  if (idx < 4)  return lerpColor(C.accent, C.orange, idx / 3);
  if (idx < 8)  return C.orange;
  return C.borderLt;
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx, cy, outerR, innerR, startAngle, endAngle) {
  const s1 = polarToCartesian(cx, cy, outerR, startAngle);
  const e1 = polarToCartesian(cx, cy, outerR, endAngle);
  const s2 = polarToCartesian(cx, cy, innerR, endAngle);
  const e2 = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
    `Z`,
  ].join(' ');
}

// ── Bar Chart (Canvas) ────────────────────────────────────────────────────────

const BAR_H  = 18;
const BAR_GAP = 6;
const PAD_L  = 92;
const PAD_R  = 44;
const PAD_T  = 28;
const PAD_B  = 18;

function BarChart({ dataset, topN, showUniform, animKey }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const progRef   = useRef(1);

  const ds = DATASETS[dataset];
  const mainItems = ds.classes.filter(d => !d.isOther);
  const otherItem = ds.classes.find(d => d.isOther);
  const shown = [...mainItems.slice(0, topN), ...(otherItem ? [otherItem] : [])];

  const draw = useCallback((progress) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    if (!W || !H) return;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const xMax   = ds.xMax;
    const chartW = W - PAD_L - PAD_R;

    // Title
    ctx.font = `11px 'Inter', sans-serif`;
    ctx.fillStyle = C.text;
    ctx.textAlign = 'left';
    ctx.fillText(ds.chartTitle, PAD_L, 18);

    shown.forEach((item, i) => {
      const y    = PAD_T + i * (BAR_H + BAR_GAP);
      const barW = Math.max(0, (item.pct / xMax) * chartW * progress);

      if (item.isOther) {
        ctx.fillStyle = C.bg4;
        ctx.fillRect(PAD_L, y, barW, BAR_H);
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(PAD_L + 0.5, y + 0.5, barW - 1, BAR_H - 1);
        ctx.restore();
      } else {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = barColor(i);
        ctx.fillRect(PAD_L, y, barW, BAR_H);
        ctx.globalAlpha = 1;
      }

      // Category label
      ctx.font = `11px 'JetBrains Mono', monospace`;
      ctx.fillStyle = C.mid;
      ctx.textAlign = 'right';
      ctx.fillText(item.name, PAD_L - 6, y + BAR_H - 4);

      // Percentage label
      if (progress > 0.15 && barW > 4) {
        ctx.font = `10px 'JetBrains Mono', monospace`;
        ctx.fillStyle = C.mid;
        ctx.textAlign = 'left';
        ctx.fillText(`${item.pct}%`, PAD_L + barW + 4, y + BAR_H - 4);
      }
    });

    // Uniform baseline
    if (showUniform) {
      const ux = PAD_L + (ds.uniformPct / xMax) * chartW;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ux, PAD_T - 6);
      ctx.lineTo(ux, PAD_T + shown.length * (BAR_H + BAR_GAP) - BAR_GAP);
      ctx.stroke();
      ctx.restore();
      ctx.font = `8px 'Inter', sans-serif`;
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'center';
      ctx.fillText('Uniform', ux, PAD_T - 9);
    }
  }, [dataset, topN, showUniform, shown, ds]);

  // Trigger animation on animKey change
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    progRef.current = 0;
    const start = performance.now();
    const dur   = 400;
    function frame(now) {
      const t = Math.min((now - start) / dur, 1);
      const p = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
      progRef.current = p;
      draw(p);
      if (t < 1) animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [animKey, draw]);

  // Draw on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw(progRef.current));
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

// ── Donut Chart (SVG) ─────────────────────────────────────────────────────────

const CX = 100, CY = 100, OUTER_R = 82, INNER_R = 35;
const VW = 200, VH = 215;

function DonutChart({ dataset }) {
  const [hovered, setHovered] = useState(null);
  const [vis, setVis]         = useState(dataset);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    setOpacity(0);
    const t = setTimeout(() => { setVis(dataset); setOpacity(1); }, 200);
    return () => clearTimeout(t);
  }, [dataset]);

  const geo = DATASETS[vis].geo;

  let cum = 0;
  const segs = geo.map((seg, i) => {
    const start = cum;
    cum += seg.pct * 3.6;
    const end   = cum;
    const mid   = start + (end - start) / 2;
    return { ...seg, startAngle: start, endAngle: end, midAngle: mid, idx: i };
  });

  const hov = hovered !== null ? segs[hovered] : null;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      style={{ display: 'block', transition: 'opacity 0.2s', opacity }}
    >
      {segs.map(seg => {
        const isH = hovered === seg.idx;
        const d   = describeArc(CX, CY, OUTER_R, INNER_R, seg.startAngle, seg.endAngle);
        const lpt = polarToCartesian(CX, CY, OUTER_R + 14, seg.midAngle);
        const isSmall = seg.pct < 6;

        return (
          <g
            key={seg.region}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(seg.idx)}
            onMouseLeave={() => setHovered(null)}
          >
            <path
              d={d}
              fill={seg.color}
              fillOpacity={isH ? 1 : 0.8}
              style={{
                transform: isH ? `scale(1.04)` : 'scale(1)',
                transformOrigin: `${CX}px ${CY}px`,
                transition: 'transform 0.15s, fill-opacity 0.15s',
              }}
            />
            {!isSmall && !isH && (
              <text
                x={lpt.x}
                y={lpt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7.5"
                fontFamily="'Inter', sans-serif"
                fill={seg.color}
                style={{ pointerEvents: 'none' }}
              >
                {seg.region} {seg.pct}%
              </text>
            )}
            {isSmall && (
              (() => {
                const inner = polarToCartesian(CX, CY, OUTER_R + 3, seg.midAngle);
                const outer = polarToCartesian(CX, CY, OUTER_R + 18, seg.midAngle);
                const anchor = outer.x > CX ? 'start' : 'end';
                const dx = outer.x > CX ? 3 : -3;
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={seg.color} strokeWidth="0.8" />
                    <text x={outer.x + dx} y={outer.y} textAnchor={anchor} dominantBaseline="middle"
                      fontSize="7" fontFamily="'Inter', sans-serif" fill={seg.color}>
                      {seg.pct}%
                    </text>
                  </g>
                );
              })()
            )}
          </g>
        );
      })}

      {/* Center readout */}
      {hov ? (
        <>
          <text x={CX} y={CY - 7} textAnchor="middle" fontSize="14"
            fontFamily="'JetBrains Mono', monospace" fill={hov.color} fontWeight="600">
            {hov.pct}%
          </text>
          <text x={CX} y={CY + 8} textAnchor="middle" fontSize="7"
            fontFamily="'Inter', sans-serif" fill={C.mid}>
            {hov.region}
          </text>
        </>
      ) : (
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="8"
          fontFamily="'Inter', sans-serif" fill={C.muted}>
          hover
        </text>
      )}

      {/* Chart title */}
      <text x={CX} y={VH - 6} textAnchor="middle" fontSize="9.5"
        fontFamily="'Inter', sans-serif" fill={C.text}>
        Geographic Origin (estimated)
      </text>
    </svg>
  );
}

// ── Stat Row (small) ──────────────────────────────────────────────────────────

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', padding: '3px 0' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: C.muted, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: color || C.accent, textAlign: 'right', minWidth: 0 }}>
        {value}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DatasetBias() {
  const [dataset, setDataset]       = useState('imagenet');
  const [topN, setTopN]             = useState(10);
  const [showUniform, setShowUniform] = useState(true);
  const [animKey, setAnimKey]       = useState(0);

  const changeDataset = (d) => { setDataset(d); setAnimKey(k => k + 1); };
  const changeTopN    = (n) => { setTopN(n);    setAnimKey(k => k + 1); };

  const ds        = DATASETS[dataset];
  const mainItems = ds.classes.filter(d => !d.isOther);
  const shown     = mainItems.slice(0, topN);
  const top10Sum  = mainItems.slice(0, 10).reduce((s, d) => s + d.pct, 0).toFixed(1);
  const topCat    = shown[0];
  const botCat    = shown[shown.length - 1];
  const geo       = ds.geo;
  const top3Sum   = geo.slice(0, 3).reduce((s, d) => s + d.pct, 0);
  const domReg    = geo[0];
  const covGap    = top3Sum - ds.worldPopTop3;

  // Dynamic bar chart container height
  const nBars    = Math.min(topN, mainItems.length) + 1; // +1 for Other
  const chartH   = PAD_T + PAD_B + nBars * (BAR_H + BAR_GAP);

  const tabStyle = (active) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    padding: '4px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? C.accent : C.muted,
    transition: 'all 0.15s',
  });

  const topNStyle = (active) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '4px',
    border: `1px solid ${active ? C.accent : C.border}`,
    cursor: 'pointer',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? C.accent : C.muted,
  });

  return (
    <WidgetCard title="Dataset Bias — class and geographic distribution" number="15.3">

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '2px', background: C.bg4, borderRadius: '6px', padding: '2px' }}>
          {['imagenet', 'commoncrawl'].map(d => (
            <button key={d} onClick={() => changeDataset(d)} style={tabStyle(dataset === d)}>
              {DATASETS[d].label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showUniform}
            onChange={e => setShowUniform(e.target.checked)}
            style={{ accentColor: C.accent, width: 12, height: 12 }}
          />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: C.muted }}>
            Uniform baseline
          </span>
        </label>

        <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />

        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: C.muted }}>Top</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[5, 10, 15].map(n => (
            <button key={n} onClick={() => changeTopN(n)} style={topNStyle(topN === n)}>{n}</button>
          ))}
        </div>
      </div>

      {/* Charts + Stats row */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Bar chart */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            width: '100%',
            height: `${chartH}px`,
            background: C.codeBg,
            borderRadius: '6px',
            border: `1px solid ${C.border}`,
          }}>
            <BarChart
              dataset={dataset}
              topN={topN}
              showUniform={showUniform}
              animKey={animKey}
            />
          </div>
        </div>

        {/* Right column: pie + stats */}
        <div style={{ width: '196px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Donut */}
          <div style={{
            background: C.codeBg,
            borderRadius: '6px',
            border: `1px solid ${C.border}`,
            padding: '6px',
          }}>
            <DonutChart dataset={dataset} />
          </div>

          {/* Stats panel */}
          <div style={{
            background: C.bg2,
            borderRadius: '6px',
            border: `1px solid ${C.border}`,
            padding: '10px 12px',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              {ds.label}
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '6px', marginBottom: '6px' }}>
              <StatRow label="Total"  value={ds.totalCats} color={C.mid} />
              <StatRow label="Shown"  value={`top ${topN}`} color={C.mid} />
              <StatRow label="Top"    value={topCat ? `${topCat.name} ${topCat.pct}%` : '—'} color={C.accent} />
              <StatRow label="Bottom" value={botCat ? `${botCat.pct}%` : '—'} color={C.mid} />
              <StatRow label="Top-10" value={`${top10Sum}% total`} color={C.orange} />
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '6px', marginBottom: '6px' }}>
              <StatRow label="Dominant" value={`${domReg.region} ${domReg.pct}%`} color={domReg.color} />
              <StatRow label="Top-3 sum" value={`${top3Sum}%`} color={C.mid} />
              <StatRow label="World pop" value={`~${ds.worldPopTop3}%`} color={C.mid} />
              <StatRow label="Gap" value={`+${covGap}%`} color={C.orange} />
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '6px' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: C.muted, marginBottom: '4px' }}>
                Key imbalance
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: C.text, lineHeight: 1.4 }}>
                {ds.keyImbalance}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What this means */}
      <div style={{
        marginTop: '14px',
        background: C.bg3,
        borderTop: `1px solid ${C.border}`,
        borderRadius: '6px',
        padding: '14px 18px',
        display: 'flex',
        gap: '24px',
      }}>
        {/* Left callout */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px', lineHeight: 1 }}>⚠</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: C.text }}>
              Consequence
            </span>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.prose, lineHeight: 1.5, margin: 0 }}>
            {ds.consequence}
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: C.border, flexShrink: 0 }} />

        {/* Right callout */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="6.5" fill="none" stroke={C.accent} strokeWidth="1" />
              <ellipse cx="7" cy="7" rx="3" ry="6.5" fill="none" stroke={C.accent} strokeWidth="0.8" />
              <line x1="0.5" y1="7" x2="13.5" y2="7" stroke={C.accent} strokeWidth="0.8" />
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: C.text }}>
              What's missing
            </span>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.prose, lineHeight: 1.5, margin: 0 }}>
            {ds.missing}
          </p>
        </div>
      </div>

    </WidgetCard>
  );
}
