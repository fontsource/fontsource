import { describe, expect, it } from 'vitest';
import { createFontContext } from '../src/context';
import { inspectFont } from '../src/inspection';
import { buildFont } from '../src/processor';
import type { FontBuildConfig } from '../src/types';
import {
	loadStaticFontFixture,
	loadStaticWoff2Fixture,
	loadVariableFontFixture,
} from './font-fixture';

const build = async (
	config: FontBuildConfig,
	options?: Parameters<typeof buildFont>[2],
) => {
	const ctx = createFontContext();
	try {
		return await buildFont(ctx, config, options);
	} finally {
		ctx.destroy();
	}
};
const changeFontRevision = (font: Uint8Array): Uint8Array => {
	const changed = font.slice();
	const view = new DataView(
		changed.buffer,
		changed.byteOffset,
		changed.byteLength,
	);
	const tableCount = view.getUint16(4, false);

	for (let index = 0; index < tableCount; index++) {
		const recordOffset = 12 + index * 16;
		const tag = String.fromCharCode(
			changed[recordOffset] ?? 0,
			changed[recordOffset + 1] ?? 0,
			changed[recordOffset + 2] ?? 0,
			changed[recordOffset + 3] ?? 0,
		);
		if (tag !== 'head') continue;

		const tableOffset = view.getUint32(recordOffset + 8, false);
		const revisionOffset = tableOffset + 4;
		view.setUint32(
			revisionOffset,
			view.getUint32(revisionOffset, false) + 1,
			false,
		);
		return changed;
	}

	throw new Error('Font fixture does not contain a head table');
};

describe('buildFont integration with real fixtures', () => {
	it('preserves full coverage for compressed inputs and groups formats', async () => {
		const source = loadStaticWoff2Fixture();
		const result = await build(
			{
				family: 'Abel',
				characters: 'all',
				formats: ['woff2', 'woff'],
				targets: [{ type: 'static', source, weight: 400, style: 'normal' }],
			},
			{
				css: {
					display: 'block',
					resolver: ({ source }) => `/fonts/${source.filename}`,
				},
			},
		);
		const ctx = createFontContext();
		try {
			const original = await inspectFont(ctx, source);
			for (const font of result.fonts)
				expect((await inspectFont(ctx, font.content)).unicodeRanges).toEqual(
					original.unicodeRanges,
				);
		} finally {
			ctx.destroy();
		}
		expect(result.faces[0]?.unicodeRange).toBe('');
		expect(result.faces[0]?.sources).toHaveLength(2);
		expect(
			result.css.find((asset) => asset.filename === 'index.css')?.content,
		).toContain('font-display: block');
		expect(
			result.css.find((asset) => asset.filename === 'index.css')?.content,
		).toContain('url(/fonts/abel-full-400-normal.woff2)');
		expect(
			result.css.find((asset) => asset.filename === 'index.css')?.content,
		).not.toContain('unicode-range');
	});
	it('builds only explicit sparse static variants and removes variable axes', async () => {
		const source = loadVariableFontFixture();
		const result = await build({
			family: 'Recursive',
			characters: [{ subset: 'latin', codepoints: [32, 33, 34] }],
			targets: [
				{ type: 'static', source, weight: 400, style: 'normal' },
				{ type: 'static', source, weight: 700, style: 'italic' },
			],
		});
		expect(result.fonts.map((font) => font.filename)).toEqual([
			'files/recursive-latin-400-normal.woff2',
			'files/recursive-latin-700-italic.woff2',
		]);
		const ctx = createFontContext();
		try {
			for (const font of result.fonts)
				expect((await inspectFont(ctx, font.content)).axes).toEqual([]);
		} finally {
			ctx.destroy();
		}
	});
	it('keeps named subset imports separate from numbered aggregate slices', async () => {
		const source = loadStaticFontFixture();
		const result = await build({
			family: 'Abel',
			characters: [
				{ subset: 'latin', codepoints: [32, 33, 34] },
				{ subset: 'japanese', sliceIndex: 1, codepoints: [65] },
				{ subset: 'japanese', sliceIndex: 2, codepoints: [66] },
			],
			targets: [{ type: 'static', source, weight: 400, style: 'normal' }],
		});
		expect({
			css: result.css,
			faces: result.faces,
			files: result.fonts.map((font) => font.filename),
		}).toMatchSnapshot();
	});
	it('pins excluded axes and respects variable style selection', async () => {
		const source = loadVariableFontFixture();
		const axes = {
			wght: { min: 300, max: 1000 },
			slnt: { min: -15, max: 0 },
			CASL: { min: 0, max: 1 },
		};
		const result = await build({
			family: 'Recursive',
			characters: [{ subset: 'latin', codepoints: [32, 33, 34] }],
			targets: [
				{ type: 'variable', source, style: 'italic', axisKey: 'wght', axes },
				{ type: 'variable', source, style: 'normal', axisKey: 'full', axes },
			],
		});
		expect(
			result.faces.map((face) => ({
				style: face.style,
				axisKey: face.axisKey,
				weight: face.weight,
			})),
		).toMatchSnapshot();
		const ctx = createFontContext();
		try {
			expect(
				(await inspectFont(ctx, result.fonts[0].content)).axes.map(
					(axis) => axis.tag,
				),
			).toEqual(['wght']);
		} finally {
			ctx.destroy();
		}
	});
	it('deduplicates identical files and rejects distinct outputs at the same filename', async () => {
		const source = loadStaticFontFixture();
		const target = {
			type: 'static' as const,
			source,
			weight: 400,
			style: 'normal' as const,
		};
		const config = {
			family: 'Abel',
			characters: 'all' as const,
			targets: [target, target],
		};
		expect((await build(config)).fonts).toHaveLength(1);
		await expect(
			build({
				...config,
				targets: [target, { ...target, source: changeFontRevision(source) }],
			}),
		).rejects.toThrow('Multiple distinct fonts would be written');
	});
});
