import { compileString, NodePackageImporter } from 'sass';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const mixins = fs.readFileSync(
	path.join(__dirname, '../src/mixins.scss'),
	'utf-8',
);

const compileSass = (family: string, params?: string[]) => {
	const metadata = `@use 'pkg:${family}/scss' as font;`;

	const options = ['$metadata: font.$metadata', ...(params ?? [])].join(', ');

	const res = compileString(`${metadata}${mixins}@include faces(${options})`, {
		importers: [new NodePackageImporter()],
	});

	return res.css.toString();
};

describe('sass mixins', () => {
	it('should compile sass for non unicode range font successfully', async () => {
		expect(compileSass('@fontsource/carlito')).toMatchSnapshot();
	});

	it('should compile sass for numeric and non numeric unicode subset font successfully', async () => {
		expect(compileSass('@fontsource/noto-sans-jp')).toMatchSnapshot();
	});

	it('should compile sass for only japanese numeric unicode subsets font successfully', async () => {
		expect(
			compileSass('@fontsource/noto-sans-jp', ['$subsets: japanese']),
		).toMatchSnapshot();
	});

	it('should compile sass for only latin non numeric unicode subset font successfully', async () => {
		expect(
			compileSass('@fontsource/noto-sans-jp', ['$subsets: latin']),
		).toMatchSnapshot();
	});

	it('should compile sass for variable font successfully', async () => {
		expect(
			compileSass('@fontsource-variable/recursive', ['$subsets: latin']),
		).toMatchSnapshot();
	});
});
