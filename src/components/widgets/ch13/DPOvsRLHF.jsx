import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  text:      '#e8eaed',
  muted:     '#555555',
  mid:       '#888888',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  prose:     '#b8c4cc',
  codeBg:    '#0a0a0a',
};

const TINT = {
  accent: 'rgba(45,212,191,0.12)',
  orange: 'rgba(251,146,60,0.15)',
  purple: 'rgba(167,139,250,0.15)',
  green:  'rgba(52,211,153,0.15)',
  red:    'rgba(248,113,113,0.15)',
};

// Precomputed walkthrough numbers (one preference pair example).
// Loss is derived live from beta/deltaW/deltaL so the displayed number can
// never drift from the formula the widget walks the reader through.
const DPO_BETA = 0.1;
const DPO_DELTA_W = 0.5;
const DPO_DELTA_L = -1.6;
const DPO_SIG_INNER = DPO_BETA * (DPO_DELTA_W - DPO_DELTA_L); // β · (Δw − Δl)
const DPO_LOSS = -Math.log(1 / (1 + Math.exp(-DPO_SIG_INNER))); // −log σ(·)

const EX = {
  prompt: 'Explain why the sky is blue.',
  chosen: 'Sunlight is scattered by air molecules. Shorter blue wavelengths scatter more than red, so blue light dominates the sky’s color.',
  rejected: 'Because of physics. The atmosphere does some scattering thing.',
  logTheta_w:  -8.2,
  logTheta_l:  -12.4,
  logRef_w:    -8.7,
  logRef_l:    -10.8,
  beta:        DPO_BETA,
  deltaW:      DPO_DELTA_W,
  deltaL:      DPO_DELTA_L,
  loss:        DPO_LOSS,
  sigInner:    DPO_SIG_INNER,
};

const BAR_ROWS = [
  { label: 'Models needed',   rlhf: 100, dpo: 67,  rlhfText: '3  (π_θ, π_ref, r_φ)',  dpoText: '2  (π_θ, π_ref)' },
  { label: 'Training stages', rlhf: 100, dpo: 67,  rlhfText: '3  (SFT, RM, PPO)',     dpoText: '2  (SFT, DPO)' },
  { label: 'Compute cost',    rlhf: 100, dpo: 40,  rlhfText: 'High  (rollouts/step)', dpoText: 'Moderate' },
  { label: 'Stability',       rlhf: 50,  dpo: 88,  rlhfText: 'Sensitive  (PPO ~10 hp)', dpoText: 'Stable  (β only)' },
];

/* ───────────────────────────────────────────────────────────
   Tiny shared primitives
   ─────────────────────────────────────────────────────────── */

function SectionLabel({ children, color = C.muted, mb = 8 }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono',monospace",
      fontSize: '9px',
      color,
      letterSpacing: '0.08em',
      marginBottom: `${mb}px`,
      textTransform: 'uppercase',
      fontWeight: 600,
    }}>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '7px',
      cursor: disabled ? 'default' : 'pointer',
      userSelect: 'none',
      opacity: disabled ? 0.4 : 1,
    }}>
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '28px', height: '14px', borderRadius: '7px',
          background: checked ? C.accent : C.bg4,
          border: `1px solid ${checked ? C.accent : C.border}`,
          position: 'relative',
          transition: 'background 0.15s, border-color 0.15s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '1px',
          left: checked ? '14px' : '1px',
          width: '10px', height: '10px', borderRadius: '50%',
          background: checked ? '#0a0a0a' : C.muted,
          transition: 'left 0.15s',
        }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: C.muted }}>
        {label}
      </span>
    </label>
  );
}

/* ───────────────────────────────────────────────────────────
   SVG: Architecture diagrams (RLHF | DPO)
   ─────────────────────────────────────────────────────────── */

function Arrow({ x1, y1, x2, y2, color = C.borderLt, markerId = 'ah-lt', dash, width = 1.2 }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dash}
      markerEnd={`url(#${markerId})`}
    />
  );
}

