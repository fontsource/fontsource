import fs from 'fs-extra';
import { describe, expect, it, vi } from 'vitest';

import { mergeFlags } from '../src/utils';

vi.mock('fs-extra');

describe('utils', () => {
	vi.mocked(fs.readJSON).mockResolvedValue({
		packages: ['./packages/'],
		commitMessage: 'chore: release new versions',
	});

	it('merges flags correctly', async () => {
		const result = await mergeFlags({
			yes: true,
		});

		expect(result).toEqual({
			packages: ['./packages/'],
			commitMessage: 'chore: release new versions',
			yes: true,
		});
	});
});
