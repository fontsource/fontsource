import { describe, expect, it } from 'vitest';

import { bucketPath } from '../src/util';

describe('util', () => {
	it('should generate valid bucket path', () => {
		const path = bucketPath({
			id: 'roboto',
			subset: 'latin',
			weight: 400,
			style: 'normal',
			extension: 'woff2',
			version: '5.0.0',
		});

		expect(path).toBe('roboto@5.0.0/latin-400-normal.woff2');
	});
});
