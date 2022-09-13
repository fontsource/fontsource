import { Box, createStyles } from "@mantine/core";

import algoliasearch from "algoliasearch/lite";
import { InstantSearch } from "react-instantsearch-hooks-web";

import { InfiniteHits } from "~/components/search/Hits";
import { Filters } from "~/components/search/Filters";
import { useState, useEffect } from "react";

const searchClient = algoliasearch(
  "WNATE69PVR",
  "8b36fe56fca654afaeab5e6f822c14bd"
);

const useStyles = createStyles(theme => ({
  background: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.background[3]
        : theme.colors.background[1],
  },

  container: {
    maxWidth: "1440px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "40px 64px",

    [theme.fn.smallerThan("lg")]: {
      padding: "40px 40px",
    },
  },
}));

export default function Index() {
  const { classes } = useStyles();
  const [previewLabel, setPreviewLabel] = useState("Sentence");
  const [previewValue, setPreviewValue] = useState(
    "Sphinx of black quartz, judge my vow."
  );
  const [previewInputView, setPreviewInputView] = useState("");

  const [fontSize, setFontSize] = useState(32);
  const size = {
    value: fontSize,
    onChange: setFontSize,
  };
  const preview = {
    label: previewLabel,
    labelChange: setPreviewLabel,
    value: previewValue,
    inputView: previewInputView,
    onChangeEvent: (event: React.ChangeEvent<HTMLInputElement>) => {
      setPreviewLabel("Custom");
      setPreviewValue(event.currentTarget.value);
      setPreviewInputView(event.currentTarget.value);
    },
    onChangeValue: setPreviewValue,
  };

  useEffect(() => {
    if (previewLabel !== "Custom") {
      setPreviewInputView("");
    }
  }, [previewLabel]);

  return (
    <InstantSearch searchClient={searchClient} indexName="prod_FONTS">
      <Box className={classes.background}>
        <Box className={classes.container}>
          <Filters size={size} preview={preview} />
        </Box>
      </Box>
      <Box className={classes.container}>
        <InfiniteHits size={size} preview={preview} />
      </Box>
    </InstantSearch>
  );
}
