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

// Schema JSON lines
const SCHEMA_LINES = [
  '{',
  '  "name": "search_weather",',
  '  "description":',
  '    "Get current weather",',
  '  "params": {',
  '    "location": "string",',
  '    "units":',
  '      "celsius|fahrenheit"',
  '  }',
  '}',
];

// Model turn-1 output JSON
const MODEL1_LINES = [
  '{',
  '  "function": "search_weather",',
  '  "arguments": {',
  '    "location": "San Francisco",',
  '    "units": "celsius"',
  '  }',
  '}',
];

// Runtime output
const RUNTIME_LINES = [
  'search_weather("San Francisco", "celsius")',
  '→ external API request',
  'returns: {"temperature": 14,',
  '          "conditions": "foggy"}',
];

export default function FunctionCallingProtocol() {
  const totalH = 640;

  // Schema card (left)
  const SCH_X = 20, SCH_Y = 72, SCH_W = 200;
  const SCH_LINE_H = 13;
  const SCH_TOP = 44;
  const SCH_H = SCH_TOP + SCHEMA_LINES.length * SCH_LINE_H + 14; // 44 + 130 + 14 = 188

  // Right column flow
  const FX = 240, FW = 380;
  const USER_Y = 72,    USER_H = 44;
  const M1_Y  = 134,    M1_H  = 144;
  const RT_Y  = 296,    RT_H  = 110;
  const M2_Y  = 424,    M2_H  = 56;

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 640 ${totalH}`}
        width="100%"
        role="img"
        aria-label="Function calling protocol diagram. A tool schema is declared once on the left. The right column shows the four-step cycle: user query, model emits JSON specifying the function call, runtime executes it and returns a result, model integrates the result into a natural-language reply. Provider strip at the bottom highlights MCP as the 2024 wire-format standard."
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="fcp-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="fcp-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          function calling — the structured tool-use protocol
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          schema declared once, then a four-step cycle per call
        </text>

        {/* ── Schema card (left) ── */}
        <rect x={SCH_X} y={SCH_Y} width={SCH_W} height={SCH_H} rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1.2" />
        <rect x={SCH_X} y={SCH_Y} width={SCH_W} height="28" rx="4"
              fill={C.bg3} />
        <rect x={SCH_X} y={SCH_Y + 24} width={SCH_W} height="4"
              fill={C.bg3} />
        <line x1={SCH_X} y1={SCH_Y + 28} x2={SCH_X + SCH_W} y2={SCH_Y + 28}
              stroke={C.borderLt} strokeWidth="0.8" />
        <text x={SCH_X + 12} y={SCH_Y + 18}
              fontFamily={mono} fontSize="10" fill={C.text}
              fontWeight="600" letterSpacing="0.06em">
          TOOL SCHEMA
        </text>
        <text x={SCH_X + SCH_W / 2} y={SCH_Y + 42}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}>
          defined ahead of time
        </text>
        {SCHEMA_LINES.map((line, i) => (
          <text key={i}
                x={SCH_X + 10}
                y={SCH_Y + SCH_TOP + 14 + i * SCH_LINE_H}
                fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            {line}
          </text>
        ))}

        {/* Annotation under schema */}
        <text x={SCH_X + SCH_W / 2} y={SCH_Y + SCH_H + 22}
              textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted}
              fontStyle="italic">
          exposed to the model
        </text>
        <text x={SCH_X + SCH_W / 2} y={SCH_Y + SCH_H + 36}
              textAnchor="middle"
              fontFamily={sans} fontSize="9.5" fill={C.muted}
              fontStyle="italic">
          as a structured catalog
        </text>

        {/* Dashed arrow from schema → Model turn 1 */}
        <line x1={SCH_X + SCH_W + 4} y1={SCH_Y + SCH_H / 2}
              x2={FX - 6}           y2={M1_Y + M1_H / 2 - 10}
              stroke={C.muted2} strokeWidth="1" strokeDasharray="3 3"
              opacity="0.7"
              markerEnd="url(#fcp-arrow-muted)" />
        <text x={(SCH_X + SCH_W + FX) / 2}
              y={SCH_Y + SCH_H / 2 - 6}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}
              fontStyle="italic">
          available during
        </text>
        <text x={(SCH_X + SCH_W + FX) / 2}
              y={SCH_Y + SCH_H / 2 + 6}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}
              fontStyle="italic">
          decoding
        </text>

        {/* ── Step 1: User query ── */}
        <rect x={FX} y={USER_Y} width={FW} height={USER_H} rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1" />
        <text x={FX + 12} y={USER_Y + 16}
              fontFamily={mono} fontSize="9" fill={C.muted}
              letterSpacing="0.06em">
          [1]  USER MESSAGE
        </text>
        <text x={FX + 12} y={USER_Y + 34}
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          "What's the weather in SF?"
        </text>

        {/* Arrow ① → ② */}
        <line x1={FX + FW / 2} y1={USER_Y + USER_H + 2}
              x2={FX + FW / 2} y2={M1_Y - 4}
              stroke={C.muted2} strokeWidth="1.2"
              markerEnd="url(#fcp-arrow-muted)" />

        {/* ── Step 2: Model (turn 1) emits JSON ── */}
        <rect x={FX} y={M1_Y} width={FW} height={M1_H} rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1" />
        <text x={FX + 12} y={M1_Y + 16}
              fontFamily={mono} fontSize="9" fill={C.muted}
              letterSpacing="0.06em">
          [2]  MODEL (turn 1) — emits structured JSON
        </text>
        <rect x={FX + 10} y={M1_Y + 26} width={FW - 20} height={M1_H - 36}
              rx="3" fill={C.bg3} stroke={C.border} strokeWidth="0.8" />
        {MODEL1_LINES.map((line, i) => (
          <text key={i}
                x={FX + 22}
                y={M1_Y + 42 + i * 14}
                fontFamily={mono} fontSize="10" fill={C.text}>
            {line}
          </text>
        ))}

        {/* Arrow ② → ③ */}
        <line x1={FX + FW / 2} y1={M1_Y + M1_H + 2}
              x2={FX + FW / 2} y2={RT_Y - 4}
              stroke={C.muted2} strokeWidth="1.2"
              markerEnd="url(#fcp-arrow-muted)" />
        <text x={FX + FW / 2 + 8} y={M1_Y + M1_H + 14}
              fontFamily={mono} fontSize="8.5" fill={C.muted}
              fontStyle="italic">
          structured decoding ensures valid JSON
        </text>

        {/* ── Step 3: Runtime executes ── */}
        <rect x={FX} y={RT_Y} width={FW} height={RT_H} rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1" />
        <text x={FX + 12} y={RT_Y + 16}
              fontFamily={mono} fontSize="9" fill={C.muted}
              letterSpacing="0.06em">
          [3]  RUNTIME / EXECUTOR — calls the function
        </text>
        {RUNTIME_LINES.map((line, i) => (
          <text key={i}
                x={FX + 22}
                y={RT_Y + 38 + i * 14}
                fontFamily={mono} fontSize="9.5"
                fill={i === 0 ? C.accent : C.text}>
            {line}
          </text>
        ))}

        {/* Arrow ③ → ④ */}
        <line x1={FX + FW / 2} y1={RT_Y + RT_H + 2}
              x2={FX + FW / 2} y2={M2_Y - 4}
              stroke={C.muted2} strokeWidth="1.2"
              markerEnd="url(#fcp-arrow-muted)" />

        {/* ── Step 4: Model (turn 2) integrates ── */}
        <rect x={FX} y={M2_Y} width={FW} height={M2_H} rx="4"
              fill={C.bg2} stroke={C.borderLt} strokeWidth="1" />
        <text x={FX + 12} y={M2_Y + 16}
              fontFamily={mono} fontSize="9" fill={C.muted}
              letterSpacing="0.06em">
          [4]  MODEL (turn 2) — integrates tool result
        </text>
        <text x={FX + 12} y={M2_Y + 38}
              fontFamily={mono} fontSize="10.5" fill={C.text}>
          "It's 14°C and foggy in San Francisco."
        </text>

        {/* Bottom annotation strip: providers / protocols */}
        <line x1="30" y1={M2_Y + M2_H + 32} x2="610" y2={M2_Y + M2_H + 32}
              stroke={C.border} strokeWidth="0.6" />
        <text x="320" y={M2_Y + M2_H + 52}
              textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted2}
              letterSpacing="0.04em">
          standardization timeline
        </text>
        <g transform={`translate(0, ${M2_Y + M2_H + 70})`}>
          <text x="100" y="0" textAnchor="middle"
                fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            OpenAI Function
          </text>
          <text x="100" y="12" textAnchor="middle"
                fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            Calling (2023)
          </text>

          <text x="180" y="6" fontFamily={mono} fontSize="11"
                fill={C.muted}>·</text>

          <text x="265" y="0" textAnchor="middle"
                fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            Anthropic Tool
          </text>
          <text x="265" y="12" textAnchor="middle"
                fontFamily={mono} fontSize="9.5" fill={C.muted2}>
            Use (2024)
          </text>

          <text x="345" y="6" fontFamily={mono} fontSize="11"
                fill={C.muted}>·</text>

          <text x="450" y="0" textAnchor="middle"
                fontFamily={mono} fontSize="10" fill={C.accent}
                fontWeight="600">
            MCP (Nov 2024)
          </text>
          <text x="450" y="12" textAnchor="middle"
                fontFamily={mono} fontSize="9" fill={C.accent}>
            standardizes the wire format
          </text>
          <text x="450" y="24" textAnchor="middle"
                fontFamily={mono} fontSize="9" fill={C.accent}>
            across providers
          </text>

          <rect x="380" y="-16" width="140" height="46" rx="4"
                fill={C.accentDim} stroke={C.accent} strokeWidth="1"
                opacity="0.85" />
        </g>
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
        Function calling structures tool use as a four-step protocol — schema declaration,
        model output as JSON, runtime execution, model integration — converged by MCP into a single wire format.
      </figcaption>
    </figure>
  );
}
