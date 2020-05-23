const _ = require(`lodash`)
const fs = require(`fs-extra`)
const requestSync = require(`sync-request`)

const { readme } = require(`./templates`)

const baseurl = `https://google-webfonts-helper.herokuapp.com/api/fonts/`

//Parse API
const res = requestSync(`GET`, baseurl, { retry: true })
const fonts = JSON.parse(res.getBody(`UTF-8`))

// Write README.md
_.forOwn(fonts, font => {
  let subsetReadme = []
  let weightReadme = []
  let styleReadme = ["normal"]

  font.variants.forEach(item => {
    if (item === "italic") {
      item = "400"
      styleReadme.push("italic")
    } else {
      if (item.indexOf("italic") >= 0) {
        item = item.slice(0, -6)
        styleReadme.push("italic")
      }
    }
    item = item.replace(/regular/, "400")
    weightReadme.push(item)
  })

  subsetReadme = [...new Set(font.subsets)]
  weightReadme = [...new Set(weightReadme)]
  styleReadme = [...new Set(styleReadme)]
  const fontDir = `packages/${font.id}`
  if (fs.existsSync(fontDir)) {
    const packageReadme = readme({
      fontId: font.id,
      fontName: font.family,
      subsets: subsetReadme,
      weights: weightReadme,
      styles: styleReadme,
    })
    fs.writeFileSync(`${fontDir}/README.md`, packageReadme)
    console.log(`${font.id} updated.`)
  }
})

console.log("All Google Font READMEs have been updated.")
