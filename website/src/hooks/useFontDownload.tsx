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
        // fetch font's css, fix file sources' base url, and add updated css to the head
        document.getElementById("font-preview-css").innerText = cssFile.replace(
          /url\('\.\/(files\/.*?)'\)/g,
          // match "url('./files/${woffFileName}')", then replace with "url('${baseURL}/files/${woffFileName}')"
          `url('${fontsourceDownload.fontDownload(metadata.fontId)}/$1')`
        );

        document.fonts.ready.then(() => setFontLoaded(true));
      });
  }, [metadata.fontId, downloadLink]);

  return fontLoaded;
};

export default useFontDownload;
