import { useRef, useState, useEffect, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Internal canvas coordinate space ─────────────────────────────────────────
// Canvas takes full 616px usable width. Subplots are 152px each (vs 101px
// when a 180px side panel was present), giving 65% more vertical plot area.
const T      = 1000;
const W_INT  = 560;
const PAD_L  = 42;   // was 52 — axis labels need ≤30px, title needs ~9px
const PAD_R  = 10;
const PLOT_W = W_INT - PAD_L - PAD_R;   // 508

const TOP_Y     = 0;
const TOP_H     = 152;
const GAP       = 12;
const BOT_Y     = TOP_H + GAP;          // 164
const BOT_H     = 152;
const XLAB_H    = 24;
const H_NO_BETA = TOP_H + GAP + BOT_H + XLAB_H;   // 340
const BETA_GAP  = 14;
const BETA_H    = 80;
const BETA_Y    = BOT_Y + BOT_H + BETA_GAP;        // 330
const H_BETA    = H_NO_BETA + BETA_GAP + BETA_H;   // 434

// ── Schedule math ─────────────────────────────────────────────────────────────
function computeLinearAb() {
  const ab = new Float64Array(T + 1);
  ab[0] = 1.0;
  for (let t = 1; t <= T; t++) {
    const beta = 0.0001 + t * (0.02 - 0.0001) / T;
    ab[t] = ab[t - 1] * (1 - beta);
  }
  return ab;
}

function computeLinearBeta() {
  const b = new Float64Array(T + 1);
  for (let t = 1; t <= T; t++) b[t] = 0.0001 + t * (0.02 - 0.0001) / T;
  return b;
}

function computeCosineAb(s) {
  const ab = new Float64Array(T + 1);
  const f = (step) => Math.cos(((step / T + s) / (1 + s)) * Math.PI / 2) ** 2;
  const f0 = f(0);
  ab[0] = 1.0;
  for (let t = 1; t <= T; t++) {
    ab[t] = Math.max(0.001, Math.min(0.9999, f(t) / f0));
  }
  return ab;
}

function computeCosBeta(cosAb) {
  const b = new Float64Array(T + 1);
  for (let t = 1; t <= T; t++) b[t] = Math.max(0, 1 - cosAb[t] / cosAb[t - 1]);
  return b;
}

function computeSNR(ab) {
  const snr = new Float64Array(T + 1);
  for (let t = 0; t <= T; t++) snr[t] = Math.max(1e-5, ab[t] / Math.max(1e-10, 1 - ab[t]));
  return snr;
}

function findSNR1Crossing(snr) {
  for (let t = 1; t <= T; t++) if (snr[t] < 1) return t;
  return T;
}

// ── Static data (computed once at module load) ────────────────────────────────
const LIN_AB   = computeLinearAb();
const LIN_BETA = computeLinearBeta();
const LIN_SNR  = computeSNR(LIN_AB);
const LIN_SNR1 = findSNR1Crossing(LIN_SNR);

// ── Internal-space coordinate helpers ─────────────────────────────────────────
const tToX_i   = (t)   => PAD_L + (t / T) * PLOT_W;
const abToY_i  = (ab)  => TOP_Y + (1 - ab) * TOP_H;
const LOG_MIN  = Math.log10(1e-3);
const LOG_MAX  = Math.log10(100);
const snrToY_i = (snr) =>
  BOT_Y + (1 - (Math.log10(Math.max(1e-5, snr)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * BOT_H;

// ── Colors ────────────────────────────────────────────────────────────────────
const OG = '#fb923c';
const TL = '#2dd4bf';
const BD = '#242424';
const MU = '#555555';
const MD = '#888888';
const BG = '#0a0a0a';
const GR = '#34d399';

const mono = { fontFamily: "'JetBrains Mono', monospace" };

// One-line label + value row used in the stats strip
function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
      <span style={{ ...mono, fontSize: '9px', color: MU }}>{label}</span>
      <span style={{ ...mono, fontSize: '11px', color }}>{value}</span>
    </div>
  );
}

export default function NoiseSchedule() {
  const canvasRef = useRef(null);
  const [tSel,     setTSel]     = useState(500);
  const [sOff,     setSoff]     = useState(0.008);
  const [showBeta, setShowBeta] = useState(false);

  const cosAb   = useMemo(() => computeCosineAb(sOff),   [sOff]);
  const cosSNR  = useMemo(() => computeSNR(cosAb),        [cosAb]);
  const cosBeta = useMemo(() => computeCosBeta(cosAb),    [cosAb]);
  const cosSNR1 = useMemo(() => findSNR1Crossing(cosSNR), [cosSNR]);

  // ── Draw ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const H_INT = showBeta ? H_BETA : H_NO_BETA;
    const dpr   = window.devicePixelRatio || 1;
    const rect  = canvas.getBoundingClientRect();
    canvas.width  = Math.round(rect.width  * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);

    const W  = rect.width;
    const Hp = rect.height;
    const sx = W  / W_INT;
    const sy = Hp / H_INT;

    const xi   = (v)  => v * sx;
    const yi   = (v)  => v * sy;
    const tx   = (t)  => xi(tToX_i(t));
    const aby  = (ab) => yi(abToY_i(ab));
    const snry = (sn) => yi(snrToY_i(sn));

    // ── Background ───────────────────────────────────────────────────────────
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, Hp);

    // ── TOP SUB-PLOT: alpha_bar_t ─────────────────────────────────────────────
    ctx.strokeStyle = BD; ctx.lineWidth = 1;
    for (const yv of [0.25, 0.5, 0.75]) {
      ctx.beginPath(); ctx.moveTo(xi(PAD_L), aby(yv)); ctx.lineTo(xi(W_INT - PAD_R), aby(yv)); ctx.stroke();
    }

    ctx.fillStyle = MU; ctx.font = `9px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const [v, lbl] of [[0,'0'],[0.25,'0.25'],[0.5,'0.5'],[0.75,'0.75'],[1,'1.0']]) {
      ctx.fillText(lbl, xi(PAD_L - 4), aby(v));
    }

    ctx.save();
    ctx.translate(xi(8), yi(TOP_Y + TOP_H / 2)); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = MU; ctx.font = `9px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('alpha_bar_t', 0, 0);
    ctx.restore();

    // Shaded region (cosine > linear)
    const segments = [];
    let seg = null;
    for (let t = 0; t <= T; t++) {
      if (cosAb[t] > LIN_AB[t]) {
        if (!seg) seg = [];
        seg.push(t);
      } else if (seg) { segments.push(seg); seg = null; }
    }
    if (seg) segments.push(seg);

    ctx.fillStyle = 'rgba(251,146,60,0.10)';
    for (const pts of segments) {
      if (pts.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(tx(pts[0]), aby(cosAb[pts[0]]));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(tx(pts[i]), aby(cosAb[pts[i]]));
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(tx(pts[i]), aby(LIN_AB[pts[i]]));
      ctx.closePath(); ctx.fill();
    }

    // Curves
    ctx.strokeStyle = OG; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let t = 0; t <= T; t++) t === 0 ? ctx.moveTo(tx(t), aby(LIN_AB[t])) : ctx.lineTo(tx(t), aby(LIN_AB[t]));
    ctx.stroke();

    ctx.strokeStyle = TL; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let t = 0; t <= T; t++) t === 0 ? ctx.moveTo(tx(t), aby(cosAb[t])) : ctx.lineTo(tx(t), aby(cosAb[t]));
    ctx.stroke();

    // Annotation at shaded-region peak
    let maxDiff = 0, maxDiffT = 200;
    for (let t = 0; t <= T; t++) {
      const d = cosAb[t] - LIN_AB[t];
      if (d > maxDiff) { maxDiff = d; maxDiffT = t; }
    }
    if (maxDiff > 0.01) {
      const annX = tx(maxDiffT);
      const midY = aby((cosAb[maxDiffT] + LIN_AB[maxDiffT]) / 2);
      const txtY = aby(cosAb[maxDiffT]) - 5;
      ctx.fillStyle = OG; ctx.font = `9px 'Inter', sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('Cosine retains more signal', annX, txtY);
      ctx.strokeStyle = OG; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(annX, txtY + 1); ctx.lineTo(annX, midY - 4); ctx.stroke();
      ctx.fillStyle = OG;
      ctx.beginPath(); ctx.moveTo(annX, midY); ctx.lineTo(annX - 3, midY - 6); ctx.lineTo(annX + 3, midY - 6); ctx.closePath(); ctx.fill();
    }

    // Legend (top-right)
    const legX = xi(W_INT - PAD_R - 64);
    const legY1 = yi(8), legY2 = yi(21);
    ctx.font = `9px 'JetBrains Mono', monospace`; ctx.textBaseline = 'middle';
    ctx.strokeStyle = OG; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(legX, legY1); ctx.lineTo(legX + 14, legY1); ctx.stroke();
    ctx.fillStyle = OG; ctx.textAlign = 'left'; ctx.fillText('Linear', legX + 17, legY1);
    ctx.strokeStyle = TL;
    ctx.beginPath(); ctx.moveTo(legX, legY2); ctx.lineTo(legX + 14, legY2); ctx.stroke();
    ctx.fillStyle = TL; ctx.fillText('Cosine', legX + 17, legY2);

    // ── BOTTOM SUB-PLOT: SNR log scale ────────────────────────────────────────
    ctx.strokeStyle = BD; ctx.lineWidth = 1;
    for (const sv of [0.01, 0.1, 1, 10, 100]) {
      ctx.beginPath(); ctx.moveTo(xi(PAD_L), snry(sv)); ctx.lineTo(xi(W_INT - PAD_R), snry(sv)); ctx.stroke();
    }

    ctx.fillStyle = MU; ctx.font = `9px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const [sv, lbl] of [[0.01,'0.01'],[0.1,'0.1'],[1,'1'],[10,'10'],[100,'100']]) {
      ctx.fillText(lbl, xi(PAD_L - 4), snry(sv));
    }

    ctx.save();
    ctx.translate(xi(8), yi(BOT_Y + BOT_H / 2)); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = MU; ctx.font = `9px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SNR (log)', 0, 0);
    ctx.restore();

    // Curves
    ctx.strokeStyle = OG; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let t = 0; t <= T; t++) t === 0 ? ctx.moveTo(tx(t), snry(LIN_SNR[t])) : ctx.lineTo(tx(t), snry(LIN_SNR[t]));
    ctx.stroke();

    ctx.strokeStyle = TL; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let t = 0; t <= T; t++) t === 0 ? ctx.moveTo(tx(t), snry(cosSNR[t])) : ctx.lineTo(tx(t), snry(cosSNR[t]));
    ctx.stroke();

    // SNR=1 dashed line (over curves)
    const s1y = snry(1);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(xi(PAD_L), s1y); ctx.lineTo(xi(W_INT - PAD_R), s1y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = `9px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('SNR=1 (equal)', xi(W_INT - PAD_R - 2), s1y - 2);

    // Crossing triangles + staggered labels
    const drawTri = (cx, cy, color) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 5, cy - 8); ctx.lineTo(cx + 5, cy - 8); ctx.closePath(); ctx.fill();
    };
    const lx = tx(LIN_SNR1), cx0 = tx(cosSNR1);
    drawTri(lx, s1y, OG); drawTri(cx0, s1y, TL);
    ctx.font = `8px 'JetBrains Mono', monospace`; ctx.textBaseline = 'bottom';
    ctx.fillStyle = OG; ctx.textAlign = 'center'; ctx.fillText(`Lin t=${LIN_SNR1}`, lx,  s1y - 10);
    ctx.fillStyle = TL;                            ctx.fillText(`Cos t=${cosSNR1}`,  cx0, s1y - 20);

    // ── BETA SUB-PLOT (optional) ──────────────────────────────────────────────
    if (showBeta) {
      const BMAX = 0.021;
      const bety = (b) => yi(BETA_Y + (1 - Math.max(0, Math.min(b, BMAX)) / BMAX) * BETA_H);

      ctx.strokeStyle = BD; ctx.lineWidth = 1;
      for (const bv of [0, 0.01, 0.02]) {
        ctx.beginPath(); ctx.moveTo(xi(PAD_L), bety(bv)); ctx.lineTo(xi(W_INT - PAD_R), bety(bv)); ctx.stroke();
      }
      ctx.fillStyle = MU; ctx.font = `9px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const [bv, lbl] of [[0,'0'],[0.01,'0.01'],[0.02,'0.02']]) {
        ctx.fillText(lbl, xi(PAD_L - 4), bety(bv));
      }
      ctx.save();
      ctx.translate(xi(8), yi(BETA_Y + BETA_H / 2)); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = MU; ctx.font = `9px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('beta_t', 0, 0);
      ctx.restore();

      ctx.strokeStyle = OG; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let t = 1; t <= T; t++) t === 1 ? ctx.moveTo(tx(t), bety(LIN_BETA[t])) : ctx.lineTo(tx(t), bety(LIN_BETA[t]));
      ctx.stroke();

      ctx.strokeStyle = TL; ctx.lineWidth = 2;
      ctx.beginPath();
      let firstB = true;
      for (let t = 1; t <= T; t++) {
        const bv = cosBeta[t];
        if (!isFinite(bv) || bv < 0) { firstB = true; continue; }
        firstB ? ctx.moveTo(tx(t), bety(bv)) : ctx.lineTo(tx(t), bety(bv));
        firstB = false;
      }
      ctx.stroke();
    }

    // ── SHARED X-AXIS ─────────────────────────────────────────────────────────
    const xaxY = showBeta ? yi(BETA_Y + BETA_H + 2) : yi(BOT_Y + BOT_H + 2);
    ctx.fillStyle = MU; ctx.font = `9px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const tv of [0, 200, 400, 600, 800, 1000]) ctx.fillText(String(tv), tx(tv), xaxY);
    ctx.fillText('Timestep t', xi(PAD_L + PLOT_W / 2), xaxY + 12);

    // ── VERTICAL INDICATOR ────────────────────────────────────────────────────
    const indX = tx(tSel);
    ctx.strokeStyle = MD; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(indX, yi(TOP_Y)); ctx.lineTo(indX, yi(TOP_Y + TOP_H)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(indX, yi(BOT_Y)); ctx.lineTo(indX, yi(BOT_Y + BOT_H)); ctx.stroke();
    if (showBeta) {
      ctx.beginPath(); ctx.moveTo(indX, yi(BETA_Y)); ctx.lineTo(indX, yi(BETA_Y + BETA_H)); ctx.stroke();
    }
    ctx.setLineDash([]);

    const dot = (x, y, color) => {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = BG; ctx.lineWidth = 1.5; ctx.stroke();
    };
    dot(indX, aby(LIN_AB[tSel]),   OG);
    dot(indX, aby(cosAb[tSel]),    TL);
    dot(indX, snry(LIN_SNR[tSel]), OG);
    dot(indX, snry(cosSNR[tSel]),  TL);

    ctx.restore();
  }, [tSel, cosAb, cosSNR, cosBeta, cosSNR1, showBeta]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const linAbT  = LIN_AB[tSel];
  const cosAbT  = cosAb[tSel];
  const linSnrT = LIN_SNR[tSel];
  const cosSnrT = cosSNR[tSel];
  const cosAdv  = linSnrT > 1e-5 ? cosSnrT / linSnrT : 0;
  const fmtSNR  = (v) => v > 999 ? '>999' : v < 0.001 ? v.toExponential(2) : v.toFixed(4);
  const H_INT   = showBeta ? H_BETA : H_NO_BETA;

  const colDiv = { width: 1, background: BD, alignSelf: 'stretch', flexShrink: 0 };
  const colPad = { padding: '10px 14px' };

  return (
    <WidgetCard title="Noise Schedule — linear vs cosine SNR" number="13.3">
      {/* Canvas — full usable width */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', aspectRatio: `${W_INT} / ${H_INT}`, display: 'block', borderRadius: '6px' }}
      />

      {/* Stats strip — 3 columns below canvas */}
      <div style={{
        marginTop: '10px', display: 'flex', alignItems: 'stretch',
        background: '#111111', border: `1px solid ${BD}`, borderRadius: '8px', overflow: 'hidden',
      }}>
        {/* Col 1: selected t + crossings */}
        <div style={{ ...colPad, width: 162, flexShrink: 0 }}>
          <div style={{ ...mono, fontSize: '9px', color: MU, marginBottom: '2px' }}>t</div>
          <div style={{ ...mono, fontSize: '18px', color: '#e8eaed', marginBottom: '8px' }}>{tSel}</div>
          <StatRow label="Lin SNR=1"   value={`t = ${LIN_SNR1}`}                          color={OG} />
          <StatRow label="Cos SNR=1"   value={`t = ${cosSNR1}`}                           color={TL} />
          <StatRow label="Buys"        value={`${Math.max(0, cosSNR1 - LIN_SNR1)} steps`} color={GR} />
          <div style={{ borderTop: `1px solid ${BD}`, margin: '6px 0' }} />
          <StatRow label="Advantage"   value={`${cosAdv.toFixed(2)}× SNR`} color={cosAdv >= 1 ? GR : MD} />
        </div>

        <div style={colDiv} />

        {/* Col 2: linear schedule */}
        <div style={{ ...colPad, flex: 1 }}>
          <div style={{ ...mono, fontSize: '8.5px', color: OG, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>
            Linear
          </div>
          <StatRow label="alpha_bar"  value={linAbT.toFixed(4)}                              color={OG} />
          <StatRow label="SNR"        value={fmtSNR(linSnrT)}                                color={OG} />
          <StatRow label="√ᾱ_t"       value={Math.sqrt(linAbT).toFixed(4)}                   color={OG} />
          <StatRow label="√(1−ᾱ_t)"  value={Math.sqrt(Math.max(0, 1 - linAbT)).toFixed(4)}  color={OG} />
        </div>

        <div style={colDiv} />

        {/* Col 3: cosine schedule */}
        <div style={{ ...colPad, flex: 1 }}>
          <div style={{ ...mono, fontSize: '8.5px', color: TL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>
            Cosine
          </div>
          <StatRow label="alpha_bar"  value={cosAbT.toFixed(4)}                              color={TL} />
          <StatRow label="SNR"        value={fmtSNR(cosSnrT)}                                color={TL} />
          <StatRow label="√ᾱ_t"       value={Math.sqrt(cosAbT).toFixed(4)}                   color={TL} />
          <StatRow label="√(1−ᾱ_t)"  value={Math.sqrt(Math.max(0, 1 - cosAbT)).toFixed(4)}  color={TL} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...mono, fontSize: '11px', color: MU, flexShrink: 0, width: 68 }}>t = {tSel}</span>
          <input type="range" min={0} max={1000} step={1} value={tSel}
            onChange={e => setTSel(Number(e.target.value))}
            style={{ flex: 1, minWidth: 80, accentColor: TL, cursor: 'pointer' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...mono, fontSize: '11px', color: MU, flexShrink: 0, width: 68 }}>s = {sOff.toFixed(3)}</span>
          <input type="range" min={0.001} max={0.020} step={0.001} value={sOff}
            onChange={e => setSoff(Number(e.target.value))}
            style={{ flex: 1, minWidth: 80, accentColor: TL, cursor: 'pointer' }}
          />
          <span style={{ ...mono, fontSize: '11px', color: MU, flexShrink: 0, marginLeft: 6 }}>Show beta_t</span>
          <button
            style={{
              ...mono, fontSize: '11px', flexShrink: 0,
              padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
              border: `1px solid ${showBeta ? TL : BD}`,
              background: showBeta ? '#0b2422' : '#1e1e1e',
              color: showBeta ? TL : MD,
            }}
            onClick={() => setShowBeta(b => !b)}
          >
            {showBeta ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}
