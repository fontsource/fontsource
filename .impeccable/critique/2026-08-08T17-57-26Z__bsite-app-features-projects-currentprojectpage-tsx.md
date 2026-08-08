---
target: the app font set flow
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-08T17-57-26Z
slug: bsite-app-features-projects-currentprojectpage-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Saved and loading states exist, but duplicate actions could report false updates. |
| 2 | Match System / Real World | 2 | Font Set mixed basket, code generator, collection, and compliance models. |
| 3 | User Control and Freedom | 2 | Single-font removal had no undo and one-font output was hidden. |
| 4 | Consistency and Standards | 2 | Three Font Set actions used different labels and overlapping feedback. |
| 5 | Error Prevention | 2 | Destructive row removal was immediate and ZIP preparation could race mutations. |
| 6 | Recognition Rather Than Recall | 3 | Exact setup details were visible, but repeated Registry language obscured impact. |
| 7 | Flexibility and Efficiency | 3 | Bulk ZIP and combined code were strong, but a single font required a second reveal. |
| 8 | Aesthetic and Minimalist Design | 2 | Four peer header actions and repeated warnings diluted the primary tasks. |
| 9 | Error Recovery | 2 | Bulk clear had confirmation, but individual removal was irreversible. |
| 10 | Help and Documentation | 3 | Package and CDN steps were clear; stale-data recovery was repetitive and technical. |
| **Total** | | **24/40** | **Acceptable; significant polish required** |

## Design Specificity Verdict

The specimen-first rows, exact-version output, and per-family license receipt are specific to Fontsource. The acquisition handoff was generic cart UI, and the page tried to be a basket, download center, code generator, collection bridge, and compliance receipt at once.

The deterministic CLI scan returned zero source findings. The live detector found actionable contrast on the selected package-manager control and repeated long warning copy. Its cramped-padding and page-level gradient/transition findings were false positives because the controls had explicit 44px targets and no matching source declarations.

## Overall Impression

The product foundation was strong, but the flow felt buggy because saved state was fragmented across duplicate actions and the page hid the result for the simplest one-font case. The biggest opportunity was to make Font Set a direct continuation of browsing: save, review, download, or generate code without another reveal step.

## What's Working

- Get Font clearly separates design/desktop downloads from developer setup.
- Generated package and CDN output is exact-versioned, sequential, and copyable.
- Local persistence, ZIP progress, and add/update undo feedback provide a sound base.

## Priority Issues

### [P1] Duplicate saved-state controls

Three separate Font Set controls could disagree on Add, Update, or In Font Set and mount overlapping confirmation surfaces. Use one canonical status per acquisition surface and compare the current setup with the saved setup before offering Update.

### [P1] One-font output hidden behind a second action

A user who saved one setup landed on a Font Set page where package/CDN instructions were hidden. Always render website setup whenever the set is non-empty and remove the duplicate Generate prompt.

### [P1] Removal was not recoverable

One click discarded a configured family while bulk clear required confirmation. Provide an inline Undo and family-specific accessible names.

### [P2] Warning repetition overwhelmed the outcome

The same stale Registry state appeared in each row, the delivery section, and the license receipt. Consolidate it into one plain-language review notice with direct family links.

### [P2] Header actions lacked hierarchy

Generate, Browse, Collection, and Remove were peers. Keep Browse as the visible continuation, expose Website setup as a direct destination, and quiet the secondary collection and clear actions.

## Persona Red Flags

- **Alex, power user:** could not tell whether an unchanged setup needed updating and could lose custom axes with one Remove click.
- **Jordan, first-timer:** had to infer the difference between Collections and Font Set while technical Registry language repeated before a clear outcome.
- **Sam, keyboard and screen-reader user:** semantic groups were strong, but generic Edit and Remove names did not identify the affected family.

## Minor Observations

- Specialized symbol specimens need verified short tokens rather than a large fallback-like family label.
- Import feedback should be consumed once instead of replaying on browser history navigation.
- A ZIP stylesheet that loads from CDN must be named as such so it is not mistaken for the bundled local CSS.

## Questions to Consider

- Is Font Set primarily an acquisition basket or a persistent developer workspace?
- Should Collections organize taste while Font Set organizes delivery, with that distinction stated at conversion points?
- Can Registry metadata refresh automatically instead of becoming a per-family user chore?
