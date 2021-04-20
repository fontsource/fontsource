/* eslint-disable react/display-name */
import {
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

import { Code } from "./Code";
import { NextChakraLink } from "./NextChakraLink";

const CustomMdxComponents = {
  // Typography
  h1: (props) => <Heading {...props} />,
  p: (props) => <Text {...props} />,
  a: (props) => <NextChakraLink {...props} />,
  ul: (props) => <UnorderedList {...props} />,
  li: (props) => <ListItem {...props} />,

  // Code block
  code: (props) => <Code {...props} />,

  // Table
  table: (props) => (
    <TableContainer>
      <Table {...props} />
    </TableContainer>
  ),
  thead: (props) => <Thead {...props} />,
  tbody: (props) => <Tbody {...props} />,
  tfoot: (props) => <Tfoot {...props} />,
  tr: (props) => <Tr {...props} />,
  th: (props) => <Th {...props} />,
  td: (props) => <Td {...props} />,
};

export default CustomMdxComponents;
