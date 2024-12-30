import { compileString, NodePackageImporter } from 'sass';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const sassMixins = fs.readFileSync(
	path.join(__dirname, '../mixins.scss'),
	'utf-8',
);

const compileSass = (family: string, params?: string[]) => {
	const metadata = `@use 'pkg:${family}/scss/metadata';`;
	const mixins = sassMixins.replace('$metadata: null !default;', '');

	const options = [
		'$metadata: meta.module-variables(metadata)',
		...(params ?? []),
	].join(', ');

	return compileString(`${metadata}${mixins}@include faces(${options})`, {
		importers: [new NodePackageImporter()],
	});
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
