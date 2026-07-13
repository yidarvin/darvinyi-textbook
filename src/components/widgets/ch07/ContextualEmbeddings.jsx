import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Inter', sans-serif";

const C = {
  accent:   '#2dd4bf',
  accentDim:'#0b2422',
  math:     '#fbbf24',
  green:    '#34d399',
  red:      '#f87171',
  orange:   '#fb923c',
  purple:   '#a78bfa',
  border:   '#242424',
  borderLt: '#2e2e2e',
  codeBg:   '#0a0a0a',
  bg2:      '#111111',
  bg3:      '#161616',
  bg4:      '#1e1e1e',
  text:     '#e8eaed',
  mid:      '#888888',
  muted:    '#555555',
};

// ── Math ──────────────────────────────────────────────────────────────────────

function cosSim(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na  = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb  = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (na === 0 || nb === 0) return 0;
  return dot / (na * nb);
}

function simColor(v) {
  if (v >= 0.7)  return C.accent;
  if (v >= 0.3)  return C.math;
  if (v >= -0.1) return C.mid;
  return C.red;
}

function cellBg(val) {
  const t = Math.min(Math.abs(val) / 0.8, 1);
  if (val >= 0) {
    return `rgb(${Math.round(20 + t * 25)},${Math.round(20 + t * 192)},${Math.round(20 + t * 171)})`;
  }
  return `rgb(${Math.round(20 + t * 228)},${Math.round(20 + t * 93)},${Math.round(20 + t * 93)})`;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const PRESETS = {
  bank: {
    word: 'bank',
    sentences: [
      'I deposited money at the bank yesterday.',
      'We fished along the bank of the river.',
      'She donated blood at the blood bank.',
    ],
    sentLabels: ['S1: financial', 'S2: river', 'S3: blood'],
    staticEmb: [0.42, -0.18, 0.71, 0.35, -0.22, 0.58, 0.14, -0.41],
    contextualEmbs: [
      [ 0.72, -0.35,  0.58,  0.44, -0.18,  0.62,  0.21, -0.31],  // financial
      [-0.48,  0.61,  0.29, -0.55,  0.72, -0.18, -0.42,  0.63],  // river
      [ 0.65, -0.28,  0.51,  0.38, -0.12,  0.55,  0.33, -0.24],  // blood
    ],
  },
  run: {
    word: 'run',
    sentences: [
      'She decided to run for president of the club.',
      'He went for a morning run along the trail.',
      'The program will run for three hours without stopping.',
    ],
    sentLabels: ['S1: political', 'S2: exercise', 'S3: program'],
    staticEmb: [0.31, 0.55, -0.22, 0.48, 0.17, -0.38, 0.62, 0.09],
    contextualEmbs: [
      [ 0.58, -0.42,  0.31,  0.67, -0.15,  0.48,  0.22, -0.35],  // political
      [-0.38,  0.72, -0.44,  0.19,  0.65, -0.28, -0.31,  0.52],  // exercise
      [ 0.51, -0.33,  0.44,  0.58, -0.08,  0.41,  0.35, -0.28],  // program
    ],
  },
};

const PAIR_NAMES = ['S₁,S₂', 'S₁,S₃', 'S₂,S₃'];
const PT_COLS    = [C.accent, C.orange, C.purple];

// ── Sub-components ────────────────────────────────────────────────────────────

function VecCells({ vec }) {
  return (
    <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
      {vec.map((v, i) => (
        <div key={i} title={v.toFixed(2)} style={{
          flex: 1, height: '14px', borderRadius: '2px',
          background: cellBg(v),
          fontSize: '6px', fontFamily: MONO, color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {Math.abs(v) >= 0.2 ? v.toFixed(1) : ''}
        </div>
      ))}
    </div>
  );
}

function SimBadge({ pairIdx, sim, always }) {
  const col = always ? C.muted : simColor(sim);
  const val = always ? '1.000' : sim.toFixed(3);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '3px 0' }}>
      <span style={{
        fontFamily: MONO, fontSize: '8px', color: col,
        background: `${col}18`, border: `1px solid ${col}40`,
        borderRadius: '9px', padding: '2px 8px', whiteSpace: 'nowrap',
      }}>
        cos({PAIR_NAMES[pairIdx].replace('₁', '₁').replace('₂', '₂').replace('₃', '₃')}) = {val}
        {always && <span style={{ color: C.muted, opacity: 0.6 }}> · identical</span>}
      </span>
    </div>
  );
}

