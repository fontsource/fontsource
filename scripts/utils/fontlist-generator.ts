import * as _ from "lodash";
import fs from "fs-extra";
import jsonfile from "jsonfile";

import { directories } from "./utils";

interface FontList {
  [x: string]: string;
}

const fontlist: FontList[] = [];
const league: string[] = [];
const icons: string[] = [];
const other: string[] = [];

interface Metadata {
  fontId: string;
  type: string;
}

directories.forEach(directory => {
  const fontDir = `./packages/${directory}`;

  try {
    const metadata: Metadata = jsonfile.readFileSync(
      `${fontDir}/metadata.json`
    );
    const object = { [metadata.fontId]: metadata.type };
    fontlist.push(object);

    switch (metadata.type) {
      case "league": {
        league.push(metadata.fontId);
        break;
      }
      case "icons": {
        icons.push(metadata.fontId);
        break;
      }
      case "other": {
        other.push(metadata.fontId);
        break;
      }
      case "google": {
        // Empty to prevent calling unknown type catch
        break;
      }
      default: {
        console.log(`${metadata.fontId} has unknown type ${metadata.type}.`);
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// Write JSON list to be pulled externally.
jsonfile.writeFile("FONTLIST.json", Object.assign({}, ...fontlist));

// Write MD file
const fontlistMarkdown = _.template(
  `# Supported Font List

## [Search Directory](https://fontsource.org/)

Can be found [here](https://fontsource.org/).

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
);

const fontlistWrite = fontlistMarkdown({
  league,
  icons,
  other,
});

fs.writeFileSync(`FONTLIST.md`, fontlistWrite);
