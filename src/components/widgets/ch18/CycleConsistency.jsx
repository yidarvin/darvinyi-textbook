import { useState, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// ── SVG layout constants ───────────────────────────────────────────────────────
// Full-width diagram: viewBox ≈ 1:1 with the 616px usable column
const VW = 620, VH = 278;
const BW = 140, BH = 112;
const B1X = 28,  B1Y = 20;
const B2X = 240, B2Y = 20;
const B3X = 452, B3Y = 20;
const B1CX = B1X + BW / 2;   // 98
const B2CX = B2X + BW / 2;   // 310
const B3CX = B3X + BW / 2;   // 522
const ARR_Y   = B1Y + BH / 2; // 76
const BOX_BOT = B1Y + BH;     // 132
const G_LBL_X = (B1X + BW + B2X) / 2; // 204
const F_LBL_X = (B2X + BW + B3X) / 2; // 416
const CMP_X = 190, CMP_Y = 175, CMP_W = 240, CMP_H = 85;
const CMP_CX  = CMP_X + CMP_W / 2;   // 310
const CMP_CY  = CMP_Y + CMP_H / 2;   // 217.5

const STEP_DELAYS = { 1: 500, 2: 700, 3: 500, 4: 700, 5: 500, 6: 700 };
const STEP_NAMES  = ['', 'Highlight x', 'G translates', 'G(x) appears', 'F translates', 'F(G(x)) appears', 'Compare', 'Loss shown'];

// ── Horse SVG ──────────────────────────────────────────────────────────────────
function Horse({ uid, tx, ty, dimmed = false, generic = false }) {
  const bw = BW, bh = BH;
  const bcx = bw * 0.43, bcy = bh * 0.57;
  const brx = bw * 0.31, bry = bh * 0.23;
  const fill = generic ? '#a06830' : '#8B5E2E';
  return (
    <g transform={`translate(${tx},${ty})`} opacity={dimmed ? 0 : 1} style={{ transition: 'opacity 0.4s' }}>
      <defs>
        <clipPath id={`${uid}-hb`}>
          <ellipse cx={bcx} cy={bcy} rx={brx} ry={bry} />
        </clipPath>
      </defs>
      <rect width={bw} height={bh} fill="#0d1d0d" />
      <rect y={bh * 0.71} width={bw} height={bh * 0.29} fill="#1a4020" />
      <ellipse cx={bcx} cy={bcy} rx={brx} ry={bry} fill={fill} />
      <ellipse cx={bw*0.77} cy={bh*0.34} rx={bw*0.122} ry={bh*0.15} fill={fill} />
      <polygon points={`${bw*0.71},${bh*0.20} ${bw*0.66},${bh*0.10} ${bw*0.75},${bh*0.20}`} fill="#5a3010" />
      <polygon points={`${bw*0.80},${bh*0.19} ${bw*0.77},${bh*0.09} ${bw*0.84},${bh*0.19}`} fill="#5a3010" />
      <path d={`M${bw*0.74},${bh*0.19} Q${bw*0.64},${bh*0.36} ${bw*0.60},${bh*0.44}`}
            fill="none" stroke="#3a1e08" strokeWidth={bw*0.048} strokeLinecap="round" />
      {[0.21, 0.32, 0.46, 0.57].map((lx, i) => (
        <rect key={i} x={bw*lx} y={bh*0.76} width={bw*0.062} height={bh*0.23} fill="#5a3010" rx="1.5" />
      ))}
      <ellipse cx={bw*0.87} cy={bh*0.42} rx={bw*0.036} ry={bh*0.028} fill="#5a3010" />
      <circle cx={bw*0.81} cy={bh*0.27} r={bw*0.022} fill="#040100" />
      {generic && (
        <text x={bw / 2} y={bh * 0.13} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill="rgba(251,146,60,0.9)" fontWeight="700">
          GENERIC
        </text>
      )}
    </g>
  );
}

// ── Zebra SVG ──────────────────────────────────────────────────────────────────
function Zebra({ uid, tx, ty, dimmed = false, generic = false }) {
  const bw = BW, bh = BH;
  const bcx = bw * 0.43, bcy = bh * 0.57;
  const brx = bw * 0.31, bry = bh * 0.23;
  const hcx = bw * 0.77, hcy = bh * 0.34;
  const hrx = bw * 0.122, hry = bh * 0.15;
  const stripes = generic
    ? [-0.24, -0.08, 0.10, 0.27]
    : [-0.21, -0.08, 0.07, 0.21];
  return (
    <g transform={`translate(${tx},${ty})`} opacity={dimmed ? 0 : 1} style={{ transition: 'opacity 0.4s' }}>
      <defs>
        <clipPath id={`${uid}-zb`}>
          <ellipse cx={bcx} cy={bcy} rx={brx} ry={bry} />
        </clipPath>
        <clipPath id={`${uid}-zh`}>
          <ellipse cx={hcx} cy={hcy} rx={hrx} ry={hry} />
        </clipPath>
      </defs>
      <rect width={bw} height={bh} fill="#0d1d0d" />
      <rect y={bh * 0.71} width={bw} height={bh * 0.29} fill="#1a4020" />
      <ellipse cx={bcx} cy={bcy} rx={brx} ry={bry} fill="#dde0dd" />
      <g clipPath={`url(#${uid}-zb)`}>
        {stripes.map((off, i) => (
          <rect key={i}
            x={bcx + brx * off - bw * 0.032}
            y={bcy - bry - 4}
            width={bw * 0.062}
            height={bry * 2 + 8}
            fill="#111" />
        ))}
      </g>
      <ellipse cx={hcx} cy={hcy} rx={hrx} ry={hry} fill="#dde0dd" />
      <g clipPath={`url(#${uid}-zh)`}>
        <rect x={hcx - bw*0.028} y={hcy - hry - 2} width={bw*0.055} height={hry * 2 + 4} fill="#111" />
      </g>
      <polygon points={`${bw*0.71},${bh*0.20} ${bw*0.66},${bh*0.10} ${bw*0.75},${bh*0.20}`} fill="#c0c0c0" />
      <polygon points={`${bw*0.80},${bh*0.19} ${bw*0.77},${bh*0.09} ${bw*0.84},${bh*0.19}`} fill="#c0c0c0" />
      <path d={`M${bw*0.74},${bh*0.19} Q${bw*0.64},${bh*0.36} ${bw*0.60},${bh*0.44}`}
            fill="none" stroke="#111" strokeWidth={bw*0.048} strokeLinecap="round" />
      {[0.21, 0.32, 0.46, 0.57].map((lx, i) => (
        <g key={i}>
          <rect x={bw*lx} y={bh*0.76} width={bw*0.062} height={bh*0.23} fill="#dde0dd" rx="1.5" />
          <rect x={bw*lx} y={bh*0.83} width={bw*0.062} height={bh*0.05} fill="#111" />
        </g>
      ))}
      <ellipse cx={bw*0.87} cy={bh*0.42} rx={bw*0.036} ry={bh*0.028} fill="#c0c0c0" />
      <circle cx={bw*0.81} cy={bh*0.27} r={bw*0.022} fill="#040100" />
      {generic && (
        <text x={bw / 2} y={bh * 0.13} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill="rgba(251,146,60,0.9)" fontWeight="700">
          GENERIC
        </text>
      )}
    </g>
  );
}

// ── Diff visualization ─────────────────────────────────────────────────────────
function DiffViz({ highLoss }) {
  const cols = 18, rows = 4;
  const cw = (CMP_W - 14) / cols;
  const ch = (CMP_H - 46) / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const seed = ((idx * 2654435769 + r * 1013904223) >>> 0) % 1000 / 1000;
      let fill = null;
      if (highLoss) {
        if (seed > 0.35)      fill = seed > 0.65 ? '#f87171' : '#fb923c';
        else if (seed > 0.20) fill = 'rgba(251,146,60,0.3)';
      } else {
        if (seed > 0.92) fill = 'rgba(255,255,255,0.12)';
      }
      if (fill) {
        cells.push(
          <rect key={idx}
            x={CMP_X + 7 + c * cw}
            y={CMP_Y + 34 + r * ch}
            width={cw - 1} height={ch - 1}
            fill={fill} rx="0.5" />
        );
      }
    }
  }
  return <>{cells}</>;
}

