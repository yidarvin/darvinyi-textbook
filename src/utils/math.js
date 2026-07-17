// Small math helpers duplicated across widgets (see CRITIQUE.md M-07).
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function softmax(arr) {
  const mx = Math.max(...arr);
  const ex = arr.map(v => Math.exp(v - mx));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map(v => v / sum);
}
