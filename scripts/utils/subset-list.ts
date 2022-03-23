import jsonfile from "jsonfile";
import path from "path";

import { getDirectories } from "./utils";

const subsets: string[] = [];

const pushSubsets = (type: string) => {
  const directories = getDirectories(type);
  directories.forEach(directory => {
    const metadataPath = path.join("./fonts", type, directory, "metadata.json");
    const metadata = jsonfile.readFileSync(metadataPath);
    subsets.push(...metadata.subsets);
  });
};

pushSubsets("google");
pushSubsets("generic");

const noDuplicateSubsets = new Set(subsets);

console.log([...noDuplicateSubsets].join(", "));
