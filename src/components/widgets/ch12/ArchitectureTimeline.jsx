import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const architectures = [
  {
    name: "LeNet-5",
    year: 1998,
    params: "60K",
    paramsNum: 60000,
    top1: "99.2%",
    top1Num: 99.2,
    task: "MNIST",
    layers: 7,
    innovation: "First practical deep CNN. Established the conv→pool→fc pattern that defined the field for a decade. Demonstrated end-to-end learning on raw pixels.",
    paper: "Gradient-Based Learning Applied to Document Recognition",
    color: "var(--border-lt)",
  },
  {
    name: "AlexNet",
    year: 2012,
    params: "60M",
    paramsNum: 60000000,
    top1: "63.3%",
    top1Num: 63.3,
    task: "ImageNet",
    layers: 8,
    innovation: "Shocked the vision community with a 10-point gap over the competition. Introduced ReLU activations, dropout regularization, and multi-GPU training at scale.",
    paper: "ImageNet Classification with Deep Convolutional Neural Networks",
    color: "var(--orange)",
  },
  {
    name: "VGG-16",
    year: 2014,
    params: "138M",
    paramsNum: 138000000,
    top1: "74.4%",
    top1Num: 74.4,
    task: "ImageNet",
    layers: 16,
    innovation: "Proved that depth with small uniform 3×3 kernels consistently beats width with large kernels. VGG's simplicity made it a go-to feature extractor for years.",
    paper: "Very Deep Convolutional Networks for Large-Scale Image Recognition",
    color: "var(--purple)",
  },
  {
    name: "Inception v3",
    year: 2015,
    params: "23M",
    paramsNum: 23000000,
    top1: "78.8%",
    top1Num: 78.8,
    task: "ImageNet",
    layers: 48,
    innovation: "Inception modules run parallel convolutions with different kernel sizes and concatenate their outputs. More capacity per parameter than VGG at a fraction of the size.",
    paper: "Rethinking the Inception Architecture for Computer Vision",
    color: "var(--math-color)",
  },
  {
    name: "ResNet-50",
    year: 2016,
    params: "25M",
    paramsNum: 25000000,
    top1: "78.6%",
    top1Num: 78.6,
    task: "ImageNet",
    layers: 50,
    innovation: "Skip connections solved the degradation problem — deeper networks were finally better. ResNet-152 (top-5 accuracy of 95.5%) won ImageNet 2015 by a wide margin.",
    paper: "Deep Residual Learning for Image Recognition",
    color: "var(--accent)",
  },
  {
    name: "EfficientNet-B7",
    year: 2019,
    params: "66M",
    paramsNum: 66000000,
    top1: "84.4%",
    top1Num: 84.4,
    task: "ImageNet",
    layers: 813,
    innovation: "Compound scaling: simultaneously scale network depth, width, and input resolution by a fixed ratio derived from a grid search. Achieved SOTA with fewer parameters than prior models.",
    paper: "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks",
    color: "var(--green)",
  },
];

const BAR_LABELS = ["LeNet", "AlexNet", "VGG", "Inc", "Res", "Eff"];

const SVG_H = 160;
const LINE_X1 = 40;
const LINE_X2 = 540;
const LINE_Y = 80;
const YEAR_MIN = 1998;
const YEAR_MAX = 2019;

// Dot sizing ranges
const LOG_VALS = architectures.map(a => Math.log10(a.paramsNum));
const LOG_MIN = Math.min(...LOG_VALS);
const LOG_MAX = Math.max(...LOG_VALS);
const LAYER_MIN = Math.min(...architectures.map(a => a.layers));
const LAYER_MAX = Math.max(...architectures.map(a => a.layers));
const ACC_MIN = Math.min(...architectures.map(a => a.top1Num));
const ACC_MAX = Math.max(...architectures.map(a => a.top1Num));

function yearToX(year) {
  return LINE_X1 + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (LINE_X2 - LINE_X1);
}

