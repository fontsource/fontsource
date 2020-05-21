const _ = require(`lodash`)
const fs = require(`fs-extra`)
const glob = require(`glob`)

const { packageJson, fontFace, readme } = require(`./templates`)
const config = require("./config")

const fontId = config.fontId
const fontName = config.fontName
const unicoderange = config.unicoderange

// Create folder structure
const fontFileDir = `scripts/generic/files`
const fontDir = `scripts/generic/${fontId}`
fs.ensureDirSync(fontDir)
fs.ensureDirSync(`${fontDir}/files`)

fs.copy(fontFileDir, `${fontDir}/files`, err => {
  if (err) return console.error(err)
  console.log("Copied files into package.")
})

const makeFontFilePath = (subset, weight, style, extension) => {
  return `./files/${fontId}-${subset}-${weight}-${style}.${extension}`
}

glob(fontFileDir + "/**/*.woff2", {}, (err, files) => {
  let subsets = []
  let weights = []
  let styles = []

  files.forEach(file => {
    // Remove file path and extension
    name = file.slice(22, -6).split("-")
    styles.push(name.slice(-1)[0])
    name.pop()
    weights.push(name.slice(-1)[0])
    name.pop()
    subsets.push(name.slice(-1)[0])
  })
  subsets = [...new Set(subsets)]
  weights = [...new Set(weights)]
  styles = [...new Set(styles)]

  let css = []
  subsets.forEach(subset => {
    let cssSubset = []
    weights.forEach(weight => {
      let cssWeight = []
      styles.forEach(style => {
        let cssStyle = []
        css.push(
          fontFace({
            fontId,
            fontName,
            style,
            subset,
            weight,
            woffPath: makeFontFilePath(subset, weight, style, "woff"),
            woff2Path: makeFontFilePath(subset, weight, style, "woff2"),
            unicoderange,
          })
        )
        cssSubset.push(
          fontFace({
            fontId,
            fontName,
            style,
            subset,
            weight,
            woffPath: makeFontFilePath(subset, weight, style, "woff"),
            woff2Path: makeFontFilePath(subset, weight, style, "woff2"),
            unicoderange,
          })
        )
        cssWeight.push(
          fontFace({
            fontId,
            fontName,
            style,
            subset,
            weight,
            woffPath: makeFontFilePath(subset, weight, style, "woff"),
            woff2Path: makeFontFilePath(subset, weight, style, "woff2"),
            unicoderange,
          })
        )
        cssStyle.push(
          fontFace({
            fontId,
            fontName,
            style,
            subset,
            weight,
            woffPath: makeFontFilePath(subset, weight, style, "woff"),
            woff2Path: makeFontFilePath(subset, weight, style, "woff2"),
            unicoderange,
          })
        )
        const fileContentStyle = cssStyle.join("")
        const cssStylePath = `${fontDir}/${subset}-${weight}-${style}.css`
        fs.writeFileSync(cssStylePath, fileContentStyle)
      })
      const fileContentWeight = cssWeight.join("")
      const cssWeightPath = `${fontDir}/${subset}-${weight}.css`
      fs.writeFileSync(cssWeightPath, fileContentWeight)
    })

    const fileContentDefault = css.join("")
    // subset.css
    const cssPath = `${fontDir}/${subset}.css`
    fs.writeFileSync(cssPath, fileContentDefault)

    // index.css
    if (subset === "latin" || subsets.length === 1) {
      fs.writeFileSync(`${fontDir}/index.css`, fileContentDefault)
    }
  })
  console.log("Created CSS files.")
})

const packageReadme = readme({
  fontId,
  fontName,
})
fs.writeFileSync(`${fontDir}/README.md`, packageReadme)

// Write out package.json file
const packageJSON = packageJson({
  fontId,
  fontName,
})
fs.writeFileSync(`${fontDir}/package.json`, packageJSON)
