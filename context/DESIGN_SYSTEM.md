# darvinyi-textbook — Design System

## Color Palette

```css
:root {
  --bg:           #0d0d0d;   /* Near-black background */
  --bg2:          #111111;   /* Surface: cards, sidebar */
  --bg3:          #161616;   /* Elevated surface */
  --bg4:          #1e1e1e;   /* Inputs, inactive controls */
  --border:       #242424;   /* Subtle borders */
  --border-lt:    #2e2e2e;   /* Hover borders */
  --text:         #e8eaed;   /* Primary text */
  --text-muted:   #555555;   /* Disabled / placeholder */
  --text-mid:     #888888;   /* Secondary text, metadata */
  --accent:       #2dd4bf;   /* Teal — primary accent, interactive elements */
  --accent-dim:   #0b2422;   /* Teal background, active state fills */
  --accent-glow:  rgba(45,212,191,0.15); /* Glow for slider thumbs, active nodes */
  --math-color:   #fbbf24;   /* Amber — math notation, formulas */
  --green:        #34d399;   /* Success, converged, good metrics */
  --red:          #f87171;   /* Error, diverged, bad metrics */
  --orange:       #fb923c;   /* Warnings, seminal paper tags */
  --purple:       #a78bfa;   /* Paper tags, part II color */
  --code-bg:      #0a0a0a;   /* Canvas areas, code blocks */
  --widget-bg:    #111111;   /* Widget card background */
}
```

## Typography

```css
/* Fonts — load via Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');

/* Usage */
body           { font-family: 'Inter', sans-serif; }           /* All prose */
h1, h2, h3     { font-family: 'Crimson Pro', serif; }          /* Chapter/section titles */
code, .math    { font-family: 'JetBrains Mono', monospace; }   /* Math, code, labels, stats */
```

### Type Scale
| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Chapter title | Crimson Pro | 42px | 600 | --text |
| Section title | Crimson Pro | 26px | 600 | --text |
| Chapter eyebrow | JetBrains Mono | 10.5px | 400 | --accent (70% opacity) |
| Body prose | Inter | 15px | 400 | #b8c4cc |
| Inline math | JetBrains Mono | 12.5px | 400 | --math-color |
| Widget label | JetBrains Mono | 9.5px | 600 | --accent |
| Control label | JetBrains Mono | 11px | 400 | --text-muted |
| Sidebar item | Inter | 12px | 400 | --text-mid |
| Citation meta | Inter | 11px | 400 | --text-muted (italic) |

## Layout

```
┌─────────────────────────────────────────────────────┐
│ TOPBAR (52px sticky)                                │
├──────────────┬──────────────────────────┬───────────┤
│ SIDEBAR      │ CONTENT (max-width 740px)│ TOC RAIL  │
│ (252px)      │ centered in flex:1       │ (180px)   │
│ sticky       │                          │           │
│              │                          │           │
└──────────────┴──────────────────────────┴───────────┘
```

- Content column: `max-width: 740px`, `padding: 52px 44px 100px`
- Sidebar: `width: 252px`, sticky, scrollable
- TOC rail: `width: 180px`, sticky, right border

## Widget Card Anatomy

```
┌─────────────────────────────────────────────────────┐
│ [Interactive] Widget Title                    2.1   │  ← header (bg2)
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌───────────────┐   │
│ │   CANVAS AREA (code-bg)     │ │  STAT PANEL   │   │
│ │   SVG or Canvas element     │ │  ─────────    │   │
│ │   height varies by widget   │ │  Loss  0.004  │   │
│ └─────────────────────────────┘ │  Step  42/200 │   │
│                                 └───────────────┘   │
│ ── CONTROLS ─────────────────────────────────────   │
│ label   [name  val] ════════════○═══════════         │
│ label   [name  val] ═══════○════════════════         │
└─────────────────────────────────────────────────────┘
```

### Widget Header
```css
.widget-header {
  padding: 12px 18px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 10px;
}
.widget-pill { /* "Interactive" label */
  font-size: 9.5px; font-weight: 600; letter-spacing: .1em;
  text-transform: uppercase; color: var(--accent);
  background: var(--accent-dim); padding: 2px 8px; border-radius: 3px;
}
```

### Range Sliders
```css
input[type=range] {
  -webkit-appearance: none; height: 2px;
  background: var(--border-lt); border-radius: 2px; cursor: pointer;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 12px; height: 12px;
  border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 6px var(--accent-glow);
}
```

### Stat Panel
```css
.stat-panel {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 8px; padding: 14px 16px;
}
.stat-val { font-family: 'JetBrains Mono'; font-size: 22px; color: var(--accent); }
.stat-val.green { color: var(--green); }
.stat-val.red   { color: var(--red); }
```

## Math Notation

### Inline math
```html
<span class="math">z = Wx + b</span>
```
```css
.math {
  font-family: 'JetBrains Mono'; font-size: 12.5px;
  background: var(--code-bg); border: 1px solid var(--border-lt);
  padding: 1px 7px; border-radius: 4px; color: var(--math-color);
}
```

