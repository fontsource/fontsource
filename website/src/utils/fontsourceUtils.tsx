const baseUrl =
  "https://raw.githubusercontent.com/fontsource/fontsource/master";

const fontsourceData = {
  base: baseUrl,
  list: `${baseUrl}/FONTLIST.json`,
  readme: `${baseUrl}/README.md`,
  changelog: `${baseUrl}/CHANGELOG.md`,

  data(fontId: string) {
    const dir = `${baseUrl}/packages/${fontId}`;
    return {
      metadata: `${dir}/metadata.json`,
      readme: `${dir}/README.md`,
      npm: `https://www.npmjs.com/package/@fontsource/${fontId}`,
      repo: `https://github.com/fontsource/fontsource/tree/master/packages/${fontId}`,
    };
  },

  fontDownload(fontId: string, defSubset: string, weightArr: number[]) {
    const dir = `${baseUrl}/packages/${fontId}`;

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

export { fetcher, fontsourceData };
