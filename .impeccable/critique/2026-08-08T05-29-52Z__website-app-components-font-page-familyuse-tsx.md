---
target: Get font acquisition mockups
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-08T05-29-52Z
slug: website-app-components-font-page-familyuse-tsx
---
Method: dual-agent (A: acquisition_mockup_critique_retry · B: acquisition_mockup_evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Active choices are clear, but copied, downloading, success, and retry states are not represented. |
| 2 | Match Between System and Real World | 4 | “Download files” and “Use on a website” match user intent before introducing implementation methods. |
| 3 | User Control and Freedom | 3 | Path switching and “Change” are visible; reset and cancel behavior for the advanced selector still needs definition. |
| 4 | Consistency and Standards | 3 | The visual language is coherent, but intent cards plus global Download, Package, and CDN tabs create duplicate navigation. |
| 5 | Error Prevention | 2 | Recommended defaults help, but the Google Fonts URL paired with jsDelivr copy and the selected-versus-complete ambiguity undermine trust. |
| 6 | Recognition Rather Than Recall | 4 | The configuration summary keeps the current selection visible. |
| 7 | Flexibility and Efficiency | 3 | Multiple delivery paths and package managers support experts while the matrix stays behind “Change.” |
| 8 | Aesthetic and Minimalist Design | 4 | The set is calm and scannable, though several surfaces spend too much space on choosing a path. |
| 9 | Error Recovery | 2 | Copy failure, download retry, preserved state, and partial archive failure are absent from the mockups. |
| 10 | Help and Documentation | 2 | Labels are plain, but contextual guidance is weaker than the incumbent flow. |
| **Total** | | **30/40** | **Good direction with contract and state gaps to resolve.** |

## Design Specificity Verdict

The set is recognizably Fontsource through exact family configuration, file counts, package commands, and delivery choices, but no mockup is complete. The download direction gives designers the most confidence, the package direction gives developers the clearest execution path, and the intent-first direction has the best information architecture. Generic choice cards, tab bars, dark code panels, and decorative selected states still make parts of the set feel interchangeable with any developer asset configurator.

The deterministic scan returned zero findings for `website/app/components/font-page/FamilyUse.tsx`. Browser inspection used a fresh tab but the local route refused the connection, so mutation preflight, detector injection, console evidence, and overlays were unavailable. No user-visible overlay exists. Source evidence caught several product-contract problems the visual review could not: current download and project models are single-face, the bare package import does not load the four advertised weights and both styles, the CDN example must use a versioned Fontsource/jsDelivr URL, and license text must remain family-specific Registry data.

## Overall Impression

The redesign has found the correct job: acquisition rather than another specimen. Its biggest opportunity is to make the result—not the path selector—the visual center. Use one intent choice, one concise included-styles sentence, and one trustworthy result. Everything else belongs behind “Change” or appears only when the selected method needs it.

## What's Working

- Intent-first language makes the page approachable without weakening developer depth.
- A persistent setup summary turns multi-weight and multi-style complexity into inspectable state.
- The download receipt and numbered code steps give both designers and developers a clear finish line.

## Priority Issues

### [P1] One navigation taxonomy

**Why it matters:** Showing an audience fork and global Download, Package, and CDN tabs makes the user classify the same task twice.

**Fix:** Keep `Download files` and `Use on a website` as the primary choice. Reveal `Package` and `Quick embed` only inside the website branch.

**Suggested command:** `$impeccable distill`

### [P1] Truthful multi-face output

**Why it matters:** “4 weights · Normal + Italic · 8 files” currently promises a capability the single-face download, package, and project models do not yet provide.

**Fix:** Make the advanced selector a real multi-select model, generate every required static import or CDN URL, aggregate archive assets, and keep an exact selected-face count in the summary.

**Suggested command:** `$impeccable harden`

### [P1] Delivery-source accuracy

**Why it matters:** Google-hosted HTML paired with jsDelivr language is a high-trust failure at the moment a developer copies production code.

**Fix:** Use exact-version Fontsource/jsDelivr output and factual provider copy. Do not add unsupported reliability marketing.

**Suggested command:** `$impeccable clarify`

### [P2] Selected versus complete downloads

**Why it matters:** A casual user may believe “Download Roboto” includes the whole family while the receipt contains only the current selection.

**Fix:** Label the primary action `Download selected files (.zip)` and keep `Download complete family` as a clear secondary alternative with one short explanation.

**Suggested command:** `$impeccable clarify`

### [P2] Feedback and responsive states

**Why it matters:** The desktop mockups do not show copy confirmation, download progress, retry, mobile order, or keyboard semantics.

**Fix:** Preserve semantic buttons, fieldsets, visible focus, 44px targets, polite live regions, overflow-safe code, and a stacked mobile path that never hides the primary action.

**Suggested command:** `$impeccable adapt`

## Persona Red Flags

**Casual first-timer:** Package and CDN appear too early in two designs. TTF, faces, and complete family need plain-language context, and the page must make the default download contents unmistakable.

**Working designer:** The hidden `Change` flow must genuinely support multiple weights and styles. Exact file format, included license, and complete-family escape should sit near the download action.

**Developer:** The package flow is fast, but one bare import cannot truthfully represent eight static faces, and a Google URL cannot be presented as jsDelivr. Preserve package-manager choice, exact-version output, and copy confirmation.

**Accessibility-dependent user:** Violet borders and underlines cannot be the only selected-state signal. Intent controls, method controls, advanced selection, and asynchronous statuses require semantic state, visible focus, linear keyboard order, and readable secondary copy.

## Minor Observations

- Use the product violet for the primary action rather than an unrelated navy button.
- Keep one Registry-derived license receipt near the result; remove duplicated license links.
- Apply `Recommended` to a specific setup or method, never as a floating badge.
- `Quick embed` is more approachable than `CDN` as a visible label; `jsDelivr CDN` can remain supporting text.
- Keep specimen content entirely in Preview and keep the full matrix entirely behind `Change`.

## Questions to Consider

- What if the page asks only “Where will you use Roboto?” before showing any technical method?
- Can one shared selection drive Download, Package, and Quick embed without rebuilding it?
- Does the user need anything beyond included files, license, and one download action before completion?
- Should complete family be an escape hatch or a preset inside `Change`?
