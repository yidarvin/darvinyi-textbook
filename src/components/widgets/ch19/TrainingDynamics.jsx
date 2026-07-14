import { useState, useRef, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  orange:    '#fb923c',
  red:       '#f87171',
  green:     '#34d399',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg4:       '#1e1e1e',
  text:      '#e8eaed',
  textMid:   '#888888',
  textMuted: '#555555',
  codeBg:    '#0a0a0a',
};

const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";
const LN2  = Math.log(2); // 0.6931…

// ── Seeded PRNG ────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Precomputed trajectories ───────────────────────────────────────────────
function buildTrajectories() {
  const rng = mulberry32(42);
  const n   = (sigma) => rng() * 2 * sigma - sigma;

  const healthy     = { d: [], g: [] };
  const domination  = { d: [], g: [] };
  const oscillating = { d: [], g: [] };

  for (let t = 0; t < 100; t++) {
    // Healthy: both converge toward ln(2)
    healthy.d.push(1.40 * Math.exp(-t / 25) + LN2 * (1 - Math.exp(-t / 25)) + n(0.04));
    healthy.g.push(2.00 * Math.exp(-t / 30) + LN2 * (1 - Math.exp(-t / 30)) + n(0.07));

    // Discriminator dominance: D's cross-entropy loss collapses toward 0 as it
    // becomes a confident, correct classifier. G's non-saturating loss
    // −log(D(G(z))) does the OPPOSITE — it grows as D(G(z))→0, since G is
    // getting no useful gradient. (Not mode collapse: sample diversity is a
    // separate axis this loss-curve view can't see — see GANLossCurves.)
    domination.d.push(t <= 35 ? 1.38 - t * 0.038 + n(0.03) : 0.05 + n(0.01));
    domination.g.push(t <= 20
      ? 2.0 - t * 0.03 + n(0.06)
      : 1.4 + 2.6 * (1 - Math.exp(-(t - 20) / 25)) + n(0.08));

    // Oscillating — amplitude grows
    const amp = 1 + t * 0.006;
    oscillating.d.push(1.0 + amp * (0.3 * Math.sin(t * 0.25) + 0.1 * Math.sin(t * 0.7))            + n(0.04));
    oscillating.g.push(1.5 + amp * (0.4 * Math.sin(t * 0.18 + 1.2) + 0.15 * Math.cos(t * 0.5))    + n(0.06));
  }

  return { healthy, domination, oscillating };
}

const TRAJ = buildTrajectories();

// ── Canvas constants ───────────────────────────────────────────────────────
const PAD = { L: 44, R: 16, T: 20, B: 36 };
const Y_MIN = 0, Y_MAX = 2.5;

const SCENARIOS = [
  { key: 'healthy',     label: 'Healthy Training'        },
  { key: 'domination',  label: 'Discriminator Dominance' },
  { key: 'oscillating', label: 'Oscillating'             },
];

const DIAG = {
  healthy:     { converged: 'yes', label: 'Healthy',    note: 'Both losses near ln(2). Nash equilibrium reached.' },
  domination:  { converged: 'no',  label: 'Dominated',  note: 'D_loss → 0, G_loss → high. D too strong; G gets no gradient. (This is not mode collapse — that failure is invisible in loss curves; see the panel above.)' },
  oscillating: { converged: 'no',  label: 'Oscillating', note: 'Losses cycle without settling. Training failed.' },
};

