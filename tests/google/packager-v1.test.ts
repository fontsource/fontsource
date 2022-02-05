import mock from "mock-fs";

import { readDir, readDirContents } from "../helpers";
import { packagerV1 } from "../../scripts/google/packager-v1";

jest.mock("google-font-metadata");

describe("Generate V1 CSS", () => {
  beforeEach(() => {
    mock({
      packages: {
        abel: {
          /* Empty directory */
        },
        cabin: {
          /* Empty directory */
        },
        "noto-sans-jp": {
          /* Empty directory */
        },
      },
    });
  });

  test("Abel CSS", () => {
    packagerV1("abel");
    const dirPath = "./packages/abel";
    const fileNames = readDir(dirPath, "css");

    expect(fileNames).toEqual(["latin-400.css", "latin.css"]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./tests/google/data/abel",
      fileNames
    );
    expect(cssContent).toEqual(expectedCSSContent);
  });

  test("Cabin CSS", () => {
    packagerV1("cabin");
    const dirPath = "./packages/cabin";
    const fileNames = readDir(dirPath, "css");

    expect(fileNames).toEqual([
      "latin-400-italic.css",
      "latin-400.css",
      "latin-500-italic.css",
      "latin-500.css",
      "latin-600-italic.css",
      "latin-600.css",
      "latin-700-italic.css",
      "latin-700.css",
      "latin-ext-400-italic.css",
      "latin-ext-400.css",
      "latin-ext-500-italic.css",
      "latin-ext-500.css",
      "latin-ext-600-italic.css",
      "latin-ext-600.css",
      "latin-ext-700-italic.css",
      "latin-ext-700.css",
      "latin-ext.css",
      "latin.css",
      "vietnamese-400-italic.css",
      "vietnamese-400.css",
      "vietnamese-500-italic.css",
      "vietnamese-500.css",
      "vietnamese-600-italic.css",
      "vietnamese-600.css",
      "vietnamese-700-italic.css",
      "vietnamese-700.css",
      "vietnamese.css",
    ]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./tests/google/data/cabin",
      fileNames
    );
    expect(cssContent).toEqual(expectedCSSContent);
  });

  test("Noto Sans JP CSS", () => {
    packagerV1("noto-sans-jp");
    const dirPath = "./packages/noto-sans-jp";
    const fileNames = readDir(dirPath, "css");

    expect(fileNames).toEqual([
      "japanese-100.css",
      "japanese-300.css",
      "japanese-400.css",
      "japanese-500.css",
      "japanese-700.css",
      "japanese-900.css",
      "japanese.css",
      "latin-100.css",
      "latin-300.css",
      "latin-400.css",
      "latin-500.css",
      "latin-700.css",
      "latin-900.css",
      "latin.css",
    ]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./tests/google/data/noto-sans-jp",
      fileNames
    );
    expect(cssContent).toEqual(expectedCSSContent);
  });

  afterEach(() => {
    mock.restore();
  });
});
