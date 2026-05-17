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
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Six block geometry
const BLOCK_W = 96;
const GAP = 8;
const FIRST_X = 14;
const ROW_TITLE_Y = 70;
const SKETCH_Y = 82;
const SKETCH_H = 68;
const LABEL_Y = SKETCH_Y + SKETCH_H + 12;

const PATTERNS = [
  { idx: 0, name: 'Augmented LLM',        desc: 'single enhanced LLM call' },
  { idx: 1, name: 'Prompt Chaining',      desc: 'sequential LLM calls — each step depends on previous' },
  { idx: 2, name: 'Routing',              desc: 'classifier dispatches to specialized handler' },
  { idx: 3, name: 'Parallelization',      desc: 'independent LLM calls run concurrently, results merged' },
  { idx: 4, name: 'Orchestrator-Workers', desc: 'orchestrator decomposes, workers execute, orchestrator synthesizes' },
  { idx: 5, name: 'Autonomous Agent',     desc: 'model decides its own next step in a loop' },
];

const blockX = (i) => FIRST_X + i * (BLOCK_W + GAP);
const cx = (i) => blockX(i) + BLOCK_W / 2;

// Sketch helpers
function SmallBox({ x, y, w, h, label, fill, stroke, textFill, fontSize = 7 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2"
            fill={fill || C.bg2} stroke={stroke || C.borderLt} strokeWidth="0.8" />
      {label && (
        <text x={x + w / 2} y={y + h / 2 + 2.5}
              textAnchor="middle" fontFamily={mono}
              fontSize={fontSize} fill={textFill || C.text}>
          {label}
        </text>
      )}
    </g>
  );
}

