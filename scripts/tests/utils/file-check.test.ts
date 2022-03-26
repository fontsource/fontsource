/* eslint-disable unicorn/prefer-module */
import mock from "mock-fs";
import path from "node:path";
import testData from "../google/data/find-diff.json";

import { downloadFileCheck, findChangedPackages } from "../../utils/file-check";

describe("Download font check", () => {
  beforeEach(() => {
    mock({
      fonts: {
        google: {
          abel: {
            "package.json": "{}",
          },
          cabin: {
            "package.json": "{}",
          },
          "noto-sans-jp": {
            "package.json": "{}",
          },
        },
        other: {
          abel: {
            "package.json": "{}",
          },
          "not-cabin": {
            "package.json": "{}",
          },
          "noto-sans-jp": {
            "package.json": "{}",
          },
        },
      },
      "mass-publish.json": mock.load(
        path.resolve(process.cwd(), "mass-publish.json"),
        { lazy: false }
      ),
    });
  });

  test("Find changed packages", () => {
    mock.restore();
    return expect(
      findChangedPackages(
        "972ff87da50b276d4e42d3e4a3f5289fab65e28f",
        "fb5520d3bb12a8c1eeb0dc3ec02a3022e7313f36"
      )
    ).resolves.toEqual(testData);
  });

  test("Check for download files", async () => {
    return expect(
      downloadFileCheck(
        await findChangedPackages(
          "972ff87da50b276d4e42d3e4a3f5289fab65e28f",
          "fb5520d3bb12a8c1eeb0dc3ec02a3022e7313f36"
        )
      )
    ).not.toThrow();
  });

  afterEach(() => {
    mock.restore();
  });
});
