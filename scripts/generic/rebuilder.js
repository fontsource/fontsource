const fs = require(`fs-extra`)
const glob = require(`glob`)
const jsonfile = require(`jsonfile`)
const { packageJsonRebuild, fontFace, readme } = require(`./templates`)

// Find names of all packages.
const getDirectories = () =>
  fs
    .readdirSync("./packages", { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

const directories = getDirectories()

directories.forEach(directory => {
  const fontDir = `./packages/${directory}`
  const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`)

  if (metadata.type != "google") {
    const packageJSONData = jsonfile.readFileSync(`${fontDir}/package.json`)

    // Clear directory
    fs.copySync(`${fontDir}/files`, `./scripts/temp_packages/${directory}`)
    fs.emptyDirSync(fontDir)
    fs.copySync(`./scripts/temp_packages/${directory}`, `./${fontDir}/files`)
    fs.removeSync(`./scripts/temp_packages/${directory}`)

    const makeFontFilePath = (subset, weight, style, extension) => {
      return `./files/${metadata.fontId}-${subset}-${weight}-${style}.${extension}`
    }

    glob(fontDir + "/**/*.woff2", {}, (err, files) => {
      let subsets = metadata.subsets
      let weights = metadata.weights
      let styles = metadata.styles

      subsets.forEach(subset => {
        let cssSubset = []
        weights.forEach(weight => {
          let cssWeight = []
          styles.forEach(style => {
            let cssStyle = []
            const css = fontFace({
              fontId: metadata.fontId,
              fontName: metadata.fontName,
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
          if (subset === metadata.defSubset && weight == "400") {
            fs.writeFileSync(`${fontDir}/index.css`, fileContentWeight)
          }
        })

        const fileContentSubset = cssSubset.join("")
        // subset.css
        const cssPath = `${fontDir}/${subset}.css`
        fs.writeFileSync(cssPath, fileContentSubset)
      })

      const packageReadme = readme({
        fontId: metadata.fontId,
        fontName: metadata.fontName,
        subsets,
        weights,
        styles,
        source: metadata.source,
        license: metadata.license,
        version: metadata.version,
      })
      fs.writeFileSync(`${fontDir}/README.md`, packageReadme)

      // Write metadata.json
      const datetime = new Date()
      jsonfile.writeFileSync(`${fontDir}/metadata.json`, {
        fontId: metadata.fontId,
        fontName: metadata.fontName,
        subsets,
        weights,
        styles,
        defSubset: metadata.defSubset,
        lastModified: datetime.toISOString().slice(0, 10),
        version: metadata.version,
        source: metadata.source,
        license: metadata.license,
        type: metadata.type,
      })
    })

    // Write out package.json file
    const packageJSON = packageJsonRebuild({
      fontId: metadata.fontId,
      fontName: metadata.fontName,
      name: packageJSONData.name,
      version: packageJSONData.version,
    })
    fs.writeFileSync(`${fontDir}/package.json`, packageJSON)
    console.log(`Finished processing ${metadata.fontId}.`)
  }
})
