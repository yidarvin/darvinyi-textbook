import { useState, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO = "'JetBrains Mono', monospace";
const NODE_R = 14;

// ── Network topology ─────────────────────────────────────────────────────────
const LAYER_DEFS = [
  { label: 'Input',    x:  70, size: 4 },
  { label: 'Hidden 1', x: 190, size: 8 },
  { label: 'Hidden 2', x: 370, size: 8 },
  { label: 'Output',   x: 490, size: 2 },
];

function layerYs(n) {
  const top = 20, bot = 262;
  if (n === 1) return [(top + bot) / 2];
  // Output layer: center 2 nodes instead of spanning full height
  if (n === 2) return [top + (bot - top) * 0.32, top + (bot - top) * 0.68];
  return Array.from({ length: n }, (_, i) => top + (i / (n - 1)) * (bot - top));
}

// Precomputed once at module level
const LAYERS = LAYER_DEFS.map((d, i) => ({ ...d, idx: i, ys: layerYs(d.size) }));

const ALL_ACTIVE = Array(16).fill(false);

function randomMask(p) {
  return Array.from({ length: 16 }, () => Math.random() < p);
}

// Input and output layers never drop; hidden layers use mask[0..7] and mask[8..15]
function nodeActive(li, ni, mask) {
  if (li === 0 || li === 3) return true;
  return !mask[li === 1 ? ni : 8 + ni];
}

function computeEdges(mask) {
  const active = [], dropped = [];
  for (let li = 0; li < LAYERS.length - 1; li++) {
    const A = LAYERS[li], B = LAYERS[li + 1];
    for (let ai = 0; ai < A.size; ai++) {
      for (let bi = 0; bi < B.size; bi++) {
        const on = nodeActive(li, ai, mask) && nodeActive(li + 1, bi, mask);
        (on ? active : dropped).push({
          key: `${li}-${ai}-${bi}`,
          x1: A.x, y1: A.ys[ai], x2: B.x, y2: B.ys[bi],
        });
      }
    }
  }
  return { active, dropped };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatEntry({ label, value, color, children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontFamily: MONO, fontSize: '9px', color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: MONO, fontSize: '20px', lineHeight: 1,
        color: color || 'var(--accent)',
      }}>
        {children ?? value}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DropoutVisualizer({ tryThis }) {
  const [mask, setMask]                 = useState(() => randomMask(0.5));
  const [p, setP]                       = useState(0.5);
  const [inferenceMode, setInferenceMode] = useState(false);
  // Which inference-time convention the widget is illustrating:
  //  'classic'  — full activation during training, scaled by (1-p) at inference
  //               (the textbook description in Srivastava et al. 2014)
  //  'inverted' — surviving activations scaled by 1/(1-p) during training,
  //               no rescaling at inference (what PyTorch/TF actually implement)
  const [convention, setConvention] = useState('classic');

  // In inference mode, display all neurons active regardless of stored mask
  const displayMask = inferenceMode ? ALL_ACTIVE : mask;

  // The activation-scaling multiplier actually in effect for the phase being
  // displayed, derived from p and the selected convention (no hard-coded numbers).
  const scaleFactor = useMemo(() => {
    if (convention === 'classic') {
      return inferenceMode ? (1 - p) : 1;
    }
    return inferenceMode ? 1 : 1 / (1 - p);
  }, [convention, inferenceMode, p]);

  const applyDropout = () => {
    if (!inferenceMode) setMask(randomMask(p));
  };

  const reset = () => {
    setInferenceMode(false);
    setMask(ALL_ACTIVE);
  };

  const { active: activeEdges, dropped: droppedEdges } = useMemo(
    () => computeEdges(inferenceMode ? ALL_ACTIVE : mask),
    [mask, inferenceMode]
  );

  const droppedCount = displayMask.filter(Boolean).length;
  const activeCount  = 16 - droppedCount;
  const activePct    = Math.round((activeCount / 16) * 100);

  return (
    <WidgetCard title="Dropout — stochastic sub-network ensembling" number="5.2" tryThis={tryThis}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

        {/* ── SVG Network ────────────────────────────────────────────────── */}
        <div style={{
          flex: 1, minWidth: 0,
          background: '#0a0a0a',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <svg viewBox="0 0 560 300" style={{ display: 'block', width: '100%' }}>

            {/* Dropped edges (bottom layer) — very subtle */}
            {droppedEdges.map(e => (
              <line key={e.key}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke="#383838" strokeWidth={0.8} strokeOpacity={0.25}
              />
            ))}

            {/* Active edges — visible medium gray */}
            {activeEdges.map(e => (
              <line key={e.key}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke="#606060" strokeWidth={1} strokeOpacity={0.7}
              />
            ))}

            {/* Nodes — stable keys so CSS opacity transitions fire correctly */}
            {LAYERS.map(layer =>
              layer.ys.map((y, ni) => {
                const active = nodeActive(layer.idx, ni, displayMask);
                return (
                  <g
                    key={`${layer.idx}-${ni}`}
                    style={{ opacity: active ? 1 : 0.4, transition: 'opacity 300ms ease' }}
                  >
                    <circle
                      cx={layer.x} cy={y} r={NODE_R}
                      fill={active ? 'var(--accent)' : 'var(--code-bg)'}
                      stroke={active ? 'white' : 'var(--border)'}
                      strokeWidth={active ? 1.5 : 1}
                      strokeDasharray={active ? undefined : '3 3'}
                    />
                    {!active && (
                      <text
                        x={layer.x} y={y}
                        textAnchor="middle" dominantBaseline="middle"
                        fontFamily={MONO} fontSize="10"
                        fill="var(--text-muted)"
                      >
                        ×
                      </text>
                    )}
                  </g>
                );
              })
            )}

            {/* Layer labels */}
            {LAYERS.map(layer => (
              <text
                key={layer.label}
                x={layer.x} y={290}
                textAnchor="middle"
                fontFamily="'Inter', sans-serif" fontSize="11"
                fill="#555555"
              >
                {layer.label}
              </text>
            ))}
          </svg>
        </div>

        {/* ── Stats Panel ────────────────────────────────────────────────── */}
        <div style={{
          width: '170px', flexShrink: 0,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px 16px',
        }}>
          <StatEntry label="Active neurons" value={`${activeCount} / 16`} />
          <StatEntry
            label="Dropped neurons" value={droppedCount}
            color={droppedCount > 0 ? 'var(--red)' : 'var(--green)'}
          />
          <StatEntry
            label="Active fraction" value={`${activePct}%`}
            color={activePct >= 75 ? 'var(--green)' : activePct <= 40 ? 'var(--red)' : 'var(--accent)'}
          />

          <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />

          <StatEntry
            label={
              convention === 'classic'
                ? (inferenceMode ? 'Inference scale × (1−p)' : 'Training scale (unscaled)')
                : (inferenceMode ? 'Inference scale (unscaled)' : 'Training scale × 1/(1−p)')
            }
            value={`× ${scaleFactor.toFixed(2)}`}
            color={scaleFactor === 1 ? 'var(--text-mid)' : 'var(--accent)'}
          />

          <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />

          {/* Fixed informational stat */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontFamily: MONO, fontSize: '9px', color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px',
            }}>
              Est. sub-networks
            </div>
            <div style={{ fontFamily: MONO, fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.4 }}>
              2<sup>16</sup> = 65,536
            </div>
          </div>

          <StatEntry label="Active connections" value={activeEdges.length} />
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* p slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)',
            minWidth: '130px',
          }}>
            dropout&nbsp; p = {p.toFixed(2)}
          </span>
          <input
            type="range" min={0} max={0.9} step={0.05} value={p}
            onChange={e => setP(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>

        {/* Convention selector: classic (Srivastava et al. 2014) vs inverted (PyTorch/TF default) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: MONO, fontSize: '11px', color: 'var(--text-muted)',
            minWidth: '130px',
          }}>
            convention
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { key: 'classic',  label: 'Classic',  hint: 'Full activation in training; scale × (1−p) at inference' },
              { key: 'inverted', label: 'Inverted',  hint: 'Scale surviving activations × 1/(1−p) in training; no rescaling at inference' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setConvention(opt.key)}
                title={opt.hint}
                style={{
                  fontFamily: MONO, fontSize: '10.5px', fontWeight: 600,
                  color: convention === opt.key ? 'var(--accent)' : 'var(--text-muted)',
                  background: convention === opt.key ? 'var(--accent-dim)' : 'transparent',
                  border: `1px solid ${convention === opt.key ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '4px', padding: '5px 10px', cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--text-muted)' }}>
            {convention === 'classic'
              ? '(Srivastava et al. 2014 — textbook description)'
              : '(PyTorch / TensorFlow default)'}
          </span>
        </div>

        {/* Action buttons + inference toggle */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={applyDropout}
            disabled={inferenceMode}
            style={{
              fontFamily: MONO, fontSize: '11px', fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              borderRadius: '4px', padding: '6px 14px',
              cursor: inferenceMode ? 'default' : 'pointer',
              opacity: inferenceMode ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            Apply Dropout
          </button>

          <button
            onClick={reset}
            style={{
              fontFamily: MONO, fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '4px', padding: '6px 14px', cursor: 'pointer',
            }}
          >
            Reset
          </button>

          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
            fontFamily: MONO, fontSize: '11px',
            color: inferenceMode ? 'var(--accent)' : 'var(--text-muted)',
            marginLeft: '4px',
          }}>
            <input
              type="checkbox"
              checked={inferenceMode}
              onChange={e => setInferenceMode(e.target.checked)}
              style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: '13px', height: '13px' }}
            />
            {inferenceMode
              ? (convention === 'classic'
                  ? `Inference — all neurons on (activations × ${(1 - p).toFixed(2)})`
                  : `Inference — all neurons on (unscaled; × ${(1 / (1 - p)).toFixed(2)} already applied in training)`)
              : 'Inference Mode'
            }
          </label>
        </div>
      </div>
    </WidgetCard>
  );
}
