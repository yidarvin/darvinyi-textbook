import { useState, useRef, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Palette ───────────────────────────────────────────────────────────────────
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
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  textMid:   '#888888',
  text:      '#e8eaed',
  codeBg:    '#0a0a0a',
};
const mono    = "'JetBrains Mono', monospace";
const inter   = "'Inter', sans-serif";
const crimson = "'Crimson Pro', serif";

function rgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Expert metadata ───────────────────────────────────────────────────────────
const EXPERT_COLORS = [
  C.accent, C.orange, C.purple, C.math,
  C.green,  C.red,   C.blue,   C.pink,
];
const EXPERT_SPECS = [
  'Fn words', 'Syntax', 'Code', 'Numbers',
  'Entities', 'Discourse', 'Rare/tech', 'Sem roles',
];
const BAR_SPECS = [
  'fn-words', 'syntax', 'code', 'numbers',
  'entities', 'discourse', 'rare-tech', 'sem-roles',
];

// ── Precomputed token routing ─────────────────────────────────────────────────
const TOKENS_DATA = {
  'the':     { weights: [0.52, 0.08, 0.04, 0.06, 0.05, 0.08, 0.07, 0.10], top2: [0, 7] },
  'code':    { weights: [0.05, 0.06, 0.61, 0.04, 0.07, 0.03, 0.09, 0.05], top2: [2, 6] },
  'Paris':   { weights: [0.06, 0.05, 0.04, 0.08, 0.62, 0.04, 0.06, 0.05], top2: [4, 3] },
  'however': { weights: [0.04, 0.09, 0.03, 0.05, 0.06, 0.61, 0.07, 0.05], top2: [5, 1] },
  '3.14':    { weights: [0.05, 0.04, 0.07, 0.67, 0.04, 0.03, 0.05, 0.05], top2: [3, 2] },
};
const PRESET_TOKENS = ['the', 'code', 'Paris', 'however', '3.14'];

// ── Main SVG layout — full 616px display width ────────────────────────────────
// viewBox 620×268 renders at ~616px → scale ≈ 0.994 (nearly 1:1)
const VW = 620, VH = 268;

const TOK_X = 16,  TOK_Y = 128, TOK_W = 70,  TOK_H = 44;
const ROU_X = 128, ROU_Y = 106, ROU_W = 110, ROU_H = 88;
const GRD_X = 292, GRD_Y = 50;
const BOX_W = 58,  BOX_H = 42,  GAP_X = 10,  GAP_Y = 10;
const SUM_X = 432, SUM_Y = 106, SUM_W = 115, SUM_H = 88;

const TOK_CX = TOK_X + TOK_W / 2;      // 51
const TOK_CY = TOK_Y + TOK_H / 2;      // 150
const ROU_CX = ROU_X + ROU_W / 2;      // 183
const ROU_CY = ROU_Y + ROU_H / 2;      // 150
const ROU_R  = ROU_X + ROU_W;          // 238
const SUM_CX = SUM_X + SUM_W / 2;      // 489.5
const SUM_CY = SUM_Y + SUM_H / 2;      // 150
const SUM_R  = SUM_X + SUM_W;          // 547

function ePos(i) {
  const col = i % 2, row = Math.floor(i / 2);
  const x = GRD_X + col * (BOX_W + GAP_X);
  const y = GRD_Y + row * (BOX_H + GAP_Y);
  return { x, y, cx: x + BOX_W / 2, cy: y + BOX_H / 2, left: x, right: x + BOX_W };
}

// ── Shared-expert lane (DeepSeek-style) ────────────────────────────────────────
// Only drawn when moeStyle === 'shared'. Lives in an extra strip appended below
// the base diagram so it never overlaps the router/expert-grid/sum boxes above.
const SHARED_COLOR = '#22d3ee';
const SHR_EXTRA_H  = 56;                       // extra viewBox height for the lane
const SHR_H        = 34;
const SHR_X        = ROU_X;                    // 128 — aligns under the router column
const SHR_W        = (SUM_X + SUM_W) - ROU_X;  // spans router → end of weighted-sum box
const SHR_Y        = VH + 6;                   // sits in the extra strip below the base diagram
const SHR_CY       = SHR_Y + SHR_H / 2;

// ── Bar chart SVG layout ──────────────────────────────────────────────────────
// Display container: 616 - 160(util) - 12(gap) = 444px
// viewBox 540×161 (8 rows; taller when the shared-expert row is added),
// scale ≈ 444/540 = 0.822 → 10px font ≈ 8.2px display
const BAR_VW = 540;
const BAR_L  = 100, BAR_TOP = 22;
const BAR_MAX = BAR_VW - BAR_L - 36;   // 404 SVG units
const BAR_H  = 12,  BAR_GAP = 5;

