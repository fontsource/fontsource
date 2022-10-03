import _ from "lodash";
import async from "async";
import flatten from "flat";
import fs from "fs-extra";
import isAbsoluteUrl from "is-absolute-url";
import { APIv1, APIv2, APIVariable } from "google-font-metadata";
import got from "got";
import { EventEmitter } from "events";

import type { FontVariants, FontVariantsVariable } from "google-font-metadata";
import jsonfile from "jsonfile";
import {
  makeFontDownloadPath,
  makeVariableFontDownloadPath,
} from "../utils/utils";

const gotDownload = async (url: string, dest: fs.PathLike): Promise<void> => {
  try {
    const response = await got(url).buffer();
    fs.writeFileSync(dest, response);
  } catch (error) {
    console.log(error);
  }
};

const pairGenerator = (
  variants: FontVariants | FontVariantsVariable
): string[][] => {
  // Parse API and split into variant + link array pairs. [['weight.style.subset.url|local.extension','link to font or local name'],...]
  const flattenedPairs = _.toPairs(flatten(variants)) as string[][];
  // Split ['weight.style.subset.url|local.extension'] into individual array elements
  const splitPairs = flattenedPairs.map(pair => [
    pair[0].split("."),
    pair[1],
  ]) as string[][];
  // Only choose pairs that have urls
  const urlPairs = splitPairs.filter(pair => isAbsoluteUrl(pair[1].toString()));
  // Remove ttf and otf
  const cleanedPairs = urlPairs.filter(pair => {
    const extension = pair[0][4];
    if (extension === "truetype" || extension === "opentype") {
      return false;
    }
    return true;
  });

  return cleanedPairs;
};

interface DownloadLinks {
  url: string;
  dest: string;
}

const filterLinks = (fontId: string): DownloadLinks[] => {
  const fontV1 = APIv1[fontId];
  const fontV2 = APIv2[fontId];
  const fontDir = `fonts/google/${fontId}`;

  // Parses variants into readable pairs of data
  // Temporarily force font types till fixed in google-font-metadata
  let downloadURLPairsV1 = pairGenerator(fontV1.variants);
  const downloadURLPairsV2 = pairGenerator(fontV2.variants);

  // Flag to check whether font has unicode subsets like [132]
  let hasUnicodeSubsets = false;
  const re = /\[.*?]/g;
  downloadURLPairsV2.forEach(pair => {
    if (re.test(pair[0][2])) {
      hasUnicodeSubsets = true;
    }
  });

  // If true, we need to download the woff2 files from V1. Else remove all woff2 files
  if (!hasUnicodeSubsets) {
    downloadURLPairsV1 = downloadURLPairsV1.filter(
      pair => pair[0][4] !== "woff2"
    );
  }

  // V1 { url, dest } pairs
  const linksV2Duplicates = downloadURLPairsV2.map(pair => {
    const types = pair[0];
    const dest =
      types[4] === "woff2"
        ? makeFontDownloadPath(
            fontDir,
            fontId,
            types[2].replace("[", "").replace("]", ""),
            Number(types[0]),
            types[1],
            types[4]
          )
        : makeFontDownloadPath(
            fontDir,
            fontId,
            "all",
            Number(types[0]),
            types[1],
            types[4]
          );
    const url = pair[1];
    return { url, dest };
  });

  // The "all" subset generates duplicates which need to be removed
  const linksV2 = _.uniqBy(linksV2Duplicates, item => {
    return item.url && item.dest;
  });

  // V2 { url, dest } pairs
  const linksV1 = downloadURLPairsV1.map(pair => {
    const types = pair[0];
    const dest = makeFontDownloadPath(
      fontDir,
      fontId,
      types[2],
      Number(types[0]),
      types[1],
      types[4]
    );
    const url = pair[1];
    return {
      url,
      dest,
    };
  });

  const links = [...linksV1, ...linksV2];
  return links;
};

const variableLinks = (fontId: string): DownloadLinks[] => {
  const fontVariable = APIVariable[fontId];
  const fontDir = `fonts/google/${fontId}`;

  // Temporary change until v5 is released
  const newVariants: FontVariantsVariable = {};
  // Fonts like ballet or league-gothic don't have a wght axis
  if (fontVariable.variants.wght)
    newVariants.wghtOnly = fontVariable.variants.wght;

  if (fontVariable.variants.full) newVariants.full = fontVariable.variants.full;

  const downloadURLPairsVariable = pairGenerator(newVariants);

  // Variable { url, dest } pairs
  // Types [type, style, subset]
  const links = downloadURLPairsVariable.map(pair => {
    const types = pair[0];
    const dest = makeVariableFontDownloadPath(
      fontDir,
      fontId,
      types[2],
      types[0],
      types[1]
    );
    const url = pair[1];
    return {
      url,
      dest,
    };
  });

  return links;
};

const downloadQueue = async (d: DownloadLinks, cb: () => void) => {
  const { url, dest } = d;
  await gotDownload(url, dest);
  cb();
};

EventEmitter.defaultMaxListeners = 0;
const queue = async.queue(downloadQueue, 60);

const download = async (fontId: string, isVariable: boolean): Promise<void> => {
  const fontDir = `fonts/google/${fontId}`;

  await fs.ensureDir(`./${fontDir}/files`);

  const links = filterLinks(fontId);
  // Add variable font URLs to the links array
  if (isVariable) {
    const variable = variableLinks(fontId);
    variable.forEach(link => links.push(link));
  }

  // Download all font files
  // Keep a list of all dests for download-check.ts
  const destArr: string[] = [];
  for (const d of links) {
    queue.push(d);
    destArr.push(d.dest);
  }

  await queue.drain();
  await jsonfile.writeFile(`./${fontDir}/files/file-list.json`, destArr);
};

export { download, gotDownload, pairGenerator, filterLinks, variableLinks };
