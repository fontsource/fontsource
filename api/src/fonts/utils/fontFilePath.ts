import { FontFilePath } from '../interfaces/font.interface';

const fontFilePathRegex = /(.+)-(.+)-(.+)\.(.+)$/;

export const fontFilePath = (path: string): FontFilePath | undefined => {
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
