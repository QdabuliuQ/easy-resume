---
name: EasyResume (青松简历)
description: Soft-depth resume editor with pine teal accent and floating tool surfaces
colors:
  pine-teal: "#0e9c8d"
  soft-mint: "#8de3a4"
  shell-ink: "#120f12"
  shell-light: "#ffffff"
  ink-plum: "#1e1a21"
  panel-dark: "#281f2b"
  panel-dark-soft: "#1f1c22"
  text-on-dark: "#f5f5f5"
  text-on-light: "#1e1a21"
typography:
  display:
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif"
    fontSize: "clamp(2.25rem, 4vw + 1rem, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.pine-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.pine-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-plum}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
    height: "36px"
  chip-accent:
    backgroundColor: "#8de3a41f"
    textColor: "{colors.pine-teal}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  card-panel:
    backgroundColor: "{colors.panel-dark}"
    textColor: "{colors.text-on-dark}"
    rounded: "{rounded.lg}"
    padding: "24px"
  nav-pill:
    backgroundColor: "#ffffff0d"
    textColor: "{colors.text-on-dark}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "36px"
  input-field:
    backgroundColor: "#2a2a2a"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: "40px"
---

# Design System: EasyResume (青松简历)

## 1. Overview

**Creative North Star: "The Soft Depth Editor"**

青松简历的视觉系统像一张带景深的工作台：表面柔软、层级清楚，深度只为证明「这是真工具」，不为装饰堆雾。气质对齐 PRODUCT 的轻快 · 利落 · 有景深，偏 Arc / Raycast 的浮层与交互趣味，情绪目标是轻松自信、想动手试，而不是被企业官网压住。

密度上，营销页留白服务于首屏演示焦点；编辑器壳层用 tonal 面板与抬起阴影区分画布、侧栏与浮层。主色 Pine Teal 以渐变 CTA 与焦点环出现，稀少而清晰。系统明确拒绝紫粉渐变通用 SaaS 落地页、满屏装饰性玻璃拟态、Hero 堆大数字/统计条、霓虹赛博/过度发光、默认 Inter 味千篇一律卡片栅格，以及弹跳、弹性过度的动效。

**Key Characteristics:**
- Soft depth: 景深服务焦点，浮层即可信
- Pine teal accent on ink/light shells with dual theme polarity
- Soft radii (12–16px) and magnetic, non-bouncy motion
- Demo-first marketing: real editor preview over abstract feature grids

## 2. Colors

Teal-mint accent on polarity-flipped ink and paper shells; chroma stays calm, never neon.

