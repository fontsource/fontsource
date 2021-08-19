// GitHub API has too many restrictions to actually be feasible for individual font downloads.
// UNPKG is a bit unreliable as it blocks our requests sometimes.
// We've got special permission from jsdelivr to bypass restrictions - https://github.com/jsdelivr/jsdelivr/issues/18279
const baseUrlDownload = "https://cdn.jsdelivr.net/npm";

const fontsourceDownload = {
  data(fontId: string) {
    const dir = `${baseUrlDownload}/@fontsource/${fontId}`;
    return {
      metadata: `${dir}/metadata.json`,
      npm: `https://www.npmjs.com/package/@fontsource/${fontId}`,
      repo: `https://github.com/fontsource/fontsource/tree/master/packages/${fontId}`,
    };
  },

  cssDownload(fontId: string, weight: number, style: string) {
    const dir = `${baseUrlDownload}/@fontsource/${fontId}`;

    // If style is normal, only search for the "weight.css" file. e.g. "400.css" instead of "400-italic.css"
    return `${dir}/${weight}${style === "normal" ? "" : `-${style}`}.css`;
  },

  fontDownload(fontId: string) {
    return `${baseUrlDownload}/@fontsource/${fontId}`;
  },
};

const fetchJson = (url: string) => fetch(url).then((res) => res.json());
const fetchText = (url: string) => fetch(url).then((res) => res.text());

// Rarely some fonts do not have a 400 weight
const findClosestWeight = (weightArr: number[]) => {
  // Convert all string values of weights into numbers
  weightArr = weightArr.map((weight) => {
    return Number(weight);
  });
  // Return as string for comparison
  return weightArr.reduce((prev, curr) =>
    Math.abs(curr - 400) < Math.abs(prev - 400) ? curr : prev
  );
};

// Rarely some fonts do not have a normal style
const findClosestStyle = (styleArr: string[]) => {
  if (styleArr.includes("normal")) {
    return "normal";
  } else {
    return styleArr[0];
  }
};

export {
  fetchJson,
  fetchText,
  findClosestStyle,
  findClosestWeight,
  fontsourceDownload,
};
