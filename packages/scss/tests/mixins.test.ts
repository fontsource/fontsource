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
	describe('v6 output manifests', () => {
		const metadata = `(
			id: 'sparse', family: 'Sparse', variable: false,
			faces: (
				(subset: 'latin', weight: 300, style: 'normal', unicodeRange: 'U+41', sliceIndex: 0, sources: ((filename: 'light.woff2', format: 'woff2'),)),
				(subset: 'latin', weight: 700, style: 'normal', unicodeRange: 'U+41', sliceIndex: 0, sources: ((filename: 'bold.woff2', format: 'woff2'),)),
				(subset: 'latin', weight: 700, style: 'italic', unicodeRange: 'U+41', sliceIndex: 0, sources: ((filename: 'bold-italic.woff2', format: 'woff2'),)),
				(subset: 'japanese', weight: 300, style: 'normal', unicodeRange: 'U+3042', sliceIndex: 0, sources: ((filename: 'japanese.woff2', format: 'woff2'),)),
				(subset: 'japanese', weight: 300, style: 'normal', unicodeRange: 'U+3042', sliceIndex: 1, sources: ((filename: 'japanese-1.woff2', format: 'woff2'),)),
			),
			entrypoints: ('index.css': (0, 4)),
		)`;
		const compile = (value: string, options = '') =>
			compileString(`${mixins}@include faces($metadata: ${value}${options});`)
				.css;

		it('uses the default faces and replaces named aggregates with slices', () => {
			expect(compile(metadata)).toMatchSnapshot();
		});

		it('selects only existing variants and actual filenames', () => {
			expect(
				compile(
					metadata,
					', $weights: all, $styles: all, $directory: "/fonts"',
				),
			).toMatchSnapshot();
		});

		it('rejects formats absent from v6 packages', () => {
			expect(() => compile(metadata, ', $formats: woff')).toThrow(
				'v6 font packages contain WOFF2 only',
			);
		});

		it('preserves custom axis casing and unquotes CSS ranges', () => {
			const variable = `(
				id: 'variable', family: 'Example Variable', variable: true,
				faces: (
					(subset: 'full', weight: '300 1000', style: 'normal', unicodeRange: '', sliceIndex: 0, axisKey: 'wght', sources: ((filename: 'weight.woff2', format: 'woff2'),)),
					(subset: 'full', weight: '400', style: 'oblique -15deg 0deg', stretch: '75% 100%', unicodeRange: '', sliceIndex: 0, axisKey: 'CASL', sources: ((filename: 'casual.woff2', format: 'woff2'),)),
				),
				entrypoints: ('index.css': (0,)),
			)`;
			expect(
				compile(variable, ', $axes: CASL, $styles: all'),
			).toMatchSnapshot();
		});
	});

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