// ── Canvas draw ────────────────────────────────────────────────────────────
function drawChart(canvas, { scenario, currentStep, showAnnotations, showEquilibriumLine }) {
  if (!canvas) return;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (!cssW || !cssH) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const W      = cssW;
  const H      = cssH;
  const chartW = W - PAD.L - PAD.R;
  const chartH = H - PAD.T - PAD.B;

  const sx = (step) => PAD.L + (step / 100) * chartW;
  const sy = (loss) => PAD.T + (1 - (Math.max(Y_MIN, Math.min(Y_MAX, loss)) - Y_MIN) / (Y_MAX - Y_MIN)) * chartH;

  // Background
  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  // ── Scenario shading ─────────────────────────────────────────────────────
  if (showAnnotations) {
    if (scenario === 'healthy') {
      ctx.fillStyle = 'rgba(52,211,153,0.06)';
      ctx.fillRect(sx(60), PAD.T, sx(100) - sx(60), chartH);
    } else if (scenario === 'domination') {
      ctx.fillStyle = 'rgba(248,113,113,0.07)';
      ctx.fillRect(sx(35), PAD.T, sx(100) - sx(35), chartH);
    } else {
      // Alternating stripes every 10 steps
      for (let i = 0; i < 100; i += 10) {
        ctx.fillStyle = (i / 10) % 2 === 0 ? 'rgba(251,146,60,0.04)' : 'rgba(42,42,42,0.04)';
        ctx.fillRect(sx(i), PAD.T, chartW / 10 + 1, chartH);
      }
    }
  }

  // ── Grid lines ───────────────────────────────────────────────────────────
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  [0.5, 1.0, 1.386, 1.5, 2.0, 2.5].forEach(y => {
    const yp = sy(y);
    ctx.beginPath();
    ctx.moveTo(PAD.L, yp);
    ctx.lineTo(W - PAD.R, yp);
    ctx.stroke();
  });

  // Chart axes
  ctx.strokeStyle = C.borderLt;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.L, PAD.T);
  ctx.lineTo(PAD.L, PAD.T + chartH);
  ctx.lineTo(W - PAD.R, PAD.T + chartH);
  ctx.stroke();

  // ── Equilibrium line ─────────────────────────────────────────────────────
  if (showEquilibriumLine) {
    const yEq = sy(LN2);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.L, yEq);
    ctx.lineTo(W - PAD.R, yEq);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `9px ${mono}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ln(2)=0.693', W - PAD.R - 3, yEq - 2);
    ctx.restore();
  }

  // ── Y-axis labels ─────────────────────────────────────────────────────────
  ctx.fillStyle = C.textMid;
  ctx.font = `9px ${mono}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [0, 0.5, 1.0, 1.5, 2.0, 2.5].forEach(y => {
    ctx.fillText(y.toFixed(1), PAD.L - 5, sy(y));
  });

  // ── X-axis labels ─────────────────────────────────────────────────────────
  ctx.fillStyle = C.textMid;
  ctx.font = `9px ${mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  [0, 20, 40, 60, 80, 100].forEach(step => {
    ctx.fillText(String(step), sx(step), H - PAD.B + 5);
  });

  // X-axis title
  ctx.fillStyle = C.textMuted;
  ctx.font = `8px ${mono}`;
  ctx.textBaseline = 'bottom';
  ctx.fillText('step', PAD.L + chartW / 2, H - 1);

  // ── Loss lines ────────────────────────────────────────────────────────────
  const data = TRAJ[scenario];
  const maxT = Math.min(currentStep, 99);

  const drawLine = (values, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let t = 0; t <= maxT; t++) {
      t === 0 ? ctx.moveTo(sx(t), sy(values[t])) : ctx.lineTo(sx(t), sy(values[t]));
    }
    ctx.stroke();
  };

  drawLine(data.d, C.orange);
  drawLine(data.g, C.accent);

  // ── Annotations ───────────────────────────────────────────────────────────
  if (showAnnotations) {
    if (scenario === 'healthy' && currentStep >= 60) {
      ctx.fillStyle = C.green;
      ctx.font = `8px ${mono}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Nash equilibrium region', (sx(60) + sx(100)) / 2, PAD.T + 3);
    }

    if (scenario === 'domination') {
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      const evtLine = (step, label) => {
        if (currentStep < step) return;
        const x = sx(step);
        ctx.beginPath();
        ctx.moveTo(x, PAD.T);
        ctx.lineTo(x, PAD.T + chartH);
        ctx.stroke();
        // Rotated label (reads bottom-to-top along the line)
        ctx.save();
        ctx.translate(x + 9, PAD.T + 10);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = C.red;
        ctx.font = `8px ${mono}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
        ctx.restore();
      };

      evtLine(25, 'D pulls ahead');
      evtLine(35, 'D saturates');
      ctx.restore();

      if (currentStep >= 35) {
        ctx.fillStyle = C.red;
        ctx.font = `9px ${mono}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('D saturated — G stuck', (sx(35) + sx(100)) / 2, PAD.T + 3);
      }
    }

    if (scenario === 'oscillating') {
      ctx.fillStyle = C.orange;
      ctx.font = `8px ${mono}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('No sign of convergence', sx(2), PAD.T + 3);
    }
  }

  // ── Step indicator ────────────────────────────────────────────────────────
  if (currentStep > 0 && currentStep < 99) {
    ctx.save();
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(sx(currentStep), PAD.T);
    ctx.lineTo(sx(currentStep), PAD.T + chartH);
    ctx.stroke();
    ctx.restore();
  }

  // ── Legend (top-right) ────────────────────────────────────────────────────
  const lx = W - PAD.R - 72;
  const ly = PAD.T + 6;

  ctx.lineWidth = 2;
  [[C.orange, 'D loss', 0], [C.accent, 'G loss', 14]].forEach(([color, label, dy]) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(lx, ly + dy + 4);
    ctx.lineTo(lx + 14, ly + dy + 4);
    ctx.stroke();
    ctx.fillStyle = C.textMid;
    ctx.font = `10px ${sans}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx + 17, ly + dy + 4);
  });
}

