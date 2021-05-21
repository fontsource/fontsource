import fs from "fs-extra";
import path from "path";

const readDir = (dirPath: string): string[] => {
  const fileArr: string[] = [];
  fs.readdirSync(dirPath).forEach(file => {
    const extension = file.split(".")[1];
    if (extension === "css" || extension === "scss") {
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
