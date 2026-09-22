/** Already-serialized CSS values; adapters own quoting and font semantics. */
export type FontFaceDeclaration = readonly [
	property: string,
	value: string | readonly string[],
];

/** Serialize a font-face rule, preserving declaration order and source formatting. */
export const renderFontFaceRule = (
	declarations: readonly FontFaceDeclaration[],
	{ comment, spacer = '\n  ' }: { comment?: string; spacer?: string } = {},
): string => {
	const content = declarations
		.map(([property, value]) => {
			const rendered = Array.isArray(value)
				? value.join(`,${spacer}${' '.repeat(property.length + 2)}`)
				: value;
			return `${spacer}${property}: ${rendered};`;
		})
		.join('');

	return `${comment ? `/* ${comment} */\n` : ''}@font-face {${content}\n}`;
};
