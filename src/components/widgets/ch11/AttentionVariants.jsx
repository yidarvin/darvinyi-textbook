import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  math:      '#fbbf24',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  mid:       '#888888',
  text:      '#e8eaed',
  codeBg:    '#0a0a0a',
};
const mono  = "'JetBrains Mono', monospace";
const inter = "'Inter', sans-serif";
const serif = "'Crimson Pro', serif";

// SVG layout
const SVG_W    = 580;
const SVG_H    = 280;
const COL_W    = 193;
const DIV1     = 193;
const DIV2     = 386;
const col1Cx   = DIV1 / 2;
const col2Cx   = DIV1 + COL_W / 2;
const col3Cx   = DIV2 + (SVG_W - DIV2) / 2;

// Y positions
const TITLE_Y   = 18;
const Q_LBL_Y   = 33;
const BRACK_Y   = 43;
const Q_BARS_Y  = 54;
const BAR_H     = 44;
const KV_LBL_Y  = Q_BARS_Y + BAR_H + 14;  // 112
const KV_BARS_Y = KV_LBL_Y + 10;           // 122
const SUB_Y     = KV_BARS_Y + BAR_H + 14;  // 180

function barLayout(count, colX) {
  const avail = COL_W - 24;
  const gap   = count <= 8 ? 4 : count <= 16 ? 2 : 1;
  const bw    = Math.max(4, Math.floor((avail - (count - 1) * gap) / count));
  const total = count * bw + (count - 1) * gap;
  const sx    = colX + (COL_W - total) / 2;
  return Array.from({ length: count }, (_, i) => {
    const x = sx + i * (bw + gap);
    return { x, w: bw, cx: x + bw / 2 };
  });
}

function gqaKvBars(h, G, colX) {
  const qB = barLayout(h, colX);
  const bw = qB[0].w;
  return Array.from({ length: G }, (_, g) => {
    const gs = Math.floor(g * h / G);
    const ge = Math.floor((g + 1) * h / G) - 1;
    const lx = qB[gs].x;
    const rx = qB[ge].x + qB[ge].w;
    const cx = (lx + rx) / 2;
    return { x: cx - bw / 2, w: bw, cx, gx1: lx, gx2: rx };
  });
}

function drawMemChart(canvas, h, G) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const { width: W, height: H } = canvas.getBoundingClientRect();
  if (!W || !H) return;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.scale(dpr, dpr);

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  const lp = 48, tp = 22, bH = 20, bGap = 11;
  const chartW = W - lp - 10;

  ctx.font      = `10px ${inter}`;
  ctx.fillStyle = C.mid;
  ctx.textAlign = 'left';
  ctx.fillText('KV Cache Memory Footprint (relative to MHA)', lp, 13);

  const gqaRatio = G / h;
  const mqaRatio = 1 / h;

  const bars = [
    { lbl: 'MHA', ratio: 1,        col: C.accent, tag: '100% (baseline)' },
    { lbl: 'GQA', ratio: gqaRatio, col: C.orange, tag: `${(gqaRatio * 100).toFixed(0)}% (G=${G})` },
    { lbl: 'MQA', ratio: mqaRatio, col: C.purple, tag: `${(mqaRatio * 100).toFixed(1)}% (1/${h})` },
  ];

  const mhaEnd = lp + chartW;

  bars.forEach(({ lbl, ratio, col, tag }, i) => {
    const y  = tp + i * (bH + bGap);
    const bW = Math.max(1, ratio * chartW);

    ctx.font      = `9px ${mono}`;
    ctx.fillStyle = C.mid;
    ctx.textAlign = 'right';
    ctx.fillText(lbl, lp - 5, y + bH / 2 + 3);

    ctx.fillStyle = col;
    ctx.fillRect(lp, y, bW, bH);

    ctx.font      = `9px ${mono}`;
    ctx.fillStyle = col;
    ctx.textAlign = 'left';
    ctx.fillText(tag, lp + bW + 5, y + bH / 2 + 3);
  });

  // Dashed comparison lines + labels
  if (G < h) {
    const y1 = tp + bH / 2;
    const y2 = tp + bH + bGap + bH / 2;
    ctx.strokeStyle = C.math;
    ctx.lineWidth   = 0.8;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(mhaEnd - 1, y1 + bH / 2);
    ctx.lineTo(mhaEnd - 1, y2 - bH / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const gqaSmallerFactor = h / G;
    ctx.font      = `8px ${mono}`;
    ctx.fillStyle = C.math;
    ctx.textAlign = 'right';
    ctx.fillText(
      `${Number.isInteger(gqaSmallerFactor) ? gqaSmallerFactor : gqaSmallerFactor.toFixed(1)}× smaller`,
      mhaEnd - 4, (y1 + y2) / 2 + 3
    );
  }

  if (h > 1) {
    const y1 = tp + bH / 2;
    const y2 = tp + 2 * (bH + bGap) + bH / 2;
    ctx.strokeStyle = C.math;
    ctx.lineWidth   = 0.8;
    ctx.setLineDash([2, 2]);
    const arrowX = mhaEnd - (G < h ? 60 : 1);
    ctx.beginPath();
    ctx.moveTo(arrowX, y1 + bH / 2);
    ctx.lineTo(arrowX, y2 - bH / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font      = `8px ${mono}`;
    ctx.fillStyle = C.math;
    ctx.textAlign = 'right';
    ctx.fillText(`${h}× smaller`, arrowX - 2, (y1 + y2) / 2 + 3);
  }

  ctx.font      = `8px ${inter}`;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'left';
  ctx.fillText('Quality: MHA ≈ GQA >> MQA (at same model size)', lp, tp + 3 * (bH + bGap) + 4);
}

const MODELS = [
  { name: 'GPT-3',      params: '175B', qh: 96, kh: 96, arch: 'MHA' },
  { name: 'LLaMA 2 7B', params: '7B',   qh: 32, kh: 32, arch: 'MHA' },
  { name: 'LLaMA 3 8B', params: '8B',   qh: 32, kh: 8,  arch: 'GQA (G=8)', gqa: true },
  { name: 'Mistral 7B', params: '7B',   qh: 32, kh: 8,  arch: 'GQA (G=8)', gqa: true },
  { name: 'Falcon 7B',  params: '7B',   qh: 71, kh: 1,  arch: 'MQA' },
];

function StatRow({ label, val, vc }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', marginBottom: '3px' }}>
      <span style={{ fontFamily: mono, fontSize: '9px', color: C.muted }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: '10px', color: vc || C.mid,
                     textAlign: 'right', marginLeft: '4px' }}>{val}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: '5px', marginTop: '8px' }}>
      {children}
    </div>
  );
}

