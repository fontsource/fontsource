import { useSelector } from '@legendapp/state/react';
import { createStyles, rem } from '@mantine/core';
import { useFetcher } from '@remix-run/react';
import { useEffect } from 'react';

import { Dropdown, DropdownItem } from '@/components';
import { subsetsMap } from '@/utils/language/subsets';

import { previewState } from './observables';

const useStyles = createStyles((theme) => ({
	wrapper: {
		fontWeight: 400,
		width: '100%',
		padding: `${rem(2)} ${rem(16)}`,
		height: rem(40),
		border: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',

		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],

		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
	},
}));

interface LanguageSelectorProps {
	subsets: string[];
}

const LanguageSelector = ({ subsets }: LanguageSelectorProps) => {
	const { classes } = useStyles();
	const language = useSelector(previewState.language);
	const languageFetcher = useFetcher();

	const handleLanguage = (value: string) => {
		previewState.language.set(subsetsMap[value as keyof typeof subsetsMap]);
		languageFetcher.submit({ subset: value }, {
			method: 'POST',
			action: '/actions/language',
		})
	};

	useEffect(() => {
		if (languageFetcher.state === 'idle' && languageFetcher.data?.text) {

			previewState.text.set(languageFetcher.data.text);
		}
	}, [languageFetcher]);

	return (
		<Dropdown label={language} className={classes.wrapper}>
			{subsets.map((lang) => (
				<DropdownItem
					key={lang}
					label={subsetsMap[lang as keyof typeof subsetsMap]}
					value={lang}
					setValue={handleLanguage}
				/>
			))}
		</Dropdown>
	);
};

export { LanguageSelector };
