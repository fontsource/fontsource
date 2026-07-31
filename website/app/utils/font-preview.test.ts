import { describe, expect, it } from 'vitest';

import { getFontFamilyStack } from './font-preview';

describe('getFontFamilyStack', () => {
	it('uses the static family when variable metadata is unavailable', () => {
		const metadata = {
			id: 'fraunces',
			family: 'Fraunces',
			variable: true,
		};

		expect(getFontFamilyStack(metadata, false)).toBe(
			'"Fraunces", "Fallback Outline"',
		);
		expect(getFontFamilyStack(metadata, true)).toBe(
			'"Fraunces Variable", "Fallback Outline"',
		);
	});
});
