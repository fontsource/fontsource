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
	classifications: { serif: 11, 'slab-serif': 2 },
	tags: { 'sans/geometric': 12, 'slab/geometric': 2, 'unknown/tag': 30 },
	variable: 10,
};

const taxonomy = {
	classifications: {
		serif: { label: 'Serif' },
		'slab-serif': { label: 'Slab Serif' },
		symbols: { label: 'Symbols' },
	},
	tags: {
		'sans/geometric': { label: 'Geometric' },
		'slab/geometric': { label: 'Geometric' },
		'theme/blackletter': { label: 'Blackletter' },
	},
	tagGroups: {
		sans: { label: 'Sans Serif' },
		slab: { label: 'Slab Serif' },
		theme: { label: 'Theme' },
	},
};

describe('discovery pages', () => {
	it('publishes populated taxonomy pages while retaining language thresholds', () => {
		expect(
			getDiscoveryPages(counts, taxonomy).map((page) => page.path),
		).toEqual([
			'/languages/arabic',
			'/tags/sans/geometric',
			'/tags/slab/geometric',
			'/categories/icons',
			'/categories/serif',
			'/categories/slab-serif',
			'/variable-fonts',
		]);
	});

	it('keeps sparse taxonomy pages available and distinguishes identical tag labels', () => {
		const pages = getDiscoveryPages(counts, taxonomy);
		expect(
			pages.find((page) => page.path === '/tags/slab/geometric'),
		).toMatchObject({
			heading: 'Geometric Slab Serif Fonts',
			count: 2,
			routeState: { tags: 'slab/geometric' },
		});
		expect(
			pages.find((page) => page.path === '/tags/sans/geometric'),
		).toMatchObject({
			heading: 'Geometric Sans Serif Fonts',
			count: 12,
			routeState: { tags: 'sans/geometric' },
		});
		expect(
			pages.find((page) => page.path === '/categories/slab-serif'),
		).toMatchObject({ count: 2 });
		expect(pages.map((page) => page.path)).not.toEqual(
			expect.arrayContaining(['/tags/unknown/tag']),
		);
		expect(
			pages.find((page) => page.path === '/tags/theme/blackletter'),
		).toBeUndefined();
		expect(
			pages.find((page) => page.path === '/categories/symbols'),
		).toBeUndefined();
	});

	it('uses classification counts and filters while preserving the legacy icons category', () => {
		const pages = getDiscoveryPages(counts, taxonomy);
		expect(
			pages.find((page) => page.path === '/categories/serif'),
		).toMatchObject({ count: 11, routeState: { classifications: 'serif' } });
		expect(
			pages.find((page) => page.path === '/categories/icons'),
		).toMatchObject({ count: 8, routeState: { category: 'icons' } });
	});
});
