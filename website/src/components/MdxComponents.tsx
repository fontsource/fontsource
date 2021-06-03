/* eslint-disable react/display-name */
import {
  Box,
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
} from "@chakra-ui/react";

import { BlockQuote } from "./Blockquote";
import { Code } from "./Code";
import { NextChakraLink } from "./NextChakraLink";

const CustomMdxComponents = {
  // Typography
  h1: (props) => <Heading as="h1" size="2xl" {...props} />,
  h2: (props) => <Heading as="h2" mt={8} size="lg" {...props} />,
  h3: (props) => <Heading as="h3" mt={8} size="md" {...props} />,
  p: (props) => <Text lineHeight="1.6" my="1.25rem" {...props} />,
  a: (props) => (
    <NextChakraLink
      borderBottom="1px dotted"
      _hover={{ textDecoration: "none" }}
      {...props}
    />
  ),
  ul: (props) => <UnorderedList pl={6} {...props} />,
  li: (props) => <ListItem mb={4} {...props} />,

  // Code
  code: (props) => (
    <Box>
      <Code {...props} />
    </Box>
  ),
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
