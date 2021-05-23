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

const run = async (id: string, force: string): Promise<void> => {
  const font = APIv2[id];

  // Set file directories
  const fontDir = `packages/${font.id}`;
  await fs.ensureDir(fontDir);

  // Update checking
  let changed = false;

  try {
    await fs.access(`${fontDir}/metadata.json`);
    const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`);
    changed = metadata.lastModified !== font.lastModified;
  } catch {
    changed = true;
  }

  if (changed || force === "force") {
    // Wipe old font files preserving package.json
    try {
      await fs.access(`${fontDir}/package.json`);
      await fs.copy(
        `./${fontDir}/package.json`,
        `./scripts/temp_packages/${font.id}-package.json`
      );
      await fs.emptyDir(fontDir);
      await fs.copy(
        `./scripts/temp_packages/${font.id}-package.json`,
        `./${fontDir}/package.json`
      );
      await fs.remove(`./scripts/temp_packages/${font.id}-package.json`);
    } catch {
      // Continue regardless of error
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
    await download(font.id, variableFlag);

    // Generate CSS files
    packagerV1(font.id);
    packagerV2(font.id);

    // Generate SCSS files
    await fs.ensureDir(`./${fontDir}/scss`);
    const scss = generateSCSS(font.id, variableFlag);
    await fs.writeFile(`${fontDir}/scss/mixins.scss`, scss);

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

    await fs.writeFile(`${fontDir}/README.md`, packageReadme);

    // Don't create package.json if already exists to prevent lerna versioning conflicts
    try {
      await fs.access(`${fontDir}/package.json`);
    } catch {
      const mainRepoPackageJson = await jsonfile.readFile("./package.json");
      // Write out package.json file
      const packageJSON = packageJson({
        fontId: font.id,
        fontName: font.family,
        version: mainRepoPackageJson.version,
      });

      await fs.writeFile(`${fontDir}/package.json`, packageJSON);
    }

    // Write metadata.json
    await jsonfile.writeFile(`${fontDir}/metadata.json`, {
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
    await fs.copy(`./CHANGELOG.md`, `${fontDir}/CHANGELOG.md`);
  }
};

export { run };
