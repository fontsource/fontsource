import mock from "mock-fs";

import { findDuplicates, deleteDuplicates } from "../../google/new-font-check";
import { getDirectories } from "../../utils/utils";

describe("New font check", () => {
  beforeEach(() => {
    mock({
      fonts: {
        google: {
          abel: {
            "package.json": '{"version": "1.0.0"}',
          },
          cabin: {
            "package.json": '{"version": "1.0.0"}',
          },
          "noto-sans-jp": {
            "package.json": '{"version": "1.0.0"}',
          },
        },
        other: {
          abel: {
            "package.json": '{"version": "1.0.0"}',
          },
          "not-cabin": {
            "package.json": '{"version": "1.0.0"}',
          },
          "noto-sans-jp": {
            "package.json": '{"version": "1.0.0"}',
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
    expect(getDirectories("other")).toEqual(["not-cabin"]);
  });

  afterEach(() => {
    mock.restore();
  });
});
