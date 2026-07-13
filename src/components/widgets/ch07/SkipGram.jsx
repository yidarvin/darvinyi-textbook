import { useState, useRef, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Inter', sans-serif";

// ── Data ──────────────────────────────────────────────────────────────────────

const SENTENCE = ["the","cat","sat","on","the","mat","at","home"];
const VOCAB    = ["the","cat","sat","on","mat","at","home"];

const INIT_W_IN = {
  the:  [ 0.12,-0.08, 0.31, 0.05],
  cat:  [ 0.55, 0.42,-0.18, 0.67],
  sat:  [-0.22, 0.71, 0.44,-0.31],
  on:   [ 0.08,-0.44, 0.19, 0.52],
  mat:  [ 0.48, 0.39,-0.25, 0.61],
  at:   [ 0.05,-0.12, 0.38, 0.47],
  home: [-0.31, 0.58, 0.22,-0.14],
};

const INIT_W_OUT = {
  the:  [ 0.10,-0.05, 0.22, 0.08],
  cat:  [ 0.48, 0.35,-0.20, 0.55],
  sat:  [-0.18, 0.62, 0.38,-0.25],
  on:   [ 0.05,-0.38, 0.15, 0.45],
  mat:  [ 0.42, 0.30,-0.18, 0.50],
  at:   [ 0.03,-0.10, 0.32, 0.40],
  home: [-0.25, 0.50, 0.18,-0.10],
};

const LR = 0.05;

const PCA_COLOR = {
  the:'#2dd4bf', cat:'#2dd4bf', sat:'#2dd4bf', on:'#2dd4bf',
  mat:'#fb923c', at:'#fb923c', home:'#fb923c',
};

// ── Math ──────────────────────────────────────────────────────────────────────

const sigmoid = x => 1 / (1 + Math.exp(-x));
const dot = (a, b) => a.reduce((s,v,i) => s + v*b[i], 0);

function cosSim(a, b) {
  const d  = dot(a, b);
  const na = Math.sqrt(a.reduce((s,v) => s+v*v, 0));
  const nb = Math.sqrt(b.reduce((s,v) => s+v*v, 0));
  return d / (na * nb + 1e-8);
}

function deepClone(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k,v]) => [k,[...v]]));
}

function softmaxProbs(center, Win, Wout) {
  const cv    = Win[center];
  const scores = VOCAB.map(w => dot(cv, Wout[w]));
  const maxS  = Math.max(...scores);
  const exps  = scores.map(s => Math.exp(s - maxS));
  const sum   = exps.reduce((a,b) => a+b, 0);
  return exps.map(e => e / sum);
}

// ── PCA ───────────────────────────────────────────────────────────────────────

function computePCA(Win) {
  const vecs = VOCAB.map(w => Win[w]);
  const n = vecs.length, dim = 4;

  const mean = Array(dim).fill(0);
  for (const v of vecs) for (let d = 0; d < dim; d++) mean[d] += v[d] / n;

  const cen = vecs.map(v => v.map((x,d) => x - mean[d]));
  const cov = Array.from({length:dim}, () => Array(dim).fill(0));
  for (const v of cen)
    for (let i = 0; i < dim; i++)
      for (let j = 0; j < dim; j++)
        cov[i][j] += v[i]*v[j]/n;

  function powerIter(excl) {
    let v = Array.from({length:dim}, (_,i) => i===0 ? 1 : 0.3);
    let norm = Math.sqrt(v.reduce((s,x) => s+x*x, 0));
    v = v.map(x => x/norm);
    for (let it = 0; it < 300; it++) {
      const mv = Array(dim).fill(0);
      for (let i = 0; i < dim; i++)
        for (let j = 0; j < dim; j++)
          mv[i] += cov[i][j]*v[j];
      for (const ex of excl) {
        const d = mv.reduce((s,x,i) => s+x*ex[i], 0);
        for (let i = 0; i < dim; i++) mv[i] -= d*ex[i];
      }
      norm = Math.sqrt(mv.reduce((s,x) => s+x*x, 0));
      if (norm < 1e-10) break;
      v = mv.map(x => x/norm);
    }
    return v;
  }

  const pc1 = powerIter([]);
  const pc2 = powerIter([pc1]);
  return [pc1, pc2];
}

