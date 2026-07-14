import { useRef, useEffect, useCallback, useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  accent:    '#2dd4bf', // p
  orange:    '#fb923c', // q
  red:       '#f87171', // KL gap / cost of being wrong
  purple:    '#a78bfa',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  codeBg:    '#0a0a0a',
  text:      '#e8eaed',
  textMuted: '#555555',
  textMid:   '#888888',
  accentDim: '#0b2422',
};

// ─── Distribution setup ────────────────────────────────────────────────────────
// N=5 discrete outcomes ("symbols") — a stand-in for the toy vocabularies
// cross-entropy loss operates on in Chapter 3.
const N = 5;
const LABELS = ['A', 'B', 'C', 'D', 'E'];

// Powers-of-two weights give H(p) a clean value (1.875 bits) so the
// worked numbers in the chapter text can be checked by hand.
const DEFAULT_P = [0.50, 0.25, 0.125, 0.0625, 0.0625];
const DEFAULT_Q = [0.20, 0.20, 0.20, 0.20, 0.20];

// Raw slider weights are normalized fresh on every render — the displayed
// distribution is therefore always exactly renormalized (sums to 1 to
// floating-point precision), never drifting from repeated in-place edits.
function normalize(raw) {
  const s = raw.reduce((a, b) => a + b, 0);
  if (s <= 0) return raw.map(() => 1 / raw.length);
  return raw.map(w => w / s);
}

// H(p) = -Σ p_i log2(p_i), with the standard convention 0·log(0) = 0.
function entropyBits(p) {
  let h = 0;
  for (const pi of p) {
    if (pi > 0) h += -pi * Math.log2(pi);
  }
  return h;
}

// H(p,q) = -Σ p_i log2(q_i). If some p_i > 0 while q_i = 0, that term is
// +Infinity (Math.log2(0) === -Infinity in JS, so -p_i * -Infinity = +Infinity
// for p_i > 0) — the real, unbounded cost of a code that assigns zero
// probability to an outcome that actually occurs. Only the p_i = 0 case is
// special-cased, matching the 0·log(0) = 0 convention.
function crossEntropyBits(p, q) {
  let h = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = p[i];
    if (pi > 0) h += -pi * Math.log2(q[i]);
  }
  return h;
}

function fmtBits(v) {
  if (!isFinite(v)) return '∞'; // ∞
  return v.toFixed(3);
}

// ─── Canvas layout ─────────────────────────────────────────────────────────────
const CW = 460, CH = 210;
const PL = 34, PR = 12, PT = 30, PB = 26;

