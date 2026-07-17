import { useState, useRef, useEffect } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Data ─────────────────────────────────────────────────────────────────────

// Sourced to paperswithcode.com/sota/image-classification-on-imagenet single-crop top-1 unless noted;
// see individual comments for divergences. Every value below is a single-model, single-crop (or
// single-view) ImageNet-1K validation top-1 accuracy — never a top-5, ensemble, or multi-crop number.
const IMAGENET_DATA = [
  // 57.1%: BVLC/Caffe "bvlc_alexnet" model zoo readme (official replication of Krizhevsky et al.
  // 2012), single center-crop top-1. The original NeurIPS paper's own Table 2 reports only top-5
  // for ILSVRC-2012, so this is the standard citable single-crop figure.
  { model: 'AlexNet',         year: 2012, score: 57.1, innovation: 'First deep CNN to win ImageNet. ReLU + dropout + GPU training at scale.',        callout: true, calloutDx: 20,  calloutDy: -30, calloutText: 'First deep CNN' },
  // 70.6%: Zagoruyko (2016) single central-crop re-evaluation of the official VGG-16 weights, as
  // used in Canziani et al. 2016 (arXiv:1605.07678) — lower than the 74.4% the VGG paper itself
  // reports in Table 3, which uses "dense" (fully-convolutional, whole-image) evaluation, not a crop.
  { model: 'VGG-16',          year: 2014, score: 70.6, innovation: 'Depth with uniform 3×3 kernels. Showed deeper = better for vision.' },
  // 68.7%: BVLC/Caffe "bvlc_googlenet" model zoo readme (official replication, credited to Christian
  // Szegedy), single center-crop top-1. Szegedy et al. 2014 itself reports only top-5 (10.07% single
  // model/single crop, Table 3) — 74.8% in an earlier version of this chart conflated a different
  // metric/protocol.
  { model: 'GoogLeNet',       year: 2014, score: 68.7, innovation: 'Inception modules: parallel multi-scale convolutions.' },
  // 77.8%: Facebook fb.resnet.torch official repo, "Single-crop (224x224) validation error rate"
  // table, top-1 error 22.16%. He et al. 2015 itself reports 78.6% under 10-crop testing (Table 3)
  // and 80.6% under dense/multi-scale evaluation (Table 4) — neither is a single crop.
  { model: 'ResNet-152',      year: 2016, score: 77.8, innovation: 'Skip connections. First time >100-layer networks reliably trained.',               callout: true, calloutDx: 10,  calloutDy: -30, calloutText: 'Skip connections' },
  // 77.4%: Huang et al. 2017 (CVPR), Table 3, explicitly labeled single-crop, top-1 error 22.58%.
  { model: 'DenseNet-201',    year: 2017, score: 77.4, innovation: 'Dense connections: every layer connected to every subsequent layer.' },
  // 84.3%: Tan & Le 2019 (ICML), paper's own headline single-model figure.
  { model: 'EfficientNet-B7', year: 2019, score: 84.3, innovation: 'Compound scaling: jointly scale depth, width, and resolution.' },
  // 90.45%: Zhai et al. 2022 (CVPR), "Scaling Vision Transformers," single-model figure.
  { model: 'ViT-G/14',        year: 2022, score: 90.5, innovation: 'Vision Transformer at scale. Pure attention, no convolutions.',                   callout: true, calloutDx: -10, calloutDy: -30, calloutText: 'Pure attention' },
  // 90.88%: Dai et al. 2021 (NeurIPS), CoAtNet paper, with JFT-3B pretraining, single-model figure.
  { model: 'CoAtNet-7',       year: 2022, score: 90.9, innovation: 'Hybrid: convolutional early layers + attention later layers.' },
];

const GLUE_DATA = [
  { model: 'ELMo',      year: 2018, score: 71.0, innovation: 'Contextual embeddings from bidirectional LSTMs. First contextualized word representations.' },
  { model: 'BERT-large', year: 2018, score: 80.5, innovation: 'Bidirectional transformer pretraining on masked language modeling. Paradigm shift.',    callout: true, calloutDx: 0,   calloutDy: -30, calloutText: 'Masked LM' },
  { model: 'XLNet',     year: 2019, score: 88.4, innovation: 'Autoregressive pretraining with permutation-based training objective.' },
  { model: 'RoBERTa',   year: 2019, score: 88.5, innovation: 'BERT trained better: more data, longer training, dynamic masking.' },
  { model: 'ALBERT',    year: 2020, score: 89.4, innovation: 'Parameter-efficient BERT: factorized embeddings + cross-layer weight sharing.' },
  { model: 'DeBERTa',   year: 2021, score: 91.9, innovation: 'Disentangled attention: position and content encoded separately.' },
  { model: 'ST-MoE',    year: 2022, score: 93.2, innovation: 'Mixture-of-experts scaling combined with improved fine-tuning.' },
];

