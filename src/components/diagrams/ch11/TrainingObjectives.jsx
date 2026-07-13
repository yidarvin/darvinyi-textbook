const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

const PANEL_W = 200;
const PANEL_H = 240;
const PANEL_Y = 48;
const PANEL_XS = [12, 220, 428];
const PANEL_TITLES = [
  'GPT · next-token prediction',
  'BERT · masked language modeling',
  'T5 · span corruption',
];

const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat'];

const BOX_W = 28;
const BOX_H = 22;
const BOX_GAP = 2;

function tokenRow(px, py, labels, mask = [], accentIdxs = []) {
  const total = labels.length * BOX_W + (labels.length - 1) * BOX_GAP;
  const sx = px + (PANEL_W - total) / 2;
  return labels.map((lbl, i) => {
    const x = sx + i * (BOX_W + BOX_GAP);
    const isMask = mask.includes(i);
    const isAccent = accentIdxs.includes(i);
    return (
      <g key={`tk-${px}-${i}`}>
        <rect
          x={x}
          y={py - BOX_H / 2}
          width={BOX_W}
          height={BOX_H}
          rx="4"
          fill={C.bg2}
          stroke={isMask || isAccent ? C.accent : C.border}
          strokeWidth="1.5"
        />
        <text
          x={x + BOX_W / 2}
          y={py + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={isMask || isAccent ? C.accent : C.text}
        >
          {lbl}
        </text>
      </g>
    );
  });
}

export default function TrainingObjectives() {
  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="Training objectives across three transformer paradigms"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="obj-arr"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted2} />
          </marker>
        </defs>

        <text
          x={320}
          y={22}
          textAnchor="middle"
          fontFamily={sans}
          fontSize="12"
          fill={C.muted2}
        >
          Different objectives, same architecture family
        </text>

        {PANEL_XS.map((px, pi) => (
          <g key={`panel-${pi}`}>
            <rect
              x={px}
              y={PANEL_Y}
              width={PANEL_W}
              height={PANEL_H}
              rx="4"
              fill="none"
              stroke={C.border}
              strokeWidth="1"
            />
            <text
              x={px + PANEL_W / 2}
              y={PANEL_Y + 18}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="11"
              fill={C.text}
            >
              {PANEL_TITLES[pi]}
            </text>
          </g>
        ))}

        {/* Panel 1 — GPT */}
        {(() => {
          const px = PANEL_XS[0];
          const rowY = PANEL_Y + 60;
          const total = TOKENS.length * BOX_W + (TOKENS.length - 1) * BOX_GAP;
          const sx = px + (PANEL_W - total) / 2;
          return (
            <g key="gpt">
              {tokenRow(px, rowY, TOKENS)}
              {/* predict arrows under each adjacent pair */}
              {TOKENS.slice(0, -1).map((_, i) => {
                const x1 = sx + i * (BOX_W + BOX_GAP) + BOX_W / 2;
                const x2 = sx + (i + 1) * (BOX_W + BOX_GAP) + BOX_W / 2;
                const y0 = rowY + BOX_H / 2 + 12;
                return (
                  <g key={`pred-${i}`}>
                    <path
                      d={`M ${x1} ${y0} C ${x1} ${y0 + 14}, ${x2} ${y0 + 14}, ${x2 - 2} ${y0 + 2}`}
                      fill="none"
                      stroke={C.muted2}
                      strokeWidth="1"
                      markerEnd="url(#obj-arr)"
                    />
                  </g>
                );
              })}
              <text
                x={px + PANEL_W / 2}
                y={rowY + 64}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="10"
                fill={C.muted2}
              >
                predict
              </text>
              <text
                x={px + PANEL_W / 2}
                y={PANEL_Y + PANEL_H - 36}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                every position is a
              </text>
              <text
                x={px + PANEL_W / 2}
                y={PANEL_Y + PANEL_H - 22}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                training example
              </text>
            </g>
          );
        })()}

        {/* Panel 2 — BERT */}
        {(() => {
          const px = PANEL_XS[1];
          const rowY = PANEL_Y + 60;
          const labels = ['The', 'cat', '[MASK]', '[MASK]', 'the', 'mat'];
          const mask = [2, 3];
          const total = labels.length * BOX_W + (labels.length - 1) * BOX_GAP;
          const sx = px + (PANEL_W - total) / 2;
          const targets = ['sat', 'on'];
          return (
            <g key="bert">
              {tokenRow(px, rowY, labels, mask)}
              {/* arrows from mask positions to target boxes */}
              {mask.map((idx, j) => {
                const x = sx + idx * (BOX_W + BOX_GAP) + BOX_W / 2;
                const tgtY = rowY + 56;
                return (
                  <g key={`bert-tgt-${j}`}>
                    <line
                      x1={x}
                      y1={rowY + BOX_H / 2 + 2}
                      x2={x}
                      y2={tgtY - BOX_H / 2 - 2}
                      stroke={C.muted2}
                      strokeWidth="1"
                      markerEnd="url(#obj-arr)"
                    />
                    <rect
                      x={x - BOX_W / 2}
                      y={tgtY - BOX_H / 2}
                      width={BOX_W}
                      height={BOX_H}
                      rx="4"
                      fill={C.bg2}
                      stroke={C.muted2}
                      strokeWidth="1.5"
                    />
                    <text
                      x={x}
                      y={tgtY + 4}
                      textAnchor="middle"
                      fontFamily={mono}
                      fontSize="10"
                      fill={C.text}
                    >
                      {targets[j]}
                    </text>
                  </g>
                );
              })}
              <text
                x={px + PANEL_W / 2}
                y={PANEL_Y + PANEL_H - 36}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                ~15% masked, reconstruct
              </text>
              <text
                x={px + PANEL_W / 2}
                y={PANEL_Y + PANEL_H - 22}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                from bidirectional context
              </text>
            </g>
          );
        })()}

        {/* Panel 3 — T5 */}
        {(() => {
          const px = PANEL_XS[2];
          const src = ['The', 'cat', '<X>', 'the', '<Y>'];
          const srcAccent = [2, 4];
          const tgt = ['<X>', 'sat', 'on', '<Y>', 'mat'];
          const tgtAccent = [0, 3];
          const srcY = PANEL_Y + 56;
          const tgtY = PANEL_Y + 112;
          return (
            <g key="t5">
              <text
                x={px + 14}
                y={srcY - 18}
                fontFamily={mono}
                fontSize="9.5"
                fill={C.muted}
              >
                source
              </text>
              {tokenRow(px, srcY, src, [], srcAccent)}
              <text
                x={px + 14}
                y={tgtY - 18}
                fontFamily={mono}
                fontSize="9.5"
                fill={C.muted}
              >
                target
              </text>
              {tokenRow(px, tgtY, tgt, [], tgtAccent)}
              <text
                x={px + PANEL_W / 2}
                y={PANEL_Y + PANEL_H - 50}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                mask contiguous spans,
              </text>
              <text
                x={px + PANEL_W / 2}
                y={PANEL_Y + PANEL_H - 36}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                generate them
              </text>
              <text
                x={px + PANEL_W / 2}
                y={PANEL_Y + PANEL_H - 22}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10.5"
                fill={C.muted}
              >
                autoregressively
              </text>
            </g>
          );
        })()}
      </svg>

      <figcaption
        style={{
          fontFamily: sans,
          fontSize: '12px',
          color: C.muted,
          textAlign: 'center',
          marginTop: '8px',
          lineHeight: 1.5,
        }}
      >
        The three paradigms differ less in architecture than in what they ask the
        network to predict during training.
      </figcaption>
    </figure>
  );
}
