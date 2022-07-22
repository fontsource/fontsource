import mock from "mock-fs";
import { readDir, readDirContents } from "../helpers";
import { variable } from "../../google/variable";

jest.mock("google-font-metadata");

describe("Generate Variable CSS", () => {
  beforeEach(() => {
    mock({
      fonts: {
        google: {
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
      },
    });
  });

  test("Cabin CSS - wghtOnly, full, wdth and italic", () => {
    variable("cabin");
    const dirPath = "./fonts/google/cabin";
    const fileNames = readDir(dirPath, "css");

    expect(fileNames).toEqual([
      "variable-full-italic.css",
      "variable-full.css",
      "variable-italic.css",
      "variable.css",
    ]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./scripts/tests/google/data/cabin",
      fileNames
    );
    expect(cssContent).toEqual(expectedCSSContent);
  });

  test("Changa CSS - wghtOnly", () => {
    variable("changa");
    const dirPath = "./fonts/google/changa";
    const fileNames = readDir(dirPath, "css");

    expect(fileNames).toEqual(["variable-full.css", "variable.css"]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./scripts/tests/google/data/changa",
      fileNames
    );

    expect(cssContent).toEqual(expectedCSSContent);
  });

  test("Recursive CSS - wghtOnly, full", () => {
    variable("recursive");
    const dirPath = "./fonts/google/recursive";
    const fileNames = readDir(dirPath, "css");
    expect(fileNames).toEqual(["variable-full.css", "variable.css"]);

    const cssContent = readDirContents(dirPath, fileNames);
    mock.restore();
    const expectedCSSContent = readDirContents(
      "./scripts/tests/google/data/recursive",
      fileNames
    );

    expect(cssContent).toEqual(expectedCSSContent);
  });

  afterEach(() => {
    mock.restore();
  });
});
