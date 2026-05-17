import { useState, useRef, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Inter', sans-serif";

// ── Cluster colors ────────────────────────────────────────────────────────────

const CC = {
  royalty:   '#2dd4bf',
  people:    '#fb923c',
  animals:   '#a78bfa',
  geography: '#fbbf24',
  food:      '#34d399',
  action:    '#f87171',
};

const WC = {
  king:'royalty', queen:'royalty', prince:'royalty', princess:'royalty', throne:'royalty',
  man:'people',   woman:'people',  boy:'people',    girl:'people',       person:'people',
  cat:'animals',  dog:'animals',   lion:'animals',  tiger:'animals',     wolf:'animals',
  Paris:'geography', France:'geography', Rome:'geography', Italy:'geography',
  London:'geography', England:'geography',
  apple:'food', orange:'food', banana:'food', bread:'food', cheese:'food',
  run:'action', walk:'action', swim:'action', fly:'action', eat:'action',
};

// ── Raw 8D embeddings ─────────────────────────────────────────────────────────
// dim[0,1] cluster separation · dim[2] gender · dim[3] city/country

const RAW = {
  king:     [ 0.85,  0.73,  0.45, -0.25,  0.12,  0.04, -0.13,  0.36],
  queen:    [ 0.83,  0.78, -0.25, -0.16,  0.07, -0.05, -0.03,  0.26],
  prince:   [ 0.76,  0.75,  0.45, -0.13,  0.15,  0.03, -0.16,  0.38],
  princess: [ 0.87,  0.64, -0.25, -0.28,  0.18,  0.06, -0.05,  0.23],
  throne:   [ 0.75,  0.74,  0.12, -0.23,  0.04,  0.08, -0.06,  0.25],
  man:      [ 0.76,  0.04,  1.15, -0.13,  0.05,  0.06,  0.26,  0.03],
  woman:    [ 0.67, -0.05,  0.45, -0.04, -0.04,  0.18,  0.15, -0.04],
  boy:      [ 0.78,  0.07,  1.15, -0.06,  0.06,  0.04,  0.24,  0.07],
  girl:     [ 0.63,  0.06,  0.45, -0.15,  0.03,  0.15,  0.28, -0.06],
  person:   [ 0.74, -0.03,  0.81, -0.02, -0.05,  0.07,  0.13,  0.05],
  cat:      [-0.54,  0.25,  0.28,  0.76, -0.03,  0.15, -0.14,  0.03],
  dog:      [-0.65,  0.28,  0.14,  0.84, -0.16,  0.06, -0.13, -0.05],
  lion:     [-0.57,  0.13,  0.25,  0.88, -0.05,  0.17, -0.28,  0.06],
  tiger:    [-0.68,  0.24,  0.16,  0.85, -0.02,  0.04, -0.15, -0.07],
  wolf:     [-0.53,  0.15,  0.27,  0.74, -0.17,  0.14, -0.24,  0.08],
  Paris:    [-0.05, -0.64,  0.06,  0.40,  0.73,  0.36,  0.05, -0.06],
  France:   [-0.16, -0.74,  0.17, -0.20,  0.85,  0.22, -0.04, -0.15],
  Rome:     [-0.02, -0.65,  0.15,  0.40,  0.86,  0.25,  0.07, -0.04],
  Italy:    [-0.14, -0.63,  0.04, -0.20,  0.75,  0.37, -0.06, -0.02],
  London:   [-0.04, -0.75,  0.18,  0.40,  0.84,  0.35, -0.07, -0.16],
  England:  [-0.17, -0.62,  0.05, -0.20,  0.74,  0.24,  0.08, -0.05],
  apple:    [ 0.15, -0.04, -0.64,  0.13, -0.14,  0.85,  0.04,  0.14],
  orange:   [ 0.04, -0.14, -0.53,  0.25, -0.27,  0.76,  0.17,  0.05],
  banana:   [ 0.18, -0.03, -0.55,  0.15, -0.12,  0.87,  0.06,  0.16],
  bread:    [ 0.06, -0.18, -0.67,  0.27, -0.25,  0.73,  0.18,  0.03],
  cheese:   [ 0.17, -0.05, -0.56,  0.14, -0.16,  0.86,  0.05,  0.18],
  run:      [-0.14,  0.05, -0.03, -0.26, -0.06, -0.04,  0.95,  0.15],
  walk:     [-0.25,  0.18, -0.14, -0.37,  0.07, -0.15,  0.84,  0.27],
  swim:     [-0.13,  0.14, -0.04, -0.22,  0.05, -0.02,  0.94,  0.14],
  fly:      [-0.27,  0.04, -0.18, -0.25, -0.06, -0.17,  0.97,  0.28],
  eat:      [-0.15,  0.03, -0.05, -0.36,  0.07, -0.06,  0.82,  0.16],
};

function l2norm(v) {
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return mag > 0 ? v.map(x => x / mag) : [...v];
}

const EMB = {};
for (const [w, raw] of Object.entries(RAW)) EMB[w] = l2norm(raw);
const WORDS = Object.keys(EMB);

// ── Math ──────────────────────────────────────────────────────────────────────

function dot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); }

