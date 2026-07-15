import { useMemo, useState } from "react";
import WidgetCard from "../../shared/WidgetCard";

const C = {
  accent: "var(--accent)",
  green: "var(--green)",
  purple: "var(--purple)",
  border: "var(--border)",
  bg: "var(--code-bg)",
  muted: "var(--text-muted)",
};
const mono = "'JetBrains Mono', monospace";

// These are disclosed accounting models, not benchmark measurements.  The
// quadratic term counts causal QK comparisons during prefill.  The linear
// models carry a fixed-width recurrent summary; their constants differ, but
// their dependence on sequence length does not. Linear attention retains a
// feature-by-value accumulator, hence the width-squared term.
function costs(tokens, width) {
  const pairs = tokens * (tokens + 1) / 2;
  return {
    attention: pairs * width,
    ssm: tokens * width * 3,
    linear: tokens * width * width * 5,
    attentionMemory: tokens * width * 2,
    stateMemory: width * 2,
    linearMemory: width * width + width,
  };
}

function fmt(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}G`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

function Bar({ label, value, max, color, suffix = "" }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: mono, fontSize: 10, color: C.muted }}>
        <span>{label}</span><span style={{ color }}>{fmt(value)}{suffix}</span>
      </div>
      <div style={{ height: 8, marginTop: 4, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(1, value / max * 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export default function ComplexityRace({ tryThis }) {
  const [tokens, setTokens] = useState(4096);
  const [width, setWidth] = useState(256);
  const { attention, ssm, linear, attentionMemory, stateMemory, linearMemory } = useMemo(() => costs(tokens, width), [tokens, width]);
  const maxWork = Math.max(attention, ssm, linear);
  const speedup = attention / ssm;

  return (
    <WidgetCard title="Complexity race: count the work" number="17.3" tryThis={tryThis}>
      <p style={{ margin: "0 0 16px", fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: "var(--text-mid)" }}>
        This is an analytic accounting model, not a hardware benchmark. It counts one width-scaled unit for each causal query-key comparison, and 3 or 5 units per token for two fixed-width scans. Change the context length to see the asymptotic term take over.
      </p>
      <label style={{ display: "block", fontFamily: mono, fontSize: 11, color: "var(--text)", marginBottom: 14 }}>
        context length T = {tokens.toLocaleString()} tokens
        <input aria-label="Context length for complexity comparison" type="range" min="256" max="65536" step="256" value={tokens} onChange={e => setTokens(Number(e.target.value))} style={{ display: "block", width: "100%", marginTop: 8 }} />
      </label>
      <label style={{ display: "block", fontFamily: mono, fontSize: 11, color: "var(--text)", marginBottom: 18 }}>
        mixer width d = {width}
        <input aria-label="Mixer width for complexity comparison" type="range" min="64" max="1024" step="64" value={width} onChange={e => setWidth(Number(e.target.value))} style={{ display: "block", width: "100%", marginTop: 8 }} />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1fr)", gap: 18, background: C.bg, padding: 14, borderRadius: 6 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, marginBottom: 11 }}>PREFILL WORK UNITS</div>
          <Bar label="full attention · T(T+1)/2·d" value={attention} max={maxWork} color={C.accent} />
          <Bar label="SSM scan · 3T·d" value={ssm} max={maxWork} color={C.green} />
          <Bar label="linear attention · 5T·d²" value={linear} max={maxWork} color={C.purple} />
        </div>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, marginBottom: 11 }}>STREAMING STATE UNITS</div>
          <Bar label="attention KV cache · 2T·d" value={attentionMemory} max={attentionMemory} color={C.accent} suffix=" values" />
          <Bar label="scan state · 2d" value={stateMemory} max={attentionMemory} color={C.green} suffix=" values" />
          <Bar label="linear-attention state · d²+d" value={linearMemory} max={attentionMemory} color={C.purple} suffix=" values" />
          <div style={{ marginTop: 18, padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 5, fontFamily: mono, fontSize: 11, color: C.muted, lineHeight: 1.55 }}>
            at this T, pairwise attention has <span style={{ color: C.accent }}>{speedup.toFixed(1)}×</span> the modeled SSM prefill work. The comparison changes with kernels and hardware, but not with the T² versus T dependence.
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
