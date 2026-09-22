import { describe, expect, it } from 'vitest';
import { getFontSummary } from './font-summary.server';

const metadata = { family: 'Example', category: 'sans-serif' } as const;

describe('font search summaries', () => {
	it('keeps readable text and abbreviations without Markdown or link URLs', () => {
		expect(
			getFontSummary(
				metadata,
				'An **uppercase** font inspired by [U.S. currency](https://example.com). More history follows.',
			),
		).toBe('An uppercase font inspired by U.S. currency.');
	});

	it('uses structured facts when the opening sentence is too long', () => {
		expect(
			getFontSummary(metadata, `A ${'long story '.repeat(20)}.`, 'A Designer'),
		).toBe('Example is a sans-serif font by A Designer.');
	});

	it('handles missing prose and omits an overly long designer list', () => {
		expect(getFontSummary(metadata)).toBe('Example is a sans-serif font.');
		expect(getFontSummary(metadata, undefined, 'Designer, '.repeat(30))).toBe(
			'Example is a sans-serif font.',
		);
	});
});
