/* eslint-disable @typescript-eslint/no-unused-vars */
import testData from "./data/download-file-data.json";

import {
  download,
  filterLinks,
  variableLinks,
  pairGenerator,
  gotDownload,
} from "../../scripts/google/download-file";

jest.mock("google-font-metadata");

describe("Pair generator", () => {
  afterEach(() => jest.resetAllMocks());

  // Has TTF
  const { APIv1Variant } = testData;
  // OpenType
  const { APIv2Variant } = testData;
  // Variable fonts
  const { APIVariableVariant } = testData;

  test("APIv1 and strip TTF links", () => {
    const { APIv1Result } = testData;
    expect(pairGenerator(APIv1Variant)).toEqual(APIv1Result);
  });

  test("APIv2 and strip OTF links", () => {
    const { APIv2Result } = testData;
    expect(pairGenerator(APIv2Variant)).toEqual(APIv2Result);
  });

  test("APIVariable", () => {
    const { APIVariableResult } = testData;
    expect(pairGenerator(APIVariableVariant)).toEqual(APIVariableResult);
  });
});

describe("Filter links", () => {
  test("Normal filterLinks function", () => {
    const abelResult = testData.filter.abel;
    expect(filterLinks("abel")).toEqual(abelResult);

    const notoSansJPResult = testData.filter["noto-sans-jp"];
    expect(filterLinks("noto-sans-jp")).toEqual(notoSansJPResult);
  });

  test("Variable filterLinks function", () => {
    const cabinResult = testData.variableFilter.cabin;
    expect(variableLinks("cabin")).toEqual(cabinResult);
  });
});

// TODO - test { download, gotDownload }