const HUMANEVAL_DATA = [
  { model: 'Codex-12B',     year: 2021, score: 28.8, innovation: 'First model specifically trained on code. Fine-tuned GPT on GitHub.',              callout: true, calloutDx: 20, calloutDy: -30, calloutText: 'Code-specific training' },
  { model: 'InstructGPT',   year: 2022, score: 37.0, innovation: 'RLHF (reinforcement learning from human feedback) fine-tuning for instruction following improved code generation.' },
  { model: 'CodeT5+',       year: 2022, score: 42.7, innovation: 'Encoder-decoder model pretrained on code-text pairs.' },
  { model: 'GPT-4',         year: 2023, score: 67.0, innovation: 'Scale + RLHF + careful data curation at unprecedented scale.',                     callout: true, calloutDx: 0,  calloutDy: -30, calloutText: 'Scale + RLHF leap' },
  { model: 'Claude-3 Opus', year: 2024, score: 84.9, innovation: 'Constitutional AI (self-critique against a written set of principles, rather than RLHF) combined with scaling.' },
  { model: 'GPT-4o',        year: 2024, score: 90.2, innovation: 'Multimodal training + improved code reasoning. No rigorous human pass@1 baseline exists for HumanEval, so "surpassing humans" isn’t a claim this benchmark alone can support.' },
];

// Human-baseline notes:
// - ImageNet: the only published human figure is Russakovsky et al. (2015)'s
//   5.1% TOP-5 error (~94.9% top-5 accuracy) on a 1500-image subset — a
//   different metric than the top-1 scores plotted here, so it is shown as a
//   labeled, non-comparable reference rather than a same-axis threshold.
// - HumanEval: no rigorous human pass@1 baseline has ever been published for
//   this benchmark, so no human line is drawn at all.
const BENCHMARKS = {
  ImageNet:  {
    data: IMAGENET_DATA, human: 94.9, humanComparable: false,
    humanLabel: 'Human reference — see note ↓',
    humanNote: 'Human reference: the published ≈94.9% result is ImageNet top-5 accuracy, while this chart plots top-1. The line is a non-comparable reference, not a top-1 threshold.',
    yearMin: 2012, yearMax: 2023, label: 'Top-1 Accuracy (%)',
  },
  GLUE: {
    data: GLUE_DATA, human: 87.1, humanComparable: true,
    humanLabel: 'Human ~87.1%',
    yearMin: 2018, yearMax: 2023, label: 'GLUE Score (0–100)',
  },
  HumanEval: {
    data: HUMANEVAL_DATA, human: null, humanComparable: false,
    humanLabel: 'Human: see note ↓',
    humanNote: 'No rigorous human pass@1 baseline is published for HumanEval, so this chart does not claim that a model surpasses humans.',
    yearMin: 2021, yearMax: 2025, label: 'Pass@1 (%)',
  },
};

// ── Colors + Layout ───────────────────────────────────────────────────────────

const C = {
  accent:  '#2dd4bf',
  red:     '#f87171',
  orange:  '#fb923c',
  green:   '#34d399',
  border:  '#242424',
  borderLt:'#2e2e2e',
  bg2:     '#111111',
  bg3:     '#161616',
  mid:     '#888888',
  muted:   '#555555',
  text:    '#e8eaed',
};

