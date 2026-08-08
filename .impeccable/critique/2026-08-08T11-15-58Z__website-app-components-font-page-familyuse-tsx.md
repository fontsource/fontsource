---
target: download flow
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-08T11-15-58Z
slug: website-app-components-font-page-familyuse-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Recommended/current setup, selected-face counts, pressed states, and accessible copy feedback are clear. |
| 2 | Match System / Real World | 3 | Audience labels are natural; Variable, Static, WOFF, CDN, and OFL remain specialist terms. |
| 3 | User Control and Freedom | 3 | Paths and methods are reversible and recommended settings are recoverable, but the configuration is not resumable after refresh. |
| 4 | Consistency and Standards | 4 | Tabs, disclosures, fieldsets, helper copy, focus states, and code blocks use coherent patterns. |
| 5 | Error Prevention | 4 | Smart defaults, required selections, presets, reset, and contextual output explanations prevent common mistakes. |
| 6 | Recognition Rather Than Recall | 4 | Semantic weight names, setup summaries, selected counts, and local explanations keep context visible. |
| 7 | Flexibility and Efficiency | 4 | Complete ZIP, Package/Quick embed, variable/static, presets, axes, manager choice, and individual copy actions serve both audiences. |
| 8 | Aesthetic and Minimalist Design | 3 | The novice path is restrained and complexity is progressively disclosed; deepest static customization is still dense. |
| 9 | Error Recovery | 3 | Clipboard and Registry failures offer recovery; acquisition/configuration state is lost on refresh. |
| 10 | Help and Documentation | 3 | Method consequences, output descriptions, license guidance, and the guide are contextual; format terminology is still underexplained. |
| **Total** | | **34/40** | **Good, near excellent.** |

## Design Specificity Verdict

**LLM assessment**: The workflow now feels authored for Fontsource rather than category-interchangeable. The audience split, complete-family archive, self-hosting recommendation, variable/static formats, semantic face presets, versioned CDN alternative, and license handling express this product's actual acquisition model. The component language is intentionally quiet and conventional, which is appropriate because the font and generated output should remain the content.

**Deterministic scan**: The CLI detector returned `[]`: zero findings, zero rules, and zero locations for `website/app/components/font-page/FamilyUse.tsx`. There were no detector false positives.

**Visual overlays**: No reliable user-visible overlay is available. A fresh browser tab could not be created because the browser registry returned `No browser is available`, so mutable injection, runtime inspection, and overlay presentation were skipped. The live URL returned HTTP 200; responsive and visual-balance judgments are source/CSS inferences, not rendered proof.

## Overall Impression

This is now the right structure. The casual path is a confident one-action download, while the developer path opens into genuine Fontsource flexibility only when requested. The biggest remaining opportunity is not to add more UI; it is to make the advanced terms and controls slightly easier to understand and operate without weakening the clean default path.

## What's Working

- **The audience split is decisive.** “Download files” and “Developer setup” describe outcomes before implementation details, so casual users never have to interpret package terminology.
- **Progressive disclosure is disciplined.** The sequence is audience path, then setup customization, then static face fine-tuning. The nine-weight wall no longer appears in the normal path.
- **The copy now explains consequences at the decision point.** Download compatibility, Package versus Quick embed, import scope, and example CSS meaning are placed beside the relevant choice or output.

## Priority Issues

### [P2] Advanced format terminology still assumes font knowledge

**Why it matters**: Jordan can safely use the recommendation, but opening customization introduces Variable, Static, WOFF, CDN, and OFL without explaining the practical consequence. The interface becomes more technical at exactly the moment a curious non-expert is trying to learn.

**Fix**: Add one short consequence sentence when customization opens: Variable gives a continuous range in fewer files; Static loads only the selected named faces. Keep file-format definitions out of the default path and attach them only to the relevant advanced control.

**Suggested command**: `$impeccable clarify`

### [P2] Several expert controls are smaller than the preferred touch target

**Why it matters**: Package-manager buttons, presets, and face labels use 40px minimum heights, while axis inputs use 36px. They remain operable but are less forgiving for touch, motor impairment, and zoomed layouts.

