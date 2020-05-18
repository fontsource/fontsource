const _ = require(`lodash`)
const async = require(`async`)
const fs = require(`fs-extra`)
const request = require(`sync-request`)
const shell = require(`shelljs`)

const baseurl = `https://google-webfonts-helper.herokuapp.com/api/fonts/`
const res = request(`GET`, baseurl, { retry: true })
const fonts = JSON.parse(res.getBody(`UTF-8`))

fs.ensureDirSync(`packages`)

// Create an async queue object
const processQueue = (font, cb) => {
  console.log(`Downloading ${font}`)
  shell.exec(`node ./scripts/google-font-packager.js ${font}`, () => {
    cb()
  })
}

// EventEmitter listener is usually set at a default limit of 10, below chosen 12 concurrent workers
require("events").EventEmitter.defaultMaxListeners = 0
const queue = async.queue(processQueue, 12)

queue.drain(() => {
  console.log(`All ${fonts.length} Google fonts have been processed.`)
})

queue.error((err, font) => {
  console.error(`${font} experienced an error.`)
})

// Testing
/*const test = () => {
  queue.push(`roboto`) // 7 subsets, 12 styles
  queue.push(`orienta`) // 1 subset, 2 styles
  queue.push(`arbutus`) // 2 subsets, 1 style
  queue.push(`mate-sc`) // 1 subset, 1 style
  queue.push(`noticia-text`) // 3 subsets, 4 styles
  queue.push(`open-sans`)
  queue.push(`lato`)
  queue.push(`montserrat`)
  queue.push(`noto-sans-jp`)
  queue.push(`b612-mono`)
  queue.push(`b612`)
}
test()*/

// Production
const production = () => {
  _.forOwn(fonts, font => {
    // NPM currently doesn't like these package names for spam purposes
    if (
      !(
        font.id === "b612" ||
        font.id === "b612-mono" ||
        font.id === "goudy-bookletter-1911" ||
        font.id === "libre-barcode-128" ||
        font.id === "libre-barcode-128-text" ||
        font.id === "vt323"
      )
    ) {
      queue.push(`${font.id}`)
    }
  })
}
production()
