import { describe, expect, it } from 'vitest';

import { sassMetadata } from '../../src/sass/metadata';
import { Metadata } from '../../src/types';
import mockSassMetadata from './fixtures/sass-metadata.json';

describe('sass', () => {
	it('should generate Noto Sans JP sass metadata successfully', async () => {
		expect(
			sassMetadata(
				mockSassMetadata.notoSansJp.metadata as Metadata,
				mockSassMetadata.notoSansJp.unicode
			)
		).toMatchSnapshot();
	});

	it('should generate Recursive sass metadata successfully', async () => {
		expect(
			sassMetadata(
				mockSassMetadata.recursive.metadata as Metadata,
				mockSassMetadata.recursive.unicode
			)
		).toMatchSnapshot();
	});
});
