import { useState, useEffect, useRef, useCallback } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const C = {
  accent:    '#2dd4bf',
  accentDim: '#0b2422',
  orange:    '#fb923c',
  purple:    '#a78bfa',
  math:      '#fbbf24',
  green:     '#34d399',
  red:       '#f87171',
  border:    '#242424',
  borderLt:  '#2e2e2e',
  bg2:       '#111111',
  bg3:       '#161616',
  bg4:       '#1e1e1e',
  codeBg:    '#0a0a0a',
  text:      '#e8eaed',
  mid:       '#888888',
  muted:     '#555555',
};

const HARNESSES = {
  claudeCode: {
    name: "Claude Code",
    color: C.accent,
    pos: [0.3, 0.4],
    interaction: "Terminal-based, conversational with explicit human approval",
    primaryUse: "Software engineering on local codebases",
    strength: "Permission system, MCP extensibility, subagent delegation",
    weakness: "Single-session focus; less suited to long unattended runs",
    structure: 4, autonomy: 4, reusability: 5, learningCurve: 8,
    quadrant: "Interactive helper",
    labelOffset: [14, -6],
  },
  codexCli: {
    name: "Codex CLI",
    color: C.orange,
    pos: [0.2, 0.45],
    interaction: "Terminal-based, minimal harness, model-led",
    primaryUse: "Coding assistance with direct shell access",
    strength: "Lightweight abstractions, OS-level sandbox by default",
    weakness: "No harness-level permission system; approvals depend on the sandbox's escape hatches",
    structure: 2, autonomy: 5, reusability: 4, learningCurve: 9,
    quadrant: "Interactive helper",
    labelOffset: [-14, -14],
  },
  langchain: {
    name: "LangChain",
    color: C.purple,
    pos: [0.45, 0.55],
    interaction: "Python/JS library composed by developers",
    primaryUse: "General LLM application building",
    strength: "Huge ecosystem of integrations; battery-included",
    weakness: "API churn, heavy abstractions, fast-evolving best practices",
    structure: 5, autonomy: 6, reusability: 8, learningCurve: 5,
    quadrant: "Composition library",
    labelOffset: [14, -6],
  },
  langgraph: {
    name: "LangGraph",
    color: C.math,
    pos: [0.75, 0.6],
    interaction: "Graph DSL with nodes and conditional edges",
    primaryUse: "Reliable production agent workflows",
    strength: "Explicit state machine, auditable control flow",
    weakness: "More upfront design work than chains",
    structure: 9, autonomy: 6, reusability: 7, learningCurve: 5,
    quadrant: "State-machine framework",
    labelOffset: [14, -6],
  },
  crewAI: {
    name: "CrewAI",
    color: C.green,
    pos: [0.65, 0.75],
    interaction: "Declarative roles, goals, and task assignments",
    primaryUse: "Multi-agent collaboration on structured tasks",
    strength: "Role-based design fits team workflows naturally",
    weakness: "Inter-agent coordination can drift; debugging is harder",
    structure: 7, autonomy: 8, reusability: 6, learningCurve: 6,
    quadrant: "Multi-agent framework",
    labelOffset: [14, 4],
  },
  autoGPT: {
    name: "AutoGPT",
    color: C.red,
    pos: [0.2, 0.92],
    interaction: "Autonomous loop with minimal human oversight",
    primaryUse: "Experimental autonomous task completion",
    strength: "Demonstrated emergent multi-step planning early",
    weakness: "Often drifts, hallucinates tool capabilities, hard to evaluate",
    structure: 2, autonomy: 10, reusability: 3, learningCurve: 7,
    quadrant: "Autonomous loop",
    labelOffset: [14, -6],
  },
};

const HARNESS_CATEGORIES = {
  cli:        ['claudeCode', 'codexCli'],
  library:    ['langchain', 'langgraph'],
  multiAgent: ['crewAI', 'autoGPT'],
};

const FILTERS = [
  { key: 'all',        label: 'Show all' },
  { key: 'cli',        label: 'CLI coding' },
  { key: 'library',    label: 'Library/framework' },
  { key: 'multiAgent', label: 'Multi-agent' },
];

// Canvas layout constants — sized to fit comfortably in widget body
const CW = 540, CH = 340;
const PAD_L = 56, PAD_R = 26, PAD_T = 26, PAD_B = 34;
const PLOT_W = CW - PAD_L - PAD_R; // 458
const PLOT_H = CH - PAD_T - PAD_B; // 280
const DOT_R = 12;

