import { useRef, useState, useEffect, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent: '#2dd4bf',
  red:    '#f87171',
  orange: '#fb923c',
  green:  '#34d399',
  muted:  '#555555',
  mid:    '#888888',
  codeBg: '#0a0a0a',
  border: '#242424',
  bg2:    '#111111',
  bg4:    '#1e1e1e',
};

const SCHEMES = [
  { key: 'zero',   color: '#555555', lineWidth: 1.5, dash: [4, 3], label: 'Zero' },
  { key: 'large',  color: '#f87171', lineWidth: 1.8, dash: [],     label: 'Too large' },
  { key: 'xavier', color: '#fb923c', lineWidth: 2.0, dash: [],     label: 'Xavier' },
  { key: 'he',     color: '#2dd4bf', lineWidth: 2.5, dash: [],     label: 'He' },
];

const LOG_MIN = -8;
const LOG_MAX = 8;
const N_LAYERS = 10;
const CANVAS_H = 260;
const STATS_W = 180;

function computeVariances(n, activationFactor) {
  const varW = {
    zero:   0.0,
    large:  1.0,
    xavier: 2.0 / (n + n),
    he:     2.0 / n,
  };

  const result = { zero: [1], large: [1], xavier: [1], he: [1] };

  for (let l = 1; l <= N_LAYERS; l++) {
    result.zero.push(0);
    for (const key of ['large', 'xavier', 'he']) {
      result[key].push(result[key][l - 1] * n * varW[key] * activationFactor);
    }
  }

  return result;
}

