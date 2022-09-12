import { TextInput, TextInputProps } from "@mantine/core";
import { IconSearch } from "@components";
import { useFocusWithin } from "@mantine/hooks";
import { useSearchBox } from "react-instantsearch-hooks-web";
import { useRef, useState } from "react";

interface SearchProps extends TextInputProps {
  queryHook?: (query: string, hook: (value: string) => void) => void;
}

const SearchBar = ({ queryHook, ...others }: SearchProps) => {
  const { ref, focused } = useFocusWithin();
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query);

  const setQuery = (newQuery: string) => {
    setInputValue(newQuery);
    refine(newQuery);
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value);
  };

  // Track when the InstantSearch query changes to synchronize it with
  // the React state.
  // We bypass the state update if the input is focused to avoid concurrent
  // updates when typing.
  if (query !== inputValue && !focused) {
    setInputValue(query);
  }

  return (
    <TextInput
      value={inputValue}
      onChange={onChange}
      placeholder="Search fonts"
      variant="unstyled"
      sx={theme => ({
        paddingLeft: 24,
        borderRadius: "4px 0px 0px 0px",
        borderBottom: `1px solid ${
          theme.colorScheme === "dark"
            ? theme.colors.border[1]
            : theme.colors.border[0]
        }`,

        "&:focus-within": {
          borderColor: theme.colors.purple[0],
        },
      })}
      styles={theme => ({
        input: {
          padding: "24px",
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.background[2]
              : theme.colors.background[0],

          height: "64px",

          "&:focus-within": {
            color: theme.colors.purple[0],
          },
        },
      })}
      ref={ref}
      icon={<IconSearch active={focused} />}
      {...others}
    />
  );
};

export { SearchBar };
