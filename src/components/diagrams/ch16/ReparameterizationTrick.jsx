const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.14)',
  warn:     '#f87171',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

function NodeBox({ x, y, w, h, label, stroke = C.borderLt }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4"
            fill={C.bg2} stroke={stroke} strokeWidth="1.3" />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle"
            fontFamily={mono} fontSize="10.5" fill={C.text}>
        {label}
      </text>
    </g>
  );
}

// Stochastic node: circle with wavy line / tilde
function StochasticNode({ cx, cy, r, stroke }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
              fill={C.bg2} stroke={stroke} strokeWidth="1.5" />
      {/* wavy line inside */}
      <path d={`M ${cx - 9} ${cy} Q ${cx - 4.5} ${cy - 5} ${cx} ${cy}
                T ${cx + 9} ${cy}`}
            stroke={stroke} strokeWidth="1.3" fill="none" />
    </g>
  );
}

export default function ReparameterizationTrick() {
  // Vertical positions for the graph in each panel
  const yInput  = 90;
  const yEnc    = 130;
  const yZ      = 188;
  const yDec    = 246;
  const yOut    = 296;

  // Left panel horizontal center
  const LX = 160;
  // Right panel center
  const RX = 480;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 360"
        width="100%"
        role="img"
        aria-label="Reparameterization trick — gradient blocked by stochastic node vs. flowing through deterministic mix"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="rt-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="rt-arrow-warn" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.warn} />
          </marker>
          <marker id="rt-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* ── Top title ───────────────────────────────── */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={sans} fontSize="12" fill={C.text}
              fontStyle="italic">
          Moving the randomness outside the gradient path
        </text>

        {/* ── Panel borders ───────────────────────────── */}
        <rect x="20" y="38" width="300" height="305" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />
        <rect x="320" y="38" width="300" height="305" rx="4"
              fill="none" stroke={C.border} strokeWidth="1" />

        {/* ── Panel titles ────────────────────────────── */}
        <text x={LX} y="56" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.warn}>
          Without — gradient blocked
        </text>
        <text x={RX} y="56" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.accent}>
          With reparameterization — gradient flows
        </text>

        {/* ─────────────── LEFT PANEL ─────────────── */}
        {/* x input */}
        <NodeBox x={LX - 18} y={yInput - 12} w={36} h={22} label="x" />

        {/* down arrow to encoder */}
        <line x1={LX} y1={yInput + 10} x2={LX} y2={yEnc - 12}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#rt-arrow)" />

        {/* encoder box producing (μ, σ) */}
        <NodeBox x={LX - 44} y={yEnc - 12} w={88} h={26} label="encoder" />
        <text x={LX} y={yEnc + 32} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          (μ, σ)
        </text>

        {/* arrow to stochastic node */}
        <line x1={LX} y1={yEnc + 38} x2={LX} y2={yZ - 14}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#rt-arrow)" />

        {/* stochastic node — red */}
        <StochasticNode cx={LX} cy={yZ} r="14" stroke={C.warn} />
        <text x={LX + 22} y={yZ + 4} textAnchor="start"
              fontFamily={mono} fontSize="10" fill={C.warn}>
          z ~ N(μ, σ²)
        </text>

        {/* arrow to decoder */}
        <line x1={LX} y1={yZ + 14} x2={LX} y2={yDec - 12}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#rt-arrow)" />

        {/* decoder */}
        <NodeBox x={LX - 44} y={yDec - 12} w={88} h={26} label="decoder" />

        {/* arrow to output */}
        <line x1={LX} y1={yDec + 14} x2={LX} y2={yOut - 12}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#rt-arrow)" />

        {/* x̂ output */}
        <NodeBox x={LX - 18} y={yOut - 12} w={36} h={22} label="x̂" />

        {/* Backward gradient path (dashed grey) on the LEFT side — blocked at z */}
        <path
          d={`M ${LX - 44} ${yDec - 4}
              L ${LX - 60} ${yDec - 4}
              L ${LX - 60} ${yZ + 4}`}
          stroke={C.warn} strokeWidth="1.2" fill="none"
          strokeDasharray="3 3" markerEnd="url(#rt-arrow-warn)" />

        {/* "blocked" ✗ mark at the stochastic node */}
        <g transform={`translate(${LX - 32} ${yZ})`}>
          <line x1="-5" y1="-5" x2="5" y2="5"
                stroke={C.warn} strokeWidth="2" strokeLinecap="round" />
          <line x1="-5" y1="5" x2="5" y2="-5"
                stroke={C.warn} strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* annotation */}
        <text x={LX} y={yOut + 32} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          gradient cannot flow through
        </text>
        <text x={LX} y={yOut + 45} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          a stochastic node
        </text>

        {/* ─────────────── RIGHT PANEL ─────────────── */}
        {/* x input */}
        <NodeBox x={RX - 18} y={yInput - 12} w={36} h={22} label="x" />

        {/* down arrow to encoder */}
        <line x1={RX} y1={yInput + 10} x2={RX} y2={yEnc - 12}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#rt-arrow)" />

        {/* encoder */}
        <NodeBox x={RX - 44} y={yEnc - 12} w={88} h={26} label="encoder" />
        <text x={RX} y={yEnc + 32} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          (μ, σ)
        </text>

        {/* External noise ε — detached, off to the right */}
        <rect x={RX + 80} y={yZ - 14} width="86" height="28" rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1.3"
              strokeDasharray="3 3" />
        <text x={RX + 123} y={yZ + 4} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.muted2}>
          ε ~ N(0, I)
        </text>
        <text x={RX + 123} y={yZ - 22} textAnchor="middle"
              fontFamily={sans} fontSize="9" fill={C.muted}
              fontStyle="italic">
          external noise
        </text>

        {/* arrows from (μ,σ) and ε into the mix box */}
        <line x1={RX} y1={yEnc + 38} x2={RX} y2={yZ - 14}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#rt-arrow)" />
        <line x1={RX + 80} y1={yZ} x2={RX + 22} y2={yZ}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#rt-arrow)" />

        {/* deterministic mix box */}
        <rect x={RX - 50} y={yZ - 14} width="72" height="28" rx="4"
              fill={C.bg2} stroke={C.accent} strokeWidth="1.5" />
        <text x={RX - 14} y={yZ + 4} textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          μ + σ ⊙ ε
        </text>
        <text x={RX - 14} y={yZ + 28} textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.accent}>
          z
        </text>

        {/* arrow to decoder */}
        <line x1={RX - 14} y1={yZ + 32} x2={RX - 14} y2={yDec - 12}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#rt-arrow)" />

        {/* decoder */}
        <NodeBox x={RX - 44 - 14} y={yDec - 12} w={88} h={26} label="decoder" />

        {/* arrow to output */}
        <line x1={RX - 14} y1={yDec + 14} x2={RX - 14} y2={yOut - 12}
              stroke={C.muted2} strokeWidth="1" markerEnd="url(#rt-arrow)" />

        {/* x̂ output */}
        <NodeBox x={RX - 14 - 18} y={yOut - 12} w={36} h={22} label="x̂" />

        {/* Backward gradient (teal) — flows all the way back to encoder */}
        <path
          d={`M ${RX - 58} ${yDec - 4}
              L ${RX - 76} ${yDec - 4}
              L ${RX - 76} ${yZ - 4}
              L ${RX - 76} ${yEnc + 14}
              L ${RX - 44} ${yEnc + 14}`}
          stroke={C.accent} strokeWidth="1.3" fill="none"
          strokeDasharray="3 3" markerEnd="url(#rt-arrow-accent)" />

        {/* annotation */}
        <text x={RX} y={yOut + 32} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          gradient flows through μ and σ —
        </text>
        <text x={RX} y={yOut + 45} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}
              fontStyle="italic">
          randomness lives in ε, not in the net
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
        The reparameterization trick rewrites the stochastic sample as a
        deterministic function of the encoder's parameters and an independent
        noise variable — making variational inference compatible with
        backpropagation.
      </figcaption>
    </figure>
  );
}
