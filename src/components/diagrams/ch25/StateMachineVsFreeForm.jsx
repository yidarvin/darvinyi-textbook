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
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const LEFT_X = 16;
const RIGHT_X = 328;
const PANEL_W = 296;
const DIVIDER_X = 320;

const LEFT_ISSUES = [
  'hard to know what the agent actually did',
  'hard to test individual steps',
  'hard to recover from a partial failure',
  'hard to insert human checkpoints',
  'replaying a failed run is approximate',
];

const RIGHT_BENEFITS = [
  'node responsibilities are explicit',
  'each node is independently testable',
  'failures replay from any node',
  'human checkpoints are first-class',
  'full execution trace captured',
];

export default function StateMachineVsFreeForm() {
  const totalH = 600;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg viewBox={`0 0 640 ${totalH}`} width="100%" role="img"
           aria-label="Same task, two control-flow models — free-form autonomous loop versus state machine."
           style={{ display: 'block' }}>
        <defs>
          <marker id="sm-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="sm-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
          <marker id="sm-arrow-red" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.red} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          Same task, two control-flow models
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          "research a topic and write a report"
        </text>

        {/* Divider */}
        <line x1={DIVIDER_X} y1="56" x2={DIVIDER_X} y2={totalH - 40}
              stroke={C.border} strokeWidth="0.8" strokeDasharray="3 4" />

        {/* ─── LEFT — Free-form autonomous agent ─── */}
        <text x={LEFT_X + PANEL_W / 2} y="74" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}
              fontWeight="600">
          Free-form autonomous agent
        </text>
        <text x={LEFT_X + PANEL_W / 2} y="90" textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted2}
              fontStyle="italic">
          agent decides its own control flow
        </text>

        {/* Loop diagram: agent at center, dashed loop region with phase markers around it */}
        {(() => {
          const cx = LEFT_X + PANEL_W / 2;
          const cy = 195;
          const R = 78;
          // phase markers around the circle (6 phases, every 60°)
          const PHASES = [
            { angle: -90, label: '1. think' },
            { angle: -30, label: '2. choose tool' },
            { angle: 30,  label: '3. execute' },
            { angle: 90,  label: '4. observe' },
            { angle: 150, label: '5. done?' },
            { angle: 210, label: '6. loop / end' },
          ];
          return (
            <g>
              {/* dashed loop region */}
              <circle cx={cx} cy={cy} r={R} fill="none"
                      stroke={C.muted2} strokeWidth="0.8"
                      strokeDasharray="3 3" opacity="0.55" />

              {/* curved arrow along the loop — clockwise full sweep */}
              <path d={`M ${cx + R} ${cy}
                        A ${R} ${R} 0 1 1 ${cx - R - 0.001} ${cy}
                        A ${R} ${R} 0 0 1 ${cx + R - 0.001} ${cy - 0.5}`}
                    fill="none" stroke={C.muted2}
                    strokeWidth="1.2" opacity="0.55" />

              {/* arrowheads at three positions on the loop to show direction */}
              {[60, 180, 300].map((deg, i) => {
                const a1 = ((deg - 4) * Math.PI) / 180;
                const a2 = (deg * Math.PI) / 180;
                const x1 = cx + R * Math.cos(a1);
                const y1 = cy + R * Math.sin(a1);
                const x2 = cx + R * Math.cos(a2);
                const y2 = cy + R * Math.sin(a2);
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={C.muted2} strokeWidth="1.2"
                        markerEnd="url(#sm-arrow-muted)" />
                );
              })}

              {/* phase markers — small dots + labels around the loop */}
              {PHASES.map((p, i) => {
                const rad = (p.angle * Math.PI) / 180;
                const dotX = cx + R * Math.cos(rad);
                const dotY = cy + R * Math.sin(rad);
                // label position pushed outward
                const labelR = R + 14;
                const lblX = cx + labelR * Math.cos(rad);
                const lblY = cy + labelR * Math.sin(rad) + 3;
                // anchor depends on side
                let anchor = 'middle';
                if (Math.cos(rad) > 0.3) anchor = 'start';
                else if (Math.cos(rad) < -0.3) anchor = 'end';
                return (
                  <g key={i}>
                    <circle cx={dotX} cy={dotY} r="2.5"
                            fill={C.bg3} stroke={C.muted2} strokeWidth="1" />
                    <text x={lblX} y={lblY}
                          textAnchor={anchor}
                          fontFamily={mono} fontSize="8.5"
                          fill={C.muted2}>
                      {p.label}
                    </text>
                  </g>
                );
              })}

              {/* agent box at center */}
              <rect x={cx - 46} y={cy - 18} width="92" height="36" rx="6"
                    fill={C.bg3} stroke={C.muted2} strokeWidth="1.3" />
              <text x={cx} y={cy - 1} textAnchor="middle"
                    fontFamily={mono} fontSize="10.5" fill={C.text}
                    fontWeight="600">
                Agent
              </text>
              <text x={cx} y={cy + 12} textAnchor="middle"
                    fontFamily={mono} fontSize="8.5" fill={C.muted2}>
                (LLM in a loop)
              </text>
            </g>
          );
        })()}

        {/* Note */}
        <text x={LEFT_X + PANEL_W / 2} y="318"
              textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}
              letterSpacing="0.06em">
          ITERATION IS OPAQUE
        </text>
        <text x={LEFT_X + PANEL_W / 2} y="338"
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          implicit state between turns,
        </text>
        <text x={LEFT_X + PANEL_W / 2} y="354"
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          no graph, no checkpoints —
        </text>
        <text x={LEFT_X + PANEL_W / 2} y="370"
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          all reasoning lives in prose
        </text>

        {/* Issues block */}
        <rect x={LEFT_X} y="412"
              width={PANEL_W} height="138" rx="4"
              fill="transparent"
              stroke={C.red} strokeWidth="0.8"
              strokeDasharray="3 3" opacity="0.7" />
        <text x={LEFT_X + 14} y="430"
              fontFamily={mono} fontSize="9" fill={C.red}
              letterSpacing="0.06em">
          ISSUES
        </text>
        {LEFT_ISSUES.map((s, i) => (
          <g key={i}>
            <text x={LEFT_X + 14} y={448 + i * 18}
                  fontFamily={sans} fontSize="9.5" fill={C.red}
                  fontStyle="italic">
              — {s}
            </text>
          </g>
        ))}

        {/* ─── RIGHT — State machine ─── */}
        <text x={RIGHT_X + PANEL_W / 2} y="74" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.accent}
              fontWeight="600">
          State-machine agent (LangGraph)
        </text>
        <text x={RIGHT_X + PANEL_W / 2} y="90" textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted2}
              fontStyle="italic">
          developer defines graph, LLM routes inside it
        </text>

        {/* Graph nodes */}
        {(() => {
          const cx = RIGHT_X + 110;
          const nodeW = 70;
          const nodeH = 22;
          // y positions
          const yPlan = 110;
          const yResearch = 150;
          const yDraft = 190;
          const yReview = 230;
          const yDone = 270;
          const xHuman = cx + 110;
          const yHuman = yDraft;

          const nodeX = cx - nodeW / 2;

          const node = (y, label, isDone = false) => (
            <g key={label}>
              <rect x={nodeX} y={y - nodeH / 2}
                    width={nodeW} height={nodeH} rx="4"
                    fill={C.bg3}
                    stroke={isDone ? C.accent : C.accent}
                    strokeWidth={isDone ? 1.5 : 1.1} />
              <text x={cx} y={y + 4}
                    textAnchor="middle"
                    fontFamily={mono} fontSize="9.5"
                    fill={C.text}
                    fontWeight={isDone ? '600' : '400'}>
                {label}
              </text>
            </g>
          );

          // Edge with arrow, simple vertical line
          const vEdge = (y1, y2) => (
            <line x1={cx} y1={y1 + 11}
                  x2={cx} y2={y2 - 11}
                  stroke={C.accent} strokeWidth="1.2"
                  markerEnd="url(#sm-arrow-teal)" />
          );

          return (
            <g>
              {node(yPlan, 'Plan')}
              {vEdge(yPlan, yResearch)}
              {node(yResearch, 'Research')}
              {vEdge(yResearch, yDraft)}
              {node(yDraft, 'Draft')}
              {vEdge(yDraft, yReview)}
              {node(yReview, 'Review')}
              {vEdge(yReview, yDone)}
              {node(yDone, 'Done', true)}

              {/* Human Approval branch — off to the right of Draft */}
              <rect x={xHuman - nodeW / 2} y={yHuman - nodeH / 2}
                    width={nodeW} height={nodeH} rx="4"
                    fill={C.accentDim} stroke={C.accent} strokeWidth="1.1"
                    strokeDasharray="3 3" />
              <text x={xHuman} y={yHuman + 4}
                    textAnchor="middle"
                    fontFamily={mono} fontSize="9"
                    fill={C.accent}>
                Human Approval
              </text>
              <line x1={cx + nodeW / 2} y1={yDraft}
                    x2={xHuman - nodeW / 2} y2={yHuman}
                    stroke={C.accent} strokeWidth="1.1"
                    strokeDasharray="3 3"
                    markerEnd="url(#sm-arrow-teal)" />
              <text x={(cx + xHuman) / 2} y={yDraft - 5}
                    textAnchor="middle"
                    fontFamily={mono} fontSize="8" fill={C.accent}>
                checkpoint
              </text>

              {/* Failure edge — Review back to Draft, left side */}
              <path
                d={`M ${cx - nodeW / 2} ${yReview}
                    C ${cx - 75} ${yReview}, ${cx - 75} ${yDraft}, ${cx - nodeW / 2} ${yDraft}`}
                fill="none" stroke={C.red} strokeWidth="1.1"
                markerEnd="url(#sm-arrow-red)" />
              <text x={cx - 75} y={(yReview + yDraft) / 2 + 3}
                    textAnchor="middle"
                    fontFamily={mono} fontSize="8" fill={C.red}>
                revise
              </text>

              {/* edge condition annotation */}
              <text x={cx + nodeW / 2 + 4} y={(yPlan + yResearch) / 2 + 3}
                    fontFamily={mono} fontSize="7.5" fill={C.muted2}>
                cond: ok
              </text>
              <text x={cx + nodeW / 2 + 4} y={(yReview + yDone) / 2 + 3}
                    fontFamily={mono} fontSize="7.5" fill={C.muted2}>
                cond: approved
              </text>
            </g>
          );
        })()}

        {/* Note */}
        <text x={RIGHT_X + PANEL_W / 2} y="318"
              textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.accent}
              letterSpacing="0.06em">
          STRUCTURE IS EXPLICIT
        </text>
        <text x={RIGHT_X + PANEL_W / 2} y="338"
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          state flows through named nodes,
        </text>
        <text x={RIGHT_X + PANEL_W / 2} y="354"
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          LLM only makes routing decisions —
        </text>
        <text x={RIGHT_X + PANEL_W / 2} y="370"
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}>
          every step is inspectable
        </text>

        {/* Benefits block */}
        <rect x={RIGHT_X} y="412"
              width={PANEL_W} height="138" rx="4"
              fill={C.accentDim}
              stroke={C.accent} strokeWidth="1" />
        <text x={RIGHT_X + 14} y="430"
              fontFamily={mono} fontSize="9" fill={C.accent}
              letterSpacing="0.06em">
          BENEFITS
        </text>
        {RIGHT_BENEFITS.map((s, i) => (
          <text key={i}
                x={RIGHT_X + 14} y={448 + i * 18}
                fontFamily={sans} fontSize="9.5" fill={C.accent}
                fontStyle="italic">
            — {s}
          </text>
        ))}

        {/* Bottom annotation */}
        <text x="320" y={totalH - 16}
              textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          state-machine pattern is the production-recommended default by 2026
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
        State-machine-based agents make the structure explicit and the LLM-driven
        decisions auditable; free-form autonomous agents are harder to test, debug,
        and recover from failure.
      </figcaption>
    </figure>
  );
}
