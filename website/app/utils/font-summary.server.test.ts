import { describe, expect, it } from 'vitest';
import { getFontSummary } from './font-summary.server';

const metadata = { family: 'Example', category: 'sans-serif' } as const;

describe('font summaries', () => {
	it('uses complete category and designer facts', () => {
		expect(
			getFontSummary(
				{ family: 'Roboto', category: 'sans-serif' },
				'Christian Robertson, ParaType, Font Bureau',
			),
		).toBe(
			'Roboto is a sans-serif font by Christian Robertson, ParaType, Font Bureau.',
		);
	});

	it('omits missing or overly long designer lists', () => {
		expect(getFontSummary(metadata)).toBe('Example is a sans-serif font.');
		expect(getFontSummary(metadata, 'Designer, '.repeat(30))).toBe(
			'Example is a sans-serif font.',
		);
	});
});
