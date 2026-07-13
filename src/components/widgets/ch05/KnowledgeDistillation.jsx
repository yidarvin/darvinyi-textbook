import { useState, useEffect, useRef, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

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

// KL(p‖q). Both p and q are expected to be softmax outputs (strictly positive in
// every coordinate), so the 1e-7 floor below is purely a numerical safety net —
// it is not what determines the result. (It used to be load-bearing: an earlier
// version of this widget called this with a one-hot vector as q, which makes
// KL(p‖q) infinite in theory, and the floor was silently substituting for that
// infinity. Comparing two softmax distributions instead, as done throughout this
// file now, avoids that failure mode entirely.)
function klDiv(p, q) {
  return p.reduce((acc, pi, i) => {
    if (pi < 1e-10) return acc;
    return acc + pi * Math.log(pi / Math.max(q[i], 1e-7));
  }, 0);
}

// ── Student simulation ────────────────────────────────────────────────────────
// The widget used to have no student at all: its "KL divergence" / "total student
// loss" stats were KL(teacher-at-T ‖ one-hot-label) — the teacher compared to the
// ground-truth label, not to any student. That KL is undefined (infinite) in
// theory whenever the teacher assigns nonzero probability to a non-target class,
// which is every T > 1; the widget's large finite numbers were an artifact of the
// 1e-7 floor in klDiv above, not a real information-theoretic or training quantity.
//
// Fix: give the student its own logit vector and actually train it with gradient
// descent on the exact loss from the MathBlock above this widget in the chapter:
//   L = alpha * CE(softmax(z_s), y_hard) + (1-alpha) * T^2 * KL(softmax(z_t/T) ‖ softmax(z_s/T))
// The teacher's logits (LOGITS) are fixed; the student starts from zero logits
// (a maximally uncertain, untrained model) and every value shown by the widget —
// probabilities, KL, and total loss — is read directly off that student's state.
//
// Gradient derivation (standard result, w.r.t. the student's logits z_s):
//   d/dz_s CE(softmax(z_s), y_hard)                     =  softmax(z_s) - y_hard
//   d/dz_s [ T^2 * KL(softmax(z_t/T) ‖ softmax(z_s/T)) ] = T * (softmax(z_s/T) - softmax(z_t/T))
// The second line is exactly why distillation needs the T^2 factor: the raw
// soft-target gradient carries a 1/T, so scaling the KL term by T^2 leaves a
// residual T, matching the hard-label gradient's order of magnitude instead of
// vanishing as T grows (the same point the chapter's prose makes about T^2).
function studentGradient(zStudent, teacherT, temperature, alpha) {
  const studentHard = softmax(zStudent, 1);
  const studentSoft = softmax(zStudent, temperature);
  return zStudent.map((_, i) =>
    alpha * (studentHard[i] - HARD_LBL[i]) +
    (1 - alpha) * temperature * (studentSoft[i] - teacherT[i])
  );
}

const TRAIN_STEPS    = 60;
const LEARNING_RATE  = 2.0;
const GRAD_CLIP_NORM = 3.0; // bounds the update so training stays stable up to T=10

// Precompute the student's full training trajectory for the current (T, alpha).
// trajectory[0] is the untrained student (zero logits, uniform distribution);
// trajectory[k] is the student's exact state after k real gradient-descent steps
// against the fixed teacher. Nothing here is hand-authored — every probability
// and loss value is computed from that step's logits.
function trainStudentTrajectory(temperature, alpha) {
  const teacherT = softmax(LOGITS, temperature);
  let z = [0, 0, 0, 0, 0];
  const traj = [];
  for (let s = 0; s < TRAIN_STEPS; s++) {
    const studentT1 = softmax(z, 1);
    const studentT  = softmax(z, temperature);
    const ce        = -Math.log(Math.max(studentT1[0], 1e-12));
    const kl        = klDiv(teacherT, studentT);
    const totalLoss = alpha * ce + (1 - alpha) * temperature * temperature * kl;
    traj.push({ studentT1, studentT, ce, kl, totalLoss });

    let grad = studentGradient(z, teacherT, temperature, alpha);
    const gNorm = Math.sqrt(grad.reduce((a, g) => a + g * g, 0));
    if (gNorm > GRAD_CLIP_NORM) grad = grad.map(g => g * GRAD_CLIP_NORM / gNorm);
    z = z.map((zi, i) => zi - LEARNING_RATE * grad[i]);
  }
  return traj;
}

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

// Right chart: hard label, teacher soft target, and the student's CURRENT
// (actually trained) output at temperature T, side by side per class — this is
// the real KL(teacher‖student) comparison, not a comparison against a one-hot.
function StudentVsTeacherChart({ teacherProbs, studentProbs }) {
  const W = 280, H = 240;
  const PL = 30, PR = 8, PT = 38, PB = 30;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const step  = plotW / CLASSES.length;
  const hardW = 5, teacherW = 13, studentW = 13, gap = 2;
  const groupW = hardW + gap + teacherW + gap + studentW;
  const gOff   = (step - groupW) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
      <text x={W / 2} y={15} textAnchor="middle"
        fontFamily={MONO} fontSize="9.5" fill={C.textMid}>
        Student (training) vs. teacher target
      </text>

      {/* Legend */}
      <rect x={PL} y={24} width={6} height={6} fill="#4a4a4a" rx={1} />
      <text x={PL + 9} y={30} fontFamily={MONO} fontSize="7" fill={C.textMuted}>
        hard label
      </text>
      <rect x={PL + 58} y={24} width={6} height={6} fill={C.orange} rx={1} />
      <text x={PL + 67} y={30} fontFamily={MONO} fontSize="7" fill={C.textMuted}>
        teacher
      </text>
      <rect x={PL + 108} y={24} width={6} height={6} fill={C.accent} rx={1} />
      <text x={PL + 117} y={30} fontFamily={MONO} fontSize="7" fill={C.textMuted}>
        student
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
        const gx       = PL + i * step + gOff;
        const hardH    = HARD_LBL[i] * plotH;
        const teacherH = teacherProbs[i] * plotH;
        const studentH = studentProbs[i] * plotH;
        const hardY    = PT + plotH - Math.max(hardH, 2);
        const teacherY = PT + plotH - Math.max(teacherH, 1);
        const studentY = PT + plotH - Math.max(studentH, 1);
        const cx       = gx + groupW / 2;
        return (
          <g key={cls}>
            <rect x={gx} y={hardY} width={hardW} height={Math.max(hardH, 2)}
              fill={hardH > 0 ? '#4a4a4a' : C.borderLt} rx={1} />
            <rect x={gx + hardW + gap} y={teacherY}
              width={teacherW} height={Math.max(teacherH, 1)}
              fill={C.orange} rx={1} opacity={0.85} />
            <rect x={gx + hardW + gap + teacherW + gap} y={studentY}
              width={studentW} height={Math.max(studentH, 1)}
              fill={C.accent} rx={1} opacity={0.85} />
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

function StatsPanel({ probs, kl, totalLoss, temperature, step, totalSteps }) {
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
      <StatRow label="Student training step" value={`${step + 1} / ${totalSteps}`} color={C.textMid} />
      <StatRow label="KL(teacher ‖ student)" value={kl.toFixed(4)} color={C.math} />
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

function trainBtnStyle(primary) {
  return {
    fontFamily: MONO, fontSize: '11px',
    fontWeight: primary ? 600 : 400,
    color: primary ? C.accent : C.textMuted,
    background: primary ? 'var(--accent-dim)' : 'transparent',
    border: `1px solid ${primary ? C.accent : C.border}`,
    borderRadius: '4px', padding: '5px 14px', cursor: 'pointer',
  };
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function KnowledgeDistillation({ tryThis }) {
  const [temperature, setTemperature] = useState(1.0);
  const [alpha, setAlpha]             = useState(0.5);
  const [displayProbs, setDisplayProbs] = useState(() => softmax(LOGITS, 1.0));

  const animRef    = useRef(null);
  const currentRef = useRef(softmax(LOGITS, 1.0));

  // Cosmetic tween of the teacher's own (deterministic) softmax curve when T
  // changes — purely visual smoothing, not a claim about training dynamics.
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

  // ── Student: real gradient descent on the exact Hinton distillation loss ──
  const trajectory = useMemo(
    () => trainStudentTrajectory(temperature, alpha),
    [temperature, alpha]
  );

  // Pause the training playback when scrolled off-screen; never auto-run for
  // reduced motion (mirrors the convention already used by GradientClipping.jsx
  // in this chapter).
  const [cardRef, isVisible] = useIsVisible();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisibleRef         = useRef(true);
  isVisibleRef.current = isVisible;

  const trainRafRef = useRef(null);
  const playingRef  = useRef(false);
  const stepRef     = useRef(TRAIN_STEPS - 1);

  const [animStep, setAnimStep]   = useState(TRAIN_STEPS - 1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Whenever T or alpha changes while idle, snap straight to the newly converged
  // student rather than reusing an old step index against a different training run.
  useEffect(() => {
    if (!playingRef.current) {
      stepRef.current = TRAIN_STEPS - 1;
      setAnimStep(TRAIN_STEPS - 1);
    }
  }, [temperature, alpha]);

  // Resume the playback loop if it scrolls back into view mid-play.
  useEffect(() => {
    if (isVisible && playingRef.current && !trainRafRef.current) startTrainingLoop();
  }, [isVisible]);

  // Cleanup on unmount.
  useEffect(() => () => {
    playingRef.current = false;
    if (trainRafRef.current) cancelAnimationFrame(trainRafRef.current);
  }, []);

  function startTrainingLoop() {
    if (trainRafRef.current) cancelAnimationFrame(trainRafRef.current);
    playingRef.current = true;
    function frame() {
      if (!playingRef.current) return;
      const next = Math.min(stepRef.current + 1, TRAIN_STEPS - 1);
      stepRef.current = next;
      setAnimStep(next);
      if (next < TRAIN_STEPS - 1 && isVisibleRef.current) {
        trainRafRef.current = requestAnimationFrame(frame);
      } else if (next < TRAIN_STEPS - 1) {
        trainRafRef.current = null; // off-screen: the visibility effect resumes this
      } else {
        playingRef.current = false;
        setIsPlaying(false);
      }
    }
    trainRafRef.current = requestAnimationFrame(frame);
  }

  function handleAnimate() {
    if (prefersReducedMotion) return; // reduced motion: no continuous auto-play
    if (playingRef.current) {
      playingRef.current = false;
      if (trainRafRef.current) cancelAnimationFrame(trainRafRef.current);
      setIsPlaying(false);
    } else {
      stepRef.current = 0;
      setAnimStep(0);
      setIsPlaying(true);
      startTrainingLoop();
    }
  }

  function handleResetStudent() {
    playingRef.current = false;
    if (trainRafRef.current) cancelAnimationFrame(trainRafRef.current);
    stepRef.current = TRAIN_STEPS - 1;
    setIsPlaying(false);
    setAnimStep(TRAIN_STEPS - 1);
  }

  const current   = trajectory[animStep];
  // KL divergence is mathematically never negative; klDiv can return a tiny
  // negative value (e.g. -1e-9) from floating-point cancellation once the
  // student has converged onto the teacher's distribution (reachable via the
  // T=10 preset with alpha dragged to 0, as tryThis invites). Clamp the
  // *displayed* value only — totalLoss below is left untouched since it's
  // computed from the real (unclamped) kl inside trainStudentTrajectory.
  const kl        = Math.max(current.kl, 0);
  const totalLoss = current.totalLoss;

  const PRESETS = [
    { label: 'T=1', val: 1.0 },
    { label: 'T=4 (dark knowledge)', val: 4.0 },
    { label: 'T=10 (uniform)', val: 10.0 },
  ];

  return (
    <WidgetCard ref={cardRef} title="Knowledge Distillation — temperature and soft targets" number="5.4" tryThis={tryThis}>

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
          <StudentVsTeacherChart teacherProbs={displayProbs} studentProbs={current.studentT} />
        </div>
        <StatsPanel
          probs={targetProbs}
          kl={kl}
          totalLoss={totalLoss}
          temperature={temperature}
          step={animStep}
          totalSteps={TRAIN_STEPS}
        />
      </div>

      {/* Training status */}
      <div style={{
        marginTop: '12px', textAlign: 'center',
        fontFamily: MONO, fontSize: '11px', color: C.accent,
      }}>
        Student training step {animStep + 1} / {TRAIN_STEPS}&nbsp;·&nbsp;
        KL(teacher ‖ student) = {kl.toFixed(3)} nats
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

        {/* Train the student */}
        <div style={{ display: 'flex', gap: '8px', paddingLeft: '160px' }}>
          <button
            onClick={handleAnimate}
            disabled={prefersReducedMotion}
            title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
            style={{
              ...trainBtnStyle(true),
              cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
              opacity: prefersReducedMotion ? 0.5 : 1,
            }}
          >
            {isPlaying ? 'Pause' : 'Train student'}
          </button>
          <button onClick={handleResetStudent} style={trainBtnStyle(false)}>
            Reset student
          </button>
        </div>

      </div>
    </WidgetCard>
  );
}
