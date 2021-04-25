import fs from "fs";
import path from "path";

export const DOCS_PATH = path.join(process.cwd(), "docs");

const createDocsFilePaths = (DOCS_PATH) => {
  const files = [];

  // If it is a file, add to mdx files array for GetSTaticPaths
  const searchDirectories = (DOCS_PATH) =>
    // Check if a file or another directory
    fs.readdirSync(DOCS_PATH).forEach((file) => {
      const filePath = path.join(DOCS_PATH, file);
      if (fs.statSync(filePath).isDirectory()) {
        // Recursively go through nested directories
        return searchDirectories(filePath);
      } else {
        return files.push(filePath);
      }
    });

  searchDirectories(DOCS_PATH);

  // Filter for only include md(x) files
  return files.filter((path) => /\.mdx?$/.test(path));
};

// docsFilePaths is the list of all mdx files inside the DOCS_PATH directory
export const docsFilePaths = createDocsFilePaths(DOCS_PATH);
