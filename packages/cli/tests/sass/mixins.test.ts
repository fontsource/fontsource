import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

import { sassMetadata } from '../../src/sass/metadata';
import { sassMixins } from '../../src/sass/mixins';
import type { Metadata } from '../../src/types';
import mockSassMetadata from './fixtures/sass-metadata.json';

const compileSass = (metadata: string) => {
	const metadataMap = `(${metadata
		.replaceAll('$', '')
		.replaceAll(' !default;', ',')})`;

	return compileString(
		sassMixins
			.replace("@use 'metadata';", '')
			.replace('meta.module-variables(metadata) !default', metadataMap) +
			'@include faces()'
	);
};

describe('sass mixins', () => {
	it('should compile sass for non unicode range font successfully', async () => {
		expect(
			compileSass(
				sassMetadata(
					mockSassMetadata.carlito.metadata as Metadata,
					mockSassMetadata.carlito.unicode,
					false
				)
			)
		).toMatchSnapshot();
	});

	it('should compile sass for numeric subset font successfully', async () => {
		expect(
			compileSass(
				sassMetadata(
					mockSassMetadata.notoSansJp.metadata as Metadata,
					mockSassMetadata.notoSansJp.unicode,
					false
				)
			)
		).toMatchSnapshot();
	});

	it('should compile sass for variable font successfully', async () => {
		expect(
			compileSass(
				sassMetadata(
					mockSassMetadata.recursive.metadata as Metadata,
					mockSassMetadata.recursive.unicode,
					true
				)
			)
		).toMatchSnapshot();
	});
});
