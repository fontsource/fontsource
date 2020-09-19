const fs = require(`fs-extra`)
const jsonfile = require(`jsonfile`)

const apiFont = require(`google-font-metadata`)
const packagerv1 = require(`./packager-v1`)
const packagerv2 = require(`./packager-v2`)
const { readme, packageJson } = require(`./templates`)

const id = process.argv[2]
if (!id) {
  console.warn(`Google Font ID has not been passed into packager.`)
  process.exit()
}
const force = process.argv[3]
const font = apiFont[id]

// Set file directories
const fontDir = `packages/${font.id}`
fs.ensureDirSync(fontDir)

// Update checking
let changed = false

if (fs.existsSync(`${fontDir}/metadata.json`)) {
  const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`)
  changed = metadata.lastModified !== font.lastModified
} else {
  changed = true
}

if (changed || force === "force") {
  // Wipe old font files preserving package.json
  if (fs.existsSync(`${fontDir}/package.json`)) {
    fs.copySync(
      `./${fontDir}/package.json`,
      `./scripts/temp_packages/${font.id}-package.json`
    )
    fs.emptyDirSync(fontDir)
    fs.copySync(
      `./scripts/temp_packages/${font.id}-package.json`,
      `./${fontDir}/package.json`
    )
    fs.removeSync(`./scripts/temp_packages/${font.id}-package.json`)
  }
  fs.ensureDirSync(`./${fontDir}/files`)

  // Generate files
  packagerv1(font.id)
  packagerv2(font.id)

  // Write README.md
  const packageReadme = readme({
    fontId: font.id,
    fontName: font.family,
    subsets: font.subsets,
    weights: font.weights,
    styles: font.styles,
    version: font.version,
  })
  fs.writeFileSync(`${fontDir}/README.md`, packageReadme)

  // Don't create package.json if already exists to prevent lerna versioning conflicts
  if (!fs.existsSync(`${fontDir}/package.json`)) {
    // Write out package.json file
    const packageJSON = packageJson({
      fontId: font.id,
      fontName: font.family,
    })

    fs.writeFileSync(`${fontDir}/package.json`, packageJSON)
  }

  // Write metadata.json
  jsonfile.writeFileSync(`${fontDir}/metadata.json`, {
    fontId: font.id,
    fontName: font.family,
    subsets: font.subsets,
    weights: font.weights,
    styles: font.styles,
    defSubset: font.defSubset,
    lastModified: font.lastModified,
    version: font.version,
    source: "https://fonts.google.com/",
    license: "https://fonts.google.com/attribution",
    type: "google",
  })

  // Copy CHANGELOG.md over from main repo
  fs.copySync(`./CHANGELOG.md`, `${fontDir}/CHANGELOG.md`)
}

console.log(`Finished processing ${font.id}`)
