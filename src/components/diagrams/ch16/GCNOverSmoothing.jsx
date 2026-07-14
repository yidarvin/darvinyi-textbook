const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.18)',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Local node positions (within a 180×140 panel area, origin top-left of graph region)
const NODES = [
  { id: 'a', x: 22,  y: 18  },
  { id: 'b', x: 82,  y: 8   },
  { id: 'c', x: 145, y: 26  },
  { id: 'd', x: 50,  y: 70  },
  { id: 'e', x: 118, y: 78  },
  { id: 'f', x: 18,  y: 130 },
  { id: 'g', x: 82,  y: 124 },
  { id: 'h', x: 150, y: 132 },
];

const EDGES = [
  ['a','b'], ['b','c'], ['a','d'], ['b','d'],
  ['b','e'], ['c','e'], ['d','e'], ['d','g'],
  ['e','g'], ['e','h'], ['f','g'], ['g','h'],
];

const PANEL1_COLORS = {
  a: '#f87171', b: '#fb923c', c: '#fbbf24', d: '#34d399',
  e: '#2dd4bf', f: '#60a5fa', g: '#a78bfa', h: '#f472b6',
};

const PANEL2_COLORS = {
  a: '#5e8a85', b: '#6e948b', c: '#7a9a90', d: '#5d8d8a',
  e: '#65938f', f: '#5b8a87', g: '#6f978f', h: '#7a9c90',
};

// Degrees in this graph range from 1 (f) to 5 (e) — an irregular graph, so
// over-smoothing collapses nodes toward a degree-scaled subspace, not a
// single shared vector. Same-degree nodes (a/c/h: deg 2; b/d/g: deg 4)
// converge to near-identical color; f (deg 1) and e (deg 5) stay distinct.
const PANEL3_COLORS = {
  a: '#5d6f6c', b: '#70827f', c: '#5d6f6c', d: '#70827f',
  e: '#7f9188', f: '#4a5c59', g: '#70827f', h: '#5d6f6c',
};

function Panel({ ox, oy, title, sub, colors, highlightCenter }) {
  const lookup = (id) => NODES.find((n) => n.id === id);
  return (
    <g>
      {/* Title */}
      <text x={ox + 85} y={oy - 24} textAnchor="middle"
            fontFamily={mono} fontSize="11.5" fill={C.text}>
        {title}
      </text>

      {/* Edges */}
      {EDGES.map(([a, b], i) => {
        const na = lookup(a), nb = lookup(b);
        return (
          <line key={i}
                x1={ox + na.x} y1={oy + na.y}
                x2={ox + nb.x} y2={oy + nb.y}
                stroke={C.borderLt} strokeWidth="1" opacity="0.85" />
        );
      })}

      {/* Nodes */}
      {NODES.map((n) => {
        const isHi = highlightCenter && n.id === 'e';
        return (
          <circle key={n.id}
                  cx={ox + n.x} cy={oy + n.y}
                  r={isHi ? 11 : 9}
                  fill={colors[n.id]}
                  stroke={isHi ? C.accent : 'rgba(229,231,235,0.15)'}
                  strokeWidth={isHi ? '2' : '1'}
                  opacity={isHi ? 1 : 0.93} />
        );
      })}

      {/* Sublabel */}
      <text x={ox + 85} y={oy + 178} textAnchor="middle"
            fontFamily={sans} fontSize="10.5" fill={C.muted2} fontStyle="italic">
        {sub}
      </text>
    </g>
  );
}

export default function GCNOverSmoothing() {
  // Panel x-origins (each panel ~180 wide, content centered)
  const P1 = 30, P2 = 240, P3 = 450;
  const PY = 75;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg viewBox="0 0 640 320" width="100%" role="img"
           aria-label="Over-smoothing: GCN node representations converge as depth grows"
           style={{ display: 'block' }}>

        <Panel ox={P1} oy={PY}
               title="after 1 layer"
               sub="nodes distinguishable"
               colors={PANEL1_COLORS}
               highlightCenter />

        <Panel ox={P2} oy={PY}
               title="after 3 layers"
               sub="some over-smoothing — usable"
               colors={PANEL2_COLORS} />

        <Panel ox={P3} oy={PY}
               title="after 10 layers"
               sub="same-degree nodes converge"
               colors={PANEL3_COLORS} />

        {/* Panel dividers */}
        <line x1="220" y1="55" x2="220" y2="270"
              stroke={C.border} strokeWidth="1"
              strokeDasharray="3,3" opacity="0.6" />
        <line x1="430" y1="55" x2="430" y2="270"
              stroke={C.border} strokeWidth="1"
              strokeDasharray="3,3" opacity="0.6" />

        {/* Bottom annotation — two lines */}
        <text x="320" y="295" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}>
          practical GCN depth: 2–3 layers
        </text>
        <text x="320" y="311" textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted}>
          beyond that, nodes collapse toward a shared, degree-scaled subspace
        </text>
      </svg>

      <figcaption style={{
        fontFamily: sans, fontSize: '12px', color: C.muted,
        textAlign: 'center', marginTop: '10px', lineHeight: 1.5,
      }}>
        GCN's normalized averaging causes representations to converge across
        layers — limiting practical depth to 2–3 stacks, unlike CNNs and
        transformers where deeper is almost always better.
      </figcaption>
    </figure>
  );
}
