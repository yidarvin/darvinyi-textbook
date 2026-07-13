import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── constants ──────────────────────────────────────────────────────────────────

const ROWS = 5, COLS = 5;
const CELL = 76, GAP = 2;
const VW = 400, VH = 400;
const MRG = 6; // (400 - (76*5 + 2*4)) / 2

const GRID = (() => {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('empty'));
  g[4][4] = 'goal';
  g[2][3] = 'penalty';
  g[1][1] = 'wall';
  g[3][2] = 'wall';
  return g;
})();

const CLR = {
  accent:   '#2dd4bf',
  accentLt: '#a3f3ea',
  red:      '#f87171',
  redLt:    '#fca5a5',
  orange:   '#fb923c',
  green:    '#34d399',
  math:     '#fbbf24',
  muted:    '#555555',
  bg:       '#0a0a0a',
  bg3:      '#161616',
  bg4:      '#1e1e1e',
  border:   '#242424',
  blt:      '#2e2e2e',
  goalFill: '#0d3d1a',
  penFill:  '#3d0d0d',
};

const DIR_NAMES = ['U', 'D', 'L', 'R'];
const DIR_DELTA = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
const DIR_LABEL = { U: 'Up', D: 'Down', L: 'Left', R: 'Right' };

// ── pure helpers ───────────────────────────────────────────────────────────────

const makeQ = () =>
  Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ U: 0, D: 0, L: 0, R: 0 })));

const cloneQ = Q => Q.map(row => row.map(cell => ({ ...cell })));

const cellCXY = (r, c) => ({
  cx: MRG + c * (CELL + GAP) + CELL / 2,
  cy: MRG + r * (CELL + GAP) + CELL / 2,
});

const nextCell = (r, c, a) => {
  const [dr, dc] = DIR_DELTA[a];
  const nr = r + dr, nc = c + dc;
  if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || GRID[nr][nc] === 'wall')
    return [r, c];
  return [nr, nc];
};

const cellReward = (r, c) =>
  GRID[r][c] === 'goal' ? 10 : GRID[r][c] === 'penalty' ? -5 : 0;

const pickAction = (r, c, eps, Q) => {
  const explore = Math.random() < eps;
  if (explore) return { a: DIR_NAMES[Math.floor(Math.random() * 4)], explore: true };
  const qs = Q[r][c];
  const a = Object.entries(qs)
    .reduce((b, [k, v]) => v > b.v ? { a: k, v } : b, { a: 'U', v: -Infinity }).a;
  return { a, explore: false };
};

const msDelay = ms => new Promise(r => setTimeout(r, ms));

// ── Q arrow sub-component ──────────────────────────────────────────────────────

function QArrows({ r, c, qs, flashDir }) {
  const { cx, cy } = cellCXY(r, c);
  const vals = Object.values(qs);
  const maxQ = Math.max(...vals);
  const hasVal = vals.some(v => Math.abs(v) > 0.01);

  return DIR_NAMES.map(dir => {
    const q = qs[dir];
    const absQ = Math.abs(q);
    const zero = absQ < 0.01;
    const best = hasVal && !zero && q === maxQ;
    const flash = flashDir === dir;

    const maxLen = 14, startOff = 5;
    const len = zero ? 2 : Math.max(2, (absQ / 10) * maxLen);
    const baseColor = zero ? CLR.muted : q >= 0 ? CLR.accent : CLR.red;
    const color = flash ? (q >= 0 ? CLR.accentLt : CLR.redLt) : baseColor;
    const sw = best || flash ? 1.8 : 1.2;
    const op = zero ? 0.25 : best || flash ? 1.0 : 0.45;

    const [dx, dy] = DIR_DELTA[dir];
    const x1 = cx + dx * startOff, y1 = cy + dy * startOff;
    const x2 = cx + dx * (startOff + len), y2 = cy + dy * (startOff + len);
    const hLen = Math.min(4, len * 0.55);
    const hW = zero ? 1.5 : 2.5;
    const px = -dy, py = dx;

    return (
      <g key={dir} opacity={op}>
        {len > hLen + 0.5 && (
          <line
            x1={x1} y1={y1}
            x2={x2 - dx * hLen} y2={y2 - dy * hLen}
            stroke={color}
            strokeWidth={zero ? 0.8 : sw}
            strokeLinecap="round"
          />
        )}
        <polygon
          points={`${x2},${y2} ${x2 - dx*hLen + px*hW},${y2 - dy*hLen + py*hW} ${x2 - dx*hLen - px*hW},${y2 - dy*hLen - py*hW}`}
          fill={color}
        />
      </g>
    );
  });
}

