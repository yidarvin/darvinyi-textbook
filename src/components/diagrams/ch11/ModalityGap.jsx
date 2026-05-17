const C = {
  text:    '#e5e7eb',
  muted:   '#6b7280',
  muted2:  '#94a3b8',
  border:  '#2e2e2e',
  borderLt:'#3a3a3a',
  accent:  '#2dd4bf',
  bg2:     '#161616',
  bg3:     '#0a0a0a',
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Inter', sans-serif";

// ── Geometry ─────────────────────────────────────────────────────────
// Both cones radiate UP from a single shared origin at bottom-center.
const ORIGIN = { x: 320, y: 410 };
const CONE_DIST = 230;        // distance from origin to cluster center
const CONE_HALF_ANGLE = 14;   // degrees, half-spread of each cone
const CONE_LEN = 268;         // length of cone-edge guide lines

// Math-convention angles (CCW from +x, y up). Both cones in upper half.
// Image cone tilts up-right, text cone tilts up-left. 60° gap between axes.
const IMG_ANGLE = 60;
const TXT_ANGLE = 120;

// polar→screen conversion (SVG y is flipped vs math)
function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

const IMG_CTR = polar(ORIGIN.x, ORIGIN.y, CONE_DIST, IMG_ANGLE);
const TXT_CTR = polar(ORIGIN.x, ORIGIN.y, CONE_DIST, TXT_ANGLE);

// SVG rotation = -math_angle (because SVG rotates clockwise with y-down)
const IMG_SVG_ROT = -IMG_ANGLE;   // -60°
const TXT_SVG_ROT = -TXT_ANGLE;   // -120°

// Cone-edge guide line endpoints
const IMG_INNER_EDGE = polar(ORIGIN.x, ORIGIN.y, CONE_LEN, IMG_ANGLE + CONE_HALF_ANGLE);
const IMG_OUTER_EDGE = polar(ORIGIN.x, ORIGIN.y, CONE_LEN, IMG_ANGLE - CONE_HALF_ANGLE);
const TXT_INNER_EDGE = polar(ORIGIN.x, ORIGIN.y, CONE_LEN, TXT_ANGLE - CONE_HALF_ANGLE);
const TXT_OUTER_EDGE = polar(ORIGIN.x, ORIGIN.y, CONE_LEN, TXT_ANGLE + CONE_HALF_ANGLE);

// Modality-gap arc at origin
const ARC_R = 64;
const ARC_START = polar(ORIGIN.x, ORIGIN.y, ARC_R, IMG_ANGLE);
const ARC_END   = polar(ORIGIN.x, ORIGIN.y, ARC_R, TXT_ANGLE);
const ARC_LABEL = polar(ORIGIN.x, ORIGIN.y, ARC_R + 22, 90); // above arc midpoint

// 12 jittered dot offsets — compact blob, elongated along local +x
// (rotation will align with cone axis)
const CLUSTER_OFFSETS = [
  [-22, -3], [-15,  6], [-10, -8], [-4,   3],
  [ 3,  -2], [ 10,  6], [ 16, -4], [ 22,  3],
  [-18, -5], [ -7, -2], [  7,  8], [ 14, -7],
];

function applyRotation(offsets, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return offsets.map(([dx, dy]) => [dx * c - dy * s, dx * s + dy * c]);
}

function Cluster({ ctr, svgRot, label, labelOffset, conceptIndexes, concepts }) {
  const rotated = applyRotation(CLUSTER_OFFSETS, svgRot);
  return (
    <g>
      {/* Enclosing dashed contour, oriented along cone axis */}
      <ellipse
        cx={ctr.x}
        cy={ctr.y}
        rx="38"
        ry="16"
        fill="none"
        stroke={C.borderLt}
        strokeWidth="1"
        strokeDasharray="3,3"
        transform={`rotate(${svgRot} ${ctr.x} ${ctr.y})`}
      />

      {rotated.map(([dx, dy], i) => {
        const isConcept = conceptIndexes.includes(i);
        const conceptIdx = conceptIndexes.indexOf(i);
        return (
          <g key={i}>
            <circle
              cx={ctr.x + dx}
              cy={ctr.y + dy}
              r={isConcept ? 3.4 : 2.6}
              fill={C.muted2}
            />
            {isConcept && (
              <text
                x={ctr.x + dx}
                y={ctr.y + dy - 7}
                textAnchor="middle"
                fontFamily={mono}
                fontSize="9.5"
                fill={C.text}
              >
                {concepts[conceptIdx]}
              </text>
            )}
          </g>
        );
      })}

      <text
        x={ctr.x + labelOffset.dx}
        y={ctr.y + labelOffset.dy}
        textAnchor="middle"
        fontFamily={mono}
        fontSize="11"
        fill={C.muted2}
      >
        {label}
      </text>
    </g>
  );
}

function conceptPositions(ctr, svgRot, conceptIndexes) {
  const rotated = applyRotation(CLUSTER_OFFSETS, svgRot);
  return conceptIndexes.map((i) => ({
    x: ctr.x + rotated[i][0],
    y: ctr.y + rotated[i][1],
  }));
}

export default function ModalityGap() {
  const IMG_CONCEPT_INDEXES = [0, 5, 7];
  const TXT_CONCEPT_INDEXES = [0, 5, 7];
  const IMG_CONCEPT_LABELS = ['dog', 'cat', 'car'];
  const TXT_CONCEPT_LABELS = ['"dog"', '"cat"', '"car"'];

  const imgConceptPts = conceptPositions(IMG_CTR, IMG_SVG_ROT, IMG_CONCEPT_INDEXES);
  const txtConceptPts = conceptPositions(TXT_CTR, TXT_SVG_ROT, TXT_CONCEPT_INDEXES);

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox="0 0 640 500"
        width="100%"
        role="img"
        aria-label="Modality gap: image and text embeddings form distinct cones from the embedding-space origin"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="gap-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* ── Joint embedding space boundary ─────────────── */}
        <ellipse
          cx="320"
          cy="290"
          rx="295"
          ry="200"
          fill="none"
          stroke={C.border}
          strokeWidth="1"
          strokeDasharray="4,5"
        />
        <text
          x="320"
          y="50"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted}
          letterSpacing="0.05em"
        >
          JOINT EMBEDDING SPACE  ·  ℝ^d
        </text>

        {/* ── Cone-edge guide lines (faint dashed) ──────── */}
        {[IMG_INNER_EDGE, IMG_OUTER_EDGE, TXT_INNER_EDGE, TXT_OUTER_EDGE].map((p, i) => (
          <line
            key={`cone-edge-${i}`}
            x1={ORIGIN.x}
            y1={ORIGIN.y}
            x2={p.x}
            y2={p.y}
            stroke={C.border}
            strokeWidth="1"
            strokeDasharray="2,4"
            opacity="0.8"
          />
        ))}

        {/* ── Matched-pair connectors (relational alignment) ── */}
        {imgConceptPts.map((p, i) => (
          <line
            key={`match-${i}`}
            x1={p.x}
            y1={p.y}
            x2={txtConceptPts[i].x}
            y2={txtConceptPts[i].y}
            stroke={C.muted}
            strokeWidth="0.8"
            strokeDasharray="2,4"
            opacity="0.5"
          />
        ))}

        {/* ── Clusters ──────────────────────────────────── */}
        <Cluster
          ctr={IMG_CTR}
          svgRot={IMG_SVG_ROT}
          label="image embeddings"
          labelOffset={{ dx: 32, dy: 38 }}
          conceptIndexes={IMG_CONCEPT_INDEXES}
          concepts={IMG_CONCEPT_LABELS}
        />
        <Cluster
          ctr={TXT_CTR}
          svgRot={TXT_SVG_ROT}
          label="text embeddings"
          labelOffset={{ dx: -32, dy: 38 }}
          conceptIndexes={TXT_CONCEPT_INDEXES}
          concepts={TXT_CONCEPT_LABELS}
        />

        {/* ── Modality-gap arc at origin (teal, the marquee element) ─ */}
        <path
          d={`M ${ARC_START.x} ${ARC_START.y} A ${ARC_R} ${ARC_R} 0 0 0 ${ARC_END.x} ${ARC_END.y}`}
          fill="none"
          stroke={C.accent}
          strokeWidth="1.8"
        />
        {/* tick marks at arc endpoints */}
        <circle cx={ARC_START.x} cy={ARC_START.y} r="3" fill={C.accent} />
        <circle cx={ARC_END.x}   cy={ARC_END.y}   r="3" fill={C.accent} />

        {/* Arc label */}
        <text
          x={ARC_LABEL.x}
          y={ARC_LABEL.y}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11.5"
          fill={C.accent}
          fontWeight="500"
        >
          modality gap
        </text>
        <text
          x={ARC_LABEL.x}
          y={ARC_LABEL.y + 14}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10"
          fill={C.muted2}
        >
          (angular separation)
        </text>

        {/* ── Origin point + label ──────────────────────── */}
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r="4" fill={C.text} />
        <text
          x={ORIGIN.x}
          y={ORIGIN.y + 22}
          textAnchor="middle"
          fontFamily={mono}
          fontSize="10.5"
          fill={C.muted2}
        >
          embedding-space origin
        </text>

        {/* ── Matched-pair callout ──────────────────────── */}
        <text
          x="320"
          y="455"
          textAnchor="middle"
          fontFamily={sans}
          fontSize="11"
          fill={C.muted2}
          fontStyle="italic"
        >
          faint lines: matched concepts (relational alignment across the gap)
        </text>

        {/* ── Bottom annotation ─────────────────────────── */}
        <text
          x="320"
          y="478"
          textAnchor="middle"
          fontFamily={mono}
          fontSize="11"
          fill={C.muted2}
        >
          contrastive training aligns relative geometry — not absolute positions
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
        Image and text embeddings radiate from the embedding-space origin into
        distinct narrow cones; the alignment is relational, not literal.
      </figcaption>
    </figure>
  );
}
