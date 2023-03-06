import { describe, expect, it } from 'vitest';

import { sassMetadata } from '../../src/sass/metadata';
import { Metadata } from '../../src/types';
import mockSassMetadata from './fixtures/sass-metadata.json';

describe('sass', () => {
	it('should generate sass metadata for non unicode range font successfully', async () => {
		expect(
			sassMetadata(
				mockSassMetadata.carlito.metadata as Metadata,
				mockSassMetadata.carlito.unicode
			)
		).toMatchSnapshot();
	});

	it('should generate sass metadata for numeric subset font successfully', async () => {
		expect(
			sassMetadata(
				mockSassMetadata.notoSansJp.metadata as Metadata,
				mockSassMetadata.notoSansJp.unicode
			)
		).toMatchSnapshot();
	});

	it('should generate sass metadata for variable font successfully', async () => {
		expect(
			sassMetadata(
				mockSassMetadata.recursive.metadata as Metadata,
				mockSassMetadata.recursive.unicode
			)
		).toMatchSnapshot();
	});
});
