import { expect, it } from 'vitest';

import {
	generateManifest,
	generateManifestItem,
	pruneManifest,
} from '../src/manifest';

const describe = setupMiniflareIsolatedStorage();

describe('manifest', () => {
	const metadataBase = {
		id: 'roboto',
		weights: [400, 700],
		styles: ['normal', 'italic'],
		subsets: ['latin', 'latin-ext'],
		variable: false,
		unicodeRange: {
			latin: 'U+0000-00FF',
		},
	};

	const metadataSimple = {
		id: 'abel',
		weights: [400, 700],
		styles: ['normal', 'italic'],
		subsets: ['latin'],
		variable: false,
		unicodeRange: {
			latin: 'U+0000-00FF',
		},
	};

	const metadataNumberedSubsets = {
		id: 'noto-sans-jp',
		weights: [400, 700],
		styles: ['normal', 'italic'],
		subsets: ['japanese', 'latin'],
		variable: false,
		unicodeRange: {
			'[0]': 'U+0000-00FF',
			'[1]': 'U+0000-00FF',
		},
	};

	it('should generate valid manifest', async () => {
		const manifest = await generateManifest('roboto@5.0.0', metadataBase);

		expect(manifest).toMatchSnapshot();
	});

	it('should generate a valid manifest with numbered subsets', async () => {
		const manifest = await generateManifest(
			'noto-sans-jp@5.0.1',
			metadataNumberedSubsets,
		);

		expect(manifest).toMatchSnapshot();
	});

	it('should throw if the metadata does not match the id', async () => {
		await expect(
			generateManifest('not-roboto@5.0.0', metadataBase),
		).rejects.toThrowError('Not Found. not-roboto does not exist.');
	});

	it('should generate valid manifest item', async () => {
		const manifestItem = await generateManifestItem(
			'roboto@5.0.0',
			'latin-400-normal.woff2',
			metadataBase,
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

	it('should generate valid manifest item for a numbered subset', async () => {
		const manifestItem = await generateManifestItem(
			'noto-sans-jp@5.0.1',
			'0-400-normal.woff2',
			metadataNumberedSubsets,
		);

		expect(manifestItem).toMatchInlineSnapshot(`
			{
			  "extension": "woff2",
			  "id": "noto-sans-jp",
			  "style": "normal",
			  "subset": "0",
			  "url": "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-0-400-normal.woff2",
			  "variable": false,
			  "version": "5.0.1",
			  "weight": 400,
			}
		`);
	});

	it('should convert ttf to a woff manifest item', async () => {
		const manifestItem = await generateManifestItem(
			'roboto@5.0.0',
			'latin-400-normal.ttf',
			metadataBase,
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

	it('should correctly prune manifest removing existing items', async () => {
		const env = getMiniflareBindings() satisfies Env;

		await env.BUCKET.put('abel@5.0.0/latin-400-normal.woff2', 'test');
		await env.BUCKET.put('abel@5.0.0/latin-400-normal.woff', 'test');
		await env.BUCKET.put('abel@5.0.0/latin-700-italic.woff2', 'test');
		await env.BUCKET.put('abel@5.0.0/latin-700-italic.woff', 'test');
		const list = await env.BUCKET.list();
		expect(list.objects).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ key: 'abel@5.0.0/latin-400-normal.woff2' }),
				expect.objectContaining({ key: 'abel@5.0.0/latin-400-normal.woff' }),
				expect.objectContaining({ key: 'abel@5.0.0/latin-700-italic.woff2' }),
				expect.objectContaining({ key: 'abel@5.0.0/latin-700-italic.woff' }),
			]),
		);

		const manifest = await generateManifest('abel@5.0.0', metadataSimple);
		const prunedManifest = await pruneManifest('abel@5.0.0', manifest, env);
		expect(prunedManifest).toMatchSnapshot();
	});
});
