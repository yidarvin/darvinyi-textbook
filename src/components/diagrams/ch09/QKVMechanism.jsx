const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  border:  '#2e2e2e',
  accent:  '#2dd4bf',
  bg2:     '#161616',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Column x-anchors
const Q_X       = 24;
const K_X       = 100;
const SCORE_X   = 168;
const SMAX_X    = 210;
const WEIGHT_X  = 296;
const TIMES_X   = 340;
const V_X       = 360;
const SIGMA_X   = 488;
const OUT_X     = 548;

// Row centers for k1..k4 / v1..v4
const ROWS = [70, 130, 190, 250];

// WEIGHTS is derived from RAW_SCORES via an actual softmax so the two arrays
// can never drift out of sync (previously they were hand-picked separately).
const RAW_SCORES = [0.4, 4.1, 1.8, 0.7];
const SCORES = RAW_SCORES.map((v) => v.toFixed(1));
const _max = Math.max(...RAW_SCORES);
const _exp = RAW_SCORES.map((v) => Math.exp(v - _max));
const _sum = _exp.reduce((a, b) => a + b, 0);
const WEIGHTS_NUM = _exp.map((v) => v / _sum);
const WEIGHTS = WEIGHTS_NUM.map((v) => v.toFixed(2));
// Index of the true softmax argmax, derived from the actual computed weights
// (not hardcoded) so the visual emphasis always tracks the data.
const HI_IDX = WEIGHTS_NUM.indexOf(Math.max(...WEIGHTS_NUM));

const BOX_W = 44;
const BOX_H = 26;

function VecBox({ x, y, label, accent }) {
  return (
    <g>
      <rect
        x={x}
        y={y - BOX_H / 2}
        width={BOX_W}
        height={BOX_H}
        rx="4"
        fill={C.bg2}
        stroke={accent ? C.accent : C.border}
        strokeWidth="1.5"
      />
      <text
        x={x + BOX_W / 2}
        y={y + 4}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={accent ? C.accent : C.text}
      >
        {label}
      </text>
    </g>
  );
}

export default function QKVMechanism() {
  const Q_Y = (ROWS[1] + ROWS[2]) / 2; // between k2 and k3

  return (
    <figure style={{ margin: '24px 0' }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="Query, key, value attention mechanism"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="qkv-arr-muted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
          <marker
            id="qkv-arr-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Column headers */}
        <text x={Q_X + BOX_W / 2} y={28} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>query</text>
        <text x={K_X + BOX_W / 2} y={28} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>keys</text>
        <text x={SCORE_X + 16}    y={28} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>q·k</text>
        <text x={SMAX_X + 38}     y={28} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>softmax</text>
        <text x={WEIGHT_X + 18}   y={28} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>weights</text>
        <text x={V_X + BOX_W / 2} y={28} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>values</text>
        <text x={OUT_X + 22}      y={28} textAnchor="middle" fontFamily={mono} fontSize="10.5" fill={C.muted}>output</text>

        {/* q vector */}
        <VecBox x={Q_X} y={Q_Y} label="q" />

        {/* k1..k4 + dot-product arrows to scores */}
        {ROWS.map((y, i) => (
          <g key={`k-${i}`}>
            <VecBox x={K_X} y={y} label={`k${i + 1}`} />
            {/* arrow q → k_i */}
            <line
              x1={Q_X + BOX_W}
              y1={Q_Y}
              x2={K_X}
              y2={y}
              stroke={C.muted}
              strokeWidth="1"
              opacity="0.5"
            />
            {/* arrow k_i → score */}
            <line
              x1={K_X + BOX_W}
              y1={y}
              x2={SCORE_X - 2}
              y2={y}
              stroke={C.muted}
              strokeWidth="1"
              markerEnd="url(#qkv-arr-muted)"
            />
            <text
              x={SCORE_X + 14}
              y={y + 4}
              textAnchor="middle"
              fontFamily={mono}
              fontSize="11"
              fill={C.text}
            >
              {SCORES[i]}
            </text>
          </g>
        ))}

        {/* Softmax box spans the score rows */}
        <rect
          x={SMAX_X}
          y={ROWS[0] - 14}
          width="76"
          height={ROWS[3] - ROWS[0] + 28}
          rx="6"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={SMAX_X + 38}
          y={(ROWS[0] + ROWS[3]) / 2 + 4}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.text}
        >
          softmax
        </text>

        {/* arrows score → softmax */}
        {ROWS.map((y, i) => (
          <line
            key={`s2sm-${i}`}
            x1={SCORE_X + 30}
            y1={y}
            x2={SMAX_X - 2}
            y2={y}
            stroke={C.muted}
            strokeWidth="1"
            markerEnd="url(#qkv-arr-muted)"
          />
        ))}

        {/* arrows softmax → weights, and × values */}
        {ROWS.map((y, i) => {
          const isHi = i === HI_IDX;
          const color = isHi ? C.accent : C.text;
          return (
            <g key={`w-${i}`}>
              <line
                x1={SMAX_X + 76}
                y1={y}
                x2={WEIGHT_X - 2}
                y2={y}
                stroke={C.muted}
                strokeWidth="1"
                markerEnd="url(#qkv-arr-muted)"
              />
              <text
                x={WEIGHT_X + 18}
                y={y + 4}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="11"
                fill={color}
              >
                {WEIGHTS[i]}
              </text>
              <text
                x={TIMES_X + 8}
                y={y + 4}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="12"
                fill={C.muted}
              >
                ×
              </text>
              <VecBox x={V_X} y={y} label={`v${i + 1}`} accent={isHi} />
            </g>
          );
        })}

        {/* arrows v → Σ */}
        {ROWS.map((y, i) => (
          <line
            key={`v2s-${i}`}
            x1={V_X + BOX_W}
            y1={y}
            x2={SIGMA_X + 12}
            y2={160}
            stroke={i === HI_IDX ? C.accent : C.muted}
            strokeWidth={i === HI_IDX ? '1.5' : '1'}
            opacity={i === HI_IDX ? 1 : 0.5}
          />
        ))}

        {/* Σ operator */}
        <circle
          cx={SIGMA_X + 16}
          cy={160}
          r="18"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={SIGMA_X + 16}
          y={166}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="16"
          fill={C.text}
        >
          Σ
        </text>

        {/* Σ → output */}
        <line
          x1={SIGMA_X + 34}
          y1={160}
          x2={OUT_X - 2}
          y2={160}
          stroke={C.muted}
          strokeWidth="1.5"
          markerEnd="url(#qkv-arr-muted)"
        />
        <VecBox x={OUT_X} y={160} label="out" />
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
        Queries score against keys; the resulting weights blend the values into a
        single output.
      </figcaption>
    </figure>
  );
}
