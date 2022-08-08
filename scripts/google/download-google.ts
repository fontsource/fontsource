import * as _ from "lodash";
import async from "async";
import fs from "fs-extra";
import { APIv2, APIVariable } from "google-font-metadata";
import { EventEmitter } from "events";

import { run } from "./run";

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

// EventEmitter listener is usually set at a default limit of 10, below chosen 12 concurrent workers
EventEmitter.defaultMaxListeners = 0;

const queue = async.queue(processQueue, 3);

queue.drain(async () => {
  console.log(
    `All ${Object.keys(APIv2).length} Google Fonts have been processed.`
  );
  console.log(
    `${Object.keys(APIVariable).length} variable fonts have been processed.`
  );
});

queue.error((err, fontid) => {
  throw new Error(`Error processing ${fontid}: ${err}`);
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