// ── Arrow ──────────────────────────────────────────────────────────────────────
function Arrow({ x1, x2, y, active }) {
  const color = active ? '#2dd4bf' : '#333';
  const sw    = active ? 2.5 : 1.5;
  return (
    <g style={{ transition: 'all 0.35s' }}>
      <line x1={x1} y1={y} x2={x2 - 7} y2={y}
            stroke={color} strokeWidth={sw} />
      <polygon points={`${x2},${y} ${x2-8},${y-4} ${x2-8},${y+4}`} fill={color} />
    </g>
  );
}

// ── render animal helper ───────────────────────────────────────────────────────
function renderAnimal(which, uid, tx, ty, dimmed, generic) {
  return which === 'horse'
    ? <Horse uid={uid} tx={tx} ty={ty} dimmed={dimmed} generic={generic} />
    : <Zebra uid={uid} tx={tx} ty={ty} dimmed={dimmed} generic={generic} />;
}

// ── Button style helper ────────────────────────────────────────────────────────
function btnStyle(variant, disabled) {
  const base = {
    fontFamily: mono, fontSize: '10px', padding: '5px 10px',
    borderRadius: '4px', cursor: disabled ? 'default' : 'pointer',
    border: '1px solid', flexShrink: 0, opacity: disabled ? 0.4 : 1,
  };
  if (variant === 'accent')
    return { ...base, background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'var(--accent)' };
  if (variant === 'red')
    return { ...base, background: 'rgba(248,113,113,0.1)', color: '#f87171', borderColor: '#f87171' };
  return { ...base, background: 'var(--bg4)', color: 'var(--text-mid)', borderColor: 'var(--border)' };
}

