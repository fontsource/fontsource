const _ = require(`lodash`)
const async = require(`async`)
const flatten = require(`flat`)
const fs = require(`fs-extra`)
const isAbsoluteUrl = require(`is-absolute-url`)
const apiFont = require(`google-font-metadata`)

const download = require(`./download-file`)
const { fontFaceUnicode } = require(`./templates`)

module.exports = function (id) {
  const font = apiFont[id]
  const fontDir = `packages/${font.id}`

  // Generate filenames
  const makeFontDownloadPath = (subset, weight, style, extension) => {
    return `./${fontDir}/files/${font.id}-${subset}-${weight}-${style}.${extension}`
  }

  const makeFontFilePath = (subset, weight, style, extension) => {
    return `./files/${font.id}-${subset}-${weight}-${style}.${extension}`
  }

  // Parse API and split into variant + link array pairs. [['weight.style.subset.url|local.extension','link to font or local name'],...]
  const downloadURLPairs = _.toPairs(flatten(font.variants))

  // Filter out local font links and only leave URLs for each pair
  const links = downloadURLPairs
    .filter(pair => isAbsoluteUrl(pair[1].toString()))
    .filter(file => file[0].split(".")[4] === "woff2")
    .map(file => {
      const types = file[0].split(".")
      const dest = makeFontDownloadPath(
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

  // Get woff and ttf/otf all subset variant
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
      const dest = makeFontDownloadPath("all", types[0], types[1], types[4])
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

  // Generate CSS
  const unicodeKeys = Object.keys(font.unicodeRange)

  font.weights.forEach(weight => {
    const cssWeight = []
    font.styles.forEach(style => {
      const cssStyle = []
      unicodeKeys.forEach(subset => {
        // Some fonts may have variants 400, 400i, 700 but not 700i.
        if (style in font.variants[weight]) {
          const css = fontFaceUnicode({
            fontId: font.id,
            fontName: font.family,
            locals: font.variants[weight][style][subset].local,
            style,
            subset,
            weight,
            woff2Path: makeFontFilePath(
              subset.replace("[", "").replace("]", ""),
              weight,
              style,
              "woff2"
            ),
            woffPath: makeFontFilePath("all", weight, style, "woff"),
            unicodeRange: font.unicodeRange[subset],
          })
          cssStyle.push(css)
          cssWeight.push(css)
        }
      })
      if (style in font.variants[weight]) {
        const cssStylePath = `${fontDir}/${weight}-${style}.css`
        fs.writeFileSync(cssStylePath, cssStyle.join(""))
      }
    })
    const cssWeightPath = `${fontDir}/${weight}.css`
    fs.writeFileSync(cssWeightPath, cssWeight.join(""))
    if (weight === "400") {
      fs.writeFileSync(`${fontDir}/index.css`, cssWeight.join(""))
    }
  })
}
