import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const DOMAIN_COLORS = {
  vision:     '#2dd4bf',
  language:   '#fb923c',
  multimodal: '#a78bfa',
};

const DATASETS = [
  {
    name: 'MNIST',
    year: 1998,
    size: 60000,
    sizeLabel: '60K images',
    domain: 'vision',
    task: 'Digit classification',
    significance: 'Established the benchmark that launched learned digit recognition and the modern era of neural networks for vision. LeNet-5 was designed for it.',
    enabled: 'LeNet, early CNNs, the convolutional architecture paradigm',
    storage: '~11 MB',
    storageBytes: 11e6,
    source: 'NIST handwritten digit scans',
    impactScore: 4,
    dotY: 70,
    labelXOffset: 0,
  },
  {
    name: 'CIFAR-10/100',
    year: 2009,
    size: 60000,
    sizeLabel: '60K images',
    domain: 'vision',
    task: 'Object classification (10 or 100 classes)',
    significance: 'Replaced MNIST as the standard small-scale vision benchmark. Small enough to iterate on quickly; hard enough to require real architectures.',
    enabled: 'Dropout, batch normalization, residual connections — all tested here first',
    storage: '~163 MB',
    storageBytes: 163e6,
    source: 'Curated subset of 80 Million Tiny Images',
    impactScore: 5,
    dotY: 130,
    labelXOffset: 0,
  },
  {
    // 1.2M = ImageNet-1K's ~1.28M ILSVRC training images (Russakovsky et al. 2015), commonly
    // rounded to 1.2M; keep in sync with the ImageNet node in DatasetScaleLogarithmic.jsx.
    name: 'ImageNet',
    year: 2009,
    size: 1200000,
    sizeLabel: '1.2M images',
    domain: 'vision',
    task: '1000-class object classification',
    significance: 'The dataset that launched the deep learning revolution. AlexNet\'s 2012 win on ImageNet changed everything. A decade of architecture innovation followed.',
    enabled: 'AlexNet, VGG, ResNet, EfficientNet, ViT — every major vision model',
    storage: '~150 GB',
    storageBytes: 150e9,
    source: 'Crowd-sourced via Mechanical Turk from internet images',
    impactScore: 10,
    dotY: 60,
    labelXOffset: 0,
  },
  {
    name: 'MS COCO',
    year: 2014,
    size: 330000,
    sizeLabel: '330K images',
    domain: 'vision',
    task: 'Object detection, segmentation, captioning',
    significance: 'Introduced complex multi-task evaluation for vision. Required detecting 80 object categories with pixel-level segmentation masks and natural language descriptions.',
    enabled: 'YOLO, Mask R-CNN, DETR, and all modern detection architectures',
    storage: '~25 GB',
    storageBytes: 25e9,
    source: 'Hand-labeled natural images from Flickr',
    impactScore: 7,
    dotY: 138,
    labelXOffset: 0,
  },
  {
    name: 'BookCorpus',
    year: 2015,
    size: 1000000000,
    sizeLabel: '1B tokens',
    domain: 'language',
    task: 'Language modeling, pretraining',
    significance: 'Enabled the first generation of large-scale language model pretraining. Used to train the original BERT alongside Wikipedia.',
    enabled: 'BERT, GPT-1, and the pretraining paradigm for NLP',
    storage: '~4 GB',
    storageBytes: 4e9,
    source: 'Unpublished books from smashwords.com',
    impactScore: 6,
    dotY: 68,
    labelXOffset: 0,
  },
  {
    // 410B tokens = the filtered Common Crawl figure GPT-3 trained on (Brown et al. 2020, "Language
    // Models are Few-Shot Learners," Table 2.2) — the standard citable token count for Common Crawl.
    name: 'Common Crawl',
    year: 2008,
    size: 410000000000,
    sizeLabel: '410B tokens',
    domain: 'language',
    task: 'Language model pretraining',
    significance: 'Founded in 2007 as a nonprofit and began archiving the public web in 2008 — the largest freely available text corpus, and the raw substrate nearly every later text corpus in this timeline filters down from. Noisy but vast; careful filtering extracts the usable signal.',
    enabled: 'GPT-3, LLaMA, and all frontier language models at scale',
    storage: '~100 TB (raw, per crawl)',
    storageBytes: 100e12,
    source: 'Web crawl of publicly accessible pages',
    impactScore: 9,
    dotY: 172,
    labelXOffset: 24,
  },
  {
    name: 'The Pile',
    year: 2020,
    size: 300000000000,
    sizeLabel: '300B tokens',
    domain: 'language',
    task: 'Language model pretraining',
    significance: 'Curated mixture of 22 high-quality text sources: books, code, scientific papers, web text. Showed that data mixture matters, not just scale.',
    enabled: 'GPT-NeoX, Pythia, and open-source LLM training pipelines',
    storage: '~800 GB',
    storageBytes: 800e9,
    source: '22 diverse sources curated by EleutherAI',
    impactScore: 7,
    dotY: 55,
    labelXOffset: -14,
  },
  {
    name: 'LAION-400M',
    year: 2021,
    size: 400000000,
    sizeLabel: '400M pairs',
    domain: 'multimodal',
    task: 'Vision-language alignment',
    significance: 'First open large-scale image-text dataset. Made CLIP (Contrastive Language–Image Pretraining)-style training accessible outside large labs. Enabled open-source multimodal research.',
    enabled: 'Open CLIP, Stable Diffusion (early), and multimodal research democratization',
    storage: '~240 GB',
    storageBytes: 240e9,
    source: 'Common Crawl image-text pairs filtered by CLIP similarity',
    impactScore: 8,
    dotY: 148,
    labelXOffset: 0,
  },
  {
    name: 'LAION-5B',
    year: 2022,
    size: 5000000000,
    sizeLabel: '5B pairs',
    domain: 'multimodal',
    task: 'Vision-language alignment at scale',
    significance: '5× larger than LAION-400M. Used to train Stable Diffusion v1.5 and v2. The largest openly released image-text dataset ever assembled.',
    enabled: 'Stable Diffusion, open-source text-to-image generation',
    storage: '~240 TB (images) + metadata',
    storageBytes: 240e12,
    source: '5B Common Crawl image-alt-text pairs, CLIP-filtered',
    impactScore: 9,
    dotY: 50,
    labelXOffset: 14,
  },
];

