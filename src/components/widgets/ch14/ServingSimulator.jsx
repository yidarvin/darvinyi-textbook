import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

// ── Palette (shared house convention) ───────────────────────────────────────────
const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  blue:      '#60a5fa',
  pink:      '#f472b6',
  cyan:      '#22d3ee',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  textMid:   '#888888',
  text:      '#e8eaed',
  codeBg:    '#0a0a0a',
};
const mono  = "'JetBrains Mono', monospace";
const inter = "'Inter', sans-serif";

const REQUEST_COLORS = [
  C.accent, C.orange, C.purple, C.math, C.green,
  C.blue, C.pink, C.red, C.cyan,
];

function rgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Seeded PRNG (mulberry32 — same convention as ch20/ForwardDiffusion.jsx) ────
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Simulation parameters ────────────────────────────────────────────────────────
const BATCH_SIZE = 4;   // concurrent sequence slots the toy GPU can hold
const N_REQ      = 9;   // requests in one scenario
const SAFETY     = 600; // hard cap on simulated ticks, well above any realistic run

// ── Request stream generator ─────────────────────────────────────────────────────
// Illustrative, not fit to any real trace: arrivals follow a Poisson-like process
// (exponential inter-arrival gaps), prompt/generation lengths are drawn uniformly
// from plausible ranges. One tick == one autoregressive decode step (Chapter 11:
// with a KV cache, each decode step costs the same O(1) work regardless of
// position). Prefill — the parallel forward pass over the prompt — is approximated
// as round(promptLen / 220) ticks of occupied-but-useful compute, since prefill
// keeps the GPU genuinely busy even though it is not emitting a token per tick.
function generateRequestStream(seed, n) {
  const rng = mulberry32(seed);
  const reqs = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    const gap = 1 + Math.floor(-Math.log(1 - rng()) * 2.2);
    t += gap;
    const promptLen    = 60 + Math.floor(rng() * 560); // 60-620 tokens
    const genLen       = 6 + Math.floor(rng() * 26);   // 6-31 tokens
    const prefillTicks = Math.max(1, Math.round(promptLen / 220));
    reqs.push({
      id: i,
      arrival: t,
      promptLen,
      genLen,
      prefillTicks,
      serviceTicks: prefillTicks + genLen,
    });
  }
  return reqs;
}

// ── Static batching simulation ───────────────────────────────────────────────────
// A batch of up to BATCH_SIZE requests is formed once the *previous* batch has
// fully cleared (every member finished). Requests that finish early keep their
// slot — held idle, doing no useful work — until the slowest member of the same
// batch finishes and the whole batch clears together. This is the textbook
// wastefulness static batching is criticized for.
function simulateStatic(requests, batchSize) {
  const pending = requests.slice().sort((a, b) => a.arrival - b.arrival);
  let idx = 0;
  let batch = []; // { req, remaining, done }
  const timeline = [];
  const completionTick = {};
  const admissionTick  = {};
  let tick = 0;
  while (tick < SAFETY) {
    const batchCleared = batch.length === 0 || batch.every(s => s.done);
    if (batchCleared) {
      batch = [];
      while (batch.length < batchSize && idx < pending.length && pending[idx].arrival <= tick) {
        batch.push({ req: pending[idx], remaining: pending[idx].serviceTicks, done: false });
        admissionTick[pending[idx].id] = tick;
        idx++;
      }
    }
    if (batch.length === 0 && idx >= pending.length) break;

    const slots = Array.from({ length: batchSize }, (_, s) => {
      if (s >= batch.length) return { reqId: null, useful: false };
      const slot = batch[s];
      return slot.done
        ? { reqId: slot.req.id, useful: false } // padding: slot held, no work done
        : { reqId: slot.req.id, useful: true };
    });

    batch.forEach(slot => {
      if (!slot.done) {
        slot.remaining -= 1;
        if (slot.remaining <= 0) {
          slot.done = true;
          completionTick[slot.req.id] = tick + 1;
        }
      }
    });

    timeline.push(slots);
    tick++;
  }
  return { timeline, completionTick, admissionTick, totalTicks: timeline.length };
}

