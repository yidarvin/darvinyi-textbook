import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Inter', sans-serif";

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  border:    '#242424',
  codeBg:    '#0a0a0a',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  text:      '#e8eaed',
  mid:       '#888888',
  muted:     '#555555',
};

// ── Data ──────────────────────────────────────────────────────────────────────

const WORDS = ['the','cat','sat','on','mat','a','dog','ran'];
const COOC = [
  [ 0, 5, 3, 2, 3, 8, 2, 1],
  [ 5, 0, 8, 3, 4, 2, 3, 1],
  [ 3, 8, 0, 6, 5, 1, 2, 4],
  [ 2, 3, 6, 0, 7, 3, 1, 2],
  [ 3, 4, 5, 7, 0, 2, 1, 2],
  [ 8, 2, 1, 3, 2, 0, 6, 3],
  [ 2, 3, 2, 1, 1, 6, 0, 7],
  [ 1, 1, 4, 2, 2, 3, 7, 0],
];
const MAX_COOC = 8;

const KNOWN = new Set([
  'the','cat','sat','on','mat','dog','ran',
  'play','playing','plays','played','player',
  'run','running','walk','walking','king','queen','man','woman',
]);

const MORPH_GROUPS = [
  ['play','plays','played','playing','player'],
  ['run','runs','ran','running','runner'],
  ['walk','walks','walked','walking','walker'],
];

const NGRAM_COLORS = { 3: C.accent, 4: C.orange, 5: C.purple, 6: C.math };

// ── Math ──────────────────────────────────────────────────────────────────────

const gloveF = (x, xMax = 8, alpha = 0.75) =>
  x > 0 && x < xMax ? Math.pow(x / xMax, alpha) : (x >= xMax ? 1.0 : 0.0);

// ── N-gram extraction ─────────────────────────────────────────────────────────

function getNgrams(word, minN, maxN) {
  if (!word) return [];
  const padded = '<' + word + '>';
  const set = new Set([padded]);
  for (let n = minN; n <= maxN; n++)
    for (let i = 0; i <= padded.length - n; i++)
      set.add(padded.slice(i, i + n));
  return [...set];
}

function getNgramsByLength(word, minN, maxN) {
  if (!word) return { full: '', byLength: {} };
  const padded = '<' + word + '>';
  const byLength = {};
  for (let n = minN; n <= maxN; n++) {
    const seen = new Set();
    byLength[n] = [];
    for (let i = 0; i <= padded.length - n; i++) {
      const g = padded.slice(i, i + n);
      if (!seen.has(g)) { seen.add(g); byLength[n].push(g); }
    }
  }
  return { full: padded, byLength };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NgramPill({ text, color, larger }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: larger ? '11px' : '10px',
      padding: '3px 8px', borderRadius: '12px',
      background: `${color}26`, border: `1px solid ${color}`,
      color, display: 'inline-block', lineHeight: 1.2,
    }}>
      {text}
    </span>
  );
}

function InlineTag({ color, text }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: '9px', padding: '2px 7px',
      borderRadius: '10px', background: `${color}20`,
      border: `1px solid ${color}`, color, display: 'inline-block',
    }}>
      {text}
    </span>
  );
}

function StripCell({ label, value, vc }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: '12px', color: vc || C.accent, wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}

