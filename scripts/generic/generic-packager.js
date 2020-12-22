const fs = require("fs-extra")
const jsonfile = require("jsonfile")

const {
  packageJson,
  packageJsonRebuild,
  fontFace,
  readme,
} = require("./templates")

module.exports = function (font, rebuildFlag) {
  const fontDir = font.fontDir

  const fontId = font.fontId
  const fontName = font.fontName
  const subsets = font.subsets
  const weights = font.weights
  const styles = font.styles
  const defSubset = font.defSubset

  // Generate filepaths for fontfiles in CSS
  const makeFontFilePath = (subset, weight, style, extension) => {
    return `./files/${fontId}-${subset}-${weight}-${style}.${extension}`
  }

  // Generate CSS files
  subsets.forEach(subset => {
    const cssSubset = []
    weights.forEach(weight => {
      styles.forEach(style => {
        const cssStyle = []
        const css = fontFace({
          fontId,
          fontName,
          style,
          subset,
          weight,
          woffPath: makeFontFilePath(subset, weight, style, "woff"),
          woff2Path: makeFontFilePath(subset, weight, style, "woff2"),
        })
        cssSubset.push(css)
        cssStyle.push(css)

        const cssFile = cssStyle.join("")

        // If style isn't normal, only specify then.
        if (style === "normal") {
          const cssPath = `${fontDir}/${subset}-${weight}.css`
          fs.writeFileSync(cssPath, cssFile)

          // Write weight only CSS
          if (subset === defSubset) {
            const cssPath = `${fontDir}/${weight}.css`
            fs.writeFileSync(cssPath, cssFile)

            // Write index.css
            if (weight === "400" || weights.length === 1) {
              fs.writeFileSync(`${fontDir}/index.css`, cssStyle.join(""))
            }
          }
        } else {
          const cssStylePath = `${fontDir}/${subset}-${weight}-${style}.css`
          fs.writeFileSync(cssStylePath, cssFile)

          if (subset === defSubset) {
            const cssStylePath = `${fontDir}/${weight}-${style}.css`
            fs.writeFileSync(cssStylePath, cssFile)
          }
        }
      })

      const fileContentSubset = cssSubset.join("")
      // subset.css
      const cssPath = `${fontDir}/${subset}.css`
      fs.writeFileSync(cssPath, fileContentSubset)
    })
    console.log("Created CSS files.")
  })

  // Write README.md
  const packageReadme = readme({
    fontId,
    fontName,
    subsets,
    weights,
    styles,
    source: font.source,
    license: font.license,
    version: font.version,
  })
  fs.writeFileSync(`${fontDir}/README.md`, packageReadme)

  // Write metadata.json
  jsonfile.writeFileSync(`${fontDir}/metadata.json`, {
    fontId,
    fontName,
    subsets,
    weights,
    styles,
    defSubset,
    variable: font.variable,
    lastModified: font.lastModified,
    version: font.version,
    source: font.source,
    license: font.license,
    type: font.type,
  })

  // Write out package.json file
  let packageJSON
  // If the rebuilder is using the function, it needs to pass the existing package version
  if (rebuildFlag) {
    packageJSON = packageJsonRebuild({
      fontId: fontId,
      fontName: fontName,
      version: font.packageVersion,
    })
  } else {
    packageJSON = packageJson({
      fontId,
      fontName,
    })
  }
  fs.writeFileSync(`${fontDir}/package.json`, packageJSON)

  console.log(`Finished processing ${fontId}.`)
}
