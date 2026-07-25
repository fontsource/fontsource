---
name: Fontsource
description: "A light-first Open Font Workbench: calm, precise, and approachable tools for discovering and self-hosting open-source type."
colors:
  fontsource-violet: "#625BF8"
  fontsource-violet-deep: "#473EF6"
  fontsource-violet-dark: "#7C76FF"
  ink-navy: "#01112C"
  cloud-paper: "#F5F7F9"
  cool-mist: "#E6EBF0"
  canvas-white: "#FFFFFF"
  night-surface: "#121B31"
  night-chrome: "#0F1626"
  border-light: "#E1E3EC"
  border-dark: "#2C3651"
  code-lavender: "#C2BFFF"
typography:
  display:
    fontFamily: "IBM Plex Sans Variable, sans-serif"
    fontSize: "42px"
    fontWeight: 700
    lineHeight: 1.12
  headline:
    fontFamily: "IBM Plex Sans Variable, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "IBM Plex Sans Variable, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "IBM Plex Sans Variable, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  reading:
    fontFamily: "IBM Plex Sans Variable, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.75
  control:
    fontFamily: "IBM Plex Sans Variable, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.2
  code:
    fontFamily: "Source Code Pro Variable, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  xs: "2px"
  sm: "4px"
  compact: "6px"
  md: "8px"
  code: "10px"
  lg: "16px"
  xl: "32px"
  pill: "999px"
spacing:
  xs: "10px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "32px"
  compact-gutter: "24px"
  medium-gutter: "32px"
  wide-gutter: "64px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.fontsource-violet}"
    textColor: "{colors.canvas-white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 22px"
    height: "42px"
  button-outline:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.fontsource-violet}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 22px"
    height: "42px"
  search-input:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink-navy}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "0 100px 0 60px"
    height: "64px"
  font-card:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.sm}"
    padding: "24px"
  tool-card:
    backgroundColor: "{colors.cloud-paper}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.lg}"
    padding: "32px"
  code-panel:
    backgroundColor: "{colors.ink-navy}"
    textColor: "{colors.code-lavender}"
    typography: "{typography.code}"
    rounded: "{rounded.code}"
    padding: "34px 16px 16px"
---

# Design System: Fontsource

## Overview

**Creative North Star: "The Open Font Workbench"**

Fontsource should become a calm, capable, and welcoming workbench for type. Its interface should behave like a dependable public utility: neutral enough to let every font specimen take the foreground, precise enough for developers, and clear enough for people who do not yet know the mechanics of web fonts.

Light mode is the canonical visual reference: open white and Cloud Paper canvases, Ink Navy type, and Fontsource Violet as the single active voice. Dark mode adapts that identity through intentionally layered navy surfaces rather than redefining it. Compact geometry, strong alignment, and restrained motion should make controls feel intentional without turning the product into corporate SaaS chrome.

This document is deliberately aspirational. It preserves Fontsource's established visual language while defining the usability and craft future surfaces should reach; it does not certify that every current screen already meets those standards.

**Key Characteristics:**

- Neutral interface typography gives font specimens visual authority.
- One violet accent carries navigation, state, focus, and primary action.
- Light mode establishes the reference palette; dark mode is its intentional adaptation.
- Flat, bordered surfaces gain depth only when interaction or hierarchy requires it.
- Recommended paths lead, while developer depth remains available through progressive disclosure.
- Named actions, semantic controls, and task completion survive every supported viewport.

### UX Principles

1. **Guide first, disclose depth.** Lead with the likely task and a recommended default. Keep expert controls close, but do not give every option equal initial weight.
2. **Preserve the task at every width.** Layout may change, but essential named actions and configuration do not disappear.
3. **Explain consequences at the point of choice.** Technical labels alone are not guidance; show what a choice changes in output, compatibility, performance, or file size.
4. **Use native interaction semantics.** Keyboard access, visible focus, semantic state, and clear recovery are part of the intended experience.
5. **Create pleasure through fluency.** Optimism comes from clarity, responsive craft, typography, and small moments of confidence—not ornamental novelty.

## Colors

The canonical palette is a cool, high-contrast light-mode pairing of Fontsource Violet, Ink Navy, Cloud Paper, and Canvas White. Dark-mode surfaces extend the same relationships without replacing the light palette as the primary reference.

### Primary