// ── Continuous (dynamic) batching simulation ─────────────────────────────────────
// The moment a slot frees up, the next arrived-and-waiting request is admitted
// into it — no waiting for batch-mates to finish. This is the iteration-level
// scheduling behind Orca-style continuous batching and the slot bookkeeping
// PagedAttention's page table makes cheap to do at scale.
function simulateContinuous(requests, batchSize) {
  const pending = requests.slice().sort((a, b) => a.arrival - b.arrival);
  let idx = 0;
  const slots = new Array(batchSize).fill(null); // { req, remaining }
  const timeline = [];
  const completionTick = {};
  const admissionTick  = {};
  let tick = 0;
  while (tick < SAFETY) {
    for (let s = 0; s < batchSize; s++) {
      if (slots[s] === null && idx < pending.length && pending[idx].arrival <= tick) {
        slots[s] = { req: pending[idx], remaining: pending[idx].serviceTicks };
        admissionTick[pending[idx].id] = tick;
        idx++;
      }
    }
    if (slots.every(s => s === null) && idx >= pending.length) break;

    const rec = slots.map(s => (s ? { reqId: s.req.id, useful: true } : { reqId: null, useful: false }));

    for (let s = 0; s < batchSize; s++) {
      if (slots[s]) {
        slots[s].remaining -= 1;
        if (slots[s].remaining <= 0) {
          completionTick[slots[s].req.id] = tick + 1;
          slots[s] = null; // freed — eligible for admission next tick
        }
      }
    }

    timeline.push(rec);
    tick++;
  }
  return { timeline, completionTick, admissionTick, totalTicks: timeline.length };
}

// ── Derived stats ─────────────────────────────────────────────────────────────────
function perTickUtil(timeline, batchSize) {
  return timeline.map(row => row.reduce((a, c) => a + (c.useful ? 1 : 0), 0) / batchSize);
}

function movingAverage(arr, window) {
  const out = new Array(arr.length);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= window) sum -= arr[i - window];
    const n = Math.min(i + 1, window);
    out[i] = sum / n;
  }
  return out;
}

function cumulativeUtil(timeline, batchSize, uptoTick) {
  const n = Math.min(uptoTick, timeline.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += timeline[i].reduce((a, c) => a + (c.useful ? 1 : 0), 0);
  return sum / (batchSize * n);
}

function completedCount(completionTick, uptoTick) {
  return Object.values(completionTick).filter(t => t <= uptoTick).length;
}

function avgWait(requests, admissionTick, uptoTick) {
  const waits = requests
    .filter(r => admissionTick[r.id] !== undefined && admissionTick[r.id] <= uptoTick)
    .map(r => admissionTick[r.id] - r.arrival);
  if (waits.length === 0) return 0;
  return waits.reduce((a, b) => a + b, 0) / waits.length;
}

// ── Canvas: Gantt-style slot occupancy ────────────────────────────────────────────
function drawGantt(canvas, timeline, batchSize, tick, maxTicks) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const { width: W, height: H } = canvas.getBoundingClientRect();
  if (W === 0 || H === 0) return;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.scale(dpr, dpr);

  const lp = 30, rp = 6, tp = 6, bp = 16;
  const cW   = W - lp - rp;
  const cH   = H - tp - bp;
  const colW = cW / maxTicks;
  const rowH = cH / batchSize;

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  const revealed = Math.min(tick, timeline.length);

  for (let row = 0; row < batchSize; row++) {
    for (let col = 0; col < maxTicks; col++) {
      const x = lp + col * colW;
      const y = tp + row * rowH;
      if (col >= revealed || col >= timeline.length) {
        ctx.fillStyle = C.bg3;
        ctx.fillRect(x + 0.5, y + 0.5, Math.max(colW - 1, 0.5), rowH - 1);
        continue;
      }
      const cell = timeline[col][row];
      if (cell.reqId === null) {
        ctx.fillStyle = C.bg4;
        ctx.fillRect(x + 0.5, y + 0.5, Math.max(colW - 1, 0.5), rowH - 1);
      } else if (cell.useful) {
        ctx.fillStyle = REQUEST_COLORS[cell.reqId % REQUEST_COLORS.length];
        ctx.fillRect(x + 0.5, y + 0.5, Math.max(colW - 1, 0.5), rowH - 1);
      } else {
        // padding / waste: slot held by an already-finished request
        ctx.fillStyle = rgba(C.red, 0.3);
        ctx.fillRect(x + 0.5, y + 0.5, Math.max(colW - 1, 0.5), rowH - 1);
      }
    }
  }

  // Row labels
  ctx.font = `9px ${mono}`;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let row = 0; row < batchSize; row++) {
    ctx.fillText(`S${row}`, lp - 5, tp + row * rowH + rowH / 2);
  }

  // Playhead
  if (revealed > 0 && revealed <= maxTicks) {
    const x = lp + revealed * colW;
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, tp);
    ctx.lineTo(x, tp + cH);
    ctx.stroke();
  }

  // Axis ticks
  ctx.font = `7px ${mono}`;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const step = Math.max(10, Math.round(maxTicks / 8 / 10) * 10);
  for (let v = 0; v <= maxTicks; v += step) {
    ctx.fillText(String(v), lp + v * colW, tp + cH + 12);
  }
}

