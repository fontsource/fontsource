const fs = require("fs-extra")
const jsonfile = require("jsonfile")

const { APIv2, APIVariable } = require("google-font-metadata")
const packagerv1 = require("./packager-v1")
const packagerv2 = require("./packager-v2")
const variable = require("./variable")
const { packageJson } = require("../templates/package")
const { scssMixins } = require("../templates/scss")
const { readme } = require("../templates/readme")

const id = process.argv[2]
if (!id) {
  console.warn(`Google Font ID has not been passed into packager.`)
  process.exit()
}
const force = process.argv[3]
const font = APIv2[id]

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

  // Generate CSS files
  packagerv1(font.id)
  packagerv2(font.id)

  let variableMeta = false
  let variableFlag = false
  if (font.id in APIVariable) {
    variable(font.id)
    variableMeta = APIVariable[font.id].axes

    variableFlag = true
  }

  // Generate SCSS files
  fs.ensureDirSync(`./${fontDir}/scss`)

  // Make the key value pairs in the required format - subset: (unicodeRangeValues), subset:...
  const unicodeMap = Object.entries(font.unicodeRange)
    .map(subArr => {
      subArr[0] = subArr[0].replace(/[[\]]/g, "")
      subArr[1] = `(${subArr[1]})`
      return subArr.join(": ")
    })
    .join(", ")

  let scss
  // Include variable mixins if needed
  if (variableFlag) {
    const variableWeight = `${variableMeta.wght.min} ${variableMeta.wght.max}`
    let variableWdth
    if ("wdth" in variableMeta) {
      variableWdth = `${variableMeta.wdth.min}% ${variableMeta.wdth.max}%`
    } else {
      variableWdth = "null"
    }

    scss = scssMixins({
      fontId: font.id,
      fontName: font.family,
      defSubset: font.defSubset,
      defUnicode: font.unicodeRange[font.defSubset],
      unicodeMap,
      variableFlag,
      variableWeight,
      variableWdth,
    })
  } else {
    scss = scssMixins({
      fontId: font.id,
      fontName: font.family,
      defSubset: font.defSubset,
      defUnicode: font.unicodeRange[font.defSubset],
      unicodeMap,
      variableFlag,
    })
  }

  fs.writeFileSync(`${fontDir}/scss/mixins.scss`, scss)

  // Write README.md
  const packageReadme = readme({
    fontId: font.id,
    fontName: font.family,
    fontNameNoSpace: font.family.replace(" ", ""),
    subsets: font.subsets,
    weights: font.weights,
    styles: font.styles,
    variable: variableFlag,
    version: font.version,
    type: "google",
  })

  fs.writeFileSync(`${fontDir}/README.md`, packageReadme)

  // Don't create package.json if already exists to prevent lerna versioning conflicts
  if (!fs.existsSync(`${fontDir}/package.json`)) {
    const mainRepoPackageJson = jsonfile.readFileSync("./package.json")
    // Write out package.json file
    const packageJSON = packageJson({
      fontId: font.id,
      fontName: font.family,
      version: mainRepoPackageJson.version,
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
    variable: variableMeta,
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