export default function WorkflowsToAgentsSpectrum() {
  const totalH = 350;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg viewBox={`0 0 640 ${totalH}`} width="100%" role="img"
           aria-label="The Anthropic pattern spectrum from simple workflows to fully autonomous agents."
           style={{ display: 'block' }}>
        <defs>
          <marker id="wfa-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="wfa-arrow-sm" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="wfa-arrow-tealsm" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          The Anthropic patterns (Building Effective Agents, 2024)
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          six concrete patterns from workflow to fully autonomous agent
        </text>

        {/* Six pattern blocks */}
        {PATTERNS.map((p) => {
          const isAuto = p.idx === 5;
          return (
            <g key={p.idx}>
              {/* outer container */}
              <rect x={blockX(p.idx)} y={SKETCH_Y - 14}
                    width={BLOCK_W} height={SKETCH_H + 14}
                    rx="4"
                    fill={isAuto ? C.accentDim : C.bg3}
                    stroke={isAuto ? C.accent : C.borderLt}
                    strokeWidth={isAuto ? 1.2 : 1} />
              {/* block name */}
              <text x={cx(p.idx)} y={ROW_TITLE_Y - 6}
                    textAnchor="middle"
                    fontFamily={mono} fontSize="9.5"
                    fill={isAuto ? C.accent : C.text}
                    fontWeight="600">
                {p.name}
              </text>
            </g>
          );
        })}

        {/* Sketch 0: Augmented LLM — single box with arrows to tools/memory/retrieval */}
        {(() => {
          const i = 0;
          const x0 = blockX(i);
          const y0 = SKETCH_Y;
          // central LLM at center
          const llmX = x0 + BLOCK_W / 2 - 14;
          const llmY = y0 + 26;
          return (
            <g key={`sketch-${i}`}>
              <SmallBox x={llmX} y={llmY} w={28} h={14} label="LLM"
                        stroke={C.muted2} textFill={C.text} fontSize={7.5} />
              {/* tools above */}
              <text x={x0 + BLOCK_W / 2} y={y0 + 12}
                    textAnchor="middle" fontFamily={mono}
                    fontSize="7" fill={C.muted2}>tools</text>
              <line x1={x0 + BLOCK_W / 2} y1={y0 + 14}
                    x2={x0 + BLOCK_W / 2} y2={llmY}
                    stroke={C.muted2} strokeWidth="0.8"
                    markerEnd="url(#wfa-arrow-sm)" />
              {/* memory left */}
              <text x={x0 + 12} y={llmY + 10}
                    textAnchor="middle" fontFamily={mono}
                    fontSize="7" fill={C.muted2}>mem</text>
              <line x1={x0 + 22} y1={llmY + 7}
                    x2={llmX - 1} y2={llmY + 7}
                    stroke={C.muted2} strokeWidth="0.8"
                    markerEnd="url(#wfa-arrow-sm)" />
              {/* retrieval right */}
              <text x={x0 + BLOCK_W - 14} y={llmY + 10}
                    textAnchor="middle" fontFamily={mono}
                    fontSize="7" fill={C.muted2}>RAG</text>
              <line x1={x0 + BLOCK_W - 24} y1={llmY + 7}
                    x2={llmX + 29} y2={llmY + 7}
                    stroke={C.muted2} strokeWidth="0.8"
                    markerStart="url(#wfa-arrow-sm)" />
            </g>
          );
        })()}

        {/* Sketch 1: Prompt Chaining — three boxes connected */}
        {(() => {
          const i = 1;
          const x0 = blockX(i);
          const y0 = SKETCH_Y + 22;
          const w = 22, h = 12, gap = 6;
          const startX = x0 + (BLOCK_W - (3 * w + 2 * gap)) / 2;
          return (
            <g key={`sketch-${i}`}>
              <SmallBox x={startX} y={y0} w={w} h={h} label="L₁" fontSize={7.5} />
              <SmallBox x={startX + w + gap} y={y0} w={w} h={h} label="L₂" fontSize={7.5} />
              <SmallBox x={startX + 2 * (w + gap)} y={y0} w={w} h={h} label="L₃" fontSize={7.5} />
              <line x1={startX + w} y1={y0 + h / 2}
                    x2={startX + w + gap - 1} y2={y0 + h / 2}
                    stroke={C.muted2} strokeWidth="0.8"
                    markerEnd="url(#wfa-arrow-sm)" />
              <line x1={startX + 2 * w + gap} y1={y0 + h / 2}
                    x2={startX + 2 * (w + gap) - 1} y2={y0 + h / 2}
                    stroke={C.muted2} strokeWidth="0.8"
                    markerEnd="url(#wfa-arrow-sm)" />
            </g>
          );
        })()}

        {/* Sketch 2: Routing — input → diamond → 3 branches */}
        {(() => {
          const i = 2;
          const x0 = blockX(i);
          const y0 = SKETCH_Y;
          const cxr = x0 + BLOCK_W / 2;
          // input
          return (
            <g key={`sketch-${i}`}>
              <SmallBox x={x0 + 8} y={y0 + 26} w={16} h={11} label="in" fontSize={7} />
              {/* diamond router */}
              <polygon
                points={`${cxr - 2},${y0 + 24} ${cxr + 8},${y0 + 32} ${cxr - 2},${y0 + 40} ${cxr - 12},${y0 + 32}`}
                fill={C.bg2} stroke={C.muted2} strokeWidth="0.8" />
              <text x={cxr - 2} y={y0 + 34}
                    textAnchor="middle" fontFamily={mono}
                    fontSize="6.5" fill={C.muted2}>?</text>
              <line x1={x0 + 24} y1={y0 + 32}
                    x2={cxr - 12} y2={y0 + 32}
                    stroke={C.muted2} strokeWidth="0.8"
                    markerEnd="url(#wfa-arrow-sm)" />
              {/* three branch boxes */}
              <SmallBox x={cxr + 12} y={y0 + 12} w={20} h={10} label="h₁" fontSize={7} />
              <SmallBox x={cxr + 12} y={y0 + 27} w={20} h={10} label="h₂" fontSize={7} />
              <SmallBox x={cxr + 12} y={y0 + 42} w={20} h={10} label="h₃" fontSize={7} />
              <line x1={cxr + 8} y1={y0 + 32}
                    x2={cxr + 12} y2={y0 + 17}
                    stroke={C.muted2} strokeWidth="0.7" />
              <line x1={cxr + 8} y1={y0 + 32}
                    x2={cxr + 12} y2={y0 + 32}
                    stroke={C.muted2} strokeWidth="0.7" />
              <line x1={cxr + 8} y1={y0 + 32}
                    x2={cxr + 12} y2={y0 + 47}
                    stroke={C.muted2} strokeWidth="0.7" />
            </g>
          );
        })()}

        {/* Sketch 3: Parallelization — input → 3 parallel → aggregator → output */}
        {(() => {
          const i = 3;
          const x0 = blockX(i);
          const y0 = SKETCH_Y;
          return (
            <g key={`sketch-${i}`}>
              {/* input */}
              <SmallBox x={x0 + 4} y={y0 + 28} w={12} h={10} label="in" fontSize={6.5} />
              {/* three parallel */}
              <SmallBox x={x0 + 26} y={y0 + 12} w={20} h={10} label="L" fontSize={7} />
              <SmallBox x={x0 + 26} y={y0 + 28} w={20} h={10} label="L" fontSize={7} />
              <SmallBox x={x0 + 26} y={y0 + 44} w={20} h={10} label="L" fontSize={7} />
              {/* aggregator */}
              <SmallBox x={x0 + 56} y={y0 + 28} w={18} h={10} label="agg" fontSize={6.5} />
              {/* output */}
              <SmallBox x={x0 + 80} y={y0 + 28} w={12} h={10} label="out" fontSize={6.5} />
              {/* lines in→parallel */}
              <line x1={x0 + 16} y1={y0 + 33} x2={x0 + 26} y2={y0 + 17}
                    stroke={C.muted2} strokeWidth="0.7" />
              <line x1={x0 + 16} y1={y0 + 33} x2={x0 + 26} y2={y0 + 33}
                    stroke={C.muted2} strokeWidth="0.7" />
              <line x1={x0 + 16} y1={y0 + 33} x2={x0 + 26} y2={y0 + 49}
                    stroke={C.muted2} strokeWidth="0.7" />
              {/* lines parallel→agg */}
              <line x1={x0 + 46} y1={y0 + 17} x2={x0 + 56} y2={y0 + 33}
                    stroke={C.muted2} strokeWidth="0.7" />
              <line x1={x0 + 46} y1={y0 + 33} x2={x0 + 56} y2={y0 + 33}
                    stroke={C.muted2} strokeWidth="0.7" />
              <line x1={x0 + 46} y1={y0 + 49} x2={x0 + 56} y2={y0 + 33}
                    stroke={C.muted2} strokeWidth="0.7" />
              {/* agg→out */}
              <line x1={x0 + 74} y1={y0 + 33} x2={x0 + 80} y2={y0 + 33}
                    stroke={C.muted2} strokeWidth="0.7"
                    markerEnd="url(#wfa-arrow-sm)" />
            </g>
          );
        })()}

        {/* Sketch 4: Orchestrator-Workers — top box with arrows to 3 workers, back arrows */}
        {(() => {
          const i = 4;
          const x0 = blockX(i);
          const y0 = SKETCH_Y;
          const cx4 = x0 + BLOCK_W / 2;
          return (
            <g key={`sketch-${i}`}>
              {/* orchestrator */}
              <SmallBox x={cx4 - 16} y={y0 + 6} w={32} h={12} label="orch" fontSize={7.5} />
              {/* three workers */}
              <SmallBox x={cx4 - 38} y={y0 + 44} w={20} h={11} label="w" fontSize={7} />
              <SmallBox x={cx4 - 10} y={y0 + 44} w={20} h={11} label="w" fontSize={7} />
              <SmallBox x={cx4 + 18} y={y0 + 44} w={20} h={11} label="w" fontSize={7} />
              {/* down arrows */}
              <line x1={cx4 - 10} y1={y0 + 18}
                    x2={cx4 - 28} y2={y0 + 43}
                    stroke={C.muted2} strokeWidth="0.7"
                    markerEnd="url(#wfa-arrow-sm)" />
              <line x1={cx4} y1={y0 + 18}
                    x2={cx4} y2={y0 + 43}
                    stroke={C.muted2} strokeWidth="0.7"
                    markerEnd="url(#wfa-arrow-sm)" />
              <line x1={cx4 + 10} y1={y0 + 18}
                    x2={cx4 + 28} y2={y0 + 43}
                    stroke={C.muted2} strokeWidth="0.7"
                    markerEnd="url(#wfa-arrow-sm)" />
            </g>
          );
        })()}

        {/* Sketch 5: Autonomous Agent — loop */}
        {(() => {
          const i = 5;
          const x0 = blockX(i);
          const y0 = SKETCH_Y;
          const cx5 = x0 + BLOCK_W / 2;
          // four points around the loop
          return (
            <g key={`sketch-${i}`}>
              <SmallBox x={cx5 - 14} y={y0 + 6} w={28} h={12} label="LLM"
                        stroke={C.accent} textFill={C.accent} fontSize={7.5} />
              <SmallBox x={cx5 + 16} y={y0 + 28} w={22} h={11} label="tool"
                        stroke={C.accent} textFill={C.accent} fontSize={7} />
              <SmallBox x={cx5 - 14} y={y0 + 48} w={28} h={11} label="env"
                        stroke={C.accent} textFill={C.accent} fontSize={7} />
              <SmallBox x={cx5 - 38} y={y0 + 28} w={22} h={11} label="obs"
                        stroke={C.accent} textFill={C.accent} fontSize={7} />
              {/* loop arrows clockwise */}
              <line x1={cx5 + 12} y1={y0 + 16} x2={cx5 + 16} y2={y0 + 30}
                    stroke={C.accent} strokeWidth="0.9"
                    markerEnd="url(#wfa-arrow-tealsm)" />
              <line x1={cx5 + 22} y1={y0 + 39} x2={cx5 + 8} y2={y0 + 48}
                    stroke={C.accent} strokeWidth="0.9"
                    markerEnd="url(#wfa-arrow-tealsm)" />
              <line x1={cx5 - 6} y1={y0 + 48} x2={cx5 - 20} y2={y0 + 39}
                    stroke={C.accent} strokeWidth="0.9"
                    markerEnd="url(#wfa-arrow-tealsm)" />
              <line x1={cx5 - 22} y1={y0 + 28} x2={cx5 - 10} y2={y0 + 18}
                    stroke={C.accent} strokeWidth="0.9"
                    markerEnd="url(#wfa-arrow-tealsm)" />
            </g>
          );
        })()}

        {/* Description labels under each block */}
        {PATTERNS.map((p) => {
          // Wrap text manually for narrow columns
          const words = p.desc.split(' ');
          const lines = [];
          let cur = '';
          // ~14 chars per line at fontSize 8
          for (const w of words) {
            if ((cur + ' ' + w).trim().length > 16) {
              lines.push(cur);
              cur = w;
            } else {
              cur = (cur + ' ' + w).trim();
            }
          }
          if (cur) lines.push(cur);
          return (
            <g key={`label-${p.idx}`}>
              {lines.slice(0, 4).map((ln, j) => (
                <text key={j}
                      x={cx(p.idx)}
                      y={LABEL_Y + 18 + j * 9}
                      textAnchor="middle"
                      fontFamily={sans}
                      fontSize="7.5"
                      fill={p.idx === 5 ? C.accent : C.muted2}>
                  {ln}
                </text>
              ))}
            </g>
          );
        })}

        {/* Spectrum arrow at bottom */}
        <line x1="20" y1="282" x2="620" y2="282"
              stroke={C.muted2} strokeWidth="1"
              markerEnd="url(#wfa-arrow)" />
        <text x="20" y="296" textAnchor="start"
              fontFamily={mono} fontSize="9.5" fill={C.muted2}>
          workflow — predefined paths, LLM routes
        </text>
        <text x="620" y="296" textAnchor="end"
              fontFamily={mono} fontSize="9.5" fill={C.accent}>
          agent — LLM-driven control flow
        </text>

        {/* Unified annotation */}
        <text x="320" y="324" textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          Anthropic 2024: workflows (left) suffice for most production use cases —
        </text>
        <text x="320" y="338" textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted2}
              fontStyle="italic">
          autonomous agents only when the task requires open-ended exploration
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
        The Anthropic patterns span a workflow-to-agent spectrum; production systems mostly
        live on the workflow side, with autonomous agents reserved for tasks that genuinely
        require model-driven control flow.
      </figcaption>
    </figure>
  );
}
