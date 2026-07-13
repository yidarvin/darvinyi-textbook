import { useState, useMemo } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Inter', sans-serif";

const VOCAB = ["king", "queen", "man", "woman", "cat", "dog", "Paris", "France"];

const EMBEDDINGS = {
  king:   [ 0.82,  0.41, -0.18,  0.62,  0.10, -0.33],
  queen:  [ 0.79,  0.38, -0.22,  0.58,  0.14, -0.29],
  man:    [ 0.45,  0.71,  0.12, -0.20,  0.55,  0.08],
  woman:  [ 0.42,  0.68,  0.18, -0.16,  0.52,  0.11],
  cat:    [-0.30,  0.10,  0.75, -0.40, -0.22,  0.60],
  dog:    [-0.28,  0.14,  0.72, -0.38, -0.19,  0.63],
  Paris:  [-0.58, -0.42, -0.28,  0.30,  0.68,  0.35],
  France: [-0.55, -0.39, -0.31,  0.33,  0.71,  0.32],
};

function getOneHot(word) {
  return VOCAB.map(w => (w === word ? 1 : 0));
}

function cosSim(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (na * nb + 1e-8);
}

function lerp3(bg, fg, t) {
  return `rgb(${Math.round(bg[0] + t * (fg[0] - bg[0]))},${Math.round(bg[1] + t * (fg[1] - bg[1]))},${Math.round(bg[2] + t * (fg[2] - bg[2]))})`;
}

function cellColor(v) {
  const BG = [30, 30, 30];
  if (v > 0)  return lerp3(BG, [45, 212, 191], v);
  if (v < 0)  return lerp3(BG, [248, 113, 113], Math.abs(v));
  return '#1e1e1e';
}

function heatColor(v) {
  return lerp3([10, 10, 10], [45, 212, 191], Math.max(0, v));
}

function simColor(v) {
  if (v > 0.8) return '#34d399';
  if (v > 0.4) return '#2dd4bf';
  if (v > 0)   return '#888888';
  return '#555555';
}

function simLabel(v) {
  if (v > 0.9) return 'very similar';
  if (v > 0.7) return 'similar';
  if (v > 0.4) return 'moderately related';
  if (v > 0.1) return 'weakly related';
  return 'unrelated';
}

// ── SVG layout ───────────────────────────────────────────────────────────────
const VW    = 580;
const ROW_H = 38;
const TTL_H = 38;
const VH    = TTL_H + VOCAB.length * ROW_H + 6;

const P1 = 0;    // one-hot panel left x
const P2 = 300;  // dense panel left x  (280 + 20 gap)
const PW = 280;  // panel width

const LX = 52;   // word label right edge within panel
const CX = 56;   // cells start x within panel

const OH_W = 20; const OH_H = 18; const OH_G = 2;
const DE_W = 26; const DE_H = 18; const DE_G = 2;

// ── Sub-components ───────────────────────────────────────────────────────────
function StatCell({ label, val, vc, note, nc }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: '8.5px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: '13px', lineHeight: 1, color: vc || '#2dd4bf' }}>
        {val}
      </div>
      {note && (
        <div style={{ fontFamily: MONO, fontSize: '8.5px', color: nc || '#888', marginTop: '2px', lineHeight: 1 }}>
          {note}
        </div>
      )}
    </div>
  );
}

function VDivider() {
  return <div style={{ width: 1, background: '#242424', alignSelf: 'stretch', flexShrink: 0 }} />;
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontFamily: MONO, fontSize: '11px', color: checked ? '#2dd4bf' : '#555' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: '#2dd4bf', cursor: 'pointer', width: '13px', height: '13px' }} />
      {label}
    </label>
  );
}

