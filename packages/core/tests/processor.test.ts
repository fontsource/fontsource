import { describe, expect, it } from 'vitest';
import { createFontContext } from '../src/context';
import { inspectFont } from '../src/inspection';
import { buildFont } from '../src/processor';
import type { FontBuildConfig, FontBuildResult } from '../src/types';
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
// Snapshot public output without embedding compressed binary bytes.
const packageOutput = (result: FontBuildResult) => ({
	css: result.css,
	faces: result.faces,
	entrypoints: result.entrypoints,
	files: result.fonts.map(({ filename, format }) => ({ filename, format })),
});
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
		expect(packageOutput(result)).toMatchSnapshot();
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
		expect(packageOutput(result)).toMatchSnapshot();
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
				{ subset: 'latin', codepoints: [32, 33, 34, 0x10ffff] },
				{ subset: 'missing', codepoints: [0x10ffff] },
				{ subset: 'japanese', codepoints: [65, 66] },
				{ subset: 'japanese', sliceIndex: 1, codepoints: [65] },
				{ subset: 'japanese', sliceIndex: 2, codepoints: [66] },
			],
			targets: [{ type: 'static', source, weight: 400, style: 'normal' }],
		});
		expect(packageOutput(result)).toMatchSnapshot();
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
		expect(packageOutput(result)).toMatchSnapshot();
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
		expect(packageOutput(await build(config))).toMatchSnapshot();
		await expect(
			build({
				...config,
				targets: [target, { ...target, source: changeFontRevision(source) }],
			}),
		).rejects.toThrow('Multiple distinct fonts would be written');
	});
});
