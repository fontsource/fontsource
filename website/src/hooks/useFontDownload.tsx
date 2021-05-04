import { useEffect, useState } from "react";

import { MetadataProps } from "../@types/[font]";

const useFontDownload = (metadata: MetadataProps, downloadLink: string) => {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    setFontLoaded(false);

    // Fetch font file
    new FontFace(metadata.fontName, `url(${downloadLink})`)
      .load()
      .then((result) => {
        document.fonts.add(result);
        setFontLoaded(true);
      })
      .catch((error) => console.log(error));
  }, [metadata.fontId, metadata.fontName, downloadLink]);

  return fontLoaded;
};

export default useFontDownload;
