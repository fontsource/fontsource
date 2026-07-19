import fs from 'node:fs';
import path from 'node:path';
import { compileString, NodePackageImporter } from 'sass';
import { describe, expect, it } from 'vitest';

const mixins = fs.readFileSync(
	path.join(__dirname, '../src/mixins.scss'),
	'utf-8',
);

const variableMetadata = (
	id: string,
	axes: string,
	defaultAxis: string,
	weights = '(400)',
) => `(
	id: ${id},
	family: 'Test Font',
	subsets: (latin),
	weights: ${weights},
	styles: (normal),
	axes: (${axes}),
	defaults: (weight: 400, style: normal, axis: ${defaultAxis}),
	unicode: (latin: (U+0000-00FF)),
)`;

const standardVariableMetadata = variableMetadata(
	'test-font',
	`
		ital: true,
		wdth: (min: 75, max: 100),
		wght: (min: 300, max: 800),`,
	'wght',
	'(300, 400, 800)',
);

const opticalVariableMetadata = variableMetadata(
	'optical-font',
	'opsz: (min: 16, max: 72)',
	'opsz',
);

const aggregateVariableMetadata = variableMetadata(
	'aggregate-font',
	`
		ital: true,
		opsz: true,
		wdth: (min: 75, max: 100),
		wght: (min: 300, max: 800),`,
	'wght',
	'(300, 400, 800)',
);

const compileSass = (family: string, params?: string[]) => {
	const metadata = `@use 'pkg:${family}/scss' as font;`;

	const options = ['$metadata: font.$metadata', ...(params ?? [])].join(', ');

	const res = compileString(`${metadata}${mixins}@include faces(${options})`, {
		importers: [new NodePackageImporter()],
	});

	return res.css.toString();
};

const compileMetadataSass = (metadata: string, axes: string) =>
	compileString(
		`${mixins}$fixture-metadata: ${metadata};
		@include faces($metadata: $fixture-metadata, $axes: ${axes}, $weights: all)`,
	).css.toString();

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

	it.each(['all', 'full', 'wdth', '(wdth, wght)', 'standard'])(
		'should compile %s axes successfully',
		(axes) => {
			expect(
				compileMetadataSass(standardVariableMetadata, axes),
			).toMatchSnapshot();
		},
	);

	it('should use the default weight for a variable font without wght', () => {
		expect(
			compileMetadataSass(opticalVariableMetadata, 'all'),
		).toMatchSnapshot();
	});

	it('should use the standard bundle for multiple standard axes', () => {
		expect(
			compileMetadataSass(aggregateVariableMetadata, 'all'),
		).toMatchSnapshot();
	});

	it('should keep the full bundle for custom axes', () => {
		expect(
			compileSass('@fontsource-variable/recursive', [
				'$subsets: latin',
				'$axes: all',
			]),
		).toMatchSnapshot();
	});
});