// ── component ──────────────────────────────────────────────────────────────────

export default function QLearning() {
  const [Q, setQ]                   = useState(makeQ);
  const [agentPos, setAgentPos]     = useState([0, 0]);
  const [agentVis, setAgentVis]     = useState(false);
  const [agentFlash, setAgentFlash] = useState(null);
  const [trail, setTrail]           = useState([]);
  const [isAnim, setIsAnim]         = useState(false);
  const [isPaused, setIsPaused]     = useState(false);
  const [rewardPop, setRewardPop]   = useState(null);
  const [flashCell, setFlashCell]   = useState(null);
  const [statusMsg, setStatusMsg]   = useState('');
  const [epCount, setEpCount]       = useState(0);
  const [lastRew, setLastRew]       = useState(null);
  const [lastSteps, setLastSteps]   = useState(null);
  const [bestRew, setBestRew]       = useState(null);
  const [curAction, setCurAction]   = useState(null);
  const [curType, setCurType]       = useState(null);
  const [stepsEp, setStepsEp]       = useState(0);
  const [showQ, setShowQ]           = useState(true);
  const [showTrail, setShowTrail]   = useState(true);
  const [epsilon, setEpsilon]       = useState(0.30);
  const [alpha, setAlpha]           = useState(0.10);
  const [gamma, setGamma]           = useState(0.90);
  const [fast, setFast]             = useState(false);

  const QRef      = useRef(makeQ());
  const animRef   = useRef(false);
  const pausedRef = useRef(false);
  const epsRef    = useRef(0.30);
  const alpRef    = useRef(0.10);
  const gamRef    = useRef(0.90);
  const fastRef   = useRef(false);
  const epCntRef  = useRef(0);
  const bestRef   = useRef(null);
  const aliveRef  = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    if (!document.getElementById('ql-style')) {
      const s = document.createElement('style');
      s.id = 'ql-style';
      s.textContent = [
        '@keyframes ql-pop{0%{opacity:0}15%{opacity:1}80%{opacity:1}100%{opacity:0}}',
        '.ql-pop{animation:ql-pop 450ms ease forwards;pointer-events:none}',
      ].join('');
      document.head.appendChild(s);
    }
    return () => { aliveRef.current = false; animRef.current = false; };
  }, []);

  useEffect(() => { epsRef.current = epsilon; }, [epsilon]);
  useEffect(() => { alpRef.current = alpha; }, [alpha]);
  useEffect(() => { gamRef.current = gamma; }, [gamma]);
  useEffect(() => { fastRef.current = fast; }, [fast]);

  // ── reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    animRef.current = false;
    pausedRef.current = false;
    QRef.current = makeQ();
    epCntRef.current = 0;
    bestRef.current = null;
    setQ(makeQ()); setAgentVis(false); setTrail([]);
    setIsAnim(false); setIsPaused(false); setRewardPop(null);
    setFlashCell(null); setStatusMsg(''); setEpCount(0);
    setLastRew(null); setLastSteps(null); setBestRew(null);
    setCurAction(null); setCurType(null); setStepsEp(0);
  }, []);

  // ── animated single episode ────────────────────────────────────────────────

  const runEpisode = useCallback(async () => {
    if (!aliveRef.current) return;
    animRef.current = true;
    pausedRef.current = false;
    setIsAnim(true); setIsPaused(false); setStatusMsg('');
    setCurAction(null); setCurType(null);

    epCntRef.current++;
    setEpCount(epCntRef.current);

    let r = 0, c = 0, totalRew = 0, steps = 0;
    const trailBuf = [];

    setAgentPos([0, 0]); setAgentVis(true); setTrail([]); setStepsEp(0);

    while (steps < 50 && animRef.current && aliveRef.current) {
      // wait if paused
      while (pausedRef.current && animRef.current) await msDelay(50);
      if (!animRef.current || !aliveRef.current) break;

      const isFast = fastRef.current;
      const movMs  = isFast ? 40  : 200;
      const showMs = isFast ? 50  : 250;
      const gapMs  = isFast ? 20  : 80;

      // action selection flash
      const { a, explore } = pickAction(r, c, epsRef.current, QRef.current);
      setAgentFlash(explore ? 'explore' : 'exploit');
      setCurAction(a);
      setCurType(explore ? 'exploration' : 'exploitation');

      await msDelay(isFast ? 20 : 60);
      if (!animRef.current || !aliveRef.current) break;

      // move agent
      const [nr, nc] = nextCell(r, c, a);
      setAgentPos([nr, nc]);
      setAgentFlash(null);

      await msDelay(movMs);
      if (!animRef.current || !aliveRef.current) break;

      // Q update
      const rew = cellReward(nr, nc);
      totalRew += rew;
      const maxNQ = Math.max(...Object.values(QRef.current[nr][nc]));
      QRef.current[r][c][a] += alpRef.current * (rew + gamRef.current * maxNQ - QRef.current[r][c][a]);

      if (rew !== 0) setRewardPop({ r: nr, c: nc, reward: rew, key: Date.now() });
      setFlashCell({ r, c, a });
      setQ(cloneQ(QRef.current));

      trailBuf.push([r, c]);
      setTrail([...trailBuf.slice(-8)]);
      r = nr; c = nc; steps++;
      setStepsEp(steps);

      await msDelay(showMs);
      if (!animRef.current || !aliveRef.current) break;

      setFlashCell(null);
      setRewardPop(null);

      if (GRID[r][c] === 'goal' || GRID[r][c] === 'penalty') break;

      await msDelay(gapMs);
    }

    if (!aliveRef.current) return;

    const nb = bestRef.current === null ? totalRew : Math.max(bestRef.current, totalRew);
    bestRef.current = nb;

    setLastRew(totalRew); setLastSteps(steps); setBestRew(nb);
    setCurAction(null); setCurType(null);
    setFlashCell(null); setRewardPop(null);
    setQ(cloneQ(QRef.current));

    if (animRef.current) {
      setStatusMsg(`Episode ${epCntRef.current} done.  Reward = ${totalRew.toFixed(1)}`);
    }

    await msDelay(800);
    if (aliveRef.current) { setAgentVis(false); setTrail([]); }

    animRef.current = false;
    if (aliveRef.current) { setIsAnim(false); setIsPaused(false); }
  }, []);

  const handleEpClick = useCallback(() => {
    if (!isAnim) { runEpisode(); return; }
    pausedRef.current = !pausedRef.current;
    setIsPaused(p => !p);
  }, [isAnim, runEpisode]);

  // ── batch episodes (no animation) ─────────────────────────────────────────

  const runBatch = useCallback(async n => {
    if (!aliveRef.current || animRef.current) return;
    animRef.current = true;
    setIsAnim(true);
    setStatusMsg(`Running ${n} episodes…`);

    let lastR = null, lastS = null, batchBest = bestRef.current;

    for (let ep = 0; ep < n; ep++) {
      let r = 0, c = 0, tot = 0, s = 0;
      epCntRef.current++;
      while (s < 50) {
        const { a } = pickAction(r, c, epsRef.current, QRef.current);
        const [nr, nc] = nextCell(r, c, a);
        const rew = cellReward(nr, nc);
        const mnq = Math.max(...Object.values(QRef.current[nr][nc]));
        QRef.current[r][c][a] += alpRef.current * (rew + gamRef.current * mnq - QRef.current[r][c][a]);
        r = nr; c = nc; tot += rew; s++;
        if (GRID[r][c] === 'goal' || GRID[r][c] === 'penalty') break;
      }
      if (batchBest === null || tot > batchBest) batchBest = tot;
      lastR = tot; lastS = s;
      if ((ep + 1) % 20 === 0) await msDelay(0);
    }

    if (!aliveRef.current) return;

    bestRef.current = batchBest;
    setQ(cloneQ(QRef.current)); setEpCount(epCntRef.current);
    setLastRew(lastR); setLastSteps(lastS); setBestRew(batchBest);
    setStatusMsg(`${n} episodes complete.`);
    animRef.current = false;
    setIsAnim(false);
  }, []);

  // ── derived stats ──────────────────────────────────────────────────────────

  let maxQ = -Infinity, minQ = Infinity;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (GRID[r][c] !== 'wall')
        for (const a of DIR_NAMES) {
          const v = Q[r][c][a];
          if (v > maxQ) maxQ = v;
          if (v < minQ) minQ = v;
        }
  const startBest = Math.max(...Object.values(Q[0][0]));

  // ── style helpers ──────────────────────────────────────────────────────────

  const transMs = fast ? 40 : 200;
  const { cx: agCx, cy: agCy } = cellCXY(agentPos[0], agentPos[1]);

  const mono = { fontFamily: "'JetBrains Mono',monospace" };
  const sL = {
    ...mono, fontSize: '10px', color: 'var(--text-mid)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px',
  };
  const sV = (col = 'var(--accent)') => ({ ...mono, fontSize: '15px', color: col, lineHeight: 1 });
  const div1 = { height: 1, background: 'var(--border)', margin: '2px 0' };

  const btnSty = (active, warn) => ({
    ...mono, fontSize: '11px', padding: '5px 11px', borderRadius: '4px',
    cursor: 'pointer', flexShrink: 0,
    background: warn ? '#2e1a0d' : active ? 'var(--accent-dim)' : 'var(--bg4)',
    color:      warn ? 'var(--orange)' : active ? 'var(--accent)' : 'var(--text-muted)',
    border: `1px solid ${warn ? 'var(--orange)' : active ? 'var(--accent)' : 'var(--border-lt)'}`,
  });

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <WidgetCard title="Q-Learning — epsilon-greedy exploration in a grid world" number="16.2">

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* ── SVG grid ───────────────────────────────────────────────────── */}
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width={VW}
          style={{ display: 'block', borderRadius: '6px', flexShrink: 0 }}
        >
          <defs>
            <pattern id="ql-hatch" patternUnits="userSpaceOnUse" width="10" height="10">
              <line x1="0" y1="10" x2="10" y2="0" stroke={CLR.blt} strokeWidth="1" />
            </pattern>
          </defs>

          <rect width={VW} height={VH} fill={CLR.bg} />

          {/* Cells */}
          {GRID.map((row, r) => row.map((cell, c) => {
            const x  = MRG + c * (CELL + GAP);
            const y  = MRG + r * (CELL + GAP);
            const cx = x + CELL / 2;
            const cy = y + CELL / 2;

            if (cell === 'wall') return (
              <g key={`${r}${c}`}>
                <rect x={x} y={y} width={CELL} height={CELL} fill={CLR.bg4} />
                <rect x={x} y={y} width={CELL} height={CELL} fill="url(#ql-hatch)" />
              </g>
            );

            if (cell === 'goal') return (
              <g key={`${r}${c}`}>
                <rect x={x} y={y} width={CELL} height={CELL} fill={CLR.goalFill} />
                <rect x={x+1} y={y+1} width={CELL-2} height={CELL-2}
                      fill="none" stroke={CLR.green} strokeWidth={2} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                      fill={CLR.green} fontSize={11}
                      fontFamily="JetBrains Mono,monospace">★ +10</text>
              </g>
            );

            if (cell === 'penalty') return (
              <g key={`${r}${c}`}>
                <rect x={x} y={y} width={CELL} height={CELL} fill={CLR.penFill} />
                <rect x={x+1} y={y+1} width={CELL-2} height={CELL-2}
                      fill="none" stroke={CLR.red} strokeWidth={2} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                      fill={CLR.red} fontSize={11}
                      fontFamily="JetBrains Mono,monospace">✕ -5</text>
              </g>
            );

            const fDir = flashCell?.r === r && flashCell?.c === c ? flashCell.a : null;
            return (
              <g key={`${r}${c}`}>
                <rect x={x} y={y} width={CELL} height={CELL} fill={CLR.bg3} />
                <rect x={x+.5} y={y+.5} width={CELL-1} height={CELL-1}
                      fill="none" stroke={CLR.border} strokeWidth={0.5} />
                {showQ && <QArrows r={r} c={c} qs={Q[r][c]} flashDir={fDir} />}
              </g>
            );
          }))}

          {/* Trail */}
          {showTrail && trail.map((pos, i) => {
            const p = trail.length <= 1 ? 1 : i / (trail.length - 1);
            const { cx, cy } = cellCXY(pos[0], pos[1]);
            return (
              <circle key={i} cx={cx} cy={cy}
                      r={2 + p * 3} fill={CLR.orange} opacity={0.15 + p * 0.7} />
            );
          })}

          {/* Agent */}
          {agentVis && (
            <g style={{
              transform: `translate(${agCx}px,${agCy}px)`,
              transition: `transform ${transMs}ms ease`,
            }}>
              {agentFlash && (
                <circle r={15} fill="none"
                        stroke={agentFlash === 'explore' ? CLR.orange : CLR.accent}
                        strokeWidth={2} opacity={0.85} />
              )}
              <circle r={10} fill={CLR.orange} stroke="white" strokeWidth={1.5} />
            </g>
          )}

          {/* Reward popup */}
          {rewardPop && (
            <text
              key={rewardPop.key}
              className="ql-pop"
              x={cellCXY(rewardPop.r, rewardPop.c).cx}
              y={cellCXY(rewardPop.r, rewardPop.c).cy - 28}
              textAnchor="middle"
              fill={rewardPop.reward > 0 ? CLR.green : CLR.red}
              fontSize={14}
              fontFamily="JetBrains Mono,monospace"
              fontWeight="bold"
            >
              {rewardPop.reward > 0 ? '+10' : '−5'}
            </text>
          )}
        </svg>

        {/* ── Stats panel ───────────────────────────────────────────────── */}
        <div style={{
          width: 180, flexShrink: 0,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '14px 14px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div>
            <div style={sL}>Episodes</div>
            <div style={sV(epCount > 0 ? 'var(--accent)' : 'var(--text-muted)')}>
              {epCount || '—'}
            </div>
          </div>
          <div>
            <div style={sL}>Last reward</div>
            <div style={sV(
              lastRew === null ? 'var(--text-muted)'
                : lastRew >= 10 ? 'var(--green)'
                : lastRew < 0  ? 'var(--red)'
                : 'var(--accent)'
            )}>
              {lastRew !== null ? lastRew.toFixed(1) : '—'}
            </div>
          </div>
          <div>
            <div style={sL}>Last steps</div>
            <div style={sV()}>{lastSteps !== null ? lastSteps : '—'}</div>
          </div>

          <div style={div1} />

          <div>
            <div style={sL}>Best reward</div>
            <div style={sV('var(--green)')}>{bestRew !== null ? bestRew.toFixed(1) : '—'}</div>
          </div>
          <div>
            <div style={sL}>ε / α / γ</div>
            <div style={{ ...mono, fontSize: '11px', color: 'var(--math-color)', lineHeight: 1.7 }}>
              {epsilon.toFixed(2)} / {alpha.toFixed(2)} / {gamma.toFixed(2)}
            </div>
          </div>

          <div style={div1} />

          <div>
            <div style={sL}>Max Q</div>
            <div style={sV()}>{maxQ === -Infinity ? '0.00' : maxQ.toFixed(2)}</div>
          </div>
          <div>
            <div style={sL}>Min Q</div>
            <div style={sV(minQ < -0.1 ? 'var(--red)' : 'var(--text-muted)')}>
              {minQ === Infinity ? '0.00' : minQ.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={sL}>Q(start, best)</div>
            <div style={sV()}>{startBest.toFixed(2)}</div>
          </div>

          {isAnim && (
            <>
              <div style={div1} />
              <div>
                <div style={sL}>Action</div>
                <div style={{
                  ...mono, fontSize: '13px',
                  color: curType === 'exploration' ? CLR.orange : CLR.accent,
                }}>
                  {curAction ? DIR_LABEL[curAction] : '—'}
                </div>
                {curType && (
                  <div style={{
                    ...mono, fontSize: '9px', opacity: 0.8,
                    color: curType === 'exploration' ? CLR.orange : CLR.accent,
                  }}>
                    {curType}
                  </div>
                )}
              </div>
              <div>
                <div style={sL}>Steps</div>
                <div style={sV()}>{stepsEp}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div style={{
          ...mono, fontSize: '11px', marginTop: '8px', textAlign: 'center',
          color: statusMsg.includes('done') || statusMsg.includes('complete')
            ? 'var(--green)' : 'var(--accent)',
        }}>
          {statusMsg}
        </div>
      )}

      {/* Controls */}
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleEpClick} style={btnSty(false, isAnim)}>
            {!isAnim ? '▶ Run Episode' : isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button onClick={() => runBatch(10)} disabled={isAnim} style={btnSty()}>
            Run 10
          </button>
          <button onClick={() => runBatch(100)} disabled={isAnim} style={btnSty()}>
            Run 100
          </button>
          <button onClick={reset} disabled={isAnim} style={btnSty()}>
            Reset
          </button>
        </div>

        {/* Epsilon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ ...mono, fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, width: '72px' }}>
            ε = {epsilon.toFixed(2)}
          </span>
          <input
            type="range" min="0" max="1" step="0.05" value={epsilon}
            title="0.0 = fully greedy, 1.0 = fully random"
            onChange={e => { const v = +e.target.value; epsRef.current = v; setEpsilon(v); }}
            disabled={isAnim}
            style={{ flex: 1, minWidth: '80px' }}
          />
          <span style={{ ...mono, fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0, width: '60px', textAlign: 'right' }}>
            {epsilon <= 0.05 ? 'greedy' : epsilon >= 0.85 ? 'random' : 'exploration'}
          </span>
        </div>

        {/* Alpha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ ...mono, fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, width: '72px' }}>
            α = {alpha.toFixed(2)}
          </span>
          <input
            type="range" min="0.01" max="0.50" step="0.01" value={alpha}
            title="Learning rate — how fast Q-values update"
            onChange={e => { const v = +e.target.value; alpRef.current = v; setAlpha(v); }}
            disabled={isAnim}
            style={{ flex: 1, minWidth: '80px' }}
          />
          <span style={{ ...mono, fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0, width: '60px', textAlign: 'right' }}>
            learning rate
          </span>
        </div>

        {/* Gamma */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ ...mono, fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, width: '72px' }}>
            γ = {gamma.toFixed(2)}
          </span>
          <input
            type="range" min="0.50" max="0.99" step="0.01" value={gamma}
            title="Discount factor — how much future rewards matter"
            onChange={e => { const v = +e.target.value; gamRef.current = v; setGamma(v); }}
            disabled={isAnim}
            style={{ flex: 1, minWidth: '80px' }}
          />
          <span style={{ ...mono, fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0, width: '60px', textAlign: 'right' }}>
            discount
          </span>
        </div>

        {/* Toggles + speed */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setShowQ(v => !v)} style={btnSty(showQ)}>
            {showQ ? 'Q-vals on' : 'Q-vals off'}
          </button>
          <button onClick={() => setShowTrail(v => !v)} style={btnSty(showTrail)}>
            {showTrail ? 'trail on' : 'trail off'}
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => { const v = !fast; fastRef.current = v; setFast(v); }}
            style={btnSty(fast)}
          >
            {fast ? 'fast' : 'normal'}
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}
