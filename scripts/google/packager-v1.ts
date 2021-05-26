import fs from "fs-extra";
import { APIv1 } from "google-font-metadata";

import { fontFace } from "../templates/css";
import { makeFontFilePath } from "../utils/utils";

const packagerV1 = (id: string): void => {
  const font = APIv1[id];
  const fontDir = `packages/${font.id}`;

  // Generate CSS
  font.subsets.forEach(subset => {
    const cssSubset: string[] = [];
    font.weights.forEach(weight => {
      font.styles.forEach(style => {
        // Some fonts may have variants 400, 400i, 700 but not 700i.
        if (style in font.variants[weight]) {
          const css = fontFace({
            fontId: font.id,
            fontName: font.family,
            style,
            subset,
            weight,
            woff2Path: makeFontFilePath(
              font.id,
              subset,
              weight,
              style,
              "woff2"
            ),
            woffPath: makeFontFilePath(font.id, subset, weight, style, "woff"),
            unicodeRange: false,
          });

          if (style === "normal") {
            const cssPath = `${fontDir}/${subset}-${weight}.css`;
            fs.writeFileSync(cssPath, css);

            // Should only push normal variants into subset
            cssSubset.push(css);
          } else {
            // If italic or else, define specific style CSS file
            const cssStylePath = `${fontDir}/${subset}-${weight}-${style}.css`;
            fs.writeFileSync(cssStylePath, css);
          }
        }
      });
    });
    const cssSubsetPath = `${fontDir}/${subset}.css`;
    fs.writeFileSync(cssSubsetPath, cssSubset.join(""));
  });
};

export { packagerV1 };
