import { useSelector } from '@legendapp/state/react';
import { useEffect } from 'react';

import { DropdownSimple } from '@/components/Dropdown';
import { subsetToLanguage } from '@/utils/language/subsets';

import { previewState } from './observables';

interface LanguageSelectorProps {
	defSubset: string;
	subsets: string[];
}

const LanguageSelector = ({ defSubset, subsets }: LanguageSelectorProps) => {
	const language = useSelector(previewState.language);

	useEffect(() => {
		if (defSubset !== 'latin') {
			previewState.language.set(defSubset);
		}
	}, [defSubset]);

	const items = subsets.map((lang) => ({
		label: subsetToLanguage(lang),
		value: lang,
		isRefined: lang === language,
	}));

	return (
		<DropdownSimple
			label={subsetToLanguage(language)}
			items={items}
			refine={previewState.language.set}
			w={284}
		/>
	);
};

export { LanguageSelector };
