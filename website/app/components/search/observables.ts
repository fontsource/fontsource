import type { ObservableObject } from '@legendapp/state';

interface SearchObject {
	size: number;
	preview: {
		presetLabel: string;
		presetValue: string;
		customValue: string;
	};
	language: string;
	display: 'list' | 'grid';
}

type SearchState = ObservableObject<SearchObject>;

const createSearchState = (): SearchObject => ({
	size: 32,
	preview: {
		presetLabel: 'Sentence',
		presetValue: 'Sphinx of black quartz, judge my vow.',
		customValue: '',
	},
	language: 'latin',
	display: 'grid',
});

export { createSearchState, type SearchState };
