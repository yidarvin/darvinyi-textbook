import { useState, useRef, useEffect, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── constants ─────────────────────────────────────────────────────────────────

const ROWS = 5, COLS = 5;
const CELL = 76, GAP = 2;
const CANVAS_W = 400;
const GRID_PX = ROWS * CELL + (ROWS - 1) * GAP; // 388
const MRG = (CANVAS_W - GRID_PX) / 2;           // 6

const DIRS = [
  { r: -1, c:  0, name: 'U' },
  { r:  1, c:  0, name: 'D' },
  { r:  0, c: -1, name: 'L' },
  { r:  0, c:  1, name: 'R' },
];

const CLR = {
  bg:       '#0a0a0a',
  bg3:      '#161616',
  bg4:      '#1e1e1e',
  border:   '#242424',
  blt:      '#2e2e2e',
  green:    '#34d399',
  red:      '#f87171',
  math:     '#fbbf24',
  muted:    '#555555',
  goalFill: '#0d3d1a',
  penFill:  '#3d0d0d',
};

// ── pure helpers ──────────────────────────────────────────────────────────────

const makeGrid = () => {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('empty'));
  g[4][4] = 'goal';
  g[2][3] = 'penalty';
  g[1][1] = 'wall';
  g[3][2] = 'wall';
  return g;
};

const initV = (g) =>
  Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => g[r][c] === 'goal' ? 10 : 0));

const nullPi = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(null));

const viStep = (g, V, gamma) => {
  const nV  = V.map(row => [...row]);
  const nPi = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  let delta = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c] === 'wall') continue;
      if (g[r][c] === 'goal') { nV[r][c] = 10; continue; }
      let best = -Infinity, bd = 'U';
      for (const d of DIRS) {
        let nr = r + d.r, nc = c + d.c;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || g[nr][nc] === 'wall') {
          nr = r; nc = c;
        }
        const rew = g[nr][nc] === 'goal' ? 10 : g[nr][nc] === 'penalty' ? -5 : 0;
        const q   = rew + gamma * V[nr][nc];
        if (q > best) { best = q; bd = d.name; }
      }
      delta = Math.max(delta, Math.abs(best - nV[r][c]));
      nV[r][c] = best;
      nPi[r][c] = bd;
    }
  }
  return { nV, nPi, delta };
};

const tracePath = (g, pi) => {
  if (!g || !pi || g[0][0] === 'wall') return null;
  if (g[0][0] === 'goal') return 0;
  let r = 0, c = 0;
  const seen = new Set();
  for (let i = 0; i < 26; i++) {
    if (g[r][c] === 'goal') return i;
    const k = r * COLS + c;
    if (seen.has(k)) return null;
    seen.add(k);
    const dir = pi[r][c];
    if (!dir) return null;
    const d = DIRS.find(d => d.name === dir);
    let nr = r + d.r, nc = c + d.c;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || g[nr][nc] === 'wall') return null;
    r = nr; c = nc;
  }
  return null;
};

const findFirst = (g, t) => {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (g[r][c] === t) return [r, c];
  return null;
};

// ── canvas rendering ──────────────────────────────────────────────────────────

const drawArrow = (ctx, cx, cy, dir) => {
  const s = 6;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  if      (dir === 'U') { ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy + s); ctx.lineTo(cx - s, cy + s); }
  else if (dir === 'D') { ctx.moveTo(cx, cy + s); ctx.lineTo(cx - s, cy - s); ctx.lineTo(cx + s, cy - s); }
  else if (dir === 'L') { ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy - s); ctx.lineTo(cx + s, cy + s); }
  else                  { ctx.moveTo(cx + s, cy); ctx.lineTo(cx - s, cy - s); ctx.lineTo(cx - s, cy + s); }
  ctx.closePath();
  ctx.fill();
};