function getProjections(pca, Win, scale) {
  const { xMin, xMax, yMin, yMax } = scale;
  const xR = (xMax - xMin) || 1;
  const yR = (yMax - yMin) || 1;
  const pad = 16, pw = 160, ph = 120;
  return VOCAB.map(w => ({
    word: w,
    px: pad + (dot(Win[w], pca[0]) - xMin) / xR * (pw - 2*pad),
    py: ph - pad - (dot(Win[w], pca[1]) - yMin) / yR * (ph - 2*pad),
  }));
}

// ── Window helpers ─────────────────────────────────────────────────────────────

function getCtxPositions(cpos, wsize) {
  const res = [];
  for (let i = Math.max(0, cpos-wsize); i <= Math.min(SENTENCE.length-1, cpos+wsize); i++)
    if (i !== cpos) res.push(i);
  return res;
}

function pickNegs(cpos, wsize) {
  const inWin = new Set([cpos, ...getCtxPositions(cpos, wsize)].map(i => SENTENCE[i]));
  const cands = VOCAB.filter(w => !inWin.has(w));
  if (!cands.length) return [];
  return [...cands].sort(() => Math.random()-0.5).slice(0, 2);
}

// ── Training ──────────────────────────────────────────────────────────────────

function runTrainStep(cpos, wsize, Win, Wout, negs) {
  const center   = SENTENCE[cpos];
  const ctxWords = getCtxPositions(cpos, wsize).map(i => SENTENCE[i]);
  const gradIn   = [0,0,0,0];
  const gradOut  = {};

  function accum(target, label) {
    const prob  = sigmoid(dot(Win[center], Wout[target]));
    const delta = LR * (label - prob);
    for (let d = 0; d < 4; d++) gradIn[d] += delta * Wout[target][d];
    if (!gradOut[target]) gradOut[target] = [0,0,0,0];
    for (let d = 0; d < 4; d++) gradOut[target][d] += delta * Win[center][d];
  }

  for (const cw of ctxWords) {
    accum(cw, 1);
    for (const neg of negs) accum(neg, 0);
  }

  for (let d = 0; d < 4; d++) Win[center][d] += gradIn[d];
  for (const [w,g] of Object.entries(gradOut))
    for (let d = 0; d < 4; d++) Wout[w][d] += g[d];
}

// ── SVG constants ──────────────────────────────────────────────────────────────

// Sentence strip
const CHIP_W = 54, CHIP_H = 32, CHIP_GAP = 8;
const SW = 540, SH = 80;
const SX0 = (SW - 8*CHIP_W - 7*CHIP_GAP) / 2; // = 26

// Network diagram
const NW = 380, NH = 260;
const NL1X = 88, NL2X = 193, NL3X = 298;
const NL13Y = Array.from({length:7}, (_,i) => 22 + i*33); // [22,55,88,121,154,187,220]
const NL2Y  = [44, 97, 150, 203];                           // 4 hidden, spacing 53

// PCA plot
const PCA_VW = 160, PCA_VH = 120;

// ── Helpers ────────────────────────────────────────────────────────────────────

function btnStyle(active, col) {
  col = col || '#2dd4bf';
  return {
    fontFamily: MONO, fontSize: '11px',
    color:      active ? col    : '#555',
    background: active ? '#0b2422' : 'transparent',
    border:     `1px solid ${active ? col : '#242424'}`,
    borderRadius: '4px', padding: '5px 11px', cursor: 'pointer',
    transition: 'all 0.15s',
  };
}

function StatRow({ label, value, vc }) {
  return (
    <div style={{ marginBottom:'8px' }}>
      <div style={{ fontFamily:MONO, fontSize:'8.5px', color:'#555', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'2px' }}>
        {label}
      </div>
      <div style={{ fontFamily:MONO, fontSize:'11px', color: vc||'#2dd4bf' }}>
        {value}
      </div>
    </div>
  );
}

