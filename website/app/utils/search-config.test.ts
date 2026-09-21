import { observable } from '@legendapp/state';
import { assert, describe, expect, it } from 'vitest';
import { createPageSearchState, routing } from './search-config';

const stateMapping = () => {
	const mapping = routing(
		'https://fontsource.org/',
		observable(createPageSearchState()),
	).stateMapping;
	assert(mapping);
	return mapping;
};

describe('search route refinements', () => {
	it('omits inactive registry filters so hydration preserves the hits cache', () => {
		const mapping = stateMapping();
		const initialState = mapping.routeToState({});
		expect(initialState.prod_POPULAR.refinementList).toEqual({});
	});

	it('preserves selected registry filters through a URL round trip', () => {
		const mapping = stateMapping();
		const route = {
			classifications: 'sans-serif,display',
			languages: 'ja_Jpan,zh_Hant',
		};
		const state = mapping.routeToState(route);
		expect(state.prod_POPULAR.refinementList).toEqual({
			classifications: ['sans-serif', 'display'],
			languageIds: ['ja_Jpan', 'zh_Hant'],
		});
		expect(mapping.stateToRoute(state)).toMatchObject(route);
	});
});
