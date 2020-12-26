const _ = require("lodash")
const async = require("async")
const flatten = require("flat")
const fs = require("fs-extra")
const isAbsoluteUrl = require("is-absolute-url")
const { APIv2 } = require("google-font-metadata")

const download = require("./download-file")
const { fontFace } = require("../templates/css")
const {
  makeFontDownloadPath,
  makeFontFilePath,
  findClosest,
} = require("../utils/utils")

module.exports = function (id) {
  const font = APIv2[id]
  const fontDir = `packages/${font.id}`

  // Parse API and split into variant + link array pairs. [['weight.style.subset.url|local.extension','link to font or local name'],...]
  const downloadURLPairs = _.toPairs(flatten(font.variants))

  // Filter out local font links and only leave URLs for each pair
  const links = downloadURLPairs
    .filter(pair => isAbsoluteUrl(pair[1].toString()))
    .filter(file => file[0].split(".")[4] === "woff2")
    .map(file => {
      const types = file[0].split(".")
      const dest = makeFontDownloadPath(
        fontDir,
        font.id,
        types[2].replace("[", "").replace("]", ""),
        types[0],
        types[1],
        types[4]
      )
      const url = file[1]
      return {
        url,
        dest,
      }
    })

  // Get woff all subset variant
  let oldLinks = downloadURLPairs
    .filter(pair => isAbsoluteUrl(pair[1].toString()))
    .filter(file => {
      const extension = file[0].split(".")[4]
      if (extension === "woff") {
        return true
      }
      return false
    })
    .map(file => {
      const types = file[0].split(".")
      const dest = makeFontDownloadPath(
        fontDir,
        font.id,
        "all",
        types[0],
        types[1],
        types[4]
      )
      const url = file[1]
      return {
        url,
        dest,
      }
    })

  // Remove all duplicate values for each "subset" to reduce unneccesary downloads
  oldLinks = _.uniqBy(oldLinks, item => {
    return item.url && item.dest
  })
  _.forEach(oldLinks, item => {
    links.push(item)
  })

  // Download all font files
  async.map(links, (d, downloadDone) => {
    const { url, dest } = d
    download(url, dest, err => {
      if (err) {
        console.log("Error downloading", font.id, url, err)
      }
      downloadDone()
    })
  })

  // Find the weight for index.css in the case weight 400 does not exist.
  const indexWeight = findClosest(font.weights, 400)

  // Generate CSS
  const unicodeKeys = Object.keys(font.unicodeRange)

  font.weights.forEach(weight => {
    font.styles.forEach(style => {
      const cssStyle = []
      unicodeKeys.forEach(subset => {
        // Some fonts may have variants 400, 400i, 700 but not 700i.
        if (style in font.variants[weight]) {
          const css = fontFace({
            fontId: font.id,
            fontName: font.family,
            style,
            subset,
            weight,
            locals: [],
            woff2Path: makeFontFilePath(
              font.id,
              subset.replace("[", "").replace("]", ""),
              weight,
              style,
              "woff2"
            ),
            woffPath: makeFontFilePath(font.id, "all", weight, style, "woff"),
            unicodeRange: font.unicodeRange[subset],
          })
          cssStyle.push(css)
        }
      })
      // Write down CSS
      if (style in font.variants[weight]) {
        if (style === "normal") {
          const cssPath = `${fontDir}/${weight}.css`
          fs.writeFileSync(cssPath, cssStyle.join(""))

          // Generate index CSS
          if (weight === indexWeight) {
            fs.writeFileSync(`${fontDir}/index.css`, cssStyle.join(""))
          }
        } else {
          // If italic or else, define specific style CSS file
          const cssStylePath = `${fontDir}/${weight}-${style}.css`
          fs.writeFileSync(cssStylePath, cssStyle.join(""))
        }
      }
    })
  })
}
