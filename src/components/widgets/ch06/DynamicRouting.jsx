import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  bg2: '#111111', bg3: '#161616', bg4: '#1e1e1e',
  border: '#242424', borderLt: '#2e2e2e',
  muted: '#555555', mid: '#888888',
  accent: '#2dd4bf', accentDim: '#0b2422',
  purple: '#a78bfa', orange: '#fb923c',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// VOTES[lower_i][upper_j] = 2D prediction vector û_{j|i} = W_ij u_i.
// These are the ONLY hard-coded numbers in this widget — everything else
// (couplings, output magnitudes) is computed live by runRouting() below,
// which is the actual Sabour et al. (2017) routing-by-agreement algorithm.
// L1 and L2's votes for U1 point in nearly the same direction (~14°
// apart) — they agree. L3's vote for U1 points in a very different
// direction (~140° away) — it disagrees. Symmetric story for U2.
const VOTES = [
  [[0.94, 0.13], [-0.13, 0.48]],
  [[0.92, -0.10], [0.21, -0.45]],
  [[-0.60, 0.50], [0.13, 0.94]],
];

const ITERS = 3;

function squash(v) {
  const mag2 = v[0] * v[0] + v[1] * v[1];
  const mag = Math.sqrt(mag2);
  if (mag < 1e-9) return [0, 0];
  const scale = mag2 / (1 + mag2);
  return [(v[0] / mag) * scale, (v[1] / mag) * scale];
}
function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
function vmag(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }

// Real dynamic routing: c = softmax(b) per lower capsule row, s_j = sum_i
// c_ij·vote_ij, v_j = squash(s_j), then b_ij += vote_ij·v_j (agreement).
// Returns one {couplings, mags} snapshot per iteration, index 0 = before
// any routing update (uniform couplings).
function runRouting(votes, iters) {
  const nI = votes.length, nJ = votes[0].length;
  let b = votes.map((row) => row.map(() => 0));
  const history = [];
  for (let it = 0; it <= iters; it++) {
    const c = b.map((row) => {
      const exps = row.map((x) => Math.exp(x));
      const sum = exps.reduce((a, x) => a + x, 0);
      return exps.map((e) => e / sum);
    });
    const s = [];
    for (let j = 0; j < nJ; j++) {
      let sx = 0, sy = 0;
      for (let i = 0; i < nI; i++) { sx += c[i][j] * votes[i][j][0]; sy += c[i][j] * votes[i][j][1]; }
      s.push([sx, sy]);
    }
    const v = s.map(squash);
    history.push({ couplings: c, mags: v.map(vmag) });
    if (it < iters) {
      for (let i = 0; i < nI; i++) {
        for (let j = 0; j < nJ; j++) b[i][j] += dot(votes[i][j], v[j]);
      }
    }
  }
  return history;
}

const ITER_NOTES = [
  'Uniform — no agreement information yet',
  'Agreement emerging',
  'Routing consolidating',
  'L1, L2 lean toward U1 · L3 leans toward U2',
];

const LOWER_POS = [{ x: 130, y: 80 }, { x: 130, y: 150 }, { x: 130, y: 220 }];
const UPPER_POS = [{ x: 510, y: 110 }, { x: 510, y: 190 }];
const LOWER_R = 22;
const L_LABELS = ['L1', 'L2', 'L3'];
const U_LABELS = ['U1', 'U2'];
const L_COLORS = [C.accent, C.orange, C.purple];
const U_FILL = [C.accentDim, '#1a1a2e'];
const U_STROKE = [C.accent, C.purple];

function edgeColor(c) {
  if (c >= 0.6) return C.accent;
  if (c >= 0.4) return C.mid;
  return C.border;
}

function Arrowhead({ x1, y1, x2, y2, color, size = 5 }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < size) return null;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const bx = x2 - ux * size, by = y2 - uy * size;
  const w = size * 0.45;
  return (
    <polygon
      points={`${x2},${y2} ${bx + px * w},${by + py * w} ${bx - px * w},${by - py * w}`}
      fill={color}
    />
  );
}