function plotX(nx) { return PAD_L + nx * PLOT_W; }
function plotY(ny) { return PAD_T + (1 - ny) * PLOT_H; }
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function PropertyBar({ label, value, color, animate }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(animate ? value * 10 : value * 10), 40);
    return () => clearTimeout(t);
  }, [value, animate]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
      <div style={{
        fontFamily: "'Inter', sans-serif", fontSize: '10px',
        color: C.muted, width: '88px', flexShrink: 0,
      }}>{label}</div>
      <div style={{
        width: '100px', height: '6px', background: C.bg4,
        borderRadius: '3px', flexShrink: 0, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: '3px',
          background: color ? hexToRgba(color, 0.5) : C.mid,
          width: `${width}%`,
          transition: 'width 300ms ease-out',
        }} />
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
        color: C.mid, width: '16px',
      }}>{value}</div>
    </div>
  );
}

function DetailCard({ harness, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  if (!harness) return null;
  const h = HARNESSES[harness];
  const row = (label, val) => (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: C.muted, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: C.text }}>
        {val}
      </span>
    </div>
  );
  return (
    <div style={{
      marginTop: '6px',
      maxHeight: visible ? '420px' : '0px',
      overflow: 'hidden',
      transition: 'max-height 280ms ease-out',
    }}>
      <div data-mobile-stack style={{
        background: C.bg3,
        borderLeft: `4px solid ${h.color}`,
        borderRadius: '8px',
        padding: '14px 18px',
        display: 'flex',
        gap: '16px',
      }}>
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: h.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: '16px', color: C.text }}>
              {h.name}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
              color: h.color, opacity: 0.7, marginLeft: 'auto',
            }}>{h.quadrant}</span>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: C.muted,
              cursor: 'pointer', fontSize: '14px', padding: '0 0 0 4px', lineHeight: 1,
            }}>×</button>
          </div>
          {row('Interaction:', h.interaction)}
          {row('Primary use:', h.primaryUse)}
          {row('Strength:', h.strength)}
          {row('Weakness:', h.weakness)}
        </div>

        {/* Right column — bars */}
        <div data-mobile-panel style={{ width: '200px', flexShrink: 0, paddingTop: '2px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '8px',
            color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: '8px',
          }}>Properties</div>
          <PropertyBar label="Structure"      value={h.structure}     color={h.color} animate />
          <PropertyBar label="Autonomy"       value={h.autonomy}      color={h.color} animate />
          <PropertyBar label="Reusability"    value={h.reusability}   color={h.color} animate />
          <PropertyBar label="Learning curve" value={h.learningCurve} color={h.color} animate />
        </div>
      </div>
    </div>
  );
}