const paintGrid = (ctx, g, V, pi, iters, showA, showV) => {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_W);
  ctx.fillStyle = CLR.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_W);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x  = MRG + c * (CELL + GAP);
      const y  = MRG + r * (CELL + GAP);
      const cx = x + CELL / 2;
      const t  = g[r][c];

      // wall: hatch and skip rest
      if (t === 'wall') {
        ctx.fillStyle = CLR.bg4;
        ctx.fillRect(x, y, CELL, CELL);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, CELL, CELL);
        ctx.clip();
        ctx.strokeStyle = CLR.blt;
        ctx.lineWidth = 1;
        for (let i = -CELL; i < CELL * 2; i += 10) {
          ctx.beginPath();
          ctx.moveTo(x + i, y);
          ctx.lineTo(x + i + CELL, y + CELL);
          ctx.stroke();
        }
        ctx.restore();
        continue;
      }

      // base fill + border
      if (t === 'goal') {
        ctx.fillStyle = CLR.goalFill;
        ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = CLR.green;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
      } else if (t === 'penalty') {
        ctx.fillStyle = CLR.penFill;
        ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = CLR.red;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
      } else {
        ctx.fillStyle = CLR.bg3;
        ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = CLR.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
      }

      // heatmap overlay
      if (iters > 0 && showV) {
        const v = V[r][c];
        let oc = null;
        if      (v > 5)  oc = 'rgba(52,211,153,0.30)';
        else if (v > 0)  oc = `rgba(52,211,153,${(v / 10) * 0.3})`;
        else if (v < 0)  oc = `rgba(248,113,113,${Math.min(1, Math.abs(v) / 5) * 0.2})`;
        if (oc) { ctx.fillStyle = oc; ctx.fillRect(x, y, CELL, CELL); }
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (t === 'goal') {
        ctx.fillStyle = CLR.green;
        ctx.font = '10px JetBrains Mono,monospace';
        ctx.fillText('★ +10', cx, y + CELL / 2);
      } else if (t === 'penalty') {
        if (iters > 0 && showV) {
          ctx.fillStyle = CLR.red;
          ctx.font = '9px JetBrains Mono,monospace';
          ctx.fillText('✕ -5', cx, y + 14);
          const v = V[r][c];
          if (isFinite(v)) {
            ctx.fillStyle = v > 1 ? CLR.green : v > 0 ? CLR.math : CLR.muted;
            ctx.font = '13px JetBrains Mono,monospace';
            ctx.fillText(v.toFixed(2), cx, y + CELL / 2);
          }
        } else {
          ctx.fillStyle = CLR.red;
          ctx.font = '10px JetBrains Mono,monospace';
          ctx.fillText('✕ -5', cx, y + CELL / 2);
        }
      } else if (iters > 0 && showV) {
        const v = V[r][c];
        if (isFinite(v)) {
          ctx.fillStyle = v > 1 ? CLR.green : v > 0 ? CLR.math : CLR.muted;
          ctx.font = '13px JetBrains Mono,monospace';
          ctx.fillText(v.toFixed(2), cx, y + CELL / 2);
        }
      }

      // policy arrow
      if (t !== 'goal' && iters > 0 && showA && pi[r][c]) {
        drawArrow(ctx, cx, y + CELL - 12, pi[r][c]);
      }
    }
  }
};

// ── component ─────────────────────────────────────────────────────────────────

