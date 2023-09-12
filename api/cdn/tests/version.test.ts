import { getVersionUrl } from 'common-api/version';
import { describe, expect, it } from 'vitest';

describe('version tag from url', () => {
	it('should return the latest tag from the url', async () => {
		const version = await getVersionUrl(
			'abel',
			'http://r2.fontsource.org/fonts/abel@latest/latin-400-normal.ttf',
		);

		expect(version).toContain('5.0.');
	});

	it('should return the major tag from the url', async () => {
		const version = await getVersionUrl(
			'abel',
			'http://r2.fontsource.org/fonts/abel@5/latin-400-normal.ttf',
		);

		expect(version).toBe('5.0.8');
	});

	it('should return the major.minor tag from the url', async () => {
		const version = await getVersionUrl(
			'abel',
			'http://r2.fontsource.org/fonts/abel@5.0/latin-400-normal.ttf',
		);

		expect(version).toBe('5.0.8');
	});

	it('should return the major.minor.patch tag from the url', async () => {
		const version = await getVersionUrl(
			'abel',
			'http://r2.fontsource.org/fonts/abel@5.0.8/latin-400-normal.ttf',
		);

		expect(version).toBe('5.0.8');
	});

	it('should throw on invalid semver format version tag', async () => {
		await expect(
			getVersionUrl(
				'abel',
				'http://r2.fontsource.org/fonts/abel@invalid/latin-400-normal.ttf',
			),
		).rejects.toThrow('Version invalid not found for abel.');
	});

	it('should throw on invalid number version tag', async () => {
		await expect(
			getVersionUrl(
				'abel',
				'http://r2.fontsource.org/fonts/abel@1.2.0/latin-400-normal.ttf',
			),
		).rejects.toThrow('Version 1.2.0 not found for abel.');
	});

	it('should throw on missing version tag', async () => {
		await expect(
			getVersionUrl(
				'abel',
				'http://r2.fontsource.org/fonts/abel/latin-400-normal.ttf',
			),
		).rejects.toThrow('Missing tag for abel.');
	});
});
