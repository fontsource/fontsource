import * as _ from "lodash";
import async from "async";
import fs from "fs-extra";
import { APIv2, APIVariable } from "google-font-metadata";
import { EventEmitter } from "events";

import { run } from "./run";

const force = process.argv[2];

fs.ensureDirSync("packages");
fs.ensureDirSync("scripts/temp_packages");

// Create an async queue object
const processQueue = (fontId: string, cb: () => void) => {
  console.log(`Downloading ${fontId}`);
  run(fontId, force);
  cb();
};

// EventEmitter listener is usually set at a default limit of 10, below chosen 12 concurrent workers
EventEmitter.defaultMaxListeners = 0;

const queue = async.queue(processQueue, 12);

queue.drain(() => {
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
