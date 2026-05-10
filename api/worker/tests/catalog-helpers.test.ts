import { expect, it } from 'vitest';
import {
	buildFontDetail,
	buildVariableIndex,
} from '../worker/src/features/metadata/catalog-views';
import { staticMetadata, variableMetadata } from './helpers';

it('builds font detail with public metadata fields', () => {
	const detail = buildFontDetail(
		staticMetadata,
		({ id, subset, weight, style, extension }) =>
			`https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/${subset}-${weight}-${style}.${extension}`,
	);

	expect(detail.version).toBe(staticMetadata.version);
	expect(detail.source).toBe(staticMetadata.source);
	expect(detail).toMatchSnapshot();
});

it('builds variable index excluding static fonts', () => {
	const index = buildVariableIndex({
		abel: staticMetadata,
		recursive: variableMetadata,
	});

	expect(index).not.toHaveProperty('abel');
	expect(index).toMatchSnapshot();
});
