import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildFont, createFontContext } from '@fontsource-utils/core';
import { compileString } from 'sass';
import { expect, it } from 'vitest';
import { packageSass } from '../../src/registry/sass';

it.each(['full', 'standard'])(
	'selects the normal %s bundle while retaining its oblique CSS range',
	async (selectedAxis) => {
		const source = await readFile(
			new URL(
				'../../../core/tests/fixtures/fonts/recursive-latin-full-normal.ttf',
				import.meta.url,
			),
		);
		const context = createFontContext();
		try {
			const result = await buildFont(context, {
				id: 'recursive',
				family: 'Recursive',
				characters: [{ subset: 'latin', codepoints: [65] }],
				targets: ['wght', selectedAxis].map((axisKey) => ({
					type: 'variable',
					source,
					style: 'normal',
					axisKey,
					axes: {
						wght: { min: 400, max: 700 },
						CASL: { min: 0, max: 1 },
						slnt: { min: -15, max: 0 },
					},
				})),
			});
			const mixins = fileURLToPath(
				new URL('../../../scss/src', import.meta.url),
			);
			const css = compileString(
				`
			@use 'mixins' as fontsource;
			${packageSass('recursive', 'Recursive', result, true)}
			@include fontsource.faces($metadata: $metadata, $directory: '/fonts', $styles: normal, $axes: ${selectedAxis});
		`,
				{ loadPaths: [mixins] },
			).css;
			expect(css.match(/@font-face/g)).toHaveLength(1);
			expect(css).toContain('font-family: "Recursive Variable"');
			expect(css).toContain('font-weight: 400 700');
			expect(css).toContain('font-style: oblique 0deg 15deg');
			expect(css).toContain('unicode-range: U+41');
			expect(css).toContain(
				`url("/fonts/recursive-latin-${selectedAxis}-normal.woff2") format("woff2")`,
			);
			expect(css).not.toContain('-wght-normal');
		} finally {
			context.destroy();
		}
	},
);
