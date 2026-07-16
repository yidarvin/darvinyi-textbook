import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO  = "'JetBrains Mono', monospace";
const INTER = "'Inter', sans-serif";

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  math:      '#fbbf24',
  green:     '#34d399',
  muted:     '#555555',
  mid:       '#888888',
  text:      '#e8eaed',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
};

// ── SVG layout ─────────────────────────────────────────────────────────────────
// Three wide horizontal boxes stacked vertically.
// Full viewBox width → renders near 1-to-1 inside the 616px widget body.

const VW    = 580;   // viewBox width
const VH    = 415;   // viewBox height
const BX    = 10;    // box left-x
const BW    = 560;   // box width
const BH    = 95;    // box height
const HDR_H = 28;    // header strip height
const GAP   = 40;    // vertical gap between boxes (for arrows)

// Box top-y positions: BOX_Y[i] = 20 + i*(BH+GAP)
const BY = [20, 155, 290];

// Vertical section dividers (split each box into Input | Process | Output)
const SEC1 = BX + 160;   // = 170
const SEC2 = BX + 380;   // = 390

// Horizontal center-x of each sub-section
const ICX = BX + 80;                       // = 90   (input)
const PCX = (SEC1 + SEC2) / 2;             // = 280  (process)
const OCX = (SEC2 + (BX + BW)) / 2;       // = 480  (output)

// Arrow center-x (center of box)
const ARR_X = BX + BW / 2;  // = 290

// Y offsets from each box's top-y
const OI  = 50;   // icon center
const OT1 = 68;   // primary text
const OT2 = 80;   // secondary text (small)
const OP1 = 50;   // process text line 1
const OP2 = 64;   // process text line 2 (formula)
const OP3 = 78;   // process text line 3 (optional)

