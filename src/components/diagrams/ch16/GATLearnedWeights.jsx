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

// Five neighbors around v at evenly-spaced angles (pentagon).
const ANGLES = [90, 18, -54, -126, 162];  // degrees; 90 = top
const R_RING = 78;
const V_R = 22;
const U_R = 15;

function neighborPos(cx, cy, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + R_RING * Math.cos(rad),
    y: cy - R_RING * Math.sin(rad),  // flip y for SVG
  };
}

function Panel({ cx, cy, title, sub, weights, gat }) {
  const subs = ['₁', '₂', '₃', '₄', '₅'];
  return (
    <g>
      {/* Title */}
      <text x={cx} y={cy - 100} textAnchor="middle"
            fontFamily={mono} fontSize="11.5" fill={C.text}>
        {title}
      </text>

      {/* Edges with weight labels */}
      {ANGLES.map((angle, i) => {
        const p = neighborPos(cx, cy, angle);
        const w = weights[i];
        const sw = Math.max(0.8, w * 7.5);
        const highlight = gat && i === 1;
        const dx = p.x - cx, dy = p.y - cy;
        const dist = Math.hypot(dx, dy);
        const ux = dx / dist, uy = dy / dist;
        const x1 = cx + ux * V_R;
        const y1 = cy + uy * V_R;
        const x2 = p.x - ux * U_R;
        const y2 = p.y - uy * U_R;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const labelTxt = gat ? `α=${w.toFixed(2)}` : w.toFixed(2);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={highlight ? C.accent : C.muted2}
                  strokeWidth={sw}
                  opacity={highlight ? 1 : 0.6} />
            <rect x={mx - (gat ? 22 : 14)} y={my - 7}
                  width={gat ? 44 : 28} height="14" rx="3"
                  fill={C.bg2}
                  stroke={highlight ? C.accent : C.border}
                  strokeWidth="0.8" />
            <text x={mx} y={my + 3.5} textAnchor="middle"
                  fontFamily={mono} fontSize="9"
                  fill={highlight ? C.accent : C.muted2}>
              {labelTxt}
            </text>
          </g>
        );
      })}

      {/* Center node v */}
      <circle cx={cx} cy={cy} r={V_R}
              fill={C.accentDim} stroke={C.accent} strokeWidth="1.5" />
      <text x={cx} y={cy + 5} textAnchor="middle"
            fontFamily={mono} fontSize="13" fill={C.accent}>
        v
      </text>

      {/* Neighbor nodes */}
      {ANGLES.map((angle, i) => {
        const p = neighborPos(cx, cy, angle);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={U_R}
                    fill={C.bg3} stroke={C.borderLt} strokeWidth="1.5" />
            <text x={p.x} y={p.y + 3.5} textAnchor="middle"
                  fontFamily={mono} fontSize="10" fill={C.text}>
              u{subs[i]}
            </text>
          </g>
        );
      })}

      {/* Sublabel */}
      <text x={cx} y={cy + 130} textAnchor="middle"
            fontFamily={sans} fontSize="10.5" fill={C.muted2} fontStyle="italic">
        {sub}
      </text>
    </g>
  );
}

export default function GATLearnedWeights() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg viewBox="0 0 640 320" width="100%" role="img"
           aria-label="GCN's fixed, degree-based neighbor weights versus GAT's learned attention coefficients"
           style={{ display: 'block' }}>

        <Panel cx={155} cy={150}
               title="GCN: degree-normalized weights"
               sub="weights fixed by topology, not learned"
               weights={[0.29, 0.14, 0.23, 0.19, 0.15]} />

        <Panel cx={485} cy={150}
               title="GAT: learned attention coefficients"
               sub="model learns which neighbors matter"
               weights={[0.05, 0.62, 0.08, 0.18, 0.07]}
               gat />

        {/* Panel divider */}
        <line x1="320" y1="50" x2="320" y2="290"
              stroke={C.border} strokeWidth="1" strokeDasharray="4,3" />

        {/* Bottom annotation */}
        <text x="320" y="312" textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.muted2}>
          GAT's attention ≡ transformer self-attention over an arbitrary graph
        </text>
      </svg>

      <figcaption style={{
        fontFamily: sans, fontSize: '12px', color: C.muted,
        textAlign: 'center', marginTop: '10px', lineHeight: 1.5,
      }}>
        GAT replaces GCN's fixed degree-based weights with learned attention
        coefficients — letting each node decide which neighbors matter most.
      </figcaption>
    </figure>
  );
}