const YEAR_LABELS = [1998, 2003, 2008, 2013, 2018, 2023];

const STORAGE_LOG_MIN = Math.log10(11e6);
const STORAGE_LOG_MAX = Math.log10(240e12);

function yearToX(year) {
  return 50 + (year - 1998) / 25 * 490;
}

function getDotRadius(ds, sizeMode) {
  if (sizeMode === 'Examples') {
    return 8 + (Math.log10(ds.size) - 4.5) / (10 - 4.5) * 14;
  }
  if (sizeMode === 'Storage') {
    return 8 + (Math.log10(ds.storageBytes) - STORAGE_LOG_MIN) / (STORAGE_LOG_MAX - STORAGE_LOG_MIN) * 14;
  }
  return 8 + (ds.impactScore - 4) / 6 * 14;
}

function sizeBarPct(ds) {
  return Math.min(100, (Math.log10(ds.size) - 4.5) / (10 - 4.5) * 100);
}


const SEP = (
  <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />
);

function StatCell({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '8.5px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>{label}</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: valueColor || 'var(--text-mid)',
        lineHeight: 1.2,
      }}>{value}</div>
    </div>
  );
}

export default function DatasetTimeline({ tryThis }) {
  const [selected, setSelected] = useState(null);
  const [hovered,  setHovered]  = useState(null);
  const [sizeMode, setSizeMode] = useState('Examples');

  const dataset     = selected !== null ? DATASETS[selected] : null;
  const domainColor = dataset ? DOMAIN_COLORS[dataset.domain] : null;

  function handleDotClick(i) {
    setSelected(selected === i ? null : i);
  }

  return (
    <WidgetCard title="Dataset Scale Timeline — from 60K to 5 billion" number="21.1" tryThis={tryThis}>
      <style>{`
        @keyframes dt-fade { from { opacity: 0 } to { opacity: 1 } }
        .dt-dot { transition: r 0.15s ease, opacity 0.15s ease; }
      `}</style>

      {/* ── Header row: legend + size-by ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {[
            { domain: 'vision',     label: 'Vision' },
            { domain: 'language',   label: 'Language' },
            { domain: 'multimodal', label: 'Multimodal' },
          ].map(({ domain, label }) => (
            <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width={12} height={12} style={{ flexShrink: 0, overflow: 'visible' }}>
                <circle cx={6} cy={6} r={5} fill={DOMAIN_COLORS[domain]} />
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'var(--text-mid)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}>Size dots by</span>
          {['Examples', 'Storage', 'Impact'].map(opt => {
            const active = sizeMode === opt;
            return (
              <button
                key={opt}
                onClick={() => setSizeMode(opt)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: active ? 'var(--accent)' : 'var(--border-lt)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >{opt}</button>
            );
          })}
        </div>
      </div>

      {/* ── Full-width timeline SVG ───────────────────────────────────── */}
      <svg
        viewBox="0 0 580 200"
        width="100%"
        data-a11y-explorer="manual"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Baseline */}
        <line x1={50} y1={100} x2={540} y2={100} stroke="var(--border-lt)" strokeWidth={1.5} />

        {/* 5-year tick marks + labels */}
        {YEAR_LABELS.map(yr => {
          const x = yearToX(yr);
          return (
            <g key={yr}>
              <line x1={x} y1={96} x2={x} y2={104} stroke="var(--border-lt)" strokeWidth={1} />
              <text
                x={x} y={119}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize={9}
                fontFamily="'JetBrains Mono', monospace"
                style={{ userSelect: 'none' }}
              >{yr}</text>
            </g>
          );
        })}

        {/* Dataset tick marks */}
        {DATASETS.map(ds => (
          <line
            key={`tick-${ds.name}`}
            x1={yearToX(ds.year)} y1={96}
            x2={yearToX(ds.year)} y2={104}
            stroke="var(--border-lt)" strokeWidth={0.8}
          />
        ))}

        {/* Connecting lines */}
        {DATASETS.map(ds => (
          <line
            key={`vl-${ds.name}`}
            x1={yearToX(ds.year)} y1={ds.dotY}
            x2={yearToX(ds.year)} y2={100}
            stroke="var(--border)" strokeWidth={0.8}
            strokeDasharray="3,3"
          />
        ))}

        {/* Name labels */}
        {DATASETS.map((ds, i) => {
          const cx      = yearToX(ds.year);
          const baseR   = getDotRadius(ds, sizeMode);
          const isAbove = ds.dotY < 100;
          const labelY  = isAbove ? ds.dotY - baseR - 5 : ds.dotY + baseR + 12;
          const labelX  = cx + (ds.labelXOffset || 0);
          const isDimmed = selected !== null && selected !== i;
          return (
            <text
              key={`lbl-${ds.name}`}
              x={labelX} y={labelY}
              textAnchor="middle"
              fill={DOMAIN_COLORS[ds.domain]}
              fontSize={10}
              fontFamily="'Inter', sans-serif"
              fontWeight={500}
              opacity={isDimmed ? 0.3 : 1}
              style={{ pointerEvents: 'none', userSelect: 'none', transition: 'opacity 0.15s' }}
            >{ds.name}</text>
          );
        })}

        {/* Dots */}
        {DATASETS.map((ds, i) => {
          const cx         = yearToX(ds.year);
          const baseR      = getDotRadius(ds, sizeMode);
          const isActive   = selected === i || hovered === i;
          const r          = isActive ? baseR + 4 : baseR;
          const isSelected = selected === i;
          const isDimmed   = selected !== null && !isSelected;
          return (
            <circle
              key={`dot-${ds.name}`}
              className="dt-dot"
              cx={cx} cy={ds.dotY} r={r}
              fill={DOMAIN_COLORS[ds.domain]}
              stroke={isSelected ? 'white' : 'none'}
              strokeWidth={isSelected ? 2 : 0}
              opacity={isDimmed ? 0.25 : 1}
              aria-label={`${ds.name}, ${ds.year}, ${ds.sizeLabel}, ${ds.domain}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleDotClick(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>
      <select
        className="a11y-data-selector"
        aria-label="Select dataset from timeline"
        value={selected ?? ""}
        onChange={event => {
          const index = event.target.value === "" ? null : Number(event.target.value);
          setHovered(index);
          setSelected(index);
        }}
      >
        <option value="">Select a dataset</option>
        {DATASETS.map((dataset, index) => <option key={dataset.name} value={index}>{`${dataset.name}, ${dataset.year}, ${dataset.sizeLabel}, ${dataset.domain}`}</option>)}
      </select>

      {/* ── Stats strip — always visible ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '10px 16px',
        marginTop: '10px',
      }}>
        {dataset === null ? (
          <>
            <StatCell label="Datasets" value="9" />
            {SEP}
            <StatCell label="Span" value="1998–2022" />
            {SEP}
            <StatCell label="Smallest" value="MNIST · 60K" />
            {SEP}
            <StatCell label="Largest" value="LAION-5B · 5B" />
            {SEP}
            <StatCell label="Range" value="5 orders of mag" />
            {SEP}
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}>Click a dot to explore →</div>
          </>
        ) : (
          <div key={selected} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', animation: 'dt-fade 0.2s ease' }}>
            <div style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: '15px',
              color: domainColor,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>{dataset.name}</div>
            {SEP}
            <StatCell label="Year" value={String(dataset.year)} />
            {SEP}
            <StatCell label="Size" value={dataset.sizeLabel} valueColor={domainColor} />
            {SEP}
            <StatCell label="Storage" value={dataset.storage} />
            {SEP}
            <StatCell label="Domain" value={dataset.domain} valueColor={domainColor} />
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <button
                onClick={() => setSelected(null)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: '1px solid var(--border-lt)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >✕ clear</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail card — only when selected ─────────────────────────── */}
      {dataset && (
        <div
          key={`card-${selected}`}
          style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '18px 22px',
            marginTop: '8px',
            display: 'flex',
            gap: '28px',
            animation: 'dt-fade 0.2s ease',
          }}
        >
          {/* Left column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: '22px',
              color: 'var(--text)',
              lineHeight: 1.2,
              marginBottom: '5px',
            }}>{dataset.name}</div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '9px',
            }}>{dataset.year} · {dataset.domain} · {dataset.task}</div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              color: domainColor,
              marginBottom: '3px',
            }}>{dataset.sizeLabel}</div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}>{dataset.storage}</div>

            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              color: '#b8c4cc',
              lineHeight: 1.6,
              marginBottom: '10px',
            }}>{dataset.significance}</div>

            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: 'var(--text-mid)',
              fontStyle: 'italic',
            }}>Enabled: {dataset.enabled}</div>
          </div>

          {/* Right column */}
          <div style={{ width: '200px', flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '6px',
            }}>Source</div>

            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: 'var(--text-mid)',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}>{dataset.source}</div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '7px',
            }}>Dataset size</div>

            <div style={{
              width: '100%',
              height: '6px',
              background: 'var(--border-lt)',
              borderRadius: '3px',
              marginBottom: '7px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${sizeBarPct(dataset)}%`,
                height: '100%',
                background: domainColor,
                borderRadius: '3px',
              }} />
            </div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: domainColor,
            }}>{dataset.sizeLabel}</div>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
