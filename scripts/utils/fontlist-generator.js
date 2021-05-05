const _ = require("lodash")
const fs = require("fs-extra")
const jsonfile = require("jsonfile")

const { directories } = require("./utils")

const fontlist = []
const league = []
const icons = []
const other = []

directories.forEach(directory => {
  const fontDir = `./packages/${directory}`
  const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`)
  const object = { [metadata.fontId]: metadata.type }
  fontlist.push(object)

  if (metadata.type === "league") {
    league.push(metadata.fontId)
  } else if (metadata.type === "icons") {
    icons.push(metadata.fontId)
  } else if (metadata.type === "other") {
    other.push(metadata.fontId)
  } else if (metadata.type === "google") {
    // Empty to prevent calling unknown type catch
  } else {
    console.log(`${metadata.fontId} has unknown type ${metadata.type}.`)
  }
})

// Write JSON list to be pulled externally.
jsonfile.writeFile("FONTLIST.json", Object.assign({}, ...fontlist))

// Write MD file
const fontlistMarkdown = _.template(
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

const fontlistWrite = fontlistMarkdown({
  league,
  icons,
  other,
})

fs.writeFileSync(`FONTLIST.md`, fontlistWrite)