function cosSim(a, b) {
  const na = Math.sqrt(dot(a, a));
  const nb = Math.sqrt(dot(b, b));
  return (na > 0 && nb > 0) ? dot(a, b) / (na * nb) : 0;
}

function findNearest(vec, exclude) {
  return WORDS
    .filter(w => !exclude.includes(w))
    .map(w => ({ word: w, sim: cosSim(vec, EMB[w]), cluster: WC[w] }))
    .sort((a, b) => b.sim - a.sim);
}

// ── Static 2D layout (dim[0], dim[1] as x, y) ────────────────────────────────

const PROJ = WORDS.map(w => ({ word: w, x: EMB[w][0], y: EMB[w][1], cluster: WC[w] }));
const allX = PROJ.map(p => p.x), allY = PROJ.map(p => p.y);
const xR = Math.max(...allX) - Math.min(...allX);
const yR = Math.max(...allY) - Math.min(...allY);
const BOUNDS = {
  xLo: Math.min(...allX) - xR * 0.13,
  xHi: Math.max(...allX) + xR * 0.13,
  yLo: Math.min(...allY) - yR * 0.13,
  yHi: Math.max(...allY) + yR * 0.13,
};

// ── Convex hull (gift wrapping) ───────────────────────────────────────────────

function convexHull(pts) {
  if (pts.length <= 2) return pts.map((_, i) => i);
  let lo = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].x < pts[lo].x || (pts[i].x === pts[lo].x && pts[i].y < pts[lo].y)) lo = i;
  }
  const hull = [];
  let cur = lo;
  do {
    hull.push(cur);
    let nxt = (cur + 1) % pts.length;
    for (let i = 0; i < pts.length; i++) {
      const cross = (pts[nxt].x - pts[cur].x) * (pts[i].y - pts[cur].y)
                  - (pts[nxt].y - pts[cur].y) * (pts[i].x - pts[cur].x);
      if (cross < 0) nxt = i;
    }
    cur = nxt;
  } while (cur !== lo && hull.length <= pts.length);
  return hull;
}

// ── Star shape ────────────────────────────────────────────────────────────────

function drawStar(ctx, cx, cy, r) {
  if (r <= 0) return;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#fbbf24';
  ctx.shadowColor = 'rgba(251,191,36,0.6)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'king − man + woman', words: ['king', 'man', 'woman'], signs: [1, -1, 1] },
  { label: 'Paris − France + Italy', words: ['Paris', 'France', 'Italy'], signs: [1, -1, 1] },
  { label: 'cat − dog + girl', words: ['cat', 'dog', 'girl'], signs: [1, -1, 1] },
];

// ── King analogy ground truth ─────────────────────────────────────────────────

