import { expect, it, vi } from 'vitest';
import { loadDiscoveryData } from './discovery.server';

vi.mock('@/generated/api', () => ({
	listFontValues: vi.fn(async (query: Record<string, string>) =>
		Object.fromEntries(
			Array.from({ length: 9 }, (_, id) => [
				String(id),
				query.category === ''
					? 'serif'
					: query.variable === ''
						? false
						: ['latin'],
			]),
		),
	),
	listRegistryFamilies: vi.fn().mockResolvedValue(
		Array.from({ length: 10 }, (_, id) => ({
			id: String(id),
			classifications: ['serif'],
			tags: ['serif/modern'],
		})),
	),
	getRegistryTaxonomy: vi.fn().mockResolvedValue({
		classifications: { serif: { label: 'Serif' } },
		tags: { 'serif/modern': { label: 'Modern' } },
		tagGroups: { serif: { label: 'Serif' } },
	}),
}));

it('does not count unpublished registry families toward discovery indexing', async () => {
	const { pages } = await loadDiscoveryData();
	expect(pages).toEqual([
		expect.objectContaining({
			path: '/tags/serif/modern',
			count: 9,
			indexable: false,
		}),
		expect.objectContaining({
			path: '/categories/serif',
			count: 9,
			indexable: false,
		}),
	]);
});
