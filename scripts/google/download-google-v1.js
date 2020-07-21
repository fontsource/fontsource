const _ = require(`lodash`)
const async = require(`async`)
const fs = require(`fs-extra`)
const shell = require(`shelljs`)

const fontsv1 = require(`google-font-metadata/data/google-fonts-v1.json`)

fs.ensureDirSync(`packages`)

// Create an async queue object
const processQueue = (font, cb) => {
  console.log(`Downloading ${font}`)
  shell.exec(`node ./scripts/google/google-font-packager-v1.js ${font}`, () => {
    cb()
  })
}

// EventEmitter listener is usually set at a default limit of 10, below chosen 12 concurrent workers
require("events").EventEmitter.defaultMaxListeners = 0
const queue = async.queue(processQueue, 12)

queue.drain(() => {
  console.log(
    `All ${Object.keys(fontsv1).length} Google Fonts V1 have been processed.`
  )
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
  _.forOwn(fontsv1, font => {
    queue.push(`${font.id}`)
  })
}
production()
