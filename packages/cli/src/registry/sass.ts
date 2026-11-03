import type { FontBuildResult } from '@fontsource-utils/core';

// Quote strings as Sass strings, including interpolation from upstream names.
const quote = (value: string): string =>
	`'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('#{', '\\#{').replaceAll('\n', '\\a ')}'`;

const sass = (value: unknown): string => {
	if (value == null) return 'null';
	if (typeof value === 'string') return quote(value);
	if (typeof value === 'number' || typeof value === 'boolean')
		return String(value);
	if (Array.isArray(value))
		return value.length ? `(${value.map(sass).join(', ')},)` : '()';
	return `(${Object.entries(value)
		.map(([key, item]) => `${quote(key)}: ${sass(item)}`)
		.join(', ')})`;
};

/** Sass uses the same actual faces and default entrypoint as generated CSS. */
export const packageSass = (
	id: string,
	family: string,
	result: FontBuildResult,
	variable: boolean,
) =>
	`$metadata: ${sass({ id, family, variable, faces: result.faces, entrypoints: result.entrypoints })} !default;\n`;