function Box({ cx, cy, w, h, fill, stroke, strokeW = 1, dash, label, sub, labelColor, labelSize = 11, labelWeight = '400' }) {
  return (
    <g>
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeW}
        strokeDasharray={dash}
        rx="3"
      />
      <text
        x={cx}
        y={cy + (sub ? -1 : 4)}
        fontFamily="'JetBrains Mono', monospace"
        fontSize={labelSize}
        fontWeight={labelWeight}
        fill={labelColor}
        textAnchor="middle"
      >
        {label}
      </text>
      {sub && (
        <text
          x={cx}
          y={cy + 11}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9"
          fill={labelColor}
          textAnchor="middle"
          opacity="0.85"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function ArchDiagram() {
  // Side-by-side panels in one SVG (renders at full widget width).
  const VW = 580;
  const VH = 380;
  const PW = 280;
  const PL_L = 0;
  const PL_R = 300;
  const cxL = PL_L + PW / 2;
  const cxR = PL_R + PW / 2;

  const tickHead = (id, color) => (
    <marker
      id={id} key={id}
      viewBox="0 0 10 10"
      refX="8" refY="5"
      markerWidth="6" markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M0,0 L10,5 L0,10 z" fill={color} />
    </marker>
  );

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
      <defs>
        {tickHead('ah-lt',     C.borderLt)}
        {tickHead('ah-accent', C.accent)}
        {tickHead('ah-orange', C.orange)}
        {tickHead('ah-purple', C.purple)}
        {tickHead('ah-green',  C.green)}
        {tickHead('ah-red',    C.red)}
      </defs>

      {/* ═══════════════ LEFT PANEL — RLHF ═══════════════ */}
      <g>
        <rect x={PL_L} y={0} width={PW} height={VH}
              fill={C.bg2} stroke={C.border} strokeWidth="1" rx="6" />

        <text x={cxL} y={20}
              fontFamily="'Crimson Pro', serif"
              fontSize="15" fontWeight="600"
              fill={C.text} textAnchor="middle">
          RLHF — Three Models + PPO
        </text>

        {/* Badge */}
        <rect x={cxL - 105} y={30} width={210} height={15}
              fill={TINT.red} stroke="rgba(248,113,113,0.45)" strokeWidth="0.5" rx="3" />
        <text x={cxL} y={41}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9.5" fill={C.red} textAnchor="middle">
          3 models in memory: π_θ, π_ref, r_φ
        </text>
        <text x={cxL} y={56}
              fontFamily="'Inter', sans-serif"
              fontSize="10" fontStyle="italic"
              fill={C.mid} textAnchor="middle">
          Trained sequentially: SFT → RM → PPO
        </text>

        {/* Prompt */}
        <Box cx={cxL} cy={74} w={100} h={22}
             fill={C.bg4} stroke={C.borderLt}
             label="Prompt x" labelColor={C.mid} labelSize={11} />
        <Arrow x1={cxL} y1={85} x2={cxL} y2={102} />

        {/* Policy */}
        <Box cx={cxL} cy={114} w={150} h={26}
             fill={C.accentDim} stroke={C.accent} strokeW={1.3}
             label="Policy  π_θ" labelColor={C.accent} labelSize={11.5} labelWeight="600" />
        <Arrow x1={cxL} y1={127} x2={cxL} y2={150} />
        <text x={cxL + 8} y={142}
              fontFamily="'Inter', sans-serif" fontSize="9.5"
              fontStyle="italic" fill={C.muted}>
          generate
        </text>

        {/* Response */}
        <Box cx={cxL} cy={163} w={90} h={20}
             fill={C.bg4} stroke={C.borderLt}
             label="Response y" labelColor={C.mid} labelSize={10.5} />
        <Arrow x1={cxL} y1={173} x2={cxL} y2={192} />
        <text x={cxL + 8} y={185}
              fontFamily="'Inter', sans-serif" fontSize="9.5"
              fontStyle="italic" fill={C.muted}>
          scored by
        </text>

        {/* Reward Model */}
        <Box cx={cxL} cy={206} w={160} h={26}
             fill={TINT.orange} stroke={C.orange} strokeW={1.3}
             label="Reward Model  r_φ" labelColor={C.orange} labelSize={11.5} labelWeight="600" />
        <Arrow x1={cxL} y1={219} x2={cxL} y2={244} color={C.orange} markerId="ah-orange" />
        <text x={cxL + 8} y={234}
              fontFamily="'JetBrains Mono', monospace" fontSize="10"
              fill={C.orange}>
          r_φ(y)
        </text>

        {/* PPO Objective */}
        <g>
          <rect x={cxL - 120} y={246} width={240} height={46}
                fill={TINT.purple} stroke={C.purple} strokeWidth="1.3" rx="4" />
          <text x={cxL} y={260}
                fontFamily="'JetBrains Mono', monospace" fontSize="11"
                fontWeight="600" fill={C.purple} textAnchor="middle">
            PPO Objective
          </text>
          <text x={cxL} y={275}
                fontFamily="'JetBrains Mono', monospace" fontSize="9.5"
                fill={C.purple} textAnchor="middle">
            max  E[r_φ] − β·KL(π_θ ‖ π_ref)
          </text>
          <text x={cxL} y={287}
                fontFamily="'Inter', sans-serif" fontSize="9"
                fontStyle="italic" fill={C.mid} textAnchor="middle">
            requires fresh rollouts every step
          </text>
        </g>

        {/* Reference π_ref (off to the side) */}
        <g>
          <rect x={cxL + 30} y={306} width={100} height={24}
                fill={C.bg4} stroke={C.borderLt} strokeWidth="1"
                strokeDasharray="3 2" rx="3" />
          <text x={cxL + 80} y={321}
                fontFamily="'JetBrains Mono', monospace" fontSize="11"
                fill={C.mid} textAnchor="middle">
            Reference  π_ref
          </text>
        </g>
        <path
          d={`M ${cxL + 80} ${306} L ${cxL + 80} ${298} L ${cxL + 50} ${290}`}
          stroke={C.borderLt} strokeWidth="1.2" fill="none"
          strokeDasharray="2 2" markerEnd="url(#ah-lt)"
        />
        <text x={cxL + 95} y={302}
              fontFamily="'Inter', sans-serif" fontSize="9"
              fontStyle="italic" fill={C.muted} textAnchor="middle">
          KL constraint
        </text>

        {/* Gradient update label */}
        <text x={cxL - 20} y={353}
              fontFamily="'JetBrains Mono', monospace" fontSize="10"
              fill={C.purple} textAnchor="middle">
          ∇θ  gradient update
        </text>

        {/* Loop: PPO → Policy via left edge */}
        <path
          d={`M ${cxL - 80} ${292}
              C ${PL_L + 8} ${320}, ${PL_L + 8} ${114}, ${cxL - 75} ${114}`}
          stroke={C.purple} strokeWidth="1.2" fill="none"
          strokeDasharray="4 3" markerEnd="url(#ah-purple)"
        />
      </g>

      {/* ═══════════════ RIGHT PANEL — DPO ═══════════════ */}
      <g>
        <rect x={PL_R} y={0} width={PW} height={VH}
              fill={C.bg2} stroke={C.border} strokeWidth="1" rx="6" />

        <text x={cxR} y={20}
              fontFamily="'Crimson Pro', serif"
              fontSize="15" fontWeight="600"
              fill={C.text} textAnchor="middle">
          DPO — Two Models, Direct Loss
        </text>

        {/* Badge */}
        <rect x={cxR - 95} y={30} width={190} height={15}
              fill={TINT.green} stroke="rgba(52,211,153,0.45)" strokeWidth="0.5" rx="3" />
        <text x={cxR} y={41}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9.5" fill={C.green} textAnchor="middle">
          2 models in memory: π_θ, π_ref
        </text>
        <text x={cxR} y={56}
              fontFamily="'Inter', sans-serif"
              fontSize="10" fontStyle="italic"
              fill={C.mid} textAnchor="middle">
          No reward model. No rollouts. Single loss.
        </text>

        {/* Input — wider box */}
        <g>
          <rect x={cxR - 125} y={66} width={250} height={28}
                fill={C.bg4} stroke={C.borderLt} strokeWidth="1" rx="3" />
          <text x={cxR} y={78}
                fontFamily="'JetBrains Mono', monospace" fontSize="10"
                fill={C.mid} textAnchor="middle">
            Prompt x  +  chosen y_w  +  rejected y_l
          </text>
          <text x={cxR} y={90}
                fontFamily="'Inter', sans-serif" fontSize="9"
                fontStyle="italic" fill={C.muted} textAnchor="middle">
            preference pair (no rollout needed)
          </text>
        </g>

        <Arrow x1={cxR} y1={94} x2={cxR} y2={112} />
        <text x={cxR + 8} y={106}
              fontFamily="'Inter', sans-serif" fontSize="9"
              fontStyle="italic" fill={C.muted}>
          fed through both
        </text>

        {/* Policy */}
        <g>
          <rect x={cxR - 110} y={114} width={220} height={38}
                fill={C.accentDim} stroke={C.accent} strokeWidth="1.3" rx="4" />
          <text x={cxR} y={128}
                fontFamily="'JetBrains Mono', monospace" fontSize="11.5"
                fontWeight="600" fill={C.accent} textAnchor="middle">
            Policy  π_θ
          </text>
          <text x={cxR} y={143}
                fontFamily="'JetBrains Mono', monospace" fontSize="9.5"
                fill={C.accent} textAnchor="middle">
            log π_θ(y_w | x),   log π_θ(y_l | x)
          </text>
        </g>

        <Arrow x1={cxR} y1={152} x2={cxR} y2={174} />

        {/* Reference */}
        <g>
          <rect x={cxR - 110} y={176} width={220} height={38}
                fill={C.bg4} stroke={C.borderLt} strokeWidth="1.2"
                strokeDasharray="3 2" rx="4" />
          <text x={cxR} y={190}
                fontFamily="'JetBrains Mono', monospace" fontSize="11.5"
                fontWeight="600" fill={C.mid} textAnchor="middle">
            Reference  π_ref
          </text>
          <text x={cxR} y={205}
                fontFamily="'JetBrains Mono', monospace" fontSize="9.5"
                fill={C.mid} textAnchor="middle">
            log π_ref(y_w | x),   log π_ref(y_l | x)
          </text>
        </g>

        {/* Two arrows merging into DPO Loss */}
        <path
          d={`M ${cxR - 60} ${214}
              L ${cxR - 60} ${236}
              L ${cxR - 10} ${254}`}
          stroke={C.green} strokeWidth="1.2" fill="none"
          markerEnd="url(#ah-green)"
        />
        <path
          d={`M ${cxR + 60} ${214}
              L ${cxR + 60} ${236}
              L ${cxR + 10} ${254}`}
          stroke={C.green} strokeWidth="1.2" fill="none"
          markerEnd="url(#ah-green)"
        />
        <text x={cxR} y={234}
              fontFamily="'Inter', sans-serif" fontSize="9"
              fontStyle="italic" fill={C.muted} textAnchor="middle">
          combine log-prob ratios
        </text>

        {/* DPO Loss */}
        <g>
          <rect x={cxR - 125} y={256} width={250} height={56}
                fill={TINT.green} stroke={C.green} strokeWidth="1.3" rx="4" />
          <text x={cxR} y={270}
                fontFamily="'JetBrains Mono', monospace" fontSize="11"
                fontWeight="600" fill={C.green} textAnchor="middle">
            DPO Loss
          </text>
          <text x={cxR} y={285}
                fontFamily="'JetBrains Mono', monospace" fontSize="10"
                fill={C.green} textAnchor="middle">
            L = −log σ( β · [Δw − Δl] )
          </text>
          <text x={cxR} y={298}
                fontFamily="'JetBrains Mono', monospace" fontSize="8.5"
                fill={C.green} opacity="0.85" textAnchor="middle">
            Δw = log π_θ/π_ref  (chosen)
          </text>
          <text x={cxR} y={308}
                fontFamily="'JetBrains Mono', monospace" fontSize="8.5"
                fill={C.green} opacity="0.85" textAnchor="middle">
            Δl = log π_θ/π_ref  (rejected)
          </text>
        </g>

        {/* Gradient update label */}
        <text x={cxR - 20} y={335}
              fontFamily="'JetBrains Mono', monospace" fontSize="10"
              fill={C.green} textAnchor="middle">
          ∇θ  gradient update
        </text>

        {/* Loop: DPO Loss → Policy */}
        <path
          d={`M ${cxR - 80} ${312}
              C ${PL_R + 8} ${330}, ${PL_R + 8} ${133}, ${cxR - 110} ${133}`}
          stroke={C.green} strokeWidth="1.2" fill="none"
          strokeDasharray="4 3" markerEnd="url(#ah-green)"
        />

        <text x={cxR} y={360}
              fontFamily="'Inter', sans-serif" fontSize="9.5"
              fontStyle="italic" fill={C.green} textAnchor="middle">
          one supervised step per preference pair
        </text>
      </g>
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────
   Practical comparison — HTML bar chart (crisp text)
   ─────────────────────────────────────────────────────────── */

function ComparisonBars() {
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          color: C.text,
        }}>
          Practical comparison
        </div>
        <div style={{
          display: 'flex',
          gap: '14px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: C.muted,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 8, background: C.orange, borderRadius: 1, display: 'inline-block' }} />
            RLHF
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 8, background: C.accent, borderRadius: 1, display: 'inline-block' }} />
            DPO
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {BAR_ROWS.map((row) => (
          <div key={row.label} style={{
            display: 'grid',
            gridTemplateColumns: '128px 1fr',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: C.mid,
              textAlign: 'right',
            }}>
              {row.label}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* RLHF row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: `${row.rlhf}%`, maxWidth: '60%' }}>
                  <div style={{
                    height: '9px',
                    background: C.orange,
                    opacity: 0.85,
                    borderRadius: '2px',
                  }} />
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: C.orange,
                  whiteSpace: 'nowrap',
                }}>
                  {row.rlhfText}
                </span>
              </div>

              {/* DPO row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: `${row.dpo}%`, maxWidth: '60%' }}>
                  <div style={{
                    height: '9px',
                    background: C.accent,
                    borderRadius: '2px',
                  }} />
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: C.accent,
                  whiteSpace: 'nowrap',
                }}>
                  {row.dpoText}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   Walkthrough
   ─────────────────────────────────────────────────────────── */

function ValueCell({ label, value, color, mono = true }) {
  return (
    <div style={{
      padding: '8px 11px',
      background: C.codeBg,
      border: `1px solid ${C.border}`,
      borderRadius: '5px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        color: C.muted,
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif",
        fontSize: '13px',
        color: color || C.text,
        fontWeight: 500,
      }}>
        {value}
      </div>
    </div>
  );
}

function Walkthrough({ step, showRLHFExpansion }) {
  return (
    <div>
      {/* Preference pair: prompt + responses side-by-side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px',
        marginBottom: '14px',
      }}>
        <div style={{
          border: `1px solid ${C.border}`,
          borderRadius: '6px',
          padding: '9px 11px',
          background: C.codeBg,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: C.mid,
            marginBottom: '5px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Prompt x
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11.5px',
            color: C.prose,
            lineHeight: 1.55,
          }}>
            "{EX.prompt}"
          </div>
        </div>
        <div style={{
          border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.accent}`,
          borderRadius: '6px',
          padding: '9px 11px',
          background: C.codeBg,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: C.accent,
            marginBottom: '5px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Chosen  y_w
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11.5px',
            color: C.prose,
            lineHeight: 1.55,
          }}>
            {EX.chosen}
          </div>
        </div>
        <div style={{
          border: `1px solid ${C.border}`,
          borderLeft: `3px solid rgba(248,113,113,0.5)`,
          borderRadius: '6px',
          padding: '9px 11px',
          background: C.codeBg,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: C.red,
            marginBottom: '5px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Rejected  y_l
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11.5px',
            color: C.prose,
            lineHeight: 1.55,
          }}>
            {EX.rejected}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div style={{
        background: C.bg2,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        padding: '14px 16px',
      }}>
        {step === 1 && (
          <div>
            <SectionLabel color={C.accent}>Step 1 — Compute log-probabilities</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: '10px',
              marginBottom: '10px',
            }}>
              <ValueCell label="log π_θ(y_w | x)"   value={EX.logTheta_w.toString()} color={C.accent} />
              <ValueCell label="log π_ref(y_w | x)" value={EX.logRef_w.toString()}   color={C.mid} />
              <ValueCell label="log π_θ(y_l | x)"   value={EX.logTheta_l.toString()} color={C.accent} />
              <ValueCell label="log π_ref(y_l | x)" value={EX.logRef_l.toString()}   color={C.mid} />
            </div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11.5px',
              color: C.muted,
              fontStyle: 'italic',
              lineHeight: 1.55,
              margin: 0,
            }}>
              Run a single forward pass through each model on both responses. No sampling required.
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <SectionLabel color={C.accent}>Step 2 — Compute log-ratios</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                background: C.codeBg,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.accent}`,
                borderRadius: '5px',
                padding: '10px 14px',
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: C.muted,
                  marginBottom: '5px',
                }}>
                  Δw  =  log π_θ(y_w)  −  log π_ref(y_w)
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px',
                  color: C.text,
                }}>
                  = (−8.2) − (−8.7)  =  <span style={{ color: C.green, fontWeight: 600 }}>+0.5</span>
                </div>
              </div>
              <div style={{
                background: C.codeBg,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.red}`,
                borderRadius: '5px',
                padding: '10px 14px',
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: C.muted,
                  marginBottom: '5px',
                }}>
                  Δl  =  log π_θ(y_l)  −  log π_ref(y_l)
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px',
                  color: C.text,
                }}>
                  = (−12.4) − (−10.8)  =  <span style={{ color: C.red, fontWeight: 600 }}>−1.6</span>
                </div>
              </div>
            </div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11.5px',
              color: C.green,
              fontStyle: 'italic',
              lineHeight: 1.55,
              margin: 0,
            }}>
              Δw &gt; Δl: policy has shifted toward the chosen response, away from the rejected.
            </p>
          </div>
        )}

        {step === 3 && (
          <div>
            <SectionLabel color={C.accent}>Step 3 — DPO loss</SectionLabel>
            <div style={{
              background: C.codeBg,
              border: `1px solid ${C.green}`,
              borderRadius: '5px',
              padding: '12px 16px',
              marginBottom: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              color: C.text,
              lineHeight: 1.85,
            }}>
              <div style={{ color: C.muted }}>β = {EX.beta}    (typical value)</div>
              <div>L = −log σ( β · ( Δw − Δl ) )</div>
              <div>&nbsp;&nbsp;&nbsp;= −log σ( 0.1 · ( 0.5 − (−1.6) ) )</div>
              <div>&nbsp;&nbsp;&nbsp;= −log σ( {EX.sigInner.toFixed(2)} )</div>
              <div>&nbsp;&nbsp;&nbsp;= <span style={{ color: C.green, fontWeight: 600, fontSize: '14px' }}>{EX.loss.toFixed(3)}</span></div>
            </div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11.5px',
              color: C.muted,
              fontStyle: 'italic',
              lineHeight: 1.55,
              margin: 0,
            }}>
              Lower loss = policy more strongly prefers chosen over rejected. One gradient step. Done.
            </p>

            {showRLHFExpansion && (
              <div style={{
                background: 'rgba(251,146,60,0.06)',
                border: `1px solid rgba(251,146,60,0.35)`,
                borderRadius: '6px',
                padding: '11px 14px',
                marginTop: '12px',
              }}>
                <SectionLabel color={C.orange}>What RLHF would do instead</SectionLabel>
                <ol style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11.5px',
                  color: C.prose,
                  lineHeight: 1.7,
                  paddingLeft: '20px',
                  margin: 0,
                }}>
                  <li>Train a reward model r_φ on the preference dataset.</li>
                  <li>Sample new responses y from π_θ (rollouts at every step).</li>
                  <li>Score with r_φ(y). Estimate KL against π_ref.</li>
                  <li>PPO clipped-policy update toward higher r_φ, subject to KL.</li>
                </ol>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11.5px',
                  color: C.orange,
                  fontStyle: 'italic',
                  margin: '8px 0 0',
                }}>
                  Many more moving parts. Same goal.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   Horizontal stats strip (below visualizations)
   ─────────────────────────────────────────────────────────── */

function StatPair({ label, value, color }) {
  return (
    <div style={{ marginBottom: '7px' }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        color: C.muted,
        marginBottom: '2px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11.5px',
        color: color || C.text,
        lineHeight: 1.2,
      }}>
        {value}
      </div>
    </div>
  );
}

function StatsStrip({ step, stat }) {
  return (
    <div style={{
      display: 'flex',
      background: C.bg2,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Section 1: DPO advantage */}
      <div style={{ flex: '1.05 1 0', minWidth: 0, padding: '12px 14px' }}>
        <SectionLabel mb={10}>DPO advantage</SectionLabel>
        <StatPair label="Models needed"   value="2  vs  3"            color={C.green} />
        <StatPair label="Training stages" value="2  vs  3"            color={C.green} />
        <StatPair label="Hyperparams"     value="β only  vs  ~10"     color={C.green} />
        <StatPair label="Stability"       value="High  vs  Sensitive" color={C.green} />
      </div>

      <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />

      {/* Section 2: When to use which */}
      <div style={{ flex: '1.1 1 0', minWidth: 0, padding: '12px 14px' }}>
        <SectionLabel mb={10}>When to use which</SectionLabel>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          color: C.prose,
          lineHeight: 1.55,
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: C.accent,
              fontWeight: 600,
              fontSize: '10.5px',
            }}>
              DPO
            </span>
            {' '}— default for most preference tuning. Used by most open-weight chat models.
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: C.orange,
              fontWeight: 600,
              fontSize: '10.5px',
            }}>
              RLHF
            </span>
            {' '}— iterative loops where the reward model is reused, or very large datasets.
          </div>
          <div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: C.purple,
              fontWeight: 600,
              fontSize: '10.5px',
            }}>
              RLVR / GRPO
            </span>
            {' '}— neither: reasoning-heavy domains (math, code) now train frontier
            models with RL against verifiable rewards. See Reasoning Models &amp; Test-Time
            Compute for RLVR/GRPO details.
          </div>
        </div>
      </div>

      <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />

      {/* Section 3: Asymptotic equivalence */}
      <div style={{ flex: '1.15 1 0', minWidth: 0, padding: '12px 14px' }}>
        <SectionLabel mb={10}>Asymptotic equivalence</SectionLabel>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          color: C.prose,
          lineHeight: 1.55,
          margin: 0,
        }}>
          The DPO loss is derived from the same Bradley-Terry preference model RLHF assumes.
          With unlimited data, both converge to the same optimal policy.
        </p>
      </div>

      <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />

      {/* Section 4: Live walkthrough */}
      <div style={{ flex: '0.9 1 0', minWidth: 0, padding: '12px 14px' }}>
        <SectionLabel mb={10}>Walkthrough</SectionLabel>
        <StatPair label="Step"  value={`${step} / 3`}            color={C.text} />
        <StatPair label="Δw"    value={stat.dW}                  color={step >= 2 ? C.green : C.muted} />
        <StatPair label="Δl"    value={stat.dL}                  color={step >= 2 ? C.red   : C.muted} />
        <StatPair label="β"     value={EX.beta.toString()}       color={C.mid} />
        <StatPair label="Loss"  value={stat.loss}                color={step >= 3 ? C.green : C.muted} />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   Main component
   ─────────────────────────────────────────────────────────── */

