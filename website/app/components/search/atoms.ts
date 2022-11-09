import { atom } from 'jotai'

const sizeAtom = atom(32)

const previewLabelAtom = atom('Sentence')
const previewValueAtom = atom('Sphinx of black quartz, judge my vow.')
const previewInputViewAtom = atom('')
const previewTypingAtom = atom(
	null,
	// When user starts typing, clear the preview value and switch to custom label
	(_get, set, event: React.ChangeEvent<HTMLInputElement>) => {
		set(previewLabelAtom, 'Custom')
		set(previewValueAtom, event.currentTarget.value)
		set(previewInputViewAtom, event.currentTarget.value)
	})

// Creates an array of atoms, one each per checkbox
const dropdownAtomArr = (length: number) => Array.from({ length }, () => atom(false));
type DropdownState = ReturnType<typeof dropdownAtomArr>

// Adds or removes filter item on input
const filterBaseAtom = atom<string[]>([])
const filterAtom = atom(
	(get) => get(filterBaseAtom),
	(get, set, facet: string) => {
		const filterItems = get(filterBaseAtom)
		// If already includes, remove from array
		if (filterItems.includes(facet)) {
			set(filterBaseAtom, filterItems.filter((f) => f !== facet))
		} else {
			set(filterBaseAtom, [...filterItems, facet])
		}
	}
)

// Sorting atoms
// TODO: Add updater to create Algolia replicas for popular (download-stat-aggregator), latest and random
type SortValues = 'Most Popular' | 'Newest' | 'Name' | 'Random' 
const sortAtom = atom<SortValues>('Most Popular')
type DisplayValues = 'list' | 'grid'
const displayAtom = atom<DisplayValues>('grid')

export { displayAtom, dropdownAtomArr, filterAtom, filterBaseAtom, previewInputViewAtom, previewLabelAtom, previewTypingAtom, previewValueAtom, sizeAtom,sortAtom }
export type { DropdownState }

