import { SearchIcon } from "@chakra-ui/icons";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";

import { FontSearch } from "./InstantSearch";

export const SearchModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgSearch = useColorModeValue("gray.50", "gray.900");
  return (
    <>
      <Button
        leftIcon={<SearchIcon ml="-5px" mr="10px" />}
        onClick={onOpen}
        justifyContent="left"
        width="100%"
        size="lg"
        bg={bgSearch}
        color="gray.400"
        variant="outline"
        rounded="lg"
        aria-label="Search fonts"
        role="search"
      >
        Search
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="transparent" shadow="none">
          <ModalBody mt={12}>
            <FontSearch />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
