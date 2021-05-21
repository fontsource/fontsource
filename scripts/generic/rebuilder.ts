import fs from "fs-extra";
import jsonfile from "jsonfile";

import { packager } from "./generic-packager";
import { directories } from "../utils/utils";

directories.forEach(directory => {
  const fontDir = `./packages/${directory}`;
  const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`);

  // Rebuild only non-Google fonts
  if (metadata.type !== "google") {
    const packageJSONData = jsonfile.readFileSync(`${fontDir}/package.json`);

    // Clear directory
    fs.copySync(`${fontDir}/files`, `./scripts/temp_packages/${directory}`);
    fs.emptyDirSync(fontDir);
    fs.copySync(`./scripts/temp_packages/${directory}`, `./${fontDir}/files`);
    fs.removeSync(`./scripts/temp_packages/${directory}`);

    // Create object to store all necessary data to run package function
    const fontObject = {
      fontId: metadata.fontId,
      fontName: metadata.fontName,
      subsets: metadata.subsets,
      weights: metadata.weights,
      styles: metadata.styles,
      defSubset: metadata.defSubset,
      variable: false,
      lastModified: metadata.lastModified,
      version: metadata.version,
      category: metadata.category,
      source: metadata.source,
      license: metadata.license,
      type: metadata.type,

      fontDir,
      packageVersion: packageJSONData.version,
    };

    // Generate files (true for rebuildFlag)
    packager(fontObject, true);
  }
});
