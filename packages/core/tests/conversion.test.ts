import { describe, expect, it } from 'vitest';
import { convertFont, createFontContext } from '../src';
import { loadStaticFontFixture } from './font-fixture';

const getHeader = (bytes: Uint8Array, length = 4): string =>
	Array.from(bytes.slice(0, length))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');

describe('convertFont smoke tests', () => {
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
});
