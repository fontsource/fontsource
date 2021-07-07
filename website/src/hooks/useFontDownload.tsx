import { useEffect, useState } from "react";

import { MetadataProps } from "../@types/[font]";
import { fontsourceDownload } from "../utils/fontsourceUtils";

const useFontDownload = (metadata: MetadataProps, downloadLink: string) => {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    setFontLoaded(false);

    fetch(downloadLink)
      .then((res) => res.text())
      .then((cssFile) => {
        document.getElementById("font-preview-css").innerText =
          cssFile.replaceAll(
            /url\('\.\/(files\/.*?)'\)/g,
            `url('${fontsourceDownload.fontDownload(metadata.fontId)}/$1')`
          );

        document.fonts.ready.then(() => setFontLoaded(true));
      });
  }, [metadata.fontId, downloadLink]);

  return fontLoaded;
};

export default useFontDownload;
