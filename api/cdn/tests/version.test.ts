import { beforeEach, describe, expect, it } from 'vitest';

import { getVersion } from '../src/version';

describe('version tag from url', () => {
	beforeEach(async () => {
		const fetchMock = getMiniflareFetchMock();
		// Throw when no matching mocked request is found
		fetchMock.disableNetConnect();

		// Handlers
		// We want this to be the default response for all requests
		const origin = fetchMock.get('https://data.jsdelivr.com');
		origin
			.intercept({
				method: 'GET',
				path: '/v1/packages/npm/@fontsource/abel',
			})
			.reply(200, {
				type: 'npm',
				name: '@fontsource/abel',
				versions: [
					{
						version: '1.0.0',
					},
					{
						version: '1.1.0',
					},
					{
						version: '1.1.1',
					},
					{
						version: '2.0.0',
					},
					{
						version: '2.1.0',
					},
				],
			});
	});

	it('should return the latest tag from the url', async () => {
		const version = await getVersion(
			'abel',
			'http://r2.fontsource.org/fonts/abel@latest/latin-400-normal.ttf',
		);

		expect(version).toBe('latest');
	});

	it('should return the major tag from the url', async () => {
		const version = await getVersion(
			'abel',
			'http://r2.fontsource.org/fonts/abel@1/latin-400-normal.ttf',
		);

		expect(version).toBe('1.1.1');
	});

	it('should return the major.minor tag from the url', async () => {
		const version = await getVersion(
			'abel',
			'http://r2.fontsource.org/fonts/abel@1.1/latin-400-normal.ttf',
		);

		expect(version).toBe('1.1.1');
	});

	it('should return the major.minor.patch tag from the url', async () => {
		const version = await getVersion(
			'abel',
			'http://r2.fontsource.org/fonts/abel@1.1.1/latin-400-normal.ttf',
		);

		expect(version).toBe('1.1.1');
	});

	it('should throw on invalid semver format version tag', async () => {
		await expect(
			getVersion(
				'abel',
				'http://r2.fontsource.org/fonts/abel@invalid/latin-400-normal.ttf',
			),
		).rejects.toThrow('Version invalid not found for abel.');
	});

	it('should throw on invalid number version tag', async () => {
		await expect(
			getVersion(
				'abel',
				'http://r2.fontsource.org/fonts/abel@1.2.0/latin-400-normal.ttf',
			),
		).rejects.toThrow('Version 1.2.0 not found for abel.');
	});

	it('should throw on missing version tag', async () => {
		await expect(
			getVersion(
				'abel',
				'http://r2.fontsource.org/fonts/abel/latin-400-normal.ttf',
			),
		).rejects.toThrow('Missing tag for abel.');
	});
});
