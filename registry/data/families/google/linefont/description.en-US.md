Linefont is a variable font with Weight and Width axes for rendering small to medium-scale line charts.

Linefont values span from 0 to 100, assigned to different characters:

-   0-9 chars are for simplified manual input with step 10 (bar height = number).
-   a-z/A-Z for manual input with step 2, softened at edges a and Z (bar height = number of letter).
-   U+0100-017F for 0..127 values with step 1.

The axis range values are compatible with [Wavefont](https://fonts.google.com/specimen/Wavefont) by the same author, so the families can be used together with visual coherency.

To contribute, see [github.com/dy/linefont](https://github.com/dy/linefont).