function getDotRadius(arch, sizeBy) {
  let t;
  if (sizeBy === 'Params') {
    t = (Math.log10(arch.paramsNum) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  } else if (sizeBy === 'Layers') {
    t = (arch.layers - LAYER_MIN) / (LAYER_MAX - LAYER_MIN);
  } else {
    t = (arch.top1Num - ACC_MIN) / (ACC_MAX - ACC_MIN);
  }
  return 7 + t * 11;
}

// Bar chart constants
const BAR_W = 14;
const BAR_GAP = 10;
const BAR_AREA_H = 80;
const CHART_W = 160;
const TOTAL_BARS_W = architectures.length * BAR_W + (architectures.length - 1) * BAR_GAP;
const BAR_START_X = (CHART_W - TOTAL_BARS_W) / 2;

export default function ArchitectureTimeline() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [sizeBy, setSizeBy] = useState('Params');

  const arch = selected !== null ? architectures[selected] : null;

  return (
    <WidgetCard title="Architecture Timeline — from LeNet to EfficientNet" number="5.3">
      <style>{`
        @keyframes at-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .at-dot { transition: r 0.15s ease; }
      `}</style>

      {/* Toggle pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}>
          Size dots by
        </span>
        {['Params', 'Layers', 'Accuracy'].map(opt => {
          const active = sizeBy === opt;
          return (
            <button
              key={opt}
              onClick={() => setSizeBy(opt)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                padding: '3px 11px',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: active ? 'var(--accent)' : 'var(--border-lt)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Timeline SVG */}
      <svg
        width="100%"
        viewBox={`0 0 580 ${SVG_H}`}
        style={{ display: 'block', overflow: 'visible', marginBottom: '14px' }}
      >
        {/* Baseline */}
        <line
          x1={LINE_X1} y1={LINE_Y}
          x2={LINE_X2} y2={LINE_Y}
          stroke="var(--border-lt)" strokeWidth={1.5}
        />

        {architectures.map((a, i) => {
          const cx = yearToX(a.year);
          const baseR = getDotRadius(a, sizeBy);
          const isActive = selected === i || hovered === i;
          const r = isActive ? Math.max(baseR, baseR + 3) : baseR;
          const isAbove = i % 2 === 0;

          // Label positions clear of max possible dot (radius 18)
          const nameY = isAbove ? LINE_Y - 28 : LINE_Y + 44;
          const yearY = isAbove ? LINE_Y + 22 : LINE_Y + 56;

          return (
            <g key={a.name}>
              {/* Tick mark */}
              <line
                x1={cx} y1={LINE_Y - 4}
                x2={cx} y2={LINE_Y + 4}
                stroke="var(--border-lt)" strokeWidth={1}
              />

              {/* Architecture name */}
              <text
                x={cx} y={nameY}
                textAnchor="middle"
                fill={selected === i ? a.color : 'var(--text-mid)'}
                fontSize={11}
                fontFamily="Inter, sans-serif"
                fontWeight={selected === i ? 500 : 400}
                style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.15s' }}
              >
                {a.name}
              </text>

              {/* Year label */}
              <text
                x={cx} y={yearY}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize={9}
                fontFamily="'JetBrains Mono', monospace"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {a.year}
              </text>

              {/* Dot */}
              <circle
                className="at-dot"
                cx={cx} cy={LINE_Y} r={r}
                fill={a.color}
                stroke={selected === i ? a.color : 'var(--border)'}
                strokeWidth={selected === i ? 2 : 1.5}
                opacity={selected !== null && selected !== i ? 0.5 : 1}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(selected === i ? null : i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Detail card */}
      {arch === null ? (
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: 'var(--text-muted)',
          letterSpacing: '0.03em',
        }}>
          Click an architecture to see details →
        </div>
      ) : (
        <div
          key={selected}
          style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '18px',
            display: 'flex',
            gap: '24px',
            minHeight: '180px',
            animation: 'at-fade-in 0.2s ease',
          }}
        >
          {/* Left column */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: '22px',
              color: 'var(--text)',
              lineHeight: 1.2,
              marginBottom: '6px',
            }}>
              {arch.name}
            </div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}>
              {arch.year} · {arch.task} · {arch.layers} layers
            </div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              color: 'var(--accent)',
              marginBottom: '12px',
            }}>
              {arch.params} params · {arch.top1} Top-1
            </div>

            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              color: '#b8c4cc',
              lineHeight: 1.6,
              flex: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}>
              {arch.innovation}
            </div>

            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              marginTop: '10px',
            }}>
              {arch.paper}
            </div>
          </div>

          {/* Right column — bar chart */}
          <div style={{ width: '160px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '8px',
              color: 'var(--text-muted)',
              marginBottom: '6px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Top-1 Accuracy
            </div>
            <svg width={CHART_W} height={BAR_AREA_H + 24} style={{ overflow: 'visible' }}>
              {/* Baseline */}
              <line
                x1={BAR_START_X - 2} y1={BAR_AREA_H}
                x2={BAR_START_X + TOTAL_BARS_W + 2} y2={BAR_AREA_H}
                stroke="var(--border-lt)" strokeWidth={1}
              />

              {architectures.map((a, i) => {
                const barH = (a.top1Num / 100) * BAR_AREA_H;
                const x = BAR_START_X + i * (BAR_W + BAR_GAP);
                const y = BAR_AREA_H - barH;
                const isSelectedBar = i === selected;

                return (
                  <g key={a.name}>
                    <rect
                      x={x} y={y}
                      width={BAR_W} height={barH}
                      fill={isSelectedBar ? arch.color : 'var(--border-lt)'}
                      rx={2}
                      style={{ transition: 'fill 0.15s' }}
                    />
                    <text
                      x={x + BAR_W / 2}
                      y={BAR_AREA_H + 14}
                      textAnchor="middle"
                      fill={isSelectedBar ? 'var(--text-mid)' : 'var(--text-muted)'}
                      fontSize={8}
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {BAR_LABELS[i]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
