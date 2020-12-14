const _ = require("lodash")
const async = require("async")
const flatten = require("flat")
const fs = require("fs-extra")
const isAbsoluteUrl = require("is-absolute-url")
const { APIv2, APIVariable } = require("google-font-metadata")

const download = require("./download-file")
const { fontFaceVariable, fontFaceVariableWdth } = require("./templates")

module.exports = function (id) {
  const font = APIv2[id]
  const fontVariable = APIVariable[id]
  const fontDir = `packages/${font.id}`

  // Generate filenames
  const makeFontDownloadPath = (subset, type, style) => {
    return `./${fontDir}/files/${font.id}-${subset}-variable-${type}-${style}.woff2`
  }

  const makeFontFilePath = (subset, type, style) => {
    return `./files/${font.id}-${subset}-variable-${type}-${style}.woff2`
  }

  // Parse API and split into variant + link array pairs. [['weight.style.subset.url.extension', 'link to font or local name'],...]
  const downloadURLPairs = _.toPairs(flatten(fontVariable.variants))

  // Filter out local font links and only leave URLs for each pair
  const links = downloadURLPairs
    .filter(pair => isAbsoluteUrl(pair[1].toString()))
    .map(file => {
      const types = file[0].split(".")
      const dest = makeFontDownloadPath(types[2], types[0], types[1], types[4])
      const url = file[1]
      return {
        url,
        dest,
      }
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
  const variableName = `${font.family}Variable`

  // wghtOnly CSS Generation
  font.styles.forEach(style => {
    const cssStyle = []
    font.subsets.forEach(subset => {
      const type = "wghtOnly"
      const cssWght = fontFaceVariable({
        fontId: font.id,
        fontName: variableName,
        style,
        subset,
        type,
        weight: `${fontVariable.axes.wght.min} ${fontVariable.axes.wght.max}`,
        woff2Path: makeFontFilePath(subset, type, style),
        unicodeRange: font.unicodeRange[subset],
      })
      cssStyle.push(cssWght)
    })

    // Write down CSS
    if (style === "normal") {
      const cssPath = `${fontDir}/variable.css`
      fs.writeFileSync(cssPath, cssStyle.join(""))
    } else {
      // If italic or else, define specific style CSS file
      const cssStylePath = `${fontDir}/variable-${style}.css`
      fs.writeFileSync(cssStylePath, cssStyle.join(""))
    }
  })

  // full CSS Generation
  if ("full" in fontVariable.variants) {
    // Wdth requires a different CSS template (font-stretch)
    if ("wdth" in fontVariable.axes) {
      font.styles.forEach(style => {
        // Preserve the 'normal' style as a flag
        const origStyle = style
        if ("slnt" in fontVariable.axes && style === "normal") {
          // SLNT has a different style linked to it.
          style = `oblique ${fontVariable.axes.slnt.max * -1}deg ${
            fontVariable.axes.slnt.min * -1
          }deg`
        }
        const cssStyle = []
        font.subsets.forEach(subset => {
          const type = "full"
          const cssWght = fontFaceVariableWdth({
            fontId: font.id,
            fontName: variableName,
            style,
            subset,
            type,
            wdth: `${fontVariable.axes.wdth.min}% ${fontVariable.axes.wdth.max}%`,
            weight: `${fontVariable.axes.wght.min} ${fontVariable.axes.wght.max}`,
            woff2Path: makeFontFilePath(subset, type, origStyle),
            unicodeRange: font.unicodeRange[subset],
          })
          cssStyle.push(cssWght)
        })

        // Write down CSS
        if (origStyle === "normal") {
          const cssPath = `${fontDir}/variable-full.css`
          fs.writeFileSync(cssPath, cssStyle.join(""))
        } else {
          // If italic or else, define specific style CSS file
          const cssStylePath = `${fontDir}/variable-full-${origStyle}.css`
          fs.writeFileSync(cssStylePath, cssStyle.join(""))
        }
      })
    } else {
      font.styles.forEach(style => {
        const origStyle = style
        if ("slnt" in fontVariable.axes && style === "normal") {
          // SLNT has a different style linked to it.
          style = `oblique ${fontVariable.axes.slnt.max * -1}deg ${
            fontVariable.axes.slnt.min * -1
          }deg`
        }
        const cssStyle = []
        font.subsets.forEach(subset => {
          const type = "full"
          const cssWght = fontFaceVariable({
            fontId: font.id,
            fontName: variableName,
            style,
            subset,
            type,
            weight: `${fontVariable.axes.wght.min} ${fontVariable.axes.wght.max}`,
            woff2Path: makeFontFilePath(subset, type, origStyle),
            unicodeRange: font.unicodeRange[subset],
          })
          cssStyle.push(cssWght)
        })

        // Write down CSS
        if (origStyle === "normal") {
          const cssPath = `${fontDir}/variable-full.css`
          fs.writeFileSync(cssPath, cssStyle.join(""))
        } else {
          // If italic or else, define specific style CSS file
          const cssStylePath = `${fontDir}/variable-full-${origStyle}.css`
          fs.writeFileSync(cssStylePath, cssStyle.join(""))
        }
      })
    }
  }
}