const STAGES = [
  {
    short: 'SFT',
    header: 'SFT — recap (Ch. 13)',
    title:  'Stage 1: Supervised Fine-Tuning — recap',
    desc:   "Chapter 13 covers SFT in full. In the RL view, all that matters here is the output: a policy π_SFT fine-tuned on human demonstrations via ordinary cross-entropy loss. Stage 3's PPO both starts from π_SFT and is penalized (via KL) for drifting too far from it.",
    key:    'Produces π_SFT — the starting point and KL reference for the RL stage.',
    metrics:'Full derivation: Chapter 13',
  },
  {
    short: 'Reward Model',
    header: 'Reward Model Training',
    title:  'Stage 2: Reward Model Training',
    desc:   'Human annotators compare pairs of SFT model outputs and pick the better one. A reward model R_φ is trained on these comparisons via the Bradley-Terry model: P(a preferred over b) = sigmoid(R(a) − R(b)).',
    key:    'Distills human judgment into a scalar reward signal.',
    metrics:'Pairs: ~10K–500K comps\nLoss: binary cross-entropy\nAccuracy: ~70–75%',
  },
  {
    short: 'PPO',
    header: 'PPO Fine-Tuning',
    title:  'Stage 3: PPO Fine-Tuning',
    desc:   'The SFT model acts as the policy and is optimized with PPO against R_φ. A KL divergence penalty keeps the policy close to the SFT reference model, preventing reward hacking while maximizing human-preferred behavior.',
    key:    'Optimizes behavior according to the learned human preference.',
    metrics:'PPO steps: 1K–10K\nKL coeff β: 0.01–0.1\nObj: R_φ(y) − β·KL(π‖π_SFT)',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function RLHFPipeline({ tryThis }) {
  const [stage,    setStage]    = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [flash,    setFlash]    = useState(false);
  const autoRef  = useRef(null);
  const flashRef = useRef(null);

  function next() { setStage(s => (s + 1) % 4); }

  useEffect(() => {
    if (stage === 3) {
      setFlash(true);
      flashRef.current = setTimeout(() => setFlash(false), 650);
    }
    return () => clearTimeout(flashRef.current);
  }, [stage]);

  useEffect(() => {
    if (autoPlay) {
      autoRef.current = setInterval(() => setStage(s => s >= 3 ? 1 : s + 1), 2000);
    }
    return () => clearInterval(autoRef.current);
  }, [autoPlay]);

  function reset() {
    clearInterval(autoRef.current);
    setStage(0);
    setAutoPlay(false);
  }

  const lit  = n => flash || stage === n;
  const alit = i => stage === i + 1;
  const sd   = stage > 0 ? STAGES[stage - 1] : null;

  return (
    <WidgetCard title="RLHF Pipeline — from human preferences to model behavior" number="12.5" tryThis={tryThis}>

      {/* ── Full-width SVG flowchart ── */}
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <marker id="rlhf-a-on"  markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <path d="M0 0L7 2.5L0 5Z" fill={C.accent} />
          </marker>
          <marker id="rlhf-a-off" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <path d="M0 0L7 2.5L0 5Z" fill={C.borderLt} />
          </marker>
          {/* Header clip paths — rounded top, flat bottom */}
          {BY.map((by, i) => (
            <clipPath key={i} id={`rlhf-hc${i}`}>
              <rect x={BX} y={by} width={BW} height={HDR_H} />
            </clipPath>
          ))}
        </defs>

        {/* ── DOWN ARROWS between boxes ── */}
        {[0, 1].map(i => {
          const y1 = BY[i] + BH;
          const y2 = BY[i + 1] - 7;
          const ym = (y1 + BY[i + 1]) / 2;
          const on = alit(i);
          return (
            <g key={i}>
              <line x1={ARR_X} y1={y1} x2={ARR_X} y2={y2}
                stroke={on ? C.accent : C.borderLt} strokeWidth={on ? 2 : 1.5}
                markerEnd={on ? 'url(#rlhf-a-on)' : 'url(#rlhf-a-off)'}
                style={{ transition: 'stroke 0.3s' }} />
              <text x={ARR_X + 10} y={ym + 4} textAnchor="start"
                fill={on ? C.mid : C.muted} fontSize="9" fontFamily={INTER}
                style={{ transition: 'fill 0.3s' }}>
                {i === 0 ? 'SFT responses' : 'R_phi scores'}
              </text>
              {on && (
                <circle key={`ad${i}-${stage}`} r="4" fill={C.accent} opacity="0.9">
                  <animateMotion dur="0.55s" repeatCount="indefinite" calcMode="linear"
                    path={`M ${ARR_X} ${y1} L ${ARR_X} ${y2 - 4}`} />
                </circle>
              )}
            </g>
          );
        })}

        {/* ── STAGE BOXES ── */}
        {BY.map((by, i) => {
          const n  = i + 1;
          const hi = lit(n);
          const ct = by + HDR_H;   // content-area top y

          return (
            <g key={i}>
              {/* Box fill */}
              <rect x={BX} y={by} width={BW} height={BH} rx="8"
                fill={hi ? C.accentDim : C.bg3}
                style={{ transition: 'fill 0.35s' }} />

              {/* Header fill — rounded top corners only (via clipPath) */}
              <rect x={BX} y={by} width={BW} height={HDR_H + 8} rx="8"
                fill={C.bg4} clipPath={`url(#rlhf-hc${i})`} />
              <line x1={BX} y1={ct} x2={BX + BW} y2={ct}
                stroke={C.border} strokeWidth="1" />

              {/* Header text */}
              <text x={BX + 14} y={by + 10} textAnchor="start"
                fill={C.muted} fontSize="8" fontFamily={MONO} letterSpacing="0.06em">
                {`STAGE ${n}`}
              </text>
              <text x={BX + BW / 2} y={by + 22} textAnchor="middle"
                fill={hi ? C.accent : C.text} fontSize="12" fontFamily={INTER} fontWeight="600"
                style={{ transition: 'fill 0.35s' }}>
                {STAGES[i].header}
              </text>

              {/* Section dividers */}
              <line x1={SEC1} y1={ct} x2={SEC1} y2={by + BH}
                stroke={C.border} strokeWidth="1" />
              <line x1={SEC2} y1={ct} x2={SEC2} y2={by + BH}
                stroke={C.border} strokeWidth="1" />

              {/* ── INPUT section ── */}
              {i === 0 && <DocStackIcon  cx={ICX} cy={by + OI} hi={hi} />}
              {i === 1 && <ChatBubbles   cx={ICX} cy={by + OI} hi={hi} />}
              {i === 2 && <TripleBoxIcon cx={ICX} cy={by + OI} hi={hi} />}

              <text x={ICX} y={by + OT1} textAnchor="middle"
                fill={hi ? C.text : C.mid} fontSize="10" fontFamily={MONO}>
                {i === 0 ? 'Demonstrations' : i === 1 ? 'Human prefs' : 'π + R_φ + KL'}
              </text>
              <text x={ICX} y={by + OT2} textAnchor="middle"
                fill={C.muted} fontSize="8.5" fontFamily={INTER}>
                {i === 0 ? '(human-written)' : i === 1 ? '(paired outputs)' : '(ref policy)'}
              </text>

              {/* ── PROCESS section ── */}
              <text x={PCX} y={by + OP1} textAnchor="middle"
                fill={hi ? C.text : C.mid} fontSize="11" fontFamily={INTER}>
                {i === 0 ? 'Supervised learning' : i === 1 ? 'Bradley-Terry model' : 'PPO + KL penalty'}
              </text>
              <text x={PCX} y={by + OP2} textAnchor="middle"
                fill={hi ? C.math : C.muted} fontSize="9" fontFamily={MONO}>
                {i === 0 ? 'loss: cross-entropy'
                 : i === 1 ? 'P(a>b) = σ(R(a)−R(b))'
                 : 'max E[R_φ] − β·KL(π||π_SFT)'}
              </text>
              {i === 2 && (
                <text x={PCX} y={by + OP3} textAnchor="middle"
                  fill={C.muted} fontSize="8.5" fontFamily={INTER}>
                  KL penalty prevents reward hacking
                </text>
              )}

              {/* ── OUTPUT section ── */}
              {i === 0 && <ModelCheckIcon cx={OCX} cy={by + OI} hi={hi} />}
              {i === 1 && <RphiCircleIcon cx={OCX} cy={by + OI} hi={hi} />}
              {i === 2 && <GoldStarIcon   cx={OCX} cy={by + OI} hi={hi} />}

              <text x={OCX} y={by + OT1} textAnchor="middle"
                fill={hi ? C.accent : C.mid} fontSize="10" fontFamily={MONO}
                style={{ transition: 'fill 0.35s' }}>
                {i === 0 ? 'SFT Model' : i === 1 ? 'Reward Model' : 'RLHF Model'}
              </text>
              <text x={OCX} y={by + OT2} textAnchor="middle"
                fill={C.muted} fontSize="8.5" fontFamily={INTER}>
                {i === 0 ? '(capable base)' : i === 1 ? '(scores quality)' : '(aligned LLM)'}
              </text>

              {/* Box border — drawn last so it's always on top */}
              <rect x={BX} y={by} width={BW} height={BH} rx="8" fill="none"
                stroke={hi ? C.accent : C.borderLt} strokeWidth={hi ? 2 : 1.5}
                style={{ transition: 'stroke 0.35s' }} />

              {/* Internal flow dot (left → right when stage is active) */}
              {stage === n && (
                <circle key={`fd${i}-${stage}`} r="3.5" fill={C.accent} opacity="0.85">
                  <animateMotion dur="1.2s" repeatCount="indefinite" calcMode="linear"
                    path={`M ${ICX + 10} ${by + OI} L ${OCX - 10} ${by + OI}`} />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 0 10px' }}>
        <Btn primary onClick={next}>Next Stage</Btn>
        <Btn active={autoPlay} onClick={() => setAutoPlay(p => !p)}>
          {autoPlay ? '⏹ Stop' : '▶ Auto-play'}
        </Btn>
        <Btn onClick={reset}>↺ Reset</Btn>
        <span style={{ fontFamily: MONO, fontSize: '10px', color: C.mid,
                       marginLeft: 'auto', letterSpacing: '0.04em' }}>
          {stage === 0 ? '0/3 — idle' : `${stage}/3 — ${STAGES[stage - 1].short}`}
        </span>
      </div>

      {/* ── Detail panel + Stats panel ── */}
      <div data-mobile-stack style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>

        {/* Detail panel */}
        <div style={{ flex: 1, minWidth: 0, background: C.bg3,
                      borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
                      padding: '14px 18px', minHeight: '120px' }}>
          {stage === 0 ? (
            <div style={{ color: C.muted, fontFamily: INTER, fontSize: '12px',
                          lineHeight: 1.55, textAlign: 'center', paddingTop: '28px' }}>
              Press "Next Stage" to walk through each phase of the RLHF pipeline.
            </div>
          ) : (
            <>
              <div style={{ fontFamily: INTER, fontSize: '13px', fontWeight: '600',
                            color: C.text, marginBottom: '7px' }}>
                {sd.title}
              </div>
              <div style={{ fontFamily: INTER, fontSize: '12px', color: '#b8c4cc',
                            lineHeight: 1.55, marginBottom: '7px' }}>
                {sd.desc}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: C.accent,
                            letterSpacing: '0.04em' }}>
                {sd.key}
              </div>
            </>
          )}
        </div>

        {/* Stats panel */}
        <div data-mobile-panel style={{ width: 180, flexShrink: 0, background: C.bg2,
                      border: `1px solid ${C.border}`, borderRadius: '8px',
                      padding: '14px 12px' }}>
          <SRow k="Current stage" v={stage === 0 ? 'idle' : `${stage} / 3`}
            vc={stage === 0 ? C.muted : C.accent} />
          <Hr />
          <SLbl>Stage 1 — SFT (recap)</SLbl>
          <SRow k="Detail" v="see Ch. 13"    vc={stage === 1 ? C.accent : C.mid} />
          <SRow k="Output" v="π_SFT"          vc={stage === 1 ? C.text   : C.mid} />
          <Hr />
          <SLbl>Stage 2 — Reward</SLbl>
          <SRow k="Method" v="Bradley-Terry"  vc={stage === 2 ? C.accent : C.mid} />
          <SRow k="Data"   v="Prefs"          vc={stage === 2 ? C.text   : C.mid} />
          <SRow k="Loss"   v="Binary CE"      vc={stage === 2 ? C.math   : C.mid} />
          <Hr />
          <SLbl>Stage 3 — PPO</SLbl>
          <SRow k="Method" v="PPO"            vc={stage === 3 ? C.accent : C.mid} />
          <SRow k="Obj."   v="R−β·KL"         vc={stage === 3 ? C.math   : C.mid} />
          <SRow k="KL"     v="no hacking"     vc={stage === 3 ? C.text   : C.mid} />
          <Hr />
          <SLbl>Key papers</SLbl>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: C.mid, lineHeight: 1.7 }}>
            InstructGPT (2022)<br />
            Constitutional AI (2022)<br />
            DPO (2023)
          </div>
        </div>
      </div>

      {/* ── Variant table ── */}
      <VariantTable />

    </WidgetCard>
  );
}

// ── Shared helpers ──────────────────────────────────────────────────────────────

function Btn({ children, onClick, primary, active }) {
  const on = primary || active;
  return (
    <button onClick={onClick} style={{
      fontFamily: MONO, fontSize: '11px', padding: '5px 12px', cursor: 'pointer',
      background: on ? C.accentDim : C.bg4,
      color:      on ? C.accent    : C.mid,
      border:     `1px solid ${on ? C.accent : C.borderLt}`,
      borderRadius: '4px', letterSpacing: '0.02em',
    }}>
      {children}
    </button>
  );
}

function SLbl({ children }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: '8px', color: C.muted,
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
      {children}
    </div>
  );
}

function SRow({ k, v, vc = C.text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', marginBottom: '3px' }}>
      <span style={{ fontFamily: MONO, fontSize: '9px',  color: C.muted }}>{k}</span>
      <span style={{ fontFamily: MONO, fontSize: '10px', color: vc    }}>{v}</span>
    </div>
  );
}

function Hr() {
  return <div style={{ height: 1, background: C.border, margin: '7px 0' }} />;
}

function VariantTable() {
  const rows = [
    { a: 'RLHF', r: 'Human prefs',    u: 'Instruction following, harmlessness' },
    { a: 'RLEF', r: 'Code execution', u: 'Coding tasks (pass/fail tests)' },
    { a: 'RLVR', r: 'Verifier',       u: 'Reasoning, DeepSeek-R1' },
  ];
  const TH = { fontFamily: MONO, fontSize: '10px', color: C.muted, fontWeight: '600',
               padding: '5px 8px', textAlign: 'left', borderBottom: `1px solid ${C.border}` };
  const TD = { fontFamily: MONO, fontSize: '10px', color: C.mid,   padding: '5px 8px' };
  return (
    <div style={{ background: C.bg4, padding: '12px', borderRadius: '6px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={TH}>Approach</th>
            <th style={TH}>Reward Source</th>
            <th style={TH}>Used For</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}>
              <td style={{ ...TD, color: C.accent }}>{r.a}</td>
              <td style={TD}>{r.r}</td>
              <td style={TD}>{r.u}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── SVG Icons ───────────────────────────────────────────────────────────────────

function DocStackIcon({ cx, cy, hi }) {
  const c = hi ? C.accent : C.muted;
  return (
    <g>
      <rect x={cx - 3} y={cy - 10} width="14" height="13" rx="1"
        fill={C.bg4} stroke={C.borderLt} strokeWidth="1" />
      <rect x={cx - 7} y={cy - 13} width="14" height="13" rx="1"
        fill={C.bg4} stroke={c} strokeWidth="1" />
      <line x1={cx - 5} y1={cy - 10} x2={cx + 4} y2={cy - 10} stroke={c} strokeWidth="0.75" />
      <line x1={cx - 5} y1={cy - 7}  x2={cx + 4} y2={cy - 7}  stroke={c} strokeWidth="0.75" />
      <line x1={cx - 5} y1={cy - 4}  x2={cx + 4} y2={cy - 4}  stroke={c} strokeWidth="0.75" />
    </g>
  );
}

function ChatBubbles({ cx, cy, hi }) {
  const c = hi ? C.accent : C.muted;
  return (
    <g>
      <rect x={cx - 21} y={cy - 12} width="18" height="11" rx="3"
        fill="none" stroke={c} strokeWidth="1" />
      <path d={`M${cx-17} ${cy-1}L${cx-20} ${cy+3}L${cx-14} ${cy-1}`}
        fill={C.bg3} stroke={c} strokeWidth="0.8" strokeLinejoin="round" />
      <rect x={cx + 3} y={cy - 12} width="18" height="11" rx="3"
        fill="none" stroke={c} strokeWidth="1" />
      <path d={`M${cx+7} ${cy-1}L${cx+10} ${cy+3}L${cx+16} ${cy-1}`}
        fill={C.bg3} stroke={c} strokeWidth="0.8" strokeLinejoin="round" />
    </g>
  );
}

function TripleBoxIcon({ cx, cy, hi }) {
  const c      = hi ? C.accent : C.muted;
  const labels = ['π', 'R', 'KL'];
  return (
    <g>
      {[-20, 0, 20].map((dx, i) => (
        <g key={i}>
          <rect x={cx + dx - 8} y={cy - 10} width="16" height="14" rx="2"
            fill="none" stroke={c} strokeWidth="0.9" />
          <text x={cx + dx} y={cy + 2} textAnchor="middle"
            fill={c} fontSize="7.5" fontFamily={MONO}>{labels[i]}</text>
        </g>
      ))}
    </g>
  );
}

function ModelCheckIcon({ cx, cy, hi }) {
  const c  = hi ? C.accent : C.borderLt;
  const ck = hi ? C.green  : C.muted;
  return (
    <g>
      <rect x={cx - 16} y={cy - 10} width="32" height="18" rx="3"
        fill={C.bg4} stroke={c} strokeWidth="1" />
      <path d={`M${cx-6} ${cy}L${cx-2} ${cy+5}L${cx+7} ${cy-5}`}
        fill="none" stroke={ck} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function RphiCircleIcon({ cx, cy, hi }) {
  const c = hi ? C.accent : C.borderLt;
  return (
    <g>
      <circle cx={cx} cy={cy} r="13" fill="none" stroke={c} strokeWidth="1" />
      <text x={cx} y={cy + 4} textAnchor="middle"
        fill={hi ? C.math : C.muted} fontSize="9.5" fontFamily={MONO}>R_φ</text>
    </g>
  );
}

function GoldStarIcon({ cx, cy, hi }) {
  const r1 = 11, r2 = 5;
  const pts = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 === 0 ? r1 : r2;
    const a = (k * Math.PI / 5) - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return (
    <polygon points={pts}
      fill={hi ? C.math : 'none'}
      stroke={hi ? C.math : C.muted}
      strokeWidth="1"
      style={{ transition: 'fill 0.35s, stroke 0.35s' }} />
  );
}