const KING_NN = (() => {
  const vec = EMB['king'].map((v, i) => v - EMB['man'][i] + EMB['woman'][i]);
  return findNearest(vec, ['king', 'man', 'woman'])[0]?.word ?? '?';
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function makeProjFn(W, H, PAD) {
  return (x, y) => ({
    cx: PAD + ((x - BOUNDS.xLo) / (BOUNDS.xHi - BOUNDS.xLo)) * (W - 2 * PAD),
    cy: H - PAD - ((y - BOUNDS.yLo) / (BOUNDS.yHi - BOUNDS.yLo)) * (H - 2 * PAD),
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SemanticArithmetic() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  const [eqWords, setEqWords] = useState(['king', 'man', 'woman']);
  const [eqSigns, setEqSigns] = useState([1, -1, 1]);
  const [result,  setResult]  = useState(null);
  const [starSc,  setStarSc]  = useState(0);
  const [hov,     setHov]     = useState(null);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // ── Compute ──────────────────────────────────────────────────────────────────

  function compute(ws, ss) {
    ws = ws ?? eqWords;
    ss = ss ?? eqSigns;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const vec  = EMB[ws[0]].map((_, i) => ss[0] * EMB[ws[0]][i] + ss[1] * EMB[ws[1]][i] + ss[2] * EMB[ws[2]][i]);
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    setResult({ vec, norm, nearest: findNearest(vec, ws) });

    const t0 = performance.now();
    function anim(now) {
      const t = Math.min((now - t0) / 400, 1);
      setStarSc(t < 0.7 ? (t / 0.7) * 1.4 : 1.4 - ((t - 0.7) / 0.3) * 0.4);
      if (t < 1) animRef.current = requestAnimationFrame(anim);
    }
    animRef.current = requestAnimationFrame(anim);
  }

  // ── Canvas draw ──────────────────────────────────────────────────────────────

  const PAD = 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    if (!W || !H) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const toC = makeProjFn(W, H, PAD);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Cluster hulls
    for (const [cluster, color] of Object.entries(CC)) {
      const pts = PROJ.filter(p => p.cluster === cluster);
      if (pts.length < 3) continue;
      const coords = pts.map(p => { const c = toC(p.x, p.y); return { x: c.cx, y: c.cy }; });
      const hull   = convexHull(coords);
      if (hull.length < 3) continue;
      const centX = coords.reduce((s, p) => s + p.x, 0) / coords.length;
      const centY = coords.reduce((s, p) => s + p.y, 0) / coords.length;
      ctx.beginPath();
      hull.forEach((idx, i) => {
        const ex = centX + (coords[idx].x - centX) * 1.5;
        const ey = centY + (coords[idx].y - centY) * 1.5;
        if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
      });
      ctx.closePath();
      const [r, g, b] = hexToRgb(color);
      ctx.fillStyle = `rgba(${r},${g},${b},0.07)`;
      ctx.fill();
    }

    const srcWords = result ? eqWords : [];
    const nnWord   = result?.nearest[0]?.word;

    // Dots and labels
    for (const p of PROJ) {
      const { cx, cy } = toC(p.x, p.y);
      const color = CC[p.cluster];
      const isHov = p.word === hov;
      const isSrc = srcWords.includes(p.word);
      const isNN  = p.word === nnWord;

      if (isNN) {
        ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5; ctx.stroke();
      }
      if (isSrc) {
        const [r, g, b] = hexToRgb(color);
        ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`; ctx.lineWidth = 2; ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, isHov ? 10 : 6, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();

      ctx.font = `bold 11px ${SANS}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(p.word, cx + 10, cy - 1);
    }

    // Hover tooltip
    if (hov) {
      const p = PROJ.find(pt => pt.word === hov);
      if (p) {
        const { cx, cy } = toC(p.x, p.y);
        const label = `${p.word}  ·  ${p.cluster}`;
        ctx.font = `12px ${SANS}`;
        const tw = ctx.measureText(label).width;
        const tx = Math.min(cx + 14, W - tw - 12);
        const ty = cy - 22;
        ctx.fillStyle = '#1e1e1e';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.fillRect(tx - 7, ty - 16, tw + 14, 22);
        ctx.strokeRect(tx - 7, ty - 16, tw + 14, 22);
        ctx.fillStyle = '#e8eaed';
        ctx.fillText(label, tx, ty);
      }
    }

    // Star + dotted line
    if (result && starSc > 0) {
      const n = result.norm > 0 ? result.norm : 1;
      const { cx: sx, cy: sy } = toC(result.vec[0] / n, result.vec[1] / n);

      if (nnWord) {
        const nnP = PROJ.find(p => p.word === nnWord);
        if (nnP) {
          const { cx: nx, cy: ny } = toC(nnP.x, nnP.y);
          ctx.beginPath();
          ctx.setLineDash([5, 4]);
          ctx.moveTo(sx, sy); ctx.lineTo(nx, ny);
          ctx.strokeStyle = 'rgba(251,191,36,0.65)';
          ctx.lineWidth = 2; ctx.stroke();
          ctx.setLineDash([]);

          const midX = (sx + nx) / 2, midY = (sy + ny) / 2 - 8;
          const lbl = `nearest: ${nnWord}  (${result.nearest[0].sim.toFixed(3)})`;
          ctx.font = `11px ${SANS}`;
          ctx.fillStyle = 'rgba(251,191,36,0.85)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(lbl, midX, midY);
        }
      }

      drawStar(ctx, sx, sy, 15 * starSc);
    }
  }, [result, hov, starSc, eqWords]);

  // ── Mouse hover ───────────────────────────────────────────────────────────────

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const W = rect.width, H = rect.height;
    const toC = makeProjFn(W, H, PAD);
    let best = null, bestD = 20;
    for (const p of PROJ) {
      const { cx, cy } = toC(p.x, p.y);
      const d = Math.hypot(mx - cx, my - cy);
      if (d < bestD) { bestD = d; best = p.word; }
    }
    setHov(best);
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const top5 = result?.nearest.slice(0, 5) ?? [];

  function opStr(sign, idx) {
    return idx === 0 ? 'v(' : (sign === 1 ? ' + v(' : ' − v(');
  }
  const eqDisplay = eqWords.map((w, i) => `${opStr(eqSigns[i], i)}${w})`).join('');
  const resultWord = result?.nearest[0]?.word;

  // ── Render ────────────────────────────────────────────────────────────────────

  const selStyle = {
    fontFamily: MONO, fontSize: '12px',
    background: '#1e1e1e', color: '#e8eaed',
    border: '1px solid #2e2e2e', borderRadius: '4px',
    padding: '5px 8px', cursor: 'pointer',
  };

  const opBtnStyle = active => ({
    fontFamily: MONO, fontSize: '15px',
    color: active ? '#34d399' : '#f87171',
    background: 'transparent',
    border: `1px solid ${active ? '#34d399' : '#f87171'}`,
    borderRadius: '4px', padding: '3px 10px',
    cursor: 'pointer', lineHeight: 1,
  });

  return (
    <WidgetCard title="Semantic Arithmetic — vector equations over word meanings" number="5.3">

      {/* ── Equation builder (full width) ──────────────────────────────────── */}
      <div style={{
        background: '#161616', border: '1px solid #242424',
        borderRadius: '6px', padding: '14px 16px', marginBottom: '12px',
      }}>
        {/* Selectors + compute + inline result */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {eqWords.map((word, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {idx > 0 && (
                <button
                  onClick={() => { const ns = [...eqSigns]; ns[idx] = -ns[idx]; setEqSigns(ns); }}
                  style={opBtnStyle(eqSigns[idx] === 1)}
                >
                  {eqSigns[idx] === 1 ? '+' : '−'}
                </button>
              )}
              <select
                value={word}
                onChange={e => { const nw = [...eqWords]; nw[idx] = e.target.value; setEqWords(nw); }}
                style={selStyle}
              >
                {[...WORDS].sort().map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          ))}

          <button
            onClick={() => compute()}
            style={{
              fontFamily: MONO, fontSize: '12px',
              background: '#0b2422', color: '#2dd4bf',
              border: '1px solid #2dd4bf', borderRadius: '4px',
              padding: '6px 18px', cursor: 'pointer', marginLeft: '4px',
            }}
          >
            Compute
          </button>

          {result && (
            <span style={{ fontFamily: MONO, fontSize: '13px', color: '#e8eaed', marginLeft: '4px' }}>
              {eqDisplay}
              <span style={{ color: '#555', margin: '0 6px' }}>≈</span>
              <span style={{ color: '#2dd4bf', fontWeight: 600 }}>v({resultWord})</span>
            </span>
          )}
        </div>

        {/* Preset buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: MONO, fontSize: '10px', color: '#555', flexShrink: 0 }}>try:</span>
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => { setEqWords(p.words); setEqSigns(p.signs); compute(p.words, p.signs); }}
              style={{
                fontFamily: MONO, fontSize: '11px',
                background: '#111', color: '#888',
                border: '1px solid #242424', borderRadius: '4px',
                padding: '4px 12px', cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scatter canvas (full width) ────────────────────────────────────── */}
      <div style={{
        background: '#0a0a0a', border: '1px solid #242424',
        borderRadius: '6px', overflow: 'hidden', marginBottom: '12px',
      }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '400px', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHov(null)}
        />
      </div>

      {/* ── Result vector (full width) ─────────────────────────────────────── */}
      {result && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: '#555', marginBottom: '6px' }}>
            result vector · 8 dims · raw (not normalized) · teal = positive · red = negative
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {result.vec.map((v, i) => {
              const maxAbs = Math.max(...result.vec.map(Math.abs)) || 1;
              const intensity = Math.abs(v) / maxAbs;
              const pos = v >= 0;
              return (
                <div key={i} style={{
                  flex: 1,
                  background: pos
                    ? `rgba(45,212,191,${0.07 + intensity * 0.26})`
                    : `rgba(248,113,113,${0.07 + intensity * 0.26})`,
                  border: `1px solid ${pos ? 'rgba(45,212,191,0.25)' : 'rgba(248,113,113,0.25)'}`,
                  borderRadius: '4px', padding: '7px 2px', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: '#555', marginBottom: '3px' }}>d{i + 1}</div>
                  <div style={{ fontFamily: MONO, fontSize: '12px', color: pos ? '#2dd4bf' : '#f87171' }}>
                    {v.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom row: NN list + stats panel ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Top-5 nearest neighbors (flex: 1) */}
        <div style={{
          flex: 1, minWidth: 0,
          background: '#111', border: '1px solid #242424',
          borderRadius: '6px', overflow: 'hidden',
        }}>
          <div style={{
            fontFamily: MONO, fontSize: '9.5px', color: '#555',
            padding: '10px 16px 8px', textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: '1px solid #1e1e1e',
          }}>
            Top 5 nearest neighbors
          </div>
          {result ? top5.map((nn, i) => {
            const isTop = i === 0;
            return (
              <div key={nn.word} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 16px',
                background: isTop ? 'rgba(45,212,191,0.04)' : 'transparent',
                borderBottom: i < 4 ? '1px solid #161616' : 'none',
              }}>
                <span style={{ fontFamily: MONO, fontSize: '11px', color: '#555', width: 16, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontFamily: MONO, fontSize: '14px', color: CC[nn.cluster], width: 90, flexShrink: 0 }}>{nn.word}</span>
                <div style={{ flex: 1, height: 6, background: '#1e1e1e', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max(0, nn.sim) * 100}%`, height: '100%',
                    background: CC[nn.cluster], borderRadius: 3,
                  }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: '12px', color: '#888', flexShrink: 0, width: 52, textAlign: 'right' }}>
                  {nn.sim.toFixed(3)}
                </span>
                {isTop && (
                  <span style={{ fontFamily: MONO, fontSize: '9px', color: '#2dd4bf', flexShrink: 0 }}>← best</span>
                )}
              </div>
            );
          }) : (
            <div style={{ padding: '18px 16px', fontFamily: MONO, fontSize: '12px', color: '#555' }}>
              compute an equation to see results
            </div>
          )}
        </div>

        {/* Stats + cluster legend (200px) */}
        <div style={{
          width: 200, flexShrink: 0,
          background: '#111', border: '1px solid #242424',
          borderRadius: '6px', padding: '14px 14px', fontFamily: MONO,
        }}>
          {/* Key stats */}
          {[
            ['vocabulary', '30 words'],
            ['embed dim', '8'],
            ['clusters', '6'],
            ...(result ? [['‖result‖', result.norm.toFixed(3)]] : []),
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: '10px', color: '#555' }}>{label}</span>
              <span style={{ fontSize: '12px', color: '#2dd4bf' }}>{val}</span>
            </div>
          ))}

          <div style={{ height: 1, background: '#242424', margin: '10px 0' }} />

          {/* Analogy check */}
          <div style={{ fontSize: '9.5px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Analogy check
          </div>
          <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.9 }}>
            king − man + woman
            <br />
            <span style={{ color: CC[WC[KING_NN]] || '#888', fontSize: '13px' }}>{KING_NN}</span>
            <span style={{
              marginLeft: 7, fontSize: '13px',
              color: KING_NN === 'queen' ? '#34d399' : '#f87171',
            }}>
              {KING_NN === 'queen' ? '✓' : '✗'}
            </span>
            <br />
            <span style={{ fontSize: '9px', color: '#444' }}>correct = queen</span>
          </div>

          <div style={{ height: 1, background: '#242424', margin: '10px 0' }} />

          {/* Cluster legend */}
          <div style={{ fontSize: '9.5px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Clusters
          </div>
          {Object.entries(CC).map(([name, color]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#888' }}>{name}</span>
            </div>
          ))}
        </div>

      </div>
    </WidgetCard>
  );
}
