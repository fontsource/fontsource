import { describe, expect, it } from 'vitest';

import { sassMetadata } from '../../src/sass/metadata';
import type { Metadata } from '../../src/types';
import mockSassMetadata from './fixtures/sass-metadata.json';

describe('sass metadata', () => {
	it('should generate sass metadata for non unicode range font successfully', async () => {
		expect(
			sassMetadata(
				mockSassMetadata.carlito.metadata as Metadata,
				mockSassMetadata.carlito.unicode,
				false,
			),
		).toMatchSnapshot();
	});

	it('should generate sass metadata for numeric subset font successfully', async () => {
		expect(
			sassMetadata(
				mockSassMetadata.notoSansJp.metadata as Metadata,
				mockSassMetadata.notoSansJp.unicode,
				false,
			),
		).toMatchSnapshot();
	});

	it('should generate sass metadata for variable font successfully', async () => {
		expect(
			sassMetadata(
				mockSassMetadata.recursive.metadata as Metadata,
				mockSassMetadata.recursive.unicode,
				true,
			),
		).toMatchSnapshot();
	});
});