### Block math
```html
<div class="math-block">
  ∂L / ∂W<sup>(ℓ)</sup> = δ<sup>(ℓ)</sup> · (a<sup>(ℓ−1)</sup>)<sup>T</sup>
</div>
```
```css
.math-block {
  background: var(--code-bg); border: 1px solid var(--border);
  border-radius: 8px; padding: 18px 24px; margin: 24px 0;
  font-family: 'JetBrains Mono'; font-size: 13px;
  color: var(--math-color); text-align: center; line-height: 2;
}
```

## Section Structure Pattern

Every chapter page follows this exact structure:

```html
<!-- Chapter header -->
<div class="chapter-eyebrow">Chapter 02 · Foundations</div>
<h1 class="chapter-title">Neural Networks</h1>
<p class="chapter-lede">One paragraph, max. Distill.pub style.</p>

<!-- Alternating: prose → widget → prose → widget -->
<h2 class="section-title">The Forward Pass</h2>
<p class="prose">2-4 sentences. Minimal. Link to widget below.</p>
<div class="widget-card">...</div>

<h2 class="section-title">Backpropagation</h2>
<p class="prose">...</p>
<div class="math-block">...</div>
<p class="prose">...</p>
<div class="widget-card">...</div>

<!-- Citations at bottom -->
<div class="citations-section">...</div>
```

## Sidebar Navigation

### Part color coding
```
Part I   (Foundations)       → --accent (teal)   bg: #0d2e2b
Part II  (Architectures)     → --purple           bg: #1e1a2e
Part III (Generative)        → --orange           bg: #2e1a0d
Part IV  (Advanced)          → --green            bg: #0d2e1a
Part V   (RL)                → --pink #f472b6     bg: #2e0d1a
Part VI  (Agents)            → --sky #38bdf8      bg: #0d1a2e
```

### Active state
```css
.sidebar-item.active {
  color: var(--accent);
  background: var(--accent-dim);
  border-left: 2px solid var(--accent);
}
```

## Citations Format

```html
<div class="citation">
  <span class="cite-num">[1]</span>
  <div class="cite-body">
    <div class="cite-title">Paper Title</div>
    <div class="cite-meta">Authors — Venue, Year</div>
  </div>
  <span class="cite-tag seminal">seminal</span>  <!-- or: paper, survey -->
</div>
```

```css
.cite-tag.seminal { background: #2e1a0d; color: var(--orange); }
.cite-tag.survey  { background: #0d2e2b; color: var(--accent); }
.cite-tag.paper   { background: #1a1a2e; color: var(--purple); }
```

## Component Library (reusable)

### Selector Tabs (optimizer, preset switcher)
```html
<div class="tab-group">
  <div class="tab active" data-val="sgd">SGD</div>
  <div class="tab" data-val="adam">Adam</div>
  <div class="tab" data-val="rmsprop">RMSProp</div>
</div>
```

### Preset Buttons (surface presets, etc.)
```html
<div class="preset-btn active" data-preset="two-valleys">Two Valleys</div>
<div class="preset-btn" data-preset="saddle">Saddle Point</div>
```

### Play/Pause/Reset Row
```html
<div class="play-row">
  <div class="btn primary" id="play-btn" onclick="togglePlay()">▶ Play</div>
  <div class="btn" onclick="reset()">↺</div>
</div>
```

## Scrollbar
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-lt); border-radius: 2px; }
```

## Anti-Patterns (never do these)

- ❌ White or light backgrounds anywhere
- ❌ Inter for chapter titles (use Crimson Pro)
- ❌ Colored backgrounds for prose text
- ❌ More than 2-3 sentences of prose between widgets
- ❌ Widget cards without the pill label + number
- ❌ Math rendered as plain text without the `.math` class
- ❌ Stat values without JetBrains Mono
- ❌ Purple/gradient hero aesthetics (this is a textbook, not a landing page)
- ❌ Borders thicker than 1px
- ❌ Box shadows other than `0 8px 40px rgba(0,0,0,0.6)`
- ❌ Committing to a column layout without first doing the pixel-budget arithmetic
  (see "Layout Pre-flight Check" in WIDGET_SPEC.md — every flex panel must be ≥ 180px)
- ❌ Right-side stats panel when the widget has 3 or more visual columns —
  the remaining flex panels will be ~158px wide, too narrow for labeled content
- ❌ Stats strip cells with `gap > 10` without first computing section min-width —
  `gap:16` + `padding:14px` + 4 cells regularly exceeds the ~205px each flex section gets
- ❌ Stat cell labels longer than 4–5 chars ("coverage", "sigma", "sample") —
  the label often sets the minimum cell width; use σ, cov, gap, last instead
- ❌ SVG annotation text longer than ~18 chars without checking that anchor_x ± half_width
  stays inside the panel clip region (SVG text never wraps)
- ❌ Inter-panel gaps of 60px in side-by-side SVG layouts — use 20–24px viewBox units
- ❌ Inner panel margins of 20px — use 12px; the saved 8px × 2 expands the drawing area
  from 240px to 256px per 280px panel (7% more usable coordinate space)
- ❌ Control row labels with `flexShrink: 0` longer than ~12 chars at mono 11px —
  each extra char costs ~6.6px of slider space; keep labels to the point
