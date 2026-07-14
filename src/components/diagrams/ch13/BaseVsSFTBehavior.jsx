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

export default function BaseVsSFTBehavior() {
  // Layout
  const W = 640;
  // Prompt box (centered top)
  const promptX = 80;
  const promptY = 28;
  const promptW = 480;
  const promptH = 48;

  // Two panels
  const panelY = 122;
  const panelH = 232;
  const panelW = 280;
  const leftX = 30;
  const rightX = W - 30 - panelW;

  // Footer annotation
  const footerY = 410;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 ${W} 460`}
        width="100%"
        role="img"
        aria-label="Base model vs SFT model behavior on the same prompt"
        style={{ display: 'block' }}
      >
        {/* Prompt box */}
        <rect
          x={promptX}
          y={promptY}
          width={promptW}
          height={promptH}
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text
          x={promptX + 12}
          y={promptY + 18}
          fontFamily={mono}
          fontSize="10"
          fill={C.muted2}
          letterSpacing="0.08em"
        >
          USER
        </text>
        <text
          x={promptX + 12}
          y={promptY + 36}
          fontFamily={mono}
          fontSize="11.5"
          fill={C.text}
        >
          Translate "Hello, how are you?" to French.
        </text>

        {/* Arrow down from prompt to both panels */}
        <line x1={leftX + panelW / 2} y1={promptY + promptH + 6} x2={leftX + panelW / 2} y2={panelY - 6} stroke={C.muted} strokeWidth="1.2" />
        <line x1={rightX + panelW / 2} y1={promptY + promptH + 6} x2={rightX + panelW / 2} y2={panelY - 6} stroke={C.muted} strokeWidth="1.2" />
        <polygon points={`${leftX + panelW / 2 - 4},${panelY - 8} ${leftX + panelW / 2 + 4},${panelY - 8} ${leftX + panelW / 2},${panelY - 2}`} fill={C.muted} />
        <polygon points={`${rightX + panelW / 2 - 4},${panelY - 8} ${rightX + panelW / 2 + 4},${panelY - 8} ${rightX + panelW / 2},${panelY - 2}`} fill={C.muted} />

        {/* ───── Left panel: Base model ───── */}
        <text x={leftX + panelW / 2} y={panelY - 16} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.text} letterSpacing="0.05em">
          Pretrained, no SFT
        </text>
        <rect
          x={leftX}
          y={panelY}
          width={panelW}
          height={panelH}
          rx="4"
          fill={C.bg2}
          stroke={C.border}
          strokeWidth="1.5"
        />
        <text x={leftX + 14} y={panelY + 22} fontFamily={mono} fontSize="10" fill={C.muted} letterSpacing="0.08em">
          MODEL OUTPUT
        </text>
        {[
          'Translate "Good morning" to',
          'Spanish.',
          'Translate "Thank you" to German.',
          'Translate "Where is the train',
          'station?" to Italian.',
        ].map((line, i) => (
          <text
            key={i}
            x={leftX + 14}
            y={panelY + 50 + i * 20}
            fontFamily={mono}
            fontSize="11"
            fill={C.muted2}
          >
            {line}
          </text>
        ))}
        <text
          x={leftX + panelW / 2}
          y={panelY + panelH - 14}
          textAnchor="middle"
          fontFamily={sans}
          fontStyle="italic"
          fontSize="11"
          fill={C.muted}
        >
          continues the pattern — instruction is just text
        </text>

        {/* ───── Right panel: SFT model (teal) ───── */}
        <text x={rightX + panelW / 2} y={panelY - 16} textAnchor="middle" fontFamily={mono} fontSize="11" fill={C.text} letterSpacing="0.05em">
          After SFT
        </text>
        <rect
          x={rightX}
          y={panelY}
          width={panelW}
          height={panelH}
          rx="4"
          fill={C.bg2}
          stroke={C.accent}
          strokeWidth="1.5"
        />
        <text x={rightX + 14} y={panelY + 22} fontFamily={mono} fontSize="10" fill={C.accent} letterSpacing="0.08em">
          MODEL OUTPUT
        </text>
        <text
          x={rightX + panelW / 2}
          y={panelY + 115}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="13"
          fill={C.text}
        >
          "Bonjour, comment allez-vous ?"
        </text>
        <text
          x={rightX + panelW / 2}
          y={panelY + panelH - 14}
          textAnchor="middle"
          fontFamily={sans}
          fontStyle="italic"
          fontSize="11"
          fill={C.muted}
        >
          executes the instruction
        </text>

        {/* Footer annotation */}
        <text
          x={W / 2}
          y={footerY}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted}
        >
          SFT data: ~1K (LIMA) to ~28K (Llama 2) curated (instruction, response) pairs
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
        SFT does not teach new capabilities — it teaches the model that an
        instruction is a request to fulfill rather than a pattern to continue.
      </figcaption>
    </figure>
  );
}