function EmbRow({ sentence, word, vec, showCells }) {
  // Split sentence around target word
  const lower = sentence.toLowerCase();
  const wl    = word.toLowerCase();
  const parts = [];
  let   idx   = 0;
  while (idx < sentence.length) {
    const fi = lower.indexOf(wl, idx);
    if (fi === -1) { parts.push({ text: sentence.slice(idx), hi: false }); break; }
    if (fi > idx)   parts.push({ text: sentence.slice(idx, fi), hi: false });
    parts.push({ text: sentence.slice(fi, fi + word.length), hi: true });
    idx = fi + word.length;
  }
  return (
    <div style={{
      background: C.bg3, border: `1px solid ${C.border}`,
      borderRadius: '4px', padding: '5px 7px',
    }}>
      <div style={{ fontFamily: SANS, fontSize: '10px', color: C.mid, lineHeight: 1.4 }}>
        {parts.map((p, i) =>
          p.hi
            ? <span key={i} style={{ color: C.accent, fontWeight: 700, textDecoration: 'underline' }}>{p.text}</span>
            : <span key={i}>{p.text}</span>
        )}
      </div>
      {showCells && <VecCells vec={vec} />}
    </div>
  );
}

function EmbPanel({ title, sentences, word, embs, showCells, sim01, sim12, always }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: SANS, fontSize: '11px', color: C.mid, fontStyle: 'italic', marginBottom: '6px' }}>
        {title}
      </div>
      <EmbRow sentence={sentences[0]} word={word} vec={embs[0]} showCells={showCells} />
      <SimBadge pairIdx={0} sim={sim01} always={always} />
      <EmbRow sentence={sentences[1]} word={word} vec={embs[1]} showCells={showCells} />
      <SimBadge pairIdx={2} sim={sim12} always={always} />
      <EmbRow sentence={sentences[2]} word={word} vec={embs[2]} showCells={showCells} />
      <div style={{
        fontFamily: SANS, fontSize: '9px', color: C.muted,
        fontStyle: 'italic', marginTop: '6px', textAlign: 'center',
      }}>
        {always
          ? 'One embedding per word type — context is ignored.'
          : 'Different vector per token — context changes meaning.'}
      </div>
    </div>
  );
}

// ── Scatter plot (SVG) ────────────────────────────────────────────────────────

function ScatterPlot({ ctxPts, centroid, word, sentLabels }) {
  const VW = 380, VH = 162;
  const ML = 20, MR = 15, MT = 20, MB = 22;
  const PW = VW - ML - MR;
  const PH = VH - MT - MB;

  const allX = [...ctxPts.map(p => p[0]), centroid[0]];
  const allY = [...ctxPts.map(p => p[1]), centroid[1]];
  const pad  = 0.22;
  const xMin = Math.min(...allX) - pad, xMax = Math.max(...allX) + pad;
  const yMin = Math.min(...allY) - pad, yMax = Math.max(...allY) + pad;

  function sv(dx, dy) {
    return [
      ML + (dx - xMin) / (xMax - xMin) * PW,
      (MT + PH) - (dy - yMin) / (yMax - yMin) * PH,
    ];
  }

  const pts = ctxPts.map(p => sv(p[0], p[1]));
  const ctr = sv(centroid[0], centroid[1]);

  const shortLabel = (s) => {
    const part = s.split(': ')[1] || s;
    return `${word} (${s.split(': ')[0]}: ${part})`;
  };

  // Label offsets: S1 above, S2 to right, S3 below
  const lCfg = [
    { anchor: 'middle', dx: 0,   dy: -14 },
    { anchor: 'start',  dx: 13,  dy:   4 },
    { anchor: 'middle', dx: 0,   dy:  17 },
  ];

  return (
    <div style={{ marginTop: '8px' }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
        {/* Title */}
        <text x={VW / 2} y={13} textAnchor="middle"
          fontFamily={SANS} fontSize={9.5} fill={C.muted} fontStyle="italic">
          Contextual embeddings separate word senses
        </text>

        {/* Axis labels */}
        <text x={ML + PW / 2} y={VH - 3} textAnchor="middle"
          fontFamily={MONO} fontSize={7} fill={C.muted}>dim[0]</text>
        <text
          x={ML - 6} y={MT + PH / 2} textAnchor="middle"
          fontFamily={MONO} fontSize={7} fill={C.muted}
          transform={`rotate(-90,${ML - 6},${MT + PH / 2})`}>
          dim[4]
        </text>

        {/* Dashed lines between pairs */}
        {[[0, 1], [0, 2], [1, 2]].map(([a, b]) => (
          <line key={`${a}-${b}`}
            x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
            stroke={C.borderLt} strokeWidth={1.2} strokeDasharray="4 3" />
        ))}

        {/* Lines from contextual cluster to centroid hint */}
        {pts.map(([x, y], i) => (
          <line key={`c${i}`}
            x1={x} y1={y} x2={ctr[0]} y2={ctr[1]}
            stroke={C.border} strokeWidth={0.8} strokeDasharray="2 4" opacity={0.5} />
        ))}

        {/* Contextual points */}
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={9} fill={PT_COLS[i]} opacity={0.85} />
            <text
              x={x + lCfg[i].dx} y={y + lCfg[i].dy}
              textAnchor={lCfg[i].anchor}
              fontFamily={MONO} fontSize={8} fill={PT_COLS[i]}>
              {shortLabel(sentLabels[i])}
            </text>
          </g>
        ))}

        {/* Static centroid */}
        <circle cx={ctr[0]} cy={ctr[1]} r={5} fill={C.muted} opacity={0.9} />
        <text x={ctr[0] + 8} y={ctr[1] + 4}
          textAnchor="start" fontFamily={MONO} fontSize={7.5} fill={C.muted}>
          static '{word}'
        </text>
      </svg>
    </div>
  );
}

