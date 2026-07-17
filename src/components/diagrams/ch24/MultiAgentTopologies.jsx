const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.10)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
  red:      '#f87171',
  redDim:   'rgba(248,113,113,0.10)',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Panel geometry
const P_W = 196;
const P_H = 446;
const P_Y = 60;
const P1_X = 18;
const P2_X = 222;
const P3_X = 426;

const CX = [P1_X + P_W / 2, P2_X + P_W / 2, P3_X + P_W / 2]; // 116, 320, 524

// Node helper
const Node = ({ cx, cy, r = 14, fill = C.bg2, stroke = C.muted2, sw = 1.2, label, labelY, labelColor = C.text, labelSize = 9 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={fill}
            stroke={stroke} strokeWidth={sw} />
    {label && (
      <text x={cx} y={labelY ?? cy + r + 12}
            textAnchor="middle"
            fontFamily={mono} fontSize={labelSize}
            fill={labelColor}>
        {label}
      </text>
    )}
  </g>
);

export default function MultiAgentTopologies() {
  const totalH = 620;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 640 ${totalH}`}
        width="100%"
        role="img"
        aria-label="Three multi-agent topology patterns shown side by side. Panel 1: supervisor-worker (a planner agent delegates to specialized workers). Panel 2: sequential pipeline (each agent does one stage). Panel 3: peer-collaboration swarm (agents debate, often underperforming a single strong agent). Panel 1 is highlighted as the dominant 2026 production pattern."
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="mat-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="mat-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
          <marker id="mat-arrow-bi-a" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
          <marker id="mat-arrow-bi-a-start" viewBox="0 0 10 10" refX="1" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 10 0 L 0 5 L 10 10 z" fill={C.accent} />
          </marker>
          <marker id="mat-arrow-bi-m" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="mat-arrow-bi-m-start" viewBox="0 0 10 10" refX="1" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 10 0 L 0 5 L 10 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          three multi-agent topologies — how the work is divided
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          coordination structures vary; not all are equally productive
        </text>

        {/* ─── PANEL 1: Supervisor → Workers (highlighted teal) ─── */}
        <rect x={P1_X} y={P_Y} width={P_W} height={P_H} rx="6"
              fill={C.accentDim} stroke={C.accent} strokeWidth="1.4" />
        <text x={CX[0]} y={P_Y + 22} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.accent}
              fontWeight="600">
          Supervisor → Workers
        </text>
        <text x={CX[0]} y={P_Y + 36} textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.accent}
              letterSpacing="0.06em">
          DOMINANT 2026 PATTERN
        </text>

        {/* Supervisor node */}
        <Node cx={CX[0]} cy={P_Y + 90} r={20}
              fill={C.bg3} stroke={C.accent} sw={1.6}
              label="Planner /"
              labelY={P_Y + 87}
              labelColor={C.accent}
              labelSize={9} />
        <text x={CX[0]} y={P_Y + 97} textAnchor="middle"
              fontFamily={mono} fontSize={9} fill={C.accent}>
          Supervisor
        </text>

        {/* Worker nodes */}
        {[
          { cx: CX[0] - 60, label: 'Search' },
          { cx: CX[0],       label: 'Code'   },
          { cx: CX[0] + 60, label: 'Review' },
        ].map((w, i) => (
          <g key={i}>
            {/* down arrow (delegation) */}
            <line x1={CX[0]} y1={P_Y + 110}
                  x2={w.cx + (w.cx === CX[0] ? 0 : (w.cx > CX[0] ? -3 : 3))}
                  y2={P_Y + 180}
                  stroke={C.accent} strokeWidth="1.2"
                  opacity="0.8"
                  markerEnd="url(#mat-arrow-accent)" />
            {/* up arrow (return) shifted slightly */}
            <line x1={w.cx + (w.cx === CX[0] ? 8 : (w.cx > CX[0] ? 6 : -6))}
                  y1={P_Y + 180}
                  x2={CX[0] + (w.cx === CX[0] ? 8 : (w.cx > CX[0] ? 12 : -12))}
                  y2={P_Y + 112}
                  stroke={C.muted2} strokeWidth="0.8"
                  strokeDasharray="2 2"
                  opacity="0.5"
                  markerEnd="url(#mat-arrow-muted)" />

            <Node cx={w.cx} cy={P_Y + 196} r={16}
                  fill={C.bg3} stroke={C.accent} sw={1.2}
                  label={w.label}
                  labelY={P_Y + 230}
                  labelColor={C.text}
                  labelSize={9.5} />
          </g>
        ))}

        {/* Panel 1 annotation */}
        <text x={CX[0]} y={P_Y + 270} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.text}
              fontStyle="italic">
          central coordination
        </text>
        <text x={CX[0]} y={P_Y + 286} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          supervisor decides who works
        </text>
        <text x={CX[0]} y={P_Y + 300} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          on what, integrates results
        </text>

        {/* Panel 1 tag */}
        <line x1={P1_X + 18} y1={P_Y + 326}
              x2={P1_X + P_W - 18} y2={P_Y + 326}
              stroke={C.accent} strokeWidth="0.6" opacity="0.4" />
        <text x={CX[0]} y={P_Y + 348} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.accent}
              letterSpacing="0.04em">
          IN PRODUCTION
        </text>
        <text x={CX[0]} y={P_Y + 366} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.text}>
          coding agents often
        </text>
        <text x={CX[0]} y={P_Y + 380} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.text}>
          expose this decomposition
        </text>

        <text x={CX[0]} y={P_Y + 414} textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.accent}
              fontWeight="600">
          proven in production
        </text>
        <text x={CX[0]} y={P_Y + 428} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.muted2}
              fontStyle="italic">
          for narrow specialization
        </text>

        {/* ─── PANEL 2: Pipeline / Sequential ─── */}
        <rect x={P2_X} y={P_Y} width={P_W} height={P_H} rx="6"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1" />
        <text x={CX[1]} y={P_Y + 22} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}
              fontWeight="600">
          Pipeline / Sequential
        </text>
        <text x={CX[1]} y={P_Y + 36} textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}
              letterSpacing="0.06em">
          ASSEMBLY-LINE
        </text>

        {/* Pipeline nodes (vertical) */}
        {[
          { cy: P_Y + 80,  label: 'Researcher' },
          { cy: P_Y + 130, label: 'Planner'    },
          { cy: P_Y + 180, label: 'Executor'   },
          { cy: P_Y + 230, label: 'Reviewer'   },
        ].map((n, i, arr) => (
          <g key={i}>
            <circle cx={CX[1]} cy={n.cy} r={14}
                    fill={C.bg3} stroke={C.muted2} strokeWidth="1.2" />
            <text x={CX[1] + 22} y={n.cy + 3}
                  fontFamily={mono} fontSize="9.5" fill={C.text}>
              {n.label}
            </text>
            {i < arr.length - 1 && (
              <line x1={CX[1]} y1={n.cy + 14}
                    x2={CX[1]} y2={arr[i + 1].cy - 14 - 2}
                    stroke={C.muted2} strokeWidth="1.1"
                    markerEnd="url(#mat-arrow-muted)" />
            )}
          </g>
        ))}

        {/* Panel 2 annotation */}
        <text x={CX[1]} y={P_Y + 280} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.text}
              fontStyle="italic">
          assembly-line decomposition
        </text>
        <text x={CX[1]} y={P_Y + 296} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          each agent does one stage,
        </text>
        <text x={CX[1]} y={P_Y + 310} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          passes output to the next
        </text>

        <line x1={P2_X + 18} y1={P_Y + 326}
              x2={P2_X + P_W - 18} y2={P_Y + 326}
              stroke={C.border} strokeWidth="0.6" />
        <text x={CX[1]} y={P_Y + 348} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted2}
              letterSpacing="0.04em">
          USE CASES
        </text>
        <text x={CX[1]} y={P_Y + 366} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.text}>
          workflow agents
        </text>
        <text x={CX[1]} y={P_Y + 380} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.text}>
          data-processing chains
        </text>

        <text x={CX[1]} y={P_Y + 414} textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted2}
              fontWeight="600">
          situational fit
        </text>
        <text x={CX[1]} y={P_Y + 428} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.muted}
              fontStyle="italic">
          works for linear flows
        </text>

        {/* ─── PANEL 3: Swarm / Peer ─── */}
        <rect x={P3_X} y={P_Y} width={P_W} height={P_H} rx="6"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1" />
        <text x={CX[2]} y={P_Y + 22} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}
              fontWeight="600">
          Swarm / Peer
        </text>
        <text x={CX[2]} y={P_Y + 36} textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}
              letterSpacing="0.06em">
          DEBATE-STYLE
        </text>

        {/* Swarm: 4 nodes in a square, all-to-all */}
        {(() => {
          const center = { cx: CX[2], cy: P_Y + 165 };
          const offset = 48;
          const nodes = [
            { cx: center.cx,          cy: center.cy - offset, label: 'A' },
            { cx: center.cx + offset, cy: center.cy,          label: 'B' },
            { cx: center.cx,          cy: center.cy + offset, label: 'C' },
            { cx: center.cx - offset, cy: center.cy,          label: 'D' },
          ];
          // All edges between pairs (6 edges)
          const edges = [];
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              edges.push([nodes[i], nodes[j]]);
            }
          }
          // Inset to avoid arrow heads overlapping nodes
          const insetEdge = (a, b, inset = 14) => {
            const dx = b.cx - a.cx, dy = b.cy - a.cy;
            const len = Math.hypot(dx, dy);
            const ux = dx / len, uy = dy / len;
            return {
              x1: a.cx + ux * inset, y1: a.cy + uy * inset,
              x2: b.cx - ux * inset, y2: b.cy - uy * inset,
            };
          };
          return (
            <g>
              {edges.map((e, i) => {
                const seg = insetEdge(e[0], e[1]);
                return (
                  <line key={i}
                        x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                        stroke={C.muted2} strokeWidth="0.9"
                        opacity="0.55"
                        markerStart="url(#mat-arrow-bi-m-start)"
                        markerEnd="url(#mat-arrow-bi-m)" />
                );
              })}
              {nodes.map((n, i) => (
                <g key={i}>
                  <circle cx={n.cx} cy={n.cy} r={13}
                          fill={C.bg3} stroke={C.muted2} strokeWidth="1.2" />
                  <text x={n.cx} y={n.cy + 4}
                        textAnchor="middle"
                        fontFamily={mono} fontSize="10" fill={C.text}
                        fontWeight="600">
                    {n.label}
                  </text>
                </g>
              ))}
            </g>
          );
        })()}

        {/* Panel 3 annotation */}
        <text x={CX[2]} y={P_Y + 280} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.text}
              fontStyle="italic">
          peer collaboration
        </text>
        <text x={CX[2]} y={P_Y + 296} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          agents debate and try to
        </text>
        <text x={CX[2]} y={P_Y + 310} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          converge on a solution
        </text>

        <line x1={P3_X + 18} y1={P_Y + 326}
              x2={P3_X + P_W - 18} y2={P_Y + 326}
              stroke={C.border} strokeWidth="0.6" />
        <text x={CX[2]} y={P_Y + 348} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted2}
              letterSpacing="0.04em">
          USE CASES
        </text>
        <text x={CX[2]} y={P_Y + 366} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.text}>
          AutoGen group chat
        </text>
        <text x={CX[2]} y={P_Y + 380} textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.text}>
          debate setups
        </text>

        {/* Red flag */}
        <rect x={P3_X + 12} y={P_Y + 396} width={P_W - 24} height="40"
              rx="4" fill={C.redDim} stroke={C.red}
              strokeWidth="0.9" opacity="0.85" />
        <text x={CX[2]} y={P_Y + 411} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.red}
              fontWeight="600">
          often underperforms
        </text>
        <text x={CX[2]} y={P_Y + 424} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.red}>
          a single strong agent —
        </text>
        <text x={CX[2]} y={P_Y + 435} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.red}>
          overhead, false consensus
        </text>

        {/* Unified bottom annotation */}
        <line x1="22" y1={P_Y + P_H + 24}
              x2="618" y2={P_Y + P_H + 24}
              stroke={C.border} strokeWidth="0.6" />
        <text x="320" y={P_Y + P_H + 46} textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.text}
              fontWeight="500">
          2026 consensus
        </text>
        <text x="320" y={P_Y + P_H + 64} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          complex multi-agent systems rarely outperform a single strong agent unless the
        </text>
        <text x="320" y={P_Y + P_H + 78} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          task genuinely benefits from specialization, parallel exploration, or human-in-the-loop gates.
        </text>
      </svg>

      <figcaption
        style={{
          fontFamily: sans,
          fontSize: '12px',
          color: C.muted,
          textAlign: 'center',
          marginTop: '10px',
          lineHeight: 1.5,
        }}
      >
        Multi-agent topologies vary by coordination structure; in 2026 supervisor-worker patterns dominate
        production, while peer-collaboration swarms remain mostly a research curiosity.
      </figcaption>
    </figure>
  );
}
