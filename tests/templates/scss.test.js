jest.mock("google-font-metadata")

const fs = require("fs-extra")
const { APIv2, APIVariable } = require("google-font-metadata")
const { unicodeMapGen, generateSCSS } = require("../../scripts/templates/scss")

test("Unicode map generation", () => {
  const map = unicodeMapGen(APIv2.cabin.unicodeRange)
  expect(map).toEqual(
    "vietnamese: (U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB), latin-ext: (U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF), latin: (U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD)"
  )
})

describe("SCSS Generation", () => {
  test("Abel SCSS - No variable", () => {
    const font = APIv2.abel
    const scss = generateSCSS(font, false, false)
    const expectedScss = fs
      .readFileSync("./tests/google/data/abel/scss/mixins.scss")
      .toString()

    expect(scss).toEqual(expectedScss)
  })

  test("Cabin SCSS - Variable with wdth", () => {
    const font = APIv2.cabin
    const variableMeta = APIVariable.cabin.axes
    const scss = generateSCSS(font, true, variableMeta)
    const expectedScss = fs
      .readFileSync("./tests/google/data/cabin/scss/mixins.scss")
      .toString()

    expect(scss).toEqual(expectedScss)
  })

  test("Changa SCSS - Variable without wdth", () => {
    const font = APIv2.changa
    const variableMeta = APIVariable.changa.axes
    const scss = generateSCSS(font, true, variableMeta)
    const expectedScss = fs
      .readFileSync("./tests/google/data/changa/scss/mixins.scss")
      .toString()

    expect(scss).toEqual(expectedScss)
  })

  test("Noto Sans JP SCSS - Number subsets", () => {
    const font = APIv2["noto-sans-jp"]
    const scss = generateSCSS(font, false, false)
    const expectedScss = fs
      .readFileSync("./tests/google/data/noto-sans-jp/scss/mixins.scss")
      .toString()

    expect(scss).toEqual(expectedScss)
  })
})