function StatsStrip({ selected, filter, showing }) {
  const h = selected ? HARNESSES[selected] : null;
  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const vdivider = (
    <div data-mobile-divider style={{ width: '1px', background: C.border, alignSelf: 'stretch', flexShrink: 0, margin: '0 12px' }} />
  );
  const cell = (label, val, valColor) => (
    <div style={{ flexShrink: 0 }}>
      <div style={{ ...mono, fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
      <div style={{ ...mono, fontSize: '11px', color: valColor || C.text, whiteSpace: 'nowrap' }}>{val}</div>
    </div>
  );

  return (
    <div data-mobile-stat-strip style={{
      display: 'flex', alignItems: 'center',
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: '8px', padding: '8px 14px',
      marginTop: '8px', minHeight: '42px',
    }}>
      {/* Color swatch + harness name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '2px', flexShrink: 0,
          background: h ? h.color : C.border,
          transition: 'background 200ms',
        }} />
        {cell('Selected', h ? h.name : '— click a dot —', h ? h.color : C.muted)}
      </div>

      {vdivider}
      {cell('Quadrant', h ? h.quadrant : '—')}
      {vdivider}
      {cell('Filter', FILTERS.find(f => f.key === filter)?.label || 'Show all')}
      {vdivider}
      {cell('Showing', `${showing} / 6`)}

      {/* Spacer + quote */}
      <div style={{ flex: 1 }} />
      <div style={{
        fontFamily: "'Inter', sans-serif", fontSize: '10px',
        color: C.muted, fontStyle: 'italic', textAlign: 'right',
      }}>
        "As models converge in capability, the harness becomes the differentiator."
      </div>
    </div>
  );
}

export default function HarnessTaxonomy({ tryThis }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const tickRef   = useRef(0);

  const [selected, setSelected]   = useState(null);
  const [hovered,  setHovered]    = useState(null);
  const [filter,   setFilter]     = useState('all');
  const [tooltip,  setTooltip]    = useState(null); // { x, y, text }

  const isHighlighted = useCallback((key) => {
    if (filter === 'all') return true;
    return HARNESS_CATEGORIES[filter]?.includes(key) ?? false;
  }, [filter]);

  const showingCount = filter === 'all'
    ? 6
    : (HARNESS_CATEGORIES[filter]?.length ?? 0);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CW * dpr;
    canvas.height = CH * dpr;
    canvas.style.width  = `${CW}px`;
    canvas.style.height = `${CH}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    function draw(tick) {
      ctx.clearRect(0, 0, CW, CH);

      // Background
      ctx.fillStyle = C.codeBg;
      ctx.fillRect(0, 0, CW, CH);

      // ── Axes ──────────────────────────────────────────
      ctx.strokeStyle = C.borderLt;
      ctx.lineWidth = 1;
      // X axis
      ctx.beginPath(); ctx.moveTo(PAD_L, PAD_T + PLOT_H); ctx.lineTo(PAD_L + PLOT_W, PAD_T + PLOT_H); ctx.stroke();
      // Y axis
      ctx.beginPath(); ctx.moveTo(PAD_L, PAD_T); ctx.lineTo(PAD_L, PAD_T + PLOT_H); ctx.stroke();

      // ── Crosshair grid ─────────────────────────────────
      const midX = PAD_L + PLOT_W * 0.5;
      const midY = PAD_T + PLOT_H * 0.5;
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = `rgba(36,36,36,0.5)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(midX, PAD_T); ctx.lineTo(midX, PAD_T + PLOT_H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD_L, midY); ctx.lineTo(PAD_L + PLOT_W, midY); ctx.stroke();
      ctx.restore();

      // ── Quadrant labels ────────────────────────────────
      ctx.font = '10px Inter';
      ctx.fillStyle = `rgba(85,85,85,0.3)`;
      ctx.textAlign = 'center';
      const qLabels = [
        { x: PAD_L + PLOT_W * 0.25, y: PAD_T + PLOT_H * 0.25, t: 'Autonomous loops' },
        { x: PAD_L + PLOT_W * 0.75, y: PAD_T + PLOT_H * 0.25, t: 'Autonomous workflows' },
        { x: PAD_L + PLOT_W * 0.25, y: PAD_T + PLOT_H * 0.75, t: 'Interactive helpers' },
        { x: PAD_L + PLOT_W * 0.75, y: PAD_T + PLOT_H * 0.75, t: 'Supervised pipelines' },
      ];
      qLabels.forEach(({ x, y, t }) => ctx.fillText(t, x, y));

      // ── Axis labels ────────────────────────────────────
      // X ends
      ctx.font = '10px Inter'; ctx.textAlign = 'left';
      ctx.fillStyle = C.muted;
      ctx.fillText('Loose / Flexible', PAD_L, PAD_T + PLOT_H + 16);
      ctx.textAlign = 'right';
      ctx.fillText('Rigid / State-machine', PAD_L + PLOT_W, PAD_T + PLOT_H + 16);
      // X center
      ctx.textAlign = 'center';
      ctx.fillStyle = C.mid;
      ctx.fillText('Structure →', PAD_L + PLOT_W / 2, PAD_T + PLOT_H + 16);

      // Y ends
      ctx.textAlign = 'left';
      ctx.fillStyle = C.muted;
      ctx.save();
      ctx.translate(16, PAD_T + PLOT_H);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Human in loop', 0, 0);
      ctx.restore();

      ctx.save();
      ctx.translate(16, PAD_T);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'right';
      ctx.fillText('Fully autonomous', 0, 0);
      ctx.restore();

      // Y center
      ctx.save();
      ctx.translate(14, PAD_T + PLOT_H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.mid;
      ctx.fillText('Autonomy ↑', 0, 0);
      ctx.restore();

      // ── Annotation: top-left ──────────────────────────
      ctx.font = 'italic 9px Inter';
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'left';
      ctx.fillText('Tradeoff: more structure → more reliability', PAD_L + 6, PAD_T + 14);
      ctx.fillText('                  → less flexibility', PAD_L + 6, PAD_T + 25);

      // ── Annotation: bottom-right ──────────────────────
      ctx.textAlign = 'right';
      ctx.fillText('Each harness lives at a deliberate spot', PAD_L + PLOT_W - 4, PAD_T + PLOT_H - 14);
      ctx.fillText('in this space. Pick the spot, pick the tool.', PAD_L + PLOT_W - 4, PAD_T + PLOT_H - 3);

      // ── Dots ───────────────────────────────────────────
      Object.entries(HARNESSES).forEach(([key, h]) => {
        const cx = plotX(h.pos[0]);
        const cy = plotY(h.pos[1]);
        const isHov = hovered === key;
        const isSel = selected === key;
        const hl    = isHighlighted(key);
        const opacity = hl ? 1 : 0.2;
        const r = isHov ? 16 : DOT_R;

        ctx.save();
        ctx.globalAlpha = opacity;

        // Pulsing ring for selected
        if (isSel) {
          const pulse = 0.4 + 0.3 * Math.sin(tick * 0.08);
          ctx.beginPath();
          ctx.arc(cx, cy, 18, 0, Math.PI * 2);
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = h.color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = opacity * pulse;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = opacity;
        }

        // Fill circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(h.color, isHov ? 0.5 : 0.25);
        ctx.fill();

        // Stroke
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = h.color;
        ctx.lineWidth = isSel ? 2.5 : 2;
        ctx.stroke();

        // Label
        const lx = cx + h.labelOffset[0];
        const ly = cy + h.labelOffset[1];
        ctx.font = `bold 11px Inter`;
        ctx.fillStyle = h.color;
        ctx.textAlign = h.labelOffset[0] < 0 ? 'right' : 'left';
        ctx.fillText(h.name, lx, ly);

        ctx.restore();
      });
    }

    function loop() {
      tickRef.current++;
      draw(tickRef.current);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [hovered, selected, filter, isHighlighted]);

  // Mouse handlers
  function getDotAt(e) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const [key, h] of Object.entries(HARNESSES)) {
      const cx = plotX(h.pos[0]);
      const cy = plotY(h.pos[1]);
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      if (dist <= 16) return key;
    }
    return null;
  }

  function handleMouseMove(e) {
    const key = getDotAt(e);
    setHovered(key);
    if (key) {
      const h = HARNESSES[key];
      const rect = canvasRef.current.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 28,
        text: h.quadrant,
      });
    } else {
      setTooltip(null);
    }
  }

  function handleMouseLeave() {
    setHovered(null);
    setTooltip(null);
  }

  function handleClick(e) {
    const key = getDotAt(e);
    if (key) setSelected(prev => prev === key ? null : key);
  }

  const btnBase = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px', padding: '4px 10px', borderRadius: '5px',
    cursor: 'pointer', border: `1px solid ${C.border}`,
    background: C.bg4, color: C.text, transition: 'background 150ms, border 150ms, color 150ms',
  };

  return (
    <WidgetCard title="The Harness Design Space — six tools, four quadrants" number="25.1" tryThis={tryThis}>

      {/* Filter controls */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button key={key} onClick={() => setFilter(key)} style={{
              ...btnBase,
              border:     `1px solid ${active ? C.accent : C.border}`,
              background: active ? C.accentDim : C.bg4,
              color:      active ? C.accent    : C.mid,
            }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Canvas — full width */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Harness design-space chart. Use the harness selector below to inspect and select a tool."
          style={{ display: 'block', cursor: hovered ? 'pointer' : 'default', borderRadius: '6px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        <select
          className="a11y-data-selector"
          aria-label="Inspect agent harness"
          value={selected || ""}
          onChange={event => {
            const key = event.target.value || null;
            setHovered(key);
            setSelected(key);
          }}
        >
          <option value="">Select a harness</option>
          {Object.entries(HARNESSES).map(([key, harness]) => (
            <option key={key} value={key}>{`${harness.name}: ${harness.quadrant}`}</option>
          ))}
        </select>
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: tooltip.x + 8, top: tooltip.y,
            background: C.bg3, border: `1px solid ${C.borderLt}`,
            borderRadius: '5px', padding: '4px 8px', pointerEvents: 'none',
            fontFamily: "'Inter', sans-serif", fontSize: '11px', color: C.text,
            whiteSpace: 'nowrap', zIndex: 10,
          }}>
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Stats strip — always visible below chart */}
      <StatsStrip selected={selected} filter={filter} showing={showingCount} />

      {/* Detail card — slides in on click */}
      {selected && (
        <DetailCard harness={selected} onClose={() => setSelected(null)} />
      )}

    </WidgetCard>
  );
}
