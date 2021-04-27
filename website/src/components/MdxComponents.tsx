/* eslint-disable react/display-name */
import {
  Alert,
  Code as InlineCode,
  Divider,
  Heading,
  ListItem,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  UnorderedList,
  useColorModeValue,
} from "@chakra-ui/react";

import { Code } from "./Code";
import { NextChakraLink } from "./NextChakraLink";

const BlockQuote = (props) => {
  const borderColor = useColorModeValue("gray.300", "gray.700");
  const bgColor = useColorModeValue("gray.100", "gray.800");
  return (
    <Alert
      as="blockquote"
      variant="left-accent"
      background={bgColor}
      borderInlineStartColor={borderColor}
      py={0}
      mt={2}
      {...props}
    />
  );
};

const CustomMdxComponents = {
  // Typography
  h1: (props) => <Heading size="2xl" {...props} />,
  h2: (props) => <Heading mt={8} size="lg" {...props} />,
  h3: (props) => <Heading mt={8} size="md" {...props} />,
  p: (props) => <Text lineHeight="1.6" my="1.25rem" {...props} />,
  a: (props) => (
    <NextChakraLink
      borderBottom="1px dotted"
      _hover={{ textDecoration: "none" }}
      {...props}
    />
  ),
  ul: (props) => <UnorderedList {...props} />,
  li: (props) => <ListItem mb={4} {...props} />,

  // Code
  code: (props) => <Code {...props} />,
  inlineCode: (props) => <InlineCode {...props} />,

  // Table
  table: (props) => (
    <TableContainer mt={4}>
      <Table {...props} />
    </TableContainer>
  ),
  thead: (props) => <Thead {...props} />,
  tbody: (props) => <Tbody {...props} />,
  tfoot: (props) => <Tfoot {...props} />,
  tr: (props) => <Tr {...props} />,
  th: (props) => <Th {...props} />,
  td: (props) => <Td {...props} />,

  // Misc
  hr: (props) => <Divider mt={2} {...props} />,
  blockquote: (props) => <BlockQuote {...props} />,
};

export default CustomMdxComponents;
