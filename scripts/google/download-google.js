const _ = require("lodash")
const async = require("async")
const fs = require("fs-extra")
const shell = require("shelljs")

const { APIv2, APIVariable } = require("google-font-metadata")
const force = process.argv[2]

fs.ensureDirSync("packages")
fs.ensureDirSync("scripts/temp_packages")

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
    `All ${Object.keys(APIv2).length} Google Fonts have been processed.`
  )
  console.log(
    `${Object.keys(APIVariable).length} variable fonts have been processed.`
  )
})

queue.error((err, fontid) => {
  console.error(`${fontid} experienced an error.`, err)
})

// Testing
/* const test = () => {
  queue.push("recursive")
  queue.push("texturina")
  queue.push("cabin")
  queue.push("actor")
}
test() */

// Production
const production = () => {
  _.forOwn(APIv2, font => {
    queue.push(`${font.id}`)
  })
}
production()