// ── Stats panel ───────────────────────────────────────────────────────────────

function StatsPanel({ word, ctxSims }) {
  const pairLabels = ['S1 ↔ S2', 'S1 ↔ S3', 'S2 ↔ S3'];
  const maxIdx = ctxSims.indexOf(Math.max(...ctxSims));
  const minIdx = ctxSims.indexOf(Math.min(...ctxSims));

  const row = (label, val, col, keyPrefix) => (
    <div key={`${keyPrefix}-${label}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
      <span style={{ fontFamily: MONO, fontSize: '8.5px', color: C.muted }}>{label}:</span>
      <span style={{ fontFamily: MONO, fontSize: '8.5px', color: col || C.accent }}>{val}</span>
    </div>
  );

  const divider = () => (
    <div style={{ height: 1, background: C.border, margin: '8px 0' }} />
  );

  return (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: '8px', padding: '12px 13px',
      fontFamily: MONO,
    }}>
      {/* Word */}
      <div style={{ fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
        Word
      </div>
      <div style={{ fontFamily: MONO, fontSize: '13px', color: C.accent, marginBottom: '8px', fontWeight: 600 }}>
        "{word}"
      </div>

      {divider()}

      {/* Static */}
      <div style={{ fontFamily: SANS, fontSize: '9px', color: C.mid, marginBottom: '5px', fontStyle: 'italic' }}>
        Static (Word2Vec / GloVe)
      </div>
      {pairLabels.map(lbl => row(lbl, '1.000', C.muted, 'static'))}
      {row('Unique', '1  (same for all ctx)', C.muted, 'static')}

      {divider()}

      {/* Contextual */}
      <div style={{ fontFamily: SANS, fontSize: '9px', color: C.mid, marginBottom: '5px', fontStyle: 'italic' }}>
        Contextual (BERT / ELMo)
      </div>
      {pairLabels.map((lbl, i) => row(lbl, ctxSims[i].toFixed(3), simColor(ctxSims[i]), 'contextual'))}
      {row('Unique', '3  (one per context)', C.accent, 'contextual')}

      {divider()}

      {/* Analysis */}
      <div style={{ marginBottom: '3px' }}>
        <div style={{ fontSize: '7.5px', color: C.muted, marginBottom: '2px' }}>Most similar:</div>
        <div style={{ fontSize: '8.5px', color: C.accent }}>
          {pairLabels[maxIdx]} = {ctxSims[maxIdx].toFixed(3)}
        </div>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '7.5px', color: C.muted, marginBottom: '2px' }}>Clearest distinction:</div>
        <div style={{ fontSize: '8.5px', color: C.red }}>
          {pairLabels[minIdx]} = {ctxSims[minIdx].toFixed(3)}
        </div>
      </div>

      {divider()}

      {/* Model notes */}
      <div style={{ fontFamily: SANS, fontSize: '8.5px', color: C.muted, fontStyle: 'italic', lineHeight: 1.55 }}>
        ELMo: bidirectional LSTM<br />
        BERT: bidirectional Transformer<br />
        Both: token-level vectors<br />
        &nbsp;&nbsp;that vary with context.
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ContextualEmbeddings({ tryThis }) {
  const [preset,      setPreset]      = useState('bank');
  const [showCells,   setShowCells]   = useState(true);
  const [showChart,   setShowChart]   = useState(true);
  const [showScatter, setShowScatter] = useState(true);

  const barRef = useRef(null);

  const data = PRESETS[preset];
  const { word, sentences, staticEmb, contextualEmbs, sentLabels } = data;

  const ctxSims = [
    cosSim(contextualEmbs[0], contextualEmbs[1]),  // S1↔S2
    cosSim(contextualEmbs[0], contextualEmbs[2]),  // S1↔S3
    cosSim(contextualEmbs[1], contextualEmbs[2]),  // S2↔S3
  ];

  const ctxPts  = contextualEmbs.map(v => [v[0], v[4]]);
  const centroid = [
    (ctxPts[0][0] + ctxPts[1][0] + ctxPts[2][0]) / 3,
    (ctxPts[0][1] + ctxPts[1][1] + ctxPts[2][1]) / 3,
  ];

  // ── Bar chart ────────────────────────────────────────────────────────────────

  const drawBar = useCallback(() => {
    const canvas = barRef.current;
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const d    = PRESETS[preset];
    const sims = [
      cosSim(d.contextualEmbs[0], d.contextualEmbs[1]),
      cosSim(d.contextualEmbs[0], d.contextualEmbs[2]),
      cosSim(d.contextualEmbs[1], d.contextualEmbs[2]),
    ];

    const PT = 18, PB = 26, PL = 30, PR = 10;
    const PW = W - PL - PR;
    const PH = H - PT - PB;
    const zeroY = PT + PH / 2;  // y=0 baseline (range -1 to 1)

    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.font = `10px ${SANS}`;
    ctx.fillStyle = C.text;
    ctx.textAlign = 'left';
    ctx.fillText(`Cosine similarity between '${d.word}' instances`, PL, 12);

    // Grid lines + y labels
    [[1.0, PT], [0, zeroY], [-1.0, PT + PH]].forEach(([val, y]) => {
      ctx.strokeStyle = val === 0 ? C.borderLt : C.border;
      ctx.lineWidth   = 1;
      ctx.setLineDash(val === 0 ? [] : [3, 3]);
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `6.5px ${MONO}`;
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(val === 0 ? 0 : 1), PL - 3, y + 3);
    });

    // Bars
    const barW     = Math.min(26, Math.floor((PW - 56) / 9));
    const gap      = 4;
    const grpGap   = 18;
    const gW       = 2 * barW + gap;
    const totalW   = 3 * gW + 2 * grpGap;
    const sx       = PL + (PW - totalW) / 2;

    for (let g = 0; g < 3; g++) {
      const gx  = sx + g * (gW + grpGap);
      const sim = sims[g];
      const col = simColor(sim);

      // Static bar (always 1.0 → full half-height upward)
      const sh = PH / 2;
      ctx.fillStyle = C.borderLt;
      ctx.fillRect(gx, zeroY - sh, barW, sh);
      ctx.font = `6px ${MONO}`;
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'center';
      ctx.fillText('1.0', gx + barW / 2, zeroY - sh - 3);

      // Contextual bar (up for positive, down for negative)
      const cx = gx + barW + gap;
      const ch = Math.abs(sim) * PH / 2;
      ctx.fillStyle = col;
      if (sim >= 0) {
        ctx.fillRect(cx, zeroY - ch, barW, ch);
        ctx.font = `6px ${MONO}`;
        ctx.fillStyle = col;
        ctx.textAlign = 'center';
        ctx.fillText(sim.toFixed(2), cx + barW / 2, zeroY - ch - 3);
      } else {
        ctx.fillRect(cx, zeroY, barW, ch);
        ctx.font = `6px ${MONO}`;
        ctx.fillStyle = col;
        ctx.textAlign = 'center';
        ctx.fillText(sim.toFixed(2), cx + barW / 2, zeroY + ch + 9);
      }

      // Group label
      ctx.font = `7px ${MONO}`;
      ctx.fillStyle = C.mid;
      ctx.textAlign = 'center';
      ctx.fillText(PAIR_NAMES[g], gx + gW / 2, H - 5);
    }

    // Legend
    const lx = W - PR - 64;
    ctx.fillStyle = C.borderLt;
    ctx.fillRect(lx, PT, barW, 7);
    ctx.font = `6.5px ${MONO}`;
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText('static', lx + barW + 3, PT + 7);

    ctx.fillStyle = C.accent;
    ctx.fillRect(lx, PT + 11, barW, 7);
    ctx.fillText('ctx', lx + barW + 3, PT + 18);
  }, [preset]);

  useEffect(() => { if (showChart) drawBar(); }, [drawBar, showChart]);

  useEffect(() => {
    const obs = new ResizeObserver(() => { if (showChart) drawBar(); });
    if (barRef.current) obs.observe(barRef.current);
    return () => obs.disconnect();
  }, [drawBar, showChart]);

  // ── Button styles ─────────────────────────────────────────────────────────

  const tabStyle = (active) => ({
    fontFamily: MONO, fontSize: '10px', cursor: 'pointer',
    padding: '4px 12px', borderRadius: '4px',
    color:      active ? C.accent : C.muted,
    background: active ? C.accentDim : 'transparent',
    border:     `1px solid ${active ? C.accent : C.border}`,
  });

  const toggleStyle = (active) => ({
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    cursor: 'pointer', fontFamily: MONO, fontSize: '10px',
    color: active ? C.accent : C.muted, flexShrink: 0,
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <WidgetCard title="Static vs Contextual — one vector vs one per context" number="7.5" tryThis={tryThis}>

      {/* Preset tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <span style={{ fontFamily: MONO, fontSize: '10px', color: C.muted, alignSelf: 'center', marginRight: '4px' }}>
          Word:
        </span>
        {['bank', 'run'].map(p => (
          <button key={p} onClick={() => setPreset(p)} style={tabStyle(preset === p)}>
            {p}
          </button>
        ))}
      </div>

      {/* Main row: embedding panels + stats */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Left: panels + charts */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Two embedding panels side by side */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <EmbPanel
              title="Word2Vec / GloVe (static)"
              sentences={sentences}
              word={word}
              embs={[staticEmb, staticEmb, staticEmb]}
              showCells={showCells}
              sim01={ctxSims[0]}
              sim12={ctxSims[2]}
              always={true}
            />
            <EmbPanel
              title="BERT / ELMo (contextual)"
              sentences={sentences}
              word={word}
              embs={contextualEmbs}
              showCells={showCells}
              sim01={ctxSims[0]}
              sim12={ctxSims[2]}
              always={false}
            />
          </div>

          {/* Bar chart */}
          {showChart && (
            <div style={{ marginTop: '10px', background: C.codeBg, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
              <canvas
                ref={barRef}
                style={{ display: 'block', width: '100%', height: '130px' }}
              />
            </div>
          )}

          {/* Scatter plot */}
          {showScatter && (
            <ScatterPlot
              ctxPts={ctxPts}
              centroid={centroid}
              word={word}
              sentLabels={sentLabels}
            />
          )}

        </div>

        {/* Stats panel */}
        <div style={{ width: 176, flexShrink: 0 }}>
          <StatsPanel word={word} ctxSims={ctxSims} />
        </div>

      </div>

      {/* Controls bar */}
      <div style={{
        marginTop: '10px',
        display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap',
        background: C.bg3, border: `1px solid ${C.border}`,
        borderRadius: '6px', padding: '8px 12px',
      }}>
        <label style={toggleStyle(showCells)}>
          <input type="checkbox" checked={showCells} onChange={e => setShowCells(e.target.checked)}
            style={{ accentColor: C.accent, cursor: 'pointer', width: 11, height: 11 }} />
          show vector cells
        </label>
        <div style={{ width: 1, height: 18, background: C.border, flexShrink: 0 }} />
        <label style={toggleStyle(showChart)}>
          <input type="checkbox" checked={showChart} onChange={e => setShowChart(e.target.checked)}
            style={{ accentColor: C.accent, cursor: 'pointer', width: 11, height: 11 }} />
          show bar chart
        </label>
        <div style={{ width: 1, height: 18, background: C.border, flexShrink: 0 }} />
        <label style={toggleStyle(showScatter)}>
          <input type="checkbox" checked={showScatter} onChange={e => setShowScatter(e.target.checked)}
            style={{ accentColor: C.accent, cursor: 'pointer', width: 11, height: 11 }} />
          show scatter plot
        </label>
      </div>

    </WidgetCard>
  );
}
