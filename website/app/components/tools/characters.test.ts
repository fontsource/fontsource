import { readFileSync } from 'node:fs';
import {
	buildFont,
	createFontContext,
	inspectFont,
} from '@fontsource-utils/core';
import { describe, expect, it } from 'vitest';
import { hasCharacter, resolveCharacters } from './characters';

describe('optimizer character selection', () => {
	it('builds a smaller font from exact text with matching CSS', async () => {
		const ctx = createFontContext();
		try {
			const source = new Uint8Array(
				readFileSync(
					new URL(
						'../../../../packages/core/tests/fixtures/fonts/abel-latin-400-normal.woff2',
						import.meta.url,
					),
				),
			);
			const { characters } = await resolveCharacters({
				mode: 'text',
				subsets: [],
				text: 'Abba é',
			});
			const result = await buildFont(ctx, [source], {
				family: 'Abel',
				type: 'static',
				characters,
				formats: ['woff2'],
			});
			expect(result.fonts).toHaveLength(1);
			const font = result.fonts[0];
			expect(font.content.length).toBeLessThan(source.length);
			const inspected = await inspectFont(ctx, font.content);
			for (const character of 'Abba é')
				expect(hasCharacter(inspected, character.codePointAt(0) ?? 0)).toBe(
					true,
				);
			expect(hasCharacter(inspected, 90)).toBe(false);
			expect(
				result.css.find((file) => file.filename === 'index.css')?.content,
			).toContain(font.filename);
		} finally {
			ctx.destroy();
		}
	});

	it('unions existing character sets and preserves full variable axes', async () => {
		const ctx = createFontContext();
		try {
			const source = new Uint8Array(
				readFileSync(
					new URL(
						'../../../../packages/core/tests/fixtures/fonts/recursive-latin-full-normal.ttf',
						import.meta.url,
					),
				),
			);
			const { characters, codepoints } = await resolveCharacters({
				mode: 'subsets',
				subsets: ['latin', 'greek'],
				text: '',
			});
			expect(codepoints).toContain(65);
			expect(codepoints).toContain(0x391);
			expect(new Set(codepoints).size).toBe(codepoints.length);
			const result = await buildFont(ctx, [source], {
				family: 'Recursive',
				type: 'variable',
				axisKeys: ['full'],
				characters,
				formats: ['woff2'],
			});
			expect(result.fonts).toHaveLength(1);
			expect((await inspectFont(ctx, result.fonts[0].content)).axes).toEqual(
				(await inspectFont(ctx, source)).axes,
			);
		} finally {
			ctx.destroy();
		}
	});

	it('retains supplementary and combining characters and rejects empty selections', async () => {
		expect(
			(
				await resolveCharacters({
					mode: 'text',
					subsets: [],
					text: 'A😀e\u0301A\n',
				})
			).codepoints,
		).toEqual([65, 101, 769, 0x1f600]);
		await expect(
			resolveCharacters({ mode: 'text', subsets: [], text: ' \n' }),
		).rejects.toThrow('Enter the text');
		await expect(
			resolveCharacters({ mode: 'subsets', subsets: [], text: '' }),
		).rejects.toThrow('Choose at least one');
		expect(
			(await resolveCharacters({ mode: 'all', subsets: [], text: '' }))
				.characters,
		).toBe('all');
	});
});