export default function MDPExplorer() {
  const [grid,   setGrid]   = useState(makeGrid);
  const [values, setValues] = useState(() => initV(makeGrid()));
  const [policy, setPolicy] = useState(nullPi);
  const [iters,  setIters]  = useState(0);
  const [msg,    setMsg]    = useState('');
  const [anim,   setAnim]   = useState(false);
  const [gamma,  setGamma]  = useState(0.90);
  const [arrows, setArrows] = useState(true);
  const [vals,   setVals]   = useState(true);
  const [fast,   setFast]   = useState(false);

  // refs — animation loop reads these instead of stale closures
  const canRef = useRef(null);
  const ctxRef = useRef(null);
  const tmrRef = useRef(null);
  const live   = useRef(false);  // animation is running
  const gRef   = useRef(grid);
  const vRef   = useRef(values);
  const pRef   = useRef(policy);
  const nRef   = useRef(0);
  const gamR   = useRef(0.90);
  const arR    = useRef(true);
  const vlR    = useRef(true);
  const ftR    = useRef(false);

  // canvas init (run once)
  useEffect(() => {
    const can = canRef.current;
    const dpr = window.devicePixelRatio || 1;
    can.width  = CANVAS_W * dpr;
    can.height = CANVAS_W * dpr;
    const c = can.getContext('2d');
    c.scale(dpr, dpr);
    ctxRef.current = c;
    paintGrid(c, gRef.current, vRef.current, pRef.current, 0, true, true);
  }, []);

  // cleanup timeout on unmount
  useEffect(() => () => { if (tmrRef.current) clearTimeout(tmrRef.current); }, []);

  // redraw when state settles (skipped during animation via live ref)
  useEffect(() => {
    if (!ctxRef.current || live.current) return;
    paintGrid(ctxRef.current, grid, values, policy, iters, arrows, vals);
  }, [grid, values, policy, iters, arrows, vals]);

  // keep control refs in sync
  useEffect(() => { gamR.current = gamma;  }, [gamma]);
  useEffect(() => { arR.current  = arrows; }, [arrows]);
  useEffect(() => { vlR.current  = vals;   }, [vals]);
  useEffect(() => { ftR.current  = fast;   }, [fast]);

  // ── interaction ────────────────────────────────────────────────────────────

  const cycleCell = useCallback((row, col) => {
    clearTimeout(tmrRef.current);
    live.current = false;

    const ng  = gRef.current.map(r => [...r]);
    const cur = ng[row][col];

    if (cur === 'empty') {
      // enforce one-goal rule
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (ng[r][c] === 'goal') ng[r][c] = 'empty';
      ng[row][col] = 'goal';
    } else if (cur === 'goal')    { ng[row][col] = 'penalty'; }
    else if (cur === 'penalty')   { ng[row][col] = 'wall';    }
    else                          { ng[row][col] = 'empty';   }

    const nv = initV(ng);
    const np = nullPi();
    gRef.current = ng; vRef.current = nv; pRef.current = np; nRef.current = 0;

    setGrid(ng); setValues(nv); setPolicy(np);
    setIters(0); setAnim(false); setMsg('');
    if (ctxRef.current)
      paintGrid(ctxRef.current, ng, nv, np, 0, arR.current, vlR.current);
  }, []);

  const handleClick = useCallback(e => {
    const rect = canRef.current.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left - MRG) / (CELL + GAP));
    const row = Math.floor((e.clientY - rect.top  - MRG) / (CELL + GAP));
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    cycleCell(row, col);
  }, [cycleCell]);

  const runVI = useCallback(() => {
    if (live.current) {
      clearTimeout(tmrRef.current);
      live.current = false;
      setAnim(false);
      return;
    }
    live.current = true;
    setAnim(true);
    setMsg('');

    const tick = () => {
      if (!live.current) return;
      const { nV, nPi, delta } = viStep(gRef.current, vRef.current, gamR.current);
      vRef.current = nV; pRef.current = nPi; nRef.current++;

      paintGrid(ctxRef.current, gRef.current, nV, nPi, nRef.current, arR.current, vlR.current);
      setValues(nV); setPolicy(nPi); setIters(nRef.current);

      const done = delta < 0.001 || nRef.current >= 200;
      if (done) {
        live.current = false;
        setAnim(false);
        setMsg(delta < 0.001
          ? `Converged in ${nRef.current} iterations`
          : 'Max iterations (200) reached');
        return;
      }
      tmrRef.current = setTimeout(tick, ftR.current ? 20 : 80);
    };
    tmrRef.current = setTimeout(tick, 0);
  }, []);

  const stepVI = useCallback(() => {
    if (live.current) return;
    const { nV, nPi } = viStep(gRef.current, vRef.current, gamR.current);
    vRef.current = nV; pRef.current = nPi; nRef.current++;
    setValues(nV); setPolicy(nPi); setIters(nRef.current); setMsg('');
    paintGrid(ctxRef.current, gRef.current, nV, nPi, nRef.current, arR.current, vlR.current);
  }, []);

  const resetVI = useCallback(() => {
    clearTimeout(tmrRef.current);
    live.current = false;
    const nv = initV(gRef.current);
    const np = nullPi();
    vRef.current = nv; pRef.current = np; nRef.current = 0;
    setValues(nv); setPolicy(np); setIters(0); setAnim(false); setMsg('');
  }, []);

  const clearGridFn = useCallback(() => {
    clearTimeout(tmrRef.current);
    live.current = false;
    const ng = Array.from({ length: ROWS }, () => Array(COLS).fill('empty'));
    const nv = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    const np = nullPi();
    gRef.current = ng; vRef.current = nv; pRef.current = np; nRef.current = 0;
    setGrid(ng); setValues(nv); setPolicy(np);
    setIters(0); setAnim(false); setMsg('');
  }, []);

  // ── stats ──────────────────────────────────────────────────────────────────

  const penCell  = findFirst(grid, 'penalty');
  const goalCell = findFirst(grid, 'goal');
  const penV     = penCell  && iters > 0 ? values[penCell[0]][penCell[1]]  : null;
  const v00      = iters > 0 && grid[0][0] !== 'wall' ? values[0][0]       : null;
  const pathLen  = iters > 0 ? tracePath(grid, policy) : null;

  const vColor = (v, useRed) =>
    v === null       ? 'var(--text-muted)' :
    v > 1            ? 'var(--green)'      :
    v > 0            ? 'var(--math-color)' :
    useRed && v < 0  ? 'var(--red)'        : 'var(--text-muted)';

  // ── style helpers ──────────────────────────────────────────────────────────

  const btn = (active, danger = false) => ({
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: '11px',
    padding: '5px 11px',
    borderRadius: '4px',
    cursor: 'pointer',
    flexShrink: 0,
    background: danger
      ? (anim ? '#2e1a0d' : 'var(--accent-dim)')
      : active ? 'var(--accent-dim)' : 'var(--bg4)',
    color: danger
      ? (anim ? 'var(--orange)' : 'var(--accent)')
      : active ? 'var(--accent)' : 'var(--text-muted)',
    border: `1px solid ${
      danger ? (anim ? 'var(--orange)' : 'var(--accent)')
             : active ? 'var(--accent)' : 'var(--border-lt)'}`,
  });

  const statLabel = {
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '3px',
  };

  const statVal = (col) => ({
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: '16px',
    color: col || 'var(--accent)',
    lineHeight: 1,
  });

  const divider = { height: 1, background: 'var(--border)' };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <WidgetCard title="MDP Explorer — grid world value iteration" number="16.1">
      {/* canvas + stats panel */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <canvas
          ref={canRef}
          onClick={handleClick}
          style={{
            width: CANVAS_W,
            height: CANVAS_W,
            display: 'block',
            cursor: 'pointer',
            borderRadius: '6px',
            flexShrink: 0,
          }}
        />

        {/* stats panel */}
        <div style={{
          width: 180,
          flexShrink: 0,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div>
            <div style={statLabel}>iterations</div>
            <div style={statVal(iters > 0 ? 'var(--accent)' : 'var(--text-muted)')}>
              {iters > 0 ? iters : '—'}
            </div>
          </div>

          <div>
            <div style={statLabel}>gamma γ</div>
            <div style={statVal('var(--math-color)')}>{gamma.toFixed(2)}</div>
          </div>

          <div style={divider} />

          <div>
            <div style={statLabel}>V*(0,0)</div>
            <div style={statVal(vColor(v00, false))}>
              {v00 !== null ? v00.toFixed(2) : '—'}
            </div>
          </div>

          <div>
            <div style={statLabel}>V*(goal)</div>
            <div style={statVal('var(--green)')}>{goalCell ? '10.00' : '—'}</div>
          </div>

          <div>
            <div style={statLabel}>V*(pen.)</div>
            <div style={statVal(vColor(penV, true))}>
              {penV !== null ? penV.toFixed(2) : '—'}
            </div>
          </div>

          <div style={divider} />

          <div>
            <div style={statLabel}>path (0,0) → ★</div>
            <div style={statVal(pathLen !== null ? 'var(--accent)' : 'var(--text-muted)')}>
              {pathLen !== null ? `${pathLen} steps` : '—'}
            </div>
          </div>

          <div style={divider} />

          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: '9px',
            color: 'var(--text-muted)',
            lineHeight: 1.9,
          }}>
            <div style={{ color: 'var(--text-mid)', marginBottom: '2px' }}>click cells:</div>
            empty → goal +10<br />
            goal → penalty −5<br />
            penalty → wall<br />
            wall → empty
          </div>
        </div>
      </div>

      {/* convergence message */}
      {msg && (
        <div style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: '11px',
          marginTop: '8px',
          textAlign: 'center',
          color: msg.startsWith('Converged') ? 'var(--green)' : 'var(--orange)',
        }}>
          {msg}
        </div>
      )}

      {/* controls */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={runVI} style={btn(false, true)}>
            {anim ? '⏸ Stop' : '▶ Run VI'}
          </button>
          <button onClick={stepVI}     disabled={anim} style={btn(false)}>Step</button>
          <button onClick={resetVI}    disabled={anim} style={btn(false)}>Reset VI</button>
          <button onClick={clearGridFn} disabled={anim} style={btn(false)}>Clear Grid</button>
        </div>

        {/* gamma slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: '11px',
            color: 'var(--text-muted)',
            flexShrink: 0,
            width: '72px',
          }}>
            γ = {gamma.toFixed(2)}
          </span>
          <input
            type="range"
            min="0.50" max="0.99" step="0.01"
            value={gamma}
            title="Lower gamma = agent cares more about immediate rewards."
            onChange={e => {
              const v = parseFloat(e.target.value);
              gamR.current = v;
              setGamma(v);
            }}
            style={{ flex: 1, minWidth: '80px' }}
          />
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: '9px',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}>
            discount
          </span>
        </div>

        {/* toggles + speed */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => {
              const v = !arrows;
              arR.current = v;
              setArrows(v);
              if (ctxRef.current)
                paintGrid(ctxRef.current, gRef.current, vRef.current, pRef.current, nRef.current, v, vlR.current);
            }}
            style={btn(arrows)}
          >
            {arrows ? 'arrows on' : 'arrows off'}
          </button>
          <button
            onClick={() => {
              const v = !vals;
              vlR.current = v;
              setVals(v);
              if (ctxRef.current)
                paintGrid(ctxRef.current, gRef.current, vRef.current, pRef.current, nRef.current, arR.current, v);
            }}
            style={btn(vals)}
          >
            {vals ? 'values on' : 'values off'}
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => { const v = !fast; ftR.current = v; setFast(v); }}
            style={btn(fast)}
          >
            {fast ? 'fast 20ms' : 'normal 80ms'}
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}
