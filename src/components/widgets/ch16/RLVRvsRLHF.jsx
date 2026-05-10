import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO  = "'JetBrains Mono', monospace";
const INTER = "'Inter', sans-serif";
const SERIF = "'Crimson Pro', serif";

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  muted:     '#555555',
  mid:       '#888888',
  text:      '#e8eaed',
  prose:     '#b8c4cc',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  codeBg:    '#0a0a0a',
};

const RLHF_PTS = [[0.1, 0.85], [0.3, 0.78], [0.5, 0.65], [0.7, 0.52], [0.9, 0.40]];

// ── Scalability chart ─────────────────────────────────────────────────────────

function drawScalabilityChart(ctx, W, H) {
  const PL = 38, PR = 12, PT = 20, PB = 30;
  const pw = W - PL - PR;
  const ph = H - PT - PB;
  const tx = x => PL + x * pw;
  const ty = y => PT + (1 - y) * ph;

  ctx.clearRect(0, 0, W, H);

  // Amber shading — RLVR advantage region
  ctx.fillStyle = 'rgba(251,191,36,0.06)';
  ctx.fillRect(tx(0), ty(1), tx(0.6) - tx(0), ph);

  // Horizontal grid
  ctx.lineWidth = 0.5;
  for (const v of [0.25, 0.5, 0.75, 1.0]) {
    ctx.strokeStyle = v === 1.0 ? C.borderLt : C.border;
    ctx.beginPath();
    ctx.moveTo(PL, ty(v));
    ctx.lineTo(W - PR, ty(v));
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PL, PT - 6);
  ctx.lineTo(PL, H - PB);
  ctx.lineTo(W - PR, H - PB);
  ctx.stroke();

  // Y-axis tick labels
  ctx.fillStyle = C.muted;
  ctx.font = `8px ${MONO}`;
  ctx.textAlign = 'right';
  for (const v of [0, 0.5, 1.0]) {
    ctx.fillText(`${Math.round(v * 100)}%`, PL - 4, ty(v) + 3);
  }

  // Y-axis label (rotated)
  ctx.save();
  ctx.translate(9, ty(0.5));
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = C.muted;
  ctx.font = `8px ${INTER}`;
  ctx.textAlign = 'center';
  ctx.fillText('Reward quality', 0, 0);
  ctx.restore();

  // X-axis label
  ctx.fillStyle = C.muted;
  ctx.font = `8px ${INTER}`;
  ctx.textAlign = 'center';
  ctx.fillText('Task complexity →', tx(0.5), H - 5);

  // Vertical dashed threshold line at x=0.6
  ctx.strokeStyle = C.mid;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(tx(0.6), PT - 6);
  ctx.lineTo(tx(0.6), H - PB);
  ctx.stroke();
  ctx.setLineDash([]);

  // Threshold label
  ctx.fillStyle = C.mid;
  ctx.font = `7.5px ${INTER}`;
  ctx.textAlign = 'center';
  ctx.fillText('verifiability threshold', tx(0.6), PT - 8);

  // Region annotations
  ctx.fillStyle = 'rgba(251,191,36,0.65)';
  ctx.font = `7.5px ${INTER}`;
  ctx.textAlign = 'left';
  ctx.fillText('← RLVR applies here', tx(0.02), ty(0.08));

  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.fillText('(N/A for RLVR)', tx(0.8), ty(0.08));

  // ── RLHF line (catmull-rom smooth) ──
  const rhPts = RLHF_PTS.map(([x, y]) => [tx(x), ty(y)]);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(rhPts[0][0], rhPts[0][1]);
  for (let i = 0; i < rhPts.length - 1; i++) {
    const p0 = rhPts[Math.max(0, i - 1)];
    const p1 = rhPts[i];
    const p2 = rhPts[i + 1];
    const p3 = rhPts[Math.min(rhPts.length - 1, i + 2)];
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1],
    );
  }
  ctx.stroke();

  ctx.fillStyle = C.accent;
  ctx.font = `8.5px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.fillText('RLHF', rhPts[0][0] + 3, rhPts[0][1] - 6);

  // ── RLVR line ──
  ctx.strokeStyle = C.math;

  // Solid: x=0 → x=0.6 at y=1.0
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(tx(0), ty(1.0));
  ctx.lineTo(tx(0.6), ty(1.0));
  ctx.stroke();

  // Dashed vertical drop at x=0.6
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(tx(0.6), ty(1.0));
  ctx.lineTo(tx(0.6), ty(0.0));
  ctx.stroke();
  ctx.setLineDash([]);

  // Flat: x=0.6 → x=1.0 at y=0
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(tx(0.6), ty(0.0));
  ctx.lineTo(tx(1.0), ty(0.0));
  ctx.stroke();

  ctx.fillStyle = C.math;
  ctx.font = `8.5px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.fillText('RLVR', tx(0.02), ty(1.0) - 5);
}

