import { atom } from 'jotai';

const sizeAtom = atom(32);

const previewLabelAtom = atom('Sentence');
const previewValueAtom = atom('Sphinx of black quartz, judge my vow.');
const previewInputViewAtom = atom('');
const previewTypingAtom = atom(
	null,
	// When user starts typing, clear the preview value and switch to custom label
	(_get, set, event: React.ChangeEvent<HTMLInputElement>) => {
		set(previewLabelAtom, 'Custom');
		set(previewValueAtom, event.currentTarget.value);
		set(previewInputViewAtom, event.currentTarget.value);
	}
);

// Adds or removes filter item on input
interface FilterState {
	variable?: boolean;
	subset?: string;
	category?: string;
}

const filterBaseAtom = atom<FilterState>({});
const filterAtom = atom(
	(get) => {
		const filterItems = get(filterBaseAtom);
		let filterArr = [];
		if (filterItems.variable) {
			filterArr.push('variable:true');
		}
		if (filterItems.subset) {
			filterArr.push(filterItems.subset);
		}
		if (filterItems.category) {
			filterArr.push(filterItems.category);
		}

		return filterArr.join(' AND ');
	 },
	(get, set, facet: string) => {
		const filterItems = get(filterBaseAtom);

		if (facet === 'variable:true') {
			if (filterItems.variable) {
				set(filterBaseAtom, { ...filterItems, variable: false });
			}
			else {
				set(filterBaseAtom, { ...filterItems, variable: true });
			}
		}

		if (facet.startsWith('subsets:')) {
			if (filterItems.subset === facet) {
				set(filterBaseAtom, { ...filterItems, subset: undefined });
			} else {
				set(filterBaseAtom, { ...filterItems, subset: facet });
			}
		}

		if (facet.startsWith('category:')) {
			if (filterItems.category === facet) {
				set(filterBaseAtom, { ...filterItems, category: undefined });
			} else {
				set(filterBaseAtom, { ...filterItems, category: facet });
			}
		}
	}
);

// Sorting atoms
type SortValues = 'Most Popular' | 'Last Updated' | 'Name' | 'Random';
const sortAtom = atom<SortValues>('Most Popular');
type DisplayValues = 'list' | 'grid';
const displayAtom = atom<DisplayValues>('grid');

export {
	displayAtom,
	filterAtom,
	filterBaseAtom,
	previewInputViewAtom,
	previewLabelAtom,
	previewTypingAtom,
	previewValueAtom,
	sizeAtom,
	sortAtom,
};
