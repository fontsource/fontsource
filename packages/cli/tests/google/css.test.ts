import { describe, expect, it } from 'vitest';

import {
	generateIconStaticCSS,
	generateV1CSS,
	generateV2CSS,
	generateVariableCSS,
} from '../../src/google/css';

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
							latin: { url: { woff2: 'https://example.com/fixture.woff2' } },
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
					BLED: { normal: { latin: 'https://example.com/fixture.woff2' } },
					SCAN: { normal: { latin: 'https://example.com/fixture.woff2' } },
					full: { normal: { latin: 'https://example.com/fixture.woff2' } },
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
							latin: { url: { woff2: 'https://example.com/fixture.woff2' } },
						},
					},
				},
			},
			{
				axes: {
					MONO: { default: '0', min: '0', max: '1', step: '1' },
				},
				variants: {
					MONO: { normal: { latin: 'https://example.com/fixture.woff2' } },
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
							latin: { url: { woff2: 'https://example.com/fixture.woff2' } },
						},
					},
				},
			},
			{
				axes: {
					slnt: { default: '0', min: '-15', max: '0', step: '1' },
				},
				variants: {
					slnt: { italic: { latin: 'https://example.com/fixture.woff2' } },
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

describe('actual static variants', () => {
	const metadata = {
		id: 'example',
		family: 'Example',
		styles: ['normal', 'italic'],
		weights: [300, 400],
		subsets: ['latin', 'cyrillic'],
		unicodeRange: { latin: 'U+0000-00FF', '[0]': 'U+0100-017F' },
		variants: {
			300: {
				normal: {
					latin: { url: { woff2: 'https://example.com/light.woff2' } },
				},
			},
			400: {
				normal: {
					latin: {
						url: {
							woff2: 'https://example.com/regular.woff2',
							woff: 'https://example.com/regular.woff',
						},
					},
				},
				italic: {
					'[0]': {
						url: {
							woff2: 'https://example.com/italic.woff2',
							woff: 'not available',
						},
					},
				},
			},
		},
	};
	const path = (
		id: string,
		subset: string,
		weight: string,
		style: string,
		extension: string,
	) => `./files/${id}-${subset}-${weight}-${style}.${extension}`;
	it('renders only available subsets and formats with their coverage', () => {
		expect(generateV2CSS(metadata, path)).toMatchSnapshot();
	});
	it('keeps legacy subset entrypoints unrestricted', () => {
		expect(generateV1CSS(metadata, path)).toMatchSnapshot();
	});
	it('keeps faces unrestricted when upstream provides no ranges', () => {
		expect(
			generateV2CSS({ ...metadata, unicodeRange: {} }, path),
		).toMatchSnapshot();
	});
	it('emits icon entrypoints once and selects only the default face', () => {
		expect(generateIconStaticCSS(metadata, path)).toMatchSnapshot();
	});
});

it('prefers a normal variable entrypoint even when italic is listed first', () => {
	expect(
		generateVariableCSS(
			{
				id: 'variable',
				family: 'Variable Example',
				weights: [400],
				styles: ['italic', 'normal'],
				subsets: ['latin'],
				variants: {},
				unicodeRange: { latin: 'U+0000-00FF' },
			},
			{
				axes: {
					wght: { min: '100', max: '900', default: '400', step: '1' },
					ital: { min: '0', max: '1', default: '0', step: '1' },
				},
				variants: {
					wght: {
						italic: { latin: 'https://example.com/italic.woff2' },
						normal: {
							latin: 'https://example.com/normal.woff2',
							fallback: 'https://example.com/fallback.woff2',
						},
					},
				},
			},
			(id, subset, axis, style) =>
				`./files/${id}-${subset}-${axis}-${style}.woff2`,
		),
	).toMatchSnapshot();
});
