import { observable, observe } from '@legendapp/state';

import type { subsetsMap } from '@/utils/language/subsets';

// Primitives
export const size = observable(32);
export const variable = observable(false);

type Language = keyof typeof subsetsMap | '';
export const language = observable<Language>('');

export const categoriesMap = {
	serif: 'Serif',
	'sans-serif': 'Sans Serif',
	display: 'Display',
	handwriting: 'Handwriting',
	monospace: 'Monospace',
	icons: 'Icons',
	other: 'Other',
};

type Category = keyof typeof categoriesMap | '';
export const category = observable<Category>('');

// Text preview
export const previewLabel = observable('Sentence');
export const previewValue = observable('Sphinx of black quartz, judge my vow.');
export const previewInputView = observable('');

previewInputView.onChange((e) => {
	if (e.value !== '') {
		previewLabel.set('Custom');
		previewValue.set(e.value ?? '');
	}
});

// Filtering
export const filter = observable('');

// Update filter string when any of the filter observables change
observe(() => {
	const filterString = [
		variable.get() ? 'variable:true' : '',
		language.get() ? `subsets:${language.get()}` : '',
		category.get() ? `category:${category.get()}` : '',
	]
		.filter((x) => x !== '')
		.join(' AND ');
	filter.set(filterString);
});

// Sorting and display
type SortValues = 'Most Popular' | 'Last Updated' | 'Name' | 'Random';
export const sort = observable<SortValues>('Most Popular');

type DisplayValues = 'list' | 'grid';
export const display = observable<DisplayValues>('grid');
