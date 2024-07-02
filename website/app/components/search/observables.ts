import type { ObservableObject } from '@legendapp/state';

interface SearchObject {
	size: number;
	preview: {
		label: string;
		value: string;
		inputView: string;
	};
	language: string;
	display: 'list' | 'grid';
}

type SearchState = ObservableObject<SearchObject>;

export type { SearchObject, SearchState };
