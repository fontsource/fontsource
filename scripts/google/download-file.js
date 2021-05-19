const _ = require("lodash")
const async = require("async")
const flatten = require("flat")
const fs = require("fs-extra")
const isAbsoluteUrl = require("is-absolute-url")
const { APIv1, APIv2, APIVariable } = require("google-font-metadata")
const got = require("got")

const { makeFontDownloadPath } = require("../utils/utils.js")

const gotDownload = async (url, dest) => {
  const options = {
    method: "GET",
  }

  try {
    const response = await got(url, options).buffer()
    fs.writeFileSync(dest, response)
  } catch (error) {
    console.log(error)
  }
}

const pairGenerator = variants => {
  // Parse API and split into variant + link array pairs. [['weight.style.subset.url|local.extension','link to font or local name'],...]
  const flattenedPairs = _.toPairs(flatten(variants))
  // Split ['weight.style.subset.url|local.extension'] into individual array elements
  const splitPairs = flattenedPairs.map(pair => [pair[0].split("."), pair[1]])
  // Only choose pairs that have urls
  const urlPairs = splitPairs.filter(pair => isAbsoluteUrl(pair[1].toString()))
  // Remove ttf and otf
  const cleanedPairs = urlPairs.filter(pair => {
    const extension = pair[0][4]
    if (extension === "truetype" || extension === "opentype") {
      return false
    } else {
      return true
    }
  })

  return cleanedPairs
}

const filterLinks = fontId => {
  const fontV1 = APIv1[fontId]
  const fontV2 = APIv2[fontId]
  const fontDir = `packages/${fontId}`

  // Parses variants into readable pairs of data
  let downloadURLPairsV1 = pairGenerator(fontV1.variants)
  const downloadURLPairsV2 = pairGenerator(fontV2.variants)

  // Flag to check whether font has unicode subsets like [132]
  let hasUnicodeSubsets = false
  const re = /\[.*?\]/g
  downloadURLPairsV2.forEach(pair => {
    if (re.test(pair[0][2])) {
      hasUnicodeSubsets = true
    }
  })

  // If true, we need to download the woff2 files from V1. Else remove all woff2 files
  if (!hasUnicodeSubsets) {
    downloadURLPairsV1 = downloadURLPairsV1.filter(
      pair => !(pair[0][4] === "woff2")
    )
  }

  // V1 { url, dest } pairs
  const linksV2Duplicates = downloadURLPairsV2.map(pair => {
    const types = pair[0]
    let dest
    if (types[4] === "woff2") {
      dest = makeFontDownloadPath(
        fontDir,
        fontId,
        types[2].replace("[", "").replace("]", ""),
        types[0],
        types[1],
        types[4]
      )
    } else if (types[4] === "woff") {
      dest = makeFontDownloadPath(
        fontDir,
        fontId,
        "all",
        types[0],
        types[1],
        types[4]
      )
    }
    const url = pair[1]
    return { url, dest }
  })

  // The "all" subset generates duplicates which need to be removed
  const linksV2 = _.uniqBy(linksV2Duplicates, item => {
    return item.url && item.dest
  })

  // V2 { url, dest } pairs
  const linksV1 = downloadURLPairsV1.map(pair => {
    const types = pair[0]
    const dest = makeFontDownloadPath(
      fontDir,
      fontId,
      types[2],
      types[0],
      types[1],
      types[4]
    )
    const url = pair[1]
    return {
      url,
      dest,
    }
  })

  const links = linksV1.concat(linksV2)
  return links
}

const variableLinks = fontId => {
  const fontVariable = APIVariable[fontId]
  const fontDir = `packages/${fontId}`

  // Generate filenames - variable specific
  const makeFontDownloadPath = (subset, type, style) => {
    return `./${fontDir}/files/${fontId}-${subset}-variable-${type}-${style}.woff2`
  }

  const downloadURLPairsVariable = pairGenerator(fontVariable.variants)

  // Variable { url, dest } pairs
  const links = downloadURLPairsVariable.map(pair => {
    const types = pair[0]
    const dest = makeFontDownloadPath(types[2], types[0], types[1], types[4])
    const url = pair[1]
    return {
      url,
      dest,
    }
  })

  return links
}

const download = (fontId, isVariable) => {
  const fontDir = `packages/${fontId}`

  fs.ensureDirSync(`./${fontDir}/files`)

  const links = filterLinks(fontId)
  // Add variable font URLs to the links array
  if (isVariable) {
    const variable = variableLinks(fontId)
    variable.forEach(link => links.push(link))
  }

  // Download all font files
  async.map(links, d => {
    const { url, dest } = d
    gotDownload(url, dest, err => {
      if (err) {
        console.log("Error downloading", fontId, url, err)
      }
    })
  })
}

module.exports = {
  download,
  gotDownload,
  pairGenerator,
  filterLinks,
  variableLinks,
}
