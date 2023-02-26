import { describe, expect, it } from 'vitest';

import { getHeadCommit } from '../../src/utils/git';

describe('git utils', () => {
	it('gets head commit', async () => {
		const headCommit = await getHeadCommit();
		expect(headCommit.length).toEqual(40);
	});


});
