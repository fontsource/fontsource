const fs = require(`fs-extra`)
const jsonfile = require(`jsonfile`)
const { fontlistMarkdown } = require(`./templates`)

// Find names of all packages.
const getDirectories = () =>
  fs
    .readdirSync("./packages", { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

const directories = getDirectories()

let fontlist = []
let league = []
let icons = []
let other = []

directories.forEach(directory => {
  const fontDir = `./packages/${directory}`
  const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`)
  let object = { [metadata.fontId]: metadata.type }
  fontlist.push(object)

  if (metadata.type == "league") {
    league.push(metadata.fontId)
  } else if (metadata.type == "icons") {
    icons.push(metadata.fontId)
  } else if (metadata.type == "other") {
    other.push(metadata.fontId)
  } else if (metadata.type == "google") {
    return
  } else {
    console.log(`${metadata.fontId} has unknown type ${metadata.type}.`)
  }
})

// Write JSON list to be pulled externally.
jsonfile.writeFile("FONTLIST.json", Object.assign({}, ...fontlist))

// Write MD file
const fontlistWrite = fontlistMarkdown({
  league,
  icons,
  other,
})

fs.writeFileSync(`FONTLIST.md`, fontlistWrite)
