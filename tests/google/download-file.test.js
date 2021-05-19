jest.mock("google-font-metadata")

const testData = require("./data/download-file-data.json")

const {
  download,
  filterLinks,
  variableLinks,
  pairGenerator,
  gotDownload,
} = require("../../scripts/google/download-file")

describe("Pair generator", () => {
  afterEach(() => jest.resetAllMocks())

  // Has TTF
  const APIv1Variant = testData.APIv1Variant
  // OpenType
  const APIv2Variant = testData.APIv2Variant
  // Variable fonts
  const APIVariableVariant = testData.APIVariableVariant

  test("APIv1 and strip TTF links", () => {
    const APIv1Result = testData.APIv1Result
    expect(pairGenerator(APIv1Variant)).toEqual(APIv1Result)
  })

  test("APIv2 and strip OTF links", () => {
    const APIv2Result = testData.APIv2Result
    expect(pairGenerator(APIv2Variant)).toEqual(APIv2Result)
  })

  test("APIVariable", () => {
    const APIVariableResult = testData.APIVariableResult
    expect(pairGenerator(APIVariableVariant)).toEqual(APIVariableResult)
  })
})

describe("Filter links", () => {
  test("Normal filterLinks function", () => {
    const abelResult = testData.filter.abel
    expect(filterLinks("abel")).toEqual(abelResult)

    const notoSansJPResult = testData.filter["noto-sans-jp"]
    expect(filterLinks("noto-sans-jp")).toEqual(notoSansJPResult)
  })

  test("Variable filterLinks function", () => {
    const cabinResult = testData.variableFilter.cabin
    expect(variableLinks("cabin")).toEqual(cabinResult)
  })
})

// TODO - test { download, gotDownload }
