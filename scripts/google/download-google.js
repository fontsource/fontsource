const _ = require(`lodash`)
const async = require(`async`)
const fs = require(`fs-extra`)
const shell = require(`shelljs`)

const fonts = require(`google-font-metadata`)
const force = process.argv[2]

fs.ensureDirSync(`packages`)
fs.ensureDirSync(`scripts/temp_packages`)

// Create an async queue object
const processQueue = (fontid, cb) => {
  console.log(`Downloading ${fontid}`)
  shell.exec(`node ./scripts/google/run.js ${fontid} ${force}`, () => {
    cb()
  })
}

// EventEmitter listener is usually set at a default limit of 10, below chosen 12 concurrent workers
require("events").EventEmitter.defaultMaxListeners = 0
const queue = async.queue(processQueue, 12)

queue.drain(() => {
  console.log(
    `All ${Object.keys(fonts).length} Google Fonts have been processed.`
  )
})

queue.error((err, fontid) => {
  console.error(`${fontid} experienced an error.`)
})

// Testing
/* const test = () => {
  queue.push(`noto-sans-jp`)
}
test() */

// Production
const production = () => {
  _.forOwn(fonts, font => {
    queue.push(`${font.id}`)
  })
}
production()
