// defaultSubset is what is used to generate index.css
// Keep unicoderange "null" if empty. Optional input.
// version should match Github release version.
// type helps identify the category of font, such as Google or not. Keep it "other" unless directed to do so.

const config = {
  fontId: "goudymediaeval",
  fontName: "Goudy Mediaeval",
  defaultSubset: "latin",
  unicoderange: "null",
  version: "",
  sourcelink:
    "https://www.onlinewebfonts.com/download/24b2eac64e0cb26cc8851d7fdf940b88",
  licenselink: "http://moorstation.org/typoasis/designers/steffmann/index.htm",
  type: "other",
}

module.exports = config