// ── Component ──────────────────────────────────────────────────────────────
export default function TrainingDynamics({ tryThis } = {}) {
  const [scenario,           setScenario]           = useState('healthy');
  const [currentStep,        setCurrentStep]        = useState(0);
  const [isPlaying,          setIsPlaying]          = useState(false);
  const [showAnnotations,    setShowAnnotations]    = useState(true);
  const [showEquilibriumLine,setShowEquilibriumLine]= useState(true);

  const canvasRef   = useRef(null);
  const intervalRef = useRef(null);

  // Redraw on every state change
  useEffect(() => {
    drawChart(canvasRef.current, { scenario, currentStep, showAnnotations, showEquilibriumLine });
  }, [scenario, currentStep, showAnnotations, showEquilibriumLine]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(s => {
          if (s >= 99) { setIsPlaying(false); return 99; }
          return s + 1;
        });
      }, 20);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleScenario = (key) => {
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentStep(0);
    setScenario(key);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const data       = TRAJ[scenario];
  const stepIdx    = Math.min(currentStep, 99);
  const stepD      = data.d[stepIdx];
  const stepG      = data.g[stepIdx];
  const finalD     = data.d[99];
  const finalG     = data.g[99];
  const diag       = DIAG[scenario];

  return (
    <WidgetCard title="GAN Training Dynamics — three scenarios" number="19.2" tryThis={tryThis}>

      {/* ── Scenario tabs ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {SCENARIOS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleScenario(key)}
            style={{
              fontFamily: mono,
              fontSize: '10px',
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: '4px',
              border: `1px solid ${scenario === key ? C.accent : C.border}`,
              background: scenario === key ? '#0b2422' : C.bg4,
              color: scenario === key ? C.accent : C.textMid,
              cursor: 'pointer',
              letterSpacing: '0.03em',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Canvas + Stats ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: '260px', borderRadius: '4px' }}
          />
        </div>

        {/* Stats panel */}
        <div style={{
          width: '180px', flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '12px 13px',
        }}>
          <div style={{ fontFamily: sans, fontSize: '11px', fontWeight: 500, color: C.text, marginBottom: '8px' }}>
            {SCENARIOS.find(s => s.key === scenario)?.label}
          </div>
          <Divider />

          <Label>At step {currentStep}</Label>
          <StatRow label="D_loss"  val={stepD.toFixed(3)} color={C.orange} />
          <StatRow label="G_loss"  val={stepG.toFixed(3)} color={C.accent} />
          <StatRow label="|D−ln2|" val={Math.abs(stepD - LN2).toFixed(3)} />
          <StatRow label="|G−ln2|" val={Math.abs(stepG - LN2).toFixed(3)} />

          <Divider />
          <Label>Final state (step 99)</Label>
          <StatRow label="D_loss"    val={finalD.toFixed(3)} color={C.orange} />
          <StatRow label="G_loss"    val={finalG.toFixed(3)} color={C.accent} />
          <StatRow label="Converged" val={diag.converged}   color={diag.converged === 'yes' ? C.green : C.red} />
          <StatRow label="Diagnosis" val={diag.label}       color={diag.converged === 'yes' ? C.green : C.red} />

          <Divider />
          <div style={{ fontFamily: mono, fontSize: '9px', color: C.textMuted, lineHeight: 1.55 }}>
            {diag.note}
          </div>
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
        <Btn primary onClick={() => setIsPlaying(p => !p)}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </Btn>
        <Btn onClick={handleReset}>↺ Reset</Btn>

        <div style={{ width: '1px', height: '20px', background: C.border, flexShrink: 0 }} />

        <Toggle active={showAnnotations}     onClick={() => setShowAnnotations(v => !v)}>
          Annotations
        </Toggle>
        <Toggle active={showEquilibriumLine} onClick={() => setShowEquilibriumLine(v => !v)}>
          Eq. line
        </Toggle>
      </div>

    </WidgetCard>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatRow({ label, val, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'baseline' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#555555' }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: color || '#2dd4bf' }}>{val}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ width: '100%', height: '1px', background: '#242424', margin: '8px 0' }} />;
}

function Label({ children }) {
  return <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#555555', marginBottom: '5px' }}>{children}</div>;
}

function Btn({ children, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '10px', fontWeight: 500,
      padding: '5px 14px', borderRadius: '4px',
      border: `1px solid ${primary ? '#2dd4bf' : '#242424'}`,
      background: primary ? '#0b2422' : '#1e1e1e',
      color: primary ? '#2dd4bf' : '#888888',
      cursor: 'pointer', flexShrink: 0,
      transition: 'border-color 0.15s, color 0.15s',
    }}>
      {children}
    </button>
  );
}

function Toggle({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '10px', fontWeight: 500,
      padding: '4px 10px', borderRadius: '4px',
      border: `1px solid ${active ? '#2dd4bf' : '#242424'}`,
      background: active ? '#0b2422' : '#1e1e1e',
      color: active ? '#2dd4bf' : '#555555',
      cursor: 'pointer',
      transition: 'border-color 0.15s, color 0.15s',
    }}>
      {children}
    </button>
  );
}
