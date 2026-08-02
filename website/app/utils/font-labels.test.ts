import { describe, expect, it } from 'vitest';

import { getScriptLabel } from './font-labels';

describe('getScriptLabel', () => {
	it('turns ISO script codes into names people can recognize', () => {
		expect(getScriptLabel('Latn')).toBe('Latin');
		expect(getScriptLabel('Cyrl')).toBe('Cyrillic');
		expect(getScriptLabel('Jpan')).toBe('Japanese');
	});
});
