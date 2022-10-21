// Generate filenames and paths
// Used by the downloader into repo
const makeFontDownloadPath = (
  fontDir: string,
  fontId: string,
  subset: string,
  weight: number,
  style: string,
  extension: string
): string => `./${fontDir}/files/${fontId}-${subset}-${weight}-${style}.${extension}`;

const makeVariableFontDownloadPath = (
  fontDir: string,
  fontId: string,
  subset: string,
  type: string,
  style: string
): string => `./${fontDir}/files/${fontId}-${subset}-variable-${type}-${style}.woff2`;

// Used for the CSS filepaths
const makeFontFilePath = (
  fontId: string,
  subset: string,
  weight: number,
  style: string,
  extension: string
): string => `./files/${fontId}-${subset}-${weight}-${style}.${extension}`;

const makeVariableFontFilePath = (
  fontId: string,
  subset: string,
  type: string,
  style: string
): string => `./files/${fontId}-${subset}-variable-${type}-${style}.woff2`;


export {
  makeFontDownloadPath,
  makeFontFilePath,
  makeVariableFontDownloadPath,
  makeVariableFontFilePath,
};
