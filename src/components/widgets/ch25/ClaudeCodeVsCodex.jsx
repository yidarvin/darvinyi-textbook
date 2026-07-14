import { useState } from 'react';
import WidgetCard from '../../shared/WidgetCard';

const ACCENT    = '#2dd4bf';
const ORANGE    = '#fb923c';
const BG3       = '#161616';
const BG4       = '#1e1e1e';
const BORDER    = '#242424';
const BORDER_LT = '#2e2e2e';
const TEXT      = '#e8eaed';
const MUTED     = '#555555';
const MID       = '#888888';

const DIMENSIONS = [
  {
    id: 'reasoning-location',
    title: 'Where reasoning lives',
    claudeCode: 'Mostly in the model. The harness loads minimal scaffolding into context (CLAUDE.md as user-context, not system prompt). Skills and subagents inject task-specific reasoning only when relevant.',
    codex: 'Also mostly in the model, with less harness-level scaffolding than Claude Code — but safety is enforced by an OS-level sandbox rather than by the harness reasoning about risk.',
    claudeHL: ['minimal scaffolding', 'task-specific reasoning only when relevant'],
    codexHL: ['less harness-level scaffolding', 'OS-level sandbox'],
  },
  {
    id: 'iteration-loop',
    title: 'Iteration loop structure',
    claudeCode: 'Single queryLoop async generator drives all sessions. Loop steps: gather context → decide → use tool → observe → continue?',
    codex: 'Similar tight loop, gated by sandbox policy rather than step-by-step permission prompts — commands run immediately inside the sandbox; only sandbox-escaping actions pause for approval.',
    claudeHL: ['queryLoop async generator'],
    codexHL: ['gated by sandbox policy', 'pause for approval'],
  },
  {
    id: 'safety-posture',
    title: 'Safety posture',
    claudeCode: 'Six permission modes span fully manual to fully unattended. The auto mode routes novel actions through an ML-based risk classifier that blocks a specific denylist and allows everything else.',
    codex: 'OS-level sandbox by default — Seatbelt on macOS, bubblewrap + Landlock + seccomp on Linux — blocking network access and confining writes to the workspace, with an approval policy for anything that needs to escape it.',
    claudeHL: ['Six permission modes', 'ML-based risk classifier'],
    codexHL: ['OS-level sandbox by default', 'approval policy'],
  },
  {
    id: 'extensibility',
    title: 'Extension surface',
    claudeCode: 'Four mechanisms: MCP servers (standardized), Plugins (bundles), Skills (knowledge injection), Hooks (event handlers). Plugin manifest declares 10 component types.',
    codex: 'Single primary mechanism: custom shell scripts and configuration. MCP support added later. Simpler but less structured.',
    claudeHL: ['Four mechanisms', '10 component types'],
    codexHL: ['Single primary mechanism', 'Simpler but less structured'],
  },
  {
    id: 'context-management',
    title: 'Context management',
    claudeCode: 'Five-layer compaction pipeline runs before every model call. Session memory compact → snip → microcompact → context collapse → auto-compact.',
    codex: "Simpler context handling: truncate from the start when limit is approached. Relies on the model's long-context capability.",
    claudeHL: ['Five-layer compaction pipeline'],
    codexHL: ['truncate from the start', 'long-context capability'],
  },
  {
    id: 'subagent-delegation',
    title: 'Subagent delegation',
    claudeCode: 'First-class subagent system with isolated context windows, tool subsetting, and optional persistent memory. Two scopes: project and user.',
    codex: 'No formal subagent abstraction. The model can be prompted to imitate the pattern but the harness does not enforce isolation.',
    claudeHL: ['First-class subagent system', 'isolated context windows', 'tool subsetting'],
    codexHL: ['No formal subagent abstraction', 'does not enforce isolation'],
  },
  {
    id: 'session-persistence',
    title: 'Session persistence',
    claudeCode: 'Append-only JSONL with three channels (transcripts, prompt history, subagent sidechains). File-history checkpoints enable --rewind-files.',
    codex: 'Session state is more ephemeral by default. Recent versions added persistence options but it remains less central to the design.',
    claudeHL: ['Append-only JSONL', '--rewind-files'],
    codexHL: ['more ephemeral by default', 'less central to the design'],
  },
];

function highlightText(text, phrases, color) {
  if (!phrases.length) return text;
  const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    phrases.includes(part)
      ? <strong key={i} style={{ color, fontWeight: 600 }}>{part}</strong>
      : part
  );
}

function VDivider() {
  return <div style={{ width: '1px', background: BORDER, alignSelf: 'stretch', flexShrink: 0 }} />;
}

function StatsSection({ label, labelColor, children }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '8px',
        color: labelColor || MUTED,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: '5px',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function StatsBullet({ text }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: MID, marginBottom: '2px' }}>
      • {text}
    </div>
  );
}

