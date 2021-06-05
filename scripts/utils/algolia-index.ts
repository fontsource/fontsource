import algoliasearch from "algoliasearch";
import jsonfile from "jsonfile";
import * as dotenv from "dotenv";

import { directories } from "./utils";

interface Metadata {
  objectID: string;
}

const indexArray: Metadata[] = [];

// Copy all metadatas into one array
directories.forEach(directory => {
  const fontDir = `./packages/${directory}`;
  const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`);
  metadata.objectID = metadata.fontId;
  if (metadata.variable) {
    metadata.variable = true;
  }
  indexArray.push(metadata);
});

// Written as it is used by the website getStaticPaths
jsonfile.writeFileSync("./website/src/configs/algolia.json", indexArray);

// Initialise Algolia client
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const client = algoliasearch(
  "WNATE69PVR",
  process.env.ALGOLIA_ADMIN_KEY as string
);
const index = client.initIndex("prod_FONTS");

index
  .saveObjects(indexArray)
  .then(() => console.log("Updated fonts."))
  .catch(error => console.log(error));
