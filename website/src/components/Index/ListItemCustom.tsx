import { Icon, Link, LinkProps, ListItem } from "@chakra-ui/react";
import { AiFillCheckCircle, AiOutlineLink } from "react-icons/ai";

export const ListItemCustom = (props: LinkProps) => {
  return (
    <ListItem>
      <Icon as={AiFillCheckCircle} color="green.500" mr={2} />
      <Link isExternal flexGrow={1} mr={2} href={props.href}>
        {props.title}
        <Icon as={AiOutlineLink} ml={2} />
      </Link>
    </ListItem>
  );
};

ListItemCustom.defaultProps = {
  href: "/",
  title: "Empty",
};
