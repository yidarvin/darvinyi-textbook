const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.08)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// Generator box
function GBox({ cx, cy, w = 38, h = 24, accent = false }) {
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="4"
            fill={C.bg2} stroke={accent ? C.accent : C.borderLt} strokeWidth="1.5" />
      <text x={cx} y={cy + 4} textAnchor="middle"
            fontFamily={mono} fontSize="11" fill={accent ? C.accent : C.text}>
        G
      </text>
    </g>
  );
}

// Tiny noise glyph — a wavy line cluster
function NoiseGlyph({ cx, cy }) {
  return (
    <g>
      <rect x={cx - 14} y={cy - 10} width="28" height="20" rx="3"
            fill={C.bg3} stroke={C.borderLt} strokeWidth="1" />
      <path d={`M ${cx - 10} ${cy} q 2.5 -4 5 0 t 5 0 t 5 0`}
            fill="none" stroke={C.muted2} strokeWidth="1" />
      <path d={`M ${cx - 10} ${cy + 4} q 2.5 -3 5 0 t 5 0 t 5 0`}
            fill="none" stroke={C.muted2} strokeWidth="1" opacity="0.7" />
    </g>
  );
}

// Class label glyph — one-hot vector
function OneHot({ cx, cy, accent = false }) {
  const cells = [0, 1, 0, 0, 0];
  const cw = 9, gap = 1, totalW = cells.length * cw + (cells.length - 1) * gap;
  const x0 = cx - totalW / 2;
  return (
    <g>
      {cells.map((v, i) => (
        <rect
          key={i}
          x={x0 + i * (cw + gap)} y={cy - 5}
          width={cw} height={10} rx="1.5"
          fill={v ? (accent ? C.accent : C.muted2) : C.bg3}
          stroke={C.borderLt} strokeWidth="0.8"
          opacity={v ? 0.85 : 1}
        />
      ))}
    </g>
  );
}

// Sketch-like input image glyph (sparse lines)
function SketchGlyph({ cx, cy, accent = false }) {
  const stroke = accent ? C.accent : C.muted2;
  return (
    <g>
      <rect x={cx - 18} y={cy - 14} width="36" height="28" rx="3"
            fill={C.bg3} stroke={C.borderLt} strokeWidth="1" />
      {/* simple building outline */}
      <path d={`M ${cx - 12} ${cy + 8} L ${cx - 12} ${cy - 5} L ${cx - 2} ${cy - 10} L ${cx + 8} ${cy - 5} L ${cx + 8} ${cy + 8} Z`}
            fill="none" stroke={stroke} strokeWidth="1" />
      <line x1={cx - 7} y1={cy + 8} x2={cx - 7} y2={cy + 2} stroke={stroke} strokeWidth="0.8" />
      <line x1={cx + 3} y1={cy + 8} x2={cx + 3} y2={cy + 2} stroke={stroke} strokeWidth="0.8" />
    </g>
  );
}

// Photorealistic output glyph — gradient-filled building
function PhotoGlyph({ cx, cy, accent = false }) {
  const stroke = accent ? C.accent : C.muted2;
  const fill = accent ? 'rgba(45,212,191,0.12)' : '#1a1a1a';
  return (
    <g>
      <rect x={cx - 18} y={cy - 14} width="36" height="28" rx="3"
            fill={C.bg3} stroke={C.borderLt} strokeWidth="1" />
      <path d={`M ${cx - 12} ${cy + 8} L ${cx - 12} ${cy - 5} L ${cx - 2} ${cy - 10} L ${cx + 8} ${cy - 5} L ${cx + 8} ${cy + 8} Z`}
            fill={fill} stroke={stroke} strokeWidth="1" />
      <rect x={cx - 9} y={cy + 1} width="3" height="6" fill={stroke} opacity="0.65" />
      <rect x={cx - 3} y={cy + 1} width="3" height="6" fill={stroke} opacity="0.65" />
      <rect x={cx + 3} y={cy + 1} width="3" height="6" fill={stroke} opacity="0.65" />
      <rect x={cx - 6} y={cy - 4} width="3" height="4" fill={stroke} opacity="0.45" />
      <rect x={cx} y={cy - 4} width="3" height="4" fill={stroke} opacity="0.45" />
    </g>
  );
}

// Random-output glyph — abstract circles
function RandomGlyph({ cx, cy }) {
  return (
    <g>
      <rect x={cx - 18} y={cy - 14} width="36" height="28" rx="3"
            fill={C.bg3} stroke={C.borderLt} strokeWidth="1" />
      <circle cx={cx - 8} cy={cy - 2} r="4" fill={C.muted2} opacity="0.55" />
      <circle cx={cx + 5} cy={cy + 4} r="3" fill={C.muted2} opacity="0.4" />
      <circle cx={cx + 2} cy={cy - 6} r="2.5" fill={C.muted2} opacity="0.7" />
    </g>
  );
}

// Dog-glyph for class-conditional output (a simple silhouette)
function DogGlyph({ cx, cy }) {
  return (
    <g>
      <rect x={cx - 18} y={cy - 14} width="36" height="28" rx="3"
            fill={C.bg3} stroke={C.borderLt} strokeWidth="1" />
      {/* body */}
      <ellipse cx={cx - 1} cy={cy + 4} rx="11" ry="5" fill={C.muted2} opacity="0.7" />
      {/* head */}
      <circle cx={cx + 8} cy={cy} r="4.5" fill={C.muted2} opacity="0.8" />
      {/* ear */}
      <path d={`M ${cx + 10} ${cy - 3} l 2 -3 l 1 4 z`} fill={C.muted2} opacity="0.8" />
      {/* legs */}
      <line x1={cx - 7} y1={cy + 8} x2={cx - 7} y2={cy + 11}
            stroke={C.muted2} strokeWidth="1.5" />
      <line x1={cx + 4} y1={cy + 8} x2={cx + 4} y2={cy + 11}
            stroke={C.muted2} strokeWidth="1.5" />
    </g>
  );
}

