import { template } from "lodash";

const packageJson = template(
  `{
  "name": "@fontsource/<%= fontId %>",
  "version": "<%= version %>",
  "description": "Self-host the <%= fontName %> font in a neatly bundled NPM package.",
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
    "sass",
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
);

export { packageJson };