export default function EntropyKLVisualizer({ tryThis }) {
  const canvasRef = useRef(null);

  const [pRaw, setPRaw] = useState(DEFAULT_P);
  const [qRaw, setQRaw] = useState(DEFAULT_Q);

  const p = normalize(pRaw);
  const q = normalize(qRaw);

  const Hp  = entropyBits(p);
  const Hpq = crossEntropyBits(p, q);
  const KL  = Hpq - Hp; // = Σ p_i log2(p_i/q_i); propagates to +Infinity correctly
  const klInfinite = !isFinite(KL);

  // ── Guarded weight setters — block only the degenerate case where every
  // weight in a distribution would hit zero at once (undefined normalization).
  // Individual categories may still be dragged to exactly zero. ─────────────
  const updateWeight = (setter, arr, idx, value) => {
    const next = [...arr];
    next[idx] = value;
    const s = next.reduce((a, b) => a + b, 0);
    if (s < 1e-6) return;
    setter(next);
  };

  const reset = () => { setPRaw(DEFAULT_P); setQRaw(DEFAULT_Q); };
  const matchQToP = () => setQRaw([...pRaw]);
  const diverge = () => {
    // One click: send q's mass away from p's heaviest outcome, driving that
    // q_i to exactly zero while p_i there stays positive — KL → ∞.
    const heavy = p.indexOf(Math.max(...p));
    const next = LABELS.map((_, i) => (i === heavy ? 0 : 1 / (N - 1)));
    setQRaw(next);
  };

  // ── Draw grouped bar chart ───────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = CW + 'px';
    canvas.style.height = CH + 'px';
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const plotW = CW - PL - PR;
    const plotH = CH - PT - PB;
    const slotW = plotW / N;
    const barGap = 5;
    const barW = (slotW - barGap * 3) / 2;

    const yMax = Math.min(1, Math.max(0.1, Math.max(...p, ...q) * 1.25));
    const toX = (slot, which) => PL + slot * slotW + barGap + (which === 'q' ? barW + barGap : 0);
    const toY = v => PT + plotH * (1 - Math.min(v, yMax) / yMax);

    // Background
    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, 0, CW, CH);

    // Gridlines + y labels
    ctx.font = '9px "JetBrains Mono", monospace';
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const yv = t * yMax;
      const py = toY(yv);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(PL, py);
      ctx.lineTo(CW - PR, py);
      ctx.stroke();
      ctx.fillStyle = C.textMuted;
      ctx.textAlign = 'right';
      ctx.fillText(yv.toFixed(2), PL - 4, py + 3);
    }

    // Bars + value labels + category labels
    for (let i = 0; i < N; i++) {
      const px = toX(i, 'p'), qx = toX(i, 'q');
      const pv = p[i], qv = q[i];
      const py = toY(pv), qy = toY(qv);

      ctx.fillStyle = C.accent;
      ctx.fillRect(px, py, barW, PT + plotH - py);
      ctx.fillStyle = C.orange;
      ctx.fillRect(qx, qy, barW, PT + plotH - qy);

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      if (pv > 0.02) { ctx.fillStyle = C.accent; ctx.fillText(pv.toFixed(2), px + barW / 2, py - 4); }
      if (qv > 0.02) { ctx.fillStyle = C.orange; ctx.fillText(qv.toFixed(2), qx + barW / 2, qy - 4); }
      if (qv === 0) { ctx.fillStyle = C.red; ctx.fillText('0', qx + barW / 2, toY(0) - 4); }

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = C.textMid;
      ctx.fillText(LABELS[i], PL + i * slotW + slotW / 2, PT + plotH + 15);
    }

    // Legend
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = C.accent;
    ctx.fillRect(CW - 100, PT - 22, 8, 8);
    ctx.fillText('p', CW - 88, PT - 15);
    ctx.fillStyle = C.orange;
    ctx.fillRect(CW - 60, PT - 22, 8, 8);
    ctx.fillText('q', CW - 48, PT - 15);
  }, [p, q]);

  useEffect(() => { draw(); }, [draw]);

  // ── Styles ───────────────────────────────────────────────────────────────
  const monoSm = { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' };
  const sliderBase = {
    WebkitAppearance: 'none',
    width: '100%', height: '2px',
    borderRadius: '2px', background: C.borderLt,
    cursor: 'pointer', outline: 'none',
  };
  const btnBase = {
    ...monoSm,
    padding: '5px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: `1px solid ${C.border}`,
    background: C.bg4,
    color: C.text,
  };

  const StatBlock = ({ label, value, color, sub }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textMuted, marginBottom: '2px',
      }}>
        {label}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '19px', color }}>
        {fmtBits(value)} <span style={{ fontSize: '10px', color: C.textMuted }}>bits</span>
      </div>
      {sub && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: C.textMuted, marginTop: '1px' }}>{sub}</div>}
    </div>
  );

  const SliderRow = ({ dist, idx, raw, setRaw, normVal, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ ...monoSm, color, width: '56px', flexShrink: 0 }}>{dist}: {LABELS[idx]}</span>
      <input
        type="range" min={0} max={1} step={0.01}
        value={raw[idx]}
        onChange={e => updateWeight(setRaw, raw, idx, +e.target.value)}
        style={{ ...sliderBase, flex: 1, accentColor: color }}
      />
      <span style={{ ...monoSm, color: C.textMid, width: '38px', textAlign: 'right', flexShrink: 0 }}>
        {normVal.toFixed(2)}
      </span>
    </div>
  );

  // Scale for the "gap" bar: H(p) + KL(p‖q) = H(p,q).
  const scaleMax = klInfinite
    ? Math.max(Hp, Math.log2(N)) * 1.6
    : Math.max(Hpq, Math.log2(N)) * 1.15;
  const hpPct = Math.min(100, (Hp / scaleMax) * 100);
  const klPct = klInfinite ? Math.max(0, 100 - hpPct) : Math.min(100 - hpPct, (KL / scaleMax) * 100);

  return (
    <WidgetCard title="Entropy &amp; KL Divergence — the cost of the wrong code" number="1.3" tryThis={tryThis}>

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '4px', flexShrink: 0 }} />

        {/* Stats panel */}
        <div style={{
          background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px',
          padding: '14px 16px', flex: 1, minWidth: '160px',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: C.textMuted,
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px',
          }}>
            units: bits (log&#8322;)
          </div>

          <div style={{ display: 'flex', gap: '14px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <StatBlock label="H(p)" value={Hp} color={C.accent} sub="entropy of p" />
            <StatBlock label="H(p,q)" value={Hpq} color={C.orange} sub="cross-entropy" />
            <StatBlock label="KL(p‖q)" value={KL} color={klInfinite ? C.red : C.purple} sub="the gap" />
          </div>

          {/* Gap bar: H(p) + KL = H(p,q) */}
          <div style={{ marginBottom: klInfinite ? '8px' : 0 }}>
            <div style={{ display: 'flex', height: '10px', borderRadius: '3px', overflow: 'hidden', background: C.bg4, border: `1px solid ${C.border}` }}>
              <div style={{ width: `${hpPct}%`, background: C.accent }} />
              <div style={{ width: `${klPct}%`, background: C.red }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: C.textMuted, marginTop: '3px' }}>
              H(p) + KL(p‖q) = H(p,q)
            </div>
          </div>

          {klInfinite && (
            <div style={{
              marginTop: '4px', padding: '8px 10px', borderRadius: '6px',
              background: 'rgba(248,113,113,0.1)', border: `1px solid ${C.red}`,
              fontFamily: "'Inter', sans-serif", fontSize: '11px', color: C.red, lineHeight: 1.4,
            }}>
              q assigns zero probability to a symbol p still expects — encoding
              with q's codebook can't represent that outcome at all, so the
              cost is unbounded.
            </div>
          )}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '190px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <div style={{ ...monoSm, color: C.accent, fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>p — the true distribution</div>
          {LABELS.map((_, i) => (
            <SliderRow key={i} dist="p" idx={i} raw={pRaw} setRaw={setPRaw} normVal={p[i]} color={C.accent} />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: '190px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <div style={{ ...monoSm, color: C.orange, fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>q — the model's guess</div>
          {LABELS.map((_, i) => (
            <SliderRow key={i} dist="q" idx={i} raw={qRaw} setRaw={setQRaw} normVal={q[i]} color={C.orange} />
          ))}
        </div>
      </div>

      {/* Presets */}
      <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button style={btnBase} onClick={reset}>&#8635; Reset</button>
        <button style={btnBase} onClick={matchQToP}>Match q &#8594; p (KL &#8594; 0)</button>
        <button style={{ ...btnBase, border: `1px solid ${C.red}`, color: C.red }} onClick={diverge}>Diverge (KL &#8594; &#8734;)</button>
      </div>
    </WidgetCard>
  );
}