export default function ConditioningSpectrum() {
  // Panel x-centers
  const P1 = 110;
  const P2 = 320;
  const P3 = 530;

  // Vertical layout
  const titleY    = 38;
  const inputTopY = 70;       // for z noise
  const inputBotY = 116;      // for condition
  const gY        = 93;       // generator centerline
  const outY      = 93;       // output glyph centerline
  const annY      = 188;      // panel annotation

  // Generator x
  const gxOffset = 0;

  // Connector positions per panel
  const Panel = ({ x, title, hasZ, condition, output, accent }) => (
    <g>
      {/* Panel title */}
      <text x={x} y={titleY} textAnchor="middle"
            fontFamily={mono} fontSize="11.5" fill={accent ? C.accent : C.text}
            letterSpacing="0.04em">
        {title}
      </text>

      {/* Panel border */}
      <rect x={x - 90} y={50} width="180" height="148" rx="6"
            fill={accent ? C.accentDim : 'transparent'}
            stroke={accent ? C.accent : C.border} strokeWidth="1"
            strokeDasharray={accent ? 'none' : '3 3'} />

      {/* z noise (always shown — sometimes muted) */}
      {hasZ && (
        <>
          <NoiseGlyph cx={x - 60} cy={inputTopY} />
          <text x={x - 60} y={inputTopY - 16} textAnchor="middle"
                fontFamily={mono} fontSize="9.5" fill={C.muted}>
            z ~ N(0, I)
          </text>
        </>
      )}

      {/* condition */}
      {condition === 'class' && (
        <>
          <OneHot cx={x - 60} cy={inputBotY} accent={accent} />
          <text x={x - 60} y={inputBotY + 18} textAnchor="middle"
                fontFamily={mono} fontSize="9.5" fill={C.muted}>
            class: "dog"
          </text>
        </>
      )}
      {condition === 'image' && (
        <>
          <SketchGlyph cx={x - 60} cy={inputBotY} accent={accent} />
          <text x={x - 60} y={inputBotY + 20} textAnchor="middle"
                fontFamily={mono} fontSize="9.5" fill={C.muted}>
            input image x
          </text>
        </>
      )}

      {/* Lines from inputs to generator */}
      {hasZ && (
        <line x1={x - 45} y1={inputTopY} x2={x + gxOffset - 22} y2={gY - 4}
              stroke={C.muted2} strokeWidth="1" />
      )}
      {condition && (
        <line x1={x - 45} y1={inputBotY} x2={x + gxOffset - 22} y2={gY + 4}
              stroke={accent ? C.accent : C.muted2} strokeWidth="1" />
      )}

      {/* Generator */}
      <GBox cx={x + gxOffset} cy={gY} accent={accent} />

      {/* Arrow to output */}
      <line x1={x + gxOffset + 22} y1={gY} x2={x + 50} y2={outY}
            stroke={accent ? C.accent : C.muted2} strokeWidth="1"
            markerEnd={accent ? 'url(#cs-arrow-accent)' : 'url(#cs-arrow)'} />

      {/* Output glyph */}
      {output === 'random' && <RandomGlyph cx={x + 70} cy={outY} />}
      {output === 'dog'    && <DogGlyph    cx={x + 70} cy={outY} />}
      {output === 'photo'  && <PhotoGlyph  cx={x + 70} cy={outY} accent={accent} />}

      <text x={x + 70} y={outY + 24} textAnchor="middle"
            fontFamily={mono} fontSize="9.5"
            fill={accent ? C.accent : C.muted2}>
        {output === 'random' ? 'random sample'
          : output === 'dog' ? 'sample of "dog"'
          : 'translated photo'}
      </text>
    </g>
  );

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 300"
        width="100%"
        role="img"
        aria-label="The conditional-GAN spectrum — from unconditional, to class-conditional, to image-conditional"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="cs-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="cs-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Top header */}
        <text x="320" y="20" textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.muted2}
              letterSpacing="0.06em">
          conditioning richness grows left to right
        </text>

        {/* Three panels */}
        <Panel x={P1} title="Unconditional" hasZ condition={null} output="random" />
        <Panel x={P2} title="Class-conditional" hasZ condition="class" output="dog" />
        <Panel x={P3} title="Image-conditional (pix2pix)" hasZ condition="image" output="photo" accent />

        {/* Per-panel sub-annotations */}
        <text x={P1} y={annY} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}>
          no control — sample is arbitrary
        </text>
        <text x={P2} y={annY} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted}>
          ~10 bits of class info
        </text>
        <text x={P3} y={annY} textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.accent}>
          millions of pixels of input info
        </text>

        {/* Bottom unified annotation */}
        <text x="320" y="240" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}>
          Mirza &amp; Osindero 2014 introduced the framework; everything from
          class-conditional
        </text>
        <text x="320" y="256" textAnchor="middle"
              fontFamily={sans} fontSize="11" fill={C.muted}>
          to text-to-image to ControlNet builds on it.
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
        The same conditional-GAN architecture supports anything from a class
        label to a full input image — what changes is how much information the
        condition carries.
      </figcaption>
    </figure>
  );
}
