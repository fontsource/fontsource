import type { TextInputProps } from '@mantine/core';
import { createStyles, rem, TextInput } from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';
import { useState } from 'react';
import { useSearchBox } from 'react-instantsearch-hooks-web';

import { IconSearch, SearchByAlgolia } from '@/components';

const useStyles = createStyles((theme) => ({
	wrapper: {
		paddingLeft: rem(24),
		borderRadius: '4px 0 0 0',
		borderBottom: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,

		'&:focus-within': {
			borderColor: theme.colors.purple[0],
		},
	},
}));

const SearchBar = ({ ...others }: TextInputProps) => {
	const { classes } = useStyles();
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
			className={classes.wrapper}
			autoComplete="off"
			styles={(theme) => ({
				input: {
					padding: rem(24),
					backgroundColor:
						theme.colorScheme === 'dark'
							? theme.colors.background[4]
							: theme.colors.background[0],

					height: rem(64),

					'&:focus-within': {
						color: theme.colors.purple[0],
					},
				},

				rightSection: {
					right: rem(44),
				},
			})}
			ref={ref}
			icon={<IconSearch active={focused} />}
			rightSection={<SearchByAlgolia height={14} />}
			{...others}
		/>
	);
};

export { SearchBar };
