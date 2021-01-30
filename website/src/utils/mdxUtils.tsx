import fs from "fs";
import path from "path";

export const DOCS_PATH = path.join(process.cwd(), "docs");

// docsFilePaths is the list of all mdx files inside the DOCS_PATH directory
export const docsFilePaths = fs
  .readdirSync(DOCS_PATH)
  // Only include md(x) files
  .filter((path) => /\.mdx?$/.test(path));
