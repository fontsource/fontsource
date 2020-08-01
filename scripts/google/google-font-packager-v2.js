const _ = require(`lodash`)
const async = require(`async`)
const flatten = require(`flat`)
const fs = require(`fs-extra`)
const isAbsoluteUrl = require(`is-absolute-url`)
const jsonfile = require(`jsonfile`)
const apiFont = require(`google-font-metadata`)

const download = require(`./download-file`)
const { packageJson, fontFaceUnicode, readme } = require(`./templates`)

const id = process.argv[2]
if (!id) {
  console.warn(`Google Font ID has not been passed into packager.`)
  process.exit()
}

const font = apiFont[id]

// Set file directories
const fontDir = `packages/${font.id}`
fs.ensureDirSync(fontDir)
fs.ensureDirSync(`scripts/temp_packages`)

// Update checking
let changed = false

if (fs.existsSync(`${fontDir}/metadata.json`)) {
  let metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`)
  changed = metadata.lastModified !== font.lastModified
} else {
  changed = true
}

// Processing each subset of given font ID.
if (changed) {
  fs.ensureDirSync(`./${fontDir}/files`)

  // Generate filenames
  const makeFontDownloadPath = (subset, weight, style, extension) => {
    return `./${fontDir}/files/${font.id}-${subset}-${weight}-${style}.${extension}`
  }

  const makeFontFilePath = (subset, weight, style, extension) => {
    return `./files/${font.id}-${subset}-${weight}-${style}.${extension}`
  }

  // Parse API and split into variant + link array pairs. [['weight.style.subset.url|local.extension','link to font or local name'],...]
  const downloadURLPairs = _.toPairs(flatten(font.variants))

  // Filter out local font links and only leave URLs for each pair
  let links = downloadURLPairs
    .filter(pair => isAbsoluteUrl(pair[1].toString()))
    .filter(file => file[0].split(".")[4] === "woff2")
    .map(file => {
      const types = file[0].split(".")
      const dest = makeFontDownloadPath(
        types[2].replace("[", "").replace("]", ""),
        types[0],
        types[1],
        types[4]
      )
      const url = file[1]
      return {
        url,
        dest,
      }
    })

  // Get woff and ttf/otf all subset variant
  let oldLinks = downloadURLPairs
    .filter(pair => isAbsoluteUrl(pair[1].toString()))
    .filter(file => {
      const types = file[0].split(".")
      if (
        types[4] === "woff" ||
        types[4] === "truetype" ||
        types[4] === "opentype"
      ) {
        return true
      }
      return false
    })
    .map(file => {
      const types = file[0].split(".")
      const dest = makeFontDownloadPath(
        "all",
        types[0],
        types[1],
        types[4].replace("truetype", "ttf").replace("opentype", "otf")
      )
      const url = file[1]
      return {
        url,
        dest,
      }
    })

  // Remove all duplicate values for each "subset" to reduce unneccesary downloads
  oldLinks = _.uniqBy(oldLinks, item => {
    return item.url && item.dest
  })
  _.forEach(oldLinks, item => {
    links.push(item)
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
  const ttforotf = (subset, weight, style) => {
    if (
      Object.keys(font.variants[weight][style][subset].url).includes("opentype")
    ) {
      return "otf"
    }
    return "ttf"
  }

  const unicodeKeys = Object.keys(font.unicodeRange)

  font.weights.forEach(weight => {
    cssWeight = []
    font.styles.forEach(style => {
      cssStyle = []
      unicodeKeys.forEach(subset => {
        // Some fonts may have variants 400, 400i, 700 but not 700i.
        if (style in font.variants[weight]) {
          let css = fontFaceUnicode({
            fontId: font.id,
            fontName: font.family,
            locals: font.variants[weight][style][subset].local,
            style,
            subset,
            weight,
            woff2Path: makeFontFilePath(
              subset.replace("[", "").replace("]", ""),
              weight,
              style,
              "woff2"
            ),
            woffPath: makeFontFilePath("all", weight, style, "woff"),
            ttforotf: ttforotf(subset, weight, style)
              .replace("otf", "opentype")
              .replace("ttf", "truetype"),
            ttforotfPath: makeFontFilePath(
              "all",
              weight,
              style,
              ttforotf(subset, weight, style)
            ),
            unicodeRange: font.unicodeRange[subset],
          })
          cssStyle.push(css)
          cssWeight.push(css)
        }
      })
      if (style in font.variants[weight]) {
        const cssStylePath = `${fontDir}/${weight}-${style}.css`
        fs.writeFileSync(cssStylePath, cssStyle.join(""))
      }
    })
    const cssWeightPath = `${fontDir}/${weight}.css`
    fs.writeFileSync(cssWeightPath, cssWeight.join(""))
    if (weight === "400") {
      fs.writeFileSync(`${fontDir}/index.css`, cssWeight.join(""))
    }
  })
}

// If everything ran successfully, apply new updates to package.
if (changed) {
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

  // Write out package.json file
  const packageJSON = packageJson({
    fontId: font.id,
    fontName: font.family,
  })
  // Once created, don't interfere with lerna updates
  if (!fs.existsSync(`${fontDir}/package.json`)) {
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
}

console.log(`Finished processing ${font.id}`)
