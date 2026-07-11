import { observer, useValue } from '@legendapp/state/react';

import { DropdownSimple } from '@/components/Dropdown';
import { getPreviewText } from '@/utils/language/language';
import { subsetToLanguage } from '@/utils/language/subsets';

import type { FontIDState } from './observables';

interface LanguageSelectorProps {
	state$: FontIDState;
	subsets: string[];
	fontId: string;
}

const LanguageSelector = observer(
	({ state$, subsets, fontId }: LanguageSelectorProps) => {
		const language = useValue(state$.preview.language);

		const items = subsets
			// Remove latin-ext from results as it's not a valid preview language
			.filter((lang) => lang !== 'latin-ext')
			.map((lang) => ({
				label: subsetToLanguage(lang),
				value: lang,
				isRefined: lang === language,
			}));

		return (
			<DropdownSimple
				label={subsetToLanguage(language)}
				items={items}
				refine={(value) => {
					state$.preview.assign({
						language: value,
						text: getPreviewText(value, fontId),
					});
				}}
				w={284}
			/>
		);
	},
);

export { LanguageSelector };
