const fs = require(`fs-extra`)
const glob = require(`glob`)
const jsonfile = require(`jsonfile`)

const { packageJson, fontFace, readme } = require(`./templates`)
const config = require("./config")

const fontId = config.fontId
const fontName = config.fontName
const defSubset = config.defaultSubset

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
    name = file.slice(23 + Object.keys(config.fontId).length, -6).split("-")
    styles.push(name.slice(-1)[0])
    name.pop()
    weights.push(name.slice(-1)[0])
    name.pop()
    subsets.push(name.join("-"))
  })
  subsets = [...new Set(subsets)]
  weights = [...new Set(weights)]
  styles = [...new Set(styles)]

  subsets.forEach(subset => {
    let cssSubset = []
    weights.forEach(weight => {
      let cssWeight = []
      styles.forEach(style => {
        let cssStyle = []
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
        cssWeight.push(css)
        cssStyle.push(css)
        const fileContentStyle = cssStyle.join("")
        const cssStylePath = `${fontDir}/${subset}-${weight}-${style}.css`
        fs.writeFileSync(cssStylePath, fileContentStyle)
      })
      const fileContentWeight = cssWeight.join("")
      const cssWeightPath = `${fontDir}/${subset}-${weight}.css`
      fs.writeFileSync(cssWeightPath, fileContentWeight)

      // index.css
      if (subset === defSubset && weight == "400") {
        fs.writeFileSync(`${fontDir}/index.css`, fileContentWeight)
      }
    })

    const fileContentSubset = cssSubset.join("")
    // subset.css
    const cssPath = `${fontDir}/${subset}.css`
    fs.writeFileSync(cssPath, fileContentSubset)
  })
  console.log("Created CSS files.")

  const packageReadme = readme({
    fontId,
    fontName,
    subsets,
    weights,
    styles,
    source: config.sourcelink,
    license: config.licenselink,
    version: config.version,
  })
  fs.writeFileSync(`${fontDir}/README.md`, packageReadme)

  // Write metadata.json
  const datetime = new Date()
  jsonfile.writeFileSync(`${fontDir}/metadata.json`, {
    fontId,
    fontName,
    subsets,
    weights,
    styles,
    defSubset,
    lastModified: datetime.toISOString().slice(0, 10),
    version: config.version,
    source: config.sourcelink,
    license: config.licenselink,
    type: config.type,
  })
})

// Write out package.json file
const packageJSON = packageJson({
  fontId,
  fontName,
})
fs.writeFileSync(`${fontDir}/package.json`, packageJSON)
