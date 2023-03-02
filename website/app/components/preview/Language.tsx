import { createStyles,  rem } from '@mantine/core';
import { useAtom } from 'jotai';

import { Dropdown, DropdownItem } from '@/components';

import { languageAtom } from './atoms';

const useStyles = createStyles((theme) => ({
	wrapper: {
		width: '100%',

		padding: `${rem(2)} ${rem(16)}`,
		height: rem(40),
		border: `${rem(1)} solid ${theme.colorScheme === 'dark'
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

		fontWeight: 400,

		'&:not([data-disabled])': theme.fn.hover({
			backgroundColor: theme.fn.lighten(theme.colors.purple[0], 0.99),
		}),
	}
}));

const languages = ['Latin', 'Latin Extended', 'Cyrillic']

const LanguageSelector = () => {
	const { classes } = useStyles();
	const [language, setLanguage] = useAtom(languageAtom)

	return (
		<Dropdown label={language} className={classes.wrapper}>
			{languages.map((lang) => (
				<DropdownItem key={lang} value={lang} setValue={setLanguage} />
			))}
		</Dropdown>
	)
}

export { LanguageSelector }
