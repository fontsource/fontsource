const _ = require(`lodash`)
const async = require(`async`)
const fs = require(`fs-extra`)
const shell = require(`shelljs`)

const fontsv2 = require(`google-font-metadata`)

fs.ensureDirSync(`packages`)

// Create an async queue object
const processQueue = (fontid, cb) => {
  console.log(`Downloading ${fontid}`)
  shell.exec(
    `node ./scripts/google/google-font-packager-v2.js ${fontid}`,
    () => {
      cb()
    }
  )
}

// EventEmitter listener is usually set at a default limit of 10, below chosen 12 concurrent workers
require("events").EventEmitter.defaultMaxListeners = 0
const queue = async.queue(processQueue, 12)

queue.drain(() => {
  console.log(
    `All ${Object.keys(fontsv2).length} Google Fonts V2 have been processed.`
  )
})

queue.error((err, fontid) => {
  console.error(`${fontid} experienced an error.`)
})

// Testing
/* const test = () => {
  queue.push(`roboto`) // 7 subsets, 12 styles
  queue.push(`orienta`) // 1 subset, 2 styles
  queue.push(`arbutus`) // 2 subsets, 1 style
  queue.push(`mate-sc`) // 1 subset, 1 styles
  queue.push(`open-sans`)
  queue.push(`lato`)
  queue.push(`montserrat`)
  queue.push(`noticia-text`)
  queue.push(`noto-sans-jp`)
}
test() */

// Production
const production = () => {
  _.forOwn(fontsv2, font => {
    queue.push(`${font.id}`)
  })
}
production()
