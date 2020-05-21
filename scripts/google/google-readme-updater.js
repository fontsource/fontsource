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
  const fontDir = `packages/${font.id}`
  if (fs.existsSync(fontDir)) {
    const packageReadme = readme({
      fontId: font.id,
      fontName: font.family,
    })
    fs.writeFileSync(`${fontDir}/README.md`, packageReadme)
    console.log(`${font.id} updated.`)
  }
})

console.log("All Google Font READMEs have been updated.")
