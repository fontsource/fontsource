const fs = require("fs-extra")
const { APIv2, APIVariable } = require("google-font-metadata")

const { fontFaceVariable, fontFaceVariableWdth } = require("../templates/css")

module.exports = function (id) {
  const font = APIv2[id]
  const fontVariable = APIVariable[id]
  const fontDir = `packages/${font.id}`

  const makeFontFilePath = (subset, type, style) => {
    return `./files/${font.id}-${subset}-variable-${type}-${style}.woff2`
  }

  // Generate CSS
  const variableName = `${font.family}Variables`

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
