import fs from "node:fs";
import _ from "lodash";
import path from "node:path";
import { getDirectories } from "scripts/utils/utils";

// Google may sometimes push a new font that already exists in the generic folder
// This checks if there are any duplicates between the two font folders and purges the duplicate from generic
const directories = [
  ...getDirectories("google"),
  ...getDirectories("league"),
  ...getDirectories("icons"),
  ...getDirectories("other"),
];

// Finds duplicates between the directories
const findDuplicates = (dirs: string[]) =>
  _.filter(dirs, (value, index, iteratee) =>
    _.includes(iteratee, value, index + 1)
  );

const duplicates = findDuplicates(directories);

// Delete all duplicate dirs
const deleteDuplicates = (duplicateDirs: string[]): string[] => {
  duplicateDirs.forEach(dir => {
    try {
      // Check other directory
      if (fs.existsSync(path.join("fonts", "other", dir))) {
        fs.rmSync(path.join("fonts", "other", dir), { recursive: true });
        // Check icons directory
      } else if (fs.existsSync(path.join("fonts", "icons", dir))) {
        fs.rmSync(path.join("fonts", "icons", dir), { recursive: true });
        // Check league directory
      } else if (fs.existsSync(path.join("fonts", "league", dir))) {
        fs.rmSync(path.join("fonts", "league", dir), { recursive: true });
      } else {
        throw new Error(`Unable to find dir ${dir}`);
      }
    } catch {
      console.error(`Error while deleting ${dir}.`);
    }
  });
  return duplicateDirs;
};

export { directories, duplicates, findDuplicates, deleteDuplicates };
