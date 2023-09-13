import { expect, it } from 'vitest';

import { generateManifest, generateManifestItem } from '../src/util';

const describe = setupMiniflareIsolatedStorage();

describe('utils', () => {
	const metadata = {
		id: 'roboto',
		weights: [400, 700],
		styles: ['normal', 'italic'],
		subsets: ['latin'],
		variable: false,
		unicodeRange: {
			latin: 'U+0000-00FF',
		},
	};

	it('should generate valid manifest', async () => {
		const manifest = await generateManifest('roboto@5.0.0', metadata);

		expect(manifest).toMatchSnapshot();
	});

	it('should throw if the metadata does not match the id', async () => {
		await expect(
			generateManifest('not-roboto@5.0.0', metadata),
		).rejects.toThrowError('Not Found. not-roboto does not exist.');
	});

	it('should generate valid manifest item', async () => {
		const manifestItem = await generateManifestItem(
			'roboto@5.0.0',
			'latin-400-normal.woff2',
			metadata,
		);

		expect(manifestItem).toMatchInlineSnapshot(`
			{
			  "extension": "woff2",
			  "id": "roboto",
			  "style": "normal",
			  "subset": "latin",
			  "url": "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.0/files/roboto-latin-400-normal.woff2",
			  "variable": false,
			  "version": "5.0.0",
			  "weight": 400,
			}
		`);
	});

	it('should convert ttf to a woff manifest item', async () => {
		const manifestItem = await generateManifestItem(
			'roboto@5.0.0',
			'latin-400-normal.ttf',
			metadata,
		);

		expect(manifestItem).toMatchInlineSnapshot(`
			{
			  "extension": "woff",
			  "id": "roboto",
			  "style": "normal",
			  "subset": "latin",
			  "url": "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.0/files/roboto-latin-400-normal.woff",
			  "variable": false,
			  "version": "5.0.0",
			  "weight": 400,
			}
		`);
	});
});