// ── Heatmap ──────────────────────────────────────────────────────────────────
function Heatmap({ data }) {
  const LW = 48;
  const TH = 44;
  const CS = 34;
  const W  = LW + VOCAB.length * CS;
  const H  = TH + VOCAB.length * CS;

  return (
    <div style={{ marginTop: '14px', border: '1px solid #242424', borderRadius: '6px', padding: '12px', background: '#0a0a0a' }}>
      <div style={{ fontFamily: SANS, fontSize: '11px', color: '#e8eaed', marginBottom: '8px' }}>
        Dense Embedding Pairwise Similarity
      </div>
      <svg viewBox={`0 0 ${W + 2} ${H + 2}`} width="100%" style={{ display: 'block' }}>
        {VOCAB.map((w, j) => (
          <text key={`ch-${w}`}
            x={LW + j * CS + CS / 2} y={TH - 6}
            textAnchor="middle" fontFamily={MONO} fontSize={8} fill="#888">
            {w}
          </text>
        ))}
        {data.map((row, i) => (
          <g key={VOCAB[i]}>
            <text x={LW - 4} y={TH + i * CS + CS / 2}
              textAnchor="end" dominantBaseline="middle"
              fontFamily={MONO} fontSize={8} fill="#888">
              {VOCAB[i]}
            </text>
            {row.map((sim, j) => {
              const diag = i === j;
              return (
                <g key={j}>
                  <rect
                    x={LW + j * CS} y={TH + i * CS}
                    width={CS} height={CS}
                    fill={diag ? '#e8eaed' : heatColor(sim)}
                    stroke="#242424" strokeWidth={0.5}
                  />
                  <text
                    x={LW + j * CS + CS / 2} y={TH + i * CS + CS / 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fontFamily={MONO} fontSize={8}
                    fill={diag ? '#0a0a0a' : sim > 0.5 ? 'white' : '#555'}>
                    {sim.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function OneHotVsEmbedding() {
  const [selected, setSelected]       = useState(new Set());
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showValues, setShowValues]   = useState(true);

  const selArr = [...selected];
  const w1 = selArr[0] ?? null;
  const w2 = selArr[1] ?? null;

  function handleClick(word) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else if (next.size < 2) {
        next.add(word);
      } else {
        const [oldest] = next;
        next.delete(oldest);
        next.add(word);
      }
      return next;
    });
  }

  const heatmap = useMemo(() =>
    VOCAB.map(a => VOCAB.map(b => cosSim(EMBEDDINGS[a], EMBEDDINGS[b]))),
    []
  );

  const stats = useMemo(() => {
    const mags = VOCAB.map(w => Math.sqrt(EMBEDDINGS[w].reduce((s, v) => s + v * v, 0)));
    const avgMag = mags.reduce((s, m) => s + m, 0) / mags.length;
    let np = null, ns = -Infinity, fp = null, fs = Infinity;
    for (let i = 0; i < VOCAB.length; i++) {
      for (let j = i + 1; j < VOCAB.length; j++) {
        const s = cosSim(EMBEDDINGS[VOCAB[i]], EMBEDDINGS[VOCAB[j]]);
        if (s > ns) { ns = s; np = [VOCAB[i], VOCAB[j]]; }
        if (s < fs) { fs = s; fp = [VOCAB[i], VOCAB[j]]; }
      }
    }
    return { avgMag, nearestPair: np, nearestSim: ns, farthestPair: fp, farthestSim: fs };
  }, []);

  const denseSim = (w1 && w2) ? cosSim(EMBEDDINGS[w1], EMBEDDINGS[w2]) : null;

  function rowY(i)  { return TTL_H + i * ROW_H; }
  function rowCY(i) { return rowY(i) + ROW_H / 2; }

  return (
    <WidgetCard title="One-Hot vs Embedding — from sparse to dense representation" number="5.1">

      {/* ── SVG panels — full width ──────────────────────────────────────────── */}
      <div style={{ border: '1px solid #242424', borderRadius: '6px', overflow: 'hidden', background: '#0a0a0a' }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>

          {/* Panel titles */}
          <text x={P1 + PW / 2} y={16} textAnchor="middle" fontFamily={SANS} fontSize={12} fill="#888">
            One-Hot Encoding
          </text>
          <text x={P1 + PW / 2} y={28} textAnchor="middle" fontFamily={SANS} fontSize={9} fill="#555">
            Vocabulary size = 8 · 8 dimensions
          </text>
          <text x={P2 + PW / 2} y={16} textAnchor="middle" fontFamily={SANS} fontSize={12} fill="#888">
            Dense Embedding
          </text>
          <text x={P2 + PW / 2} y={28} textAnchor="middle" fontFamily={SANS} fontSize={9} fill="#555">
            6 dimensions · values in [-1, 1]
          </text>

          {/* Word rows */}
          {VOCAB.map((word, i) => {
            const sel = selected.has(word);
            const y   = rowY(i);
            const cy  = rowCY(i);
            const oh  = getOneHot(word);
            const emb = EMBEDDINGS[word];

            return (
              <g key={word}>
                {sel && <rect x={P1} y={y} width={PW} height={ROW_H} fill="rgba(45,212,191,0.06)" />}
                {sel && <rect x={P2} y={y} width={PW} height={ROW_H} fill="rgba(45,212,191,0.06)" />}

                <rect x={P1} y={y} width={PW} height={ROW_H}
                  fill="transparent" style={{ cursor: 'pointer' }}
                  onClick={() => handleClick(word)} />
                <rect x={P2} y={y} width={PW} height={ROW_H}
                  fill="transparent" style={{ cursor: 'pointer' }}
                  onClick={() => handleClick(word)} />

                <text x={P1 + LX} y={cy} textAnchor="end" dominantBaseline="middle"
                  fontFamily={MONO} fontSize={11} fontWeight={sel ? 600 : 400}
                  fill={sel ? '#2dd4bf' : '#888'}>
                  {word}
                </text>
                <text x={P2 + LX} y={cy} textAnchor="end" dominantBaseline="middle"
                  fontFamily={MONO} fontSize={11} fontWeight={sel ? 600 : 400}
                  fill={sel ? '#2dd4bf' : '#888'}>
                  {word}
                </text>

                {oh.map((v, j) => {
                  const cx    = P1 + CX + j * (OH_W + OH_G);
                  const isOne = v === 1;
                  return (
                    <rect key={j}
                      x={cx} y={cy - OH_H / 2} width={OH_W} height={OH_H}
                      fill={isOne ? '#2dd4bf' : '#1e1e1e'}
                      stroke={sel && isOne ? 'white' : 'none'}
                      strokeWidth={sel && isOne ? 1.5 : 0}
                      rx={2}
                    />
                  );
                })}

                {emb.map((v, j) => {
                  const cx = P2 + CX + j * (DE_W + DE_G);
                  return (
                    <g key={j}>
                      <rect x={cx} y={cy - DE_H / 2} width={DE_W} height={DE_H}
                        fill={cellColor(v)} rx={2} />
                      {showValues && (
                        <text x={cx + DE_W / 2} y={cy}
                          textAnchor="middle" dominantBaseline="middle"
                          fontFamily={MONO} fontSize={7}
                          fill={Math.abs(v) > 0.3 ? 'white' : '#555'}>
                          {v.toFixed(1)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Two words selected — similarity comparison ───────────────────────── */}
      {selected.size === 2 && (
        <div style={{ marginTop: '10px', background: '#161616', borderRadius: '8px', padding: '12px 16px', border: '1px solid #242424' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                One-Hot Cosine Sim
              </div>
              <div style={{ fontFamily: MONO, fontSize: '12px', color: '#555', marginBottom: '3px' }}>
                cos({w1}, {w2}) = 0.000
              </div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: '#555', marginBottom: '7px' }}>
                Always 0 for distinct words.
              </div>
              <div style={{ height: '8px', borderRadius: '4px', background: '#1e1e1e' }} />
            </div>

            <div style={{ width: 1, background: '#242424', flexShrink: 0 }} />

            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Dense Cosine Sim
              </div>
              <div style={{ fontFamily: MONO, fontSize: '12px', color: simColor(denseSim), marginBottom: '3px' }}>
                cos({w1}, {w2}) = {denseSim.toFixed(3)}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: simColor(denseSim), marginBottom: '7px' }}>
                {simLabel(denseSim)}
              </div>
              <div style={{ height: '8px', borderRadius: '4px', background: '#1e1e1e', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${Math.max(0, denseSim) * 100}%`,
                  background: simColor(denseSim),
                  borderRadius: '4px',
                  transition: 'width 0.25s ease',
                  maxWidth: '100%',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── One word selected — show vector values ───────────────────────────── */}
      {selected.size === 1 && (
        <div style={{ marginTop: '10px', background: '#161616', borderRadius: '8px', padding: '10px 14px', border: '1px solid #242424' }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {w1} — click another word to compare
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: '#555', marginBottom: '3px' }}>ONE-HOT</div>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: '#888' }}>
                [{getOneHot(w1).join(', ')}]
              </div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: '#555', marginBottom: '3px' }}>DENSE</div>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: '#888' }}>
                [{EMBEDDINGS[w1].map(v => v.toFixed(2)).join(', ')}]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Heatmap ──────────────────────────────────────────────────────────── */}
      {showHeatmap && <Heatmap data={heatmap} />}

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: '12px',
        display: 'flex', gap: '16px', alignItems: 'center',
        background: '#111111', border: '1px solid #242424',
        borderRadius: '8px', padding: '10px 16px',
        flexWrap: 'wrap',
      }}>
        <StatCell label="vocab"     val="8 words"  vc="#888" />
        <StatCell label="1-hot dim" val="8"        vc="#888" />
        <StatCell label="embed dim" val="6"        vc="#888" />

        <VDivider />

        <StatCell label="1-hot cos" val="always 0" vc="#555" />
        <StatCell label="avg ‖v‖"   val={stats.avgMag.toFixed(2)} />

        <VDivider />

        <StatCell
          label="nearest pair"
          val={stats.nearestSim.toFixed(3)}
          vc="#2dd4bf"
          note={stats.nearestPair.join(' / ')}
        />
        <StatCell
          label="farthest pair"
          val={stats.farthestSim.toFixed(3)}
          vc="#555"
          note={stats.farthestPair.join(' / ')}
        />

        {selected.size === 2 && <>
          <VDivider />
          <StatCell label="selected"  val={[...selected].join(' / ')} vc="#888" />
          <StatCell label="1-hot sim" val="0.000"                     vc="#555" />
          <StatCell label="dense sim" val={denseSim.toFixed(3)}       vc={simColor(denseSim)} />
        </>}
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelected(new Set())}
          style={{
            fontFamily: MONO, fontSize: '11px',
            color: '#555', background: 'transparent',
            border: '1px solid #242424', borderRadius: '4px',
            padding: '5px 12px', cursor: 'pointer',
          }}
        >
          Clear selection
        </button>
        <Toggle checked={showHeatmap} onChange={setShowHeatmap} label="Show all similarities" />
        <Toggle checked={showValues}  onChange={setShowValues}  label="Show cell values" />
      </div>

    </WidgetCard>
  );
}