// ── MainDiagram ───────────────────────────────────────────────────────────────
function MainDiagram({ displayToken, routerActive, activeExperts, showWeightedSum, showSpec, moeStyle }) {
  const td = displayToken ? TOKENS_DATA[displayToken] : null;
  const isShared = moeStyle === 'shared';
  const vh = isShared ? VH + SHR_EXTRA_H : VH;

  return (
    <svg viewBox={`0 0 ${VW} ${vh}`} width="100%" style={{ display: 'block' }}>
      <rect width={VW} height={vh} fill={C.codeBg} rx={6} />

      {/* Column headers */}
      {[
        { x: TOK_CX,           t: 'Input' },
        { x: ROU_CX,           t: 'Router W_g' },
        { x: GRD_X + BOX_W + GAP_X / 2, t: isShared ? 'Routed experts (E=8, k=2)' : 'Experts (E=8, k=2)' },
        { x: SUM_CX,           t: 'Weighted Sum' },
      ].map(({ x, t }) => (
        <text key={t} x={x} y={16} textAnchor="middle"
          fontFamily={inter} fontSize="9" fill={C.muted}>{t}</text>
      ))}

      {/* Arrow: token → router */}
      <line
        x1={TOK_X + TOK_W} y1={TOK_CY} x2={ROU_X} y2={ROU_CY}
        strokeWidth={routerActive ? 1.5 : 1}
        style={{ stroke: routerActive ? C.accent : C.borderLt, transition: 'stroke 300ms ease' }}
      />

      {/* Arrows: router → each expert (fan-out) */}
      {Array.from({ length: 8 }, (_, i) => {
        const p      = ePos(i);
        const isTop2 = activeExperts.includes(i);
        const color  = EXPERT_COLORS[i];
        const w      = td ? td.weights[i] : 0;
        return (
          <line key={`re${i}`}
            x1={ROU_R} y1={ROU_CY} x2={p.left} y2={p.cy}
            strokeWidth={isTop2 ? 1.5 + w * 2.5 : 0.5}
            style={{
              stroke:     isTop2 ? color : C.borderLt,
              opacity:    isTop2 ? 0.9 : 0.1,
              transition: 'stroke 400ms ease, opacity 400ms ease',
            }}
          />
        );
      })}

      {/* Arrows: active experts → weighted sum (fan-in) */}
      {Array.from({ length: 8 }, (_, i) => {
        const p      = ePos(i);
        const isTop2 = activeExperts.includes(i);
        return (
          <line key={`es${i}`}
            x1={p.right} y1={p.cy} x2={SUM_X} y2={SUM_CY}
            strokeWidth={1.5}
            style={{
              stroke:     EXPERT_COLORS[i],
              opacity:    isTop2 && showWeightedSum ? 0.75 : 0,
              transition: 'opacity 300ms ease',
            }}
          />
        );
      })}

      {/* Expert boxes */}
      {Array.from({ length: 8 }, (_, i) => {
        const p       = ePos(i);
        const color   = EXPERT_COLORS[i];
        const isTop2  = activeExperts.includes(i);
        const isInact = displayToken !== null && !isTop2 && activeExperts.length > 0;
        return (
          <g key={`exp${i}`}
            style={{
              filter:     isTop2 ? `drop-shadow(0 0 6px ${rgba(color, 0.5)})` : 'none',
              transition: 'filter 300ms ease',
            }}>
            <rect
              x={p.x} y={p.y} width={BOX_W} height={BOX_H} rx={4}
              strokeWidth={isTop2 ? 2 : 1}
              style={{
                fill:       isTop2 ? rgba(color, 0.18) : (isInact ? C.bg4 : C.bg3),
                stroke:     isTop2 ? color : C.borderLt,
                opacity:    isInact ? 0.38 : 1,
                transition: 'fill 300ms ease, stroke 300ms ease, opacity 300ms ease',
              }}
            />
            <text
              x={p.cx}
              y={showSpec ? p.cy - 6 : p.cy}
              textAnchor="middle" dominantBaseline="middle"
              fontFamily={mono} fontSize="10"
              style={{
                fill:       isTop2 ? color : (isInact ? rgba(C.muted, 0.55) : C.textMid),
                fontWeight: isTop2 ? 700 : 400,
                opacity:    isInact ? 0.5 : 1,
                transition: 'fill 300ms ease, opacity 300ms ease',
              }}>
              E{i}
            </text>
            {showSpec && (
              <text
                x={p.cx} y={p.cy + 10}
                textAnchor="middle"
                fontFamily={mono} fontSize="7.5"
                style={{
                  fill:       isTop2 ? color : C.muted,
                  opacity:    isInact ? 0.3 : (isTop2 ? 0.9 : 0.6),
                  transition: 'fill 300ms ease, opacity 300ms ease',
                }}>
                {EXPERT_SPECS[i]}
              </text>
            )}
          </g>
        );
      })}

      {/* Shared expert lane (DeepSeek-style): always-on path, parallel to routing */}
      {isShared && (
        <>
          <line
            x1={TOK_CX} y1={TOK_Y + TOK_H} x2={SHR_X} y2={SHR_CY}
            strokeWidth={displayToken ? 1.5 : 1}
            style={{
              stroke:     displayToken ? SHARED_COLOR : C.borderLt,
              opacity:    displayToken ? 0.9 : 0.3,
              transition: 'stroke 300ms ease, opacity 300ms ease',
            }}
          />
          <line
            x1={SHR_X + SHR_W} y1={SHR_CY} x2={SUM_CX} y2={SUM_Y + SUM_H}
            strokeWidth={1.5}
            style={{
              stroke:     SHARED_COLOR,
              opacity:    displayToken && showWeightedSum ? 0.85 : 0.25,
              transition: 'opacity 300ms ease',
            }}
          />
          <rect
            x={SHR_X} y={SHR_Y} width={SHR_W} height={SHR_H} rx={4}
            strokeWidth={displayToken ? 1.5 : 1}
            strokeDasharray="4 3"
            style={{
              fill:       displayToken ? rgba(SHARED_COLOR, 0.14) : C.bg3,
              stroke:     displayToken ? SHARED_COLOR : C.borderLt,
              transition: 'fill 300ms ease, stroke 300ms ease',
            }}
          />
          <text x={SHR_X + 14} y={SHR_CY - 5} textAnchor="start" dominantBaseline="middle"
            fontFamily={mono} fontSize="10" fontWeight={700}
            style={{ fill: displayToken ? SHARED_COLOR : C.textMid, transition: 'fill 300ms ease' }}>
            E_s
          </text>
          <text x={SHR_X + 14} y={SHR_CY + 10} textAnchor="start" dominantBaseline="middle"
            fontFamily={mono} fontSize="7.5" fill={C.muted}>
            shared · always active (weight 1.0)
          </text>
        </>
      )}

      {/* Token input box */}
      <rect
        x={TOK_X} y={TOK_Y} width={TOK_W} height={TOK_H} rx={4}
        strokeWidth={routerActive ? 1.5 : 1}
        style={{
          fill: C.bg4, stroke: routerActive ? C.accent : C.borderLt,
          transition: 'stroke 300ms ease',
        }}
      />
      <text
        x={TOK_CX} y={TOK_CY}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily={mono} fontSize="14"
        style={{
          fill:       displayToken ? C.text : C.muted,
          fontWeight: displayToken ? 600 : 400,
          transition: 'fill 200ms ease',
        }}>
        {displayToken || '—'}
      </text>

      {/* Router box */}
      <rect
        x={ROU_X} y={ROU_Y} width={ROU_W} height={ROU_H} rx={4}
        strokeWidth={routerActive ? 1.5 : 1}
        style={{
          fill: C.bg3, stroke: routerActive ? C.accent : C.borderLt,
          transition: 'stroke 300ms ease',
        }}
      />
      <text x={ROU_CX} y={ROU_CY - 10} textAnchor="middle"
        fontFamily={mono} fontSize="11"
        style={{ fill: routerActive ? C.text : C.textMid, transition: 'fill 300ms ease' }}>
        Router
      </text>
      <text x={ROU_CX} y={ROU_CY + 8} textAnchor="middle"
        fontFamily={mono} fontSize="9.5" fill={C.muted}>W_g</text>

      {/* Weighted sum box */}
      <rect
        x={SUM_X} y={SUM_Y} width={SUM_W} height={SUM_H} rx={4}
        strokeWidth={1}
        style={{
          fill: C.bg3, stroke: showWeightedSum ? C.borderLt : C.border,
          opacity:    showWeightedSum ? 1 : 0.5,
          transition: 'opacity 300ms ease, stroke 300ms ease',
        }}
      />
      <text x={SUM_CX} y={SUM_Y + 13} textAnchor="middle"
        fontFamily={mono} fontSize="8.5" fill={C.muted}>Weighted sum</text>

      {showWeightedSum && td && activeExperts.length === 2 ? (
        <>
          <text x={SUM_CX} y={SUM_Y + (isShared ? 26 : 36)} textAnchor="middle"
            fontFamily={mono} fontSize="9" fill={EXPERT_COLORS[activeExperts[0]]}>
            {td.weights[activeExperts[0]].toFixed(2)}·E{activeExperts[0]}(x)
          </text>
          <text x={SUM_CX} y={SUM_Y + (isShared ? 39 : 53)} textAnchor="middle"
            fontFamily={mono} fontSize="8.5" fill={C.muted}>+</text>
          <text x={SUM_CX} y={SUM_Y + (isShared ? 52 : 70)} textAnchor="middle"
            fontFamily={mono} fontSize="9" fill={EXPERT_COLORS[activeExperts[1]]}>
            {td.weights[activeExperts[1]].toFixed(2)}·E{activeExperts[1]}(x)
          </text>
          {isShared && (
            <>
              <text x={SUM_CX} y={SUM_Y + 65} textAnchor="middle"
                fontFamily={mono} fontSize="8.5" fill={C.muted}>+</text>
              <text x={SUM_CX} y={SUM_Y + 78} textAnchor="middle"
                fontFamily={mono} fontSize="9" fill={SHARED_COLOR}>
                1.00·E_s(x)
              </text>
            </>
          )}
        </>
      ) : (
        <text x={SUM_CX} y={SUM_Y + 53} textAnchor="middle"
          fontFamily={mono} fontSize="8.5" fill={rgba(C.muted, 0.5)}>
          {isShared ? 'α₁E₁ + α₂E₂ + E_s' : 'α₁E₁ + α₂E₂'}
        </text>
      )}

      {/* Output arrow */}
      <line
        x1={SUM_R} y1={SUM_CY} x2={VW - 14} y2={SUM_CY}
        strokeWidth={1}
        style={{
          stroke:     showWeightedSum ? C.borderLt : C.border,
          opacity:    showWeightedSum ? 1 : 0.35,
          transition: 'opacity 300ms ease',
        }}
      />
      {/* Output label above arrow midpoint */}
      <text x={(SUM_R + VW - 14) / 2} y={SUM_CY - 7} textAnchor="middle"
        fontFamily={mono} fontSize="9" fill={C.muted}>output</text>

      {/* Footer note */}
      <text x={GRD_X + BOX_W + GAP_X / 2} y={vh - 8} textAnchor="middle"
        fontFamily={inter} fontSize="8" fill={rgba(C.muted, 0.4)}>
        {isShared
          ? 'Each token routes to 2 of 8 experts, plus the shared expert (always active)'
          : 'Each token routes to exactly 2 of 8 experts'}
      </text>
    </svg>
  );
}

