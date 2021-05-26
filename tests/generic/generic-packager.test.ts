import mock from "mock-fs";
import { readDir, readDirContents } from "../helpers";

import { packager } from "../../scripts/generic/generic-packager";

const testFont = {
  fontId: "clear-sans",
  fontName: "Clear Sans",
  subsets: ["all"],
  weights: [100, 300, 400, 500, 700],
  styles: ["normal", "italic"],
  defSubset: "all",
  variable: false,
  lastModified: "2020-10-15",
  version: "1.00",
  category: "display",
  source: "https://01.org/clear-sans",
  license: "http://www.apache.org/licenses/LICENSE-2.0",
  type: "other",

  fontDir: "packages/clear-sans",
  packageVersion: "4.3.0",
};

const testIcon = {
  fontId: "material-icons",
  fontName: "Material Icons",
  subsets: ["base"],
  weights: [400],
  styles: ["normal"],
  defSubset: "base",
  variable: false,
  lastModified: "2021-03-31",
  version: "v4",
  category: "other",
  source: "https://github.com/google/material-design-icons",
  license:
    "https://github.com/google/material-design-icons/blob/master/LICENSE",
  type: "icons",

  fontDir: "packages/material-icons",
  packageVersion: "4.3.0",
};

describe("Generate Generic CSS", () => {
  beforeEach(() => {
    mock({
      packages: {
        "clear-sans": {
          /* Empty directory */
        },
        "material-icons": {
          /* Empty directory */
        },
      },
    });
  });

  test("Clear Sans CSS", () => {
    packager(testFont, true);
    const dirPath = "./packages/clear-sans";
    const fileNames = readDir(dirPath);

    expect(fileNames).toEqual([
      "100-italic.css",
      "100.css",
      "300-italic.css",
      "300.css",
      "400-italic.css",
      "400.css",
      "500-italic.css",
      "500.css",
      "700-italic.css",
      "700.css",
      "all-100-italic.css",
      "all-100.css",
      "all-300-italic.css",
      "all-300.css",
      "all-400-italic.css",
      "all-400.css",
      "all-500-italic.css",
      "all-500.css",
      "all-700-italic.css",
      "all-700.css",
      "all.css",
      "index.css",
    ]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./tests/generic/data/clear-sans",
      fileNames
    );
    expect(cssContent).toEqual(expectedCSSContent);
  });

  test("Material Icons CSS", () => {
    packager(testIcon, true);
    const dirPath = "./packages/material-icons";
    const fileNames = readDir(dirPath);

    expect(fileNames).toEqual([
      "400.css",
      "base-400.css",
      "base.css",
      "index.css",
    ]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./tests/generic/data/material-icons",
      fileNames
    );
    expect(cssContent).toEqual(expectedCSSContent);
  });

  afterEach(() => {
    mock.restore();
  });
});
