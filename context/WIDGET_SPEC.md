# darvinyi-textbook — Widget Specification

## Core Philosophy

Every widget has ONE job. It demonstrates ONE concept. The interaction model should be immediately obvious — no instructions needed beyond the control labels.

**Widget = Canvas area + Controls + Stats panel**

Never put explanatory text inside a widget. The prose above the widget does that. The widget just shows.

---

## Widget Interaction Patterns

### Pattern A: Slider-driven animation
User drags a slider → visualization updates immediately (no play button needed).
*Use for:* Activation functions, regularization, polynomial degree, noise level, temperature.

```jsx
// Pattern
const [value, setValue] = useState(defaultVal);
// Canvas redraws on every value change via useEffect([value])
```

### Pattern B: Play/Pause animation
User hits Play → simulation runs frame by frame. User can pause, scrub, reset.
*Use for:* Gradient descent, diffusion process, RNN unrolling, message passing.

```jsx
// Pattern
const [playing, setPlaying] = useState(false);
const [step, setStep] = useState(0);
const animRef = useRef(null);

function animate() {
  setStep(s => s + speed);
  animRef.current = requestAnimationFrame(animate);
}
// Always cancel on unmount: return () => cancelAnimationFrame(animRef.current)
```

### Pattern C: Click-to-place
User clicks on a canvas area → something happens at that point.
*Use for:* Gradient descent (place the ball), decision boundary (add/remove points).

```jsx
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width;   // 0..1
  const ny = (e.clientY - rect.top)  / rect.height;  // 0..1
  // do something with (nx, ny)
});
```

### Pattern D: Selector tabs
User picks from 2-4 discrete options → widget resets or updates.
*Use for:* Optimizer (SGD/Adam/etc), surface preset, activation function selector.

### Pattern E: Hover/inspect
User hovers over a node, edge, or region → tooltip or highlight appears.
*Use for:* Computation graph, attention heatmap, GNN message passing.

---

## Reference Widget: Gradient Descent Navigator (Ch 3, Widget 3.1) — BUILT

**File:** `context/REFERENCE_WIDGET.html` (standalone, fully functional)

This is the gold standard for all animation-style widgets. Every Play/Pause widget should match this quality level.

**What it does:**
- Renders a 2D loss landscape as a color-mapped contour plot (blue=low loss, amber=high loss)
- Places a ball on the surface (default: two-valley preset)
- Animates gradient descent step by step
- Draws a glowing teal trail of the path taken
- Shows live loss curve in a panel below the canvas
- Right stat panel: current loss, step counter, status

**Controls:**
- Optimizer selector tabs: SGD / Momentum / Adam
- Learning rate slider (0.001 → 0.5)
- Speed slider (1 → 20 steps per frame)
- Surface preset buttons: Two Valleys / Saddle Point / Ravine
- Play/Pause button + Reset button
- Click on canvas to place ball at custom starting position

**Key implementation details:**
- Loss surface rendered to offscreen canvas, cached until surface changes
- Numerical gradient via finite differences (h=0.002)
- Adam implemented with proper bias correction
- Divergence detection (loss > 10 → stop, show "diverged!" in red)
- All canvas scaling via getBoundingClientRect() for responsive sizing

---

## Widget Specifications by Chapter

### Chapter 1 — Statistical Learning

#### W1.1 Polynomial Fit
**Concept:** Bias-variance tradeoff, overfitting
**Pattern:** Slider-driven (Pattern A)
**Canvas:** 440×220px scatter plot
- X-axis: 0..1, Y-axis: ~-1..2
- 20 noisy data points (fixed seed) split into train (●) and val (○)
- Fitted polynomial curve updates as degree changes
- Train loss line and val loss line both shown

**Controls:**
- `degree` slider 1→20 (default: 3)
- `noise σ` slider 0→0.5 (default: 0.15)
- `train/val split` slider 50%→90% (default: 80%)

**Stats panel:**
- Train MSE (green when < 0.05)
- Val MSE (red when > 2× train MSE)
- Parameters: degree + 1
- Overfit indicator: "yes" / "no"

**Implementation note:** Use least-squares polynomial fit via Vandermonde matrix. Compute in JS, no external lib needed.

---

#### W1.2 Bias-Variance Decomposition
**Concept:** How bias², variance, and noise sum to total error
**Pattern:** Slider-driven (Pattern A)
**Canvas:** 440×200px area chart (stacked)

- X-axis: model complexity (degree 1→20)
- Y-axis: error magnitude
- Three stacked areas: noise (darkest), variance (mid), bias² (lightest)
- Vertical line at current selected complexity
- Total error = dashed line on top

