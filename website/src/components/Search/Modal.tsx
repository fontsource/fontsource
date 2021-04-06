import { SearchIcon } from "@chakra-ui/icons";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
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

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modal Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FontSearch />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost">Secondary Action</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