function StatsStrip({ expandedId }) {
  const dim = expandedId && expandedId !== '__all__'
    ? DIMENSIONS.find(d => d.id === expandedId)
    : null;

  return (
    <div style={{
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
      background: '#0f0f0f',
      border: `1px solid ${BORDER}`,
      borderRadius: '8px',
      padding: '12px 16px',
      marginTop: '12px',
    }}>
      <StatsSection label="Overview">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: MUTED, marginBottom: '2px' }}>
          Dimensions <span style={{ color: ACCENT }}>7</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: MUTED, marginBottom: '1px' }}>Common ground:</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: MID, lineHeight: 1.5 }}>
          CLI, agent loop,<br />tool use, terminal
        </div>
      </StatsSection>

      <VDivider />

      <StatsSection label="Claude Code" labelColor={ACCENT}>
        {['Harness structure', 'Auditability', 'Permission gating', 'Subagent isolation'].map((item, i) => (
          <StatsBullet key={i} text={item} />
        ))}
      </StatsSection>

      <VDivider />

      <StatsSection label="Codex CLI" labelColor={ORANGE}>
        {['Model autonomy', 'Simplicity', 'Speed of iteration', 'Minimal scaffolding'].map((item, i) => (
          <StatsBullet key={i} text={item} />
        ))}
      </StatsSection>

      <VDivider />

      <StatsSection label="Selected">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: dim ? TEXT : MUTED, marginBottom: '6px', lineHeight: 1.4 }}>
          {dim ? dim.title : '—'}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: MUTED, lineHeight: 1.55, fontStyle: 'italic' }}>
          Both produce strong agents. The differences show which problems each system thinks are worth harness-level solutions.
        </div>
      </StatsSection>
    </div>
  );
}

const btnBase = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
  padding: '5px 12px',
  borderRadius: '5px',
  border: `1px solid ${BORDER_LT}`,
  background: '#1e1e1e',
  color: MID,
  cursor: 'pointer',
  transition: 'all 150ms',
};

export default function ClaudeCodeVsCodex({ tryThis }) {
  const [expandedId, setExpandedId] = useState(null);
  const [highlight, setHighlight] = useState(false);

  function toggleRow(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function isExpanded(id) {
    return expandedId === id || expandedId === '__all__';
  }

  return (
    <WidgetCard title="Claude Code vs Codex CLI — seven design dimensions" number="25.3" tryThis={tryThis}>

      {/* Column headers */}
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: '16px', color: ACCENT }}>
            Claude Code
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: MUTED }}>
            Anthropic · CLI coding agent
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: '16px', color: ORANGE }}>
            OpenAI Codex CLI
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: MUTED }}>
            OpenAI · CLI coding agent
          </div>
        </div>
      </div>

      {/* Dimension rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {DIMENSIONS.map(dim => {
          const expanded = isExpanded(dim.id);
          return (
            <div
              key={dim.id}
              style={{
                borderRadius: '6px',
                border: `1px solid ${BORDER_LT}`,
                overflow: 'hidden',
              }}
            >
              {/* Row header */}
              <div
                onClick={() => toggleRow(dim.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 14px',
                  background: BG3,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1b1b1b'; }}
                onMouseLeave={e => { e.currentTarget.style.background = BG3; }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: TEXT }}>
                  {dim.title}
                </span>
                <span style={{ color: MUTED, fontSize: '9px', marginLeft: '8px', flexShrink: 0 }}>
                  {expanded ? '▲' : '▼'}
                </span>
              </div>

              {/* Expandable body */}
              <div style={{
                maxHeight: expanded ? '220px' : '0',
                overflow: 'hidden',
                transition: 'max-height 250ms ease',
              }}>
                <div style={{ display: 'flex' }}>
                  <div style={{
                    flex: 1,
                    background: 'rgba(45,212,191,0.04)',
                    borderLeft: `3px solid ${ACCENT}`,
                    padding: '12px 14px',
                  }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#b8c4cc', lineHeight: 1.55 }}>
                      {highlight
                        ? highlightText(dim.claudeCode, dim.claudeHL, ACCENT)
                        : dim.claudeCode}
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'rgba(251,146,60,0.04)',
                    borderLeft: `3px solid ${ORANGE}`,
                    padding: '12px 14px',
                  }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#b8c4cc', lineHeight: 1.55 }}>
                      {highlight
                        ? highlightText(dim.codex, dim.codexHL, ORANGE)
                        : dim.codex}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary panel */}
      <div style={{ background: BG4, borderRadius: '8px', padding: '16px 20px', marginTop: '12px' }}>
        <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: '14px', color: TEXT, marginBottom: '8px' }}>
          Two bets about where intelligence should live
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#b8c4cc', lineHeight: 1.6 }}>
          Claude Code bets on structured harness logic: explicit permissions, layered context management, formal subagents, append-only audit trail.
          This adds complexity but produces predictable, auditable behavior.
          <br /><br />
          Codex CLI bets on the model inside an OS-level sandbox: minimal harness scaffolding, trust the model to navigate ambiguity, fewer harness-level constraints — with safety enforced by the sandbox rather than by permission prompts.
          <br /><br />
          Neither bet is obviously correct. The right answer depends on the deployment context and the user's tolerance for surprise.
        </div>
      </div>

      {/* Stats strip */}
      <StatsStrip expandedId={expandedId} />

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => setExpandedId('__all__')} style={btnBase}>
          Expand all
        </button>
        <button onClick={() => setExpandedId(null)} style={btnBase}>
          Collapse all
        </button>
        <button
          onClick={() => setHighlight(h => !h)}
          style={{
            ...btnBase,
            border: `1px solid ${highlight ? ACCENT : BORDER_LT}`,
            color: highlight ? ACCENT : MID,
            background: highlight ? 'rgba(45,212,191,0.07)' : '#1e1e1e',
          }}
        >
          {highlight ? 'Highlighting on' : 'Highlight differences'}
        </button>
      </div>
    </WidgetCard>
  );
}
