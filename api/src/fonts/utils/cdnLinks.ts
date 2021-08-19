export const metadataLink = (fontId: string) =>
  `https://cdn.jsdelivr.net/npm/@fontsource/${fontId}/metadata.json`;

export const unicodeRangeLink = (fontId: string) =>
  `https://cdn.jsdelivr.net/npm/@fontsource/${fontId}/unicode.json`;

export const fontLink = (
  id: string,
  subset: string,
  weight: number,
  style: string,
) => {
  const url = {
    woff2: `https://cdn.jsdelivr.net/npm/@fontsource/${id}/files/${id}-${subset}-${weight}-${style}.woff2`,
    woff: `https://cdn.jsdelivr.net/npm/@fontsource/${id}/files/${id}-${subset}-${weight}-${style}.woff`,
  };
  return url;
};
