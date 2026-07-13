const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  accentDim:'rgba(45,212,191,0.16)',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// ─── Panel geometry ─────────────────────────────────────────────────────
const PL = { x: 16,  y: 56, w: 300, h: 480 };  // left panel
const PR = { x: 324, y: 56, w: 300, h: 480 };  // right panel

// ─── Left panel: experience replay ───────────────────────────────────────
const TRANSITION_W = 58;
const TRANSITION_H = 24;
const TRANSITION_GAP = 6;
const TRANSITION_Y = 130;
const N_TRANSITIONS = 4;
const TRANSITION_ROW_W =
  N_TRANSITIONS * TRANSITION_W + (N_TRANSITIONS - 1) * TRANSITION_GAP;
const TRANSITION_X_START = PL.x + (PL.w - TRANSITION_ROW_W) / 2;

// Buffer grid (4 cols x 3 rows)
const BUF_CELL_W = 50;
const BUF_CELL_H = 18;
const BUF_GAP = 5;
const BUF_COLS = 4;
const BUF_ROWS = 3;
const BUF_W = BUF_COLS * BUF_CELL_W + (BUF_COLS - 1) * BUF_GAP;
const BUF_H = BUF_ROWS * BUF_CELL_H + (BUF_ROWS - 1) * BUF_GAP;
const BUF_X = PL.x + (PL.w - BUF_W) / 2;
const BUF_Y = 230;

// Highlight (sampled) cells — non-adjacent in the buffer
const HIGHLIGHTED = new Set(['0-1', '1-3', '2-0', '0-3']);

// Mini-batch row
const MB_CELL_W = 50;
const MB_CELL_H = 22;
const MB_GAP = 6;
const MB_N = 4;
const MB_W = MB_N * MB_CELL_W + (MB_N - 1) * MB_GAP;
const MB_X = PL.x + (PL.w - MB_W) / 2;
const MB_Y = 372;

// ─── Right panel: target network ─────────────────────────────────────────
const ONLINE = { x: PR.x + 60, y: 130, w: 180, h: 56 };
const TDTGT  = { x: PR.x + 30, y: 232, w: 240, h: 50 };
const TARGET = { x: PR.x + 60, y: 330, w: 180, h: 56 };

function PanelFrame({ p, title }) {
  return (
    <g>
      <rect
        x={p.x} y={p.y}
        width={p.w} height={p.h}
        rx="6"
        fill={C.bg2}
        stroke={C.border}
        strokeWidth="1"
      />
      <text
        x={p.x + p.w / 2}
        y={p.y + 28}
        textAnchor="middle"
        fontFamily={mono} fontSize="12"
        fill={C.text}
        fontWeight="500"
      >
        {title}
      </text>
    </g>
  );
}