// ── Canvas: utilization-over-time comparison chart ────────────────────────────────
function drawUtilChart(canvas, staticAvg, contAvg, tick, maxTicks) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const { width: W, height: H } = canvas.getBoundingClientRect();
  if (W === 0 || H === 0) return;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.scale(dpr, dpr);

  const lp = 32, rp = 8, tp = 8, bp = 16;
  const cW = W - lp - rp;
  const cH = H - tp - bp;

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1].forEach(f => {
    const y = tp + (1 - f) * cH;
    ctx.beginPath(); ctx.moveTo(lp, y); ctx.lineTo(lp + cW, y); ctx.stroke();
  });

  const revealed = Math.min(tick, maxTicks);

  function drawLine(arr, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const n = Math.min(revealed, arr.length);
    for (let i = 0; i < n; i++) {
      const x = lp + (i / maxTicks) * cW;
      const y = tp + cH - arr[i] * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  drawLine(staticAvg, C.red);
  drawLine(contAvg, C.accent);

  // Playhead
  if (revealed > 0) {
    const x = lp + (revealed / maxTicks) * cW;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x, tp); ctx.lineTo(x, tp + cH); ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.font = `7px ${mono}`;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [0, 0.5, 1].forEach(f => {
    ctx.fillText(`${Math.round(f * 100)}%`, lp - 4, tp + (1 - f) * cH);
  });

  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.red;
  ctx.fillText('Static', lp + cW, tp + 9);
  ctx.fillStyle = C.accent;
  ctx.fillText('Continuous', lp + cW, tp + 18);
}

// ── Small UI helpers ───────────────────────────────────────────────────────────
function Btn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: mono, fontSize: '10px', padding: '5px 12px',
      background: active ? C.accentDim : C.bg4,
      border: `1px solid ${active ? C.accent : (disabled ? C.border : C.borderLt)}`,
      borderRadius: '4px',
      color: disabled ? C.muted : (active ? C.accent : C.textMid),
      cursor: disabled ? 'not-allowed' : 'pointer',
      flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────────
export default function ServingSimulator({ tryThis }) {
  const [cardRef, isVisible] = useIsVisible();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisibleRef = useRef(true);
  isVisibleRef.current = isVisible;

  const [seed, setSeed]       = useState(42);
  const [mode, setMode]       = useState('static'); // 'static' | 'continuous'
  const [tick, setTick]       = useState(0);
  const [playing, setPlaying] = useState(false);

  const ganttRef = useRef(null);
  const chartRef = useRef(null);

  // Deterministic scenario + both simulations, recomputed only when the seed changes.
  const { requests, sim, maxTicks, staticSmooth, contSmooth } = useMemo(() => {
    const reqs = generateRequestStream(seed, N_REQ);
    const st = simulateStatic(reqs, BATCH_SIZE);
    const ct = simulateContinuous(reqs, BATCH_SIZE);
    const mt = Math.max(st.totalTicks, ct.totalTicks, 1);
    const stAvg = movingAverage(perTickUtil(st.timeline, BATCH_SIZE), 5);
    const ctAvg = movingAverage(perTickUtil(ct.timeline, BATCH_SIZE), 5);
    return { requests: reqs, sim: { static: st, continuous: ct }, maxTicks: mt, staticSmooth: stAvg, contSmooth: ctAvg };
  }, [seed]);

  // Reset playback whenever the scenario changes.
  useEffect(() => {
    setTick(0);
    setPlaying(false);
  }, [seed]);

  useEffect(() => {
    drawGantt(ganttRef.current, sim[mode].timeline, BATCH_SIZE, tick, maxTicks);
  }, [sim, mode, tick, maxTicks]);

  useEffect(() => {
    drawUtilChart(chartRef.current, staticSmooth, contSmooth, tick, maxTicks);
  }, [staticSmooth, contSmooth, tick, maxTicks]);

  // Autoplay
  useEffect(() => {
    if (!playing || !isVisibleRef.current) return;
    if (tick >= maxTicks) { setPlaying(false); return; }
    const timer = setTimeout(() => setTick(t => Math.min(t + 1, maxTicks)), 90);
    return () => clearTimeout(timer);
  }, [playing, tick, maxTicks, isVisible]);

  const handlePlay = () => {
    if (prefersReducedMotion) return;
    if (playing) { setPlaying(false); return; }
    if (tick >= maxTicks) setTick(0);
    setPlaying(true);
  };

  const handleStep = useCallback(() => {
    setPlaying(false);
    setTick(t => Math.min(t + 1, maxTicks));
  }, [maxTicks]);

  const handleReset = () => {
    setPlaying(false);
    setTick(0);
  };

  const handleReseed = () => {
    setPlaying(false);
    setSeed(s => s + 1);
  };

  const stStats = sim.static;
  const ctStats = sim.continuous;

  const stUtil = (cumulativeUtil(stStats.timeline, BATCH_SIZE, tick) * 100).toFixed(1);
  const ctUtil = (cumulativeUtil(ctStats.timeline, BATCH_SIZE, tick) * 100).toFixed(1);
  const stDone = completedCount(stStats.completionTick, tick);
  const ctDone = completedCount(ctStats.completionTick, tick);
  const stWait = avgWait(requests, stStats.admissionTick, tick).toFixed(1);
  const ctWait = avgWait(requests, ctStats.admissionTick, tick).toFixed(1);

  const utilGapPts = (Number(ctUtil) - Number(stUtil)).toFixed(1);
  const bothDone = tick >= maxTicks;

  return (
    <WidgetCard
      ref={cardRef}
      title="Serving Simulator — static vs continuous batching under load"
      number="14.3"
      tryThis={tryThis}
    >
      {/* Mode tabs + legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <span style={{ fontFamily: mono, fontSize: '10px', color: C.muted }}>Slot detail</span>
        <Btn onClick={() => setMode('static')} active={mode === 'static'}>Static batching</Btn>
        <Btn onClick={() => setMode('continuous')} active={mode === 'continuous'}>Continuous batching</Btn>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: mono, fontSize: '9px', color: C.muted }}>
          <span style={{ color: rgba(C.red, 0.9) }}>■</span> padding (finished, slot held)
          <span style={{ marginLeft: '10px', color: C.textMid }}>■</span> useful work
        </span>
      </div>

      {/* Gantt: slot occupancy for the selected mode */}
      <div style={{ fontFamily: inter, fontSize: '10px', color: C.textMid, marginBottom: '4px' }}>
        {BATCH_SIZE} GPU slots × {maxTicks} ticks — {mode === 'static' ? 'static' : 'continuous'} batching
        {' '}(finishes at tick {sim[mode].totalTicks})
      </div>
      <canvas ref={ganttRef}
        style={{ display: 'block', width: '100%', height: '110px', borderRadius: '4px' }} />

      {/* Utilization-over-time chart, both policies overlaid */}
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontFamily: inter, fontSize: '10px', color: C.muted, marginBottom: '4px' }}>
          GPU utilization over time (5-tick moving average) —{' '}
          <span style={{ color: C.red }}>static</span> vs{' '}
          <span style={{ color: C.accent }}>continuous</span>
        </div>
        <canvas ref={chartRef}
          style={{ display: 'block', width: '100%', height: '90px', borderRadius: '4px' }} />
      </div>

      {/* Comparison stat strip */}
      <div style={{
        marginTop: '12px', display: 'flex',
        background: C.bg3, border: `1px solid ${C.border}`,
        borderRadius: '6px', overflow: 'hidden',
      }}>
        <div style={{ flex: 1, padding: '11px 14px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.red, marginBottom: '5px' }}>
            Static batching
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid }}>
            Utilization: <span style={{ color: C.red, fontWeight: 700 }}>{stUtil}%</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid, marginTop: '2px' }}>
            Completed: <span style={{ color: C.red, fontWeight: 700 }}>{stDone}/{N_REQ}</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid, marginTop: '2px' }}>
            Avg admit wait: <span style={{ color: C.red, fontWeight: 700 }}>{stWait}</span> ticks
          </div>
        </div>
        <div style={{ flex: 1, padding: '11px 14px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.accent, marginBottom: '5px' }}>
            Continuous batching
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid }}>
            Utilization: <span style={{ color: C.accent, fontWeight: 700 }}>{ctUtil}%</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid, marginTop: '2px' }}>
            Completed: <span style={{ color: C.accent, fontWeight: 700 }}>{ctDone}/{N_REQ}</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: C.textMid, marginTop: '2px' }}>
            Avg admit wait: <span style={{ color: C.accent, fontWeight: 700 }}>{ctWait}</span> ticks
          </div>
        </div>
        <div style={{
          flexShrink: 0, width: '130px', padding: '11px 12px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase',
                        letterSpacing: '0.08em', marginBottom: '3px' }}>
            Util. gap
          </div>
          <div style={{
            fontFamily: mono, fontSize: '22px', fontWeight: 700, lineHeight: 1,
            color: Number(utilGapPts) >= 0 ? C.math : C.red,
          }}>
            {Number(utilGapPts) >= 0 ? '+' : ''}{utilGapPts}
          </div>
          <div style={{ fontFamily: mono, fontSize: '8px', color: C.muted, marginTop: '2px' }}>
            pts, continuous − static
          </div>
          {bothDone && (
            <div style={{ fontFamily: mono, fontSize: '9px', color: C.math, marginTop: '5px', textAlign: 'center' }}>
              {stStats.totalTicks - ctStats.totalTicks > 0
                ? `${stStats.totalTicks - ctStats.totalTicks} fewer ticks to finish all ${N_REQ}`
                : 'run complete'}
            </div>
          )}
        </div>
      </div>

      {/* Request stream legend */}
      <div style={{
        marginTop: '10px', padding: '9px 10px',
        background: C.bg4, border: `1px solid ${C.border}`, borderRadius: '6px',
      }}>
        <div style={{ fontFamily: inter, fontSize: '8.5px', color: C.muted, marginBottom: '6px',
                      textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Request stream (illustrative — seed {seed})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {requests.map(r => (
            <div key={r.id} title={`arrives t=${r.arrival}, prompt=${r.promptLen} tok, generates=${r.genLen} tok`}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 7px', borderRadius: '10px',
                background: rgba(REQUEST_COLORS[r.id % REQUEST_COLORS.length], 0.12),
                border: `1px solid ${rgba(REQUEST_COLORS[r.id % REQUEST_COLORS.length], 0.4)}`,
              }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: REQUEST_COLORS[r.id % REQUEST_COLORS.length], flexShrink: 0,
              }} />
              <span style={{ fontFamily: mono, fontSize: '8.5px', color: C.textMid }}>
                #{r.id} t={r.arrival} p{r.promptLen} g{r.genLen}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: mono, fontSize: '10px', color: C.muted, flexShrink: 0 }}>
            tick {tick}/{maxTicks}
          </span>
          <input
            type="range" min={0} max={maxTicks} step={1} value={tick}
            onChange={e => { setPlaying(false); setTick(Number(e.target.value)); }}
            style={{ flex: 1, minWidth: 80, accentColor: C.accent, cursor: 'pointer' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn
            onClick={handlePlay}
            disabled={prefersReducedMotion}
            active={playing}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </Btn>
          <Btn onClick={handleStep} disabled={tick >= maxTicks}>Step</Btn>
          <Btn onClick={handleReset}>↺ Reset</Btn>
          <div style={{ width: '1px', height: '20px', background: C.border, flexShrink: 0 }} />
          <Btn onClick={handleReseed}>↻ New scenario</Btn>
        </div>
      </div>
    </WidgetCard>
  );
}
