import { useState, useEffect, useRef, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Constants ────────────────────────────────────────────────────────────────
const CLASSES  = ['cat', 'dog', 'tiger', 'car', 'airplane'];
const LOGITS   = [4.2, 1.8, 0.9, -2.1, -3.5];
const HARD_LBL = [1, 0, 0, 0, 0];
const MONO     = "'JetBrains Mono', monospace";

const C = {
  accent:   '#2dd4bf',
  orange:   '#fb923c',
  borderLt: '#2e2e2e',
  border:   '#242424',
  textMuted:'#555555',
  textMid:  '#888888',
  codeBg:   '#0a0a0a',
  bg2:      '#111111',
  math:     '#fbbf24',
};

// ── Math ─────────────────────────────────────────────────────────────────────
function softmax(logits, T) {
  const scaled = logits.map(z => z / T);
  const max    = Math.max(...scaled);
  const exps   = scaled.map(z => Math.exp(z - max));
  const sum    = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function klDiv(p, q) {
  return p.reduce((acc, pi, i) => {
    if (pi < 1e-10) return acc;
    return acc + pi * Math.log(pi / Math.max(q[i], 1e-7));
  }, 0);
}

// CE loss of the teacher's hard prediction at T=1 — fixed reference
const CE_HARD = -Math.log(softmax(LOGITS, 1)[0]);

// ── Sub-components ────────────────────────────────────────────────────────────

function StatRow({ label, value, color, big }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        fontFamily: MONO, fontSize: '9px', color: C.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: MONO, fontSize: big ? '18px' : '13px',
        lineHeight: 1, color: color || C.accent,
      }}>
        {value}
      </div>
    </div>
  );
}

