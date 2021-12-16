export const packageLink = (fontId: string) =>
  `https://cdn.jsdelivr.net/npm/@fontsource/${fontId}/package.json`;

export const metadataLink = (fontId: string) =>
  `https://cdn.jsdelivr.net/npm/@fontsource/${fontId}/metadata.json`;

export const unicodeRangeLink = (fontId: string) =>
  `https://cdn.jsdelivr.net/npm/@fontsource/${fontId}/unicode.json`;

export const fontLink = (
  id: string,
  subset: string,
  weight: number,
  style: string,
  version?: string,
) => {
  const linkVersion = version ? `@${version}` : '';

  const url = {
    woff2: `https://cdn.jsdelivr.net/npm/@fontsource/${
      id + linkVersion
    }/files/${id}-${subset}-${weight}-${style}.woff2`,
    woff: `https://cdn.jsdelivr.net/npm/@fontsource/${
      id + linkVersion
    }/files/${id}-${subset}-${weight}-${style}.woff`,
    ttf: `https://api.fontsource.org/v1/fonts/${
      id + linkVersion
    }/${subset}-${weight}-${style}.ttf`,
  };
  return url;
};