function StatRow({ label, val, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
      <span style={{ ...mono, fontSize: '8px', color: C.muted }}>{label}</span>
      <span style={{ ...mono, fontSize: '11px', color }}>{val}</span>
    </div>
  );
}

function Toggle({ active, onToggle, label }) {
  return (
    <button
      onClick={onToggle}
      style={{
        ...mono, fontSize: '10px',
        padding: '4px 10px',
        background: active ? C.accentDim : C.bg4,
        border: `1px solid ${active ? C.accent : C.borderLt}`,
        color: active ? C.accent : C.muted,
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      {active ? '✓ ' : ''}{label}
    </button>
  );
}

export default function DynamicRouting({ tryThis }) {
  const [iteration, setIteration] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showCouplings, setShowCouplings] = useState(true);
  const [showVotes, setShowVotes] = useState(true);
  const animTimers = useRef([]);

  const history = useMemo(() => runRouting(VOTES, ITERS), []);

  const couplings = history[iteration].couplings;
  const mags = history[iteration].mags;
  const upperRadii = mags.map((m) => 20 + m * 16);

  useEffect(() => {
    return () => { animTimers.current.forEach(clearTimeout); };
  }, []);

  function stopAnim() {
    animTimers.current.forEach(clearTimeout);
    animTimers.current = [];
    setAnimating(false);
  }

  function startAnim() {
    stopAnim();
    setIteration(0);
    setAnimating(true);
    const DELAY = 1200;
    animTimers.current = [1, 2, 3].map((iter, idx) =>
      setTimeout(() => {
        setIteration(iter);
        if (iter === 3) setAnimating(false);
      }, (idx + 1) * DELAY)
    );
  }

  // Stats
  const routingToU = [0, 1].map((j) => couplings.reduce((s, r) => s + r[j], 0));
  const primarySrc = [0, 1].map((j) =>
    L_LABELS[couplings.reduce((best, r, i) => (r[j] > couplings[best][j] ? i : best), 0)]
  );
  const lowerDom = couplings.map((r) => ({
    label: r[0] >= r[1] ? 'U1' : 'U2',
    val: r[0] >= r[1] ? r[0] : r[1],
  }));

  // Precompute edge geometry
  const edges = LOWER_POS.flatMap((lc, i) =>
    UPPER_POS.map((uc, j) => {
      const c = couplings[i][j];
      const color = edgeColor(c);
      const opacity = 0.3 + c * 0.7;
      const sw = c * 8;
      const mx = (lc.x + uc.x) / 2;
      const my = (lc.y + uc.y) / 2;
      const dx = uc.x - lc.x, dy = uc.y - lc.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const lx = mx + (-dy / len) * 12;
      const ly = my + (dx / len) * 12;
      return { key: `${i}${j}`, i, j, c, color, opacity, sw, lc, uc, lx, ly };
    })
  );

  // Precompute vote arrow geometry
  const voteArrows = UPPER_POS.flatMap((uc, j) =>
    LOWER_POS.map((lc, i) => {
      const [vx, vy] = VOTES[i][j];
      const brightness = 0.35 + couplings[i][j] * 0.65;
      const sx = uc.x - 30;
      const sy = uc.y + (i - 1) * 15;
      return {
        key: `${i}${j}`,
        sx, sy,
        ex: sx + vx * 25,
        ey: sy - vy * 25,
        color: L_COLORS[i],
        brightness,
      };
    })
  );

  return (
    <WidgetCard
      title="Dynamic Routing — agreement drives capsule connections"
      number="6.7"
      tryThis={tryThis}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* SVG diagram */}
          <div style={{ background: '#0a0a0a', borderRadius: '8px', overflow: 'hidden' }}>
            <svg viewBox="0 0 640 300" width="100%" style={{ display: 'block' }}>

              {/* Edges (drawn first; capsule fills cover the portions inside circles) */}
              {edges.map(({ key, lc, uc, color, opacity, sw }) => (
                <line
                  key={`e${key}`}
                  x1={lc.x} y1={lc.y} x2={uc.x} y2={uc.y}
                  stroke={color}
                  strokeWidth={sw}
                  opacity={opacity}
                  style={{ transition: 'stroke-width 0.3s ease, opacity 0.3s ease' }}
                />
              ))}

              {/* Coupling value labels */}
              {showCouplings && edges.map(({ key, c, color, opacity, lx, ly }) => (
                <text
                  key={`cl${key}`}
                  x={lx} y={ly}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={color} fontSize={9}
                  fontFamily="'JetBrains Mono', monospace"
                  opacity={Math.min(opacity + 0.15, 1)}
                >
                  {`c=${c.toFixed(2)}`}
                </text>
              ))}

              {/* Vote arrows (before upper capsules so circle fills can overlap them) */}
              {showVotes && voteArrows.map(({ key, sx, sy, ex, ey, color, brightness }) => (
                <g key={`va${key}`} opacity={brightness}>
                  <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={1.5} />
                  <Arrowhead x1={sx} y1={sy} x2={ex} y2={ey} color={color} />
                </g>
              ))}

              {/* Lower capsules */}
              {LOWER_POS.map((lc, i) => (
                <g key={`lc${i}`}>
                  <circle
                    cx={lc.x} cy={lc.y} r={LOWER_R}
                    fill={C.bg3} stroke={C.borderLt} strokeWidth={1.5}
                  />
                  <text
                    x={lc.x} y={lc.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={C.mid} fontSize={11}
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {L_LABELS[i]}
                  </text>
                </g>
              ))}

              {/* Upper capsules (drawn on top — fills cover edge endpoints) */}
              {UPPER_POS.map((uc, j) => {
                const r = upperRadii[j];
                const sw = 1 + mags[j] * 2;
                return (
                  <g key={`uc${j}`}>
                    <circle
                      cx={uc.x} cy={uc.y} r={r}
                      fill={U_FILL[j]} stroke={U_STROKE[j]} strokeWidth={sw}
                      style={{ transition: 'r 0.3s ease, stroke-width 0.3s ease' }}
                    />
                    <text
                      x={uc.x} y={uc.y - 5}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={U_STROKE[j]} fontSize={11}
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {U_LABELS[j]}
                    </text>
                    <text
                      x={uc.x} y={uc.y + 9}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={U_STROKE[j]} fontSize={8}
                      fontFamily="'JetBrains Mono', monospace"
                      opacity={0.7}
                    >
                      {`‖v‖=${mags[j].toFixed(2)}`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Routing table */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ ...mono, fontSize: '10px', color: C.muted, marginBottom: '6px' }}>
              Coupling coefficients c_ij
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '32px 70px 70px',
              gap: '3px',
              width: 'fit-content',
            }}>
              {/* Header row */}
              <div />
              {U_LABELS.map((ul) => (
                <div key={ul} style={{ ...mono, fontSize: '10px', color: C.mid, textAlign: 'center', padding: '4px 0' }}>
                  {ul}
                </div>
              ))}
              {/* Data rows — Fragment with key avoids wrapper div that breaks grid flow */}
              {L_LABELS.map((ll, i) => (
                <Fragment key={ll}>
                  <div style={{ ...mono, fontSize: '10px', color: C.mid, display: 'flex', alignItems: 'center' }}>
                    {ll}
                  </div>
                  {couplings[i].map((c, j) => {
                    const bg = c >= 0.7 ? C.accentDim : c >= 0.5 ? C.bg4 : C.bg3;
                    const fg = c >= 0.7 ? C.accent : c >= 0.5 ? C.mid : C.muted;
                    return (
                      <div
                        key={j}
                        style={{
                          ...mono, fontSize: '12px',
                          background: bg, color: fg,
                          textAlign: 'center',
                          height: '36px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '4px',
                          transition: 'background 0.3s ease, color 0.3s ease',
                        }}
                      >
                        {c.toFixed(2)}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setIteration((n) => Math.min(n + 1, 3))}
              disabled={iteration >= 3 || animating}
              style={{
                ...mono, fontSize: '11px',
                padding: '6px 14px',
                background: iteration >= 3 || animating ? C.bg4 : C.accentDim,
                border: `1px solid ${iteration >= 3 || animating ? C.borderLt : C.accent}`,
                color: iteration >= 3 || animating ? C.muted : C.accent,
                borderRadius: '5px',
                cursor: iteration >= 3 || animating ? 'not-allowed' : 'pointer',
              }}
            >
              Routing Iteration {iteration} / 3 →
            </button>

            <button
              onClick={() => { stopAnim(); setIteration(0); }}
              style={{
                ...mono, fontSize: '11px',
                padding: '6px 14px',
                background: C.bg4,
                border: `1px solid ${C.borderLt}`,
                color: C.mid,
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              ↺ Reset
            </button>

            <button
              onClick={animating ? stopAnim : startAnim}
              style={{
                ...mono, fontSize: '11px',
                padding: '6px 14px',
                background: animating ? C.bg4 : C.accentDim,
                border: `1px solid ${animating ? C.borderLt : C.accent}`,
                color: animating ? C.mid : C.accent,
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              {animating ? '■ Stop' : '▶ Animate'}
            </button>

            <div style={{ width: '1px', height: '20px', background: C.border }} />

            <Toggle
              active={showCouplings}
              onToggle={() => setShowCouplings((v) => !v)}
              label="Show coupling values"
            />
            <Toggle
              active={showVotes}
              onToggle={() => setShowVotes((v) => !v)}
              label="Show vote arrows"
            />
          </div>
        </div>

        {/* ── Stats panel ── */}
        <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px' }}>
            <div style={{ ...mono, fontSize: '7.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Iteration
            </div>
            <div style={{ ...mono, fontSize: '22px', color: C.accent }}>{iteration}</div>
            <div style={{ ...mono, fontSize: '8.5px', color: C.mid, marginTop: '5px', lineHeight: 1.4 }}>
              {ITER_NOTES[iteration]}
            </div>
          </div>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px' }}>
            <div style={{ ...mono, fontSize: '7.5px', color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Upper capsule U1
            </div>
            <StatRow label="‖U1‖" val={mags[0].toFixed(2)} color={C.accent} />
            <StatRow label="Routing to U1" val={routingToU[0].toFixed(2)} color={C.mid} />
            <StatRow label="Primary source" val={primarySrc[0]} color={C.accent} />
          </div>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px' }}>
            <div style={{ ...mono, fontSize: '7.5px', color: C.purple, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Upper capsule U2
            </div>
            <StatRow label="‖U2‖" val={mags[1].toFixed(2)} color={C.purple} />
            <StatRow label="Routing to U2" val={routingToU[1].toFixed(2)} color={C.mid} />
            <StatRow label="Primary source" val={primarySrc[1]} color={C.purple} />
          </div>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px' }}>
            <div style={{ ...mono, fontSize: '7.5px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Routing consensus
            </div>
            {lowerDom.map((d, i) => (
              <div key={i} style={{ ...mono, fontSize: '9px', marginBottom: '5px', lineHeight: 1.5 }}>
                <span style={{ color: L_COLORS[i] }}>{L_LABELS[i]}</span>
                <span style={{ color: C.muted }}> → </span>
                <span style={{ color: d.label === 'U1' ? C.accent : C.purple }}>{d.label}</span>
                <span style={{ color: C.muted }}> ({d.val.toFixed(2)})</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </WidgetCard>
  );
}