// ── Small SVG icons ───────────────────────────────────────────────────────────

function PersonPairIcon() {
  return (
    <svg viewBox="0 0 64 22" width="64" height="18" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="9" cy="6" r="3.5" fill="none" stroke={C.accent} strokeWidth="1.2" />
      <path d="M4.5 19 Q4.5 12 9 12 Q13.5 12 13.5 19"
        fill="none" stroke={C.accent} strokeWidth="1.2" />
      <line x1="17" y1="11" x2="26" y2="11" stroke={C.accent} strokeWidth="1" />
      <polygon points="26,8.5 32,11 26,13.5" fill={C.accent} />
      <circle cx="53" cy="6" r="3.5" fill="none" stroke={C.mid} strokeWidth="1.2" />
      <path d="M48.5 19 Q48.5 12 53 12 Q57.5 12 57.5 19"
        fill="none" stroke={C.mid} strokeWidth="1.2" />
    </svg>
  );
}

function CircuitCheckIcon() {
  return (
    <svg viewBox="0 0 64 22" width="64" height="18" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="13" y="3" width="38" height="16" rx="2" fill="none" stroke={C.math} strokeWidth="1.2" />
      <line x1="3" y1="8" x2="13" y2="8" stroke={C.math} strokeWidth="0.8" />
      <line x1="3" y1="14" x2="13" y2="14" stroke={C.math} strokeWidth="0.8" />
      <line x1="51" y1="8" x2="61" y2="8" stroke={C.math} strokeWidth="0.8" />
      <line x1="51" y1="14" x2="61" y2="14" stroke={C.math} strokeWidth="0.8" />
      <path d="M23 11 L29 17 L41 6"
        fill="none" stroke={C.green} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellCurveChart() {
  const pts = [];
  for (let i = 0; i <= 50; i++) {
    const x = i / 50;
    const z = (x - 0.5) / 0.18;
    const y = Math.exp(-0.5 * z * z);
    pts.push([6 + x * 68, 22 - y * 18]);
  }
  const line = pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const first = pts[0], last = pts[pts.length - 1];
  const area = `M${first[0].toFixed(1)},22 ${pts.map(p =>
    `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} L${last[0].toFixed(1)},22 Z`;

  return (
    <svg viewBox="0 0 80 26" width="72" height="22" style={{ display: 'block', flexShrink: 0 }}>
      <path d={area} fill={`${C.accent}22`} />
      <path d={line} fill="none" stroke={C.accent} strokeWidth="1.5" />
    </svg>
  );
}

function BinaryBarsChart() {
  return (
    <svg viewBox="0 0 80 26" width="72" height="22" style={{ display: 'block', flexShrink: 0 }}>
      <line x1="8" y1="22" x2="72" y2="22" stroke={C.border} strokeWidth="0.5" />
      <rect x="12" y="20" width="18" height="2" rx="1" fill={C.math} opacity="0.4" />
      <text x="21" y="18.5" textAnchor="middle" fontSize="7" fontFamily={MONO} fill={C.muted}>0</text>
      <rect x="50" y="5" width="18" height="17" rx="1" fill={C.math} />
      <text x="59" y="3.5" textAnchor="middle" fontSize="7" fontFamily={MONO} fill={C.math}>1</text>
    </svg>
  );
}

// ── Reusable atoms ─────────────────────────────────────────────────────────────

function ProgressMeter({ pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ flex: 1, height: '5px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px' }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: '8px', color, width: '26px', textAlign: 'right', flexShrink: 0 }}>
        {pct}%
      </span>
    </div>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', marginRight: '4px', marginBottom: '3px',
      background: C.bg4, border: `1px solid ${C.border}`,
      borderRadius: '12px', padding: '2px 7px',
      fontFamily: INTER, fontSize: '9px', color,
    }}>
      {label}
    </span>
  );
}

function ToggleBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: MONO, fontSize: '10px', padding: '4px 10px', cursor: 'pointer',
      background: active ? C.accentDim : C.bg4,
      color: active ? C.accent : C.mid,
      border: `1px solid ${active ? C.accent : C.borderLt}`,
      borderRadius: '4px', letterSpacing: '0.02em',
    }}>
      {active ? '● ' : '○ '}{label}
    </button>
  );
}

// 1px divider with 24px margin on each side (≈ 49px total gap between columns)
function ColDiv() {
  return (
    <div style={{ width: '1px', background: C.border, flexShrink: 0, alignSelf: 'stretch', margin: '0 24px' }} />
  );
}

// Static row wrapper — no interaction, height auto
function RowWrap({ label, children }) {
  return (
    <div style={{ borderTop: `0.5px solid ${C.border}` }}>
      <div style={{
        fontFamily: MONO, fontSize: '7.5px', color: C.muted,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        padding: '6px 0 0',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {children}
      </div>
    </div>
  );
}

// ── Example panel ──────────────────────────────────────────────────────────────

function ExamplePanel() {
  const ML = (text, color = C.mid) => (
    <div style={{ fontFamily: MONO, fontSize: '10px', color, lineHeight: 1.65 }}>{text}</div>
  );
  const PL = (text) => (
    <div style={{ fontFamily: INTER, fontSize: '10px', color: C.mid, lineHeight: 1.5 }}>{text}</div>
  );
  const V = ({ correct }) => (
    <span style={{ color: correct ? C.green : C.red }}>{correct ? '✓' : '✗'}</span>
  );

  return (
    <div style={{ background: C.bg3, borderTop: `1px solid ${C.border}`, padding: '12px 16px' }}>
      <div style={{
        fontFamily: INTER, fontSize: '12px', fontWeight: '600',
        color: C.text, marginBottom: '10px',
      }}>
        Example: Training on math word problems
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>

        {/* RLHF sub-panel */}
        <div style={{ flex: 1, borderLeft: `2px solid ${C.accent}`, paddingLeft: '10px' }}>
          <div style={{ fontFamily: MONO, fontSize: '8px', color: C.accent, letterSpacing: '0.08em', marginBottom: '6px' }}>
            RLHF
          </div>
          {ML('Query: What is 347 × 28?')}
          {ML('Response A: 9,716  ← model output', C.text)}
          {ML('Response B: 9,516  ← another output', C.text)}
          {PL('Human annotator: prefers A (looks more confident)')}
          <div style={{ fontFamily: MONO, fontSize: '10px', color: C.mid, lineHeight: 1.65 }}>
            Ground truth: 9,716&nbsp;<V correct />&nbsp;— annotator was right
          </div>
          {PL('But: may prefer a confident wrong answer over a hesitant correct one.')}
          <div style={{ fontFamily: MONO, fontSize: '10px', color: C.red, lineHeight: 1.65 }}>
            Hacking risk: ★★★★☆
          </div>
        </div>

        {/* RLVR sub-panel */}
        <div style={{ flex: 1, borderLeft: `2px solid ${C.math}`, paddingLeft: '10px' }}>
          <div style={{ fontFamily: MONO, fontSize: '8px', color: C.math, letterSpacing: '0.08em', marginBottom: '6px' }}>
            RLVR
          </div>
          {ML('Query: What is 347 × 28?')}
          {ML('Response: 9,716', C.text)}
          <div style={{ fontFamily: MONO, fontSize: '10px', lineHeight: 1.65 }}>
            <span style={{ color: C.mid }}>Verifier: 347×28 = 9,716</span>&nbsp;
            <V correct />&nbsp;
            <span style={{ color: C.mid }}>→ reward =&nbsp;</span>
            <span style={{ color: C.green }}>1</span>
          </div>
          {ML('Response: 9,516', C.text)}
          <div style={{ fontFamily: MONO, fontSize: '10px', lineHeight: 1.65 }}>
            <span style={{ color: C.mid }}>Verifier: 347×28 ≠ 9,516</span>&nbsp;
            <V />&nbsp;
            <span style={{ color: C.mid }}>→ reward =&nbsp;</span>
            <span style={{ color: C.red }}>0</span>
          </div>
          {PL('No ambiguity. Ground truth is ground truth.')}
          <div style={{ fontFamily: MONO, fontSize: '10px', color: C.green, lineHeight: 1.65 }}>
            Hacking risk: ☆☆☆☆☆
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Summary strip (3-column, full-width) ──────────────────────────────────────

function SummaryStrip() {
  const Lbl = ({ children }) => (
    <div style={{
      fontFamily: MONO, fontSize: '7.5px', color: C.muted,
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px',
    }}>
      {children}
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      marginTop: '12px',
      background: C.bg3,
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
      overflow: 'hidden',
    }}>

      {/* Section 1: Summary */}
      <div style={{ flex: 1, padding: '12px 14px' }}>
        <Lbl>Summary</Lbl>
        <div style={{ fontFamily: INTER, fontSize: '10px', color: C.mid, lineHeight: 1.65, marginBottom: '4px' }}>
          <span style={{ color: C.accent }}>RLHF</span> — Human feedback, continuous reward,
          scalability bottleneck at annotators.
        </div>
        <div style={{ fontFamily: INTER, fontSize: '10px', color: C.mid, lineHeight: 1.65 }}>
          <span style={{ color: C.math }}>RLVR</span> — Ground truth verifier, binary reward,
          unlimited automatic scale.
        </div>
      </div>

      <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />

      {/* Section 2: Key results */}
      <div style={{ flex: 1, padding: '12px 14px' }}>
        <Lbl>Key results</Lbl>
        <div style={{ fontFamily: INTER, fontSize: '10px', color: C.mid, lineHeight: 1.65, marginBottom: '4px' }}>
          <span style={{ color: C.math }}>DeepSeek-R1:</span> RLVR alone produced strong
          chain-of-thought reasoning without any SFT warm-up.
        </div>
        <div style={{ fontFamily: INTER, fontSize: '10px', color: C.mid, lineHeight: 1.65 }}>
          <span style={{ color: C.accent }}>InstructGPT:</span> RLHF enabled instruction following
          at scale with human preferences.
        </div>
      </div>

      <div style={{ width: '1px', background: C.border, flexShrink: 0 }} />

      {/* Section 3: When to use */}
      <div style={{ flex: 1, padding: '12px 14px' }}>
        <Lbl>When to use</Lbl>
        <div style={{ fontFamily: INTER, fontSize: '10px', color: C.mid, lineHeight: 1.75 }}>
          <span style={{ color: C.accent }}>RLHF</span> — task is subjective or lacks a verifier.<br />
          <span style={{ color: C.math }}>RLVR</span> — ground truth is available.<br />
          <span style={{ color: C.text }}>Both</span> — combine for best of both worlds.
        </div>
      </div>

    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RLVRvsRLHF() {
  const [showExample, setShowExample] = useState(true);
  const [showChart,   setShowChart]   = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!showChart) return;
    const frame = requestAnimationFrame(() => {
      const cvs = chartRef.current;
      if (!cvs) return;
      const { width, height } = cvs.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cvs.width  = Math.round(width  * dpr);
      cvs.height = Math.round(height * dpr);
      const ctx = cvs.getContext('2d');
      ctx.scale(dpr, dpr);
      drawScalabilityChart(ctx, width, height);
    });
    return () => cancelAnimationFrame(frame);
  }, [showChart]);

  // Column cell container — flex column, padding for breathing room
  const col = { flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 0 10px' };

  // Typography for row cells
  const main = { fontFamily: INTER, fontSize: '11px', color: C.prose, lineHeight: 1.5 };
  const note = { fontFamily: INTER, fontSize: '10px', color: C.mid,   lineHeight: 1.5, marginTop: '3px' };
  const sub  = (color = C.muted) => ({ fontFamily: MONO, fontSize: '8px', color, marginTop: '2px' });

  return (
    <WidgetCard title="RLVR vs RLHF — verifiable rewards vs human feedback" number="16.6">

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 0 10px', borderBottom: `1px solid ${C.border}` }}>
        <ToggleBtn label="Show example" active={showExample} onClick={() => setShowExample(p => !p)} />
        <ToggleBtn label="Show chart"   active={showChart}   onClick={() => setShowChart(p => !p)} />
      </div>

      {/* ── Column headers ── */}
      <div style={{ display: 'flex', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: SERIF, fontSize: '18px', color: C.accent, lineHeight: 1.2 }}>RLHF</div>
          <div style={{ fontFamily: INTER, fontSize: '11px', color: C.muted }}>Human Feedback</div>
        </div>
        <div style={{ width: '1px', background: C.border, flexShrink: 0, margin: '0 24px' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: SERIF, fontSize: '18px', color: C.math, lineHeight: 1.2 }}>RLVR</div>
          <div style={{ fontFamily: INTER, fontSize: '11px', color: C.muted }}>Verifiable Rewards</div>
        </div>
      </div>

      {/* ── Row 1: Reward Source ── */}
      <RowWrap label="Reward Source">
        <div style={col}>
          <PersonPairIcon />
          <div style={{ ...main, marginTop: '5px' }}>Human annotators compare pairs of model responses.</div>
          <div style={note}>Preferences train a reward model that generalizes to new outputs.</div>
        </div>
        <ColDiv />
        <div style={col}>
          <CircuitCheckIcon />
          <div style={{ ...main, marginTop: '5px' }}>An automatic verifier checks each response against ground truth.</div>
          <div style={note}>Any deterministic function works: test runner, equation checker, proof validator.</div>
        </div>
      </RowWrap>

      {/* ── Row 2: Reward Signal ── */}
      <RowWrap label="Reward Signal">
        <div style={col}>
          <div style={main}>Continuous scalar from a learned reward model.</div>
          <div style={note}>Rich signal — but inherits annotator noise and biases.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <BellCurveChart />
            <span style={sub(C.accent)}>continuous, learned</span>
          </div>
        </div>
        <ColDiv />
        <div style={col}>
          <div style={main}>Binary: 1 if correct, 0 if incorrect.</div>
          <div style={note}>Exact signal — no approximation, no noise.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <BinaryBarsChart />
            <span style={sub(C.math)}>binary, exact</span>
          </div>
        </div>
      </RowWrap>

      {/* ── Row 3: Scalability ── */}
      <RowWrap label="Scalability">
        <div style={col}>
          <div style={main}>Fundamentally limited by annotator bandwidth.</div>
          <div style={note}>InstructGPT required ~40K expert comparisons collected over months.</div>
          <div style={{ marginTop: '6px' }}>
            <ProgressMeter pct={40} color={C.accent} />
          </div>
          <div style={sub()}>bottleneck: annotators</div>
        </div>
        <ColDiv />
        <div style={col}>
          <div style={main}>Unlimited — a verifier is just a function call.</div>
          <div style={note}>Scales to millions of responses per second at near-zero marginal cost.</div>
          <div style={{ marginTop: '6px' }}>
            <ProgressMeter pct={95} color={C.math} />
          </div>
          <div style={sub()}>unlimited scale</div>
        </div>
      </RowWrap>

      {/* ── Row 4: Reward Hacking Risk ── */}
      <RowWrap label="Reward Hacking Risk">
        <div style={col}>
          <div style={main}>Model learns to exploit weaknesses in the reward model.</div>
          <div style={note}>Confident-sounding wrong answers can outscore hesitant correct ones. KL penalty helps.</div>
          <div style={{ marginTop: '6px' }}>
            <ProgressMeter pct={75} color={C.red} />
          </div>
          <div style={sub(C.red)}>high — model exploits RM</div>
        </div>
        <ColDiv />
        <div style={col}>
          <div style={main}>Cannot hack a correct verifier.</div>
          <div style={note}>Only genuinely correct answers receive reward = 1. No learned weaknesses to exploit.</div>
          <div style={{ marginTop: '6px' }}>
            <ProgressMeter pct={15} color={C.red} />
          </div>
          <div style={sub(C.green)}>low — verifier is ground truth</div>
        </div>
      </RowWrap>

      {/* ── Row 5: Best For ── */}
      <RowWrap label="Best For">
        <div style={col}>
          <div style={main}>Subjective tasks where "correct" is ill-defined.</div>
          <div style={note}>Style, tone, safety, and helpfulness all require human judgment to evaluate.</div>
          <div style={{ marginTop: '7px' }}>
            {['instruction following', 'harmlessness', 'style'].map(t => (
              <Tag key={t} label={t} color={C.accent} />
            ))}
          </div>
        </div>
        <ColDiv />
        <div style={col}>
          <div style={main}>Objective tasks with deterministic ground truth.</div>
          <div style={note}>DeepSeek-R1 used RLVR on math/code to achieve frontier reasoning — no SFT warm-up needed.</div>
          <div style={{ marginTop: '7px' }}>
            {['math reasoning', 'code generation', 'proof checking'].map(t => (
              <Tag key={t} label={t} color={C.math} />
            ))}
          </div>
        </div>
      </RowWrap>

      {/* ── Math example panel ── */}
      {showExample && <ExamplePanel />}

      {/* ── Scalability chart (full width) ── */}
      {showChart && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            fontFamily: MONO, fontSize: '8px', color: C.muted,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
          }}>
            Reward quality vs. task complexity
          </div>
          <canvas
            ref={chartRef}
            style={{
              display: 'block', width: '100%', height: '160px',
              background: C.codeBg, borderRadius: '4px',
            }}
          />
        </div>
      )}

      {/* ── Summary strip (always visible) ── */}
      <SummaryStrip />

    </WidgetCard>
  );
}
