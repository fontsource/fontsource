import { observer, useMountOnce } from '@legendapp/state/react';

import { DropdownSimple } from '@/components/Dropdown';
import { subsetToLanguage } from '@/utils/language/subsets';

import type { FontIDState } from './observables';

interface LanguageSelectorProps {
	state$: FontIDState;
	defSubset: string;
	subsets: string[];
}

const LanguageSelector = observer(
	({ state$, defSubset, subsets }: LanguageSelectorProps) => {
		// As we assume that defSubset is latin for ssr, we need
		// to update the default preview text if defSubset is not latin
		// on mount
		useMountOnce(() => {
			if (defSubset !== 'latin') {
				state$.preview.language.set(defSubset);
			}
		});

		const language = state$.preview.language.get();

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
				refine={state$.preview.language.set}
				w={284}
			/>
		);
	},
);

export { LanguageSelector };
