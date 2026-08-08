---
target: the revised Fontsource family preview workflow
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-03T06-48-09Z
slug: website-app-components-font-page-familypreview-tsx
---
# Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active modes and values are clear, but source-aware settings can appear or disappear while capabilities load. |
| 2 | Match System / Real World | 3 | Headline, Paragraph, Waterfall, and Compare are natural; Variable and Features still assume typography knowledge. |
| 3 | User Control and Freedom | 4 | Direct editing, Restore sample, section resets, global reset, and a dismissible compact drawer make experimentation reversible. |
| 4 | Consistency and Standards | 4 | The editor uses one coherent set of segmented controls, sliders, numeric inputs, switches, and focus states. |
| 5 | Error Prevention | 4 | Values are constrained, exclusive feature groups are guarded, and source-scoped capabilities prevent unsupported controls. |
| 6 | Recognition Rather Than Recall | 3 | Most actions are visible, but reset scope and the technical settings labels require interpretation. |
| 7 | Flexibility and Efficiency | 4 | Multilingual samples, four useful views, variable axes, OpenType features, direct numeric entry, and custom text serve both casual and expert paths. |
| 8 | Aesthetic and Minimalist Design | 3 | The specimen leads well, but duplicate reset affordances and long advanced lists add residual noise. |
| 9 | Error Recovery | 4 | Failed detailed controls offer retry, edited samples can be restored, and styling can be reset without losing the page context. |
| 10 | Help and Documentation | 3 | Axis and feature descriptions are strong, but the settings-section vocabulary is not explained before selection. |
| **Total** | | **35/40** | **Good — close to ship, with focused interaction refinements remaining** |

# Design Specificity Verdict

**LLM assessment:** This feels authored for Fontsource. The font specimen is the visual protagonist, the four preview modes correspond to real type-evaluation jobs, and the advanced controls are driven by actual family capabilities rather than generic knobs. The restrained chrome could belong to another creative tool, but the composition and behavior could not be transplanted unchanged to an unrelated product. The strongest product character comes from Waterfall, multilingual samples, source-aware axes, and OpenType controls.

**Deterministic scan:** The Impeccable detector returned `[]`: zero findings in `website/app/components/font-page/FamilyPreview.tsx`, with no rule names or file locations. That confirms the primary surface avoids the detector's common generic-interface and anti-pattern rules. It does not invalidate the interaction issues below, which depend on state transitions and compact layout rather than static anti-slop rules.

**Visual overlays:** No reliable overlay is available. Mutable injection was attempted in a fresh background browser tab, but the browser call was interrupted before success could be confirmed. The fallback evidence was a live desktop accessibility/DOM snapshot of `/fonts/recursive`; browser visibility was never enabled and no `[Human]` tab is claimed.

# Overall Impression

This is now a coherent, calm font workbench. It lets a casual visitor type and compare immediately, then gives developers and typographers real depth without turning the first view into a control wall. The single biggest opportunity is to preserve continuous visual feedback: compact users should still see the specimen while tuning it, and source-aware settings should never rearrange beneath them.

# Cognitive Load

**Low to moderate: 2 of 8 checklist failures.** The interface passes single focus, grouping, visual hierarchy, working-memory support, and progressive disclosure. It narrowly fails one-thing-at-a-time on compact screens because page tabs, preview modes, language, alignment, and Settings precede the specimen. It also fails minimal choices after a user enters Features, where a long flat switch list becomes one decision surface. The main mode chooser stays at the working-memory limit of four, and the settings chooser stays below it at three.

The emotional journey is strong: the specimen creates an immediate peak, Waterfall and Compare make exploration feel rewarding, and reversible controls build confidence. The remaining valley occurs when Settings interrupts the specimen on compact screens or a capability-driven section changes while loading.

# What's Working

