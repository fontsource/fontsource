const shell = require("shelljs")

module.exports = function (url, dest, cb) {
  const script = `npx nwget ${url} -O ${dest} --tries 5 -T 120`
  shell.exec(script, { silent: true })
  cb()
}
