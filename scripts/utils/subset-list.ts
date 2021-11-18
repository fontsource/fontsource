import jsonfile from "jsonfile";
import path from "path";

import { directories } from "./utils";

const subsets: string[] = [];
directories.forEach(directory => {
  const metadataPath = path.join("./packages", directory, "metadata.json");
  const metadata = jsonfile.readFileSync(metadataPath);
  subsets.push(...metadata.subsets);
});

const noDuplicateSubsets = new Set(subsets);

console.log([...noDuplicateSubsets].join(", "));
