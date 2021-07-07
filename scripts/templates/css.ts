import { template } from "lodash";

const fontFace = template(
  `/* <%= fontId %>-<%= subset %>-<%= weight %>-<%= style %>*/
@font-face {
  font-family: '<%= fontName %>';
  font-style: <%= style %>;
  font-display: swap;
  font-weight: <%= weight %>;
  src: url('<%= woff2Path %>') format('woff2'), url('<%= woffPath %>') format('woff');
  <% if (unicodeRange) { %>unicode-range: <%= unicodeRange %>;<% } %>
}
`
);

const fontFaceVariable = template(
  `/* <%= fontId %>-<%= subset %>-variable-<%= type %>-<%= style %> */
@font-face {
  font-family: '<%= fontName %>';
  font-style: <%= style %>;
  font-display: swap;
  font-weight: <%= weight %>;
  src: url('<%= woff2Path %>') format('woff2');
  unicode-range: <%= unicodeRange %>;
}  
`
);

const fontFaceVariableWdth = template(
  `/* <%= fontId %>-<%= subset %>-variable-<%= type %>-<%= style %> */
@font-face {
  font-family: '<%= fontName %>';
  font-style: <%= style %>;
  font-display: swap;
  font-weight: <%= weight %>;
  font-stretch: <%= wdth %>;
  src: url('<%= woff2Path %>') format('woff2');
  unicode-range: <%= unicodeRange %>;
}  
`
);

export { fontFace, fontFaceVariable, fontFaceVariableWdth };
