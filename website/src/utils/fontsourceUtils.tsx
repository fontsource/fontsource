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

  fontDownload(fontId: string, defSubset: string, weightArr: number[]) {
    const dir = `${baseUrlDownload}/@fontsource/${fontId}`;

    // Rarely some fonts do not have a 400 weight
    const findClosest = () => {
      // Convert all string values of weights into numbers
      weightArr = weightArr.map((weight) => {
        return Number(weight);
      });
      // Return as string for comparison
      return weightArr.reduce((prev, curr) =>
        Math.abs(curr - 400) < Math.abs(prev - 400) ? curr : prev
      );
    };
    return `${dir}/files/${fontId}-${defSubset}-${findClosest()}-normal.woff2`;
  },
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export { fetcher, fontsourceDownload };
