import { useSelector } from '@legendapp/state/react';
import { useFetcher } from '@remix-run/react';
import { useEffect } from 'react';

import { Dropdown, DropdownItem } from '@/components';
import { subsetsMap } from '@/utils/language/subsets';

import { previewState } from './observables';

interface LanguageSelectorProps {
	subsets: string[];
}

const LanguageSelector = ({ subsets }: LanguageSelectorProps) => {
	const language = useSelector(previewState.language);
	const languageFetcher = useFetcher();

	const handleLanguage = (value: string) => {
		previewState.language.set(
			subsetsMap[value as keyof typeof subsetsMap] ?? value
		);
		languageFetcher.submit(
			{ subset: value },
			{
				method: 'POST',
				action: '/actions/language',
			}
		);
	};

	useEffect(() => {
		if (languageFetcher.state === 'idle' && languageFetcher.data?.text) {
			previewState.text.set(languageFetcher.data.text);
		}
	}, [languageFetcher]);

	return (
		<Dropdown label={language} width={284} capitalize>
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
