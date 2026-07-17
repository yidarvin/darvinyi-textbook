// Canonical seeded PRNG, consolidated from src/components/widgets/ch20/ForwardDiffusion.jsx
// (the version other widgets' own comments already cite as the house
// convention). Verified byte-for-byte behaviorally identical, across
// seed=42, 0, 1000, -5, 4294967295, and 12345, to the ~20 formatting
// variants it replaces (see CRITIQUE.md M-07) — the duplication had already
// drifted cosmetically, but never numerically.
export function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Standard normal sample via Box-Muller, driven by a mulberry32-style
// uniform generator (rng() -> [0,1)).
export function gaussian(rng, mu = 0, sigma = 1) {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1));
  const theta = 2 * Math.PI * u2;
  return mu + sigma * r * Math.cos(theta);
}