**Controls:**
- `complexity` slider 1→20 (highlights position on chart)
- `noise level` slider 0→0.5

**Stats panel:**
- Bias² at current complexity
- Variance at current complexity
- Optimal complexity (where total error is minimum)

---

#### W1.3 Regularization Explorer
**Concept:** L1 vs L2 vs elastic net regularization
**Pattern:** Slider-driven (Pattern A)
**Canvas:** Two side-by-side bar charts (280×180 each)
- Left: weight magnitudes (10 bars)
- Right: constraint region (circular for L2, diamond for L1)

**Controls:**
- `regularization type` tabs: L1 / L2 / Elastic Net
- `λ` slider 0→1 (default: 0.1)
- `α` slider for elastic net mixing (shown only when Elastic Net selected)

**Stats panel:**
- Non-zero weights (sparsity)
- L1 norm of weights
- L2 norm of weights

---

#### W1.4 Decision Boundary
**Concept:** How model complexity affects classification boundaries
**Pattern:** Click-to-place + slider (Pattern A + C)
**Canvas:** 440×300px 2D scatter plot, two classes

- Click to add points (alternates between class 0 and class 1)
- Right-click to remove nearest point
- Decision boundary rendered as filled contour

**Controls:**
- `model` tabs: Linear / Polynomial / RBF
- `complexity` slider (degree for poly, γ for RBF)
- `Clear` button

**Stats panel:**
- Training accuracy
- Class 0 count / Class 1 count
- Model type

---

### Chapter 2 — Neural Networks

#### W2.1 Universal Approximation
**Concept:** A single hidden layer can approximate any function
**Pattern:** Slider-driven (Pattern A)
**Canvas:** 440×200px function plot
- Dashed line: target function (user can pick from 3 presets)
- Solid teal line: neural network approximation
- Yellow dots: training data points

**Controls:**
- `hidden units` slider 1→64 (default: 8)
- `depth` slider 1→8 (default: 2)
- `activation` tabs: ReLU / Tanh / Sigmoid
- `target function` tabs: Sine / Sawtooth / Step

**Stats panel:**
- Train loss
- Val loss
- Total parameters
- Current activation

**Implementation:** Precompute approximations for key (units, depth, activation) combinations. Store as lookup table. No actual training at runtime.

---

#### W2.2 Computation Graph & Backprop
**Concept:** Chain rule, gradient flow
**Pattern:** Hover/inspect (Pattern E)
**Canvas:** 560×180px graph visualization

- 4-layer network: input → hidden → hidden → output
- Nodes as circles with activation values
- Edges as lines, width proportional to weight magnitude
- Hover a node → highlight gradient path (teal glow on path, annotation showing ∂L/∂node)
- Click a node → pin the annotation

**Controls:**
- `input values` sliders: x₁ and x₂
- `step` button: animate one forward pass step at a time
- `show gradients` toggle

**No stats panel** — the graph IS the visualization.

---

#### W2.3 Activation Function Zoo
**Concept:** Properties of different nonlinearities
**Pattern:** Selector + slider (Pattern A + D)
**Canvas:** 440×200px function plot

