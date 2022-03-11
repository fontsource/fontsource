import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Code,
  Divider,
  Heading,
  HStack,
  IconButton,
  Input,
  Link,
  Select,
  SimpleGrid,
  Skeleton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AiFillGithub, AiOutlineFontSize } from "react-icons/ai";
import { ImNpm } from "react-icons/im";

import { FontPreviewCss, MetadataProps } from "../@types/[font]";
import { findClosestStyle, findClosestWeight } from "../utils/fontsourceUtils";
import { BlockQuote } from "./Blockquote";
import { NextChakraLink } from "./NextChakraLink";

interface FontPreviewProps {
  defPreviewText: string;
  metadata: MetadataProps;
  fontCss: FontPreviewCss;
}

export const FontPreview = ({
  defPreviewText,
  metadata,
  fontCss,
}: FontPreviewProps) => {
  const { isFallback, events } = useRouter();

  const [fontSize, setFontSize] = useState(32);

  const [previewText, setPreviewText] = useState(defPreviewText);
  const defWeight = findClosestWeight(metadata.weights);
  const [weight, setWeight] = useState(defWeight);

  const defStyle = findClosestStyle(metadata.styles);
  const [style, setStyle] = useState(defStyle);
  // Return states back to defaults when switching pages, else changed weight will remain
  useEffect(() => {
    events.on("routeChangeStart", () => {
      setStyle(defStyle);
      setWeight(defWeight);
      // Refer to _app.tsx for temp workaround until Next.js bug is fixed for resetting this state
      setPreviewText(defPreviewText);
    });
  }, [events, defPreviewText, defStyle, defWeight]);

  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    setFontLoaded(false);

    // Give browser time to unload fonts in order to not cause a flash of the "Fallback Outline" font
    const timeout = setTimeout(
      () => document.fonts.ready.then(() => setFontLoaded(true)),
      500
    );

    return () => clearTimeout(timeout);
  }, [metadata.fontId, weight, style]);

  const bgSlider = useColorModeValue("gray.200", "gray.700");
  const bgSliderFilled = useColorModeValue("black", "white");
  const selectHeadingColor = useColorModeValue("gray.500", "gray.100");

  // Refer to https://github.com/fontsource/fontsource/issues/243
  const affectedVariableFonts = ["exo-2", "inter", "jost", "montserrat"];

  const fallbacks = {
    "sans-serif": ", sans-serif",
    serif: ", serif",
    display: ", cursive",
    handwriting: ", cursive",
    monospace: ", monospace",
    other: "",
  };

  return (
    <>
      <Head>
        <style>{fontCss[weight][style]}</style>
      </Head>
      <Box>
        <SimpleGrid columns={{ base: 1, sm: 2 }}>
          <Heading size="2xl">{metadata.fontName}</Heading>
          <HStack display={{ base: "none", sm: "flex" }} ml="auto">
            <Tag>{metadata.category}</Tag>
            <Link
              isExternal
              href={`https://www.npmjs.com/package/@fontsource/${metadata.fontId}`}
            >
              <IconButton
                aria-label="Link to NPM"
                variant="ghost"
                icon={<ImNpm />}
              />
            </Link>
            <Link
              isExternal
              href={`https://github.com/fontsource/fontsource/tree/main/packages/${metadata.fontId}#readme`}
            >
              <IconButton
                aria-label="Link to Github"
                variant="ghost"
                icon={<AiFillGithub />}
              />
            </Link>
          </HStack>
        </SimpleGrid>
        <Divider mt={1} />
      </Box>

      <SimpleGrid spacing={2} columns={{ md: 1, lg: 2 }}>
        <Box>
          <Text
            fontSize="xs"
            fontWeight="700"
            color={selectHeadingColor}
            textTransform="uppercase"
            letterSpacing="1px"
          >
            Weights
          </Text>
          <Select
            value={weight}
            onChange={(event) => setWeight(+event.target.value)}
          >
            {metadata.weights.map((weight) => (
              <option key={`${metadata.fontId}-${weight}`} value={weight}>
                {weight}
              </option>
            ))}
          </Select>
        </Box>
        <Box>
          <Text
            fontSize="xs"
            fontWeight="700"
            color={selectHeadingColor}
            textTransform="uppercase"
            letterSpacing="1px"
          >
            Styles
          </Text>
          <Select
            value={style}
            onChange={(event) => setStyle(event.target.value)}
          >
            {metadata.styles.map((style) => (
              <option key={`${metadata.fontId}-${style}`} value={style}>
                {style}
              </option>
            ))}
          </Select>
        </Box>
      </SimpleGrid>

      <Skeleton width="100%" isLoaded={fontLoaded && !isFallback}>
        <Input
          value={previewText}
          onChange={(event) => setPreviewText(event.target.value)}
          variant="flushed"
          style={{
            // if the font is a material icons variant, then use the Chakra default font as a fallback
            fontFamily: `"${metadata.fontName}", ${
              metadata.fontId.startsWith("material-icons")
                ? `var(--chakra-fonts-body), `
                : ""
            }"Fallback Outline"`,
            fontSize: `${fontSize}px`,
            fontWeight: weight,
            fontStyle: style,
          }}
          height={`${fontSize + 12}px`}
        />
      </Skeleton>

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
      <Box>
        <Heading mt={2}>Quick Installation</Heading>
        <Divider mt={1} />
      </Box>
      {affectedVariableFonts.includes(metadata.fontId) && (
        <BlockQuote>
          <Text my="20px">
            <strong>Note: </strong>
            {metadata.fontName} is affected by a rendering bug for a small
            subset of MacOS users and thus it is strongly urged to use the
            variable variant of this font. More can be learnt at{" "}
            <Link
              href="https://github.com/fontsource/fontsource/issues/243"
              isExternal
            >
              <strong>fontsource/fontsource#243</strong>
            </Link>{" "}
            <ExternalLinkIcon />.
          </Text>
        </BlockQuote>
      )}
      <Text>
        Fontsource has a variety of methods to import CSS, such as using a
        bundler like Webpack. Full documentation can be found{" "}
        <NextChakraLink
          prefetch={false}
          href="/docs/getting-started"
          borderBottom="1px dotted"
          _hover={{ textDecoration: "none" }}
        >
          here
        </NextChakraLink>
        .
      </Text>
      <Code>yarn add @fontsource/{metadata.fontId}</Code>
      <Code>import &quot;@fontsource/{metadata.fontId}&quot;</Code>
      <Code>
        body &#123; font-family: &quot;{metadata.fontName}&quot;
        {fallbacks[metadata.category]}; &#125;
      </Code>
      {metadata.variable && (
        <>
          <Box>
            <Heading mt={2}>Variable</Heading>
            <Divider mt={1} />
          </Box>
          <Text>
            This font supports the variable font specification. You can find all
            the available variable axis&apos;{" "}
            <Link
              href="https://fonts.google.com/variablefonts"
              isExternal
              mr="auto"
            >
              here <ExternalLinkIcon />
            </Link>
            .
          </Text>
          <Text>
            To see how Fontsource integrates with variable fonts, check the{" "}
            <NextChakraLink
              prefetch={false}
              href="/docs/variable-fonts"
              borderBottom="1px dotted"
              _hover={{ textDecoration: "none" }}
            >
              documentation
            </NextChakraLink>
            . It is highly recommended to use this option when using multiple
            weights for smaller bundle sizes.
          </Text>
        </>
      )}
      <Box>
        <Heading mt={2}>Licensing</Heading>
        <Divider mt={1} />
      </Box>
      <Text>
        It is important to always read the license for every font that you use.
        Most of the fonts in the collection use the SIL Open Font License, v1.1.
        Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu
        Font License v1.0.
      </Text>
      <SimpleGrid columns={{ base: 1, sm: 2 }}>
        <Link href={metadata.source} isExternal mr="auto" fontWeight="700">
          <Button variant="ghost" rightIcon={<ExternalLinkIcon />}>
            Source
          </Button>
        </Link>
        <Link href={metadata.license} isExternal mr="auto" fontWeight="700">
          <Button variant="ghost" rightIcon={<ExternalLinkIcon />}>
            License
          </Button>
        </Link>
      </SimpleGrid>
      <Box>
        <Heading mt={2}>Other Notes</Heading>
        <Divider mt={1} />
      </Box>
      <Text>Font version (provided by source): {metadata.version}</Text>
      <Text>
        Feel free to star and contribute new ideas to this repository that aim
        to improve the performance of font loading, as well as expanding the
        existing library we already have. Any suggestions or ideas can be voiced
        via an{" "}
        <Link href="https://github.com/fontsource/fontsource/issues" isExternal>
          issue <ExternalLinkIcon />
        </Link>
        .
      </Text>
    </>
  );
};
