const findBoundaries = (weights) => [Math.min(...weights), Math.max(...weights)];

const generateSingle = (font) => {
  const { family, style, weight, variable, src, unicodeRange, comment, spacer = "\n  " } = font;
  const { wght, stretch, slnt } = variable ?? {};
  let result = "@font-face {";
  result += `${spacer}font-family: '${family}';`;
  result += `${spacer}font-style: ${slnt ? `oblique ${slnt.max * -1}deg ${slnt.min * -1}deg` : style};`;
  result += `${spacer}font-weight: ${wght ? findBoundaries(wght).join(" ") : weight};`;
  if (stretch)
    result += `${spacer}font-stretch: ${stretch.min}% ${stretch.max}%;`;
  result += `${spacer}src: ${src.map(({ url, format }) => `url(${url}) format('${format}')`).join(", ")};`;
  if (unicodeRange)
    result += `${spacer}unicode-range: ${unicodeRange};`;
  if (comment)
    result = `/* ${comment} */
${result}`;
  return `${result}
}`;
};
const generateMulti = (metadata) => {
  const { family, styles, weights, variable, path = "", subsets, unicodeRange, formats } = metadata;
  const id = metadata.id ?? family.toLowerCase().replace(/\s/g, "-");
  let result = "";
  styles.forEach((style) => {
    weights.forEach((weight) => {
      subsets.forEach((subset) => {
        const fontObject = {
          family,
          style,
          weight,
          variable,
          src: formats.map((format) => ({ url: `${path}${id}-${subset}-${weight}-${style}.${format}`, format })),
          comment: subset
        };
        if (unicodeRange)
          fontObject.unicodeRange = unicodeRange[subset];
        result += `${generateSingle(fontObject)}

`;
      });
    });
  });
  return result.slice(0, -2);
};

export { generateMulti, generateSingle };
