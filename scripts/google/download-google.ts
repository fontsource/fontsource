import * as _ from "lodash";
import async from "async";
import fs from "fs-extra";
import { APIv2, APIVariable } from "google-font-metadata";
import { EventEmitter } from "events";

import {
  downloadFileCheck,
  findChangedPackages,
} from "scripts/utils/file-check";
import { run } from "./run";
import { deleteDuplicates, duplicates } from "./new-font-check";

const force = process.argv[2];

fs.ensureDirSync("fonts");
fs.ensureDirSync("fonts/google");
fs.ensureDirSync("scripts/temp_packages");

/**
 * Function to run everytime a queue item is added.
 *
 * @param fontId font to be processed
 */
const processQueue = async (fontId: string) => {
  console.log(`Downloading ${fontId}`);
  await run(fontId, force);
  console.log(`Finished processing ${fontId}`);
  Promise.resolve().catch(error => {
    throw error;
  });
};

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

// EventEmitter listener is usually set at a default limit of 10, below chosen 12 concurrent workers
EventEmitter.defaultMaxListeners = 0;

const queue = async.queue(processQueue, 3);
const queueCheck = async.queue(processQueueCheck, 3);

queue.drain(async () => {
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

  console.log(
    `All ${Object.keys(APIv2).length} Google Fonts have been processed.`
  );
  console.log(
    `${Object.keys(APIVariable).length} variable fonts have been processed.`
  );
});

queue.error((err, fontid) => {
  console.error(`${fontid} experienced an error.`, err);
});

queueCheck.drain(async () => {
  console.log("Re-checking all fonts... [QUEUECHECK]");
  downloadFileCheck(await findChangedPackages(), true); // This time will throw and fail build if fails
  console.log("Success. [QUEUECHECK]");
});

queueCheck.error((err, fontid) => {
  console.error(`${fontid} experienced an error. [QUEUECHECK]`, err);
});

// Testing
/* const development = () => {
  const fonts = [
    "recursive",
    "texturina",
    "cabin",
    "actor",
    "abel",
    "noto-sans-jp",
    "noto-sans-tc",
    "noto-sans-sc",
    "noto-sans-kr",
    "zilla-slab-highlight",
  ];
  fonts.forEach(font => queue.push(font));
};
development(); */

// Production
const production = () => {
  _.forOwn(APIv2, font => {
    queue.push(`${font.id}`);
  });
};
production();