// Left chart: teacher soft distribution at temperature T
function TeacherChart({ probs, temperature }) {
  const W = 280, H = 240;
  const PL = 30, PR = 8, PT = 38, PB = 30;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const step  = plotW / CLASSES.length;
  const barW  = Math.floor(step * 0.52);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
      <text x={W / 2} y={15} textAnchor="middle"
        fontFamily={MONO} fontSize="9.5" fill={C.textMid}>
        Teacher output at T = {temperature.toFixed(1)}
      </text>

      <rect x={PL} y={PT} width={plotW} height={plotH}
        fill={C.codeBg} stroke={C.border} strokeWidth={0.5} rx={2} />

      {[0.25, 0.5, 0.75, 1.0].map(v => {
        const y = PT + plotH * (1 - v);
        return (
          <g key={v}>
            <line x1={PL} y1={y} x2={PL + plotW} y2={y}
              stroke={C.border} strokeWidth={0.5} strokeDasharray="2 2" />
            <text x={PL - 3} y={y + 3.5} textAnchor="end"
              fontFamily={MONO} fontSize="7.5" fill={C.textMuted}>
              {v.toFixed(2)}
            </text>
          </g>
        );
      })}

      {CLASSES.map((cls, i) => {
        const p    = probs[i];
        const barH = p * plotH;
        const cx   = PL + (i + 0.5) * step;
        const bx   = cx - barW / 2;
        const by   = PT + plotH - barH;
        return (
          <g key={cls}>
            <rect x={bx} y={by} width={barW} height={Math.max(barH, 1)}
              fill={i === 0 ? C.accent : C.borderLt} rx={1} />
            <text x={cx} y={Math.max(by - 3, PT + 10)} textAnchor="middle"
              fontFamily={MONO} fontSize="8.5"
              fill={i === 0 ? C.accent : C.textMid}>
              {p.toFixed(2)}
            </text>
            <text x={cx} y={PT + plotH + 17} textAnchor="middle"
              fontFamily={MONO} fontSize="8.5" fill={C.textMuted}>
              {cls}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Right chart: hard one-hot label vs teacher soft target side-by-side
function SoftTargetChart({ animProbs }) {
  const W = 280, H = 240;
  const PL = 30, PR = 8, PT = 38, PB = 30;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const step  = plotW / CLASSES.length;
  const hardW = 7, softW = 18, gap = 3;
  const groupW = hardW + gap + softW;
  const gOff   = (step - groupW) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
      <text x={W / 2} y={15} textAnchor="middle"
        fontFamily={MONO} fontSize="9.5" fill={C.textMid}>
        What the student learns from
      </text>

      {/* Legend */}
      <rect x={PL} y={24} width={7} height={7} fill="#4a4a4a" rx={1} />
      <text x={PL + 10} y={30.5} fontFamily={MONO} fontSize="7.5" fill={C.textMuted}>
        ← hard label
      </text>
      <rect x={PL + 84} y={24} width={7} height={7} fill={C.orange} rx={1} />
      <text x={PL + 94} y={30.5} fontFamily={MONO} fontSize="7.5" fill={C.textMuted}>
        soft target →
      </text>

      <rect x={PL} y={PT} width={plotW} height={plotH}
        fill={C.codeBg} stroke={C.border} strokeWidth={0.5} rx={2} />

      {[0.25, 0.5, 0.75, 1.0].map(v => {
        const y = PT + plotH * (1 - v);
        return (
          <g key={v}>
            <line x1={PL} y1={y} x2={PL + plotW} y2={y}
              stroke={C.border} strokeWidth={0.5} strokeDasharray="2 2" />
            <text x={PL - 3} y={y + 3.5} textAnchor="end"
              fontFamily={MONO} fontSize="7.5" fill={C.textMuted}>
              {v.toFixed(2)}
            </text>
          </g>
        );
      })}

      {CLASSES.map((cls, i) => {
        const gx    = PL + i * step + gOff;
        const hardH = HARD_LBL[i] * plotH;
        const softH = animProbs[i] * plotH;
        const hardY = PT + plotH - Math.max(hardH, 2);
        const softY = PT + plotH - Math.max(softH, 1);
        const cx    = gx + groupW / 2;
        return (
          <g key={cls}>
            <rect x={gx} y={hardY} width={hardW} height={Math.max(hardH, 2)}
              fill={hardH > 0 ? '#4a4a4a' : C.borderLt} rx={1} />
            <rect x={gx + hardW + gap} y={softY}
              width={softW} height={Math.max(softH, 1)}
              fill={C.orange} rx={1} opacity={0.85} />
            <text x={cx} y={PT + plotH + 17} textAnchor="middle"
              fontFamily={MONO} fontSize="8.5" fill={C.textMuted}>
              {cls}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function StatsPanel({ probs, kl, totalLoss, temperature }) {
  return (
    <div style={{
      width: '170px', flexShrink: 0,
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: '8px', padding: '14px 16px',
    }}>
      <StatRow label='P("cat") at T' value={`${(probs[0] * 100).toFixed(1)}%`} big />
      <StatRow label='P("dog") at T' value={`${(probs[1] * 100).toFixed(1)}%`} color={C.textMid} />
      <StatRow label='P("car") at T' value={`${(probs[3] * 100).toFixed(1)}%`} color={C.textMuted} />
      <div style={{ borderTop: `1px solid ${C.border}`, margin: '10px 0' }} />
      <StatRow label="KL divergence" value={kl.toFixed(4)} color={C.math} />
      <div style={{ borderTop: `1px solid ${C.border}`, margin: '10px 0' }} />
      <div>
        <div style={{
          fontFamily: MONO, fontSize: '9px', color: C.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
        }}>
          Total student loss
        </div>
        <div style={{ fontFamily: MONO, fontSize: '13px', color: C.accent, marginBottom: '3px' }}>
          {totalLoss.toFixed(4)}
        </div>
        <div style={{ fontFamily: MONO, fontSize: '7.5px', color: C.textMuted, lineHeight: 1.7 }}>
          α·CE + (1−α)·T²·KL
        </div>
        <div style={{ fontFamily: MONO, fontSize: '7.5px', color: C.textMuted }}>
          T² = {(temperature * temperature).toFixed(1)}
        </div>
      </div>
    </div>
  );
}

function PresetBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: MONO, fontSize: '10px',
      color: active ? C.accent : C.textMuted,
      background: active ? 'var(--accent-dim)' : 'transparent',
      border: `1px solid ${active ? C.accent : C.border}`,
      borderRadius: '4px', padding: '4px 8px', cursor: 'pointer',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function KnowledgeDistillation() {
  const [temperature, setTemperature] = useState(1.0);
  const [alpha, setAlpha]             = useState(0.5);
  const [displayProbs, setDisplayProbs] = useState(() => softmax(LOGITS, 1.0));

  const animRef    = useRef(null);
  const currentRef = useRef(softmax(LOGITS, 1.0));

  useEffect(() => {
    const target = softmax(LOGITS, temperature);
    const start  = [...currentRef.current];
    const t0     = performance.now();
    const DUR    = 350;

    function frame(now) {
      const t = Math.min(1, (now - t0) / DUR);
      // ease-in-out-quad
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const cur = start.map((s, i) => s + (target[i] - s) * e);
      currentRef.current = cur;
      setDisplayProbs([...cur]);
      if (t < 1) animRef.current = requestAnimationFrame(frame);
    }

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(frame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [temperature]);

  const targetProbs = useMemo(() => softmax(LOGITS, temperature), [temperature]);
  const kl          = useMemo(() => klDiv(targetProbs, HARD_LBL), [targetProbs]);
  const totalLoss   = alpha * CE_HARD + (1 - alpha) * temperature * temperature * kl;

  const PRESETS = [
    { label: 'T=1', val: 1.0 },
    { label: 'T=4 (dark knowledge)', val: 4.0 },
    { label: 'T=10 (uniform)', val: 10.0 },
  ];

  return (
    <WidgetCard title="Knowledge Distillation — temperature and soft targets" number="4.4">

      {/* Charts + stats */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{
          flex: 1, minWidth: 0,
          background: C.codeBg, border: `1px solid ${C.border}`,
          borderRadius: '6px', overflow: 'hidden',
        }}>
          <TeacherChart probs={displayProbs} temperature={temperature} />
        </div>
        <div style={{
          flex: 1, minWidth: 0,
          background: C.codeBg, border: `1px solid ${C.border}`,
          borderRadius: '6px', overflow: 'hidden',
        }}>
          <SoftTargetChart animProbs={displayProbs} />
        </div>
        <StatsPanel probs={targetProbs} kl={kl} totalLoss={totalLoss} temperature={temperature} />
      </div>

      {/* KL info */}
      <div style={{
        marginTop: '12px', textAlign: 'center',
        fontFamily: MONO, fontSize: '11px', color: C.accent,
      }}>
        Information in soft targets:&nbsp; KL = {kl.toFixed(3)} nats
      </div>

      {/* Controls */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Temperature slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)',
            minWidth: '148px',
          }}>
            Temperature&nbsp; T = {temperature.toFixed(1)}
          </span>
          <input type="range" min={0.5} max={10.0} step={0.1} value={temperature}
            onChange={e => setTemperature(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>

        {/* Preset buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingLeft: '160px' }}>
          {PRESETS.map(p => (
            <PresetBtn key={p.val} label={p.label}
              active={Math.abs(temperature - p.val) < 0.05}
              onClick={() => setTemperature(p.val)}
            />
          ))}
        </div>

        {/* Alpha slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ minWidth: '148px' }}>
            <div style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)' }}>
              α = {alpha.toFixed(2)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: C.textMuted, marginTop: '1px' }}>
              weight on soft KL vs hard CE
            </div>
          </div>
          <input type="range" min={0.0} max={1.0} step={0.05} value={alpha}
            onChange={e => setAlpha(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>

      </div>
    </WidgetCard>
  );
}