const L = { left: 50, right: 20, top: 20, bot: 36 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSaturationYear(data, bench) {
  if (!bench.humanComparable || bench.human == null) return null;
  for (const d of data) {
    if (d.score > bench.human) return d.year;
  }
  return null;
}

function getCoords(canvas, bench) {
  const { yearMin, yearMax } = BENCHMARKS[bench];
  const W      = canvas.clientWidth;
  const H      = canvas.clientHeight;
  const chartW = W - L.left - L.right;
  const chartH = H - L.top  - L.bot;
  return {
    W, H, chartW, chartH,
    toX:   yr => L.left + (yr - yearMin) / (yearMax - yearMin) * chartW,
    toY:   sc => L.top  + (1 - sc / 100) * chartH,
    axisY: L.top + chartH,
  };
}

// ── Canvas drawing (pure) ─────────────────────────────────────────────────────

function drawChart(canvas, { bench, hovIdx, selIdx, showHuman, showCallouts, showGuides, lineProgress }) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const { W, H, toX, toY, axisY } = getCoords(canvas, bench);
  if (!W || !H) return;

  const pw = Math.round(W * dpr);
  const ph = Math.round(H * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width  = pw;
    canvas.height = ph;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const { data, human, humanComparable, humanLabel, label } = BENCHMARKS[bench];

  // ── Metric label (top-left) ─────────────────────────────────────────────
  ctx.fillStyle    = C.muted;
  ctx.font         = "9px 'JetBrains Mono', monospace";
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, L.left, 4);

  // ── Y-axis grid + labels ────────────────────────────────────────────────
  [0, 20, 40, 60, 80, 100].forEach(sc => {
    const y = toY(sc);
    if (sc > 0) {
      ctx.beginPath();
      ctx.moveTo(L.left, y);
      ctx.lineTo(W - L.right, y);
      ctx.strokeStyle = C.border;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
    ctx.fillStyle    = C.muted;
    ctx.font         = "9px 'JetBrains Mono', monospace";
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(sc), L.left - 5, y);
  });

  // ── X-axis labels ───────────────────────────────────────────────────────
  const uniqueYears = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
  ctx.fillStyle    = C.muted;
  ctx.font         = "9px 'JetBrains Mono', monospace";
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  uniqueYears.forEach(yr => ctx.fillText(String(yr), toX(yr), axisY + 6));

  // ── Human baseline ──────────────────────────────────────────────────────
  if (showHuman && human != null) {
    const hy = toY(human);
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(L.left, hy);
    ctx.lineTo(W - L.right, hy);
    ctx.strokeStyle = humanComparable ? 'rgba(255,255,255,0.35)' : C.orange;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle    = humanComparable ? 'rgba(255,255,255,0.55)' : C.orange;
    ctx.font         = "9px 'JetBrains Mono', monospace";
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(humanLabel, W - L.right - 3, hy - 3);
  } else if (showHuman && human == null) {
    ctx.fillStyle    = C.orange;
    ctx.font         = "9px 'JetBrains Mono', monospace";
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(humanLabel, W - L.right - 3, 4);
  }

  // ── GLUE saturation marker ──────────────────────────────────────────────
  if (bench === 'GLUE' && showHuman) {
    const sx = toX(2019);
    const hy = toY(87.1);

    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(sx, L.top);
    ctx.lineTo(sx, axisY);
    ctx.strokeStyle = C.red;
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle    = C.red;
    ctx.font         = "9px 'JetBrains Mono', monospace";
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Surpasses human', sx, hy - 10);

    ctx.font         = '12px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', sx, hy);
  }

  // ── Vertical guides ─────────────────────────────────────────────────────
  if (showGuides) {
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = C.borderLt;
    ctx.lineWidth   = 0.8;
    data.forEach(d => {
      ctx.beginPath();
      ctx.moveTo(toX(d.year), toY(d.score));
      ctx.lineTo(toX(d.year), axisY);
      ctx.stroke();
    });
    ctx.restore();
  }

  // ── Progress line ───────────────────────────────────────────────────────
  if (data.length > 1 && lineProgress > 0) {
    const xStart = toX(data[0].year);
    const xEnd   = toX(data[data.length - 1].year);
    const xClip  = xStart + lineProgress * (xEnd - xStart) + 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, xClip, H);
    ctx.clip();

    ctx.beginPath();
    ctx.moveTo(toX(data[0].year), toY(data[0].score));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(toX(data[i].year), toY(data[i].score));
    }
    ctx.strokeStyle = C.accent;
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // ── Callout annotations ─────────────────────────────────────────────────
  if (showCallouts) {
    data.forEach(d => {
      if (!d.callout) return;
      const cx = toX(d.year);
      const cy = toY(d.score);
      const lx = cx + (d.calloutDx || 0);
      const ly = cy + (d.calloutDy || -28);

      ctx.beginPath();
      ctx.moveTo(lx, ly + 4);
      ctx.lineTo(cx, cy - 8);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth   = 1;
      ctx.stroke();

      ctx.fillStyle    = C.accent;
      ctx.font         = "9px 'Inter', sans-serif";
      const dx         = d.calloutDx || 0;
      ctx.textAlign    = dx > 0 ? 'left' : dx < 0 ? 'right' : 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(d.calloutText, lx, ly);
    });
  }

  // ── Model dots ──────────────────────────────────────────────────────────
  data.forEach((d, i) => {
    const x     = toX(d.year);
    const y     = toY(d.score);
    const isHov = hovIdx === i;
    const isSel = selIdx === i;
    const r     = isHov || isSel ? 9 : 6;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = C.accent;
    ctx.fill();
    ctx.strokeStyle = isSel ? C.accent : 'white';
    ctx.lineWidth   = isSel ? 3 : 1.5;
    ctx.stroke();
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ label, on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        fontFamily:   "'JetBrains Mono', monospace",
        fontSize:     '10px',
        padding:      '3px 10px',
        borderRadius: '4px',
        border:       '1px solid',
        borderColor:  on ? C.accent   : C.borderLt,
        background:   on ? '#0b2422'  : 'transparent',
        color:        on ? C.accent   : C.muted,
        cursor:       'pointer',
        lineHeight:   1.4,
      }}
    >
      {label}
    </button>
  );
}

