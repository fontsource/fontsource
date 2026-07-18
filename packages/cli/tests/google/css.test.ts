import { describe, expect, it } from 'vitest';

import { generateVariableCSS } from '../../src/google/css';

describe('generate variable css', () => {
	it('uses the full bundle as the default for multiple custom axes', () => {
		const css = generateVariableCSS(
			{
				id: 'sixtyfour',
				family: 'Sixtyfour',
				styles: ['normal'],
				weights: [400],
				subsets: ['latin'],
				unicodeRange: { latin: 'U+0000-00FF' },
				variants: {
					400: {
						normal: {
							latin: { url: { woff2: 'fixture.woff2' } },
						},
					},
				},
			},
			{
				axes: {
					BLED: { default: '0', min: '0', max: '100', step: '1' },
					SCAN: { default: '0', min: '-53', max: '100', step: '1' },
				},
				variants: {
					BLED: { normal: { latin: 'fixture.woff2' } },
					SCAN: { normal: { latin: 'fixture.woff2' } },
					full: { normal: { latin: 'fixture.woff2' } },
				},
			},
			(id, subset, axes, style) =>
				`./files/${id}-${subset}-${axes}-${style}.woff2`,
		);

		const index = css.find(({ filename }) => filename === 'index.css');
		const full = css.find(({ filename }) => filename === 'full.css');

		expect(index?.css).toBe(full?.css);
		expect(index?.css).toContain('sixtyfour-latin-full-normal.woff2');
	});

	it('uses the sole axis bundle as the default for a single custom axis', () => {
		const css = generateVariableCSS(
			{
				id: 'recursive',
				family: 'Recursive',
				styles: ['normal'],
				weights: [400],
				subsets: ['latin'],
				unicodeRange: { latin: 'U+0000-00FF' },
				variants: {
					400: {
						normal: {
							latin: { url: { woff2: 'fixture.woff2' } },
						},
					},
				},
			},
			{
				axes: {
					MONO: { default: '0', min: '0', max: '1', step: '1' },
				},
				variants: {
					MONO: { normal: { latin: 'fixture.woff2' } },
				},
			},
			(id, subset, axes, style) =>
				`./files/${id}-${subset}-${axes}-${style}.woff2`,
		);

		const index = css.find(({ filename }) => filename === 'index.css');
		const mono = css.find(({ filename }) => filename === 'mono.css');

		expect(index?.css).toBe(mono?.css);
		expect(index?.css).toContain('recursive-latin-mono-normal.woff2');
	});

	it('falls back to the italic bundle when only italic styles exist', () => {
		const css = generateVariableCSS(
			{
				id: 'molle',
				family: 'Molle',
				styles: ['italic'],
				weights: [400],
				subsets: ['latin'],
				unicodeRange: { latin: 'U+0000-00FF' },
				variants: {
					400: {
						italic: {
							latin: { url: { woff2: 'fixture.woff2' } },
						},
					},
				},
			},
			{
				axes: {
					slnt: { default: '0', min: '-15', max: '0', step: '1' },
				},
				variants: {
					slnt: { italic: { latin: 'fixture.woff2' } },
				},
			},
			(id, subset, axes, style) =>
				`./files/${id}-${subset}-${axes}-${style}.woff2`,
		);

		const index = css.find(({ filename }) => filename === 'index.css');
		const slntItalic = css.find(
			({ filename }) => filename === 'slnt-italic.css',
		);

		expect(index?.css).toBe(slntItalic?.css);
		expect(index?.css).toContain('molle-latin-slnt-italic.woff2');
	});
});
