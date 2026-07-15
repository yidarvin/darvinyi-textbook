import { useMemo, useState } from "react";
import WidgetCard from "../../shared/WidgetCard";

const C = { accent: "var(--accent)", green: "var(--green)", purple: "var(--purple)", orange: "var(--orange)", border: "var(--border)", muted: "var(--text-muted)" };
const mono = "'JetBrains Mono', monospace";

const TYPES = {
  attention: { label: "attention", color: C.accent, params: 1.35, kv: 1, recall: 1.0 },
  ssm: { label: "SSM", color: C.green, params: 0.95, kv: 0.04, recall: 0.54 },
  mlp: { label: "MLP", color: C.purple, params: 1.15, kv: 0, recall: 0.12 },
};

function Button({ type, active, onClick }) {
  const cfg = TYPES[type];
  return <button type="button" onClick={onClick} style={{ padding: "6px 10px", borderRadius: 4, border: `1px solid ${active ? cfg.color : C.border}`, background: active ? "var(--bg3)" : "var(--bg4)", color: active ? cfg.color : C.muted, fontFamily: mono, fontSize: 10, cursor: "pointer" }}>{cfg.label}</button>;
}

export default function HybridLayerMixer({ tryThis }) {
  const [layers, setLayers] = useState(["ssm", "mlp", "ssm", "mlp", "attention", "mlp", "ssm", "mlp"]);
  const stats = useMemo(() => {
    const typeStats = layers.map(x => TYPES[x]);
    const attention = layers.filter(x => x === "attention").length;
    const params = typeStats.reduce((sum, x) => sum + x.params, 0);
    const kv = typeStats.reduce((sum, x) => sum + x.kv, 0);
    // A disclosed heuristic, not a model-quality measurement: exact lookup
    // has a high ceiling when an attention layer is present, while recurrent
    // layers provide a lower, distributed long-context signal.
    const recall = Math.min(100, 18 + attention * 42 + layers.filter(x => x === "ssm").length * 4);
    return { attention, params, kv, recall };
  }, [layers]);
  const setLayer = (i, type) => setLayers(old => old.map((x, j) => j === i ? type : x));

  return (
    <WidgetCard title="Hybrid layer mixer: spend attention selectively" number="17.4" tryThis={tryThis}>
      <p style={{ margin: "0 0 15px", fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.55, color: "var(--text-mid)" }}>
        Choose the token mixer in each of eight toy blocks. Parameter units and KV-state units are relative accounting units. The recall score is an explicitly illustrative heuristic: attention layers provide a larger exact-lookup contribution, while SSM layers contribute a small distributed-memory contribution.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(130px, 1fr))", gap: 8, marginBottom: 16 }}>
        {layers.map((type, i) => <div key={i} style={{ padding: 9, border: `1px solid ${C.border}`, borderRadius: 5, background: "var(--code-bg)" }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, marginBottom: 7 }}>block {i + 1}</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{Object.keys(TYPES).map(option => <Button key={option} type={option} active={type === option} onClick={() => setLayer(i, option)} />)}</div>
        </div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(105px, 1fr))", gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 5, overflow: "hidden" }}>
        {[
          ["attention blocks", stats.attention, C.accent],
          ["relative parameters", `${stats.params.toFixed(2)}u`, C.purple],
          ["KV state / token", `${stats.kv.toFixed(2)}u`, C.orange],
          ["long-context recall", `${stats.recall}%`, C.green],
        ].map(([label, value, color]) => <div key={label} style={{ padding: "11px 10px", background: "var(--bg3)" }}><div style={{ fontFamily: mono, fontSize: 9, color: C.muted }}>{label}</div><div style={{ fontFamily: mono, fontSize: 15, color, marginTop: 5 }}>{value}</div></div>)}
      </div>
      <button type="button" onClick={() => setLayers(["ssm", "mlp", "ssm", "mlp", "attention", "mlp", "ssm", "mlp"])} style={{ marginTop: 12, border: `1px solid ${C.border}`, background: "var(--bg4)", color: C.muted, borderRadius: 4, padding: "5px 9px", fontFamily: mono, fontSize: 10, cursor: "pointer" }}>restore hybrid preset</button>
    </WidgetCard>
  );
}