function StripCell({ label, main, sub, mainColor }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily:    "'JetBrains Mono', monospace",
        fontSize:      '8px',
        color:         C.muted,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom:  '3px',
      }}>{label}</div>
      <div style={{
        fontFamily:  "'JetBrains Mono', monospace",
        fontSize:    sub ? '11px' : '12px',
        color:       mainColor || C.mid,
        lineHeight:  1.2,
        whiteSpace:  'nowrap',
        overflow:    'hidden',
        textOverflow:'ellipsis',
      }}>{main}</div>
      {sub && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   '10px',
          color:      C.accent,
          marginTop:  '1px',
        }}>{sub}</div>
      )}
    </div>
  );
}

function VSep() {
  return <div data-mobile-divider style={{ width: 1, background: C.border, alignSelf: 'stretch', flexShrink: 0 }} />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BenchmarkLeaderboard({ tryThis }) {
  const [displayBenchmark, setDisplayBenchmark] = useState('ImageNet');
  const [hovIdx,           setHovIdx]           = useState(null);
  const [selIdx,           setSelIdx]           = useState(null);
  const [showHuman,        setShowHuman]        = useState(true);
  const [showCallouts,     setShowCallouts]     = useState(true);
  const [showGuides,       setShowGuides]       = useState(true);
  const [lineProgress,     setLineProgress]     = useState(1);
  const [chartOpacity,     setChartOpacity]     = useState(1);
  const [resizeCount,      setResizeCount]      = useState(0);

  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  // Redraw on any relevant state change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawChart(canvas, {
      bench: displayBenchmark, hovIdx, selIdx,
      showHuman, showCallouts, showGuides, lineProgress,
    });
  }, [displayBenchmark, hovIdx, selIdx, showHuman, showCallouts, showGuides, lineProgress, resizeCount]);

  // Resize → redraw
  useEffect(() => {
    const h = () => setResizeCount(c => c + 1);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // ── Benchmark switch with fade-out / draw-in animation ───────────────────
  function switchBenchmark(newBench) {
    if (newBench === displayBenchmark) return;
    cancelAnimationFrame(animRef.current);

    let phase      = 'out';
    let phaseStart = null;
    const FADE     = 200;
    const DRAW     = 400;

    function step(now) {
      if (!phaseStart) phaseStart = now;
      const e = now - phaseStart;

      if (phase === 'out') {
        const t = Math.min(1, e / FADE);
        setChartOpacity(1 - t);
        if (t >= 1) {
          phase      = 'draw';
          phaseStart = now;
          setDisplayBenchmark(newBench);
          setSelIdx(null);
          setHovIdx(null);
          setLineProgress(0);
          setChartOpacity(0);
        }
      } else {
        const t = Math.min(1, e / DRAW);
        setLineProgress(t);
        setChartOpacity(t);
        if (t >= 1) return;
      }

      animRef.current = requestAnimationFrame(step);
    }

    animRef.current = requestAnimationFrame(step);
  }

  // ── Mouse handlers ───────────────────────────────────────────────────────
  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;

    const { data }     = BENCHMARKS[displayBenchmark];
    const { toX, toY } = getCoords(canvas, displayBenchmark);

    let nearIdx  = null;
    let nearDist = 12;
    data.forEach((d, i) => {
      const dx   = mx - toX(d.year);
      const dy   = my - toY(d.score);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearDist) { nearDist = dist; nearIdx = i; }
    });

    setHovIdx(nearIdx);
  }

  function handleMouseLeave() { setHovIdx(null); }

  function handleClick() {
    if (hovIdx === null) return;
    setSelIdx(prev => prev === hovIdx ? null : hovIdx);
  }

  // ── Derived stats ────────────────────────────────────────────────────────
  const bench    = BENCHMARKS[displayBenchmark];
  const data     = bench.data;
  const first    = data[0];
  const latest   = data[data.length - 1];
  const delta    = (latest.score - first.score).toFixed(1);
  const yearSpan = latest.year - first.year;
  const avgPerYear  = yearSpan > 0 ? (parseFloat(delta) / yearSpan).toFixed(1) : '—';
  const satYear  = getSaturationYear(data, bench);
  const hasComparableHuman = bench.humanComparable && bench.human != null;
  const gapVal   = hasComparableHuman ? latest.score - bench.human : null;
  const gapStr   = hasComparableHuman ? (gapVal >= 0 ? '+' : '') + gapVal.toFixed(1) + '%' : '—';
  const selectedModel = selIdx !== null ? data[selIdx] : null;

  // ── Tooltip position (CSS pixels within canvas container) ────────────────
  const ttIdx   = selIdx !== null ? selIdx : hovIdx;
  const ttModel = ttIdx !== null ? data[ttIdx] : null;
  let ttStyle   = null;

  if (ttModel && canvasRef.current) {
    const canvas       = canvasRef.current;
    const { toX, toY, W, H } = getCoords(canvas, displayBenchmark);
    const cx           = toX(ttModel.year);
    const cy           = toY(ttModel.score);
    const GUTTER       = 8;
    const TW           = Math.min(210, Math.max(0, W - GUTTER * 2));
    const TH           = 104;
    const leftCandidate = cx + TW + 14 > W - L.right ? cx - TW - 14 : cx + 14;
    const leftPos      = Math.min(Math.max(GUTTER, W - TW - GUTTER), Math.max(GUTTER, leftCandidate));
    const topCandidate = cy >= TH + GUTTER ? cy - TH : cy + 12;
    const topPos       = Math.min(Math.max(GUTTER, H - TH - GUTTER), Math.max(GUTTER, topCandidate));
    ttStyle = { position: 'absolute', left: leftPos, top: topPos, width: TW, pointerEvents: 'none', zIndex: 10 };
  }

  return (
    <WidgetCard title="Benchmark Progress — from AlexNet to frontier models" number="21.2" tryThis={tryThis}>

      {/* ── Row 1: Tabs + Toggles on same line ──────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '12px',
        marginBottom:   '10px',
        flexWrap:       'wrap',
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ImageNet', 'GLUE', 'HumanEval'].map(b => {
            const active = b === displayBenchmark;
            return (
              <button
                key={b}
                onClick={() => switchBenchmark(b)}
                style={{
                  fontFamily:   "'JetBrains Mono', monospace",
                  fontSize:     '11px',
                  fontWeight:   active ? 600 : 400,
                  padding:      '5px 16px',
                  borderRadius: '4px',
                  border:       '1px solid',
                  borderColor:  active ? C.accent  : C.borderLt,
                  background:   active ? '#0b2422' : 'transparent',
                  color:        active ? C.accent  : C.mid,
                  cursor:       'pointer',
                  lineHeight:   1.4,
                  transition:   'all 0.15s ease',
                }}
              >
                {b}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Toggle label="Human"    on={showHuman}    onChange={setShowHuman}    />
          <Toggle label="Callouts" on={showCallouts} onChange={setShowCallouts} />
          <Toggle label="Guides"   on={showGuides}   onChange={setShowGuides}   />
        </div>
      </div>

      {/* ── Canvas — full width ──────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Benchmark score chart. Use the model selector below to inspect and select a plotted model."
          style={{
            width:        '100%',
            height:       '260px',
            display:      'block',
            background:   '#0a0a0a',
            borderRadius: '4px',
            opacity:      chartOpacity,
            cursor:       hovIdx !== null ? 'pointer' : 'default',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />

        <select
          className="a11y-data-selector"
          aria-label={`Inspect ${displayBenchmark} model`}
          value={selIdx ?? ""}
          onChange={event => {
            const index = event.target.value === "" ? null : Number(event.target.value);
            setHovIdx(index);
            setSelIdx(index);
          }}
        >
          <option value="">Select a plotted model</option>
          {data.map((model, index) => <option key={model.model} value={index}>{`${model.model}, ${model.year}, ${model.score}%`}</option>)}
        </select>

        {/* Tooltip */}
        {ttStyle && ttModel && (
          <div style={{
            ...ttStyle,
            background:   C.bg2,
            border:       `1px solid ${C.border}`,
            borderRadius: '6px',
            padding:      '10px 14px',
            boxSizing:    'border-box',
            boxShadow:    '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: C.text, marginBottom: '2px' }}>
              {ttModel.model}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.accent, marginBottom: '6px' }}>
              {ttModel.year} · {ttModel.score}%
            </div>
            <div style={{
              fontFamily:      "'Inter', sans-serif",
              fontSize:        '11px',
              color:           C.mid,
              fontStyle:       'italic',
              lineHeight:      1.45,
              display:         '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow:        'hidden',
            }}>
              {ttModel.innovation}
            </div>
          </div>
        )}
      </div>

      {showHuman && bench.humanNote && (
        <div style={{
          marginTop: '8px',
          padding: '8px 10px',
          background: C.bg3,
          border: `1px solid ${C.border}`,
          borderRadius: '6px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          color: C.orange,
          lineHeight: 1.45,
        }}>
          {bench.humanNote}
        </div>
      )}

      {/* ── Horizontal stats strip ───────────────────────────────────────── */}
      <div data-mobile-stat-strip style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
        background:   C.bg3,
        border:       `1px solid ${C.border}`,
        borderRadius: '6px',
        padding:      '10px 14px',
        marginTop:    '8px',
      }}>
        <StripCell label="First"     main={first.model}  sub={`${first.score}%`}  />
        <VSep />
        <StripCell label="Latest"    main={latest.model} sub={`${latest.score}%`} />
        <VSep />
        <StripCell label="Total ↑"   main={`+${delta}%`}           mainColor={C.accent}                         />
        <VSep />
        <StripCell label="Avg / yr"  main={`+${avgPerYear}%/yr`}                                                 />
        <VSep />
        <StripCell label="Human"     main={bench.human != null ? `~${bench.human}%` : 'uncited'} mainColor={bench.human == null || !bench.humanComparable ? C.orange : C.mid} />
        <VSep />
        <StripCell label="Gap"       main={gapStr}                  mainColor={gapVal != null ? (gapVal >= 0 ? C.green : C.red) : C.muted}   />
        <VSep />
        <StripCell
          label="Surpassed"
          main={satYear ? `Yes, ${satYear}` : (hasComparableHuman ? 'Not yet' : 'N/A')}
          mainColor={satYear ? C.green : C.muted}
        />
        {!selectedModel && (
          <div style={{ marginLeft: 'auto', fontFamily: "'Inter', sans-serif", fontSize: '10px', color: C.muted, fontStyle: 'italic', flexShrink: 0 }}>
            Click a dot →
          </div>
        )}
      </div>

      {/* ── Selected model card ──────────────────────────────────────────── */}
      {selectedModel && (
        <div style={{
          background:   C.bg3,
          border:       `1px solid ${C.border}`,
          borderRadius: '6px',
          padding:      '12px 16px',
          marginTop:    '6px',
          display:      'flex',
          gap:          '16px',
          alignItems:   'flex-start',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '5px' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: C.text }}>
                {selectedModel.model}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.accent }}>
                {selectedModel.year} · {selectedModel.score}%
              </span>
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.mid, fontStyle: 'italic', lineHeight: 1.55 }}>
              {selectedModel.innovation}
            </div>
          </div>
          <button
            onClick={() => setSelIdx(null)}
            style={{
              fontFamily:   "'JetBrains Mono', monospace",
              fontSize:     '9px',
              padding:      '3px 8px',
              borderRadius: '3px',
              border:       `1px solid ${C.borderLt}`,
              background:   'transparent',
              color:        C.muted,
              cursor:       'pointer',
              flexShrink:   0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Progress indicator ───────────────────────────────────────────── */}
      <div style={{ marginTop: '8px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: C.mid, lineHeight: 1.6 }}>
        Progress from {first.score}% to {latest.score}% over {yearSpan} years
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.accent, marginLeft: '8px' }}>
          +{delta}% improvement
        </span>
        {satYear && (
          <span style={{ color: C.orange, marginLeft: '16px' }}>
            Human baseline surpassed in {satYear}
          </span>
        )}
      </div>

    </WidgetCard>
  );
}
