/* eslint-disable unicorn/prefer-module */
import mock from "mock-fs";
import path from "node:path";

import { downloadFileCheck, findChangedPackages } from "../../utils/file-check";

describe("File check", () => {
  test("Find changed packages", () => {
    mock({
      fonts: {
        icons: {
          // Changed packages checks for a package json
          "noto-color-emoji": {
            "package.json": "{}",
          },
          "noto-emoji": {
            "package.json": "{}",
          },
        },
      },
      "mass-publish.json": mock.load(
        path.resolve(process.cwd(), "mass-publish.json"),
        { lazy: false }
      ),
    });

    return expect(
      findChangedPackages(
        "e87132f950524299fd89d2254e74e08743f5f0ae",
        "10a65fce06bdf6651cd8a133dc52a978b6cd5055"
      )
    ).resolves.toEqual([
      "fonts/icons/noto-color-emoji",
      "fonts/icons/noto-emoji",
    ]);
  });

  test("Check for files directory", () => {
    mock({
      fonts: {
        icons: {
          "noto-emoji": {
            "package.json": "{}",
          },
        },
      },
    });

    return expect(() => downloadFileCheck(["fonts/icons/noto-emoji"])).toThrow(
      "fonts/icons/noto-emoji/files does not exist"
    );
  });

  test("Check for file list", () => {
    mock({
      fonts: {
        icons: {
          "noto-emoji": {
            files: {
              /* Empty directory */
            },
            "package.json": "{}",
          },
        },
      },
    });

    return expect(() => downloadFileCheck(["fonts/icons/noto-emoji"])).toThrow(
      "fonts/icons/noto-emoji/files/file-list.json: ENOENT"
    );
  });

  test("Check if first font file does not exist", () => {
    mock({
      fonts: {
        icons: {
          "noto-emoji": {
            files: {
              "file-list.json": mock.load(
                path.resolve(__dirname, "data/file-list-noto.json")
              ),
            },
            "package.json": "{}",
          },
        },
      },
    });

    return expect(() => downloadFileCheck(["fonts/icons/noto-emoji"])).toThrow(
      "./fonts/icons/noto-emoji/files/noto-emoji-all-400-normal.woff does not exist"
    );
  });

  test("Check if second font file does not exist", () => {
    mock({
      fonts: {
        icons: {
          "noto-emoji": {
            files: {
              "file-list.json": mock.load(
                path.resolve(__dirname, "data/file-list-noto.json")
              ),
              "noto-emoji-all-400-normal.woff": "{}",
            },
            "package.json": "{}",
          },
        },
      },
    });

    return expect(() => downloadFileCheck(["fonts/icons/noto-emoji"])).toThrow(
      "./fonts/icons/noto-emoji/files/noto-emoji-all-400-normal.woff2 does not exist"
    );
  });

  test("Success for download file check", () => {
    mock({
      fonts: {
        icons: {
          "noto-emoji": {
            files: {
              "file-list.json": mock.load(
                path.resolve(__dirname, "data/file-list-noto.json")
              ),
              "noto-emoji-all-400-normal.woff": "{}",
              "noto-emoji-all-400-normal.woff2": "{}",
            },
            "package.json": "{}",
          },
        },
      },
    });

    return expect(() =>
      downloadFileCheck(["fonts/icons/noto-emoji"])
    ).not.toThrow();
  });

  afterEach(() => {
    mock.restore();
  });
});
