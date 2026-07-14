import { useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── math ──────────────────────────────────────────────────────────────────────
function matMul(A, B) {
  return A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
}
function transpose(M) { return M[0].map((_, j) => M.map(r => r[j])); }
function softmax(arr) {
  const mx = Math.max(...arr);
  const ex = arr.map(v => Math.exp(v - mx));
  const sm = ex.reduce((a, b) => a + b, 0);
  return ex.map(v => v / sm);
}
function softmaxRows(M) { return M.map(softmax); }
function rowEntropy(row) { return -row.reduce((s, p) => p > 1e-10 ? s + p * Math.log(p) : s, 0); }
function l2norm(row) { return Math.sqrt(row.reduce((s, v) => s + v * v, 0)); }

// ── color scales ──────────────────────────────────────────────────────────────
function lerp3(a, b, t) { return a.map((v, i) => Math.round(v + t * (b[i] - v))); }
function divColor(v) {
  v = Math.max(-2, Math.min(2, v));
  const [r, g, b] = v < 0
    ? lerp3([248, 113, 113], [30, 30, 30], (v + 2) / 2)
    : lerp3([30, 30, 30], [45, 212, 191], v / 2);
  return `rgb(${r},${g},${b})`;
}
function attnColor(v) {
  v = Math.max(0, Math.min(1, v));
  const [r, g, b] = lerp3([10, 10, 10], [45, 212, 191], v);
  return `rgb(${r},${g},${b})`;
}

// ── static data ───────────────────────────────────────────────────────────────
const TOKENS = ['I', 'love', 'deep', 'learning'];

const Q_MAT = [
  [ 0.8, -0.3,  0.5,  1.1],
  [ 0.2,  1.5,  1.2, -0.8], // adjusted: love→deep is max in row 1
  [-0.6,  1.4,  0.9, -0.2],
  [ 0.4, -0.8,  1.3,  0.6],
];
const K_MAT = [
  [ 0.6,  1.0, -0.5,  0.8],
  [ 0.9, -0.4,  1.2,  0.3],
  [-0.3,  0.7,  0.8, -0.9],
  [ 1.1,  0.2, -0.6,  0.7],
];
const V_MAT = [
  [ 0.5,  0.9,  0.3, -0.4],
  [-0.7,  0.4,  1.1,  0.6],
  [ 0.8, -0.2,  0.7,  0.9],
  [ 0.3,  1.1, -0.5,  0.4],
];

const Kt    = transpose(K_MAT);
const S_RAW = matMul(Q_MAT, Kt);
const S_SC  = S_RAW.map(row => row.map(v => v / Math.sqrt(4)));
const A_MAT = softmaxRows(S_SC);
const OUT   = matMul(A_MAT, V_MAT);

// ── SVG layout constants ──────────────────────────────────────────────────────
// Stats panel is now below the SVG, so the SVG gets the full container width.
// Cell sizes are increased accordingly for better legibility.
const SVG_W = 660, SVG_H = 280;
const F  = 50, SM = 35;          // full / small cell size
const LF = 42, LS = 36;          // label col width full / small
const LH = 20;                   // top label row height
const fW = LF + 4 * F;           // 242  full matrix width
const fH = LH + 4 * F;           // 220  full matrix height
const sW = LS + 4 * SM;          // 176  small matrix width

// vertical centres for each class of step
const yF = (SVG_H - fH) / 2;    // 30   (steps 2-5)
const yS = (SVG_H - (LH + 4 * SM)) / 2; // 60 (step 1, smaller matrices)

// ── step metadata ─────────────────────────────────────────────────────────────
const STEP_LABELS = [
  'Q    K    V',
  'Q  ×  Kᵀ  =  S',
  'S  /  √4  =  S_scaled',
  'softmax( S_scaled )  =  A',
  'A  ×  V  =  Output',
];
const STEP_NAMES = [
  'Queries, Keys, Values',
  'Compute raw scores',
  'Scale by √(dk)',
  'Apply softmax row-wise',
  'Compute output',
];

// ── matrix SVG group ──────────────────────────────────────────────────────────
function MatGrid({ M, cs, lw, x, y, rowLbls, colLbls, isAttn, hlRow, hlCells, hlCol, maxInRow, title }) {
  const N = M.length;
  return (
    <g>
      {title && (
        <text
          x={x + lw + 2 * cs} y={y - 4}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace" fontSize={11}
          fill="#2dd4bf" fontWeight="600"
        >{title}</text>
      )}
      {colLbls?.map((lbl, c) => (
        <text
          key={c}
          x={x + lw + c * cs + cs / 2} y={y + LH - 3}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace" fontSize={10} fill="#888888"
        >{lbl}</text>
      ))}
      {rowLbls?.map((lbl, r) => (
        <text
          key={r}
          x={x + lw - 4} y={y + LH + r * cs + cs / 2}
          textAnchor="end" dominantBaseline="central"
          fontFamily="JetBrains Mono, monospace" fontSize={10}
          fill={r === hlRow ? '#2dd4bf' : '#888888'}
        >{lbl}</text>
      ))}
      {M.map((row, r) => row.map((val, c) => {
        const cx = x + lw + c * cs;
        const cy = y + LH + r * cs;
        const isHLC   = hlCells?.some(([hr, hc]) => hr === r && hc === c);
        const isHLCol = hlCol === c;
        const isMax   = maxInRow && val === Math.max(...row);
        return (
          <g key={`${r}-${c}`}>
            {(r === hlRow || isHLCol) && (
              <rect x={cx} y={cy} width={cs} height={cs} fill="rgba(45,212,191,0.08)" />
            )}
            <rect
              x={cx + 1} y={cy + 1} width={cs - 2} height={cs - 2} rx={1}
              fill={isAttn ? attnColor(val) : divColor(val)}
            />
            <text
              x={cx + cs / 2} y={cy + cs / 2}
              textAnchor="middle" dominantBaseline="central"
              fontFamily="JetBrains Mono, monospace"
              fontSize={cs >= 44 ? 10 : 9} fill="rgba(255,255,255,0.9)"
            >{val.toFixed(2)}</text>
            {(isHLC || isMax) && (
              <rect
                x={cx + 1} y={cy + 1} width={cs - 2} height={cs - 2} rx={1}
                fill="none" stroke="#2dd4bf" strokeWidth={isHLC ? 2.5 : 1.5}
              />
            )}
          </g>
        );
      }))}
      {hlRow != null && (
        <rect x={x + lw} y={y + LH + hlRow * cs} width={3} height={cs} fill="#2dd4bf" />
      )}
    </g>
  );
}

function OpText({ text, x, y }) {
  return (
    <text
      x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fontFamily="JetBrains Mono, monospace" fontSize={20} fill="#555555"
    >{text}</text>
  );
}

// ── per-step SVG content ──────────────────────────────────────────────────────
function renderStep(step, q) {
  const T = TOKENS;

  if (step === 1) {
    const totalW = 3 * sW + 2 * 22;
    const x0 = (SVG_W - totalW) / 2;
    const y  = yS;
    return (
      <g>
        <MatGrid M={Q_MAT} cs={SM} lw={LS} x={x0}           y={y} rowLbls={T} colLbls={T} hlRow={q} title="Q" />
        <MatGrid M={K_MAT} cs={SM} lw={LS} x={x0 + sW + 22} y={y} rowLbls={T} colLbls={T} hlRow={q} title="K" />
        <MatGrid M={V_MAT} cs={SM} lw={LS} x={x0 + 2*(sW + 22)} y={y} rowLbls={T} colLbls={T} hlRow={q} title="V" />
      </g>
    );
  }

  if (step === 2) {
    const gap = 22;
    const totalW = sW + gap + sW + gap + fW;
    const x0  = (SVG_W - totalW) / 2;
    const xKt = x0 + sW + gap;
    const xS  = xKt + sW + gap;
    const y   = yF;
    const opY = y + LH + 2 * SM;
    const maxSIdx = S_RAW[q].indexOf(Math.max(...S_RAW[q]));
    return (
      <g>
        <MatGrid M={Q_MAT} cs={SM} lw={LS} x={x0}  y={y} rowLbls={T} colLbls={T} hlRow={q} title="Q" />
        <OpText text="×" x={x0 + sW + gap / 2} y={opY} />
        <MatGrid M={Kt}    cs={SM} lw={LS} x={xKt} y={y} rowLbls={T} colLbls={T} hlRow={null} hlCol={maxSIdx} title="Kᵀ" />
        <OpText text="=" x={xKt + sW + gap / 2} y={opY} />
        <MatGrid M={S_RAW} cs={F}  lw={LF} x={xS}  y={y} rowLbls={T} colLbls={T} hlRow={q} hlCells={[[q, maxSIdx]]} title="S" />
      </g>
    );
  }

  if (step === 3) {
    const gap = 32;
    const totalW = fW + gap + fW;
    const x0  = (SVG_W - totalW) / 2;
    const xSs = x0 + fW + gap;
    const y   = yF;
    const opY = y + LH + 2 * F;
    const opX = x0 + fW + gap / 2;
    return (
      <g>
        <MatGrid M={S_RAW} cs={F} lw={LF} x={x0}  y={y} rowLbls={T} colLbls={T} hlRow={q} title="S" />
        <OpText text="/" x={opX} y={opY} />
        <text x={opX} y={opY + 22} textAnchor="middle"
          fontFamily="JetBrains Mono, monospace" fontSize={9} fill="#555555">√dk=2</text>
        <MatGrid M={S_SC}  cs={F} lw={LF} x={xSs} y={y} rowLbls={T} colLbls={T} hlRow={q} title="S_scaled" />
      </g>
    );
  }

  if (step === 4) {
    const gap = 32;
    const totalW = fW + gap + fW;
    const x0 = (SVG_W - totalW) / 2;
    const xA = x0 + fW + gap;
    const y  = yF;
    const opY = y + LH + 2 * F;
    const sumY = y + LH + q * F + F / 2;
    const aRightX = xA + LF + 4 * F + 5;
    return (
      <g>
        <MatGrid M={S_SC}  cs={F} lw={LF} x={x0} y={y} rowLbls={T} colLbls={T} hlRow={q} title="S_scaled" />
        <OpText text="→" x={x0 + fW + gap / 2} y={opY} />
        <MatGrid M={A_MAT} cs={F} lw={LF} x={xA} y={y} rowLbls={T} colLbls={T}
          hlRow={q} isAttn maxInRow title="A" />
        {aRightX < SVG_W && (
          <text x={aRightX} y={sumY} textAnchor="start" dominantBaseline="central"
            fontFamily="JetBrains Mono, monospace" fontSize={9} fill="#2dd4bf">
            sum=1.00
          </text>
        )}
      </g>
    );
  }

  if (step === 5) {
    const gap = 22;
    const totalW = sW + gap + sW + gap + fW;
    const x0   = (SVG_W - totalW) / 2;
    const xV   = x0 + sW + gap;
    const xOut = xV + sW + gap;
    const y    = yF;
    const opY  = y + LH + 2 * SM;
    const weights = A_MAT[q];
    const annotParts = weights.map((w, i) => `${w.toFixed(2)}·[${TOKENS[i]}]`).join(' + ');
    return (
      <g>
        <MatGrid M={A_MAT} cs={SM} lw={LS} x={x0}   y={y} rowLbls={T} colLbls={T} hlRow={q} isAttn title="A" />
        <OpText text="×" x={x0 + sW + gap / 2} y={opY} />
        <MatGrid M={V_MAT} cs={SM} lw={LS} x={xV}   y={y} rowLbls={T} colLbls={T} hlRow={null} title="V" />
        <OpText text="=" x={xV + sW + gap / 2} y={opY} />
        <MatGrid M={OUT}   cs={F}  lw={LF} x={xOut} y={y} rowLbls={T} colLbls={T} hlRow={q} title="Output" />
        <text x={SVG_W / 2} y={y + fH + 16} textAnchor="middle"
          fontFamily="JetBrains Mono, monospace" fontSize={8} fill="#2dd4bf">
          {`out[${TOKENS[q]}] = ${annotParts}`}
        </text>
      </g>
    );
  }

  return null;
}

// ── descriptions ──────────────────────────────────────────────────────────────
function getDesc(step, q) {
  const t       = TOKENS[q];
  const scores  = S_RAW[q];
  const attnRow = A_MAT[q];
  const maxSIdx = scores.indexOf(Math.max(...scores));
  const maxAIdx = attnRow.indexOf(Math.max(...attnRow));
  const maxAT   = TOKENS[maxAIdx];
  const ent     = rowEntropy(attnRow);
  // With a fixed 4-token vocabulary, max row entropy is ln(4) ≈ 1.386 nats, and the
  // 4 query rows actually span ~1.157–1.288 nats (traced: learning 1.157, love 1.187,
  // deep 1.220, I 1.288) — thresholds are calibrated to that real range so all three
  // labels are reachable (a >1.6 "diffuse" cutoff is unreachable for 4 outcomes).
  const focus   = ent < 1.17 ? 'sharp focus' : ent < 1.25 ? 'moderate spread' : 'diffuse';

  switch (step) {
    case 1: return `Each token's embedding is linearly projected into three separate spaces: queries (what I'm looking for), keys (what I offer to others), and values (what I contribute if attended to). These projections are learned during training.`;
    case 2: return `The dot product Q[i]·K[j] measures how much token i should attend to token j. For "${t}", the strongest raw score is with "${TOKENS[maxSIdx]}" (${Math.max(...scores).toFixed(2)}). Raw scores are unbounded and can be large for high-dimensional keys.`;
    case 3: return `Without scaling, dot products grow with dimension dk — high values push softmax into saturation where gradients are near zero. Dividing by √dk = ${Math.sqrt(4)} keeps the variance of dot products near 1.0 regardless of model dimension.`;
    case 4: return `Softmax normalizes each row to a probability distribution. "${t}" attends most to "${maxAT}" (weight ${Math.max(...attnRow).toFixed(2)}, entropy H=${ent.toFixed(2)} nats — ${focus}).`;
    case 5: return `Each output row is a weighted sum of value rows, using attention weights as coefficients. The output for "${t}" is dominated by "${maxAT}" (weight ${Math.max(...attnRow).toFixed(2)}).`;
    default: return '';
  }
}

// ── horizontal stats bar ──────────────────────────────────────────────────────
function StatItem({ label, val }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px', color: '#555555',
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>{label}</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px', color: '#2dd4bf',
      }}>{val}</div>
    </div>
  );
}