function drawChart(ctx, dpr, { variances, showHealthyZone, canvasW }) {
  const PAD = { top: 20, right: 64, bottom: 34, left: 52 };
  const plotW = canvasW - PAD.left - PAD.right;
  const plotH = CANVAS_H - PAD.top - PAD.bottom;

  ctx.clearRect(0, 0, canvasW * dpr, CANVAS_H * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = C.codeBg;
  ctx.fillRect(0, 0, canvasW, CANVAS_H);

  const layerToX = l => PAD.left + (l / N_LAYERS) * plotW;

  const varToY = v => {
    if (v <= 0) return PAD.top + plotH;
    const logV = Math.log10(v);
    const clamped = Math.max(LOG_MIN, Math.min(LOG_MAX, logV));
    return PAD.top + plotH - (clamped - LOG_MIN) / (LOG_MAX - LOG_MIN) * plotH;
  };

  // Healthy zone band
  if (showHealthyZone) {
    const y1 = varToY(10);
    const y2 = varToY(0.1);
    ctx.fillStyle = 'rgba(45, 212, 191, 0.06)';
    ctx.fillRect(PAD.left, y1, plotW, y2 - y1);
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.fillStyle = 'rgba(45, 212, 191, 0.32)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('stable zone', PAD.left + plotW - 4, (y1 + y2) / 2);
  }

  // Horizontal grid at each power of 10
  for (let exp = LOG_MIN; exp <= LOG_MAX; exp++) {
    const y = varToY(Math.pow(10, exp));
    ctx.strokeStyle = exp === 0 ? '#282828' : '#171717';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + plotW, y);
    ctx.stroke();
  }

  // Vertical grid at each layer
  for (let l = 0; l <= N_LAYERS; l++) {
    const x = layerToX(l);
    ctx.strokeStyle = '#171717';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, PAD.top);
    ctx.lineTo(x, PAD.top + plotH);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#2e2e2e';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
  ctx.stroke();

  // Y-axis labels
  const Y_LABELS = [
    { exp: -8, text: '1e-8' }, { exp: -6, text: '1e-6' }, { exp: -4, text: '1e-4' },
    { exp: -2, text: '1e-2' }, { exp:  0, text: '1'    }, { exp:  2, text: '1e2'  },
    { exp:  4, text: '1e4'  }, { exp:  6, text: '1e6'  }, { exp:  8, text: '1e8'  },
  ];
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const { exp, text } of Y_LABELS) {
    ctx.fillText(text, PAD.left - 5, varToY(Math.pow(10, exp)));
  }

  // X-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let l = 0; l <= N_LAYERS; l++) {
    ctx.fillText(l, layerToX(l), PAD.top + plotH + 5);
  }

  // X/Y axis titles
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('layer', PAD.left + plotW / 2, CANVAS_H - 1);

  ctx.save();
  ctx.translate(10, PAD.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'middle';
  ctx.fillText('activation variance', 0, 0);
  ctx.restore();

  // Lines — clipped to plot area
  ctx.save();
  ctx.beginPath();
  ctx.rect(PAD.left, PAD.top, plotW, plotH);
  ctx.clip();

  for (const scheme of SCHEMES) {
    const vals = variances[scheme.key];
    ctx.strokeStyle = scheme.color;
    ctx.lineWidth = scheme.lineWidth;
    ctx.setLineDash(scheme.dash);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    for (let l = 0; l <= N_LAYERS; l++) {
      const x = layerToX(l);
      const y = varToY(vals[l]);
      if (l === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();

  // End-of-line labels at layer=10
  for (const scheme of SCHEMES) {
    const lastVal = variances[scheme.key][N_LAYERS];
    let logV = lastVal <= 0 ? LOG_MIN : Math.log10(lastVal);
    const clamped = Math.max(LOG_MIN, Math.min(LOG_MAX, logV));
    const labelX = layerToX(N_LAYERS) + 5;
    const rawY = PAD.top + plotH - (clamped - LOG_MIN) / (LOG_MAX - LOG_MIN) * plotH;
    const labelY = Math.max(PAD.top + 6, Math.min(PAD.top + plotH - 6, rawY));

    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = scheme.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(scheme.label, labelX, labelY);
  }

  // Warning arrows for out-of-range values
  for (const scheme of SCHEMES) {
    if (scheme.key === 'zero') continue;
    const vals = variances[scheme.key];
    for (let l = 1; l <= N_LAYERS; l++) {
      const v = vals[l];
      const arrowX = layerToX(l);
      if (v > Math.pow(10, LOG_MAX)) {
        ctx.fillStyle = scheme.color;
        ctx.beginPath();
        ctx.moveTo(arrowX,     PAD.top + 8);
        ctx.lineTo(arrowX - 5, PAD.top + 16);
        ctx.lineTo(arrowX + 5, PAD.top + 16);
        ctx.closePath();
        ctx.fill();
        break;
      } else if (v > 0 && v < Math.pow(10, LOG_MIN)) {
        ctx.fillStyle = scheme.color;
        ctx.beginPath();
        ctx.moveTo(arrowX,     PAD.top + plotH - 8);
        ctx.lineTo(arrowX - 5, PAD.top + plotH - 16);
        ctx.lineTo(arrowX + 5, PAD.top + plotH - 16);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }
  }

  ctx.restore(); // matches outer ctx.save() + ctx.scale(dpr, dpr)
}

function formatVar(v) {
  if (v === 0) return '0.000';
  const exp = Math.floor(Math.log10(Math.abs(v)));
  if (exp >= 4 || exp <= -3) return v.toExponential(2);
  if (exp >= 2) return v.toFixed(0);
  if (exp >= 0) return v.toFixed(2);
  return v.toFixed(3);
}

export default function InitializationExplorer({ tryThis }) {
  const canvasContainerRef = useRef(null);
  const canvasRef          = useRef(null);
  const dprRef             = useRef(window.devicePixelRatio || 1);

  const [activation,      setActivation]      = useState('relu');
  const [n,               setN]               = useState(256);
  const [showHealthyZone, setShowHealthyZone] = useState(true);
  const [canvasW,         setCanvasW]         = useState(420);

  useEffect(() => {
    const measure = () => {
      if (canvasContainerRef.current) {
        const w = Math.floor(canvasContainerRef.current.getBoundingClientRect().width);
        if (w > 60) setCanvasW(w);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // ReLU: 0.5 models the nonlinearity zeroing out ~half the units, so
  // He's 2/n compensating factor nets to exactly 1 (preserves variance) --
  // the real derivation behind He init. tanh: 1.0 models the small-signal
  // linear regime tanh'(0)=1 that Xavier's own derivation assumes, so
  // Xavier's 1/n nets to exactly 1 too -- matching the page's "Xavier
  // preserves variance for tanh" claim instead of visibly decaying it.
  const activationFactor = activation === 'relu' ? 0.5 : 1.0;

  const variances = useMemo(
    () => computeVariances(n, activationFactor),
    [n, activationFactor]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width        = canvasW * dpr;
    canvas.height       = CANVAS_H * dpr;
    canvas.style.width  = canvasW + 'px';
    canvas.style.height = CANVAS_H + 'px';
  }, [canvasW]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawChart(ctx, dprRef.current, { variances, showHealthyZone, canvasW });
  }, [variances, showHealthyZone, canvasW]);

  const finalVars = {
    zero:   variances.zero[N_LAYERS],
    large:  variances.large[N_LAYERS],
    xavier: variances.xavier[N_LAYERS],
    he:     variances.he[N_LAYERS],
  };

  const isHealthy  = v => v >= 0.1 && v <= 10;
  const isExploded = v => v > 1e4;

  const recommendation = activation === 'relu'
    ? 'Use He initialization'
    : 'Use Xavier initialization';

  const statRows = [
    { key: 'zero',   label: 'Zero',      lineColor: '#555555' },
    { key: 'large',  label: 'Too large', lineColor: C.red    },
    { key: 'xavier', label: 'Xavier',    lineColor: C.orange },
    { key: 'he',     label: 'He',        lineColor: C.accent },
  ];

  return (
    <WidgetCard title="Initialization — activation variance through 10 layers" number="5.3" tryThis={tryThis}>
      {/* Canvas + Stats side by side */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Canvas fills remaining width */}
        <div ref={canvasContainerRef} style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              background: C.codeBg,
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Stats panel */}
        <div style={{
          width: STATS_W + 'px',
          flexShrink: 0,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.muted,
          }}>
            Var at layer 10
          </div>

          {statRows.map(({ key, label, lineColor }) => {
            const v = finalVars[key];
            let valColor;
            if (key === 'zero')         valColor = C.muted;
            else if (isExploded(v))     valColor = C.red;
            else if (isHealthy(v))      valColor = C.green;
            else                        valColor = C.mid;

            return (
              <div key={key}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  color: lineColor,
                  marginBottom: '2px',
                }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  lineHeight: 1,
                  color: valColor,
                }}>
                  {formatVar(v)}
                </div>
              </div>
            );
          })}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: C.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '6px',
            }}>
              Recommended
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--accent)',
              lineHeight: 1.4,
            }}>
              {recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        {/* Activation tabs */}
        <div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '7px' }}>
            {[{ key: 'relu', label: 'ReLU' }, { key: 'tanh', label: 'Tanh' }].map(({ key, label }) => {
              const active = activation === key;
              return (
                <button
                  key={key}
                  onClick={() => setActivation(key)}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '4px',
                    padding: '5px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: C.muted,
          }}>
            He is designed for ReLU. Xavier is designed for Tanh.
          </div>
        </div>

        {/* n slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}>
            n = {n} neurons/layer
          </span>
          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={n}
            onChange={e => setN(Number(e.target.value))}
            style={{ width: '140px' }}
          />
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: C.muted,
          lineHeight: 1.5,
        }}>
          Notice the Xavier and He curves don't move as you drag n — that's the point
          of 1/n and 2/n scaling: only badly-scaled (fixed-variance) init depends on
          layer width.
        </div>

        {/* Healthy zone toggle */}
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
            checked={showHealthyZone}
            onChange={e => setShowHealthyZone(e.target.checked)}
            style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          Show healthy zone
        </label>
      </div>
    </WidgetCard>
  );
}
