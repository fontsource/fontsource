---
target: the new font preview page
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-08-02T16-15-38Z
slug: website-app-components-font-page-familypreview-tsx
---
⚠️ DEGRADED: single-context (sub-agent spawn failed: The 'gpt-5.6' model is not supported when using Codex with a ChatGPT account.)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Mode, values, and selected states are clear, but a capability request failure becomes an unexplained absence of options. |
| 2 | Match System / Real World | 3 | The typography vocabulary is strong, but Paragraph behaves like a wrapped headline instead of readable body copy. |
| 3 | User Control and Freedom | 3 | Editable samples and section resets are useful, but “Reset all” does not restore the text, language, or mode. |
| 4 | Consistency and Standards | 3 | The design language is coherent; mode semantics and the underfilled Compare canvas break that consistency. |
| 5 | Error Prevention | 4 | Source-aware capabilities, verified language samples, constrained ranges, and exclusive feature groups prevent invalid combinations. |
| 6 | Recognition Rather Than Recall | 3 | Labels and descriptions are strong, though Waterfall and the long OpenType list still assume some font knowledge. |
| 7 | Flexibility and Efficiency | 4 | Presets, exact numeric inputs, sliders, variable axes, multilingual samples, and acquisition handoff serve both casual and expert users. |
| 8 | Aesthetic and Minimalist Design | 3 | The workbench is calm and specimen-led, but Compare wastes half its canvas and advanced controls form a long settings trench. |
| 9 | Error Recovery | 3 | Section resets and fallback notices help, but there is no explicit way to restore edited specimen copy and source-detail failures are silent. |
| 10 | Help and Documentation | 3 | Axis and feature descriptions are valuable; the four preview purposes themselves are not explained. |
| **Total** | | **32/40** | **Good — a strong foundation with a focused refinement pass remaining.** |

## Design Specificity Verdict

**LLM assessment**: This feels authored for Fontsource rather than category-interchangeable. The specimen occupies the visual center, the inspector exposes real variable-font and OpenType behavior, language samples follow verified coverage, and choices carry into acquisition. The quiet chrome is appropriate because the font is the artifact. The weakest moments are not matters of style but broken promises: Paragraph does not behave like paragraph typography, Compare does not occupy the available canvas, and “Reset all” does not reset everything its wording implies.

**Deterministic scan**: One advisory was reported in `website/app/components/font-page/FamilyPreview.tsx:1050`: the Compare specimen uses `clamp(20px, 2.4vw, 34px)`, whose endpoints are outside the UI type ramp in `DESIGN.md`. This is an intentional false positive. The text is font specimen content, not application chrome, so it should not be constrained to the product UI ramp.

**Visual overlays**: No reliable user-visible overlay is available. The browser’s evaluation surface rejected the required title/script mutation during preflight, so no live detector server was started and no overlay was injected. Native desktop/mobile screenshots, DOM state, source inspection, and computed layout geometry were used as fallback evidence. Runtime logs contained no warnings or errors.

## Overall Impression

The page now feels like a serious, approachable font workbench. Its biggest remaining opportunity is to make each mode teach a genuinely different typographic use case instead of merely changing the copy or layout around one shared style state.

## What's Working

1. **The font stays primary.** The roughly 70/30 specimen-to-inspector split gives the typeface room while keeping precise controls continuously available.
2. **Power is introduced without a separate “advanced” product.** Sliders and direct inputs, source-specific axes, explained OpenType features, searchable languages, and the Get font handoff create one coherent path for casual and expert users.
3. **Responsive behavior is considered rather than collapsed.** Desktop gets a persistent inspector; mobile gets a bottom sheet with 44px-plus targets. The specimen remains the first thing users see.

## Priority Issues

### [P1] Paragraph is a headline with more words

**Why it matters**: Paragraph currently keeps the same 72px size, 600 weight, and 0.95 line height as Headline. On desktop it produces three display-sized lines; at 390px wide it fills the viewport with cropped word fragments. The mode therefore cannot answer the user’s actual question: “Will this font remain comfortable and legible in body copy?”

**Fix**: Give modes independent semantic defaults while keeping axes and OpenType choices shared. A useful starting point is Headline at 72px / 600 / 0.95, Paragraph at 20–24px / 400 / 1.5 with a 60–72ch measure, Waterfall using size as its ceiling, and Compare using fixed tile sizes. Preserve later user changes per mode so switching does not destroy their setup.

**Suggested command**: `$impeccable typeset`

### [P2] Compare collapses to half of the specimen canvas

**Why it matters**: At 1440px, the specimen column measures 930px, but the derived Compare canvas measures about 465px and the weight grid about 401px. Seven weights are squeezed into a small two-column block with a large empty area beside it, making the mode look unfinished and reducing scanability.