function StatsBar({ step, q }) {
  const t       = TOKENS[q];
  const attnRow = A_MAT[q];
  const maxAIdx = attnRow.indexOf(Math.max(...attnRow));
  const maxAT   = TOKENS[maxAIdx];
  const outRow  = OUT[q];
  const maxRaw  = Math.max(...S_RAW.map(r => Math.max(...r))).toFixed(2);
  const maxSc   = Math.max(...S_SC.map(r => Math.max(...r))).toFixed(2);

  const divider = (
    <div style={{ width: '1px', background: '#242424', alignSelf: 'stretch', margin: '0 4px' }} />
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap',
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: '6px', padding: '9px 14px', marginTop: '10px',
    }}>
      <StatItem label="Step" val={`${step} / 5`} />
      {divider}
      <StatItem label="Matrix" val="4 × 4" />
      {divider}
      {(step === 2 || step === 3) && (
        <>
          <StatItem label="Max score (raw)"    val={maxRaw} />
          {divider}
          <StatItem label="Max score (scaled)" val={maxSc} />
        </>
      )}
      {step === 4 && (
        <>
          <StatItem label={`"${t}" attends most to`} val={`"${maxAT}"  (${Math.max(...attnRow).toFixed(2)})`} />
          {divider}
          <StatItem label="Entropy H" val={`${rowEntropy(attnRow).toFixed(2)} nats`} />
        </>
      )}
      {step === 5 && (
        <>
          <StatItem label={`‖out[${t}]‖₂`} val={l2norm(outRow).toFixed(3)} />
          {divider}
          <StatItem label="Max contribution" val={`"${maxAT}"  (${Math.max(...attnRow).toFixed(2)})`} />
        </>
      )}
      {step === 1 && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px', color: '#555555',
        }}>
          Select a query token below to highlight its row across all three matrices.
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
const mono = { fontFamily: "'JetBrains Mono', monospace" };

