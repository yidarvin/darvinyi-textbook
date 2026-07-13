import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  green:     '#34d399',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  muted:     '#555555',
  textMid:   '#888888',
  text:      '#e8eaed',
};
const mono  = "'JetBrains Mono', monospace";
const inter = "'Inter', sans-serif";
const serif = "'Crimson Pro', serif";

const DESCRIPTIONS = {
  'bidir-attn': {
    name: 'Bidirectional Attention',
    text: "Every token can attend to every other token in the input — past and future. This gives maximum context for classification and understanding tasks, but prevents autoregressive generation.",
  },
  'causal-attn': {
    name: 'Causal Attention',
    text: "Each token can only attend to itself and preceding tokens. The upper triangle of the attention matrix is masked to −∞ before softmax. This constraint enables autoregressive generation: the model produces one token at a time without seeing the future.",
  },
  'cross-attn': {
    name: 'Cross-Attention',
    text: "The decoder's Q vectors come from the decoder, but the K and V vectors come from the encoder output. This is how the decoder accesses the full context of the input sequence while still generating autoregressively.",
  },
  'input-emb': {
    name: 'Input Embeddings',
    text: "Token embeddings plus positional encodings (sinusoidal in the original T5, RoPE in most modern models). The only difference between input and target embeddings is which sequence they represent.",
  },
  'target-emb': {
    name: 'Target Embeddings',
    text: "Token embeddings plus positional encodings (sinusoidal in the original T5, RoPE in most modern models). The only difference between input and target embeddings is which sequence they represent.",
  },
  'ffn': {
    name: 'Feed-Forward Network',
    text: "A position-wise feed-forward network applied identically to each token's representation. Typically 4× the model dimension in the hidden layer. Thought to store factual associations during pretraining.",
  },
  'pooled': {
    name: 'Pooled Output / CLS',
    text: "The [CLS] token's final representation is used for classification tasks. BERT adds a learned linear layer and softmax on top. For retrieval, the full sequence embeddings are averaged.",
  },
  'logits': {
    name: 'Output Logits',
    text: "A linear projection from the model dimension to the vocabulary size (~32K–128K tokens). Softmax gives a probability distribution over the next token.",
  },
};

// ── SVG shared defs (unique prefix to avoid ID collision across SVGs) ──────────
function SvgDefs({ p }) {
  return (
    <defs>
      <filter id={`gl-${p}`}>
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <marker id={`ag-${p}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L0,7 L7,3.5 z" fill={C.borderLt}/>
      </marker>
      <marker id={`ap-${p}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L0,7 L7,3.5 z" fill={C.purple}/>
      </marker>
    </defs>
  );
}

// ── Single clickable block ─────────────────────────────────────────────────────
function Block({ p, x, y, w, h, fill, stroke, label, annotation, uid, selectedUid, onSelect }) {
  const isSel = selectedUid === uid;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g onClick={() => onSelect(uid)} style={{ cursor: 'pointer' }}>
      <rect x={x} y={y} width={w} height={h} rx={4}
        fill={fill}
        stroke={isSel ? (stroke === C.borderLt ? C.accent : stroke) : stroke}
        strokeWidth={isSel ? 2.5 : 1}
        filter={isSel ? `url(#gl-${p})` : undefined}
      />
      {annotation ? (
        <text textAnchor="middle" fontFamily={mono}>
          <tspan x={cx} y={cy - 7} fontSize="11" fill={stroke}>{label}</tspan>
          <tspan x={cx} y={cy + 8} fontSize="9" fill={stroke} opacity={0.6}>{annotation}</tspan>
        </text>
      ) : (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontFamily={mono} fontSize="11" fill={stroke}>{label}</text>
      )}
    </g>
  );
}

// ── Arrow connector ────────────────────────────────────────────────────────────
function Arrow({ p, x, y1, y2 }) {
  return (
    <line x1={x} y1={y1 + 2} x2={x} y2={y2 - 6}
      stroke={C.borderLt} strokeWidth={1.5}
      markerEnd={`url(#ag-${p})`}/>
  );
}

