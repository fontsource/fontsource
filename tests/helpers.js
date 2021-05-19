const fs = require("fs-extra")
const path = require("path")

const readDir = path => {
  const fileArr = []
  fs.readdirSync(path).forEach(file => {
    fileArr.push(file)
  })

  return fileArr
}

const readDirContents = (dirPath, fileNames) => {
  const fileContents = []

  fileNames.forEach(file => {
    const content = fs
      .readFileSync(path.join(dirPath, file))
      .toString()
      // Remove whitespace due to possible diffs
      .replaceAll(/\s/g, "")
    fileContents.push(content)
  })
  return fileContents
}

module.exports = { readDir, readDirContents }
