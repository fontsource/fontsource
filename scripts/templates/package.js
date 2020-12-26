const _ = require("lodash")

exports.packageJson = _.template(
  `{
  "name": "@fontsource/<%= fontId %>",
  "version": "<%= version %>",
  "description": "<%= fontName %> font in NPM glory.",
  "main": "index.css",
  "publishConfig": {
    "access": "public"
  },
  "keywords": [
    "fontsource",
    "font",
    "font family",
    "google fonts",
    "<%= fontName %>",
    "<%= fontId %>",
    "css",
    "front-end",
    "web",
    "typeface"
  ],
  "author": "Lotus <declininglotus@gmail.com>",
  "license": "MIT",
  "homepage": "https://github.com/fontsource/fontsource/tree/master/packages/<%= fontId %>#readme",
  "repository": {
    "type": "git",
    "url": "https://github.com/fontsource/fontsource.git",
    "directory": "packages/<%= fontId %>"
  }
}
`
)
