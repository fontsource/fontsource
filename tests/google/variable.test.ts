import mock from "mock-fs";
import { readDir, readDirContents } from "../helpers";
import { variable } from "../../scripts/google/variable";

jest.mock("google-font-metadata");

describe("Generate Variable CSS", () => {
  beforeEach(() => {
    mock({
      packages: {
        cabin: {
          /* Empty directory */
        },
        changa: {
          /* Empty directory */
        },
        recursive: {
          /* Empty directory */
        },
      },
    });
  });

  test("Cabin CSS - wghtOnly, full, wdth and italic", () => {
    variable("cabin");
    const dirPath = "./packages/cabin";
    const fileNames = readDir(dirPath);

    expect(fileNames).toEqual([
      "variable-full-italic.css",
      "variable-full.css",
      "variable-italic.css",
      "variable.css",
    ]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./tests/google/data/cabin",
      fileNames
    );
    expect(cssContent).toEqual(expectedCSSContent);
  });

  test("Changa CSS - wghtOnly", () => {
    variable("changa");
    const dirPath = "./packages/changa";
    const fileNames = readDir(dirPath);

    expect(fileNames).toEqual(["variable.css"]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./tests/google/data/changa",
      fileNames
    );

    expect(cssContent).toEqual(expectedCSSContent);
  });

  test("Recursive CSS - wghtOnly, full", () => {
    variable("recursive");
    const dirPath = "./packages/recursive";
    const fileNames = readDir(dirPath);
    expect(fileNames).toEqual(["variable-full.css", "variable.css"]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./tests/google/data/recursive",
      fileNames
    );

    expect(cssContent).toEqual(expectedCSSContent);
  });

  afterEach(() => {
    mock.restore();
  });
});
