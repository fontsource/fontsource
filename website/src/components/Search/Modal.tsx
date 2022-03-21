import { SearchIcon } from "@chakra-ui/icons";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  useColorModeValue,
  useDisclosure,
  Kbd,
  Box,
  useEventListener,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { getUrlParams } from "../../utils/getUrlParams";
import { FontSearch } from "./InstantSearch";

export const SearchModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgSearch = useColorModeValue("gray.50", "gray.900");

  const [onMacEnv, setOnMacEnv] = useState<boolean>(false);

  // Open modal if search url param exists (used for OpenSearch)
  useEffect(() => {
    if (getUrlParams().has("search")) {
      onOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOnMacEnv(/(Mac|iPhone|iPad|iPod)/i.test(navigator.userAgent));
  }, [onMacEnv]);

  useEventListener("keydown", (e) => {
    const hotkey = onMacEnv ? "metaKey" : "ctrlKey";
    if (e.key.toLowerCase() === "k" && e[hotkey]) {
      e.preventDefault();
      isOpen ? onClose() : onOpen();
    }
  });

  return (
    <>
      <Button
        onClick={onOpen}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        size="lg"
        bg={bgSearch}
        color="gray.400"
        variant="outline"
        rounded="lg"
        aria-label="Search fonts"
        role="search"
      >
        <Box>
          <SearchIcon ml="-5px" mr="10px" />
          Search
        </Box>

        <Box>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </Box>
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
