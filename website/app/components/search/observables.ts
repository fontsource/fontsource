import type { ObservableObject } from '@legendapp/state';

import { previewText } from '../../utils/preview-text';

interface SearchObject {
	size: number;
	collectionId: string | null;
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
	collectionId: null,
	preview: {
		presetLabel: previewText.search.default.label,
		presetValue: previewText.search.default.value,
		customValue: '',
	},
	language: 'latin',
	display: 'grid',
});

export { createSearchState, type SearchState };
