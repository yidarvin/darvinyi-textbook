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

const W = 640;
const H = 520;

function Box({ x, y, w, h, label, sub, accent }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={C.bg2}
        stroke={accent ? C.accent : C.border}
        strokeWidth="1.5"
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + (sub ? -3 : 4)}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="10.5"
        fill={accent ? C.accent : C.text}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="9.5"
          fill={C.muted}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const px = x2 - 8 * Math.cos(angle - Math.PI / 7);
  const py = y2 - 8 * Math.sin(angle - Math.PI / 7);
  const qx = x2 - 8 * Math.cos(angle + Math.PI / 7);
  const qy = y2 - 8 * Math.sin(angle + Math.PI / 7);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - 2 * Math.cos(angle)} y2={y2 - 2 * Math.sin(angle)} stroke={C.muted} strokeWidth="1.2" />
      <polygon points={`${x2},${y2} ${px},${py} ${qx},${qy}`} fill={C.muted} />
    </g>
  );
}

export default function ConstitutionalAILoop() {
  // Top panel (SL-CAI)
  const T_Y = 50;
  const T_H = 200;
  // Bottom panel (RL-CAI)
  const B_Y = 290;
  const B_H = 210;

  // SL-CAI boxes
  const slBoxY = T_Y + 50;
  const slBoxH = 42;
  const slBoxes = [
    { x: 20,  w: 90,  label: 'prompt' },
    { x: 130, w: 100, label: 'initial', sub: 'response' },
    { x: 250, w: 110, label: 'critique', sub: 'vs principle P' },
    { x: 380, w: 110, label: 'revised', sub: 'response', accent: true },
    { x: 510, w: 110, label: 'training', sub: 'example' },
  ];

  // RL-CAI boxes
  const rlBoxY = B_Y + 60;
  const rlBoxH = 42;
  const rlPromptX = 12;
  const rlRespAX = 110;
  const rlRespBX = 110;
  const rlFeedbackX = 240;
  const rlPrefX = 360;
  const rlTrainX = 470;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Constitutional AI: SL-CAI critique-and-revise and RL-CAI RLAIF phases"
        style={{ display: 'block' }}
      >
        {/* ── Top panel: SL-CAI ─────────────────────────────── */}
        <rect x={8} y={T_Y} width={W - 16} height={T_H} rx="6" fill="none" stroke={C.border} strokeWidth="1" strokeDasharray="3,4" />
        <text x={24} y={T_Y + 22} fontFamily={mono} fontSize="11" fill={C.text} letterSpacing="0.05em">
          SL-CAI · Critique and Revise
        </text>

        {slBoxes.map((b, i) => (
          <Box
            key={i}
            x={b.x}
            y={slBoxY}
            w={b.w}
            h={slBoxH}
            label={b.label}
            sub={b.sub}
            accent={b.accent}
          />
        ))}
        {slBoxes.slice(0, -1).map((b, i) => {
          const next = slBoxes[i + 1];
          return (
            <Arrow
              key={i}
              x1={b.x + b.w + 2}
              y1={slBoxY + slBoxH / 2}
              x2={next.x - 2}
              y2={slBoxY + slBoxH / 2}
            />
          );
        })}

        {/* Principle note */}
        <rect x={140} y={slBoxY + 70} width={360} height={36} rx="4" fill={C.bg2} stroke={C.border} strokeWidth="1" strokeDasharray="2,3" />
        <text x={W / 2} y={slBoxY + 92} textAnchor="middle" fontFamily={mono} fontStyle="italic" fontSize="10.5" fill={C.muted2}>
          "Choose the response most respectful of the user's autonomy."
        </text>
        <text x={W / 2} y={slBoxY + 122} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          iterate across many principles, many prompts
        </text>

        {/* ── Bottom panel: RL-CAI ─────────────────────────────── */}
        <rect x={8} y={B_Y} width={W - 16} height={B_H} rx="6" fill="none" stroke={C.border} strokeWidth="1" strokeDasharray="3,4" />
        <text x={24} y={B_Y + 22} fontFamily={mono} fontSize="11" fill={C.text} letterSpacing="0.05em">
          RL-CAI · RLAIF
        </text>

        {/* prompt */}
        <Box x={rlPromptX} y={rlBoxY + 12} w={84} h={rlBoxH} label="prompt" />
        <Arrow x1={rlPromptX + 84 + 2} y1={rlBoxY + 12 + rlBoxH / 2} x2={rlRespAX - 2} y2={rlBoxY + 12 + rlBoxH / 2} />

        {/* responses A/B */}
        <Box x={rlRespAX} y={rlBoxY - 14} w={94} h={36} label="response A" />
        <Box x={rlRespBX} y={rlBoxY + 38} w={94} h={36} label="response B" />
        <Arrow x1={rlRespAX + 94 + 2} y1={rlBoxY + 4} x2={rlFeedbackX - 2} y2={rlBoxY + 22} />
        <Arrow x1={rlRespBX + 94 + 2} y1={rlBoxY + 56} x2={rlFeedbackX - 2} y2={rlBoxY + 38} />

        {/* feedback model */}
        <Box x={rlFeedbackX} y={rlBoxY + 6} w={108} h={54} label="feedback LM" sub="vs constitution" />
        <Arrow x1={rlFeedbackX + 108 + 2} y1={rlBoxY + 33} x2={rlPrefX - 2} y2={rlBoxY + 33} />

        {/* preference */}
        <Box x={rlPrefX} y={rlBoxY + 6} w={94} h={54} label="preference" sub="A > B" />
        <Arrow x1={rlPrefX + 94 + 2} y1={rlBoxY + 33} x2={rlTrainX - 2} y2={rlBoxY + 33} />

        {/* train policy (teal) */}
        <Box x={rlTrainX} y={rlBoxY + 6} w={158} h={54} label="train policy" sub="RLHF on AI prefs" accent />

        <text x={W / 2} y={B_Y + B_H - 14} textAnchor="middle" fontFamily={mono} fontSize="10" fill={C.muted}>
          human preferences replaced by AI feedback at training-data scale
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
        Constitutional AI: the model first critiques and revises its own outputs
        against a written constitution, then learns from AI-generated preferences
        over response pairs.
      </figcaption>
    </figure>
  );
}
