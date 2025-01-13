import { compileString, NodePackageImporter } from 'sass';
import { describe, expect, it } from 'vitest';

const compileSass = (path: string) => {
	const res = compileString(`@use ${path};`, {
		importers: [new NodePackageImporter()],
	});

	return res.css.toString();
};

describe('scss imports', () => {
	it('should import with default path', async () => {
		expect(compileSass("'pkg:@fontsource/carlito'")).toMatchSnapshot();
	});

	it('should import with default path and namespace', async () => {
		expect(
			compileSass("'pkg:@fontsource/carlito' as carlito"),
		).toMatchSnapshot();
	});

	it('should import with default css path', async () => {
		expect(
			compileSass("'pkg:@fontsource/carlito/index.css'"),
		).toMatchSnapshot();
	});

	it('should import with default css path and namespace', async () => {
		expect(
			compileSass("'pkg:@fontsource/carlito/index.css' as carlito"),
		).toMatchSnapshot();
	});

	it('should import with weight path and extension', async () => {
		expect(
			compileSass("'pkg:@fontsource/carlito/400.css' as carlito"),
		).toMatchSnapshot();
	});
});
