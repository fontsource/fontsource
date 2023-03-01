import * as gfm from 'google-font-metadata';
import { describe, expect, it, vi } from 'vitest';

import {
	generateLinks,
	pairGenerator,
	variableLinks,
} from '../../src/google/download';
import testData from './fixtures/download-file-data.json';
import APIv1Mock from './fixtures/google-fonts-v1.json';
import APIv2Mock from './fixtures/google-fonts-v2.json';
import APIVariableMock from './fixtures/variable.json';

vi.mock('google-font-metadata');

describe('download google', () => {
	describe('pair generator', () => {
		it('should generate APIv1 pairs and strip TTF links', () => {
			const { APIv1Variant, APIv1Result } = testData;
			expect(pairGenerator(APIv1Variant)).toEqual(APIv1Result);
		});

		it('should generate APIv2 pairs and strip OTF links', () => {
			const { APIv2Variant, APIv2Result } = testData;
			expect(pairGenerator(APIv2Variant)).toEqual(APIv2Result);
		});

		it('should generate APIVariable pairs', () => {
			const { APIVariableVariant, APIVariableResult } = testData;
			expect(pairGenerator(APIVariableVariant)).toEqual(APIVariableResult);
		});
	});

	describe('download links', () => {
		vi.spyOn(gfm, 'APIv1', 'get').mockReturnValue(APIv1Mock);
		vi.spyOn(gfm, 'APIv2', 'get').mockReturnValue(APIv2Mock);
		vi.spyOn(gfm, 'APIVariable', 'get').mockReturnValue(APIVariableMock);

		it('should generate links for base font (abel)', () => {
			const buildOpts = {
				dir: 'fonts/google/abel',
				tmpDir: 'fonts/google/temp',
				force: false,
				isVariable: false,
			};

			const { links } = testData;
			expect(generateLinks('abel', buildOpts)).toEqual(links.abel);
		});

		it('should generate links for unicode subset font (noto-sans-jp)', () => {
			const buildOpts = {
				dir: 'fonts/google/noto-sans-jp',
				tmpDir: 'fonts/google/temp',
				force: false,
				isVariable: false,
			};

			const { links } = testData;
			expect(generateLinks('noto-sans-jp', buildOpts)).toEqual(
				links['noto-sans-jp']
			);
		});

		it('should generate links for variable fonts (cabin)', () => {
			const buildOpts = {
				dir: 'fonts/google/cabin',
				tmpDir: 'fonts/google/temp',
				force: false,
				isVariable: true,
			};

			const { variableLinksMock } = testData;
			expect(variableLinks('cabin', buildOpts)).toEqual(
				variableLinksMock.cabin
			);
		});
	});
});