function btnStyle(active, col = C.accent) {
  return {
    fontFamily: MONO, fontSize: '10px', cursor: 'pointer',
    color: active ? col : C.muted,
    background: active ? C.accentDim : 'transparent',
    border: `1px solid ${active ? col : C.border}`,
    borderRadius: '4px', padding: '3px 9px',
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GloVeFastText({ tryThis }) {
  const [selectedCell, setSelectedCell] = useState([1, 2]); // cat, sat
  const [logScale,     setLogScale]     = useState(false);
  const [inputWord,    setInputWord]    = useState('playing');
  const [minN,         setMinN]         = useState(3);
  const [maxN,         setMaxN]         = useState(6);
  const [showForms,    setShowForms]    = useState(true);

  const canvasRef     = useRef(null);
  const lossCanvasRef = useRef(null);

  // ── Derived: GloVe ──────────────────────────────────────────────────────────
  const [si, sj] = selectedCell;
  const xij    = COOC[si][sj];
  const logXij = xij > 0 ? Math.log(xij) : 0;
  const fXij   = gloveF(xij);

  // ── Derived: fastText ───────────────────────────────────────────────────────
  const word = inputWord.toLowerCase();
  const { full, byLength } = getNgramsByLength(word, minN, maxN);
  const allNgrams   = getNgrams(word, minN, maxN);
  const totalNgrams = allNgrams.length;
  const inVocab     = KNOWN.has(word);
  const morphGroup  = word ? (MORPH_GROUPS.find(g => g.includes(word)) || null) : null;
  const repNgrams   = allNgrams.filter(g => g !== full).slice(0, 5);

  // OOV arrow viz constants
  const OVW = 220, OVH = 82, srcY = 10;
  const boxW = 86, boxH = 14;
  const bx   = (OVW - boxW) / 2;
  const by   = OVH - boxH - 4;
  const bcx  = OVW / 2;
  const NR   = repNgrams.length;

  // ── Draw heatmap ────────────────────────────────────────────────────────────
  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const N = 8, LW = 32, TH = 18, LH = 20;
    const cw = (W - LW) / N;
    const ch = (H - TH - LH) / N;

    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.font = `500 11px ${SANS}`;
    ctx.fillStyle = C.text;
    ctx.textAlign = 'left';
    ctx.fillText('Co-occurrence Matrix X', LW, TH - 4);

    // Column + row labels
    ctx.font = `9px ${MONO}`;
    ctx.fillStyle = C.mid;
    for (let j = 0; j < N; j++) {
      ctx.textAlign = 'center';
      ctx.fillText(WORDS[j], LW + j * cw + cw / 2, TH + LH - 4);
    }
    for (let i = 0; i < N; i++) {
      ctx.textAlign = 'right';
      ctx.fillText(WORDS[i], LW - 3, TH + LH + i * ch + ch / 2 + 3);
    }

    // Cells
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const count = COOC[i][j];
        const cx = LW + j * cw;
        const cy = TH + LH + i * ch;
        const isSelected = i === si && j === sj;
        const isDiag     = i === j;

        let fill;
        if (isDiag) {
          fill = C.bg4;
        } else {
          const t = logScale
            ? (count > 0 ? Math.log(count) / Math.log(MAX_COOC) : 0)
            : count / MAX_COOC;
          fill = `rgb(${Math.round(10 + t * 35)},${Math.round(10 + t * 202)},${Math.round(10 + t * 181)})`;
        }

        ctx.fillStyle = fill;
        ctx.fillRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);

        if (isSelected) {
          ctx.strokeStyle = C.math;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx + 1, cy + 1, cw - 2, ch - 2);
        }

        ctx.font = `8px ${MONO}`;
        ctx.textAlign = 'center';
        if (isDiag) {
          ctx.fillStyle = C.muted;
          ctx.fillText('—', cx + cw / 2, cy + ch / 2 + 3);
        } else {
          ctx.fillStyle = '#fff';
          ctx.fillText(count, cx + cw / 2, cy + ch / 2 + 3);
        }
      }
    }
  }, [si, sj, logScale]);

  // ── Draw loss chart ─────────────────────────────────────────────────────────
  const drawLossChart = useCallback(() => {
    const canvas = lossCanvasRef.current;
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const PL = 26, PR = 6, PT = 4, PB = 14;
    const PW = W - PL - PR, PH = H - PT - PB;
    const XM = 10;

    ctx.clearRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PL, PT); ctx.lineTo(PL, PT + PH); ctx.lineTo(PL + PW, PT + PH);
    ctx.stroke();

    ctx.font = `7px ${MONO}`;
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'right';
    ctx.fillText('1', PL - 2, PT + 5);
    ctx.fillText('0', PL - 2, PT + PH + 2);
    ctx.textAlign = 'center';
    ctx.fillText('0', PL, PT + PH + 10);
    ctx.fillText('8', PL + PW * 8 / XM, PT + PH + 10);

    // f(x) curve
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let first = true;
    for (let x = 0.01; x <= XM; x += 0.05) {
      const px = PL + (x / XM) * PW;
      const py = PT + PH - gloveF(x) * PH;
      if (first) { ctx.moveTo(px, py); first = false; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Marker at current xij
    if (xij > 0) {
      const mx = PL + (xij / XM) * PW;
      ctx.strokeStyle = C.math;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(mx, PT); ctx.lineTo(mx, PT + PH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `7px ${MONO}`;
      ctx.fillStyle = C.math;
      ctx.textAlign = 'center';
      ctx.fillText(xij, mx, PT + PH + 10);
    }
  }, [xij]);

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => { drawHeatmap(); }, [drawHeatmap]);
  useEffect(() => { drawLossChart(); }, [drawLossChart]);

  useEffect(() => {
    const obs = new ResizeObserver(() => { drawHeatmap(); drawLossChart(); });
    if (canvasRef.current)     obs.observe(canvasRef.current);
    if (lossCanvasRef.current) obs.observe(lossCanvasRef.current);
    return () => obs.disconnect();
  }, [drawHeatmap, drawLossChart]);

  // ── Canvas click ─────────────────────────────────────────────────────────────
  function handleHeatmapClick(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const LW = 32, TH = 18, LH = 20;
    const cw = (rect.width  - LW) / 8;
    const ch = (rect.height - TH - LH) / 8;
    const j = Math.floor((e.clientX - rect.left - LW) / cw);
    const i = Math.floor((e.clientY - rect.top  - TH - LH) / ch);
    if (i < 0 || i >= 8 || j < 0 || j >= 8 || i === j) return;
    setSelectedCell([i, j]);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <WidgetCard title="GloVe & fastText — co-occurrence matrices and subword models" number="7.4" tryThis={tryThis}>

      {/* ── Two panels side by side (each ~302px) ─────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* ── LEFT: GloVe ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Heatmap */}
          <div style={{ background: C.codeBg, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: '100%', height: '240px', cursor: 'pointer' }}
              onClick={handleHeatmapClick}
            />
          </div>

          {/* GloVe loss section */}
          <div style={{ marginTop: '8px', background: C.bg3, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ fontFamily: MONO, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              GloVe Training Signal
            </div>

            <div style={{
              fontFamily: MONO, fontSize: '10px', color: C.math,
              background: C.codeBg, border: `1px solid ${C.border}`,
              padding: '4px 8px', borderRadius: '4px', marginBottom: '8px',
            }}>
              f(X) × (v·v′ + b + b′ − log X)²
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', marginBottom: '8px', fontFamily: MONO, fontSize: '10px' }}>
              {[
                ['Words',    `${WORDS[si]}, ${WORDS[sj]}`],
                ['X_ij',     xij],
                ['log X_ij', xij > 0 ? logXij.toFixed(2) : '—'],
                ['f(X_ij)',  fXij.toFixed(3)],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <span style={{ color: C.muted }}>{lbl}: </span>
                  <span style={{ color: C.accent }}>{val}</span>
                </div>
              ))}
            </div>

            <canvas
              ref={lossCanvasRef}
              style={{ display: 'block', width: '100%', height: '60px' }}
            />

            <div style={{ fontFamily: SANS, fontSize: '9px', color: C.muted, marginTop: '5px', lineHeight: 1.4 }}>
              {xij >= MAX_COOC ? 'High co-occ → f(x) = 1.0, full training signal.' :
               xij  > 0       ? 'Rare pairs → downweighted by f(x).' :
               'Zero co-occ → no training signal.'}
            </div>
          </div>

        </div>

        {/* ── RIGHT: fastText ───────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ fontFamily: SANS, fontSize: '11px', color: C.text, marginBottom: '8px' }}>
            fastText Subword Decomposition
          </div>

          {!word ? (
            <div style={{ fontFamily: MONO, fontSize: '10px', color: C.muted, padding: '20px 0' }}>
              Enter a word below to see decomposition.
            </div>
          ) : (
            <>
              {/* Full word token */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Full word token
                </div>
                <NgramPill text={full} color={C.green} larger />
              </div>

              {/* N-gram pills by length */}
              {[3, 4, 5, 6].filter(n => n >= minN && n <= maxN).map(n => {
                const grams = byLength[n] || [];
                if (!grams.length) return null;
                return (
                  <div key={n} style={{ marginBottom: '6px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                      {n}-grams ({grams.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {grams.map(g => (
                        <NgramPill key={g} text={g} color={NGRAM_COLORS[n] || C.mid} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div style={{ fontFamily: MONO, fontSize: '10px', color: C.muted, marginBottom: '10px' }}>
                Total subwords: {totalNgrams} (including full word)
              </div>

              {/* In-vocab / OOV */}
              <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '8px 10px' }}>
                {inVocab ? (
                  <>
                    <InlineTag color={C.green} text="✓ In vocabulary" />
                    <div style={{ marginTop: '6px', fontFamily: SANS, fontSize: '10px', color: C.muted, lineHeight: 1.4 }}>
                      Embedding = weighted average of {totalNgrams} n-gram vectors — adds morphological robustness, even for known words.
                    </div>
                  </>
                ) : (
                  <>
                    <InlineTag color={C.orange} text="📍 Out-of-vocabulary word" />
                    <div style={{ marginTop: '6px', fontFamily: SANS, fontSize: '10px', color: C.muted }}>
                      Embedding = average of {totalNgrams} n-gram vectors
                    </div>

                    {NR > 0 && (
                      <svg viewBox={`0 0 ${OVW} ${OVH}`} width="100%" style={{ display: 'block', marginTop: '6px' }}>
                        <defs>
                          {repNgrams.map((ng, i) => {
                            const col = NGRAM_COLORS[ng.length] || C.mid;
                            return (
                              <marker key={i} id={`glv-arr-${i}`} markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
                                <path d="M0,0 L0,5 L5,2.5 z" fill={col} />
                              </marker>
                            );
                          })}
                        </defs>
                        {repNgrams.map((ng, i) => {
                          const sx = NR > 1 ? 16 + i * ((OVW - 32) / (NR - 1)) : OVW / 2;
                          const col = NGRAM_COLORS[ng.length] || C.mid;
                          return (
                            <g key={ng}>
                              <line
                                x1={sx} y1={srcY + 6} x2={bcx} y2={by}
                                stroke={col} strokeWidth={1.2} opacity={0.8}
                                markerEnd={`url(#glv-arr-${i})`}
                              />
                              <text x={sx} y={srcY + 2}
                                textAnchor="middle" fontFamily={MONO} fontSize={7} fill={col}>
                                {ng}
                              </text>
                            </g>
                          );
                        })}
                        <rect x={bx} y={by} width={boxW} height={boxH} rx={3}
                          fill={C.accentDim} stroke={C.accent} strokeWidth={1} />
                        <text x={bcx} y={by + boxH / 2}
                          textAnchor="middle" dominantBaseline="middle"
                          fontFamily={MONO} fontSize={7.5} fill={C.accent}>
                          embedding
                        </text>
                      </svg>
                    )}

                    <div style={{ fontFamily: SANS, fontSize: '9px', color: C.muted, marginTop: '4px', lineHeight: 1.4 }}>
                      fastText can embed any word — even words never seen in training.
                    </div>
                  </>
                )}
              </div>

              {/* Morphology demo */}
              {showForms && morphGroup && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Related word forms
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {morphGroup.map(w => (
                      <button key={w} onClick={() => setInputWord(w)} style={{
                        fontFamily: MONO, fontSize: '9px', cursor: 'pointer',
                        padding: '2px 8px', borderRadius: '12px',
                        background: w === word ? `${C.accent}20` : 'transparent',
                        border: `1px solid ${w === word ? C.accent : C.border}`,
                        color: w === word ? C.accent : C.mid,
                      }}>
                        {w}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '9px', color: C.muted, marginTop: '4px' }}>
                    Words sharing n-grams share embedding components.
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* ── Controls bar ──────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: '12px',
        display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
        background: C.bg3, border: `1px solid ${C.border}`,
        borderRadius: '6px', padding: '8px 12px',
      }}>

        {/* Word input */}
        <input
          type="text"
          value={inputWord}
          placeholder="Type any word…"
          maxLength={20}
          onChange={e => setInputWord(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 20))}
          style={{
            flex: 1, minWidth: 80, boxSizing: 'border-box',
            background: C.bg4, border: `1px solid ${C.border}`,
            borderRadius: '4px', padding: '4px 9px',
            fontFamily: MONO, fontSize: '11px', color: C.text, outline: 'none',
          }}
        />

        <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />

        {/* n controls */}
        <span style={{ fontFamily: MONO, fontSize: '10px', color: C.muted, flexShrink: 0 }}>min n:</span>
        {[3, 4].map(n => (
          <button key={n} onClick={() => setMinN(n)} style={btnStyle(minN === n)}>{n}</button>
        ))}
        <span style={{ fontFamily: MONO, fontSize: '10px', color: C.muted, flexShrink: 0, marginLeft: '4px' }}>max n:</span>
        {[5, 6].map(n => (
          <button key={n} onClick={() => setMaxN(n)} style={btnStyle(maxN === n)}>{n}</button>
        ))}

        <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />

        {/* Toggles */}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontFamily: MONO, fontSize: '10px', color: logScale ? C.accent : C.muted, flexShrink: 0 }}>
          <input type="checkbox" checked={logScale} onChange={e => setLogScale(e.target.checked)}
            style={{ accentColor: C.accent, cursor: 'pointer', width: '11px', height: '11px' }} />
          log scale
        </label>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontFamily: MONO, fontSize: '10px', color: showForms ? C.accent : C.muted, flexShrink: 0 }}>
          <input type="checkbox" checked={showForms} onChange={e => setShowForms(e.target.checked)}
            style={{ accentColor: C.accent, cursor: 'pointer', width: '11px', height: '11px' }} />
          word forms
        </label>

      </div>

      {/* ── Stats strip ───────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: '10px',
        display: 'flex', alignItems: 'stretch',
        background: C.bg2, border: `1px solid ${C.border}`,
        borderRadius: '8px', padding: '10px 16px', gap: '0',
      }}>

        {/* Section 1: GloVe */}
        <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <StripCell label="pair"  value={`${WORDS[si]}, ${WORDS[sj]}`} vc={C.accent} />
          <StripCell label="Xᵢⱼ"  value={xij}                           vc={C.accent} />
          <StripCell label="log"   value={xij > 0 ? logXij.toFixed(2) : '—'} vc={C.math} />
          <StripCell label="f(x)"  value={fXij.toFixed(3)}              vc={C.math} />
        </div>

        <div style={{ width: 1, background: C.border, margin: '0 16px', alignSelf: 'stretch' }} />

        {/* Section 2: fastText */}
        <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <StripCell label="word"  value={word || '—'}                  vc={C.accent} />
          <StripCell label="total" value={word ? totalNgrams : '—'}     vc={C.accent} />
          <StripCell label="n"     value={word ? `${minN}–${maxN}` : '—'} vc={C.mid} />
          <StripCell label="vocab" value={word ? (inVocab ? 'yes' : 'no') : '—'} vc={word ? (inVocab ? C.green : C.orange) : C.muted} />
        </div>

        <div style={{ width: 1, background: C.border, margin: '0 16px', alignSelf: 'stretch' }} />

        {/* Section 3: OOV comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0' }}>
          <div style={{ fontFamily: MONO, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            OOV handling
          </div>
          {[['fastText', C.green, '✓'], ['Word2Vec', C.red, '✗'], ['GloVe', C.red, '✗']].map(([nm, vc, sym]) => (
            <div key={nm} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '3px' }}>
              <span style={{ fontFamily: MONO, fontSize: '9.5px', color: C.muted }}>{nm}</span>
              <span style={{ fontFamily: MONO, fontSize: '9.5px', color: vc, fontWeight: 600 }}>{sym}</span>
            </div>
          ))}
        </div>

      </div>

    </WidgetCard>
  );
}
