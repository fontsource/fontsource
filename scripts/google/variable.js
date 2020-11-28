const _ = require("lodash")
const flatten = require("flat")
const { APIv2, APIVariable } = require("google-font-metadata")

const download = require("./download-file")

const run = id => {
  const font = APIv2[id]
  const fontVariable = APIVariable[id]
  const fontDir = `packages/${font.id}`

  // Generate filenames
  const makeFontDownloadPath = (subset, style, extension) => {
    return `./${fontDir}/files/${font.id}-${subset}-variable-${style}.${extension}`
  }

  const downloadURLPairs = _.toPairs(flatten(fontVariable.variants))
  console.log(downloadURLPairs)
}

run("cabin")
