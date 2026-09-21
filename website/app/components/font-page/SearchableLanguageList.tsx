import type { ListRegistryLanguagesResponse } from '@/generated/api';
import { getScriptLabel } from '@/utils/font-labels';
import { normalizeSearchValue } from '@/utils/search';
import { SearchableMetadataList } from './SearchableMetadataList';
import classes from './SearchableMetadataList.module.css';

interface SearchableLanguageListProps {
	familyId: string;
	languages: ListRegistryLanguagesResponse;
}

const searchThreshold = 12;

type Language = ListRegistryLanguagesResponse[number];

const getLanguageSearchText = (language: Language) =>
	[
		language.id,
		language.name,
		language.preferredName,
		language.autonym,
		language.script,
		getScriptLabel(language.script),
	]
		.filter(Boolean)
		.join(' ');

const renderLanguage = (language: Language) => {
	const displayName = language.preferredName ?? language.name;
	const scriptLabel = getScriptLabel(language.script);
	const autonym =
		language.autonym && language.autonym !== displayName
			? language.autonym
			: undefined;
	const showScript = !normalizeSearchValue(displayName).includes(
		normalizeSearchValue(scriptLabel),
	);
	const details = [autonym, showScript ? scriptLabel : undefined].filter(
		(value): value is string => Boolean(value),
	);

	return (
		<>
			<strong>{displayName}</strong>
			{details.length > 0 && <span>{details.join(' · ')}</span>}
		</>
	);
};

const SearchableLanguageList = ({
	familyId,
	languages,
}: SearchableLanguageListProps) => (
	<SearchableMetadataList
		emptyLabel="No supported languages match"
		getKey={(language) => language.id}
		getSearchText={getLanguageSearchText}
		itemName={{ singular: 'language', plural: 'languages' }}
		items={[...languages].sort((a, b) =>
			(a.preferredName ?? a.name).localeCompare(
				b.preferredName ?? b.name,
				'en',
			),
		)}
		listClassName={classes.languageList}
		listId={`language-list-${familyId}`}
		renderItem={renderLanguage}
		searchLabel="Search supported languages"
		searchId={`language-search-${familyId}`}
		searchThreshold={searchThreshold}
	/>
);

export { SearchableLanguageList };
