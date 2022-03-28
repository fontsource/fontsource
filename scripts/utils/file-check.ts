import { readConfig } from "mass-publish/lib/changed/read-config";
import { findDiff } from "mass-publish/lib/changed/find-diff";
import fs from "fs-extra";
import path from "node:path";
import jsonfile from "jsonfile";

/**
 * Returns a list of directory paths of packages that have changed.
 *
 * @param commitFrom Optional commit sha to compare from.
 * @param commitTo Optional commit sha to compare to.
 */
const findChangedPackages = async (
  commitFrom?: string,
  commitTo?: string
): Promise<string[]> => {
  const config = await readConfig();
  // Only used to pass custom testing SHAs
  if (typeof commitFrom !== "undefined" && typeof commitTo !== "undefined") {
    config.commitFrom = commitFrom;
    config.commitTo = commitTo;
  }

  const changedPackages = await findDiff(config);
  return changedPackages;
};

/**
 * This checks each package to have all of its necessary binary font files before publishing, else throw an error
 *
 * @param changedPackages A list of dirpaths to a changed package
 * @param throwError If it should throw an error
 */
const downloadFileCheck = (
  changedPackages: string[],
  throwError?: boolean
): string[] => {
  const fontIds: string[] = [];
  for (const changedPackage of changedPackages) {
    // A changed package could be the removal of an entire package
    // Only count existing packages
    if (fs.existsSync(path.join(changedPackage, "package.json"))) {
      // Check if files directory exists
      if (!fs.existsSync(path.join(changedPackage, "files"))) {
        if (throwError) {
          throw new Error(`${changedPackages}/files does not exist`);
        } else {
          fontIds.push(path.basename(changedPackage));
        }
      }

      // Read file that compares
      const files: string[] = jsonfile.readFileSync(
        path.join(changedPackage, "files", "file-list.json")
      );

      // Check binary files
      for (const file of files) {
        if (!fs.existsSync(file)) {
          if (throwError) {
            throw new Error(`${file} does not exist`);
          } else {
            fontIds.push(path.basename(changedPackage));
          }
        }
      }
    }
  }
  // Remove duplicates
  return [...new Set(fontIds)];
};

export { downloadFileCheck, findChangedPackages };