function HR() {
  return <div style={{ height: '1px', background: C.border, margin: '7px 0' }} />;
}

function Toggle({ label, value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      fontFamily: mono, fontSize: '10px', padding: '4px 10px',
      background: value ? C.accentDim : C.bg4,
      border: `1px solid ${value ? C.accent : C.borderLt}`,
      borderRadius: '4px', color: value ? C.accent : C.mid,
      cursor: 'pointer', flexShrink: 0,
    }}>
      {label}
    </button>
  );
}

export default function AttentionVariants({ tryThis }) {
  const [h,            setH]            = useState(8);
  const [G,            setG]            = useState(2);
  const [showLines,    setShowLines]    = useState(true);
  const [showBrackets, setShowBrackets] = useState(true);
  const [animTrans,    setAnimTrans]    = useState(true);
  const chartRef = useRef(null);

  const G_eff = Math.min(G, h);

  useEffect(() => { if (G > h) setG(h); }, [h, G]);
  useEffect(() => { drawMemChart(chartRef.current, h, G_eff); }, [h, G_eff]);

  // Pre-compute all bar positions
  const mhaQ  = barLayout(h, 0);
  const mqaQ  = barLayout(h, DIV1);
  const gqaQ  = barLayout(h, DIV2);
  const gqaKV = gqaKvBars(h, G_eff, DIV2);
  const bw    = mhaQ[0].w;
  const mqaKvX = col2Cx - bw / 2;

  const gqaSub = G_eff === 1 ? '= MQA' : G_eff === h ? '= MHA' : `${G_eff} KV groups`;
  const gqaQKvRatio = h / G_eff;
  const isInt = Number.isInteger(gqaQKvRatio);

  function modelRatio(m) {
    if (m.kh === 1)         return `${m.qh}:1`;
    if (m.qh === m.kh)      return '1:1';
    return `${m.qh / m.kh}:1`;
  }

  function archColor(arch) {
    if (arch === 'MHA') return C.accent;
    if (arch === 'MQA') return C.purple;
    return C.orange;
  }

  return (
    <WidgetCard title="Attention Variants — MHA vs GQA vs MQA" number="11.3" tryThis={tryThis}>
      <style>{`
        .av-range { -webkit-appearance: none; height: 2px;
          background: ${C.borderLt}; border-radius: 2px; cursor: pointer; }
        .av-range::-webkit-slider-thumb { -webkit-appearance: none;
          width: 12px; height: 12px; border-radius: 50%;
          background: ${C.accent}; box-shadow: 0 0 6px rgba(45,212,191,0.2); }
      `}</style>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* ── Left: main content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Head diagram SVG */}
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
            <defs>
              <filter id="av-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width={SVG_W} height={SVG_H} fill={C.codeBg} rx={4} />
            <line x1={DIV1} y1={0} x2={DIV1} y2={SVG_H} stroke={C.border} strokeWidth={1} strokeDasharray="3 3" />
            <line x1={DIV2} y1={0} x2={DIV2} y2={SVG_H} stroke={C.border} strokeWidth={1} strokeDasharray="3 3" />

            {/* ── Column 1: MHA ── */}
            <text x={col1Cx} y={TITLE_Y} textAnchor="middle" fontFamily={serif} fontSize={14} fill={C.text}>MHA</text>
            <text x={col1Cx} y={Q_LBL_Y} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.muted}>Q heads</text>
            <text x={col1Cx} y={KV_LBL_Y} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.muted}>KV heads</text>
            <text x={col1Cx} y={SUB_Y} textAnchor="middle" fontFamily={mono} fontSize={10} fill={C.mid}>{h} KV heads</text>

            {showLines && mhaQ.map((q, i) => (
              <line key={i} x1={q.cx} y1={Q_BARS_Y + BAR_H} x2={q.cx} y2={KV_BARS_Y}
                stroke={C.borderLt} strokeWidth={1} />
            ))}
            {mhaQ.map((bar, i) => (
              <rect key={i} x={bar.x} y={Q_BARS_Y} width={bar.w} height={BAR_H} fill={C.accent} rx={2} />
            ))}
            {mhaQ.map((bar, i) => (
              <rect key={i} x={bar.x} y={KV_BARS_Y} width={bar.w} height={BAR_H} fill={C.orange} rx={2} />
            ))}

            {/* ── Column 2: MQA ── */}
            <text x={col2Cx} y={TITLE_Y} textAnchor="middle" fontFamily={serif} fontSize={14} fill={C.text}>MQA</text>
            <text x={col2Cx} y={Q_LBL_Y} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.muted}>Q heads</text>
            <text x={col2Cx} y={KV_LBL_Y} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.muted}>KV heads</text>
            <text x={col2Cx} y={SUB_Y} textAnchor="middle" fontFamily={mono} fontSize={10} fill={C.mid}>1 KV head (shared)</text>

            {showLines && mqaQ.map((q, i) => (
              <line key={i} x1={q.cx} y1={Q_BARS_Y + BAR_H} x2={col2Cx} y2={KV_BARS_Y}
                stroke={C.borderLt} strokeWidth={1} />
            ))}
            {mqaQ.map((bar, i) => (
              <rect key={i} x={bar.x} y={Q_BARS_Y} width={bar.w} height={BAR_H} fill={C.accent} rx={2} />
            ))}
            <rect x={mqaKvX} y={KV_BARS_Y} width={bw} height={BAR_H} fill={C.orange} rx={2} />
            <rect x={mqaKvX} y={KV_BARS_Y} width={bw} height={BAR_H} fill="none"
              stroke="white" strokeWidth={2} rx={2} opacity={0.6} filter="url(#av-glow)" />

            {/* ── Column 3: GQA ── */}
            <text x={col3Cx} y={TITLE_Y} textAnchor="middle" fontFamily={serif} fontSize={14} fill={C.text}>GQA</text>
            <text x={col3Cx} y={Q_LBL_Y} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.muted}>Q heads</text>
            <text x={col3Cx} y={KV_LBL_Y} textAnchor="middle" fontFamily={mono} fontSize={8} fill={C.muted}>KV heads</text>
            <text x={col3Cx} y={SUB_Y} textAnchor="middle" fontFamily={mono} fontSize={10} fill={C.mid}>{gqaSub}</text>

            {showBrackets && gqaKV.map((kv, g) => (
              <g key={g}>
                <line x1={kv.gx1} y1={BRACK_Y} x2={kv.gx2} y2={BRACK_Y} stroke={C.muted} strokeWidth={1} />
                <line x1={kv.gx1} y1={BRACK_Y} x2={kv.gx1} y2={BRACK_Y + 5} stroke={C.muted} strokeWidth={1} />
                <line x1={kv.gx2} y1={BRACK_Y} x2={kv.gx2} y2={BRACK_Y + 5} stroke={C.muted} strokeWidth={1} />
                <text x={(kv.gx1 + kv.gx2) / 2} y={BRACK_Y - 3}
                  textAnchor="middle" fontFamily={mono} fontSize={7} fill={C.muted}>
                  G{g + 1}
                </text>
              </g>
            ))}

            {showLines && gqaQ.map((q, i) => {
              const g  = Math.min(G_eff - 1, Math.floor(i * G_eff / h));
              const kv = gqaKV[g];
              return (
                <line key={i} x1={q.cx} y1={Q_BARS_Y + BAR_H} x2={kv.cx} y2={KV_BARS_Y}
                  stroke={C.borderLt} strokeWidth={1} />
              );
            })}
            {gqaQ.map((bar, i) => (
              <rect key={i} x={bar.x} y={Q_BARS_Y} width={bar.w} height={BAR_H} fill={C.accent} rx={2} />
            ))}
            {gqaKV.map((bar, g) => (
              <rect key={g}
                style={{
                  x: bar.x, width: bar.w,
                  transition: animTrans ? 'x 0.35s ease, width 0.35s ease' : 'none',
                }}
                y={KV_BARS_Y} height={BAR_H} fill={C.orange} rx={2} />
            ))}
          </svg>

          {/* Memory footprint chart */}
          <div style={{ marginTop: '10px' }}>
            <canvas ref={chartRef}
              style={{ display: 'block', width: '100%', height: '110px', borderRadius: '4px' }} />
          </div>

          {/* Model comparison table */}
          <div style={{
            marginTop: '10px', background: C.bg4,
            borderRadius: '6px', padding: '10px 14px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '30%' }} />
              </colgroup>
              <thead>
                <tr>
                  {['Model', 'Params', 'Q heads', 'KV heads', 'Ratio', 'Architecture'].map((col, i) => (
                    <th key={i} style={{
                      fontFamily: mono, fontSize: '9px', color: C.muted, fontWeight: 700,
                      textAlign: 'left', paddingBottom: '6px',
                      borderBottom: `1px solid ${C.border}`,
                      paddingLeft: i === 0 ? 0 : '4px',
                      background: i === 3 ? 'rgba(251,146,60,0.08)' : 'transparent',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m, row) => (
                  <tr key={row} style={{ background: m.gqa ? 'rgba(45,212,191,0.04)' : 'transparent' }}>
                    {[m.name, m.params, m.qh, m.kh, modelRatio(m), m.arch].map((val, i) => (
                      <td key={i} style={{
                        fontFamily: mono, fontSize: '9px',
                        padding: '5px 0', paddingLeft: i === 0 ? 0 : '4px',
                        borderBottom: row < MODELS.length - 1 ? `1px solid ${C.border}` : 'none',
                        background: i === 3 ? 'rgba(251,146,60,0.08)' : 'transparent',
                        color: i === 5 ? archColor(m.arch) : i === 3 ? C.orange : C.mid,
                      }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controls */}
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', color: C.mid,
                             flexShrink: 0, width: '124px' }}>
                h = {h} Q heads
              </span>
              <input className="av-range" type="range" min={4} max={32} step={4} value={h}
                onChange={e => setH(Number(e.target.value))}
                style={{ flex: 1, minWidth: '80px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', color: C.mid,
                             flexShrink: 0, width: '124px' }}>
                G = {G_eff} KV groups
              </span>
              <input className="av-range" type="range" min={1} max={h} step={1} value={G_eff}
                onChange={e => setG(Number(e.target.value))}
                style={{ flex: 1, minWidth: '80px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
              <Toggle label="Lines"    value={showLines}    onChange={setShowLines} />
              <Toggle label="Brackets" value={showBrackets} onChange={setShowBrackets} />
              <Toggle label="Animate"  value={animTrans}    onChange={setAnimTrans} />
            </div>
          </div>
        </div>

        {/* ── Right: stats panel ── */}
        <div style={{
          width: 178, flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '12px 14px',
        }}>
          <SectionLabel>Configuration</SectionLabel>
          <StatRow label="Q heads (h)"   val={h}     vc={C.accent} />
          <StatRow label="GQA groups (G)" val={G_eff} vc={C.orange} />

          <HR />
          <SectionLabel>KV head counts</SectionLabel>
          <StatRow label="MHA" val={`${h} heads`} />
          <StatRow label="GQA" val={`${G_eff} heads`} vc={C.orange} />
          <StatRow label="MQA" val="1 head"        vc={C.purple} />

          <HR />
          <SectionLabel>Cache ratio vs MHA</SectionLabel>
          <StatRow label="GQA"
            val={`${G_eff}/${h} = ${(G_eff / h).toFixed(2)}×`}
            vc={C.orange} />
          <StatRow label="MQA"
            val={`1/${h} = ${(1 / h).toFixed(2)}×`}
            vc={C.purple} />

          <HR />
          <SectionLabel>Q:KV ratio</SectionLabel>
          <StatRow label="MHA" val={`${h}:${h} = 1:1`} />
          <StatRow label="GQA"
            val={`${h}:${G_eff} = ${isInt ? gqaQKvRatio : gqaQKvRatio.toFixed(1)}:1`}
            vc={C.orange} />
          <StatRow label="MQA" val={`${h}:1`} vc={C.purple} />

          <HR />
          <div style={{
            fontFamily: inter, fontSize: '10px', color: C.muted,
            fontStyle: 'italic', lineHeight: 1.55,
          }}>
            "GQA with G&nbsp;=&nbsp;h/4 gives 4× memory savings with &lt;1% quality loss vs MHA."
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
