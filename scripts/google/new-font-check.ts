import fs from "node:fs";
import _ from "lodash";
import path from "node:path";
import { getDirectories } from "scripts/utils/utils";

// Google may sometimes push a new font that already exists in the generic folder
// This checks if there are any duplicates between the two font folders and purges the duplicate from generic
const directories = [...getDirectories("google"), ...getDirectories("generic")];

// Finds duplicates between the two directories
const findDuplicates = (dirs: string[]) =>
  _.filter(dirs, (value, index, iteratee) =>
    _.includes(iteratee, value, index + 1)
  );

const duplicates = findDuplicates(directories);

// Delete all duplicate dirs
const deleteDuplicates = (duplicateDirs: string[]): string[] => {
  duplicateDirs.forEach(dir => {
    try {
      fs.rmSync(path.join("fonts", "generic", dir), { recursive: true });
    } catch {
      console.error(`Error while deleting ${dir}.`);
    }
  });
  return duplicateDirs;
};

export { directories, duplicates, findDuplicates, deleteDuplicates };
