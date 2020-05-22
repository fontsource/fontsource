const fs = require(`fs-extra`)
const glob = require(`glob`)

const fontFileDir = `scripts/generic/files`

let weightNames = [
  "thin",
  "hairline",
  "extralight",
  "ultralight",
  "light",
  "normal",
  "regular",
  "medium",
  "semibold",
  "demibold",
  "extrabold",
  "ultrabold",
  "bold",
  "black",
]
let weightNum = [
  100,
  100,
  200,
  200,
  300,
  400,
  400,
  500,
  600,
  600,
  800,
  800,
  700,
  900,
]

glob(fontFileDir + "/**/*.woff2", {}, (err, files) => {
  files.forEach(file => {
    file = file.toLowerCase()
    for (let [index] of weightNames.entries()) {
      fileNew = file.replace(weightNames[index], weightNum[index])
      try {
        fs.renameSync(file, fileNew)
      } catch (err) {}
    }
  })
})