### Primary
- **Pine Teal** (#0e9c8d / `var(--color-primary)`): Primary actions, focus rings, selected states, icon accents. Carries the brand without drowning surfaces.
- **Soft Mint** (#8de3a4 / `var(--color-primary-gradient-start)`): Gradient start, badge tints, highlight washes. Always paired with Pine Teal in `--gradient-primary` (90deg Soft Mint → Pine Teal).

### Neutral
- **Shell Ink** (#120f12 / `var(--editor-shell-bg)` dark): Dark-theme page and editor chrome.
- **Shell Light** (#ffffff): Light-theme page chrome.
- **Ink Plum** (#1e1a21 / `rgb(30 26 33)`): Light-theme foreground polarity; never pure black.
- **Panel Dark** (#281f2b approx / `var(--editor-shell-panel-strong)`): Elevated panels on dark shell.
- **Panel Dark Soft** (#1f1c22 approx / `var(--editor-shell-panel)`): Secondary panel fill.
- **Text Strong / Base / Muted / Soft**: Opacity steps on `--surface-fg-rgb` (0.96 → 0.42 dark; 0.92 → 0.42 light).

### Named Rules
**The Soft Depth Accent Rule.** Pine Teal + Soft Mint appear as CTA gradients, focus rings, and sparse tints. They never become a full-bleed purple-to-indigo or pink SaaS wash.

**The Polarity Rule.** Dark and light flip `--surface-fg-rgb` and shell surfaces; primary teal stays identical across themes.

## 3. Typography

**Display Font:** system-ui (with Avenir, Helvetica, Arial)
**Body Font:** system-ui (same stack)
**Label/Mono Font:** same sans; labels use tracking, not a second family

**Character:** One committed UI sans with weight and size contrast. Resume canvas may load Noto Sans/Serif SC for document fidelity; chrome stays system-ui.

### Hierarchy
- **Display** (600, `clamp(2.25rem, 4vw + 1rem, 3.75rem)`, ~1.15, tracking -0.03em): Marketing hero titles.
- **Headline** (600, ~1.75rem, 1.25): Section titles (features, FAQ).
- **Title** (600, ~1.25rem, 1.3): Card and module headings.
- **Body** (400, 15–17px, 1.7): Supporting copy; cap ~54–62ch on marketing.
- **Label** (600, 11px, tracking 0.14em): Badges and eyebrow chips; short strings only.

### Named Rules
**The One-Family Chrome Rule.** UI chrome does not introduce display serifs or Inter-as-identity. Hierarchy comes from scale and weight inside system-ui.

## 4. Elevation

**Lifted.** Shadows are structural: floating panels, hero preview, modals, and hover lift prove tool depth. Tonal fills (`panel`, `panel-strong`, soft borders) support the stack, but large interactive surfaces earn real shadow.

### Shadow Vocabulary
- **Shell Lift** (`box-shadow: 0 24px 80px rgb(0 0 0 / 0.38)` dark / `0 18px 48px rgb(30 26 33 / 0.1)` light): Editor shell and major elevated regions (`--editor-shell-shadow`).
- **Preview Depth** (`0 28px 80px rgb(0 0 0 / 0.45)`): Hero compare figure; the product demo plane.
- **Panel Hover** (`0 12px 32px rgb(var(--surface-fg-rgb) / 0.06–0.12)`): FAQ/details and compact menus.
- **Float Control** (`0 10px 28px rgb(0 0 0 / 0.32)` dark): Canvas float buttons.
- **CTA Soft** (`0 16px 40px rgb(var(--surface-fg-rgb) / 0.12)`): Primary start button resting glow.

### Named Rules
**The Lifted Workbench Rule.** If a surface is meant to feel like a tool layer (preview, modal, floating action), it must lift. Decorative glass blur alone is not elevation.

## 5. Components

Feel: magnetic and crisp, soft radii, gradient primary CTA. Motion eases out (`cubic-bezier(0.22, 1, 0.36, 1)` / GSAP `power2.out`–`power3.out`); never bounce or elastic.

### Buttons
- **Shape:** Soft rectangle (12px / `rounded-xl`) for primary; pills (`rounded-full`) for nav utility.
- **Primary:** Soft Mint → Pine Teal gradient (`var(--gradient-primary)`), white label, height ~48px, padding ~12×24. Optional magnetic follow on marketing CTA.
- **Hover / Focus:** Brightness or shadow deepen; focus-visible ring `color-mix(primary 58%, transparent)` with 2px offset on shell bg.
- **Ghost / Nav pills:** Border `fg/14`, fill `fg/5–6`, 36px height.

### Chips
- **Style:** Pill with Soft Mint wash border/background mix; 11px tracked label.
- **State:** Static badges on hero; module tags use `border-fg/12` + `bg-fg/4`.

### Cards / Containers
- **Corner Style:** 16px (`rounded-2xl`) for feature modules; 12px for FAQ items.
- **Background:** `var(--editor-shell-panel)` / `panel-strong`.
- **Shadow Strategy:** Lifted on hover or open; see Elevation.
- **Border:** `var(--editor-shell-border)` or `fg/08–12`.
- **Internal Padding:** 20–40px depending on density.

### Inputs / Fields
- **Style:** Dark compact Ant fills (`#2a2a2a`) on dark; light theme flips to paper surfaces with `fg/18` borders.
- **Focus:** Primary-tinted ring; no neon glow bloom.
- **Error / Disabled:** Rose/amber panel tones exist for status; disabled opacity ~0.45–0.7.

### Navigation
- Fixed top bar, `backdrop-blur-xl`, shell bg at ~80% opacity. On scroll, border strengthens and a soft primary-tinted gradient wash appears. Brand mark left; GitHub/lang/theme/auth as compact pills right.

### Signature: Hero Preview Compare
Full-bleed tool demo with light/dark split slider, soft 16px radius, Preview Depth shadow, optional pointer tilt after intro. Depth sells the product; the slider must stay keyboard operable.

## 6. Do's and Don'ts

### Do:
- **Do** lead marketing with a real editor/resume preview (演示即产品).
- **Do** use Soft Mint → Pine Teal only on primary CTAs and sparse accents.
- **Do** lift tool surfaces with structural shadows; keep ease-out motion under ~800ms for entrances.
- **Do** honor `prefers-reduced-motion` by jumping to final opacity/transform states.
- **Do** keep light-theme ink as Ink Plum (#1e1a21), never `#000`.
- **Do** keep the homepage (`/`) as the primary marketing surface; major layout changes ship there directly.

### Don't:
- **Don't** ship 紫粉渐变通用 SaaS 落地页.
- **Don't** use 满屏装饰性玻璃拟态 as the default treatment.
- **Don't** stack Hero 大数字 / 统计条 as proof.
- **Don't** use 霓虹赛博 / 过度发光.
- **Don't** default to Inter-as-brand or 千篇一律卡片栅格 (icon + title + blurb × N).
- **Don't** use 弹跳、弹性过度的动效 (no bounce/elastic easings).
- **Don't** use side-stripe accents (`border-left` > 1px) or gradient-clipped text.
- **Don't** animate layout properties (`width`/`height`/`top`/`left`) when transform/opacity suffice.
