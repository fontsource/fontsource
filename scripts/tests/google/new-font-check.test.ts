import mock from "mock-fs";

import { findDuplicates, deleteDuplicates } from "../../google/new-font-check";
import { getDirectories } from "../../utils/utils";

describe("New font check", () => {
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
        generic: {
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
    });
  });

  test("Find duplicates", () => {
    expect(
      findDuplicates([
        "abel",
        "noto-sans-jp",
        "cabin",
        "abel",
        "noto-sans-jp",
        "not-cabin",
      ])
    ).toEqual(["abel", "noto-sans-jp"]);
  });

  test("Delete duplicates", () => {
    expect(deleteDuplicates(["abel", "noto-sans-jp"])).toEqual([
      "abel",
      "noto-sans-jp",
    ]);
    expect(getDirectories("google")).toEqual(["abel", "cabin", "noto-sans-jp"]);
    expect(getDirectories("generic")).toEqual(["not-cabin"]);
  });

  afterEach(() => {
    mock.restore();
  });
});