1. **The specimen leads.** The interface recedes and the family itself carries the page, matching Fontsource's product promise rather than behaving like a generic settings dashboard.
2. **Progressive disclosure is finally doing real work.** Typography is immediately useful, while Variable and Features stay one explicit choice away. This is substantially clearer than a single long inspector.
3. **The casual and expert paths share one model.** A first-timer can type, choose a language, and change size; a developer can enter exact values and inspect axes or feature tags without entering a separate expert mode.

# Priority Issues

## [P2] Compact settings weaken live visual feedback

**Why it matters:** The bottom drawer can occupy most of a phone viewport. The control being adjusted and the specimen it affects are no longer comfortably visible together, which turns direct manipulation into an open-adjust-close-check loop.

**Fix:** Use a shorter, internally scrollable bottom sheet or a two-detent sheet that guarantees a visible specimen region above it. Keep the active section sticky inside the sheet and avoid a backdrop that visually disconnects the result. Preserve the current four preview tabs.

**Suggested command:** `$impeccable adapt`

## [P2] Source-aware settings navigation is not stable

**Why it matters:** Variable and Features only exist when the current capability arrays are populated. During a source change, load, or failure, a section can disappear and the active view silently falls back to Typography. Users should not lose their location because metadata is in flight.

**Fix:** Keep known settings sections stable for the family. Show loading, unavailable, and retry states inside the selected section; disable a section only when it is confirmed unsupported. Preserve the active section across source changes.

**Suggested command:** `$impeccable harden`

## [P2] The two reset scopes are visually and semantically ambiguous

**Why it matters:** `Reset styling` and the section-level `Reset` can appear together, often disabled together. Neither label explains that one affects the broader preview while the other affects only the current section or view.

**Fix:** Rename the broader action to `Reset all views` and the local action to `Reset typography`, `Reset axes`, or `Reset features`. Hide or demote the global action until changes span more than the current section.

**Suggested command:** `$impeccable clarify`

## [P3] OpenType features become a flat inventory after disclosure

**Why it matters:** Search helps experts who know a name or tag, but a casual designer opening Features still sees many equally weighted switches and has no clue which ones visibly change common text.

**Fix:** Put enabled and common features first, grouped by practical outcome such as ligatures, numbers, and alternates. Keep the full searchable list under `All features` so expert access is not reduced.

**Suggested command:** `$impeccable distill`

# Persona Red Flags

**Jordan (First-Timer):** The primary path is now obvious, but `Variable` and `Features` appear before their purpose is explained. The paired disabled reset actions also look like controls Jordan should understand even before making a change. She can complete the task, but the advanced vocabulary creates hesitation.

**Alex (Power User):** Exact numeric entry, axes, and feature tags are excellent. The red flag is instability: if capability-backed sections disappear during a source change, Alex loses position and has to reconstruct what happened. A long feature inventory also slows scanning when enabled/common features are not prioritized.

**Casey (Distracted Mobile User):** Touch targets and the bottom-sheet placement are good, but the sheet occupies the same viewport needed to judge the specimen. Casey has to alternate between controlling and observing instead of doing both at once, increasing interruption cost.

# Minor Observations

- Waterfall and Compare are the most distinctive parts of the preview. Keep both.
- Direct numeric values beside sliders are excellent for developers and should remain first-class.
- `Variable font` would be slightly clearer than `Variable` if the segmented control can accommodate it; otherwise explain the term in the selected section instead of lengthening the tab.
- The live desktop DOM exposed named radio groups, spinbuttons, sliders, a complementary settings landmark, pressed alignment states, and a retryable capability status. The accessibility structure is materially stronger than the remaining visual concerns.

# Questions to Consider

- Should compact tuning prioritize a permanently visible specimen, even if the settings sheet shows fewer controls at once?
- Should reset actions optimize for minimal chrome or for precise scope? The current design tries to provide both and makes neither distinction obvious.
- When a first-timer opens Features, should the first screen teach three useful outcomes, or present the complete technical inventory immediately?
