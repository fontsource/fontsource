import fs from "fs-extra";
import jsonfile from "jsonfile";
import { directories } from "./utils";

directories.forEach(directory => {
  const fontDir = `./packages/${directory}`;
  const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`);
  const packageJSON = jsonfile.readFileSync(`${fontDir}/package.json`);
  fs.removeSync(`${fontDir}/package.json`);
  jsonfile.writeFileSync(`${fontDir}/package.json`, {
    name: packageJSON.name,
    version: packageJSON.version,
    description: `Self-host the ${metadata.fontName} font in a neatly bundled NPM package.`,
    main: "index.css",
    publishConfig: {
      access: "public",
    },
    keywords: packageJSON.keywords,
    author: "Lotus <declininglotus@gmail.com>",
    license: "MIT",
    homepage: `https://github.com/fontsource/fontsource/tree/master/packages/${metadata.fontId}#readme`,
    repository: {
      type: "git",
      url: "https://github.com/fontsource/fontsource.git",
      directory: `packages/${metadata.fontId}`,
    },
  });
});
