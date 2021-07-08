const minifyCss = (css: string) =>
  css
    // remove comments, newlines, and tabs
    .replace(/\/\*[\s\S]*?\*\/|[\r\n\t]+/g, "")
    // limit number of adjacent spaces to 1
    .replace(/ {2,}/g, " ")
    // remove spaces around the following: ,:;{}
    .replace(/ ?([,:;{}]) ?/g, "$1")
    // remove last semicolon in block
    .replace(/;}/g, "}");

export default minifyCss;
