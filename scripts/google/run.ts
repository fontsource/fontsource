import fs from "fs-extra";
import { APIv2, APIVariable } from "google-font-metadata";
import jsonfile from "jsonfile";

import { download } from "./download-file";
import { packagerV1 } from "./packager-v1";
import { packagerV2 } from "./packager-v2";
import { variable } from "./variable";
import { packageJson } from "../templates/package";
import { generateSCSS } from "../templates/scss";
import { readme } from "../templates/readme";

const run = (id: string, force: string): void => {
  const font = APIv2[id];

  // Set file directories
  const fontDir = `packages/${font.id}`;
  fs.ensureDirSync(fontDir);

  // Update checking
  let changed = false;

  if (fs.existsSync(`${fontDir}/metadata.json`)) {
    const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`);
    changed = metadata.lastModified !== font.lastModified;
  } else {
    changed = true;
  }

  if (changed || force === "force") {
    // Wipe old font files preserving package.json
    if (fs.existsSync(`${fontDir}/package.json`)) {
      fs.copySync(
        `./${fontDir}/package.json`,
        `./scripts/temp_packages/${font.id}-package.json`
      );
      fs.emptyDirSync(fontDir);
      fs.copySync(
        `./scripts/temp_packages/${font.id}-package.json`,
        `./${fontDir}/package.json`
      );
      fs.removeSync(`./scripts/temp_packages/${font.id}-package.json`);
    }

    interface Axes {
      [axesType: string]: {
        default: string;
        min: string;
        max: string;
        step: string;
      };
    }
    // Check if variable font
    let variableMeta: boolean | Axes = false;
    let variableFlag = false;
    if (font.id in APIVariable) {
      variable(font.id);
      variableMeta = APIVariable[font.id].axes;

      variableFlag = true;
    }

    // Download files
    download(font.id, variableFlag);

    // Generate CSS files
    packagerV1(font.id);
    packagerV2(font.id);

    // Generate SCSS files
    fs.ensureDirSync(`./${fontDir}/scss`);
    const scss = generateSCSS(font.id, variableFlag);
    fs.writeFileSync(`${fontDir}/scss/mixins.scss`, scss);

    // Write README.md
    const packageReadme = readme({
      fontId: font.id,
      fontName: font.family,
      subsets: font.subsets,
      weights: font.weights,
      styles: font.styles,
      variable: variableFlag,
      version: font.version,
      type: "google",
    });

    fs.writeFileSync(`${fontDir}/README.md`, packageReadme);

    // Don't create package.json if already exists to prevent lerna versioning conflicts
    if (!fs.existsSync(`${fontDir}/package.json`)) {
      const mainRepoPackageJson = jsonfile.readFileSync("./package.json");
      // Write out package.json file
      const packageJSON = packageJson({
        fontId: font.id,
        fontName: font.family,
        version: mainRepoPackageJson.version,
      });

      fs.writeFileSync(`${fontDir}/package.json`, packageJSON);
    }

    // Write metadata.json
    jsonfile.writeFileSync(`${fontDir}/metadata.json`, {
      fontId: font.id,
      fontName: font.family,
      subsets: font.subsets,
      weights: font.weights,
      styles: font.styles,
      defSubset: font.defSubset,
      variable: variableMeta,
      lastModified: font.lastModified,
      version: font.version,
      category: font.category,
      source: "https://fonts.google.com/",
      license: "https://fonts.google.com/attribution",
      type: "google",
    });

    // Copy CHANGELOG.md over from main repo
    fs.copySync(`./CHANGELOG.md`, `${fontDir}/CHANGELOG.md`);
  }

  console.log(`Finished processing ${font.id}`);
};

export { run };
