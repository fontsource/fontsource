const _ = require(`lodash`)

exports.fontlistMarkdown = _.template(
  `# Supported Font List

## [Search Directory](https://fontsource.github.io/search-directory/)

Can be found [here](https://fontsource.github.io/search-directory/).

## [Google Fonts](https://fonts.google.com/)

All Google Fonts are supported and updated weekly. Find the whole list [here](https://fonts.google.com/).

Variable fonts from Google are included. Supported list [here](https://fonts.google.com/variablefonts).

## [The League Of Moveable Type](https://www.theleagueofmoveabletype.com/)
<% _.forEach(league, function(fontName) { %>
- <%= fontName %><% });%>

## Icons
<% _.forEach(icons, function(fontName) { %>
- <%= fontName %><% });%>

## Other
<% _.forEach(other, function(fontName) { %>
- <%= fontName %><% });%>`
)
