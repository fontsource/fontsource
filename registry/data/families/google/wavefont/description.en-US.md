Wavefont is a variable font with Weight, Round, and Vertical Alignment axes for rendering data like waveforms, spectrums, diagrams, and bars.

Wavefont bars correspond to values from 0 to 100, assigned to different characters:

-   0-9 chars are for simplified manual input with step 10 (bar height = number).
-   a-z/A-Z for manual input with step 2, softened at edges a and Z (bar height = number of letter).
-   U+0100-017F for 0..127 values with step 1.

letter-spacing CSS property with ch units is useful to adjust distance between bars, 1ch === 1 bar width.

To contribute, see [github.com/dy/wavefont](https://github.com/dy/wavefont)
