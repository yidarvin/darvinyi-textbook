import { useState, useEffect, useRef } from 'react';
import WidgetCard from '../../shared/WidgetCard';

// ── Geometry constants ────────────────────────────────────────────────────
const CX = 290, CY = 222, R = 90;
const NODE_R = 14;
const BOX_W = 140, BOX_H = 80, HEADER_H = 24;

// ── Color palette ─────────────────────────────────────────────────────────
const ACCENT     = '#2dd4bf';
const ACCENT_DIM = '#0b2422';
const TEXT_CLR   = '#e8eaed';
const MID        = '#888888';
const MUTED      = '#555555';
const BG2        = '#111111';
const BG3        = '#161616';
const BORDER     = '#242424';

// ── Node data ─────────────────────────────────────────────────────────────
const NODE_LABELS = [
  'User Input', 'Gather Context', 'Decide Action',
  'Use Tool', 'Observe Result', 'Continue?',
];

const NODES = NODE_LABELS.map((label, i) => {
  const a = -Math.PI / 2 + i * (2 * Math.PI / 6);
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a), label };
});

// ── Subsystem data ────────────────────────────────────────────────────────
const SUBSYSTEMS = [
  {
    id: 'permissions', label: 'Permission System', color: '#fb923c',
    cx: 290, cy: 42,
    items: ['7 permission modes', 'ML classifier for risk', 'Tool-level allow/deny'],
    connLabel: 'gate',
  },
  {
    id: 'extensibility', label: 'Extensibility', color: '#a78bfa',
    cx: 490, cy: 192,
    items: ['MCP servers', 'Plugins & Skills', 'Hooks: 27 events'],
    connLabel: 'extend',
  },
  {
    id: 'compaction', label: 'Context Compaction', color: '#fbbf24',
    cx: 450, cy: 352,
    items: ['Budget reduction', 'Snip / Microcompact', 'Context collapse', 'Auto-compact'],
    connLabel: 'compress',
  },
  {
    id: 'subagent', label: 'Subagent Delegation', color: '#34d399',
    cx: 130, cy: 352,
    items: ['Isolated contexts', 'Tool subsetting', 'Background runs'],
    connLabel: 'delegate',
  },
  {
    id: 'storage', label: 'Session Storage', color: '#60a5fa',
    cx: 90, cy: 192,
    items: ['Append-only JSONL', 'Sidechains/subagent', 'File-history checks'],
    connLabel: 'persist',
  },
];

// ── Detail panel content ──────────────────────────────────────────────────
const DETAILS = {
  permissions: {
    color: '#fb923c', title: 'Permission System',
    body: `Claude Code wraps every tool call in a 6-layer security gate. Each action is evaluated for risk before execution.

The 7 permission modes (least → most permissive):
• default-deny — explicit approval per tool call
• allow-list — pre-approved tools
• allow-edit — file edits OK, shell needs approval
• allow-bash — shell OK, only sensitive commands gated
• allow-net — network requests OK
• acceptEdits — auto-accept edits in a directory
• bypassPermissions — no gating (research/CI only)

Permissions are session-scoped and never restored on resume — trust is re-established each session.`,
  },
  extensibility: {
    color: '#a78bfa', title: 'Extensibility',
    body: `Four extensibility mechanisms cover different use cases:

• MCP (Model Context Protocol): standardized server interface for external tools. Plug in any MCP server and its tools become available.
• Plugins: bundles of agents, commands, skills, hooks, and MCP servers. A plugin manifest declares 10 component types.
• Skills: SKILL.md files with frontmatter injected into context when relevant. Project-level and user-level scopes.
• Hooks: 27 event types across 5 categories (session, prompt, tool, compaction, exit). 4 execution types: shell, LLM-evaluated, webhook, subagent verifier.`,
  },
  compaction: {
    color: '#fbbf24', title: 'Context Compaction',
    body: `Five layers run before every model call to manage context pressure. Each layer addresses a different bottleneck:

• Budget reduction: truncate individual tool outputs that exceed limits.
• Snip: drop intermediate steps from temporal history.
• Microcompact: reduce cache overhead in repeated structures.
• Context collapse: aggressive summarization of long conversations.
• Auto-compact: last-resort semantic compression.

Cheapest layers run first. No single strategy works for all types of context pressure.`,
  },
  subagent: {
    color: '#34d399', title: 'Subagent Delegation',
    body: `Subagents run in isolated context windows with their own system prompt, tool access, and permission mode. The parent agent receives only the summary, keeping its own context clean.

Two scopes:
• Project-level: .claude/agents/<name>.md
• User-level: ~/.claude/agents/<name>.md

Each subagent declares (via YAML frontmatter): tools available, model (sonnet vs opus vs haiku for cost/quality routing), permission mode, and an optional persistent memory directory.

Subagents don't make Claude smarter — they keep the main session focused.`,
  },
  storage: {
    color: '#60a5fa', title: 'Session Storage',
    body: `Three append-only storage channels:

• JSONL transcripts: every message, tool call, and result.
  Location: ~/.claude/projects/<encoded-path>/<sessionId>.jsonl
• Global prompt history: searchable across all sessions.
• Subagent sidechains: parallel transcripts for each subagent run.

Compact boundaries are recorded with headUuid/anchorUuid/tailUuid — the message chain is patched at read time rather than rewritten on disk. File-history checkpoints in ~/.claude/file-history/<sessionId>/ enable --rewind-files. Auditability is preferred over query power.`,
  },
};

