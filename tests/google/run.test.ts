/* eslint-disable promise/always-return */
import mock from "mock-fs";
import { readDir, readDirContents } from "../helpers";

import { run } from "../../scripts/google/run";

describe("Generate V2 CSS", () => {
  beforeEach(() => {
    mock({
      packages: {
        abel: {
          "package.json": "{version: 4.0.0}",
          "CHANGELOG.md": "",
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

  test("Abel", () => {
    return run("abel").then(() => {
      const dirPath = "./packages/abel";
      const fileNames = readDir(dirPath, "json");

      expect(fileNames).toEqual(["metadata.json", "unicode.json"]);

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
