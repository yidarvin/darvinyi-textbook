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

const Box = ({ x, y, w, h, fill = C.bg2, stroke = C.borderLt, sw = 1, rx = 4 }) => (
  <rect x={x} y={y} width={w} height={h} rx={rx}
        fill={fill} stroke={stroke} strokeWidth={sw} />
);

export default function RAGPipeline() {
  const totalH = 620;

  // Top arms — two parallel pipelines feeding the central DB
  const ARM_Y = 92;
  const ARM_H = 58;

  // Offline arm boxes
  const docsX = 22,  docsW = 68;
  const chunkX = 100, chunkW = 86;
  const embedCX = 196, embedCW = 110;

  // Online arm boxes
  const qX = 336,  qW = 120;
  const embedQX = 466, embedQW = 110;

  // Central vector DB
  const DB_X = 160, DB_W = 320, DB_Y = 218, DB_H = 90;

  // Top-k retrieved chunks
  const TK_X = 200, TK_W = 240, TK_Y = 360, TK_H = 50;

  // Final row (context + LM → answer)
  const CTX_X = 80,  CTX_W = 280, CTX_Y = 450, CTX_H = 60;
  const ANS_X = 410, ANS_W = 150;

  // Compute centers
  const eCcx = embedCX + embedCW / 2;  // 251
  const eQcx = embedQX + embedQW / 2;  // 521
  const dbCenterY = DB_Y + DB_H / 2;   // 263

  return (
    <figure style={{ margin: '28px 0' }}>
      <svg
        viewBox={`0 0 640 ${totalH}`}
        width="100%"
        role="img"
        aria-label="Retrieval-Augmented Generation pipeline. Two pipelines feed a central shared vector database: an offline indexing arm on the left (documents → chunker → embedding model) and an online query arm on the right (user query → embedding model). The vector database returns the top-k most-similar passages, which are concatenated with the query to form an augmented prompt for the language model, producing the final answer."
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="rag-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted2} />
          </marker>
          <marker id="rag-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text x="320" y="22" textAnchor="middle"
              fontFamily={mono} fontSize="11.5" fill={C.text}
              letterSpacing="0.04em">
          retrieval-augmented generation — the canonical external-memory pattern
        </text>
        <text x="320" y="40" textAnchor="middle"
              fontFamily={sans} fontSize="10.5" fill={C.muted2}
              fontStyle="italic">
          two pipelines, one shared vector database
        </text>

        {/* Section labels */}
        <text x="22" y="72" fontFamily={mono} fontSize="9.5"
              fill={C.muted2} letterSpacing="0.06em">
          OFFLINE INDEXING
        </text>
        <text x="158" y="72" fontFamily={mono} fontSize="9"
              fill={C.muted} fontStyle="italic">
          — once per corpus
        </text>

        <text x="336" y="72" fontFamily={mono} fontSize="9.5"
              fill={C.muted2} letterSpacing="0.06em">
          ONLINE QUERY
        </text>
        <text x="446" y="72" fontFamily={mono} fontSize="9"
              fill={C.muted} fontStyle="italic">
          — per request
        </text>

        {/* Section separator */}
        <line x1="22" y1="78" x2="306" y2="78"
              stroke={C.border} strokeWidth="0.6" />
        <line x1="336" y1="78" x2="610" y2="78"
              stroke={C.border} strokeWidth="0.6" />

        {/* ── OFFLINE ARM (left) ── */}
        {/* Documents stack */}
        <g>
          <rect x={docsX + 10} y={ARM_Y + 4} width={docsW - 16} height={ARM_H - 14}
                rx="2" fill={C.bg3} stroke={C.borderLt} strokeWidth="0.8" />
          <rect x={docsX + 6}  y={ARM_Y + 8} width={docsW - 16} height={ARM_H - 14}
                rx="2" fill={C.bg3} stroke={C.borderLt} strokeWidth="0.8" />
          <rect x={docsX + 2}  y={ARM_Y + 12} width={docsW - 16} height={ARM_H - 18}
                rx="2" fill={C.bg2} stroke={C.borderLt} strokeWidth="0.8" />
          <text x={docsX + (docsW - 14) / 2 + 2} y={ARM_Y + 32}
                textAnchor="middle"
                fontFamily={mono} fontSize="9" fill={C.text}>
            knowledge
          </text>
          <text x={docsX + (docsW - 14) / 2 + 2} y={ARM_Y + 44}
                textAnchor="middle"
                fontFamily={mono} fontSize="9" fill={C.text}>
            base
          </text>
        </g>

        <line x1={docsX + docsW + 2} y1={ARM_Y + ARM_H / 2}
              x2={chunkX - 4}        y2={ARM_Y + ARM_H / 2}
              stroke={C.muted2} strokeWidth="1.2"
              markerEnd="url(#rag-arrow-muted)" />

        <Box x={chunkX} y={ARM_Y} w={chunkW} h={ARM_H} />
        <text x={chunkX + chunkW / 2} y={ARM_Y + 22}
              textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}
              fontWeight="600">
          chunker
        </text>
        <text x={chunkX + chunkW / 2} y={ARM_Y + 40}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}>
          ~500-tok passages
        </text>

        <line x1={chunkX + chunkW + 2} y1={ARM_Y + ARM_H / 2}
              x2={embedCX - 4}         y2={ARM_Y + ARM_H / 2}
              stroke={C.muted2} strokeWidth="1.2"
              markerEnd="url(#rag-arrow-muted)" />

        <Box x={embedCX} y={ARM_Y} w={embedCW} h={ARM_H} />
        <text x={embedCX + embedCW / 2} y={ARM_Y + 22}
              textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}
              fontWeight="600">
          embedding model
        </text>
        <text x={embedCX + embedCW / 2} y={ARM_Y + 40}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}>
          encode each chunk
        </text>

        {/* Down arrow from offline embed → DB (straight) */}
        <line x1={eCcx} y1={ARM_Y + ARM_H + 2}
              x2={eCcx} y2={DB_Y - 4}
              stroke={C.muted2} strokeWidth="1.4"
              markerEnd="url(#rag-arrow-muted)" />
        <text x={eCcx + 8} y={ARM_Y + ARM_H + 30}
              fontFamily={mono} fontSize="9" fill={C.muted}
              fontStyle="italic">
          writes (chunk, vector)
        </text>
        <text x={eCcx + 8} y={ARM_Y + ARM_H + 42}
              fontFamily={mono} fontSize="9" fill={C.muted}
              fontStyle="italic">
          pairs
        </text>

        {/* ── ONLINE ARM (right) ── */}
        <Box x={qX} y={ARM_Y} w={qW} h={ARM_H} />
        <text x={qX + qW / 2} y={ARM_Y + 20}
              textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}
              fontWeight="600">
          user query
        </text>
        <text x={qX + qW / 2} y={ARM_Y + 36}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}
              fontStyle="italic">
          "What did our
        </text>
        <text x={qX + qW / 2} y={ARM_Y + 48}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted2}
              fontStyle="italic">
          Q3 sales look like?"
        </text>

        <line x1={qX + qW + 2}  y1={ARM_Y + ARM_H / 2}
              x2={embedQX - 4} y2={ARM_Y + ARM_H / 2}
              stroke={C.muted2} strokeWidth="1.2"
              markerEnd="url(#rag-arrow-muted)" />

        <Box x={embedQX} y={ARM_Y} w={embedQW} h={ARM_H} />
        <text x={embedQX + embedQW / 2} y={ARM_Y + 22}
              textAnchor="middle"
              fontFamily={mono} fontSize="10" fill={C.text}
              fontWeight="600">
          embedding model
        </text>
        <text x={embedQX + embedQW / 2} y={ARM_Y + 40}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}>
          encode query
        </text>

        {/* Diagonal arrow from online embed → top-right corner of DB (TEAL) */}
        <line x1={eQcx} y1={ARM_Y + ARM_H + 2}
              x2={DB_X + DB_W - 30} y2={DB_Y - 4}
              stroke={C.accent} strokeWidth="1.4"
              markerEnd="url(#rag-arrow-accent)" />
        <text x={eQcx - 80} y={ARM_Y + ARM_H + 30}
              fontFamily={mono} fontSize="9" fill={C.accent}
              fontStyle="italic">
          sends query embedding
        </text>
        <text x={eQcx - 80} y={ARM_Y + ARM_H + 42}
              fontFamily={mono} fontSize="9" fill={C.accent}
              fontStyle="italic">
          for similarity search
        </text>

        {/* ── Central Vector DB ── */}
        <Box x={DB_X} y={DB_Y} w={DB_W} h={DB_H}
             fill={C.accentDim} stroke={C.accent} sw={1.5} rx={6} />
        <text x={DB_X + DB_W / 2} y={DB_Y + 24}
              textAnchor="middle"
              fontFamily={mono} fontSize="13" fill={C.accent}
              fontWeight="600"
              letterSpacing="0.06em">
          VECTOR DATABASE
        </text>
        <text x={DB_X + DB_W / 2} y={DB_Y + 44}
              textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.text}>
          stores (chunk, vector) pairs
        </text>
        <text x={DB_X + DB_W / 2} y={DB_Y + 60}
              textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted2}>
          performs top-k nearest-neighbour search
        </text>
        <text x={DB_X + DB_W / 2} y={DB_Y + 78}
              textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.muted}>
          Pinecone · Chroma · Weaviate · Qdrant
        </text>

        {/* Arrow down from DB → top-k chunks (TEAL) */}
        <line x1={DB_X + DB_W / 2} y1={DB_Y + DB_H + 2}
              x2={DB_X + DB_W / 2} y2={TK_Y - 4}
              stroke={C.accent} strokeWidth="1.4"
              markerEnd="url(#rag-arrow-accent)" />
        <text x={DB_X + DB_W / 2 + 8} y={DB_Y + DB_H + 30}
              fontFamily={mono} fontSize="9" fill={C.accent}
              fontStyle="italic">
          top-k by cosine similarity
        </text>

        {/* Top-k chunks box */}
        <rect x={TK_X} y={TK_Y} width={TK_W} height={TK_H} rx="4"
              fill={C.bg3} stroke={C.accent}
              strokeWidth="0.9" strokeDasharray="3 3" />
        <text x={TK_X + TK_W / 2} y={TK_Y + 16}
              textAnchor="middle"
              fontFamily={mono} fontSize="9" fill={C.accent}
              letterSpacing="0.06em">
          RETRIEVED PASSAGES (k = 3–5)
        </text>
        <text x={TK_X + TK_W / 2} y={TK_Y + 34}
              textAnchor="middle"
              fontFamily={mono} fontSize="9.5" fill={C.muted2}>
          chunk #842 · #211 · #1063 · #57
        </text>

        {/* Arrow down to context+LM */}
        <line x1={TK_X + TK_W / 2} y1={TK_Y + TK_H + 2}
              x2={TK_X + TK_W / 2} y2={CTX_Y - 4}
              stroke={C.muted2} strokeWidth="1.2"
              markerEnd="url(#rag-arrow-muted)" />

        {/* Final row: context builder + LM → answer */}
        <Box x={CTX_X} y={CTX_Y} w={CTX_W} h={CTX_H} />
        <text x={CTX_X + CTX_W / 2} y={CTX_Y + 22}
              textAnchor="middle"
              fontFamily={mono} fontSize="10.5" fill={C.text}
              fontWeight="600">
          context builder + agent / LM
        </text>
        <text x={CTX_X + CTX_W / 2} y={CTX_Y + 40}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}>
          concatenate chunks + query → augmented prompt
        </text>
        <text x={CTX_X + CTX_W / 2} y={CTX_Y + 52}
              textAnchor="middle"
              fontFamily={mono} fontSize="8.5" fill={C.muted}>
          → grounded generation
        </text>

        <line x1={CTX_X + CTX_W + 2} y1={CTX_Y + CTX_H / 2}
              x2={ANS_X - 4}         y2={CTX_Y + CTX_H / 2}
              stroke={C.muted2} strokeWidth="1.2"
              markerEnd="url(#rag-arrow-muted)" />

        <Box x={ANS_X} y={CTX_Y} w={ANS_W} h={CTX_H} />
        <text x={ANS_X + ANS_W / 2} y={CTX_Y + CTX_H / 2 + 4}
              textAnchor="middle"
              fontFamily={mono} fontSize="11" fill={C.text}
              fontWeight="600">
          final answer
        </text>

        {/* Bottom annotations */}
        <text x="320" y={totalH - 50} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted}
              fontStyle="italic">
          design knobs: chunk size · embedding model · top-k · reranking · query rewriting
        </text>
        <text x="320" y={totalH - 28} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted}
              fontStyle="italic">
          2026 trend: 200K–2M-token context windows reduce reliance on RAG for
        </text>
        <text x="320" y={totalH - 14} textAnchor="middle"
              fontFamily={sans} fontSize="10" fill={C.muted}
              fontStyle="italic">
          in-context document reasoning — but RAG remains essential for corpus-scale search.
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
        Two arms feed a single shared vector database: offline indexing writes (chunk, vector) pairs;
        the online query reads the top-k passages back out for the language model to ground its answer on.
      </figcaption>
    </figure>
  );
}
