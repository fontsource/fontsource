import {
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
} from "@chakra-ui/react";
import { LinkProps as NextLinkProps } from "next/dist/client/link";
import NextLink from "next/link";

export type NextChakraLinkProps = NextLinkProps & Omit<ChakraLinkProps, "as">;

//  Has to be a new component because both chakra and next share the `as` keyword
export const NextChakraLink = ({
  href,
  as,
  replace,
  scroll,
  shallow,
  prefetch,
  ...chakraProps
}: NextChakraLinkProps) => {
  return (
    <NextLink
      passHref
      href={href}
      as={as}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      prefetch={prefetch}
    >
      <ChakraLink
        transition="none"
        _hover={{ textDecoration: "none" }}
        {...chakraProps}
      />
    </NextLink>
  );
};
