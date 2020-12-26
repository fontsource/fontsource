const _ = require("lodash")

exports.fontFace = _.template(
  `/* <%= fontId %>-<%= subset %>-<%= weight %>-<%= style %>*/
@font-face {
  font-family: '<%= fontName %>';
  font-style: <%= style %>;
  font-display: swap;
  font-weight: <%= weight %>;
  src:<% _.forEach(locals, function(localName) { %>
    local('<%= localName %>'),<% });
    %> url('<%= woff2Path %>') format('woff2'), url('<%= woffPath %>') format('woff');
  <% if (unicodeRange) { %>unicode-range: <%= unicodeRange %>;<% } %>
}
`
)

exports.fontFaceVariable = _.template(
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
)

exports.fontFaceVariableWdth = _.template(
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
)