// ── Stat cell (horizontal strip) ──────────────────────────────────────────────
function StatCell({ label, val, sub, vc }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{
        fontFamily: mono, fontSize: '8px', color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: '15px', color: vc || 'var(--text)', fontWeight: 600, lineHeight: 1 }}>
        {val}
      </div>
      {sub && (
        <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text-mid)', marginTop: '3px' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────────
export default function CycleConsistency() {
  const [step,        setStep]        = useState(0);
  const [isRunning,   setIsRunning]   = useState(false);
  const [direction,   setDirection]   = useState('forward');
  const [brokenCycle, setBrokenCycle] = useState(false);
  const [lambda,      setLambda]      = useState(10);

  // Auto-advance steps
  useEffect(() => {
    if (!isRunning || step >= 7) {
      if (step >= 7) setIsRunning(false);
      return;
    }
    const t = setTimeout(() => setStep(s => s + 1), STEP_DELAYS[step] || 500);
    return () => clearTimeout(t);
  }, [isRunning, step]);

  const runCycle = () => { setStep(1); setIsRunning(true); };
  const stopRun  = () => setIsRunning(false);
  const nextStep = () => { setIsRunning(false); setStep(s => Math.min(s + 1, 7)); };
  const prevStep = () => { setIsRunning(false); setStep(s => Math.max(s - 1, 0)); };
  const resetAll = () => { setIsRunning(false); setStep(0); };

  const changeDirection = (d) => { setDirection(d); resetAll(); };

  // Direction config
  const fwd = direction === 'forward';
  const box1Animal = fwd ? 'horse'  : 'zebra';
  const box2Animal = fwd ? 'zebra'  : 'horse';
  const box3Animal = fwd ? 'horse'  : 'zebra';
  const box1Label  = fwd ? 'x'      : 'y';
  const box2Label  = fwd ? 'G(x)'   : 'F(y)';
  const box3Label  = fwd ? 'F(G(x))': 'G(F(y))';
  const arr1Label  = fwd ? 'G: X→Y' : 'F: Y→X';
  const arr2Label  = fwd ? 'F: Y→X' : 'G: X→Y';
  const box1Dom    = fwd ? 'domain X' : 'domain Y';
  const box2Dom    = fwd ? 'domain Y' : 'domain X';
  const box3Dom    = fwd ? 'domain X' : 'domain Y';
  const lossFormula = fwd ? '||F(G(x)) − x||₁' : '||G(F(y)) − y||₁';

  // Step-driven visibility
  const box2Vis    = step >= 3;
  const box3Vis    = step >= 5;
  const compareVis = step >= 6;
  const box1Active = step === 1;
  const arrGActive = step === 2;
  const arrFActive = step === 4;

  // Loss display
  const highLoss    = brokenCycle;
  const lossVal     = brokenCycle ? 2.14 : Math.max(0.04, 0.08 + (10 - lambda) * 0.012);
  const lossColor   = lossVal > 0.5 ? '#f87171' : '#34d399';
  const cmpBorder   = lossVal > 0.5 ? '#f87171' : '#34d399';

  // Border glow for box 1 when active
  const b1Filter = box1Active ? 'drop-shadow(0 0 6px rgba(45,212,191,0.7))' : 'none';

  return (
    <WidgetCard title="Cycle Consistency — F(G(x)) ≈ x" number="18.4">

      {/* ── Main SVG diagram — full column width ── */}
      <div style={{ background: 'var(--code-bg)', borderRadius: '8px', padding: '4px', marginBottom: '12px' }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>

          <defs>
            <marker id="cc-arrowhead" markerWidth="6" markerHeight="6"
                    refX="5" refY="3" orient="auto">
              <polygon points="0,0 6,3 0,6" fill="#2dd4bf" />
            </marker>
          </defs>

          {/* Arrow labels */}
          <text x={G_LBL_X} y={13} textAnchor="middle" fontFamily={mono} fontSize="9"
                fill={arrGActive ? '#2dd4bf' : '#444'} style={{ transition: 'fill 0.35s' }}>
            {arr1Label}
          </text>
          <text x={F_LBL_X} y={13} textAnchor="middle" fontFamily={mono} fontSize="9"
                fill={arrFActive ? '#2dd4bf' : '#444'} style={{ transition: 'fill 0.35s' }}>
            {arr2Label}
          </text>

          {/* Box 1 (x) */}
          <g style={{ filter: b1Filter, transition: 'filter 0.3s' }}>
            <rect x={B1X} y={B1Y} width={BW} height={BH} fill="#161616" rx="4"
                  stroke="#2dd4bf" strokeWidth={box1Active ? 2.5 : 2} />
          </g>
          {renderAnimal(box1Animal, 'b1', B1X, B1Y, false, false)}

          {/* Arrow G */}
          <Arrow x1={B1X + BW} x2={B2X} y={ARR_Y} active={arrGActive} />

          {/* Box 2 (G(x)) */}
          <rect x={B2X} y={B2Y} width={BW} height={BH} fill="#161616" rx="4"
                stroke="#fb923c" strokeWidth={2}
                opacity={box2Vis ? 1 : 0.15} style={{ transition: 'opacity 0.4s' }} />
          {renderAnimal(box2Animal, 'b2', B2X, B2Y, !box2Vis, brokenCycle)}

          {/* Arrow F */}
          <Arrow x1={B2X + BW} x2={B3X} y={ARR_Y} active={arrFActive} />

          {/* Box 3 (F(G(x))) */}
          <rect x={B3X} y={B3Y} width={BW} height={BH} fill="#161616" rx="4"
                stroke="#2dd4bf" strokeWidth={2}
                opacity={box3Vis ? 1 : 0.15} style={{ transition: 'opacity 0.4s' }} />
          {renderAnimal(box3Animal, 'b3', B3X, B3Y, !box3Vis, brokenCycle)}

          {/* Box labels */}
          <text x={B1CX} y={BOX_BOT + 14} textAnchor="middle"
                fontFamily={mono} fontSize="11" fontWeight="600" fill="#2dd4bf">
            {box1Label}
          </text>
          <text x={B1CX} y={BOX_BOT + 26} textAnchor="middle"
                fontFamily={mono} fontSize="8" fill="#555">
            {box1Dom}
          </text>

          <text x={B2CX} y={BOX_BOT + 14} textAnchor="middle"
                fontFamily={mono} fontSize="11" fontWeight="600" fill="#fb923c"
                opacity={box2Vis ? 1 : 0.25} style={{ transition: 'opacity 0.4s' }}>
            {box2Label}
          </text>
          <text x={B2CX} y={BOX_BOT + 26} textAnchor="middle"
                fontFamily={mono} fontSize="8" fill="#555"
                opacity={box2Vis ? 1 : 0.25} style={{ transition: 'opacity 0.4s' }}>
            {box2Dom}
          </text>

          <text x={B3CX} y={BOX_BOT + 14} textAnchor="middle"
                fontFamily={mono} fontSize="11" fontWeight="600" fill="#2dd4bf"
                opacity={box3Vis ? 1 : 0.25} style={{ transition: 'opacity 0.4s' }}>
            {box3Label}
          </text>
          <text x={B3CX} y={BOX_BOT + 26} textAnchor="middle"
                fontFamily={mono} fontSize="8" fill="#555"
                opacity={box3Vis ? 1 : 0.25} style={{ transition: 'opacity 0.4s' }}>
            {box3Dom}
          </text>

          {/* Compare arrows */}
          <g opacity={compareVis ? 1 : 0} style={{ transition: 'opacity 0.5s' }}>
            <path
              d={`M ${B1CX},${BOX_BOT} C ${B1CX},${CMP_Y + 22} ${CMP_X - 20},${CMP_CY} ${CMP_X},${CMP_CY}`}
              fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4,3"
              markerEnd="url(#cc-arrowhead)" />
            <path
              d={`M ${B3CX},${BOX_BOT} C ${B3CX},${CMP_Y + 22} ${CMP_X + CMP_W + 20},${CMP_CY} ${CMP_X + CMP_W},${CMP_CY}`}
              fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4,3"
              markerEnd="url(#cc-arrowhead)" />
          </g>

          {/* Compare box */}
          <g opacity={compareVis ? 1 : 0} style={{ transition: 'opacity 0.5s' }}>
            <rect x={CMP_X} y={CMP_Y} width={CMP_W} height={CMP_H}
                  fill="#1a1a1a" rx="6"
                  stroke={cmpBorder} strokeWidth="1.5" strokeDasharray="5,3" />
            <text x={CMP_CX} y={CMP_Y + 15} textAnchor="middle"
                  fontFamily={mono} fontSize="9" fontWeight="600" fill={cmpBorder}>
              Cycle loss
            </text>
            <text x={CMP_CX} y={CMP_Y + 27} textAnchor="middle"
                  fontFamily={mono} fontSize="8" fill="#666">
              {lossFormula}
            </text>
            <DiffViz highLoss={highLoss} />
            <text x={CMP_CX} y={CMP_Y + CMP_H - 8} textAnchor="middle"
                  fontFamily={mono} fontSize="11" fill={lossColor}>
              = {lossVal.toFixed(2)}
            </text>
          </g>
        </svg>
      </div>

      {/* ── Controls row 1: animation ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
        {isRunning ? (
          <button onClick={stopRun} style={btnStyle('accent', false)}>⏸ Stop</button>
        ) : (
          <button onClick={runCycle} style={btnStyle('accent', false)}>▶ Run Cycle</button>
        )}
        <button onClick={prevStep} disabled={step === 0} style={btnStyle('default', step === 0)}>◀ Prev</button>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '4px 10px', background: 'var(--bg3)',
          border: '1px solid var(--border)', borderRadius: '4px',
          fontFamily: mono, fontSize: '10px', color: 'var(--text-mid)', minWidth: '48px',
        }}>
          {step === 0 ? 'ready' : `${step} / 7`}
        </div>
        <button onClick={nextStep} disabled={step >= 7} style={btnStyle('default', step >= 7)}>Next ▶</button>
        <button onClick={resetAll} style={btnStyle('default', false)}>↺ Reset</button>
      </div>

      {/* ── Controls row 2: direction + break cycle + λ ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>Cycle:</span>
        {[['forward', 'X → Y → X'], ['reverse', 'Y → X → Y']].map(([val, lbl]) => (
          <button key={val} onClick={() => changeDirection(val)}
                  style={{
                    fontFamily: mono, fontSize: '10px', padding: '4px 10px',
                    background: direction === val ? 'var(--accent-dim)' : 'var(--bg4)',
                    color:      direction === val ? 'var(--accent)' : 'var(--text-mid)',
                    border: '1px solid',
                    borderColor: direction === val ? 'var(--accent)' : 'var(--border)',
                    borderRadius: '4px', cursor: 'pointer', flexShrink: 0,
                  }}>
            {lbl}
          </button>
        ))}
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 }} />
        <button onClick={() => setBrokenCycle(b => !b)}
                style={btnStyle(brokenCycle ? 'red' : 'default', false)}>
          {brokenCycle ? '⚠ Cycle broken' : 'Break cycle'}
        </button>
        <div style={{ flex: 1, minWidth: 80 }} />
        <span style={{ fontFamily: mono, fontSize: '11px', color: '#fbbf24', flexShrink: 0 }}>λ</span>
        <input type="range" min={0} max={20} step={0.5} value={lambda}
               onChange={e => setLambda(Number(e.target.value))}
               style={{ width: '120px', flexShrink: 0 }} />
        <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--accent)', flexShrink: 0, width: '24px' }}>
          {lambda}
        </span>
      </div>

      {/* ── Stats strip ── */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '8px', overflow: 'hidden', marginBottom: '10px',
      }}>
        <StatCell
          label="Direction"
          val={fwd ? 'X→Y→X' : 'Y→X→Y'}
          vc="var(--accent)"
        />
        <div style={{ width: '1px', background: 'var(--border)', flexShrink: 0 }} />
        <StatCell
          label="Step"
          val={step === 0 ? '—' : `${step} / 7`}
          sub={step > 0 ? STEP_NAMES[step] : 'ready'}
          vc="var(--text)"
        />
        <div style={{ width: '1px', background: 'var(--border)', flexShrink: 0 }} />
        <StatCell
          label="Cycle loss"
          val={compareVis ? lossVal.toFixed(2) : '—'}
          sub={compareVis ? (lossVal > 0.5 ? 'high — mapping broken' : 'low — content preserved') : lossFormula}
          vc={compareVis ? lossColor : 'var(--text-muted)'}
        />
        <div style={{ width: '1px', background: 'var(--border)', flexShrink: 0 }} />
        <StatCell
          label="λ weight"
          val={String(lambda)}
          sub="paper default 10"
          vc="#fbbf24"
        />
      </div>

      {/* ── Loss formula panel ── */}
      <div style={{ background: 'var(--bg4)', borderRadius: '6px', padding: '12px 16px' }}>
        <div style={{ fontFamily: mono, fontSize: '11px', color: '#fbbf24', lineHeight: 2, marginBottom: '2px' }}>
          L_total = L_GAN(G, D_Y) + L_GAN(F, D_X) + λ · L_cyc(G, F)
        </div>
        <div style={{ fontFamily: mono, fontSize: '11px', color: '#fbbf24', lineHeight: 2, marginBottom: '8px' }}>
          L_cyc = E_x[||F(G(x)) − x||₁] + E_y[||G(F(y)) − y||₁]
        </div>
        <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
          L_GAN(G, D_Y): G fools D_Y — adversarial loss in domain Y ·{' '}
          L_GAN(F, D_X): F fools D_X — adversarial loss in domain X ·{' '}
          L_cyc: cycle consistency in both directions · λ = {lambda} (paper default ≈ 10)
        </div>
      </div>

    </WidgetCard>
  );
}
