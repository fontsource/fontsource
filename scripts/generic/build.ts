import fs from "fs-extra";
import glob from "glob";

import { packager } from "./generic-packager";
import { config } from "./config";

const {
  fontId,
  fontName,
  defSubset,
  category,
  sourcelink,
  licenselink,
  version,
  type,
} = config;

// Create folder structure
const fontFileDir = "scripts/generic/files";
const fontDir = `scripts/generic/${fontId}`;
fs.ensureDirSync(fontDir);
fs.ensureDirSync(`${fontDir}/files`);

// Move files into package dir
fs.copy(fontFileDir, `${fontDir}/files`, err => {
  if (err) return console.error(err);
  return console.log("Copied files into package.");
});

// Read filenames to derive the following information
glob(`${fontFileDir}/**/*.woff2`, {}, (err, files) => {
  let subsets: string[] = [];
  let weights: number[] = [];
  let styles: string[] = [];

  files.forEach(file => {
    // Remove file path and extension.
    // 23 characters to account for scripts / generic /...filepath, -6 for .woff2
    const name = file.slice(23 + fontId.length, -6).split("-");
    styles.push(name.slice(-1)[0]);
    name.pop();
    weights.push(Number(name.slice(-1)[0]));
    name.pop();
    subsets.push(name.join("-"));
  });
  subsets = [...new Set(subsets)];
  weights = [...new Set(weights)];
  const stringWeights = weights.map(weight => String(weight));
  styles = [...new Set(styles)];

  if (err) {
    console.error(err);
  }

  // Create object to store all necessary data to run package function
  const datetime = new Date();

  const fontObject = {
    fontId,
    fontName,
    subsets,
    weights: stringWeights,
    styles,
    defSubset,
    variable: false,
    lastModified: datetime.toISOString().slice(0, 10),
    category,
    source: sourcelink,
    license: licenselink,
    version,
    type,

    fontDir,
    packageVersion: undefined,
  };

  // Generate files (false for rebuildFlag)
  packager(fontObject, false);
});
