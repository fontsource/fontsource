import fs from 'fs-extra';
import * as gfm from 'google-font-metadata';
import stringify from 'json-stringify-pretty-compact';
import { describe, expect, it, vi } from 'vitest';

import {
	download,
	generateLinks,
	pairGenerator,
	variableLinks,
} from '../../src/google/download';
import testData from './fixtures/download-file-data.json';
import APIv1Mock from './fixtures/google-fonts-v1.json';
import APIv2Mock from './fixtures/google-fonts-v2.json';
import APIVariableMock from './fixtures/variable.json';

vi.mock('google-font-metadata');
vi.mock('fs-extra');
vi.mock('got');

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

	describe('download queue', () => {
		it('downloads normal font successfully (abel)', async () => {
			const buildOpts = {
				dir: 'fonts/google/abel',
				tmpDir: 'fonts/google/temp',
				force: false,
				isVariable: false,
			};

			await download('abel', buildOpts);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				'fonts/google/abel/files/file-list.json',
				stringify([
					'./fonts/google/abel/files/abel-latin-400-normal.woff',
					'./fonts/google/abel/files/abel-latin-400-normal.woff2',
					'./fonts/google/abel/files/abel-all-400-normal.woff',
				])
			);
		});

		it('downloads normal font successfully (cabin)', async () => {
			const buildOpts = {
				dir: 'fonts/google/cabin',
				tmpDir: 'fonts/google/temp',
				force: false,
				isVariable: false,
			};

			await download('cabin', buildOpts);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				'fonts/google/cabin/files/file-list.json',
				stringify([
					'./fonts/google/cabin/files/cabin-latin-400-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-400-italic.woff',
					'./fonts/google/cabin/files/cabin-vietnamese-400-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-400-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-400-normal.woff',
					'./fonts/google/cabin/files/cabin-vietnamese-400-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-500-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-500-italic.woff',
					'./fonts/google/cabin/files/cabin-vietnamese-500-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-500-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-500-normal.woff',
					'./fonts/google/cabin/files/cabin-vietnamese-500-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-600-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-600-italic.woff',
					'./fonts/google/cabin/files/cabin-vietnamese-600-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-600-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-600-normal.woff',
					'./fonts/google/cabin/files/cabin-vietnamese-600-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-700-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-700-italic.woff',
					'./fonts/google/cabin/files/cabin-vietnamese-700-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-700-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-700-normal.woff',
					'./fonts/google/cabin/files/cabin-vietnamese-700-normal.woff',
					'./fonts/google/cabin/files/cabin-vietnamese-400-italic.woff2',
					'./fonts/google/cabin/files/cabin-all-400-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-400-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-400-italic.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-400-normal.woff2',
					'./fonts/google/cabin/files/cabin-all-400-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-400-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-400-normal.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-500-italic.woff2',
					'./fonts/google/cabin/files/cabin-all-500-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-500-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-500-italic.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-500-normal.woff2',
					'./fonts/google/cabin/files/cabin-all-500-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-500-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-500-normal.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-600-italic.woff2',
					'./fonts/google/cabin/files/cabin-all-600-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-600-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-600-italic.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-600-normal.woff2',
					'./fonts/google/cabin/files/cabin-all-600-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-600-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-600-normal.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-700-italic.woff2',
					'./fonts/google/cabin/files/cabin-all-700-italic.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-700-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-700-italic.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-700-normal.woff2',
					'./fonts/google/cabin/files/cabin-all-700-normal.woff',
					'./fonts/google/cabin/files/cabin-latin-ext-700-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-700-normal.woff2',
				])
			);
		});

		it('downloads variable font successfully (cabin)', async () => {
			const buildOpts = {
				dir: 'fonts/google/cabin',
				tmpDir: 'fonts/google/temp',
				force: false,
				isVariable: true,
			};

			await download('cabin', buildOpts);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				'fonts/google/cabin/files/file-list.json',
				stringify([
					'./fonts/google/cabin/files/cabin-vietnamese-wdth-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-ext-wdth-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-wdth-normal.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-wdth-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-ext-wdth-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-wdth-italic.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-wght-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-ext-wght-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-wght-normal.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-wght-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-ext-wght-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-wght-italic.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-standard-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-ext-standard-normal.woff2',
					'./fonts/google/cabin/files/cabin-latin-standard-normal.woff2',
					'./fonts/google/cabin/files/cabin-vietnamese-standard-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-ext-standard-italic.woff2',
					'./fonts/google/cabin/files/cabin-latin-standard-italic.woff2',
				])
			);
		});
	});
});
