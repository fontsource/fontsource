const fs = require("fs-extra")
const jsonfile = require("jsonfile")
const glob = require("glob")

const { makeFontFilePath, findClosest } = require("../utils/utils")
const { fontFace } = require("../templates/css")
const { scssGeneric } = require("../templates/scss")
const { packageJson } = require("../templates/package")
const { readme } = require("../templates/readme")
const { materialIcons } = require("../templates/icons")

module.exports = function (font, rebuildFlag) {
  const {
    fontDir,
    fontId,
    fontName,
    subsets,
    weights,
    styles,
    defSubset,
    type,
  } = font

  // Find the weight for index.css in the case weight 400 does not exist.
  const indexWeight = findClosest(font.weights, 400)

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
          locals: [],
          woffPath: makeFontFilePath(fontId, subset, weight, style, "woff"),
          woff2Path: makeFontFilePath(fontId, subset, weight, style, "woff2"),
          unicodeRange: false,
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
            if (weight === indexWeight) {
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

  // Write SCSS file
  fs.ensureDirSync(`./${fontDir}/scss`)

  const scss = scssGeneric({
    fontId,
    fontName,
    defSubset,
  })

  fs.writeFileSync(`${fontDir}/scss/mixins.scss`, scss)

  // Material Icons #152
  if (type === "icons") {
    const icons = materialIcons({
      fontId,
      fontName,
    })
    glob(`${fontDir}/**/*.{css,scss}`, (er, files) =>
      files.forEach(file => {
        fs.appendFileSync(file, icons)
      })
    )
  }

  // Write README.md
  const packageReadme = readme({
    fontId,
    fontName,
    subsets,
    weights,
    styles,
    variable: false,
    source: font.source,
    license: font.license,
    version: font.version,
    type,
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
    category: font.category,
    source: font.source,
    license: font.license,
    type,
  })

  // Write out package.json file
  let packageJSON
  // If the rebuilder is using the function, it needs to pass the existing package version
  if (rebuildFlag) {
    packageJSON = packageJson({
      fontId: fontId,
      fontName: fontName,
      version: font.packageVersion,
    })
  } else {
    const mainRepoPackageJson = jsonfile.readFileSync("./package.json")
    packageJSON = packageJson({
      fontId,
      fontName,
      version: mainRepoPackageJson.version,
    })
  }
  fs.writeFileSync(`${fontDir}/package.json`, packageJSON)

  console.log(`Finished processing ${fontId}.`)
}
