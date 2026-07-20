import { describe, expect, it } from 'vitest';

import { getDiscoveryPages } from './discovery';

const counts = {
	subsets: {
		arabic: 10,
		latin: 2000,
		malayalam: 9,
		math: 77,
	},
	categories: {
		icons: 8,
		other: 17,
		serif: 10,
	},
	variable: 10,
};

describe('discovery pages', () => {
	it('publishes useful catalog views only when they have ten families', () => {
		expect(getDiscoveryPages(counts).map((page) => page.path)).toEqual([
			'/languages/arabic',
			'/categories/serif',
			'/variable-fonts',
		]);
	});
});
