/* eslint-disable no-restricted-syntax */
import fs from "fs-extra";
import glob from "glob";

const weightNames = [
  "thin",
  "hairline",
  "extralight",
  "extra-light",
  "ultralight",
  "ultra-light",
  "light",
  "normal",
  "regular",
  "medium",
  "semibold",
  "semi-bold",
  "demibold",
  "demi-bold",
  "extrabold",
  "extra-bold",
  "ultrabold",
  "ultra-bold",
  "bold",
  "black",
];
const weightNum = [
  100, 100, 200, 200, 200, 200, 300, 400, 400, 500, 600, 600, 600, 600, 800,
  800, 800, 800, 700, 900,
];

const parser = (files: string[]) => {
  files.forEach(file => {
    const lowerCaseFile = file.toLowerCase();
    for (const [index] of weightNames.entries()) {
      const fileNew = lowerCaseFile.replace(
        weightNames[index],
        String(weightNum[index])
      );

      fs.renameSync(file, fileNew);
    }
  });
};

const fontFileDir = `scripts/generic/files`;

glob(`${fontFileDir}/**/*.woff2`, {}, (err, files) => {
  parser(files);
  if (err) {
    console.error(err);
  }
});

glob(`${fontFileDir}/**/*.woff`, {}, (err, files) => {
  parser(files);
  if (err) {
    console.error(err);
  }
});
