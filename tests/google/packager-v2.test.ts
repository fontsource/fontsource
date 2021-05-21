import mock from "mock-fs";
import { readDir, readDirContents } from "../helpers";

import { packagerV2 } from "../../scripts/google/packager-v2";

jest.mock("google-font-metadata");

describe("Generate V2 CSS", () => {
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
    packagerV2("abel");
    const dirPath = "./packages/abel";
    const fileNames = readDir(dirPath);

    expect(fileNames).toEqual(["400.css", "index.css"]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./tests/google/data/abel",
      fileNames
    );
    expect(cssContent).toEqual(expectedCSSContent);
  });

  test("Cabin CSS", () => {
    packagerV2("cabin");
    const dirPath = "./packages/cabin";
    const fileNames = readDir(dirPath);

    expect(fileNames).toEqual([
      "400-italic.css",
      "400.css",
      "500-italic.css",
      "500.css",
      "600-italic.css",
      "600.css",
      "700-italic.css",
      "700.css",
      "index.css",
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
    packagerV2("noto-sans-jp");
    const dirPath = "./packages/noto-sans-jp";
    const fileNames = readDir(dirPath);

    expect(fileNames).toEqual([
      "100.css",
      "300.css",
      "400.css",
      "500.css",
      "700.css",
      "900.css",
      "index.css",
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
