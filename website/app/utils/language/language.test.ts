import { describe, expect, it } from 'vitest';

import { getPreviewText } from './language';

describe('getPreviewText', () => {
	it('returns the preview for a known subset', () => {
		expect(getPreviewText('arabic')).toBe('الحب سماء لا تمطر غير الأحلام.');
	});

	it('shares previews between related subsets', () => {
		expect(getPreviewText('chinese-hongkong')).toBe(
			getPreviewText('chinese-traditional'),
		);
	});

	it('uses the Latin fallback for an unknown subset', () => {
		expect(getPreviewText('unknown')).toBe(
			'Sphinx of black quartz, judge my vow.',
		);
	});
});
