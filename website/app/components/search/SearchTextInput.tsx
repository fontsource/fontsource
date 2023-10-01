import { TextInput } from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';
import { useState } from 'react';
import { useSearchBox } from 'react-instantsearch-hooks-web';

import { IconSearch, SearchByAlgolia } from '@/components/icons';

import classes from './SearchTextInput.module.css';

const SearchBar = () => {
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
			aria-label="Search fonts"
			variant="unstyled"
			// className={classes.wrapper}
			classNames={{
				wrapper: classes.wrapper,
				input: classes.input,
			}}
			autoComplete="off"
			ref={ref}
			leftSection={
				<IconSearch data-active={focused} className={classes.left} />
			}
			leftSectionWidth={60}
			rightSection={<SearchByAlgolia height={14} />}
			rightSectionWidth={100}
		/>
	);
};

export { SearchBar };