export default function DPOvsRLHF({ tryThis }) {
  const [step, setStep] = useState(1);
  const [showRLHF, setShowRLHF] = useState(false);
  const [showBars, setShowBars] = useState(true);

  const reset = () => {
    setStep(1);
    setShowRLHF(false);
    setShowBars(true);
  };

  const stat = (() => {
    if (step === 1) return { dW: '—',                       dL: '—',                       loss: '—' };
    if (step === 2) return { dW: `+${EX.deltaW.toFixed(1)}`, dL: `${EX.deltaL.toFixed(1)}`, loss: '—' };
    return                 { dW: `+${EX.deltaW.toFixed(1)}`, dL: `${EX.deltaL.toFixed(1)}`, loss: EX.loss.toFixed(3) };
  })();

  return (
    <WidgetCard
      title="DPO vs RLHF — direct preference optimization vs reward modeling"
      number="13.3"
      tryThis={tryThis}
    >
      {/* Architecture diagrams — full width */}
      <div style={{
        background: C.codeBg,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        padding: '10px',
        marginBottom: '14px',
      }}>
        <ArchDiagram />
      </div>

      {/* Comparison bars — full width, HTML for crisp text */}
      {showBars && (
        <div style={{
          background: C.codeBg,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '14px 18px 16px',
          marginBottom: '14px',
        }}>
          <ComparisonBars />
        </div>
      )}

      {/* Walkthrough — full width */}
      <Walkthrough step={step} showRLHFExpansion={showRLHF} />

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
        paddingTop: '14px',
        marginTop: '14px',
        marginBottom: '14px',
        borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: C.muted,
            marginRight: '2px',
          }}>
            Step
          </span>
          {[1, 2, 3].map((n) => {
            const active = step === n;
            return (
              <button
                key={n}
                onClick={() => setStep(n)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: active ? 600 : 400,
                  color: active ? C.accent : C.mid,
                  background: active ? C.accentDim : 'transparent',
                  border: `1px solid ${active ? C.accent : C.border}`,
                  borderRadius: '4px',
                  padding: '4px 11px',
                  cursor: 'pointer',
                  minWidth: '30px',
                  transition: 'color 0.15s, background 0.15s, border-color 0.15s',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>

        <button
          onClick={reset}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: C.muted,
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: '4px',
            padding: '4px 12px',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = C.text;
            e.currentTarget.style.borderColor = C.borderLt;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = C.muted;
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          ↺  Reset
        </button>

        <div style={{ width: '1px', height: '18px', background: C.border }} />

        <Toggle
          label="Show RLHF expansion"
          checked={showRLHF}
          onChange={setShowRLHF}
          disabled={step !== 3}
        />
        <Toggle
          label="Show bar comparison"
          checked={showBars}
          onChange={setShowBars}
        />
      </div>

      {/* Stats strip — full width below everything */}
      <StatsStrip step={step} stat={stat} />
    </WidgetCard>
  );
}
