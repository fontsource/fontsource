import fs from "fs-extra";

// Generate filenames and paths
// Used by the downloader into repo
const makeFontDownloadPath = (
  fontDir: string,
  fontId: string,
  subset: string,
  weight: number,
  style: string,
  extension: string
): string => {
  return `./${fontDir}/files/${fontId}-${subset}-${weight}-${style}.${extension}`;
};

const makeVariableFontDownloadPath = (
  fontDir: string,
  fontId: string,
  subset: string,
  type: string,
  style: string
): string => {
  return `./${fontDir}/files/${fontId}-${subset}-variable-${type}-${style}.woff2`;
};

// Used for the CSS filepaths
const makeFontFilePath = (
  fontId: string,
  subset: string,
  weight: number,
  style: string,
  extension: string
): string => {
  return `./files/${fontId}-${subset}-${weight}-${style}.${extension}`;
};

const makeVariableFontFilePath = (
  fontId: string,
  subset: string,
  type: string,
  style: string
): string => {
  return `./files/${fontId}-${subset}-variable-${type}-${style}.woff2`;
};

// Insert a weight array to find the closest number given num - used for index.css gen
const findClosest = (arr: number[], num: number): number => {
  // Array of absolute values showing diff from target number
  const indexArr = arr.map(weight => Math.abs(Number(weight) - num));
  // Find smallest diff
  const min = Math.min(...indexArr);
  const closest = arr[indexArr.indexOf(min)];

  return closest;
};

// Find names of all packages.
const getDirectories = (type: string) =>
  fs
    .readdirSync(`./fonts/${type}`, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

interface AxesData {
  [axes: string]: {
    default: string;
    min: string;
    max: string;
    step: string;
  };
}
const getVariableWght = (axes: AxesData) => {
  if (!axes.wght) return `400`;

  if (axes.wght.min === axes.wght.max) return `${axes.wght.min}`;

  return `${axes.wght.min} ${axes.wght.max}`;
};

export {
  makeFontDownloadPath,
  makeFontFilePath,
  makeVariableFontDownloadPath,
  makeVariableFontFilePath,
  findClosest,
  getDirectories,
  getVariableWght,
};