// ── Encoder-Only diagram — viewBox 200×322 ────────────────────────────────────
function EncoderDiagram({ selected, onSelect }) {
  const p = 'enc'; const X = 20; const W = 160;
  const blocks = [
    { uid:'enc-emb',  descId:'input-emb',  y:20,  h:36, fill:C.bg4,                   stroke:C.borderLt, label:'Input Embeddings' },
    { uid:'enc-ba1',  descId:'bidir-attn', y:70,  h:44, fill:C.accentDim,             stroke:C.accent,   label:'Bidirectional Attn 1', annotation:'↔ full context' },
    { uid:'enc-ffn1', descId:'ffn',        y:128, h:32, fill:C.bg3,                   stroke:C.borderLt, label:'FFN 1' },
    { uid:'enc-ba2',  descId:'bidir-attn', y:174, h:44, fill:C.accentDim,             stroke:C.accent,   label:'Bidirectional Attn 2', annotation:'↔ full context' },
    { uid:'enc-ffn2', descId:'ffn',        y:232, h:32, fill:C.bg3,                   stroke:C.borderLt, label:'FFN 2' },
    { uid:'enc-pool', descId:'pooled',     y:278, h:36, fill:'rgba(52,211,153,0.15)', stroke:C.green,    label:'Pooled Output / CLS' },
  ];
  return (
    <svg viewBox="0 0 200 326" width="100%" style={{ display:'block' }}>
      <SvgDefs p={p}/>
      {blocks.map((b, i) => (
        <g key={b.uid}>
          <Block p={p} x={X} y={b.y} w={W} h={b.h}
            fill={b.fill} stroke={b.stroke} label={b.label} annotation={b.annotation}
            uid={b.uid} selectedUid={selected?.uid}
            onSelect={() => onSelect({ uid:b.uid, descId:b.descId })}/>
          {i < blocks.length - 1 && (
            <Arrow p={p} x={X + W/2} y1={b.y + b.h} y2={blocks[i+1].y}/>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Decoder-Only diagram — viewBox 200×322 ────────────────────────────────────
function DecoderDiagram({ selected, onSelect }) {
  const p = 'dec'; const X = 20; const W = 160;
  const blocks = [
    { uid:'dec-emb',  descId:'input-emb',   y:20,  h:36, fill:C.bg4,                        stroke:C.borderLt, label:'Input Embeddings' },
    { uid:'dec-ca1',  descId:'causal-attn', y:70,  h:44, fill:'rgba(251,146,60,0.15)',       stroke:C.orange,   label:'Causal Attn 1', annotation:'→ past only' },
    { uid:'dec-ffn1', descId:'ffn',         y:128, h:32, fill:C.bg3,                         stroke:C.borderLt, label:'FFN 1' },
    { uid:'dec-ca2',  descId:'causal-attn', y:174, h:44, fill:'rgba(251,146,60,0.15)',       stroke:C.orange,   label:'Causal Attn 2', annotation:'→ past only' },
    { uid:'dec-ffn2', descId:'ffn',         y:232, h:32, fill:C.bg3,                         stroke:C.borderLt, label:'FFN 2' },
    { uid:'dec-log',  descId:'logits',      y:278, h:36, fill:'rgba(251,146,60,0.15)',       stroke:C.orange,   label:'Next Token Logits' },
  ];
  return (
    <svg viewBox="0 0 200 326" width="100%" style={{ display:'block' }}>
      <SvgDefs p={p}/>
      {blocks.map((b, i) => (
        <g key={b.uid}>
          <Block p={p} x={X} y={b.y} w={W} h={b.h}
            fill={b.fill} stroke={b.stroke} label={b.label} annotation={b.annotation}
            uid={b.uid} selectedUid={selected?.uid}
            onSelect={() => onSelect({ uid:b.uid, descId:b.descId })}/>
          {i < blocks.length - 1 && (
            <Arrow p={p} x={X + W/2} y1={b.y + b.h} y2={blocks[i+1].y}/>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Encoder-Decoder diagram — viewBox 220×444 ─────────────────────────────────
function EncDecDiagram({ selected, onSelect }) {
  const p = 'ed'; const X = 15; const W = 175;
  const encBlocks = [
    { uid:'ed-enc-emb', descId:'input-emb',  y:20,  h:36, fill:C.bg4,                  stroke:C.borderLt, label:'Input Embeddings' },
    { uid:'ed-enc-ba',  descId:'bidir-attn', y:70,  h:44, fill:C.accentDim,            stroke:C.accent,   label:'Bidirectional Attn', annotation:'↔ full context' },
    { uid:'ed-enc-ffn', descId:'ffn',        y:128, h:32, fill:C.bg3,                  stroke:C.borderLt, label:'FFN' },
  ];
  const decBlocks = [
    { uid:'ed-dec-emb',   descId:'target-emb',  y:190, h:36, fill:C.bg4,                        stroke:C.borderLt, label:'Target Embeddings' },
    { uid:'ed-dec-ca',    descId:'causal-attn', y:240, h:44, fill:'rgba(251,146,60,0.15)',       stroke:C.orange,   label:'Causal Attn', annotation:'→ past only' },
    { uid:'ed-dec-xattn', descId:'cross-attn',  y:298, h:44, fill:'rgba(167,139,250,0.15)',      stroke:C.purple,   label:'Cross-Attention', annotation:'Q←dec  K,V←enc' },
    { uid:'ed-dec-ffn',   descId:'ffn',         y:356, h:32, fill:C.bg3,                         stroke:C.borderLt, label:'FFN' },
    { uid:'ed-dec-log',   descId:'logits',      y:402, h:36, fill:'rgba(251,146,60,0.15)',       stroke:C.orange,   label:'Output Logits' },
  ];

  const encLastBottom = 128 + 32; // 160
  const sepY = 174;
  // cross-attention curve: right edge of encoder → right edge of cross-attn block
  // start: (X+W, encLastBottom-8)=(190, 152), end: (X+W, 298+22)=(190, 320)
  // control points bow right to x=210, VW=220 → safe
  const csx = X + W; const csy = encLastBottom - 8;
  const cex = X + W; const cey = 298 + 22;
  const cbx = csx + 20;

  return (
    <svg viewBox="0 0 220 450" width="100%" style={{ display:'block' }}>
      <SvgDefs p={p}/>
      {encBlocks.map((b, i) => (
        <g key={b.uid}>
          <Block p={p} x={X} y={b.y} w={W} h={b.h}
            fill={b.fill} stroke={b.stroke} label={b.label} annotation={b.annotation}
            uid={b.uid} selectedUid={selected?.uid}
            onSelect={() => onSelect({ uid:b.uid, descId:b.descId })}/>
          {i < encBlocks.length - 1 && (
            <Arrow p={p} x={X + W/2} y1={b.y + b.h} y2={encBlocks[i+1].y}/>
          )}
        </g>
      ))}

      {/* Encoder output separator */}
      <line x1={X} y1={sepY} x2={X+W} y2={sepY}
        stroke={C.borderLt} strokeWidth={1} strokeDasharray="5,3"/>
      <text x={X + W/2} y={sepY - 5} textAnchor="middle"
        fontFamily={inter} fontSize="9" fill={C.muted}>encoder output</text>

      {/* Arrow enc → dec */}
      <Arrow p={p} x={X + W/2} y1={encLastBottom} y2={decBlocks[0].y}/>

      {/* Cross-attention dashed curve (encoder K,V → cross-attn block) */}
      <path d={`M ${csx} ${csy} C ${cbx} ${csy+50}, ${cbx} ${cey-50}, ${cex} ${cey}`}
        fill="none" stroke={C.purple} strokeWidth={1.5} strokeDasharray="5,3"
        markerEnd={`url(#ap-${p})`}/>
      <text x={cbx + 2} y={(csy + cey) / 2}
        textAnchor="start" fontFamily={mono} fontSize="9" fill={C.purple}>K, V</text>

      {decBlocks.map((b, i) => (
        <g key={b.uid}>
          <Block p={p} x={X} y={b.y} w={W} h={b.h}
            fill={b.fill} stroke={b.stroke} label={b.label} annotation={b.annotation}
            uid={b.uid} selectedUid={selected?.uid}
            onSelect={() => onSelect({ uid:b.uid, descId:b.descId })}/>
          {i < decBlocks.length - 1 && (
            <Arrow p={p} x={X + W/2} y1={b.y + b.h} y2={decBlocks[i+1].y}/>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Attention mask heatmaps ───────────────────────────────────────────────────
const TOKENS = ['The', 'cat', 'sat'];
const CELL = 38; const GAP = 3; const LW = 30; const TH = 26; const RO = 20;

const MASKS = {
  encoder: [[1,1,1],[1,1,1],[1,1,1]],
  decoder: [[1,0,0],[1,1,0],[1,1,1]],
  encdec:  [[1,1,1],[1,1,1],[1,1,1]],
};
const HM_FILLS = { encoder: C.accent, decoder: C.orange, encdec: C.purple };

// Width of one heatmap group in viewBox coords
const HM_W = LW + TOKENS.length * (CELL + GAP) - GAP; // 30+3*41-3=30+120=150
const HM_GAP = 28;
const HM_TOTAL_W = 3 * HM_W + 2 * HM_GAP; // 3*150+56=506

function HeatmapGroup({ paradigm, title, subtitle, x }) {
  const mask = MASKS[paradigm];
  const fill = HM_FILLS[paradigm];
  return (
    <g transform={`translate(${x}, 0)`}>
      <text x={LW + (HM_W - LW) / 2} y={14} textAnchor="middle"
        fontFamily={inter} fontSize="11" fill={C.textMid}>{title}</text>
      {subtitle && (
        <text x={LW + (HM_W - LW) / 2} y={26} textAnchor="middle"
          fontFamily={inter} fontSize="9" fill={fill} opacity={0.8}>{subtitle}</text>
      )}
      {/* Col labels (rotated) */}
      {TOKENS.map((t, ci) => (
        <text key={ci}
          x={LW + ci * (CELL + GAP) + CELL / 2}
          y={TH + RO - 4}
          textAnchor="start" fontFamily={inter} fontSize="10" fill={C.textMid}
          transform={`rotate(-45, ${LW + ci * (CELL + GAP) + CELL / 2}, ${TH + RO - 4})`}
        >{t}</text>
      ))}
      {/* Row labels + cells */}
      {TOKENS.map((t, ri) => (
        <g key={ri}>
          <text x={LW - 5} y={TH + RO + ri * (CELL + GAP) + CELL / 2}
            textAnchor="end" dominantBaseline="middle"
            fontFamily={inter} fontSize="10" fill={C.textMid}>{t}</text>
          {TOKENS.map((_, ci) => (
            <rect key={ci}
              x={LW + ci * (CELL + GAP)}
              y={TH + RO + ri * (CELL + GAP)}
              width={CELL} height={CELL} rx={3}
              fill={mask[ri][ci] ? fill : C.bg4}
              opacity={mask[ri][ci] ? 0.72 : 1}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

// ── Use-case pills ─────────────────────────────────────────────────────────────
function Pills({ items }) {
  return (
    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', justifyContent:'center', marginTop:'10px' }}>
      {items.map(item => (
        <span key={item} style={{
          fontFamily: inter, fontSize:'10px',
          background: C.bg4, border:`1px solid ${C.border}`,
          borderRadius:'20px', padding:'3px 10px', color: C.textMid,
        }}>{item}</span>
      ))}
    </div>
  );
}

// ── Stats strip section ────────────────────────────────────────────────────────
function StatSection({ title, rows }) {
  return (
    <div style={{ flex:1, minWidth:0, padding:'12px 14px' }}>
      <div style={{ fontFamily:mono, fontSize:'9px', color:C.accent, textTransform:'uppercase',
                    letterSpacing:'0.08em', marginBottom:'9px' }}>{title}</div>
      {rows.map(([label, val]) => (
        <div key={label} style={{ display:'flex', justifyContent:'space-between', gap:'6px', marginBottom:'5px' }}>
          <span style={{ fontFamily:inter, fontSize:'10px', color:C.muted, flexShrink:0 }}>{label}</span>
          <span style={{ fontFamily:mono, fontSize:'10px', color:C.textMid, textAlign:'right' }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────────
// Layout: full-width 3-column diagrams, heatmaps below, stats strip below that.
// 616px ÷ 3 columns = ~200px each — ample for labeled content.
export default function ThreeParadigms() {
  const [selected, setSelected] = useState(null);
  const [showMasks, setShowMasks] = useState(true);

  const detail = selected ? DESCRIPTIONS[selected.descId] : null;

  // heatmap SVG height: TH(26) + RO(20) + 3*(38+3)-3(120) + 10 = 176
  const hmSvgH = TH + RO + (TOKENS.length * (CELL + GAP) - GAP) + 10;

  return (
    <WidgetCard title="Three Paradigms — encoder, decoder, encoder-decoder" number="9.1">

      {/* ── Diagram row ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>

        {/* Encoder-Only */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ textAlign:'center', marginBottom:'8px' }}>
            <div style={{ fontFamily:serif, fontSize:'16px', color:C.text }}>Encoder-Only</div>
            <div style={{ fontFamily:inter, fontSize:'11px', color:C.muted, marginTop:'2px' }}>BERT, RoBERTa, DeBERTa</div>
          </div>
          <EncoderDiagram selected={selected} onSelect={setSelected}/>
          <Pills items={['Classification', 'Named Entity Recog.', 'Similarity']}/>
        </div>

        {/* Decoder-Only */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ textAlign:'center', marginBottom:'8px' }}>
            <div style={{ fontFamily:serif, fontSize:'16px', color:C.text }}>Decoder-Only</div>
            <div style={{ fontFamily:inter, fontSize:'11px', color:C.muted, marginTop:'2px' }}>GPT-4, LLaMA, Mistral</div>
          </div>
          <DecoderDiagram selected={selected} onSelect={setSelected}/>
          <Pills items={['Text Generation', 'Code Completion', 'In-Context Learning']}/>
        </div>

        {/* Encoder-Decoder */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ textAlign:'center', marginBottom:'8px' }}>
            <div style={{ fontFamily:serif, fontSize:'16px', color:C.text }}>Encoder-Decoder</div>
            <div style={{ fontFamily:inter, fontSize:'11px', color:C.muted, marginTop:'2px' }}>T5, BART, Flan-T5</div>
          </div>
          <EncDecDiagram selected={selected} onSelect={setSelected}/>
          <Pills items={['Translation', 'Summarization', 'Text-to-Text']}/>
        </div>
      </div>

      {/* ── Heatmap section ──────────────────────────────────────────────── */}
      <div style={{ marginTop:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
          <span style={{ fontFamily:mono, fontSize:'9.5px', color:C.muted,
                         textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Attention Masks
          </span>
          <button onClick={() => setShowMasks(v => !v)} style={{
            fontFamily:inter, fontSize:'10px',
            background: showMasks ? C.accentDim : C.bg4,
            border:`1px solid ${showMasks ? C.accent : C.border}`,
            color: showMasks ? C.accent : C.muted,
            borderRadius:'3px', padding:'2px 10px', cursor:'pointer',
          }}>
            {showMasks ? 'hide' : 'show'}
          </button>
        </div>

        {showMasks && (
          <svg viewBox={`0 0 ${HM_TOTAL_W} ${hmSvgH}`} width="100%" style={{ display:'block' }}>
            <HeatmapGroup paradigm="encoder" title="Encoder-Only" x={0}/>
            <HeatmapGroup paradigm="decoder" title="Decoder-Only" x={HM_W + HM_GAP}/>
            <HeatmapGroup paradigm="encdec"  title="Enc-Dec (cross-attn)"
              subtitle="Decoder → Encoder" x={2 * (HM_W + HM_GAP)}/>
          </svg>
        )}
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <div style={{
        display:'flex', marginTop:'16px',
        background:C.bg3, border:`1px solid ${C.border}`, borderRadius:'8px',
        overflow:'hidden',
      }}>
        <StatSection title="Paradigms" rows={[
          ['Enc-only', 'BERT family'],
          ['Dec-only', 'GPT family'],
          ['Enc-dec',  'T5 family'],
        ]}/>
        <div style={{ width:'1px', background:C.border, flexShrink:0 }}/>
        <StatSection title="Attention type" rows={[
          ['Bidir.',  'past + future'],
          ['Causal',  'past only'],
          ['Cross',   'dec → enc'],
        ]}/>
        <div style={{ width:'1px', background:C.border, flexShrink:0 }}/>
        <StatSection title="Training objective" rows={[
          ['Enc-only', 'Masked LM'],
          ['Dec-only', 'Causal LM'],
          ['Enc-dec',  'Text-to-text'],
        ]}/>
        <div style={{ width:'1px', background:C.border, flexShrink:0 }}/>
        <div style={{ flex:1.4, minWidth:0, padding:'12px 14px' }}>
          <div style={{ fontFamily:mono, fontSize:'9px', color:C.accent, textTransform:'uppercase',
                        letterSpacing:'0.08em', marginBottom:'9px' }}>Why decoder won</div>
          <p style={{ fontFamily:inter, fontSize:'10px', color:C.muted, fontStyle:'italic',
                      lineHeight:1.65, margin:0 }}>
            Decoder-only models (GPT family) dominate frontier LLMs. In-context learning at scale
            proved more general than task-specific fine-tuning of BERT-style models.
          </p>
        </div>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────────── */}
      {detail ? (
        <div key={selected.uid} style={{
          marginTop:'0', borderTop:`1px solid ${C.border}`,
          padding:'14px 20px', background:C.bg3,
          animation:'fadeIn 0.18s ease',
        }}>
          <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
          <div style={{ fontFamily:inter, fontSize:'13px', fontWeight:600,
                        color:C.text, marginBottom:'5px' }}>{detail.name}</div>
          <div style={{ fontFamily:inter, fontSize:'12px', color:'#b8c4cc', lineHeight:1.65 }}>
            {detail.text}
          </div>
        </div>
      ) : (
        <div style={{ marginTop:'0', borderTop:`1px solid ${C.border}`,
                      padding:'12px 20px', background:C.bg3 }}>
          <span style={{ fontFamily:inter, fontSize:'11px', color:C.muted, fontStyle:'italic' }}>
            Click any block to learn more about that component.
          </span>
        </div>
      )}
    </WidgetCard>
  );
}
