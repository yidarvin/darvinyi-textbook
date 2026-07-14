import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  bg:        '#0d0d0d',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  muted:     '#555555',
  mid:       '#888888',
  text:      '#e8eaed',
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  green:     '#34d399',
  red:       '#f87171',
};

const mono  = { fontFamily: "'JetBrains Mono', monospace" };
const inter = { fontFamily: "'Inter', sans-serif" };

const QUERIES = [
  {
    text: "a cat sitting indoors",
    results: [
      { label: "Indoor Cat",    score: 0.91, color: "#2dd4bf" },
      { label: "Tabby Cat",     score: 0.78, color: "#2dd4bf" },
      { label: "Cat on a Mat",  score: 0.71, color: "#2dd4bf" },
      { label: "Dog Sitting",   score: 0.41, color: "#fb923c" },
      { label: "Parked Car",    score: 0.19, color: "#555"    },
      { label: "Mountain View", score: 0.08, color: "#555"    },
    ],
  },
  {
    text: "sunset over the ocean at dusk",
    results: [
      { label: "Ocean Sunset",     score: 0.94, color: "#fb923c" },
      { label: "Beach at Evening", score: 0.81, color: "#fb923c" },
      { label: "Lake at Dusk",     score: 0.72, color: "#fb923c" },
      { label: "Daytime Ocean",    score: 0.49, color: "#a78bfa" },
      { label: "Desert Sky",       score: 0.35, color: "#a78bfa" },
      { label: "City at Night",    score: 0.13, color: "#555"    },
    ],
  },
  {
    text: "a red sports car on a highway",
    results: [
      { label: "Red Sports Car",  score: 0.95, color: "#f87171" },
      { label: "Red Sedan",       score: 0.80, color: "#f87171" },
      { label: "Blue Sports Car", score: 0.63, color: "#a78bfa" },
      { label: "Car on Highway",  score: 0.51, color: "#fb923c" },
      { label: "Truck Highway",   score: 0.28, color: "#555"    },
      { label: "Bicycle Lane",    score: 0.09, color: "#555"    },
    ],
  },
  {
    text: "snowy mountain peak at sunrise",
    results: [
      { label: "Snowy Mountain", score: 0.97, color: "#2dd4bf" },
      { label: "Mountain Peak",  score: 0.83, color: "#2dd4bf" },
      { label: "Ski Resort",     score: 0.70, color: "#34d399" },
      { label: "Snow Field",     score: 0.58, color: "#34d399" },
      { label: "Rocky Mountain", score: 0.41, color: "#fb923c" },
      { label: "Green Hills",    score: 0.11, color: "#555"    },
    ],
  },
];

function hexToRgba(hex, alpha) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function StatLine({ label, val, valColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4, marginBottom: 5 }}>
      <span style={{ ...inter, fontSize: 10, color: C.muted, flexShrink: 0 }}>{label}</span>
      <span style={{
        ...mono, fontSize: 10, color: valColor || C.accent,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: 'right',
      }}>
        {val}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '6px 0 7px' }} />;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
      <input
        type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: C.accent, width: 11, height: 11, cursor: 'pointer' }}
      />
      <span style={{ ...mono, fontSize: 10, color: C.muted }}>{label}</span>
    </label>
  );
}

