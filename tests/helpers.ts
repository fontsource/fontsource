import fs from "fs-extra";
import path from "path";

const readDir = (dirPath: string, extension: string): string[] => {
  const fileArr: string[] = [];
  fs.readdirSync(dirPath).forEach(file => {
    const fileExtension = file.split(".")[1];
    if (extension === fileExtension) {
      fileArr.push(file);
    }
  });

  return fileArr;
};

const readDirContents = (dirPath: string, fileNames: string[]): string[] => {
  const fileContents: string[] = [];

  fileNames.forEach(file => {
    const content = fs
      .readFileSync(path.join(dirPath, file))
      .toString()
      // Remove whitespace due to possible diffs
      .replace(/\s/g, "");
    fileContents.push(content);
  });
  return fileContents;
};

export { readDir, readDirContents };
