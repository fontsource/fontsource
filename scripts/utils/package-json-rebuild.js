const fs = require(`fs-extra`)
const jsonfile = require(`jsonfile`)

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
  const packageJSON = jsonfile.readFileSync(`${fontDir}/package.json`)
  fs.removeSync(`${fontDir}/package.json`)
  jsonfile.writeFileSync(`${fontDir}/package.json`, {
    name: packageJSON.name,
    version: packageJSON.version,
    description: packageJSON.description,
    main: "index.css",
    publishConfig: {
      access: "public",
    },
    keywords: packageJSON.keywords,
    author: "Lotus <declininglotus@gmail.com>",
    license: "MIT",
    homepage: `https://github.com/fontsource/fontsource/tree/master/packages/${metadata.fontId}#readme`,
    repository: {
      type: "git",
      url: "https://github.com/fontsource/fontsource.git",
      directory: `packages/${metadata.fontId}`,
    },
  })
})