export default function CrossModalRetrieval({ tryThis }) {
  const [activeQuery,      setActiveQuery]      = useState(0);
  const [threshold,        setThreshold]        = useState(0.0);
  const [showScores,       setShowScores]       = useState(true);
  const [animate,          setAnimate]          = useState(true);
  const [displayedResults, setDisplayedResults] = useState(QUERIES[0].results);
  const [animPhase,        setAnimPhase]        = useState('growing');
  const [colorVisible,     setColorVisible]     = useState(true);

  const timerIds = useRef([]);

  function clearTimers() {
    timerIds.current.forEach(clearTimeout);
    timerIds.current = [];
  }

  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timerIds.current.push(id);
  }

  useEffect(() => () => { timerIds.current.forEach(clearTimeout); }, []);

  function switchQuery(idx) {
    if (idx === activeQuery) return;
    setActiveQuery(idx);
    clearTimers();

    if (!animate) {
      setDisplayedResults(QUERIES[idx].results);
      setAnimPhase('growing');
      setColorVisible(true);
      return;
    }

    setAnimPhase('resetting');
    setColorVisible(false);
    later(() => setDisplayedResults(QUERIES[idx].results), 100);
    later(() => { setColorVisible(true); setAnimPhase('growing'); }, 150);
  }

  const results     = displayedResults;
  const avgTop3     = (results[0].score + results[1].score + results[2].score) / 3;
  const avgBot3     = (results[3].score + results[4].score + results[5].score) / 3;
  const separation  = avgTop3 - avgBot3;
  const above70     = results.filter(r => r.score >= 0.70).length;
  const below30     = results.filter(r => r.score <  0.30).length;
  const filteredOut = results.filter(r => r.score < threshold).length;

  return (
    <WidgetCard
      title="Cross-Modal Retrieval — text query finds matching images"
      number="15.4"
      tryThis={tryThis}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

        {/* ── Left: Query Selector ──────────────────────────────────────── */}
        <div style={{ width: 172, flexShrink: 0 }}>
          <div style={{
            ...mono, fontSize: 11, color: C.muted,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 8,
          }}>
            Text Query
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUERIES.map((q, i) => (
              <div
                key={i}
                onClick={() => switchQuery(i)}
                style={{
                  background:        activeQuery === i ? C.accentDim : C.bg3,
                  border:            `1px solid ${activeQuery === i ? C.accent : C.border}`,
                  borderRadius:      6,
                  padding:           '10px 14px',
                  cursor:            'pointer',
                  ...inter,
                  fontSize:          12,
                  color:             activeQuery === i ? C.text : C.mid,
                  lineHeight:        1.4,
                  display:           '-webkit-box',
                  WebkitLineClamp:   3,
                  WebkitBoxOrient:   'vertical',
                  overflow:          'hidden',
                }}
              >
                {q.text}
              </div>
            ))}
          </div>

          <p style={{
            ...inter, fontSize: 10, color: C.muted, fontStyle: 'italic',
            lineHeight: 1.4, margin: '10px 0 0',
          }}>
            Retrieval by cosine similarity in joint embedding space.
          </p>
        </div>

        {/* ── Center: Results Grid ──────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {results.map((result, rank) => {
              const isPoor         = result.score < 0.30;
              const belowThreshold = threshold > 0 && result.score < threshold;
              const scoreColor     = result.score >= 0.5  ? result.color
                                   : result.score <  0.30 ? C.muted
                                   : C.mid;
              const barWidth = animPhase === 'growing' ? `${result.score * 100}%` : '0%';

              return (
                <div
                  key={rank}
                  style={{
                    position:     'relative',
                    background:   C.bg3,
                    border:       rank === 0
                      ? `2px solid ${C.accent}`
                      : `1px solid ${C.border}`,
                    borderRadius: 8,
                    overflow:     'hidden',
                    opacity:      isPoor ? 0.55 : 1,
                    boxShadow:    rank === 0 ? '0 0 12px rgba(45,212,191,0.2)' : 'none',
                    boxSizing:    'border-box',
                  }}
                >
                  {/* Color block */}
                  <div style={{
                    height:         70,
                    background:     `linear-gradient(135deg, ${hexToRgba(result.color, 0.25)}, ${hexToRgba(result.color, 0.40)})`,
                    position:       'relative',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    padding:        '0 8px 0 28px',
                    opacity:        colorVisible ? 1 : 0,
                    transition:     'opacity 200ms ease',
                  }}>
                    {/* Rank badge */}
                    <div style={{
                      position:       'absolute',
                      top:            5,
                      left:           5,
                      width:          20,
                      height:         20,
                      borderRadius:   '50%',
                      background:     rank === 0 ? C.accent : '#ffffff',
                      color:          C.bg,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      ...mono,
                      fontSize:   10,
                      fontWeight: 'bold',
                      lineHeight: 1,
                      zIndex:     2,
                    }}>
                      {rank + 1}
                    </div>

                    {/* Image placeholder label */}
                    <span style={{
                      ...inter,
                      fontSize:   11,
                      color:      C.mid,
                      textAlign:  'center',
                      lineHeight: 1.3,
                    }}>
                      {result.label}
                    </span>
                  </div>

                  {/* Score section */}
                  <div style={{
                    height:        40,
                    padding:       '6px 8px 5px',
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           4,
                    boxSizing:     'border-box',
                  }}>
                    {/* Score bar */}
                    <div style={{ height: 4, background: C.bg4, borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{
                        height:     '100%',
                        width:      barWidth,
                        background: result.color,
                        transition: (animate && animPhase === 'growing') ? 'width 400ms ease-out' : 'none',
                        borderRadius: 2,
                      }} />
                    </div>

                    {/* Score label */}
                    {showScores && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {isPoor
                          ? <span style={{ ...inter, fontSize: 8, color: C.muted }}>poor match</span>
                          : <span />
                        }
                        <span style={{ ...mono, fontSize: 11, color: scoreColor }}>
                          {Math.round(result.score * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Threshold overlay */}
                  {belowThreshold && (
                    <div style={{
                      position:       'absolute',
                      inset:          0,
                      background:     'rgba(13,13,13,0.6)',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      zIndex:         4,
                    }}>
                      <span style={{ ...mono, fontSize: 9, color: C.red }}>below threshold</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Stats Panel ─────────────────────────────────────────── */}
        <div style={{
          width:        172,
          flexShrink:   0,
          background:   C.bg2,
          border:       `1px solid ${C.border}`,
          borderRadius: 8,
          padding:      '12px 13px',
        }}>
          <div style={{
            ...inter, fontSize: 10, color: C.mid, lineHeight: 1.4, marginBottom: 2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {QUERIES[activeQuery].text}
          </div>
          <Divider />

          <div style={{ marginBottom: 5 }}>
            <div style={{ ...inter, fontSize: 10, color: C.muted, marginBottom: 2 }}>Top match</div>
            <div style={{ ...mono, fontSize: 10, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {results[0].label}
            </div>
          </div>
          <StatLine label="Similarity" val={results[0].score.toFixed(2)} valColor={C.accent} />
          <Divider />

          <StatLine label="Avg top-3 sim"    val={avgTop3.toFixed(2)}   valColor={C.green} />
          <StatLine label="Avg bottom-3 sim" val={avgBot3.toFixed(2)}   valColor={C.mid} />
          <StatLine
            label="Separation"
            val={separation.toFixed(2)}
            valColor={separation >= 0.4 ? C.green : C.accent}
          />
          <Divider />

          <StatLine
            label="Above 0.70"
            val={`${above70} / 6`}
            valColor={above70 >= 3 ? C.green : C.mid}
          />
          <StatLine
            label="Below 0.30"
            val={`${below30} / 6`}
            valColor={below30 >= 2 ? C.red : C.mid}
          />
          <StatLine label="Threshold"    val={threshold.toFixed(2)} valColor={C.mid} />
          <StatLine
            label="Filtered out"
            val={`${filteredOut} / 6`}
            valColor={filteredOut > 0 ? C.red : C.mid}
          />
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ ...mono, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Threshold
            </span>
            <span style={{ ...mono, fontSize: 11, color: C.accent }}>
              Min similarity: {threshold.toFixed(2)}
            </span>
          </div>
          <input
            type="range" min={0} max={0.9} step={0.05} value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <Toggle label="Show scores" checked={showScores} onChange={setShowScores} />
          <Toggle label="Animate"     checked={animate}    onChange={setAnimate}    />
        </div>
      </div>
    </WidgetCard>
  );
}