export default function DQNStabilization() {
  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 568"
        width="100%"
        role="img"
        aria-label="DQN stabilizations: experience replay and target networks"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="dqn-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="dqn-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
          <marker id="dqn-arrow-tiny" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted} />
          </marker>
        </defs>

        {/* Title */}
        <text
          x="320" y="28"
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          TWO INNOVATIONS THAT MADE DEEP Q-LEARNING TRAINABLE
        </text>

        {/* ══════════════════════════════════════════════ */}
        {/* LEFT PANEL: EXPERIENCE REPLAY                  */}
        {/* ══════════════════════════════════════════════ */}
        <PanelFrame p={PL} title="Experience Replay" />

        {/* Top annotation */}
        <text
          x={PL.x + PL.w / 2}
          y={108}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          consecutive transitions are highly correlated
        </text>

        {/* Transition timeline */}
        {Array.from({ length: N_TRANSITIONS }).map((_, i) => {
          const x = TRANSITION_X_START + i * (TRANSITION_W + TRANSITION_GAP);
          return (
            <g key={`t-${i}`}>
              <rect
                x={x} y={TRANSITION_Y}
                width={TRANSITION_W} height={TRANSITION_H}
                rx="3"
                fill={C.bg3}
                stroke={C.borderLt}
                strokeWidth="1.2"
              />
              <text
                x={x + TRANSITION_W / 2}
                y={TRANSITION_Y + TRANSITION_H / 2 + 3.5}
                textAnchor="middle"
                fontFamily={mono} fontSize="9"
                fill={C.muted2}
              >
                {`(s${i+1},a${i+1},r${i+1},s${i+2})`}
              </text>
              {i < N_TRANSITIONS - 1 && (
                <line
                  x1={x + TRANSITION_W + 0.5}
                  y1={TRANSITION_Y + TRANSITION_H / 2}
                  x2={x + TRANSITION_W + TRANSITION_GAP - 0.5}
                  y2={TRANSITION_Y + TRANSITION_H / 2}
                  stroke={C.muted}
                  strokeWidth="1"
                  markerEnd="url(#dqn-arrow-tiny)"
                />
              )}
            </g>
          );
        })}

        {/* Arrow: timeline → buffer */}
        <line
          x1={PL.x + PL.w / 2}
          y1={TRANSITION_Y + TRANSITION_H + 6}
          x2={PL.x + PL.w / 2}
          y2={195}
          stroke={C.muted2}
          strokeWidth="1.4"
          markerEnd="url(#dqn-arrow)"
        />
        <text
          x={PL.x + PL.w / 2 + 8}
          y={185}
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          store
        </text>

        {/* Buffer label */}
        <text
          x={PL.x + PL.w / 2}
          y={219}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.text}
        >
          Replay Buffer
        </text>

        {/* Buffer grid */}
        {Array.from({ length: BUF_ROWS }).map((_, r) =>
          Array.from({ length: BUF_COLS }).map((_, c) => {
            const x = BUF_X + c * (BUF_CELL_W + BUF_GAP);
            const y = BUF_Y + r * (BUF_CELL_H + BUF_GAP);
            const key = `${r}-${c}`;
            const sampled = HIGHLIGHTED.has(key);
            return (
              <rect
                key={`buf-${key}`}
                x={x} y={y}
                width={BUF_CELL_W} height={BUF_CELL_H}
                rx="2"
                fill={sampled ? C.accentDim : C.bg3}
                stroke={sampled ? C.accent : C.borderLt}
                strokeWidth="1.2"
              />
            );
          })
        )}

        {/* Arrow: buffer → mini-batch */}
        <line
          x1={PL.x + PL.w / 2}
          y1={BUF_Y + BUF_H + 6}
          x2={PL.x + PL.w / 2}
          y2={MB_Y - 18}
          stroke={C.accent}
          strokeWidth="1.4"
          strokeDasharray="3,3"
          markerEnd="url(#dqn-arrow-teal)"
        />
        <text
          x={PL.x + PL.w / 2 + 10}
          y={MB_Y - 24}
          fontFamily={mono} fontSize="10"
          fill={C.accent}
        >
          sample
        </text>

        {/* Mini-batch row (all teal, sampled from non-adjacent positions) */}
        <text
          x={PL.x + PL.w / 2}
          y={MB_Y - 4}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.accent}
        >
          random mini-batch
        </text>
        {Array.from({ length: MB_N }).map((_, i) => {
          const x = MB_X + i * (MB_CELL_W + MB_GAP);
          return (
            <rect
              key={`mb-${i}`}
              x={x} y={MB_Y}
              width={MB_CELL_W} height={MB_CELL_H}
              rx="3"
              fill={C.accentDim}
              stroke={C.accent}
              strokeWidth="1.4"
            />
          );
        })}

        {/* Bottom annotation */}
        <text
          x={PL.x + PL.w / 2}
          y={MB_Y + MB_CELL_H + 30}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          random sampling breaks temporal correlation
        </text>
        <text
          x={PL.x + PL.w / 2}
          y={MB_Y + MB_CELL_H + 48}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.muted}
        >
          gradient steps approximately i.i.d. again
        </text>

        {/* ══════════════════════════════════════════════ */}
        {/* RIGHT PANEL: TARGET NETWORK                    */}
        {/* ══════════════════════════════════════════════ */}
        <PanelFrame p={PR} title="Target Network" />

        {/* Top annotation */}
        <text
          x={PR.x + PR.w / 2}
          y={108}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          two copies of the Q-network, only one is trained
        </text>

        {/* Online Q network (teal) */}
        <rect
          x={ONLINE.x} y={ONLINE.y}
          width={ONLINE.w} height={ONLINE.h}
          rx="4"
          fill={C.accentDim}
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <text
          x={ONLINE.x + ONLINE.w / 2}
          y={ONLINE.y + 22}
          textAnchor="middle"
          fontFamily={mono} fontSize="13"
          fill={C.accent}
          fontWeight="500"
        >
          Q_θ
        </text>
        <text
          x={ONLINE.x + ONLINE.w / 2}
          y={ONLINE.y + 42}
          textAnchor="middle"
          fontFamily={mono} fontSize="10"
          fill={C.muted2}
        >
          online network · trained
        </text>

        {/* TD target box */}
        <rect
          x={TDTGT.x} y={TDTGT.y}
          width={TDTGT.w} height={TDTGT.h}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text
          x={TDTGT.x + TDTGT.w / 2}
          y={TDTGT.y + 20}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.muted}
        >
          TD target
        </text>
        <text
          x={TDTGT.x + TDTGT.w / 2}
          y={TDTGT.y + 38}
          textAnchor="middle"
          fontFamily={mono} fontSize="11"
          fill={C.text}
        >
          {"r + γ · max Q_{θ⁻}(s', a')"}
        </text>

        {/* Target Q network (muted grey) */}
        <rect
          x={TARGET.x} y={TARGET.y}
          width={TARGET.w} height={TARGET.h}
          rx="4"
          fill={C.bg3}
          stroke={C.borderLt}
          strokeWidth="1.5"
        />
        <text
          x={TARGET.x + TARGET.w / 2}
          y={TARGET.y + 22}
          textAnchor="middle"
          fontFamily={mono} fontSize="13"
          fill={C.muted2}
          fontWeight="500"
        >
          {"Q_{θ⁻}"}
        </text>
        <text
          x={TARGET.x + TARGET.w / 2}
          y={TARGET.y + 42}
          textAnchor="middle"
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          target network · frozen
        </text>

        {/* Arrow: target → TD-target (provides the target value) */}
        <line
          x1={TARGET.x + TARGET.w / 2}
          y1={TARGET.y - 4}
          x2={TDTGT.x + TDTGT.w / 2}
          y2={TDTGT.y + TDTGT.h + 6}
          stroke={C.muted2}
          strokeWidth="1.4"
          markerEnd="url(#dqn-arrow)"
        />
        <text
          x={TARGET.x + TARGET.w / 2 + 8}
          y={TDTGT.y + TDTGT.h + 22}
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          supplies target
        </text>

        {/* Arrow: TD-target → online (gradient update) */}
        <line
          x1={TDTGT.x + TDTGT.w / 2}
          y1={TDTGT.y - 4}
          x2={ONLINE.x + ONLINE.w / 2}
          y2={ONLINE.y + ONLINE.h + 6}
          stroke={C.accent}
          strokeWidth="1.4"
          strokeDasharray="3,3"
          markerEnd="url(#dqn-arrow-teal)"
        />
        <text
          x={TDTGT.x + TDTGT.w / 2 + 8}
          y={ONLINE.y + ONLINE.h + 22}
          fontFamily={mono} fontSize="10"
          fill={C.accent}
        >
          gradient update
        </text>

        {/* Periodic copy arrow: online → target (curved, on the right) */}
        <path
          d={`M ${ONLINE.x + ONLINE.w + 4} ${ONLINE.y + ONLINE.h / 2}
              C ${PR.x + PR.w - 18} ${ONLINE.y + ONLINE.h / 2 + 40},
                ${PR.x + PR.w - 18} ${TARGET.y + TARGET.h / 2 - 40},
                ${TARGET.x + TARGET.w + 4} ${TARGET.y + TARGET.h / 2}`}
          fill="none"
          stroke={C.muted}
          strokeWidth="1.3"
          strokeDasharray="3,3"
          markerEnd="url(#dqn-arrow)"
        />
        <text
          x={PR.x + PR.w - 14}
          y={ONLINE.y + ONLINE.h + 70}
          textAnchor="end"
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          θ⁻ ← θ
        </text>
        <text
          x={PR.x + PR.w - 14}
          y={ONLINE.y + ONLINE.h + 84}
          textAnchor="end"
          fontFamily={mono} fontSize="10"
          fill={C.muted}
        >
          every N steps
        </text>

        {/* Bottom annotation */}
        <text
          x={PR.x + PR.w / 2}
          y={TARGET.y + TARGET.h + 38}
          textAnchor="middle"
          fontFamily={sans} fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          target stays still while Q_θ moves
        </text>
        <text
          x={PR.x + PR.w / 2}
          y={TARGET.y + TARGET.h + 56}
          textAnchor="middle"
          fontFamily={mono} fontSize="10.5"
          fill={C.muted}
        >
          no chasing your own tail
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
        DQN's two stabilization tricks: experience replay decorrelates training
        samples, target networks keep the TD target from moving with the policy.
      </figcaption>
    </figure>
  );
}
