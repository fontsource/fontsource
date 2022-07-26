// fontId must be lowercase and uses dashes instead of spaces. It will also be used as the package name e.g. open-sans
// fontName is what will be displayed publicly on the README and website e.g. Open Sans
// defSubset is an abbreviation for the default subset. e.g. latin
// unicodeRange is WIP and should be left as is.
// version is the font source's version that will be shown on the README. e.g. v14
// category is the type of font it is. e.g. sans-serif, serif, display, monospace, handwriting, other
// sourcelink is the link to the source of the font. Typically a GitHub repo.
// licenselink is the direct link that shows the license of the font, usually in the GitHub repo of the source.
// type is fontsource-specific e.g. google, league, other. It should be left as "other" unless otherwise specified.

const config = {
  fontId: "",
  fontName: "",
  defSubset: "latin",
  unicodeRange: {},
  version: "",
  category: "sans-serif",
  sourcelink: "",
  licenselink: "",
  type: "other",
};

export { config };
