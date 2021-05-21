import {
  findClosest,
  makeFontDownloadPath,
  makeFontFilePath,
  makeVariableFontDownloadPath,
  makeVariableFontFilePath,
} from "../../scripts/utils/utils";

const fontDir = "packages/noto-sans-jp";
const fontId = "noto-sans-jp";
const subset = "latin";
const weight = "400";
const style = "normal";
const extension = "woff2";

const type = "full";

describe("Font paths", () => {
  test("Generate download paths", () => {
    expect(
      makeFontDownloadPath(fontDir, fontId, subset, weight, style, extension)
    ).toBe("./packages/noto-sans-jp/files/noto-sans-jp-latin-400-normal.woff2");

    expect(
      makeVariableFontDownloadPath(fontDir, fontId, subset, type, style)
    ).toBe(
      "./packages/noto-sans-jp/files/noto-sans-jp-latin-variable-full-normal.woff2"
    );
  });

  test("Generate CSS paths", () => {
    expect(makeFontFilePath(fontId, subset, weight, style, extension)).toBe(
      "./files/noto-sans-jp-latin-400-normal.woff2"
    );

    expect(makeVariableFontFilePath(fontId, subset, type, style)).toBe(
      "./files/noto-sans-jp-latin-variable-full-normal.woff2"
    );
  });
});

describe("Find closest available weights", () => {
  test("400 is available", () => {
    expect(findClosest([300, 400, 500], 400)).toBe(400);
  });

  test("400 is not available", () => {
    // Rounds down by default
    expect(findClosest([200, 300, 500, 600], 400)).toBe(300);
    expect(findClosest([200], 400)).toBe(200);
    expect(findClosest([200, 500], 400)).toBe(500);
  });
});
