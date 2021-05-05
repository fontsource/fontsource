const algoliasearch = require("algoliasearch")
const jsonfile = require("jsonfile")

const { directories } = require("./utils")

const indexArray = []

// Copy all metadatas into one array
directories.forEach(directory => {
  const fontDir = `./packages/${directory}`
  const metadata = jsonfile.readFileSync(`${fontDir}/metadata.json`)
  metadata.objectID = metadata.fontId
  indexArray.push(metadata)
})

// Written as it is used by the website getStaticPaths
jsonfile.writeFileSync("./website/src/configs/algolia.json", indexArray)

// Initialise Algolia client
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}

const client = algoliasearch("WNATE69PVR", process.env.ALGOLIA_ADMIN_KEY)
const index = client.initIndex("prod_FONTS")

index.saveObjects(indexArray).then(() => {
  console.log("Updated fonts.")
})
