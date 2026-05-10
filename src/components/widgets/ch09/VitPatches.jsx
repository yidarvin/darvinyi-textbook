import { useState, useRef, useEffect, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  bg2: '#111111', bg4: '#1e1e1e',
  border: '#242424', borderLt: '#2e2e2e',
  muted: '#555555', textMid: '#888888',
  codeBg: '#0a0a0a',
  accent: '#2dd4bf', accentDim: '#0b2422',
  green: '#34d399',
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ── Synthetic 16×16 image (deterministic) ─────────────────────────────────────
const GRID = (() => {
  const g = [];
  for (let r = 0; r < 16; r++) {
    const row = [];
    for (let c = 0; c < 16; c++) {
      let h, s, l;
      if      (r < 8 && c < 8) { h = 30 + c*3;  s = 70; l = 40 + r*2 + 20; }
      else if (r < 8)           { h = 200 + c*2; s = 65; l = 30 + r*2 + 15; }
      else if (c < 8)           { h = 120 + r*2; s = 55; l = 25 + c*3 + 10; }
      else                      { h = 270 + c*2; s = 60; l = 30 + r*2 + 15; }
      row.push({ h, s, l });
    }
    g.push(row);
  }
  return g;
})();

const hsl = ({ h, s, l }) => `hsl(${h},${s}%,${l}%)`;

function avgColor(cells) {
  if (!cells.length) return { h: 0, s: 50, l: 50 };
  const n = cells.length;
  const s = cells.reduce((a, c) => ({ h: a.h+c.h, s: a.s+c.s, l: a.l+c.l }), { h:0, s:0, l:0 });
  return { h: s.h/n, s: s.s/n, l: s.l/n };
}

function computeTokenColors(P) {
  const pps = 256 / P;
  const cpp = P / 16;
  const out = [];
  for (let pr = 0; pr < pps; pr++) {
    for (let pc = 0; pc < pps; pc++) {
      if (cpp < 1) {
        const cr = Math.min(15, Math.floor(pr * cpp));
        const cc = Math.min(15, Math.floor(pc * cpp));
        out.push(GRID[cr][cc]);
      } else {
        const cells = [];
        const r0 = Math.round(pr * cpp), c0 = Math.round(pc * cpp), sz = Math.round(cpp);
        for (let dr = 0; dr < sz; dr++)
          for (let dc = 0; dc < sz; dc++)
            if (r0+dr < 16 && c0+dc < 16) cells.push(GRID[r0+dr][c0+dc]);
        out.push(avgColor(cells));
      }
    }
  }
  return out;
}

// ── Layout constants ──────────────────────────────────────────────────────────
const PATCH_SIZES = [8, 16, 32, 64];
const IMG_W = 280, IMG_H = 280;
const TOK_W = 280, TOK_H = 68;
const CELL  = IMG_W / 16; // 17.5px per display cell
const TOK_Y = 9, TOK_H_PX = 36, CLS_W = 14;

// ── Sub-components ────────────────────────────────────────────────────────────
function StatRow({ label, val, color }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: '11px', color: color ?? C.accent, lineHeight: 1 }}>
        {val}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: '1px', background: C.border, margin: '7px 0 9px' }} />;
}