// ── Geometry helpers ──────────────────────────────────────────────────────
function getConnectionPts(sub) {
  const dx = CX - sub.cx, dy = CY - sub.cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist, ny = dy / dist;

  const bx = sub.cx - BOX_W / 2, by = sub.cy - BOX_H / 2;
  let t = Infinity;
  if (nx >  1e-6) t = Math.min(t, (bx + BOX_W - sub.cx) / nx);
  if (nx < -1e-6) t = Math.min(t, (bx - sub.cx) / nx);
  if (ny >  1e-6) t = Math.min(t, (by + BOX_H - sub.cy) / ny);
  if (ny < -1e-6) t = Math.min(t, (by - sub.cy) / ny);

  const x1 = sub.cx + nx * t, y1 = sub.cy + ny * t;
  const x2 = CX - nx * R,     y2 = CY - ny * R;
  // label offset: perpendicular to line direction
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
  return { x1, y1, x2, y2, nx, ny, midX, midY };
}

function loopArrowPath(from, to) {
  const midX = (from.x + to.x) / 2, midY = (from.y + to.y) / 2;
  const dx = midX - CX, dy = midY - CY;
  const d  = Math.sqrt(dx * dx + dy * dy);
  const cpX = midX + (dx / d) * 22, cpY = midY + (dy / d) * 22;

  // End offset so arrowhead tip sits just outside the destination node circle
  const ex = cpX - to.x, ey = cpY - to.y;
  const ed = Math.sqrt(ex * ex + ey * ey);
  const endX = to.x + (ex / ed) * (NODE_R + 1);
  const endY = to.y + (ey / ed) * (NODE_R + 1);

  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────
function StatRow({ label, val, valColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: MUTED }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: valColor || ACCENT }}>{val}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', color: MUTED,
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px',
    }}>
      {children}
    </div>
  );
}

