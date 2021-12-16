const fontFilePathRegex = /(.+)-(.+)-(.+)\.(.+)$/;

export const fontFilePath = (
  path: string,
):
  | {
      subset: string;
      weight: number;
      style: string;
      ext: string;
    }
  | undefined => {
  const regexResults = fontFilePathRegex.exec(path);

  return regexResults
    ? {
        subset: regexResults[1],
        weight: Number(regexResults[2]),
        style: regexResults[3],
        ext: regexResults[4],
      }
    : undefined;
};