**Fix**: Make the Boneyard content wrapper and derived canvas stretch to the specimen width (`min-width: 0; width: 100%; flex: 1`). Then use three columns at wide desktop widths, two at tablet widths, and one on mobile.

**Suggested command**: `$impeccable layout`

### [P2] “Reset all” overpromises

**Why it matters**: The control resets typography, axes, and features but preserves edited text, selected language, and the current mode. Preserving the user’s words is sensible, but the label makes the behavior feel incomplete or broken.

**Fix**: Rename it to “Reset styling.” Add a smaller “Restore sample” action beside the text label when the specimen differs from its language/mode default. This keeps user text safe while making both recovery paths explicit.

**Suggested command**: `$impeccable clarify`

### [P2] Exact values are present but their units are not persistent

**Why it matters**: Size, letter spacing, and line height show bare values such as `72`, `0`, and `68.4`. The slider tooltip adds `px` only during interaction, so both new users and developers must infer the unit when scanning the inspector.

**Fix**: Render a quiet `px` suffix inside or beside the numeric field for pixel-based controls. Keep Weight and variable-axis controls unitless.

**Suggested command**: `$impeccable clarify`

### [P2] Capability failures look like unsupported features

**Why it matters**: When a selected source’s capability request fails, the component caches `null` and removes its axes/features without explaining why. Users can mistake missing data for an authoritative claim that the font does not support those features.

**Fix**: Keep the last valid controls visible where possible and show a compact, non-technical status such as “Detailed controls are unavailable for this style.” Offer a retry without turning it into a blocking error.

**Suggested command**: `$impeccable harden`

## Persona Red Flags

**Alex (Power User)**: Alex can reach exact sizes, weights, axes, features, and Get font quickly. The main friction is that Paragraph cannot be evaluated without manually rebuilding body typography, Compare wastes half the workspace, and pixel units are not visible until the slider is moving.

**Jordan (First-Timer)**: Jordan understands Headline and Paragraph literally, so the identical styling teaches the wrong concept. “Waterfall,” four-letter axis tags, and OpenType feature names still introduce domain language, although the in-context descriptions substantially soften that barrier. “Reset all” behaving partially will be read as a defect.

**Casey (Distracted Mobile User)**: The bottom-sheet Adjust action and touch targets work well. The 72px paragraph default is the major failure: the sample becomes an oversized wall that requires immediate adjustment before it can be judged. Long-axis fonts also create a deep drawer, so preserving scroll and mode state across interruptions remains important.

## Cognitive Load

**Moderate: 2 of 8 checklist items fail.** Single focus, grouping, hierarchy, one-at-a-time manipulation, and working-memory support are strong. The two failures are minimal choices and progressive disclosure: a font can expose dozens of feature toggles in one long list, and desktop always presents the full advanced inspector. Search prevents the list from becoming unusable, but it does not organize users around common intent.

Decision points above four visible options:

- Recursive exposes a long OpenType feature list. Search helps experts, but common choices are not distinguished from specialist features.
- Compare shows seven named weights. This is justified by the comparison task, but the collapsed grid makes the option count feel heavier than it needs to.
- Language lists can contain hundreds of entries, but the searchable dropdown contains this complexity appropriately.

## Emotional Journey

The opening is confident: the font appears immediately in a generous, editable canvas. The peak is adjusting a real variable axis and watching the specimen respond without changing contexts. The current valley is selecting Paragraph and getting another display composition; the user’s expectation is contradicted at the exact moment the interface should demonstrate practical versatility. Compare’s half-empty canvas creates a second, smaller loss of polish. The Get font handoff provides a strong ending because experimentation has a direct outcome.

## Minor Observations

- “Fine-tune this specimen” is accurate but generic; it adds little once the section title and controls are visible.
- The active language is shown, but there is no persistent “Language” caption; this is still recognizable as a dropdown, though less explicit than the numeric controls.
- The initial 600 weight is appropriate for Headline but reinforces the Paragraph problem.
- Features and axes use helpful descriptions, but the inspector has no quick way to jump between Typography, Variable design, and Features on families with large capability sets.
- The desktop inspector’s independent scroll is useful; keep that behavior when tightening section hierarchy.

## Questions to Consider

- Are Headline, Paragraph, Waterfall, and Compare semantic presets, or only canvas layouts? The interface currently labels them as the former but implements them closer to the latter.
- Should restoring sample copy be separate from resetting typography? Preserving user text suggests that it should.
- Should common OpenType features be visually prioritized while the complete source-verified list remains searchable below?