- **Fontsource Violet** (#625BF8): the brand mark, active navigation, primary action, focus state, selected control, and small icon accent.
- **Deep Fontsource Violet** (#473EF6): the stronger interaction value for pressed or emphatic violet states.
- **Dark-Theme Fontsource Violet** (#7C76FF): the brighter counterpart used when violet must remain clear on navy surfaces.

**The Specimen Priority Rule.** Violet signals state and action; it does not become a decorative field that competes with the fonts being evaluated.

**The Daylight Reference Rule.** Use light mode for browser visualization, design review, screenshots, and component examples unless the work is specifically testing dark-mode behavior. It is the clearest expression of the Fontsource palette.

### Neutral

- **Ink Navy** (#01112C): primary light-theme text and the canonical code-panel ground.
- **Cloud Paper** (#F5F7F9): quiet light-theme chrome and section separation.
- **Cool Mist** (#E6EBF0): stronger light-theme tonal separation and hover fill.
- **Canvas White** (#FFFFFF): the open light-theme working surface and reversed text.
- **Night Surface** (#121B31): the main dark-theme canvas.
- **Night Chrome** (#0F1626): deeper dark-theme header and control chrome.
- **Light Border** (#E1E3EC): hairline structure on light surfaces.
- **Dark Border** (#2C3651): hairline structure on dark surfaces.
- **Code Lavender** (#C2BFFF): readable code foreground that relates to violet without becoming an action color.

**The Paired-Canvas Rule.** Every structural surface must have an intentional light and dark role; do not obtain dark mode by merely inverting colors.

## Typography

**Display Font:** IBM Plex Sans Variable (with sans-serif fallback)

**Body Font:** IBM Plex Sans Variable (with sans-serif fallback)

**Label/Mono Font:** Source Code Pro Variable (with monospace fallback)

**Character:** IBM Plex Sans is neutral, technical, and humane. Source Code Pro makes code and diagnostic material explicit, while individual font families are loaded only inside specimen previews where their character is the content.

### Hierarchy

- **Display** (700, 42px, 1.12): documentation page titles and the strongest reading landmarks.
- **Headline** (700, 32px, 1.3): tool titles, content headers, and major task boundaries.
- **Title** (700, 24px, 1.25): section headings and grouped content.
- **Body** (400, 15px, 1.55): controls, app content, labels, and general interface copy.
- **Reading Body** (400, 16px, 1.75): documentation prose where comprehension needs more air.
- **Control** (400, 14px, 1.2): search, filters, compact navigation, and form controls.
- **Code** (400, 14px, 1.7): blocks, commands, generated CSS, and diagnostic output.

**The Neutral Frame Rule.** Interface typography stays consistent and quiet so a specimen can change family, weight, language, and size without the surrounding product competing with it.

## Layout

The primary frame is centered at a maximum width of 1440px. Desktop page gutters are 64px, intermediate layouts step down through 40px or 32px, and compact layouts use 24px. The recurring spacing rhythm is 10px, 12px, 16px, 20px, and 32px, with 40–48px used to separate major sections.

The responsive system uses breakpoints at 36em, 48em, 62em, 75em, and 88em. Font results move from one column to two, three, and four as space allows. Primary controls adapt through wrapping, grouping, or deliberate disclosure rather than incidental horizontal clipping. Horizontal scrolling is reserved for inherently wide content and must have an obvious affordance. Documentation uses a reading column between a sticky contents sidebar and an on-page outline; auxiliary columns disappear as the viewport contracts.

Headers and footers are 72px high. Content headers use a shallow tonal band and become vertically stacked on compact screens. Essential destinations and actions remain named and reachable when controls move into a drawer, accordion, menu, or stacked layout. Task surfaces favor aligned grids, bounded line lengths, and persistent task access over decorative asymmetry.

## Elevation & Depth

The system is flat by default. One-pixel borders, tonal surface changes, inset active markers, and small transforms establish hierarchy before shadow is introduced. Font cards use a restrained 5px ambient shadow and a 1.005 scale only on hover or focus. Tool and browse cards lift by 1px. Dialogs and floating information panels receive the strongest shadows because they genuinely sit above the working surface; code panels use a soft navy shadow to separate dense content from reading pages.

### Shadow Vocabulary

- **Card Response** (`0 0 5px rgba(0, 0, 0, 0.1)`): a brief hover or keyboard-focus acknowledgment on font cards.
- **Floating Panel** (`0 8px 18px rgb(1 17 44 / 0.06)`): contextual information above a light canvas, with a stronger dark-theme counterpart.
- **Dialog Stack** (`0 20px 56px rgba(2, 10, 28, 0.2), 0 8px 18px rgba(2, 10, 28, 0.08)`): search and modal surfaces over an overlay.
- **Code Panel** (`0 14px 34px rgba(5, 13, 31, 0.14)`): low, broad separation beneath large code blocks.

**The Flat-Until-Needed Rule.** A surface earns shadow by moving above another surface or responding to interaction; ordinary layout containers remain flat.

## Shapes

The default form is gently compact: most controls and font cards use a 4px radius. Search results and dialogs use 6px, general cards and drop zones use 8px, code panels use 10px, and high-level tool cards use 16px. Fully circular or pill geometry is reserved for icon actions, status dots, and controls whose silhouette communicates their behavior.

Borders remain thin and cool. Corners should look engineered rather than soft or playful; do not apply large rounded containers indiscriminately. The square logo mark, compact control corners, and straight grid alignments provide the recurring geometry.

## Components

Components are precise and approachable. Their default state is quiet; state changes are communicated through violet, tonal fill, a narrow border, or a small amount of motion.

### Buttons

- **Shape:** gently compact corners (4px) with a 42px standard height.
- **Primary:** Fontsource Violet background, white text, semibold label, and 22px horizontal padding.
- **Hover / Focus:** deepen the violet on hover; show a two-pixel translucent violet focus outline with visible offset.
- **Secondary / Outline:** transparent or canvas-colored background, structural light/dark border, and violet emphasis for the action label.

### Cards / Containers

- **Corner Style:** 4px for font specimens, 8px for directory cards, and 16px for high-level tool cards.
- **Background:** open canvas for font specimens; Cloud Paper or its dark counterpart for grouped tools.
- **Shadow Strategy:** flat at rest, with Card Response shadow or a 1px lift only on interactive surfaces.
- **Border:** one-pixel Light Border or Dark Border.
- **Internal Padding:** 24px for specimen cards and 32px for high-level tool cards.

### Inputs / Fields

- **Style:** transparent or canvas-toned fields with thin structural borders and compact 4px corners.
- **Search:** a 64px composite control with a leading search icon, a generous text lane, and secondary search-provider information at the trailing edge.
- **Focus:** border or outline shifts to Fontsource Violet; focus remains visible in both themes.
- **Error / Disabled:** use the component library's semantic states while preserving readable contrast and the same geometry.

### Navigation

The global header is a 72px horizontal bar. Navigation labels are compact and unadorned; hover turns violet, while the active destination adds both bold weight and a two-pixel violet underline. Icon actions remain visually quiet until hover or focus. Compact navigation preserves the same named destinations and actions in a full-width tonal panel or explicit overflow menu rather than compressing or hiding the desktop row.

Documentation navigation uses small, strong section labels and 4px rows. The active page combines a pale violet fill, bold violet text, and a two-pixel inset marker. Sticky sidebars support scanning on wide screens and collapse out of the reading path on smaller screens.

### Font Specimen Card

The specimen card is the signature component. The chosen typeface occupies the flexible preview field, while family name and variable status form a stable baseline beneath it. A one-pixel border and 24px inset keep different typefaces comparable. Hover and keyboard focus may add violet structure and a nearly imperceptible scale, but the specimen remains the dominant visual event.

### Code Panel

Code panels use Ink Navy, Code Lavender, Source Code Pro, a 10px radius, and generous top padding for language and copy controls. Highlighted lines use translucent violet rather than a second accent. The panel may carry a broad, low shadow on documentation pages.

## Do's and Don'ts

### Do:

- **Do** let real font specimens provide the visual variety while the interface remains neutral.
- **Do** use Fontsource Violet for active, focused, selected, and primary-action states.
- **Do** use light mode as the reference palette for browser visualization, reviews, screenshots, and component examples.
- **Do** preserve paired light and dark surfaces whenever adding a component.
- **Do** lead with a recommended path, then disclose specialist controls without removing them.
- **Do** preserve named actions and task completion across every supported viewport.
- **Do** explain the consequence of technical choices where they are made.
- **Do** keep focus states visible and honor reduced-motion preferences for decorative transitions.
- **Do** step page gutters from 64px to 32–40px to 24px as space contracts.

### Don't:

- **Don't** turn the interface into corporate SaaS chrome with decorative dashboards, oversized gradients, glass panels, or gratuitous status furniture.
- **Don't** scatter additional accent colors across ordinary navigation or controls.
- **Don't** use shadow as the default boundary when a border or tonal change is sufficient.
- **Don't** apply large soft radii to every container; preserve the compact 4–16px form language.
- **Don't** introduce expressive interface fonts that compete with the specimens being evaluated.
- **Don't** judge or present the system from dark-mode captures alone when the work is not theme-specific.
- **Don't** hide, unlabel, or incidentally clip essential filters, tabs, configuration, or acquisition actions on compact screens.
- **Don't** equate expert capability with giving every technical option equal initial emphasis.
