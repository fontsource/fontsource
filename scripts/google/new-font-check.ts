import fs from "node:fs";

import _ from "lodash";
import path from "node:path";
import jsonfile from "jsonfile";
import { getDirectories } from "scripts/utils/utils";

/**
 * Google may sometimes push a new font that already exists in the generic folder
 * This checks if there are any duplicates between the two font folders and purges the duplicate from generic
 */

/**
 * Gets all directories in all font folders
 */
const directories = [
  ...getDirectories("google"),
  ...getDirectories("league"),
  ...getDirectories("icons"),
  ...getDirectories("other"),
];

/**
 * Find all the duplicate values in the given array
 * @param dirs array of directory names
 * @returns the duplicate values
 */
const findDuplicates = (dirs: string[]) =>
  _.filter(dirs, (value, index, iteratee) =>
    _.includes(iteratee, value, index + 1)
  );

const duplicates = findDuplicates(directories);

/**
 * Delete all the duplicate directories from the font folder
 * @param duplicateDirs array of directory names
 * @returns
 */
const deleteDuplicates = (duplicateDirs: string[]): string[] => {
  duplicateDirs.forEach(dir => {
    let packageJson;
    try {
      // Check other directory
      if (fs.existsSync(path.join("fonts", "other", dir))) {
        packageJson = jsonfile.readFileSync(
          path.join("fonts", "other", dir, "package.json")
        );
        fs.rmSync(path.join("fonts", "other", dir), { recursive: true });

        // Check icons directory
      } else if (fs.existsSync(path.join("fonts", "icons", dir))) {
        packageJson = jsonfile.readFileSync(
          path.join("fonts", "icons", dir, "package.json")
        );
        fs.rmSync(path.join("fonts", "icons", dir), { recursive: true });
        // Check league directory
      } else if (fs.existsSync(path.join("fonts", "league", dir))) {
        packageJson = jsonfile.readFileSync(
          path.join("fonts", "league", dir, "package.json")
        );
        fs.rmSync(path.join("fonts", "league", dir), { recursive: true });
      } else {
        throw new Error(`Unable to find dir ${dir}`);
      }
    } catch {
      console.error(`Error while deleting ${dir}.`);
    }

    // This is necessary as the newly generated Google package version will not match the existing NPM version
    const packageJsonGoogle = jsonfile.readFileSync(
      path.join("fonts", "google", dir, "package.json")
    );
    packageJsonGoogle.version = packageJson.version;
    jsonfile.writeFileSync(
      path.join("fonts", "google", dir, "package.json"),
      packageJsonGoogle
    );
  });
  return duplicateDirs;
};

export { directories, duplicates, findDuplicates, deleteDuplicates };
