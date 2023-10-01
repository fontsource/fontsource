import { Title } from '@mantine/core';

import classes from '@/components/docs/Docs.module.css';
import { ContentHeader } from '@/components/layout/ContentHeader';

// TODO: Implement DocSearch
/* const DocsSearchBar = ({ ...others }: TextInputProps) => {
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
}; */

export const DocsHeader = () => {
	return (
		<ContentHeader>
			<Title order={1} className={classes.title}>
				Documentation
			</Title>
		</ContentHeader>
	);
};
