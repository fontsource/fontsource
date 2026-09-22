import { describe, expect, it } from 'vitest';
import { currentProjectSnapshotSchema } from './model';

describe('saved font set', () => {
	it('deduplicates persisted families without clearing the set', () => {
		const result = currentProjectSnapshotSchema.parse([
			{ familyId: 'fraunces' },
			{ familyId: 'inter' },
			{ familyId: 'fraunces' },
		]);

		expect(result).toEqual([{ familyId: 'fraunces' }, { familyId: 'inter' }]);
	});
});
