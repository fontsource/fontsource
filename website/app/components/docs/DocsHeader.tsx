import type { TextInputProps } from '@mantine/core';
import { createStyles, TextInput, Title } from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';
import { useState } from 'react';

import { ContentHeader, IconSearch } from '@/components';

const useStyles = createStyles((theme) => ({
	wrapper: {
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[2],
		borderRadius: '4px',
		border: `1.5px solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		padding: '1px 8px',
		'&:focus-within': {
			borderColor: theme.colors.purple[0],
		},
	},
}));

const DocsSearchBar = ({ ...others }: TextInputProps) => {
	const { classes } = useStyles();
	const { ref, focused } = useFocusWithin();
	const [inputValue, setInputValue] = useState('');

	const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(event.currentTarget.value);
	};

	return (
		<TextInput
			value={inputValue}
			onChange={onChange}
			placeholder="Search docs"
			variant="unstyled"
			className={classes.wrapper}
			autoComplete="off"
			ref={ref}
			icon={<IconSearch active={focused} />}
			{...others}
		/>
	);
};

export const DocsHeader = () => {
	return (
		<ContentHeader>
			<Title order={1} color="purple">
				Documentation
			</Title>
			<DocsSearchBar />
		</ContentHeader>
	)
}
