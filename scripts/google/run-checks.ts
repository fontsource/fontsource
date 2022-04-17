import async from "async";
import { APIv2 } from "google-font-metadata";

import {
  downloadFileCheck,
  findChangedPackages,
} from "scripts/utils/file-check";
import { deleteDuplicates, duplicates } from "./new-font-check";
import { run } from "./run";

/**
 * Function that force downloads the font as it comes from a failing font file check.
 *
 * @param fontId font to be processed
 */
const processQueueCheck = async (fontId: string) => {
  if (fontId in APIv2) {
    console.log(`Downloading ${fontId} [QUEUECHECK]`);
    await run(fontId, "force");
    console.log(`Finished processing ${fontId} [QUEUECHECK]`);
  } else {
    throw new Error(`${fontId} not a Google Font! [QUEUECHECK]`);
  }
  Promise.resolve().catch(error => {
    throw error;
  });
};

/**
 * Async queue to run all checks.
 */
const queueCheck = async.queue(processQueueCheck, 3);

// When queue is finished
queueCheck.drain(async () => {
  console.log("Re-checking all fonts... [QUEUECHECK]");
  downloadFileCheck(await findChangedPackages(), true); // This time will throw and fail build if fails
  console.log("Success. [QUEUECHECK]");
});

queueCheck.error((err, fontid) => {
  console.error(`${fontid} experienced an error. [QUEUECHECK]`, err);
});

/**
 * Main function that runs when this file is called directly with ts-node. Driver logic.
 */
const runChecks = async () => {
  console.log("\nChecking font files...");
  const changedPackages = downloadFileCheck(await findChangedPackages());
  console.log(changedPackages);
  for (const changedPackage of changedPackages) {
    queueCheck.push(changedPackage);
  }

  // If Google adds an existing generic font, there will be duplicates in two directories
  // This deletes the duplicate font
  const deletedDuplicates = deleteDuplicates(duplicates);
  if (deletedDuplicates.length > 0)
    console.log(`Deleted duplicate fonts ${deletedDuplicates}.`);
};

runChecks();
