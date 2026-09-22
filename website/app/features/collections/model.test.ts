import { describe, expect, it } from 'vitest';
import { collectionsSnapshotSchema } from './model';

describe('saved collections', () => {
	it('rejects the reserved Favorites collection name', () => {
		const result = collectionsSnapshotSchema.safeParse({
			favoriteFontIds: [],
			collections: [
				{
					id: 'duplicate',
					name: ' favorites ',
					fontIds: [],
				},
			],
			fontCache: {},
		});

		expect(result.success).toBe(false);
	});

	it('rejects duplicate persisted collection and font IDs', () => {
		const duplicateCollectionIds = collectionsSnapshotSchema.safeParse({
			favoriteFontIds: [],
			collections: [
				{ id: 'review', name: 'Review', fontIds: [] },
				{ id: 'review', name: 'Later', fontIds: [] },
			],
			fontCache: {},
		});
		const duplicateFontIds = collectionsSnapshotSchema.safeParse({
			favoriteFontIds: ['inter', 'inter'],
			collections: [],
			fontCache: { inter: { family: 'Inter' } },
		});

		expect(duplicateCollectionIds.success).toBe(false);
		expect(duplicateFontIds.success).toBe(false);
	});
});