- Plot selected activation function in teal
- Plot its derivative in orange (dashed)
- Mark saturation regions in red (where |f'(x)| < 0.01)
- X-axis: -5..5

**Controls:**
- Function selector buttons (all shown, toggle any on/off):
  Sigmoid / Tanh / ReLU / Leaky ReLU / ELU / GELU / Swish / Mish
- `show derivative` toggle
- `show saturation zones` toggle
- For Leaky ReLU: `α` slider

**Stats panel:**
- Output range
- Is it bounded?
- Gradient at x=0
- Gradient at x=3 (proxy for saturation check)

---

#### W2.4 Loss Function Comparison
**Concept:** How different losses penalize prediction errors differently
**Pattern:** Slider-driven (Pattern A)
**Canvas:** 440×200px, three overlaid curves

- X-axis: predicted value ŷ ∈ [0, 1] (for classification) or ŷ ∈ [-3, 3] for regression
- Y-axis: loss value
- MSE: teal
- Cross-entropy: orange
- Focal loss: purple
- Vertical line: current ŷ (draggable)

**Controls:**
- `true label y` toggle: 0 or 1
- `focal γ` slider 0→5 (default: 2)
- `mode` tabs: Classification / Regression

**Stats panel:**
- MSE at current ŷ
- Cross-entropy at current ŷ
- Focal loss at current ŷ

---

### Chapter 3 — Optimization

#### W3.1 Gradient Descent Navigator — BUILT
See Reference Widget section above. Full implementation in `context/REFERENCE_WIDGET.html`.

When porting to React: extract the canvas drawing logic into `useEffect`, the simulation state into `useState`/`useRef`, and the controls as controlled inputs.

---

#### W3.2 Optimizer Race
**Concept:** How different optimizers navigate the same landscape
**Pattern:** Play/Pause (Pattern B)
**Canvas:** Same loss landscape as W3.1 (Two Valleys default)

Four balls, each a different color:
- SGD: gray
- Momentum: orange
- RMSProp: purple
- Adam: teal

All start at same position. All run simultaneously.

**Controls:**
- `learning rate` slider (same LR for all, to make comparison fair)
- `surface` preset buttons
- `start position` — click to set for all balls simultaneously
- Play/Pause/Reset

**Stats panel:** 4-row table showing current loss for each optimizer, color-coded.

---

#### W3.3 Learning Rate Finder
**Concept:** How LR affects convergence — sweet spot, instability, divergence
**Pattern:** Slider-driven (Pattern A)
**Canvas:** 440×200px loss vs LR plot (log-scale x-axis)

- X-axis: LR from 1e-5 to 10 (log scale)
- Y-axis: loss after 50 steps from fixed starting point
- Curve colored: green (good) → yellow (unstable) → red (diverged)
- Vertical line at selected LR

**Controls:**
- `current LR` slider (log scale, maps to 1e-5..10)
- `surface` tabs

**Stats panel:**
- Loss at selected LR
- Recommendation: "good" / "too low" / "unstable" / "diverged"

---

#### W3.4 LR Schedule Visualizer
**Concept:** How learning rate changes over training with different schedules
**Pattern:** Slider-driven (Pattern A)
**Canvas:** 440×180px, LR over steps

All 4 schedules shown as overlaid curves:
- Step decay: gray
- Cosine annealing: teal
- Linear warmup + decay: orange
- OneCycleLR: purple

**Controls:**
- `total steps` slider 100→2000
- `warmup steps` slider 0→500
- `base LR` slider 0.0001→0.1
- `highlight` tabs to emphasize one schedule

**Stats panel:**
- LR at step 0
- LR at step N/2
- LR at step N

---

#### W3.5 Adam Internals
**Concept:** First and second moment estimation inside Adam
**Pattern:** Slider-driven (Pattern A)
**Canvas:** 440×220px, three sub-plots vertically stacked:
1. Gradient gₜ over steps
2. First moment m̂ₜ over steps
3. Second moment v̂ₜ over steps

Vertical line at current step t.

**Controls:**
- `step t` slider 1→200
- `β₁` slider 0.5→0.999 (default: 0.9)
- `β₂` slider 0.9→0.9999 (default: 0.999)
- `gradient pattern` tabs: constant / oscillating / sparse

**Stats panel:**
- mₜ (raw first moment)
- m̂ₜ (bias-corrected)
- vₜ (raw second moment)
- v̂ₜ (bias-corrected)
- Effective LR = α / (√v̂ₜ + ε)

---

## Available Pixel Budget (inside WidgetCard body)

Chain of constraints subtracted from the 740px content column:

| Layer | Width |
|---|---|
| Content padding (44px × 2 subtracted) | 652px inner |
| WidgetCard body padding (18px × 2 subtracted) | **616px usable** |
| With 160px stats panel + 12px gap subtracted | **~444px for canvas** |
| With no stats panel | **~616px for canvas** |

Use these numbers — not idealized widths — when sizing SVG coordinate spaces.
Widget specs may state a target coordinate space (e.g. "620×340") but the
rendered canvas will be narrower; use viewBox to bridge the gap (see below).

---

## Layout Pre-flight Check (do this before writing any JSX)

Before committing to a column layout, verify every flex panel will be at least
**180px wide** — the minimum for readable bar charts, routing diagrams, and
labeled content. Do the arithmetic explicitly:

```
usable width  =  616px
− fixed columns  (face canvases, image panels — each has a known px width)
− gaps           (8px × number of gaps between columns)
÷ flex columns   (panels that share remaining space equally)
= width per flex panel   ← must be ≥ 180px
```

**Worked examples:**

```
3-col widget (face 110px + CNN + CapsNet) WITH a 166px side stats panel:
  616 − 110 − 166 − 8×3 = 316px ÷ 2 = 158px  ✗  too narrow → move stats below

3-col widget (face 110px + CNN + CapsNet) WITHOUT side stats panel:
  616 − 110 − 8×2 = 490px ÷ 2 = 245px  ✓  comfortable
```

**Minimum widths by content type:**

| Content type | Min width |
|---|---|
| Labeled bar chart (feature bars + score box) | 180px |
| Routing / graph diagram | 180px |
| Line / scatter chart with labeled axes | 220px |
| Face or image canvas (labels inside SVG) | 100px |
| Right-side stat panel (vertical) | 160px |

**Column count → stats placement decision:**

| Visual columns in the widget | Stats go… |
|---|---|
| 1 canvas | Right-side panel (180px wide) |
| 2 side-by-side charts | Below as a horizontal strip |
| 3+ columns (including any fixed-width image/face panel) | **Always below** — a side panel will push at least one flex column below 180px |

If the math passes but any column feels visually cramped at its computed width,
switch to the stats-below layout before writing code, not after.

**Side-by-side SVG panels count as one visual column** (they live in one `<svg>` element).
Apply the same flex-column check to the SVG container, not its internal panels.

---

## Stats Panel Placement Rule

**Single canvas → stats panel on the right (180px wide, vertical column)**
The canvas gets ~444px. Use this layout for all widgets with one chart.

```jsx
<div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
  <div style={{ flex: 1, minWidth: 0 }}>  {/* canvas */} </div>
  <div style={{ width: 180, flexShrink: 0 }}>  {/* stats */} </div>
</div>
```

**Two side-by-side charts, OR canvas needs more than ~450px, OR three or more
visual columns → stats panel below (full-width horizontal row)**
The canvas gets the full 616px. Stats are a flex row of labeled values separated by 1px vertical dividers.

```jsx
{/* Charts: full width */}
<div style={{ display: 'flex' }}>
  <canvas style={{ width: '50%' }} />
  <canvas style={{ width: '50%' }} />
</div>

{/* Stats: horizontal row below */}
<div style={{ display: 'flex', gap: '16px', alignItems: 'center',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '10px 16px', flexWrap: 'wrap' }}>
  <StatCell label="Loss"  val="2.341" />
  <div style={{ width:1, background:'var(--border)', alignSelf:'stretch' }} />
  <StatCell label="Step"  val="142" />
</div>
```

Decision rule: if the widget spec describes two or more charts side by side, or
has any fixed-width image/face column alongside two flex panels, always use the
below layout. A side panel next to three columns leaves each flex column ~158px
wide — too narrow for labeled content.

**Stats strip cell budget — verify before writing JSX:**

SVG text does not wrap, and JetBrains Mono is exactly 0.6× font-size per character.
At the standard 8.5px label / 12px value pairing:

| Text | px/char | "coverage" (8) | "σ" (1) | "valid" (5) | "~15%" (4) |
|---|---|---|---|---|---|
| Label 8.5px | 5.1 | 41px | 5px | — | — |
| Value 12px | 7.2 | — | — | 36px | 29px |

Cell min-width = max(label width, value width). Always use the **longest possible value**
(e.g. "valid", not "—") — dynamic content determines the real minimum.

Section min-width = Σ(cell widths) + (N−1) × gap + 2 × padding

With k equal `flex:1` sections: each gets ≈ 616/k px. Verify:

```
section_min_width ≤ (616/k) − 20px slack
```

**Target constraints:** ≤ 4 cells per section · labels ≤ 4 chars · gap: 8–10 · padding: 10–12px.
A 4-cell section at these constraints (σ, cov, gap, last) needs ~155px — comfortably
under the 205px from three equal flex sections.

**What breaks it:** `gap: 16` + `padding: 14px` + 4 cells with labels like "coverage" (8 chars)
pushes section min-width to ~236px, exceeding the ~205px budget. Always compute before coding.

---

## SVG Sizing Rule (mandatory for all SVG-based widgets)

Never give an SVG a fixed `width` attribute in pixels. Always pair a `viewBox`
with `width="100%"` so the SVG scales to its flex container. Height is derived
automatically from the viewBox aspect ratio — no explicit `height` needed.

```jsx
// ✅ Correct — responsive, never clips
<svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>

// ❌ Wrong — clips when container is narrower than W
<svg width={W} height={H} style={{ maxWidth: '100%' }}>
```

The `viewBox` values define the internal coordinate space (use the spec's target
dimensions there). All internal coordinates, font sizes, and positions are
expressed in those units and scale proportionally when rendered.

---

## SVG Text Constraints

SVG text does not wrap. Every string must fit inside its panel's clip region or it gets cut off.

**Character budgets** (in viewBox units, for a 280px-wide panel):

| Font | Size | px/char | Budget (280px panel) |
|---|---|---|---|
| Inter (proportional, ~avg) | 12 | ~6.0 | ~46 chars |
| Inter (proportional, ~avg) | 13 | ~6.5 | ~43 chars |
| JetBrains Mono | 9 | 5.4 | ~51 chars |
| JetBrains Mono | 8 | 4.8 | ~58 chars |

For `textAnchor="middle"` text at anchor position `x` inside a panel, check both sides:

```
left_edge  = x − (char_count × px_per_char) / 2   must be ≥ panel_left + margin
right_edge = x + (char_count × px_per_char) / 2   must be ≤ panel_right − margin
```

**Rules:**
- Panel titles: ≤ 22 chars at fontSize 12–13 (centered safely in 280px panel).
- Inline annotations (gap labels, path notes): ≤ 18 chars; compute both edges explicitly.
- If text is placed off-center (near a computed path midpoint), anchor_x may be far from
  the panel center — double-check the left edge especially.
- If a label doesn't fit on one line, abbreviate. There is no SVG text wrapping.

---

## Side-by-Side SVG Panel Spacing

For two panels inside one SVG (before/after, AE/VAE, compare layouts), keep gaps tight:

| Parameter | Recommended | Avoid |
|---|---|---|
| Inter-panel gap | 20–24px (viewBox) | 60px — wastes ~10% of viewBox width |
| Inner side margin | 12px per side | 20px — shrinks drawing area by 16px per panel |
| Coordinate area | panel_width − 2×12 = 256px (in 280px panel) | 240px |

**Standard two-panel layout (VW = 580):**

```js
const PL_LEFT  = 0;     // panel 0 left edge
const PL_RIGHT = 300;   // 280px panel + 20px gap
const VW = 580;         // 280 + 20 + 280

function px(x, panelLeft) { return panelLeft + 12 + ((x+1)/2) * 256; }
function py(y)             { return 20 + ((1-y)/2) * 260; }          // 20px top for title

// sigmaToRxRy: rx = 2 * sigma * 128  (half of 256)
//              ry = 2 * sigma * 130  (half of 260)
```

Panel titles centered at `panelLeft + 140`. Result labels at `panelLeft + 140, y = VH - 8`.

---

## Implementation Rules for All Widgets

### Canvas sizing
```jsx
// Always use getBoundingClientRect for responsive sizing
useEffect(() => {
  const canvas = canvasRef.current;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
}, []);
```

### Animation cleanup
```jsx
// Always cancel animation frames on unmount
useEffect(() => {
  return () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };
}, []);
```

### No runtime ML
```jsx
// ❌ Never do this
const model = tf.sequential();
model.fit(data, labels); // TOO SLOW, wrong tool

// ✅ Do this instead
// Precompute mathematically or use lookup tables
const output = polynomial(x, degree, coefficients);
```

### Color consistency
```jsx
const COLORS = {
  accent: '#2dd4bf',
  math: '#fbbf24',
  green: '#34d399',
  red: '#f87171',
  orange: '#fb923c',
  purple: '#a78bfa',
  border: '#242424',
  codeBg: '#0a0a0a',
};
```

### Stat coloring
```jsx
// Color stat values based on meaning
const lossColor = loss < 0.05 ? COLORS.green 
                : loss > 2    ? COLORS.red 
                : COLORS.accent;
```

### Controls row budget

Every `flexShrink: 0` item (button, label, divider) consumes fixed width. The remainder
goes to `flex: 1` sliders. Sliders need at least **80px** to be usable.

At JetBrains Mono 11px (6.6px/char) with `padding: '5px 12px'`:

| Item | Formula | Typical |
|---|---|---|
| Button "Sample" | 6×6.6 + 24px pad + 2px border | ~66px |
| Button "Clear"  | 5×6.6 + 24px pad + 2px border | ~59px |
| Text label      | chars × 6.6px | keep ≤ 12 chars → ≤ 79px |
| Gap between items | flex gap | 8–10px each |

```
slider_width = 616 − Σ(fixed_widths) − Σ(gaps)   must be ≥ 80px
```

**Keep control labels short.** "A→B t=0.00" (10 chars, ~66px) vs
"Interpolate A → B  t=0.00" (26 chars, ~172px) — the longer form leaves only
~106px less for the slider and can overflow at the widget's 616px boundary.

Add `minWidth: 80` to the slider element as a safety floor.
