import { describe, expect, it } from 'vitest';

import { getPreviewText } from './language';

describe('getPreviewText', () => {
	it.each([
		'material-icons',
		'material-icons-outlined',
		'material-icons-round',
		'material-icons-sharp',
		'material-icons-two-tone',
		'material-symbols-outlined',
		'material-symbols-rounded',
		'material-symbols-sharp',
	])(
		'restores the original icon selection for %s without search-index samples',
		(id) => {
			expect(getPreviewText('latin', id)).toBe(
				id.startsWith('material-icons')
					? 'photo_camera thumb_up assignment create_new_folder insert_invitation drafts credit_card timer check_box close'
					: 'search settings home person add shopping_cart check_circle favorite logout trophy',
			);
		},
	);

	it('preserves the selected language for families without overrides', () => {
		expect(getPreviewText('latin', 'roboto')).toBe(getPreviewText('latin'));
		expect(getPreviewText('arabic', 'noto-sans-arabic')).toBe(
			getPreviewText('arabic'),
		);
	});

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