function HDivider() {
  return <div style={{ height:1, background:'#242424', margin:'10px 0' }} />;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SkipGram() {
  const [centerPos, setCenterPos] = useState(2);
  const [winSize,   setWinSize]   = useState(2);
  const [showNeg,   setShowNeg]   = useState(true);
  const [stepCount, setStepCount] = useState(0);
  const [flash,     setFlash]     = useState(null); // null | 'pos' | 'neg' | 'embed'
  const [negWords,  setNegWords]  = useState(['mat','at']);

  const Win    = useRef(deepClone(INIT_W_IN));
  const Wout   = useRef(deepClone(INIT_W_OUT));
  const pcaRef = useRef(null);
  const scaleRef = useRef(null);
  const timers = useRef([]);

  // Compute PCA once from initial weights; lock scale to initial extremes
  useEffect(() => {
    const pca = computePCA(INIT_W_IN);
    const pts = VOCAB.map(w => ({
      x: dot(INIT_W_IN[w], pca[0]),
      y: dot(INIT_W_IN[w], pca[1]),
    }));
    const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y);
    // Expand scale by 20% so initial dots aren't pinned to edges
    const xRange = Math.max(...xs) - Math.min(...xs) || 1;
    const yRange = Math.max(...ys) - Math.min(...ys) || 1;
    scaleRef.current = {
      xMin: Math.min(...xs) - xRange*0.15,
      xMax: Math.max(...xs) + xRange*0.15,
      yMin: Math.min(...ys) - yRange*0.15,
      yMax: Math.max(...ys) + yRange*0.15,
    };
    pcaRef.current = pca;
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }

  // ── Derived state ──────────────────────────────────────────────────────────
  const centerWord = SENTENCE[centerPos];
  const ctxPos     = getCtxPositions(centerPos, winSize);
  const ctxSet     = new Set(ctxPos);
  const ctxVocab   = [...new Set(ctxPos.map(i => SENTENCE[i]))];
  const negSet     = new Set(negWords);
  const probs      = softmaxProbs(centerWord, Win.current, Wout.current);

  const projections = (pcaRef.current && scaleRef.current)
    ? getProjections(pcaRef.current, Win.current, scaleRef.current)
    : VOCAB.map((w,i) => ({ word:w, px:20+i*20, py:60 }));

  const cosCatMat = cosSim(Win.current['cat'], Win.current['mat']);
  const cosTheOn  = cosSim(Win.current['the'], Win.current['on']);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleTrainStep() {
    clearTimers();
    const negs = pickNegs(centerPos, winSize);
    setNegWords(negs);
    setFlash('pos');
    timers.current.push(setTimeout(() => setFlash('neg'), 400));
    timers.current.push(setTimeout(() => {
      runTrainStep(centerPos, winSize, Win.current, Wout.current, negs);
      setFlash('embed');
      setStepCount(c => c+1);
    }, 800));
    timers.current.push(setTimeout(() => setFlash(null), 1300));
  }

  function handleTrain10() {
    clearTimers();
    let s = 0;
    function next() {
      if (s >= 10) return;
      const pos  = 2 + (s % 4);
      const negs = pickNegs(pos, winSize);
      if (s === 0) setNegWords(negs);
      runTrainStep(pos, winSize, Win.current, Wout.current, negs);
      s++;
      setStepCount(c => c+1);
      if (s < 10) timers.current.push(setTimeout(next, 160));
    }
    next();
  }

  function handleReset() {
    clearTimers();
    Win.current  = deepClone(INIT_W_IN);
    Wout.current = deepClone(INIT_W_OUT);
    setStepCount(0);
    setFlash(null);
    setNegWords(['mat','at']);
  }

  const canTrain = flash === null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <WidgetCard title="Skip-Gram Training — learning embeddings from context" number="5.2">
      <div style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>

        {/* ── Left column ──────────────────────────────────────────────── */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* ── Sentence strip ──────────────────────────────────────────── */}
          <div style={{ background:'#0a0a0a', border:'1px solid #242424', borderRadius:'6px', overflow:'hidden' }}>
            <svg viewBox={`0 0 ${SW} ${SH}`} width="100%" style={{ display:'block' }}>

              {/* Window bracket */}
              {(() => {
                const all    = [centerPos, ...ctxPos].sort((a,b) => a-b);
                const bx     = SX0 + all[0]*(CHIP_W+CHIP_GAP) - 5;
                const bw     = (all[all.length-1]-all[0])*(CHIP_W+CHIP_GAP) + CHIP_W + 10;
                return (
                  <g>
                    <text x={bx+bw/2} y={10}
                      textAnchor="middle" fontFamily={SANS} fontSize={9} fill="#555">
                      window (c={winSize})
                    </text>
                    <rect x={bx} y={14} width={bw} height={49}
                      fill="none" stroke="#2e2e2e" strokeWidth={1.5}
                      strokeDasharray="4 3" rx={8} />
                  </g>
                );
              })()}

              {/* Chips */}
              {SENTENCE.map((word, i) => {
                const cx  = SX0 + i*(CHIP_W+CHIP_GAP);
                const isC = i === centerPos;
                const isX = ctxSet.has(i);
                const isO = !isC && !isX;
                const fill   = isC ? '#0b2422' : isX ? 'rgba(45,212,191,0.06)' : '#1e1e1e';
                const stroke = isC ? '#2dd4bf' : isX ? '#2e2e2e' : '#242424';
                const sw2    = isC ? 2 : 1;
                const da     = isX ? '4 3' : 'none';
                const tFill  = isC ? '#2dd4bf' : isX ? '#888' : '#555';

                return (
                  <g key={i} style={{ cursor:'pointer' }} onClick={() => setCenterPos(i)}>
                    <g opacity={isO ? 0.4 : 1}>
                      <rect x={cx} y={19} width={CHIP_W} height={CHIP_H}
                        fill={fill} stroke={stroke} strokeWidth={sw2}
                        strokeDasharray={da} rx={6} />
                      <text x={cx+CHIP_W/2} y={19+CHIP_H/2}
                        textAnchor="middle" dominantBaseline="middle"
                        fontFamily={MONO} fontSize={11} fontWeight={isC?700:400}
                        fill={tFill}>
                        {word}
                      </text>
                    </g>
                    {isC && (
                      <text x={cx+CHIP_W/2} y={67}
                        textAnchor="middle" fontFamily={SANS} fontSize={8} fill="#2dd4bf">
                        center
                      </text>
                    )}
                    {isX && (
                      <text x={cx+CHIP_W/2} y={67}
                        textAnchor="middle" fontFamily={SANS} fontSize={8} fill="#888">
                        {i < centerPos ? '→' : '←'}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ── Network diagram ─────────────────────────────────────────── */}
          <div style={{ marginTop:'10px', background:'#0a0a0a', border:'1px solid #242424', borderRadius:'6px', overflow:'hidden' }}>
            <svg viewBox={`0 0 ${NW} ${NH}`} width="100%" style={{ display:'block' }}>

              {/* Matrix labels */}
              <text x={(NL1X+NL2X)/2} y={11}
                textAnchor="middle" fontFamily={MONO} fontSize={9} fill="#fbbf24">
                × W_in
              </text>
              <text x={(NL2X+NL3X)/2} y={11}
                textAnchor="middle" fontFamily={MONO} fontSize={9} fill="#fbbf24">
                × W_out
              </text>

              {/* Input → Hidden edges (center word only) */}
              {NL2Y.map((hy, hi) => {
                const iy = NL13Y[VOCAB.indexOf(centerWord)];
                const fp = flash === 'pos';
                return (
                  <line key={`ih${hi}`}
                    x1={NL1X} y1={iy} x2={NL2X} y2={hy}
                    stroke="#2dd4bf" strokeWidth={fp?3:1.5} opacity={fp?1:0.7} />
                );
              })}

              {/* Hidden → Output edges */}
              {NL2Y.flatMap((hy, hi) =>
                VOCAB.map((word, vi) => {
                  const isCtx = ctxVocab.includes(word);
                  const isNeg = showNeg && negSet.has(word);
                  const oy = NL13Y[vi];
                  const fp = flash === 'pos', fn = flash === 'neg';
                  let stroke, sw2, op;
                  if (isCtx)      { stroke='#2dd4bf'; sw2=fp?3:1.5; op=fp?1:0.7; }
                  else if (isNeg) { stroke='#f87171'; sw2=fn?2.5:1;  op=fn?1:0.45; }
                  else            { stroke='#242424'; sw2=0.3;        op=0.7; }
                  return (
                    <line key={`ho${hi}-${vi}`}
                      x1={NL2X} y1={hy} x2={NL3X} y2={oy}
                      stroke={stroke} strokeWidth={sw2} opacity={op} />
                  );
                })
              )}

              {/* Input nodes */}
              {VOCAB.map((word, vi) => {
                const y   = NL13Y[vi];
                const isC = word === centerWord;
                return (
                  <g key={`in${vi}`}>
                    <circle cx={NL1X} cy={y} r={isC?9:5}
                      fill={isC?'#2dd4bf':'#161616'}
                      stroke={isC?'#2dd4bf':'#2e2e2e'} strokeWidth={1} />
                    <text x={NL1X-13} y={y}
                      textAnchor="end" dominantBaseline="middle"
                      fontFamily={MONO} fontSize={10}
                      fill={isC?'#2dd4bf':'#888'}>
                      {word}
                    </text>
                  </g>
                );
              })}

              {/* Hidden nodes */}
              {NL2Y.map((y, hi) => {
                const fe = flash === 'embed';
                return (
                  <g key={`h${hi}`}>
                    <circle cx={NL2X} cy={y} r={7}
                      fill={fe?'#2dd4bf':'#161616'}
                      stroke={fe?'#2dd4bf':'#2e2e2e'} strokeWidth={1}
                      style={{ transition:'fill 0.3s, stroke 0.3s' }} />
                    <text x={NL2X} y={y+16}
                      textAnchor="middle" fontFamily={SANS} fontSize={7} fill="#555">
                      dim {hi+1}
                    </text>
                  </g>
                );
              })}

              {/* Output nodes */}
              {VOCAB.map((word, vi) => {
                const y     = NL13Y[vi];
                const isCtx = ctxVocab.includes(word);
                const isNeg = showNeg && negSet.has(word);
                let r, fill, stroke, tc;
                if (isCtx)      { r=8; fill='rgba(45,212,191,0.12)'; stroke='#2dd4bf'; tc='#2dd4bf'; }
                else if (isNeg) { r=7; fill='rgba(248,113,113,0.10)'; stroke='#f87171'; tc='#f87171'; }
                else            { r=5; fill='#161616'; stroke='#242424'; tc='#555'; }
                return (
                  <g key={`out${vi}`}>
                    <circle cx={NL3X} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={1} />
                    <text x={NL3X+r+4} y={y}
                      dominantBaseline="middle" fontFamily={MONO} fontSize={9} fill={tc}>
                      {probs[vi].toFixed(2)}
                    </text>
                    <text x={NL3X+r+32} y={y}
                      dominantBaseline="middle" fontFamily={MONO} fontSize={9} fill={tc}>
                      {word}
                    </text>
                  </g>
                );
              })}

              {/* Layer labels */}
              <text x={NL1X}  y={NH-5} textAnchor="middle" fontFamily={SANS} fontSize={7} fill="#444">input</text>
              <text x={NL2X}  y={NH-5} textAnchor="middle" fontFamily={SANS} fontSize={7} fill="#444">hidden</text>
              <text x={NL3X}  y={NH-5} textAnchor="middle" fontFamily={SANS} fontSize={7} fill="#444">output</text>
            </svg>
          </div>

          {/* ── PCA scatter ─────────────────────────────────────────────── */}
          <div style={{ marginTop:'10px' }}>
            <div style={{ fontFamily:SANS, fontSize:'9px', color:'#555', marginBottom:'4px' }}>
              2D PCA of Embeddings
            </div>
            <div style={{ width: PCA_VW+2, background:'#0a0a0a', border:'1px solid #242424', borderRadius:'4px', overflow:'hidden' }}>
              <svg viewBox={`0 0 ${PCA_VW} ${PCA_VH}`} width="100%" style={{ display:'block' }}>
                {projections.map(p => (
                  <g key={p.word}
                    style={{ transform:`translate(${p.px}px,${p.py}px)`, transition:'transform 0.3s ease' }}>
                    <circle cx={0} cy={0} r={4} fill={PCA_COLOR[p.word]} opacity={0.9} />
                    <text x={6} y={0} dominantBaseline="middle"
                      fontFamily={MONO} fontSize={7} fill={PCA_COLOR[p.word]}>
                      {p.word}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* ── Controls ────────────────────────────────────────────────── */}
          <div style={{ marginTop:'12px', display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
            <button onClick={() => setCenterPos(p => Math.max(0,p-1))} style={btnStyle(false)}>←</button>
            <button onClick={() => setCenterPos(p => Math.min(7,p+1))} style={btnStyle(false)}>→</button>

            <div style={{ width:1, height:22, background:'#242424', flexShrink:0 }} />

            <button
              onClick={handleTrainStep}
              disabled={!canTrain}
              style={{ ...btnStyle(false), opacity:canTrain?1:0.35, cursor:canTrain?'pointer':'default' }}>
              Train Step
            </button>
            <button
              onClick={handleTrain10}
              disabled={!canTrain}
              style={{ ...btnStyle(false), opacity:canTrain?1:0.35, cursor:canTrain?'pointer':'default' }}>
              Train 10
            </button>
            <button onClick={handleReset} style={btnStyle(false)}>Reset</button>

            <div style={{ width:1, height:22, background:'#242424', flexShrink:0 }} />

            <span style={{ fontFamily:MONO, fontSize:'10px', color:'#555', flexShrink:0 }}>c:</span>
            <button onClick={() => setWinSize(1)} style={btnStyle(winSize===1)}>1</button>
            <button onClick={() => setWinSize(2)} style={btnStyle(winSize===2)}>2</button>

            <div style={{ width:1, height:22, background:'#242424', flexShrink:0 }} />

            <label style={{ display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', fontFamily:MONO, fontSize:'10px', color:showNeg?'#2dd4bf':'#555' }}>
              <input type="checkbox" checked={showNeg} onChange={e => setShowNeg(e.target.checked)}
                style={{ accentColor:'#2dd4bf', cursor:'pointer', width:'12px', height:'12px' }} />
              show neg
            </label>
          </div>
        </div>

        {/* ── Stats panel (180px) ──────────────────────────────────────── */}
        <div style={{ width:180, flexShrink:0 }}>
          <div style={{ background:'#111111', border:'1px solid #242424', borderRadius:'8px', padding:'14px 12px' }}>

            <StatRow label="Center"      value={centerWord}                vc="#2dd4bf" />
            <StatRow label="Context"     value={ctxVocab.join(', ')||'—'} vc="#888" />
            <StatRow label="Neg samples" value={negWords.join(', ')||'—'} vc="#f87171" />

            <HDivider />

            <StatRow label="Steps run"  value={stepCount} vc="#2dd4bf" />
            <StatRow label="Learn rate" value="0.05"      vc="#555" />
            <StatRow label="Embed dim"  value="4"         vc="#555" />
            <StatRow label="Vocab size" value="7"         vc="#555" />

            <HDivider />

            <div style={{ fontFamily:MONO, fontSize:'8.5px', color:'#555', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>
              W_in[{centerWord}]
            </div>
            {Win.current[centerWord].map((v,d) => (
              <div key={d} style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ fontFamily:MONO, fontSize:'9px', color:'#555' }}>dim {d+1}</span>
                <span style={{ fontFamily:MONO, fontSize:'10px', color: v>=0?'#2dd4bf':'#f87171' }}>
                  {v >= 0 ? ' ' : ''}{v.toFixed(3)}
                </span>
              </div>
            ))}

            <HDivider />

            <div style={{ fontFamily:MONO, fontSize:'8.5px', color:'#555', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>
              Cosine Sim
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
              <span style={{ fontFamily:MONO, fontSize:'9px', color:'#555' }}>cat/mat</span>
              <span style={{ fontFamily:MONO, fontSize:'10px', color:'#2dd4bf' }}>{cosCatMat.toFixed(3)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontFamily:MONO, fontSize:'9px', color:'#555' }}>the/on</span>
              <span style={{ fontFamily:MONO, fontSize:'10px', color:'#2dd4bf' }}>{cosTheOn.toFixed(3)}</span>
            </div>

          </div>
        </div>

      </div>
    </WidgetCard>
  );
}
