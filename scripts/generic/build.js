const fs = require("fs-extra")
const glob = require("glob")

const packager = require("./generic-packager")
const config = require("./config")

const fontId = config.fontId
const fontName = config.fontName
const defSubset = config.defaultSubset

// Create folder structure
const fontFileDir = "scripts/generic/files"
const fontDir = `scripts/generic/${fontId}`
fs.ensureDirSync(fontDir)
fs.ensureDirSync(`${fontDir}/files`)

// Move files into package dir
fs.copy(fontFileDir, `${fontDir}/files`, err => {
  if (err) return console.error(err)
  console.log("Copied files into package.")
})

// Read filenames to derive the following information
glob(fontFileDir + "/**/*.woff2", {}, (err, files) => {
  let subsets = []
  let weights = []
  let styles = []

  files.forEach(file => {
    // Remove file path and extension.
    // 23 characters to account for scripts / generic /...filepath, -6 for .woff2
    const name = file.slice(23 + fontId.length, -6).split("-")
    styles.push(name.slice(-1)[0])
    name.pop()
    weights.push(name.slice(-1)[0])
    name.pop()
    subsets.push(name.join("-"))
  })
  subsets = [...new Set(subsets)]
  weights = [...new Set(weights)]
  styles = [...new Set(styles)]

  if (err) {
    console.error(err)
  }

  // Create object to store all necessary data to run package function
  const datetime = new Date()

  const fontObject = {
    fontId,
    fontName,
    subsets,
    weights,
    styles,
    defSubset,
    variable: false,
    source: config.sourcelink,
    license: config.licenselink,
    version: config.version,
    lastModified: datetime.toISOString().slice(0, 10),
    type: config.type,

    fontDir,
  }

  // Generate files (false for rebuildFlag)
  packager(fontObject, false)
})
