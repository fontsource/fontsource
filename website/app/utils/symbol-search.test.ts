import { describe, expect, it } from 'vitest';

import { createSymbolSearch, searchSymbolCatalog } from './symbol-search';

const symbols = [
	{ name: 'arrow_forward', codepoint: 0xe5c8 },
	{ name: 'forward_to_inbox', codepoint: 0xf187 },
	{ name: 'calendar_month', codepoint: 0xebcc },
	{ name: 'home', codepoint: 0xe88a },
];

const getNames = (results: string[]) =>
	results.map((result) => result.split('\u0000', 1)[0]);

describe('symbol search', () => {
	it('ranks direct name matches before broader results', () => {
		const results = getNames(
			searchSymbolCatalog(createSymbolSearch(symbols), 'arrow forward'),
		);

		expect(results[0]).toBe('arrow_forward');
	});

	it('finds symbol names with small typing errors', () => {
		const results = getNames(
			searchSymbolCatalog(createSymbolSearch(symbols), 'calender'),
		);

		expect(results).toContain('calendar_month');
	});

	it('requires every word in a multi-word search', () => {
		const results = getNames(
			searchSymbolCatalog(createSymbolSearch(symbols), 'forward arow'),
		);

		expect(results).toEqual(['arrow_forward']);
	});

	it('keeps short searches precise', () => {
		const results = getNames(
			searchSymbolCatalog(createSymbolSearch(symbols), 'ho'),
		);

		expect(results).toEqual(['home']);
	});

	it('matches code points without fuzzy hexadecimal results', () => {
		const results = getNames(
			searchSymbolCatalog(createSymbolSearch(symbols), 'U+E5C8'),
		);

		expect(results).toEqual(['arrow_forward']);
	});

	it('does not mistake symbol names made of hex letters for code points', () => {
		const index = createSymbolSearch([
			...symbols,
			{ name: 'face', codepoint: 0xe87c },
		]);

		expect(getNames(searchSymbolCatalog(index, 'face'))[0]).toBe('face');
	});
});
