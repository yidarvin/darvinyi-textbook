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

function NodeGlyph({ cx, cy, r = 20, label }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
              fill={C.bg3} stroke={C.borderLt} strokeWidth="1.5" />
      {[-r / 3, 0, r / 3].map((dy, i) => (
        <line key={i}
              x1={cx - r * 0.55} y1={cy + dy}
              x2={cx + r * 0.55} y2={cy + dy}
              stroke={C.muted2} strokeWidth="0.9" opacity="0.7" />
      ))}
      {label && (
        <text x={cx} y={cy + r + 14}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          {label}
        </text>
      )}
    </g>
  );
}

function VecGlyph({ x, y, w, h, teal = false }) {
  const segs = 3;
  const segH = (h - 6) / segs;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4"
            fill={teal ? C.accentDim : C.bg3}
            stroke={teal ? C.accent : C.borderLt}
            strokeWidth="1.5" />
      {[0, 1, 2].map((i) => (
        <line key={i}
              x1={x + 3} y1={y + 3 + segH * (i + 0.5)}
              x2={x + w - 3} y2={y + 3 + segH * (i + 0.5)}
              stroke={teal ? C.accent : C.muted2}
              strokeWidth="0.9" opacity="0.75" />
      ))}
    </g>
  );
}

export default function MessagePassingStep() {
  // Stage 1 layout
  const u = [
    { x: 60,  y: 80,  label: 'u₁', mLabel: 'm₁' },
    { x: 235, y: 80,  label: 'u₂', mLabel: 'm₂' },
    { x: 60,  y: 215, label: 'u₃', mLabel: 'm₃' },
    { x: 235, y: 215, label: 'u₄', mLabel: 'm₄' },
  ];
  const AGG = { x: 122, y: 122, w: 52, h: 48 };
  const aggCx = AGG.x + AGG.w / 2;  // 148
  const aggCy = AGG.y + AGG.h / 2;  // 146

  // Stage 2 layout
  const HVPREV = { x: 365, y: 80,  w: 26, h: 40 };
  const MV2    = { x: 365, y: 172, w: 26, h: 40 };
  const UPD    = { x: 450, y: 116, w: 78, h: 60 };
  const HVNEXT = { x: 575, y: 124, w: 30, h: 44 };
  const updCx = UPD.x + UPD.w / 2;   // 489
  const updCy = UPD.y + UPD.h / 2;   // 146

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg viewBox="0 0 640 320" width="100%" role="img"
           aria-label="One round of message passing: aggregate neighbors, then update target node"
           style={{ display: 'block' }}>
        <defs>
          <marker id="mp-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="mp-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Stage labels */}
        <text x="165" y="26" textAnchor="middle" fontFamily={mono} fontSize="11"
              fill={C.muted2} letterSpacing="0.08em">
          STAGE 1 · AGGREGATE
        </text>
        <text x="490" y="26" textAnchor="middle" fontFamily={mono} fontSize="11"
              fill={C.muted2} letterSpacing="0.08em">
          STAGE 2 · UPDATE
        </text>

        {/* Divider */}
        <line x1="340" y1="50" x2="340" y2="260"
              stroke={C.border} strokeWidth="1" strokeDasharray="4,3" />

        {/* ── Stage 1: neighbors → AGGREGATE → m_v ───────────────── */}
        {u.map((n, i) => (
          <NodeGlyph key={i} cx={n.x} cy={n.y} r={18} label={n.label} />
        ))}

        {/* AGGREGATE box */}
        <rect x={AGG.x} y={AGG.y} width={AGG.w} height={AGG.h} rx="4"
              fill={C.bg2} stroke={C.muted2} strokeWidth="1.5" />
        <text x={aggCx} y={aggCy + 5} textAnchor="middle"
              fontFamily={mono} fontSize="18" fill={C.text}>
          Σ
        </text>
        <text x={aggCx} y={AGG.y + AGG.h + 16} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted}
              letterSpacing="0.05em">
          AGGREGATE
        </text>

        {/* Dashed message arrows from each neighbor to AGGREGATE box */}
        {u.map((n, i) => {
          const dx = aggCx - n.x;
          const dy = aggCy - n.y;
          const dist = Math.hypot(dx, dy);
          const ux = dx / dist, uy = dy / dist;
          // Start outside neighbor circle (r=18), end outside box edge
          const x1 = n.x + ux * 18;
          const y1 = n.y + uy * 18;
          const x2 = aggCx - ux * 28;
          const y2 = aggCy - uy * 25;
          return (
            <line key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={C.muted2} strokeWidth="1.2"
                  strokeDasharray="3,3" markerEnd="url(#mp-arrow)" />
          );
        })}

        {/* Message labels */}
        <text x="100" y="108" fontFamily={mono} fontSize="10" fill={C.muted}>m₁</text>
        <text x="190" y="108" fontFamily={mono} fontSize="10" fill={C.muted}>m₂</text>
        <text x="100" y="194" fontFamily={mono} fontSize="10" fill={C.muted}>m₃</text>
        <text x="190" y="194" fontFamily={mono} fontSize="10" fill={C.muted}>m₄</text>

        {/* Output arrow from AGGREGATE → m_v glyph */}
        <line x1={AGG.x + AGG.w} y1={aggCy}
              x2="247" y2={aggCy}
              stroke={C.accent} strokeWidth="1.5"
              markerEnd="url(#mp-arrow-teal)" />
        <VecGlyph x="253" y="124" w="24" h="42" teal />
        <text x="265" y="184" textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.accent}>
          m_v
        </text>

        {/* ── Stage 2: m_v + h_v^(l-1) → UPDATE → h_v^(l) ──────────── */}
        <VecGlyph x={HVPREV.x} y={HVPREV.y} w={HVPREV.w} h={HVPREV.h} />
        <text x={HVPREV.x + HVPREV.w / 2} y={HVPREV.y - 8}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          h_v^(ℓ−1)
        </text>

        <VecGlyph x={MV2.x} y={MV2.y} w={MV2.w} h={MV2.h} teal />
        <text x={MV2.x + MV2.w / 2} y={MV2.y + MV2.h + 14}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.accent}>
          m_v
        </text>

        {/* UPDATE box */}
        <rect x={UPD.x} y={UPD.y} width={UPD.w} height={UPD.h} rx="4"
              fill={C.bg2} stroke={C.muted2} strokeWidth="1.5" />
        <text x={updCx} y={updCy - 2} textAnchor="middle"
              fontFamily={mono} fontSize="12" fill={C.text}>
          UPDATE
        </text>
        <text x={updCx} y={updCy + 16} textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted}>
          MLP · GRU
        </text>

        {/* Arrows from glyphs into UPDATE */}
        <line x1={HVPREV.x + HVPREV.w} y1={HVPREV.y + HVPREV.h / 2}
              x2={UPD.x - 2} y2={UPD.y + 16}
              stroke={C.muted2} strokeWidth="1.3"
              markerEnd="url(#mp-arrow)" />
        <line x1={MV2.x + MV2.w} y1={MV2.y + MV2.h / 2}
              x2={UPD.x - 2} y2={UPD.y + UPD.h - 16}
              stroke={C.accent} strokeWidth="1.3"
              markerEnd="url(#mp-arrow-teal)" />

        {/* Output arrow → h_v^(l) glyph */}
        <line x1={UPD.x + UPD.w} y1={updCy}
              x2={HVNEXT.x - 2} y2={updCy}
              stroke={C.accent} strokeWidth="1.5"
              markerEnd="url(#mp-arrow-teal)" />
        <VecGlyph x={HVNEXT.x} y={HVNEXT.y} w={HVNEXT.w} h={HVNEXT.h} teal />
        <text x={HVNEXT.x + HVNEXT.w / 2} y={HVNEXT.y + HVNEXT.h + 14}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.accent}>
          h_v^(ℓ)
        </text>

        {/* Bottom annotation */}
        <text x="320" y="298" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}>
          after k rounds, h_v^(k) reflects v's full k-hop neighborhood
        </text>
      </svg>

      <figcaption style={{
        fontFamily: sans, fontSize: '12px', color: C.muted,
        textAlign: 'center', marginTop: '10px', lineHeight: 1.5,
      }}>
        Each round, every node aggregates messages from its neighbors and
        updates its representation — the building block of every GNN variant.
      </figcaption>
    </figure>
  );
}
