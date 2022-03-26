import mock from "mock-fs";
import jsonfile from "jsonfile";
import { readDir, readDirContents } from "../helpers";

import { packager } from "../../generic/generic-packager";

const testFont = {
  fontId: "clear-sans",
  fontName: "Clear Sans",
  subsets: ["all"],
  weights: [100, 300, 400, 500, 700],
  styles: ["normal", "italic"],
  defSubset: "all",
  unicodeRange: {},
  variable: false,
  lastModified: "2020-10-15",
  version: "1.00",
  category: "display",
  source: "https://01.org/clear-sans",
  license: "http://www.apache.org/licenses/LICENSE-2.0",
  type: "other",

  fontDir: "fonts/other/clear-sans",
  packageVersion: "4.3.0",
};

const testIcon = {
  fontId: "material-icons",
  fontName: "Material Icons",
  subsets: ["base"],
  weights: [400],
  styles: ["normal"],
  defSubset: "base",
  unicodeRange: {},
  variable: false,
  lastModified: "2021-03-31",
  version: "v4",
  category: "other",
  source: "https://github.com/google/material-design-icons",
  license:
    "https://github.com/google/material-design-icons/blob/master/LICENSE",
  type: "icons",

  fontDir: "fonts/icons/material-icons",
  packageVersion: "4.3.0",
};

describe("Generate Generic CSS", () => {
  beforeEach(() => {
    mock({
      fonts: {
        other: {
          "clear-sans": {
            files: {
              "clear-sans-all-100-normal.woff": "",
              "clear-sans-all-100-normal.woff2": "",
              "clear-sans-all-300-normal.woff": "",
              "clear-sans-all-300-normal.woff2": "",
              "clear-sans-all-400-normal.woff": "",
              "clear-sans-all-400-normal.woff2": "",
              "clear-sans-all-400-italic.woff": "",
              "clear-sans-all-400-italic.woff2": "",
              "clear-sans-all-500-normal.woff": "",
              "clear-sans-all-500-normal.woff2": "",
              "clear-sans-all-500-italic.woff": "",
              "clear-sans-all-500-italic.woff2": "",
              "clear-sans-all-700-normal.woff": "",
              "clear-sans-all-700-normal.woff2": "",
              "clear-sans-all-700-italic.woff": "",
              "clear-sans-all-700-italic.woff2": "",
            },
          },
        },
        icons: {
          "material-icons": {
            files: {
              "material-icons-base-400-normal.woff": "",
              "material-icons-base-400-normal.woff2": "",
            },
          },
        },
      },
    });
  });

  test("Clear Sans CSS", () => {
    packager(testFont, true);
    const dirPath = "./fonts/other/clear-sans";
    const fileNames = readDir(dirPath, "css");

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
    const fileList = jsonfile.readFileSync(`${dirPath}/files/file-list.json`);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./scripts/tests/generic/data/clear-sans",
      fileNames
    );

    const expectedFileList = jsonfile.readFileSync(
      "./scripts/tests/generic/data/clear-sans/files/file-list.json"
    );

    expect(cssContent).toEqual(expectedCSSContent);
    expect(fileList).toEqual(expectedFileList);
  });

  test("Material Icons CSS", () => {
    packager(testIcon, true);
    const dirPath = "./fonts/icons/material-icons";
    const fileNames = readDir(dirPath, "css");

    expect(fileNames).toEqual([
      "400.css",
      "base-400.css",
      "base.css",
      "index.css",
    ]);

    const cssContent = readDirContents(dirPath, fileNames);
    const fileList = jsonfile.readFileSync(`${dirPath}/files/file-list.json`);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./scripts/tests/generic/data/material-icons",
      fileNames
    );

    const expectedFileList = jsonfile.readFileSync(
      "./scripts/tests/generic/data/material-icons/files/file-list.json"
    );

    expect(cssContent).toEqual(expectedCSSContent);
    expect(fileList).toEqual(expectedFileList);
  });

  afterEach(() => {
    mock.restore();
  });
});
