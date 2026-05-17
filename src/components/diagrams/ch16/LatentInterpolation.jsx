const C = {
  text:     '#e5e7eb',
  muted:    '#6b7280',
  muted2:   '#94a3b8',
  border:   '#2e2e2e',
  borderLt: '#3a3a3a',
  accent:   '#2dd4bf',
  accentDim:'rgba(45,212,191,0.16)',
  bg2:      '#161616',
  bg3:      '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// 7 interpolation points
const TS = [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1.0];
const T_LABEL = ['0', '0.17', '0.33', '0.5', '0.67', '0.83', '1.0'];

// Geometric layout
const LEFT_X  = 70;
const RIGHT_X = 570;
const LINE_Y  = 84;

// Bottom-row glyph centers (aligned to interp points)
const GLYPH_R = 22;
const GLYPH_Y = 200;

// Face glyph that morphs smoothly:
//   t=0 → profile view (subject A): one eye visible, narrow face
//   t=1 → frontal view (subject B): two symmetric eyes, wide face
// Identity also morphs (different mouth/face proportions)
function MorphFace({ cx, cy, t, highlight }) {
  // Outline ovality: t=0 narrow (profile), t=1 round (frontal)
  const rx = 16 + 6 * t;     // 16 → 22
  const ry = 22 - 2 * t;     // 22 → 20

  // Eye positions:
  // At t=0: one eye, offset right (profile facing right)
  // At t=1: two eyes symmetric
  const eyeLeftOpacity  = Math.max(0, t);          // grows in
  const eyeRightOpacity = 1;                       // always visible
  // eye horizontal positions
  const eyeLX = cx - 6 * t;        // at t=0 collapses toward center, then moves out
  const eyeRX = cx + 4 + 2 * t;    // small drift outward

  // Mouth: profile = short asymmetric line; frontal = curved smile
  // We morph the path curvature.
  const mw = 5 + 3 * t;
  const mouthY = cy + 8;
  const curve = 4 * t; // smile depth grows with t
  const mouthD = `M ${cx - mw} ${mouthY}
                  Q ${cx} ${mouthY + curve}
                  ${cx + mw} ${mouthY}`;

  // Nose: line angled at profile, vertical at frontal
  const noseAngle = (1 - t) * 30; // degrees
  const noseLen = 5;
  const a = (-90 + noseAngle) * Math.PI / 180; // pointing roughly down
  const nx2 = cx + noseLen * Math.cos(a);
  const ny2 = cy + Math.abs(noseLen * Math.sin(a)) + 2;

  const stroke = highlight ? C.accent : C.muted2;
  const fill   = highlight ? 'rgba(45,212,191,0.08)' : C.bg3;

  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
               fill={fill} stroke={stroke} strokeWidth="1.4" />
      {/* left eye (only at higher t) */}
      <circle cx={eyeLX} cy={cy - 5} r={1.8}
              fill={stroke} opacity={eyeLeftOpacity} />
      {/* right eye (always) */}
      <circle cx={eyeRX} cy={cy - 5} r={1.8}
              fill={stroke} opacity={eyeRightOpacity} />
      {/* nose */}
      <line x1={cx} y1={cy - 1} x2={nx2} y2={ny2}
            stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      {/* mouth */}
      <path d={mouthD}
            stroke={stroke} strokeWidth="1.2" fill="none"
            strokeLinecap="round" />
    </g>
  );
}

export default function LatentInterpolation() {
  // Compute x-positions for each t along the line
  const xs = TS.map(t => LEFT_X + t * (RIGHT_X - LEFT_X));

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 290"
        width="100%"
        role="img"
        aria-label="Linear interpolation between two latent codes producing a smooth morph in decoded space"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="li-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
        </defs>

        {/* ── Top: latent space row ──────────────────── */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={sans} fontSize="12" fill={C.text}
              fontStyle="italic">
          Latent space  ·  straight line between z<tspan baselineShift="sub" fontSize="8">A</tspan>
          {' '}and z<tspan baselineShift="sub" fontSize="8">B</tspan>
        </text>

        {/* 2D latent plane backdrop (muted) */}
        <rect x="40" y="40" width="560" height="80" rx="4"
              fill={C.bg3} stroke={C.border} strokeWidth="1"
              opacity="0.6" />
        {/* faint axis cross */}
        <line x1="40" y1={LINE_Y} x2="600" y2={LINE_Y}
              stroke={C.border} strokeWidth="0.6" strokeDasharray="2 4" />
        <line x1="320" y1="44" x2="320" y2="116"
              stroke={C.border} strokeWidth="0.6" strokeDasharray="2 4" />

        {/* the interp line — teal */}
        <line x1={LEFT_X} y1={LINE_Y} x2={RIGHT_X} y2={LINE_Y}
              stroke={C.accent} strokeWidth="1.6" />

        {/* endpoint markers + labels */}
        {xs.map((x, i) => {
          const isMid = i === 3;
          const r = isMid ? 5 : 3.5;
          const fill = isMid ? C.accent : C.muted2;
          return (
            <g key={`pt-${i}`}>
              <circle cx={x} cy={LINE_Y} r={r}
                      fill={fill}
                      stroke={isMid ? C.accent : 'none'}
                      strokeWidth={isMid ? '1.5' : '0'} />
              <text x={x} y={LINE_Y - 11} textAnchor="middle"
                    fontFamily={mono} fontSize="9"
                    fill={isMid ? C.accent : C.muted2}>
                t = {T_LABEL[i]}
              </text>
            </g>
          );
        })}

        {/* endpoint labels z_A, z_B */}
        <text x={LEFT_X} y={LINE_Y + 22} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          z<tspan baselineShift="sub" fontSize="8">A</tspan>
        </text>
        <text x={RIGHT_X} y={LINE_Y + 22} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          z<tspan baselineShift="sub" fontSize="8">B</tspan>
        </text>

        {/* connector lines from latent points down to decoded glyphs */}
        {xs.map((x, i) => (
          <line key={`con-${i}`}
                x1={x} y1={LINE_Y + 6}
                x2={x} y2={GLYPH_Y - GLYPH_R - 2}
                stroke={C.border} strokeWidth="0.8"
                strokeDasharray="2 3" />
        ))}

        {/* ── Bottom: decoded glyphs ──────────────────── */}
        <text x="40" y={GLYPH_Y - 60} textAnchor="start"
              fontFamily={mono} fontSize="10" fill={C.muted}>
          decode( z )
        </text>

        {xs.map((x, i) => (
          <MorphFace key={`face-${i}`} cx={x} cy={GLYPH_Y}
                     t={TS[i]} highlight={i === 3} />
        ))}

        {/* arrow under the row */}
        <line x1={LEFT_X - 6} y1={GLYPH_Y + 38}
              x2={RIGHT_X + 6} y2={GLYPH_Y + 38}
              stroke={C.muted2} strokeWidth="1"
              markerEnd="url(#li-arrow)" />

        {/* bottom annotation */}
        <text x="320" y={GLYPH_Y + 58} textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}>
          linear traversal in latent space → semantic interpolation in output space
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
        Every point along a straight line in VAE latent space decodes to a
        coherent output — the KL regularization left no holes.
      </figcaption>
    </figure>
  );
}
