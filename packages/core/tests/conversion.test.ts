import { describe, expect, it } from 'vitest';
import {
	convertFont,
	createFontContext,
	inspectFont,
	UnsupportedCffToTtfError,
} from '../src';
import {
	loadCffFontFixture,
	loadStaticFontFixture,
	loadVariableFontFixture,
} from './font-fixture';

const getHeader = (bytes: Uint8Array, length = 4): string =>
	Array.from(bytes.slice(0, length))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');

describe('convertFont smoke tests', () => {
	it.each([
		['static', loadStaticFontFixture],
		['variable', loadVariableFontFixture],
	] as const)(
		'preserves full %s font coverage, features, and axes in WOFF2',
		async (_name, loadFixture) => {
			const source = loadFixture();
			const ctx = createFontContext();
			try {
				const before = await inspectFont(ctx, source);
				const [compressed] = await convertFont(
					ctx,
					source,
					['woff2'],
					'preview.ttf',
				);
				expect(await inspectFont(ctx, compressed.data)).toEqual(before);
				expect(compressed.data.byteLength).toBeLessThan(source.byteLength);
			} finally {
				ctx.destroy();
			}
		},
		30_000,
	);

	it('converts a TTF fixture into multiple output formats', async () => {
		const buffer = loadStaticFontFixture();

		const ctx = createFontContext();

		try {
			const results = await convertFont(
				ctx,
				buffer,
				['woff2', 'woff', 'ttf'],
				'custom-name.ttf',
			);

			expect(
				results.map((result) => ({
					filename: result.filename,
					format: result.format,
					size: result.data.length,
					header: getHeader(result.data),
				})),
			).toMatchSnapshot();

			expect(
				results.find((result) => result.format === 'woff2')?.data,
			).toBeTruthy();
			expect(
				results.find((result) => result.format === 'woff')?.data,
			).toBeTruthy();
			expect(
				results.find((result) => result.format === 'ttf')?.data,
			).toBeTruthy();
			expect(
				Buffer.compare(
					Buffer.from(results.find((result) => result.format === 'ttf')?.data),
					Buffer.from(buffer),
				),
			).toBe(0);
		} finally {
			ctx.destroy();
		}
	});

	it('can round-trip from compressed input and derive the basename from font metadata', async () => {
		const buffer = loadStaticFontFixture();

		const ctx = createFontContext();

		try {
			const [compressed] = await convertFont(
				ctx,
				buffer,
				['woff2'],
				'fixture.ttf',
			);
			const [roundTripped] = await convertFont(ctx, compressed.data, ['woff2']);

			expect({
				compressed: {
					filename: compressed.filename,
					format: compressed.format,
					header: getHeader(compressed.data),
				},
				roundTripped: {
					filename: roundTripped.filename,
					format: roundTripped.format,
					header: getHeader(roundTripped.data),
				},
			}).toMatchSnapshot();

			expect(roundTripped.filename).not.toBe('font.woff2');
			expect(roundTripped.data.length).toBeGreaterThan(0);
		} finally {
			ctx.destroy();
		}
	});

	it('preserves CFF outlines in WOFF and rejects TTF output', async () => {
		const ctx = createFontContext();
		try {
			const source = loadCffFontFixture();
			await expect(
				convertFont(ctx, source, ['ttf'], 'synthetic-cff.otf'),
			).rejects.toThrow(UnsupportedCffToTtfError);
			const [woff] = await convertFont(
				ctx,
				source,
				['woff'],
				'synthetic-cff.otf',
			);
			expect((await inspectFont(ctx, woff.data)).tables).toContain('CFF ');
		} finally {
			ctx.destroy();
		}
	});
});