export default function QKVInspector({ tryThis }) {
  const [step, setStep]       = useState(1);
  const [q, setQ]             = useState(1); // default: love
  const [descKey, setDescKey] = useState(0);
  const [descOpacity, setDescOpacity] = useState(1);

  function goTo(s) {
    if (s < 1 || s > 5) return;
    setStep(s);
    setDescOpacity(0);
    setDescKey(k => k + 1);
  }

  function selectQuery(i) {
    setQ(i);
    setDescOpacity(0);
    setDescKey(k => k + 1);
  }

  useEffect(() => {
    if (descOpacity === 0) {
      const id = setTimeout(() => setDescOpacity(1), 30);
      return () => clearTimeout(id);
    }
  }, [descKey, descOpacity]);

  return (
    <WidgetCard title="QKV Inspector — inside scaled dot-product attention" number="9.2" tryThis={tryThis}>

      {/* Equation label */}
      <div style={{
        ...mono, fontSize: '12px', color: '#555555',
        textAlign: 'center', marginBottom: '8px', letterSpacing: '0.04em',
      }}>
        {STEP_LABELS[step - 1]}
      </div>

      {/* SVG display — full width now that stats panel is below */}
      <div style={{ background: '#0a0a0a', borderRadius: '6px', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
          {renderStep(step, q)}
        </svg>
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <div
            key={s}
            onClick={() => goTo(s)}
            style={{
              width: s === step ? '10px' : '7px',
              height: s === step ? '10px' : '7px',
              borderRadius: '50%',
              background: s === step ? '#2dd4bf' : s < step ? '#2e2e2e' : '#242424',
              cursor: 'pointer',
              transition: 'all 150ms',
              marginTop: s === step ? 0 : '1.5px',
            }}
          />
        ))}
      </div>

      {/* Description */}
      <div
        key={descKey}
        style={{
          background: 'var(--bg3)', borderTop: '1px solid var(--border)',
          padding: '12px 14px', marginTop: '12px', borderRadius: '6px',
          minHeight: '68px',
          opacity: descOpacity, transition: 'opacity 200ms ease',
        }}
      >
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px', color: '#b8c4cc', lineHeight: 1.6, margin: 0,
        }}>{getDesc(step, q)}</p>
      </div>

      {/* Controls row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginTop: '12px', flexWrap: 'wrap',
      }}>
        <button
          onClick={() => goTo(step - 1)}
          disabled={step === 1}
          style={{
            ...mono, fontSize: '11px',
            padding: '5px 12px', borderRadius: '5px', cursor: step === 1 ? 'default' : 'pointer',
            background: step === 1 ? '#1a1a1a' : '#1e1e1e',
            color: step === 1 ? '#555555' : '#888888',
            border: '1px solid #242424',
          }}
        >← Prev</button>

        <span style={{ ...mono, fontSize: '11px', color: '#555555', flex: 1, textAlign: 'center' }}>
          Step {step} of 5
        </span>

        <button
          onClick={() => goTo(step + 1)}
          disabled={step === 5}
          style={{
            ...mono, fontSize: '11px',
            padding: '5px 14px', borderRadius: '5px',
            cursor: step === 5 ? 'default' : 'pointer',
            background: step === 5 ? '#1a1a1a' : 'var(--accent-dim, #0b2422)',
            color: step === 5 ? '#555555' : '#2dd4bf',
            border: `1px solid ${step === 5 ? '#242424' : '#2dd4bf44'}`,
            fontWeight: 600,
          }}
        >Next →</button>

        {/* Query tabs */}
        <div style={{
          display: 'inline-flex',
          border: '1px solid #242424', borderRadius: '5px', overflow: 'hidden',
          marginLeft: '6px',
        }}>
          {TOKENS.map((tok, i) => (
            <button
              key={i}
              onClick={() => selectQuery(i)}
              style={{
                ...mono, fontSize: '11px',
                padding: '5px 10px', cursor: 'pointer',
                background: q === i ? 'var(--accent-dim, #0b2422)' : 'transparent',
                color: q === i ? '#2dd4bf' : '#555555',
                border: 'none',
                borderRight: i < TOKENS.length - 1 ? '1px solid #242424' : 'none',
                fontWeight: q === i ? 600 : 400,
                transition: 'background 150ms, color 150ms',
              }}
            >{tok}</button>
          ))}
        </div>
      </div>

      {/* Stats bar — below everything, horizontal layout */}
      <StatsBar step={step} q={q} />
    </WidgetCard>
  );
}
