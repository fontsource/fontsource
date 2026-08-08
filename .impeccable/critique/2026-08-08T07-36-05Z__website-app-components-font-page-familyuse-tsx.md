---
target: new download page
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-08T07-36-05Z
slug: website-app-components-font-page-familyuse-tsx
---
Method: dual-agent (A: download_critique_design · B: download_critique_evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Selection state and copy feedback are clear, but download progress leaves the page and the three-step setup has no completion signal. |
| 2 | Match System / Real World | 2 | The two jobs are plain, but Variable, Static, CDN, TTF, WOFF, and full variable range assume specialist knowledge. |
| 3 | User Control and Freedom | 3 | Choices are reversible and cannot be emptied accidentally, but there is no reset to the recommended setup. |
| 4 | Consistency and Standards | 3 | Controls are cohesive, but Choose styles and weights opens variable-axis controls and the package-manager default differs from the docs pattern. |
| 5 | Error Prevention | 3 | Safe defaults and exact output help, but the usage example can be mistaken for a representation of every selected face. |
| 6 | Recognition Rather Than Recall | 3 | The live summary reduces memory load, while numeric weights and axes still require domain recall. |
| 7 | Flexibility and Efficiency | 4 | Package/CDN, variable/static, saved manager, multi-selection, direct copy actions, and specialist-family output genuinely serve experts. |
| 8 | Aesthetic and Minimalist Design | 3 | The page is calm, but excessive vertical spacing delays the simplest action and the web lane exposes too many controls at once. |
| 9 | Error Recovery | 2 | Clipboard feedback exists, but the parent page has little guidance for a failed download or a conceptually wrong setup. |
| 10 | Help and Documentation | 2 | The guide and CDN note are useful, but explanation arrives after the jargon-heavy decisions. |
| **Total** | | **28/40** | **Good foundation with a weak recommended path.** |

## Design Specificity Verdict

**LLM assessment:** The information architecture is specific to Fontsource. A complete family archive on one side and version-aware package/CDN output on the other expresses the product better than a generic Install tab. The interaction treatment is less specific: segmented controls, rows of package managers, checkbox chips, and stacked copy boxes could belong to any developer asset configurator. The page feels like a capable Fontsource workbench, but it does not yet guide people with Fontsource's strongest opinion: download everything if you need files, or use one recommended self-hosted setup unless you know why to change it.

The collapsed web state has nine configuration controls before its code actions: two delivery methods, two formats, one customization action, and four package managers. Expanding static mode raises the visible configuration to roughly twenty controls, including a wall of nine numeric weights. Progressive disclosure exists, but it begins one layer too late: styles and weights are hidden while format and manager decisions remain exposed before their consequences are explained.

**Deterministic scan:** The CLI scan returned `[]`: zero findings, zero rules, and zero file locations for `website/app/components/font-page/FamilyUse.tsx`. The live browser detector grouped eight findings across seven locations. Three cramped-padding warnings are likely false positives because the download action is 52 px tall and the segmented children provide their own hit areas. The body-level gradient-text and layout-transition findings are outside the target component. Three 4.2:1 active-control contrast warnings were credible for the CSS actually rendered in the assessment tab. The current source specifies the stronger design-system active colors, so the source and live session were not rendering the same active-state palette; the preview must be refreshed or rebuilt before treating the browser contrast result as resolved.

**Visual overlays:** Detector injection succeeded and produced seven overlay nodes in the background assessment tab. A reliable user-visible overlay is not available because the in-app browser reported `IAB visibility is not supported in a subagent thread`. Desktop and mobile screenshot evidence was still captured, with no horizontal overflow at 1440 px or 390 px.

## Overall Impression

The two-audience split is the right foundation. The page's biggest opportunity is to make the result, not the configuration, the center of each lane. Casual users should see the complete ZIP action immediately. Developers should see a recommended package setup and working code immediately, with format, styles, weights, axes, and alternate delivery available under one honest Customize setup disclosure.

## What's Working

- **The intent split is excellent.** Download files and Use on the web map to real jobs without forcing people to understand package formats before choosing a direction.
- **The advanced capability is real.** Static multi-weight/style imports, variable normal/italic output, versioned CDN links, saved manager choice, specialist `full.css` families, and immediate copy feedback are not mock controls.
- **The responsive and semantic foundation is sound.** The lanes stack without horizontal overflow, controls remain named, fieldsets and pressed/expanded states are semantic, selections cannot become invalid, and focus remains visible.

## Priority Issues

### [P1] The simplest action is visually buried

**Why it matters:** At 1280 x 720 the complete-family button is below the fold. On a compact phone, users see the download heading and supporting list before the action. The casual path is logically simple but physically slow.

**Fix:** Put Download complete family directly below the one-sentence description. Collapse the three proof bullets into a single quiet included-files line beneath the action, then show the license. Remove the fixed desktop minimum height and the large vertical gaps used to visually balance unequal columns.

**Suggested command:** `$impeccable layout`

### [P1] The recommended web result is hidden behind premature decisions

**Why it matters:** Package/CDN, Variable/Static, and four package managers appear before users know why to change any of them. Experts can use this, but first-timers are made to audit a correct default instead of completing the task.

**Fix:** Show a plain-language summary such as Self-hosted package · Variable · Normal · Full range, followed immediately by the generated steps. Keep Package versus Quick embed as the one primary method choice. Move format, styles, weights, axes, and package-manager preference into one Customize setup surface, or integrate the manager into the Install block header.

**Suggested command:** `$impeccable distill`

### [P1] Multi-face imports and the usage example tell different stories

**Why it matters:** Selecting several static weights and styles correctly generates every import, but the CSS block still demonstrates one primary Normal 400 class. In variable mode, Full variable range sits beside fixed axis values. A developer can reasonably assume the example describes everything selected.

**Fix:** Separate Files loaded from Example usage. Label the CSS block with the exact example, such as Example: Normal 400. Explain that variable files contain a range while the example chooses one point within it. Either generate one example per selected face or state explicitly that the first selection is used for the example.

**Suggested command:** `$impeccable clarify`

### [P2] Advanced configuration becomes an undifferentiated numeric wall

**Why it matters:** Nine numeric weights plus two styles exceed a comfortable scanning set and assume knowledge of CSS weight numbers. In variable mode, Choose styles and weights unexpectedly reveals axes.

**Fix:** Use format-aware labels: Customize styles and axes for variable, and Choose styles and weights for static. Pair numbers with names such as 400 Regular and 700 Bold. Offer concise presets—Regular, Regular + Bold, All styles—before individual selection.

**Suggested command:** `$impeccable distill`

### [P2] Mobile preserves every feature but not equal access to both audiences

**Why it matters:** Stacking is technically correct, but developers must scroll through the entire download lane before reaching web setup. The casual-first order becomes an audience tax on small screens.

**Fix:** Keep the sections visible, but add two compact in-page task links under Get Roboto on mobile: Download files and Use on the web. They should jump to the existing sections rather than introduce another tab state or hide content.

**Suggested command:** `$impeccable adapt`

## Persona Red Flags

**Casual first-timer:** The decisive download action is not in the initial viewport. TTF, WOFF, WOFF2, OFL-1.1, Package, CDN, Variable, and Static appear before contextual help. The page says the path is simple, but the layout asks the user to read proof and jargon before acting.

**Working designer:** The complete ZIP is the right answer, but webfont files and CSS receive the same prominence as design-app files. The designer must infer that TTF is the part relevant to desktop apps. The license link is useful, but it offers legal text rather than a compact reassurance about ordinary design use.

**Developer:** Exact package and CDN output, remembered manager, multi-face selection, and copy feedback are strong. The surprising `latin-wdth.css` default is unexplained, Full variable range conflicts with fixed example axes, and the generated CSS represents only the primary selected face. Three separate Copy actions are technically correct but lack a concise completion story.

## Minor Observations

- The left column's large empty lower area makes the web lane feel like the real product and the download lane feel secondary, despite equal column widths.
- Package should remain the recommended method, but the current active styling alone does not explain why self-hosting is preferred.
- The existing CDN note is good: it names jsDelivr and points back to self-hosting without making unsupported reliability claims.
- The package-manager default is `pnpm` here while the existing documentation component defaults to `npm`. Persisted user preference is useful, but a new visitor should see the repository-wide default.
- Mobile code wrapping is safe but visually dense, especially for `font-variation-settings`; the Copy controls remain usable.
- The download route's preparing state is appropriate for uncached archives, but opening a new tab should be presented as intentional status handling rather than appearing like an external destination.

## Questions to Consider

- If Package + Variable is the recommended setup, why ask every visitor to reconfirm it before showing the result?
- What if Download complete family were the first control after the lane description and the file-format details became reassurance beneath it?
- Are variable-axis sliders configuring the loaded font, the usage example, or both? Can a new developer answer that from this page?
- Should selecting four faces produce one representative CSS class, four named examples, or an explicit explanation that the class is illustrative?