function StatsStrip({ selected }) {
  const sub = selected ? SUBSYSTEMS.find(s => s.id === selected) : null;
  const cellBorder = { borderRight: `1px solid ${BORDER}` };
  const cell = { flex: 1, padding: '10px 12px' };

  return (
    <div style={{
      display: 'flex',
      background: BG2,
      border: `1px solid ${BORDER}`,
      borderRadius: '8px',
      overflow: 'hidden',
      marginTop: '10px',
    }}>
      {/* ① Architecture + Selected */}
      <div style={{ ...cell, ...cellBorder }}>
        <SectionLabel>Architecture</SectionLabel>
        <StatRow label="Core"       val="agent loop" valColor={TEXT_CLR} />
        <StatRow label="Subsystems" val="5 major" />
        <div style={{ borderTop: `1px solid ${BORDER}`, margin: '7px 0' }} />
        <SectionLabel>Selected subsystem</SectionLabel>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          color: sub ? sub.color : MUTED,
          lineHeight: 1.3,
        }}>
          {sub ? sub.label : '—'}
        </div>
      </div>

      {/* ② Loop steps */}
      <div style={{ ...cell, ...cellBorder }}>
        <SectionLabel>Loop steps</SectionLabel>
        {['User input', 'Gather context', 'Decide action', 'Use tool', 'Observe result', 'Continue?'].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '2px' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: MUTED }}>{i + 1}.</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: MID  }}>{step}</span>
          </div>
        ))}
      </div>

      {/* ③ Key numbers */}
      <div style={{ ...cell, ...cellBorder }}>
        <SectionLabel>Key numbers</SectionLabel>
        <StatRow label="Perm modes"   val="7" />
        <StatRow label="Perm gate"    val="6 layers" />
        <StatRow label="Compaction"   val="5 layers" />
        <StatRow label="Hook events"  val="27" />
        <StatRow label="Plugin types" val="10" />
        <StatRow label="Tools"        val="~15" />
      </div>

      {/* ④ Storage */}
      <div style={{ ...cell }}>
        <SectionLabel>Storage location</SectionLabel>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: MID, lineHeight: 1.75 }}>
          ~/.claude/<br />
          Append-only JSONL<br />
          No vector DB<br />
          File-based memory
        </div>
      </div>
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
        padding: '5px 12px', borderRadius: '5px', cursor: 'pointer',
        border: `1px solid ${active ? ACCENT : BORDER}`,
        background: active ? ACCENT_DIM : '#1e1e1e',
        color: active ? ACCENT : MID,
        transition: 'all 150ms',
      }}
    >
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function ClaudeCodeArchitecture() {
  const [selectedSub, setSelectedSub] = useState(null);
  const [isAnimating, setIsAnimating]   = useState(true);
  const [showLabels,  setShowLabels]    = useState(true);
  const [dotAngle, setDotAngle]         = useState(-Math.PI / 2);

  const animIdRef  = useRef(null);
  const lastTsRef  = useRef(null);
  const angleRef   = useRef(-Math.PI / 2);

  useEffect(() => {
    if (!isAnimating) {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      lastTsRef.current = null;
      return;
    }

    function tick(ts) {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      angleRef.current += dt * (2 * Math.PI / 4000);
      // wrap back to start after one full revolution
      if (angleRef.current > 1.5 * Math.PI) angleRef.current -= 2 * Math.PI;

      setDotAngle(angleRef.current);
      animIdRef.current = requestAnimationFrame(tick);
    }

    animIdRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animIdRef.current);
      lastTsRef.current = null;
    };
  }, [isAnimating]);

  const dotX = CX + R * Math.cos(dotAngle);
  const dotY = CY + R * Math.sin(dotAngle);
  const detail = selectedSub ? DETAILS[selectedSub] : null;

  function handleSubClick(id) {
    setSelectedSub(prev => (prev === id ? null : id));
  }

  return (
    <WidgetCard
      title="Claude Code Architecture — agent loop plus five subsystems"
      number="22.2"
    >
      <style>{`
        @keyframes cca-conn-pulse {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 1; }
        }
        @keyframes cca-detail-in {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Diagram ── */}
      <div>
          <svg viewBox="-1 -1 582 434" width="100%" style={{ display: 'block' }}>
            <defs>
              {/* Arrowhead for loop arrows */}
              <marker id="cca-arr-loop" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill={ACCENT} />
              </marker>
              {/* Gray arrowhead for unselected connections */}
              <marker id="cca-arr-gray" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#444444" />
              </marker>
              {/* Per-subsystem colored arrowheads */}
              {SUBSYSTEMS.map(sub => (
                <marker key={`m-${sub.id}`} id={`cca-arr-${sub.id}`}
                  markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill={sub.color} />
                </marker>
              ))}
              {/* Glow filter for animated dot */}
              <filter id="cca-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Connection arrows (subsystem ↔ loop) ── */}
            {SUBSYSTEMS.map(sub => {
              const pts = getConnectionPts(sub);
              const isSel = selectedSub === sub.id;
              const labelX = pts.midX + (-pts.ny) * 12;
              const labelY = pts.midY + ( pts.nx) * 12;

              return (
                <g key={`conn-${sub.id}`}>
                  <line
                    x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
                    stroke={isSel ? sub.color : '#444444'}
                    strokeWidth={isSel ? 2 : 1}
                    markerEnd={isSel ? `url(#cca-arr-${sub.id})` : 'url(#cca-arr-gray)'}
                    style={{
                      opacity: isSel ? 1 : 0.5,
                      animation: isSel ? 'cca-conn-pulse 1s ease-in-out infinite' : 'none',
                    }}
                  />
                  {showLabels && (
                    <text
                      x={labelX} y={labelY}
                      textAnchor="middle"
                      fontSize={8}
                      fontFamily="JetBrains Mono, monospace"
                      fill={isSel ? sub.color : '#555555'}
                      opacity={isSel ? 0.9 : 0.7}
                    >
                      {sub.connLabel}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── Dashed guide circle ── */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none" stroke="#222222"
              strokeWidth={1} strokeDasharray="4 4"
            />

            {/* ── Loop arrows ── */}
            {NODES.map((node, i) => (
              <path
                key={`la-${i}`}
                d={loopArrowPath(node, NODES[(i + 1) % 6])}
                fill="none"
                stroke={ACCENT}
                strokeWidth={1.5}
                markerEnd="url(#cca-arr-loop)"
              />
            ))}

            {/* ── Center label ── */}
            <text
              x={CX} y={CY - 7}
              textAnchor="middle"
              fontSize={12}
              fontFamily="Crimson Pro, serif"
              fill={TEXT_CLR}
            >
              Agent Loop
            </text>
            <text
              x={CX} y={CY + 9}
              textAnchor="middle"
              fontSize={8}
              fontFamily="JetBrains Mono, monospace"
              fill={MUTED}
            >
              queryLoop async generator
            </text>

            {/* ── Loop node circles ── */}
            {NODES.map((node, i) => (
              <g key={`node-${i}`}>
                <circle
                  cx={node.x} cy={node.y} r={NODE_R}
                  fill={ACCENT_DIM} stroke={ACCENT} strokeWidth={2}
                />
                <text
                  x={node.x} y={node.y + NODE_R + 11}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                  fill={ACCENT}
                >
                  {node.label}
                </text>
              </g>
            ))}

            {/* ── Animated traversal dot ── */}
            {isAnimating && (
              <circle
                cx={dotX} cy={dotY} r={5}
                fill="#ffffff" opacity={0.92}
                filter="url(#cca-glow)"
              />
            )}

            {/* ── Subsystem boxes ── */}
            {SUBSYSTEMS.map(sub => {
              const bx   = sub.cx - BOX_W / 2;
              const by   = sub.cy - BOX_H / 2;
              const isSel = selectedSub === sub.id;

              return (
                <g
                  key={`sub-${sub.id}`}
                  onClick={() => handleSubClick(sub.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Selection glow */}
                  {isSel && (
                    <rect
                      x={bx - 3} y={by - 3}
                      width={BOX_W + 6} height={BOX_H + 6}
                      rx={11} ry={11}
                      fill={sub.color} opacity={0.1}
                    />
                  )}

                  {/* Box body */}
                  <rect
                    x={bx} y={by} width={BOX_W} height={BOX_H}
                    rx={8} ry={8}
                    fill={BG3}
                    stroke={sub.color}
                    strokeWidth={isSel ? 2 : 1.5}
                  />

                  {/* Header background — rounded top, flat bottom */}
                  <rect x={bx}     y={by}     width={BOX_W} height={8}             rx={8} ry={8} fill={sub.color} opacity={0.14} />
                  <rect x={bx}     y={by + 8} width={BOX_W} height={HEADER_H - 8}              fill={sub.color} opacity={0.14} />

                  {/* Header bottom rule */}
                  <line
                    x1={bx} y1={by + HEADER_H}
                    x2={bx + BOX_W} y2={by + HEADER_H}
                    stroke={sub.color} strokeWidth={1} opacity={0.45}
                  />

                  {/* Title */}
                  <text
                    x={sub.cx} y={by + 16}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="Inter, sans-serif"
                    fontWeight="bold"
                    fill={sub.color}
                  >
                    {sub.label}
                  </text>

                  {/* Bullet items */}
                  {sub.items.map((item, j) => (
                    <text
                      key={j}
                      x={bx + 7} y={by + 36 + j * 12}
                      fontSize={9}
                      fontFamily="Inter, sans-serif"
                      fill={MID}
                    >
                      • {item}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>

          {/* ── Detail panel ── */}
          <div style={{
            marginTop: '10px',
            borderLeft: `4px solid ${detail ? detail.color : BORDER}`,
            background: BG3,
            borderRadius: '0 8px 8px 8px',
            padding: '14px 18px',
            minHeight: '74px',
            transition: 'border-left-color 200ms',
          }}>
            {detail ? (
              <div
                key={selectedSub}
                style={{ animation: 'cca-detail-in 200ms ease-out forwards' }}
              >
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  color: detail.color,
                  marginBottom: '10px',
                }}>
                  {detail.title}
                </div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  color: '#b8c4cc',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}>
                  {detail.body}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: MUTED,
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                fontStyle: 'italic',
                paddingTop: '18px',
              }}>
                Click any subsystem to expand details.
              </div>
            )}
          </div>

          {/* ── Stats strip ── */}
          <StatsStrip selected={selectedSub} />
      </div>

      {/* ── Controls ── */}
      <div style={{ marginTop: '14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Pill
          label={isAnimating ? 'Pause loop' : 'Resume loop'}
          active={isAnimating}
          onClick={() => setIsAnimating(a => !a)}
        />
        <Pill
          label={showLabels ? 'Hide labels' : 'Show labels'}
          active={showLabels}
          onClick={() => setShowLabels(l => !l)}
        />
        {selectedSub && (
          <button
            onClick={() => setSelectedSub(null)}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              padding: '5px 12px',
              borderRadius: '5px',
              border: `1px solid ${BORDER}`,
              background: 'transparent',
              color: MID,
              cursor: 'pointer',
            }}
          >
            Deselect
          </button>
        )}
      </div>
    </WidgetCard>
  );
}
