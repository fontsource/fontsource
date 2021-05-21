// defaultSubset is what is used to generate index.css
// Keep unicoderange "null" if empty. Optional input.
// version should match Github release version.
// type helps identify the category of font, such as Google or not. Keep it "other" unless directed to do so.

const config = {
  fontId: "",
  fontName: "",
  defSubset: "latin",
  unicoderange: "null",
  version: "",
  category: "",
  sourcelink: "",
  licenselink: "",
  type: "other",
};

export { config };
