import { useRef, useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';
import { useIsVisible } from '../../../hooks/useIsVisible';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

const CANVAS_H = 240;
const STATS_W  = 180;
const TOTAL    = 200;
const Y_MAX    = 20;

const C = {
  accent: '#2dd4bf',
  red:    '#f87171',
  math:   '#fbbf24',
  muted:  '#555555',
  mid:    '#888888',
  codeBg: '#0a0a0a',
  border: '#242424',
};

function makeLCG(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const RAW_NORMS = (() => {
  const rand = makeLCG(42);
  const spikes = {
    38: 5.0, 39: 12.0, 40: 18.0, 41: 8.0,  42: 3.5, 43: 1.2,
    118: 4.0, 119: 8.5, 120: 12.0, 121: 5.0, 122: 2.0,
  };
  return Array.from({ length: TOTAL }, (_, t) => {
    const u1 = rand();
    const u2 = rand();
    const g  = Math.sqrt(-2 * Math.log(u1 + 1e-12)) * Math.cos(2 * Math.PI * u2);
    return spikes[t] !== undefined
      ? spikes[t]
      : Math.max(0.01, 0.3 + 1.7 * Math.exp(-t / 60) + g * 0.06);
  });
})();

function drawCanvas(canvas, { dpr, canvasW, threshold, showUnclipped, drawUpTo, showIndicator }) {
  const ctx = canvas.getContext('2d');
  const PAD = { top: 22, right: 58, bottom: 38, left: 50 };
  const pw = canvasW - PAD.left - PAD.right;
  const ph = CANVAS_H - PAD.top  - PAD.bottom;

  ctx.clearRect(0, 0, canvasW * dpr, CANVAS_H * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, canvasW, CANVAS_H);

  const sx = t => PAD.left + (t / TOTAL) * pw;
  const ny = v => PAD.top + ph * (1 - Math.max(0, Math.min(1, v / Y_MAX)));

  // Spike highlight bands
  ctx.fillStyle = 'rgba(251,191,36,0.07)';
  for (const [a, b] of [[37, 44], [117, 123]]) {
    ctx.fillRect(sx(a), PAD.top, sx(b) - sx(a), ph);
  }

  // Shaded region above threshold
  const ty = ny(threshold);
  ctx.fillStyle = 'rgba(248,113,113,0.07)';
  ctx.fillRect(PAD.left, PAD.top, pw, Math.max(0, ty - PAD.top));

  // Grid lines
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);
  for (const v of [5, 10, 15, 20]) {
    ctx.beginPath();
    ctx.moveTo(PAD.left, ny(v));
    ctx.lineTo(PAD.left + pw, ny(v));
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#2e2e2e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + ph);
  ctx.lineTo(PAD.left + pw, PAD.top + ph);
  ctx.stroke();

  // Y tick labels
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const v of [0, 5, 10, 15, 20]) {
    ctx.fillText(v, PAD.left - 5, ny(v));
  }

  // Y-axis title
  ctx.save();
  ctx.translate(11, PAD.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Gradient norm ‖g‖', 0, 0);
  ctx.restore();

  // X tick labels + title
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const v of [0, 50, 100, 150, 200]) {
    ctx.fillText(v, sx(v), PAD.top + ph + 5);
  }
  ctx.fillText('Training step', PAD.left + pw / 2, PAD.top + ph + 22);

  // Spike labels
  ctx.fillStyle = C.math;
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('gradient spike', (sx(37) + sx(44)) / 2, PAD.top + 3);
  ctx.fillText('gradient spike', (sx(117) + sx(123)) / 2, PAD.top + 3);

  // Clip trajectory lines to plot area
  ctx.save();
  ctx.beginPath();
  ctx.rect(PAD.left, PAD.top, pw, ph);
  ctx.clip();

  if (showUnclipped) {
    ctx.strokeStyle = 'rgba(248,113,113,0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let t = 0; t <= drawUpTo; t++) {
      const x = sx(t), y = ny(RAW_NORMS[t]);
      t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2.0;
  ctx.setLineDash([]);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let t = 0; t <= drawUpTo; t++) {
    const x = sx(t), y = ny(Math.min(RAW_NORMS[t], threshold));
    t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (showIndicator && drawUpTo < TOTAL - 1) {
    const ix = sx(drawUpTo);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(ix, PAD.top);
    ctx.lineTo(ix, PAD.top + ph);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  ctx.restore(); // end clip

  // Clip threshold line (drawn outside clip so it spans full plot)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(PAD.left, ty);
  ctx.lineTo(PAD.left + pw, ty);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`clip = ${threshold.toFixed(1)}`, PAD.left + pw - 2, ty - 2);

  ctx.restore();
}

function StatRow({ label, value, color }) {
  return (
    <div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        color: C.muted,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '2px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '14px',
        color,
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

function btnStyle(primary) {
  return {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: primary ? 600 : 400,
    color: primary ? 'var(--accent)' : 'var(--text-muted)',
    background: primary ? 'var(--accent-dim)' : 'transparent',
    border: `1px solid ${primary ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: '4px',
    padding: '6px 16px',
    cursor: 'pointer',
  };
}

export default function GradientClipping() {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const animRef      = useRef(null);
  const playingRef   = useRef(false);
  const stepRef      = useRef(0);

  // Pause the continuous play loop when scrolled off-screen; never auto-run for reduced motion.
  const [cardRef, isVisible]   = useIsVisible();
  const prefersReducedMotion   = usePrefersReducedMotion();
  const isVisibleRef           = useRef(true);
  isVisibleRef.current = isVisible;

  const [canvasW,       setCanvasW]       = useState(460);
  const [threshold,     setThreshold]     = useState(1.0);
  const [showUnclipped, setShowUnclipped] = useState(true);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [animStep,      setAnimStep]      = useState(TOTAL - 1);
  const [animMode,      setAnimMode]      = useState(false);

  // ── Resume the loop if it scrolls back into view mid-play ─────
  useEffect(() => {
    if (isVisible && playingRef.current && !animRef.current) {
      startLoop();
    }
  }, [isVisible]);

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = Math.floor(containerRef.current.getBoundingClientRect().width);
        if (w > 80) setCanvasW(w);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Resize canvas backing store when width changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width        = canvasW * dpr;
    canvas.height       = CANVAS_H * dpr;
    canvas.style.width  = `${canvasW}px`;
    canvas.style.height = `${CANVAS_H}px`;
  }, [canvasW]);

  // Redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    drawCanvas(canvas, {
      dpr,
      canvasW,
      threshold,
      showUnclipped,
      drawUpTo:      animMode ? animStep : TOTAL - 1,
      showIndicator: isPlaying,
    });
  }, [canvasW, threshold, showUnclipped, animStep, isPlaying, animMode]);

  // Cleanup on unmount
  useEffect(() => () => {
    playingRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  function startLoop() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    playingRef.current = true;
    function frame() {
      if (!playingRef.current) return;
      const next = Math.min(stepRef.current + 2, TOTAL - 1);
      stepRef.current = next;
      setAnimStep(next);
      if (next < TOTAL - 1 && isVisibleRef.current) {
        animRef.current = requestAnimationFrame(frame);
      } else if (next < TOTAL - 1) {
        animRef.current = null; // off-screen: the visibility effect resumes this when it scrolls back in
      } else {
        playingRef.current = false;
        setIsPlaying(false);
      }
    }
    animRef.current = requestAnimationFrame(frame);
  }

  function handleAnimate() {
    if (prefersReducedMotion) return; // reduced motion: no continuous auto-play
    if (playingRef.current) {
      playingRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setIsPlaying(false);
    } else {
      stepRef.current = 0;
      setAnimStep(0);
      setAnimMode(true);
      setIsPlaying(true);
      startLoop();
    }
  }

  function handleReset() {
    playingRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    stepRef.current = TOTAL - 1;
    setIsPlaying(false);
    setAnimMode(false);
    setAnimStep(TOTAL - 1);
  }

  // Stats
  const stepsClipped  = RAW_NORMS.filter(v => v > threshold).length;
  const clippingRate  = ((stepsClipped / TOTAL) * 100).toFixed(1);
  const currentStep   = animMode ? animStep : TOTAL - 1;
  const rawNow        = RAW_NORMS[currentStep];
  const clippedNow    = Math.min(rawNow, threshold);
  const clippingActive = rawNow > threshold;

  return (
    <WidgetCard ref={cardRef} title="Gradient Clipping — taming gradient explosions" number="4.6">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Canvas */}
        <div ref={containerRef} style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', background: C.codeBg, borderRadius: '4px' }}
          />
        </div>

        {/* Stats panel */}
        <div style={{
          width: `${STATS_W}px`,
          flexShrink: 0,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <StatRow label="Max unclipped" value="18.0"              color={C.red}    />
          <StatRow label="Max clipped"   value={threshold.toFixed(1)} color={C.accent} />
          <StatRow label="Threshold"     value={threshold.toFixed(1)} color={C.mid}    />
          <StatRow label="Steps clipped" value={stepsClipped}      color={C.mid}    />
          <StatRow label="Clipping rate" value={`${clippingRate}%`}  color={C.mid}    />

          {animMode && (
            <>
              <div style={{ borderTop: '1px solid var(--border)' }} />
              <StatRow label="Current step" value={currentStep}         color={C.mid} />
              <StatRow
                label="Raw norm now"
                value={rawNow.toFixed(2)}
                color={rawNow > threshold ? C.red : C.mid}
              />
              <StatRow label="Clipped now" value={clippedNow.toFixed(2)} color={C.accent} />
              <div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '2px',
                }}>
                  Clipping active
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  color: clippingActive ? C.red : C.muted,
                  lineHeight: 1,
                }}>
                  {clippingActive ? 'YES' : 'no'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}>
            Clip threshold = {threshold.toFixed(1)}
          </span>
          <input
            type="range"
            min="0.5" max="10.0" step="0.1"
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            style={{ flex: 1, maxWidth: '200px' }}
          />
        </div>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: 'var(--text-muted)',
          userSelect: 'none',
        }}>
          <input
            type="checkbox"
            checked={showUnclipped}
            onChange={e => setShowUnclipped(e.target.checked)}
            style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          Show unclipped
        </label>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAnimate}
            disabled={prefersReducedMotion}
            title={prefersReducedMotion ? 'Disabled — your system prefers reduced motion' : undefined}
            style={{
              ...btnStyle(true),
              cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
              opacity: prefersReducedMotion ? 0.5 : 1,
            }}
          >
            {isPlaying ? 'Pause' : 'Animate'}
          </button>
          <button onClick={handleReset} style={btnStyle(false)}>
            Reset
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}