function Btn({ onClick, disabled, primary, active, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...mono, fontSize: '11px', borderRadius: '4px', padding: '5px 11px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: `1px solid ${primary || active ? C.accent : C.borderLt}`,
      background: primary ? C.accent : active ? C.accentDim : C.bg4,
      color: primary ? '#000' : active ? C.accent : '#888',
      whiteSpace: 'nowrap', opacity: disabled ? 0.4 : 1,
    }}>
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VitPatches() {
  const [P,           setP]           = useState(16);
  const [selected,    setSelected]    = useState(null);   // [patchRow, patchCol]
  const [showNums,    setShowNums]    = useState(false);
  const [animating,   setAnimating]   = useState(false);
  const [scanIdx,     setScanIdx]     = useState(-1);
  const [revealedTo,  setRevealedTo]  = useState(-1);     // -1 = all visible

  const intervalRef = useRef(null);
  const skipFirst   = useRef(true);

  const pps   = 256 / P;
  const N     = pps * pps;
  const cpp   = P / 16;
  const total = N + 1;

  const tokenColors = useMemo(() => computeTokenColors(P), [P]);

  // Token size tier
  const { tokW, tokGap } = total <= 20 ? { tokW: 12, tokGap: 2 }
                         : total <= 64 ? { tokW: 6,  tokGap: 1 }
                         :               { tokW: 3,  tokGap: 0.5 };

  const clsGap    = tokGap * 2;
  const startX    = 2 + CLS_W + clsGap;
  const availW    = TOK_W - startX - 22;
  const maxDisp   = Math.min(N, Math.floor(availW / (tokW + tokGap)));
  const hasEllip  = N > maxDisp;

  function stopAnim() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setAnimating(false);
    setScanIdx(-1);
  }

  function resetAll() {
    stopAnim();
    setRevealedTo(-1);
    setSelected(null);
  }

  // Reset on P change (skip mount)
  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; return; }
    resetAll();
  }, [P]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopAnim(), []);

  function startAnim() {
    stopAnim();
    setRevealedTo(0);
    setScanIdx(0);
    setAnimating(true);
    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx++;
      setScanIdx(idx);
      setRevealedTo(idx);
      if (idx >= N) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setAnimating(false);
        setScanIdx(-1);
        setRevealedTo(-1);
      }
    }, 60);
  }

  const selectedTokIdx = selected ? selected[0] * pps + selected[1] : null;
  const patchSize      = CELL * cpp; // SVG units per patch side

  // ── Image cell rects (static) ────────────────────────────────────────────
  const cellRects = useMemo(() => {
    const out = [];
    for (let r = 0; r < 16; r++)
      for (let c = 0; c < 16; c++)
        out.push(
          <rect key={`c${r}-${c}`}
            x={c*CELL} y={r*CELL} width={CELL} height={CELL}
            fill={hsl(GRID[r][c])} stroke="#242424" strokeWidth="0.4"
          />
        );
    return out;
  }, []);

  // ── Patch overlay (recomputed when P or selection/scan changes) ──────────
  const patchEls = useMemo(() => {
    const rects = [], labels = [];
    for (let pr = 0; pr < pps; pr++) {
      for (let pc = 0; pc < pps; pc++) {
        const x   = pc * patchSize;
        const y   = pr * patchSize;
        const idx = pr * pps + pc;
        const sel  = selected && selected[0]===pr && selected[1]===pc;
        const scan = scanIdx === idx;

        rects.push(
          <rect key={`p${pr}-${pc}`}
            x={x} y={y} width={patchSize} height={patchSize}
            fill={sel ? 'rgba(45,212,191,0.2)' : scan ? 'rgba(45,212,191,0.38)' : 'transparent'}
            stroke={sel || scan ? '#2dd4bf' : 'rgba(255,255,255,0.75)'}
            strokeWidth={sel ? 2.5 : scan ? 2 : (cpp < 1 ? 0.4 : 1.5)}
            style={{ cursor: 'pointer' }}
            onClick={() => setSelected(s => (s && s[0]===pr && s[1]===pc) ? null : [pr, pc])}
          />
        );

        if (showNums && cpp >= 1) {
          labels.push(
            <text key={`n${pr}-${pc}`}
              x={x + patchSize/2} y={y + patchSize/2 + 3}
              textAnchor="middle"
              fill="rgba(255,255,255,0.85)"
              fontSize={Math.max(5, Math.min(8, patchSize * 0.38))}
              fontFamily="'JetBrains Mono', monospace"
              style={{ pointerEvents: 'none' }}
            >
              {idx}
            </text>
          );
        }
      }
    }
    return { rects, labels };
  }, [P, pps, patchSize, cpp, selected, scanIdx, showNums]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Token sequence ────────────────────────────────────────────────────────
  const labelY = TOK_Y + TOK_H_PX + 12;

  return (
    <WidgetCard title="ViT Patches — turning images into token sequences" number="9.3">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* ── Left column ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Image SVG */}
          <div style={{ background: C.codeBg, borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
            <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} width="100%" style={{ display: 'block' }}>
              {cellRects}
              {patchEls.rects}
              {patchEls.labels}
            </svg>
          </div>

          {/* Token sequence SVG */}
          <div style={{ background: C.codeBg, borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
            <svg viewBox={`0 0 ${TOK_W} ${TOK_H}`} width="100%" style={{ display: 'block' }}>
              <rect width={TOK_W} height={TOK_H} fill={C.codeBg} />

              {/* CLS token */}
              <rect x={2} y={TOK_Y} width={CLS_W} height={TOK_H_PX + 3}
                fill="#2a2a2a" stroke="rgba(255,255,255,0.7)" strokeWidth="1" rx={1} />
              <text x={2 + CLS_W/2} y={TOK_Y + (TOK_H_PX+3)/2 + 2.5}
                textAnchor="middle" fill="rgba(255,255,255,0.8)"
                fontSize="4.5" fontFamily="'JetBrains Mono', monospace"
                style={{ pointerEvents: 'none' }}>
                CLS
              </text>

              {/* Patch tokens */}
              {Array.from({ length: maxDisp }, (_, i) => {
                const tokX   = startX + i * (tokW + tokGap);
                const vis    = revealedTo === -1 || i < revealedTo;
                const isSel  = selectedTokIdx === i;
                return (
                  <rect key={`t${i}`}
                    x={tokX} y={TOK_Y}
                    width={vis ? tokW : 0}
                    height={TOK_H_PX}
                    fill={hsl(tokenColors[i] ?? { h:0, s:0, l:40 })}
                    stroke={isSel ? '#2dd4bf' : 'none'}
                    strokeWidth={isSel ? 1.5 : 0}
                    rx={0.3}
                    style={{ transition: vis ? 'width 0.05s ease' : 'none' }}
                  />
                );
              })}

              {/* Ellipsis */}
              {hasEllip && (
                <text x={startX + maxDisp*(tokW+tokGap) + 3} y={TOK_Y + TOK_H_PX/2 + 3}
                  fill={C.muted} fontSize="9" fontFamily="'JetBrains Mono', monospace">
                  ...
                </text>
              )}

              {/* Label */}
              <text x={4} y={labelY} fill={C.muted} fontSize="7"
                fontFamily="'Inter', sans-serif">
                ↑ CLS  patch tokens →
              </text>
            </svg>
          </div>

          {/* Patch size selector */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ ...mono, fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Patch size P
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {PATCH_SIZES.map(size => (
                <Btn key={size} active={P === size} onClick={() => setP(size)}>
                  P = {size}
                </Btn>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Btn primary disabled={animating} onClick={startAnim}>
              {animating ? 'Animating…' : '▶ Animate tokenization'}
            </Btn>
            <Btn onClick={resetAll}>↺ Reset</Btn>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: '2px' }}>
              <input type="checkbox" checked={showNums}
                onChange={e => setShowNums(e.target.checked)}
                style={{ accentColor: C.accent, width: 12, height: 12, cursor: 'pointer' }} />
              <span style={{ ...mono, fontSize: '10px', color: C.muted }}>Show patch numbers</span>
            </label>
          </div>
        </div>

        {/* ── Stats panel ───────────────────────────────────────────────── */}
        <div style={{
          width: 180, flexShrink: 0,
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '14px',
        }}>
          <StatRow label="Image size"       val="256 × 256 px" color={C.textMid} />
          <StatRow label="Patch size"       val={`${P} × ${P} px`} />
          <StatRow label="Patches per side" val={`256 / ${P} = ${pps}`} color={C.textMid} />
          <StatRow label="Total patches N"  val={`${pps}² = ${N}`} />
          <StatRow label="Sequence length"  val={`${N} + 1 = ${total}`} color={C.green} />
          <Divider />
          <StatRow label="Patch flat dim"   val={`${P}²×3 = ${P*P*3}`} color={C.textMid} />
          <div style={{ ...mono, fontSize: '8px', color: C.muted, lineHeight: 1.5, marginBottom: '6px' }}>
            projected to d_model via linear layer
          </div>
          <Divider />
          <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Compare to text
          </div>
          <div style={{ ...mono, fontSize: '9px', color: C.textMid, lineHeight: 2 }}>
            GPT-2 max: 1,024 tokens<br />
            ViT-B/16 (224px): 197<br />
            ViT-B/8 (224px): 785
          </div>
          <Divider />
          <StatRow
            label="Selected patch"
            val={selected ? `[${selected[0]}, ${selected[1]}]` : 'none'}
            color={selected ? C.accent : C.muted}
          />
          <StatRow
            label="Token index"
            val={selectedTokIdx !== null ? `${selectedTokIdx}` : '—'}
            color={selectedTokIdx !== null ? C.accent : C.muted}
          />
        </div>
      </div>
    </WidgetCard>
  );
}