**Fix**: Raise compact interactive rows to at least 44px on touch layouts and verify the effective slider/input hit areas, focus rings, and spacing at 200% zoom.

**Suggested command**: `$impeccable audit`

### [P2] Developer configuration is not resumable or shareable

**Why it matters**: Refreshing or sharing the page returns to the default acquisition path and discards the chosen method, format, faces, and axes. This is most noticeable for expert users building a non-default setup.

**Fix**: Persist the stable configuration in search parameters or a compact shareable state. Do not encode purely presentational disclosure state. Browser Back should restore the audience path and meaningful choices.

**Suggested command**: `$impeccable harden`

### [P3] “Use recommended” does not complete the escape from advanced mode

**Why it matters**: The action restores the correct values but leaves the main customization panel open. The label reads like a return to the simple path, while the result leaves the user inside the advanced controls.

**Fix**: Close the customization region when applying the recommendation. If staying open is intentional, rename the action to “Reset choices.”

**Suggested command**: `$impeccable clarify`

### [P3] The deepest static-face layer is still visually heavy

**Why it matters**: Double disclosure makes the complexity acceptable, but once opened the nine weights still receive equal emphasis.

**Fix**: Keep all weights available, but group them into common and additional weights or reduce separator/emphasis density. Do not add another nested dropdown.

**Suggested command**: `$impeccable distill`

## Cognitive Load

- Download state: **0/8 failures — low load**.
- Recommended developer state: **0–1/8 failures — low load**.
- Variable customization: **1/8 failure — low load**.
- Static customization with face fine-tuning open: **3/8 failures — moderate load**.

Single focus, grouping, visible hierarchy, working-memory support, and progressive disclosure pass. The only meaningful failures appear at the deepest static configuration, where presets, styles, and nine weights coexist. No normal-path decision group exceeds four choices.

## Emotional Journey

- **Entry**: “Choose where you want to use Roboto” turns an ambiguous acquisition task into two recognizable outcomes.
- **Download path**: compatibility reassurance, one ZIP action, and nearby license access create confidence without configuration.
- **Developer path**: the self-hosting recommendation and recommended setup reduce fear of choosing incorrectly.
- **Advanced valley**: the deepest static controls reveal the true complexity of font faces, but presets and semantic names soften it.
- **Peak and end**: generated output is explained where it is copied, with accessible success/failure feedback and a route to the guide.

## Persona Red Flags

**Jordan, first-time font user**

- The default Download path is clear and should not require font expertise.
- The secondary ZIP contents still contain TTF, WOFF, WOFF2, and OFL terminology, though it no longer leads the hierarchy.
- Entering Developer setup and opening customization introduces Variable and Static without a practical definition.

**Alex, working developer**

- Presets, remembered manager, reset, exact faces, axes, and direct code outputs are efficient.
- Non-default setup is lost on refresh and cannot be shared with a teammate.
- Separate copy actions are appropriate because shell, import, and CSS belong in different contexts; combining them would create a misleading paste target.

**Sam, keyboard/touch accessibility user**

- Semantic tabs, fieldsets, controlled disclosures, visible focus CSS, and live clipboard status are strong foundations.
- Several 36–40px controls are smaller than the preferred 44px target.
- Actual contrast, zoom reflow, keyboard order, and focus appearance remain unverified because browser inspection was unavailable.

## Minor Observations

- Moving format details below an outcome statement is the correct hierarchy.
- Removing the new-tab behavior from the download action avoids an unexpected browsing context.
- “Quick embed” is approachable, while its helper text preserves jsDelivr/versioning precision.
- `Use recommended` only appears when it has value, so it does not become permanent reset clutter.
- Inline Import and Example CSS descriptions are much stronger than a single explanation after all output blocks.
- A combined “Copy complete setup” action is not recommended: install, import, and CSS snippets belong to different destinations.

## Questions to Consider

- Should a configured Developer setup be shareable as a URL, or is it intentionally disposable?
- Does “Use recommended” mean reset and exit, or reset while continuing to experiment?
- Should Variable and Static get one-line consequence copy, or is the recommended path sufficient guidance?
- Are all nine individual weights important enough to remain equally prominent at the deepest layer?