// ── RouterBarChart ────────────────────────────────────────────────────────────
function RouterBarChart({ barWeights, activeExperts, moeStyle }) {
  const isShared = moeStyle === 'shared';
  const rows     = isShared ? 9 : 8;
  const vh       = BAR_TOP + rows * (BAR_H + BAR_GAP) + 3;

  return (
    <svg viewBox={`0 0 ${BAR_VW} ${vh}`} width="100%" style={{ display: 'block' }}>
      <rect width={BAR_VW} height={vh} fill={C.codeBg} rx={4} />
      <text x={BAR_VW / 2} y={14} textAnchor="middle"
        fontFamily={inter} fontSize="10" fill={C.textMid}>
        {isShared ? 'Router probabilities — 8 routed + 1 shared (always on)' : 'Router probabilities — all 8 experts'}
      </text>

      {isShared && (
        <g key="shared">
          <rect x={BAR_L} y={BAR_TOP} width={3} height={BAR_H} rx={1}
            style={{ fill: SHARED_COLOR }} />
          <text x={BAR_L - 5} y={BAR_TOP + BAR_H / 2}
            textAnchor="end" dominantBaseline="middle"
            fontFamily={mono} fontSize="10"
            style={{ fill: SHARED_COLOR, fontWeight: 700 }}>
            E_s shared
          </text>
          <rect x={BAR_L} y={BAR_TOP} width={BAR_MAX} height={BAR_H} fill={C.bg4} rx={2} />
          <rect x={BAR_L} y={BAR_TOP} width={BAR_MAX} height={BAR_H}
            fill={SHARED_COLOR} rx={2} style={{ opacity: 0.85 }} />
          <text x={BAR_L + BAR_MAX + 5} y={BAR_TOP + BAR_H / 2}
            textAnchor="start" dominantBaseline="middle"
            fontFamily={mono} fontSize="10"
            style={{ fill: SHARED_COLOR }}>
            always
          </text>
        </g>
      )}

      {Array.from({ length: 8 }, (_, i) => {
        const rowIdx = isShared ? i + 1 : i;
        const y      = BAR_TOP + rowIdx * (BAR_H + BAR_GAP);
        const isTop2 = activeExperts.includes(i);
        const color  = EXPERT_COLORS[i];
        const w      = barWeights[i] || 0;
        const op     = activeExperts.length > 0 ? (isTop2 ? 1 : 0.28) : 0.65;

        return (
          <g key={i}>
            {isTop2 && (
              <rect x={BAR_L} y={y} width={3} height={BAR_H} rx={1}
                style={{ fill: color }} />
            )}
            <text x={BAR_L - 5} y={y + BAR_H / 2}
              textAnchor="end" dominantBaseline="middle"
              fontFamily={mono} fontSize="10"
              style={{ fill: isTop2 ? color : C.muted }}>
              E{i} {BAR_SPECS[i]}
            </text>
            <rect x={BAR_L} y={y} width={BAR_MAX} height={BAR_H} fill={C.bg4} rx={2} />
            <rect
              x={BAR_L} y={y} width={BAR_MAX} height={BAR_H}
              fill={color} rx={2}
              style={{
                transformBox:    'fill-box',
                transformOrigin: 'left center',
                transform:       `scaleX(${w})`,
                opacity:         op,
                transition:      'transform 400ms ease, opacity 300ms ease',
              }}
            />
            <text x={BAR_L + BAR_MAX + 5} y={y + BAR_H / 2}
              textAnchor="start" dominantBaseline="middle"
              fontFamily={mono} fontSize="10"
              style={{ fill: isTop2 ? color : C.muted }}>
              {w.toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── UtilizationHeatmap ────────────────────────────────────────────────────────
// Width: 160px fixed. Inner: 160-24=136px. Bar: flex:1 ≈ 89px.
function UtilizationHeatmap({ counts, moeStyle }) {
  const isShared    = moeStyle === 'shared';
  const total       = counts.reduce((a, b) => a + b, 0);
  const tokPro      = total / 2;
  const sharedCount = isShared ? tokPro : 0;
  const maxC        = Math.max(1, ...counts, sharedCount);
  const idleN       = counts.filter(c => c === 0).length;

  return (
    <div style={{
      background: C.bg3, border: `1px solid ${C.border}`,
      borderRadius: '6px', padding: '10px 12px', height: '100%', boxSizing: 'border-box',
    }}>
      <div style={{ fontFamily: inter, fontSize: '10px', color: C.muted, marginBottom: '9px' }}>
        Expert Utilization
      </div>

      {isShared && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          marginBottom: '8px', paddingBottom: '6px', borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{
            fontFamily: mono, fontSize: '8.5px', color: SHARED_COLOR,
            width: '16px', flexShrink: 0, fontWeight: 700,
          }}>E_s</span>
          <div style={{
            flex: 1, height: '13px', background: C.bg4,
            borderRadius: '2px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${(sharedCount / maxC) * 100}%`, background: SHARED_COLOR,
              borderRadius: '2px', transition: 'width 300ms ease',
            }} />
          </div>
          <span style={{
            fontFamily: mono, fontSize: '8.5px', color: SHARED_COLOR,
            width: '18px', flexShrink: 0, textAlign: 'right',
          }}>
            {sharedCount}
          </span>
        </div>
      )}

      {counts.map((count, i) => {
        const color  = EXPERT_COLORS[i];
        const ratio  = count / maxC;
        const isIdle = count === 0 && tokPro > 0;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px',
          }}>
            <span style={{
              fontFamily: mono, fontSize: '8.5px', color: C.muted,
              width: '16px', flexShrink: 0,
            }}>E{i}</span>
            <div style={{
              flex: 1, height: '13px', background: C.bg4,
              borderRadius: '2px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${ratio * 100}%`, background: color,
                borderRadius: '2px', transition: 'width 300ms ease',
              }} />
            </div>
            <span style={{
              fontFamily: mono, fontSize: '8.5px',
              color:  isIdle ? C.red : (count > 0 ? color : C.muted),
              width: '18px', flexShrink: 0, textAlign: 'right',
            }}>
              {isIdle ? '!' : count}
            </span>
          </div>
        );
      })}

      {tokPro > 0 && (
        <div style={{
          marginTop: '7px', fontFamily: mono, fontSize: '7.5px',
          color: C.muted, lineHeight: 1.6,
        }}>
          {idleN > 0
            ? <span style={{ color: C.red }}>{idleN} idle — dead expert risk</span>
            : <span>Load balance looks uniform</span>
          }
          {isShared && (
            <div style={{ color: SHARED_COLOR, marginTop: '2px' }}>
              E_s fires on all {tokPro} token{tokPro === 1 ? '' : 's'} — never idle
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── DenseVsMoEPanel ───────────────────────────────────────────────────────────
// FFN_PARAMS = d_model × d_ffn × 2 = 256 × 1024 × 2 = 524,288
const FFN_PARAMS = 524288;

function DenseVsMoEPanel({ moeStyle }) {
  const isShared = moeStyle === 'shared';

  // Classic top-k (Mixtral/Switch-style): E=8 routed experts, k=2 active, none shared.
  // DeepSeek-style: same 8 routed experts (top-2 gated) plus 1 always-on shared
  // expert of identical size — the shared expert adds to both the param count
  // (it's a 9th expert) and the active compute (it fires on every token, on
  // top of whichever 2 routed experts the router picks).
  const totalExperts   = isShared ? 9 : 8;
  const activeExperts  = isShared ? 3 : 2; // top-2 routed (+1 shared if enabled)
  const totalParams    = totalExperts  * FFN_PARAMS;
  const activeFlops    = activeExperts * FFN_PARAMS;
  const paramsMult     = totalExperts;
  const flopsMult      = activeExperts;

  return (
    <div style={{
      marginTop: '10px', background: C.bg4, border: `1px solid ${C.border}`,
      borderRadius: '6px', padding: '14px 16px',
    }}>
      {/* Config annotation */}
      <div style={{
        fontFamily: mono, fontSize: '8px', color: rgba(C.muted, 0.7),
        marginBottom: '10px', letterSpacing: '0.02em',
      }}>
        d_model=256 · d_ffn=1024 · E={totalExperts} experts{isShared ? ' (8 routed + 1 shared)' : ''} · k={activeExperts} active/token
        · 1 FFN=524,288 params · router W_g=2,048 params
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        {/* Dense */}
        <div style={{ flex: 1, borderLeft: `2px solid ${C.borderLt}`, paddingLeft: '12px' }}>
          <div style={{
            fontFamily: mono, fontSize: '9.5px', color: C.textMid,
            fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px',
          }}>Dense FFN</div>
          <div style={{ fontFamily: mono, fontSize: '8.5px', color: C.textMid, lineHeight: 1.9 }}>
            <div>Single FFN: d_model × d_ffn × 2</div>
            <div style={{ color: C.math }}>= 256 × 1024 × 2 = 524,288 params</div>
            <div style={{ marginTop: '3px' }}>Compute/token: 524,288 FLOPs</div>
          </div>
        </div>

        {/* MoE */}
        <div style={{ flex: 1, borderLeft: `2px solid ${C.accent}`, paddingLeft: '12px' }}>
          <div style={{
            fontFamily: mono, fontSize: '9.5px', color: C.accent,
            fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px',
          }}>{isShared ? 'MoE (8 routed + 1 shared)' : 'MoE (E=8, k=2)'}</div>
          <div style={{ fontFamily: mono, fontSize: '8.5px', color: C.textMid, lineHeight: 1.9 }}>
            <div>{totalExperts} × 524,288 params =</div>
            <div style={{ color: C.math }}>{totalParams.toLocaleString()} total params ({paramsMult}× dense)</div>
            <div style={{ marginTop: '3px' }}>
              Compute/token: {isShared ? 'top-2 + shared' : 'top-2'} × 524,288
            </div>
            <div style={{ color: C.accent }}>= {activeFlops.toLocaleString()} FLOPs (only {flopsMult}× dense)</div>
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center', fontFamily: crimson, fontSize: '13px', color: C.text,
        borderTop: `1px solid ${C.border}`, paddingTop: '10px', lineHeight: 1.6,
      }}>
        MoE: {paramsMult}× more parameters, yet only {flopsMult}× the compute of a single dense FFN.
        <div style={{ fontFamily: inter, fontSize: '12px', color: C.textMid, marginTop: '3px' }}>
          {isShared
            ? 'The shared expert always fires, capturing common knowledge every token needs, while the routed experts still specialize — the DeepSeek-style split between "always-on" and "sometimes-on" capacity.'
            : 'Parameters store knowledge. Compute is the bottleneck — MoE decouples the two.'}
        </div>
      </div>
    </div>
  );
}

// ── StatStrip ─────────────────────────────────────────────────────────────────
// 6 cells × ~102px each in 616px container. Content area ≈ 82px per cell.
// Widest value: "E5, E1" = 6 chars × 9px(15px mono) = 54px < 82px. ✓
function StatStrip({ counts, activeExperts, moeStyle }) {
  const total   = counts.reduce((a, b) => a + b, 0);
  const tokPro  = total / 2;
  const maxC    = Math.max(...counts);
  const idleC   = counts.filter(c => c === 0).length;
  const mostIdx = counts.indexOf(maxC);
  const isShared = moeStyle === 'shared';
  const totalExperts  = isShared ? 9 : 8;
  const activeExpertN = isShared ? 3 : 2;

  const activeStr = activeExperts.length === 2
    ? `E${activeExperts[0]}, E${activeExperts[1]}`
    : '—';

  const cells = [
    {
      label: 'Processed',
      val:   `${tokPro}/5`,
      vc:    C.textMid,
    },
    {
      label: 'Active now',
      val:   activeStr,
      vc:    activeExperts.length === 2 ? C.accent : C.muted,
    },
    {
      label: 'Most used',
      val:   tokPro > 0 ? `E${mostIdx}` : '—',
      note:  tokPro > 0 ? `${maxC}×` : '',
      vc:    tokPro > 0 ? EXPERT_COLORS[mostIdx] : C.muted,
    },
    {
      label: 'Idle experts',
      val:   `${idleC}`,
      vc:    idleC > 0 && tokPro > 0 ? C.red : C.accent,
    },
    {
      label: 'Total params',
      val:   isShared ? '~4.7M' : '~4.2M',
      note:  `${totalExperts}× dense FFN`,
      vc:    C.math,
    },
    {
      label: 'Compute',
      val:   `${activeExpertN}×`,
      note:  'vs dense FFN',
      vc:    C.accent,
    },
  ];

  return (
    <div style={{
      display: 'flex', marginTop: '10px',
      background: C.bg3, border: `1px solid ${C.border}`,
      borderRadius: '6px', overflow: 'hidden',
    }}>
      {cells.map((cell, i) => (
        <div key={i} style={{
          flex: 1, padding: '10px 12px', textAlign: 'center',
          borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
        }}>
          <div style={{
            fontFamily: inter, fontSize: '8px', color: C.muted,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px',
          }}>
            {cell.label}
          </div>
          <div style={{
            fontFamily: mono, fontSize: '15px', color: cell.vc || C.textMid,
            fontWeight: 600, lineHeight: 1,
          }}>
            {cell.val}
          </div>
          {cell.note && (
            <div style={{
              fontFamily: mono, fontSize: '8px', color: C.muted, marginTop: '3px',
            }}>
              {cell.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MixtureOfExperts({ tryThis }) {
  const [displayToken,    setDisplayToken]    = useState(null);
  const [routerActive,    setRouterActive]    = useState(false);
  const [activeExperts,   setActiveExperts]   = useState([]);
  const [showWeightedSum, setShowWeightedSum] = useState(false);
  const [barWeights,      setBarWeights]      = useState(Array(8).fill(0));
  const [selectedToken,   setSelectedToken]   = useState(null);
  const [processedTokens, setProcessedTokens] = useState(new Set());
  const [isAnimating,     setIsAnimating]     = useState(false);
  const [showSpec,        setShowSpec]        = useState(true);
  const [showComparison,  setShowComparison]  = useState(true);
  const [moeStyle,        setMoeStyle]        = useState('classic'); // 'classic' | 'shared'
  const [utilStep,        setUtilStep]        = useState(0);

  const utilizationCounts = useRef(Array(8).fill(0));
  const animTimeouts      = useRef([]);

  useEffect(() => () => { animTimeouts.current.forEach(clearTimeout); }, []);

  function clearAll() {
    animTimeouts.current.forEach(clearTimeout);
    animTimeouts.current = [];
  }

  function addT(fn, delay) {
    const id = setTimeout(fn, delay);
    animTimeouts.current.push(id);
  }

  function runToken(tokenKey, baseDelay, onDone) {
    const td = TOKENS_DATA[tokenKey];

    addT(() => {
      setDisplayToken(tokenKey);
      setSelectedToken(tokenKey);
      setRouterActive(false);
      setActiveExperts([]);
      setShowWeightedSum(false);
      setBarWeights(Array(8).fill(0));
    }, baseDelay);

    addT(() => setRouterActive(true),                                    baseDelay + 200);
    addT(() => setBarWeights(td.weights),                                baseDelay + 500);
    addT(() => { setActiveExperts(td.top2); setShowWeightedSum(true); }, baseDelay + 900);
    addT(() => {
      td.top2.forEach(e => { utilizationCounts.current[e]++; });
      setUtilStep(s => s + 1);
      setProcessedTokens(prev => new Set([...prev, tokenKey]));
      if (onDone) onDone();
    }, baseDelay + 1200);
  }

  function processToken(tokenKey) {
    if (isAnimating) return;
    clearAll();
    setIsAnimating(true);
    runToken(tokenKey, 0, () => setIsAnimating(false));
  }

  function processAll() {
    if (isAnimating) return;
    clearAll();
    setIsAnimating(true);
    PRESET_TOKENS.forEach((tok, i) => {
      const isLast = i === PRESET_TOKENS.length - 1;
      runToken(tok, i * 1600, isLast ? () => setIsAnimating(false) : undefined);
    });
  }

  function reset() {
    clearAll();
    utilizationCounts.current = Array(8).fill(0);
    setDisplayToken(null);
    setSelectedToken(null);
    setProcessedTokens(new Set());
    setIsAnimating(false);
    setRouterActive(false);
    setActiveExperts([]);
    setShowWeightedSum(false);
    setBarWeights(Array(8).fill(0));
    setUtilStep(0);
  }

  // utilStep triggers re-render; snapshot ref here so render sees fresh counts
  const counts = [...utilizationCounts.current];

  return (
    <WidgetCard title="Mixture of Experts — sparse activation, dense knowledge" number="11.5" tryThis={tryThis}>

      {/* ── 1. Full-width flow diagram ────────────────────────────── */}
      <MainDiagram
        displayToken={displayToken}
        routerActive={routerActive}
        activeExperts={activeExperts}
        showWeightedSum={showWeightedSum}
        showSpec={showSpec}
        moeStyle={moeStyle}
      />

      {/* ── 2. Router bar chart + utilization heatmap ────────────── */}
      {/* Bar chart: flex:1 (≈444px), utilization: 160px fixed       */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', marginTop: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <RouterBarChart barWeights={barWeights} activeExperts={activeExperts} moeStyle={moeStyle} />
        </div>
        <div style={{ width: 160, flexShrink: 0 }}>
          <UtilizationHeatmap counts={counts} moeStyle={moeStyle} />
        </div>
      </div>

      {/* ── 3. Dense vs MoE comparison (optional, full width) ─────── */}
      {showComparison && <DenseVsMoEPanel moeStyle={moeStyle} />}

      {/* ── 4. Live stat strip ───────────────────────────────────── */}
      <StatStrip counts={counts} activeExperts={activeExperts} moeStyle={moeStyle} />

      {/* ── 5. Controls ──────────────────────────────────────────── */}
      <div style={{
        marginTop: '14px', paddingTop: '12px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
      }}>
        {PRESET_TOKENS.map(tok => {
          const isSel  = selectedToken === tok;
          const isDone = processedTokens.has(tok);
          return (
            <button key={tok}
              onClick={() => processToken(tok)}
              disabled={isAnimating}
              style={{
                fontFamily: mono, fontSize: '11px', padding: '5px 12px',
                background:   isSel ? rgba(C.accent, 0.1) : C.bg4,
                border:       `1px solid ${isSel ? C.accent : C.borderLt}`,
                borderRadius: '16px',
                cursor:  isAnimating ? 'not-allowed' : 'pointer',
                color:   isSel ? C.accent : C.textMid,
                display: 'flex', alignItems: 'center', gap: '4px',
                flexShrink: 0, transition: 'all 150ms ease',
              }}>
              {tok}
              {isDone && <span style={{ color: C.green, fontSize: '9px' }}>✓</span>}
            </button>
          );
        })}

        <div style={{ width: '1px', height: '22px', background: C.border, flexShrink: 0 }} />

        <button onClick={processAll} disabled={isAnimating} style={{
          fontFamily: mono, fontSize: '10px', padding: '5px 12px',
          background: C.bg4,
          border:     `1px solid ${isAnimating ? C.border : C.borderLt}`,
          borderRadius: '4px',
          cursor: isAnimating ? 'not-allowed' : 'pointer',
          color:  isAnimating ? C.muted : C.textMid,
          flexShrink: 0,
        }}>
          Process all 5
        </button>

        <button onClick={reset} style={{
          fontFamily: mono, fontSize: '10px', padding: '5px 12px',
          background: C.bg4, border: `1px solid ${C.borderLt}`,
          borderRadius: '4px', cursor: 'pointer',
          color: C.textMid, flexShrink: 0,
        }}>
          Reset
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[
            { label: 'Specializations',       val: showSpec,             set: () => setShowSpec(s => !s) },
            { label: 'Dense vs MoE',          val: showComparison,       set: () => setShowComparison(s => !s) },
            { label: 'Shared expert (DeepSeek)', val: moeStyle === 'shared', set: () => setMoeStyle(s => s === 'shared' ? 'classic' : 'shared') },
          ].map(({ label, val, set }) => (
            <button key={label} onClick={set} style={{
              fontFamily: mono, fontSize: '9px', padding: '4px 10px',
              background:   val ? rgba(C.accent, 0.08) : C.bg4,
              border:       `1px solid ${val ? C.accent : C.borderLt}`,
              borderRadius: '4px', cursor: 'pointer',
              color: val ? C.accent : C.muted,
              flexShrink: 0, transition: 'all 150ms ease',
            }}>
              {val ? '✓' : '○'} {label}
            </button>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
