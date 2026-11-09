import { beforeEach, expect, it } from 'vitest';
import { PreparedArtifactSchema } from '../shared/prepared-artifacts';
import { packageManifest, packageMetadata } from './fixtures/publication';
import { dispatch, jsonSnapshot, setupWorkerTest, testEnv } from './helpers';

const artifact = 'a'.repeat(64);
const base = '/v1/registry/families/new-math/artifacts/static';
const prefix = `prepared/new-math/static/${artifact}`;
const bytes = new TextEncoder().encode('fixture');
const sha256 = 'b'.repeat(64);
const manifest = PreparedArtifactSchema.parse({
	schemaVersion: 1,
	id: 'new-math',
	kind: 'static',
	artifact,
	profile: 'web-1',
	metadata: packageMetadata,
	manifest: packageManifest,
	files: ['index.css', '400.css', 'files/new-math-full-400-normal.woff2'].map(
		(path) => ({
			path,
			sha256,
			size: bytes.byteLength,
			url: `${base}/${artifact}/${path}`,
		}),
	),
});

beforeEach(setupWorkerTest);

const complete = async () => {
	for (const file of manifest.files)
		await testEnv.FONTS.put(`${prefix}/${file.path}`, bytes, {
			customMetadata: { sha256 },
		});
	await testEnv.FONTS.put(`${prefix}/manifest.json`, JSON.stringify(manifest));
	await testEnv.FONTS.put(
		'prepared/new-math/static/current.json',
		JSON.stringify(artifact),
	);
};

it('serves completed assets without npm and pins a selection across pointer changes', async () => {
	await complete();
	const current = await jsonSnapshot(`https://fontsource.test${base}`);
	expect(current.status).toBe(200);
	expect(current.body).toEqual(manifest);
	await testEnv.FONTS.put(
		'prepared/new-math/static/current.json',
		JSON.stringify('c'.repeat(64)),
	);
	const pinned = await jsonSnapshot(
		`https://fontsource.test${base}?artifact=${artifact}`,
	);
	expect(pinned.body).toEqual(manifest);
	expect(pinned.headers.cacheControl).toBe(
		'public, max-age=31536000, immutable',
	);
	for (const file of manifest.files) {
		const first = await dispatch(`https://fontsource.test${file.url}`);
		expect(first.response.status).toBe(200);
		expect(new Uint8Array(await first.response.arrayBuffer())).toEqual(bytes);
		await first.settle();
		const conditional = await dispatch(
			new Request(`https://fontsource.test${file.url}`, {
				headers: { 'If-None-Match': first.response.headers.get('ETag') ?? '' },
			}),
		);
		expect(conditional.response.status).toBe(304);
		await conditional.settle();
	}
});

it('does not expose orphaned files or accept corrupt completed outputs', async () => {
	await testEnv.FONTS.put(`${prefix}/index.css`, bytes);
	expect(
		(await jsonSnapshot(`https://fontsource.test${base}/${artifact}/index.css`))
			.status,
	).toBe(404);
	await complete();
	await testEnv.FONTS.put(`${prefix}/index.css`, 'corrupted');
	const corrupted = await jsonSnapshot(
		`https://fontsource.test${base}/${artifact}/index.css`,
	);
	expect(corrupted.status).toBe(502);
	expect(corrupted.headers.cacheControl).toBe('no-store');
	await testEnv.FONTS.put(
		`${prefix}/manifest.json`,
		JSON.stringify({ ...manifest, id: 'wrong' }),
	);
	expect((await jsonSnapshot(`https://fontsource.test${base}`)).status).toBe(
		502,
	);
});

it('rejects invalid identities and paths', async () => {
	for (const path of [
		`${base}?artifact=no`,
		`${base}/${artifact}/files/not-a-font.ttf`,
		`${base}/${artifact}/files/%2Fsecret.woff2`,
	])
		expect((await jsonSnapshot(`https://fontsource.test${path}`)).status).toBe(
			400,
		);
});
