import {
  Box,
  Code,
  Divider,
  Heading,
  Input,
  SimpleGrid,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { AiOutlineFontSize } from "react-icons/ai";

import { MetadataProps } from "../@types/[font]";

export const FontPreview = (metadata: MetadataProps) => {
  const [fontSize, setFontSize] = useState(32);
  const [previewText, setPreviewText] = useState(
    "Sphinx of black quartz, judge my vow."
  );

  const bgSlider = useColorModeValue("gray.200", "gray.700");
  const bgSliderFilled = useColorModeValue("black", "white");

  return (
    <>
      <Box>
        <Heading>{metadata.fontName}</Heading>
        <Divider mt={2} />
      </Box>
      <Heading>Options</Heading>
      <SimpleGrid columns={{ md: 1, lg: 2 }}>
        <Text>Styles: {metadata.styles.join(", ")}</Text>
        <Text>Weights: {metadata.weights.join(", ")}</Text>
      </SimpleGrid>

      <Heading>Preview</Heading>
      <Input
        value={previewText}
        onChange={(event) => setPreviewText(event.target.value)}
        variant="flushed"
        style={{
          fontFamily: metadata.fontName,
          fontSize: `${fontSize}px`,
        }}
        height={`${fontSize + 12}px`}
      />

      <Slider
        aria-label="slider-font-size"
        min={8}
        max={200}
        defaultValue={32}
        onChange={(value) => setFontSize(value)}
      >
        <SliderTrack bg={bgSlider}>
          <SliderFilledTrack bg={bgSliderFilled} />
        </SliderTrack>
        <SliderThumb boxSize={6}>
          <Box color="black" as={AiOutlineFontSize} />
        </SliderThumb>
      </Slider>

      <Heading>Installation</Heading>
      <Code>yarn add @fontsource/{metadata.fontId}</Code>
      <Code>import &quot;@fontsource/{metadata.fontId}.css&quot;</Code>
    </>
  );
};
