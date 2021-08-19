/* eslint-disable promise/always-return */
import mock from "mock-fs";
import { readDir, readDirContents } from "../helpers";

import { run } from "../../scripts/google/run";

describe("Full run function", () => {
  beforeEach(() => {
    mock({
      packages: {
        abel: {
          "package.json": "{}",
        },
        "noto-sans-jp": {
          "package.json": "{}",
        },
      },
    });
  });

  test("Abel metadata and unicode generation", () => {
    return run("abel").then(() => {
      const dirPath = "./packages/abel";
      const fileNames = readDir(dirPath, "json");

      expect(fileNames).toEqual([
        "metadata.json",
        "package.json",
        "unicode.json",
      ]);

      // Remove package.json from array
      fileNames.splice(1, 1);

      const jsonContent = readDirContents(dirPath, fileNames);
      mock.restore();
      const expectedJsonContent = readDirContents(
        "./tests/google/data/abel",
        fileNames
      );
      expect(jsonContent).toEqual(expectedJsonContent);
    });
  });

  afterEach(() => {
    mock.restore();
  });
});
