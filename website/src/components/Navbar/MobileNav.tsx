import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  IconButton,
  IconButtonProps,
  Stack,
  useColorModeValue,
  UseDisclosureProps,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { RemoveScroll } from "react-remove-scroll";

import { Sidebar } from "../Sidebar";
import { Logo, MenuStack } from "./Navbar";

interface MobileNavProps extends UseDisclosureProps {
  onToggle?: () => void;
  ifDocs?: boolean;
}

export const MobileNavButton = (
  { onToggle, isOpen }: MobileNavProps,
  props: IconButtonProps
) => {
  return (
    <Box display={{ base: "inline-block", md: "none" }} onClick={onToggle}>
      <IconButton
        display={{ base: "flex", md: "none" }}
        fontSize="20px"
        color={useColorModeValue("gray.800", "inherit")}
        variant="ghost"
        icon={
          isOpen ? (
            <IconButton aria-label="Close menu" icon={<CloseIcon />} />
          ) : (
            <IconButton aria-label="Open menu" icon={<HamburgerIcon />} />
          )
        }
        {...props}
      />
    </Box>
  );
};

export const MobileNavContent = ({
  isOpen,
  onToggle,
  ifDocs,
}: MobileNavProps) => {
  const bgNav = useColorModeValue("gray.50", "gray.900");

  return (
    <AnimatePresence>
      {isOpen && (
        <RemoveScroll>
          <motion.div
            transition={{ duration: 0.08 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Stack
              width="100%"
              bg={bgNav}
              height="100vh"
              overflow="auto"
              position="absolute"
              top="0"
              left="0"
              zIndex={99}
            >
              <Flex
                as="nav"
                align="center"
                justify="space-between"
                wrap="wrap"
                width="100%"
                p={8}
              >
                <Logo />
                <MobileNavButton onToggle={onToggle} isOpen={isOpen} />
              </Flex>
              <MenuStack />
              <Sidebar ifDocs={ifDocs} onToggle={onToggle} isOpen={isOpen} />
            </Stack>
          </motion.div>
        </RemoveScroll>
      )}
    </AnimatePresence>
  );
};
